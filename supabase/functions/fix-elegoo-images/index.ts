import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

/**
 * Log an activity entry to the sync_activity_log table
 */
async function logActivity(
  supabase: any,
  jobId: string | null,
  phase: string,
  action: string,
  level: 'info' | 'warning' | 'error' | 'success' = 'info',
  details?: {
    region?: string;
    productId?: string;
    productTitle?: string;
    oldValue?: any;
    newValue?: any;
    count?: number;
    message?: string;
    [key: string]: any;
  }
): Promise<void> {
  if (!jobId) return; // Skip logging if no jobId provided
  
  try {
    await supabase.from('sync_activity_log').insert({
      job_id: jobId,
      phase,
      region: details?.region || null,
      action,
      product_id: details?.productId || null,
      product_title: details?.productTitle || null,
      details: details ? JSON.parse(JSON.stringify(details)) : null,
      level,
    });
  } catch (err) {
    console.error(`[FIX-ELEGOO-IMAGES] Failed to log activity: ${err}`);
  }
}

// Map of product lines to their base Elegoo product URLs
// Each product page contains color variant images
const ELEGOO_PRODUCT_PAGES: Record<string, string> = {
  // ABS
  "ABS": "https://us.elegoo.com/collections/filaments/products/elegoo-abs-1kg-filament",
  "ABS Filament 5 kg": "https://us.elegoo.com/collections/filaments/products/elegoo-abs-filament-5-kg",
  "ABS Filament 10 kg": "https://us.elegoo.com/collections/filaments/products/elegoo-abs-filament-10-kg",
  // PLA
  "PLA": "https://us.elegoo.com/collections/filaments/products/elegoo-pla-filament-1-75mm-1kg-spool",
  "PLA+": "https://us.elegoo.com/collections/filaments/products/elegoo-pla-plus-filament-1-75mm-1kg-spool",
  "PLA Filament 5 kg": "https://us.elegoo.com/collections/filaments/products/elegoo-pla-filament-5-kg",
  "PLA Filament 10 kg": "https://us.elegoo.com/collections/filaments/products/elegoo-pla-filament-10-kg",
  // PETG
  "PETG": "https://us.elegoo.com/collections/filaments/products/elegoo-petg-filament-1-75mm-1kg-spool",
  "PETG+": "https://us.elegoo.com/collections/filaments/products/elegoo-petg-plus-filament",
  // High Speed / Rapid lines
  "Rapid PLA": "https://us.elegoo.com/collections/filaments/products/elegoo-rapid-pla-filament-1-75mm-1kg-spool",
  "Rapid PLA+": "https://us.elegoo.com/collections/filaments/products/elegoo-rapid-pla-plus-filament-1-75mm-1kg-spool",
  "High Speed PLA": "https://us.elegoo.com/collections/filaments/products/elegoo-high-speed-pla-filament",
  "High Speed PLA+": "https://us.elegoo.com/collections/filaments/products/elegoo-high-speed-pla-plus-filament",
  "High Speed PETG": "https://us.elegoo.com/collections/filaments/products/elegoo-high-speed-petg-filament",
  "High Speed PETG+": "https://us.elegoo.com/collections/filaments/products/elegoo-high-speed-petg-plus-filament",
  // Specialty PLA
  "Silk PLA": "https://us.elegoo.com/collections/filaments/products/elegoo-silk-pla-filament-1-75mm-1kg-spool",
  "Matte PLA": "https://us.elegoo.com/collections/filaments/products/elegoo-matte-pla-filament-1-75mm-1kg-spool",
  "Glow PLA": "https://us.elegoo.com/collections/filaments/products/elegoo-glow-pla-filament",
  "Dual Color PLA": "https://us.elegoo.com/collections/filaments/products/elegoo-dual-color-pla-filament",
  "Galaxy PLA": "https://us.elegoo.com/collections/filaments/products/elegoo-galaxy-pla-filament",
  "Marble PLA": "https://us.elegoo.com/collections/filaments/products/elegoo-marble-pla-filament",
  "Wood PLA": "https://us.elegoo.com/collections/filaments/products/elegoo-wood-pla-filament",
  "Sparkle PLA": "https://us.elegoo.com/collections/filaments/products/elegoo-sparkle-pla-filament",
  // Carbon Fiber
  "PLA-CF": "https://us.elegoo.com/collections/filaments/products/elegoo-pla-cf-filament",
  "PETG-CF": "https://us.elegoo.com/collections/filaments/products/elegoo-petg-cf-filament",
  "PA-CF": "https://us.elegoo.com/collections/filaments/products/elegoo-pa-cf-filament",
  "ABS-CF": "https://us.elegoo.com/collections/filaments/products/elegoo-abs-cf-filament",
  // Other materials
  "TPU": "https://us.elegoo.com/collections/filaments/products/elegoo-tpu-filament-1-75mm-1kg-spool",
  "ASA": "https://us.elegoo.com/collections/filaments/products/elegoo-asa-filament",
  "PA": "https://us.elegoo.com/collections/filaments/products/elegoo-pa-filament",
  "PC": "https://us.elegoo.com/collections/filaments/products/elegoo-pc-filament",
};

/**
 * Dynamically construct a product URL for product lines not in the map
 * This is a fallback to try and find images for new product lines
 */
function constructDynamicProductUrl(productLine: string): string | null {
  // Normalize the product line to a URL-friendly slug
  const slug = productLine
    .toLowerCase()
    .replace(/\+/g, '-plus')
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
  
  // Try common URL patterns
  return `https://us.elegoo.com/collections/filaments/products/elegoo-${slug}-filament`;
}

// Color name variants to match DB entries
const COLOR_ALIASES: Record<string, string[]> = {
  "grey": ["gray"],
  "gray": ["grey"],
  "transparent": ["clear", "translucent"],
  "clear": ["transparent", "translucent"],
  "translucent": ["transparent", "clear"],
  "midnight blue": ["midnight", "dark blue"],
  "sky blue": ["light blue"],
  "forest green": ["dark green"],
  "army green": ["olive green", "military green"],
  "burgundy": ["wine red", "burgundy red"],
  "wine": ["wine red", "burgundy"],
  "beige": ["cream", "natural"],
  "cream": ["beige", "ivory"],
  "natural": ["beige", "cream"],
  "space gray": ["space grey"],
  "space grey": ["space gray"],
};

interface VariantImageData {
  color: string;
  imageUrl: string;
  variantId?: string;
}

// Enhanced extraction of color variant images from Elegoo product page HTML
function extractVariantImages(html: string, pageUrl: string): VariantImageData[] {
  const variants: VariantImageData[] = [];
  const seenColors = new Set<string>();

  console.log(`[ELEGOO-IMAGES] 🔍 Starting extraction from ${pageUrl}`);
  console.log(`[ELEGOO-IMAGES] 📄 HTML length: ${html.length} chars`);

  // Pattern 1: Shopify product JSON with variants array
  // Look for the main product JSON that Shopify embeds
  const shopifyJsonPattern = /var\s+meta\s*=\s*({[\s\S]*?"variants"[\s\S]*?});/;
  const metaMatch = html.match(shopifyJsonPattern);
  if (metaMatch) {
    console.log(`[ELEGOO-IMAGES] ✓ Found meta JSON pattern`);
    try {
      const meta = JSON.parse(metaMatch[1]);
      if (meta.product?.variants) {
        console.log(`[ELEGOO-IMAGES] 📦 Found ${meta.product.variants.length} variants in meta.product.variants`);
        for (const variant of meta.product.variants) {
          const title = (variant.name || variant.title || '').toLowerCase().trim();
          const featuredImage = variant.featured_image?.src || variant.image?.src;
          if (title && featuredImage && !seenColors.has(title)) {
            seenColors.add(title);
            variants.push({
              color: title,
              imageUrl: featuredImage.startsWith('//') ? 'https:' + featuredImage : featuredImage,
              variantId: variant.id?.toString(),
            });
            console.log(`[ELEGOO-IMAGES]   → Color: "${title}" Image: ${featuredImage.substring(0, 60)}...`);
          }
        }
      }
    } catch (e) {
      console.log("[ELEGOO-IMAGES] ❌ Meta JSON parse error:", e);
    }
  } else {
    console.log(`[ELEGOO-IMAGES] ✗ No meta JSON pattern found`);
  }

  // Pattern 2: Look for product.json endpoint data embedded
  const productJsonPattern = /"product"\s*:\s*({[\s\S]*?"variants"\s*:\s*\[[\s\S]*?\][\s\S]*?})/;
  const productMatch = html.match(productJsonPattern);
  if (productMatch && variants.length === 0) {
    console.log(`[ELEGOO-IMAGES] ✓ Found product JSON pattern`);
    try {
      const product = JSON.parse(productMatch[1]);
      if (product.variants) {
        console.log(`[ELEGOO-IMAGES] 📦 Found ${product.variants.length} variants in product JSON`);
        for (const variant of product.variants) {
          // Shopify variants have option1, option2, etc for color
          const colorOption = variant.option1 || variant.title || '';
          const colorLower = colorOption.toLowerCase().trim();
          const featuredImage = variant.featured_image?.src;
          if (colorLower && featuredImage && !seenColors.has(colorLower)) {
            seenColors.add(colorLower);
            variants.push({
              color: colorLower,
              imageUrl: featuredImage.startsWith('//') ? 'https:' + featuredImage : featuredImage,
              variantId: variant.id?.toString(),
            });
            console.log(`[ELEGOO-IMAGES]   → Color: "${colorLower}" Image: ${featuredImage.substring(0, 60)}...`);
          }
        }
      }
    } catch (e) {
      console.log("[ELEGOO-IMAGES] ❌ Product JSON parse error:", e);
    }
  }

  // Pattern 2b: Look for window.__INITIAL_STATE__ or similar Shopify patterns
  const initialStatePattern = /window\.__INITIAL_STATE__\s*=\s*({[\s\S]*?});?\s*(?:<\/script>|window\.)/;
  const stateMatch = html.match(initialStatePattern);
  if (stateMatch && variants.length === 0) {
    console.log(`[ELEGOO-IMAGES] ✓ Found __INITIAL_STATE__ pattern`);
    try {
      const state = JSON.parse(stateMatch[1]);
      // Navigate to product variants
      const product = state?.product || state?.productData?.product;
      if (product?.variants) {
        console.log(`[ELEGOO-IMAGES] 📦 Found ${product.variants.length} variants in INITIAL_STATE`);
        for (const variant of product.variants) {
          const colorOption = variant.option1 || variant.title || variant.name || '';
          const colorLower = colorOption.toLowerCase().trim();
          const featuredImage = variant.featured_image?.src || variant.image;
          if (colorLower && featuredImage && !seenColors.has(colorLower)) {
            seenColors.add(colorLower);
            variants.push({
              color: colorLower,
              imageUrl: featuredImage.startsWith('//') ? 'https:' + featuredImage : featuredImage,
            });
          }
        }
      }
    } catch (e) {
      console.log("[ELEGOO-IMAGES] ❌ INITIAL_STATE parse error:", e);
    }
  }

  // Pattern 3: Look for variant-option blocks with data attributes
  console.log(`[ELEGOO-IMAGES] 🔍 Checking variant-option patterns...`);
  const variantOptionPattern = /<(?:label|button|div|span)[^>]*(?:data-value|data-option-value)="([^"]+)"[^>]*>[\s\S]*?(?:<img[^>]*src="([^"]+)")/gi;
  let match;
  let pattern3Count = 0;
  while ((match = variantOptionPattern.exec(html)) !== null) {
    const colorRaw = match[1];
    const imageUrl = match[2];
    const colorLower = colorRaw.toLowerCase().trim();
    
    if (colorLower && imageUrl && !seenColors.has(colorLower)) {
      seenColors.add(colorLower);
      variants.push({
        color: colorLower,
        imageUrl: imageUrl.startsWith('//') ? 'https:' + imageUrl : imageUrl,
      });
      pattern3Count++;
    }
  }
  if (pattern3Count > 0) {
    console.log(`[ELEGOO-IMAGES] ✓ Pattern 3 found ${pattern3Count} variants`);
  }

  // Pattern 4: Extract from Shopify CDN image URLs with variant info
  // Elegoo images often follow pattern: product-title_color.jpg
  console.log(`[ELEGOO-IMAGES] 🔍 Checking CDN URL patterns...`);
  const imgPattern = /https?:\/\/cdn\.shopify\.com\/s\/files\/[^"'\s]+?(?:elegoo|filament)[^"'\s]*?[-_]([a-z]+(?:[-\s][a-z]+)*)(?:[-_]|\.(?:jpg|png|webp))/gi;
  let pattern4Count = 0;
  while ((match = imgPattern.exec(html)) !== null) {
    const fullUrl = match[0].replace(/\.(jpg|png|webp).*/, '.$1');
    const colorPart = match[1].toLowerCase().trim();
    
    // Skip if it's a generic word
    if (['filament', 'spool', 'product', 'main', 'featured', 'hero'].includes(colorPart)) continue;
    
    if (colorPart && !seenColors.has(colorPart)) {
      seenColors.add(colorPart);
      variants.push({
        color: colorPart,
        imageUrl: fullUrl,
      });
      pattern4Count++;
    }
  }
  if (pattern4Count > 0) {
    console.log(`[ELEGOO-IMAGES] ✓ Pattern 4 found ${pattern4Count} variants from CDN URLs`);
  }

  // Pattern 5: Look for image gallery with color-specific filenames
  console.log(`[ELEGOO-IMAGES] 🔍 Checking gallery img alt patterns...`);
  const galleryImgPattern = /<img[^>]*src="([^"]+cdn\.shopify\.com[^"]+)"[^>]*alt="([^"]*(?:black|white|red|blue|green|grey|gray|orange|yellow|pink|purple|brown|gold|silver|copper|transparent|natural|beige)[^"]*)"[^>]*>/gi;
  let pattern5Count = 0;
  while ((match = galleryImgPattern.exec(html)) !== null) {
    let imageUrl = match[1];
    const altText = match[2].toLowerCase();
    
    // Extract color from alt text
    const colorMatch = altText.match(/(black|white|red|blue|green|grey|gray|orange|yellow|pink|purple|brown|gold|silver|copper|transparent|natural|beige|matte\s+\w+|silk\s+\w+)/);
    if (colorMatch) {
      const colorLower = colorMatch[1].trim();
      if (!seenColors.has(colorLower)) {
        seenColors.add(colorLower);
        if (imageUrl.startsWith('//')) imageUrl = 'https:' + imageUrl;
        variants.push({
          color: colorLower,
          imageUrl,
        });
        pattern5Count++;
      }
    }
  }
  if (pattern5Count > 0) {
    console.log(`[ELEGOO-IMAGES] ✓ Pattern 5 found ${pattern5Count} variants from img alt`);
  }

  // Pattern 6: Try Shopify product.json API directly (as fallback data in HTML)
  const productJsonUrl = pageUrl.replace(/\/?$/, '.json');
  const jsonEmbedPattern = new RegExp(`"${productJsonUrl.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}"[^}]*"variants":\\s*\\[([^\\]]+)\\]`, 'i');
  const jsonEmbed = html.match(jsonEmbedPattern);
  if (jsonEmbed && variants.length === 0) {
    console.log(`[ELEGOO-IMAGES] ✓ Found embedded product.json reference`);
  }

  console.log(`[ELEGOO-IMAGES] ✅ Extracted ${variants.length} total variant images from ${pageUrl}`);
  if (variants.length === 0) {
    // Log some HTML samples to help debug
    console.log(`[ELEGOO-IMAGES] 🔍 DEBUG: First 500 chars of HTML:`);
    console.log(html.substring(0, 500));
    console.log(`[ELEGOO-IMAGES] 🔍 DEBUG: Checking for variant-related content...`);
    console.log(`[ELEGOO-IMAGES]   Contains "variants": ${html.includes('"variants"')}`);
    console.log(`[ELEGOO-IMAGES]   Contains "option1": ${html.includes('"option1"')}`);
    console.log(`[ELEGOO-IMAGES]   Contains "featured_image": ${html.includes('"featured_image"')}`);
    console.log(`[ELEGOO-IMAGES]   Contains "cdn.shopify.com": ${html.includes('cdn.shopify.com')}`);
  } else {
    console.log(`[ELEGOO-IMAGES] 📋 Colors found: ${Array.from(seenColors).join(', ')}`);
  }
  return variants;
}

// Match a filament color to extracted variants
function matchColorToVariant(
  filamentColor: string,
  variants: VariantImageData[]
): VariantImageData | null {
  const colorLower = filamentColor.toLowerCase().trim();

  // Direct exact match
  let match = variants.find(v => v.color === colorLower);
  if (match) return match;

  // Check color aliases
  const aliases = COLOR_ALIASES[colorLower] || [];
  for (const alias of aliases) {
    match = variants.find(v => v.color === alias);
    if (match) return match;
  }

  // Check reverse aliases (the variant might be the alias)
  for (const [baseColor, aliasList] of Object.entries(COLOR_ALIASES)) {
    if (aliasList.includes(colorLower)) {
      match = variants.find(v => v.color === baseColor);
      if (match) return match;
    }
  }

  // Partial match - color contains variant color or vice versa
  for (const variant of variants) {
    // "matte black" contains "black"
    if (colorLower.includes(variant.color) || variant.color.includes(colorLower)) {
      return variant;
    }
    // Check if variant contains any word from our color
    const colorWords = colorLower.split(/\s+/);
    const variantWords = variant.color.split(/\s+/);
    for (const cw of colorWords) {
      if (cw.length >= 3 && variantWords.some(vw => vw === cw)) {
        return variant;
      }
    }
  }

  // Fuzzy match - check if core color word matches
  const coreColors = ['black', 'white', 'red', 'blue', 'green', 'grey', 'gray', 'orange', 'yellow', 'pink', 'purple', 'brown', 'gold', 'silver', 'copper', 'beige', 'natural'];
  for (const core of coreColors) {
    if (colorLower.includes(core)) {
      match = variants.find(v => v.color.includes(core));
      if (match) return match;
    }
  }

  return null;
}

// Determine product line from title (expanded to match all Elegoo lines)
function getProductLine(title: string): string | null {
  const titleLower = title.toLowerCase();

  // Check specific product lines first (order matters - most specific first)
  if (titleLower.includes("pla-cf") || titleLower.includes("pla cf")) return "PLA-CF";
  if (titleLower.includes("petg-cf") || titleLower.includes("petg cf")) return "PETG-CF";
  if (titleLower.includes("abs-cf") || titleLower.includes("abs cf")) return "ABS-CF";
  if (titleLower.includes("pa-cf") || titleLower.includes("pa cf")) return "PA-CF";
  if (titleLower.includes("silk pla")) return "Silk PLA";
  if (titleLower.includes("matte pla")) return "Matte PLA";
  if (titleLower.includes("glow pla")) return "Glow PLA";
  if (titleLower.includes("dual color pla") || titleLower.includes("dual-color pla")) return "Dual Color PLA";
  if (titleLower.includes("galaxy pla")) return "Galaxy PLA";
  if (titleLower.includes("marble pla")) return "Marble PLA";
  if (titleLower.includes("wood pla")) return "Wood PLA";
  if (titleLower.includes("sparkle pla")) return "Sparkle PLA";
  if (titleLower.includes("high speed petg+") || titleLower.includes("high speed petg plus")) return "High Speed PETG+";
  if (titleLower.includes("high speed petg")) return "High Speed PETG";
  if (titleLower.includes("high speed pla+") || titleLower.includes("high speed pla plus")) return "High Speed PLA+";
  if (titleLower.includes("high speed pla")) return "High Speed PLA";
  if (titleLower.includes("rapid pla+") || titleLower.includes("rapid pla plus")) return "Rapid PLA+";
  if (titleLower.includes("rapid pla")) return "Rapid PLA";
  if (titleLower.includes("pla+") || titleLower.includes("pla plus")) return "PLA+";
  if (titleLower.includes("petg+") || titleLower.includes("petg plus")) return "PETG+";
  if (titleLower.includes("abs filament 10 kg") || titleLower.includes("abs 10kg")) return "ABS Filament 10 kg";
  if (titleLower.includes("abs filament 5 kg") || titleLower.includes("abs 5kg")) return "ABS Filament 5 kg";
  if (titleLower.includes("pla filament 10 kg") || titleLower.includes("pla 10kg")) return "PLA Filament 10 kg";
  if (titleLower.includes("pla filament 5 kg") || titleLower.includes("pla 5kg")) return "PLA Filament 5 kg";
  if (titleLower.includes("asa")) return "ASA";
  if (titleLower.includes("tpu")) return "TPU";
  if (titleLower.includes("petg")) return "PETG";
  if (titleLower.includes("abs")) return "ABS";
  if (titleLower.includes("pla")) return "PLA";
  if (titleLower.includes("pa") || titleLower.includes("nylon")) return "PA";
  if (titleLower.includes("pc")) return "PC";

  return null;
}

// Extract color from filament title
function extractColor(title: string): string {
  // Try to extract color from pattern "Material - Color" or "Material 1kg - Color"
  const dashMatch = title.match(/[-–]\s*([^-–]+)$/);
  if (dashMatch) {
    // Clean up the color part - remove weight specs
    let color = dashMatch[1].trim();
    color = color.replace(/\s*\d+(?:\.\d+)?(?:kg|g|mm)\s*/gi, '').trim();
    return color;
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
    let body: Record<string, unknown> = {};
    try {
      body = await req.json();
    } catch {
      // No body or invalid JSON
    }

    const {
      dryRun = false,
      productLine = null,
      limit = 200,
      forceUpdate = false, // If true, update even if image already exists
      jobId = null, // Optional: for detailed activity logging
    } = body as { dryRun?: boolean; productLine?: string | null; limit?: number; forceUpdate?: boolean; jobId?: string | null };

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    console.log("=== ELEGOO IMAGE FIX (Enhanced) ===");
    console.log(`Options: dryRun=${dryRun}, productLine=${productLine}, limit=${limit}, forceUpdate=${forceUpdate}`);

    // Fetch Elegoo filaments
    let query = supabase
      .from("filaments")
      .select("id, product_title, featured_image, color_hex")
      .eq("vendor", "Elegoo")
      .order("product_title")
      .limit(limit);

    // Optionally filter to only those without good images
    if (!forceUpdate) {
      // Focus on products that might have generic/duplicate images
      // We can't easily filter by "bad" images, so we'll process all and check
    }

    const { data: filaments, error: fetchError } = await query;

    if (fetchError) {
      throw new Error(`Failed to fetch filaments: ${fetchError.message}`);
    }

    console.log(`Found ${filaments?.length || 0} Elegoo filaments`);

    if (!filaments || filaments.length === 0) {
      return new Response(JSON.stringify({
        success: true,
        message: "No Elegoo filaments found",
        stats: { processed: 0, updated: 0, errors: 0, skipped: 0 }
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

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

    console.log(`Grouped into ${Object.keys(filamentsByLine).length} product lines: ${Object.keys(filamentsByLine).join(', ')}`);

    // Track results
    let updated = 0;
    let errors = 0;
    let skipped = 0;
    const results: { id: string; title: string; status: string; newImage?: string | null; oldImage?: string | null; color?: string }[] = [];

    // Cache for scraped product pages
    const pageCache: Record<string, VariantImageData[]> = {};

    // Determine which product lines to process
    // Include lines with known URLs PLUS lines we can try with dynamic URL construction
    const allProductLines = Object.keys(filamentsByLine);
    const productLinesToProcess = productLine
      ? [productLine]
      : allProductLines;

    console.log(`Processing ${productLinesToProcess.length} product lines (${Object.keys(ELEGOO_PRODUCT_PAGES).length} with known URLs)`);

    // Log processing start if jobId provided
    if (jobId) {
      await logActivity(supabase, jobId, 'images', 'processing_started', 'info', {
        message: `Processing ${productLinesToProcess.length} product lines for ${filaments?.length} filaments`,
        productLinesCount: productLinesToProcess.length,
        filamentsCount: filaments?.length,
      });
    }

    for (const line of productLinesToProcess) {
      // Get URL from map or try dynamic construction
      let productUrl: string | null = ELEGOO_PRODUCT_PAGES[line] || null;
      const isDynamicUrl = !productUrl;
      
      if (!productUrl) {
        productUrl = constructDynamicProductUrl(line);
        if (productUrl) {
          console.log(`\n📦 Processing ${line} (dynamic URL): ${productUrl}`);
        }
      } else {
        console.log(`\n📦 Processing ${line}: ${productUrl}`);
      }
      
      if (!productUrl) {
        console.log(`No URL for product line: ${line}`);
        for (const filament of filamentsByLine[line] || []) {
          results.push({ id: filament.id, title: filament.product_title, status: "no_page_url" });
          skipped++;
        }
        continue;
      }
      console.log(`   ${filamentsByLine[line]?.length || 0} filaments in this line`);

      try {
        // Check cache first
        let variants: VariantImageData[] = [];
        if (pageCache[productUrl]) {
          variants = pageCache[productUrl];
          console.log(`   Using cached variants (${variants.length})`);
        } else {
          // Strategy 1: Try Shopify product.json API first (faster, more reliable)
          const jsonUrl = productUrl.replace(/\/?(\?.*)?$/, '.json');
          console.log(`   📋 Trying product.json API: ${jsonUrl}`);
          
          let gotVariantsFromJson = false;
          try {
            const jsonResponse = await fetch(jsonUrl, {
              headers: { 'Accept': 'application/json' }
            });
            
            if (jsonResponse.ok) {
              const productData = await jsonResponse.json();
              const product = productData.product;
              
              if (product?.variants && product.variants.length > 0) {
                console.log(`   ✓ Got ${product.variants.length} variants from product.json`);
                
                for (const variant of product.variants) {
                  // Get color from option1 (typically the color option)
                  const colorOption = variant.option1 || variant.title || '';
                  const colorLower = colorOption.toLowerCase().trim();
                  
                  // Get image - prefer featured_image, fall back to looking in images array
                  let imageUrl = variant.featured_image?.src;
                  
                  // If no featured_image, try to find matching image in product.images
                  if (!imageUrl && product.images && product.images.length > 0) {
                    // Check if variant has image_id
                    if (variant.image_id) {
                      const matchingImage = product.images.find((img: any) => img.id === variant.image_id);
                      if (matchingImage) {
                        imageUrl = matchingImage.src;
                      }
                    }
                    // Also check position-based matching (variant index = image index)
                    if (!imageUrl) {
                      const variantIndex = product.variants.indexOf(variant);
                      if (variantIndex >= 0 && variantIndex < product.images.length) {
                        imageUrl = product.images[variantIndex].src;
                      }
                    }
                  }
                  
                  if (colorLower && imageUrl) {
                    if (imageUrl.startsWith('//')) imageUrl = 'https:' + imageUrl;
                    variants.push({
                      color: colorLower,
                      imageUrl,
                      variantId: variant.id?.toString(),
                    });
                    console.log(`     → "${colorLower}": ${imageUrl.substring(0, 60)}...`);
                  }
                }
                
                if (variants.length > 0) {
                  gotVariantsFromJson = true;
                  pageCache[productUrl] = variants;
                  console.log(`   ✅ Extracted ${variants.length} variants from product.json`);
                }
              } else {
                console.log(`   ⚠️ No variants in product.json`);
              }
            } else {
              console.log(`   ⚠️ product.json returned ${jsonResponse.status}`);
            }
          } catch (jsonErr) {
            console.log(`   ⚠️ product.json fetch failed:`, jsonErr);
          }
          
          // Strategy 2: Fallback to Firecrawl HTML scraping
          if (!gotVariantsFromJson) {
            console.log(`   🔍 Falling back to Firecrawl HTML scrape...`);
            const scrapeResponse = await fetch('https://api.firecrawl.dev/v1/scrape', {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${firecrawlApiKey}`,
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                url: productUrl,
                formats: ['html'],
                waitFor: 3000,
              }),
            });

            if (!scrapeResponse.ok) {
              console.log(`   ❌ Scrape failed: ${scrapeResponse.status}`);
              for (const filament of filamentsByLine[line] || []) {
                results.push({ id: filament.id, title: filament.product_title, status: "scrape_failed" });
                errors++;
              }
              continue;
            }

            const scrapeData = await scrapeResponse.json();
            const html = scrapeData.data?.html || '';

            if (!html || html.length < 1000) {
              console.log(`   ⚠️ HTML too short (${html.length} chars)`);
              for (const filament of filamentsByLine[line] || []) {
                results.push({ id: filament.id, title: filament.product_title, status: "no_html" });
                errors++;
              }
              continue;
            }

            console.log(`   HTML length: ${html.length}`);

            // Extract variant images from HTML
            variants = extractVariantImages(html, productUrl);
            pageCache[productUrl] = variants;
          }

          console.log(`   Found ${variants.length} color variants`);
          if (variants.length > 0) {
            console.log(`   Colors: ${variants.map(v => v.color).join(', ')}`);
          }
        }

        if (variants.length === 0) {
          console.log(`   No variants found, skipping ${line}`);
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
            results.push({ id: filament.id, title: filament.product_title, status: "no_color_in_title" });
            skipped++;
            continue;
          }

          const matchedVariant = matchColorToVariant(color, variants);
          if (!matchedVariant) {
            console.log(`   ✗ No match for "${color}" in ${line}`);
            results.push({ id: filament.id, title: filament.product_title, status: "no_match", color });
            skipped++;
            
            // Log no match
            if (jobId) {
              await logActivity(supabase, jobId, 'images', 'no_match', 'warning', {
                productId: filament.id,
                productTitle: filament.product_title,
                message: `No variant image match for color "${color}"`,
                color,
                productLine: line,
              });
            }
            continue;
          }

          // Check if this is actually a different/better image
          if (filament.featured_image === matchedVariant.imageUrl && !forceUpdate) {
            results.push({ id: filament.id, title: filament.product_title, status: "already_correct", color });
            skipped++;
            continue;
          }

          console.log(`   ✓ Matched "${color}" → ${matchedVariant.imageUrl.substring(0, 60)}...`);

          if (!dryRun) {
            const { error: updateError } = await supabase
              .from("filaments")
              .update({
                featured_image: matchedVariant.imageUrl,
                updated_at: new Date().toISOString()
              })
              .eq("id", filament.id);

            if (updateError) {
              console.log(`   ✗ DB update failed: ${updateError.message}`);
              results.push({ id: filament.id, title: filament.product_title, status: "db_error", color });
              errors++;
              
              // Log DB error
              if (jobId) {
                await logActivity(supabase, jobId, 'images', 'update_failed', 'error', {
                  productId: filament.id,
                  productTitle: filament.product_title,
                  message: `Database update failed: ${updateError.message}`,
                  error: updateError.message,
                });
              }
            } else {
              results.push({
                id: filament.id,
                title: filament.product_title,
                status: "updated",
                newImage: matchedVariant.imageUrl,
                oldImage: filament.featured_image,
                color
              });
              updated++;
              
              // Log successful update
              if (jobId) {
                await logActivity(supabase, jobId, 'images', 'image_updated', 'success', {
                  productId: filament.id,
                  productTitle: filament.product_title,
                  message: `Updated image for "${color}"`,
                  color,
                  oldImage: filament.featured_image,
                  newImage: matchedVariant.imageUrl,
                });
              }
            }
          } else {
            results.push({
              id: filament.id,
              title: filament.product_title,
              status: "would_update",
              newImage: matchedVariant.imageUrl,
              oldImage: filament.featured_image,
              color
            });
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

    // Report on product lines without URLs
    const linesWithoutUrls = Object.keys(filamentsByLine).filter(line => !ELEGOO_PRODUCT_PAGES[line]);
    if (linesWithoutUrls.length > 0) {
      console.log(`\n⚠️ Product lines without configured URLs: ${linesWithoutUrls.join(', ')}`);
      for (const line of linesWithoutUrls) {
        for (const filament of filamentsByLine[line] || []) {
          results.push({ id: filament.id, title: filament.product_title, status: "no_page_url" });
          skipped++;
        }
      }
    }

    console.log(`\n=== COMPLETE ===`);
    console.log(`Updated: ${updated}, Skipped: ${skipped}, Errors: ${errors}`);

    return new Response(JSON.stringify({
      success: true,
      dryRun,
      stats: {
        processed: filaments.length,
        productLinesProcessed: productLinesToProcess.length,
        productLinesTotal: Object.keys(filamentsByLine).length,
        updated,
        skipped,
        errors,
      },
      productLinesWithoutUrls: linesWithoutUrls,
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
