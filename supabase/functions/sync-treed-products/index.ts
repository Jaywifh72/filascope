/**
 * TreeD Filaments Sync Pipeline (CSV-Seeded Architecture)
 * 
 * Uses curated seed data from treed-seed.ts as PRIMARY source.
 * No live scraping - seed data is authoritative.
 * 
 * Pipeline:
 * 1. Load seed data (210 variants, 47 product lines)
 * 2. Filter consumer products (no bulk, no 2.85mm, no samples)
 * 3. Apply enrichments (material, print settings, color hex)
 * 4. Safe delete + batch insert
 * 5. Fix duplicate hex codes
 * 6. Update brand stats
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import {
  TREED_SEED_DATA,
  TREED_COLOR_HEX_MAP,
  TreeDSeedProduct,
  convertEurToUsd,
  getTreeDProductLines,
  TREED_STATS,
} from '../_shared/treed-seed.ts';
import {
  enrichTreeDProduct,
  isTreeDFilament,
} from '../_shared/treed-defaults.ts';
import {
  createSyncLog,
  updateSyncProgress,
  completeSyncLog,
  createImmediateResponse,
  runInBackground,
  createProgressUpdater,
} from '../_shared/background-sync.ts';

// ============================================================================
// CONSTANTS
// ============================================================================

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const VENDOR_NAME = 'TreeD';
const BRAND_SLUG = 'treed-filaments';
const SAFE_DELETE_THRESHOLD = 50;

// ============================================================================
// TYPES
// ============================================================================

interface SyncStats {
  productsProcessed: number;
  variantsFound: number;
  created: number;
  updated: number;
  errors: number;
  skipped: number;
}

// ============================================================================
// STEP 1: FILTER CONSUMER PRODUCTS
// ============================================================================

function filterConsumerProducts(products: TreeDSeedProduct[]): TreeDSeedProduct[] {
  console.log(`Step 1: Filtering ${products.length} seed products for consumer catalog...`);
  
  const filtered = products.filter(p => {
    // No bulk products (>5.5kg)
    if (p.weight > 5500) {
      console.log(`  Skipping bulk: ${p.name} (${p.weight}g)`);
      return false;
    }
    
    // No sample products (<300g)
    if (p.weight < 300) {
      console.log(`  Skipping sample: ${p.name} (${p.weight}g)`);
      return false;
    }
    
    // NOTE: All seed data IS filament by definition - no isTreeDFilament check needed
    // The seed is curated and only contains valid filament products
    
    return true;
  });
  
  console.log(`Step 1 complete: ${filtered.length} consumer products (filtered ${products.length - filtered.length})`);
  return filtered;
}

// ============================================================================
// STEP 2: TRANSFORM SEED TO DATABASE FORMAT
// ============================================================================

function transformSeedToVariants(
  products: TreeDSeedProduct[],
  brandId: string | null
): any[] {
  console.log(`Step 2: Transforming ${products.length} seed products to database format...`);
  
  const variants: any[] = [];
  
  for (const product of products) {
    // Generate unique product ID
    const colorSlug = product.color.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
    const productId = `treed-${product.sku.toLowerCase()}-${colorSlug}`;
    
    // Enrich with brand-specific defaults
    const enrichment = enrichTreeDProduct(product.name, product.color, product.material);
    
    // Get color hex from seed or map
    const colorHex = product.colorHex || 
                     TREED_COLOR_HEX_MAP[product.color.toLowerCase()] || 
                     enrichment.colorHex ||
                     '808080';
    
    // Convert EUR to USD
    const priceUsd = convertEurToUsd(product.basePrice);
    
    variants.push({
      product_id: productId,
      product_title: enrichment.cleanedTitle || product.name,
      vendor: VENDOR_NAME,
      brand_id: brandId,
      material: enrichment.material || product.material,
      finish_type: enrichment.finishType || 'Standard',
      product_line_id: product.productLineId,
      color_hex: colorHex.startsWith('#') ? colorHex : `#${colorHex}`,
      variant_price: priceUsd,
      product_url: product.productUrl,
      featured_image: product.imageUrl,
      net_weight_g: product.weight,
      diameter_nominal_mm: 1.75, // All TreeD consumer products are 1.75mm
      is_nozzle_abrasive: enrichment.isAbrasive || false,
      nozzle_temp_min_c: enrichment.printSettings?.nozzleTempMin || null,
      nozzle_temp_max_c: enrichment.printSettings?.nozzleTempMax || null,
      bed_temp_min_c: enrichment.printSettings?.bedTempMin || null,
      bed_temp_max_c: enrichment.printSettings?.bedTempMax || null,
      variant_sku: product.sku,
      mpn: product.sku,
      auto_created: true,
      auto_updated: true,
      last_scraped_at: new Date().toISOString(),
      sync_status: 'synced',
    });
  }
  
  console.log(`Step 2 complete: Transformed ${variants.length} variants`);
  return variants;
}

// ============================================================================
// STEP 3: SAFE DELETE + BATCH INSERT
// ============================================================================

async function safeDeleteAndInsert(
  supabase: any,
  variants: any[],
  stats: SyncStats
): Promise<void> {
  console.log(`Step 3: Safe delete and batch insert (${variants.length} variants)...`);
  
  // Validate we have enough products
  if (variants.length < SAFE_DELETE_THRESHOLD) {
    console.warn(`Only ${variants.length} variants - below safe delete threshold (${SAFE_DELETE_THRESHOLD})`);
    console.warn('Aborting to prevent data loss. Check seed data.');
    stats.errors++;
    return;
  }
  
  // Delete existing TreeD products (use ILIKE with wildcards for proper matching)
  const { error: deleteError, count: deleteCount } = await supabase
    .from('filaments')
    .delete()
    .ilike('vendor', '%treed%')
    .select('id', { count: 'exact' });
  
  if (deleteError) {
    console.error('Delete error:', deleteError.message);
    stats.errors++;
    return;
  }
  
  console.log(`Deleted ${deleteCount || 0} existing TreeD products`);
  
  // Batch insert (50 at a time)
  const batchSize = 50;
  for (let i = 0; i < variants.length; i += batchSize) {
    const batch = variants.slice(i, i + batchSize);
    
    const { error: insertError } = await supabase
      .from('filaments')
      .insert(batch);
    
    if (insertError) {
      console.error(`Insert batch ${i / batchSize + 1} error:`, insertError.message);
      stats.errors += batch.length;
    } else {
      stats.created += batch.length;
    }
    
    stats.productsProcessed += batch.length;
  }
  
  console.log(`Step 3 complete: Created ${stats.created}, Errors ${stats.errors}`);
}

// ============================================================================
// STEP 4: FIX DUPLICATE HEX CODES
// ============================================================================

async function fixDuplicateHexCodes(supabase: any): Promise<number> {
  console.log('Step 4: Checking for duplicate hex codes...');
  
  // Find duplicates within same product line
  const { data: duplicates, error: rpcError } = await supabase
    .rpc('find_duplicate_hexes', { p_vendor: VENDOR_NAME });
  
  if (rpcError) {
    console.log('No duplicate hex RPC or no duplicates found');
    return 0;
  }
  
  if (!duplicates || duplicates.length === 0) {
    console.log('No duplicate hex codes found');
    return 0;
  }
  
  console.log(`Found ${duplicates.length} duplicates to fix`);
  
  // Group by product_line_id + hex
  const groups: Record<string, any[]> = {};
  for (const dup of duplicates) {
    const key = `${dup.product_line_id}:${dup.color_hex?.toLowerCase()}`;
    if (!groups[key]) groups[key] = [];
    groups[key].push(dup);
  }
  
  let fixedCount = 0;
  
  for (const [key, items] of Object.entries(groups)) {
    // Skip the first one (keep original), fix the rest
    for (let i = 1; i < items.length; i++) {
      const item = items[i];
      const originalHex = item.color_hex || '#808080';
      
      // Generate a slightly different hex
      const hexNum = parseInt(originalHex.replace('#', ''), 16);
      const newHexNum = (hexNum + i * 17) & 0xFFFFFF;
      const newHex = `#${newHexNum.toString(16).padStart(6, '0').toUpperCase()}`;
      
      const { error: updateError } = await supabase
        .from('filaments')
        .update({ color_hex: newHex })
        .eq('id', item.id);
      
      if (!updateError) {
        fixedCount++;
      }
    }
  }
  
  console.log(`Step 4 complete: Fixed ${fixedCount} duplicate hex codes`);
  return fixedCount;
}

// ============================================================================
// STEP 5: UPDATE BRAND STATS
// ============================================================================

async function updateBrandStats(supabase: any, brandId: string | null): Promise<void> {
  console.log('Step 5: Updating brand statistics...');
  
  if (!brandId) {
    console.log('No brand ID, skipping stats update');
    return;
  }
  
  // Get counts
  const { count: productCount } = await supabase
    .from('filaments')
    .select('*', { count: 'exact', head: true })
    .ilike('vendor', 'treed');
  
  const { count: withPrices } = await supabase
    .from('filaments')
    .select('*', { count: 'exact', head: true })
    .ilike('vendor', 'treed')
    .not('variant_price', 'is', null);
  
  const { count: withImages } = await supabase
    .from('filaments')
    .select('*', { count: 'exact', head: true })
    .ilike('vendor', 'treed')
    .not('featured_image', 'is', null);
  
  const { count: withHex } = await supabase
    .from('filaments')
    .select('*', { count: 'exact', head: true })
    .ilike('vendor', 'treed')
    .not('color_hex', 'is', null);
  
  // Update brand
  const { error: updateError } = await supabase
    .from('automated_brands')
    .update({
      product_count: productCount || 0,
      active_product_count: productCount || 0,
      products_with_prices: withPrices || 0,
      products_with_images: withImages || 0,
      products_with_color_hex: withHex || 0,
      last_scrape_at: new Date().toISOString(),
    })
    .eq('id', brandId);
  
  if (updateError) {
    console.error('Brand stats update error:', updateError.message);
  } else {
    console.log(`Step 5 complete: Updated brand stats (${productCount} products)`);
  }
}

// ============================================================================
// MAIN SYNC FUNCTION
// ============================================================================

async function runTreeDSync(
  supabase: any,
  syncLogId: string | null,
  options: { cleanSlate?: boolean; limit?: number }
): Promise<SyncStats> {
  const stats: SyncStats = {
    productsProcessed: 0,
    variantsFound: TREED_SEED_DATA.length,
    created: 0,
    updated: 0,
    errors: 0,
    skipped: 0,
  };
  
  const startTime = Date.now();
  
  // Create progress updater
  const updateProgress = createProgressUpdater(supabase, syncLogId || undefined, () => stats);
  
  try {
    // Get brand ID
    const { data: brand } = await supabase
      .from('automated_brands')
      .select('id')
      .or('brand_slug.ilike.treed,brand_slug.ilike.treed-filaments')
      .maybeSingle();
    
    const brandId = brand?.id || null;
    console.log('Brand ID:', brandId);
    
    // Step 1: Filter consumer products
    await updateProgress('Filtering products', 0, 5, 'Applying consumer filters...');
    const filteredProducts = filterConsumerProducts(TREED_SEED_DATA);
    stats.skipped = TREED_SEED_DATA.length - filteredProducts.length;
    
    // Step 2: Transform to database format
    await updateProgress('Transforming data', 1, 5, `Processing ${filteredProducts.length} products...`);
    const variants = transformSeedToVariants(filteredProducts, brandId);
    
    // Step 3: Safe delete and insert
    await updateProgress('Syncing database', 2, 5, `Inserting ${variants.length} variants...`);
    await safeDeleteAndInsert(supabase, variants, stats);
    
    // Step 4: Fix duplicate hex codes
    await updateProgress('Fixing duplicates', 3, 5, 'Resolving hex collisions...');
    await fixDuplicateHexCodes(supabase);
    
    // Step 5: Update brand stats
    await updateProgress('Updating stats', 4, 5, 'Finalizing...');
    await updateBrandStats(supabase, brandId);
    
    // Complete
    await updateProgress('Complete', 5, 5, `Synced ${stats.created} products`);
    
    const duration = ((Date.now() - startTime) / 1000).toFixed(1);
    console.log('='.repeat(60));
    console.log(`TreeD Sync Complete in ${duration}s`);
    console.log(`Stats: ${JSON.stringify(stats)}`);
    console.log('='.repeat(60));
    
    // Complete sync log
    if (syncLogId) {
      await completeSyncLog(supabase, syncLogId, {
        status: 'completed',
        discovered: TREED_SEED_DATA.length,
        created: stats.created,
        updated: stats.updated,
        failed: stats.errors,
        durationSeconds: Math.round((Date.now() - startTime) / 1000),
      });
    }
    
  } catch (error) {
    console.error('Sync error:', error);
    stats.errors++;
    
    if (syncLogId) {
      await supabase
        .from('brand_sync_logs')
        .update({
          status: 'failed',
          error_details: { message: error instanceof Error ? error.message : 'Unknown error' },
          completed_at: new Date().toISOString(),
        })
        .eq('id', syncLogId);
    }
  }
  
  return stats;
}

// ============================================================================
// MAIN HANDLER
// ============================================================================

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: CORS_HEADERS });
  }

  console.log('='.repeat(60));
  console.log('TreeD Filaments Sync Started (CSV-Seeded)');
  console.log(`Seed data: ${TREED_STATS.totalVariants} variants, ${TREED_STATS.productLines} product lines`);
  console.log('='.repeat(60));

  try {
    // Parse options
    let options = { cleanSlate: true, limit: 250 };
    try {
      const body = await req.json();
      options = { ...options, ...body };
    } catch {
      // No body, use defaults
    }

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Create sync log for background tracking
    const { syncLogId, error: logError } = await createSyncLog(
      supabase,
      BRAND_SLUG,
      'clean_slate'
    );
    
    if (logError) {
      console.error('Failed to create sync log:', logError);
    }
    
    // Return immediate response with job ID
    const response = createImmediateResponse(VENDOR_NAME, syncLogId, options);
    
    // Run sync in background
    runInBackground(
      runTreeDSync(supabase, syncLogId, options).then(() => {}),
      BRAND_SLUG
    );

    return response;
    
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('Sync failed:', message);
    
    return new Response(
      JSON.stringify({
        success: false,
        error: message,
        vendor: VENDOR_NAME,
      }),
      { status: 500, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } }
    );
  }
});
