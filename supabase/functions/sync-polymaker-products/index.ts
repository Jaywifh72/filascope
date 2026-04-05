/**
 * Polymaker Product Sync Pipeline
 * 
 * 5-Step Sync Process:
 * 1. Fetch products from US Shopify store
 * 2. Sync regional prices from CA store
 * 3. Explode color variants into separate rows
 * 4. Upsert with brand-specific enrichments
 * 5. Fix duplicate hex codes and populate TDS URLs
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import {
  shouldIncludeVariant,
  createFilterStats,
  updateFilterStats,
  logFilterStats,
} from '../_shared/variant-filters.ts';
import {
  enrichPolymakerProduct,
  cleanPolymakerTitle,
  isFilamentProduct,
  extractHexFromSku,
  extractTdFromSku,
  extractWeightKg,
  extractDiameterMm,
  generatePolymakerTdsUrl,
} from '../_shared/polymaker-defaults.ts';
import {
  fetchWithTimeout,
  TIMEOUT_PRESETS,
  USER_AGENTS,
} from '../_shared/fetch-with-timeout.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// ============================================================================
// Types
// ============================================================================

interface ShopifyProduct {
  id: number;
  title: string;
  handle: string;
  product_type: string;
  vendor: string;
  tags: string[];
  variants: ShopifyVariant[];
  images: ShopifyImage[];
}

interface ShopifyVariant {
  id: number;
  title: string;
  sku: string | null;
  price: string;
  compare_at_price: string | null;
  available: boolean;
  option1: string | null; // Diameter
  option2: string | null; // Weight
  option3: string | null; // Color
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
  handle: string;
  color: string;
  colorHex: string | null;
  transmissionDistance: number | null;
  price: number;
  compareAtPrice: number | null;
  available: boolean;
  url: string;
  urlCa: string | null;
  priceCad: number | null;
  imageUrl: string | null;
  sku: string | null;
  weightKg: number;
  diameterMm: number;
}

interface SyncResult {
  step: string;
  success: boolean;
  count?: number;
  created?: number;
  updated?: number;
  errors?: string[];
}

// ============================================================================
// Step 1: Fetch Shopify Products (US Store)
// ============================================================================

async function fetchShopifyProducts(baseUrl: string): Promise<ShopifyProduct[]> {
  const allProducts: ShopifyProduct[] = [];
  let page = 1;
  const limit = 250;
  
  console.log(`[Polymaker] Fetching products from ${baseUrl}...`);
  
  while (true) {
    const url = `${baseUrl}/products.json?limit=${limit}&page=${page}`;
    
    try {
      const response = await fetchWithTimeout(url, {
        headers: {
          'Accept': 'application/json',
          'User-Agent': USER_AGENTS.BOT,
        },
      }, TIMEOUT_PRESETS.FAST); // 8 second timeout for API calls

      if (!response.ok) {
        console.error(`[Polymaker] Failed to fetch page ${page}: ${response.status}`);
        break;
      }
      
      const data = await response.json();
      const products = data.products || [];
      
      if (products.length === 0) {
        break;
      }
      
      // Filter to filament products only
      const filamentProducts = products.filter(isFilamentProduct);
      allProducts.push(...filamentProducts);
      
      console.log(`[Polymaker] Page ${page}: ${filamentProducts.length}/${products.length} filament products`);
      
      if (products.length < limit) {
        break;
      }
      
      page++;
      
      // Rate limiting
      await new Promise(resolve => setTimeout(resolve, 500));
    } catch (error) {
      console.error(`[Polymaker] Error fetching page ${page}:`, error);
      break;
    }
  }
  
  console.log(`[Polymaker] Total filament products fetched: ${allProducts.length}`);
  return allProducts;
}

// ============================================================================
// Step 2: Fetch Regional Prices (CA Store)
// ============================================================================

async function fetchRegionalPrices(products: ShopifyProduct[]): Promise<Map<string, { priceCad: number; urlCa: string }>> {
  const regionalData = new Map<string, { priceCad: number; urlCa: string }>();
  
  console.log('[Polymaker] Fetching CA store prices...');
  
  try {
    const caProducts = await fetchShopifyProducts('https://ca.polymaker.com');
    
    for (const caProduct of caProducts) {
      for (const variant of caProduct.variants) {
        const key = `${caProduct.handle}-${variant.sku || variant.id}`;
        const price = parseFloat(variant.price);
        
        if (!isNaN(price) && price > 0) {
          regionalData.set(key, {
            priceCad: price,
            urlCa: `https://ca.polymaker.com/products/${caProduct.handle}`,
          });
        }
      }
    }
    
    console.log(`[Polymaker] CA prices loaded: ${regionalData.size} variants`);
  } catch (error) {
    console.error('[Polymaker] Failed to fetch CA prices:', error);
  }
  
  return regionalData;
}

// ============================================================================
// Step 3: Explode Color Variants
// ============================================================================

function explodeVariants(
  products: ShopifyProduct[], 
  regionalPrices: Map<string, { priceCad: number; urlCa: string }>
): ProductVariant[] {
  const variants: ProductVariant[] = [];
  const filterStats = createFilterStats();
  
  for (const product of products) {
    // Group variants by color (option3 typically)
    const colorVariants = new Map<string, ShopifyVariant[]>();
    
    for (const variant of product.variants) {
      // Polymaker variant format: "Diameter / Weight / Color"
      // option1 = Diameter (1.75mm)
      // option2 = Weight (1kg)
      // option3 = Color
      const color = variant.option3 || variant.title.split(' / ').pop() || 'Default';
      
      // Extract diameter and weight for filtering
      const diameterStr = variant.option1?.toLowerCase() || '';
      const diameterMm = diameterStr.includes('2.85') || diameterStr.includes('3mm') ? 2.85 : 1.75;
      const weightKg = extractWeightKg(variant.option2 || product.title);
      const weightGrams = Math.round(weightKg * 1000);
      
      // Apply standard filtering (samples, bulk, 2.85mm, excluded keywords)
      const filterResult = shouldIncludeVariant(weightGrams, diameterMm, product.title);
      updateFilterStats(filterStats, filterResult);
      if (!filterResult.include) {
        console.log(`[Polymaker] Skipping: ${product.title} - ${color} (${filterResult.reason})`);
        continue;
      }
      
      if (!colorVariants.has(color)) {
        colorVariants.set(color, []);
      }
      colorVariants.get(color)!.push(variant);
    }
    
    // Create one entry per color
    for (const [color, colorVars] of colorVariants) {
      // Prefer 1kg variant, fallback to first available
      const primaryVariant = colorVars.find(v => 
        (v.option2?.includes('1kg') || v.option2?.includes('1 kg'))
      ) || colorVars[0];
      
      if (!primaryVariant) continue;
      
      const price = parseFloat(primaryVariant.price);
      if (isNaN(price) || price <= 0) continue;
      
      const compareAtPrice = primaryVariant.compare_at_price 
        ? parseFloat(primaryVariant.compare_at_price) 
        : null;
      
      // Extract HEX and TD from SKU
      const colorHex = extractHexFromSku(primaryVariant.sku);
      const transmissionDistance = extractTdFromSku(primaryVariant.sku);
      
      // Find image for this variant
      let imageUrl: string | null = null;
      for (const image of product.images) {
        if (image.variant_ids.includes(primaryVariant.id)) {
          imageUrl = image.src;
          break;
        }
      }
      if (!imageUrl && product.images.length > 0) {
        imageUrl = product.images[0].src;
      }
      
      // Lookup CA price
      const regionalKey = `${product.handle}-${primaryVariant.sku || primaryVariant.id}`;
      const caData = regionalPrices.get(regionalKey);
      
      // Generate product ID including color
      const colorSlug = color.toLowerCase()
        .replace(/\s+/g, '-')
        .replace(/[^a-z0-9-]/g, '')
        .substring(0, 50);
      const productId = `polymaker-${product.handle}-${colorSlug}`;
      
      // Build full title with color
      const fullTitle = color !== 'Default' && !product.title.toLowerCase().includes(color.toLowerCase())
        ? `${product.title} - ${color}`
        : product.title;
      
      variants.push({
        productId,
        title: fullTitle,
        handle: product.handle,
        color,
        colorHex,
        transmissionDistance,
        price,
        compareAtPrice: compareAtPrice && compareAtPrice > price ? compareAtPrice : null,
        available: primaryVariant.available,
        url: `https://us.polymaker.com/products/${product.handle}`,
        urlCa: caData?.urlCa || `https://ca.polymaker.com/products/${product.handle}`,
        priceCad: caData?.priceCad || null,
        imageUrl,
        sku: primaryVariant.sku,
        weightKg: extractWeightKg(primaryVariant.option2 || product.title),
        diameterMm: extractDiameterMm(primaryVariant.option1 || product.title),
      });
    }
  }
  
  logFilterStats('Polymaker', filterStats);
  console.log(`[Polymaker] Exploded to ${variants.length} color variants`);
  return variants;
}

// ============================================================================
// Step 4: Upsert to Database with Enrichments
// ============================================================================

async function upsertVariants(
  supabase: any,
  variants: ProductVariant[],
  brandId: string | null
): Promise<{ created: number; updated: number; errors: string[] }> {
  let created = 0;
  let updated = 0;
  const errors: string[] = [];
  
  for (const variant of variants) {
    try {
      // Apply Polymaker-specific enrichments
      const enrichment = enrichPolymakerProduct(variant.title, variant.sku);
      const cleanedTitle = cleanPolymakerTitle(variant.title);
      
      // Generate TDS URL
      const tdsUrl = generatePolymakerTdsUrl(variant.title, variant.handle);
      
      const record = {
        product_id: variant.productId,
        product_title: cleanedTitle,
        product_handle: variant.handle,
        vendor: 'Polymaker',
        brand_id: brandId,
        material: enrichment.material,
        finish_type: enrichment.finish_type,
        product_line_id: enrichment.product_line_id,
        color_hex: variant.colorHex || enrichment.color_hex,
        transmission_distance: variant.transmissionDistance || enrichment.transmission_distance,
        variant_price: variant.price,
        variant_compare_at_price: variant.compareAtPrice,
        variant_available: variant.available,
        product_url: variant.url,
        product_url_ca: variant.urlCa,
        price_cad: variant.priceCad,
        featured_image: variant.imageUrl,
        variant_sku: variant.sku,
        net_weight_g: Math.round(variant.weightKg * 1000),
        diameter_nominal_mm: variant.diameterMm,
        nozzle_temp_min_c: enrichment.nozzle_temp_min_c,
        nozzle_temp_max_c: enrichment.nozzle_temp_max_c,
        bed_temp_min_c: enrichment.bed_temp_min_c,
        bed_temp_max_c: enrichment.bed_temp_max_c,
        print_speed_max_mms: enrichment.print_speed_max_mms,
        is_nozzle_abrasive: enrichment.is_nozzle_abrasive,
        high_speed_capable: enrichment.high_speed_capable,
        fan_min_percent: enrichment.fan_min_percent,
        fan_max_percent: enrichment.fan_max_percent,
        tds_url: tdsUrl,
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
            ...record,
            updated_at: new Date().toISOString(),
          })
          .eq('id', existing.id);
        
        if (error) {
          errors.push(`Update failed for ${variant.productId}: ${error.message}`);
        } else {
          updated++;
        }
      } else {
        // Insert
        const { error } = await supabase
          .from('filaments')
          .insert(record);
        
        if (error) {
          errors.push(`Insert failed for ${variant.productId}: ${error.message}`);
        } else {
          created++;
        }
      }
    } catch (error) {
      errors.push(`Error processing ${variant.productId}: ${error}`);
    }
  }
  
  console.log(`[Polymaker] Upsert complete: ${created} created, ${updated} updated, ${errors.length} errors`);
  return { created, updated, errors };
}

// ============================================================================
// Step 5a: Fix Duplicate Hex Codes
// ============================================================================

async function fixDuplicateHexCodes(
  supabase: any
): Promise<number> {
  console.log('[Polymaker] Fixing duplicate hex codes...');
  
  // Find duplicates using RPC
  const { data: duplicates, error } = await supabase
    .rpc('find_duplicate_hexes', { p_vendor: 'Polymaker' });
  
  if (error) {
    console.error('[Polymaker] Failed to find duplicates:', error);
    return 0;
  }
  
  if (!duplicates || duplicates.length === 0) {
    console.log('[Polymaker] No duplicate hex codes found');
    return 0;
  }
  
  // Group by product_line_id and hex
  const groups = new Map<string, typeof duplicates>();
  for (const dup of duplicates) {
    const key = `${dup.product_line_id}-${dup.color_hex?.toLowerCase()}`;
    if (!groups.has(key)) {
      groups.set(key, []);
    }
    groups.get(key)!.push(dup);
  }
  
  let fixed = 0;
  
  for (const [key, items] of groups) {
    if (items.length <= 1) continue;
    
    // Keep first, adjust others
    for (let i = 1; i < items.length; i++) {
      const item = items[i];
      const baseHex = item.color_hex?.replace('#', '') || 'CCCCCC';
      
      // Slightly adjust the hex code
      const r = parseInt(baseHex.substring(0, 2), 16);
      const g = parseInt(baseHex.substring(2, 4), 16);
      const b = parseInt(baseHex.substring(4, 6), 16);
      
      // Add small offset based on index
      const newR = Math.min(255, Math.max(0, r + i * 2));
      const newG = Math.min(255, Math.max(0, g + i));
      const newB = Math.min(255, Math.max(0, b - i));
      
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
  
  console.log(`[Polymaker] Fixed ${fixed} duplicate hex codes`);
  return fixed;
}

// ============================================================================
// Step 5b: Clean Up Stale Parent Products (no color suffix)
// ============================================================================

async function cleanupStaleParentProducts(supabase: any): Promise<number> {
  console.log('[Polymaker] Cleaning up stale parent products...');
  
  // Find products with NULL product_line_id
  const { data: staleProducts, error: findError } = await supabase
    .from('filaments')
    .select('id, product_title, product_handle')
    .ilike('vendor', 'Polymaker')
    .is('product_line_id', null);
  
  if (findError || !staleProducts) {
    console.error('[Polymaker] Failed to find stale products:', findError);
    return 0;
  }
  
  if (staleProducts.length === 0) {
    console.log('[Polymaker] No stale parent products found');
    return 0;
  }
  
  console.log(`[Polymaker] Found ${staleProducts.length} products with NULL product_line_id`);
  
  let deleted = 0;
  let assigned = 0;
  
  for (const product of staleProducts) {
    const title = product.product_title || '';
    const hasColorSuffix = title.includes(' - ');
    
    // Check if this product has any siblings (products with same handle that DO have product_line_id)
    const { data: siblings } = await supabase
      .from('filaments')
      .select('id, product_line_id')
      .ilike('vendor', 'Polymaker')
      .eq('product_handle', product.product_handle)
      .not('product_line_id', 'is', null)
      .limit(1);
    
    // Also check for siblings by similar title (handles may differ)
    const baseTitleLower = title.toLowerCase().replace(/\s+-\s+.*$/, '').trim();
    const { data: titleSiblings } = await supabase
      .from('filaments')
      .select('id, product_line_id')
      .ilike('vendor', 'Polymaker')
      .ilike('product_title', `${baseTitleLower}%`)
      .not('product_line_id', 'is', null)
      .limit(1);
    
    const hasSiblings = (siblings && siblings.length > 0) || (titleSiblings && titleSiblings.length > 0);
    const siblingProductLineId = siblings?.[0]?.product_line_id || titleSiblings?.[0]?.product_line_id;
    
    if (hasSiblings && !hasColorSuffix) {
      // This is a stale parent product - delete it
      const { error: deleteError } = await supabase
        .from('filaments')
        .delete()
        .eq('id', product.id);
      
      if (!deleteError) {
        deleted++;
        console.log(`[Polymaker] Deleted stale parent: ${title}`);
      }
    } else if (!hasColorSuffix) {
      // This is a legitimate single-color product - assign a product_line_id
      if (siblingProductLineId) {
        const { error: updateError } = await supabase
          .from('filaments')
          .update({ product_line_id: siblingProductLineId })
          .eq('id', product.id);
        
        if (!updateError) {
          assigned++;
          console.log(`[Polymaker] Assigned product_line_id to single-color product: ${title} -> ${siblingProductLineId}`);
        }
      } else {
        // Generate a product_line_id for this orphan single-color product
        const enrichment = enrichPolymakerProduct(title, null);
        if (enrichment.product_line_id) {
          const { error: updateError } = await supabase
            .from('filaments')
            .update({ product_line_id: enrichment.product_line_id })
            .eq('id', product.id);
          
          if (!updateError) {
            assigned++;
            console.log(`[Polymaker] Generated product_line_id for orphan: ${title} -> ${enrichment.product_line_id}`);
          }
        }
      }
    }
  }
  
  console.log(`[Polymaker] Cleanup complete: ${deleted} deleted, ${assigned} assigned product_line_id`);
  return deleted + assigned;
}

// ============================================================================
// Step 5c: Validate TDS URLs
// ============================================================================

async function validateTdsUrls(
  supabase: any
): Promise<number> {
  console.log('[Polymaker] Validating TDS URLs...');
  
  const { data: filaments, error } = await supabase
    .from('filaments')
    .select('id, product_title, product_handle, tds_url')
    .ilike('vendor', 'polymaker')
    .not('tds_url', 'is', null);
  
  if (error || !filaments) {
    console.error('[Polymaker] Failed to fetch filaments for TDS validation:', error);
    return 0;
  }
  
  let validated = 0;
  
  for (const filament of filaments.slice(0, 50)) { // Limit to 50 for performance
    try {
      const response = await fetch(filament.tds_url, { method: 'HEAD' });
      
      if (!response.ok) {
        // Try legacy URL pattern
        const legacyUrl = `https://polymaker.com/wp-content/uploads/lana-downloads/${filament.product_handle}_TDS_V5.3.pdf`;
        const legacyResponse = await fetch(legacyUrl, { method: 'HEAD' });
        
        if (legacyResponse.ok) {
          await supabase
            .from('filaments')
            .update({ tds_url: legacyUrl })
            .eq('id', filament.id);
          validated++;
        } else {
          // Clear invalid TDS URL
          await supabase
            .from('filaments')
            .update({ tds_url: null })
            .eq('id', filament.id);
        }
      }
    } catch (error) {
      // Network error, skip
    }
    
    // Rate limit
    await new Promise(resolve => setTimeout(resolve, 200));
  }
  
  console.log(`[Polymaker] Validated/fixed ${validated} TDS URLs`);
  return validated;
}

// ============================================================================
// Main Handler
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
    
    // Parse options from request body
    let options = { skipRegional: false, skipTdsValidation: false };
    try {
      const body = await req.json();
      options = { ...options, ...body };
    } catch {
      // Use defaults
    }
    
    // Get brand ID
    const { data: brand } = await supabase
      .from('automated_brands')
      .select('id')
      .eq('brand_slug', 'polymaker')
      .maybeSingle();
    
    const brandId = brand?.id || null;
    
    // Step 1: Fetch US products
    console.log('[Polymaker] === Step 1: Fetch US Products ===');
    const usProducts = await fetchShopifyProducts('https://us.polymaker.com');
    results.push({
      step: 'fetch_us_products',
      success: usProducts.length > 0,
      count: usProducts.length,
    });
    
    if (usProducts.length === 0) {
      throw new Error('No products fetched from US store');
    }
    
    // Step 2: Fetch CA regional prices
    console.log('[Polymaker] === Step 2: Fetch CA Prices ===');
    let regionalPrices = new Map<string, { priceCad: number; urlCa: string }>();
    if (!options.skipRegional) {
      regionalPrices = await fetchRegionalPrices(usProducts);
    }
    results.push({
      step: 'fetch_ca_prices',
      success: true,
      count: regionalPrices.size,
    });
    
    // Step 3: Explode variants
    console.log('[Polymaker] === Step 3: Explode Variants ===');
    const variants = explodeVariants(usProducts, regionalPrices);
    results.push({
      step: 'explode_variants',
      success: variants.length > 0,
      count: variants.length,
    });
    
    // Step 4: Upsert with enrichments
    console.log('[Polymaker] === Step 4: Upsert with Enrichments ===');
    const upsertResult = await upsertVariants(supabase, variants, brandId);
    results.push({
      step: 'upsert_variants',
      success: upsertResult.errors.length === 0,
      created: upsertResult.created,
      updated: upsertResult.updated,
      errors: upsertResult.errors.slice(0, 10), // Limit error output
    });
    
    // Step 5a: Fix duplicate hex codes
    console.log('[Polymaker] === Step 5a: Fix Duplicate Hex Codes ===');
    const hexesFixed = await fixDuplicateHexCodes(supabase);
    results.push({
      step: 'fix_duplicate_hexes',
      success: true,
      count: hexesFixed,
    });
    
    // Step 5b: Clean up stale parent products
    console.log('[Polymaker] === Step 5b: Clean Up Stale Products ===');
    const staleDeleted = await cleanupStaleParentProducts(supabase);
    results.push({
      step: 'cleanup_stale_parents',
      success: true,
      count: staleDeleted,
    });
    
    // Step 5c: Validate TDS URLs (optional, can be slow)
    if (!options.skipTdsValidation) {
      console.log('[Polymaker] === Step 5c: Validate TDS URLs ===');
      const tdsValidated = await validateTdsUrls(supabase);
      results.push({
        step: 'validate_tds_urls',
        success: true,
        count: tdsValidated,
      });
    }
    
    // Update brand stats
    await supabase.rpc('update_brand_product_counts', { p_brand_slug: 'polymaker' });
    
    const duration = ((Date.now() - startTime) / 1000).toFixed(1);
    console.log(`[Polymaker] Sync complete in ${duration}s`);
    
    return new Response(
      JSON.stringify({
        success: true,
        duration_seconds: parseFloat(duration),
        results,
        summary: {
          products_fetched: usProducts.length,
          variants_created: variants.length,
          records_created: upsertResult.created,
          records_updated: upsertResult.updated,
          ca_prices_loaded: regionalPrices.size,
          hexes_fixed: hexesFixed,
        },
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
    
  } catch (error) {
    console.error('[Polymaker] Sync failed:', error);
    
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        results,
        duration_seconds: ((Date.now() - startTime) / 1000).toFixed(1),
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
