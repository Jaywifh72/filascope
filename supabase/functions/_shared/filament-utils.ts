/**
 * SHARED FILAMENT UTILITIES
 * Common maps, interfaces, and helper functions for filament extraction/sync.
 * Used by: extract-filament-data, sync-brand-catalog
 */

// ============================================================
// Color Hex Map — common filament colors → approximate hex
// ============================================================

export const COLOR_HEX_MAP: Record<string, string> = {
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

export const COLOR_FAMILY_MAP: Record<string, string> = {
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

export interface ScrapingConfig {
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

export interface ExtractedFilament {
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
  spool_outer_d_mm: number | null;
  spool_width_mm: number | null;
  pack_quantity: number;
  print_speed_max_mms: number | null;
  high_speed_capable: boolean | null;
  drying_temp_c: number | null;
  drying_time_hours: number | null;
  variant_available: boolean;
  available_regions: string[];
  weight_source: "body_html" | "variant_title" | "product_title" | null;
}

/**
 * Extract weight in grams from a text string.
 * Supports kg, g, and lb patterns.
 * Returns weight in grams or null.
 */
export function extractWeightFromText(text: string): number | null {
  if (!text) return null;

  const kgMatch = text.match(/(\d+(?:\.\d+)?)\s*kg/i);
  if (kgMatch?.[1]) {
    const w = parseFloat(kgMatch[1]) * 1000;
    if (w > 0 && w <= 50000) return Math.round(w);
  }

  const gMatch = text.match(/(\d+(?:\.\d+)?)\s*g\b/i);
  if (gMatch?.[1]) {
    const w = parseFloat(gMatch[1]);
    if (w > 0 && w <= 50000) return Math.round(w);
  }

  const lbMatch = text.match(/(\d+(?:\.\d+)?)\s*lb/i);
  if (lbMatch?.[1]) {
    const w = parseFloat(lbMatch[1]) * 453.592;
    if (w > 0 && w <= 50000) return Math.round(w);
  }

  return null;
}

// ============================================================
// Option Detection Keywords
// ============================================================

export const REGION_KEYWORDS = ["ship", "shipment", "country", "region", "destination"];
export const MATERIAL_KEYWORDS = ["material", "type", "types", "category"];
export const COLOR_KEYWORDS = ["color", "colour"];

// ============================================================
// Helper Functions
// ============================================================

export function guessColorHex(colorName: string): string | null {
  const lower = colorName.toLowerCase().trim();
  if (COLOR_HEX_MAP[lower]) return COLOR_HEX_MAP[lower];
  for (const [key, hex] of Object.entries(COLOR_HEX_MAP)) {
    if (lower.includes(key)) return hex;
  }
  return null;
}

export function guessColorFamily(colorName: string): string | null {
  const lower = colorName.toLowerCase().trim();
  for (const [keyword, family] of Object.entries(COLOR_FAMILY_MAP)) {
    if (lower.includes(keyword)) return family;
  }
  return null;
}

export function guessFinishType(material: string, title: string): string | null {
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
  if (combined.includes("rainbow")) return "Rainbow";
  return "Standard";
}

export function stripMaterialPrefix(colorName: string, material: string): string {
  const prefixes = [material, material.toUpperCase(), material.toLowerCase()];
  let cleaned = colorName.trim();
  for (const prefix of prefixes) {
    if (cleaned.startsWith(prefix + " ")) {
      cleaned = cleaned.slice(prefix.length + 1).trim();
      break;
    }
  }
  // Also strip weight suffixes from color name
  cleaned = cleaned.replace(/\s*\d+\s*(?:kg|g)\s*$/i, "").trim();
  return cleaned || colorName;
}

export function parseSpecsFromHtml(
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
  spoolOuterDiameterMm: number | null;
  spoolWidthMm: number | null;
  spoolMaterial: string | null;
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
    spoolOuterDiameterMm: null as number | null,
    spoolWidthMm: null as number | null,
    spoolMaterial: null as string | null,
  };

  if (!bodyHtml) return result;

  const text = bodyHtml.replace(/<[^>]+>/g, " ").replace(/&nbsp;/g, " ");

  const tryRegex = (pattern: string): RegExpMatchArray | null => {
    try {
      return text.match(new RegExp(pattern, "i"));
    } catch {
      return null;
    }
  };

  const diamRe = specConfig?.diameter_regex || "(?:Diameter|Filament\\s+Diameter)[:\\s]*([\\d.]+)\\s*(?:mm)?";
  const diamMatch = tryRegex(diamRe);
  if (diamMatch?.[1]) result.diameter = parseFloat(diamMatch[1]);

  const nozzleRe = specConfig?.nozzle_temp_regex || "(?:Printing|Nozzle|Extruder)\\s*(?:Temp(?:erature)?)[:\\s]*([\\d]+)\\s*[°℃]?\\s*[–\\-~to]+\\s*([\\d]+)";
  const nozzleMatch = tryRegex(nozzleRe);
  if (nozzleMatch?.[1] && nozzleMatch?.[2]) {
    result.nozzleTempMin = parseInt(nozzleMatch[1]);
    result.nozzleTempMax = parseInt(nozzleMatch[2]);
  }

  const bedRe = specConfig?.bed_temp_regex || "(?:Bed|Platform|Heated\\s*Bed)\\s*(?:Temp(?:erature)?)[:\\s]*([\\d]+)\\s*[°℃]?\\s*[–\\-~to]+\\s*([\\d]+)";
  const bedMatch = tryRegex(bedRe);
  if (bedMatch?.[1] && bedMatch?.[2]) {
    result.bedTempMin = parseInt(bedMatch[1]);
    result.bedTempMax = parseInt(bedMatch[2]);
  }

  const weightRe = specConfig?.weight_regex || "(?:Net\\s+Weight|Weight)[:\\s]*([\\d.]+)\\s*(?:kg|g)";
  const weightMatch = tryRegex(weightRe);
  if (weightMatch?.[1]) {
    const w = parseFloat(weightMatch[1]);
    result.netWeight = w < 50 ? Math.round(w * 1000) : Math.round(w);
  }

  const speedRe = specConfig?.speed_regex || "(?:Print(?:ing)?\\s+Speed)[:\\s]*(?:up\\s+to\\s+)?([\\d]+)\\s*(?:mm/s|mm\\/s)";
  const speedMatch = tryRegex(speedRe);
  if (speedMatch?.[1]) result.printSpeedMax = parseInt(speedMatch[1]);

  const dryTempRe = specConfig?.drying_temp_regex || "(?:Dry(?:ing)?\\s+Temp(?:erature)?)[:\\s]*([\\d]+)";
  const dryTempMatch = tryRegex(dryTempRe);
  if (dryTempMatch?.[1]) result.dryingTemp = parseInt(dryTempMatch[1]);

  const dryTimeRe = specConfig?.drying_time_regex || "(?:Dry(?:ing)?\\s+Time)[:\\s]*([\\d]+)\\s*(?:h|hours?)";
  const dryTimeMatch = tryRegex(dryTimeRe);
  if (dryTimeMatch?.[1]) result.dryingTime = parseInt(dryTimeMatch[1]);

  // Spool outer diameter: "spool diameter", "spool OD", "outer diameter"
  const spoolDiamRe = specConfig?.spool_diameter_regex || "(?:spool\\s+(?:outer\\s+)?diameter|spool\\s+OD|outer\\s+diameter)[:\\s]*([\\d.]+)\\s*(mm|in(?:ch(?:es)?)?|\")?";
  const spoolDiamMatch = tryRegex(spoolDiamRe);
  if (spoolDiamMatch?.[1]) {
    let val = parseFloat(spoolDiamMatch[1]);
    const unit = (spoolDiamMatch[2] || "mm").toLowerCase();
    if (unit.startsWith("in") || unit === '"') val = val * 25.4;
    if (val >= 100 && val <= 350) result.spoolOuterDiameterMm = Math.round(val * 10) / 10;
  }

  // Spool width: "spool width", "hub width", "spool thickness"
  const spoolWidthRe = specConfig?.spool_width_regex || "(?:spool\\s+width|hub\\s+width|spool\\s+thickness)[:\\s]*([\\d.]+)\\s*(mm|in(?:ch(?:es)?)?|\")?";
  const spoolWidthMatch = tryRegex(spoolWidthRe);
  if (spoolWidthMatch?.[1]) {
    let val = parseFloat(spoolWidthMatch[1]);
    const unit = (spoolWidthMatch[2] || "mm").toLowerCase();
    if (unit.startsWith("in") || unit === '"') val = val * 25.4;
    if (val >= 30 && val <= 120) result.spoolWidthMm = Math.round(val * 10) / 10;
  }

  // Spool material extraction
  const textLower = text.toLowerCase();
  const normalizeSpoolMaterial = (raw: string): string | null => {
    const l = raw.toLowerCase().trim();
    if (/cardboard|paper|recycled\s*cardboard/.test(l)) return "cardboard";
    if (/\babs\b|plastic/.test(l)) return "abs";
    if (/polycarbonate|\bpc\b/.test(l)) return "pc";
    if (/reusable|master\s*spool/.test(l)) return "reusable";
    if (/refill|no\s*spool|eco\s*refill/.test(l)) return "refill";
    return null;
  };

  // Pattern 1: "spool material: X", "spool type: X", "spool: X"
  const spoolMatRe = /(?:spool\s+(?:material|type))\s*[:\s]\s*(\w[\w\s]*)/i;
  const spoolMatMatch = text.match(spoolMatRe);
  if (spoolMatMatch?.[1]) {
    result.spoolMaterial = normalizeSpoolMaterial(spoolMatMatch[1]);
  }

  // Pattern 2: "cardboard spool", "recyclable spool", "eco spool", "ABS spool"
  if (!result.spoolMaterial) {
    const adjectiveSpoolRe = /\b(cardboard|paper|recycled?\s*cardboard|abs|plastic|polycarbonate|reusable|eco|recyclable)\s+spool/i;
    const adjMatch = text.match(adjectiveSpoolRe);
    if (adjMatch?.[1]) {
      const mapped = normalizeSpoolMaterial(adjMatch[1]);
      if (mapped) result.spoolMaterial = mapped;
      else if (/eco|recyclable/i.test(adjMatch[1])) result.spoolMaterial = "cardboard";
    }
  }

  // Pattern 3: "refill" or "refill package" (no spool)
  if (!result.spoolMaterial) {
    if (/\brefill(?:\s+package)?\b/i.test(textLower)) {
      result.spoolMaterial = "refill";
    }
  }

  // Pattern 4: "master spool" standalone
  if (!result.spoolMaterial) {
    if (/\bmaster\s+spool\b/i.test(textLower)) {
      result.spoolMaterial = "reusable";
    }
  }

  return result;
}

export function detectOptionPositions(
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
  }

  return {
    regionKey: regionKey || fallback.regionKey,
    materialKey: materialKey || fallback.materialKey,
    colorKey: colorKey || fallback.colorKey,
  };
}

/**
 * Clean material string: "PLA 1KG" → "PLA", "Matte PLA 1KG" → "Matte PLA"
 */
export function cleanMaterial(raw: string): string {
  return raw
    .replace(/\s*\d+\s*(?:kg|g)\s*$/i, "")
    .replace(/\s*1\.75\s*(?:mm)?\s*$/i, "")
    .trim()
    .toUpperCase();
}

/**
 * Known material keywords for filament detection
 */
export const FILAMENT_KEYWORDS = [
  "filament", "pla", "petg", "abs", "tpu", "asa", "nylon", "pa",
  "silk", "hspla", "pva", "hips", "pc ", "pla+", "pla plus",
  "carbon fiber", "wood fill", "marble", "glow", "matte pla",
];

/**
 * Keywords that indicate a product is NOT filament
 */
export const NON_FILAMENT_KEYWORDS = [
  "dryer", "printer", "resin", "enclosure", "nozzle", "tool",
  "upgrade", "accessories", "board", "protection", "warranty",
  "worry-free", "wash", "cure", "lcd", "screen", "plate",
  "extruder", "hotend", "hot end", "bed leveling", "spool holder",
];
