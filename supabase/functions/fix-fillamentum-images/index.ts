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
    
    // Scrape the collection page
    const collectionUrl = "https://fillamentumusa.com/collections/pla-extrafill-filament";
    console.log(`Scraping collection: ${collectionUrl}`);

    const scrapeResult = await firecrawl.scrapeUrl(collectionUrl, {
      formats: ["html"],
      waitFor: 5000,
    });

    if (!scrapeResult.success || !scrapeResult.html) {
      throw new Error("Failed to scrape collection page");
    }

    const html = scrapeResult.html;
    console.log(`HTML length: ${html.length}`);

    // Extract all products from the collection page
    // Pattern: href="...products/pla-extrafill-COLOR..."
    const productBlocks: ProductData[] = [];
    
    // Match product blocks with their images
    const blockRegex = /<div class="product-block[^"]*"[^>]*>[\s\S]*?<a[^>]*href="([^"]*products\/pla-extrafill[^"]*)"[^>]*>[\s\S]*?data-srcset="([^"]+)"[\s\S]*?<a[^>]*class="product-block__title-link"[^>]*>([^<]+)<\/a>/gi;
    
    let match;
    while ((match = blockRegex.exec(html)) !== null) {
      const productUrl = match[1];
      const srcset = match[2];
      const title = match[3].trim();
      
      // Extract color from URL slug (e.g., pla-extrafill-traffic-white -> traffic white)
      const slugMatch = productUrl.match(/pla-extrafill-([^-?/]+(?:-[^-?/]+)*?)(?:-us)?(?:\?|$|\/)/i);
      const colorKey = slugMatch ? slugMatch[1].replace(/-/g, " ").toLowerCase() : "";
      
      // Get highest resolution image from srcset
      const imageUrls = srcset.split(",").map(s => s.trim().split(" ")[0]);
      const bestImage = imageUrls.find(url => url.includes("1080x") || url.includes("900x") || url.includes("720x")) || imageUrls[0];
      let imageUrl = bestImage?.startsWith("//") ? "https:" + bestImage : bestImage;
      
      // Remove size constraints to get full resolution
      if (imageUrl) {
        imageUrl = imageUrl.replace(/_\d+x\.jpg/, ".jpg");
      }
      
      if (colorKey && imageUrl) {
        productBlocks.push({ title, colorKey, productUrl, imageUrl });
        console.log(`Found product: "${title}" -> color key: "${colorKey}"`);
      }
    }

    console.log(`Extracted ${productBlocks.length} products from collection`);

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
