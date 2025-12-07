import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const firecrawlKey = Deno.env.get('FIRECRAWL_API_KEY');
    
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Verify admin role
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Authorization header required' }), {
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
      return new Response(JSON.stringify({ error: 'Admin role required' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Get Taulman3D filaments with product URLs
    const { data: filaments, error: fetchError } = await supabase
      .from('filaments')
      .select('id, product_title, product_url, featured_image')
      .eq('vendor', 'Taulman3D')
      .not('product_url', 'is', null);

    if (fetchError) {
      console.error('Error fetching filaments:', fetchError);
      throw fetchError;
    }

    console.log(`Found ${filaments?.length || 0} Taulman3D filaments to process`);

    const results: any[] = [];

    for (const filament of filaments || []) {
      console.log(`Processing: ${filament.product_title}`);
      console.log(`URL: ${filament.product_url}`);

      try {
        // Use Firecrawl to scrape the page
        const scrapeResponse = await fetch('https://api.firecrawl.dev/v1/scrape', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${firecrawlKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            url: filament.product_url,
            formats: ['html'],
            onlyMainContent: false,
          }),
        });

        if (!scrapeResponse.ok) {
          console.error(`Firecrawl error for ${filament.product_title}: ${scrapeResponse.status}`);
          results.push({ id: filament.id, title: filament.product_title, status: 'scrape_failed' });
          continue;
        }

        const scrapeData = await scrapeResponse.json();
        const html = scrapeData.data?.html || '';

        // Extract image URL from 3dmakerworld page
        let imageUrl: string | null = null;

        // Try OpenGraph image first
        const ogMatch = html.match(/<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["']/i);
        if (ogMatch) {
          imageUrl = ogMatch[1];
          console.log(`Found OG image: ${imageUrl}`);
        }

        // Try product image patterns from 3dmakerworld/Shopify
        if (!imageUrl) {
          const productImgPatterns = [
            /src=["'](https:\/\/cdn\.shopify\.com\/s\/files\/[^"']+(?:\.jpg|\.png|\.webp)[^"']*)["']/gi,
            /data-zoom=["'](https:\/\/cdn\.shopify\.com\/s\/files\/[^"']+)["']/gi,
            /<img[^>]+class=["'][^"']*product[^"']*["'][^>]+src=["']([^"']+)["']/gi,
          ];

          for (const pattern of productImgPatterns) {
            const matches = html.matchAll(pattern);
            for (const match of matches) {
              const url = match[1];
              // Skip tiny thumbnails
              if (url && !url.includes('_50x') && !url.includes('_100x') && !url.includes('icon')) {
                imageUrl = url;
                console.log(`Found product image: ${imageUrl}`);
                break;
              }
            }
            if (imageUrl) break;
          }
        }

        if (imageUrl) {
          // Clean up Shopify URL - get larger version
          if (imageUrl.includes('cdn.shopify.com')) {
            imageUrl = imageUrl.replace(/_\d+x\d*/, '_800x');
          }

          const { error: updateError } = await supabase
            .from('filaments')
            .update({ featured_image: imageUrl })
            .eq('id', filament.id);

          if (updateError) {
            console.error(`Error updating ${filament.product_title}:`, updateError);
            results.push({ id: filament.id, title: filament.product_title, status: 'update_failed' });
          } else {
            console.log(`Updated image for ${filament.product_title}`);
            results.push({ id: filament.id, title: filament.product_title, status: 'success', image: imageUrl });
          }
        } else {
          console.log(`No image found for ${filament.product_title}`);
          results.push({ id: filament.id, title: filament.product_title, status: 'no_image_found' });
        }

        // Small delay between requests
        await new Promise(resolve => setTimeout(resolve, 500));

      } catch (err) {
        console.error(`Error processing ${filament.product_title}:`, err);
        results.push({ id: filament.id, title: filament.product_title, status: 'error', error: String(err) });
      }
    }

    const successCount = results.filter(r => r.status === 'success').length;
    console.log(`Completed: ${successCount}/${results.length} images scraped`);

    return new Response(JSON.stringify({
      success: true,
      total: results.length,
      updated: successCount,
      results,
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error: any) {
    console.error('Error in scrape-taulman-images:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
