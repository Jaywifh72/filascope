import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import {
  KINGROON_PRODUCT_SEED,
  getKingroonDefaultPrice,
  getKingroonProductLines,
  getKingroonMaterialBreakdown,
} from '../_shared/kingroon-seed.ts';
import {
  enrichKingroonProduct,
  getKingroonColorHex,
  cleanKingroonTitle,
  getKingroonPrintSettings,
} from '../_shared/kingroon-defaults.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface SyncStats {
  discovered: number;
  created: number;
  updated: number;
  skipped: number;
  filtered: number;
  errors: number;
  errorDetails: string[];
}

// Safe delete threshold - must have at least this many products before deleting
const SAFE_DELETE_THRESHOLD = 50;

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  const supabase = createClient(supabaseUrl, supabaseKey);

  const stats: SyncStats = {
    discovered: 0,
    created: 0,
    updated: 0,
    skipped: 0,
    filtered: 0,
    errors: 0,
    errorDetails: [],
  };

  const startTime = Date.now();

  try {
    // Parse request - CSV-seeded brands ignore the limit parameter
    const { cleanSlate = false } = await req.json().catch(() => ({}));
    
    console.log(`[Kingroon Sync] Starting CSV-seeded sync - cleanSlate: ${cleanSlate}`);
    console.log(`[Kingroon Sync] Seed contains ${KINGROON_PRODUCT_SEED.length} products`);
    
    // Log product line breakdown
    const productLines = getKingroonProductLines();
    console.log(`[Kingroon Sync] Product lines (${productLines.length}): ${productLines.join(', ')}`);
    
    // Log material breakdown
    const materialBreakdown = getKingroonMaterialBreakdown();
    console.log('[Kingroon Sync] Material breakdown:', JSON.stringify(materialBreakdown));

    // Get brand ID
    const { data: brand } = await supabase
      .from('automated_brands')
      .select('id')
      .eq('brand_slug', 'kingroon')
      .single();

    const brandId = brand?.id || null;

    // Mark brand as scraping
    await supabase
      .from('automated_brands')
      .update({ scraping_active: true })
      .eq('brand_slug', 'kingroon');

    stats.discovered = KINGROON_PRODUCT_SEED.length;

    // ========================================================================
    // STEP 1: Clean Slate (if requested and safe)
    // ========================================================================
    if (cleanSlate && KINGROON_PRODUCT_SEED.length >= SAFE_DELETE_THRESHOLD) {
      console.log(`[Step 1] Clean slate enabled - deleting existing Kingroon products...`);
      
      const { error: deleteError } = await supabase
        .from('filaments')
        .delete()
        .ilike('vendor', 'kingroon');
      
      if (deleteError) {
        console.error('[Step 1] Delete error:', deleteError);
      } else {
        console.log(`[Step 1] Deleted existing Kingroon products`);
      }
    } else if (cleanSlate) {
      console.log(`[Step 1] Clean slate BLOCKED - seed has ${KINGROON_PRODUCT_SEED.length} products (threshold: ${SAFE_DELETE_THRESHOLD})`);
    }

    // ========================================================================
    // STEP 2: Process CSV Seed Products
    // ========================================================================
    console.log('[Step 2] Processing CSV seed products...');

    for (const seedProduct of KINGROON_PRODUCT_SEED) {
      try {
        // Generate unique product ID from URL + color
        const urlSlug = seedProduct.productUrl.split('/').pop() || '';
        const colorSlug = seedProduct.color.toLowerCase().replace(/[^a-z0-9]+/g, '-');
        const productId = `${urlSlug}_${colorSlug}`;

        // Get enrichment from defaults
        const enrichment = enrichKingroonProduct(
          seedProduct.filamentLine,
          seedProduct.color,
          seedProduct.material
        );

        // Use seed hex or fall back to enrichment lookup
        const colorHex = seedProduct.colorHex || getKingroonColorHex(seedProduct.color);

        // Generate clean product title
        const baseTitle = cleanKingroonTitle(seedProduct.filamentLine);
        const productTitle = `${baseTitle} - ${seedProduct.color}`;

        // Generate product_line_id
        const materialSlug = seedProduct.material.toLowerCase().replace(/[^a-z0-9]/g, '-');
        const lineSlug = seedProduct.filamentLine.toLowerCase()
          .replace(/^kingroon\s*/i, '')
          .replace(/\s+/g, '-')
          .replace(/[^a-z0-9-]/g, '');
        const productLineId = `kingroon__${materialSlug}__${lineSlug}`;

        // Get print settings
        const printSettings = getKingroonPrintSettings(seedProduct.material);

        // Determine high-speed capability
        const isHighSpeed = /hs[-\s]?petg|high[-\s]?speed/i.test(seedProduct.filamentLine);

        // Determine if nozzle abrasive (carbon fiber)
        const isAbrasive = /[-\s]cf\b|carbon/i.test(seedProduct.material) || 
                          /[-\s]cf\b|carbon/i.test(seedProduct.filamentLine);

        // Get default price
        const defaultPrice = getKingroonDefaultPrice(seedProduct.filamentLine);

        // Build filament record
        const filamentRecord: Record<string, unknown> = {
          product_id: productId,
          product_title: productTitle,
          vendor: 'Kingroon',
          brand_id: brandId,
          product_url: seedProduct.productUrl,
          product_handle: urlSlug,
          featured_image: seedProduct.imageUrl,
          material: seedProduct.material,
          finish_type: enrichment.finishType !== 'Standard' ? enrichment.finishType : null,
          product_line_id: productLineId,
          color_hex: colorHex,
          high_speed_capable: isHighSpeed,
          is_nozzle_abrasive: isAbrasive,
          diameter_nominal_mm: 1.75,
          net_weight_g: 1000,
          variant_price: defaultPrice,
          variant_available: true,
          last_scraped_at: new Date().toISOString(),
          sync_status: 'synced',
          auto_created: true,
          auto_updated: true,
        };

        // Add print settings if available
        if (printSettings) {
          filamentRecord.nozzle_temp_min_c = printSettings.nozzleTempMin;
          filamentRecord.nozzle_temp_max_c = printSettings.nozzleTempMax;
          filamentRecord.bed_temp_min_c = printSettings.bedTempMin;
          filamentRecord.bed_temp_max_c = printSettings.bedTempMax;
          if (printSettings.printSpeedMax) {
            filamentRecord.print_speed_max_mms = printSettings.printSpeedMax;
          }
        }

        // Check if exists (for upsert logic)
        const { data: existing } = await supabase
          .from('filaments')
          .select('id')
          .eq('product_id', productId)
          .eq('vendor', 'Kingroon')
          .maybeSingle();

        if (existing) {
          // Update existing
          const { error } = await supabase
            .from('filaments')
            .update(filamentRecord)
            .eq('id', existing.id);

          if (error) {
            console.error(`[Step 2] Update error for ${productId}:`, error);
            stats.errors++;
            stats.errorDetails.push(`${productId}: ${error.message}`);
          } else {
            stats.updated++;
          }
        } else {
          // Insert new
          const { error } = await supabase
            .from('filaments')
            .insert(filamentRecord);

          if (error) {
            console.error(`[Step 2] Insert error for ${productId}:`, error);
            stats.errors++;
            stats.errorDetails.push(`${productId}: ${error.message}`);
          } else {
            stats.created++;
          }
        }
      } catch (productError) {
        console.error(`[Step 2] Error processing ${seedProduct.color}:`, productError);
        stats.errors++;
        stats.errorDetails.push(`${seedProduct.color}: ${productError}`);
      }
    }

    console.log(`[Step 2] Complete - Created: ${stats.created}, Updated: ${stats.updated}, Errors: ${stats.errors}`);

    // ========================================================================
    // STEP 3: Fix Duplicate Hex Codes
    // ========================================================================
    console.log('[Step 3] Checking for duplicate hex codes...');

    try {
      const { data: duplicates } = await supabase
        .rpc('find_duplicate_hexes', { p_vendor: 'Kingroon' });

      if (duplicates && duplicates.length > 0) {
        console.log(`[Step 3] Found ${duplicates.length} duplicate hex entries, fixing...`);

        // Group by product_line_id and hex
        const groups = new Map<string, typeof duplicates>();
        for (const dup of duplicates) {
          const key = `${dup.product_line_id}|${dup.color_hex?.toLowerCase()}`;
          if (!groups.has(key)) {
            groups.set(key, []);
          }
          groups.get(key)!.push(dup);
        }

        // Fix each group
        for (const [, items] of groups) {
          if (items.length > 1) {
            for (let i = 1; i < items.length; i++) {
              const item = items[i];
              if (item.color_hex) {
                const hex = item.color_hex.replace('#', '');
                const r = Math.min(255, parseInt(hex.slice(0, 2), 16) + i * 3);
                const g = Math.min(255, parseInt(hex.slice(2, 4), 16) + i * 2);
                const newHex = `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${hex.slice(4)}`;

                await supabase
                  .from('filaments')
                  .update({ color_hex: newHex.toUpperCase() })
                  .eq('id', item.id);
              }
            }
          }
        }

        console.log(`[Step 3] Fixed ${groups.size} duplicate groups`);
      } else {
        console.log('[Step 3] No duplicate hex codes found');
      }
    } catch (hexError) {
      console.error('[Step 3] Error fixing duplicates:', hexError);
    }

    // ========================================================================
    // STEP 4: Update Brand Statistics
    // ========================================================================
    console.log('[Step 4] Updating brand statistics...');

    await supabase.rpc('update_brand_product_counts', { p_brand_slug: 'kingroon' });
    await supabase.rpc('update_brand_enrichment_counts', { p_brand_slug: 'kingroon' });

    // Mark brand as not scraping
    await supabase
      .from('automated_brands')
      .update({
        scraping_active: false,
        last_scrape_at: new Date().toISOString(),
      })
      .eq('brand_slug', 'kingroon');

    const duration = ((Date.now() - startTime) / 1000).toFixed(1);
    console.log(`[Kingroon Sync] Complete in ${duration}s - Created: ${stats.created}, Updated: ${stats.updated}, Errors: ${stats.errors}`);

    return new Response(JSON.stringify({
      success: true,
      brand: 'Kingroon',
      stats,
      duration: `${duration}s`,
      productLines: getKingroonProductLines(),
      materialBreakdown: getKingroonMaterialBreakdown(),
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('[Kingroon Sync] Fatal error:', error);

    // Reset scraping status on error
    await supabase
      .from('automated_brands')
      .update({ scraping_active: false })
      .eq('brand_slug', 'kingroon');

    return new Response(JSON.stringify({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      stats,
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});
