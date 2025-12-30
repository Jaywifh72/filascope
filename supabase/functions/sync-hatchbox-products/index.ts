import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import {
  enrichHatchboxProduct,
  isHatchboxAccessory,
  HATCHBOX_STORE_INFO,
  getHatchboxProductUrl,
} from '../_shared/hatchbox-defaults.ts';

// ============================================================================
// TYPES
// ============================================================================

interface ShopifyProduct {
  id: number;
  title: string;
  handle: string;
  vendor: string;
  product_type: string;
  published_at: string;
  variants: ShopifyVariant[];
  images: ShopifyImage[];
  tags: string[];
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
  alt: string | null;
}

interface ProductVariant {
  productId: string;
  variantId: string;
  title: string;
  handle: string;
  variantTitle: string | null;
  colorName: string | null;
  price: number;
  compareAtPrice: number | null;
  available: boolean;
  sku: string | null;
  imageUrl: string | null;
  productUrl: string;
  weight: number;
  diameter: number;
}

interface SyncResult {
  step: string;
  success: boolean;
  count?: number;
  details?: string;
  error?: string;
}

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
  
  console.log('[Step 1] Fetching products from Hatchbox Shopify store...');
  
  while (true) {
    const url = `${HATCHBOX_STORE_INFO.productsJsonUrl}?limit=${limit}&page=${page}`;
    console.log(`[Step 1] Fetching page ${page}: ${url}`);
    
    const response = await fetch(url, {
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'FilamentDB-Sync/1.0',
      },
    });
    
    if (!response.ok) {
      throw new Error(`Failed to fetch products: ${response.status} ${response.statusText}`);
    }
    
    const data = await response.json();
    const products = data.products || [];
    
    if (products.length === 0) {
      break;
    }
    
    // Filter to filament products only (exclude accessories like resins)
    const filamentProducts = products.filter((p: ShopifyProduct) => {
      const isAccessory = isHatchboxAccessory(p.title);
      if (isAccessory) {
        console.log(`[Step 1] Skipping accessory: ${p.title}`);
      }
      return !isAccessory;
    });
    
    allProducts.push(...filamentProducts);
    console.log(`[Step 1] Page ${page}: ${filamentProducts.length} filament products (${products.length - filamentProducts.length} accessories skipped)`);
    
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

function processVariants(products: ShopifyProduct[]): ProductVariant[] {
  const variants: ProductVariant[] = [];
  
  console.log('[Step 2] Processing Shopify products into variants...');
  
  for (const product of products) {
    // Get the primary image
    const primaryImage = product.images?.[0]?.src || null;
    
    // Hatchbox typically has color as variant option
    for (const variant of product.variants) {
      // Extract color from variant option
      const variantTitle = variant.title !== 'Default Title' ? variant.title : null;
      const colorName = variant.option1 || variantTitle || null;
      
      // Parse weight from title (default 1kg)
      let weight = 1000;
      const weightMatch = product.title.match(/(\d+\.?\d*)\s*(g|kg|lbs?)/i);
      if (weightMatch) {
        const value = parseFloat(weightMatch[1]);
        const unit = weightMatch[2].toLowerCase();
        if (unit === 'kg') {
          weight = value * 1000;
        } else if (unit === 'g') {
          weight = value;
        } else if (unit.startsWith('lb')) {
          weight = value * 453.592;
        }
      }
      
      // Parse diameter from title
      let diameter = HATCHBOX_STORE_INFO.defaultDiameter;
      if (product.title.includes('2.85') || product.title.includes('3mm')) {
        diameter = 2.85;
      }
      
      variants.push({
        productId: `hatchbox-${product.id}-${variant.id}`,
        variantId: String(variant.id),
        title: product.title,
        handle: product.handle,
        variantTitle,
        colorName,
        price: parseFloat(variant.price),
        compareAtPrice: variant.compare_at_price ? parseFloat(variant.compare_at_price) : null,
        available: variant.available,
        sku: variant.sku || null,
        imageUrl: primaryImage,
        productUrl: getHatchboxProductUrl(product.handle),
        weight,
        diameter,
      });
    }
  }
  
  console.log(`[Step 2] Processed ${variants.length} variants from ${products.length} products`);
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
  console.log('[Step 3] Upserting variants with brand-specific enrichments...');
  
  let created = 0;
  let updated = 0;
  let errors = 0;
  
  for (const variant of variants) {
    try {
      // Apply Hatchbox-specific enrichments
      const enrichment = enrichHatchboxProduct(
        variant.title, 
        variant.variantTitle,
        variant.sku
      );
      
      // Skip accessories that slipped through
      if (enrichment.is_accessory) {
        console.log(`[Step 3] Skipping accessory: ${variant.title}`);
        continue;
      }
      
      const filamentData = {
        product_id: variant.productId,
        product_title: variant.title,
        product_handle: variant.handle,
        vendor: HATCHBOX_STORE_INFO.vendor,
        brand_id: brandId,
        variant_price: variant.price,
        variant_compare_at_price: variant.compareAtPrice,
        variant_available: variant.available,
        variant_sku: variant.sku,
        product_url: variant.productUrl,
        featured_image: variant.imageUrl,
        net_weight_g: variant.weight,
        diameter_nominal_mm: enrichment.diameter_nominal_mm,
        material: enrichment.material,
        finish_type: enrichment.finish_type,
        product_line_id: enrichment.product_line_id,
        tds_url: enrichment.tds_url,
        color_hex: enrichment.color_hex,
        high_speed_capable: enrichment.high_speed_capable,
        nozzle_temp_min_c: enrichment.print_settings?.nozzle_temp_min_c,
        nozzle_temp_max_c: enrichment.print_settings?.nozzle_temp_max_c,
        bed_temp_min_c: enrichment.print_settings?.bed_temp_min_c,
        bed_temp_max_c: enrichment.print_settings?.bed_temp_max_c,
        auto_created: true,
        auto_updated: true,
        last_scraped_at: new Date().toISOString(),
        sync_status: 'synced',
      };
      
      // Check if exists
      const { data: existing } = await supabase
        .from('filaments')
        .select('id')
        .eq('product_id', variant.productId)
        .maybeSingle();
      
      if (existing) {
        // Update
        const { error } = await supabase
          .from('filaments')
          .update(filamentData)
          .eq('id', existing.id);
        
        if (error) {
          console.error(`[Step 3] Error updating ${variant.title}:`, error.message);
          errors++;
        } else {
          updated++;
        }
      } else {
        // Insert
        const { error } = await supabase
          .from('filaments')
          .insert(filamentData);
        
        if (error) {
          console.error(`[Step 3] Error inserting ${variant.title}:`, error.message);
          errors++;
        } else {
          created++;
        }
      }
    } catch (err) {
      console.error(`[Step 3] Exception processing ${variant.title}:`, err);
      errors++;
    }
  }
  
  console.log(`[Step 3] Upsert complete: ${created} created, ${updated} updated, ${errors} errors`);
  return { created, updated, errors };
}

// ============================================================================
// STEP 4: VERIFY TDS URLS
// ============================================================================

async function verifyTdsUrls(supabase: any): Promise<{ verified: number; failed: number }> {
  console.log('[Step 4] Verifying TDS URLs...');
  
  // Get Hatchbox products with TDS URLs
  const { data: products, error } = await supabase
    .from('filaments')
    .select('id, product_title, tds_url')
    .ilike('vendor', 'hatchbox')
    .not('tds_url', 'is', null)
    .limit(10); // Sample verification
  
  if (error) {
    console.error('[Step 4] Error fetching products:', error.message);
    return { verified: 0, failed: 0 };
  }
  
  let verified = 0;
  let failed = 0;
  
  for (const product of products || []) {
    try {
      const response = await fetch(product.tds_url, {
        method: 'HEAD',
        headers: { 'User-Agent': 'FilamentDB-Sync/1.0' },
      });
      
      if (response.ok) {
        verified++;
        console.log(`[Step 4] TDS verified: ${product.product_title}`);
      } else {
        failed++;
        console.log(`[Step 4] TDS failed (${response.status}): ${product.product_title}`);
      }
    } catch (err) {
      failed++;
      console.error(`[Step 4] TDS check error for ${product.product_title}:`, err);
    }
    
    // Rate limiting
    await new Promise(resolve => setTimeout(resolve, 200));
  }
  
  console.log(`[Step 4] TDS verification: ${verified} verified, ${failed} failed`);
  return { verified, failed };
}

// ============================================================================
// STEP 5: FIX DUPLICATE HEX CODES
// ============================================================================

async function fixDuplicateHexCodes(supabase: any): Promise<{ fixed: number }> {
  console.log('[Step 5] Checking for duplicate hex codes...');
  
  // Find duplicates using RPC
  const { data: duplicates, error } = await supabase.rpc('find_duplicate_hexes', {
    p_vendor: 'Hatchbox',
  });
  
  if (error) {
    console.error('[Step 5] Error finding duplicates:', error.message);
    return { fixed: 0 };
  }
  
  if (!duplicates || duplicates.length === 0) {
    console.log('[Step 5] No duplicate hex codes found');
    return { fixed: 0 };
  }
  
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
  
  for (const [key, items] of groups) {
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
  
  console.log(`[Step 5] Fixed ${fixed} duplicate hex codes`);
  return { fixed };
}

// ============================================================================
// STEP 6: UPDATE BRAND STATS
// ============================================================================

async function updateBrandStats(supabase: any): Promise<void> {
  console.log('[Step 6] Updating brand statistics...');
  
  try {
    // Update automated_brands with correct platform info
    await supabase
      .from('automated_brands')
      .update({
        platform_type: 'shopify',
        base_url: HATCHBOX_STORE_INFO.baseUrl,
        products_url: HATCHBOX_STORE_INFO.productsJsonUrl,
        has_api: true,
        scraping_enabled: true,
        notes: 'Popular consumer filament brand. Shopify store with PLA, ABS, PETG, TPU, and specialty lines.',
      })
      .eq('brand_slug', 'hatchbox');
    
    await supabase.rpc('update_brand_product_counts', { p_brand_slug: 'hatchbox' });
    await supabase.rpc('update_brand_enrichment_counts', { p_brand_slug: 'hatchbox' });
    console.log('[Step 6] Brand statistics updated');
  } catch (err) {
    console.error('[Step 6] Error updating brand stats:', err);
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
  const results: SyncResult[] = [];
  
  try {
    console.log('='.repeat(60));
    console.log('Hatchbox Full Sync Pipeline Started');
    console.log('='.repeat(60));
    
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
    
    // Get brand ID
    const { data: brand } = await supabase
      .from('automated_brands')
      .select('id')
      .eq('brand_slug', 'hatchbox')
      .maybeSingle();
    
    const brandId = brand?.id || null;
    console.log(`Brand ID: ${brandId || 'not found'}`);
    
    // Clean slate if requested
    if (options.cleanSlate) {
      console.log('[Pre-Step] Clean slate: Deleting existing Hatchbox products...');
      const { data: deleted } = await supabase
        .from('filaments')
        .delete()
        .ilike('vendor', 'hatchbox')
        .select('id');
      
      const deletedCount = deleted?.length || 0;
      console.log(`[Pre-Step] Deleted ${deletedCount} existing products`);
      results.push({ step: 'clean_slate', success: true, count: deletedCount });
    }
    
    // Step 1: Fetch products
    let products: ShopifyProduct[] = [];
    if (!options.skipFetch) {
      try {
        products = await fetchShopifyProducts();
        results.push({ step: 'fetch', success: true, count: products.length });
      } catch (err) {
        const error = err instanceof Error ? err.message : String(err);
        console.error('[Step 1] Fetch failed:', error);
        results.push({ step: 'fetch', success: false, error });
        throw err;
      }
    } else {
      console.log('[Step 1] Skipping fetch (skipFetch=true)');
      results.push({ step: 'fetch', success: true, count: 0, details: 'skipped' });
    }
    
    // Step 2: Process variants
    const variants = processVariants(products);
    results.push({ step: 'process', success: true, count: variants.length });
    
    // Step 3: Upsert with enrichments
    const upsertResult = await upsertVariants(supabase, variants, brandId);
    results.push({
      step: 'upsert',
      success: upsertResult.errors === 0,
      count: upsertResult.created + upsertResult.updated,
      details: `${upsertResult.created} created, ${upsertResult.updated} updated, ${upsertResult.errors} errors`,
    });
    
    // Step 4: Verify TDS URLs
    const tdsResult = await verifyTdsUrls(supabase);
    results.push({
      step: 'verify_tds',
      success: true,
      count: tdsResult.verified,
      details: `${tdsResult.verified} verified, ${tdsResult.failed} failed`,
    });
    
    // Step 5: Fix duplicate hex codes
    const hexResult = await fixDuplicateHexCodes(supabase);
    results.push({
      step: 'fix_duplicates',
      success: true,
      count: hexResult.fixed,
    });
    
    // Step 6: Update brand stats
    await updateBrandStats(supabase);
    results.push({ step: 'update_stats', success: true });
    
    const duration = Date.now() - startTime;
    console.log('='.repeat(60));
    console.log(`Hatchbox Sync Complete in ${duration}ms`);
    console.log('='.repeat(60));
    
    return new Response(
      JSON.stringify({
        success: true,
        duration_ms: duration,
        results,
        summary: {
          products_fetched: products.length,
          variants_processed: variants.length,
          created: upsertResult.created,
          updated: upsertResult.updated,
          errors: upsertResult.errors,
          tds_verified: tdsResult.verified,
          duplicates_fixed: hexResult.fixed,
        },
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (err) {
    const error = err instanceof Error ? err.message : String(err);
    console.error('Sync failed:', error);
    
    return new Response(
      JSON.stringify({
        success: false,
        duration_ms: Date.now() - startTime,
        results,
        error,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});
