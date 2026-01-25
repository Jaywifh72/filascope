import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ExtractionConfig {
  priceSectionAnchor?: string;
  pricePatterns?: string[];
  excludePatterns?: string[];
  priceRangeMin?: number;
  priceRangeMax?: number;
  currencyDetection?: string;
}

interface TestResult {
  success: boolean;
  price: number | null;
  compareAtPrice: number | null;
  currency: string;
  method: string;
  matchedPattern: string | null;
  rawSample: string;
  responseTimeMs: number;
  error?: string;
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

// CRITICAL: Remove "Save $X.XX" and promotional patterns from text BEFORE extracting prices
// This prevents capturing savings amounts, coupon values, etc. as product prices
function removeSavingsAmounts(text: string): string {
  let cleaned = text;
  
  // Remove "Save $X.XX" patterns
  cleaned = cleaned.replace(/Save\s*\$[\d,.]+/gi, ' ');
  // Remove "Saving $X.XX" patterns
  cleaned = cleaned.replace(/Saving\s*\$[\d,.]+/gi, ' ');
  // Remove "$X off" patterns  
  cleaned = cleaned.replace(/\$[\d,.]+\s*off\b/gi, ' ');
  // Remove "$X discount" patterns
  cleaned = cleaned.replace(/\$[\d,.]+\s*discount/gi, ' ');
  // Remove "$X coupon" patterns
  cleaned = cleaned.replace(/\$[\d,.]+\s*coupon/gi, ' ');
  // CRITICAL: Remove "💵 $500 coupon pack" style promotions
  cleaned = cleaned.replace(/💵?\s*\$[\d,.]+\s*coupon\s*pack/gi, ' ');
  // Remove "obtain a $X coupon" patterns
  cleaned = cleaned.replace(/obtain\s+a?\s*\$[\d,.]+/gi, ' ');
  // Remove any "$X" followed by "coupon" within 5 words
  cleaned = cleaned.replace(/\$[\d,.]+[^$]{0,30}coupon/gi, ' ');
  // Remove student discount sections
  cleaned = cleaned.replace(/student\s*discount[^$]*\$[\d,.]+/gi, ' ');
  
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
  config: ExtractionConfig,
  preferredCurrency: string
): {
  price: number | null;
  compareAtPrice: number | null;
  currency: string;
  available: boolean;
  matchedPattern: string | null;
} {
  const priceRangeMin = config.priceRangeMin ?? 10;
  const priceRangeMax = config.priceRangeMax ?? 150;
  
  // First, try to extract using the Creality sale format pattern
  const saleResult = extractSalePriceBeforeSave(markdown);
  if (saleResult.salePrice && saleResult.salePrice >= priceRangeMin && saleResult.salePrice <= priceRangeMax) {
    console.log(`Sale format extraction: $${saleResult.salePrice}, compare: $${saleResult.compareAtPrice}`);
    return {
      price: saleResult.salePrice,
      compareAtPrice: saleResult.compareAtPrice,
      currency: preferredCurrency,
      available: true,
      matchedPattern: 'sale-before-save',
    };
  }
  
  // Remove savings amounts from the text
  let cleanedMarkdown = removeSavingsAmounts(markdown);
  
  // Combine default excludes with configured excludes
  const excludePatterns = [
    ...DEFAULT_EXCLUDE_PATTERNS,
    ...(config.excludePatterns || [])
  ];
  
  // Pre-filter: Remove lines containing discount patterns
  for (const pattern of excludePatterns) {
    try {
      const lineExcludeRegex = new RegExp(`^.*${pattern}.*$`, 'gim');
      const before = cleanedMarkdown.length;
      cleanedMarkdown = cleanedMarkdown.replace(lineExcludeRegex, '');
      if (cleanedMarkdown.length < before) {
        console.log(`Excluded pattern '${pattern}' removed ${before - cleanedMarkdown.length} chars`);
      }
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
      console.log(`Found anchor at ${anchorIndex}, using section of ${priceSection.length} chars`);
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
            console.log(`Pattern '${pattern}' matched: $${price}`);
            
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
          } else {
            console.log(`Pattern '${pattern}' matched $${price} but outside range [${priceRangeMin}-${priceRangeMax}]`);
          }
        }
      } catch (e) {
        console.log(`Invalid price pattern: ${pattern} - ${e}`);
      }
    }
  }
  
  // Fallback: find all prices in section, filter to valid range
  const allPrices = [...priceSection.matchAll(/\$(\d+(?:\.\d{2})?)/g)]
    .map(m => parseFloat(m[1]))
    .filter(p => p >= priceRangeMin && p <= priceRangeMax)
    .sort((a, b) => a - b);
  
  console.log(`Fallback found ${allPrices.length} valid prices in range: ${allPrices.slice(0, 5).join(', ')}`);
  
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

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const startTime = Date.now();

  try {
    const { productUrl, brandId, config, currency = 'USD' } = await req.json();
    
    if (!productUrl) {
      return new Response(
        JSON.stringify({ error: 'productUrl is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Testing price extraction for: ${productUrl}`);
    
    // If brandId provided, fetch config from database
    let extractionConfig: ExtractionConfig = config || {};
    
    if (brandId && !config) {
      const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
      const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
      const supabase = createClient(supabaseUrl, supabaseKey);
      
      const { data: brand } = await supabase
        .from('automated_brands')
        .select('price_extraction_config, default_currency')
        .eq('id', brandId)
        .single();
      
      if (brand?.price_extraction_config) {
        extractionConfig = brand.price_extraction_config as ExtractionConfig;
        console.log(`Loaded config from brand: ${JSON.stringify(extractionConfig)}`);
      }
    }
    
    // Fetch page content with Firecrawl
    const firecrawlApiKey = Deno.env.get('FIRECRAWL_API_KEY');
    
    if (!firecrawlApiKey) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Firecrawl not configured',
          responseTimeMs: Date.now() - startTime,
        } as TestResult),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    const location = getFirecrawlLocation(currency);
    console.log(`Fetching with Firecrawl (location: ${location.country})`);
    
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
        waitFor: 3000,
        location: location,
      }),
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Firecrawl API error: ${response.status} - ${errorText}`);
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: `Firecrawl error: ${response.status}`,
          rawSample: errorText.substring(0, 500),
          responseTimeMs: Date.now() - startTime,
        } as TestResult),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    const data = await response.json();
    const markdown = data.data?.markdown || data.markdown || '';
    
    if (!markdown) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'No content returned from page',
          rawSample: '',
          responseTimeMs: Date.now() - startTime,
        } as TestResult),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    console.log(`Received ${markdown.length} chars of content`);
    
    // Apply extraction config
    const result = extractPriceWithConfig(markdown, extractionConfig, currency);
    const responseTimeMs = Date.now() - startTime;
    
    const testResult: TestResult = {
      success: result.price !== null,
      price: result.price,
      compareAtPrice: result.compareAtPrice,
      currency: result.currency,
      method: Object.keys(extractionConfig).length > 0 ? 'configured' : 'fallback',
      matchedPattern: result.matchedPattern,
      rawSample: markdown.substring(0, 1000),
      responseTimeMs,
    };
    
    if (!result.price) {
      testResult.error = 'Could not extract price from page content';
    }
    
    console.log(`Test result: ${testResult.success ? 'SUCCESS' : 'FAILED'} - $${testResult.price} (${testResult.matchedPattern})`);

    return new Response(
      JSON.stringify(testResult),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in test-price-extraction:', error);
    return new Response(
      JSON.stringify({ 
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        responseTimeMs: Date.now() - startTime,
      } as TestResult),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
