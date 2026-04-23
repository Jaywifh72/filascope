/**
 * SCORING CALCULATOR v2
 * 
 * Calculates filascope_score and other scoring indexes from filament data.
 * Uses multiple factors to determine quality, value, and printability.
 */

// ============================================================================
// SCORING INTERFACES
// ============================================================================

export interface ScoringResult {
  field: string;
  value: number;
  confidence: number;
  factors: ScoringFactor[];
  source: string;
}

export interface ScoringFactor {
  name: string;
  value: number;
  weight: number;
  contribution: number;
}

// ============================================================================
// SCORING CONFIGURATION
// ============================================================================

/**
 * Scoring weights for different factors
 */
export const SCORING_WEIGHTS = {
  // Price factors (lower is better)
  price: {
    weight: 0.25,
    optimalRange: { min: 15, max: 30 }, // USD per kg
    penalty: 0.1 // per $1 outside optimal range
  },
  
  // Temperature factors (easier printing is better)
  temperature: {
    weight: 0.20,
    optimalNozzle: { min: 190, max: 230 },
    optimalBed: { min: 50, max: 80 },
    penalty: 0.05 // per degree outside optimal
  },
  
  // Mechanical properties (higher is better)
  mechanical: {
    weight: 0.15,
    tensileStrength: { optimal: 50, max: 100 }, // MPa
    impactStrength: { optimal: 5, max: 20 } // kJ/m²
  },
  
  // Printability factors
  printability: {
    weight: 0.20,
    speed: { optimal: 60, max: 300 }, // mm/s
    retraction: { optimal: 6, max: 10 } // mm
  },
  
  // Data completeness
  completeness: {
    weight: 0.10,
    fields: ['variant_price', 'featured_image', 'nozzle_temp_min_c', 'bed_temp_min_c', 'density_g_cm3']
  },
  
  // Brand reputation (placeholder)
  brandReputation: {
    weight: 0.10,
    scores: {
      'Polymaker': 95,
      'Bambu Lab': 95,
      'eSun': 90,
      'Prusament': 95,
      'Atomic Filament': 90,
      '3D-Fuel': 85,
      'Hatchbox': 80,
      'Overture': 80,
      'Sunlu': 75,
      'Creality': 70,
      'Anycubic': 70,
      'Elegoo': 70,
      'default': 60
    }
  }
};

// ============================================================================
// SCORING CALCULATOR
// ============================================================================

/**
 * Calculate filascope_score for a filament
 */
export function calculateFilascopeScore(filament: any): ScoringResult {
  const factors: ScoringFactor[] = [];
  let totalScore = 0;
  let totalWeight = 0;
  
  // 1. Price score (25% weight)
  const priceScore = calculatePriceScore(filament);
  if (priceScore !== null) {
    factors.push({
      name: 'price',
      value: priceScore,
      weight: SCORING_WEIGHTS.price.weight,
      contribution: priceScore * SCORING_WEIGHTS.price.weight
    });
    totalScore += priceScore * SCORING_WEIGHTS.price.weight;
    totalWeight += SCORING_WEIGHTS.price.weight;
  }
  
  // 2. Temperature score (20% weight)
  const tempScore = calculateTemperatureScore(filament);
  if (tempScore !== null) {
    factors.push({
      name: 'temperature',
      value: tempScore,
      weight: SCORING_WEIGHTS.temperature.weight,
      contribution: tempScore * SCORING_WEIGHTS.temperature.weight
    });
    totalScore += tempScore * SCORING_WEIGHTS.temperature.weight;
    totalWeight += SCORING_WEIGHTS.temperature.weight;
  }
  
  // 3. Mechanical properties score (15% weight)
  const mechScore = calculateMechanicalScore(filament);
  if (mechScore !== null) {
    factors.push({
      name: 'mechanical',
      value: mechScore,
      weight: SCORING_WEIGHTS.mechanical.weight,
      contribution: mechScore * SCORING_WEIGHTS.mechanical.weight
    });
    totalScore += mechScore * SCORING_WEIGHTS.mechanical.weight;
    totalWeight += SCORING_WEIGHTS.mechanical.weight;
  }
  
  // 4. Printability score (20% weight)
  const printScore = calculatePrintabilityScore(filament);
  if (printScore !== null) {
    factors.push({
      name: 'printability',
      value: printScore,
      weight: SCORING_WEIGHTS.printability.weight,
      contribution: printScore * SCORING_WEIGHTS.printability.weight
    });
    totalScore += printScore * SCORING_WEIGHTS.printability.weight;
    totalWeight += SCORING_WEIGHTS.printability.weight;
  }
  
  // 5. Data completeness score (10% weight)
  const completenessScore = calculateCompletenessScore(filament);
  factors.push({
    name: 'completeness',
    value: completenessScore,
    weight: SCORING_WEIGHTS.completeness.weight,
    contribution: completenessScore * SCORING_WEIGHTS.completeness.weight
  });
  totalScore += completenessScore * SCORING_WEIGHTS.completeness.weight;
  totalWeight += SCORING_WEIGHTS.completeness.weight;
  
  // 6. Brand reputation score (10% weight)
  const brandScore = calculateBrandReputationScore(filament);
  factors.push({
    name: 'brand_reputation',
    value: brandScore,
    weight: SCORING_WEIGHTS.brandReputation.weight,
    contribution: brandScore * SCORING_WEIGHTS.brandReputation.weight
  });
  totalScore += brandScore * SCORING_WEIGHTS.brandReputation.weight;
  totalWeight += SCORING_WEIGHTS.brandReputation.weight;
  
  // Calculate final score
  const finalScore = totalWeight > 0 ? Math.round(totalScore / totalWeight) : 0;
  
  return {
    field: 'filascope_score',
    value: finalScore,
    confidence: factors.length > 0 ? Math.min(0.9, factors.length * 0.15) : 0.1,
    factors,
    source: 'calculated'
  };
}

/**
 * Calculate price score (0-100)
 */
function calculatePriceScore(filament: any): number | null {
  const price = filament.variant_price;
  if (!price || price <= 0) return null;
  
  const { optimalRange, penalty } = SCORING_WEIGHTS.price;
  
  // Calculate score based on distance from optimal range
  let score = 100;
  
  if (price < optimalRange.min) {
    // Too cheap - might be low quality
    const distance = optimalRange.min - price;
    score -= distance * penalty * 10;
  } else if (price > optimalRange.max) {
    // Too expensive
    const distance = price - optimalRange.max;
    score -= distance * penalty * 10;
  }
  
  return Math.max(0, Math.min(100, score));
}

/**
 * Calculate temperature score (0-100)
 */
function calculateTemperatureScore(filament: any): number | null {
  const nozzleMin = filament.nozzle_temp_min_c;
  const nozzleMax = filament.nozzle_temp_max_c;
  const bedMin = filament.bed_temp_min_c;
  const bedMax = filament.bed_temp_max_c;
  
  if (!nozzleMin && !nozzleMax && !bedMin && !bedMax) return null;
  
  const { optimalNozzle, optimalBed, penalty } = SCORING_WEIGHTS.temperature;
  
  let score = 100;
  let factors = 0;
  
  // Nozzle temperature score
  if (nozzleMin && nozzleMax) {
    const nozzleMid = (nozzleMin + nozzleMax) / 2;
    const optimalNozzleMid = (optimalNozzle.min + optimalNozzle.max) / 2;
    const distance = Math.abs(nozzleMid - optimalNozzleMid);
    score -= distance * penalty;
    factors++;
  }
  
  // Bed temperature score
  if (bedMin && bedMax) {
    const bedMid = (bedMin + bedMax) / 2;
    const optimalBedMid = (optimalBed.min + optimalBed.max) / 2;
    const distance = Math.abs(bedMid - optimalBedMid);
    score -= distance * penalty;
    factors++;
  }
  
  return factors > 0 ? Math.max(0, Math.min(100, score)) : null;
}

/**
 * Calculate mechanical properties score (0-100)
 */
function calculateMechanicalScore(filament: any): number | null {
  const tensile = filament.tensile_strength_xy_mpa;
  const impact = filament.impact_strength_kj_m2;
  
  if (!tensile && !impact) return null;
  
  const { tensileStrength, impactStrength } = SCORING_WEIGHTS.mechanical;
  
  let score = 0;
  let factors = 0;
  
  // Tensile strength score
  if (tensile) {
    const tensileScore = Math.min(100, (tensile / tensileStrength.optimal) * 100);
    score += tensileScore;
    factors++;
  }
  
  // Impact strength score
  if (impact) {
    const impactScore = Math.min(100, (impact / impactStrength.optimal) * 100);
    score += impactScore;
    factors++;
  }
  
  return factors > 0 ? Math.round(score / factors) : null;
}

/**
 * Calculate printability score (0-100)
 */
function calculatePrintabilityScore(filament: any): number | null {
  const speed = filament.print_speed_max_mms;
  const retraction = filament.retraction_length_mm;
  
  if (!speed && !retraction) return null;
  
  const { speed: speedConfig, retraction: retractionConfig } = SCORING_WEIGHTS.printability;
  
  let score = 100;
  let factors = 0;
  
  // Speed score (higher is better, up to optimal)
  if (speed) {
    const speedScore = Math.min(100, (speed / speedConfig.optimal) * 100);
    score = Math.min(score, speedScore);
    factors++;
  }
  
  // Retraction score (lower is better)
  if (retraction) {
    const retractionScore = Math.max(0, 100 - ((retraction - retractionConfig.optimal) * 10));
    score = Math.min(score, retractionScore);
    factors++;
  }
  
  return factors > 0 ? Math.max(0, Math.min(100, score)) : null;
}

/**
 * Calculate data completeness score (0-100)
 */
function calculateCompletenessScore(filament: any): number {
  const { fields } = SCORING_WEIGHTS.completeness;
  
  let populated = 0;
  for (const field of fields) {
    if (filament[field] !== null && filament[field] !== undefined && filament[field] !== '') {
      populated++;
    }
  }
  
  return Math.round((populated / fields.length) * 100);
}

/**
 * Calculate brand reputation score (0-100)
 */
function calculateBrandReputationScore(filament: any): number {
  const brand = filament.vendor || 'default';
  const { scores } = SCORING_WEIGHTS.brandReputation;
  
  return scores[brand as keyof typeof scores] || scores.default;
}

/**
 * Calculate ease_of_printing_score
 */
export function calculateEaseOfPrintingScore(filament: any): number | null {
  const nozzleMin = filament.nozzle_temp_min_c;
  const nozzleMax = filament.nozzle_temp_max_c;
  const bedMin = filament.bed_temp_min_c;
  const bedMax = filament.bed_temp_max_c;
  const speed = filament.print_speed_max_mms;
  const retraction = filament.retraction_length_mm;
  
  if (!nozzleMin && !nozzleMax && !bedMin && !bedMax && !speed && !retraction) {
    return null;
  }
  
  let score = 100;
  let factors = 0;
  
  // Nozzle temperature ease (lower is easier)
  if (nozzleMin && nozzleMax) {
    const nozzleMid = (nozzleMin + nozzleMax) / 2;
    if (nozzleMid > 250) score -= 20;
    else if (nozzleMid > 230) score -= 10;
    factors++;
  }
  
  // Bed temperature ease (lower is easier)
  if (bedMin && bedMax) {
    const bedMid = (bedMin + bedMax) / 2;
    if (bedMid > 100) score -= 15;
    else if (bedMid > 80) score -= 5;
    factors++;
  }
  
  // Speed ease (higher is easier)
  if (speed) {
    if (speed >= 150) score += 10;
    else if (speed >= 100) score += 5;
    else if (speed < 50) score -= 10;
    factors++;
  }
  
  // Retraction ease (lower is easier)
  if (retraction) {
    if (retraction <= 4) score += 10;
    else if (retraction <= 6) score += 5;
    else if (retraction > 8) score -= 10;
    factors++;
  }
  
  return factors > 0 ? Math.max(0, Math.min(100, score)) : null;
}

/**
 * Calculate dimensional_accuracy_score
 */
export function calculateDimensionalAccuracyScore(filament: any): number | null {
  const diameter = filament.diameter_nominal_mm;
  const density = filament.density_g_cm3;
  
  if (!diameter && !density) return null;
  
  let score = 100;
  let factors = 0;
  
  // Diameter accuracy (1.75mm is standard)
  if (diameter) {
    const distance = Math.abs(diameter - 1.75);
    if (distance <= 0.02) score += 10;
    else if (distance <= 0.05) score += 5;
    else if (distance > 0.1) score -= 10;
    factors++;
  }
  
  // Density accuracy (should be within expected range for material)
  if (density) {
    // Typical PLA density: 1.24 g/cm³
    // Typical PETG density: 1.27 g/cm³
    // Typical ABS density: 1.04 g/cm³
    const material = (filament.material || '').toLowerCase();
    let expectedDensity = 1.24; // Default PLA
    
    if (material.includes('petg')) expectedDensity = 1.27;
    else if (material.includes('abs')) expectedDensity = 1.04;
    else if (material.includes('tpu')) expectedDensity = 1.2;
    
    const distance = Math.abs(density - expectedDensity);
    if (distance <= 0.02) score += 10;
    else if (distance <= 0.05) score += 5;
    else if (distance > 0.1) score -= 10;
    factors++;
  }
  
  return factors > 0 ? Math.max(0, Math.min(100, score)) : null;
}

/**
 * Calculate printability_index
 */
export function calculatePrintabilityIndex(filament: any): number | null {
  const easeScore = calculateEaseOfPrintingScore(filament);
  const accuracyScore = calculateDimensionalAccuracyScore(filament);
  
  if (!easeScore && !accuracyScore) return null;
  
  let totalScore = 0;
  let totalWeight = 0;
  
  if (easeScore !== null) {
    totalScore += easeScore * 0.7; // 70% weight for ease
    totalWeight += 0.7;
  }
  
  if (accuracyScore !== null) {
    totalScore += accuracyScore * 0.3; // 30% weight for accuracy
    totalWeight += 0.3;
  }
  
  return totalWeight > 0 ? Math.round(totalScore / totalWeight) : null;
}

/**
 * Calculate value_score
 */
export function calculateValueScore(filament: any): number | null {
  const price = filament.variant_price;
  const qualityScore = filament.filascope_score;
  
  if (!price || price <= 0 || !qualityScore) return null;
  
  // Value = Quality / Price (normalized)
  // Lower price = higher value
  // Higher quality = higher value
  
  const priceNormalized = Math.max(0, 100 - ((price - 20) * 2)); // $20 is baseline
  const qualityNormalized = qualityScore;
  
  return Math.round((priceNormalized * 0.4 + qualityNormalized * 0.6));
}

/**
 * Calculate all scoring fields for a filament
 */
export function calculateAllScores(filament: any): ScoringResult[] {
  const results: ScoringResult[] = [];
  
  // Calculate filascope_score
  const filascopeScore = calculateFilascopeScore(filament);
  results.push(filascopeScore);
  
  // Calculate ease_of_printing_score
  const easeScore = calculateEaseOfPrintingScore(filament);
  if (easeScore !== null) {
    results.push({
      field: 'ease_of_printing_score',
      value: easeScore,
      confidence: 0.8,
      factors: [],
      source: 'calculated'
    });
  }
  
  // Calculate dimensional_accuracy_score
  const accuracyScore = calculateDimensionalAccuracyScore(filament);
  if (accuracyScore !== null) {
    results.push({
      field: 'dimensional_accuracy_score',
      value: accuracyScore,
      confidence: 0.7,
      factors: [],
      source: 'calculated'
    });
  }
  
  // Calculate printability_index
  const printabilityIndex = calculatePrintabilityIndex(filament);
  if (printabilityIndex !== null) {
    results.push({
      field: 'printability_index',
      value: printabilityIndex,
      confidence: 0.8,
      factors: [],
      source: 'calculated'
    });
  }
  
  // Calculate value_score
  const valueScore = calculateValueScore(filament);
  if (valueScore !== null) {
    results.push({
      field: 'value_score',
      value: valueScore,
      confidence: 0.7,
      factors: [],
      source: 'calculated'
    });
  }
  
  // Calculate strength_index
  const tensile = filament.tensile_strength_xy_mpa;
  const impact = filament.impact_strength_kj_m2;
  if (tensile || impact) {
    const strengthIndex = Math.round(((tensile || 0) * 0.7 + (impact || 0) * 0.3) * 2);
    results.push({
      field: 'strength_index',
      value: Math.min(100, strengthIndex),
      confidence: 0.7,
      factors: [],
      source: 'calculated'
    });
  }
  
  return results;
}

/**
 * Generate scoring report
 */
export function generateScoringReport(
  filaments: any[],
  scores: Map<string, ScoringResult[]>
): {
  total_filaments: number;
  filaments_with_scores: number;
  average_scores: Record<string, number>;
  top_filaments: Array<{ title: string; score: number }>;
  bottom_filaments: Array<{ title: string; score: number }>;
} {
  const filamentsWithScores = filaments.filter(f => {
    const scoresForFilament = scores.get(f.id) || [];
    return scoresForFilament.some(s => s.field === 'filascope_score');
  });
  
  // Calculate average scores
  const averageScores: Record<string, { sum: number; count: number }> = {};
  
  for (const [filamentId, scoringResults] of scores) {
    for (const result of scoringResults) {
      if (!averageScores[result.field]) {
        averageScores[result.field] = { sum: 0, count: 0 };
      }
      averageScores[result.field].sum += result.value;
      averageScores[result.field].count++;
    }
  }
  
  const averages: Record<string, number> = {};
  for (const [field, { sum, count }] of Object.entries(averageScores)) {
    averages[field] = Math.round((sum / count) * 10) / 10;
  }
  
  // Find top and bottom filaments
  const filamentsWithScoresList = filaments
    .filter(f => f.filascope_score)
    .map(f => ({
      title: f.product_title || 'Unknown',
      score: f.filascope_score
    }))
    .sort((a, b) => b.score - a.score);
  
  const topFilaments = filamentsWithScoresList.slice(0, 10);
  const bottomFilaments = filamentsWithScoresList.slice(-10).reverse();
  
  return {
    total_filaments: filaments.length,
    filaments_with_scores: filamentsWithScores.length,
    average_scores: averages,
    top_filaments: topFilaments,
    bottom_filaments: bottomFilaments
  };
}

console.log(`✅ Scoring Calculator loaded`);
console.log(`   Calculates 6 scoring fields`);
console.log(`   filascope_score: 6 factors (price, temp, mechanical, printability, completeness, brand)`);
console.log(`   ease_of_printing_score: 4 factors (nozzle temp, bed temp, speed, retraction)`);
console.log(`   dimensional_accuracy_score: 2 factors (diameter, density)`);
console.log(`   printability_index: Combined ease + accuracy`);
console.log(`   value_score: Quality / Price ratio`);
console.log(`   strength_index: Tensile + Impact combined`);
