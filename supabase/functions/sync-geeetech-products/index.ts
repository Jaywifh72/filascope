import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { GEEETECH_PRODUCT_SEED, getGeeetechProductLineFromMaterial, getGeeetechFinishFromMaterial, normalizeGeeetechMaterialFromSeed, getGeeetechDefaultPrice } from '../_shared/geeetech-seed.ts';
import { getGeeetechPrintSettings } from '../_shared/geeetech-defaults.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface SyncStats {
  discovered: number;
  created: number;
  updated: number;
  skipped: number;
  errors: number;
  deleted?: number;
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
    errors: 0,
  };

  try {
    const { cleanSlate = false } = await req.json().catch(() => ({}));

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    console.log(`[GEEETECH] Starting CSV-seeded sync... (${GEEETECH_PRODUCT_SEED.length} products in seed)`);

    // Mark brand as scraping
    await supabase
      .from('automated_brands')
      .update({ scraping_active: true })
      .eq('brand_slug', 'geeetech');

    // ========================================================================
    // Step 1: Clean Slate (Safe Delete Pattern)
    // ========================================================================
    const SAFE_DELETE_THRESHOLD = 100;
    
    if (cleanSlate && GEEETECH_PRODUCT_SEED.length >= SAFE_DELETE_THRESHOLD) {
      console.log('[GEEETECH] Clean slate: Deleting existing products...');
      const { data: deleted, error: deleteError } = await supabase
        .from('filaments')
        .delete()
        .eq('vendor', 'Geeetech')
        .select('id');

      if (deleteError) {
        console.error('[GEEETECH] Error deleting products:', deleteError);
      } else {
        stats.deleted = deleted?.length || 0;
        console.log(`[GEEETECH] Deleted ${stats.deleted} existing products`);
      }
    }

    stats.discovered = GEEETECH_PRODUCT_SEED.length;

    // ========================================================================
    // Step 2: Process CSV Seed Products
    // ========================================================================
    console.log('[GEEETECH] Processing CSV seed products...');

    for (const seedProduct of GEEETECH_PRODUCT_SEED) {
      try {
        // Extract product ID from URL
        const productIdMatch = seedProduct.url.match(/-p-(\d+)\.html/);
        const productId = productIdMatch ? productIdMatch[1] : null;

        if (!productId) {
          console.error(`[GEEETECH] Could not extract product ID from ${seedProduct.url}`);
          stats.errors++;
          continue;
        }

        // Get enrichment data
        const productLineId = getGeeetechProductLineFromMaterial(seedProduct.material);
        const finishType = getGeeetechFinishFromMaterial(seedProduct.material);
        const material = normalizeGeeetechMaterialFromSeed(seedProduct.material);
        const printSettings = getGeeetechPrintSettings(material, seedProduct.title);

        // Determine high-speed capability
        const isHighSpeed = seedProduct.material.toLowerCase().includes('hs-pla') || 
                           seedProduct.title.toLowerCase().includes('hs-pla') ||
                           seedProduct.title.toLowerCase().includes('high speed');

        // Get price from seed or default
        const variantPrice = seedProduct.priceUsd || getGeeetechDefaultPrice(seedProduct.material, seedProduct.title);

        // Check if product exists
        const { data: existing } = await supabase
          .from('filaments')
          .select('id, color_hex')
          .eq('product_id', productId)
        .eq('vendor', 'Geeetech')
          .maybeSingle();

        const filamentData = {
          product_id: productId,
          product_title: seedProduct.title,
          vendor: 'Geeetech',
          product_url: seedProduct.url,
          featured_image: seedProduct.imageUrl,
          material: material,
          finish_type: finishType,
          product_line_id: productLineId,
          color_hex: seedProduct.hexCode || existing?.color_hex || null,
          color_family: seedProduct.color,
          variant_price: variantPrice,
          nozzle_temp_min_c: printSettings?.nozzle_temp_min_c || null,
          nozzle_temp_max_c: printSettings?.nozzle_temp_max_c || null,
          bed_temp_min_c: printSettings?.bed_temp_min_c || null,
          bed_temp_max_c: printSettings?.bed_temp_max_c || null,
          print_speed_max_mms: isHighSpeed ? 300 : (printSettings?.print_speed_max_mms || null),
          high_speed_capable: isHighSpeed,
          is_nozzle_abrasive: seedProduct.material.toLowerCase().includes('carbon fiber'),
          diameter_nominal_mm: 1.75,
          net_weight_g: seedProduct.title.includes('0.5kg') ? 500 : 1000,
          variant_available: true,
          tds_url: null, // GEEETECH doesn't publish TDS
          auto_created: !existing,
          auto_updated: true,
          last_scraped_at: new Date().toISOString(),
          sync_status: 'synced',
        };

        if (existing) {
          const { error: updateError } = await supabase
            .from('filaments')
            .update(filamentData)
            .eq('id', existing.id);

          if (updateError) {
            console.error(`[GEEETECH] Error updating ${productId}:`, updateError);
            stats.errors++;
          } else {
            stats.updated++;
          }
        } else {
          const { error: insertError } = await supabase
            .from('filaments')
            .insert(filamentData);

          if (insertError) {
            console.error(`[GEEETECH] Error inserting ${productId}:`, insertError);
            stats.errors++;
          } else {
            stats.created++;
          }
        }
      } catch (error) {
        console.error(`[GEEETECH] Error processing product:`, error);
        stats.errors++;
      }
    }

    // ========================================================================
    // Step 3: Finalize
    // ========================================================================
    console.log('[GEEETECH] Finalizing sync...');

    // Update brand product counts
    await supabase.rpc('update_brand_product_counts', { p_brand_slug: 'geeetech' });

    // Mark brand as not scraping
    await supabase
      .from('automated_brands')
      .update({
        scraping_active: false,
        last_scrape_at: new Date().toISOString(),
      })
      .eq('brand_slug', 'geeetech');

    const duration = Math.round((Date.now() - startTime) / 1000);

    console.log('[GEEETECH] Sync complete:', {
      ...stats,
      duration: `${duration}s`,
    });

    return new Response(
      JSON.stringify({
        success: true,
        stats,
        duration: `${duration}s`,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('[GEEETECH] Sync error:', error);

    // Mark brand as not scraping on error
    try {
      const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
      const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
      const supabase = createClient(supabaseUrl, supabaseKey);

      await supabase
        .from('automated_brands')
        .update({ scraping_active: false })
        .eq('brand_slug', 'geeetech');
    } catch (e) {
      console.error('[GEEETECH] Error resetting scraping_active:', e);
    }

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
