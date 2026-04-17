/**
 * ANYCUBIC WHITELIST-BASED SYNC
 * 
 * A curated sync function for Anycubic that:
 * 1. Iterates through the official product whitelist
 * 2. Fetches products in parallel batches from Shopify JSON API
 * 3. Extracts all color variants with prices
 * 4. Applies Anycubic-specific enrichments (TDS, settings, colors)
 * 5. Batch upserts to filaments table
 * 6. Logs all decisions for Post Sync Check analysis
 * 
 * Uses EdgeRuntime.waitUntil() for background processing to prevent timeouts.
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.1';
import {
  ANYCUBIC_PRODUCT_WHITELIST,
  enrichAnycubicProduct,
  getAnycubicColorHex,
  generateAnycubicProductLineId,
  ANYCUBIC_PRINT_SETTINGS,
} from '../_shared/anycubic-defaults.ts';
import { getColorHex, getColorFamily } from '../_shared/color-mapping.ts';
import { createDecisionLogger } from '../_shared/decision-logger.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Multi-region store support - US first, fallback to CA
const ANYCUBIC_STORES = [
  { region: 'US', baseUrl: 'https://store.anycubic.com' },
  { region: 'CA', baseUrl: 'https://ca.anycubic.com' },
];
const VENDOR_NAME = 'Anycubic';

// Parallel batch size for fetching products
const FETCH_BATCH_SIZE = 5;
// Batch size for database upserts
const DB_BATCH_SIZE = 100;

// Firecrawl API for HTML scraping
const FIRECRAWL_API_KEY = Deno.env.get('FIRECRAWL_API_KEY');

interface SyncRequest {
  dryRun?: boolean;
  cleanSlate?: boolean;
  limit?: number;
}

interface ScrapedPageData {
  pageTitle: string | null;
  colorSwatches: string[];
}

interface VariantResult {
  productId: string;
  variantId: string;
  title: string;
  colorName: string;
  price: number;
  compareAtPrice: number | null;
  available: boolean;
  imageUrl: string | null;
  productUrl: string;
  productLineId: string;
  material: string;
  finishType: string;
  colorHex: string | null;
  colorFamily: string | null;
}

interface FilamentData {
  product_id: string;
  product_title: string;
  vendor: string;
  product_line_id: string;
  material: string;
  finish_type: string;
  color_family: string | null;
  color_hex: string | null;
  variant_price: number;
  variant_compare_at_price: number | null;
  variant_available: boolean;
  product_url: string;
  featured_image: string | null;
  diameter_nominal_mm: number;
  net_weight_g: number;
  auto_created: boolean;
  auto_updated: boolean;
  last_scraped_at: string;
  updated_at: string;
  sync_status: string;
  nozzle_temp_min_c: number | null;
  nozzle_temp_max_c: number | null;
  bed_temp_min_c: number | null;
  bed_temp_max_c: number | null;
  high_speed_capable: boolean;
}

declare const EdgeRuntime: {
  waitUntil: (promise: Promise<unknown>) => void;
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
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

    const { dryRun = false, cleanSlate = false, limit } = body;

    // Create sync log entry immediately
    const { data: syncLog, error: syncLogError } = await supabase
      .from('brand_sync_logs')
      .insert({
        brand_slug: 'anycubic',
        sync_type: cleanSlate ? 'clean_slate' : 'incremental',
        status: 'running',
        triggered_by: 'admin',
        triggered_by_user: user.id,
      })
      .select()
      .single();

    if (syncLogError) {
      console.error('[ANYCUBIC-SYNC] Failed to create sync log:', syncLogError.message);
    }

    const syncLogId = syncLog?.id;

    // Return immediate response - sync runs in background
    const immediateResponse = new Response(JSON.stringify({
      success: true,
      message: 'Anycubic sync started in background',
      syncLogId,
      checkStatus: 'Check brand_sync_logs table for progress',
      dryRun,
      cleanSlate,
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

    // Run the actual sync in background
    const syncPromise = runSync(supabase, { dryRun, cleanSlate, limit }, syncLogId, user.id);
    
    // Use EdgeRuntime.waitUntil if available, otherwise just run the promise
    if (typeof EdgeRuntime !== 'undefined' && EdgeRuntime.waitUntil) {
      EdgeRuntime.waitUntil(syncPromise);
    } else {
      // Fallback: don't await, just start the promise
      syncPromise.catch(err => console.error('[ANYCUBIC-SYNC] Background sync error:', err));
    }

    return immediateResponse;

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
// BACKGROUND SYNC FUNCTION
// ============================================================================

async function runSync(
  supabase: any,
  options: SyncRequest,
  syncLogId: string | undefined,
  userId: string
): Promise<void> {
  const startTime = Date.now();
  
  console.log('[ANYCUBIC-SYNC] ═══════════════════════════════════════════════════════');
  console.log('[ANYCUBIC-SYNC] 🚀 ANYCUBIC WHITELIST-BASED SYNC STARTED (BACKGROUND)');
  console.log('[ANYCUBIC-SYNC] ═══════════════════════════════════════════════════════');

  const { dryRun = false, cleanSlate = false, limit } = options;

  // Initialize decision logger
  const logger = createDecisionLogger({
    brandSlug: 'anycubic',
    syncLogId,
    maxLogs: 1000,
  });

  // Stats
  let productsProcessed = 0;
  let variantsFound = 0;
  let created = 0;
  let updated = 0;
  let errors = 0;
  const allFilamentData: FilamentData[] = [];

  // Helper to update progress in brand_sync_logs
  const updateProgress = async (stage: string, current: number, total: number, message?: string) => {
    if (!syncLogId) return;
    await supabase
      .from('brand_sync_logs')
      .update({
        products_processed: {
          stage,
          current,
          total,
          message,
          productsProcessed,
          variantsFound,
          created,
          updated,
          errors,
        },
      })
      .eq('id', syncLogId);
  };

  try {
    // =========================================================================
    // STEP 0: Clean Slate (if requested)
    // =========================================================================
    if (cleanSlate && !dryRun) {
      console.log('[ANYCUBIC-SYNC] Step 0: Clean slate - deleting existing Anycubic products...');
      await updateProgress('Deleting existing products', 0, 100, 'Clean slate mode');
      
      const { error: deleteError, count } = await supabase
        .from('filaments')
        .delete()
        .ilike('vendor', '%anycubic%');
      
      if (deleteError) {
        console.error('[ANYCUBIC-SYNC] Delete error:', deleteError.message);
      } else {
        console.log(`[ANYCUBIC-SYNC] Deleted ${count} existing Anycubic products`);
      }
    }

    // =========================================================================
    // STEP 1: Fetch products from whitelist (PARALLEL BATCHES)
    // =========================================================================
    const productLimit = limit || ANYCUBIC_PRODUCT_WHITELIST.length;
    const productsToProcess = ANYCUBIC_PRODUCT_WHITELIST.slice(0, productLimit);
    const totalBatches = Math.ceil(productsToProcess.length / FETCH_BATCH_SIZE);
    
    console.log(`[ANYCUBIC-SYNC] Step 1: Processing ${productsToProcess.length} whitelisted products in parallel batches of ${FETCH_BATCH_SIZE}...`);
    await updateProgress('Fetching products', 0, totalBatches, `Processing ${productsToProcess.length} products`);

    // Process in parallel batches
    for (let i = 0; i < productsToProcess.length; i += FETCH_BATCH_SIZE) {
      const batch = productsToProcess.slice(i, Math.min(i + FETCH_BATCH_SIZE, productsToProcess.length));
      const batchNum = Math.floor(i / FETCH_BATCH_SIZE) + 1;
      
      console.log(`[ANYCUBIC-SYNC] Fetching batch ${batchNum}/${totalBatches}: ${batch.map(p => p.handle).join(', ')}`);
      await updateProgress('Fetching products', batchNum, totalBatches, `Batch ${batchNum}/${totalBatches}: ${batch.map(p => p.displayName).join(', ')}`);

      // Fetch all products in this batch in parallel
      const results = await Promise.allSettled(
        batch.map(product => fetchProduct(product, logger))
      );

      // Process results
      for (let j = 0; j < results.length; j++) {
        const result = results[j];
        const whitelistProduct = batch[j];

        if (result.status === 'rejected') {
          console.error(`[ANYCUBIC-SYNC] Failed to fetch ${whitelistProduct.handle}:`, result.reason);
          errors++;
          continue;
        }

        const { product, variants: fetchedVariants } = result.value;
        if (!product) {
          errors++;
          continue;
        }

        productsProcessed++;
        variantsFound += fetchedVariants.length;

        // Convert variants to filament data
        for (const variant of fetchedVariants) {
          allFilamentData.push(variantToFilamentData(variant, whitelistProduct));
        }
      }

      // Small delay between batches to be respectful
      if (i + FETCH_BATCH_SIZE < productsToProcess.length) {
        await new Promise(r => setTimeout(r, 200));
      }
    }

    console.log(`[ANYCUBIC-SYNC] Step 1 complete: ${productsProcessed} products, ${variantsFound} variants collected`);

    // =========================================================================
    // STEP 2: Batch upsert to database
    // =========================================================================
    if (!dryRun && allFilamentData.length > 0) {
      const dbTotalBatches = Math.ceil(allFilamentData.length / DB_BATCH_SIZE);
      console.log(`[ANYCUBIC-SYNC] Step 2: Batch upserting ${allFilamentData.length} variants in batches of ${DB_BATCH_SIZE}...`);
      await updateProgress('Saving to database', 0, dbTotalBatches, `Upserting ${allFilamentData.length} variants`);

      for (let i = 0; i < allFilamentData.length; i += DB_BATCH_SIZE) {
        const batch = allFilamentData.slice(i, Math.min(i + DB_BATCH_SIZE, allFilamentData.length));
        const batchNum = Math.floor(i / DB_BATCH_SIZE) + 1;

        await updateProgress('Saving to database', batchNum, dbTotalBatches, `Database batch ${batchNum}/${dbTotalBatches}`);

        // Check which product_ids already exist
        const productIds = batch.map(f => f.product_id);
        const { data: existing } = await supabase
          .from('filaments')
          .select('product_id')
          .in('product_id', productIds)
          .ilike('vendor', '%anycubic%');

        const existingIds = new Set(existing?.map((e: any) => e.product_id) || []);
        
        const toInsert = batch.filter(f => !existingIds.has(f.product_id));
        const toUpdate = batch.filter(f => existingIds.has(f.product_id));

        // Insert new records
        if (toInsert.length > 0) {
          const { error: insertError } = await supabase
            .from('filaments')
            .insert(toInsert as any[]);
          
          if (insertError) {
            console.error(`[ANYCUBIC-SYNC] Batch ${batchNum} insert error:`, insertError.message);
            errors += toInsert.length;
          } else {
            created += toInsert.length;
          }
        }

        // Update existing records
        for (const record of toUpdate) {
          const { error: updateError } = await supabase
            .from('filaments')
            .update(record as any)
            .eq('product_id', record.product_id)
            .ilike('vendor', '%anycubic%');
          
          if (updateError) {
            errors++;
          } else {
            updated++;
          }
        }

        console.log(`[ANYCUBIC-SYNC] Batch ${batchNum}/${dbTotalBatches}: ${toInsert.length} inserted, ${toUpdate.length} updated`);
      }
    }

    // =========================================================================
    // STEP 2.5: Stale product cleanup
    // =========================================================================
    if (!dryRun && !cleanSlate) {
      console.log('[ANYCUBIC-SYNC] Step 2.5: Cleaning up stale Anycubic products...');
      const syncedProductIds = new Set(allFilamentData.map(f => f.product_id));

      // Get all current Anycubic products in DB
      const { data: existingProducts } = await supabase
        .from('filaments')
        .select('id, product_id')
        .ilike('vendor', '%anycubic%');

      if (existingProducts && existingProducts.length > 0) {
        const staleProducts = existingProducts.filter(
          (p: any) => !syncedProductIds.has(p.product_id)
        );

        if (staleProducts.length > 0) {
          const staleIds = staleProducts.map((p: any) => p.id);
          console.log(`[ANYCUBIC-SYNC] Found ${staleIds.length} stale products to remove`);

          // Delete in batches of 50
          for (let i = 0; i < staleIds.length; i += 50) {
            const batch = staleIds.slice(i, i + 50);
            const { error: deleteError } = await supabase
              .from('filaments')
              .delete()
              .in('id', batch);

            if (deleteError) {
              console.error('[ANYCUBIC-SYNC] Stale batch delete error:', deleteError);
            } else {
              console.log(`[ANYCUBIC-SYNC] Deleted batch of ${batch.length} stale products`);
            }
          }

          console.log(`[ANYCUBIC-SYNC] Stale cleanup complete: ${staleIds.length} products removed`);
        } else {
          console.log('[ANYCUBIC-SYNC] No stale products found');
        }
      } else {
        console.log('[ANYCUBIC-SYNC] No existing Anycubic products in DB to check for staleness');
      }
    }

    // =========================================================================
    // STEP 3: Save decision logs
    // =========================================================================
    console.log('[ANYCUBIC-SYNC] Step 3: Saving decision logs...');
    const logResult = await logger.saveToDatabase(supabase);
    console.log(`[ANYCUBIC-SYNC] Decision logs: ${logResult.saved} saved, ${logResult.errors} errors`);

    // =========================================================================
    // STEP 4: Update brand statistics
    // =========================================================================
    if (!dryRun) {
      console.log('[ANYCUBIC-SYNC] Step 4: Updating brand statistics...');
      await supabase.rpc('update_brand_product_counts', { p_brand_slug: 'anycubic' });
    }

    const duration = Math.round((Date.now() - startTime) / 1000);
    
    console.log('[ANYCUBIC-SYNC] ═══════════════════════════════════════════════════════');
    console.log(`[ANYCUBIC-SYNC] ✅ COMPLETED in ${duration}s`);
    console.log(`[ANYCUBIC-SYNC] Products: ${productsProcessed}, Variants: ${variantsFound}`);
    console.log(`[ANYCUBIC-SYNC] Created: ${created}, Updated: ${updated}, Errors: ${errors}`);
    console.log(`[ANYCUBIC-SYNC] Decision logs: ${logResult.saved} saved`);
    console.log('[ANYCUBIC-SYNC] ═══════════════════════════════════════════════════════');

    // Update sync log with completion
    if (syncLogId) {
      await supabase
        .from('brand_sync_logs')
        .update({
          status: 'completed',
          completed_at: new Date().toISOString(),
          duration_seconds: duration,
          products_discovered: productsProcessed,
          products_created: created,
          products_updated: updated,
          products_failed: errors,
          success_details: {
            variantsFound,
            decisionLogsSaved: logResult.saved,
            dryRun,
            cleanSlate,
          },
        })
        .eq('id', syncLogId);
    }

  } catch (error) {
    const duration = Math.round((Date.now() - startTime) / 1000);
    console.error('[ANYCUBIC-SYNC] ❌ Sync error:', error);

    // Update sync log with failure
    if (syncLogId) {
      await supabase
        .from('brand_sync_logs')
        .update({
          status: 'failed',
          completed_at: new Date().toISOString(),
          duration_seconds: duration,
          products_discovered: productsProcessed,
          products_created: created,
          products_updated: updated,
          products_failed: errors,
          error_details: {
            error: error instanceof Error ? error.message : 'Unknown error',
            variantsFound,
          },
        })
        .eq('id', syncLogId);
    }
  }
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

interface FetchProductResult {
  product: any;
  variants: VariantResult[];
  scrapedData: ScrapedPageData | null;
}

/**
 * Scrape the product page HTML using Firecrawl to extract display title and color swatches
 */
async function scrapeProductPage(productUrl: string): Promise<ScrapedPageData> {
  if (!FIRECRAWL_API_KEY) {
    console.log('[ANYCUBIC-SYNC] No Firecrawl key, skipping HTML scrape');
    return { pageTitle: null, colorSwatches: [] };
  }

  try {
    console.log(`[ANYCUBIC-SYNC] Scraping HTML: ${productUrl}`);
    const response = await fetch('https://api.firecrawl.dev/v1/scrape', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${FIRECRAWL_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        url: productUrl,
        formats: ['html'],
        waitFor: 2000,
        onlyMainContent: false,
      }),
    });

    if (!response.ok) {
      console.log(`[ANYCUBIC-SYNC] Firecrawl HTTP ${response.status}`);
      return { pageTitle: null, colorSwatches: [] };
    }

    const data = await response.json();
    const html = data.data?.html || '';

    // Extract page title from <h1> - the main product name
    const h1Match = html.match(/<h1[^>]*class="[^"]*product[^"]*"[^>]*>([^<]+)<\/h1>/i) ||
                    html.match(/<h1[^>]*>([^<]+)<\/h1>/i);
    const pageTitle = h1Match ? h1Match[1].trim() : null;

    // Extract color swatches from various patterns
    const colorSwatches: string[] = [];
    
    // Pattern 1: Color option values (most reliable for Anycubic)
    const optionMatches = html.matchAll(/data-option-value=["']([^"']+)["']/gi);
    for (const match of optionMatches) {
      const value = match[1].trim();
      // Filter out non-colors (weights, sizes)
      if (!value.match(/^\d+(\.\d+)?\s*(kg|g|mm)$/i) && 
          !value.match(/^(1\.75|2\.85)\s*mm$/i) &&
          value.length > 1) {
        colorSwatches.push(value);
      }
    }

    // Pattern 2: Swatch elements with title or aria-label
    const swatchMatches = html.matchAll(/class="[^"]*swatch[^"]*"[^>]*(?:title|aria-label)=["']([^"']+)["']/gi);
    for (const match of swatchMatches) {
      colorSwatches.push(match[1].trim());
    }

    // Pattern 3: Color fieldset options
    const colorFieldMatch = html.match(/<fieldset[^>]*data-option-name=["']Color["'][^>]*>([\s\S]*?)<\/fieldset>/i);
    if (colorFieldMatch) {
      const colorFieldHtml = colorFieldMatch[1];
      const labelMatches = colorFieldHtml.matchAll(/(?:value|title|aria-label)=["']([^"']+)["']/gi);
      for (const match of labelMatches) {
        const value = match[1].trim();
        if (value.length > 1 && !value.match(/^\d/)) {
          colorSwatches.push(value);
        }
      }
    }

    // Deduplicate
    const uniqueSwatches = [...new Set(colorSwatches)];
    
    console.log(`[ANYCUBIC-SYNC] Scraped title: "${pageTitle}", swatches: ${uniqueSwatches.length}`);
    
    return {
      pageTitle,
      colorSwatches: uniqueSwatches,
    };
  } catch (error) {
    console.error('[ANYCUBIC-SYNC] Firecrawl error:', error);
    return { pageTitle: null, colorSwatches: [] };
  }
}

/**
 * Fetch a single product from Shopify with multi-region fallback and decision logging
 * Tries US store first, falls back to CA if 404
 * Also scrapes the product page HTML for display title and color swatches
 */
async function fetchProduct(
  whitelistProduct: typeof ANYCUBIC_PRODUCT_WHITELIST[0],
  logger: ReturnType<typeof createDecisionLogger>
): Promise<FetchProductResult> {
  let product: any = null;
  let sourceStore = ANYCUBIC_STORES[0]; // Default to US
  
  // Try each store until we get a successful response
  for (const store of ANYCUBIC_STORES) {
    const productJsonUrl = `${store.baseUrl}/products/${whitelistProduct.handle}.json`;
    
    try {
      const response = await fetch(productJsonUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; FilaScopeBot/1.0)',
          'Accept': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        product = data.product;
        if (product) {
          sourceStore = store;
          console.log(`[ANYCUBIC-SYNC] Found ${whitelistProduct.handle} on ${store.region} store`);
          break;
        }
      } else if (response.status === 404) {
        console.log(`[ANYCUBIC-SYNC] ${whitelistProduct.handle} not found on ${store.region} store (404), trying next...`);
      } else {
        console.log(`[ANYCUBIC-SYNC] ${whitelistProduct.handle} HTTP ${response.status} on ${store.region} store`);
      }
    } catch (error) {
      console.log(`[ANYCUBIC-SYNC] ${whitelistProduct.handle} fetch error on ${store.region}:`, error);
    }
  }

  if (!product) {
    throw new Error(`Product not found on any store`);
  }

  // Scrape the product page HTML for display title and color swatches
  const productPageUrl = `${sourceStore.baseUrl}/products/${whitelistProduct.handle}`;
  const scrapedData = await scrapeProductPage(productPageUrl);

  // PRIORITY: Use scraped page title from <h1>, fallback to whitelist displayName
  const displayTitle = scrapedData?.pageTitle || whitelistProduct.displayName;
  
  console.log(`[ANYCUBIC-SYNC] ${whitelistProduct.handle}:`);
  console.log(`  - Scraped H1: "${scrapedData?.pageTitle || 'N/A'}"`);
  console.log(`  - Whitelist name: "${whitelistProduct.displayName}"`);
  console.log(`  - Final title: "${displayTitle}" (source: ${scrapedData?.pageTitle ? 'scraped' : 'whitelist'})`);
  console.log(`  - Scraped swatches: ${scrapedData?.colorSwatches?.length || 0} colors`);

  const defaultImage = product.images?.[0]?.src || product.image?.src || null;
  const productLineId = `anycubic__${whitelistProduct.productLineSlug.replace(/-/g, '')}`;

  // Log product line decision (include source region in matchedPattern)
  logger.logProductLine(
    String(product.id),
    product.title,
    { title: product.title, handle: whitelistProduct.handle },
    { productLineId, matchedPattern: `whitelist:${whitelistProduct.productLineSlug}@${sourceStore.region}` },
    true
  );

  const variants: VariantResult[] = [];
  
  // Build map of scraped swatches for color matching
  const scrapedSwatches = scrapedData?.colorSwatches || [];
  
  // Track seen colors to deduplicate across shipping regions
  // Anycubic variants have 3D options: Color × Size × Shipping Region
  // We only want one entry per color (US pricing)
  const seenColors = new Set<string>();

  for (let idx = 0; idx < (product.variants || []).length; idx++) {
    const variant = product.variants[idx];
    
    // FILTER: Skip non-US shipping region variants to avoid 4x duplication
    // Variant format: "Black (#212721) / 1KG / US" or "Black / 1kg / EU"
    const variantParts = (variant.title || '').split(/\s*[\/|]\s*/).map((p: string) => p.trim());
    const shippingRegion = variantParts[variantParts.length - 1]?.toUpperCase();
    const isRegionVariant = ['US', 'EU', 'UK', 'OTHER', 'CA', 'AU'].includes(shippingRegion || '');
    if (isRegionVariant && shippingRegion !== 'US') {
      continue; // Skip non-US shipping region variants
    }
    
    // PRIORITY: Try to match color from scraped swatches first
    let colorName: string;
    let colorSource: string;
    
    // Handle CA-only products with reversed option order:
    // CA variants: option1="1KG" (weight), option2="Red" (color), option3=null (no region)
    // US variants:  option1="Black (#212721)" (color), option2="1KG" (weight), option3="US" (region)
    let parsedColor: string;
    if (
      !variant.option3 &&
      variant.option1 &&
      /^\d+(\.\d+)?\s*(kg|g)$/i.test(variant.option1.trim()) &&
      variant.option2
    ) {
      parsedColor = variant.option2.trim();
    } else {
      parsedColor = extractColorFromVariantTitle(variant.title);
    }
    
    // DEDUP: Skip if we already have this color (from another shipping region/size)
    const colorKey = parsedColor.toLowerCase().replace(/\s*\(#[0-9a-f]+\)\s*/i, '').trim();
    if (seenColors.has(colorKey)) {
      continue;
    }
    seenColors.add(colorKey);
    
    // Method 1: Find matching scraped swatch by name (case-insensitive)
    const matchedSwatch = scrapedSwatches.find(
      swatch => swatch.toLowerCase() === parsedColor.toLowerCase()
    );
    
    if (matchedSwatch) {
      // Use exact case from scraped swatch
      colorName = matchedSwatch;
      colorSource = 'scraped_swatch_match';
    } else if (scrapedSwatches.length > 0 && idx < scrapedSwatches.length) {
      // Method 2: Use swatch by index position if counts roughly match
      const variantCount = product.variants.length;
      const swatchCount = scrapedSwatches.length;
      // If swatch count is within 20% of variant count, use index matching
      if (Math.abs(variantCount - swatchCount) <= Math.max(1, variantCount * 0.2)) {
        colorName = scrapedSwatches[idx];
        colorSource = 'scraped_swatch_index';
      } else {
        colorName = parsedColor;
        colorSource = 'variant_title_fallback';
      }
    } else {
      // Fallback to parsed variant title
      colorName = parsedColor;
      colorSource = 'variant_title_fallback';
    }
    
    // Log color extraction with source
    logger.logColorExtraction(
      String(variant.id),
      product.title,
      { 
        variantTitle: variant.title, 
        productHandle: whitelistProduct.handle,
        options: [`scrapedSwatches: ${scrapedSwatches.join(', ')}`, `index: ${idx}`]
      },
      { colorName, method: colorSource },
      colorSource.startsWith('scraped')
    );

    // Get color hex
    let colorHex = getAnycubicColorHex(colorName);
    const hexSource = colorHex ? 'anycubic_map' : 'color_mapping';
    if (!colorHex) {
      colorHex = getColorHex(colorName);
    }

    // Log hex lookup
    logger.logHexLookup(
      String(variant.id),
      product.title,
      { colorName, variantTitle: variant.title },
      { colorHex, source: colorHex ? hexSource : 'not_found' },
      colorHex !== null
    );

    const colorFamily = getColorFamily(colorName) || null;
    
    let imageUrl = defaultImage;
    if (variant.featured_image?.src) {
      imageUrl = variant.featured_image.src;
    }

    const printSettings = ANYCUBIC_PRINT_SETTINGS[whitelistProduct.material] || 
                         ANYCUBIC_PRINT_SETTINGS['PLA'] || null;

    // Use the source store URL for the product link
    const productUrl = `${sourceStore.baseUrl}/products/${whitelistProduct.handle}?variant=${variant.id}`;

    variants.push({
      productId: String(product.id),
      variantId: String(variant.id),
      title: displayTitle,  // Use scraped page title or whitelist displayName
      colorName,
      price: parseFloat(variant.price) || 0,
      compareAtPrice: variant.compare_at_price ? parseFloat(variant.compare_at_price) : null,
      available: typeof variant.available === 'boolean' ? variant.available : true,
      imageUrl,
      productUrl,
      productLineId,
      material: whitelistProduct.material,
      finishType: whitelistProduct.finishType,
      colorHex: colorHex ? (colorHex.startsWith('#') ? colorHex : `#${colorHex}`) : null,
      colorFamily,
    });
  }

  return { product, variants, scrapedData };
}

/**
 * Convert VariantResult to FilamentData for database
 */
function variantToFilamentData(
  variant: VariantResult,
  whitelistProduct: typeof ANYCUBIC_PRODUCT_WHITELIST[0]
): FilamentData {
  const printSettings = ANYCUBIC_PRINT_SETTINGS[whitelistProduct.material] || 
                       ANYCUBIC_PRINT_SETTINGS['PLA'] || null;

  return {
    product_id: variant.variantId,
    product_title: variant.title,
    vendor: VENDOR_NAME,
    product_line_id: variant.productLineId,
    material: variant.material,
    finish_type: variant.finishType,
    color_family: variant.colorFamily,
    color_hex: variant.colorHex,
    variant_price: variant.price,
    variant_compare_at_price: variant.compareAtPrice,
    variant_available: variant.available,
    product_url: variant.productUrl,
    featured_image: variant.imageUrl,
    diameter_nominal_mm: 1.75,
    net_weight_g: 1000,
    auto_created: true,
    auto_updated: true,
    last_scraped_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    sync_status: 'synced',
    nozzle_temp_min_c: printSettings?.nozzleTempMin || null,
    nozzle_temp_max_c: printSettings?.nozzleTempMax || null,
    bed_temp_min_c: printSettings?.bedTempMin || null,
    bed_temp_max_c: printSettings?.bedTempMax || null,
    high_speed_capable: whitelistProduct.handle.includes('high-speed'),
  };
}

/**
 * Extract color name from Shopify variant title
 * Handles formats like: "Black", "Black / 1kg", "1kg / Black", "White / 1.75mm / 1kg"
 */
function extractColorFromVariantTitle(variantTitle: string): string {
  if (!variantTitle) return 'Unknown';
  
  const parts = variantTitle.split(/\s*[\/|]\s*/).map(p => p.trim());
  
  const colorParts = parts.filter(part => {
    const lower = part.toLowerCase();
    if (/^\d+(\.\d+)?\s*(kg|g|gram|kilogram)s?$/i.test(part)) return false;
    if (/^\d+(\.\d+)?\s*mm$/i.test(part)) return false;
    if (/^\d+$/.test(part)) return false;
    if (['default', 'standard', 'regular', 'title'].includes(lower)) return false;
    // Filter out region codes (US, EU, UK, CA, AU, OTHER) that appear as option values
    if (/^(US|EU|UK|CA|AU|OTHER)$/i.test(part.trim())) return false;
    return true;
  });
  
  return colorParts.length > 0 ? colorParts[0] : variantTitle;
}
