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
import {
  createSyncLog,
  updateSyncProgress,
  completeSyncLog,
  createImmediateResponse,
  runInBackground,
  corsHeaders,
} from '../_shared/background-sync.ts';

// ============================================================================
// CONSTANTS
// ============================================================================

const VENDOR_NAME = 'Ziro';
const BRAND_SLUG = 'ziro';
const SAFE_DELETE_THRESHOLD = 200;

interface SyncStats {
  created: number;
  updated: number;
  skipped: number;
  errors: number;
  pricesFetched: number;
  pricesFailed: number;
}

// ============================================================================
// STEP 1: FETCH LIVE PRICE FROM SHOPIFY
// ============================================================================

async function fetchShopifyPrice(productUrl: string): Promise<{ price: number | null; available: boolean }> {
  try {
    const urlParts = productUrl.split('/products/');
    if (urlParts.length < 2) {
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
      return { price: null, available: false };
    }
    
    const data = await response.json();
    const product = data.product;
    
    if (!product || !product.variants || product.variants.length === 0) {
      return { price: null, available: false };
    }
    
    const variant = product.variants[0];
    const price = parseFloat(variant.price) || null;
    const available = variant.available === true;
    
    return { price, available };
  } catch (error) {
    return { price: null, available: false };
  }
}

// ============================================================================
// STEP 2: PROCESS SEED DATA WITH PROGRESS
// ============================================================================

async function processSeedProducts(
  supabase: any,
  brandId: string | null,
  stats: SyncStats,
  syncLogId: string | null
): Promise<any[]> {
  console.log('[Step 2] Processing CSV seed data...');
  console.log(`[Step 2] Seed contains ${ZIRO_PRODUCT_SEED.length} products`);
  
  const filamentRecords: any[] = [];
  const batchSize = 10;
  const totalProducts = ZIRO_PRODUCT_SEED.length;
  
  for (let i = 0; i < totalProducts; i += batchSize) {
    const batch = ZIRO_PRODUCT_SEED.slice(i, i + batchSize);
    const batchNum = Math.floor(i / batchSize) + 1;
    const totalBatches = Math.ceil(totalProducts / batchSize);
    
    console.log(`[Step 2] Processing batch ${batchNum}/${totalBatches}`);
    
    // Update progress for UI
    if (syncLogId) {
      await updateSyncProgress(supabase, syncLogId, {
        stage: `Fetching prices (batch ${batchNum}/${totalBatches})`,
        current: i,
        total: totalProducts,
        productsProcessed: i,
        variantsFound: totalProducts,
        created: stats.created,
        updated: stats.updated,
        errors: stats.errors,
      });
    }
    
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
      
      const productId = `ziro_${seed.seedMaterial.toLowerCase().replace(/[^a-z0-9]/g, '-')}_${seed.color.toLowerCase().replace(/[^a-z0-9]/g, '-')}`;
      const productLineId = getZiroProductLineId(seed.seedMaterial);
      const material = getZiroMaterialFromSeed(seed.seedMaterial);
      const finishType = getZiroFinishTypeFromSeed(seed.seedMaterial);
      const colorHex = seed.colorHex || null;
      const colorFamily = getZiroColorFamily(colorHex || '#808080', seed.color);
      const productTitle = generateZiroProductTitle(seed);
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
        variant_price: price || 24.99,
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
        tds_url: null,
        auto_created: true,
        auto_updated: true,
        last_scraped_at: new Date().toISOString(),
        sync_status: 'synced',
      };
      
      filamentRecords.push(record);
    }
    
    // Rate limiting between batches
    if (i + batchSize < totalProducts) {
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
// STEP 4: BATCH INSERT PRODUCTS WITH PROGRESS
// ============================================================================

async function batchInsertProducts(
  supabase: any,
  records: any[],
  stats: SyncStats,
  syncLogId: string | null
): Promise<void> {
  console.log('[Step 4] Batch inserting products...');
  
  const batchSize = 50;
  const totalProducts = records.length;
  
  for (let i = 0; i < totalProducts; i += batchSize) {
    const batch = records.slice(i, i + batchSize);
    const batchNum = Math.floor(i / batchSize) + 1;
    const totalBatches = Math.ceil(totalProducts / batchSize);
    
    // Update progress for UI
    if (syncLogId) {
      await updateSyncProgress(supabase, syncLogId, {
        stage: `Inserting to database (batch ${batchNum}/${totalBatches})`,
        current: i + batch.length,
        total: totalProducts,
        productsProcessed: i + batch.length,
        variantsFound: totalProducts,
        created: stats.created,
        updated: stats.updated,
        errors: stats.errors,
      });
    }
    
    const { error } = await supabase
      .from('filaments')
      .insert(batch);
    
    if (error) {
      console.error(`[Step 4] Error inserting batch ${batchNum}:`, error);
      stats.errors += batch.length;
    } else {
      stats.created += batch.length;
      console.log(`[Step 4] Inserted batch ${batchNum}/${totalBatches}`);
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
      for (let i = 1; i < group.length; i++) {
        const item = group[i];
        const baseHex = item.color_hex || '#808080';
        
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
      notes: `CSV-seeded sync with ${ZIRO_PRODUCT_SEED.length} products. Shopify platform with live price fetching.`,
      last_scrape_at: new Date().toISOString(),
      scraping_active: false,
      product_count: ZIRO_PRODUCT_SEED.length,
      active_product_count: ZIRO_PRODUCT_SEED.length,
    })
    .eq('brand_slug', BRAND_SLUG);
  
  if (error) {
    console.error('[Step 6] Error updating brand stats:', error);
    throw error;
  }
  
  try {
    await supabase.rpc('update_brand_product_counts', { p_brand_slug: BRAND_SLUG });
  } catch (e) {
    console.log('[Step 6] RPC update_brand_product_counts not available');
  }
  
  try {
    await supabase.rpc('update_brand_enrichment_counts', { p_brand_slug: BRAND_SLUG });
  } catch (e) {
    console.log('[Step 6] RPC update_brand_enrichment_counts not available');
  }
  
  console.log('[Step 6] Brand stats updated');
}

// ============================================================================
// MAIN SYNC LOGIC (runs in background)
// ============================================================================

async function runZiroSync(
  supabase: any,
  syncLogId: string | null,
  brandId: string | null,
  cleanSlate: boolean
): Promise<void> {
  const startTime = Date.now();
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
    console.log('ZIRO BACKGROUND SYNC STARTED');
    console.log(`Seed contains ${ZIRO_PRODUCT_SEED.length} products`);
    console.log(`Sync Log ID: ${syncLogId}`);
    console.log('='.repeat(60));
    
    // Initial progress update
    if (syncLogId) {
      await updateSyncProgress(supabase, syncLogId, {
        stage: 'Starting sync...',
        current: 0,
        total: ZIRO_PRODUCT_SEED.length,
        productsProcessed: 0,
        variantsFound: ZIRO_PRODUCT_SEED.length,
        created: 0,
        updated: 0,
        errors: 0,
      });
    }
    
    // Step 2: Process seed products and fetch live prices
    const filamentRecords = await processSeedProducts(supabase, brandId, stats, syncLogId);
    
    // Step 3: Safe delete existing products
    if (cleanSlate) {
      if (syncLogId) {
        await updateSyncProgress(supabase, syncLogId, {
          stage: 'Deleting existing products...',
          current: 0,
          total: ZIRO_PRODUCT_SEED.length,
          productsProcessed: ZIRO_PRODUCT_SEED.length,
          variantsFound: ZIRO_PRODUCT_SEED.length,
          created: 0,
          updated: 0,
          errors: 0,
        });
      }
      await safeDeleteExisting(supabase, ZIRO_PRODUCT_SEED.length);
    }
    
    // Step 4: Batch insert products
    await batchInsertProducts(supabase, filamentRecords, stats, syncLogId);
    
    // Step 5: Fix duplicate hex codes
    if (syncLogId) {
      await updateSyncProgress(supabase, syncLogId, {
        stage: 'Fixing duplicate hex codes...',
        current: ZIRO_PRODUCT_SEED.length,
        total: ZIRO_PRODUCT_SEED.length,
        productsProcessed: ZIRO_PRODUCT_SEED.length,
        variantsFound: ZIRO_PRODUCT_SEED.length,
        created: stats.created,
        updated: stats.updated,
        errors: stats.errors,
      });
    }
    await fixDuplicateHexCodes(supabase);
    
    // Step 6: Update brand stats
    if (syncLogId) {
      await updateSyncProgress(supabase, syncLogId, {
        stage: 'Updating brand statistics...',
        current: ZIRO_PRODUCT_SEED.length,
        total: ZIRO_PRODUCT_SEED.length,
        productsProcessed: ZIRO_PRODUCT_SEED.length,
        variantsFound: ZIRO_PRODUCT_SEED.length,
        created: stats.created,
        updated: stats.updated,
        errors: stats.errors,
      });
    }
    await updateBrandStats(supabase);
    
    // Complete sync log
    const durationSeconds = Math.round((Date.now() - startTime) / 1000);
    if (syncLogId) {
      await completeSyncLog(supabase, syncLogId, {
        status: stats.errors === 0 ? 'completed' : 'partial',
        created: stats.created,
        updated: stats.updated,
        discovered: ZIRO_PRODUCT_SEED.length,
        failed: stats.errors,
        durationSeconds,
        successDetails: {
          pricesFetched: stats.pricesFetched,
          pricesFailed: stats.pricesFailed,
        },
      });
    }
    
    console.log('='.repeat(60));
    console.log('ZIRO SYNC COMPLETED');
    console.log(`Duration: ${durationSeconds}s`);
    console.log(`Created: ${stats.created}, Errors: ${stats.errors}`);
    console.log('='.repeat(60));
    
  } catch (error) {
    const durationSeconds = Math.round((Date.now() - startTime) / 1000);
    console.error('FATAL ERROR in Ziro sync:', error);
    
    if (syncLogId) {
      await completeSyncLog(supabase, syncLogId, {
        status: 'failed',
        created: stats.created,
        updated: stats.updated,
        discovered: ZIRO_PRODUCT_SEED.length,
        failed: stats.errors + 1,
        durationSeconds,
        errorDetails: { message: error instanceof Error ? error.message : String(error) },
      });
    }
  }
}

// ============================================================================
// MAIN HANDLER - Returns immediately with syncLogId
// ============================================================================

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }
  
  try {
    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    // Parse options
    let cleanSlate = true; // Default to clean slate for CSV-seeded sync
    try {
      const body = await req.json();
      cleanSlate = body.cleanSlate !== false;
    } catch {
      // No body or invalid JSON
    }
    
    // Get brand ID
    const { data: brand } = await supabase
      .from('automated_brands')
      .select('id')
      .eq('brand_slug', BRAND_SLUG)
      .single();
    
    const brandId = brand?.id || null;
    
    // Mark brand as actively syncing
    if (brandId) {
      await supabase
        .from('automated_brands')
        .update({ scraping_active: true })
        .eq('id', brandId);
    }
    
    // Create sync log FIRST for progress tracking
    const { syncLogId, error: logError } = await createSyncLog(
      supabase,
      BRAND_SLUG,
      'clean_slate'
    );
    
    if (logError) {
      console.error('Failed to create sync log:', logError);
    }
    
    console.log(`[Ziro] Sync log created: ${syncLogId}`);
    console.log(`[Ziro] Starting background sync for ${ZIRO_PRODUCT_SEED.length} products`);
    
    // Run sync in background using EdgeRuntime.waitUntil
    runInBackground(
      runZiroSync(supabase, syncLogId, brandId, cleanSlate),
      BRAND_SLUG
    );
    
    // Return immediately with syncLogId for frontend polling
    return createImmediateResponse(VENDOR_NAME, syncLogId, { cleanSlate });
    
  } catch (error) {
    console.error('Error starting Ziro sync:', error);
    
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
