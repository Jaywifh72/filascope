import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Extract product image from scraped HTML/markdown content
function extractProductImage(html: string, markdown: string, productUrl: string): string | null {
  const images: { url: string; score: number }[] = [];
  
  // Get base URL for relative paths
  let baseUrl = '';
  try {
    const urlObj = new URL(productUrl);
    baseUrl = `${urlObj.protocol}//${urlObj.host}`;
  } catch {}
  
  // Extract all image URLs from HTML
  const imgRegex = /<img[^>]+src=["']([^"']+)["'][^>]*>/gi;
  let match;
  
  while ((match = imgRegex.exec(html)) !== null) {
    let imgUrl = match[1];
    
    // Skip invalid/tiny images
    if (!imgUrl || imgUrl.includes('data:') || imgUrl.includes('base64')) continue;
    if (imgUrl.includes('favicon') || imgUrl.includes('logo') || imgUrl.includes('icon')) continue;
    if (imgUrl.includes('1x1') || imgUrl.includes('pixel') || imgUrl.includes('spacer')) continue;
    if (imgUrl.includes('svg') && !imgUrl.includes('product')) continue;
    
    // Convert relative URLs to absolute
    if (imgUrl.startsWith('//')) {
      imgUrl = 'https:' + imgUrl;
    } else if (imgUrl.startsWith('/')) {
      imgUrl = baseUrl + imgUrl;
    } else if (!imgUrl.startsWith('http')) {
      imgUrl = baseUrl + '/' + imgUrl;
    }
    
    // Score the image based on likelihood of being product image
    let score = 0;
    const imgLower = imgUrl.toLowerCase();
    const altMatch = match[0].match(/alt=["']([^"']+)["']/i);
    const alt = altMatch ? altMatch[1].toLowerCase() : '';
    
    // Positive signals
    if (imgLower.includes('product')) score += 20;
    if (imgLower.includes('plate') || imgLower.includes('platform') || imgLower.includes('bed')) score += 30;
    if (imgLower.includes('pei') || imgLower.includes('magnetic')) score += 25;
    if (imgLower.includes('main') || imgLower.includes('hero')) score += 15;
    if (imgLower.includes('featured')) score += 15;
    if (imgLower.includes('large') || imgLower.includes('big')) score += 10;
    if (imgLower.includes('1024') || imgLower.includes('800') || imgLower.includes('600')) score += 10;
    if (alt.includes('plate') || alt.includes('platform') || alt.includes('bed')) score += 25;
    
    // Shopify CDN patterns (high quality product images)
    if (imgLower.includes('cdn.shopify.com') && imgLower.includes('products')) score += 25;
    if (imgLower.includes('files/') && (imgLower.includes('.png') || imgLower.includes('.jpg'))) score += 15;
    
    // Negative signals
    if (imgLower.includes('thumb') || imgLower.includes('small')) score -= 10;
    if (imgLower.includes('banner') || imgLower.includes('promo')) score -= 15;
    if (imgLower.includes('cart') || imgLower.includes('checkout')) score -= 20;
    if (imgLower.includes('avatar') || imgLower.includes('user')) score -= 20;
    if (imgLower.includes('payment') || imgLower.includes('shipping')) score -= 20;
    
    if (score > 0) {
      images.push({ url: imgUrl, score });
    }
  }
  
  // Sort by score and return best match
  images.sort((a, b) => b.score - a.score);
  
  if (images.length > 0 && images[0].score > 10) {
    return images[0].url;
  }
  
  return null;
}

// Try Shopify JSON API first (faster and more reliable)
async function tryShopifyJson(productUrl: string): Promise<string | null> {
  try {
    // Convert product URL to JSON endpoint
    const jsonUrl = productUrl.replace(/\?.*$/, '') + '.json';
    
    const response = await fetch(jsonUrl, {
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    });
    
    if (!response.ok) return null;
    
    const data = await response.json();
    
    // Get the main product image
    if (data.product?.image?.src) {
      return data.product.image.src;
    }
    
    // Or first image from images array
    if (data.product?.images?.[0]?.src) {
      return data.product.images[0].src;
    }
    
    return null;
  } catch {
    return null;
  }
}

// Scrape using Firecrawl API directly
async function scrapeWithFirecrawl(productUrl: string, apiKey: string): Promise<{ html: string; markdown: string } | null> {
  try {
    const response = await fetch('https://api.firecrawl.dev/v1/scrape', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        url: productUrl,
        formats: ['html', 'markdown'],
        onlyMainContent: false,
        waitFor: 2000
      })
    });
    
    if (!response.ok) {
      console.log(`  Firecrawl returned ${response.status}`);
      return null;
    }
    
    const data = await response.json();
    
    if (data.success && data.data) {
      return {
        html: data.data.html || '',
        markdown: data.data.markdown || ''
      };
    }
    
    return null;
  } catch (error) {
    console.error(`  Firecrawl error: ${error}`);
    return null;
  }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const firecrawlApiKey = Deno.env.get('FIRECRAWL_API_KEY');
    
    // Create client for auth check
    const authClient = createClient(supabaseUrl, Deno.env.get('SUPABASE_ANON_KEY') ?? '');

    // Verify user authentication
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ success: false, error: 'Authorization header required' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await authClient.auth.getUser(token);

    if (authError || !user) {
      return new Response(
        JSON.stringify({ success: false, error: 'Invalid authentication token' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check admin role
    const { data: hasAdminRole, error: roleError } = await authClient.rpc('has_role', {
      _user_id: user.id,
      _role: 'admin'
    });

    if (roleError || !hasAdminRole) {
      console.log(`Access denied for user ${user.id} - not an admin`);
      return new Response(
        JSON.stringify({ success: false, error: 'Admin access required' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Create service role client for database operations
    const supabase = createClient(supabaseUrl, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);

    console.log(`Admin ${user.id} starting nozzle image rescrape...`);
    
    // Parse request body for accessory type filter
    let accessoryType = 'nozzle';
    try {
      const body = await req.json();
      if (body.accessory_type) {
        accessoryType = body.accessory_type;
      }
    } catch {}
    
    // Get all accessories with product URLs
    const { data: accessories, error: fetchError } = await supabase
      .from('printer_accessories')
      .select('id, name, brand, product_url, image_url')
      .eq('accessory_type', accessoryType)
      .not('product_url', 'is', null)
      .order('brand');
    
    if (fetchError) {
      throw new Error(`Failed to fetch accessories: ${fetchError.message}`);
    }
    
    console.log(`Found ${accessories?.length || 0} ${accessoryType}s with product URLs`);
    
    const results: { id: string; name: string; brand: string; success: boolean; newImageUrl?: string; error?: string }[] = [];
    
    for (const accessory of accessories || []) {
      const productUrl = accessory.product_url;
      
      if (!productUrl || !productUrl.startsWith('http')) {
        results.push({
          id: accessory.id,
          name: accessory.name,
          brand: accessory.brand || 'Unknown',
          success: false,
          error: 'Invalid product URL'
        });
        continue;
      }
      
      console.log(`Processing: ${accessory.name} (${accessory.brand}) - ${productUrl}`);
      
      let newImageUrl: string | null = null;
      
      // Try Shopify JSON first (fastest)
      newImageUrl = await tryShopifyJson(productUrl);
      
      if (newImageUrl) {
        console.log(`  Found via Shopify JSON: ${newImageUrl}`);
      } else if (firecrawlApiKey) {
        // Fall back to Firecrawl scraping
        const scrapeResult = await scrapeWithFirecrawl(productUrl, firecrawlApiKey);
        
        if (scrapeResult) {
          newImageUrl = extractProductImage(
            scrapeResult.html,
            scrapeResult.markdown,
            productUrl
          );
          
          if (newImageUrl) {
            console.log(`  Found via Firecrawl: ${newImageUrl}`);
          }
        }
      }
      
      if (newImageUrl) {
        // Update the database
        const { error: updateError } = await supabase
          .from('printer_accessories')
          .update({ image_url: newImageUrl })
          .eq('id', accessory.id);
        
        if (updateError) {
          results.push({
            id: accessory.id,
            name: accessory.name,
            brand: accessory.brand || 'Unknown',
            success: false,
            error: `Update failed: ${updateError.message}`
          });
        } else {
          results.push({
            id: accessory.id,
            name: accessory.name,
            brand: accessory.brand || 'Unknown',
            success: true,
            newImageUrl
          });
        }
      } else {
        results.push({
          id: accessory.id,
          name: accessory.name,
          brand: accessory.brand || 'Unknown',
          success: false,
          error: 'Could not extract image from product page'
        });
      }
      
      // Small delay between requests
      await new Promise(resolve => setTimeout(resolve, 500));
    }
    
    const successCount = results.filter(r => r.success).length;
    const failCount = results.filter(r => !r.success).length;
    
    console.log(`Completed: ${successCount} succeeded, ${failCount} failed`);
    
    return new Response(
      JSON.stringify({
        success: true,
        accessoryType,
        total: results.length,
        updated: successCount,
        failed: failCount,
        results
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
    
  } catch (error) {
    console.error('Error:', error);
    return new Response(
      JSON.stringify({ success: false, error: error instanceof Error ? error.message : String(error) }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
