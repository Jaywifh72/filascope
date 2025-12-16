import { BaseScraper, type ScrapedProduct } from "./base.ts";
import type { BrandConfig } from "../config.ts";
import { extractPrice, extractAvailability, extractColorFromHtml, extractSpoolSpecs, detectMaterial, extractColor, extractWeight, extractDiameter } from "../utils.ts";

interface AmazonSearchResult {
  title: string;
  link: string;
  price?: string;
  asin?: string;
  thumbnail?: string;
}

export class AmazonScraper extends BaseScraper {
  private firecrawlApiKey: string | undefined;
  private serpApiKey: string | undefined;
  private scrapingDogApiKey: string | undefined;
  
  // Global rate limiting for ALL Amazon scrapers (1.1s between requests)
  private static lastAmazonRequest: number = 0;
  private static readonly AMAZON_RATE_LIMIT_MS = 1100;

  constructor(config: BrandConfig) {
    super(config);
    this.firecrawlApiKey = Deno.env.get("FIRECRAWL_API_KEY");
    this.serpApiKey = Deno.env.get("SERPAPI_KEY");
    this.scrapingDogApiKey = Deno.env.get("SCRAPINGDOG_API_KEY");
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

  // Main method to scrape all products - now supports Amazon store discovery
  async scrapeAllProducts(limit: number = 50): Promise<ScrapedProduct[]> {
    const vendor = this.config.vendor;
    const amazonStoreUrl = this.config.amazonStoreUrl;
    
    // If we have an Amazon store URL, discover products from there
    if (amazonStoreUrl) {
      this.log(`Discovering products from Amazon store: ${amazonStoreUrl}`);
      return this.scrapeAmazonStore(vendor, amazonStoreUrl, limit);
    }

    // Fallback: search for brand products on Amazon
    this.log(`No Amazon store URL - searching Amazon for "${vendor} filament"`);
    return this.searchAmazonForBrand(vendor, limit);
  }

  // Discover and scrape products from an Amazon store page
  private async scrapeAmazonStore(vendor: string, storeUrl: string, limit: number): Promise<ScrapedProduct[]> {
    const products: ScrapedProduct[] = [];
    const seenAsins = new Set<string>();
    
    try {
      // Step 1: Extract ASINs directly from the store page
      this.log(`Step 1: Extracting ASINs from store page: ${storeUrl}`);
      const storeAsins = await this.extractAsinsFromStorePage(storeUrl);
      this.log(`Found ${storeAsins.length} ASINs on store page`);
      
      // Step 2: Get full product details for each ASIN using ScrapingDog Product API
      if (storeAsins.length > 0) {
        this.log(`Step 2: Fetching product details for ${storeAsins.length} ASINs`);
        
        for (const asin of storeAsins) {
          if (products.length >= limit) break;
          if (seenAsins.has(asin)) continue;
          seenAsins.add(asin);
          
          try {
            const productData = await this.getProductByAsin(asin);
            
            if (!productData) {
              this.log(`Could not fetch details for ASIN: ${asin}`);
              continue;
            }
            
            // For store-sourced products, we trust they're from the brand
            // Only filter for filament relevance, not strict brand name match
            if (!this.isFilamentProduct(productData.title)) {
              this.log(`Skipping non-filament: ${productData.title}`);
              continue;
            }
            
            const product = this.convertSearchResultToProduct(productData, vendor);
            if (product) {
              products.push(product);
              this.log(`✓ Found [${asin}]: ${productData.title.substring(0, 60)}...`);
            }
          } catch (err) {
            this.log(`Error fetching ASIN ${asin}: ${err}`);
          }
        }
      }
      
      // Step 3: If store page extraction found few products, supplement with search
      if (products.length < 5) {
        this.log(`Step 3: Store page found only ${products.length} products, supplementing with search...`);
        const searchResults = await this.searchAmazon(`${vendor} filament`, limit * 2);
        
        for (const result of searchResults) {
          if (products.length >= limit) break;
          
          const asin = result.asin || this.extractAsinFromUrl(result.link);
          if (asin && seenAsins.has(asin)) continue;
          if (asin) seenAsins.add(asin);
          
          // For search results, still verify brand match
          const titleLower = result.title.toLowerCase();
          const vendorLower = vendor.toLowerCase();
          
          if (!titleLower.includes(vendorLower)) {
            continue;
          }

          if (!this.isFilamentProduct(result.title)) {
            continue;
          }

          const product = this.convertSearchResultToProduct(result, vendor);
          if (product) {
            products.push(product);
            this.log(`✓ Found via search: ${result.title.substring(0, 60)}...`);
          }
        }
      }

      this.log(`Successfully discovered ${products.length} ${vendor} filament products`);
      return products;

    } catch (error) {
      this.logError(`Error scraping Amazon store for ${vendor}:`, error);
      return [];
    }
  }

  // Extract ASINs from an Amazon store page using Firecrawl
  private async extractAsinsFromStorePage(storeUrl: string): Promise<string[]> {
    if (!this.firecrawlApiKey) {
      this.log("FIRECRAWL_API_KEY not available - cannot scrape store page");
      return [];
    }
    
    try {
      await this.respectGlobalRateLimit();
      
      this.log(`Scraping store page for ASINs: ${storeUrl}`);
      
      const response = await fetch("https://api.firecrawl.dev/v1/scrape", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${this.firecrawlApiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          url: storeUrl,
          formats: ["markdown", "html"],
          onlyMainContent: false, // We want full page to get all product links
          waitFor: 3000, // Wait for dynamic content
        }),
      });

      if (!response.ok) {
        const error = await response.text();
        this.log(`Firecrawl store page error: ${response.status} - ${error}`);
        return [];
      }

      const data = await response.json();
      
      if (!data.success) {
        this.log(`Firecrawl store page failed: ${data.error}`);
        return [];
      }

      const content = data.data || data;
      const html = content.html || "";
      const markdown = content.markdown || "";
      
      // Extract ASINs from both HTML and markdown
      const asinPattern = /\/dp\/([A-Z0-9]{10})/gi;
      const asins = new Set<string>();
      
      // Extract from HTML
      let match;
      while ((match = asinPattern.exec(html)) !== null) {
        asins.add(match[1].toUpperCase());
      }
      
      // Reset regex and extract from markdown
      asinPattern.lastIndex = 0;
      while ((match = asinPattern.exec(markdown)) !== null) {
        asins.add(match[1].toUpperCase());
      }
      
      // Also look for ASIN patterns in links like /gp/product/
      const altPattern = /\/gp\/product\/([A-Z0-9]{10})/gi;
      while ((match = altPattern.exec(html)) !== null) {
        asins.add(match[1].toUpperCase());
      }
      
      this.log(`Extracted ${asins.size} unique ASINs from store page`);
      return Array.from(asins);
      
    } catch (error) {
      this.logError(`Error extracting ASINs from store page:`, error);
      return [];
    }
  }

  // Get product details by ASIN using ScrapingDog Product API
  private async getProductByAsin(asin: string): Promise<AmazonSearchResult | null> {
    if (!this.scrapingDogApiKey) {
      this.log("SCRAPINGDOG_API_KEY not available - cannot fetch product details");
      return null;
    }
    
    try {
      await this.respectGlobalRateLimit();
      
      const url = new URL("https://api.scrapingdog.com/amazon/product");
      url.searchParams.set("api_key", this.scrapingDogApiKey);
      url.searchParams.set("domain", "com");
      url.searchParams.set("asin", asin);

      this.log(`Fetching product details for ASIN: ${asin}`);

      const response = await fetch(url.toString());
      
      if (!response.ok) {
        const errorText = await response.text();
        this.log(`ScrapingDog product API error for ${asin}: ${response.status}`);
        return null;
      }

      const data = await response.json();
      
      // ScrapingDog product API returns product details directly
      if (!data || !data.title) {
        this.log(`No product data returned for ASIN: ${asin}`);
        return null;
      }
      
      // Extract price from various possible formats
      let price: string | undefined;
      if (data.price) {
        price = data.price;
      } else if (data.buybox_price) {
        price = data.buybox_price;
      } else if (data.pricing) {
        price = data.pricing;
      }
      
      return {
        title: data.title,
        link: `https://www.amazon.com/dp/${asin}`,
        price: price,
        asin: data.product_information?.ASIN || asin,
        thumbnail: data.main_image || data.images?.[0] || data.thumbnail,
      };
      
    } catch (error) {
      this.logError(`Error fetching product ${asin}:`, error);
      return null;
    }
  }

  // Search Amazon for products using SerpApi with ScrapingDog fallback
  private async searchAmazon(query: string, maxResults: number = 50): Promise<AmazonSearchResult[]> {
    const results: AmazonSearchResult[] = [];
    
    // Try SerpApi first
    if (this.serpApiKey) {
      try {
        const serpResults = await this.searchWithSerpApi(query, maxResults);
        if (serpResults.length > 0) {
          return serpResults;
        }
      } catch (error) {
        this.log(`SerpApi failed, trying ScrapingDog fallback: ${error}`);
      }
    }

    // Fallback to ScrapingDog
    if (this.scrapingDogApiKey) {
      try {
        const scrapingDogResults = await this.searchWithScrapingDog(query, maxResults);
        return scrapingDogResults;
      } catch (error) {
        this.logError(`ScrapingDog also failed:`, error);
      }
    }

    this.logError("No API keys configured for Amazon search (need SERPAPI_KEY or SCRAPINGDOG_API_KEY)");
    return results;
  }

  private async searchWithSerpApi(query: string, maxResults: number): Promise<AmazonSearchResult[]> {
    const results: AmazonSearchResult[] = [];
    let page = 1;
    
    while (results.length < maxResults && page <= 3) {
      await this.respectGlobalRateLimit();
      
      const url = new URL("https://serpapi.com/search.json");
      url.searchParams.set("engine", "amazon");
      url.searchParams.set("amazon_domain", "amazon.com");
      url.searchParams.set("k", query);
      url.searchParams.set("page", page.toString());
      url.searchParams.set("api_key", this.serpApiKey!);

      this.log(`SerpApi search page ${page}: ${query}`);

      const response = await fetch(url.toString());
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`SerpApi error ${response.status}: ${errorText}`);
      }

      const data = await response.json();
      const organicResults = data.organic_results || [];
      
      if (organicResults.length === 0) break;

      for (const item of organicResults) {
        if (results.length >= maxResults) break;
        
        results.push({
          title: item.title || "",
          link: item.link || "",
          price: item.price?.raw || item.price?.value?.toString() || null,
          asin: item.asin || this.extractAsinFromUrl(item.link),
          thumbnail: item.thumbnail || null,
        });
      }

      page++;
    }

    return results;
  }

  private async searchWithScrapingDog(query: string, maxResults: number): Promise<AmazonSearchResult[]> {
    await this.respectGlobalRateLimit();
    
    const url = new URL("https://api.scrapingdog.com/amazon/search");
    url.searchParams.set("api_key", this.scrapingDogApiKey!);
    url.searchParams.set("domain", "com");
    url.searchParams.set("query", query);
    url.searchParams.set("page", "1");
    url.searchParams.set("country", "us");

    this.log(`ScrapingDog search: ${query}`);

    const response = await fetch(url.toString());
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`ScrapingDog error ${response.status}: ${errorText}`);
    }

    const data = await response.json();
    const results: AmazonSearchResult[] = [];
    
    // ScrapingDog returns results in 'results' array
    const items = data.results || data.organic_results || [];
    
    for (const item of items) {
      if (results.length >= maxResults) break;
      
      results.push({
        title: item.title || "",
        link: item.link || item.url || "",
        price: item.price || null,
        asin: item.asin || this.extractAsinFromUrl(item.link || item.url || ""),
        thumbnail: item.thumbnail || item.image || null,
      });
    }

    return results;
  }

  // Search Amazon specifically for a brand's products
  private async searchAmazonForBrand(vendor: string, limit: number): Promise<ScrapedProduct[]> {
    const searchQueries = [
      `${vendor} filament PLA`,
      `${vendor} filament PETG`,
      `${vendor} 3D printer filament`,
    ];

    const allResults: AmazonSearchResult[] = [];
    const seenAsins = new Set<string>();

    for (const query of searchQueries) {
      const results = await this.searchAmazon(query, 20);
      
      for (const result of results) {
        const asin = result.asin || this.extractAsinFromUrl(result.link);
        if (asin && !seenAsins.has(asin)) {
          seenAsins.add(asin);
          allResults.push(result);
        }
      }

      if (allResults.length >= limit) break;
    }

    // Convert to ScrapedProducts
    const products: ScrapedProduct[] = [];
    for (const result of allResults) {
      if (products.length >= limit) break;
      
      // Verify brand match
      if (!result.title.toLowerCase().includes(vendor.toLowerCase())) {
        continue;
      }

      if (!this.isFilamentProduct(result.title)) {
        continue;
      }

      const product = this.convertSearchResultToProduct(result, vendor);
      if (product) {
        products.push(product);
      }
    }

    return products;
  }

  // Convert Amazon search result to ScrapedProduct
  private convertSearchResultToProduct(result: AmazonSearchResult, vendor: string): ScrapedProduct | null {
    const asin = result.asin || this.extractAsinFromUrl(result.link);
    if (!asin) return null;

    // Parse price from string like "$19.99" or "19.99"
    let price: number | null = null;
    if (result.price) {
      const priceMatch = result.price.match(/[\d,.]+/);
      if (priceMatch) {
        price = parseFloat(priceMatch[0].replace(/,/g, ""));
        if (isNaN(price) || price <= 0 || price > 500) {
          price = null;
        }
      }
    }

    // Extract material, color, weight from title
    const material = detectMaterial(result.title);
    const colorInfo = extractColor(result.title);
    const weight = extractWeight(result.title);
    const diameter = extractDiameter(result.title);

    // Build product URL
    const productUrl = result.link.includes("amazon.com") 
      ? result.link 
      : `https://www.amazon.com/dp/${asin}`;

    return {
      productId: asin,
      sku: asin,
      title: result.title,
      price: price,
      compareAtPrice: null,
      available: true, // Assume available if in search results
      currency: "USD",
      url: productUrl,
      scrapedAt: new Date(),
      source: `amazon-store-${vendor.toLowerCase().replace(/\s+/g, '-')}`,
      imageUrl: result.thumbnail || null,
      barcode: null,
      description: null,
      // Enhanced fields parsed from title
      mpn: null,
      tdsUrl: null,
      colorHex: colorInfo?.hex || null,
      colorName: colorInfo?.name || null,
      nozzleTempMin: null,
      nozzleTempMax: null,
      bedTempMin: null,
      bedTempMax: null,
      spoolMaterial: null,
      netWeightG: weight,
      diameterMm: diameter || 1.75,
      spoolOuterDiameterMm: null,
      spoolWidthMm: null,
    };
  }

  // Check if a product title indicates it's a filament product
  private isFilamentProduct(title: string): boolean {
    const titleLower = title.toLowerCase();
    
    // Must contain "filament" or material indicators
    const hasFilamentKeyword = titleLower.includes("filament") || 
                               titleLower.includes("pla") ||
                               titleLower.includes("petg") ||
                               titleLower.includes("abs") ||
                               titleLower.includes("tpu") ||
                               titleLower.includes("nylon");
    
    // Exclude non-filament products
    const excludePatterns = [
      "3d pen",
      "cleaning",
      "nozzle",
      "extruder",
      "hot end",
      "hotend",
      "bed",
      "tape",
      "adhesive",
      "dryer",
      "storage",
      "holder",
      "rack",
      "spool holder",
    ];
    
    const isExcluded = excludePatterns.some(pattern => titleLower.includes(pattern));
    
    return hasFilamentKeyword && !isExcluded;
  }

  private extractAsinFromUrl(url: string): string | null {
    if (!url) return null;
    const match = url.match(/\/dp\/([A-Z0-9]{10})/i) ||
                  url.match(/\/product\/([A-Z0-9]{10})/i) ||
                  url.match(/\/gp\/product\/([A-Z0-9]{10})/i);
    return match ? match[1] : null;
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
