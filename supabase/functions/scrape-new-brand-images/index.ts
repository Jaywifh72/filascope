import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";
import FirecrawlApp from "https://esm.sh/@mendable/firecrawl-js@1.16.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "No authorization header" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const firecrawlKey = Deno.env.get("FIRECRAWL_API_KEY");

    const authClient = createClient(supabaseUrl, supabaseKey);
    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await authClient.auth.getUser(token);

    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: hasRole } = await authClient.rpc("has_role", {
      _user_id: user.id,
      _role: "admin",
    });

    if (!hasRole) {
      return new Response(JSON.stringify({ error: "Admin access required" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { brands, limit = 50, force = false } = await req.json();

    const targetBrands = brands || ["VoxelPLA", "3DFuel", "Eryone", "Inland", "Fiberlogy", "Ziro", "Paramount 3D"];

    // Fetch filaments - either all or only those missing images
    let query = authClient
      .from("filaments")
      .select("id, product_title, vendor, product_url, featured_image")
      .in("vendor", targetBrands);
    
    if (!force) {
      query = query.or("featured_image.is.null,featured_image.not.ilike.https://%");
    }
    
    const { data: filaments, error: fetchError } = await query.limit(limit);

    if (fetchError) {
      throw new Error(`Failed to fetch filaments: ${fetchError.message}`);
    }

    console.log(`Found ${filaments?.length || 0} filaments needing images`);

    const results: { id: string; title: string; status: string; image?: string }[] = [];

    if (!firecrawlKey) {
      return new Response(JSON.stringify({ 
        error: "FIRECRAWL_API_KEY not configured",
        filaments_found: filaments?.length || 0
      }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const firecrawl = new FirecrawlApp({ apiKey: firecrawlKey });

    for (const filament of filaments || []) {
      if (!filament.product_url) {
        results.push({ id: filament.id, title: filament.product_title, status: "no_url" });
        continue;
      }

      try {
        console.log(`Scraping: ${filament.product_title} from ${filament.product_url}`);

        const scrapeResult = await firecrawl.scrapeUrl(filament.product_url, {
          formats: ["html"],
          waitFor: 2000,
        });

        if (!scrapeResult.success || !scrapeResult.html) {
          results.push({ id: filament.id, title: filament.product_title, status: "scrape_failed" });
          continue;
        }

        // Extract product images from HTML
        const imageUrl = extractProductImage(scrapeResult.html, filament.vendor, filament.product_url);

        if (imageUrl) {
          // Update the filament with the new image
          const { error: updateError } = await authClient
            .from("filaments")
            .update({ featured_image: imageUrl })
            .eq("id", filament.id);

          if (updateError) {
            results.push({ id: filament.id, title: filament.product_title, status: "update_failed" });
          } else {
            results.push({ id: filament.id, title: filament.product_title, status: "success", image: imageUrl });
          }
        } else {
          results.push({ id: filament.id, title: filament.product_title, status: "no_image_found" });
        }

        // Small delay between requests
        await new Promise(resolve => setTimeout(resolve, 500));

      } catch (error) {
        console.error(`Error scraping ${filament.product_title}:`, error);
        results.push({ id: filament.id, title: filament.product_title, status: "error" });
      }
    }

    const successCount = results.filter(r => r.status === "success").length;

    return new Response(JSON.stringify({
      total: filaments?.length || 0,
      success: successCount,
      failed: (filaments?.length || 0) - successCount,
      results
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error: unknown) {
    console.error("Error:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

function extractProductImage(html: string, vendor: string, productUrl: string): string | null {
  const imgPatterns: RegExp[] = [];
  
  // Brand-specific patterns
  if (vendor === "VoxelPLA") {
    imgPatterns.push(/src=["'](https:\/\/voxelpla\.com\/cdn\/[^"']+\.(?:jpg|png|webp)[^"']*)["']/gi);
  } else if (vendor === "3DFuel") {
    imgPatterns.push(/src=["'](https:\/\/cdn\.shopify\.com\/s\/files\/[^"']+3dfuel[^"']*\.(?:jpg|png|webp)[^"']*)["']/gi);
    imgPatterns.push(/src=["'](https:\/\/www\.3dfuel\.com\/cdn\/[^"']+\.(?:jpg|png|webp)[^"']*)["']/gi);
  } else if (vendor === "Eryone") {
    imgPatterns.push(/src=["'](https:\/\/eryone3d\.com\/cdn\/[^"']+\.(?:jpg|png|webp)[^"']*)["']/gi);
    imgPatterns.push(/src=["'](https:\/\/cdn\.shopify\.com\/s\/files\/[^"']+eryone[^"']*\.(?:jpg|png|webp)[^"']*)["']/gi);
  } else if (vendor === "Fiberlogy") {
    imgPatterns.push(/src=["'](https:\/\/fiberlogy\.com\/cdn\/[^"']+\.(?:jpg|png|webp)[^"']*)["']/gi);
    imgPatterns.push(/src=["'](https:\/\/cdn\.shopify\.com\/s\/files\/[^"']+fiberlogy[^"']*\.(?:jpg|png|webp)[^"']*)["']/gi);
  }

  // Generic Shopify pattern
  imgPatterns.push(/src=["'](https:\/\/cdn\.shopify\.com\/s\/files\/[^"']+\/products\/[^"']+\.(?:jpg|png|webp)[^"']*)["']/gi);
  
  // Amazon pattern
  if (productUrl.includes("amazon.com")) {
    imgPatterns.push(/src=["'](https:\/\/m\.media-amazon\.com\/images\/I\/[^"']+\.(?:jpg|png)[^"']*)["']/gi);
  }

  // Generic og:image pattern
  imgPatterns.push(/property=["']og:image["'][^>]*content=["']([^"']+)["']/gi);
  imgPatterns.push(/content=["']([^"']+)["'][^>]*property=["']og:image["']/gi);

  // Generic product image patterns
  imgPatterns.push(/src=["'](https?:\/\/[^"']+\/products\/[^"']+\.(?:jpg|png|webp)[^"']*)["']/gi);
  imgPatterns.push(/data-src=["'](https?:\/\/[^"']+\.(?:jpg|png|webp)[^"']*)["']/gi);

  for (const pattern of imgPatterns) {
    const matches = [...html.matchAll(pattern)];
    for (const match of matches) {
      const url = match[1];
      // Filter out small icons, logos, etc.
      if (url && !isExcludedImage(url)) {
        return cleanImageUrl(url);
      }
    }
  }

  return null;
}

function isExcludedImage(url: string): boolean {
  const excludePatterns = [
    /logo/i,
    /icon/i,
    /favicon/i,
    /badge/i,
    /button/i,
    /banner/i,
    /sprite/i,
    /thumbnail/i,
    /avatar/i,
    /flag/i,
    /payment/i,
    /trust/i,
    /seal/i,
    /rating/i,
    /star/i,
    /cart/i,
    /checkout/i,
    /50x50/i,
    /100x100/i,
    /32x32/i,
    /16x16/i,
  ];

  return excludePatterns.some(pattern => pattern.test(url));
}

function cleanImageUrl(url: string): string {
  // Remove size constraints from Shopify URLs to get full size
  let cleanUrl = url.replace(/_\d+x\d+(@\dx)?\./, '.');
  cleanUrl = cleanUrl.replace(/\?v=\d+$/, '');
  
  // Ensure https
  if (cleanUrl.startsWith('//')) {
    cleanUrl = 'https:' + cleanUrl;
  }
  
  return cleanUrl;
}
