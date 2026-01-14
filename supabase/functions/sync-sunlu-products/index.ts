// Sunlu CSV-Seeded Sync Pipeline
// Uses inline seed data instead of Shopify API for consistent, high-fidelity product catalog
//
// Architecture: CSV-seeded sync with Safe Delete pattern (~100+ products, 20+ lines)
// Region: US only (consolidated from multi-region variants)

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import {
  enrichSunluProduct,
  SUNLU_TDS_URL,
} from '../_shared/sunlu-defaults.ts';
import {
  SUNLU_PRODUCT_SEED,
  SUNLU_EXPECTED_CARD_COUNT,
  getSunluColorHexFromSeed,
  type SunluSeedProduct,
} from '../_shared/sunlu-seed.ts';

// ============================================================================
// INTERFACES
// ============================================================================

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

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const VENDOR_NAME = 'Sunlu';

// Safe Delete threshold - only delete all if we have enough valid products
const SUNLU_SAFE_DELETE_THRESHOLD = 50;

// ============================================================================
// STEP 1: LOAD SEED DATA
// ============================================================================

function loadSeedProducts(): SunluSeedProduct[] {
  console.log('[Step 1] Loading Sunlu seed products...');
  console.log(`[Step 1] Complete: ${SUNLU_PRODUCT_SEED.length} products from CSV seed`);
  return SUNLU_PRODUCT_SEED;
}

// ============================================================================
// STEP 2: UPSERT WITH ENRICHMENTS
// ============================================================================

async function upsertSeedProducts(
  supabase: any,
  seedProducts: SunluSeedProduct[],
  brandId: string | null
): Promise<SyncResult> {
  console.log('[Step 2] Upserting seed products with enrichments...');
  
  let created = 0;
  let updated = 0;
  let errors = 0;
  
  // Create a unique key for each color variant to avoid duplicates
  const processedKeys = new Set<string>();
  
  for (const seedProduct of seedProducts) {
    try {
      // Generate unique product ID based on product line and color
      const productId = `sunlu-seed-${seedProduct.productLineId}-${seedProduct.color.toLowerCase().replace(/\s+/g, '-').replace(/\+/g, '-')}`;
      
      // Skip if we've already processed this exact combo
      if (processedKeys.has(productId)) {
        continue;
      }
      processedKeys.add(productId);
      
      // Enrich with Sunlu-specific data
      const enrichment = enrichSunluProduct(seedProduct.name, seedProduct.color);
      
      // Use seed hex (already formatted with #) or get from extended mapping
      const colorHex = seedProduct.colorHex || getSunluColorHexFromSeed(seedProduct.color);
      
      // Check if exists
      const { data: existing } = await supabase
        .from('filaments')
        .select('id')
        .eq('product_id', productId)
        .maybeSingle();
      
      const filamentData = {
        product_id: productId,
        product_title: seedProduct.name,
        product_handle: seedProduct.productUrl.split('/products/')[1] || seedProduct.name.toLowerCase().replace(/\s+/g, '-'),
        vendor: VENDOR_NAME,
        brand_id: brandId,
        material: seedProduct.material,
        finish_type: seedProduct.finishType,
        product_line_id: seedProduct.productLineId,
        color_hex: colorHex,
        color_family: getColorFamily(seedProduct.color),
        variant_price: null, // CSV seed doesn't have prices - they come from live API if needed
        variant_compare_at_price: null,
        variant_available: true,
        variant_sku: null,
        featured_image: seedProduct.imageUrl,
        product_url: seedProduct.productUrl,
        net_weight_g: seedProduct.weight,
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
      console.error(`[Step 2] Error processing ${seedProduct.name} - ${seedProduct.color}:`, err);
      errors++;
    }
  }
  
  console.log(`[Step 2] Complete: ${created} created, ${updated} updated, ${errors} errors`);
  
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
// STEP 3: TDS URL ASSIGNMENT (verification step)
// ============================================================================

async function verifyTdsUrls(supabase: any): Promise<SyncResult> {
  console.log('[Step 3] Verifying TDS URLs...');
  
  // Update any Sunlu products missing TDS URL
  const { error } = await supabase
    .from('filaments')
    .update({ tds_url: SUNLU_TDS_URL })
    .ilike('vendor', 'sunlu')
    .is('tds_url', null);
  
  if (error) {
    console.error('[Step 3] Error updating TDS URLs:', error);
    return {
      step: 'tds_assignment',
      success: false,
      message: error.message,
    };
  }
  
  console.log('[Step 3] Complete: TDS URLs verified/assigned');
  
  return {
    step: 'tds_assignment',
    success: true,
    message: `TDS URL assigned: ${SUNLU_TDS_URL}`,
  };
}

// ============================================================================
// STEP 4: FIX DUPLICATE HEX CODES
// ============================================================================

async function fixDuplicateHexCodes(supabase: any): Promise<SyncResult> {
  console.log('[Step 4] Fixing duplicate hex codes...');
  
  // Find duplicates using RPC
  const { data: duplicates, error } = await supabase
    .rpc('find_duplicate_hexes', { p_vendor: 'Sunlu' });
  
  if (error) {
    console.error('[Step 4] Error finding duplicates:', error);
    return {
      step: 'fix_hex_duplicates',
      success: false,
      message: error.message,
    };
  }
  
  if (!duplicates || duplicates.length === 0) {
    console.log('[Step 4] No duplicate hex codes found');
    return {
      step: 'fix_hex_duplicates',
      success: true,
      updated: 0,
    };
  }
  
  console.log(`[Step 4] Found ${duplicates.length} products with duplicate hex codes`);
  
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
  
  console.log(`[Step 4] Complete: ${fixed} hex codes adjusted`);
  
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

Deno.serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: CORS_HEADERS });
  }
  
  const startTime = Date.now();
  
  try {
    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    // Parse options from request body
    let options = {
      cleanSlate: false,
      skipTds: false,
    };
    
    try {
      const body = await req.json();
      options = { ...options, ...body };
    } catch {
      // No body or invalid JSON, use defaults
    }
    
    console.log('[Sunlu Sync] Starting CSV-seeded sync with options:', options);
    console.log(`[Sunlu Sync] Expected product lines: ${SUNLU_EXPECTED_CARD_COUNT}`);
    
    // Get brand ID
    const { data: brand } = await supabase
      .from('automated_brands')
      .select('id')
      .eq('brand_slug', 'sunlu')
      .maybeSingle();
    
    const brandId = brand?.id || null;
    console.log('[Sunlu Sync] Brand ID:', brandId);
    
    const results: SyncResult[] = [];
    
    // Step 1: Load seed products
    const seedProducts = loadSeedProducts();
    results.push({
      step: 'load_seed',
      success: true,
      created: seedProducts.length,
      message: `Loaded ${seedProducts.length} products from CSV seed`,
    });
    
    // Safe Delete Pattern: If clean slate OR we have enough valid variants
    if (options.cleanSlate || seedProducts.length >= SUNLU_SAFE_DELETE_THRESHOLD) {
      console.log(`[Sunlu Sync] Performing safe delete (${seedProducts.length} products >= ${SUNLU_SAFE_DELETE_THRESHOLD} threshold)...`);
      const { error: deleteError, count } = await supabase
        .from('filaments')
        .delete()
        .ilike('vendor', 'sunlu');
      
      if (deleteError) {
        console.error('[Sunlu Sync] Delete error:', deleteError);
      } else {
        console.log(`[Sunlu Sync] Deleted ${count || 'all'} existing Sunlu products`);
      }
    }
    
    // Step 2: Upsert with enrichments
    if (seedProducts.length > 0) {
      const upsertResult = await upsertSeedProducts(supabase, seedProducts, brandId);
      results.push(upsertResult);
    }
    
    // Step 3: Verify TDS URLs
    if (!options.skipTds) {
      const tdsResult = await verifyTdsUrls(supabase);
      results.push(tdsResult);
    }
    
    // Step 4: Fix duplicate hex codes
    const hexResult = await fixDuplicateHexCodes(supabase);
    results.push(hexResult);
    
    // Calculate totals
    const duration = Date.now() - startTime;
    const totalCreated = results.reduce((sum, r) => sum + (r.created || 0), 0);
    const totalUpdated = results.reduce((sum, r) => sum + (r.updated || 0), 0);
    const totalErrors = results.reduce((sum, r) => sum + (r.errors || 0), 0);
    
    // Get product line distribution for logging
    const productLines = new Set(seedProducts.map(p => p.productLineId));
    console.log(`[Sunlu Sync] Product lines: ${productLines.size}`);
    console.log(`[Sunlu Sync] Complete in ${duration}ms`);
    console.log(`[Sunlu Sync] Summary: ${totalCreated} created, ${totalUpdated} updated, ${totalErrors} errors`);
    
    return new Response(
      JSON.stringify({
        success: totalErrors === 0,
        duration_ms: duration,
        results,
        summary: {
          products_loaded: seedProducts.length,
          product_lines: productLines.size,
          created: totalCreated,
          updated: totalUpdated,
          errors: totalErrors,
        },
      }),
      {
        headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('[Sunlu Sync] Fatal error:', error);
    
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        duration_ms: Date.now() - startTime,
      }),
      {
        status: 500,
        headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
      }
    );
  }
});
