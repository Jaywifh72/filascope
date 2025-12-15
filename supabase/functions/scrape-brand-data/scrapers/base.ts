import type { BrandConfig } from "../config.ts";
import { sleep, retryWithBackoff, DEFAULT_USER_AGENT } from "../utils.ts";

export interface ScrapedProduct {
  productId: string;
  sku: string | null;
  title: string;
  price: number | null;
  compareAtPrice: number | null;
  available: boolean;
  currency: string;
  url: string;
  scrapedAt: Date;
  source: string;
  // Enhanced fields for comprehensive data capture
  imageUrl: string | null;
  barcode: string | null;
  description: string | null;
}

export abstract class BaseScraper {
  protected config: BrandConfig;
  protected lastRequestTime: number = 0;

  constructor(config: BrandConfig) {
    this.config = config;
  }

  abstract scrapeProduct(url: string): Promise<ScrapedProduct | null>;
  abstract scrapeAllProducts(limit?: number): Promise<ScrapedProduct[]>;

  protected async fetchWithRetry(
    url: string,
    options: RequestInit = {}
  ): Promise<Response> {
    await this.respectRateLimit();

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.config.timeout);

    const fetchOptions: RequestInit = {
      ...options,
      signal: controller.signal,
      headers: {
        "User-Agent": this.config.userAgent || DEFAULT_USER_AGENT,
        Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.5",
        ...options.headers,
      },
    };

    try {
      const response = await retryWithBackoff(
        async () => {
          const res = await fetch(url, fetchOptions);
          if (!res.ok && res.status !== 404) {
            throw new Error(`HTTP ${res.status}: ${res.statusText}`);
          }
          return res;
        },
        3,
        1000
      );

      this.lastRequestTime = Date.now();
      return response;
    } finally {
      clearTimeout(timeoutId);
    }
  }

  protected async respectRateLimit(): Promise<void> {
    const elapsed = Date.now() - this.lastRequestTime;
    const remaining = this.config.requestDelay - elapsed;

    if (remaining > 0) {
      await sleep(remaining);
    }
  }

  protected parsePrice(text: string | number | null | undefined): number | null {
    if (text === null || text === undefined) return null;

    if (typeof text === "number") {
      return isNaN(text) ? null : text;
    }

    const cleaned = text.replace(/[^0-9.,]/g, "").replace(",", ".");
    const price = parseFloat(cleaned);

    if (isNaN(price) || price <= 0 || price > 10000) {
      return null;
    }

    return Math.round(price * 100) / 100;
  }

  protected convertToUSD(price: number): number {
    return Math.round(price * this.config.exchangeRate * 100) / 100;
  }

  protected log(message: string): void {
    console.log(`[${this.config.vendor}] ${message}`);
  }

  protected logError(message: string, error?: unknown): void {
    console.error(`[${this.config.vendor}] ${message}`, error);
  }
}
