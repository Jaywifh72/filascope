/**
 * PROTO-PASTA SYNC PIPELINE
 * 
 * Full 5-step sync for Proto-Pasta specialty filaments:
 * 1. Fetch products from Shopify API
 * 2. Explode color variants
 * 3. Upsert with brand-specific enrichments
 * 4. Fix duplicate hex codes
 * 5. Populate individual TDS URLs
 * 
 * Proto-Pasta is known for:
 * - HTPLA (heat-treatable PLA)
 * - Metal composite filaments
 * - Carbon fiber variants
 * - Electrically conductive PLA
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import {
  enrichProtoPastaProduct,
  cleanProtoPastaTitle,
  isProtoPastaFilamentProduct,
  extractProtoPastaWeight,
  extractProtoPastaDiameter,
  getProtoPastaColorHex,
  extractColorFromProductTitle,
  extractColorNameFromTitle,
  getColorFamily,
  getColorFamilyFromHex,
} from '../_shared/protopasta-defaults.ts';
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

// ============= INTERFACES =============

interface ShopifyProduct {
  id: number;
  title: string;
  handle: string;
  product_type: string;
  vendor: string;
  body_html: string;
  published_at: string;
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
  shopifyProductId: number;
  shopifyVariantId: number;
  fullTitle: string;
  variantTitle: string;
  handle: string;
  price: number;
  compareAtPrice: number | null;
  available: boolean;
  sku: string;
  imageUrl: string | null;
  weightGrams: number | null;
  diameterMm: number;
}

interface SyncResult {
  step: string;
  success: boolean;
  productsDiscovered?: number;
  variantsCreated?: number;
  productsUpserted?: number;
  duplicatesFixed?: number;
  tdsPopulated?: number;
  errors?: string[];
  duration?: number;
}

// ============= STEP 1: FETCH SHOPIFY PRODUCTS =============

async function fetchShopifyProducts(): Promise<ShopifyProduct[]> {
  const allProducts: ShopifyProduct[] = [];
  let page = 1;
  const limit = 250;

  console.log('[Proto-Pasta] Step 1: Fetching products from Shopify API...');

  while (true) {
    const url = `https://proto-pasta.com/products.json?limit=${limit}&page=${page}`;
    console.log(`[Proto-Pasta] Fetching page ${page}...`);

    const response = await fetch(url, {
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'FilaScope/1.0',
      },
    });

    if (!response.ok) {
      throw new Error(`Shopify API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    const products = data.products || [];

    if (products.length === 0) {
      console.log(`[Proto-Pasta] No more products on page ${page}`);
      break;
    }

    // Filter to filament products only
    const filamentProducts = products.filter((p: ShopifyProduct) =>
      isProtoPastaFilamentProduct(p.title, p.product_type)
    );

    console.log(`[Proto-Pasta] Page ${page}: ${products.length} products, ${filamentProducts.length} filaments`);
    allProducts.push(...filamentProducts);

    if (products.length < limit) {
      break;
    }

    page++;
    // Rate limiting
    await new Promise(resolve => setTimeout(resolve, 500));
  }

  console.log(`[Proto-Pasta] Total filament products fetched: ${allProducts.length}`);
  return allProducts;
}

// ============= STEP 2: EXPLODE VARIANTS =============

function explodeVariants(products: ShopifyProduct[]): ProductVariant[] {
  const variants: ProductVariant[] = [];
  const filterStats = createFilterStats();

  console.log('[Proto-Pasta] Step 2: Exploding color variants...');

  for (const product of products) {
    // Get the best image for this product
    const primaryImage = product.images?.[0]?.src || null;

    for (const variant of product.variants) {
      // Skip out of stock variants without prices
      if (!variant.price) continue;

      const price = parseFloat(variant.price);
      if (isNaN(price) || price <= 0) continue;

      // Build full title - avoid adding empty/weight-only variants that cause "- /" artifacts
      const variantTitle = variant.title !== 'Default Title' ? variant.title : '';
      let fullTitle = product.title;
      if (variantTitle) {
        // Only add variant title if it contains meaningful color info (not just weight/spool info)
        const isWeightOnly = /^\s*(?:\d+\s*(?:g|kg)?\s*(?:Spool|Coil)?|Default\s*Title|\/\s*\d+\s*g?)\s*$/i.test(variantTitle);
        const hasSlashWeight = variantTitle.includes('/') && /\/\s*\d+\s*g/i.test(variantTitle);
        if (!isWeightOnly && !hasSlashWeight) {
          fullTitle = `${product.title} - ${variantTitle}`;
        }
      }
      // Clean title IMMEDIATELY to prevent "- /" artifacts from persisting
      fullTitle = cleanProtoPastaTitle(fullTitle);

      // Extract weight and diameter from variant title
      const weightGrams = extractProtoPastaWeight(variantTitle || product.title);
      const diameterMm = extractProtoPastaDiameter(variantTitle || product.title);

      // Apply standard filters (exclude bulk >1.4kg, samples <300g, 2.85mm, excluded keywords)
      const filterResult = shouldIncludeVariant(weightGrams, diameterMm, fullTitle);
      if (!filterResult.include) {
        updateFilterStats(filterStats, filterResult);
        console.log(`[Proto-Pasta] Skipping: ${fullTitle} - ${filterResult.reason}`);
        continue;
      }

      // Also skip if title explicitly mentions sample/coil patterns
      const titleLower = fullTitle.toLowerCase();
      if (
        titleLower.includes('sample coil') ||
        titleLower.includes('sample pack') ||
        (titleLower.includes('coil') && !titleLower.includes('spool'))
      ) {
        updateFilterStats(filterStats, { include: false, reason: 'Sample product' });
        console.log(`[Proto-Pasta] Skipping sample product: ${fullTitle}`);
        continue;
      }

      // Create unique product ID
      const productId = `${product.id}_${variant.id}`;

      // Find variant-specific image
      let imageUrl = primaryImage;
      if (variant.id && product.images) {
        const variantImage = product.images.find(img =>
          img.variant_ids?.includes(variant.id)
        );
        if (variantImage) {
          imageUrl = variantImage.src;
        }
      }

      variants.push({
        productId,
        shopifyProductId: product.id,
        shopifyVariantId: variant.id,
        fullTitle,
        variantTitle,
        handle: product.handle,
        price,
        compareAtPrice: variant.compare_at_price
          ? parseFloat(variant.compare_at_price)
          : null,
        available: variant.available !== false,
        sku: variant.sku || '',
        imageUrl,
        weightGrams,
        diameterMm,
      });
    }
  }

  logFilterStats('Proto-Pasta', filterStats);
  console.log(`[Proto-Pasta] Total variants exploded: ${variants.length}`);
  return variants;
}

// ============= STEP 3: UPSERT WITH ENRICHMENTS =============

async function upsertVariants(
  supabase: any,
  variants: ProductVariant[],
  brandId: string | null
): Promise<{ upserted: number; errors: string[] }> {
  console.log('[Proto-Pasta] Step 3: Upserting with brand-specific enrichments...');

  let upserted = 0;
  const errors: string[] = [];

  for (const variant of variants) {
    try {
      // Apply brand-specific enrichments
      const enrichment = enrichProtoPastaProduct(
        variant.fullTitle,
        variant.variantTitle
      );

      // Build product URL
      const productUrl = `https://proto-pasta.com/products/${variant.handle}`;

      // Clean title
      const cleanedTitle = cleanProtoPastaTitle(variant.fullTitle);

      // Extract color hex: prioritize product title over variant title
      // Proto-Pasta color names are in the PRODUCT title, not the variant title
      let colorHex = enrichment.colorHex;
      if (!colorHex) {
        // First try: Extract color from the full product title
        colorHex = extractColorFromProductTitle(variant.fullTitle);
      }
      if (!colorHex && variant.variantTitle) {
        // Fallback: Try variant title (may contain color after weight)
        colorHex = getProtoPastaColorHex(variant.variantTitle);
      }

      // Extract color name and derive color_family with hex fallback
      const colorName = extractColorNameFromTitle(variant.fullTitle);
      let colorFamily = colorName ? getColorFamily(colorName) : null;
      
      // FALLBACK: Use hex-based detection if name lookup failed
      if (!colorFamily && colorHex) {
        colorFamily = getColorFamilyFromHex(colorHex);
      }

      const record = {
        product_id: variant.productId,
        product_title: cleanedTitle || variant.fullTitle,
        vendor: 'Proto-Pasta',
        brand_id: brandId,
        variant_price: variant.price,
        variant_compare_at_price: variant.compareAtPrice,
        variant_available: variant.available,
        product_url: productUrl,
        featured_image: variant.imageUrl,
        variant_sku: variant.sku || null,
        net_weight_g: variant.weightGrams,
        diameter_nominal_mm: variant.diameterMm,
        material: enrichment.material,
        finish_type: enrichment.finishType,
        product_line_id: enrichment.productLineId,
        tds_url: enrichment.tdsUrl,
        color_hex: colorHex,
        color_family: colorFamily,
        nozzle_temp_min_c: enrichment.nozzleTempMin,
        nozzle_temp_max_c: enrichment.nozzleTempMax,
        bed_temp_min_c: enrichment.bedTempMin,
        bed_temp_max_c: enrichment.bedTempMax,
        is_nozzle_abrasive: enrichment.isAbrasive,
        auto_created: true,
        auto_updated: true,
        last_scraped_at: new Date().toISOString(),
        sync_status: 'synced',
      };

      const { error } = await supabase
        .from('filaments')
        .upsert(record, {
          onConflict: 'product_id,vendor',
          ignoreDuplicates: false,
        });

      if (error) {
        errors.push(`${variant.productId}: ${error.message}`);
      } else {
        upserted++;
      }
    } catch (e) {
      errors.push(`${variant.productId}: ${e instanceof Error ? e.message : String(e)}`);
    }
  }

  console.log(`[Proto-Pasta] Upserted ${upserted} products, ${errors.length} errors`);
  return { upserted, errors };
}

// ============= STEP 4: FIX DUPLICATE HEX CODES =============

async function fixDuplicateHexCodes(
  supabase: any
): Promise<number> {
  console.log('[Proto-Pasta] Step 4: Fixing duplicate hex codes...');

  const { data: duplicates, error } = await supabase.rpc('find_duplicate_hexes', {
    p_vendor: 'Proto-Pasta',
  });

  if (error) {
    console.error('[Proto-Pasta] Error finding duplicates:', error);
    return 0;
  }

  if (!duplicates || duplicates.length === 0) {
    console.log('[Proto-Pasta] No duplicate hex codes found');
    return 0;
  }

  console.log(`[Proto-Pasta] Found ${duplicates.length} products with duplicate hex codes`);

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
  for (const [key, items] of groups) {
    // Skip the first item, modify the rest
    for (let i = 1; i < items.length; i++) {
      const item = items[i];
      const baseHex = item.color_hex?.replace('#', '') || 'AAAAAA';

      // Slightly modify the hex to make it unique
      const r = parseInt(baseHex.substring(0, 2), 16);
      const g = parseInt(baseHex.substring(2, 4), 16);
      const b = parseInt(baseHex.substring(4, 6), 16);

      // Add small offset based on index
      const offset = i * 3;
      const newR = Math.min(255, Math.max(0, r + offset));
      const newG = Math.min(255, Math.max(0, g - offset));
      const newB = Math.min(255, Math.max(0, b + offset));

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

  console.log(`[Proto-Pasta] Fixed ${fixed} duplicate hex codes`);
  return fixed;
}

// ============= STEP 5: VALIDATE TDS URLs =============

async function validateTdsUrls(
  supabase: any
): Promise<number> {
  console.log('[Proto-Pasta] Step 5: Verifying TDS URLs are set...');

  // Proto-Pasta uses the consolidated TDS page since individual PDF URLs have unpredictable versions
  // This step just confirms all products have the TDS URL set
  const { data: products, error } = await supabase
    .from('filaments')
    .select('id, product_title, tds_url')
    .ilike('vendor', 'proto-pasta')
    .not('tds_url', 'is', null);

  if (error) {
    console.error('[Proto-Pasta] Error fetching products:', error);
    return 0;
  }

  const count = products?.length || 0;
  console.log(`[Proto-Pasta] ${count} products have TDS URL set (consolidated page)`);
  return count;
}

// ============= MAIN HANDLER =============

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

    // Get brand ID
    const { data: brand } = await supabase
      .from('automated_brands')
      .select('id')
      .eq('brand_slug', 'proto-pasta')
      .single();

    const brandId = brand?.id || null;

    // Parse options from request body
    let options = {
      skipFetch: false,
      skipEnrich: false,
      skipHexFix: false,
      skipTdsValidation: false,
    };

    try {
      const body = await req.json();
      options = { ...options, ...body };
    } catch {
      // Use defaults
    }

    // Get existing product count for safe delete logic
    const { count: existingCount } = await supabase
      .from('filaments')
      .select('id', { count: 'exact', head: true })
      .ilike('vendor', 'proto-pasta');
    
    console.log(`[Proto-Pasta] Existing products in DB: ${existingCount || 0}`);

    // Step 1: Fetch Products
    if (!options.skipFetch) {
      const step1Start = Date.now();
      try {
        const products = await fetchShopifyProducts();
        results.push({
          step: 'fetch_products',
          success: true,
          productsDiscovered: products.length,
          duration: Date.now() - step1Start,
        });

        // Step 2: Explode Variants
        const step2Start = Date.now();
        const variants = explodeVariants(products);
        results.push({
          step: 'explode_variants',
          success: true,
          variantsCreated: variants.length,
          duration: Date.now() - step2Start,
        });

        // Step 3: Safe Delete + Upsert with Enrichments
        if (!options.skipEnrich) {
          const step3Start = Date.now();
          
          // Safe Delete: Only delete if we found enough products (threshold: 50)
          const SAFE_DELETE_THRESHOLD = 50;
          if (variants.length >= SAFE_DELETE_THRESHOLD) {
            console.log(`[Proto-Pasta] Safe Delete: ${variants.length} variants found >= ${SAFE_DELETE_THRESHOLD} threshold`);
            console.log(`[Proto-Pasta] Clearing ${existingCount || 0} existing products for clean slate sync`);
            
            const { error: deleteError } = await supabase
              .from('filaments')
              .delete()
              .ilike('vendor', 'proto-pasta');
            
            if (deleteError) {
              console.error('[Proto-Pasta] Error deleting existing products:', deleteError);
            } else {
              console.log('[Proto-Pasta] Existing products deleted successfully');
            }
          } else {
            console.log(`[Proto-Pasta] SKIPPING DELETE: Only ${variants.length} variants found (threshold: ${SAFE_DELETE_THRESHOLD})`);
          }
          
          const { upserted, errors } = await upsertVariants(supabase, variants, brandId);
          results.push({
            step: 'upsert_enriched',
            success: errors.length === 0,
            productsUpserted: upserted,
            errors: errors.slice(0, 10),
            duration: Date.now() - step3Start,
          });
        }
      } catch (e) {
        results.push({
          step: 'fetch_products',
          success: false,
          errors: [e instanceof Error ? e.message : String(e)],
        });
      }
    }

    // Step 4: Fix Duplicate Hex Codes
    if (!options.skipHexFix) {
      const step4Start = Date.now();
      try {
        const fixed = await fixDuplicateHexCodes(supabase);
        results.push({
          step: 'fix_duplicate_hexes',
          success: true,
          duplicatesFixed: fixed,
          duration: Date.now() - step4Start,
        });
      } catch (e) {
        results.push({
          step: 'fix_duplicate_hexes',
          success: false,
          errors: [e instanceof Error ? e.message : String(e)],
        });
      }
    }

    // Step 5: Validate TDS URLs
    if (!options.skipTdsValidation) {
      const step5Start = Date.now();
      try {
        const validated = await validateTdsUrls(supabase);
        results.push({
          step: 'validate_tds',
          success: true,
          tdsPopulated: validated,
          duration: Date.now() - step5Start,
        });
      } catch (e) {
        results.push({
          step: 'validate_tds',
          success: false,
          errors: [e instanceof Error ? e.message : String(e)],
        });
      }
    }

    // Update brand stats
    if (brandId) {
      await supabase.rpc('update_brand_product_counts', { p_brand_slug: 'proto-pasta' });
    }

    const totalDuration = Date.now() - startTime;
    console.log(`[Proto-Pasta] Sync completed in ${totalDuration}ms`);

    return new Response(
      JSON.stringify({
        success: true,
        vendor: 'Proto-Pasta',
        results,
        totalDuration,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('[Proto-Pasta] Fatal error:', error);
    return new Response(
      JSON.stringify({
        success: false,
        vendor: 'Proto-Pasta',
        error: error instanceof Error ? error.message : String(error),
        results,
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
