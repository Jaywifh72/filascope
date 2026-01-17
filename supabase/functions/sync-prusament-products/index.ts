/**
 * Prusament CSV-Seeded Sync Pipeline with Price/Image Scraping
 * 
 * Uses PRUSAMENT_PRODUCT_SEED as primary source.
 * Scrapes prusa3d.com product pages for:
 * - Prices (EUR -> USD conversion)
 * - High-quality product images
 * 
 * Implements Safe Delete pattern with 50-product threshold.
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
  generatePrusamentProductLineId,
  normalizePrusamentMaterial,
  getPrusamentTdsUrl,
  getPrusamentColorHex,
} from '../_shared/prusament-defaults.ts';
import { getColorFamily, getColorFamilyFromHex } from '../_shared/color-mapping.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const SAFE_DELETE_THRESHOLD = 50;
const SCRAPE_BATCH_SIZE = 10;
const SCRAPE_DELAY_MS = 500;

interface SyncStats {
  discovered: number;
  created: number;
  updated: number;
  skipped: number;
  errors: number;
  deleted: number;
  scraped: number;
  scrapeErrors: number;
}

interface ScrapedData {
  priceEur: number | null;
  priceUsd: number | null;
  imageUrl: string | null;
  available: boolean;
}

/**
 * Extract price from Prusa product page HTML/metadata
 */
function extractPrusaPrice(markdown: string, metadata: any): number | null {
  // Try JSON-LD product schema first
  if (metadata?.jsonLd) {
    try {
      const jsonLd = typeof metadata.jsonLd === 'string' 
        ? JSON.parse(metadata.jsonLd) 
        : metadata.jsonLd;
      
      // Handle array of JSON-LD objects
      const products = Array.isArray(jsonLd) ? jsonLd : [jsonLd];
      for (const item of products) {
        if (item['@type'] === 'Product' && item.offers) {
          const offers = Array.isArray(item.offers) ? item.offers : [item.offers];
          for (const offer of offers) {
            if (offer.price) {
              const price = parseFloat(offer.price);
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
  if (metadata?.['product:price:amount']) {
    const price = parseFloat(metadata['product:price:amount']);
    if (!isNaN(price) && price > 0 && price < 500) {
      console.log(`[Prusament] Found meta price: €${price}`);
      return price;
    }
  }

  // Try og:price
  if (metadata?.['og:price:amount']) {
    const price = parseFloat(metadata['og:price:amount']);
    if (!isNaN(price) && price > 0 && price < 500) {
      return price;
    }
  }

  // Extract from markdown content - look for price patterns
  const pricePatterns = [
    /€\s*(\d+[.,]\d{2})/,
    /EUR\s*(\d+[.,]\d{2})/i,
    /(\d+[.,]\d{2})\s*€/,
    /price[:\s]*€?\s*(\d+[.,]\d{2})/i,
  ];

  for (const pattern of pricePatterns) {
    const match = markdown.match(pattern);
    if (match) {
      const price = parseFloat(match[1].replace(',', '.'));
      if (!isNaN(price) && price > 5 && price < 500) {
        console.log(`[Prusament] Found content price: €${price}`);
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
      const upgradedUrl = ogImage.replace(/width=\d+/, 'width=1024');
      console.log(`[Prusament] Found og:image: ${upgradedUrl}`);
      return upgradedUrl;
    }
  }

  // Priority 2: Check for twitter:image
  if (metadata?.['twitter:image']) {
    const twitterImage = metadata['twitter:image'];
    if (twitterImage.includes('content/images/product/')) {
      const upgradedUrl = twitterImage.replace(/width=\d+/, 'width=1024');
      return upgradedUrl;
    }
  }

  // Priority 3: Try to construct image URL from product URL slug
  const urlSlug = productUrl.split('/').filter(Boolean).pop() || '';
  if (urlSlug) {
    // Prusa CDN pattern for product images
    const potentialImageUrl = `https://www.prusa3d.com/cdn-cgi/image/width=1024,format=auto,quality=85/content/images/product/${urlSlug}.jpg`;
    return potentialImageUrl;
  }

  return null;
}

/**
 * Scrape a single Prusa product page using Firecrawl
 */
async function scrapePrusaProduct(
  productUrl: string,
  firecrawlApiKey: string
): Promise<ScrapedData> {
  const result: ScrapedData = {
    priceEur: null,
    priceUsd: null,
    imageUrl: null,
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
        formats: ['markdown'],
        onlyMainContent: false,
        waitFor: 2000,
      }),
    });

    if (!response.ok) {
      console.log(`[Prusament] Firecrawl error for ${productUrl}: ${response.status}`);
      return result;
    }

    const data = await response.json();
    const markdown = data.data?.markdown || data.markdown || '';
    const metadata = data.data?.metadata || data.metadata || {};

    // Extract price
    result.priceEur = extractPrusaPrice(markdown, metadata);
    if (result.priceEur) {
      result.priceUsd = convertEurToUsd(result.priceEur);
    }

    // Extract image
    result.imageUrl = extractPrusaImage(metadata, productUrl);

    // Check availability
    const lowerMarkdown = markdown.toLowerCase();
    if (lowerMarkdown.includes('out of stock') || lowerMarkdown.includes('unavailable') || lowerMarkdown.includes('discontinued')) {
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

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const startTime = Date.now();
  const stats: SyncStats = { 
    discovered: 0, created: 0, updated: 0, skipped: 0, errors: 0, deleted: 0,
    scraped: 0, scrapeErrors: 0
  };

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const firecrawlApiKey = Deno.env.get('FIRECRAWL_API_KEY');
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Parse options
    let cleanSlate = false;
    let enableScraping = true;
    let scrapeLimit = 0; // 0 = no limit (scrape all)
    try {
      const body = await req.json();
      cleanSlate = body.cleanSlate === true;
      enableScraping = body.enableScraping !== false; // Default to true
      scrapeLimit = body.scrapeLimit || 0;
    } catch { /* no body */ }

    console.log('[Prusament] Starting CSV-seeded sync with scraping...');
    console.log(`[Prusament] Seed contains ${PRUSAMENT_PRODUCT_SEED.length} products`);
    console.log(`[Prusament] Scraping enabled: ${enableScraping}, Firecrawl key: ${firecrawlApiKey ? 'present' : 'MISSING'}`);

    // Get brand info
    const { data: brand } = await supabase
      .from('automated_brands')
      .select('id')
      .eq('brand_slug', 'prusament')
      .maybeSingle();

    const brandId = brand?.id || null;

    // Mark brand as scraping
    await supabase
      .from('automated_brands')
      .update({ scraping_active: true, scrape_timeout_at: new Date(Date.now() + 30 * 60 * 1000).toISOString() })
      .eq('brand_slug', 'prusament');

    // Filter seed data
    const validProducts = PRUSAMENT_PRODUCT_SEED.filter(p => !shouldExcludePrusamentProduct(p));
    stats.discovered = validProducts.length;
    console.log(`[Prusament] Valid products after filtering: ${validProducts.length}`);

    // Safe Delete
    if (cleanSlate && validProducts.length >= SAFE_DELETE_THRESHOLD) {
      console.log('[Prusament] Safe delete: removing existing products...');
      const { data: deletedRows } = await supabase
        .from('filaments')
        .delete()
        .ilike('vendor', 'Prusament')
        .select('id');
      const count = deletedRows?.length || 0;
      stats.deleted = count;
      console.log(`[Prusament] Deleted ${count} existing products`);
    }

    // Process products in batches
    const batchSize = 50;
    for (let i = 0; i < validProducts.length; i += batchSize) {
      const batch = validProducts.slice(i, i + batchSize);
      
      for (const product of batch) {
        try {
          const cleanColor = cleanPrusamentColorName(product.color);
          const enrichment = enrichPrusamentProduct(product.filamentName, product.material, product.colorHex);
          
          // Get color hex - prefer CSV, fallback to enrichment
          let colorHex = product.colorHex || enrichment.colorHex;
          if (!colorHex) {
            colorHex = getPrusamentColorHex(cleanColor);
          }
          
          // Get color family - prefer name-based lookup, fallback to hex analysis
          const colorFamily = getColorFamily(cleanColor) || getColorFamilyFromHex(colorHex);
          
          // Generate product ID from URL
          const urlSlug = product.productUrl.split('/').filter(Boolean).pop() || '';
          const productId = `prusament-${urlSlug}`;

          // Default price from seed (material-based)
          const defaultPriceEur = getPrusamentDefaultPriceEur(product.material, product.weightGrams);
          let priceUsd = convertEurToUsd(defaultPriceEur);
          let imageUrl: string | null = null;
          let available = true;

          // Scrape for real price and image if Firecrawl is available
          if (enableScraping && firecrawlApiKey && (scrapeLimit === 0 || stats.scraped < scrapeLimit)) {
            const scraped = await scrapePrusaProduct(product.productUrl, firecrawlApiKey);
            stats.scraped++;
            
            if (scraped.priceUsd) {
              priceUsd = scraped.priceUsd;
            }
            if (scraped.imageUrl) {
              imageUrl = scraped.imageUrl;
            }
            available = scraped.available;

            // Rate limiting
            await delay(SCRAPE_DELAY_MS);
          }

          // Calculate price per kg for variant_price
          const pricePerKg = (priceUsd / product.weightGrams) * 1000;

          const filamentRecord = {
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
            variant_price: pricePerKg,
            featured_image: imageUrl,
            variant_available: available,
            auto_created: true,
            auto_updated: true,
            last_scraped_at: new Date().toISOString(),
            sync_status: 'synced',
          };

          // Check if exists
          const { data: existing } = await supabase
            .from('filaments')
            .select('id, featured_image, variant_price')
            .eq('product_id', productId)
            .maybeSingle();

          if (existing) {
            // Don't overwrite existing images if we didn't get one from scraping
            const updateRecord = { ...filamentRecord };
            if (!imageUrl && existing.featured_image) {
              updateRecord.featured_image = existing.featured_image;
            }
            // Don't overwrite existing price with fallback if scraping failed
            if (!enableScraping || !firecrawlApiKey) {
              if (existing.variant_price && existing.variant_price > 0) {
                updateRecord.variant_price = existing.variant_price;
              }
            }
            
            await supabase.from('filaments').update(updateRecord).eq('id', existing.id);
            stats.updated++;
          } else {
            await supabase.from('filaments').insert(filamentRecord);
            stats.created++;
          }
        } catch (err) {
          console.error(`[Prusament] Error processing ${product.filamentName}:`, err);
          stats.errors++;
        }
      }
    }

    // Fix duplicate hex codes
    try {
      await supabase.rpc('find_duplicate_hexes', { p_vendor: 'Prusament' });
    } catch (e) {
      console.log('[Prusament] find_duplicate_hexes RPC not found, skipping');
    }

    // Update brand stats
    try {
      await supabase.rpc('update_brand_product_counts', { p_brand_slug: 'prusament' });
    } catch (e) {
      console.log('[Prusament] update_brand_product_counts RPC not found, skipping');
    }

    await supabase
      .from('automated_brands')
      .update({ 
        scraping_active: false, 
        scrape_timeout_at: null,
        last_scrape_at: new Date().toISOString()
      })
      .eq('brand_slug', 'prusament');

    const duration = ((Date.now() - startTime) / 1000).toFixed(1);
    console.log(`[Prusament] Sync complete in ${duration}s:`, stats);

    return new Response(JSON.stringify({
      success: true,
      vendor: 'Prusament',
      stats,
      duration: `${duration}s`,
    }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    console.error('[Prusament] Fatal error:', errorMsg);
    
    return new Response(JSON.stringify({
      success: false,
      vendor: 'Prusament',
      error: errorMsg,
      stats,
    }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
});
