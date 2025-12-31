import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { enrichSpectrumProduct } from "../_shared/spectrum-defaults.ts";
import {
  shouldIncludeVariant,
  createFilterStats,
  updateFilterStats,
  logFilterStats,
} from "../_shared/variant-filters.ts";

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

interface ScrapedProduct {
  productId: string;
  title: string;
  price: number | null;
  currency: string;
  featuredImage: string | null;
  productUrl: string;
  color: string | null;
  weight: number;
  diameter: number;
  ralCode: string | null;
}

const SPECTRUM_BASE_URL = 'https://shop.spectrumfilaments.com';
const EUR_TO_USD_RATE = 1.08;

// Category URLs to scrape
const CATEGORY_URLS = [
  '/eng_m_Our-offer_Materials_PLA_Spectrum-2633.html',
  '/eng_m_Our-offer_Materials_PLA_PLA-Premium-2645.html',
  '/eng_m_Our-offer_Materials_PLA_PLA-Pro-2638.html',
  '/eng_m_Our-offer_Materials_PLA_PLA-Matt-2636.html',
  '/eng_m_Our-offer_Materials_PLA_PLA-Silk-2641.html',
  '/eng_m_Our-offer_Materials_PLA_PLA-Glitter-2639.html',
  '/eng_m_Our-offer_Materials_PLA_PLA-Glow-in-the-Dark-2640.html',
  '/eng_m_Our-offer_Materials_PLA_PLA-Carbon-2695.html',
  '/eng_m_Our-offer_Materials_PLA_PLA-Tough-2637.html',
  '/eng_m_Our-offer_Materials_PLA_WOOD-2691.html',
  '/eng_m_Our-offer_Materials_PLA_r-PLA-2699.html',
  '/eng_m_Our-offer_Materials_PETG-2617.html',
  '/eng_m_Our-offer_Materials_PETG_PET-G-Premium-2647.html',
  '/eng_m_Our-offer_Materials_PETG_PET-G-Matt-2648.html',
  '/eng_m_Our-offer_Materials_PETG_PET-G-Carbon-2696.html',
  '/eng_m_Our-offer_Materials_ABS_smart-ABS-2651.html',
  '/eng_m_Our-offer_Materials_ABS_ABS-GP450-2689.html',
  '/eng_m_Our-offer_Materials_ASA_ASA-275-2652.html',
  '/eng_m_Our-offer_Materials_ASA_ASA-Conductive-2697.html',
  '/eng_m_Our-offer_Materials_Flexible_S-Flex-90A-2656.html',
  '/eng_m_Our-offer_Materials_Flexible_S-Flex-85A-2657.html',
  '/eng_m_Our-offer_Materials_Flexible_S-Flex-98A-2658.html',
  '/eng_m_Our-offer_Materials_Engineering_PA6-Low-Warp-2660.html',
  '/eng_m_Our-offer_Materials_Engineering_PA12-CF-2698.html',
  '/eng_m_Our-offer_Materials_HIPS_HIPS-X-2655.html',
  '/eng_m_ReFill-2665.html',
];

async function fetchWithRetry(url: string, options: RequestInit = {}, retries = 3): Promise<Response> {
  for (let i = 0; i < retries; i++) {
    try {
      const response = await fetch(url, {
        ...options,
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; FilaScopeBot/1.0)',
          ...options.headers,
        },
      });
      if (response.ok) return response;
      if (response.status === 429) {
        await new Promise(r => setTimeout(r, 2000 * (i + 1)));
        continue;
      }
      throw new Error(`HTTP ${response.status}`);
    } catch (e) {
      if (i === retries - 1) throw e;
      await new Promise(r => setTimeout(r, 1000 * (i + 1)));
    }
  }
  throw new Error('Max retries reached');
}

async function discoverProductUrls(firecrawlKey: string): Promise<string[]> {
  const allUrls = new Set<string>();
  
  for (const categoryPath of CATEGORY_URLS) {
    console.log(`Discovering products from: ${categoryPath}`);
    
    // Fetch up to 5 pages per category
    for (let page = 1; page <= 5; page++) {
      const pageParam = page > 1 ? `?counter=${page}` : '';
      const categoryUrl = `${SPECTRUM_BASE_URL}${categoryPath}${pageParam}`;
      
      try {
        const response = await fetch('https://api.firecrawl.dev/v1/scrape', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${firecrawlKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            url: categoryUrl,
            formats: ['html'],
            waitFor: 2000,
          }),
        });
        
        if (!response.ok) {
          console.error(`Failed to fetch category page: ${response.status}`);
          break;
        }
        
        const data = await response.json();
        const html = data.data?.html || data.html || '';
        
        // Extract product URLs from HTML
        const productMatches = html.matchAll(/href="(\/product-eng-\d+-[^"]+\.html)"/g);
        let foundCount = 0;
        
        for (const match of productMatches) {
          const productUrl = `${SPECTRUM_BASE_URL}${match[1]}`;
          if (!allUrls.has(productUrl)) {
            allUrls.add(productUrl);
            foundCount++;
          }
        }
        
        console.log(`Page ${page}: Found ${foundCount} new products`);
        
        // If no products found, stop pagination
        if (foundCount === 0 && page > 1) break;
        
        // Rate limit
        await new Promise(r => setTimeout(r, 500));
        
      } catch (e) {
        console.error(`Error fetching category page: ${e}`);
        break;
      }
    }
  }
  
  console.log(`Total unique product URLs discovered: ${allUrls.size}`);
  return Array.from(allUrls);
}

async function scrapeProduct(url: string, firecrawlKey: string): Promise<ScrapedProduct | null> {
  try {
    const response = await fetch('https://api.firecrawl.dev/v1/scrape', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${firecrawlKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        url,
        formats: ['html', 'markdown'],
        waitFor: 2000,
      }),
    });
    
    if (!response.ok) {
      console.error(`Failed to scrape product: ${response.status}`);
      return null;
    }
    
    const data = await response.json();
    const html = data.data?.html || data.html || '';
    const markdown = data.data?.markdown || data.markdown || '';
    const metadata = data.data?.metadata || data.metadata || {};
    
    // Extract product ID from URL
    const idMatch = url.match(/product-eng-(\d+)-/);
    if (!idMatch) return null;
    const productId = idMatch[1];
    
    // Extract title
    let title = metadata.title || '';
    const h1Match = html.match(/<h1[^>]*>([^<]+)<\/h1>/i);
    if (h1Match) title = h1Match[1].trim();
    
    // Extract price (EUR)
    let price: number | null = null;
    const priceMatch = html.match(/class="price[^"]*"[^>]*>[\s\S]*?([\d,]+\.?\d*)\s*€/i) ||
                       html.match(/([\d,]+\.?\d*)\s*€/);
    if (priceMatch) {
      price = parseFloat(priceMatch[1].replace(',', '.'));
    }
    
    // Extract featured image
    let featuredImage: string | null = null;
    const imgMatch = html.match(/class="mainimg"[^>]*src="([^"]+)"/i) ||
                     html.match(/og:image"[^>]*content="([^"]+)"/i);
    if (imgMatch) {
      featuredImage = imgMatch[1].startsWith('http') ? imgMatch[1] : `${SPECTRUM_BASE_URL}${imgMatch[1]}`;
    }
    
    // Extract color from title
    let color: string | null = null;
    // Look for color after the material type
    const colorMatch = title.match(/(?:PLA|PETG|ABS|ASA|TPU|PA|PC|HIPS|PVB|Wood|S-Flex)[^-]*[-–]\s*(.+?)(?:\s*(?:1\.75|2\.85|RAL|\d+g|\d+kg|$))/i);
    if (colorMatch) {
      color = colorMatch[1].trim();
    }
    
    // Extract RAL code
    let ralCode: string | null = null;
    const ralMatch = title.match(/RAL\s*(\d{4})/i);
    if (ralMatch) {
      ralCode = `RAL ${ralMatch[1]}`;
    }
    
    // Extract weight
    let weight = 1000;
    const weightMatch = title.match(/(\d+(?:\.\d+)?)\s*(kg|g)/i);
    if (weightMatch) {
      const value = parseFloat(weightMatch[1]);
      weight = weightMatch[2].toLowerCase() === 'kg' ? value * 1000 : value;
    }
    
    // Extract diameter
    let diameter = 1.75;
    if (/2\.85\s*mm/i.test(title) || (/3\s*mm/i.test(title) && !/1\.75/i.test(title))) {
      diameter = 2.85;
    }
    
    return {
      productId,
      title,
      price,
      currency: 'EUR',
      featuredImage,
      productUrl: url,
      color,
      weight,
      diameter,
      ralCode,
    };
    
  } catch (e) {
    console.error(`Error scraping product ${url}: ${e}`);
    return null;
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }
  
  const startTime = Date.now();
  
  try {
    const { cleanSlate = false, limit = 1200, batchSize = 50 } = await req.json().catch(() => ({}));
    
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const firecrawlKey = Deno.env.get('FIRECRAWL_API_KEY');
    
    if (!firecrawlKey) {
      throw new Error('FIRECRAWL_API_KEY not configured');
    }
    
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    // Get brand info
    const { data: brand } = await supabase
      .from('automated_brands')
      .select('id, brand_name')
      .eq('brand_slug', 'spectrum-filaments')
      .single();
    
    if (!brand) {
      throw new Error('Spectrum Filaments brand not found in automated_brands');
    }
    
    console.log(`Starting Spectrum Filaments sync for brand: ${brand.brand_name}`);
    
    // Mark as scraping
    await supabase
      .from('automated_brands')
      .update({ scraping_active: true, last_error: null })
      .eq('id', brand.id);
    
    const stats: SyncStats = {
      discovered: 0,
      created: 0,
      updated: 0,
      skipped: 0,
      errors: 0,
    };
    
    // Clean slate if requested
    if (cleanSlate) {
      console.log('Clean slate requested - deleting existing Spectrum products');
      const { error: deleteError } = await supabase
        .from('filaments')
        .delete()
        .eq('vendor', 'Spectrum Filaments');
      
      if (deleteError) {
        console.error('Error deleting existing products:', deleteError);
      } else {
        console.log('Deleted existing Spectrum products');
      }
    }
    
    // Step 1: Discover product URLs
    console.log('Step 1: Discovering product URLs...');
    const productUrls = await discoverProductUrls(firecrawlKey);
    stats.discovered = productUrls.length;
    
    if (productUrls.length === 0) {
      throw new Error('No products discovered');
    }
    
    // Limit products if specified
    const urlsToProcess = productUrls.slice(0, limit);
    console.log(`Processing ${urlsToProcess.length} products (limit: ${limit})`);
    
    // Step 2-5: Process in batches
    for (let i = 0; i < urlsToProcess.length; i += batchSize) {
      const batch = urlsToProcess.slice(i, i + batchSize);
      console.log(`Processing batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(urlsToProcess.length / batchSize)}`);
      
      for (const url of batch) {
        try {
          // Step 2: Scrape product
          const scraped = await scrapeProduct(url, firecrawlKey);
          if (!scraped) {
            stats.errors++;
            continue;
          }
          
          // Step 3: Apply enrichments
          const enrichment = enrichSpectrumProduct(
            scraped.title,
            scraped.color,
            null
          );
          
          // Generate unique product_id
          const colorSlug = (scraped.color || 'default')
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/^-|-$/g, '')
            .slice(0, 50);
          const diameterSlug = scraped.diameter === 2.85 ? '285' : '175';
          const weightSlug = scraped.weight >= 1000 ? `${scraped.weight / 1000}kg` : `${scraped.weight}g`;
          const productIdSlug = `spectrum-${scraped.productId}-${colorSlug}-${diameterSlug}-${weightSlug}`;
          
          // Convert EUR to USD
          const priceUsd = scraped.price ? scraped.price * EUR_TO_USD_RATE : null;
          
          // Prepare filament data
          const filamentData = {
            product_id: productIdSlug,
            product_title: enrichment.cleanedTitle || scraped.title,
            vendor: 'Spectrum Filaments',
            brand_id: brand.id,
            material: enrichment.material,
            finish_type: enrichment.finishType,
            product_line_id: enrichment.productLineId,
            color_hex: enrichment.colorHex,
            color_family: scraped.color,
            featured_image: scraped.featuredImage,
            product_url: scraped.productUrl,
            variant_price: priceUsd,
            tds_url: enrichment.tdsUrl,
            nozzle_temp_min_c: enrichment.nozzleTempMin,
            nozzle_temp_max_c: enrichment.nozzleTempMax,
            bed_temp_min_c: enrichment.bedTempMin,
            bed_temp_max_c: enrichment.bedTempMax,
            print_speed_max_mms: enrichment.printSpeedMax,
            is_nozzle_abrasive: enrichment.isAbrasive,
            diameter_nominal_mm: enrichment.diameterMm,
            net_weight_g: enrichment.netWeightG,
            spool_material: enrichment.spoolMaterial,
            auto_created: true,
            auto_updated: true,
            last_scraped_at: new Date().toISOString(),
          };
          
          // Step 4: Upsert to database
          const { data: existing } = await supabase
            .from('filaments')
            .select('id')
            .eq('product_id', productIdSlug)
            .maybeSingle();
          
          if (existing) {
            const { error: updateError } = await supabase
              .from('filaments')
              .update(filamentData)
              .eq('id', existing.id);
            
            if (updateError) {
              console.error(`Error updating ${productIdSlug}:`, updateError);
              stats.errors++;
            } else {
              stats.updated++;
            }
          } else {
            const { error: insertError } = await supabase
              .from('filaments')
              .insert(filamentData);
            
            if (insertError) {
              console.error(`Error inserting ${productIdSlug}:`, insertError);
              stats.errors++;
            } else {
              stats.created++;
            }
          }
          
          // Rate limit between products
          await new Promise(r => setTimeout(r, 300));
          
        } catch (e) {
          console.error(`Error processing ${url}:`, e);
          stats.errors++;
        }
      }
      
      // Log batch progress
      console.log(`Batch complete. Created: ${stats.created}, Updated: ${stats.updated}, Errors: ${stats.errors}`);
    }
    
    // Step 5: Finalize
    console.log('Step 5: Finalizing sync...');
    
    // Update brand product counts
    const { count: productCount } = await supabase
      .from('filaments')
      .select('*', { count: 'exact', head: true })
      .eq('vendor', 'Spectrum Filaments');
    
    await supabase
      .from('automated_brands')
      .update({
        scraping_active: false,
        last_scrape_at: new Date().toISOString(),
        product_count: productCount || 0,
        products_created: stats.created,
        products_updated: stats.updated,
      })
      .eq('id', brand.id);
    
    // Find duplicate hexes
    try {
      await supabase.rpc('find_duplicate_hexes');
    } catch (e) {
      console.log('find_duplicate_hexes RPC not available');
    }
    
    const duration = Math.round((Date.now() - startTime) / 1000);
    
    console.log(`Sync complete in ${duration}s:`, stats);
    
    return new Response(
      JSON.stringify({
        success: true,
        stats,
        duration_seconds: duration,
        message: `Synced ${stats.created + stats.updated} Spectrum Filaments products`,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
    
  } catch (error) {
    console.error('Sync error:', error);
    
    // Reset scraping status
    try {
      const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
      const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
      const supabase = createClient(supabaseUrl, supabaseKey);
      
      await supabase
        .from('automated_brands')
        .update({
          scraping_active: false,
          last_error: error instanceof Error ? error.message : 'Unknown error',
          last_error_at: new Date().toISOString(),
        })
        .eq('brand_slug', 'spectrum-filaments');
    } catch (e) {
      console.error('Error resetting scraping status:', e);
    }
    
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
