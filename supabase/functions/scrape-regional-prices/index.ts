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
      CA: { subdomain: 'ca', currency: 'CAD' },
      UK: { subdomain: 'uk', currency: 'GBP' },
      EU: { subdomain: 'eu', currency: 'EUR' },
      AU: { subdomain: 'au', currency: 'AUD' },
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
  'Sunlu': {
    pattern: 'subdomain',
    baseDomain: 'sunlu.com',
    regions: {
      US: { subdomain: 'store', currency: 'USD' },
      CA: { subdomain: 'ca', currency: 'CAD' },
      UK: { subdomain: 'uk', currency: 'GBP' },
      AU: { subdomain: 'au', currency: 'AUD' },
      EU: { subdomain: 'store', currency: 'EUR' },
    }
  },
  'Eryone': {
    pattern: 'subdomain',
    baseDomain: 'eryone3d.com',
    regions: {
      US: { subdomain: 'www', currency: 'USD' },
      CA: { subdomain: 'ca', currency: 'CAD' },
      UK: { subdomain: 'uk', currency: 'GBP' },
      EU: { subdomain: 'de', currency: 'EUR' },
      AU: { subdomain: 'au', currency: 'AUD' },
    }
  },
  'eSun': {
    pattern: 'subdomain',
    baseDomain: 'esun3dstore.com',
    regions: {
      US: { subdomain: 'www', currency: 'USD' },
      // eSun uses separate domains per region, not subdomains
      // EU: esun3dstoreeu.com, UK: esun3dstore.uk — handled via brand_sync_config
    }
  },
  'Kingroon': {
    pattern: 'subdomain',
    baseDomain: 'kingroon.com',
    regions: {
      US: { subdomain: 'www', currency: 'USD' },
      CA: { subdomain: 'ca', currency: 'CAD' },
      UK: { subdomain: 'uk', currency: 'GBP' },
      EU: { subdomain: 'eu', currency: 'EUR' },
      AU: { subdomain: 'au', currency: 'AUD' },
    }
  },
  'Sovol': {
    pattern: 'subdomain',
    baseDomain: 'sovol3d.com',
    regions: {
      US: { subdomain: 'www', currency: 'USD' },
      EU: { subdomain: 'eu', currency: 'EUR' },
    }
  },
  'Jayo': {
    pattern: 'subdomain',
    baseDomain: 'jayo3d.com',
    regions: {
      US: { subdomain: 'www', currency: 'USD' },
      UK: { subdomain: 'uk', currency: 'GBP' },
      EU: { subdomain: 'eu', currency: 'EUR' },
    }
  },
  'Flashforge': {
    pattern: 'subdomain',
    baseDomain: 'flashforge.com',
    regions: {
      US: { subdomain: 'www', currency: 'USD' },
      EU: { subdomain: 'eu', currency: 'EUR' },
    }
  },
  'QIDI': {
    pattern: 'subdomain',
    baseDomain: 'qidi3d.com',
    regions: {
      US: { subdomain: 'www', currency: 'USD' },
      CA: { subdomain: 'ca', currency: 'CAD' },
      UK: { subdomain: 'uk', currency: 'GBP' },
      EU: { subdomain: 'eu', currency: 'EUR' },
      AU: { subdomain: 'au', currency: 'AUD' },
    }
  },
  'FLSUN': {
    pattern: 'subdomain',
    baseDomain: 'store.flsun3d.com',
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
  'Sunlu': { useFirecrawl: true, waitFor: 2000 },
  'Eryone': { useFirecrawl: true, waitFor: 2000 },
  'Jayo': { useFirecrawl: true, waitFor: 2000 },
  'Kingroon': { useFirecrawl: true, waitFor: 2000 },
  'Sovol': { useFirecrawl: true, waitFor: 2000 },
  'Flashforge': { useFirecrawl: true, waitFor: 2000 },
  'QIDI': { useFirecrawl: true, waitFor: 2000 },
};

// Firecrawl geo-location mapping for regional scraping
const REGION_TO_FIRECRAWL_LOCATION: Record<string, { country: string; languages: string[] }> = {
  'US': { country: 'US', languages: ['en'] },
  'CA': { country: 'CA', languages: ['en'] },
  'UK': { country: 'GB', languages: ['en'] },
  'EU': { country: 'DE', languages: ['en', 'de'] },
  'AU': { country: 'AU', languages: ['en'] },
  'JP': { country: 'JP', languages: ['ja', 'en'] },
};

// Currency markers to verify correct regional content
const CURRENCY_MARKERS: Record<string, { expected: string[]; wrong: string[] }> = {
  'USD': { 
    expected: ['USD', 'US$', '$ USD'],
    wrong: ['CAD', 'C$', 'CA$', 'GBP', '£', 'EUR', '€', 'AUD', 'A$', 'AU$'] 
  },
  'CAD': { 
    expected: ['CAD', 'C$', 'CA$', '$ CAD', 'CDN$'],
    wrong: ['USD', 'US$', 'GBP', '£', 'EUR', '€', 'AUD', 'A$', 'AU$'] 
  },
  'GBP': { 
    expected: ['GBP', '£'],
    wrong: ['USD', 'US$', 'CAD', 'C$', 'EUR', '€', 'AUD', 'A$'] 
  },
  'EUR': { 
    expected: ['EUR', '€'],
    wrong: ['USD', 'US$', 'CAD', 'C$', 'GBP', '£', 'AUD', 'A$'] 
  },
  'AUD': { 
    expected: ['AUD', 'A$', 'AU$', '$ AUD'],
    wrong: ['USD', 'US$', 'CAD', 'C$', 'GBP', '£', 'EUR', '€'] 
  },
  'JPY': { 
    expected: ['JPY', '¥', '円', '￥'],
    wrong: ['USD', 'US$', 'CAD', 'C$', 'GBP', '£', 'EUR', '€', 'AUD', 'A$'] 
  },
};

// Verify currency in page content matches expected regional currency
// This is a targeted check - we look specifically at price-related elements, not the whole page
function verifyCurrencyInContent(html: string, markdown: string, expectedCurrency: string): { valid: boolean; reason: string } {
  const markers = CURRENCY_MARKERS[expectedCurrency];
  
  if (!markers) {
    console.log(`[CURRENCY] No markers defined for ${expectedCurrency}, skipping validation`);
    return { valid: true, reason: 'No markers defined' };
  }
  
  // Strategy 1: Check meta tags for currency (most reliable)
  const metaCurrencyMatch = html.match(/<meta[^>]*property="product:price:currency"[^>]*content="([^"]+)"/i) ||
                           html.match(/<meta[^>]*content="([^"]+)"[^>]*property="product:price:currency"/i);
  
  if (metaCurrencyMatch) {
    const metaCurrency = metaCurrencyMatch[1].toUpperCase();
    console.log(`[CURRENCY] Found meta currency: ${metaCurrency}`);
    
    if (metaCurrency === expectedCurrency) {
      console.log(`[CURRENCY] ✓ Meta currency matches expected ${expectedCurrency}`);
      return { valid: true, reason: 'Meta currency matches' };
    } else {
      // Only reject if it's a clearly wrong currency
      if (markers.wrong.includes(metaCurrency)) {
        console.log(`[CURRENCY] ❌ Meta currency ${metaCurrency} doesn't match expected ${expectedCurrency}`);
        return { valid: false, reason: `Meta currency is ${metaCurrency}, expected ${expectedCurrency}` };
      }
    }
  }
  
  // Strategy 2: Check JSON-LD for currency
  const jsonLdMatch = html.match(/"priceCurrency"\s*:\s*"([^"]+)"/i);
  if (jsonLdMatch) {
    const jsonLdCurrency = jsonLdMatch[1].toUpperCase();
    console.log(`[CURRENCY] Found JSON-LD currency: ${jsonLdCurrency}`);
    
    if (jsonLdCurrency === expectedCurrency) {
      console.log(`[CURRENCY] ✓ JSON-LD currency matches expected ${expectedCurrency}`);
      return { valid: true, reason: 'JSON-LD currency matches' };
    } else {
      console.log(`[CURRENCY] ❌ JSON-LD currency ${jsonLdCurrency} doesn't match expected ${expectedCurrency}`);
      return { valid: false, reason: `JSON-LD currency is ${jsonLdCurrency}, expected ${expectedCurrency}` };
    }
  }
  
  // Strategy 3: Check for explicit currency markers near primary price
  // Look in the first 20KB of content (main product area)
  const mainContent = (html.slice(0, 20000) + ' ' + markdown.slice(0, 5000)).toUpperCase();
  
  // Check for expected currency code in price context
  const expectedPattern = new RegExp(`(\\d{1,3}[.,]\\d{2})\\s*${expectedCurrency}|${expectedCurrency}\\s*(\\d{1,3}[.,]\\d{2})`, 'i');
  if (expectedPattern.test(mainContent)) {
    console.log(`[CURRENCY] ✓ Found price with ${expectedCurrency} marker`);
    return { valid: true, reason: `Found ${expectedCurrency} with price` };
  }
  
  // Check for specific CAD markers (C$, CA$)
  if (expectedCurrency === 'CAD' && (mainContent.includes('C$') || mainContent.includes('CA$') || mainContent.includes('CDN$'))) {
    console.log(`[CURRENCY] ✓ Found CAD-specific marker (C$/CA$/CDN$)`);
    return { valid: true, reason: 'Found CAD-specific marker' };
  }
  
  // Check for specific AUD markers
  if (expectedCurrency === 'AUD' && (mainContent.includes('A$') || mainContent.includes('AU$'))) {
    console.log(`[CURRENCY] ✓ Found AUD-specific marker (A$/AU$)`);
    return { valid: true, reason: 'Found AUD-specific marker' };
  }
  
  // If no definitive marker found, allow it but log warning
  // We don't want to be too aggressive and reject valid prices
  console.log(`[CURRENCY] ⚠️ No definitive currency marker found, allowing scrape to proceed`);
  return { valid: true, reason: 'No definitive marker, allowing' };
}

// Verify URL wasn't redirected to a different region
function verifyNoRedirect(requestedUrl: string, finalUrl: string | undefined): { valid: boolean; reason: string } {
  if (!finalUrl) {
    return { valid: true, reason: 'No final URL reported' };
  }
  
  try {
    const requestedHost = new URL(requestedUrl).hostname.toLowerCase();
    const finalHost = new URL(finalUrl).hostname.toLowerCase();
    
    // Extract subdomain (first part before the domain)
    const requestedParts = requestedHost.split('.');
    const finalParts = finalHost.split('.');
    
    // Check if the subdomain changed (e.g., ca.store.bambulab.com -> us.store.bambulab.com)
    if (requestedParts[0] !== finalParts[0]) {
      console.log(`[REDIRECT] ❌ Subdomain changed: ${requestedParts[0]} → ${finalParts[0]}`);
      return { valid: false, reason: `Redirected from ${requestedHost} to ${finalHost}` };
    }
    
    // Also check if entire hostname changed
    if (requestedHost !== finalHost) {
      console.log(`[REDIRECT] ❌ Host changed: ${requestedHost} → ${finalHost}`);
      return { valid: false, reason: `Redirected from ${requestedHost} to ${finalHost}` };
    }
    
    console.log(`[REDIRECT] ✓ No redirect detected`);
    return { valid: true, reason: 'Same host' };
  } catch (e) {
    console.log(`[REDIRECT] Error parsing URLs: ${e}`);
    return { valid: true, reason: 'Could not parse URLs' };
  }
}

// ============================================================
// BAMBU LAB SPECIFIC CONFIGURATION
// ============================================================

// Expected price ranges by material type for Bambu Lab
const BAMBU_LAB_PRICE_RANGES: Record<string, Record<string, [number, number]>> = {
  'PLA': { USD: [15, 35], CAD: [20, 45], GBP: [14, 30], EUR: [16, 35], AUD: [22, 50], JPY: [2000, 5000] },
  'ABS': { USD: [18, 40], CAD: [22, 50], GBP: [16, 35], EUR: [18, 40], AUD: [25, 55], JPY: [2500, 6000] },
  'PETG': { USD: [18, 40], CAD: [22, 50], GBP: [16, 35], EUR: [18, 40], AUD: [25, 55], JPY: [2500, 6000] },
  'ASA': { USD: [22, 50], CAD: [28, 60], GBP: [20, 45], EUR: [22, 50], AUD: [30, 65], JPY: [3000, 7000] },
  'TPU': { USD: [25, 55], CAD: [32, 70], GBP: [22, 50], EUR: [25, 55], AUD: [35, 75], JPY: [3500, 8000] },
  'PA': { USD: [35, 80], CAD: [45, 100], GBP: [32, 70], EUR: [35, 80], AUD: [50, 110], JPY: [5000, 12000] },
  'PC': { USD: [30, 70], CAD: [40, 90], GBP: [28, 60], EUR: [30, 70], AUD: [45, 95], JPY: [4000, 10000] },
  'PET': { USD: [22, 50], CAD: [28, 65], GBP: [20, 45], EUR: [22, 50], AUD: [30, 70], JPY: [3000, 7000] },
  'PPA': { USD: [40, 90], CAD: [52, 115], GBP: [36, 80], EUR: [40, 90], AUD: [56, 125], JPY: [5500, 13000] },
  // Carbon fiber variants are more expensive
  'CF': { USD: [30, 80], CAD: [40, 100], GBP: [28, 70], EUR: [30, 80], AUD: [45, 110], JPY: [4000, 12000] },
  // Default range for unknown materials
  'DEFAULT': { USD: [15, 80], CAD: [20, 100], GBP: [14, 70], EUR: [16, 80], AUD: [22, 110], JPY: [2000, 12000] },
};

// Keywords that indicate a discount/bulk price (EXCLUDE these prices)
// NOTE: "From $XX.XX" is Bambu Lab's standard format for base price - NOT a discount
const DISCOUNT_EXCLUSION_KEYWORDS = [
  'as low as',
  'low as',
  'per roll',
  'per spool',
  'bulk',
  'discount',
  '% off',
  'save ',
  'savings',
  'x+ items',  // More specific to avoid false positives
  '+ items',
  'qty',
  'quantity',
  'bundle',
  'pack of',
  'multi-pack',
  'subscribe',
  'subscription',
];

// Detect material type from product title
function detectMaterialType(productTitle: string): string {
  const title = productTitle.toUpperCase();
  
  // Check for carbon fiber first (before base material)
  if (title.includes('-CF') || title.includes(' CF ') || title.includes('CARBON')) {
    return 'CF';
  }
  
  // Check specific materials
  const materials = ['PPA', 'PA-CF', 'PA', 'PC', 'ASA', 'ABS', 'PETG', 'PET-CF', 'PET', 'TPU', 'PLA'];
  for (const mat of materials) {
    if (title.includes(mat)) {
      // Handle CF variants
      if (title.includes(`${mat}-CF`)) return 'CF';
      return mat.replace('-CF', '');
    }
  }
  
  return 'DEFAULT';
}

// Check if text contains discount-related keywords
function containsDiscountKeywords(text: string): boolean {
  const lowerText = text.toLowerCase();
  return DISCOUNT_EXCLUSION_KEYWORDS.some(keyword => lowerText.includes(keyword));
}

// ============================================================
// BAMBU LAB SPECIFIC PRICE EXTRACTOR
// ============================================================
function extractBambuLabPrice(
  html: string, 
  markdown: string, 
  expectedCurrency: string,
  productTitle: string
): { price: number; source: string; validated: boolean; reason: string } | null {
  const materialType = detectMaterialType(productTitle);
  const priceRanges = BAMBU_LAB_PRICE_RANGES[materialType] || BAMBU_LAB_PRICE_RANGES['DEFAULT'];
  const [minExpected, maxExpected] = priceRanges[expectedCurrency] || priceRanges['USD'] || [15, 80];
  
  console.log(`[BAMBU LAB] Material: ${materialType}, Expected range: ${minExpected}-${maxExpected} ${expectedCurrency}`);
  
  // Strategy 1: Look for bbl-title-1 class (Bambu Lab's main price element)
  // This is the prominent price displayed near the product title
  const bblTitleMatch = html.match(/class="[^"]*bbl-title-1[^"]*"[^>]*>([^<]*(?:\$|€|£|¥|C\$|CA\$|A\$)[^<]*)<\/[^>]+>/i);
  if (bblTitleMatch) {
    const priceText = bblTitleMatch[1];
    console.log(`[BAMBU LAB] Found bbl-title-1 price text: "${priceText}"`);
    
    // Check for discount keywords in surrounding context (200 chars)
    const matchIndex = html.indexOf(bblTitleMatch[0]);
    const contextStart = Math.max(0, matchIndex - 200);
    const contextEnd = Math.min(html.length, matchIndex + bblTitleMatch[0].length + 200);
    const context = html.substring(contextStart, contextEnd);
    
    if (containsDiscountKeywords(context)) {
      console.log(`[BAMBU LAB] REJECTED bbl-title-1: discount keywords found in context`);
    } else {
      const price = extractNumericPrice(priceText, expectedCurrency);
      if (price && price >= minExpected && price <= maxExpected) {
        console.log(`[BAMBU LAB] ✓ bbl-title-1 price VALID: ${price} ${expectedCurrency}`);
        return { price, source: 'bbl-title-1', validated: true, reason: 'Main price element' };
      } else if (price) {
        console.log(`[BAMBU LAB] REJECTED bbl-title-1 price ${price}: outside range ${minExpected}-${maxExpected}`);
      }
    }
  }

  // Strategy 2: Look for "From $XX.XX" pattern in main product area
  // Bambu Lab shows "From $19.99" format for base price
  const fromPricePatterns = [
    /From\s+(?:\$|€|£|C\$|CA\$|A\$|¥)\s*(\d{1,3}(?:[.,]\d{2})?)/gi,
    /Starting\s+(?:at\s+)?(?:\$|€|£|C\$|CA\$|A\$|¥)\s*(\d{1,3}(?:[.,]\d{2})?)/gi,
  ];
  
  for (const pattern of fromPricePatterns) {
    const matches = [...html.matchAll(pattern)];
    for (const match of matches) {
      const fullMatch = match[0];
      const priceStr = match[1].replace(',', '.');
      const price = parseFloat(priceStr);
      
      // Check surrounding context for discount keywords
      const matchIndex = html.indexOf(fullMatch);
      const contextStart = Math.max(0, matchIndex - 200);
      const contextEnd = Math.min(html.length, matchIndex + fullMatch.length + 200);
      const context = html.substring(contextStart, contextEnd);
      
      if (containsDiscountKeywords(context)) {
        console.log(`[BAMBU LAB] REJECTED "From" price ${price}: discount keywords in context`);
        continue;
      }
      
      if (price >= minExpected && price <= maxExpected) {
        console.log(`[BAMBU LAB] ✓ "From" price VALID: ${price} ${expectedCurrency}`);
        return { price, source: 'from-pattern', validated: true, reason: 'From price pattern' };
      } else {
        console.log(`[BAMBU LAB] REJECTED "From" price ${price}: outside range ${minExpected}-${maxExpected}`);
      }
    }
  }

  // Strategy 3: JSON-LD structured data (most reliable when available)
  const jsonLdPrice = extractFromJsonLd(html);
  if (jsonLdPrice) {
    console.log(`[BAMBU LAB] Found JSON-LD price: ${jsonLdPrice}`);
    if (jsonLdPrice >= minExpected && jsonLdPrice <= maxExpected) {
      console.log(`[BAMBU LAB] ✓ JSON-LD price VALID: ${jsonLdPrice} ${expectedCurrency}`);
      return { price: jsonLdPrice, source: 'json-ld', validated: true, reason: 'Structured data' };
    } else {
      console.log(`[BAMBU LAB] REJECTED JSON-LD price ${jsonLdPrice}: outside range ${minExpected}-${maxExpected}`);
    }
  }

  // Strategy 4: Meta tags (product:price:amount)
  const metaPrice = extractFromMetaTags(html);
  if (metaPrice) {
    console.log(`[BAMBU LAB] Found meta tag price: ${metaPrice}`);
    if (metaPrice >= minExpected && metaPrice <= maxExpected) {
      console.log(`[BAMBU LAB] ✓ Meta tag price VALID: ${metaPrice} ${expectedCurrency}`);
      return { price: metaPrice, source: 'meta-tag', validated: true, reason: 'Meta tag price' };
    } else {
      console.log(`[BAMBU LAB] REJECTED meta price ${metaPrice}: outside range ${minExpected}-${maxExpected}`);
    }
  }

  // Strategy 5: Look for price near product title (NOT in discount areas)
  // Find prices that are in the main product info section
  const mainPricePatterns = [
    // Price with currency symbol, excluding discount contexts
    /class="[^"]*(?:product-price|current-price|price-item|main-price|regular-price)[^"]*"[^>]*>\s*(?:\$|€|£|C\$|CA\$|A\$|¥)\s*(\d{1,3}(?:[.,]\d{2})?)/gi,
    /data-(?:price|product-price|current-price)="(\d+(?:\.\d{2})?)"/gi,
  ];

  for (const pattern of mainPricePatterns) {
    const matches = [...html.matchAll(pattern)];
    for (const match of matches) {
      const fullMatch = match[0];
      const priceStr = match[1].replace(',', '.');
      let price = parseFloat(priceStr);
      
      // Handle cents (Shopify sometimes stores in cents)
      if (price > 1000 && expectedCurrency !== 'JPY') {
        price = price / 100;
      }
      
      // Check surrounding context
      const matchIndex = html.indexOf(fullMatch);
      const contextStart = Math.max(0, matchIndex - 200);
      const contextEnd = Math.min(html.length, matchIndex + fullMatch.length + 200);
      const context = html.substring(contextStart, contextEnd);
      
      if (containsDiscountKeywords(context)) {
        console.log(`[BAMBU LAB] REJECTED pattern price ${price}: discount keywords in context`);
        continue;
      }
      
      if (price >= minExpected && price <= maxExpected) {
        console.log(`[BAMBU LAB] ✓ Pattern price VALID: ${price} ${expectedCurrency}`);
        return { price, source: 'css-pattern', validated: true, reason: 'CSS class pattern' };
      } else {
        console.log(`[BAMBU LAB] REJECTED pattern price ${price}: outside range ${minExpected}-${maxExpected}`);
      }
    }
  }

  // Strategy 6: Markdown content - look for price NOT near discount text
  const markdownLines = markdown.split('\n');
  const validPrices: { price: number; lineIndex: number }[] = [];
  
  for (let i = 0; i < markdownLines.length; i++) {
    const line = markdownLines[i];
    
    // Skip lines with discount keywords
    if (containsDiscountKeywords(line)) {
      continue;
    }
    
    // Check surrounding lines too (2 before, 2 after)
    const surroundingContext = markdownLines.slice(Math.max(0, i - 2), Math.min(markdownLines.length, i + 3)).join(' ');
    if (containsDiscountKeywords(surroundingContext)) {
      continue;
    }
    
    // Extract price from line
    const priceMatch = line.match(/(?:\$|€|£|C\$|CA\$|A\$|¥)\s*(\d{1,3}(?:[.,]\d{2})?)/);
    if (priceMatch) {
      const priceStr = priceMatch[1].replace(',', '.');
      const price = parseFloat(priceStr);
      
      if (price >= minExpected && price <= maxExpected) {
        validPrices.push({ price, lineIndex: i });
      }
    }
  }
  
  if (validPrices.length > 0) {
    // Prefer prices that appear earlier (more likely to be main price)
    const bestPrice = validPrices[0];
    console.log(`[BAMBU LAB] ✓ Markdown price VALID: ${bestPrice.price} ${expectedCurrency} (line ${bestPrice.lineIndex})`);
    return { price: bestPrice.price, source: 'markdown', validated: true, reason: 'Markdown content' };
  }

  console.log(`[BAMBU LAB] No valid price found for ${productTitle}`);
  return null;
}

// ============================================================
// ELEGOO SPECIFIC PRICE EXTRACTOR
// ============================================================
const ELEGOO_PRICE_RANGES: Record<string, [number, number]> = {
  'USD': [12, 50],
  'CAD': [15, 70],
  'GBP': [10, 45],
  'EUR': [12, 55],
  'AUD': [18, 80],
};

function extractElegooPrice(
  html: string, 
  markdown: string, 
  expectedCurrency: string,
  productTitle: string
): { price: number; source: string; validated: boolean; reason: string } | null {
  const [minExpected, maxExpected] = ELEGOO_PRICE_RANGES[expectedCurrency] || [10, 60];
  console.log(`[ELEGOO] Expected price range: ${minExpected}-${maxExpected} ${expectedCurrency}`);
  
  // Strategy 1: JSON-LD structured data
  const jsonLdPrice = extractFromJsonLd(html);
  if (jsonLdPrice && jsonLdPrice >= minExpected && jsonLdPrice <= maxExpected) {
    console.log(`[ELEGOO] ✓ JSON-LD price VALID: ${jsonLdPrice} ${expectedCurrency}`);
    return { price: jsonLdPrice, source: 'json-ld', validated: true, reason: 'Structured data' };
  }

  // Strategy 2: Meta tags
  const metaPrice = extractFromMetaTags(html);
  if (metaPrice && metaPrice >= minExpected && metaPrice <= maxExpected) {
    console.log(`[ELEGOO] ✓ Meta tag price VALID: ${metaPrice} ${expectedCurrency}`);
    return { price: metaPrice, source: 'meta-tag', validated: true, reason: 'Meta tag price' };
  }

  // Strategy 3: Shopify variant price
  const shopifyPrice = extractShopifyPrice(html);
  if (shopifyPrice && shopifyPrice >= minExpected && shopifyPrice <= maxExpected) {
    console.log(`[ELEGOO] ✓ Shopify price VALID: ${shopifyPrice} ${expectedCurrency}`);
    return { price: shopifyPrice, source: 'shopify-data', validated: true, reason: 'Shopify variant' };
  }

  console.log(`[ELEGOO] No valid price found for ${productTitle}`);
  return null;
}

// ============================================================
// POLYMAKER SPECIFIC PRICE EXTRACTOR
// ============================================================
const POLYMAKER_PRICE_RANGES: Record<string, [number, number]> = {
  'USD': [18, 80],
  'EUR': [18, 85],
};

function extractPolymakerPrice(
  html: string, 
  markdown: string, 
  expectedCurrency: string,
  productTitle: string
): { price: number; source: string; validated: boolean; reason: string } | null {
  const [minExpected, maxExpected] = POLYMAKER_PRICE_RANGES[expectedCurrency] || [15, 90];
  console.log(`[POLYMAKER] Expected price range: ${minExpected}-${maxExpected} ${expectedCurrency}`);
  
  // Polymaker uses standard Shopify patterns
  const jsonLdPrice = extractFromJsonLd(html);
  if (jsonLdPrice && jsonLdPrice >= minExpected && jsonLdPrice <= maxExpected) {
    console.log(`[POLYMAKER] ✓ JSON-LD price VALID: ${jsonLdPrice} ${expectedCurrency}`);
    return { price: jsonLdPrice, source: 'json-ld', validated: true, reason: 'Structured data' };
  }

  const metaPrice = extractFromMetaTags(html);
  if (metaPrice && metaPrice >= minExpected && metaPrice <= maxExpected) {
    console.log(`[POLYMAKER] ✓ Meta tag price VALID: ${metaPrice} ${expectedCurrency}`);
    return { price: metaPrice, source: 'meta-tag', validated: true, reason: 'Meta tag price' };
  }

  const shopifyPrice = extractShopifyPrice(html);
  if (shopifyPrice && shopifyPrice >= minExpected && shopifyPrice <= maxExpected) {
    console.log(`[POLYMAKER] ✓ Shopify price VALID: ${shopifyPrice} ${expectedCurrency}`);
    return { price: shopifyPrice, source: 'shopify-data', validated: true, reason: 'Shopify variant' };
  }

  console.log(`[POLYMAKER] No valid price found for ${productTitle}`);
  return null;
}

// ============================================================
// SUNLU SPECIFIC PRICE EXTRACTOR
// ============================================================
const SUNLU_PRICE_RANGES: Record<string, [number, number]> = {
  'USD': [12, 50],
  'EUR': [12, 55],
};

function extractSunluPrice(
  html: string, 
  markdown: string, 
  expectedCurrency: string,
  productTitle: string
): { price: number; source: string; validated: boolean; reason: string } | null {
  const [minExpected, maxExpected] = SUNLU_PRICE_RANGES[expectedCurrency] || [10, 60];
  console.log(`[SUNLU] Expected price range: ${minExpected}-${maxExpected} ${expectedCurrency}`);
  
  const jsonLdPrice = extractFromJsonLd(html);
  if (jsonLdPrice && jsonLdPrice >= minExpected && jsonLdPrice <= maxExpected) {
    console.log(`[SUNLU] ✓ JSON-LD price VALID: ${jsonLdPrice} ${expectedCurrency}`);
    return { price: jsonLdPrice, source: 'json-ld', validated: true, reason: 'Structured data' };
  }

  const metaPrice = extractFromMetaTags(html);
  if (metaPrice && metaPrice >= minExpected && metaPrice <= maxExpected) {
    console.log(`[SUNLU] ✓ Meta tag price VALID: ${metaPrice} ${expectedCurrency}`);
    return { price: metaPrice, source: 'meta-tag', validated: true, reason: 'Meta tag price' };
  }

  const shopifyPrice = extractShopifyPrice(html);
  if (shopifyPrice && shopifyPrice >= minExpected && shopifyPrice <= maxExpected) {
    console.log(`[SUNLU] ✓ Shopify price VALID: ${shopifyPrice} ${expectedCurrency}`);
    return { price: shopifyPrice, source: 'shopify-data', validated: true, reason: 'Shopify variant' };
  }

  console.log(`[SUNLU] No valid price found for ${productTitle}`);
  return null;
}

// Extract numeric price from text containing currency symbol
function extractNumericPrice(text: string, expectedCurrency: string): number | null {
  // Remove currency symbols and extract number
  const cleanedText = text.replace(/[^\d.,]/g, '');
  
  // Handle different decimal formats
  let priceStr = cleanedText;
  
  // If contains both comma and period, determine which is decimal
  if (cleanedText.includes(',') && cleanedText.includes('.')) {
    // European format: 1.234,56 -> 1234.56
    if (cleanedText.lastIndexOf(',') > cleanedText.lastIndexOf('.')) {
      priceStr = cleanedText.replace(/\./g, '').replace(',', '.');
    } else {
      // US format: 1,234.56 -> 1234.56
      priceStr = cleanedText.replace(/,/g, '');
    }
  } else if (cleanedText.includes(',')) {
    // Could be decimal comma or thousands separator
    const parts = cleanedText.split(',');
    if (parts.length === 2 && parts[1].length === 2) {
      // Likely decimal comma: 19,99 -> 19.99
      priceStr = cleanedText.replace(',', '.');
    } else {
      // Thousands separator: 1,234 -> 1234
      priceStr = cleanedText.replace(/,/g, '');
    }
  }
  
  const price = parseFloat(priceStr);
  return isNaN(price) ? null : price;
}

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

// Scrape with Firecrawl for JS-rendered pages with geo-location support
async function scrapeWithFirecrawl(
  url: string, 
  expectedCurrency: string, 
  waitFor: number = 2000,
  vendor: string,
  productTitle: string,
  currentStoredPrice: number | null,
  region: string // NEW: region for geo-location
): Promise<{ price: number; currency: string; available: boolean; source: string; validated: boolean } | null> {
  const firecrawlKey = Deno.env.get('FIRECRAWL_API_KEY');
  
  if (!firecrawlKey) {
    console.log('FIRECRAWL_API_KEY not configured');
    return null;
  }

  // Get geo-location for this region
  const location = REGION_TO_FIRECRAWL_LOCATION[region];
  
  try {
    console.log(`\n[FIRECRAWL] Scraping: ${url}`);
    console.log(`[FIRECRAWL] Region: ${region}, Expected currency: ${expectedCurrency}, Wait: ${waitFor}ms`);
    console.log(`[FIRECRAWL] Geo-location: ${location ? `${location.country} (${location.languages.join(', ')})` : 'none'}`);
    console.log(`[FIRECRAWL] Vendor: ${vendor}, Product: ${productTitle}`);
    if (currentStoredPrice) {
      console.log(`[FIRECRAWL] Current stored price: ${currentStoredPrice}`);
    }
    
    const requestBody: any = {
      url,
      formats: ['markdown', 'html'],
      onlyMainContent: false,
      waitFor,
    };
    
    // Add geo-location if available
    if (location) {
      requestBody.location = location;
      console.log(`[FIRECRAWL] Using location: ${JSON.stringify(location)}`);
    }
    
    const response = await fetch('https://api.firecrawl.dev/v1/scrape', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${firecrawlKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`[FIRECRAWL] Error ${response.status}:`, errorText);
      return null;
    }

    const data = await response.json();
    
    if (!data.success) {
      console.log('[FIRECRAWL] Scrape failed:', data.error);
      return null;
    }

    const html = data.data?.html || '';
    const markdown = data.data?.markdown || '';
    const sourceUrl = data.data?.metadata?.sourceURL;
    
    console.log(`[FIRECRAWL] Response - HTML: ${html.length} chars, Markdown: ${markdown.length} chars`);
    console.log(`[FIRECRAWL] Source URL: ${sourceUrl || 'not reported'}`);

    // VALIDATION 1: Check for redirects
    const redirectCheck = verifyNoRedirect(url, sourceUrl);
    if (!redirectCheck.valid) {
      console.log(`[FIRECRAWL] ❌ REJECTED: ${redirectCheck.reason}`);
      console.log(`[FIRECRAWL] Page was redirected to different region - cannot trust price`);
      return null;
    }

    // VALIDATION 2: Verify currency in content
    const currencyCheck = verifyCurrencyInContent(html, markdown, expectedCurrency);
    if (!currencyCheck.valid) {
      console.log(`[FIRECRAWL] ❌ REJECTED: ${currencyCheck.reason}`);
      console.log(`[FIRECRAWL] Page content shows wrong currency - cannot trust price`);
      return null;
    }
    
    console.log(`[FIRECRAWL] Response - HTML: ${html.length} chars, Markdown: ${markdown.length} chars`);

    // Use brand-specific extraction for Bambu Lab
    if (vendor === 'Bambu Lab') {
      const result = extractBambuLabPrice(html, markdown, expectedCurrency, productTitle);
      
      if (result) {
        // Additional validation: check for suspicious price drop
        if (currentStoredPrice && result.price < currentStoredPrice * 0.6) {
          console.log(`[FIRECRAWL] ⚠️ SUSPICIOUS: Price ${result.price} is >40% below stored ${currentStoredPrice}`);
          console.log(`[FIRECRAWL] Flagging for review - NOT auto-updating`);
          return {
            price: result.price,
            currency: expectedCurrency,
            available: true,
            source: result.source,
            validated: false, // Mark as needing review
          };
        }
        
        // Check availability
        const available = !html.toLowerCase().includes('out of stock') && 
                         !html.toLowerCase().includes('sold out') &&
                         !markdown.toLowerCase().includes('out of stock');
        
        console.log(`[FIRECRAWL] ✓ SUCCESS: ${result.price} ${expectedCurrency} (${result.source})`);
        return { 
          price: result.price, 
          currency: expectedCurrency, 
          available,
          source: result.source,
          validated: result.validated,
        };
      }
      
      console.log('[FIRECRAWL] No valid Bambu Lab price found');
      return null;
    }

    // Use brand-specific extraction for Elegoo
    if (vendor === 'Elegoo') {
      const result = extractElegooPrice(html, markdown, expectedCurrency, productTitle);
      if (result) {
        const available = !html.toLowerCase().includes('out of stock') && 
                         !html.toLowerCase().includes('sold out');
        console.log(`[FIRECRAWL] ✓ SUCCESS: ${result.price} ${expectedCurrency} (${result.source})`);
        return { price: result.price, currency: expectedCurrency, available, source: result.source, validated: true };
      }
      console.log('[FIRECRAWL] No valid Elegoo price found');
      return null;
    }

    // Use brand-specific extraction for Polymaker
    if (vendor === 'Polymaker') {
      const result = extractPolymakerPrice(html, markdown, expectedCurrency, productTitle);
      if (result) {
        const available = !html.toLowerCase().includes('out of stock') && 
                         !html.toLowerCase().includes('sold out');
        console.log(`[FIRECRAWL] ✓ SUCCESS: ${result.price} ${expectedCurrency} (${result.source})`);
        return { price: result.price, currency: expectedCurrency, available, source: result.source, validated: true };
      }
      console.log('[FIRECRAWL] No valid Polymaker price found');
      return null;
    }

    // Use brand-specific extraction for Sunlu
    if (vendor === 'Sunlu') {
      const result = extractSunluPrice(html, markdown, expectedCurrency, productTitle);
      if (result) {
        const available = !html.toLowerCase().includes('out of stock') && 
                         !html.toLowerCase().includes('sold out');
        console.log(`[FIRECRAWL] ✓ SUCCESS: ${result.price} ${expectedCurrency} (${result.source})`);
        return { price: result.price, currency: expectedCurrency, available, source: result.source, validated: true };
      }
      console.log('[FIRECRAWL] No valid Sunlu price found');
      return null;
    }

    // For other brands, use generic extraction
    const price = extractPriceFromContent(html, markdown, expectedCurrency);
    
    if (price) {
      console.log(`[FIRECRAWL] Generic price found: ${price} ${expectedCurrency}`);
      
      const available = !html.toLowerCase().includes('out of stock') && 
                       !html.toLowerCase().includes('sold out') &&
                       !markdown.toLowerCase().includes('out of stock');
      
      return { price, currency: expectedCurrency, available, source: 'generic', validated: true };
    }

    console.log('[FIRECRAWL] No price found in content');
    return null;
  } catch (e) {
    console.error('[FIRECRAWL] Error:', e);
    return null;
  }
}

// Generic price extraction (for non-Bambu Lab brands)
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
      minExpected: 8
    },
    'CAD': { 
      patterns: [
        /data-product-price[^>]*>\s*(?:C\$|CA\$|\$)\s*(\d{1,3}(?:,\d{3})*\.?\d{0,2})/gi,
        /class="[^"]*current[^"]*price[^"]*"[^>]*>\s*(?:C\$|CA\$|\$)\s*(\d{1,3}(?:,\d{3})*\.?\d{0,2})/gi,
        /class="[^"]*product[^"]*price[^"]*"[^>]*>\s*(?:C\$|CA\$|\$)\s*(\d{1,3}(?:,\d{3})*\.?\d{0,2})/gi,
      ],
      minExpected: 10
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
      if (price >= config.minExpected && isValidPrice(price, expectedCurrency)) {
        candidates.push(price);
      }
    }
  }

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

  return null;
}

function extractFromJsonLd(html: string): number | null {
  const jsonLdMatch = html.match(/<script type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/gi);
  if (!jsonLdMatch) return null;

  for (const match of jsonLdMatch) {
    try {
      const jsonContent = match.replace(/<script[^>]*>|<\/script>/gi, '');
      const jsonData = JSON.parse(jsonContent);
      
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
  const patterns = [
    /data-product-price="(\d+)"/i,
    /"price":\s*(\d+)/i,
    /data-price="(\d+\.?\d*)"/i,
    /"current_price":\s*(\d+)/i,
  ];

  for (const pattern of patterns) {
    const match = html.match(pattern);
    if (match) {
      let price = parseFloat(match[1]);
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
async function tryShopifyJson(url: string, expectedCurrency: string): Promise<{ price: number; currency: string; available: boolean; source: string; validated: boolean } | null> {
  try {
    const cleanUrl = url.replace(/\?.*$/, '');
    const jsonUrl = cleanUrl + '.json';
    
    console.log(`[SHOPIFY JSON] Trying: ${jsonUrl}`);
    
    const response = await fetch(jsonUrl, {
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      },
    });
    
    if (!response.ok) {
      console.log(`[SHOPIFY JSON] Returned ${response.status}`);
      return null;
    }
    
    const data = await response.json();
    const product = data.product;
    
    if (!product || !product.variants || product.variants.length === 0) {
      console.log('[SHOPIFY JSON] No product variants');
      return null;
    }
    
    const variant = product.variants.find((v: any) => v.available) || product.variants[0];
    const price = parseFloat(variant.price);
    
    if (isNaN(price) || price <= 0) {
      console.log('[SHOPIFY JSON] Invalid price:', variant.price);
      return null;
    }
    
    console.log(`[SHOPIFY JSON] ✓ Success: ${price} ${expectedCurrency}`);
    
    return {
      price,
      currency: expectedCurrency,
      available: variant.available || false,
      source: 'shopify-json',
      validated: true,
    };
  } catch (e) {
    console.error('[SHOPIFY JSON] Error:', e);
    return null;
  }
}

// Scrape price from HTML page as fallback
async function scrapeFromHtml(url: string, expectedCurrency: string): Promise<{ price: number; currency: string; available: boolean; source: string; validated: boolean } | null> {
  try {
    console.log(`[HTML] Scraping: ${url}`);
    
    const response = await fetch(url, {
      headers: {
        'Accept': 'text/html',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      },
      redirect: 'follow',
    });
    
    if (!response.ok) {
      console.log(`[HTML] Returned ${response.status}`);
      return null;
    }
    
    const html = await response.text();
    
    const finalUrl = response.url;
    if (!finalUrl.includes(new URL(url).hostname.split('.')[0])) {
      console.log(`[HTML] Redirected to different region: ${finalUrl}`);
      return null;
    }
    
    const price = extractPriceFromContent(html, '', expectedCurrency);
    
    if (price) {
      const available = !html.toLowerCase().includes('out of stock') && 
                       !html.toLowerCase().includes('sold out');
      console.log(`[HTML] ✓ Success: ${price} ${expectedCurrency}`);
      return { price, currency: expectedCurrency, available, source: 'html', validated: true };
    }
    
    console.log('[HTML] No price found');
    return null;
  } catch (e) {
    console.error('[HTML] Error:', e);
    return null;
  }
}

// Main scraping function for a single filament
async function scrapeRegionalPricesForFilament(
  filament: { 
    id: string; 
    product_url: string; 
    vendor: string; 
    product_title: string;
    variant_price: number | null;
    price_cad: number | null;
    price_gbp: number | null;
    price_eur: number | null;
    price_aud: number | null;
    price_jpy: number | null;
  },
  regions: string[]
): Promise<{
  prices: Record<string, { price: number; currency: string; source: string; validated: boolean }>;
  urls: Record<string, string>;
  errors: string[];
  skipped: Record<string, string>;
}> {
  const prices: Record<string, { price: number; currency: string; source: string; validated: boolean }> = {};
  const urls: Record<string, string> = {};
  const errors: string[] = [];
  const skipped: Record<string, string> = {};
  
  const regionConfig = BRAND_REGIONAL_STORES[filament.vendor];
  if (!regionConfig) {
    errors.push(`No regional config for vendor: ${filament.vendor}`);
    return { prices, urls, errors, skipped };
  }

  const scrapeConfig = BRAND_SCRAPE_CONFIG[filament.vendor] || { useFirecrawl: false, waitFor: 0 };
  
  // Map of current stored prices by region
  const currentPrices: Record<string, number | null> = {
    US: filament.variant_price,
    CA: filament.price_cad,
    UK: filament.price_gbp,
    EU: filament.price_eur,
    AU: filament.price_aud,
    JP: filament.price_jpy,
  };
  
  for (const region of regions) {
    try {
      const regionData = regionConfig.regions[region];
      if (!regionData) {
        console.log(`[REGION] ${region} not supported for ${filament.vendor}`);
        continue;
      }
      
      const regionalUrl = transformToRegionalUrl(filament.product_url, filament.vendor, region);
      
      if (!regionalUrl) {
        console.log(`[REGION] No URL for ${filament.vendor} ${region}`);
        continue;
      }
      
      console.log(`\n${'='.repeat(60)}`);
      console.log(`[REGION] ${region}: ${regionalUrl}`);
      console.log(`[REGION] Product: ${filament.product_title}`);
      console.log(`[REGION] Current stored price: ${currentPrices[region] || 'none'}`);
      
      urls[region] = regionalUrl;
      
      const urlsToTry = getAlternateUrls(regionalUrl);
      let result: { price: number; currency: string; available: boolean; source: string; validated: boolean } | null = null;
      
      for (const urlToTry of urlsToTry) {
        console.log(`[TRYING] ${urlToTry}`);
        
        // Try Firecrawl first for JS-rendered brands
        if (scrapeConfig.useFirecrawl && !result) {
          result = await scrapeWithFirecrawl(
            urlToTry, 
            regionData.currency, 
            scrapeConfig.waitFor,
            filament.vendor,
            filament.product_title,
            currentPrices[region],
            region // NEW: pass region for geo-location
          );
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
          urls[region] = urlToTry;
          break;
        }
      }
      
      if (result) {
        // Check if price is validated or needs review
        if (!result.validated) {
          skipped[region] = `Suspicious price ${result.price} flagged for review (current: ${currentPrices[region]})`;
          console.log(`[RESULT] ⚠️ ${region}: SKIPPED - ${skipped[region]}`);
        } else {
          prices[region] = {
            price: result.price,
            currency: result.currency,
            source: result.source,
            validated: result.validated,
          };
          console.log(`[RESULT] ✓ ${region}: ${result.price} ${result.currency} (${result.source})`);
        }
      } else {
        errors.push(`${region}: Could not extract price`);
        console.log(`[RESULT] ✗ ${region}: No price found`);
      }
      
      // Rate limit
      await new Promise(resolve => setTimeout(resolve, 500));
      
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Unknown error';
      errors.push(`${region}: ${msg}`);
      console.error(`[ERROR] ${region}:`, e);
    }
  }
  
  return { prices, urls, errors, skipped };
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

    console.log('\n' + '='.repeat(80));
    console.log('SCRAPE-REGIONAL-PRICES - START');
    console.log('='.repeat(80));
    console.log('Request:', JSON.stringify({ filamentId, filamentIds, brand, regions, limit, forceUpdate }, null, 2));

    // Build query - include current prices for validation
    let query = supabase
      .from('filaments')
      .select('id, product_url, vendor, product_title, variant_price, price_cad, price_gbp, price_eur, price_aud, price_jpy');

    if (filamentId) {
      query = query.eq('id', filamentId);
    } else if (filamentIds && filamentIds.length > 0) {
      query = query.in('id', filamentIds);
    } else if (brand) {
      query = query.ilike('vendor', brand);
    }

    const regionalBrands = Object.keys(BRAND_REGIONAL_STORES);
    query = query.in('vendor', regionalBrands);
    query = query.not('product_url', 'is', null);

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

    console.log(`\nProcessing ${filaments.length} filaments`);

    const results: {
      id: string;
      title: string;
      vendor: string;
      prices: Record<string, { price: number; source: string }>;
      urls: Record<string, string>;
      errors: string[];
      skipped: Record<string, string>;
    }[] = [];

    for (const filament of filaments) {
      if (!filament.product_url || !filament.vendor) continue;

      console.log(`\n${'#'.repeat(80)}`);
      console.log(`# FILAMENT: ${filament.product_title}`);
      console.log(`# Vendor: ${filament.vendor}`);
      console.log(`# URL: ${filament.product_url}`);
      console.log(`${'#'.repeat(80)}`);

      const { prices, urls, errors, skipped } = await scrapeRegionalPricesForFilament(
        {
          id: filament.id,
          product_url: filament.product_url,
          vendor: filament.vendor,
          product_title: filament.product_title || 'Unknown',
          variant_price: filament.variant_price,
          price_cad: filament.price_cad,
          price_gbp: filament.price_gbp,
          price_eur: filament.price_eur,
          price_aud: filament.price_aud,
          price_jpy: filament.price_jpy,
        },
        regions
      );

      // Prepare update data - only update validated prices
      const updateData: Record<string, any> = {
        regional_prices_updated_at: new Date().toISOString(),
        url_validated_at: new Date().toISOString(),
        url_validation_status: Object.keys(prices).length > 0 ? 'valid' : 'invalid',
      };

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

      // Only store validated prices
      for (const [region, data] of Object.entries(prices)) {
        if (data.validated) {
          const priceCol = priceColumnMap[region];
          if (priceCol) {
            updateData[priceCol] = data.price;
          }
          if (region === 'US') {
            updateData.variant_price = data.price;
          }
        }
      }

      // Store regional URLs
      for (const [region, url] of Object.entries(urls)) {
        const urlCol = urlColumnMap[region];
        if (urlCol) {
          updateData[urlCol] = url;
        }
      }

      console.log('\n[DB UPDATE]', JSON.stringify(updateData, null, 2));

      const { error: updateError } = await supabase
        .from('filaments')
        .update(updateData)
        .eq('id', filament.id);

      if (updateError) {
        console.error('[DB ERROR]', updateError);
        errors.push(`Database update failed: ${updateError.message}`);
      } else {
        console.log('[DB] ✓ Updated successfully');
      }

      results.push({
        id: filament.id,
        title: filament.product_title || 'Unknown',
        vendor: filament.vendor,
        prices: Object.fromEntries(
          Object.entries(prices).map(([k, v]) => [k, { price: v.price, source: v.source }])
        ),
        urls,
        errors,
        skipped,
      });

      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    const successCount = results.filter(r => Object.keys(r.prices).length > 0).length;
    const errorCount = results.filter(r => r.errors.length > 0).length;
    const skippedCount = results.filter(r => Object.keys(r.skipped).length > 0).length;

    console.log('\n' + '='.repeat(80));
    console.log('SCRAPE-REGIONAL-PRICES - COMPLETE');
    console.log(`Processed: ${results.length}, Success: ${successCount}, Errors: ${errorCount}, Skipped: ${skippedCount}`);
    console.log('='.repeat(80));

    return new Response(
      JSON.stringify({
        success: true,
        message: `Processed ${results.length} filaments. ${successCount} with prices, ${errorCount} with errors, ${skippedCount} with skipped prices.`,
        processed: results.length,
        successCount,
        errorCount,
        skippedCount,
        results,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (e) {
    console.error('[FATAL ERROR]', e);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: e instanceof Error ? e.message : 'Unknown error' 
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
