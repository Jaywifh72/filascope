/**
 * Creality Filament Sync Pipeline
 * 
 * CSV-seeded sync for store.creality.com (Shopify platform)
 * 122 color variants across 18 product lines
 * 
 * Architecture:
 * 1. Optional clean slate (delete existing products)
 * 2. Iterate through CREALITY_PRODUCT_SEED
 * 3. Fetch live prices from Shopify API
 * 4. Apply brand-specific enrichments
 * 5. Insert to database with proper product_line_id
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import {
  CREALITY_PRODUCT_SEED,
  enrichCrealityProduct,
  getCrealityColorHex,
  CREALITY_STORE_INFO,
  getUniqueBaseProductUrls,
  getCrealityDefaultPrice,
} from '../_shared/creality-defaults.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface SyncStats {
  seedProducts: number;
  created: number;
  updated: number;
  skipped: number;
  errors: number;
  errorDetails: string[];
  pricesFetched: number;
}

interface ShopifyProductData {
  priceMap: Map<string, number>;
  titleMap: Map<string, string>;
}

/**
 * Fetch H1 titles from product pages via Firecrawl
 * (Shopify JSON API is blocked on Creality's store)
 */
async function fetchPageTitles(urls: string[]): Promise<Map<string, string>> {
  const titleMap = new Map<string, string>();
  const firecrawlApiKey = Deno.env.get('FIRECRAWL_API_KEY');
  
  if (!firecrawlApiKey) {
    console.log('[Creality] FIRECRAWL_API_KEY not available, skipping H1 scraping');
    return titleMap;
  }
  
  console.log(`[Creality] Fetching H1 titles for ${urls.length} URLs via Firecrawl...`);
  
  // Process in batches of 5 to avoid rate limiting
  const batchSize = 5;
  for (let i = 0; i < urls.length; i += batchSize) {
    const batch = urls.slice(i, i + batchSize);
    
    await Promise.all(batch.map(async (url) => {
      try {
        const response = await fetch('https://api.firecrawl.dev/v1/scrape', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${firecrawlApiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            url,
            formats: ['html'],
            onlyMainContent: false,
            waitFor: 1500,
          }),
        });
        
        const data = await response.json();
        const html = data.data?.html || '';
        
        // Extract H1 title
        const h1Match = html.match(/<h1[^>]*>([^<]+)<\/h1>/i);
        if (h1Match?.[1]) {
          const title = h1Match[1].trim();
          titleMap.set(url, title);
          console.log(`[Creality] H1 for ${url.split('/').pop()}: "${title}"`);
        }
      } catch (error) {
        console.error(`[Creality] Error fetching H1 for ${url}:`, error);
      }
    }));
    
    // Rate limiting between batches
    if (i + batchSize < urls.length) {
      await new Promise(resolve => setTimeout(resolve, 500));
    }
  }
  
  console.log(`[Creality] Fetched ${titleMap.size}/${urls.length} H1 titles via Firecrawl`);
  return titleMap;
}

/**
 * Fetch product data from Shopify API for price enrichment
 * Note: Creality blocks JSON API, so this returns empty maps
 * Prices fall back to CREALITY_DEFAULT_PRICES
 */
async function fetchShopifyProductData(baseUrls: string[]): Promise<ShopifyProductData> {
  const priceMap = new Map<string, number>();
  const titleMap = new Map<string, string>();
  
  // Try Shopify JSON API first (usually blocked by Creality)
  console.log(`[Creality] Attempting Shopify JSON API for ${baseUrls.length} URLs...`);
  
  const batchSize = 5;
  let successCount = 0;
  
  for (let i = 0; i < Math.min(baseUrls.length, 3); i++) {
    // Only try first 3 URLs to detect if API is blocked
    const url = baseUrls[i];
    try {
      const jsonUrl = `${url}.json`;
      const response = await fetch(jsonUrl, {
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'Mozilla/5.0 (compatible; FilamentDB/1.0)',
        },
      });
      
      if (response.ok) {
        successCount++;
        const data = await response.json();
        const product = data.product;
        
        if (product) {
          titleMap.set(url, product.title);
          
          if (product.variants) {
            for (const variant of product.variants) {
              const colorName = variant.option1 || variant.title;
              if (colorName && variant.price) {
                const key = `${url}|${colorName.toLowerCase()}`;
                priceMap.set(key, parseFloat(variant.price));
              }
            }
          }
        }
      }
    } catch (error) {
      // Expected - Creality blocks JSON API
    }
  }
  
  if (successCount === 0) {
    console.log(`[Creality] Shopify JSON API blocked, using default prices`);
  } else {
    console.log(`[Creality] Shopify JSON API working for ${successCount}/3 test URLs`);
  }
  
  console.log(`[Creality] Fetched prices for ${priceMap.size} variants, ${titleMap.size} product titles from JSON API`);
  return { priceMap, titleMap };
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const startTime = Date.now();
  const stats: SyncStats = {
    seedProducts: CREALITY_PRODUCT_SEED.length,
    created: 0,
    updated: 0,
    skipped: 0,
    errors: 0,
    errorDetails: [],
    pricesFetched: 0,
  };

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Parse request options
    const body = await req.json().catch(() => ({}));
    const cleanSlate = body.cleanSlate === true;
    const limit = body.limit || 150; // Default high enough for full catalog

    console.log(`[Creality Sync] Starting CSV-seeded sync - cleanSlate: ${cleanSlate}, limit: ${limit}, seed: ${CREALITY_PRODUCT_SEED.length} products`);

    // Get brand info
    const { data: brand } = await supabase
      .from('automated_brands')
      .select('id, brand_name')
      .eq('brand_slug', 'creality')
      .single();

    const brandId = brand?.id || null;

    // =========================================================================
    // STEP 1: Fetch Shopify Product Data for Prices
    // =========================================================================
    console.log('[Step 1] Fetching product data...');
    
    const baseUrls = getUniqueBaseProductUrls();
    console.log(`[Step 1] Found ${baseUrls.length} unique product URLs to fetch`);
    
    // Try Shopify JSON API (usually blocked)
    const { priceMap, titleMap: shopifyTitleMap } = await fetchShopifyProductData(baseUrls);
    stats.pricesFetched = priceMap.size;
    
    // Fetch H1 titles via Firecrawl (more reliable for Creality)
    const firecrawlTitleMap = await fetchPageTitles(baseUrls);
    
    // Merge title maps (Firecrawl takes priority as it's the actual H1)
    const titleMap = new Map<string, string>();
    for (const [url, title] of shopifyTitleMap) {
      titleMap.set(url, title);
    }
    for (const [url, title] of firecrawlTitleMap) {
      titleMap.set(url, title); // Firecrawl overwrites Shopify
    }
    
    console.log(`[Step 1] Total titles: ${titleMap.size} (${firecrawlTitleMap.size} from Firecrawl)`);

    // =========================================================================
    // STEP 2: Optional Clean Slate
    // =========================================================================
    if (cleanSlate) {
      console.log('[Step 2] Clean slate - deleting existing Creality products...');
      const { error: deleteError } = await supabase
        .from('filaments')
        .delete()
        .ilike('vendor', 'creality');
      
      if (deleteError) {
        console.error('[Step 2] Delete error:', deleteError);
      } else {
        console.log(`[Step 2] Deleted existing Creality products`);
      }
    }

    // Get existing product IDs for skip/update logic
    const existingProductIds = new Set<string>();
    const { data: existing } = await supabase
      .from('filaments')
      .select('product_id')
      .ilike('vendor', 'creality');
    
    existing?.forEach(p => {
      if (p.product_id) existingProductIds.add(p.product_id);
    });
    console.log(`[Step 2] Found ${existingProductIds.size} existing products`);

    // =========================================================================
    // STEP 3: Process Seed Products
    // =========================================================================
    console.log('[Step 3] Processing seed products...');
    
    const productsToInsert: any[] = [];
    let processedCount = 0;
    
    for (const seedItem of CREALITY_PRODUCT_SEED) {
      if (processedCount >= limit) break;
      
      try {
        // Enrich product
        const enrichment = enrichCrealityProduct(
          seedItem.filamentLine,
          seedItem.color,
          seedItem.material
        );
        
        // Generate product ID
        const colorSlug = seedItem.color.toLowerCase()
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/-+/g, '-')
          .replace(/^-|-$/g, '');
        const lineSlug = seedItem.filamentLine.toLowerCase()
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/-+/g, '-')
          .replace(/^-|-$/g, '');
        const productId = `creality__${lineSlug}__${colorSlug}`;
        
        // Get color hex
        const colorHex = getCrealityColorHex(seedItem.color) || enrichment.colorHex;
        
        // Get price from Shopify data, fallback to default price
        const baseUrl = seedItem.productUrl.split('?')[0];
        const priceKey = `${baseUrl}|${seedItem.color.toLowerCase()}`;
        const shopifyPrice = priceMap.get(priceKey);
        const defaultPrice = getCrealityDefaultPrice(enrichment.productLineId);
        const price = shopifyPrice || defaultPrice || null;
        
        // Get product title from Shopify data or use filament line
        const shopifyTitle = titleMap.get(baseUrl);
        const productTitle = shopifyTitle || seedItem.filamentLine;
        
        // Build filament data
        const filamentData = {
          product_id: productId,
          product_title: productTitle,
          product_handle: lineSlug,
          vendor: CREALITY_STORE_INFO.vendor,
          brand_id: brandId,
          product_url: seedItem.productUrl,
          featured_image: seedItem.imageUrl,
          variant_price: price,
          variant_available: true,
          material: enrichment.material,
          finish_type: enrichment.finishType,
          product_line_id: enrichment.productLineId,
          tds_url: enrichment.tdsUrl,
          color_hex: colorHex,
          color_family: seedItem.color,
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
        
        productsToInsert.push(filamentData);
        
        if (existingProductIds.has(productId)) {
          stats.updated++;
        } else {
          stats.created++;
        }
        
        processedCount++;
        
      } catch (error) {
        console.error(`[Step 3] Error processing ${seedItem.filamentLine} - ${seedItem.color}:`, error);
        stats.errors++;
        stats.errorDetails.push(`${seedItem.filamentLine} - ${seedItem.color}: ${error}`);
      }
    }
    
    console.log(`[Step 3] Prepared ${productsToInsert.length} products for insertion`);

    // =========================================================================
    // STEP 4: Insert Products in Batches
    // =========================================================================
    console.log('[Step 4] Inserting products to database...');
    
    const batchSize = 50;
    for (let i = 0; i < productsToInsert.length; i += batchSize) {
      const batch = productsToInsert.slice(i, i + batchSize);
      
      // Use delete-then-insert pattern since table lacks unique constraint on product_id alone
      // The vendor+product_id combination is unique but there's no DB constraint for upsert
      const productIds = batch.map(p => p.product_id);
      
      // Delete existing products with these IDs for this vendor
      const { error: deleteError } = await supabase
        .from('filaments')
        .delete()
        .eq('vendor', 'Creality')
        .in('product_id', productIds);
      
      if (deleteError) {
        console.error(`[Step 4] Batch ${i / batchSize + 1} delete error:`, deleteError);
      }
      
      // Insert fresh
      const { error: insertError } = await supabase
        .from('filaments')
        .insert(batch);
      
      if (insertError) {
        console.error(`[Step 4] Batch ${i / batchSize + 1} insert error:`, insertError);
        stats.errors += batch.length;
        stats.errorDetails.push(`Batch ${i / batchSize + 1}: ${insertError.message}`);
      } else {
        console.log(`[Step 4] Inserted batch ${i / batchSize + 1}/${Math.ceil(productsToInsert.length / batchSize)}`);
      }
    }

    // =========================================================================
    // STEP 5: Update Brand Stats and Fix Duplicates
    // =========================================================================
    console.log('[Step 5] Updating brand stats...');
    
    // Update automated_brands
    await supabase
      .from('automated_brands')
      .update({
        last_scrape_at: new Date().toISOString(),
        scraping_active: false,
        products_created: stats.created,
        products_updated: stats.updated,
      })
      .eq('brand_slug', 'creality');
    
    // Update product counts
    try {
      await supabase.rpc('update_brand_product_counts', { p_brand_slug: 'creality' });
    } catch (e) {
      console.log('[Step 5] Product count RPC not available');
    }
    
    // Fix duplicate hex codes within product lines
    console.log('[Step 5] Fixing duplicate hex codes...');
    const { data: crealityProducts } = await supabase
      .from('filaments')
      .select('id, product_line_id, color_hex, color_family')
      .ilike('vendor', 'creality')
      .not('color_hex', 'is', null);
    
    if (crealityProducts) {
      // Group by product_line_id
      const lineGroups: Record<string, typeof crealityProducts> = {};
      for (const p of crealityProducts) {
        const lineId = p.product_line_id || 'unknown';
        if (!lineGroups[lineId]) lineGroups[lineId] = [];
        lineGroups[lineId].push(p);
      }
      
      // Find and fix duplicates within each group
      for (const [lineId, products] of Object.entries(lineGroups)) {
        const hexCounts: Record<string, any[]> = {};
        for (const p of products) {
          const hex = p.color_hex?.toUpperCase() || '';
          if (!hexCounts[hex]) hexCounts[hex] = [];
          hexCounts[hex].push(p);
        }
        
        // Adjust duplicates
        for (const [hex, dupes] of Object.entries(hexCounts)) {
          if (dupes.length > 1) {
            console.log(`[Step 5] Found ${dupes.length} duplicate ${hex} in ${lineId}`);
            for (let i = 1; i < dupes.length; i++) {
              // Slightly adjust the hex by adding to blue channel
              const baseHex = hex.replace('#', '');
              const r = parseInt(baseHex.slice(0, 2), 16);
              const g = parseInt(baseHex.slice(2, 4), 16);
              const b = Math.min(255, parseInt(baseHex.slice(4, 6), 16) + i);
              const newHex = `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`.toUpperCase();
              
              await supabase
                .from('filaments')
                .update({ color_hex: newHex })
                .eq('id', dupes[i].id);
            }
          }
        }
      }
    }

    const duration = ((Date.now() - startTime) / 1000).toFixed(1);
    console.log(`[Creality Sync] Complete in ${duration}s - Created: ${stats.created}, Updated: ${stats.updated}, Errors: ${stats.errors}`);

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
