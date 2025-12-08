import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import FirecrawlApp from "https://esm.sh/@mendable/firecrawl-js@1.8.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Auth check
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'No authorization header' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const firecrawlApiKey = Deno.env.get('FIRECRAWL_API_KEY');

    const authClient = createClient(supabaseUrl, supabaseServiceKey);
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: userError } = await authClient.auth.getUser(token);

    if (userError || !user) {
      return new Response(JSON.stringify({ error: 'Invalid token' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const { data: hasAdminRole } = await authClient.rpc('has_role', {
      _user_id: user.id,
      _role: 'admin'
    });

    if (!hasAdminRole) {
      return new Response(JSON.stringify({ error: 'Admin access required' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get MatterHackers filaments missing images
    const { data: filaments, error: fetchError } = await supabase
      .from('filaments')
      .select('id, product_title, product_url, featured_image')
      .eq('vendor', 'MatterHackers')
      .is('featured_image', null)
      .not('product_url', 'is', null);

    if (fetchError) {
      throw new Error(`Failed to fetch filaments: ${fetchError.message}`);
    }

    console.log(`Found ${filaments?.length || 0} MatterHackers filaments to process`);

    if (!firecrawlApiKey) {
      return new Response(JSON.stringify({ error: 'Firecrawl API key not configured' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const firecrawl = new FirecrawlApp({ apiKey: firecrawlApiKey });
    const results: Array<{ id: string; title: string; status: string; image?: string }> = [];

    for (const filament of filaments || []) {
      try {
        // Skip URLs with placeholder SKUs
        if (filament.product_url?.includes('/sk/MDEFAULT')) {
          console.log(`Skipping ${filament.product_title} - placeholder URL`);
          results.push({ id: filament.id, title: filament.product_title, status: 'skipped - placeholder URL' });
          continue;
        }

        console.log(`Scraping ${filament.product_title}: ${filament.product_url}`);

        const scrapeResult = await firecrawl.scrapeUrl(filament.product_url, {
          formats: ['html'],
          waitFor: 2000,
        });

        if (!scrapeResult.success) {
          console.log(`Failed to scrape ${filament.product_title}`);
          results.push({ id: filament.id, title: filament.product_title, status: 'scrape failed' });
          continue;
        }

        const html = scrapeResult.html || '';
        
        // Extract product image from MatterHackers page
        // MatterHackers uses Google CDN (lh3.googleusercontent.com) for product images
        let imageUrl: string | null = null;

        // Pattern 1: Google CDN images (lh3.googleusercontent.com) - main product images
        const googleCdnMatch = html.match(/["'](https:\/\/lh3\.googleusercontent\.com\/[^"'\s]+)["']/i);
        if (googleCdnMatch) {
          imageUrl = googleCdnMatch[1];
          // Clean up any HTML entities
          imageUrl = imageUrl.replace(/&amp;/g, '&');
        }

        // Pattern 2: og:image meta tag as fallback
        if (!imageUrl) {
          const ogImageMatch = html.match(/<meta[^>]*property=["']og:image["'][^>]*content=["']([^"']+)["']/i);
          if (ogImageMatch) {
            imageUrl = ogImageMatch[1];
          }
        }

        // Pattern 3: data-src with Google CDN
        if (!imageUrl) {
          const dataSrcMatch = html.match(/data-src=["'](https:\/\/lh3\.googleusercontent\.com\/[^"'\s]+)["']/i);
          if (dataSrcMatch) {
            imageUrl = dataSrcMatch[1].replace(/&amp;/g, '&');
          }
        }

        if (imageUrl) {
          // Clean up the URL
          if (imageUrl.startsWith('//')) {
            imageUrl = 'https:' + imageUrl;
          }
          
          // Update the filament record
          const { error: updateError } = await supabase
            .from('filaments')
            .update({ featured_image: imageUrl })
            .eq('id', filament.id);

          if (updateError) {
            console.log(`Failed to update ${filament.product_title}: ${updateError.message}`);
            results.push({ id: filament.id, title: filament.product_title, status: 'update failed', image: imageUrl });
          } else {
            console.log(`Updated ${filament.product_title} with image: ${imageUrl}`);
            results.push({ id: filament.id, title: filament.product_title, status: 'success', image: imageUrl });
          }
        } else {
          console.log(`No image found for ${filament.product_title}`);
          results.push({ id: filament.id, title: filament.product_title, status: 'no image found' });
        }

        // Small delay between requests
        await new Promise(resolve => setTimeout(resolve, 1000));

      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : String(err);
        console.error(`Error processing ${filament.product_title}:`, err);
        results.push({ id: filament.id, title: filament.product_title, status: `error: ${errorMsg}` });
      }
    }

    const summary = {
      total: results.length,
      success: results.filter(r => r.status === 'success').length,
      failed: results.filter(r => r.status !== 'success' && r.status !== 'skipped - placeholder URL').length,
      skipped: results.filter(r => r.status === 'skipped - placeholder URL').length,
      results
    };

    return new Response(JSON.stringify(summary), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    console.error('Error:', error);
    return new Response(JSON.stringify({ error: errorMsg }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
