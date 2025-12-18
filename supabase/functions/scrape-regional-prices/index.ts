import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Regional store configurations
const BRAND_REGIONAL_STORES: Record<string, {
  pattern: 'subdomain' | 'path' | 'global';
  baseDomain: string;
  regions: Record<string, { subdomain?: string; currency: string }>;
}> = {
  'Bambu Lab': {
    pattern: 'subdomain',
    baseDomain: 'store.bambulab.com',
    regions: {
      US: { subdomain: 'us', currency: 'USD' },
      CA: { subdomain: 'ca', currency: 'CAD' },
      UK: { subdomain: 'uk', currency: 'GBP' },
      EU: { subdomain: 'eu', currency: 'EUR' },
      AU: { subdomain: 'au', currency: 'AUD' },
      JP: { subdomain: 'jp', currency: 'JPY' },
    }
  },
  'Polymaker': {
    pattern: 'subdomain',
    baseDomain: 'polymaker.com',
    regions: {
      US: { subdomain: 'us', currency: 'USD' },
      EU: { subdomain: 'eu', currency: 'EUR' },
    }
  },
  'Creality': {
    pattern: 'subdomain',
    baseDomain: 'store.creality.com',
    regions: {
      US: { subdomain: 'us', currency: 'USD' },
      CA: { subdomain: 'ca', currency: 'CAD' },
      UK: { subdomain: 'uk', currency: 'GBP' },
      EU: { subdomain: 'eu', currency: 'EUR' },
      AU: { subdomain: 'au', currency: 'AUD' },
    }
  },
  'Anycubic': {
    pattern: 'subdomain',
    baseDomain: 'store.anycubic.com',
    regions: {
      US: { subdomain: 'www', currency: 'USD' },
      CA: { subdomain: 'ca', currency: 'CAD' },
      UK: { subdomain: 'uk', currency: 'GBP' },
      EU: { subdomain: 'eu', currency: 'EUR' },
      AU: { subdomain: 'au', currency: 'AUD' },
    }
  },
  'Elegoo': {
    pattern: 'subdomain',
    baseDomain: 'elegoo.com',
    regions: {
      US: { subdomain: 'us', currency: 'USD' },
      CA: { subdomain: 'ca', currency: 'CAD' },
      UK: { subdomain: 'uk', currency: 'GBP' },
      EU: { subdomain: 'eu', currency: 'EUR' },
      AU: { subdomain: 'au', currency: 'AUD' },
    }
  },
};

// Brand-specific scrape configuration
const BRAND_SCRAPE_CONFIG: Record<string, {
  useFirecrawl: boolean;
  waitFor: number;
}> = {
  'Bambu Lab': { useFirecrawl: true, waitFor: 3000 },
  'Polymaker': { useFirecrawl: true, waitFor: 2000 },
  'Creality': { useFirecrawl: true, waitFor: 2000 },
  'Anycubic': { useFirecrawl: true, waitFor: 2000 },
  'Elegoo': { useFirecrawl: true, waitFor: 2000 },
};

// Transform URL to regional variant
function transformToRegionalUrl(originalUrl: string, vendor: string, region: string): string | null {
  const config = BRAND_REGIONAL_STORES[vendor];
  if (!config || config.pattern === 'global') return null;
  
  const regionConfig = config.regions[region];
  if (!regionConfig) return null;
  
  try {
    const url = new URL(originalUrl);
    const hostParts = url.hostname.split('.');
    const baseDomainParts = config.baseDomain.split('.');
    
    if (config.pattern === 'subdomain') {
      const newSubdomain = regionConfig.subdomain || 'www';
      
      if (hostParts.length > baseDomainParts.length) {
        hostParts[0] = newSubdomain;
      } else {
        hostParts.unshift(newSubdomain);
      }
      
      url.hostname = hostParts.join('.');
      // Clean up query params that might cause issues
      url.search = '';
      return url.toString();
    }
  } catch (e) {
    console.error('Failed to transform URL:', originalUrl, e);
  }
  
  return null;
}

// Generate alternate URL patterns for Bambu Lab and similar stores
function getAlternateUrls(url: string): string[] {
  const alternates: string[] = [url];
  
  try {
    const parsed = new URL(url);
    const pathParts = parsed.pathname.split('/');
    const handle = pathParts[pathParts.length - 1];
    
    // Try adding -filament suffix if not present
    if (!handle.includes('-filament') && !handle.includes('filament')) {
      pathParts[pathParts.length - 1] = handle + '-filament';
      parsed.pathname = pathParts.join('/');
      alternates.push(parsed.toString());
    }
    
    // Try removing -filament suffix if present
    if (handle.includes('-filament')) {
      pathParts[pathParts.length - 1] = handle.replace('-filament', '');
      parsed.pathname = pathParts.join('/');
      alternates.push(parsed.toString());
    }
  } catch (e) {
    // Ignore URL parsing errors
  }
  
  return alternates;
}

// Scrape with Firecrawl for JS-rendered pages
async function scrapeWithFirecrawl(url: string, expectedCurrency: string, waitFor: number = 2000): Promise<{ price: number; currency: string; available: boolean } | null> {
  const firecrawlKey = Deno.env.get('FIRECRAWL_API_KEY');
  
  if (!firecrawlKey) {
    console.log('FIRECRAWL_API_KEY not configured');
    return null;
  }

  try {
    console.log(`Firecrawl scraping: ${url} (wait: ${waitFor}ms)`);
    
    const response = await fetch('https://api.firecrawl.dev/v1/scrape', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${firecrawlKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        url,
        formats: ['markdown', 'html'],
        onlyMainContent: false,
        waitFor,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Firecrawl error ${response.status}:`, errorText);
      return null;
    }

    const data = await response.json();
    
    if (!data.success) {
      console.log('Firecrawl scrape failed:', data.error);
      return null;
    }

    const html = data.data?.html || '';
    const markdown = data.data?.markdown || '';
    
    console.log(`Firecrawl returned HTML length: ${html.length}, Markdown length: ${markdown.length}`);

    // Try to extract price from the response
    const price = extractPriceFromContent(html, markdown, expectedCurrency);
    
    if (price) {
      console.log(`Firecrawl price found: ${price} ${expectedCurrency}`);
      
      // Check availability
      const available = !html.toLowerCase().includes('out of stock') && 
                       !html.toLowerCase().includes('sold out') &&
                       !markdown.toLowerCase().includes('out of stock');
      
      return { price, currency: expectedCurrency, available };
    }

    console.log('Firecrawl: No price found in content');
    return null;
  } catch (e) {
    console.error('Firecrawl error:', e);
    return null;
  }
}

// Extract price from HTML and Markdown content
function extractPriceFromContent(html: string, markdown: string, expectedCurrency: string): number | null {
  // Try JSON-LD first (most reliable)
  const jsonLdPrice = extractFromJsonLd(html);
  if (jsonLdPrice && isValidPrice(jsonLdPrice, expectedCurrency)) {
    console.log(`JSON-LD price: ${jsonLdPrice}`);
    return jsonLdPrice;
  }

  // Try meta tags (second most reliable)
  const metaPrice = extractFromMetaTags(html);
  if (metaPrice && isValidPrice(metaPrice, expectedCurrency)) {
    console.log(`Meta tag price: ${metaPrice}`);
    return metaPrice;
  }

  // Try Shopify-specific patterns
  const shopifyPrice = extractShopifyPrice(html);
  if (shopifyPrice && isValidPrice(shopifyPrice, expectedCurrency)) {
    console.log(`Shopify price: ${shopifyPrice}`);
    return shopifyPrice;
  }

  // Currency-specific patterns with stricter matching
  const currencyPatterns: Record<string, { patterns: RegExp[]; minExpected: number }> = {
    'USD': { 
      patterns: [
        /data-product-price[^>]*>\s*\$\s*(\d{1,3}(?:,\d{3})*\.?\d{0,2})/gi,
        /class="[^"]*current[^"]*price[^"]*"[^>]*>\s*\$\s*(\d{1,3}(?:,\d{3})*\.?\d{0,2})/gi,
        /class="[^"]*product[^"]*price[^"]*"[^>]*>\s*\$\s*(\d{1,3}(?:,\d{3})*\.?\d{0,2})/gi,
      ],
      minExpected: 8 // Filaments usually cost at least $8
    },
    'CAD': { 
      patterns: [
        /data-product-price[^>]*>\s*(?:C\$|CA\$|\$)\s*(\d{1,3}(?:,\d{3})*\.?\d{0,2})/gi,
        /class="[^"]*current[^"]*price[^"]*"[^>]*>\s*(?:C\$|CA\$|\$)\s*(\d{1,3}(?:,\d{3})*\.?\d{0,2})/gi,
        /class="[^"]*product[^"]*price[^"]*"[^>]*>\s*(?:C\$|CA\$|\$)\s*(\d{1,3}(?:,\d{3})*\.?\d{0,2})/gi,
      ],
      minExpected: 10 // CAD prices are higher
    },
    'GBP': { 
      patterns: [
        /data-product-price[^>]*>\s*£\s*(\d{1,3}(?:,\d{3})*\.?\d{0,2})/gi,
        /class="[^"]*current[^"]*price[^"]*"[^>]*>\s*£\s*(\d{1,3}(?:,\d{3})*\.?\d{0,2})/gi,
        /class="[^"]*product[^"]*price[^"]*"[^>]*>\s*£\s*(\d{1,3}(?:,\d{3})*\.?\d{0,2})/gi,
      ],
      minExpected: 8
    },
    'EUR': { 
      patterns: [
        /data-product-price[^>]*>\s*€\s*(\d{1,3}(?:[\s,]\d{3})*[.,]?\d{0,2})/gi,
        /class="[^"]*current[^"]*price[^"]*"[^>]*>\s*€\s*(\d{1,3}(?:[\s,]\d{3})*[.,]?\d{0,2})/gi,
        /class="[^"]*product[^"]*price[^"]*"[^>]*>\s*€\s*(\d{1,3}(?:[\s,]\d{3})*[.,]?\d{0,2})/gi,
      ],
      minExpected: 8
    },
    'AUD': { 
      patterns: [
        /data-product-price[^>]*>\s*(?:A\$|AU\$|\$)\s*(\d{1,3}(?:,\d{3})*\.?\d{0,2})/gi,
        /class="[^"]*current[^"]*price[^"]*"[^>]*>\s*(?:A\$|AU\$|\$)\s*(\d{1,3}(?:,\d{3})*\.?\d{0,2})/gi,
      ],
      minExpected: 10
    },
    'JPY': { 
      patterns: [
        /data-product-price[^>]*>\s*¥\s*(\d{1,6}(?:,\d{3})*)/gi,
        /class="[^"]*current[^"]*price[^"]*"[^>]*>\s*¥\s*(\d{1,6}(?:,\d{3})*)/gi,
      ],
      minExpected: 1000
    },
  };

  const config = currencyPatterns[expectedCurrency] || currencyPatterns['USD'];
  const candidates: number[] = [];
  
  for (const pattern of config.patterns) {
    const matches = html.matchAll(pattern);
    for (const match of matches) {
      const priceStr = match[1].replace(/[,\s]/g, '').replace(',', '.');
      const price = parseFloat(priceStr);
      // Use stricter minimum price validation
      if (price >= config.minExpected && isValidPrice(price, expectedCurrency)) {
        candidates.push(price);
      }
    }
  }

  // If we have candidates, return most common one
  if (candidates.length > 0) {
    const priceCounts = new Map<number, number>();
    for (const p of candidates) {
      priceCounts.set(p, (priceCounts.get(p) || 0) + 1);
    }
    const sorted = Array.from(priceCounts.entries())
      .sort((a, b) => b[1] - a[1] || a[0] - b[0]);
    console.log(`Pattern price (most common): ${sorted[0][0]}`);
    return sorted[0][0];
  }

  // Last resort: look for price in the markdown content with context
  const priceInContextPatterns = [
    /(?:price|cost|buy|add to cart)[^$€£¥]*(?:\$|€|£|¥|C\$|CA\$|A\$)\s*(\d{1,3}(?:,\d{3})*\.?\d{0,2})/gi,
    /(\d{1,3}(?:,\d{3})*\.?\d{0,2})\s*(?:CAD|USD|GBP|EUR|AUD)/gi,
  ];

  for (const pattern of priceInContextPatterns) {
    const matches = markdown.matchAll(pattern);
    for (const match of matches) {
      const priceStr = match[1].replace(/,/g, '');
      const price = parseFloat(priceStr);
      if (price >= config.minExpected && isValidPrice(price, expectedCurrency)) {
        console.log(`Markdown context price: ${price}`);
        return price;
      }
    }
  }

  return null;
}

function extractFromJsonLd(html: string): number | null {
  const jsonLdMatch = html.match(/<script type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/gi);
  if (!jsonLdMatch) return null;

  for (const match of jsonLdMatch) {
    try {
      const jsonContent = match.replace(/<script[^>]*>|<\/script>/gi, '');
      const jsonData = JSON.parse(jsonContent);
      
      // Handle array of schemas
      const schemas = Array.isArray(jsonData) ? jsonData : [jsonData];
      
      for (const schema of schemas) {
        if (schema['@type'] === 'Product' && schema.offers) {
          const offers = Array.isArray(schema.offers) ? schema.offers[0] : schema.offers;
          if (offers.price) {
            const price = parseFloat(String(offers.price).replace(/[^0-9.]/g, ''));
            if (!isNaN(price) && price > 0) {
              return price;
            }
          }
        }
      }
    } catch (e) {
      // Continue to next JSON-LD block
    }
  }
  return null;
}

function extractFromMetaTags(html: string): number | null {
  const ogPriceMatch = html.match(/<meta[^>]*property="product:price:amount"[^>]*content="([^"]+)"/i) ||
                       html.match(/<meta[^>]*content="([^"]+)"[^>]*property="product:price:amount"/i);
  if (ogPriceMatch) {
    const price = parseFloat(ogPriceMatch[1].replace(/[^0-9.]/g, ''));
    if (!isNaN(price) && price > 0) {
      return price;
    }
  }
  return null;
}

function extractShopifyPrice(html: string): number | null {
  // Shopify stores often have price in data attributes or JSON
  const patterns = [
    /data-product-price="(\d+)"/i, // Often in cents
    /"price":\s*(\d+)/i, // JSON price in cents
    /data-price="(\d+\.?\d*)"/i,
    /"current_price":\s*(\d+)/i,
  ];

  for (const pattern of patterns) {
    const match = html.match(pattern);
    if (match) {
      let price = parseFloat(match[1]);
      // Shopify often stores prices in cents
      if (price > 10000) price = price / 100;
      if (price > 0 && price < 10000) {
        return price;
      }
    }
  }
  return null;
}

function isValidPrice(price: number, currency: string): boolean {
  if (isNaN(price) || price <= 0) return false;
  
  // Currency-specific validation ranges
  const ranges: Record<string, [number, number]> = {
    'USD': [1, 500],
    'CAD': [1, 700],
    'GBP': [1, 400],
    'EUR': [1, 500],
    'AUD': [1, 800],
    'JPY': [100, 100000],
  };
  
  const [min, max] = ranges[currency] || [1, 10000];
  return price >= min && price <= max;
}

// Try Shopify JSON API
async function tryShopifyJson(url: string, expectedCurrency: string): Promise<{ price: number; currency: string; available: boolean } | null> {
  try {
    const cleanUrl = url.replace(/\?.*$/, '');
    const jsonUrl = cleanUrl + '.json';
    
    console.log(`Trying Shopify JSON: ${jsonUrl}`);
    
    const response = await fetch(jsonUrl, {
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      },
    });
    
    if (!response.ok) {
      console.log(`Shopify JSON returned ${response.status}`);
      return null;
    }
    
    const data = await response.json();
    const product = data.product;
    
    if (!product || !product.variants || product.variants.length === 0) {
      console.log('No product variants in JSON');
      return null;
    }
    
    const variant = product.variants.find((v: any) => v.available) || product.variants[0];
    const price = parseFloat(variant.price);
    
    if (isNaN(price) || price <= 0) {
      console.log('Invalid price in JSON:', variant.price);
      return null;
    }
    
    console.log(`Shopify JSON success: ${price} ${expectedCurrency}`);
    
    return {
      price,
      currency: expectedCurrency,
      available: variant.available || false,
    };
  } catch (e) {
    console.error('Shopify JSON error:', e);
    return null;
  }
}

// Scrape price from HTML page as fallback
async function scrapeFromHtml(url: string, expectedCurrency: string): Promise<{ price: number; currency: string; available: boolean } | null> {
  try {
    console.log(`Scraping HTML: ${url}`);
    
    const response = await fetch(url, {
      headers: {
        'Accept': 'text/html',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      },
      redirect: 'follow',
    });
    
    if (!response.ok) {
      console.log(`HTML fetch returned ${response.status}`);
      return null;
    }
    
    const html = await response.text();
    
    // Check if we got redirected to wrong region
    const finalUrl = response.url;
    if (!finalUrl.includes(new URL(url).hostname.split('.')[0])) {
      console.log(`Redirected to different region: ${finalUrl}`);
      return null;
    }
    
    const price = extractPriceFromContent(html, '', expectedCurrency);
    
    if (price) {
      const available = !html.toLowerCase().includes('out of stock') && 
                       !html.toLowerCase().includes('sold out');
      return { price, currency: expectedCurrency, available };
    }
    
    console.log('No price found in HTML');
    return null;
  } catch (e) {
    console.error('HTML scrape error:', e);
    return null;
  }
}

// Main scraping function for a single filament
async function scrapeRegionalPricesForFilament(
  filament: { id: string; product_url: string; vendor: string },
  regions: string[]
): Promise<{
  prices: Record<string, { price: number; currency: string }>;
  urls: Record<string, string>;
  errors: string[];
}> {
  const prices: Record<string, { price: number; currency: string }> = {};
  const urls: Record<string, string> = {};
  const errors: string[] = [];
  
  const regionConfig = BRAND_REGIONAL_STORES[filament.vendor];
  if (!regionConfig) {
    errors.push(`No regional config for vendor: ${filament.vendor}`);
    return { prices, urls, errors };
  }

  const scrapeConfig = BRAND_SCRAPE_CONFIG[filament.vendor] || { useFirecrawl: false, waitFor: 0 };
  
  for (const region of regions) {
    try {
      const regionData = regionConfig.regions[region];
      if (!regionData) {
        console.log(`Region ${region} not supported for ${filament.vendor}`);
        continue;
      }
      
      const regionalUrl = transformToRegionalUrl(filament.product_url, filament.vendor, region);
      
      if (!regionalUrl) {
        console.log(`No regional URL for ${filament.vendor} ${region}`);
        continue;
      }
      
      console.log(`\nScraping ${region}: ${regionalUrl}`);
      
      // Always store the transformed regional URL (not the final redirect)
      urls[region] = regionalUrl;
      
      // Get alternate URLs to try
      const urlsToTry = getAlternateUrls(regionalUrl);
      let result: { price: number; currency: string; available: boolean } | null = null;
      
      for (const urlToTry of urlsToTry) {
        console.log(`Trying URL: ${urlToTry}`);
        
        // Try Firecrawl first for JS-rendered brands
        if (scrapeConfig.useFirecrawl && !result) {
          result = await scrapeWithFirecrawl(urlToTry, regionData.currency, scrapeConfig.waitFor);
        }
        
        // Fallback to Shopify JSON
        if (!result) {
          result = await tryShopifyJson(urlToTry, regionData.currency);
        }
        
        // Fallback to HTML scraping
        if (!result) {
          result = await scrapeFromHtml(urlToTry, regionData.currency);
        }
        
        if (result) {
          // Update URL to the one that worked
          urls[region] = urlToTry;
          break;
        }
      }
      
      if (result) {
        prices[region] = {
          price: result.price,
          currency: result.currency,
        };
        console.log(`SUCCESS ${region}: ${result.price} ${result.currency}`);
      } else {
        errors.push(`${region}: Could not extract price`);
      }
      
      // Rate limit
      await new Promise(resolve => setTimeout(resolve, 500));
      
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Unknown error';
      errors.push(`${region}: ${msg}`);
      console.error(`Error for ${region}:`, e);
    }
  }
  
  return { prices, urls, errors };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { filamentId, filamentIds, brand, regions = ['US', 'CA', 'UK', 'EU', 'AU'], limit = 5, forceUpdate = false } = await req.json();

    console.log('Request params:', { filamentId, filamentIds, brand, regions, limit, forceUpdate });

    // Build query
    let query = supabase
      .from('filaments')
      .select('id, product_url, vendor, product_title, variant_price');

    if (filamentId) {
      query = query.eq('id', filamentId);
    } else if (filamentIds && filamentIds.length > 0) {
      query = query.in('id', filamentIds);
    } else if (brand) {
      query = query.ilike('vendor', brand);
    }

    // Filter to brands with regional stores
    const regionalBrands = Object.keys(BRAND_REGIONAL_STORES);
    query = query.in('vendor', regionalBrands);

    // Filter to filaments with product URLs
    query = query.not('product_url', 'is', null);

    // Unless force update, only get filaments not recently updated
    if (!forceUpdate) {
      const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
      query = query.or(`regional_prices_updated_at.is.null,regional_prices_updated_at.lt.${oneDayAgo}`);
    }

    query = query.order('regional_prices_updated_at', { ascending: true, nullsFirst: true }).limit(limit);

    const { data: filaments, error } = await query;

    if (error) throw error;

    if (!filaments || filaments.length === 0) {
      return new Response(
        JSON.stringify({ success: true, message: 'No filaments to process', processed: 0 }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Processing ${filaments.length} filaments`);

    const results: {
      id: string;
      title: string;
      vendor: string;
      prices: Record<string, number>;
      urls: Record<string, string>;
      errors: string[];
    }[] = [];

    for (const filament of filaments) {
      if (!filament.product_url || !filament.vendor) continue;

      console.log(`\n========================================`);
      console.log(`Processing: ${filament.product_title} (${filament.vendor})`);
      console.log(`Base URL: ${filament.product_url}`);

      const { prices, urls, errors } = await scrapeRegionalPricesForFilament(
        { id: filament.id, product_url: filament.product_url, vendor: filament.vendor },
        regions
      );

      // Prepare update data
      const updateData: Record<string, any> = {
        regional_prices_updated_at: new Date().toISOString(),
        url_validated_at: new Date().toISOString(),
        url_validation_status: Object.keys(prices).length > 0 ? 'valid' : 'invalid',
      };

      // Map prices to database columns
      const priceColumnMap: Record<string, string> = {
        CA: 'price_cad',
        UK: 'price_gbp',
        EU: 'price_eur',
        AU: 'price_aud',
        JP: 'price_jpy',
      };

      const urlColumnMap: Record<string, string> = {
        CA: 'product_url_ca',
        UK: 'product_url_uk',
        EU: 'product_url_eu',
        AU: 'product_url_au',
        JP: 'product_url_jp',
      };

      // Store prices
      for (const [region, data] of Object.entries(prices)) {
        const priceCol = priceColumnMap[region];
        if (priceCol) {
          updateData[priceCol] = data.price;
        }
        // Update US price in variant_price
        if (region === 'US') {
          updateData.variant_price = data.price;
        }
      }

      // Store regional URLs
      for (const [region, url] of Object.entries(urls)) {
        const urlCol = urlColumnMap[region];
        if (urlCol) {
          updateData[urlCol] = url;
        }
      }

      console.log('Updating DB with:', JSON.stringify(updateData, null, 2));

      // Update database
      const { error: updateError } = await supabase
        .from('filaments')
        .update(updateData)
        .eq('id', filament.id);

      if (updateError) {
        console.error('Update error:', updateError);
        errors.push(`Database update failed: ${updateError.message}`);
      } else {
        console.log('Database updated successfully');
      }

      results.push({
        id: filament.id,
        title: filament.product_title || 'Unknown',
        vendor: filament.vendor,
        prices: Object.fromEntries(Object.entries(prices).map(([k, v]) => [k, v.price])),
        urls,
        errors,
      });

      // Rate limit between filaments
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    const successCount = results.filter(r => Object.keys(r.prices).length > 0).length;
    const errorCount = results.filter(r => r.errors.length > 0).length;

    return new Response(
      JSON.stringify({
        success: true,
        message: `Processed ${results.length} filaments. ${successCount} with prices, ${errorCount} with errors.`,
        processed: results.length,
        successCount,
        errorCount,
        results,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (e) {
    console.error('Edge function error:', e);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: e instanceof Error ? e.message : 'Unknown error' 
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
