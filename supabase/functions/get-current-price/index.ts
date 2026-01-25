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
function detectCustomStorefront(url: string): 'bambulab' | 'prusa' | 'opencart' | 'creality' | null {
  if (url.includes('store.bambulab.com')) return 'bambulab';
  if (url.includes('prusa3d.com')) return 'prusa';
  if (url.includes('geeetech.com')) return 'opencart'; // OpenCart-based PHP store
  if (url.includes('store.creality.com')) return 'creality';
  return null;
}

// Validate that a price is within reasonable range for filament products
// This filters out promotional banners, coupon values, and other non-product prices
function validateFilamentPrice(price: number): boolean {
  // Reasonable filament price range: $3 - $150 per spool (allowing for multi-packs)
  return price >= 3 && price <= 150;
}

// Extract price specifically from Creality store pages
// Creality pages often have promotional banners with large dollar amounts (e.g., "$500 coupon pack")
// that can be mistakenly captured by generic regex
function extractCrealityPrice(markdown: string): {
  price: number | null;
  compareAtPrice: number | null;
  currency: string;
  available: boolean;
} {
  console.log('Extracting Creality price...');
  
  // Look for price section near "Add to Cart" or product-specific areas
  const addToCartIndex = markdown.search(/Add\s*to\s*Cart/i);
  const buyNowIndex = markdown.search(/Buy\s*Now/i);
  const priceIndex = Math.max(addToCartIndex, buyNowIndex);
  
  // Search in a window around the Add to Cart button
  let priceSection = '';
  if (priceIndex > -1) {
    // Look backwards from Add to Cart (prices typically appear before it)
    priceSection = markdown.slice(Math.max(0, priceIndex - 500), priceIndex + 100);
  }
  
  // Also look for explicit sale price indicators
  const saleMatch = markdown.match(/(?:Sale\s*price|Now|Special)\s*[:.]?\s*\$(\d+(?:\.\d{2})?)/i);
  
  // Pattern 1: Look for strikethrough/compare-at pattern (current price, then higher original)
  // e.g., "$18.99" followed by "$34.25" 
  const dualPriceMatch = priceSection.match(/\$(\d+(?:\.\d{2})?)\s*(?:[\s\n~-]*)\$(\d+(?:\.\d{2})?)/);
  if (dualPriceMatch) {
    const price1 = parseFloat(dualPriceMatch[1]);
    const price2 = parseFloat(dualPriceMatch[2]);
    const salePrice = Math.min(price1, price2);
    const comparePrice = Math.max(price1, price2);
    
    // Validate both prices are in reasonable range
    if (validateFilamentPrice(salePrice) && (comparePrice <= 200)) {
      console.log(`Found Creality sale price: $${salePrice}, compare-at: $${comparePrice}`);
      return {
        price: salePrice,
        compareAtPrice: comparePrice,
        currency: 'USD',
        available: true,
      };
    }
  }
  
  // Pattern 2: Find all prices in section, filter to valid range, pick lowest
  const allPricesInSection = priceSection.match(/\$(\d+(?:\.\d{2})?)/g);
  if (allPricesInSection) {
    const validPrices = allPricesInSection
      .map(p => parseFloat(p.replace('$', '')))
      .filter(p => validateFilamentPrice(p))
      .sort((a, b) => a - b);
    
    if (validPrices.length > 0) {
      const price = validPrices[0];
      // If there are multiple valid prices, larger might be compare-at
      const compareAt = validPrices.length > 1 && validPrices[1] > price * 1.1 
        ? validPrices[1] 
        : null;
      console.log(`Found Creality price: $${price}${compareAt ? `, compare-at: $${compareAt}` : ''}`);
      return {
        price,
        compareAtPrice: compareAt,
        currency: 'USD',
        available: true,
      };
    }
  }
  
  // Pattern 3: Explicit sale match
  if (saleMatch) {
    const price = parseFloat(saleMatch[1]);
    if (validateFilamentPrice(price)) {
      console.log(`Found Creality explicit sale price: $${price}`);
      return {
        price,
        compareAtPrice: null,
        currency: 'USD',
        available: true,
      };
    }
  }
  
  // Fallback: Search entire content but with strict validation
  const allPrices = [...markdown.matchAll(/\$(\d+(?:\.\d{2})?)/g)]
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
  return {
    price: null,
    compareAtPrice: null,
    currency: 'USD',
    available: false,
  };
}

// Detect Shopify stores known to use multi-currency (geo-based pricing)
// These stores show different prices based on visitor location, but Shopify JSON API
// always returns prices in the store's base currency (usually USD)
function isMultiCurrencyShopifyStore(url: string): boolean {
  const multiCurrencyDomains = [
    'polymaker.com',
    'esun3d.com',
    'sunlu.com',
    'overture3d.com',
    // Note: geeetech.com is NOT Shopify - it's OpenCart
    // Add other known multi-currency Shopify stores here
  ];
  const urlLower = url.toLowerCase();
  return multiCurrencyDomains.some(domain => urlLower.includes(domain));
}

// Detect stores where Shopify JSON API returns unreliable/incorrect prices
// even for USD. These stores require Firecrawl for accurate pricing.
function shouldAlwaysUseFirecrawl(url: string): boolean {
  const unreliableJsonStores = [
    'amolen.com', // JSON API returns outdated prices that don't match website
  ];
  const urlLower = url.toLowerCase();
  return unreliableJsonStores.some(domain => urlLower.includes(domain));
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

// Extract price specifically from GEEETECH OpenCart pages
// GEEETECH page structure shows prices like:
// $9.79 (sale price)
// $15.00 (original price - crossed out)
// -35% (discount badge)
// The key is to find the price AFTER the product title/SKU, not coupon banners
function extractOpenCartPrice(markdown: string): {
  price: number | null;
  compareAtPrice: number | null;
  currency: string;
  available: boolean;
} {
  console.log('Extracting OpenCart/GEEETECH price...');
  
  // Find the SKU line which appears just before the price
  // Format: "SKU: 700-001-042651 Reviews" or similar
  const skuIndex = markdown.search(/SKU:\s*[\d\-]+/i);
  
  // If we found SKU, look for prices after it (within 500 chars)
  let priceSection = skuIndex > -1 
    ? markdown.slice(skuIndex, skuIndex + 500)
    : '';
  
  // Alternative: look for "Add to Cart" button area
  if (!priceSection) {
    const cartIndex = markdown.search(/Add\s*to\s*Cart/i);
    if (cartIndex > -1) {
      // Look backwards for prices (they appear before Add to Cart)
      priceSection = markdown.slice(Math.max(0, cartIndex - 300), cartIndex);
    }
  }
  
  // Fallback: look in the middle section of the page (after header, before footer)
  if (!priceSection) {
    const lines = markdown.split('\n');
    const startLine = Math.floor(lines.length * 0.15); // Skip first 15% (header/banner)
    const endLine = Math.floor(lines.length * 0.5); // Take up to 50%
    priceSection = lines.slice(startLine, endLine).join('\n');
  }
  
  console.log(`Price section (${priceSection.length} chars): ${priceSection.slice(0, 200)}...`);
  
  // Pattern 1: Look for sale price followed by strikethrough original price
  // e.g., "$9.79\n$15.00" or "$9.79 $15.00"
  const salePriceMatch = priceSection.match(/\$(\d+(?:\.\d{2})?)\s*(?:\n|\s)*\$(\d+(?:\.\d{2})?)/);
  if (salePriceMatch) {
    const price1 = parseFloat(salePriceMatch[1]);
    const price2 = parseFloat(salePriceMatch[2]);
    // Smaller is sale price, larger is compare-at
    const salePrice = Math.min(price1, price2);
    const comparePrice = Math.max(price1, price2);
    
    // Validate: prices should be in reasonable range for filament ($5-$50)
    if (salePrice >= 5 && salePrice <= 50 && comparePrice <= 60) {
      console.log(`Found OpenCart sale price: $${salePrice}, compare-at: $${comparePrice}`);
      return {
        price: salePrice,
        compareAtPrice: comparePrice,
        currency: 'USD',
        available: true,
      };
    }
  }
  
  // Pattern 2: Single price (no sale)
  // Find all prices in the section, filter out coupon values
  const allPrices = priceSection.match(/\$(\d+(?:\.\d{2})?)/g);
  if (allPrices) {
    // Filter to reasonable filament prices ($5-$50)
    const validPrices = allPrices
      .map(p => parseFloat(p.replace('$', '')))
      .filter(p => p >= 5 && p <= 50);
    
    if (validPrices.length > 0) {
      // Take the first valid price (most likely to be the product price)
      const price = validPrices[0];
      console.log(`Found OpenCart single price: $${price}`);
      return {
        price,
        compareAtPrice: null,
        currency: 'USD',
        available: true,
      };
    }
  }
  
  console.log('No valid OpenCart price found');
  return {
    price: null,
    compareAtPrice: null,
    currency: 'USD',
    available: false,
  };
}

// Extract price from page content using various patterns
// Handles formats like:
// - "$28.79 CAD$31.99 CAD" (sale + original, Bambu style)
// - "$22.49 USD" (single price)
// - "Sale price$19.99 USDRegular price$28.98 USD" (Shopify multi-currency)
// - "$28.00 CAD" (simple format)
function extractBambuLabPrice(markdown: string, preferredCurrency: string): {
  price: number | null;
  compareAtPrice: number | null;
  currency: string;
  available: boolean;
} {
  console.log(`Extracting price from content, preferred currency: ${preferredCurrency}`);
  
  const currencyPatterns = ['CAD', 'USD', 'GBP', 'EUR', 'AUD', 'JPY'];
  
  // Pattern 1: Shopify multi-currency format "Sale price$XX.XX CURRegular price$YY.YY CUR"
  const shopifySaleRegex = new RegExp(
    `Sale\\s*price\\s*\\$([\\d,]+(?:\\.\\d{2})?)\\s*${preferredCurrency}[^\\d]*Regular\\s*price\\s*\\$([\\d,]+(?:\\.\\d{2})?)\\s*${preferredCurrency}`,
    'i'
  );
  const shopifySaleMatch = markdown.match(shopifySaleRegex);
  if (shopifySaleMatch) {
    const salePrice = parseFloat(shopifySaleMatch[1].replace(',', ''));
    const regularPrice = parseFloat(shopifySaleMatch[2].replace(',', ''));
    console.log(`Found Shopify sale format: $${salePrice} ${preferredCurrency}, regular: $${regularPrice}`);
    return {
      price: salePrice,
      compareAtPrice: regularPrice,
      currency: preferredCurrency,
      available: true,
    };
  }
  
  // Pattern 2: Bambu Lab style "$XX.XX CUR$YY.YY CUR" (two prices back to back)
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
  // Filter to reasonable filament prices to avoid capturing promotional banners
  const allPrices = [...markdown.matchAll(/\$([0-9,]+(?:\.[0-9]{2})?)/g)]
    .map(m => parseFloat(m[1].replace(',', '')))
    .filter(p => validateFilamentPrice(p))
    .sort((a, b) => a - b); // Sort ascending to get lowest reasonable price
  
  if (allPrices.length > 0) {
    const price = allPrices[0];
    const compareAtPrice = allPrices.length > 1 && allPrices[1] > price * 1.1 ? allPrices[1] : null;
    console.log(`Found generic price (filtered): $${price}${compareAtPrice ? `, compare-at: $${compareAtPrice}` : ''} (from ${allPrices.length} valid prices)`);
    return {
      price,
      compareAtPrice,
      currency: preferredCurrency, // Assume preferred currency
      available: true,
    };
  }
  
  console.log('No valid price found in content');
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
    // Detect if this is a specialized storefront and use appropriate extraction
    const isOpenCart = productUrl.includes('geeetech.com');
    const isCreality = productUrl.includes('store.creality.com');
    
    let priceData;
    if (isCreality) {
      priceData = extractCrealityPrice(markdown);
    } else if (isOpenCart) {
      priceData = extractOpenCartPrice(markdown);
    } else {
      priceData = extractBambuLabPrice(markdown, preferredCurrency);
    }
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

// Parse pack quantity from product content (e.g., "12pcs", "12 Pack", "12 Rolls", "12 Spools")
function parsePackQuantity(title: string, content?: string): number {
  const textToSearch = `${title} ${content || ''}`;
  
  // Match patterns like "12pcs", "12 pcs", "12-pack", "12 pack", "12 rolls", "12 spools"
  const packMatch = textToSearch.match(/(\d+)\s*(?:pcs?|pack|rolls?|spools?|pieces?|x\s*\d)/i);
  if (packMatch) {
    const qty = parseInt(packMatch[1]);
    // Only consider it a pack if quantity > 1 and reasonable (max 100)
    if (qty > 1 && qty <= 100) {
      return qty;
    }
  }
  
  return 1;
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

// Extract variant ID from URL query parameter
function extractVariantIdFromUrl(url: string): string | null {
  try {
    const urlObj = new URL(url);
    const variantId = urlObj.searchParams.get('variant');
    return variantId || null;
  } catch {
    // Fallback: try regex
    const match = url.match(/[?&]variant=(\d+)/);
    return match ? match[1] : null;
  }
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
    
    // Find the specific variant requested in the URL, or fall back to first available
    const requestedVariantId = extractVariantIdFromUrl(productUrl);
    let variant: ShopifyVariant;
    
    if (requestedVariantId) {
      // Look for exact variant ID match
      const matchedVariant = data.product.variants.find(v => String(v.id) === requestedVariantId);
      if (matchedVariant) {
        variant = matchedVariant;
        console.log(`Found requested variant ${requestedVariantId}: "${variant.title}"`);
      } else {
        // Variant ID not found - fall back to first available
        console.log(`Requested variant ${requestedVariantId} not found, using first available`);
        const availableVariant = data.product.variants.find(v => v.available);
        variant = availableVariant || data.product.variants[0];
      }
    } else {
      // No variant ID in URL - use first available
      const availableVariant = data.product.variants.find(v => v.available);
      variant = availableVariant || data.product.variants[0];
    }
    
    const price = parseFloat(variant.price);
    const compareAtPrice = variant.compare_at_price ? parseFloat(variant.compare_at_price) : null;
    
    // Extract weight: try variant title first, then product title, then grams field
    // Product title often has weight like "PLA Matte Basic 1.75mm, 1KG/2.2LB"
    // Note: variant.grams is often shipping weight (including packaging), not net weight
    const weightFromVariantTitle = parseWeightFromTitle(variant.title);
    const weightFromProductTitle = parseWeightFromTitle(data.product.title);
    // Only use variant.grams if it's a reasonable filament weight (250g-3000g) and no title weight found
    const isReasonableGrams = variant.grams && variant.grams >= 250 && variant.grams <= 3000;
    let singleSpoolWeight = weightFromVariantTitle || weightFromProductTitle || (isReasonableGrams ? variant.grams : null) || null;
    
    // Detect pack quantity and adjust weight accordingly
    const packQuantity = parsePackQuantity(data.product.title, variant.title);
    const weightGrams = singleSpoolWeight !== null ? singleSpoolWeight * packQuantity : null;
    
    console.log(`Weight extraction: variant="${variant.title}", product="${data.product.title}", singleSpool=${singleSpoolWeight}g, packQty=${packQuantity}, total=${weightGrams}g`);
    
    // Extract diameter from URL or title (check both product and variant title)
    const diameterMm = parseDiameter(productUrl, variant.title) || parseDiameter(productUrl, data.product.title);
    
    // Detect currency from URL since Shopify JSON doesn't include it
    const detectedCurrency = detectCurrencyFromUrl(productUrl);
    
    console.log(`Shopify price fetched: ${price} ${detectedCurrency} (weight: ${weightGrams}g, packQty: ${packQuantity}, diameter: ${diameterMm}mm, available: ${variant.available})`);
    
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
    } else if (shouldAlwaysUseFirecrawl(productUrl)) {
      // Some stores have unreliable Shopify JSON API (prices don't match website)
      console.log(`Store has unreliable JSON API, using Firecrawl for accurate pricing`);
      result = await fetchPriceWithFirecrawl(productUrl, currency);
    } else {
      // Try Shopify JSON API for standard stores
      const platform = detectPlatform(productUrl);
      
      if (platform === 'shopify') {
        // Check if this is a multi-currency Shopify store and user wants non-USD
        // These stores show geo-based prices on the frontend, but Shopify JSON API
        // always returns the base currency (USD), so we need Firecrawl to get the
        // actual localized price
        const isMultiCurrency = isMultiCurrencyShopifyStore(productUrl);
        
        if (isMultiCurrency && currency !== 'USD') {
          console.log(`Multi-currency Shopify store detected (${currency} requested), using Firecrawl for geo-localized price`);
          result = await fetchPriceWithFirecrawl(productUrl, currency);
        } else {
          // Standard Shopify store or USD requested - use JSON API
          result = await fetchShopifyPrice(productUrl, currency);
          
          // If Shopify fails, try Firecrawl as fallback
          if (!result.success) {
            console.log('Shopify failed, trying Firecrawl as fallback...');
            result = await fetchPriceWithFirecrawl(productUrl, currency);
          }
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
