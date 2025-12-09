import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import FirecrawlApp from "https://esm.sh/@mendable/firecrawl-js@1.8.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface ProductData {
  title: string;
  colorKey: string;
  productUrl: string;
  imageUrl: string | null;
}

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

    console.log("=== FILLAMENTUM IMAGE FIX ===");

    // Fetch Fillamentum filaments missing images
    const { data: filaments, error: fetchError } = await supabase
      .from("filaments")
      .select("id, product_title")
      .eq("vendor", "Fillamentum")
      .is("featured_image", null);

    if (fetchError) {
      throw new Error(`Failed to fetch filaments: ${fetchError.message}`);
    }

    console.log(`Found ${filaments?.length || 0} Fillamentum filaments missing images`);

    if (!filaments || filaments.length === 0) {
      return new Response(JSON.stringify({
        success: true,
        message: "No Fillamentum filaments need image fixes",
        stats: { processed: 0, updated: 0, errors: 0 }
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const firecrawl = new FirecrawlApp({ apiKey: firecrawlApiKey });
    
    // Try multiple collection URLs for different material types
    const collectionUrls = [
      "https://shop.fillamentum.com/en-us/collections/pla-extrafill-filament",
      "https://shop.fillamentum.com/en-us/collections/asa-extrafill",
      "https://shop.fillamentum.com/en-us/collections/petg",
      "https://shop.fillamentum.com/en-us/collections/cpe-hg100",
      "https://shop.fillamentum.com/en-us/collections/flexfill",
      "https://shop.fillamentum.com/en-us/collections/nylon-cf15-carbon",
    ];
    
    const productBlocks: ProductData[] = [];
    
    for (const collectionUrl of collectionUrls) {
      console.log(`Scraping collection: ${collectionUrl}`);

      try {
        const scrapeResult = await firecrawl.scrapeUrl(collectionUrl, {
          formats: ["html"],
          waitFor: 3000,
        });

        if (!scrapeResult.success || !scrapeResult.html) {
          console.log(`Failed to scrape ${collectionUrl}`);
          continue;
        }

        const html = scrapeResult.html;
        console.log(`HTML length: ${html.length}`);

        // Extract product cards - look for product images and links
        // Pattern 1: Shopify product grid with srcset images
        const imgRegex = /<a[^>]*href="([^"]*\/products\/[^"]+)"[^>]*>[\s\S]*?<img[^>]*(?:src|data-src)="([^"]+)"[^>]*>/gi;
        
        let match;
        while ((match = imgRegex.exec(html)) !== null) {
          const productUrl = match[1];
          let imageUrl = match[2];
          
          // Clean up image URL
          if (imageUrl.startsWith("//")) {
            imageUrl = "https:" + imageUrl;
          }
          
          // Extract color from URL slug
          const slugMatch = productUrl.match(/\/products\/([^?/]+)/i);
          const slug = slugMatch ? slugMatch[1] : "";
          const colorKey = slug.replace(/-filament.*$/i, "").replace(/-/g, " ").toLowerCase();
          
          if (colorKey && imageUrl && !productBlocks.some(p => p.colorKey === colorKey)) {
            productBlocks.push({ 
              title: colorKey, 
              colorKey, 
              productUrl: productUrl.startsWith("http") ? productUrl : "https://shop.fillamentum.com" + productUrl, 
              imageUrl 
            });
            console.log(`Found product: "${colorKey}"`);
          }
        }

        // Pattern 2: Look for srcset patterns
        const srcsetRegex = /<a[^>]*href="([^"]*\/products\/[^"]+)"[^>]*>[\s\S]*?data-srcset="([^"]+)"/gi;
        while ((match = srcsetRegex.exec(html)) !== null) {
          const productUrl = match[1];
          const srcset = match[2];
          
          // Get best image from srcset
          const images = srcset.split(",").map(s => s.trim().split(" ")[0]);
          let imageUrl = images.find(u => u.includes("800x") || u.includes("600x") || u.includes("400x")) || images[0];
          
          if (imageUrl?.startsWith("//")) {
            imageUrl = "https:" + imageUrl;
          }
          
          const slugMatch = productUrl.match(/\/products\/([^?/]+)/i);
          const slug = slugMatch ? slugMatch[1] : "";
          const colorKey = slug.replace(/-filament.*$/i, "").replace(/-/g, " ").toLowerCase();
          
          if (colorKey && imageUrl && !productBlocks.some(p => p.colorKey === colorKey)) {
            productBlocks.push({ 
              title: colorKey, 
              colorKey, 
              productUrl: productUrl.startsWith("http") ? productUrl : "https://shop.fillamentum.com" + productUrl, 
              imageUrl 
            });
            console.log(`Found product (srcset): "${colorKey}"`);
          }
        }
      } catch (e) {
        console.error(`Error scraping ${collectionUrl}:`, e);
      }
    }

    console.log(`Extracted ${productBlocks.length} total products from collections`);

    // Match filaments to products
    let updated = 0;
    let errors = 0;
    const results: { id: string; title: string; status: string; image?: string | null }[] = [];

    for (const filament of filaments) {
      // Extract color from filament title
      const colorMatch = filament.product_title.match(/[-–]\s*(.+)$/);
      const colorName = colorMatch ? colorMatch[1].trim().toLowerCase() : "";
      
      console.log(`\nMatching: "${filament.product_title}" -> color: "${colorName}"`);
      
      // Find matching product
      let bestMatch: ProductData | null = null;
      let bestScore = 0;
      
      for (const product of productBlocks) {
        let score = 0;
        
        // Exact match
        if (product.colorKey === colorName.replace(/\s+/g, " ")) {
          score = 100;
        } else {
          // Word matching
          const colorWords = colorName.split(/[\s-]+/).filter((w: string) => w.length > 2);
          const productWords = product.colorKey.split(/[\s-]+/).filter((w: string) => w.length > 2);
          
          for (const word of colorWords) {
            if (productWords.includes(word)) {
              score += 20;
            } else if (product.colorKey.includes(word)) {
              score += 10;
            }
          }
          
          // Check title match
          const titleLower = product.title.toLowerCase();
          for (const word of colorWords) {
            if (titleLower.includes(word)) {
              score += 5;
            }
          }
        }
        
        if (score > bestScore) {
          bestScore = score;
          bestMatch = product;
        }
      }
      
      if (bestMatch && bestScore >= 20) {
        console.log(`✓ Matched to "${bestMatch.title}" (score: ${bestScore})`);
        
        // Update database
        const { error: updateError } = await supabase
          .from("filaments")
          .update({ 
            featured_image: bestMatch.imageUrl,
            product_url: bestMatch.productUrl.startsWith("http") ? bestMatch.productUrl : "https://fillamentumusa.com" + bestMatch.productUrl
          })
          .eq("id", filament.id);

        if (updateError) {
          console.log(`✗ DB update failed: ${updateError.message}`);
          results.push({ id: filament.id, title: filament.product_title, status: "db_error" });
          errors++;
        } else {
          results.push({ id: filament.id, title: filament.product_title, status: "updated", image: bestMatch.imageUrl });
          updated++;
        }
      } else {
        console.log(`✗ No match found (best score: ${bestScore})`);
        results.push({ id: filament.id, title: filament.product_title, status: "no_match" });
        errors++;
      }
    }

    console.log(`\n=== COMPLETE ===`);
    console.log(`Updated: ${updated}, Errors: ${errors}`);

    return new Response(JSON.stringify({
      success: true,
      stats: {
        processed: filaments.length,
        products_found: productBlocks.length,
        updated,
        errors,
      },
      results
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error) {
    console.error("Error:", error);
    return new Response(JSON.stringify({ error: String(error) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
