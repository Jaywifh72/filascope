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
import { getColorHex, getColorFamily, extractColorFromTitle } from '../_shared/color-mapping.ts';

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
  // MatterHackers - custom platform
  'matterhackers': {
    US: 'www.matterhackers.com',
  },
  // NinjaTek - WooCommerce
  'ninjatek': {
    US: 'ninjatek.com',
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
              case 'custom':
                // Route to brand-specific scrapers for custom platforms
                regionProducts = await scrapeCustomPlatform(supabase, regionalBrand, materialFilter, limit);
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
        // Use enhanced color extraction with shared color-mapping
        colorFamily: extractColorFamilyFromVariant(variant, product, title) || colorFamily,
        colorHex: extractColorHexFromVariant(variant, product, title),
        netWeightG,
        productLineId,
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

// Extract color hex from Shopify variant options - enhanced with color-mapping
function extractColorHexFromVariant(variant: any, product: any, title: string): string | null {
  // Check variant options for color
  const colorOption = variant.option1 || variant.option2 || variant.option3;
  
  // First try: Check product metafields if available
  const metafields = product.metafields || [];
  for (const meta of metafields) {
    if (meta.key === 'color_hex' || meta.key === 'hex_color') {
      return meta.value;
    }
  }
  
  // Second try: Extract from variant option using color-mapping
  if (colorOption) {
    const hex = getColorHex(colorOption);
    if (hex) {
      return `#${hex}`;
    }
  }
  
  // Third try: Extract from product title
  const titleLower = title.toLowerCase();
  // Look for common color patterns in title
  const colorPatterns = [
    // Match "- Color" pattern (e.g., "PLA - Red")
    /\s-\s([^-\d]+)$/i,
    // Match color at end after material (e.g., "PLA 1kg Black")
    /(?:kg|g)\s+(.+?)$/i,
    // Match in parentheses (e.g., "PLA (Matte Black)")
    /\(([^)]+)\)/i,
  ];
  
  for (const pattern of colorPatterns) {
    const match = title.match(pattern);
    if (match?.[1]) {
      const potentialColor = match[1].trim();
      const hex = getColorHex(potentialColor);
      if (hex) {
        return `#${hex}`;
      }
    }
  }
  
  return null;
}

// Extract color family from Shopify product - enhanced
function extractColorFamilyFromVariant(variant: any, product: any, title: string): string | null {
  const colorOption = variant.option1 || variant.option2 || variant.option3;
  
  // First try variant option
  if (colorOption) {
    const family = getColorFamily(colorOption);
    if (family) return family;
  }
  
  // Second try from title
  const titleLower = title.toLowerCase();
  const colorPatterns = [
    /\s-\s([^-\d]+)$/i,
    /(?:kg|g)\s+(.+?)$/i,
    /\(([^)]+)\)/i,
  ];
  
  for (const pattern of colorPatterns) {
    const match = title.match(pattern);
    if (match?.[1]) {
      const family = getColorFamily(match[1].trim());
      if (family) return family;
    }
  }
  
  // Fallback to basic extraction
  return extractColorFamily(title);
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
      const netWeightG = extractWeight(title);
      const productLineId = generateProductLineId(brand.brand_slug, material, title);
      
      // Extract color using enhanced color-mapping
      const colorHex = extractWooCommerceColorHex(product, title);
      const colorFamily = extractWooCommerceColorFamily(product, title);

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
        colorHex,
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

// Extract color hex from WooCommerce product
function extractWooCommerceColorHex(product: any, title: string): string | null {
  // Check attributes for color
  const attributes = product.attributes || [];
  for (const attr of attributes) {
    const attrName = (attr.name || '').toLowerCase();
    if (attrName.includes('color') || attrName.includes('colour')) {
      const value = Array.isArray(attr.terms) ? attr.terms[0]?.name : attr.value;
      if (value) {
        const hex = getColorHex(value);
        if (hex) return `#${hex}`;
      }
    }
  }
  
  // Extract from title
  const colorPatterns = [
    /\s-\s([^-\d]+)$/i,
    /(?:kg|g)\s+(.+?)$/i,
    /\(([^)]+)\)/i,
  ];
  
  for (const pattern of colorPatterns) {
    const match = title.match(pattern);
    if (match?.[1]) {
      const hex = getColorHex(match[1].trim());
      if (hex) return `#${hex}`;
    }
  }
  
  return null;
}

// Extract color family from WooCommerce product
function extractWooCommerceColorFamily(product: any, title: string): string | null {
  // Check attributes for color
  const attributes = product.attributes || [];
  for (const attr of attributes) {
    const attrName = (attr.name || '').toLowerCase();
    if (attrName.includes('color') || attrName.includes('colour')) {
      const value = Array.isArray(attr.terms) ? attr.terms[0]?.name : attr.value;
      if (value) {
        const family = getColorFamily(value);
        if (family) return family;
      }
    }
  }
  
  // Extract from title
  const colorPatterns = [
    /\s-\s([^-\d]+)$/i,
    /(?:kg|g)\s+(.+?)$/i,
    /\(([^)]+)\)/i,
  ];
  
  for (const pattern of colorPatterns) {
    const match = title.match(pattern);
    if (match?.[1]) {
      const family = getColorFamily(match[1].trim());
      if (family) return family;
    }
  }
  
  // Fallback to basic extraction
  return extractColorFamily(title);
}

// Firecrawl Scraper - Uses Firecrawl API for HTML-based sites
async function scrapeFirecrawl(brand: BrandConfig, materialFilter?: string, limit = 100): Promise<any[]> {
  console.log(`[firecrawl] Firecrawl scraping for ${brand.brand_name}`);
  
  const firecrawlKey = Deno.env.get('FIRECRAWL_API_KEY');
  if (!firecrawlKey) {
    console.warn('[firecrawl] FIRECRAWL_API_KEY not set - falling back to Shopify JSON');
    // Try Shopify JSON as fallback for many sites
    try {
      return await scrapeShopify(brand, materialFilter, limit);
    } catch (e) {
      console.warn('[firecrawl] Shopify fallback failed:', e);
      return [];
    }
  }

  const products: any[] = [];
  const productsUrl = brand.api_endpoint || `${brand.base_url}/collections/all`;
  
  try {
    // First, map the site to discover product URLs
    console.log(`[firecrawl] Mapping site: ${brand.base_url}`);
    const mapResponse = await fetch('https://api.firecrawl.dev/v1/map', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${firecrawlKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        url: brand.base_url,
        search: 'filament product',
        limit: Math.min(limit * 2, 500), // Get more URLs than needed to filter
        includeSubdomains: false,
      }),
    });

    if (!mapResponse.ok) {
      const errorText = await mapResponse.text();
      console.error(`[firecrawl] Map API error: ${mapResponse.status}`, errorText);
      // Fallback to Shopify JSON
      return await scrapeShopify(brand, materialFilter, limit);
    }

    const mapData = await mapResponse.json();
    const productUrls = (mapData.links || []).filter((url: string) => 
      url.includes('/products/') || url.includes('/product/') || url.includes('filament')
    ).slice(0, limit);

    console.log(`[firecrawl] Found ${productUrls.length} potential product URLs`);

    // Scrape individual product pages
    for (const productUrl of productUrls) {
      if (products.length >= limit) break;
      
      try {
        const scrapeResponse = await fetch('https://api.firecrawl.dev/v1/scrape', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${firecrawlKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            url: productUrl,
            formats: ['markdown', 'html'],
            onlyMainContent: true,
          }),
        });

        if (!scrapeResponse.ok) continue;

        const scrapeData = await scrapeResponse.json();
        const html = scrapeData.data?.html || '';
        const markdown = scrapeData.data?.markdown || '';
        const metadata = scrapeData.data?.metadata || {};

        // Extract product info from scraped content
        const product = extractProductFromHtml(html, markdown, productUrl, brand, metadata);
        
        if (product && product.title) {
          // Apply material filter
          if (materialFilter && !product.title.toLowerCase().includes(materialFilter.toLowerCase())) {
            continue;
          }
          products.push(product);
        }

        // Rate limiting between requests
        await new Promise(r => setTimeout(r, brand.rate_limit_ms || 1000));
      } catch (err) {
        console.warn(`[firecrawl] Error scraping ${productUrl}:`, err);
      }
    }
  } catch (err) {
    console.error(`[firecrawl] Error:`, err);
    // Fallback to Shopify JSON
    return await scrapeShopify(brand, materialFilter, limit);
  }

  console.log(`[firecrawl] Scraped ${products.length} products for ${brand.brand_name}`);
  return products;
}

// Extract product data from scraped HTML/markdown
function extractProductFromHtml(html: string, markdown: string, url: string, brand: BrandConfig, metadata: any): any | null {
  try {
    // Extract product ID from URL
    const urlParts = url.split('/');
    const slug = urlParts[urlParts.length - 1]?.split('?')[0] || '';
    const productId = slug || `fc-${Date.now()}`;

    // Extract title from metadata or HTML
    let title = metadata.title || '';
    const titleMatch = html.match(/<h1[^>]*>([^<]+)<\/h1>/i) || 
                       html.match(/<title>([^<]+)<\/title>/i);
    if (!title && titleMatch) {
      title = titleMatch[1].trim();
    }
    
    // Clean title - remove brand/site name suffixes
    title = title.replace(/\s*[-|–]\s*(.*?)$/, '').trim();
    title = cleanTitle(title);

    if (!title || title.length < 3) return null;

    // Extract price from JSON-LD or HTML
    let price: number | null = null;
    const jsonLdMatch = html.match(/<script[^>]*type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/gi);
    if (jsonLdMatch) {
      for (const match of jsonLdMatch) {
        try {
          const jsonContent = match.replace(/<script[^>]*>|<\/script>/gi, '');
          const jsonData = JSON.parse(jsonContent);
          if (jsonData.offers?.price) {
            price = parseFloat(jsonData.offers.price);
          } else if (jsonData['@graph']) {
            for (const item of jsonData['@graph']) {
              if (item.offers?.price) {
                price = parseFloat(item.offers.price);
                break;
              }
            }
          }
        } catch {}
      }
    }

    // Fallback price extraction from HTML
    if (!price) {
      const priceMatch = html.match(/\$(\d+(?:\.\d{2})?)/);
      if (priceMatch) {
        price = parseFloat(priceMatch[1]);
      }
    }

    // Extract image
    let imageUrl: string | null = null;
    const ogImageMatch = html.match(/<meta[^>]*property="og:image"[^>]*content="([^"]+)"/i);
    if (ogImageMatch) {
      imageUrl = ogImageMatch[1];
    } else {
      const imgMatch = html.match(/<img[^>]*class="[^"]*product[^"]*"[^>]*src="([^"]+)"/i) ||
                       html.match(/<img[^>]*src="([^"]+)"[^>]*class="[^"]*product/i);
      if (imgMatch) {
        imageUrl = imgMatch[1];
      }
    }

    // Extract TDS URL
    let tdsUrl: string | null = null;
    const tdsPatterns = [
      /href="([^"]+(?:tds|technical[-_]?data|datasheet|spec)(?:sheet)?[^"]*\.pdf)"/gi,
      /href="([^"]+\.pdf)"[^>]*>(?:[^<]*(?:TDS|Technical|Datasheet|Spec))/gi,
    ];
    for (const pattern of tdsPatterns) {
      const tdsMatch = html.match(pattern);
      if (tdsMatch?.[1]) {
        tdsUrl = tdsMatch[1];
        if (!tdsUrl.startsWith('http')) {
          tdsUrl = new URL(tdsUrl, brand.base_url).href;
        }
        break;
      }
    }

    // Extract material and color
    const material = extractMaterial(title, '');
    const colorResult = extractColorFromTitle(title);
    const netWeightG = extractWeight(title);
    const productLineId = generateProductLineId(brand.brand_slug, material, title);

    return {
      productId,
      title,
      price,
      compareAtPrice: null,
      available: true,
      url,
      imageUrl,
      mpn: null,
      sku: null,
      material,
      colorFamily: colorResult.colorFamily,
      colorHex: colorResult.colorHex ? `#${colorResult.colorHex}` : null,
      netWeightG,
      tdsUrl,
      productLineId,
    };
  } catch (err) {
    console.warn('[firecrawl] Error extracting product:', err);
    return null;
  }
}

// Custom platform scraper - routes to brand-specific implementations
async function scrapeCustomPlatform(supabase: any, brand: BrandConfig, materialFilter?: string, limit = 100): Promise<any[]> {
  console.log(`[custom] Custom scraping for ${brand.brand_slug}`);
  
  switch (brand.brand_slug) {
    case 'matterhackers':
      return await scrapeMatterHackers(brand, materialFilter, limit);
    case 'treed-filaments':
      // TreeD uses Shopify - try JSON first, then Firecrawl
      try {
        const products = await scrapeShopify(brand, materialFilter, limit);
        if (products.length > 0) return products;
      } catch (e) {
        console.log('[custom] TreeD Shopify failed, trying Firecrawl');
      }
      return await scrapeFirecrawl(brand, materialFilter, limit);
    case 'ninjatek':
      // NinjaTek uses Shopify now (migrated from WooCommerce)
      return await scrapeShopify({ ...brand, api_endpoint: `${brand.base_url}/products.json` }, materialFilter, limit);
    default:
      // Try Shopify first, then Firecrawl as fallback
      try {
        return await scrapeShopify(brand, materialFilter, limit);
      } catch (e) {
        return await scrapeFirecrawl(brand, materialFilter, limit);
      }
  }
}

// MatterHackers custom scraper
async function scrapeMatterHackers(brand: BrandConfig, materialFilter?: string, limit = 100): Promise<any[]> {
  console.log(`[matterhackers] Scraping MatterHackers`);
  const products: any[] = [];
  
  const catalogUrls = [
    'https://www.matterhackers.com/store/c/3d-printer-filament',
    'https://www.matterhackers.com/store/c/pla-3d-printer-filament',
    'https://www.matterhackers.com/store/c/petg-3d-printer-filament',
    'https://www.matterhackers.com/store/c/abs-3d-printer-filament',
    'https://www.matterhackers.com/store/c/tpu-3d-printer-filament',
  ];

  const firecrawlKey = Deno.env.get('FIRECRAWL_API_KEY');
  if (!firecrawlKey) {
    console.warn('[matterhackers] FIRECRAWL_API_KEY not set');
    return [];
  }

  for (const catalogUrl of catalogUrls) {
    if (products.length >= limit) break;

    try {
      // Scrape catalog page
      const response = await fetch('https://api.firecrawl.dev/v1/scrape', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${firecrawlKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          url: catalogUrl,
          formats: ['html'],
          onlyMainContent: true,
        }),
      });

      if (!response.ok) continue;

      const data = await response.json();
      const html = data.data?.html || '';

      // Extract product URLs and basic info from catalog
      const productMatches = html.matchAll(/<a[^>]*href="(\/store\/3d-printer-filament\/[^"]+)"[^>]*>([^<]+)/gi);
      
      for (const match of productMatches) {
        if (products.length >= limit) break;
        
        const productPath = match[1];
        const productUrl = `https://www.matterhackers.com${productPath}`;
        const title = match[2]?.trim();

        if (!title || title.length < 5) continue;
        if (materialFilter && !title.toLowerCase().includes(materialFilter.toLowerCase())) continue;

        // Extract product ID from URL
        const productId = productPath.split('/').pop() || `mh-${Date.now()}`;

        // Extract color and material
        const material = extractMaterial(title, '');
        const colorResult = extractColorFromTitle(title);
        const netWeightG = extractWeight(title);

        products.push({
          productId,
          title: cleanTitle(title),
          price: null, // Would need to scrape individual pages
          compareAtPrice: null,
          available: true,
          url: productUrl,
          imageUrl: null,
          mpn: null,
          material,
          colorFamily: colorResult.colorFamily,
          colorHex: colorResult.colorHex ? `#${colorResult.colorHex}` : null,
          netWeightG,
          productLineId: generateProductLineId(brand.brand_slug, material, title),
        });
      }

      await new Promise(r => setTimeout(r, 1000));
    } catch (err) {
      console.warn(`[matterhackers] Error scraping ${catalogUrl}:`, err);
    }
  }

  console.log(`[matterhackers] Found ${products.length} products`);
  return products;
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
