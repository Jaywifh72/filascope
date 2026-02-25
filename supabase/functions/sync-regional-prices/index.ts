import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.1';
import { 
  getRegionalFieldMapping,
  REGION_CURRENCIES,
  type RegionCode 
} from '../_shared/filament-schema.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Regional store domains - COMPLETE mappings with all verified regional subdomains
const BRAND_REGIONAL_DOMAINS: Record<string, Record<string, string>> = {
  // === MAJOR BRANDS WITH VERIFIED REGIONAL STORES ===
  'bambu-lab': { 
    US: 'us.store.bambulab.com', 
    CA: 'ca.store.bambulab.com', 
    UK: 'uk.store.bambulab.com', 
    EU: 'eu.store.bambulab.com', 
    AU: 'au.store.bambulab.com', 
    JP: 'jp.store.bambulab.com' 
  },
  'elegoo': { 
    US: 'us.elegoo.com', 
    CA: 'ca.elegoo.com', 
    UK: 'uk.elegoo.com', 
    EU: 'eu.elegoo.com', 
    AU: 'au.elegoo.com' 
  },
  'polymaker': { 
    US: 'us.polymaker.com', 
    CA: 'ca.polymaker.com',
    EU: 'eu.polymaker.com'
  },
  'creality': { 
    US: 'store.creality.com', 
    CA: 'store.creality.com', 
    UK: 'store.creality.com', 
    EU: 'store.creality.com', 
    AU: 'store.creality.com' 
  },
  'anycubic': { 
    US: 'store.anycubic.com', 
    CA: 'ca.anycubic.com', 
    UK: 'uk.anycubic.com', 
    EU: 'eu.anycubic.com',
    AU: 'www.anycubic.au'
  },
  'sunlu': {
    US: 'store.sunlu.com',
    CA: 'ca.sunlu.com',
    UK: 'uk.sunlu.com',
    AU: 'au.sunlu.com',
    EU: 'store.sunlu.com'  // EU shares US domain with geo-pricing
  },
  'eryone': {
    US: 'eryone3d.com',
    CA: 'ca.eryone3d.com',
    UK: 'uk.eryone3d.com',
    EU: 'de.eryone3d.com',
    AU: 'au.eryone3d.com'
  },
  'esun': {
    US: 'esun3dstore.com',
    EU: 'esun3dstoreeu.com',
    UK: 'esun3dstore.uk'
  },
  'kingroon': {
    US: 'kingroon.com',
    CA: 'ca.kingroon.com',
    UK: 'uk.kingroon.com',
    EU: 'eu.kingroon.com',
    AU: 'au.kingroon.com'
  },
  'sovol': {
    US: 'www.sovol3d.com',
    EU: 'sovol.eu'
  },
  'qidi': { 
    US: 'us.qidi3d.com', 
    CA: 'ca.qidi3d.com', 
    UK: 'uk.qidi3d.com', 
    EU: 'eu.qidi3d.com', 
    AU: 'au.qidi3d.com' 
  },
  'flashforge': { 
    US: 'www.flashforge.com', 
    CA: 'ca.flashforge.com',
    EU: 'eu.flashforge.com',
    UK: 'uk.flashforge.com',
    AU: 'au.flashforge.com'
  },
  'jayo': {
    US: 'www.jayo3d.com',
    UK: 'uk.jayo3d.com',
    EU: 'eu.jayo3d.com'
  },
  'raise3d': {
    US: 'shop.raise3d.com',
    EU: 'eu.raise3d.com'
  },
  'ratrig': {
    EU: 'www.ratrig.com'
  },
  'artillery': {
    US: 'artillery3d.com',
    EU: 'eu.artillery3d.com'
  },
  'longer': {
    US: 'www.longer3d.com',
    EU: 'eu.longer3d.com'
  },
  'two-trees': {
    US: 'www.twotrees3d.com',
    EU: 'eu.twotrees3d.com'
  },
  'geeetech': {
    US: 'www.geeetech.com',
    EU: 'eu.geeetech.com'
  },
  'voxelab': {
    US: 'www.voxelab3dp.com',
    EU: 'eu.voxelab3dp.com'
  },
  'flsun': {
    US: 'us.store.flsun3d.com',
    CA: 'ca.store.flsun3d.com',
    UK: 'uk.store.flsun3d.com',
    EU: 'eu.store.flsun3d.com',
    AU: 'au.store.flsun3d.com'
  },
};

// Expected price ratios for validation (vs USD base)
const EXPECTED_PRICE_RATIOS: Record<string, { min: number; max: number }> = {
  'CA': { min: 1.1, max: 1.6 },   // CAD is weaker than USD
  'EU': { min: 0.85, max: 1.25 }, // EUR varies
  'UK': { min: 0.70, max: 1.15 }, // GBP slightly stronger
  'AU': { min: 1.3, max: 1.9 },   // AUD weaker
  'JP': { min: 100, max: 160 },   // JPY much higher numerically
};

interface SyncRequest {
  brandSlug: string;
  regions: string[];
  dryRun?: boolean;
  limit?: number;
}

interface RegionalProduct {
  productId: string;
  handle: string;
  title: string;
  price: number | null;
  compareAtPrice: number | null;
  url: string;
  available: boolean;
  sku?: string;
  region: string;
  currency: string;
}

interface MatchResult {
  filamentId: string;
  productId: string;
  title: string;
  region: string;
  usPrice: number | null;
  regionalPrice: number | null;
  priceRatio: number | null;
  action: 'updated' | 'skipped' | 'rejected' | 'error';
  reason?: string;
}

// Fetch products from Shopify store
async function fetchShopifyProducts(domain: string, limit: number = 250): Promise<any[]> {
  const allProducts: any[] = [];
  let page = 1;
  
  while (allProducts.length < limit) {
    const url = `https://${domain}/products.json?limit=250&page=${page}`;
    console.log(`[sync-regional-prices] Fetching: ${url}`);
    
    try {
      const response = await fetch(url, {
        headers: { 'Accept': 'application/json' }
      });
      
      if (!response.ok) {
        console.error(`[sync-regional-prices] Failed to fetch from ${domain}: ${response.status}`);
        break;
      }
      
      const data = await response.json();
      const products = data.products || [];
      
      if (products.length === 0) break;
      
      allProducts.push(...products);
      page++;
      
      // Rate limit
      await new Promise(r => setTimeout(r, 500));
    } catch (err) {
      console.error(`[sync-regional-prices] Error fetching from ${domain}:`, err);
      break;
    }
  }
  
  return allProducts.slice(0, limit);
}

// Parse Shopify products into our format
function parseShopifyProducts(products: any[], region: string): RegionalProduct[] {
  const result: RegionalProduct[] = [];
  
  for (const product of products) {
    // Only process filament products
    const productType = (product.product_type || '').toLowerCase();
    const title = (product.title || '').toLowerCase();
    
    const isFilament = productType.includes('filament') || 
                       title.includes('filament') ||
                       title.includes('pla') || 
                       title.includes('petg') || 
                       title.includes('abs') ||
                       title.includes('tpu');
    
    if (!isFilament) continue;
    
    // Get first available variant
    const variant = product.variants?.[0];
    if (!variant) continue;
    
    result.push({
      productId: String(product.id),
      handle: product.handle || '',
      title: product.title || '',
      price: variant.price ? parseFloat(variant.price) : null,
      compareAtPrice: variant.compare_at_price ? parseFloat(variant.compare_at_price) : null,
      url: `https://${product.handle}`, // Will be reconstructed with domain
      available: variant.available ?? true,
      sku: variant.sku || undefined,
      region,
      currency: REGION_CURRENCIES[region as RegionCode] || 'USD',
    });
  }
  
  return result;
}

// Validate price ratio is within expected range
function validatePriceRatio(usPrice: number, regionalPrice: number, region: string): { valid: boolean; ratio: number; reason?: string } {
  if (!usPrice || !regionalPrice) {
    return { valid: false, ratio: 0, reason: 'Missing price data' };
  }
  
  const ratio = regionalPrice / usPrice;
  const expected = EXPECTED_PRICE_RATIOS[region];
  
  if (!expected) {
    return { valid: true, ratio }; // No validation for unknown regions
  }
  
  if (ratio < expected.min || ratio > expected.max) {
    return { 
      valid: false, 
      ratio, 
      reason: `Price ratio ${ratio.toFixed(2)} outside expected range ${expected.min}-${expected.max}` 
    };
  }
  
  return { valid: true, ratio };
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  try {
    const body: SyncRequest = await req.json();
    const { brandSlug, regions, dryRun = true, limit = 500 } = body;

    if (!brandSlug || !regions || regions.length === 0) {
      return new Response(
        JSON.stringify({ success: false, error: 'brandSlug and regions are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const startTime = Date.now();
    console.log(`[sync-regional-prices] Starting regional sync for ${brandSlug}`, { regions, dryRun, limit });

    // Get brand configuration
    const { data: brand, error: brandError } = await supabase
      .from('automated_brands')
      .select('*')
      .eq('brand_slug', brandSlug)
      .single();

    if (brandError || !brand) {
      return new Response(
        JSON.stringify({ success: false, error: `Brand not found: ${brandSlug}` }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const domains = BRAND_REGIONAL_DOMAINS[brandSlug];
    if (!domains) {
      return new Response(
        JSON.stringify({ success: false, error: `No regional domains configured for ${brandSlug}` }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Step 1: Fetch existing filaments for this brand with US prices
    const { data: existingFilaments, error: fetchError } = await supabase
      .from('filaments')
      .select('id, product_id, product_handle, product_title, variant_price, variant_sku')
      .ilike('vendor', brand.brand_name)
      .limit(limit);

    if (fetchError) {
      throw new Error(`Failed to fetch existing filaments: ${fetchError.message}`);
    }

    console.log(`[sync-regional-prices] Found ${existingFilaments?.length || 0} existing filaments for ${brand.brand_name}`);

    // Build lookup maps for matching
    const byProductId = new Map<string, any>();
    const byHandle = new Map<string, any>();
    const bySku = new Map<string, any>();
    
    for (const filament of existingFilaments || []) {
      if (filament.product_id) byProductId.set(filament.product_id, filament);
      if (filament.product_handle) byHandle.set(filament.product_handle, filament);
      if (filament.variant_sku) bySku.set(filament.variant_sku, filament);
    }

    const results: MatchResult[] = [];
    const regionBreakdown: Record<string, { found: number; matched: number; updated: number; skipped: number; rejected: number }> = {};

    // Step 2: Process each region
    for (const region of regions) {
      if (region === 'US') continue; // Skip US - that's the base price
      
      const domain = domains[region];
      if (!domain) {
        console.log(`[sync-regional-prices] No domain configured for ${brandSlug} ${region}`);
        continue;
      }

      console.log(`[sync-regional-prices] Processing ${region} from ${domain}`);
      regionBreakdown[region] = { found: 0, matched: 0, updated: 0, skipped: 0, rejected: 0 };

      // Fetch products from regional store
      const rawProducts = await fetchShopifyProducts(domain, limit);
      const regionalProducts = parseShopifyProducts(rawProducts, region);
      regionBreakdown[region].found = regionalProducts.length;

      console.log(`[sync-regional-prices] Found ${regionalProducts.length} filament products in ${region} store`);

      // Match and update
      for (const rp of regionalProducts) {
        // Try to match by product ID, handle, or SKU
        let match = byProductId.get(rp.productId);
        if (!match && rp.handle) match = byHandle.get(rp.handle);
        if (!match && rp.sku) match = bySku.get(rp.sku);

        if (!match) {
          // Try fuzzy title matching as last resort
          const normalizedTitle = rp.title.toLowerCase().replace(/[^a-z0-9]/g, '');
          for (const filament of existingFilaments || []) {
            const existingTitle = (filament.product_title || '').toLowerCase().replace(/[^a-z0-9]/g, '');
            if (existingTitle === normalizedTitle) {
              match = filament;
              break;
            }
          }
        }

        if (!match) {
          results.push({
            filamentId: '',
            productId: rp.productId,
            title: rp.title,
            region,
            usPrice: null,
            regionalPrice: rp.price,
            priceRatio: null,
            action: 'skipped',
            reason: 'No matching US product found'
          });
          regionBreakdown[region].skipped++;
          continue;
        }

        regionBreakdown[region].matched++;

        // Validate price ratio if we have US price
        const usPrice = match.variant_price;
        let validation: { valid: boolean; ratio: number; reason: string | undefined } = { valid: true, ratio: 0, reason: undefined };
        
        if (usPrice && rp.price) {
          const result = validatePriceRatio(usPrice, rp.price, region);
          validation = { valid: result.valid, ratio: result.ratio, reason: result.reason };
        }

        if (!validation.valid) {
          results.push({
            filamentId: match.id,
            productId: rp.productId,
            title: rp.title,
            region,
            usPrice,
            regionalPrice: rp.price,
            priceRatio: validation.ratio,
            action: 'rejected',
            reason: validation.reason
          });
          regionBreakdown[region].rejected++;
          continue;
        }

        // Update the regional price/URL fields
        if (!dryRun) {
          const fieldMap = getRegionalFieldMapping(region);
          const updateData: Record<string, any> = {
            regional_prices_updated_at: new Date().toISOString(),
          };

          if (rp.price !== null) {
            updateData[fieldMap.priceField] = rp.price;
          }
          
          // Construct regional URL
          updateData[fieldMap.urlField] = `https://${domain}/products/${rp.handle}`;

          const { error: updateError } = await supabase
            .from('filaments')
            .update(updateData)
            .eq('id', match.id);

          if (updateError) {
            console.error(`[sync-regional-prices] Error updating ${match.id}:`, updateError);
            results.push({
              filamentId: match.id,
              productId: rp.productId,
              title: rp.title,
              region,
              usPrice,
              regionalPrice: rp.price,
              priceRatio: validation.ratio,
              action: 'error',
              reason: updateError.message
            });
            continue;
          }
        }

        results.push({
          filamentId: match.id,
          productId: rp.productId,
          title: rp.title,
          region,
          usPrice,
          regionalPrice: rp.price,
          priceRatio: validation.ratio,
          action: 'updated'
        });
        regionBreakdown[region].updated++;
      }

      // Rate limit between regions
      await new Promise(r => setTimeout(r, 1000));
    }

    const duration = Date.now() - startTime;
    const summary = {
      totalMatched: results.filter(r => r.action === 'updated').length,
      totalSkipped: results.filter(r => r.action === 'skipped').length,
      totalRejected: results.filter(r => r.action === 'rejected').length,
      totalErrors: results.filter(r => r.action === 'error').length,
    };

    console.log(`[sync-regional-prices] Completed for ${brandSlug}`, summary);

    // Build regional_breakdown JSON for Sync Monitor
    const regionalBreakdownJson: Record<string, unknown> = {};
    for (const [region, stats] of Object.entries(regionBreakdown)) {
      regionalBreakdownJson[region] = {
        updated: stats.updated,
        created: 0,
        skipped: stats.skipped,
        errors: stats.rejected,
        products_found: stats.found,
        matched: stats.matched,
        error_messages: results
          .filter(r => r.region === region && (r.action === 'rejected' || r.action === 'error'))
          .slice(0, 10)
          .map(r => `${r.title}: ${r.reason}`),
      };
    }

    // Create sync log entry
    await supabase
      .from('brand_sync_logs')
      .insert({
        brand_id: brand.id,
        brand_slug: brandSlug,
        sync_type: 'regional_prices',
        status: 'completed',
        triggered_by: 'manual',
        started_at: new Date(startTime).toISOString(),
        completed_at: new Date().toISOString(),
        duration_seconds: Math.round(duration / 1000),
        products_discovered: results.length,
        products_updated: summary.totalMatched,
        regions_synced: regions.filter(r => r !== 'US'),
        regional_breakdown: regionalBreakdownJson,
        success_details: { regionBreakdown, dryRun },
      });

    return new Response(
      JSON.stringify({
        success: true,
        brandSlug,
        dryRun,
        regions,
        summary,
        regionBreakdown,
        results: results.slice(0, 100), // Limit results in response
        duration_ms: duration,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('[sync-regional-prices] Error:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
