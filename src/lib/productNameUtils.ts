/**
 * Clean filament display name by removing size/weight suffixes and color names
 * Converts: "PLA Matte Basic 1.75mm, 1KG/2.2LB" → "PLA Matte Basic"
 * Converts: "PLA Matte Triple Filament/ White Pink" → "PLA Matte Triple Filament"
 */
export function cleanFilamentDisplayName(title: string): string {
  if (!title) return '';
  
  let cleaned = title
    // Remove diameter specifications (1.75mm, 2.85mm, 3.00mm)
    .replace(/\s*,?\s*\d+\.?\d*\s*mm\b/gi, '')
    // Remove weight specifications (1KG, 2.2LB, 1000g, 500G, etc.)
    .replace(/\s*,?\s*\d+\.?\d*\s*kg\b/gi, '')
    .replace(/\s*,?\s*\d+\.?\d*\s*lb\b/gi, '')
    .replace(/\s*,?\s*\d{3,4}\s*g\b/gi, '')
    // Remove combined weight patterns (1KG/2.2LB)
    .replace(/\s*,?\s*\d+\.?\d*\s*kg\s*\/\s*\d+\.?\d*\s*lb\b/gi, '')
    // Remove spool count patterns (3 Spools, x3, etc.)
    .replace(/\s*,?\s*\d+\s*spools?\b/gi, '')
    .replace(/\s*,?\s*x\d+\b/gi, '')
    // Remove color names after slash (Amolen pattern: "/ White Pink Purple")
    .replace(/\s*\/\s*[A-Za-z\s&]+$/g, '')
    // Clean up orphaned commas left after removing size/weight
    .replace(/,\s*,/g, ',')         // double commas
    .replace(/\s+,/g, ',')          // space before comma
    .replace(/,\s*$/g, '')          // trailing comma
    .replace(/,\s*([A-Z])/g, ' $1') // comma before color name → space
    // Remove trailing special characters (commas, slashes, dashes, etc.)
    .replace(/[\s,\-–—\/\\|:;]+$/g, '')
    .replace(/\s+/g, ' ')
    .trim();
  
  return cleaned;
}

// Common color names to detect at the end of product titles
export const COLOR_WORDS = [
  // Basic colors
  'Beige', 'Black', 'Blue', 'Brown', 'Burgundy', 'Charcoal', 'Copper', 'Cream', 'Cyan',
  'Gold', 'Gray', 'Grey', 'Green', 'Ivory', 'Lavender', 'Lime', 'Magenta', 'Maroon', 'Navy',
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
  // PC-FR must come before PC to ensure flame-retardant variant is matched first
  // IMPORTANT: Product type words (Basic, Matte, etc.) MUST be matched greedily when present
  const bambuLabProductTypes = ['Basic', 'Matte', 'Silk', 'Translucent', 'Tough', 'Wood', 'Marble', 'Metal', 'Galaxy', 'Glow', 'Sparkle', 'Aero', 'Impact', 'HF', 'HS', 'Lite'];
  const bambuLabMaterials = /^Bambu Lab (e?PLA|PETG|TPU|ABS|ASA|PA6?-?(?:CF|GF)?|PA-?(?:CF|GF)?|PC-FR|PC|PET-CF|PVA|PAHT|PCTG|PPS|PPA)(?:-CF|-GF)?/i;
  const materialMatch = normalizedTitle.match(bambuLabMaterials);
  
  if (materialMatch) {
    let baseName = materialMatch[0]; // e.g., "Bambu Lab PLA"
    let remainder = normalizedTitle.slice(baseName.length).trim(); // e.g., "Basic Green"
    
    // Check if remainder starts with a product type
    for (const productType of bambuLabProductTypes) {
      if (remainder.toLowerCase().startsWith(productType.toLowerCase())) {
        baseName += ' ' + productType;
        remainder = remainder.slice(productType.length).trim();
        break;
      }
    }
    
    // Check for Multi-color or Gradient suffix
    if (remainder.toLowerCase().startsWith('multi-color')) {
      baseName += ' Multi-color';
      remainder = remainder.slice('multi-color'.length).trim();
    } else if (remainder.toLowerCase().startsWith('gradient')) {
      baseName += ' Gradient';
      remainder = remainder.slice('gradient'.length).trim();
    }
    
    // If there's still a remainder (the color), return the base name
    if (remainder.length > 0) {
      return baseName.trim();
    }
  }
  
  // Handle Bambu Lab products that are just "Bambu Lab [Material] [Color]" (no product type)
  // PC-FR must come before PC to ensure flame-retardant variant is matched first
  const bambuLabSimpleMatch = normalizedTitle.match(
    /^(Bambu Lab (?:e?PLA|PETG|TPU|ABS|ASA|PA6?-?(?:CF|GF)?|PA-?(?:CF|GF)?|PC-FR|PC|PET-CF|PVA|PAHT|PCTG|PPS|PPA)(?:-CF|-GF)?)\s+.+$/i
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
  
  // 3D-FUEL PATTERN: Handle comma-separated format "ProductLine Material, Color, Size"
  // Examples: "Standard PLA+, Desert Tan, 1.75mm" → "Standard PLA+"
  //           "Tough Pro PLA+, Almond, 1.75mm" → "Tough Pro PLA+"
  //           "Silk PLA+, Silky Black Hills Gold, 1.75mm" → "Silk PLA+"
  //           "Pro PCTG, Desert Tan, 1.75mm" → "Pro PCTG"
  //           "Dual-Color Silk PLA+, Silky Lagoon, 1.75mm" → "Dual-Color Silk PLA+"
  const threeDFuelProductLines = [
    'Dual-Color Silk', 'Dual Color Silk',
    'Tough Pro', 'Standard', 'Silk', 'Pro',
  ];
  
  for (const productLine of threeDFuelProductLines) {
    // Match: ProductLine + Material + comma + anything (color, size)
    const regex = new RegExp(
      `^(${productLine.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\s+(?:PLA\\+?|PETG|PCTG|ABS|TPU|ASA|PC)),\\s*.+$`,
      'i'
    );
    const match = normalizedTitle.match(regex);
    if (match) {
      return match[1].trim();
    }
  }

  // EXTRUDR PATTERN: Handle "Extrudr [ProductLine] [Color] ral [code]" format
  // Examples: "Extrudr GreenTEC Pro Black ral 9017" → "Extrudr GreenTEC Pro"
  //           "Extrudr DuraPro ABS CF Black ral 9017" → "Extrudr DuraPro ABS CF"
  const extrudrMatch = normalizedTitle.match(/^(Extrudr\s+(?:[\w-]+\s+)*(?:PLA|PETG|ABS|ASA|PA\d*|PC|TPU|FLEX|PCTG|GreenTEC|BioFusion|FLAX|PEARL)(?:\s+(?:CF|GF|Pro|Basic|NX2|MATT|Hard|Medium|Semisoft))*)\s+.+\s+ral\s+\d+$/i);
  if (extrudrMatch) {
    return extrudrMatch[1].trim();
  }

  // AZUREFILM PATTERN: Handle "[Material] [ProductLine] filament [Color]" format
  // Examples: "PLA Matte HS filament Army Green" → "PLA Matte HS"
  //           "PETG Hyper Speed filament Light Grey" → "PETG Hyper Speed"
  //           "ASA filament Dark Blue" → "ASA"
  // IMPORTANT: Must NOT match Amolen product line suffixes like "Transparent Rainbow"
  // AZUREFILM PATTERN: Handle "[Material] [ProductLine] filament [Color]" format
  // NOTE: High Speed and High-Speed are product lines, NOT colors
  const azurefilmFilamentMatch = normalizedTitle.match(/^((?:PLA|PETG|ABS|ASA|TPU|Flexible\s+\d+A)(?:\s+(?:Matte|Silk|Original|Hyper\s*Speed|High[- ]?Speed|HS|Lumos|CMYK|Basic|Plus|Pro)(?:\s+(?:Dual\s+Color|Rainbow|Litho))?)?)\s+(?:filament\s+)?(.+)$/i);
  if (azurefilmFilamentMatch) {
    const basePart = azurefilmFilamentMatch[1].trim();
    const remainder = azurefilmFilamentMatch[2].trim();
    
    // DON'T match if remainder looks like a product line suffix (not just a color)
    const productLineSuffixes = [
      'Basic',  // Prevents "PLA Basic" → "PLA" stripping
      'Transparent Rainbow', 'Matte Rainbow', 'Silk Rainbow', 'Crystal Rainbow',
      'Glow in the Dark', 'Glow-in-the-Dark', 'GITD',
      'Galaxy', 'Marble', 'Crystal-Transparent', 'Crystal Transparent',
      'High Speed', 'High-Speed',  // These are product lines, not colors!
    ];
    const isProductLine = productLineSuffixes.some(suffix => 
      remainder.toLowerCase().startsWith(suffix.toLowerCase())
    );
    
    // Only return base if remainder looks like a color (not a pack descriptor or product line)
    if (!isProductLine && !remainder.match(/\d+-pack|Sample|plate|Magnetic|drill/i)) {
      return basePart;
    }
  }

  // Examples: "PLA Basic-High Speed 1.75mm, 1 KG Carrot Orange" → "PLA Basic-High Speed"
  //           "PLA Matte Dual Filament 1.75mm, 1 KG Purple & Blue" → "PLA Matte Dual"
  //           "PLA Matte Triple Filament 1.75mm, 1KG/2.2LB White Pink Purple" → "PLA Matte Triple"
  //           "PETG Basic 1.75mm, 1KG/2.2LB Black" → "PETG Basic"
  //           "PEBA 90A Flexible Filament 1.75mm, 1KG Black" → "PEBA 90A Flexible"
  const amelonProductLines = [
    // Multi-packs must be matched before single-spool product lines
    'Crystal-Transparent Gradient Variety Pack', 'Gradient Variety Pack', 'Variety Pack',
    // Sub-lines with Rainbow/Dual/Triple BEFORE base patterns (longer patterns first)
    'Basic-High Speed', 'Basic High Speed', 'Basic Dual Color-High Speed', 'Basic Dual Color',
    'High Speed',  // For "PLA+ High Speed" products
    'Crystal-Transparent', 'Crystal Transparent',  // For "PLA Crystal-Transparent" products
    'Matte Rainbow', 'Matte Triple', 'Matte Dual', 'Matte Basic', 'Matte Tri-Color',
    'Silk Rainbow', 'Silk Triple', 'Silk Dual', 'Silk Starry', 'Silk Tri-Color',
    'Transparent Rainbow',
    // Base patterns last
    'Matte', 'Silk', 'Marble', 'Marble Texture', 'Sparkle', 'Galaxy', 'Glow in the Dark', 'Glow', 
    'Wood', 'Carbon Fiber', 'Metal', 'Transparent', 'Clear',
    'Basic', '90A Flexible', '95A Flexible', '85A',
  ];
  // Sort by length descending to match longer patterns first
  const sortedProductLines = [...amelonProductLines].sort((a, b) => b.length - a.length);
  
  // Try to match Amolen pattern: "Material ProductLine [Filament] [Size] [Color]"
  for (const productLine of sortedProductLines) {
    // Match: Material + ProductLine + optional "Filament" + optional size/weight specs + anything (color)
    const regex = new RegExp(
      `^((?:PLA\\+?|PETG|ABS|TPU|TPE|ASA|PEBA|PA\\d*|PC|HIPS|PVA|Nylon)\\s+${productLine.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})(?:\\s+Filament)?(?:\\s+[\\d.]+\\s*mm.*|\\s+.+)?$`,
      'i'
    );
    const match = normalizedTitle.match(regex);
    if (match) {
      return match[1].trim();
    }
  }
  
  // ANYCUBIC PATTERN: Handle promotional products and product lines
  // Examples: "PLA Silk Christmas Bulk Sale Copper" → "PLA Silk" (after cleaning promo)
  //           "PETG Filament Lake Blue" → "PETG"
  //           "High Speed PLA Black" → "High Speed PLA"
  //           "Matte PLA Grey" → "Matte PLA"
  const vendorLower = (typeof material === 'string' ? material : '').toLowerCase();
  const isAnycubic = normalizedTitle.toLowerCase().includes('anycubic') || 
                     vendorLower.includes('anycubic');
  
  if (isAnycubic || normalizedTitle.match(/^(?:High[- ]?Speed|Silk|Matte|Marble|Sparkle|Glow)\s+(?:PLA|PETG|ABS)/i)) {
    // Clean promotional text first
    const promotionalPatterns = [
      /Christmas\s*Bulk\s*Sale/gi,
      /Flash\s*Sale/gi,
      /Buy\s*\d+.*Get\s*\d+.*Free/gi,
      /\d+-\d+kg\s*Deals?/gi,
      /Bulk\s*Sale/gi,
      /Special\s*Offer/gi,
    ];
    
    let cleanedForParsing = normalizedTitle;
    for (const pattern of promotionalPatterns) {
      cleanedForParsing = cleanedForParsing.replace(pattern, '');
    }
    cleanedForParsing = cleanedForParsing.replace(/\s+/g, ' ').trim();
    
    // Anycubic product lines (ordered from most specific to least)
    const anycubicProductLines = [
      'High Speed', 'High-Speed', 'HS',
      'Silk', 'Matte', 'Marble', 'Sparkle', 'Glow in the Dark', 'Glow-in-the-Dark', 'Glow',
      'Carbon Fiber', 'CF',
      'Basic', 'Standard', 'Plus',
    ];
    
    for (const productLine of anycubicProductLines) {
      // Match: [optional Brand] [ProductLine] Material [Color]
      const regex = new RegExp(
        `^((?:Anycubic\\s+)?${productLine.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\s+(?:PLA\\+?|PETG\\+?|ABS|TPU|ASA|PC))(?:\\s+Filament)?(?:\\s+.+)?$`,
        'i'
      );
      const match = cleanedForParsing.match(regex);
      if (match) {
        return match[1].trim();
      }
      
      // Also try: Material [ProductLine] [Color] pattern
      const regex2 = new RegExp(
        `^((?:Anycubic\\s+)?(?:PLA\\+?|PETG\\+?|ABS|TPU|ASA|PC)\\s+${productLine.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})(?:\\s+Filament)?(?:\\s+.+)?$`,
        'i'
      );
      const match2 = cleanedForParsing.match(regex2);
      if (match2) {
        return match2[1].trim();
      }
    }
    
    // Simple material match for Anycubic: "[Anycubic] Material [Filament] Color"
    const simpleMatch = cleanedForParsing.match(
      /^((?:Anycubic\s+)?(?:PLA\+?|PETG\+?|ABS|TPU|TPU\s+95A|ASA|PC))(?:\s+Filament)?(?:\s+.+)?$/i
    );
    if (simpleMatch) {
      return simpleMatch[1].trim();
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
  anyInStock: boolean; // True if ANY variant is in stock
  colorStockStatus: Map<string, boolean>; // Map of color hex -> inStock status
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
  product_line_id?: string | null; // Authoritative grouping from database
}

/**
 * Convert product_line_id to a display-friendly name
 * e.g., "amolen__pla__silk-basic" -> "PLA Silk Basic"
 * e.g., "amolen__petg__transparent-rainbow" -> "PETG Transparent Rainbow"
 */
export function formatProductLineIdForDisplay(productLineId: string, fallbackTitle: string): string {
  // product_line_id format varies by brand:
  // - Amolen/etc: "vendor__material__line-name" (3+ parts)
  // - Anycubic: "vendor__slug" (2 parts) - use fallbackTitle
  // - Atomic: "atomic-filament__material" (2 parts) - extract material as display name
  const parts = productLineId.split('__');
  
  // FORMFUTURA: Use cleaned product_title directly (removes color suffix)
  // The product_title is authoritative, e.g., "High Gloss PLA ColorMorph - Lava" → "High Gloss PLA ColorMorph"
  if (parts[0] === 'formfutura' && fallbackTitle) {
    const cleaned = fallbackTitle
      .replace(/\s*-\s*[^-]+$/, '')  // Remove trailing color suffix
      .replace(/^FormFutura\s+/gi, '')
      .replace(/\s+Filament\s*$/i, '')
      .replace(/\s*,?\s*\d+\.?\d*\s*mm\b/gi, '')
      .replace(/\s*,?\s*\d+\.?\d*\s*kg\b/gi, '')
      .trim();
    return cleaned || fallbackTitle;
  }
  
  // ELEGOO: Use the database product_title directly (from Shopify H1)
  // The product_title is the authoritative source, not the product_line_id
  // This ensures card titles match detail page titles exactly
  if (parts[0] === 'elegoo' && fallbackTitle) {
    // Clean the title - remove brand name, "Filament" suffix, and weight/diameter specs
    const cleaned = fallbackTitle
      .replace(/^Elegoo\s+/gi, '')
      .replace(/\s+Filament\s*$/i, '')
      .replace(/\s*,?\s*\d+\.?\d*\s*mm\b/gi, '')
      .replace(/\s*,?\s*\d+\.?\d*\s*kg\b/gi, '')
      .trim();
    return cleaned || fallbackTitle;
  }
  
  // ATOMIC FILAMENT: Extract product line name from the 2-part ID
  // Format: "atomic-filament__pla" → "PLA", "atomic-filament__pla-silk" → "PLA Silk"
  // This ensures card titles show "PLA", "PETG", "PLA Silk" instead of individual product names
  if (parts[0] === 'atomic-filament' && parts.length === 2) {
    const materialSlug = parts[1]; // e.g., "pla", "pla-silk", "petg", "abs", "asa"
    
    // Convert slug to display name
    const displayName = materialSlug
      .replace(/-/g, ' ')
      .toUpperCase()
      .replace('SILK', 'Silk'); // "PLA SILK" → "PLA Silk"
    
    return displayName;
  }
  
  // EXTRUDR: Convert product_line_id to clean display name
  // Format: "extrudr__biofusion" → "BioFusion", "extrudr__flex-medium" → "FLEX Medium"
  if (parts[0] === 'extrudr' && parts.length === 2) {
    const productSlug = parts[1]; // e.g., "biofusion", "flex-medium", "durapro-abs"
    
    // Map slugs to display names
    const EXTRUDR_DISPLAY_NAMES: Record<string, string> = {
      'biofusion': 'BioFusion',
      'durapro-abs': 'DuraPro ABS',
      'durapro-abs-cf': 'DuraPro ABS CF',
      'durapro-asa': 'DuraPro ASA',
      'durapro-asa-cf': 'DuraPro ASA CF',
      'durapro-asa-gf': 'DuraPro ASA GF',
      'durapro-pa12': 'DuraPro PA12',
      'durapro-pc-pbt': 'DuraPro PC-PBT',
      'durapro-pc-pbt-cf': 'DuraPro PC-PBT CF',
      'flax': 'FLAX',
      'flex-hard': 'FLEX Hard',
      'flex-medium': 'FLEX Medium',
      'flex-semisoft': 'FLEX Semisoft',
      'flex-medium-esd': 'FLEX Medium ESD',
      'flex-hard-cf': 'FLEX Hard CF',
      'greentec': 'GreenTEC',
      'greentec-pro': 'GreenTEC Pro',
      'greentec-pro-carbon': 'GreenTEC Pro Carbon',
      'pctg': 'PCTG',
      'petg': 'PETG',
      'xpetg': 'xPETG',
      'xpetg-cf': 'xPETG CF',
      'pla-nx2-matt': 'PLA NX2 Matt',
      'pla-basic': 'PLA Basic',
      'pla-cmyk': 'PLA CMYK',
      'pearl': 'Pearl',
      'wood': 'Wood',
      'pla': 'PLA',
    };
    
    return EXTRUDR_DISPLAY_NAMES[productSlug] || 
      productSlug.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
  }
  
  // NUMAKERS: Handle underscore-based material slugs
  // Format: numakers__pla_silk__pla-silk → "PLA Silk"
  //         numakers__petg_hs__petg-hs-filament → "PETG-HS"
  //         numakers__pla_starlight__pla-starlight → "PLA Starlight"
  if (parts[0] === 'numakers' && parts.length >= 3) {
    const materialSlug = parts[1]; // e.g., "pla_silk", "petg_hs", "pla+"
    const lineSlug = parts[2];     // e.g., "pla-silk", "petg-hs-filament"
    
    // Map material slugs to clean display names
    const NUMAKERS_MATERIAL_DISPLAY: Record<string, string> = {
      'pla+': 'PLA+',
      'pla_silk': 'PLA Silk',
      'pla_matte': 'PLA Matte',
      'pla_starlight': 'PLA Starlight',
      'pla_glow': 'PLA Glow in the Dark',
      'pla_marble': 'PLA Marble',
      'pla_wood': 'PLA Wood',
      'pla_cf': 'PLA-CF',
      'petg_hs': 'PETG-HS',
      'petg_translucent': 'PETG Translucent',
      'asa': 'ASA',
      'abs': 'ABS',
    };
    
    // Check for special line slug patterns
    if (lineSlug === 'tri-color-silk-pla') {
      return 'Tri-Color Silk PLA';
    }
    
    return NUMAKERS_MATERIAL_DISPLAY[materialSlug] || 
      materialSlug.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
  }
  
  // OVERTURE: Handle product line names from CSV seed
  // Format: overture__pla__basic → "Basic PLA"
  //         overture__pla__matte → "Matte PLA"
  //         overture__pla__rock → "Rock PLA"
  //         overture__tpu__high-speed → "High Speed TPU"
  if (parts[0] === 'overture' && parts.length >= 3) {
    const materialSlug = parts[1]; // e.g., "pla", "petg", "tpu"
    const lineSlug = parts[2];     // e.g., "basic", "matte", "rock", "high-speed"
    
    // Map line slugs to clean display names
    const OVERTURE_LINE_DISPLAY: Record<string, string> = {
      'basic': 'Basic',
      'matte': 'Matte',
      'silk': 'Silk',
      'easy': 'Easy',
      'glow': 'Glow',
      'rock': 'Rock',
      'super': 'Super',
      'professional': 'Professional',
      'high-speed': 'High Speed',
      'translucent': 'Translucent',
      'refill': 'Refill',
    };
    
    const material = materialSlug.toUpperCase();
    const line = OVERTURE_LINE_DISPLAY[lineSlug] || 
      lineSlug.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
    
    return `${line} ${material}`.trim();
  }
  
  // SUNLU: Handle 3-part IDs like sunlu__pla-marble__standard
  // Examples: sunlu__pla-marble__standard → "PLA Marble"
  //           sunlu__petg-cf__standard → "PETG-CF"
  //           sunlu__pla-matte-dual-color__standard → "PLA Matte Dual-Color"
  if (parts[0] === 'sunlu' && parts.length >= 2) {
    const materialSlug = parts[1]; // e.g., "pla-marble", "petg-cf", "pla-matte-dual-color"
    
    // Convert material slug to display name
    const displayName = materialSlug
      .split('-')
      .map((word, idx) => {
        const upper = word.toUpperCase();
        // Keep material abbreviations uppercase
        if (['PLA', 'PETG', 'ABS', 'ASA', 'TPU', 'PC', 'PP', 'PA', 'PA12', 'PEEK', 'CF', 'GF', 'FR', 'PVB', 'HIPS', 'HS'].includes(upper)) {
          return upper;
        }
        // Title case for descriptive words
        return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
      })
      .join(' ')
      // Fix formatting for composite suffixes (must be hyphenated)
      .replace(/\s+CF\b/g, '-CF')
      .replace(/\s+GF\b/g, '-GF')
      .replace(/\s+FR\b/g, '-FR')
      // Clean up special patterns
      .replace(/Dual Color/g, 'Dual-Color')
      .replace(/High Speed/g, 'HS');
    
    return displayName.trim();
  }
  
  // GEEETECH: Handle underscore-based slugs in product_line_id
  // Examples: geeetech__pla__silk_tri → "PLA Silk Tri-Color"
  //           geeetech__pla__hs_pla → "PLA High Speed"
  //           geeetech__pla_marble__standard → "PLA Marble"
  if (parts[0] === 'geeetech' && parts.length >= 3) {
    const materialSlug = parts[1]; // e.g., "pla", "pla_cf", "pla_marble"
    const lineSlug = parts[2];     // e.g., "silk_tri", "standard", "hs_pla"
    
    // Build material name from slug
    let material = materialSlug
      .replace(/_/g, ' ')
      .toUpperCase()
      .replace(/\bCF\b/g, '-CF')     // "PLA CF" → "PLA-CF"
      .replace(/\bGF\b/g, '-GF')     // "PETG GF" → "PETG-GF"
      .trim();
    
    // Format line name (skip "standard")
    let lineName = '';
    if (lineSlug && lineSlug !== 'standard') {
      lineName = lineSlug
        .replace(/_/g, ' ')
        .replace(/\b\w/g, c => c.toUpperCase())
        // Fix specific Geeetech patterns
        .replace(/^Silk Tri$/i, 'Silk Tri-Color')
        .replace(/^Silk Dual$/i, 'Silk Dual-Color')
        .replace(/^Silk Rainbow$/i, 'Silk Rainbow')
        .replace(/^Hs Pla$/i, 'High Speed')
        .replace(/^Hs$/i, 'High Speed')
        .replace(/\bPla\b/g, '')  // Remove redundant "Pla" from line name
        .trim();
    }
    
    // Combine material and line name
    return lineName ? `${material} ${lineName}`.trim() : material.trim();
  }
  
  if (parts.length >= 3) {
    // 3+ part format: Extract material (uppercase) and line name (title case)
    // Handle hyphenated material slugs (e.g., "pla-metal", "petg-cf", "rapid-petg")
    let materialSlug = parts[1] || '';
    let material = '';
    
    // Check if material slug contains composite suffixes (CF, GF)
    const compositeSuffixes = ['-cf', '-gf'];
    const hasCompositeSuffix = compositeSuffixes.some(s => materialSlug.toLowerCase().endsWith(s));
    
    if (hasCompositeSuffix) {
      // Keep composite suffix with hyphen: "petg-cf" → "PETG-CF"
      material = materialSlug.toUpperCase();
    } else if (materialSlug.includes('-')) {
      // Convert hyphen to space for display: "pla-metal" → "PLA Metal", "rapid-petg" → "Rapid PETG"
      material = materialSlug
        .split('-')
        .map((word, idx) => {
          const upper = word.toUpperCase();
          // Keep material abbreviations uppercase (PLA, PETG, ABS, etc.)
          if (['PLA', 'PETG', 'ABS', 'ASA', 'TPU', 'PC', 'PA', 'PAHT'].includes(upper)) {
            return upper;
          }
          // Title case for other words
          return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
        })
        .join(' ');
    } else {
      material = materialSlug.toUpperCase();
    }
    
    // Combine all parts after material (handles cases like "silk-basic" or "transparent-rainbow")
    const lineParts = parts.slice(2).join(' ');
    let lineName = lineParts
      .replace(/-/g, ' ')
      .replace(/\b\w/g, c => c.toUpperCase())
      // Fix capitalization for abbreviations like "HS" (Matte Hs → Matte HS)
      .replace(/\bHs\b/g, 'HS')
      .trim();
    
    // Remove category suffixes ONLY when they're redundant (already present in the material slug)
    // e.g., "pla-metal" + "metallic" → "PLA Metal" (strip "Metallic" because "metal" is in material)
    // BUT: "esun__pla__matte" → "PLA Matte" (keep "Matte" because it's not in "pla")
    // Always strip internal tags: "Composite", "Standard"
    lineName = lineName.replace(/\b(Composite|Standard)\b/gi, '').trim();
    
    const materialLower = material.toLowerCase();
    const redundantSuffixes = ['Metallic', 'Silk', 'Galaxy', 'Marble', 'Matte', 'Sparkle', 'Wood', 'Carbon Fiber', 'Glass Fiber'];
    for (const suffix of redundantSuffixes) {
      // Only strip if material already contains this word (e.g., "pla-silk" contains "silk")
      const suffixKey = suffix.toLowerCase().replace(' ', '').replace('-', '');
      if (materialLower.includes(suffixKey) || materialLower.includes(suffix.toLowerCase().split(' ')[0])) {
        lineName = lineName.replace(new RegExp(`\\b${suffix}\\b`, 'gi'), '').trim();
      }
    }
    
    // If lineName is now empty (e.g., "bambulab__abs-gf__composite"), just return material
    if (!lineName) {
      return material;
    }
    
    return `${material} ${lineName}`.trim();
  }
  
  // 2-part format (Anycubic, etc.): "vendor__slug"
  // The fallbackTitle IS the correct product_title from the database (already scraped from H1)
  // Just clean up brand prefix and common suffixes - DO NOT call getBaseProductName which strips product lines
  const cleaned = fallbackTitle
    .replace(/^(Anycubic|Polymaker|Hatchbox|Sunlu|Elegoo|Creality)\s+/gi, '')
    .replace(/\s+Filament\s*$/i, '')
    .replace(/\s*,?\s*\d+\.?\d*\s*mm\b/gi, '')  // Remove diameter
    .replace(/\s*,?\s*\d+\.?\d*\s*kg\b/gi, '')  // Remove weight
    .replace(/\s*,?\s*\d+\.?\d*\s*lb\b/gi, '')
    .trim();
  
  return cleaned || fallbackTitle;
}

/**
 * Group filaments by base product name
 * Combines color/weight variants into single entries
 * 
 * IMPORTANT: Uses product_line_id as the authoritative grouping key when available.
 * This ensures FilamentCards show the same variants as FilamentDetail pages.
 */
export function groupFilamentsByProduct<T extends FilamentBase>(filaments: T[]): GroupedFilament[] {
  const groups = new Map<string, GroupedFilament>();
  
  filaments.forEach((filament) => {
    // PRIORITY 1: Use product_line_id if available (authoritative from database)
    // PRIORITY 2: Fall back to title parsing only when product_line_id is NULL
    let groupKey: string;
    let baseName: string;
    
    if (filament.product_line_id) {
      // Use product_line_id directly - this is the authoritative grouping
      groupKey = filament.product_line_id;
      // Convert product_line_id to display-friendly name for UI
      baseName = formatProductLineIdForDisplay(filament.product_line_id, filament.product_title);
    } else {
      // Fallback: parse from title (legacy behavior for products without product_line_id)
      baseName = getBaseProductName(filament.product_title, filament.material);
      groupKey = `${filament.vendor || 'Unknown'}::${baseName}`;
    }
    
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
        anyInStock: false, // Will be set to true if any variant is available
        colorStockStatus: new Map<string, boolean>(), // Track stock status per color
      });
    }
    
    const group = groups.get(groupKey)!;
    group.variants.push(filament);
    
    // Track stock status - if ANY variant is in stock, the group is in stock
    const isVariantInStock = filament.variant_available !== false;
    if (isVariantInStock) {
      group.anyInStock = true;
    }
    
    // Track colors and their stock status
    if (filament.color_hex) {
      const normalizedHex = filament.color_hex.startsWith('#') ? filament.color_hex : `#${filament.color_hex}`;
      group.colors.add(normalizedHex);
      // If this color is in stock, mark it as such (only update if not already marked as in stock)
      if (!group.colorStockStatus.has(normalizedHex) || isVariantInStock) {
        group.colorStockStatus.set(normalizedHex, group.colorStockStatus.get(normalizedHex) || isVariantInStock);
      }
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

/**
 * Get the best "product line" name for display on product detail pages.
 * 
 * Priority:
 * 1. If `material` field is more descriptive than base material (e.g., "Premium PLA High Speed"),
 *    use the material field
 * 2. Otherwise, use the cleaned product title (via getBaseProductName)
 * 
 * This ensures users see "PLA High Speed" instead of just "PLA" for specialized product lines.
 * 
 * @param material - The material field from the filament record (e.g., "Premium PLA High Speed")
 * @param productTitle - The product_title field (e.g., "Spectrum ReFill Premium PLA High Speed 1.75mm TRUE YELLOW 1kg")
 * @returns The best product line name for display
 */
export function getProductLineName(
  material: string | null | undefined,
  productTitle: string | null | undefined
): string {
  const title = productTitle || '';
  
  // Get the base product name from title (strips color, size, etc.)
  const baseFromTitle = getBaseProductName(title, material);
  
  // Base material types that are NOT descriptive product lines
  const baseMaterialTypes = [
    'PLA', 'PLA+', 'PETG', 'ABS', 'ASA', 'TPU', 'TPE', 'PC', 'PA', 'PA6', 'HIPS', 
    'PVA', 'Nylon', 'PP', 'PCTG', 'PEEK', 'PEI', 'PPSU', 'CPE',
    'TPU-95A', 'TPU-85A', 'TPU 95A', 'TPU 85A',
  ];
  
  // Check if material field is more descriptive than base types
  if (material) {
    const materialNormalized = material.trim();
    const isJustBaseMaterial = baseMaterialTypes.some(
      base => materialNormalized.toLowerCase() === base.toLowerCase()
    );
    
    // If material is more descriptive (contains modifiers like "High Speed", "Silk", "Matte", etc.)
    if (!isJustBaseMaterial && materialNormalized.length > 2) {
      // Clean up common prefixes/suffixes that aren't useful for display
      let cleanedMaterial = materialNormalized
        .replace(/^Premium\s+/i, '') // "Premium PLA High Speed" → "PLA High Speed"
        .replace(/\s+Filament$/i, '') // Remove trailing "Filament"
        .trim();
      
      // If after cleaning it's still more descriptive than base, use it
      if (cleanedMaterial.length > baseFromTitle.length || 
          cleanedMaterial.toLowerCase() !== baseFromTitle.toLowerCase()) {
        // Check if it contains modifiers that make it more descriptive
        const modifiers = ['High Speed', 'HS', 'Matte', 'Silk', 'Marble', 'Wood', 'Carbon', 
          'Glass', 'Glow', 'Galaxy', 'Metal', 'Sparkle', 'Tough', 'Pro', 'Plus', 'Basic',
          'Translucent', 'Clear', 'Flexible', 'Impact', 'Aero', 'HF', 'Lite'];
        const hasModifier = modifiers.some(mod => 
          materialNormalized.toLowerCase().includes(mod.toLowerCase())
        );
        
        if (hasModifier) {
          return cleanedMaterial;
        }
      }
    }
  }
  
  // Fall back to the cleaned base product name from title
  return cleanFilamentDisplayName(baseFromTitle);
}
