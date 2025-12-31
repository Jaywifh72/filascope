/**
 * 3D-FUEL Product Sync Edge Function
 * 
 * High-fidelity 5-step sync pipeline:
 * 1. Discovery - Fetch products from Shopify JSON API
 * 2. Variant Explosion - Expand color/diameter variants
 * 3. Enrichment - Apply brand-specific material/color/finish rules
 * 4. Upsert - Insert/update products with proper product_id
 * 5. Field Coverage - Return rich sync results
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { 
  BRAND_CONFIG, 
  extractMaterial, 
  extractFinish, 
  extractColorName, 
  extractDiameter,
  extractWeight,
  getColorHex,
  generateProductLineId,
  extractProductLine,
  getColorFamily,
  enrichVariant,
  isNonFilament,
} from '../_shared/3dfuel-defaults.ts';
import { 
  buildFieldCoverage, 
  buildSyncResponse, 
  createProductResult,
  type SyncProductResult,
} from '../_shared/sync-response-builder.ts';
import {
  shouldIncludeVariant,
  createFilterStats,
  updateFilterStats,
  logFilterStats,
  is285mmDiameter,
} from '../_shared/variant-filters.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

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
  images: Array<{ src: string }>;
  variants: ShopifyVariant[];
}

interface ShopifyVariant {
  id: number;
  title: string;
  sku: string;
  price: string;
  compare_at_price: string | null;
  available: boolean;
  option1: string | null;
  option2: string | null;
  option3: string | null;
  grams: number;
}

interface ProcessedVariant {
  productId: string;
  title: string;
  handle: string;
  variantId: number;
  sku: string;
  price: number;
  compareAtPrice: number | null;
  available: boolean;
  imageUrl: string | null;
  productUrl: string;
  colorName: string;
  material: string;
  finishType: string;
  diameter: number;
  weight: number;
  colorHex: string | null;
  productLineId: string;
}

// ============================================================================
// STEP 1: DISCOVERY - Fetch from Shopify
// ============================================================================

async function fetchShopifyProducts(): Promise<ShopifyProduct[]> {
  console.log('[Step 1] Fetching products from 3D-Fuel Shopify...');
  
  const allProducts: ShopifyProduct[] = [];
  let page = 1;
  const limit = 250;
  
  while (true) {
    const url = `${BRAND_CONFIG.shopifyApiUrl}?limit=${limit}&page=${page}`;
    console.log(`[Discovery] Fetching page ${page}: ${url}`);
    
    const response = await fetch(url, {
      headers: { 'Accept': 'application/json' },
    });
    
    if (!response.ok) {
      throw new Error(`Shopify API error: ${response.status} ${response.statusText}`);
    }
    
    const data = await response.json();
    const products = data.products || [];
    
    if (products.length === 0) {
      break;
    }
    
    // Filter to filament products only
    const filamentProducts = products.filter((p: ShopifyProduct) => {
      const titleLower = p.title.toLowerCase();
      const typeLower = (p.product_type || '').toLowerCase();
      
      // Include filament products
      const isFilament = 
        typeLower.includes('filament') ||
        titleLower.includes('pla') ||
        titleLower.includes('petg') ||
        titleLower.includes('abs') ||
        titleLower.includes('tpu') ||
        titleLower.includes('pctg') ||
        titleLower.includes('nylon');
      
      // Exclude accessories, apparel, and samples
      const isAccessory = 
        // Accessories
        titleLower.includes('spool holder') ||
        titleLower.includes('nozzle') ||
        titleLower.includes('sheet') ||
        // Apparel
        titleLower.includes('t-shirt') ||
        titleLower.includes('hoodie') ||
        titleLower.includes('beanie') ||
        titleLower.includes('hat') ||
        titleLower.includes('backpack') ||
        // Samples and kits
        titleLower.includes('sample coil') ||
        titleLower.includes('sample coils') ||
        titleLower.includes('sample pack') ||
        titleLower.includes('diy assembly kit') ||
        titleLower.includes('50g') ||
        (titleLower.includes('coil') && !titleLower.includes('spool'));
      
      return isFilament && !isAccessory;
    });
    
    allProducts.push(...filamentProducts);
    console.log(`[Discovery] Page ${page}: ${filamentProducts.length} filament products (${products.length} total)`);
    
    if (products.length < limit) {
      break;
    }
    
    page++;
    // Rate limiting
    await new Promise(resolve => setTimeout(resolve, 500));
  }
  
  console.log(`[Step 1] Complete: ${allProducts.length} filament products discovered`);
  return allProducts;
}

// ============================================================================
// STEP 2: VARIANT EXPLOSION
// ============================================================================

function explodeVariants(products: ShopifyProduct[]): ProcessedVariant[] {
  console.log('[Step 2] Exploding variants...');
  
  const variants: ProcessedVariant[] = [];
  const seenIds = new Set<string>();
  const filterStats = createFilterStats();
  
  for (const product of products) {
    // Skip non-filament products (3D Clean, etc.)
    if (isNonFilament(product.title, product.handle)) {
      console.log(`[3D-Fuel] Skipping non-filament: ${product.title} (handle: ${product.handle})`);
      continue;
    }
    
    // Extract product-level info once (shared across all color variants)
    const material = extractMaterial(product.title);
    const finishType = extractFinish(product.title);
    // Generate product_line_id using HANDLE for accurate product identification (no color)
    const productLineId = generateProductLineId(product.title, product.handle);
    
    for (const variant of product.variants) {
      // Pass product.handle for improved Silky color extraction
      const colorName = extractColorName(variant, product.title, product.handle);
      const diameter = extractDiameter(variant);
      const weight = extractWeight(variant, product.title);
      
      // Debug logging for color extraction issues
      console.log(`[Color] Product: "${product.title}" Handle: "${product.handle}" Variant: "${variant.title}" -> Color: "${colorName}"`);
      
      // Apply standard filtering (samples, bulk, 2.85mm)
      const filterResult = shouldIncludeVariant(weight, diameter);
      updateFilterStats(filterStats, filterResult);
      if (!filterResult.include) {
        console.log(`[3D-Fuel] Skipping: ${product.title} - ${colorName} (${filterResult.reason})`);
        continue;
      }
      
      // Create unique product ID: shopify-product-variant
      const productId = `3dfuel-${product.id}-${variant.id}`;
      
      // Skip duplicates
      if (seenIds.has(productId)) {
        continue;
      }
      seenIds.add(productId);
      
      // Find matching image (by color name if possible)
      let imageUrl = product.images[0]?.src || null;
      
      // Get color hex from the expanded color map
      const colorHex = getColorHex(colorName);
      
      // Build display title matching page format: "Product Line, Color Name, 1.75mm"
      // This ensures DB title matches what Post Sync Check finds on the page
      const productLine = extractProductLine(product.title);
      const displayTitle = `${productLine}, ${colorName}, 1.75mm`;
      
      variants.push({
        productId,
        title: displayTitle,
        handle: product.handle,
        variantId: variant.id,
        sku: variant.sku || '',
        price: parseFloat(variant.price) || 0,
        compareAtPrice: variant.compare_at_price ? parseFloat(variant.compare_at_price) : null,
        available: variant.available,
        imageUrl,
        productUrl: `https://${BRAND_CONFIG.shopifyDomain}/products/${product.handle}`,
        colorName,
        material,
        finishType,
        diameter,
        weight,
        colorHex,  // Now properly mapped from expanded COLOR_HEX_MAP
        productLineId,  // Now correctly using handle-based detection
      });
    }
  }
  
  logFilterStats('3D-Fuel', filterStats);
  console.log(`[Step 2] Complete: ${variants.length} variants exploded`);
  console.log(`[Step 2] Product lines created: ${new Set(variants.map(v => v.productLineId)).size}`);
  return variants;
}

// ============================================================================
// STEP 3 & 4: ENRICHMENT & UPSERT
// ============================================================================

async function upsertVariants(
  supabase: any,
  variants: ProcessedVariant[],
  brandId: string | null
): Promise<{ created: number; updated: number; errors: number; results: SyncProductResult[] }> {
  console.log(`[Step 3-4] Upserting ${variants.length} variants...`);
  
  let created = 0;
  let updated = 0;
  let errors = 0;
  const results: SyncProductResult[] = [];
  
  for (const variant of variants) {
    try {
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
        vendor: BRAND_CONFIG.vendorName,
        brand_id: brandId,
        variant_price: variant.price,
        variant_compare_at_price: variant.compareAtPrice,
        variant_available: variant.available,
        variant_sku: variant.sku || null,
        product_url: variant.productUrl,
        featured_image: variant.imageUrl,
        material: variant.material,
        finish_type: variant.finishType,
        color_family: getColorFamily(variant.colorName),  // Use proper color family, not raw color name
        color_hex: variant.colorHex,
        diameter_nominal_mm: variant.diameter,
        net_weight_g: variant.weight,
        product_line_id: variant.productLineId,
        auto_created: !existing,
        auto_updated: true,
        last_scraped_at: new Date().toISOString(),
        sync_status: 'synced',
      };
      
      if (existing) {
        // Update
        const { error } = await supabase
          .from('filaments')
          .update(filamentData)
          .eq('id', existing.id);
        
        if (error) throw error;
        updated++;
        results.push(createProductResult(variant.productId, variant.title, 'updated', filamentData));
      } else {
        // Insert
        const { error } = await supabase
          .from('filaments')
          .insert(filamentData);
        
        if (error) throw error;
        created++;
        results.push(createProductResult(variant.productId, variant.title, 'created', filamentData));
      }
    } catch (err: any) {
      console.error(`[Upsert] Error for ${variant.productId}:`, err.message);
      errors++;
      results.push(createProductResult(variant.productId, variant.title, 'error', {}, err.message));
    }
  }
  
  console.log(`[Step 3-4] Complete: ${created} created, ${updated} updated, ${errors} errors`);
  return { created, updated, errors, results };
}

// ============================================================================
// STEP 5: FIX DUPLICATE HEX CODES
// ============================================================================

async function fixDuplicateHexCodes(supabase: any): Promise<number> {
  console.log('[Step 5] Fixing duplicate hex codes...');
  
  try {
    const { data: duplicates, error } = await supabase
      .rpc('find_duplicate_hexes', { p_vendor: BRAND_CONFIG.vendorName });
    
    if (error) {
      console.error('[Step 5] Error finding duplicates:', error.message);
      return 0;
    }
    
    if (!duplicates || duplicates.length === 0) {
      console.log('[Step 5] No duplicate hex codes found');
      return 0;
    }
    
    // Adjust hex codes for duplicates by slightly modifying the value
    let fixed = 0;
    const grouped = new Map<string, any[]>();
    
    for (const dup of duplicates) {
      const key = `${dup.product_line_id}-${dup.color_hex?.toLowerCase()}`;
      if (!grouped.has(key)) {
        grouped.set(key, []);
      }
      grouped.get(key)!.push(dup);
    }
    
    for (const [, items] of grouped) {
      if (items.length <= 1) continue;
      
      // Keep first one as-is, adjust others
      for (let i = 1; i < items.length; i++) {
        const item = items[i];
        const originalHex = item.color_hex;
        
        // Slightly adjust the hex value
        const r = parseInt(originalHex.slice(1, 3), 16);
        const g = parseInt(originalHex.slice(3, 5), 16);
        const b = parseInt(originalHex.slice(5, 7), 16);
        
        const newR = Math.min(255, r + i);
        const newHex = `#${newR.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`.toUpperCase();
        
        await supabase
          .from('filaments')
          .update({ color_hex: newHex })
          .eq('id', item.id);
        
        fixed++;
      }
    }
    
    console.log(`[Step 5] Fixed ${fixed} duplicate hex codes`);
    return fixed;
  } catch (err: any) {
    console.error('[Step 5] Error:', err.message);
    return 0;
  }
}

// ============================================================================
// UPDATE BRAND STATS
// ============================================================================

async function updateBrandStats(supabase: any): Promise<void> {
  console.log('[Stats] Updating brand statistics...');
  
  try {
    await supabase
      .from('automated_brands')
      .update({
        platform_type: 'Shopify',
        last_scrape_at: new Date().toISOString(),
      })
      .eq('brand_slug', BRAND_CONFIG.brandSlug);
    
    await supabase.rpc('update_brand_product_counts', { 
      p_brand_slug: BRAND_CONFIG.brandSlug 
    });
    
    await supabase.rpc('update_brand_enrichment_counts', { 
      p_brand_slug: BRAND_CONFIG.brandSlug 
    });
    
    console.log('[Stats] Brand statistics updated');
  } catch (err: any) {
    console.error('[Stats] Error updating stats:', err.message);
  }
}

// ============================================================================
// MAIN HANDLER
// ============================================================================

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }
  
  const startTime = Date.now();
  
  try {
    console.log('='.repeat(60));
    console.log('3D-FUEL PRODUCT SYNC STARTING');
    console.log('='.repeat(60));
    
    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    // Parse options
    let cleanSlate = false;
    try {
      const body = await req.json();
      cleanSlate = body?.cleanSlate === true;
    } catch {
      // No body or invalid JSON
    }
    
    // Get brand ID
    const { data: brand } = await supabase
      .from('automated_brands')
      .select('id')
      .eq('brand_slug', BRAND_CONFIG.brandSlug)
      .maybeSingle();
    
    const brandId = brand?.id || null;
    
    // Clean slate if requested
    if (cleanSlate) {
      console.log('[Clean Slate] Deleting existing 3D-Fuel products...');
      const { error: deleteError } = await supabase
        .from('filaments')
        .delete()
        .ilike('vendor', BRAND_CONFIG.vendorName);
      if (deleteError) {
        console.error('[Clean Slate] Delete error:', deleteError.message);
      } else {
        console.log('[Clean Slate] Existing products deleted');
      }
    }
    
    // Step 1: Discovery
    const products = await fetchShopifyProducts();
    
    // Step 2: Variant Explosion
    const variants = explodeVariants(products);
    
    // Step 3-4: Enrichment & Upsert
    const { created, updated, errors, results } = await upsertVariants(supabase, variants, brandId);
    
    // Step 5: Fix Duplicate Hex Codes
    await fixDuplicateHexCodes(supabase);
    
    // Update brand stats
    await updateBrandStats(supabase);
    
    // Calculate field coverage
    const fieldCoverage = await buildFieldCoverage(supabase, BRAND_CONFIG.vendorName);
    
    const durationMs = Date.now() - startTime;
    
    console.log('='.repeat(60));
    console.log(`3D-FUEL SYNC COMPLETE in ${durationMs}ms`);
    console.log(`Created: ${created}, Updated: ${updated}, Errors: ${errors}`);
    console.log('='.repeat(60));
    
    const response = buildSyncResponse(
      true,
      durationMs,
      {
        totalDiscovered: variants.length,
        created,
        updated,
        skipped: 0,
        errors,
      },
      results,
      fieldCoverage
    );
    
    return new Response(JSON.stringify(response), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
    
  } catch (err: any) {
    console.error('[FATAL]', err);
    
    const durationMs = Date.now() - startTime;
    
    return new Response(JSON.stringify({
      success: false,
      error: err.message,
      duration_ms: durationMs,
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
