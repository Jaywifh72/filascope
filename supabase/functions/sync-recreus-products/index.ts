import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import {
  enrichRecreousProduct,
  parseRecreousVariant,
  cleanRecreousTitle,
  getRecreousColorHex,
  normalizeRecreousMaterial,
} from '../_shared/recreus-defaults.ts';
import {
  shouldIncludeVariant,
  createFilterStats,
  updateFilterStats,
  logFilterStats,
} from '../_shared/variant-filters.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// ============================================================================
// TYPES
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
  tags: string[];
  variants: ShopifyVariant[];
  images: ShopifyImage[];
}

interface ShopifyVariant {
  id: number;
  product_id: number;
  title: string;
  price: string;
  compare_at_price: string | null;
  sku: string;
  available: boolean;
  grams: number;
  option1: string | null;
  option2: string | null;
  option3: string | null;
}

interface ShopifyImage {
  id: number;
  src: string;
  alt: string | null;
  variant_ids: number[];
}

interface ProductVariant {
  productId: string;
  variantId: string;
  title: string;
  color: string | null;
  diameter: number;
  weight: number;
  price: number;
  compareAtPrice: number | null;
  available: boolean;
  sku: string | null;
  imageUrl: string | null;
  productUrl: string;
  handle: string;
}

interface SyncResult {
  step: string;
  success: boolean;
  count?: number;
  details?: string;
  error?: string;
}

// ============================================================================
// STEP 1: FETCH PRODUCTS FROM SHOPIFY JSON API
// ============================================================================

async function fetchShopifyProducts(): Promise<ShopifyProduct[]> {
  const products: ShopifyProduct[] = [];
  let page = 1;
  const limit = 250;
  
  while (true) {
    const url = `https://recreus.com/products.json?limit=${limit}&page=${page}`;
    console.log(`Fetching page ${page}: ${url}`);
    
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'FilaScope-Sync/1.0',
        'Accept': 'application/json',
      },
    });
    
    if (!response.ok) {
      throw new Error(`Failed to fetch products: ${response.status}`);
    }
    
    const data = await response.json();
    const pageProducts = data.products || [];
    
    if (pageProducts.length === 0) break;
    
    // Filter to filament products only
    const filamentProducts = pageProducts.filter((p: ShopifyProduct) => {
      const title = p.title.toLowerCase();
      const type = (p.product_type || '').toLowerCase();
      
      // Include filament products
      if (title.includes('filaflex') || title.includes('reciflex') || 
          title.includes('balena') || title.includes('pet-g') ||
          title.includes('petg') || title.includes('pla') ||
          title.includes('pp3d') || title.includes('pp-3d') ||
          type.includes('filament')) {
        return true;
      }
      
      // Exclude accessories, gift cards, sample packs
      if (title.includes('gift') || title.includes('sample') ||
          title.includes('pack') || title.includes('accessory') ||
          type.includes('gift') || type.includes('accessory')) {
        return false;
      }
      
      return false;
    });
    
    products.push(...filamentProducts);
    console.log(`Page ${page}: ${filamentProducts.length} filament products (${pageProducts.length} total)`);
    
    if (pageProducts.length < limit) break;
    page++;
    
    // Rate limiting
    await new Promise(resolve => setTimeout(resolve, 500));
  }
  
  console.log(`Total filament products fetched: ${products.length}`);
  return products;
}

// ============================================================================
// STEP 2: EXPLODE VARIANTS
// ============================================================================

function explodeVariants(products: ShopifyProduct[]): ProductVariant[] {
  const variants: ProductVariant[] = [];
  const filterStats = createFilterStats();
  
  for (const product of products) {
    for (const variant of product.variants) {
      // Parse variant options
      const variantTitle = variant.title || '';
      const parsed = parseRecreousVariant(variantTitle);
      
      // Try to get color from variant options or title
      let color = parsed.color;
      if (!color && variant.option1 && !/default|title/i.test(variant.option1)) {
        color = variant.option1;
      }
      
      // Apply standard filtering (samples, bulk, 2.85mm, excluded keywords)
      const filterResult = shouldIncludeVariant(parsed.weight || variant.grams, parsed.diameter, product.title);
      updateFilterStats(filterStats, filterResult);
      if (!filterResult.include) {
        console.log(`[Recreus] Skipping: ${product.title} - ${color} (${filterResult.reason})`);
        continue;
      }
      
      // Find matching image
      let imageUrl: string | null = null;
      const variantImage = product.images.find(img => 
        img.variant_ids.includes(variant.id)
      );
      if (variantImage) {
        imageUrl = variantImage.src;
      } else if (product.images.length > 0) {
        imageUrl = product.images[0].src;
      }
      
      // Build product URL
      const productUrl = `https://recreus.com/products/${product.handle}`;
      
      variants.push({
        productId: `recreus-${product.id}-${variant.id}`,
        variantId: String(variant.id),
        title: product.title,
        color,
        diameter: parsed.diameter,
        weight: parsed.weight || variant.grams,
        price: parseFloat(variant.price) || 0,
        compareAtPrice: variant.compare_at_price ? parseFloat(variant.compare_at_price) : null,
        available: variant.available !== false,
        sku: variant.sku || null,
        imageUrl,
        productUrl,
        handle: product.handle,
      });
    }
  }
  
  logFilterStats('Recreus', filterStats);
  console.log(`Exploded ${products.length} products into ${variants.length} variants`);
  return variants;
}

// ============================================================================
// STEP 3: UPSERT WITH BRAND-SPECIFIC ENRICHMENTS
// ============================================================================

async function insertVariants(
  supabase: any,
  variants: ProductVariant[],
  brandId: string | null
): Promise<{ inserted: number; errors: number }> {
  let inserted = 0;
  let errors = 0;
  
  // Process in batches
  const batchSize = 50;
  for (let i = 0; i < variants.length; i += batchSize) {
    const batch = variants.slice(i, i + batchSize);
    
    const records = batch.map(v => {
      // Apply Recreus-specific enrichment
      const enrichment = enrichRecreousProduct(v.title, v.color || undefined);
      
      // Try to get color hex from variant color name
      const colorHex = v.color ? getRecreousColorHex(v.color) : enrichment.colorHex;
      
      // Clean the title
      const cleanedTitle = cleanRecreousTitle(v.title);
      const displayTitle = v.color 
        ? `${cleanedTitle} - ${v.color}` 
        : cleanedTitle;
      
      return {
        product_id: v.productId,
        product_title: displayTitle,
        vendor: 'Recreus',
        brand_id: brandId,
        variant_price: v.price,
        variant_compare_at_price: v.compareAtPrice,
        variant_available: v.available,
        variant_sku: v.sku,
        product_url: v.productUrl,
        product_handle: v.handle,
        featured_image: v.imageUrl,
        diameter_nominal_mm: v.diameter,
        net_weight_g: v.weight,
        material: enrichment.material,
        finish_type: enrichment.finishType,
        product_line_id: enrichment.productLineId,
        tds_url: enrichment.tdsUrl,
        color_hex: colorHex,
        color_family: v.color,
        nozzle_temp_min_c: enrichment.nozzleTempMin,
        nozzle_temp_max_c: enrichment.nozzleTempMax,
        bed_temp_min_c: enrichment.bedTempMin,
        bed_temp_max_c: enrichment.bedTempMax,
        print_speed_max_mms: enrichment.printSpeedMax,
        is_nozzle_abrasive: enrichment.isAbrasive,
        auto_created: true,
        auto_updated: true,
        last_scraped_at: new Date().toISOString(),
        sync_status: 'synced',
      };
    });
    
    const { error } = await supabase
      .from('filaments')
      .insert(records);
    
    if (error) {
      console.error(`Batch insert error:`, error);
      errors += batch.length;
    } else {
      inserted += batch.length;
    }
  }
  
  console.log(`Inserted ${inserted} variants, ${errors} errors`);
  return { inserted, errors };
}

// ============================================================================
// STEP 4: FIX DUPLICATE HEX CODES
// ============================================================================

async function fixDuplicateHexCodes(
  supabase: any
): Promise<{ checked: number; fixed: number }> {
  // Find duplicates using RPC
  const { data: duplicates, error } = await supabase
    .rpc('find_duplicate_hexes', { p_vendor: 'Recreus' });
  
  if (error) {
    console.error('Error finding duplicate hex codes:', error);
    return { checked: 0, fixed: 0 };
  }
  
  const dupeArray = duplicates as Array<{ id: string; product_line_id: string; color_hex: string }> | null;
  
  if (!dupeArray || dupeArray.length === 0) {
    console.log('No duplicate hex codes found');
    return { checked: 0, fixed: 0 };
  }
  
  console.log(`Found ${dupeArray.length} entries with duplicate hex codes`);
  
  // Group by product_line_id and hex
  const groups = new Map<string, typeof dupeArray>();
  for (const d of dupeArray) {
    const key = `${d.product_line_id}:${d.color_hex?.toLowerCase()}`;
    if (!groups.has(key)) {
      groups.set(key, []);
    }
    groups.get(key)!.push(d);
  }
  
  let fixed = 0;
  for (const [, group] of groups) {
    // Skip first entry, adjust others
    for (let i = 1; i < group.length; i++) {
      const entry = group[i];
      const baseHex = entry.color_hex?.replace('#', '') || 'FFFFFF';
      
      // Generate a slightly different hex
      const r = parseInt(baseHex.slice(0, 2), 16);
      const g = parseInt(baseHex.slice(2, 4), 16);
      const b = parseInt(baseHex.slice(4, 6), 16);
      
      // Adjust based on index
      const newR = Math.min(255, Math.max(0, r + i * 3));
      const newG = Math.min(255, Math.max(0, g + i * 2));
      const newB = Math.min(255, Math.max(0, b + i));
      
      const newHex = `#${newR.toString(16).padStart(2, '0')}${newG.toString(16).padStart(2, '0')}${newB.toString(16).padStart(2, '0')}`.toUpperCase();
      
      const { error: updateError } = await supabase
        .from('filaments')
        .update({ color_hex: newHex })
        .eq('id', entry.id);
      
      if (!updateError) {
        fixed++;
      }
    }
  }
  
  console.log(`Fixed ${fixed} duplicate hex codes`);
  return { checked: dupeArray.length, fixed };
}

// ============================================================================
// STEP 5: VALIDATE TDS URLS (SAMPLE)
// ============================================================================

async function validateTdsUrls(
  supabase: any
): Promise<{ sampled: number; valid: number }> {
  // Get a sample of products with TDS URLs
  const { data: samples, error } = await supabase
    .from('filaments')
    .select('id, tds_url')
    .eq('vendor', 'Recreus')
    .not('tds_url', 'is', null)
    .limit(5);
  
  if (error || !samples) {
    console.error('Error fetching TDS samples:', error);
    return { sampled: 0, valid: 0 };
  }
  
  const sampleArray = samples as Array<{ id: string; tds_url: string }>;
  
  let valid = 0;
  for (const sample of sampleArray) {
    try {
      const response = await fetch(sample.tds_url, { method: 'HEAD' });
      if (response.ok || response.status === 302 || response.status === 303) {
        valid++;
      }
    } catch {
      console.log(`TDS URL check failed for ${sample.id}`);
    }
  }
  
  console.log(`TDS validation: ${valid}/${sampleArray.length} valid`);
  return { sampled: sampleArray.length, valid };
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
    // Parse request body
    const body = await req.json().catch(() => ({}));
    const cleanSlate = body.cleanSlate === true;
    const skipFetch = body.skipFetch === true;
    
    console.log(`Starting Recreus sync (cleanSlate: ${cleanSlate}, skipFetch: ${skipFetch})`);
    
    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    // Get brand ID
    const { data: brand } = await supabase
      .from('automated_brands')
      .select('id')
      .eq('brand_slug', 'recreus')
      .single();
    
    const brandId = brand?.id || null;
    console.log(`Brand ID: ${brandId}`);
    
    // ========================================================================
    // STEP 0: CLEAN SLATE (if requested)
    // ========================================================================
    if (cleanSlate) {
      console.log('Performing clean slate deletion...');
      
      // First count existing records
      const { count } = await supabase
        .from('filaments')
        .select('id', { count: 'exact', head: true })
        .ilike('vendor', 'recreus');
      
      // Then delete
      const { error: deleteError } = await supabase
        .from('filaments')
        .delete()
        .ilike('vendor', 'recreus');
      
      if (deleteError) {
        console.error('Clean slate deletion failed:', deleteError);
        results.push({ step: 'clean_slate', success: false, error: deleteError.message });
      } else {
        console.log(`Deleted ${count || 0} existing Recreus products`);
        results.push({ step: 'clean_slate', success: true, count: count || 0 });
      }
    }
    
    // ========================================================================
    // STEP 1: FETCH PRODUCTS
    // ========================================================================
    let products: ShopifyProduct[] = [];
    if (!skipFetch) {
      try {
        products = await fetchShopifyProducts();
        results.push({ 
          step: 'fetch_products', 
          success: true, 
          count: products.length,
          details: `Fetched ${products.length} filament products from Shopify`
        });
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        console.error('Fetch failed:', message);
        results.push({ step: 'fetch_products', success: false, error: message });
        
        return new Response(JSON.stringify({
          success: false,
          vendor: 'Recreus',
          results,
          duration: Date.now() - startTime,
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 500,
        });
      }
    }
    
    // ========================================================================
    // STEP 2: EXPLODE VARIANTS
    // ========================================================================
    const variants = explodeVariants(products);
    results.push({ 
      step: 'explode_variants', 
      success: true, 
      count: variants.length,
      details: `Exploded ${products.length} products into ${variants.length} variants`
    });
    
    // ========================================================================
    // STEP 3: INSERT WITH ENRICHMENTS
    // ========================================================================
    if (variants.length > 0) {
      const { inserted, errors } = await insertVariants(supabase, variants, brandId);
      results.push({ 
        step: 'insert_variants', 
        success: errors === 0, 
        count: inserted,
        details: `Inserted ${inserted} variants, ${errors} errors`
      });
    }
    
    // ========================================================================
    // STEP 4: FIX DUPLICATE HEX CODES
    // ========================================================================
    const { checked, fixed } = await fixDuplicateHexCodes(supabase);
    results.push({ 
      step: 'fix_duplicate_hexes', 
      success: true, 
      count: fixed,
      details: `Checked ${checked} duplicates, fixed ${fixed}`
    });
    
    // ========================================================================
    // STEP 5: VALIDATE TDS URLS
    // ========================================================================
    const { sampled, valid } = await validateTdsUrls(supabase);
    results.push({ 
      step: 'validate_tds_urls', 
      success: true, 
      count: valid,
      details: `Validated ${valid}/${sampled} sampled TDS URLs`
    });
    
    // ========================================================================
    // UPDATE BRAND STATS
    // ========================================================================
    if (brandId) {
      await supabase.rpc('update_brand_product_counts', { p_brand_slug: 'recreus' });
      await supabase.rpc('update_brand_enrichment_counts', { p_brand_slug: 'recreus' });
    }
    
    const duration = Date.now() - startTime;
    console.log(`Sync completed in ${duration}ms`);
    
    return new Response(JSON.stringify({
      success: true,
      vendor: 'Recreus',
      results,
      duration,
      summary: {
        productsProcessed: products.length,
        variantsCreated: variants.length,
        allStepsSuccessful: results.every(r => r.success),
      },
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
    
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error('Fatal sync error:', message);
    
    return new Response(JSON.stringify({
      success: false,
      vendor: 'Recreus',
      results,
      error: message,
      duration: Date.now() - startTime,
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});
