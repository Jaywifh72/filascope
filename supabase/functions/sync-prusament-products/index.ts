/**
 * Prusament CSV-Seeded Sync Pipeline
 * 
 * Uses PRUSAMENT_PRODUCT_SEED as primary source - no Firecrawl scraping.
 * Implements Safe Delete pattern with 50-product threshold.
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import {
  PRUSAMENT_PRODUCT_SEED,
  shouldExcludePrusamentProduct,
  cleanPrusamentColorName,
} from '../_shared/prusament-seed.ts';
import {
  enrichPrusamentProduct,
  generatePrusamentProductLineId,
  normalizePrusamentMaterial,
  getPrusamentTdsUrl,
  getPrusamentColorHex,
} from '../_shared/prusament-defaults.ts';
import { getColorFamily } from '../_shared/color-mapping.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const SAFE_DELETE_THRESHOLD = 50;

interface SyncStats {
  discovered: number;
  created: number;
  updated: number;
  skipped: number;
  errors: number;
  deleted: number;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const startTime = Date.now();
  const stats: SyncStats = { discovered: 0, created: 0, updated: 0, skipped: 0, errors: 0, deleted: 0 };

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Parse options
    let cleanSlate = false;
    try {
      const body = await req.json();
      cleanSlate = body.cleanSlate === true;
    } catch { /* no body */ }

    console.log('[Prusament] Starting CSV-seeded sync...');
    console.log(`[Prusament] Seed contains ${PRUSAMENT_PRODUCT_SEED.length} products`);

    // Get brand info
    const { data: brand } = await supabase
      .from('automated_brands')
      .select('id')
      .eq('brand_slug', 'prusament')
      .maybeSingle();

    const brandId = brand?.id || null;

    // Mark brand as scraping
    await supabase
      .from('automated_brands')
      .update({ scraping_active: true, scrape_timeout_at: new Date(Date.now() + 15 * 60 * 1000).toISOString() })
      .eq('brand_slug', 'prusament');

    // Filter seed data
    const validProducts = PRUSAMENT_PRODUCT_SEED.filter(p => !shouldExcludePrusamentProduct(p));
    stats.discovered = validProducts.length;
    console.log(`[Prusament] Valid products after filtering: ${validProducts.length}`);

    // Safe Delete
    if (cleanSlate && validProducts.length >= SAFE_DELETE_THRESHOLD) {
      console.log('[Prusament] Safe delete: removing existing products...');
      const { data: deletedRows } = await supabase
        .from('filaments')
        .delete()
        .ilike('vendor', 'Prusament')
        .select('id');
      const count = deletedRows?.length || 0;
      stats.deleted = count;
      console.log(`[Prusament] Deleted ${count} existing products`);
    }

    // Batch insert
    const batchSize = 50;
    for (let i = 0; i < validProducts.length; i += batchSize) {
      const batch = validProducts.slice(i, i + batchSize);
      
      for (const product of batch) {
        try {
          const cleanColor = cleanPrusamentColorName(product.color);
          const enrichment = enrichPrusamentProduct(product.filamentName, product.material, product.colorHex);
          
          // Get color hex - prefer CSV, fallback to enrichment
          let colorHex = product.colorHex || enrichment.colorHex;
          if (!colorHex) {
            colorHex = getPrusamentColorHex(cleanColor);
          }
          
          // Generate product ID from URL
          const urlSlug = product.productUrl.split('/').filter(Boolean).pop() || '';
          const productId = `prusament-${urlSlug}`;

          const filamentRecord = {
            product_id: productId,
            product_title: product.filamentName,
            vendor: 'Prusament',
            brand_id: brandId,
            material: enrichment.material,
            finish_type: enrichment.finishType,
            product_line_id: enrichment.productLineId,
            color_hex: colorHex,
            color_family: colorHex ? getColorFamily(colorHex) : null,
            product_url: product.productUrl,
            net_weight_g: product.weightGrams,
            diameter_nominal_mm: 1.75,
            tds_url: enrichment.tdsUrl,
            nozzle_temp_min_c: enrichment.printSettings.nozzleTempMin,
            nozzle_temp_max_c: enrichment.printSettings.nozzleTempMax,
            bed_temp_min_c: enrichment.printSettings.bedTempMin,
            bed_temp_max_c: enrichment.printSettings.bedTempMax,
            fan_min_percent: enrichment.printSettings.fanMin,
            fan_max_percent: enrichment.printSettings.fanMax,
            print_speed_max_mms: enrichment.printSettings.printSpeedMax,
            drying_temp_c: enrichment.printSettings.dryingTemp,
            drying_time_hours: enrichment.printSettings.dryingTime,
            is_nozzle_abrasive: enrichment.isAbrasive,
            auto_created: true,
            auto_updated: true,
            last_scraped_at: new Date().toISOString(),
            sync_status: 'synced',
          };

          // Check if exists
          const { data: existing } = await supabase
            .from('filaments')
            .select('id')
            .eq('product_id', productId)
            .maybeSingle();

          if (existing) {
            await supabase.from('filaments').update(filamentRecord).eq('id', existing.id);
            stats.updated++;
          } else {
            await supabase.from('filaments').insert(filamentRecord);
            stats.created++;
          }
        } catch (err) {
          console.error(`[Prusament] Error processing ${product.filamentName}:`, err);
          stats.errors++;
        }
      }
    }

    // Fix duplicate hex codes
    await supabase.rpc('find_duplicate_hexes', { p_vendor: 'Prusament' });

    // Update brand stats
    await supabase.rpc('update_brand_product_counts', { p_brand_slug: 'prusament' });
    await supabase
      .from('automated_brands')
      .update({ 
        scraping_active: false, 
        scrape_timeout_at: null,
        last_scrape_at: new Date().toISOString()
      })
      .eq('brand_slug', 'prusament');

    const duration = ((Date.now() - startTime) / 1000).toFixed(1);
    console.log(`[Prusament] Sync complete in ${duration}s:`, stats);

    return new Response(JSON.stringify({
      success: true,
      vendor: 'Prusament',
      stats,
      duration: `${duration}s`,
    }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    console.error('[Prusament] Fatal error:', errorMsg);
    
    return new Response(JSON.stringify({
      success: false,
      vendor: 'Prusament',
      error: errorMsg,
      stats,
    }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
});
