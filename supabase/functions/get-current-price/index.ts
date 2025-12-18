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
  currency: string;
  available: boolean;
  source: 'shopify' | 'html' | 'cached';
  fetchedAt: string;
  error?: string;
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
    
    // Detect currency from URL since Shopify JSON doesn't include it
    const detectedCurrency = detectCurrencyFromUrl(productUrl);
    
    console.log(`Shopify price fetched: ${price} ${detectedCurrency} (available: ${variant.available})`);
    
    return {
      success: true,
      price,
      compareAtPrice,
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
    
    const platform = detectPlatform(productUrl);
    let result: PriceResponse;
    
    if (platform === 'shopify') {
      result = await fetchShopifyPrice(productUrl, currency);
    } else {
      // For unknown platforms, return not supported
      result = {
        success: false,
        price: null,
        compareAtPrice: null,
        currency,
        available: false,
        source: 'shopify',
        fetchedAt: new Date().toISOString(),
        error: 'Platform not supported for live pricing',
      };
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
        currency: 'USD',
        available: false,
        source: 'shopify',
        fetchedAt: new Date().toISOString(),
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
