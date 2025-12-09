import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Brand-specific configurations for finding product URLs
const BRAND_CONFIGS: Record<string, {
  searchUrl?: (query: string) => string;
  collectionsUrl?: string;
  shopifyStore?: string;
  urlPattern?: RegExp;
}> = {
  "3DXTech": {
    shopifyStore: "https://www.3dxtech.com",
    collectionsUrl: "https://www.3dxtech.com/collections/all.json",
  },
  "Polymaker": {
    shopifyStore: "https://us.polymaker.com",
    collectionsUrl: "https://us.polymaker.com/collections/all.json",
  },
  "Prusament": {
    shopifyStore: "https://www.prusa3d.com",
  },
  "eSUN": {
    shopifyStore: "https://www.esun3d.com",
    collectionsUrl: "https://www.esun3d.com/collections/all.json",
  },
  "Hatchbox": {
    shopifyStore: "https://www.hatchbox3d.com",
    collectionsUrl: "https://www.hatchbox3d.com/collections/all.json",
  },
  "Overture": {
    shopifyStore: "https://overture3d.com",
    collectionsUrl: "https://overture3d.com/collections/all.json",
  },
  "Sunlu": {
    shopifyStore: "https://www.sunlu.com",
  },
  "Amolen": {
    shopifyStore: "https://amolen.com",
    collectionsUrl: "https://amolen.com/collections/all.json",
  },
  "Fillamentum": {
    shopifyStore: "https://fillamentum.com",
    collectionsUrl: "https://fillamentum.com/collections/all.json",
  },
  "ColorFabb": {
    shopifyStore: "https://colorfabb.com",
  },
  "MatterHackers": {
    shopifyStore: "https://www.matterhackers.com",
  },
  "Paramount 3D": {
    shopifyStore: "https://www.paramount-3d.com",
    collectionsUrl: "https://www.paramount-3d.com/collections/all.json",
  },
  "3D-Fuel": {
    shopifyStore: "https://www.3dfuel.com",
    collectionsUrl: "https://www.3dfuel.com/collections/all.json",
  },
  "NinjaTek": {
    shopifyStore: "https://ninjatek.com",
    collectionsUrl: "https://ninjatek.com/collections/all.json",
  },
  "Fiberlogy": {
    shopifyStore: "https://fiberlogy.com",
  },
  "Atomic Filament": {
    shopifyStore: "https://atomicfilament.com",
    collectionsUrl: "https://atomicfilament.com/collections/all.json",
  },
  "Proto-Pasta": {
    shopifyStore: "https://www.proto-pasta.com",
    collectionsUrl: "https://www.proto-pasta.com/collections/all.json",
  },
  "Taulman3D": {
    shopifyStore: "https://taulman3d.com",
  },
  "ZIRO": {
    shopifyStore: "https://ziro3d.com",
    collectionsUrl: "https://ziro3d.com/collections/all.json",
  },
  "VoxelPLA": {
    shopifyStore: "https://voxelpla.com",
    collectionsUrl: "https://voxelpla.com/collections/all.json",
  },
};

// Normalize text for matching
function normalizeText(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

// Calculate similarity score between two strings
function calculateSimilarity(str1: string, str2: string): number {
  const words1 = new Set(normalizeText(str1).split(" ").filter(w => w.length > 2));
  const words2 = new Set(normalizeText(str2).split(" ").filter(w => w.length > 2));
  
  if (words1.size === 0 || words2.size === 0) return 0;
  
  let matches = 0;
  words1.forEach(word => {
    if (words2.has(word)) matches++;
  });
  
  return matches / Math.max(words1.size, words2.size);
}

// Try to find product in Shopify collections
async function findInShopifyCollections(
  collectionsUrl: string,
  productTitle: string,
  baseUrl: string
): Promise<string | null> {
  try {
    console.log(`Searching Shopify collections: ${collectionsUrl}`);
    
    const response = await fetch(collectionsUrl, {
      headers: { "Accept": "application/json" },
    });
    
    if (!response.ok) {
      console.log(`Collections fetch failed: ${response.status}`);
      return null;
    }
    
    const data = await response.json();
    const products = data.products || [];
    
    console.log(`Found ${products.length} products in collection`);
    
    let bestMatch: { url: string; score: number } | null = null;
    
    for (const product of products) {
      const score = calculateSimilarity(productTitle, product.title);
      
      if (score > 0.5 && (!bestMatch || score > bestMatch.score)) {
        bestMatch = {
          url: `${baseUrl}/products/${product.handle}`,
          score,
        };
      }
    }
    
    if (bestMatch) {
      console.log(`Best match found: ${bestMatch.url} (score: ${bestMatch.score})`);
      return bestMatch.url;
    }
    
    return null;
  } catch (error) {
    console.error("Error searching Shopify collections:", error);
    return null;
  }
}

// Try to find product using web search via Firecrawl
async function findViaWebSearch(
  vendor: string,
  productTitle: string,
  firecrawlApiKey: string
): Promise<string | null> {
  try {
    const searchQuery = `${vendor} ${productTitle} buy`;
    console.log(`Web search query: ${searchQuery}`);
    
    const response = await fetch("https://api.firecrawl.dev/v1/search", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${firecrawlApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        query: searchQuery,
        limit: 5,
      }),
    });
    
    if (!response.ok) {
      console.log(`Web search failed: ${response.status}`);
      return null;
    }
    
    const data = await response.json();
    const results = data.data || [];
    
    console.log(`Web search returned ${results.length} results`);
    
    // Look for official store URLs
    const brandConfig = BRAND_CONFIGS[vendor];
    const storeHost = brandConfig?.shopifyStore 
      ? new URL(brandConfig.shopifyStore).hostname 
      : null;
    
    for (const result of results) {
      const url = result.url;
      if (!url) continue;
      
      try {
        const urlHost = new URL(url).hostname;
        
        // Prefer official store URLs
        if (storeHost && urlHost.includes(storeHost.replace("www.", ""))) {
          // Check if it's a product page, not a collection
          if (url.includes("/products/") || url.includes("/product/")) {
            console.log(`Found official store product URL: ${url}`);
            return url;
          }
        }
      } catch {
        continue;
      }
    }
    
    return null;
  } catch (error) {
    console.error("Error in web search:", error);
    return null;
  }
}

// Validate that a URL returns 200
async function validateUrl(url: string): Promise<boolean> {
  try {
    const response = await fetch(url, {
      method: "HEAD",
      redirect: "follow",
    });
    return response.ok;
  } catch {
    return false;
  }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { filamentId, productTitle, vendor, currentUrl } = await req.json();

    if (!filamentId || !productTitle || !vendor) {
      return new Response(
        JSON.stringify({ success: false, error: "Missing required fields" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`\n=== Fixing URL for: ${productTitle} (${vendor}) ===`);
    console.log(`Current URL: ${currentUrl}`);

    const firecrawlApiKey = Deno.env.get("FIRECRAWL_API_KEY");
    let newUrl: string | null = null;

    // Strategy 1: Try Shopify collections if available
    const brandConfig = BRAND_CONFIGS[vendor];
    if (brandConfig?.collectionsUrl && brandConfig?.shopifyStore) {
      newUrl = await findInShopifyCollections(
        brandConfig.collectionsUrl,
        productTitle,
        brandConfig.shopifyStore
      );
    }

    // Strategy 2: Try web search via Firecrawl
    if (!newUrl && firecrawlApiKey) {
      newUrl = await findViaWebSearch(vendor, productTitle, firecrawlApiKey);
    }

    // Validate the found URL
    if (newUrl) {
      const isValid = await validateUrl(newUrl);
      if (!isValid) {
        console.log(`Found URL failed validation: ${newUrl}`);
        newUrl = null;
      }
    }

    // If we found a valid URL, update the database
    if (newUrl) {
      const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
      const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
      const supabase = createClient(supabaseUrl, supabaseKey);

      const { error: updateError } = await supabase
        .from("filaments")
        .update({ product_url: newUrl })
        .eq("id", filamentId);

      if (updateError) {
        console.error("Database update error:", updateError);
        return new Response(
          JSON.stringify({ 
            success: false, 
            error: "Found URL but failed to update database",
            foundUrl: newUrl 
          }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      console.log(`Successfully updated URL to: ${newUrl}`);
      return new Response(
        JSON.stringify({ 
          success: true, 
          newUrl,
          message: "URL fixed successfully" 
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Could not find a replacement URL
    console.log("Could not find a replacement URL");
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: "Could not find a valid replacement URL",
        searchedStrategies: [
          brandConfig?.collectionsUrl ? "Shopify Collections" : null,
          firecrawlApiKey ? "Web Search" : null,
        ].filter(Boolean)
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error: unknown) {
    console.error("Error fixing URL:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
