import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import {
  ZIRO_PRODUCT_SEED,
  getZiroProductLineId,
  getZiroMaterialFromSeed,
  getZiroFinishTypeFromSeed,
  getZiroColorFamily,
  generateZiroProductTitle,
  ZiroProductSeed,
} from '../_shared/ziro-seed.ts';
import {
  enrichZiroProduct,
  ZIRO_STORE_INFO,
} from '../_shared/ziro-defaults.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// ============================================================================
// CONSTANTS
// ============================================================================

const VENDOR_NAME = 'Ziro';
const SAFE_DELETE_THRESHOLD = 200; // Only delete if we have at least 200 products in seed

interface SyncStats {
  created: number;
  updated: number;
  skipped: number;
  errors: number;
  pricesFetched: number;
  pricesFailed: number;
}

interface SyncResult {
  step: string;
  success: boolean;
  message: string;
  count?: number;
  details?: Record<string, unknown>;
}

// ============================================================================
// STEP 1: FETCH LIVE PRICE FROM SHOPIFY
// ============================================================================

async function fetchShopifyPrice(productUrl: string): Promise<{ price: number | null; available: boolean }> {
  try {
    // Extract handle from URL: https://ziro3d.com/products/ziro-pla-black -> ziro-pla-black
    const urlParts = productUrl.split('/products/');
    if (urlParts.length < 2) {
      console.log(`[Price] Invalid URL format: ${productUrl}`);
      return { price: null, available: false };
    }
    
    const handle = urlParts[1].split('?')[0].split('#')[0];
    const jsonUrl = `https://ziro3d.com/products/${handle}.json`;
    
    const response = await fetch(jsonUrl, {
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'FilaScope-Sync/1.0',
      },
    });
    
    if (!response.ok) {
      console.log(`[Price] Failed to fetch ${handle}: ${response.status}`);
      return { price: null, available: false };
    }
    
    const data = await response.json();
    const product = data.product;
    
    if (!product || !product.variants || product.variants.length === 0) {
      return { price: null, available: false };
    }
    
    // Get first variant price
    const variant = product.variants[0];
    const price = parseFloat(variant.price) || null;
    const available = variant.available === true;
    
    return { price, available };
  } catch (error) {
    console.log(`[Price] Error fetching price for ${productUrl}:`, error);
    return { price: null, available: false };
  }
}

// ============================================================================
// STEP 2: PROCESS SEED DATA
// ============================================================================

async function processSeedProducts(
  supabase: any,
  brandId: string | null,
  stats: SyncStats
): Promise<any[]> {
  console.log('[Step 2] Processing CSV seed data...');
  console.log(`[Step 2] Seed contains ${ZIRO_PRODUCT_SEED.length} products`);
  
  const filamentRecords: any[] = [];
  const batchSize = 10; // Fetch prices in batches to avoid rate limiting
  
  for (let i = 0; i < ZIRO_PRODUCT_SEED.length; i += batchSize) {
    const batch = ZIRO_PRODUCT_SEED.slice(i, i + batchSize);
    console.log(`[Step 2] Processing batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(ZIRO_PRODUCT_SEED.length / batchSize)}`);
    
    // Fetch prices in parallel for this batch
    const pricePromises = batch.map(seed => fetchShopifyPrice(seed.productUrl));
    const prices = await Promise.all(pricePromises);
    
    for (let j = 0; j < batch.length; j++) {
      const seed = batch[j];
      const { price, available } = prices[j];
      
      if (price !== null) {
        stats.pricesFetched++;
      } else {
        stats.pricesFailed++;
      }
      
      // Generate unique product ID from URL
      const productId = `ziro_${seed.seedMaterial.toLowerCase().replace(/[^a-z0-9]/g, '-')}_${seed.color.toLowerCase().replace(/[^a-z0-9]/g, '-')}`;
      
      // Get enrichment data
      const productLineId = getZiroProductLineId(seed.seedMaterial);
      const material = getZiroMaterialFromSeed(seed.seedMaterial);
      const finishType = getZiroFinishTypeFromSeed(seed.seedMaterial);
      const colorHex = seed.colorHex || null;
      const colorFamily = getZiroColorFamily(colorHex || '#808080', seed.color);
      const productTitle = generateZiroProductTitle(seed);
      
      // Get print settings from defaults
      const enrichment = enrichZiroProduct(seed.title, material, seed.color);
      
      const record = {
        product_id: productId,
        product_title: productTitle,
        product_handle: seed.productUrl.split('/products/')[1]?.split('?')[0] || productId,
        vendor: VENDOR_NAME,
        brand_id: brandId,
        material: material,
        finish_type: finishType,
        product_line_id: productLineId,
        color_family: colorFamily,
        color_hex: colorHex,
        variant_price: price || 24.99, // Default price if fetch fails
        variant_compare_at_price: null,
        variant_available: available,
        variant_sku: null,
        product_url: seed.productUrl,
        featured_image: seed.imageUrl,
        diameter_nominal_mm: 1.75,
        net_weight_g: 1000,
        nozzle_temp_min_c: enrichment.nozzleTempMin,
        nozzle_temp_max_c: enrichment.nozzleTempMax,
        bed_temp_min_c: enrichment.bedTempMin,
        bed_temp_max_c: enrichment.bedTempMax,
        is_nozzle_abrasive: enrichment.isAbrasive,
        high_speed_capable: enrichment.highSpeedCapable,
        tds_url: null, // Ziro doesn't provide TDS documents
        auto_created: true,
        auto_updated: true,
        last_scraped_at: new Date().toISOString(),
        sync_status: 'synced',
      };
      
      filamentRecords.push(record);
    }
    
    // Rate limiting between batches
    if (i + batchSize < ZIRO_PRODUCT_SEED.length) {
      await new Promise(resolve => setTimeout(resolve, 300));
    }
  }
  
  console.log(`[Step 2] Processed ${filamentRecords.length} products`);
  console.log(`[Step 2] Prices fetched: ${stats.pricesFetched}, failed: ${stats.pricesFailed}`);
  
  return filamentRecords;
}

// ============================================================================
// STEP 3: SAFE DELETE EXISTING PRODUCTS
// ============================================================================

async function safeDeleteExisting(supabase: any, seedCount: number): Promise<number> {
  console.log('[Step 3] Checking safe delete threshold...');
  
  if (seedCount < SAFE_DELETE_THRESHOLD) {
    console.log(`[Step 3] Seed count ${seedCount} is below threshold ${SAFE_DELETE_THRESHOLD}, skipping delete`);
    return 0;
  }
  
  console.log(`[Step 3] Seed count ${seedCount} >= threshold ${SAFE_DELETE_THRESHOLD}, proceeding with safe delete`);
  
  const { data: deleted, error } = await supabase
    .from('filaments')
    .delete()
    .eq('vendor', VENDOR_NAME)
    .select('id');
  
  if (error) {
    console.error('[Step 3] Error deleting existing products:', error);
    throw error;
  }
  
  const count = deleted?.length || 0;
  console.log(`[Step 3] Deleted ${count} existing ${VENDOR_NAME} products`);
  
  return count;
}

// ============================================================================
// STEP 4: BATCH INSERT PRODUCTS
// ============================================================================

async function batchInsertProducts(
  supabase: any,
  records: any[],
  stats: SyncStats
): Promise<void> {
  console.log('[Step 4] Batch inserting products...');
  
  const batchSize = 50;
  
  for (let i = 0; i < records.length; i += batchSize) {
    const batch = records.slice(i, i + batchSize);
    
    const { error } = await supabase
      .from('filaments')
      .insert(batch);
    
    if (error) {
      console.error(`[Step 4] Error inserting batch ${Math.floor(i / batchSize) + 1}:`, error);
      stats.errors += batch.length;
    } else {
      stats.created += batch.length;
      console.log(`[Step 4] Inserted batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(records.length / batchSize)}`);
    }
  }
  
  console.log(`[Step 4] Batch insert complete: ${stats.created} created, ${stats.errors} errors`);
}

// ============================================================================
// STEP 5: FIX DUPLICATE HEX CODES
// ============================================================================

async function fixDuplicateHexCodes(supabase: any): Promise<number> {
  console.log('[Step 5] Fixing duplicate hex codes within product lines...');
  
  try {
    const { data: duplicates, error } = await supabase.rpc('find_duplicate_hexes', {
      p_vendor: VENDOR_NAME,
    });
    
    if (error) {
      console.error('[Step 5] Error finding duplicates:', error);
      return 0;
    }
    
    if (!duplicates || duplicates.length === 0) {
      console.log('[Step 5] No duplicate hex codes found');
      return 0;
    }
    
    console.log(`[Step 5] Found ${duplicates.length} products with duplicate hex codes`);
    
    // Group by product_line_id and color_hex
    const groups = new Map<string, any[]>();
    for (const dup of duplicates as any[]) {
      const key = `${dup.product_line_id}__${dup.color_hex?.toLowerCase()}`;
      if (!groups.has(key)) {
        groups.set(key, []);
      }
      groups.get(key)!.push(dup);
    }
    
    let fixed = 0;
    for (const [, group] of groups) {
      // Skip the first one (keep original), modify the rest
      for (let i = 1; i < group.length; i++) {
        const item = group[i];
        const baseHex = item.color_hex || '#808080';
        
        // Slightly modify the hex to make it unique
        const r = parseInt(baseHex.slice(1, 3), 16);
        const g = parseInt(baseHex.slice(3, 5), 16);
        const b = parseInt(baseHex.slice(5, 7), 16);
        
        const newR = Math.min(255, Math.max(0, r + i * 2));
        const newG = Math.min(255, Math.max(0, g + i));
        const newB = Math.min(255, Math.max(0, b - i));
        
        const newHex = `#${newR.toString(16).padStart(2, '0')}${newG.toString(16).padStart(2, '0')}${newB.toString(16).padStart(2, '0')}`.toUpperCase();
        
        const { error: updateError } = await supabase
          .from('filaments')
          .update({ color_hex: newHex })
          .eq('id', item.id);
        
        if (!updateError) {
          fixed++;
        }
      }
    }
    
    console.log(`[Step 5] Fixed ${fixed} duplicate hex codes`);
    return fixed;
  } catch (error) {
    console.error('[Step 5] Error in fixDuplicateHexCodes:', error);
    return 0;
  }
}

// ============================================================================
// STEP 6: UPDATE BRAND STATS
// ============================================================================

async function updateBrandStats(supabase: any): Promise<void> {
  console.log('[Step 6] Updating automated_brands entry...');
  
  const { error } = await supabase
    .from('automated_brands')
    .update({
      platform_type: 'shopify',
      base_url: 'https://ziro3d.com',
      products_url: 'https://ziro3d.com/products.json',
      has_api: true,
      notes: `CSV-seeded sync with ${ZIRO_PRODUCT_SEED.length} products. Shopify platform with live price fetching. Specializes in multi-color gradient filaments, specialty PLA effects (Twinkling, Diamond, Chameleon), and TPU. No TDS documents available.`,
      last_scrape_at: new Date().toISOString(),
      scraping_active: false,
      product_count: ZIRO_PRODUCT_SEED.length,
      active_product_count: ZIRO_PRODUCT_SEED.length,
    })
    .eq('brand_slug', 'ziro');
  
  if (error) {
    console.error('[Step 6] Error updating brand stats:', error);
    throw error;
  }
  
  // Update product counts via RPC
  try {
    await supabase.rpc('update_brand_product_counts', { p_brand_slug: 'ziro' });
  } catch (e) {
    console.log('[Step 6] RPC update_brand_product_counts not available');
  }
  
  try {
    await supabase.rpc('update_brand_enrichment_counts', { p_brand_slug: 'ziro' });
  } catch (e) {
    console.log('[Step 6] RPC update_brand_enrichment_counts not available');
  }
  
  console.log('[Step 6] Brand stats updated');
}

// ============================================================================
// STEP 7: LOG SYNC RESULTS
// ============================================================================

async function logSyncResults(
  supabase: any,
  brandId: string | null,
  stats: SyncStats,
  duration: number,
  success: boolean,
  errorMessage?: string
): Promise<void> {
  console.log('[Step 7] Logging sync results...');
  
  try {
    await supabase
      .from('brand_sync_logs')
      .insert({
        brand_id: brandId,
        brand_slug: 'ziro',
        sync_type: 'csv_seed',
        status: success ? 'completed' : 'failed',
        started_at: new Date(Date.now() - duration).toISOString(),
        completed_at: new Date().toISOString(),
        duration_seconds: Math.round(duration / 1000),
        products_discovered: ZIRO_PRODUCT_SEED.length,
        products_created: stats.created,
        products_updated: stats.updated,
        products_failed: stats.errors,
        triggered_by: 'api',
        success_details: {
          pricesFetched: stats.pricesFetched,
          pricesFailed: stats.pricesFailed,
          seedCount: ZIRO_PRODUCT_SEED.length,
        },
        error_details: errorMessage ? { message: errorMessage } : null,
      });
    
    console.log('[Step 7] Sync log created');
  } catch (error) {
    console.error('[Step 7] Error logging sync results:', error);
  }
}

// ============================================================================
// MAIN HANDLER
// ============================================================================

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }
  
  const startTime = Date.now();
  const results: SyncResult[] = [];
  const stats: SyncStats = {
    created: 0,
    updated: 0,
    skipped: 0,
    errors: 0,
    pricesFetched: 0,
    pricesFailed: 0,
  };
  
  try {
    console.log('='.repeat(60));
    console.log('ZIRO CSV-SEEDED SYNC PIPELINE STARTED');
    console.log(`Seed contains ${ZIRO_PRODUCT_SEED.length} products`);
    console.log('='.repeat(60));
    
    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    // Parse options
    let cleanSlate = false;
    try {
      const body = await req.json();
      cleanSlate = body.cleanSlate === true;
    } catch {
      // No body or invalid JSON - default to clean slate for CSV-seeded sync
      cleanSlate = true;
    }
    
    // Get brand ID
    const { data: brand } = await supabase
      .from('automated_brands')
      .select('id')
      .eq('brand_slug', 'ziro')
      .single();
    
    const brandId = brand?.id || null;
    
    // Step 1: Validate seed data
    results.push({
      step: 'Validate Seed Data',
      success: true,
      message: `CSV seed contains ${ZIRO_PRODUCT_SEED.length} products`,
      count: ZIRO_PRODUCT_SEED.length,
    });
    
    // Step 2: Process seed products and fetch live prices
    const filamentRecords = await processSeedProducts(supabase, brandId, stats);
    results.push({
      step: 'Process Seed & Fetch Prices',
      success: true,
      message: `Processed ${filamentRecords.length} products, fetched ${stats.pricesFetched} prices`,
      count: filamentRecords.length,
      details: {
        pricesFetched: stats.pricesFetched,
        pricesFailed: stats.pricesFailed,
      },
    });
    
    // Step 3: Safe delete existing products (for CSV-seeded sync)
    if (cleanSlate) {
      const deleted = await safeDeleteExisting(supabase, ZIRO_PRODUCT_SEED.length);
      results.push({
        step: 'Safe Delete Existing',
        success: true,
        message: `Deleted ${deleted} existing products`,
        count: deleted,
      });
    }
    
    // Step 4: Batch insert products
    await batchInsertProducts(supabase, filamentRecords, stats);
    results.push({
      step: 'Batch Insert Products',
      success: stats.errors === 0,
      message: `Inserted ${stats.created} products, ${stats.errors} errors`,
      count: stats.created,
      details: {
        created: stats.created,
        errors: stats.errors,
      },
    });
    
    // Step 5: Fix duplicate hex codes
    const fixedHexes = await fixDuplicateHexCodes(supabase);
    results.push({
      step: 'Fix Duplicate Hex Codes',
      success: true,
      message: `Fixed ${fixedHexes} duplicate hex codes`,
      count: fixedHexes,
    });
    
    // Step 6: Update brand stats
    await updateBrandStats(supabase);
    results.push({
      step: 'Update Brand Stats',
      success: true,
      message: 'Brand stats and product counts updated',
    });
    
    // Step 7: Log sync results
    const duration = Date.now() - startTime;
    await logSyncResults(supabase, brandId, stats, duration, true);
    
    console.log('='.repeat(60));
    console.log('ZIRO SYNC PIPELINE COMPLETED');
    console.log(`Duration: ${(duration / 1000).toFixed(1)}s`);
    console.log(`Created: ${stats.created}, Errors: ${stats.errors}`);
    console.log('='.repeat(60));
    
    return new Response(
      JSON.stringify({
        success: true,
        vendor: VENDOR_NAME,
        seedCount: ZIRO_PRODUCT_SEED.length,
        stats,
        duration: `${(duration / 1000).toFixed(1)}s`,
        results,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    const duration = Date.now() - startTime;
    console.error('FATAL ERROR in Ziro sync:', error);
    
    // Log failure
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    if (supabaseUrl && supabaseKey) {
      const supabase = createClient(supabaseUrl, supabaseKey);
      await logSyncResults(supabase, null, stats, duration, false, String(error));
    }
    
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        stats,
        duration: `${(duration / 1000).toFixed(1)}s`,
        results,
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
