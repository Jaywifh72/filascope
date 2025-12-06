import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

async function scrapeImageFromUrl(url: string): Promise<string | null> {
  const FIRECRAWL_API_KEY = Deno.env.get('FIRECRAWL_API_KEY');
  if (!FIRECRAWL_API_KEY) {
    console.error('FIRECRAWL_API_KEY not configured');
    return null;
  }

  try {
    console.log(`Scraping image from: ${url}`);
    
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
        waitFor: 2000,
      }),
    });

    if (!response.ok) {
      console.error(`Firecrawl error for ${url}: ${response.status}`);
      return null;
    }

    const data = await response.json();
    const html = data.data?.html || '';

    // Look for product images in the HTML
    // ColorFabb uses various image patterns
    const imagePatterns = [
      // OpenGraph image
      /<meta[^>]*property="og:image"[^>]*content="([^"]+)"/i,
      // Product image in img tag with product-related classes
      /<img[^>]*class="[^"]*product[^"]*"[^>]*src="([^"]+)"/i,
      // Image with data-zoom or data-large
      /<img[^>]*data-(?:zoom|large)-image="([^"]+)"/i,
      // Main product image
      /<img[^>]*id="[^"]*product[^"]*"[^>]*src="([^"]+)"/i,
      // Any large image from colorfabb CDN
      /src="(https:\/\/[^"]*colorfabb[^"]*\/(?:media|pub)[^"]*\.(?:jpg|jpeg|png|webp))"/i,
    ];

    for (const pattern of imagePatterns) {
      const match = html.match(pattern);
      if (match && match[1]) {
        let imageUrl = match[1];
        // Make sure it's an absolute URL
        if (imageUrl.startsWith('//')) {
          imageUrl = 'https:' + imageUrl;
        } else if (imageUrl.startsWith('/')) {
          imageUrl = 'https://colorfabb.com' + imageUrl;
        }
        console.log(`Found image: ${imageUrl}`);
        return imageUrl;
      }
    }

    // Fallback: find any reasonably sized image
    const allImages = html.matchAll(/<img[^>]*src="([^"]+)"[^>]*>/gi);
    for (const imgMatch of allImages) {
      const src = imgMatch[1];
      if (src && 
          !src.includes('logo') && 
          !src.includes('icon') && 
          !src.includes('banner') &&
          !src.includes('placeholder') &&
          (src.includes('.jpg') || src.includes('.jpeg') || src.includes('.png') || src.includes('.webp'))) {
        let imageUrl = src;
        if (imageUrl.startsWith('//')) {
          imageUrl = 'https:' + imageUrl;
        } else if (imageUrl.startsWith('/')) {
          imageUrl = 'https://colorfabb.com' + imageUrl;
        }
        console.log(`Found fallback image: ${imageUrl}`);
        return imageUrl;
      }
    }

    console.log(`No image found for ${url}`);
    return null;
  } catch (error) {
    console.error(`Error scraping ${url}:`, error);
    return null;
  }
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

    // Fetch all ColorFabb filaments that have a product_url set
    const { data: filaments, error: fetchError } = await supabase
      .from('filaments')
      .select('id, product_title, product_url, featured_image')
      .ilike('vendor', '%colorfabb%')
      .not('product_url', 'is', null);

    if (fetchError) {
      console.error('Error fetching filaments:', fetchError);
      return new Response(JSON.stringify({ error: 'Failed to fetch filaments' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log(`Found ${filaments?.length || 0} ColorFabb filaments with product URLs`);

    const results = {
      total: filaments?.length || 0,
      updated: 0,
      failed: 0,
      skipped: 0,
      details: [] as Array<{ title: string; status: string; url?: string; image?: string }>,
    };

    for (const filament of filaments || []) {
      // Use the product_url already stored in the database
      const productUrl = filament.product_url;
      
      if (!productUrl || !productUrl.startsWith('http')) {
        console.log(`Invalid or missing product_url for: ${filament.product_title}`);
        results.skipped++;
        results.details.push({
          title: filament.product_title,
          status: 'skipped - no valid product_url',
        });
        continue;
      }

      try {
        // Scrape the image from the product page
        const imageUrl = await scrapeImageFromUrl(productUrl);

        if (imageUrl) {
          const { error: updateError } = await supabase
            .from('filaments')
            .update({ featured_image: imageUrl })
            .eq('id', filament.id);

          if (updateError) {
            console.error(`Failed to update ${filament.product_title}:`, updateError);
            results.failed++;
            results.details.push({
              title: filament.product_title,
              status: 'failed - database error',
              url: productUrl,
            });
          } else {
            console.log(`Updated ${filament.product_title} with image`);
            results.updated++;
            results.details.push({
              title: filament.product_title,
              status: 'updated',
              url: productUrl,
              image: imageUrl,
            });
          }
        } else {
          console.log(`No image found for ${filament.product_title}`);
          results.skipped++;
          results.details.push({
            title: filament.product_title,
            status: 'skipped - no image found',
            url: productUrl,
          });
        }

        // Small delay between requests
        await new Promise(resolve => setTimeout(resolve, 500));
      } catch (error) {
        console.error(`Error processing ${filament.product_title}:`, error);
        results.failed++;
        results.details.push({
          title: filament.product_title,
          status: 'failed - scrape error',
          url: productUrl,
        });
      }
    }

    console.log(`Completed: ${results.updated} updated, ${results.failed} failed, ${results.skipped} skipped`);

    return new Response(JSON.stringify(results), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in scrape-colorfabb-images:', error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
