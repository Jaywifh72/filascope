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

// Compute a hash of the external data fields to detect content changes
function computeHash(variantPrice: number, variantAvailable: boolean): string {
  const availability = variantAvailable ? 'in_stock' : 'out_of_stock';
  const data = `${variantPrice}|${availability}|${variantAvailable}`;
  // Simple deterministic hash using SubtleCrypto
  let hash = 0;
  for (let i = 0; i < data.length; i++) {
    const char = data.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  return Math.abs(hash).toString(16).padStart(8, '0');
}

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
    // Deployment verification - log first/last product to detect stale bundles
    console.log(`[Eryone Sync] CSV seed first product: ${ERYONE_PRODUCT_SEED[0]?.color}`);
    console.log(`[Eryone Sync] CSV seed last product: ${ERYONE_PRODUCT_SEED[ERYONE_PRODUCT_SEED.length - 1]?.color}`);

    // Log detailed material breakdown to verify full CSV seed is loaded
    const materialBreakdown: Record<string, number> = {};
    for (const seed of ERYONE_PRODUCT_SEED) {
      materialBreakdown[seed.material] = (materialBreakdown[seed.material] || 0) + 1;
    }
    console.log(`[Eryone Sync] Material breakdown (${Object.keys(materialBreakdown).length} unique):`, JSON.stringify(materialBreakdown));

    // Get brand ID
    const { data: brand } = await supabase
      .from('automated_brands')
      .select('id')
      .eq('brand_slug', 'eryone')
      .single();

    const brandId = brand?.id || null;

    // Fetch live prices from Shopify API keyed by variant ID
    const variantPriceMap = new Map<string, number>();
    try {
      let page = 1;
      while (true) {
        const res = await fetch(
          `https://eryone3d.com/products.json?limit=250&page=${page}`,
          { headers: { 'User-Agent': 'FilaScope-Sync/1.0' } }
        );
        if (!res.ok) { console.warn(`[Eryone] Shopify returned ${res.status}`); break; }
        const data = await res.json();
        const products: any[] = data.products || [];
        if (products.length === 0) break;
        for (const p of products) {
          for (const v of p.variants || []) {
            if (v.price) variantPriceMap.set(String(v.id), parseFloat(v.price));
          }
        }
        if (products.length < 250) break;
        page++;
        await new Promise(r => setTimeout(r, 500));
      }
      console.log(`[Eryone] Fetched prices for ${variantPriceMap.size} variants`);
    } catch (err) {
      console.warn('[Eryone] Price fetch failed — will use default prices:', err);
    }

    // Step 1: Process seed into product records
    // For CSV-seeded brands, ignore limit - process entire curated seed
    // The seed is already a finite list, no need to artificially limit
    const seedToProcess = ERYONE_PRODUCT_SEED;
    console.log(`[Eryone Sync] Processing full CSV seed (ignoring limit parameter)`);
    const productsToInsert: any[] = [];

    for (const seed of seedToProcess) {
      try {
        const enrichment = enrichEryoneProduct(seed.filamentLine, seed.material);
        const productLineId = generateEryoneProductLineId(seed.filamentLine, seed.material);
        const cleanedTitle = cleanEryoneTitle(seed.filamentLine);
        
        // Create unique product ID from URL
        const variantIdFromUrl = seed.productUrl.match(/variant=(\d+)/)?.[1];
        const variantId = variantIdFromUrl ?? seed.productUrl.split('/').pop()?.replace(/[^\w-]/g, '');
        const productId = `eryone-${variantId || seed.color.toLowerCase().replace(/\s+/g, '-')}`;

        // Get live price by variant ID, fall back to hardcoded defaults
        const defaultPrice = (variantIdFromUrl && variantPriceMap.get(variantIdFromUrl))
          || ERYONE_DEFAULT_PRICES[seed.filamentLine] || 22.99;

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
          external_data_hash: computeHash(defaultPrice, true),
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

    // Warn if we're processing fewer products than expected (indicates stale deployment)
    const expectedMinProducts = 300;
    if (productsToInsert.length < expectedMinProducts) {
      console.warn(`[Eryone Sync] WARNING: Only prepared ${productsToInsert.length} products, expected ${expectedMinProducts}+. May indicate stale deployment.`);
    }

    // Step 2: Safe delete pattern - only delete if we have valid products
    // Threshold set to 50 to allow deletion even with partial syncs, preventing duplicate key errors
    if (cleanSlate && productsToInsert.length >= 50) {
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

    // Step 3: Insert in batches with conflict handling for HTTP 409 (composite-key violations)
    const batchSize = 50;
    for (let i = 0; i < productsToInsert.length; i += batchSize) {
      const batch = productsToInsert.slice(i, i + batchSize);

      try {
        const { error } = await supabase.from('filaments').insert(batch);

        if (error) {
          // Check if this is an HTTP 409 conflict from the partial unique index
          // filaments_vendor_title_price_color_uniq: (vendor, product_title, variant_price, color_family)
          if (error.status === 409) {
            console.warn(`[Eryone Sync] 409 conflict on batch ${i} — falling back to individual upserts`);

            for (const row of batch) {
              try {
                // Look up existing row by the unique 4-tuple
                const { data: existingRows, error: selectErr } = await supabase
                  .from('filaments')
                  .select('id')
                  .eq('vendor', row.vendor)
                  .eq('product_title', row.product_title)
                  .eq('variant_price', row.variant_price)
                  .eq('color_family', row.color_family)
                  .maybeSingle();

                if (selectErr) {
                  console.error(`[Eryone Sync] SELECT error for "${row.product_title}":`, selectErr.message);
                  result.errors.push(`SELECT ${row.product_title}: ${selectErr.message}`);
                  result.stats.productsFailed++;
                  continue;
                }

                if (existingRows) {
                  // Update the existing row with fresh data + new hash
                  const { error: updateErr } = await supabase
                    .from('filaments')
                    .update({
                      product_id: row.product_id,
                      product_url: row.product_url,
                      featured_image: row.featured_image,
                      variant_available: row.variant_available,
                      material: row.material,
                      finish_type: row.finish_type,
                      color_hex: row.color_hex,
                      nozzle_temp_min_c: row.nozzle_temp_min_c,
                      nozzle_temp_max_c: row.nozzle_temp_max_c,
                      bed_temp_min_c: row.bed_temp_min_c,
                      bed_temp_max_c: row.bed_temp_max_c,
                      print_speed_max_mms: row.print_speed_max_mms,
                      is_nozzle_abrasive: row.is_nozzle_abrasive,
                      product_line_id: row.product_line_id,
                      tds_url: row.tds_url,
                      high_speed_capable: row.high_speed_capable,
                      diameter_nominal_mm: row.diameter_nominal_mm,
                      auto_updated: true,
                      last_scraped_at: row.last_scraped_at,
                      sync_status: row.sync_status,
                      external_data_hash: computeHash(row.variant_price, row.variant_available),
                    })
                    .eq('id', existingRows.id);

                  if (updateErr) {
                    console.error(`[Eryone Sync] UPDATE error for "${row.product_title}":`, updateErr.message);
                    result.errors.push(`UPDATE ${row.product_title}: ${updateErr.message}`);
                    result.stats.productsFailed++;
                  } else {
                    result.stats.productsUpdated++;
                  }
                } else {
                  // No existing row found for this 4-tuple — re-raise (shouldn't happen)
                  console.error(`[Eryone Sync] 409 conflict but no existing row found for "${row.product_title}" — ${row.vendor} / ${row.variant_price} / ${row.color_family}`);
                  result.errors.push(`Conflict without existing row: ${row.product_title}`);
                  result.stats.productsFailed++;
                }
              } catch (rowErr) {
                const errMsg = rowErr instanceof Error ? rowErr.message : String(rowErr);
                console.error(`[Eryone Sync] Row-level error for "${row.product_title}":`, errMsg);
                result.errors.push(`Row ${row.product_title}: ${errMsg}`);
                result.stats.productsFailed++;
              }
            }
          } else {
            // Non-409 error — treat entire batch as failed
            console.error(`[Eryone Sync] Batch insert error at ${i}:`, error.message);
            result.errors.push(`Batch ${i}: ${error.message}`);
            result.stats.productsFailed += batch.length;
          }
        } else {
          result.stats.productsCreated += batch.length;
          console.log(`[Eryone Sync] Inserted batch ${i}-${i + batch.length}`);
        }
      } catch (batchErr) {
        const errMsg = batchErr instanceof Error ? batchErr.message : String(batchErr);
        console.error(`[Eryone Sync] Batch ${i} exception:`, errMsg);
        result.errors.push(`Batch ${i}: ${errMsg}`);
        result.stats.productsFailed += batch.length;
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
