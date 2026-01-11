import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { FILLAMENTUM_FILTERED_SEED, FILLAMENTUM_SEED_COUNT, FILLAMENTUM_SEED_VERSION, getFillamentumDefaultPrice } from '../_shared/fillamentum-seed.ts';
import {
  enrichFillamentumProduct,
  getFillamentumColorHex,
  FILLAMENTUM_STORE_INFO,
  generateFillamentumProductLineId,
  normalizeFillamentumMaterial,
  FILLAMENTUM_DEFAULTS_VERSION
} from '../_shared/fillamentum-defaults.ts';
import { getColorFamily } from '../_shared/color-mapping.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface SyncStats {
  discovered: number;
  created: number;
  updated: number;
  skipped: number;
  failed: number;
  errors: string[];
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const startTime = Date.now();
  const stats: SyncStats = {
    discovered: 0,
    created: 0,
    updated: 0,
    skipped: 0,
    failed: 0,
    errors: []
  };

  try {
    const { cleanSlate = true } = await req.json().catch(() => ({}));

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    console.log('=== Fillamentum CSV-Seeded Sync Starting ===');
    console.log(`Using fillamentum-defaults version: ${FILLAMENTUM_DEFAULTS_VERSION}`);
    console.log(`Using fillamentum-seed version: ${FILLAMENTUM_SEED_VERSION}`);
    console.log(`Seed contains ${FILLAMENTUM_SEED_COUNT} products`);
    console.log(`Clean slate: ${cleanSlate}`);
    
    // Debug: Verify color mapping is working
    console.log('[DEBUG] Color mapping tests:');
    console.log(`  'deep sea transparent' => ${getFillamentumColorHex('deep sea transparent')}`);
    console.log(`  'amethyst purple' => ${getFillamentumColorHex('amethyst purple')}`);
    console.log(`  'iced coffee transparent' => ${getFillamentumColorHex('iced coffee transparent')}`);
    console.log(`  'crystal clear iceland blue' => ${getFillamentumColorHex('crystal clear iceland blue')}`);

    // Safety check: Ensure we have enough products in seed
    const SAFE_DELETE_THRESHOLD = 100;
    if (FILLAMENTUM_SEED_COUNT < SAFE_DELETE_THRESHOLD) {
      throw new Error(`Safety: Seed has only ${FILLAMENTUM_SEED_COUNT} products, expected at least ${SAFE_DELETE_THRESHOLD}`);
    }

    stats.discovered = FILLAMENTUM_SEED_COUNT;

    // =========================================================================
    // STEP 1: Clean Slate Delete
    // =========================================================================
    if (cleanSlate) {
      console.log('Step 1: Deleting existing Fillamentum products...');
      const { data: deleted, error: deleteError } = await supabase
        .from('filaments')
        .delete()
        .ilike('vendor', 'fillamentum')
        .select('id');

      if (deleteError) {
        console.error('Delete error:', deleteError);
        throw new Error(`Delete failed: ${deleteError.message}`);
      }
      console.log(`Deleted ${deleted?.length || 0} existing products`);
    }

    // =========================================================================
    // STEP 2: Process Seed Data and Insert
    // =========================================================================
    console.log('Step 2: Processing seed data...');
    const productsToInsert: any[] = [];

    for (const seedProduct of FILLAMENTUM_FILTERED_SEED) {
      try {
        // Generate unique product ID from URL
        const urlMatch = seedProduct.productUrl.match(/\/products\/([a-z0-9-]+)/i);
        const productId = urlMatch ? urlMatch[1] : seedProduct.filamentName.toLowerCase().replace(/[^a-z0-9]+/g, '-');

        // Get material info
        const materialInfo = normalizeFillamentumMaterial(seedProduct.filamentName);
        
        // Enrich product data
        const enrichment = enrichFillamentumProduct(
          seedProduct.filamentName,
          seedProduct.color,
          materialInfo.material
        );

        // ALWAYS resolve hex from color mapping at runtime (bypasses cached seed data issues)
        const colorFromSeed = seedProduct.color;
        let colorHex: string | null = null;
        
        if (colorFromSeed) {
          // Strategy 1: Direct color name lookup
          colorHex = getFillamentumColorHex(colorFromSeed);
          
          // Strategy 2: Try with material context (e.g., "PLA iceland blue")
          if (!colorHex && materialInfo.material) {
            colorHex = getFillamentumColorHex(`${materialInfo.material.toLowerCase()} ${colorFromSeed.toLowerCase()}`);
          }
          
          // Strategy 3: Try with "crystal clear" prefix for transparent products
          if (!colorHex && /crystal\s*clear/i.test(seedProduct.filamentName)) {
            colorHex = getFillamentumColorHex(`crystal clear ${colorFromSeed.toLowerCase()}`);
          }
          
          // Strategy 4: Try with "transparent" suffix
          if (!colorHex) {
            colorHex = getFillamentumColorHex(`${colorFromSeed.toLowerCase()} transparent`);
          }
        }
        
        // Debug: Log first 10 products with hex resolution trace
        if (productsToInsert.length < 10) {
          console.log(`[TRACE] "${seedProduct.filamentName}" | color: "${colorFromSeed}" => hex: ${colorHex || 'NULL'}`);
        }
        
        // Log any remaining missing hex codes
        if (colorFromSeed && !colorHex) {
          console.log(`[MISSING HEX] "${colorFromSeed}" - add to FILLAMENTUM_COLOR_MAPPING`);
        }

        // Generate product line ID
        const productLineId = generateFillamentumProductLineId(seedProduct.filamentName, enrichment.material);

        // Determine weight from title (1 KG vs 750g default)
        let weight = FILLAMENTUM_STORE_INFO.defaultWeight;
        if (/1\s*kg/i.test(seedProduct.filamentName)) {
          weight = 1000;
        }

        // Determine color family from color NAME (not hex - getColorFamily expects a name)
        const colorFamily = seedProduct.color ? getColorFamily(seedProduct.color) : null;

        // Get price from seed or default
        const variantPrice = seedProduct.priceEur || getFillamentumDefaultPrice(seedProduct.material, seedProduct.filamentName);

        const filamentData = {
          product_id: productId,
          product_title: enrichment.cleanedTitle || seedProduct.filamentName,
          vendor: FILLAMENTUM_STORE_INFO.vendor,
          material: enrichment.material,
          finish_type: enrichment.finishType,
          product_line_id: productLineId,
          color_hex: colorHex,
          color_family: colorFamily,
          product_url: seedProduct.productUrl,
          featured_image: seedProduct.imageUrl,
          variant_price: variantPrice,
          price_eur: variantPrice,
          diameter_nominal_mm: FILLAMENTUM_STORE_INFO.defaultDiameter,
          net_weight_g: weight,
          spool_material: FILLAMENTUM_STORE_INFO.spoolMaterial,
          tds_url: enrichment.tdsUrl,
          is_nozzle_abrasive: enrichment.isAbrasive,
          nozzle_temp_min_c: enrichment.printSettings?.nozzleTempMin || null,
          nozzle_temp_max_c: enrichment.printSettings?.nozzleTempMax || null,
          bed_temp_min_c: enrichment.printSettings?.bedTempMin || null,
          bed_temp_max_c: enrichment.printSettings?.bedTempMax || null,
          auto_created: true,
          auto_updated: true,
          last_scraped_at: new Date().toISOString(),
          sync_status: 'synced'
        };

        productsToInsert.push(filamentData);
      } catch (error) {
        const errMsg = error instanceof Error ? error.message : String(error);
        console.error(`Error processing ${seedProduct.filamentName}:`, errMsg);
        stats.failed++;
        stats.errors.push(`${seedProduct.filamentName}: ${errMsg}`);
      }
    }

    console.log(`Prepared ${productsToInsert.length} products for insert`);

    // =========================================================================
    // STEP 3: Batch Insert
    // =========================================================================
    console.log('Step 3: Inserting products...');
    const BATCH_SIZE = 50;
    
    for (let i = 0; i < productsToInsert.length; i += BATCH_SIZE) {
      const batch = productsToInsert.slice(i, i + BATCH_SIZE);
      const { error: insertError } = await supabase
        .from('filaments')
        .insert(batch);

      if (insertError) {
        console.error(`Batch insert error at ${i}:`, insertError);
        stats.failed += batch.length;
        stats.errors.push(`Batch ${i}: ${insertError.message}`);
      } else {
        stats.created += batch.length;
        console.log(`Inserted batch ${i}-${i + batch.length}`);
      }
    }

    // =========================================================================
    // STEP 4: Finalize
    // =========================================================================
    console.log('Step 4: Finalizing...');

    // Update brand product counts
    try {
      await supabase.rpc('update_brand_product_counts', { p_brand_slug: 'fillamentum' });
    } catch (err) {
      console.error('Error updating brand counts:', err);
    }

    // Fix duplicate hex codes
    try {
      await supabase.rpc('find_duplicate_hexes', { p_vendor: 'Fillamentum' });
    } catch (err) {
      console.error('Error fixing duplicates:', err);
    }

    // Mark brand as not actively scraping
    await supabase
      .from('automated_brands')
      .update({ 
        scraping_active: false,
        last_scrape_at: new Date().toISOString()
      })
      .eq('brand_slug', 'fillamentum');

    const duration = ((Date.now() - startTime) / 1000).toFixed(1);
    
    console.log('=== Fillamentum Sync Complete ===');
    console.log(`Duration: ${duration}s`);
    console.log(`Stats: ${JSON.stringify(stats)}`);

    return new Response(
      JSON.stringify({
        success: true,
        stats,
        duration: `${duration}s`
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    const errMsg = error instanceof Error ? error.message : String(error);
    console.error('Fatal error:', error);
    
    return new Response(
      JSON.stringify({
        success: false,
        error: errMsg,
        stats
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
