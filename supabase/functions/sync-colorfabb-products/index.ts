import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import {
  enrichColorFabbProduct,
  cleanColorFabbTitle,
  getColorFabbColorHex,
  COLORFABB_STORE_INFO,
  COLORFABB_PRODUCT_SEED,
} from '../_shared/colorfabb-defaults.ts';

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
  errorDetails: string[];
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
    errorDetails: [],
  };

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const body = await req.json().catch(() => ({}));
    const { cleanSlate = false, limit = 500 } = body;

    console.log(`[ColorFabb] Starting sync - cleanSlate: ${cleanSlate}, limit: ${limit}, seed products: ${COLORFABB_PRODUCT_SEED.length}`);

    // =========================================================================
    // STEP 1: Optional Clean Slate
    // =========================================================================
    if (cleanSlate) {
      console.log('[ColorFabb] Clean slate mode - deleting existing products...');
      const { error: deleteError } = await supabase
        .from('filaments')
        .delete()
        .ilike('vendor', 'colorfabb');
      
      if (deleteError) {
        console.error('[ColorFabb] Delete error:', deleteError);
      } else {
        console.log('[ColorFabb] Deleted existing products');
      }
    }

    // =========================================================================
    // STEP 2: Fetch Existing Products for deduplication
    // =========================================================================
    const { data: existingProducts } = await supabase
      .from('filaments')
      .select('id, product_id, product_url')
      .ilike('vendor', 'colorfabb');

    const existingUrls = new Set((existingProducts || []).map(p => p.product_url).filter(Boolean));
    const existingIds = new Set((existingProducts || []).map(p => p.product_id).filter(Boolean));
    console.log(`[ColorFabb] Found ${existingProducts?.length || 0} existing products`);

    // =========================================================================
    // STEP 3: Process CSV Seed Data
    // =========================================================================
    console.log(`[ColorFabb] Processing ${COLORFABB_PRODUCT_SEED.length} products from seed data...`);

    const productsToUpsert: Array<Record<string, unknown>> = [];
    const productsProcessed = Math.min(COLORFABB_PRODUCT_SEED.length, limit);

    for (let i = 0; i < productsProcessed; i++) {
      const seed = COLORFABB_PRODUCT_SEED[i];
      
      try {
        // Generate unique product ID
        const slug = seed.productName.toLowerCase()
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/^-|-$/g, '');
        const productId = `colorfabb-${slug}-1.75mm-750g`;

        // Skip if already exists (in non-cleanSlate mode)
        if (!cleanSlate && existingIds.has(productId)) {
          stats.skipped++;
          continue;
        }

        stats.discovered++;

        // Enrich with material, finish type, product line ID, etc.
        const enriched = enrichColorFabbProduct(seed.productName, seed.color);

        // Clean up image URL (remove escaping artifacts)
        let imageUrl = seed.imageUrl;
        if (imageUrl) {
          imageUrl = imageUrl.replace(/\\_/g, '_').replace(/\\:/g, ':');
        }

        const filamentData = {
          product_id: productId,
          product_title: cleanColorFabbTitle(seed.productName),
          vendor: COLORFABB_STORE_INFO.vendor,
          product_url: seed.productUrl.replace(/\\:/g, ':'),
          variant_price: seed.priceUsd,
          featured_image: imageUrl,
          material: enriched.material,
          finish_type: enriched.finishType,
          product_line_id: enriched.productLineId,
          tds_url: enriched.tdsUrl,
          color_hex: enriched.colorHex || getColorFabbColorHex(seed.color),
          color_family: seed.color,
          nozzle_temp_min_c: enriched.nozzleTempMin,
          nozzle_temp_max_c: enriched.nozzleTempMax,
          bed_temp_min_c: enriched.bedTempMin,
          bed_temp_max_c: enriched.bedTempMax,
          print_speed_max_mms: enriched.printSpeedMax,
          is_nozzle_abrasive: enriched.isAbrasive,
          diameter_nominal_mm: COLORFABB_STORE_INFO.defaultDiameter,
          net_weight_g: COLORFABB_STORE_INFO.defaultWeight,
          high_speed_capable: enriched.highSpeedCapable,
          variant_sku: seed.sku,
          auto_created: true,
          auto_updated: true,
          last_scraped_at: new Date().toISOString(),
          sync_status: 'synced',
        };

        productsToUpsert.push(filamentData);

      } catch (err) {
        console.error(`[ColorFabb] Error processing ${seed.productName}:`, err);
        stats.errors++;
        stats.errorDetails.push(`${seed.productName}: ${err instanceof Error ? err.message : 'Unknown error'}`);
      }
    }

    // =========================================================================
    // STEP 4: Batch Upsert Products
    // =========================================================================
    console.log(`[ColorFabb] Upserting ${productsToUpsert.length} products...`);

    if (productsToUpsert.length > 0) {
      // Batch upsert in chunks of 50
      const chunkSize = 50;
      for (let i = 0; i < productsToUpsert.length; i += chunkSize) {
        const chunk = productsToUpsert.slice(i, i + chunkSize);
        
        const { error: upsertError, data: upsertData } = await supabase
          .from('filaments')
          .upsert(chunk, { onConflict: 'product_id' })
          .select('id');

        if (upsertError) {
          console.error(`[ColorFabb] Batch upsert error:`, upsertError);
          stats.errors += chunk.length;
        } else {
          stats.created += (upsertData?.length || 0);
          console.log(`[ColorFabb] Upserted batch ${Math.floor(i / chunkSize) + 1}: ${upsertData?.length || 0} products`);
        }
      }
    }

    // =========================================================================
    // STEP 5: Update automated_brands
    // =========================================================================
    await supabase
      .from('automated_brands')
      .update({
        last_scrape_at: new Date().toISOString(),
        scraping_active: false,
      })
      .eq('brand_slug', 'colorfabb');

    // Trigger product count update
    try {
      await supabase.rpc('update_brand_product_counts', { p_brand_slug: 'colorfabb' });
      await supabase.rpc('update_brand_enrichment_counts', { p_brand_slug: 'colorfabb' });
    } catch (rpcErr) {
      console.log('[ColorFabb] RPC update warning:', rpcErr);
    }

    // =========================================================================
    // STEP 6: Fix duplicate hex codes
    // =========================================================================
    try {
      const { data: duplicates } = await supabase.rpc('find_duplicate_hexes', { p_vendor: 'ColorFabb' });
      if (duplicates && duplicates.length > 0) {
        console.log(`[ColorFabb] Found ${duplicates.length} duplicate hex entries, fixing...`);
        const seen = new Map<string, number>();
        for (const dup of duplicates) {
          const key = `${dup.product_line_id}-${dup.color_hex?.toLowerCase()}`;
          const count = seen.get(key) || 0;
          if (count > 0) {
            const newHex = dup.color_hex?.replace(/^#/, '') || 'FFFFFF';
            const adjusted = `#${newHex.slice(0, 4)}${(parseInt(newHex.slice(4, 6), 16) + count) % 256}`.padEnd(7, '0');
            await supabase.from('filaments').update({ color_hex: adjusted }).eq('id', dup.id);
          }
          seen.set(key, count + 1);
        }
      }
    } catch (dupErr) {
      console.log('[ColorFabb] Duplicate fix warning:', dupErr);
    }

    const duration = ((Date.now() - startTime) / 1000).toFixed(1);
    console.log(`[ColorFabb] Sync complete in ${duration}s - discovered: ${stats.discovered}, created: ${stats.created}, skipped: ${stats.skipped}, errors: ${stats.errors}`);

    return new Response(
      JSON.stringify({
        success: true,
        vendor: 'ColorFabb',
        duration: `${duration}s`,
        stats,
        seedProducts: COLORFABB_PRODUCT_SEED.length,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('[ColorFabb] Fatal error:', error);
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
