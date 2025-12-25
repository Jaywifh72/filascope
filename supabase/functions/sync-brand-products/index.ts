import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface SyncRequest {
  brandSlug: string;
  dryRun: boolean;
  materialFilter?: string;
  regions?: string[];
  tasks?: string[];
  limit?: number;
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

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  try {
    const body: SyncRequest = await req.json();
    const { brandSlug, dryRun = true, materialFilter, regions, tasks = ['products'], limit = 100 } = body;

    if (!brandSlug) {
      return new Response(
        JSON.stringify({ success: false, error: 'brandSlug is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`[sync-brand-products] Starting sync for ${brandSlug}`, { dryRun, tasks, limit });

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

    // Create sync log entry
    const { data: syncLog, error: logError } = await supabase
      .from('brand_sync_logs')
      .insert({
        brand_id: brand.id,
        brand_slug: brandSlug,
        sync_type: tasks.join(','),
        status: 'running',
        triggered_by: 'manual',
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
        scrape_timeout_at: new Date(Date.now() + 15 * 60 * 1000).toISOString() // 15 min timeout
      })
      .eq('brand_slug', brandSlug);

    // Determine which scraper to use based on platform
    let scrapedProducts: any[] = [];
    let scrapingError: string | null = null;

    try {
      switch (brand.platform_type) {
        case 'shopify':
          scrapedProducts = await scrapeShopify(brand, materialFilter, limit);
          break;
        case 'woocommerce':
          scrapedProducts = await scrapeWooCommerce(brand, materialFilter, limit);
          break;
        case 'firecrawl':
          scrapedProducts = await scrapeFirecrawl(brand, materialFilter, limit);
          break;
        case 'amazon':
          // Amazon requires special handling - return info about existing products
          scrapedProducts = await getAmazonProducts(supabase, brand.brand_name, limit);
          break;
        case 'bigcommerce':
          scrapedProducts = await scrapeBigCommerce(brand, materialFilter, limit);
          break;
        default:
          scrapingError = `Unsupported platform: ${brand.platform_type}`;
      }
    } catch (err) {
      scrapingError = err instanceof Error ? err.message : 'Unknown scraping error';
      console.error(`[sync-brand-products] Scraping error for ${brandSlug}:`, err);
    }

    // Process scraped products
    let summary = { created: 0, updated: 0, skipped: 0, errors: 0, total: scrapedProducts.length };

    if (!scrapingError && !dryRun && scrapedProducts.length > 0) {
      for (const product of scrapedProducts) {
        try {
          // Check if product already exists
          const { data: existing } = await supabase
            .from('filaments')
            .select('id, user_override_fields')
            .eq('product_id', product.productId)
            .ilike('vendor', brand.brand_name)
            .maybeSingle();

          if (existing) {
            // Update existing - respect user override fields
            const overrideFields = existing.user_override_fields || [];
            const updateData = buildUpdateData(product, overrideFields);
            
            await supabase
              .from('filaments')
              .update({
                ...updateData,
                last_scraped_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
                auto_updated: true,
                sync_status: 'synced',
              })
              .eq('id', existing.id);

            summary.updated++;
          } else {
            // Create new filament
            await supabase
              .from('filaments')
              .insert({
                product_id: product.productId,
                product_title: product.title,
                vendor: brand.brand_name,
                brand_id: brand.id,
                variant_price: product.price,
                variant_compare_at_price: product.compareAtPrice,
                variant_available: product.available ?? true,
                product_url: product.url,
                featured_image: product.imageUrl,
                mpn: product.mpn,
                tds_url: product.tdsUrl,
                color_hex: product.colorHex,
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
              });

            summary.created++;
          }
        } catch (err) {
          console.error(`[sync-brand-products] Error processing product ${product.productId}:`, err);
          summary.errors++;
        }
      }
    }

    // Update sync log and brand stats
    const duration = 0; // Would calculate actual duration
    
    if (jobId) {
      await supabase
        .from('brand_sync_logs')
        .update({
          status: scrapingError ? 'failed' : 'completed',
          completed_at: new Date().toISOString(),
          products_discovered: scrapedProducts.length,
          products_created: summary.created,
          products_updated: summary.updated,
          products_failed: summary.errors,
          error_details: scrapingError ? { error: scrapingError } : null,
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

    return new Response(
      JSON.stringify({
        success: !scrapingError,
        jobId,
        dryRun,
        brandSlug,
        platform: brand.platform_type,
        message: scrapingError || `Synced ${summary.total} products`,
        summary,
        products: dryRun ? scrapedProducts.slice(0, 10) : undefined, // Preview first 10 in dry run
      }),
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

// Helper: Build update data respecting user overrides
function buildUpdateData(product: any, overrideFields: string[]): Record<string, any> {
  const data: Record<string, any> = {};
  
  const fieldMapping: Record<string, string> = {
    title: 'product_title',
    price: 'variant_price',
    compareAtPrice: 'variant_compare_at_price',
    available: 'variant_available',
    url: 'product_url',
    imageUrl: 'featured_image',
    mpn: 'mpn',
    tdsUrl: 'tds_url',
    colorHex: 'color_hex',
    nozzleTempMin: 'nozzle_temp_min_c',
    nozzleTempMax: 'nozzle_temp_max_c',
    bedTempMin: 'bed_temp_min_c',
    bedTempMax: 'bed_temp_max_c',
    material: 'material',
    netWeightG: 'net_weight_g',
  };

  for (const [productKey, dbKey] of Object.entries(fieldMapping)) {
    if (product[productKey] !== undefined && !overrideFields.includes(dbKey)) {
      data[dbKey] = product[productKey];
    }
  }

  return data;
}

// Shopify Scraper
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

      products.push({
        productId: String(product.id),
        title: cleanTitle(product.title),
        price: parseFloat(variant.price) || null,
        compareAtPrice: variant.compare_at_price ? parseFloat(variant.compare_at_price) : null,
        available: variant.available,
        url: `${brand.base_url}/products/${product.handle}`,
        imageUrl: product.images?.[0]?.src || null,
        mpn: variant.sku || null,
        material: extractMaterial(product.title, product.product_type),
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

// WooCommerce Scraper
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

      products.push({
        productId: String(product.id),
        title: cleanTitle(product.name),
        price,
        compareAtPrice: regularPrice !== price ? regularPrice : null,
        available: product.is_purchasable && product.is_in_stock,
        url: product.permalink,
        imageUrl: product.images?.[0]?.src || null,
        mpn: product.sku || null,
        material: extractMaterial(product.name, ''),
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

// Helper: Extract material from title
function extractMaterial(title: string, type: string): string | null {
  const combined = `${title} ${type}`.toUpperCase();
  
  const materials = [
    'PLA', 'PETG', 'ABS', 'TPU', 'ASA', 'NYLON', 'PA', 'PC', 'PVA', 'HIPS',
    'PP', 'PET', 'PEEK', 'PEI', 'CF', 'GF'
  ];
  
  for (const mat of materials) {
    if (combined.includes(mat)) {
      return mat;
    }
  }
  
  return null;
}
