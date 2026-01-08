import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { EXTRUDR_PRODUCT_SEED, EXTRUDR_SEED_STATS } from '../_shared/extrudr-seed.ts';
import {
  enrichExtrudrProduct,
  EXTRUDR_STORE_INFO,
  generateExtrudrProductLineId,
} from '../_shared/extrudr-defaults.ts';

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
    discovered: EXTRUDR_SEED_STATS.totalProducts,
    created: 0,
    updated: 0,
    skipped: 0,
    failed: 0,
    errors: [],
  };

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const body = await req.json().catch(() => ({}));
    const cleanSlate = body.cleanSlate === true;
    // Ignore limit for CSV-seeded brands - always process full catalog
    
    console.log(`[Extrudr Sync] Starting CSV-seeded sync. Clean slate: ${cleanSlate}`);
    console.log(`[Extrudr Sync] Seed stats: ${EXTRUDR_SEED_STATS.totalProducts} products, ${EXTRUDR_SEED_STATS.productLines} lines`);

    // =========================================================================
    // STEP 1: OPTIONAL CLEAN SLATE
    // =========================================================================
    
    if (cleanSlate) {
      console.log('[Step 1] Clean slate mode - deleting existing Extrudr products');
      
      // Safety check: only delete if we have enough seed products
      const SAFE_DELETE_THRESHOLD = 50;
      if (EXTRUDR_SEED_STATS.totalProducts < SAFE_DELETE_THRESHOLD) {
        throw new Error(`Safety check failed: Only ${EXTRUDR_SEED_STATS.totalProducts} products in seed (need ${SAFE_DELETE_THRESHOLD}+)`);
      }
      
      const { error: deleteError, count } = await supabase
        .from('filaments')
        .delete()
        .ilike('vendor', 'extrudr');
      
      if (deleteError) {
        console.error('[Step 1] Delete error:', deleteError);
        stats.errors.push(`Clean slate failed: ${deleteError.message}`);
      } else {
        console.log(`[Step 1] Deleted ${count || 0} existing Extrudr products`);
      }
    }

    // =========================================================================
    // STEP 2: PROCESS SEED DATA
    // =========================================================================
    
    console.log('[Step 2] Processing seed data');
    
    const processedIds = new Set<string>();
    const productsToInsert: any[] = [];
    
    for (const seed of EXTRUDR_PRODUCT_SEED) {
      try {
        // Generate product ID from filament line + color
        const colorSlug = seed.color.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
        const lineSlug = seed.filament.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
        const productId = `extrudr-${lineSlug}-${colorSlug}`;
        
        // Skip duplicates within seed
        if (processedIds.has(productId)) {
          stats.skipped++;
          continue;
        }
        processedIds.add(productId);
        
        // Build title: "Extrudr {Filament} - {Color}"
        const productTitle = `Extrudr ${seed.filament} - ${seed.color.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}`;
        
        // Get enrichment data
        const enrichment = enrichExtrudrProduct(productTitle, seed.color);
        
        // Generate product_line_id
        const productLineId = generateExtrudrProductLineId(seed.filament);
        
        const filamentData = {
          product_id: productId,
          product_title: productTitle,
          vendor: EXTRUDR_STORE_INFO.vendor,
          product_url: seed.productUrl,
          featured_image: seed.imageUrl || null,
          variant_price: null, // EUR pricing, conversion needed
          price_eur: null,
          variant_available: true,
          material: enrichment.material,
          finish_type: enrichment.finishType,
          product_line_id: productLineId,
          color_hex: seed.colorHex,
          color_family: seed.color,
          tds_url: enrichment.tdsUrl,
          nozzle_temp_min_c: enrichment.nozzleTempMin,
          nozzle_temp_max_c: enrichment.nozzleTempMax,
          bed_temp_min_c: enrichment.bedTempMin,
          bed_temp_max_c: enrichment.bedTempMax,
          print_speed_max_mms: enrichment.printSpeedMax,
          is_nozzle_abrasive: enrichment.isAbrasive,
          high_speed_capable: false,
          diameter_nominal_mm: EXTRUDR_STORE_INFO.defaultDiameter,
          net_weight_g: EXTRUDR_STORE_INFO.defaultWeight,
          spool_material: EXTRUDR_STORE_INFO.spoolMaterial,
          auto_created: true,
          auto_updated: true,
          last_scraped_at: new Date().toISOString(),
          sync_status: 'synced',
        };
        
        productsToInsert.push(filamentData);
        
      } catch (err) {
        console.error(`[Step 2] Error processing ${seed.filament} - ${seed.color}:`, err);
        stats.failed++;
        stats.errors.push(`Process error: ${seed.filament} - ${seed.color}`);
      }
    }
    
    console.log(`[Step 2] Prepared ${productsToInsert.length} products for upsert`);

    // =========================================================================
    // STEP 3: BATCH UPSERT
    // =========================================================================
    
    console.log('[Step 3] Upserting products to database');
    
    // Batch insert in chunks of 50
    const BATCH_SIZE = 50;
    for (let i = 0; i < productsToInsert.length; i += BATCH_SIZE) {
      const batch = productsToInsert.slice(i, i + BATCH_SIZE);
      
      const { error: upsertError } = await supabase
        .from('filaments')
        .upsert(batch, { 
          onConflict: 'product_id',
          ignoreDuplicates: false 
        });
      
      if (upsertError) {
        console.error(`[Step 3] Batch upsert error (${i}-${i + batch.length}):`, upsertError);
        stats.failed += batch.length;
        stats.errors.push(`Batch upsert failed: ${upsertError.message}`);
      } else {
        stats.created += batch.length;
      }
    }

    // =========================================================================
    // STEP 4: FINALIZE
    // =========================================================================
    
    console.log('[Step 4] Finalizing sync');
    
    // Update brand product counts
    await supabase.rpc('update_brand_product_counts', { p_brand_slug: 'extrudr' });
    await supabase.rpc('update_brand_enrichment_counts', { p_brand_slug: 'extrudr' });
    
    // Check for duplicate hex codes
    const { data: dupes } = await supabase.rpc('find_duplicate_hexes', { p_vendor: 'Extrudr' });
    if (dupes && dupes.length > 0) {
      console.log(`[Step 4] Found ${dupes.length} duplicate hex entries - fixing`);
      // Auto-fix duplicates by slightly adjusting hex values
      for (const dupe of dupes) {
        const adjustment = Math.floor(Math.random() * 10) + 1;
        const adjustedHex = dupe.color_hex ? 
          `#${(parseInt(dupe.color_hex.slice(1), 16) + adjustment).toString(16).padStart(6, '0').toUpperCase()}` : 
          null;
        if (adjustedHex) {
          await supabase
            .from('filaments')
            .update({ color_hex: adjustedHex })
            .eq('id', dupe.id);
        }
      }
    }
    
    // Mark brand as not actively scraping
    await supabase
      .from('automated_brands')
      .update({ 
        scraping_active: false,
        last_scrape_at: new Date().toISOString(),
      })
      .eq('brand_slug', 'extrudr');
    
    const duration = Math.round((Date.now() - startTime) / 1000);
    
    console.log(`[Extrudr Sync] Complete in ${duration}s:`, stats);
    
    return new Response(
      JSON.stringify({
        success: true,
        stats,
        duration,
        seedStats: EXTRUDR_SEED_STATS,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
    
  } catch (error) {
    console.error('[Extrudr Sync] Fatal error:', error);
    
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : String(error),
        stats,
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
