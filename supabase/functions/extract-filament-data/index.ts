/**
 * EXTRACT FILAMENT DATA — Edge Function
 *
 * Receives a product URL + adapter key, fetches product data from the store,
 * normalizes it into filament records, checks for duplicates, and stores
 * results in the onboarding tables.
 *
 * POST { job_id, source_url, adapter_key }
 */

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// ============================================================
// CORS
// ============================================================

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// ============================================================
// Color Hex Map — ~30 common filament colors → approximate hex
// ============================================================

const COLOR_HEX_MAP: Record<string, string> = {
  "white": "#FFFFFF",
  "black": "#000000",
  "red": "#FF0000",
  "blue": "#0000FF",
  "green": "#008000",
  "yellow": "#FFFF00",
  "orange": "#FFA500",
  "pink": "#FFC0CB",
  "purple": "#800080",
  "grey": "#808080",
  "gray": "#808080",
  "gold": "#FFD700",
  "silver": "#C0C0C0",
  "cyan": "#00FFFF",
  "magenta": "#FF00FF",
  "brown": "#8B4513",
  "beige": "#F5F5DC",
  "mint green": "#98FF98",
  "sky blue": "#87CEEB",
  "lavender": "#E6E6FA",
  "olive": "#808000",
  "coffee": "#6F4E37",
  "oak": "#C8AD7F",
  "lemon": "#FFF44F",
  "cherry": "#DE3163",
  "bone white": "#F9F6EE",
  "ceramic white": "#F0EAD6",
  "grass green": "#7CFC00",
  "klein blue": "#002FA7",
  "midnight": "#191970",
  "roasted chestnut": "#4A2C2A",
  "transparent": "#FFFFFF",
  "natural": "#F5F5DC",
  "navy": "#000080",
  "teal": "#008080",
  "coral": "#FF7F50",
  "ivory": "#FFFFF0",
  "charcoal": "#36454F",
  "cream": "#FFFDD0",
  "maroon": "#800000",
  "lime": "#00FF00",
  "peach": "#FFCBA4",
};

// ============================================================
// Color Family Map — color name keywords → family category
// ============================================================

const COLOR_FAMILY_MAP: Record<string, string> = {
  "white": "White", "bone": "White", "ceramic": "White", "ivory": "White", "cream": "White",
  "black": "Black", "charcoal": "Black", "midnight": "Black",
  "red": "Red", "cherry": "Red", "maroon": "Red", "crimson": "Red",
  "blue": "Blue", "navy": "Blue", "sky": "Blue", "klein": "Blue", "cobalt": "Blue", "royal": "Blue",
  "green": "Green", "grass": "Green", "olive": "Green", "mint": "Green", "lime": "Green", "teal": "Green",
  "yellow": "Yellow", "lemon": "Yellow",
  "orange": "Orange", "tangerine": "Orange", "coral": "Orange",
  "pink": "Pink", "rose": "Pink", "salmon": "Pink", "magenta": "Pink",
  "purple": "Purple", "violet": "Purple", "lavender": "Purple", "plum": "Purple",
  "brown": "Brown", "coffee": "Brown", "chestnut": "Brown", "oak": "Brown", "chocolate": "Brown",
  "grey": "Grey", "gray": "Grey", "silver": "Grey",
  "gold": "Gold",
  "transparent": "Transparent", "clear": "Transparent",
  "natural": "Natural", "beige": "Natural",
  "cyan": "Blue",
  "peach": "Orange",
};

// ============================================================
// Types
// ============================================================

interface ScrapingConfig {
  id: string;
  brand_id: string;
  brand_name: string;
  platform: string;
  base_url: string;
  scrape_method: string;
  adapter_key: string;
  regional_url_pattern: Record<string, string> | null;
  variant_mapping: Record<string, any>;
  spec_extraction: Record<string, string> | null;
  default_material_type: string | null;
}

interface ExtractedFilament {
  brand_id: string;
  material: string;
  product_title: string;
  display_name: string;
  color_family: string | null;
  color_hex: string | null;
  featured_image: string | null;
  variant_image: string | null;
  nozzle_temp_min_c: number | null;
  nozzle_temp_max_c: number | null;
  bed_temp_min_c: number | null;
  bed_temp_max_c: number | null;
  diameter_nominal_mm: number;
  net_weight_g: number | null;
  product_url: string;
  product_url_us: string | null;
  product_url_eu: string | null;
  product_url_uk: string | null;
  product_url_ca: string | null;
  product_url_au: string | null;
  price_usd: number | null;
  price_eur: number | null;
  price_gbp: number | null;
  price_cad: number | null;
  price_aud: number | null;
  product_handle: string;
  variant_sku: string | null;
  finish_type: string | null;
  spool_material: string | null;
  pack_quantity: number;
  print_speed_max_mms: number | null;
  high_speed_capable: boolean | null;
  drying_temp_c: number | null;
  drying_time_hours: number | null;
  variant_available: boolean;
  available_regions: string[];
}

// ============================================================
// Helpers
// ============================================================

const CHROME_UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36";

function extractHandle(url: string): string | null {
  try {
    const match = new URL(url).pathname.match(/\/products\/([^/?#]+)/);
    return match ? match[1] : null;
  } catch {
    return null;
  }
}

function toShopifyJsonUrl(productUrl: string): string {
  const url = new URL(productUrl);
  const match = url.pathname.match(/\/products\/([^/?#]+)/);
  if (match) {
    url.pathname = url.pathname.replace(
      `/products/${match[1]}`,
      `/products/${match[1]}.json`
    );
  }
  return url.toString();
}

function guessColorHex(colorName: string): string | null {
  const lower = colorName.toLowerCase().trim();
  if (COLOR_HEX_MAP[lower]) return COLOR_HEX_MAP[lower];
  // Try partial match — check if any key is contained in the name
  for (const [key, hex] of Object.entries(COLOR_HEX_MAP)) {
    if (lower.includes(key)) return hex;
  }
  return null;
}

function guessColorFamily(colorName: string): string | null {
  const lower = colorName.toLowerCase().trim();
  // Check each keyword
  for (const [keyword, family] of Object.entries(COLOR_FAMILY_MAP)) {
    if (lower.includes(keyword)) return family;
  }
  return null;
}

function guessFinishType(material: string, title: string): string | null {
  const combined = `${material} ${title}`.toLowerCase();
  if (combined.includes("silk")) return "Silk";
  if (combined.includes("matte")) return "Matte";
  if (combined.includes("marble")) return "Marble";
  if (combined.includes("galaxy")) return "Galaxy";
  if (combined.includes("sparkle") || combined.includes("glitter")) return "Sparkle";
  if (combined.includes("glow") || combined.includes("luminous")) return "Glow-in-the-Dark";
  if (combined.includes("transparent") || combined.includes("translucent")) return "Transparent";
  if (combined.includes("neon")) return "Neon";
  if (combined.includes("wood")) return "Wood Fill";
  if (combined.includes("carbon")) return "Carbon Fiber";
  return "Standard";
}

function parseSpecsFromHtml(
  bodyHtml: string,
  specConfig: Record<string, string> | null
): {
  diameter: number | null;
  nozzleTempMin: number | null;
  nozzleTempMax: number | null;
  bedTempMin: number | null;
  bedTempMax: number | null;
  netWeight: number | null;
  printSpeedMax: number | null;
  dryingTemp: number | null;
  dryingTime: number | null;
} {
  const result = {
    diameter: null as number | null,
    nozzleTempMin: null as number | null,
    nozzleTempMax: null as number | null,
    bedTempMin: null as number | null,
    bedTempMax: null as number | null,
    netWeight: null as number | null,
    printSpeedMax: null as number | null,
    dryingTemp: null as number | null,
    dryingTime: null as number | null,
  };

  if (!bodyHtml) return result;

  // Strip HTML tags for cleaner regex matching
  const text = bodyHtml.replace(/<[^>]+>/g, " ").replace(/&nbsp;/g, " ");

  const tryRegex = (pattern: string): RegExpMatchArray | null => {
    try {
      return text.match(new RegExp(pattern, "i"));
    } catch {
      return null;
    }
  };

  // Diameter
  const diamRe = specConfig?.diameter_regex || "(?:Diameter|Filament\\s+Diameter)[:\\s]*([\\d.]+)\\s*(?:mm)?";
  const diamMatch = tryRegex(diamRe);
  if (diamMatch?.[1]) result.diameter = parseFloat(diamMatch[1]);

  // Nozzle temperature range
  const nozzleRe = specConfig?.nozzle_temp_regex || "(?:Printing|Nozzle|Extruder)\\s*(?:Temp(?:erature)?)[:\\s]*([\\d]+)\\s*[°℃]?\\s*[–\\-~to]+\\s*([\\d]+)";
  const nozzleMatch = tryRegex(nozzleRe);
  if (nozzleMatch?.[1] && nozzleMatch?.[2]) {
    result.nozzleTempMin = parseInt(nozzleMatch[1]);
    result.nozzleTempMax = parseInt(nozzleMatch[2]);
  }

  // Bed temperature range
  const bedRe = specConfig?.bed_temp_regex || "(?:Bed|Platform|Heated\\s*Bed)\\s*(?:Temp(?:erature)?)[:\\s]*([\\d]+)\\s*[°℃]?\\s*[–\\-~to]+\\s*([\\d]+)";
  const bedMatch = tryRegex(bedRe);
  if (bedMatch?.[1] && bedMatch?.[2]) {
    result.bedTempMin = parseInt(bedMatch[1]);
    result.bedTempMax = parseInt(bedMatch[2]);
  }

  // Net weight
  const weightRe = specConfig?.weight_regex || "(?:Net\\s+Weight|Weight)[:\\s]*([\\d.]+)\\s*(?:kg|g)";
  const weightMatch = tryRegex(weightRe);
  if (weightMatch?.[1]) {
    const w = parseFloat(weightMatch[1]);
    result.netWeight = w < 50 ? Math.round(w * 1000) : Math.round(w); // convert kg→g if needed
  }

  // Print speed
  const speedRe = specConfig?.speed_regex || "(?:Print(?:ing)?\\s+Speed)[:\\s]*(?:up\\s+to\\s+)?([\\d]+)\\s*(?:mm/s|mm\\/s)";
  const speedMatch = tryRegex(speedRe);
  if (speedMatch?.[1]) result.printSpeedMax = parseInt(speedMatch[1]);

  // Drying temp
  const dryTempRe = specConfig?.drying_temp_regex || "(?:Dry(?:ing)?\\s+Temp(?:erature)?)[:\\s]*([\\d]+)";
  const dryTempMatch = tryRegex(dryTempRe);
  if (dryTempMatch?.[1]) result.dryingTemp = parseInt(dryTempMatch[1]);

  // Drying time
  const dryTimeRe = specConfig?.drying_time_regex || "(?:Dry(?:ing)?\\s+Time)[:\\s]*([\\d]+)\\s*(?:h|hours?)";
  const dryTimeMatch = tryRegex(dryTimeRe);
  if (dryTimeMatch?.[1]) result.dryingTime = parseInt(dryTimeMatch[1]);

  return result;
}

function stripMaterialPrefix(colorName: string, material: string): string {
  // "PLA White" → "White", "PLA Neon Red" → "Neon Red"
  const prefixes = [material, material.toUpperCase(), material.toLowerCase()];
  let cleaned = colorName.trim();
  for (const prefix of prefixes) {
    if (cleaned.startsWith(prefix + " ")) {
      cleaned = cleaned.slice(prefix.length + 1).trim();
      break;
    }
  }
  return cleaned || colorName;
}

// ============================================================
// Smart Option Position Detection for SUNLU
// ============================================================

const REGION_KEYWORDS = ["ship", "shipment", "country", "region", "destination"];
const MATERIAL_KEYWORDS = ["material", "type", "types", "category"];
const COLOR_KEYWORDS = ["color", "colour"];

function detectOptionPositions(
  product: any,
  config: ScrapingConfig
): { regionKey: string | null; materialKey: string | null; colorKey: string | null } {
  const fallback = {
    regionKey: config.variant_mapping?.region_option || "option1",
    materialKey: config.variant_mapping?.material_option || "option2",
    colorKey: config.variant_mapping?.color_option || "option3",
  };

  if (!product?.options?.length) return fallback;

  let regionKey: string | null = null;
  let materialKey: string | null = null;
  let colorKey: string | null = null;

  for (const opt of product.options) {
    const name = (opt.name || "").toLowerCase().trim();
    const key = `option${opt.position}` as string;

    // Compound "Material/Color" → treat as Color
    if (name.includes("material") && name.includes("color")) {
      colorKey = key;
      continue;
    }

    if (!regionKey && REGION_KEYWORDS.some((kw) => name.includes(kw))) {
      regionKey = key;
    } else if (!colorKey && COLOR_KEYWORDS.some((kw) => name.includes(kw))) {
      colorKey = key;
    } else if (!materialKey && MATERIAL_KEYWORDS.some((kw) => name.includes(kw))) {
      materialKey = key;
    }
    // "Package"/"Specifications" are intentionally ignored
  }

  if (!regionKey) console.warn("[detectOptionPositions] Could not detect region option, using fallback");
  if (!materialKey) console.warn("[detectOptionPositions] Could not detect material option, using fallback");
  if (!colorKey) console.warn("[detectOptionPositions] Could not detect color option, using fallback");

  return {
    regionKey: regionKey || fallback.regionKey,
    materialKey: materialKey || fallback.materialKey,
    colorKey: colorKey || fallback.colorKey,
  };
}

// ============================================================
// SUNLU Adapter
// ============================================================

function adaptSunlu(
  rawProduct: any,
  config: ScrapingConfig,
  productHandle: string
): { filaments: ExtractedFilament[]; warnings: string[] } {
  const product = rawProduct.product;
  const warnings: string[] = [];
  const filaments: ExtractedFilament[] = [];

  if (!product?.variants?.length) {
    warnings.push("No variants found in product data");
    return { filaments, warnings };
  }

  const detected = detectOptionPositions(product, config);
  const regionMap: Record<string, string> = config.variant_mapping?.region_map || {};
  const regionOption = detected.regionKey;
  const materialOption = detected.materialKey;
  const colorOption = detected.colorKey;

  // Parse specs from body_html
  const specs = parseSpecsFromHtml(product.body_html || "", config.spec_extraction || null);

  // Build regional URLs from config
  const regionalUrls = config.regional_url_pattern || {};
  const buildRegionalUrl = (region: string): string | null => {
    const base = regionalUrls[region];
    if (!base) return null;
    return `${base.replace(/\/$/, "")}/products/${productHandle}`;
  };

  // Group variants by color (option3)
  const colorGroups: Record<string, any[]> = {};
  for (const variant of product.variants) {
    const colorKey = variant[colorOption] || variant.title;
    if (!colorGroups[colorKey]) colorGroups[colorKey] = [];
    colorGroups[colorKey].push(variant);
  }

  for (const [rawColorName, variants] of Object.entries(colorGroups)) {
    // Determine material from first variant's option2
    const materialRaw = variants[0]?.[materialOption] || config.default_material_type || "PLA";
    const material = materialRaw.toUpperCase();

    // Strip material prefix from color name
    const colorName = stripMaterialPrefix(rawColorName, materialRaw);

    // Extract per-region prices
    let priceUsd: number | null = null;
    let priceEur: number | null = null;
    let priceCad: number | null = null;
    let priceAud: number | null = null;
    let priceGbp: number | null = null;
    const availableRegions: string[] = [];
    let anyAvailable = false;

    for (const v of variants) {
      const regionLabel = v[regionOption] || "";
      const regionCode = regionMap[regionLabel] || null;
      const price = parseFloat(v.price);

      if (regionCode && !isNaN(price)) {
        if (price <= 0 || price > 500) {
          warnings.push(`Price warning for ${colorName} (${regionCode}): $${price}`);
        }
        switch (regionCode) {
          case "US": priceUsd = price; break;
          case "EU": priceEur = price; break;
          case "CA": priceCad = price; break;
          case "AU": priceAud = price; break;
          case "UK": priceGbp = price; break;
        }
        if (v.available) {
          availableRegions.push(regionCode);
          anyAvailable = true;
        }
      }
    }

    // Use the first variant's image and SKU
    const firstVariant = variants[0];
    const featuredImage = firstVariant?.featured_image?.src ||
      product.images?.find((img: any) => img.variant_ids?.includes(firstVariant.id))?.src ||
      product.images?.[0]?.src || null;
    const variantSku = firstVariant?.sku || null;

    const productTitle = `${config.brand_name} ${material} 1KG - ${colorName}`;
    const displayName = `${material} - ${colorName}`;
    const finishType = guessFinishType(material, rawColorName);

    const filament: ExtractedFilament = {
      brand_id: config.brand_id,
      material,
      product_title: productTitle,
      display_name: displayName,
      color_family: guessColorFamily(colorName),
      color_hex: guessColorHex(colorName),
      featured_image: featuredImage,
      variant_image: featuredImage,
      nozzle_temp_min_c: specs.nozzleTempMin,
      nozzle_temp_max_c: specs.nozzleTempMax,
      bed_temp_min_c: specs.bedTempMin,
      bed_temp_max_c: specs.bedTempMax,
      diameter_nominal_mm: specs.diameter || 1.75,
      net_weight_g: specs.netWeight,
      product_url: buildRegionalUrl("US") || `${config.base_url}/products/${productHandle}`,
      product_url_us: buildRegionalUrl("US"),
      product_url_eu: buildRegionalUrl("EU"),
      product_url_uk: buildRegionalUrl("UK"),
      product_url_ca: buildRegionalUrl("CA"),
      product_url_au: buildRegionalUrl("AU"),
      price_usd: priceUsd,
      price_eur: priceEur,
      price_gbp: priceGbp,
      price_cad: priceCad,
      price_aud: priceAud,
      product_handle: productHandle,
      variant_sku: variantSku,
      finish_type: finishType,
      spool_material: null,
      pack_quantity: 1,
      print_speed_max_mms: specs.printSpeedMax,
      high_speed_capable: material.includes("HIGH SPEED") || material.includes("HS") || (specs.printSpeedMax !== null && specs.printSpeedMax >= 300),
      drying_temp_c: specs.dryingTemp,
      drying_time_hours: specs.dryingTime,
      variant_available: anyAvailable,
      available_regions: availableRegions,
    };

    filaments.push(filament);
  }

  return { filaments, warnings };
}

// ============================================================
// Generic Shopify Adapter
// ============================================================

function adaptGenericShopify(
  rawProduct: any,
  config: ScrapingConfig,
  productHandle: string
): { filaments: ExtractedFilament[]; warnings: string[] } {
  const product = rawProduct.product;
  const warnings: string[] = [];
  const filaments: ExtractedFilament[] = [];

  if (!product?.variants?.length) {
    warnings.push("No variants found in product data");
    return { filaments, warnings };
  }

  const specs = parseSpecsFromHtml(product.body_html || "", config.spec_extraction || null);
  const mapping = config.variant_mapping || {};
  const colorOption = mapping.color_option || "option1";
  const regionalUrls = config.regional_url_pattern || {};
  const buildRegionalUrl = (region: string): string | null => {
    const base = regionalUrls[region];
    if (!base) return null;
    return `${base.replace(/\/$/, "")}/products/${productHandle}`;
  };

  // Determine material from product title, tags, or config default
  let material = config.default_material_type || "PLA";
  const titleLower = (product.title || "").toLowerCase();
  const knownMaterials = ["petg", "pla+", "pla plus", "abs", "tpu", "asa", "nylon", "pc", "pva", "hips", "pla"];
  for (const m of knownMaterials) {
    if (titleLower.includes(m)) {
      material = m === "pla+" || m === "pla plus" ? "PLA+" : m.toUpperCase();
      break;
    }
  }

  // Group by color option
  const seenColors = new Set<string>();

  for (const variant of product.variants) {
    const colorName = variant[colorOption] || variant.title || "Default";
    if (seenColors.has(colorName)) continue;
    seenColors.add(colorName);

    const price = parseFloat(variant.price);
    if (!isNaN(price) && (price <= 0 || price > 500)) {
      warnings.push(`Price warning for ${colorName}: $${price}`);
    }

    const featuredImage = variant.featured_image?.src ||
      product.images?.find((img: any) => img.variant_ids?.includes(variant.id))?.src ||
      product.images?.[0]?.src || null;

    const productTitle = `${config.brand_name} ${material} - ${colorName}`;
    const displayName = `${material} - ${colorName}`;
    const finishType = guessFinishType(material, colorName);

    const filament: ExtractedFilament = {
      brand_id: config.brand_id,
      material,
      product_title: productTitle,
      display_name: displayName,
      color_family: guessColorFamily(colorName),
      color_hex: guessColorHex(colorName),
      featured_image: featuredImage,
      variant_image: featuredImage,
      nozzle_temp_min_c: specs.nozzleTempMin,
      nozzle_temp_max_c: specs.nozzleTempMax,
      bed_temp_min_c: specs.bedTempMin,
      bed_temp_max_c: specs.bedTempMax,
      diameter_nominal_mm: specs.diameter || 1.75,
      net_weight_g: specs.netWeight,
      product_url: buildRegionalUrl("US") || `${config.base_url}/products/${productHandle}`,
      product_url_us: buildRegionalUrl("US"),
      product_url_eu: buildRegionalUrl("EU"),
      product_url_uk: buildRegionalUrl("UK"),
      product_url_ca: buildRegionalUrl("CA"),
      product_url_au: buildRegionalUrl("AU"),
      price_usd: !isNaN(price) ? price : null,
      price_eur: null,
      price_gbp: null,
      price_cad: null,
      price_aud: null,
      product_handle: productHandle,
      variant_sku: variant.sku || null,
      finish_type: finishType,
      spool_material: null,
      pack_quantity: 1,
      print_speed_max_mms: specs.printSpeedMax,
      high_speed_capable: material.includes("HIGH SPEED") || material.includes("HS") || (specs.printSpeedMax !== null && specs.printSpeedMax >= 300),
      drying_temp_c: specs.dryingTemp,
      drying_time_hours: specs.dryingTime,
      variant_available: variant.available ?? true,
      available_regions: ["US"],
    };

    filaments.push(filament);
  }

  return { filaments, warnings };
}

// ============================================================
// Duplicate Detection
// ============================================================

async function checkDuplicates(
  supabase: any,
  filaments: ExtractedFilament[]
): Promise<{ filament: ExtractedFilament; isDuplicate: boolean; existingId: string | null }[]> {
  const results: { filament: ExtractedFilament; isDuplicate: boolean; existingId: string | null }[] = [];

  for (const filament of filaments) {
    let existingId: string | null = null;

    // Check by variant_sku first (most precise)
    if (filament.variant_sku) {
      const { data } = await supabase
        .from("filaments")
        .select("id")
        .eq("brand_id", filament.brand_id)
        .eq("variant_sku", filament.variant_sku)
        .maybeSingle();
      if (data) existingId = data.id;
    }

    // Fallback: check by brand_id + material + similar product_title
    if (!existingId) {
      const { data } = await supabase
        .from("filaments")
        .select("id, product_title")
        .eq("brand_id", filament.brand_id)
        .eq("material", filament.material)
        .ilike("product_title", `%${filament.display_name.split(" - ").pop() || ""}%`)
        .limit(1);
      if (data?.length) existingId = data[0].id;
    }

    results.push({
      filament,
      isDuplicate: !!existingId,
      existingId,
    });
  }

  return results;
}

// ============================================================
// Main Handler
// ============================================================

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;

  // ── Auth: admin JWT or service_role key ──
  const authHeader = req.headers.get("Authorization") || "";
  const token = authHeader.replace("Bearer ", "");
  let isAuthorized = false;
  let adminUserId: string | null = null;

  if (token === serviceRoleKey) {
    isAuthorized = true;
  } else if (token) {
    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data } = await userClient.auth.getClaims(token);
    if (data?.claims?.sub) {
      adminUserId = data.claims.sub;
      const { data: roleData } = await userClient
        .from("user_roles")
        .select("role")
        .eq("user_id", data.claims.sub)
        .eq("role", "admin")
        .maybeSingle();
      if (roleData) isAuthorized = true;
    }
  }

  if (!isAuthorized) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  // Service-role client for DB operations (bypasses RLS)
  const supabase = createClient(supabaseUrl, serviceRoleKey);

  // ── Parse request body ──
  let jobId: string;
  let sourceUrl: string;
  let adapterKey: string;

  try {
    const body = await req.json();
    jobId = body.job_id;
    sourceUrl = body.source_url;
    adapterKey = body.adapter_key;
    if (!jobId || !sourceUrl || !adapterKey) {
      throw new Error("Missing required fields: job_id, source_url, adapter_key");
    }
  } catch (e: any) {
    return new Response(JSON.stringify({ error: e.message || "Invalid request body" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  // Helper to fail the job
  const failJob = async (error: string) => {
    console.error(`[extract-filament-data] Job ${jobId} failed: ${error}`);
    await supabase
      .from("filament_onboarding_jobs")
      .update({
        status: "failed",
        extraction_errors: { error },
        completed_at: new Date().toISOString(),
      })
      .eq("id", jobId);
    return new Response(JSON.stringify({ error }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  };

  try {
    // ── Update job status to 'extracting' ──
    await supabase
      .from("filament_onboarding_jobs")
      .update({
        status: "extracting",
        started_at: new Date().toISOString(),
        admin_user_id: adminUserId,
      })
      .eq("id", jobId);

    // ── Load config by adapter_key ──
    const { data: configData, error: configError } = await supabase
      .from("brand_scraping_configs")
      .select("*")
      .eq("adapter_key", adapterKey)
      .eq("is_active", true)
      .maybeSingle();

    if (configError || !configData) {
      return failJob(`No active config found for adapter_key: ${adapterKey}`);
    }

    const config = configData as ScrapingConfig;
    const productHandle = extractHandle(sourceUrl);
    if (!productHandle) {
      return failJob(`Could not extract product handle from URL: ${sourceUrl}`);
    }

    // ── Fetch product data ──
    let rawProduct: any;

    if (config.platform === "shopify" || config.scrape_method === "json_endpoint") {
      // Shopify JSON endpoint
      const jsonUrl = toShopifyJsonUrl(sourceUrl);
      console.log(`[extract-filament-data] Fetching Shopify JSON: ${jsonUrl}`);

      const response = await fetch(jsonUrl, {
        headers: {
          "User-Agent": CHROME_UA,
          Accept: "application/json",
          "Accept-Language": "en-US,en;q=0.9",
        },
      });

      if (!response.ok) {
        return failJob(`HTTP ${response.status} fetching ${jsonUrl}`);
      }

      rawProduct = await response.json();

      if (!rawProduct?.product) {
        return failJob("Invalid Shopify JSON response — no product object");
      }
    } else {
      // Non-Shopify: fetch HTML, try JSON-LD extraction
      console.log(`[extract-filament-data] Fetching HTML: ${sourceUrl}`);
      const response = await fetch(sourceUrl, {
        headers: {
          "User-Agent": CHROME_UA,
          Accept: "text/html",
          "Accept-Language": "en-US,en;q=0.9",
        },
      });

      if (!response.ok) {
        return failJob(`HTTP ${response.status} fetching ${sourceUrl}`);
      }

      const html = await response.text();
      // Wrap HTML in a pseudo-product for adapters
      rawProduct = {
        product: {
          title: config.brand_name + " Product",
          body_html: html,
          handle: productHandle,
          variants: [],
          images: [],
        },
        _html: html,
      };
    }

    // ── Route to adapter ──
    let adapterResult: { filaments: ExtractedFilament[]; warnings: string[] };

    switch (adapterKey) {
      case "sunlu":
        adapterResult = adaptSunlu(rawProduct, config, productHandle);
        break;
      default:
        adapterResult = adaptGenericShopify(rawProduct, config, productHandle);
        break;
    }

    const { filaments, warnings } = adapterResult;

    if (filaments.length === 0) {
      return failJob("No filaments could be extracted from the product data");
    }

    console.log(`[extract-filament-data] Extracted ${filaments.length} filaments, ${warnings.length} warnings`);

    // ── Duplicate detection ──
    const duplicateResults = await checkDuplicates(supabase, filaments);
    const duplicateCount = duplicateResults.filter((r) => r.isDuplicate).length;

    // ── Store results ──
    const extractionErrors = warnings.length > 0 ? { warnings } : null;

    await supabase
      .from("filament_onboarding_jobs")
      .update({
        status: "extracted",
        raw_data: rawProduct,
        extracted_filaments: filaments,
        extraction_errors: extractionErrors,
        duplicate_count: duplicateCount,
        completed_at: new Date().toISOString(),
      })
      .eq("id", jobId);

    // ── Insert onboarding items ──
    const items = duplicateResults.map((r) => ({
      job_id: jobId,
      status: r.isDuplicate ? "duplicate" : "pending",
      extracted_data: r.filament,
      display_name: r.filament.display_name,
      color_name: r.filament.color_family || r.filament.display_name.split(" - ").pop() || null,
      material_type: r.filament.material,
      image_url: r.filament.featured_image,
      price_usd: r.filament.price_usd,
      price_eur: r.filament.price_eur,
      price_cad: r.filament.price_cad,
      price_gbp: r.filament.price_gbp,
      price_aud: r.filament.price_aud,
      variant_sku: r.filament.variant_sku,
      is_duplicate: r.isDuplicate,
      existing_filament_id: r.existingId,
    }));

    const { error: insertError } = await supabase
      .from("filament_onboarding_items")
      .insert(items);

    if (insertError) {
      console.error("[extract-filament-data] Error inserting items:", insertError);
    }

    return new Response(
      JSON.stringify({
        success: true,
        job_id: jobId,
        extracted_count: filaments.length,
        duplicate_count: duplicateCount,
        warnings,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err: any) {
    return failJob(err.message || "Unknown extraction error");
  }
});
