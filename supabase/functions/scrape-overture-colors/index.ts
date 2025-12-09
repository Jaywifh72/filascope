import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Comprehensive color name to hex mapping
const COLOR_HEX_MAP: Record<string, string> = {
  // Basic colors
  "black": "#1A1A1A",
  "white": "#FFFFFF",
  "cold white": "#F0F8FF",
  "red": "#E53935",
  "fresh red": "#FF4444",
  "blue": "#2196F3",
  "light blue": "#87CEEB",
  "gray blue": "#6E7B8B",
  "green": "#4CAF50",
  "olive green": "#6B8E23",
  "yellow": "#FFEB3B",
  "highlight yellow": "#FFFF00",
  "lemon yellow": "#FFF44F",
  "orange": "#FF9800",
  "purple": "#9C27B0",
  "pink": "#E91E63",
  "bright pink": "#FF69B4",
  "pastel red": "#FFB6B6",
  "brick red": "#CB4154",
  "dark red": "#8B0000",
  "brown": "#795548",
  "chocolate": "#7B3F00",
  "light brown": "#C4A484",
  
  // Grays
  "gray": "#9E9E9E",
  "grey": "#9E9E9E",
  "space gray": "#4A4A4A",
  "light gray": "#D3D3D3",
  "light grey": "#D3D3D3",
  "cement gray": "#8D8D8D",
  "slate gray": "#708090",
  "metallic gray": "#8E8E8E",
  "carbon fiber black": "#2B2B2B",
  
  // Special colors
  "gold": "#FFD700",
  "royal gold": "#DAA520",
  "silver": "#C0C0C0",
  "copper": "#B87333",
  "bronze": "#CD7F32",
  "natural": "#F5DEB3",
  "transparent": "#FFFFFF",
  "clear": "#FFFFFF",
  "skin": "#FFCBA4",
  "wood": "#DEB887",
  "beige": "#F5F5DC",
  
  // Glow colors
  "glow in dark": "#90EE90",
  "glow in the dark": "#90EE90",
  "glow green": "#39FF14",
  "neon green": "#39FF14",
  "neon red": "#FF073A",
  "neon orange": "#FF6600",
  
  // Blues
  "navy blue": "#000080",
  "digital blue": "#0066CC",
  "starry blue": "#1E3A5F",
  "sparkle blue": "#4169E1",
  "transparent blue": "#ADD8E6",
  
  // Greens
  "grass green": "#7CFC00",
  "army green": "#4B5320",
  "light green": "#90EE90",
  "transparent green": "#98FB98",
  "bamboo green": "#7BA05B",
  "turquoise": "#40E0D0",
  
  // Other special
  "magenta": "#FF00FF",
  "transparent red": "#FF6B6B",
  "rock white": "#F8F8FF",
  "avocado": "#568203",
  "lilac": "#C8A2C8",
  "butter yellow": "#FFFACD",
  "baby pink": "#F4C2C2",
  "champagne": "#F7E7CE",
  "champagne frost": "#E8DCC4",
  
  // Silk colors
  "silk gold": "#FFD700",
  "silk copper": "#B87333",
  "silk gray": "#A8A8A8",
  "silk silver": "#C0C0C0",
  "silk white": "#FFFAFA",
  "silk red": "#DC143C",
  "silk fresh red": "#FF4500",
  "silk green": "#228B22",
  "silk neon green": "#39FF14",
  "silk purple": "#9370DB",
  "silk blue": "#4682B4",
  "silk caramel": "#FFD59A",
  
  // Diamond colors
  "diamond purple": "#B19CD9",
  "diamond gray": "#A0A0A0",
  "diamond orange": "#FF7F50",
  "diamond blue": "#89CFF0",
  "diamond red": "#FF6961",
  "diamond green": "#90EE90",
  
  // Shimmer colors
  "shimmer dark green": "#013220",
  "shimmer purple": "#8B008B",
  "shimmer silver green": "#8FBC8F",
  "shimmer bronze": "#CD7F32",
  
  // Sparkle colors
  "sparkle black": "#1C1C1C",
  "sparkle purple": "#9932CC",
};

// Color family mapping
const COLOR_FAMILY_MAP: Record<string, string> = {
  "black": "Black", "carbon fiber black": "Black", "sparkle black": "Black",
  "white": "White", "cold white": "White", "rock white": "White", "silk white": "White",
  "red": "Red", "fresh red": "Red", "pastel red": "Red", "brick red": "Red", "dark red": "Red", 
  "silk red": "Red", "silk fresh red": "Red", "diamond red": "Red", "neon red": "Red", "transparent red": "Red",
  "blue": "Blue", "light blue": "Blue", "gray blue": "Blue", "navy blue": "Blue", "digital blue": "Blue",
  "starry blue": "Blue", "sparkle blue": "Blue", "transparent blue": "Blue", "silk blue": "Blue", "diamond blue": "Blue",
  "green": "Green", "olive green": "Green", "grass green": "Green", "army green": "Green", "light green": "Green",
  "transparent green": "Green", "bamboo green": "Green", "silk green": "Green", "silk neon green": "Green",
  "diamond green": "Green", "glow green": "Green", "neon green": "Green", "shimmer dark green": "Green", "shimmer silver green": "Green",
  "yellow": "Yellow", "highlight yellow": "Yellow", "lemon yellow": "Yellow", "butter yellow": "Yellow",
  "orange": "Orange", "diamond orange": "Orange", "neon orange": "Orange",
  "purple": "Purple", "silk purple": "Purple", "diamond purple": "Purple", "shimmer purple": "Purple", "sparkle purple": "Purple", "lilac": "Purple",
  "pink": "Pink", "bright pink": "Pink", "baby pink": "Pink", "magenta": "Pink",
  "brown": "Brown", "chocolate": "Brown", "light brown": "Brown", "wood": "Brown",
  "gray": "Gray", "grey": "Gray", "space gray": "Gray", "light gray": "Gray", "light grey": "Gray",
  "cement gray": "Gray", "slate gray": "Gray", "metallic gray": "Gray", "silk gray": "Gray", "diamond gray": "Gray",
  "gold": "Gold", "royal gold": "Gold", "silk gold": "Gold",
  "silver": "Silver", "silk silver": "Silver",
  "copper": "Copper", "silk copper": "Copper",
  "bronze": "Bronze", "shimmer bronze": "Bronze",
  "beige": "Beige", "champagne": "Beige", "champagne frost": "Beige", "natural": "Beige", "skin": "Beige",
  "turquoise": "Turquoise",
  "transparent": "Clear", "clear": "Clear",
  "glow in dark": "Glow", "glow in the dark": "Glow",
};

function extractColorInfo(colorName: string): { hex: string | null; family: string | null } {
  const normalized = colorName.toLowerCase().trim();
  
  // Direct match
  if (COLOR_HEX_MAP[normalized]) {
    return {
      hex: COLOR_HEX_MAP[normalized],
      family: COLOR_FAMILY_MAP[normalized] || null,
    };
  }
  
  // Partial matching - check if color name contains known colors
  for (const [key, hex] of Object.entries(COLOR_HEX_MAP)) {
    if (normalized.includes(key) || key.includes(normalized)) {
      return {
        hex,
        family: COLOR_FAMILY_MAP[key] || null,
      };
    }
  }
  
  // Fallback: try to detect color family from name
  const familyKeywords: Record<string, string> = {
    "black": "Black", "white": "White", "red": "Red", "blue": "Blue",
    "green": "Green", "yellow": "Yellow", "orange": "Orange", "purple": "Purple",
    "pink": "Pink", "brown": "Brown", "gray": "Gray", "grey": "Gray",
    "gold": "Gold", "silver": "Silver", "copper": "Copper", "bronze": "Bronze",
  };
  
  for (const [keyword, family] of Object.entries(familyKeywords)) {
    if (normalized.includes(keyword)) {
      return { hex: null, family };
    }
  }
  
  return { hex: null, family: null };
}

interface ColorVariant {
  name: string;
  hex: string | null;
  family: string | null;
  imageUrl: string | null;
  variantId: number | null;
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
      .select("*")
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
      colorsFound: number;
      colorsCreated: number;
      colors?: ColorVariant[];
    }> = [];

    let totalColorsFound = 0;
    let totalEntriesCreated = 0;
    let totalEntriesUpdated = 0;

    for (const filament of filaments || []) {
      try {
        if (!filament.product_url) {
          results.push({ id: filament.id, title: filament.product_title, status: "skipped - no URL", colorsFound: 0, colorsCreated: 0 });
          continue;
        }

        // Extract product handle from URL
        const urlMatch = filament.product_url.match(/\/products\/([^/?#]+)/);
        if (!urlMatch) {
          results.push({ id: filament.id, title: filament.product_title, status: "invalid URL format", colorsFound: 0, colorsCreated: 0 });
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
          results.push({ id: filament.id, title: filament.product_title, status: `HTTP ${response.status}`, colorsFound: 0, colorsCreated: 0 });
          continue;
        }

        const productData = await response.json();
        const product = productData?.product;
        
        if (!product) {
          results.push({ id: filament.id, title: filament.product_title, status: "no product data", colorsFound: 0, colorsCreated: 0 });
          continue;
        }

        // Extract color variants
        const variants = product.variants || [];
        const images = product.images || [];
        const options = product.options || [];
        
        // Find color option
        const colorOptionIndex = options.findIndex((opt: { name: string }) => 
          opt.name.toLowerCase().includes("color") || opt.name.toLowerCase().includes("colour")
        );

        const colorVariants: ColorVariant[] = [];
        
        if (colorOptionIndex !== -1) {
          const colorOptionKey = `option${colorOptionIndex + 1}`;
          const seenColors = new Set<string>();
          
          for (const variant of variants) {
            const colorName = variant[colorOptionKey];
            if (!colorName || seenColors.has(colorName.toLowerCase())) continue;
            seenColors.add(colorName.toLowerCase());
            
            // Find image for this variant
            let imageUrl: string | null = null;
            if (variant.featured_image?.src) {
              imageUrl = variant.featured_image.src.split("?")[0];
            } else if (variant.image_id && images.length > 0) {
              const img = images.find((i: { id: number }) => i.id === variant.image_id);
              if (img?.src) {
                imageUrl = img.src.split("?")[0];
              }
            }
            
            // Fall back to first image if no variant-specific image
            if (!imageUrl && images.length > 0) {
              imageUrl = images[0].src?.split("?")[0] || null;
            }
            
            const { hex, family } = extractColorInfo(colorName);
            colorVariants.push({
              name: colorName,
              hex,
              family,
              imageUrl,
              variantId: variant.id,
            });
          }
        } else {
          // No color option - extract from variant titles
          const seenColors = new Set<string>();
          for (const variant of variants) {
            const title = variant.title || variant.option1 || "Default";
            if (seenColors.has(title.toLowerCase())) continue;
            seenColors.add(title.toLowerCase());
            
            let imageUrl: string | null = null;
            if (variant.featured_image?.src) {
              imageUrl = variant.featured_image.src.split("?")[0];
            } else if (images.length > 0) {
              imageUrl = images[0].src?.split("?")[0] || null;
            }
            
            const { hex, family } = extractColorInfo(title);
            colorVariants.push({
              name: title,
              hex,
              family,
              imageUrl,
              variantId: variant.id,
            });
          }
        }

        totalColorsFound += colorVariants.length;

        if (colorVariants.length === 0) {
          results.push({ id: filament.id, title: filament.product_title, status: "no colors found", colorsFound: 0, colorsCreated: 0 });
          continue;
        }

        // Get base product info from original filament
        const baseProductName = filament.product_title.replace(/ - .+$/, "").trim();
        let colorsCreated = 0;

        if (colorVariants.length === 1) {
          // Single color product - update existing entry
          const color = colorVariants[0];
          const { error: updateError } = await supabase
            .from("filaments")
            .update({ 
              color_hex: color.hex,
              color_family: color.family,
              featured_image: color.imageUrl || filament.featured_image,
            })
            .eq("id", filament.id);

          if (!updateError) {
            totalEntriesUpdated++;
            console.log(`Updated ${filament.product_title} with color: ${color.name} (${color.hex})`);
          }
        } else {
          // Multiple colors - check if color-specific entries exist, create if not
          for (const color of colorVariants) {
            const colorProductTitle = `${baseProductName} - ${color.name}`;
            
            // Check if this color variant already exists
            const { data: existing } = await supabase
              .from("filaments")
              .select("id")
              .eq("vendor", filament.vendor)
              .eq("product_title", colorProductTitle)
              .maybeSingle();
            
            if (existing) {
              // Update existing color variant
              const { error: updateError } = await supabase
                .from("filaments")
                .update({ 
                  color_hex: color.hex,
                  color_family: color.family,
                  featured_image: color.imageUrl || undefined,
                })
                .eq("id", existing.id);
              
              if (!updateError) {
                totalEntriesUpdated++;
              }
            } else {
              // Create new color variant entry
              const newEntry = {
                ...filament,
                id: undefined, // Let DB generate new ID
                product_title: colorProductTitle,
                color_hex: color.hex,
                color_family: color.family,
                featured_image: color.imageUrl || filament.featured_image,
                product_url: filament.product_url, // Keep same product URL
                created_at: undefined,
                updated_at: undefined,
              };
              
              delete newEntry.id;
              delete newEntry.created_at;
              delete newEntry.updated_at;
              
              const { error: insertError } = await supabase
                .from("filaments")
                .insert(newEntry);
              
              if (!insertError) {
                colorsCreated++;
                totalEntriesCreated++;
                console.log(`Created new entry: ${colorProductTitle} (${color.hex})`);
              } else {
                console.error(`Failed to create ${colorProductTitle}:`, insertError.message);
              }
            }
          }
          
          // Update original entry to be "Multicolor" if it doesn't have a color suffix
          if (!filament.product_title.includes(" - ")) {
            await supabase
              .from("filaments")
              .update({ color_family: "Multicolor" })
              .eq("id", filament.id);
          }
        }

        results.push({ 
          id: filament.id, 
          title: filament.product_title, 
          status: `processed ${colorVariants.length} colors`, 
          colorsFound: colorVariants.length,
          colorsCreated,
          colors: colorVariants,
        });

        console.log(`Processed ${filament.product_title}: ${colorVariants.length} colors found, ${colorsCreated} created`);

        // Small delay between requests
        await new Promise(resolve => setTimeout(resolve, 150));
      } catch (error: unknown) {
        console.error(`Error processing ${filament.product_title}:`, error);
        const errorMessage = error instanceof Error ? error.message : String(error);
        results.push({ id: filament.id, title: filament.product_title, status: `error: ${errorMessage}`, colorsFound: 0, colorsCreated: 0 });
      }
    }

    console.log(`Completed: ${totalColorsFound} colors found, ${totalEntriesCreated} created, ${totalEntriesUpdated} updated`);

    return new Response(
      JSON.stringify({
        success: true,
        total: filaments?.length || 0,
        totalColorsFound,
        totalEntriesCreated,
        totalEntriesUpdated,
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
