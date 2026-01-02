/**
 * Flashforge Product Sync Pipeline
 * 
 * 5-step sync process:
 * 1. Base Sync via Shopify JSON API
 * 2. Firecrawl Product Detail Scraping
 * 3. Brand-Specific Enrichments
 * 4. Duplicate Hex Fix
 * 5. Regional Price Sync
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import {
  enrichFlashforgeProduct,
  isFilamentProduct,
  cleanFlashforgeTitle,
  getFlashforgeColorHex,
} from '../_shared/flashforge-defaults.ts';
import {
  shouldIncludeVariant,
  createFilterStats,
  updateFilterStats,
  logFilterStats,
  extractWeightFromText,
  is285mmDiameter,
} from '../_shared/variant-filters.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface SyncOptions {
  dryRun?: boolean;
  limit?: number;
  tasks?: string[];
  regions?: string[];
}

interface SyncResult {
  success: boolean;
  message: string;
  stats: {
    discovered: number;
    created: number;
    updated: number;
    skipped: number;
    errors: number;
  };
  details?: Record<string, unknown>;
}

interface ShopifyProduct {
  id: number;
  title: string;
  handle: string;
  product_type: string;
  vendor: string;
  published_at: string;
  images: Array<{ src: string }>;
  variants: Array<{
    id: number;
    title: string;
    price: string;
    compare_at_price: string | null;
    sku: string;
    available: boolean;
  }>;
}

// Regional store configurations
const REGIONAL_STORES: Record<string, { domain: string; currency: string }> = {
  US: { domain: 'www.flashforge.com', currency: 'USD' },
  CA: { domain: 'ca.flashforge.com', currency: 'CAD' },
  UK: { domain: 'uk.flashforge.com', currency: 'GBP' },
  EU: { domain: 'eu.flashforge.com', currency: 'EUR' },
  AU: { domain: 'au.flashforge.com', currency: 'AUD' },
};

async function fetchShopifyProducts(domain: string, limit = 250): Promise<ShopifyProduct[]> {
  const allProducts: ShopifyProduct[] = [];
  let page = 1;
  const maxPages = 10;
  
  while (page <= maxPages) {
    const url = `https://${domain}/products.json?limit=${limit}&page=${page}`;
    console.log(`Fetching: ${url}`);
    
    const response = await fetch(url, {
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'FilaScope/1.0',
      },
    });
    
    if (!response.ok) {
      console.error(`Failed to fetch page ${page}: ${response.status}`);
      break;
    }
    
    const data = await response.json();
    const products = data.products || [];
    
    if (products.length === 0) break;
    
    allProducts.push(...products);
    
    if (products.length < limit) break;
    page++;
    
    // Rate limiting
    await new Promise(resolve => setTimeout(resolve, 500));
  }
  
  return allProducts;
}

function extractColorFromVariant(variantTitle: string): string {
  // Variant titles are usually just the color name
  // e.g., "Black", "White", "Crystal Clear"
  return variantTitle.trim();
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const options: SyncOptions = await req.json().catch(() => ({}));
    const { 
      dryRun = false, 
      limit = 500, 
      tasks = ['sync', 'enrich', 'fix-hex', 'regional'],
      regions = ['CA', 'UK', 'EU', 'AU'],
    } = options;

    console.log(`Starting Flashforge sync - dryRun: ${dryRun}, limit: ${limit}, tasks: ${tasks.join(',')}`);

    const stats = {
      discovered: 0,
      created: 0,
      updated: 0,
      skipped: 0,
      errors: 0,
    };
    const details: Record<string, unknown> = {};

    // ========================================================================
    // STEP 1: Base Sync via Shopify JSON API
    // ========================================================================
    if (tasks.includes('sync')) {
      console.log('=== Step 1: Base Sync via Shopify API ===');
      
      const products = await fetchShopifyProducts('www.flashforge.com', 250);
      console.log(`Fetched ${products.length} products from Shopify`);
      
      // Filter to filaments only
      const filamentProducts = products.filter(p => 
        isFilamentProduct(p.title, p.product_type)
      );
      console.log(`Filtered to ${filamentProducts.length} filament products`);
      
      stats.discovered = filamentProducts.length;
      const filterStats = createFilterStats();
      
      // Process each product's variants
      for (const product of filamentProducts.slice(0, limit)) {
        for (const variant of product.variants) {
          try {
            const colorName = extractColorFromVariant(variant.title);
            
            // Extract weight and diameter for filtering
            const weight = extractWeightFromText(product.title) || 1000;
            const is285 = is285mmDiameter(product.title);
            
            // Apply standard filtering (samples, bulk, 2.85mm, excluded keywords)
            const filterResult = shouldIncludeVariant(weight, is285 ? 2.85 : 1.75, product.title);
            updateFilterStats(filterStats, filterResult);
            if (!filterResult.include) {
              console.log(`[Flashforge] Skipping: ${product.title} - ${colorName} (${filterResult.reason})`);
              continue;
            }
            
            const enrichment = enrichFlashforgeProduct(product.title, colorName);
            
            // Generate unique product_id for this variant
            const productId = `flashforge-${product.id}-${variant.id}`;
            
            // Get featured image
            const featuredImage = product.images?.[0]?.src || null;
            
            // Build filament record
            const filamentData = {
              product_id: productId,
              product_title: `${cleanFlashforgeTitle(product.title)} - ${colorName}`,
              vendor: 'Flashforge',
              product_url: `https://www.flashforge.com/products/${product.handle}`,
              product_handle: product.handle,
              variant_price: parseFloat(variant.price) || null,
              variant_compare_at_price: variant.compare_at_price ? parseFloat(variant.compare_at_price) : null,
              variant_available: variant.available,
              variant_sku: variant.sku || null,
              featured_image: featuredImage,
              material: enrichment.material,
              finish_type: enrichment.finish_type !== 'Standard' ? enrichment.finish_type : null,
              product_line_id: enrichment.product_line_id,
              high_speed_capable: enrichment.high_speed_capable || null,
              color_hex: enrichment.color_hex,
              nozzle_temp_min_c: enrichment.print_settings?.nozzle_temp_min_c || null,
              nozzle_temp_max_c: enrichment.print_settings?.nozzle_temp_max_c || null,
              bed_temp_min_c: enrichment.print_settings?.bed_temp_min_c || null,
              bed_temp_max_c: enrichment.print_settings?.bed_temp_max_c || null,
              print_speed_max_mms: enrichment.print_settings?.print_speed_max_mms || null,
              diameter_nominal_mm: 1.75,
              net_weight_g: 1000,
              auto_created: true,
              auto_updated: true,
              last_scraped_at: new Date().toISOString(),
              sync_status: 'synced',
            };
            
            if (dryRun) {
              console.log(`[DRY RUN] Would upsert: ${filamentData.product_title}`);
              stats.created++;
              continue;
            }
            
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
                .update({
                  ...filamentData,
                  updated_at: new Date().toISOString(),
                })
                .eq('id', existing.id);
              
              if (error) {
                console.error(`Error updating ${productId}:`, error.message);
                stats.errors++;
              } else {
                stats.updated++;
              }
            } else {
              // Insert
              const { error } = await supabase
                .from('filaments')
                .insert(filamentData);
              
              if (error) {
                console.error(`Error inserting ${productId}:`, error.message);
                stats.errors++;
              } else {
                stats.created++;
              }
            }
          } catch (err) {
            console.error(`Error processing variant ${variant.id}:`, err);
            stats.errors++;
          }
        }
      }
      
      logFilterStats('Flashforge', filterStats);
      
      details.step1 = { 
        productsFound: products.length,
        filamentsFiltered: filamentProducts.length,
        variantsProcessed: stats.created + stats.updated + stats.errors,
      };
    }

    // ========================================================================
    // STEP 2: Firecrawl Product Detail Scraping (Optional - for temps/specs)
    // ========================================================================
    if (tasks.includes('scrape-details')) {
      console.log('=== Step 2: Firecrawl Product Detail Scraping ===');
      
      const firecrawlKey = Deno.env.get('FIRECRAWL_API_KEY');
      if (!firecrawlKey) {
        console.log('FIRECRAWL_API_KEY not set, skipping detail scraping');
        details.step2 = { skipped: true, reason: 'No API key' };
      } else {
        // Get filaments missing temperature data
        const { data: filaments } = await supabase
          .from('filaments')
          .select('id, product_url, product_handle')
          .ilike('vendor', 'flashforge')
          .is('nozzle_temp_min_c', null)
          .not('product_url', 'is', null)
          .limit(20);
        
        let scraped = 0;
        const uniqueUrls = [...new Set(filaments?.map(f => f.product_url) || [])];
        
        for (const url of uniqueUrls) {
          try {
            console.log(`Scraping details from: ${url}`);
            
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
              console.error(`Firecrawl error for ${url}: ${response.status}`);
              continue;
            }
            
            const result = await response.json();
            const markdown = result.data?.markdown || '';
            
            // Extract temperatures from markdown
            const nozzleMatch = markdown.match(/nozzle\s*(?:temp(?:erature)?)?[:\s]*(\d+)\s*[-–]\s*(\d+)\s*[°℃C]/i);
            const bedMatch = markdown.match(/(?:bed|plate)\s*(?:temp(?:erature)?)?[:\s]*(\d+)\s*[-–]\s*(\d+)\s*[°℃C]/i);
            
            if (nozzleMatch || bedMatch) {
              const updateData: Record<string, number> = {};
              if (nozzleMatch) {
                updateData.nozzle_temp_min_c = parseInt(nozzleMatch[1]);
                updateData.nozzle_temp_max_c = parseInt(nozzleMatch[2]);
              }
              if (bedMatch) {
                updateData.bed_temp_min_c = parseInt(bedMatch[1]);
                updateData.bed_temp_max_c = parseInt(bedMatch[2]);
              }
              
              if (!dryRun) {
                await supabase
                  .from('filaments')
                  .update(updateData)
                  .eq('product_url', url)
                  .ilike('vendor', 'flashforge');
              }
              
              scraped++;
            }
            
            // Rate limiting
            await new Promise(resolve => setTimeout(resolve, 1500));
          } catch (err) {
            console.error(`Error scraping ${url}:`, err);
          }
        }
        
        details.step2 = { urlsScraped: uniqueUrls.length, updatedWithTemps: scraped };
      }
    }

    // ========================================================================
    // STEP 3: Brand-Specific Enrichments
    // ========================================================================
    if (tasks.includes('enrich')) {
      console.log('=== Step 3: Brand-Specific Enrichments ===');
      
      // Get filaments missing enrichment data
      const { data: filaments } = await supabase
        .from('filaments')
        .select('id, product_title, material, finish_type, product_line_id, color_hex')
        .ilike('vendor', 'flashforge')
        .or('product_line_id.is.null,finish_type.is.null,material.is.null')
        .limit(limit);
      
      let enriched = 0;
      
      for (const filament of filaments || []) {
        const enrichment = enrichFlashforgeProduct(
          filament.product_title,
          null,
          filament.material
        );
        
        const updates: Record<string, unknown> = {};
        
        if (!filament.material && enrichment.material) {
          updates.material = enrichment.material;
        }
        if (!filament.finish_type && enrichment.finish_type !== 'Standard') {
          updates.finish_type = enrichment.finish_type;
        }
        if (!filament.product_line_id && enrichment.product_line_id) {
          updates.product_line_id = enrichment.product_line_id;
        }
        if (!filament.color_hex && enrichment.color_hex) {
          updates.color_hex = enrichment.color_hex;
        }
        if (enrichment.print_settings) {
          if (!updates.nozzle_temp_min_c) updates.nozzle_temp_min_c = enrichment.print_settings.nozzle_temp_min_c;
          if (!updates.nozzle_temp_max_c) updates.nozzle_temp_max_c = enrichment.print_settings.nozzle_temp_max_c;
          if (!updates.bed_temp_min_c) updates.bed_temp_min_c = enrichment.print_settings.bed_temp_min_c;
          if (!updates.bed_temp_max_c) updates.bed_temp_max_c = enrichment.print_settings.bed_temp_max_c;
        }
        
        if (Object.keys(updates).length > 0) {
          if (!dryRun) {
            await supabase
              .from('filaments')
              .update(updates)
              .eq('id', filament.id);
          }
          enriched++;
        }
      }
      
      details.step3 = { filamentsChecked: filaments?.length || 0, enriched };
    }

    // ========================================================================
    // STEP 4: Duplicate Hex Fix
    // ========================================================================
    if (tasks.includes('fix-hex')) {
      console.log('=== Step 4: Duplicate Hex Fix ===');
      
      const { data: duplicates } = await supabase
        .rpc('find_duplicate_hexes', { p_vendor: 'Flashforge' });
      
      details.step4 = { 
        duplicatesFound: duplicates?.length || 0,
        message: duplicates?.length ? 'Review duplicates manually' : 'No duplicates found',
      };
    }

    // ========================================================================
    // STEP 5: Regional Price Sync
    // ========================================================================
    if (tasks.includes('regional')) {
      console.log('=== Step 5: Regional Price Sync ===');
      
      const regionalStats: Record<string, { products: number; matched: number }> = {};
      
      for (const region of regions) {
        const storeConfig = REGIONAL_STORES[region];
        if (!storeConfig) {
          console.log(`Unknown region: ${region}`);
          continue;
        }
        
        console.log(`Fetching ${region} prices from ${storeConfig.domain}`);
        
        try {
          const products = await fetchShopifyProducts(storeConfig.domain, 250);
          const filamentProducts = products.filter(p => isFilamentProduct(p.title, p.product_type));
          
          regionalStats[region] = { products: filamentProducts.length, matched: 0 };
          
          for (const product of filamentProducts) {
            // Match by handle to US products
            const { data: matches } = await supabase
              .from('filaments')
              .select('id')
              .ilike('vendor', 'flashforge')
              .eq('product_handle', product.handle);
            
            if (matches && matches.length > 0) {
              // Get the first variant price as the regional price
              const price = parseFloat(product.variants[0]?.price || '0');
              
              // Update regional price/URL for matched filaments
              const priceField = `price_${storeConfig.currency.toLowerCase()}` as const;
              const urlField = `product_url_${region.toLowerCase()}` as const;
              
              if (!dryRun && price > 0) {
                // Update all matching filaments (same handle = same product, different colors)
                for (const match of matches) {
                  await supabase
                    .from('filaments')
                    .update({
                      [priceField]: price,
                      [urlField]: `https://${storeConfig.domain}/products/${product.handle}`,
                      regional_prices_updated_at: new Date().toISOString(),
                    })
                    .eq('id', match.id);
                }
                
                regionalStats[region].matched += matches.length;
              }
            }
          }
          
          // Rate limiting between regions
          await new Promise(resolve => setTimeout(resolve, 1000));
        } catch (err) {
          console.error(`Error fetching ${region} prices:`, err);
          regionalStats[region] = { products: 0, matched: 0 };
        }
      }
      
      details.step5 = { regions: regionalStats };
    }

    // Create sync log
    if (!dryRun) {
      await supabase.from('brand_sync_logs').insert({
        brand_slug: 'flashforge',
        sync_type: 'full_sync',
        status: stats.errors > 0 ? 'completed_with_errors' : 'completed',
        triggered_by: 'manual',
        products_discovered: stats.discovered,
        products_created: stats.created,
        products_updated: stats.updated,
        products_failed: stats.errors,
        success_details: details,
      });
    }

    const result: SyncResult = {
      success: stats.errors === 0,
      message: `Flashforge sync completed. Created: ${stats.created}, Updated: ${stats.updated}, Errors: ${stats.errors}`,
      stats,
      details,
    };

    console.log('Sync complete:', result);

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Sync error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    
    return new Response(
      JSON.stringify({ 
        success: false, 
        message: errorMessage,
        stats: { discovered: 0, created: 0, updated: 0, skipped: 0, errors: 1 },
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
