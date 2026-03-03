import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface ShopifyVariant {
  id: number;
  title: string;
  sku: string | null;
  featured_image?: { src: string } | null;
}

interface ShopifyImage {
  src: string;
  variant_ids?: number[];
}

interface ShopifyProduct {
  id: number;
  title: string;
  handle: string;
  product_type: string;
  images: ShopifyImage[];
  variants: ShopifyVariant[];
}

// Normalize a color/title string for fuzzy matching
function normalize(s: string): string {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

// Extract the color portion from a filament title like "Fiberlogy ABS Filament - 1.75 mm - 0.85 kg - Burgundy"
function extractColorFromTitle(title: string): string | null {
  // Pattern: "... - ColorName" at the end
  const dashMatch = title.match(/-\s*([^-]+)$/);
  if (dashMatch) {
    return dashMatch[1].trim();
  }
  return null;
}

// Extract material from title like "Fiberlogy EASY PLA Filament" -> "EASY PLA"
function extractMaterialFromShopifyTitle(title: string): string | null {
  // Remove "Fiberlogy" prefix and extract material before color/details
  const cleaned = title.replace(/^fiberlogy\s+/i, "");
  // Material is typically before " - " or before a color word
  const dashIdx = cleaned.indexOf(" - ");
  if (dashIdx > 0) {
    return cleaned.substring(0, dashIdx).trim();
  }
  return cleaned.trim();
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Verify admin
    const authHeader = req.headers.get("Authorization");
    if (authHeader) {
      const token = authHeader.replace("Bearer ", "");
      const { data: { user }, error: authError } = await supabase.auth.getUser(token);
      if (authError || !user) {
        return new Response(JSON.stringify({ error: "Unauthorized" }), {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      // Check admin role
      const { data: roleData } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id)
        .eq("role", "admin")
        .maybeSingle();
      if (!roleData) {
        return new Response(JSON.stringify({ error: "Admin access required" }), {
          status: 403,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    // Step 1: Get Fiberlogy brand ID
    const { data: brand } = await supabase
      .from("automated_brands")
      .select("id, brand_name")
      .ilike("brand_name", "%fiberlogy%")
      .maybeSingle();

    if (!brand) {
      return new Response(JSON.stringify({ error: "Fiberlogy brand not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Step 2: Fetch all Fiberlogy filaments
    const { data: filaments, error: filErr } = await supabase
      .from("filaments")
      .select("id, product_title, material, color_family, color_hex, featured_image, product_handle, product_url")
      .or(`brand_id.eq.${brand.id},vendor.ilike.%fiberlogy%`);

    if (filErr) throw filErr;
    if (!filaments || filaments.length === 0) {
      return new Response(JSON.stringify({ error: "No Fiberlogy filaments found", brand_id: brand.id }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Step 3: Fetch all products from np3dp.com Shopify store
    const allShopifyProducts: ShopifyProduct[] = [];
    let page = 1;
    while (true) {
      const url = `https://np3dp.com/products.json?limit=250&page=${page}`;
      const resp = await fetch(url, {
        headers: { "User-Agent": "FilaScope/1.0 (product-sync)" },
      });
      if (!resp.ok) {
        console.error(`Failed to fetch page ${page}: ${resp.status}`);
        break;
      }
      const data = await resp.json();
      const products = data.products as ShopifyProduct[];
      if (!products || products.length === 0) break;

      // Filter to only Fiberlogy products
      const fiberlogyProducts = products.filter(
        (p) =>
          p.title.toLowerCase().includes("fiberlogy") ||
          p.product_type.toLowerCase().includes("fiberlogy")
      );
      allShopifyProducts.push(...fiberlogyProducts);
      
      if (products.length < 250) break;
      page++;
    }

    console.log(`Found ${allShopifyProducts.length} Fiberlogy products from np3dp.com across ${page} pages`);

    // Step 4: Build a matching index
    // For each Shopify product, extract material and build variant->image map
    interface MatchCandidate {
      shopifyProduct: ShopifyProduct;
      shopifyMaterial: string;
      mainImage: string | null;
      variantImages: Map<string, string>; // normalized variant title -> image URL
    }

    const candidates: MatchCandidate[] = allShopifyProducts.map((sp) => {
      const mainImage = sp.images?.[0]?.src || null;
      const shopifyMaterial = extractMaterialFromShopifyTitle(sp.title) || "";
      
      // Build variant image map
      const variantImages = new Map<string, string>();
      for (const variant of sp.variants) {
        const variantImg = variant.featured_image?.src;
        if (variantImg) {
          variantImages.set(normalize(variant.title), variantImg);
        }
        // Also check images array for variant-specific images
        if (sp.images) {
          for (const img of sp.images) {
            if (img.variant_ids?.includes(variant.id) && img.src) {
              variantImages.set(normalize(variant.title), img.src);
            }
          }
        }
      }

      return { shopifyProduct: sp, shopifyMaterial: normalize(shopifyMaterial), mainImage, variantImages };
    });

    // Step 5: Match filaments to Shopify products
    let matched = 0;
    let updated = 0;
    let skipped = 0;
    const errors: string[] = [];

    for (const filament of filaments) {
      const filColor = extractColorFromTitle(filament.product_title);
      const filMaterial = filament.material ? normalize(filament.material) : "";
      const filColorNorm = filColor ? normalize(filColor) : "";

      let bestMatch: {
        mainImage: string | null;
        variantImage: string | null;
        handle: string;
        shopifyTitle: string;
      } | null = null;

      for (const candidate of candidates) {
        // Check if material matches (fuzzy)
        const matMatch =
          candidate.shopifyMaterial.includes(filMaterial) ||
          filMaterial.includes(candidate.shopifyMaterial) ||
          // Handle "Easy PLA" matching "PLA", "ABS" matching "ABS", etc.
          candidate.shopifyMaterial.split(" ").some((w) => w === filMaterial);

        if (!matMatch && filMaterial) continue;

        // Check if any variant matches the color
        if (filColorNorm) {
          // Check Shopify product title for color
          const shopifyTitleNorm = normalize(candidate.shopifyProduct.title);
          if (shopifyTitleNorm.includes(filColorNorm)) {
            bestMatch = {
              mainImage: candidate.mainImage,
              variantImage: candidate.variantImages.get(filColorNorm) || null,
              handle: candidate.shopifyProduct.handle,
              shopifyTitle: candidate.shopifyProduct.title,
            };
            break;
          }

          // Check individual variants
          for (const variant of candidate.shopifyProduct.variants) {
            const varTitleNorm = normalize(variant.title);
            if (varTitleNorm.includes(filColorNorm) || filColorNorm.includes(varTitleNorm)) {
              bestMatch = {
                mainImage: candidate.mainImage,
                variantImage: candidate.variantImages.get(varTitleNorm) || variant.featured_image?.src || null,
                handle: candidate.shopifyProduct.handle,
                shopifyTitle: `${candidate.shopifyProduct.title} - ${variant.title}`,
              };
              break;
            }
          }
          if (bestMatch) break;
        } else {
          // No color info - just match by material, use main image
          bestMatch = {
            mainImage: candidate.mainImage,
            variantImage: null,
            handle: candidate.shopifyProduct.handle,
            shopifyTitle: candidate.shopifyProduct.title,
          };
          break;
        }
      }

      if (!bestMatch) {
        skipped++;
        continue;
      }

      matched++;

      // Only update if we have new data
      const imageToSet = bestMatch.variantImage || bestMatch.mainImage;
      if (!imageToSet && !bestMatch.handle) {
        skipped++;
        continue;
      }

      const updateData: Record<string, unknown> = {};
      if (imageToSet && !filament.featured_image) {
        updateData.featured_image = imageToSet;
      }
      if (bestMatch.variantImage) {
        updateData.variant_image = bestMatch.variantImage;
      }
      if (bestMatch.handle && !filament.product_handle) {
        updateData.product_handle = bestMatch.handle;
      }
      // Update product_url to np3dp.com if it's currently pointing to fiberlogy.com
      if (bestMatch.handle && (!filament.product_url || filament.product_url.includes("fiberlogy.com"))) {
        updateData.product_url = `https://np3dp.com/products/${bestMatch.handle}`;
      }

      if (Object.keys(updateData).length === 0) {
        skipped++;
        continue;
      }

      const { error: updateErr } = await supabase
        .from("filaments")
        .update(updateData)
        .eq("id", filament.id);

      if (updateErr) {
        errors.push(`Failed to update ${filament.id}: ${updateErr.message}`);
      } else {
        updated++;
      }
    }

    const summary = {
      brand: brand.brand_name,
      brand_id: brand.id,
      total_filaments: filaments.length,
      shopify_products_found: allShopifyProducts.length,
      matched,
      updated,
      skipped,
      errors: errors.length > 0 ? errors.slice(0, 10) : undefined,
    };

    console.log("Fiberlogy image sync complete:", JSON.stringify(summary));

    return new Response(JSON.stringify(summary), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error in fetch-fiberlogy-images:", error);
    return new Response(
      JSON.stringify({ error: error.message || "Internal server error" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
