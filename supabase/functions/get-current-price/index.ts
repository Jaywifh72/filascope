import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ShopifyVariant {
  id: number;
  title: string;
  price: string;
  available: boolean;
  compare_at_price: string | null;
  grams?: number;
}

interface ShopifyProduct {
  product: {
    id: number;
    title: string;
    variants: ShopifyVariant[];
  };
}

interface PriceResponse {
  success: boolean;
  price: number | null;
  compareAtPrice: number | null;
  weightGrams: number | null;
  diameterMm: number | null;
  variantTitle: string | null;
  currency: string;
  available: boolean;
  source: 'shopify' | 'firecrawl' | 'html' | 'cached';
  fetchedAt: string;
  error?: string;
}

interface BrandExtractionConfig {
  priceSectionAnchor?: string;
  pricePatterns?: string[];
  excludePatterns?: string[];
  priceRangeMin?: number;
  priceRangeMax?: number;
  currencyDetection?: string;
}

interface BrandConfig {
  id: string;
  brand_slug: string;
  brand_name: string;
  base_url: string;
  extraction_method: string;
  price_extraction_config: BrandExtractionConfig;
  extraction_working: boolean;
  default_currency: string | null;
}

// Initialize Supabase client for brand config lookup
function getSupabaseClient() {
  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  return createClient(supabaseUrl, supabaseKey);
}

// Extract domain from URL for brand matching
function extractDomain(url: string): string {
  try {
    const urlObj = new URL(url);
    return urlObj.hostname.replace(/^www\./, '');
  } catch {
    return '';
  }
}

// Find brand config based on URL domain
async function findBrandConfigByUrl(url: string): Promise<BrandConfig | null> {
  const domain = extractDomain(url);
  if (!domain) return null;
  
  const supabase = getSupabaseClient();
  
  // Query automated_brands table for matching base_url
  const { data, error } = await supabase
    .from('automated_brands')
    .select('id, brand_slug, brand_name, base_url, extraction_method, price_extraction_config, extraction_working, default_currency')
    .eq('is_visible', true)
    .order('brand_name');
  
  if (error || !data) {
    console.log('Error fetching brand configs:', error);
    return null;
  }
  
  // Find matching brand by domain
  const brand = data.find(b => {
    const brandDomain = extractDomain(b.base_url);
    return domain.includes(brandDomain) || brandDomain.includes(domain);
  });
  
  return brand || null;
}

// Log extraction attempt to database
async function logExtractionAttempt(
  brandId: string | null,
  brandSlug: string | null,
  productUrl: string,
  method: string,
  success: boolean,
  price: number | null,
  currency: string,
  errorMessage: string | null,
  rawSample: string | null,
  responseTimeMs: number
) {
  try {
    const supabase = getSupabaseClient();
    await supabase.from('price_extraction_logs').insert({
      brand_id: brandId,
      brand_slug: brandSlug,
      product_url: productUrl,
      extraction_method: method,
      success,
      extracted_price: price,
      currency,
      error_message: errorMessage,
      raw_content_sample: rawSample?.substring(0, 500),
      response_time_ms: responseTimeMs,
    });
  } catch (err) {
    console.error('Failed to log extraction attempt:', err);
  }
}

// Default patterns to exclude discount/savings amounts from price extraction
const DEFAULT_EXCLUDE_PATTERNS = [
  'save\\s+\\$',           // "Save $7.26"
  'saving\\s+\\$',         // "Saving $10"
  'discount\\s+\\$',       // "Discount $5"
  'off\\s+\\$',            // "off $20"
  'coupon\\s+.*\\$',       // "$500 coupon"
  '\\$\\d+\\s*off',        // "$5 off"
  '\\$\\d+\\s*coupon',     // "$500 coupon"
  'student\\s*discount',   // Student discount sections
];

// CRITICAL: Remove promotional patterns from text BEFORE extracting prices
// This prevents capturing savings amounts, coupon values, etc. as product prices
function removeSavingsAmounts(text: string): string {
  let cleaned = text;
  
  // CRITICAL: Remove entire promotional lines/sections FIRST (before any price extraction)
  // Remove lines containing "coupon pack" - e.g., "💵 $500 coupon pack for your order!"
  cleaned = cleaned.replace(/[^\n]*\$\d+[^\n]*coupon\s*pack[^\n]*/gi, ' ');
  // Remove lines containing "obtain" + dollar amount (promotional signup)
  cleaned = cleaned.replace(/[^\n]*obtain[^\n]*\$\d+[^\n]*/gi, ' ');
  // Remove lines with "Subscribe" and dollar amounts
  cleaned = cleaned.replace(/[^\n]*subscribe[^\n]*\$\d+[^\n]*/gi, ' ');
  // Remove student discount promotional lines
  cleaned = cleaned.replace(/[^\n]*student\s*discount[^\n]*\$\d+[^\n]*/gi, ' ');
  
  // Standard savings patterns
  cleaned = cleaned.replace(/Save\s*\$[\d,.]+/gi, ' ');
  cleaned = cleaned.replace(/Saving\s*\$[\d,.]+/gi, ' ');
  cleaned = cleaned.replace(/\$[\d,.]+\s*off\b/gi, ' ');
  cleaned = cleaned.replace(/\$[\d,.]+\s*discount/gi, ' ');
  cleaned = cleaned.replace(/\$[\d,.]+\s*coupon/gi, ' ');
  cleaned = cleaned.replace(/💵?\s*\$[\d,.]+\s*coupon\s*pack/gi, ' ');
  cleaned = cleaned.replace(/💵\s*\$[\d,.]+/gi, ' '); // Remove emoji + price (like 💵 $500)
  
  return cleaned;
}

// Extract prices from text, ensuring we NEVER capture savings amounts
// Format: "$18.99 $34.25 Save $15.26" -> returns salePrice=18.99, compareAtPrice=34.25
function extractSalePriceBeforeSave(text: string): {
  salePrice: number | null;
  compareAtPrice: number | null;
} {
  console.log('extractSalePriceBeforeSave input sample:', text.substring(0, 300));
  
  // STEP 1: Clean the text by removing savings patterns FIRST
  const cleanedText = removeSavingsAmounts(text);
  console.log('After removing savings:', cleanedText.substring(0, 300));
  
  // STEP 2: Extract all dollar amounts from the CLEANED text
  const priceMatches = cleanedText.match(/\$(\d+\.?\d*)/g);
  
  if (!priceMatches || priceMatches.length === 0) {
    console.log('No prices found in cleaned text');
    return { salePrice: null, compareAtPrice: null };
  }
  
  // Parse all found prices
  const prices = priceMatches
    .map(p => parseFloat(p.replace('$', '')))
    .filter(p => !isNaN(p) && p > 0);
  
  console.log('Extracted prices from cleaned text:', prices);
  
  if (prices.length === 0) {
    return { salePrice: null, compareAtPrice: null };
  }
  
  // STEP 3: The first price is typically the sale/current price
  // If there are two prices and the first is less than the second, that confirms it
  if (prices.length >= 2) {
    const [first, second] = prices;
    if (first < second) {
      // First is sale price, second is compare-at (original)
      console.log(`Identified: salePrice=$${first}, compareAtPrice=$${second}`);
      return { salePrice: first, compareAtPrice: second };
    } else if (second < first) {
      // Second is sale price, first is compare-at
      console.log(`Identified (reversed): salePrice=$${second}, compareAtPrice=$${first}`);
      return { salePrice: second, compareAtPrice: first };
    }
  }
  
  // Single price or equal prices - just return the first
  console.log(`Single/equal price: $${prices[0]}`);
  return { salePrice: prices[0], compareAtPrice: null };
}

// Apply configured price patterns to markdown content
function extractPriceWithConfig(
  markdown: string,
  config: BrandExtractionConfig,
  preferredCurrency: string
): {
  price: number | null;
  compareAtPrice: number | null;
  currency: string;
  available: boolean;
  matchedPattern: string | null;
} {
  // Use higher minimum for filament to avoid capturing weights/discounts
  const priceRangeMin = config.priceRangeMin ?? 10;
  const priceRangeMax = config.priceRangeMax ?? 150;
  
  // First, try to extract using the Creality sale format pattern
  const saleResult = extractSalePriceBeforeSave(markdown);
  if (saleResult.salePrice && saleResult.salePrice >= priceRangeMin && saleResult.salePrice <= priceRangeMax) {
    // CRITICAL: Also validate compareAtPrice - it must be within reasonable range (not $500 coupon packs!)
    // Compare-at price should be reasonable (max 3x the sale price or within $200)
    const maxCompareAt = Math.min(200, saleResult.salePrice * 3);
    const validCompareAt = saleResult.compareAtPrice && 
      saleResult.compareAtPrice >= priceRangeMin && 
      saleResult.compareAtPrice <= maxCompareAt &&
      saleResult.compareAtPrice > saleResult.salePrice;
    
    console.log(`Sale format extraction: $${saleResult.salePrice}, compare: ${validCompareAt ? `$${saleResult.compareAtPrice}` : 'invalid/filtered'}`);
    return {
      price: saleResult.salePrice,
      compareAtPrice: validCompareAt ? saleResult.compareAtPrice : null,
      currency: preferredCurrency,
      available: true,
      matchedPattern: 'sale-before-save',
    };
  }
  
  // Remove savings amounts from the text
  let cleanedMarkdown = removeSavingsAmounts(markdown);
  
  // Combine default excludes with configured excludes for additional cleaning
  const excludePatterns = [
    ...DEFAULT_EXCLUDE_PATTERNS,
    ...(config.excludePatterns || [])
  ];
  
  // Pre-filter: Remove lines containing discount patterns
  for (const pattern of excludePatterns) {
    try {
      const lineExcludeRegex = new RegExp(`^.*${pattern}.*$`, 'gim');
      cleanedMarkdown = cleanedMarkdown.replace(lineExcludeRegex, '');
    } catch (e) {
      // Ignore invalid patterns
    }
  }
  
  // Determine search section using anchor text
  let priceSection = cleanedMarkdown;
  if (config.priceSectionAnchor) {
    const anchorRegex = new RegExp(config.priceSectionAnchor, 'i');
    const anchorIndex = cleanedMarkdown.search(anchorRegex);
    if (anchorIndex > -1) {
      priceSection = cleanedMarkdown.slice(Math.max(0, anchorIndex - 500), anchorIndex + 200);
    }
  }
  
  // Try configured price patterns first
  if (config.pricePatterns && config.pricePatterns.length > 0) {
    for (const pattern of config.pricePatterns) {
      try {
        const regex = new RegExp(pattern, 'i');
        const match = priceSection.match(regex);
        if (match && match[1]) {
          const price = parseFloat(match[1].replace(',', ''));
          if (price >= priceRangeMin && price <= priceRangeMax) {
            console.log(`Pattern match: ${pattern} -> $${price}`);
            
            let compareAt: number | null = null;
            const allPrices = [...priceSection.matchAll(/\$(\d+(?:\.\d{2})?)/g)]
              .map(m => parseFloat(m[1]))
              .filter(p => p >= priceRangeMin && p <= priceRangeMax && p !== price);
            if (allPrices.length > 0) {
              const higherPrice = allPrices.find(p => p > price);
              if (higherPrice) compareAt = higherPrice;
            }
            
            return {
              price,
              compareAtPrice: compareAt,
              currency: preferredCurrency,
              available: true,
              matchedPattern: pattern,
            };
          }
        }
      } catch (e) {
        console.log(`Invalid price pattern: ${pattern}`);
      }
    }
  }
  
  // Fallback: find all prices in cleaned section, filter to valid range
  const allPrices = [...priceSection.matchAll(/\$(\d+(?:\.\d{2})?)/g)]
    .map(m => parseFloat(m[1]))
    .filter(p => p >= priceRangeMin && p <= priceRangeMax)
    .sort((a, b) => a - b);
  
  if (allPrices.length > 0) {
    const price = allPrices[0];
    const compareAt = allPrices.length > 1 && allPrices[1] > price * 1.1 ? allPrices[1] : null;
    return {
      price,
      compareAtPrice: compareAt,
      currency: preferredCurrency,
      available: true,
      matchedPattern: 'fallback-generic',
    };
  }
  
  return {
    price: null,
    compareAtPrice: null,
    currency: preferredCurrency,
    available: false,
    matchedPattern: null,
  };
}

// Legacy: Detect custom storefronts that don't support Shopify JSON API
function detectCustomStorefront(url: string): 'bambulab' | 'prusa' | 'opencart' | 'creality' | null {
  if (url.includes('store.bambulab.com')) return 'bambulab';
  if (url.includes('prusa3d.com')) return 'prusa';
  if (url.includes('geeetech.com')) return 'opencart';
  if (url.includes('store.creality.com')) return 'creality';
  return null;
}

// Validate that a price is within reasonable range for filament products
// Minimum raised to $10 to avoid capturing weights, discount amounts, or shipping costs
function validateFilamentPrice(price: number, min = 10, max = 150): boolean {
  return price >= min && price <= max;
}

// Legacy: Extract price specifically from Creality store pages
function extractCrealityPrice(markdown: string): {
  price: number | null;
  compareAtPrice: number | null;
  currency: string;
  available: boolean;
} {
  console.log('Extracting Creality price (legacy)...');
  
  // First, try the sale format pattern: "$18.99 $34.25 Save $15.26"
  const saleResult = extractSalePriceBeforeSave(markdown);
  if (saleResult.salePrice && validateFilamentPrice(saleResult.salePrice)) {
    console.log(`Creality sale format: $${saleResult.salePrice}, compare-at: $${saleResult.compareAtPrice}`);
    return { 
      price: saleResult.salePrice, 
      compareAtPrice: saleResult.compareAtPrice, 
      currency: 'USD', 
      available: true 
    };
  }
  
  // Remove savings amounts from text
  let cleanedMarkdown = removeSavingsAmounts(markdown);
  
  // Find price section near Add to Cart/Buy Now buttons
  const addToCartIndex = cleanedMarkdown.search(/Add\s*to\s*Cart/i);
  const buyNowIndex = cleanedMarkdown.search(/Buy\s*Now/i);
  const priceIndex = Math.max(addToCartIndex, buyNowIndex);
  
  let priceSection = '';
  if (priceIndex > -1) {
    priceSection = cleanedMarkdown.slice(Math.max(0, priceIndex - 500), priceIndex + 100);
  }
  
  // Look for explicit sale price patterns
  const saleMatch = cleanedMarkdown.match(/(?:Sale\s*price|Now|Special)\s*[:.]?\s*\$(\d+(?:\.\d{2})?)/i);
  
  // Pattern: Two prices adjacent (sale and regular)
  const dualPriceMatch = priceSection.match(/\$(\d+(?:\.\d{2})?)\s*(?:[\s\n~-]*)\$(\d+(?:\.\d{2})?)/);
  if (dualPriceMatch) {
    const price1 = parseFloat(dualPriceMatch[1]);
    const price2 = parseFloat(dualPriceMatch[2]);
    const salePrice = Math.min(price1, price2);
    const comparePrice = Math.max(price1, price2);
    
    if (validateFilamentPrice(salePrice) && validateFilamentPrice(comparePrice, 10, 200)) {
      console.log(`Found Creality dual price: $${salePrice}, compare-at: $${comparePrice}`);
      return { price: salePrice, compareAtPrice: comparePrice, currency: 'USD', available: true };
    }
  }
  
  // Extract all valid prices from the cleaned price section
  const allPricesInSection = priceSection.match(/\$(\d+(?:\.\d{2})?)/g);
  if (allPricesInSection) {
    const validPrices = allPricesInSection
      .map(p => parseFloat(p.replace('$', '')))
      .filter(p => validateFilamentPrice(p))
      .sort((a, b) => a - b);
    
    if (validPrices.length > 0) {
      const price = validPrices[0];
      const compareAt = validPrices.length > 1 && validPrices[1] > price * 1.1 ? validPrices[1] : null;
      console.log(`Found Creality price: $${price}${compareAt ? `, compare-at: $${compareAt}` : ''}`);
      return { price, compareAtPrice: compareAt, currency: 'USD', available: true };
    }
  }
  
  // Try explicit sale match
  if (saleMatch) {
    const price = parseFloat(saleMatch[1]);
    if (validateFilamentPrice(price)) {
      console.log(`Found Creality explicit sale price: $${price}`);
      return { price, compareAtPrice: null, currency: 'USD', available: true };
    }
  }
  
  // Last resort: search full cleaned markdown
  const allPrices = [...cleanedMarkdown.matchAll(/\$(\d+(?:\.\d{2})?)/g)]
    .map(m => parseFloat(m[1]))
    .filter(p => validateFilamentPrice(p))
    .sort((a, b) => a - b);
  
  if (allPrices.length > 0) {
    console.log(`Creality fallback: found ${allPrices.length} valid prices, using lowest: $${allPrices[0]}`);
    return {
      price: allPrices[0],
      compareAtPrice: allPrices.length > 1 && allPrices[1] > allPrices[0] * 1.1 ? allPrices[1] : null,
      currency: 'USD',
      available: true,
    };
  }
  
  console.log('No valid Creality price found');
  return { price: null, compareAtPrice: null, currency: 'USD', available: false };
}

// Detect Shopify stores known to use multi-currency
function isMultiCurrencyShopifyStore(url: string): boolean {
  const multiCurrencyDomains = ['polymaker.com', 'esun3d.com', 'sunlu.com', 'overture3d.com'];
  const urlLower = url.toLowerCase();
  return multiCurrencyDomains.some(domain => urlLower.includes(domain));
}

// Detect stores where Shopify JSON API returns unreliable prices
function shouldAlwaysUseFirecrawl(url: string): boolean {
  const unreliableJsonStores = ['amolen.com'];
  const urlLower = url.toLowerCase();
  return unreliableJsonStores.some(domain => urlLower.includes(domain));
}

// Map currency to Firecrawl location settings
function getFirecrawlLocation(currency: string): { country: string; languages: string[] } {
  switch (currency) {
    case 'CAD': return { country: 'CA', languages: ['en-CA', 'en'] };
    case 'GBP': return { country: 'GB', languages: ['en-GB', 'en'] };
    case 'EUR': return { country: 'DE', languages: ['de-DE', 'en'] };
    case 'AUD': return { country: 'AU', languages: ['en-AU', 'en'] };
    case 'JPY': return { country: 'JP', languages: ['ja-JP', 'en'] };
    default: return { country: 'US', languages: ['en-US', 'en'] };
  }
}

// Legacy: Extract price from GEEETECH OpenCart pages
function extractOpenCartPrice(markdown: string): {
  price: number | null;
  compareAtPrice: number | null;
  currency: string;
  available: boolean;
} {
  console.log('Extracting OpenCart/GEEETECH price (legacy)...');
  
  const skuIndex = markdown.search(/SKU:\s*[\d\-]+/i);
  let priceSection = skuIndex > -1 ? markdown.slice(skuIndex, skuIndex + 500) : '';
  
  if (!priceSection) {
    const cartIndex = markdown.search(/Add\s*to\s*Cart/i);
    if (cartIndex > -1) {
      priceSection = markdown.slice(Math.max(0, cartIndex - 300), cartIndex);
    }
  }
  
  if (!priceSection) {
    const lines = markdown.split('\n');
    const startLine = Math.floor(lines.length * 0.15);
    const endLine = Math.floor(lines.length * 0.5);
    priceSection = lines.slice(startLine, endLine).join('\n');
  }
  
  const salePriceMatch = priceSection.match(/\$(\d+(?:\.\d{2})?)\s*(?:\n|\s)*\$(\d+(?:\.\d{2})?)/);
  if (salePriceMatch) {
    const price1 = parseFloat(salePriceMatch[1]);
    const price2 = parseFloat(salePriceMatch[2]);
    const salePrice = Math.min(price1, price2);
    const comparePrice = Math.max(price1, price2);
    
    if (salePrice >= 5 && salePrice <= 50 && comparePrice <= 60) {
      console.log(`Found OpenCart sale price: $${salePrice}, compare-at: $${comparePrice}`);
      return { price: salePrice, compareAtPrice: comparePrice, currency: 'USD', available: true };
    }
  }
  
  const allPrices = priceSection.match(/\$(\d+(?:\.\d{2})?)/g);
  if (allPrices) {
    const validPrices = allPrices.map(p => parseFloat(p.replace('$', ''))).filter(p => p >= 5 && p <= 50);
    if (validPrices.length > 0) {
      console.log(`Found OpenCart single price: $${validPrices[0]}`);
      return { price: validPrices[0], compareAtPrice: null, currency: 'USD', available: true };
    }
  }
  
  console.log('No valid OpenCart price found');
  return { price: null, compareAtPrice: null, currency: 'USD', available: false };
}

// Legacy: Extract price from Bambu Lab and generic stores
function extractBambuLabPrice(markdown: string, preferredCurrency: string): {
  price: number | null;
  compareAtPrice: number | null;
  currency: string;
  available: boolean;
} {
  console.log(`Extracting price from content, preferred currency: ${preferredCurrency}`);
  
  const currencyPatterns = ['CAD', 'USD', 'GBP', 'EUR', 'AUD', 'JPY'];
  
  // Pattern 1: Shopify multi-currency format
  const shopifySaleRegex = new RegExp(
    `Sale\\s*price\\s*\\$([\\d,]+(?:\\.\\d{2})?)\\s*${preferredCurrency}[^\\d]*Regular\\s*price\\s*\\$([\\d,]+(?:\\.\\d{2})?)\\s*${preferredCurrency}`,
    'i'
  );
  const shopifySaleMatch = markdown.match(shopifySaleRegex);
  if (shopifySaleMatch) {
    const salePrice = parseFloat(shopifySaleMatch[1].replace(',', ''));
    const regularPrice = parseFloat(shopifySaleMatch[2].replace(',', ''));
    console.log(`Found Shopify sale format: $${salePrice} ${preferredCurrency}, regular: $${regularPrice}`);
    return { price: salePrice, compareAtPrice: regularPrice, currency: preferredCurrency, available: true };
  }
  
  // Pattern 2: Bambu Lab style back-to-back prices
  const preferredPriceRegex = new RegExp(
    `\\$([\\d,]+(?:\\.\\d{2})?)\\s*${preferredCurrency}(?:\\$([\\d,]+(?:\\.\\d{2})?)\\s*${preferredCurrency})?`,
    'i'
  );
  
  const preferredMatch = markdown.match(preferredPriceRegex);
  if (preferredMatch) {
    const price1 = parseFloat(preferredMatch[1].replace(',', ''));
    const price2 = preferredMatch[2] ? parseFloat(preferredMatch[2].replace(',', '')) : null;
    
    if (price2 !== null) {
      const salePrice = Math.min(price1, price2);
      const comparePrice = Math.max(price1, price2);
      console.log(`Found ${preferredCurrency} sale price: $${salePrice}, compare-at: $${comparePrice}`);
      return { price: salePrice, compareAtPrice: comparePrice, currency: preferredCurrency, available: true };
    }
    
    console.log(`Found ${preferredCurrency} price: $${price1}`);
    return { price: price1, compareAtPrice: null, currency: preferredCurrency, available: true };
  }
  
  // Try other currencies as fallback
  for (const cur of currencyPatterns) {
    const priceRegex = new RegExp(
      `\\$([\\d,]+(?:\\.\\d{2})?)\\s*${cur}(?:\\$([\\d,]+(?:\\.\\d{2})?)\\s*${cur})?`,
      'i'
    );
    const match = markdown.match(priceRegex);
    if (match) {
      const price1 = parseFloat(match[1].replace(',', ''));
      const price2 = match[2] ? parseFloat(match[2].replace(',', '')) : null;
      
      if (price2 !== null) {
        const salePrice = Math.min(price1, price2);
        const comparePrice = Math.max(price1, price2);
        console.log(`Found ${cur} sale price: $${salePrice}, compare-at: $${comparePrice} (fallback)`);
        return { price: salePrice, compareAtPrice: comparePrice, currency: cur, available: true };
      }
      
      console.log(`Found ${cur} price: $${price1} (fallback)`);
      return { price: price1, compareAtPrice: null, currency: cur, available: true };
    }
  }
  
  // Last resort: any price pattern with validation
  const allPrices = [...markdown.matchAll(/\$([0-9,]+(?:\.[0-9]{2})?)/g)]
    .map(m => parseFloat(m[1].replace(',', '')))
    .filter(p => validateFilamentPrice(p))
    .sort((a, b) => a - b);
  
  if (allPrices.length > 0) {
    const price = allPrices[0];
    const compareAtPrice = allPrices.length > 1 && allPrices[1] > price * 1.1 ? allPrices[1] : null;
    console.log(`Found generic price (filtered): $${price}${compareAtPrice ? `, compare-at: $${compareAtPrice}` : ''}`);
    return { price, compareAtPrice, currency: preferredCurrency, available: true };
  }
  
  console.log('No valid price found in content');
  return { price: null, compareAtPrice: null, currency: preferredCurrency, available: false };
}

// Extract weight from page content
function extractWeightFromContent(markdown: string): number | null {
  const kgMatch = markdown.match(/\b(\d+(?:\.\d+)?)\s*kg\b/i);
  if (kgMatch) return Math.round(parseFloat(kgMatch[1]) * 1000);
  
  const gMatch = markdown.match(/\b(\d{3,4})\s*g(?:ram)?s?\b/i);
  if (gMatch) return Math.round(parseFloat(gMatch[1]));
  
  return null;
}

// Extract diameter from page content
function extractDiameterFromContent(markdown: string, url: string): number | null {
  const urlMatch = url.match(/[_-](1[.-]75|2[.-]85)/i);
  if (urlMatch) return parseFloat(urlMatch[1].replace('-', '.'));
  
  const contentMatch = markdown.match(/\b(1\.75|2\.85)\s*mm\b/i);
  if (contentMatch) return parseFloat(contentMatch[1]);
  
  return null;
}

// Fetch price using Firecrawl API
async function fetchPriceWithFirecrawl(
  productUrl: string, 
  preferredCurrency: string,
  brandConfig?: BrandConfig | null
): Promise<PriceResponse & { rawSample?: string }> {
  const startTime = Date.now();
  const firecrawlApiKey = Deno.env.get('FIRECRAWL_API_KEY');
  
  if (!firecrawlApiKey) {
    console.error('FIRECRAWL_API_KEY not configured');
    return {
      success: false,
      price: null,
      compareAtPrice: null,
      weightGrams: null,
      diameterMm: null,
      variantTitle: null,
      currency: preferredCurrency,
      available: false,
      source: 'firecrawl',
      fetchedAt: new Date().toISOString(),
      error: 'Firecrawl not configured',
    };
  }
  
  const location = getFirecrawlLocation(preferredCurrency);
  console.log(`Fetching with Firecrawl: ${productUrl} (location: ${location.country})`);
  
  // For Creality stores, disable onlyMainContent as their pricing section is often excluded
  const isCreality = productUrl.includes('store.creality.com');
  const useMainContentOnly = !isCreality;
  
  try {
    const response = await fetch('https://api.firecrawl.dev/v1/scrape', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${firecrawlApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        url: productUrl,
        formats: ['markdown'],
        onlyMainContent: useMainContentOnly,
        waitFor: isCreality ? 5000 : 3000, // Wait longer for Creality dynamic content
        location: location,
      }),
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Firecrawl API error: ${response.status} - ${errorText}`);
      return {
        success: false,
        price: null,
        compareAtPrice: null,
        weightGrams: null,
        diameterMm: null,
        variantTitle: null,
        currency: preferredCurrency,
        available: false,
        source: 'firecrawl',
        fetchedAt: new Date().toISOString(),
        error: `Firecrawl error: ${response.status}`,
      };
    }
    
    const data = await response.json();
    const markdown = data.data?.markdown || data.markdown || '';
    
    if (!markdown) {
      console.error('No markdown content returned from Firecrawl');
      return {
        success: false,
        price: null,
        compareAtPrice: null,
        weightGrams: null,
        diameterMm: null,
        variantTitle: null,
        currency: preferredCurrency,
        available: false,
        source: 'firecrawl',
        fetchedAt: new Date().toISOString(),
        error: 'No content returned',
      };
    }
    
    console.log(`Firecrawl returned ${markdown.length} chars of content`);
    
    let priceData: { price: number | null; compareAtPrice: number | null; currency: string; available: boolean };
    
    // Use configured extraction if available and working
    if (brandConfig && brandConfig.extraction_working && brandConfig.extraction_method !== 'auto') {
      console.log(`Using configured extraction for ${brandConfig.brand_name}`);
      const configResult = extractPriceWithConfig(
        markdown,
        brandConfig.price_extraction_config || {},
        brandConfig.default_currency || preferredCurrency
      );
      priceData = configResult;
      
      if (configResult.matchedPattern) {
        console.log(`Config extraction matched pattern: ${configResult.matchedPattern}`);
      }
    } else {
      // Legacy extraction logic
      const isOpenCart = productUrl.includes('geeetech.com');
      const isCreality = productUrl.includes('store.creality.com');
      
      if (isCreality) {
        priceData = extractCrealityPrice(markdown);
      } else if (isOpenCart) {
        priceData = extractOpenCartPrice(markdown);
      } else {
        priceData = extractBambuLabPrice(markdown, preferredCurrency);
      }
    }
    
    const weightGrams = extractWeightFromContent(markdown);
    const diameterMm = extractDiameterFromContent(markdown, productUrl);
    const responseTimeMs = Date.now() - startTime;
    
    // Log extraction attempt
    await logExtractionAttempt(
      brandConfig?.id || null,
      brandConfig?.brand_slug || null,
      productUrl,
      brandConfig?.extraction_method || 'legacy',
      priceData.price !== null,
      priceData.price,
      priceData.currency,
      priceData.price === null ? 'Could not extract price' : null,
      markdown.substring(0, 500),
      responseTimeMs
    );
    
    if (priceData.price === null) {
      return {
        success: false,
        price: null,
        compareAtPrice: null,
        weightGrams,
        diameterMm,
        variantTitle: null,
        currency: preferredCurrency,
        available: false,
        source: 'firecrawl',
        fetchedAt: new Date().toISOString(),
        error: 'Could not extract price from page',
        rawSample: markdown.substring(0, 500),
      };
    }
    
    console.log(`Firecrawl price extracted: ${priceData.price} ${priceData.currency} (compare: ${priceData.compareAtPrice})`);
    
    return {
      success: true,
      price: priceData.price,
      compareAtPrice: priceData.compareAtPrice,
      weightGrams,
      diameterMm,
      variantTitle: null,
      currency: priceData.currency,
      available: priceData.available,
      source: 'firecrawl',
      fetchedAt: new Date().toISOString(),
      rawSample: markdown.substring(0, 500),
    };
  } catch (error) {
    console.error('Firecrawl fetch error:', error);
    return {
      success: false,
      price: null,
      compareAtPrice: null,
      weightGrams: null,
      diameterMm: null,
      variantTitle: null,
      currency: preferredCurrency,
      available: false,
      source: 'firecrawl',
      fetchedAt: new Date().toISOString(),
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

// Parse weight from variant title
function parseWeightFromTitle(title: string): number | null {
  if (!title) return null;
  
  const kgMatch = title.match(/(\d+(?:\.\d+)?)\s*kg/i);
  if (kgMatch) return Math.round(parseFloat(kgMatch[1]) * 1000);
  
  const gMatch = title.match(/(\d+(?:\.\d+)?)\s*g(?:ram)?s?(?!\w)/i);
  if (gMatch) return Math.round(parseFloat(gMatch[1]));
  
  const lbMatch = title.match(/(\d+(?:\.\d+)?)\s*lb/i);
  if (lbMatch) return Math.round(parseFloat(lbMatch[1]) * 453.592);
  
  return null;
}

// Parse pack quantity from product content
function parsePackQuantity(title: string, content?: string): number {
  const textToSearch = `${title} ${content || ''}`;
  
  const packMatch = textToSearch.match(/(\d+)\s*(?:pcs?|pack|rolls?|spools?|pieces?|x\s*\d)/i);
  if (packMatch) {
    const qty = parseInt(packMatch[1]);
    if (qty > 1 && qty <= 100) return qty;
  }
  
  return 1;
}

// Parse diameter from URL or title
function parseDiameter(url: string, title: string): number | null {
  const urlDashMatch = url.match(/[_-](1[.-]75|2[.-]85|3[.-]00?)/i);
  if (urlDashMatch) {
    const normalized = urlDashMatch[1].replace('-', '.').replace(',', '.');
    return parseFloat(normalized);
  }
  
  const titleMmMatch = title?.match(/(1\.75|2\.85|3\.00?)\s*mm/i);
  if (titleMmMatch) return parseFloat(titleMmMatch[1]);
  
  const titleDiamMatch = title?.match(/\b(1\.75|2\.85|3\.00?)\b/);
  if (titleDiamMatch) return parseFloat(titleDiamMatch[1]);
  
  return null;
}

// Detect platform from URL
function detectPlatform(url: string): 'shopify' | 'unknown' {
  const shopifyIndicators = ['/products/', '.myshopify.com', 'cdn.shopify.com'];
  
  for (const indicator of shopifyIndicators) {
    if (url.includes(indicator)) return 'shopify';
  }
  
  return 'unknown';
}

// Get Shopify JSON URL from product URL
function getShopifyJsonUrl(url: string): string {
  const cleanUrl = url.split('?')[0].split('#')[0];
  return cleanUrl.endsWith('.json') ? cleanUrl : `${cleanUrl}.json`;
}

// Extract variant ID from URL query parameter
function extractVariantIdFromUrl(url: string): string | null {
  try {
    const urlObj = new URL(url);
    return urlObj.searchParams.get('variant') || null;
  } catch {
    const match = url.match(/[?&]variant=(\d+)/);
    return match ? match[1] : null;
  }
}

// Detect currency from URL domain
function detectCurrencyFromUrl(url: string): string {
  const urlLower = url.toLowerCase();
  
  if (urlLower.includes('.ca') || urlLower.includes('ca.')) return 'CAD';
  if (urlLower.includes('.co.uk') || urlLower.includes('uk.')) return 'GBP';
  if (urlLower.includes('.eu') || urlLower.includes('.de') || urlLower.includes('.fr') || urlLower.includes('.it')) return 'EUR';
  if (urlLower.includes('.au') || urlLower.includes('au.')) return 'AUD';
  if (urlLower.includes('.jp') || urlLower.includes('jp.')) return 'JPY';
  
  return 'USD';
}

// Fetch price from Shopify JSON API
async function fetchShopifyPrice(productUrl: string, preferredCurrency: string): Promise<PriceResponse> {
  const jsonUrl = getShopifyJsonUrl(productUrl);
  console.log(`Fetching Shopify JSON from: ${jsonUrl}`);
  
  try {
    const headers: Record<string, string> = {
      'Accept': 'application/json',
      'User-Agent': 'Mozilla/5.0 (compatible; PriceChecker/1.0)',
    };
    
    if (preferredCurrency === 'CAD') headers['Accept-Language'] = 'en-CA';
    else if (preferredCurrency === 'GBP') headers['Accept-Language'] = 'en-GB';
    else if (preferredCurrency === 'EUR') headers['Accept-Language'] = 'de-DE';
    else if (preferredCurrency === 'AUD') headers['Accept-Language'] = 'en-AU';
    
    const response = await fetch(jsonUrl, { headers });
    
    if (!response.ok) {
      console.error(`Shopify fetch failed: ${response.status} ${response.statusText}`);
      return {
        success: false,
        price: null,
        compareAtPrice: null,
        weightGrams: null,
        diameterMm: null,
        variantTitle: null,
        currency: preferredCurrency,
        available: false,
        source: 'shopify',
        fetchedAt: new Date().toISOString(),
        error: `HTTP ${response.status}`,
      };
    }
    
    const data: ShopifyProduct = await response.json();
    
    if (!data.product?.variants?.length) {
      return {
        success: false,
        price: null,
        compareAtPrice: null,
        weightGrams: null,
        diameterMm: null,
        variantTitle: null,
        currency: preferredCurrency,
        available: false,
        source: 'shopify',
        fetchedAt: new Date().toISOString(),
        error: 'No variants found',
      };
    }
    
    const requestedVariantId = extractVariantIdFromUrl(productUrl);
    let variant: ShopifyVariant;
    
    if (requestedVariantId) {
      const matchedVariant = data.product.variants.find(v => String(v.id) === requestedVariantId);
      if (matchedVariant) {
        variant = matchedVariant;
        console.log(`Found requested variant ${requestedVariantId}: "${variant.title}"`);
      } else {
        console.log(`Requested variant ${requestedVariantId} not found, using first available`);
        const availableVariant = data.product.variants.find(v => v.available);
        variant = availableVariant || data.product.variants[0];
      }
    } else {
      const availableVariant = data.product.variants.find(v => v.available);
      variant = availableVariant || data.product.variants[0];
    }
    
    const price = parseFloat(variant.price);
    const compareAtPrice = variant.compare_at_price ? parseFloat(variant.compare_at_price) : null;
    
    const weightFromVariantTitle = parseWeightFromTitle(variant.title);
    const weightFromProductTitle = parseWeightFromTitle(data.product.title);
    const isReasonableGrams = variant.grams && variant.grams >= 250 && variant.grams <= 3000;
    let singleSpoolWeight = weightFromVariantTitle || weightFromProductTitle || (isReasonableGrams ? variant.grams : null) || null;
    
    const packQuantity = parsePackQuantity(data.product.title, variant.title);
    const weightGrams = singleSpoolWeight !== null ? singleSpoolWeight * packQuantity : null;
    
    console.log(`Weight extraction: variant="${variant.title}", product="${data.product.title}", singleSpool=${singleSpoolWeight}g, packQty=${packQuantity}, total=${weightGrams}g`);
    
    const diameterMm = parseDiameter(productUrl, variant.title) || parseDiameter(productUrl, data.product.title);
    const detectedCurrency = detectCurrencyFromUrl(productUrl);
    
    console.log(`Shopify price fetched: ${price} ${detectedCurrency} (weight: ${weightGrams}g, diameter: ${diameterMm}mm, available: ${variant.available})`);
    
    return {
      success: true,
      price,
      compareAtPrice,
      weightGrams,
      diameterMm,
      variantTitle: variant.title,
      currency: detectedCurrency,
      available: variant.available,
      source: 'shopify',
      fetchedAt: new Date().toISOString(),
    };
  } catch (error) {
    console.error('Shopify fetch error:', error);
    return {
      success: false,
      price: null,
      compareAtPrice: null,
      weightGrams: null,
      diameterMm: null,
      variantTitle: null,
      currency: preferredCurrency,
      available: false,
      source: 'shopify',
      fetchedAt: new Date().toISOString(),
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { productUrl, currency = 'USD' } = await req.json();
    
    if (!productUrl) {
      return new Response(
        JSON.stringify({ error: 'productUrl is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Getting current price for: ${productUrl} (preferred currency: ${currency})`);
    
    // Look up brand config from database
    const brandConfig = await findBrandConfigByUrl(productUrl);
    if (brandConfig) {
      console.log(`Found brand config: ${brandConfig.brand_name} (method: ${brandConfig.extraction_method}, working: ${brandConfig.extraction_working})`);
      
      // If brand extraction is marked as not working, log and continue with fallback
      if (!brandConfig.extraction_working) {
        console.log(`Brand ${brandConfig.brand_name} extraction marked as not working, using fallback`);
      }
    }
    
    // Check for custom storefronts first (they don't support Shopify JSON)
    const customStorefront = detectCustomStorefront(productUrl);
    let result: PriceResponse;
    
    if (customStorefront) {
      console.log(`Detected custom storefront: ${customStorefront}, using Firecrawl`);
      result = await fetchPriceWithFirecrawl(productUrl, currency, brandConfig);
    } else if (shouldAlwaysUseFirecrawl(productUrl)) {
      console.log(`Store has unreliable JSON API, using Firecrawl for accurate pricing`);
      result = await fetchPriceWithFirecrawl(productUrl, currency, brandConfig);
    } else if (brandConfig && brandConfig.extraction_method === 'firecrawl') {
      // Brand config explicitly requests Firecrawl
      console.log(`Brand config requests Firecrawl extraction`);
      result = await fetchPriceWithFirecrawl(productUrl, currency, brandConfig);
    } else {
      // Try Shopify JSON API for standard stores
      const platform = detectPlatform(productUrl);
      
      if (platform === 'shopify') {
        const isMultiCurrency = isMultiCurrencyShopifyStore(productUrl);
        
        if (isMultiCurrency && currency !== 'USD') {
          console.log(`Multi-currency Shopify store detected (${currency} requested), using Firecrawl`);
          result = await fetchPriceWithFirecrawl(productUrl, currency, brandConfig);
        } else {
          result = await fetchShopifyPrice(productUrl, currency);
          
          if (!result.success) {
            console.log('Shopify failed, trying Firecrawl as fallback...');
            result = await fetchPriceWithFirecrawl(productUrl, currency, brandConfig);
          }
        }
      } else {
        console.log('Unknown platform, trying Firecrawl...');
        result = await fetchPriceWithFirecrawl(productUrl, currency, brandConfig);
      }
    }

    return new Response(
      JSON.stringify(result),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in get-current-price:', error);
    return new Response(
      JSON.stringify({ 
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        price: null,
        compareAtPrice: null,
        weightGrams: null,
        diameterMm: null,
        variantTitle: null,
        currency: 'USD',
        available: false,
        source: 'firecrawl',
        fetchedAt: new Date().toISOString(),
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
