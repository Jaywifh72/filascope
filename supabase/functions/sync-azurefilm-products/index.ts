/**
 * AZUREFILM SYNC FUNCTION
 * 
 * 5-step architecture matching Atomic Filament:
 * Step 0: Create sync log entry
 * Step 1: Discover products from category pages
 * Step 2: Scrape each product page for H1 title and details
 * Step 3: Safety validation (minimum product threshold)
 * Step 4: Clean slate deletion
 * Step 5: Insert products with enrichment
 * 
 * Categories synced (whitelist):
 * - ABS, ASA, Carbon Fiber, PCTG, PETG, PLA, LumberLay, Support
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { 
  AZUREFILM_CATEGORY_WHITELIST, 
  AZUREFILM_SAFE_DELETE_THRESHOLD,
  AZUREFILM_STORE_INFO,
  enrichAzureFilmProduct,
  extractColorFromAzureFilmTitle,
  getAzureFilmColorHex,
  isAzureFilmNonFilament,
} from '../_shared/azurefilm-defaults.ts';
import { 
  shouldIncludeVariant, 
  is285mmDiameter,
  extractWeightFromText,
  createFilterStats,
  updateFilterStats,
  logFilterStats,
} from '../_shared/variant-filters.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// EUR to USD exchange rate
const EUR_TO_USD_RATE = 1.08;

interface DiscoveredProduct {
  url: string;
  category: string;
  material: string;
}

interface ScrapedProduct {
  url: string;
  h1Title: string;
  price: number | null;
  priceEur: number | null;
  imageUrl: string | null;
  category: string;
  material: string;
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
  categoriesProcessed: number;
  productsByCategory: Record<string, number>;
  duration: string;
  duration_ms: number;
}

// ============================================================================
// STEP 1: DISCOVER PRODUCTS FROM CATEGORY PAGES
// ============================================================================

async function discoverProductsFromCategories(firecrawlKey: string): Promise<DiscoveredProduct[]> {
  const allProducts: DiscoveredProduct[] = [];
  const seenUrls = new Set<string>();
  
  console.log(`[AzureFilm] Discovering products from ${AZUREFILM_CATEGORY_WHITELIST.length} categories...`);
  
  // Process categories in batches of 3 for parallel efficiency
  const batchSize = 3;
  for (let i = 0; i < AZUREFILM_CATEGORY_WHITELIST.length; i += batchSize) {
    const batch = AZUREFILM_CATEGORY_WHITELIST.slice(i, i + batchSize);
    
    const batchResults = await Promise.all(
      batch.map(async (category) => {
        try {
          console.log(`[AzureFilm] Scraping category: ${category.material}`);
          
          const response = await fetch('https://api.firecrawl.dev/v1/scrape', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${firecrawlKey}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              url: category.categoryUrl,
              formats: ['html', 'links'],
              onlyMainContent: false,
              waitFor: 3000,
            }),
          });
          
          if (!response.ok) {
            console.error(`[AzureFilm] Failed to scrape ${category.material}: ${response.status}`);
            return [];
          }
          
          const data = await response.json();
          const links = data.data?.links || [];
          
          // Filter for product links
          const productLinks = links.filter((link: string) => 
            link.includes('/product/') && 
            !link.includes('/product-category/') &&
            link.startsWith('https://azurefilm.com')
          );
          
          console.log(`[AzureFilm] Found ${productLinks.length} products in ${category.material}`);
          
          return productLinks.map((url: string) => ({
            url,
            category: category.displayMaterial,
            material: category.material,
          }));
        } catch (error) {
          console.error(`[AzureFilm] Error scraping ${category.material}:`, error);
          return [];
        }
      })
    );
    
    // Flatten and deduplicate
    for (const results of batchResults) {
      for (const product of results) {
        if (!seenUrls.has(product.url)) {
          seenUrls.add(product.url);
          allProducts.push(product);
        }
      }
    }
    
    // Small delay between batches to respect rate limits
    if (i + batchSize < AZUREFILM_CATEGORY_WHITELIST.length) {
      await new Promise(resolve => setTimeout(resolve, 500));
    }
  }
  
  console.log(`[AzureFilm] Total unique products discovered: ${allProducts.length}`);
  return allProducts;
}

// ============================================================================
// STEP 2: SCRAPE PRODUCT PAGES
// ============================================================================

async function scrapeProductPages(
  products: DiscoveredProduct[], 
  firecrawlKey: string
): Promise<ScrapedProduct[]> {
  const scrapedProducts: ScrapedProduct[] = [];
  const batchSize = 5; // Parallel batch size
  
  console.log(`[AzureFilm] Scraping ${products.length} product pages...`);
  
  for (let i = 0; i < products.length; i += batchSize) {
    const batch = products.slice(i, i + batchSize);
    
    const batchResults = await Promise.all(
      batch.map(async (product) => {
        try {
          const response = await fetch('https://api.firecrawl.dev/v1/scrape', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${firecrawlKey}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              url: product.url,
              formats: ['html'],
              onlyMainContent: false,
              waitFor: 2000,
            }),
          });
          
          if (!response.ok) {
            console.error(`[AzureFilm] Failed to scrape ${product.url}: ${response.status}`);
            return null;
          }
          
          const data = await response.json();
          const html = data.data?.html || '';
          
          // Extract H1 title
          const h1Match = html.match(/<h1[^>]*class="[^"]*product_title[^"]*"[^>]*>([^<]+)<\/h1>/i) ||
                          html.match(/<h1[^>]*>([^<]+)<\/h1>/i);
          const h1Title = h1Match?.[1]?.trim() || '';
          
          if (!h1Title) {
            console.warn(`[AzureFilm] No H1 found for ${product.url}`);
            return null;
          }
          
          // Extract price (WooCommerce pattern)
          // Pattern 1: <span class="woocommerce-Price-amount">€17.50</span>
          // Pattern 2: data-price="17.50"
          let priceEur: number | null = null;
          
          // Try JSON-LD first
          const jsonLdMatch = html.match(/<script[^>]*type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/gi);
          if (jsonLdMatch) {
            for (const match of jsonLdMatch) {
              try {
                const jsonContent = match.replace(/<script[^>]*>|<\/script>/gi, '');
                const jsonData = JSON.parse(jsonContent);
                if (jsonData.offers?.price) {
                  priceEur = parseFloat(jsonData.offers.price);
                  break;
                }
                if (jsonData['@graph']) {
                  for (const item of jsonData['@graph']) {
                    if (item.offers?.price) {
                      priceEur = parseFloat(item.offers.price);
                      break;
                    }
                  }
                }
              } catch {
                // Continue to next pattern
              }
            }
          }
          
          // Fallback: WooCommerce price pattern
          if (!priceEur) {
            const priceMatch = html.match(/class="woocommerce-Price-amount[^"]*"[^>]*>.*?([0-9]+[.,][0-9]{2})/i);
            if (priceMatch) {
              priceEur = parseFloat(priceMatch[1].replace(',', '.'));
            }
          }
          
          // Extract featured image
          let imageUrl: string | null = null;
          const imageMatch = html.match(/class="[^"]*woocommerce-product-gallery__image[^"]*"[^>]*>[\s\S]*?<img[^>]*src="([^"]+)"/i) ||
                             html.match(/<meta[^>]*property="og:image"[^>]*content="([^"]+)"/i) ||
                             html.match(/class="[^"]*product[^"]*image[^"]*"[^>]*>[\s\S]*?<img[^>]*src="([^"]+)"/i);
          if (imageMatch) {
            imageUrl = imageMatch[1];
          }
          
          return {
            url: product.url,
            h1Title,
            price: null, // No USD store — EUR only
            priceEur,
            imageUrl,
            category: product.category,
            material: product.material,
          };
        } catch (error) {
          console.error(`[AzureFilm] Error scraping ${product.url}:`, error);
          return null;
        }
      })
    );
    
    // Filter out failures
    for (const result of batchResults) {
      if (result) {
        scrapedProducts.push(result);
      }
    }
    
    // Progress logging
    if ((i + batchSize) % 20 === 0 || i + batchSize >= products.length) {
      console.log(`[AzureFilm] Scraped ${Math.min(i + batchSize, products.length)}/${products.length} products`);
    }
    
    // Small delay between batches
    if (i + batchSize < products.length) {
      await new Promise(resolve => setTimeout(resolve, 300));
    }
  }
  
  console.log(`[AzureFilm] Successfully scraped ${scrapedProducts.length} products`);
  return scrapedProducts;
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
    const firecrawlKey = Deno.env.get('FIRECRAWL_API_KEY');
    
    if (!firecrawlKey) {
      throw new Error('FIRECRAWL_API_KEY not configured');
    }
    
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    // Parse request body
    const body = await req.json().catch(() => ({}));
    const cleanSlate = body.cleanSlate === true;
    
    console.log(`[AzureFilm] Starting sync (cleanSlate: ${cleanSlate})`);
    
    // ========================================================================
    // STEP 0: Create sync log entry
    // ========================================================================
    const { data: syncLog, error: syncLogError } = await supabase
      .from('brand_sync_logs')
      .insert({
        brand_slug: 'azurefilm',
        sync_type: cleanSlate ? 'clean_slate' : 'incremental',
        status: 'running',
        started_at: new Date().toISOString(),
        triggered_by: 'manual',
      })
      .select('id')
      .single();
    
    if (syncLogError) {
      console.error('[AzureFilm] Failed to create sync log:', syncLogError);
    }
    const syncLogId = syncLog?.id;
    
    // ========================================================================
    // STEP 1: Discover products from category pages
    // ========================================================================
    const discoveredProducts = await discoverProductsFromCategories(firecrawlKey);
    
    if (discoveredProducts.length === 0) {
      throw new Error('No products discovered from category pages');
    }
    
    // ========================================================================
    // STEP 2: Scrape product pages for H1 titles and details
    // ========================================================================
    const scrapedProducts = await scrapeProductPages(discoveredProducts, firecrawlKey);
    
    // ========================================================================
    // STEP 3: Safety validation
    // ========================================================================
    if (scrapedProducts.length < AZUREFILM_SAFE_DELETE_THRESHOLD) {
      throw new Error(
        `Safety check failed: Only ${scrapedProducts.length} products scraped, ` +
        `minimum ${AZUREFILM_SAFE_DELETE_THRESHOLD} required for clean slate sync`
      );
    }
    
    console.log(`[AzureFilm] Safety check passed: ${scrapedProducts.length} products (threshold: ${AZUREFILM_SAFE_DELETE_THRESHOLD})`);
    
    // ========================================================================
    // STEP 4: Clean slate deletion (if enabled)
    // ========================================================================
    if (cleanSlate) {
      console.log('[AzureFilm] Performing clean slate deletion...');
      
      const { error: deleteError, count: deleteCount } = await supabase
        .from('filaments')
        .delete()
        .ilike('vendor', 'azurefilm');
      
      if (deleteError) {
        console.error('[AzureFilm] Delete error:', deleteError);
        throw new Error(`Failed to delete existing products: ${deleteError.message}`);
      }
      
      console.log(`[AzureFilm] Deleted ${deleteCount || 0} existing products`);
    }
    
    // ========================================================================
    // STEP 5: Insert products with enrichment
    // ========================================================================
    const filterStats = createFilterStats();
    const productsToInsert: any[] = [];
    const productsByCategory: Record<string, number> = {};
    let skipped = 0;
    let errors = 0;
    
    for (const product of scrapedProducts) {
      try {
        // FIRST: Check for non-filament (before any other processing)
        if (isAzureFilmNonFilament(product.h1Title)) {
          console.log(`[AzureFilm] Skipping non-filament: ${product.h1Title}`);
          skipped++;
          continue;
        }
        
        // Check for 2.85mm diameter
        if (is285mmDiameter(product.h1Title)) {
          console.log(`[AzureFilm] Skipping 2.85mm product: ${product.h1Title}`);
          skipped++;
          continue;
        }
        
        // Extract weight with improved detection
        // - Detects pack counts (10-pack = 10000g)
        // - Detects "Sample" keyword (defaults to 50g)
        // - Falls back to explicit weight patterns
        let weightGrams = extractWeightFromText(product.h1Title);
        
        // If no weight found and "Sample" in title, assume sample weight
        if (!weightGrams && /\bsample\b/i.test(product.h1Title)) {
          weightGrams = 50;
          console.log(`[AzureFilm] Detected sample product (50g): ${product.h1Title}`);
        }
        
        // Check for pack count (N-pack = N x 1kg)
        if (!weightGrams) {
          const packMatch = product.h1Title.match(/(\d+)[\s-]*pack/i);
          if (packMatch) {
            weightGrams = parseInt(packMatch[1], 10) * 1000;
            console.log(`[AzureFilm] Detected ${packMatch[1]}-pack (${weightGrams}g): ${product.h1Title}`);
          }
        }
        
        // Default to 1kg only for non-sample, non-pack products
        if (!weightGrams) {
          weightGrams = 1000;
        }
        
        const filterResult = shouldIncludeVariant(weightGrams, 1.75, product.h1Title);
        updateFilterStats(filterStats, filterResult);
        
        if (!filterResult.include) {
          console.log(`[AzureFilm] Filtering out: ${product.h1Title} (${filterResult.reason})`);
          skipped++;
          continue;
        }
        
        // Enrich product
        const colorName = extractColorFromAzureFilmTitle(product.h1Title);
        const enrichment = enrichAzureFilmProduct(product.h1Title, colorName);
        
        if (enrichment.isNonFilament) {
          skipped++;
          continue;
        }
        
        // Get color hex
        const colorHex = colorName ? getAzureFilmColorHex(colorName) : null;
        
        // Build product record (id auto-generated by database as UUID)
        const productRecord = {
          product_title: product.h1Title,
          vendor: AZUREFILM_STORE_INFO.vendor,
          material: enrichment.material,
          finish_type: enrichment.finishType,
          product_line_id: enrichment.productLineId,
          color_family: colorName,
          color_hex: colorHex,
          price_eur: product.priceEur,
          featured_image: product.imageUrl,
          product_url_eu: product.url,
          net_weight_g: weightGrams,
          diameter_nominal_mm: 1.75,
          nozzle_temp_min_c: enrichment.nozzleTempMin,
          nozzle_temp_max_c: enrichment.nozzleTempMax,
          bed_temp_min_c: enrichment.bedTempMin,
          bed_temp_max_c: enrichment.bedTempMax,
          tds_url: enrichment.tdsUrl,
          is_nozzle_abrasive: enrichment.isAbrasive,
          high_speed_capable: enrichment.highSpeedCapable,
          auto_created: true,
          auto_updated: true,
          last_scraped_at: new Date().toISOString(),
        };
        
        productsToInsert.push(productRecord);
        
        // Track by category
        productsByCategory[product.category] = (productsByCategory[product.category] || 0) + 1;
        
      } catch (error) {
        console.error(`[AzureFilm] Error processing ${product.url}:`, error);
        errors++;
      }
    }
    
    logFilterStats('AzureFilm', filterStats);
    
    // Batch insert
    console.log(`[AzureFilm] Inserting ${productsToInsert.length} products...`);
    
    let created = 0;
    const insertBatchSize = 50;
    
    for (let i = 0; i < productsToInsert.length; i += insertBatchSize) {
      const batch = productsToInsert.slice(i, i + insertBatchSize);
      
      const { error: insertError, count } = await supabase
        .from('filaments')
        .upsert(batch, { 
          onConflict: 'id',
          ignoreDuplicates: false,
        });
      
      if (insertError) {
        console.error(`[AzureFilm] Insert batch error:`, insertError);
        errors += batch.length;
      } else {
        created += batch.length;
      }
    }
    
    console.log(`[AzureFilm] Inserted ${created} products`);
    
    // ========================================================================
    // Update sync log
    // ========================================================================
    const duration = ((Date.now() - startTime) / 1000).toFixed(1);
    
    if (syncLogId) {
      await supabase
        .from('brand_sync_logs')
        .update({
          status: 'completed',
          completed_at: new Date().toISOString(),
          duration_seconds: parseFloat(duration),
          products_discovered: discoveredProducts.length,
          products_created: created,
          products_updated: 0,
          notes: `Categories: ${AZUREFILM_CATEGORY_WHITELIST.map(c => c.material).join(', ')}`,
        })
        .eq('id', syncLogId);
    }
    
    // ========================================================================
    // Return result
    // ========================================================================
    const result: SyncResult = {
      success: true,
      summary: {
        totalDiscovered: discoveredProducts.length,
        created,
        updated: 0,
        skipped,
        errors,
      },
      categoriesProcessed: AZUREFILM_CATEGORY_WHITELIST.length,
      productsByCategory,
      duration: `${duration}s`,
      duration_ms: Date.now() - startTime,
    };
    
    console.log(`[AzureFilm] Sync completed in ${duration}s`);
    console.log(`[AzureFilm] Summary:`, JSON.stringify(result.summary));
    
    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
    
  } catch (error) {
    const duration = ((Date.now() - startTime) / 1000).toFixed(1);
    console.error('[AzureFilm] Sync failed:', error);
    
    return new Response(JSON.stringify({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      duration: `${duration}s`,
      duration_ms: Date.now() - startTime,
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
