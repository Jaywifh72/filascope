import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import {
  OVERTURE_SEED_DATA,
  shouldExcludeOvertureProduct,
  generateOvertureProductLineId,
  getOvertureHexFromColor,
  normalizeOvertureMaterial,
  detectOvertureFinishType,
  getOvertureDefaultPrice,
} from "../_shared/overture-seed.ts";

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
  deleted: number;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const startTime = Date.now();

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Parse options (ignore limit for CSV-seeded brands)
    let options = { cleanSlate: false };
    try {
      const body = await req.json();
      options = { ...options, ...body };
    } catch {
      // Use defaults
    }

    console.log('[Overture] Starting CSV-seeded sync...');
    console.log('[Overture] Seed data contains', OVERTURE_SEED_DATA.length, 'entries');

    // Get brand info
    const { data: brand } = await supabase
      .from('automated_brands')
      .select('id, brand_name')
      .eq('brand_slug', 'overture')
      .single();

    const brandId = brand?.id || null;
    console.log(`[Overture] Brand ID: ${brandId}`);

    // Mark as scraping
    await supabase
      .from('automated_brands')
      .update({ scraping_active: true, last_error: null })
      .eq('brand_slug', 'overture');

    const stats: SyncStats = {
      discovered: OVERTURE_SEED_DATA.length,
      created: 0,
      updated: 0,
      skipped: 0,
      errors: 0,
      deleted: 0,
    };

    // Filter seed data (exclude multi-packs, bulk, etc.)
    const filteredProducts = OVERTURE_SEED_DATA.filter(entry => {
      if (shouldExcludeOvertureProduct(entry.filamentLine, entry.color)) {
        console.log(`[Overture] Excluding: ${entry.filamentLine} - ${entry.color}`);
        stats.skipped++;
        return false;
      }
      return true;
    });

    console.log(`[Overture] After filtering: ${filteredProducts.length} products`);

    // Safe delete pattern: only delete if we have enough products
    const SAFE_DELETE_THRESHOLD = 50;
    if (filteredProducts.length >= SAFE_DELETE_THRESHOLD) {
      console.log('[Overture] Safe delete threshold met, clearing existing products...');
      const { error: deleteError, count } = await supabase
        .from('filaments')
        .delete({ count: 'exact' })
        .ilike('vendor', '%overture%');

      if (deleteError) {
        console.error('[Overture] Error deleting products:', deleteError);
      } else {
        stats.deleted = count || 0;
        console.log(`[Overture] Deleted ${stats.deleted} existing products`);
      }
    } else {
      console.warn(`[Overture] Only ${filteredProducts.length} products found, skipping delete for safety`);
    }

    // Process and insert products
    const productsToInsert = [];

    for (const entry of filteredProducts) {
      try {
        const material = normalizeOvertureMaterial(entry.material);
        const productLineId = generateOvertureProductLineId(entry.material, entry.filamentLine);
        const finishType = detectOvertureFinishType(entry.filamentLine, entry.color);
        const colorHex = entry.colorHex || getOvertureHexFromColor(entry.color);
        const price = getOvertureDefaultPrice(entry.material, entry.filamentLine);

        // Generate product ID
        const colorSlug = entry.color.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '');
        const lineSlug = entry.filamentLine.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '');
        const productId = `overture-${lineSlug}-${colorSlug}`;

        // Clean title: "Filament Line - Color"
        const cleanedTitle = `${entry.filamentLine.replace(/1\.75mm\s*/gi, '').replace(/1-pack\s*/gi, '').trim()} - ${entry.color}`;

        productsToInsert.push({
          product_id: productId,
          product_title: cleanedTitle,
          vendor: 'Overture',
          brand_id: brandId,
          material: material,
          finish_type: finishType,
          product_line_id: productLineId,
          color_family: entry.color,
          color_hex: colorHex,
          variant_price: price,
          variant_available: true,
          product_url: entry.productUrl,
          featured_image: entry.imageUrl,
          diameter_nominal_mm: 1.75,
          net_weight_g: 1000,
          is_nozzle_abrasive: entry.material.toLowerCase().includes('rock'),
          auto_created: true,
          auto_updated: true,
          last_scraped_at: new Date().toISOString(),
          sync_status: 'synced',
        });
      } catch (error) {
        console.error(`[Overture] Error processing ${entry.filamentLine} - ${entry.color}:`, error);
        stats.errors++;
      }
    }

    // Batch insert
    const BATCH_SIZE = 50;
    for (let i = 0; i < productsToInsert.length; i += BATCH_SIZE) {
      const batch = productsToInsert.slice(i, i + BATCH_SIZE);
      const { error: insertError } = await supabase
        .from('filaments')
        .insert(batch);

      if (insertError) {
        console.error(`[Overture] Batch insert error:`, insertError);
        stats.errors += batch.length;
      } else {
        stats.created += batch.length;
        console.log(`[Overture] Inserted batch ${Math.floor(i / BATCH_SIZE) + 1}: ${batch.length} products`);
      }
    }

    // Fix duplicate hex codes
    try {
      const { data: dupes } = await supabase.rpc('find_duplicate_hexes', { p_vendor: 'Overture' });
      if (dupes && dupes.length > 0) {
        console.log(`[Overture] Found ${dupes.length} duplicate hex codes, fixing...`);
        for (const dupe of dupes) {
          const variation = '#' + Math.floor(Math.random() * 16777215).toString(16).padStart(6, '0');
          await supabase.from('filaments').update({ color_hex: variation }).eq('id', dupe.id);
        }
      }
    } catch (e) {
      console.log('[Overture] Duplicate hex check skipped:', e);
    }

    // Update brand stats
    await supabase
      .from('automated_brands')
      .update({
        scraping_active: false,
        last_scrape_at: new Date().toISOString(),
        products_created: stats.created,
        products_updated: stats.updated,
        product_count: stats.created,
      })
      .eq('brand_slug', 'overture');

    const duration = ((Date.now() - startTime) / 1000).toFixed(1);

    console.log('[Overture] Sync complete:', { ...stats, duration: `${duration}s` });

    return new Response(
      JSON.stringify({
        success: true,
        vendor: 'Overture',
        stats,
        duration: `${duration}s`,
        message: `Synced ${stats.created} products from CSV seed`,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    );
  } catch (error) {
    console.error('[Overture] Sync error:', error);

    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    if (supabaseUrl && supabaseKey) {
      const supabase = createClient(supabaseUrl, supabaseKey);
      await supabase
        .from('automated_brands')
        .update({ scraping_active: false, last_error: String(error) })
        .eq('brand_slug', 'overture');
    }

    return new Response(
      JSON.stringify({ success: false, error: String(error) }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});
