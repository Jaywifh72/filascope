/**
 * eSUN CSV-Seeded Sync Function
 * 
 * Uses curated product seed data for 100% reliable sync
 * - All 444 products come from ESUN_PRODUCT_SEED
 * - Hex codes and images are curated in the seed
 * - Safe delete threshold: >= 300 products
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { ESUN_PRODUCT_SEED, ESUN_DEFAULT_PRICES } from '../_shared/esun-seed.ts';
import {
  enrichEsunProduct,
  normalizeEsunMaterial,
  cleanEsunTitle,
  extractEsunFinishType,
} from '../_shared/esun-defaults.ts';

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
}

/**
 * Generate a stable product line ID from filamentLine
 * e.g., "eSUN PLA-Matte 1.75mm 3D Filament 1KG" → "esun__pla__matte"
 */
function generateProductLineIdFromSeed(filamentLine: string, material: string): string {
  const lower = filamentLine.toLowerCase();
  const mat = material.toLowerCase().replace(/[^a-z0-9]/g, '');
  
  // Extract line type from filament line with specific patterns first
  const linePatterns: [RegExp, string][] = [
    // Multi-word patterns first (most specific)
    [/silk\s*magic/i, 'silk-magic'],
    [/silk\s*candy/i, 'silk-candy'],
    [/silk\s*metal/i, 'silk-metal'],
    [/silk\s*rainbow/i, 'silk-rainbow'],
    [/luminous\s*rainbow/i, 'luminous-rainbow'],
    [/uv\s*color\s*change/i, 'uv-color-change'],
    [/high[\s-]*speed/i, 'high-speed'],
    // Single word patterns
    [/silk/i, 'silk'],
    [/matte/i, 'matte'],
    [/luminous/i, 'luminous'],
    [/chameleon/i, 'chameleon'],
    [/rock/i, 'rock'],
    [/stars/i, 'stars'],
    [/magic/i, 'magic'],
    [/wood/i, 'wood'],
    [/metal(?!lic)/i, 'metal'],
    [/marble/i, 'marble'],
    [/lite/i, 'lite'],
    [/refilament/i, 'refilament'],
    [/\+\s*hs\b|\bhs\b/i, 'high-speed'],
    [/\bst\b|super[\s-]*tough/i, 'super-tough'],
    [/\blw\b|light[\s-]*weight/i, 'lightweight'],
    [/\bcf\b|carbon[\s-]*fiber/i, 'carbon-fiber'],
    [/\bgf\b|glass[\s-]*fiber/i, 'glass-fiber'],
    [/\besd\b/i, 'esd'],
    [/basic/i, 'basic'],
    [/\+/i, 'plus'],
  ];
  
  let lineSlug = 'standard';
  for (const [pattern, slug] of linePatterns) {
    if (pattern.test(lower)) {
      lineSlug = slug;
      break;
    }
  }
  
  return `esun__${mat}__${lineSlug}`;
}

/**
 * Generate a unique product ID from seed data
 */
function generateProductId(seed: typeof ESUN_PRODUCT_SEED[0]): string {
  const urlSlug = seed.productUrl.split('/products/').pop() || 'unknown';
  const colorSlug = seed.color.toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
  return `esun-${urlSlug}-${colorSlug}`;
}

/**
 * Extract color family from color name
 */
function extractColorFamily(colorName: string): string | null {
  const lower = colorName.toLowerCase();
  
  const families: [RegExp, string][] = [
    [/\b(black|charcoal|obsidian|jet|ebony)\b/i, 'Black'],
    [/\b(white|snow|ivory|cream|pearl)\b/i, 'White'],
    [/\b(grey|gray|silver|slate|ash)\b/i, 'Gray'],
    [/\b(red|crimson|scarlet|ruby|maroon|burgundy|fire|cherry|strawberry)\b/i, 'Red'],
    [/\b(blue|navy|azure|cobalt|ocean|sky|teal|cyan|lake)\b/i, 'Blue'],
    [/\b(green|olive|mint|forest|lime|emerald|sage|matcha|holly|morandi green|peak green)\b/i, 'Green'],
    [/\b(yellow|gold|lemon|mustard|amber|almond)\b/i, 'Yellow'],
    [/\b(orange|tangerine|apricot|peach|sunset|sunrise)\b/i, 'Orange'],
    [/\b(purple|violet|plum|grape|lavender|lilac|magenta|morandi purple)\b/i, 'Purple'],
    [/\b(pink|rose|salmon|coral|blush|barbie)\b/i, 'Pink'],
    [/\b(brown|tan|chocolate|coffee|caramel|khaki|beige|bone)\b/i, 'Brown'],
    [/\b(rainbow|multicolor)\b/i, 'Multicolor'],
    [/\b(transparent|clear|translucent|natural)\b/i, 'Transparent'],
  ];
  
  for (const [pattern, family] of families) {
    if (pattern.test(lower)) return family;
  }
  
  return null;
}

/**
 * Clean the product title for display
 */
function formatProductTitle(filamentLine: string, color: string): string {
  // Clean the filament line first
  let cleaned = filamentLine
    .replace(/\besun\b\s*/gi, '')
    .replace(/\b1\.75\s*mm\b/gi, '')
    .replace(/\b3d\s*filament\b/gi, '')
    .replace(/\b1\s*kg\b/gi, '')
    .replace(/\bfilament\b/gi, '')
    .replace(/\s+/g, ' ')
    .trim();
  
  return `${cleaned} - ${color}`.trim();
}

/**
 * Compute a hash from price + availability fields for change detection.
 * Used as external_data_hash to detect when a product has changed on the source.
 */
function computeHash(price: number, available: boolean, variantAvailable: boolean): string {
  const input = `${price}|${available}|${variantAvailable}`;
  let hash = 5381;
  for (let i = 0; i < input.length; i++) {
    hash = ((hash << 5) + hash) + input.charCodeAt(i);
    hash = hash & hash;
  }
  return Math.abs(hash).toString(16);
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const startTime = Date.now();
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Parse options (cleanSlate is supported, limit is IGNORED for CSV-seeded sync)
    const options = await req.json().catch(() => ({}));
    const { cleanSlate = false } = options;

    console.log(`[sync-esun-products] Starting CSV-seeded sync (cleanSlate: ${cleanSlate})`);
    console.log(`[sync-esun-products] Processing ${ESUN_PRODUCT_SEED.length} products from seed`);

    const stats: SyncStats = {
      discovered: ESUN_PRODUCT_SEED.length,
      created: 0,
      updated: 0,
      skipped: 0,
      errors: 0,
    };

    // =========================================================================
    // STEP 1: GET BRAND ID
    // =========================================================================
    const { data: brandData } = await supabase
      .from('automated_brands')
      .select('id')
      .eq('brand_slug', 'esun')
      .single();

    const brandId = brandData?.id;
    console.log(`[sync-esun-products] Brand ID: ${brandId || 'not found'}`);

    // =========================================================================
    // STEP 2: SAFE DELETE (if cleanSlate)
    // =========================================================================
    if (cleanSlate) {
      // Verify we have enough products before deleting (safe delete pattern)
      const SAFE_DELETE_THRESHOLD = 300;
      if (ESUN_PRODUCT_SEED.length < SAFE_DELETE_THRESHOLD) {
        throw new Error(`Safe delete failed: Only ${ESUN_PRODUCT_SEED.length} products in seed, need >= ${SAFE_DELETE_THRESHOLD}`);
      }

      console.log(`[sync-esun-products] Clean slate: Deleting existing eSUN products...`);
      const { error: deleteError } = await supabase
        .from('filaments')
        .delete()
        .ilike('vendor', 'esun');

      if (deleteError) {
        console.error(`[sync-esun-products] Delete error:`, deleteError.message);
      } else {
        console.log(`[sync-esun-products] Existing products deleted`);
      }
    }

    // =========================================================================
    // STEP 2.5: FETCH LIVE PRICES FROM SHOPIFY API
    // =========================================================================
    // Build handle → cheapest 1kg price map from esun3dstore.com
    const handlePriceMap = new Map<string, number>();
    try {
      let page = 1;
      while (true) {
        const res = await fetch(
          `https://esun3dstore.com/products.json?limit=250&page=${page}`,
          { headers: { 'User-Agent': 'FilaScope-Sync/1.0' } }
        );
        if (!res.ok) { console.warn(`[sync-esun-products] Shopify returned ${res.status}`); break; }
        const data = await res.json();
        const products: any[] = data.products || [];
        if (products.length === 0) break;
        for (const p of products) {
          const v1kg = p.variants?.find((v: any) => /\b1\s*kg\b|\b1000\s*g\b/i.test(v.title)) || p.variants?.[0];
          if (v1kg?.price) handlePriceMap.set(p.handle, parseFloat(v1kg.price));
        }
        if (products.length < 250) break;
        page++;
        await new Promise(r => setTimeout(r, 500));
      }
      console.log(`[sync-esun-products] Fetched prices for ${handlePriceMap.size} products`);
    } catch (err) {
      console.warn('[sync-esun-products] Price fetch failed — using defaults:', err);
    }

    // =========================================================================
    // STEP 3: PROCESS SEED DATA
    // =========================================================================

    // Pre-fetch existing eSUN product_ids so we can distinguish creates vs updates
    const { data: existingRows } = await supabase
      .from('filaments')
      .select('product_id')
      .eq('vendor', 'eSun');
    const existingProductIds = new Set(
      (existingRows || []).map((r: { product_id: string | null }) => r.product_id).filter(Boolean)
    );

    const productsToInsert: Record<string, unknown>[] = [];
    const productLineStats: Record<string, number> = {};

    for (const seed of ESUN_PRODUCT_SEED) {
      try {
        const productId = generateProductId(seed);
        const productLineId = generateProductLineIdFromSeed(seed.filamentLine, seed.material);
        const productTitle = formatProductTitle(seed.filamentLine, seed.color);
        
        // Track product line stats
        productLineStats[productLineId] = (productLineStats[productLineId] || 0) + 1;

        // Get enrichment data (print settings, TDS URL, etc.)
        const enrichment = enrichEsunProduct(
          seed.filamentLine,
          seed.material,
          null // No TDS URL in seed
        );

        // Get live price by Shopify handle, fall back to hardcoded defaults
        const productHandle = seed.productUrl.split('/products/')[1]?.split('?')[0] || '';
        const lineName = seed.filamentLine
          .replace(/\besun\b\s*/gi, '')
          .replace(/\b1\.75\s*mm\b/gi, '')
          .replace(/\b3d\s*filament\b/gi, '')
          .replace(/\b1\s*kg\b/gi, '')
          .replace(/\bfilament\b/gi, '')
          .trim();
        const defaultPrice = (productHandle && handlePriceMap.get(productHandle))
          || ESUN_DEFAULT_PRICES[lineName] || 19.99;

        // Build filament record
        const filament = {
          product_id: productId,
          product_title: productTitle,
          vendor: 'eSun',
          brand_id: brandId || null,
          product_url: seed.productUrl,
          featured_image: seed.imageUrl,
          color_hex: seed.colorHex.startsWith('#') ? seed.colorHex : `#${seed.colorHex}`,
          color_family: extractColorFamily(seed.color),
          material: enrichment.material || seed.material,
          finish_type: enrichment.finishType !== 'Standard' ? enrichment.finishType : null,
          product_line_id: productLineId,
          variant_price: defaultPrice,
          variant_available: true,
          nozzle_temp_min_c: enrichment.nozzleTempMin,
          nozzle_temp_max_c: enrichment.nozzleTempMax,
          bed_temp_min_c: enrichment.bedTempMin,
          bed_temp_max_c: enrichment.bedTempMax,
          print_speed_max_mms: enrichment.printSpeedMax,
          high_speed_capable: enrichment.isHighSpeed || null,
          is_nozzle_abrasive: enrichment.isAbrasive || null,
          tds_url: enrichment.tdsUrl || null,
          diameter_nominal_mm: 1.75,
          net_weight_g: 1000,
          external_data_hash: computeHash(defaultPrice, true, true),
          auto_created: true,
          auto_updated: true,
          last_scraped_at: new Date().toISOString(),
        };

        productsToInsert.push(filament);
      } catch (err) {
        console.error(`[sync-esun-products] Error processing seed entry:`, err);
        stats.errors++;
      }
    }

    console.log(`[sync-esun-products] Prepared ${productsToInsert.length} products for insertion (${existingProductIds.size} existing in DB)`);
    console.log(`[sync-esun-products] Product lines: ${Object.keys(productLineStats).length}`);

    // =========================================================================
    // STEP 4: INSERT NEW + UPDATE EXISTING (no upsert, avoids onConflict issues)
    // =========================================================================
    const newProducts = productsToInsert.filter(f => !existingProductIds.has(f.product_id as string));
    const existingProducts = productsToInsert.filter(f => existingProductIds.has(f.product_id as string));

    console.log(`[sync-esun-products] New: ${newProducts.length}, Existing: ${existingProducts.length}`);

    // INSERT new products in batches
    if (newProducts.length > 0) {
      const INSERT_BATCH = 50;
      for (let i = 0; i < newProducts.length; i += INSERT_BATCH) {
        const batch = newProducts.slice(i, i + INSERT_BATCH);
        const { error: insertError, data: insertData } = await supabase
          .from('filaments')
          .insert(batch)
          .select('id');
        if (insertError) {
          console.error(`[sync-esun-products] INSERT batch ${Math.floor(i / INSERT_BATCH) + 1} failed: ${insertError.message}`);
          // Fall back to individual inserts with 409 composite-key fallback
          for (const row of batch) {
            try {
              const { data: rowData, error: rowErr } = await supabase
                .from('filaments')
                .insert(row as Record<string, unknown>)
                .select('id');
              if (rowErr) {
                if (rowErr.message.includes('409') || rowErr.code === '23505') {
                  // Duplicate on product_id — try composite-key fallback
                  const { data: existing } = await supabase
                    .from('filaments')
                    .select('id')
                    .eq('vendor', row.vendor as string)
                    .eq('product_title', row.product_title as string)
                    .eq('variant_price', row.variant_price as number)
                    .eq('color_family', row.color_family as string | null)
                    .limit(1)
                    .single();
                  if (existing) {
                    const { error: updateErr } = await supabase
                      .from('filaments')
                      .update({
                        variant_price: row.variant_price,
                        featured_image: row.featured_image,
                        product_url: row.product_url,
                        external_data_hash: computeHash(row.variant_price as number, true, true),
                        auto_updated: true,
                        last_scraped_at: new Date().toISOString(),
                      })
                      .eq('id', existing.id);
                    if (updateErr) {
                      console.error(`[sync-esun-products] UPDATE fallback error for ${row.product_id}: ${updateErr.message}`);
                      stats.errors++;
                    } else {
                      stats.updated++;
                    }
                  } else {
                    console.error(`[sync-esun-products] 409 but no composite-key match for ${row.product_id}`);
                    stats.errors++;
                  }
                } else {
                  console.error(`[sync-esun-products] INSERT error for ${row.product_id}: ${rowErr.message}`);
                  stats.errors++;
                }
              } else {
                stats.created++;
              }
            } catch (err) {
              console.error(`[sync-esun-products] INSERT try/catch error for ${row.product_id}: ${err}`);
              stats.errors++;
            }
          }
        } else {
          stats.created += insertData?.length || batch.length;
          console.log(`[sync-esun-products] Inserted batch ${Math.floor(i / INSERT_BATCH) + 1}/${Math.ceil(newProducts.length / INSERT_BATCH)} (${insertData?.length || batch.length} rows)`);
        }
      }
    }

    // UPDATE existing products in batches
    if (existingProducts.length > 0) {
      const UPDATE_BATCH = 50;
      for (let i = 0; i < existingProducts.length; i += UPDATE_BATCH) {
        const batch = existingProducts.slice(i, i + UPDATE_BATCH);
        const ids = batch.map(r => r.product_id);
        const { error: updateError } = await supabase
          .from('filaments')
          .update({ 
            variant_price: batch[0].variant_price,
            featured_image: batch[0].featured_image,
            product_url: batch[0].product_url,
            auto_updated: true,
            last_scraped_at: new Date().toISOString(),
          })
          .in('product_id', ids)
          .eq('vendor', 'eSun');
        if (updateError) {
          console.error(`[sync-esun-products] UPDATE batch ${Math.floor(i / UPDATE_BATCH) + 1} failed: ${updateError.message}`);
          stats.errors += batch.length;
        } else {
          stats.updated += batch.length;
        }
      }
    }

    console.log(`[sync-esun-products] Final stats: created=${stats.created}, updated=${stats.updated}, errors=${stats.errors}`);

    // =========================================================================
    // STEP 5: UPDATE BRAND STATS
    // =========================================================================
    if (brandId) {
      await supabase
        .from('automated_brands')
        .update({
          last_scrape_at: new Date().toISOString(),
          products_created: stats.created,
          last_error: stats.errors > 0 ? `${stats.errors} errors during sync` : null,
        })
        .eq('id', brandId);
      
      // Update product counts
      await supabase.rpc('update_brand_product_counts', { p_brand_slug: 'esun' });

      // Create sync log with regional_breakdown
      await supabase
        .from('brand_sync_logs')
        .insert({
          brand_id: brandId,
          brand_slug: 'esun',
          sync_type: cleanSlate ? 'full_scrape' : 'update_only',
          status: stats.errors > (stats.created + stats.updated) ? 'failed' : stats.errors > 0 ? 'partial' : 'completed',
          triggered_by: 'admin_ui',
          completed_at: new Date().toISOString(),
          duration_seconds: Math.round((Date.now() - startTime) / 1000),
          products_discovered: stats.discovered,
          products_created: stats.created,
          products_updated: stats.updated,
          products_failed: stats.errors,
          regions_synced: ['US'],
          regional_breakdown: {
            US: {
              updated: stats.updated,
              created: stats.created,
              skipped: stats.skipped,
              errors: stats.errors,
              products_found: stats.discovered,
            }
          },
        });
    }

    // =========================================================================
    // STEP 6: FIX DUPLICATE HEX CODES
    // =========================================================================
    try {
      console.log(`[sync-esun-products] Checking for duplicate hex codes...`);
      const { data: duplicates } = await supabase.rpc('find_duplicate_hexes', { p_vendor: 'eSun' }).single();
      
      if (duplicates && duplicates.length > 0) {
        console.log(`[sync-esun-products] Found ${duplicates.length} duplicate hex entries, fixing...`);
        
        // Group by (product_line_id, lower(color_hex))
        const grouped = new Map<string, typeof duplicates>();
        for (const dup of duplicates) {
          const key = `${dup.product_line_id}:${dup.color_hex?.toLowerCase()}`;
          if (!grouped.has(key)) grouped.set(key, []);
          grouped.get(key)!.push(dup);
        }
        
        for (const [, items] of grouped) {
          if (items.length > 1) {
            for (let i = 1; i < items.length; i++) {
              const item = items[i];
              const baseHex = (item.color_hex || 'CCCCCC').replace('#', '');
              const r = Math.min(255, parseInt(baseHex.slice(0, 2), 16) + i * 5);
              const g = Math.min(255, parseInt(baseHex.slice(2, 4), 16) + i * 3);
              const b = Math.min(255, parseInt(baseHex.slice(4, 6), 16) + i * 2);
              const newHex = `#${r.toString(16).padStart(2,'0')}${g.toString(16).padStart(2,'0')}${b.toString(16).padStart(2,'0')}`.toUpperCase();
              await supabase.from('filaments').update({ color_hex: newHex }).eq('id', item.id);
            }
          }
        }
        console.log(`[sync-esun-products] Duplicate hex codes fixed`);
      }
    } catch (rpcErr) {
      // find_duplicate_hexes RPC may not exist in this environment — skip gracefully
      console.warn(`[sync-esun-products] Duplicate hex fix skipped (RPC unavailable): ${rpcErr}`);
    }

    // =========================================================================
    // STEP 7: FINAL RESPONSE
    // =========================================================================
    const message = `eSUN sync complete: ${stats.created} created, ${stats.updated} updated, ${stats.errors} errors, ${Object.keys(productLineStats).length} product lines`;
    console.log(`[sync-esun-products] ${message}`);

    return new Response(
      JSON.stringify({
        success: stats.errors < (stats.created + stats.updated),
        message,
        stats: {
          productsDiscovered: stats.discovered,
          productsCreated: stats.created,
          productsUpdated: stats.updated,
          productsFailed: stats.errors,
          productLines: Object.keys(productLineStats).length,
          productLineBreakdown: productLineStats,
        },
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('[sync-esun-products] Fatal error:', error);
    return new Response(
      JSON.stringify({ success: false, error: String(error) }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});
