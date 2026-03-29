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
    // STEP 2: Fetch Existing Products for deduplication + price backfill
    // =========================================================================
    const { data: existingProducts } = await supabase
      .from('filaments')
      .select('id, product_id, product_url, variant_price')
      .ilike('vendor', 'colorfabb');

    // Build lookup maps for deduplication and URL-based price updates
    const existingByUrl = new Map<string, { id: string; hasPrice: boolean }>();
    const existingIds = new Set((existingProducts || []).map(p => p.product_id).filter(Boolean));
    for (const p of (existingProducts || [])) {
      if (p.product_url) {
        existingByUrl.set(p.product_url, { id: p.id, hasPrice: p.variant_price != null });
      }
    }
    console.log(`[ColorFabb] Found ${existingProducts?.length || 0} existing products (${existingByUrl.size} with URLs)`);

    // =========================================================================
    // STEP 3: Process CSV Seed Data — update prices on URL matches, insert new
    // =========================================================================
    console.log(`[ColorFabb] Processing ${COLORFABB_PRODUCT_SEED.length} products from seed data...`);

    const productsToInsert: Array<Record<string, unknown>> = [];
    const priceUpdates: Array<{ id: string; price: number }> = [];
    const productsProcessed = Math.min(COLORFABB_PRODUCT_SEED.length, limit);

    for (let i = 0; i < productsProcessed; i++) {
      const seed = COLORFABB_PRODUCT_SEED[i];

      try {
        const cleanUrl = seed.productUrl.replace(/\\:/g, ':');
        const urlMatch = existingByUrl.get(cleanUrl);

        // If a product exists with this URL and has no price, update its price
        if (urlMatch && seed.priceUsd !== null && (!urlMatch.hasPrice || cleanSlate)) {
          priceUpdates.push({ id: urlMatch.id, price: seed.priceUsd });
          stats.updated++;
          continue;
        }

        // If matched by URL and already has a price, skip
        if (urlMatch && !cleanSlate) {
          stats.skipped++;
          continue;
        }

        // Generate unique product ID for insertion
        const productSlug = seed.productName.toLowerCase()
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/^-|-$/g, '');
        const productId = `colorfabb-${productSlug}-1.75mm-750g`;

        // Skip if already exists by generated ID (previously inserted by seed)
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

        productsToInsert.push({
          product_id: productId,
          product_title: cleanColorFabbTitle(seed.productName),
          vendor: COLORFABB_STORE_INFO.vendor,
          product_url: cleanUrl,
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
        });

      } catch (err) {
        console.error(`[ColorFabb] Error processing ${seed.productName}:`, err);
        stats.errors++;
        stats.errorDetails.push(`${seed.productName}: ${err instanceof Error ? err.message : 'Unknown error'}`);
      }
    }

    // =========================================================================
    // STEP 3.5: Apply URL-matched price updates (backfill prices on scraped products)
    // =========================================================================
    if (priceUpdates.length > 0) {
      console.log(`[ColorFabb] Backfilling prices on ${priceUpdates.length} URL-matched products...`);
      const chunkSize = 50;
      for (let i = 0; i < priceUpdates.length; i += chunkSize) {
        const chunk = priceUpdates.slice(i, i + chunkSize);
        for (const { id, price } of chunk) {
          const { error: updateErr } = await supabase
            .from('filaments')
            .update({ variant_price: price, auto_updated: true, last_scraped_at: new Date().toISOString() })
            .eq('id', id);
          if (updateErr) {
            console.error(`[ColorFabb] Price update error for id ${id}:`, updateErr);
            stats.errors++;
          }
        }
        console.log(`[ColorFabb] Price backfill batch ${Math.floor(i / chunkSize) + 1}: ${chunk.length} products updated`);
      }
    }

    // =========================================================================
    // STEP 4: Insert new products (seed entries with no existing URL match)
    // =========================================================================
    console.log(`[ColorFabb] Inserting ${productsToInsert.length} new products...`);

    if (productsToInsert.length > 0) {
      const chunkSize = 50;
      for (let i = 0; i < productsToInsert.length; i += chunkSize) {
        const chunk = productsToInsert.slice(i, i + chunkSize);

        const { error: insertError, data: insertData } = await supabase
          .from('filaments')
          .insert(chunk)
          .select('id');

        if (insertError) {
          console.error(`[ColorFabb] Batch insert error:`, insertError);
          stats.errors += chunk.length;
          stats.errorDetails.push(insertError.message);
        } else {
          stats.created += (insertData?.length || 0);
          console.log(`[ColorFabb] Inserted batch ${Math.floor(i / chunkSize) + 1}: ${insertData?.length || 0} products`);
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
    console.log(`[ColorFabb] Sync complete in ${duration}s - discovered: ${stats.discovered}, created: ${stats.created}, updated: ${stats.updated}, skipped: ${stats.skipped}, errors: ${stats.errors}`);

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
