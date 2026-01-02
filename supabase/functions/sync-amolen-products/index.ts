import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import {
  enrichAmolenProduct,
  getAmolenProductUrl,
  extractAmolenColorFromVariant,
  getAmolenColorHex,
  cleanAmolenTitle,
  isAmolenDeliveryOption,
  isAmolenVarietyPack,
  AMOLEN_STORE_INFO,
} from '../_shared/amolen-defaults.ts';
import {
  shouldIncludeVariant,
  extractWeightFromText,
  createFilterStats,
  updateFilterStats,
  logFilterStats,
} from '../_shared/variant-filters.ts';

// ============================================================================
// INTERFACES
// ============================================================================

interface ShopifyVariant {
  id: number;
  title: string;
  option1: string | null;
  option2: string | null;
  option3: string | null;
  price: string;
  compare_at_price: string | null;
  sku: string | null;
  available: boolean;
  grams: number;
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

interface ProcessedVariant {
  productId: string;
  productTitle: string;
  handle: string;
  variantId: number;
  color: string | null;
  price: number;
  compareAtPrice: number | null;
  sku: string | null;
  available: boolean;
  imageUrl: string | null;
  productUrl: string;
  weightGrams: number;
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
    const url = `${AMOLEN_STORE_INFO.productsUrl}?limit=${limit}&page=${page}`;
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
    
    if (products.length === 0) break;
    
    // Filter for filament products only
    const filamentProducts = products.filter((p: ShopifyProduct) => {
      const title = p.title.toLowerCase();
      const productType = (p.product_type || '').toLowerCase();
      
      // Skip non-filament products
      if (
        productType.includes('accessory') ||
        productType.includes('tool') ||
        productType.includes('part') ||
        title.includes('nozzle') ||
        title.includes('dryer') ||
        title.includes('storage') ||
        title.includes('bag')
      ) {
        console.log(`[Step 1] Skipping non-filament: ${p.title}`);
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
    
    if (products.length < limit) break;
    
    page++;
    await new Promise(resolve => setTimeout(resolve, 500));
  }
  
  console.log(`[Step 1] Total filament products fetched: ${allProducts.length}`);
  return allProducts;
}

// ============================================================================
// STEP 2: PROCESS VARIANTS (Amolen-specific logic)
// ============================================================================

function processVariants(products: ShopifyProduct[]): ProcessedVariant[] {
  const variants: ProcessedVariant[] = [];
  const seenKeys = new Set<string>();
  const filterStats = createFilterStats();
  
  for (const product of products) {
    const primaryImage = product.images?.[0]?.src || null;
    const isVarietyPack = isAmolenVarietyPack(product.title);
    
    // For products with delivery options, prefer "U.S. to U.S." for accurate US pricing
    // (China to U.S. variants often have different/outdated prices)
    // Group variants by color, take only one per color
    const colorVariantMap = new Map<string, ShopifyVariant>();
    
    for (const variant of product.variants) {
      // AMOLEN-SPECIFIC: Prefer "U.S. to U.S." delivery variants for accurate US pricing
      // The website displays US prices but China variants in JSON may have different prices
      const isUSDelivery = variant.option1?.toLowerCase().includes('u.s. to u.s.');
      const isChinaDelivery = variant.option1?.toLowerCase().includes('china');
      
      // Extract color from variant options
      const color = extractAmolenColorFromVariant(
        variant.option1,
        variant.option2,
        variant.option3,
        product.title
      );
      
      // For variety packs, use product ID as key (one entry per pack)
      // For regular products, use color as key
      const colorKey = isVarietyPack ? 'pack' : (color || 'default');
      
      // If we already have this color, decide which variant to keep
      const existing = colorVariantMap.get(colorKey);
      if (existing) {
        // Prefer US delivery (accurate US pricing shown on website)
        const existingIsUS = existing.option1?.toLowerCase().includes('u.s. to u.s.');
        if (isUSDelivery && !existingIsUS) {
          colorVariantMap.set(colorKey, variant);
        }
        // Otherwise keep existing
      } else {
        colorVariantMap.set(colorKey, variant);
      }
    }
    
    // Process the deduplicated variants
    for (const [colorKey, variant] of colorVariantMap) {
      // Extract weight: prefer title-based extraction over variant.grams (which is often shipping weight)
      // Product title often has weight like "1KG/2.2LB"
      const weightFromVariantTitle = extractWeightFromText(variant.title);
      const weightFromProductTitle = extractWeightFromText(product.title);
      // Only use variant.grams if it's a reasonable filament weight (500g-3000g) and no title weight found
      const isReasonableGrams = variant.grams && variant.grams >= 500 && variant.grams <= 3000;
      const weightGrams = weightFromVariantTitle || weightFromProductTitle || (isReasonableGrams ? variant.grams : null) || 1000;
      
      // Apply weight/diameter filters and keyword exclusion
      const filterResult = shouldIncludeVariant(weightGrams, 1.75, product.title);
      updateFilterStats(filterStats, filterResult);
      
      if (!filterResult.include) {
        console.log(`[Step 2] Filtering: ${product.title} - ${filterResult.reason}`);
        continue;
      }
      
      // Extract color for non-variety products
      let color = isAmolenVarietyPack(product.title) 
        ? null 
        : extractAmolenColorFromVariant(variant.option1, variant.option2, variant.option3, product.title);
      
      // For rainbow/gradient products with no variant color, extract from product title
      // e.g., "PETG Transparent Rainbow Filament" → "Transparent Rainbow"
      if (!color && !isAmolenVarietyPack(product.title)) {
        const rainbowMatch = product.title.match(/\b((?:Transparent|Pastel|Matte|Silk)\s+Rainbow[^,]*?)\s*(?:Filament|1\.75|,|$)/i);
        if (rainbowMatch) {
          color = rainbowMatch[1].trim();
        } else if (/rainbow/i.test(product.title)) {
          // Generic rainbow fallback
          const genericMatch = product.title.match(/\b(\w+\s+Rainbow)\b/i);
          color = genericMatch ? genericMatch[1].trim() : 'Rainbow';
        }
      }
      
      // Create unique key for deduplication
      const dedupeKey = `${product.id}-${colorKey}`;
      if (seenKeys.has(dedupeKey)) continue;
      seenKeys.add(dedupeKey);
      
      variants.push({
        productId: `${product.id}-${variant.id}`,
        productTitle: product.title, // Use original Shopify title, NOT constructed
        handle: product.handle,
        variantId: variant.id,
        color,
        price: parseFloat(variant.price) || 0,
        compareAtPrice: variant.compare_at_price ? parseFloat(variant.compare_at_price) : null,
        sku: variant.sku,
        available: variant.available,
        imageUrl: primaryImage,
        productUrl: getAmolenProductUrl(product.handle, variant.id),
        weightGrams,
      });
    }
  }
  
  logFilterStats('Amolen', filterStats);
  console.log(`[Step 2] Processed ${variants.length} unique variants`);
  return variants;
}

// ============================================================================
// STEP 3: UPSERT WITH ENRICHMENTS
// ============================================================================

async function upsertVariants(
  supabase: any,
  variants: ProcessedVariant[],
  brandId: string | null
): Promise<{ created: number; updated: number; errors: number }> {
  let created = 0;
  let updated = 0;
  let errors = 0;
  
  for (const variant of variants) {
    try {
      // Apply brand-specific enrichments
      const enrichment = enrichAmolenProduct(
        variant.productTitle,
        variant.color,
        null
      );
      
      // Construct display title
      // For variety packs: use cleaned title as-is
      // For rainbow/gradient products with named variants (e.g., Sunset Rainbow, Candy Rainbow):
      //   These need the variant color appended for proper swatch display
      // For regular products: append color for swatch display
      const isRainbowProduct = /\brainbow\b/i.test(variant.productTitle);
      let displayTitle: string;
      
      if (enrichment.is_variety_pack) {
        displayTitle = cleanAmolenTitle(variant.productTitle);
      } else if (isRainbowProduct && variant.color) {
        // Rainbow products WITH a named variant (e.g., "Sunset Rainbow", "Candy Rainbow")
        // These ARE distinct color variants that need color appended for swatch display
        // Example: "PLA Matte Rainbow" + "Sunset Rainbow" = "PLA Matte Rainbow - Sunset Rainbow"
        const cleanedTitle = cleanAmolenTitle(variant.productTitle);
        const colorLower = variant.color.toLowerCase();
        const titleLower = cleanedTitle.toLowerCase();
        
        // Only append if the color isn't already fully contained in the title
        // e.g., "PETG Transparent Rainbow" already has the color in it
        if (!titleLower.includes(colorLower)) {
          displayTitle = `${cleanedTitle} - ${variant.color}`;
        } else {
          displayTitle = cleanedTitle;
        }
      } else if (variant.color) {
        // Regular products: append color for swatch identification
        displayTitle = `${cleanAmolenTitle(variant.productTitle)} - ${variant.color}`;
      } else {
        displayTitle = cleanAmolenTitle(variant.productTitle);
      }
      
      const filamentData = {
        product_id: variant.productId,
        product_title: displayTitle,
        product_handle: variant.handle,
        vendor: AMOLEN_STORE_INFO.vendor,
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
        color_hex: enrichment.color_hex,
        color_family: variant.color,
        diameter_nominal_mm: 1.75,
        net_weight_g: variant.weightGrams,
        nozzle_temp_min_c: enrichment.print_settings?.nozzle_temp_min_c,
        nozzle_temp_max_c: enrichment.print_settings?.nozzle_temp_max_c,
        bed_temp_min_c: enrichment.print_settings?.bed_temp_min_c,
        bed_temp_max_c: enrichment.print_settings?.bed_temp_max_c,
        high_speed_capable: enrichment.high_speed_capable,
        auto_created: true,
        auto_updated: true,
        last_scraped_at: new Date().toISOString(),
        sync_status: 'synced',
        tds_url: null, // Amolen doesn't have TDS documents
      };
      
      // Check if exists
      const { data: existing } = await supabase
        .from('filaments')
        .select('id')
        .eq('product_id', variant.productId)
        .eq('vendor', AMOLEN_STORE_INFO.vendor)
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
  const { error } = await supabase
    .from('automated_brands')
    .update({
      platform_type: 'shopify',
      base_url: AMOLEN_STORE_INFO.baseUrl,
      products_url: AMOLEN_STORE_INFO.productsUrl,
      has_api: true,
      last_scrape_at: new Date().toISOString(),
      notes: 'Shopify store with Silk (single/dual/tri), Matte, and specialty PLA. Uses delivery option variants.',
    })
    .eq('brand_slug', 'amolen');
  
  if (error) {
    console.error('[Step 4] Error updating brand stats:', error);
  } else {
    console.log('[Step 4] Brand stats updated');
  }
  
  const { error: rpcError } = await supabase.rpc('update_brand_product_counts', {
    p_brand_slug: 'amolen'
  });
  
  if (rpcError) {
    console.error('[Step 4] Error updating product counts:', rpcError);
  }
}

// ============================================================================
// STEP 5: FIX DUPLICATE HEX CODES
// ============================================================================

async function fixDuplicateHexCodes(supabase: any): Promise<number> {
  const { data: duplicates, error } = await supabase.rpc('find_duplicate_hexes', {
    p_vendor: AMOLEN_STORE_INFO.vendor
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
  
  const groups = new Map<string, any[]>();
  for (const dup of duplicates) {
    const key = `${dup.product_line_id}-${dup.color_hex?.toLowerCase()}`;
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key)!.push(dup);
  }
  
  let fixed = 0;
  for (const [, items] of groups) {
    for (let i = 1; i < items.length; i++) {
      const item = items[i];
      const originalHex = item.color_hex;
      if (!originalHex) continue;
      
      const hex = originalHex.replace('#', '');
      const r = parseInt(hex.substring(0, 2), 16);
      const g = parseInt(hex.substring(2, 4), 16);
      const b = parseInt(hex.substring(4, 6), 16);
      
      const newR = Math.min(255, Math.max(0, r + i * 3));
      const newG = Math.min(255, Math.max(0, g + i * 2));
      const newB = Math.min(255, Math.max(0, b + i));
      
      const newHex = `#${newR.toString(16).padStart(2, '0')}${newG.toString(16).padStart(2, '0')}${newB.toString(16).padStart(2, '0')}`.toUpperCase();
      
      const { error: updateError } = await supabase
        .from('filaments')
        .update({ color_hex: newHex })
        .eq('id', item.id);
      
      if (!updateError) fixed++;
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
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    let options = { cleanSlate: false, skipFetch: false };
    try {
      const body = await req.json();
      options = { ...options, ...body };
    } catch {
      // Use defaults
    }
    
    console.log(`[Amolen Sync] Starting sync with options:`, options);
    
    // Get brand ID
    const { data: brand } = await supabase
      .from('automated_brands')
      .select('id')
      .eq('brand_slug', 'amolen')
      .maybeSingle();
    
    const brandId = brand?.id || null;
    console.log(`[Amolen Sync] Brand ID: ${brandId}`);
    
    // Clean slate if requested
    if (options.cleanSlate) {
      const { data: deleted } = await supabase
        .from('filaments')
        .delete()
        .ilike('vendor', AMOLEN_STORE_INFO.vendor)
        .select('id');
      
      const count = deleted?.length || 0;
      console.log(`[Clean Slate] Deleted ${count} existing products`);
      results.push({
        step: 'clean_slate',
        success: true,
        count,
        details: `Deleted ${count} existing ${AMOLEN_STORE_INFO.vendor} products`,
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
      } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        results.push({
          step: 'fetch_products',
          success: false,
          error: errorMessage,
        });
        throw error;
      }
    }
    
    // Step 2: Process variants
    const variants = processVariants(products);
    results.push({
      step: 'process_variants',
      success: true,
      count: variants.length,
      details: `Processed ${variants.length} unique color variants`,
    });
    
    // Step 3: Upsert to database
    const upsertResult = await upsertVariants(supabase, variants, brandId);
    results.push({
      step: 'upsert_variants',
      success: upsertResult.errors === 0,
      count: upsertResult.created + upsertResult.updated,
      details: `Created: ${upsertResult.created}, Updated: ${upsertResult.updated}, Errors: ${upsertResult.errors}`,
    });
    
    // Step 4: Update brand stats
    await updateBrandStats(supabase);
    results.push({
      step: 'update_stats',
      success: true,
      details: 'Brand statistics updated',
    });
    
    // Step 5: Fix duplicate hex codes
    const hexFixed = await fixDuplicateHexCodes(supabase);
    results.push({
      step: 'fix_duplicates',
      success: true,
      count: hexFixed,
      details: `Fixed ${hexFixed} duplicate hex codes`,
    });
    
    const duration = ((Date.now() - startTime) / 1000).toFixed(1);
    
    return new Response(
      JSON.stringify({
        success: true,
        brand: 'Amolen',
        duration: `${duration}s`,
        results,
        summary: {
          productsDiscovered: products.length,
          variantsProcessed: variants.length,
          created: upsertResult.created,
          updated: upsertResult.updated,
          errors: upsertResult.errors,
        },
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
    
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error('[Amolen Sync] Fatal error:', error);
    
    return new Response(
      JSON.stringify({
        success: false,
        brand: 'Amolen',
        error: errorMessage,
        results,
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
