import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { getColorHex, getColorFamily } from "../_shared/color-mapping.ts";
import {
  enrich3DXTechProduct,
  DXTECH_STORE_INFO,
} from "../_shared/3dxtech-defaults.ts";
import {
  shouldIncludeVariant,
  createFilterStats,
  updateFilterStats,
  logFilterStats,
} from "../_shared/variant-filters.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Premium materials sold in small spools (250g) due to high cost - bypass sample filter
const PREMIUM_SMALL_SPOOL_MATERIALS = [
  'PEEK', 'PEEK-CF', 'PEEK-GF', 
  'PEKK', 'PEKK-CF',
  'PEI', 'PEI-1010', 'PEI-9085', 'PEI-CF', 'PEI-1010-CF', 'PEI-9085-CF', 'PEI-GF',
  'ESD-PEI', 'ESD-PEI-1010', 'ESD-PEI-9085', 'ESD-PEKK',
  'CeramiX', 'TPI', 'PPS', 'PPS-CF', 'PPSU', 'PPSU-CF',
];

const SHOPIFY_BASE_URL = DXTECH_STORE_INFO.baseUrl;
const VENDOR_NAME = DXTECH_STORE_INFO.vendorName;

interface ShopifyProduct {
  id: number;
  title: string;
  handle: string;
  body_html: string;
  vendor: string;
  product_type: string;
  tags: string[] | string;
  variants: ShopifyVariant[];
  images: ShopifyImage[];
}

interface ShopifyVariant {
  id: number;
  product_id: number;
  title: string;
  price: string;
  sku: string;
  option1: string | null; // Color
  option2: string | null; // Diameter
  option3: string | null; // Weight
  barcode: string | null;
  available?: boolean;
}

interface ShopifyImage {
  id: number;
  src: string;
  alt: string | null;
  variant_ids: number[];
}

interface ProductVariant {
  productId: string;
  title: string;
  color: string;
  price: number | null;
  sku: string | null;
  barcode: string | null;
  imageUrl: string | null;
  productUrl: string;
  handle: string;
  diameter: number;
  weight: number;
  available: boolean;
}

interface SyncResult {
  step: string;
  success: boolean;
  count?: number;
  details?: string;
  error?: string;
}

// ============================================================================
// STEP 1: FETCH SHOPIFY PRODUCTS
// ============================================================================

async function fetchShopifyProducts(): Promise<{ products: ShopifyProduct[]; result: SyncResult }> {
  console.log('Step 1: Fetching products from Shopify API...');
  
  let allProducts: ShopifyProduct[] = [];
  let page = 1;
  const limit = 250;

  try {
    while (true) {
      const url = `${SHOPIFY_BASE_URL}/products.json?limit=${limit}&page=${page}`;
      console.log(`  Fetching page ${page}...`);
      
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      const products = data.products || [];
      
      if (products.length === 0) break;

      allProducts = [...allProducts, ...products];
      console.log(`  Page ${page}: ${products.length} products`);
      
      if (products.length < limit) break;
      
      page++;
      await new Promise(resolve => setTimeout(resolve, 500));
    }

    // Filter for filament products only (exclude nozzles, accessories, pellets, legacy products)
    const filamentProducts = allProducts.filter(p => {
      const titleLower = p.title?.toLowerCase() || '';
      const typeLower = p.product_type?.toLowerCase() || '';
      const tagsStr = Array.isArray(p.tags) ? p.tags.join(' ').toLowerCase() : (p.tags || '').toLowerCase();
      const handleLower = p.handle?.toLowerCase() || '';
      
      // Exclude non-filament products
      const isExcluded = 
        titleLower.includes('nozzle') ||
        titleLower.includes('adhesive') ||
        titleLower.includes('build sheet') ||
        titleLower.includes('pellet') ||
        titleLower.includes('25kg') ||
        titleLower.includes('sample') ||
        typeLower.includes('nozzle') ||
        typeLower.includes('accessory');
      
      // Exclude legacy Obsidian V1 product (replaced by V2)
      const isLegacyObsidian = handleLower === 'obsidian-pa6-cf-1';
      
      // Include if it's a filament/reel
      const isFilament = 
        typeLower.includes('reel') || 
        typeLower.includes('filament') ||
        tagsStr.includes('filament') ||
        tagsStr.includes('reel');
      
      return isFilament && !isExcluded && !isLegacyObsidian;
    });

    console.log(`  Filtered to ${filamentProducts.length} filament products`);
    
    return {
      products: filamentProducts,
      result: {
        step: 'fetch_products',
        success: true,
        count: filamentProducts.length,
        details: `Fetched ${allProducts.length} total, ${filamentProducts.length} filament products`
      }
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('  Fetch error:', message);
    return {
      products: [],
      result: {
        step: 'fetch_products',
        success: false,
        error: message
      }
    };
  }
}

// ============================================================================
// STEP 2: EXPLODE VARIANTS
// ============================================================================

function explodeVariants(products: ShopifyProduct[]): { variants: ProductVariant[]; result: SyncResult } {
  console.log('Step 2: Exploding variants with filtering...');
  
  const variants: ProductVariant[] = [];
  const seenColors = new Map<number, Set<string>>(); // Track colors per product
  const filterStats = createFilterStats();
  let skippedByFilter = 0;

  for (const product of products) {
    const productUrl = `${SHOPIFY_BASE_URL}/products/${product.handle}`;
    seenColors.set(product.id, new Set());

    for (const variant of product.variants) {
      const color = variant.option1 || 'Default';
      const colorLower = color.toLowerCase();
      
      // Skip if we've already processed this color for this product
      if (seenColors.get(product.id)?.has(colorLower)) continue;
      seenColors.get(product.id)?.add(colorLower);
      
      // Parse diameter - check title, handle, and variant options for 2.85mm
      const extractDiameter = (text: string): number | null => {
        if (/2\.85\s*mm|3\.0\s*mm|3mm/i.test(text)) return 2.85;
        if (/1\.75\s*mm/i.test(text)) return 1.75;
        return null;
      };
      
      // Check multiple sources for diameter
      const titleDiameter = extractDiameter(product.title);
      const handleDiameter = extractDiameter(product.handle);
      const variantTitleDiameter = extractDiameter(variant.title);
      let variantOptionDiameter: number | null = null;
      if (variant.option2) {
        const diamMatch = variant.option2.match(/([\d.]+)\s*mm/i);
        if (diamMatch) variantOptionDiameter = parseFloat(diamMatch[1]);
      }
      
      // Use detected 2.85mm from any source, otherwise default to 1.75mm
      const diameter = [titleDiameter, handleDiameter, variantTitleDiameter, variantOptionDiameter].includes(2.85) 
        ? 2.85 
        : (variantOptionDiameter || 1.75);
      
      // Parse weight
      let weight = 1000; // Default 1kg
      const weightOption = variant.option3 || variant.option2 || '';
      const kgMatch = weightOption.match(/([\d.]+)\s*kg/i);
      const gMatch = weightOption.match(/([\d.]+)\s*g(?!k)/i);
      if (kgMatch) weight = Math.round(parseFloat(kgMatch[1]) * 1000);
      else if (gMatch) weight = Math.round(parseFloat(gMatch[1]));
      
      // Get enrichment to check material for premium whitelist
      const enrichment = enrich3DXTechProduct(product.title, null, color);
      const isPremiumMaterial = PREMIUM_SMALL_SPOOL_MATERIALS.includes(enrichment.material);
      
      // Apply variant filtering - but allow premium materials in small spools
      let filterResult = shouldIncludeVariant(weight, diameter, product.title);
      
      // Override sample/pack exclusion for premium materials (they legitimately come in 250g)
      if (!filterResult.include && (filterResult.reason?.includes('Sample') || filterResult.reason?.includes('keyword')) && isPremiumMaterial) {
        console.log(`  Allowing premium material small spool: ${product.title} (${enrichment.material}, ${weight}g)`);
        filterResult = { include: true };
      }
      
      updateFilterStats(filterStats, filterResult);
      
      if (!filterResult.include) {
        console.log(`  Skipping: ${product.title} - ${filterResult.reason}`);
        skippedByFilter++;
        continue;
      }
      
      // Get color-specific image
      let imageUrl: string | null = null;
      const variantImage = product.images.find(img => img.variant_ids.includes(variant.id));
      if (variantImage) {
        imageUrl = variantImage.src;
      } else {
        // Try to match by color in image URL/alt
        for (const img of product.images) {
          const srcLower = img.src.toLowerCase();
          const altLower = (img.alt || '').toLowerCase();
          if (srcLower.includes(colorLower.replace(/\s+/g, '')) || altLower.includes(colorLower)) {
            imageUrl = img.src;
            break;
          }
        }
        // Fallback to first image
        if (!imageUrl && product.images.length > 0) {
          imageUrl = product.images[0].src;
        }
      }

      // Build variant-specific URL with query parameter for accurate live price fetching
      const variantSpecificUrl = `${productUrl}?variant=${variant.id}`;

      variants.push({
        productId: `3dxtech-${product.id}-${variant.id}`,
        title: product.title,
        color,
        price: parseFloat(variant.price) || null,
        sku: variant.sku || null,
        barcode: variant.barcode || null,
        imageUrl,
        productUrl: variantSpecificUrl,
        handle: product.handle,
        diameter,
        weight,
        available: variant.available !== false,
      });
    }
  }

  // Log filter stats
  logFilterStats('3DXTech', filterStats);
  console.log(`  Exploded to ${variants.length} variants (skipped ${skippedByFilter} by filter)`);
  
  return {
    variants,
    result: {
      step: 'explode_variants',
      success: true,
      count: variants.length,
      details: `Created ${variants.length} variant rows from ${products.length} products (skipped ${skippedByFilter} by filter)`
    }
  };
}

// ============================================================================
// STEP 3: UPSERT WITH ENRICHMENTS
// ============================================================================

async function upsertVariants(
  supabase: any,
  variants: ProductVariant[],
  brandId: string | null
): Promise<SyncResult> {
  console.log('Step 3: Upserting variants with enrichments...');
  
  let created = 0;
  let updated = 0;
  let errors = 0;

  for (const variant of variants) {
    try {
      // Apply brand-specific enrichments
      const enrichment = enrich3DXTechProduct(variant.title, null, variant.color);
      
      // Get color hex - prefer brand-specific, fallback to generic
      const colorHex = enrichment.colorHex || getColorHex(variant.color);
      const colorFamily = getColorFamily(variant.color);
      
      // Build full title with color - use Shopify title directly, only add color suffix if needed
      const titleHasColor = variant.title.toLowerCase().includes(variant.color.toLowerCase());
      const fullTitle = variant.color !== 'Default' && !titleHasColor
        ? `${variant.title} - ${variant.color}`
        : variant.title;

      // Check if exists
      const { data: existing } = await supabase
        .from('filaments')
        .select('id')
        .eq('product_id', variant.productId)
        .maybeSingle();

      const filamentData = {
        product_id: variant.productId,
        product_title: fullTitle,
        product_handle: variant.handle,
        product_url: variant.productUrl,
        vendor: VENDOR_NAME,
        brand_id: brandId,
        material: enrichment.material,
        product_line_id: enrichment.productLineId,
        finish_type: enrichment.finishType,
        variant_sku: variant.sku,
        upc: variant.barcode,
        variant_price: variant.price,
        featured_image: variant.imageUrl,
        color_hex: colorHex,
        color_family: colorFamily,
        net_weight_g: variant.weight,
        diameter_nominal_mm: variant.diameter,
        variant_available: variant.available,
        available_regions: ['US'],
        is_nozzle_abrasive: enrichment.isAbrasive,
        // Print settings
        nozzle_temp_min_c: enrichment.printSettings?.nozzleTempMin || null,
        nozzle_temp_max_c: enrichment.printSettings?.nozzleTempMax || null,
        bed_temp_min_c: enrichment.printSettings?.bedTempMin || null,
        bed_temp_max_c: enrichment.printSettings?.bedTempMax || null,
        // Flags
        auto_created: true,
        auto_updated: true,
        last_scraped_at: new Date().toISOString(),
        sync_status: 'synced',
      };

      if (existing) {
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
        // Check for existing row with NULL product_id that matches on the partial unique index columns
        // (vendor, product_title, variant_price, color_family) WHERE product_id IS NULL
        const { data: legacyRow } = await supabase
          .from('filaments')
          .select('id')
          .eq('vendor', VENDOR_NAME)
          .eq('product_title', fullTitle)
          .eq('variant_price', variant.price)
          .eq('color_family', colorFamily)
          .is('product_id', null)
          .limit(1);

        if (legacyRow && legacyRow.length > 0) {
          // Update the legacy row instead of inserting
          const { error } = await supabase
            .from('filaments')
            .update({
              ...filamentData,
              updated_at: new Date().toISOString(),
            })
            .eq('id', legacyRow[0].id);

          if (error) throw error;
          updated++;
        } else {
          // Insert new row
          const { error } = await supabase
            .from('filaments')
            .insert(filamentData);

          if (error) throw error;
          created++;
        }
      }
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error);
      const code = (error as any)?.code || '';
      console.error(`  Error processing ${variant.title}:`, msg);
      // Non-fatal: duplicate key violations don't fail the whole sync
      if (code === '23505' || msg.includes('duplicate key') || msg.includes('23505')) {
        console.log(`  Skipped duplicate: ${variant.title}`);
      } else {
        errors++;
      }
    }
  }

  console.log(`  Created: ${created}, Updated: ${updated}, Errors: ${errors}`);

  return {
    step: 'upsert_variants',
    success: errors === 0,
    count: created + updated,
    details: `Created ${created}, updated ${updated}, errors ${errors}`
  };
}

// ============================================================================
// STEP 4: UPDATE BRAND STATS
// ============================================================================

async function updateBrandStats(supabase: any): Promise<SyncResult> {
  console.log('Step 4: Updating brand statistics...');

  try {
    // Get current product count
    const { count } = await supabase
      .from('filaments')
      .select('*', { count: 'exact', head: true })
      .ilike('vendor', VENDOR_NAME);

    // Update automated_brands
    const { error } = await supabase
      .from('automated_brands')
      .update({
        platform_type: 'shopify',
        base_url: SHOPIFY_BASE_URL,
        products_url: `${SHOPIFY_BASE_URL}/products.json`,
        product_count: count || 0,
        last_scrape_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .ilike('brand_name', VENDOR_NAME);

    if (error) throw error;

    // Update enrichment counts
    await supabase.rpc('update_brand_product_counts', { p_brand_slug: '3dxtech' });

    console.log(`  Updated brand stats: ${count} products`);

    return {
      step: 'update_brand_stats',
      success: true,
      count: count || 0,
      details: `Updated brand with ${count} products`
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('  Error updating brand stats:', message);
    return {
      step: 'update_brand_stats',
      success: false,
      error: message
    };
  }
}

// ============================================================================
// STEP 5: FIX DUPLICATE HEX CODES
// ============================================================================

async function fixDuplicateHexCodes(supabase: any): Promise<SyncResult> {
  console.log('Step 5: Fixing duplicate hex codes...');

  try {
    const { data: duplicates, error } = await supabase.rpc('find_duplicate_hexes', {
      p_vendor: VENDOR_NAME
    });
    if (error) throw error;

    if (!duplicates || duplicates.length === 0) {
      console.log('  No duplicate hex codes found');
      return {
        step: 'fix_duplicate_hexes',
        success: true,
        count: 0,
        details: 'No duplicates found'
      };
    }

    console.log(`  Found ${duplicates.length} products with duplicate hex codes`);

    // Group by product_line_id and hex
    const groups = new Map<string, typeof duplicates>();
    for (const d of duplicates) {
      const key = `${d.product_line_id}|${d.color_hex?.toLowerCase()}`;
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key)!.push(d);
    }

    let fixed = 0;
    for (const [, group] of groups) {
      if (group.length <= 1) continue;

      // Adjust hex values slightly for duplicates (skip first one)
      for (let i = 1; i < group.length; i++) {
        const originalHex = group[i].color_hex;
        if (!originalHex) continue;

        // Adjust brightness slightly
        const adjustment = i * 3;
        const r = Math.min(255, parseInt(originalHex.slice(1, 3), 16) + adjustment);
        const g = Math.min(255, parseInt(originalHex.slice(3, 5), 16) + adjustment);
        const b = Math.min(255, parseInt(originalHex.slice(5, 7), 16) + adjustment);
        const newHex = `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`.toUpperCase();

        await supabase
          .from('filaments')
          .update({ color_hex: newHex })
          .eq('id', group[i].id);

        fixed++;
      }
    }

    console.log(`  Fixed ${fixed} duplicate hex codes`);

    return {
      step: 'fix_duplicate_hexes',
      success: true,
      count: fixed,
      details: `Fixed ${fixed} duplicate hex codes`
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('  Error fixing duplicates:', message);
    return {
      step: 'fix_duplicate_hexes',
      success: false,
      error: message
    };
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
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Parse options
    let cleanSlate = false;
    let skipFetch = false;
    
    try {
      const body = await req.json();
      cleanSlate = body?.cleanSlate === true;
      skipFetch = body?.skipFetch === true;
    } catch {
      // No body or invalid JSON - use defaults
    }

    console.log(`\n${'='.repeat(60)}`);
    console.log(`3DXTech Sync Pipeline Started`);
    console.log(`Options: cleanSlate=${cleanSlate}, skipFetch=${skipFetch}`);
    console.log(`${'='.repeat(60)}\n`);

    // Get brand ID
    const { data: brand } = await supabase
      .from('automated_brands')
      .select('id')
      .ilike('brand_name', VENDOR_NAME)
      .maybeSingle();

    const brandId = brand?.id || null;

    // Clean slate if requested
    if (cleanSlate) {
      console.log('Performing clean slate deletion...');
      const { data: deleted } = await supabase
        .from('filaments')
        .delete()
        .ilike('vendor', VENDOR_NAME)
        .select('id');
      
      const deletedCount = deleted?.length || 0;
      
      results.push({
        step: 'clean_slate',
        success: true,
        count: deletedCount,
        details: `Deleted ${deletedCount} existing products`
      });
    }

    // Step 1: Fetch products
    const { products, result: fetchResult } = await fetchShopifyProducts();
    results.push(fetchResult);
    
    if (!fetchResult.success || products.length === 0) {
      throw new Error('Failed to fetch products from Shopify');
    }

    // Step 2: Explode variants
    const { variants, result: explodeResult } = explodeVariants(products);
    results.push(explodeResult);

    // Step 3: Upsert with enrichments
    const upsertResult = await upsertVariants(supabase, variants, brandId);
    results.push(upsertResult);

    // Step 4: Update brand stats
    const statsResult = await updateBrandStats(supabase);
    results.push(statsResult);

    // Step 5: Fix duplicate hex codes
    const hexResult = { step: 'fix_duplicate_hexes', success: true, count: 0, details: 'Skipped (RPC not available)' };
    results.push(hexResult);

    const duration = ((Date.now() - startTime) / 1000).toFixed(1);
    console.log(`\n${'='.repeat(60)}`);
    console.log(`Sync completed in ${duration}s`);
    console.log(`${'='.repeat(60)}\n`);

    return new Response(
      JSON.stringify({
        success: true,
        message: `${VENDOR_NAME} sync complete`,
        duration: `${duration}s`,
        results
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('Fatal error:', message);
    
    return new Response(
      JSON.stringify({
        success: false,
        error: message,
        results
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
