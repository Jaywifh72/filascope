import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import {
  enrichColorFabbProduct,
  cleanColorFabbTitle,
  getColorFabbColorHex,
  COLORFABB_STORE_INFO,
} from '../_shared/colorfabb-defaults.ts';
import {
  shouldIncludeVariant,
  extractWeightFromText,
  extractDiameterFromText,
  createFilterStats,
  updateFilterStats,
  logFilterStats,
} from '../_shared/variant-filters.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ProductData {
  productId: string;
  title: string;
  url: string;
  price: number | null;
  currency: string;
  imageUrl: string | null;
  colorName: string | null;
  diameter: number;
  weight: number;
}

interface SyncStats {
  discovered: number;
  created: number;
  updated: number;
  skipped: number;
  errors: number;
  errorDetails: string[];
}

// EUR to USD conversion rate (approximate)
const EUR_TO_USD = 1.08;

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const startTime = Date.now();
  const stats: SyncStats = {
    discovered: 0,
    created: 0,
    updated: 0,
    skipped: 0,
    errors: 0,
    errorDetails: [],
  };

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const firecrawlKey = Deno.env.get('FIRECRAWL_API_KEY');
    const supabase = createClient(supabaseUrl, supabaseKey);

    const body = await req.json().catch(() => ({}));
    const { cleanSlate = false, limit = 500, skipExisting = true } = body;

    console.log(`[ColorFabb] Starting sync - cleanSlate: ${cleanSlate}, limit: ${limit}`);

    // =========================================================================
    // STEP 1: Optional Clean Slate
    // =========================================================================
    if (cleanSlate) {
      console.log('[ColorFabb] Clean slate mode - deleting existing products...');
      const { error: deleteError } = await supabase
        .from('filaments')
        .delete()
        .ilike('vendor', 'colorfabb');
      
      if (deleteError) {
        console.error('[ColorFabb] Delete error:', deleteError);
      } else {
        console.log('[ColorFabb] Deleted existing products');
      }
    }

    // =========================================================================
    // STEP 2: Fetch Existing Products
    // =========================================================================
    const { data: existingProducts } = await supabase
      .from('filaments')
      .select('id, product_id, product_title, product_url')
      .ilike('vendor', 'colorfabb');

    const existingUrls = new Set((existingProducts || []).map(p => p.product_url).filter(Boolean));
    const existingIds = new Set((existingProducts || []).map(p => p.product_id).filter(Boolean));
    console.log(`[ColorFabb] Found ${existingProducts?.length || 0} existing products`);

    // =========================================================================
    // STEP 3: Discover Product URLs via Firecrawl
    // =========================================================================
    const discoveredProducts: ProductData[] = [];

    if (!firecrawlKey) {
      console.log('[ColorFabb] No Firecrawl API key - skipping discovery, enriching existing only');
    } else {
      console.log('[ColorFabb] Discovering products from category pages...');

      for (const categoryUrl of COLORFABB_STORE_INFO.categoryUrls) {
        if (discoveredProducts.length >= limit) break;

        try {
          // Use Firecrawl map to get product URLs
          console.log(`[ColorFabb] Mapping category: ${categoryUrl}`);
          const mapResponse = await fetch('https://api.firecrawl.dev/v1/map', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${firecrawlKey}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              url: categoryUrl,
              limit: 200,
            }),
          });

          const mapData = await mapResponse.json();
          const productUrls = (mapData.links || []).filter((url: string) =>
            url.includes('colorfabb.com/') &&
            !url.includes('/cart') &&
            !url.includes('/checkout') &&
            !url.includes('/account') &&
            !url.includes('/page/') &&
            !url.endsWith('/pla') &&
            !url.endsWith('/tpu') &&
            !url.endsWith('/co-polyester') &&
            !url.endsWith('/asa') &&
            !url.endsWith('/pa') &&
            !url.endsWith('/pha') &&
            !url.includes('?') &&
            url.split('/').length >= 4
          );

          console.log(`[ColorFabb] Found ${productUrls.length} product URLs in ${categoryUrl}`);

          // Scrape each product page
          for (const productUrl of productUrls) {
            if (discoveredProducts.length >= limit) break;
            if (skipExisting && existingUrls.has(productUrl)) {
              stats.skipped++;
              continue;
            }

            try {
              await new Promise(resolve => setTimeout(resolve, 500)); // Rate limit

              const scrapeResponse = await fetch('https://api.firecrawl.dev/v1/scrape', {
                method: 'POST',
                headers: {
                  'Authorization': `Bearer ${firecrawlKey}`,
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                  url: productUrl,
                  formats: ['markdown', 'html'],
                  waitFor: 2000,
                }),
              });

              const scrapeData = await scrapeResponse.json();
              const markdown = scrapeData.data?.markdown || '';
              const html = scrapeData.data?.html || '';

              // Extract title from markdown or HTML
              const titleMatch = markdown.match(/^#\s+(.+?)(?:\n|$)/m) ||
                                html.match(/<h1[^>]*>([^<]+)<\/h1>/i);
              const title = titleMatch ? titleMatch[1].trim() : '';

              if (!title) {
                console.log(`[ColorFabb] No title found for ${productUrl}`);
                continue;
              }

              // Extract price
              const priceMatch = markdown.match(/€\s*([\d,.]+)/) ||
                                html.match(/price[^>]*>.*?€\s*([\d,.]+)/i);
              const priceStr = priceMatch ? priceMatch[1].replace(',', '.') : null;
              const priceEur = priceStr ? parseFloat(priceStr) : null;
              const priceUsd = priceEur ? Math.round(priceEur * EUR_TO_USD * 100) / 100 : null;

              // Extract image
              const imageMatch = html.match(/product-image[^>]*src="([^"]+)"/i) ||
                                html.match(/<img[^>]*src="(https:\/\/[^"]*colorfabb[^"]+\.(?:jpg|png|webp))"/i);
              const imageUrl = imageMatch ? imageMatch[1] : null;

              // Extract color from title or product name
              const colorMatch = title.match(/\b(white|black|red|blue|green|yellow|orange|purple|pink|gray|grey|silver|gold|bronze|copper|natural|clear|transparent|glow)\b/i);
              const colorName = colorMatch ? colorMatch[1] : null;

              // Extract diameter options (default 1.75mm)
              const diameterMatch = markdown.match(/(\d+\.?\d*)\s*mm/) ||
                                  html.match(/diameter[^>]*>.*?(\d+\.?\d*)/i);
              const diameter = diameterMatch ? parseFloat(diameterMatch[1]) : 1.75;

              // Extract weight (default 750g)
              const weightMatch = markdown.match(/(\d+)\s*(?:gram|g)\b/i) ||
                                 title.match(/(\d+)g\b/i);
              const weight = weightMatch ? parseInt(weightMatch[1]) : 750;

              // Generate product ID
              const slug = title.toLowerCase()
                .replace(/[^a-z0-9]+/g, '-')
                .replace(/^-|-$/g, '');
              const productId = `colorfabb-${slug}-${diameter}mm-${weight}g`;

              if (existingIds.has(productId)) {
                stats.skipped++;
                continue;
              }

              discoveredProducts.push({
                productId,
                title: cleanColorFabbTitle(title),
                url: productUrl,
                price: priceUsd,
                currency: 'USD',
                imageUrl,
                colorName,
                diameter,
                weight,
              });

              stats.discovered++;
              console.log(`[ColorFabb] Discovered: ${title} (€${priceEur} / $${priceUsd})`);

            } catch (scrapeError) {
              console.error(`[ColorFabb] Scrape error for ${productUrl}:`, scrapeError);
              stats.errors++;
            }
          }

        } catch (categoryError) {
          console.error(`[ColorFabb] Category error for ${categoryUrl}:`, categoryError);
          stats.errors++;
        }
      }
    }

    console.log(`[ColorFabb] Discovered ${discoveredProducts.length} new products`);

    // =========================================================================
    // STEP 4: Enrich and Upsert Products
    // =========================================================================
    for (const product of discoveredProducts) {
      try {
        const enriched = enrichColorFabbProduct(product.title, product.colorName);

        const filamentData = {
          product_id: product.productId,
          product_title: product.title,
          vendor: COLORFABB_STORE_INFO.vendor,
          product_url: product.url,
          variant_price: product.price,
          featured_image: product.imageUrl,
          material: enriched.material,
          finish_type: enriched.finishType,
          product_line_id: enriched.productLineId,
          tds_url: enriched.tdsUrl,
          color_hex: enriched.colorHex || getColorFabbColorHex(product.colorName || ''),
          nozzle_temp_min_c: enriched.nozzleTempMin,
          nozzle_temp_max_c: enriched.nozzleTempMax,
          bed_temp_min_c: enriched.bedTempMin,
          bed_temp_max_c: enriched.bedTempMax,
          print_speed_max_mms: enriched.printSpeedMax,
          is_nozzle_abrasive: enriched.isAbrasive,
          diameter_nominal_mm: product.diameter,
          net_weight_g: product.weight,
          high_speed_capable: enriched.highSpeedCapable,
          auto_created: true,
          auto_updated: true,
          last_scraped_at: new Date().toISOString(),
          sync_status: 'synced',
        };

        const { error: upsertError } = await supabase
          .from('filaments')
          .upsert(filamentData, { onConflict: 'product_id' });

        if (upsertError) {
          console.error(`[ColorFabb] Upsert error for ${product.productId}:`, upsertError);
          stats.errors++;
          stats.errorDetails.push(`${product.productId}: ${upsertError.message}`);
        } else {
          stats.created++;
        }

      } catch (enrichError) {
        console.error(`[ColorFabb] Enrich error for ${product.productId}:`, enrichError);
        stats.errors++;
      }
    }

    // =========================================================================
    // STEP 5: Enrich Existing Products (backfill finish_type and product_line_id)
    // =========================================================================
    const { data: productsToEnrich } = await supabase
      .from('filaments')
      .select('id, product_title, color_hex, material, finish_type, product_line_id')
      .ilike('vendor', 'colorfabb')
      .or('finish_type.is.null,product_line_id.is.null,material.eq.Other');

    console.log(`[ColorFabb] Enriching ${productsToEnrich?.length || 0} existing products...`);

    for (const product of productsToEnrich || []) {
      try {
        const enriched = enrichColorFabbProduct(product.product_title);

        const updates: Record<string, unknown> = {};

        if (!product.finish_type) {
          updates.finish_type = enriched.finishType;
        }
        if (!product.product_line_id) {
          updates.product_line_id = enriched.productLineId;
        }
        if (product.material === 'Other' || !product.material) {
          updates.material = enriched.material;
        }
        if (!product.color_hex && enriched.colorHex) {
          updates.color_hex = enriched.colorHex;
        }

        // Add print settings if missing
        if (enriched.nozzleTempMin) {
          updates.nozzle_temp_min_c = enriched.nozzleTempMin;
          updates.nozzle_temp_max_c = enriched.nozzleTempMax;
          updates.bed_temp_min_c = enriched.bedTempMin;
          updates.bed_temp_max_c = enriched.bedTempMax;
        }
        if (enriched.tdsUrl) {
          updates.tds_url = enriched.tdsUrl;
        }
        updates.is_nozzle_abrasive = enriched.isAbrasive;
        updates.high_speed_capable = enriched.highSpeedCapable;

        if (Object.keys(updates).length > 0) {
          const { error } = await supabase
            .from('filaments')
            .update(updates)
            .eq('id', product.id);

          if (error) {
            console.error(`[ColorFabb] Update error for ${product.id}:`, error);
          } else {
            stats.updated++;
          }
        }

      } catch (err) {
        console.error(`[ColorFabb] Enrich existing error:`, err);
      }
    }

    // =========================================================================
    // STEP 6: Update automated_brands and fix duplicates
    // =========================================================================
    await supabase
      .from('automated_brands')
      .update({
        last_scrape_at: new Date().toISOString(),
        scraping_active: false,
      })
      .eq('brand_slug', 'colorfabb');

    // Trigger product count update
    await supabase.rpc('update_brand_product_counts', { p_brand_slug: 'colorfabb' });
    await supabase.rpc('update_brand_enrichment_counts', { p_brand_slug: 'colorfabb' });

    // Fix duplicate hex codes
    const { data: duplicates } = await supabase.rpc('find_duplicate_hexes', { p_vendor: 'ColorFabb' });
    if (duplicates && duplicates.length > 0) {
      console.log(`[ColorFabb] Found ${duplicates.length} duplicate hex entries, fixing...`);
      const seen = new Map<string, number>();
      for (const dup of duplicates) {
        const key = `${dup.product_line_id}-${dup.color_hex?.toLowerCase()}`;
        const count = seen.get(key) || 0;
        if (count > 0) {
          const newHex = dup.color_hex?.replace(/^#/, '') || 'FFFFFF';
          const adjusted = `#${newHex.slice(0, 4)}${(parseInt(newHex.slice(4, 6), 16) + count) % 256}`.padEnd(7, '0');
          await supabase.from('filaments').update({ color_hex: adjusted }).eq('id', dup.id);
        }
        seen.set(key, count + 1);
      }
    }

    const duration = ((Date.now() - startTime) / 1000).toFixed(1);
    console.log(`[ColorFabb] Sync complete in ${duration}s - discovered: ${stats.discovered}, created: ${stats.created}, updated: ${stats.updated}, skipped: ${stats.skipped}, errors: ${stats.errors}`);

    return new Response(
      JSON.stringify({
        success: true,
        vendor: 'ColorFabb',
        duration: `${duration}s`,
        stats,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('[ColorFabb] Fatal error:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        stats,
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
