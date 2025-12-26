import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

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

    // Fetch Printed Solid filaments with product URLs
    const { data: filaments, error: fetchError } = await supabase
      .from('filaments')
      .select('id, product_title, product_url, product_handle, vendor, featured_image')
      .eq('vendor', 'Printed Solid')
      .not('product_url', 'is', null);

    if (fetchError) {
      throw new Error(`Failed to fetch filaments: ${fetchError.message}`);
    }

    console.log(`Found ${filaments?.length || 0} Printed Solid filaments to process`);

    const results: any[] = [];
    let processed = 0;
    let updated = 0;

    for (const filament of filaments || []) {
      if (!filament.product_url) continue;

      // Skip if already has image
      if (filament.featured_image && filament.featured_image.includes('cdn.shopify.com')) {
        results.push({ id: filament.id, title: filament.product_title, status: 'skipped', reason: 'Already has image' });
        continue;
      }

      console.log(`Processing: ${filament.product_title}`);
      processed++;

      try {
        // Extract product handle from URL
        let handle = filament.product_handle;
        if (!handle) {
          const urlMatch = filament.product_url.match(/\/products\/([^/?#]+)/);
          if (urlMatch) {
            handle = urlMatch[1];
          }
        }

        if (!handle) {
          console.log(`No handle found for ${filament.product_title}`);
          results.push({ id: filament.id, title: filament.product_title, status: 'error', error: 'No product handle' });
          continue;
        }

        // Fetch product JSON from Shopify API
        const productUrl = `https://www.printedsolid.com/products/${handle}.json`;
        console.log(`Fetching: ${productUrl}`);
        
        const response = await fetch(productUrl, {
          headers: {
            'Accept': 'application/json',
            'User-Agent': 'Mozilla/5.0 (compatible; FilaScopeBot/1.0)',
          },
        });

        if (!response.ok) {
          console.error(`Failed to fetch ${handle}: ${response.status}`);
          results.push({ id: filament.id, title: filament.product_title, status: 'error', error: `HTTP ${response.status}` });
          continue;
        }

        const data = await response.json();
        const product = data.product;

        if (!product) {
          console.log(`No product data for ${filament.product_title}`);
          results.push({ id: filament.id, title: filament.product_title, status: 'error', error: 'No product data' });
          continue;
        }

        // Extract image URL - prefer first image
        let imageUrl: string | null = null;
        if (product.images && product.images.length > 0) {
          imageUrl = product.images[0].src;
          console.log(`Found image for ${filament.product_title}: ${imageUrl?.substring(0, 60)}...`);
        }

        // Try to find color-matching image from variants
        if (product.variants && product.variants.length > 0) {
          const filamentTitleLower = filament.product_title.toLowerCase();
          
          // Look for variant that matches the filament title
          for (const variant of product.variants) {
            if (variant.featured_image?.src) {
              const variantTitle = (variant.title || '').toLowerCase();
              if (filamentTitleLower.includes(variantTitle) || variantTitle.includes('default')) {
                imageUrl = variant.featured_image.src;
                console.log(`Found variant image for ${filament.product_title}: ${imageUrl?.substring(0, 60)}...`);
                break;
              }
            }
          }
        }

        // Update the filament record
        if (imageUrl) {
          const { error: updateError } = await supabase
            .from('filaments')
            .update({ featured_image: imageUrl })
            .eq('id', filament.id);

          if (updateError) {
            console.error(`Update error for ${filament.product_title}: ${updateError.message}`);
            results.push({ id: filament.id, title: filament.product_title, status: 'error', error: updateError.message });
          } else {
            console.log(`Updated ${filament.product_title} with image`);
            updated++;
            results.push({ 
              id: filament.id, 
              title: filament.product_title, 
              status: 'updated',
              image: imageUrl,
            });
          }
        } else {
          console.log(`No image found for ${filament.product_title}`);
          results.push({ id: filament.id, title: filament.product_title, status: 'no_image' });
        }

        // Rate limiting - 500ms between requests
        await new Promise(resolve => setTimeout(resolve, 500));

      } catch (error) {
        console.error(`Error processing ${filament.product_title}:`, error);
        results.push({ id: filament.id, title: filament.product_title, status: 'error', error: String(error) });
      }
    }

    return new Response(JSON.stringify({
      success: true,
      processed,
      updated,
      skipped: results.filter(r => r.status === 'skipped').length,
      results,
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in scrape-printedsolid-images:', error);
    return new Response(JSON.stringify({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
