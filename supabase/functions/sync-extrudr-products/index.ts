import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import {
  enrichExtrudrProduct,
  getExtrudrColorHex,
  cleanExtrudrTitle,
  extractExtrudrColorFromTitle,
  EXTRUDR_STORE_INFO,
} from '../_shared/extrudr-defaults.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface SyncStats {
  discovered: number;
  created: number;
  updated: number;
  skipped: number;
  failed: number;
  errors: string[];
}

interface ProductData {
  productId: string;
  title: string;
  colorName: string | null;
  priceEur: number | null;
  priceUsd: number | null;
  imageUrl: string | null;
  productUrl: string;
  sku: string | null;
  ean: string | null;
  diameter: number;
  weight: number;
}

// Known Extrudr product slugs for discovery
const EXTRUDR_PRODUCT_SLUGS = [
  'pla-nx2',
  'pla-basic',
  'biofusion',
  'greentec',
  'greentec-pro',
  'greentec-pro-carbon',
  'flax',
  'petg',
  'pctg',
  'xpetg',
  'xpetg-cf',
  'durapro-abs',
  'durapro-abs-cf',
  'durapro-asa',
  'durapro-asa-cf',
  'durapro-asa-gf',
  'durapro-pa12',
  'durapro-pc-pbt',
  'durapro-pc-pbt-cf',
  'flex-semisoft',
  'flex-medium',
  'flex-medium-esd',
  'flex-hard',
  'flex-hard-cf',
  'pearl',
  'wood',
];

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
    failed: 0,
    errors: [],
  };

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const firecrawlKey = Deno.env.get('FIRECRAWL_API_KEY');
    
    const supabase = createClient(supabaseUrl, supabaseKey);

    const body = await req.json().catch(() => ({}));
    const cleanSlate = body.cleanSlate === true;
    const limit = body.limit || 500;

    console.log(`[Extrudr Sync] Starting sync. Clean slate: ${cleanSlate}, Limit: ${limit}`);

    // =========================================================================
    // STEP 1: OPTIONAL CLEAN SLATE
    // =========================================================================
    
    let existingProductIds: Set<string> = new Set();
    
    if (cleanSlate) {
      console.log('[Step 1] Clean slate mode - deleting existing Extrudr products');
      const { error: deleteError, count } = await supabase
        .from('filaments')
        .delete()
        .ilike('vendor', 'extrudr');
      
      if (deleteError) {
        console.error('[Step 1] Delete error:', deleteError);
        stats.errors.push(`Clean slate failed: ${deleteError.message}`);
      } else {
        console.log(`[Step 1] Deleted ${count || 0} existing Extrudr products`);
      }
    } else {
      // Collect existing product IDs to skip
      const { data: existing } = await supabase
        .from('filaments')
        .select('product_id')
        .ilike('vendor', 'extrudr');
      
      if (existing) {
        existingProductIds = new Set(existing.map(p => p.product_id).filter(Boolean));
        console.log(`[Step 1] Found ${existingProductIds.size} existing Extrudr products`);
      }
    }

    // =========================================================================
    // STEP 2: DISCOVER PRODUCT URLS
    // =========================================================================
    
    console.log('[Step 2] Discovering product URLs via Firecrawl');
    
    const productUrls: string[] = [];
    
    if (firecrawlKey) {
      // Use Firecrawl to map the collection page
      try {
        const mapResponse = await fetch('https://api.firecrawl.dev/v1/map', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${firecrawlKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            url: EXTRUDR_STORE_INFO.collectionsUrl,
            limit: 200,
            includeSubdomains: false,
          }),
        });

        if (mapResponse.ok) {
          const mapData = await mapResponse.json();
          const urls = mapData.links || [];
          
          // Filter for product pages
          for (const url of urls) {
            if (url.includes('/product/') && url.includes('/filament/')) {
              productUrls.push(url);
            }
          }
          console.log(`[Step 2] Firecrawl map found ${productUrls.length} product URLs`);
        }
      } catch (err) {
        console.error('[Step 2] Firecrawl map error:', err);
      }
    }
    
    // Fallback: Generate URLs from known slugs
    if (productUrls.length === 0) {
      console.log('[Step 2] Using fallback URL generation from known slugs');
      for (const slug of EXTRUDR_PRODUCT_SLUGS) {
        productUrls.push(`https://www.extrudr.com/en/inlt/product/filament/${slug}/`);
      }
    }
    
    stats.discovered = productUrls.length;
    console.log(`[Step 2] Total URLs to process: ${productUrls.length}`);

    // =========================================================================
    // STEP 3: SCRAPE PRODUCT PAGES
    // =========================================================================
    
    console.log('[Step 3] Scraping individual product pages');
    
    const products: ProductData[] = [];
    let processed = 0;
    
    for (const url of productUrls.slice(0, limit)) {
      processed++;
      
      if (!firecrawlKey) {
        console.log(`[Step 3] No Firecrawl key, skipping scrape for ${url}`);
        continue;
      }
      
      try {
        // Rate limiting
        if (processed > 1) {
          await new Promise(r => setTimeout(r, 1500));
        }
        
        console.log(`[Step 3] Scraping (${processed}/${Math.min(productUrls.length, limit)}): ${url}`);
        
        const scrapeResponse = await fetch('https://api.firecrawl.dev/v1/scrape', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${firecrawlKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            url,
            formats: ['markdown', 'html'],
            waitFor: 3000,
            onlyMainContent: true,
          }),
        });
        
        if (!scrapeResponse.ok) {
          console.error(`[Step 3] Scrape failed for ${url}: ${scrapeResponse.status}`);
          stats.failed++;
          continue;
        }
        
        const scrapeData = await scrapeResponse.json();
        const markdown = scrapeData.data?.markdown || scrapeData.markdown || '';
        const html = scrapeData.data?.html || scrapeData.html || '';
        
        // Extract product title
        const titleMatch = markdown.match(/^#\s*(.+)$/m) || 
                          markdown.match(/\*\*([^*]+)\*\*/) ||
                          html.match(/<h1[^>]*>([^<]+)<\/h1>/i);
        const title = titleMatch ? titleMatch[1].trim() : '';
        
        if (!title || title.length < 3) {
          console.log(`[Step 3] No title found for ${url}`);
          stats.skipped++;
          continue;
        }
        
        // Extract price (EUR)
        const priceMatch = markdown.match(/€\s*([\d,.]+)/) || 
                          markdown.match(/([\d,.]+)\s*€/) ||
                          html.match(/price[^>]*>.*?€?\s*([\d,.]+)/i);
        let priceEur: number | null = null;
        if (priceMatch) {
          priceEur = parseFloat(priceMatch[1].replace(',', '.'));
        }
        
        // Extract image
        const imageMatch = html.match(/src="(https:\/\/[^"]*extrudr[^"]*\.(jpg|png|webp)[^"]*)"/i) ||
                          html.match(/data-src="(https:\/\/[^"]*\.(jpg|png|webp)[^"]*)"/i);
        const imageUrl = imageMatch ? imageMatch[1] : null;
        
        // Extract colors from page
        const colorMatches = markdown.match(/(?:color|colour|farbe):\s*([^\n,]+)/gi) ||
                            html.match(/color-option[^>]*>([^<]+)/gi) ||
                            [];
        
        const colors: string[] = [];
        for (const match of colorMatches) {
          const color = match.replace(/(?:color|colour|farbe):\s*/i, '').trim();
          if (color && color.length > 1 && color.length < 30) {
            colors.push(color);
          }
        }
        
        // Also try to extract color from title
        const titleColor = extractExtrudrColorFromTitle(title);
        if (titleColor && !colors.includes(titleColor)) {
          colors.push(titleColor);
        }
        
        // If no colors found, use the product as single entry
        if (colors.length === 0) {
          colors.push('');
        }
        
        // Extract SKU/EAN
        const skuMatch = markdown.match(/(?:sku|article|art\.?\s*no\.?):\s*([A-Z0-9-]+)/i) ||
                        html.match(/sku[^>]*>([^<]+)/i);
        const sku = skuMatch ? skuMatch[1].trim() : null;
        
        const eanMatch = markdown.match(/(?:ean|gtin|barcode):\s*(\d{13})/i) ||
                        html.match(/ean[^>]*>(\d{13})/i);
        const ean = eanMatch ? eanMatch[1] : null;
        
        // Extract diameter (1.75 or 2.85)
        const diameterMatch = markdown.match(/(1\.75|2\.85)\s*mm/i) ||
                             title.match(/(1\.75|2\.85)/);
        const diameter = diameterMatch ? parseFloat(diameterMatch[1]) : 1.75;
        
        // Extract weight
        const weightMatch = markdown.match(/(\d{3,4})\s*g/) ||
                           title.match(/(\d+)\s*g/);
        const weight = weightMatch ? parseInt(weightMatch[1]) : EXTRUDR_STORE_INFO.defaultWeight;
        
        // Generate slug from URL
        const urlSlug = url.match(/\/product\/filament\/([^/]+)/)?.[1] || 'unknown';
        
        // Create variant-exploded products
        for (const color of colors) {
          const colorSlug = color.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '') || 'standard';
          const productId = `extrudr-${urlSlug}-${colorSlug}-${diameter}mm`;
          
          // Skip if already exists (unless clean slate)
          if (existingProductIds.has(productId)) {
            stats.skipped++;
            continue;
          }
          
          const productTitle = color ? `${title} - ${color}` : title;
          
          products.push({
            productId,
            title: productTitle,
            colorName: color || null,
            priceEur,
            priceUsd: priceEur ? Math.round(priceEur * EXTRUDR_STORE_INFO.exchangeRate * 100) / 100 : null,
            imageUrl,
            productUrl: url,
            sku,
            ean,
            diameter,
            weight,
          });
        }
        
      } catch (err) {
        console.error(`[Step 3] Error scraping ${url}:`, err);
        stats.failed++;
        stats.errors.push(`Scrape error: ${url} - ${err instanceof Error ? err.message : String(err)}`);
      }
    }
    
    console.log(`[Step 3] Scraped ${products.length} product variants`);

    // =========================================================================
    // STEP 4: ENRICH AND UPSERT PRODUCTS
    // =========================================================================
    
    console.log('[Step 4] Enriching and upserting products');
    
    for (const product of products) {
      try {
        const enrichment = enrichExtrudrProduct(product.title, product.colorName);
        const cleanedTitle = cleanExtrudrTitle(product.title);
        const colorHex = product.colorName ? getExtrudrColorHex(product.colorName) : null;
        
        const filamentData = {
          product_id: product.productId,
          product_title: product.title,
          vendor: EXTRUDR_STORE_INFO.vendor,
          product_url: product.productUrl,
          featured_image: product.imageUrl,
          variant_price: product.priceUsd,
          price_eur: product.priceEur,
          variant_available: true,
          material: enrichment.material,
          finish_type: enrichment.finishType,
          product_line_id: enrichment.productLineId,
          color_hex: colorHex || enrichment.colorHex,
          color_family: product.colorName,
          tds_url: enrichment.tdsUrl,
          nozzle_temp_min_c: enrichment.nozzleTempMin,
          nozzle_temp_max_c: enrichment.nozzleTempMax,
          bed_temp_min_c: enrichment.bedTempMin,
          bed_temp_max_c: enrichment.bedTempMax,
          print_speed_max_mms: enrichment.printSpeedMax,
          is_nozzle_abrasive: enrichment.isAbrasive,
          high_speed_capable: false,
          diameter_nominal_mm: product.diameter,
          net_weight_g: product.weight,
          spool_material: EXTRUDR_STORE_INFO.spoolMaterial,
          mpn: product.sku,
          ean: product.ean,
          auto_created: true,
          auto_updated: true,
          last_scraped_at: new Date().toISOString(),
          sync_status: 'synced',
        };
        
        // Check if product exists
        const { data: existing } = await supabase
          .from('filaments')
          .select('id')
          .eq('product_id', product.productId)
          .single();
        
        if (existing) {
          // Update
          const { error: updateError } = await supabase
            .from('filaments')
            .update(filamentData)
            .eq('id', existing.id);
          
          if (updateError) {
            console.error(`[Step 4] Update error for ${product.productId}:`, updateError);
            stats.failed++;
          } else {
            stats.updated++;
          }
        } else {
          // Insert
          const { error: insertError } = await supabase
            .from('filaments')
            .insert(filamentData);
          
          if (insertError) {
            console.error(`[Step 4] Insert error for ${product.productId}:`, insertError);
            stats.failed++;
          } else {
            stats.created++;
          }
        }
        
      } catch (err) {
        console.error(`[Step 4] Error processing ${product.productId}:`, err);
        stats.failed++;
        stats.errors.push(`Process error: ${product.productId}`);
      }
    }

    // =========================================================================
    // STEP 5: FINALIZE
    // =========================================================================
    
    console.log('[Step 5] Finalizing sync');
    
    // Update brand product counts
    await supabase.rpc('update_brand_product_counts', { p_brand_slug: 'extrudr' });
    
    // Check for duplicate hex codes
    const { data: dupes } = await supabase.rpc('find_duplicate_hexes', { p_vendor: 'Extrudr' });
    if (dupes && dupes.length > 0) {
      console.log(`[Step 5] Found ${dupes.length} duplicate hex entries`);
    }
    
    // Mark brand as not actively scraping
    await supabase
      .from('automated_brands')
      .update({ 
        scraping_active: false,
        last_scrape_at: new Date().toISOString(),
      })
      .eq('brand_slug', 'extrudr');
    
    const duration = Math.round((Date.now() - startTime) / 1000);
    
    console.log(`[Extrudr Sync] Complete in ${duration}s:`, stats);
    
    return new Response(
      JSON.stringify({
        success: true,
        stats,
        duration,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
    
  } catch (error) {
    console.error('[Extrudr Sync] Fatal error:', error);
    
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : String(error),
        stats,
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
