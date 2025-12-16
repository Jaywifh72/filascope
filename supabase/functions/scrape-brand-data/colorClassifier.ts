/**
 * Intelligent Color Variant Detection System
 * Filters out non-color variants (sizes, weights, refills) and identifies true color values
 */

// ============================================================================
// NON-COLOR PATTERNS - Patterns to EXCLUDE from color detection
// ============================================================================
export const NON_COLOR_PATTERNS = {
  // Weight/Size variants
  weight: /\b(\d+(?:\.\d+)?)\s*(kg|g|lb|lbs|gram|grams|kilogram|kilograms)\b/i,
  // Diameter variants
  diameter: /\b(1\.75|2\.85|3\.0|3\.00)\s*mm\b/i,
  // Pack/Bundle variants
  pack: /\b(\d+)\s*[-]?\s*(pack|pcs|pieces|rolls|spools|x\s*\d+)\b/i,
  // Refill variants
  refill: /\b(refill|cardboard|cardboard\s*spool|master\s*spool|eco\s*spool|lite|no\s*spool)\b/i,
  // Material type variants (when product has multiple materials)
  materialType: /^(pla|petg|abs|asa|tpu|tpe|pc|pa|nylon|peek|pei|hips|pva|pp|wood|metal|carbon|cf|gf)$/i,
  // Generic non-color terms
  generic: /^(default|standard|regular|classic|original|basic|pro|plus|new|old|v1|v2|v3)$/i,
  // Numeric-only variants
  numeric: /^[\d\s.,]+$/,
  // Speed variants
  speed: /\b(high\s*speed|hyper|hs|fast|slow|normal\s*speed)\b/i,
  // Size descriptors
  sizeDescriptor: /^(small|medium|large|xl|xxl|mini|micro|jumbo)$/i,
  // Temperature/Settings
  temperature: /\b(\d{2,3})\s*°?c\b/i,
};

// ============================================================================
// COLOR KEYWORDS - Known color terms to INCLUDE
// ============================================================================
export const COLOR_KEYWORDS = [
  // Basic colors
  'black', 'white', 'red', 'blue', 'green', 'yellow', 'orange', 'purple', 'pink', 'brown', 'gray', 'grey',
  // Metallic
  'gold', 'silver', 'copper', 'bronze', 'platinum', 'chrome', 'metallic', 'steel', 'iron', 'brass', 'titanium',
  // Special finishes
  'silk', 'matte', 'satin', 'gloss', 'shimmer', 'sparkle', 'glitter', 'glow', 'rainbow', 'marble', 'galaxy', 'cosmic',
  // Nature-inspired
  'forest', 'ocean', 'sky', 'sunset', 'midnight', 'coral', 'mint', 'lavender', 'sage', 'olive', 'teal', 'navy',
  'burgundy', 'wine', 'plum', 'berry', 'moss', 'fern', 'jade', 'emerald', 'ruby', 'sapphire', 'amber', 'citrine',
  // More descriptors
  'pastel', 'neon', 'fluorescent', 'transparent', 'translucent', 'clear', 'opaque', 'bright', 'dark', 'light',
  'deep', 'pale', 'vivid', 'soft', 'warm', 'cool', 'hot', 'ice', 'fire', 'flame',
  // Common product colors
  'aqua', 'turquoise', 'cyan', 'magenta', 'violet', 'indigo', 'crimson', 'scarlet', 'maroon', 'peach',
  'apricot', 'tangerine', 'lemon', 'lime', 'chartreuse', 'cream', 'ivory', 'beige', 'tan', 'khaki',
  'chocolate', 'coffee', 'caramel', 'mocha', 'espresso', 'sand', 'stone', 'slate', 'charcoal', 'graphite',
  // Brand-specific color names
  'bambu', 'prusa', 'galaxy', 'nebula', 'aurora', 'arctic', 'tropical', 'electric', 'atomic',
  // Combo indicators
  'duo', 'tri', 'multi', 'gradient', 'ombre', 'blend', 'mix', 'swirl', 'streak',
];

// ============================================================================
// COMPREHENSIVE COLOR HEX MAP - 190+ colors with accurate hex codes
// ============================================================================
export const COLOR_HEX_MAP: Record<string, string> = {
  // Basic Colors
  'black': '#000000',
  'white': '#FFFFFF',
  'red': '#FF0000',
  'blue': '#0000FF',
  'green': '#00FF00',
  'yellow': '#FFFF00',
  'orange': '#FFA500',
  'purple': '#800080',
  'pink': '#FFC0CB',
  'brown': '#8B4513',
  'gray': '#808080',
  'grey': '#808080',
  
  // Whites & Creams
  'ivory': '#FFFFF0',
  'cream': '#FFFDD0',
  'snow': '#FFFAFA',
  'pearl': '#F0EAD6',
  'eggshell': '#F0EAD6',
  'natural': '#F5F5DC',
  'bone': '#E3DAC9',
  
  // Blacks & Grays
  'charcoal': '#36454F',
  'graphite': '#383838',
  'slate': '#708090',
  'ash': '#B2BEB5',
  'smoke': '#738276',
  'jet': '#343434',
  'onyx': '#353935',
  'obsidian': '#3D3D3D',
  
  // Reds
  'crimson': '#DC143C',
  'scarlet': '#FF2400',
  'maroon': '#800000',
  'burgundy': '#800020',
  'wine': '#722F37',
  'ruby': '#E0115F',
  'cherry': '#DE3163',
  'blood red': '#8B0000',
  'fire red': '#CE2029',
  'tomato': '#FF6347',
  'vermillion': '#E34234',
  
  // Oranges
  'tangerine': '#FF9966',
  'peach': '#FFCBA4',
  'apricot': '#FBCEB1',
  'coral': '#FF7F50',
  'salmon': '#FA8072',
  'rust': '#B7410E',
  'burnt orange': '#CC5500',
  'pumpkin': '#FF7518',
  'amber': '#FFBF00',
  'carrot': '#ED9121',
  
  // Yellows
  'gold': '#FFD700',
  'lemon': '#FFF44F',
  'canary': '#FFEF00',
  'mustard': '#FFDB58',
  'honey': '#EB9605',
  'sunshine': '#FFFD37',
  'butter': '#FFFACD',
  'banana': '#FFE135',
  'maize': '#FBEC5D',
  
  // Greens
  'lime': '#32CD32',
  'olive': '#808000',
  'forest': '#228B22',
  'forest green': '#228B22',
  'emerald': '#50C878',
  'jade': '#00A86B',
  'mint': '#98FF98',
  'sage': '#9DC183',
  'teal': '#008080',
  'moss': '#8A9A5B',
  'fern': '#4F7942',
  'pine': '#01796F',
  'army green': '#4B5320',
  'hunter green': '#355E3B',
  'seafoam': '#93E9BE',
  'chartreuse': '#7FFF00',
  'kelly green': '#4CBB17',
  'neon green': '#39FF14',
  
  // Blues
  'navy': '#000080',
  'royal blue': '#4169E1',
  'sky blue': '#87CEEB',
  'baby blue': '#89CFF0',
  'powder blue': '#B0E0E6',
  'ocean': '#006994',
  'azure': '#007FFF',
  'cobalt': '#0047AB',
  'sapphire': '#0F52BA',
  'midnight': '#191970',
  'midnight blue': '#191970',
  'electric blue': '#7DF9FF',
  'cyan': '#00FFFF',
  'aqua': '#00FFFF',
  'turquoise': '#40E0D0',
  'cerulean': '#007BA7',
  'steel blue': '#4682B4',
  'denim': '#1560BD',
  'indigo': '#4B0082',
  'prussian blue': '#003153',
  'petrol': '#005F69',
  
  // Purples
  'violet': '#EE82EE',
  'lavender': '#E6E6FA',
  'lilac': '#C8A2C8',
  'plum': '#DDA0DD',
  'magenta': '#FF00FF',
  'fuchsia': '#FF00FF',
  'orchid': '#DA70D6',
  'mauve': '#E0B0FF',
  'grape': '#6F2DA8',
  'eggplant': '#614051',
  'amethyst': '#9966CC',
  'iris': '#5A4FCF',
  'periwinkle': '#CCCCFF',
  'heather': '#B7A3C4',
  
  // Pinks (pink already defined in Basic Colors)
  'hot pink': '#FF69B4',
  'rose': '#FF007F',
  'blush': '#DE5D83',
  'salmon pink': '#FF91A4',
  'coral pink': '#F88379',
  'dusty rose': '#DCAE96',
  'bubblegum': '#FFC1CC',
  'carnation': '#FFA6C9',
  'flamingo': '#FC8EAC',
  'watermelon': '#FD4659',
  
  // Browns
  'tan': '#D2B48C',
  'beige': '#F5F5DC',
  'khaki': '#C3B091',
  'chocolate': '#7B3F00',
  'coffee': '#6F4E37',
  'mocha': '#967969',
  'espresso': '#4E312D',
  'caramel': '#FFD59A',
  'chestnut': '#954535',
  'mahogany': '#C04000',
  'sienna': '#A0522D',
  'umber': '#635147',
  'cinnamon': '#D2691E',
  'terra cotta': '#E2725B',
  'sand': '#C2B280',
  'taupe': '#483C32',
  'wood': '#BA8C63',
  
  // Metallics
  'silver': '#C0C0C0',
  'metallic gold': '#FFD700',
  'bronze': '#CD7F32',
  'copper': '#B87333',
  'brass': '#B5A642',
  'platinum': '#E5E4E2',
  'chrome': '#DBE4EB',
  'steel': '#71797E',
  'iron': '#48494B',
  'titanium': '#878681',
  'rose gold': '#B76E79',
  'champagne': '#F7E7CE',
  
  // Special Effects
  'clear': '#FFFFFF',
  'transparent': '#FFFFFF',
  'translucent': '#FFFFFF',
  'glow': '#39FF14',
  'glow in dark': '#39FF14',
  'rainbow': '#FF0000',
  'galaxy': '#2E2D88',
  'cosmic': '#1E0F3C',
  'nebula': '#5D3FD3',
  'aurora': '#78D64B',
  'iridescent': '#C4B7A6',
  'holographic': '#8E8E8E',
  'marble': '#EAEAEA',
  'wood effect': '#BA8C63',
  'granite': '#676767',
  'stone': '#928E85',
  'silk red': '#CC0000',
  'silk blue': '#4169E1',
  'silk green': '#228B22',
  'silk gold': '#FFD700',
  'silk silver': '#C0C0C0',
  'silk pink': '#FF69B4',
  'silk purple': '#9370DB',
  'silk orange': '#FF8C00',
  'silk white': '#F8F8FF',
  'silk black': '#1A1A1A',
};

// ============================================================================
// COLOR FAMILY MAP - Maps colors to their family for grouping
// ============================================================================
export const COLOR_FAMILY_MAP: Record<string, string> = {
  // Reds
  'red': 'Red', 'crimson': 'Red', 'scarlet': 'Red', 'maroon': 'Red', 'burgundy': 'Red',
  'wine': 'Red', 'ruby': 'Red', 'cherry': 'Red', 'blood red': 'Red', 'fire red': 'Red',
  'tomato': 'Red', 'vermillion': 'Red',
  
  // Oranges
  'orange': 'Orange', 'tangerine': 'Orange', 'peach': 'Orange', 'apricot': 'Orange',
  'coral': 'Orange', 'salmon': 'Orange', 'rust': 'Orange', 'burnt orange': 'Orange',
  'pumpkin': 'Orange', 'amber': 'Orange', 'carrot': 'Orange',
  
  // Yellows
  'yellow': 'Yellow', 'gold': 'Yellow', 'lemon': 'Yellow', 'canary': 'Yellow',
  'mustard': 'Yellow', 'honey': 'Yellow', 'sunshine': 'Yellow', 'butter': 'Yellow',
  'banana': 'Yellow', 'maize': 'Yellow',
  
  // Greens
  'green': 'Green', 'lime': 'Green', 'olive': 'Green', 'forest': 'Green', 'forest green': 'Green',
  'emerald': 'Green', 'jade': 'Green', 'mint': 'Green', 'sage': 'Green', 'teal': 'Green',
  'moss': 'Green', 'fern': 'Green', 'pine': 'Green', 'army green': 'Green', 'hunter green': 'Green',
  'seafoam': 'Green', 'chartreuse': 'Green', 'kelly green': 'Green', 'neon green': 'Green',
  
  // Blues
  'blue': 'Blue', 'navy': 'Blue', 'royal blue': 'Blue', 'sky blue': 'Blue', 'baby blue': 'Blue',
  'powder blue': 'Blue', 'ocean': 'Blue', 'azure': 'Blue', 'cobalt': 'Blue', 'sapphire': 'Blue',
  'midnight': 'Blue', 'midnight blue': 'Blue', 'electric blue': 'Blue', 'cyan': 'Blue',
  'aqua': 'Blue', 'turquoise': 'Blue', 'cerulean': 'Blue', 'steel blue': 'Blue', 'denim': 'Blue',
  'indigo': 'Blue', 'prussian blue': 'Blue', 'petrol': 'Blue',
  
  // Purples
  'purple': 'Purple', 'violet': 'Purple', 'lavender': 'Purple', 'lilac': 'Purple', 'plum': 'Purple',
  'magenta': 'Purple', 'fuchsia': 'Purple', 'orchid': 'Purple', 'mauve': 'Purple', 'grape': 'Purple',
  'eggplant': 'Purple', 'amethyst': 'Purple', 'iris': 'Purple', 'periwinkle': 'Purple', 'heather': 'Purple',
  
  // Pinks
  'pink': 'Pink', 'hot pink': 'Pink', 'rose': 'Pink', 'blush': 'Pink', 'salmon pink': 'Pink',
  'coral pink': 'Pink', 'dusty rose': 'Pink', 'bubblegum': 'Pink', 'carnation': 'Pink',
  'flamingo': 'Pink', 'watermelon': 'Pink',
  
  // Browns
  'brown': 'Brown', 'tan': 'Brown', 'beige': 'Brown', 'khaki': 'Brown', 'chocolate': 'Brown',
  'coffee': 'Brown', 'mocha': 'Brown', 'espresso': 'Brown', 'caramel': 'Brown', 'chestnut': 'Brown',
  'mahogany': 'Brown', 'sienna': 'Brown', 'umber': 'Brown', 'cinnamon': 'Brown', 'terra cotta': 'Brown',
  'sand': 'Brown', 'taupe': 'Brown', 'wood': 'Brown',
  
  // Grays
  'gray': 'Gray', 'grey': 'Gray', 'charcoal': 'Gray', 'graphite': 'Gray', 'slate': 'Gray',
  'ash': 'Gray', 'smoke': 'Gray', 'silver': 'Gray',
  
  // Blacks
  'black': 'Black', 'jet': 'Black', 'onyx': 'Black', 'obsidian': 'Black',
  
  // Whites
  'white': 'White', 'ivory': 'White', 'cream': 'White', 'snow': 'White', 'pearl': 'White',
  'eggshell': 'White', 'natural': 'White', 'bone': 'White',
  
  // Metallics (silver already in Grays)
  'metallic gold': 'Gold', 'bronze': 'Bronze', 'copper': 'Copper', 'brass': 'Gold',
  'platinum': 'Silver', 'chrome': 'Silver', 'steel': 'Gray', 'iron': 'Gray',
  'titanium': 'Gray', 'rose gold': 'Pink', 'champagne': 'Gold',
  
  // Special
  'clear': 'Clear', 'transparent': 'Clear', 'translucent': 'Clear',
  'glow': 'Glow', 'glow in dark': 'Glow', 'rainbow': 'Rainbow',
  'galaxy': 'Special', 'cosmic': 'Special', 'nebula': 'Special', 'aurora': 'Special',
  'marble': 'Special', 'granite': 'Gray', 'stone': 'Gray',
};

// ============================================================================
// SHOPIFY OPTION TYPE DETECTION
// ============================================================================
export const COLOR_OPTION_NAMES = ['color', 'colour', 'farbe', 'couleur', 'colore', 'kleur', 'cor', 'цвет'];
export const SIZE_OPTION_NAMES = ['size', 'weight', 'quantity', 'pack', 'bundle', 'größe', 'taille', 'formato', 'kg', 'gram'];
export const TYPE_OPTION_NAMES = ['type', 'style', 'variant', 'option', 'material', 'diameter', 'mm'];

export type OptionType = 'color' | 'size' | 'type' | 'unknown';

export function identifyOptionType(optionName: string): OptionType {
  const normalized = optionName.toLowerCase().trim();
  
  if (COLOR_OPTION_NAMES.some(n => normalized.includes(n))) return 'color';
  if (SIZE_OPTION_NAMES.some(n => normalized.includes(n))) return 'size';
  if (TYPE_OPTION_NAMES.some(n => normalized.includes(n))) return 'type';
  
  return 'unknown';
}

// ============================================================================
// VARIANT CLASSIFICATION - The main intelligence
// ============================================================================
export interface VariantClassification {
  isColorVariant: boolean;
  colorName: string | null;
  confidence: 'high' | 'medium' | 'low';
  excludeReason?: string;
}

export function classifyVariant(variantName: string): VariantClassification {
  if (!variantName || typeof variantName !== 'string') {
    return { isColorVariant: false, colorName: null, confidence: 'high', excludeReason: 'empty_value' };
  }
  
  const normalized = variantName.toLowerCase().trim();
  const original = variantName.trim();
  
  // Step 1: Check for definite non-color patterns (HIGH confidence exclusions)
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
  if (NON_COLOR_PATTERNS.materialType.test(normalized)) {
    return { isColorVariant: false, colorName: null, confidence: 'high', excludeReason: 'material_type_variant' };
  }
  if (NON_COLOR_PATTERNS.generic.test(normalized)) {
    return { isColorVariant: false, colorName: null, confidence: 'high', excludeReason: 'generic_variant' };
  }
  if (NON_COLOR_PATTERNS.numeric.test(normalized)) {
    return { isColorVariant: false, colorName: null, confidence: 'high', excludeReason: 'numeric_only' };
  }
  if (NON_COLOR_PATTERNS.speed.test(normalized)) {
    return { isColorVariant: false, colorName: null, confidence: 'high', excludeReason: 'speed_variant' };
  }
  if (NON_COLOR_PATTERNS.sizeDescriptor.test(normalized)) {
    return { isColorVariant: false, colorName: null, confidence: 'high', excludeReason: 'size_descriptor' };
  }
  if (NON_COLOR_PATTERNS.temperature.test(normalized)) {
    return { isColorVariant: false, colorName: null, confidence: 'high', excludeReason: 'temperature_variant' };
  }
  
  // Step 2: Check if it's in our comprehensive color hex map (HIGH confidence inclusion)
  const hexMatch = COLOR_HEX_MAP[normalized];
  if (hexMatch) {
    return { isColorVariant: true, colorName: original, confidence: 'high' };
  }
  
  // Step 3: Check for known color keywords (MEDIUM confidence)
  const hasColorKeyword = COLOR_KEYWORDS.some(kw => normalized.includes(kw));
  if (hasColorKeyword) {
    const extractedColor = extractColorFromVariant(original);
    return { isColorVariant: true, colorName: extractedColor, confidence: 'medium' };
  }
  
  // Step 4: Check for hex color pattern in the value
  const hexPattern = /#[0-9A-Fa-f]{6}/;
  if (hexPattern.test(variantName)) {
    return { isColorVariant: true, colorName: original, confidence: 'medium' };
  }
  
  // Step 5: Exclude very short values or single characters
  if (normalized.length < 3) {
    return { isColorVariant: false, colorName: null, confidence: 'high', excludeReason: 'too_short' };
  }
  
  // Step 6: If it doesn't match any pattern, treat as potential color with LOW confidence
  // (Many brand-specific color names like "Ocean Breeze", "Midnight Sky" won't match keywords)
  return { isColorVariant: true, colorName: original, confidence: 'low' };
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Extract the color name from a variant that may contain extra info
 * e.g., "Silk Blue - 1kg" -> "Silk Blue"
 */
export function extractColorFromVariant(variantName: string): string {
  // Remove common suffixes
  let cleaned = variantName
    .replace(/\s*[-–]\s*\d+(?:\.\d+)?\s*(?:kg|g|lb|mm)\b.*/i, '')
    .replace(/\s*\(\d+(?:\.\d+)?\s*(?:kg|g|lb|mm)\).*/i, '')
    .replace(/\s*,\s*\d+(?:\.\d+)?\s*(?:kg|g|lb|mm)\b.*/i, '')
    .trim();
  
  return cleaned || variantName;
}

/**
 * Get color info (hex and family) from a color name
 */
export function extractColorInfo(colorName: string): { name: string; hex: string; family: string } | null {
  if (!colorName) return null;
  
  const normalized = colorName.toLowerCase().trim();
  
  // Direct match in hex map
  if (COLOR_HEX_MAP[normalized]) {
    return {
      name: colorName.charAt(0).toUpperCase() + colorName.slice(1).toLowerCase(),
      hex: COLOR_HEX_MAP[normalized],
      family: COLOR_FAMILY_MAP[normalized] || 'Other',
    };
  }
  
  // Try to find a matching color keyword in the name
  for (const [color, hex] of Object.entries(COLOR_HEX_MAP)) {
    if (normalized.includes(color)) {
      return {
        name: colorName,
        hex,
        family: COLOR_FAMILY_MAP[color] || 'Other',
      };
    }
  }
  
  return null;
}

/**
 * Analyze Shopify variant options and return the best color option index
 */
export function analyzeShopifyOptions(options: { name: string; values?: string[] }[]): {
  colorOptionIndex: number | null;
  analysis: Array<{ name: string; type: OptionType; colorScore: number }>;
} {
  const analysis = options.map((opt, index) => {
    const type = identifyOptionType(opt.name);
    
    // Calculate how many values are colors
    let colorScore = 0;
    if (opt.values) {
      const colorCount = opt.values.filter(v => {
        const classification = classifyVariant(v);
        return classification.isColorVariant && classification.confidence !== 'low';
      }).length;
      colorScore = opt.values.length > 0 ? colorCount / opt.values.length : 0;
    }
    
    return { name: opt.name, type, colorScore, index };
  });
  
  // Find the best color option
  // Priority: explicit color type > highest color score
  let colorOptionIndex: number | null = null;
  
  // First, look for explicit color option
  const explicitColor = analysis.find(a => a.type === 'color');
  if (explicitColor) {
    colorOptionIndex = (explicitColor as any).index;
  } else {
    // Otherwise, use the option with highest color score (>50%)
    const bestByScore = analysis.reduce((best, current) => {
      if (current.colorScore > (best?.colorScore || 0) && current.colorScore >= 0.5) {
        return current;
      }
      return best;
    }, null as typeof analysis[0] | null);
    
    if (bestByScore) {
      colorOptionIndex = (bestByScore as any).index;
    }
  }
  
  return { colorOptionIndex, analysis };
}

/**
 * Filter an array of variant values to only include colors
 */
export function filterColorVariants(variants: string[]): {
  colors: string[];
  filtered: Array<{ value: string; reason: string }>;
} {
  const colors: string[] = [];
  const filtered: Array<{ value: string; reason: string }> = [];
  const seen = new Set<string>();
  
  for (const variant of variants) {
    const classification = classifyVariant(variant);
    
    if (classification.isColorVariant && classification.colorName) {
      // Normalize for deduplication
      const normalizedKey = classification.colorName.toLowerCase().replace(/\s+/g, ' ').trim();
      
      if (!seen.has(normalizedKey)) {
        seen.add(normalizedKey);
        colors.push(classification.colorName);
      }
    } else if (classification.excludeReason) {
      filtered.push({ value: variant, reason: classification.excludeReason });
    }
  }
  
  return { colors, filtered };
}
