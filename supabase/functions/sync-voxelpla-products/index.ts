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
} from '../_shared/voxelpla-seed.ts';
import {
  buildFieldCoverage,
  createProductResult,
  type SyncProductResult,
} from '../_shared/sync-response-builder.ts';

// ============================================================================
// TYPES
// ============================================================================

interface SyncProgress {
  stage: string;
  current: number;
  total: number;
  message?: string;
  productsProcessed?: number;
  variantsFound?: number;
  created?: number;
  updated?: number;
  errors?: number;
  currentProduct?: string;
}

interface SyncDecision {
  type: string;
  product: string;
  decision: string;
  details?: string;
}

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const VENDOR_NAME = 'VoxelPLA';
const SAFE_DELETE_THRESHOLD = 30;

// ============================================================================
// MAIN HANDLER
// ============================================================================

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const startTime = Date.now();
  const syncDecisions: SyncDecision[] = [];
  const productResults: SyncProductResult[] = [];
  const errors: string[] = [];

  // Initialize Supabase client
  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  const supabase = createClient(supabaseUrl, supabaseKey);

  let syncLogId: string | null = null;
  let stats = {
    productsProcessed: 0,
    variantsFound: VOXELPLA_PRODUCT_SEED.length,
    created: 0,
    updated: 0,
    errors: 0,
  };

  // Helper to update progress in the sync log
  const updateProgress = async (stage: string, current: number, total: number, currentProduct?: string) => {
    if (!syncLogId) return;
    
    const progress: SyncProgress = {
      stage,
      current,
      total,
      productsProcessed: stats.productsProcessed,
      variantsFound: stats.variantsFound,
      created: stats.created,
      updated: stats.updated,
      errors: stats.errors,
      currentProduct,
    };

    try {
      await supabase
        .from('brand_sync_logs')
        .update({ products_processed: progress as unknown as Record<string, unknown> })
        .eq('id', syncLogId);
    } catch (err) {
      console.error('Error updating progress:', err);
    }
  };

  try {
    console.log('='.repeat(60));
    console.log('VoxelPLA CSV-Seeded Sync Pipeline Started');
    console.log(`Seed contains ${VOXELPLA_PRODUCT_SEED.length} products`);
    console.log('='.repeat(60));

    // =======================================================================
    // STEP 0: Create sync log entry for progress tracking
    // =======================================================================
    console.log('\n[Step 0] Creating sync log entry...');

    const { data: syncLog, error: logError } = await supabase
      .from('brand_sync_logs')
      .insert({
        brand_slug: 'voxelpla',
        status: 'running',
        sync_type: 'clean_slate',
        started_at: new Date().toISOString(),
        products_discovered: VOXELPLA_PRODUCT_SEED.length,
      })
      .select('id')
      .single();

    if (logError) {
      console.error('Failed to create sync log:', logError);
    } else {
      syncLogId = syncLog.id;
      console.log(`[Step 0] Sync log created: ${syncLogId}`);
    }

    // =======================================================================
    // STEP 1: Validate seed data
    // =======================================================================
    await updateProgress('Validating seed data...', 0, 6);
    console.log('\n[Step 1] Validating seed data...');
    
    if (VOXELPLA_PRODUCT_SEED.length < SAFE_DELETE_THRESHOLD) {
      throw new Error(`Seed contains only ${VOXELPLA_PRODUCT_SEED.length} products, below safe threshold of ${SAFE_DELETE_THRESHOLD}`);
    }

    syncDecisions.push({
      type: 'validation',
      product: 'SEED',
      decision: 'VALID',
      details: `${VOXELPLA_PRODUCT_SEED.length} products in seed, exceeds threshold of ${SAFE_DELETE_THRESHOLD}`,
    });

    // Count by material
    const materialCounts = VOXELPLA_PRODUCT_SEED.reduce((acc, p) => {
      acc[p.material] = (acc[p.material] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    console.log('[Step 1] Material distribution:', materialCounts);

    // =======================================================================
    // STEP 2: Get brand ID
    // =======================================================================
    await updateProgress('Fetching brand information...', 1, 6);
    console.log('\n[Step 2] Fetching brand ID...');

    const { data: brand } = await supabase
      .from('automated_brands')
      .select('id')
      .eq('brand_slug', 'voxelpla')
      .maybeSingle();

    const brandId = brand?.id || null;
    console.log(`[Step 2] Brand ID: ${brandId || 'not found'}`);

    // Mark brand as actively syncing
    if (brandId) {
      await supabase
        .from('automated_brands')
        .update({ scraping_active: true })
        .eq('id', brandId);
    }

    // =======================================================================
    // STEP 3: Delete existing VoxelPLA products
    // =======================================================================
    await updateProgress('Deleting existing products...', 2, 6);
    console.log('\n[Step 3] Deleting existing VoxelPLA products...');

    const { data: deleted, error: deleteError } = await supabase
      .from('filaments')
      .delete()
      .ilike('vendor', 'voxelpla')
      .select('id');

    if (deleteError) {
      throw new Error(`Delete failed: ${deleteError.message}`);
    }

    const deletedCount = deleted?.length || 0;
    console.log(`[Step 3] Deleted ${deletedCount} existing products`);

    syncDecisions.push({
      type: 'delete',
      product: 'ALL',
      decision: 'DELETED',
      details: `Removed ${deletedCount} existing products for clean slate`,
    });

    // =======================================================================
    // STEP 4: Transform and insert seed products with progress
    // =======================================================================
    await updateProgress('Processing products...', 3, 6);
    console.log('\n[Step 4] Transforming seed products...');

    const filamentRecords = [];
    const totalProducts = VOXELPLA_PRODUCT_SEED.length;

    for (let i = 0; i < VOXELPLA_PRODUCT_SEED.length; i++) {
      const product = VOXELPLA_PRODUCT_SEED[i];
      stats.productsProcessed = i + 1;

      // Update progress every 5 products or on last product
      if (i % 5 === 0 || i === totalProducts - 1) {
        await updateProgress(
          `Processing ${product.material}...`,
          3,
          6,
          product.title
        );
      }

      const normalizedMaterial = normalizeVoxelPLASeedMaterial(product.material);
      const productLineId = getVoxelPLAProductLineId(product.material);
      const printSettings = getVoxelPLASeedPrintSettings(product.material);
      const finishType = getVoxelPLAFinishType(product.material);
      const colorHex = getVoxelPLAColorHex(product.color);
      const productId = generateVoxelPLAProductId(product.material, product.color);

      syncDecisions.push({
        type: 'transform',
        product: product.title,
        decision: 'MAPPED',
        details: `material=${normalizedMaterial}, line=${productLineId}, hex=${colorHex || 'MISSING'}`,
      });

      const record = {
        product_id: productId,
        product_title: product.title,
        product_handle: product.handle,
        vendor: VENDOR_NAME,
        brand_id: brandId,
        product_url: product.productUrl,
        featured_image: product.imageUrl,
        tds_url: product.tdsUrl,
        material: normalizedMaterial,
        product_line_id: productLineId,
        finish_type: finishType,
        color_hex: colorHex,
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

      // Track product result
      productResults.push(createProductResult(
        productId,
        product.title,
        'created',
        {
          featured_image: record.featured_image,
          variant_price: null, // VoxelPLA doesn't have prices in seed
          tds_url: record.tds_url,
          color_hex: record.color_hex,
          mpn: null,
          nozzle_temp_min_c: record.nozzle_temp_min_c,
        }
      ));
    }

    // Check for missing hex codes
    const missingHex = filamentRecords.filter(r => !r.color_hex);
    if (missingHex.length > 0) {
      console.warn(`[Step 4] Warning: ${missingHex.length} products missing hex codes`);
      missingHex.forEach(p => {
        syncDecisions.push({
          type: 'hex_lookup',
          product: p.product_title,
          decision: 'MISSING',
          details: 'No hex code found in VOXELPLA_COLOR_HEX_MAP',
        });
      });
    }

    // =======================================================================
    // STEP 5: Batch insert
    // =======================================================================
    await updateProgress('Inserting products to database...', 4, 6);
    console.log('\n[Step 5] Inserting products...');

    const { error: insertError } = await supabase
      .from('filaments')
      .insert(filamentRecords);

    if (insertError) {
      throw new Error(`Insert failed: ${insertError.message}`);
    }

    stats.created = filamentRecords.length;
    console.log(`[Step 5] Inserted ${filamentRecords.length} products`);

    // =======================================================================
    // STEP 6: Update brand statistics
    // =======================================================================
    await updateProgress('Updating brand statistics...', 5, 6);
    console.log('\n[Step 6] Updating brand statistics...');

    try {
      await supabase.rpc('update_brand_product_counts', { p_brand_slug: 'voxelpla' });
      await supabase.rpc('update_brand_enrichment_counts', { p_brand_slug: 'voxelpla' });
      console.log('[Step 6] Brand statistics updated');
    } catch (err) {
      console.error('[Step 6] Error updating brand stats:', err);
      errors.push(`Stats update error: ${err}`);
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
    // STEP 7: Build field coverage and final response
    // =======================================================================
    await updateProgress('Calculating field coverage...', 6, 6);
    console.log('\n[Step 7] Building field coverage...');

    const fieldCoverage = await buildFieldCoverage(supabase, VENDOR_NAME);
    const productLines = [...new Set(filamentRecords.map(r => r.product_line_id))].length;
    const duration_ms = Date.now() - startTime;
    const duration_seconds = (duration_ms / 1000).toFixed(2);

    console.log('\n' + '='.repeat(60));
    console.log('VoxelPLA Sync Complete');
    console.log(`Duration: ${duration_seconds}s`);
    console.log(`Products Created: ${stats.created}`);
    console.log(`Field Coverage: images=${fieldCoverage.images.percent}%, colors=${fieldCoverage.colors.percent}%`);
    console.log(`Product Lines: ${productLines}`);
    console.log('='.repeat(60));

    // Update sync log as completed
    if (syncLogId) {
      await supabase
        .from('brand_sync_logs')
        .update({
          status: 'completed',
          completed_at: new Date().toISOString(),
          products_created: stats.created,
          products_updated: 0,
          products_failed: stats.errors,
          duration_seconds: parseFloat(duration_seconds),
          products_processed: {
            stage: 'Complete',
            current: 6,
            total: 6,
            productsProcessed: stats.productsProcessed,
            variantsFound: stats.variantsFound,
            created: stats.created,
            updated: 0,
            errors: stats.errors,
          } as unknown as Record<string, unknown>,
        })
        .eq('id', syncLogId);
    }

    // Build standardized response matching BrandSyncResult format
    const response = {
      success: true,
      jobId: syncLogId,
      brandSlug: 'voxelpla',
      platform: 'shopify',
      dryRun: false,
      summary: {
        totalDiscovered: VOXELPLA_PRODUCT_SEED.length,
        created: stats.created,
        updated: 0,
        skipped: 0,
        errors: stats.errors,
      },
      products: productResults,
      fieldCoverage,
      duration_ms,
      startedAt: new Date(startTime).toISOString(),
      completedAt: new Date().toISOString(),
      // Additional VoxelPLA-specific data
      vendor: VENDOR_NAME,
      productsDeleted: deletedCount,
      productLines,
      syncDecisions,
    };

    return new Response(
      JSON.stringify(response),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (err) {
    const error = err instanceof Error ? err.message : String(err);
    console.error('VoxelPLA Sync Failed:', error);

    // Update sync log as failed
    if (syncLogId) {
      await supabase
        .from('brand_sync_logs')
        .update({
          status: 'failed',
          completed_at: new Date().toISOString(),
          error_details: { error },
          products_processed: {
            stage: 'Failed',
            current: 0,
            total: 6,
            productsProcessed: stats.productsProcessed,
            created: stats.created,
            errors: stats.errors + 1,
          } as unknown as Record<string, unknown>,
        })
        .eq('id', syncLogId);
    }

    return new Response(
      JSON.stringify({
        success: false,
        vendor: VENDOR_NAME,
        error,
        errors: [...errors, error],
        syncDecisions,
        summary: {
          totalDiscovered: VOXELPLA_PRODUCT_SEED.length,
          created: stats.created,
          updated: 0,
          skipped: 0,
          errors: stats.errors + 1,
        },
        duration_ms: Date.now() - startTime,
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
