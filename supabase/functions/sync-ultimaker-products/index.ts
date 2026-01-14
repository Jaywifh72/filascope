import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import {
  ULTIMAKER_PRODUCT_SEED,
  getUltimakerColorHexFromSeed,
  getNormalizedUltimakerMaterial,
  getUltimakerMaterialPrice,
  generateUltimakerProductLineIdFromSeed,
  generateUltimakerProductId,
  getUltimakerColorFamily,
} from '../_shared/ultimaker-seed.ts';
import {
  getUltimakerTdsUrl,
  getUltimakerPrintSettings,
  extractUltimakerFinishType,
  getUltimakerDefaultImage,
} from '../_shared/ultimaker-defaults.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const VENDOR_NAME = 'Ultimaker';
const SAFE_DELETE_THRESHOLD = 30;

interface SyncResult {
  success: boolean;
  productsDiscovered: number;
  productsCreated: number;
  productsUpdated: number;
  productsFailed: number;
  errors: string[];
  details: Record<string, any>;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const startTime = Date.now();
  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  const supabase = createClient(supabaseUrl, supabaseKey);

  const result: SyncResult = {
    success: false,
    productsDiscovered: ULTIMAKER_PRODUCT_SEED.length,
    productsCreated: 0,
    productsUpdated: 0,
    productsFailed: 0,
    errors: [],
    details: {},
  };

  try {
    console.log(`[Ultimaker Sync] Starting CSV-seeded sync with ${ULTIMAKER_PRODUCT_SEED.length} products`);

    // =========================================================================
    // STEP 1: Validate seed data meets safe delete threshold
    // =========================================================================
    if (ULTIMAKER_PRODUCT_SEED.length < SAFE_DELETE_THRESHOLD) {
      throw new Error(`Seed has only ${ULTIMAKER_PRODUCT_SEED.length} products, below safe threshold of ${SAFE_DELETE_THRESHOLD}`);
    }

    // =========================================================================
    // STEP 2: Delete existing Ultimaker products (clean slate)
    // =========================================================================
    console.log('[Ultimaker Sync] Step 2: Deleting existing Ultimaker products...');
    const { error: deleteError } = await supabase
      .from('filaments')
      .delete()
      .ilike('vendor', 'ultimaker');

    if (deleteError) {
      console.error('[Ultimaker Sync] Delete error:', deleteError);
      result.errors.push(`Delete failed: ${deleteError.message}`);
    } else {
      console.log('[Ultimaker Sync] Deleted existing Ultimaker products');
    }

    // =========================================================================
    // STEP 3: Transform seed products and insert
    // =========================================================================
    console.log('[Ultimaker Sync] Step 3: Inserting products from seed...');

    const filamentRecords = ULTIMAKER_PRODUCT_SEED.map(product => {
      const productId = generateUltimakerProductId(product);
      const productLineId = generateUltimakerProductLineIdFromSeed(product.series, product.material);
      const normalizedMaterial = getNormalizedUltimakerMaterial(product.material);
      const colorHex = getUltimakerColorHexFromSeed(product.color);
      const colorFamily = getUltimakerColorFamily(product.color);
      const tdsUrl = getUltimakerTdsUrl(normalizedMaterial);
      const settings = getUltimakerPrintSettings(normalizedMaterial);
      const price = getUltimakerMaterialPrice(normalizedMaterial);
      const finishType = extractUltimakerFinishType(product.color);
      const imageUrl = getUltimakerDefaultImage(normalizedMaterial);
      
      const fullTitle = `UltiMaker ${product.series} ${product.material} - ${product.color}`;

      return {
        product_id: productId,
        product_title: fullTitle,
        vendor: VENDOR_NAME,
        material: normalizedMaterial,
        finish_type: finishType,
        product_line_id: productLineId,
        product_url: product.productUrl,
        tds_url: tdsUrl,
        featured_image: imageUrl,
        color_hex: colorHex,
        color_family: colorFamily,
        variant_price: price,
        nozzle_temp_min_c: settings?.nozzleTempMin || null,
        nozzle_temp_max_c: settings?.nozzleTempMax || null,
        bed_temp_min_c: settings?.bedTempMin || null,
        bed_temp_max_c: settings?.bedTempMax || null,
        print_speed_max_mms: settings?.printSpeedMax || null,
        is_nozzle_abrasive: settings?.isAbrasive || false,
        diameter_nominal_mm: 2.85,
        net_weight_g: product.weight || 750,
        auto_created: true,
        auto_updated: true,
        last_scraped_at: new Date().toISOString(),
        sync_status: 'synced',
      };
    });

    // Batch insert all products
    const { error: insertError } = await supabase
      .from('filaments')
      .insert(filamentRecords);

    if (insertError) {
      console.error('[Ultimaker Sync] Batch insert error:', insertError);
      result.errors.push(`Batch insert failed: ${insertError.message}`);
      result.productsFailed = filamentRecords.length;
    } else {
      result.productsCreated = filamentRecords.length;
      console.log(`[Ultimaker Sync] Inserted ${filamentRecords.length} products`);
    }

    // =========================================================================
    // STEP 4: Update brand statistics
    // =========================================================================
    console.log('[Ultimaker Sync] Step 4: Updating brand statistics...');
    try {
      await supabase.rpc('update_brand_product_counts', { p_brand_slug: 'ultimaker' });
      await supabase.rpc('update_brand_enrichment_counts', { p_brand_slug: 'ultimaker' });
    } catch (statsError) {
      console.error('[Ultimaker Sync] Stats update error:', statsError);
    }

    // =========================================================================
    // COMPLETE
    // =========================================================================
    const duration = ((Date.now() - startTime) / 1000).toFixed(2);
    result.success = result.productsFailed === 0;
    result.details.durationSeconds = parseFloat(duration);
    result.details.seriesCounts = {
      'S-Series': ULTIMAKER_PRODUCT_SEED.filter(p => p.series === 'S-Series').length,
      'Method': ULTIMAKER_PRODUCT_SEED.filter(p => p.series === 'Method').length,
      'Factor': ULTIMAKER_PRODUCT_SEED.filter(p => p.series === 'Factor').length,
    };

    console.log(`[Ultimaker Sync] Complete in ${duration}s:`, {
      discovered: result.productsDiscovered,
      created: result.productsCreated,
      failed: result.productsFailed,
    });

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('[Ultimaker Sync] Fatal error:', error);
    result.errors.push(`Fatal error: ${error instanceof Error ? error.message : String(error)}`);
    result.details.durationSeconds = ((Date.now() - startTime) / 1000);

    return new Response(JSON.stringify(result), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
