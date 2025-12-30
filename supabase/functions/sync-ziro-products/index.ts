import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import {
  enrichZiroProduct,
  ZIRO_STORE_INFO,
  cleanZiroTitle,
} from '../_shared/ziro-defaults.ts';

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
  body_html: string;
  vendor: string;
  product_type: string;
  created_at: string;
  updated_at: string;
  published_at: string;
  variants: ShopifyVariant[];
  images: ShopifyImage[];
  options: ShopifyOption[];
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
  grams: number;
}

interface ShopifyImage {
  id: number;
  src: string;
  position: number;
  variant_ids: number[];
}

interface ShopifyOption {
  id: number;
  name: string;
  position: number;
  values: string[];
}

interface ProductVariant {
  productId: string;
  shopifyProductId: number;
  shopifyVariantId: number;
  title: string;
  handle: string;
  color: string;
  price: number;
  compareAtPrice: number | null;
  sku: string;
  available: boolean;
  imageUrl: string | null;
  productUrl: string;
  weightGrams: number;
}

interface SyncResult {
  step: string;
  success: boolean;
  message: string;
  count?: number;
  details?: Record<string, unknown>;
}

// ============================================================================
// STEP 1: FETCH SHOPIFY PRODUCTS
// ============================================================================

async function fetchShopifyProducts(): Promise<ShopifyProduct[]> {
  const allProducts: ShopifyProduct[] = [];
  let page = 1;
  const limit = 250;
  
  console.log('[Step 1] Fetching products from Ziro Shopify store...');
  
  while (true) {
    const url = `${ZIRO_STORE_INFO.baseUrl}/products.json?limit=${limit}&page=${page}`;
    console.log(`Fetching page ${page}: ${url}`);
    
    const response = await fetch(url, {
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'FilaScope-Sync/1.0',
      },
    });
    
    if (!response.ok) {
      if (response.status === 404 && page > 1) {
        console.log(`Page ${page} not found, ending pagination`);
        break;
      }
      throw new Error(`Shopify API error: ${response.status} ${response.statusText}`);
    }
    
    const data = await response.json();
    const products = data.products || [];
    
    if (products.length === 0) {
      console.log(`No more products found on page ${page}`);
      break;
    }
    
    // Filter for filament products only
    const filamentProducts = products.filter((p: ShopifyProduct) => {
      const title = p.title.toLowerCase();
      const type = (p.product_type || '').toLowerCase();
      
      // Include filament products
      if (title.includes('filament') || type.includes('filament')) return true;
      if (title.includes('pla') || title.includes('petg') || title.includes('abs')) return true;
      if (title.includes('tpu') || title.includes('silk') || title.includes('matte')) return true;
      
      // Exclude non-filament products
      if (title.includes('nozzle') || title.includes('accessory')) return false;
      if (title.includes('dryer') || title.includes('storage')) return false;
      
      return true; // Include by default for Ziro (filament-focused brand)
    });
    
    allProducts.push(...filamentProducts);
    console.log(`Page ${page}: Found ${filamentProducts.length} filament products (${products.length} total)`);
    
    if (products.length < limit) {
      break;
    }
    
    page++;
    // Rate limiting
    await new Promise(resolve => setTimeout(resolve, 500));
  }
  
  console.log(`[Step 1] Total filament products discovered: ${allProducts.length}`);
  return allProducts;
}

// ============================================================================
// STEP 2: EXPLODE VARIANTS
// ============================================================================

function explodeVariants(products: ShopifyProduct[]): ProductVariant[] {
  const variants: ProductVariant[] = [];
  const seenVariants = new Set<string>();
  
  console.log('[Step 2] Processing Shopify variants...');
  
  for (const product of products) {
    // Find the color option
    const colorOptionIndex = product.options.findIndex(
      opt => opt.name.toLowerCase().includes('color') || opt.name.toLowerCase() === 'colour'
    );
    
    // Get first image as default
    const defaultImage = product.images[0]?.src || null;
    
    for (const variant of product.variants) {
      // Extract color from variant
      let color = 'Default';
      if (colorOptionIndex === 0 && variant.option1) {
        color = variant.option1;
      } else if (colorOptionIndex === 1 && variant.option2) {
        color = variant.option2;
      } else if (colorOptionIndex === 2 && variant.option3) {
        color = variant.option3;
      } else if (variant.title && variant.title !== 'Default Title') {
        color = variant.title.split('/')[0].trim();
      }
      
      // Create unique variant key
      const variantKey = `${product.id}_${variant.id}`;
      if (seenVariants.has(variantKey)) continue;
      seenVariants.add(variantKey);
      
      // Find variant-specific image or use default
      const variantImage = product.images.find(img => 
        img.variant_ids.includes(variant.id)
      )?.src || defaultImage;
      
      variants.push({
        productId: `${product.id}_${variant.id}`,
        shopifyProductId: product.id,
        shopifyVariantId: variant.id,
        title: product.title,
        handle: product.handle,
        color,
        price: parseFloat(variant.price) || 0,
        compareAtPrice: variant.compare_at_price ? parseFloat(variant.compare_at_price) : null,
        sku: variant.sku || '',
        available: variant.available,
        imageUrl: variantImage,
        productUrl: `${ZIRO_STORE_INFO.baseUrl}/products/${product.handle}`,
        weightGrams: variant.grams || 1000,
      });
    }
  }
  
  console.log(`[Step 2] Created ${variants.length} variant-exploded entries`);
  return variants;
}

// ============================================================================
// STEP 3: UPSERT TO DATABASE WITH ENRICHMENTS
// ============================================================================

async function upsertVariants(
  supabase: any,
  variants: ProductVariant[],
  brandId: string | null
): Promise<{ created: number; updated: number; errors: number }> {
  console.log('[Step 3] Upserting variants with brand-specific enrichments...');
  
  let created = 0;
  let updated = 0;
  let errors = 0;
  
  for (const variant of variants) {
    try {
      // Apply brand-specific enrichments
      const enrichment = enrichZiroProduct(variant.title, null, variant.color);
      
      // Build product title with color
      const displayTitle = `${cleanZiroTitle(variant.title)} - ${variant.color}`.trim();
      
      // Check if product exists
      const { data: existing } = await supabase
        .from('filaments')
        .select('id')
        .eq('product_id', variant.productId)
        .eq('vendor', ZIRO_STORE_INFO.vendorName)
        .maybeSingle();
      
      const filamentData = {
        product_id: variant.productId,
        product_title: displayTitle,
        product_handle: variant.handle,
        vendor: ZIRO_STORE_INFO.vendorName,
        brand_id: brandId,
        material: enrichment.material,
        finish_type: enrichment.finishType,
        product_line_id: enrichment.productLineId,
        color_family: variant.color,
        color_hex: enrichment.colorHex,
        variant_price: variant.price,
        variant_compare_at_price: variant.compareAtPrice,
        variant_available: variant.available,
        variant_sku: variant.sku || null,
        product_url: variant.productUrl,
        featured_image: variant.imageUrl,
        diameter_nominal_mm: ZIRO_STORE_INFO.defaultDiameter,
        net_weight_g: variant.weightGrams,
        nozzle_temp_min_c: enrichment.nozzleTempMin,
        nozzle_temp_max_c: enrichment.nozzleTempMax,
        bed_temp_min_c: enrichment.bedTempMin,
        bed_temp_max_c: enrichment.bedTempMax,
        is_nozzle_abrasive: enrichment.isAbrasive,
        high_speed_capable: enrichment.highSpeedCapable,
        tds_url: null, // Ziro doesn't have TDS
        auto_created: !existing,
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
      console.error(`Error upserting variant ${variant.productId}:`, err);
      errors++;
    }
  }
  
  console.log(`[Step 3] Upsert complete: ${created} created, ${updated} updated, ${errors} errors`);
  return { created, updated, errors };
}

// ============================================================================
// STEP 4: UPDATE BRAND STATS
// ============================================================================

async function updateBrandStats(supabase: any): Promise<void> {
  console.log('[Step 4] Updating automated_brands entry...');
  
  const { error } = await supabase
    .from('automated_brands')
    .update({
      platform_type: ZIRO_STORE_INFO.platformType,
      base_url: ZIRO_STORE_INFO.baseUrl,
      products_url: ZIRO_STORE_INFO.productsUrl,
      has_api: ZIRO_STORE_INFO.hasApi,
      notes: ZIRO_STORE_INFO.notes,
      last_scrape_at: new Date().toISOString(),
    })
    .eq('brand_slug', 'ziro');
  
  if (error) {
    console.error('Error updating brand stats:', error);
    throw error;
  }
  
  // Update product counts
  await supabase.rpc('update_brand_product_counts', { p_brand_slug: 'ziro' });
  await supabase.rpc('update_brand_enrichment_counts', { p_brand_slug: 'ziro' });
  
  console.log('[Step 4] Brand stats updated');
}

// ============================================================================
// STEP 5: FIX DUPLICATE HEX CODES
// ============================================================================

async function fixDuplicateHexCodes(supabase: any): Promise<number> {
  console.log('[Step 5] Fixing duplicate hex codes...');
  
  const { data: duplicates, error } = await supabase.rpc('find_duplicate_hexes', {
    p_vendor: ZIRO_STORE_INFO.vendorName,
  });
  
  if (error) {
    console.error('Error finding duplicates:', error);
    return 0;
  }
  
  if (!duplicates || duplicates.length === 0) {
    console.log('[Step 5] No duplicate hex codes found');
    return 0;
  }
  
  console.log(`[Step 5] Found ${duplicates.length} products with duplicate hex codes`);
  
  // Group by product_line_id and color_hex
  const groups = new Map<string, any[]>();
  for (const dup of duplicates as any[]) {
    const key = `${dup.product_line_id}__${dup.color_hex?.toLowerCase()}`;
    if (!groups.has(key)) {
      groups.set(key, []);
    }
    groups.get(key)!.push(dup);
  }
  
  let fixed = 0;
  for (const [, group] of groups) {
    // Skip the first one (keep original), modify the rest
    for (let i = 1; i < group.length; i++) {
      const item = group[i];
      const baseHex = item.color_hex || '#808080';
      
      // Slightly modify the hex to make it unique
      const r = parseInt(baseHex.slice(1, 3), 16);
      const g = parseInt(baseHex.slice(3, 5), 16);
      const b = parseInt(baseHex.slice(5, 7), 16);
      
      const newR = Math.min(255, Math.max(0, r + i));
      const newG = Math.min(255, Math.max(0, g + i));
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
    console.log('='.repeat(60));
    console.log('ZIRO SYNC PIPELINE STARTED');
    console.log('='.repeat(60));
    
    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    // Parse options
    let cleanSlate = false;
    try {
      const body = await req.json();
      cleanSlate = body.cleanSlate === true;
    } catch {
      // No body or invalid JSON
    }
    
    // Get brand ID
    const { data: brand } = await supabase
      .from('automated_brands')
      .select('id')
      .eq('brand_slug', 'ziro')
      .single();
    
    const brandId = brand?.id || null;
    
    // Clean slate if requested
    if (cleanSlate) {
      console.log('[Pre-Step] Clean slate requested, deleting existing Ziro products...');
      const { data: deleted } = await supabase
        .from('filaments')
        .delete()
        .ilike('vendor', 'ziro')
        .select('id');
      const count = deleted?.length || 0;
      
      console.log(`[Pre-Step] Deleted ${count || 0} existing products`);
      results.push({
        step: 'Clean Slate',
        success: true,
        message: `Deleted ${count || 0} existing Ziro products`,
        count: count || 0,
      });
    }
    
    // Step 1: Fetch Shopify products
    const products = await fetchShopifyProducts();
    results.push({
      step: 'Fetch Shopify Products',
      success: true,
      message: `Discovered ${products.length} filament products from Shopify`,
      count: products.length,
    });
    
    // Step 2: Explode variants
    const variants = explodeVariants(products);
    results.push({
      step: 'Explode Variants',
      success: true,
      message: `Created ${variants.length} variant-exploded entries`,
      count: variants.length,
    });
    
    // Step 3: Upsert to database
    const upsertResult = await upsertVariants(supabase, variants, brandId);
    results.push({
      step: 'Upsert Products',
      success: upsertResult.errors === 0,
      message: `Created ${upsertResult.created}, updated ${upsertResult.updated}, errors ${upsertResult.errors}`,
      count: upsertResult.created + upsertResult.updated,
      details: upsertResult,
    });
    
    // Step 4: Update brand stats
    await updateBrandStats(supabase);
    results.push({
      step: 'Update Brand Stats',
      success: true,
      message: 'Brand stats and product counts updated',
    });
    
    // Step 5: Fix duplicate hex codes
    const fixedCount = await fixDuplicateHexCodes(supabase);
    results.push({
      step: 'Fix Duplicate Hex Codes',
      success: true,
      message: `Fixed ${fixedCount} duplicate hex codes`,
      count: fixedCount,
    });
    
    const duration = ((Date.now() - startTime) / 1000).toFixed(1);
    console.log('='.repeat(60));
    console.log(`ZIRO SYNC COMPLETED in ${duration}s`);
    console.log('='.repeat(60));
    
    return new Response(
      JSON.stringify({
        success: true,
        message: `Ziro sync completed in ${duration}s`,
        duration: `${duration}s`,
        results,
        summary: {
          productsDiscovered: products.length,
          variantsCreated: variants.length,
          created: upsertResult.created,
          updated: upsertResult.updated,
          errors: upsertResult.errors,
          duplicatesFixed: fixedCount,
        },
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Sync failed:', error);
    
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        results,
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
