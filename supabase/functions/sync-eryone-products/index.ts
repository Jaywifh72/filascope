import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import {
  ERYONE_PRODUCT_SEED,
  ERYONE_DEFAULT_PRICES,
  enrichEryoneProduct,
  generateEryoneProductLineId,
  cleanEryoneTitle,
} from '../_shared/eryone-defaults.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface SyncOptions {
  cleanSlate?: boolean;
  limit?: number;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  const supabase = createClient(supabaseUrl, supabaseKey);

  const options: SyncOptions = await req.json().catch(() => ({}));
  const { cleanSlate = true, limit } = options;

  const result = {
    success: true,
    message: '',
    stats: {
      productsDiscovered: ERYONE_PRODUCT_SEED.length,
      productsCreated: 0,
      productsUpdated: 0,
      productsFailed: 0,
      duplicateHexesFixed: 0,
    },
    errors: [] as string[],
  };

  try {
    console.log(`[Eryone Sync] Starting CSV-seeded sync with ${ERYONE_PRODUCT_SEED.length} products`);

    // Get brand ID
    const { data: brand } = await supabase
      .from('automated_brands')
      .select('id')
      .eq('brand_slug', 'eryone')
      .single();

    const brandId = brand?.id || null;

    // Step 1: Process seed into product records
    const seedToProcess = limit ? ERYONE_PRODUCT_SEED.slice(0, limit) : ERYONE_PRODUCT_SEED;
    const productsToInsert: any[] = [];

    for (const seed of seedToProcess) {
      try {
        const enrichment = enrichEryoneProduct(seed.filamentLine, seed.material);
        const productLineId = generateEryoneProductLineId(seed.filamentLine, seed.material);
        const cleanedTitle = cleanEryoneTitle(seed.filamentLine);
        
        // Create unique product ID from URL
        const urlMatch = seed.productUrl.match(/variant=(\d+)/);
        const variantId = urlMatch ? urlMatch[1] : seed.productUrl.split('/').pop()?.replace(/[^\w-]/g, '');
        const productId = `eryone-${variantId || seed.color.toLowerCase().replace(/\s+/g, '-')}`;

        // Get default price
        const defaultPrice = ERYONE_DEFAULT_PRICES[seed.filamentLine] || 22.99;

        // Ensure hex has # prefix
        const colorHex = seed.colorHex ? (seed.colorHex.startsWith('#') ? seed.colorHex : `#${seed.colorHex}`) : null;

        productsToInsert.push({
          product_id: productId,
          product_title: `${cleanedTitle} - ${seed.color}`,
          vendor: 'Eryone',
          brand_id: brandId,
          product_url: seed.productUrl.replace(/\\:/g, ':'),
          featured_image: seed.imageUrl.replace(/\\:/g, ':'),
          variant_price: defaultPrice,
          variant_available: true,
          material: seed.material,
          finish_type: enrichment.finishType !== 'Standard' ? enrichment.finishType : null,
          color_hex: colorHex,
          color_family: seed.color,
          nozzle_temp_min_c: enrichment.nozzleTempMin,
          nozzle_temp_max_c: enrichment.nozzleTempMax,
          bed_temp_min_c: enrichment.bedTempMin,
          bed_temp_max_c: enrichment.bedTempMax,
          print_speed_max_mms: enrichment.printSpeedMax,
          is_nozzle_abrasive: enrichment.isAbrasive || null,
          product_line_id: productLineId,
          tds_url: enrichment.tdsUrl,
          high_speed_capable: enrichment.isHighSpeed || null,
          diameter_nominal_mm: 1.75,
          auto_created: true,
          auto_updated: true,
          last_scraped_at: new Date().toISOString(),
          sync_status: 'synced',
        });
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : String(err);
        console.error(`[Eryone] Error processing seed: ${seed.color}`, errorMsg);
        result.errors.push(`Seed ${seed.color}: ${errorMsg}`);
        result.stats.productsFailed++;
      }
    }

    // Debug logging for troubleshooting
    const uniqueMaterials = [...new Set(productsToInsert.map(p => p.material))];
    console.log(`[Eryone Sync] Prepared ${productsToInsert.length} products for insertion`);
    console.log(`[Eryone Sync] Unique materials (${uniqueMaterials.length}): ${uniqueMaterials.join(', ')}`);
    console.log(`[Eryone Sync] Failed during processing: ${result.stats.productsFailed}`);

    // Step 2: Safe delete pattern - only delete if we have valid products
    // Lowered threshold from 200 to 100 since CSV has 356 products
    if (cleanSlate && productsToInsert.length >= 100) {
      console.log(`[Eryone Sync] Clean slate: Deleting existing Eryone products (have ${productsToInsert.length} to insert)...`);
      const { error: deleteError, count } = await supabase
        .from('filaments')
        .delete()
        .eq('vendor', 'Eryone');

      if (deleteError) {
        console.error('[Eryone Sync] Delete error:', deleteError.message);
        result.errors.push(`Delete failed: ${deleteError.message}`);
      } else {
        console.log(`[Eryone Sync] Deleted ${count || 'all'} existing products`);
      }
    }

    // Step 3: Insert in batches (delete already cleared existing products)
    const batchSize = 50;
    for (let i = 0; i < productsToInsert.length; i += batchSize) {
      const batch = productsToInsert.slice(i, i + batchSize);
      const { error } = await supabase.from('filaments').insert(batch);

      if (error) {
        console.error(`[Eryone Sync] Batch insert error at ${i}:`, error.message);
        result.errors.push(`Batch ${i}: ${error.message}`);
        result.stats.productsFailed += batch.length;
      } else {
        result.stats.productsCreated += batch.length;
        console.log(`[Eryone Sync] Inserted batch ${i}-${i + batch.length}`);
      }
    }

    // Step 4: Update brand sync status
    if (brandId) {
      await supabase
        .from('automated_brands')
        .update({
          last_scrape_at: new Date().toISOString(),
          products_created: result.stats.productsCreated,
          last_error: result.errors.length > 0 ? result.errors[0] : null,
        })
        .eq('id', brandId);
    }

    // Step 5: Fix duplicate hex codes
    const { data: duplicates } = await supabase.rpc('find_duplicate_hexes', { p_vendor: 'Eryone' });
    
    if (duplicates && duplicates.length > 0) {
      const grouped: Record<string, typeof duplicates> = {};
      for (const dup of duplicates) {
        const key = dup.product_line_id;
        if (!grouped[key]) grouped[key] = [];
        grouped[key].push(dup);
      }

      for (const [, products] of Object.entries(grouped)) {
        for (let i = 1; i < products.length; i++) {
          const product = products[i];
          const baseHex = product.color_hex?.replace('#', '') || 'CCCCCC';
          const variation = Math.min(255, parseInt(baseHex.slice(0, 2), 16) + i * 3).toString(16).padStart(2, '0');
          const newHex = `#${variation}${baseHex.slice(2)}`;

          await supabase.from('filaments').update({ color_hex: newHex }).eq('id', product.id);
          result.stats.duplicateHexesFixed++;
        }
      }
    }

    result.message = `Eryone CSV sync complete. Created: ${result.stats.productsCreated}, Failed: ${result.stats.productsFailed}, Hex fixes: ${result.stats.duplicateHexesFixed}`;
    console.log('[Eryone Sync]', result.message);

  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    console.error('[Eryone Sync] Fatal error:', errorMsg);
    result.success = false;
    result.message = `Sync failed: ${errorMsg}`;
    result.errors.push(errorMsg);
  }

  return new Response(JSON.stringify(result), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    status: result.success ? 200 : 500,
  });
});
