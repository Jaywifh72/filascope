/**
 * ============================================================================
 * [BRAND_NAME] BRAND-SPECIFIC SYNC FUNCTION TEMPLATE
 * ============================================================================
 * 
 * SETUP INSTRUCTIONS:
 * 1. Copy this folder to: supabase/functions/sync-[brand-slug]-products/
 * 2. Find and replace all placeholders:
 *    - [BRAND_NAME] → Your brand name (e.g., "Sunlu")
 *    - [BRAND_UPPER] → Uppercase brand (e.g., "SUNLU")
 *    - [Brand] → PascalCase brand (e.g., "Sunlu")
 *    - [brand] → lowercase brand (e.g., "sunlu")
 *    - [brand-slug] → URL-safe brand slug (e.g., "sunlu")
 * 3. Update imports to point to your brand's defaults file
 * 4. Add entry to supabase/config.toml:
 *    [functions.sync-[brand-slug]-products]
 *    verify_jwt = false
 * 
 * PIPELINE OVERVIEW:
 * 1. Base sync via sync-brand-products (variant explosion)
 * 2. Product detail scraping via Firecrawl (optional)
 * 3. Brand-specific enrichments (fallback patterns)
 * 4. Duplicate hex code fixes
 * 5. TDS parsing trigger
 * 
 * REFERENCE IMPLEMENTATIONS:
 * - sync-anycubic-products (comprehensive, all features)
 * - sync-amolen-products (product line segmentation focus)
 * ============================================================================
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.1';

// ============================================================================
// BRAND DEFAULTS IMPORTS
// ============================================================================
// TODO: Update this import path to your brand's defaults file
/*
import {
  enrich[Brand]Product,
  match[Brand]Tds,
  get[Brand]PrintSettings,
  extractFinishType,
  normalize[Brand]Material,
  get[Brand]ColorHex,
  generate[Brand]ProductLineId,
  clean[Brand]Title,
  isPromotionalProduct,
  [Brand]EnrichmentResult,
} from '../_shared/[brand-slug]-defaults.ts';
*/

// Shared utilities
import { getColorHex, getColorFamily } from '../_shared/color-mapping.ts';
import { enrichGenericProduct } from '../_shared/generic-brand-defaults.ts';

// ============================================================================
// CONFIGURATION
// ============================================================================

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

/**
 * Brand configuration - UPDATE THESE VALUES
 */
const BRAND_CONFIG = {
  name: '[BRAND_NAME]',
  slug: '[brand-slug]',
  vendorName: '[Brand]', // As stored in filaments.vendor column
  
  // Supported regions for regional price sync
  supportedRegions: ['US', 'CA', 'UK', 'EU', 'AU'] as const,
  
  // Default limits
  defaultLimit: 500,
  scrapeLimit: 50, // Max products to scrape details for
  
  // Rate limiting
  rateLimitMs: 1000, // Delay between Firecrawl requests
};

/**
 * Admin user IDs allowed to run this sync
 * TODO: Add your admin user IDs here
 */
const ADMIN_USER_IDS = [
  // 'your-admin-user-id-here',
];

// ============================================================================
// TYPES
// ============================================================================

interface SyncRequest {
  /** Run without making database changes */
  dryRun?: boolean;
  /** Maximum products to process */
  limit?: number;
  /** Regions to sync (default: all supported) */
  regions?: string[];
  /** Force enrichment even if data exists */
  forceEnrichment?: boolean;
  /** Specific tasks to run (default: all) */
  tasks?: SyncTask[];
  /** Scrape product detail pages */
  scrapeDetails?: boolean;
  /** Trigger TDS parsing after sync */
  triggerTdsParsing?: boolean;
}

type SyncTask = 
  | 'sync'           // Run base sync via sync-brand-products
  | 'enrich'         // Apply brand-specific enrichments
  | 'fix-colors'     // Fix duplicate hex codes
  | 'scrape-details' // Scrape product pages for TDS/colors
  | 'parse-tds';     // Trigger TDS parsing

interface SyncResult {
  success: boolean;
  message: string;
  stats: {
    totalProducts: number;
    enriched: number;
    colorsFixed: number;
    tdsMatched: number;
    settingsApplied: number;
    errors: number;
  };
  tasks: Record<SyncTask, { success: boolean; message: string }>;
  dryRun: boolean;
  duration: number;
}

// ============================================================================
// MAIN HANDLER
// ============================================================================

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const startTime = Date.now();
  const logs: string[] = [];
  const log = (msg: string) => {
    console.log(`[${BRAND_CONFIG.name}] ${msg}`);
    logs.push(msg);
  };

  try {
    // Parse request
    const body: SyncRequest = await req.json().catch(() => ({}));
    const {
      dryRun = false,
      limit = BRAND_CONFIG.defaultLimit,
      regions = [...BRAND_CONFIG.supportedRegions],
      forceEnrichment = false,
      tasks = ['sync', 'enrich', 'fix-colors'],
      scrapeDetails = false,
      triggerTdsParsing = false,
    } = body;

    log(`Starting sync: dryRun=${dryRun}, limit=${limit}, regions=${regions.join(',')}`);
    log(`Tasks: ${tasks.join(', ')}`);

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Verify admin authorization (optional - remove if public access needed)
    /*
    const authHeader = req.headers.get('Authorization');
    if (ADMIN_USER_IDS.length > 0) {
      if (!authHeader) {
        return new Response(
          JSON.stringify({ error: 'Authorization required' }),
          { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      const { data: { user }, error: authError } = await supabase.auth.getUser(
        authHeader.replace('Bearer ', '')
      );
      
      if (authError || !user || !ADMIN_USER_IDS.includes(user.id)) {
        return new Response(
          JSON.stringify({ error: 'Unauthorized - admin access required' }),
          { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      log(`Authorized admin: ${user.id}`);
    }
    */

    // Initialize result tracking
    const result: SyncResult = {
      success: true,
      message: '',
      stats: {
        totalProducts: 0,
        enriched: 0,
        colorsFixed: 0,
        tdsMatched: 0,
        settingsApplied: 0,
        errors: 0,
      },
      tasks: {} as Record<SyncTask, { success: boolean; message: string }>,
      dryRun,
      duration: 0,
    };

    // ========================================================================
    // STEP 1: BASE SYNC via sync-brand-products
    // ========================================================================
    if (tasks.includes('sync')) {
      log('STEP 1: Running base sync via sync-brand-products...');
      
      try {
        const syncResponse = await supabase.functions.invoke('sync-brand-products', {
          body: {
            brandSlug: BRAND_CONFIG.slug,
            dryRun,
            limit,
            // Enable variant explosion for this brand
            forceVariantExplosion: true,
          },
        });

        if (syncResponse.error) {
          throw new Error(syncResponse.error.message);
        }

        const syncData = syncResponse.data;
        result.stats.totalProducts = syncData?.stats?.total || 0;
        result.tasks.sync = {
          success: true,
          message: `Synced ${syncData?.stats?.created || 0} created, ${syncData?.stats?.updated || 0} updated`,
        };
        
        log(`Base sync complete: ${result.tasks.sync.message}`);
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : 'Unknown error';
        log(`ERROR in base sync: ${errorMsg}`);
        result.tasks.sync = { success: false, message: errorMsg };
        result.stats.errors++;
      }
    }

    // ========================================================================
    // STEP 2: SCRAPE PRODUCT DETAILS (optional)
    // ========================================================================
    if (tasks.includes('scrape-details') || scrapeDetails) {
      log('STEP 2: Scraping product detail pages...');
      
      try {
        // Get products that need detail scraping
        const { data: products, error: fetchError } = await supabase
          .from('filaments')
          .select('id, product_title, product_url, tds_url, color_hex')
          .ilike('vendor', BRAND_CONFIG.vendorName)
          .not('product_url', 'is', null)
          .or('tds_url.is.null,color_hex.is.null')
          .limit(Math.min(limit, BRAND_CONFIG.scrapeLimit));

        if (fetchError) throw fetchError;
        
        log(`Found ${products?.length || 0} products needing detail scrape`);
        
        let scraped = 0;
        for (const product of products || []) {
          try {
            // Scrape product page via Firecrawl
            const scrapeResponse = await supabase.functions.invoke('scrape-brand-data', {
              body: {
                url: product.product_url,
                extractTds: true,
                extractColors: true,
              },
            });

            if (scrapeResponse.data?.tdsUrl || scrapeResponse.data?.colorHex) {
              if (!dryRun) {
                await supabase
                  .from('filaments')
                  .update({
                    tds_url: scrapeResponse.data.tdsUrl || product.tds_url,
                    color_hex: scrapeResponse.data.colorHex || product.color_hex,
                    last_scraped_at: new Date().toISOString(),
                  })
                  .eq('id', product.id);
              }
              scraped++;
            }

            // Rate limiting
            await new Promise(r => setTimeout(r, BRAND_CONFIG.rateLimitMs));
          } catch (scrapeError) {
            log(`Failed to scrape ${product.product_url}: ${scrapeError}`);
          }
        }

        result.tasks['scrape-details'] = {
          success: true,
          message: `Scraped ${scraped}/${products?.length || 0} products`,
        };
        
        log(`Detail scraping complete: ${result.tasks['scrape-details'].message}`);
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : 'Unknown error';
        log(`ERROR in detail scraping: ${errorMsg}`);
        result.tasks['scrape-details'] = { success: false, message: errorMsg };
        result.stats.errors++;
      }
    }

    // ========================================================================
    // STEP 3: APPLY BRAND-SPECIFIC ENRICHMENTS
    // ========================================================================
    if (tasks.includes('enrich')) {
      log('STEP 3: Applying brand-specific enrichments...');
      
      try {
        // Build query for products needing enrichment
        let query = supabase
          .from('filaments')
          .select('*')
          .ilike('vendor', BRAND_CONFIG.vendorName);

        if (!forceEnrichment) {
          // Only enrich products missing key data
          query = query.or(
            'tds_url.is.null,nozzle_temp_min_c.is.null,product_line_id.is.null,finish_type.is.null'
          );
        }

        const { data: products, error: fetchError } = await query.limit(limit);
        if (fetchError) throw fetchError;

        log(`Found ${products?.length || 0} products for enrichment`);

        let enriched = 0;
        let tdsMatched = 0;
        let settingsApplied = 0;

        for (const product of products || []) {
          try {
             // TODO: Uncomment and use your brand's enrichment function instead
            /*
            const enrichment = enrich[Brand]Product(
              product.product_title,
              product.material,
              product.tds_url,
              product.nozzle_temp_min_c,
              product.nozzle_temp_max_c,
              product.bed_temp_min_c,
              product.bed_temp_max_c,
              null // color name if available
            );
            */
            
            // Generic fallback enrichment — provides material-based temp defaults,
            // finish type detection, high-speed & abrasive flags for any brand.
            const enrichment = enrichGenericProduct(
              product.product_title,
              product.material,
              product.tds_url,
              product.nozzle_temp_min_c,
              product.nozzle_temp_max_c,
              product.bed_temp_min_c,
              product.bed_temp_max_c,
              null, // color name if available
              BRAND_CONFIG.slug,
            );

            // Track what was enriched
            if (enrichment.tdsUrl && !product.tds_url) tdsMatched++;
            if (enrichment.nozzleTempMin && !product.nozzle_temp_min_c) settingsApplied++;

            if (!dryRun) {
              const updateData: Record<string, unknown> = {};
              
              // Only update fields that are missing or being forced
              if (!product.tds_url && enrichment.tdsUrl) {
                updateData.tds_url = enrichment.tdsUrl;
              }
              if (!product.nozzle_temp_min_c && enrichment.nozzleTempMin) {
                updateData.nozzle_temp_min_c = enrichment.nozzleTempMin;
              }
              if (!product.nozzle_temp_max_c && enrichment.nozzleTempMax) {
                updateData.nozzle_temp_max_c = enrichment.nozzleTempMax;
              }
              if (!product.bed_temp_min_c && enrichment.bedTempMin) {
                updateData.bed_temp_min_c = enrichment.bedTempMin;
              }
              if (!product.bed_temp_max_c && enrichment.bedTempMax) {
                updateData.bed_temp_max_c = enrichment.bedTempMax;
              }
              if (!product.finish_type) {
                updateData.finish_type = enrichment.finishType;
              }
              if (!product.product_line_id) {
                updateData.product_line_id = enrichment.productLineId;
              }
              if (!product.high_speed_capable) {
                updateData.high_speed_capable = enrichment.highSpeedCapable;
              }
              if (!product.is_nozzle_abrasive) {
                updateData.is_nozzle_abrasive = enrichment.isAbrasive;
              }

              if (Object.keys(updateData).length > 0) {
                updateData.updated_at = new Date().toISOString();
                
                const { error: updateError } = await supabase
                  .from('filaments')
                  .update(updateData)
                  .eq('id', product.id);

                if (updateError) throw updateError;
                enriched++;
              }
            } else {
              enriched++;
            }
          } catch (productError) {
            log(`Failed to enrich ${product.id}: ${productError}`);
            result.stats.errors++;
          }
        }

        result.stats.enriched = enriched;
        result.stats.tdsMatched = tdsMatched;
        result.stats.settingsApplied = settingsApplied;
        
        result.tasks.enrich = {
          success: true,
          message: `Enriched ${enriched} products (TDS: ${tdsMatched}, Settings: ${settingsApplied})`,
        };
        
        log(`Enrichment complete: ${result.tasks.enrich.message}`);
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : 'Unknown error';
        log(`ERROR in enrichment: ${errorMsg}`);
        result.tasks.enrich = { success: false, message: errorMsg };
        result.stats.errors++;
      }
    }

    // ========================================================================
    // STEP 4: FIX DUPLICATE HEX CODES
    // ========================================================================
    if (tasks.includes('fix-colors')) {
      log('STEP 4: Fixing duplicate hex codes...');
      
      try {
        // Find duplicate hexes within product lines
        const { data: duplicates, error: dupError } = await supabase
          .rpc('find_duplicate_hexes', { p_vendor: BRAND_CONFIG.vendorName });

        if (dupError) throw dupError;
        
        log(`Found ${duplicates?.length || 0} products with duplicate hexes`);

        let fixed = 0;
        if (duplicates && duplicates.length > 0 && !dryRun) {
          // Group by product_line_id
          const groupedDupes = new Map<string, typeof duplicates>();
          for (const dup of duplicates) {
            const key = dup.product_line_id;
            if (!groupedDupes.has(key)) {
              groupedDupes.set(key, []);
            }
            groupedDupes.get(key)!.push(dup);
          }

          // Fix each group
          for (const [productLineId, dupes] of groupedDupes) {
            // Keep first, generate unique hex for others
            for (let i = 1; i < dupes.length; i++) {
              const dup = dupes[i];
              // Generate deterministic unique hex based on product ID
              const uniqueHex = generateDeterministicHex(dup.id, dup.color_hex);
              
              const { error: updateError } = await supabase
                .from('filaments')
                .update({ color_hex: uniqueHex })
                .eq('id', dup.id);

              if (!updateError) fixed++;
            }
          }
        }

        result.stats.colorsFixed = fixed;
        result.tasks['fix-colors'] = {
          success: true,
          message: `Fixed ${fixed} duplicate hex codes`,
        };
        
        log(`Color fix complete: ${result.tasks['fix-colors'].message}`);
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : 'Unknown error';
        log(`ERROR in color fix: ${errorMsg}`);
        result.tasks['fix-colors'] = { success: false, message: errorMsg };
        result.stats.errors++;
      }
    }

    // ========================================================================
    // STEP 5: TRIGGER TDS PARSING (optional)
    // ========================================================================
    if (tasks.includes('parse-tds') || triggerTdsParsing) {
      log('STEP 5: Triggering TDS parsing...');
      
      try {
        const tdsResponse = await supabase.functions.invoke('parse-filament-tds', {
          body: {
            vendor: BRAND_CONFIG.vendorName,
            limit: 50,
            dryRun,
          },
        });

        if (tdsResponse.error) {
          throw new Error(tdsResponse.error.message);
        }

        result.tasks['parse-tds'] = {
          success: true,
          message: `TDS parsing triggered: ${tdsResponse.data?.parsed || 0} processed`,
        };
        
        log(`TDS parsing complete: ${result.tasks['parse-tds'].message}`);
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : 'Unknown error';
        log(`ERROR in TDS parsing: ${errorMsg}`);
        result.tasks['parse-tds'] = { success: false, message: errorMsg };
        result.stats.errors++;
      }
    }

    // ========================================================================
    // FINALIZE
    // ========================================================================
    result.duration = Date.now() - startTime;
    result.success = result.stats.errors === 0;
    result.message = result.success 
      ? `${BRAND_CONFIG.name} sync completed successfully in ${result.duration}ms`
      : `${BRAND_CONFIG.name} sync completed with ${result.stats.errors} errors`;

    log(result.message);

    return new Response(
      JSON.stringify({ ...result, logs }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : 'Unknown error';
    log(`FATAL ERROR: ${errorMsg}`);
    
    return new Response(
      JSON.stringify({
        success: false,
        message: errorMsg,
        logs,
        duration: Date.now() - startTime,
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Generates a deterministic but unique hex color based on product ID.
 * Used to differentiate duplicate colors within a product line.
 */
function generateDeterministicHex(productId: string, baseHex: string): string {
  // Simple hash of product ID
  let hash = 0;
  for (let i = 0; i < productId.length; i++) {
    const char = productId.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  
  // Parse base hex
  const cleanHex = (baseHex || 'FFFFFF').replace('#', '');
  const r = parseInt(cleanHex.substring(0, 2), 16) || 128;
  const g = parseInt(cleanHex.substring(2, 4), 16) || 128;
  const b = parseInt(cleanHex.substring(4, 6), 16) || 128;
  
  // Slightly modify based on hash (keep within valid range)
  const offset = (hash % 30) - 15;
  const newR = Math.max(0, Math.min(255, r + offset));
  const newG = Math.max(0, Math.min(255, g + offset));
  const newB = Math.max(0, Math.min(255, b + offset));
  
  return `#${newR.toString(16).padStart(2, '0')}${newG.toString(16).padStart(2, '0')}${newB.toString(16).padStart(2, '0')}`.toUpperCase();
}

/**
 * Delay helper for rate limiting
 */
function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}
