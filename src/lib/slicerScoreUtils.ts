// Score calculation utilities for slicer comparison

export interface SlicerSubscores {
  easeOfUse: number;      // 1-5: Ease of Use (30% weight)
  featureSet: number;     // 1-5: Feature Set (25% weight)
  performance: number;    // 1-5: Performance (20% weight)
  supportQuality: number; // 1-5: Support Quality (15% weight)
  uiPolish: number;       // 1-5: UI Polish (10% weight)
}

export const SUBSCORE_WEIGHTS: Record<keyof SlicerSubscores, number> = {
  easeOfUse: 0.30,
  featureSet: 0.25,
  performance: 0.20,
  supportQuality: 0.15,
  uiPolish: 0.10,
};

export const SUBSCORE_LABELS: Record<keyof SlicerSubscores, string> = {
  easeOfUse: 'Ease of Use',
  featureSet: 'Feature Set',
  performance: 'Performance',
  supportQuality: 'Support Quality',
  uiPolish: 'UI Polish',
};

/**
 * Calculate weighted overall score from subscores
 * Converts 1-5 scale subscores to 0-10 overall score
 */
export function calculateOverallScore(subscores: SlicerSubscores): number {
  const weightedSum = (
    subscores.easeOfUse * SUBSCORE_WEIGHTS.easeOfUse +
    subscores.featureSet * SUBSCORE_WEIGHTS.featureSet +
    subscores.performance * SUBSCORE_WEIGHTS.performance +
    subscores.supportQuality * SUBSCORE_WEIGHTS.supportQuality +
    subscores.uiPolish * SUBSCORE_WEIGHTS.uiPolish
  );
  // Multiply by 2 to scale from 0-5 to 0-10 and round to 1 decimal
  return Math.round(weightedSum * 2 * 10) / 10;
}

/**
 * Get color class based on score (0-10 scale)
 */
export function getScoreColor(score: number): string {
  if (score >= 9.0) return 'text-green-500';
  if (score >= 7.0) return 'text-primary';
  if (score >= 5.0) return 'text-yellow-500';
  return 'text-orange-500';
}

/**
 * Get background color class for score badge
 */
export function getScoreBgColor(score: number): string {
  if (score >= 9.0) return 'bg-green-500/10 border-green-500/30';
  if (score >= 7.0) return 'bg-primary/10 border-primary/30';
  if (score >= 5.0) return 'bg-yellow-500/10 border-yellow-500/30';
  return 'bg-orange-500/10 border-orange-500/30';
}

/**
 * Get label based on score
 */
export function getScoreLabel(score: number): string {
  if (score >= 9.0) return 'Excellent';
  if (score >= 8.0) return 'Great';
  if (score >= 7.0) return 'Good';
  if (score >= 5.0) return 'Fair';
  return 'Below Average';
}

/**
 * Default subscores for slicers (based on existing data analysis)
 */
export const slicerSubscores: Record<string, SlicerSubscores> = {
  'Bambu Studio': { easeOfUse: 5, featureSet: 4.5, performance: 5, supportQuality: 5, uiPolish: 5 },
  'PrusaSlicer': { easeOfUse: 4, featureSet: 5, performance: 4, supportQuality: 5, uiPolish: 4 },
  'OrcaSlicer': { easeOfUse: 4, featureSet: 5, performance: 5, supportQuality: 4.5, uiPolish: 4 },
  'UltiMaker Cura': { easeOfUse: 5, featureSet: 4, performance: 3, supportQuality: 4.5, uiPolish: 4 },
  'Simplify3D': { easeOfUse: 3, featureSet: 5, performance: 4, supportQuality: 3.5, uiPolish: 3 },
  'ideaMaker': { easeOfUse: 4, featureSet: 4, performance: 4, supportQuality: 4, uiPolish: 5 },
  'SuperSlicer': { easeOfUse: 3, featureSet: 5, performance: 4, supportQuality: 4, uiPolish: 3 },
  'Creality Print': { easeOfUse: 4, featureSet: 3, performance: 4, supportQuality: 3, uiPolish: 4 },
  'Lychee Slicer': { easeOfUse: 5, featureSet: 4, performance: 4, supportQuality: 4.5, uiPolish: 5 },
  'ChiTuBox': { easeOfUse: 4, featureSet: 4, performance: 4, supportQuality: 3.5, uiPolish: 3.5 },
  'Slic3r': { easeOfUse: 2.5, featureSet: 3.5, performance: 4, supportQuality: 3, uiPolish: 2 },
  'KISSlicer': { easeOfUse: 3, featureSet: 3, performance: 4, supportQuality: 2.5, uiPolish: 2 },
  'MatterControl': { easeOfUse: 3.5, featureSet: 3, performance: 3, supportQuality: 3.5, uiPolish: 4 },
  'CraftWare': { easeOfUse: 3.5, featureSet: 3, performance: 3, supportQuality: 2.5, uiPolish: 3 },
  'Kiri:Moto': { easeOfUse: 4, featureSet: 3.5, performance: 4, supportQuality: 3, uiPolish: 4 },
  '3DPrinterOS': { easeOfUse: 4, featureSet: 3, performance: 3, supportQuality: 3.5, uiPolish: 3.5 },
  'FlashPrint': { easeOfUse: 4, featureSet: 3, performance: 4, supportQuality: 3.5, uiPolish: 4 },
  'Anycubic Slicer': { easeOfUse: 4, featureSet: 3, performance: 3.5, supportQuality: 3, uiPolish: 3.5 },
  'VoxelDance Tango': { easeOfUse: 3, featureSet: 4, performance: 5, supportQuality: 3.5, uiPolish: 3.5 },
  'Repetier-Host': { easeOfUse: 2.5, featureSet: 3.5, performance: 3, supportQuality: 3, uiPolish: 2 },
};

/**
 * Get subscores for a slicer, with fallback defaults
 */
export function getSlicerSubscores(name: string): SlicerSubscores {
  return slicerSubscores[name] || { easeOfUse: 3, featureSet: 3, performance: 3, supportQuality: 3, uiPolish: 3 };
}
