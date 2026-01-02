/**
 * ANYCUBIC BRAND-SPECIFIC SYNC WRAPPER
 * 
 * A dedicated sync function for Anycubic that:
 * 1. Calls the generic sync-brand-products function with variant explosion
 * 2. Scrapes product pages via Firecrawl for TDS URLs, color hex, specs
 * 3. Applies Anycubic-specific post-processing:
 *    - Auto-assign TDS URLs from product page HTML
 *    - Extract color hex from product page color tables
 *    - Apply default print settings for known materials
 *    - Extract finish types from titles
 *    - Fix color hex inconsistencies
 *    - Validate and fix duplicate hex codes
 * 4. Triggers automatic TDS parsing for TD (transmission distance) extraction
 * 
 * This ensures Anycubic products meet all schema and data quality standards.
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.1';
import {
  enrichAnycubicProduct,
  matchAnycubicTds,
  getAnycubicPrintSettings,
  extractFinishType,
  normalizeAnycubicMaterial,
  getAnycubicColorHex,
  generateAnycubicProductLineId,
  isNonFilamentProduct,
  isPromotionalProduct,
} from '../_shared/anycubic-defaults.ts';
import { getColorHex, getColorFamily } from '../_shared/color-mapping.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface SyncRequest {
  dryRun?: boolean;
  limit?: number;
  regions?: string[];
  forceEnrichment?: boolean;
  tasks?: ('sync' | 'enrich' | 'tds' | 'colors' | 'settings' | 'scrape-details' | 'parse-tds')[];
  scrapeDetails?: boolean;
  triggerTdsParsing?: boolean;
}

interface EnrichmentResult {
  id: string;
  title: string;
  changes: string[];
  tdsFound: boolean;
  settingsApplied: boolean;
  colorFixed: boolean;
}

interface ScrapedDetails {
  tdsUrl?: string;
  printingTempMin?: number;
  printingTempMax?: number;
  bedTempMin?: number;
  bedTempMax?: number;
  density?: number;
  colorHexTable?: Record<string, string>;
  dryingTemp?: number;
  dryingTime?: number;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const startTime = Date.now();
  console.log('[ANYCUBIC-SYNC] ═══════════════════════════════════════════════════════');
  console.log('[ANYCUBIC-SYNC] 🚀 ANYCUBIC BRAND SYNC STARTED');
  console.log('[ANYCUBIC-SYNC] ═══════════════════════════════════════════════════════');

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const firecrawlKey = Deno.env.get('FIRECRAWL_API_KEY') || Deno.env.get('FIRECRAWL_API_KEY_1');
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Verify admin role
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Authorization required' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const authClient = createClient(supabaseUrl, Deno.env.get('SUPABASE_ANON_KEY')!, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: { user }, error: userError } = await authClient.auth.getUser();
    if (userError || !user) {
      return new Response(JSON.stringify({ error: 'Invalid authentication' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { data: isAdmin } = await supabase.rpc('has_role', {
      _user_id: user.id,
      _role: 'admin',
    });

    if (!isAdmin) {
      return new Response(JSON.stringify({ error: 'Admin role required' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Parse request
    let body: SyncRequest = {};
    try {
      body = await req.json();
    } catch {
      // Use defaults
    }

    const {
      dryRun = false,
      limit = 500,
      forceEnrichment = false,
      tasks = ['sync', 'enrich', 'scrape-details'],
      scrapeDetails = true,
      triggerTdsParsing = true,
    } = body;

    let syncResult: any = null;
    const enrichmentResults: EnrichmentResult[] = [];
    let tdsFound = 0;
    let settingsApplied = 0;
    let colorsFixed = 0;
    let duplicatesFixed = 0;
    let detailsScraped = 0;
    let tdsParsed = 0;

    // =========================================================================
    // STEP 1: Run base sync (if requested)
    // =========================================================================
    if (tasks.includes('sync')) {
      console.log('[ANYCUBIC-SYNC] Step 1: Running base sync via sync-brand-products...');
      
      try {
        // Call the generic sync function with variant explosion enabled
        const syncResponse = await fetch(`${supabaseUrl}/functions/v1/sync-brand-products`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': authHeader,
          },
          body: JSON.stringify({
            brandSlug: 'anycubic',
            dryRun,
            limit,
            regions: body.regions || ['US'],
          }),
        });

        if (syncResponse.ok) {
          syncResult = await syncResponse.json();
          console.log(`[ANYCUBIC-SYNC] Base sync complete:`, syncResult.summary);
        } else {
          const errorText = await syncResponse.text();
          console.error('[ANYCUBIC-SYNC] Base sync failed:', errorText);
        }
      } catch (err) {
        console.error('[ANYCUBIC-SYNC] Base sync error:', err);
      }
    }

    // =========================================================================
    // STEP 2: Scrape product page details via Firecrawl (TDS, colors, specs)
    // =========================================================================
    if ((tasks.includes('scrape-details') || scrapeDetails) && firecrawlKey) {
      console.log('[ANYCUBIC-SYNC] Step 2: Scraping product page details via Firecrawl...');

      // Fetch Anycubic filaments that need detail scraping
      const { data: filaments, error: fetchError } = await supabase
        .from('filaments')
        .select('id, product_title, product_url, tds_url, color_hex, nozzle_temp_min_c, nozzle_temp_max_c, bed_temp_min_c, bed_temp_max_c')
        .ilike('vendor', '%anycubic%')
        .not('product_url', 'is', null)
        .limit(Math.min(limit, 50)); // Limit for rate limiting

      if (fetchError) {
        console.error('[ANYCUBIC-SYNC] Failed to fetch filaments:', fetchError.message);
      } else {
        console.log(`[ANYCUBIC-SYNC] Found ${filaments?.length || 0} filaments for detail scraping`);
        
        // Group filaments by unique product page (remove variant param)
        const uniqueProductUrls = new Map<string, typeof filaments>();
        for (const f of filaments || []) {
          if (!f.product_url) continue;
          const baseUrl = f.product_url.split('?')[0];
          if (!uniqueProductUrls.has(baseUrl)) {
            uniqueProductUrls.set(baseUrl, []);
          }
          uniqueProductUrls.get(baseUrl)!.push(f);
        }

        console.log(`[ANYCUBIC-SYNC] ${uniqueProductUrls.size} unique product pages to scrape`);

        // Scrape each unique product page
        for (const [productUrl, relatedFilaments] of uniqueProductUrls) {
          // Skip if all related filaments already have TDS
          const needsScraping = relatedFilaments.some(f => !f.tds_url || !f.color_hex || !f.nozzle_temp_min_c);
          if (!needsScraping && !forceEnrichment) continue;

          try {
            const details = await scrapeAnycubicProductDetails(productUrl, firecrawlKey);
            
            if (details) {
              detailsScraped++;
              
              // Apply scraped details to all related filaments
              for (const filament of relatedFilaments) {
                const changes: string[] = [];
                const updateData: Record<string, any> = {};

                // TDS URL
                if (!filament.tds_url && details.tdsUrl) {
                  updateData.tds_url = details.tdsUrl;
                  changes.push(`TDS: scraped from page`);
                  tdsFound++;
                }

                // Print settings
                if (!filament.nozzle_temp_min_c && details.printingTempMin) {
                  updateData.nozzle_temp_min_c = details.printingTempMin;
                  changes.push(`nozzle_min: ${details.printingTempMin}`);
                }
                if (!filament.nozzle_temp_max_c && details.printingTempMax) {
                  updateData.nozzle_temp_max_c = details.printingTempMax;
                  changes.push(`nozzle_max: ${details.printingTempMax}`);
                }
                if (!filament.bed_temp_min_c && details.bedTempMin) {
                  updateData.bed_temp_min_c = details.bedTempMin;
                  changes.push(`bed_min: ${details.bedTempMin}`);
                }
                if (!filament.bed_temp_max_c && details.bedTempMax) {
                  updateData.bed_temp_max_c = details.bedTempMax;
                  changes.push(`bed_max: ${details.bedTempMax}`);
                }
                
                if (Object.keys(updateData).some(k => k.includes('temp'))) {
                  settingsApplied++;
                }

                // Color hex from product page table
                if (!filament.color_hex && details.colorHexTable) {
                  // Try to match color from title to hex table
                  const colorName = extractColorFromTitle(filament.product_title);
                  if (colorName) {
                    const matchedHex = findMatchingColorHex(colorName, details.colorHexTable);
                    if (matchedHex) {
                      updateData.color_hex = matchedHex;
                      changes.push(`color: ${colorName} → ${matchedHex}`);
                      colorsFixed++;
                    }
                  }
                }

                // Density
                if (details.density) {
                  updateData.density_g_cm3 = details.density;
                }

                // Drying info
                if (details.dryingTemp) {
                  updateData.drying_temp_c = details.dryingTemp;
                }
                if (details.dryingTime) {
                  updateData.drying_time_hours = details.dryingTime;
                }

                // Apply updates
                if (Object.keys(updateData).length > 0 && !dryRun) {
                  updateData.updated_at = new Date().toISOString();
                  
                  const { error: updateError } = await supabase
                    .from('filaments')
                    .update(updateData)
                    .eq('id', filament.id);

                  if (updateError) {
                    console.error(`[ANYCUBIC-SYNC] Update failed for ${filament.id}:`, updateError.message);
                  } else if (changes.length > 0) {
                    enrichmentResults.push({
                      id: filament.id,
                      title: filament.product_title,
                      changes,
                      tdsFound: !!updateData.tds_url,
                      settingsApplied: Object.keys(updateData).some(k => k.includes('temp')),
                      colorFixed: !!updateData.color_hex,
                    });
                  }
                }
              }
            }
            
            // Rate limit between scrapes (Firecrawl limit)
            await new Promise(r => setTimeout(r, 2000));
          } catch (err) {
            console.error(`[ANYCUBIC-SYNC] Error scraping ${productUrl}:`, err);
          }
        }
      }
    } else if (!firecrawlKey) {
      console.warn('[ANYCUBIC-SYNC] FIRECRAWL_API_KEY not configured - skipping product page scraping');
    }

    // =========================================================================
    // STEP 3: Apply fallback enrichments (pattern matching for remaining products)
    // =========================================================================
    if (tasks.includes('enrich') || tasks.includes('tds') || tasks.includes('colors') || tasks.includes('settings')) {
      console.log('[ANYCUBIC-SYNC] Step 3: Applying fallback Anycubic-specific enrichments...');

      // Fetch Anycubic filaments that still need enrichment after scraping
      let query = supabase
        .from('filaments')
        .select('id, product_title, tds_url, material, finish_type, color_hex, color_family, nozzle_temp_min_c, nozzle_temp_max_c, bed_temp_min_c, bed_temp_max_c, high_speed_capable, is_nozzle_abrasive')
        .ilike('vendor', '%anycubic%')
        .limit(limit);

      // If not forcing, only get products that need enrichment
      if (!forceEnrichment) {
        query = query.or('tds_url.is.null,nozzle_temp_min_c.is.null,color_hex.is.null,finish_type.is.null');
      }

      const { data: filaments, error: fetchError } = await query;

      if (fetchError) {
        throw new Error(`Failed to fetch filaments: ${fetchError.message}`);
      }

      console.log(`[ANYCUBIC-SYNC] Found ${filaments?.length || 0} filaments needing fallback enrichment`);

      for (const filament of filaments || []) {
        const changes: string[] = [];
        const updateData: Record<string, any> = {};

        // Apply enrichment using pattern matching
        const enrichment = enrichAnycubicProduct(
          filament.product_title,
          filament.material,
          filament.tds_url,
          filament.nozzle_temp_min_c,
          filament.nozzle_temp_max_c,
          filament.bed_temp_min_c,
          filament.bed_temp_max_c
        );

        // TDS URL (fallback to pattern matching)
        if (!filament.tds_url && enrichment.tdsUrl && (tasks.includes('enrich') || tasks.includes('tds'))) {
          updateData.tds_url = enrichment.tdsUrl;
          changes.push(`TDS: ${enrichment.tdsSource}`);
          tdsFound++;
        }

        // Print settings (fallback to defaults)
        if (tasks.includes('enrich') || tasks.includes('settings')) {
          if (!filament.nozzle_temp_min_c && enrichment.nozzleTempMin) {
            updateData.nozzle_temp_min_c = enrichment.nozzleTempMin;
            changes.push(`nozzle_min: ${enrichment.nozzleTempMin}`);
          }
          if (!filament.nozzle_temp_max_c && enrichment.nozzleTempMax) {
            updateData.nozzle_temp_max_c = enrichment.nozzleTempMax;
            changes.push(`nozzle_max: ${enrichment.nozzleTempMax}`);
          }
          if (!filament.bed_temp_min_c && enrichment.bedTempMin) {
            updateData.bed_temp_min_c = enrichment.bedTempMin;
            changes.push(`bed_min: ${enrichment.bedTempMin}`);
          }
          if (!filament.bed_temp_max_c && enrichment.bedTempMax) {
            updateData.bed_temp_max_c = enrichment.bedTempMax;
            changes.push(`bed_max: ${enrichment.bedTempMax}`);
          }
          
          if (Object.keys(updateData).some(k => k.includes('temp'))) {
            settingsApplied++;
          }
        }

        // Finish type
        if (!filament.finish_type && enrichment.finishType !== 'Standard' && (tasks.includes('enrich'))) {
          updateData.finish_type = enrichment.finishType;
          changes.push(`finish: ${enrichment.finishType}`);
        }

        // Material normalization
        if (!filament.material && enrichment.material && (tasks.includes('enrich'))) {
          updateData.material = enrichment.material;
          changes.push(`material: ${enrichment.material}`);
        }

        // Product line ID
        if (tasks.includes('enrich')) {
          const productLineId = generateAnycubicProductLineId(filament.product_title, filament.material);
          updateData.product_line_id = productLineId;
        }

        // High speed flag
        if (enrichment.highSpeedCapable && !filament.high_speed_capable) {
          updateData.high_speed_capable = true;
          changes.push('high_speed: true');
        }

        // Abrasive nozzle flag
        if (enrichment.isAbrasive && !filament.is_nozzle_abrasive) {
          updateData.is_nozzle_abrasive = true;
          changes.push('abrasive: true');
        }

        // Color hex fix (fallback)
        if (!filament.color_hex && (tasks.includes('enrich') || tasks.includes('colors'))) {
          // Try Anycubic-specific colors first
          const colorName = extractColorFromTitle(filament.product_title);
          if (colorName) {
            const anycubicHex = getAnycubicColorHex(colorName);
            const genericHex = anycubicHex || getColorHex(colorName);
            if (genericHex) {
              updateData.color_hex = genericHex.startsWith('#') ? genericHex : `#${genericHex}`;
              changes.push(`color: ${colorName} → ${updateData.color_hex}`);
              colorsFixed++;
            }
          }
        }

        // Color family fix
        if (!filament.color_family && (filament.color_hex || updateData.color_hex) && (tasks.includes('enrich') || tasks.includes('colors'))) {
          const colorName = extractColorFromTitle(filament.product_title);
          if (colorName) {
            const family = getColorFamily(colorName);
            if (family) {
              updateData.color_family = family;
              changes.push(`family: ${family}`);
            }
          }
        }

        // Apply updates if not dry run
        if (Object.keys(updateData).length > 0) {
          if (!dryRun) {
            updateData.updated_at = new Date().toISOString();
            
            const { error: updateError } = await supabase
              .from('filaments')
              .update(updateData)
              .eq('id', filament.id);

            if (updateError) {
              console.error(`[ANYCUBIC-SYNC] Update failed for ${filament.id}:`, updateError.message);
              changes.push(`ERROR: ${updateError.message}`);
            }
          }

          enrichmentResults.push({
            id: filament.id,
            title: filament.product_title,
            changes,
            tdsFound: !!updateData.tds_url,
            settingsApplied: Object.keys(updateData).some(k => k.includes('temp')),
            colorFixed: !!updateData.color_hex,
          });
        }
      }
    }

    // =========================================================================
    // STEP 4: Fix duplicate hex codes
    // =========================================================================
    if (!dryRun && (tasks.includes('enrich') || tasks.includes('colors'))) {
      console.log('[ANYCUBIC-SYNC] Step 4: Validating and fixing duplicate hex codes...');
      
      try {
        const { data: duplicates } = await supabase.rpc('find_duplicate_hexes', {
          p_vendor: 'Anycubic',
        });

        if (duplicates && duplicates.length > 0) {
          console.log(`[ANYCUBIC-SYNC] Found ${duplicates.length} products with duplicate hex codes`);
          
          // Group by product_line_id
          const grouped = new Map<string, typeof duplicates>();
          for (const dup of duplicates) {
            const key = dup.product_line_id;
            if (!grouped.has(key)) {
              grouped.set(key, []);
            }
            grouped.get(key)!.push(dup);
          }

          // Fix each group
          for (const [productLineId, products] of grouped) {
            for (let i = 0; i < products.length; i++) {
              if (i === 0) continue; // Keep first one as-is
              
              const product = products[i];
              const originalHex = product.color_hex || '#CCCCCC';
              
              // Generate deterministic hash-based hex
              const hash = simpleHash(product.id + product.product_title);
              const newHex = `#${hash.slice(0, 6).toUpperCase()}`;
              
              const { error } = await supabase
                .from('filaments')
                .update({ color_hex: newHex })
                .eq('id', product.id);

              if (!error) {
                duplicatesFixed++;
                console.log(`[ANYCUBIC-SYNC] Fixed duplicate: ${product.product_title.slice(0, 40)} ${originalHex} → ${newHex}`);
              }
            }
          }
        }
      } catch (err) {
        console.error('[ANYCUBIC-SYNC] Duplicate fix error:', err);
      }
    }

    // =========================================================================
    // STEP 5: Trigger TDS parsing for TD (transmission distance) extraction
    // =========================================================================
    if (!dryRun && (tasks.includes('parse-tds') || triggerTdsParsing)) {
      console.log('[ANYCUBIC-SYNC] Step 5: Triggering TDS parsing for TD values...');
      
      try {
        // Find Anycubic filaments with TDS URL but no transmission_distance
        const { data: needsParsing, error: queryError } = await supabase
          .from('filaments')
          .select('id, product_title, tds_url')
          .ilike('vendor', '%anycubic%')
          .not('tds_url', 'is', null)
          .is('transmission_distance', null)
          .limit(20); // Batch size for TDS parsing

        if (queryError) {
          console.error('[ANYCUBIC-SYNC] Error querying for TDS parsing:', queryError.message);
        } else if (needsParsing && needsParsing.length > 0) {
          console.log(`[ANYCUBIC-SYNC] Found ${needsParsing.length} filaments needing TDS parsing`);
          
          // Trigger the TDS parsing function
          try {
            const parseResponse = await fetch(`${supabaseUrl}/functions/v1/parse-filament-tds`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': authHeader,
              },
              body: JSON.stringify({
                vendor: 'Anycubic',
                dryRun: false,
                limit: 20,
                forceReparse: false,
              }),
            });

            if (parseResponse.ok) {
              const parseResult = await parseResponse.json();
              tdsParsed = parseResult.parsed || 0;
              console.log(`[ANYCUBIC-SYNC] TDS parsing complete: ${tdsParsed} documents parsed`);
            } else {
              console.warn('[ANYCUBIC-SYNC] TDS parsing returned non-OK status');
            }
          } catch (parseErr) {
            console.error('[ANYCUBIC-SYNC] TDS parsing error:', parseErr);
          }
        } else {
          console.log('[ANYCUBIC-SYNC] No filaments need TDS parsing');
        }
      } catch (err) {
        console.error('[ANYCUBIC-SYNC] TDS parsing trigger error:', err);
      }
    }

    const duration = Math.round((Date.now() - startTime) / 1000);
    
    console.log('[ANYCUBIC-SYNC] ═══════════════════════════════════════════════════════');
    console.log(`[ANYCUBIC-SYNC] ✅ COMPLETED in ${duration}s`);
    console.log(`[ANYCUBIC-SYNC] Details Scraped: ${detailsScraped}, TDS Found: ${tdsFound}, Settings Applied: ${settingsApplied}`);
    console.log(`[ANYCUBIC-SYNC] Colors Fixed: ${colorsFixed}, Duplicates Fixed: ${duplicatesFixed}, TDS Parsed: ${tdsParsed}`);
    console.log('[ANYCUBIC-SYNC] ═══════════════════════════════════════════════════════');

    return new Response(JSON.stringify({
      success: true,
      dryRun,
      duration,
      sync: syncResult?.summary || null,
      enrichment: {
        processed: enrichmentResults.length,
        detailsScraped,
        tdsFound,
        settingsApplied,
        colorsFixed,
        duplicatesFixed,
        tdsParsed,
        details: enrichmentResults.slice(0, 50), // Limit response size
      },
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('[ANYCUBIC-SYNC] ❌ Fatal error:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

// ============================================================================
// FIRECRAWL SCRAPING FUNCTIONS
// ============================================================================

/**
 * Scrape Anycubic product page for TDS URL, color hex table, and print settings
 */
async function scrapeAnycubicProductDetails(productUrl: string, firecrawlKey: string): Promise<ScrapedDetails | null> {
  try {
    console.log(`[ANYCUBIC-SCRAPE] Scraping ${productUrl}`);
    
    const response = await fetch('https://api.firecrawl.dev/v1/scrape', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${firecrawlKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        url: productUrl,
        formats: ['markdown', 'html'],
        onlyMainContent: false,
        waitFor: 2000,
      }),
    });

    if (!response.ok) {
      console.error(`[ANYCUBIC-SCRAPE] Firecrawl error: ${response.status}`);
      return null;
    }

    const data = await response.json();
    const html = data.data?.html || data.html || '';
    const markdown = data.data?.markdown || data.markdown || '';
    
    const details: ScrapedDetails = {};

    // Extract TDS URL from HTML
    // Pattern: Download TDS File with link to PDF
    const tdsPatterns = [
      /href="([^"]*TDS[^"]*\.pdf)"/i,
      /href="([^"]*technical[^"]*data[^"]*sheet[^"]*\.pdf)"/i,
      /(https:\/\/cdn\.shopify\.com\/s\/files\/[^"'\s]*TDS[^"'\s]*\.pdf)/i,
      /(https:\/\/cdn\.shopify\.com\/s\/files\/[^"'\s]*\.pdf)/i,
    ];
    
    for (const pattern of tdsPatterns) {
      const match = html.match(pattern);
      if (match?.[1]) {
        details.tdsUrl = match[1];
        console.log(`[ANYCUBIC-SCRAPE] Found TDS URL: ${details.tdsUrl}`);
        break;
      }
    }

    // Extract printing temperature from page content
    // Pattern: "Printing Temperature: 190-230℃" or "Printing Temperature190-230℃"
    const tempPatterns = [
      /Printing\s*Temperature[:\s]*(\d+)\s*[-–]\s*(\d+)\s*[°℃]/i,
      /Nozzle\s*Temperature[:\s]*(\d+)\s*[-–]\s*(\d+)\s*[°℃]/i,
      /Print(?:ing)?\s*Temp[:\s]*(\d+)\s*[-–]\s*(\d+)/i,
    ];
    
    for (const pattern of tempPatterns) {
      const match = (html + markdown).match(pattern);
      if (match?.[1] && match?.[2]) {
        details.printingTempMin = parseInt(match[1], 10);
        details.printingTempMax = parseInt(match[2], 10);
        console.log(`[ANYCUBIC-SCRAPE] Found print temp: ${details.printingTempMin}-${details.printingTempMax}°C`);
        break;
      }
    }

    // Extract bed temperature
    const bedPatterns = [
      /Bed\s*Temperature[:\s]*(\d+)\s*[-–]\s*(\d+)\s*[°℃]/i,
      /Platform\s*Temperature[:\s]*(\d+)\s*[-–]\s*(\d+)\s*[°℃]/i,
      /Heat(?:ed)?\s*Bed[:\s]*(\d+)\s*[-–]\s*(\d+)/i,
    ];
    
    for (const pattern of bedPatterns) {
      const match = (html + markdown).match(pattern);
      if (match?.[1] && match?.[2]) {
        details.bedTempMin = parseInt(match[1], 10);
        details.bedTempMax = parseInt(match[2], 10);
        console.log(`[ANYCUBIC-SCRAPE] Found bed temp: ${details.bedTempMin}-${details.bedTempMax}°C`);
        break;
      }
    }

    // Extract density
    const densityMatch = (html + markdown).match(/Density[:\s]*(\d+\.?\d*)\s*g\/cm/i);
    if (densityMatch?.[1]) {
      details.density = parseFloat(densityMatch[1]);
    }

    // Extract color hex table
    // Pattern in Anycubic pages: "Color\tHex Code\tDisplay\nRed\t#CE3845\t..."
    const colorTableMatch = markdown.match(/Color\s*\|?\s*Hex\s*Code.*?\n([\s\S]*?)(?:\n\n|\n#|\n\*\*|$)/i);
    if (colorTableMatch?.[1]) {
      details.colorHexTable = {};
      const rows = colorTableMatch[1].split('\n');
      for (const row of rows) {
        // Parse: "Red | #CE3845" or "Red\t#CE3845" or "Red #CE3845"
        const colorMatch = row.match(/([A-Za-z\s]+?)\s*[|\t]\s*(#[A-Fa-f0-9]{6})/);
        if (colorMatch?.[1] && colorMatch?.[2]) {
          const colorName = colorMatch[1].trim().toLowerCase();
          details.colorHexTable[colorName] = colorMatch[2].toUpperCase();
        }
      }
      
      if (Object.keys(details.colorHexTable).length > 0) {
        console.log(`[ANYCUBIC-SCRAPE] Found ${Object.keys(details.colorHexTable).length} colors in table`);
      }
    }

    // Extract drying conditions
    const dryTempMatch = (html + markdown).match(/Dry(?:ing)?\s*Temp(?:erature)?[:\s]*(\d+)\s*[°℃]/i);
    if (dryTempMatch?.[1]) {
      details.dryingTemp = parseInt(dryTempMatch[1], 10);
    }
    
    const dryTimeMatch = (html + markdown).match(/Dry(?:ing)?\s*Time[:\s]*(\d+)\s*(?:h|hour)/i);
    if (dryTimeMatch?.[1]) {
      details.dryingTime = parseInt(dryTimeMatch[1], 10);
    }

    return details;
  } catch (err) {
    console.error(`[ANYCUBIC-SCRAPE] Error scraping ${productUrl}:`, err);
    return null;
  }
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Extract color name from product title
 */
function extractColorFromTitle(title: string): string | null {
  if (!title) return null;
  
  // Common patterns: "PLA Black", "PETG - Blue", "Silk PLA Gold"
  const titleLower = title.toLowerCase();
  
  // Remove material types to find color
  const withoutMaterial = titleLower
    .replace(/\b(pla|petg|abs|tpu|asa|nylon|pa|pc)\+?\b/gi, '')
    .replace(/\b(silk|matte|glow|marble|high\s*speed|hs)\b/gi, '')
    .replace(/\b(basic|pro|plus)\b/gi, '')
    .replace(/\b(1\.75|2\.85)\s*mm\b/gi, '')
    .replace(/\b\d+\s*(kg|g)\b/gi, '')
    .replace(/[-–]/g, ' ')
    .trim();
  
  // Get the remaining words as potential color
  const words = withoutMaterial.split(/\s+/).filter(w => w.length > 2);
  
  if (words.length > 0) {
    return words.join(' ').trim();
  }
  
  return null;
}

/**
 * Find matching color hex from scraped color table
 */
function findMatchingColorHex(colorName: string, colorTable: Record<string, string>): string | null {
  const normalizedColor = colorName.toLowerCase().trim();
  
  // Direct match
  if (colorTable[normalizedColor]) {
    return colorTable[normalizedColor];
  }
  
  // Partial match
  for (const [tableColor, hex] of Object.entries(colorTable)) {
    if (normalizedColor.includes(tableColor) || tableColor.includes(normalizedColor)) {
      return hex;
    }
  }
  
  return null;
}

/**
 * Simple hash function for generating deterministic hex codes
 */
function simpleHash(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return Math.abs(hash).toString(16).padStart(6, '0');
}
