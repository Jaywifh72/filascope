// Score calculation utilities for slicer comparison

export interface SlicerSubscores {
  ease: number;      // 1-5: Ease of Use (30% weight)
  control: number;   // 1-5: Feature Control (25% weight)
  support: number;   // 1-5: Support Generation (20% weight)
  speed: number;     // 1-5: Slicing Speed (15% weight)
  ui: number;        // 1-5: UI Quality (10% weight)
}

export const SUBSCORE_WEIGHTS = {
  ease: 0.30,
  control: 0.25,
  support: 0.20,
  speed: 0.15,
  ui: 0.10,
} as const;

export const SUBSCORE_LABELS = {
  ease: 'Ease of Use',
  control: 'Feature Control',
  support: 'Support Gen',
  speed: 'Slicing Speed',
  ui: 'UI Quality',
} as const;

/**
 * Calculate weighted overall score from subscores
 * Converts 1-5 scale subscores to 0-10 overall score
 */
export function calculateOverallScore(subscores: SlicerSubscores): number {
  const weighted = Object.entries(SUBSCORE_WEIGHTS).reduce(
    (sum, [key, weight]) => sum + (subscores[key as keyof SlicerSubscores] * weight),
    0
  );
  // Convert 1-5 scale to 0-10 scale and round to 1 decimal
  return Math.round(((weighted / 5) * 10) * 10) / 10;
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
  if (score >= 9.0) return 'bg-green-500/15 border-green-500/30';
  if (score >= 7.0) return 'bg-primary/15 border-primary/30';
  if (score >= 5.0) return 'bg-yellow-500/15 border-yellow-500/30';
  return 'bg-orange-500/15 border-orange-500/30';
}

/**
 * Get label based on score
 */
export function getScoreLabel(score: number): string {
  if (score >= 9.0) return 'Excellent';
  if (score >= 8.0) return 'Great';
  if (score >= 7.0) return 'Good';
  if (score >= 5.0) return 'Average';
  return 'Below Average';
}

/**
 * Default subscores for slicers (based on existing data analysis)
 */
export const slicerSubscores: Record<string, SlicerSubscores> = {
  'Bambu Studio': { ease: 5, control: 4, support: 5, speed: 5, ui: 5 },
  'PrusaSlicer': { ease: 4, control: 5, support: 5, speed: 4, ui: 4 },
  'OrcaSlicer': { ease: 4, control: 5, support: 5, speed: 5, ui: 4 },
  'UltiMaker Cura': { ease: 5, control: 4, support: 4, speed: 3, ui: 4 },
  'Simplify3D': { ease: 3, control: 5, support: 4, speed: 4, ui: 3 },
  'ideaMaker': { ease: 4, control: 4, support: 4, speed: 4, ui: 5 },
  'SuperSlicer': { ease: 3, control: 5, support: 5, speed: 4, ui: 3 },
  'Creality Print': { ease: 4, control: 3, support: 3, speed: 4, ui: 4 },
  'Lychee Slicer': { ease: 5, control: 4, support: 5, speed: 4, ui: 5 },
  'ChiTuBox': { ease: 4, control: 4, support: 4, speed: 4, ui: 3 },
  'Slic3r': { ease: 2, control: 4, support: 3, speed: 4, ui: 2 },
  'KISSlicer': { ease: 3, control: 3, support: 3, speed: 4, ui: 2 },
  'MatterControl': { ease: 3, control: 3, support: 3, speed: 3, ui: 4 },
  'CraftWare': { ease: 3, control: 3, support: 3, speed: 3, ui: 3 },
  'Kiri:Moto': { ease: 4, control: 3, support: 3, speed: 4, ui: 4 },
  '3DPrinterOS': { ease: 4, control: 3, support: 3, speed: 3, ui: 3 },
  'FlashPrint': { ease: 4, control: 3, support: 3, speed: 4, ui: 4 },
  'Anycubic Slicer': { ease: 4, control: 3, support: 3, speed: 3, ui: 3 },
  'VoxelDance Tango': { ease: 3, control: 4, support: 4, speed: 5, ui: 3 },
  'Repetier-Host': { ease: 2, control: 3, support: 3, speed: 3, ui: 2 },
};

/**
 * Get subscores for a slicer, with fallback defaults
 */
export function getSlicerSubscores(name: string): SlicerSubscores {
  return slicerSubscores[name] || { ease: 3, control: 3, support: 3, speed: 3, ui: 3 };
}
