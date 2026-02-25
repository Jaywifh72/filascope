import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.86.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Try Shopify JSON API first for stores that use Shopify
async function tryShopifyJson(url: string): Promise<{ msrp_usd: number | null; current_price_usd_store: number | null } | null> {
  try {
    // Convert product URL to .json endpoint
    const jsonUrl = url.replace(/\/$/, '') + '.json';
    console.log(`Trying Shopify JSON API: ${jsonUrl}`);
    
    const response = await fetch(jsonUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept': 'application/json',
      },
    });
    
    if (!response.ok) {
      console.log(`Shopify JSON API returned ${response.status}`);
      return null;
    }
    
    const data = await response.json();
    
    if (data?.product?.variants && Array.isArray(data.product.variants)) {
      const variant = data.product.variants[0];
      const price = parseFloat(variant.price);
      const comparePrice = variant.compare_at_price ? parseFloat(variant.compare_at_price) : null;
      
      if (!isNaN(price) && price > 0) {
        console.log(`✓ Found price via Shopify JSON: $${price}${comparePrice ? ` (was $${comparePrice})` : ''}`);
        // Note: Validation will be applied after this returns
        return {
          msrp_usd: comparePrice,
          current_price_usd_store: price
        };
      }
    }
    
    return null;
  } catch (error) {
    console.log('Shopify JSON attempt failed:', error instanceof Error ? error.message : 'Unknown error');
    return null;
  }
}

// Validate price to reject obviously incorrect values
// - Prices below $150 (no real 3D printer costs less)
// - Common promotional discount amounts ($50, $60, $70, $80, $90, $100 off patterns)
function isValidPrinterPrice(price: number | null): boolean {
  if (price === null || price === undefined) return false;
  
  // Reject prices below $150
  if (price < 150) {
    console.log(`⚠️ Rejected price $${price} - below minimum threshold ($150)`);
    return false;
  }
  
  // Reject common promotional discount amounts (within $5 tolerance)
  const discountAmounts = [50, 60, 70, 80, 90, 100, 110, 120, 130, 140];
  for (const discount of discountAmounts) {
    if (Math.abs(price - discount) <= 5) {
      console.log(`⚠️ Rejected price $${price} - matches common discount pattern (~$${discount} off)`);
      return false;
    }
  }
  
  // Reject suspiciously low round numbers that look like accessory prices
  const accessoryPrices = [13.99, 14.99, 19.99, 24.99, 29.99, 39.99, 49.99];
  for (const accessoryPrice of accessoryPrices) {
    if (Math.abs(price - accessoryPrice) < 1) {
      console.log(`⚠️ Rejected price $${price} - looks like accessory price`);
      return false;
    }
  }
  
  // Reject single-digit prices (obvious errors)
  if (price < 10) {
    console.log(`⚠️ Rejected price $${price} - single digit error`);
    return false;
  }
  
  return true;
}

// Sanitize price result - only return valid prices
function sanitizePrices(prices: { msrp_usd: number | null; current_price_usd_store: number | null }): { msrp_usd: number | null; current_price_usd_store: number | null } {
  return {
    msrp_usd: isValidPrinterPrice(prices.msrp_usd) ? prices.msrp_usd : null,
    current_price_usd_store: isValidPrinterPrice(prices.current_price_usd_store) ? prices.current_price_usd_store : null
  };
}

// Enhanced price extraction with multiple pattern matching and debugging
function extractPrices(markdown: string): {
  msrp_usd: number | null;
  current_price_usd_store: number | null;
} {
  let msrp_usd: number | null = null;
  let current_price_usd_store: number | null = null;

  // Multiple price regex patterns to catch different formats
  const pricePatterns = [
    /\$\s*(\d{1,3}(?:,\d{3})*(?:\.\d{2})?)/gi,  // $1,234.56 or $1234.56
    /\$\s*(\d{1,3}(?:,\d{3})*)/gi,               // $1,234 or $1234 (no decimals)
    /USD\s*\$?\s*(\d{1,3}(?:,\d{3})*(?:\.\d{2})?)/gi, // USD $1,234.56
    /(\d{1,3}(?:,\d{3})*(?:\.\d{2})?)\s*USD/gi,  // 1,234.56 USD
    /Price[:\s]*\$?\s*(\d{1,3}(?:,\d{3})*(?:\.\d{2})?)/gi, // Price: $1,234
    /(?:from|starting\s+at)[:\s]*\$?\s*(\d{1,3}(?:,\d{3})*(?:\.\d{2})?)/gi, // from $1,234
  ];

  const allPrices: number[] = [];
  const priceContexts: string[] = [];
  
  // Try all patterns
  for (const pattern of pricePatterns) {
    const matches = markdown.matchAll(pattern);
    for (const match of matches) {
      const priceStr = match[1].replace(/,/g, '');
      const price = parseFloat(priceStr);
      
      if (!isNaN(price) && price >= 100 && price <= 50000) {
        allPrices.push(price);
        // Extract context around the price (50 chars before and after)
        const matchIndex = match.index || 0;
        const contextStart = Math.max(0, matchIndex - 50);
        const contextEnd = Math.min(markdown.length, matchIndex + match[0].length + 50);
        priceContexts.push(markdown.substring(contextStart, contextEnd).replace(/\n/g, ' '));
      }
    }
  }

  console.log(`Found ${allPrices.length} prices in range: [${allPrices.slice(0, 10).join(', ')}]`);
  
  if (allPrices.length === 0) {
    // Debug: Show first 500 chars of markdown to understand what we're getting
    console.log('No prices found. Markdown preview:', markdown.substring(0, 500).replace(/\n/g, ' '));
    
    // Try to find any dollar signs or number patterns
    const dollarSigns = (markdown.match(/\$/g) || []).length;
    const numberPatterns = (markdown.match(/\d{3,}/g) || []).length;
    console.log(`Debug: Found ${dollarSigns} dollar signs, ${numberPatterns} number sequences`);
    
    return { msrp_usd: null, current_price_usd_store: null };
  }

  // Log some price contexts for debugging
  if (priceContexts.length > 0) {
    console.log('Price contexts:', priceContexts.slice(0, 3).join(' | '));
  }

  // Look for explicit MSRP/RRP/Retail mentions
  const msrpPatterns = [
    /(?:MSRP|RRP|Retail\s+Price|Original\s+Price)[:\s]*\$?\s*(\d{1,3}(?:,\d{3})*(?:\.\d{2})?)/i,
    /(?:was|originally)[:\s]*\$?\s*(\d{1,3}(?:,\d{3})*(?:\.\d{2})?)/i,
  ];
  
  for (const pattern of msrpPatterns) {
    const msrpMatch = markdown.match(pattern);
    if (msrpMatch) {
      msrp_usd = parseFloat(msrpMatch[1].replace(/,/g, ''));
      console.log(`Found MSRP: $${msrp_usd}`);
      break;
    }
  }

  // Look for current price indicators
  const currentPricePatterns = [
    /(?:current\s+price|now|sale\s+price|special\s+price)[:\s]*\$?\s*(\d{1,3}(?:,\d{3})*(?:\.\d{2})?)/i,
    /(?:from|starting\s+at)[:\s]*\$?\s*(\d{1,3}(?:,\d{3})*(?:\.\d{2})?)/i,
    /(?:buy\s+for|purchase\s+for)[:\s]*\$?\s*(\d{1,3}(?:,\d{3})*(?:\.\d{2})?)/i,
  ];
  
  for (const pattern of currentPricePatterns) {
    const priceMatch = markdown.match(pattern);
    if (priceMatch) {
      current_price_usd_store = parseFloat(priceMatch[1].replace(/,/g, ''));
      console.log(`Found current price via pattern: $${current_price_usd_store}`);
      break;
    }
  }

  // If no current price found yet, use frequency-based approach
  if (!current_price_usd_store && allPrices.length > 0) {
    const priceFrequency = new Map<number, number>();
    for (const price of allPrices) {
      priceFrequency.set(price, (priceFrequency.get(price) || 0) + 1);
    }
    
    // Get the most frequent price
    let maxCount = 0;
    let mostCommonPrice = allPrices[0];
    for (const [price, count] of priceFrequency.entries()) {
      if (count > maxCount) {
        maxCount = count;
        mostCommonPrice = price;
      }
    }
    
    current_price_usd_store = mostCommonPrice;
    console.log(`Using most common price: $${current_price_usd_store} (appeared ${maxCount} times)`);
  }

  // If we found MSRP and it's the same as current price, clear MSRP
  if (msrp_usd && current_price_usd_store && msrp_usd === current_price_usd_store) {
    console.log('MSRP equals current price, clearing MSRP');
    msrp_usd = null;
  }

  return { msrp_usd, current_price_usd_store };
}

// SOLUTION 1: Aggressive URL correction - convert marketing pages to store pages
function correctUrlForPricing(url: string, brand: string): string | null {
  try {
    const urlObj = new URL(url);
    const hostname = urlObj.hostname.toLowerCase();
    const pathname = urlObj.pathname.toLowerCase();
    const brandLower = brand.toLowerCase();

    // Bambu Lab: multiple patterns
    if (hostname.includes('bambulab.com')) {
      // Pattern 1: /products/ → /us/products/
      if (pathname.startsWith('/products/') && !pathname.startsWith('/us/products/')) {
        return `https://us.store.bambulab.com${pathname}`;
      }
      // Pattern 2: /en/x1 → us.store.bambulab.com/products/x1-carbon-combo
      if (pathname.includes('/en/')) {
        const modelSlug = pathname.split('/en/')[1]?.split('/')[0];
        if (modelSlug) {
          return `https://us.store.bambulab.com/products/${modelSlug}`;
        }
      }
      // Pattern 3: bambulab.com domain → us.store.bambulab.com
      if (!hostname.includes('store.bambulab.com')) {
        return url.replace(/^https?:\/\/[^\/]+/, 'https://us.store.bambulab.com');
      }
    }

    // Creality: multiple patterns
    if (hostname.includes('creality.com') || hostname.includes('creality3d.shop')) {
      if (pathname.includes('/products/')) {
        const productSlug = pathname.split('/products/')[1]?.split('/')[0];
        return `https://store.creality.com/collections/fdm-3d-printers/products/${productSlug}`;
      }
      // Ensure store domain
      if (!hostname.includes('store.creality.com')) {
        return url.replace(/^https?:\/\/[^\/]+/, 'https://store.creality.com');
      }
    }

    // Prusa Research: ensure shop domain
    if (hostname.includes('prusa3d.com')) {
      if (!hostname.includes('shop.prusa3d.com')) {
        return url.replace(/prusa3d\.com/, 'shop.prusa3d.com');
      }
    }

    // Anycubic: convert to store subdomain
    if (hostname.includes('anycubic.com')) {
      if (!hostname.includes('store.anycubic.com')) {
        if (pathname.includes('/products/')) {
          const productSlug = pathname.split('/products/')[1]?.split('/')[0];
          return `https://store.anycubic.com/products/${productSlug}`;
        }
        return url.replace(/^https?:\/\/[^\/]+/, 'https://store.anycubic.com');
      }
    }

    // Elegoo: ensure www domain (store)
    if (hostname.includes('elegoo.com')) {
      if (!hostname.includes('www.elegoo.com')) {
        return url.replace(/^https?:\/\/[^\/]+/, 'https://www.elegoo.com');
      }
    }

    // QIDI: ensure us.qidi3d.com (regional subdomain, not international store)
    if (brandLower.includes('qidi')) {
      if (!hostname.includes('qidi3d.com')) {
        if (pathname.includes('/products/')) {
          const productSlug = pathname.split('/products/')[1]?.split('/')[0];
          return `https://us.qidi3d.com/products/${productSlug}`;
        }
      } else if (hostname === 'qidi3d.com' || hostname === 'www.qidi3d.com') {
        // Fix: redirect bare qidi3d.com to us.qidi3d.com
        return url.replace(/^https?:\/\/(www\.)?qidi3d\.com/, 'https://us.qidi3d.com');
      }
    }

    // UltiMaker/Ultimaker: ensure ultimaker.com
    if (brandLower.includes('ultimaker')) {
      if (!hostname.includes('ultimaker.com')) {
        return url.replace(/^https?:\/\/[^\/]+/, 'https://ultimaker.com');
      }
    }

    // Snapmaker: ensure www.snapmaker.com
    if (brandLower.includes('snapmaker')) {
      if (!hostname.includes('www.snapmaker.com')) {
        return url.replace(/^https?:\/\/[^\/]+/, 'https://www.snapmaker.com');
      }
    }

    // FLSUN: ensure store domain
    if (brandLower.includes('flsun')) {
      if (hostname.includes('flsun3d.com') && pathname.includes('/product/')) {
        const productSlug = pathname.split('/product/')[1]?.split('.html')[0];
        return `https://flsun3d.com/products/${productSlug}`;
      }
    }

    return null; // No correction needed
  } catch (error) {
    console.error('URL correction error:', error);
    return null;
  }
}

// SOLUTION 2: Extract "Buy Now" / "Add to Cart" URLs from marketing pages
async function extractPurchaseUrls(markdown: string, baseUrl: string): Promise<string[]> {
  const purchaseUrls: string[] = [];
  
  try {
    // Look for common purchase-related link patterns
    const purchasePatterns = [
      /\[.*?(?:buy|shop|purchase|add to cart|order now).*?\]\((https?:\/\/[^\)]+)\)/gi,
      /href=["'](https?:\/\/[^"']*(?:store|shop|cart|checkout|buy)[^"']*)['"]/gi,
    ];

    for (const pattern of purchasePatterns) {
      const matches = markdown.matchAll(pattern);
      for (const match of matches) {
        const url = match[1];
        if (url && url.startsWith('http')) {
          purchaseUrls.push(url);
        }
      }
    }

    // Remove duplicates
    return [...new Set(purchaseUrls)];
  } catch (error) {
    console.error('Error extracting purchase URLs:', error);
    return [];
  }
}

// SOLUTION 4: Enhanced scraping with longer wait times and retries
async function firecrawlScrapeEnhanced(url: string, apiKey: string, attempt: number = 1) {
  const maxAttempts = 2;
  const waitTimes = [3000, 6000]; // Progressive wait times
  
  console.log(`Scraping attempt ${attempt}/${maxAttempts} with ${waitTimes[attempt - 1]}ms wait time`);
  
  const response = await fetch('https://api.firecrawl.dev/v1/scrape', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      url: url,
      formats: ['markdown', 'html'],
      onlyMainContent: true,
      waitFor: waitTimes[attempt - 1],
      skipTlsVerification: false,
      location: {
        country: 'US',
        languages: ['en-US', 'en']
      },
      headers: {
        'Accept': 'text/html,application/xhtml+xml,application/xml',
        'Accept-Language': 'en-US,en;q=0.9',
        'Cache-Control': 'no-cache',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      }
    }),
  });

  const responseData = await response.json();
  
  if (!response.ok) {
    console.error(`Firecrawl error (attempt ${attempt}):`, responseData);
    
    // Retry with longer wait time if available
    if (attempt < maxAttempts) {
      console.log(`Retrying with longer wait time...`);
      await new Promise(resolve => setTimeout(resolve, 2000));
      return firecrawlScrapeEnhanced(url, apiKey, attempt + 1);
    }
    
    throw new Error(`Firecrawl API error: ${response.statusText}`);
  }

  // Validate content
  if (responseData?.data?.markdown) {
    const markdown = responseData.data.markdown;
    
    // Detect problematic content
    if (markdown.includes('cookie') && markdown.includes('consent') && markdown.length < 1000) {
      console.log(`⚠️ Detected cookie consent page (attempt ${attempt})`);
      if (attempt < maxAttempts) {
        console.log(`Retrying with longer wait time...`);
        await new Promise(resolve => setTimeout(resolve, 2000));
        return firecrawlScrapeEnhanced(url, apiKey, attempt + 1);
      }
      throw new Error('Cookie consent page detected');
    }
    
    if (markdown.includes('JFIF') || markdown.includes('ExifMM') || markdown.includes('����')) {
      console.log('⚠️ Detected binary/image data instead of HTML');
      throw new Error('Binary data received instead of HTML');
    }
  }

  return responseData;
}


// Legacy simple scraper (removed - use firecrawlScrapeEnhanced instead)

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const firecrawlApiKey = Deno.env.get('FIRECRAWL_API_KEY');

    if (!firecrawlApiKey) {
      throw new Error('FIRECRAWL_API_KEY not configured');
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    // Verify admin role
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Authorization header required' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const authClient = createClient(supabaseUrl, Deno.env.get('SUPABASE_ANON_KEY')!, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: { user }, error: userError } = await authClient.auth.getUser();
    if (userError || !user) {
      return new Response(JSON.stringify({ error: 'Invalid authentication' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { data: isAdmin } = await supabase.rpc('has_role', {
      _user_id: user.id,
      _role: 'admin',
    });

    if (!isAdmin) {
      return new Response(JSON.stringify({ error: 'Admin role required' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { printerIds } = await req.json() as { printerIds?: string[] };

    console.log('Fetching prices for printers:', printerIds?.length || 'all without prices');

    // Get printers without prices
    let query = supabase
      .from('printers')
      .select('id, model_name, official_product_url, amazon_url_us, amazon_url_ca, amazon_url_uk, printer_brands!brand_id(brand)')
      .eq('status', 'active')
      .not('official_product_url', 'is', null);

    if (printerIds && printerIds.length > 0) {
      query = query.in('id', printerIds);
    } else {
      // Only fetch printers without any price data
      query = query
        .is('msrp_usd', null)
        .is('current_price_usd_store', null)
        .is('current_price_usd_amazon', null);
    }

    const { data: printers, error: fetchError } = await query.limit(5);

    if (fetchError) {
      throw fetchError;
    }

    if (!printers || printers.length === 0) {
      return new Response(
        JSON.stringify({ 
          message: 'No printers found needing price updates',
          updated: 0 
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Processing ${printers.length} printers`);

    const results = [];
    let successCount = 0;
    let failCount = 0;

    for (const printer of printers) {
      try {
        const brand = (printer as any).printer_brands?.brand || 'Unknown';
        console.log(`\n=== Processing: ${brand} ${printer.model_name} ===`);

        // Skip DIY kit brands (Voron, etc.)
        if (brand.toLowerCase().includes('voron') || 
            brand.toLowerCase().includes('ldo motors')) {
          console.log(`Skipping - ${brand} is a DIY kit brand with no official pricing`);
          results.push({
            printer_id: printer.id,
            model_name: printer.model_name,
            success: false,
            error: 'DIY kit - no official pricing'
          });
          continue;
        }

        if (!printer.official_product_url || 
            !printer.official_product_url.startsWith('http')) {
          console.log(`Skipping - invalid URL: ${printer.official_product_url}`);
          failCount++;
          results.push({
            printer_id: printer.id,
            model_name: printer.model_name,
            success: false,
            error: 'Invalid URL'
          });
          continue;
        }

        // Try URL correction first
        const correctedUrl = correctUrlForPricing(printer.official_product_url, brand);
        const urlToScrape = correctedUrl || printer.official_product_url;
        
        if (correctedUrl) {
          console.log(`URL corrected: ${printer.official_product_url} → ${correctedUrl}`);
        }

        let prices: { msrp_usd: number | null; current_price_usd_store: number | null } = { 
          msrp_usd: null, 
          current_price_usd_store: null 
        };

        // Step 1: Try Shopify JSON API first (faster and more reliable for Shopify stores)
        const hostname = new URL(urlToScrape).hostname.toLowerCase();
        const isLikelyShopify = hostname.includes('store.') || hostname.includes('shop.') || 
                                urlToScrape.includes('/products/');
        
        if (isLikelyShopify) {
          console.log('Detected potential Shopify store, trying JSON API first...');
          const shopifyPrices = await tryShopifyJson(urlToScrape);
          if (shopifyPrices) {
            const sanitized = sanitizePrices(shopifyPrices);
            if (sanitized.current_price_usd_store || sanitized.msrp_usd) {
              prices = sanitized;
              console.log('✓ Successfully extracted prices via Shopify JSON API (validated)');
            } else {
              console.log('⚠️ Shopify prices rejected by validation');
            }
          }
        }

        // Step 2: If Shopify didn't work, try Firecrawl scraping with SOLUTION 2 (extract purchase URLs)
        if (!prices.current_price_usd_store) {
          console.log('Attempting Firecrawl scrape...');
          let scrapeResult;
          let scrapeError = null;
          
          try {
            scrapeResult = await firecrawlScrapeEnhanced(urlToScrape, firecrawlApiKey);
            
            if (!scrapeResult?.data?.markdown) {
              throw new Error('No markdown data returned');
            }
            
            console.log(`✓ Scraped ${scrapeResult.data.markdown.length} chars of content`);
            
            // First, try to extract prices from the current page
            const extractedPrices = sanitizePrices(extractPrices(scrapeResult.data.markdown));
            
            if (extractedPrices.current_price_usd_store || extractedPrices.msrp_usd) {
              prices = extractedPrices;
              console.log('✓ Extracted prices from official store (validated):', prices);
            } else {
              // SOLUTION 2: No prices found, try extracting purchase URLs
              console.log('No prices on marketing page, extracting purchase URLs...');
              const purchaseUrls = await extractPurchaseUrls(scrapeResult.data.markdown, urlToScrape);
              
              if (purchaseUrls.length > 0) {
                console.log(`Found ${purchaseUrls.length} potential purchase URLs:`, purchaseUrls.slice(0, 3));
                
                // Try each purchase URL until we find prices (max 1 URL to avoid timeout)
                for (const purchaseUrl of purchaseUrls.slice(0, 1)) { // Try only 1 URL
                  try {
                    console.log(`Trying purchase URL: ${purchaseUrl}`);
                    const purchasePageResult = await firecrawlScrapeEnhanced(purchaseUrl, firecrawlApiKey);
                    
                    if (purchasePageResult?.data?.markdown) {
                      const purchasePagePrices = sanitizePrices(extractPrices(purchasePageResult.data.markdown));
                      
                      if (purchasePagePrices.current_price_usd_store || purchasePagePrices.msrp_usd) {
                        prices = purchasePagePrices;
                        console.log(`✓ Found prices on purchase URL (validated): ${purchaseUrl}`, prices);
                        break;
                      }
                    }
                  } catch (purchaseUrlError) {
                    console.log(`Failed to scrape purchase URL ${purchaseUrl}:`, purchaseUrlError);
                  }
                  
                  // Rate limiting between purchase URL attempts
                  await new Promise(resolve => setTimeout(resolve, 1000));
                }
              }
              
              if (!prices.current_price_usd_store) {
                console.log('✗ No prices found in scraped content or purchase URLs');
              }
            }
          } catch (error) {
            scrapeError = error instanceof Error ? error.message : 'Unknown scrape error';
            console.log(`✗ Failed to scrape ${urlToScrape}: ${scrapeError}`);
            scrapeResult = null;
          }
        }

        // Step 3: If still no prices, try Amazon as fallback (SOLUTION 3)
        if (!prices.msrp_usd && !prices.current_price_usd_store) {
          console.log('No prices from official store, trying Amazon fallback...');
          
          // Try Amazon URLs in order of preference: US, CA, UK
          const amazonUrls = [
            printer.amazon_url_us,
            printer.amazon_url_ca,
            printer.amazon_url_uk
          ].filter(url => url && url.startsWith('http'));
          
          for (const amazonUrl of amazonUrls) {
            try {
              console.log(`Trying Amazon URL: ${amazonUrl}`);
              const amazonResult = await firecrawlScrapeEnhanced(amazonUrl, firecrawlApiKey);
              
              if (amazonResult?.data?.markdown) {
                const amazonPrices = sanitizePrices(extractPrices(amazonResult.data.markdown));
                
                if (amazonPrices.current_price_usd_store) {
                  console.log(`✓ Found Amazon price (validated): $${amazonPrices.current_price_usd_store}`);
                  // Use Amazon price as current store price
                  prices.current_price_usd_store = amazonPrices.current_price_usd_store;
                  if (amazonPrices.msrp_usd) {
                    prices.msrp_usd = amazonPrices.msrp_usd;
                  }
                  break;
                }
              }
            } catch (amazonError) {
              console.log(`Amazon scrape failed for ${amazonUrl}:`, amazonError);
            }
          }
        }

        if (prices.msrp_usd || prices.current_price_usd_store) {
          // Update the printer with found prices
          const updateData: any = {};
          if (prices.msrp_usd) updateData.msrp_usd = prices.msrp_usd;
          if (prices.current_price_usd_store) updateData.current_price_usd_store = prices.current_price_usd_store;

          const { error: updateError } = await supabase
            .from('printers')
            .update(updateData)
            .eq('id', printer.id);

          if (updateError) {
            console.error('Update error:', updateError);
            failCount++;
            results.push({
              printer_id: printer.id,
              model_name: printer.model_name,
              success: false,
              error: updateError.message
            });
          } else {
            console.log(`✓ Updated prices for ${printer.model_name}`);
            successCount++;
            results.push({
              printer_id: printer.id,
              model_name: printer.model_name,
              success: true,
              prices: prices
            });
          }
        } else {
          console.log('No prices found in official store or Amazon');
          failCount++;
          results.push({
            printer_id: printer.id,
            model_name: printer.model_name,
            success: false,
            error: 'No prices found'
          });
        }

        // Rate limiting - wait 1 second between requests
        await new Promise(resolve => setTimeout(resolve, 1000));

      } catch (error) {
        console.error(`Error processing ${printer.model_name}:`, error);
        failCount++;
        results.push({
          printer_id: printer.id,
          model_name: printer.model_name,
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }

    console.log(`\nCompleted: ${successCount} success, ${failCount} failed`);

    return new Response(
      JSON.stringify({
        message: `Price fetch completed`,
        total_processed: printers.length,
        successful: successCount,
        failed: failCount,
        results: results
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Function error:', error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'Unknown error' 
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
