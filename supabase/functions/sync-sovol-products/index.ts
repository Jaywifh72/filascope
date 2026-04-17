/**
 * Sovol Full Sync Pipeline
 * 
 * 5-Step process:
 * 1. Fetch products from Shopify JSON API
 * 2. Explode variants (Color / Ship From Region)
 * 3. Upsert with brand-specific enrichments
 * 4. TDS URL discovery (limited - consumer brand)
 * 5. Fix duplicate hex codes
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import {
  enrichSovolProduct,
  parseSovolVariant,
  isSovolFilament,
  getSovolColorHex,
} from '../_shared/sovol-defaults.ts';
import { shouldIncludeVariant } from '../_shared/variant-filters.ts';

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
  position: number;
  alt: string | null;
}

interface ProductVariant {
  productId: string;
  variantId: string;
  title: string;
  handle: string;
  color: string | null;
  shipFrom: string | null;
  price: number;
  compareAtPrice: number | null;
  available: boolean;
  sku: string;
  weight: number | null;
  imageUrl: string | null;
  productUrl: string;
  publishedAt: string | null;
}

interface SyncResult {
  step: string;
  success: boolean;
  count?: number;
  created?: number;
  updated?: number;
  skipped?: number;
  errors?: string[];
  details?: Record<string, unknown>;
}

// ============================================================================
// CONSTANTS
// ============================================================================

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const SHOPIFY_BASE_URL = 'https://www.sovol3d.com';
const VENDOR_NAME = 'Sovol';

// ============================================================================
// STEP 1: FETCH PRODUCTS FROM SHOPIFY
// ============================================================================

async function fetchShopifyProducts(): Promise<ShopifyProduct[]> {
  console.log('[Step 1] Fetching products from Shopify...');
  
  const allProducts: ShopifyProduct[] = [];
  let page = 1;
  const limit = 250;
  
  while (true) {
    const url = `${SHOPIFY_BASE_URL}/products.json?limit=${limit}&page=${page}`;
    console.log(`Fetching page ${page}: ${url}`);
    
    const response = await fetch(url, {
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'FilaScope/1.0 (Filament Database)',
      },
    });
    
    if (!response.ok) {
      throw new Error(`Failed to fetch products: ${response.status} ${response.statusText}`);
    }
    
    const data = await response.json();
    const products = data.products || [];
    
    if (products.length === 0) break;
    
    // Filter to filaments only
    const filaments = products.filter((p: ShopifyProduct) => isSovolFilament({
      title: p.title,
      product_type: p.product_type,
      tags: p.tags,
    }));
    
    console.log(`Page ${page}: ${products.length} products, ${filaments.length} filaments`);
    allProducts.push(...filaments);
    
    if (products.length < limit) break;
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
  const seenColorVariants = new Set<string>();
  let skippedBulk = 0;
  let skippedMultiPack = 0;
  
  for (const product of products) {
    const primaryImage = product.images?.[0]?.src || null;
    
    for (const variant of product.variants) {
      // Parse variant title (Color / Ship From)
      const parsed = parseSovolVariant(variant.title);
      
      // Use option1 as color if parsing failed - strip multi-pack multipliers
      let color = parsed.color || variant.option1 || 'Default';
      
      // Normalize multi-pack colors: "White*10" → "White"
      if (/\*\d+$/.test(color)) {
        console.log(`[Filter] Multi-pack variant detected: ${color} - skipping`);
        skippedMultiPack++;
        continue;
      }
      
      // Filter out bulk weight variants (2KG/5KG/10KG) — only keep 1KG standard spools
      // parsed.weight is in grams (e.g. 2000, 5000, 10000 for bulk; 1000 for 1KG)
      if (parsed.weight !== null && parsed.weight !== 1000) {
        console.log(`[Filter] Bulk weight variant skipped: ${color} (${parsed.weight}g) from ${product.title}`);
        skippedBulk++;
        continue;
      }
      
      // Create unique key per product+color+region (preserve regional pricing)
      const uniqueKey = `${product.id}-${color.toLowerCase()}-${parsed.shipFrom || 'default'}`;
      
      // Skip if we've already seen this color+region variant
      if (seenColorVariants.has(uniqueKey)) {
        continue;
      }
      seenColorVariants.add(uniqueKey);
      
      // Extract weight — prioritize title parsing over Shopify grams field
      // NOTE: Shopify variant.grams is systematically wrong (always ~2600g) for Sovol
      let weight = parsed.weight;
      if (!weight) {
        // Try product title first (most reliable for Sovol)
        const titleWeightMatch = product.title.match(/(\d+(?:\.\d+)?)\s*kg/i);
        if (titleWeightMatch) {
          weight = parseFloat(titleWeightMatch[1]) * 1000;
        }
      }
      if (!weight) {
        // Try variant title for weight
        const variantWeightMatch = variant.title?.match(/(\d+(?:\.\d+)?)\s*kg/i);
        if (variantWeightMatch) {
          weight = parseFloat(variantWeightMatch[1]) * 1000;
        }
      }
      if (!weight && variant.grams > 0) {
        // Last resort: Shopify grams (known to be inaccurate for Sovol, always ~2600g)
        console.warn(`[Weight] Using unreliable Shopify grams (${variant.grams}g) for: ${product.title}`);
        weight = variant.grams;
      }
      
      // Filter out bulk/sample products using shared utility
      const filterResult = shouldIncludeVariant(weight, 1.75, product.title);
      if (!filterResult.include) {
        console.log(`[Filter] Skipping: ${product.title} (${color}) - ${filterResult.reason}`);
        skippedBulk++;
        continue;
      }
      
      variants.push({
        productId: `sovol-${product.id}-${variant.id}`,
        variantId: String(variant.id),
        title: product.title,
        handle: product.handle,
        color,
        shipFrom: parsed.shipFrom,
        price: parseFloat(variant.price),
        compareAtPrice: variant.compare_at_price ? parseFloat(variant.compare_at_price) : null,
        available: variant.available,
        sku: variant.sku,
        weight,
        imageUrl: primaryImage,
        productUrl: `${SHOPIFY_BASE_URL}/products/${product.handle}`,
        publishedAt: product.published_at,
      });
    }
  }
  
  console.log(`[Step 2] Complete: ${variants.length} unique variants (${skippedBulk} bulk filtered, ${skippedMultiPack} multi-packs skipped)`);
  return variants;
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
  let skipped = 0;
  const errors: string[] = [];
  
  for (const variant of variants) {
    try {
      // Enrich with brand-specific data
      const enrichment = enrichSovolProduct(
        variant.title,
        variant.color || undefined
      );
      
      // Try to get color hex from enrichment or direct lookup
      let colorHex = enrichment.colorHex;
      if (!colorHex && variant.color) {
        colorHex = getSovolColorHex(variant.color, enrichment.finishType);
      }
      
      // Build regional price fields based on ship-from region
      // US → variant_price (default), EU → price_eur, UK → price_gbp, CA → price_cad, AU → price_aud
      const regionalPriceFields: Record<string, number | null> = {
        variant_price: null,
        price_eur: null,
        price_gbp: null,
        price_cad: null,
        price_aud: null,
      };
      const region = variant.shipFrom;
      if (region === 'EU') {
        regionalPriceFields.price_eur = variant.price;
      } else if (region === 'UK') {
        regionalPriceFields.price_gbp = variant.price;
      } else if (region === 'CA') {
        regionalPriceFields.price_cad = variant.price;
      } else if (region === 'AU') {
        regionalPriceFields.price_aud = variant.price;
      } else {
        // Default (US or unspecified) → variant_price
        regionalPriceFields.variant_price = variant.price;
      }
      
      // Build filament record
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
        color_family: variant.color,
        is_nozzle_abrasive: enrichment.isAbrasive,
        variant_price: regionalPriceFields.variant_price,
        price_eur: regionalPriceFields.price_eur,
        price_gbp: regionalPriceFields.price_gbp,
        price_cad: regionalPriceFields.price_cad,
        price_aud: regionalPriceFields.price_aud,
        variant_compare_at_price: variant.compareAtPrice,
        variant_available: variant.available,
        variant_sku: variant.sku,
        net_weight_g: variant.weight,
        featured_image: variant.imageUrl,
        product_url: variant.productUrl,
        published_at: variant.publishedAt,
        diameter_nominal_mm: 1.75,
        nozzle_temp_min_c: enrichment.printSettings?.nozzleTempMin || null,
        nozzle_temp_max_c: enrichment.printSettings?.nozzleTempMax || null,
        bed_temp_min_c: enrichment.printSettings?.bedTempMin || null,
        bed_temp_max_c: enrichment.printSettings?.bedTempMax || null,
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
          .update({
            ...filamentData,
            updated_at: new Date().toISOString(),
          })
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
    } catch (error) {
      const msg = `Error processing ${variant.productId}: ${error instanceof Error ? error.message : String(error)}`;
      console.error(msg);
      errors.push(msg);
      skipped++;
    }
  }
  
  console.log(`[Step 3] Complete: ${created} created, ${updated} updated, ${skipped} skipped`);
  
  return {
    step: 'upsert',
    success: errors.length === 0,
    count: variants.length,
    created,
    updated,
    skipped,
    errors: errors.length > 0 ? errors.slice(0, 10) : undefined,
  };
}

// ============================================================================
// STEP 4: TDS URL DISCOVERY (LIMITED)
// ============================================================================

async function discoverTdsUrls(
  supabase: any
): Promise<SyncResult> {
  console.log('[Step 4] TDS URL discovery (consumer brand - likely none)...');

  // Sovol is a consumer brand and typically doesn't publish TDS documents
  // We'll skip this step but log it for completeness
  
  console.log('[Step 4] Complete: Consumer brand - TDS URLs not expected');
  
  return {
    step: 'tds_discovery',
    success: true,
    count: 0,
    details: {
      note: 'Consumer brand - TDS documents not typically published',
    },
  };
}

// ============================================================================
// STEP 5: FIX DUPLICATE HEX CODES
// ============================================================================

async function fixDuplicateHexCodes(
  supabase: any
): Promise<SyncResult> {
  console.log('[Step 5] Fixing duplicate hex codes...');

  // Find duplicates
  const { data: duplicates, error: findError } = await supabase
    .rpc('find_duplicate_hexes', { p_vendor: VENDOR_NAME });
  
  if (findError) {
    console.error('Error finding duplicates:', findError);
    return {
      step: 'fix_duplicates',
      success: false,
      errors: [findError.message],
    };
  }
  
  if (!duplicates || duplicates.length === 0) {
    console.log('[Step 5] No duplicate hex codes found');
    return {
      step: 'fix_duplicates',
      success: true,
      count: 0,
    };
  }
  
  console.log(`Found ${duplicates.length} records with duplicate hex codes`);
  
  // Group by product_line_id + color_hex
  const groups = new Map<string, typeof duplicates>();
  for (const dup of duplicates) {
    const key = `${dup.product_line_id}|${dup.color_hex?.toLowerCase()}`;
    if (!groups.has(key)) {
      groups.set(key, []);
    }
    groups.get(key)!.push(dup);
  }
  
  let fixed = 0;
  
  for (const [_key, items] of groups) {
    // Skip first item, adjust others
    for (let i = 1; i < items.length; i++) {
      const item = items[i];
      const baseHex = item.color_hex || '#808080';
      
      // Slightly adjust the hex
      const r = parseInt(baseHex.slice(1, 3), 16);
      const g = parseInt(baseHex.slice(3, 5), 16);
      const b = parseInt(baseHex.slice(5, 7), 16);
      
      const newR = Math.min(255, Math.max(0, r + i * 3));
      const newG = Math.min(255, Math.max(0, g + i * 2));
      const newB = Math.min(255, Math.max(0, b + i));
      
      const newHex = `#${newR.toString(16).padStart(2, '0')}${newG.toString(16).padStart(2, '0')}${newB.toString(16).padStart(2, '0')}`.toUpperCase();
      
      const { error } = await supabase
        .from('filaments')
        .update({ color_hex: newHex })
        .eq('id', item.id);
      
      if (!error) fixed++;
    }
  }
  
  console.log(`[Step 5] Complete: Fixed ${fixed} duplicate hex codes`);
  
  return {
    step: 'fix_duplicates',
    success: true,
    count: fixed,
  };
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
    
    // Parse options
    let options = {
      cleanSlate: false,
      skipFetch: false,
      skipEnrich: false,
      skipTds: true, // Default to skip for consumer brand
      skipDuplicates: false,
    };
    
    try {
      const body = await req.json();
      options = { ...options, ...body };
    } catch {
      // No body or invalid JSON - use defaults
    }
    
    console.log('='.repeat(60));
    console.log(`SOVOL SYNC STARTED - ${new Date().toISOString()}`);
    console.log('Options:', JSON.stringify(options));
    console.log('='.repeat(60));
    
    // Get brand ID
    const { data: brand } = await supabase
      .from('automated_brands')
      .select('id')
      .eq('brand_slug', 'sovol')
      .maybeSingle();
    
    const brandId = brand?.id || null;
    console.log(`Brand ID: ${brandId || 'not found'}`);
    
    // Clean slate if requested
    if (options.cleanSlate) {
      console.log('Performing clean slate - deleting existing Sovol filaments...');
      const { error: deleteError } = await supabase
        .from('filaments')
        .delete()
        .ilike('vendor', 'sovol');
      
      if (deleteError) {
        console.error('Clean slate error:', deleteError);
      } else {
        console.log('Deleted existing Sovol records');
      }
    }
    
    const results: SyncResult[] = [];
    
    // Step 1: Fetch products
    let products: ShopifyProduct[] = [];
    if (!options.skipFetch) {
      products = await fetchShopifyProducts();
      results.push({
        step: 'fetch',
        success: true,
        count: products.length,
      });
    }
    
    // Step 2: Explode variants
    let variants: ProductVariant[] = [];
    if (!options.skipFetch && products.length > 0) {
      variants = explodeVariants(products);
      results.push({
        step: 'explode',
        success: true,
        count: variants.length,
      });
    }
    
    // Step 3: Upsert with enrichments
    if (!options.skipEnrich && variants.length > 0) {
      const upsertResult = await upsertVariants(supabase, variants, brandId);
      results.push(upsertResult);
    }
    
    // Step 3.5: Clean up stale products no longer in the store
    if (!options.skipFetch && variants.length > 0) {
      console.log('[Step 3.5] Cleaning up stale Sovol products...');
      const syncedProductIds = new Set(variants.map(v => v.productId));
      
      // Get all current Sovol products in DB
      const { data: existingProducts } = await supabase
        .from('filaments')
        .select('id, product_id')
        .ilike('vendor', 'sovol');
      
      if (existingProducts && existingProducts.length > 0) {
        const staleProducts = existingProducts.filter(
          (p: any) => !syncedProductIds.has(p.product_id)
        );
        
        if (staleProducts.length > 0) {
          const staleIds = staleProducts.map((p: any) => p.id);
          console.log(`[Step 3.5] Found ${staleIds.length} stale products to remove`);
          
          // Delete in batches of 50
          for (let i = 0; i < staleIds.length; i += 50) {
            const batch = staleIds.slice(i, i + 50);
            const { error: deleteError } = await supabase
              .from('filaments')
              .delete()
              .in('id', batch);
            
            if (deleteError) {
              console.error(`[Step 3.5] Batch delete error:`, deleteError);
            } else {
              console.log(`[Step 3.5] Deleted batch of ${batch.length} stale products`);
            }
          }
          
          results.push({
            step: 'stale_cleanup',
            success: true,
            count: staleIds.length,
            details: { removed: staleIds.length },
          });
        } else {
          console.log('[Step 3.5] No stale products found');
          results.push({ step: 'stale_cleanup', success: true, count: 0 });
        }
      }
    }
    
    // Step 4: TDS discovery (skipped for consumer brand)
    if (!options.skipTds) {
      const tdsResult = await discoverTdsUrls(supabase);
      results.push(tdsResult);
    } else {
      results.push({
        step: 'tds_discovery',
        success: true,
        count: 0,
        details: { skipped: true, reason: 'Consumer brand - TDS not expected' },
      });
    }
    
    // Step 5: Fix duplicate hex codes
    if (!options.skipDuplicates) {
      const dupResult = await fixDuplicateHexCodes(supabase);
      results.push(dupResult);
    }
    
    // Calculate totals
    const duration = ((Date.now() - startTime) / 1000).toFixed(2);
    const allSuccess = results.every(r => r.success);
    
    console.log('='.repeat(60));
    console.log(`SOVOL SYNC ${allSuccess ? 'COMPLETED' : 'COMPLETED WITH ERRORS'}`);
    console.log(`Duration: ${duration}s`);
    console.log('='.repeat(60));
    
    return new Response(
      JSON.stringify({
        success: allSuccess,
        vendor: VENDOR_NAME,
        results,
        duration: `${duration}s`,
      }),
      {
        headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
    
  } catch (error) {
    console.error('Fatal error:', error);
    
    return new Response(
      JSON.stringify({
        success: false,
        vendor: VENDOR_NAME,
        error: error instanceof Error ? error.message : String(error),
        duration: `${((Date.now() - startTime) / 1000).toFixed(2)}s`,
      }),
      {
        headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});
