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
  "gray": "#9E9E9E",
  "grey": "#9E9E9E",
  "space gray": "#4A4A4A",
  "light gray": "#D3D3D3",
  "light grey": "#D3D3D3",
  "cement gray": "#8D8D8D",
  "slate gray": "#708090",
  "metallic gray": "#8E8E8E",
  "carbon fiber black": "#2B2B2B",
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
  "glow in dark": "#90EE90",
  "glow in the dark": "#90EE90",
  "glow green": "#39FF14",
  "neon green": "#39FF14",
  "neon red": "#FF073A",
  "neon orange": "#FF6600",
  "navy blue": "#000080",
  "digital blue": "#0066CC",
  "starry blue": "#1E3A5F",
  "sparkle blue": "#4169E1",
  "transparent blue": "#ADD8E6",
  "grass green": "#7CFC00",
  "army green": "#4B5320",
  "light green": "#90EE90",
  "transparent green": "#98FB98",
  "bamboo green": "#7BA05B",
  "turquoise": "#40E0D0",
  "magenta": "#FF00FF",
  "transparent red": "#FF6B6B",
  "rock white": "#F8F8FF",
  "avocado": "#568203",
  "lilac": "#C8A2C8",
  "butter yellow": "#FFFACD",
  "baby pink": "#F4C2C2",
  "champagne": "#F7E7CE",
  "champagne frost": "#E8DCC4",
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
  "diamond purple": "#B19CD9",
  "diamond gray": "#A0A0A0",
  "diamond orange": "#FF7F50",
  "diamond blue": "#89CFF0",
  "diamond red": "#FF6961",
  "diamond green": "#90EE90",
  "shimmer dark green": "#013220",
  "shimmer purple": "#8B008B",
  "shimmer silver green": "#8FBC8F",
  "shimmer bronze": "#CD7F32",
  "sparkle black": "#1C1C1C",
  "sparkle purple": "#9932CC",
  "teal": "#008080",
  "cyan": "#00FFFF",
  "maroon": "#800000",
  "olive": "#808000",
  "coral": "#FF7F50",
  "salmon": "#FA8072",
  "peach": "#FFCBA4",
  "mint": "#98FF98",
  "lavender": "#E6E6FA",
  "ivory": "#FFFFF0",
  "cream": "#FFFDD0",
  "tan": "#D2B48C",
  "khaki": "#F0E68C",
  "indigo": "#4B0082",
  "violet": "#EE82EE",
  "plum": "#DDA0DD",
  "crimson": "#DC143C",
  "scarlet": "#FF2400",
  "ruby": "#E0115F",
  "burgundy": "#800020",
  "wine": "#722F37",
  "raspberry": "#E30B5C",
  "rose": "#FF007F",
  "blush": "#DE5D83",
  "fuchsia": "#FF00FF",
  "hot pink": "#FF69B4",
  "bubblegum": "#FFC1CC",
  "flamingo": "#FC8EAC",
  "watermelon": "#FD4659",
  "cherry": "#DE3163",
  "strawberry": "#FC5A8D",
  "tomato": "#FF6347",
  "sunset": "#FAD6A5",
  "honey": "#EB9605",
  "amber": "#FFBF00",
  "mustard": "#FFDB58",
  "lemon": "#FFF44F",
  "canary": "#FFEF00",
  "sunshine": "#FFFD37",
  "dandelion": "#F0E130",
  "chartreuse": "#7FFF00",
  "lime": "#32CD32",
  "emerald": "#50C878",
  "jade": "#00A86B",
  "sage": "#BCB88A",
  "forest": "#228B22",
  "pine": "#01796F",
  "seafoam": "#93E9BE",
  "aqua": "#00FFFF",
  "azure": "#007FFF",
  "sky": "#87CEEB",
  "cobalt": "#0047AB",
  "royal": "#4169E1",
  "sapphire": "#0F52BA",
  "midnight": "#191970",
  "denim": "#1560BD",
  "steel": "#4682B4",
  "powder": "#B0E0E6",
  "periwinkle": "#CCCCFF",
  "orchid": "#DA70D6",
  "grape": "#6F2DA8",
  "amethyst": "#9966CC",
  "mauve": "#E0B0FF",
  "taupe": "#483C32",
  "mocha": "#967117",
  "coffee": "#6F4E37",
  "espresso": "#3C2415",
  "caramel": "#FFD59A",
  "butterscotch": "#E09540",
  "pumpkin": "#FF7518",
  "rust": "#B7410E",
  "cinnamon": "#D2691E",
  "ginger": "#B06500",
  "terracotta": "#E2725B",
  "clay": "#B66A50",
  "sand": "#C2B280",
  "nude": "#E3BC9A",
  "blond": "#FAF0BE",
  "platinum": "#E5E4E2",
  "ash": "#B2BEB5",
  "charcoal": "#36454F",
  "smoke": "#708090",
  "graphite": "#383838",
  "onyx": "#353839",
  "obsidian": "#1B1B1B",
  "jet": "#0A0A0A",
  "snow": "#FFFAFA",
  "pearl": "#FDEEF4",
  "alabaster": "#F2F0E6",
  "bone": "#E3DAC9",
  "eggshell": "#F0EAD6",
  "porcelain": "#F0F4F8",
};

// Color family mapping
const COLOR_FAMILY_MAP: Record<string, string> = {
  "black": "Black", "carbon fiber black": "Black", "sparkle black": "Black", "onyx": "Black", "obsidian": "Black", "jet": "Black", "charcoal": "Black", "graphite": "Black",
  "white": "White", "cold white": "White", "rock white": "White", "silk white": "White", "snow": "White", "pearl": "White", "alabaster": "White", "bone": "White", "eggshell": "White", "porcelain": "White", "ivory": "White", "cream": "White",
  "red": "Red", "fresh red": "Red", "pastel red": "Red", "brick red": "Red", "dark red": "Red", "silk red": "Red", "silk fresh red": "Red", "diamond red": "Red", "neon red": "Red", "transparent red": "Red", "crimson": "Red", "scarlet": "Red", "ruby": "Red", "burgundy": "Red", "wine": "Red", "maroon": "Red", "cherry": "Red", "tomato": "Red",
  "blue": "Blue", "light blue": "Blue", "gray blue": "Blue", "navy blue": "Blue", "digital blue": "Blue", "starry blue": "Blue", "sparkle blue": "Blue", "transparent blue": "Blue", "silk blue": "Blue", "diamond blue": "Blue", "cobalt": "Blue", "royal": "Blue", "sapphire": "Blue", "midnight": "Blue", "denim": "Blue", "steel": "Blue", "sky": "Blue", "azure": "Blue", "powder": "Blue",
  "green": "Green", "olive green": "Green", "grass green": "Green", "army green": "Green", "light green": "Green", "transparent green": "Green", "bamboo green": "Green", "silk green": "Green", "silk neon green": "Green", "diamond green": "Green", "glow green": "Green", "neon green": "Green", "shimmer dark green": "Green", "shimmer silver green": "Green", "mint": "Green", "emerald": "Green", "jade": "Green", "sage": "Green", "forest": "Green", "pine": "Green", "olive": "Green", "lime": "Green", "chartreuse": "Green", "avocado": "Green",
  "yellow": "Yellow", "highlight yellow": "Yellow", "lemon yellow": "Yellow", "butter yellow": "Yellow", "lemon": "Yellow", "canary": "Yellow", "sunshine": "Yellow", "dandelion": "Yellow", "mustard": "Yellow",
  "orange": "Orange", "diamond orange": "Orange", "neon orange": "Orange", "coral": "Orange", "salmon": "Orange", "peach": "Orange", "sunset": "Orange", "pumpkin": "Orange", "rust": "Orange", "ginger": "Orange", "terracotta": "Orange",
  "purple": "Purple", "silk purple": "Purple", "diamond purple": "Purple", "shimmer purple": "Purple", "sparkle purple": "Purple", "lilac": "Purple", "orchid": "Purple", "grape": "Purple", "amethyst": "Purple", "mauve": "Purple", "plum": "Purple", "indigo": "Purple", "violet": "Purple", "periwinkle": "Purple", "lavender": "Purple",
  "pink": "Pink", "bright pink": "Pink", "baby pink": "Pink", "magenta": "Pink", "hot pink": "Pink", "bubblegum": "Pink", "flamingo": "Pink", "rose": "Pink", "blush": "Pink", "fuchsia": "Pink", "raspberry": "Pink", "strawberry": "Pink", "watermelon": "Pink",
  "brown": "Brown", "chocolate": "Brown", "light brown": "Brown", "wood": "Brown", "taupe": "Brown", "mocha": "Brown", "coffee": "Brown", "espresso": "Brown", "clay": "Brown", "cinnamon": "Brown",
  "gray": "Gray", "grey": "Gray", "space gray": "Gray", "light gray": "Gray", "light grey": "Gray", "cement gray": "Gray", "slate gray": "Gray", "metallic gray": "Gray", "silk gray": "Gray", "diamond gray": "Gray", "ash": "Gray", "smoke": "Gray",
  "gold": "Gold", "royal gold": "Gold", "silk gold": "Gold", "honey": "Gold", "amber": "Gold",
  "silver": "Silver", "silk silver": "Silver", "platinum": "Silver",
  "copper": "Copper", "silk copper": "Copper",
  "bronze": "Bronze", "shimmer bronze": "Bronze",
  "beige": "Beige", "champagne": "Beige", "champagne frost": "Beige", "natural": "Beige", "skin": "Beige", "tan": "Beige", "khaki": "Beige", "sand": "Beige", "nude": "Beige", "blond": "Beige", "caramel": "Beige", "butterscotch": "Beige",
  "turquoise": "Turquoise", "teal": "Turquoise", "cyan": "Turquoise", "aqua": "Turquoise", "seafoam": "Turquoise",
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
  price: number | null;
}

async function scrapeShopifyProduct(productUrl: string): Promise<{ colors: ColorVariant[]; productTitle: string } | null> {
  // Extract handle from various Shopify URL formats
  const urlPatterns = [
    /\/products\/([^/?#]+)/,
    /\/collections\/[^/]+\/products\/([^/?#]+)/,
  ];
  
  let productHandle: string | null = null;
  for (const pattern of urlPatterns) {
    const match = productUrl.match(pattern);
    if (match) {
      productHandle = match[1];
      break;
    }
  }
  
  if (!productHandle) {
    console.log(`Could not extract product handle from URL: ${productUrl}`);
    return null;
  }
  
  // Extract base domain
  const urlObj = new URL(productUrl);
  const baseUrl = `${urlObj.protocol}//${urlObj.hostname}`;
  const jsonUrl = `${baseUrl}/products/${productHandle}.json`;
  
  console.log(`Fetching Shopify JSON: ${jsonUrl}`);
  
  const response = await fetch(jsonUrl, {
    headers: {
      "User-Agent": "Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)",
      "Accept": "application/json",
    },
  });
  
  if (!response.ok) {
    console.log(`Shopify JSON fetch failed: HTTP ${response.status}`);
    return null;
  }
  
  const productData = await response.json();
  const product = productData?.product;
  
  if (!product) {
    console.log("No product data in response");
    return null;
  }
  
  const variants = product.variants || [];
  const images = product.images || [];
  const options = product.options || [];
  
  // Find color option index
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
        price: variant.price ? parseFloat(variant.price) : null,
      });
    }
  } else {
    // No color option - extract from variant titles
    const seenColors = new Set<string>();
    for (const variant of variants) {
      const title = variant.title || variant.option1 || "Default";
      if (title.toLowerCase() === "default title" || seenColors.has(title.toLowerCase())) continue;
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
        price: variant.price ? parseFloat(variant.price) : null,
      });
    }
  }
  
  return {
    colors: colorVariants,
    productTitle: product.title || "",
  };
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
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
    const { filamentId } = await req.json();

    if (!filamentId) {
      return new Response(JSON.stringify({ error: "filamentId required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Fetch the filament
    const { data: filament, error: fetchError } = await supabase
      .from("filaments")
      .select("*")
      .eq("id", filamentId)
      .single();

    if (fetchError || !filament) {
      return new Response(JSON.stringify({ error: "Filament not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!filament.product_url) {
      return new Response(JSON.stringify({ error: "Filament has no product URL" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log(`Scraping colors for: ${filament.product_title} from ${filament.product_url}`);

    // Try Shopify scraping
    const result = await scrapeShopifyProduct(filament.product_url);

    if (!result || result.colors.length === 0) {
      // Update this filament with extracted color from title if possible
      const titleColor = filament.product_title.match(/-\s*([^-]+)$/)?.[1]?.trim();
      if (titleColor) {
        const { hex, family } = extractColorInfo(titleColor);
        if (hex || family) {
          await supabase
            .from("filaments")
            .update({ color_hex: hex, color_family: family })
            .eq("id", filamentId);
          
          return new Response(JSON.stringify({
            success: true,
            message: `Updated color from title: ${titleColor}`,
            colorsFound: 1,
            colorsUpdated: 1,
            colors: [{ name: titleColor, hex, family }],
          }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
      }
      
      return new Response(JSON.stringify({
        success: false,
        message: "Could not find color variants from product page",
        colorsFound: 0,
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log(`Found ${result.colors.length} colors: ${result.colors.map(c => c.name).join(", ")}`);

    // Get base product name
    const baseProductName = filament.product_title.replace(/\s*-\s*[^-]+$/, "").trim();
    let colorsUpdated = 0;
    let colorsCreated = 0;

    if (result.colors.length === 1) {
      // Single color - update existing entry
      const color = result.colors[0];
      const { error: updateError } = await supabase
        .from("filaments")
        .update({ 
          color_hex: color.hex,
          color_family: color.family,
          featured_image: color.imageUrl || filament.featured_image,
        })
        .eq("id", filamentId);

      if (!updateError) {
        colorsUpdated = 1;
        console.log(`Updated ${filament.product_title} with color: ${color.name} (${color.hex})`);
      }
    } else {
      // Multiple colors - update/create variants
      for (const color of result.colors) {
        const colorProductTitle = `${baseProductName} - ${color.name}`;
        
        // Check if this color variant already exists
        const { data: existing } = await supabase
          .from("filaments")
          .select("id")
          .eq("vendor", filament.vendor)
          .eq("product_title", colorProductTitle)
          .maybeSingle();
        
        if (existing) {
          // Update existing
          const { error: updateError } = await supabase
            .from("filaments")
            .update({ 
              color_hex: color.hex,
              color_family: color.family,
              featured_image: color.imageUrl || undefined,
            })
            .eq("id", existing.id);
          
          if (!updateError) {
            colorsUpdated++;
          }
        } else {
          // Create new color variant
          const newEntry = {
            product_title: colorProductTitle,
            vendor: filament.vendor,
            material: filament.material,
            color_hex: color.hex,
            color_family: color.family,
            featured_image: color.imageUrl || filament.featured_image,
            product_url: filament.product_url,
            variant_price: color.price || filament.variant_price,
            diameter_nominal_mm: filament.diameter_nominal_mm,
            net_weight_g: filament.net_weight_g,
            nozzle_temp_min_c: filament.nozzle_temp_min_c,
            nozzle_temp_max_c: filament.nozzle_temp_max_c,
            bed_temp_min_c: filament.bed_temp_min_c,
            bed_temp_max_c: filament.bed_temp_max_c,
            high_speed_capable: filament.high_speed_capable,
            is_nozzle_abrasive: filament.is_nozzle_abrasive,
            tds_url: filament.tds_url,
          };
          
          const { error: insertError } = await supabase
            .from("filaments")
            .insert(newEntry);
          
          if (!insertError) {
            colorsCreated++;
            console.log(`Created: ${colorProductTitle} (${color.hex})`);
          } else {
            console.error(`Failed to create ${colorProductTitle}:`, insertError.message);
          }
        }
      }
      
      // Update original entry if it doesn't have a color suffix
      if (!filament.product_title.includes(" - ")) {
        const firstColor = result.colors[0];
        await supabase
          .from("filaments")
          .update({ 
            color_hex: firstColor.hex,
            color_family: firstColor.family,
            featured_image: firstColor.imageUrl || filament.featured_image,
          })
          .eq("id", filamentId);
        colorsUpdated++;
      }
    }

    return new Response(JSON.stringify({
      success: true,
      message: `Found ${result.colors.length} colors, updated ${colorsUpdated}, created ${colorsCreated}`,
      colorsFound: result.colors.length,
      colorsUpdated,
      colorsCreated,
      colors: result.colors,
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error: unknown) {
    console.error("Error:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
