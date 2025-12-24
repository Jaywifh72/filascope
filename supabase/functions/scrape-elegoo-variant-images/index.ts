import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Regional store domains for Elegoo
const REGIONAL_STORES: Record<string, string> = {
  US: "https://elegoo.com",
  CA: "https://ca.elegoo.com",
  EU: "https://eu.elegoo.com",
  UK: "https://uk.elegoo.com",
  AU: "https://au.elegoo.com",
  DE: "https://de.elegoo.com",
  FR: "https://fr.elegoo.com",
  IT: "https://it.elegoo.com",
  ES: "https://es.elegoo.com",
};

// Extract product handle from Elegoo URL
function extractProductHandle(url: string): string | null {
  try {
    // Handle Impact affiliate URLs - extract the real URL from 'u' param
    if (url.includes("sjv.io") || url.includes("impact.com")) {
      const urlObj = new URL(url);
      const actualUrl = urlObj.searchParams.get("u");
      if (actualUrl) {
        url = decodeURIComponent(actualUrl);
      }
    }

    // Extract handle from URL like /products/abs-filament-1-75mm-colored-1kg
    const match = url.match(/\/products\/([^?#]+)/);
    return match ? match[1] : null;
  } catch (e) {
    console.error(`Failed to extract handle from URL: ${url}`, e);
    return null;
  }
}

// Extract color from product title (e.g., "ABS - Red" -> "Red")
function extractColorFromTitle(title: string): string | null {
  // Common patterns: "Material - Color", "Material Color", "Material (Color)"
  const patterns = [
    /\s*-\s*([A-Za-z\s]+)$/,           // "ABS - Red"
    /\s+\(([A-Za-z\s]+)\)$/,           // "ABS (Red)"
    /(?:PLA|ABS|PETG|TPU|ASA)\s+([A-Za-z\s]+)$/i,  // "ABS Red"
  ];

  for (const pattern of patterns) {
    const match = title.match(pattern);
    if (match && match[1]) {
      return match[1].trim();
    }
  }
  return null;
}

// Normalize color name for matching
function normalizeColor(color: string): string {
  return color.toLowerCase()
    .replace(/gray/g, "grey")
    .replace(/\s+/g, " ")
    .trim();
}

interface ShopifyVariant {
  id: number;
  title: string;
  option1: string | null;
  option2: string | null;
  option3: string | null;
  featured_image: {
    src: string;
  } | null;
}

interface ShopifyProduct {
  id: number;
  title: string;
  handle: string;
  variants: ShopifyVariant[];
  images: Array<{
    id: number;
    src: string;
    variant_ids: number[];
  }>;
}

// Fetch product data from Shopify JSON API
async function fetchShopifyProduct(storeUrl: string, handle: string): Promise<ShopifyProduct | null> {
  const url = `${storeUrl}/products/${handle}.json`;
  console.log(`[SCRAPE-IMAGES] Fetching: ${url}`);

  try {
    const response = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; FilascopeBot/1.0)",
        "Accept": "application/json",
      },
    });

    if (!response.ok) {
      console.error(`[SCRAPE-IMAGES] Failed to fetch ${url}: ${response.status}`);
      return null;
    }

    const data = await response.json();
    return data.product as ShopifyProduct;
  } catch (e) {
    console.error(`[SCRAPE-IMAGES] Error fetching ${url}:`, e);
    return null;
  }
}

// Find the best image for a variant by color name
function findVariantImage(product: ShopifyProduct, colorName: string): string | null {
  const normalizedColor = normalizeColor(colorName);

  // First, try to find a variant with a matching title that has an image
  for (const variant of product.variants) {
    const variantTitle = variant.title || variant.option1 || "";
    if (normalizeColor(variantTitle) === normalizedColor) {
      // Check if variant has a featured_image
      if (variant.featured_image?.src) {
        return variant.featured_image.src;
      }

      // Look for an image associated with this variant ID
      const variantImage = product.images.find(img => 
        img.variant_ids.includes(variant.id)
      );
      if (variantImage) {
        return variantImage.src;
      }
    }
  }

  // Second pass: partial matching
  for (const variant of product.variants) {
    const variantTitle = normalizeColor(variant.title || variant.option1 || "");
    if (variantTitle.includes(normalizedColor) || normalizedColor.includes(variantTitle)) {
      if (variant.featured_image?.src) {
        return variant.featured_image.src;
      }

      const variantImage = product.images.find(img => 
        img.variant_ids.includes(variant.id)
      );
      if (variantImage) {
        return variantImage.src;
      }
    }
  }

  console.log(`[SCRAPE-IMAGES] No matching image found for color: ${colorName}`);
  return null;
}

// Determine best region to scrape based on user region
function getRegionalStore(userRegion: string): string {
  // Map user region preferences to store domains
  const regionMap: Record<string, string> = {
    US: "US",
    CA: "CA",
    EU: "EU",
    UK: "UK",
    AU: "AU",
    DE: "DE",
    FR: "FR",
    IT: "IT",
    ES: "ES",
  };

  const storeRegion = regionMap[userRegion] || "US";
  return REGIONAL_STORES[storeRegion] || REGIONAL_STORES.US;
}

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
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Verify admin role
    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);

    if (userError || !user) {
      return new Response(JSON.stringify({ error: "Invalid token" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: roleData } = await supabase.rpc("has_role", { _role: "admin", _user_id: user.id });
    if (!roleData) {
      return new Response(JSON.stringify({ error: "Admin access required" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Parse request body
    let options: { 
      dryRun?: boolean;
      region?: string;
      productHandle?: string;
      vendor?: string;
      limit?: number;
    } = {};
    
    try {
      options = await req.json();
    } catch {
      // Use defaults
    }

    const dryRun = options.dryRun ?? true;
    const region = options.region || "US";
    const targetVendor = options.vendor || "Elegoo";
    const limit = options.limit || 100;
    const targetProductHandle = options.productHandle;

    console.log(`[SCRAPE-IMAGES] Starting variant image scrape (dryRun: ${dryRun}, region: ${region}, vendor: ${targetVendor})`);

    const storeUrl = getRegionalStore(region);
    console.log(`[SCRAPE-IMAGES] Using store: ${storeUrl}`);

    // Fetch filaments that need image updates
    let query = supabase
      .from("filaments")
      .select("id, product_title, product_url, featured_image, vendor")
      .eq("vendor", targetVendor)
      .not("product_url", "is", null)
      .order("product_title")
      .limit(limit);

    const { data: filaments, error: fetchError } = await query;

    if (fetchError) {
      throw new Error(`Failed to fetch filaments: ${fetchError.message}`);
    }

    console.log(`[SCRAPE-IMAGES] Found ${filaments?.length || 0} filaments to process`);

    // Group filaments by product handle
    const productGroups: Map<string, typeof filaments> = new Map();
    
    for (const filament of filaments || []) {
      if (!filament.product_url) continue;

      const handle = extractProductHandle(filament.product_url);
      if (!handle) continue;

      // If targeting a specific handle, skip others
      if (targetProductHandle && handle !== targetProductHandle) continue;

      if (!productGroups.has(handle)) {
        productGroups.set(handle, []);
      }
      productGroups.get(handle)!.push(filament);
    }

    console.log(`[SCRAPE-IMAGES] Grouped into ${productGroups.size} product handles`);

    const results: Array<{
      handle: string;
      filamentId: string;
      title: string;
      color: string;
      oldImage: string | null;
      newImage: string | null;
      updated: boolean;
      error?: string;
    }> = [];

    let updatedCount = 0;
    let skippedCount = 0;
    let errorCount = 0;

    // Process each product group
    for (const [handle, groupFilaments] of productGroups) {
      console.log(`[SCRAPE-IMAGES] Processing handle: ${handle} (${groupFilaments.length} variants)`);

      // Fetch the Shopify product data
      const product = await fetchShopifyProduct(storeUrl, handle);
      
      if (!product) {
        console.log(`[SCRAPE-IMAGES] Could not fetch product: ${handle}`);
        for (const filament of groupFilaments) {
          results.push({
            handle,
            filamentId: filament.id,
            title: filament.product_title,
            color: extractColorFromTitle(filament.product_title) || "unknown",
            oldImage: filament.featured_image,
            newImage: null,
            updated: false,
            error: "Product not found in store",
          });
          errorCount++;
        }
        continue;
      }

      console.log(`[SCRAPE-IMAGES] Product has ${product.variants.length} variants and ${product.images.length} images`);

      // Match each filament to a variant image
      for (const filament of groupFilaments) {
        const color = extractColorFromTitle(filament.product_title);
        
        if (!color) {
          results.push({
            handle,
            filamentId: filament.id,
            title: filament.product_title,
            color: "unknown",
            oldImage: filament.featured_image,
            newImage: null,
            updated: false,
            error: "Could not extract color from title",
          });
          skippedCount++;
          continue;
        }

        const newImage = findVariantImage(product, color);

        if (!newImage) {
          results.push({
            handle,
            filamentId: filament.id,
            title: filament.product_title,
            color,
            oldImage: filament.featured_image,
            newImage: null,
            updated: false,
            error: "No matching variant image found",
          });
          skippedCount++;
          continue;
        }

        // Check if image is actually different
        if (filament.featured_image === newImage) {
          results.push({
            handle,
            filamentId: filament.id,
            title: filament.product_title,
            color,
            oldImage: filament.featured_image,
            newImage,
            updated: false,
            error: "Image already matches",
          });
          skippedCount++;
          continue;
        }

        // Update if not dry run
        if (!dryRun) {
          const { error: updateError } = await supabase
            .from("filaments")
            .update({ 
              featured_image: newImage,
              updated_at: new Date().toISOString(),
            })
            .eq("id", filament.id);

          if (updateError) {
            results.push({
              handle,
              filamentId: filament.id,
              title: filament.product_title,
              color,
              oldImage: filament.featured_image,
              newImage,
              updated: false,
              error: updateError.message,
            });
            errorCount++;
            continue;
          }
        }

        results.push({
          handle,
          filamentId: filament.id,
          title: filament.product_title,
          color,
          oldImage: filament.featured_image,
          newImage,
          updated: !dryRun,
        });
        updatedCount++;
      }

      // Rate limit: wait between product fetches
      await new Promise(resolve => setTimeout(resolve, 500));
    }

    const response = {
      success: true,
      dryRun,
      region,
      storeUrl,
      summary: {
        totalProcessed: results.length,
        updated: updatedCount,
        skipped: skippedCount,
        errors: errorCount,
        productHandles: productGroups.size,
      },
      results,
    };

    console.log(`[SCRAPE-IMAGES] Complete: ${updatedCount} updated, ${skippedCount} skipped, ${errorCount} errors`);

    return new Response(JSON.stringify(response, null, 2), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error: unknown) {
    console.error("[SCRAPE-IMAGES] Error:", error);
    const message = error instanceof Error ? error.message : String(error);
    return new Response(JSON.stringify({ success: false, error: message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
