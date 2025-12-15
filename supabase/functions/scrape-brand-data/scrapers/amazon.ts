import { BaseScraper, type ScrapedProduct } from "./base.ts";
import type { BrandConfig } from "../config.ts";
import { extractPrice, extractAvailability, extractColorFromHtml, extractSpoolSpecs } from "../utils.ts";

export class AmazonScraper extends BaseScraper {
  private firecrawlApiKey: string | undefined;
  
  // Global rate limiting for ALL Amazon scrapers (1.1s between requests)
  private static lastAmazonRequest: number = 0;
  private static readonly AMAZON_RATE_LIMIT_MS = 1100;

  constructor(config: BrandConfig) {
    super(config);
    this.firecrawlApiKey = Deno.env.get("FIRECRAWL_API_KEY");
  }

  private async respectGlobalRateLimit(): Promise<void> {
    const now = Date.now();
    const timeSinceLastRequest = now - AmazonScraper.lastAmazonRequest;
    
    if (timeSinceLastRequest < AmazonScraper.AMAZON_RATE_LIMIT_MS) {
      const waitTime = AmazonScraper.AMAZON_RATE_LIMIT_MS - timeSinceLastRequest;
      this.log(`Rate limiting: waiting ${waitTime}ms before next Amazon request`);
      await new Promise(resolve => setTimeout(resolve, waitTime));
    }
    
    AmazonScraper.lastAmazonRequest = Date.now();
  }

  async scrapeProduct(url: string): Promise<ScrapedProduct | null> {
    if (!this.firecrawlApiKey) {
      this.logError("FIRECRAWL_API_KEY not configured - cannot scrape Amazon");
      return null;
    }

    try {
      // Enforce global rate limit before making request
      await this.respectGlobalRateLimit();
      
      this.log(`Scraping via Firecrawl: ${url}`);

      const response = await fetch("https://api.firecrawl.dev/v1/scrape", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${this.firecrawlApiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          url,
          formats: ["markdown", "html"],
          onlyMainContent: true,
          waitFor: 2000,
        }),
      });

      if (!response.ok) {
        const error = await response.text();
        this.logError(`Firecrawl error: ${response.status} - ${error}`);
        return null;
      }

      const data = await response.json();

      if (!data.success) {
        this.logError(`Firecrawl failed: ${data.error}`);
        return null;
      }

      return this.parseFirecrawlResponse(data, url);
    } catch (error) {
      this.logError(`Error scraping ${url}:`, error);
      return null;
    }
  }

  async scrapeAllProducts(limit: number = 50): Promise<ScrapedProduct[]> {
    // Amazon doesn't have a simple product listing API
    // We need to rely on product URLs stored in the database
    // For now, return empty and let the caller provide URLs

    this.log(`Amazon scraper requires specific product URLs`);
    this.log(`Use scrapeProduct() with individual Amazon URLs`);

    // Could implement search-based scraping in the future
    return [];
  }

  private parseFirecrawlResponse(data: any, url: string): ScrapedProduct | null {
    const content = data.data || data;
    const html = content.html || "";
    const markdown = content.markdown || "";
    const metadata = content.metadata || {};

    // Extract title
    const title = metadata.title?.replace(/ - Amazon.*$/, "").trim() ||
                  this.extractFromMarkdown(markdown, /^#\s+(.+)$/m) ||
                  "";

    if (!title) {
      this.log(`Could not extract title from ${url}`);
      return null;
    }

    // Extract price from HTML
    let price = this.extractAmazonPrice(html);
    if (!price) {
      price = extractPrice(markdown);
    }

    // Extract availability
    const available = this.extractAmazonAvailability(html, markdown);

    // Extract ASIN from URL
    const asinMatch = url.match(/\/dp\/([A-Z0-9]{10})/i) ||
                      url.match(/\/product\/([A-Z0-9]{10})/i);
    const asin = asinMatch ? asinMatch[1] : this.extractIdFromUrl(url);

    // Extract image
    const imageUrl = this.extractAmazonImage(html, metadata);

    // Extract enhanced data
    const colorInfo = extractColorFromHtml(html, null, null, title);
    const spoolSpecs = extractSpoolSpecs(markdown, title);

    return {
      productId: asin,
      sku: asin,
      title,
      price: price ? this.convertToUSD(price) : null,
      compareAtPrice: null,
      available,
      currency: "USD",
      url,
      scrapedAt: new Date(),
      source: `amazon-${this.config.vendor.toLowerCase()}`,
      imageUrl,
      barcode: null, // Amazon doesn't expose barcodes
      description: markdown?.substring(0, 2000) || null,
      // Enhanced fields
      mpn: null, // Amazon doesn't typically expose MPN
      tdsUrl: null, // Amazon listings don't have TDS links
      colorHex: colorInfo?.hex || null,
      colorName: colorInfo?.name || null,
      nozzleTempMin: null, // Rarely in Amazon listings
      nozzleTempMax: null,
      bedTempMin: null,
      bedTempMax: null,
      spoolMaterial: spoolSpecs?.material || null,
      netWeightG: spoolSpecs?.weightG || null,
      diameterMm: spoolSpecs?.diameterMm || null,
      spoolOuterDiameterMm: spoolSpecs?.outerDiameterMm || null,
      spoolWidthMm: spoolSpecs?.widthMm || null,
    };
  }

  private extractAmazonPrice(html: string): number | null {
    // Amazon price patterns
    const patterns = [
      /class="[^"]*a-price-whole[^"]*">(\d+)<.*?a-price-fraction[^"]*">(\d+)/s,
      /id="priceblock_ourprice"[^>]*>\$?([\d.,]+)/,
      /id="priceblock_dealprice"[^>]*>\$?([\d.,]+)/,
      /class="[^"]*apexPriceToPay[^"]*"[^>]*>.*?\$?([\d.,]+)/s,
      /"price":\s*"?\$?([\d.,]+)"?/,
      /\$(\d+\.\d{2})/,
    ];

    for (const pattern of patterns) {
      const match = html.match(pattern);
      if (match) {
        if (match[2]) {
          // Whole and fraction parts
          return parseFloat(`${match[1]}.${match[2]}`);
        }
        const price = parseFloat(match[1].replace(/,/g, ""));
        if (!isNaN(price) && price > 0 && price < 1000) {
          return price;
        }
      }
    }

    return null;
  }

  private extractAmazonAvailability(html: string, markdown: string): boolean {
    const combined = html + markdown;

    const outOfStockPatterns = [
      /currently unavailable/i,
      /out of stock/i,
      /we don't know when or if this item will be back/i,
      /"availability":\s*"OutOfStock"/,
    ];

    for (const pattern of outOfStockPatterns) {
      if (pattern.test(combined)) {
        return false;
      }
    }

    const inStockPatterns = [
      /in stock/i,
      /add to cart/i,
      /"availability":\s*"InStock"/,
      /ships from.*amazon/i,
    ];

    for (const pattern of inStockPatterns) {
      if (pattern.test(combined)) {
        return true;
      }
    }

    return true; // Default to available
  }

  private extractAmazonImage(html: string, metadata: any): string | null {
    // Try metadata OG image first
    if (metadata?.ogImage?.[0]?.url) {
      return metadata.ogImage[0].url;
    }
    
    // Try main product image patterns
    const patterns = [
      /id="landingImage"[^>]*src="([^"]+)"/,
      /id="imgBlkFront"[^>]*src="([^"]+)"/,
      /class="[^"]*a-dynamic-image[^"]*"[^>]*src="([^"]+)"/,
      /"hiRes":"([^"]+)"/,
      /"large":"([^"]+)"/,
    ];

    for (const pattern of patterns) {
      const match = html.match(pattern);
      if (match && match[1]) {
        return match[1];
      }
    }

    return null;
  }

  private extractFromMarkdown(markdown: string, pattern: RegExp): string | null {
    const match = markdown.match(pattern);
    return match ? match[1].trim() : null;
  }

  private extractIdFromUrl(url: string): string {
    const match = url.match(/\/dp\/([A-Z0-9]+)/i) ||
                  url.match(/\/([A-Z0-9]+)\/?(?:\?|$)/);
    return match ? match[1] : url;
  }
}
