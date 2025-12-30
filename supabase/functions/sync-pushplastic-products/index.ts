/**
 * Push Plastic Sync Pipeline
 * 
 * 5-step sync process:
 * 1. Fetch products from Shopify JSON API
 * 2. Explode color variants into individual rows
 * 3. Upsert with brand-specific enrichments
 * 4. Fix duplicate hex codes
 * 5. Validate TDS URLs
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import {
  enrichPushPlasticProduct,
  isPushPlasticFilamentProduct,
  extractPushPlasticWeight,
  extractPushPlasticDiameter,
  PUSHPLASTIC_PRINT_SETTINGS,
} from '../_shared/pushplastic-defaults.ts';

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
  sku: string;
  position: number;
  compare_at_price: string | null;
  option1: string | null;
  option2: string | null;
  option3: string | null;
  available: boolean;
  grams: number;
  weight: number;
  weight_unit: string;
}

interface ShopifyImage {
  id: number;
  product_id: number;
  position: number;
  src: string;
  alt: string | null;
}

interface ProductVariant {
  productId: string;
  variantId: string;
  title: string;
  color: string;
  material: string | null;
  price: number;
  compareAtPrice: number | null;
  sku: string | null;
  available: boolean;
  weight: number | null;
  diameter: number;
  imageUrl: string | null;
  productUrl: string;
  spoolType: string | null;
}

interface SyncResult {
  step: string;
  success: boolean;
  count?: number;
  error?: string;
  details?: Record<string, unknown>;
}

// ============================================================================
// CONSTANTS
// ============================================================================

const SHOPIFY_BASE_URL = 'https://www.pushplastic.com';
const VENDOR_NAME = 'Push Plastic';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// ============================================================================
// STEP 1: FETCH PRODUCTS FROM SHOPIFY
// ============================================================================

async function fetchShopifyProducts(): Promise<ShopifyProduct[]> {
  const allProducts: ShopifyProduct[] = [];
  let page = 1;
  const limit = 250;
  
  console.log('Starting Shopify product fetch...');
  
  while (true) {
    const url = `${SHOPIFY_BASE_URL}/products.json?limit=${limit}&page=${page}`;
    console.log(`Fetching page ${page}: ${url}`);
    
    try {
      const response = await fetch(url, {
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'FilamentFinder/1.0',
        },
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      const products = data.products || [];
      
      if (products.length === 0) {
        console.log(`No more products on page ${page}, stopping.`);
        break;
      }
      
      // Filter to filament products only
      const filamentProducts = products.filter((p: ShopifyProduct) => 
        isPushPlasticFilamentProduct(p.title, p.product_type)
      );
      
      console.log(`Page ${page}: ${products.length} total, ${filamentProducts.length} filament products`);
      allProducts.push(...filamentProducts);
      
      if (products.length < limit) {
        break;
      }
      
      page++;
      
      // Rate limiting
      await new Promise(resolve => setTimeout(resolve, 500));
    } catch (error) {
      console.error(`Error fetching page ${page}:`, error);
      break;
    }
  }
  
  console.log(`Total filament products fetched: ${allProducts.length}`);
  return allProducts;
}

// ============================================================================
// STEP 2: EXPLODE VARIANTS
// ============================================================================

function explodeVariants(products: ShopifyProduct[]): ProductVariant[] {
  const variants: ProductVariant[] = [];
  
  for (const product of products) {
    const productUrl = `${SHOPIFY_BASE_URL}/products/${product.handle}`;
    const defaultImage = product.images[0]?.src || null;
    
    for (const variant of product.variants) {
      // Parse variant options - typically Color / Size / Spool Type
      const color = variant.option1 || 'Default';
      const sizeOption = variant.option2 || '';
      const spoolType = variant.option3 || null;
      
      // Extract weight from size option or variant weight
      let weight = extractPushPlasticWeight(sizeOption) || 
                   extractPushPlasticWeight(variant.title);
      
      // Fallback to variant grams
      if (!weight && variant.grams > 0) {
        weight = variant.grams;
      }
      
      // Extract diameter
      const diameter = extractPushPlasticDiameter(sizeOption) || 
                       extractPushPlasticDiameter(variant.title) || 
                       1.75;
      
      // Create unique product ID
      const productId = `pushplastic-${product.id}-${variant.id}`;
      
      variants.push({
        productId,
        variantId: String(variant.id),
        title: product.title,
        color,
        material: null, // Will be enriched
        price: parseFloat(variant.price) || 0,
        compareAtPrice: variant.compare_at_price ? parseFloat(variant.compare_at_price) : null,
        sku: variant.sku || null,
        available: variant.available,
        weight,
        diameter,
        imageUrl: defaultImage,
        productUrl,
        spoolType,
      });
    }
  }
  
  console.log(`Exploded into ${variants.length} individual variants`);
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
  let upserted = 0;
  let errors = 0;
  
  console.log(`Upserting ${variants.length} variants with enrichments...`);
  
  // Process in batches
  const batchSize = 50;
  for (let i = 0; i < variants.length; i += batchSize) {
    const batch = variants.slice(i, i + batchSize);
    
    const records = batch.map(variant => {
      // Apply brand-specific enrichments
      const enriched = enrichPushPlasticProduct(
        variant.title,
        variant.material,
        null // Let enrichment find color hex
      );
      
      const settings = enriched.printSettings;
      
      // Build full title with color
      const fullTitle = `${enriched.cleanedTitle} - ${variant.color}`;
      
      return {
        product_id: variant.productId,
        product_title: fullTitle,
        vendor: VENDOR_NAME,
        brand_id: brandId,
        material: enriched.material,
        finish_type: enriched.finishType,
        product_line_id: enriched.productLineId,
        color_hex: enriched.colorHex,
        tds_url: enriched.tdsUrl,
        product_url: variant.productUrl,
        featured_image: variant.imageUrl,
        variant_price: variant.price,
        variant_compare_at_price: variant.compareAtPrice,
        variant_sku: variant.sku,
        variant_available: variant.available,
        net_weight_g: variant.weight,
        diameter_nominal_mm: variant.diameter,
        nozzle_temp_min_c: settings?.nozzle_temp_min_c || null,
        nozzle_temp_max_c: settings?.nozzle_temp_max_c || null,
        bed_temp_min_c: settings?.bed_temp_min_c || null,
        bed_temp_max_c: settings?.bed_temp_max_c || null,
        fan_min_percent: settings?.fan_min_percent || null,
        fan_max_percent: settings?.fan_max_percent || null,
        drying_temp_c: settings?.drying_temp_c || null,
        drying_time_hours: settings?.drying_time_hours || null,
        is_nozzle_abrasive: enriched.isAbrasive,
        auto_created: true,
        auto_updated: true,
        last_scraped_at: new Date().toISOString(),
      };
    });
    
    const { error } = await supabase
      .from('filaments')
      .upsert(records, { 
        onConflict: 'product_id',
        ignoreDuplicates: false 
      });
    
    if (error) {
      console.error(`Batch upsert error:`, error);
      errors += batch.length;
    } else {
      upserted += batch.length;
    }
    
    // Rate limit
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  
  console.log(`Upsert complete: ${upserted} succeeded, ${errors} failed`);
  
  return {
    step: 'upsert',
    success: errors === 0,
    count: upserted,
    details: { errors },
  };
}

// ============================================================================
// STEP 4: FIX DUPLICATE HEX CODES
// ============================================================================

async function fixDuplicateHexCodes(supabase: any): Promise<SyncResult> {
  console.log('Checking for duplicate hex codes within product lines...');
  
  try {
    const { data, error } = await supabase.rpc('find_duplicate_hexes', {
      p_vendor: VENDOR_NAME
    });
    
    if (error) {
      console.error('RPC error:', error);
      return {
        step: 'fix_duplicates',
        success: false,
        error: error.message,
      };
    }
    
    const duplicates = data || [];
    console.log(`Found ${duplicates.length} duplicate hex code groups`);
    
    // Fix duplicates by slightly adjusting hex values
    let fixed = 0;
    for (const dup of duplicates) {
      const { product_line_id, color_hex, ids } = dup;
      
      if (!ids || ids.length < 2) continue;
      
      // Skip the first one, adjust the rest
      for (let i = 1; i < ids.length; i++) {
        // Slightly modify the hex to make it unique
        const originalHex = color_hex || '#808080';
        const adjustment = i * 2;
        const r = Math.min(255, parseInt(originalHex.slice(1, 3), 16) + adjustment);
        const newHex = `#${r.toString(16).padStart(2, '0')}${originalHex.slice(3)}`;
        
        const { error: updateError } = await supabase
          .from('filaments')
          .update({ color_hex: newHex })
          .eq('id', ids[i]);
        
        if (!updateError) {
          fixed++;
        }
      }
    }
    
    console.log(`Fixed ${fixed} duplicate hex codes`);
    
    return {
      step: 'fix_duplicates',
      success: true,
      count: fixed,
    };
  } catch (error) {
    console.error('Error fixing duplicates:', error);
    return {
      step: 'fix_duplicates',
      success: false,
      error: String(error),
    };
  }
}

// ============================================================================
// STEP 5: VALIDATE TDS URLs
// ============================================================================

async function validateTdsUrls(supabase: any): Promise<SyncResult> {
  console.log('Validating TDS URLs...');
  
  const { data: filaments, error } = await supabase
    .from('filaments')
    .select('id, tds_url')
    .eq('vendor', VENDOR_NAME)
    .not('tds_url', 'is', null);
  
  if (error) {
    return {
      step: 'validate_tds',
      success: false,
      error: error.message,
    };
  }
  
  let valid = 0;
  let invalid = 0;
  
  // Sample validation (check a few URLs)
  const sample = (filaments || []).slice(0, 5);
  
  for (const filament of sample) {
    try {
      const response = await fetch(filament.tds_url, { method: 'HEAD' });
      if (response.ok) {
        valid++;
      } else {
        console.warn(`TDS URL returned ${response.status}: ${filament.tds_url}`);
        invalid++;
      }
    } catch (error) {
      console.warn(`TDS URL fetch error: ${filament.tds_url}`);
      invalid++;
    }
    
    await new Promise(resolve => setTimeout(resolve, 200));
  }
  
  console.log(`TDS validation sample: ${valid} valid, ${invalid} invalid`);
  
  return {
    step: 'validate_tds',
    success: true,
    count: filaments?.length || 0,
    details: { sampled: sample.length, valid, invalid },
  };
}

// ============================================================================
// MAIN HANDLER
// ============================================================================

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }
  
  const startTime = Date.now();
  
  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    // Parse options
    let options: { cleanSlate?: boolean; skipFetch?: boolean; skipEnrich?: boolean } = {};
    try {
      options = await req.json();
    } catch {
      options = {};
    }
    
    console.log('='.repeat(60));
    console.log('PUSH PLASTIC SYNC PIPELINE');
    console.log('Options:', JSON.stringify(options));
    console.log('='.repeat(60));
    
    // Get brand ID
    const { data: brand } = await supabase
      .from('automated_brands')
      .select('id')
      .eq('brand_slug', 'push-plastic')
      .single();
    
    const brandId = brand?.id || null;
    console.log(`Brand ID: ${brandId || 'not found'}`);
    
    // Clean slate if requested
    if (options.cleanSlate) {
      console.log('Clean slate: Deleting existing Push Plastic products...');
      const { data: deleted } = await supabase
        .from('filaments')
        .delete()
        .eq('vendor', VENDOR_NAME)
        .select('id');
      console.log(`Deleted ${deleted?.length || 0} existing products`);
    }
    
    const results: SyncResult[] = [];
    
    // Step 1: Fetch products
    if (!options.skipFetch) {
      console.log('\n--- STEP 1: FETCH PRODUCTS ---');
      const products = await fetchShopifyProducts();
      results.push({
        step: 'fetch',
        success: products.length > 0,
        count: products.length,
      });
      
      if (products.length > 0) {
        // Step 2: Explode variants
        console.log('\n--- STEP 2: EXPLODE VARIANTS ---');
        const variants = explodeVariants(products);
        results.push({
          step: 'explode',
          success: variants.length > 0,
          count: variants.length,
        });
        
        // Step 3: Upsert with enrichments
        if (!options.skipEnrich && variants.length > 0) {
          console.log('\n--- STEP 3: UPSERT WITH ENRICHMENTS ---');
          const upsertResult = await upsertVariants(supabase, variants, brandId);
          results.push(upsertResult);
        }
      }
    }
    
    // Step 4: Fix duplicate hex codes
    console.log('\n--- STEP 4: FIX DUPLICATE HEX CODES ---');
    const dupResult = await fixDuplicateHexCodes(supabase);
    results.push(dupResult);
    
    // Step 5: Validate TDS URLs
    console.log('\n--- STEP 5: VALIDATE TDS URLs ---');
    const tdsResult = await validateTdsUrls(supabase);
    results.push(tdsResult);
    
    const duration = Date.now() - startTime;
    
    console.log('\n' + '='.repeat(60));
    console.log('SYNC COMPLETE');
    console.log(`Duration: ${duration}ms`);
    console.log('='.repeat(60));
    
    return new Response(
      JSON.stringify({
        success: true,
        vendor: VENDOR_NAME,
        results,
        duration_ms: duration,
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
    
  } catch (error) {
    console.error('Fatal error:', error);
    
    return new Response(
      JSON.stringify({
        success: false,
        error: String(error),
        duration_ms: Date.now() - startTime,
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});
