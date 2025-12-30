import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import {
  enrichEsunProduct,
  getEsunColorHex,
  normalizeEsunMaterial,
  isEsunPromotionalProduct,
  getEsunPackQuantity,
} from '../_shared/esun-defaults.ts';

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
    colorsExtracted: number;
    tdsUrlsFound: number;
  };
  errors: string[];
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const firecrawlKey = Deno.env.get('FIRECRAWL_API_KEY');
    
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    const options: SyncOptions = await req.json().catch(() => ({}));
    const { dryRun = false, limit, skipScrape = false, tasksToRun } = options;
    
    const result: SyncResult = {
      success: true,
      message: '',
      stats: {
        productsDiscovered: 0,
        productsCreated: 0,
        productsUpdated: 0,
        productsFailed: 0,
        colorsExtracted: 0,
        tdsUrlsFound: 0,
      },
      errors: [],
    };

    const shouldRunTask = (task: string) => !tasksToRun || tasksToRun.includes(task);

    // =========================================================================
    // STEP 1: BASE SYNC VIA FIRECRAWL
    // =========================================================================
    if (shouldRunTask('base_sync')) {
      console.log('Step 1: Base Sync via Firecrawl scraping...');
      
      if (!firecrawlKey) {
        console.log('No Firecrawl key - skipping collection scrape, using existing data');
      } else {
        const collectionUrl = 'https://esun3dstore.com/collections/3d-filament';
        
        try {
          // Scrape the collection page to get product URLs
          const scrapeResponse = await fetch('https://api.firecrawl.dev/v1/scrape', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${firecrawlKey}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              url: collectionUrl,
              formats: ['html', 'links'],
              onlyMainContent: false,
              waitFor: 2000,
            }),
          });
          
          if (scrapeResponse.ok) {
            const scrapeData = await scrapeResponse.json();
            const links = scrapeData.data?.links || scrapeData.links || [];
            
            // Filter for product URLs
            const productUrls = links.filter((link: string) => 
              link.includes('/products/') && 
              link.includes('esun3dstore.com') &&
              !link.includes('/collections/')
            );
            
            console.log(`Found ${productUrls.length} product URLs`);
            result.stats.productsDiscovered = productUrls.length;
            
            // Process each product URL (with limit)
            const urlsToProcess = limit ? productUrls.slice(0, limit) : productUrls;
            
            for (const productUrl of urlsToProcess) {
              try {
                // Scrape product detail page
                const productResponse = await fetch('https://api.firecrawl.dev/v1/scrape', {
                  method: 'POST',
                  headers: {
                    'Authorization': `Bearer ${firecrawlKey}`,
                    'Content-Type': 'application/json',
                  },
                  body: JSON.stringify({
                    url: productUrl,
                    formats: ['html', 'markdown'],
                    onlyMainContent: true,
                  }),
                });
                
                if (!productResponse.ok) {
                  console.error(`Failed to scrape ${productUrl}`);
                  result.stats.productsFailed++;
                  continue;
                }
                
                const productData = await productResponse.json();
                const html = productData.data?.html || productData.html || '';
                const markdown = productData.data?.markdown || productData.markdown || '';
                
                // Extract product info from HTML/markdown
                const productInfo = extractProductInfo(html, markdown, productUrl);
                
                if (!productInfo) {
                  console.log(`Could not extract info from ${productUrl}`);
                  result.stats.productsFailed++;
                  continue;
                }
                
                // Skip non-filament products
                if (!isFilamentProduct(productInfo.title)) {
                  console.log(`Skipping non-filament: ${productInfo.title}`);
                  continue;
                }
                
                // Process each color variant
                for (const variant of productInfo.variants) {
                  const enrichment = enrichEsunProduct(
                    productInfo.title,
                    null,
                    productInfo.tdsUrl
                  );
                  
                  const colorHex = variant.colorHex || getEsunColorHex(variant.colorName);
                  
                  const filamentData = {
                    product_id: `esun-${variant.sku || generateVariantId(productInfo.title, variant.colorName)}`,
                    product_title: `${productInfo.title} - ${variant.colorName}`,
                    vendor: 'eSun',
                    product_url: productUrl,
                    featured_image: variant.imageUrl || productInfo.imageUrl,
                    variant_price: variant.price,
                    variant_available: variant.available,
                    variant_sku: variant.sku,
                    color_hex: colorHex ? `#${colorHex.replace('#', '')}` : null,
                    color_family: extractColorFamily(variant.colorName),
                    material: enrichment.material,
                    finish_type: enrichment.finishType !== 'Standard' ? enrichment.finishType : null,
                    product_line_id: enrichment.productLineId,
                    nozzle_temp_min_c: enrichment.nozzleTempMin,
                    nozzle_temp_max_c: enrichment.nozzleTempMax,
                    bed_temp_min_c: enrichment.bedTempMin,
                    bed_temp_max_c: enrichment.bedTempMax,
                    print_speed_max_mms: enrichment.printSpeedMax,
                    is_nozzle_abrasive: enrichment.isAbrasive || null,
                    tds_url: enrichment.tdsUrl,
                    high_speed_capable: enrichment.isHighSpeed || null,
                    diameter_nominal_mm: 1.75,
                    net_weight_g: 1000,
                    auto_created: true,
                    auto_updated: true,
                    last_scraped_at: new Date().toISOString(),
                  };
                  
                  if (colorHex) result.stats.colorsExtracted++;
                  if (enrichment.tdsUrl) result.stats.tdsUrlsFound++;
                  
                  if (dryRun) {
                    console.log(`[DRY RUN] Would upsert: ${filamentData.product_title}`);
                    result.stats.productsCreated++;
                  } else {
                    const { error } = await supabase
                      .from('filaments')
                      .upsert(filamentData, { 
                        onConflict: 'product_id',
                        ignoreDuplicates: false 
                      });
                    
                    if (error) {
                      console.error(`Error upserting ${filamentData.product_id}:`, error.message);
                      result.errors.push(`${filamentData.product_id}: ${error.message}`);
                      result.stats.productsFailed++;
                    } else {
                      result.stats.productsCreated++;
                    }
                  }
                }
                
                // Rate limiting
                await new Promise(r => setTimeout(r, 1500));
                
              } catch (err) {
                console.error(`Error processing ${productUrl}:`, err);
                result.stats.productsFailed++;
              }
            }
          } else {
            console.error('Failed to scrape collection page');
            result.errors.push('Failed to scrape collection page');
          }
        } catch (err) {
          console.error('Firecrawl error:', err);
          result.errors.push(`Firecrawl error: ${err}`);
        }
      }
    }

    // =========================================================================
    // STEP 2: FIRECRAWL DETAIL SCRAPING (for existing products without specs)
    // =========================================================================
    if (shouldRunTask('scrape_details') && firecrawlKey && !skipScrape) {
      console.log('Step 2: Firecrawl Detail Scraping...');
      
      // Get products missing TDS URL or print temps
      const { data: productsToEnrich } = await supabase
        .from('filaments')
        .select('id, product_title, product_url, tds_url, nozzle_temp_min_c')
        .ilike('vendor', 'esun')
        .or('tds_url.is.null,nozzle_temp_min_c.is.null')
        .not('product_url', 'is', null)
        .limit(limit || 20);
      
      if (productsToEnrich && productsToEnrich.length > 0) {
        console.log(`Found ${productsToEnrich.length} products to enrich`);
        
        for (const product of productsToEnrich) {
          try {
            const response = await fetch('https://api.firecrawl.dev/v1/scrape', {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${firecrawlKey}`,
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                url: product.product_url,
                formats: ['html'],
                onlyMainContent: true,
              }),
            });
            
            if (response.ok) {
              const data = await response.json();
              const html = data.data?.html || data.html || '';
              
              const specs = extractSpecsFromHtml(html);
              
              if (specs) {
                const updates: Record<string, unknown> = {};
                
                if (specs.nozzleTempMin && !product.nozzle_temp_min_c) {
                  updates.nozzle_temp_min_c = specs.nozzleTempMin;
                }
                if (specs.nozzleTempMax) {
                  updates.nozzle_temp_max_c = specs.nozzleTempMax;
                }
                if (specs.bedTempMin) {
                  updates.bed_temp_min_c = specs.bedTempMin;
                }
                if (specs.bedTempMax) {
                  updates.bed_temp_max_c = specs.bedTempMax;
                }
                if (specs.tdsUrl && !product.tds_url) {
                  updates.tds_url = specs.tdsUrl;
                  result.stats.tdsUrlsFound++;
                }
                if (specs.density) {
                  updates.density_g_cm3 = specs.density;
                }
                
                if (Object.keys(updates).length > 0 && !dryRun) {
                  await supabase
                    .from('filaments')
                    .update(updates)
                    .eq('id', product.id);
                  
                  result.stats.productsUpdated++;
                  console.log(`Updated specs for ${product.product_title}`);
                }
              }
            }
            
            await new Promise(r => setTimeout(r, 1500));
          } catch (err) {
            console.error(`Error scraping ${product.product_url}:`, err);
          }
        }
      }
    }

    // =========================================================================
    // STEP 3: BRAND-SPECIFIC ENRICHMENTS
    // =========================================================================
    if (shouldRunTask('enrich')) {
      console.log('Step 3: Brand-Specific Enrichments...');
      
      const { data: toEnrich } = await supabase
        .from('filaments')
        .select('id, product_title, material, tds_url, product_line_id, finish_type')
        .ilike('vendor', 'esun')
        .or('product_line_id.is.null,finish_type.is.null,material.is.null');
      
      if (toEnrich && toEnrich.length > 0) {
        console.log(`Enriching ${toEnrich.length} products...`);
        
        for (const product of toEnrich) {
          const enrichment = enrichEsunProduct(
            product.product_title,
            product.material,
            product.tds_url
          );
          
          const updates: Record<string, unknown> = {};
          
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
          
          // Apply print settings if missing
          if (enrichment.nozzleTempMin) {
            updates.nozzle_temp_min_c = enrichment.nozzleTempMin;
            updates.nozzle_temp_max_c = enrichment.nozzleTempMax;
          }
          if (enrichment.bedTempMin) {
            updates.bed_temp_min_c = enrichment.bedTempMin;
            updates.bed_temp_max_c = enrichment.bedTempMax;
          }
          if (enrichment.printSpeedMax) {
            updates.print_speed_max_mms = enrichment.printSpeedMax;
          }
          if (enrichment.isHighSpeed) {
            updates.high_speed_capable = true;
          }
          if (enrichment.isAbrasive) {
            updates.is_nozzle_abrasive = true;
          }
          
          if (Object.keys(updates).length > 0 && !dryRun) {
            await supabase
              .from('filaments')
              .update(updates)
              .eq('id', product.id);
            
            result.stats.productsUpdated++;
          }
        }
      }
    }

    // =========================================================================
    // STEP 4: DUPLICATE HEX FIX
    // =========================================================================
    if (shouldRunTask('fix_hexes')) {
      console.log('Step 4: Duplicate Hex Fix...');
      
      const { data: duplicates } = await supabase
        .rpc('find_duplicate_hexes', { p_vendor: 'eSun' });
      
      if (duplicates && duplicates.length > 0) {
        console.log(`Found ${duplicates.length} duplicate hex entries`);
        
        const grouped = new Map<string, typeof duplicates>();
        for (const dup of duplicates) {
          const key = `${dup.product_line_id}:${dup.color_hex?.toLowerCase()}`;
          if (!grouped.has(key)) {
            grouped.set(key, []);
          }
          grouped.get(key)!.push(dup);
        }
        
        for (const [, items] of grouped) {
          if (items.length > 1) {
            // Skip first, modify others
            for (let i = 1; i < items.length; i++) {
              const item = items[i];
              const baseHex = item.color_hex?.replace('#', '') || 'CCCCCC';
              
              // Generate unique variant
              const r = parseInt(baseHex.slice(0, 2), 16);
              const g = parseInt(baseHex.slice(2, 4), 16);
              const b = parseInt(baseHex.slice(4, 6), 16);
              
              const newR = Math.min(255, Math.max(0, r + (i * 5)));
              const newG = Math.min(255, Math.max(0, g + (i * 3)));
              const newB = Math.min(255, Math.max(0, b + (i * 2)));
              
              const newHex = `#${newR.toString(16).padStart(2, '0')}${newG.toString(16).padStart(2, '0')}${newB.toString(16).padStart(2, '0')}`.toUpperCase();
              
              if (!dryRun) {
                await supabase
                  .from('filaments')
                  .update({ color_hex: newHex })
                  .eq('id', item.id);
              }
            }
          }
        }
      }
    }

    // =========================================================================
    // STEP 5: TDS PARSING (triggers separate function)
    // =========================================================================
    if (shouldRunTask('parse_tds')) {
      console.log('Step 5: TDS Parsing - skipped (use parse-filament-tds separately)');
    }

    // Final stats
    result.message = `eSun sync complete: ${result.stats.productsCreated} created, ${result.stats.productsUpdated} updated, ${result.stats.productsFailed} failed`;
    console.log(result.message);

    return new Response(
      JSON.stringify(result),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Fatal error:', error);
    return new Response(
      JSON.stringify({ success: false, error: String(error) }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function isFilamentProduct(title: string): boolean {
  const lowerTitle = title.toLowerCase();
  
  // Must contain filament-related terms
  if (!/(filament|pla|petg|abs|asa|tpu|tpe|pa|nylon|pc)/i.test(lowerTitle)) {
    return false;
  }
  
  // Exclude non-filament products
  const excludePatterns = [
    /\bdry\s*box\b/i,
    /\bdryer\b/i,
    /\bspool\s*holder\b/i,
    /\bnozzle\b/i,
    /\bhotend\b/i,
    /\bextruder\b/i,
    /\bbed\s*sheet\b/i,
    /\bprint\s*surface\b/i,
  ];
  
  return !excludePatterns.some(p => p.test(title));
}

interface ProductInfo {
  title: string;
  imageUrl: string | null;
  tdsUrl: string | null;
  variants: Array<{
    colorName: string;
    colorHex: string | null;
    price: number | null;
    available: boolean;
    sku: string | null;
    imageUrl: string | null;
  }>;
}

function extractProductInfo(html: string, markdown: string, url: string): ProductInfo | null {
  // Extract title from HTML
  const titleMatch = html.match(/<h1[^>]*>([^<]+)<\/h1>/i) ||
                     html.match(/<title>([^<|]+)/i);
  
  if (!titleMatch) return null;
  
  const title = titleMatch[1].trim()
    .replace(/\s*\|\s*eSun.*$/i, '')
    .replace(/\s*-\s*eSun.*$/i, '');
  
  // Extract main image
  const imageMatch = html.match(/og:image[^>]*content="([^"]+)"/i) ||
                     html.match(/<img[^>]*class="[^"]*product[^"]*"[^>]*src="([^"]+)"/i);
  const imageUrl = imageMatch ? imageMatch[1] : null;
  
  // Extract TDS URL (eSun has download links)
  const tdsMatch = html.match(/href="([^"]*(?:tds|datasheet)[^"]*\.pdf)"/i) ||
                   html.match(/href="([^"]*esun3d\.com\/uploads\/[^"]*\.pdf)"/i);
  const tdsUrl = tdsMatch ? tdsMatch[1] : null;
  
  // Extract color variants from select options or variant data
  const variants: ProductInfo['variants'] = [];
  
  // Try to find variant data in JSON
  const variantJsonMatch = html.match(/var\s+meta\s*=\s*(\{[^;]+\});/);
  if (variantJsonMatch) {
    try {
      const meta = JSON.parse(variantJsonMatch[1]);
      if (meta.product?.variants) {
        for (const v of meta.product.variants) {
          variants.push({
            colorName: v.title || v.option1 || 'Default',
            colorHex: null,
            price: v.price ? v.price / 100 : null,
            available: v.available !== false,
            sku: v.sku || null,
            imageUrl: v.featured_image?.src || null,
          });
        }
      }
    } catch {
      // JSON parse failed
    }
  }
  
  // Fallback: extract from select options
  if (variants.length === 0) {
    const optionMatches = html.matchAll(/<option[^>]*value="([^"]*)"[^>]*>([^<]+)<\/option>/gi);
    for (const match of optionMatches) {
      const colorName = match[2].trim();
      if (colorName && !colorName.toLowerCase().includes('select')) {
        variants.push({
          colorName,
          colorHex: null,
          price: null,
          available: true,
          sku: null,
          imageUrl: null,
        });
      }
    }
  }
  
  // If still no variants, create a default one
  if (variants.length === 0) {
    variants.push({
      colorName: 'Default',
      colorHex: null,
      price: null,
      available: true,
      sku: null,
      imageUrl: null,
    });
  }
  
  return { title, imageUrl, tdsUrl, variants };
}

function extractSpecsFromHtml(html: string): {
  nozzleTempMin?: number;
  nozzleTempMax?: number;
  bedTempMin?: number;
  bedTempMax?: number;
  tdsUrl?: string;
  density?: number;
} | null {
  const specs: Record<string, unknown> = {};
  
  // Nozzle temperature patterns
  const nozzleMatch = html.match(/(?:nozzle|printing|print)\s*(?:temp(?:erature)?)?[:\s]*(\d{3})\s*[-–]\s*(\d{3})\s*°?C?/i) ||
                      html.match(/(\d{3})\s*[-–]\s*(\d{3})\s*°?C?\s*(?:nozzle|hotend)/i);
  if (nozzleMatch) {
    specs.nozzleTempMin = parseInt(nozzleMatch[1], 10);
    specs.nozzleTempMax = parseInt(nozzleMatch[2], 10);
  }
  
  // Bed temperature patterns
  const bedMatch = html.match(/(?:bed|platform|heated\s*bed)\s*(?:temp(?:erature)?)?[:\s]*(\d{2,3})\s*[-–]\s*(\d{2,3})\s*°?C?/i) ||
                   html.match(/(\d{2,3})\s*[-–]\s*(\d{2,3})\s*°?C?\s*(?:bed|platform)/i);
  if (bedMatch) {
    specs.bedTempMin = parseInt(bedMatch[1], 10);
    specs.bedTempMax = parseInt(bedMatch[2], 10);
  }
  
  // TDS URL
  const tdsMatch = html.match(/href="([^"]*(?:tds|datasheet)[^"]*\.pdf)"/i) ||
                   html.match(/href="([^"]*esun3d\.com\/uploads\/[^"]*\.pdf)"/i);
  if (tdsMatch) {
    specs.tdsUrl = tdsMatch[1];
  }
  
  // Density
  const densityMatch = html.match(/density[:\s]*(\d+\.?\d*)\s*g\/cm/i);
  if (densityMatch) {
    specs.density = parseFloat(densityMatch[1]);
  }
  
  return Object.keys(specs).length > 0 ? specs as ReturnType<typeof extractSpecsFromHtml> : null;
}

function generateVariantId(title: string, colorName: string): string {
  const baseId = title
    .toLowerCase()
    .replace(/esun/gi, '')
    .replace(/filament/gi, '')
    .replace(/1\.75\s*mm/gi, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 30);
  
  const colorId = colorName
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 20);
  
  return `${baseId}-${colorId}`;
}

function extractColorFamily(colorName: string): string | null {
  const lowerColor = colorName.toLowerCase();
  
  const colorFamilies: Record<string, string[]> = {
    'Black': ['black', 'carbon', 'noir'],
    'White': ['white', 'ivory', 'bone', 'snow'],
    'Gray': ['grey', 'gray', 'silver', 'charcoal'],
    'Red': ['red', 'crimson', 'scarlet', 'wine', 'fire'],
    'Orange': ['orange', 'tangerine'],
    'Yellow': ['yellow', 'gold', 'lemon'],
    'Green': ['green', 'olive', 'pine', 'grass', 'peak'],
    'Blue': ['blue', 'navy', 'sky', 'water', 'cyan'],
    'Purple': ['purple', 'violet', 'lavender', 'magenta'],
    'Pink': ['pink', 'rose'],
    'Brown': ['brown', 'chocolate', 'wood'],
    'Natural': ['natural', 'clear', 'transparent'],
  };
  
  for (const [family, keywords] of Object.entries(colorFamilies)) {
    if (keywords.some(k => lowerColor.includes(k))) {
      return family;
    }
  }
  
  return null;
}
