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
import {
  shouldIncludeVariant,
  createFilterStats,
  updateFilterStats,
  logFilterStats,
  extractDiameterFromText,
} from '../_shared/variant-filters.ts';
// Brand-specific filters and helpers for non-filament products
import {
  isNonFilamentProduct as isAnycubicNonFilament,
  getAnycubicColorHex,
  cleanAnycubicTitle,
  generateAnycubicProductLineId,
} from '../_shared/anycubic-defaults.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Regional configuration for multi-region brands
// CORRECTED mappings with verified store URLs
const BRAND_REGIONAL_DOMAINS: Record<string, Record<string, string>> = {
  // === MAJOR BRANDS WITH VERIFIED REGIONAL SUBDOMAINS ===
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
    CA: 'ca.polymaker.com',
    EU: 'eu.polymaker.com' 
  },
  // Creality - FIXED: uses path-based routing (store.creality.com/XX/products/slug)
  'creality': { 
    US: 'store.creality.com', 
    CA: 'store.creality.com', 
    UK: 'store.creality.com', 
    EU: 'store.creality.com', 
    AU: 'store.creality.com' 
  },
  // Anycubic - Uses regional subdomains (no AU - DNS failure)
  'anycubic': { 
    US: 'store.anycubic.com', 
    CA: 'ca.anycubic.com', 
    UK: 'uk.anycubic.com', 
    EU: 'eu.anycubic.com',
    AU: 'www.anycubic.au'
  },
  'qidi': { 
    US: 'us.qidi3d.com', 
    CA: 'ca.qidi3d.com', 
    UK: 'uk.qidi3d.com', 
    EU: 'eu.qidi3d.com', 
    AU: 'au.qidi3d.com' 
  },
  'flashforge': { 
    US: 'www.flashforge.com', 
    CA: 'ca.flashforge.com',
    EU: 'eu.flashforge.com',
    UK: 'uk.flashforge.com',
    AU: 'au.flashforge.com'
  },
  // === ADDITIONAL BRANDS WITH REGIONAL STORES ===
  // Sunlu - ADDED regional domains
  'sunlu': {
    US: 'store.sunlu.com',
    CA: 'ca.sunlu.com',
    UK: 'uk.sunlu.com',
    AU: 'au.sunlu.com',
    EU: 'store.sunlu.com'
  },
  'eryone': {
    US: 'eryone3d.com',
    CA: 'ca.eryone3d.com',
    UK: 'uk.eryone3d.com',
    EU: 'de.eryone3d.com',
    AU: 'au.eryone3d.com'
  },
  'jayo': {
    US: 'www.jayo3d.com',
    UK: 'uk.jayo3d.com',
    EU: 'eu.jayo3d.com'
  },
  // Kingroon - FIXED: added www prefix
  'kingroon': {
    US: 'kingroon.com',
    CA: 'ca.kingroon.com',
    UK: 'uk.kingroon.com',
    EU: 'eu.kingroon.com',
    AU: 'au.kingroon.com'
  },
  'sovol': {
    US: 'www.sovol3d.com',
    EU: 'sovol.eu'
  },
  'raise3d': {
    US: 'shop.raise3d.com',
    EU: 'eu.raise3d.com'
  },
  'ratrig': {
    EU: 'www.ratrig.com'
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
    US: 'us.store.flsun3d.com',
    CA: 'ca.store.flsun3d.com',
    UK: 'uk.store.flsun3d.com',
    EU: 'eu.store.flsun3d.com',
    AU: 'au.store.flsun3d.com'
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
  // MatterHackers - custom platform (US only)
  'matterhackers': {
    US: 'www.matterhackers.com',
  },
  // NinjaTek - WooCommerce (US only)
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
    let { brandSlug, dryRun = true, materialFilter, regions, tasks = ['products'], limit = 100, background = false } = body;
    
    // Anycubic has many color variants per product line - increase limit to ensure complete coverage
    if (brandSlug === 'anycubic' && limit <= 100) {
      limit = 200;
      console.log(`[sync-brand-products] Increased limit to ${limit} for Anycubic (many color variants)`);
    }

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
            
            // Log region-level scraping failure to scrape_errors
            await supabase.from('scrape_errors').insert({
              brand_slug: brandSlug,
              error_type: errorMsg.includes('timeout') ? 'timeout' : errorMsg.includes('404') ? '404' : 'network',
              error_message: `Region ${region}: ${errorMsg}`.slice(0, 500),
              stack_trace: err instanceof Error ? err.stack?.slice(0, 2000) : null,
              region: region,
              sync_run_id: jobId || null,
            }).then(() => {});
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
            
            // Insert error into scrape_errors table
            await supabase.from('scrape_errors').insert({
              brand_slug: brandSlug,
              filament_id: product.existingId || null,
              url: product.url || null,
              error_type: errorMsg.includes('timeout') ? 'timeout' : errorMsg.includes('404') ? '404' : 'parse_error',
              error_message: errorMsg.slice(0, 500),
              stack_trace: err instanceof Error ? err.stack?.slice(0, 2000) : null,
              region: productRegion,
              sync_run_id: jobId || null,
            }).then(() => {});
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

      // Build regional_breakdown JSON for Sync Monitor
      const regionalBreakdownJson: Record<string, unknown> = {};
      for (const rb of regionBreakdown) {
        const errorMessages = progress.errors
          .filter(e => e.startsWith(`${rb.region}:`))
          .map(e => e.replace(`${rb.region}: `, ''));
        regionalBreakdownJson[rb.region] = {
          updated: rb.updated,
          created: rb.created,
          skipped: rb.skipped,
          errors: rb.errors,
          products_found: rb.productsFound,
          duration_ms: rb.duration_ms,
          ...(errorMessages.length > 0 ? { error_messages: errorMessages } : {}),
        };
      }

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
            regions_synced: syncRegions,
            regional_breakdown: regionalBreakdownJson,
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

      // Validate and fix any duplicate hex codes created during sync
      let duplicateValidation = { fixed: 0, duplicates: [] as any[] };
      if (!dryRun) {
        duplicateValidation = await validateAndFixDuplicateHexes(supabase, brand.brand_name);
        if (duplicateValidation.fixed > 0) {
          console.log(`[sync-brand-products] Fixed ${duplicateValidation.fixed} duplicate hex codes for ${brandSlug}`);
        }
      }

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

// Brands that ALWAYS use variant explosion regardless of heuristics
// These brands are known to have multi-color products that need 1:1 variant mapping
const FORCE_VARIANT_EXPLOSION_BRANDS = ['amolen', 'anycubic', 'eryone', 'sunlu', 'jayo'];

// Helper: Check if Shopify product has multiple color variants that should be exploded
// AGGRESSIVE EXPLOSION: For filament products, multiple variants almost always mean color variations
function hasMultipleColorVariants(product: any, brandSlug?: string): boolean {
  const variants = product.variants || [];
  if (variants.length <= 1) return false;
  
  // FORCE variant explosion for specific brands
  if (brandSlug && FORCE_VARIANT_EXPLOSION_BRANDS.includes(brandSlug.toLowerCase())) {
    return true;
  }
  
  // Check if variants differ by color-related options
  const colorOptionNames = ['color', 'colour', 'farbe', 'couleur', 'title'];
  const options = product.options || [];
  
  // Check if any option is color-related
  for (const option of options) {
    const optionName = (option.name || '').toLowerCase();
    if (colorOptionNames.some(c => optionName.includes(c))) {
      return option.values?.length > 1;
    }
  }
  
  // AGGRESSIVE: If option1 values differ across variants, assume they're color variants
  // For filament products, different option1 values almost always represent colors
  const option1Values = new Set(variants.map((v: any) => v.option1).filter(Boolean));
  if (option1Values.size > 1) {
    // If at least ONE value looks like a color, explode ALL variants
    const sampleValues = Array.from(option1Values);
    const hasAnyColorMatch = sampleValues.some(v => {
      const val = String(v).toLowerCase();
      // Check direct color match
      if (getColorHex(val) !== null) return true;
      // Check if contains common color words (for compound names like "Silk Coffee Gold")
      const colorWords = ['black', 'white', 'grey', 'gray', 'red', 'blue', 'green', 'yellow', 
        'orange', 'purple', 'pink', 'brown', 'gold', 'silver', 'copper', 'bronze', 'rainbow',
        'transparent', 'clear', 'glow', 'silk', 'matte', 'neon', 'coffee', 'aqua', 'sky'];
      return colorWords.some(cw => val.includes(cw));
    });
    
    // If any color indicator found OR there are 3+ unique option values, explode
    if (hasAnyColorMatch || option1Values.size >= 3) {
      return true;
    }
  }
  
  return false;
}

// Helper: Extract color name from variant options
// ALWAYS returns the option value for color-like variants, even if not in color mapping
function extractColorNameFromVariant(variant: any): string | null {
  // Check option1 first (most common for color)
  const colorOption = variant.option1 || variant.option2 || variant.option3;
  if (colorOption && typeof colorOption === 'string') {
    // Return the color option as-is - we want to capture ALL variant names
    // The color mapping will handle hex extraction separately
    return colorOption;
  }
  return null;
}

// Helper: Find variant-specific image from Shopify product
function findVariantImage(product: any, variant: any, colorName: string | null): string | null {
  const images = product.images || [];
  
  // First: Check if variant has specific image_id
  if (variant.image_id) {
    const variantImg = images.find((img: any) => img.id === variant.image_id);
    if (variantImg?.src) return variantImg.src;
  }
  
  // Second: Check variant_ids on images
  for (const img of images) {
    if (img.variant_ids?.includes(variant.id)) {
      return img.src;
    }
  }
  
  // Third: Try matching image alt text to color name
  if (colorName) {
    const colorLower = colorName.toLowerCase();
    for (const img of images) {
      const alt = (img.alt || '').toLowerCase();
      if (alt.includes(colorLower)) {
        return img.src;
      }
    }
  }
  
  // Fallback: return first image
  return images[0]?.src || null;
}

// Shopify Scraper - with enhanced field extraction and VARIANT EXPLOSION
async function scrapeShopify(brand: BrandConfig, materialFilter?: string, limit = 100): Promise<any[]> {
  const apiEndpoint = brand.api_endpoint || `${brand.base_url}/products.json`;
  const products: any[] = [];
  let page = 1;
  const filterStats = createFilterStats();
  
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
      // BRAND-SPECIFIC FILTERING (check product handle/URL before generic filter)
      if (brand.brand_slug === 'anycubic') {
        if (isAnycubicNonFilament(product.handle || '')) {
          console.log(`[shopify] Skipping Anycubic non-filament: ${product.handle}`);
          continue;
        }
        // Promotional products are now processed normally - stripPromotionalFromTitle() handles grouping
      }
      
      // Filter for filament products (generic check)
      if (!isFilamentProduct(product)) continue;
      
      // Apply material filter if specified
      if (materialFilter && !product.title.toLowerCase().includes(materialFilter.toLowerCase())) {
        continue;
      }

      const variants = product.variants || [];
      if (variants.length === 0) continue;

      // Identify if this product has color variants that should be exploded
      // Check if variants differ by color options (option1, option2, option3)
      const hasColorVariants = hasMultipleColorVariants(product, brand.brand_slug);
      
      // Extract common fields from product title
      const baseTitle = cleanTitle(product.title);
      const material = extractMaterial(baseTitle, product.product_type);

      if (hasColorVariants) {
        // VARIANT EXPLOSION: Create separate database row for each UNIQUE COLOR variant
        // Track seen colors to avoid duplicates (e.g., same color with different delivery options)
        const seenColors = new Set<string>();
        
        for (const variant of variants) {
          // Skip if we've hit the limit
          if (products.length >= limit) break;
          
          // Extract color from variant options
          const colorName = extractColorNameFromVariant(variant);
          
          // DEDUPLICATION: Skip if we've already seen this color
          // This handles stores with multiple variants per color (e.g., different delivery options)
          const colorKey = (colorName || 'default').toLowerCase().trim();
          if (seenColors.has(colorKey)) {
            continue; // Skip duplicate color
          }
          seenColors.add(colorKey);
          const colorHex = extractColorHexFromVariant(variant, product, baseTitle, brand.brand_slug);
          const colorFamily = extractColorFamilyFromVariant(variant, product, baseTitle) || extractColorFamily(baseTitle);
          
          // CRITICAL: Use base Shopify title for product_title (matches page H1)
          // For Anycubic: Strip promotional text for cleaner titles
          // Color is stored separately in color_family/color_hex fields
          // This ensures DB title = Page H1 title (Names Match consistency rule)
          let variantTitle = baseTitle;
          if (brand.brand_slug === 'anycubic') {
            variantTitle = cleanAnycubicTitle(baseTitle);
          }
          
          // Find variant-specific image (match by variant_id or color name)
          const variantImage = findVariantImage(product, variant, colorName);
          
          const netWeightG = extractWeight(variantTitle, variant.grams);
          
          // Extract diameter from title/variant for filtering
          const diameterMm = extractDiameterFromText(variantTitle) || extractDiameterFromText(variant.option1 || '') || 1.75;
          
          // Apply standard variant filtering (exclude bulk >5.5kg, samples <300g, 2.85mm, excluded keywords)
          const filterResult = shouldIncludeVariant(netWeightG, diameterMm, variantTitle);
          updateFilterStats(filterStats, filterResult);
          if (!filterResult.include) {
            console.log(`[shopify] Skipping variant: ${filterResult.reason} - ${variantTitle}`);
            continue;
          }
          
          // Generate product line ID with weight to separate bulk packs
          // Use Anycubic-specific function for consistent + to 'plus' normalization
          let productLineId: string;
          if (brand.brand_slug === 'anycubic') {
            productLineId = generateAnycubicProductLineId(variantTitle, material);
          } else {
            productLineId = generateProductLineId(brand.brand_slug, material, baseTitle, netWeightG);
          }

          products.push({
            // CRITICAL: Unique product_id per variant for separate database rows
            productId: `${product.id}_${variant.id}`,
            title: variantTitle,
            price: parseFloat(variant.price) || null,
            compareAtPrice: variant.compare_at_price ? parseFloat(variant.compare_at_price) : null,
            available: variant.available,
            url: `${brand.base_url}/products/${product.handle}?variant=${variant.id}`,
            imageUrl: variantImage,
            mpn: variant.sku || null,
            sku: variant.sku || null,
            barcode: variant.barcode || null,
            material,
            colorFamily,
            colorHex,
            netWeightG,
            productLineId,
          });
        }
      } else {
        // Single variant or non-color variants: use first variant only
        const variant = variants[0];
        const netWeightG = extractWeight(baseTitle, variant.grams);
        const colorFamily = extractColorFamilyFromVariant(variant, product, baseTitle) || extractColorFamily(baseTitle);
        
        // Extract diameter from title for filtering
        const diameterMm = extractDiameterFromText(baseTitle) || extractDiameterFromText(variant.option1 || '') || 1.75;
        
        // Apply standard variant filtering (exclude bulk >5.5kg, samples <300g, 2.85mm, excluded keywords)
        const filterResult = shouldIncludeVariant(netWeightG, diameterMm, baseTitle);
        updateFilterStats(filterStats, filterResult);
        if (!filterResult.include) {
          console.log(`[shopify] Skipping product: ${filterResult.reason} - ${baseTitle}`);
          continue;
        }
        
        // Generate product line ID with weight to separate bulk packs
        let productLineId: string;
        if (brand.brand_slug === 'anycubic') {
          productLineId = generateAnycubicProductLineId(baseTitle, material);
        } else {
          productLineId = generateProductLineId(brand.brand_slug, material, baseTitle, netWeightG);
        }

        products.push({
          productId: String(product.id),
          title: baseTitle,
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
          colorHex: extractColorHexFromVariant(variant, product, baseTitle, brand.brand_slug),
          netWeightG,
          productLineId,
        });
      }

      if (products.length >= limit) break;
    }

    if (data.products.length < 250) break;
    page++;
    
    // Rate limiting
    await new Promise(r => setTimeout(r, brand.rate_limit_ms || 500));
  }

  // Log filter stats at the end
  logFilterStats(brand.brand_name, filterStats);

  return products;
}

// Extract color hex from Shopify variant options - enhanced with brand-specific and generic color-mapping
function extractColorHexFromVariant(variant: any, product: any, title: string, brandSlug?: string): string | null {
  // Check variant options for color
  const colorOption = variant.option1 || variant.option2 || variant.option3;
  
  // First try: Check product metafields if available
  const metafields = product.metafields || [];
  for (const meta of metafields) {
    if (meta.key === 'color_hex' || meta.key === 'hex_color') {
      return meta.value;
    }
  }
  
  // BRAND-SPECIFIC LOOKUP FIRST (CRITICAL FIX)
  // This ensures Anycubic colors like "tropical turquoise" get correct hex codes
  if (colorOption && brandSlug === 'anycubic') {
    const anycubicHex = getAnycubicColorHex(colorOption);
    console.log(`[anycubic-color-debug] Raw: "${colorOption}" -> Hex: ${anycubicHex || 'NULL (will fallback to generic/deterministic)'}`);
    if (anycubicHex) {
      return anycubicHex.startsWith('#') ? anycubicHex : `#${anycubicHex}`;
    }
  }
  
  // Second try: Extract from variant option using generic color-mapping (exact match first)
  if (colorOption) {
    const hex = getColorHex(colorOption);
    if (hex) {
      return `#${hex}`;
    }
  }
  
  // Third try: Extract from product title
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
  
  // Fourth try: Generate a deterministic unique hex for unmapped colors
  // This prevents duplicates by creating consistent colors based on name hash
  if (colorOption && colorOption.trim().length > 0) {
    return generateDeterministicHex(colorOption);
  }
  
  return null;
}

// Generate a deterministic unique hex from color name
// Uses a simple hash to ensure same color name always gets same hex across syncs
function generateDeterministicHex(colorName: string): string {
  const normalized = colorName.toLowerCase().trim();
  const hash = simpleHash(normalized);
  
  // Generate HSL values from hash for good color distribution
  const hue = hash % 360;
  const sat = 50 + (hash % 30);  // 50-80% saturation
  const light = 40 + ((hash >> 8) % 30); // 40-70% lightness
  
  return `#${hslToHex(hue, sat, light)}`;
}

// Simple string hash function (djb2 algorithm)
function simpleHash(str: string): number {
  let hash = 5381;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) + hash) + str.charCodeAt(i);
    hash = hash & hash; // Convert to 32bit integer
  }
  return Math.abs(hash);
}

// Convert HSL to hex color
function hslToHex(h: number, s: number, l: number): string {
  s /= 100;
  l /= 100;
  
  const c = (1 - Math.abs(2 * l - 1)) * s;
  const x = c * (1 - Math.abs((h / 60) % 2 - 1));
  const m = l - c / 2;
  
  let r = 0, g = 0, b = 0;
  
  if (0 <= h && h < 60) { r = c; g = x; b = 0; }
  else if (60 <= h && h < 120) { r = x; g = c; b = 0; }
  else if (120 <= h && h < 180) { r = 0; g = c; b = x; }
  else if (180 <= h && h < 240) { r = 0; g = x; b = c; }
  else if (240 <= h && h < 300) { r = x; g = 0; b = c; }
  else if (300 <= h && h < 360) { r = c; g = 0; b = x; }
  
  const toHex = (n: number) => {
    const hex = Math.round((n + m) * 255).toString(16);
    return hex.length === 1 ? '0' + hex : hex;
  };
  
  return `${toHex(r)}${toHex(g)}${toHex(b)}`.toUpperCase();
}

// Validate and fix ALL color hex issues (NULL and duplicates) after sync
async function validateAndFixDuplicateHexes(supabase: any, brandName: string): Promise<{ fixed: number; duplicates: any[]; nullsFixed: number }> {
  let fixed = 0;
  let nullsFixed = 0;
  
  try {
    // STEP 1: Fix NULL hex codes first
    const { data: nullHexFilaments, error: nullError } = await supabase
      .from('filaments')
      .select('id, product_title')
      .ilike('vendor', brandName)
      .is('color_hex', null);
    
    if (!nullError && nullHexFilaments?.length) {
      console.log(`[sync-validation] Found ${nullHexFilaments.length} filaments with NULL hex codes for ${brandName}`);
      
      for (const filament of nullHexFilaments) {
        const uniqueHex = generateDeterministicHex(filament.product_title);
        
        const { error: updateError } = await supabase
          .from('filaments')
          .update({ color_hex: uniqueHex })
          .eq('id', filament.id);
          
        if (!updateError) {
          nullsFixed++;
          console.log(`[sync-validation] Fixed NULL hex for "${filament.product_title}" -> ${uniqueHex}`);
        }
      }
    }
    
    // STEP 2: Fix duplicate hex codes
    const { data: duplicates, error } = await supabase.rpc('find_duplicate_hexes', { 
      p_vendor: brandName 
    });
    
    if (error || !duplicates?.length) {
      return { fixed: 0, duplicates: [], nullsFixed };
    }
    
    console.warn(`[sync-validation] Found ${duplicates.length} duplicate hex codes for ${brandName}`);
    
    // Group duplicates by product_line_id
    const groupedDupes: Record<string, any[]> = {};
    for (const dup of duplicates) {
      const key = dup.product_line_id || 'unknown';
      if (!groupedDupes[key]) groupedDupes[key] = [];
      groupedDupes[key].push(dup);
    }
    
    // For each group, generate unique hexes for all but the first
    for (const [productLineId, dupes] of Object.entries(groupedDupes)) {
      // Skip the first one (keep original hex), fix the rest
      for (let i = 1; i < dupes.length; i++) {
        const dup = dupes[i];
        const uniqueHex = generateDeterministicHex(dup.product_title);
        
        const { error: updateError } = await supabase
          .from('filaments')
          .update({ color_hex: uniqueHex })
          .eq('id', dup.id);
          
        if (!updateError) {
          fixed++;
          console.log(`[sync-validation] Fixed duplicate hex for "${dup.product_title}" -> ${uniqueHex}`);
        }
      }
    }
    
    return { fixed, duplicates, nullsFixed };
  } catch (err) {
    console.error('[sync-validation] Error validating color hexes:', err);
    return { fixed: 0, duplicates: [], nullsFixed };
  }
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
      const productLineId = generateProductLineId(brand.brand_slug, material, title, netWeightG);
      
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
    const productLineId = generateProductLineId(brand.brand_slug, material, title, netWeightG);

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
  
  const firecrawlKey = Deno.env.get('FIRECRAWL_API_KEY');
  
  switch (brand.brand_slug) {
    case 'matterhackers':
      return await scrapeMatterHackers(brand, materialFilter, limit);
      
    case 'treed-filaments':
      // TreeD uses Shopify with correct domain (treed-filaments.com)
      try {
        const shopifyBrand = { 
          ...brand, 
          base_url: 'https://treed-filaments.com',
          api_endpoint: 'https://treed-filaments.com/products.json' 
        };
        const products = await scrapeShopify(shopifyBrand, materialFilter, limit);
        if (products.length > 0) return products;
      } catch (e) {
        console.log('[custom] TreeD Shopify failed:', e);
      }
      // Fallback to Firecrawl if Shopify fails
      return await scrapeFirecrawl({ ...brand, base_url: 'https://treed-filaments.com' }, materialFilter, limit);
      
    case 'ninjatek':
      // NinjaTek uses Shopify (verified from site structure)
      try {
        const shopifyBrand = { 
          ...brand, 
          base_url: 'https://ninjatek.com',
          api_endpoint: 'https://ninjatek.com/products.json' 
        };
        const products = await scrapeShopify(shopifyBrand, materialFilter, limit);
        if (products.length > 0) return products;
      } catch (e) {
        console.log('[custom] NinjaTek Shopify failed, trying Firecrawl:', e);
      }
      // Fallback to Firecrawl scraping if Shopify JSON isn't available
      return await scrapeNinjaTekFirecrawl(brand, materialFilter, limit);
      
    case 'gst3d':
      // GST3D - try dedicated scraper or Firecrawl
      return await scrapeFirecrawl(brand, materialFilter, limit);
      
    case 'recreus':
      // Recreus (Filaflex) - Spanish brand, use Firecrawl
      return await scrapeFirecrawl(brand, materialFilter, limit);
    
    case 'eryone':
      // Eryone uses CSV-seeded architecture - invoke dedicated sync function
      console.log('[custom] Routing Eryone to dedicated CSV-seeded sync');
      try {
        const eryoneResponse = await fetch(`${Deno.env.get('SUPABASE_URL')}/functions/v1/sync-eryone-products`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ cleanSlate: true }),
        });
        const eryoneResult = await eryoneResponse.json();
        console.log('[custom] Eryone sync result:', eryoneResult);
        return []; // Dedicated function handles everything
      } catch (e) {
        console.error('[custom] Eryone dedicated sync failed:', e);
        return [];
      }
      
    default:
      // Generic fallback: Try Shopify first, then Firecrawl
      try {
        const shopifyProducts = await scrapeShopify(brand, materialFilter, limit);
        if (shopifyProducts.length > 0) return shopifyProducts;
      } catch (e) {
        console.log(`[custom] Shopify fallback failed for ${brand.brand_slug}:`, e);
      }
      return await scrapeFirecrawl(brand, materialFilter, limit);
  }
}

// NinjaTek Firecrawl scraper - uses HTML scraping for WooCommerce-like product pages
async function scrapeNinjaTekFirecrawl(brand: BrandConfig, materialFilter?: string, limit = 100): Promise<any[]> {
  console.log(`[ninjatek] Firecrawl scraping for NinjaTek`);
  const products: any[] = [];
  
  const firecrawlKey = Deno.env.get('FIRECRAWL_API_KEY');
  if (!firecrawlKey) {
    console.warn('[ninjatek] FIRECRAWL_API_KEY not set');
    return [];
  }
  
  const catalogUrls = [
    'https://ninjatek.com/shop/filament/',
    'https://ninjatek.com/shop/filament/ninjaflex/',
    'https://ninjatek.com/shop/filament/cheetah/',
    'https://ninjatek.com/shop/filament/armadillo/',
    'https://ninjatek.com/shop/filament/eel/',
  ];

  for (const catalogUrl of catalogUrls) {
    if (products.length >= limit) break;

    try {
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

      // Extract product links from catalog page
      const productLinkRegex = /<a[^>]*href="(https:\/\/ninjatek\.com\/shop\/[^"]+)"[^>]*class="[^"]*woocommerce-LoopProduct-link/gi;
      const matches = [...html.matchAll(productLinkRegex)];
      
      for (const match of matches) {
        if (products.length >= limit) break;
        
        const productUrl = match[1];
        if (!productUrl || products.some(p => p.url === productUrl)) continue;

        // Scrape individual product page
        try {
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

          if (!productResponse.ok) continue;

          const productData = await productResponse.json();
          const productHtml = productData.data?.html || '';
          const productMarkdown = productData.data?.markdown || '';
          const metadata = productData.data?.metadata || {};

          const product = extractProductFromHtml(productHtml, productMarkdown, productUrl, brand, metadata);
          
          if (product && product.title) {
            if (materialFilter && !product.title.toLowerCase().includes(materialFilter.toLowerCase())) {
              continue;
            }
            products.push(product);
          }

          await new Promise(r => setTimeout(r, 1000));
        } catch (err) {
          console.warn(`[ninjatek] Error scraping product ${productUrl}:`, err);
        }
      }

      await new Promise(r => setTimeout(r, 1000));
    } catch (err) {
      console.warn(`[ninjatek] Error scraping catalog ${catalogUrl}:`, err);
    }
  }

  console.log(`[ninjatek] Found ${products.length} products`);
  return products;
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
          productLineId: generateProductLineId(brand.brand_slug, material, title, netWeightG),
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
  const handle = (product.handle || '').toLowerCase();
  
  const filamentKeywords = ['filament', 'pla', 'petg', 'abs', 'tpu', 'asa', 'nylon', 'pa', 'pc', 'cf'];
  const excludeKeywords = [
    'resin', 'printer', 'accessory', 'part', 'nozzle', 'bed', 'hotend',
    // Non-filament patterns that might have "filament" in title
    'filament hub', 'filament-hub', 'prize', 'claim', 'gift card', 'voucher',
    'spring steel', 'magnetic platform', 'build plate', 'wash cure'
  ];
  
  const hasFilamentKeyword = filamentKeywords.some(k => 
    title.includes(k) || type.includes(k) || tags.includes(k)
  );
  
  const hasExcludeKeyword = excludeKeywords.some(k => 
    title.includes(k) || type.includes(k) || handle.includes(k)
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
