import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { sanitizeIlikeInput } from "../_shared/sanitize-input.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Known color mappings to help match image filenames to color names
const COLOR_NAME_PATTERNS: Record<string, string[]> = {
  "Olive": ["olive", "oliv"],
  "Tangerine Yellow": ["tangerine", "yellow"],
  "Azure": ["azure"],
  "Navy Blue": ["navy", "navyblue"],
  "White": ["white"],
  "Silver": ["silver"],
  "Red": ["red"],
  "Orange": ["orange"],
  "Bambu Green": ["bambugreen", "green"],
  "Blue": ["blue"],
  "Purple": ["purple"],
  "Black": ["black"],
};

// Already known image URLs - we'll skip these
const KNOWN_IMAGE_URLS: Record<string, string> = {
  "Silver": "https://store.bblcdn.com/s7/default/69834a7536c540e489913a0f8e707e5e/ABSsilver.png",
  "Black": "https://store.bblcdn.com/s7/default/cfdefec225e6430c82cbe2f8766b6f70/ABS_Black.png",
  "White": "https://store.bblcdn.com/s7/default/1ad485ff4a72413b90e944ffde4fa861/ABS_White.png",
  "Bambu Green": "https://store.bblcdn.com/s7/default/910be80e4fcf43ddbd66c40773ecce0f/ABSbambugreen.png",
  "Orange": "https://store.bblcdn.com/s5/default/af10bba0ddcb4d129125f0b1b3f04e59.png",
  "Red": "https://store.bblcdn.com/s7/default/95bd38c6dc604bdab7b3d2fc7b67e0ee/ABS_Red.png",
  "Blue": "https://store.bblcdn.com/s7/default/3b2f526b80734e429d9a424e07f3c36b/ABS_Blue.png",
};

// Colors we need to discover
const COLORS_TO_DISCOVER = ["Olive", "Tangerine Yellow", "Azure", "Navy Blue", "Purple"];

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

    if (!firecrawlApiKey) {
      return new Response(JSON.stringify({ error: "FIRECRAWL_API_KEY not configured" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

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

    // Parse request body
    let options: { dryRun?: boolean; updateDatabase?: boolean } = {};
    try {
      options = await req.json();
    } catch {
      // Use defaults
    }
    
    const dryRun = options.dryRun ?? true;
    const updateDatabase = options.updateDatabase ?? false;

    console.log(`Starting Bambu Lab image discovery (dryRun: ${dryRun}, updateDatabase: ${updateDatabase})`);

    // Use Firecrawl to scrape the product page
    const productUrl = "https://us.store.bambulab.com/products/abs-filament";
    
    console.log(`Scraping ${productUrl} with Firecrawl...`);
    
    const firecrawlResponse = await fetch("https://api.firecrawl.dev/v1/scrape", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${firecrawlApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        url: productUrl,
        formats: ["html", "markdown"],
        onlyMainContent: false,
        waitFor: 3000, // Wait for dynamic content
      }),
    });

    if (!firecrawlResponse.ok) {
      const errorText = await firecrawlResponse.text();
      console.error("Firecrawl error:", errorText);
      throw new Error(`Firecrawl request failed: ${firecrawlResponse.status}`);
    }

    const firecrawlData = await firecrawlResponse.json();
    const html = firecrawlData.data?.html || firecrawlData.html || "";
    
    console.log(`Received ${html.length} characters of HTML`);

    // Extract all image URLs from the HTML
    const imageUrlPattern = /https:\/\/store\.bblcdn\.com\/s[0-9]+\/default\/[a-f0-9]+\/[^"'\s<>]+\.(?:png|jpg|jpeg|webp)/gi;
    const matchedUrls = html.match(imageUrlPattern) || [];
    const allImageUrls: string[] = [...new Set(matchedUrls)] as string[];
    
    console.log(`Found ${allImageUrls.length} unique bblcdn image URLs`);

    // Filter to ABS-related images
    const absImageUrls = allImageUrls.filter((url) => 
      url.toLowerCase().includes("abs") || 
      url.toLowerCase().includes("spool") ||
      url.toLowerCase().includes("filament")
    );

    console.log(`Filtered to ${absImageUrls.length} ABS-related image URLs`);

    // Try to match images to missing colors
    const discoveredImages: Record<string, string> = {};
    const unmatchedImages: string[] = [];

    for (const imageUrl of absImageUrls) {
      const urlString = imageUrl as string;
      const filename = urlString.split("/").pop()?.toLowerCase() || "";
      let matched = false;

      for (const colorName of COLORS_TO_DISCOVER) {
        // Skip if already discovered or known
        if (discoveredImages[colorName] || KNOWN_IMAGE_URLS[colorName]) {
          continue;
        }

        const patterns = COLOR_NAME_PATTERNS[colorName] || [];
        for (const pattern of patterns) {
          if (filename.includes(pattern.toLowerCase())) {
            discoveredImages[colorName] = urlString;
            matched = true;
            console.log(`Matched ${colorName} -> ${urlString}`);
            break;
          }
        }
        if (matched) break;
      }

      if (!matched && !Object.values(KNOWN_IMAGE_URLS).includes(urlString)) {
        unmatchedImages.push(urlString);
      }
    }

    // If we found images and should update the database
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const updates: Array<{ color: string; imageUrl: string; filamentId?: string; updated: boolean }> = [];

    if (updateDatabase && !dryRun && Object.keys(discoveredImages).length > 0) {
      for (const [colorName, imageUrl] of Object.entries(discoveredImages)) {
        // Find the filament in the database
        const { data: filament, error: findError } = await supabase
          .from("filaments")
          .select("id, product_title")
          .eq("vendor", "Bambu Lab")
          .ilike("product_title", `%ABS%${sanitizeIlikeInput(colorName)}%`)
          .single();

        if (findError || !filament) {
          console.log(`Filament not found for color: ${colorName}`);
          updates.push({ color: colorName, imageUrl, updated: false });
          continue;
        }

        // Update the featured_image
        const { error: updateError } = await supabase
          .from("filaments")
          .update({ featured_image: imageUrl })
          .eq("id", filament.id);

        if (updateError) {
          console.error(`Failed to update ${colorName}:`, updateError.message);
          updates.push({ color: colorName, imageUrl, filamentId: filament.id, updated: false });
        } else {
          console.log(`Updated ${filament.product_title} with image: ${imageUrl}`);
          updates.push({ color: colorName, imageUrl, filamentId: filament.id, updated: true });
        }
      }
    }

    const result = {
      success: true,
      dryRun,
      updateDatabase,
      scrapedUrl: productUrl,
      totalImagesFound: allImageUrls.length,
      absImagesFound: absImageUrls.length,
      colorsToDiscover: COLORS_TO_DISCOVER,
      discoveredImages,
      knownImages: KNOWN_IMAGE_URLS,
      unmatchedImages: unmatchedImages.slice(0, 20), // Limit for readability
      updates: updateDatabase ? updates : undefined,
      allAbsImages: absImageUrls, // Include all for manual review
    };

    console.log(`Discovery complete. Found ${Object.keys(discoveredImages).length} new color mappings`);

    return new Response(JSON.stringify(result, null, 2), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error: unknown) {
    console.error("Error in discover-bambulab-images:", error);
    const message = error instanceof Error ? error.message : String(error);
    return new Response(JSON.stringify({ success: false, error: message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
