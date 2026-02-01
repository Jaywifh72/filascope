import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Brand regional store configurations (synced from src/lib/brandRegionalStores.ts)
const BRAND_REGIONAL_CONFIGS: Record<string, {
  pattern: 'subdomain' | 'path' | 'global';
  baseDomain: string;
  regions: Record<string, { subdomain?: string; pathPrefix?: string; domain?: string; currency: string }>;
}> = {
  'bambu-lab': {
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
  'elegoo': {
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
  'polymaker': {
    pattern: 'subdomain',
    baseDomain: 'polymaker.com',
    regions: {
      US: { subdomain: 'us', currency: 'USD' },
      CA: { subdomain: 'ca', currency: 'CAD' },
      EU: { subdomain: 'eu', currency: 'EUR' },
    }
  },
  'creality': {
    pattern: 'subdomain',
    baseDomain: 'store.creality.com',
    regions: {
      US: { subdomain: '', currency: 'USD' }, // store.creality.com (no subdomain)
      CA: { subdomain: 'ca', currency: 'CAD' },
      UK: { subdomain: 'uk', currency: 'GBP' },
      EU: { subdomain: 'eu', currency: 'EUR' },
      AU: { subdomain: 'au', currency: 'AUD' },
    }
  },
  'anycubic': {
    pattern: 'subdomain',
    baseDomain: 'anycubic.com',
    regions: {
      US: { subdomain: 'store', currency: 'USD' },
      CA: { subdomain: 'ca', currency: 'CAD' },
      UK: { subdomain: 'uk', currency: 'GBP' },
      EU: { subdomain: 'eu', currency: 'EUR' },
      AU: { domain: 'www.anycubic.au', currency: 'AUD' },
    }
  },
  'qidi': {
    pattern: 'subdomain',
    baseDomain: 'qidi3d.com',
    regions: {
      US: { subdomain: 'www', currency: 'USD' },
      EU: { subdomain: 'eu', currency: 'EUR' },
    }
  },
  'flashforge': {
    pattern: 'subdomain',
    baseDomain: 'flashforge.com',
    regions: {
      US: { subdomain: 'www', currency: 'USD' },
      CA: { subdomain: 'ca', currency: 'CAD' },
      UK: { subdomain: 'uk', currency: 'GBP' },
      EU: { subdomain: 'eu', currency: 'EUR' },
      AU: { subdomain: 'au', currency: 'AUD' },
    }
  },
  'eryone': {
    pattern: 'subdomain',
    baseDomain: 'eryone3d.com',
    regions: {
      US: { subdomain: 'www', currency: 'USD' },
      EU: { subdomain: 'eu', currency: 'EUR' },
    }
  },
  'jayo': {
    pattern: 'subdomain',
    baseDomain: 'jayo3d.com',
    regions: {
      US: { subdomain: 'www', currency: 'USD' },
      UK: { subdomain: 'uk', currency: 'GBP' },
      EU: { subdomain: 'eu', currency: 'EUR' },
    }
  },
  'kingroon': {
    pattern: 'subdomain',
    baseDomain: 'kingroon.com',
    regions: {
      US: { subdomain: 'www', currency: 'USD' },
      EU: { subdomain: 'eu', currency: 'EUR' },
    }
  },
  'sovol': {
    pattern: 'subdomain',
    baseDomain: 'sovol3d.com',
    regions: {
      US: { subdomain: 'www', currency: 'USD' },
      EU: { subdomain: 'eu', currency: 'EUR' },
    }
  },
  'artillery': {
    pattern: 'subdomain',
    baseDomain: 'artillery3d.com',
    regions: {
      US: { subdomain: 'www', currency: 'USD' },
      EU: { subdomain: 'eu', currency: 'EUR' },
    }
  },
  'sunlu': {
    pattern: 'subdomain',
    baseDomain: 'sunlu.com',
    regions: {
      US: { subdomain: 'www', currency: 'USD' },
      EU: { subdomain: 'eu', currency: 'EUR' },
    }
  },
};

// Map brand names to slugs for lookup
const BRAND_NAME_TO_SLUG: Record<string, string> = {
  'bambu lab': 'bambu-lab',
  'bambulab': 'bambu-lab',
  'elegoo': 'elegoo',
  'polymaker': 'polymaker',
  'creality': 'creality',
  'anycubic': 'anycubic',
  'qidi': 'qidi',
  'flashforge': 'flashforge',
  'eryone': 'eryone',
  'jayo': 'jayo',
  'kingroon': 'kingroon',
  'sovol': 'sovol',
  'artillery': 'artillery',
  'sunlu': 'sunlu',
};

interface PopulateRequest {
  brandSlug?: string;      // Specific brand or 'all'
  productType?: 'filament' | 'printer';
  regions?: string[];      // Specific regions or all
  validateUrls?: boolean;  // Check if URLs return 200
  limit?: number;
  dryRun?: boolean;
}

interface UrlGenerationResult {
  productId: string;
  productType: string;
  regionCode: string;
  storeUrl: string;
  currencyCode: string;
  isValid?: boolean;
  validationError?: string;
}

// Extract product slug from URL
function extractSlugFromUrl(url: string): string | null {
  try {
    const urlObj = new URL(url);
    const pathname = urlObj.pathname;
    
    // Match /products/{slug} pattern
    const productMatch = pathname.match(/\/products\/([^/?#]+)/);
    if (productMatch) {
      return productMatch[1];
    }
    
    // Match /{slug} pattern (FormFutura style)
    const rootMatch = pathname.match(/^\/([^/?#]+)$/);
    if (rootMatch) {
      return rootMatch[1];
    }
    
    return null;
  } catch {
    return null;
  }
}

// Generate regional URL from base URL
function generateRegionalUrl(
  baseUrl: string,
  brandSlug: string,
  regionCode: string
): { url: string; currency: string } | null {
  const config = BRAND_REGIONAL_CONFIGS[brandSlug];
  if (!config) return null;
  
  const regionConfig = config.regions[regionCode];
  if (!regionConfig) return null;
  
  const slug = extractSlugFromUrl(baseUrl);
  if (!slug) return null;
  
  let regionalUrl: string;
  
  if (config.pattern === 'subdomain') {
    if (regionConfig.domain) {
      // Full domain override (e.g., www.anycubic.au)
      regionalUrl = `https://${regionConfig.domain}/products/${slug}`;
    } else {
      // Subdomain pattern
      const subdomain = regionConfig.subdomain || '';
      const domain = subdomain ? `${subdomain}.${config.baseDomain}` : config.baseDomain;
      regionalUrl = `https://${domain}/products/${slug}`;
    }
  } else if (config.pattern === 'path') {
    // Path prefix pattern
    regionalUrl = `https://${config.baseDomain}/${regionConfig.pathPrefix}/products/${slug}`;
  } else {
    // Global pattern - no transformation
    return null;
  }
  
  return {
    url: regionalUrl,
    currency: regionConfig.currency,
  };
}

// Validate URL returns 200
async function validateUrl(url: string): Promise<{ valid: boolean; error?: string }> {
  try {
    const response = await fetch(url, {
      method: 'HEAD',
      headers: { 'User-Agent': 'Mozilla/5.0 FilaScope URL Validator' },
    });
    
    if (response.ok) {
      return { valid: true };
    }
    
    // Check for redirect
    if (response.status >= 300 && response.status < 400) {
      const location = response.headers.get('location');
      return { valid: false, error: `Redirect to ${location}` };
    }
    
    return { valid: false, error: `HTTP ${response.status}` };
  } catch (error) {
    return { valid: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  try {
    const body: PopulateRequest = await req.json();
    const {
      brandSlug = 'all',
      productType = 'filament',
      regions,
      validateUrls = false,
      limit = 1000,
      dryRun = false,
    } = body;

    const startTime = Date.now();
    console.log(`[populate-regional-urls] Starting for ${brandSlug}, type=${productType}, validate=${validateUrls}`);

    // Determine which regions to process
    const targetRegions = regions || ['US', 'CA', 'UK', 'EU', 'AU', 'JP'];

    // Determine which brands to process
    let targetBrandSlugs: string[];
    if (brandSlug === 'all') {
      targetBrandSlugs = Object.keys(BRAND_REGIONAL_CONFIGS);
    } else {
      const normalizedSlug = BRAND_NAME_TO_SLUG[brandSlug.toLowerCase()] || brandSlug.toLowerCase();
      if (!BRAND_REGIONAL_CONFIGS[normalizedSlug]) {
        return new Response(
          JSON.stringify({ success: false, error: `Unknown brand: ${brandSlug}` }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      targetBrandSlugs = [normalizedSlug];
    }

    // Fetch products for processing
    const tableName = productType === 'filament' ? 'filaments' : 'printers';
    let query = supabase
      .from(tableName)
      .select('id, product_url, vendor, product_handle')
      .not('product_url', 'is', null)
      .limit(limit);

    // Filter by brand if specific
    if (brandSlug !== 'all') {
      const brandConfig = await supabase
        .from('automated_brands')
        .select('brand_name')
        .eq('brand_slug', targetBrandSlugs[0])
        .single();
      
      if (brandConfig.data) {
        query = query.ilike('vendor', brandConfig.data.brand_name);
      }
    } else {
      // For all brands, get all brand names
      const brandNames = Object.values(BRAND_NAME_TO_SLUG);
      const { data: brands } = await supabase
        .from('automated_brands')
        .select('brand_name')
        .in('brand_slug', brandNames);
      
      if (brands && brands.length > 0) {
        const vendorNames = brands.map(b => b.brand_name);
        query = query.in('vendor', vendorNames);
      }
    }

    const { data: products, error: queryError } = await query;

    if (queryError) {
      throw new Error(`Query error: ${queryError.message}`);
    }

    if (!products || products.length === 0) {
      return new Response(
        JSON.stringify({ success: true, message: 'No products to process', stats: { total: 0 } }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`[populate-regional-urls] Found ${products.length} products to process`);

    // Generate regional URLs
    const results: UrlGenerationResult[] = [];
    const regionStats: Record<string, { generated: number; validated: number; failed: number }> = {};

    for (const product of products) {
      const vendorLower = (product.vendor || '').toLowerCase();
      const brandSlugForProduct = BRAND_NAME_TO_SLUG[vendorLower] || vendorLower.replace(/\s+/g, '-');
      
      const config = BRAND_REGIONAL_CONFIGS[brandSlugForProduct];
      if (!config) continue;

      for (const regionCode of targetRegions) {
        if (!regionStats[regionCode]) {
          regionStats[regionCode] = { generated: 0, validated: 0, failed: 0 };
        }

        const generated = generateRegionalUrl(product.product_url, brandSlugForProduct, regionCode);
        if (!generated) continue;

        const result: UrlGenerationResult = {
          productId: product.id,
          productType,
          regionCode,
          storeUrl: generated.url,
          currencyCode: generated.currency,
        };

        // Optionally validate the URL
        if (validateUrls) {
          const validation = await validateUrl(generated.url);
          result.isValid = validation.valid;
          result.validationError = validation.error;
          
          if (validation.valid) {
            regionStats[regionCode].validated++;
          } else {
            regionStats[regionCode].failed++;
          }
          
          // Rate limit validation
          await new Promise(r => setTimeout(r, 200));
        }

        results.push(result);
        regionStats[regionCode].generated++;
      }
    }

    console.log(`[populate-regional-urls] Generated ${results.length} regional URLs`);

    // Insert into database if not dry run
    let inserted = 0;
    let errors = 0;

    if (!dryRun && results.length > 0) {
      // Filter to only valid URLs if validation was enabled
      const urlsToInsert = validateUrls 
        ? results.filter(r => r.isValid !== false)
        : results;

      // Batch insert/upsert
      const batchSize = 100;
      for (let i = 0; i < urlsToInsert.length; i += batchSize) {
        const batch = urlsToInsert.slice(i, i + batchSize);
        
        const insertData = batch.map(r => ({
          product_id: r.productId,
          product_type: r.productType,
          region_code: r.regionCode,
          store_url: r.storeUrl,
          currency_code: r.currencyCode,
          is_primary: r.regionCode === 'US',
          is_verified: r.isValid === true,
          store_name: `${r.regionCode} Store`,
        }));

        const { error: insertError } = await supabase
          .from('product_regional_urls')
          .upsert(insertData, {
            onConflict: 'product_id,product_type,region_code',
            ignoreDuplicates: false,
          });

        if (insertError) {
          console.error(`[populate-regional-urls] Insert error:`, insertError);
          errors += batch.length;
        } else {
          inserted += batch.length;
        }
      }
    }

    const duration = Date.now() - startTime;

    // Log to admin activity
    await supabase.from('admin_activity_log').insert({
      action_type: 'populate_regional_urls',
      entity_type: productType,
      details: {
        brandSlug,
        regions: targetRegions,
        totalProducts: products.length,
        urlsGenerated: results.length,
        urlsInserted: inserted,
        errors,
        dryRun,
        validateUrls,
        duration_ms: duration,
        regionStats,
      },
    });

    return new Response(
      JSON.stringify({
        success: true,
        dryRun,
        stats: {
          productsProcessed: products.length,
          urlsGenerated: results.length,
          urlsInserted: inserted,
          errors,
          regionStats,
        },
        sampleUrls: results.slice(0, 10),
        duration_ms: duration,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('[populate-regional-urls] Error:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
