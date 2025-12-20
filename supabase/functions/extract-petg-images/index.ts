import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Known PETG product configurations
const PETG_PRODUCTS = {
  "petg-hf": {
    url: "https://ca.store.bambulab.com/products/petg-hf",
    colors: [
      "Black", "White", "Red", "Gray", "Dark Gray", "Cream", "Yellow", 
      "Orange", "Peanut Brown", "Lime Green", "Green", "Forest Green", 
      "Lake Blue", "Blue"
    ]
  },
  "petg-translucent": {
    url: "https://ca.store.bambulab.com/products/petg-translucent",
    colors: [
      "Translucent Teal", "Translucent Light Blue", "Clear", "Translucent Gray",
      "Translucent Olive", "Translucent Brown", "Translucent Orange", 
      "Translucent Pink", "Translucent Purple"
    ]
  },
  "petg-cf": {
    url: "https://ca.store.bambulab.com/products/petg-cf",
    colors: ["Black"]
  }
};

// Extract variant data from page HTML/JSON
function extractVariantImages(html: string, productSlug: string): Record<string, string> {
  const results: Record<string, string> = {};
  
  console.log(`[${productSlug}] Starting image extraction from HTML (${html.length} chars)`);
  
  // Pattern 1: Look for __NEXT_DATA__ containing product variants
  const nextDataMatch = html.match(/<script\s+id="__NEXT_DATA__"[^>]*>([\s\S]*?)<\/script>/i);
  if (nextDataMatch) {
    try {
      const nextData = JSON.parse(nextDataMatch[1]);
      console.log(`[${productSlug}] Found __NEXT_DATA__, checking for pageProps`);
      
      // Navigate to product data
      const pageProps = nextData?.props?.pageProps;
      if (pageProps?.product) {
        const variants = pageProps.product.variants || [];
        console.log(`[${productSlug}] Found ${variants.length} variants in __NEXT_DATA__`);
        
        for (const variant of variants) {
          const colorOption = variant.selectedOptions?.find((opt: any) => 
            opt.name?.toLowerCase() === 'color'
          );
          if (colorOption && variant.image?.url) {
            const colorName = colorOption.value;
            const imageUrl = variant.image.url;
            if (imageUrl.includes('s5/default') || imageUrl.includes('bblcdn.com')) {
              results[colorName] = imageUrl;
              console.log(`[${productSlug}] Found variant image: ${colorName} -> ${imageUrl.substring(0, 60)}...`);
            }
          }
        }
      }
    } catch (e) {
      console.error(`[${productSlug}] Failed to parse __NEXT_DATA__:`, e);
    }
  }
  
  // Pattern 2: Look for variant images in embedded JSON structures
  const jsonPatterns = [
    /"variants":\s*\[([\s\S]*?)\]/g,
    /"images":\s*\[([\s\S]*?)\]/g,
    /"media":\s*\[([\s\S]*?)\]/g,
  ];
  
  for (const pattern of jsonPatterns) {
    const matches = html.matchAll(pattern);
    for (const match of matches) {
      try {
        // Look for s5/default URLs in this JSON block
        const s5Matches = match[0].matchAll(/https:\/\/store\.bblcdn\.com\/s5\/default\/[a-f0-9]+\.jpg/g);
        for (const s5Match of s5Matches) {
          const imageUrl = s5Match[0];
          // Try to find associated color name nearby
          const colorMatch = match[0].match(/"(?:color|title|name)":\s*"([^"]+)"/i);
          if (colorMatch) {
            const colorName = colorMatch[1];
            if (!results[colorName]) {
              results[colorName] = imageUrl;
              console.log(`[${productSlug}] Pattern 2 found: ${colorName} -> ${imageUrl.substring(0, 60)}...`);
            }
          }
        }
      } catch (e) {
        // Continue with other patterns
      }
    }
  }
  
  // Pattern 3: Direct s5/default URL extraction with nearby color text
  const s5ImageMatches = html.matchAll(/https:\/\/store\.bblcdn\.com\/s5\/default\/([a-f0-9]{32})\.jpg/g);
  const s5Images: string[] = [];
  for (const match of s5ImageMatches) {
    const url = match[0];
    if (!s5Images.includes(url)) {
      s5Images.push(url);
    }
  }
  console.log(`[${productSlug}] Found ${s5Images.length} unique s5/default images`);
  
  // Pattern 4: Look for productVariants or similar structures
  const productVariantsMatch = html.match(/"productVariants":\s*(\[[\s\S]*?\])/);
  if (productVariantsMatch) {
    try {
      const variants = JSON.parse(productVariantsMatch[1]);
      console.log(`[${productSlug}] Found productVariants: ${variants.length} items`);
      for (const variant of variants) {
        if (variant.color && variant.image) {
          const imageUrl = typeof variant.image === 'string' ? variant.image : variant.image.url;
          if (imageUrl && (imageUrl.includes('s5/default') || imageUrl.includes('bblcdn.com'))) {
            results[variant.color] = imageUrl;
            console.log(`[${productSlug}] Pattern 4 found: ${variant.color} -> ${imageUrl.substring(0, 60)}...`);
          }
        }
      }
    } catch (e) {
      console.error(`[${productSlug}] Failed to parse productVariants:`, e);
    }
  }
  
  // Pattern 5: Extract from window.__INITIAL_STATE__ or similar
  const initialStateMatch = html.match(/window\.__INITIAL_STATE__\s*=\s*({[\s\S]*?});/);
  if (initialStateMatch) {
    try {
      const state = JSON.parse(initialStateMatch[1]);
      console.log(`[${productSlug}] Found __INITIAL_STATE__`);
      // Recursively search for variant/image pairs
      const searchForVariants = (obj: any, depth = 0): void => {
        if (depth > 5 || !obj) return;
        if (Array.isArray(obj)) {
          obj.forEach(item => searchForVariants(item, depth + 1));
        } else if (typeof obj === 'object') {
          // Check if this object has color and image properties
          if (obj.color && obj.image) {
            const imageUrl = typeof obj.image === 'string' ? obj.image : obj.image?.url;
            if (imageUrl?.includes('s5/default') || imageUrl?.includes('bblcdn.com')) {
              results[obj.color] = imageUrl;
            }
          }
          Object.values(obj).forEach(val => searchForVariants(val, depth + 1));
        }
      };
      searchForVariants(state);
    } catch (e) {
      console.error(`[${productSlug}] Failed to parse __INITIAL_STATE__:`, e);
    }
  }
  
  return results;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const FIRECRAWL_API_KEY = Deno.env.get("FIRECRAWL_API_KEY");
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!FIRECRAWL_API_KEY) {
      return new Response(
        JSON.stringify({ success: false, error: "FIRECRAWL_API_KEY not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const body = await req.json().catch(() => ({}));
    const { 
      dryRun = true, 
      updateDatabase = false,
      productSlug = null // Optional: specific product to scrape
    } = body;

    console.log(`Starting PETG image extraction (dryRun=${dryRun}, updateDatabase=${updateDatabase})`);

    const allResults: Record<string, Record<string, string>> = {};
    const errors: string[] = [];
    
    // Determine which products to scrape
    const productsToScrape = productSlug 
      ? { [productSlug]: PETG_PRODUCTS[productSlug as keyof typeof PETG_PRODUCTS] }
      : PETG_PRODUCTS;

    for (const [slug, config] of Object.entries(productsToScrape)) {
      if (!config) {
        errors.push(`Unknown product slug: ${slug}`);
        continue;
      }
      
      console.log(`\n========== Scraping ${slug} ==========`);
      console.log(`URL: ${config.url}`);
      
      try {
        // Use Firecrawl to get the rendered page HTML
        const response = await fetch("https://api.firecrawl.dev/v1/scrape", {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${FIRECRAWL_API_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            url: config.url,
            formats: ["html", "rawHtml"],
            waitFor: 3000, // Wait 3 seconds for JS to render
            onlyMainContent: false,
          }),
        });

        if (!response.ok) {
          const errorText = await response.text();
          console.error(`[${slug}] Firecrawl error: ${response.status} - ${errorText}`);
          errors.push(`${slug}: Firecrawl error ${response.status}`);
          continue;
        }

        const data = await response.json();
        const html = data.data?.rawHtml || data.data?.html || data.rawHtml || data.html || "";
        
        console.log(`[${slug}] Got HTML response: ${html.length} characters`);
        
        // Extract variant images from the HTML
        const variantImages = extractVariantImages(html, slug);
        
        console.log(`[${slug}] Extracted ${Object.keys(variantImages).length} variant images`);
        
        allResults[slug] = variantImages;
        
        // Add delay between requests
        await new Promise(resolve => setTimeout(resolve, 1500));
        
      } catch (e) {
        const errorMsg = e instanceof Error ? e.message : String(e);
        console.error(`[${slug}] Error:`, errorMsg);
        errors.push(`${slug}: ${errorMsg}`);
      }
    }

    // Generate the code output for PRODUCT_COLOR_FALLBACKS
    console.log("\n\n========== CODE OUTPUT ==========");
    console.log("// Add these image URLs to PRODUCT_COLOR_FALLBACKS in scrape-bambu-pla/index.ts:");
    console.log("");
    
    for (const [slug, images] of Object.entries(allResults)) {
      if (Object.keys(images).length > 0) {
        console.log(`// ${slug}:`);
        for (const [color, url] of Object.entries(images)) {
          console.log(`  { colorName: "${color}", imageUrl: "${url}" },`);
        }
        console.log("");
      }
    }
    
    // Update database if requested
    let dbUpdates = 0;
    if (updateDatabase && !dryRun && SUPABASE_URL && SUPABASE_SERVICE_ROLE_KEY) {
      const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
      
      for (const [slug, images] of Object.entries(allResults)) {
        const productConfig = PETG_PRODUCTS[slug as keyof typeof PETG_PRODUCTS];
        if (!productConfig) continue;
        
        for (const [colorName, imageUrl] of Object.entries(images)) {
          // Find the filament in the database by matching product title and color
          const { data: filaments, error } = await supabase
            .from('filaments')
            .select('id, product_title, featured_image')
            .ilike('product_title', `%${colorName}%`)
            .or(`product_url.ilike.%${slug}%,product_handle.eq.${slug}`)
            .limit(5);
          
          if (error) {
            console.error(`DB query error for ${slug}/${colorName}:`, error);
            continue;
          }
          
          if (filaments && filaments.length > 0) {
            for (const filament of filaments) {
              // Only update if no existing image or if we have a better one
              if (!filament.featured_image || filament.featured_image.includes('placeholder')) {
                const { error: updateError } = await supabase
                  .from('filaments')
                  .update({ 
                    featured_image: imageUrl,
                    updated_at: new Date().toISOString()
                  })
                  .eq('id', filament.id);
                
                if (!updateError) {
                  dbUpdates++;
                  console.log(`Updated featured_image for ${filament.product_title}`);
                }
              }
            }
          }
        }
      }
    }

    const result = {
      success: true,
      dryRun,
      updateDatabase,
      productsScraped: Object.keys(allResults).length,
      imagesFound: Object.values(allResults).reduce((acc, images) => acc + Object.keys(images).length, 0),
      dbUpdates,
      results: allResults,
      errors: errors.length > 0 ? errors : undefined,
      codeOutput: Object.entries(allResults).map(([slug, images]) => ({
        slug,
        entries: Object.entries(images).map(([color, url]) => ({
          colorName: color,
          imageUrl: url
        }))
      }))
    };

    console.log("\n========== SUMMARY ==========");
    console.log(JSON.stringify({ ...result, results: "see codeOutput" }, null, 2));

    return new Response(
      JSON.stringify(result),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
    
  } catch (error) {
    console.error("Unhandled error:", error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error instanceof Error ? error.message : String(error) 
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
