// Sunlu Full Sync Pipeline
// 5-step process: Fetch -> Explode Variants -> Upsert with Enrichments -> Assign TDS -> Fix Duplicate Hex
//
// Sunlu uses Shopify (store.sunlu.com)

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import {
  enrichSunluProduct,
  getSunluColorHex,
  parseSunluVariant,
  isSunluFilament,
  SUNLU_TDS_URL,
} from '../_shared/sunlu-defaults.ts';

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
    
    // Filter to filament products only
    const filamentProducts = products.filter(p => isSunluFilament(p));
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
// STEP 2: EXPLODE VARIANTS
// ============================================================================

function explodeVariants(products: ShopifyProduct[]): ProductVariant[] {
  console.log('[Step 2] Exploding variants...');
  
  const variants: ProductVariant[] = [];
  const seenColorWeightCombos = new Map<string, ProductVariant>();
  
  for (const product of products) {
    for (const variant of product.variants) {
      // Parse variant title (e.g., "Red / US" or "Black / 1KG")
      const parsed = parseSunluVariant(variant.title);
      
      // Also check option1/option2 for color
      const color = parsed.color || variant.option1 || null;
      const weight = parsed.weight || extractWeightFromTitle(product.title, variant.title);
      
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
      };
      
      // Keep the first occurrence (usually US or primary warehouse)
      if (!seenColorWeightCombos.has(comboKey)) {
        seenColorWeightCombos.set(comboKey, productVariant);
        variants.push(productVariant);
      }
    }
  }
  
  console.log(`[Step 2] Complete: ${variants.length} unique variants extracted`);
  return variants;
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
// STEP 3: UPSERT WITH ENRICHMENTS
// ============================================================================

async function upsertVariants(
  supabase: any,
  variants: ProductVariant[],
  brandId: string | null
): Promise<SyncResult> {
  console.log('[Step 3] Upserting variants with enrichments...');
  
  let created = 0;
  let updated = 0;
  let errors = 0;
  
  for (const variant of variants) {
    try {
      // Enrich with Sunlu-specific data
      const enrichment = enrichSunluProduct(variant.title, variant.color || undefined);
      
      // Get color hex (with fallback)
      const colorHex = enrichment.colorHex || getSunluColorHex(variant.color || '');
      
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
        material: enrichment.material,
        finish_type: enrichment.finishType,
        product_line_id: enrichment.productLineId,
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

// ============================================================================
// STEP 4: TDS URL ASSIGNMENT (already done in upsert, this is a verification step)
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
    
    // Clean slate if requested
    if (options.cleanSlate) {
      console.log('[Sunlu Sync] Performing clean slate delete...');
      const { error: deleteError, count } = await supabase
        .from('filaments')
        .delete()
        .ilike('vendor', 'sunlu');
      
      if (deleteError) {
        throw new Error(`Clean slate delete failed: ${deleteError.message}`);
      }
      console.log(`[Sunlu Sync] Deleted ${count || 'all'} existing Sunlu products`);
    }
    
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
        message: `Exploded into ${variants.length} unique variants`,
      });
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
