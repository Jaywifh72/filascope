// Sunlu Shopify API Sync Pipeline
// Fetches products from live store.sunlu.com API with enrichment from defaults
//
// Architecture: Live Shopify API with enrichment, Safe Delete pattern, and Background Sync

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import {
  enrichSunluProduct,
  SUNLU_TDS_URL,
  getSunluDefaultPrice,
} from '../_shared/sunlu-defaults.ts';
import {
  SUNLU_EXPECTED_CARD_COUNT,
  getSunluColorHexFromSeed,
  isSunluExcludedProduct,
  extractRegionFromVariant,
  normalizeSunluMaterialFromTitle,
  generateSunluProductLineId,
} from '../_shared/sunlu-seed.ts';
import {
  createSyncLog,
  completeSyncLog,
  createImmediateResponse,
  runInBackground,
  corsHeaders,
} from '../_shared/background-sync.ts';

// ============================================================================
// INTERFACES
// ============================================================================

interface ShopifyProduct {
  id: number;
  title: string;
  handle: string;
  vendor: string;
  product_type: string;
  images: { src: string }[];
  variants: ShopifyVariant[];
}

interface ShopifyVariant {
  id: number;
  title: string;
  price: string;
  compare_at_price: string | null;
  available: boolean;
  sku: string | null;
}

interface ProcessedVariant {
  productId: string;
  title: string;
  handle: string;
  color: string;
  material: string;
  productLineId: string;
  finishType: string;
  price: number | null;
  compareAtPrice: number | null;
  available: boolean;
  imageUrl: string | null;
  productUrl: string;
  colorHex: string | null;
  sku: string | null;
}

interface SyncResult {
  step: string;
  success: boolean;
  created?: number;
  updated?: number;
  skipped?: number;
  errors?: number;
  message?: string;
}

// ============================================================================
// CONSTANTS
// ============================================================================

const VENDOR_NAME = 'Sunlu';
const SHOPIFY_BASE_URL = 'https://store.sunlu.com';

// Safe Delete threshold - only delete all if we have enough valid products
const SUNLU_SAFE_DELETE_THRESHOLD = 50;

// ============================================================================
// STEP 1: FETCH FROM SHOPIFY API
// ============================================================================

async function fetchShopifyProducts(): Promise<ShopifyProduct[]> {
  console.log('[Step 1] Fetching products from Shopify API...');
  
  const products: ShopifyProduct[] = [];
  let page = 1;
  const limit = 250;
  
  while (true) {
    const url = `${SHOPIFY_BASE_URL}/products.json?limit=${limit}&page=${page}`;
    console.log(`[Step 1] Fetching page ${page}...`);
    
    try {
      const response = await fetch(url, {
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'Filascope-Sync/1.0',
        },
      });
      
      if (!response.ok) {
        console.error(`[Step 1] HTTP error: ${response.status}`);
        break;
      }
      
      const data = await response.json();
      
      if (!data.products || data.products.length === 0) {
        console.log(`[Step 1] No more products on page ${page}`);
        break;
      }
      
      products.push(...data.products);
      console.log(`[Step 1] Got ${data.products.length} products from page ${page}`);
      
      if (data.products.length < limit) {
        break; // Last page
      }
      
      page++;
      
      // Rate limiting
      await new Promise(resolve => setTimeout(resolve, 300));
    } catch (error) {
      console.error(`[Step 1] Fetch error on page ${page}:`, error);
      break;
    }
  }
  
  console.log(`[Step 1] Complete: ${products.length} total products fetched`);
  return products;
}

// ============================================================================
// STEP 2: EXPLODE VARIANTS WITH REGION FILTERING
// ============================================================================

function explodeVariants(products: ShopifyProduct[]): ProcessedVariant[] {
  console.log('[Step 2] Exploding variants with region filtering...');
  
  const variants: ProcessedVariant[] = [];
  const seenKeys = new Set<string>();
  let skippedNonFilament = 0;
  let skippedNonUS = 0;
  let skippedDuplicates = 0;
  
  for (const product of products) {
    // Skip non-filament products
    if (isSunluExcludedProduct(product.title)) {
      skippedNonFilament++;
      continue;
    }
    
    // Get primary image
    const imageUrl = product.images?.[0]?.src || null;
    
    // Detect material from product title
    const material = normalizeSunluMaterialFromTitle(product.title);
    
    for (const variant of product.variants) {
      // Parse region from variant title: "Ship to USA / Color"
      const { region, color } = extractRegionFromVariant(variant.title);
      
      // Only include US region to avoid 4x duplicates
      if (region !== 'US') {
        skippedNonUS++;
        continue;
      }
      
      // Check if variant itself should be excluded
      if (isSunluExcludedProduct(product.title, variant.title)) {
        skippedNonFilament++;
        continue;
      }
      
      // Create unique key to prevent duplicates (by handle + color)
      const normalizedColor = color.toLowerCase().replace(/\s+/g, '-').replace(/\+/g, '-');
      const key = `${product.handle}-${normalizedColor}`;
      
      if (seenKeys.has(key)) {
        skippedDuplicates++;
        continue;
      }
      seenKeys.add(key);
      
      // Generate product line ID
      const productLineId = generateSunluProductLineId(product.title, material);
      
      // Get enrichment data
      const enrichment = enrichSunluProduct(product.title, color);
      
      // Parse price - use live price from API
      const rawPrice = parseFloat(variant.price);
      const price = !isNaN(rawPrice) && rawPrice > 0 ? rawPrice : getSunluDefaultPrice(material);
      
      const compareAtPrice = variant.compare_at_price 
        ? parseFloat(variant.compare_at_price) 
        : null;
      
      // Get color hex from our curated mapping
      const colorHex = getSunluColorHexFromSeed(color) || enrichment.colorHex;
      
      variants.push({
        productId: `sunlu-${product.id}-${variant.id}`,
        title: product.title,
        handle: product.handle,
        color: color,
        material: material,
        productLineId: productLineId,
        finishType: enrichment.finishType,
        price: price,
        compareAtPrice: !isNaN(compareAtPrice!) ? compareAtPrice : null,
        available: variant.available,
        imageUrl: imageUrl,
        productUrl: `${SHOPIFY_BASE_URL}/products/${product.handle}`,
        colorHex: colorHex,
        sku: variant.sku,
      });
    }
  }
  
  console.log(`[Step 2] Complete: ${variants.length} variants processed`);
  console.log(`[Step 2] Skipped: ${skippedNonFilament} non-filament, ${skippedNonUS} non-US, ${skippedDuplicates} duplicates`);
  
  return variants;
}

// ============================================================================
// STEP 3: UPSERT WITH ENRICHMENTS
// ============================================================================

async function upsertVariants(
  supabase: any,
  variants: ProcessedVariant[],
  brandId: string | null
): Promise<SyncResult> {
  console.log('[Step 3] Upserting variants with enrichments...');
  
  let created = 0;
  let updated = 0;
  let errors = 0;
  
  for (const variant of variants) {
    try {
      // Get enrichment data for print settings
      const enrichment = enrichSunluProduct(variant.title, variant.color);
      
      // Check if exists
      const { data: existing } = await supabase
        .from('filaments')
        .select('id')
        .eq('product_id', variant.productId)
        .maybeSingle();
      
      const filamentData = {
        product_id: variant.productId,
        product_title: variant.title,
        product_handle: variant.handle,
        vendor: VENDOR_NAME,
        brand_id: brandId,
        material: variant.material,
        finish_type: variant.finishType,
        product_line_id: variant.productLineId,
        color_hex: variant.colorHex,
        color_family: getColorFamily(variant.color),
        variant_price: variant.price,
        variant_compare_at_price: variant.compareAtPrice,
        variant_available: variant.available,
        variant_sku: variant.sku,
        featured_image: variant.imageUrl,
        product_url: variant.productUrl,
        net_weight_g: 1000,
        diameter_nominal_mm: 1.75,
        nozzle_temp_min_c: enrichment.printSettings?.nozzleTempMin || null,
        nozzle_temp_max_c: enrichment.printSettings?.nozzleTempMax || null,
        bed_temp_min_c: enrichment.printSettings?.bedTempMin || null,
        bed_temp_max_c: enrichment.printSettings?.bedTempMax || null,
        is_nozzle_abrasive: enrichment.isAbrasive,
        tds_url: SUNLU_TDS_URL,
        auto_created: true,
        auto_updated: true,
        last_scraped_at: new Date().toISOString(),
        sync_status: 'synced',
      };
      
      if (existing) {
        const { error } = await supabase
          .from('filaments')
          .update(filamentData)
          .eq('id', existing.id);
        
        if (error) throw error;
        updated++;
      } else {
        const { error } = await supabase
          .from('filaments')
          .insert(filamentData);
        
        if (error) throw error;
        created++;
      }
    } catch (err) {
      console.error(`[Step 3] Error processing ${variant.title} - ${variant.color}:`, err);
      errors++;
    }
  }
  
  console.log(`[Step 3] Complete: ${created} created, ${updated} updated, ${errors} errors`);
  
  return {
    step: 'upsert',
    success: errors === 0,
    created,
    updated,
    errors,
  };
}

/**
 * Derive color family from color name
 */
function getColorFamily(colorName: string): string | null {
  const lower = colorName.toLowerCase();
  
  if (/black/i.test(lower)) return 'Black';
  if (/white|bone|ivory|ceramic/i.test(lower)) return 'White';
  if (/gr[ea]y|silver/i.test(lower)) return 'Grey';
  if (/red|cherry|maroon|wine|burgundy/i.test(lower)) return 'Red';
  if (/blue|navy|azure|cobalt|ocean|sky|klein/i.test(lower)) return 'Blue';
  if (/green|olive|forest|grass|mint|army|jade|lime/i.test(lower)) return 'Green';
  if (/yellow|lemon|gold|champagne|sunny/i.test(lower)) return 'Yellow';
  if (/orange|copper|bronze/i.test(lower)) return 'Orange';
  if (/pink|rose|sakura|salmon|coral/i.test(lower)) return 'Pink';
  if (/purple|violet|lavender|plum|magenta/i.test(lower)) return 'Purple';
  if (/brown|chocolate|coffee|tan|wood|walnut|oak|mahogany/i.test(lower)) return 'Brown';
  if (/natural|beige|cream|skin|nude/i.test(lower)) return 'Natural';
  if (/transparent|clear|translucent/i.test(lower)) return 'Clear';
  if (/cyan|teal|turquoise|aqua/i.test(lower)) return 'Cyan';
  if (/glow/i.test(lower)) return 'Glow';
  if (/rainbow|multicolor/i.test(lower)) return 'Rainbow';
  
  return null;
}

// ============================================================================
// STEP 4: TDS URL ASSIGNMENT (verification step)
// ============================================================================

async function verifyTdsUrls(supabase: any): Promise<SyncResult> {
  console.log('[Step 4] Verifying TDS URLs...');
  
  // Update any Sunlu products missing TDS URL
  const { error } = await supabase
    .from('filaments')
    .update({ tds_url: SUNLU_TDS_URL })
    .ilike('vendor', 'sunlu')
    .is('tds_url', null);
  
  if (error) {
    console.error('[Step 4] Error updating TDS URLs:', error);
    return {
      step: 'tds_assignment',
      success: false,
      message: error.message,
    };
  }
  
  console.log('[Step 4] Complete: TDS URLs verified/assigned');
  
  return {
    step: 'tds_assignment',
    success: true,
    message: `TDS URL assigned: ${SUNLU_TDS_URL}`,
  };
}

// ============================================================================
// STEP 5: FIX DUPLICATE HEX CODES
// ============================================================================

async function fixDuplicateHexCodes(supabase: any): Promise<SyncResult> {
  console.log('[Step 5] Fixing duplicate hex codes...');
  
  // Find duplicates using RPC
  const { data: duplicates, error } = await supabase
    .rpc('find_duplicate_hexes', { p_vendor: 'Sunlu' });
  
  if (error) {
    console.error('[Step 5] Error finding duplicates:', error);
    return {
      step: 'fix_hex_duplicates',
      success: false,
      message: error.message,
    };
  }
  
  if (!duplicates || duplicates.length === 0) {
    console.log('[Step 5] No duplicate hex codes found');
    return {
      step: 'fix_hex_duplicates',
      success: true,
      updated: 0,
    };
  }
  
  console.log(`[Step 5] Found ${duplicates.length} products with duplicate hex codes`);
  
  // Group by product_line_id and color_hex
  const groups = new Map<string, typeof duplicates>();
  for (const dup of duplicates) {
    const key = `${dup.product_line_id}-${dup.color_hex?.toLowerCase()}`;
    if (!groups.has(key)) {
      groups.set(key, []);
    }
    groups.get(key)!.push(dup);
  }
  
  let fixed = 0;
  
  for (const [_key, items] of groups) {
    if (items.length <= 1) continue;
    
    // Keep first one as-is, adjust others slightly
    for (let i = 1; i < items.length; i++) {
      const item = items[i];
      const baseHex = item.color_hex || '#808080';
      
      // Adjust the hex slightly
      const adjusted = adjustHexSlightly(baseHex, i);
      
      const { error: updateError } = await supabase
        .from('filaments')
        .update({ color_hex: adjusted })
        .eq('id', item.id);
      
      if (!updateError) {
        fixed++;
      }
    }
  }
  
  console.log(`[Step 5] Complete: ${fixed} hex codes adjusted`);
  
  return {
    step: 'fix_hex_duplicates',
    success: true,
    updated: fixed,
  };
}

function adjustHexSlightly(hex: string, offset: number): string {
  // Remove # if present
  const clean = hex.replace('#', '');
  
  // Parse RGB
  let r = parseInt(clean.substring(0, 2), 16);
  let g = parseInt(clean.substring(2, 4), 16);
  let b = parseInt(clean.substring(4, 6), 16);
  
  // Adjust each channel slightly based on offset
  r = Math.min(255, Math.max(0, r + (offset * 3)));
  g = Math.min(255, Math.max(0, g + (offset * 2)));
  b = Math.min(255, Math.max(0, b + (offset * 1)));
  
  // Convert back to hex
  return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`.toUpperCase();
}

// ============================================================================
// MAIN HANDLER
// ============================================================================

// ============================================================================
// BACKGROUND SYNC WORKER
// ============================================================================

async function runSyncInBackground(
  supabase: any,
  syncLogId: string | null,
  options: { cleanSlate: boolean; skipTds: boolean; dryRun: boolean }
): Promise<void> {
  const startTime = Date.now();
  let created = 0;
  let updated = 0;
  let errors = 0;
  let variantsProcessed = 0;
  
  try {
    console.log('[Sunlu Sync] Starting Shopify API sync with options:', options);
    console.log(`[Sunlu Sync] Expected product lines: ${SUNLU_EXPECTED_CARD_COUNT}`);
    
    // Get brand ID
    const { data: brand } = await supabase
      .from('automated_brands')
      .select('id')
      .eq('brand_slug', 'sunlu')
      .maybeSingle();
    
    const brandId = brand?.id || null;
    console.log('[Sunlu Sync] Brand ID:', brandId);
    
    // Step 1: Fetch from Shopify API
    const products = await fetchShopifyProducts();
    
    // Step 2: Explode variants with region filtering
    const variants = explodeVariants(products);
    variantsProcessed = variants.length;
    
    // Safe Delete Pattern: If clean slate OR we have enough valid variants
    if (options.cleanSlate || variants.length >= SUNLU_SAFE_DELETE_THRESHOLD) {
      console.log(`[Sunlu Sync] Performing safe delete (${variants.length} variants >= ${SUNLU_SAFE_DELETE_THRESHOLD} threshold)...`);
      const { error: deleteError } = await supabase
        .from('filaments')
        .delete()
        .ilike('vendor', 'sunlu');
      
      if (deleteError) {
        console.error('[Sunlu Sync] Delete error:', deleteError);
      } else {
        console.log('[Sunlu Sync] Deleted all existing Sunlu products');
      }
    }
    
    // Step 3: Upsert with enrichments
    if (variants.length > 0 && !options.dryRun) {
      const upsertResult = await upsertVariants(supabase, variants, brandId);
      created = upsertResult.created || 0;
      updated = upsertResult.updated || 0;
      errors = upsertResult.errors || 0;
    }
    
    // Step 4: Verify TDS URLs
    if (!options.skipTds && !options.dryRun) {
      await verifyTdsUrls(supabase);
    }
    
    // Step 5: Fix duplicate hex codes
    if (!options.dryRun) {
      await fixDuplicateHexCodes(supabase);
    }
    
    // Get product line distribution for logging
    const productLines = new Set(variants.map(v => v.productLineId));
    const duration = Math.round((Date.now() - startTime) / 1000);
    
    console.log(`[Sunlu Sync] Product lines: ${productLines.size}`);
    console.log(`[Sunlu Sync] Complete in ${duration}s`);
    console.log(`[Sunlu Sync] Summary: ${created} created, ${updated} updated, ${errors} errors`);
    
    // Complete sync log
    if (syncLogId) {
      await completeSyncLog(supabase, syncLogId, {
        status: errors === 0 ? 'completed' : 'partial',
        created,
        updated,
        discovered: variantsProcessed,
        failed: errors,
        durationSeconds: duration,
        successDetails: {
          products_fetched: products.length,
          variants_processed: variantsProcessed,
          product_lines: productLines.size,
        },
      });
    }
  } catch (error) {
    console.error('[Sunlu Sync] Fatal error:', error);
    
    // Mark sync as failed
    if (syncLogId) {
      await completeSyncLog(supabase, syncLogId, {
        status: 'failed',
        created,
        updated,
        discovered: variantsProcessed,
        failed: errors + 1,
        durationSeconds: Math.round((Date.now() - startTime) / 1000),
        errorDetails: {
          message: error instanceof Error ? error.message : 'Unknown error',
        },
      });
    }
  }
}

// ============================================================================
// MAIN HANDLER
// ============================================================================

Deno.serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }
  
  try {
    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    // Parse options from request body
    let options = {
      cleanSlate: false,
      skipTds: false,
      dryRun: false,
    };
    
    try {
      const body = await req.json();
      options = { ...options, ...body };
    } catch {
      // No body or invalid JSON, use defaults
    }
    
    // Create sync log for tracking
    const { syncLogId, error: logError } = await createSyncLog(
      supabase,
      'sunlu',
      options.cleanSlate ? 'clean_slate' : 'incremental'
    );
    
    if (logError) {
      console.warn('[Sunlu Sync] Could not create sync log:', logError.message);
    }
    
    // Run sync in background using EdgeRuntime.waitUntil
    const syncPromise = runSyncInBackground(supabase, syncLogId, options);
    runInBackground(syncPromise, 'sunlu');
    
    // Return immediately with job ID
    return createImmediateResponse('Sunlu', syncLogId, options);
  } catch (error) {
    console.error('[Sunlu Sync] Handler error:', error);
    
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
