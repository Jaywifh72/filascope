import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import {
  enrichOvertureProduct,
  getOvertureColorHex,
  cleanOvertureTitle,
  extractOvertureWeight,
} from "../_shared/overture-defaults.ts";
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
  tags: string;
  images: Array<{
    id: number;
    src: string;
    alt: string | null;
  }>;
  variants: Array<{
    id: number;
    title: string;
    price: string;
    compare_at_price: string | null;
    sku: string;
    barcode: string | null;
    available: boolean;
    option1: string | null;
    option2: string | null;
    option3: string | null;
  }>;
  options: Array<{
    id: number;
    name: string;
    position: number;
    values: string[];
  }>;
}

interface SyncStats {
  discovered: number;
  created: number;
  updated: number;
  skipped: number;
  errors: number;
}

const OVERTURE_STORE_URL = 'https://overture3d.com';

/**
 * Fetch products from Shopify JSON API
 */
async function fetchShopifyProducts(): Promise<ShopifyProduct[]> {
  const allProducts: ShopifyProduct[] = [];
  let page = 1;
  const limit = 250;
  
  console.log('[Overture] Fetching products from Shopify JSON API...');
  
  while (true) {
    const url = `${OVERTURE_STORE_URL}/products.json?limit=${limit}&page=${page}`;
    console.log(`[Overture] Fetching page ${page}: ${url}`);
    
    try {
      const response = await fetch(url, {
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'FilaScope-Sync/1.0',
        },
      });
      
      if (!response.ok) {
        console.error(`[Overture] Failed to fetch page ${page}: ${response.status}`);
        break;
      }
      
      const data = await response.json();
      const products = data.products || [];
      
      if (products.length === 0) {
        console.log(`[Overture] No more products on page ${page}`);
        break;
      }
      
      // Filter for filament products only
      const filamentProducts = products.filter((p: ShopifyProduct) => {
        const title = p.title.toLowerCase();
        const productType = (p.product_type || '').toLowerCase();
        const tags = (p.tags || '').toLowerCase();
        
        // Must be filament
        const isFilament = title.includes('filament') || 
                          title.includes('pla') || 
                          title.includes('petg') || 
                          title.includes('tpu') ||
                          title.includes('abs') ||
                          title.includes('asa') ||
                          productType.includes('filament');
        
        // Exclude non-filament products
        const isExcluded = title.includes('spool') && !title.includes('filament') ||
                          title.includes('dryer') ||
                          title.includes('accessory') ||
                          tags.includes('accessory');
        
        return isFilament && !isExcluded;
      });
      
      console.log(`[Overture] Page ${page}: ${products.length} total, ${filamentProducts.length} filament products`);
      allProducts.push(...filamentProducts);
      
      if (products.length < limit) {
        break;
      }
      
      page++;
      await new Promise(r => setTimeout(r, 300)); // Rate limit
    } catch (error) {
      console.error(`[Overture] Error fetching page ${page}:`, error);
      break;
    }
  }
  
  console.log(`[Overture] Total filament products discovered: ${allProducts.length}`);
  return allProducts;
}

/**
 * Extract TDS URL from product body HTML
 */
function extractTdsUrl(bodyHtml: string): string | null {
  if (!bodyHtml) return null;
  
  // Look for PDF links
  const pdfMatch = bodyHtml.match(/href=["']([^"']*\.pdf[^"']*)["']/i);
  if (pdfMatch) {
    let url = pdfMatch[1];
    // Handle relative URLs
    if (url.startsWith('//')) {
      url = 'https:' + url;
    } else if (url.startsWith('/')) {
      url = OVERTURE_STORE_URL + url;
    }
    return url;
  }
  
  // Look for TDS/SDS mentions with links
  const tdsMatch = bodyHtml.match(/(?:tds|sds|technical|safety|data\s*sheet)[^<]*<a[^>]*href=["']([^"']+)["']/i);
  if (tdsMatch) {
    return tdsMatch[1];
  }
  
  return null;
}

/**
 * Explode product into color variants
 */
function explodeVariants(product: ShopifyProduct): Array<{
  productId: string;
  title: string;
  color: string;
  price: number;
  compareAtPrice: number | null;
  sku: string | null;
  barcode: string | null;
  available: boolean;
  imageUrl: string | null;
  productUrl: string;
  weight: number;
}> {
  const variants: Array<{
    productId: string;
    title: string;
    color: string;
    price: number;
    compareAtPrice: number | null;
    sku: string | null;
    barcode: string | null;
    available: boolean;
    imageUrl: string | null;
    productUrl: string;
    weight: number;
  }> = [];
  
  const filterStats = createFilterStats();
  
  // Find color option
  const colorOption = product.options.find(o => 
    o.name.toLowerCase() === 'color' || 
    o.name.toLowerCase() === 'colour'
  );
  
  const productUrl = `${OVERTURE_STORE_URL}/products/${product.handle}`;
  const featuredImage = product.images[0]?.src || null;
  
  if (colorOption && colorOption.values.length > 0) {
    // Explode by color
    for (const color of colorOption.values) {
      // Find matching variant
      const matchingVariant = product.variants.find(v => 
        v.option1 === color || v.option2 === color || v.option3 === color
      );
      
      if (matchingVariant) {
        const weight = extractOvertureWeight(product.title, matchingVariant.title);
        
        // Apply standard filters (exclude bulk >1.4kg, samples <300g, 2.85mm, excluded keywords)
        const filterResult = shouldIncludeVariant(weight, 1.75, product.title); // Overture is 1.75mm only
        if (!filterResult.include) {
          updateFilterStats(filterStats, filterResult);
          console.log(`[Overture] Skipping: ${product.title} - ${color} - ${filterResult.reason}`);
          continue;
        }
        
        const colorSlug = color.toLowerCase().replace(/[^a-z0-9]+/g, '-');
        const productId = `overture-${product.handle}-${colorSlug}`;
        
        variants.push({
          productId,
          title: product.title,
          color,
          price: parseFloat(matchingVariant.price),
          compareAtPrice: matchingVariant.compare_at_price ? parseFloat(matchingVariant.compare_at_price) : null,
          sku: matchingVariant.sku || null,
          barcode: matchingVariant.barcode || null,
          available: matchingVariant.available,
          imageUrl: featuredImage,
          productUrl: `${productUrl}?variant=${matchingVariant.id}`,
          weight,
        });
      }
    }
  } else if (product.variants.length > 0) {
    // No color option, use first variant
    const variant = product.variants[0];
    const weight = extractOvertureWeight(product.title, variant.title);
    
    const filterResult = shouldIncludeVariant(weight, 1.75, product.title);
    if (filterResult.include) {
      const productId = `overture-${product.handle}`;
      
      variants.push({
        productId,
        title: product.title,
        color: '',
        price: parseFloat(variant.price),
        compareAtPrice: variant.compare_at_price ? parseFloat(variant.compare_at_price) : null,
        sku: variant.sku || null,
        barcode: variant.barcode || null,
        available: variant.available,
        imageUrl: featuredImage,
        productUrl,
        weight,
      });
    } else {
      updateFilterStats(filterStats, filterResult);
      console.log(`[Overture] Skipping: ${product.title} - ${filterResult.reason}`);
    }
  }
  
  logFilterStats('Overture', filterStats);
  return variants;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const startTime = Date.now();
  
  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Parse options
    let options = { cleanSlate: false, limit: 0 };
    try {
      const body = await req.json();
      options = { ...options, ...body };
    } catch {
      // Use defaults
    }

    console.log('[Overture] Starting sync with options:', options);

    // Get brand info
    const { data: brand } = await supabase
      .from('automated_brands')
      .select('id, brand_name')
      .eq('brand_slug', 'overture')
      .single();

    const brandId = brand?.id || null;
    console.log(`[Overture] Brand ID: ${brandId}`);

    // Optional clean slate
    if (options.cleanSlate) {
      console.log('[Overture] Clean slate mode - deleting existing products...');
      const { error: deleteError, count } = await supabase
        .from('filaments')
        .delete({ count: 'exact' })
        .ilike('vendor', 'overture');
      
      if (deleteError) {
        console.error('[Overture] Error deleting products:', deleteError);
      } else {
        console.log(`[Overture] Deleted ${count} existing products`);
      }
    }

    // Mark as scraping
    await supabase
      .from('automated_brands')
      .update({ scraping_active: true })
      .eq('brand_slug', 'overture');

    const stats: SyncStats = {
      discovered: 0,
      created: 0,
      updated: 0,
      skipped: 0,
      errors: 0,
    };

    // Step 1: Fetch products from Shopify
    console.log('[Overture] Step 1: Fetching products from Shopify...');
    const products = await fetchShopifyProducts();
    stats.discovered = products.length;

    // Step 2-4: Process each product
    console.log('[Overture] Step 2-4: Processing products...');
    
    let processed = 0;
    for (const product of products) {
      if (options.limit > 0 && processed >= options.limit) {
        console.log(`[Overture] Reached limit of ${options.limit} products`);
        break;
      }
      
      try {
        // Extract TDS URL from body HTML
        const tdsUrl = extractTdsUrl(product.body_html);
        
        // Explode into color variants
        const variants = explodeVariants(product);
        
        for (const variant of variants) {
          // Enrich with brand-specific data
          const enriched = enrichOvertureProduct({
            title: variant.title,
            color: variant.color,
            variantTitle: '',
          });
          
          // Prepare filament data
          const filamentData = {
            product_id: variant.productId,
            product_title: enriched.cleanedTitle,
            vendor: 'Overture',
            brand_id: brandId,
            material: enriched.material,
            finish_type: enriched.finishType,
            product_line_id: enriched.productLineId,
            color_family: variant.color || null,
            color_hex: enriched.colorHex,
            variant_price: variant.price,
            variant_compare_at_price: variant.compareAtPrice,
            variant_available: variant.available,
            variant_sku: variant.sku,
            product_url: variant.productUrl,
            featured_image: variant.imageUrl,
            tds_url: tdsUrl,
            upc: variant.barcode,
            nozzle_temp_min_c: enriched.nozzleTempMin,
            nozzle_temp_max_c: enriched.nozzleTempMax,
            bed_temp_min_c: enriched.bedTempMin,
            bed_temp_max_c: enriched.bedTempMax,
            diameter_nominal_mm: 1.75,
            net_weight_g: enriched.netWeightG,
            high_speed_capable: enriched.highSpeedCapable || null,
            is_nozzle_abrasive: enriched.isNozzleAbrasive || null,
            auto_created: true,
            auto_updated: true,
            last_scraped_at: new Date().toISOString(),
            sync_status: 'synced',
          };
          
          // Check if product exists
          const { data: existing } = await supabase
            .from('filaments')
            .select('id')
            .eq('product_id', variant.productId)
            .single();
          
          if (existing) {
            // Update existing
            const { error: updateError } = await supabase
              .from('filaments')
              .update(filamentData)
              .eq('id', existing.id);
            
            if (updateError) {
              console.error(`[Overture] Error updating ${variant.productId}:`, updateError);
              stats.errors++;
            } else {
              stats.updated++;
            }
          } else {
            // Insert new
            const { error: insertError } = await supabase
              .from('filaments')
              .insert(filamentData);
            
            if (insertError) {
              console.error(`[Overture] Error inserting ${variant.productId}:`, insertError);
              stats.errors++;
            } else {
              stats.created++;
            }
          }
        }
        
        processed++;
        
        if (processed % 10 === 0) {
          console.log(`[Overture] Processed ${processed}/${products.length} products`);
        }
      } catch (error) {
        console.error(`[Overture] Error processing product ${product.handle}:`, error);
        stats.errors++;
      }
    }

    // Step 5: Finalize
    console.log('[Overture] Step 5: Finalizing...');
    
    // Update brand product counts
    const { error: rpcError } = await supabase.rpc('update_brand_product_counts', {
      p_brand_slug: 'overture'
    });
    if (rpcError) {
      console.error('[Overture] Error updating brand counts:', rpcError);
    }

    // Check for duplicate hex codes
    const { data: dupes } = await supabase.rpc('find_duplicate_hexes', {
      p_vendor: 'Overture'
    });
    if (dupes && dupes.length > 0) {
      console.log(`[Overture] Found ${dupes.length} duplicate hex codes to review`);
    }

    // Mark as not scraping
    await supabase
      .from('automated_brands')
      .update({ 
        scraping_active: false,
        last_scrape_at: new Date().toISOString(),
      })
      .eq('brand_slug', 'overture');

    const duration = ((Date.now() - startTime) / 1000).toFixed(1);
    
    console.log('[Overture] Sync complete:', {
      ...stats,
      duration: `${duration}s`,
    });

    return new Response(
      JSON.stringify({
        success: true,
        vendor: 'Overture',
        stats,
        duration: `${duration}s`,
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );

  } catch (error) {
    console.error('[Overture] Fatal error:', error);
    
    // Try to reset scraping status
    try {
      const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
      const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
      const supabase = createClient(supabaseUrl, supabaseKey);
      
      await supabase
        .from('automated_brands')
        .update({ scraping_active: false })
        .eq('brand_slug', 'overture');
    } catch {
      // Ignore cleanup errors
    }

    return new Response(
      JSON.stringify({
        success: false,
        vendor: 'Overture',
        error: error instanceof Error ? error.message : 'Unknown error',
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});
