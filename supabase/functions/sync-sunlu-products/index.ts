// Sunlu Full Sync Pipeline
// 5-step process: Fetch -> Explode Variants -> Upsert with Enrichments -> Assign TDS -> Fix Duplicate Hex
//
// Sunlu uses Shopify (store.sunlu.com)
// Enhanced with CSV-seeded architecture for high-fidelity sync

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import {
  shouldIncludeVariant,
  createFilterStats,
  updateFilterStats,
  logFilterStats,
} from '../_shared/variant-filters.ts';
import {
  enrichSunluProduct,
  getSunluColorHex,
  parseSunluVariant,
  isSunluFilament,
  SUNLU_TDS_URL,
} from '../_shared/sunlu-defaults.ts';
import {
  SUNLU_EXTENDED_HEX_MAP,
  SUNLU_EXCLUDED_PATTERNS,
  extractRegionFromVariant,
  normalizeSunluMaterialFromTitle,
  generateSunluProductLineId,
  getSunluColorHexFromSeed,
  isSunluExcludedProduct,
} from '../_shared/sunlu-seed.ts';

// ============================================================================
// INTERFACES
// ============================================================================

interface ShopifyProduct {
  id: number;
  title: string;
  handle: string;
  product_type: string;
  vendor: string;
  tags: string[];
  variants: ShopifyVariant[];
  images: ShopifyImage[];
  published_at: string;
}

interface ShopifyVariant {
  id: number;
  product_id: number;
  title: string;
  price: string;
  compare_at_price: string | null;
  sku: string;
  available: boolean;
  option1: string | null;
  option2: string | null;
  option3: string | null;
}

interface ShopifyImage {
  id: number;
  src: string;
  position: number;
  variant_ids: number[];
}

interface ProductVariant {
  productId: string;
  variantId: string;
  title: string;
  handle: string;
  color: string | null;
  weight: number | null;
  price: number | null;
  compareAtPrice: number | null;
  available: boolean;
  sku: string | null;
  imageUrl: string | null;
  productUrl: string;
  shipFrom: string | null;
  region: string;
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

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const SHOPIFY_BASE_URL = 'https://store.sunlu.com';
const VENDOR_NAME = 'Sunlu';

// Safe Delete threshold - only delete all if we have enough valid products
const SUNLU_SAFE_DELETE_THRESHOLD = 150;

// Material prefixes to strip for color extraction
const SUNLU_MATERIAL_PREFIXES = [
  'PLA\\+', 'PLA Plus', 'PLA-Meta', 'PLA Meta', 'High Speed PLA', 'HS_PLA', 'HS-PLA',
  'Matte PLA', 'Silk PLA', 'SILK', 'Marble PLA', 'Wood PLA', 'Glow PLA', 'Luminous PLA',
  'Dual-Color Matte', 'Dual Color Matte', 'Dual-Color Silk', 'Dual Color Silk',
  'PETG', 'High Speed Matte PETG', 'Matte PETG', 'HS Matte PETG',
  'ABS', 'ABS-FR', 'ABS-GF', 'E-ABS', 'Easy ABS',
  'TPU 90A', 'TPU 95A', 'TPU',
  'PA6-CF', 'PA12-CF', 'Easy PA', 'PA-CF',
  'PETG-CF', 'PLA-CF',
  'PC-ABS', 'PC', 'PP', 'PEEK',
  'ASA', 'PVA', 'HIPS'
];

// ============================================================================
// STEP 1: FETCH PRODUCTS FROM SHOPIFY
// ============================================================================

async function fetchShopifyProducts(): Promise<ShopifyProduct[]> {
  console.log('[Step 1] Fetching products from Sunlu Shopify...');
  
  const allProducts: ShopifyProduct[] = [];
  let page = 1;
  const limit = 250;
  
  while (true) {
    const url = `${SHOPIFY_BASE_URL}/products.json?limit=${limit}&page=${page}`;
    console.log(`[Step 1] Fetching page ${page}...`);
    
    const response = await fetch(url, {
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'FilamentFinder/1.0',
      },
    });
    
    if (!response.ok) {
      throw new Error(`Failed to fetch Shopify products: ${response.status}`);
    }
    
    const data = await response.json();
    const products: ShopifyProduct[] = data.products || [];
    
    if (products.length === 0) {
      break;
    }
    
    // Filter to filament products only using enhanced exclusion patterns
    const filamentProducts = products.filter(p => {
      // First check enhanced exclusion patterns
      if (isSunluExcludedProduct(p.title)) {
        console.log(`[Step 1] Excluding non-filament: ${p.title}`);
        return false;
      }
      // Then use the standard check
      return isSunluFilament(p);
    });
    
    allProducts.push(...filamentProducts);
    
    console.log(`[Step 1] Page ${page}: ${products.length} total, ${filamentProducts.length} filaments`);
    
    if (products.length < limit) {
      break;
    }
    
    page++;
    
    // Rate limiting
    await new Promise(resolve => setTimeout(resolve, 500));
  }
  
  console.log(`[Step 1] Complete: ${allProducts.length} filament products fetched`);
  return allProducts;
}

// ============================================================================
// STEP 2: EXPLODE VARIANTS (Enhanced with region filtering)
// ============================================================================

function explodeVariants(products: ShopifyProduct[]): ProductVariant[] {
  console.log('[Step 2] Exploding variants with enhanced region/color extraction...');
  
  const variants: ProductVariant[] = [];
  const seenColorWeightCombos = new Map<string, ProductVariant>();
  const filterStats = createFilterStats();
  
  let skippedNonUS = 0;
  let skippedExcluded = 0;
  
  for (const product of products) {
    // Double-check exclusion at product level
    if (isSunluExcludedProduct(product.title)) {
      skippedExcluded++;
      console.log(`[Step 2] Skipping excluded product: ${product.title}`);
      continue;
    }
    
    // Check for 2.85mm diameter at product level
    const is285 = product.title.includes('2.85') || product.title.includes('3mm');
    
    for (const variant of product.variants) {
      // Check variant-level exclusion (e.g., "Ship to EU / 10KG Bundle")
      if (isSunluExcludedProduct(product.title, variant.title)) {
        skippedExcluded++;
        continue;
      }
      
      // Enhanced: Parse region and color from variant title using new function
      const { region, color: extractedColor } = extractRegionFromVariant(variant.title);
      
      // Only include US region to avoid duplicate products across regions
      if (region !== 'US') {
        skippedNonUS++;
        continue;
      }
      
      // Clean color by stripping material prefixes
      const cleanedColor = extractSunluColor(extractedColor || variant.option1 || '');
      
      // Parse variant title for additional data
      const parsed = parseSunluVariant(variant.title);
      const color = cleanedColor || parsed.color || null;
      const weight = parsed.weight || extractWeightFromTitle(product.title, variant.title);
      
      // Apply standard filtering (samples, bulk, 2.85mm, excluded keywords)
      const filterResult = shouldIncludeVariant(weight || 1000, is285 ? 2.85 : 1.75, product.title);
      updateFilterStats(filterStats, filterResult);
      if (!filterResult.include) {
        console.log(`[Step 2] Filtering: ${product.title} - ${color} (${filterResult.reason})`);
        continue;
      }
      
      // Find matching image
      let imageUrl: string | null = null;
      const variantImage = product.images.find(img => img.variant_ids.includes(variant.id));
      if (variantImage) {
        imageUrl = variantImage.src;
      } else if (product.images.length > 0) {
        imageUrl = product.images[0].src;
      }
      
      // Create unique key for color+weight combo (consolidate regions)
      const comboKey = `${product.id}-${color?.toLowerCase() || 'default'}-${weight || 1000}`;
      
      const productVariant: ProductVariant = {
        productId: `sunlu-${product.id}-${variant.id}`,
        variantId: String(variant.id),
        title: product.title,
        handle: product.handle,
        color,
        weight: weight || 1000,
        price: parseFloat(variant.price) || null,
        compareAtPrice: variant.compare_at_price ? parseFloat(variant.compare_at_price) : null,
        available: variant.available,
        sku: variant.sku || null,
        imageUrl,
        productUrl: `${SHOPIFY_BASE_URL}/products/${product.handle}`,
        shipFrom: parsed.shipFrom,
        region,
      };
      
      // Keep the first occurrence (US preferred)
      if (!seenColorWeightCombos.has(comboKey)) {
        seenColorWeightCombos.set(comboKey, productVariant);
        variants.push(productVariant);
      }
    }
  }
  
  logFilterStats('Sunlu', filterStats);
  console.log(`[Step 2] Region filtering: ${skippedNonUS} non-US variants skipped`);
  console.log(`[Step 2] Exclusion filtering: ${skippedExcluded} excluded products skipped`);
  console.log(`[Step 2] Complete: ${variants.length} unique US variants extracted`);
  return variants;
}

/**
 * Extract clean color by stripping material prefixes
 */
function extractSunluColor(variantColor: string): string {
  let color = variantColor.trim();
  
  // Strip material prefixes
  for (const prefix of SUNLU_MATERIAL_PREFIXES) {
    const regex = new RegExp(`^${prefix}\\s*[\\|\\-\\/]?\\s*`, 'i');
    color = color.replace(regex, '');
  }
  
  // Strip weight suffix
  color = color.replace(/\s*\d+(?:\.\d+)?\s*(?:kg|g)\s*$/i, '');
  
  // Strip region prefix if still present (e.g., "US / Black" -> "Black")
  color = color.replace(/^(?:US|USA|EU|CA|AU)\s*[\/\-]\s*/i, '');
  
  return color.trim();
}

function extractWeightFromTitle(productTitle: string, variantTitle: string): number | null {
  const combined = `${productTitle} ${variantTitle}`.toLowerCase();
  
  // Check for kg values
  const kgMatch = combined.match(/(\d+(?:\.\d+)?)\s*kg/i);
  if (kgMatch) {
    return parseFloat(kgMatch[1]) * 1000;
  }
  
  // Check for g values
  const gMatch = combined.match(/(\d+)\s*g(?:ram)?/i);
  if (gMatch) {
    return parseInt(gMatch[1]);
  }
  
  // Default to 1kg
  return 1000;
}

// ============================================================================
// STEP 3: UPSERT WITH ENRICHMENTS (Enhanced with seed-based hex mapping)
// ============================================================================

async function upsertVariants(
  supabase: any,
  variants: ProductVariant[],
  brandId: string | null
): Promise<SyncResult> {
  console.log('[Step 3] Upserting variants with enhanced enrichments...');
  
  let created = 0;
  let updated = 0;
  let errors = 0;
  
  for (const variant of variants) {
    try {
      // Enrich with Sunlu-specific data
      const enrichment = enrichSunluProduct(variant.title, variant.color || undefined);
      
      // Enhanced: Get color hex with priority: seed mapping > enrichment > default
      const colorHex = getSunluColorHexFromSeed(variant.color || '') 
        || enrichment.colorHex 
        || getSunluColorHex(variant.color || '')
        || getExtendedHexMapping(variant.color || '');
      
      // Enhanced: Generate product line ID with new function
      const normalizedMaterial = normalizeSunluMaterialFromTitle(variant.title);
      const productLineId = generateSunluProductLineId(variant.title, normalizedMaterial)
        || enrichment.productLineId;
      
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
        material: normalizedMaterial || enrichment.material,
        finish_type: enrichment.finishType,
        product_line_id: productLineId,
        color_hex: colorHex,
        variant_price: variant.price,
        variant_compare_at_price: variant.compareAtPrice,
        variant_available: variant.available,
        variant_sku: variant.sku,
        featured_image: variant.imageUrl,
        product_url: variant.productUrl,
        net_weight_g: variant.weight,
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
      console.error(`[Step 3] Error processing ${variant.productId}:`, err);
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
 * Fallback hex mapping using SUNLU_EXTENDED_HEX_MAP
 */
function getExtendedHexMapping(colorName: string): string | null {
  if (!colorName) return null;
  
  const normalized = colorName.toLowerCase().trim();
  
  // Direct lookup
  if (SUNLU_EXTENDED_HEX_MAP[normalized]) {
    return '#' + SUNLU_EXTENDED_HEX_MAP[normalized];
  }
  
  // Try partial match
  for (const [key, hex] of Object.entries(SUNLU_EXTENDED_HEX_MAP)) {
    if (normalized.includes(key) || key.includes(normalized)) {
      return '#' + hex;
    }
  }
  
  return null;
}

// ============================================================================
// STEP 4: TDS URL ASSIGNMENT (verification step)
// ============================================================================

async function verifyTdsUrls(supabase: any): Promise<SyncResult> {
  console.log('[Step 4] Verifying TDS URLs...');
  
  // Update any Sunlu products missing TDS URL
  const { data, error } = await supabase
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
  
  for (const [key, items] of groups) {
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
      skipFetch: false,
      skipTds: false,
    };
    
    try {
      const body = await req.json();
      options = { ...options, ...body };
    } catch {
      // No body or invalid JSON, use defaults
    }
    
    console.log('[Sunlu Sync] Starting with options:', options);
    
    // Get brand ID
    const { data: brand } = await supabase
      .from('automated_brands')
      .select('id')
      .eq('brand_slug', 'sunlu')
      .maybeSingle();
    
    const brandId = brand?.id || null;
    console.log('[Sunlu Sync] Brand ID:', brandId);
    
    const results: SyncResult[] = [];
    
    // Step 1: Fetch products
    let products: ShopifyProduct[] = [];
    if (!options.skipFetch) {
      products = await fetchShopifyProducts();
      results.push({
        step: 'fetch',
        success: true,
        created: products.length,
        message: `Fetched ${products.length} filament products from Shopify`,
      });
    }
    
    // Step 2: Explode variants
    let variants: ProductVariant[] = [];
    if (products.length > 0) {
      variants = explodeVariants(products);
      results.push({
        step: 'explode_variants',
        success: true,
        created: variants.length,
        message: `Exploded into ${variants.length} unique US-region variants`,
      });
    }
    
    // Safe Delete Pattern: If clean slate OR we have enough valid variants
    if (options.cleanSlate || variants.length >= SUNLU_SAFE_DELETE_THRESHOLD) {
      console.log(`[Sunlu Sync] Performing safe delete (${variants.length} variants >= ${SUNLU_SAFE_DELETE_THRESHOLD} threshold)...`);
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
    
    // Step 3: Upsert with enrichments
    if (variants.length > 0) {
      const upsertResult = await upsertVariants(supabase, variants, brandId);
      results.push(upsertResult);
    }
    
    // Step 4: Verify TDS URLs
    if (!options.skipTds) {
      const tdsResult = await verifyTdsUrls(supabase);
      results.push(tdsResult);
    }
    
    // Step 5: Fix duplicate hex codes
    const hexResult = await fixDuplicateHexCodes(supabase);
    results.push(hexResult);
    
    // Calculate totals
    const duration = Date.now() - startTime;
    const totalCreated = results.reduce((sum, r) => sum + (r.created || 0), 0);
    const totalUpdated = results.reduce((sum, r) => sum + (r.updated || 0), 0);
    const totalErrors = results.reduce((sum, r) => sum + (r.errors || 0), 0);
    
    console.log(`[Sunlu Sync] Complete in ${duration}ms`);
    console.log(`[Sunlu Sync] Summary: ${totalCreated} created, ${totalUpdated} updated, ${totalErrors} errors`);
    
    return new Response(
      JSON.stringify({
        success: totalErrors === 0,
        duration_ms: duration,
        results,
        summary: {
          products_fetched: products.length,
          variants_exploded: variants.length,
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
