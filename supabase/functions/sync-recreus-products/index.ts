/**
 * RECREUS SYNC FUNCTION (CSV-Seeded Architecture)
 * Spanish TPU specialist - FilaFlex series with Shore hardness variants
 */
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import {
  RECREUS_PRODUCT_SEED,
  getRecreusColorHex,
  getRecreusDefaultPrice,
  shouldExcludeRecreusProduct,
  RECREUS_PRODUCT_LINE_COUNT,
  getRecreusProductLineImage,
} from '../_shared/recreus-seed.ts';
import {
  enrichRecreousProduct,
  matchRecreousTds,
} from '../_shared/recreus-defaults.ts';
import { getColorFamily } from '../_shared/color-mapping.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const SAFE_DELETE_THRESHOLD = 40;

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const startTime = Date.now();
  console.log('[RECREUS] ═══════════════════════════════════════════════════════');
  console.log('[RECREUS] 🚀 CSV-SEEDED SYNC STARTED');

  const errors: string[] = [];
  let productsCreated = 0;
  let productsSkipped = 0;
  let productsFailed = 0;

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Auth check (skip for service_role/orchestrator calls)
    const authHeader = req.headers.get('Authorization');
    const body = await req.json().catch(() => ({}));
    const triggeredBy = body?.triggeredBy;
    const isServiceRole = authHeader?.includes(Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')?.slice(-20) || '___');
    
    if (!isServiceRole && triggeredBy !== 'orchestrator') {
      if (!authHeader) {
        return new Response(JSON.stringify({ error: 'Authorization required' }), {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      const authClient = createClient(supabaseUrl, Deno.env.get('SUPABASE_ANON_KEY')!, {
        global: { headers: { Authorization: authHeader } },
      });

      const { data: { user } } = await authClient.auth.getUser();
      if (!user) {
        return new Response(JSON.stringify({ error: 'Invalid auth' }), {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      const { data: isAdmin } = await supabase.rpc('has_role', { _user_id: user.id, _role: 'admin' });
      if (!isAdmin) {
        return new Response(JSON.stringify({ error: 'Admin required' }), {
          status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    }

    const cleanSlate = body?.cleanSlate ?? false;

    console.log(`[RECREUS] CSV seed: ${RECREUS_PRODUCT_SEED.length} products, ${RECREUS_PRODUCT_LINE_COUNT} lines`);

    // Safe delete
    if (cleanSlate && RECREUS_PRODUCT_SEED.length >= SAFE_DELETE_THRESHOLD) {
      console.log('[RECREUS] Safe delete triggered');
      await supabase.from('filaments').delete().ilike('vendor', 'recreus');
    }

    // Prepare batch
    const filamentRows: any[] = [];
    const productLineIds = new Set<string>();

    for (const seed of RECREUS_PRODUCT_SEED) {
      if (shouldExcludeRecreusProduct(seed.filamentName)) {
        productsSkipped++;
        continue;
      }

      try {
        const enrichment = enrichRecreousProduct(seed.filamentName, seed.color, seed.material);
        const tdsUrl = matchRecreousTds(seed.filamentName);
        const price = getRecreusDefaultPrice(seed.material);
        const colorFamily = getColorFamily(seed.color);
        const productId = `recreus-${seed.material.toLowerCase()}-${seed.color.toLowerCase().replace(/\s+/g, '-')}`;
        const featuredImage = getRecreusProductLineImage(seed.productLineId);

        filamentRows.push({
          vendor: 'Recreus',
          product_title: `${seed.filamentName} - ${seed.color}`,
          product_id: productId,
          product_line_id: seed.productLineId,
          product_url: seed.productUrl,
          color_family: colorFamily,
          color_hex: seed.colorHex,
          material: seed.material,
          tds_url: tdsUrl || enrichment.tdsUrl,
          variant_price: price,
          net_weight_g: 500,
          diameter_nominal_mm: 1.75,
          shore_hardness_d: seed.shoreHardness ? parseInt(seed.shoreHardness.replace(/[^0-9]/g, '')) : null,
          nozzle_temp_min_c: enrichment.nozzleTempMin,
          nozzle_temp_max_c: enrichment.nozzleTempMax,
          bed_temp_min_c: enrichment.bedTempMin,
          bed_temp_max_c: enrichment.bedTempMax,
          print_speed_max_mms: enrichment.printSpeedMax,
          is_nozzle_abrasive: enrichment.isAbrasive,
          finish_type: enrichment.finishType,
          featured_image: featuredImage,
          auto_created: true,
          auto_updated: true,
          sync_status: 'synced',
          last_scraped_at: new Date().toISOString(),
        });
        productLineIds.add(seed.productLineId);
      } catch (error) {
        errors.push(`${seed.filamentName}: ${error instanceof Error ? error.message : 'Error'}`);
        productsFailed++;
      }
    }

    // Batch upsert (insert or update if exists)
    const batchSize = 50;
    for (let i = 0; i < filamentRows.length; i += batchSize) {
      const batch = filamentRows.slice(i, i + batchSize);
      const { error: insertError, data } = await supabase
        .from('filaments')
        .upsert(batch, {
          onConflict: 'product_id',
          ignoreDuplicates: false
        })
        .select('id');
      if (insertError) {
        errors.push(`Batch ${i / batchSize + 1}: ${insertError.message}`);
        productsFailed += batch.length;
      } else {
        // Count actual created vs updated
        const insertedCount = data?.filter((row: any) => row.created_at === row.updated_at).length || batch.length;
        const updatedCount = (data?.length || batch.length) - insertedCount;
        productsCreated += insertedCount;
        // We don't track productsUpdated separately in this seed-based sync
      }
    }

    // Fix duplicate hexes
    try {
      await supabase.rpc('find_duplicate_hexes', { vendor_filter: 'Recreus' });
    } catch { /* ok */ }

    // Update brand
    await supabase.from('automated_brands').update({
      last_scrape_at: new Date().toISOString(),
      product_count: productsCreated,
      active_product_count: productsCreated,
    }).eq('brand_slug', 'recreus');

    const duration = Math.round((Date.now() - startTime) / 1000);
    console.log(`[RECREUS] ✅ COMPLETE: ${productsCreated} created, ${productLineIds.size} lines, ${duration}s`);

    return new Response(JSON.stringify({
      success: productsFailed === 0,
      productsDiscovered: RECREUS_PRODUCT_SEED.length,
      productsCreated,
      productsUpdated: 0,
      productsSkipped,
      productsFailed,
      productLines: productLineIds.size,
      duration,
      errors,
    }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

  } catch (error) {
    console.error('[RECREUS] Fatal:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
});
