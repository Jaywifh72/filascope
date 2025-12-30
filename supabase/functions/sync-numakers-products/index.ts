/**
 * NUMAKERS FULL SYNC PIPELINE
 * 
 * 5-step sync for Numakers filaments:
 * 1. Fetch products from Shopify JSON API
 * 2. Explode color variants (each color = DB row)
 * 3. Apply brand-specific enrichments
 * 4. Fix duplicate hex codes
 * 5. Populate cheat sheet URLs (no TDS available)
 * 
 * Platform: Shopify (JSON API)
 * Currency: USD
 * Specialty: Vibrant colors, PETG-HS (high-speed), creative color names
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.1';
import {
  enrichNumakersProduct,
  cleanNumakersTitle,
  isFilamentProduct,
  getNumakersColorHex,
  NUMAKERS_COLOR_MAPPING,
} from '../_shared/numakers-defaults.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ShopifyProduct {
  id: number;
  title: string;
  handle: string;
  product_type: string;
  vendor: string;
  tags: string[];
  images: { src: string }[];
  variants: {
    id: number;
    title: string;
    price: string;
    compare_at_price: string | null;
    available: boolean;
    sku: string;
    option1: string | null;
    option2: string | null;
    option3: string | null;
  }[];
  options: {
    name: string;
    values: string[];
  }[];
}

interface ProductVariant {
  productId: string;
  title: string;
  color: string;
  colorHex: string | null;
  price: number | null;
  compareAtPrice: number | null;
  available: boolean;
  url: string;
  imageUrl: string | null;
  sku: string | null;
  weightKg: number;
}

interface SyncResult {
  success: boolean;
  step: string;
  created: number;
  updated: number;
  errors: number;
  details?: any;
}

// ============================================================================
// STEP 1: FETCH PRODUCTS FROM SHOPIFY JSON API
// ============================================================================

async function fetchShopifyProducts(): Promise<ShopifyProduct[]> {
  console.log('[NUMAKERS-SYNC] Step 1: Fetching products from Shopify API...');
  
  const allProducts: ShopifyProduct[] = [];
  let page = 1;
  const limit = 250;
  
  while (true) {
    try {
      const url = `https://numakers.com/products.json?limit=${limit}&page=${page}`;
      console.log(`[NUMAKERS-SYNC] Fetching page ${page}: ${url}`);
      
      const response = await fetch(url, {
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'FilaScope/1.0 (Filament Database Sync)'
        }
      });
      
      if (!response.ok) {
        console.error(`[NUMAKERS-SYNC] Failed to fetch page ${page}: ${response.status}`);
        break;
      }
      
      const data = await response.json();
      const products = data.products || [];
      
      if (products.length === 0) break;
      
      // Filter to filament products only
      const filaments = products.filter((p: ShopifyProduct) => isFilamentProduct(p));
      allProducts.push(...filaments);
      
      console.log(`[NUMAKERS-SYNC] Page ${page}: ${products.length} products, ${filaments.length} filaments`);
      
      if (products.length < limit) break;
      page++;
      
      // Rate limit
      await new Promise(r => setTimeout(r, 500));
    } catch (error) {
      console.error(`[NUMAKERS-SYNC] Error fetching page ${page}:`, error);
      break;
    }
  }
  
  console.log(`[NUMAKERS-SYNC] Total filament products fetched: ${allProducts.length}`);
  return allProducts;
}

// ============================================================================
// STEP 2: EXPLODE COLOR VARIANTS
// ============================================================================

function explodeVariants(products: ShopifyProduct[]): ProductVariant[] {
  console.log('[NUMAKERS-SYNC] Step 2: Exploding color variants...');
  const variants: ProductVariant[] = [];
  
  for (const product of products) {
    const baseUrl = `https://numakers.com/products/${product.handle}`;
    const baseImage = product.images?.[0]?.src || null;
    
    // Find color option index
    const colorOptionIndex = product.options.findIndex(
      opt => opt.name.toLowerCase() === 'color' || opt.name.toLowerCase() === 'colour'
    );
    
    if (colorOptionIndex >= 0 && product.variants.length > 1) {
      // Multiple color variants - explode each
      for (const variant of product.variants) {
        const colorValue = colorOptionIndex === 0 ? variant.option1 :
                          colorOptionIndex === 1 ? variant.option2 :
                          variant.option3;
        
        if (!colorValue) continue;
        
        const colorName = colorValue;
        const productId = `numakers-${product.handle}-${colorName.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')}`;
        
        variants.push({
          productId,
          title: `${product.title} - ${colorName}`,
          color: colorName,
          colorHex: getNumakersColorHex(colorName),
          price: variant.price ? parseFloat(variant.price) : null,
          compareAtPrice: variant.compare_at_price ? parseFloat(variant.compare_at_price) : null,
          available: variant.available,
          url: baseUrl,
          imageUrl: baseImage,
          sku: variant.sku || null,
          weightKg: 1.0, // Default
        });
      }
    } else {
      // Single variant or no color option - create one entry
      const variant = product.variants[0];
      if (!variant) continue;
      
      variants.push({
        productId: `numakers-${product.handle}`,
        title: product.title,
        color: variant.option1 || 'Standard',
        colorHex: variant.option1 ? getNumakersColorHex(variant.option1) : null,
        price: variant.price ? parseFloat(variant.price) : null,
        compareAtPrice: variant.compare_at_price ? parseFloat(variant.compare_at_price) : null,
        available: variant.available,
        url: baseUrl,
        imageUrl: baseImage,
        sku: variant.sku || null,
        weightKg: 1.0,
      });
    }
  }
  
  console.log(`[NUMAKERS-SYNC] Exploded into ${variants.length} color variants`);
  return variants;
}

// ============================================================================
// STEP 3: UPSERT TO DATABASE WITH ENRICHMENTS
// ============================================================================

async function upsertVariants(
  supabase: any,
  variants: ProductVariant[],
  brandId: string | null
): Promise<SyncResult> {
  console.log(`[NUMAKERS-SYNC] Step 3: Upserting ${variants.length} variants with enrichments...`);
  
  let created = 0, updated = 0, errors = 0;
  
  for (const variant of variants) {
    try {
      // Apply enrichments
      const enriched = enrichNumakersProduct(variant.title);
      const cleanedTitle = cleanNumakersTitle(variant.title);
      
      // Check if exists
      const { data: existing } = await supabase
        .from('filaments')
        .select('id')
        .eq('product_id', variant.productId)
        .ilike('vendor', 'numakers')
        .maybeSingle();
      
      const filamentData = {
        product_id: variant.productId,
        product_title: cleanedTitle || variant.title,
        vendor: 'Numakers',
        brand_id: brandId,
        material: enriched.material,
        product_line_id: enriched.productLineId,
        finish_type: enriched.finishType,
        color_hex: variant.colorHex ? `#${variant.colorHex}` : (enriched.colorHex ? `#${enriched.colorHex}` : null),
        color_family: variant.color,
        variant_price: variant.price,
        variant_compare_at_price: variant.compareAtPrice,
        variant_available: variant.available,
        variant_sku: variant.sku,
        product_url: variant.url,
        featured_image: variant.imageUrl,
        tds_url: enriched.cheatSheetUrl, // Use cheat sheet as "TDS" equivalent
        nozzle_temp_min_c: enriched.nozzleTempMin,
        nozzle_temp_max_c: enriched.nozzleTempMax,
        bed_temp_min_c: enriched.bedTempMin,
        bed_temp_max_c: enriched.bedTempMax,
        print_speed_max_mms: enriched.printSpeedMax,
        net_weight_g: enriched.weightKg * 1000,
        diameter_nominal_mm: 1.75,
        is_nozzle_abrasive: enriched.isAbrasive,
        last_scraped_at: new Date().toISOString(),
        sync_status: 'synced',
        auto_created: !existing,
        auto_updated: !!existing,
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
    } catch (error) {
      console.error(`[NUMAKERS-SYNC] Error upserting ${variant.productId}:`, error);
      errors++;
    }
  }
  
  return { success: errors === 0, step: 'upsert', created, updated, errors };
}

// ============================================================================
// STEP 4: FIX DUPLICATE HEX CODES
// ============================================================================

async function fixDuplicateHexCodes(supabase: any): Promise<SyncResult> {
  console.log('[NUMAKERS-SYNC] Step 4: Fixing duplicate hex codes...');
  
  try {
    const { data: duplicates, error } = await supabase.rpc('find_duplicate_hexes', {
      p_vendor: 'numakers'
    });
    
    if (error) throw error;
    
    if (!duplicates || duplicates.length === 0) {
      console.log('[NUMAKERS-SYNC] No duplicate hex codes found');
      return { success: true, step: 'fix_hexes', created: 0, updated: 0, errors: 0 };
    }
    
    console.log(`[NUMAKERS-SYNC] Found ${duplicates.length} products with duplicate hexes`);
    
    // Group by product_line_id and hex
    const groups: Record<string, typeof duplicates> = {};
    for (const dup of duplicates) {
      const key = `${dup.product_line_id}:${dup.color_hex?.toLowerCase()}`;
      if (!groups[key]) groups[key] = [];
      groups[key].push(dup);
    }
    
    let updated = 0;
    for (const [, items] of Object.entries(groups)) {
      // Skip first item (keep original), adjust others
      for (let i = 1; i < items.length; i++) {
        const item = items[i];
        const originalHex = item.color_hex?.replace('#', '') || 'FFFFFF';
        
        // Modify hex slightly
        const hexNum = parseInt(originalHex, 16);
        const newHexNum = (hexNum + i * 17) % 0xFFFFFF;
        const newHex = `#${newHexNum.toString(16).padStart(6, '0').toUpperCase()}`;
        
        const { error } = await supabase
          .from('filaments')
          .update({ color_hex: newHex })
          .eq('id', item.id);
        
        if (!error) updated++;
      }
    }
    
    return { success: true, step: 'fix_hexes', created: 0, updated, errors: 0 };
  } catch (error) {
    console.error('[NUMAKERS-SYNC] Error fixing hex codes:', error);
    return { success: false, step: 'fix_hexes', created: 0, updated: 0, errors: 1, details: error };
  }
}

// ============================================================================
// STEP 5: ENSURE CHEAT SHEET URLS
// ============================================================================

async function populateCheatSheetUrls(supabase: any): Promise<SyncResult> {
  console.log('[NUMAKERS-SYNC] Step 5: Populating cheat sheet URLs...');
  
  try {
    // Numakers doesn't have TDS PDFs - they use cheat sheet blog posts
    // The enrichment already populates tds_url with cheat sheet links
    // This step validates and fills any gaps
    
    const { data: filaments, error: fetchError } = await supabase
      .from('filaments')
      .select('id, product_title, material, tds_url')
      .ilike('vendor', 'numakers')
      .is('tds_url', null);
    
    if (fetchError) throw fetchError;
    
    let updated = 0;
    for (const filament of filaments || []) {
      const enriched = enrichNumakersProduct(filament.product_title, filament.material);
      
      if (enriched.cheatSheetUrl) {
        const { error } = await supabase
          .from('filaments')
          .update({ tds_url: enriched.cheatSheetUrl })
          .eq('id', filament.id);
        
        if (!error) updated++;
      }
    }
    
    console.log(`[NUMAKERS-SYNC] Updated ${updated} filaments with cheat sheet URLs`);
    return { success: true, step: 'cheat_sheets', created: 0, updated, errors: 0 };
  } catch (error) {
    console.error('[NUMAKERS-SYNC] Error populating cheat sheet URLs:', error);
    return { success: false, step: 'cheat_sheets', created: 0, updated: 0, errors: 1, details: error };
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
  console.log('[NUMAKERS-SYNC] ═══════════════════════════════════════════════════════');
  console.log('[NUMAKERS-SYNC] 🚀 NUMAKERS FULL SYNC STARTED');
  console.log('[NUMAKERS-SYNC] ═══════════════════════════════════════════════════════');

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Parse options
    let options = {
      skipFetch: false,
      skipEnrichment: false,
      skipHexFix: false,
      skipCheatSheets: false,
      limit: 500
    };
    try {
      const body = await req.json();
      options = { ...options, ...body };
    } catch {}

    // Get brand ID
    const { data: brand } = await supabase
      .from('automated_brands')
      .select('id')
      .eq('brand_slug', 'numakers')
      .maybeSingle();
    
    const brandId = brand?.id || null;
    const results: SyncResult[] = [];

    // Step 1 & 2: Fetch and explode products
    if (!options.skipFetch) {
      const products = await fetchShopifyProducts();
      const variants = explodeVariants(products);
      
      // Step 3: Upsert with enrichments
      if (!options.skipEnrichment && variants.length > 0) {
        const upsertResult = await upsertVariants(supabase, variants, brandId);
        results.push(upsertResult);
      }
    }

    // Step 4: Fix duplicate hex codes
    if (!options.skipHexFix) {
      const hexResult = await fixDuplicateHexCodes(supabase);
      results.push(hexResult);
    }

    // Step 5: Populate cheat sheet URLs
    if (!options.skipCheatSheets) {
      const cheatResult = await populateCheatSheetUrls(supabase);
      results.push(cheatResult);
    }

    // Update brand counts
    if (brandId) {
      await supabase.rpc('update_brand_product_counts', { p_brand_slug: 'numakers' });
      await supabase.rpc('update_brand_enrichment_counts', { p_brand_slug: 'numakers' });
    }

    const duration = Math.round((Date.now() - startTime) / 1000);
    const totalCreated = results.reduce((sum, r) => sum + r.created, 0);
    const totalUpdated = results.reduce((sum, r) => sum + r.updated, 0);
    const totalErrors = results.reduce((sum, r) => sum + r.errors, 0);

    console.log('[NUMAKERS-SYNC] ═══════════════════════════════════════════════════════');
    console.log(`[NUMAKERS-SYNC] ✅ SYNC COMPLETED in ${duration}s`);
    console.log(`[NUMAKERS-SYNC] Created: ${totalCreated}, Updated: ${totalUpdated}, Errors: ${totalErrors}`);
    console.log('[NUMAKERS-SYNC] ═══════════════════════════════════════════════════════');

    return new Response(JSON.stringify({
      success: totalErrors === 0,
      duration,
      created: totalCreated,
      updated: totalUpdated,
      errors: totalErrors,
      steps: results,
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('[NUMAKERS-SYNC] ❌ Fatal error:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      duration: Math.round((Date.now() - startTime) / 1000),
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
