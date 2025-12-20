import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Known PETG product image mappings - extracted from Bambu Lab store
// These s5/default URLs are the actual product images shown on the store
const PETG_IMAGE_MAPPINGS: Record<string, Record<string, string>> = {
  "petg-hf": {
    "Black": "https://store.bblcdn.com/s5/default/6583fc4c677b47c78a79b5af54707241.jpg",
    "White": "",
    "Red": "",
    "Gray": "",
    "Dark Gray": "",
    "Cream": "",
    "Yellow": "",
    "Orange": "",
    "Peanut Brown": "",
    "Lime Green": "",
    "Green": "",
    "Forest Green": "",
    "Lake Blue": "",
    "Blue": "",
  },
  "petg-translucent": {
    "Translucent Teal": "",
    "Translucent Light Blue": "https://store.bblcdn.com/s5/default/2e8d7b9c2a4147da979f544f73f85fb5.jpg",
    "Clear": "",
    "Translucent Gray": "",
    "Translucent Olive": "",
    "Translucent Brown": "",
    "Translucent Orange": "",
    "Translucent Pink": "",
    "Translucent Purple": "",
  },
  "petg-cf": {
    "Black": "",
  },
};

// Try to extract image URLs from HTML by looking for embedded JSON data
function extractImagesFromHtml(html: string): { 
  s5Images: string[]; 
  s7Images: string[];
  jsonProductData: any[];
  variantImageMap: Record<string, string>;
} {
  const s5ImagePattern = /https:\/\/store\.bblcdn\.com\/s5\/default\/[a-f0-9]{32}\.(?:jpg|png|jpeg)/gi;
  const s7ImagePattern = /https:\/\/store\.bblcdn\.com\/s7\/default\/[a-f0-9]{32}\.(?:jpg|png|jpeg)/gi;
  
  const s5Images = [...new Set((html.match(s5ImagePattern) || []) as string[])];
  const s7Images = [...new Set((html.match(s7ImagePattern) || []) as string[])];
  
  // Try to find product JSON data in the page
  const jsonProductData: any[] = [];
  const variantImageMap: Record<string, string> = {};
  
  // Look for __NEXT_DATA__ or similar embedded JSON
  const nextDataMatch = html.match(/<script id="__NEXT_DATA__"[^>]*>([^<]+)<\/script>/);
  if (nextDataMatch) {
    try {
      const nextData = JSON.parse(nextDataMatch[1]);
      jsonProductData.push({ source: '__NEXT_DATA__', data: nextData });
      
      // Try to extract product variants with images
      const props = nextData?.props?.pageProps;
      if (props?.product?.variants) {
        for (const variant of props.product.variants) {
          if (variant.featured_image?.src) {
            const colorName = variant.title || variant.option1;
            variantImageMap[colorName] = variant.featured_image.src;
          }
        }
      }
    } catch (e) {
      console.log("Failed to parse __NEXT_DATA__:", e);
    }
  }
  
  // Look for window.__INITIAL_STATE__ or similar
  const initialStateMatch = html.match(/window\.__INITIAL_STATE__\s*=\s*(\{[^;]+\});/);
  if (initialStateMatch) {
    try {
      const state = JSON.parse(initialStateMatch[1]);
      jsonProductData.push({ source: '__INITIAL_STATE__', data: state });
    } catch (e) {
      console.log("Failed to parse __INITIAL_STATE__:", e);
    }
  }
  
  // Look for Shopify product JSON patterns
  const productJsonPatterns = [
    /var\s+product\s*=\s*(\{[^;]+\});/,
    /"product"\s*:\s*(\{[^\n]+\})/,
    /product_data\s*:\s*(\{[^}]+\})/,
  ];
  
  for (const pattern of productJsonPatterns) {
    const match = html.match(pattern);
    if (match) {
      try {
        const productData = JSON.parse(match[1]);
        jsonProductData.push({ source: 'product_var', data: productData });
      } catch (e) {
        // Ignore parse errors
      }
    }
  }
  
  // Look for image URLs associated with color codes in the HTML
  // Pattern: Look for structures like "32600" followed by or near an image URL
  const colorCodeImagePattern = /(\d{5})[^a-z0-9]*(?:[^"]*)"?(https:\/\/store\.bblcdn\.com\/s5\/default\/[a-f0-9]{32}\.jpg)/gi;
  let match;
  while ((match = colorCodeImagePattern.exec(html)) !== null) {
    variantImageMap[`code_${match[1]}`] = match[2];
  }
  
  return { s5Images, s7Images, jsonProductData, variantImageMap };
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

    let options: { 
      dryRun?: boolean; 
      updateDatabase?: boolean; 
      productSlug?: string;
      useKnownMappings?: boolean;
    } = {};
    try {
      options = await req.json();
    } catch {
      // Use defaults
    }
    
    const dryRun = options.dryRun ?? true;
    const updateDatabase = options.updateDatabase ?? false;
    const targetProduct = options.productSlug;
    const useKnownMappings = options.useKnownMappings ?? true;

    console.log(`Starting PETG image discovery (dryRun: ${dryRun}, updateDatabase: ${updateDatabase}, useKnownMappings: ${useKnownMappings})`);

    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const results: Record<string, any> = {};

    const productsToScrape = targetProduct 
      ? [targetProduct]
      : Object.keys(PETG_IMAGE_MAPPINGS);

    for (const productSlug of productsToScrape) {
      const colorMappings = PETG_IMAGE_MAPPINGS[productSlug] || {};
      const baseUrl = `https://ca.store.bambulab.com/products/${productSlug}`;
      
      console.log(`\nProcessing ${productSlug}...`);
      
      // First, try to scrape the product page to find any s5 images
      const scrapeResponse = await fetch("https://api.firecrawl.dev/v1/scrape", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${firecrawlApiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          url: baseUrl,
          formats: ["html", "rawHtml"],
          onlyMainContent: false,
          waitFor: 5000,
        }),
      });

      let extractedData: ReturnType<typeof extractImagesFromHtml> | null = null;
      
      if (scrapeResponse.ok) {
        const scrapeData = await scrapeResponse.json();
        const html = scrapeData.data?.html || scrapeData.data?.rawHtml || scrapeData.html || "";
        console.log(`Received ${html.length} characters of HTML for ${productSlug}`);
        
        extractedData = extractImagesFromHtml(html);
        console.log(`Extracted: ${extractedData.s5Images.length} s5 images, ${extractedData.s7Images.length} s7 images`);
        console.log(`Found variant mappings:`, Object.keys(extractedData.variantImageMap).length);
        
        if (extractedData.s5Images.length > 0) {
          console.log(`S5 images found:`, extractedData.s5Images);
        }
      } else {
        console.error(`Firecrawl failed for ${productSlug}:`, await scrapeResponse.text());
      }

      const colorResults: Record<string, { imageUrl: string | null; source: string; updated: boolean }> = {};

      // Process each color
      for (const [colorName, knownImageUrl] of Object.entries(colorMappings)) {
        let imageUrl: string | null = null;
        let source = "none";
        
        // Priority 1: Use known mapping if it exists and is not empty
        if (useKnownMappings && knownImageUrl) {
          imageUrl = knownImageUrl;
          source = "known_mapping";
        }
        
        // Priority 2: Try to find from extracted variant map
        if (!imageUrl && extractedData?.variantImageMap) {
          const directMatch = extractedData.variantImageMap[colorName];
          if (directMatch) {
            imageUrl = directMatch;
            source = "extracted_variant";
          }
        }
        
        // Priority 3: Use first s5 image as fallback (not ideal but better than nothing)
        if (!imageUrl && extractedData?.s5Images && extractedData.s5Images.length > 0) {
          // Only use if we have exactly one color or it's a unique product
          if (Object.keys(colorMappings).length === 1) {
            imageUrl = extractedData.s5Images[0];
            source = "single_s5_fallback";
          }
        }
        
        let updated = false;
        
        // Update database if we have an image
        if (updateDatabase && !dryRun && imageUrl) {
          const materialSearch = productSlug === "petg-cf" ? "PETG-CF" : 
                                 productSlug === "petg-translucent" ? "Translucent" : "PETG HF";
          
          const { data: filaments, error: findError } = await supabase
            .from("filaments")
            .select("id, product_title, featured_image")
            .ilike("vendor", "%bambu%")
            .ilike("product_title", `%${colorName}%`)
            .ilike("product_title", `%${materialSearch}%`);

          if (findError) {
            console.error(`Error finding filaments for ${colorName}:`, findError.message);
          } else if (filaments && filaments.length > 0) {
            for (const filament of filaments) {
              const { error: updateError } = await supabase
                .from("filaments")
                .update({ 
                  featured_image: imageUrl,
                  updated_at: new Date().toISOString()
                })
                .eq("id", filament.id);

              if (updateError) {
                console.error(`Failed to update ${filament.product_title}:`, updateError.message);
              } else {
                console.log(`✓ Updated ${filament.product_title} with image from ${source}`);
                updated = true;
              }
            }
          }
        }
        
        colorResults[colorName] = { imageUrl, source, updated };
      }

      results[productSlug] = {
        baseUrl,
        extractedS5Count: extractedData?.s5Images.length || 0,
        extractedS5Images: extractedData?.s5Images || [],
        extractedS7Count: extractedData?.s7Images.length || 0,
        variantMapKeys: Object.keys(extractedData?.variantImageMap || {}),
        colorResults,
      };

      // Rate limit between products
      await new Promise(resolve => setTimeout(resolve, 2000));
    }

    const response = {
      success: true,
      dryRun,
      updateDatabase,
      useKnownMappings,
      timestamp: new Date().toISOString(),
      results,
      note: "To add more known mappings, update PETG_IMAGE_MAPPINGS in the function code with s5/default URLs",
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
