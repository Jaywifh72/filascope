import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import {
  enrichAzureFilmProduct,
  isAzureFilmNonFilament,
  cleanAzureFilmTitle,
  getAzureFilmColorHex,
  extractAzureFilmWeight,
  isAzureFilmRefill,
  AZUREFILM_STORE_INFO,
} from '../_shared/azurefilm-defaults.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface SyncResult {
  success: boolean;
  productsDiscovered: number;
  productsCreated: number;
  productsUpdated: number;
  productsFailed: number;
  productsSkipped: number;
  duplicatesFixed: number;
  errors: string[];
  duration: number;
}

interface ScrapedProduct {
  url: string;
  title: string;
  price: number | null;
  compareAtPrice: number | null;
  imageUrl: string | null;
  colors: string[];
  weights: number[];
  isRefill: boolean;
}

// ============================================================================
// STEP 1: DISCOVER PRODUCT URLS
// ============================================================================

async function discoverProductUrls(firecrawlKey: string): Promise<string[]> {
  console.log('Step 1: Discovering product URLs via Firecrawl map...');
  
  const response = await fetch('https://api.firecrawl.dev/v1/map', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${firecrawlKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      url: AZUREFILM_STORE_INFO.productsUrl,
      limit: 500,
      includeSubdomains: false,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Firecrawl map failed: ${error}`);
  }

  const data = await response.json();
  const allUrls: string[] = data.links || [];
  
  // Filter for product URLs only
  const productUrls = allUrls.filter((url: string) => {
    // AzureFilm product URLs typically contain /product/
    return url.includes('/product/') && 
           !url.includes('/cart') && 
           !url.includes('/checkout') &&
           !url.includes('/account') &&
           !url.includes('/page/');
  });
  
  // Deduplicate
  const uniqueUrls = [...new Set(productUrls)];
  
  console.log(`Discovered ${uniqueUrls.length} product URLs from ${allUrls.length} total links`);
  return uniqueUrls;
}

// ============================================================================
// STEP 2: SCRAPE INDIVIDUAL PRODUCT PAGES
// ============================================================================

async function scrapeProductPage(url: string, firecrawlKey: string): Promise<ScrapedProduct | null> {
  try {
    const response = await fetch('https://api.firecrawl.dev/v1/scrape', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${firecrawlKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        url,
        formats: ['markdown', 'html'],
        waitFor: AZUREFILM_STORE_INFO.firecrawlWaitTime,
        onlyMainContent: true,
      }),
    });

    if (!response.ok) {
      console.error(`Failed to scrape ${url}: ${response.status}`);
      return null;
    }

    const data = await response.json();
    const markdown = data.data?.markdown || data.markdown || '';
    const html = data.data?.html || data.html || '';

    // Extract title
    const titleMatch = markdown.match(/^#\s*(.+?)(?:\n|$)/m) || 
                       html.match(/<h1[^>]*>([^<]+)<\/h1>/i);
    const title = titleMatch ? titleMatch[1].trim() : '';
    
    if (!title || isAzureFilmNonFilament(title)) {
      console.log(`Skipping non-filament: ${title || url}`);
      return null;
    }

    // Extract price (EUR)
    const priceMatch = markdown.match(/€\s*(\d+[.,]\d{2})/i) ||
                       html.match(/class="[^"]*price[^"]*"[^>]*>.*?€\s*(\d+[.,]\d{2})/i);
    const price = priceMatch ? parseFloat(priceMatch[1].replace(',', '.')) : null;

    // Extract compare-at price (strikethrough price)
    const compareMatch = markdown.match(/~~€\s*(\d+[.,]\d{2})~~/i) ||
                         html.match(/<del[^>]*>.*?€\s*(\d+[.,]\d{2})/i);
    const compareAtPrice = compareMatch ? parseFloat(compareMatch[1].replace(',', '.')) : null;

    // Extract image
    const imageMatch = html.match(/class="[^"]*product[^"]*image[^"]*"[^>]*src="([^"]+)"/i) ||
                       html.match(/<img[^>]+src="([^"]+)"[^>]*alt="[^"]*(?:pla|petg|abs|tpu|filament)/i) ||
                       markdown.match(/!\[.*?\]\(([^)]+azurefilm[^)]+\.(?:jpg|png|webp))/i);
    const imageUrl = imageMatch ? imageMatch[1] : null;

    // Extract colors from variant options or title
    const colors: string[] = [];
    
    // Look for color options in WooCommerce structure
    const colorOptionMatch = html.match(/data-attribute_pa_color[^>]*>([^<]+)</gi) ||
                             html.match(/class="[^"]*color[^"]*"[^>]*>([^<]+)</gi);
    if (colorOptionMatch) {
      colorOptionMatch.forEach((match: string) => {
        const colorText = match.replace(/<[^>]+>/g, '').trim();
        if (colorText && colorText.length > 1) {
          colors.push(colorText);
        }
      });
    }
    
    // Extract color from title if no variants found
    if (colors.length === 0) {
      const titleColor = extractColorFromTitle(title);
      if (titleColor) colors.push(titleColor);
    }
    
    // Default to single color if none found
    if (colors.length === 0) {
      colors.push('Default');
    }

    // Extract weights
    const weights: number[] = [];
    const weightMatches = markdown.matchAll(/(\d+)\s*g(?:ram)?s?\b/gi);
    for (const match of weightMatches) {
      const weight = parseInt(match[1]);
      if ([250, 500, 750, 1000, 2000, 3000].includes(weight)) {
        weights.push(weight);
      }
    }
    
    // Default to 1000g if no weight found
    if (weights.length === 0) {
      weights.push(1000);
    }

    const isRefill = isAzureFilmRefill(title);

    return {
      url,
      title,
      price,
      compareAtPrice,
      imageUrl,
      colors: [...new Set(colors)],
      weights: [...new Set(weights)],
      isRefill,
    };
  } catch (error) {
    console.error(`Error scraping ${url}:`, error);
    return null;
  }
}

function extractColorFromTitle(title: string): string | null {
  // Common color words to look for
  const colorWords = [
    'black', 'white', 'red', 'blue', 'green', 'yellow', 'orange', 'purple', 
    'pink', 'grey', 'gray', 'brown', 'gold', 'silver', 'bronze', 'copper',
    'natural', 'transparent', 'clear', 'neon', 'pastel', 'skin',
    'rainbow', 'galaxy', 'sunset', 'cherry', 'walnut', 'oak', 'olive'
  ];
  
  const lowerTitle = title.toLowerCase();
  
  for (const color of colorWords) {
    if (lowerTitle.includes(color)) {
      // Try to get the full color description
      const regex = new RegExp(`(\\w+\\s+)?${color}(\\s+\\w+)?`, 'i');
      const match = lowerTitle.match(regex);
      if (match) {
        return match[0].trim();
      }
    }
  }
  
  return null;
}

// ============================================================================
// STEP 3: GENERATE PRODUCT ID
// ============================================================================

function generateProductId(url: string, color: string, weight: number): string {
  // Extract slug from URL
  const urlMatch = url.match(/\/product\/([^\/]+)/);
  const slug = urlMatch ? urlMatch[1] : url.split('/').pop() || 'unknown';
  
  const colorSlug = color.toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .substring(0, 30);
  
  return `azurefilm_${slug}_${colorSlug}_${weight}g`;
}

// ============================================================================
// MAIN SYNC FUNCTION
// ============================================================================

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const startTime = Date.now();
  const result: SyncResult = {
    success: false,
    productsDiscovered: 0,
    productsCreated: 0,
    productsUpdated: 0,
    productsFailed: 0,
    productsSkipped: 0,
    duplicatesFixed: 0,
    errors: [],
    duration: 0,
  };

  try {
    // Parse request options
    const body = await req.json().catch(() => ({}));
    const cleanSlate = body.cleanSlate === true;
    const limit = body.limit || 500;

    console.log(`Starting AzureFilm sync (cleanSlate: ${cleanSlate}, limit: ${limit})`);

    // Initialize clients
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const firecrawlKey = Deno.env.get('FIRECRAWL_API_KEY');

    if (!firecrawlKey) {
      throw new Error('FIRECRAWL_API_KEY not configured');
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get brand ID
    const { data: brand } = await supabase
      .from('automated_brands')
      .select('id')
      .eq('brand_slug', 'azurefilm')
      .single();

    const brandId = brand?.id || null;

    // ========================================================================
    // STEP 1: OPTIONAL CLEAN SLATE
    // ========================================================================
    
    if (cleanSlate) {
      console.log('Performing clean slate deletion...');
      const { error: deleteError } = await supabase
        .from('filaments')
        .delete()
        .ilike('vendor', 'azurefilm');

      if (deleteError) {
        console.error('Clean slate deletion failed:', deleteError);
      } else {
        console.log('Deleted existing AzureFilm products');
      }
    }

    // ========================================================================
    // STEP 2: DISCOVER PRODUCT URLS
    // ========================================================================
    
    const productUrls = await discoverProductUrls(firecrawlKey);
    result.productsDiscovered = productUrls.length;

    if (productUrls.length === 0) {
      throw new Error('No product URLs discovered');
    }

    // ========================================================================
    // STEP 3: SCRAPE AND PROCESS PRODUCTS
    // ========================================================================
    
    const productsToUpsert: any[] = [];
    const limitedUrls = productUrls.slice(0, limit);

    console.log(`Scraping ${limitedUrls.length} product pages...`);

    for (let i = 0; i < limitedUrls.length; i++) {
      const url = limitedUrls[i];
      
      // Rate limiting
      if (i > 0) {
        await new Promise(resolve => setTimeout(resolve, 2000));
      }

      console.log(`[${i + 1}/${limitedUrls.length}] Scraping: ${url}`);
      
      const product = await scrapeProductPage(url, firecrawlKey);
      
      if (!product) {
        result.productsSkipped++;
        continue;
      }

      // Create variant-exploded rows
      for (const color of product.colors) {
        for (const weight of product.weights) {
          const enrichment = enrichAzureFilmProduct(product.title, color);
          
          if (enrichment.isNonFilament) {
            result.productsSkipped++;
            continue;
          }

          const productId = generateProductId(product.url, color, weight);
          
          productsToUpsert.push({
            product_id: productId,
            product_title: product.title,
            vendor: AZUREFILM_STORE_INFO.vendor,
            brand_id: brandId,
            product_url: product.url,
            featured_image: product.imageUrl,
            variant_price: product.price,
            variant_compare_at_price: product.compareAtPrice,
            variant_available: true,
            material: enrichment.material,
            finish_type: enrichment.finishType,
            product_line_id: enrichment.productLineId,
            color_hex: enrichment.colorHex || getAzureFilmColorHex(color),
            nozzle_temp_min_c: enrichment.nozzleTempMin,
            nozzle_temp_max_c: enrichment.nozzleTempMax,
            bed_temp_min_c: enrichment.bedTempMin,
            bed_temp_max_c: enrichment.bedTempMax,
            tds_url: enrichment.tdsUrl,
            net_weight_g: weight,
            diameter_nominal_mm: enrichment.diameterNominalMm,
            is_nozzle_abrasive: enrichment.isAbrasive,
            high_speed_capable: enrichment.highSpeedCapable,
            auto_created: true,
            auto_updated: true,
            last_scraped_at: new Date().toISOString(),
            sync_status: 'synced',
          });
        }
      }
    }

    // ========================================================================
    // STEP 4: UPSERT TO DATABASE
    // ========================================================================
    
    console.log(`Upserting ${productsToUpsert.length} products...`);

    const batchSize = 50;
    for (let i = 0; i < productsToUpsert.length; i += batchSize) {
      const batch = productsToUpsert.slice(i, i + batchSize);
      
      const { error: upsertError, data: upsertData } = await supabase
        .from('filaments')
        .upsert(batch, {
          onConflict: 'product_id',
          ignoreDuplicates: false,
        })
        .select('id');

      if (upsertError) {
        console.error(`Batch upsert error:`, upsertError);
        result.productsFailed += batch.length;
        result.errors.push(`Batch ${i / batchSize + 1}: ${upsertError.message}`);
      } else {
        // Count creates vs updates (simplified - count as created if we got data back)
        result.productsCreated += upsertData?.length || 0;
      }
    }

    // Adjust counts
    result.productsUpdated = productsToUpsert.length - result.productsCreated - result.productsFailed;
    if (result.productsUpdated < 0) result.productsUpdated = 0;

    // ========================================================================
    // STEP 5: UPDATE BRAND STATS AND FIX DUPLICATES
    // ========================================================================
    
    console.log('Updating brand statistics...');

    // Update brand product counts
    await supabase.rpc('update_brand_product_counts', { p_brand_slug: 'azurefilm' });
    await supabase.rpc('update_brand_enrichment_counts', { p_brand_slug: 'azurefilm' });

    // Fix duplicate hex codes
    const { data: duplicates } = await supabase.rpc('find_duplicate_hexes', {
      p_vendor: 'AzureFilm',
    });

    if (duplicates && duplicates.length > 0) {
      console.log(`Found ${duplicates.length} duplicate hex entries to review`);
      result.duplicatesFixed = duplicates.length;
    }

    // Update automated_brands
    await supabase
      .from('automated_brands')
      .update({
        last_scrape_at: new Date().toISOString(),
        scraping_active: false,
      })
      .eq('brand_slug', 'azurefilm');

    result.success = true;
    result.duration = Date.now() - startTime;

    console.log('=== SYNC COMPLETE ===');
    console.log(`Duration: ${result.duration}ms`);
    console.log(`Discovered: ${result.productsDiscovered}`);
    console.log(`Created: ${result.productsCreated}`);
    console.log(`Updated: ${result.productsUpdated}`);
    console.log(`Skipped: ${result.productsSkipped}`);
    console.log(`Failed: ${result.productsFailed}`);

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Sync failed:', error);
    result.errors.push(error instanceof Error ? error.message : 'Unknown error');
    result.duration = Date.now() - startTime;

    return new Response(JSON.stringify(result), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
