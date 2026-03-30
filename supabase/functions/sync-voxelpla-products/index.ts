import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import {
  VOXELPLA_PRODUCT_SEED,
  VOXELPLA_COLOR_HEX_MAP,
  getVoxelPLAProductLineId,
  normalizeVoxelPLASeedMaterial,
  getVoxelPLASeedPrintSettings,
  getVoxelPLAFinishType,
  generateVoxelPLAProductId,
  getVoxelPLAColorHex,
  getVoxelPLAColorFamily,
} from '../_shared/voxelpla-seed.ts';
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

const VENDOR_NAME = 'VoxelPLA';
const BRAND_SLUG = 'voxelpla';
const SAFE_DELETE_THRESHOLD = 30;

interface SyncStats {
  productsProcessed: number;
  variantsFound: number;
  created: number;
  updated: number;
  errors: number;
}

// ============================================================================
// MAIN SYNC LOGIC (runs in background)
// ============================================================================

async function runVoxelPLASync(
  supabase: any,
  syncLogId: string | null,
  brandId: string | null
): Promise<void> {
  const startTime = Date.now();
  const totalProducts = VOXELPLA_PRODUCT_SEED.length;
  const stats: SyncStats = {
    productsProcessed: 0,
    variantsFound: totalProducts,
    created: 0,
    updated: 0,
    errors: 0,
  };
  
  // Fetch live prices from Shopify API keyed by product handle
  async function fetchLivePrices(): Promise<Map<string, number>> {
    const priceMap = new Map<string, number>();
    try {
      let page = 1;
      while (true) {
        const res = await fetch(`https://voxelpla.com/products.json?limit=250&page=${page}`, {
          headers: { 'User-Agent': 'FilaScope/1.0' },
        });
        if (!res.ok) break;
        const data = await res.json();
        if (!data.products?.length) break;
        for (const p of data.products) {
          const variant1kg = p.variants?.find((v: any) =>
            /\b1\s*kg\b|\b1000\s*g\b/i.test(v.title)
          ) || p.variants?.[0];
          if (variant1kg?.price) {
            priceMap.set(p.handle, parseFloat(variant1kg.price));
          }
        }
        if (data.products.length < 250) break;
        page++;
        await new Promise(r => setTimeout(r, 500));
      }
    } catch (err) {
      console.warn('[VoxelPLA] Failed to fetch live prices:', err);
    }
    console.log(`[VoxelPLA] Fetched live prices for ${priceMap.size} products`);
    return priceMap;
  }

  try {
    console.log('='.repeat(60));
    console.log('VoxelPLA BACKGROUND SYNC STARTED');
    console.log(`Seed contains ${totalProducts} products`);
    console.log(`Sync Log ID: ${syncLogId}`);
    console.log('='.repeat(60));

    // =======================================================================
    // STEP 1: Validate seed data
    // =======================================================================
    if (syncLogId) {
      await updateSyncProgress(supabase, syncLogId, {
        stage: 'Validating seed data...',
        current: 0,
        total: totalProducts,
        productsProcessed: 0,
        variantsFound: totalProducts,
        created: 0,
        updated: 0,
        errors: 0,
      });
    }
    console.log('\n[Step 1] Validating seed data...');
    
    if (totalProducts < SAFE_DELETE_THRESHOLD) {
      throw new Error(`Seed contains only ${totalProducts} products, below threshold of ${SAFE_DELETE_THRESHOLD}`);
    }
    
    // =======================================================================
    // STEP 2: Delete existing products
    // =======================================================================
    if (syncLogId) {
      await updateSyncProgress(supabase, syncLogId, {
        stage: 'Deleting existing products...',
        current: 0,
        total: totalProducts,
        productsProcessed: 0,
        variantsFound: totalProducts,
        created: 0,
        updated: 0,
        errors: 0,
      });
    }
    console.log('\n[Step 2] Deleting existing VoxelPLA products...');
    
    const { data: deleted, error: deleteError } = await supabase
      .from('filaments')
      .delete()
      .ilike('vendor', 'voxelpla')
      .select('id');
    
    if (deleteError) {
      throw new Error(`Delete failed: ${deleteError.message}`);
    }
    
    const deletedCount = deleted?.length || 0;
    console.log(`[Step 2] Deleted ${deletedCount} existing products`);
    
    // =======================================================================
    // STEP 2.5: Fetch live prices from Shopify API
    // =======================================================================
    console.log('\n[Step 2.5] Fetching live prices from Shopify API...');
    const livePrices = await fetchLivePrices();

    // =======================================================================
    // STEP 3: Transform seed products with progress
    // =======================================================================
    console.log('\n[Step 3] Transforming seed products...');

    const filamentRecords = [];

    for (let i = 0; i < totalProducts; i++) {
      const product = VOXELPLA_PRODUCT_SEED[i];
      stats.productsProcessed = i + 1;
      
      // Update progress every 5 products or on last product
      if (syncLogId && (i % 5 === 0 || i === totalProducts - 1)) {
        await updateSyncProgress(supabase, syncLogId, {
          stage: `Processing ${product.material}...`,
          current: i + 1,
          total: totalProducts,
          message: product.title,
          productsProcessed: i + 1,
          variantsFound: totalProducts,
          created: stats.created,
          updated: stats.updated,
          errors: stats.errors,
        });
      }
      
      const normalizedMaterial = normalizeVoxelPLASeedMaterial(product.material);
      const productLineId = getVoxelPLAProductLineId(product.material);
      const printSettings = getVoxelPLASeedPrintSettings(product.material);
      const finishType = getVoxelPLAFinishType(product.material);
      const colorHex = getVoxelPLAColorHex(product.color);
      const productId = generateVoxelPLAProductId(product.material, product.color);
      const colorFamily = getVoxelPLAColorFamily(colorHex, product.color);
      
      const variantPrice = livePrices.get(product.handle) ?? null;

      const record = {
        product_id: productId,
        product_title: product.title,
        product_handle: product.handle,
        vendor: VENDOR_NAME,
        brand_id: brandId,
        product_url: product.productUrl,
        featured_image: product.imageUrl,
        tds_url: product.tdsUrl,
        variant_price: variantPrice,
        material: normalizedMaterial,
        product_line_id: productLineId,
        finish_type: finishType,
        color_hex: colorHex,
        color_family: colorFamily,
        diameter_nominal_mm: 1.75,
        net_weight_g: 1000,
        high_speed_capable: true,
        variant_available: true,
        nozzle_temp_min_c: printSettings?.nozzle_temp_min_c || null,
        nozzle_temp_max_c: printSettings?.nozzle_temp_max_c || null,
        bed_temp_min_c: printSettings?.bed_temp_min_c || null,
        bed_temp_max_c: printSettings?.bed_temp_max_c || null,
        print_speed_max_mms: printSettings?.print_speed_max_mms || null,
        auto_created: true,
        auto_updated: true,
        last_scraped_at: new Date().toISOString(),
        sync_status: 'synced',
      };
      
      filamentRecords.push(record);
    }
    
    // Check for missing hex codes
    const missingHex = filamentRecords.filter(r => !r.color_hex);
    if (missingHex.length > 0) {
      console.warn(`[Step 3] Warning: ${missingHex.length} products missing hex codes`);
    }
    
    // =======================================================================
    // STEP 4: Batch insert
    // =======================================================================
    if (syncLogId) {
      await updateSyncProgress(supabase, syncLogId, {
        stage: 'Inserting products to database...',
        current: totalProducts,
        total: totalProducts,
        productsProcessed: totalProducts,
        variantsFound: totalProducts,
        created: 0,
        updated: 0,
        errors: 0,
      });
    }
    console.log('\n[Step 4] Inserting products...');
    
    const { error: insertError } = await supabase
      .from('filaments')
      .insert(filamentRecords);
    
    if (insertError) {
      throw new Error(`Insert failed: ${insertError.message}`);
    }
    
    stats.created = filamentRecords.length;
    console.log(`[Step 4] Inserted ${filamentRecords.length} products`);
    
    // =======================================================================
    // STEP 5: Update brand statistics
    // =======================================================================
    if (syncLogId) {
      await updateSyncProgress(supabase, syncLogId, {
        stage: 'Updating brand statistics...',
        current: totalProducts,
        total: totalProducts,
        productsProcessed: totalProducts,
        variantsFound: totalProducts,
        created: stats.created,
        updated: 0,
        errors: 0,
      });
    }
    console.log('\n[Step 5] Updating brand statistics...');
    
    try {
      await supabase.rpc('update_brand_product_counts', { p_brand_slug: BRAND_SLUG });
      await supabase.rpc('update_brand_enrichment_counts', { p_brand_slug: BRAND_SLUG });
      console.log('[Step 5] Brand statistics updated');
    } catch (err) {
      console.error('[Step 5] Error updating brand stats:', err);
      stats.errors++;
    }
    
    // Reset scraping_active flag
    if (brandId) {
      await supabase
        .from('automated_brands')
        .update({ 
          scraping_active: false,
          last_scrape_at: new Date().toISOString(),
        })
        .eq('id', brandId);
    }
    
    // =======================================================================
    // STEP 6: Complete sync log
    // =======================================================================
    const durationSeconds = Math.round((Date.now() - startTime) / 1000);
    const productLines = [...new Set(filamentRecords.map(r => r.product_line_id))].length;
    
    console.log('\n' + '='.repeat(60));
    console.log('VoxelPLA Sync Complete');
    console.log(`Duration: ${durationSeconds}s`);
    console.log(`Products Created: ${stats.created}`);
    console.log(`Product Lines: ${productLines}`);
    console.log('='.repeat(60));
    
    if (syncLogId) {
      await completeSyncLog(supabase, syncLogId, {
        status: stats.errors === 0 ? 'completed' : 'partial',
        created: stats.created,
        updated: 0,
        discovered: totalProducts,
        failed: stats.errors,
        durationSeconds,
        successDetails: {
          productLines,
          deletedCount,
        },
      });
    }
    
  } catch (error) {
    const durationSeconds = Math.round((Date.now() - startTime) / 1000);
    console.error('VoxelPLA Sync Failed:', error);
    
    if (syncLogId) {
      await completeSyncLog(supabase, syncLogId, {
        status: 'failed',
        created: stats.created,
        updated: 0,
        discovered: totalProducts,
        failed: stats.errors + 1,
        durationSeconds,
        errorDetails: { message: error instanceof Error ? error.message : String(error) },
      });
    }
    
    // Reset scraping_active flag on failure
    if (brandId) {
      await supabase
        .from('automated_brands')
        .update({ scraping_active: false })
        .eq('id', brandId);
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
    
    console.log('='.repeat(60));
    console.log('VoxelPLA CSV-Seeded Sync Pipeline Started');
    console.log(`Seed contains ${VOXELPLA_PRODUCT_SEED.length} products`);
    console.log('='.repeat(60));
    
    // Get brand ID
    const { data: brand } = await supabase
      .from('automated_brands')
      .select('id')
      .eq('brand_slug', BRAND_SLUG)
      .maybeSingle();
    
    const brandId = brand?.id || null;
    console.log(`[VoxelPLA] Brand ID: ${brandId || 'not found'}`);
    
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
    
    console.log(`[VoxelPLA] Sync log created: ${syncLogId}`);
    console.log(`[VoxelPLA] Starting background sync for ${VOXELPLA_PRODUCT_SEED.length} products`);
    
    // Run sync in background using EdgeRuntime.waitUntil
    runInBackground(
      runVoxelPLASync(supabase, syncLogId, brandId),
      BRAND_SLUG
    );
    
    // Return immediately with syncLogId for frontend polling
    return createImmediateResponse(VENDOR_NAME, syncLogId, { cleanSlate: true });
    
  } catch (error) {
    console.error('Error starting VoxelPLA sync:', error);
    
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
