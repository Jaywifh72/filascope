import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// ============= NON-COLOR PATTERNS (EXCLUSION RULES) =============
const NON_COLOR_PATTERNS = {
  // Weight/Size variants (e.g., "1kg", "500g", "2.2lb")
  weight: /\b(\d+(?:\.\d+)?)\s*(kg|g|lb|lbs|gram|grams|kilogram|kilograms|oz|ounce|ounces)\b/i,
  // Diameter variants (e.g., "1.75mm", "2.85mm")
  diameter: /\b(1\.75|2\.85|3\.0|3\.00|2\.4|1\.0)\s*mm\b/i,
  // Pack/Bundle variants (e.g., "3-pack", "5 rolls", "10x")
  pack: /\b(\d+)\s*[-]?\s*(pack|pcs|pc|pieces|piece|rolls|roll|spools|spool|x\s*\d+|set|bundle)\b/i,
  // Refill/Eco variants
  refill: /\b(refill|cardboard|cardboard\s*spool|master\s*spool|eco\s*spool|lite|masterspool|no\s*spool)\b/i,
  // Spool type variants
  spoolType: /\b(spool\s*only|empty\s*spool|replacement\s*spool)\b/i,
  // Material variants (when product has multiple materials as options)
  material: /^(pla|petg|abs|asa|tpu|pc|nylon|pa|pva|hips|pp|pei|peek|pekk|cf|gf|plus|pro|matte|silk|hyper|hs|high\s*speed)$/i,
  // Temperature/Speed variants
  tempSpeed: /\b(high\s*speed|fast|slow|hs|standard\s*speed|normal\s*speed)\b/i,
  // Quantity descriptors
  quantity: /^\d+$|^x\d+$/i,
  // Dimensional variants
  dimensions: /\b(\d+)\s*x\s*(\d+)/i,
  // Generic non-color terms (when standalone)
  generic: /^(default|default\s*title|standard|regular|classic|original|basic|pro|plus|new|old|v\d+|version\s*\d+|type\s*[a-z]|\d+\s*pcs?)$/i,
};

// ============= COLOR KEYWORDS (INCLUSION RULES) =============
const COLOR_KEYWORDS = [
  // Basic colors
  'black', 'white', 'red', 'blue', 'green', 'yellow', 'orange', 'purple', 'pink', 'brown', 'gray', 'grey',
  // Metallic/Special
  'gold', 'silver', 'copper', 'bronze', 'platinum', 'chrome', 'metallic', 'metal',
  // Finishes that indicate color
  'silk', 'matte', 'satin', 'gloss', 'glossy', 'shimmer', 'sparkle', 'glitter', 'glow', 'rainbow', 'marble', 'galaxy', 'cosmic',
  // Nature-inspired
  'forest', 'ocean', 'sky', 'sunset', 'midnight', 'coral', 'mint', 'lavender', 'sage', 'olive', 'ivory', 'cream',
  // Descriptors that indicate color
  'pastel', 'neon', 'transparent', 'translucent', 'clear', 'opaque', 'bright', 'dark', 'light', 'deep', 'vivid',
  // Specific colors
  'turquoise', 'teal', 'cyan', 'magenta', 'maroon', 'burgundy', 'navy', 'indigo', 'violet', 'crimson', 'scarlet',
  'beige', 'tan', 'khaki', 'nude', 'flesh', 'skin', 'peach', 'salmon', 'coral',
  'emerald', 'jade', 'lime', 'olive', 'chartreuse', 'aqua', 'azure',
  'ruby', 'sapphire', 'amethyst', 'pearl', 'onyx', 'obsidian',
  'champagne', 'rose', 'blush', 'fuchsia', 'flamingo', 'watermelon',
  'lemon', 'mustard', 'honey', 'amber', 'caramel', 'chocolate', 'mocha', 'espresso', 'coffee',
  'charcoal', 'graphite', 'smoke', 'ash', 'slate', 'steel', 'gunmetal', 'pewter',
  'snow', 'ice', 'frost', 'arctic', 'polar', 'bone', 'eggshell', 'alabaster',
  // Wood colors
  'wood', 'bamboo', 'oak', 'walnut', 'maple', 'cherry', 'pine', 'birch', 'mahogany', 'teak',
];

// ============= COMPREHENSIVE COLOR HEX MAP =============
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

// ============= VARIANT CLASSIFICATION SYSTEM =============
interface VariantClassification {
  isColorVariant: boolean;
  colorName: string | null;
  confidence: 'high' | 'medium' | 'low';
  excludeReason?: string;
}

function classifyVariant(variantName: string): VariantClassification {
  const normalized = variantName.toLowerCase().trim();
  const original = variantName.trim();
  
  // Step 1: Check for definite non-color patterns (EXCLUSIONS)
  if (NON_COLOR_PATTERNS.weight.test(normalized)) {
    return { isColorVariant: false, colorName: null, confidence: 'high', excludeReason: 'weight_variant' };
  }
  if (NON_COLOR_PATTERNS.diameter.test(normalized)) {
    return { isColorVariant: false, colorName: null, confidence: 'high', excludeReason: 'diameter_variant' };
  }
  if (NON_COLOR_PATTERNS.pack.test(normalized)) {
    return { isColorVariant: false, colorName: null, confidence: 'high', excludeReason: 'bundle_variant' };
  }
  if (NON_COLOR_PATTERNS.refill.test(normalized)) {
    return { isColorVariant: false, colorName: null, confidence: 'high', excludeReason: 'refill_variant' };
  }
  if (NON_COLOR_PATTERNS.spoolType.test(normalized)) {
    return { isColorVariant: false, colorName: null, confidence: 'high', excludeReason: 'spool_type_variant' };
  }
  if (NON_COLOR_PATTERNS.material.test(normalized)) {
    return { isColorVariant: false, colorName: null, confidence: 'high', excludeReason: 'material_variant' };
  }
  if (NON_COLOR_PATTERNS.tempSpeed.test(normalized)) {
    return { isColorVariant: false, colorName: null, confidence: 'high', excludeReason: 'speed_variant' };
  }
  if (NON_COLOR_PATTERNS.quantity.test(normalized)) {
    return { isColorVariant: false, colorName: null, confidence: 'high', excludeReason: 'quantity_variant' };
  }
  if (NON_COLOR_PATTERNS.dimensions.test(normalized)) {
    return { isColorVariant: false, colorName: null, confidence: 'high', excludeReason: 'dimension_variant' };
  }
  if (NON_COLOR_PATTERNS.generic.test(normalized)) {
    return { isColorVariant: false, colorName: null, confidence: 'high', excludeReason: 'generic_term' };
  }
  
  // Step 2: Check if it's a known color in our hex map (HIGH CONFIDENCE)
  if (COLOR_HEX_MAP[normalized]) {
    return { isColorVariant: true, colorName: original, confidence: 'high' };
  }
  
  // Step 3: Check if it contains known color keywords (MEDIUM CONFIDENCE)
  const hasColorKeyword = COLOR_KEYWORDS.some(kw => normalized.includes(kw));
  if (hasColorKeyword) {
    return { isColorVariant: true, colorName: original, confidence: 'medium' };
  }
  
  // Step 4: Check for partial matches in COLOR_HEX_MAP
  for (const [key] of Object.entries(COLOR_HEX_MAP)) {
    if (normalized.includes(key) || key.includes(normalized)) {
      return { isColorVariant: true, colorName: original, confidence: 'medium' };
    }
  }
  
  // Step 5: Exclude very short or numeric-only variants
  if (/^\d+$/.test(normalized) || normalized.length < 2) {
    return { isColorVariant: false, colorName: null, confidence: 'high', excludeReason: 'numeric_or_too_short' };
  }
  
  // Step 6: Check for common non-color patterns that weren't caught above
  const additionalExclusions = [
    /^\d+\s*(mm|cm|m|inch|inches)$/i,
    /^(small|medium|large|xl|xxl|s|m|l)$/i,
    /^(left|right|top|bottom|front|back)$/i,
    /^(a|b|c|d|e|f)$/i,
    /^(option|variant|type|style)\s*\d*$/i,
  ];
  
  for (const pattern of additionalExclusions) {
    if (pattern.test(normalized)) {
      return { isColorVariant: false, colorName: null, confidence: 'high', excludeReason: 'additional_exclusion' };
    }
  }
  
  // Step 7: If it passes all exclusions and has reasonable text, treat as potential color with LOW confidence
  // This allows for brand-specific or unusual color names
  return { isColorVariant: true, colorName: original, confidence: 'low' };
}

// ============= OPTION TYPE DETECTION =============
const COLOR_OPTION_NAMES = ['color', 'colour', 'farbe', 'couleur', 'colore', 'kleur', 'colors', 'colours'];
const SIZE_OPTION_NAMES = ['size', 'weight', 'quantity', 'pack', 'bundle', 'amount', 'count', 'units', 'kg', 'gram', 'length'];
const TYPE_OPTION_NAMES = ['type', 'style', 'variant', 'option', 'material', 'filament', 'diameter', 'finish', 'texture'];

function identifyOptionType(optionName: string): 'color' | 'size' | 'type' | 'unknown' {
  const normalized = optionName.toLowerCase().trim();
  
  if (COLOR_OPTION_NAMES.some(n => normalized.includes(n))) return 'color';
  if (SIZE_OPTION_NAMES.some(n => normalized.includes(n))) return 'size';
  if (TYPE_OPTION_NAMES.some(n => normalized.includes(n))) return 'type';
  
  return 'unknown';
}

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

interface FilteredVariant {
  name: string;
  reason: string;
}

interface ScrapeResult {
  colors: ColorVariant[];
  filtered: FilteredVariant[];
  productTitle: string;
  optionAnalysis: {
    option1?: { name: string; type: string };
    option2?: { name: string; type: string };
    option3?: { name: string; type: string };
    colorOptionUsed: string | null;
  };
}

async function scrapeShopifyProduct(productUrl: string): Promise<ScrapeResult | null> {
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
    console.log(`[ERROR] Could not extract product handle from URL: ${productUrl}`);
    return null;
  }
  
  // Extract base domain
  const urlObj = new URL(productUrl);
  const baseUrl = `${urlObj.protocol}//${urlObj.hostname}`;
  const jsonUrl = `${baseUrl}/products/${productHandle}.json`;
  
  console.log(`[FETCH] Shopify JSON: ${jsonUrl}`);
  
  const response = await fetch(jsonUrl, {
    headers: {
      "User-Agent": "Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)",
      "Accept": "application/json",
    },
  });
  
  if (!response.ok) {
    console.log(`[ERROR] Shopify JSON fetch failed: HTTP ${response.status}`);
    return null;
  }
  
  const productData = await response.json();
  const product = productData?.product;
  
  if (!product) {
    console.log("[ERROR] No product data in response");
    return null;
  }
  
  const variants = product.variants || [];
  const images = product.images || [];
  const options = product.options || [];
  
  // ============= ANALYZE OPTIONS =============
  const optionAnalysis: ScrapeResult['optionAnalysis'] = {
    colorOptionUsed: null,
  };
  
  let colorOptionIndex = -1;
  
  for (let i = 0; i < options.length && i < 3; i++) {
    const opt = options[i];
    const optType = identifyOptionType(opt.name);
    const key = `option${i + 1}` as 'option1' | 'option2' | 'option3';
    optionAnalysis[key] = { name: opt.name, type: optType };
    
    console.log(`[OPTION] Option${i + 1}: "${opt.name}" -> Type: ${optType}`);
    
    if (optType === 'color' && colorOptionIndex === -1) {
      colorOptionIndex = i;
      optionAnalysis.colorOptionUsed = opt.name;
    }
  }
  
  // ============= EXTRACT AND CLASSIFY VARIANTS =============
  const colorVariants: ColorVariant[] = [];
  const filteredVariants: FilteredVariant[] = [];
  const seenColors = new Set<string>();
  
  if (colorOptionIndex !== -1) {
    // Use dedicated color option
    const colorOptionKey = `option${colorOptionIndex + 1}`;
    console.log(`[STRATEGY] Using dedicated color option: ${optionAnalysis.colorOptionUsed} (${colorOptionKey})`);
    
    for (const variant of variants) {
      const colorName = variant[colorOptionKey];
      if (!colorName) continue;
      
      const normalizedColor = colorName.toLowerCase().trim();
      if (seenColors.has(normalizedColor)) continue;
      
      // Classify the variant
      const classification = classifyVariant(colorName);
      
      if (!classification.isColorVariant) {
        filteredVariants.push({ name: colorName, reason: classification.excludeReason || 'unknown' });
        console.log(`[FILTERED] "${colorName}" -> Reason: ${classification.excludeReason}`);
        continue;
      }
      
      seenColors.add(normalizedColor);
      
      // Find image for this variant
      let imageUrl = findVariantImage(variant, images);
      
      const { hex, family } = extractColorInfo(colorName);
      colorVariants.push({
        name: colorName,
        hex,
        family,
        imageUrl,
        price: variant.price ? parseFloat(variant.price) : null,
      });
      
      console.log(`[COLOR] "${colorName}" -> Confidence: ${classification.confidence}, Hex: ${hex || 'unknown'}`);
    }
  } else {
    // No color option found - analyze all variants
    console.log(`[STRATEGY] No color option found, analyzing all variants`);
    
    // First, try to find the best option to use (one with most color-like values)
    let bestOptionIndex = 0;
    let bestColorScore = 0;
    
    for (let i = 0; i < options.length && i < 3; i++) {
      const opt = options[i];
      let colorScore = 0;
      const uniqueValues = new Set<string>();
      
      for (const variant of variants) {
        const val = variant[`option${i + 1}`];
        if (val && !uniqueValues.has(val.toLowerCase())) {
          uniqueValues.add(val.toLowerCase());
          const classification = classifyVariant(val);
          if (classification.isColorVariant) {
            colorScore += classification.confidence === 'high' ? 3 : classification.confidence === 'medium' ? 2 : 1;
          }
        }
      }
      
      console.log(`[ANALYSIS] Option${i + 1} "${opt.name}" color score: ${colorScore}`);
      
      if (colorScore > bestColorScore) {
        bestColorScore = colorScore;
        bestOptionIndex = i;
      }
    }
    
    const useOptionKey = `option${bestOptionIndex + 1}`;
    console.log(`[STRATEGY] Using option${bestOptionIndex + 1} (best color score: ${bestColorScore})`);
    
    for (const variant of variants) {
      const variantValue = variant[useOptionKey] || variant.title || "Default";
      if (variantValue.toLowerCase() === "default title") continue;
      
      const normalizedValue = variantValue.toLowerCase().trim();
      if (seenColors.has(normalizedValue)) continue;
      
      // Classify the variant
      const classification = classifyVariant(variantValue);
      
      if (!classification.isColorVariant) {
        filteredVariants.push({ name: variantValue, reason: classification.excludeReason || 'unknown' });
        console.log(`[FILTERED] "${variantValue}" -> Reason: ${classification.excludeReason}`);
        continue;
      }
      
      seenColors.add(normalizedValue);
      
      let imageUrl = findVariantImage(variant, images);
      
      const { hex, family } = extractColorInfo(variantValue);
      colorVariants.push({
        name: variantValue,
        hex,
        family,
        imageUrl,
        price: variant.price ? parseFloat(variant.price) : null,
      });
      
      console.log(`[COLOR] "${variantValue}" -> Confidence: ${classification.confidence}, Hex: ${hex || 'unknown'}`);
    }
  }
  
  console.log(`[SUMMARY] Found ${colorVariants.length} colors, filtered ${filteredVariants.length} non-colors`);
  
  return {
    colors: colorVariants,
    filtered: filteredVariants,
    productTitle: product.title || "",
    optionAnalysis,
  };
}

function findVariantImage(variant: Record<string, unknown>, images: Array<{ id: number; src: string }>): string | null {
  if (variant.featured_image && typeof variant.featured_image === 'object') {
    const featuredImage = variant.featured_image as { src?: string };
    if (featuredImage.src) {
      return featuredImage.src.split("?")[0];
    }
  }
  
  if (variant.image_id && images.length > 0) {
    const img = images.find((i) => i.id === variant.image_id);
    if (img?.src) {
      return img.src.split("?")[0];
    }
  }
  
  // Fall back to first image
  if (images.length > 0) {
    return images[0].src?.split("?")[0] || null;
  }
  
  return null;
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

    console.log(`\n========================================`);
    console.log(`[START] Scraping colors for: ${filament.product_title}`);
    console.log(`[URL] ${filament.product_url}`);
    console.log(`========================================\n`);

    // Try Shopify scraping
    const result = await scrapeShopifyProduct(filament.product_url);

    if (!result || result.colors.length === 0) {
      // Update this filament with extracted color from title if possible
      const titleColor = filament.product_title.match(/-\s*([^-]+)$/)?.[1]?.trim();
      if (titleColor) {
        const classification = classifyVariant(titleColor);
        if (classification.isColorVariant) {
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
              colorsCreated: 0,
              colors: [{ name: titleColor, hex, family }],
              filtered: result?.filtered || [],
              optionAnalysis: result?.optionAnalysis || null,
            }), {
              headers: { ...corsHeaders, "Content-Type": "application/json" },
            });
          }
        }
      }
      
      return new Response(JSON.stringify({
        success: false,
        message: "Could not find color variants from product page",
        colorsFound: 0,
        filtered: result?.filtered || [],
        optionAnalysis: result?.optionAnalysis || null,
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log(`\n[RESULT] Found ${result.colors.length} colors: ${result.colors.map(c => c.name).join(", ")}`);
    if (result.filtered.length > 0) {
      console.log(`[RESULT] Filtered ${result.filtered.length} non-colors: ${result.filtered.map(f => `${f.name} (${f.reason})`).join(", ")}`);
    }

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
        console.log(`[DB] Updated ${filament.product_title} with color: ${color.name} (${color.hex})`);
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
            console.log(`[DB] Created: ${colorProductTitle} (${color.hex})`);
          } else {
            console.error(`[DB ERROR] Failed to create ${colorProductTitle}:`, insertError.message);
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
      message: `Found ${result.colors.length} colors (filtered ${result.filtered.length} non-color variants), updated ${colorsUpdated}, created ${colorsCreated}`,
      colorsFound: result.colors.length,
      colorsUpdated,
      colorsCreated,
      colors: result.colors,
      filtered: result.filtered,
      optionAnalysis: result.optionAnalysis,
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error: unknown) {
    console.error("[ERROR]", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
