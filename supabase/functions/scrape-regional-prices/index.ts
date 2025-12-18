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
      // Replace subdomain
      const newSubdomain = regionConfig.subdomain || 'www';
      
      if (hostParts.length > baseDomainParts.length) {
        // Has subdomain, replace it
        hostParts[0] = newSubdomain;
      } else {
        // No subdomain, add it
        hostParts.unshift(newSubdomain);
      }
      
      url.hostname = hostParts.join('.');
      return url.toString();
    }
  } catch (e) {
    console.error('Failed to transform URL:', originalUrl, e);
  }
  
  return null;
}

// Try Shopify JSON API first (fastest and most reliable)
async function tryShopifyJson(url: string): Promise<{ price: number; currency: string; available: boolean; validatedUrl: string } | null> {
  try {
    // Convert product URL to JSON endpoint
    const jsonUrl = url.replace(/\?.*$/, '') + '.json';
    
    const response = await fetch(jsonUrl, {
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      },
    });
    
    if (!response.ok) return null;
    
    const data = await response.json();
    const product = data.product;
    
    if (!product || !product.variants || product.variants.length === 0) return null;
    
    // Find first available variant, or first variant if none available
    const variant = product.variants.find((v: any) => v.available) || product.variants[0];
    const price = parseFloat(variant.price);
    
    if (isNaN(price) || price <= 0) return null;
    
    // Detect currency from URL region
    let currency = 'USD';
    if (url.includes('ca.store') || url.includes('/ca/')) currency = 'CAD';
    else if (url.includes('uk.store') || url.includes('/uk/')) currency = 'GBP';
    else if (url.includes('eu.store') || url.includes('/eu/')) currency = 'EUR';
    else if (url.includes('au.store') || url.includes('/au/')) currency = 'AUD';
    else if (url.includes('jp.store') || url.includes('/jp/')) currency = 'JPY';
    
    return {
      price,
      currency,
      available: variant.available || false,
      validatedUrl: url,
    };
  } catch (e) {
    console.error('Shopify JSON failed for:', url, e);
    return null;
  }
}

// Validate URL by checking HTTP status
async function validateUrl(url: string): Promise<{ 
  valid: boolean; 
  status: 'valid' | 'invalid' | 'redirect' | 'not_found';
  finalUrl?: string;
}> {
  try {
    const response = await fetch(url, {
      method: 'HEAD',
      redirect: 'manual',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      },
    });
    
    if (response.status === 200) {
      return { valid: true, status: 'valid', finalUrl: url };
    } else if (response.status === 301 || response.status === 302) {
      const redirectUrl = response.headers.get('location');
      // Check if redirect is to a valid product page or homepage
      if (redirectUrl && !redirectUrl.endsWith('/') && redirectUrl.includes('/products/')) {
        return { valid: true, status: 'redirect', finalUrl: redirectUrl };
      }
      return { valid: false, status: 'redirect', finalUrl: redirectUrl || undefined };
    } else if (response.status === 404) {
      return { valid: false, status: 'not_found' };
    }
    
    return { valid: false, status: 'invalid' };
  } catch (e) {
    console.error('URL validation failed:', url, e);
    return { valid: false, status: 'invalid' };
  }
}

// Main scraping function for a single filament
async function scrapeRegionalPricesForFilament(
  filament: { id: string; product_url: string; vendor: string },
  regions: string[]
): Promise<{
  prices: Record<string, { price: number; currency: string; url: string }>;
  validatedUrls: Record<string, string>;
  errors: string[];
}> {
  const prices: Record<string, { price: number; currency: string; url: string }> = {};
  const validatedUrls: Record<string, string> = {};
  const errors: string[] = [];
  
  for (const region of regions) {
    try {
      // Transform URL to regional variant
      const regionalUrl = transformToRegionalUrl(filament.product_url, filament.vendor, region);
      
      if (!regionalUrl) {
        console.log(`No regional URL for ${filament.vendor} ${region}`);
        continue;
      }
      
      console.log(`Scraping ${region}: ${regionalUrl}`);
      
      // First validate the URL
      const validation = await validateUrl(regionalUrl);
      
      if (!validation.valid) {
        errors.push(`${region}: URL invalid (${validation.status})`);
        continue;
      }
      
      const urlToScrape = validation.finalUrl || regionalUrl;
      validatedUrls[region] = urlToScrape;
      
      // Try Shopify JSON API
      const result = await tryShopifyJson(urlToScrape);
      
      if (result) {
        prices[region] = {
          price: result.price,
          currency: result.currency,
          url: result.validatedUrl,
        };
        console.log(`Got ${region} price: ${result.price} ${result.currency}`);
      } else {
        errors.push(`${region}: Could not extract price`);
      }
      
      // Rate limit between regions
      await new Promise(resolve => setTimeout(resolve, 500));
      
    } catch (e) {
      errors.push(`${region}: ${e instanceof Error ? e.message : 'Unknown error'}`);
    }
  }
  
  return { prices, validatedUrls, errors };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { filamentId, filamentIds, brand, regions = ['US', 'CA', 'UK', 'EU', 'AU'], limit = 10, forceUpdate = false } = await req.json();

    console.log('Request params:', { filamentId, filamentIds, brand, regions, limit, forceUpdate });

    // Build query
    let query = supabase
      .from('filaments')
      .select('id, product_url, vendor, variant_price, price_cad, price_eur, price_gbp, price_aud, price_jpy, regional_prices_updated_at');

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
      vendor: string;
      prices: Record<string, number>;
      urls: Record<string, string>;
      errors: string[];
    }[] = [];

    for (const filament of filaments) {
      if (!filament.product_url || !filament.vendor) continue;

      console.log(`\nProcessing: ${filament.vendor} - ${filament.id}`);

      const { prices, validatedUrls, errors } = await scrapeRegionalPricesForFilament(
        { id: filament.id, product_url: filament.product_url, vendor: filament.vendor },
        regions
      );

      // Prepare update data
      const updateData: Record<string, any> = {
        regional_prices_updated_at: new Date().toISOString(),
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

      for (const [region, data] of Object.entries(prices)) {
        const priceCol = priceColumnMap[region];
        if (priceCol) {
          updateData[priceCol] = data.price;
        }
      }

      for (const [region, url] of Object.entries(validatedUrls)) {
        const urlCol = urlColumnMap[region];
        if (urlCol) {
          updateData[urlCol] = url;
        }
      }

      // Update US price if we got it
      if (prices.US) {
        updateData.variant_price = prices.US.price;
      }

      // Update URL validation status
      const hasValidUrls = Object.keys(validatedUrls).length > 0;
      updateData.url_validation_status = hasValidUrls ? 'valid' : 'invalid';
      updateData.url_validated_at = new Date().toISOString();

      // Update database
      const { error: updateError } = await supabase
        .from('filaments')
        .update(updateData)
        .eq('id', filament.id);

      if (updateError) {
        console.error('Update error:', updateError);
        errors.push(`Database update failed: ${updateError.message}`);
      }

      results.push({
        id: filament.id,
        vendor: filament.vendor,
        prices: Object.fromEntries(Object.entries(prices).map(([k, v]) => [k, v.price])),
        urls: validatedUrls,
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

  } catch (error) {
    console.error('Error:', error);
    return new Response(
      JSON.stringify({ success: false, error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});