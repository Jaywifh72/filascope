/**
 * Unified Filament Score Calculation (FilaScore)
 * A comprehensive scoring function using weighted components:
 * - Data completeness (25%): % of key spec fields filled
 * - Price availability (20%): regional vs converted pricing
 * - Color variety (15%): number of color variants
 * - TDS data (15%): technical data sheet availability
 * - Brand verification (15%): verified/premium brand status
 * - Regional coverage (10%): available in multiple regions
 * 
 * Used consistently across all views (Card, Table, LabReadout)
 */

// Premium/verified brands
const VERIFIED_BRANDS = [
  'bambu lab', 'prusa', 'polymaker', 'atomic filament', 'protopasta', 
  'fillamentum', 'colorfabb', 'esun', 'overture', 'inland',
  'prusament', 'filaform', 'ninjatek', 'matterhackers', 'hatchbox'
];

// Mid-tier brands (known, partial verification)
const MID_TIER_BRANDS = [
  'sunlu', 'eryone', 'duramic', 'geeetech', 
  'tecbears', 'amolen', 'iwecolor', 'jayo', 'elegoo',
  'creality', 'flashforge', 'anycubic', 'ziro'
];

// Weight constants (must sum to 10.0 for 0-10 scale)
const WEIGHTS = {
  DATA_COMPLETENESS: 2.5,  // 25%
  PRICE_AVAILABILITY: 2.0, // 20%
  COLOR_VARIETY: 1.5,      // 15%
  TDS_DATA: 1.5,           // 15%
  BRAND_VERIFICATION: 1.5, // 15%
  REGIONAL_COVERAGE: 1.0,  // 10%
} as const;

export interface ScoreFactor {
  label: string;
  points: number;
  maxPoints: number;
  category: 'data' | 'price' | 'color' | 'tds' | 'brand' | 'regional';
}

export interface UnifiedScoreResult {
  score: number | null;
  factors: ScoreFactor[];
  confidence: 'high' | 'medium' | 'low' | 'insufficient';
  dataPointCount: number;
  label: string;
  colorClass: string;
}

// Minimal interface for scoring - works with any filament-like object
export interface FilamentForScoring {
  id?: string;
  material?: string | null;
  vendor?: string | null;
  // Data completeness fields (6 key specs)
  nozzle_temp_min_c?: number | null;
  nozzle_temp_max_c?: number | null;
  bed_temp_min_c?: number | null;
  bed_temp_max_c?: number | null;
  diameter_mm?: number | null;
  net_weight_g?: number | null;
  density_g_cm3?: number | null;
  // TDS data
  tds_url?: string | null;
  tensile_strength_xy_mpa?: number | null;
  flexural_strength_mpa?: number | null;
  elongation_break_xy_percent?: number | null;
  // Price & availability fields
  variant_price?: number | null;
  price_cad?: number | null;
  price_eur?: number | null;
  price_gbp?: number | null;
  price_aud?: number | null;
  price_jpy?: number | null;
  product_url?: string | null;
  amazon_link_us?: string | null;
  product_url_ca?: string | null;
  product_url_uk?: string | null;
  product_url_eu?: string | null;
  product_url_au?: string | null;
  product_url_jp?: string | null;
  // Color/variety
  color_hex?: string | null;
  featured_image?: string | null;
  // For grouped products - variant count
  variant_count?: number | null;
  // Additional fields
  high_speed_capable?: boolean | null;
  finish_type?: string | null;
  carbon_fiber_percentage?: number | null;
  glass_fiber_percentage?: number | null;
}

function getBrandVerificationStatus(vendor: string | null | undefined): 'verified' | 'partial' | 'unknown' {
  if (!vendor) return 'unknown';
  const normalized = vendor.toLowerCase().trim();
  if (VERIFIED_BRANDS.some(b => normalized.includes(b) || b.includes(normalized))) {
    return 'verified';
  }
  if (MID_TIER_BRANDS.some(b => normalized.includes(b) || b.includes(normalized))) {
    return 'partial';
  }
  return 'unknown';
}

/**
 * Calculate unified filament score using weighted components
 * Returns null score if insufficient data to compute meaningful score
 */
export function calculateUnifiedScore(
  filament: FilamentForScoring,
  colorVariantCount?: number // Optional: pass variant count for grouped products
): UnifiedScoreResult {
  const factors: ScoreFactor[] = [];
  let totalPoints = 0;
  let dataPointCount = 0;

  // ═══════════════════════════════════════════════════════════════
  // 1. DATA COMPLETENESS (25% = 2.5 points max)
  // Key specs: nozzle temp, bed temp, diameter, weight, material type, density
  // ═══════════════════════════════════════════════════════════════
  const keySpecs = [
    { name: 'Nozzle temp', filled: !!(filament.nozzle_temp_min_c || filament.nozzle_temp_max_c) },
    { name: 'Bed temp', filled: !!(filament.bed_temp_min_c || filament.bed_temp_max_c) },
    { name: 'Diameter', filled: !!filament.diameter_mm },
    { name: 'Weight', filled: !!filament.net_weight_g },
    { name: 'Material', filled: !!filament.material },
    { name: 'Density', filled: !!filament.density_g_cm3 },
  ];
  
  const filledSpecs = keySpecs.filter(s => s.filled).length;
  const completenessRatio = filledSpecs / keySpecs.length;
  const completenessPoints = completenessRatio * WEIGHTS.DATA_COMPLETENESS;
  
  totalPoints += completenessPoints;
  dataPointCount += filledSpecs;
  factors.push({
    label: `${filledSpecs}/${keySpecs.length} specs filled`,
    points: Math.round(completenessPoints * 100) / 100,
    maxPoints: WEIGHTS.DATA_COMPLETENESS,
    category: 'data',
  });

  // ═══════════════════════════════════════════════════════════════
  // 2. PRICE AVAILABILITY (20% = 2.0 points max)
  // Full points for regional price, partial for converted, zero for none
  // ═══════════════════════════════════════════════════════════════
  const hasRegionalPrice = !!(
    filament.price_cad || filament.price_eur || 
    filament.price_gbp || filament.price_aud || filament.price_jpy
  );
  const hasBasePrice = !!filament.variant_price;
  
  let pricePoints = 0;
  let priceLabel = 'No pricing';
  
  if (hasRegionalPrice) {
    pricePoints = WEIGHTS.PRICE_AVAILABILITY; // Full points
    priceLabel = 'Regional pricing';
    dataPointCount += 2;
  } else if (hasBasePrice) {
    pricePoints = WEIGHTS.PRICE_AVAILABILITY * 0.6; // 60% for converted only
    priceLabel = 'Base pricing (converted)';
    dataPointCount += 1;
  }
  
  totalPoints += pricePoints;
  factors.push({
    label: priceLabel,
    points: Math.round(pricePoints * 100) / 100,
    maxPoints: WEIGHTS.PRICE_AVAILABILITY,
    category: 'price',
  });

  // ═══════════════════════════════════════════════════════════════
  // 3. COLOR VARIETY (15% = 1.5 points max)
  // More color variants = higher score, capped at 10+ variants for full points
  // ═══════════════════════════════════════════════════════════════
  const variantCount = colorVariantCount ?? filament.variant_count ?? 1;
  const hasColorInfo = !!filament.color_hex;
  
  // Scale: 1 variant = 0.15, 5 variants = 0.75, 10+ variants = 1.5
  let colorPoints = 0;
  if (hasColorInfo || variantCount > 0) {
    const colorRatio = Math.min(variantCount / 10, 1); // Cap at 10 variants
    colorPoints = colorRatio * WEIGHTS.COLOR_VARIETY;
    dataPointCount += 1;
  }
  
  totalPoints += colorPoints;
  factors.push({
    label: variantCount > 1 ? `${variantCount} color variants` : (hasColorInfo ? '1 color' : 'No color data'),
    points: Math.round(colorPoints * 100) / 100,
    maxPoints: WEIGHTS.COLOR_VARIETY,
    category: 'color',
  });

  // ═══════════════════════════════════════════════════════════════
  // 4. TDS DATA (15% = 1.5 points max)
  // Technical data sheet and mechanical properties
  // ═══════════════════════════════════════════════════════════════
  const hasTDS = !!filament.tds_url;
  const hasTensile = !!filament.tensile_strength_xy_mpa;
  const hasFlexural = !!filament.flexural_strength_mpa;
  const hasElongation = !!filament.elongation_break_xy_percent;
  
  let tdsPoints = 0;
  let tdsLabel = 'No TDS data';
  
  if (hasTDS) {
    tdsPoints = WEIGHTS.TDS_DATA * 0.6; // TDS URL worth 60%
    tdsLabel = 'TDS available';
    dataPointCount += 1;
  }
  
  // Mechanical properties add remaining 40%
  const mechCount = [hasTensile, hasFlexural, hasElongation].filter(Boolean).length;
  if (mechCount > 0) {
    const mechRatio = mechCount / 3;
    tdsPoints += mechRatio * (WEIGHTS.TDS_DATA * 0.4);
    tdsLabel = hasTDS ? 'TDS + mechanical data' : `${mechCount} mechanical specs`;
    dataPointCount += mechCount;
  }
  
  totalPoints += tdsPoints;
  factors.push({
    label: tdsLabel,
    points: Math.round(tdsPoints * 100) / 100,
    maxPoints: WEIGHTS.TDS_DATA,
    category: 'tds',
  });

  // ═══════════════════════════════════════════════════════════════
  // 5. BRAND VERIFICATION (15% = 1.5 points max)
  // Verified brands get full points, partial verification = 50%
  // ═══════════════════════════════════════════════════════════════
  const brandStatus = getBrandVerificationStatus(filament.vendor);
  
  let brandPoints = 0;
  let brandLabel = 'Unknown brand';
  
  if (brandStatus === 'verified') {
    brandPoints = WEIGHTS.BRAND_VERIFICATION;
    brandLabel = `${filament.vendor} (Verified)`;
    dataPointCount += 1;
  } else if (brandStatus === 'partial') {
    brandPoints = WEIGHTS.BRAND_VERIFICATION * 0.5;
    brandLabel = `${filament.vendor}`;
    dataPointCount += 1;
  } else if (filament.vendor) {
    brandPoints = WEIGHTS.BRAND_VERIFICATION * 0.1;
    brandLabel = filament.vendor;
    dataPointCount += 1;
  }
  
  totalPoints += brandPoints;
  factors.push({
    label: brandLabel,
    points: Math.round(brandPoints * 100) / 100,
    maxPoints: WEIGHTS.BRAND_VERIFICATION,
    category: 'brand',
  });

  // ═══════════════════════════════════════════════════════════════
  // 6. REGIONAL COVERAGE (10% = 1.0 points max)
  // Available in more regions = higher score
  // ═══════════════════════════════════════════════════════════════
  const regionUrls = [
    filament.product_url,
    filament.product_url_ca,
    filament.product_url_uk,
    filament.product_url_eu,
    filament.product_url_au,
    filament.product_url_jp,
    filament.amazon_link_us,
  ];
  
  const regionCount = regionUrls.filter(Boolean).length;
  const regionalRatio = Math.min(regionCount / 5, 1); // Cap at 5 regions for full points
  const regionalPoints = regionalRatio * WEIGHTS.REGIONAL_COVERAGE;
  
  totalPoints += regionalPoints;
  if (regionCount > 0) dataPointCount += 1;
  
  factors.push({
    label: regionCount > 0 ? `${regionCount} region(s)` : 'No regional links',
    points: Math.round(regionalPoints * 100) / 100,
    maxPoints: WEIGHTS.REGIONAL_COVERAGE,
    category: 'regional',
  });

  // ═══════════════════════════════════════════════════════════════
  // DETERMINE RESULT
  // ═══════════════════════════════════════════════════════════════
  
  // Minimum data requirement: must have material OR price
  const hasMinimumData = !!filament.material || !!filament.variant_price;
  
  if (!hasMinimumData || dataPointCount < 2) {
    return {
      score: null,
      factors: [],
      confidence: 'insufficient',
      dataPointCount,
      label: 'Unrated',
      colorClass: 'text-muted-foreground',
    };
  }
  
  // Round to one decimal place, clamp to 0-10
  const finalScore = Math.min(10, Math.max(0, Math.round(totalPoints * 10) / 10));
  
  // Determine confidence based on data points
  let confidence: 'high' | 'medium' | 'low';
  if (dataPointCount >= 8) {
    confidence = 'high';
  } else if (dataPointCount >= 4) {
    confidence = 'medium';
  } else {
    confidence = 'low';
  }
  
  // Get label and color
  const { label, colorClass } = getScoreLabel(finalScore);
  
  return {
    score: finalScore,
    factors,
    confidence,
    dataPointCount,
    label,
    colorClass,
  };
}

/**
 * Get human-readable label and color for a score
 */
export function getScoreLabel(score: number | null): { label: string; colorClass: string } {
  if (score === null) {
    return { label: 'Unrated', colorClass: 'text-muted-foreground' };
  }
  
  if (score >= 8.0) {
    return { label: 'Excellent', colorClass: 'text-emerald-400' };
  }
  if (score >= 6.5) {
    return { label: 'Great', colorClass: 'text-cyan-400' };
  }
  if (score >= 5.0) {
    return { label: 'Good', colorClass: 'text-primary' };
  }
  if (score >= 3.5) {
    return { label: 'Average', colorClass: 'text-orange-400' };
  }
  return { label: 'Limited', colorClass: 'text-red-400' };
}

/**
 * Get color class for score number display
 */
export function getScoreNumberColor(score: number | null): string {
  if (score === null) return 'text-muted-foreground';
  if (score >= 8) return 'text-emerald-400';
  if (score >= 6) return 'text-primary';
  return 'text-orange-400';
}

/**
 * Score explanation text for tooltip
 */
export const SCORE_EXPLANATION = 
  "FilaScore: Based on data completeness, pricing availability, color variety, TDS data, brand verification, and regional coverage.";
