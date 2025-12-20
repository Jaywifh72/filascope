import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

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

// Detect custom storefronts that don't support Shopify JSON API
function detectCustomStorefront(url: string): 'bambulab' | 'prusa' | null {
  if (url.includes('store.bambulab.com')) return 'bambulab';
  if (url.includes('prusa3d.com')) return 'prusa';
  return null;
}

// Map currency to Firecrawl location settings for proper regional pricing
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

// Extract price from Bambu Lab page content
// Handles formats like "$28.79 CAD$31.99 CAD" (sale + original)
// or "$22.49 USD" (single price)
function extractBambuLabPrice(markdown: string, preferredCurrency: string): {
  price: number | null;
  compareAtPrice: number | null;
  currency: string;
  available: boolean;
} {
  console.log(`Extracting Bambu Lab price, preferred currency: ${preferredCurrency}`);
  
  // Pattern to match Bambu Lab price format: "$XX.XX CUR" possibly followed by "$YY.YY CUR"
  // Examples: "$28.79 CAD$31.99 CAD", "$22.49 USD$24.99 USD", "$28.79 CAD"
  const currencyPatterns = ['CAD', 'USD', 'GBP', 'EUR', 'AUD', 'JPY'];
  
  // First, try to find prices with the preferred currency
  const preferredPriceRegex = new RegExp(
    `\\$([\\d,]+(?:\\.\\d{2})?)\\s*${preferredCurrency}(?:\\$([\\d,]+(?:\\.\\d{2})?)\\s*${preferredCurrency})?`,
    'i'
  );
  
  const preferredMatch = markdown.match(preferredPriceRegex);
  if (preferredMatch) {
    const price1 = parseFloat(preferredMatch[1].replace(',', ''));
    const price2 = preferredMatch[2] ? parseFloat(preferredMatch[2].replace(',', '')) : null;
    
    // If two prices found, smaller one is sale price, larger is compare-at
    if (price2 !== null) {
      const salePrice = Math.min(price1, price2);
      const comparePrice = Math.max(price1, price2);
      console.log(`Found ${preferredCurrency} sale price: $${salePrice}, compare-at: $${comparePrice}`);
      return {
        price: salePrice,
        compareAtPrice: comparePrice,
        currency: preferredCurrency,
        available: true,
      };
    }
    
    console.log(`Found ${preferredCurrency} price: $${price1}`);
    return {
      price: price1,
      compareAtPrice: null,
      currency: preferredCurrency,
      available: true,
    };
  }
  
  // If preferred currency not found, try to find any price
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
        return {
          price: salePrice,
          compareAtPrice: comparePrice,
          currency: cur,
          available: true,
        };
      }
      
      console.log(`Found ${cur} price: $${price1} (fallback)`);
      return {
        price: price1,
        compareAtPrice: null,
        currency: cur,
        available: true,
      };
    }
  }
  
  // Last resort: try to find any price pattern like "$XX.XX"
  const genericMatch = markdown.match(/\$([0-9,]+(?:\.[0-9]{2})?)/);
  if (genericMatch) {
    const price = parseFloat(genericMatch[1].replace(',', ''));
    console.log(`Found generic price: $${price}`);
    return {
      price,
      compareAtPrice: null,
      currency: preferredCurrency, // Assume preferred currency
      available: true,
    };
  }
  
  console.log('No price found in content');
  return {
    price: null,
    compareAtPrice: null,
    currency: preferredCurrency,
    available: false,
  };
}

// Extract weight from page content
function extractWeightFromContent(markdown: string): number | null {
  // Look for weight patterns like "1KG", "1 KG", "1000g", "1kg"
  const kgMatch = markdown.match(/\b(\d+(?:\.\d+)?)\s*kg\b/i);
  if (kgMatch) return Math.round(parseFloat(kgMatch[1]) * 1000);
  
  const gMatch = markdown.match(/\b(\d{3,4})\s*g(?:ram)?s?\b/i);
  if (gMatch) return Math.round(parseFloat(gMatch[1]));
  
  return null;
}

// Extract diameter from page content
function extractDiameterFromContent(markdown: string, url: string): number | null {
  // Check URL first
  const urlMatch = url.match(/[_-](1[.-]75|2[.-]85)/i);
  if (urlMatch) {
    return parseFloat(urlMatch[1].replace('-', '.'));
  }
  
  // Check content
  const contentMatch = markdown.match(/\b(1\.75|2\.85)\s*mm\b/i);
  if (contentMatch) return parseFloat(contentMatch[1]);
  
  return null;
}

// Fetch price using Firecrawl API for custom storefronts
async function fetchPriceWithFirecrawl(productUrl: string, preferredCurrency: string): Promise<PriceResponse> {
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
  console.log(`Fetching with Firecrawl: ${productUrl} (location: ${location.country}, lang: ${location.languages.join(', ')})`);
  
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
        onlyMainContent: true,
        waitFor: 3000, // Wait for JavaScript to load currency
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
    
    // Extract price based on storefront type
    const priceData = extractBambuLabPrice(markdown, preferredCurrency);
    const weightGrams = extractWeightFromContent(markdown);
    const diameterMm = extractDiameterFromContent(markdown, productUrl);
    
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

// Parse weight from variant title (e.g., "1.75mm - 1KG AMS Compatible")
function parseWeightFromTitle(title: string): number | null {
  if (!title) return null;
  
  // Match patterns like "1KG", "1 KG", "1.5kg", "500g", "2.2lb"
  const kgMatch = title.match(/(\d+(?:\.\d+)?)\s*kg/i);
  if (kgMatch) return Math.round(parseFloat(kgMatch[1]) * 1000);
  
  const gMatch = title.match(/(\d+(?:\.\d+)?)\s*g(?:ram)?s?(?!\w)/i);
  if (gMatch) return Math.round(parseFloat(gMatch[1]));
  
  const lbMatch = title.match(/(\d+(?:\.\d+)?)\s*lb/i);
  if (lbMatch) return Math.round(parseFloat(lbMatch[1]) * 453.592);
  
  return null;
}

// Parse diameter from URL or title (e.g., "1.75mm", "2.85", "1-75", "2-85")
function parseDiameter(url: string, title: string): number | null {
  // Check URL first - often has patterns like "2-85" or "1-75"
  const urlDashMatch = url.match(/[_-](1[.-]75|2[.-]85|3[.-]00?)/i);
  if (urlDashMatch) {
    const normalized = urlDashMatch[1].replace('-', '.').replace(',', '.');
    return parseFloat(normalized);
  }
  
  // Check title for explicit mm patterns
  const titleMmMatch = title?.match(/(1\.75|2\.85|3\.00?)\s*mm/i);
  if (titleMmMatch) return parseFloat(titleMmMatch[1]);
  
  // Check for diameter in title without mm suffix
  const titleDiamMatch = title?.match(/\b(1\.75|2\.85|3\.00?)\b/);
  if (titleDiamMatch) return parseFloat(titleDiamMatch[1]);
  
  return null;
}

// Detect platform from URL
function detectPlatform(url: string): 'shopify' | 'unknown' {
  // Most filament stores use Shopify
  const shopifyIndicators = [
    '/products/',
    '.myshopify.com',
    'cdn.shopify.com',
  ];
  
  for (const indicator of shopifyIndicators) {
    if (url.includes(indicator)) {
      return 'shopify';
    }
  }
  
  return 'unknown';
}

// Get Shopify JSON URL from product URL
function getShopifyJsonUrl(url: string): string {
  // Remove query params and add .json
  const cleanUrl = url.split('?')[0].split('#')[0];
  return cleanUrl.endsWith('.json') ? cleanUrl : `${cleanUrl}.json`;
}

// Detect currency from URL domain
function detectCurrencyFromUrl(url: string): string {
  const urlLower = url.toLowerCase();
  
  // Canadian stores
  if (urlLower.includes('.ca') || urlLower.includes('ca.')) {
    return 'CAD';
  }
  // UK stores
  if (urlLower.includes('.co.uk') || urlLower.includes('uk.')) {
    return 'GBP';
  }
  // EU stores
  if (urlLower.includes('.eu') || urlLower.includes('.de') || urlLower.includes('.fr') || urlLower.includes('.it')) {
    return 'EUR';
  }
  // Australian stores
  if (urlLower.includes('.au') || urlLower.includes('au.')) {
    return 'AUD';
  }
  // Japanese stores
  if (urlLower.includes('.jp') || urlLower.includes('jp.')) {
    return 'JPY';
  }
  
  // Default to USD
  return 'USD';
}

// Fetch price from Shopify JSON API
async function fetchShopifyPrice(productUrl: string, preferredCurrency: string): Promise<PriceResponse> {
  const jsonUrl = getShopifyJsonUrl(productUrl);
  console.log(`Fetching Shopify JSON from: ${jsonUrl}`);
  
  try {
    // Try to get price in preferred currency by setting headers
    const headers: Record<string, string> = {
      'Accept': 'application/json',
      'User-Agent': 'Mozilla/5.0 (compatible; PriceChecker/1.0)',
    };
    
    // Some Shopify stores use geo headers
    if (preferredCurrency === 'CAD') {
      headers['Accept-Language'] = 'en-CA';
    } else if (preferredCurrency === 'GBP') {
      headers['Accept-Language'] = 'en-GB';
    } else if (preferredCurrency === 'EUR') {
      headers['Accept-Language'] = 'de-DE';
    } else if (preferredCurrency === 'AUD') {
      headers['Accept-Language'] = 'en-AU';
    }
    
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
    
    // Find best variant (first available, or first if none available)
    const availableVariant = data.product.variants.find(v => v.available);
    const variant = availableVariant || data.product.variants[0];
    
    const price = parseFloat(variant.price);
    const compareAtPrice = variant.compare_at_price ? parseFloat(variant.compare_at_price) : null;
    
    // Extract weight from title first (more reliable), fall back to grams field
    const weightGrams = parseWeightFromTitle(variant.title) || variant.grams || null;
    
    // Extract diameter from URL or title
    const diameterMm = parseDiameter(productUrl, variant.title);
    
    // Detect currency from URL since Shopify JSON doesn't include it
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
  // Handle CORS preflight
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
    
    // Check for custom storefronts first (they don't support Shopify JSON)
    const customStorefront = detectCustomStorefront(productUrl);
    let result: PriceResponse;
    
    if (customStorefront) {
      console.log(`Detected custom storefront: ${customStorefront}, using Firecrawl`);
      result = await fetchPriceWithFirecrawl(productUrl, currency);
    } else {
      // Try Shopify JSON API for standard stores
      const platform = detectPlatform(productUrl);
      
      if (platform === 'shopify') {
        result = await fetchShopifyPrice(productUrl, currency);
        
        // If Shopify fails, try Firecrawl as fallback
        if (!result.success) {
          console.log('Shopify failed, trying Firecrawl as fallback...');
          result = await fetchPriceWithFirecrawl(productUrl, currency);
        }
      } else {
        // For unknown platforms, try Firecrawl
        console.log('Unknown platform, trying Firecrawl...');
        result = await fetchPriceWithFirecrawl(productUrl, currency);
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
