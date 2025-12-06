import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import FirecrawlApp from "https://esm.sh/@mendable/firecrawl-js@4.8.1?bundle-deps&no-dts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Verify admin access
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Missing authorization header" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const firecrawlApiKey = Deno.env.get("FIRECRAWL_API_KEY");

    const authClient = createClient(supabaseUrl, supabaseServiceKey);
    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: userError } = await authClient.auth.getUser(token);

    if (userError || !user) {
      return new Response(JSON.stringify({ error: "Invalid token" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: roleData } = await authClient.rpc("has_role", { _role: "admin", _user_id: user.id });
    if (!roleData) {
      return new Response(JSON.stringify({ error: "Admin access required" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!firecrawlApiKey) {
      return new Response(JSON.stringify({ error: "FIRECRAWL_API_KEY not configured" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Fetch all Overture filaments
    const { data: filaments, error: fetchError } = await supabase
      .from("filaments")
      .select("id, product_title, product_url, featured_image")
      .ilike("vendor", "%overture%")
      .not("product_url", "is", null);

    if (fetchError) {
      throw new Error(`Failed to fetch filaments: ${fetchError.message}`);
    }

    console.log(`Found ${filaments?.length || 0} Overture filaments to process`);

    const firecrawl = new FirecrawlApp({ apiKey: firecrawlApiKey });
    const results: Array<{ id: string; title: string; status: string; image?: string }> = [];

    for (const filament of filaments || []) {
      try {
        if (!filament.product_url) {
          results.push({ id: filament.id, title: filament.product_title, status: "skipped - no URL" });
          continue;
        }

        console.log(`Scraping: ${filament.product_url}`);

        // Scrape the product page
        const scrapeResult = await firecrawl.scrape(filament.product_url, {
          formats: ["html"],
          waitFor: 2000,
        });

        if (!scrapeResult.success || !scrapeResult.html) {
          results.push({ id: filament.id, title: filament.product_title, status: "scrape failed" });
          continue;
        }

        // Extract the first product image from Shopify CDN
        const html = scrapeResult.html;
        
        // Look for Shopify product images - typically in og:image or product gallery
        const patterns = [
          // Open Graph image (usually the main product image)
          /property="og:image"\s+content="([^"]+)"/i,
          /content="([^"]+)"\s+property="og:image"/i,
          // Shopify product image patterns
          /data-zoom="([^"]+overture3d\.com\/cdn\/shop\/[^"]+)"/i,
          /src="(https:\/\/overture3d\.com\/cdn\/shop\/(?:files|products)\/[^"?\s]+\.(jpg|png|webp)[^"]*)"[^>]*class="[^"]*product/i,
          /srcset="([^"\s]+overture3d\.com\/cdn\/shop\/[^"\s]+)"/i,
          /<img[^>]+src="(https:\/\/overture3d\.com\/cdn\/shop\/(?:files|products)\/[^"]+)"/gi,
        ];

        let imageUrl: string | null = null;

        for (const pattern of patterns) {
          const match = html.match(pattern);
          if (match && match[1]) {
            let url = match[1];
            // Clean up Shopify CDN URL - remove width parameters to get full size
            url = url.split("?")[0];
            if (url.includes("overture3d.com/cdn/shop")) {
              imageUrl = url;
              break;
            }
          }
        }

        // Fallback: find any Shopify CDN image
        if (!imageUrl) {
          const allImagesMatch = html.match(/https:\/\/overture3d\.com\/cdn\/shop\/(?:files|products)\/[^"'\s]+\.(jpg|png|webp)/gi);
          if (allImagesMatch && allImagesMatch.length > 0) {
            // Filter out small thumbnails and icons
            const validImages = allImagesMatch.filter((url: string) => 
              !url.includes("icon") && 
              !url.includes("logo") && 
              !url.includes("32x32") &&
              !url.includes("_small") &&
              !url.includes("_thumb")
            );
            if (validImages.length > 0) {
              imageUrl = validImages[0].split("?")[0];
            }
          }
        }

        if (!imageUrl) {
          results.push({ id: filament.id, title: filament.product_title, status: "no image found" });
          continue;
        }

        // Update the filament with the new image
        const { error: updateError } = await supabase
          .from("filaments")
          .update({ featured_image: imageUrl })
          .eq("id", filament.id);

        if (updateError) {
          results.push({ id: filament.id, title: filament.product_title, status: `update failed: ${updateError.message}` });
        } else {
          results.push({ id: filament.id, title: filament.product_title, status: "updated", image: imageUrl });
          console.log(`Updated ${filament.product_title} with image: ${imageUrl}`);
        }

        // Small delay between requests
        await new Promise(resolve => setTimeout(resolve, 500));
      } catch (error: unknown) {
        console.error(`Error processing ${filament.product_title}:`, error);
        const errorMessage = error instanceof Error ? error.message : String(error);
        results.push({ id: filament.id, title: filament.product_title, status: `error: ${errorMessage}` });
      }
    }

    const updated = results.filter(r => r.status === "updated").length;
    const failed = results.filter(r => r.status !== "updated" && r.status !== "skipped - no URL").length;

    return new Response(
      JSON.stringify({
        success: true,
        total: filaments?.length || 0,
        updated,
        failed,
        results,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: unknown) {
    console.error("Error:", error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
