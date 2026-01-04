/**
 * BAMBU LAB SYNC FUNCTION
 * 
 * 5-step architecture matching AzureFilm:
 * Step 0: Create sync log entry
 * Step 1: Discover products from Shopify JSON API (CA store)
 * Step 2: Process variants with filtering
 * Step 3: Safety validation (minimum product threshold)
 * Step 4: Clean slate deletion
 * Step 5: Insert products with enrichment
 * 
 * Source: https://ca.store.bambulab.com/collections/bambu-lab-3d-printer-filament
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { 
  BAMBULAB_STORE_INFO,
  BAMBULAB_SAFE_DELETE_THRESHOLD,
  isBambuLabNonFilament,
  generateBambuLabProductLineId,
  getBambuLabProductLineConfig,
  enrichBambuLabProduct,
} from '../_shared/bambulab-defaults.ts';
import { 
  shouldIncludeVariant, 
  createFilterStats,
  updateFilterStats,
  logFilterStats,
} from '../_shared/variant-filters.ts';
import { getColorHex, getColorFamily } from '../_shared/color-mapping.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// CAD to USD exchange rate (approximate)
const CAD_TO_USD_RATE = 0.74;

interface ShopifyProduct {
  id: number;
  title: string;
  handle: string;
  product_type: string;
  vendor: string;
  variants: ShopifyVariant[];
  images: ShopifyImage[];
  body_html?: string;
}

interface ShopifyVariant {
  id: number;
  title: string;
  price: string;
  compare_at_price: string | null;
  available: boolean;
  sku: string;
  option1: string | null;
  option2: string | null;
  option3: string | null;
}

interface ShopifyImage {
  id: number;
  src: string;
  alt: string | null;
}

interface ProcessedProduct {
  productTitle: string;
  productHandle: string;
  variantTitle: string;
  colorName: string | null;
  price: number | null;
  priceCad: number | null;
  compareAtPrice: number | null;
  available: boolean;
  imageUrl: string | null;
  sku: string | null;
  productUrl: string;
  weightGrams: number;
}

interface SyncResult {
  success: boolean;
  summary: {
    totalDiscovered: number;
    created: number;
    updated: number;
    skipped: number;
    errors: number;
  };
  duration: string;
  duration_ms: number;
}

// ============================================================================
// STEP 1: DISCOVER PRODUCTS FROM SHOPIFY JSON API
// ============================================================================

async function discoverProductsFromShopify(): Promise<ShopifyProduct[]> {
  const allProducts: ShopifyProduct[] = [];
  let page = 1;
  const limit = 250; // Shopify max per page
  
  console.log(`[BambuLab] Discovering products from Shopify JSON API...`);
  
  while (true) {
    const url = `${BAMBULAB_STORE_INFO.productsUrl}/products.json?limit=${limit}&page=${page}`;
    console.log(`[BambuLab] Fetching page ${page}: ${url}`);
    
    try {
      const response = await fetch(url, {
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'Mozilla/5.0 (compatible; FilaScopeBot/1.0)',
        },
      });
      
      if (!response.ok) {
        console.error(`[BambuLab] Failed to fetch page ${page}: ${response.status}`);
        break;
      }
      
      const data = await response.json();
      const products = data.products || [];
      
      if (products.length === 0) {
        console.log(`[BambuLab] No more products on page ${page}`);
        break;
      }
      
      // Filter for filament products only
      const filamentProducts = products.filter((p: ShopifyProduct) => {
        const title = p.title.toLowerCase();
        const productType = (p.product_type || '').toLowerCase();
        
        // Must contain "filament" in title or product type
        const hasFilamentKeyword = title.includes('filament') || productType.includes('filament');
        
        // Check if it's a non-filament product
        const isNonFilament = isBambuLabNonFilament(p.title);
        
        return hasFilamentKeyword && !isNonFilament;
      });
      
      console.log(`[BambuLab] Page ${page}: ${products.length} products, ${filamentProducts.length} filaments`);
      allProducts.push(...filamentProducts);
      
      // If we got fewer than limit, we've reached the end
      if (products.length < limit) {
        break;
      }
      
      page++;
      
      // Safety limit
      if (page > 10) {
        console.warn('[BambuLab] Reached page limit, stopping pagination');
        break;
      }
      
      // Small delay between pages
      await new Promise(resolve => setTimeout(resolve, 200));
    } catch (error) {
      console.error(`[BambuLab] Error fetching page ${page}:`, error);
      break;
    }
  }
  
  console.log(`[BambuLab] Total filament products discovered: ${allProducts.length}`);
  return allProducts;
}

// ============================================================================
// STEP 2: PROCESS VARIANTS
// ============================================================================

function extractColorFromVariant(product: ShopifyProduct, variant: ShopifyVariant): string | null {
  // Bambu Lab typically uses option1 for color
  const colorOption = variant.option1 || variant.option2 || variant.option3;
  
  if (colorOption) {
    // Clean up common patterns
    return colorOption
      .replace(/\s*-\s*\d+g$/i, '') // Remove weight suffix
      .replace(/\s*1\.75mm$/i, '') // Remove diameter suffix
      .trim();
  }
  
  // Try to extract from variant title
  if (variant.title && variant.title !== 'Default Title') {
    const parts = variant.title.split(' / ');
    if (parts.length > 0) {
      return parts[0].trim();
    }
  }
  
  return null;
}

function extractWeightFromVariant(product: ShopifyProduct, variant: ShopifyVariant): number {
  // Check variant options for weight
  const options = [variant.option1, variant.option2, variant.option3].filter(Boolean);
  
  for (const opt of options) {
    if (!opt) continue;
    const lowerOpt = opt.toLowerCase();
    
    // Check for weight patterns
    if (/(\d+)\s*g\b/i.test(lowerOpt)) {
      const match = lowerOpt.match(/(\d+)\s*g\b/i);
      if (match) return parseInt(match[1], 10);
    }
    if (/(\d+)\s*kg\b/i.test(lowerOpt)) {
      const match = lowerOpt.match(/(\d+)\s*kg\b/i);
      if (match) return parseInt(match[1], 10) * 1000;
    }
  }
  
  // Check title
  const title = `${product.title} ${variant.title}`;
  if (/(\d+)\s*g\b/i.test(title)) {
    const match = title.match(/(\d+)\s*g\b/i);
    if (match) return parseInt(match[1], 10);
  }
  
  // Default to 1kg for Bambu Lab
  return 1000;
}

function processProducts(products: ShopifyProduct[]): ProcessedProduct[] {
  const processed: ProcessedProduct[] = [];
  const filterStats = createFilterStats();
  
  for (const product of products) {
    // Skip non-filament products
    if (isBambuLabNonFilament(product.title)) {
      console.log(`[BambuLab] Skipping non-filament: ${product.title}`);
      continue;
    }
    
    const baseImageUrl = product.images?.[0]?.src || null;
    
    for (const variant of product.variants) {
      const colorName = extractColorFromVariant(product, variant);
      const weightGrams = extractWeightFromVariant(product, variant);
      
      // Apply variant filters (weight, diameter, excluded keywords)
      const filterResult = shouldIncludeVariant(weightGrams, 1.75, product.title);
      updateFilterStats(filterStats, filterResult);
      
      if (!filterResult.include) {
        console.log(`[BambuLab] Filtering: ${product.title} - ${variant.title} (${filterResult.reason})`);
        continue;
      }
      
      const priceCad = variant.price ? parseFloat(variant.price) : null;
      const priceUsd = priceCad ? priceCad * CAD_TO_USD_RATE : null;
      const compareAtPrice = variant.compare_at_price ? parseFloat(variant.compare_at_price) * CAD_TO_USD_RATE : null;
      
      // Try to find a color-specific image
      let imageUrl = baseImageUrl;
      if (colorName && product.images.length > 1) {
        const colorImage = product.images.find(img => 
          img.alt?.toLowerCase().includes(colorName.toLowerCase())
        );
        if (colorImage) {
          imageUrl = colorImage.src;
        }
      }
      
      processed.push({
        productTitle: product.title,
        productHandle: product.handle,
        variantTitle: variant.title,
        colorName,
        price: priceUsd,
        priceCad,
        compareAtPrice,
        available: variant.available,
        imageUrl,
        sku: variant.sku || null,
        productUrl: `${BAMBULAB_STORE_INFO.baseUrl}/products/${product.handle}`,
        weightGrams,
      });
    }
  }
  
  logFilterStats('Bambu Lab', filterStats);
  console.log(`[BambuLab] Processed ${processed.length} valid variants`);
  return processed;
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
    // Initialize clients
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    // Parse request body
    const body = await req.json().catch(() => ({}));
    const cleanSlate = body.cleanSlate === true;
    const dryRun = body.dryRun === true;
    
    console.log(`[BambuLab] Starting sync (cleanSlate: ${cleanSlate}, dryRun: ${dryRun})`);
    
    // ========================================================================
    // STEP 0: Create sync log entry
    // ========================================================================
    let syncLogId: string | null = null;
    
    if (!dryRun) {
      const { data: syncLog, error: syncLogError } = await supabase
        .from('brand_sync_logs')
        .insert({
          brand_slug: 'bambu-lab',
          sync_type: cleanSlate ? 'clean_slate' : 'incremental',
          status: 'running',
          started_at: new Date().toISOString(),
          triggered_by: 'manual',
        })
        .select('id')
        .single();
      
      if (syncLogError) {
        console.error('[BambuLab] Failed to create sync log:', syncLogError);
      }
      syncLogId = syncLog?.id;
    }
    
    // ========================================================================
    // STEP 1: Discover products from Shopify JSON API
    // ========================================================================
    const discoveredProducts = await discoverProductsFromShopify();
    
    if (discoveredProducts.length === 0) {
      throw new Error('No filament products discovered from Shopify API');
    }
    
    // ========================================================================
    // STEP 2: Process variants with filtering
    // ========================================================================
    const processedProducts = processProducts(discoveredProducts);
    
    // ========================================================================
    // STEP 3: Safety validation
    // ========================================================================
    if (processedProducts.length < BAMBULAB_SAFE_DELETE_THRESHOLD) {
      throw new Error(
        `Safety check failed: Only ${processedProducts.length} products processed, ` +
        `minimum ${BAMBULAB_SAFE_DELETE_THRESHOLD} required for clean slate sync`
      );
    }
    
    console.log(`[BambuLab] Safety check passed: ${processedProducts.length} products (threshold: ${BAMBULAB_SAFE_DELETE_THRESHOLD})`);
    
    // Dry run - return early with discovery results
    if (dryRun) {
      const duration = Date.now() - startTime;
      return new Response(
        JSON.stringify({
          success: true,
          dryRun: true,
          summary: {
            totalDiscovered: discoveredProducts.length,
            totalVariants: processedProducts.length,
            created: 0,
            updated: 0,
            skipped: 0,
            errors: 0,
          },
          sampleProducts: processedProducts.slice(0, 10).map(p => ({
            title: p.productTitle,
            color: p.colorName,
            price: p.price,
            weight: p.weightGrams,
          })),
          duration: `${(duration / 1000).toFixed(1)}s`,
          duration_ms: duration,
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    // ========================================================================
    // STEP 4: Clean slate deletion (if enabled)
    // ========================================================================
    if (cleanSlate) {
      console.log('[BambuLab] Performing clean slate deletion...');
      
      const { error: deleteError, count: deleteCount } = await supabase
        .from('filaments')
        .delete()
        .ilike('vendor', 'bambu lab');
      
      if (deleteError) {
        console.error('[BambuLab] Delete error:', deleteError);
        throw new Error(`Failed to delete existing products: ${deleteError.message}`);
      }
      
      console.log(`[BambuLab] Deleted ${deleteCount || 0} existing products`);
    }
    
    // ========================================================================
    // STEP 5: Insert products with enrichment
    // ========================================================================
    const productsToInsert: any[] = [];
    let skipped = 0;
    let errors = 0;
    
    for (const product of processedProducts) {
      try {
        // Enrich product with material info, finish type, etc.
        const config = getBambuLabProductLineConfig(product.productTitle);
        const enrichment = enrichBambuLabProduct(product.productTitle);
        
        // Get color hex
        const colorHex = product.colorName ? getColorHex(product.colorName) : null;
        const colorFamily = product.colorName ? getColorFamily(product.colorName) : null;
        
        // Build product record
        const productRecord = {
          product_title: product.productTitle,
          vendor: BAMBULAB_STORE_INFO.vendor,
          material: enrichment.productLineId.includes('tpu') ? 'TPU' :
                   enrichment.productLineId.includes('abs') ? 'ABS' :
                   enrichment.productLineId.includes('asa') ? 'ASA' :
                   enrichment.productLineId.includes('petg') ? 'PETG' :
                   enrichment.productLineId.includes('pc') ? 'PC' :
                   enrichment.productLineId.includes('pa') ? 'PA' :
                   enrichment.productLineId.includes('pps') ? 'PPS' :
                   enrichment.productLineId.includes('pva') ? 'PVA' :
                   enrichment.productLineId.includes('support') ? 'Support' :
                   'PLA',
          finish_type: enrichment.finishType,
          product_line_id: enrichment.productLineId,
          color_family: colorFamily || product.colorName,
          color_hex: colorHex,
          variant_price: product.price,
          price_cad: product.priceCad,
          variant_compare_at_price: product.compareAtPrice,
          variant_available: product.available,
          featured_image: product.imageUrl,
          product_url: product.productUrl,
          variant_sku: product.sku,
          net_weight_g: product.weightGrams,
          diameter_nominal_mm: 1.75,
          is_nozzle_abrasive: config.isAbrasive,
          high_speed_capable: config.highSpeedCapable,
          auto_created: true,
          auto_updated: true,
          last_scraped_at: new Date().toISOString(),
        };
        
        productsToInsert.push(productRecord);
        
      } catch (error) {
        console.error(`[BambuLab] Error processing ${product.productTitle}:`, error);
        errors++;
      }
    }
    
    // Batch insert
    let created = 0;
    const batchSize = 50;
    
    for (let i = 0; i < productsToInsert.length; i += batchSize) {
      const batch = productsToInsert.slice(i, i + batchSize);
      
      const { error: insertError, data: insertedData } = await supabase
        .from('filaments')
        .insert(batch)
        .select('id');
      
      if (insertError) {
        console.error(`[BambuLab] Batch insert error (${i}-${i + batch.length}):`, insertError);
        errors += batch.length;
      } else {
        created += insertedData?.length || batch.length;
      }
      
      // Progress logging
      if ((i + batchSize) % 100 === 0 || i + batchSize >= productsToInsert.length) {
        console.log(`[BambuLab] Inserted ${Math.min(i + batchSize, productsToInsert.length)}/${productsToInsert.length} products`);
      }
    }
    
    const duration = Date.now() - startTime;
    
    // Update sync log
    if (syncLogId) {
      await supabase
        .from('brand_sync_logs')
        .update({
          status: errors > 0 && created === 0 ? 'failed' : 'completed',
          completed_at: new Date().toISOString(),
          duration_seconds: Math.round(duration / 1000),
          products_discovered: discoveredProducts.length,
          products_created: created,
          products_failed: errors,
        })
        .eq('id', syncLogId);
    }
    
    // Update brand product counts
    await supabase.rpc('update_brand_product_counts', { p_brand_slug: 'bambu-lab' });
    
    console.log(`[BambuLab] Sync complete: ${created} created, ${skipped} skipped, ${errors} errors`);
    
    const result: SyncResult = {
      success: errors === 0 || created > 0,
      summary: {
        totalDiscovered: discoveredProducts.length,
        created,
        updated: 0,
        skipped,
        errors,
      },
      duration: `${(duration / 1000).toFixed(1)}s`,
      duration_ms: duration,
    };
    
    return new Response(
      JSON.stringify(result),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
    
  } catch (error) {
    console.error('[BambuLab] Sync failed:', error);
    const duration = Date.now() - startTime;
    
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        duration: `${(duration / 1000).toFixed(1)}s`,
        duration_ms: duration,
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
