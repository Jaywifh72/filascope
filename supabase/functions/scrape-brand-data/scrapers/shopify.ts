import { BaseScraper, type ScrapedProduct } from "./base.ts";
import type { BrandConfig } from "../config.ts";

interface ShopifyProduct {
  id: number;
  title: string;
  handle: string;
  vendor: string;
  product_type: string;
  variants: ShopifyVariant[];
  images: { src: string }[];
}

interface ShopifyVariant {
  id: number;
  title: string;
  sku: string;
  price: string;
  compare_at_price: string | null;
  available: boolean;
  barcode: string | null;
}

interface ShopifyProductsResponse {
  products: ShopifyProduct[];
}

export class ShopifyScraper extends BaseScraper {
  constructor(config: BrandConfig) {
    super(config);
  }

  async scrapeProduct(url: string): Promise<ScrapedProduct | null> {
    try {
      // Convert product URL to JSON endpoint
      const jsonUrl = url.replace(/\/?$/, ".json");
      const response = await this.fetchWithRetry(jsonUrl, {
        headers: { Accept: "application/json" },
      });

      if (!response.ok) {
        this.log(`Product not found: ${url}`);
        return null;
      }

      const data = await response.json();
      const product: ShopifyProduct = data.product;

      if (!product) return null;

      // Get the best variant (prefer 1.75mm, largest weight)
      const variant = this.selectBestVariant(product.variants);
      if (!variant) return null;

      const price = this.parsePrice(variant.price);
      const compareAtPrice = this.parsePrice(variant.compare_at_price);

      return {
        productId: String(product.id),
        sku: variant.sku || null,
        title: product.title,
        price: price ? this.convertToUSD(price) : null,
        compareAtPrice: compareAtPrice ? this.convertToUSD(compareAtPrice) : null,
        available: variant.available,
        currency: "USD",
        url,
        scrapedAt: new Date(),
        source: `shopify-${this.config.vendor.toLowerCase()}`,
      };
    } catch (error) {
      this.logError(`Error scraping ${url}:`, error);
      return null;
    }
  }

  async scrapeAllProducts(limit: number = 250): Promise<ScrapedProduct[]> {
    const products: ScrapedProduct[] = [];
    let page = 1;
    const perPage = Math.min(this.config.productsPerPage, 250);

    this.log(`Starting scrape (limit: ${limit})`);

    // Use collection endpoint if collectionHandle is specified, otherwise use all products
    const collectionHandle = (this.config as any).collectionHandle;
    const baseEndpoint = collectionHandle 
      ? `${this.config.baseUrl}/collections/${collectionHandle}/products.json`
      : `${this.config.baseUrl}/products.json`;
    
    this.log(`Using endpoint: ${baseEndpoint}`);

    while (products.length < limit) {
      const url = `${baseEndpoint}?limit=${perPage}&page=${page}`;
      this.log(`Fetching page ${page}: ${url}`);

      try {
        const response = await this.fetchWithRetry(url, {
          headers: { Accept: "application/json" },
        });

        if (!response.ok) {
          this.log(`Page ${page} returned ${response.status}`);
          break;
        }

        const data: ShopifyProductsResponse = await response.json();

        if (!data.products || data.products.length === 0) {
          this.log(`No more products found on page ${page}`);
          break;
        }

        this.log(`Found ${data.products.length} products on page ${page}`);

        for (const product of data.products) {
          // Only filter if we're NOT using a collection (collection already filtered)
          if (!collectionHandle && !this.isFilamentProduct(product)) {
            continue;
          }

          const variant = this.selectBestVariant(product.variants);
          if (!variant) continue;

          const price = this.parsePrice(variant.price);
          const compareAtPrice = this.parsePrice(variant.compare_at_price);

          products.push({
            productId: String(product.id),
            sku: variant.sku || null,
            title: product.title,
            price: price ? this.convertToUSD(price) : null,
            compareAtPrice: compareAtPrice ? this.convertToUSD(compareAtPrice) : null,
            available: variant.available,
            currency: "USD",
            url: `${this.config.baseUrl}/products/${product.handle}`,
            scrapedAt: new Date(),
            source: `shopify-${this.config.vendor.toLowerCase()}`,
          });

          if (products.length >= limit) break;
        }

        if (data.products.length < perPage) {
          this.log(`Last page reached (${data.products.length} products)`);
          break;
        }

        page++;
      } catch (error) {
        this.logError(`Error fetching page ${page}:`, error);
        break;
      }
    }

    this.log(`Scraped ${products.length} products`);
    return products;
  }

  private selectBestVariant(variants: ShopifyVariant[]): ShopifyVariant | null {
    if (!variants || variants.length === 0) return null;
    if (variants.length === 1) return variants[0];

    // Prefer 1.75mm variants
    const filtered = variants.filter((v) => {
      const title = v.title.toLowerCase();
      return title.includes("1.75") || !title.includes("2.85");
    });

    const toCheck = filtered.length > 0 ? filtered : variants;

    // Prefer available variants, then highest price (usually larger spool)
    const sorted = toCheck.sort((a, b) => {
      if (a.available !== b.available) {
        return a.available ? -1 : 1;
      }
      return parseFloat(b.price) - parseFloat(a.price);
    });

    return sorted[0];
  }

  private isFilamentProduct(product: ShopifyProduct): boolean {
    const title = product.title.toLowerCase();
    const type = (product.product_type || "").toLowerCase();

    // Include filament products
    const filamentKeywords = ["pla", "petg", "abs", "asa", "tpu", "nylon", "pc ", "peek", "filament"];
    const isFilament = filamentKeywords.some((kw) => title.includes(kw) || type.includes(kw));

    // Exclude non-filament items
    const excludeKeywords = ["nozzle", "bed", "sheet", "tool", "kit", "sample", "bundle pack"];
    const isExcluded = excludeKeywords.some((kw) => title.includes(kw));

    return isFilament && !isExcluded;
  }
}
