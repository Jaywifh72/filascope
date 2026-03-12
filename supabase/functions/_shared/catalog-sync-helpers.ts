/**
 * Catalog Sync Helpers — Shared utilities for sync-brand-catalog
 *
 * Extracted from the main edge function to keep it under Supabase's
 * edge function bundle size limits. Contains classification, extraction,
 * and diff logic.
 */

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
} from "./filament-utils.ts";

// Re-export types/constants that the main function needs
export type { ScrapingConfig, ExtractedFilament };
export { FILAMENT_KEYWORDS, NON_FILAMENT_KEYWORDS };

// ============================================================
// Constants
// ============================================================

const MATERIAL_KEYWORDS_ORDERED = [
  "Silk PLA", "Matte PLA", "PLA Meta", "PLA Galaxy", "High Speed PLA",
  "PLA Transparent Series", "PLA Neon Series", "Wood PLA",
  "PLA+", "PLA Plus", "PETG-CF", "PETG CF", "PLA-CF", "PLA CF",
  "ABS-GF", "PA-CF", "PA-GF",
  "PETG", "ABS", "TPU", "ASA", "Nylon", "PA", "PC", "PVA", "HIPS",
  "HSPLA", "HS-PLA", "HS PLA",
  "PLA",
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

// ============================================================
// Helpers
// ============================================================

function titleCase(str: string): string {
  return str
    .toLowerCase()
    .replace(/(?:^|\s)\S/g, (c) => c.toUpperCase());
}

export function mapRegionToCode(
  regionValue: string | null,
  regionMap: Record<string, string>
): string | null {
  if (!regionValue) return null;
  for (const [mapKey, code] of Object.entries(regionMap)) {
    if (regionValue.includes(mapKey)) return code;
  }
  const rv = regionValue.toLowerCase();
  if (rv.includes("usa") || rv.includes("united states")) return "US";
  if (rv.includes("europe") || rv.includes("eu")) return "EU";
  if (rv.includes("canada")) return "CA";
  if (rv.includes("australia")) return "AU";
  if (rv.includes("uk") || rv.includes("united kingdom") || rv.includes("britain")) return "UK";
  if (/\bus\b/.test(rv)) return "US";
  return null;
}

function cleanMaterialAggressive(raw: string): string {
  let s = raw;
  if (s.includes("|")) s = s.split("|")[0];
  s = s.replace(/\(.*?\)/g, "");
  s = s.replace(/\d+(\.\d+)?\s*[kK][gG]/g, "");
  s = s.replace(/\d+[gG]\b/g, "");
  s = s.replace(/\d+\*[A-Z0-9]+/gi, "");
  for (const cw of KNOWN_COLOR_WORDS) {
    s = s.replace(new RegExp(`\\b${cw}\\b`, "gi"), "");
  }
  s = s.replace(/\s+/g, " ").trim();
  const lower = s.toLowerCase();
  if (MATERIAL_NORMALIZE[lower]) return MATERIAL_NORMALIZE[lower];
  if (s.length >= 2 && s.length <= 30) return s.toUpperCase();
  return "";
}

function parseMaterialFromTitle(title: string): string | null {
  const lower = title.toLowerCase();
  for (const kw of MATERIAL_KEYWORDS_ORDERED) {
    if (lower.includes(kw.toLowerCase())) {
      return MATERIAL_NORMALIZE[kw.toLowerCase()] || kw.toUpperCase();
    }
  }
  return null;
}

function cleanColorName(raw: string, material: string): string {
  let s = raw;
  s = stripMaterialPrefix(s, material);
  if (s.includes("|")) {
    const parts = s.split("|").map((p) => p.trim());
    const colorPart = parts.find((p) =>
      KNOWN_COLOR_WORDS.some((cw) => p.toLowerCase().includes(cw))
    );
    s = colorPart || parts.reduce((a, b) => (a.length <= b.length ? a : b));
  }
  s = s.replace(/\d+(\.\d+)?\s*[kK][gG]/g, "");
  s = s.replace(/\d+[gG]\b/g, "");
  s = s.replace(/\((AU|EU|US|UK|CA)\s*PLUG\)/gi, "");
  s = s.replace(/\(.*?PLUG.*?\)/gi, "");
  s = s.replace(/\d+\*[A-Z0-9]+/gi, "");
  s = s.replace(/DLZ-\w+/gi, "");
  s = s.replace(/\(.*?\)/g, "");
  s = s.replace(/\s*\+\s*/g, " ");
  s = s.replace(/\s+/g, " ").trim();
  s = s.replace(/^[-–—]+|[-–—]+$/g, "").trim();
  if (!s || s.length === 0) return "Default";
  return titleCase(s);
}

function makeDisplayName(material: string, color: string): string {
  if (!color || color === "Default") return material;
  return `${material} - ${color}`;
}

// ============================================================
// Filament Classification
// ============================================================

export interface ClassifyResult {
  isFilament: boolean;
  reason: string;
}

export function classifyProduct(product: any): ClassifyResult {
  const rawTitle = product.title || "";
  const title = rawTitle.toLowerCase();
  const productType = (product.product_type || "").toLowerCase();
  const tags = (product.tags || []).map((t: string) => t.toLowerCase());
  const optionNames = (product.options || []).map((o: any) =>
    (o.name || "").toLowerCase()
  );

  if (/^\[.+only\]/i.test(rawTitle)) {
    return { isFilament: false, reason: "regional_clearance" };
  }
  if (title.includes("clearance")) {
    return { isFilament: false, reason: "clearance" };
  }
  if (title.includes("combo") && (title.includes("mix") || title.includes("sampler"))) {
    return { isFilament: false, reason: "combo_sampler" };
  }
  if (title.includes("bundle") && (/\d+g\s*\*\s*\d+/i.test(title) || title.includes("pack"))) {
    return { isFilament: false, reason: "bundle" };
  }
  if (optionNames.some((n: string) => n === "price" || n === "note")) {
    return { isFilament: false, reason: "service_product" };
  }

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

  if (title.includes("resin") && !title.includes("filament")) {
    return { isFilament: false, reason: "non_filament" };
  }

  const hasRelevantOption = optionNames.some(
    (n: string) =>
      n.includes("color") || n.includes("material") || n.includes("ship") ||
      n.includes("region") || n.includes("type") || n.includes("variant")
  );
  const hasFilamentInTitle = FILAMENT_KEYWORDS.some((fk) => title.includes(fk));
  if (!hasRelevantOption && !hasFilamentInTitle) {
    return { isFilament: false, reason: "no_relevant_options" };
  }

  if (["3d printers", "resin", "printer", "accessories"].includes(productType)) {
    if (!hasFilamentInTitle) {
      return { isFilament: false, reason: "non_filament" };
    }
  }

  if (hasFilamentInTitle) {
    return { isFilament: true, reason: "title_keyword" };
  }

  if (optionNames.some((n: string) => n.includes("material") || n.includes("color"))) {
    if (product.variants?.some((v: any) => v.grams > 500)) {
      return { isFilament: true, reason: "option_heuristic" };
    }
  }

  for (const tag of tags) {
    if (FILAMENT_KEYWORDS.some((kw) => tag.includes(kw))) {
      return { isFilament: true, reason: "tag_keyword" };
    }
  }

  return { isFilament: false, reason: "non_filament" };
}

// ============================================================
// Extract Filaments from a Single Product
// ============================================================

export function extractFilamentsFromProduct(
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

  const specs = parseSpecsFromHtml(product.body_html || "", config.spec_extraction || null);

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

  function getMaterial(variant: any): string {
    if (detected.materialKey) {
      const raw = variant[detected.materialKey!];
      if (raw) {
        const cleaned = cleanMaterialAggressive(raw);
        if (cleaned && cleaned.length >= 2) return cleaned;
      }
    }
    const fromTitle = parseMaterialFromTitle(product.title || "");
    if (fromTitle) return fromTitle;
    return (config.default_material_type || "PLA").toUpperCase();
  }

  const colorMaterialGroups: Record<string, any[]> = {};

  for (const variant of product.variants) {
    const material = getMaterial(variant);
    let rawColor: string;
    if (detected.colorKey) {
      rawColor = variant[detected.colorKey] || variant.title || "Default";
    } else {
      rawColor = variant.title || "Default";
    }
    const cleanedColor = cleanColorName(rawColor, material);
    const groupKey = `${material}|${cleanedColor}`;
    if (!colorMaterialGroups[groupKey]) colorMaterialGroups[groupKey] = [];
    colorMaterialGroups[groupKey].push(variant);
  }

  for (const [groupKey, variants] of Object.entries(colorMaterialGroups)) {
    const [material, colorName] = groupKey.split("|");

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
      const price = parseFloat(variants[0].price);
      if (!isNaN(price) && price > 0) {
        priceUsd = price;
        if (variants[0].available) {
          availableRegions.push("US");
          anyAvailable = true;
        }
      }
    }

    const variantIds = variants.map((v: any) => v.id);
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
    const featuredImage = product.images?.[0]?.src || variantImage || null;
    if (!variantImage) variantImage = featuredImage;

    const usVariant = hasRegionOption
      ? variants.find((v: any) => {
          const rl = v[detected.regionKey!] || "";
          return mapRegionToCode(rl, regionMap) === "US";
        })
      : null;
    const variantSku = usVariant?.sku || variants[0]?.sku || null;

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

export interface DiffResult {
  filament: ExtractedFilament;
  status: "new" | "matched" | "price_changed" | "error";
  existingId: string | null;
  priceDiff: { field: string; old: number | null; new: number | null }[] | null;
}

export async function diffAgainstDatabase(
  supabase: any,
  filaments: ExtractedFilament[],
  brandId: string
): Promise<DiffResult[]> {
  const results: DiffResult[] = [];

  const { data: existingFilaments } = await supabase
    .from("filaments")
    .select("id, variant_sku, material, display_name, product_title, variant_price, price_eur, price_gbp, price_cad, price_aud")
    .eq("brand_id", brandId)
    .limit(1000);

  const existing = existingFilaments || [];

  for (const filament of filaments) {
    let match: any = null;

    if (filament.variant_sku) {
      match = existing.find(
        (e: any) => e.variant_sku && e.variant_sku === filament.variant_sku
      );
    }

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
      const priceDiffs: { field: string; old: number | null; new: number | null }[] = [];
      const comparisons: [string, number | null, number | null][] = [
        ["price_usd", match.variant_price, filament.price_usd],
        ["price_eur", match.price_eur, filament.price_eur],
        ["price_gbp", match.price_gbp, filament.price_gbp],
        ["price_cad", match.price_cad, filament.price_cad],
        ["price_aud", match.price_aud, filament.price_aud],
      ];

      for (const [field, oldVal, newVal] of comparisons) {
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
