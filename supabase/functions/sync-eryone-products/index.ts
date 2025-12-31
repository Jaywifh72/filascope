import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import {
  shouldIncludeVariant,
  createFilterStats,
  updateFilterStats,
  logFilterStats,
} from '../_shared/variant-filters.ts';
import {
  enrichEryoneProduct,
  getEryoneColorHex,
  normalizeEryoneMaterial,
  isPromotionalProduct,
  isMultiPack,
  getPackQuantity,
} from '../_shared/eryone-defaults.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface SyncOptions {
  dryRun?: boolean;
  limit?: number;
  skipScrape?: boolean;
  tasksToRun?: string[];
}

interface SyncResult {
  success: boolean;
  message: string;
  stats: {
    productsDiscovered: number;
    productsCreated: number;
    productsUpdated: number;
    productsFailed: number;
    enrichmentsApplied: number;
    duplicateHexesFixed: number;
  };
  errors: string[];
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  const firecrawlKey = Deno.env.get('FIRECRAWL_API_KEY');
  const supabase = createClient(supabaseUrl, supabaseKey);

  const options: SyncOptions = await req.json().catch(() => ({}));
  const { dryRun = false, limit, skipScrape = false, tasksToRun = ['sync', 'scrape', 'enrich', 'fixHex'] } = options;

  const result: SyncResult = {
    success: true,
    message: '',
    stats: {
      productsDiscovered: 0,
      productsCreated: 0,
      productsUpdated: 0,
      productsFailed: 0,
      enrichmentsApplied: 0,
      duplicateHexesFixed: 0,
    },
    errors: [],
  };

  try {
    console.log('[Eryone Sync] Starting sync with options:', { dryRun, limit, skipScrape, tasksToRun });

    // =========================================================================
    // STEP 1: BASE SYNC - Fetch from Shopify JSON API
    // =========================================================================
    if (tasksToRun.includes('sync')) {
      console.log('[Step 1] Fetching products from Eryone Shopify store...');
      
      const shopifyUrl = 'https://eryone3d.com/products.json?limit=250';
      const response = await fetch(shopifyUrl);
      
      if (!response.ok) {
        throw new Error(`Shopify API error: ${response.status}`);
      }
      
      const data = await response.json();
      const products = data.products || [];
      
      console.log(`[Step 1] Found ${products.length} products from Shopify`);
      
      // Filter to filament products only
      const filamentProducts = products.filter((p: any) => {
        const title = (p.title || '').toLowerCase();
        const productType = (p.product_type || '').toLowerCase();
        const tags = (p.tags || '').toLowerCase();
        
        // Include filament products
        const isFilament = title.includes('filament') || 
                          productType.includes('filament') ||
                          tags.includes('filament') ||
                          /\b(pla|petg|abs|asa|tpu|pa|pp)\b/i.test(title);
        
        // Exclude non-filament products
        const isExcluded = title.includes('printer') || 
                          title.includes('nozzle') ||
                          title.includes('dryer') ||
                          title.includes('accessory') ||
                          productType.includes('printer');
        
        return isFilament && !isExcluded;
      });
      
      console.log(`[Step 1] Filtered to ${filamentProducts.length} filament products`);
      result.stats.productsDiscovered = filamentProducts.length;
      
      // Process each product with variant explosion
      const productsToProcess = limit ? filamentProducts.slice(0, limit) : filamentProducts;
      const filterStats = createFilterStats();
      
      for (const product of productsToProcess) {
        try {
          const variants = product.variants || [];
          const images = product.images || [];
          const baseImage = images[0]?.src || null;
          
          for (const variant of variants) {
            const variantTitle = variant.title || 'Default';
            const fullTitle = variantTitle !== 'Default Title' && variantTitle !== 'Default'
              ? `${product.title} - ${variantTitle}`
              : product.title;
            
            // Extract color from variant title
            const colorName = variantTitle !== 'Default Title' && variantTitle !== 'Default'
              ? variantTitle
              : extractColorFromTitle(product.title);
            
            // Extract weight (default 1kg = 1000g)
            let weight = 1000;
            const weightMatch = fullTitle.match(/(\d+(?:\.\d+)?)\s*kg/i);
            if (weightMatch) {
              weight = parseFloat(weightMatch[1]) * 1000;
            }
            const gMatch = fullTitle.match(/(\d+)\s*g(?!ram)/i);
            if (gMatch && !fullTitle.match(/\d+\s*kg/i)) {
              weight = parseInt(gMatch[1]);
            }
            
            // Check for 2.85mm diameter
            const is285 = fullTitle.includes('2.85') || fullTitle.includes('3mm');
            
            // Apply standard filtering (samples, bulk, 2.85mm)
            const filterResult = shouldIncludeVariant(weight, is285 ? 2.85 : 1.75);
            updateFilterStats(filterStats, filterResult);
            if (!filterResult.include) {
              console.log(`[Eryone] Skipping: ${fullTitle} (${filterResult.reason})`);
              continue;
            }
            
            // Find variant-specific image
            const variantImage = images.find((img: any) => 
              img.variant_ids?.includes(variant.id)
            )?.src || baseImage;
            
            // Create unique product ID
            const productId = `eryone-${product.id}-${variant.id}`;
            
            // Enrich product data
            const enrichment = enrichEryoneProduct(fullTitle);
            const colorHex = getEryoneColorHex(colorName);
            
            const filamentData = {
              product_id: productId,
              product_title: fullTitle,
              vendor: 'Eryone',
              product_url: `https://eryone3d.com/products/${product.handle}?variant=${variant.id}`,
              product_handle: product.handle,
              featured_image: variantImage,
              variant_price: parseFloat(variant.price) || null,
              variant_compare_at_price: variant.compare_at_price ? parseFloat(variant.compare_at_price) : null,
              variant_available: variant.available ?? true,
              variant_sku: variant.sku || null,
              material: enrichment.material,
              finish_type: enrichment.finishType !== 'Standard' ? enrichment.finishType : null,
              color_hex: colorHex,
              nozzle_temp_min_c: enrichment.nozzleTempMin,
              nozzle_temp_max_c: enrichment.nozzleTempMax,
              bed_temp_min_c: enrichment.bedTempMin,
              bed_temp_max_c: enrichment.bedTempMax,
              print_speed_max_mms: enrichment.printSpeedMax,
              is_nozzle_abrasive: enrichment.isAbrasive || null,
              product_line_id: enrichment.productLineId,
              tds_url: enrichment.tdsUrl,
              high_speed_capable: enrichment.isHighSpeed || null,
              pack_quantity: enrichment.packQuantity > 1 ? enrichment.packQuantity : null,
              diameter_nominal_mm: 1.75,
              auto_created: true,
              auto_updated: true,
              last_scraped_at: new Date().toISOString(),
              sync_status: 'synced',
            };
            
            if (dryRun) {
              console.log('[DRY RUN] Would upsert:', filamentData.product_id, filamentData.product_title);
              result.stats.productsCreated++;
            } else {
              // Check if exists
              const { data: existing } = await supabase
                .from('filaments')
                .select('id')
                .eq('product_id', productId)
                .maybeSingle();
              
              if (existing) {
                const { error } = await supabase
                  .from('filaments')
                  .update(filamentData)
                  .eq('id', existing.id);
                
                if (error) {
                  console.error(`[Step 1] Update error for ${productId}:`, error.message);
                  result.errors.push(`Update failed: ${productId} - ${error.message}`);
                  result.stats.productsFailed++;
                } else {
                  result.stats.productsUpdated++;
                }
              } else {
                const { error } = await supabase
                  .from('filaments')
                  .insert(filamentData);
                
                if (error) {
                  console.error(`[Step 1] Insert error for ${productId}:`, error.message);
                  result.errors.push(`Insert failed: ${productId} - ${error.message}`);
                  result.stats.productsFailed++;
                } else {
                  result.stats.productsCreated++;
                }
              }
            }
          }
        } catch (err) {
          const errorMsg = err instanceof Error ? err.message : String(err);
          console.error(`[Step 1] Error processing product ${product.id}:`, errorMsg);
          result.errors.push(`Product ${product.id}: ${errorMsg}`);
          result.stats.productsFailed++;
        }
      }
      
      logFilterStats('Eryone', filterStats);
      console.log(`[Step 1] Complete - Created: ${result.stats.productsCreated}, Updated: ${result.stats.productsUpdated}, Failed: ${result.stats.productsFailed}`);
    }

    // =========================================================================
    // STEP 2: FIRECRAWL DETAIL SCRAPING (Optional)
    // =========================================================================
    if (tasksToRun.includes('scrape') && !skipScrape && firecrawlKey) {
      console.log('[Step 2] Scraping product details with Firecrawl...');
      
      // Get products missing detailed data
      const { data: productsToScrape } = await supabase
        .from('filaments')
        .select('id, product_url, product_title')
        .eq('vendor', 'Eryone')
        .is('tds_url', null)
        .limit(10); // Limit to prevent timeout
      
      if (productsToScrape && productsToScrape.length > 0) {
        // Get unique product URLs (base URL without variant)
        const uniqueUrls = [...new Set(productsToScrape.map(p => {
          const url = p.product_url || '';
          return url.split('?')[0]; // Remove variant parameter
        }))].filter(Boolean);
        
        console.log(`[Step 2] Scraping ${uniqueUrls.length} unique product pages...`);
        
        for (const url of uniqueUrls.slice(0, 5)) { // Limit to 5 pages
          try {
            const scrapeResponse = await fetch('https://api.firecrawl.dev/v1/scrape', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${firecrawlKey}`,
              },
              body: JSON.stringify({
                url,
                formats: ['html'],
                timeout: 30000,
              }),
            });
            
            if (scrapeResponse.ok) {
              const scrapeData = await scrapeResponse.json();
              const html = scrapeData.data?.html || '';
              
              // Extract specs from HTML
              const specs = extractSpecsFromHtml(html);
              
              if (specs) {
                // Update all variants of this product
                const baseUrl = url.split('?')[0];
                await supabase
                  .from('filaments')
                  .update({
                    nozzle_temp_min_c: specs.nozzleTempMin,
                    nozzle_temp_max_c: specs.nozzleTempMax,
                    bed_temp_min_c: specs.bedTempMin,
                    bed_temp_max_c: specs.bedTempMax,
                    density_g_cm3: specs.density,
                  })
                  .eq('vendor', 'Eryone')
                  .like('product_url', `${baseUrl}%`);
                
                console.log(`[Step 2] Updated specs for ${baseUrl}`);
              }
            }
            
            // Rate limiting
            await new Promise(resolve => setTimeout(resolve, 1500));
          } catch (err) {
            console.error(`[Step 2] Scrape error for ${url}:`, err);
          }
        }
      }
      
      console.log('[Step 2] Detail scraping complete');
    }

    // =========================================================================
    // STEP 3: BRAND-SPECIFIC ENRICHMENTS
    // =========================================================================
    if (tasksToRun.includes('enrich')) {
      console.log('[Step 3] Applying brand-specific enrichments...');
      
      // Get products needing enrichment
      const { data: productsToEnrich } = await supabase
        .from('filaments')
        .select('id, product_title, material, tds_url, product_line_id, finish_type')
        .eq('vendor', 'Eryone')
        .or('product_line_id.is.null,finish_type.is.null,material.is.null');
      
      if (productsToEnrich && productsToEnrich.length > 0) {
        console.log(`[Step 3] Enriching ${productsToEnrich.length} products...`);
        
        for (const product of productsToEnrich) {
          const enrichment = enrichEryoneProduct(
            product.product_title,
            product.material,
            product.tds_url
          );
          
          const updates: Record<string, any> = {};
          
          if (!product.product_line_id && enrichment.productLineId) {
            updates.product_line_id = enrichment.productLineId;
          }
          if (!product.finish_type && enrichment.finishType !== 'Standard') {
            updates.finish_type = enrichment.finishType;
          }
          if (!product.material && enrichment.material) {
            updates.material = enrichment.material;
          }
          if (!product.tds_url && enrichment.tdsUrl) {
            updates.tds_url = enrichment.tdsUrl;
          }
          
          if (Object.keys(updates).length > 0) {
            if (dryRun) {
              console.log('[DRY RUN] Would update:', product.id, updates);
            } else {
              await supabase
                .from('filaments')
                .update(updates)
                .eq('id', product.id);
            }
            result.stats.enrichmentsApplied++;
          }
        }
      }
      
      console.log(`[Step 3] Enrichments applied: ${result.stats.enrichmentsApplied}`);
    }

    // =========================================================================
    // STEP 4: DUPLICATE HEX FIX
    // =========================================================================
    if (tasksToRun.includes('fixHex')) {
      console.log('[Step 4] Checking for duplicate hex codes...');
      
      const { data: duplicates } = await supabase
        .rpc('find_duplicate_hexes', { p_vendor: 'Eryone' });
      
      if (duplicates && duplicates.length > 0) {
        console.log(`[Step 4] Found ${duplicates.length} products with duplicate hex codes`);
        
        // Group by product_line_id
        const grouped: Record<string, typeof duplicates> = {};
        for (const dup of duplicates) {
          const key = dup.product_line_id;
          if (!grouped[key]) grouped[key] = [];
          grouped[key].push(dup);
        }
        
        // Fix duplicates by generating unique hex variations
        for (const [lineId, products] of Object.entries(grouped)) {
          for (let i = 1; i < products.length; i++) {
            const product = products[i];
            const baseHex = product.color_hex?.replace('#', '') || 'CCCCCC';
            
            // Create slight variation
            const variation = Math.min(255, parseInt(baseHex.slice(0, 2), 16) + i * 5)
              .toString(16).padStart(2, '0');
            const newHex = `#${variation}${baseHex.slice(2)}`;
            
            if (!dryRun) {
              await supabase
                .from('filaments')
                .update({ color_hex: newHex })
                .eq('id', product.id);
            }
            result.stats.duplicateHexesFixed++;
          }
        }
      }
      
      console.log(`[Step 4] Fixed ${result.stats.duplicateHexesFixed} duplicate hex codes`);
    }

    // =========================================================================
    // STEP 5: TDS PARSING (Skip - handled by separate function)
    // =========================================================================
    if (tasksToRun.includes('parseTds')) {
      console.log('[Step 5] TDS parsing skipped - use parse-filament-tds separately');
    }

    result.message = `Eryone sync complete. Created: ${result.stats.productsCreated}, Updated: ${result.stats.productsUpdated}, Enriched: ${result.stats.enrichmentsApplied}`;
    console.log('[Eryone Sync] Complete:', result.message);

  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    console.error('[Eryone Sync] Fatal error:', errorMsg);
    result.success = false;
    result.message = `Sync failed: ${errorMsg}`;
    result.errors.push(errorMsg);
  }

  return new Response(JSON.stringify(result), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    status: result.success ? 200 : 500,
  });
});

// Helper function to extract color from title
function extractColorFromTitle(title: string): string {
  if (!title) return '';
  
  // Common color patterns
  const colorPatterns = [
    /\b(white|black|red|blue|green|yellow|orange|purple|pink|gray|grey|brown|gold|silver|copper|bronze)\b/i,
    /\b(silk\s+\w+)\b/i,
    /\b(matte\s+\w+)\b/i,
    /\b(translucent\s*\w*)\b/i,
  ];
  
  for (const pattern of colorPatterns) {
    const match = title.match(pattern);
    if (match) return match[1];
  }
  
  return '';
}

// Helper function to extract specs from HTML
function extractSpecsFromHtml(html: string): {
  nozzleTempMin?: number;
  nozzleTempMax?: number;
  bedTempMin?: number;
  bedTempMax?: number;
  density?: number;
} | null {
  if (!html) return null;
  
  const specs: any = {};
  
  // Extract nozzle temperature
  const nozzleMatch = html.match(/nozzle\s*(?:temp(?:erature)?)?[:\s]*(\d+)\s*[-–~]\s*(\d+)\s*°?C/i);
  if (nozzleMatch) {
    specs.nozzleTempMin = parseInt(nozzleMatch[1]);
    specs.nozzleTempMax = parseInt(nozzleMatch[2]);
  }
  
  // Extract bed temperature
  const bedMatch = html.match(/(?:bed|platform|heated?\s*bed)\s*(?:temp(?:erature)?)?[:\s]*(\d+)\s*[-–~]\s*(\d+)\s*°?C/i);
  if (bedMatch) {
    specs.bedTempMin = parseInt(bedMatch[1]);
    specs.bedTempMax = parseInt(bedMatch[2]);
  }
  
  // Extract density
  const densityMatch = html.match(/density[:\s]*([\d.]+)\s*g\/cm/i);
  if (densityMatch) {
    specs.density = parseFloat(densityMatch[1]);
  }
  
  return Object.keys(specs).length > 0 ? specs : null;
}
