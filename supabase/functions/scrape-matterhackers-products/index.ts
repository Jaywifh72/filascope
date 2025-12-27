/**
 * MATTERHACKERS PRODUCT SCRAPER
 * 
 * Scrapes filament products from MatterHackers website
 * Uses HTML scraping with Firecrawl for product catalog
 * 
 * MatterHackers uses a custom platform with pagination
 */
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { 
  validateScrapedProduct, 
  sanitizeScrapedProduct,
  type ScrapedProduct 
} from "../_shared/scraper-validation.ts";
import { getColorHex, getColorFamily, extractColorFromTitle } from "../_shared/color-mapping.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const RATE_LIMIT_MS = 1500;
const MAX_RETRIES = 3;
const BASE_URL = 'https://www.matterhackers.com';

interface ProductResult {
  id: string;
  title: string;
  status: 'created' | 'updated' | 'skipped' | 'error';
  price?: number | null;
  imageUrl?: string | null;
  colorHex?: string | null;
  error?: string;
}

/**
 * Extract product data from MatterHackers catalog page HTML
 */
function parseProductListHtml(html: string): Array<{
  url: string;
  title: string;
  price: number | null;
  imageUrl: string | null;
  sku: string | null;
}> {
  const products: Array<{
    url: string;
    title: string;
    price: number | null;
    imageUrl: string | null;
    sku: string | null;
  }> = [];
  
  // Match product cards - MatterHackers uses specific product card structure
  const productCardPatterns = [
    // Product grid item pattern
    /<div[^>]*class="[^"]*product-item[^"]*"[^>]*>([\s\S]*?)<\/div>\s*<\/div>/gi,
    // Alternative product card pattern
    /<article[^>]*class="[^"]*product[^"]*"[^>]*>([\s\S]*?)<\/article>/gi,
    // List item pattern
    /<li[^>]*class="[^"]*product[^"]*"[^>]*>([\s\S]*?)<\/li>/gi,
  ];
  
  // Try to extract from JSON-LD first (most reliable)
  const jsonLdMatches = html.matchAll(/<script[^>]*type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/gi);
  for (const match of jsonLdMatches) {
    try {
      const json = JSON.parse(match[1]);
      
      // Handle ItemList schema
      if (json['@type'] === 'ItemList' && json.itemListElement) {
        for (const item of json.itemListElement) {
          const product = item.item || item;
          if (product.name && product.url) {
            products.push({
              url: product.url.startsWith('http') ? product.url : `${BASE_URL}${product.url}`,
              title: product.name,
              price: product.offers?.price ? parseFloat(product.offers.price) : null,
              imageUrl: product.image || null,
              sku: product.sku || null,
            });
          }
        }
      }
      
      // Handle Product schema
      if (json['@type'] === 'Product') {
        products.push({
          url: json.url?.startsWith('http') ? json.url : `${BASE_URL}${json.url || ''}`,
          title: json.name,
          price: json.offers?.price ? parseFloat(json.offers.price) : null,
          imageUrl: json.image || null,
          sku: json.sku || null,
        });
      }
      
      // Handle @graph structure
      if (json['@graph']) {
        for (const item of json['@graph']) {
          if (item['@type'] === 'Product') {
            products.push({
              url: item.url?.startsWith('http') ? item.url : `${BASE_URL}${item.url || ''}`,
              title: item.name,
              price: item.offers?.price ? parseFloat(item.offers.price) : null,
              imageUrl: item.image || null,
              sku: item.sku || null,
            });
          }
        }
      }
    } catch {
      // Continue to HTML parsing
    }
  }
  
  if (products.length > 0) {
    return products;
  }
  
  // Fallback to HTML parsing
  // Match product links with titles
  const productLinkPattern = /<a[^>]*href="(\/store\/[^"]*filament[^"]*)"[^>]*>([^<]+)<\/a>/gi;
  let match;
  while ((match = productLinkPattern.exec(html)) !== null) {
    const url = `${BASE_URL}${match[1]}`;
    const title = match[2].trim();
    
    if (title && !products.find(p => p.url === url)) {
      products.push({
        url,
        title,
        price: null,
        imageUrl: null,
        sku: null,
      });
    }
  }
  
  // Also try OG tags for individual product pages
  const ogUrl = html.match(/<meta[^>]*property="og:url"[^>]*content="([^"]+)"/i);
  const ogTitle = html.match(/<meta[^>]*property="og:title"[^>]*content="([^"]+)"/i);
  const ogImage = html.match(/<meta[^>]*property="og:image"[^>]*content="([^"]+)"/i);
  const ogPrice = html.match(/<meta[^>]*property="product:price:amount"[^>]*content="([^"]+)"/i);
  
  if (ogUrl && ogTitle && ogUrl[1].includes('filament')) {
    products.push({
      url: ogUrl[1],
      title: ogTitle[1],
      price: ogPrice ? parseFloat(ogPrice[1]) : null,
      imageUrl: ogImage?.[1] || null,
      sku: null,
    });
  }
  
  return products;
}

/**
 * Scrape MatterHackers product page for detailed data
 */
async function scrapeProductPage(url: string): Promise<ScrapedProduct | null> {
  try {
    console.log(`[MATTERHACKERS] 📄 Fetching: ${url}`);
    
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      },
    });
    
    if (!response.ok) {
      console.log(`[MATTERHACKERS] ❌ HTTP ${response.status}`);
      return null;
    }
    
    const html = await response.text();
    
    // Extract from JSON-LD
    const jsonLdMatch = html.match(/<script[^>]*type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/i);
    let productData: any = null;
    
    if (jsonLdMatch) {
      try {
        const json = JSON.parse(jsonLdMatch[1]);
        productData = json['@type'] === 'Product' ? json : json['@graph']?.find((item: any) => item['@type'] === 'Product');
      } catch {
        // Continue to HTML extraction
      }
    }
    
    // Extract title
    const title = productData?.name || 
      html.match(/<h1[^>]*>([^<]+)<\/h1>/i)?.[1]?.trim() ||
      html.match(/<meta[^>]*property="og:title"[^>]*content="([^"]+)"/i)?.[1];
    
    if (!title) {
      console.log(`[MATTERHACKERS] ❌ No title found`);
      return null;
    }
    
    // Extract price
    let price: number | null = null;
    if (productData?.offers?.price) {
      price = parseFloat(productData.offers.price);
    } else {
      const priceMatch = html.match(/\$(\d+(?:\.\d{2})?)/);
      if (priceMatch) {
        price = parseFloat(priceMatch[1]);
      }
    }
    
    // Extract image
    const imageUrl = productData?.image || 
      html.match(/<meta[^>]*property="og:image"[^>]*content="([^"]+)"/i)?.[1] ||
      html.match(/data-zoom-image="([^"]+)"/i)?.[1];
    
    // Extract SKU
    const sku = productData?.sku ||
      html.match(/SKU[:\s]*([A-Z0-9-]+)/i)?.[1] ||
      html.match(/data-sku="([^"]+)"/i)?.[1];
    
    // Extract color
    const { colorName, colorHex } = extractColorFromTitle(title);
    
    // Extract weight from title
    let netWeightG: number | null = null;
    const weightMatch = title.match(/(\d+(?:\.\d+)?)\s*(kg|g)\b/i);
    if (weightMatch) {
      netWeightG = parseFloat(weightMatch[1]) * (weightMatch[2].toLowerCase() === 'kg' ? 1000 : 1);
    }
    
    // Extract product ID from URL
    const productIdMatch = url.match(/\/([^\/]+?)(?:\.html)?$/);
    const productId = productIdMatch?.[1] || url;
    
    console.log(`[MATTERHACKERS] ✅ ${title} - $${price}`);
    
    return {
      productId,
      title,
      price: price && price > 0 && price < 500 ? price : null,
      url,
      imageUrl,
      mpn: sku,
      colorName,
      colorHex: colorHex ? `#${colorHex}` : null,
      colorFamily: colorName ? getColorFamily(colorName) : null,
      netWeightG,
      available: true,
      currency: 'USD',
      scrapedAt: new Date(),
      source: 'matterhackers-scraper',
    };
  } catch (error) {
    console.error(`[MATTERHACKERS] ❌ Error:`, error);
    return null;
  }
}

/**
 * Scrape MatterHackers filament catalog
 */
async function scrapeFilamentCatalog(limit: number): Promise<ScrapedProduct[]> {
  const products: ScrapedProduct[] = [];
  const catalogUrls = [
    `${BASE_URL}/store/c/3d-printer-filament?page=1`,
    `${BASE_URL}/store/c/pla-3d-printer-filament`,
    `${BASE_URL}/store/c/petg-3d-printer-filament`,
    `${BASE_URL}/store/c/abs-3d-printer-filament`,
    `${BASE_URL}/store/c/tpu-3d-printer-filament`,
  ];
  
  const seenUrls = new Set<string>();
  
  for (const catalogUrl of catalogUrls) {
    if (products.length >= limit) break;
    
    try {
      console.log(`[MATTERHACKERS] 📋 Fetching catalog: ${catalogUrl}`);
      
      const response = await fetch(catalogUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        },
      });
      
      if (!response.ok) {
        console.log(`[MATTERHACKERS] ⚠️ Catalog fetch failed: ${response.status}`);
        continue;
      }
      
      const html = await response.text();
      const catalogProducts = parseProductListHtml(html);
      
      console.log(`[MATTERHACKERS] 📊 Found ${catalogProducts.length} products in catalog`);
      
      for (const item of catalogProducts) {
        if (products.length >= limit) break;
        if (seenUrls.has(item.url)) continue;
        seenUrls.add(item.url);
        
        // Rate limit
        await new Promise(r => setTimeout(r, RATE_LIMIT_MS));
        
        // Scrape individual product page for full details
        const product = await scrapeProductPage(item.url);
        if (product) {
          products.push(product);
        }
      }
    } catch (error) {
      console.error(`[MATTERHACKERS] ❌ Catalog error:`, error);
    }
  }
  
  return products;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const startTime = Date.now();
  console.log('[MATTERHACKERS] ═══════════════════════════════════════════════════════');
  console.log('[MATTERHACKERS] 🚀 MATTERHACKERS PRODUCT SCRAPER STARTED');
  console.log(`[MATTERHACKERS] 📅 ${new Date().toISOString()}`);
  console.log('[MATTERHACKERS] ═══════════════════════════════════════════════════════');

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Verify admin role
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Authorization required' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const authClient = createClient(supabaseUrl, Deno.env.get('SUPABASE_ANON_KEY')!, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: { user }, error: userError } = await authClient.auth.getUser();
    if (userError || !user) {
      return new Response(JSON.stringify({ error: 'Invalid authentication' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { data: isAdmin } = await supabase.rpc('has_role', {
      _user_id: user.id,
      _role: 'admin',
    });

    if (!isAdmin) {
      return new Response(JSON.stringify({ error: 'Admin required' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Parse options
    let limit = 50;
    let dryRun = true;
    try {
      const body = await req.json();
      limit = body.limit ?? 50;
      dryRun = body.dryRun ?? true;
    } catch {
      // Use defaults
    }

    console.log(`[MATTERHACKERS] ⚙️ Options: limit=${limit}, dryRun=${dryRun}`);

    // Scrape products
    const scrapedProducts = await scrapeFilamentCatalog(limit);
    
    console.log(`[MATTERHACKERS] 📊 Scraped ${scrapedProducts.length} products`);

    const results: ProductResult[] = [];
    let created = 0;
    let updated = 0;
    let skipped = 0;
    let errors = 0;

    for (const product of scrapedProducts) {
      const result: ProductResult = {
        id: product.productId,
        title: product.title,
        status: 'skipped',
        price: product.price,
        imageUrl: product.imageUrl,
        colorHex: product.colorHex,
      };

      if (dryRun) {
        result.status = 'skipped';
        skipped++;
        results.push(result);
        continue;
      }

      try {
        // Validate product
        const validation = validateScrapedProduct(product);
        if (!validation.valid) {
          result.status = 'error';
          result.error = validation.errors.join(', ');
          errors++;
          results.push(result);
          continue;
        }

        // Build sanitized product data
        const sanitizedData = {
          title: product.title,
          price: product.price,
          url: product.url,
          imageUrl: product.imageUrl,
          colorHex: product.colorHex,
          colorFamily: product.colorFamily,
          mpn: product.mpn,
          netWeightG: product.netWeightG,
        };

        // Check if exists
        const { data: existing } = await supabase
          .from('filaments')
          .select('id')
          .eq('product_id', product.productId)
          .ilike('vendor', 'MatterHackers')
          .maybeSingle();

        if (existing) {
          // Update
          await supabase
            .from('filaments')
            .update({
              product_title: sanitizedData.title,
              variant_price: sanitizedData.price,
              product_url: sanitizedData.url,
              featured_image: sanitizedData.imageUrl,
              color_hex: sanitizedData.colorHex,
              color_family: sanitizedData.colorFamily,
              mpn: sanitizedData.mpn,
              net_weight_g: sanitizedData.netWeightG,
              last_scraped_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
              auto_updated: true,
            })
            .eq('id', existing.id);

          result.status = 'updated';
          updated++;
        } else {
          // Create
          await supabase
            .from('filaments')
            .insert({
              product_id: product.productId,
              product_title: sanitizedData.title,
              vendor: 'MatterHackers',
              variant_price: sanitizedData.price,
              product_url: sanitizedData.url,
              featured_image: sanitizedData.imageUrl,
              color_hex: sanitizedData.colorHex,
              color_family: sanitizedData.colorFamily,
              mpn: sanitizedData.mpn,
              net_weight_g: sanitizedData.netWeightG,
              diameter_nominal_mm: 1.75,
              auto_created: true,
              auto_updated: true,
              last_scraped_at: new Date().toISOString(),
              sync_status: 'synced',
            });

          result.status = 'created';
          created++;
        }
      } catch (error) {
        result.status = 'error';
        result.error = error instanceof Error ? error.message : 'Unknown error';
        errors++;
      }

      results.push(result);
    }

    const duration = Date.now() - startTime;
    
    console.log('[MATTERHACKERS] ═══════════════════════════════════════════════════════');
    console.log(`[MATTERHACKERS] ✅ COMPLETE: ${created} created, ${updated} updated, ${skipped} skipped, ${errors} errors`);
    console.log(`[MATTERHACKERS] ⏱️ Duration: ${Math.round(duration / 1000)}s`);
    console.log('[MATTERHACKERS] ═══════════════════════════════════════════════════════');

    return new Response(
      JSON.stringify({
        success: true,
        dryRun,
        summary: {
          total: scrapedProducts.length,
          created,
          updated,
          skipped,
          errors,
        },
        results,
        duration_ms: duration,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('[MATTERHACKERS] ❌ Fatal error:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
