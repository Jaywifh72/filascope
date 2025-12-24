import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import FirecrawlApp from "https://esm.sh/@mendable/firecrawl-js@1.8.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Map of product lines to their base Elegoo product URLs
// Each product page contains color variant images
const ELEGOO_PRODUCT_PAGES: Record<string, string> = {
  // ABS 1kg
  "ABS": "https://us.elegoo.com/collections/filaments/products/elegoo-abs-1kg-filament",
  // ABS 5kg
  "ABS Filament 5 kg": "https://us.elegoo.com/collections/filaments/products/elegoo-abs-filament-5-kg",
  // ABS 10kg  
  "ABS Filament 10 kg": "https://us.elegoo.com/collections/filaments/products/elegoo-abs-filament-10-kg",
  // PLA 1kg
  "PLA": "https://us.elegoo.com/collections/filaments/products/elegoo-pla-filament-1-75mm-1kg-spool",
  // PLA+ 1kg
  "PLA+": "https://us.elegoo.com/collections/filaments/products/elegoo-pla-plus-filament-1-75mm-1kg-spool",
  // PETG 1kg
  "PETG": "https://us.elegoo.com/collections/filaments/products/elegoo-petg-filament-1-75mm-1kg-spool",
  // Rapid PLA 1kg
  "Rapid PLA": "https://us.elegoo.com/collections/filaments/products/elegoo-rapid-pla-filament-1-75mm-1kg-spool",
  // Rapid PLA+ 1kg
  "Rapid PLA+": "https://us.elegoo.com/collections/filaments/products/elegoo-rapid-pla-plus-filament-1-75mm-1kg-spool",
  // Silk PLA 1kg
  "Silk PLA": "https://us.elegoo.com/collections/filaments/products/elegoo-silk-pla-filament-1-75mm-1kg-spool",
  // Matte PLA 1kg
  "Matte PLA": "https://us.elegoo.com/collections/filaments/products/elegoo-matte-pla-filament-1-75mm-1kg-spool",
  // TPU 1kg
  "TPU": "https://us.elegoo.com/collections/filaments/products/elegoo-tpu-filament-1-75mm-1kg-spool",
};

// Color name variants to match DB entries
const COLOR_ALIASES: Record<string, string[]> = {
  "grey": ["gray"],
  "gray": ["grey"],
  "transparent": ["clear"],
  "clear": ["transparent"],
  "midnight blue": ["midnight"],
  "sky blue": ["light blue"],
  "forest green": ["dark green"],
};

interface VariantImageData {
  color: string;
  imageUrl: string;
  productUrl: string;
}

// Extract color variant images from Elegoo product page HTML
function extractVariantImages(html: string): VariantImageData[] {
  const variants: VariantImageData[] = [];
  
  // Pattern 1: Look for variant swatches with data attributes
  // Elegoo uses data-variant-image or similar patterns
  const variantPattern = /data-(?:variant-image|image-src|featured-media)="([^"]+)"[^>]*data-(?:color|value|variant)="([^"]+)"/gi;
  let match;
  while ((match = variantPattern.exec(html)) !== null) {
    let imageUrl = match[1];
    const color = match[2].toLowerCase().trim();
    
    if (imageUrl.startsWith("//")) {
      imageUrl = "https:" + imageUrl;
    }
    
    if (color && imageUrl && !variants.some(v => v.color === color)) {
      variants.push({ color, imageUrl, productUrl: "" });
    }
  }

  // Pattern 2: Look for Shopify product JSON in __NEXT_DATA__ or script tags
  const jsonPattern = /<script[^>]*type="application\/json"[^>]*>([^<]*"variants"[^<]*)<\/script>/gi;
  while ((match = jsonPattern.exec(html)) !== null) {
    try {
      const jsonStr = match[1];
      // Try to find variant image associations
      const variantImagePattern = /"title"\s*:\s*"([^"]+)"[^}]*"featured_image"\s*:\s*\{[^}]*"src"\s*:\s*"([^"]+)"/gi;
      let variantMatch;
      while ((variantMatch = variantImagePattern.exec(jsonStr)) !== null) {
        const title = variantMatch[1].toLowerCase();
        let imageUrl = variantMatch[2];
        
        if (imageUrl.startsWith("//")) {
          imageUrl = "https:" + imageUrl;
        }
        
        // Extract color from variant title
        const colorMatch = title.match(/^([a-z\s]+)/);
        if (colorMatch && imageUrl) {
          const color = colorMatch[1].trim();
          if (!variants.some(v => v.color === color)) {
            variants.push({ color, imageUrl, productUrl: "" });
          }
        }
      }
    } catch (e) {
      console.log("JSON parse error:", e);
    }
  }

  // Pattern 3: Look for variant color selectors with associated images
  // <label data-option-value="Black"> ... <img src="...">
  const selectorPattern = /<(?:label|button|div)[^>]*data-(?:option-value|value)="([^"]+)"[^>]*>[\s\S]*?<img[^>]*src="([^"]+)"[^>]*>/gi;
  while ((match = selectorPattern.exec(html)) !== null) {
    const color = match[1].toLowerCase().trim();
    let imageUrl = match[2];
    
    if (imageUrl.startsWith("//")) {
      imageUrl = "https:" + imageUrl;
    }
    
    if (color && imageUrl && !variants.some(v => v.color === color)) {
      variants.push({ color, imageUrl, productUrl: "" });
    }
  }

  // Pattern 4: Look for color option images in Shopify format
  // Often in format: <div class="product-option__item" data-option-value="Black"><img src="..." /></div>
  const colorOptionPattern = /data-option-value="([^"]+)"[^>]*>[\s\S]*?(?:src|data-src)="([^"]+\.(?:jpg|png|webp)[^"]*)"[\s\S]*?<\/(?:label|button|div)>/gi;
  while ((match = colorOptionPattern.exec(html)) !== null) {
    const color = match[1].toLowerCase().trim();
    let imageUrl = match[2];
    
    if (imageUrl.startsWith("//")) {
      imageUrl = "https:" + imageUrl;
    }
    
    if (color && imageUrl && !variants.some(v => v.color === color)) {
      variants.push({ color, imageUrl, productUrl: "" });
    }
  }

  // Pattern 5: Look for product images with color in filename
  // e.g., ABS-Black-1kg.jpg, elegoo-pla-red.png
  const imgPattern = /<img[^>]*src="([^"]+(?:elegoo|filament|pla|abs|petg)[^"]*(?:black|white|red|blue|green|grey|gray|orange|yellow|pink|purple)[^"]*\.(?:jpg|png|webp)[^"]*)"[^>]*>/gi;
  while ((match = imgPattern.exec(html)) !== null) {
    let imageUrl = match[1];
    
    if (imageUrl.startsWith("//")) {
      imageUrl = "https:" + imageUrl;
    }
    
    // Extract color from URL
    const colorInUrl = imageUrl.toLowerCase().match(/(black|white|red|blue|green|grey|gray|orange|yellow|pink|purple|brown|gold|silver|copper|transparent)/);
    if (colorInUrl) {
      const color = colorInUrl[1];
      if (!variants.some(v => v.color === color)) {
        variants.push({ color, imageUrl, productUrl: "" });
      }
    }
  }

  console.log(`[ELEGOO-IMAGES] Extracted ${variants.length} variant images from HTML`);
  return variants;
}

// Match a filament color to extracted variants
function matchColorToVariant(
  filamentColor: string, 
  variants: VariantImageData[]
): VariantImageData | null {
  const colorLower = filamentColor.toLowerCase().trim();
  
  // Direct match
  let match = variants.find(v => v.color === colorLower);
  if (match) return match;
  
  // Check aliases
  const aliases = COLOR_ALIASES[colorLower] || [];
  for (const alias of aliases) {
    match = variants.find(v => v.color === alias);
    if (match) return match;
  }
  
  // Partial match (e.g., "matte black" matches "black")
  for (const variant of variants) {
    if (colorLower.includes(variant.color) || variant.color.includes(colorLower)) {
      return variant;
    }
  }
  
  return null;
}

// Determine product line from title
function getProductLine(title: string): string | null {
  const titleLower = title.toLowerCase();
  
  // Check specific product lines first (order matters)
  if (titleLower.includes("silk pla")) return "Silk PLA";
  if (titleLower.includes("matte pla")) return "Matte PLA";
  if (titleLower.includes("rapid pla+")) return "Rapid PLA+";
  if (titleLower.includes("rapid pla")) return "Rapid PLA";
  if (titleLower.includes("pla+") || titleLower.includes("pla plus")) return "PLA+";
  if (titleLower.includes("abs filament 10 kg") || titleLower.includes("abs 10kg")) return "ABS Filament 10 kg";
  if (titleLower.includes("abs filament 5 kg") || titleLower.includes("abs 5kg")) return "ABS Filament 5 kg";
  if (titleLower.includes("tpu")) return "TPU";
  if (titleLower.includes("petg")) return "PETG";
  if (titleLower.includes("abs")) return "ABS";
  if (titleLower.includes("pla")) return "PLA";
  
  return null;
}

// Extract color from filament title
function extractColor(title: string): string {
  // Try to extract color from pattern "Material - Color"
  const dashMatch = title.match(/[-–]\s*([^-–]+)$/);
  if (dashMatch) {
    return dashMatch[1].trim();
  }
  return "";
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
    const firecrawlApiKey = Deno.env.get("FIRECRAWL_API_KEY");

    if (!firecrawlApiKey) {
      return new Response(JSON.stringify({ error: "Firecrawl API key not configured" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Auth check
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

    // Parse options
    let body = {};
    try {
      body = await req.json();
    } catch {
      // No body or invalid JSON
    }
    
    const { 
      dryRun = false, 
      productLine = null,
      limit = 100 
    } = body as { dryRun?: boolean; productLine?: string | null; limit?: number };

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    console.log("=== ELEGOO IMAGE FIX ===");
    console.log(`Options: dryRun=${dryRun}, productLine=${productLine}, limit=${limit}`);

    // Fetch Elegoo filaments - focus on those that likely have duplicate images
    let query = supabase
      .from("filaments")
      .select("id, product_title, featured_image, color_hex")
      .eq("vendor", "Elegoo")
      .limit(limit);

    const { data: filaments, error: fetchError } = await query;

    if (fetchError) {
      throw new Error(`Failed to fetch filaments: ${fetchError.message}`);
    }

    console.log(`Found ${filaments?.length || 0} Elegoo filaments`);

    if (!filaments || filaments.length === 0) {
      return new Response(JSON.stringify({
        success: true,
        message: "No Elegoo filaments found",
        stats: { processed: 0, updated: 0, errors: 0 }
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const firecrawl = new FirecrawlApp({ apiKey: firecrawlApiKey });
    
    // Group filaments by product line
    const filamentsByLine: Record<string, typeof filaments> = {};
    for (const filament of filaments) {
      const line = getProductLine(filament.product_title);
      if (line) {
        if (!filamentsByLine[line]) {
          filamentsByLine[line] = [];
        }
        filamentsByLine[line].push(filament);
      }
    }

    console.log(`Grouped into ${Object.keys(filamentsByLine).length} product lines`);

    // Track results
    let updated = 0;
    let errors = 0;
    let skipped = 0;
    const results: { id: string; title: string; status: string; image?: string | null; color?: string }[] = [];
    
    // Process each product line
    const productLinesToProcess = productLine 
      ? (ELEGOO_PRODUCT_PAGES[productLine] ? [productLine] : [])
      : Object.keys(filamentsByLine).filter(line => ELEGOO_PRODUCT_PAGES[line]);

    console.log(`Processing ${productLinesToProcess.length} product lines`);

    for (const line of productLinesToProcess) {
      const productUrl = ELEGOO_PRODUCT_PAGES[line];
      if (!productUrl) {
        console.log(`No URL for product line: ${line}`);
        continue;
      }

      console.log(`\n📦 Processing ${line}: ${productUrl}`);

      try {
        // Scrape the product page
        const scrapeResult = await firecrawl.scrapeUrl(productUrl, {
          formats: ["html"],
          waitFor: 3000,
        });

        if (!scrapeResult.success || !scrapeResult.html) {
          console.log(`Failed to scrape ${productUrl}`);
          for (const filament of filamentsByLine[line] || []) {
            results.push({ id: filament.id, title: filament.product_title, status: "scrape_failed" });
            errors++;
          }
          continue;
        }

        console.log(`HTML length: ${scrapeResult.html.length}`);

        // Extract variant images
        const variants = extractVariantImages(scrapeResult.html);
        console.log(`Found ${variants.length} color variants for ${line}`);

        if (variants.length === 0) {
          console.log(`No variants found, skipping ${line}`);
          for (const filament of filamentsByLine[line] || []) {
            results.push({ id: filament.id, title: filament.product_title, status: "no_variants" });
            skipped++;
          }
          continue;
        }

        // Match filaments to variants
        for (const filament of filamentsByLine[line] || []) {
          const color = extractColor(filament.product_title);
          if (!color) {
            results.push({ id: filament.id, title: filament.product_title, status: "no_color" });
            skipped++;
            continue;
          }

          const matchedVariant = matchColorToVariant(color, variants);
          if (!matchedVariant) {
            console.log(`✗ No match for "${color}" in ${line}`);
            results.push({ id: filament.id, title: filament.product_title, status: "no_match", color });
            skipped++;
            continue;
          }

          console.log(`✓ Matched "${color}" to image: ${matchedVariant.imageUrl.substring(0, 60)}...`);

          if (!dryRun) {
            const { error: updateError } = await supabase
              .from("filaments")
              .update({ 
                featured_image: matchedVariant.imageUrl,
                updated_at: new Date().toISOString()
              })
              .eq("id", filament.id);

            if (updateError) {
              console.log(`✗ DB update failed: ${updateError.message}`);
              results.push({ id: filament.id, title: filament.product_title, status: "db_error", color });
              errors++;
            } else {
              results.push({ id: filament.id, title: filament.product_title, status: "updated", image: matchedVariant.imageUrl, color });
              updated++;
            }
          } else {
            results.push({ id: filament.id, title: filament.product_title, status: "would_update", image: matchedVariant.imageUrl, color });
            updated++;
          }
        }
      } catch (e) {
        console.error(`Error processing ${line}:`, e);
        for (const filament of filamentsByLine[line] || []) {
          results.push({ id: filament.id, title: filament.product_title, status: "error" });
          errors++;
        }
      }

      // Rate limiting between product pages
      await new Promise(resolve => setTimeout(resolve, 1500));
    }

    console.log(`\n=== COMPLETE ===`);
    console.log(`Updated: ${updated}, Skipped: ${skipped}, Errors: ${errors}`);

    return new Response(JSON.stringify({
      success: true,
      dryRun,
      stats: {
        processed: filaments.length,
        productLines: productLinesToProcess.length,
        updated,
        skipped,
        errors,
      },
      results
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error) {
    console.error("Error:", error);
    return new Response(JSON.stringify({ error: String(error) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
