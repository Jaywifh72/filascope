import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Common color mappings for quick lookup (fallback before AI)
const COMMON_COLORS: Record<string, string> = {
  // Basic colors
  "black": "#1A1A1A",
  "white": "#FFFFFF",
  "red": "#E53935",
  "blue": "#1E88E5",
  "green": "#43A047",
  "yellow": "#FDD835",
  "orange": "#FB8C00",
  "purple": "#8E24AA",
  "pink": "#EC407A",
  "gray": "#757575",
  "grey": "#757575",
  "brown": "#6D4C41",
  "gold": "#FFD700",
  "silver": "#C0C0C0",
  "bronze": "#CD7F32",
  "copper": "#B87333",
  "natural": "#F5F5DC",
  "clear": "#E8E8E8",
  "transparent": "#E8E8E8",
  
  // Extended colors
  "navy": "#001F3F",
  "teal": "#008080",
  "cyan": "#00BCD4",
  "magenta": "#E91E63",
  "lime": "#CDDC39",
  "olive": "#808000",
  "maroon": "#800000",
  "beige": "#F5F5DC",
  "ivory": "#FFFFF0",
  "cream": "#FFFDD0",
  "tan": "#D2B48C",
  "khaki": "#C3B091",
  "coral": "#FF7F50",
  "salmon": "#FA8072",
  "peach": "#FFCBA4",
  "mint": "#98FF98",
  "turquoise": "#40E0D0",
  "aqua": "#00FFFF",
  "lavender": "#E6E6FA",
  "violet": "#EE82EE",
  "indigo": "#4B0082",
  "burgundy": "#800020",
  "wine": "#722F37",
  "cherry": "#DE3163",
  "ruby": "#E0115F",
  "crimson": "#DC143C",
  "scarlet": "#FF2400",
  "rose": "#FF007F",
  "blush": "#DE5D83",
  "fuchsia": "#FF00FF",
  "plum": "#DDA0DD",
  "orchid": "#DA70D6",
  "lilac": "#C8A2C8",
  "grape": "#6F2DA8",
  "eggplant": "#614051",
  "charcoal": "#36454F",
  "slate": "#708090",
  "ash": "#B2BEB5",
  "steel": "#71797E",
  "iron": "#48494B",
  "cobalt": "#0047AB",
  "sapphire": "#0F52BA",
  "midnight": "#191970",
  "sky": "#87CEEB",
  "azure": "#007FFF",
  "ocean": "#006994",
  "forest": "#228B22",
  "emerald": "#50C878",
  "jade": "#00A86B",
  "moss": "#8A9A5B",
  "sage": "#9DC183",
  "pine": "#01796F",
  "grass": "#7CFC00",
  "neon": "#39FF14",
  "fluorescent": "#CCFF00",
  "lemon": "#FFF44F",
  "mustard": "#FFDB58",
  "honey": "#EB9605",
  "amber": "#FFBF00",
  "tangerine": "#FF9966",
  "pumpkin": "#FF7518",
  "rust": "#B7410E",
  "cinnamon": "#D2691E",
  "chocolate": "#7B3F00",
  "coffee": "#6F4E37",
  "mocha": "#967969",
  "caramel": "#FFD59A",
  "sand": "#C2B280",
  "desert": "#EDC9AF",
  "terracotta": "#E2725B",
  "clay": "#B66A50",
  "brick": "#CB4154",
  "pearl": "#EAE0C8",
  "champagne": "#F7E7CE",
  "snow": "#FFFAFA",
  "arctic": "#E0FFFF",
  "ice": "#A5F2F3",
  "frost": "#E1F5FE",
  "cosmic": "#2E2D88",
  "galaxy": "#1B1464",
  "space": "#1D1D1D",
  "nebula": "#7B68EE",
  "aurora": "#78FF00",
  
  // Material-specific
  "carbon": "#1C1C1C",
  "graphite": "#383838",
  "obsidian": "#1B1B1B",
  "onyx": "#0F0F0F",
  "jet": "#0A0A0A",
  "ebony": "#555D50",
  "titanium": "#878681",
  "aluminum": "#A9ACB6",
  "chrome": "#DBE4EB",
  "platinum": "#E5E4E2",
  "brass": "#B5A642",
  "nickel": "#727472",
  
  // Special effects
  "glow": "#7FFF00",
  "neon green": "#39FF14",
  "neon orange": "#FF6700",
  "neon pink": "#FF6EC7",
  "neon yellow": "#DFFF00",
  "silk": "#F0EAD6",
  "matte": "#3C3C3C",
  "metallic": "#AAA9AD",
  "glitter": "#FFD700",
  "sparkle": "#F4E99B",
  "rainbow": "#FF0000",
  "multicolor": "#FF0000",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const lovableApiKey = Deno.env.get("OPENAI_API_KEY");

    // Verify user authentication and admin role
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ success: false, error: "No authorization header" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const authClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } }
    });

    const { data: { user }, error: authError } = await authClient.auth.getUser();
    if (authError || !user) {
      console.error("Auth error:", authError);
      return new Response(
        JSON.stringify({ success: false, error: "Invalid authorization" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check admin role
    const { data: isAdmin } = await authClient.rpc("has_role", {
      _user_id: user.id,
      _role: "admin"
    });

    if (!isAdmin) {
      return new Response(
        JSON.stringify({ success: false, error: "Admin access required" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    const { limit = 50, vendor = null, useAI = true } = await req.json().catch(() => ({}));

    console.log(`Starting hex color population. Limit: ${limit}, Vendor: ${vendor || 'all'}, Use AI: ${useAI}`);

    // Fetch filaments missing hex colors
    let query = supabase
      .from("filaments")
      .select("id, product_title, vendor, material, color_family")
      .or("color_hex.is.null,color_hex.eq.")
      .order("vendor")
      .limit(limit);

    if (vendor) {
      query = query.eq("vendor", vendor);
    }

    const { data: filaments, error: fetchError } = await query;

    if (fetchError) {
      console.error("Error fetching filaments:", fetchError);
      throw fetchError;
    }

    console.log(`Found ${filaments?.length || 0} filaments missing hex colors`);

    if (!filaments || filaments.length === 0) {
      return new Response(
        JSON.stringify({ success: true, message: "No filaments found missing hex colors", updated: 0 }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const results: { id: string; title: string; hex: string; method: string }[] = [];
    const errors: { id: string; title: string; error: string }[] = [];

    for (const filament of filaments) {
      try {
        const title = filament.product_title.toLowerCase();
        let hexColor: string | null = null;
        let method = "unknown";

        // Step 1: Try common color mappings first
        for (const [colorName, hex] of Object.entries(COMMON_COLORS)) {
          if (title.includes(colorName)) {
            hexColor = hex;
            method = "dictionary";
            break;
          }
        }

        // Step 2: Check for compound color names
        if (!hexColor) {
          // Check for color patterns like "Signal Red", "Galaxy Black", etc.
          const colorPatterns: Array<{ pattern: RegExp; colors: Record<string, string> }> = [
            { pattern: /signal\s*(red|orange|yellow|green|blue)/i, colors: { red: "#FF0000", orange: "#FF6600", yellow: "#FFFF00", green: "#00FF00", blue: "#0000FF" } },
            { pattern: /galaxy\s*(black|blue|purple)/i, colors: { black: "#1B1464", blue: "#1B1464", purple: "#4B0082" } },
            { pattern: /traffic\s*(black|white|red|yellow|green|blue|purple)/i, colors: { black: "#1A1A1A", white: "#FFFFFF", red: "#E53935", yellow: "#FDD835", green: "#43A047", blue: "#1E88E5", purple: "#8E24AA" } },
            { pattern: /fire\s*(engine|red)/i, colors: { engine: "#CE2029", red: "#CE2029" } },
            { pattern: /ocean\s*(blue|green)/i, colors: { blue: "#006994", green: "#006994" } },
            { pattern: /sky\s*blue/i, colors: { blue: "#87CEEB" } },
            { pattern: /dark\s*(blue|green|red|gray|grey|brown)/i, colors: { blue: "#00008B", green: "#006400", red: "#8B0000", gray: "#3D3D3D", grey: "#3D3D3D", brown: "#3D2314" } },
            { pattern: /light\s*(blue|green|red|gray|grey|brown|pink)/i, colors: { blue: "#ADD8E6", green: "#90EE90", red: "#FFC0CB", gray: "#D3D3D3", grey: "#D3D3D3", brown: "#C4A484", pink: "#FFB6C1" } },
            { pattern: /bright\s*(blue|green|red|yellow|orange|pink|white)/i, colors: { blue: "#0096FF", green: "#00FF00", red: "#FF0000", yellow: "#FFFF00", orange: "#FF6600", pink: "#FF69B4", white: "#FFFFFF" } },
            { pattern: /deep\s*(blue|green|red|purple)/i, colors: { blue: "#00008B", green: "#006400", red: "#8B0000", purple: "#4B0082" } },
            { pattern: /pale\s*(blue|green|pink|yellow)/i, colors: { blue: "#AFEEEE", green: "#98FB98", pink: "#FADADD", yellow: "#FFFFE0" } },
            { pattern: /royal\s*(blue|purple)/i, colors: { blue: "#4169E1", purple: "#7851A9" } },
            { pattern: /electric\s*(blue|green|purple|grey|gray)/i, colors: { blue: "#7DF9FF", green: "#00FF00", purple: "#BF00FF", grey: "#5C5C5C", gray: "#5C5C5C" } },
          ];

          for (const { pattern, colors } of colorPatterns) {
            const match = title.match(pattern);
            if (match && match[1]) {
              const colorKey = match[1].toLowerCase();
              const colorValue = colors[colorKey];
              if (colorValue) {
                hexColor = colorValue;
                method = "pattern";
                break;
              }
            }
          }
        }

        // Step 3: Use AI for complex/unknown colors
        if (!hexColor && useAI && lovableApiKey) {
          try {
            const aiResponse = await fetch("https://api.openai.com/v1/chat/completions", {
              method: "POST",
              headers: {
                Authorization: `Bearer ${lovableApiKey}`,
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                model: "gpt-4o-mini",
                messages: [
                  {
                    role: "system",
                    content: `You are a color expert. Given a 3D printing filament product title, extract the color and return ONLY a valid hex color code (e.g., #FF5733). 
                    
Rules:
- Return ONLY the hex code, nothing else
- If the product is carbon fiber, return a dark gray like #2D2D2D
- If the product is ESD-safe or conductive, return #1A1A1A (black)
- If the product mentions "natural" for nylon/PETG, return #F5E6D3 (translucent beige)
- If the product is PVA or support material, return #E8E8E8 (light gray)
- For specialty materials without color (PEEK, PEI, PEKK), return appropriate natural colors
- If you cannot determine a color, return #808080 (gray)`
                  },
                  {
                    role: "user",
                    content: `Product title: "${filament.product_title}"
Material: ${filament.material || "unknown"}
Color family hint: ${filament.color_family || "none"}`
                  }
                ],
                max_tokens: 20,
                temperature: 0.1,
              }),
            });

            if (aiResponse.ok) {
              const aiData = await aiResponse.json();
              const content = aiData.choices?.[0]?.message?.content?.trim();
              if (content && /^#[0-9A-Fa-f]{6}$/.test(content)) {
                hexColor = content.toUpperCase();
                method = "ai";
              }
            }
          } catch (aiError) {
            console.error(`AI error for ${filament.id}:`, aiError);
          }
        }

        // Step 4: Fallback based on material
        if (!hexColor) {
          if (title.includes("carbon") || title.includes("cf")) {
            hexColor = "#2D2D2D";
            method = "material-fallback";
          } else if (title.includes("esd") || title.includes("conductive")) {
            hexColor = "#1A1A1A";
            method = "material-fallback";
          } else if (title.includes("pva") || title.includes("support")) {
            hexColor = "#E8E8E8";
            method = "material-fallback";
          } else if (title.includes("natural") || title.includes("neutral")) {
            hexColor = "#F5E6D3";
            method = "material-fallback";
          } else {
            hexColor = "#808080"; // Default gray
            method = "fallback";
          }
        }

        // Update the database
        const { error: updateError } = await supabase
          .from("filaments")
          .update({ 
            color_hex: hexColor,
            color_family: filament.color_family || extractColorFamily(hexColor)
          })
          .eq("id", filament.id);

        if (updateError) {
          errors.push({ id: filament.id, title: filament.product_title, error: updateError.message });
        } else {
          results.push({ id: filament.id, title: filament.product_title, hex: hexColor, method });
          console.log(`Updated: ${filament.product_title} -> ${hexColor} (${method})`);
        }

        // Small delay to avoid rate limiting
        if (useAI && method === "ai") {
          await new Promise(resolve => setTimeout(resolve, 100));
        }

      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : "Unknown error";
        errors.push({ id: filament.id, title: filament.product_title, error: errorMsg });
      }
    }

    const summary = {
      success: true,
      total_processed: filaments.length,
      updated: results.length,
      errors: errors.length,
      by_method: {
        dictionary: results.filter(r => r.method === "dictionary").length,
        pattern: results.filter(r => r.method === "pattern").length,
        ai: results.filter(r => r.method === "ai").length,
        material_fallback: results.filter(r => r.method === "material-fallback").length,
        fallback: results.filter(r => r.method === "fallback").length,
      },
      results: results.slice(0, 20), // Return first 20 for preview
      error_details: errors,
    };

    console.log("Hex color population complete:", JSON.stringify(summary.by_method));

    return new Response(
      JSON.stringify(summary),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Error in populate-hex-colors:", error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error instanceof Error ? error.message : "Unknown error" 
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

// Helper to extract color family from hex
function extractColorFamily(hex: string): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);

  // Calculate hue
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = (max + min) / 2 / 255;

  if (max === min) {
    // Achromatic
    if (l < 0.2) return "Black";
    if (l > 0.8) return "White";
    return "Gray";
  }

  const d = max - min;
  let h = 0;

  if (max === r) h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
  else if (max === g) h = ((b - r) / d + 2) / 6;
  else h = ((r - g) / d + 4) / 6;

  h *= 360;

  // Map hue to color family
  if (h < 15 || h >= 345) return "Red";
  if (h < 45) return "Orange";
  if (h < 75) return "Yellow";
  if (h < 165) return "Green";
  if (h < 195) return "Cyan";
  if (h < 255) return "Blue";
  if (h < 285) return "Purple";
  if (h < 345) return "Pink";
  return "Red";
}
