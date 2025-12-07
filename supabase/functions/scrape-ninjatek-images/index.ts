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
    const firecrawlKey = Deno.env.get('FIRECRAWL_API_KEY');
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Fetch NinjaTek filaments with product URLs
    const { data: filaments, error: fetchError } = await supabase
      .from('filaments')
      .select('id, product_title, product_url, vendor')
      .eq('vendor', 'NinjaTek')
      .not('product_url', 'is', null);

    if (fetchError) {
      throw new Error(`Failed to fetch filaments: ${fetchError.message}`);
    }

    console.log(`Found ${filaments?.length || 0} NinjaTek filaments to process`);

    const results: any[] = [];

    for (const filament of filaments || []) {
      if (!filament.product_url) continue;

      console.log(`Processing: ${filament.product_title} - ${filament.product_url}`);

      try {
        // Use Firecrawl to scrape the product page
        const scrapeResponse = await fetch('https://api.firecrawl.dev/v1/scrape', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${firecrawlKey}`,
          },
          body: JSON.stringify({
            url: filament.product_url,
            formats: ['markdown', 'html'],
            onlyMainContent: true,
          }),
        });

        if (!scrapeResponse.ok) {
          console.error(`Firecrawl error for ${filament.product_title}: ${scrapeResponse.status}`);
          results.push({ id: filament.id, title: filament.product_title, status: 'error', error: 'Firecrawl request failed' });
          continue;
        }

        const scrapeData = await scrapeResponse.json();
        const html = scrapeData.data?.html || '';
        const markdown = scrapeData.data?.markdown || '';

        // Extract product image from HTML
        let imageUrl: string | null = null;
        
        // Look for product images in NinjaTek's HTML structure
        const imgPatterns = [
          /src="(https:\/\/ninjatek\.com\/wp-content\/uploads\/[^"]+\.(?:jpg|jpeg|png|webp))"/gi,
          /srcset="(https:\/\/ninjatek\.com\/wp-content\/uploads\/[^"\s]+\.(?:jpg|jpeg|png|webp))[^"]*"/gi,
          /<img[^>]+class="[^"]*woocommerce-product-gallery__image[^"]*"[^>]+src="([^"]+)"/gi,
          /data-large_image="([^"]+)"/gi,
        ];

        for (const pattern of imgPatterns) {
          const matches = html.matchAll(pattern);
          for (const match of matches) {
            const url = match[1];
            if (url && !url.includes('placeholder') && !url.includes('icon') && !url.includes('logo')) {
              // Prefer larger images
              if (!imageUrl || url.length > imageUrl.length) {
                imageUrl = url;
              }
            }
          }
          if (imageUrl) break;
        }

        // Extract price from markdown/HTML
        let price: number | null = null;
        const pricePatterns = [
          /\$(\d+(?:\.\d{2})?)/g,
          /Price:\s*\$(\d+(?:\.\d{2})?)/gi,
        ];

        for (const pattern of pricePatterns) {
          const match = pattern.exec(markdown);
          if (match) {
            const parsedPrice = parseFloat(match[1]);
            if (parsedPrice > 10 && parsedPrice < 200) { // Reasonable filament price range
              price = parsedPrice;
              break;
            }
          }
        }

        // Extract weight info
        let weight: number | null = null;
        const weightPatterns = [
          /(\d+(?:\.\d+)?)\s*(?:g|grams?)\b/gi,
          /(\d+(?:\.\d+)?)\s*(?:kg|kilogram)/gi,
        ];

        for (const pattern of weightPatterns) {
          const match = pattern.exec(markdown);
          if (match) {
            let parsedWeight = parseFloat(match[1]);
            if (pattern.source.includes('kg')) {
              parsedWeight = parsedWeight * 1000;
            }
            if (parsedWeight >= 100 && parsedWeight <= 5000) {
              weight = parsedWeight;
              break;
            }
          }
        }

        // Update the filament record
        const updateData: any = {};
        if (imageUrl) updateData.featured_image = imageUrl;
        if (price) updateData.variant_price = price;
        if (weight) updateData.net_weight_g = weight;

        if (Object.keys(updateData).length > 0) {
          const { error: updateError } = await supabase
            .from('filaments')
            .update(updateData)
            .eq('id', filament.id);

          if (updateError) {
            console.error(`Update error for ${filament.product_title}: ${updateError.message}`);
            results.push({ id: filament.id, title: filament.product_title, status: 'error', error: updateError.message });
          } else {
            console.log(`Updated ${filament.product_title}: image=${!!imageUrl}, price=${price}, weight=${weight}`);
            results.push({ 
              id: filament.id, 
              title: filament.product_title, 
              status: 'updated',
              image: imageUrl,
              price,
              weight,
            });
          }
        } else {
          console.log(`No data extracted for ${filament.product_title}`);
          results.push({ id: filament.id, title: filament.product_title, status: 'no_data' });
        }

        // Rate limiting
        await new Promise(resolve => setTimeout(resolve, 1000));

      } catch (error) {
        console.error(`Error processing ${filament.product_title}:`, error);
        results.push({ id: filament.id, title: filament.product_title, status: 'error', error: String(error) });
      }
    }

    return new Response(JSON.stringify({
      success: true,
      processed: results.length,
      updated: results.filter(r => r.status === 'updated').length,
      results,
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in scrape-ninjatek-images:', error);
    return new Response(JSON.stringify({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
