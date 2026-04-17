import { BaseScraper, type ScrapedProduct } from "./base.ts";
import type { BrandConfig } from "../config.ts";
import { extractPrice, extractAvailability, findTdsUrl, extractPrintSettings, extractSpoolSpecs, extractMpnFromHtml, classifyVariant, extractColorInfo, COLOR_HEX_MAP, intelligentTitleClean } from "../utils.ts";

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
    
    this.log(`Discovering products via Firecrawl from: ${baseUrl}`);

    try {
      // For GEEETECH, use fast HTML extraction (single call, no individual product scraping)
      if (vendor === 'geeetech') {
        this.log(`Using FAST category page extraction for GEEETECH`);
        const geeetechProducts = await this.extractGeeetechProductsFromHtml(baseUrl);
        this.log(`Successfully extracted ${geeetechProducts.length} GEEETECH products`);
        return geeetechProducts.slice(0, limit);
      }

      // For TECBEARS via 3dfilamentprofiles.com, use specialized extraction
      if (vendor === 'tecbears' && baseUrl.includes('3dfilamentprofiles.com')) {
        this.log(`Using 3dfilamentprofiles.com extraction for TECBEARS`);
        const tecbearsProducts = await this.extract3DFilamentProfilesProducts(baseUrl);
        this.log(`Successfully extracted ${tecbearsProducts.length} TECBEARS products`);
        return tecbearsProducts.slice(0, limit);
      }

      // TreeD Filaments - WooCommerce with custom structure
      if (vendor === 'treed filaments' || baseUrl.includes('treedfilaments.com')) {
        this.log(`Using TreeD Filaments extraction`);
        const treedProducts = await this.extractTreeDFilamentsProducts(baseUrl);
        this.log(`Successfully extracted ${treedProducts.length} TreeD Filaments products`);
        return treedProducts.slice(0, limit);
      }

      // Fusion Filaments - Odoo platform
      if (vendor === 'fusion filaments' || baseUrl.includes('fusionfilaments.com')) {
        this.log(`Using Fusion Filaments extraction`);
        const fusionProducts = await this.extractFusionFilamentsProducts(baseUrl);
        this.log(`Successfully extracted ${fusionProducts.length} Fusion Filaments products`);
        return fusionProducts.slice(0, limit);
      }

      // Extrudr - Custom Austrian platform
      if (vendor === 'extrudr' || baseUrl.includes('extrudr.com')) {
        this.log(`Using Extrudr extraction`);
        const extrudrProducts = await this.extractExtrudrProducts(baseUrl);
        this.log(`Successfully extracted ${extrudrProducts.length} Extrudr products`);
        return extrudrProducts.slice(0, limit);
      }

      // Creality - Shopify with collection page
      if (vendor === 'creality' || baseUrl.includes('store.creality.com')) {
        this.log(`Using Creality extraction`);
        const crealityProducts = await this.extractCrealityProducts(baseUrl);
        this.log(`Successfully extracted ${crealityProducts.length} Creality products`);
        return crealityProducts.slice(0, limit);
      }

      // Spectrum Filaments - IdoSell platform
      if (vendor === 'spectrum filaments' || baseUrl.includes('spectrumfilaments.com')) {
        this.log(`Using Spectrum Filaments extraction`);
        const spectrumProducts = await this.extractSpectrumProducts(baseUrl);
        this.log(`Successfully extracted ${spectrumProducts.length} Spectrum products`);
        return spectrumProducts.slice(0, limit);
      }

      // Gizmo Dorks - BigCommerce platform
      if (vendor === 'gizmo dorks' || baseUrl.includes('gizmodorks.com')) {
        this.log(`Using Gizmo Dorks extraction`);
        const gizmoDorksProducts = await this.extractGizmoDorksProducts(baseUrl);
        this.log(`Successfully extracted ${gizmoDorksProducts.length} Gizmo Dorks products`);
        return gizmoDorksProducts.slice(0, limit);
      }

      // IC3D Printers - WooCommerce with custom structure
      if (vendor === 'ic3d printers' || baseUrl.includes('ic3dprinters.com')) {
        this.log(`Using IC3D Printers extraction`);
        const ic3dProducts = await this.extractIC3DProducts(baseUrl);
        this.log(`Successfully extracted ${ic3dProducts.length} IC3D Printers products`);
        return ic3dProducts.slice(0, limit);
      }

      let productUrls: string[] = [];
      
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

      // Filter for product URLs using brand-specific patterns
      productUrls = mapData.links.filter((url: string) => {
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
                title.includes('carbon fiber') ||
                title.includes('asa') ||
                title.includes('silk')) {
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
   * GEEETECH Fast Extraction - Extract ALL product data from category page HTML in single call
   * This avoids timeouts by not making individual product page requests
   */
  private async extractGeeetechProductsFromHtml(categoryUrl: string): Promise<ScrapedProduct[]> {
    const products: ScrapedProduct[] = [];
    const seenIds = new Set<string>();
    
    // All GEEETECH filament category URLs to scrape
    const categoryUrls = [
      categoryUrl, // Main filament page
      "https://www.geeetech.com/filament-pla-c-83_111.html",
      "https://www.geeetech.com/filament-petg-c-83_124.html",
      "https://www.geeetech.com/filament-silksilk-dual-tricolor-c-83_113.html",
      "https://www.geeetech.com/filament-tpu-c-83_130.html",
      "https://www.geeetech.com/filament-absasapcnyloncf-c-83_129.html",
    ];

    for (const url of categoryUrls) {
      try {
        this.log(`Extracting products from: ${url}`);
        
        const scrapeResponse = await fetch("https://api.firecrawl.dev/v1/scrape", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${this.firecrawlApiKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            url,
            formats: ["html"],
            waitFor: 3000,
          }),
        });

        if (!scrapeResponse.ok) {
          this.logError(`Failed to scrape ${url}: ${scrapeResponse.status}`);
          continue;
        }

        const data = await scrapeResponse.json();
        const html = data.data?.html || data.html || "";
        
        if (!html) {
          this.log(`No HTML returned for ${url}`);
          continue;
        }

        // Extract product blocks - GEEETECH uses products-list-item divs
        // Pattern matches the product container including all data
        const productBlockPattern = /<div[^>]*class="[^"]*products-list-item[^"]*"[^>]*>([\s\S]*?)(?=<div[^>]*class="[^"]*products-list-item[^"]*"|<\/div>\s*<\/div>\s*<\/div>\s*<div[^>]*class="[^"]*pagination|$)/gi;
        
        let match;
        let blockCount = 0;
        
        // Alternative: split by product blocks more reliably
        const productBlocks = html.split(/(?=<div[^>]*class="[^"]*products-list-item(?:\s|")[^"]*")/gi);
        
        for (const block of productBlocks) {
          if (!block.includes('products-list-item')) continue;
          blockCount++;
          
          // Extract product URL
          const urlMatch = block.match(/href=["'](https?:\/\/www\.geeetech\.com\/[a-z0-9-]+-p-\d+\.html)["']/i) ||
                          block.match(/href=["']\/([a-z0-9-]+-p-\d+\.html)["']/i);
          
          // Extract title
          const titleMatch = block.match(/class="[^"]*products-list-item-name[^"]*"[^>]*>[\s\S]*?<a[^>]*>([^<]+)<\/a>/i) ||
                            block.match(/<a[^>]*class="[^"]*product-title[^"]*"[^>]*>([^<]+)<\/a>/i) ||
                            block.match(/title=["']([^"']+)["'][^>]*class="[^"]*product/i);
          
          // Extract image
          const imgMatch = block.match(/<img[^>]*src=["']([^"']+)["'][^>]*alt/i) ||
                          block.match(/data-src=["']([^"']+)["']/i);
          
          // Extract sale price (special price)
          const priceMatch = block.match(/class="[^"]*products-list-item-price-special[^"]*"[^>]*>\s*\$?([\d.,]+)/i) ||
                            block.match(/class="[^"]*special-price[^"]*"[^>]*>\s*\$?([\d.,]+)/i) ||
                            block.match(/class="[^"]*price[^"]*"[^>]*>\s*\$?([\d.,]+)/i);
          
          // Extract compare-at price (normal/old price)
          const compareMatch = block.match(/class="[^"]*products-list-item-price-normal[^"]*"[^>]*>\s*\$?([\d.,]+)/i) ||
                              block.match(/class="[^"]*old-price[^"]*"[^>]*>\s*\$?([\d.,]+)/i);
          
          // Extract nozzle temperature
          const tempMatch = block.match(/Nozzle\s*Temp[:\s]*(\d+)\s*°?C?\s*[-–]\s*(\d+)/i) ||
                           block.match(/(\d{3})\s*°?C?\s*[-–]\s*(\d{3})/);
          
          // Extract product ID
          const idMatch = block.match(/data-products-id=["'](\d+)["']/i) ||
                         block.match(/-p-(\d+)\.html/i);
          
          if (titleMatch && priceMatch) {
            const title = titleMatch[1].trim();
            const productUrl = urlMatch ? 
              (urlMatch[1].startsWith('http') ? urlMatch[1] : `https://www.geeetech.com/${urlMatch[1]}`) : 
              '';
            const productId = idMatch?.[1] || this.extractProductIdFromUrl(productUrl);
            
            // Skip if we've already seen this product
            if (seenIds.has(productId)) continue;
            seenIds.add(productId);
            
            const price = parseFloat(priceMatch[1].replace(',', ''));
            const comparePrice = compareMatch ? parseFloat(compareMatch[1].replace(',', '')) : null;
            
            // Detect material from title
            const material = this.detectMaterial(title);
            const colorInfo = this.extractColorFromText(title);
            
            const product: ScrapedProduct = {
              productId,
              sku: productId,
              title,
              price: price > 0 ? price : null,
              compareAtPrice: comparePrice,
              available: true,
              currency: "USD",
              url: productUrl,
              scrapedAt: new Date(),
              source: "firecrawl-geeetech",
              imageUrl: imgMatch?.[1] || null,
              barcode: null,
              description: null,
              mpn: null,
              tdsUrl: null,
              colorHex: colorInfo?.hex || null,
              colorName: colorInfo?.name || null,
              nozzleTempMin: tempMatch ? parseInt(tempMatch[1]) : null,
              nozzleTempMax: tempMatch ? parseInt(tempMatch[2]) : null,
              bedTempMin: null,
              bedTempMax: null,
              spoolMaterial: null,
              netWeightG: this.extractWeightFromTitle(title),
              diameterMm: this.extractDiameterFromTitle(title),
              spoolOuterDiameterMm: null,
              spoolWidthMm: null,
            };
            
            products.push(product);
            this.log(`✓ Extracted: ${title} - $${price}${material ? ` (${material})` : ''}`);
          }
        }
        
        this.log(`Found ${blockCount} product blocks in ${url}`);
        
        // Small delay between category pages
        await new Promise(resolve => setTimeout(resolve, 500));
        
      } catch (error) {
        this.logError(`Error extracting from ${url}:`, error);
      }
    }
    
    this.log(`Total unique GEEETECH products extracted: ${products.length}`);
    return products;
  }

  /**
   * 3DFilamentProfiles.com Extraction for TECBEARS
   * Parses Markdown table format to extract product data directly
   */
  private async extract3DFilamentProfilesProducts(categoryUrl: string): Promise<ScrapedProduct[]> {
    const products: ScrapedProduct[] = [];
    const seenIds = new Set<string>();
    
    // Pages to scrape (3 pages of TECBEARS products)
    const pageUrls = [
      categoryUrl,
      `${categoryUrl}?page=2`,
      `${categoryUrl}?page=3`,
    ];
    
    for (const pageUrl of pageUrls) {
      try {
        this.log(`Scraping page: ${pageUrl}`);
        
        const scrapeResponse = await fetch("https://api.firecrawl.dev/v1/scrape", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${this.firecrawlApiKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            url: pageUrl,
            formats: ["markdown"],
            waitFor: 3000,
          }),
        });

        if (!scrapeResponse.ok) {
          this.logError(`Failed to scrape ${pageUrl}: ${scrapeResponse.status}`);
          continue;
        }

        const data = await scrapeResponse.json();
        const markdown = data.data?.markdown || data.markdown || "";
        
        if (!markdown) {
          this.log(`No markdown content for ${pageUrl}`);
          continue;
        }

        this.log(`Got Markdown (${markdown.length} chars) from ${pageUrl}`);

        // Parse table rows from markdown
        // Format: | Brand | Material | Type | Color | RGB Hex | TD | Price | Deal | Edit |
        // Each cell contains markdown links like [text](url)
        
        // Split into lines and find table rows
        const lines = markdown.split('\n');
        let inTable = false;
        
        for (const line of lines) {
          // Skip header rows and separator rows
          if (line.includes('Brand') && line.includes('Material') && line.includes('Color')) {
            inTable = true;
            continue;
          }
          if (line.match(/^\|[\s-:]+\|/)) continue;
          if (!line.startsWith('|') || !line.includes('TecBears')) continue;
          
          inTable = true;
          
          // Parse the table row cells
          const cells = line.split('|').map((c: string) => c.trim()).filter((c: string) => c);
          
          if (cells.length < 7) continue;
          
          // Extract data from cells
          // Cell 0: Brand (TecBears)
          // Cell 1: Material (e.g., [ABS](url))
          // Cell 2: Type (e.g., [Basic](url))
          // Cell 3: Color (e.g., [Black](url))
          // Cell 4: RGB Hex (e.g., #1A1A1A or empty)
          // Cell 5: TD (technical data indicator)
          // Cell 6: Price (e.g., [$18.99](amazon-url) or empty)
          
          // Extract material
          const materialMatch = cells[1]?.match(/\[([^\]]+)\]/);
          const material = materialMatch ? materialMatch[1].trim() : null;
          
          // Extract type
          const typeMatch = cells[2]?.match(/\[([^\]]+)\]/);
          const type = typeMatch ? typeMatch[1].trim() : null;
          
          // Extract color and detail URL
          const colorMatch = cells[3]?.match(/\[([^\]]+)\]\(([^)]+)\)/);
          const colorName = colorMatch ? colorMatch[1].trim() : null;
          const detailUrl = colorMatch ? colorMatch[2] : null;
          
          // Extract product ID from detail URL
          let productId: string | null = null;
          if (detailUrl) {
            const idMatch = detailUrl.match(/\/filament\/details\/(\d+)/);
            if (idMatch) {
              productId = idMatch[1];
            }
          }
          
          if (!productId) {
            // Generate ID from material+type+color
            productId = `tecbears-${(material || 'unknown')}-${(type || 'basic')}-${(colorName || 'unknown')}`.toLowerCase().replace(/\s+/g, '-');
          }
          
          if (seenIds.has(productId)) continue;
          seenIds.add(productId);
          
          // Extract hex color
          let colorHex: string | null = null;
          const hexMatch = cells[4]?.match(/#([0-9A-Fa-f]{6})/);
          if (hexMatch) {
            colorHex = `#${hexMatch[1].toUpperCase()}`;
          }
          
          // Extract price and Amazon URL
          let price: number | null = null;
          let amazonUrl: string | null = null;
          const priceCell = cells[6] || '';
          const priceMatch = priceCell.match(/\[\$?([\d.]+)\]\(([^)]+)\)/);
          if (priceMatch) {
            price = parseFloat(priceMatch[1]);
            amazonUrl = priceMatch[2];
            if (price <= 0 || price > 500) price = null;
          } else {
            // Try plain price without link
            const plainPriceMatch = priceCell.match(/\$?([\d.]+)/);
            if (plainPriceMatch) {
              price = parseFloat(plainPriceMatch[1]);
              if (price <= 0 || price > 500) price = null;
            }
          }
          
          // Build product title
          const titleParts = ['TecBears'];
          if (material) titleParts.push(material);
          if (type && type.toLowerCase() !== 'basic') titleParts.push(type);
          if (colorName) titleParts.push(colorName);
          const productTitle = titleParts.join(' ');
          
          // Build full product URL
          const productUrl = detailUrl 
            ? (detailUrl.startsWith('http') ? detailUrl : `https://3dfilamentprofiles.com${detailUrl}`)
            : amazonUrl || `https://3dfilamentprofiles.com/filaments/tecbears`;
          
          // Create product entry
          const product: ScrapedProduct = {
            productId,
            sku: null,
            title: productTitle,
            price: price,
            compareAtPrice: null,
            available: true,
            currency: "USD",
            url: amazonUrl || productUrl, // Prefer Amazon URL for purchase
            scrapedAt: new Date(),
            source: "3dfilamentprofiles",
            imageUrl: null, // No images in table
            barcode: null,
            description: material ? `${material} filament${type ? ` - ${type}` : ''}` : null,
            mpn: null,
            tdsUrl: null,
            colorHex,
            colorName,
            nozzleTempMin: null,
            nozzleTempMax: null,
            bedTempMin: null,
            bedTempMax: null,
            spoolMaterial: null,
            netWeightG: 1000, // Default 1kg
            diameterMm: 1.75, // Default 1.75mm
            spoolOuterDiameterMm: null,
            spoolWidthMm: null,
          };
          
          products.push(product);
          this.log(`✓ ${productTitle}${price ? ` - $${price}` : ''}${colorHex ? ` (${colorHex})` : ''}`);
        }
        
        // Rate limiting between pages
        await new Promise(resolve => setTimeout(resolve, 1000));
        
      } catch (error) {
        this.logError(`Error scraping page ${pageUrl}:`, error);
      }
    }
    
    this.log(`Total TECBEARS products extracted: ${products.length}`);
    return products;
  }

  /**
   * TreeD Filaments Extraction - WooCommerce with card-based layout
   */
  private async extractTreeDFilamentsProducts(baseUrl: string): Promise<ScrapedProduct[]> {
    const products: ScrapedProduct[] = [];
    const seenIds = new Set<string>();
    
    try {
      this.log(`Scraping TreeD Filaments from: ${baseUrl}`);
      
      const scrapeResponse = await fetch("https://api.firecrawl.dev/v1/scrape", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${this.firecrawlApiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          url: baseUrl,
          formats: ["markdown", "html"],
          waitFor: 3000,
        }),
      });

      if (!scrapeResponse.ok) {
        this.logError(`Failed to scrape TreeD: ${scrapeResponse.status}`);
        return [];
      }

      const data = await scrapeResponse.json();
      const markdown = data.data?.markdown || data.markdown || "";
      const html = data.data?.html || data.html || "";
      
      this.log(`Got content (${markdown.length} md, ${html.length} html chars)`);

      // Parse markdown for product blocks
      // Pattern: [![ProductName](imageUrl)... **ProductName** Polymer: X **€ XX.XX**](productUrl)
      const productPattern = /\[!\[([^\]]+)\]\(([^)]+)\)[^\]]*\*\*([^*]+)\*\*[^*]*Polymer:\s*([A-Za-z0-9+\-\/]+)[^€]*\*\*€\s*([\d.,]+)\*\*\]\(([^)]+)\)/gi;
      
      let match;
      while ((match = productPattern.exec(markdown)) !== null) {
        const [, altText, imageUrl, productName, material, priceStr, productUrl] = match;
        
        // Extract SKU from URL
        const skuMatch = productUrl.match(/\?sku=([A-Z0-9]+)/i);
        const sku = skuMatch ? skuMatch[1] : null;
        const productId = sku || productName.toLowerCase().replace(/\s+/g, '-');
        
        if (seenIds.has(productId)) continue;
        seenIds.add(productId);
        
        const price = parseFloat(priceStr.replace(',', '.'));
        const colorInfo = this.extractColorFromText(productName);
        
        const product: ScrapedProduct = {
          productId,
          sku,
          title: productName.trim(),
          price: price > 0 ? price * 1.08 : null, // Convert EUR to USD
          compareAtPrice: null,
          available: true,
          currency: "EUR",
          url: productUrl.startsWith('http') ? productUrl : `https://treedfilaments.com${productUrl}`,
          scrapedAt: new Date(),
          source: "firecrawl-treed",
          imageUrl: imageUrl || null,
          barcode: null,
          description: `${material} filament`,
          mpn: sku,
          tdsUrl: null,
          colorHex: colorInfo?.hex || null,
          colorName: colorInfo?.name || null,
          nozzleTempMin: null,
          nozzleTempMax: null,
          bedTempMin: null,
          bedTempMax: null,
          spoolMaterial: null,
          netWeightG: 750, // TreeD standard spool
          diameterMm: 1.75,
          spoolOuterDiameterMm: null,
          spoolWidthMm: null,
        };
        
        products.push(product);
        this.log(`✓ ${productName} - €${priceStr} (${material})`);
      }

      // Fallback: parse HTML for product links if markdown didn't work
      if (products.length === 0) {
        const htmlProductPattern = /<a[^>]*href=["']([^"']*\?sku=[^"']+)["'][^>]*>[\s\S]*?<img[^>]*src=["']([^"']+)["'][^>]*>[\s\S]*?(?:<h[23][^>]*>([^<]+)<\/h[23]>|class="[^"]*title[^"]*"[^>]*>([^<]+)<)/gi;
        
        while ((match = htmlProductPattern.exec(html)) !== null) {
          const [, productUrl, imageUrl, title1, title2] = match;
          const title = (title1 || title2 || '').trim();
          if (!title) continue;
          
          const skuMatch = productUrl.match(/\?sku=([A-Z0-9]+)/i);
          const productId = skuMatch ? skuMatch[1] : title.toLowerCase().replace(/\s+/g, '-');
          
          if (seenIds.has(productId)) continue;
          seenIds.add(productId);
          
          const product: ScrapedProduct = {
            productId,
            sku: skuMatch?.[1] || null,
            title,
            price: null,
            compareAtPrice: null,
            available: true,
            currency: "EUR",
            url: productUrl.startsWith('http') ? productUrl : `https://treedfilaments.com${productUrl}`,
            scrapedAt: new Date(),
            source: "firecrawl-treed",
            imageUrl,
            barcode: null,
            description: null,
            mpn: skuMatch?.[1] || null,
            tdsUrl: null,
            colorHex: null,
            colorName: null,
            nozzleTempMin: null,
            nozzleTempMax: null,
            bedTempMin: null,
            bedTempMax: null,
            spoolMaterial: null,
            netWeightG: 750,
            diameterMm: 1.75,
            spoolOuterDiameterMm: null,
            spoolWidthMm: null,
          };
          
          products.push(product);
          this.log(`✓ ${title}`);
        }
      }
      
    } catch (error) {
      this.logError(`Error extracting TreeD products:`, error);
    }
    
    this.log(`Total TreeD Filaments products: ${products.length}`);
    return products;
  }

  /**
   * Fusion Filaments Extraction - Odoo platform with pagination
   */
  private async extractFusionFilamentsProducts(baseUrl: string): Promise<ScrapedProduct[]> {
    const products: ScrapedProduct[] = [];
    const seenIds = new Set<string>();
    
    // Pagination URLs
    const pageUrls = [
      baseUrl,
      `${baseUrl}?page=2`,
      `${baseUrl}?page=3`,
    ];
    
    for (const pageUrl of pageUrls) {
      try {
        this.log(`Scraping Fusion Filaments page: ${pageUrl}`);
        
        const scrapeResponse = await fetch("https://api.firecrawl.dev/v1/scrape", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${this.firecrawlApiKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            url: pageUrl,
            formats: ["markdown"],
            waitFor: 3000,
          }),
        });

        if (!scrapeResponse.ok) {
          this.logError(`Failed to scrape Fusion page: ${scrapeResponse.status}`);
          continue;
        }

        const data = await scrapeResponse.json();
        const markdown = data.data?.markdown || data.markdown || "";
        
        this.log(`Got markdown (${markdown.length} chars)`);

        // Parse product entries
        // Pattern: [![[SKU] Product Name](imageUrl)](productUrl)
        // ###### [Product Name](productUrl)
        // $ XX.XXUSD
        const productBlockPattern = /\[!\[\[([^\]]+)\]\s*([^\]]+)\]\(([^)]+)\)\]\(([^)]+)\)[\s\S]*?#{6}\s*\[[^\]]+\]\([^)]+\)[\s\S]*?\$\s*([\d.]+)(?:[\d.]+)?USD/gi;
        
        let match;
        while ((match = productBlockPattern.exec(markdown)) !== null) {
          const [, sku, productName, imageUrl, productUrl, priceStr] = match;
          
          const productId = sku || productName.toLowerCase().replace(/\s+/g, '-');
          if (seenIds.has(productId)) continue;
          seenIds.add(productId);
          
          const price = parseFloat(priceStr);
          const material = this.detectMaterial(productName);
          const colorInfo = this.extractColorFromText(productName);
          const weight = this.extractWeightFromTitle(productName);
          
          const product: ScrapedProduct = {
            productId,
            sku,
            title: productName.trim(),
            price: price > 0 && price < 500 ? price : null,
            compareAtPrice: null,
            available: true,
            currency: "USD",
            url: productUrl.startsWith('http') ? productUrl : `https://www.fusionfilaments.com${productUrl}`,
            scrapedAt: new Date(),
            source: "firecrawl-fusion",
            imageUrl: imageUrl || null,
            barcode: null,
            description: material ? `${material} filament` : null,
            mpn: sku,
            tdsUrl: null,
            colorHex: colorInfo?.hex || null,
            colorName: colorInfo?.name || null,
            nozzleTempMin: null,
            nozzleTempMax: null,
            bedTempMin: null,
            bedTempMax: null,
            spoolMaterial: null,
            netWeightG: weight || 1000,
            diameterMm: 1.75,
            spoolOuterDiameterMm: null,
            spoolWidthMm: null,
          };
          
          products.push(product);
          this.log(`✓ ${productName} - $${price}${material ? ` (${material})` : ''}`);
        }

        // Simpler fallback pattern for Odoo
        if (products.length < 5) {
          const simplePattern = /\[([^\]]+Filament[^\]]*)\]\((\/shop\/[^)]+)\)[\s\S]*?\$\s*([\d.]+)/gi;
          while ((match = simplePattern.exec(markdown)) !== null) {
            const [, productName, productPath, priceStr] = match;
            const productId = productPath.split('/').pop() || productName.toLowerCase().replace(/\s+/g, '-');
            
            if (seenIds.has(productId)) continue;
            seenIds.add(productId);
            
            const price = parseFloat(priceStr);
            const colorInfo = this.extractColorFromText(productName);
            
            const product: ScrapedProduct = {
              productId,
              sku: null,
              title: productName.trim(),
              price: price > 0 && price < 500 ? price : null,
              compareAtPrice: null,
              available: true,
              currency: "USD",
              url: `https://www.fusionfilaments.com${productPath}`,
              scrapedAt: new Date(),
              source: "firecrawl-fusion",
              imageUrl: null,
              barcode: null,
              description: null,
              mpn: null,
              tdsUrl: null,
              colorHex: colorInfo?.hex || null,
              colorName: colorInfo?.name || null,
              nozzleTempMin: null,
              nozzleTempMax: null,
              bedTempMin: null,
              bedTempMax: null,
              spoolMaterial: null,
              netWeightG: 1000,
              diameterMm: 1.75,
              spoolOuterDiameterMm: null,
              spoolWidthMm: null,
            };
            
            products.push(product);
            this.log(`✓ ${productName} - $${price}`);
          }
        }
        
        await new Promise(resolve => setTimeout(resolve, 1000));
        
      } catch (error) {
        this.logError(`Error scraping Fusion page ${pageUrl}:`, error);
      }
    }
    
    this.log(`Total Fusion Filaments products: ${products.length}`);
    return products;
  }

  /**
   * Extrudr Extraction - Austrian custom platform
   * Scrapes individual material pages with comprehensive data extraction
   */
  private async extractExtrudrProducts(baseUrl: string): Promise<ScrapedProduct[]> {
    const products: ScrapedProduct[] = [];
    const seenIds = new Set<string>();
    
    // Hardcoded material slugs - verified from extrudr.com/en/inlt/products/
    const EXTRUDR_MATERIALS = [
      // PLA line
      'pla-basic', 'pla-nx2-matt',
      // PETG line
      'petg', 'pctg',
      // DuraPro Engineering materials
      'durapro-abs', 'durapro-abs-cf', 'durapro-asa', 'durapro-asa-cf', 
      'durapro-asa-gf', 'durapro-pa12', 'durapro-pc-pbt',
      // Bio/Natural materials
      'biofusion', 'greentec', 'greentec-pro', 'greentec-pro-carbon', 'wood', 'pearl', 'flax',
      // TPU Flexible line
      'flex-semisoft', 'flex-medium', 'flex-hard', 'flex-hard-cf',
      // Special materials
      'xpetg', 'pla-matt'
    ];

    // EUR to USD conversion rate
    const EUR_TO_USD = 1.08;
    
    this.log(`Starting Extrudr scrape with ${EXTRUDR_MATERIALS.length} material pages`);
    
    for (let i = 0; i < EXTRUDR_MATERIALS.length; i++) {
      const slug = EXTRUDR_MATERIALS[i];
      const productUrl = `https://www.extrudr.com/en/inlt/products/${slug}/`;
      
      try {
        this.log(`[${i + 1}/${EXTRUDR_MATERIALS.length}] Scraping Extrudr material: ${slug}`);
        
        const scrapeResponse = await fetch("https://api.firecrawl.dev/v1/scrape", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${this.firecrawlApiKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            url: productUrl,
            formats: ["markdown"],
            waitFor: 3000,
          }),
        });

        if (!scrapeResponse.ok) {
          this.logError(`Failed to scrape Extrudr ${slug}: ${scrapeResponse.status}`);
          continue;
        }

        const data = await scrapeResponse.json();
        const markdown = data.data?.markdown || data.markdown || "";
        
        if (!markdown || markdown.length < 100) {
          this.log(`Skipping ${slug} - no content`);
          continue;
        }
        
        // Extract material name from heading
        const nameMatch = markdown.match(/^#\s+(.+)$/m);
        const materialName = nameMatch?.[1]?.trim() || slug.toUpperCase().replace(/-/g, ' ');
        
        // Extract SKU/EAN barcode
        const skuMatch = markdown.match(/SKU:\s*\*\*(\d+)\*\*/i) || markdown.match(/EAN:\s*(\d{13})/i);
        const sku = skuMatch?.[1] || null;
        
        // Extract temperatures
        const bedTempMatch = markdown.match(/Print\s*Bed\s*Temperature[:\s]*(\d+)\s*[-–]?\s*(\d+)?\s*°?C/i);
        const nozzleTempMatch = markdown.match(/Printing\s*Temperature[:\s]*(\d+)\s*[-–]?\s*(\d+)?\s*°?C/i);
        
        const bedTempMin = bedTempMatch ? parseInt(bedTempMatch[1]) : null;
        const bedTempMax = bedTempMatch?.[2] ? parseInt(bedTempMatch[2]) : bedTempMin;
        const nozzleTempMin = nozzleTempMatch ? parseInt(nozzleTempMatch[1]) : null;
        const nozzleTempMax = nozzleTempMatch?.[2] ? parseInt(nozzleTempMatch[2]) : nozzleTempMin;
        
        // Extract image URL
        const imageMatch = markdown.match(/!\[[^\]]*\]\((https:\/\/(?:s3\.extrudr\.com|www\.extrudr\.com\/_next\/image)[^)]+)\)/);
        let imageUrl = imageMatch?.[1] || null;
        // Clean Next.js image wrapper if present
        if (imageUrl?.includes('/_next/image')) {
          const urlParam = imageUrl.match(/url=([^&]+)/);
          if (urlParam) {
            imageUrl = decodeURIComponent(urlParam[1]);
          }
        }
        
        // Extract colors from the color section
        // Known color names for validation
        const KNOWN_COLORS = ['black', 'white', 'red', 'blue', 'green', 'yellow', 'orange', 'purple', 'pink', 'brown', 
          'grey', 'gray', 'silver', 'gold', 'bronze', 'transparent', 'clear', 'natural', 'nature', 'anthracite', 
          'anthracit', 'navy', 'cyan', 'magenta', 'lime', 'turquoise', 'teal', 'beige', 'cream', 'ivory',
          'copper', 'brass', 'pearl', 'signal', 'traffic', 'steel', 'smoke', 'venom', 'terracotta', 'sapphire'];
        
        const colors: string[] = [];
        
        // Look for color names in markdown - split by newlines and filter
        const lines = markdown.split('\n');
        for (const line of lines) {
          const cleanLine = line.replace(/[\[\]\*\-#]/g, '').trim().toLowerCase();
          // Check if this line matches a known color or color pattern
          if (cleanLine.length >= 3 && cleanLine.length <= 25) {
            // Check against known colors
            for (const knownColor of KNOWN_COLORS) {
              if (cleanLine === knownColor || cleanLine.startsWith(knownColor + ' ') || cleanLine.endsWith(' ' + knownColor)) {
                if (!colors.includes(cleanLine) && !cleanLine.includes('view') && !cleanLine.includes('option') && 
                    !cleanLine.includes('available') && !cleanLine.includes('diameter') && !cleanLine.includes('filament')) {
                  colors.push(cleanLine);
                  break;
                }
              }
            }
          }
        }
        
        // Fallback: look for color pattern in specific section
        if (colors.length === 0) {
          const colorSectionMatch = markdown.match(/###\s*color[s]?[\s\S]*?(?=###|$)/i);
          if (colorSectionMatch) {
            for (const knownColor of KNOWN_COLORS) {
              const regex = new RegExp(`\\b${knownColor}\\b`, 'gi');
              if (regex.test(colorSectionMatch[0])) {
                colors.push(knownColor);
              }
            }
          }
        }
        
        // Final fallback to natural/default
        if (colors.length === 0) {
          colors.push('natural');
        }
        
        // Extract weight options
        const weightMatches = markdown.match(/(\d+(?:\.\d+)?)\s*kg/gi);
        const weightsSet = new Set<number>();
        if (weightMatches) {
          for (const w of weightMatches) {
            weightsSet.add(parseFloat(w) * 1000);
          }
        }
        const weights: number[] = weightsSet.size > 0 ? Array.from(weightsSet) : [1100]; // Default 1.1kg
        const defaultWeight = weights[0] || 1100;
        
        // Extract diameter options
        const diameterMatches = markdown.match(/(\d+(?:\.\d+)?)\s*mm(?:\s*(?:diameter|filament))?/gi);
        const diameterSet = new Set<number>();
        if (diameterMatches) {
          for (const d of diameterMatches) {
            const val = parseFloat(d);
            if (val >= 1.5 && val <= 3) diameterSet.add(val);
          }
        }
        const diameters: number[] = diameterSet.size > 0 ? Array.from(diameterSet) : [1.75];
        const defaultDiameter = diameters.includes(1.75) ? 1.75 : diameters[0] || 1.75;
        
        // Extract prices - look for both regular and sale prices
        const priceMatches = markdown.match(/(\d+[,.]?\d*)\s*€/g);
        let price: number | null = null;
        let compareAtPrice: number | null = null;
        
        if (priceMatches && priceMatches.length > 0) {
          const prices = priceMatches.map((p: string) => parseFloat(p.replace(',', '.').replace('€', '').trim())).filter((p: number) => p > 0 && p < 500);
          if (prices.length >= 2) {
            // Assume first is original, second is sale
            compareAtPrice = Math.max(...prices) * EUR_TO_USD;
            price = Math.min(...prices) * EUR_TO_USD;
          } else if (prices.length === 1) {
            price = prices[0] * EUR_TO_USD;
          }
        }
        
        // Detect material type from slug/name
        let detectedMaterial = slug.toUpperCase().replace(/-/g, ' ');
        if (slug.includes('pla')) detectedMaterial = 'PLA';
        else if (slug.includes('petg') || slug.includes('pctg')) detectedMaterial = 'PETG';
        else if (slug.includes('abs')) detectedMaterial = 'ABS';
        else if (slug.includes('asa')) detectedMaterial = 'ASA';
        else if (slug.includes('pa12') || slug.includes('nylon')) detectedMaterial = 'Nylon';
        else if (slug.includes('flex') || slug.includes('tpu')) detectedMaterial = 'TPU';
        else if (slug.includes('pc-pbt')) detectedMaterial = 'PC';
        else if (slug.includes('wood')) detectedMaterial = 'Wood';
        else if (slug.includes('greentec')) detectedMaterial = 'GreenTEC';
        else if (slug.includes('biofusion')) detectedMaterial = 'BioFusion';
        else if (slug.includes('pearl')) detectedMaterial = 'Pearl';
        else if (slug.includes('flax')) detectedMaterial = 'Flax';
        
        // Check for carbon fiber
        const isCF = slug.includes('-cf') || slug.includes('carbon');
        const isGF = slug.includes('-gf') || slug.includes('glass');
        
        this.log(`  Found: ${materialName}, ${colors.length} colors, temps: ${nozzleTempMin}-${nozzleTempMax}°C nozzle, €${price ? (price / EUR_TO_USD).toFixed(2) : 'N/A'}`);
        
        // Create a product for each color variant
        for (const colorName of colors) {
          const cleanColor = colorName.replace(/[^a-z0-9\s]/gi, '').trim();
          const productId = `extrudr-${slug}-${cleanColor.replace(/\s+/g, '-')}`.toLowerCase();
          
          if (seenIds.has(productId)) continue;
          seenIds.add(productId);
          
          // Get color hex from our color map
          const colorInfo = this.extractColorFromText(cleanColor);
          
          const product: ScrapedProduct = {
            productId,
            sku,
            title: `Extrudr ${materialName} ${cleanColor.charAt(0).toUpperCase() + cleanColor.slice(1)}`,
            price: price ? Math.round(price * 100) / 100 : null,
            compareAtPrice: compareAtPrice ? Math.round(compareAtPrice * 100) / 100 : null,
            available: true,
            currency: "USD", // Converted from EUR
            url: productUrl,
            scrapedAt: new Date(),
            source: "firecrawl-extrudr",
            imageUrl,
            barcode: sku && sku.length >= 12 ? sku : null,
            description: `${materialName} filament by Extrudr - ${defaultDiameter}mm diameter, ${defaultWeight}g${isCF ? ' - Carbon Fiber reinforced' : ''}${isGF ? ' - Glass Fiber reinforced' : ''}`,
            mpn: sku,
            tdsUrl: `https://www.extrudr.com/en/downloads/?search=${encodeURIComponent(materialName)}`,
            colorHex: colorInfo?.hex || null,
            colorName: cleanColor,
            nozzleTempMin,
            nozzleTempMax,
            bedTempMin,
            bedTempMax,
            spoolMaterial: 'cardboard', // Extrudr uses eco-friendly cardboard spools
            netWeightG: defaultWeight,
            diameterMm: defaultDiameter,
            spoolOuterDiameterMm: 200, // Standard Extrudr spool
            spoolWidthMm: 55,
          };
          
          products.push(product);
          this.log(`    ✓ ${cleanColor} variant added`);
        }
        
        // Rate limiting between material pages
        await new Promise(resolve => setTimeout(resolve, 2000));
        
      } catch (error) {
        this.logError(`Error extracting Extrudr ${slug}:`, error);
      }
    }
    
    this.log(`Total Extrudr products: ${products.length}`);
    return products;
  }

  /**
   * Creality Extraction - Shopify collection page with markdown parsing
   */
  private async extractCrealityProducts(baseUrl: string): Promise<ScrapedProduct[]> {
    const products: ScrapedProduct[] = [];
    const seenIds = new Set<string>();
    
    // Pagination
    const pageUrls = [
      baseUrl,
      `${baseUrl}?page=2`,
    ];
    
    for (const pageUrl of pageUrls) {
      try {
        this.log(`Scraping Creality page: ${pageUrl}`);
        
        const scrapeResponse = await fetch("https://api.firecrawl.dev/v1/scrape", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${this.firecrawlApiKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            url: pageUrl,
            formats: ["markdown"],
            waitFor: 3000,
          }),
        });

        if (!scrapeResponse.ok) {
          this.logError(`Failed to scrape Creality page: ${scrapeResponse.status}`);
          continue;
        }

        const data = await scrapeResponse.json();
        const markdown = data.data?.markdown || data.markdown || "";
        
        this.log(`Got markdown (${markdown.length} chars)`);

        // Parse product blocks from Shopify collection markdown
        // Pattern: [![Product Name](cdnImage)](productUrl)
        //          [Product Name](productUrl)
        //          ~~$XX.XX~~ $XX.XX or just $XX.XX
        const productPattern = /\[!\[([^\]]+)\]\(([^)]+)\)\]\((https?:\/\/store\.creality\.com\/products\/[^)]+)\)[\s\S]*?\[([^\]]+)\]\([^)]+\)[\s\S]*?(?:~~\$([\d.]+)~~\s*)?\$([\d.]+)/gi;
        
        let match;
        while ((match = productPattern.exec(markdown)) !== null) {
          const [, altText, imageUrl, productUrl, productName, comparePrice, currentPrice] = match;
          
          // Skip non-filament products
          const titleLower = productName.toLowerCase();
          if (!titleLower.includes('pla') && !titleLower.includes('petg') && 
              !titleLower.includes('abs') && !titleLower.includes('tpu') &&
              !titleLower.includes('filament') && !titleLower.includes('hyper')) {
            continue;
          }
          
          const productId = productUrl.split('/products/')[1]?.split('?')[0] || productName.toLowerCase().replace(/\s+/g, '-');
          
          if (seenIds.has(productId)) continue;
          seenIds.add(productId);
          
          const price = parseFloat(currentPrice);
          const compareAtPrice = comparePrice ? parseFloat(comparePrice) : null;
          const material = this.detectMaterial(productName);
          const colorInfo = this.extractColorFromText(productName);
          
          const product: ScrapedProduct = {
            productId,
            sku: null,
            title: productName.trim(),
            price: price > 0 && price < 500 ? price : null,
            compareAtPrice,
            available: true,
            currency: "USD",
            url: productUrl,
            scrapedAt: new Date(),
            source: "firecrawl-creality",
            imageUrl: imageUrl || null,
            barcode: null,
            description: material ? `${material} filament` : null,
            mpn: null,
            tdsUrl: null,
            colorHex: colorInfo?.hex || null,
            colorName: colorInfo?.name || null,
            nozzleTempMin: null,
            nozzleTempMax: null,
            bedTempMin: null,
            bedTempMax: null,
            spoolMaterial: null,
            netWeightG: 1000,
            diameterMm: 1.75,
            spoolOuterDiameterMm: null,
            spoolWidthMm: null,
          };
          
          products.push(product);
          this.log(`✓ ${productName} - $${currentPrice}${comparePrice ? ` (was $${comparePrice})` : ''}`);
        }

        // Simpler fallback
        if (products.length < 5) {
          const simplePattern = /\[([^\]]*(?:PLA|PETG|Hyper|Filament)[^\]]*)\]\((https?:\/\/store\.creality\.com\/products\/[^)]+)\)/gi;
          while ((match = simplePattern.exec(markdown)) !== null) {
            const [, productName, productUrl] = match;
            const productId = productUrl.split('/products/')[1]?.split('?')[0] || productName.toLowerCase().replace(/\s+/g, '-');
            
            if (seenIds.has(productId)) continue;
            seenIds.add(productId);
            
            const product: ScrapedProduct = {
              productId,
              sku: null,
              title: productName.trim(),
              price: null,
              compareAtPrice: null,
              available: true,
              currency: "USD",
              url: productUrl,
              scrapedAt: new Date(),
              source: "firecrawl-creality",
              imageUrl: null,
              barcode: null,
              description: null,
              mpn: null,
              tdsUrl: null,
              colorHex: null,
              colorName: null,
              nozzleTempMin: null,
              nozzleTempMax: null,
              bedTempMin: null,
              bedTempMax: null,
              spoolMaterial: null,
              netWeightG: 1000,
              diameterMm: 1.75,
              spoolOuterDiameterMm: null,
              spoolWidthMm: null,
            };
            
            products.push(product);
            this.log(`✓ ${productName}`);
          }
        }
        
        await new Promise(resolve => setTimeout(resolve, 1000));
        
      } catch (error) {
        this.logError(`Error scraping Creality page ${pageUrl}:`, error);
      }
    }
    
    this.log(`Total Creality products: ${products.length}`);
    return products;
  }

  /**
   * Spectrum Filaments Extraction - IdoSell platform with Map API
   */
  private async extractSpectrumProducts(baseUrl: string): Promise<ScrapedProduct[]> {
    const products: ScrapedProduct[] = [];
    const seenIds = new Set<string>();
    
    try {
      this.log(`Mapping Spectrum Filaments URLs from: ${baseUrl}`);
      
      // Use Map API to discover product URLs
      const mapResponse = await fetch("https://api.firecrawl.dev/v1/map", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${this.firecrawlApiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          url: baseUrl,
          search: "filament PLA PETG ABS",
          limit: 300,
          includeSubdomains: false,
        }),
      });

      if (!mapResponse.ok) {
        this.logError(`Failed to map Spectrum: ${mapResponse.status}`);
        return [];
      }

      const mapData = await mapResponse.json();
      const urls = mapData.links || [];
      
      this.log(`Discovered ${urls.length} URLs`);

      // Filter for product URLs (IdoSell pattern: /product-eng-ID-name.html)
      const productUrls = urls.filter((url: string) => {
        return url.match(/shop\.spectrumfilaments\.com\/product-eng-\d+-[\w-]+\.html$/i) &&
               (url.toLowerCase().includes('pla') || 
                url.toLowerCase().includes('petg') || 
                url.toLowerCase().includes('abs') ||
                url.toLowerCase().includes('filament') ||
                url.toLowerCase().includes('asa') ||
                url.toLowerCase().includes('tpu') ||
                url.toLowerCase().includes('nylon') ||
                url.toLowerCase().includes('hips'));
      });

      this.log(`Filtered to ${productUrls.length} product URLs`);

      // Scrape each product (limited to avoid timeout)
      const urlsToScrape = productUrls.slice(0, 50);
      
      for (const productUrl of urlsToScrape) {
        try {
          const scrapeResponse = await fetch("https://api.firecrawl.dev/v1/scrape", {
            method: "POST",
            headers: {
              Authorization: `Bearer ${this.firecrawlApiKey}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              url: productUrl,
              formats: ["markdown", "html"],
              onlyMainContent: true,
              waitFor: 2000,
            }),
          });

          if (!scrapeResponse.ok) continue;

          const data = await scrapeResponse.json();
          const markdown = data.data?.markdown || data.markdown || "";
          const html = data.data?.html || data.html || "";
          const metadata = data.data?.metadata || {};
          
          // Extract title
          const title = metadata.title?.replace(/\s*[-|]\s*Spectrum.*$/i, '').trim() ||
                       markdown.match(/^#\s+(.+)$/m)?.[1]?.trim();
          
          if (!title) continue;
          
          // Extract product ID from URL
          const idMatch = productUrl.match(/-(\d+)\.html$/);
          const productId = idMatch ? idMatch[1] : productUrl.split('/').pop()?.replace('.html', '') || '';
          
          if (seenIds.has(productId)) continue;
          seenIds.add(productId);
          
          // Extract price using the class's robust 4-strategy extractor (JSON-LD → meta → HTML → markdown)
          const price = this.extractPriceFromContent(html, markdown);
          
          // Extract image from OG or content
          const imageUrl = metadata.ogImage?.[0]?.url || null;
          
          const material = this.detectMaterial(title);
          const colorInfo = this.extractColorFromText(title);
          
          const product: ScrapedProduct = {
            productId,
            sku: productId,
            title,
            price: price ? this.convertToUSD(price) : null,
            compareAtPrice: null,
            available: true,
            currency: "EUR",
            url: productUrl,
            scrapedAt: new Date(),
            source: "firecrawl-spectrum",
            imageUrl,
            barcode: null,
            description: material ? `${material} filament` : null,
            mpn: null,
            tdsUrl: null,
            colorHex: colorInfo?.hex || null,
            colorName: colorInfo?.name || null,
            nozzleTempMin: null,
            nozzleTempMax: null,
            bedTempMin: null,
            bedTempMax: null,
            spoolMaterial: null,
            netWeightG: 1000,
            diameterMm: 1.75,
            spoolOuterDiameterMm: null,
            spoolWidthMm: null,
          };
          
          products.push(product);
          this.log(`✓ ${title}${price ? ` - €${price}` : ''}`);
          
          await new Promise(resolve => setTimeout(resolve, 300));
          
        } catch (error) {
          this.logError(`Error scraping ${productUrl}:`, error);
        }
      }
      
    } catch (error) {
      this.logError(`Error extracting Spectrum products:`, error);
    }
    
    this.log(`Total Spectrum products: ${products.length}`);
    return products;
  }

  /**
   * Detect material type from product title
   */
  private detectMaterial(title: string): string | null {
    const titleLower = title.toLowerCase();
    
    const materials = [
      { pattern: /\bpetg\b/i, name: 'PETG' },
      { pattern: /\btpu\b/i, name: 'TPU' },
      { pattern: /\babs\b/i, name: 'ABS' },
      { pattern: /\basa\b/i, name: 'ASA' },
      { pattern: /\bnylon\b/i, name: 'Nylon' },
      { pattern: /\bpa[\s-]?cf\b/i, name: 'PA-CF' },
      { pattern: /\bpc\b/i, name: 'PC' },
      { pattern: /\bsilk\b/i, name: 'PLA-Silk' },
      { pattern: /\bpla\+?\b/i, name: 'PLA' },
      { pattern: /\bmatte\b/i, name: 'PLA-Matte' },
    ];
    
    for (const { pattern, name } of materials) {
      if (pattern.test(titleLower)) {
        return name;
      }
    }
    
    return null;
  }

  /**
   * Extract weight from title (e.g., "1kg", "1000g")
   */
  private extractWeightFromTitle(title: string): number | null {
    const kgMatch = title.match(/(\d+(?:\.\d+)?)\s*kg/i);
    if (kgMatch) {
      return Math.round(parseFloat(kgMatch[1]) * 1000);
    }
    
    const gMatch = title.match(/(\d+)\s*g\b/i);
    if (gMatch) {
      return parseInt(gMatch[1]);
    }
    
    return null;
  }

  /**
   * Extract diameter from title (e.g., "1.75mm", "2.85mm")
   */
  private extractDiameterFromTitle(title: string): number | null {
    const match = title.match(/(1\.75|2\.85|3\.0|3)\s*mm/i);
    if (match) {
      return parseFloat(match[1]);
    }
    return null;
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
        /shop\.spectrumfilaments\.com\/product-eng-\d+-[\w-]+\.html$/i, // IdoSell pattern
      ],
      'matterhackers': [
        /matterhackers\.com\/store\/l\/[^\/]+\/ln\//i,
      ],
      'ic3d printers': [
        /ic3dprinters\.com\/shop\/[a-z0-9-]+\/?$/i, // Pattern: /shop/product-slug/
        /ic3dprinters\.com\/product\/[a-z0-9-]+\/?$/i, // Alt pattern: /product/product-slug/
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

  /**
   * Gizmo Dorks Products Extraction - BigCommerce platform
   */
  private async extractGizmoDorksProducts(baseUrl: string): Promise<ScrapedProduct[]> {
    const products: ScrapedProduct[] = [];
    const seenIds = new Set<string>();
    
    // Gizmo Dorks category pages
    const categoryPages = [
      'https://gizmodorks.com/3d-printer-filament-1kg/',
      'https://gizmodorks.com/3d-printer-filament-250g/',
    ];

    try {
      for (const categoryUrl of categoryPages) {
        this.log(`Scraping Gizmo Dorks category: ${categoryUrl}`);
        
        const response = await fetch("https://api.firecrawl.dev/v1/scrape", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${this.firecrawlApiKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            url: categoryUrl,
            formats: ["markdown", "html"],
            onlyMainContent: true,
            waitFor: 3000,
          }),
        });

        if (!response.ok) {
          this.log(`Failed to scrape Gizmo Dorks category: ${categoryUrl}`);
          continue;
        }

        const data = await response.json();
        const html = data.data?.html || data.html || "";
        const markdown = data.data?.markdown || data.markdown || "";
        
        // Extract product links from BigCommerce structure
        const productLinkMatches = html.matchAll(/href="(https:\/\/gizmodorks\.com\/[^"]+filament[^"]*\/)"/gi);
        const productUrls = [...new Set([...productLinkMatches].map(m => m[1]))];
        
        this.log(`Found ${productUrls.length} product links in ${categoryUrl}`);
        
        // Scrape individual product pages
        for (const productUrl of productUrls.slice(0, 30)) {
          try {
            const urlParts = productUrl.replace(/\/$/, '').split('/');
            const productId = urlParts[urlParts.length - 1] || '';
            if (seenIds.has(productId) || !productId) continue;
            seenIds.add(productId);
            
            const prodResponse = await fetch("https://api.firecrawl.dev/v1/scrape", {
              method: "POST",
              headers: {
                Authorization: `Bearer ${this.firecrawlApiKey}`,
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                url: productUrl,
                formats: ["markdown"],
                onlyMainContent: true,
                waitFor: 2000,
              }),
            });

            if (!prodResponse.ok) continue;

            const prodData = await prodResponse.json();
            const prodMarkdown = prodData.data?.markdown || prodData.markdown || "";
            const metadata = prodData.data?.metadata || {};
            
            // Extract title
            const title = metadata.title?.replace(/\s*[-–|]\s*Gizmo\s*Dorks.*$/i, '').trim() ||
                         prodMarkdown.match(/^#\s+(.+)$/m)?.[1]?.trim();
            
            if (!title) continue;
            
            // Extract price (BigCommerce format)
            const priceMatch = prodMarkdown.match(/\$\s*([\d.,]+)/) || prodMarkdown.match(/([\d.,]+)\s*USD/i);
            const price = priceMatch ? parseFloat(priceMatch[1].replace(',', '')) : null;
            
            // Extract image
            const imageUrl = metadata.ogImage?.[0]?.url || null;
            
            const material = this.detectMaterial(title);
            const colorInfo = this.extractColorFromText(title);
            
            // Extract weight from title (e.g., "1kg" or "250g")
            const weightMatch = title.match(/(\d+)\s*(kg|g)\b/i);
            let netWeightG = 1000;
            if (weightMatch) {
              netWeightG = weightMatch[2].toLowerCase() === 'kg' 
                ? parseInt(weightMatch[1]) * 1000 
                : parseInt(weightMatch[1]);
            }
            
            const product: ScrapedProduct = {
              productId,
              sku: productId,
              title,
              price,
              compareAtPrice: null,
              available: true,
              currency: "USD",
              url: productUrl,
              scrapedAt: new Date(),
              source: "firecrawl-gizmodorks",
              imageUrl,
              barcode: null,
              description: material ? `${material} filament` : null,
              mpn: null,
              tdsUrl: null,
              colorHex: colorInfo?.hex || null,
              colorName: colorInfo?.name || null,
              nozzleTempMin: null,
              nozzleTempMax: null,
              bedTempMin: null,
              bedTempMax: null,
              spoolMaterial: null,
              netWeightG,
              diameterMm: 1.75,
              spoolOuterDiameterMm: null,
              spoolWidthMm: null,
            };
            
            products.push(product);
            this.log(`✓ Gizmo Dorks product: ${title} - $${price}`);
            
            await new Promise(resolve => setTimeout(resolve, 500));
          } catch (err) {
            this.logError(`Error scraping Gizmo Dorks product:`, err);
          }
        }
        
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    } catch (error) {
      this.logError(`Gizmo Dorks extraction error:`, error);
    }
    
    return products;
  }

  /**
   * IC3D Printers Products Extraction - WooCommerce platform
   * IC3D uses a WooCommerce store with product pages at /shop/product-slug/
   */
  private async extractIC3DProducts(baseUrl: string): Promise<ScrapedProduct[]> {
    const products: ScrapedProduct[] = [];
    const seenIds = new Set<string>();
    
    // IC3D filament collection page
    const collectionUrl = 'https://www.ic3dprinters.com/collections/filament/';

    try {
      this.log(`Scraping IC3D collection: ${collectionUrl}`);
      
      // First, get the collection page to find all product links
      const response = await fetch("https://api.firecrawl.dev/v1/scrape", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${this.firecrawlApiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          url: collectionUrl,
          formats: ["html"],
          waitFor: 3000,
        }),
      });

      if (!response.ok) {
        this.logError(`Failed to scrape IC3D collection: ${response.status}`);
        return [];
      }

      const data = await response.json();
      const html = data.data?.html || data.html || "";
      
      // Extract product URLs from the collection page
      // IC3D uses /shop/product-slug/ pattern
      const productUrlPattern = /href="(https?:\/\/(?:www\.)?ic3dprinters\.com\/shop\/([a-z0-9-]+)\/?)"/gi;
      const matches = [...html.matchAll(productUrlPattern)];
      
      // Filter to only product URLs, not category URLs
      const productUrls: string[] = [];
      const categoryKeywords = ['filaments', 'pla-filaments', 'petg-filaments', 'abs-filaments', 'collections'];
      
      for (const match of matches) {
        const url = match[1];
        const slug = match[2];
        
        // Skip if it's a category page
        if (categoryKeywords.some(kw => slug.includes(kw) || slug === kw)) continue;
        
        // Skip if already seen
        if (seenIds.has(slug)) continue;
        seenIds.add(slug);
        
        productUrls.push(url);
      }
      
      this.log(`Found ${productUrls.length} IC3D product URLs`);
      
      // Scrape each product page
      for (const productUrl of productUrls) {
        try {
          const slug = productUrl.split('/shop/')[1]?.replace(/\/$/, '') || '';
          
          const prodResponse = await fetch("https://api.firecrawl.dev/v1/scrape", {
            method: "POST",
            headers: {
              Authorization: `Bearer ${this.firecrawlApiKey}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              url: productUrl,
              formats: ["markdown", "html"],
              onlyMainContent: true,
              waitFor: 2000,
            }),
          });

          if (!prodResponse.ok) {
            this.log(`Failed to scrape IC3D product: ${productUrl}`);
            continue;
          }

          const prodData = await prodResponse.json();
          const prodHtml = prodData.data?.html || prodData.html || "";
          const prodMarkdown = prodData.data?.markdown || prodData.markdown || "";
          const metadata = prodData.data?.metadata || {};
          
          // Extract title
          let title = metadata.title?.replace(/\s*[-–|]\s*IC3D\s*Printers.*$/i, '').trim() ||
                      metadata.ogTitle?.replace(/\s*[-–|]\s*IC3D\s*Printers.*$/i, '').trim();
          
          // Extract from h1 if not in metadata
          if (!title) {
            const h1Match = prodHtml.match(/<h1[^>]*class="[^"]*product[^"]*title[^"]*"[^>]*>([^<]+)<\/h1>/i) ||
                           prodHtml.match(/<h1[^>]*>([^<]+)<\/h1>/i);
            title = h1Match?.[1]?.trim();
          }
          
          if (!title) continue;
          
          // Extract price from WooCommerce structure
          const priceMatch = prodHtml.match(/<span[^>]*class="[^"]*woocommerce-Price-amount[^"]*"[^>]*>\s*<bdi>\s*<span[^>]*class="[^"]*woocommerce-Price-currencySymbol[^"]*">\$<\/span>([\d.,]+)<\/bdi>/i) ||
                            prodHtml.match(/\$\s*([\d.,]+)\s*(?:USD)?/i);
          const price = priceMatch ? parseFloat(priceMatch[1].replace(',', '')) : null;
          
          // Extract image
          const imageMatch = prodHtml.match(/<img[^>]*class="[^"]*woocommerce-product-gallery__image[^"]*"[^>]*src="([^"]+)"/i) ||
                            prodHtml.match(/data-large_image="([^"]+)"/i) ||
                            prodHtml.match(/<meta\s+property="og:image"\s+content="([^"]+)"/i);
          const imageUrl = imageMatch?.[1] || metadata.ogImage?.[0]?.url || null;
          
          // Extract SKU/MPN
          const skuMatch = prodHtml.match(/class="[^"]*sku[^"]*"[^>]*>([A-Z0-9-]+)<\//i) ||
                          prodMarkdown.match(/SKU:\s*([A-Z0-9-]+)/i);
          const sku = skuMatch?.[1] || slug.toUpperCase();
          
          // Extract weight from title or description
          const weightMatch = (title + ' ' + prodMarkdown).match(/(\d+)\s*(kg|g)\s*(?:spool|filament)?/i);
          let netWeightG = 1000; // Default 1kg
          if (weightMatch) {
            netWeightG = weightMatch[2].toLowerCase() === 'kg' 
              ? parseInt(weightMatch[1]) * 1000 
              : parseInt(weightMatch[1]);
          }
          
          // Detect material and color
          const material = this.detectMaterial(title);
          const colorInfo = this.extractColorFromText(title);
          
          // Extract TDS URL
          const tdsMatch = prodHtml.match(/href="([^"]+\.pdf)"/i) ||
                          prodHtml.match(/href="([^"]+technical[^"]*data[^"]*)"/i);
          const tdsUrl = tdsMatch?.[1] || null;
          
          const product: ScrapedProduct = {
            productId: slug,
            sku,
            title,
            price,
            compareAtPrice: null,
            available: !prodHtml.includes('out-of-stock') && !prodHtml.includes('Out of stock'),
            currency: "USD",
            url: productUrl,
            scrapedAt: new Date(),
            source: "firecrawl-ic3d",
            imageUrl,
            barcode: null,
            description: prodMarkdown?.substring(0, 2000) || null,
            mpn: sku,
            tdsUrl,
            colorHex: colorInfo?.hex || null,
            colorName: colorInfo?.name || null,
            nozzleTempMin: null,
            nozzleTempMax: null,
            bedTempMin: null,
            bedTempMax: null,
            spoolMaterial: null,
            netWeightG,
            diameterMm: 1.75,
            spoolOuterDiameterMm: null,
            spoolWidthMm: null,
          };
          
          products.push(product);
          this.log(`✓ IC3D product: ${title} - $${price} - Image: ${imageUrl ? 'Yes' : 'No'}`);
          
          await new Promise(resolve => setTimeout(resolve, 600));
        } catch (err) {
          this.logError(`Error scraping IC3D product:`, err);
        }
      }
    } catch (error) {
      this.logError(`IC3D extraction error:`, error);
    }
    
    return products;
  }
}