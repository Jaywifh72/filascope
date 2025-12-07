import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface ShopifyVariant {
  id: number;
  title: string;
  price: string;
  option1: string;
  option2: string;
  grams: number;
}

interface ShopifyProduct {
  product: {
    id: number;
    title: string;
    variants: ShopifyVariant[];
    images: { src: string }[];
  };
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

    const { limit = 50, force = false } = await req.json().catch(() => ({}));

    console.log("=== FILLAMENTUM PRICE SCRAPER ===");
    console.log(`Limit: ${limit}, Force: ${force}`);

    // Fetch Fillamentum filaments needing prices
    let query = supabase
      .from("filaments")
      .select("id, product_title, product_url, variant_price, net_weight_g, featured_image, diameter_nominal_mm")
      .eq("vendor", "Fillamentum")
      .not("product_url", "is", null);

    if (!force) {
      query = query.or("variant_price.is.null,variant_price.eq.0");
    }

    const { data: filaments, error: fetchError } = await query.limit(limit);

    if (fetchError) {
      throw new Error(`Failed to fetch filaments: ${fetchError.message}`);
    }

    console.log(`Found ${filaments?.length || 0} Fillamentum filaments to process`);

    if (!filaments || filaments.length === 0) {
      return new Response(JSON.stringify({
        success: true,
        message: "No Fillamentum filaments need price updates",
        stats: { processed: 0, updated: 0, errors: 0 }
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const results: { id: string; title: string; status: string; price?: number; weight?: number }[] = [];
    let updated = 0;
    let errors = 0;

    for (const filament of filaments) {
      console.log(`\n--- Processing: ${filament.product_title} ---`);
      
      try {
        // Convert product URL to Shopify JSON API URL
        let productUrl = filament.product_url!;
        
        // Normalize URL to use fillamentumusa.com
        if (productUrl.includes("shop.fillamentum.com")) {
          productUrl = productUrl.replace("shop.fillamentum.com", "fillamentumusa.com");
        }
        
        // Remove any locale prefixes like /en-in/
        productUrl = productUrl.replace(/\/[a-z]{2}(-[a-z]{2})?\//, "/");
        
        // Handle collection URLs - convert to product URL
        if (productUrl.includes("/collections/")) {
          productUrl = productUrl.replace(/\/collections\/[^\/]+/, "");
        }
        
        // Ensure we have the right format
        if (!productUrl.includes("/products/")) {
          console.log(`✗ Invalid product URL format: ${productUrl}`);
          results.push({ id: filament.id, title: filament.product_title, status: "invalid_url" });
          errors++;
          continue;
        }
        
        // Add .json suffix
        const jsonUrl = productUrl.endsWith(".json") ? productUrl : `${productUrl}.json`;
        console.log(`Fetching: ${jsonUrl}`);

        const response = await fetch(jsonUrl, {
          headers: { "Accept": "application/json" }
        });

        if (!response.ok) {
          console.log(`✗ HTTP ${response.status}`);
          results.push({ id: filament.id, title: filament.product_title, status: `http_${response.status}` });
          errors++;
          continue;
        }

        const data: ShopifyProduct = await response.json();
        
        if (!data.product || !data.product.variants || data.product.variants.length === 0) {
          console.log(`✗ No product variants found`);
          results.push({ id: filament.id, title: filament.product_title, status: "no_variants" });
          errors++;
          continue;
        }

        // Find the best variant (prefer 750g, 1.75mm)
        const targetDiameter = filament.diameter_nominal_mm || 1.75;
        let bestVariant: ShopifyVariant | null = null;
        
        for (const variant of data.product.variants) {
          const is175mm = variant.option1?.includes("1.75") || variant.title?.includes("1.75");
          const is750g = variant.option2?.includes("750") || variant.title?.includes("750");
          
          // Priority: match diameter, prefer 750g spool
          if (targetDiameter === 1.75 && is175mm && is750g) {
            bestVariant = variant;
            break;
          }
          if (targetDiameter === 2.85 && !is175mm && is750g) {
            bestVariant = variant;
            break;
          }
          // Fallback to first 750g variant
          if (!bestVariant && is750g) {
            bestVariant = variant;
          }
        }
        
        // Ultimate fallback: first variant
        if (!bestVariant) {
          bestVariant = data.product.variants[0];
        }

        const price = parseFloat(bestVariant.price);
        const weightG = bestVariant.grams || 750;
        
        console.log(`✓ Found price: $${price} (${bestVariant.title}), weight: ${weightG}g`);

        // Update database
        const updateData: Record<string, unknown> = {
          variant_price: price,
          updated_at: new Date().toISOString()
        };

        // Also update weight if missing
        if (!filament.net_weight_g) {
          updateData.net_weight_g = weightG;
        }

        // Update image if missing
        if (!filament.featured_image && data.product.images?.length > 0) {
          updateData.featured_image = data.product.images[0].src;
        }

        const { error: updateError } = await supabase
          .from("filaments")
          .update(updateData)
          .eq("id", filament.id);

        if (updateError) {
          console.log(`✗ DB update failed: ${updateError.message}`);
          results.push({ id: filament.id, title: filament.product_title, status: "db_error" });
          errors++;
        } else {
          results.push({ 
            id: filament.id, 
            title: filament.product_title, 
            status: "updated", 
            price,
            weight: weightG
          });
          updated++;
        }

        // Small delay to avoid rate limiting
        await new Promise(r => setTimeout(r, 200));

      } catch (err) {
        console.error(`Error processing ${filament.product_title}:`, err);
        results.push({ id: filament.id, title: filament.product_title, status: "error" });
        errors++;
      }
    }

    console.log(`\n=== COMPLETE ===`);
    console.log(`Updated: ${updated}, Errors: ${errors}`);

    return new Response(JSON.stringify({
      success: true,
      stats: {
        processed: filaments.length,
        updated,
        errors
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
