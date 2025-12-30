import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import {
  enrichKingroonProduct,
  isFilamentProduct,
  cleanKingroonTitle,
  parseVariantTitle,
  getKingroonColorHex,
  isHighSpeedVariant,
  isCarbonFiberVariant,
} from '../_shared/kingroon-defaults.ts';

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
  images: Array<{ src: string }>;
  variants: Array<{
    id: number;
    title: string;
    price: string;
    compare_at_price: string | null;
    sku: string;
    available: boolean;
    option1: string | null;
    option2: string | null;
    option3: string | null;
  }>;
}

interface SyncStats {
  discovered: number;
  created: number;
  updated: number;
  skipped: number;
  errors: number;
  errorDetails: string[];
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  const supabase = createClient(supabaseUrl, supabaseKey);

  const stats: SyncStats = {
    discovered: 0,
    created: 0,
    updated: 0,
    skipped: 0,
    errors: 0,
    errorDetails: [],
  };

  try {
    const { step = 'all', limit = 500 } = await req.json().catch(() => ({}));
    
    console.log(`[Kingroon Sync] Starting sync - step: ${step}, limit: ${limit}`);

    // Get brand ID
    const { data: brand } = await supabase
      .from('automated_brands')
      .select('id')
      .eq('brand_slug', 'kingroon')
      .single();

    const brandId = brand?.id || null;

    // ========================================================================
    // STEP 1: Base Sync via Shopify JSON API
    // ========================================================================
    if (step === 'all' || step === '1' || step === 'base') {
      console.log('[Step 1] Fetching products from Kingroon Shopify API...');
      
      let allProducts: ShopifyProduct[] = [];
      let page = 1;
      const perPage = 250;
      
      while (true) {
        const url = `https://kingroon.com/products.json?limit=${perPage}&page=${page}`;
        console.log(`[Step 1] Fetching page ${page}: ${url}`);
        
        try {
          const response = await fetch(url, {
            headers: {
              'Accept': 'application/json',
              'User-Agent': 'FilaScope/1.0',
            },
          });
          
          if (!response.ok) {
            console.error(`[Step 1] Failed to fetch page ${page}: ${response.status}`);
            break;
          }
          
          const data = await response.json();
          const products = data.products || [];
          
          if (products.length === 0) break;
          
          allProducts = allProducts.concat(products);
          console.log(`[Step 1] Fetched ${products.length} products (total: ${allProducts.length})`);
          
          if (products.length < perPage) break;
          page++;
          
          // Rate limiting
          await new Promise(resolve => setTimeout(resolve, 500));
        } catch (error) {
          console.error(`[Step 1] Error fetching page ${page}:`, error);
          break;
        }
      }
      
      console.log(`[Step 1] Total products fetched: ${allProducts.length}`);
      
      // Filter to filament products only
      const filamentProducts = allProducts.filter(p => 
        isFilamentProduct(p.title, p.product_type)
      );
      
      console.log(`[Step 1] Filament products: ${filamentProducts.length}`);
      stats.discovered = filamentProducts.length;
      
      // Process each product with variant explosion
      for (const product of filamentProducts.slice(0, limit)) {
        try {
          const productUrl = `https://kingroon.com/products/${product.handle}`;
          const featuredImage = product.images[0]?.src || null;
          
          // Get enrichment from product title
          const baseEnrichment = enrichKingroonProduct(product.title);
          
          // Explode variants (each color = separate DB row)
          for (const variant of product.variants) {
            try {
              // Parse the variant title (Size / Warehouse / Color)
              const parsed = parseVariantTitle(variant.title);
              const colorName = parsed.color || variant.option3 || variant.option2 || variant.option1;
              
              // Skip non-US warehouse variants to avoid duplicates
              // We'll track warehouse availability separately
              if (parsed.warehouse && parsed.warehouse !== 'US') {
                // Just update warehouse availability flags if product exists
                continue;
              }
              
              // Generate unique product ID
              const productId = `${product.id}_${variant.id}`;
              
              // Generate product title with color
              let productTitle = cleanKingroonTitle(product.title);
              if (colorName && !productTitle.toLowerCase().includes(colorName.toLowerCase())) {
                productTitle = `${productTitle} - ${colorName}`;
              }
              
              // Get color hex
              const colorHex = colorName ? getKingroonColorHex(colorName) : null;
              
              // Build filament data
              const filamentData: Record<string, unknown> = {
                product_id: productId,
                product_title: productTitle.trim(),
                vendor: 'Kingroon',
                brand_id: brandId,
                product_url: productUrl,
                product_handle: product.handle,
                featured_image: featuredImage,
                variant_price: parseFloat(variant.price) || null,
                variant_compare_at_price: variant.compare_at_price ? parseFloat(variant.compare_at_price) : null,
                variant_available: variant.available,
                variant_sku: variant.sku || null,
                material: baseEnrichment.material,
                finish_type: baseEnrichment.finishType !== 'Standard' ? baseEnrichment.finishType : null,
                product_line_id: baseEnrichment.productLineId,
                color_hex: colorHex,
                high_speed_capable: baseEnrichment.isHighSpeed,
                is_nozzle_abrasive: baseEnrichment.isAbrasive,
                diameter_nominal_mm: 1.75,
                net_weight_g: baseEnrichment.isBulk ? 10000 : 1000,
                last_scraped_at: new Date().toISOString(),
                sync_status: 'synced',
                auto_created: true,
                auto_updated: true,
              };
              
              // Add print settings if available
              if (baseEnrichment.printSettings) {
                filamentData.nozzle_temp_min_c = baseEnrichment.printSettings.nozzleTempMin;
                filamentData.nozzle_temp_max_c = baseEnrichment.printSettings.nozzleTempMax;
                filamentData.bed_temp_min_c = baseEnrichment.printSettings.bedTempMin;
                filamentData.bed_temp_max_c = baseEnrichment.printSettings.bedTempMax;
                if (baseEnrichment.printSettings.printSpeedMax) {
                  filamentData.print_speed_max_mms = baseEnrichment.printSettings.printSpeedMax;
                }
              }
              
              // Check if exists
              const { data: existing } = await supabase
                .from('filaments')
                .select('id')
                .eq('product_id', productId)
                .eq('vendor', 'Kingroon')
                .maybeSingle();
              
              if (existing) {
                // Update
                const { error } = await supabase
                  .from('filaments')
                  .update(filamentData)
                  .eq('id', existing.id);
                
                if (error) throw error;
                stats.updated++;
              } else {
                // Insert
                const { error } = await supabase
                  .from('filaments')
                  .insert(filamentData);
                
                if (error) throw error;
                stats.created++;
              }
            } catch (variantError) {
              console.error(`[Step 1] Error processing variant ${variant.id}:`, variantError);
              stats.errors++;
              stats.errorDetails.push(`Variant ${variant.id}: ${variantError}`);
            }
          }
        } catch (productError) {
          console.error(`[Step 1] Error processing product ${product.id}:`, productError);
          stats.errors++;
          stats.errorDetails.push(`Product ${product.id}: ${productError}`);
        }
      }
      
      console.log(`[Step 1] Complete - Created: ${stats.created}, Updated: ${stats.updated}`);
    }

    // ========================================================================
    // STEP 2: Firecrawl Product Detail Scraping (Optional)
    // ========================================================================
    if (step === 'all' || step === '2' || step === 'scrape') {
      console.log('[Step 2] Checking for products needing detail scraping...');
      
      const firecrawlKey = Deno.env.get('FIRECRAWL_API_KEY');
      if (!firecrawlKey) {
        console.log('[Step 2] Skipped - No FIRECRAWL_API_KEY configured');
      } else {
        // Get products missing print temps
        const { data: products } = await supabase
          .from('filaments')
          .select('id, product_url, product_title')
          .ilike('vendor', 'kingroon')
          .is('nozzle_temp_min_c', null)
          .not('product_url', 'is', null)
          .limit(20);
        
        console.log(`[Step 2] Found ${products?.length || 0} products needing scraping`);
        
        // Get unique URLs
        const uniqueUrls = [...new Set(products?.map(p => p.product_url) || [])];
        
        for (const url of uniqueUrls.slice(0, 10)) {
          try {
            console.log(`[Step 2] Scraping: ${url}`);
            
            const response = await fetch('https://api.firecrawl.dev/v1/scrape', {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${firecrawlKey}`,
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                url,
                formats: ['markdown'],
                onlyMainContent: true,
              }),
            });
            
            if (!response.ok) {
              console.error(`[Step 2] Firecrawl error for ${url}: ${response.status}`);
              continue;
            }
            
            const data = await response.json();
            const markdown = data.data?.markdown || '';
            
            // Extract print temperatures from markdown
            const nozzleTempMatch = markdown.match(/nozzle\s*(?:temp|temperature)[:\s]*(\d+)\s*[-~]\s*(\d+)/i);
            const bedTempMatch = markdown.match(/(?:bed|platform)\s*(?:temp|temperature)[:\s]*(\d+)\s*[-~]\s*(\d+)/i);
            
            if (nozzleTempMatch || bedTempMatch) {
              const updateData: Record<string, number> = {};
              
              if (nozzleTempMatch) {
                updateData.nozzle_temp_min_c = parseInt(nozzleTempMatch[1]);
                updateData.nozzle_temp_max_c = parseInt(nozzleTempMatch[2]);
              }
              if (bedTempMatch) {
                updateData.bed_temp_min_c = parseInt(bedTempMatch[1]);
                updateData.bed_temp_max_c = parseInt(bedTempMatch[2]);
              }
              
              // Update all products with this URL
              const { error } = await supabase
                .from('filaments')
                .update(updateData)
                .eq('product_url', url)
                .ilike('vendor', 'kingroon');
              
              if (error) {
                console.error(`[Step 2] Error updating temps for ${url}:`, error);
              } else {
                console.log(`[Step 2] Updated temps for ${url}`);
              }
            }
            
            // Rate limiting
            await new Promise(resolve => setTimeout(resolve, 1500));
          } catch (error) {
            console.error(`[Step 2] Error scraping ${url}:`, error);
          }
        }
      }
      
      console.log('[Step 2] Complete');
    }

    // ========================================================================
    // STEP 3: Brand-Specific Enrichments
    // ========================================================================
    if (step === 'all' || step === '3' || step === 'enrich') {
      console.log('[Step 3] Running brand-specific enrichments...');
      
      // Get all Kingroon products that may need enrichment
      const { data: products } = await supabase
        .from('filaments')
        .select('id, product_title, material, finish_type, product_line_id, color_hex, high_speed_capable')
        .ilike('vendor', 'kingroon')
        .limit(500);
      
      let enriched = 0;
      
      for (const product of products || []) {
        try {
          const enrichment = enrichKingroonProduct(product.product_title);
          
          const updates: Record<string, unknown> = {};
          
          // Only update if null or different
          if (!product.material && enrichment.material) {
            updates.material = enrichment.material;
          }
          if (!product.finish_type && enrichment.finishType !== 'Standard') {
            updates.finish_type = enrichment.finishType;
          }
          if (!product.product_line_id && enrichment.productLineId) {
            updates.product_line_id = enrichment.productLineId;
          }
          if (product.high_speed_capable === null && enrichment.isHighSpeed) {
            updates.high_speed_capable = enrichment.isHighSpeed;
          }
          if (!product.color_hex && enrichment.colorHex) {
            updates.color_hex = enrichment.colorHex;
          }
          
          // Add abrasive flag for CF variants
          if (enrichment.isAbrasive) {
            updates.is_nozzle_abrasive = true;
          }
          
          if (Object.keys(updates).length > 0) {
            const { error } = await supabase
              .from('filaments')
              .update(updates)
              .eq('id', product.id);
            
            if (error) throw error;
            enriched++;
          }
        } catch (error) {
          console.error(`[Step 3] Error enriching product ${product.id}:`, error);
        }
      }
      
      console.log(`[Step 3] Complete - Enriched ${enriched} products`);
    }

    // ========================================================================
    // STEP 4: Duplicate Hex Fix
    // ========================================================================
    if (step === 'all' || step === '4' || step === 'hexfix') {
      console.log('[Step 4] Checking for duplicate hex codes...');
      
      try {
        const { data: duplicates, error } = await supabase
          .rpc('find_duplicate_hexes', { p_vendor: 'Kingroon' });
        
        if (error) {
          console.error('[Step 4] Error finding duplicates:', error);
        } else if (duplicates && duplicates.length > 0) {
          console.log(`[Step 4] Found ${duplicates.length} duplicate hex entries`);
          
          // Group by product_line_id and hex
          const groups = new Map<string, typeof duplicates>();
          for (const dup of duplicates) {
            const key = `${dup.product_line_id}|${dup.color_hex?.toLowerCase()}`;
            if (!groups.has(key)) {
              groups.set(key, []);
            }
            groups.get(key)!.push(dup);
          }
          
          // Fix each group by generating unique hex variants
          for (const [key, items] of groups) {
            if (items.length > 1) {
              // Keep first, modify others slightly
              for (let i = 1; i < items.length; i++) {
                const item = items[i];
                if (item.color_hex) {
                  // Adjust hex slightly
                  const hex = item.color_hex.replace('#', '');
                  const r = Math.min(255, parseInt(hex.slice(0, 2), 16) + i * 5);
                  const newHex = `#${r.toString(16).padStart(2, '0')}${hex.slice(2)}`;
                  
                  await supabase
                    .from('filaments')
                    .update({ color_hex: newHex.toUpperCase() })
                    .eq('id', item.id);
                }
              }
            }
          }
          
          console.log(`[Step 4] Fixed ${groups.size} duplicate groups`);
        } else {
          console.log('[Step 4] No duplicate hex codes found');
        }
      } catch (error) {
        console.error('[Step 4] Error:', error);
      }
      
      console.log('[Step 4] Complete');
    }

    // ========================================================================
    // STEP 5: Warehouse Availability Sync
    // ========================================================================
    if (step === 'all' || step === '5' || step === 'warehouse') {
      console.log('[Step 5] Syncing warehouse availability...');
      
      // For Kingroon, all prices are USD and the same store serves all regions
      // The warehouse in variant title indicates shipping location
      // We could add available_regions field based on warehouse options
      
      // Get products and check their variant warehouses
      const { data: products } = await supabase
        .from('filaments')
        .select('id, product_handle, available_regions')
        .ilike('vendor', 'kingroon')
        .is('available_regions', null)
        .limit(100);
      
      console.log(`[Step 5] Found ${products?.length || 0} products to check`);
      
      // For now, mark all Kingroon products as available in US, EU, UK
      // (based on their warehouse options)
      if (products && products.length > 0) {
        const { error } = await supabase
          .from('filaments')
          .update({ available_regions: ['US', 'EU', 'UK'] })
          .ilike('vendor', 'kingroon')
          .is('available_regions', null);
        
        if (error) {
          console.error('[Step 5] Error updating regions:', error);
        } else {
          console.log('[Step 5] Updated available_regions for products');
        }
      }
      
      console.log('[Step 5] Complete');
    }

    // Update brand product counts
    await supabase.rpc('update_brand_product_counts', { p_brand_slug: 'kingroon' });
    await supabase.rpc('update_brand_enrichment_counts', { p_brand_slug: 'kingroon' });

    console.log('[Kingroon Sync] Complete!', stats);

    return new Response(
      JSON.stringify({
        success: true,
        stats,
        message: `Kingroon sync complete. Created: ${stats.created}, Updated: ${stats.updated}, Errors: ${stats.errors}`,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('[Kingroon Sync] Fatal error:', error);
    
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        stats,
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
