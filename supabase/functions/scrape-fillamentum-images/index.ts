import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import FirecrawlApp from "https://esm.sh/@mendable/firecrawl-js@1.8.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
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
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const firecrawlApiKey = Deno.env.get("FIRECRAWL_API_KEY");

    const authClient = createClient(supabaseUrl, Deno.env.get("SUPABASE_ANON_KEY")!, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: { user }, error: userError } = await authClient.auth.getUser();
    if (userError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: isAdmin } = await authClient.rpc("has_role", { _user_id: user.id, _role: "admin" });
    if (!isAdmin) {
      return new Response(JSON.stringify({ error: "Admin access required" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { limit = 20, force = false } = await req.json().catch(() => ({}));

    console.log("=== FILLAMENTUM IMAGE SCRAPER ===");
    console.log(`Limit: ${limit}, Force: ${force}`);

    // Fetch Fillamentum filaments
    let query = supabase
      .from("filaments")
      .select("id, product_title, product_url, featured_image, color_family")
      .eq("vendor", "Fillamentum")
      .not("product_url", "is", null);

    if (!force) {
      query = query.is("featured_image", null);
    }

    const { data: filaments, error: fetchError } = await query.limit(limit);

    if (fetchError) {
      throw new Error(`Failed to fetch filaments: ${fetchError.message}`);
    }

    console.log(`Found ${filaments?.length || 0} Fillamentum filaments to process`);

    if (!filaments || filaments.length === 0) {
      return new Response(JSON.stringify({
        success: true,
        message: "No Fillamentum filaments need image scraping",
        stats: { processed: 0, updated: 0, errors: 0 }
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const firecrawl = new FirecrawlApp({ apiKey: firecrawlApiKey });
    const results: { id: string; title: string; status: string; image?: string }[] = [];
    let updated = 0;
    let errors = 0;

    // Group filaments by product URL to batch scrape collection pages
    const urlGroups = new Map<string, typeof filaments>();
    for (const f of filaments) {
      const url = f.product_url!;
      if (!urlGroups.has(url)) {
        urlGroups.set(url, []);
      }
      urlGroups.get(url)!.push(f);
    }

    console.log(`Processing ${urlGroups.size} unique collection URLs`);

    for (const [collectionUrl, filamentsInGroup] of urlGroups) {
      console.log(`\n--- Scraping collection: ${collectionUrl} ---`);
      console.log(`Contains ${filamentsInGroup.length} filaments`);

      try {
        // Scrape the collection page
        const scrapeResult = await firecrawl.scrapeUrl(collectionUrl, {
          formats: ["html"],
          waitFor: 3000,
        });

        if (!scrapeResult.success || !scrapeResult.html) {
          console.log(`Failed to scrape ${collectionUrl}`);
          for (const f of filamentsInGroup) {
            results.push({ id: f.id, title: f.product_title, status: "scrape_failed" });
            errors++;
          }
          continue;
        }

        const html = scrapeResult.html;
        console.log(`HTML length: ${html.length}`);

        // Extract all product images from the collection
        const imageMatches = html.matchAll(/<img[^>]+src=["']([^"']+)["'][^>]*>/gi);
        const allImages: string[] = [];

        for (const match of imageMatches) {
          let imgUrl = match[1];
          if (imgUrl.startsWith("//")) imgUrl = "https:" + imgUrl;
          if (imgUrl.startsWith("/")) imgUrl = new URL(imgUrl, collectionUrl).href;
          
          // Filter for product images (Shopify CDN patterns)
          if (imgUrl.includes("cdn.shopify.com") && 
              imgUrl.includes("/files/") &&
              !imgUrl.includes("logo") &&
              !imgUrl.includes("icon") &&
              !imgUrl.includes("badge") &&
              !imgUrl.includes("flag")) {
            // Get highest resolution
            const highResUrl = imgUrl.replace(/(_\d+x\d+|_small|_medium|_large|_grande|_compact)/gi, "");
            if (!allImages.includes(highResUrl)) {
              allImages.push(highResUrl);
            }
          }
        }

        console.log(`Found ${allImages.length} product images in collection`);

        // Also try to extract from srcset
        const srcsetMatches = html.matchAll(/srcset=["']([^"']+)["']/gi);
        for (const match of srcsetMatches) {
          const srcset = match[1];
          const urls = srcset.split(",").map(s => s.trim().split(" ")[0]);
          for (let imgUrl of urls) {
            if (imgUrl.startsWith("//")) imgUrl = "https:" + imgUrl;
            if (imgUrl.includes("cdn.shopify.com") && imgUrl.includes("/files/")) {
              const highResUrl = imgUrl.replace(/(_\d+x\d+|_small|_medium|_large|_grande|_compact)/gi, "");
              if (!allImages.includes(highResUrl)) {
                allImages.push(highResUrl);
              }
            }
          }
        }

        console.log(`Total unique images after srcset: ${allImages.length}`);

        // Try to match images to filaments based on color name
        for (const filament of filamentsInGroup) {
          const colorName = extractColorFromTitle(filament.product_title);
          console.log(`\nLooking for image for: ${filament.product_title} (color: ${colorName})`);

          // Find best matching image
          let bestImage: string | null = null;
          let bestScore = 0;

          for (const imgUrl of allImages) {
            const imgLower = imgUrl.toLowerCase();
            const colorLower = colorName.toLowerCase().replace(/[^a-z0-9]/g, "");
            
            let score = 0;
            
            // Check if color appears in image URL
            if (imgLower.includes(colorLower)) {
              score += 10;
            }
            
            // Check for partial color matches
            const colorWords = colorName.toLowerCase().split(/[\s-]+/);
            for (const word of colorWords) {
              if (word.length > 2 && imgLower.includes(word)) {
                score += 3;
              }
            }

            // Prefer larger images
            if (imgLower.includes("1024") || imgLower.includes("2048")) {
              score += 2;
            }

            if (score > bestScore) {
              bestScore = score;
              bestImage = imgUrl;
            }
          }

          // If no color match, use first product image as fallback
          if (!bestImage && allImages.length > 0) {
            bestImage = allImages[0];
            console.log(`No color match, using first image as fallback`);
          }

          if (bestImage) {
            console.log(`✓ Found image (score: ${bestScore}): ${bestImage.substring(0, 80)}...`);
            
            // Update database
            const { error: updateError } = await supabase
              .from("filaments")
              .update({ featured_image: bestImage })
              .eq("id", filament.id);

            if (updateError) {
              console.log(`✗ DB update failed: ${updateError.message}`);
              results.push({ id: filament.id, title: filament.product_title, status: "db_error" });
              errors++;
            } else {
              results.push({ id: filament.id, title: filament.product_title, status: "updated", image: bestImage });
              updated++;
            }
          } else {
            console.log(`✗ No image found`);
            results.push({ id: filament.id, title: filament.product_title, status: "no_image" });
            errors++;
          }
        }

        // Small delay between collection pages
        await new Promise(r => setTimeout(r, 1000));

      } catch (err) {
        console.error(`Error processing ${collectionUrl}:`, err);
        for (const f of filamentsInGroup) {
          results.push({ id: f.id, title: f.product_title, status: "error", image: String(err) });
          errors++;
        }
      }
    }

    console.log(`\n=== COMPLETE ===`);
    console.log(`Updated: ${updated}, Errors: ${errors}`);

    return new Response(JSON.stringify({
      success: true,
      stats: {
        processed: filaments.length,
        updated,
        errors,
        collections_scraped: urlGroups.size
      },
      results
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error) {
    console.error("Scraper error:", error);
    return new Response(JSON.stringify({ error: String(error) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

function extractColorFromTitle(title: string): string {
  // Extract color from titles like "Fillamentum PLA Extrafill - Traffic Black"
  const dashMatch = title.match(/[-–]\s*(.+)$/);
  if (dashMatch) {
    return dashMatch[1].trim();
  }
  return title;
}
