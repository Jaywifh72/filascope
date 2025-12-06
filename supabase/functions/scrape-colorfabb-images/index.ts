import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Mapping of ColorFabb product titles to their official URLs
const COLORFABB_PRODUCT_URLS: Record<string, string> = {
  "allPHA 100% Biodegradable": "https://colorfabb.com/allpha-white",
  "ASA UV Resistant": "https://colorfabb.com/asa-naturel",
  "bronzeFill Metal Composite PLA": "https://colorfabb.com/bronzefill",
  "copperFill Metal Composite PLA": "https://colorfabb.com/copperfill",
  "corkFill Cork Composite PLA": "https://colorfabb.com/corkfill",
  "glowFill Glow in the Dark PLA": "https://colorfabb.com/glowfill",
  "HT High Temperature Co-Polyester (1.75mm)": "https://colorfabb.com/ht-white",
  "HT High Temperature Co-Polyester (2.85mm)": "https://colorfabb.com/ht-white",
  "LW-ASA Lightweight UV Resistant": "https://colorfabb.com/lw-asa-naturel",
  "LW-PLA Lightweight Foaming PLA": "https://colorfabb.com/lw-pla-black",
  "LW-PLA-HT High Temperature Lightweight": "https://colorfabb.com/lw-pla-ht-black",
  "nGen Co-Polyester (1.75mm)": "https://colorfabb.com/ngen-clear",
  "nGen Co-Polyester (2.85mm)": "https://colorfabb.com/ngen-clear",
  "nGen FLEX Semi-Flexible Co-Polyester": "https://colorfabb.com/ngen-flex-clear",
  "nGen-CF10 Carbon Fiber Co-Polyester": "https://colorfabb.com/ngen-cf10",
  "PA Nylon": "https://colorfabb.com/pa-neat",
  "PA-CF Low Warp Carbon Fiber Nylon": "https://colorfabb.com/pa-cf-low-warp",
  "PETG Economy": "https://colorfabb.com/petg-economy-black",
  "PLA Economy": "https://colorfabb.com/pla-economy-white",
  "PLA High Speed Pro": "https://colorfabb.com/pla-high-speed-pro-natural",
  "PLA Semi Matte": "https://colorfabb.com/filaments/materials/pla-filaments/pla-semi-matte",
  "PLA/PHA (1.75mm)": "https://colorfabb.com/natural",
  "PLA/PHA (2.85mm)": "https://colorfabb.com/natural",
  "steelFill Metal Composite PLA": "https://colorfabb.com/steelfill",
  "stoneFill Stone Composite PLA": "https://colorfabb.com/stonefill-light-gray",
  "TPU 85A Flexible": "https://colorfabb.com/tpu-85a-black",
  "TPU 95A Flexible": "https://colorfabb.com/tpu-95a-black",
  "Varioshore TPU Variable Hardness Flexible": "https://colorfabb.com/varioshore-tpu-black",
  "woodFill Wood Composite PLA": "https://colorfabb.com/woodfill",
  "XT Co-Polyester Engineering (1.75mm)": "https://colorfabb.com/xt-clear",
  "XT Co-Polyester Engineering (2.85mm)": "https://colorfabb.com/xt-clear",
  "XT-CF20 Carbon Fiber Co-Polyester": "https://colorfabb.com/xt-cf20",
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

    // Fetch all ColorFabb filaments
    const { data: filaments, error: fetchError } = await supabase
      .from('filaments')
      .select('id, product_title, product_url, featured_image')
      .ilike('vendor', '%colorfabb%');

    if (fetchError) {
      console.error('Error fetching filaments:', fetchError);
      return new Response(JSON.stringify({ error: 'Failed to fetch filaments' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log(`Found ${filaments?.length || 0} ColorFabb filaments`);

    const results = {
      total: filaments?.length || 0,
      updated: 0,
      failed: 0,
      skipped: 0,
      details: [] as Array<{ title: string; status: string; url?: string; image?: string }>,
    };

    for (const filament of filaments || []) {
      const productUrl = COLORFABB_PRODUCT_URLS[filament.product_title];
      
      if (!productUrl) {
        console.log(`No URL mapping for: ${filament.product_title}`);
        results.skipped++;
        results.details.push({
          title: filament.product_title,
          status: 'skipped - no URL mapping',
        });
        continue;
      }

      try {
        // Scrape the image from the product page
        const imageUrl = await scrapeImageFromUrl(productUrl);

        const updateData: Record<string, string> = {
          product_url: productUrl,
        };

        if (imageUrl) {
          updateData.featured_image = imageUrl;
        }

        const { error: updateError } = await supabase
          .from('filaments')
          .update(updateData)
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
          console.log(`Updated ${filament.product_title} with URL and image`);
          results.updated++;
          results.details.push({
            title: filament.product_title,
            status: 'updated',
            url: productUrl,
            image: imageUrl || 'no image found',
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
