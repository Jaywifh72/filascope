/**
 * TAG EXTRACTION UTILITIES
 * 
 * Shared utilities for extracting finish types, high speed capability,
 * and abrasive properties from filament titles and materials.
 */

export type FinishType = 
  | 'Silk' 
  | 'Matte' 
  | 'Metallic' 
  | 'Sparkle' 
  | 'Translucent' 
  | 'Glow' 
  | 'Carbon' 
  | 'Glass Fiber' 
  | 'Wood' 
  | 'Marble' 
  | 'Multicolor'
  | 'Standard';

/**
 * Normalize existing finish_type values to standard values
 * Handles variations like "Carbon Fiber", "CF", "Composite-CF" -> "Carbon"
 */
export function normalizeFinishType(existingType: string | null): FinishType {
  if (!existingType) return "Standard";

  const normalized = existingType.toLowerCase().trim();

  // Carbon Fiber variations → 'Carbon'
  if (
    normalized === "carbon" ||
    normalized === "carbon fiber" ||
    normalized === "carbonfiber" ||
    normalized === "composite-cf" ||
    normalized === "cf" ||
    normalized.includes("carbon fiber") ||
    normalized.includes("carbon-fiber") ||
    /^cf\d*$/.test(normalized) // CF, CF15, CF30
  ) {
    return "Carbon";
  }

  // Glass Fiber variations → 'Glass Fiber'
  if (
    normalized === "glass" ||
    normalized === "glass fiber" ||
    normalized === "glassfiber" ||
    normalized === "composite-gf" ||
    normalized === "gf" ||
    normalized.includes("glass fiber") ||
    normalized.includes("glass-fiber") ||
    /^gf\d*$/.test(normalized) // GF, GF15, GF30
  ) {
    return "Glass Fiber";
  }

  // Silk variations → 'Silk'
  if (
    normalized === "silk" ||
    normalized === "shimmer" ||
    normalized === "shiny" ||
    normalized === "pearl" ||
    normalized.includes("silk")
  ) {
    return "Silk";
  }

  // Metallic variations → 'Metallic'
  if (
    normalized === "metallic" ||
    normalized === "metal" ||
    normalized === "chrome" ||
    normalized.includes("metallic")
  ) {
    return "Metallic";
  }

  // Matte variations → 'Matte'
  if (
    normalized === "matte" ||
    normalized === "matt" ||
    normalized === "flat" ||
    normalized === "semi-matte" ||
    normalized.includes("matte")
  ) {
    return "Matte";
  }

  // Wood variations → 'Wood'
  if (
    normalized === "wood" ||
    normalized === "wood fill" ||
    normalized === "woodfill" ||
    normalized.includes("wood")
  ) {
    return "Wood";
  }

  // Glow variations → 'Glow'
  if (
    normalized === "glow" ||
    normalized === "glow in the dark" ||
    normalized === "gitd" ||
    normalized === "phosphorescent" ||
    normalized === "fluorescent" ||
    normalized === "uv reactive" ||
    normalized === "uv" ||
    normalized === "neon" ||
    normalized.includes("glow")
  ) {
    return "Glow";
  }

  // Translucent variations → 'Translucent'
  if (
    normalized === "translucent" ||
    normalized === "transparent" ||
    normalized === "clear" ||
    normalized.includes("translucent") ||
    normalized.includes("transparent")
  ) {
    return "Translucent";
  }

  // Sparkle variations → 'Sparkle'
  if (
    normalized === "sparkle" ||
    normalized === "sparkly" ||
    normalized === "glitter" ||
    normalized === "galaxy" ||
    normalized === "starlight" ||
    normalized.includes("sparkle") ||
    normalized.includes("glitter")
  ) {
    return "Sparkle";
  }

  // Marble variations → 'Marble'
  if (
    normalized === "marble" ||
    normalized === "stone" ||
    normalized.includes("marble")
  ) {
    return "Marble";
  }

  // Multicolor variations → 'Multicolor'
  if (
    normalized === "multicolor" ||
    normalized === "multi" ||
    normalized === "rainbow" ||
    normalized === "gradient" ||
    normalized === "colorchange" ||
    normalized === "colorshift" ||
    normalized === "iridescent" ||
    normalized.includes("multi")
  ) {
    return "Multicolor";
  }

  // Gloss variations → 'Standard' (gloss is default for most filaments)
  if (
    normalized === "gloss" ||
    normalized === "glossy" ||
    normalized === "natural"
  ) {
    return "Standard";
  }

  // If it's already a valid finish type, return with proper casing
  const validTypes: Record<string, FinishType> = {
    standard: "Standard",
    carbon: "Carbon",
    "glass fiber": "Glass Fiber",
    silk: "Silk",
    metallic: "Metallic",
    matte: "Matte",
    wood: "Wood",
    glow: "Glow",
    translucent: "Translucent",
    sparkle: "Sparkle",
    marble: "Marble",
    multicolor: "Multicolor",
  };

  return validTypes[normalized] || "Standard";
}

/**
 * Extract finish type from product title and material
 * Uses pattern matching to identify special finishes
 */
export function extractFinishType(title: string, material: string): FinishType {
  const text = `${title} ${material}`.toLowerCase();
  const titleLower = title.toLowerCase();

  // Carbon Fiber - comprehensive pattern matching
  // Check for explicit Carbon Fiber indicators first
  const hasCFIndicator = 
    /-cf\b/i.test(text) ||           // PA6-CF, PETG-CF, ASA-CF
    /\+cf\b/i.test(text) ||          // PETG+CF, PLA+CF
    /\bcf\d+/i.test(text) ||         // CF15, CF20, CF30
    /carbon\s*fiber/i.test(text) ||  // "carbon fiber" anywhere
    /carbon\s*fibre/i.test(text) ||  // British spelling
    /\bcarbon\s*filled/i.test(text) ||
    /\bcarbon\s*reinforced/i.test(text) ||
    /carbonx/i.test(text) ||         // CarbonX brand products
    /\bcarbon\b.*composite/i.test(text) ||
    /composite.*\bcarbon\b/i.test(text);
  
  // Also check title-specific patterns for materials that use -CF suffix
  const titleHasCF = /\b(pa|ppa|asa|pps|abs|pla|petg|pet|pc|pp|nylon)\s*-?\s*6?\s*-?cf\b/i.test(titleLower) ||
                     /\b(pa6|pa12|pa66|ppa|asa|pps|pet|peek|pei)\s*-?cf\b/i.test(titleLower);

  if (hasCFIndicator || titleHasCF) {
    // Exclude cases where "carbon" is just a color name (e.g., "Carbon Black")
    // but keep it if there's any fiber/CF indicator
    const isJustColorName = /carbon\s*(black|grey|gray)\b/i.test(text) && 
                            !/-cf\b|\+cf\b|cf\d|fiber|fibre|carbonx|composite/i.test(text);
    if (!isJustColorName) {
      return "Carbon";
    }
  }

  // Glass Fiber - similar patterns
  if (
    /-gf\b/i.test(text) ||
    /\+gf\b/i.test(text) ||
    /\bgf\d+/i.test(text) ||        // GF15, GF30
    /glass\s*fiber/i.test(text) ||
    /\bglass\s*filled/i.test(text) ||
    /\bglass\s*reinforced/i.test(text)
  ) {
    return "Glass Fiber";
  }

  // Silk / Shimmer
  if (/\bsilk\b/i.test(text) || /\bshimmer\b/i.test(text)) {
    return "Silk";
  }

  // Metallic / Metal
  if (/\bmetallic\b/i.test(text) || /\bmetal\b/i.test(text)) {
    return "Metallic";
  }

  // Matte
  if (/\bmatte?\b/i.test(text)) {
    return "Matte";
  }

  // Wood Fill - but exclude color names like "Rosewood" without wood content
  if (
    /\bwood\s*fill/i.test(text) ||
    /\bwood\s*pla/i.test(text) ||
    /-wood\b/i.test(text) ||
    /\+wood\b/i.test(text)
  ) {
    return "Wood";
  }

  // Glow in the dark
  if (
    /\bglow\b/i.test(text) ||
    /\bgitd\b/i.test(text) ||
    /glow[\s-]*in[\s-]*the[\s-]*dark/i.test(text) ||
    /\bphosphorescent\b/i.test(text)
  ) {
    return "Glow";
  }

  // Translucent / Transparent / Clear
  if (
    /\btranslucent\b/i.test(text) ||
    /\btransparent\b/i.test(text) ||
    /\bclear\b/i.test(text)
  ) {
    return "Translucent";
  }

  // Sparkle / Glitter / Galaxy
  if (
    /\bsparkle\b/i.test(text) ||
    /\bglitter\b/i.test(text) ||
    /\bgalaxy\b/i.test(text)
  ) {
    return "Sparkle";
  }

  // Marble
  if (/\bmarble\b/i.test(text)) {
    return "Marble";
  }

  return "Standard";
}

/**
 * Check if filament is high-speed capable
 * Based on title/material patterns
 */
export function isHighSpeedCapable(title: string, material: string): boolean {
  const t = ((title || '') + ' ' + (material || '')).toLowerCase();
  
  // Check for high-speed indicators
  return /high[\s-]?speed|highspeed|-hs\b|hs-|\bhs\s+|\brapid\b|hyper[\s-]?speed|turbo/i.test(t);
}

/**
 * Check if filament is abrasive (requires hardened nozzle)
 * Carbon fiber, glass fiber, and some metal-filled filaments are abrasive
 */
export function isAbrasive(title: string, material: string): boolean {
  const text = `${title} ${material}`.toLowerCase();

  // Carbon fiber patterns
  if (
    /-cf\b/i.test(text) ||
    /\+cf\b/i.test(text) ||
    /\bcf\d+/i.test(text) ||
    /carbon\s*fiber/i.test(text)
  ) {
    return true;
  }

  // Glass fiber patterns
  if (
    /-gf\b/i.test(text) ||
    /\+gf\b/i.test(text) ||
    /\bgf\d+/i.test(text) ||
    /glass\s*fiber/i.test(text)
  ) {
    return true;
  }

  // Metal fill patterns
  if (
    /\bmetal\s*fill/i.test(text) ||
    /\bsteel/i.test(text) ||
    /\bcopper\s*fill/i.test(text) ||
    /\bbronze\s*fill/i.test(text)
  ) {
    return true;
  }

  return false;
}

/**
 * Check if filament has carbon fiber
 */
export function hasCarbonFiber(title: string, material: string): boolean {
  const t = ((title || '') + ' ' + (material || '')).toLowerCase();
  
  // Comprehensive CF pattern matching
  const cfPattern = /carbon\s*fiber|carbon-fiber|carbon\s*fibre|-cf\b|\+cf\b|cf\s*\d|carbonx|\bpla-?cf\b|\bpetg-?cf\b|\babs-?cf\b|\bpa-?cf\b|\bpa6-?cf\b|\bpa12-?cf\b|\bpc-?cf\b|\bpet-?cf\b|\basa-?cf\b|\bpps-?cf\b|\bnylon.*cf\b|carbon\s*filled|carbon\s*reinforced/i;
  
  // Exclude pure polycarbonate (PC) unless it has actual CF indicator
  const hasPolycarbonate = /polycarbonate/i.test(t) && !/carbon\s*fiber|carbon\s*fibre|-cf\b|\+cf\b|cf\d/i.test(t);
  
  // Exclude "carbon black" as a color unless there's a CF indicator
  const isJustCarbonColor = /carbon\s*(black|grey|gray)\b/i.test(t) && !/-cf\b|\+cf\b|cf\d|fiber|fibre|carbonx/i.test(t);
  
  return !hasPolycarbonate && !isJustCarbonColor && cfPattern.test(t);
}

/**
 * Check if filament has glass fiber
 */
export function hasGlassFiber(title: string, material: string): boolean {
  const t = ((title || '') + ' ' + (material || '')).toLowerCase();
  return /glass\s*fiber|glass-fiber|-gf\b|\+gf\b|gf\s*\d|fiberglass/i.test(t);
}

/**
 * Check if filament is wood filled
 */
export function hasWoodFill(title: string, material: string): boolean {
  const t = ((title || '') + ' ' + (material || '')).toLowerCase();
  // Exclude color names that contain "wood" 
  if (/hollywood|rosewood|driftwood|deadwood|cherrywood/i.test(t)) return false;
  return /\bwood\b|timber|bamboo/i.test(t);
}

/**
 * Extract all relevant tags from a filament
 */
export interface ExtractedTags {
  finish_type: FinishType;
  high_speed_capable: boolean;
  is_nozzle_abrasive: boolean;
  carbon_fiber_percentage: number | null;
  glass_fiber_percentage: number | null;
  wood_powder_percentage: number | null;
}

export function extractAllTags(title: string, material: string): ExtractedTags {
  const hasCF = hasCarbonFiber(title, material);
  const hasGF = hasGlassFiber(title, material);
  const hasWood = hasWoodFill(title, material);
  
  return {
    finish_type: extractFinishType(title, material),
    high_speed_capable: isHighSpeedCapable(title, material),
    is_nozzle_abrasive: isAbrasive(title, material),
    // Set a default percentage if detected but unknown exact amount
    carbon_fiber_percentage: hasCF ? 15 : null,
    glass_fiber_percentage: hasGF ? 15 : null,
    wood_powder_percentage: hasWood ? 20 : null,
  };
}
