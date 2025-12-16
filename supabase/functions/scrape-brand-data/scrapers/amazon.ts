import { BaseScraper, type ScrapedProduct } from "./base.ts";
import type { BrandConfig } from "../config.ts";
import { extractPrice, extractAvailability, extractColorFromHtml, extractSpoolSpecs, detectMaterial, extractColor, extractWeight, extractDiameter, COLOR_HEX_MAP, intelligentTitleClean, extractDataFromTitle } from "../utils.ts";

interface AmazonSearchResult {
  title: string;
  link: string;
  price?: string;
  asin?: string;
  thumbnail?: string;
}

// Enhanced product details interface for comprehensive extraction
interface AmazonProductDetails {
  // Identifiers
  asin: string;
  upc: string | null;
  ean: string | null;
  gtin: string | null;
  mpn: string | null;
  
  // Basic info
  title: string;
  brand: string | null;
  description: string | null;
  
  // Pricing
  currentPrice: number | null;
  listPrice: number | null;
  discountPercent: number | null;
  
  // Images (all of them)
  images: string[];
  mainImage: string | null;
  
  // Specifications
  featureBullets: string[];
  technicalSpecs: Record<string, string>;
  
  // Parsed from title
  material: string | null;
  color: string | null;
  colorHex: string | null;
  weightG: number | null;
  diameterMm: number | null;
  
  // Print settings (from bullets/description)
  nozzleTempMin: number | null;
  nozzleTempMax: number | null;
  bedTempMin: number | null;
  bedTempMax: number | null;
  
  // TDS
  tdsUrl: string | null;
  
  // Availability
  available: boolean;
  averageRating: number | null;
  totalReviews: number | null;
}

// Parsed filament info from title
interface ParsedFilamentInfo {
  material: string | null;
  color: string | null;
  colorHex: string | null;
  weightG: number | null;
  diameterMm: number | null;
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

  // ============================================================================
  // COMPREHENSIVE AMAZON STORE SCRAPING
  // ============================================================================

  // Discover and scrape products from an Amazon store page
  private async scrapeAmazonStore(vendor: string, storeUrl: string, limit: number): Promise<ScrapedProduct[]> {
    const products: ScrapedProduct[] = [];
    const seenAsins = new Set<string>();
    
    try {
      // Step 1: Use Firecrawl Map API to discover ALL product ASINs
      this.log(`Step 1: Mapping entire Amazon store: ${storeUrl}`);
      const storeAsins = await this.mapEntireAmazonStore(storeUrl);
      this.log(`Discovered ${storeAsins.length} ASINs via Map API`);
      
      // Fallback: if Map API finds few results, also try scrape method
      if (storeAsins.length < 5) {
        this.log(`Map API found few ASINs, supplementing with page scrape...`);
        const scrapeAsins = await this.extractAsinsFromStorePage(storeUrl);
        for (const asin of scrapeAsins) {
          if (!storeAsins.includes(asin)) {
            storeAsins.push(asin);
          }
        }
        this.log(`Total ASINs after supplement: ${storeAsins.length}`);
      }
      
      // Step 2: Get enhanced product details for each ASIN
      if (storeAsins.length > 0) {
        this.log(`Step 2: Fetching enhanced product details for ${storeAsins.length} ASINs`);
        
        for (const asin of storeAsins) {
          if (products.length >= limit) break;
          if (seenAsins.has(asin)) continue;
          seenAsins.add(asin);
          
          try {
            const productDetails = await this.getEnhancedProductByAsin(asin);
            
            if (!productDetails) {
              this.log(`⚠️ Could not fetch details for ASIN: ${asin}`);
              continue;
            }
            
            // For store-sourced products, we trust they're from the brand
            // Only filter for filament relevance, not strict brand name match
            if (!this.isFilamentProduct(productDetails.title)) {
              this.log(`⏭️ Non-filament: ${productDetails.title.substring(0, 40)}...`);
              continue;
            }
            
            // Convert to ScrapedProduct with all available data
            const product = this.convertEnhancedToScrapedProduct(productDetails, vendor);
            if (product) {
              products.push(product);
              
              // Log what we captured
              const captured: string[] = [];
              if (product.price) captured.push('price');
              if (product.imageUrl) captured.push('image');
              if (product.barcode) captured.push('barcode');
              if (product.colorHex) captured.push('color');
              if (product.nozzleTempMin) captured.push('temps');
              if (product.mpn) captured.push('mpn');
              
              this.log(`✅ [${asin}] ${productDetails.title.substring(0, 50)}... [${captured.join(', ')}]`);
            }
          } catch (err) {
            this.log(`❌ Error fetching ASIN ${asin}: ${err}`);
            // Continue to next product (graceful degradation)
          }
        }
      }
      
      // Step 3: If store page extraction found few products, supplement with search
      if (products.length < 5) {
        this.log(`Step 3: Store found only ${products.length} products, supplementing with search...`);
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
            this.log(`✅ Found via search: ${result.title.substring(0, 60)}...`);
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

  // Map entire Amazon store using multiple strategies for reliable discovery
  private async mapEntireAmazonStore(storeUrl: string): Promise<string[]> {
    const asins = new Set<string>();
    
    // Method 1: Try SerpApi site-specific search (most reliable for Amazon)
    if (this.serpApiKey) {
      try {
        const brandName = this.config.vendor;
        this.log(`[SERPAPI] Searching Amazon for ${brandName} filament products`);
        
        await this.respectGlobalRateLimit();
        
        const url = new URL("https://serpapi.com/search.json");
        url.searchParams.set("engine", "amazon");
        url.searchParams.set("amazon_domain", "amazon.com");
        url.searchParams.set("k", `${brandName} filament`);
        url.searchParams.set("api_key", this.serpApiKey);
        
        const response = await fetch(url.toString());
        if (response.ok) {
          const data = await response.json();
          if (data.organic_results) {
            for (const result of data.organic_results) {
              if (result.asin) asins.add(result.asin);
            }
            this.log(`[SERPAPI] Found ${data.organic_results.length} products, ASINs: ${asins.size}`);
          }
        }
      } catch (error) {
        this.log(`SerpApi search failed: ${error}`);
      }
    }
    
    // Method 2: Try ScrapingDog search for brand products
    if (asins.size < 10 && this.scrapingDogApiKey) {
      try {
        const brandName = this.config.vendor;
        this.log(`[SCRAPINGDOG] Searching for ${brandName} filament`);
        
        await this.respectGlobalRateLimit();
        
        const url = new URL("https://api.scrapingdog.com/amazon/search");
        url.searchParams.set("api_key", this.scrapingDogApiKey);
        url.searchParams.set("domain", "com");
        url.searchParams.set("query", `${brandName} filament`);
        url.searchParams.set("page", "1");
        url.searchParams.set("country", "us");
        
        const response = await fetch(url.toString());
        if (response.ok) {
          const data = await response.json();
          const results = data.results || [];
          for (const result of results) {
            if (result.asin && !asins.has(result.asin)) {
              asins.add(result.asin);
            }
          }
          this.log(`[SCRAPINGDOG] Found ${results.length} products, total ASINs: ${asins.size}`);
        }
      } catch (error) {
        this.log(`ScrapingDog search failed: ${error}`);
      }
    }

    // Method 3: Try Firecrawl Map API on store URL
    if (asins.size < 10 && this.firecrawlApiKey) {
      try {
        this.log(`[FIRECRAWL MAP] Mapping store URL: ${storeUrl}`);
        
        await this.respectGlobalRateLimit();
        
        const response = await fetch("https://api.firecrawl.dev/v1/map", {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${this.firecrawlApiKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            url: storeUrl,
            search: "dp/B",
            limit: 500,
            includeSubdomains: false,
          }),
        });

        if (response.ok) {
          const data = await response.json();
          if (data.success && data.links) {
            const asinPattern = /\/dp\/([A-Z0-9]{10})/gi;
            for (const link of data.links) {
              let match;
              while ((match = asinPattern.exec(link)) !== null) {
                asins.add(match[1].toUpperCase());
              }
            }
            this.log(`[FIRECRAWL MAP] Found ${asins.size} total ASINs from ${data.links.length} links`);
          }
        }
      } catch (error) {
        this.log(`Firecrawl Map failed: ${error}`);
      }
    }

    // Method 4: Final fallback - scrape store page directly
    if (asins.size < 5) {
      this.log(`[FALLBACK] Direct page scraping for ASINs`);
      const fallbackAsins = await this.extractAsinsFromStorePage(storeUrl);
      for (const asin of fallbackAsins) {
        asins.add(asin);
      }
    }

    this.log(`Total unique ASINs discovered: ${asins.size}`);
    return Array.from(asins);
  }

  // Extract ASINs from an Amazon store page using Firecrawl Scrape (fallback)
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
          formats: ["markdown", "html", "links"],
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
      const links = content.links || [];
      
      // Extract ASINs from HTML, markdown, and links
      const asins = new Set<string>();
      const asinPatterns = [
        /\/dp\/([A-Z0-9]{10})/gi,
        /\/gp\/product\/([A-Z0-9]{10})/gi,
        /\/gp\/aw\/d\/([A-Z0-9]{10})/gi,
        /data-asin="([A-Z0-9]{10})"/gi,
        /asin=([A-Z0-9]{10})/gi,
      ];
      
      const sources = [html, markdown, links.join(' ')];
      
      for (const source of sources) {
        for (const pattern of asinPatterns) {
          pattern.lastIndex = 0;
          let match;
          while ((match = pattern.exec(source)) !== null) {
            asins.add(match[1].toUpperCase());
          }
        }
      }
      
      this.log(`Extracted ${asins.size} unique ASINs from store page scrape`);
      return Array.from(asins);
      
    } catch (error) {
      this.logError(`Error extracting ASINs from store page:`, error);
      return [];
    }
  }

  // ============================================================================
  // ENHANCED PRODUCT DATA EXTRACTION
  // ============================================================================

  // Get enhanced product details by ASIN using ScrapingDog Product API
  private async getEnhancedProductByAsin(asin: string): Promise<AmazonProductDetails | null> {
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

      this.log(`Fetching enhanced product details for ASIN: ${asin}`);

      const response = await fetch(url.toString());
      
      if (!response.ok) {
        const errorText = await response.text();
        this.log(`ScrapingDog product API error for ${asin}: ${response.status} - ${errorText.substring(0, 100)}`);
        return null;
      }

      const data = await response.json();
      
      // ScrapingDog product API returns product details directly
      if (!data || !data.title) {
        this.log(`No product data returned for ASIN: ${asin}`);
        return null;
      }
      
      // Extract identifiers from product_information with enhanced search
      const productInfo = data.product_information || {};
      const featureBullets: string[] = data.feature_bullets || data.about_item || [];
      const { upc, ean, gtin } = this.extractIdentifiers(productInfo, featureBullets, data.description);
      const mpn = this.extractMpn(productInfo);
      
      
      // Extract all images
      const images: string[] = [];
      if (data.main_image) images.push(data.main_image);
      if (data.images && Array.isArray(data.images)) {
        for (const img of data.images) {
          if (typeof img === 'string' && !images.includes(img)) {
            images.push(img);
          } else if (img?.url && !images.includes(img.url)) {
            images.push(img.url);
          }
        }
      }
      if (data.thumbnail && !images.includes(data.thumbnail)) {
        images.push(data.thumbnail);
      }
      
      // Parse pricing
      const currentPrice = this.parsePriceValue(data.price || data.buybox_price || data.pricing);
      const listPrice = this.parsePriceValue(data.list_price || data.was_price);
      const discountPercent = listPrice && currentPrice && listPrice > currentPrice
        ? Math.round((1 - currentPrice / listPrice) * 100)
        : null;
      
      // Parse title intelligently
      const titleParsed = this.parseFilamentTitle(data.title);
      
      // Extract print settings from feature bullets and description
      const printSettings = this.extractPrintSettingsFromBullets(featureBullets, data.description);
      
      // Look for TDS in description/bullets
      const tdsUrl = this.findTdsInContent(data.description, featureBullets);
      
      // Build technical specs record
      const technicalSpecs: Record<string, string> = {};
      if (productInfo) {
        for (const [key, value] of Object.entries(productInfo)) {
          if (typeof value === 'string') {
            technicalSpecs[key] = value;
          }
        }
      }
      
      return {
        asin,
        upc,
        ean,
        gtin,
        mpn,
        title: data.title,
        brand: data.brand || productInfo['Brand'] || null,
        description: data.description || null,
        currentPrice,
        listPrice,
        discountPercent,
        images,
        mainImage: images[0] || null,
        featureBullets,
        technicalSpecs,
        material: titleParsed.material,
        color: titleParsed.color,
        colorHex: titleParsed.colorHex,
        weightG: titleParsed.weightG,
        diameterMm: titleParsed.diameterMm,
        nozzleTempMin: printSettings.nozzleTempMin,
        nozzleTempMax: printSettings.nozzleTempMax,
        bedTempMin: printSettings.bedTempMin,
        bedTempMax: printSettings.bedTempMax,
        tdsUrl,
        available: !data.out_of_stock,
        averageRating: data.average_rating ? parseFloat(data.average_rating) : null,
        totalReviews: data.total_reviews ? parseInt(data.total_reviews) : null,
      };
      
    } catch (error) {
      this.logError(`Error fetching enhanced product ${asin}:`, error);
      return null;
    }
  }

  // ============================================================================
  // INTELLIGENT PARSING HELPERS
  // ============================================================================

  // Default print settings by material type (used when Amazon doesn't provide temps)
  private getDefaultPrintSettings(material: string | null): {
    nozzleTempMin: number | null;
    nozzleTempMax: number | null;
    bedTempMin: number | null;
    bedTempMax: number | null;
  } {
    if (!material) return { nozzleTempMin: null, nozzleTempMax: null, bedTempMin: null, bedTempMax: null };
    
    const materialUpper = material.toUpperCase();
    
    // PLA and variants
    if (materialUpper.includes('PLA')) {
      return { nozzleTempMin: 190, nozzleTempMax: 220, bedTempMin: 50, bedTempMax: 60 };
    }
    // PETG
    if (materialUpper.includes('PETG')) {
      return { nozzleTempMin: 220, nozzleTempMax: 250, bedTempMin: 70, bedTempMax: 85 };
    }
    // ABS
    if (materialUpper.includes('ABS')) {
      return { nozzleTempMin: 230, nozzleTempMax: 260, bedTempMin: 95, bedTempMax: 110 };
    }
    // ASA
    if (materialUpper.includes('ASA')) {
      return { nozzleTempMin: 235, nozzleTempMax: 260, bedTempMin: 90, bedTempMax: 110 };
    }
    // TPU/TPE
    if (materialUpper.includes('TPU') || materialUpper.includes('TPE')) {
      return { nozzleTempMin: 210, nozzleTempMax: 240, bedTempMin: 40, bedTempMax: 60 };
    }
    // Nylon/PA
    if (materialUpper.includes('NYLON') || materialUpper.includes('PA')) {
      return { nozzleTempMin: 240, nozzleTempMax: 270, bedTempMin: 70, bedTempMax: 90 };
    }
    // PC/Polycarbonate
    if (materialUpper.includes('PC') || materialUpper.includes('POLYCARBONATE')) {
      return { nozzleTempMin: 260, nozzleTempMax: 300, bedTempMin: 100, bedTempMax: 120 };
    }
    
    return { nozzleTempMin: null, nozzleTempMax: null, bedTempMin: null, bedTempMax: null };
  }

  // Extract UPC, EAN, GTIN identifiers with validation - enhanced with text search
  private extractIdentifiers(productInfo: Record<string, any>, featureBullets?: string[], description?: string): { upc: string | null; ean: string | null; gtin: string | null } {
    const result = { upc: null as string | null, ean: null as string | null, gtin: null as string | null };
    
    // Method 1: Extract from product information table
    // UPC patterns
    const upcKeys = ['UPC', 'UPCundefined', 'upc'];
    for (const key of upcKeys) {
      const value = productInfo[key];
      if (value) {
        const cleaned = String(value).replace(/\D/g, '');
        // UPC-A is 12 digits
        if (cleaned.length === 12 && this.validateCheckDigit(cleaned, 12)) {
          result.upc = cleaned;
          break;
        }
      }
    }
    
    // EAN patterns  
    const eanKeys = ['EAN', 'EANundefined', 'ean'];
    for (const key of eanKeys) {
      const value = productInfo[key];
      if (value) {
        const cleaned = String(value).replace(/\D/g, '');
        // EAN-13 is 13 digits
        if (cleaned.length === 13 && this.validateCheckDigit(cleaned, 13)) {
          result.ean = cleaned;
          break;
        }
      }
    }
    
    // GTIN patterns
    const gtinKeys = ['GTIN', 'GTINundefined', 'gtin'];
    for (const key of gtinKeys) {
      const value = productInfo[key];
      if (value) {
        const cleaned = String(value).replace(/\D/g, '');
        // GTIN-14 is 14 digits
        if (cleaned.length === 14 && this.validateCheckDigit(cleaned, 14)) {
          result.gtin = cleaned;
          break;
        }
      }
    }
    
    // Method 2: Search feature bullets and description for barcode patterns
    if (!result.upc && !result.ean && !result.gtin && (featureBullets || description)) {
      const searchText = [
        ...(featureBullets || []),
        description || '',
      ].join(' ');
      
      // Look for explicit barcode mentions
      if (!result.upc) {
        const upcMatch = searchText.match(/\bUPC[:\s]*(\d{12})\b/i);
        if (upcMatch && this.validateCheckDigit(upcMatch[1], 12)) {
          result.upc = upcMatch[1];
        }
      }
      
      if (!result.ean) {
        const eanMatch = searchText.match(/\bEAN[:\s]*(\d{13})\b/i);
        if (eanMatch && this.validateCheckDigit(eanMatch[1], 13)) {
          result.ean = eanMatch[1];
        }
      }
      
      if (!result.gtin) {
        const gtinMatch = searchText.match(/\bGTIN[:\s]*(\d{14})\b/i);
        if (gtinMatch && this.validateCheckDigit(gtinMatch[1], 14)) {
          result.gtin = gtinMatch[1];
        }
      }
    }
    
    return result;
  }

  // Validate barcode check digit
  private validateCheckDigit(code: string, length: number): boolean {
    if (code.length !== length) return false;
    
    try {
      const digits = code.split('').map(Number);
      const checkDigit = digits.pop()!;
      
      let sum = 0;
      for (let i = 0; i < digits.length; i++) {
        const multiplier = (length === 13 || length === 14) 
          ? (i % 2 === 0 ? 1 : 3)
          : (i % 2 === 0 ? 3 : 1);
        sum += digits[i] * multiplier;
      }
      
      const calculatedCheck = (10 - (sum % 10)) % 10;
      return calculatedCheck === checkDigit;
    } catch {
      return true; // If validation fails, accept anyway
    }
  }

  // Extract MPN from product information
  private extractMpn(productInfo: Record<string, any>): string | null {
    const mpnKeys = [
      'Manufacturer Part Number',
      'Item model number', 
      'Model Number',
      'Part Number',
      'MPN',
      'Manufacturer_Part_Number',
    ];
    
    for (const key of mpnKeys) {
      const value = productInfo[key];
      if (value && typeof value === 'string' && value.length > 2 && value.length < 50) {
        return value.trim();
      }
    }
    
    return null;
  }

  // Parse price value from various formats
  private parsePriceValue(price: any): number | null {
    if (!price) return null;
    
    if (typeof price === 'number') {
      return price > 0 && price < 500 ? price : null;
    }
    
    if (typeof price === 'string') {
      const match = price.match(/[\d,.]+/);
      if (match) {
        const parsed = parseFloat(match[0].replace(/,/g, ''));
        if (!isNaN(parsed) && parsed > 0 && parsed < 500) {
          return parsed;
        }
      }
    }
    
    return null;
  }

  // Comprehensive title parser for filament products
  private parseFilamentTitle(title: string): ParsedFilamentInfo {
    const result: ParsedFilamentInfo = {
      material: null,
      color: null,
      colorHex: null,
      weightG: null,
      diameterMm: null,
    };
    
    const upperTitle = title.toUpperCase();
    const lowerTitle = title.toLowerCase();
    
    // Material detection (ordered by specificity - longer/composite first)
    const materialPatterns: { pattern: RegExp; material: string }[] = [
      // Composite materials first
      { pattern: /\bPLA[-\s]?CF\b/i, material: 'PLA-CF' },
      { pattern: /\bPLA[-\s]?GF\b/i, material: 'PLA-GF' },
      { pattern: /\bPLA\+\b/i, material: 'PLA+' },
      { pattern: /\bPLA\s*PLUS\b/i, material: 'PLA+' },
      { pattern: /\bPETG[-\s]?CF\b/i, material: 'PETG-CF' },
      { pattern: /\bPETG[-\s]?GF\b/i, material: 'PETG-GF' },
      { pattern: /\bABS[-\s]?CF\b/i, material: 'ABS-CF' },
      { pattern: /\bASA[-\s]?CF\b/i, material: 'ASA-CF' },
      { pattern: /\bPA[-\s]?CF\b/i, material: 'PA-CF' },
      { pattern: /\bPA[-\s]?GF\b/i, material: 'PA-GF' },
      { pattern: /\bPC[-\s]?CF\b/i, material: 'PC-CF' },
      { pattern: /\bPC[-\s]?ABS\b/i, material: 'PC-ABS' },
      // Nylon variants
      { pattern: /\bPA12\b/i, material: 'PA12' },
      { pattern: /\bPA6\b/i, material: 'PA6' },
      { pattern: /\bNYLON\b/i, material: 'Nylon' },
      // High performance
      { pattern: /\bPEEK\b/i, material: 'PEEK' },
      { pattern: /\bPEKK\b/i, material: 'PEKK' },
      { pattern: /\bPEI\b/i, material: 'PEI' },
      { pattern: /\bULTEM\b/i, material: 'ULTEM' },
      // Standard materials
      { pattern: /\bPLA\b/i, material: 'PLA' },
      { pattern: /\bPETG\b/i, material: 'PETG' },
      { pattern: /\bABS\b/i, material: 'ABS' },
      { pattern: /\bASA\b/i, material: 'ASA' },
      { pattern: /\bTPU\b/i, material: 'TPU' },
      { pattern: /\bTPE\b/i, material: 'TPE' },
      { pattern: /\bPC\b/i, material: 'PC' },
      { pattern: /\bPVA\b/i, material: 'PVA' },
      { pattern: /\bHIPS\b/i, material: 'HIPS' },
      { pattern: /\bPP\b/i, material: 'PP' },
      { pattern: /\bPOM\b/i, material: 'POM' },
      // Special types
      { pattern: /\bSILK\b/i, material: 'PLA-Silk' },
      { pattern: /\bMATTE\b/i, material: 'PLA-Matte' },
      { pattern: /\bWOOD\b/i, material: 'Wood-PLA' },
      { pattern: /\bMARBLE\b/i, material: 'PLA' },
      { pattern: /\bRAINBOW\b/i, material: 'PLA' },
      { pattern: /\bGRADIENT\b/i, material: 'PLA' },
      { pattern: /\bCOEXTRUSION\b/i, material: 'PLA' },
    ];
    
    for (const { pattern, material } of materialPatterns) {
      if (pattern.test(title)) {
        result.material = material;
        break;
      }
    }
    
    // Color extraction with enhanced patterns
    const colorPatterns: { pattern: RegExp; name: string; hex: string | null }[] = [
      // Special effects first
      { pattern: /\bRAINBOW\b/i, name: 'Rainbow', hex: '#FF0000' },
      { pattern: /\bMULTICOLOR(?:ED)?\b/i, name: 'Rainbow', hex: '#FF0000' },
      { pattern: /\bGRADIENT\b/i, name: 'Gradient', hex: null },
      { pattern: /\bMARBLE\b/i, name: 'Marble', hex: '#E8E8E8' },
      { pattern: /\bGALAXY\b/i, name: 'Galaxy', hex: '#1A1A2E' },
      { pattern: /\bSPARKLE\b/i, name: 'Sparkle', hex: null },
      { pattern: /\bGLITTER\b/i, name: 'Glitter', hex: null },
      // Silk variants
      { pattern: /\bSILK\s+RED\b/i, name: 'Silk Red', hex: '#E41B17' },
      { pattern: /\bSILK\s+GOLD\b/i, name: 'Silk Gold', hex: '#FFD700' },
      { pattern: /\bSILK\s+SILVER\b/i, name: 'Silk Silver', hex: '#C0C0C0' },
      { pattern: /\bSILK\s+COPPER\b/i, name: 'Silk Copper', hex: '#B87333' },
      { pattern: /\bSILK\s+BRONZE\b/i, name: 'Silk Bronze', hex: '#CD7F32' },
      { pattern: /\bSILK\s+EMERALD\b/i, name: 'Silk Emerald', hex: '#50C878' },
      { pattern: /\bSILK\s+BLUE\b/i, name: 'Silk Blue', hex: '#4169E1' },
      { pattern: /\bSILK\s+PURPLE\b/i, name: 'Silk Purple', hex: '#9370DB' },
      { pattern: /\bSILK\s+GREEN\b/i, name: 'Silk Green', hex: '#32CD32' },
      { pattern: /\bSILK\s+PINK\b/i, name: 'Silk Pink', hex: '#FF69B4' },
      { pattern: /\bSILK\b/i, name: 'Silk', hex: '#C0C0C0' },
      // Standard colors
      { pattern: /\bBLACK\b/i, name: 'Black', hex: '#1A1A1A' },
      { pattern: /\bWHITE\b/i, name: 'White', hex: '#FFFFFF' },
      { pattern: /\bRED\b/i, name: 'Red', hex: '#E41B17' },
      { pattern: /\bBLUE\b/i, name: 'Blue', hex: '#0000FF' },
      { pattern: /\bGREEN\b/i, name: 'Green', hex: '#008000' },
      { pattern: /\bYELLOW\b/i, name: 'Yellow', hex: '#FFFF00' },
      { pattern: /\bORANGE\b/i, name: 'Orange', hex: '#FF6600' },
      { pattern: /\bPURPLE\b/i, name: 'Purple', hex: '#800080' },
      { pattern: /\bPINK\b/i, name: 'Pink', hex: '#FFC0CB' },
      { pattern: /\bBROWN\b/i, name: 'Brown', hex: '#8B4513' },
      { pattern: /\bGRAY\b/i, name: 'Gray', hex: '#808080' },
      { pattern: /\bGREY\b/i, name: 'Grey', hex: '#808080' },
      { pattern: /\bGOLD\b/i, name: 'Gold', hex: '#FFD700' },
      { pattern: /\bSILVER\b/i, name: 'Silver', hex: '#C0C0C0' },
      { pattern: /\bCOPPER\b/i, name: 'Copper', hex: '#B87333' },
      { pattern: /\bBRONZE\b/i, name: 'Bronze', hex: '#CD7F32' },
      { pattern: /\bTRANSPARENT\b/i, name: 'Transparent', hex: '#FFFFFF' },
      { pattern: /\bCLEAR\b/i, name: 'Clear', hex: '#FFFFFF' },
      { pattern: /\bNATURAL\b/i, name: 'Natural', hex: '#F5F5DC' },
      { pattern: /\bBEIGE\b/i, name: 'Beige', hex: '#F5F5DC' },
      { pattern: /\bCYAN\b/i, name: 'Cyan', hex: '#00FFFF' },
      { pattern: /\bTEAL\b/i, name: 'Teal', hex: '#008080' },
      { pattern: /\bTURQUOISE\b/i, name: 'Turquoise', hex: '#40E0D0' },
      { pattern: /\bNAVY\b/i, name: 'Navy', hex: '#000080' },
      { pattern: /\bMAGENTA\b/i, name: 'Magenta', hex: '#FF00FF' },
      { pattern: /\bVIOLET\b/i, name: 'Violet', hex: '#EE82EE' },
      { pattern: /\bCORAL\b/i, name: 'Coral', hex: '#FF7F50' },
      { pattern: /\bSALMON\b/i, name: 'Salmon', hex: '#FA8072' },
      { pattern: /\bPEACH\b/i, name: 'Peach', hex: '#FFDAB9' },
      { pattern: /\bIVORY\b/i, name: 'Ivory', hex: '#FFFFF0' },
      { pattern: /\bCREAM\b/i, name: 'Cream', hex: '#FFFDD0' },
      { pattern: /\bOLIVE\b/i, name: 'Olive', hex: '#808000' },
      { pattern: /\bLIME\b/i, name: 'Lime', hex: '#00FF00' },
      { pattern: /\bMINT\b/i, name: 'Mint', hex: '#98FF98' },
      { pattern: /\bAQUA\b/i, name: 'Aqua', hex: '#00FFFF' },
      { pattern: /\bSKY\b/i, name: 'Sky Blue', hex: '#87CEEB' },
      { pattern: /\bROSE\b/i, name: 'Rose', hex: '#FF007F' },
      { pattern: /\bLAVENDER\b/i, name: 'Lavender', hex: '#E6E6FA' },
      { pattern: /\bCHARCOAL\b/i, name: 'Charcoal', hex: '#36454F' },
      { pattern: /\bSNOW\b/i, name: 'Snow White', hex: '#FFFAFA' },
    ];
    
    for (const { pattern, name, hex } of colorPatterns) {
      if (pattern.test(title)) {
        result.color = name;
        result.colorHex = hex;
        break;
      }
    }
    
    // Weight patterns (kg, g, lb)
    const kgMatch = title.match(/(\d+(?:\.\d+)?)\s*kg/i);
    if (kgMatch) {
      result.weightG = Math.round(parseFloat(kgMatch[1]) * 1000);
    } else {
      const gMatch = title.match(/(\d+)\s*g(?:ram)?s?\b/i);
      if (gMatch && parseInt(gMatch[1]) >= 100) {
        result.weightG = parseInt(gMatch[1]);
      } else {
        const lbMatch = title.match(/(\d+(?:\.\d+)?)\s*lb/i);
        if (lbMatch) {
          result.weightG = Math.round(parseFloat(lbMatch[1]) * 453.592);
        }
      }
    }
    
    // Diameter patterns (mm)
    const diamMatch = title.match(/(\d+(?:\.\d+)?)\s*mm/i);
    if (diamMatch) {
      const diam = parseFloat(diamMatch[1]);
      // Only accept common filament diameters
      if (diam >= 1.5 && diam <= 3.0) {
        result.diameterMm = diam;
      }
    }
    
    // Default diameter if not found
    if (!result.diameterMm) {
      result.diameterMm = 1.75; // Most common
    }
    
    return result;
  }

  // Extract print settings from feature bullets and description
  private extractPrintSettingsFromBullets(
    bullets: string[], 
    description: string | null
  ): { nozzleTempMin: number | null; nozzleTempMax: number | null; bedTempMin: number | null; bedTempMax: number | null } {
    const result = {
      nozzleTempMin: null as number | null,
      nozzleTempMax: null as number | null,
      bedTempMin: null as number | null,
      bedTempMax: null as number | null,
    };
    
    const combined = [...bullets, description || ''].join(' ');
    
    // Nozzle temperature patterns
    const nozzlePatterns = [
      /(?:nozzle|printing|print|extrusion|extruder|hotend)\s*(?:temp(?:erature)?)?[:\s]*(\d{3})\s*[-–~to]\s*(\d{3})\s*°?[CF]?/gi,
      /(\d{3})\s*[-–~to]\s*(\d{3})\s*°?[CF]?\s*(?:nozzle|printing|extrusion)/gi,
      /recommended\s*(?:nozzle|printing)?\s*temp[:\s]*(\d{3})\s*°?[CF]?/gi,
      /(?:nozzle|print)\s*temp[:\s]*(\d{3})\s*°?[CF]?/gi,
    ];
    
    for (const pattern of nozzlePatterns) {
      pattern.lastIndex = 0;
      const match = pattern.exec(combined);
      if (match) {
        if (match[2]) {
          const temp1 = parseInt(match[1]);
          const temp2 = parseInt(match[2]);
          if (temp1 >= 150 && temp1 <= 350 && temp2 >= 150 && temp2 <= 350) {
            result.nozzleTempMin = Math.min(temp1, temp2);
            result.nozzleTempMax = Math.max(temp1, temp2);
            break;
          }
        } else if (match[1]) {
          const temp = parseInt(match[1]);
          if (temp >= 150 && temp <= 350) {
            result.nozzleTempMin = temp - 10;
            result.nozzleTempMax = temp + 10;
            break;
          }
        }
      }
    }
    
    // Bed temperature patterns
    const bedPatterns = [
      /(?:bed|plate|platform|build\s*plate|heated\s*bed)\s*(?:temp(?:erature)?)?[:\s]*(\d{2,3})\s*[-–~to]\s*(\d{2,3})\s*°?[CF]?/gi,
      /(\d{2,3})\s*[-–~to]\s*(\d{2,3})\s*°?[CF]?\s*(?:bed|plate|platform)/gi,
      /(?:bed|plate)\s*temp[:\s]*(\d{2,3})\s*°?[CF]?/gi,
      /heated\s*bed[:\s]*(\d{2,3})\s*°?[CF]?/gi,
    ];
    
    for (const pattern of bedPatterns) {
      pattern.lastIndex = 0;
      const match = pattern.exec(combined);
      if (match) {
        if (match[2]) {
          const temp1 = parseInt(match[1]);
          const temp2 = parseInt(match[2]);
          if (temp1 >= 0 && temp1 <= 150 && temp2 >= 0 && temp2 <= 150) {
            result.bedTempMin = Math.min(temp1, temp2);
            result.bedTempMax = Math.max(temp1, temp2);
            break;
          }
        } else if (match[1]) {
          const temp = parseInt(match[1]);
          if (temp >= 0 && temp <= 150) {
            result.bedTempMin = temp;
            result.bedTempMax = temp + 20;
            break;
          }
        }
      }
    }
    
    return result;
  }

  // Find TDS document URL in content
  private findTdsInContent(description: string | null, bullets: string[]): string | null {
    const combined = `${description || ''} ${bullets.join(' ')}`;
    
    // Look for TDS/datasheet links
    const tdsPatterns = [
      /(?:TDS|technical\s*data\s*sheet|datasheet|spec\s*sheet)[^<]*?(https?:\/\/[^\s<"']+\.pdf)/gi,
      /(?:download|view)\s*(?:TDS|specifications|data\s*sheet)[^<]*?(https?:\/\/[^\s<"']+)/gi,
      /(https?:\/\/[^\s<"']*(?:tds|datasheet|technical[-_]?data)[^\s<"']*\.pdf)/gi,
    ];
    
    for (const pattern of tdsPatterns) {
      pattern.lastIndex = 0;
      const match = pattern.exec(combined);
      if (match && match[1]) {
        // Skip SDS (Safety Data Sheet)
        if (match[1].toLowerCase().includes('sds') || match[1].toLowerCase().includes('safety')) {
          continue;
        }
        return match[1];
      }
    }
    
    return null;
  }

  // ============================================================================
  // PRODUCT CONVERSION (GRACEFUL DEGRADATION)
  // ============================================================================

  // Convert enhanced product details to ScrapedProduct
  private convertEnhancedToScrapedProduct(details: AmazonProductDetails, vendor: string): ScrapedProduct {
    // Determine barcode (priority: UPC > EAN > GTIN)
    const barcode = details.upc || details.ean || details.gtin || null;
    
    // Build description from feature bullets if no description
    const description = details.description || 
      (details.featureBullets.length > 0 ? details.featureBullets.join('\n• ') : null);
    
    // Get print settings - use extracted values, or fall back to material defaults
    let nozzleTempMin = details.nozzleTempMin;
    let nozzleTempMax = details.nozzleTempMax;
    let bedTempMin = details.bedTempMin;
    let bedTempMax = details.bedTempMax;
    
    // Apply default print settings if none extracted from Amazon
    if (!nozzleTempMin && !bedTempMin && details.material) {
      const defaults = this.getDefaultPrintSettings(details.material);
      nozzleTempMin = defaults.nozzleTempMin;
      nozzleTempMax = defaults.nozzleTempMax;
      bedTempMin = defaults.bedTempMin;
      bedTempMax = defaults.bedTempMax;
      if (nozzleTempMin) {
        this.log(`📋 Using default temps for ${details.material}: nozzle ${nozzleTempMin}-${nozzleTempMax}°C, bed ${bedTempMin}-${bedTempMax}°C`);
      }
    }
    
    // Clean the title intelligently - first extract data, then clean
    const extractedData = extractDataFromTitle(details.title);
    const cleanedTitle = intelligentTitleClean(extractedData.cleanedTitle, vendor);
    this.log(`📝 Title cleaned: "${details.title.substring(0, 50)}..." → "${cleanedTitle}"`);
    
    // Use extracted weight if we got it from title patterns like [MOQ: 6KG]
    const finalWeight = details.weightG || extractedData.netWeightG;
    
    return {
      productId: details.asin,
      sku: details.asin,
      title: cleanedTitle,
      price: details.currentPrice,
      compareAtPrice: details.listPrice,
      available: details.available,
      currency: 'USD',
      url: `https://www.amazon.com/dp/${details.asin}`,
      scrapedAt: new Date(),
      source: `amazon-store-${vendor.toLowerCase().replace(/\s+/g, '-')}`,
      
      // Images - take best available
      imageUrl: details.mainImage,
      
      // Identifiers
      barcode: barcode,
      mpn: details.mpn,
      
      // Description
      description: description?.substring(0, 2000) || null,
      
      // Colors
      colorHex: details.colorHex,
      colorName: details.color,
      
      // Print settings (with defaults applied)
      nozzleTempMin: nozzleTempMin,
      nozzleTempMax: nozzleTempMax,
      bedTempMin: bedTempMin,
      bedTempMax: bedTempMax,
      
      // Physical specs - use extracted weight from title if available
      netWeightG: finalWeight,
      diameterMm: details.diameterMm || 1.75,
      
      // TDS
      tdsUrl: details.tdsUrl,
      
      // Spool specs (not typically in Amazon data)
      spoolMaterial: null,
      spoolOuterDiameterMm: null,
      spoolWidthMm: null,
    };
  }

  // Convert Amazon search result to ScrapedProduct (basic fallback)
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

    // Parse title
    const titleParsed = this.parseFilamentTitle(result.title);

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
      available: true,
      currency: "USD",
      url: productUrl,
      scrapedAt: new Date(),
      source: `amazon-store-${vendor.toLowerCase().replace(/\s+/g, '-')}`,
      imageUrl: result.thumbnail || null,
      barcode: null,
      description: null,
      mpn: null,
      tdsUrl: null,
      colorHex: titleParsed.colorHex,
      colorName: titleParsed.color,
      nozzleTempMin: null,
      nozzleTempMax: null,
      bedTempMin: null,
      bedTempMax: null,
      spoolMaterial: null,
      netWeightG: titleParsed.weightG,
      diameterMm: titleParsed.diameterMm || 1.75,
      spoolOuterDiameterMm: null,
      spoolWidthMm: null,
    };
  }

  // ============================================================================
  // SEARCH METHODS (FALLBACK)
  // ============================================================================

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

  // ============================================================================
  // HELPER METHODS
  // ============================================================================

  // Check if a product title indicates it's a filament product
  private isFilamentProduct(title: string): boolean {
    const titleLower = title.toLowerCase();
    
    // Must contain "filament" or material indicators
    const hasFilamentKeyword = titleLower.includes("filament") || 
                               titleLower.includes("pla") ||
                               titleLower.includes("petg") ||
                               titleLower.includes("abs") ||
                               titleLower.includes("tpu") ||
                               titleLower.includes("nylon") ||
                               titleLower.includes("asa");
    
    // Exclude non-filament products - comprehensive list
    const excludePatterns = [
      // Hardware/accessories
      "3d pen", "cleaning", "nozzle", "extruder", "hot end", "hotend",
      "bed tape", "adhesive", "dryer", "dry box", "storage box",
      "holder", "rack", "spool holder", "desiccant", "vacuum bag",
      "enclosure", "connector", "splicer", "build plate", "filament hub",
      "resin", "printer kit", "heater block", "thermistor", "heat break",
      // CNC/router (SainSmart)
      "cnc", "router", "planer", "spindle", "collet", "wasteboard",
      "dust shoe", "touch plate", "spoilboard", "bit set", "router bit",
      // Protection plans
      "protection plan", "shipping protection", "warranty", "replacement part",
      // Clothing/merchandise
      "t-shirt", "tshirt", "shirt", "hoodie", "hat", "sticker",
      // Test/placeholder products  
      "test link", "not for sale", "misc charge", "placeholder",
      // Combo packs with printers
      "combo pack", "pro pack", "printer combo", "printer +", "+ printer",
      // Sensors/electronics
      "temperature sensor", "humidity sensor", "led panel", "led light",
      // Discontinued/bundle
      "discontinued", "bundle",
      // Mystery/promotional
      "mystery", "rolls",
      // Promotional variants
      "buy 1 get", "buy 2 get", "buy 3 get", "flash sale", "flash deal",
      "bulk sale", "christmas bulk", "prime deal", "10-100kg",
      // Gift/promo items
      "prize claim", "gift card", "gift item", "promotional container",
    ];
    
    const isExcluded = excludePatterns.some(pattern => titleLower.includes(pattern));
    
    return hasFilamentKeyword && !isExcluded;
  }

  private extractAsinFromUrl(url: string): string | null {
    if (!url) return null;
    const match = url.match(/\/dp\/([A-Z0-9]{10})/i) ||
                  url.match(/\/product\/([A-Z0-9]{10})/i) ||
                  url.match(/\/gp\/product\/([A-Z0-9]{10})/i) ||
                  url.match(/\/gp\/aw\/d\/([A-Z0-9]{10})/i);
    return match ? match[1].toUpperCase() : null;
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
    const titleParsed = this.parseFilamentTitle(title);

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
      barcode: null,
      description: markdown?.substring(0, 2000) || null,
      mpn: null,
      tdsUrl: null,
      colorHex: colorInfo?.hex || titleParsed.colorHex || null,
      colorName: colorInfo?.name || titleParsed.color || null,
      nozzleTempMin: null,
      nozzleTempMax: null,
      bedTempMin: null,
      bedTempMax: null,
      spoolMaterial: spoolSpecs?.material || null,
      netWeightG: spoolSpecs?.weightG || titleParsed.weightG || null,
      diameterMm: spoolSpecs?.diameterMm || titleParsed.diameterMm || null,
      spoolOuterDiameterMm: spoolSpecs?.outerDiameterMm || null,
      spoolWidthMm: spoolSpecs?.widthMm || null,
    };
  }

  private extractAmazonPrice(html: string): number | null {
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

    return true;
  }

  private extractAmazonImage(html: string, metadata: any): string | null {
    if (metadata?.ogImage?.[0]?.url) {
      return metadata.ogImage[0].url;
    }
    
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
