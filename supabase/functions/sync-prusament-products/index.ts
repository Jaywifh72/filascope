/**
 * Prusament CSV-Seeded Sync Pipeline with Background Enrichment
 * 
 * Phase 1: Upserts all products from CSV seed with fallback prices (fast, no timeout)
 * Phase 2: Background scraping for real prices/images using EdgeRuntime.waitUntil()
 * 
 * NO SAFE DELETE - uses upsert pattern to prevent data loss.
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import {
  PRUSAMENT_PRODUCT_SEED,
  shouldExcludePrusamentProduct,
  cleanPrusamentColorName,
  getPrusamentDefaultPriceEur,
  convertEurToUsd,
} from '../_shared/prusament-seed.ts';
import {
  enrichPrusamentProduct,
  getPrusamentColorHex,
} from '../_shared/prusament-defaults.ts';
import { getColorFamily, getColorFamilyFromHex } from '../_shared/color-mapping.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface SyncStats {
  discovered: number;
  created: number;
  updated: number;
  skipped: number;
  errors: number;
}

interface EnrichmentStats {
  scraped: number;
  pricesUpdated: number;
  imagesUpdated: number;
  scrapeErrors: number;
}

/**
 * Extract price from Prusa HTML - proven working patterns from sync-prusament-data
 */
function extractPrusaPrice(html: string): { price: number | null; currency: string } {
  const pricePatterns = [
    // Meta tags (most reliable)
    /<meta[^>]*property="product:price:amount"[^>]*content="([0-9.]+)"/i,
    // JSON-LD schema
    /"price":\s*"?([0-9.]+)"?/,
    /"offers":\s*\{[^}]*"price":\s*"?([0-9.]+)"?/,
    // Prusa-specific class patterns
    /class="[^"]*price[^"]*"[^>]*>\s*(?:€|\$|£)?\s*([0-9,.]+)/i,
    /data-price="([0-9.]+)"/i,
    // Regular price in span/div
    />\s*\$([0-9]+\.[0-9]{2})\s*</,
    />\s*€([0-9]+[,.]?[0-9]*)\s*</,
    // Sale/regular price patterns
    /sale[-_]?price[^>]*>.*?(?:€|\$)?\s*([0-9,.]+)/is,
    /regular[-_]?price[^>]*>.*?(?:€|\$)?\s*([0-9,.]+)/is,
    // Generic price extraction
    /(?:Price|Cena)[:\s]*(?:€|\$)?\s*([0-9,.]+)/i,
  ];

  let currency = 'USD';
  if (html.includes('€') || html.includes('EUR')) {
    currency = 'EUR';
  }

  for (const pattern of pricePatterns) {
    const match = html.match(pattern);
    if (match && match[1]) {
      let priceStr = match[1].replace(/,/g, '.');
      if (priceStr.split('.').length > 2) {
        const parts = priceStr.split('.');
        priceStr = parts.slice(0, -1).join('') + '.' + parts[parts.length - 1];
      }
      const price = parseFloat(priceStr);
      
      if (price >= 10 && price <= 200) {
        console.log(`[Prusament] Price found: ${currency} ${price}`);
        return { price, currency };
      }
    }
  }

  return { price: null, currency };
}

/**
 * Extract product image from Prusa HTML - proven working patterns from sync-prusament-data
 */
function extractPrusaImage(html: string): string | null {
  // First, try og:image which usually has the product image
  const ogImageMatch = html.match(/<meta[^>]*property="og:image"[^>]*content="([^"]+)"/i) ||
                       html.match(/<meta[^>]*content="([^"]+)"[^>]*property="og:image"/i);
  
  if (ogImageMatch && ogImageMatch[1]) {
    let imageUrl = ogImageMatch[1];
    if (imageUrl.includes('/product/') || imageUrl.includes('content/images/product')) {
      imageUrl = imageUrl.replace(/width=\d+/, 'width=1024');
      console.log(`[Prusament] OG Image found: ${imageUrl.substring(0, 80)}...`);
      return imageUrl;
    }
  }

  // Look for product images in HTML content
  const productImagePatterns = [
    /src="(https:\/\/www\.prusa3d\.com\/cdn-cgi\/image\/[^"]*content\/images\/product\/[^"]+)"/gi,
    /src="(https:\/\/cdn\.prusa3d\.com\/content\/images\/product\/[^"]+\.(?:jpg|jpeg|png|webp))"/gi,
    /"image"\s*:\s*"(https:\/\/[^"]*prusa[^"]*\/content\/images\/product\/[^"]+)"/gi,
    /data-src="(https:\/\/[^"]*prusa[^"]*\/content\/images\/product\/[^"]+)"/gi,
  ];

  for (const pattern of productImagePatterns) {
    const matches = html.matchAll(pattern);
    for (const match of matches) {
      if (match && match[1]) {
        let imageUrl = match[1];
        
        if (imageUrl.includes('/country/') || 
            imageUrl.includes('/flag/') ||
            imageUrl.includes('logo') ||
            imageUrl.includes('icon') ||
            imageUrl.includes('banner') ||
            imageUrl.includes('thumbnail') ||
            imageUrl.includes('_small') ||
            imageUrl.includes('_thumb')) {
          continue;
        }
        
        if (imageUrl.includes('cdn-cgi/image/')) {
          imageUrl = imageUrl.replace(/width=\d+/, 'width=1024');
        }
        
        console.log(`[Prusament] Product image found: ${imageUrl.substring(0, 80)}...`);
        return imageUrl;
      }
    }
  }

  // Fallback: find any reasonable product image
  const allImages = html.matchAll(/src="([^"]+)"/gi);
  for (const imgMatch of allImages) {
    const src = imgMatch[1];
    if (src && 
        (src.includes('/product/') || src.includes('content/images/product')) &&
        !src.includes('/country/') &&
        !src.includes('/flag/') &&
        !src.includes('logo') && 
        !src.includes('icon') && 
        !src.includes('banner') &&
        !src.includes('thumbnail') &&
        !src.includes('width=45') &&
        (src.includes('.jpg') || src.includes('.jpeg') || src.includes('.png') || src.includes('.webp'))) {
      let imageUrl = src;
      if (imageUrl.includes('cdn-cgi/image/')) {
        imageUrl = imageUrl.replace(/width=\d+/, 'width=1024');
      }
      console.log(`[Prusament] Fallback image found: ${imageUrl.substring(0, 80)}...`);
      return imageUrl;
    }
  }

  return null;
}

/**
 * Check availability from HTML
 */
function checkAvailability(html: string): boolean {
  const outOfStockPatterns = [
    /out[-\s]?of[-\s]?stock/i,
    /sold[-\s]?out/i,
    /unavailable/i,
    /"availability":\s*"OutOfStock"/i,
  ];

  for (const pattern of outOfStockPatterns) {
    if (pattern.test(html)) {
      return false;
    }
  }
  return true;
}

/**
 * Scrape a single Prusa product page using Firecrawl - simplified HTML-only approach
 */
async function scrapePrusaProduct(
  productUrl: string,
  firecrawlApiKey: string
): Promise<{ priceEur: number | null; priceUsd: number | null; imageUrl: string | null; available: boolean }> {
  const result = {
    priceEur: null as number | null,
    priceUsd: null as number | null,
    imageUrl: null as string | null,
    available: true,
  };

  try {
    const response = await fetch('https://api.firecrawl.dev/v1/scrape', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${firecrawlApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        url: productUrl,
        formats: ['html'], // Only HTML - proven to work
        onlyMainContent: false,
        waitFor: 3000,
      }),
    });

    if (!response.ok) {
      console.log(`[Prusament] Firecrawl error for ${productUrl}: ${response.status}`);
      return result;
    }

    const data = await response.json();
    const html = data.data?.html || '';

    if (!html || html.length < 500) {
      console.log(`[Prusament] Invalid HTML response for ${productUrl} (${html.length} chars)`);
      return result;
    }

    // Extract price using proven patterns
    const priceResult = extractPrusaPrice(html);
    if (priceResult.price) {
      result.priceEur = priceResult.price;
      result.priceUsd = convertEurToUsd(priceResult.price);
    }

    // Extract image using proven patterns - no validation needed
    result.imageUrl = extractPrusaImage(html);

    // Check availability
    result.available = checkAvailability(html);

    console.log(`[Prusament] Scraped ${productUrl}: €${result.priceEur} -> $${result.priceUsd}, image: ${result.imageUrl ? 'YES' : 'NO'}`);

  } catch (error) {
    console.error(`[Prusament] Scrape error for ${productUrl}:`, error);
  }

  return result;
}

/**
 * Delay helper
 */
function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Background enrichment task - scrapes real prices and images
 */
async function backgroundEnrichment(
  supabaseUrl: string,
  supabaseKey: string,
  firecrawlApiKey: string,
  productIds: string[]
): Promise<void> {
  console.log(`[Prusament Background] Starting enrichment for ${productIds.length} products...`);
  
  const supabase = createClient(supabaseUrl, supabaseKey);
  const stats: EnrichmentStats = { scraped: 0, pricesUpdated: 0, imagesUpdated: 0, scrapeErrors: 0 };
  
  const BATCH_SIZE = 5;
  const DELAY_MS = 1000;

  for (let i = 0; i < productIds.length; i += BATCH_SIZE) {
    const batch = productIds.slice(i, i + BATCH_SIZE);
    
    for (const productId of batch) {
      try {
        // Get current filament data
        const { data: filament } = await supabase
          .from('filaments')
          .select('id, product_url, variant_price, featured_image')
          .eq('product_id', productId)
          .maybeSingle();

        if (!filament || !filament.product_url) continue;

        // Scrape the product page
        const scraped = await scrapePrusaProduct(filament.product_url, firecrawlApiKey);
        stats.scraped++;

        // Build update object - only update if we got better data
        const updates: Record<string, any> = {
          last_scraped_at: new Date().toISOString(),
        };

        if (scraped.priceUsd && scraped.priceUsd > 0) {
          updates.variant_price = scraped.priceUsd;
          stats.pricesUpdated++;
        }

        if (scraped.imageUrl) {
          updates.featured_image = scraped.imageUrl;
          stats.imagesUpdated++;
        }

        updates.variant_available = scraped.available;

        // Update the filament
        await supabase
          .from('filaments')
          .update(updates)
          .eq('id', filament.id);

        await delay(DELAY_MS);

      } catch (error) {
        console.error(`[Prusament Background] Error enriching ${productId}:`, error);
        stats.scrapeErrors++;
      }
    }

    console.log(`[Prusament Background] Progress: ${Math.min(i + BATCH_SIZE, productIds.length)}/${productIds.length}`);
  }

  // Update brand stats
  try {
    await supabase.rpc('update_brand_product_counts', { p_brand_slug: 'prusament' });
    await supabase.rpc('update_brand_enrichment_counts', { p_brand_slug: 'prusament' });
  } catch (e) {
    console.log('[Prusament Background] RPC update skipped:', e);
  }

  console.log(`[Prusament Background] Enrichment complete:`, stats);
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const startTime = Date.now();
  const stats: SyncStats = { discovered: 0, created: 0, updated: 0, skipped: 0, errors: 0 };

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const firecrawlApiKey = Deno.env.get('FIRECRAWL_API_KEY');
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Parse options
    let enableScraping = true;
    let limit: number | undefined;
    try {
      const body = await req.json();
      enableScraping = body.enableScraping !== false;
      limit = body.limit;
    } catch { /* no body */ }

    console.log('[Prusament] Starting CSV-seeded sync (upsert pattern)...');
    console.log(`[Prusament] Seed contains ${PRUSAMENT_PRODUCT_SEED.length} products`);
    console.log(`[Prusament] Background scraping enabled: ${enableScraping && !!firecrawlApiKey}`);
    console.log(`[Prusament] Limit: ${limit || 'none (all products)'}`);

    // Get brand info
    const { data: brand } = await supabase
      .from('automated_brands')
      .select('id')
      .eq('brand_slug', 'prusament')
      .maybeSingle();

    const brandId = brand?.id || null;

    // Mark brand as syncing
    await supabase
      .from('automated_brands')
      .update({ 
        scraping_active: true, 
        scrape_timeout_at: new Date(Date.now() + 30 * 60 * 1000).toISOString() 
      })
      .eq('brand_slug', 'prusament');

    // Filter seed data and apply limit
    let validProducts = PRUSAMENT_PRODUCT_SEED.filter(p => !shouldExcludePrusamentProduct(p));
    const totalValidProducts = validProducts.length;
    
    // Apply limit if specified
    if (limit && limit > 0 && limit < validProducts.length) {
      validProducts = validProducts.slice(0, limit);
      console.log(`[Prusament] Limiting to ${limit} of ${totalValidProducts} valid products`);
    }
    
    stats.discovered = validProducts.length;
    console.log(`[Prusament] Processing ${validProducts.length} products (${totalValidProducts} total available)`);

    // Create sync log for progress tracking
    const { data: syncLog } = await supabase
      .from('brand_sync_logs')
      .insert({
        brand_slug: 'prusament',
        brand_id: brandId,
        sync_type: 'incremental',
        status: 'in_progress',
        started_at: new Date().toISOString(),
        products_discovered: validProducts.length,
      })
      .select('id')
      .single();
    
    const syncLogId = syncLog?.id;
    console.log(`[Prusament] Sync log created: ${syncLogId}`);

    // Track product IDs for background enrichment
    const productIdsForEnrichment: string[] = [];

    // Helper to update sync progress
    const updateProgress = async (current: number, currentProduct: string) => {
      if (!syncLogId) return;
      try {
        await supabase
          .from('brand_sync_logs')
          .update({
            products_processed: {
              stage: 'Processing products',
              current,
              total: validProducts.length,
              current_product: currentProduct,
              productsProcessed: current,
              created: stats.created,
              updated: stats.updated,
              errors: stats.errors,
              isRealProgress: true,
            },
          })
          .eq('id', syncLogId);
      } catch (e) {
        console.log('[Prusament] Failed to update progress:', e);
      }
    };

    // PHASE 1: Fast upsert all products from CSV seed (no scraping, no deletion)
    let processedCount = 0;
    for (const product of validProducts) {
      try {
        const cleanColor = cleanPrusamentColorName(product.color);
        const enrichment = enrichPrusamentProduct(product.filamentName, product.material, product.colorHex);
        
        // Get color hex - prefer CSV, fallback to enrichment
        let colorHex = product.colorHex || enrichment.colorHex;
        if (!colorHex) {
          colorHex = getPrusamentColorHex(cleanColor);
        }
        
        // Get color family
        const colorFamily = getColorFamily(cleanColor) || getColorFamilyFromHex(colorHex);
        
        // Generate product ID from URL
        const urlSlug = product.productUrl.split('/').filter(Boolean).pop() || '';
        const productId = `prusament-${urlSlug}`;

        // Default price from seed (material-based fallback)
        const defaultPriceEur = getPrusamentDefaultPriceEur(product.material, product.weightGrams);
        const defaultPriceUsd = convertEurToUsd(defaultPriceEur);
        // Calculate price per kg
        const pricePerKg = (defaultPriceUsd / product.weightGrams) * 1000;

        // Check if exists
        const { data: existing } = await supabase
          .from('filaments')
          .select('id, featured_image, variant_price')
          .eq('product_id', productId)
          .maybeSingle();

        const baseRecord = {
          product_id: productId,
          product_title: product.filamentName,
          vendor: 'Prusament',
          brand_id: brandId,
          material: enrichment.material,
          finish_type: enrichment.finishType,
          product_line_id: enrichment.productLineId,
          color_hex: colorHex,
          color_family: colorFamily,
          product_url: product.productUrl,
          net_weight_g: product.weightGrams,
          diameter_nominal_mm: 1.75,
          tds_url: enrichment.tdsUrl,
          nozzle_temp_min_c: enrichment.printSettings.nozzleTempMin,
          nozzle_temp_max_c: enrichment.printSettings.nozzleTempMax,
          bed_temp_min_c: enrichment.printSettings.bedTempMin,
          bed_temp_max_c: enrichment.printSettings.bedTempMax,
          fan_min_percent: enrichment.printSettings.fanMin,
          fan_max_percent: enrichment.printSettings.fanMax,
          print_speed_max_mms: enrichment.printSettings.printSpeedMax,
          drying_temp_c: enrichment.printSettings.dryingTemp,
          drying_time_hours: enrichment.printSettings.dryingTime,
          is_nozzle_abrasive: enrichment.isAbrasive,
          auto_created: true,
          auto_updated: true,
          sync_status: 'synced',
        };

        if (existing) {
          // Update - preserve existing price/image if they exist
          const updateRecord: Record<string, any> = { 
            ...baseRecord,
            updated_at: new Date().toISOString(),
          };
          
          // Only set fallback price if no existing price
          if (!existing.variant_price || existing.variant_price <= 0) {
            updateRecord.variant_price = pricePerKg;
          }
          
          // Preserve existing image
          if (existing.featured_image) {
            // Don't overwrite
          }
          
          await supabase.from('filaments').update(updateRecord).eq('id', existing.id);
          stats.updated++;
        } else {
          // Insert new with fallback price
          const insertRecord = {
            ...baseRecord,
            variant_price: pricePerKg,
            variant_available: true,
            created_at: new Date().toISOString(),
          };
          
          await supabase.from('filaments').insert(insertRecord);
          stats.created++;
        }

        // Track for background enrichment
        productIdsForEnrichment.push(productId);

        // Update progress every 10 products
        processedCount++;
        if (processedCount % 10 === 0 || processedCount === validProducts.length) {
          await updateProgress(processedCount, product.filamentName);
        }

      } catch (err) {
        console.error(`[Prusament] Error processing ${product.filamentName}:`, err);
        stats.errors++;
        processedCount++;
      }
    }

    // Fix duplicate hex codes
    try {
      await supabase.rpc('find_duplicate_hexes', { p_vendor: 'Prusament' });
    } catch (e) {
      console.log('[Prusament] find_duplicate_hexes RPC not available');
    }

    // Update brand stats immediately
    try {
      await supabase.rpc('update_brand_product_counts', { p_brand_slug: 'prusament' });
    } catch (e) {
      console.log('[Prusament] update_brand_product_counts RPC not available');
    }

    // Mark sync as complete (but enrichment continues in background)
    await supabase
      .from('automated_brands')
      .update({ 
        scraping_active: false, 
        scrape_timeout_at: null,
        last_scrape_at: new Date().toISOString()
      })
      .eq('brand_slug', 'prusament');

    const duration = ((Date.now() - startTime) / 1000).toFixed(1);
    console.log(`[Prusament] Phase 1 (seed sync) complete in ${duration}s:`, stats);

    // Mark sync log as completed with final stats
    if (syncLogId) {
      await supabase
        .from('brand_sync_logs')
        .update({
          status: 'completed',
          completed_at: new Date().toISOString(),
          duration_seconds: Math.round(parseFloat(duration)),
          products_created: stats.created,
          products_updated: stats.updated,
          products_failed: stats.errors,
          products_discovered: validProducts.length,
          products_processed: {
            stage: 'Complete',
            current: validProducts.length,
            total: validProducts.length,
            productsProcessed: validProducts.length,
            created: stats.created,
            updated: stats.updated,
            errors: stats.errors,
            isRealProgress: true,
          },
        })
        .eq('id', syncLogId);
    }

    // PHASE 2: Background enrichment with real prices/images
    if (enableScraping && firecrawlApiKey && productIdsForEnrichment.length > 0) {
      console.log(`[Prusament] Starting background enrichment for ${productIdsForEnrichment.length} products...`);
      
      // Use EdgeRuntime.waitUntil for background processing
      // @ts-ignore - EdgeRuntime is available in Deno edge functions
      if (typeof EdgeRuntime !== 'undefined' && EdgeRuntime.waitUntil) {
        // @ts-ignore
        EdgeRuntime.waitUntil(
          backgroundEnrichment(supabaseUrl, supabaseKey, firecrawlApiKey, productIdsForEnrichment)
        );
      } else {
        // Fallback: don't wait for enrichment, just start it
        backgroundEnrichment(supabaseUrl, supabaseKey, firecrawlApiKey, productIdsForEnrichment)
          .catch(e => console.error('[Prusament] Background enrichment error:', e));
      }
    }

    return new Response(JSON.stringify({
      success: true,
      vendor: 'Prusament',
      syncLogId,
      stats,
      duration: `${duration}s`,
      backgroundEnrichment: enableScraping && !!firecrawlApiKey,
      message: enableScraping && firecrawlApiKey 
        ? `Synced ${stats.created + stats.updated} products. Background enrichment started for prices/images.`
        : `Synced ${stats.created + stats.updated} products with fallback prices.`,
    }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    console.error('[Prusament] Fatal error:', errorMsg);
    
    // Clean up brand state on error
    try {
      const supabase = createClient(
        Deno.env.get('SUPABASE_URL')!,
        Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
      );
      await supabase
        .from('automated_brands')
        .update({ scraping_active: false, scrape_timeout_at: null })
        .eq('brand_slug', 'prusament');
    } catch { /* ignore cleanup errors */ }
    
    return new Response(JSON.stringify({
      success: false,
      vendor: 'Prusament',
      error: errorMsg,
      stats,
    }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
});
