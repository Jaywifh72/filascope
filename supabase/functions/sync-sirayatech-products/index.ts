import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import {
  enrichSirayaTechProduct,
  parseSirayaTechVariant,
  isSirayaTechFilament,
  getSirayaTechColorHex,
} from '../_shared/sirayatech-defaults.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const VENDOR_NAME = 'Siraya Tech';
const BRAND_SLUG = 'sirayatech';
const BASE_URL = 'https://siraya.tech';

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
  grams: number;
}

interface ShopifyImage {
  id: number;
  src: string;
  alt: string | null;
  position: number;
}

interface ProductVariant {
  productId: string;
  variantId: string;
  title: string;
  handle: string;
  color: string | null;
  weightGrams: number | null;
  diameterMm: number;
  price: number | null;
  compareAtPrice: number | null;
  available: boolean;
  sku: string | null;
  imageUrl: string | null;
  productUrl: string;
  region: string | null;
}

interface SyncResult {
  step: string;
  success: boolean;
  count?: number;
  created?: number;
  updated?: number;
  skipped?: number;
  errors?: number;
  details?: string;
}

// ============================================================================
// STEP 1: FETCH PRODUCTS FROM SHOPIFY
// ============================================================================

async function fetchShopifyProducts(): Promise<ShopifyProduct[]> {
  const allProducts: ShopifyProduct[] = [];
  let page = 1;
  const limit = 250;
  
  console.log(`[${VENDOR_NAME}] Fetching products from Shopify API...`);
  
  while (true) {
    const url = `${BASE_URL}/products.json?limit=${limit}&page=${page}`;
    console.log(`[${VENDOR_NAME}] Fetching page ${page}: ${url}`);
    
    const response = await fetch(url, {
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'FilaScope/1.0 (Product Sync)',
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
    
    // Filter to filament products only (exclude resins, accessories)
    const filamentProducts = products.filter(isSirayaTechFilament);
    allProducts.push(...filamentProducts);
    
    console.log(`[${VENDOR_NAME}] Page ${page}: ${products.length} products, ${filamentProducts.length} filaments`);
    
    if (products.length < limit) {
      break;
    }
    
    page++;
    
    // Rate limiting
    await new Promise(resolve => setTimeout(resolve, 500));
  }
  
  console.log(`[${VENDOR_NAME}] Total filament products fetched: ${allProducts.length}`);
  return allProducts;
}

// ============================================================================
// STEP 2: EXPLODE VARIANTS
// ============================================================================

function explodeVariants(products: ShopifyProduct[]): ProductVariant[] {
  const variants: ProductVariant[] = [];
  
  for (const product of products) {
    const primaryImage = product.images[0]?.src || null;
    
    for (const variant of product.variants) {
      // Parse variant title for region/size/color
      const parsed = parseSirayaTechVariant(variant.title);
      
      // Extract color from options
      let color = parsed.color;
      if (!color) {
        color = variant.option1 || variant.option2 || variant.option3 || null;
        // Skip if it looks like a region or size
        if (color && /^(us|eu|au|ca|uk|\d+kg|\d+g)$/i.test(color)) {
          color = null;
        }
      }
      
      // Weight from variant grams or parsed
      const weightGrams = variant.grams > 0 ? variant.grams : parsed.weightGrams;
      
      // All Siraya Tech filaments are 1.75mm
      const diameterMm = 1.75;
      
      // Price parsing
      const price = variant.price ? parseFloat(variant.price) : null;
      const compareAtPrice = variant.compare_at_price ? parseFloat(variant.compare_at_price) : null;
      
      // Generate unique product ID
      const productId = `sirayatech-${product.id}-${variant.id}`;
      
      variants.push({
        productId,
        variantId: String(variant.id),
        title: product.title,
        handle: product.handle,
        color,
        weightGrams,
        diameterMm,
        price,
        compareAtPrice,
        available: variant.available,
        sku: variant.sku || null,
        imageUrl: primaryImage,
        productUrl: `${BASE_URL}/products/${product.handle}`,
        region: parsed.region,
      });
    }
  }
  
  console.log(`[${VENDOR_NAME}] Exploded ${products.length} products into ${variants.length} variants`);
  return variants;
}

// ============================================================================
// STEP 3: UPSERT VARIANTS WITH ENRICHMENT
// ============================================================================

async function upsertVariants(
  supabase: any,
  variants: ProductVariant[],
  brandId: string | null
): Promise<{ created: number; updated: number; errors: number }> {
  let created = 0;
  let updated = 0;
  let errors = 0;
  
  // Group variants by product to consolidate regional pricing
  const productMap = new Map<string, ProductVariant[]>();
  for (const variant of variants) {
    // Create a key without region to group regional variants
    const baseKey = `${variant.handle}-${variant.color || 'default'}-${variant.weightGrams || 0}`;
    if (!productMap.has(baseKey)) {
      productMap.set(baseKey, []);
    }
    productMap.get(baseKey)!.push(variant);
  }
  
  console.log(`[${VENDOR_NAME}] Processing ${productMap.size} unique product/color/size combinations`);
  
  for (const [key, regionalVariants] of productMap) {
    try {
      // Use first variant as base
      const baseVariant = regionalVariants.find(v => v.region === 'US') || regionalVariants[0];
      
      // Enrich with brand-specific data
      const enrichment = enrichSirayaTechProduct(
        baseVariant.title,
        baseVariant.handle,
        baseVariant.color || undefined
      );
      
      // Build regional price columns
      const priceUsd = regionalVariants.find(v => v.region === 'US')?.price || baseVariant.price;
      const priceEur = regionalVariants.find(v => v.region === 'EU')?.price || null;
      const priceAud = regionalVariants.find(v => v.region === 'AU')?.price || null;
      const priceCad = regionalVariants.find(v => v.region === 'CA')?.price || null;
      const priceGbp = regionalVariants.find(v => v.region === 'UK')?.price || null;
      
      // Generate unique product_id for this color/size combination
      const productId = `sirayatech-${baseVariant.handle}-${(baseVariant.color || 'default').toLowerCase().replace(/\s+/g, '-')}-${baseVariant.weightGrams || 0}g`;
      
      const filamentData: Record<string, any> = {
        product_id: productId,
        product_title: baseVariant.title,
        vendor: VENDOR_NAME,
        brand_id: brandId,
        product_url: baseVariant.productUrl,
        product_handle: baseVariant.handle,
        featured_image: baseVariant.imageUrl,
        variant_sku: baseVariant.sku,
        variant_available: baseVariant.available,
        
        // Pricing
        variant_price: priceUsd,
        variant_compare_at_price: baseVariant.compareAtPrice,
        price_eur: priceEur,
        price_aud: priceAud,
        price_cad: priceCad,
        price_gbp: priceGbp,
        
        // Physical specs
        diameter_nominal_mm: baseVariant.diameterMm,
        net_weight_g: baseVariant.weightGrams,
        
        // Enriched data
        material: enrichment.material,
        finish_type: enrichment.finishType,
        product_line_id: enrichment.productLineId,
        color_hex: enrichment.colorHex,
        tds_url: enrichment.tdsUrl,
        is_nozzle_abrasive: enrichment.isAbrasive,
        
        // Print settings
        nozzle_temp_min_c: enrichment.printSettings?.nozzleTempMin || null,
        nozzle_temp_max_c: enrichment.printSettings?.nozzleTempMax || null,
        bed_temp_min_c: enrichment.printSettings?.bedTempMin || null,
        bed_temp_max_c: enrichment.printSettings?.bedTempMax || null,
        print_speed_max_mms: enrichment.printSettings?.printSpeedMax || null,
        
        // Color extracted from variant
        color_family: baseVariant.color,
        
        // Sync metadata
        auto_created: true,
        auto_updated: true,
        last_scraped_at: new Date().toISOString(),
        sync_status: 'synced',
      };
      
      // Check if exists
      const { data: existing } = await supabase
        .from('filaments')
        .select('id')
        .eq('product_id', productId)
        .maybeSingle();
      
      if (existing) {
        // Update
        const { error } = await supabase
          .from('filaments')
          .update(filamentData)
          .eq('id', existing.id);
        
        if (error) throw error;
        updated++;
      } else {
        // Insert
        const { error } = await supabase
          .from('filaments')
          .insert(filamentData);
        
        if (error) throw error;
        created++;
      }
    } catch (err) {
      console.error(`[${VENDOR_NAME}] Error upserting variant ${key}:`, err);
      errors++;
    }
  }
  
  console.log(`[${VENDOR_NAME}] Upsert complete: ${created} created, ${updated} updated, ${errors} errors`);
  return { created, updated, errors };
}

// ============================================================================
// STEP 4: SCRAPE TDS URLS (Optional - uses Firecrawl)
// ============================================================================

async function scrapeTdsUrls(supabase: any): Promise<{ updated: number; skipped: number }> {
  const firecrawlKey = Deno.env.get('FIRECRAWL_API_KEY');
  if (!firecrawlKey) {
    console.log(`[${VENDOR_NAME}] Skipping TDS scrape - no Firecrawl API key`);
    return { updated: 0, skipped: 0 };
  }
  
  // Get products without valid TDS URLs
  const { data: products, error } = await supabase
    .from('filaments')
    .select('id, product_url, product_handle, tds_url')
    .ilike('vendor', VENDOR_NAME)
    .or('tds_url.is.null,tds_url.not.ilike.%drive.google.com%');
  
  if (error || !products || products.length === 0) {
    console.log(`[${VENDOR_NAME}] No products need TDS URL updates`);
    return { updated: 0, skipped: 0 };
  }
  
  console.log(`[${VENDOR_NAME}] Scraping TDS URLs for ${products.length} products...`);
  
  let updated = 0;
  let skipped = 0;
  
  // Process in batches to avoid rate limits
  for (const product of products.slice(0, 10)) { // Limit to 10 for initial sync
    try {
      const response = await fetch('https://api.firecrawl.dev/v1/scrape', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${firecrawlKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          url: product.product_url,
          formats: ['markdown', 'links'],
          onlyMainContent: true,
        }),
      });
      
      if (!response.ok) {
        console.log(`[${VENDOR_NAME}] Failed to scrape ${product.product_url}: ${response.status}`);
        skipped++;
        continue;
      }
      
      const data = await response.json();
      const links = data.data?.links || [];
      
      // Find Google Drive TDS link
      const tdsLink = links.find((link: string) => 
        link.includes('drive.google.com') && 
        (link.includes('/file/') || link.includes('/folders/'))
      );
      
      if (tdsLink) {
        await supabase
          .from('filaments')
          .update({ tds_url: tdsLink })
          .eq('id', product.id);
        
        updated++;
        console.log(`[${VENDOR_NAME}] Found TDS for ${product.product_handle}: ${tdsLink}`);
      } else {
        skipped++;
      }
      
      // Rate limiting
      await new Promise(resolve => setTimeout(resolve, 1500));
    } catch (err) {
      console.error(`[${VENDOR_NAME}] Error scraping TDS for ${product.product_handle}:`, err);
      skipped++;
    }
  }
  
  console.log(`[${VENDOR_NAME}] TDS scrape complete: ${updated} updated, ${skipped} skipped`);
  return { updated, skipped };
}

// ============================================================================
// STEP 5: FIX DUPLICATE HEX CODES
// ============================================================================

async function fixDuplicateHexCodes(supabase: any): Promise<number> {
  console.log(`[${VENDOR_NAME}] Checking for duplicate hex codes...`);
  
  const { data: duplicates, error } = await supabase
    .rpc('find_duplicate_hexes', { p_vendor: VENDOR_NAME });
  
  if (error) {
    console.error(`[${VENDOR_NAME}] Error finding duplicates:`, error);
    return 0;
  }
  
  if (!duplicates || duplicates.length === 0) {
    console.log(`[${VENDOR_NAME}] No duplicate hex codes found`);
    return 0;
  }
  
  console.log(`[${VENDOR_NAME}] Found ${duplicates.length} products with duplicate hex codes`);
  
  // Group by product_line_id and hex
  const groups = new Map<string, typeof duplicates>();
  for (const dup of duplicates) {
    const key = `${dup.product_line_id}|${dup.color_hex?.toLowerCase()}`;
    if (!groups.has(key)) {
      groups.set(key, []);
    }
    groups.get(key)!.push(dup);
  }
  
  let fixed = 0;
  
  for (const [key, group] of groups) {
    // Skip first, modify rest
    for (let i = 1; i < group.length; i++) {
      const item = group[i];
      const baseHex = item.color_hex;
      
      // Generate slightly different hex
      const variation = (i * 5) % 20;
      const newHex = adjustHexBrightness(baseHex, variation);
      
      await supabase
        .from('filaments')
        .update({ color_hex: newHex })
        .eq('id', item.id);
      
      fixed++;
    }
  }
  
  console.log(`[${VENDOR_NAME}] Fixed ${fixed} duplicate hex codes`);
  return fixed;
}

function adjustHexBrightness(hex: string, amount: number): string {
  if (!hex || !hex.startsWith('#')) return hex;
  
  const r = Math.min(255, Math.max(0, parseInt(hex.slice(1, 3), 16) + amount));
  const g = Math.min(255, Math.max(0, parseInt(hex.slice(3, 5), 16) + amount));
  const b = Math.min(255, Math.max(0, parseInt(hex.slice(5, 7), 16) + amount));
  
  return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`.toUpperCase();
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
    const { cleanSlate = false, skipTds = false } = await req.json().catch(() => ({}));
    
    console.log(`[${VENDOR_NAME}] Starting sync (cleanSlate: ${cleanSlate}, skipTds: ${skipTds})`);
    
    // Get brand ID
    const { data: brand } = await supabase
      .from('automated_brands')
      .select('id')
      .eq('brand_slug', BRAND_SLUG)
      .maybeSingle();
    
    const brandId = brand?.id || null;
    console.log(`[${VENDOR_NAME}] Brand ID: ${brandId || 'not found'}`);
    
    // Clean slate if requested
    if (cleanSlate) {
      const { count } = await supabase
        .from('filaments')
        .select('*', { count: 'exact', head: true })
        .ilike('vendor', VENDOR_NAME);
      
      const { error: deleteError } = await supabase
        .from('filaments')
        .delete()
        .ilike('vendor', VENDOR_NAME);
      
      if (deleteError) {
        throw new Error(`Failed to delete existing products: ${deleteError.message}`);
      }
      
      console.log(`[${VENDOR_NAME}] Deleted ${count || 0} existing products (clean slate)`);
      results.push({ step: 'clean_slate', success: true, count: count || 0 });
    }
    
    // Step 1: Fetch products
    const products = await fetchShopifyProducts();
    results.push({ step: 'fetch_products', success: true, count: products.length });
    
    // Step 2: Explode variants
    const variants = explodeVariants(products);
    results.push({ step: 'explode_variants', success: true, count: variants.length });
    
    // Step 3: Upsert with enrichment
    const upsertResult = await upsertVariants(supabase, variants, brandId);
    results.push({
      step: 'upsert_variants',
      success: true,
      created: upsertResult.created,
      updated: upsertResult.updated,
      errors: upsertResult.errors,
    });
    
    // Step 4: Scrape TDS URLs (optional)
    if (!skipTds) {
      const tdsResult = await scrapeTdsUrls(supabase);
      results.push({
        step: 'scrape_tds',
        success: true,
        updated: tdsResult.updated,
        skipped: tdsResult.skipped,
      });
    }
    
    // Step 5: Fix duplicate hex codes
    const hexFixed = await fixDuplicateHexCodes(supabase);
    results.push({ step: 'fix_duplicate_hex', success: true, count: hexFixed });
    
    // Update brand enrichment counts
    if (brandId) {
      await supabase.rpc('update_brand_enrichment_counts', { p_brand_slug: BRAND_SLUG });
      await supabase.rpc('update_brand_product_counts', { p_brand_slug: BRAND_SLUG });
    }
    
    const duration = ((Date.now() - startTime) / 1000).toFixed(1);
    console.log(`[${VENDOR_NAME}] Sync complete in ${duration}s`);
    
    return new Response(
      JSON.stringify({
        success: true,
        vendor: VENDOR_NAME,
        results,
        duration: `${duration}s`,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error(`[${VENDOR_NAME}] Fatal error:`, error);
    
    return new Response(
      JSON.stringify({
        success: false,
        vendor: VENDOR_NAME,
        error: error instanceof Error ? error.message : 'Unknown error',
        results,
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
