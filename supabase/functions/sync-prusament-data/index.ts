import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ScrapedData {
  price: number | null;
  currency: string;
  image: string | null;
  available: boolean;
}

/**
 * Extract price from Prusa HTML - their format is specific
 * Prices are typically in format: "$24.99" or "€21.99"
 */
function extractPrusaPrice(html: string): { price: number | null; currency: string } {
  // Prusa-specific price patterns (their store uses consistent markup)
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
  
  // Check for currency indicators
  if (html.includes('€') || html.includes('EUR')) {
    currency = 'EUR';
  }

  for (const pattern of pricePatterns) {
    const match = html.match(pattern);
    if (match && match[1]) {
      // Parse the price, handling comma as decimal separator (European format)
      let priceStr = match[1].replace(/,/g, '.');
      // Remove thousands separator if present (e.g., "1.234.56" -> "1234.56")
      if (priceStr.split('.').length > 2) {
        const parts = priceStr.split('.');
        priceStr = parts.slice(0, -1).join('') + '.' + parts[parts.length - 1];
      }
      const price = parseFloat(priceStr);
      
      // Validate price is reasonable for filament ($10-$200 range)
      if (price >= 10 && price <= 200) {
        console.log(`    💰 Price found: ${currency} ${price}`);
        return { price, currency };
      }
    }
  }

  return { price: null, currency };
}

/**
 * Extract product image from Prusa HTML
 * Prioritizes high-quality product images from CDN
 * Prusa uses: https://www.prusa3d.com/cdn-cgi/image/width=1024,format=auto,quality=85/content/images/product/XXXXX.jpg
 */
function extractPrusaImage(html: string): string | null {
  // First, try to find og:image which usually has the product image
  const ogImageMatch = html.match(/<meta[^>]*property="og:image"[^>]*content="([^"]+)"/i) ||
                       html.match(/<meta[^>]*content="([^"]+)"[^>]*property="og:image"/i);
  
  if (ogImageMatch && ogImageMatch[1]) {
    let imageUrl = ogImageMatch[1];
    // Check it's actually a product image (not a logo or social share image)
    if (imageUrl.includes('/product/') || imageUrl.includes('content/images/product')) {
      // Upgrade to high quality version
      imageUrl = imageUrl.replace(/width=\d+/, 'width=1024');
      console.log(`    🖼️ OG Image found: ${imageUrl.substring(0, 80)}...`);
      return imageUrl;
    }
  }

  // Look for product images in the HTML content - specifically in the product gallery
  const productImagePatterns = [
    // Prusa CDN product images with size parameter (upgrade to 1024)
    /src="(https:\/\/www\.prusa3d\.com\/cdn-cgi\/image\/[^"]*content\/images\/product\/[^"]+)"/gi,
    // Direct CDN product images
    /src="(https:\/\/cdn\.prusa3d\.com\/content\/images\/product\/[^"]+\.(?:jpg|jpeg|png|webp))"/gi,
    // JSON-LD image in schema
    /"image"\s*:\s*"(https:\/\/[^"]*prusa[^"]*\/content\/images\/product\/[^"]+)"/gi,
    // Data attribute images
    /data-src="(https:\/\/[^"]*prusa[^"]*\/content\/images\/product\/[^"]+)"/gi,
  ];

  for (const pattern of productImagePatterns) {
    const matches = html.matchAll(pattern);
    for (const match of matches) {
      if (match && match[1]) {
        let imageUrl = match[1];
        
        // Skip non-product images
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
        
        // Upgrade to high quality version if it's a CDN image
        if (imageUrl.includes('cdn-cgi/image/')) {
          imageUrl = imageUrl.replace(/width=\d+/, 'width=1024');
        }
        
        console.log(`    🖼️ Product image found: ${imageUrl.substring(0, 80)}...`);
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
      console.log(`    🖼️ Fallback image found: ${imageUrl.substring(0, 80)}...`);
      return imageUrl;
    }
  }

  return null;
}

/**
 * Check if product is available/in stock
 */
function checkAvailability(html: string): boolean {
  const outOfStockPatterns = [
    /out[-\s]?of[-\s]?stock/i,
    /sold[-\s]?out/i,
    /unavailable/i,
    /not[-\s]?available/i,
    /"availability":\s*"OutOfStock"/i,
    /"availability":\s*"https:\/\/schema\.org\/OutOfStock"/i,
    /class="[^"]*out-of-stock[^"]*"/i,
  ];

  for (const pattern of outOfStockPatterns) {
    if (pattern.test(html)) {
      return false;
    }
  }

  // Check for positive availability signals
  const inStockPatterns = [
    /in[-\s]?stock/i,
    /add[-\s]?to[-\s]?cart/i,
    /"availability":\s*"InStock"/i,
    /"availability":\s*"https:\/\/schema\.org\/InStock"/i,
  ];

  for (const pattern of inStockPatterns) {
    if (pattern.test(html)) {
      return true;
    }
  }

  // Default to true if no signals found
  return true;
}

/**
 * Scrape price, image, and availability from Prusa product URL
 */
async function scrapePrusaProduct(url: string): Promise<ScrapedData> {
  const FIRECRAWL_API_KEY = Deno.env.get('FIRECRAWL_API_KEY');
  if (!FIRECRAWL_API_KEY) {
    console.error('FIRECRAWL_API_KEY not configured');
    return { price: null, currency: 'USD', image: null, available: true };
  }

  try {
    console.log(`  📡 Scraping: ${url}`);
    
    const response = await fetch('https://api.firecrawl.dev/v1/scrape', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${FIRECRAWL_API_KEY}`,
      },
      body: JSON.stringify({
        url,
        formats: ['html'],
        onlyMainContent: false,
        waitFor: 3000,
      }),
    });

    if (!response.ok) {
      console.error(`  ✗ Firecrawl error: ${response.status}`);
      return { price: null, currency: 'USD', image: null, available: true };
    }

    const data = await response.json();
    const html = data.data?.html || '';
    
    if (!html || html.length < 500) {
      console.error(`  ✗ Invalid HTML response (${html.length} chars)`);
      return { price: null, currency: 'USD', image: null, available: true };
    }

    const { price, currency } = extractPrusaPrice(html);
    const image = extractPrusaImage(html);
    const available = checkAvailability(html);

    return { price, currency, image, available };
  } catch (error) {
    console.error(`  ✗ Error scraping ${url}:`, error);
    return { price: null, currency: 'USD', image: null, available: true };
  }
}

/**
 * Convert EUR to USD (approximate rate)
 */
function convertToUSD(price: number, currency: string): number {
  if (currency === 'EUR') {
    return Math.round(price * 1.08 * 100) / 100; // EUR to USD
  }
  if (currency === 'GBP') {
    return Math.round(price * 1.27 * 100) / 100; // GBP to USD
  }
  return price;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Verify authentication
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'No authorization header' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;

    // Verify user is admin
    const authClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: { user }, error: userError } = await authClient.auth.getUser();
    if (userError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { data: roleData } = await authClient.rpc('has_role', { _user_id: user.id, _role: 'admin' });
    if (!roleData) {
      return new Response(JSON.stringify({ error: 'Admin access required' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Use service role for database operations
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Parse request body for options
    const body = await req.json().catch(() => ({}));
    const batchSize = Math.min(body.batchSize || 20, 50); // Max 50 at a time
    const offset = body.offset || 0;
    const forceUpdate = body.forceUpdate || false; // Update even if data exists

    console.log(`=== Prusament Data Sync ===`);
    console.log(`Batch size: ${batchSize}, Offset: ${offset}, Force: ${forceUpdate}`);

    // Fetch Prusament filaments
    let query = supabase
      .from('filaments')
      .select('id, product_title, product_url, variant_price, featured_image, net_weight_g, variant_available')
      .ilike('vendor', 'Prusament')
      .not('product_url', 'is', null)
      .order('product_title', { ascending: true })
      .range(offset, offset + batchSize - 1);

    // Filter to only incomplete records unless forceUpdate
    if (!forceUpdate) {
      query = query.or('variant_price.is.null,featured_image.is.null');
    }

    const { data: filaments, error: fetchError } = await query;

    if (fetchError) {
      console.error('Error fetching filaments:', fetchError);
      return new Response(JSON.stringify({ error: 'Failed to fetch filaments' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Get total count for pagination
    const { count: totalCount } = await supabase
      .from('filaments')
      .select('id', { count: 'exact', head: true })
      .ilike('vendor', 'Prusament')
      .not('product_url', 'is', null);

    console.log(`Processing ${filaments?.length || 0} of ${totalCount} total Prusament filaments`);

    const results = {
      total: totalCount || 0,
      processed: 0,
      pricesUpdated: 0,
      imagesUpdated: 0,
      failed: 0,
      offset,
      batchSize,
      hasMore: (offset + batchSize) < (totalCount || 0),
      details: [] as Array<{
        title: string;
        status: string;
        price?: number;
        image?: string;
        error?: string;
      }>,
    };

    for (const filament of filaments || []) {
      results.processed++;
      const productUrl = filament.product_url;

      if (!productUrl || !productUrl.startsWith('http')) {
        results.failed++;
        results.details.push({
          title: filament.product_title,
          status: 'skipped',
          error: 'Invalid product URL',
        });
        continue;
      }

      console.log(`\n[${results.processed}/${filaments?.length}] ${filament.product_title}`);

      try {
        const scraped = await scrapePrusaProduct(productUrl);
        
        const updates: Record<string, unknown> = {};
        let priceUpdated = false;
        let imageUpdated = false;

        // Update price if found and missing (or forceUpdate)
        if (scraped.price !== null && (forceUpdate || filament.variant_price === null)) {
          const priceUSD = convertToUSD(scraped.price, scraped.currency);
          
          // Calculate price per kg based on net weight
          const weightKg = filament.net_weight_g ? filament.net_weight_g / 1000 : 1;
          const pricePerKg = Math.round((priceUSD / weightKg) * 100) / 100;
          
          updates.variant_price = pricePerKg;
          priceUpdated = true;
          console.log(`    💵 Price: $${scraped.price} (${scraped.currency}) → $${pricePerKg}/kg`);
        }

        // Update image if found and missing (or forceUpdate)
        if (scraped.image && (forceUpdate || !filament.featured_image)) {
          updates.featured_image = scraped.image;
          imageUpdated = true;
        }

        // Update availability
        updates.variant_available = scraped.available;
        updates.last_scraped_at = new Date().toISOString();

        // Apply updates
        if (Object.keys(updates).length > 0) {
          const { error: updateError } = await supabase
            .from('filaments')
            .update(updates)
            .eq('id', filament.id);

          if (updateError) {
            console.error(`    ✗ DB Error: ${updateError.message}`);
            results.failed++;
            results.details.push({
              title: filament.product_title,
              status: 'error',
              error: updateError.message,
            });
          } else {
            if (priceUpdated) results.pricesUpdated++;
            if (imageUpdated) results.imagesUpdated++;
            
            results.details.push({
              title: filament.product_title,
              status: 'updated',
              price: updates.variant_price as number | undefined,
              image: imageUpdated ? (updates.featured_image as string) : undefined,
            });
            console.log(`    ✓ Updated: price=${priceUpdated}, image=${imageUpdated}`);
          }
        } else {
          results.details.push({
            title: filament.product_title,
            status: 'no_changes',
          });
          console.log(`    - No updates needed`);
        }

        // Rate limiting delay
        await new Promise(resolve => setTimeout(resolve, 1500));
      } catch (error) {
        console.error(`    ✗ Error: ${error}`);
        results.failed++;
        results.details.push({
          title: filament.product_title,
          status: 'error',
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }

    // Update brand stats
    await supabase.rpc('update_brand_product_counts', { p_brand_slug: 'prusament' });
    await supabase.rpc('update_brand_enrichment_counts', { p_brand_slug: 'prusament' });

    console.log(`\n=== Sync Complete ===`);
    console.log(`Processed: ${results.processed}, Prices: ${results.pricesUpdated}, Images: ${results.imagesUpdated}, Failed: ${results.failed}`);

    return new Response(JSON.stringify(results), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in sync-prusament-data:', error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
