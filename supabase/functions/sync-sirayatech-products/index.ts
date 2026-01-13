/**
 * Siraya Tech CSV-Seeded Sync Function
 * 
 * 5-Step Pipeline:
 * 1. Load CSV Seed Data
 * 2. Safe Delete (threshold: 30 variants)
 * 3. Enrich with Live Shopify Data (prices, images)
 * 4. Upsert to Database
 * 5. Fix Duplicate Hex Codes
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import {
  SIRAYATECH_PRODUCT_SEED,
  SIRAYATECH_COLOR_MAPPING,
  getSirayaTechColorHexFromSeed,
  shouldExcludeSirayaTechProduct,
} from '../_shared/sirayatech-seed.ts';
import {
  enrichSirayaTechProduct,
  getSirayaTechPrintSettings,
} from '../_shared/sirayatech-defaults.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const VENDOR_NAME = 'Siraya Tech';
const BRAND_SLUG = 'siraya-tech';
const BASE_URL = 'https://siraya.tech';
const SAFE_DELETE_THRESHOLD = 30;

interface SyncStats {
  created: number;
  updated: number;
  skipped: number;
  failed: number;
  deleted: number;
}

interface ShopifyProductData {
  price: number | null;
  compareAtPrice: number | null;
  imageUrl: string | null;
  available: boolean;
}

/**
 * Fetch live product data from Shopify JSON API
 */
async function fetchShopifyProductData(handle: string): Promise<ShopifyProductData | null> {
  try {
    const url = `${BASE_URL}/products/${handle}.json`;
    const response = await fetch(url, {
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'FilaScope/1.0 (Product Sync)',
      },
    });

    if (!response.ok) {
      console.log(`[Siraya Tech] Failed to fetch ${handle}: ${response.status}`);
      return null;
    }

    const data = await response.json();
    const product = data.product;
    
    if (!product) return null;

    // Get first variant price
    const variant = product.variants?.[0];
    const price = variant?.price ? parseFloat(variant.price) : null;
    const compareAtPrice = variant?.compare_at_price ? parseFloat(variant.compare_at_price) : null;
    const available = variant?.available ?? true;

    // Get first image
    const imageUrl = product.images?.[0]?.src?.split('?')[0] || null;

    return { price, compareAtPrice, imageUrl, available };
  } catch (error) {
    console.error(`[Siraya Tech] Error fetching ${handle}:`, error);
    return null;
  }
}

/**
 * Extract product handle from URL
 */
function extractHandleFromUrl(url: string): string | null {
  const match = url.match(/\/products\/([^/?#]+)/);
  return match ? match[1] : null;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const startTime = Date.now();
  const stats: SyncStats = { created: 0, updated: 0, skipped: 0, failed: 0, deleted: 0 };

  try {
    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Parse options
    const { cleanSlate = false } = await req.json().catch(() => ({}));

    console.log(`[Siraya Tech] Starting CSV-seeded sync (cleanSlate: ${cleanSlate})`);
    console.log(`[Siraya Tech] Seed contains ${SIRAYATECH_PRODUCT_SEED.length} products`);

    // ============= STEP 1: GET BRAND ID =============
    const { data: brandData } = await supabase
      .from('automated_brands')
      .select('id')
      .eq('brand_slug', BRAND_SLUG)
      .single();

    const brandId = brandData?.id || null;

    // Update brand status
    await supabase
      .from('automated_brands')
      .update({ 
        scraping_active: true,
        last_scrape_at: new Date().toISOString(),
      })
      .eq('brand_slug', BRAND_SLUG);

    // ============= STEP 2: SAFE DELETE (if cleanSlate) =============
    if (cleanSlate && SIRAYATECH_PRODUCT_SEED.length >= SAFE_DELETE_THRESHOLD) {
      console.log(`[Siraya Tech] Clean slate enabled, deleting existing products...`);
      
      const { data: existingProducts, error: countError } = await supabase
        .from('filaments')
        .select('id')
        .ilike('vendor', VENDOR_NAME);

      if (!countError && existingProducts) {
        const { error: deleteError } = await supabase
          .from('filaments')
          .delete()
          .ilike('vendor', VENDOR_NAME);

        if (!deleteError) {
          stats.deleted = existingProducts.length;
          console.log(`[Siraya Tech] Deleted ${stats.deleted} existing products`);
        }
      }
    }

    // ============= STEP 3: PROCESS SEED DATA =============
    // Group by product URL to fetch Shopify data once per product
    const productHandles = new Map<string, string>();
    for (const seed of SIRAYATECH_PRODUCT_SEED) {
      const handle = extractHandleFromUrl(seed.productUrl);
      if (handle) {
        productHandles.set(seed.productUrl, handle);
      }
    }

    // Fetch live Shopify data for each unique product
    console.log(`[Siraya Tech] Fetching live data for ${productHandles.size} unique products...`);
    const shopifyDataCache = new Map<string, ShopifyProductData | null>();
    
    for (const [url, handle] of productHandles) {
      const data = await fetchShopifyProductData(handle);
      shopifyDataCache.set(url, data);
      // Rate limiting
      await new Promise(resolve => setTimeout(resolve, 300));
    }

    // ============= STEP 4: UPSERT PRODUCTS =============
    const filamentRows: Record<string, any>[] = [];

    for (const seed of SIRAYATECH_PRODUCT_SEED) {
      try {
        // Get enrichment data
        const handle = extractHandleFromUrl(seed.productUrl) || '';
        const enrichment = enrichSirayaTechProduct(
          seed.filamentName,
          handle,
          seed.color
        );

        // Get live Shopify data
        const shopifyData = shopifyDataCache.get(seed.productUrl);

        // Use seed price as fallback, Shopify price as primary
        const price = shopifyData?.price || seed.priceUsd || null;
        const imageUrl = shopifyData?.imageUrl || null;
        const available = shopifyData?.available ?? true;

        // Generate unique product_id
        const colorSlug = seed.color.toLowerCase().replace(/\s+/g, '-');
        const productId = `sirayatech-${handle}-${colorSlug}`;

        // Get color family from color name
        const getColorFamilyFromName = (color: string): string => {
          const lower = color.toLowerCase();
          if (lower.includes('black') || lower === 'charcoal') return 'Black';
          if (lower.includes('white')) return 'White';
          if (lower === 'clear' || lower.includes('translucent') || lower.includes('transparent')) return 'Clear';
          if (lower === 'grey' || lower === 'gray') return 'Gray';
          if (lower.includes('green') || lower.includes('olive')) return 'Green';
          if (lower.includes('earth') || lower.includes('beige') || lower.includes('natural')) return 'Brown';
          return color;
        };
        const colorFamily = getColorFamilyFromName(seed.color);

        // Build filament row
        const row: Record<string, any> = {
          product_id: productId,
          product_title: `${seed.filamentName} - ${seed.color}`,
          vendor: VENDOR_NAME,
          brand_id: brandId,
          product_url: seed.productUrl,
          product_handle: handle,
          featured_image: imageUrl,
          variant_available: available,
          variant_price: price,
          
          // Physical specs
          diameter_nominal_mm: 1.75,
          net_weight_g: 800, // Siraya Tech standard spool
          
          // Enriched data from defaults
          material: enrichment.material || seed.material,
          finish_type: enrichment.finishType,
          product_line_id: seed.productLineId,
          color_hex: seed.colorHex,
          color_family: colorFamily,
          tds_url: enrichment.tdsUrl,
          is_nozzle_abrasive: enrichment.isAbrasive,
          
          // Print settings
          nozzle_temp_min_c: enrichment.printSettings?.nozzleTempMin || null,
          nozzle_temp_max_c: enrichment.printSettings?.nozzleTempMax || null,
          bed_temp_min_c: enrichment.printSettings?.bedTempMin || null,
          bed_temp_max_c: enrichment.printSettings?.bedTempMax || null,
          print_speed_max_mms: enrichment.printSettings?.printSpeedMax || null,
          
          // Sync metadata
          auto_created: true,
          auto_updated: true,
          last_scraped_at: new Date().toISOString(),
          sync_status: 'synced',
        };

        filamentRows.push(row);
      } catch (error) {
        console.error(`[Siraya Tech] Error processing ${seed.filamentName} - ${seed.color}:`, error);
        stats.failed++;
      }
    }

    // Batch upsert
    console.log(`[Siraya Tech] Upserting ${filamentRows.length} products...`);
    
    const batchSize = 50;
    for (let i = 0; i < filamentRows.length; i += batchSize) {
      const batch = filamentRows.slice(i, i + batchSize);
      
      const { error } = await supabase
        .from('filaments')
        .upsert(batch, { onConflict: 'product_id' });

      if (error) {
        console.error(`[Siraya Tech] Batch upsert error:`, error);
        stats.failed += batch.length;
      } else {
        stats.created += batch.length;
      }
    }

    // ============= STEP 5: FIX DUPLICATE HEX CODES =============
    console.log(`[Siraya Tech] Checking for duplicate hex codes...`);
    
    try {
      await supabase.rpc('find_duplicate_hexes', { p_vendor: VENDOR_NAME });
    } catch (error) {
      console.log(`[Siraya Tech] find_duplicate_hexes RPC not available, skipping`);
    }

    // ============= STEP 6: UPDATE BRAND STATS =============
    const { count: productCount } = await supabase
      .from('filaments')
      .select('*', { count: 'exact', head: true })
      .ilike('vendor', VENDOR_NAME);

    await supabase
      .from('automated_brands')
      .update({
        scraping_active: false,
        product_count: productCount || 0,
        active_product_count: productCount || 0,
        last_scrape_at: new Date().toISOString(),
      })
      .eq('brand_slug', BRAND_SLUG);

    const duration = ((Date.now() - startTime) / 1000).toFixed(1);
    console.log(`[Siraya Tech] Sync complete in ${duration}s: ${stats.created} created, ${stats.failed} failed, ${stats.deleted} deleted`);

    return new Response(
      JSON.stringify({
        success: true,
        brand: VENDOR_NAME,
        stats,
        duration: parseFloat(duration),
        productCount: productCount || 0,
        seedCount: SIRAYATECH_PRODUCT_SEED.length,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error(`[Siraya Tech] Fatal error:`, error);
    
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        stats,
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
