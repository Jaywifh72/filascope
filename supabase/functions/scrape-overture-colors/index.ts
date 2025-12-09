import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Color name to hex mapping
const COLOR_HEX_MAP: Record<string, string> = {
  // Basic colors
  "black": "#000000",
  "white": "#FFFFFF",
  "red": "#FF0000",
  "blue": "#0000FF",
  "green": "#00FF00",
  "yellow": "#FFFF00",
  "orange": "#FFA500",
  "purple": "#800080",
  "pink": "#FFC0CB",
  "brown": "#8B4513",
  "gray": "#808080",
  "grey": "#808080",
  
  // Extended colors
  "light blue": "#87CEEB",
  "sky blue": "#87CEEB",
  "navy": "#000080",
  "navy blue": "#000080",
  "dark blue": "#00008B",
  "royal blue": "#4169E1",
  "cyan": "#00FFFF",
  "teal": "#008080",
  "turquoise": "#40E0D0",
  
  "dark green": "#006400",
  "forest green": "#228B22",
  "lime": "#00FF00",
  "lime green": "#32CD32",
  "olive": "#808000",
  "mint": "#98FF98",
  "mint green": "#98FF98",
  "grass green": "#7CFC00",
  
  "dark red": "#8B0000",
  "maroon": "#800000",
  "crimson": "#DC143C",
  "wine": "#722F37",
  "burgundy": "#800020",
  
  "light pink": "#FFB6C1",
  "hot pink": "#FF69B4",
  "magenta": "#FF00FF",
  "fuchsia": "#FF00FF",
  "rose": "#FF007F",
  "coral": "#FF7F50",
  "salmon": "#FA8072",
  "peach": "#FFCBA4",
  
  "violet": "#EE82EE",
  "lavender": "#E6E6FA",
  "plum": "#DDA0DD",
  "indigo": "#4B0082",
  "lilac": "#C8A2C8",
  
  "gold": "#FFD700",
  "golden": "#FFD700",
  "silver": "#C0C0C0",
  "bronze": "#CD7F32",
  "copper": "#B87333",
  "champagne": "#F7E7CE",
  
  "beige": "#F5F5DC",
  "tan": "#D2B48C",
  "cream": "#FFFDD0",
  "ivory": "#FFFFF0",
  "khaki": "#F0E68C",
  "sand": "#C2B280",
  
  "charcoal": "#36454F",
  "dark gray": "#A9A9A9",
  "dark grey": "#A9A9A9",
  "light gray": "#D3D3D3",
  "light grey": "#D3D3D3",
  "slate": "#708090",
  
  // Transparent/special
  "transparent": "#FFFFFF",
  "clear": "#FFFFFF",
  "natural": "#F5DEB3",
};

// Color family mapping
const COLOR_FAMILY_MAP: Record<string, string> = {
  "black": "Black",
  "white": "White",
  "red": "Red",
  "dark red": "Red",
  "maroon": "Red",
  "crimson": "Red",
  "wine": "Red",
  "burgundy": "Red",
  "blue": "Blue",
  "light blue": "Blue",
  "sky blue": "Blue",
  "navy": "Blue",
  "navy blue": "Blue",
  "dark blue": "Blue",
  "royal blue": "Blue",
  "cyan": "Blue",
  "teal": "Blue",
  "turquoise": "Blue",
  "green": "Green",
  "dark green": "Green",
  "forest green": "Green",
  "lime": "Green",
  "lime green": "Green",
  "olive": "Green",
  "mint": "Green",
  "mint green": "Green",
  "grass green": "Green",
  "yellow": "Yellow",
  "gold": "Yellow",
  "golden": "Yellow",
  "orange": "Orange",
  "coral": "Orange",
  "peach": "Orange",
  "purple": "Purple",
  "violet": "Purple",
  "lavender": "Purple",
  "plum": "Purple",
  "indigo": "Purple",
  "lilac": "Purple",
  "pink": "Pink",
  "light pink": "Pink",
  "hot pink": "Pink",
  "magenta": "Pink",
  "fuchsia": "Pink",
  "rose": "Pink",
  "salmon": "Pink",
  "brown": "Brown",
  "tan": "Brown",
  "bronze": "Brown",
  "copper": "Brown",
  "gray": "Gray",
  "grey": "Gray",
  "charcoal": "Gray",
  "dark gray": "Gray",
  "dark grey": "Gray",
  "light gray": "Gray",
  "light grey": "Gray",
  "slate": "Gray",
  "silver": "Gray",
  "beige": "Beige",
  "cream": "Beige",
  "ivory": "Beige",
  "khaki": "Beige",
  "sand": "Beige",
  "champagne": "Beige",
  "natural": "Beige",
  "transparent": "Clear",
  "clear": "Clear",
};

function extractColorFromVariant(variantTitle: string): { hex: string | null; family: string | null } {
  const title = variantTitle.toLowerCase().trim();
  
  // Check for exact matches first
  for (const [colorName, hex] of Object.entries(COLOR_HEX_MAP)) {
    if (title === colorName || title.includes(colorName)) {
      return {
        hex,
        family: COLOR_FAMILY_MAP[colorName] || null,
      };
    }
  }
  
  return { hex: null, family: null };
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

    // Fetch all Overture filaments
    const { data: filaments, error: fetchError } = await supabase
      .from("filaments")
      .select("id, product_title, product_url, color_hex, color_family")
      .ilike("vendor", "%overture%")
      .not("product_url", "is", null);

    if (fetchError) {
      throw new Error(`Failed to fetch filaments: ${fetchError.message}`);
    }

    console.log(`Found ${filaments?.length || 0} Overture filaments to process`);

    const results: Array<{ 
      id: string; 
      title: string; 
      status: string; 
      colors?: Array<{ name: string; hex: string | null; family: string | null }>;
    }> = [];

    for (const filament of filaments || []) {
      try {
        if (!filament.product_url) {
          results.push({ id: filament.id, title: filament.product_title, status: "skipped - no URL" });
          continue;
        }

        // Extract product handle from URL
        const urlMatch = filament.product_url.match(/\/products\/([^/?#]+)/);
        if (!urlMatch) {
          results.push({ id: filament.id, title: filament.product_title, status: "invalid URL format" });
          continue;
        }

        const productHandle = urlMatch[1];
        const jsonUrl = `https://overture3d.com/products/${productHandle}.json`;
        
        console.log(`Fetching: ${jsonUrl}`);

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
        
        if (!product) {
          results.push({ id: filament.id, title: filament.product_title, status: "no product data" });
          continue;
        }

        // Extract color options from variants
        const variants = product.variants || [];
        const options = product.options || [];
        
        // Find color option
        const colorOption = options.find((opt: { name: string }) => 
          opt.name.toLowerCase().includes("color") || opt.name.toLowerCase().includes("colour")
        );

        const colorVariants: Array<{ name: string; hex: string | null; family: string | null }> = [];
        
        if (colorOption) {
          // Use options values directly
          for (const colorName of colorOption.values || []) {
            const { hex, family } = extractColorFromVariant(colorName);
            colorVariants.push({ name: colorName, hex, family });
          }
        } else {
          // Extract from variant titles
          const uniqueColors = new Set<string>();
          for (const variant of variants) {
            const title = variant.title || variant.option1 || "";
            if (title && !uniqueColors.has(title)) {
              uniqueColors.add(title);
              const { hex, family } = extractColorFromVariant(title);
              colorVariants.push({ name: title, hex, family });
            }
          }
        }

        if (colorVariants.length === 0) {
          results.push({ id: filament.id, title: filament.product_title, status: "no colors found" });
          continue;
        }

        // Determine if it's a single color or multicolor product
        if (colorVariants.length === 1) {
          // Single color - update directly
          const color = colorVariants[0];
          const { error: updateError } = await supabase
            .from("filaments")
            .update({ 
              color_hex: color.hex,
              color_family: color.family,
            })
            .eq("id", filament.id);

          if (updateError) {
            results.push({ id: filament.id, title: filament.product_title, status: `update failed: ${updateError.message}` });
          } else {
            results.push({ 
              id: filament.id, 
              title: filament.product_title, 
              status: "updated single color", 
              colors: colorVariants 
            });
            console.log(`Updated ${filament.product_title} with color: ${color.name} (${color.hex})`);
          }
        } else {
          // Multiple colors - set to multicolor family
          const { error: updateError } = await supabase
            .from("filaments")
            .update({ 
              color_family: "Multicolor",
            })
            .eq("id", filament.id);

          if (updateError) {
            results.push({ id: filament.id, title: filament.product_title, status: `update failed: ${updateError.message}` });
          } else {
            results.push({ 
              id: filament.id, 
              title: filament.product_title, 
              status: `found ${colorVariants.length} colors`, 
              colors: colorVariants 
            });
            console.log(`Found ${colorVariants.length} colors for ${filament.product_title}:`, colorVariants.map(c => c.name).join(", "));
          }
        }

        // Small delay between requests
        await new Promise(resolve => setTimeout(resolve, 200));
      } catch (error: unknown) {
        console.error(`Error processing ${filament.product_title}:`, error);
        const errorMessage = error instanceof Error ? error.message : String(error);
        results.push({ id: filament.id, title: filament.product_title, status: `error: ${errorMessage}` });
      }
    }

    const updated = results.filter(r => r.status.includes("updated") || r.status.includes("colors")).length;
    const failed = results.filter(r => r.status.includes("error") || r.status.includes("failed")).length;

    // Collect all unique colors found
    const allColors: Array<{ name: string; hex: string | null; family: string | null }> = [];
    for (const result of results) {
      if (result.colors) {
        for (const color of result.colors) {
          if (!allColors.some(c => c.name === color.name)) {
            allColors.push(color);
          }
        }
      }
    }

    console.log(`Completed: ${updated} processed, ${failed} failed`);
    console.log(`Unique colors found:`, allColors.length);

    return new Response(
      JSON.stringify({
        success: true,
        total: filaments?.length || 0,
        updated,
        failed,
        uniqueColors: allColors,
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
