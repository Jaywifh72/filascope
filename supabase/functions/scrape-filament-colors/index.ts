import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Color name to hex mapping for common filament colors
const COLOR_HEX_MAP: Record<string, string> = {
  // Basic colors
  'black': '#000000',
  'white': '#FFFFFF',
  'red': '#E53935',
  'blue': '#1E88E5',
  'green': '#43A047',
  'yellow': '#FDD835',
  'orange': '#FB8C00',
  'purple': '#8E24AA',
  'pink': '#EC407A',
  'brown': '#6D4C41',
  'grey': '#757575',
  'gray': '#757575',
  'gold': '#FFD700',
  'silver': '#C0C0C0',
  'bronze': '#CD7F32',
  'copper': '#B87333',
  'beige': '#F5F5DC',
  'cream': '#FFFDD0',
  'ivory': '#FFFFF0',
  'tan': '#D2B48C',
  'khaki': '#C3B091',
  'navy': '#000080',
  'teal': '#008080',
  'cyan': '#00BCD4',
  'aqua': '#00FFFF',
  'turquoise': '#40E0D0',
  'magenta': '#E91E63',
  'maroon': '#800000',
  'burgundy': '#800020',
  'olive': '#808000',
  'lime': '#CDDC39',
  'mint': '#98FF98',
  'coral': '#FF7F50',
  'salmon': '#FA8072',
  'peach': '#FFCBA4',
  'lavender': '#E6E6FA',
  'violet': '#9C27B0',
  'indigo': '#3F51B5',
  'charcoal': '#36454F',
  'graphite': '#383838',
  'slate': '#708090',
  'natural': '#F5F5DC',
  'clear': '#FFFFFF',
  'transparent': '#FFFFFF',
  
  // Fillamentum specific
  'traffic red': '#CC0605',
  'traffic black': '#1C1C1C',
  'traffic white': '#FAF9F6',
  'traffic yellow': '#FAD201',
  'traffic blue': '#063971',
  'signal brown': '#7B3F00',
  'cobalt blue': '#0047AB',
  'concrete grey': '#8D8D8D',
  'anthracite grey': '#293133',
  'luminous orange': '#FF6700',
  'metallic grey': '#8A8D8F',
  'sky blue': '#87CEEB',
  'turquoise green': '#00C4B0',
  'dijon mustard': '#C49102',
  'green grass': '#7CFC00',
  'grey blue': '#6699CC',
  'snow white': '#FFFAFA',
  'vertigo grey': '#4A4A4A',
  'vivid pink': '#FF1493',
  'white aluminium': '#A5A5A5',
  'army green': '#4B5320',
  'black soul': '#0A0A0A',
  'caramel brown': '#8B4513',
  'deep sea': '#003366',
  'flash yellow': '#FFFF00',
  'flirty plum': '#8E4585',
  'ghost white': '#F8F8FF',
  'grey mouse': '#646464',
  'iced green': '#AAFFC3',
  'jungle green': '#29AB87',
  'lagoon': '#017987',
  'lemonade': '#FFFACD',
  'mistake blue': '#5D8AA8',
  'morning mist': '#E6E6E6',
  'noble green': '#009B7D',
  'passion fruit': '#E91E63',
  'perl ruby': '#9B111E',
  'portofino blue': '#4169E1',
  'pure clear': '#FAFAFA',
  'rapunzel silver': '#C4AEAD',
  'urban grey': '#5A5A5A',
  'wizard voodoo': '#663399',
  'crystal clear': '#F5F5F5',
  'vertigo starlight': '#2C2C54',
  'vertigo cherry': '#990000',
  'vertigo galaxy': '#1B1464',
  'vertigo chocolate': '#3D1C02',
  'vertigo jade': '#00A86B',
  'vertigo lava': '#CF1020',
  'vertigo night sky': '#191970',
  'vertigo mystic green': '#2E8B57',
  'neon yellow': '#FFFF00',
  'neon green': '#39FF14',
  'neon orange': '#FF6600',
  'neon pink': '#FF6EC7',
  
  // Wood filament colors
  'southern pine': '#C19A6B',
  'cinnamon': '#D2691E',
  'champagne': '#F7E7CE',
  'rosewood': '#65000B',
  'light wood': '#DEB887',
  'terracotta': '#E2725B',
  'redheart': '#8B0000',
  
  // Polymaker colors
  'galaxy black': '#0C0C0C',
  'galaxy silver': '#B8B8B8',
  'galaxy dark blue': '#1A237E',
  'galaxy purple': '#6A1B9A',
  'galaxy rose': '#C2185B',
  'fossil grey': '#A0A0A0',
  'luminous white': '#F5F5F5',
  'luminous green': '#00FF00',
  'luminous blue': '#00BFFF',
  'luminous red': '#FF0000',
  
  // Prusament colors
  'prusa orange': '#FA6831',
  'jet black': '#0A0A0A',
  'signal white': '#FFFFFF',
  'opal green': '#009688',
  'mystic green': '#2E8B57',
  'mystic brown': '#8B4513',
  'lipstick red': '#C40233',
  'azure blue': '#007FFF',
  
  // Common modifiers
  'light': '#E0E0E0',
  'dark': '#424242',
  'bright': '#FFEB3B',
  'deep': '#1565C0',
  'pale': '#FFF8E1',
  'vivid': '#FF4081',
  'neon': '#39FF14',
  'metallic': '#8A8D8F',
  'glitter': '#FFD700',
  'silk': '#E8DCC4',
  'matte': '#9E9E9E',
  'glossy': '#FFFFFF',
};

function extractColorFromTitle(title: string): string | null {
  const lowerTitle = title.toLowerCase();
  
  // Try to find color after " - " (Fillamentum style)
  const dashMatch = title.match(/\s+-\s+(.+)$/);
  if (dashMatch) {
    return dashMatch[1].trim();
  }
  
  // Try to find color at end of title
  for (const [colorName] of Object.entries(COLOR_HEX_MAP)) {
    if (lowerTitle.endsWith(colorName)) {
      return colorName;
    }
  }
  
  // Check for color anywhere in title
  for (const [colorName] of Object.entries(COLOR_HEX_MAP)) {
    if (lowerTitle.includes(colorName)) {
      return colorName;
    }
  }
  
  return null;
}

function getHexFromColorName(colorName: string): string | null {
  const lowerColor = colorName.toLowerCase().trim();
  
  // Direct match
  if (COLOR_HEX_MAP[lowerColor]) {
    return COLOR_HEX_MAP[lowerColor];
  }
  
  // Check for partial matches (multi-word colors)
  for (const [name, hex] of Object.entries(COLOR_HEX_MAP)) {
    if (lowerColor.includes(name) || name.includes(lowerColor)) {
      return hex;
    }
  }
  
  // Check for basic color at end
  const words = lowerColor.split(' ');
  const lastWord = words[words.length - 1];
  if (COLOR_HEX_MAP[lastWord]) {
    return COLOR_HEX_MAP[lastWord];
  }
  
  return null;
}

async function scrapeColorFromPage(productUrl: string, firecrawlKey: string): Promise<string | null> {
  try {
    console.log(`Scraping color from: ${productUrl}`);
    
    const response = await fetch("https://api.firecrawl.dev/v1/scrape", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${firecrawlKey}`,
      },
      body: JSON.stringify({
        url: productUrl,
        formats: ["html"],
        waitFor: 2000,
      }),
    });
    
    if (!response.ok) {
      console.log(`Firecrawl failed for ${productUrl}: ${response.status}`);
      return null;
    }
    
    const data = await response.json();
    const html = data.data?.html || '';
    
    // Look for hex color patterns in the HTML
    // Common patterns: #RGB, #RRGGBB, rgb(), data attributes
    const hexPatterns = [
      /color[:\s]*["']?(#[0-9A-Fa-f]{6})/gi,
      /background[:\s]*["']?(#[0-9A-Fa-f]{6})/gi,
      /data-color[:\s]*["']?(#[0-9A-Fa-f]{6})/gi,
      /swatch[^>]*style[^>]*background[^:]*:[^#]*(#[0-9A-Fa-f]{6})/gi,
      /"color_hex"[:\s]*["']?(#[0-9A-Fa-f]{6})/gi,
      /"hex"[:\s]*["']?(#[0-9A-Fa-f]{6})/gi,
    ];
    
    for (const pattern of hexPatterns) {
      const matches = html.match(pattern);
      if (matches && matches.length > 0) {
        // Extract just the hex value
        const hexMatch = matches[0].match(/#[0-9A-Fa-f]{6}/i);
        if (hexMatch) {
          console.log(`Found hex color: ${hexMatch[0]}`);
          return hexMatch[0].toUpperCase();
        }
      }
    }
    
    return null;
  } catch (error) {
    console.error(`Error scraping ${productUrl}:`, error);
    return null;
  }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const firecrawlKey = Deno.env.get("FIRECRAWL_API_KEY");
    
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    const { vendor, limit = 50, scrape_pages = false } = await req.json();
    
    console.log(`Processing colors for vendor: ${vendor || 'all'}, limit: ${limit}, scrape_pages: ${scrape_pages}`);
    
    // Fetch filaments without color_hex
    let query = supabase
      .from('filaments')
      .select('id, product_title, color_family, product_url, vendor')
      .is('color_hex', null)
      .limit(limit);
    
    if (vendor) {
      query = query.ilike('vendor', `%${vendor}%`);
    }
    
    const { data: filaments, error: fetchError } = await query;
    
    if (fetchError) {
      throw new Error(`Failed to fetch filaments: ${fetchError.message}`);
    }
    
    console.log(`Found ${filaments?.length || 0} filaments without color_hex`);
    
    const results = {
      processed: 0,
      updated: 0,
      skipped: 0,
      errors: 0,
      details: [] as { id: string; title: string; color_hex: string | null; source: string }[],
    };
    
    for (const filament of filaments || []) {
      results.processed++;
      
      // Step 1: Try to extract color from title
      const colorFromTitle = extractColorFromTitle(filament.product_title);
      let hexColor: string | null = null;
      let source = 'unknown';
      
      if (colorFromTitle) {
        hexColor = getHexFromColorName(colorFromTitle);
        if (hexColor) {
          source = 'title_mapping';
        }
      }
      
      // Step 2: Try color_family mapping if title didn't work
      if (!hexColor && filament.color_family) {
        hexColor = getHexFromColorName(filament.color_family);
        if (hexColor) {
          source = 'color_family_mapping';
        }
      }
      
      // Step 3: Optionally scrape from product page
      if (!hexColor && scrape_pages && filament.product_url && firecrawlKey) {
        hexColor = await scrapeColorFromPage(filament.product_url, firecrawlKey);
        if (hexColor) {
          source = 'page_scrape';
        }
      }
      
      if (hexColor) {
        const { error: updateError } = await supabase
          .from('filaments')
          .update({ color_hex: hexColor })
          .eq('id', filament.id);
        
        if (updateError) {
          console.error(`Failed to update ${filament.id}:`, updateError);
          results.errors++;
        } else {
          results.updated++;
          results.details.push({
            id: filament.id,
            title: filament.product_title,
            color_hex: hexColor,
            source,
          });
        }
      } else {
        results.skipped++;
        console.log(`No color found for: ${filament.product_title}`);
      }
    }
    
    console.log(`Completed: ${results.updated} updated, ${results.skipped} skipped, ${results.errors} errors`);
    
    return new Response(JSON.stringify(results), {
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
