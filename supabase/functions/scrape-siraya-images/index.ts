import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

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

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Fetch all Siraya Tech filaments
    const { data: filaments, error: fetchError } = await supabase
      .from("filaments")
      .select("id, product_title, product_url, featured_image, variant_price, net_weight_g")
      .ilike("vendor", "%siraya%")
      .not("product_url", "is", null);

    if (fetchError) {
      throw new Error(`Failed to fetch filaments: ${fetchError.message}`);
    }

    console.log(`Found ${filaments?.length || 0} Siraya Tech filaments to process`);

    const results: Array<{ id: string; title: string; status: string; image?: string; price?: number; weight?: number }> = [];

    for (const filament of filaments || []) {
      try {
        if (!filament.product_url) {
          results.push({ id: filament.id, title: filament.product_title, status: "skipped - no URL" });
          continue;
        }

        // Extract product handle from URL - Siraya Tech URLs are like https://siraya.tech/products/product-handle
        const urlMatch = filament.product_url.match(/\/products\/([^/?#]+)/);
        if (!urlMatch) {
          results.push({ id: filament.id, title: filament.product_title, status: "invalid URL format" });
          continue;
        }

        const productHandle = urlMatch[1];
        const jsonUrl = `https://siraya.tech/products/${productHandle}.json`;
        
        console.log(`Fetching: ${jsonUrl}`);

        // Use Shopify JSON API - much faster and reliable
        const response = await fetch(jsonUrl, {
          headers: {
            "User-Agent": "Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)",
            "Accept": "application/json",
          },
        });

        if (!response.ok) {
          results.push({ id: filament.id, title: filament.product_title, status: `HTTP ${response.status}` });
          continue;
        }

        const productData = await response.json();
        const product = productData?.product;
        
        // Get the first image from the product
        const images = product?.images || [];
        let imageUrl: string | null = null;
        if (images.length > 0 && images[0]?.src) {
          imageUrl = images[0].src.split("?")[0]; // Remove size parameters
        }

        // Get price from the first variant (per kg price)
        let price: number | null = null;
        const variants = product?.variants || [];
        if (variants.length > 0 && variants[0]?.price) {
          price = parseFloat(variants[0].price);
        }

        // Try to extract weight from variant title or product title
        let weight: number | null = filament.net_weight_g;
        if (!weight) {
          // Look for weight in variant info - Siraya Tech typically sells 1kg spools
          const variantTitle = variants[0]?.title || "";
          const productTitle = product?.title || "";
          const combinedText = `${variantTitle} ${productTitle}`.toLowerCase();
          
          if (combinedText.includes("1kg") || combinedText.includes("1000g")) {
            weight = 1000;
          } else if (combinedText.includes("500g") || combinedText.includes("0.5kg")) {
            weight = 500;
          } else if (combinedText.includes("750g") || combinedText.includes("0.75kg")) {
            weight = 750;
          } else {
            // Default to 1kg for Siraya Tech filaments
            weight = 1000;
          }
        }

        // Build update object
        const updateData: Record<string, unknown> = {};
        if (imageUrl) updateData.featured_image = imageUrl;
        if (price && price > 0) updateData.variant_price = price;
        if (weight) updateData.net_weight_g = weight;

        if (Object.keys(updateData).length === 0) {
          results.push({ id: filament.id, title: filament.product_title, status: "no data extracted" });
          continue;
        }

        // Update the filament
        const { error: updateError } = await supabase
          .from("filaments")
          .update(updateData)
          .eq("id", filament.id);

        if (updateError) {
          results.push({ id: filament.id, title: filament.product_title, status: `update failed: ${updateError.message}` });
        } else {
          results.push({ 
            id: filament.id, 
            title: filament.product_title, 
            status: "updated", 
            image: imageUrl || undefined,
            price: price || undefined,
            weight: weight || undefined
          });
          console.log(`Updated ${filament.product_title} - image: ${imageUrl ? 'yes' : 'no'}, price: ${price}, weight: ${weight}g`);
        }

        // Small delay between requests to be polite
        await new Promise(resolve => setTimeout(resolve, 200));
      } catch (error: unknown) {
        console.error(`Error processing ${filament.product_title}:`, error);
        const errorMessage = error instanceof Error ? error.message : String(error);
        results.push({ id: filament.id, title: filament.product_title, status: `error: ${errorMessage}` });
      }
    }

    const updated = results.filter(r => r.status === "updated").length;
    const failed = results.filter(r => r.status !== "updated" && r.status !== "skipped - no URL").length;

    console.log(`Completed: ${updated} updated, ${failed} failed`);

    return new Response(
      JSON.stringify({
        success: true,
        total: filaments?.length || 0,
        updated,
        failed,
        results,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: unknown) {
    console.error("Error:", error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
