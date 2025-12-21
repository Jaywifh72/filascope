// Common color names to detect at the end of product titles
export const COLOR_WORDS = [
  // Basic colors
  'Beige', 'Black', 'Blue', 'Brown', 'Burgundy', 'Charcoal', 'Copper', 'Cream', 'Cyan',
  'Gold', 'Gray', 'Grey', 'Green', 'Ivory', 'Lavender', 'Magenta', 'Maroon', 'Navy',
  'Olive', 'Orange', 'Peach', 'Pink', 'Purple', 'Red', 'Rose', 'Salmon', 'Silver',
  'Tan', 'Teal', 'Turquoise', 'Violet', 'White', 'Yellow', 'Kraft', 'Lemonade', 'Terracotta',
  'Bronze', 'Rust', 'Khaki', 'Mustard', 'Amber', 'Aqua', 'Azure', 'Bone', 'Champagne',
  // Bambu Lab multi-word colors
  'Rose Gold', 'Jade White', 'Ash Grey', 'Ice Blue', 'Dark Blue', 'Dark Brown',
  'Dark Green', 'Dark Red', 'Desert Tan', 'Grass Green', 'Latte Brown',
  'Lemon Yellow', 'Lilac Purple', 'Mandarin Orange', 'Marine Blue', 'Ivory White',
  'Sakura Pink', 'Scarlet Red', 'Black Marble', 'Gray Marble', 'Green Marble',
  'White Marble', 'Aurora Purple', 'Dawn Radiance', 'Black Red', 'Silk Red',
  'Silk Rose', 'Silk Gold', 'Silk Silver', 'Silk Blue', 'Silk Green', 'Silk Purple',
  // Fillamentum style colors
  'Cobalt Blue', 'Concrete Grey', 'Luminous Orange', 'Metallic Grey', 'Signal Brown',
  'Sky Blue', 'Traffic Black', 'Traffic Red', 'Traffic White', 'Traffic Yellow',
  'Turquoise Green', 'Anthracite Grey', 'Dijon Mustard', 'Green Grass', 'Grey Blue',
  'Snow White', 'Vertigo Grey', 'Vivid Pink', 'White Aluminium', 'Army Green',
  'Black Soul', 'Caramel Brown Metallic', 'Deep Sea Transparent', 'Flash Yellow Metallic',
  'Flirty Plum', 'Ghost White', 'Grey Mouse Transparent', 'Iced Green Transparent',
  'Jungle Green Metallic', 'Lagoon Transparent', 'Lemonade Translucent', 'Mistake Blue Metallic',
  'Morning Mist', 'Noble Green', 'Passion Fruit Metallic', 'Perl Ruby', 'Portofino Blue',
  'Pure Clear', 'Rapunzel Silver', 'Traffic Blue', 'Urban Grey', 'Wizard Voodoo',
  'Crystal Clear', 'Crystal Clear Blue', 'Crystal Clear Green', 'Crystal Clear Purple',
  // Polymaker style colors  
  'Teal Green', 'Army Dark Green', 'Fossil Grey', 'Luminous White', 'Luminous Green',
  'Luminous Blue', 'Luminous Red', 'Galaxy Dark Blue', 'Galaxy Purple', 'Galaxy Rose',
  // Prusament style colors
  'Galaxy Black', 'Galaxy Silver', 'Jet Black', 'Signal White', 'Opal Green',
  'Prusa Orange', 'Mystic Green', 'Mystic Brown', 'Lipstick Red', 'Azure Blue',
  // Sunlu style colors
  'Army Beige', 'Coffee Brown', 'Grass Green', 'Light Pink', 'Skin', 'Wood',
  // Stylized color names (Hatchbox PETG style)
  'Midnight', 'Peacock', 'Lake', 'Baby', 'Electric Lime', 'Dusk', 'Dawn', 'Sunset', 'Ocean',
  'Sky', 'Coral', 'Mint', 'Sage', 'Moss', 'Sand', 'Clay', 'Slate', 'Storm', 'Fog', 'Mist',
  'Eggplant', 'Caribbean', 'Pastel', 'Apple Sauce', 'Lemon', 'Electric', 'Neon', 'Arctic',
  'Crimson', 'Ruby', 'Sapphire', 'Emerald', 'Cobalt', 'Indigo', 'Plum', 'Wine', 'Berry',
  'Tangerine', 'Pumpkin', 'Caramel', 'Mocha', 'Espresso', 'Chocolate', 'Coffee', 'Butter',
  'Cream', 'Ivory', 'Pearl', 'Snow', 'Ice', 'Frost', 'Steel', 'Smoke', 'Charcoal', 'Onyx',
  'Jet', 'Raven', 'Shadow', 'Graphite', 'Gunmetal', 'Titanium', 'Chrome', 'Platinum',
  // Standalone modifier colors (Hatchbox style)
  'Light', 'Dark', 'Bright', 'Deep', 'Pale', 'Vivid', 'Pure', 'Signal', 'Traffic',
  // Multi-word Hatchbox colors
  'Ash Gray', 'Stone Gray', 'Baby Pink', 'Blush Pink', 'Soft Purple', 'Light Lavender',
  'Cherry Red', 'Lemon Yellow', 'Seafoam Blue', 'Seafoam Green',
  'Baby Blue', 'Gray Blue', 'Lake Blue', 'Peacock Blue', 'Midnight Purple', 'Eggplant Purple',
  'Caribbean Green', 'Mint Green', 'Pastel Green', 'Forest Green',
  'Light Brown', 'Light Orange', 'Light Purple', 'Dark Yellow', 'Dark Green',
  'Transparent Black', 'Transparent Blue', 'Transparent Green', 'Transparent White',
  'Paint Free Brown',
  // Glow variants
  'Glow in the Dark', 'Glow in the Dark Blue', 'Glow in the Dark Green',
  // General multi-word colors
  'Light Blue', 'Dark Blue', 'Sky Blue', 'Royal Blue', 'Light Green', 'Ocean Blue',
  'Light Gray', 'Dark Gray', 'Light Grey', 'Dark Grey', 'Lime Green', 'Neon Blue',
  'Hot Pink', 'Light Pink', 'Neon Green', 'Neon Orange', 'Neon Pink', 'Neon Yellow',
  'Glow Green', 'Glow Blue', 'True Black', 'True White', 'Jet Black', 'Snow White',
  'Natural', 'Clear', 'Transparent', 'Translucent',
];

/**
 * Extract base product name by removing color suffix
 * Groups color variants under a single product name
 */
export const getBaseProductName = (title: string, material?: string | null): string => {
  // Normalize the title first - merge variant names into base product
  let normalizedTitle = title
    .replace(/\bPLA\s+PRO\+/gi, 'PLA+')  // "PLA PRO+" -> "PLA+"
    .replace(/\bPLA\s+PRO\b/gi, 'PLA+'); // "PLA PRO" -> "PLA+"
  
  // Pre-process: Remove product variant suffixes like "(with Spool)", "Refill", "(NFC)", etc.
  // These indicate the same product in different packaging, not different products
  normalizedTitle = normalizedTitle
    .replace(/\s*\(with\s+Spool\)\s*/gi, ' ')  // "(with Spool)"
    .replace(/\s*\(NFC\)\s*/gi, '')            // "(NFC)"
    .replace(/\s+Refill\s*$/gi, '')            // "Refill" at end
    .replace(/\s+w\/\s*Spool\s*/gi, ' ')       // "w/ Spool"
    .replace(/\s+with\s+Spool\s*/gi, ' ')      // "with Spool"
    .trim();
  
  // BAMBU LAB SPECIAL TPU PATTERNS: Handle specific TPU product lines first
  // TPU 95A HF, TPU 85A / TPU 90A, TPU for AMS
  const bambuLabTPUMatch = normalizedTitle.match(
    /^(Bambu Lab TPU\s+(?:95A\s+HF|85A\s*\/\s*TPU\s*90A|for\s+AMS))\s+.+$/i
  );
  if (bambuLabTPUMatch) {
    return bambuLabTPUMatch[1].trim();
  }
  
  // BAMBU LAB PATTERN: "Bambu Lab [Material] [ProductType] [Color]"
  // ProductType examples: Basic, Matte, Silk, Silk Multi-color, Marble, Galaxy, etc.
  // This pattern extracts the base product name without the color suffix
  // Note: e?PLA matches both "PLA" and "ePLA" variants (e.g., ePLA-HS)
  const bambuLabMatch = normalizedTitle.match(
    /^(Bambu Lab (?:e?PLA|PETG|TPU|ABS|ASA|PA6?|PC|PVA|PAHT|PCTG|PPS|PPA)(?:-CF|-GF)?(?:\s+(?:Basic|Matte|Silk|Translucent|Tough|Wood|Marble|Metal|Galaxy|Glow|Sparkle|Aero|Impact|HF|HS|Lite))?(?:\s+(?:Multi-color|Gradient))?)\s+.+$/i
  );
  if (bambuLabMatch) {
    return bambuLabMatch[1].trim();
  }
  
  // Handle Bambu Lab products that are just "Bambu Lab [Material] [Color]" (no product type)
  const bambuLabSimpleMatch = normalizedTitle.match(
    /^(Bambu Lab (?:e?PLA|PETG|TPU|ABS|ASA|PA6?|PC|PVA|PAHT|PCTG|PPS|PPA)(?:-CF|-GF)?)\s+.+$/i
  );
  if (bambuLabSimpleMatch) {
    // Only match if what follows is a color, not a product type
    const remainder = normalizedTitle.slice(bambuLabSimpleMatch[1].length).trim();
    const productTypes = ['Basic', 'Matte', 'Silk', 'Translucent', 'Tough', 'Wood', 'Marble', 'Metal', 'Galaxy', 'Glow', 'Sparkle', 'Aero', 'Impact', 'HF', 'HS', 'Lite', '95A', '85A', 'for'];
    const startsWithProductType = productTypes.some(pt => remainder.toLowerCase().startsWith(pt.toLowerCase()));
    if (!startsWithProductType) {
      return bambuLabSimpleMatch[1].trim();
    }
  }
  
  // Pattern 0: Paramount 3D style - "Material (Color) Diameter Weight Filament"
  const paramountMatch = normalizedTitle.match(/^((?:PLA\+?|PETG|ABS|TPU|TPE|ASA|PA\d*|PC|HIPS|PVA|Nylon)(?:\s+Carbon\s+Fiber)?)\s*\(.+\)\s+[\d.]+mm\s+[\d.]+kg\s+Filament$/i);
  if (paramountMatch) {
    return paramountMatch[1].trim();
  }
  
  // Pattern 0.5: If we have a material field, use it for grouping when title follows "Material (Color) ..." pattern
  if (material && normalizedTitle.match(/^\w+\s*\(.+\)/)) {
    return material;
  }
  
  // Pattern 1: Handle "Brand Material Color Weight" pattern (Prusament style)
  const weightMatch = normalizedTitle.match(/^(.+?\s+(?:PLA\+?|PETG|ABS|TPU|TPE|ASA|PA\d*|PC(?:\s+Blend)?|HIPS|PVA|Nylon|PA11\s+Carbon\s+Fiber))\s+.+?\s+(\d+(?:\.\d+)?(?:kg|g))\s*$/i);
  if (weightMatch) {
    return `${weightMatch[1].trim()} ${weightMatch[2]}`;
  }
  
  // Pattern 2: "Brand Material - Color" (dash separator) - Fillamentum, ColorFabb style
  const dashMatch = normalizedTitle.match(/^(.+?)\s+-\s+.+$/);
  if (dashMatch) {
    return dashMatch[1].trim();
  }
  
  // Pattern 2.5: Handle compound material names like "Metallic PLA", "Silk PLA", "Matte PLA"
  const compoundMaterialMatch = normalizedTitle.match(/^(.+?\s+(?:Metallic|Silk|Matte|Marble|Galaxy|Sparkle|Glitter|Glow|Wood|Carbon|Glass|Rapid|Tough|Flex|Pro|Premium|Basic|Economy|Ultra)\s+(?:PLA|PETG|ABS|TPU|TPE|ASA|PA|PC|HIPS|PVA|Nylon))\s+.+$/i);
  if (compoundMaterialMatch) {
    return compoundMaterialMatch[1].trim();
  }
  
  // Pattern 2.6: Handle "Material Rapid/Pro/Reload/etc" pattern
  const materialVariantMatch = normalizedTitle.match(/^(.+?\s+(?:PLA|PETG|ABS|TPU|TPE|ASA|PA|PC)\s+(?:Rapid|Pro|Plus|Max|Lite|Basic|Premium|HS|HT|CF|GF|Reload))\s+.+$/i);
  if (materialVariantMatch) {
    return materialVariantMatch[1].trim();
  }
  
  // Pattern 2.7: Handle "Brand Extrafill/PolyLite/etc Material" patterns
  const brandLineMatch = normalizedTitle.match(/^(.+?\s+(?:PolyLite|PolyMax|PolyMide|PolyFlex|PolyWood|PolyDissolve|Extrafill|Flexfill|Timberfill|CPE HG100|ASA Extrafill|ABS Extrafill|PLA Extrafill))\s+.+$/i);
  if (brandLineMatch) {
    return brandLineMatch[1].trim();
  }
  
  // Pattern 2.8: Handle "Carbon Fiber Material" pattern (standalone product)
  const carbonFiberMatch = normalizedTitle.match(/^(.+?\s+Carbon\s+Fiber\s+(?:PLA|PETG|ABS|TPU|ASA|PA|Nylon))$/i);
  if (carbonFiberMatch) {
    return carbonFiberMatch[1].trim();
  }
  
  // Pattern 3: Check for color word at the end (case-insensitive)
  // Sort by length descending to match longer colors first ("Light Blue" before "Blue")
  const sortedColors = [...COLOR_WORDS].sort((a, b) => b.length - a.length);
  
  for (const color of sortedColors) {
    const regex = new RegExp(`^(.+?)\\s+${color}$`, 'i');
    const match = normalizedTitle.match(regex);
    if (match) {
      return match[1].trim();
    }
  }
  
  // No color found - return normalized title
  return normalizedTitle;
};

/**
 * Extract color from product title by comparing against base name
 */
export const getColorFromTitle = (title: string, baseName: string): string | null => {
  if (title === baseName) return null;
  
  // Clean title of packaging suffixes before extracting color
  const cleanTitle = title
    .replace(/\s*\(NFC\)\s*/gi, '')
    .replace(/\s+Refill\s*$/gi, '')
    .trim();
  
  if (cleanTitle === baseName) return null;
  
  // Pattern 0: Paramount 3D style - extract color from parentheses
  const parenMatch = cleanTitle.match(/\(([^)]+)\)/);
  if (parenMatch) {
    return parenMatch[1].trim();
  }
  
  // Pattern 1: Dash separator
  const dashMatch = title.match(/^.+?\s+-\s+(.+)$/);
  if (dashMatch) {
    return dashMatch[1].trim();
  }
  
  // Pattern 2: Color at the end
  const sortedColors = [...COLOR_WORDS].sort((a, b) => b.length - a.length);
  
  for (const color of sortedColors) {
    const regex = new RegExp(`\\s+${color}$`, 'i');
    if (title.match(regex)) {
      // Return the actual color from the title (preserving case)
      const extractedColor = title.slice(baseName.length).trim();
      return extractedColor || color;
    }
  }
  
  return null;
};

export interface GroupedFilament {
  baseName: string;
  vendor: string | null;
  material: string | null;
  representativeFilament: FilamentBase;
  variants: FilamentBase[];
  colors: Set<string>;
  weights: Set<number>;
  priceRange: { min: number | null; max: number | null };
}

interface FilamentBase {
  id: string;
  product_title: string;
  vendor?: string | null;
  material?: string | null;
  color_hex?: string | null;
  variant_price?: number | null;
  net_weight_g?: number | null;
  pack_quantity?: number | null;
  value_score?: number | null;
  ease_of_printing_score?: number | null;
  strength_index?: number | null;
  printability_index?: number | null;
  is_nozzle_abrasive?: boolean | null;
  high_speed_capable?: boolean | null;
  carbon_fiber_percentage?: number | null;
  glass_fiber_percentage?: number | null;
  wood_powder_percentage?: number | null;
  featured_image?: string | null;
  variant_available?: boolean | null;
}

/**
 * Group filaments by base product name
 * Combines color/weight variants into single entries
 */
export function groupFilamentsByProduct<T extends FilamentBase>(filaments: T[]): GroupedFilament[] {
  const groups = new Map<string, GroupedFilament>();
  
  filaments.forEach((filament) => {
    const baseName = getBaseProductName(filament.product_title, filament.material);
    // Create group key that includes vendor to avoid cross-brand grouping
    const groupKey = `${filament.vendor || 'Unknown'}::${baseName}`;
    
    if (!groups.has(groupKey)) {
      groups.set(groupKey, {
        baseName,
        vendor: filament.vendor || null,
        material: filament.material || null,
        representativeFilament: filament,
        variants: [],
        colors: new Set<string>(),
        weights: new Set<number>(),
        priceRange: { min: null, max: null },
      });
    }
    
    const group = groups.get(groupKey)!;
    group.variants.push(filament);
    
    // Track colors
    if (filament.color_hex) {
      group.colors.add(filament.color_hex.startsWith('#') ? filament.color_hex : `#${filament.color_hex}`);
    }
    
    // Track weights (in grams)
    if (filament.net_weight_g) {
      group.weights.add(filament.net_weight_g);
    }
    
    // Track price range
    if (filament.variant_price) {
      if (group.priceRange.min === null || filament.variant_price < group.priceRange.min) {
        group.priceRange.min = filament.variant_price;
      }
      if (group.priceRange.max === null || filament.variant_price > group.priceRange.max) {
        group.priceRange.max = filament.variant_price;
      }
    }
    
    // Update representative to have the best image
    if (filament.featured_image && !group.representativeFilament.featured_image) {
      group.representativeFilament = filament;
    }
  });
  
  return Array.from(groups.values());
}
