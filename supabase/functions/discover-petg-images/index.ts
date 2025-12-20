import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// PETG product configurations with their color mappings
const PETG_PRODUCTS = [
  {
    slug: "petg-hf",
    url: "https://ca.store.bambulab.com/products/petg-hf",
    colors: ["Black", "White", "Red", "Gray", "Dark Gray", "Cream", "Yellow", "Orange", "Peanut Brown", "Lime Green", "Green", "Forest Green", "Lake Blue", "Blue"],
  },
  {
    slug: "petg-translucent",
    url: "https://ca.store.bambulab.com/products/petg-translucent",
    colors: ["Translucent Teal", "Translucent Light Blue", "Clear", "Translucent Gray", "Translucent Olive", "Translucent Brown", "Translucent Orange", "Translucent Pink", "Translucent Purple"],
  },
  {
    slug: "petg-cf",
    url: "https://ca.store.bambulab.com/products/petg-cf",
    colors: ["Black"],
  },
];

// Convert color name to URL-friendly format for matching
function normalizeColorName(name: string): string {
  return name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const firecrawlApiKey = Deno.env.get("FIRECRAWL_API_KEY");

    if (!firecrawlApiKey) {
      return new Response(JSON.stringify({ error: "FIRECRAWL_API_KEY not configured" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Parse request body
    let options: { dryRun?: boolean; updateDatabase?: boolean; productSlug?: string } = {};
    try {
      options = await req.json();
    } catch {
      // Use defaults
    }
    
    const dryRun = options.dryRun ?? true;
    const updateDatabase = options.updateDatabase ?? false;
    const targetProduct = options.productSlug;

    console.log(`Starting PETG image discovery (dryRun: ${dryRun}, updateDatabase: ${updateDatabase})`);

    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const results: Record<string, any> = {};

    const productsToProcess = targetProduct 
      ? PETG_PRODUCTS.filter(p => p.slug === targetProduct)
      : PETG_PRODUCTS;

    for (const product of productsToProcess) {
      console.log(`\nProcessing ${product.slug}...`);
      
      // Scrape each color variant page to get the s5/default image
      const colorImages: Record<string, string | null> = {};
      
      // First, scrape the main product page to get variant IDs
      console.log(`Scraping ${product.url} with Firecrawl...`);
      
      const mainPageResponse = await fetch("https://api.firecrawl.dev/v1/scrape", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${firecrawlApiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          url: product.url,
          formats: ["html"],
          onlyMainContent: false,
          waitFor: 5000, // Wait for dynamic content to load
        }),
      });

      if (!mainPageResponse.ok) {
        const errorText = await mainPageResponse.text();
        console.error(`Firecrawl error for ${product.slug}:`, errorText);
        results[product.slug] = { error: `Firecrawl failed: ${mainPageResponse.status}` };
        continue;
      }

      const mainPageData = await mainPageResponse.json();
      const html = mainPageData.data?.html || mainPageData.html || "";
      
      console.log(`Received ${html.length} characters of HTML for ${product.slug}`);

      // Extract s5/default image URLs from the HTML
      // Pattern: https://store.bblcdn.com/s5/default/{32-char-hash}.jpg
      const s5ImagePattern = /https:\/\/store\.bblcdn\.com\/s5\/default\/[a-f0-9]{32}\.(?:jpg|png|jpeg)/gi;
      const matchedS5Urls: string[] = (html.match(s5ImagePattern) || []) as string[];
      const uniqueS5Urls: string[] = [...new Set(matchedS5Urls)];
      
      console.log(`Found ${uniqueS5Urls.length} unique s5/default image URLs for ${product.slug}`);

      // Also try to extract variant data from the page JSON
      // Look for patterns like: "id":46336540803312 with associated images
      const variantPattern = /["']id["']\s*:\s*(\d+)/g;
      const variantIds: string[] = [];
      let match;
      while ((match = variantPattern.exec(html)) !== null) {
        if (match[1].length > 10) { // Shopify variant IDs are long
          variantIds.push(match[1]);
        }
      }
      console.log(`Found ${variantIds.length} potential variant IDs`);

      // Try to match images to colors based on proximity in HTML
      // This is a heuristic approach - look for color names near image URLs
      for (const color of product.colors) {
        const normalizedColor = normalizeColorName(color);
        
        // Search for the color name in the HTML and find nearby s5 images
        const colorPattern = new RegExp(color.replace(/\s+/g, '\\s*'), 'gi');
        const colorMatches = [...html.matchAll(colorPattern)];
        
        if (colorMatches.length > 0) {
          // For each color match, look for the nearest s5 image URL
          for (const colorMatch of colorMatches) {
            const startPos = Math.max(0, colorMatch.index! - 2000);
            const endPos = Math.min(html.length, colorMatch.index! + 2000);
            const nearbyHtml = html.substring(startPos, endPos);
            
            const nearbyS5Match = nearbyHtml.match(s5ImagePattern);
            if (nearbyS5Match && nearbyS5Match[0]) {
              colorImages[color] = nearbyS5Match[0];
              console.log(`Matched ${color} -> ${nearbyS5Match[0]}`);
              break;
            }
          }
        }
        
        if (!colorImages[color]) {
          colorImages[color] = null;
        }
      }

      results[product.slug] = {
        url: product.url,
        colorsExpected: product.colors.length,
        s5ImagesFound: uniqueS5Urls.length,
        colorImages,
        allS5Images: uniqueS5Urls,
        variantIds: variantIds.slice(0, 20),
      };

      // If we should update the database
      if (updateDatabase && !dryRun) {
        for (const [colorName, imageUrl] of Object.entries(colorImages)) {
          if (!imageUrl) continue;
          
          // Find matching filaments in the database
          const searchTitle = `%${product.slug.replace(/-/g, '%')}%${colorName.replace(/\s+/g, '%')}%`;
          
          const { data: filaments, error: findError } = await supabase
            .from("filaments")
            .select("id, product_title, featured_image")
            .ilike("vendor", "%bambu%")
            .ilike("product_title", `%${colorName}%`)
            .ilike("product_title", `%PETG%`);

          if (findError) {
            console.error(`Error finding filaments for ${colorName}:`, findError.message);
            continue;
          }

          for (const filament of filaments || []) {
            // Only update if image is missing or is a broken s7 URL
            if (!filament.featured_image || filament.featured_image.includes('/s7/default/')) {
              const { error: updateError } = await supabase
                .from("filaments")
                .update({ featured_image: imageUrl })
                .eq("id", filament.id);

              if (updateError) {
                console.error(`Failed to update ${filament.product_title}:`, updateError.message);
              } else {
                console.log(`Updated ${filament.product_title} with s5 image`);
              }
            }
          }
        }
      }

      // Add a small delay between products to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    const response = {
      success: true,
      dryRun,
      updateDatabase,
      results,
    };

    return new Response(JSON.stringify(response, null, 2), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error: unknown) {
    console.error("Error in discover-petg-images:", error);
    const message = error instanceof Error ? error.message : String(error);
    return new Response(JSON.stringify({ success: false, error: message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
