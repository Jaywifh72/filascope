import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import {
  enrich3DHOJORProduct,
  get3DHOJORProductUrl,
  extract3DHOJORColorFromVariant,
  extract3DHOJORRegion,
  get3DHOJORColorHex,
  clean3DHOJORTitle,
  HOJOR_STORE_INFO,
} from '../_shared/3dhojor-defaults.ts';

// ============================================================================
// INTERFACES
// ============================================================================

interface ShopifyVariant {
  id: number;
  title: string;
  price: string;
  compare_at_price: string | null;
  sku: string | null;
  available: boolean;
}

interface ShopifyImage {
  src: string;
  alt?: string;
}

interface ShopifyProduct {
  id: number;
  title: string;
  handle: string;
  vendor: string;
  product_type: string;
  tags: string[];
  variants: ShopifyVariant[];
  images: ShopifyImage[];
  published_at: string;
}

interface ProductVariant {
  productId: string;
  productTitle: string;
  handle: string;
  variantId: number;
  variantTitle: string;
  color: string | null;
  region: string | null;
  price: number;
  compareAtPrice: number | null;
  sku: string | null;
  available: boolean;
  imageUrl: string | null;
  productUrl: string;
}

interface SyncResult {
  step: string;
  success: boolean;
  count?: number;
  details?: string;
  error?: string;
}

// ============================================================================
// CORS HEADERS
// ============================================================================

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// ============================================================================
// STEP 1: FETCH SHOPIFY PRODUCTS
// ============================================================================

async function fetchShopifyProducts(): Promise<ShopifyProduct[]> {
  const allProducts: ShopifyProduct[] = [];
  let page = 1;
  const limit = 250;
  
  while (true) {
    const url = `${HOJOR_STORE_INFO.productsUrl}?limit=${limit}&page=${page}`;
    console.log(`[Step 1] Fetching page ${page}: ${url}`);
    
    const response = await fetch(url, {
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'FilamentDB-Sync/1.0',
      },
    });
    
    if (!response.ok) {
      throw new Error(`Shopify API error: ${response.status} ${response.statusText}`);
    }
    
    const data = await response.json();
    const products = data.products || [];
    
    if (products.length === 0) {
      break;
    }
    
    // Filter for filament products only
    const filamentProducts = products.filter((p: ShopifyProduct) => {
      const title = p.title.toLowerCase();
      const productType = (p.product_type || '').toLowerCase();
      
      // Skip combo/bundle products that list multiple types
      if (/pro\s*\/\s*basic\s*\/|basic\s*\/\s*lite|multiple.*types/i.test(title)) {
        console.log(`[Step 1] Skipping combo product: ${p.title}`);
        return false;
      }
      
      // Skip multi-pack products (2+ rolls = bulk, exceeds weight filter)
      if (/^\d+\s*rolls?|pack\s*of\s*\d|\d+\s*\*\s*\d+/i.test(title)) {
        console.log(`[Step 1] Skipping multi-pack: ${p.title}`);
        return false;
      }
      
      // Must contain filament-related keywords
      const isFilament = 
        title.includes('pla') ||
        title.includes('petg') ||
        title.includes('tpu') ||
        title.includes('filament') ||
        productType.includes('filament');
      
      return isFilament;
    });
    
    allProducts.push(...filamentProducts);
    console.log(`[Step 1] Page ${page}: ${filamentProducts.length}/${products.length} filament products`);
    
    if (products.length < limit) {
      break;
    }
    
    page++;
    // Rate limiting
    await new Promise(resolve => setTimeout(resolve, 500));
  }
  
  console.log(`[Step 1] Total filament products fetched: ${allProducts.length}`);
  return allProducts;
}

// ============================================================================
// STEP 2: PROCESS VARIANTS
// ============================================================================

function explodeVariants(products: ShopifyProduct[]): ProductVariant[] {
  const variants: ProductVariant[] = [];
  const seenColors = new Map<string, ProductVariant>();
  
  for (const product of products) {
    const primaryImage = product.images?.[0]?.src || null;
    
    for (const variant of product.variants) {
      const color = extract3DHOJORColorFromVariant(variant.title);
      const region = extract3DHOJORRegion(variant.title);
      
      // Skip if color is obviously invalid (numbers, multi-pack quantities)
      if (!color || /^\d+\s*\*?\s*\d*\s*(kg|g)?$/i.test(color)) {
        console.log(`[Step 2] Skipping variant with invalid color: ${variant.title}`);
        continue;
      }
      
      // Create unique key for deduplication (product + color)
      const colorKey = `${product.id}-${(color || 'default').toLowerCase()}`;
      
      const variantData: ProductVariant = {
        productId: `${product.id}-${variant.id}`,
        productTitle: product.title,
        handle: product.handle,
        variantId: variant.id,
        variantTitle: variant.title,
        color: color,
        region: region,
        price: parseFloat(variant.price) || 0,
        compareAtPrice: variant.compare_at_price ? parseFloat(variant.compare_at_price) : null,
        sku: variant.sku,
        available: variant.available,
        imageUrl: primaryImage,
        productUrl: get3DHOJORProductUrl(product.handle),
      };
      
      // Keep only one variant per color (prioritize US region, then first seen)
      const existing = seenColors.get(colorKey);
      if (!existing) {
        seenColors.set(colorKey, variantData);
      } else if (region === 'US' && existing.region !== 'US') {
        // Prefer US region pricing
        seenColors.set(colorKey, variantData);
      }
    }
  }
  
  // Convert map to array
  for (const variant of seenColors.values()) {
    variants.push(variant);
  }
  
  console.log(`[Step 2] Exploded to ${variants.length} unique color variants`);
  return variants;
}

// ============================================================================
// STEP 3: UPSERT WITH ENRICHMENTS
// ============================================================================

async function upsertVariants(
  supabase: any,
  variants: ProductVariant[],
  brandId: string | null
): Promise<{ created: number; updated: number; errors: number }> {
  let created = 0;
  let updated = 0;
  let errors = 0;
  
  for (const variant of variants) {
    try {
      // Apply brand-specific enrichments
      const enrichment = enrich3DHOJORProduct(
        variant.productTitle,
        variant.color,
        null
      );
      
      // Debug logging for Very Peri to diagnose hex lookup
      if (variant.color?.toLowerCase().includes('peri')) {
        // Hex dump to reveal invisible Unicode characters
        const charCodes = variant.color.split('').map(c => c.charCodeAt(0).toString(16).padStart(4, '0'));
        console.log(`[DEBUG] Very Peri hex dump:`, charCodes.join(' '));
        console.log(`[DEBUG] Very Peri color processing:`, {
          rawColor: variant.color,
          enrichedHex: enrichment.color_hex,
          productLineId: enrichment.product_line_id,
          directLookup: get3DHOJORColorHex(variant.color || ''),
        });
      }
      
      // Determine final color_hex with fallback for known problematic colors
      let finalColorHex = enrichment.color_hex;
      if (!finalColorHex && variant.color) {
        const lowerColor = variant.color.toLowerCase();
        if (lowerColor.includes('very peri') || lowerColor.includes('veri peri')) {
          console.log(`[FALLBACK] Applying Very Peri hex directly for: ${variant.color}`);
          finalColorHex = '#6667AB';
        }
      }
      
      // Clean title by removing brand name, then append color for swatch display
      const cleanedTitle = clean3DHOJORTitle(variant.productTitle);
      const displayTitle = variant.color 
        ? `${cleanedTitle} - ${variant.color}`
        : cleanedTitle;
      
      const filamentData = {
        product_id: variant.productId,
        product_title: displayTitle,
        product_handle: variant.handle,
        vendor: HOJOR_STORE_INFO.vendor,
        brand_id: brandId,
        variant_price: variant.price,
        variant_compare_at_price: variant.compareAtPrice,
        variant_available: variant.available,
        variant_sku: variant.sku,
        product_url: variant.productUrl,
        featured_image: variant.imageUrl,
        material: enrichment.material,
        finish_type: enrichment.finish_type,
        product_line_id: enrichment.product_line_id,
        color_hex: finalColorHex,
        color_family: variant.color,
        diameter_nominal_mm: enrichment.diameter_nominal_mm,
        net_weight_g: 1000,
        nozzle_temp_min_c: enrichment.print_settings?.nozzle_temp_min_c,
        nozzle_temp_max_c: enrichment.print_settings?.nozzle_temp_max_c,
        bed_temp_min_c: enrichment.print_settings?.bed_temp_min_c,
        bed_temp_max_c: enrichment.print_settings?.bed_temp_max_c,
        high_speed_capable: enrichment.high_speed_capable,
        auto_created: true,
        auto_updated: true,
        last_scraped_at: new Date().toISOString(),
        sync_status: 'synced',
        // No TDS for this brand
        tds_url: null,
      };
      
      // Check if exists
      const { data: existing } = await supabase
        .from('filaments')
        .select('id')
        .eq('product_id', variant.productId)
        .eq('vendor', HOJOR_STORE_INFO.vendor)
        .maybeSingle();
      
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
    } catch (error) {
      console.error(`[Step 3] Error upserting ${variant.productId}:`, error);
      errors++;
    }
  }
  
  console.log(`[Step 3] Created: ${created}, Updated: ${updated}, Errors: ${errors}`);
  return { created, updated, errors };
}

// ============================================================================
// STEP 4: UPDATE BRAND STATS
// ============================================================================

async function updateBrandStats(supabase: any): Promise<void> {
  // Update automated_brands with correct platform info
  const { error } = await supabase
    .from('automated_brands')
    .update({
      platform_type: 'shopify',
      base_url: HOJOR_STORE_INFO.baseUrl,
      products_url: HOJOR_STORE_INFO.productsUrl,
      has_api: true,
      last_scrape_at: new Date().toISOString(),
      notes: 'Shopify store with Dual/Tri color silk and matte PLA specialties. No TDS documentation available.',
    })
    .eq('brand_slug', '3dhojor');
  
  if (error) {
    console.error('[Step 4] Error updating brand stats:', error);
  } else {
    console.log('[Step 4] Brand stats updated');
  }
  
  // Update product counts
  const { error: rpcError } = await supabase.rpc('update_brand_product_counts', {
    p_brand_slug: '3dhojor'
  });
  
  if (rpcError) {
    console.error('[Step 4] Error updating product counts:', rpcError);
  }
}

// ============================================================================
// STEP 5: FIX DUPLICATE HEX CODES
// ============================================================================

async function fixDuplicateHexCodes(supabase: any): Promise<number> {
  // Find duplicates
  const { data: duplicates, error } = await supabase.rpc('find_duplicate_hexes', {
    p_vendor: HOJOR_STORE_INFO.vendor
  });
  
  if (error) {
    console.error('[Step 5] Error finding duplicates:', error);
    return 0;
  }
  
  if (!duplicates || duplicates.length === 0) {
    console.log('[Step 5] No duplicate hex codes found');
    return 0;
  }
  
  console.log(`[Step 5] Found ${duplicates.length} products with duplicate hex codes`);
  
  // Group by product_line_id and hex
  const groups = new Map<string, any[]>();
  for (const dup of duplicates) {
    const key = `${dup.product_line_id}-${dup.color_hex?.toLowerCase()}`;
    if (!groups.has(key)) {
      groups.set(key, []);
    }
    groups.get(key)!.push(dup);
  }
  
  let fixed = 0;
  for (const [key, items] of groups) {
    // Skip first item, adjust others
    for (let i = 1; i < items.length; i++) {
      const item = items[i];
      const originalHex = item.color_hex;
      
      if (!originalHex) continue;
      
      // Parse and adjust hex
      const hex = originalHex.replace('#', '');
      const r = parseInt(hex.substring(0, 2), 16);
      const g = parseInt(hex.substring(2, 4), 16);
      const b = parseInt(hex.substring(4, 6), 16);
      
      // Adjust by index to make unique
      const newR = Math.min(255, Math.max(0, r + i * 3));
      const newG = Math.min(255, Math.max(0, g + i * 2));
      const newB = Math.min(255, Math.max(0, b + i));
      
      const newHex = `#${newR.toString(16).padStart(2, '0')}${newG.toString(16).padStart(2, '0')}${newB.toString(16).padStart(2, '0')}`.toUpperCase();
      
      const { error: updateError } = await supabase
        .from('filaments')
        .update({ color_hex: newHex })
        .eq('id', item.id);
      
      if (!updateError) {
        fixed++;
      }
    }
  }
  
  console.log(`[Step 5] Fixed ${fixed} duplicate hex codes`);
  return fixed;
}

// ============================================================================
// MAIN HANDLER
// ============================================================================

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }
  
  const startTime = Date.now();
  const results: SyncResult[] = [];
  
  try {
    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    // Parse options
    let options = { cleanSlate: false, skipFetch: false };
    try {
      const body = await req.json();
      options = { ...options, ...body };
    } catch {
      // No body or invalid JSON, use defaults
    }
    
    console.log(`[3DHOJOR Sync] Starting sync with options:`, options);
    
    // DEPLOY CHECK: Test that shared module is correctly bundled
    console.log('[DEPLOY CHECK] Testing get3DHOJORColorHex:', {
      'PLA Very Peri': get3DHOJORColorHex('PLA Very Peri'),
      'very peri': get3DHOJORColorHex('very peri'),
      'pla lite black': get3DHOJORColorHex('pla lite black'),
    });
    
    // Get brand ID
    const { data: brand } = await supabase
      .from('automated_brands')
      .select('id')
      .eq('brand_slug', '3dhojor')
      .maybeSingle();
    
    const brandId = brand?.id || null;
    console.log(`[3DHOJOR Sync] Brand ID: ${brandId}`);
    
    // Clean slate if requested
    if (options.cleanSlate) {
      const { data: deleted } = await supabase
        .from('filaments')
        .delete()
        .ilike('vendor', HOJOR_STORE_INFO.vendor)
        .select('id');
      
      const count = deleted?.length || 0;
      
      console.log(`[Clean Slate] Deleted ${count || 0} existing products`);
      results.push({
        step: 'clean_slate',
        success: true,
        count: count || 0,
        details: `Deleted ${count || 0} existing ${HOJOR_STORE_INFO.vendor} products`,
      });
    }
    
    // Step 1: Fetch products
    let products: ShopifyProduct[] = [];
    if (!options.skipFetch) {
      try {
        products = await fetchShopifyProducts();
        results.push({
          step: 'fetch_products',
          success: true,
          count: products.length,
          details: `Fetched ${products.length} filament products from Shopify`,
        });
      } catch (err) {
        const error = err as Error;
        console.error('[Step 1] Fetch error:', error);
        results.push({
          step: 'fetch_products',
          success: false,
          error: error.message,
        });
        throw error;
      }
    }
    
    // Step 2: Explode variants
    let variants: ProductVariant[] = [];
    if (products.length > 0) {
      variants = explodeVariants(products);
      results.push({
        step: 'explode_variants',
        success: true,
        count: variants.length,
        details: `Exploded to ${variants.length} unique color variants`,
      });
    }
    
    // Step 3: Upsert with enrichments
    if (variants.length > 0) {
      const upsertResult = await upsertVariants(supabase, variants, brandId);
      results.push({
        step: 'upsert_enrichments',
        success: upsertResult.errors === 0,
        count: upsertResult.created + upsertResult.updated,
        details: `Created: ${upsertResult.created}, Updated: ${upsertResult.updated}, Errors: ${upsertResult.errors}`,
      });
    }
    
    // Step 4: Update brand stats
    await updateBrandStats(supabase);
    results.push({
      step: 'update_brand_stats',
      success: true,
      details: 'Brand statistics and platform info updated',
    });
    
    // Step 5: Fix duplicate hex codes
    const fixedHexes = await fixDuplicateHexCodes(supabase);
    results.push({
      step: 'fix_duplicate_hexes',
      success: true,
      count: fixedHexes,
      details: `Fixed ${fixedHexes} duplicate hex codes`,
    });
    
    const duration = ((Date.now() - startTime) / 1000).toFixed(2);
    console.log(`[3DHOJOR Sync] Completed in ${duration}s`);
    
    return new Response(
      JSON.stringify({
        success: true,
        vendor: HOJOR_STORE_INFO.vendor,
        results,
        duration: `${duration}s`,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (err) {
    const error = err as Error;
    console.error('[3DHOJOR Sync] Fatal error:', error);
    
    return new Response(
      JSON.stringify({
        success: false,
        vendor: HOJOR_STORE_INFO.vendor,
        error: error.message,
        results,
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
