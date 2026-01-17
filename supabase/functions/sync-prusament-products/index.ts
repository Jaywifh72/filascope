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
 * Extract price from Prusa product page - enhanced patterns
 */
function extractPrusaPrice(markdown: string, html: string, metadata: any): number | null {
  // Try JSON-LD product schema first (most reliable)
  if (metadata?.jsonLd) {
    try {
      const jsonLd = typeof metadata.jsonLd === 'string' 
        ? JSON.parse(metadata.jsonLd) 
        : metadata.jsonLd;
      
      const products = Array.isArray(jsonLd) ? jsonLd : [jsonLd];
      for (const item of products) {
        if (item['@type'] === 'Product' && item.offers) {
          const offers = Array.isArray(item.offers) ? item.offers : [item.offers];
          for (const offer of offers) {
            if (offer.price) {
              const price = parseFloat(String(offer.price).replace(',', '.'));
              if (!isNaN(price) && price > 0 && price < 500) {
                console.log(`[Prusament] Found JSON-LD price: €${price}`);
                return price;
              }
            }
          }
        }
      }
    } catch (e) {
      console.log('[Prusament] Error parsing JSON-LD:', e);
    }
  }

  // Try meta tags
  const metaPriceKeys = ['product:price:amount', 'og:price:amount', 'price'];
  for (const key of metaPriceKeys) {
    if (metadata?.[key]) {
      const price = parseFloat(String(metadata[key]).replace(',', '.'));
      if (!isNaN(price) && price > 0 && price < 500) {
        console.log(`[Prusament] Found meta price (${key}): €${price}`);
        return price;
      }
    }
  }

  // Parse HTML for JSON-LD in script tags
  if (html) {
    const ldJsonMatch = html.match(/<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi);
    if (ldJsonMatch) {
      for (const match of ldJsonMatch) {
        try {
          const jsonContent = match.replace(/<script[^>]*>|<\/script>/gi, '').trim();
          const jsonData = JSON.parse(jsonContent);
          const items = Array.isArray(jsonData) ? jsonData : [jsonData];
          for (const item of items) {
            if (item['@type'] === 'Product' && item.offers?.price) {
              const price = parseFloat(String(item.offers.price).replace(',', '.'));
              if (!isNaN(price) && price > 0 && price < 500) {
                console.log(`[Prusament] Found HTML JSON-LD price: €${price}`);
                return price;
              }
            }
          }
        } catch (e) {
          // Continue to next match
        }
      }
    }

    // Look for price spans/elements in HTML
    const htmlPricePatterns = [
      /<span[^>]*class="[^"]*price[^"]*"[^>]*>.*?€\s*(\d+[.,]\d{2})/gi,
      /data-price="(\d+[.,]\d{2})"/gi,
      /itemprop="price"[^>]*content="(\d+[.,]\d{2})"/gi,
    ];

    for (const pattern of htmlPricePatterns) {
      const match = pattern.exec(html);
      if (match) {
        const price = parseFloat(match[1].replace(',', '.'));
        if (!isNaN(price) && price > 5 && price < 500) {
          console.log(`[Prusament] Found HTML element price: €${price}`);
          return price;
        }
      }
    }
  }

  // Extract from markdown content - look for price patterns (European format)
  const pricePatterns = [
    /€\s*(\d+[.,]\d{2})/,
    /EUR\s*(\d+[.,]\d{2})/i,
    /(\d+[.,]\d{2})\s*€/,
    /price[:\s]*€?\s*(\d+[.,]\d{2})/i,
    /\*\*€(\d+[.,]\d{2})\*\*/,
  ];

  for (const pattern of pricePatterns) {
    const match = markdown.match(pattern);
    if (match) {
      const price = parseFloat(match[1].replace(',', '.'));
      if (!isNaN(price) && price > 5 && price < 500) {
        console.log(`[Prusament] Found markdown price: €${price}`);
        return price;
      }
    }
  }

  return null;
}

/**
 * Extract high-quality product image from Prusa page
 */
function extractPrusaImage(metadata: any, productUrl: string): string | null {
  // Priority 1: og:image from metadata (usually high quality)
  if (metadata?.['og:image']) {
    const ogImage = metadata['og:image'];
    // Ensure it's a product image, not a logo or placeholder
    if (ogImage.includes('content/images/product/') || ogImage.includes('cdn-cgi/image')) {
      // Upgrade to 1024px width for high quality
      let upgradedUrl = ogImage;
      if (ogImage.includes('width=')) {
        upgradedUrl = ogImage.replace(/width=\d+/, 'width=1024');
      }
      return upgradedUrl;
    }
    // Accept og:image even if it doesn't match Prusa CDN pattern
    return ogImage;
  }

  // Priority 2: twitter:image
  if (metadata?.['twitter:image']) {
    const twitterImage = metadata['twitter:image'];
    if (twitterImage.includes('content/images/product/') || twitterImage.includes('cdn-cgi/image')) {
      return twitterImage.replace(/width=\d+/, 'width=1024');
    }
    return twitterImage;
  }

  // Priority 3: Construct image URL from product URL slug
  const urlSlug = productUrl.split('/').filter(Boolean).pop() || '';
  if (urlSlug) {
    return `https://www.prusa3d.com/cdn-cgi/image/width=1024,format=auto,quality=85/content/images/product/${urlSlug}.jpg`;
  }

  return null;
}

/**
 * Validate that an image URL returns a valid image
 */
async function validateImageUrl(url: string): Promise<boolean> {
  try {
    const response = await fetch(url, { method: 'HEAD' });
    if (!response.ok) return false;
    const contentType = response.headers.get('content-type');
    return contentType?.startsWith('image/') || false;
  } catch {
    return false;
  }
}

/**
 * Scrape a single Prusa product page using Firecrawl - enhanced with HTML
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
        formats: ['markdown', 'html'], // Request HTML for better extraction
        onlyMainContent: false,
        waitFor: 3000, // Wait longer for dynamic content
      }),
    });

    if (!response.ok) {
      console.log(`[Prusament] Firecrawl error for ${productUrl}: ${response.status}`);
      return result;
    }

    const data = await response.json();
    const markdown = data.data?.markdown || data.markdown || '';
    const html = data.data?.html || data.html || '';
    const metadata = data.data?.metadata || data.metadata || {};

    // Extract price with enhanced patterns
    result.priceEur = extractPrusaPrice(markdown, html, metadata);
    if (result.priceEur) {
      result.priceUsd = convertEurToUsd(result.priceEur);
    }

    // Extract and validate image
    const potentialImage = extractPrusaImage(metadata, productUrl);
    if (potentialImage) {
      const isValid = await validateImageUrl(potentialImage);
      if (isValid) {
        result.imageUrl = potentialImage;
      } else {
        console.log(`[Prusament] Image validation failed for ${potentialImage}`);
      }
    }

    // Check availability
    const lowerContent = (markdown + html).toLowerCase();
    if (lowerContent.includes('out of stock') || lowerContent.includes('unavailable') || lowerContent.includes('discontinued')) {
      result.available = false;
    }

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
    try {
      const body = await req.json();
      enableScraping = body.enableScraping !== false;
    } catch { /* no body */ }

    console.log('[Prusament] Starting CSV-seeded sync (upsert pattern)...');
    console.log(`[Prusament] Seed contains ${PRUSAMENT_PRODUCT_SEED.length} products`);
    console.log(`[Prusament] Background scraping enabled: ${enableScraping && !!firecrawlApiKey}`);

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

    // Filter seed data
    const validProducts = PRUSAMENT_PRODUCT_SEED.filter(p => !shouldExcludePrusamentProduct(p));
    stats.discovered = validProducts.length;
    console.log(`[Prusament] Valid products after filtering: ${validProducts.length}`);

    // Track product IDs for background enrichment
    const productIdsForEnrichment: string[] = [];

    // PHASE 1: Fast upsert all products from CSV seed (no scraping, no deletion)
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

      } catch (err) {
        console.error(`[Prusament] Error processing ${product.filamentName}:`, err);
        stats.errors++;
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
