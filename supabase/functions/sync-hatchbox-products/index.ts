import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import {
  HATCHBOX_PRODUCT_SEED,
  getFilteredHatchboxSeed,
  getHatchboxSeedStats,
} from '../_shared/hatchbox-seed.ts';
import {
  normalizeHatchboxMaterial,
  getHatchboxPrintSettings,
  getHatchboxTdsUrl,
  HATCHBOX_STORE_INFO,
} from '../_shared/hatchbox-defaults.ts';
import {
  buildFieldCoverage,
  createProductResult,
  buildSyncResponse,
  type SyncProductResult,
} from '../_shared/sync-response-builder.ts';

// ============================================================================
// CONSTANTS
// ============================================================================

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Safe delete threshold - prevent accidental data loss
const SAFE_DELETE_THRESHOLD = 50;

// ============================================================================
// TYPES
// ============================================================================

interface StepResult {
  step: string;
  success: boolean;
  count?: number;
  details?: string;
  error?: string;
}

interface SyncStats {
  discovered: number;
  created: number;
  updated: number;
  skipped: number;
  errors: number;
}

// ============================================================================
// MAIN HANDLER
// ============================================================================

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const startTime = Date.now();
  const stepResults: StepResult[] = [];
  const allProducts: SyncProductResult[] = [];
  const stats: SyncStats = { discovered: 0, created: 0, updated: 0, skipped: 0, errors: 0 };

  try {
    console.log('='.repeat(60));
    console.log('[Hatchbox] CSV-Seeded Sync Pipeline Started');
    console.log('='.repeat(60));

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Parse options - IGNORE limit parameter for CSV-seeded brands
    let options = { cleanSlate: false };
    try {
      const body = await req.json();
      options = { cleanSlate: body.cleanSlate ?? false };
      // Intentionally ignoring 'limit' - process entire curated catalog
      if (body.limit) {
        console.log('[Hatchbox] Ignoring limit parameter - CSV-seeded brands process full catalog');
      }
    } catch {
      // No body or invalid JSON, use defaults
    }

    // Step 1: Get seed stats
    const seedStats = getHatchboxSeedStats();
    const filteredSeed = getFilteredHatchboxSeed();
    stats.discovered = filteredSeed.length;
    
    console.log(`[Step 1] CSV Seed Stats: ${seedStats.totalProducts} products, ${seedStats.productLines} lines`);
    console.log(`[Step 1] Materials: ${seedStats.materials.join(', ')}`);
    console.log(`[Step 1] Finish Types: ${seedStats.finishTypes.join(', ')}`);
    stepResults.push({
      step: 'load_seed',
      success: true,
      count: filteredSeed.length,
      details: `${seedStats.productLines} product lines, ${seedStats.materials.length} materials`,
    });

    // Step 2: Get brand ID
    const { data: brand } = await supabase
      .from('automated_brands')
      .select('id')
      .eq('brand_slug', 'hatchbox')
      .maybeSingle();

    const brandId = brand?.id || null;
    console.log(`[Step 2] Brand ID: ${brandId || 'not found'}`);

    // Mark brand as syncing
    if (brandId) {
      await supabase
        .from('automated_brands')
        .update({ scraping_active: true })
        .eq('id', brandId);
    }

    // Step 3: Clean slate with safe threshold
    if (options.cleanSlate) {
      console.log('[Step 3] Clean slate requested - checking safety threshold...');
      
      if (filteredSeed.length < SAFE_DELETE_THRESHOLD) {
        console.warn(`[Step 3] Seed has only ${filteredSeed.length} products, below threshold of ${SAFE_DELETE_THRESHOLD}`);
        console.warn('[Step 3] Skipping clean slate to prevent data loss');
        stepResults.push({
          step: 'clean_slate',
          success: false,
          error: `Seed too small (${filteredSeed.length} < ${SAFE_DELETE_THRESHOLD}), skipped to prevent data loss`,
        });
      } else {
        const { data: deleted } = await supabase
          .from('filaments')
          .delete()
          .eq('vendor', 'Hatchbox')
          .select('id');

        const deletedCount = deleted?.length || 0;
        console.log(`[Step 3] Deleted ${deletedCount} existing products`);
        stepResults.push({ step: 'clean_slate', success: true, count: deletedCount });
      }
    } else {
      stepResults.push({ step: 'clean_slate', success: true, count: 0, details: 'skipped' });
    }

    // Step 3.5: Fetch live prices from Shopify API
    console.log('[Step 3.5] Fetching live prices from Shopify API...');
    const handlePriceMap = new Map<string, number>();
    try {
      let page = 1;
      while (true) {
        const res = await fetch(
          `${HATCHBOX_STORE_INFO.productsJsonUrl}?limit=250&page=${page}`,
          { headers: { 'User-Agent': 'FilaScope-Sync/1.0' } }
        );
        if (!res.ok) { console.warn(`[Step 3.5] Shopify returned ${res.status}`); break; }
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
      console.log(`[Step 3.5] Fetched prices for ${handlePriceMap.size} products`);
    } catch (err) {
      console.warn('[Step 3.5] Price fetch failed — will use $27.99 fallback:', err);
    }

    // Step 4: Process each seed entry
    console.log(`[Step 4] Processing ${filteredSeed.length} products from CSV seed...`);

    for (const seedEntry of filteredSeed) {
      try {
        // Generate product_id from URL
        const urlPath = new URL(seedEntry.url).pathname;
        const productHandle = urlPath.split('/').pop() || '';
        const productId = `hatchbox-${productHandle}`;

        // Get print settings based on material
        const printSettings = getHatchboxPrintSettings(seedEntry.material);
        const tdsUrl = getHatchboxTdsUrl(seedEntry.material);

        // Generate product_line_id
        const productLineId = `hatchbox__${seedEntry.material.toLowerCase().replace(/[+]/g, '-plus').replace(/-95a/g, '')}__${seedEntry.filamentLine.split('-').slice(1).join('-') || 'standard'}`;

        // Build filament record using seed data directly
        const filamentData = {
          product_id: productId,
          product_title: seedEntry.title,
          product_handle: productHandle,
          vendor: HATCHBOX_STORE_INFO.vendor,
          brand_id: brandId,
          product_url: seedEntry.url,
          featured_image: seedEntry.imageUrl,
          material: seedEntry.material,
          finish_type: seedEntry.finishType,
          product_line_id: productLineId,
          color_hex: seedEntry.hexCode,
          high_speed_capable: seedEntry.highSpeedCapable,
          diameter_nominal_mm: seedEntry.diameter,
          net_weight_g: 1000, // Standard 1kg spool
          tds_url: tdsUrl,
          nozzle_temp_min_c: printSettings?.nozzle_temp_min_c || null,
          nozzle_temp_max_c: printSettings?.nozzle_temp_max_c || null,
          bed_temp_min_c: printSettings?.bed_temp_min_c || null,
          bed_temp_max_c: printSettings?.bed_temp_max_c || null,
          variant_price: handlePriceMap.get(productHandle) ?? 27.99,
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
          // Update existing
          const { error } = await supabase
            .from('filaments')
            .update(filamentData)
            .eq('id', existing.id);

          if (error) {
            console.error(`[Step 4] Error updating ${seedEntry.title}:`, error.message);
            stats.errors++;
            allProducts.push(createProductResult(productId, seedEntry.title, 'error', filamentData, error.message));
          } else {
            stats.updated++;
            allProducts.push(createProductResult(productId, seedEntry.title, 'updated', filamentData));
          }
        } else {
          // Insert new
          const { error } = await supabase
            .from('filaments')
            .insert(filamentData);

          if (error) {
            console.error(`[Step 4] Error inserting ${seedEntry.title}:`, error.message);
            stats.errors++;
            allProducts.push(createProductResult(productId, seedEntry.title, 'error', filamentData, error.message));
          } else {
            stats.created++;
            allProducts.push(createProductResult(productId, seedEntry.title, 'created', filamentData));
          }
        }
      } catch (err) {
        console.error(`[Step 4] Exception processing ${seedEntry.title}:`, err);
        stats.errors++;
        allProducts.push(createProductResult(
          `error-${seedEntry.url}`,
          seedEntry.title,
          'error',
          {},
          err instanceof Error ? err.message : String(err)
        ));
      }
    }

    console.log(`[Step 4] Upsert complete: ${stats.created} created, ${stats.updated} updated, ${stats.errors} errors`);
    stepResults.push({
      step: 'upsert',
      success: stats.errors === 0,
      count: stats.created + stats.updated,
      details: `${stats.created} created, ${stats.updated} updated, ${stats.errors} errors`,
    });

    // Step 5: Fix duplicate hex codes within product lines
    console.log('[Step 5] Checking for duplicate hex codes...');
    try {
      const { data: duplicates } = await supabase.rpc('find_duplicate_hexes', {
        p_vendor: 'Hatchbox',
      });

      if (duplicates && duplicates.length > 0) {
        console.log(`[Step 5] Found ${duplicates.length} products with duplicate hex codes`);

        // Group by product_line_id and color_hex
        const groups = new Map<string, any[]>();
        for (const dup of duplicates) {
          const key = `${dup.product_line_id}:${dup.color_hex?.toLowerCase()}`;
          if (!groups.has(key)) {
            groups.set(key, []);
          }
          groups.get(key)!.push(dup);
        }

        let fixed = 0;
        for (const [, items] of groups) {
          if (items.length <= 1) continue;

          // Skip first item, adjust others
          for (let i = 1; i < items.length; i++) {
            const item = items[i];
            const originalHex = item.color_hex;

            if (!originalHex) continue;

            // Slightly adjust the hex code
            const r = parseInt(originalHex.slice(1, 3), 16);
            const g = parseInt(originalHex.slice(3, 5), 16);
            const b = parseInt(originalHex.slice(5, 7), 16);

            const newR = Math.min(255, r + i);
            const newHex = `#${newR.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`.toUpperCase();

            const { error: updateError } = await supabase
              .from('filaments')
              .update({ color_hex: newHex })
              .eq('id', item.id);

            if (!updateError) {
              fixed++;
              console.log(`[Step 5] Fixed duplicate: ${item.product_title} (${originalHex} -> ${newHex})`);
            }
          }
        }

        stepResults.push({ step: 'fix_duplicates', success: true, count: fixed });
      } else {
        console.log('[Step 5] No duplicate hex codes found');
        stepResults.push({ step: 'fix_duplicates', success: true, count: 0 });
      }
    } catch (err) {
      console.error('[Step 5] Error fixing duplicates:', err);
      stepResults.push({ step: 'fix_duplicates', success: false, error: String(err) });
    }

    // Step 6: Update brand stats
    console.log('[Step 6] Updating brand statistics...');
    try {
      if (brandId) {
        await supabase
          .from('automated_brands')
          .update({
            platform_type: 'shopify',
            base_url: HATCHBOX_STORE_INFO.baseUrl,
            has_api: true,
            scraping_enabled: true,
            scraping_active: false,
            last_scrape_at: new Date().toISOString(),
            products_created: stats.created,
            products_updated: stats.updated,
            notes: 'CSV-seeded sync pipeline. Popular consumer filament brand with Shopify store.',
          })
          .eq('id', brandId);

        await supabase.rpc('update_brand_product_counts', { p_brand_slug: 'hatchbox' });
        await supabase.rpc('update_brand_enrichment_counts', { p_brand_slug: 'hatchbox' });
      }
      stepResults.push({ step: 'update_stats', success: true });
    } catch (err) {
      console.error('[Step 6] Error updating stats:', err);
      stepResults.push({ step: 'update_stats', success: false, error: String(err) });
    }

    // Step 7: Build field coverage
    const fieldCoverage = await buildFieldCoverage(supabase, 'Hatchbox');

    const duration = Date.now() - startTime;
    console.log('='.repeat(60));
    console.log(`[Hatchbox] Sync Complete in ${duration}ms`);
    console.log(`[Hatchbox] Created: ${stats.created}, Updated: ${stats.updated}, Errors: ${stats.errors}`);
    console.log('='.repeat(60));

    // Build rich response
    const response = buildSyncResponse(
      true,
      duration,
      {
        totalDiscovered: stats.discovered,
        created: stats.created,
        updated: stats.updated,
        skipped: stats.skipped,
        errors: stats.errors,
      },
      allProducts,
      fieldCoverage,
      stepResults
    );

    return new Response(
      JSON.stringify(response),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (err) {
    const error = err instanceof Error ? err.message : String(err);
    console.error('[Hatchbox] Sync failed:', error);

    // Mark brand as not syncing on error
    try {
      const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
      const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
      const supabase = createClient(supabaseUrl, supabaseKey);
      await supabase
        .from('automated_brands')
        .update({ scraping_active: false })
        .eq('brand_slug', 'hatchbox');
    } catch {
      // Ignore cleanup errors
    }

    return new Response(
      JSON.stringify({
        success: false,
        duration_ms: Date.now() - startTime,
        results: stepResults,
        products: allProducts,
        error,
        summary: {
          totalDiscovered: stats.discovered,
          created: stats.created,
          updated: stats.updated,
          skipped: stats.skipped,
          errors: stats.errors + 1,
        },
        fieldCoverage: {
          images: { count: 0, percent: 0 },
          prices: { count: 0, percent: 0 },
          tds: { count: 0, percent: 0 },
          colors: { count: 0, percent: 0 },
          mpn: { count: 0, percent: 0 },
          specifications: { count: 0, percent: 0 },
        },
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});
