import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

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
async function callGetCurrentPrice(productUrl: string): Promise<ExtractionResult> {
  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    
    if (!supabaseUrl || !serviceKey) {
      return { success: false, price: null, compareAtPrice: null, error: 'Missing env vars' };
    }
    
    const response = await fetch(`${supabaseUrl}/functions/v1/get-current-price`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${serviceKey}`
      },
      body: JSON.stringify({ productUrl, forceRefresh: true })
    });
    
    if (!response.ok) {
      return { success: false, price: null, compareAtPrice: null, error: `HTTP ${response.status}` };
    }
    
    const data = await response.json();
    
    if (data.price !== null && data.price !== undefined) {
      return { 
        success: true, 
        price: data.price, 
        compareAtPrice: data.compareAtPrice || null,
        method: 'firecrawl'
      };
    }
    
    return { success: false, price: null, compareAtPrice: null, error: data.error || 'No price extracted' };
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
  brandConfig: BrandConfig | null
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
    return await callGetCurrentPrice(productUrl);
  }
  
  // Strategy 3: Skip unsupported platforms
  if (platformType === 'amazon') {
    return { success: false, price: null, compareAtPrice: null, error: 'Amazon requires separate API' };
  }
  
  // Default: try Firecrawl anyway
  return await callGetCurrentPrice(productUrl);
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
      limit = 100
    } = body;
    
    console.log(`Starting ${syncType} sync for ${productType}s`, { brandSlug, targetId, dryRun });
    
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
        products_processed: { 
          progress: { stage: 'initializing' },
          dryRun,
          productType,
          syncType
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
    
    let query = supabase
      .from(tableName)
      .select(`id, product_title, product_url, vendor, ${priceColumn}, ${msrpColumn}`)
      .not('product_url', 'is', null);
    
    // For filaments, check sync_enabled
    if (productType === 'filament') {
      query = query.eq('sync_enabled', true);
    }
    
    if (syncType === 'single' && targetId) {
      query = query.eq('id', targetId);
    } else if (syncType === 'brand' && brandSlug) {
      query = query.eq('vendor', brandSlug);
    }
    
    query = query.limit(limit);
    
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
          successful: 0, 
          failed: 0, 
          skipped: 0,
          priceChanges: 0,
          duration_ms: Date.now() - startTime
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    console.log(`Found ${products.length} products to sync`);
    
    // Cache brand configs
    const brandConfigCache: Record<string, BrandConfig | null> = {};
    
    async function getBrandConfig(vendor: string): Promise<BrandConfig | null> {
      if (brandConfigCache[vendor] !== undefined) {
        return brandConfigCache[vendor];
      }
      
      const { data } = await supabase
        .from('automated_brands')
        .select('brand_slug, platform_type, rate_limit_ms, price_extraction_config, extraction_method')
        .eq('brand_slug', vendor)
        .single();
      
      brandConfigCache[vendor] = data || null;
      return brandConfigCache[vendor];
    }
    
    // Process products
    let successful = 0;
    let failed = 0;
    let skipped = 0;
    let priceChanges = 0;
    const errors: Array<{ productId: string; error: string }> = [];
    
    for (const product of products) {
      // Check timeout
      if (Date.now() - startTime > MAX_RUNTIME_MS) {
        console.warn('Sync timeout reached, stopping');
        break;
      }
      
      const productUrl = product.product_url;
      if (!productUrl) {
        skipped++;
        continue;
      }
      
      const vendor = product.vendor || 'unknown';
      const brandConfig = await getBrandConfig(vendor);
      const rateLimitMs = brandConfig?.rate_limit_ms || DEFAULT_RATE_LIMIT_MS;
      
      console.log(`Processing: ${product.product_title?.substring(0, 50)}...`);
      
      const extractionStart = Date.now();
      const extraction = await extractPrice(productUrl, brandConfig);
      const responseTime = Date.now() - extractionStart;
      
      // Log extraction attempt
      try {
        await supabase.from('price_extraction_logs').insert({
          product_url: productUrl,
          vendor: vendor,
          extraction_method: extraction.method || 'unknown',
          success: extraction.success,
          extracted_price: extraction.price,
          compare_at_price: extraction.compareAtPrice,
          error_message: extraction.error || null,
          response_time_ms: responseTime,
          sync_run_id: syncRunId
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
            [priceColumn]: extraction.price,
            last_scraped_at: new Date().toISOString(),
          };
          
          // Add compare_at_price for filaments
          if (productType === 'filament' && extraction.compareAtPrice) {
            updateData.compare_at_price = extraction.compareAtPrice;
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
          console.log(`[DRY RUN] Would update ${product.id}: $${currentPrice} -> $${extraction.price}`);
        }
      } else {
        failed++;
        errors.push({ productId: product.id, error: extraction.error || 'Unknown error' });
        
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
      
      // Rate limit
      await sleep(rateLimitMs);
    }
    
    const durationMs = Date.now() - startTime;
    
    // Update sync run record
    if (syncLog?.id) {
      await supabase.from('brand_sync_logs').update({
        status: 'completed',
        completed_at: new Date().toISOString(),
        duration_seconds: durationMs / 1000,
        products_discovered: products.length,
        products_updated: successful,
        products_failed: failed,
        price_changes: priceChanges,
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
      successful,
      failed,
      skipped,
      priceChanges,
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
