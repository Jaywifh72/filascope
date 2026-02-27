import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { getPriceEndpoint as getPriceEndpointServer } from '../_shared/price-regional.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface SyncRequest {
  syncType: 'all' | 'brand' | 'single';
  productType: 'filament' | 'printer';
  targetId?: string;
  brandSlug?: string;
  triggeredBy?: 'admin' | 'scheduled' | 'api';
  dryRun?: boolean;
  limit?: number;
  // Regional sync options
  regionCodes?: string[];       // Which regions to sync (null = all configured)
  skipRegions?: string[];       // Regions to exclude
  useRegionalUrls?: boolean;    // Use product_regional_urls table (default: true for single, false for batch)
}

interface BrandConfig {
  brand_slug: string;
  platform_type: string;
  rate_limit_ms: number | null;
  price_extraction_config: Record<string, unknown> | null;
  extraction_method: string | null;
}

interface ExtractionResult {
  success: boolean;
  price: number | null;
  compareAtPrice: number | null;
  error?: string;
  method?: string;
  is404?: boolean;
  stockStatus?: string | null;
  notAvailableInRegion?: boolean;
  isUnavailable?: boolean;
}

interface RegionalUrl {
  id: string;
  product_id: string;
  product_type: string;
  region_code: string;
  store_url: string;
  store_name: string | null;
  currency_code: string;
  is_primary: boolean;
  is_verified: boolean;
}

interface RegionStats {
  attempted: number;
  successful: number;
  failed: number;
  unavailable: number;
  priceChanges: number;
}

const MAX_RUNTIME_MS = 5 * 60 * 1000; // 5 minutes
const DEFAULT_RATE_LIMIT_MS = 2000;

// Sleep utility
const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Try Shopify JSON endpoint (fastest method)
async function tryShopifyJson(url: string): Promise<ExtractionResult> {
  try {
    // Clean URL and append .json
    const cleanUrl = url.replace(/\?.*$/, '').replace(/\/$/, '');
    const jsonUrl = `${cleanUrl}.json`;
    
    const response = await fetch(jsonUrl, {
      headers: { 'Accept': 'application/json' }
    });
    
    if (!response.ok) {
      return { success: false, price: null, compareAtPrice: null, error: `HTTP ${response.status}` };
    }
    
    const data = await response.json();
    const variant = data.product?.variants?.[0];
    
    if (!variant?.price) {
      return { success: false, price: null, compareAtPrice: null, error: 'No price in JSON' };
    }
    
    const price = parseFloat(variant.price);
    const compareAtPrice = variant.compare_at_price ? parseFloat(variant.compare_at_price) : null;
    
    if (isNaN(price)) {
      return { success: false, price: null, compareAtPrice: null, error: 'Invalid price format' };
    }
    
    return { success: true, price, compareAtPrice, method: 'shopify_json' };
  } catch (error) {
    return { 
      success: false, 
      price: null, 
      compareAtPrice: null, 
      error: error instanceof Error ? error.message : 'Shopify JSON failed' 
    };
  }
}

// Call get-current-price Edge Function for Firecrawl-based extraction
interface CurrentPriceOptions {
  currency?: string | null;
  filamentId?: string | null;
  productType?: 'filament' | 'printer';
}

async function callGetCurrentPrice(
  productUrl: string,
  targetWeightGrams?: number | null,
  options?: CurrentPriceOptions,
): Promise<ExtractionResult> {
  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    
    if (!supabaseUrl || !serviceKey) {
      return { success: false, price: null, compareAtPrice: null, error: 'Missing env vars' };
    }
    
    const fnPath = getPriceEndpointServer(productUrl);
    const response = await fetch(`${supabaseUrl}/functions/v1/${fnPath}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${serviceKey}`
      },
      body: JSON.stringify({
        productUrl,
        // Default sync should not use manual-refresh rate-limited mode
        forceRefresh: false,
        targetWeightGrams: targetWeightGrams ?? null,
        currency: options?.currency ?? undefined,
        filamentId: options?.filamentId ?? undefined,
        productType: options?.productType || 'filament',
      })
    });
    
    if (!response.ok) {
      return { success: false, price: null, compareAtPrice: null, error: `HTTP ${response.status}` };
    }
    
    const data = await response.json();
    const isUnavailable =
      !!data?.notAvailableInRegion ||
      !!data?.is404 ||
      data?.stockStatus === 'out_of_stock' ||
      data?.error === 'OUT_OF_STOCK_NO_PRICE' ||
      data?.error === 'PRODUCT_PAGE_NOT_FOUND' ||
      data?.error === 'PRODUCT_DISCONTINUED';

    if (data?.success && data.price !== null && data.price !== undefined) {
      return {
        success: true,
        price: data.price,
        compareAtPrice: data.compareAtPrice || null,
        method: data.source || 'firecrawl',
        is404: !!data?.is404,
        stockStatus: data?.stockStatus || null,
        notAvailableInRegion: !!data?.notAvailableInRegion,
        isUnavailable,
      };
    }

    return {
      success: false,
      price: null,
      compareAtPrice: null,
      error: data?.error || 'No price extracted',
      method: data?.source || 'firecrawl',
      is404: !!data?.is404,
      stockStatus: data?.stockStatus || null,
      notAvailableInRegion: !!data?.notAvailableInRegion,
      isUnavailable,
    };
  } catch (error) {
    return { 
      success: false, 
      price: null, 
      compareAtPrice: null, 
      error: error instanceof Error ? error.message : 'Firecrawl call failed' 
    };
  }
}

// Main extraction logic with strategy selection
async function extractPrice(
  productUrl: string,
  brandConfig: BrandConfig | null,
  targetWeightGrams?: number | null,
  options?: CurrentPriceOptions,
): Promise<ExtractionResult> {
  const platformType = brandConfig?.platform_type || 'unknown';
  
  // Strategy 1: Shopify JSON (fastest, most reliable)
  if (platformType === 'shopify') {
    const jsonResult = await tryShopifyJson(productUrl);
    if (jsonResult.success) return jsonResult;
    
    // Fallback to Firecrawl
    console.log(`Shopify JSON failed for ${productUrl}, trying Firecrawl`);
  }
  
  // Strategy 2: Firecrawl for supported platforms
  if (['shopify', 'woocommerce', 'firecrawl', 'custom'].includes(platformType)) {
    return await callGetCurrentPrice(productUrl, targetWeightGrams, options);
  }
  
  // Strategy 3: Skip unsupported platforms
  if (platformType === 'amazon') {
    return { success: false, price: null, compareAtPrice: null, error: 'Amazon requires separate API' };
  }
  
  // Default: try Firecrawl anyway
  return await callGetCurrentPrice(productUrl, targetWeightGrams, options);
}

function isUnavailableExtraction(extraction: ExtractionResult): boolean {
  if (extraction.isUnavailable || extraction.notAvailableInRegion || extraction.is404) return true;
  if (extraction.stockStatus === 'out_of_stock') return true;
  return extraction.error === 'OUT_OF_STOCK_NO_PRICE' || extraction.error === 'PRODUCT_PAGE_NOT_FOUND';
}

// Fetch regional URLs for a product
// deno-lint-ignore no-explicit-any
async function getProductRegionalUrls(
  supabase: any,
  productId: string,
  productType: string,
  regionCodes?: string[],
  skipRegions?: string[]
): Promise<RegionalUrl[]> {
  let query = supabase
    .from('product_regional_urls')
    .select('*')
    .eq('product_id', productId)
    .eq('product_type', productType);
  
  if (regionCodes && regionCodes.length > 0) {
    query = query.in('region_code', regionCodes);
  }
  
  const { data, error } = await query;
  if (error) {
    console.error('Failed to fetch regional URLs:', error);
    return [];
  }
  
  let urls: RegionalUrl[] = data || [];
  
  // Filter out skipped regions
  if (skipRegions && skipRegions.length > 0) {
    urls = urls.filter((u: RegionalUrl) => !skipRegions.includes(u.region_code));
  }
  
  return urls;
}

// Update regional price after extraction
// deno-lint-ignore no-explicit-any
async function updateRegionalPrice(
  supabase: any,
  productId: string,
  productType: string,
  regionCode: string,
  currencyCode: string,
  extractedPrice: number | null,
  compareAtPrice: number | null,
  storeUrlId: string,
  success: boolean,
  errorMessage?: string,
  statusOverride?: 'unavailable'
): Promise<boolean> {
  const { error } = await supabase
    .from('product_regional_prices')
    .upsert({
      product_id: productId,
      product_type: productType,
      region_code: regionCode,
      currency_code: currencyCode,
      current_price: extractedPrice,
      compare_at_price: compareAtPrice,
      store_url_id: storeUrlId,
      last_sync_at: new Date().toISOString(),
      last_sync_status: statusOverride || (success ? 'success' : 'failed'),
      last_sync_error: errorMessage || null,
      price_source: 'sync',
    }, {
      onConflict: 'product_id,product_type,region_code',
    });

  if (error) {
    console.error('Failed to update regional price:', error);
    return false;
  }
  return true;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }
  
  const startTime = Date.now();
  
  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, serviceKey);
    
    const body: SyncRequest = await req.json();
    const { 
      syncType = 'all', 
      productType = 'filament', 
      targetId, 
      brandSlug, 
      triggeredBy = 'api',
      dryRun = false,
      limit = 100,
      regionCodes,
      skipRegions,
      useRegionalUrls = syncType === 'single' // Default true for single sync
    } = body;
    
    console.log(`Starting ${syncType} sync for ${productType}s`, { 
      brandSlug, 
      targetId, 
      dryRun, 
      regionCodes, 
      useRegionalUrls 
    });
    
    // Validate request
    if (syncType === 'single' && !targetId) {
      return new Response(
        JSON.stringify({ success: false, error: 'targetId required for single sync' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    if (syncType === 'brand' && !brandSlug) {
      return new Response(
        JSON.stringify({ success: false, error: 'brandSlug required for brand sync' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    // Create sync run record
    const { data: syncLog, error: syncLogError } = await supabase
      .from('brand_sync_logs')
      .insert({
        brand_slug: brandSlug || (syncType === 'single' ? 'single' : 'all'),
        sync_type: 'prices',
        status: 'running',
        triggered_by: triggeredBy,
        region_code: regionCodes && regionCodes.length === 1 ? regionCodes[0] : null,
        regions_synced: regionCodes || [],
        products_processed: { 
          progress: { stage: 'initializing' },
          dryRun,
          productType,
          syncType,
          regionCodes: regionCodes || 'all'
        }
      })
      .select('id')
      .single();
    
    if (syncLogError) {
      console.error('Failed to create sync log:', syncLogError);
    }
    
    const syncRunId = syncLog?.id || 'unknown';
    
    // Build product query
    const tableName = productType === 'filament' ? 'filaments' : 'printers';
    const priceColumn = productType === 'filament' ? 'variant_price' : 'current_price_usd_store';
    const msrpColumn = productType === 'filament' ? 'msrp' : 'msrp_usd';
    const selectColumns = productType === 'filament'
      ? `id, product_title, product_url, vendor, net_weight_g, ${priceColumn}, ${msrpColumn}`
      : `id, product_title, product_url, vendor, ${priceColumn}, ${msrpColumn}`;
    
    let query = supabase
      .from(tableName)
      .select(selectColumns)
      .not('product_url', 'is', null);
    
    // For filaments, check sync_enabled and skip unsyncable URL-missing rows
    if (productType === 'filament') {
      query = query
        .eq('sync_enabled', true)
        .neq('sync_status', 'url_missing');
    }
    
    if (syncType === 'single' && targetId) {
      query = query.eq('id', targetId);
    } else if (syncType === 'brand' && brandSlug) {
      const { data: brandMeta } = await supabase
        .from('automated_brands')
        .select('brand_name')
        .eq('brand_slug', brandSlug)
        .maybeSingle();

      const vendorMatch = brandMeta?.brand_name || brandSlug.replace(/-/g, ' ');
      query = query.ilike('vendor', vendorMatch);
    }
    
    // Prioritize products that haven't been synced recently
    query = query.order('last_scraped_at', { ascending: true, nullsFirst: true }).limit(limit);
    
    const { data: products, error: queryError } = await query;
    
    if (queryError) {
      console.error('Query error:', queryError);
      return new Response(
        JSON.stringify({ success: false, error: queryError.message, syncRunId }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    if (!products || products.length === 0) {
      // Update sync log as completed with 0 products
      if (syncLog?.id) {
        await supabase.from('brand_sync_logs').update({
          status: 'completed',
          completed_at: new Date().toISOString(),
          duration_seconds: (Date.now() - startTime) / 1000,
          products_discovered: 0,
          products_updated: 0
        }).eq('id', syncLog.id);
      }
      
      return new Response(
        JSON.stringify({ 
          success: true, 
          syncRunId, 
          syncType, 
          productType, 
          dryRun,
          total: 0,
          totalProducts: 0,
          totalRegionalUrls: 0,
          successful: 0, 
          failed: 0, 
          skipped: 0,
          priceChanges: 0,
          regionStats: {},
          duration_ms: Date.now() - startTime
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    console.log(`Found ${products.length} products to sync`);
    
    // Cache brand configs
    const brandConfigCache: Record<string, BrandConfig | null> = {};
    
    async function getBrandConfig(vendor: string): Promise<BrandConfig | null> {
      const vendorKey = vendor.trim().toLowerCase();
      if (brandConfigCache[vendorKey] !== undefined) {
        return brandConfigCache[vendorKey];
      }

      const normalizedSlug = vendorKey.replace(/\s+/g, '-');
      let { data } = await supabase
        .from('automated_brands')
        .select('brand_slug, platform_type, rate_limit_ms, price_extraction_config, extraction_method')
        .eq('brand_slug', normalizedSlug)
        .maybeSingle();

      if (!data) {
        const byName = await supabase
          .from('automated_brands')
          .select('brand_slug, platform_type, rate_limit_ms, price_extraction_config, extraction_method')
          .ilike('brand_name', vendor)
          .maybeSingle();
        data = byName.data || null;
      }

      brandConfigCache[vendorKey] = data || null;
      return brandConfigCache[vendorKey];
    }
    
    // Process products
    let successful = 0;
    let failed = 0;
    let unavailable = 0;
    let skipped = 0;
    let priceChanges = 0;
    let totalRegionalUrls = 0;
    
    // URL-level extraction cache: avoids duplicate Firecrawl calls when
    // multiple variants share the same product_url (e.g. FormFutura: 460 variants → 80 URLs)
    const urlExtractionCache = new Map<string, ExtractionResult>();
    const regionStats: Record<string, RegionStats> = {};
    const regionsProcessed = new Set<string>();
    const errors: Array<{ productId: string; regionCode?: string; error: string }> = [];
    
    // Helper to update region stats
    function updateRegionStats(
      regionCode: string, 
      type: 'attempted' | 'successful' | 'failed' | 'unavailable', 
      priceChanged = false
    ) {
      if (!regionStats[regionCode]) {
        regionStats[regionCode] = { attempted: 0, successful: 0, failed: 0, unavailable: 0, priceChanges: 0 };
      }
      regionStats[regionCode][type]++;
      if (priceChanged) {
        regionStats[regionCode].priceChanges++;
      }
      regionsProcessed.add(regionCode);
    }
    
    for (const product of products) {
      // Check timeout
      if (Date.now() - startTime > MAX_RUNTIME_MS) {
        console.warn('Sync timeout reached, stopping');
        break;
      }
      
      const vendor = product.vendor || 'unknown';
      const brandConfig = await getBrandConfig(vendor);
      const rateLimitMs = brandConfig?.rate_limit_ms || DEFAULT_RATE_LIMIT_MS;
      
      // Decide whether to use regional URLs or legacy flow
      if (useRegionalUrls) {
        // Regional sync: get URLs from product_regional_urls
        const regionalUrls = await getProductRegionalUrls(
          supabase, 
          product.id, 
          productType, 
          regionCodes, 
          skipRegions
        );
        
        if (regionalUrls.length === 0) {
          // No regional URLs, fall back to legacy product_url
          const productUrl = product.product_url;
          if (!productUrl) {
            skipped++;
            continue;
          }
          
          console.log(`No regional URLs for ${product.id}, using legacy product_url`);
          
          // For EUR-only brands like Extrudr/FormFutura, override currency and target column
          const isEurOnlyBrand = ['extrudr', 'formfutura'].includes(vendor.toLowerCase());
          const legacyCurrency = isEurOnlyBrand ? 'EUR' : null;
          const legacyPriceColumn = isEurOnlyBrand ? 'price_eur' : priceColumn;
          
          const extractionStart = Date.now();
          const targetWeightGrams = productType === 'filament' ? (product.net_weight_g ?? null) : null;
          
          // URL dedup: reuse cached extraction if another variant already fetched this URL
          let extraction: ExtractionResult;
          const cacheKey = `${productUrl}|${legacyCurrency || 'USD'}`;
          if (urlExtractionCache.has(cacheKey)) {
            extraction = urlExtractionCache.get(cacheKey)!;
            console.log(`  URL cache hit for ${productUrl.substring(0, 60)}...`);
          } else {
            extraction = await extractPrice(productUrl, brandConfig, targetWeightGrams, {
              currency: legacyCurrency,
              filamentId: productType === 'filament' ? product.id : null,
              productType,
            });
            urlExtractionCache.set(cacheKey, extraction);
            // Only rate-limit on actual fetches, not cache hits
            await sleep(rateLimitMs);
          }
          const responseTime = Date.now() - extractionStart;
          
          // Log extraction
          try {
            await supabase.from('price_extraction_logs').insert({
              product_url: productUrl,
              brand_slug: vendor,
              extraction_method: extraction.method || 'sync-prices',
              success: extraction.success,
              extracted_price: extraction.price,
              error_message: extraction.error || null,
              response_time_ms: responseTime
            });
          } catch (logError) {
            console.error('Failed to log extraction:', logError);
          }
          
          if (extraction.success && extraction.price !== null) {
            const currentPrice = product[priceColumn as keyof typeof product] as number | null;
            const priceChanged = currentPrice !== extraction.price;
            if (priceChanged) priceChanges++;
            
            if (!dryRun) {
              const updateData: Record<string, unknown> = {
                [legacyPriceColumn]: extraction.price,
                last_scraped_at: new Date().toISOString(),
              };

              // For EUR-only brands, mark variant as actively synced
              if (isEurOnlyBrand && productType === 'filament') {
                updateData.sync_status = 'active';
              }
              if (productType === 'filament' && extraction.compareAtPrice) {
                updateData.variant_compare_at_price = extraction.compareAtPrice;
              }
              
              if (productType === 'printer') {
                updateData.last_sync_status = 'success';
                updateData.last_sync_error = null;
              }
              
              const { error: updateError } = await supabase
                .from(tableName)
                .update(updateData)
                .eq('id', product.id);
              
              if (updateError) {
                console.error(`Failed to update ${product.id}:`, updateError);
                failed++;
                errors.push({ productId: product.id, error: updateError.message });
              } else {
                successful++;
              }
            } else {
              successful++;
            }
          } else if (isUnavailableExtraction(extraction)) {
            unavailable++;

            if (!dryRun) {
              const unavailableData: Record<string, unknown> = {
                last_sync_error: extraction.error || 'Unavailable in store',
                last_scraped_at: new Date().toISOString(),
              };

              if (productType === 'printer') {
                unavailableData.last_sync_status = 'unavailable';
              }
              if (productType === 'filament') {
                const isTerminalMissingUrl =
                  extraction.is404 ||
                  extraction.error === 'PRODUCT_PAGE_NOT_FOUND' ||
                  extraction.error === 'PRODUCT_DISCONTINUED';

                if (isTerminalMissingUrl) {
                  unavailableData.sync_status = 'url_missing';
                  unavailableData.product_url = null;
                } else {
                  unavailableData.sync_status = 'unavailable';
                }
              }

              await supabase
                .from(tableName)
                .update(unavailableData)
                .eq('id', product.id);
            }
          } else {
            failed++;
            errors.push({ productId: product.id, error: extraction.error || 'Unknown error' });
            // Log to scrape_errors for visibility in Sync Monitor
            try {
              await supabase.from('scrape_errors').insert({
                brand_slug: vendor,
                error_type: extraction.error?.includes('timeout') ? 'timeout'
                  : extraction.error?.includes('404') ? '404'
                  : extraction.error?.includes('blocked') ? 'cloudflare'
                  : 'extraction_failed',
                error_message: extraction.error || 'Unknown extraction error',
                url_attempted: productUrl,
                region: isEurOnlyBrand ? 'EU' : 'US',
                filament_id: productType === 'filament' ? product.id : null,
              });
            } catch (scrapeLogErr) {
              console.error('Failed to log scrape error:', scrapeLogErr);
            }
          }
          
          // Rate limit already applied on cache miss above
          
        }
        
        // Process each regional URL
        console.log(`Processing ${regionalUrls.length} regional URLs for ${product.product_title?.substring(0, 40)}...`);
        totalRegionalUrls += regionalUrls.length;
        
        for (const regionalUrl of regionalUrls) {
          // Check timeout
          if (Date.now() - startTime > MAX_RUNTIME_MS) {
            console.warn('Sync timeout reached during regional processing');
            break;
          }
          
          const regionCode = regionalUrl.region_code;
          const storeUrl = regionalUrl.store_url;
          
          if (!storeUrl) {
            updateRegionStats(regionCode, 'failed');
            skipped++;
            continue;
          }
          
          updateRegionStats(regionCode, 'attempted');
          console.log(`  [${regionCode}] Extracting from ${storeUrl.substring(0, 60)}...`);
          
          const extractionStart = Date.now();
          const targetWeightGrams = productType === 'filament' ? (product.net_weight_g ?? null) : null;
          
          // URL dedup: reuse cached extraction for same URL+currency
          const regionalCacheKey = `${storeUrl}|${regionalUrl.currency_code}`;
          let extraction: ExtractionResult;
          if (urlExtractionCache.has(regionalCacheKey)) {
            extraction = urlExtractionCache.get(regionalCacheKey)!;
            console.log(`  [${regionCode}] URL cache hit for ${storeUrl.substring(0, 60)}...`);
          } else {
            extraction = await extractPrice(storeUrl, brandConfig, targetWeightGrams, {
              currency: regionalUrl.currency_code,
              filamentId: productType === 'filament' ? product.id : null,
              productType,
            });
            urlExtractionCache.set(regionalCacheKey, extraction);
            // Only rate-limit on actual fetches
            await sleep(brandConfig?.rate_limit_ms || DEFAULT_RATE_LIMIT_MS);
          }
          const responseTime = Date.now() - extractionStart;
          
          // Log extraction with region info
          try {
            await supabase.from('price_extraction_logs').insert({
              product_url: storeUrl,
              brand_slug: vendor,
              extraction_method: extraction.method || 'sync-prices',
              success: extraction.success,
              extracted_price: extraction.price,
              error_message: extraction.error || null,
              response_time_ms: responseTime,
              region_code: regionCode
            });
          } catch (logError) {
            console.error('Failed to log extraction:', logError);
          }
          
          if (extraction.success && extraction.price !== null) {
            // Check if price changed
            const { data: existingPrice } = await supabase
              .from('product_regional_prices')
              .select('current_price')
              .eq('product_id', product.id)
              .eq('product_type', productType)
              .eq('region_code', regionCode)
              .single();
            
            const priceChanged = existingPrice?.current_price !== extraction.price;
            if (priceChanged) priceChanges++;
            
            if (!dryRun) {
              // Update product_regional_prices
              const updated = await updateRegionalPrice(
                supabase,
                product.id,
                productType,
                regionCode,
                regionalUrl.currency_code,
                extraction.price,
                extraction.compareAtPrice,
                regionalUrl.id,
                true
              );
              
              if (updated) {
                successful++;
                updateRegionStats(regionCode, 'successful', priceChanged);
                
                // Also update the filaments table price column for this currency
                if (productType === 'filament') {
                  const currencyToPriceCol: Record<string, string> = {
                    'EUR': 'price_eur', 'CAD': 'price_cad', 'GBP': 'price_gbp',
                    'AUD': 'price_aud', 'JPY': 'price_jpy', 'USD': 'variant_price',
                  };
                  const priceCol = currencyToPriceCol[regionalUrl.currency_code];
                  if (priceCol) {
                    const filamentUpdate: Record<string, unknown> = {
                      [priceCol]: extraction.price,
                      last_scraped_at: new Date().toISOString(),
                      sync_status: 'active',
                    };
                    if (extraction.compareAtPrice) {
                      filamentUpdate.variant_compare_at_price = extraction.compareAtPrice;
                    }
                    await supabase.from('filaments').update(filamentUpdate).eq('id', product.id);
                  }
                }
              } else {
                failed++;
                updateRegionStats(regionCode, 'failed');
                errors.push({ productId: product.id, regionCode, error: 'Failed to update regional price' });
              }
            } else {
              successful++;
              updateRegionStats(regionCode, 'successful', priceChanged);
              console.log(`  [${regionCode}] [DRY RUN] Would set price to ${extraction.price} ${regionalUrl.currency_code}`);
            }
          } else if (isUnavailableExtraction(extraction)) {
            unavailable++;
            updateRegionStats(regionCode, 'unavailable');

            if (!dryRun) {
              await updateRegionalPrice(
                supabase,
                product.id,
                productType,
                regionCode,
                regionalUrl.currency_code,
                null,
                null,
                regionalUrl.id,
                false,
                extraction.error,
                'unavailable'
              );
            }
          } else {
            failed++;
            updateRegionStats(regionCode, 'failed');
            errors.push({ 
              productId: product.id, 
              regionCode, 
              error: extraction.error || 'Unknown error' 
            });
            
            // Log to scrape_errors for visibility in Sync Monitor
            try {
              await supabase.from('scrape_errors').insert({
                brand_slug: vendor,
                error_type: extraction.error?.includes('timeout') ? 'timeout'
                  : extraction.error?.includes('404') ? '404'
                  : extraction.error?.includes('blocked') ? 'cloudflare'
                  : 'extraction_failed',
                error_message: extraction.error || 'Unknown extraction error',
                url_attempted: storeUrl,
                region: regionCode,
                filament_id: productType === 'filament' ? product.id : null,
              });
            } catch (scrapeLogErr) {
              console.error('Failed to log scrape error:', scrapeLogErr);
            }

            if (!dryRun) {
              // Update regional price with error status
              await updateRegionalPrice(
                supabase,
                product.id,
                productType,
                regionCode,
                regionalUrl.currency_code,
                null,
                null,
                regionalUrl.id,
                false,
                extraction.error
              );
            }
          }
          
          // Rate limit between regional URLs
          await sleep(rateLimitMs);
        }
      } else {
        // Legacy flow: use product_url directly
        const productUrl = product.product_url;
        if (!productUrl) {
          skipped++;
          continue;
        }
        
        console.log(`Processing: ${product.product_title?.substring(0, 50)}...`);
        
        // For EUR-only brands like Extrudr/FormFutura, override currency and target column
        const isEurOnlyBrand = ['extrudr', 'formfutura'].includes(vendor.toLowerCase());
        const legacyCurrency = isEurOnlyBrand ? 'EUR' : null;
        const legacyPriceColumn = isEurOnlyBrand ? 'price_eur' : priceColumn;
        
        const extractionStart = Date.now();
        const targetWeightGrams = productType === 'filament' ? (product.net_weight_g ?? null) : null;
        
        // URL dedup: reuse cached extraction if another variant already fetched this URL
        let extraction: ExtractionResult;
        const cacheKey = `${productUrl}|${legacyCurrency || 'USD'}`;
        if (urlExtractionCache.has(cacheKey)) {
          extraction = urlExtractionCache.get(cacheKey)!;
          console.log(`  URL cache hit for ${productUrl.substring(0, 60)}...`);
        } else {
          extraction = await extractPrice(productUrl, brandConfig, targetWeightGrams, {
            currency: legacyCurrency,
            filamentId: productType === 'filament' ? product.id : null,
            productType,
          });
          urlExtractionCache.set(cacheKey, extraction);
          // Only rate-limit on actual fetches, not cache hits
          await sleep(rateLimitMs);
        }
        const responseTime = Date.now() - extractionStart;
        
        // Log extraction attempt
        try {
          await supabase.from('price_extraction_logs').insert({
            product_url: productUrl,
            brand_slug: vendor,
            extraction_method: extraction.method || 'sync-prices',
            success: extraction.success,
            extracted_price: extraction.price,
            error_message: extraction.error || null,
            response_time_ms: responseTime
          });
        } catch (logError) {
          console.error('Failed to log extraction:', logError);
        }
        
        if (extraction.success && extraction.price !== null) {
          const currentPrice = product[priceColumn as keyof typeof product] as number | null;
          const priceChanged = currentPrice !== extraction.price;
          
          if (priceChanged) priceChanges++;
          
          if (!dryRun) {
            // Update product with new price
            const updateData: Record<string, unknown> = {
              [legacyPriceColumn]: extraction.price,
              last_scraped_at: new Date().toISOString(),
            };
            
            // For EUR-only brands, clear variant_price to avoid stale USD values
            if (isEurOnlyBrand) {
              updateData.sync_status = 'active';
            }
            
            // Add compare_at_price for filaments
            if (productType === 'filament' && extraction.compareAtPrice) {
              updateData.variant_compare_at_price = extraction.compareAtPrice;
            }
            
            // Add sync status for printers
            if (productType === 'printer') {
              updateData.last_sync_status = 'success';
              updateData.last_sync_error = null;
            }
            
            const { error: updateError } = await supabase
              .from(tableName)
              .update(updateData)
              .eq('id', product.id);
            
            if (updateError) {
              console.error(`Failed to update ${product.id}:`, updateError);
              failed++;
              errors.push({ productId: product.id, error: updateError.message });
            } else {
              successful++;
            }
          } else {
            // Dry run - count as successful
            successful++;
            console.log(`[DRY RUN] Would update ${product.id}: ${legacyPriceColumn}=${extraction.price}`);
          }
        } else if (isUnavailableExtraction(extraction)) {
          unavailable++;
          
          if (!dryRun) {
            // Update product with unavailable status (not a hard failure)
            const unavailableData: Record<string, unknown> = {
              last_sync_error: extraction.error || 'Unavailable in store',
              last_scraped_at: new Date().toISOString(),
            };
            
            if (productType === 'printer') {
              unavailableData.last_sync_status = 'unavailable';
            }
            if (productType === 'filament') {
              const isTerminalMissingUrl =
                extraction.is404 ||
                extraction.error === 'PRODUCT_PAGE_NOT_FOUND' ||
                extraction.error === 'PRODUCT_DISCONTINUED';

              if (isTerminalMissingUrl) {
                unavailableData.sync_status = 'url_missing';
                unavailableData.product_url = null;
              } else {
                unavailableData.sync_status = 'unavailable';
              }
            }
            
            await supabase
              .from(tableName)
              .update(unavailableData)
              .eq('id', product.id);
          }
        } else {
          failed++;
          errors.push({ productId: product.id, error: extraction.error || 'Unknown error' });
          // Log to scrape_errors for visibility in Sync Monitor
          try {
            await supabase.from('scrape_errors').insert({
              brand_slug: vendor,
              error_type: extraction.error?.includes('timeout') ? 'timeout'
                : extraction.error?.includes('404') ? '404'
                : extraction.error?.includes('blocked') ? 'cloudflare'
                : 'extraction_failed',
              error_message: extraction.error || 'Unknown extraction error',
              url_attempted: product.product_url,
              region: isEurOnlyBrand ? 'EU' : 'US',
              filament_id: productType === 'filament' ? product.id : null,
            });
          } catch (scrapeLogErr) {
            console.error('Failed to log scrape error:', scrapeLogErr);
          }
          
          if (!dryRun) {
            // Update product with error
            const errorData: Record<string, unknown> = {
              last_sync_error: extraction.error || 'Extraction failed'
            };
            
            if (productType === 'printer') {
              errorData.last_sync_status = 'failed';
            }
            
            await supabase
              .from(tableName)
              .update(errorData)
              .eq('id', product.id);
          }
        }
      }
    }
    
    const durationMs = Date.now() - startTime;
    
    // Update sync run record with regional stats
    if (syncLog?.id) {
      await supabase.from('brand_sync_logs').update({
        status: 'completed',
        completed_at: new Date().toISOString(),
        duration_seconds: durationMs / 1000,
        products_discovered: products.length,
        products_updated: successful,
        products_failed: failed,
        price_changes: priceChanges,
        regions_synced: Array.from(regionsProcessed),
        success_details: { 
          regionStats, 
          totalRegionalUrls,
          unavailable,
          dryRun 
        },
        error_details: errors.length > 0 ? { errors: errors.slice(0, 20) } : null
      }).eq('id', syncLog.id);
    }
    
    const response = {
      success: true,
      syncRunId,
      syncType,
      productType,
      dryRun,
      total: products.length,
      totalProducts: products.length,
      totalRegionalUrls,
      successful,
      failed,
      unavailable,
      skipped,
      priceChanges,
      regionStats,
      duration_ms: durationMs,
      errors: errors.length > 0 ? errors.slice(0, 20) : undefined
    };
    
    console.log('Sync completed:', response);
    
    return new Response(
      JSON.stringify(response),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
    
  } catch (error) {
    console.error('Sync error:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error',
        duration_ms: Date.now() - startTime
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
