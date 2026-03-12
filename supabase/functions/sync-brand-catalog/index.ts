/**
 * SYNC BRAND CATALOG — Edge Function
 *
 * Fetches ALL products from a brand's Shopify store, identifies filaments,
 * extracts complete filament data per color variant, diffs against existing
 * database, and stores categorized results for admin review.
 *
 * POST { brand_id, config_id }
 */

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import {
  ScrapingConfig,
  ExtractedFilament,
  guessColorHex,
  guessColorFamily,
  guessFinishType,
  stripMaterialPrefix,
  parseSpecsFromHtml,
  extractWeightFromText,
  detectOptionPositions,
  FILAMENT_KEYWORDS,
  NON_FILAMENT_KEYWORDS,
} from "../_shared/filament-utils.ts";
// NOTE: sunlu-defaults.ts and sunlu-seed.ts imports removed to reduce bundle size
// for Supabase edge function deployment. Sunlu enrichments (color hex seeds, print
// temp defaults, TDS URL) will be applied during the import phase instead.

// Inline lightweight excluded-product keywords for sitemap pre-filtering
const SUNLU_EXCLUDED_KEYWORDS = [
  "filadryer", "filament-dryer", "dry-box", "drybox", "3d-pen", "resin",
  "build-plate", "magnetic-bed", "nozzle", "hotend", "extruder", "enclosure",
  "storage-box", "vacuum-bag", "connector", "kidoodle", "minibox",
  "sl-300", "sl-600", "fc01", "sp2", "s1-pro", "s2-plus", "s4",
];

// ============================================================
// CORS
// ============================================================

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const CHROME_UA = "Mozilla/5.0 (compatible; FilaScope/1.0)";

// ============================================================
// Helpers: Title Case, Region Mapping, Material & Color Cleaning
// ============================================================

function titleCase(str: string): string {
  return str
    .toLowerCase()
    .replace(/(?:^|\s)\S/g, (c) => c.toUpperCase());
}

/** Map a region option value (e.g. "Ship to USA") to a standard region code */
function mapRegionToCode(
  regionValue: string | null,
  regionMap: Record<string, string>
): string | null {
  if (!regionValue) return null;
  // Try config region_map first (exact substring match)
  for (const [mapKey, code] of Object.entries(regionMap)) {
    if (regionValue.includes(mapKey)) return code;
  }
  // Fallback keyword matching
  const rv = regionValue.toLowerCase();
  if (rv.includes("usa") || rv.includes("united states")) return "US";
  if (rv.includes("europe") || rv.includes("eu")) return "EU";
  if (rv.includes("canada")) return "CA";
  if (rv.includes("australia")) return "AU";
  if (rv.includes("uk") || rv.includes("united kingdom") || rv.includes("britain")) return "UK";
  // Be careful with short codes — only match as whole words
  if (/\bus\b/.test(rv)) return "US";
  return null;
}

// Known material keyword mappings (longest/most-specific first for title parsing)
const MATERIAL_KEYWORDS_ORDERED = [
  "Silk PLA", "Matte PLA", "PLA Meta", "PLA Galaxy", "High Speed PLA",
  "PLA Transparent Series", "PLA Neon Series", "Wood PLA",
  "PLA+", "PLA Plus", "PETG-CF", "PETG CF", "PLA-CF", "PLA CF",
  "ABS-GF", "PA-CF", "PA-GF",
  "PETG", "ABS", "TPU", "ASA", "Nylon", "PA", "PC", "PVA", "HIPS",
  "HSPLA", "HS-PLA", "HS PLA",
  "PLA" // must be last — least specific
];

const MATERIAL_NORMALIZE: Record<string, string> = {
  "pla neon series": "PLA",
  "pla transparent series": "PLA",
  "high speed pla": "HSPLA",
  "hs-pla": "HSPLA",
  "hs pla": "HSPLA",
  "pla plus": "PLA+",
  "pla+": "PLA+",
  "silk pla": "Silk PLA",
  "matte pla": "Matte PLA",
  "pla meta": "PLA Meta",
  "pla galaxy": "PLA Galaxy",
  "wood pla": "Wood PLA",
  "petg-cf": "PETG-CF",
  "petg cf": "PETG-CF",
  "pla-cf": "PLA-CF",
  "pla cf": "PLA-CF",
  "abs-gf": "ABS-GF",
  "pa-cf": "PA-CF",
  "pa-gf": "PA-GF",
};

const KNOWN_COLOR_WORDS = [
  "black", "white", "red", "blue", "green", "yellow", "orange", "purple",
  "pink", "brown", "grey", "gray", "silver", "gold", "cyan", "magenta",
  "transparent", "clear", "natural", "ivory", "beige", "tan", "olive",
  "teal", "navy", "maroon", "coral", "salmon", "lavender", "turquoise",
  "crimson", "charcoal", "mint", "lime", "aqua", "indigo", "violet",
  "rose", "peach", "cream", "chocolate", "bronze", "copper", "platinum",
];

/** Aggressively clean a raw material option value */
function cleanMaterialAggressive(raw: string): string {
  let s = raw;
  // Split on "|" and take first part
  if (s.includes("|")) s = s.split("|")[0];
  // Remove parenthetical content
  s = s.replace(/\(.*?\)/g, "");
  // Remove weight patterns
  s = s.replace(/\d+(\.\d+)?\s*[kK][gG]/g, "");
  s = s.replace(/\d+[gG]\b/g, "");
  // Remove quantity patterns like "1*S4", "2*"
  s = s.replace(/\d+\*[A-Z0-9]+/gi, "");
  // Remove known color words
  for (const cw of KNOWN_COLOR_WORDS) {
    s = s.replace(new RegExp(`\\b${cw}\\b`, "gi"), "");
  }
  // Remove "+" signs that aren't part of material name (but preserve PLA+)
  // Remove extra whitespace and trim
  s = s.replace(/\s+/g, " ").trim();

  // Check against normalize map
  const lower = s.toLowerCase();
  if (MATERIAL_NORMALIZE[lower]) return MATERIAL_NORMALIZE[lower];

  // If we still have something reasonable, capitalize
  if (s.length >= 2 && s.length <= 30) return s.toUpperCase();
  return "";
}

/** Parse material from product title using ordered keywords */
function parseMaterialFromTitle(title: string): string | null {
  const lower = title.toLowerCase();
  for (const kw of MATERIAL_KEYWORDS_ORDERED) {
    if (lower.includes(kw.toLowerCase())) {
      return MATERIAL_NORMALIZE[kw.toLowerCase()] || kw.toUpperCase();
    }
  }
  return null;
}

/** Clean a raw color option value into a human-readable color name */
function cleanColorName(raw: string, material: string): string {
  let s = raw;
  // Strip material prefix
  s = stripMaterialPrefix(s, material);
  // Split on "|" — take the part that looks most like a color
  if (s.includes("|")) {
    const parts = s.split("|").map((p) => p.trim());
    // Pick the part that contains a known color word, or the shortest
    const colorPart = parts.find((p) =>
      KNOWN_COLOR_WORDS.some((cw) => p.toLowerCase().includes(cw))
    );
    s = colorPart || parts.reduce((a, b) => (a.length <= b.length ? a : b));
  }
  // Remove weight patterns
  s = s.replace(/\d+(\.\d+)?\s*[kK][gG]/g, "");
  s = s.replace(/\d+[gG]\b/g, "");
  // Remove region markers
  s = s.replace(/\((AU|EU|US|UK|CA)\s*PLUG\)/gi, "");
  s = s.replace(/\(.*?PLUG.*?\)/gi, "");
  // Remove product codes
  s = s.replace(/\d+\*[A-Z0-9]+/gi, "");
  s = s.replace(/DLZ-\w+/gi, "");
  // Remove parenthetical content
  s = s.replace(/\(.*?\)/g, "");
  // Remove "+" that's not part of a word
  s = s.replace(/\s*\+\s*/g, " ");
  // Clean up
  s = s.replace(/\s+/g, " ").trim();
  // Remove leading/trailing dashes and hyphens
  s = s.replace(/^[-–—]+|[-–—]+$/g, "").trim();

  if (!s || s.length === 0) return "Default";

  // Title case
  return titleCase(s);
}

/** Generate display name from material and color */
function makeDisplayName(material: string, color: string): string {
  if (!color || color === "Default") return material;
  return `${material} - ${color}`;
}

// ============================================================
// Filament Classification
// ============================================================

interface ClassifyResult {
  isFilament: boolean;
  reason: string;
}

function classifyProduct(product: any): ClassifyResult {
  const rawTitle = product.title || "";
  const title = rawTitle.toLowerCase();
  const productType = (product.product_type || "").toLowerCase();
  const tags = (product.tags || []).map((t: string) => t.toLowerCase());
  const optionNames = (product.options || []).map((o: any) =>
    (o.name || "").toLowerCase()
  );

  // ── FIX 1: Enhanced exclusion rules ──

  // Skip regional clearance pages: "[Canada Only] Spring Clearance..."
  if (/^\[.+only\]/i.test(rawTitle)) {
    return { isFilament: false, reason: "regional_clearance" };
  }

  // Skip titles containing "clearance"
  if (title.includes("clearance")) {
    return { isFilament: false, reason: "clearance" };
  }

  // Skip combo/mix & match samplers
  if (title.includes("combo") && (title.includes("mix") || title.includes("sampler"))) {
    return { isFilament: false, reason: "combo_sampler" };
  }

  // Skip bundles with quantity indicators
  if (title.includes("bundle") && (/\d+g\s*\*\s*\d+/i.test(title) || title.includes("pack"))) {
    return { isFilament: false, reason: "bundle" };
  }

  // Skip warranty/service products (options named "Price" or "Note")
  if (optionNames.some((n: string) => n === "price" || n === "note")) {
    return { isFilament: false, reason: "service_product" };
  }

  // ── HARD EXCLUSION: products that are primarily non-filament even if they mention filament ──
  // These are dryers, printers, enclosures, etc. that bundle filament as an add-on
  const HARD_EXCLUSION_KEYWORDS = [
    "dryer", "filadryer", "printer", "enclosure", "resin", "nozzle", "extruder",
    "hotend", "hot end", "build plate", "pei", "bed leveling", "spool holder",
    "filament holder", "filament connector", "splicer", "warranty", "worry-free",
    "wash", "cure", "lcd", "screen", "upgrade", "accessories", "board", "protection",
  ];
  for (const kw of HARD_EXCLUSION_KEYWORDS) {
    if (title.includes(kw)) {
      return { isFilament: false, reason: "non_filament" };
    }
  }

  // Skip "prime deal" / "resin" products even if they mention filament
  if (title.includes("resin") && !title.includes("filament")) {
    return { isFilament: false, reason: "non_filament" };
  }

  // Skip products with no color/material/region-like options AND no filament keywords in title
  const hasRelevantOption = optionNames.some(
    (n: string) =>
      n.includes("color") ||
      n.includes("material") ||
      n.includes("ship") ||
      n.includes("region") ||
      n.includes("type") ||
      n.includes("variant")
  );
  const hasFilamentInTitle = FILAMENT_KEYWORDS.some((fk) => title.includes(fk));
  if (!hasRelevantOption && !hasFilamentInTitle) {
    return { isFilament: false, reason: "no_relevant_options" };
  }

  // Exclude by product_type
  if (["3d printers", "resin", "printer", "accessories"].includes(productType)) {
    if (!hasFilamentInTitle) {
      return { isFilament: false, reason: "non_filament" };
    }
  }

  // Include by title keywords
  if (hasFilamentInTitle) {
    return { isFilament: true, reason: "title_keyword" };
  }

  // Include if has Material/Color option names + heavy variants
  if (optionNames.some((n: string) => n.includes("material") || n.includes("color"))) {
    if (product.variants?.some((v: any) => v.grams > 500)) {
      return { isFilament: true, reason: "option_heuristic" };
    }
  }

  // Check tags
  for (const tag of tags) {
    if (FILAMENT_KEYWORDS.some((kw) => tag.includes(kw))) {
      return { isFilament: true, reason: "tag_keyword" };
    }
  }

  return { isFilament: false, reason: "non_filament" };
}

// ============================================================
// Fetch Full Shopify Catalog with Pagination
// ============================================================

async function fetchShopifyCatalog(
  baseUrl: string,
  maxPages = 10
): Promise<{ products: any[]; totalFetched: number }> {
  const allProducts: any[] = [];
  let page = 1;

  while (page <= maxPages) {
    const pageUrl = `${baseUrl.replace(/\/$/, "")}/products.json?limit=250&page=${page}`;

    let response: Response;
    let retries = 0;
    const maxRetries = 3;

    while (true) {
      response = await fetch(pageUrl, {
        headers: {
          "User-Agent": CHROME_UA,
          Accept: "application/json",
          "Accept-Language": "en-US,en;q=0.9",
        },
      });

      if (response.status === 429 && retries < maxRetries) {
        retries++;
        const delay = 1000 * Math.pow(2, retries);
        console.warn(`[sync-brand-catalog] Rate limited on page ${page}, retrying in ${delay}ms`);
        await new Promise((r) => setTimeout(r, delay));
        continue;
      }
      break;
    }

    if (!response.ok) {
      if (page === 1) {
        throw new Error(`HTTP ${response.status} fetching ${pageUrl}`);
      }
      break;
    }

    const data = await response.json();
    const products = data?.products;
    if (!products || !Array.isArray(products) || products.length === 0) break;

    allProducts.push(...products);
    console.log(`[sync-brand-catalog] Page ${page}: ${products.length} products (total: ${allProducts.length})`);

    if (products.length < 250) break;
    page++;

    // Small delay between pages
    await new Promise((r) => setTimeout(r, 100));
  }

  return { products: allProducts, totalFetched: allProducts.length };
}

// ============================================================
// Fetch Catalog via Sitemap (per-handle strategy)
// For brands like Sunlu where /products.json only returns bundles
// ============================================================

async function fetchCatalogViaSitemap(
  baseUrl: string,
  brandSlug?: string
): Promise<{ products: any[]; totalFetched: number }> {
  const cleanBase = baseUrl.replace(/\/$/, "");
  const sitemapUrl = `${cleanBase}/sitemap_products_1.xml`;

  console.log(`[sync-brand-catalog] Fetching product sitemap: ${sitemapUrl}`);

  const sitemapRes = await fetch(sitemapUrl, {
    headers: { "User-Agent": CHROME_UA, Accept: "text/xml,application/xml" },
  });

  if (!sitemapRes.ok) {
    throw new Error(`Sitemap fetch failed: HTTP ${sitemapRes.status} from ${sitemapUrl}`);
  }

  const xml = await sitemapRes.text();

  // Extract product handles from <loc> tags
  const handles: string[] = [];
  const locRegex = /<loc>(.*?)<\/loc>/g;
  let match;
  while ((match = locRegex.exec(xml)) !== null) {
    const url = match[1];
    if (url.includes("/products/")) {
      const handle = url.split("/products/")[1]?.replace(/\/$/, "").split("?")[0];
      if (handle && !handle.includes("/")) {
        handles.push(handle);
      }
    }
  }

  console.log(`[sync-brand-catalog] Discovered ${handles.length} product handles from sitemap`);

  if (handles.length === 0) {
    throw new Error(`No product handles found in sitemap at ${sitemapUrl}`);
  }

  // Fetch each product individually with rate limiting
  const products: any[] = [];
  let fetchErrors = 0;

  for (let i = 0; i < handles.length; i++) {
    const handle = handles[i];

    // Brand-specific pre-filter: skip known non-filament handles
    if (brandSlug === "sunlu" && SUNLU_EXCLUDED_KEYWORDS.some((kw) => handle.includes(kw))) {
      console.log(`[sync-brand-catalog] Skipped excluded handle: ${handle}`);
      continue;
    }

    try {
      const prodUrl = `${cleanBase}/products/${handle}.json`;
      const prodRes = await fetch(prodUrl, {
        headers: {
          "User-Agent": CHROME_UA,
          Accept: "application/json",
          "Accept-Language": "en-US,en;q=0.9",
        },
      });

      if (prodRes.ok) {
        const data = await prodRes.json();
        if (data?.product) {
          products.push(data.product);
        }
      } else if (prodRes.status === 429) {
        // Rate limited — wait longer and retry once
        console.warn(`[sync-brand-catalog] Rate limited on ${handle}, waiting 3s`);
        await new Promise((r) => setTimeout(r, 3000));
        const retryRes = await fetch(`${cleanBase}/products/${handle}.json`, {
          headers: { "User-Agent": CHROME_UA, Accept: "application/json" },
        });
        if (retryRes.ok) {
          const retryData = await retryRes.json();
          if (retryData?.product) products.push(retryData.product);
        } else {
          fetchErrors++;
        }
      } else {
        fetchErrors++;
        console.warn(`[sync-brand-catalog] HTTP ${prodRes.status} for ${handle}`);
      }
    } catch (err: unknown) {
      fetchErrors++;
      const msg = err instanceof Error ? err.message : "Unknown error";
      console.warn(`[sync-brand-catalog] Failed to fetch ${handle}: ${msg}`);
    }

    // Rate limit: 300ms between requests
    if (i < handles.length - 1) {
      await new Promise((r) => setTimeout(r, 300));
    }

    // Progress log every 10 products
    if ((i + 1) % 10 === 0) {
      console.log(`[sync-brand-catalog] Fetched ${products.length}/${i + 1} products (${fetchErrors} errors)`);
    }
  }

  console.log(
    `[sync-brand-catalog] Sitemap fetch complete: ${products.length} products fetched, ${fetchErrors} errors`
  );

  return { products, totalFetched: products.length };
}

// NOTE: applySunluEnrichments() removed — enrichments (color hex seeds, print temps,
// TDS URL, finish type overrides) are now applied during the import phase to keep
// this function's bundle size under Supabase edge function limits.

// NOTE: fetchUkStorePrices() removed — UK GBP prices will be fetched during
// the import phase to keep this function's bundle size manageable.

// ============================================================
// Extract Filaments from a Single Product
// ============================================================

function extractFilamentsFromProduct(
  product: any,
  config: ScrapingConfig
): { filaments: ExtractedFilament[]; warnings: string[] } {
  const warnings: string[] = [];
  const filaments: ExtractedFilament[] = [];
  const productHandle = product.handle || "unknown";

  if (!product.variants?.length) {
    warnings.push(`Product '${productHandle}': no variants`);
    return { filaments, warnings };
  }

  // Detect option positions
  const detected = detectOptionPositions(product, config);
  warnings.push(
    `Product '${productHandle}': Region=${detected.regionKey}, Material=${detected.materialKey}, Color=${detected.colorKey}`
  );

  const regionMap: Record<string, string> = config.variant_mapping?.region_map || {};
  const regionalUrls = config.regional_url_pattern || {};
  const buildRegionalUrl = (region: string): string | null => {
    const base = regionalUrls[region];
    if (!base) return null;
    return `${base.replace(/\/$/, "")}/products/${productHandle}`;
  };

  // Parse specs from body_html
  const specs = parseSpecsFromHtml(product.body_html || "", config.spec_extraction || null);

  // Fallback weight extraction from variant/product titles
  if (specs.netWeight == null) {
    const firstVariantTitle = product.variants?.[0]?.title || "";
    const variantWeight = extractWeightFromText(firstVariantTitle);
    if (variantWeight != null) {
      specs.netWeight = variantWeight;
      specs.weightSource = "variant_title";
    } else {
      const titleWeight = extractWeightFromText(product.title || "");
      if (titleWeight != null) {
        specs.netWeight = titleWeight;
        specs.weightSource = "product_title";
      }
    }
  }

  // ── FIX 3: Robust material extraction ──
  function getMaterial(variant: any): string {
    if (detected.materialKey) {
      const raw = variant[detected.materialKey!];
      if (raw) {
        const cleaned = cleanMaterialAggressive(raw);
        if (cleaned && cleaned.length >= 2) return cleaned;
      }
    }
    // Fallback: parse from product title
    const fromTitle = parseMaterialFromTitle(product.title || "");
    if (fromTitle) return fromTitle;
    return (config.default_material_type || "PLA").toUpperCase();
  }

  // ── FIX 2: Group variants by COLOR+MATERIAL, NOT by color+region ──
  // Step 1: For each variant, compute the grouping key (material|color)
  const colorMaterialGroups: Record<string, any[]> = {};

  for (const variant of product.variants) {
    const material = getMaterial(variant);

    // Get raw color value from the detected color option
    let rawColor: string;
    if (detected.colorKey) {
      rawColor = variant[detected.colorKey] || variant.title || "Default";
    } else {
      rawColor = variant.title || "Default";
    }

    // Clean the color for grouping (normalize it)
    const cleanedColor = cleanColorName(rawColor, material);

    // Group key is material|cleanedColor — region is NEVER part of the key
    const groupKey = `${material}|${cleanedColor}`;
    if (!colorMaterialGroups[groupKey]) colorMaterialGroups[groupKey] = [];
    colorMaterialGroups[groupKey].push(variant);
  }

  // Step 2: For each group, extract regional prices and build filament
  for (const [groupKey, variants] of Object.entries(colorMaterialGroups)) {
    const [material, colorName] = groupKey.split("|");

    // ── FIX 7: Regional price extraction within each color group ──
    let priceUsd: number | null = null;
    let priceEur: number | null = null;
    let priceCad: number | null = null;
    let priceAud: number | null = null;
    let priceGbp: number | null = null;
    const availableRegions: string[] = [];
    let anyAvailable = false;

    const hasRegionOption = !!detected.regionKey;

    if (hasRegionOption) {
      for (const v of variants) {
        const regionLabel = v[detected.regionKey!] || "";
        const regionCode = mapRegionToCode(regionLabel, regionMap);
        const price = parseFloat(v.price);
        if (regionCode && !isNaN(price) && price > 0) {
          switch (regionCode) {
            case "US": priceUsd = price; break;
            case "EU": priceEur = price; break;
            case "CA": priceCad = price; break;
            case "AU": priceAud = price; break;
            case "UK": priceGbp = price; break;
          }
          if (v.available) {
            if (!availableRegions.includes(regionCode)) availableRegions.push(regionCode);
            anyAvailable = true;
          }
        }
      }
    } else {
      // No region option — single-region product
      const price = parseFloat(variants[0].price);
      if (!isNaN(price) && price > 0) {
        priceUsd = price;
        if (variants[0].available) {
          availableRegions.push("US");
          anyAvailable = true;
        }
      }
    }

    // ── FIX 8: Variant Image Resolution ──
    const variantIds = variants.map((v: any) => v.id);
    // Find color-specific image from variant featured_image or product images by variant_ids
    let variantImage: string | null = null;
    for (const v of variants) {
      if (v.featured_image?.src) {
        variantImage = v.featured_image.src;
        break;
      }
    }
    if (!variantImage && product.images?.length) {
      const matchedImg = product.images.find((img: any) =>
        img.variant_ids?.some((vid: number) => variantIds.includes(vid))
      );
      if (matchedImg) variantImage = matchedImg.src;
    }
    // Hero image = product's first image
    const featuredImage = product.images?.[0]?.src || variantImage || null;
    // If no variant-specific image, fall back to hero
    if (!variantImage) variantImage = featuredImage;

    // SKU — prefer US variant
    const usVariant = hasRegionOption
      ? variants.find((v: any) => {
          const rl = v[detected.regionKey!] || "";
          return mapRegionToCode(rl, regionMap) === "US";
        })
      : null;
    const variantSku = usVariant?.sku || variants[0]?.sku || null;

    // ── FIX 5: Display Name ──
    const displayName = makeDisplayName(material, colorName);
    const productTitle = `${config.brand_name} ${displayName}`;
    const finishType = guessFinishType(material, colorName);

    const filament: ExtractedFilament = {
      brand_id: config.brand_id,
      material,
      product_title: productTitle,
      display_name: displayName,
      color_family: guessColorFamily(colorName),
      color_hex: guessColorHex(colorName),
      featured_image: featuredImage,
      variant_image: variantImage,
      nozzle_temp_min_c: specs.nozzleTempMin,
      nozzle_temp_max_c: specs.nozzleTempMax,
      bed_temp_min_c: specs.bedTempMin,
      bed_temp_max_c: specs.bedTempMax,
      diameter_nominal_mm: specs.diameter || 1.75,
      net_weight_g: specs.netWeight,
      weight_source: specs.weightSource,
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
      spool_material: specs.spoolMaterial,
      spool_outer_d_mm: specs.spoolOuterDiameterMm,
      spool_width_mm: specs.spoolWidthMm,
      print_speed_max_mms: specs.printSpeedMax,
      high_speed_capable:
        material.includes("HSPLA") ||
        material.includes("HS") ||
        material.toLowerCase().includes("high speed") ||
        (specs.printSpeedMax !== null && specs.printSpeedMax >= 300),
      drying_temp_c: specs.dryingTemp,
      drying_time_hours: specs.dryingTime,
      pack_quantity: 1,
      variant_available: anyAvailable,
      available_regions: availableRegions,
    };

    filaments.push(filament);
  }

  return { filaments, warnings };
}

// ============================================================
// Diff Against Existing Database
// ============================================================

interface DiffResult {
  filament: ExtractedFilament;
  status: "new" | "matched" | "price_changed" | "error";
  existingId: string | null;
  priceDiff: { field: string; old: number | null; new: number | null }[] | null;
}

async function diffAgainstDatabase(
  supabase: any,
  filaments: ExtractedFilament[],
  brandId: string
): Promise<DiffResult[]> {
  const results: DiffResult[] = [];

  // Batch-load existing filaments for this brand (up to 1000)
  const { data: existingFilaments } = await supabase
    .from("filaments")
    .select("id, variant_sku, material, display_name, product_title, variant_price, price_eur, price_gbp, price_cad, price_aud")
    .eq("brand_id", brandId)
    .limit(1000);

  const existing = existingFilaments || [];

  for (const filament of filaments) {
    let match: any = null;

    // Primary: SKU match
    if (filament.variant_sku) {
      match = existing.find(
        (e: any) => e.variant_sku && e.variant_sku === filament.variant_sku
      );
    }

    // Secondary: material + color name similarity
    if (!match) {
      const colorPart = (filament.display_name.split(" - ").pop() || "").toLowerCase();
      if (colorPart) {
        match = existing.find(
          (e: any) =>
            e.material?.toLowerCase() === filament.material.toLowerCase() &&
            (e.display_name?.toLowerCase().includes(colorPart) ||
             e.product_title?.toLowerCase().includes(colorPart))
        );
      }
    }

    if (match) {
      // ── FIX 6: Compare prices — ignore null→value transitions ──
      const priceDiffs: { field: string; old: number | null; new: number | null }[] = [];

      const comparisons: [string, number | null, number | null][] = [
        ["price_usd", match.variant_price, filament.price_usd],
        ["price_eur", match.price_eur, filament.price_eur],
        ["price_gbp", match.price_gbp, filament.price_gbp],
        ["price_cad", match.price_cad, filament.price_cad],
        ["price_aud", match.price_aud, filament.price_aud],
      ];

      for (const [field, oldVal, newVal] of comparisons) {
        // Only flag as price_changed if OLD had a real price AND new is different
        // null→value is data enrichment, not a price change
        if (
          newVal !== null &&
          oldVal !== null &&
          oldVal > 0 &&
          Math.abs(oldVal - newVal) > 0.01
        ) {
          priceDiffs.push({ field, old: oldVal, new: newVal });
        }
      }

      results.push({
        filament,
        status: priceDiffs.length > 0 ? "price_changed" : "matched",
        existingId: match.id,
        priceDiff: priceDiffs.length > 0 ? priceDiffs : null,
      });
    } else {
      results.push({
        filament,
        status: "new",
        existingId: null,
        priceDiff: null,
      });
    }
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

  const startTime = Date.now();
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
    try {
      const userClient = createClient(supabaseUrl, anonKey, {
        global: { headers: { Authorization: authHeader } },
      });
      const { data: userData } = await userClient.auth.getUser(token);
      if (userData?.user?.id) {
        adminUserId = userData.user.id;
        const { data: roleData } = await userClient
          .from("user_roles")
          .select("role")
          .eq("user_id", userData.user.id)
          .eq("role", "admin")
          .maybeSingle();
        if (roleData) isAuthorized = true;
      }
    } catch (authErr: unknown) {
      const msg = authErr instanceof Error ? authErr.message : "Unknown auth error";
      console.warn("[sync-brand-catalog] Auth check failed:", msg);
    }
  }

  if (!isAuthorized) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey);

  // ── Parse request body ──
  let brandId: string;
  let configId: string;

  try {
    const body = await req.json();
    brandId = body.brand_id;
    configId = body.config_id;
    if (!brandId || !configId) {
      throw new Error("Missing required fields: brand_id, config_id");
    }
  } catch (e: any) {
    return new Response(JSON.stringify({ error: e.message || "Invalid request body" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  let jobId: string | null = null;

  try {
    // ── Step 1: Load config ──
    const { data: configData, error: configError } = await supabase
      .from("brand_scraping_configs")
      .select("*")
      .eq("id", configId)
      .maybeSingle();

    if (configError || !configData) {
      return new Response(
        JSON.stringify({ error: `Config not found: ${configId}` }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const config = configData as ScrapingConfig;

    const { data: brandData, error: brandError } = await supabase
      .from("automated_brands")
      .select("brand_name, brand_slug")
      .eq("id", brandId)
      .maybeSingle();

    if (brandError || !brandData) {
      return new Response(
        JSON.stringify({ error: `Brand not found: ${brandId}` }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // ── Step 3: Create job ──
    const { data: jobData, error: jobError } = await supabase
      .from("brand_sync_jobs")
      .insert({
        brand_id: brandId,
        config_id: configId,
        status: "syncing",
        admin_user_id: adminUserId,
        started_at: new Date().toISOString(),
      })
      .select("id")
      .single();

    if (jobError || !jobData) {
      throw new Error(`Failed to create sync job: ${jobError?.message}`);
    }
    jobId = jobData.id;

    console.log(`[sync-brand-catalog] Job ${jobId} started for ${brandData.brand_name}`);

    const brandSlug = brandData.brand_slug || "";

    // ── Step 2: Fetch full catalog ──
    // Route to the correct fetch strategy based on config
    const catalogStrategy = (configData as any).catalog_strategy || "products-json";
    let allProducts: any[];

    if (catalogStrategy === "per-handle-sitemap") {
      console.log(`[sync-brand-catalog] Using per-handle-sitemap strategy for ${brandData.brand_name}`);
      const result = await fetchCatalogViaSitemap(config.base_url, brandSlug);
      allProducts = result.products;
    } else {
      const result = await fetchShopifyCatalog(config.base_url);
      allProducts = result.products;
    }

    if (allProducts.length === 0) {
      throw new Error(`No products found from ${config.base_url} (strategy: ${catalogStrategy})`);
    }

    console.log(`[sync-brand-catalog] Fetched ${allProducts.length} products from store`);

    // ── Step 3: Filter filaments ──
    const filamentProducts: any[] = [];
    const skipReasons: Record<string, number> = {};
    const warnings: string[] = [];

    for (const product of allProducts) {
      const classification = classifyProduct(product);
      if (classification.isFilament) {
        filamentProducts.push(product);
      } else {
        skipReasons[classification.reason] = (skipReasons[classification.reason] || 0) + 1;
      }
    }

    console.log(`[sync-brand-catalog] Filament products: ${filamentProducts.length}, skipped: ${allProducts.length - filamentProducts.length}`);

    // ── Step 4+5: Extract filaments from each product ──
    const allFilaments: ExtractedFilament[] = [];
    const extractionErrors: { handle: string; error: string }[] = [];

    for (const product of filamentProducts) {
      try {
        // Time guard: 120s total
        if (Date.now() - startTime > 120_000) {
          warnings.push(`Time limit reached after ${allFilaments.length} filaments extracted`);
          break;
        }

        const result = extractFilamentsFromProduct(product, config);
        allFilaments.push(...result.filaments);
        warnings.push(...result.warnings);
      } catch (err: any) {
        const handle = product.handle || product.title || "unknown";
        extractionErrors.push({ handle, error: err.message });
        console.error(`[sync-brand-catalog] Error extracting '${handle}':`, err.message);
      }
    }

    // NOTE: Brand-specific enrichments (Sunlu color hex, print temps, UK prices)
    // are now applied during the import phase to reduce edge function bundle size.

    console.log(`[sync-brand-catalog] Extracted ${allFilaments.length} filaments, ${extractionErrors.length} errors`);

    // ── Step 6: Diff against existing database ──
    const diffResults = await diffAgainstDatabase(supabase, allFilaments, brandId);

    const newFilaments = diffResults.filter((r) => r.status === "new");
    const priceChanged = diffResults.filter((r) => r.status === "price_changed");
    const matched = diffResults.filter((r) => r.status === "matched");

    // ── Step 7: Store items in brand_sync_items ──
    const itemsToInsert = diffResults.map((r) => ({
      job_id: jobId,
      status: r.status,
      extracted_data: r.filament,
      display_name: r.filament.display_name,
      color_name: r.filament.color_family || r.filament.display_name.split(" - ").pop() || null,
      material_type: r.filament.material,
      color_hex: r.filament.color_hex,
      color_family: r.filament.color_family,
      finish_type: r.filament.finish_type,
      image_url: r.filament.featured_image,
      variant_image_url: r.filament.variant_image,
      price_usd: r.filament.price_usd,
      price_eur: r.filament.price_eur,
      price_gbp: r.filament.price_gbp,
      price_cad: r.filament.price_cad,
      price_aud: r.filament.price_aud,
      variant_sku: r.filament.variant_sku,
      product_handle: r.filament.product_handle,
      available_regions: r.filament.available_regions,
      is_new: r.status === "new",
      existing_filament_id: r.existingId,
      price_diff: r.priceDiff,
      error_message: null,
    }));

    // Also add extraction errors as items
    for (const err of extractionErrors) {
      itemsToInsert.push({
        job_id: jobId!,
        status: "error" as const,
        extracted_data: { handle: err.handle } as any,
        display_name: err.handle,
        color_name: null,
        material_type: null as unknown as string,
        color_hex: null,
        color_family: null,
        finish_type: null,
        image_url: null,
        variant_image_url: null,
        price_usd: null,
        price_eur: null,
        price_gbp: null,
        price_cad: null,
        price_aud: null,
        variant_sku: null,
        product_handle: null as unknown as string,
        available_regions: null as unknown as string[],
        is_new: false,
        existing_filament_id: null,
        price_diff: null,
        error_message: err.error as any,
      });
    }

    // Insert in batches of 100
    for (let i = 0; i < itemsToInsert.length; i += 100) {
      const batch = itemsToInsert.slice(i, i + 100);
      const { error: insertErr } = await supabase.from("brand_sync_items").insert(batch);
      if (insertErr) {
        console.error(`[sync-brand-catalog] Error inserting items batch ${i}:`, insertErr.message);
      }
    }

    // ── Step 8: Update job with summary ──
    const durationMs = Date.now() - startTime;

    await supabase
      .from("brand_sync_jobs")
      .update({
        status: "completed",
        completed_at: new Date().toISOString(),
        total_store_products: allProducts.length,
        filament_products_found: filamentProducts.length,
        skipped_products: allProducts.length - filamentProducts.length,
        skip_reasons: skipReasons,
        new_count: newFilaments.length,
        changed_count: priceChanged.length,
        matched_count: matched.length,
        error_count: extractionErrors.length,
        warnings: warnings.length > 0 ? warnings : null,
        errors: extractionErrors.length > 0 ? extractionErrors : null,
      })
      .eq("id", jobId);

    // ── Step 9: Return response ──
    return new Response(
      JSON.stringify({
        success: true,
        job_id: jobId,
        brand_name: brandData.brand_name,
        catalog_stats: {
          total_store_products: allProducts.length,
          filament_products_found: filamentProducts.length,
          skipped_products: allProducts.length - filamentProducts.length,
          skip_reasons: skipReasons,
        },
        new_count: newFilaments.length,
        changed_count: priceChanged.length,
        matched_count: matched.length,
        error_count: extractionErrors.length,
        warnings,
        duration_ms: durationMs,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err: any) {
    console.error(`[sync-brand-catalog] Fatal error:`, err.message);

    if (jobId) {
      await supabase
        .from("brand_sync_jobs")
        .update({
          status: "failed",
          completed_at: new Date().toISOString(),
          errors: { fatal: err.message },
        })
        .eq("id", jobId);
    }

    return new Response(
      JSON.stringify({ error: err.message || "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
