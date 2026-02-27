import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import {
  FORMFUTURA_PRODUCT_SEED,
  FORMFUTURA_SEED_VERSION,
  FORMFUTURA_DEFAULT_COLORS,
  EUR_TO_USD_RATE,
  FORMFUTURA_SAFE_DELETE_THRESHOLD,
} from '../_shared/formfutura-seed.ts';
import {
  enrichFormFuturaProduct,
  cleanFormFuturaTitle,
  getFormFuturaColorHex,
  normalizeFormFuturaMaterial,
  extractFormFuturaWeight,
  isFormFuturaRefill,
  isFormFuturaBambuCompatible,
  generateFormFuturaProductLineId,
  FORMFUTURA_DEFAULTS_VERSION,
} from '../_shared/formfutura-defaults.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface SyncStats {
  discovered: number;
  created: number;
  updated: number;
  skipped: number;
  failed: number;
  errors: string[];
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const startTime = Date.now();
  const stats: SyncStats = { discovered: 0, created: 0, updated: 0, skipped: 0, failed: 0, errors: [] };

  try {
    // Parse options - ignore limit for CSV-seeded sync (process all products)
    const { cleanSlate = false } = await req.json().catch(() => ({}));

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    console.log('=== FormFutura CSV-Seeded Sync Started ===');
    console.log(`Seed version: ${FORMFUTURA_SEED_VERSION}`);
    console.log(`Defaults version: ${FORMFUTURA_DEFAULTS_VERSION}`);
    console.log(`Options: cleanSlate=${cleanSlate}`);
    console.log(`Seed products: ${FORMFUTURA_PRODUCT_SEED.length}`);

    // =========================================================================
    // STEP 1: SAFE DELETE THRESHOLD CHECK
    // =========================================================================
    const seedProductCount = FORMFUTURA_PRODUCT_SEED.length;
    stats.discovered = seedProductCount;

    if (seedProductCount < FORMFUTURA_SAFE_DELETE_THRESHOLD) {
      console.error(`[SAFETY] Seed only has ${seedProductCount} products, minimum is ${FORMFUTURA_SAFE_DELETE_THRESHOLD}`);
      return new Response(
        JSON.stringify({
          success: false,
          error: `Safe delete threshold not met: ${seedProductCount} < ${FORMFUTURA_SAFE_DELETE_THRESHOLD}`,
          stats,
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // =========================================================================
    // STEP 2: OPTIONAL CLEAN SLATE DELETE
    // =========================================================================
    if (cleanSlate) {
      console.log('Step 2: Clean slate - deleting existing FormFutura products...');
      const { data: deleted, error: deleteError } = await supabase
        .from('filaments')
        .delete()
        .ilike('vendor', 'formfutura')
        .select('id');

      if (deleteError) {
        console.error('Delete error:', deleteError);
        stats.errors.push(`Delete error: ${deleteError.message}`);
      } else {
        console.log(`Deleted ${deleted?.length || 0} existing products`);
      }
    }

    // =========================================================================
    // STEP 3: GET BRAND ID
    // =========================================================================
    const { data: brand } = await supabase
      .from('automated_brands')
      .select('id')
      .eq('brand_slug', 'formfutura')
      .single();

    const brandId = brand?.id || null;
    console.log(`Brand ID: ${brandId}`);

    // =========================================================================
    // STEP 4: PROCESS SEED DATA WITH COLOR EXPLOSION
    // =========================================================================
    console.log('Step 4: Processing seed data...');
    const filamentRecords: any[] = [];

    for (const seed of FORMFUTURA_PRODUCT_SEED) {
      try {
        // Determine colors for this product using product-specific color lists
        const productSlug = seed.filamentName.toLowerCase().replace(/[^a-z0-9]+/g, '-');
        
        // Special handling for Glow in the Dark products (match slug pattern)
        let colors: string[];
        if (/glow.*dark/i.test(seed.filamentName)) {
          // These products have specific 3-color glow palettes
          if (/abs/i.test(seed.filamentName)) {
            colors = FORMFUTURA_DEFAULT_COLORS['easyfil-abs-glow'] || ['Glow Green', 'Glow Blue'];
          } else {
            colors = FORMFUTURA_DEFAULT_COLORS['easyfil-pla-glow'] || ['Glow Green', 'Glow Blue', 'Glow Red'];
          }
        } else if (FORMFUTURA_DEFAULT_COLORS[productSlug]) {
          // Exact match
          colors = FORMFUTURA_DEFAULT_COLORS[productSlug];
        } else {
          // Check for partial matches (e.g., 'luvocom-3f-pekk-50082' matches 'luvocom-3f-pekk')
          // Sort keys by length descending for more specific matches first
          const sortedKeys = Object.keys(FORMFUTURA_DEFAULT_COLORS).sort((a, b) => b.length - a.length);
          const partialMatch = sortedKeys.find(key => 
            productSlug.includes(key) || (key !== 'default' && key.includes(productSlug.split('-')[0]))
          );
          colors = partialMatch 
            ? FORMFUTURA_DEFAULT_COLORS[partialMatch] 
            : FORMFUTURA_DEFAULT_COLORS['default'];
        }
        
        // Override for known single-color specialty materials (these only come in one color)
        if (/metalfil|carbonfil|luvocom|paht|peek|pekk|pps|pei|ultem|atlas|bvoh|aquasolve|ppsu|biofil-pcl|refill.*system/i.test(seed.filamentName)) {
          if (!FORMFUTURA_DEFAULT_COLORS[productSlug]) {
            colors = ['Standard'];
          }
        }

        // Enrich product data
        const enrichment = enrichFormFuturaProduct(seed.filamentName);

        // Create one record per color
        for (const color of colors) {
          const colorSlug = color.toLowerCase().replace(/[^a-z0-9]+/g, '-');
          const productId = `formfutura-${productSlug}-${colorSlug}`;

          // Get color hex
          const colorHex = getFormFuturaColorHex(color);

          // Determine weight
          const weightG = extractFormFuturaWeight(seed.filamentName);

          // Check format flags
          const isRefill = isFormFuturaRefill(seed.filamentName);
          const isBambuCompatible = isFormFuturaBambuCompatible(seed.filamentName);

          // Clean title and add color (only if not already present)
          let cleanTitle = cleanFormFuturaTitle(seed.filamentName);
          const colorLower = color.toLowerCase();
          const titleLower = cleanTitle.toLowerCase();
          // Only append color if not already in the title (prevents "MetalFil - Brass - Brass")
          if (color !== 'Standard' && !titleLower.includes(colorLower)) {
            cleanTitle = `${cleanTitle} - ${color}`;
          }

          // Normalize image URL
          let imageUrl = seed.imageUrl;
          if (imageUrl && imageUrl.startsWith('/')) {
            imageUrl = `https://www.formfutura.com${imageUrl}`;
          }

          const record = {
            product_id: productId,
            product_title: cleanTitle,
            vendor: 'FormFutura',
            brand_id: brandId,
            product_url: seed.productUrl,
            featured_image: imageUrl,
            variant_price: seed.basePriceEur ? Math.round(seed.basePriceEur * EUR_TO_USD_RATE * 100) / 100 : null,
            variant_available: true,
            material: enrichment.material,
            finish_type: enrichment.finishType,
            product_line_id: enrichment.productLineId,
            tds_url: enrichment.tdsUrl,
            color_hex: colorHex ? `#${colorHex}` : null,
            color_family: color,
            nozzle_temp_min_c: enrichment.nozzleTempMin,
            nozzle_temp_max_c: enrichment.nozzleTempMax,
            bed_temp_min_c: enrichment.bedTempMin,
            bed_temp_max_c: enrichment.bedTempMax,
            print_speed_max_mms: enrichment.printSpeedMax,
            is_nozzle_abrasive: enrichment.isAbrasive,
            high_speed_capable: enrichment.highSpeedCapable,
            diameter_nominal_mm: 1.75,
            net_weight_g: weightG,
            spool_material: isRefill ? 'Cardboard' : 'Plastic',
            spool_ams_fit: isBambuCompatible,
            auto_created: true,
            auto_updated: true,
            last_scraped_at: new Date().toISOString(),
            sync_status: 'synced',
          };

          filamentRecords.push(record);
        }
      } catch (error) {
        console.error(`Error processing ${seed.filamentName}:`, error);
        stats.failed++;
        stats.errors.push(`${seed.filamentName}: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }

    console.log(`Prepared ${filamentRecords.length} filament records`);

    // =========================================================================
    // STEP 5: BATCH INSERT
    // =========================================================================
    console.log('Step 5: Batch inserting products...');
    const BATCH_SIZE = 50;

    for (let i = 0; i < filamentRecords.length; i += BATCH_SIZE) {
      const batch = filamentRecords.slice(i, i + BATCH_SIZE);

      const { data: upsertData, error: upsertError } = await supabase
        .from('filaments')
        .upsert(batch, { onConflict: 'product_id', ignoreDuplicates: false })
        .select('id');

      if (upsertError) {
        console.error(`Batch ${Math.floor(i / BATCH_SIZE) + 1} upsert error:`, upsertError);
        stats.failed += batch.length;
        stats.errors.push(`Batch ${Math.floor(i / BATCH_SIZE) + 1}: ${upsertError.message}`);
      } else {
        stats.created += batch.length;
        console.log(`Batch ${Math.floor(i / BATCH_SIZE) + 1}: Upserted ${batch.length} products`);
      }
    }

    // =========================================================================
    // STEP 6: FINALIZE - UPDATE BRAND COUNTS
    // =========================================================================
    console.log('Step 6: Finalizing sync...');

    try {
      await supabase.rpc('update_brand_product_counts', { p_brand_slug: 'formfutura' });
      console.log('Brand product counts updated');
    } catch (error) {
      console.error('Error updating brand counts:', error);
    }

    // =========================================================================
    // STEP 7: FIX DUPLICATE HEX CODES
    // =========================================================================
    try {
      const { data: dupes } = await supabase.rpc('find_duplicate_hexes', { p_vendor: 'FormFutura' });
      if (dupes && dupes.length > 0) {
        console.log(`Found ${dupes.length} duplicate hex codes, applying variations...`);

        // Group by product_line_id and hex
        const groups: Record<string, any[]> = {};
        for (const dupe of dupes) {
          const key = `${dupe.product_line_id}__${dupe.color_hex?.toLowerCase()}`;
          if (!groups[key]) groups[key] = [];
          groups[key].push(dupe);
        }

        // Fix each group by varying hex slightly
        for (const [key, group] of Object.entries(groups)) {
          for (let i = 1; i < group.length; i++) {
            const item = group[i];
            const originalHex = item.color_hex || '#808080';
            
            // Parse hex and vary
            const r = parseInt(originalHex.slice(1, 3), 16);
            const g = parseInt(originalHex.slice(3, 5), 16);
            const b = parseInt(originalHex.slice(5, 7), 16);
            
            const newR = Math.min(255, Math.max(0, r + i * 2));
            const newG = Math.min(255, Math.max(0, g + i));
            const newB = Math.min(255, Math.max(0, b - i));
            
            const newHex = `#${newR.toString(16).padStart(2, '0')}${newG.toString(16).padStart(2, '0')}${newB.toString(16).padStart(2, '0')}`;
            
            await supabase
              .from('filaments')
              .update({ color_hex: newHex })
              .eq('id', item.id);
          }
        }
        console.log('Duplicate hex codes fixed');
      }
    } catch (error) {
      console.error('Error fixing duplicates:', error);
    }

    // Mark brand as not actively scraping
    await supabase
      .from('automated_brands')
      .update({
        scraping_active: false,
        last_scrape_at: new Date().toISOString(),
      })
      .eq('brand_slug', 'formfutura');

    const duration = ((Date.now() - startTime) / 1000).toFixed(1);
    console.log('=== FormFutura Sync Complete ===');
    console.log(`Duration: ${duration}s`);
    console.log(`Stats: discovered=${stats.discovered}, created=${stats.created}, failed=${stats.failed}`);

    // Count unique product lines
    const uniqueProductLines = new Set(filamentRecords.map(r => r.product_line_id)).size;
    console.log(`Unique product lines: ${uniqueProductLines}`);

    return new Response(
      JSON.stringify({
        success: true,
        stats: {
          ...stats,
          uniqueProductLines,
        },
        duration: `${duration}s`,
        seedVersion: FORMFUTURA_SEED_VERSION,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('FormFutura sync error:', error);
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
