/**
 * Creality Filament Sync Pipeline
 * 
 * 5-Step Firecrawl HTML sync for store.creality.com
 * Shopify JSON API is blocked, so we use Firecrawl HTML scraping
 * 
 * Steps:
 * 1. Optional clean slate (delete existing products)
 * 2. Discover product URLs via Firecrawl map
 * 3. Scrape individual product pages with variant explosion
 * 4. Apply brand-specific enrichments
 * 5. Upsert to database and finalize
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import {
  enrichCrealityProduct,
  getCrealityColorHex,
  CREALITY_STORE_INFO,
} from '../_shared/creality-defaults.ts';
import {
  shouldIncludeVariant,
  createFilterStats,
  updateFilterStats,
  logFilterStats,
  extractWeightFromText,
  is285mmDiameter,
} from '../_shared/variant-filters.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface SyncStats {
  discovered: number;
  scraped: number;
  created: number;
  updated: number;
  skipped: number;
  errors: number;
  errorDetails: string[];
}

interface ProductData {
  productId: string;
  title: string;
  handle: string;
  price: number | null;
  compareAtPrice: number | null;
  imageUrl: string | null;
  productUrl: string;
  colorName: string | null;
  available: boolean;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const startTime = Date.now();
  const stats: SyncStats = {
    discovered: 0,
    scraped: 0,
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

    // Parse request options
    const body = await req.json().catch(() => ({}));
    const cleanSlate = body.cleanSlate === true;
    const limit = body.limit || 100;
    const skipExisting = body.skipExisting !== false;

    console.log(`[Creality Sync] Starting sync - cleanSlate: ${cleanSlate}, limit: ${limit}`);

    // Get brand info
    const { data: brand } = await supabase
      .from('automated_brands')
      .select('id, brand_name')
      .eq('brand_slug', 'creality')
      .single();

    const brandId = brand?.id || null;

    // =========================================================================
    // STEP 1: Optional Clean Slate
    // =========================================================================
    if (cleanSlate) {
      console.log('[Step 1] Clean slate - deleting existing Creality products...');
      const { error: deleteError } = await supabase
        .from('filaments')
        .delete()
        .ilike('vendor', 'creality');
      
      if (deleteError) {
        console.error('[Step 1] Delete error:', deleteError);
      } else {
        console.log('[Step 1] Deleted existing Creality products');
      }
    }

    // Get existing products for skip logic
    const existingProductIds = new Set<string>();
    if (skipExisting && !cleanSlate) {
      const { data: existing } = await supabase
        .from('filaments')
        .select('product_id')
        .ilike('vendor', 'creality');
      
      existing?.forEach(p => {
        if (p.product_id) existingProductIds.add(p.product_id);
      });
      console.log(`[Setup] Found ${existingProductIds.size} existing products`);
    }

    // =========================================================================
    // STEP 2: Discover Product URLs
    // =========================================================================
    console.log('[Step 2] Discovering product URLs via Firecrawl...');
    
    const discoveredUrls = new Set<string>();
    
    if (firecrawlKey) {
      try {
        // Map the collection page
        const mapResponse = await fetch('https://api.firecrawl.dev/v1/map', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${firecrawlKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            url: CREALITY_STORE_INFO.collectionsUrl,
            limit: 500,
          }),
        });

        const mapData = await mapResponse.json();
        
        if (mapData.success && mapData.links) {
          for (const url of mapData.links) {
            // Filter for product URLs
            if (url.includes('/products/') && 
                url.includes('filament') &&
                !url.includes('?variant=') &&
                !url.includes('#')) {
              discoveredUrls.add(url.split('?')[0]);
            }
          }
        }
        
        console.log(`[Step 2] Discovered ${discoveredUrls.size} product URLs`);
        stats.discovered = discoveredUrls.size;
      } catch (mapError) {
        console.error('[Step 2] Map error:', mapError);
        stats.errorDetails.push(`Map error: ${mapError}`);
      }
    } else {
      console.warn('[Step 2] No Firecrawl API key - using known product URLs');
      // Fallback: known product URLs from research
      const knownUrls = [
        'https://store.creality.com/products/hyper-series-pla-3d-printing-filament-1kg',
        'https://store.creality.com/products/hyper-series-pla-rfid-filament-1kg',
        'https://store.creality.com/products/hyper-series-pla-rfid-stardust-filament-1kg',
        'https://store.creality.com/products/hyper-rainbow-pla-1kg-dual-color-3d-printing-filament',
        'https://store.creality.com/products/hyper-series-petg-3d-printing-filament-1kg',
        'https://store.creality.com/products/hyper-series-abs-3d-printing-filament-1kg',
        'https://store.creality.com/products/ender-fast-pla-3d-printing-filament-1-75mm-1kg',
        'https://store.creality.com/products/cr-silk-pla-1kg-gold',
        'https://store.creality.com/products/hp-tpu-95a-3d-printing-filament-500g',
        'https://store.creality.com/products/hp-asa-3d-printing-filament-1kg',
      ];
      knownUrls.forEach(url => discoveredUrls.add(url));
      stats.discovered = discoveredUrls.size;
    }

    // =========================================================================
    // STEP 3: Scrape Individual Product Pages
    // =========================================================================
    console.log('[Step 3] Scraping product pages...');
    
    const discoveredProducts: ProductData[] = [];
    let scrapeCount = 0;
    const filterStats = createFilterStats();
    
    for (const productUrl of discoveredUrls) {
      if (scrapeCount >= limit) break;
      
      try {
        // Extract handle from URL
        const handleMatch = productUrl.match(/\/products\/([^/?#]+)/);
        if (!handleMatch) continue;
        const handle = handleMatch[1];
        
        if (!firecrawlKey) {
          // Without Firecrawl, create basic product entry
          const baseProductId = handle;
          if (skipExisting && existingProductIds.has(baseProductId)) {
            stats.skipped++;
            continue;
          }
          
          discoveredProducts.push({
            productId: baseProductId,
            title: handle.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase()),
            handle,
            price: null,
            compareAtPrice: null,
            imageUrl: null,
            productUrl,
            colorName: null,
            available: true,
          });
          scrapeCount++;
          continue;
        }
        
        // Rate limiting
        await new Promise(resolve => setTimeout(resolve, 1500));
        
        // Scrape product page
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
        
        if (!scrapeData.success) {
          console.error(`[Step 3] Scrape failed for ${productUrl}:`, scrapeData.error);
          stats.errors++;
          stats.errorDetails.push(`Scrape failed: ${productUrl}`);
          continue;
        }

        const markdown = scrapeData.data?.markdown || '';
        const html = scrapeData.data?.html || '';
        
        // Extract title
        let title = '';
        const titleMatch = markdown.match(/^#\s+(.+?)(?:\n|$)/m) || 
                          html.match(/<h1[^>]*>([^<]+)<\/h1>/i);
        if (titleMatch) {
          title = titleMatch[1].trim();
        } else {
          title = handle.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
        }
        
        // Extract price
        let price: number | null = null;
        let compareAtPrice: number | null = null;
        const priceMatch = markdown.match(/\$(\d+(?:\.\d{2})?)/);
        if (priceMatch) {
          price = parseFloat(priceMatch[1]);
        }
        const compareMatch = markdown.match(/~~\$(\d+(?:\.\d{2})?)~~/);
        if (compareMatch) {
          compareAtPrice = parseFloat(compareMatch[1]);
        }
        
        // Extract image
        let imageUrl: string | null = null;
        const imgMatch = html.match(/property="og:image"\s+content="([^"]+)"/i) ||
                        html.match(/<img[^>]+src="(https:\/\/cdn\.shopify\.com[^"]+)"/i);
        if (imgMatch) {
          imageUrl = imgMatch[1];
        }
        
        // Extract color variants from swatch selectors
        const colorVariants: string[] = [];
        const swatchMatches = html.matchAll(/data-value="([^"]+)"[^>]*class="[^"]*swatch[^"]*"/gi);
        for (const match of swatchMatches) {
          const color = match[1].trim();
          if (color && !colorVariants.includes(color)) {
            colorVariants.push(color);
          }
        }
        
        // Alternative: extract from variant dropdown or text
        if (colorVariants.length === 0) {
          const colorSection = markdown.match(/Color[:\s]+([^\n]+)/i);
          if (colorSection) {
            const colors = colorSection[1].split(/[,|\/]/).map((c: string) => c.trim()).filter((c: string) => c.length > 0);
            colorVariants.push(...colors);
          }
        }
        
        // If no color variants found, check title for color
        if (colorVariants.length === 0) {
          const titleColorMatch = title.match(/\b(black|white|grey|gray|red|blue|green|yellow|orange|purple|pink|gold|silver|rainbow)\b/i);
          if (titleColorMatch) {
            colorVariants.push(titleColorMatch[1]);
          } else {
            colorVariants.push(''); // No color - single variant
          }
        }
        
        // Create variant-exploded rows
        for (const colorName of colorVariants) {
          const colorSlug = colorName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '');
          const productId = colorSlug ? `${handle}__${colorSlug}` : handle;
          
          if (skipExisting && existingProductIds.has(productId)) {
            stats.skipped++;
            continue;
          }
          
          // Extract weight for filtering
          const weight = extractWeightFromText(title) || 1000;
          const is285 = is285mmDiameter(title);
          
          // Apply standard filtering (samples, bulk, 2.85mm)
          const filterResult = shouldIncludeVariant(weight, is285 ? 2.85 : 1.75);
          updateFilterStats(filterStats, filterResult);
          if (!filterResult.include) {
            console.log(`[Creality] Skipping: ${title} - ${colorName} (${filterResult.reason})`);
            continue;
          }
          
          discoveredProducts.push({
            productId,
            title: colorName ? `${title} - ${colorName}` : title,
            handle,
            price,
            compareAtPrice,
            imageUrl,
            productUrl,
            colorName: colorName || null,
            available: true,
          });
        }
        
        scrapeCount++;
        stats.scraped++;
        console.log(`[Step 3] Scraped ${scrapeCount}/${Math.min(discoveredUrls.size, limit)}: ${title} (${colorVariants.length} variants)`);
        
      } catch (scrapeError) {
        console.error(`[Step 3] Error scraping ${productUrl}:`, scrapeError);
        stats.errors++;
        stats.errorDetails.push(`Error: ${productUrl}`);
      }
    }
    
    logFilterStats('Creality', filterStats);
    console.log(`[Step 3] Scraped ${stats.scraped} products, ${discoveredProducts.length} variants`);

    // =========================================================================
    // STEP 4: Apply Brand-Specific Enrichments
    // =========================================================================
    console.log('[Step 4] Applying brand-specific enrichments...');
    
    for (const product of discoveredProducts) {
      try {
        // Enrich product
        const enrichment = enrichCrealityProduct(product.title, product.colorName);
        
        // Get color hex
        const colorHex = product.colorName ? getCrealityColorHex(product.colorName) : enrichment.colorHex;
        
        // Build filament data
        const filamentData = {
          product_id: product.productId,
          product_title: product.title,
          product_handle: product.handle,
          vendor: CREALITY_STORE_INFO.vendor,
          brand_id: brandId,
          product_url: product.productUrl,
          featured_image: product.imageUrl,
          variant_price: product.price,
          variant_compare_at_price: product.compareAtPrice,
          variant_available: product.available,
          material: enrichment.material,
          finish_type: enrichment.finishType,
          product_line_id: enrichment.productLineId,
          tds_url: enrichment.tdsUrl,
          color_hex: colorHex,
          color_family: product.colorName,
          diameter_nominal_mm: enrichment.diameterMm,
          net_weight_g: enrichment.spoolWeightGrams,
          high_speed_capable: enrichment.highSpeedCapable,
          is_nozzle_abrasive: enrichment.isAbrasive,
          nozzle_temp_min_c: enrichment.printSettings?.nozzleTempMin,
          nozzle_temp_max_c: enrichment.printSettings?.nozzleTempMax,
          bed_temp_min_c: enrichment.printSettings?.bedTempMin,
          bed_temp_max_c: enrichment.printSettings?.bedTempMax,
          print_speed_max_mms: enrichment.printSettings?.printSpeedMax,
          auto_created: true,
          auto_updated: true,
          last_scraped_at: new Date().toISOString(),
          sync_status: 'synced',
        };
        
        // Upsert
        const { error: upsertError } = await supabase
          .from('filaments')
          .upsert(filamentData, { onConflict: 'product_id' });
        
        if (upsertError) {
          console.error(`[Step 4] Upsert error for ${product.productId}:`, upsertError);
          stats.errors++;
          stats.errorDetails.push(`Upsert error: ${product.productId}`);
        } else {
          if (existingProductIds.has(product.productId)) {
            stats.updated++;
          } else {
            stats.created++;
          }
        }
        
      } catch (enrichError) {
        console.error(`[Step 4] Enrichment error for ${product.productId}:`, enrichError);
        stats.errors++;
      }
    }
    
    console.log(`[Step 4] Created: ${stats.created}, Updated: ${stats.updated}`);

    // =========================================================================
    // STEP 5: Finalize
    // =========================================================================
    console.log('[Step 5] Finalizing sync...');
    
    // Update automated_brands
    await supabase.rpc('update_brand_product_counts', { p_brand_slug: 'creality' });
    await supabase.rpc('update_brand_enrichment_counts', { p_brand_slug: 'creality' });
    
    // Fix duplicate hex codes
    try {
      await supabase.rpc('find_duplicate_hexes', { p_vendor: 'Creality' });
    } catch (e) {
      console.log('[Step 5] Duplicate hex check completed');
    }
    
    // Update scraping status
    await supabase
      .from('automated_brands')
      .update({
        scraping_active: false,
        last_scrape_at: new Date().toISOString(),
      })
      .eq('brand_slug', 'creality');

    const duration = ((Date.now() - startTime) / 1000).toFixed(1);
    console.log(`[Creality Sync] Complete in ${duration}s`);

    return new Response(
      JSON.stringify({
        success: true,
        duration: `${duration}s`,
        stats,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('[Creality Sync] Fatal error:', error);
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
