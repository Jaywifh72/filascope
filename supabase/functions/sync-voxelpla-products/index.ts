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

// ============================================================================
// TYPES
// ============================================================================

interface SyncResult {
  success: boolean;
  vendor: string;
  productsCreated: number;
  productsDeleted: number;
  productsWithHex: number;
  productsWithImages: number;
  productLines: number;
  duration_seconds: number;
  errors: string[];
  syncDecisions: SyncDecision[];
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
  const errors: string[] = [];

  try {
    console.log('='.repeat(60));
    console.log('VoxelPLA CSV-Seeded Sync Pipeline Started');
    console.log(`Seed contains ${VOXELPLA_PRODUCT_SEED.length} products`);
    console.log('='.repeat(60));

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // =======================================================================
    // STEP 1: Validate seed data
    // =======================================================================
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
    console.log('\n[Step 2] Fetching brand ID...');

    const { data: brand } = await supabase
      .from('automated_brands')
      .select('id')
      .eq('brand_slug', 'voxelpla')
      .maybeSingle();

    const brandId = brand?.id || null;
    console.log(`[Step 2] Brand ID: ${brandId || 'not found'}`);

    // =======================================================================
    // STEP 3: Delete existing VoxelPLA products
    // =======================================================================
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
    // STEP 4: Transform and insert seed products
    // =======================================================================
    console.log('\n[Step 4] Transforming seed products...');

    const filamentRecords = VOXELPLA_PRODUCT_SEED.map(product => {
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

      return {
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
    });

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
    console.log('\n[Step 5] Inserting products...');

    const { error: insertError } = await supabase
      .from('filaments')
      .insert(filamentRecords);

    if (insertError) {
      throw new Error(`Insert failed: ${insertError.message}`);
    }

    console.log(`[Step 5] Inserted ${filamentRecords.length} products`);

    // =======================================================================
    // STEP 6: Update brand statistics
    // =======================================================================
    console.log('\n[Step 6] Updating brand statistics...');

    try {
      await supabase.rpc('update_brand_product_counts', { p_brand_slug: 'voxelpla' });
      await supabase.rpc('update_brand_enrichment_counts', { p_brand_slug: 'voxelpla' });
      console.log('[Step 6] Brand statistics updated');
    } catch (err) {
      console.error('[Step 6] Error updating brand stats:', err);
      errors.push(`Stats update error: ${err}`);
    }

    // =======================================================================
    // STEP 7: Calculate metrics
    // =======================================================================
    const productsWithHex = filamentRecords.filter(r => r.color_hex).length;
    const productsWithImages = filamentRecords.filter(r => r.featured_image).length;
    const productLines = [...new Set(filamentRecords.map(r => r.product_line_id))].length;

    const duration = ((Date.now() - startTime) / 1000).toFixed(2);

    console.log('\n' + '='.repeat(60));
    console.log('VoxelPLA Sync Complete');
    console.log(`Duration: ${duration}s`);
    console.log(`Products Created: ${filamentRecords.length}`);
    console.log(`Products with Hex: ${productsWithHex}/${filamentRecords.length}`);
    console.log(`Products with Images: ${productsWithImages}/${filamentRecords.length}`);
    console.log(`Product Lines: ${productLines}`);
    console.log('='.repeat(60));

    const result: SyncResult = {
      success: true,
      vendor: VENDOR_NAME,
      productsCreated: filamentRecords.length,
      productsDeleted: deletedCount,
      productsWithHex,
      productsWithImages,
      productLines,
      duration_seconds: parseFloat(duration),
      errors,
      syncDecisions,
    };

    return new Response(
      JSON.stringify(result),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (err) {
    const error = err instanceof Error ? err.message : String(err);
    console.error('VoxelPLA Sync Failed:', error);

    return new Response(
      JSON.stringify({
        success: false,
        vendor: VENDOR_NAME,
        error,
        errors: [...errors, error],
        syncDecisions,
        duration_seconds: ((Date.now() - startTime) / 1000).toFixed(2),
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
