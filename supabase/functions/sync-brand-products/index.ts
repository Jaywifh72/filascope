import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.1';
import { 
  extractColorFamily, 
  extractWeight, 
  generateProductLineId, 
  extractMaterial,
  buildAvailableRegions,
  getRegionalFieldMapping,
  getMainRegion,
  REGIONAL_FIELD_MAPPING,
  REGION_CURRENCIES,
  type RegionCode 
} from '../_shared/filament-schema.ts';
import { validateScrapedProduct, type ScrapedProduct } from '../_shared/scraper-validation.ts';
import { getColorHex, getColorFamily } from '../_shared/color-mapping.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Regional configuration for multi-region brands
// Comprehensive list including all brands with regional stores
const BRAND_REGIONAL_DOMAINS: Record<string, Record<string, string>> = {
  // === MAJOR BRANDS WITH REGIONAL SUBDOMAINS ===
  'bambu-lab': { 
    US: 'us.store.bambulab.com', 
    CA: 'ca.store.bambulab.com', 
    UK: 'uk.store.bambulab.com', 
    EU: 'eu.store.bambulab.com', 
    AU: 'au.store.bambulab.com', 
    JP: 'jp.store.bambulab.com' 
  },
  'elegoo': { 
    US: 'us.elegoo.com', 
    CA: 'ca.elegoo.com', 
    UK: 'uk.elegoo.com', 
    EU: 'eu.elegoo.com', 
    AU: 'au.elegoo.com' 
  },
  'polymaker': { 
    US: 'us.polymaker.com', 
    EU: 'eu.polymaker.com' 
  },
  'creality': { 
    US: 'www.creality.com', 
    CA: 'ca.creality.com', 
    UK: 'uk.creality.com', 
    EU: 'eu.creality.com', 
    AU: 'au.creality.com' 
  },
  'anycubic': { 
    US: 'www.anycubic.com', 
    CA: 'ca.anycubic.com', 
    UK: 'uk.anycubic.com', 
    EU: 'eu.anycubic.com', 
    AU: 'au.anycubic.com' 
  },
  'qidi': { 
    US: 'qidi3d.com', 
    EU: 'eu.qidi3d.com' 
  },
  'flashforge': { 
    US: 'www.flashforge.com', 
    EU: 'eu.flashforge.com' 
  },
  // === ADDITIONAL BRANDS WITH REGIONAL STORES ===
  'eryone': {
    US: 'eryone3d.com',
    EU: 'eu.eryone3d.com'
  },
  'jayo': {
    US: 'jayo3d.com',
    UK: 'uk.jayo3d.com',
    EU: 'eu.jayo3d.com'
  },
  'kingroon': {
    US: 'kingroon.com',
    EU: 'eu.kingroon.com'
  },
  'sovol': {
    US: 'sovol3d.com',
    EU: 'eu.sovol3d.com'
  },
  'artillery': {
    US: 'artillery3d.com',
    EU: 'eu.artillery3d.com'
  },
  'longer': {
    US: 'www.longer3d.com',
    EU: 'eu.longer3d.com'
  },
  'two-trees': {
    US: 'www.twotrees3d.com',
    EU: 'eu.twotrees3d.com'
  },
  'flsun': {
    US: 'flsun3d.com',
    EU: 'eu.flsun3d.com'
  },
  'tronxy': {
    US: 'www.tronxy.com',
    EU: 'eu.tronxy.com'
  },
  'geeetech': {
    US: 'www.geeetech.com',
    EU: 'eu.geeetech.com'
  },
  'voxelab': {
    US: 'www.voxelab3dp.com',
    EU: 'eu.voxelab3dp.com'
  },
};

// Use shared REGION_CURRENCIES from filament-schema.ts via import
// (already imported as REGIONAL_FIELD_MAPPING which includes currency info)

// Get regional URL for a brand
function getRegionalBaseUrl(brandSlug: string, region: string, defaultUrl: string): string {
  const domains = BRAND_REGIONAL_DOMAINS[brandSlug];
  if (domains && domains[region]) {
    try {
      const url = new URL(defaultUrl);
      return `https://${domains[region]}${url.pathname}`;
    } catch {
      return `https://${domains[region]}`;
    }
  }
  return defaultUrl;
}

// Check if brand supports multi-region
function isMultiRegionBrand(brandSlug: string): boolean {
  return brandSlug in BRAND_REGIONAL_DOMAINS;
}

interface SyncRequest {
  brandSlug: string;
  dryRun: boolean;
  materialFilter?: string;
  regions?: string[];
  tasks?: string[];
  limit?: number;
  background?: boolean;
}

interface BrandConfig {
  id: string;
  brand_slug: string;
  brand_name: string;
  display_name: string;
  platform_type: string;
  base_url: string;
  api_endpoint?: string;
  default_currency: string;
  supported_regions: string[];
  rate_limit_ms: number;
  timeout_ms: number;
  scraping_enabled: boolean;
}

interface ProductResult {
  productId: string;
  title: string;
  action: 'created' | 'updated' | 'skipped' | 'error';
  reason?: string;
  fields: {
    image: boolean;
    price: boolean;
    tds: boolean;
    colorHex: boolean;
    mpn: boolean;
    specifications: boolean;
  };
  price?: number;
  compareAtPrice?: number;
  region?: string;
}

interface RegionBreakdown {
  region: string;
  currency: string;
  productsFound: number;
  created: number;
  updated: number;
  skipped: number;
  errors: number;
  duration_ms: number;
}

interface SyncProgress {
  stage: 'initializing' | 'fetching' | 'processing' | 'saving' | 'complete' | 'error';
  currentRegion?: string;
  currentProduct?: string;
  productsProcessed: number;
  totalProducts: number;
  regionsProcessed: number;
  totalRegions: number;
  errors: string[];
}

// Helper to detect which fields were found for a product
function detectFields(product: any): ProductResult['fields'] {
  return {
    image: !!product.imageUrl,
    price: product.price !== null && product.price !== undefined,
    tds: !!product.tdsUrl,
    colorHex: !!product.colorHex,
    mpn: !!product.mpn,
    specifications: !!(product.nozzleTempMin || product.bedTempMin || product.netWeightG),
  };
}

// Calculate field coverage percentages
function calculateFieldCoverage(products: ProductResult[], total: number) {
  if (total === 0) {
    return {
      images: { count: 0, percent: 0 },
      prices: { count: 0, percent: 0 },
      tds: { count: 0, percent: 0 },
      colors: { count: 0, percent: 0 },
      mpn: { count: 0, percent: 0 },
      specifications: { count: 0, percent: 0 },
    };
  }

  const counts = {
    images: products.filter(p => p.fields.image).length,
    prices: products.filter(p => p.fields.price).length,
    tds: products.filter(p => p.fields.tds).length,
    colors: products.filter(p => p.fields.colorHex).length,
    mpn: products.filter(p => p.fields.mpn).length,
    specifications: products.filter(p => p.fields.specifications).length,
  };

  return {
    images: { count: counts.images, percent: Math.round((counts.images / total) * 100) },
    prices: { count: counts.prices, percent: Math.round((counts.prices / total) * 100) },
    tds: { count: counts.tds, percent: Math.round((counts.tds / total) * 100) },
    colors: { count: counts.colors, percent: Math.round((counts.colors / total) * 100) },
    mpn: { count: counts.mpn, percent: Math.round((counts.mpn / total) * 100) },
    specifications: { count: counts.specifications, percent: Math.round((counts.specifications / total) * 100) },
  };
}

// Update progress in the sync log
async function updateProgress(supabase: any, jobId: string, progress: SyncProgress, products?: ProductResult[]) {
  if (!jobId) return;
  
  await supabase
    .from('brand_sync_logs')
    .update({
      products_processed: {
        progress,
        products: products?.slice(-100) || [], // Keep last 100 products for display
      },
    })
    .eq('id', jobId);
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  try {
    const body: SyncRequest = await req.json();
    const { brandSlug, dryRun = true, materialFilter, regions, tasks = ['products'], limit = 100, background = false } = body;

    if (!brandSlug) {
      return new Response(
        JSON.stringify({ success: false, error: 'brandSlug is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const startTime = Date.now();
    console.log(`[sync-brand-products] Starting sync for ${brandSlug}`, { dryRun, tasks, limit, background });

    // Get brand configuration from database
    const { data: brand, error: brandError } = await supabase
      .from('automated_brands')
      .select('*')
      .eq('brand_slug', brandSlug)
      .single();

    if (brandError || !brand) {
      console.error(`[sync-brand-products] Brand not found: ${brandSlug}`, brandError);
      return new Response(
        JSON.stringify({ success: false, error: `Brand not found: ${brandSlug}` }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!brand.scraping_enabled) {
      return new Response(
        JSON.stringify({ success: false, error: 'Scraping is disabled for this brand' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Create sync log entry with initial progress
    const initialProgress: SyncProgress = {
      stage: 'initializing',
      productsProcessed: 0,
      totalProducts: 0,
      regionsProcessed: 0,
      totalRegions: (regions || brand.supported_regions || ['US']).length,
      errors: [],
    };

    const { data: syncLog, error: logError } = await supabase
      .from('brand_sync_logs')
      .insert({
        brand_id: brand.id,
        brand_slug: brandSlug,
        sync_type: tasks.join(','),
        status: 'running',
        triggered_by: 'manual',
        products_processed: { progress: initialProgress, products: [] },
      })
      .select('id')
      .single();

    if (logError) {
      console.error('[sync-brand-products] Failed to create sync log:', logError);
    }

    const jobId = syncLog?.id;

    // Mark brand as actively scraping
    await supabase
      .from('automated_brands')
      .update({ 
        scraping_active: true,
        scrape_timeout_at: new Date(Date.now() + 15 * 60 * 1000).toISOString()
      })
      .eq('brand_slug', brandSlug);

    // Main sync function
    async function performSync() {
      let allScrapedProducts: any[] = [];
      let processedProducts: ProductResult[] = [];
      let scrapingError: string | null = null;
      const regionBreakdown: RegionBreakdown[] = [];
      const syncRegions = regions || brand.supported_regions || ['US'];
      const isMultiRegion = isMultiRegionBrand(brand.brand_slug) && syncRegions.length > 1;

      const progress: SyncProgress = {
        stage: 'fetching',
        productsProcessed: 0,
        totalProducts: 0,
        regionsProcessed: 0,
        totalRegions: syncRegions.length,
        errors: [],
      };

      try {
        // Update progress to fetching
        await updateProgress(supabase, jobId, progress);

        // Iterate through each region for multi-region brands
        for (let regionIdx = 0; regionIdx < syncRegions.length; regionIdx++) {
          const region = syncRegions[regionIdx];
          const regionStartTime = Date.now();
          let regionProducts: any[] = [];
          
          progress.currentRegion = region;
          progress.regionsProcessed = regionIdx;
          await updateProgress(supabase, jobId, progress);
          
          // Get regional URL for multi-region brands
          const regionalBaseUrl = isMultiRegion 
            ? getRegionalBaseUrl(brand.brand_slug, region, brand.base_url)
            : brand.base_url;
          
          const regionalBrand = { ...brand, base_url: regionalBaseUrl };
          
          console.log(`[sync-brand-products] Scraping region ${region} from ${regionalBaseUrl}`);

          try {
            switch (brand.platform_type) {
              case 'shopify':
                regionProducts = await scrapeShopify(regionalBrand, materialFilter, limit);
                break;
              case 'woocommerce':
                regionProducts = await scrapeWooCommerce(regionalBrand, materialFilter, limit);
                break;
              case 'firecrawl':
                regionProducts = await scrapeFirecrawl(regionalBrand, materialFilter, limit);
                break;
              case 'amazon':
                regionProducts = await getAmazonProducts(supabase, brand.brand_name, limit);
                break;
              case 'bigcommerce':
                regionProducts = await scrapeBigCommerce(regionalBrand, materialFilter, limit);
                break;
              default:
                scrapingError = `Unsupported platform: ${brand.platform_type}`;
            }
          } catch (err) {
            const errorMsg = err instanceof Error ? err.message : 'Unknown scraping error';
            console.error(`[sync-brand-products] Scraping error for ${brandSlug} region ${region}:`, err);
            progress.errors.push(`${region}: ${errorMsg}`);
          }

          // Tag products with region and currency
          for (const product of regionProducts) {
            product.region = region;
            product.currency = REGION_CURRENCIES[region as RegionCode] || 'USD';
          }

          // Add region breakdown
          regionBreakdown.push({
            region,
            currency: REGION_CURRENCIES[region as RegionCode] || 'USD',
            productsFound: regionProducts.length,
            created: 0,
            updated: 0,
            skipped: 0,
            errors: 0,
            duration_ms: Date.now() - regionStartTime,
          });

          allScrapedProducts.push(...regionProducts);
          
          // Rate limit between regions
          if (regionIdx < syncRegions.length - 1) {
            await new Promise(r => setTimeout(r, brand.rate_limit_ms || 1000));
          }
        }
      } catch (err) {
        scrapingError = err instanceof Error ? err.message : 'Unknown scraping error';
        console.error(`[sync-brand-products] Scraping error for ${brandSlug}:`, err);
        progress.errors.push(scrapingError);
      }

      // Update progress with total count
      progress.stage = 'processing';
      progress.totalProducts = allScrapedProducts.length;
      progress.regionsProcessed = syncRegions.length;
      await updateProgress(supabase, jobId, progress);

      // Process scraped products with detailed logging
      let summary = { created: 0, updated: 0, skipped: 0, errors: 0, total: allScrapedProducts.length };

      for (let i = 0; i < allScrapedProducts.length; i++) {
        const product = allScrapedProducts[i];
        const fields = detectFields(product);
        const productRegion = product.region || 'US';
        
        let productResult: ProductResult = {
          productId: product.productId,
          title: product.title,
          action: 'skipped',
          fields,
          price: product.price,
          compareAtPrice: product.compareAtPrice,
          region: productRegion,
        };

        // Validate scraped product before processing
        const validation = validateScrapedProduct({
          productId: product.productId || '',
          title: product.title || '',
          price: product.price || null,
          compareAtPrice: product.compareAtPrice || null,
          available: product.available ?? true,
          currency: product.currency || 'USD',
          url: product.url || '',
          imageUrl: product.imageUrl || null,
          material: product.material || null,
          colorFamily: product.colorFamily || null,
          colorHex: product.colorHex || null,
          netWeightG: product.netWeightG || null,
          mpn: product.mpn || null,
          sku: product.sku || null,
          tdsUrl: product.tdsUrl || null,
          nozzleTempMin: product.nozzleTempMin || null,
          nozzleTempMax: product.nozzleTempMax || null,
          bedTempMin: product.bedTempMin || null,
          bedTempMax: product.bedTempMax || null,
          region: productRegion,
        });
        
        if (!validation.valid) {
          console.warn(`[sync-brand-products] Validation failed for "${product.title}":`, validation.errors);
        }
        if (validation.warnings.length > 0) {
          console.log(`[sync-brand-products] Validation warnings for "${product.title}":`, validation.warnings);
        }

        // Update progress
        progress.productsProcessed = i + 1;
        progress.currentProduct = product.title?.slice(0, 50);
        
        if (!dryRun) {
          try {
            // Check if product already exists
            const { data: existing } = await supabase
              .from('filaments')
              .select('id, user_override_fields')
              .eq('product_id', product.productId)
              .ilike('vendor', brand.brand_name)
              .maybeSingle();

            if (existing) {
              // Update existing - pass region for regional field writes
              const overrideFields = existing.user_override_fields || [];
              const updateData = buildUpdateData(product, overrideFields, productRegion);
              
              const { error: updateError } = await supabase
                .from('filaments')
                .update({
                  ...updateData,
                  last_scraped_at: new Date().toISOString(),
                  updated_at: new Date().toISOString(),
                  auto_updated: true,
                  sync_status: 'synced',
                })
                .eq('id', existing.id);

              if (updateError) throw updateError;
              productResult.action = 'updated';
              summary.updated++;
              
              // Update region breakdown
              const regionStats = regionBreakdown.find(r => r.region === productRegion);
              if (regionStats) regionStats.updated++;
            } else {
              // Create new filament - use regional fields based on region
              const insertData: Record<string, any> = {
                product_id: product.productId,
                product_title: product.title,
                vendor: brand.brand_name,
                brand_id: brand.id,
                variant_available: product.available ?? true,
                featured_image: product.imageUrl,
                mpn: product.mpn,
                tds_url: product.tdsUrl,
                color_hex: product.colorHex,
                color_family: product.colorFamily,
                product_line_id: product.productLineId,
                nozzle_temp_min_c: product.nozzleTempMin,
                nozzle_temp_max_c: product.nozzleTempMax,
                bed_temp_min_c: product.bedTempMin,
                bed_temp_max_c: product.bedTempMax,
                diameter_nominal_mm: product.diameterMm ?? 1.75,
                net_weight_g: product.netWeightG,
                material: product.material,
                auto_created: true,
                auto_updated: true,
                last_scraped_at: new Date().toISOString(),
                sync_status: 'synced',
              };

              // Set regional price/URL fields using shared mapping
              const fieldMap = getRegionalFieldMapping(productRegion);
              if (product.price !== undefined) {
                insertData[fieldMap.priceField] = product.price;
              }
              if (fieldMap.compareAtPriceField && product.compareAtPrice !== undefined) {
                insertData[fieldMap.compareAtPriceField] = product.compareAtPrice;
              }
              if (product.url) {
                insertData[fieldMap.urlField] = product.url;
              }

              // Set available_regions array
              insertData.available_regions = buildAvailableRegions(insertData);

              const { error: insertError } = await supabase
                .from('filaments')
                .insert(insertData);

              if (insertError) throw insertError;
              productResult.action = 'created';
              summary.created++;
              
              // Update region breakdown
              const regionStats = regionBreakdown.find(r => r.region === productRegion);
              if (regionStats) regionStats.created++;
            }
          } catch (err) {
            const errorMsg = err instanceof Error ? err.message : 'Unknown error';
            console.error(`[sync-brand-products] Error processing product ${product.productId}:`, err);
            productResult.action = 'error';
            productResult.reason = errorMsg;
            progress.errors.push(`${product.title}: ${errorMsg}`);
            summary.errors++;
            
            // Update region breakdown
            const regionStats = regionBreakdown.find(r => r.region === productRegion);
            if (regionStats) regionStats.errors++;
          }
        } else {
          // Dry run - mark as would be created/updated
          productResult.action = 'skipped';
          productResult.reason = 'Dry run mode';
          summary.skipped++;
          
          // Update region breakdown
          const regionStats = regionBreakdown.find(r => r.region === productRegion);
          if (regionStats) regionStats.skipped++;
        }

        processedProducts.push(productResult);

        // Update progress every 10 products
        if (i % 10 === 0 || i === allScrapedProducts.length - 1) {
          await updateProgress(supabase, jobId, progress, processedProducts);
        }
      }

      // Calculate field coverage
      const fieldCoverage = calculateFieldCoverage(processedProducts, allScrapedProducts.length);

      // Update progress to complete
      progress.stage = scrapingError ? 'error' : 'complete';
      progress.regionsProcessed = syncRegions.length;

      const duration = Date.now() - startTime;
      
      console.log(`[sync-brand-products] Sync complete for ${brandSlug}`, {
        regions: syncRegions,
        regionBreakdown: regionBreakdown.map(r => ({ region: r.region, found: r.productsFound })),
        total: allScrapedProducts.length,
      });

      // Update sync log with final results
      if (jobId) {
        await supabase
          .from('brand_sync_logs')
          .update({
            status: scrapingError ? 'failed' : 'completed',
            completed_at: new Date().toISOString(),
            duration_seconds: Math.round(duration / 1000),
            products_discovered: allScrapedProducts.length,
            products_created: summary.created,
            products_updated: summary.updated,
            products_failed: summary.errors,
            error_details: scrapingError ? { error: scrapingError } : null,
            products_processed: {
              progress,
              products: processedProducts,
              fieldCoverage,
              regionBreakdown,
            },
          })
          .eq('id', jobId);
      }

      // Release scraping lock and update brand stats
      await supabase
        .from('automated_brands')
        .update({
          scraping_active: false,
          scrape_timeout_at: null,
          last_scrape_at: new Date().toISOString(),
          next_scrape_at: new Date(Date.now() + (brand.scrape_frequency_hours || 12) * 60 * 60 * 1000).toISOString(),
          total_scrapes: (brand.total_scrapes || 0) + 1,
          successful_scrapes: scrapingError ? brand.successful_scrapes : (brand.successful_scrapes || 0) + 1,
          failed_scrapes: scrapingError ? (brand.failed_scrapes || 0) + 1 : brand.failed_scrapes,
          last_error: scrapingError || null,
          last_error_at: scrapingError ? new Date().toISOString() : brand.last_error_at,
        })
        .eq('brand_slug', brandSlug);

      // Update product counts
      await supabase.rpc('update_brand_product_counts', { p_brand_slug: brandSlug });

      console.log(`[sync-brand-products] Completed sync for ${brandSlug}`, summary);

      return {
        success: !scrapingError,
        jobId,
        dryRun,
        brandSlug,
        platform: brand.platform_type,
        message: scrapingError || `Synced ${summary.total} products`,
        summary: {
          totalDiscovered: summary.total,
          created: summary.created,
          updated: summary.updated,
          skipped: summary.skipped,
          errors: summary.errors,
        },
        products: processedProducts,
        fieldCoverage,
        regionBreakdown,
        duration_ms: duration,
        startedAt: new Date(startTime).toISOString(),
        completedAt: new Date().toISOString(),
      };
    }

    // If background mode, use waitUntil and return immediately
    if (background) {
      // @ts-ignore - EdgeRuntime exists in Supabase edge functions
      EdgeRuntime.waitUntil(performSync());
      
      return new Response(
        JSON.stringify({
          success: true,
          jobId,
          message: `Started background sync for ${brandSlug}`,
          status: 'running',
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Synchronous mode - wait for completion
    const result = await performSync();
    
    return new Response(
      JSON.stringify(result),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('[sync-brand-products] Error:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

// Helper: Build update data respecting user overrides and region
// Uses REGIONAL_FIELD_MAPPING from shared schema for consistency
function buildUpdateData(product: any, overrideFields: string[], region: string = 'US'): Record<string, any> {
  const data: Record<string, any> = {};
  
  // Common fields (always update regardless of region)
  const commonFieldMapping: Record<string, string> = {
    title: 'product_title',
    imageUrl: 'featured_image',
    mpn: 'mpn',
    tdsUrl: 'tds_url',
    colorHex: 'color_hex',
    colorFamily: 'color_family',
    productLineId: 'product_line_id',
    nozzleTempMin: 'nozzle_temp_min_c',
    nozzleTempMax: 'nozzle_temp_max_c',
    bedTempMin: 'bed_temp_min_c',
    bedTempMax: 'bed_temp_max_c',
    material: 'material',
    netWeightG: 'net_weight_g',
    available: 'variant_available',
  };

  for (const [productKey, dbKey] of Object.entries(commonFieldMapping)) {
    if (product[productKey] !== undefined && !overrideFields.includes(dbKey)) {
      data[dbKey] = product[productKey];
    }
  }

  // Get regional field mapping from shared schema (handles EU sub-regions too)
  const fieldMap = getRegionalFieldMapping(region);
  
  // Set price field if not overridden
  if (product.price !== undefined && !overrideFields.includes(fieldMap.priceField)) {
    data[fieldMap.priceField] = product.price;
  }
  
  // Set compare at price for US region
  if (fieldMap.compareAtPriceField && product.compareAtPrice !== undefined && !overrideFields.includes(fieldMap.compareAtPriceField)) {
    data[fieldMap.compareAtPriceField] = product.compareAtPrice;
  }
  
  // Set URL field if not overridden
  if (product.url && !overrideFields.includes(fieldMap.urlField)) {
    data[fieldMap.urlField] = product.url;
  }

  return data;
}

// Shopify Scraper - with enhanced field extraction
async function scrapeShopify(brand: BrandConfig, materialFilter?: string, limit = 100): Promise<any[]> {
  const apiEndpoint = brand.api_endpoint || `${brand.base_url}/products.json`;
  const products: any[] = [];
  let page = 1;
  
  while (products.length < limit) {
    const url = `${apiEndpoint}?limit=250&page=${page}`;
    console.log(`[shopify] Fetching ${url}`);
    
    const response = await fetch(url, {
      headers: { 'User-Agent': 'FilaScope/1.0' },
    });

    if (!response.ok) {
      throw new Error(`Shopify API error: ${response.status}`);
    }

    const data = await response.json();
    if (!data.products || data.products.length === 0) break;

    for (const product of data.products) {
      // Filter for filament products
      if (!isFilamentProduct(product)) continue;
      
      // Apply material filter if specified
      if (materialFilter && !product.title.toLowerCase().includes(materialFilter.toLowerCase())) {
        continue;
      }

      // Get best variant
      const variant = product.variants?.[0];
      if (!variant) continue;

      // Extract fields using unified schema helpers
      const title = cleanTitle(product.title);
      const material = extractMaterial(title, product.product_type);
      const colorFamily = extractColorFamily(title);
      const netWeightG = extractWeight(title, variant.grams);
      const productLineId = generateProductLineId(brand.brand_slug, material, title);

      products.push({
        productId: String(product.id),
        title,
        price: parseFloat(variant.price) || null,
        compareAtPrice: variant.compare_at_price ? parseFloat(variant.compare_at_price) : null,
        available: variant.available,
        url: `${brand.base_url}/products/${product.handle}`,
        imageUrl: product.images?.[0]?.src || null,
        mpn: variant.sku || null,
        sku: variant.sku || null,
        barcode: variant.barcode || null,
        material,
        colorFamily,
        netWeightG,
        productLineId,
        // Extract color hex from variant if available
        colorHex: extractColorHexFromVariant(variant, product),
      });

      if (products.length >= limit) break;
    }

    if (data.products.length < 250) break;
    page++;
    
    // Rate limiting
    await new Promise(r => setTimeout(r, brand.rate_limit_ms || 500));
  }

  return products;
}

// Extract color hex from Shopify variant options
function extractColorHexFromVariant(variant: any, product: any): string | null {
  // Check variant options for color
  const colorOption = variant.option1 || variant.option2 || variant.option3;
  if (!colorOption) return null;
  
  // Check product metafields if available (some stores include color_hex)
  const metafields = product.metafields || [];
  for (const meta of metafields) {
    if (meta.key === 'color_hex' || meta.key === 'hex_color') {
      return meta.value;
    }
  }
  
  return null;
}

// WooCommerce Scraper - with enhanced field extraction
async function scrapeWooCommerce(brand: BrandConfig, materialFilter?: string, limit = 100): Promise<any[]> {
  const apiEndpoint = brand.api_endpoint || `${brand.base_url}/wp-json/wc/store/v1/products`;
  const products: any[] = [];
  let page = 1;
  
  while (products.length < limit) {
    const url = `${apiEndpoint}?per_page=100&page=${page}`;
    console.log(`[woocommerce] Fetching ${url}`);
    
    const response = await fetch(url, {
      headers: { 'User-Agent': 'FilaScope/1.0' },
    });

    if (!response.ok) {
      if (response.status === 404) break;
      throw new Error(`WooCommerce API error: ${response.status}`);
    }

    const data = await response.json();
    if (!data || data.length === 0) break;

    for (const product of data) {
      // Filter for filament products
      const name = product.name?.toLowerCase() || '';
      const slug = product.slug?.toLowerCase() || '';
      if (!name.includes('filament') && !slug.includes('filament') && !name.includes('pla') && !name.includes('petg')) {
        continue;
      }

      if (materialFilter && !name.includes(materialFilter.toLowerCase())) {
        continue;
      }

      const price = product.prices?.price ? parseFloat(product.prices.price) / 100 : null;
      const regularPrice = product.prices?.regular_price ? parseFloat(product.prices.regular_price) / 100 : null;
      
      // Extract fields using unified schema helpers
      const title = cleanTitle(product.name);
      const material = extractMaterial(title, '');
      const colorFamily = extractColorFamily(title);
      const netWeightG = extractWeight(title);
      const productLineId = generateProductLineId(brand.brand_slug, material, title);

      products.push({
        productId: String(product.id),
        title,
        price,
        compareAtPrice: regularPrice !== price ? regularPrice : null,
        available: product.is_purchasable && product.is_in_stock,
        url: product.permalink,
        imageUrl: product.images?.[0]?.src || null,
        mpn: product.sku || null,
        sku: product.sku || null,
        material,
        colorFamily,
        netWeightG,
        productLineId,
      });

      if (products.length >= limit) break;
    }

    if (data.length < 100) break;
    page++;
    
    await new Promise(r => setTimeout(r, brand.rate_limit_ms || 1000));
  }

  return products;
}

// Firecrawl Scraper (simplified - would need Firecrawl API key for full implementation)
async function scrapeFirecrawl(brand: BrandConfig, materialFilter?: string, limit = 100): Promise<any[]> {
  console.log(`[firecrawl] Firecrawl scraping for ${brand.brand_name} - requires FIRECRAWL_API_KEY`);
  
  const firecrawlKey = Deno.env.get('FIRECRAWL_API_KEY');
  if (!firecrawlKey) {
    console.warn('[firecrawl] FIRECRAWL_API_KEY not set');
    return [];
  }

  // For now, return empty - full implementation would use Firecrawl API
  // This is a placeholder for brands that need HTML scraping
  return [];
}

// BigCommerce Scraper
async function scrapeBigCommerce(brand: BrandConfig, materialFilter?: string, limit = 100): Promise<any[]> {
  console.log(`[bigcommerce] BigCommerce scraping for ${brand.brand_name}`);
  // BigCommerce requires API credentials - return empty for now
  return [];
}

// Get existing Amazon products from database
async function getAmazonProducts(supabase: any, brandName: string, limit: number): Promise<any[]> {
  const { data: products } = await supabase
    .from('filaments')
    .select('product_id, product_title, variant_price, amazon_link_us, amazon_price_usd')
    .ilike('vendor', brandName)
    .limit(limit);

  return (products || []).map((p: any) => ({
    productId: p.product_id,
    title: p.product_title,
    price: p.variant_price || p.amazon_price_usd,
    url: p.amazon_link_us,
    source: 'database',
  }));
}

// Helper: Check if product is a filament
function isFilamentProduct(product: any): boolean {
  const title = (product.title || '').toLowerCase();
  const type = (product.product_type || '').toLowerCase();
  const tags = (product.tags || []).join(' ').toLowerCase();
  
  const filamentKeywords = ['filament', 'pla', 'petg', 'abs', 'tpu', 'asa', 'nylon', 'pa', 'pc', 'cf'];
  const excludeKeywords = ['resin', 'printer', 'accessory', 'part', 'nozzle', 'bed', 'hotend'];
  
  const hasFilamentKeyword = filamentKeywords.some(k => 
    title.includes(k) || type.includes(k) || tags.includes(k)
  );
  
  const hasExcludeKeyword = excludeKeywords.some(k => 
    title.includes(k) || type.includes(k)
  );
  
  return hasFilamentKeyword && !hasExcludeKeyword;
}

// Helper: Clean product title
function cleanTitle(title: string): string {
  return title
    .replace(/\s+/g, ' ')
    .replace(/^\s+|\s+$/g, '')
    .replace(/\([^)]*\)/g, '') // Remove parentheses content
    .trim();
}

// Note: extractMaterial is now imported from _shared/filament-schema.ts
