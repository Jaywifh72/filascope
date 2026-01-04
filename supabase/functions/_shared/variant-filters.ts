/**
 * SHARED VARIANT FILTERING UTILITY
 * 
 * Standard filtering rules for all brand sync functions:
 * - Exclude samples: weight < 300g
 * - Exclude bulk spools: weight > 1400g
 * - Exclude non-standard diameters: 2.85mm / 3.0mm (focus on 1.75mm consumer market)
 * - Exclude products with "Sample" or "Pack" in title
 * 
 * Usage:
 * import { shouldIncludeVariant, extractWeightFromText, extractDiameterFromText } from '../_shared/variant-filters.ts';
 */

// ============================================================================
// CONSTANTS
// ============================================================================

/** Minimum weight in grams - exclude samples and small coils */
export const MIN_WEIGHT_GRAMS = 300;

/** Maximum weight in grams - exclude bulk spools (2.5kg, 5kg, 10kg, etc.) */
export const MAX_WEIGHT_GRAMS = 5500;  // Supports up to 5kg consumer spools (4kg at $91.60 is better value)

/** Standard consumer filament diameter */
export const STANDARD_DIAMETER_MM = 1.75;

/** Non-standard diameters to exclude */
export const EXCLUDED_DIAMETERS_MM = [2.85, 3.0];

/** Keywords that indicate sample/variety products to exclude */
export const EXCLUDED_TITLE_KEYWORDS = [
  'sample',
  'pack',
  'variety',
  'bundle',
  'combo',
  'starter kit',
  'trial',
  // === Bundle/Pack products ===
  'super pack',       // AzureFilm bulk bundles (SUPER PACK PLA MIX)
  'multipack',        // Multi-spool bundles
  '10-pack',          // 10-spool bundles
  '5-pack',           // 5-spool bundles
  '4-pack',           // 4-spool bundles
  // === Non-filament products ===
  'gift card',        // Gift cards are not filaments
  'gift',             // Gift promotions (e.g., "PLA Gift - Black")
  '3d pen',           // 3D pens are not filaments
  'arch support',     // 3D printed products, not filaments
  'insoles',          // 3D printed products, not filaments
];

// ============================================================================
// KEYWORD FILTER FUNCTION
// ============================================================================

/**
 * Checks if a product title contains excluded keywords (samples, packs, etc.)
 * @param title - Product title to check
 * @returns Object with exclude boolean and matched keyword
 */
export function hasExcludedKeyword(title: string): { exclude: boolean; keyword?: string } {
  if (!title) return { exclude: false };
  
  const lowerTitle = title.toLowerCase();
  
  for (const keyword of EXCLUDED_TITLE_KEYWORDS) {
    if (lowerTitle.includes(keyword)) {
      return { exclude: true, keyword };
    }
  }
  
  return { exclude: false };
}

// ============================================================================
// MAIN FILTER FUNCTION
// ============================================================================

export interface FilterResult {
  include: boolean;
  reason?: string;
}

/**
 * Determines whether a variant should be included in sync based on weight, diameter, and title.
 * 
 * @param weightGrams - Net weight in grams (null if unknown)
 * @param diameterMm - Filament diameter in mm (null if unknown)
 * @param title - Optional product/variant title to check for excluded keywords
 * @returns FilterResult with include boolean and optional reason for exclusion
 */
export function shouldIncludeVariant(
  weightGrams: number | null | undefined,
  diameterMm: number | null | undefined,
  title?: string
): FilterResult {
  // Check for excluded keywords first (sample, pack, variety, etc.)
  if (title) {
    const keywordCheck = hasExcludedKeyword(title);
    if (keywordCheck.exclude) {
      return {
        include: false,
        reason: `Excluded keyword: "${keywordCheck.keyword}" in title`
      };
    }
  }

  // Check minimum weight (exclude samples)
  if (weightGrams !== null && weightGrams !== undefined && weightGrams > 0 && weightGrams < MIN_WEIGHT_GRAMS) {
    return { 
      include: false, 
      reason: `Sample/coil: ${weightGrams}g < ${MIN_WEIGHT_GRAMS}g minimum` 
    };
  }

  // Check maximum weight (exclude bulk)
  if (weightGrams !== null && weightGrams !== undefined && weightGrams > MAX_WEIGHT_GRAMS) {
    return { 
      include: false, 
      reason: `Bulk spool: ${weightGrams}g > ${MAX_WEIGHT_GRAMS}g maximum` 
    };
  }

  // Check diameter (exclude 2.85mm / 3.0mm)
  if (diameterMm !== null && diameterMm !== undefined) {
    if (diameterMm >= 2.5) {
      return { 
        include: false, 
        reason: `Non-standard diameter: ${diameterMm}mm (only 1.75mm supported)` 
      };
    }
  }

  return { include: true };
}

// ============================================================================
// EXTRACTION HELPERS
// ============================================================================

/**
 * Extracts weight in grams from various text formats.
 * Handles: "1kg", "2.5 kg", "500g", "1000 g", "5lb", etc.
 * 
 * @param text - Text containing weight information
 * @returns Weight in grams or null if not found
 */
export function extractWeightFromText(text: string): number | null {
  if (!text) return null;

  // Handle kilogram formats: "1kg", "2.5 kg", "5KG", "1 kilogram"
  const kgMatch = text.match(/(\d+(?:\.\d+)?)\s*(?:kg|kilogram)/i);
  if (kgMatch) {
    return Math.round(parseFloat(kgMatch[1]) * 1000);
  }

  // Handle gram formats: "500g", "1000 g", "750 grams"
  // Be careful not to match "5kg" as "5" + "g" from "kg"
  const gMatch = text.match(/(\d+(?:\.\d+)?)\s*(?:g(?:ram)?s?)(?!\w)/i);
  if (gMatch) {
    // Make sure we didn't match part of "kg"
    const precedingChar = text[text.indexOf(gMatch[0]) - 1];
    if (precedingChar !== 'k' && precedingChar !== 'K') {
      return Math.round(parseFloat(gMatch[1]));
    }
  }

  // Handle pound formats: "1lb", "2.2 lbs", "5 pounds"
  const lbMatch = text.match(/(\d+(?:\.\d+)?)\s*(?:lb|lbs|pound)/i);
  if (lbMatch) {
    return Math.round(parseFloat(lbMatch[1]) * 453.592);
  }

  return null;
}

/**
 * Extracts diameter in mm from text.
 * Returns 2.85 for non-standard diameters, 1.75 for standard, or null if not found.
 * 
 * @param text - Text containing diameter information
 * @returns Diameter in mm or null if not found
 */
export function extractDiameterFromText(text: string): number | null {
  if (!text) return null;

  // Check for 2.85mm or 3mm variants (should be excluded)
  if (
    text.includes('2.85') ||
    text.includes('2.85mm') ||
    /\b3\.?0?\s*mm\b/i.test(text) ||
    /\b3mm\b/i.test(text)
  ) {
    return 2.85;
  }

  // Check for 1.75mm (standard)
  if (text.includes('1.75')) {
    return 1.75;
  }

  return null;
}

/**
 * Checks if a variant title/option represents a 2.85mm diameter product.
 * 
 * @param text - Variant title, option, or product title
 * @returns true if 2.85mm/3mm diameter detected
 */
export function is285mmDiameter(text: string): boolean {
  if (!text) return false;
  return (
    text.includes('2.85') ||
    /\b3\.?0?\s*mm\b/i.test(text) ||
    /\b3mm\b/i.test(text)
  );
}

/**
 * Checks if a variant represents a bulk spool based on text patterns.
 * 
 * @param text - Variant title or option text
 * @returns true if bulk spool detected
 */
export function isBulkSpool(text: string): boolean {
  if (!text) return false;
  const weight = extractWeightFromText(text);
  if (weight !== null && weight > MAX_WEIGHT_GRAMS) {
    return true;
  }
  
  // Check for bulk keywords
  const lowerText = text.toLowerCase();
  return (
    lowerText.includes('bulk') ||
    lowerText.includes('master spool') ||
    lowerText.includes('refill') ||
    /\b[2-9]\s*kg\b/i.test(text) ||  // 2kg or higher
    /\b10\s*kg\b/i.test(text) ||
    /\b5\s*lb/i.test(text) ||        // 5lb or higher
    /\b10\s*lb/i.test(text)
  );
}

/**
 * Checks if a variant represents a sample or small coil.
 * 
 * @param text - Variant title or option text
 * @returns true if sample/coil detected
 */
export function isSample(text: string): boolean {
  if (!text) return false;
  const weight = extractWeightFromText(text);
  if (weight !== null && weight < MIN_WEIGHT_GRAMS) {
    return true;
  }
  
  // Check for sample keywords
  const lowerText = text.toLowerCase();
  return (
    lowerText.includes('sample') ||
    lowerText.includes('coil') ||
    lowerText.includes('trial') ||
    /\b50g\b/i.test(text) ||
    /\b100g\b/i.test(text) ||
    /\b200g\b/i.test(text)
  );
}

// ============================================================================
// LOGGING HELPER
// ============================================================================

export interface FilterStats {
  included: number;
  excludedLowWeight: number;
  excludedBulk: number;
  excludedDiameter: number;
  excludedKeyword: number;
}

/**
 * Creates a fresh filter stats object for tracking.
 */
export function createFilterStats(): FilterStats {
  return {
    included: 0,
    excludedLowWeight: 0,
    excludedBulk: 0,
    excludedDiameter: 0,
    excludedKeyword: 0,
  };
}

/**
 * Updates filter stats based on a filter result.
 */
export function updateFilterStats(stats: FilterStats, result: FilterResult): void {
  if (result.include) {
    stats.included++;
  } else if (result.reason?.includes('keyword')) {
    stats.excludedKeyword++;
  } else if (result.reason?.includes('Sample') || result.reason?.includes('minimum')) {
    stats.excludedLowWeight++;
  } else if (result.reason?.includes('Bulk') || result.reason?.includes('maximum')) {
    stats.excludedBulk++;
  } else if (result.reason?.includes('diameter')) {
    stats.excludedDiameter++;
  }
}

/**
 * Logs filter stats summary.
 */
export function logFilterStats(brandName: string, stats: FilterStats): void {
  const total = stats.included + stats.excludedLowWeight + stats.excludedBulk + stats.excludedDiameter + stats.excludedKeyword;
  console.log(`[${brandName}] Filtering: ${stats.included}/${total} included`);
  if (stats.excludedKeyword > 0) {
    console.log(`[${brandName}]   - ${stats.excludedKeyword} excluded (sample/pack keywords)`);
  }
  if (stats.excludedLowWeight > 0) {
    console.log(`[${brandName}]   - ${stats.excludedLowWeight} excluded (samples <${MIN_WEIGHT_GRAMS}g)`);
  }
  if (stats.excludedBulk > 0) {
    console.log(`[${brandName}]   - ${stats.excludedBulk} excluded (bulk >${MAX_WEIGHT_GRAMS}g)`);
  }
  if (stats.excludedDiameter > 0) {
    console.log(`[${brandName}]   - ${stats.excludedDiameter} excluded (2.85mm diameter)`);
  }
}
