import { BaseScraper, type ScrapedProduct } from "./base.ts";
import type { BrandConfig } from "../config.ts";
import { extractPrice, extractAvailability, findTdsUrl, extractPrintSettings, extractColorFromHtml, extractSpoolSpecs } from "../utils.ts";

export class BigCommerceScraper extends BaseScraper {
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
    let page = 1;

    this.log(`Starting HTML scrape (limit: ${limit})`);

    while (products.length < limit) {
      const url = `${this.config.apiEndpoint}?page=${page}`;
      this.log(`Fetching page ${page}`);

      try {
        const response = await this.fetchWithRetry(url);

        if (!response.ok) {
          this.log(`Page ${page} returned ${response.status}`);
          break;
        }

        const html = await response.text();

        // Try to extract JSON-LD data first
        const jsonLdProducts = this.extractJsonLd(html);
        if (jsonLdProducts.length > 0) {
          for (const p of jsonLdProducts) {
            if (products.length >= limit) break;
            products.push(p);
          }

          // Check for more pages
          if (!this.hasNextPage(html)) {
            this.log(`Last page reached`);
            break;
          }

          page++;
          continue;
        }

        // Fallback to HTML parsing
        const productUrls = this.parseProductList(html);
        if (productUrls.length === 0) {
          this.log(`No products found on page ${page}`);
          break;
        }

        for (const productUrl of productUrls) {
          if (products.length >= limit) break;

          const product = await this.scrapeProduct(productUrl);
          if (product) {
            products.push(product);
          }
        }

        if (!this.hasNextPage(html)) {
          this.log(`Last page reached`);
          break;
        }

        page++;
      } catch (error) {
        this.logError(`Error on page ${page}:`, error);
        break;
      }
    }

    this.log(`Scraped ${products.length} products`);
    return products;
  }

  private extractJsonLd(html: string): ScrapedProduct[] {
    const products: ScrapedProduct[] = [];
    const jsonLdPattern = /<script type="application\/ld\+json">([\s\S]*?)<\/script>/g;

    let match;
    while ((match = jsonLdPattern.exec(html)) !== null) {
      try {
        const data = JSON.parse(match[1]);

        // Handle ItemList
        if (data["@type"] === "ItemList" && data.itemListElement) {
          for (const item of data.itemListElement) {
            const product = item.item || item;
            if (product["@type"] === "Product") {
              const scraped = this.parseJsonLdProduct(product, html);
              if (scraped) products.push(scraped);
            }
          }
        }

        // Handle single Product
        if (data["@type"] === "Product") {
          const scraped = this.parseJsonLdProduct(data, html);
          if (scraped) products.push(scraped);
        }
      } catch {
        // Invalid JSON, skip
      }
    }

    return products;
  }

  private parseJsonLdProduct(data: any, html: string): ScrapedProduct | null {
    if (!data.name) return null;

    const offer = Array.isArray(data.offers) ? data.offers[0] : data.offers;
    const price = offer?.price ? this.parsePrice(offer.price) : null;
    const description = data.description || "";

    // Extract enhanced data
    const tdsUrl = findTdsUrl(html);
    const printSettings = extractPrintSettings(description);
    const colorInfo = extractColorFromHtml(html, null, null, data.name);
    const spoolSpecs = extractSpoolSpecs(description, data.name);

    return {
      productId: data.sku || data.productID || data.url?.split("/").pop() || "",
      sku: data.sku || null,
      title: data.name,
      price: price ? this.convertToUSD(price) : null,
      compareAtPrice: null,
      available: offer?.availability !== "OutOfStock",
      currency: "USD",
      url: data.url || "",
      scrapedAt: new Date(),
      source: `bigcommerce-${this.config.vendor.toLowerCase()}`,
      imageUrl: data.image || null,
      barcode: data.gtin || data.gtin13 || data.gtin12 || null,
      description,
      // Enhanced fields
      mpn: data.mpn || data.sku || null,
      tdsUrl,
      colorHex: colorInfo?.hex || null,
      colorName: colorInfo?.name || null,
      nozzleTempMin: printSettings?.nozzleTempMin || null,
      nozzleTempMax: printSettings?.nozzleTempMax || null,
      bedTempMin: printSettings?.bedTempMin || null,
      bedTempMax: printSettings?.bedTempMax || null,
      spoolMaterial: spoolSpecs?.material || null,
      netWeightG: spoolSpecs?.weightG || null,
      diameterMm: spoolSpecs?.diameterMm || null,
      spoolOuterDiameterMm: spoolSpecs?.outerDiameterMm || null,
      spoolWidthMm: spoolSpecs?.widthMm || null,
    };
  }

  private parseProductList(html: string): string[] {
    const urls: string[] = [];

    // BigCommerce product card patterns
    const patterns = [
      /data-product-url="([^"]+)"/g,
      /href="([^"]*\/filament\/[^"]+)"/g,
      /<a[^>]+href="([^"]+)"[^>]*class="[^"]*card-figure__link[^"]*"/g,
    ];

    for (const pattern of patterns) {
      let match;
      while ((match = pattern.exec(html)) !== null) {
        const url = match[1];
        if (!urls.includes(url) && this.isFilamentUrl(url)) {
          const fullUrl = url.startsWith("http") ? url : `${this.config.baseUrl}${url}`;
          urls.push(fullUrl);
        }
      }
    }

    return urls;
  }

  private parseProductPage(html: string, url: string): ScrapedProduct | null {
    // Try JSON-LD first
    const jsonLdProducts = this.extractJsonLd(html);
    if (jsonLdProducts.length > 0) {
      const product = jsonLdProducts[0];
      product.url = url;
      return product;
    }

    // Fallback to HTML parsing
    const titleMatch = html.match(/<h1[^>]*class="[^"]*productView-title[^"]*"[^>]*>([^<]+)</i) ||
                       html.match(/<h1[^>]*>([^<]+)</);
    const title = titleMatch ? titleMatch[1].trim() : "";

    if (!title) {
      this.log(`Could not extract title from ${url}`);
      return null;
    }

    const price = extractPrice(html);
    const available = extractAvailability(html);

    // Extract SKU
    const skuMatch = html.match(/data-product-sku="([^"]+)"/) ||
                     html.match(/SKU[:\s]+([A-Z0-9-]+)/i);
    const sku = skuMatch ? skuMatch[1] : null;

    // Extract product ID
    const idMatch = html.match(/data-product-id="(\d+)"/) ||
                    html.match(/product[_-]id[:\s"]+(\d+)/i);
    const productId = idMatch ? idMatch[1] : this.extractIdFromUrl(url);

    // Extract image
    const imageMatch = html.match(/class="[^"]*productView-image--default[^"]*"[^>]*src="([^"]+)"/) ||
                       html.match(/<meta[^>]*property="og:image"[^>]*content="([^"]+)"/) ||
                       html.match(/data-image-gallery-new-image-url="([^"]+)"/);
    const imageUrl = imageMatch ? imageMatch[1] : null;

    // Extract enhanced data
    const tdsUrl = findTdsUrl(html);
    const printSettings = extractPrintSettings(html);
    const colorInfo = extractColorFromHtml(html, null, null, title);
    const spoolSpecs = extractSpoolSpecs(html, title);

    return {
      productId,
      sku,
      title,
      price: price ? this.convertToUSD(price) : null,
      compareAtPrice: null,
      available,
      currency: "USD",
      url,
      scrapedAt: new Date(),
      source: `bigcommerce-${this.config.vendor.toLowerCase()}`,
      imageUrl,
      barcode: null,
      description: null,
      // Enhanced fields
      mpn: sku,
      tdsUrl,
      colorHex: colorInfo?.hex || null,
      colorName: colorInfo?.name || null,
      nozzleTempMin: printSettings?.nozzleTempMin || null,
      nozzleTempMax: printSettings?.nozzleTempMax || null,
      bedTempMin: printSettings?.bedTempMin || null,
      bedTempMax: printSettings?.bedTempMax || null,
      spoolMaterial: spoolSpecs?.material || null,
      netWeightG: spoolSpecs?.weightG || null,
      diameterMm: spoolSpecs?.diameterMm || null,
      spoolOuterDiameterMm: spoolSpecs?.outerDiameterMm || null,
      spoolWidthMm: spoolSpecs?.widthMm || null,
    };
  }

  private extractIdFromUrl(url: string): string {
    const match = url.match(/\/([^/?]+)\/?(?:\?|$)/);
    return match ? match[1] : url;
  }

  private isFilamentUrl(url: string): boolean {
    const lower = url.toLowerCase();
    const keywords = ["pla", "petg", "abs", "asa", "tpu", "nylon", "pc-", "peek", "filament", "3dxtech"];
    return keywords.some((kw) => lower.includes(kw));
  }

  private hasNextPage(html: string): boolean {
    return (
      html.includes('rel="next"') ||
      html.includes("pagination-item--next") ||
      /page=\d+[^"]*"[^>]*>(?:Next|›)/i.test(html)
    );
  }
}
