import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import {
  enrichDuramicProduct,
  getDuramicColorHex,
  normalizeDuramicMaterial,
  extractFinishType,
  cleanDuramicTitle,
  isMultiPack,
  getPackQuantity,
} from '../_shared/duramic-defaults.ts';

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
    colorsExtracted: number;
    duplicateHexesFixed: number;
  };
  errors: string[];
  dryRun: boolean;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const startTime = Date.now();
  const errors: string[] = [];
  
  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const firecrawlKey = Deno.env.get('FIRECRAWL_API_KEY');
    
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    const options: SyncOptions = await req.json().catch(() => ({}));
    const { dryRun = false, limit = 500, skipScrape = false, tasksToRun = ['all'] } = options;
    
    console.log(`[Duramic Sync] Starting sync - dryRun: ${dryRun}, limit: ${limit}`);
    console.log(`[Duramic Sync] Tasks to run: ${tasksToRun.join(', ')}`);
    
    const stats = {
      productsDiscovered: 0,
      productsCreated: 0,
      productsUpdated: 0,
      productsFailed: 0,
      enrichmentsApplied: 0,
      colorsExtracted: 0,
      duplicateHexesFixed: 0,
    };

    // =========================================================================
    // STEP 1: BASE SYNC - Fetch products from Shopify JSON API
    // =========================================================================
    
    const shouldRunTask = (task: string) => 
      tasksToRun.includes('all') || tasksToRun.includes(task);
    
    let products: any[] = [];
    
    if (shouldRunTask('sync')) {
      console.log('[Duramic Sync] Step 1: Fetching products from Shopify API...');
      
      try {
        // Duramic 3D Shopify store
        const shopifyUrl = 'https://duramic3d.com/products.json?limit=250';
        const response = await fetch(shopifyUrl, {
          headers: { 'User-Agent': 'FilaScope/1.0' },
        });
        
        if (!response.ok) {
          throw new Error(`Shopify API returned ${response.status}`);
        }
        
        const data = await response.json();
        products = data.products || [];
        stats.productsDiscovered = products.length;
        
        console.log(`[Duramic Sync] Discovered ${products.length} products from Shopify`);
        
        // Process each product with variant explosion
        for (const product of products.slice(0, limit)) {
          try {
            // Skip non-filament products
            if (!product.title.toLowerCase().includes('pla') &&
                !product.title.toLowerCase().includes('petg') &&
                !product.title.toLowerCase().includes('tpu') &&
                !product.title.toLowerCase().includes('abs') &&
                !product.title.toLowerCase().includes('filament')) {
              console.log(`[Duramic Sync] Skipping non-filament: ${product.title}`);
              continue;
            }
            
            const variants = product.variants || [];
            
            for (const variant of variants) {
              const variantTitle = variant.title !== 'Default Title' 
                ? `${product.title} - ${variant.title}`
                : product.title;
              
              // Extract color from variant title
              const colorName = variant.title !== 'Default Title' 
                ? variant.title 
                : extractColorFromTitle(product.title);
              
              const colorHex = getDuramicColorHex(colorName) || null;
              const material = normalizeDuramicMaterial(product.title);
              const finishType = extractFinishType(product.title);
              const enrichment = enrichDuramicProduct(product.title, material);
              
              // Build product ID for upsert
              const productId = `duramic-${product.id}-${variant.id}`;
              
              // Get image URL
              const imageUrl = variant.featured_image?.src || 
                               product.images?.[0]?.src || 
                               null;
              
              const filamentData = {
                product_id: productId,
                product_title: cleanDuramicTitle(variantTitle),
                vendor: 'Duramic 3D',
                material: material,
                finish_type: finishType !== 'Standard' ? finishType : null,
                color_hex: colorHex,
                variant_price: parseFloat(variant.price) || null,
                variant_sku: variant.sku || null,
                variant_available: variant.available ?? true,
                product_url: `https://duramic3d.com/products/${product.handle}`,
                featured_image: imageUrl,
                product_line_id: enrichment.productLineId,
                nozzle_temp_min_c: enrichment.nozzleTempMin,
                nozzle_temp_max_c: enrichment.nozzleTempMax,
                bed_temp_min_c: enrichment.bedTempMin,
                bed_temp_max_c: enrichment.bedTempMax,
                pack_quantity: enrichment.packQuantity > 1 ? enrichment.packQuantity : null,
                net_weight_g: 1000, // Default 1kg spool
                diameter_nominal_mm: 1.75,
                auto_created: true,
                auto_updated: true,
                last_scraped_at: new Date().toISOString(),
              };
              
              if (dryRun) {
                console.log(`[Duramic Sync] Would upsert: ${filamentData.product_title}`);
                console.log(`  - Material: ${filamentData.material}, Finish: ${filamentData.finish_type}`);
                console.log(`  - Color: ${colorName} -> ${filamentData.color_hex}`);
                console.log(`  - Product Line: ${filamentData.product_line_id}`);
                stats.productsCreated++;
              } else {
                // SELECT-then-UPDATE/INSERT (avoids reliance on non-existent ON CONFLICT constraint)
                const { data: existing } = await supabase
                  .from('filaments')
                  .select('id')
                  .eq('product_id', productId)
                  .limit(1);

                if (existing && existing.length > 0) {
                  // Before updating, check if another record already has the same
                  // (vendor, product_title, variant_price, color_hex) — UPDATE would violate constraint
                  const { data: dupe } = await supabase
                    .from('filaments')
                    .select('id')
                    .eq('vendor', filamentData.vendor)
                    .eq('product_title', filamentData.product_title)
                    .eq('variant_price', filamentData.variant_price)
                    .eq('color_hex', filamentData.color_hex)
                    .neq('id', existing[0].id)
                    .limit(1);

                  if (dupe && dupe.length > 0) {
                    // Another record already has the same values — skip to avoid unique constraint violation
                    console.log(`[Duramic Sync] Skipping ${productId}: duplicate of ${dupe[0].id}`);
                    stats.productsUpdated++;
                  } else {
                    const { error: updateError } = await supabase
                      .from('filaments')
                      .update(filamentData)
                      .eq('id', existing[0].id);
                    if (updateError) {
                      // Unique constraint violation — another row has the same (vendor, title, price, color_hex)
                      // Treat as already-up-to-date rather than a failure
                      if (updateError.code === '23505' || updateError.message.includes('duplicate')) {
                        console.log(`[Duramic Sync] Unique constraint hit on ${productId}, counting as updated`);
                        stats.productsUpdated++;
                      } else {
                        console.error(`[Duramic Sync] Error updating ${productId}:`, updateError.message);
                        errors.push(`Failed to update ${productId}: ${updateError.message}`);
                        stats.productsFailed++;
                      }
                    } else {
                      stats.productsUpdated++;
                    }
                  }
                } else {
                  // Insert new record (guard against unique constraint violation)
                  const { error: insertError } = await supabase
                    .from('filaments')
                    .insert(filamentData);
                  if (insertError) {
                    if (insertError.message.includes('duplicate') || insertError.code === '23505') {
                      // Already exists — another concurrent sync got it; count as updated
                      stats.productsUpdated++;
                    } else {
                      console.error(`[Duramic Sync] Error inserting ${productId}:`, insertError.message);
                      errors.push(`Failed to insert ${productId}: ${insertError.message}`);
                      stats.productsFailed++;
                    }
                  } else {
                    stats.productsCreated++;
                    if (colorHex) stats.colorsExtracted++;
                  }
                }
              }
            }
          } catch (productError) {
            const errMsg = productError instanceof Error ? productError.message : String(productError);
            console.error(`[Duramic Sync] Error processing product:`, productError);
            errors.push(`Product error: ${errMsg}`);
            stats.productsFailed++;
          }
        }
      } catch (syncError) {
        const errMsg = syncError instanceof Error ? syncError.message : String(syncError);
        console.error('[Duramic Sync] Shopify sync error:', syncError);
        errors.push(`Shopify sync error: ${errMsg}`);
      }
    }

    // =========================================================================
    // STEP 2: FIRECRAWL DETAIL SCRAPING (Optional)
    // =========================================================================
    
    if (shouldRunTask('scrape') && !skipScrape && firecrawlKey) {
      console.log('[Duramic Sync] Step 2: Scraping product details with Firecrawl...');
      
      // Get unique product URLs from database
      const { data: filaments } = await supabase
        .from('filaments')
        .select('id, product_url, product_title')
        .ilike('vendor', 'duramic%')
        .not('product_url', 'is', null)
        .limit(limit);
      
      const uniqueUrls = [...new Set((filaments || []).map(f => f.product_url))];
      console.log(`[Duramic Sync] Found ${uniqueUrls.length} unique product URLs to scrape`);
      
      // Scrape each unique URL (with rate limiting)
      for (const url of uniqueUrls.slice(0, 20)) { // Limit to 20 for safety
        try {
          console.log(`[Duramic Sync] Scraping: ${url}`);
          
          const scrapeResponse = await fetch('https://api.firecrawl.dev/v1/scrape', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${firecrawlKey}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              url,
              formats: ['markdown', 'html'],
              onlyMainContent: true,
            }),
          });
          
          if (scrapeResponse.ok) {
            const scrapeData = await scrapeResponse.json();
            const html = scrapeData.data?.html || scrapeData.html || '';
            
            // Extract specs from HTML
            const specs = extractSpecsFromHtml(html);
            
            if (specs && !dryRun) {
              // Update all filaments with this URL
              const { error: updateError } = await supabase
                .from('filaments')
                .update({
                  nozzle_temp_min_c: specs.nozzleTempMin,
                  nozzle_temp_max_c: specs.nozzleTempMax,
                  bed_temp_min_c: specs.bedTempMin,
                  bed_temp_max_c: specs.bedTempMax,
                  density_g_cm3: specs.density,
                })
                .eq('product_url', url)
                .ilike('vendor', 'duramic%');
              
              if (!updateError) {
                stats.enrichmentsApplied++;
              }
            }
          }
          
          // Rate limit
          await new Promise(resolve => setTimeout(resolve, 1500));
        } catch (scrapeError) {
          console.error(`[Duramic Sync] Scrape error for ${url}:`, scrapeError);
        }
      }
    }

    // =========================================================================
    // STEP 3: BRAND-SPECIFIC ENRICHMENTS
    // =========================================================================
    
    if (shouldRunTask('enrich')) {
      console.log('[Duramic Sync] Step 3: Applying brand-specific enrichments...');
      
      // Fetch all Duramic filaments that need enrichment
      const { data: toEnrich } = await supabase
        .from('filaments')
        .select('id, product_title, material, product_line_id, finish_type')
        .ilike('vendor', 'duramic%')
        .or('product_line_id.is.null,finish_type.is.null')
        .limit(limit);
      
      console.log(`[Duramic Sync] Found ${toEnrich?.length || 0} filaments needing enrichment`);
      
      for (const filament of toEnrich || []) {
        const enrichment = enrichDuramicProduct(filament.product_title, filament.material);
        
        const updates: Record<string, any> = {};
        
        if (!filament.product_line_id) {
          updates.product_line_id = enrichment.productLineId;
        }
        if (!filament.finish_type && enrichment.finishType !== 'Standard') {
          updates.finish_type = enrichment.finishType;
        }
        if (!filament.material && enrichment.material) {
          updates.material = enrichment.material;
        }
        
        if (Object.keys(updates).length > 0) {
          if (dryRun) {
            console.log(`[Duramic Sync] Would update ${filament.id}:`, updates);
          } else {
            await supabase
              .from('filaments')
              .update(updates)
              .eq('id', filament.id);
          }
          stats.enrichmentsApplied++;
        }
      }
    }

    // =========================================================================
    // STEP 4: DUPLICATE HEX FIX
    // =========================================================================
    
    if (shouldRunTask('fix-hex') && !dryRun) {
      console.log('[Duramic Sync] Step 4: Fixing duplicate hex codes...');
      
      try {
        const { data: dupeData, error: dupeError } = await supabase
          .rpc('find_duplicate_hexes', { p_vendor: 'Duramic 3D' });
        
        if (!dupeError && dupeData) {
          stats.duplicateHexesFixed = dupeData.length || 0;
          console.log(`[Duramic Sync] Fixed ${stats.duplicateHexesFixed} duplicate hex codes`);
        }
      } catch (hexError) {
        console.error('[Duramic Sync] Hex fix error:', hexError);
      }
    }

    // =========================================================================
    // STEP 5: TDS PARSING (Duramic has no TDS pages, so skip)
    // =========================================================================
    
    console.log('[Duramic Sync] Step 5: TDS parsing skipped (Duramic has no TDS pages)');

    // =========================================================================
    // COMPLETE
    // =========================================================================
    
    const duration = Math.round((Date.now() - startTime) / 1000);
    
    // Log sync results
    if (!dryRun) {
      await supabase.from('brand_sync_logs').insert({
        brand_slug: 'duramic-3d',
        status: errors.length > 0 ? 'partial' : 'completed',
        sync_type: 'full',
        products_discovered: stats.productsDiscovered,
        products_created: stats.productsCreated,
        products_updated: stats.productsUpdated,
        products_failed: stats.productsFailed,
        duration_seconds: duration,
        triggered_by: 'edge_function',
        error_details: errors.length > 0 ? { errors } : null,
      });
    }
    
    const result: SyncResult = {
      success: errors.length === 0,
      message: `Duramic 3D sync ${dryRun ? '(dry run) ' : ''}completed in ${duration}s`,
      stats,
      errors,
      dryRun,
    };
    
    console.log('[Duramic Sync] Complete:', JSON.stringify(result, null, 2));
    
    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
    
  } catch (error) {
    const errMsg = error instanceof Error ? error.message : String(error);
    console.error('[Duramic Sync] Fatal error:', error);
    
    return new Response(JSON.stringify({
      success: false,
      message: `Sync failed: ${errMsg}`,
      stats: {
        productsDiscovered: 0,
        productsCreated: 0,
        productsUpdated: 0,
        productsFailed: 0,
        enrichmentsApplied: 0,
        colorsExtracted: 0,
        duplicateHexesFixed: 0,
      },
      errors: [errMsg],
      dryRun: false,
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function extractColorFromTitle(title: string): string {
  if (!title) return '';
  
  // Common color patterns
  const colorPatterns = [
    /\b(black|white|red|blue|green|yellow|orange|purple|pink|grey|gray|silver|gold|bronze|copper)\b/i,
    /\b(cyan|magenta|lime|navy|forest|sky|light|dark)\s*(blue|green|red|grey|gray)?\b/i,
    /\b(translucent|transparent|clear)\s*(red|blue|green|white)?\b/i,
    /\b(shiny|silk|metallic)\s*(silver|gold|bronze|copper|blue|green|red)?\b/i,
  ];
  
  for (const pattern of colorPatterns) {
    const match = title.match(pattern);
    if (match) {
      return match[0].toLowerCase().trim();
    }
  }
  
  return '';
}

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
  const nozzleMatch = html.match(/nozzle\s*(?:temp(?:erature)?)?[:\s]*(\d{3})\s*[-–]\s*(\d{3})\s*°?C/i);
  if (nozzleMatch) {
    specs.nozzleTempMin = parseInt(nozzleMatch[1], 10);
    specs.nozzleTempMax = parseInt(nozzleMatch[2], 10);
  }
  
  // Extract bed temperature
  const bedMatch = html.match(/(?:bed|heated?\s*bed|platform)\s*(?:temp(?:erature)?)?[:\s]*(\d{2,3})\s*[-–]\s*(\d{2,3})\s*°?C/i);
  if (bedMatch) {
    specs.bedTempMin = parseInt(bedMatch[1], 10);
    specs.bedTempMax = parseInt(bedMatch[2], 10);
  }
  
  // Extract density
  const densityMatch = html.match(/density[:\s]*([\d.]+)\s*g\/cm/i);
  if (densityMatch) {
    specs.density = parseFloat(densityMatch[1]);
  }
  
  return Object.keys(specs).length > 0 ? specs : null;
}
