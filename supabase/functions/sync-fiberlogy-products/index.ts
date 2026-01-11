import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import {
  enrichFiberlogyProduct,
  getFiberlogyColorHex,
  normalizeFiberlogyMaterial,
  isDiameter285,
  getWeightVariant,
} from '../_shared/fiberlogy-defaults.ts';
import { FIBERLOGY_PRODUCT_SEED, getFiberlogyDefaultPrice } from '../_shared/fiberlogy-seed.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface SyncOptions {
  dryRun?: boolean;
  limit?: number;
  tasks?: string[];
}

interface SyncResult {
  success: boolean;
  message: string;
  stats: {
    discovered: number;
    created: number;
    updated: number;
    deleted: number;
    enriched: number;
    errors: number;
  };
  errors: string[];
}

// Safe delete threshold - minimum products before allowing delete
const SAFE_DELETE_THRESHOLD = 50;

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  const supabase = createClient(supabaseUrl, supabaseKey);

  try {
    const options: SyncOptions = await req.json().catch(() => ({}));
    const { dryRun = false, tasks = ['sync', 'enrich', 'hexfix'] } = options;
    // Ignore limit parameter - always sync full CSV seed

    const result: SyncResult = {
      success: true,
      message: '',
      stats: { discovered: 0, created: 0, updated: 0, deleted: 0, enriched: 0, errors: 0 },
      errors: [],
    };

    console.log(`[Fiberlogy] Starting CSV-seeded sync with options:`, { dryRun, tasks });
    console.log(`[Fiberlogy] Seed contains ${FIBERLOGY_PRODUCT_SEED.length} products`);

    // ========== STEP 1: CSV-SEEDED SYNC ==========
    if (tasks.includes('sync')) {
      console.log('[Fiberlogy] Step 1: Processing CSV seed data...');
      
      result.stats.discovered = FIBERLOGY_PRODUCT_SEED.length;
      
      // Safe delete check - ensure we have enough products before deleting
      if (FIBERLOGY_PRODUCT_SEED.length < SAFE_DELETE_THRESHOLD) {
        throw new Error(`Safe delete threshold not met: ${FIBERLOGY_PRODUCT_SEED.length} < ${SAFE_DELETE_THRESHOLD}`);
      }

      // Delete existing Fiberlogy products (clean slate approach)
      if (!dryRun) {
        const { data: existing } = await supabase
          .from('filaments')
          .select('id')
          .ilike('vendor', 'fiberlogy');
        
        if (existing && existing.length > 0) {
          console.log(`[Fiberlogy] Deleting ${existing.length} existing products...`);
          const { error: deleteError } = await supabase
            .from('filaments')
            .delete()
            .ilike('vendor', 'fiberlogy');
          
          if (deleteError) {
            console.error('[Fiberlogy] Delete error:', deleteError);
          } else {
            result.stats.deleted = existing.length;
          }
        }
      }

      // Process each seed product
      const productsToInsert: Record<string, unknown>[] = [];

      for (const seedProduct of FIBERLOGY_PRODUCT_SEED) {
        try {
          // Normalize material
          const material = normalizeFiberlogyMaterial(seedProduct.filament);
          
          // Get enrichment data
          const enrichment = enrichFiberlogyProduct(seedProduct.filament, material);
          
          // Get color hex from mapping
          const colorHex = getFiberlogyColorHex(seedProduct.color);
          
          // Determine weight from filament name
          const weightVariant = getWeightVariant(seedProduct.filament);
          let weightGrams = 850; // Default Fiberlogy weight
          if (weightVariant === '2.5kg') weightGrams = 2500;
          else if (weightVariant === '0.5kg') weightGrams = 500;
          else if (weightVariant === '0.75kg') weightGrams = 750;
          
          // Determine diameter
          const diameter = isDiameter285(seedProduct.filament) ? 2.85 : 1.75;

          // Generate product ID
          const productId = `fiberlogy-${slugify(seedProduct.filament)}-${slugify(seedProduct.color)}`;
          
          // Generate clean title
          const cleanTitle = `Fiberlogy ${seedProduct.filament} - ${seedProduct.color}`;

          // Get price from seed or default
          const variantPrice = seedProduct.priceEur || getFiberlogyDefaultPrice(seedProduct.material, seedProduct.filament);

          const productData = {
            product_id: productId,
            product_title: cleanTitle,
            vendor: 'Fiberlogy',
            product_url: seedProduct.productUrl,
            featured_image: seedProduct.imageUrl, // Will be null from seed
            variant_price: variantPrice,
            price_eur: variantPrice,
            material: enrichment.material,
            finish_type: enrichment.finishType !== 'Standard' ? enrichment.finishType : null,
            product_line_id: enrichment.productLineId,
            color_family: seedProduct.color,
            color_hex: colorHex ? (colorHex.startsWith('#') ? colorHex : `#${colorHex}`) : null,
            nozzle_temp_min_c: enrichment.nozzleTempMin,
            nozzle_temp_max_c: enrichment.nozzleTempMax,
            bed_temp_min_c: enrichment.bedTempMin,
            bed_temp_max_c: enrichment.bedTempMax,
            tds_url: enrichment.tdsUrl,
            is_nozzle_abrasive: enrichment.isAbrasive || null,
            diameter_nominal_mm: diameter,
            net_weight_g: weightGrams,
            auto_created: true,
            auto_updated: true,
            last_scraped_at: new Date().toISOString(),
            sync_status: 'synced',
          };

          if (dryRun) {
            console.log('[Fiberlogy] DRY RUN - would insert:', productData.product_title);
            result.stats.created++;
          } else {
            productsToInsert.push(productData);
          }

        } catch (error: unknown) {
          console.error(`[Fiberlogy] Error processing ${seedProduct.filament} - ${seedProduct.color}:`, error);
          result.errors.push(`${seedProduct.filament} - ${seedProduct.color}: ${error instanceof Error ? error.message : String(error)}`);
          result.stats.errors++;
        }
      }

      // Batch insert all products
      if (!dryRun && productsToInsert.length > 0) {
        console.log(`[Fiberlogy] Inserting ${productsToInsert.length} products...`);
        
        // Insert in batches of 50 to avoid timeouts
        const batchSize = 50;
        for (let i = 0; i < productsToInsert.length; i += batchSize) {
          const batch = productsToInsert.slice(i, i + batchSize);
          const { error } = await supabase
            .from('filaments')
            .insert(batch);
          
          if (error) {
            console.error(`[Fiberlogy] Batch insert error at ${i}:`, error);
            result.errors.push(`Batch insert error: ${error.message}`);
            result.stats.errors += batch.length;
          } else {
            result.stats.created += batch.length;
          }
        }
      }
    }

    // ========== STEP 2: BRAND-SPECIFIC ENRICHMENTS ==========
    if (tasks.includes('enrich')) {
      console.log('[Fiberlogy] Step 2: Applying additional enrichments...');

      const { data: toEnrich } = await supabase
        .from('filaments')
        .select('id, product_title, material, tds_url, product_line_id')
        .ilike('vendor', 'fiberlogy')
        .or('product_line_id.is.null,material.is.null')
        .limit(200);

      if (toEnrich && toEnrich.length > 0) {
        console.log(`[Fiberlogy] Enriching ${toEnrich.length} products`);
        
        for (const filament of toEnrich) {
          const enrichment = enrichFiberlogyProduct(
            filament.product_title,
            filament.material,
            filament.tds_url
          );

          if (!dryRun) {
            await supabase
              .from('filaments')
              .update({
                product_line_id: enrichment.productLineId || filament.product_line_id,
                material: enrichment.material || filament.material,
                tds_url: enrichment.tdsUrl || filament.tds_url,
                nozzle_temp_min_c: enrichment.nozzleTempMin,
                nozzle_temp_max_c: enrichment.nozzleTempMax,
                bed_temp_min_c: enrichment.bedTempMin,
                bed_temp_max_c: enrichment.bedTempMax,
                is_nozzle_abrasive: enrichment.isAbrasive || null,
              })
              .eq('id', filament.id);
            
            result.stats.enriched++;
          }
        }
      }
    }

    // ========== STEP 3: DUPLICATE HEX FIX ==========
    if (tasks.includes('hexfix')) {
      console.log('[Fiberlogy] Step 3: Fixing duplicate hex codes...');

      // Get all Fiberlogy products grouped by product_line_id
      const { data: allProducts } = await supabase
        .from('filaments')
        .select('id, product_line_id, color_hex, color_family')
        .ilike('vendor', 'fiberlogy')
        .not('color_hex', 'is', null);

      if (allProducts && allProducts.length > 0 && !dryRun) {
        // Group by product_line_id and color_hex
        const grouped: Record<string, typeof allProducts> = {};
        for (const product of allProducts) {
          const key = `${product.product_line_id}:${product.color_hex?.toLowerCase()}`;
          if (!grouped[key]) grouped[key] = [];
          grouped[key].push(product);
        }

        let fixedCount = 0;
        for (const entries of Object.values(grouped)) {
          if (entries.length <= 1) continue;
          
          console.log(`[Fiberlogy] Found ${entries.length} duplicates for ${entries[0].product_line_id} - ${entries[0].color_hex}`);
          
          for (let i = 1; i < entries.length; i++) {
            const baseHex = entries[i].color_hex?.replace('#', '') || 'CCCCCC';
            const r = parseInt(baseHex.slice(0, 2), 16);
            const g = parseInt(baseHex.slice(2, 4), 16);
            const b = parseInt(baseHex.slice(4, 6), 16);
            
            // Slightly vary the color
            const newR = Math.min(255, r + i * 3);
            const newG = Math.min(255, g + (i % 2) * 2);
            const newB = Math.min(255, b + ((i + 1) % 3));
            const newHex = `#${newR.toString(16).padStart(2, '0')}${newG.toString(16).padStart(2, '0')}${newB.toString(16).padStart(2, '0')}`.toUpperCase();
            
            await supabase
              .from('filaments')
              .update({ color_hex: newHex })
              .eq('id', entries[i].id);
            
            fixedCount++;
          }
        }
        
        if (fixedCount > 0) {
          console.log(`[Fiberlogy] Fixed ${fixedCount} duplicate hex codes`);
        }
      }
    }

    result.message = `Fiberlogy CSV-seeded sync complete: ${result.stats.created} created, ${result.stats.deleted} deleted, ${result.stats.enriched} enriched`;
    console.log(`[Fiberlogy] ${result.message}`);

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error: unknown) {
    console.error('[Fiberlogy] Sync error:', error);
    return new Response(
      JSON.stringify({ success: false, error: error instanceof Error ? error.message : String(error) }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

// Helper function to create URL-friendly slugs
function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .substring(0, 80);
}
