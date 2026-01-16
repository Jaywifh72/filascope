/**
 * Score Calculation Service
 * Provides utilities and explanations for how filament scores are calculated
 */

// Material baseline difficulties (1=easy, 10=hard)
export const MATERIAL_DIFFICULTY: Record<string, number> = {
  'PLA': 1.5,
  'PLA+': 2,
  'PETG': 3.5,
  'TPU': 4.5,
  'ABS': 5.5,
  'ASA': 5,
  'PA': 7,
  'NYLON': 7,
  'PC': 7.5,
  'PP': 6,
  'PVA': 4,
  'HIPS': 4,
  'PEEK': 9,
  'PEI': 8.5,
  'PCTG': 3,
};

// Material baseline strengths (1-10)
export const MATERIAL_STRENGTH: Record<string, number> = {
  'PLA': 4,
  'PLA+': 4.5,
  'PETG': 5.5,
  'TPU': 3,
  'ABS': 6,
  'ASA': 6.5,
  'PA': 8,
  'NYLON': 8,
  'PC': 8.5,
  'PP': 4.5,
  'PA-CF': 9,
  'PC-CF': 9,
  'PEEK': 9.5,
};

export interface ScoreBreakdown {
  score: number | null;
  factors: Array<{
    name: string;
    contribution: string;
    impact: 'positive' | 'negative' | 'neutral';
  }>;
  confidence: number;
  dataPoints: number;
}

export interface FilamentDataForScoring {
  material?: string | null;
  nozzle_temp_min_c?: number | null;
  nozzle_temp_max_c?: number | null;
  bed_temp_min_c?: number | null;
  bed_temp_max_c?: number | null;
  drying_time_hours?: number | null;
  tensile_strength_xy_mpa?: number | null;
  elongation_break_xy_percent?: number | null;
  flexural_strength_mpa?: number | null;
  density_g_cm3?: number | null;
  print_speed_max_mms?: number | null;
  high_speed_capable?: boolean | null;
  is_nozzle_abrasive?: boolean | null;
}

export function getBaseMaterial(material: string | null): string {
  if (!material) return 'PLA';
  const normalized = material.toUpperCase()
    .replace(/[\s\-+]+/g, '-')
    .split('-')[0]
    .trim();
  return normalized || 'PLA';
}

/**
 * Calculate ease of printing score with detailed breakdown
 */
export function calculateEaseBreakdown(filament: FilamentDataForScoring): ScoreBreakdown {
  const factors: ScoreBreakdown['factors'] = [];
  let dataPoints = 0;
  let score = 10;

  const baseMaterial = getBaseMaterial(filament.material);
  const difficulty = MATERIAL_DIFFICULTY[baseMaterial] ?? 4;
  
  score -= difficulty * 0.3;
  factors.push({
    name: `${baseMaterial} material`,
    contribution: `Base difficulty ${difficulty.toFixed(1)}/10`,
    impact: difficulty <= 3 ? 'positive' : difficulty >= 6 ? 'negative' : 'neutral',
  });
  dataPoints++;

  if (filament.nozzle_temp_min_c && filament.nozzle_temp_max_c) {
    const range = filament.nozzle_temp_max_c - filament.nozzle_temp_min_c;
    if (range < 20) {
      score -= 1;
      factors.push({ name: 'Temperature window', contribution: `Narrow (${range}°C range)`, impact: 'negative' });
    } else if (range > 40) {
      score += 0.5;
      factors.push({ name: 'Temperature window', contribution: `Wide (${range}°C range)`, impact: 'positive' });
    }
    dataPoints++;
  }

  if (filament.nozzle_temp_min_c && filament.nozzle_temp_min_c > 260) {
    score -= 1.5;
    factors.push({ name: 'Nozzle temp', contribution: `High (${filament.nozzle_temp_min_c}°C+)`, impact: 'negative' });
    dataPoints++;
  }

  if (filament.bed_temp_min_c && filament.bed_temp_min_c > 80) {
    score -= 0.5;
    factors.push({ name: 'Bed temp', contribution: `High (${filament.bed_temp_min_c}°C+)`, impact: 'negative' });
    dataPoints++;
  }

  if (filament.drying_time_hours) {
    if (filament.drying_time_hours > 6) {
      score -= 1;
      factors.push({ name: 'Drying', contribution: `Long (${filament.drying_time_hours}h)`, impact: 'negative' });
    } else {
      score -= 0.5;
      factors.push({ name: 'Drying', contribution: 'Recommended', impact: 'neutral' });
    }
    dataPoints++;
  }

  if (filament.is_nozzle_abrasive) {
    score -= 0.5;
    factors.push({ name: 'Nozzle wear', contribution: 'Hardened nozzle needed', impact: 'negative' });
    dataPoints++;
  }

  if (filament.high_speed_capable) {
    score += 0.5;
    factors.push({ name: 'Speed', contribution: 'High speed capable', impact: 'positive' });
    dataPoints++;
  }

  const confidence = Math.min(100, dataPoints * 15 + 20);
  // Calculate score even with 1 data point (material only) - it's still useful
  const finalScore = dataPoints >= 1 ? Math.max(1, Math.min(10, score)) : null;

  return {
    score: finalScore !== null ? Math.round(finalScore * 10) / 10 : null,
    factors,
    confidence,
    dataPoints,
  };
}

/**
 * Calculate strength index with detailed breakdown
 */
export function calculateStrengthBreakdown(filament: FilamentDataForScoring): ScoreBreakdown {
  const factors: ScoreBreakdown['factors'] = [];
  let dataPoints = 0;

  const baseMaterial = getBaseMaterial(filament.material);
  const baseStrength = MATERIAL_STRENGTH[baseMaterial] ?? 5;
  let score = baseStrength;
  
  factors.push({
    name: `${baseMaterial} material`,
    contribution: `Base strength ${baseStrength}/10`,
    impact: baseStrength >= 7 ? 'positive' : baseStrength <= 4 ? 'negative' : 'neutral',
  });
  dataPoints++;

  if (filament.tensile_strength_xy_mpa) {
    const tensile = filament.tensile_strength_xy_mpa;
    if (tensile > 60) {
      score += 1.5;
      factors.push({ name: 'Tensile strength', contribution: `${tensile} MPa (excellent)`, impact: 'positive' });
    } else if (tensile > 40) {
      score += 0.5;
      factors.push({ name: 'Tensile strength', contribution: `${tensile} MPa (good)`, impact: 'positive' });
    } else if (tensile < 30) {
      score -= 0.5;
      factors.push({ name: 'Tensile strength', contribution: `${tensile} MPa (low)`, impact: 'negative' });
    } else {
      factors.push({ name: 'Tensile strength', contribution: `${tensile} MPa`, impact: 'neutral' });
    }
    dataPoints++;
  }

  if (filament.elongation_break_xy_percent) {
    const elongation = filament.elongation_break_xy_percent;
    if (elongation > 100) {
      score += 0.5;
      factors.push({ name: 'Elongation', contribution: `${elongation}% (flexible)`, impact: 'positive' });
    } else if (elongation < 5) {
      score -= 0.3;
      factors.push({ name: 'Elongation', contribution: `${elongation}% (brittle)`, impact: 'negative' });
    }
    dataPoints++;
  }

  if (filament.flexural_strength_mpa) {
    const flexural = filament.flexural_strength_mpa;
    if (flexural > 90) {
      score += 0.5;
      factors.push({ name: 'Flexural strength', contribution: `${flexural} MPa (excellent)`, impact: 'positive' });
    }
    dataPoints++;
  }

  if (filament.density_g_cm3 && filament.density_g_cm3 > 1.4) {
    score += 0.3;
    factors.push({ name: 'Density', contribution: `${filament.density_g_cm3} g/cm³ (reinforced)`, impact: 'positive' });
    dataPoints++;
  }

  const confidence = Math.min(100, dataPoints * 18 + 15);
  // Calculate score even with 1 data point (material only) - it's still useful
  const finalScore = dataPoints >= 1 ? Math.max(1, Math.min(10, score)) : null;

  return {
    score: finalScore !== null ? Math.round(finalScore * 10) / 10 : null,
    factors,
    confidence,
    dataPoints,
  };
}

/**
 * Score calculation methodology explanation
 */
export const SCORE_METHODOLOGY = {
  ease_of_printing: {
    title: 'Ease of Printing Score',
    description: 'Measures how forgiving and beginner-friendly this filament is',
    formula: 'Starts at 10, deducts points for printing challenges',
    factors: [
      { name: 'Material Type', weight: '30%', description: 'Base difficulty of the material (PLA=easy, PEEK=hard)' },
      { name: 'Temperature Window', weight: '15%', description: 'Wider temp range = more forgiving' },
      { name: 'High Temp Requirement', weight: '15%', description: 'Materials needing 260°C+ are harder to print' },
      { name: 'Bed Adhesion Needs', weight: '10%', description: 'High bed temps indicate more adhesion challenges' },
      { name: 'Drying Requirements', weight: '15%', description: 'Moisture-sensitive materials need prep' },
      { name: 'Nozzle Wear', weight: '5%', description: 'Abrasive materials need special nozzles' },
      { name: 'Speed Capability', weight: '10%', description: 'High-speed materials are optimized for modern printers' },
    ],
  },
  strength_index: {
    title: 'Strength Index',
    description: 'Indicates the mechanical strength and durability of printed parts',
    formula: 'Based on material type + lab test data',
    factors: [
      { name: 'Material Type', weight: '35%', description: 'Base strength (PA/PC strong, TPU flexible)' },
      { name: 'Tensile Strength', weight: '30%', description: 'Force to pull apart (MPa from TDS)' },
      { name: 'Elongation', weight: '15%', description: 'Flexibility before breaking' },
      { name: 'Flexural Strength', weight: '12%', description: 'Resistance to bending' },
      { name: 'Density/Reinforcement', weight: '8%', description: 'Higher density often means additives' },
    ],
  },
  printability_index: {
    title: 'Printability Index',
    description: 'Overall printing experience combining ease and performance',
    formula: '60% Ease + 40% Strength + speed bonuses',
    factors: [
      { name: 'Ease of Printing', weight: '60%', description: 'How forgiving during printing' },
      { name: 'Strength Index', weight: '40%', description: 'Part quality outcome' },
      { name: 'Print Speed', weight: 'Bonus', description: 'High-speed capable materials get bonus' },
    ],
  },
};

/**
 * Count available data points for a filament (used for Limited Data badge)
 */
export function countAvailableDataPoints(filament: FilamentDataForScoring & {
  ease_of_printing_score?: number | null;
  strength_index?: number | null;
  printability_index?: number | null;
  variant_price?: number | null;
}): { count: number; available: string[]; missing: string[] } {
  const checks = [
    { key: 'ease_of_printing_score', label: 'Ease Score', value: filament.ease_of_printing_score },
    { key: 'strength_index', label: 'Strength Index', value: filament.strength_index },
    { key: 'printability_index', label: 'Printability', value: filament.printability_index },
    { key: 'variant_price', label: 'Price', value: filament.variant_price },
    { key: 'nozzle_temp', label: 'Nozzle Temp', value: filament.nozzle_temp_min_c || filament.nozzle_temp_max_c },
    { key: 'bed_temp', label: 'Bed Temp', value: filament.bed_temp_min_c },
    { key: 'tensile', label: 'Tensile Strength', value: filament.tensile_strength_xy_mpa },
    { key: 'density', label: 'Density', value: filament.density_g_cm3 },
  ];

  const available = checks.filter(c => c.value !== null && c.value !== undefined).map(c => c.label);
  const missing = checks.filter(c => c.value === null || c.value === undefined).map(c => c.label);

  return { count: available.length, available, missing };
}
