import { BaseScraper, type ScrapedProduct } from "./base.ts";
import type { BrandConfig } from "../config.ts";
import { extractPrice, extractAvailability } from "../utils.ts";

interface WooCommerceProduct {
  id: number;
  name: string;
  slug: string;
  permalink: string;
  sku: string;
  prices: {
    price: string;
    regular_price: string;
    sale_price: string;
    currency_code: string;
  };
  is_in_stock: boolean;
  is_purchasable: boolean;
}

interface WooCommerceResponse {
  products?: WooCommerceProduct[];
}

export class WooCommerceScraper extends BaseScraper {
  constructor(config: BrandConfig) {
    super(config);
  }

  async scrapeProduct(url: string): Promise<ScrapedProduct | null> {
    try {
      const response = await this.fetchWithRetry(url);
      if (!response.ok) {
        this.log(`Product not found: ${url}`);
        return null;
      }

      const html = await response.text();
      return this.parseProductPage(html, url);
    } catch (error) {
      this.logError(`Error scraping ${url}:`, error);
      return null;
    }
  }

  async scrapeAllProducts(limit: number = 100): Promise<ScrapedProduct[]> {
    const products: ScrapedProduct[] = [];

    // Try WooCommerce Store API first
    try {
      const apiProducts = await this.scrapeViaApi(limit);
      if (apiProducts.length > 0) {
        return apiProducts;
      }
    } catch (error) {
      this.log(`API scrape failed, falling back to HTML: ${error}`);
    }

    // Fallback to HTML scraping
    return this.scrapeViaHtml(limit);
  }

  private async scrapeViaApi(limit: number): Promise<ScrapedProduct[]> {
    const products: ScrapedProduct[] = [];
    let page = 1;
    const perPage = Math.min(this.config.productsPerPage, 100);

    this.log(`Trying WooCommerce Store API`);

    while (products.length < limit) {
      const url = `${this.config.apiEndpoint}?per_page=${perPage}&page=${page}&category=filament`;
      this.log(`Fetching API page ${page}`);

      try {
        const response = await this.fetchWithRetry(url, {
          headers: { Accept: "application/json" },
        });

        if (!response.ok) {
          this.log(`API returned ${response.status}`);
          break;
        }

        const data: WooCommerceProduct[] = await response.json();

        if (!Array.isArray(data) || data.length === 0) {
          this.log(`No more products on page ${page}`);
          break;
        }

        for (const product of data) {
          const price = this.parsePrice(product.prices?.price);
          const regularPrice = this.parsePrice(product.prices?.regular_price);

          products.push({
            productId: String(product.id),
            sku: product.sku || null,
            title: product.name,
            price: price ? this.convertToUSD(price / 100) : null, // WC prices in cents
            compareAtPrice: regularPrice ? this.convertToUSD(regularPrice / 100) : null,
            available: product.is_in_stock && product.is_purchasable,
            currency: "USD",
            url: product.permalink,
            scrapedAt: new Date(),
            source: `woocommerce-${this.config.vendor.toLowerCase()}`,
          });

          if (products.length >= limit) break;
        }

        if (data.length < perPage) break;
        page++;
      } catch (error) {
        this.logError(`API error on page ${page}:`, error);
        break;
      }
    }

    this.log(`API scraped ${products.length} products`);
    return products;
  }

  private async scrapeViaHtml(limit: number): Promise<ScrapedProduct[]> {
    const products: ScrapedProduct[] = [];
    let page = 1;

    this.log(`Scraping via HTML`);

    while (products.length < limit) {
      const url = `${this.config.baseUrl}/shop/page/${page}/`;
      this.log(`Fetching HTML page ${page}`);

      try {
        const response = await this.fetchWithRetry(url);

        if (!response.ok) {
          this.log(`Page ${page} returned ${response.status}`);
          break;
        }

        const html = await response.text();
        const pageProducts = this.parseProductList(html);

        if (pageProducts.length === 0) {
          this.log(`No products found on page ${page}`);
          break;
        }

        // Fetch individual product pages for detailed data
        for (const productUrl of pageProducts) {
          if (products.length >= limit) break;

          const product = await this.scrapeProduct(productUrl);
          if (product) {
            products.push(product);
          }
        }

        page++;
      } catch (error) {
        this.logError(`HTML error on page ${page}:`, error);
        break;
      }
    }

    this.log(`HTML scraped ${products.length} products`);
    return products;
  }

  private parseProductList(html: string): string[] {
    const urls: string[] = [];

    // Match product links from WooCommerce shop page
    const linkPattern = /href="([^"]*\/product\/[^"]+)"/g;
    let match;

    while ((match = linkPattern.exec(html)) !== null) {
      const url = match[1];
      if (!urls.includes(url) && this.isFilamentUrl(url)) {
        urls.push(url);
      }
    }

    return urls;
  }

  private parseProductPage(html: string, url: string): ScrapedProduct | null {
    // Extract product ID
    const idMatch = html.match(/data-product_id="(\d+)"/);
    const productId = idMatch ? idMatch[1] : this.extractIdFromUrl(url);

    // Extract title
    const titleMatch = html.match(/<h1[^>]*class="[^"]*product_title[^"]*"[^>]*>([^<]+)</i);
    const title = titleMatch ? titleMatch[1].trim() : "";

    if (!title) {
      this.log(`Could not extract title from ${url}`);
      return null;
    }

    // Extract price
    const price = extractPrice(html);
    const available = extractAvailability(html);

    // Extract SKU
    const skuMatch = html.match(/sku[:\s]+([A-Z0-9-]+)/i);
    const sku = skuMatch ? skuMatch[1] : null;

    // Extract compare-at price (sale price)
    const compareMatch = html.match(/<del[^>]*>.*?\$([\d.,]+).*?<\/del>/s);
    const compareAtPrice = compareMatch ? this.parsePrice(compareMatch[1]) : null;

    return {
      productId,
      sku,
      title,
      price: price ? this.convertToUSD(price) : null,
      compareAtPrice: compareAtPrice ? this.convertToUSD(compareAtPrice) : null,
      available,
      currency: "USD",
      url,
      scrapedAt: new Date(),
      source: `woocommerce-${this.config.vendor.toLowerCase()}`,
    };
  }

  private extractIdFromUrl(url: string): string {
    const match = url.match(/\/product\/([^/?]+)/);
    return match ? match[1] : url;
  }

  private isFilamentUrl(url: string): boolean {
    const lower = url.toLowerCase();
    return (
      lower.includes("pla") ||
      lower.includes("petg") ||
      lower.includes("abs") ||
      lower.includes("tpu") ||
      lower.includes("filament")
    );
  }
}
