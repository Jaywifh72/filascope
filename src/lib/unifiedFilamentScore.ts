/**
 * Unified Filament Score Calculation
 * A comprehensive scoring function that considers multiple data points
 * Used consistently across all views (Card, Table, LabReadout)
 */

// Premium brands (verified, well-documented, high quality)
const PREMIUM_BRANDS = [
  'bambu lab', 'prusa', 'polymaker', 'atomic filament', 'protopasta', 
  'fillamentum', 'colorfabb', 'esun', 'overture', 'inland',
  'prusament', 'filaform', 'ninjatek', 'matterhackers'
];

// Mid-tier brands (known, decent documentation)
const MID_TIER_BRANDS = [
  'hatchbox', 'sunlu', 'eryone', 'duramic', 'geeetech', 
  'tecbears', 'amolen', 'iwecolor', 'jayo', 'elegoo',
  'creality', 'flashforge', 'anycubic', 'ziro'
];

// Material ease scores (higher = easier to print)
const MATERIAL_EASE: Record<string, number> = {
  'PLA': 2.5,
  'PLA+': 2.3,
  'PETG': 2.0,
  'TPU': 1.5,
  'ABS': 1.5,
  'ASA': 1.3,
  'PA': 1.0,
  'NYLON': 1.0,
  'PC': 0.8,
  'PP': 1.0,
  'PVA': 1.5,
  'HIPS': 1.8,
  'PCTG': 2.0,
  'PEEK': 0.5,
  'PEI': 0.5,
};

export interface ScoreFactor {
  label: string;
  points: number;
  category: 'base' | 'data' | 'price' | 'brand' | 'features';
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
  // Data completeness fields
  tds_url?: string | null;
  nozzle_temp_min_c?: number | null;
  nozzle_temp_max_c?: number | null;
  bed_temp_min_c?: number | null;
  bed_temp_max_c?: number | null;
  tensile_strength_xy_mpa?: number | null;
  flexural_strength_mpa?: number | null;
  featured_image?: string | null;
  color_hex?: string | null;
  // Price & availability fields
  variant_price?: number | null;
  price_cad?: number | null;
  price_eur?: number | null;
  price_gbp?: number | null;
  price_aud?: number | null;
  product_url?: string | null;
  amazon_link_us?: string | null;
  product_url_ca?: string | null;
  product_url_uk?: string | null;
  product_url_eu?: string | null;
  // Features
  high_speed_capable?: boolean | null;
  finish_type?: string | null;
  carbon_fiber_percentage?: number | null;
  glass_fiber_percentage?: number | null;
}

function getBaseMaterial(material: string | null | undefined): string {
  if (!material) return '';
  return material.toUpperCase().replace(/[\s\-+]+/g, '-').split('-')[0].trim();
}

function getBrandTier(vendor: string | null | undefined): 'premium' | 'mid' | 'unknown' {
  if (!vendor) return 'unknown';
  const normalized = vendor.toLowerCase().trim();
  if (PREMIUM_BRANDS.some(b => normalized.includes(b) || b.includes(normalized))) {
    return 'premium';
  }
  if (MID_TIER_BRANDS.some(b => normalized.includes(b) || b.includes(normalized))) {
    return 'mid';
  }
  return 'unknown';
}

/**
 * Calculate unified filament score
 * Returns null score if insufficient data to compute meaningful score
 */
export function calculateUnifiedScore(filament: FilamentForScoring): UnifiedScoreResult {
  const factors: ScoreFactor[] = [];
  let totalPoints = 0;
  let dataPointCount = 0;

  // ═══════════════════════════════════════════════════════════════
  // BASE SCORE (max 3.0)
  // ═══════════════════════════════════════════════════════════════
  const baseMaterial = getBaseMaterial(filament.material);
  
  if (baseMaterial) {
    const materialEase = MATERIAL_EASE[baseMaterial] ?? 1.5;
    totalPoints += materialEase;
    factors.push({
      label: `${baseMaterial} material`,
      points: materialEase,
      category: 'base',
    });
    dataPointCount++;
    
    // Material defined bonus
    totalPoints += 0.5;
    factors.push({
      label: 'Material specified',
      points: 0.5,
      category: 'base',
    });
  }

  // ═══════════════════════════════════════════════════════════════
  // DATA COMPLETENESS (max 2.5)
  // ═══════════════════════════════════════════════════════════════
  
  // TDS available (+0.5)
  if (filament.tds_url) {
    totalPoints += 0.5;
    factors.push({ label: 'TDS available', points: 0.5, category: 'data' });
    dataPointCount++;
  }
  
  // Temperature specs (+0.5)
  const hasNozzleTemp = filament.nozzle_temp_min_c || filament.nozzle_temp_max_c;
  const hasBedTemp = filament.bed_temp_min_c || filament.bed_temp_max_c;
  if (hasNozzleTemp && hasBedTemp) {
    totalPoints += 0.5;
    factors.push({ label: 'Temp specs complete', points: 0.5, category: 'data' });
    dataPointCount += 2;
  } else if (hasNozzleTemp || hasBedTemp) {
    totalPoints += 0.25;
    factors.push({ label: 'Partial temp specs', points: 0.25, category: 'data' });
    dataPointCount++;
  }
  
  // Mechanical data (+0.5)
  const hasTensile = !!filament.tensile_strength_xy_mpa;
  const hasFlexural = !!filament.flexural_strength_mpa;
  if (hasTensile || hasFlexural) {
    const mechPoints = (hasTensile && hasFlexural) ? 0.5 : 0.3;
    totalPoints += mechPoints;
    factors.push({ label: 'Mechanical data', points: mechPoints, category: 'data' });
    dataPointCount += (hasTensile ? 1 : 0) + (hasFlexural ? 1 : 0);
  }
  
  // Has product image (+0.5)
  if (filament.featured_image) {
    totalPoints += 0.5;
    factors.push({ label: 'Product image', points: 0.5, category: 'data' });
    dataPointCount++;
  }
  
  // Has color hex defined (+0.5)
  if (filament.color_hex) {
    totalPoints += 0.5;
    factors.push({ label: 'Color specified', points: 0.5, category: 'data' });
    dataPointCount++;
  }

  // ═══════════════════════════════════════════════════════════════
  // PRICE & AVAILABILITY (max 2.0)
  // ═══════════════════════════════════════════════════════════════
  
  // Has pricing data (+0.5)
  if (filament.variant_price) {
    totalPoints += 0.5;
    factors.push({ label: 'Pricing available', points: 0.5, category: 'price' });
    dataPointCount++;
  }
  
  // Regional pricing (+0.1 each, max 0.4)
  let regionalCount = 0;
  if (filament.price_cad) regionalCount++;
  if (filament.price_eur) regionalCount++;
  if (filament.price_gbp) regionalCount++;
  if (filament.price_aud) regionalCount++;
  
  if (regionalCount > 0) {
    const regionalPoints = Math.min(regionalCount * 0.1, 0.4);
    totalPoints += regionalPoints;
    factors.push({ 
      label: `${regionalCount} regional prices`, 
      points: regionalPoints, 
      category: 'price' 
    });
    dataPointCount += regionalCount;
  }
  
  // Multiple purchase options (+0.3)
  const hasStoreUrl = !!filament.product_url;
  const hasAmazon = !!filament.amazon_link_us;
  const hasRegionalUrls = !!(filament.product_url_ca || filament.product_url_uk || filament.product_url_eu);
  
  if ((hasStoreUrl && hasAmazon) || (hasStoreUrl && hasRegionalUrls)) {
    totalPoints += 0.3;
    factors.push({ label: 'Multiple retailers', points: 0.3, category: 'price' });
    dataPointCount++;
  } else if (hasStoreUrl || hasAmazon) {
    totalPoints += 0.15;
    factors.push({ label: 'Purchase link', points: 0.15, category: 'price' });
    dataPointCount++;
  }

  // ═══════════════════════════════════════════════════════════════
  // BRAND & QUALITY (max 1.5)
  // ═══════════════════════════════════════════════════════════════
  const brandTier = getBrandTier(filament.vendor);
  
  if (brandTier === 'premium') {
    totalPoints += 1.0;
    factors.push({ label: `${filament.vendor} (Premium)`, points: 1.0, category: 'brand' });
    dataPointCount++;
  } else if (brandTier === 'mid') {
    totalPoints += 0.5;
    factors.push({ label: `${filament.vendor}`, points: 0.5, category: 'brand' });
    dataPointCount++;
  } else if (filament.vendor) {
    // Unknown brand still gets minimal points for having vendor info
    totalPoints += 0.1;
    factors.push({ label: `${filament.vendor}`, points: 0.1, category: 'brand' });
    dataPointCount++;
  }

  // ═══════════════════════════════════════════════════════════════
  // FEATURES (max 1.0)
  // ═══════════════════════════════════════════════════════════════
  
  // High-speed capable (+0.4)
  if (filament.high_speed_capable) {
    totalPoints += 0.4;
    factors.push({ label: 'High-speed capable', points: 0.4, category: 'features' });
    dataPointCount++;
  }
  
  // Specialty finish (+0.3)
  const finishType = filament.finish_type?.toLowerCase() || '';
  if (finishType.includes('silk') || finishType.includes('matte') || 
      finishType.includes('sparkle') || finishType.includes('galaxy')) {
    totalPoints += 0.3;
    factors.push({ label: 'Specialty finish', points: 0.3, category: 'features' });
    dataPointCount++;
  }
  
  // Reinforced (+0.3)
  const hasCF = filament.carbon_fiber_percentage && filament.carbon_fiber_percentage > 0;
  const hasGF = filament.glass_fiber_percentage && filament.glass_fiber_percentage > 0;
  if (hasCF || hasGF) {
    totalPoints += 0.3;
    factors.push({ label: hasCF ? 'Carbon reinforced' : 'Glass reinforced', points: 0.3, category: 'features' });
    dataPointCount++;
  }

  // ═══════════════════════════════════════════════════════════════
  // DETERMINE RESULT
  // ═══════════════════════════════════════════════════════════════
  
  // Minimum data requirement: must have material OR (price + image)
  const hasMinimumData = !!baseMaterial || (filament.variant_price && filament.featured_image);
  
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
  
  // Cap score at 10
  const finalScore = Math.min(10, Math.max(1, Math.round(totalPoints * 10) / 10));
  
  // Determine confidence based on data points
  let confidence: 'high' | 'medium' | 'low';
  if (dataPointCount >= 10) {
    confidence = 'high';
  } else if (dataPointCount >= 5) {
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
  
  if (score >= 8.5) {
    return { label: 'Excellent', colorClass: 'text-emerald-400' };
  }
  if (score >= 7.0) {
    return { label: 'Great', colorClass: 'text-cyan-400' };
  }
  if (score >= 5.5) {
    return { label: 'Good', colorClass: 'text-primary' };
  }
  if (score >= 4.0) {
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
