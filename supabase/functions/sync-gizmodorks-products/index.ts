/**
 * GIZMO DORKS SYNC FUNCTION
 * 
 * CSV-seeded sync pipeline for Gizmo Dorks filaments
 * Platform: BigCommerce storefront (NOT Shopify)
 * 
 * Architecture:
 * 1. Uses GIZMODORKS_PRODUCT_SEED as single source of truth (131 products)
 * 2. Enriches each product with print settings, finish type, and product line ID
 * 3. Upserts to database using product_id (vendor|material|color slug)
 * 4. Ignores UI limit parameter to always process full catalog
 * 
 * Product Lines (17):
 * - ABS Standard (33 colors)
 * - PLA Standard (41 colors)
 * - Low Odor ABS (10 colors)
 * - Silk PLA (4 colors)
 * - HIPS (12 colors)
 * - TPU (5 colors)
 * - Acetal/POM (2 colors)
 * - PETG (6 colors)
 * - Polycarbonate (3 colors)
 * - Nylon/PA (3 colors)
 * - Wood PLA (1 color)
 * - PVA (1 color)
 * - Metal Filled PLA (2 colors)
 * - Carbon Fiber PLA (1 color)
 * - PLA Pro Plus (1 color)
 * - Glitter Sparkle PLA (6 colors)
 * - Conductive (1 color)
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import {
  GIZMODORKS_PRODUCT_SEED,
  getGizmoDorksProductLineFromMaterial,
  normalizeGizmoDorksMaterialFromSeed,
  getGizmoDorksFinishFromMaterial,
  logGizmoDorksSeedStats,
  getGizmoDorksDefaultPrice,
} from '../_shared/gizmodorks-seed.ts';
import {
  enrichGizmoDocksProduct,
  getGizmoDocksColorHex,
  GIZMODORKS_STORE_INFO,
} from '../_shared/gizmodorks-defaults.ts';
import { buildFieldCoverage, createProductResult, buildSyncResponse } from '../_shared/sync-response-builder.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface SyncOptions {
  cleanSlate?: boolean;
  limit?: number;  // Ignored for CSV-seeded sync - always processes full catalog
  dryRun?: boolean;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const startTime = Date.now();
  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  const supabase = createClient(supabaseUrl, supabaseKey);

  try {
    const options: SyncOptions = await req.json().catch(() => ({}));
    const { cleanSlate = false, dryRun = false } = options;

    console.log(`[Gizmo Dorks Sync] Starting CSV-seeded sync`);
    console.log(`[Gizmo Dorks Sync] Options: cleanSlate=${cleanSlate}, dryRun=${dryRun}`);
    console.log(`[Gizmo Dorks Sync] Seed contains ${GIZMODORKS_PRODUCT_SEED.length} products`);
    
    // Log seed statistics for debugging
    logGizmoDorksSeedStats();

    // Safe Delete Pattern: Only delete if we have sufficient products to insert
    const SAFE_DELETE_THRESHOLD = 100;
    let deletedCount = 0;

    if (cleanSlate && !dryRun) {
      if (GIZMODORKS_PRODUCT_SEED.length < SAFE_DELETE_THRESHOLD) {
        throw new Error(`Safe delete aborted: Only ${GIZMODORKS_PRODUCT_SEED.length} products in seed (minimum: ${SAFE_DELETE_THRESHOLD})`);
      }

      console.log('[Gizmo Dorks Sync] Clean slate: deleting existing products...');
      const { data: deleted, error: deleteError } = await supabase
        .from('filaments')
        .delete()
        .eq('vendor', GIZMODORKS_STORE_INFO.vendor)
        .select('id');

      if (deleteError) {
        console.error('[Gizmo Dorks Sync] Delete error:', deleteError);
        throw deleteError;
      }
      
      deletedCount = deleted?.length || 0;
      console.log(`[Gizmo Dorks Sync] Deleted ${deletedCount} existing products`);
    }

    // Process all products from seed
    const productsToInsert: any[] = [];
    const productResults: any[] = [];
    let processedCount = 0;
    let errorCount = 0;

    for (const seedProduct of GIZMODORKS_PRODUCT_SEED) {
      try {
        // Generate unique product_id
        const colorSlug = seedProduct.color
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/^-|-$/g, '');
        const materialSlug = seedProduct.material
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/^-|-$/g, '');
        const productId = `gizmodorks_${materialSlug}_${colorSlug}`;

        // Get product line ID
        const productLineId = getGizmoDorksProductLineFromMaterial(seedProduct.material);

        // Normalize material
        const normalizedMaterial = normalizeGizmoDorksMaterialFromSeed(seedProduct.material);

        // Get finish type
        const finishType = getGizmoDorksFinishFromMaterial(seedProduct.material, seedProduct.color);

        // Enrich with print settings
        const enriched = enrichGizmoDocksProduct(seedProduct.title, seedProduct.color);

        // Get hex code (prefer seed, fallback to mapping)
        const colorHex = seedProduct.hexCode || 
                         getGizmoDocksColorHex(seedProduct.color) || 
                         null;

        // Determine if abrasive (CF, metal filled, wood)
        const isAbrasive = normalizedMaterial.includes('CF') || 
                           normalizedMaterial.includes('Metal') || 
                           normalizedMaterial.includes('Wood');

        // Get price from seed or default
        const variantPrice = seedProduct.priceUsd || getGizmoDorksDefaultPrice(seedProduct.material);

        // Build filament record
        const filamentRecord = {
          product_id: productId,
          product_title: seedProduct.title,
          vendor: GIZMODORKS_STORE_INFO.vendor,
          material: normalizedMaterial,
          finish_type: finishType,
          product_line_id: productLineId,
          color_hex: colorHex,
          color_family: extractColorFamily(seedProduct.color),
          variant_price: variantPrice,
          product_url: seedProduct.url,
          featured_image: seedProduct.imageUrl,
          diameter_nominal_mm: 1.75, // Primary diameter
          net_weight_g: GIZMODORKS_STORE_INFO.defaultWeight,
          nozzle_temp_min_c: enriched.nozzleTempMin,
          nozzle_temp_max_c: enriched.nozzleTempMax,
          bed_temp_min_c: enriched.bedTempMin,
          bed_temp_max_c: enriched.bedTempMax,
          print_speed_max_mms: enriched.printSpeedMax,
          is_nozzle_abrasive: isAbrasive,
          tds_url: null, // Gizmo Dorks does not provide TDS
          auto_created: true,
          auto_updated: true,
          last_scraped_at: new Date().toISOString(),
        };

        productsToInsert.push(filamentRecord);
        processedCount++;

        // Track for rich response
        productResults.push(createProductResult(
          productId,
          seedProduct.title,
          'created',
          {
            featured_image: seedProduct.imageUrl,
            variant_price: variantPrice,
            tds_url: null,
            color_hex: colorHex,
          }
        ));

      } catch (error) {
        console.error(`[Gizmo Dorks Sync] Error processing ${seedProduct.color}:`, error);
        errorCount++;
        productResults.push(createProductResult(
          `error_${seedProduct.color}`,
          seedProduct.title,
          'error',
          {},
          error instanceof Error ? error.message : 'Unknown error'
        ));
      }
    }

    console.log(`[Gizmo Dorks Sync] Prepared ${productsToInsert.length} products for upsert`);

    // Upsert products
    let upsertedCount = 0;
    const upsertErrors: string[] = [];

    if (!dryRun && productsToInsert.length > 0) {
      // Process in batches
      const batchSize = 50;
      for (let i = 0; i < productsToInsert.length; i += batchSize) {
        const batch = productsToInsert.slice(i, i + batchSize);
        
        const { data: upserted, error: upsertError } = await supabase
          .from('filaments')
          .upsert(batch, { onConflict: 'vendor,product_id' })
          .select('id');

        if (upsertError) {
          console.error(`[Gizmo Dorks Sync] Upsert error (batch ${Math.floor(i/batchSize) + 1}):`, upsertError);
          upsertErrors.push(upsertError.message);
        } else {
          upsertedCount += upserted?.length || 0;
        }
      }

      console.log(`[Gizmo Dorks Sync] Upserted ${upsertedCount} products`);
    }

    // Update automated_brands
    if (!dryRun) {
      const { error: brandError } = await supabase
        .from('automated_brands')
        .update({
          product_count: upsertedCount,
          active_product_count: upsertedCount,
          last_scrape_at: new Date().toISOString(),
        })
        .eq('brand_slug', 'gizmo-dorks');

      if (brandError) {
        console.warn('[Gizmo Dorks Sync] Failed to update automated_brands:', brandError);
      }

      // Fix duplicate hex codes
      try {
        await supabase.rpc('find_duplicate_hexes', {
          p_vendor: GIZMODORKS_STORE_INFO.vendor
        });
        console.log('[Gizmo Dorks Sync] Duplicate hex check completed');
      } catch (e) {
        console.warn('[Gizmo Dorks Sync] Could not check for duplicate hexes:', e);
      }
    }

    // Build field coverage stats
    const fieldCoverage = await buildFieldCoverage(supabase, GIZMODORKS_STORE_INFO.vendor);

    const durationMs = Date.now() - startTime;

    // Build rich response
    const response = buildSyncResponse(
      true,
      durationMs,
      {
        totalDiscovered: GIZMODORKS_PRODUCT_SEED.length,
        created: cleanSlate ? upsertedCount : 0,
        updated: cleanSlate ? 0 : upsertedCount,
        skipped: 0,
        errors: errorCount,
      },
      productResults,
      fieldCoverage
    );

    console.log(`[Gizmo Dorks Sync] Completed in ${Math.round(durationMs / 1000)}s`);
    console.log(`[Gizmo Dorks Sync] Stats: ${upsertedCount} upserted, ${deletedCount} deleted, ${errorCount} errors`);

    return new Response(JSON.stringify(response), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('[Gizmo Dorks Sync] Fatal error:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Extract color family from color name for grouping
 */
function extractColorFamily(color: string): string | null {
  const lower = color.toLowerCase();
  
  const families: Record<string, string[]> = {
    'Black': ['black', 'conductive'],
    'White': ['white', 'natural', 'clear', 'bone'],
    'Grey': ['grey', 'gray', 'silver'],
    'Red': ['red', 'lava', 'pink', 'rose', 'hot pink'],
    'Blue': ['blue', 'navy', 'sky'],
    'Green': ['green', 'grass', 'lime'],
    'Yellow': ['yellow', 'gold'],
    'Orange': ['orange'],
    'Purple': ['purple', 'violet'],
    'Brown': ['brown', 'bronze', 'copper', 'beige', 'wood'],
    'Special': ['glow', 'fluorescent', 'color change', 'translucent', 'glitter', 'silk'],
  };

  for (const [family, keywords] of Object.entries(families)) {
    for (const keyword of keywords) {
      if (lower.includes(keyword)) {
        return family;
      }
    }
  }

  return null;
}
