import { BaseScraper, type ScrapedProduct } from "./base.ts";
import type { BrandConfig } from "../config.ts";
import { extractPrice, extractAvailability, findTdsUrl, extractPrintSettings, extractSpoolSpecs, extractMpnFromHtml, classifyVariant, extractColorInfo, COLOR_HEX_MAP } from "../utils.ts";

/**
 * FirecrawlScraper - Generic HTML scraper using Firecrawl API
 * Used for custom/Magento platforms like FormFutura and MatterHackers
 */
export class FirecrawlScraper extends BaseScraper {
  private firecrawlApiKey: string | undefined;

  constructor(config: BrandConfig) {
    super(config);
    this.firecrawlApiKey = Deno.env.get("FIRECRAWL_API_KEY");
  }

  async scrapeProduct(url: string): Promise<ScrapedProduct | null> {
    if (!this.firecrawlApiKey) {
      this.logError("FIRECRAWL_API_KEY not configured");
      return null;
    }

    try {
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
          waitFor: 3000,
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

      return this.parseResponse(data, url);
    } catch (error) {
      this.logError(`Error scraping ${url}:`, error);
      return null;
    }
  }

  async scrapeAllProducts(limit: number = 50): Promise<ScrapedProduct[]> {
    if (!this.firecrawlApiKey) {
      this.logError("FIRECRAWL_API_KEY not configured");
      return [];
    }

    const products: ScrapedProduct[] = [];
    const baseUrl = this.config.baseUrl;
    const vendor = this.config.vendor.toLowerCase();
    
    this.log(`Discovering products via Firecrawl Map API from: ${baseUrl}`);

    try {
      // Step 1: Use Firecrawl Map API to discover all URLs on the shop
      const mapResponse = await fetch("https://api.firecrawl.dev/v1/map", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${this.firecrawlApiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          url: baseUrl,
          search: "filament PLA PETG ABS TPU nylon",
          limit: 200,
          includeSubdomains: false,
        }),
      });

      if (!mapResponse.ok) {
        const error = await mapResponse.text();
        this.logError(`Firecrawl Map error: ${mapResponse.status} - ${error}`);
        return [];
      }

      const mapData = await mapResponse.json();
      
      if (!mapData.success || !mapData.links) {
        this.logError(`Firecrawl Map failed: ${mapData.error || 'No links returned'}`);
        return [];
      }

      this.log(`Map discovered ${mapData.links.length} URLs`);

      // Step 2: Filter for product URLs using brand-specific patterns
      const productUrls = mapData.links.filter((url: string) => {
        return this.isProductUrl(url, vendor);
      });

      this.log(`Filtered to ${productUrls.length} potential product URLs`);

      // Step 3: Scrape each product URL (up to limit)
      const urlsToScrape = productUrls.slice(0, limit);
      
      for (const url of urlsToScrape) {
        try {
          this.log(`Scraping product: ${url}`);
          const product = await this.scrapeProduct(url);
          
          if (product && product.title && product.price) {
            // Additional filter: ensure it's actually a filament product
            const title = product.title.toLowerCase();
            if (title.includes('filament') || 
                title.includes('pla') || 
                title.includes('petg') || 
                title.includes('abs') ||
                title.includes('tpu') ||
                title.includes('nylon') ||
                title.includes('cf-') ||
                title.includes('carbon fiber')) {
              products.push(product);
              this.log(`✓ Found filament: ${product.title} - $${product.price}`);
            } else {
              this.log(`✗ Skipped non-filament: ${product.title}`);
            }
          }
          
          // Rate limiting between requests
          await new Promise(resolve => setTimeout(resolve, 500));
        } catch (err) {
          this.logError(`Failed to scrape ${url}:`, err);
        }
      }

      this.log(`Successfully scraped ${products.length} filament products`);
      return products;
    } catch (error) {
      this.logError(`Error in scrapeAllProducts:`, error);
      return [];
    }
  }

  /**
   * Brand-specific product URL detection
   */
  private isProductUrl(url: string, vendor: string): boolean {
    const lowerUrl = url.toLowerCase();
    
    // Universal exclusions
    const excludePatterns = [
      '/cart', '/checkout', '/account', '/login', '/contact', '/about',
      '/faq', '/page/', '/blog/', '/news/', '/category/', '/tag/',
      '?', '#', '/wishlist', '/compare', '/search'
    ];
    
    if (excludePatterns.some(p => lowerUrl.includes(p))) {
      return false;
    }

    // Brand-specific product URL patterns
    const brandPatterns: Record<string, RegExp[]> = {
      'formfutura': [
        /formfutura\.com\/shop\/product\/[^\/]+$/i,
        /formfutura\.com\/[a-z-]+\/[a-z0-9-]+-\d+ml$/i, // Product with ml suffix
      ],
      'extrudr': [
        /extrudr\.com\/en\/products\/[^\/]+/i,
        /extrudr\.com\/en\/inlt\/[^\/]+/i,
      ],
      'spectrum filaments': [
        /shop\.spectrumfilaments\.com\/[a-z-]+\/\d+-[a-z0-9-]+\.html$/i, // PrestaShop pattern
      ],
      'matterhackers': [
        /matterhackers\.com\/store\/l\/[^\/]+\/ln\//i,
      ],
      'ic3d printers': [
        /ic3dprinters\.com\/shop\/[^\/]+\/[^\/]+\/?$/i,
      ],
      'geeetech': [
        /geeetech\.com\/[a-z0-9-]+-p-\d+\.html$/i,  // Pattern: /product-name-p-123.html
      ],
    };

    // Check brand-specific patterns first
    const patterns = brandPatterns[vendor];
    if (patterns) {
      for (const pattern of patterns) {
        if (pattern.test(url)) {
          return true;
        }
      }
    }

    // Generic product URL detection
    const isProductLike = 
      (lowerUrl.includes('/shop/') && lowerUrl.split('/').filter(Boolean).length >= 4) ||
      lowerUrl.includes('/product/') ||
      lowerUrl.includes('/products/') ||
      (lowerUrl.includes('filament') && !lowerUrl.endsWith('/filament') && !lowerUrl.endsWith('/filament/')) ||
      /-pla[-\.]/.test(lowerUrl) ||
      /-petg[-\.]/.test(lowerUrl) ||
      /-abs[-\.]/.test(lowerUrl) ||
      /-tpu[-\.]/.test(lowerUrl);
    
    return isProductLike;
  }
  private parseResponse(data: any, url: string): ScrapedProduct | null {
    const content = data.data || data;
    const html = content.html || "";
    const markdown = content.markdown || "";
    const metadata = content.metadata || {};

    // Extract title from metadata or markdown
    const title = this.extractTitle(metadata, markdown, html);

    if (!title) {
      this.log(`Could not extract title from ${url}`);
      return null;
    }

    // Extract price using multiple strategies
    const price = this.extractPriceFromContent(html, markdown);

    // Extract availability
    const available = this.extractAvailabilityFromContent(html, markdown);

    // Extract product ID from URL
    const productId = this.extractProductIdFromUrl(url);

    // Extract image from multiple sources
    const imageUrl = this.extractImageFromContent(html, metadata);

    // Extract barcode/GTIN from structured data
    const barcode = this.extractBarcode(html);

    // Extract enhanced data
    const tdsUrl = findTdsUrl(html) || this.extractTdsFromMarkdown(markdown);
    const printSettings = extractPrintSettings(html) || extractPrintSettings(markdown);
    const spoolSpecs = extractSpoolSpecs(markdown, title);
    const mpn = extractMpnFromHtml(html);
    
    // Use intelligent color extraction
    const colorInfo = this.extractColorFromText(title);

    return {
      productId,
      sku: productId,
      title,
      price: price ? this.convertToUSD(price) : null,
      compareAtPrice: this.extractCompareAtPrice(html, markdown),
      available,
      currency: this.config.currency,
      url,
      scrapedAt: new Date(),
      source: `firecrawl-${this.config.vendor.toLowerCase().replace(/\s+/g, "-")}`,
      imageUrl,
      barcode,
      description: markdown?.substring(0, 2000) || null,
      // Enhanced fields
      mpn,
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

  private extractTdsFromMarkdown(markdown: string): string | null {
    if (!markdown) return null;
    
    // Look for TDS/datasheet links in markdown
    const patterns = [
      /\[(?:TDS|Technical Data Sheet|Datasheet|Specifications?)\]\(([^)]+\.pdf)\)/gi,
      /\[(?:Download|View)\s+(?:TDS|Technical Data Sheet)\]\(([^)]+)\)/gi,
      /(?:TDS|datasheet|technical[\s-]?data)[\s\S]{0,50}(https?:\/\/[^\s]+\.pdf)/gi,
    ];
    
    for (const pattern of patterns) {
      const match = markdown.match(pattern);
      if (match && match[1]) {
        return match[1];
      }
    }
    
    return null;
  }

  private extractImageFromContent(html: string, metadata: any): string | null {
    // Try OG image first
    if (metadata?.ogImage?.[0]?.url) {
      return metadata.ogImage[0].url;
    }

    // Try meta og:image
    const ogMatch = html.match(/<meta[^>]*property=["']og:image["'][^>]*content=["']([^"']+)["']/i);
    if (ogMatch) return ogMatch[1];

    // Try JSON-LD image
    const jsonLdMatch = html.match(/"image":\s*"([^"]+)"/);
    if (jsonLdMatch) return jsonLdMatch[1];

    // Try common product image patterns
    const patterns = [
      /<img[^>]*class="[^"]*product[^"]*image[^"]*"[^>]*src="([^"]+)"/i,
      /<img[^>]*id="[^"]*product[^"]*image[^"]*"[^>]*src="([^"]+)"/i,
      /data-zoom-image="([^"]+)"/i,
    ];

    for (const pattern of patterns) {
      const match = html.match(pattern);
      if (match && match[1] && !match[1].includes('placeholder')) {
        return match[1];
      }
    }

    return null;
  }

  private extractBarcode(html: string): string | null {
    // Try JSON-LD GTIN patterns
    const patterns = [
      /"gtin14":\s*"([^"]+)"/,
      /"gtin13":\s*"([^"]+)"/,
      /"gtin12":\s*"([^"]+)"/,
      /"gtin":\s*"([^"]+)"/,
      /"ean":\s*"([^"]+)"/,
      /"upc":\s*"([^"]+)"/,
      /itemprop=["']gtin["'][^>]*content=["']([^"']+)["']/i,
    ];

    for (const pattern of patterns) {
      const match = html.match(pattern);
      if (match && match[1]) {
        return match[1];
      }
    }

    return null;
  }

  private extractTitle(metadata: any, markdown: string, html: string): string | null {
    // Try metadata title first
    if (metadata.title) {
      // Clean up common suffixes
      return metadata.title
        .replace(/\s*[-|–]\s*(FormFutura|MatterHackers|Shop|Buy|Order).*$/i, "")
        .replace(/\s*\|\s*.*$/, "")
        .trim();
    }

    // Try H1 from markdown
    const h1Match = markdown.match(/^#\s+(.+)$/m);
    if (h1Match) {
      return h1Match[1].trim();
    }

    // Try HTML title or h1
    const htmlTitleMatch = html.match(/<h1[^>]*>([^<]+)<\/h1>/i);
    if (htmlTitleMatch) {
      return htmlTitleMatch[1].trim();
    }

    return null;
  }

  private extractPriceFromContent(html: string, markdown: string): number | null {
    // Strategy 1: JSON-LD structured data
    const jsonLdPrice = this.extractJsonLdPrice(html);
    if (jsonLdPrice) return jsonLdPrice;

    // Strategy 2: Meta tags
    const metaPrice = this.extractMetaPrice(html);
    if (metaPrice) return metaPrice;

    // Strategy 3: Common price class patterns
    const htmlPrice = this.extractHtmlPrice(html);
    if (htmlPrice) return htmlPrice;

    // Strategy 4: Markdown price patterns
    const mdPrice = extractPrice(markdown);
    if (mdPrice) return mdPrice;

    return null;
  }

  private extractJsonLdPrice(html: string): number | null {
    try {
      // Match JSON-LD script blocks
      const jsonLdMatches = html.matchAll(/<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi);
      
      for (const match of jsonLdMatches) {
        try {
          const data = JSON.parse(match[1]);
          
          // Direct price
          if (data.offers?.price) {
            return this.parsePrice(data.offers.price);
          }
          
          // Array of offers
          if (Array.isArray(data.offers)) {
            for (const offer of data.offers) {
              if (offer.price) {
                return this.parsePrice(offer.price);
              }
            }
          }

          // Product with offers
          if (data["@type"] === "Product" && data.offers?.price) {
            return this.parsePrice(data.offers.price);
          }
        } catch {
          continue;
        }
      }
    } catch {
      // Ignore JSON parsing errors
    }

    return null;
  }

  private extractMetaPrice(html: string): number | null {
    const patterns = [
      /property=["']og:price:amount["'][^>]*content=["']([^"']+)["']/i,
      /name=["']price["'][^>]*content=["']([^"']+)["']/i,
      /itemprop=["']price["'][^>]*content=["']([^"']+)["']/i,
    ];

    for (const pattern of patterns) {
      const match = html.match(pattern);
      if (match) {
        return this.parsePrice(match[1]);
      }
    }

    return null;
  }

  private extractHtmlPrice(html: string): number | null {
    // Platform-specific patterns first
    const platformPatterns = [
      // GEEETECH custom store patterns (check first)
      /class=["'][^"']*products-list-item-price-special[^"']*["'][^>]*>\s*\$?([\d.,]+)/gi,
      /class=["'][^"']*special-price[^"']*["'][^>]*>\s*\$?([\d.,]+)/gi,
      
      // Microcenter patterns
      /id=["']pricing["'][^>]*>.*?[\$€£]\s*([\d.,]+)/gis,
      /class=["'][^"']*productPrice[^"']*["'][^>]*>\s*[\$€£]?\s*([\d.,]+)/gi,
      
      // Magento patterns
      /class=["'][^"']*price-box[^"']*["'].*?[\$€£]\s*([\d.,]+)/gis,
      /class=["'][^"']*product-info-price[^"']*["'].*?[\$€£]\s*([\d.,]+)/gis,
      /data-price-type=["']finalPrice["'][^>]*data-price-amount=["']([\d.,]+)["']/gi,
      
      // PrestaShop patterns
      /class=["'][^"']*current-price[^"']*["'][^>]*>.*?[\$€£]\s*([\d.,]+)/gis,
      /itemprop=["']price["'][^>]*content=["']([\d.,]+)["']/gi,
    ];

    for (const pattern of platformPatterns) {
      const matches = html.matchAll(pattern);
      for (const match of matches) {
        const price = this.parsePrice(match[1]);
        if (price && price > 5 && price < 500) {
          return price;
        }
      }
    }
    
    // Common e-commerce price class patterns
    const patterns = [
      /class=["'][^"']*price[^"']*["'][^>]*>\s*(?:[\$€£]\s*)?([\d.,]+)/gi,
      /id=["']product-price[^"']*["'][^>]*>\s*(?:[\$€£]\s*)?([\d.,]+)/gi,
      /class=["'][^"']*current-price[^"']*["'][^>]*>\s*(?:[\$€£]\s*)?([\d.,]+)/gi,
      /data-price=["']([\d.,]+)["']/gi,
      /<span[^>]*class=["'][^"']*woocommerce-Price-amount[^"']*["'][^>]*>.*?([\d.,]+)/gi,
    ];

    for (const pattern of patterns) {
      const matches = html.matchAll(pattern);
      for (const match of matches) {
        const price = this.parsePrice(match[1]);
        if (price && price > 5 && price < 500) {
          return price;
        }
      }
    }

    // Last resort: find any price-like pattern
    const genericMatch = html.match(/(?:€|\$|£|EUR|USD)\s*([\d.,]+)/);
    if (genericMatch) {
      return this.parsePrice(genericMatch[1]);
    }

    return null;
  }

  private extractCompareAtPrice(html: string, markdown: string): number | null {
    // Look for original/compare-at price patterns
    const patterns = [
      /class=["'][^"']*(?:was-price|compare-at|original-price|old-price)[^"']*["'][^>]*>\s*(?:[\$€£]\s*)?([\d.,]+)/gi,
      /data-compare-at-price=["']([\d.,]+)["']/gi,
    ];

    for (const pattern of patterns) {
      const match = html.match(pattern);
      if (match) {
        return this.parsePrice(match[1]);
      }
    }

    return null;
  }

  private extractAvailabilityFromContent(html: string, markdown: string): boolean {
    const combined = html + markdown;
    
    // Check for out of stock indicators
    const outOfStockPatterns = [
      /out\s*of\s*stock/i,
      /sold\s*out/i,
      /unavailable/i,
      /not\s*available/i,
      /currently\s*not\s*in\s*stock/i,
      /"availability":\s*"OutOfStock"/i,
      /"availability":\s*"https?:\/\/schema\.org\/OutOfStock"/i,
    ];

    for (const pattern of outOfStockPatterns) {
      if (pattern.test(combined)) {
        return false;
      }
    }

    // Check for in stock indicators
    const inStockPatterns = [
      /in\s*stock/i,
      /add\s*to\s*cart/i,
      /add\s*to\s*basket/i,
      /buy\s*now/i,
      /"availability":\s*"InStock"/i,
      /"availability":\s*"https?:\/\/schema\.org\/InStock"/i,
    ];

    for (const pattern of inStockPatterns) {
      if (pattern.test(combined)) {
        return true;
      }
    }

    // Default to available if no clear indicator
    return true;
  }

  private extractProductIdFromUrl(url: string): string {
    // Microcenter: /product/{sku}/product-name
    const microcenterMatch = url.match(/microcenter\.com\/product\/(\d+)/);
    if (microcenterMatch) {
      return microcenterMatch[1];
    }

    // FormFutura: /products/product-name
    const formFuturaMatch = url.match(/formfutura\.com\/[^/]+\/([^/?]+)/);
    if (formFuturaMatch) {
      return formFuturaMatch[1];
    }

    // MatterHackers: /store/l/product-name/ln/sku
    const matterHackersMatch = url.match(/matterhackers\.com\/store\/l\/([^/?]+)/);
    if (matterHackersMatch) {
      return matterHackersMatch[1];
    }

    // Magento: /catalog/product/view/id/{id}
    const magentoMatch = url.match(/\/catalog\/product\/view\/id\/(\d+)/);
    if (magentoMatch) {
      return magentoMatch[1];
    }

    // PrestaShop: /{category}/{id}-{slug}.html
    const prestashopMatch = url.match(/\/(\d+)-[^/]+\.html/);
    if (prestashopMatch) {
      return prestashopMatch[1];
    }

    // Generic: last path segment
    const genericMatch = url.match(/\/([^/?]+)\/?(?:\?.*)?$/);
    if (genericMatch) {
      return genericMatch[1];
    }

    // Fallback: hash the URL
    return url.split("/").pop() || url;
  }

  /**
   * Intelligent color extraction from product text
   */
  private extractColorFromText(text: string): { name: string; hex: string } | null {
    if (!text) return null;
    
    const words = text.split(/[\s\-_,]+/);
    
    for (const word of words) {
      const classification = classifyVariant(word);
      if (classification.isColorVariant && classification.colorName) {
        const info = extractColorInfo(classification.colorName);
        if (info) {
          return { name: info.name, hex: info.hex };
        }
      }
    }
    
    const textLower = text.toLowerCase();
    for (const [colorName, hex] of Object.entries(COLOR_HEX_MAP)) {
      if (textLower.includes(colorName)) {
        return { name: colorName.charAt(0).toUpperCase() + colorName.slice(1), hex };
      }
    }
    
    return null;
  }
}
