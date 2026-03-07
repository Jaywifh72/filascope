/**
 * SHARED FILAMENT UTILITIES
 * Common maps, interfaces, and helper functions for filament extraction/sync.
 * Used by: extract-filament-data, sync-brand-catalog
 */

// ============================================================
// Color Hex Map — common filament colors → approximate hex
// ============================================================

export const COLOR_HEX_MAP: Record<string, string> = {
  // --- Standard ---
  white: "#FFFFFF",
  black: "#000000",
  red: "#E53E3E",
  blue: "#3B82F6",
  green: "#22C55E",
  yellow: "#FACC15",
  orange: "#F97316",
  pink: "#EC4899",
  purple: "#8B5CF6",
  grey: "#9CA3AF",
  gray: "#9CA3AF",
  brown: "#92400E",
  beige: "#D2B48C",
  ivory: "#FFFFF0",
  cream: "#FFFDD0",

  // --- Metallic ---
  gold: "#FFD700",
  silver: "#C0C0C0",
  bronze: "#CD7F32",
  copper: "#B87333",
  "rose gold": "#B76E79",

  // --- Blues ---
  "klein blue": "#002FA7",
  "sky blue": "#87CEEB",
  "light blue": "#ADD8E6",
  "baby blue": "#89CFF0",
  "ocean blue": "#0077BE",
  "navy blue": "#001F3F",
  navy: "#001F3F",
  "royal blue": "#4169E1",
  teal: "#008080",
  cyan: "#00BCD4",
  "dark blue": "#00008B",
  cobalt: "#0047AB",
  "powder blue": "#B0E0E6",
  turquoise: "#40E0D0",
  aqua: "#00FFFF",
  midnight: "#191970",
  "midnight blue": "#191970",

  // --- Greens ---
  "grass green": "#7CFC00",
  "mint green": "#98FB98",
  mint: "#98FB98",
  "olive green": "#556B2F",
  olive: "#808000",
  "forest green": "#228B22",
  "dark green": "#006400",
  lime: "#00FF00",
  "lime green": "#32CD32",
  "sage green": "#9DC183",
  sage: "#9DC183",
  "army green": "#4B5320",
  emerald: "#50C878",

  // --- Reds / Pinks ---
  "cherry red": "#DE3163",
  cherry: "#DE3163",
  coral: "#FF7F50",
  salmon: "#FA8072",
  burgundy: "#800020",
  "wine red": "#722F37",
  wine: "#722F37",
  maroon: "#800000",
  crimson: "#DC143C",
  magenta: "#FF00FF",
  fuchsia: "#FF00FF",
  "hot pink": "#FF69B4",
  "sakura pink": "#FFB7C5",
  sakura: "#FFB7C5",
  "rose pink": "#FF66CC",
  rose: "#FF007F",
  "pale pink": "#FADADD",
  peach: "#FFCBA4",

  // --- Yellows / Oranges ---
  "lemon yellow": "#FFF44F",
  lemon: "#FFF44F",
  "vivid yellow": "#FFE900",
  amber: "#FFBF00",
  mustard: "#E1AD01",
  tangerine: "#FF9966",
  apricot: "#FBCEB1",
  "burnt orange": "#CC5500",

  // --- Purples ---
  "lavender purple": "#B57EDC",
  lavender: "#E6E6FA",
  violet: "#7F00FF",
  plum: "#8E4585",
  lilac: "#C8A2C8",
  mauve: "#E0B0FF",
  indigo: "#4B0082",
  amethyst: "#9966CC",

  // --- Browns / Woods ---
  coffee: "#6F4E37",
  chocolate: "#7B3F00",
  mocha: "#967969",
  oak: "#C0A080",
  walnut: "#5C3317",
  wood: "#DEB887",
  "roasted chestnut": "#4A2C2A",
  "roasted chestnut black": "#2C1A1A",
  caramel: "#FFD59A",
  tan: "#D2B48C",

  // --- Whites ---
  "bone white": "#F9F6EE",
  "ceramic white": "#F5F5F0",
  "snow white": "#FFFAFA",
  "pearl white": "#F0EAD6",
  "cloudy white": "#E8E4DE",
  "warm white": "#FAF0E6",
  "cool white": "#F0F8FF",

  // --- Greys ---
  charcoal: "#36454F",
  "slate grey": "#708090",
  "slate gray": "#708090",
  slate: "#708090",
  "stone grey": "#928E85",
  "stone gray": "#928E85",
  "warm grey": "#A89F91",
  "warm gray": "#A89F91",
  "cool grey": "#8C92AC",
  "cool gray": "#8C92AC",
  "dark grey": "#404040",
  "dark gray": "#404040",
  "light grey": "#D3D3D3",
  "light gray": "#D3D3D3",
  ash: "#B2BEB5",

  // --- Nature / Elements ---
  nebula: "#4B0082",
  galaxy: "#2E1A47",
  "galaxy black": "#1A1A2E",
  cosmic: "#2E1A47",
  sunrise: "#FF6B35",
  sunset: "#FF4500",
  ocean: "#006994",
  forest: "#228B22",
  arctic: "#E0F0FF",
  "arctic white": "#F0F8FF",
  lava: "#CF1020",
  storm: "#4F666A",
  thunder: "#4F666A",
  sky: "#87CEEB",
  cloud: "#F0F0F0",
  fog: "#C8C8C8",
  mist: "#D3D3D3",
  dusk: "#4E3B5E",
  dawn: "#FFB347",
  fire: "#FF4500",
  flame: "#E25822",
  earth: "#5B3A29",
  snow: "#FFFAFA",
  ice: "#D6ECEF",

  // --- Gemstone ---
  pearl: "#FDEADB",
  opal: "#A8C3BC",
  jade: "#00A86B",
  ruby: "#E0115F",
  sapphire: "#0F52BA",
  topaz: "#FFC87C",
  obsidian: "#1B1B1B",

  // --- Earthy / Material ---
  bamboo: "#D4C99E",
  bone: "#E3DAC9",
  sand: "#C2B280",
  clay: "#B66A50",
  stone: "#928E85",
  champagne: "#F7E7CE",
  espresso: "#3C1414",
  honey: "#EB9605",
  butterscotch: "#E29C45",
  cinnamon: "#D2691E",
  "olive drab": "#6B8E23",

  // --- Fruit / Food ---
  melon: "#FEBAAD",
  berry: "#8E4585",
  grape: "#6F2DA8",
  aubergine: "#3D0C02",
  eggplant: "#614051",
  pistachio: "#93C572",

  // --- Botanical ---
  seafoam: "#93E9BE",
  eucalyptus: "#44D7A8",
  petrol: "#005F6B",

  // --- Metal ---
  steel: "#71797E",
  gunmetal: "#2C3539",
  titanium: "#878681",
  chrome: "#DBE4EB",
  iron: "#48494B",
  rust: "#B7410E",
  oxide: "#B7410E",
  patina: "#407A52",
  verdigris: "#43B3AE",

  // --- Transparent / Special ---
  transparent: "#FFFFFF",
  clear: "#FFFFFF",
  "natural/clear": "#FFFFFF",
  natural: "#F5F5DC",
  translucent: "#FFFFFF",
  glow: "#C8E6C9",
  "glow in the dark": "#C8E6C9",

  // --- Neons ---
  "neon green": "#39FF14",
  "neon pink": "#FF6EC7",
  "neon orange": "#FF5F1F",
  "neon yellow": "#DFFF00",
  "neon blue": "#1B03A3",
  "neon red": "#FF073A",
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
  tdValue: number | null;
  weightSource: "body_html" | "variant_title" | "product_title" | null;
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
    tdValue: null as number | null,
    weightSource: null as "body_html" | "variant_title" | "product_title" | null,
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
    result.weightSource = "body_html";
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

  // Transmission Distance (TD) extraction
  const tdRe = specConfig?.td_regex || "(?:transmission\\s*distance|(?<!\\w)td|transmittance|light\\s*transmission)\\s*[:=]?\\s*(\\d+(?:\\.\\d+)?)";
  const tdMatch = tryRegex(tdRe);
  if (tdMatch?.[1]) {
    const tdVal = parseFloat(tdMatch[1]);
    if (tdVal > 0 && tdVal <= 20) result.tdValue = tdVal;
  }

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
