// Pre-calculated material averages from database
// Used for score comparison in filament cards
export const MATERIAL_AVERAGES: Record<string, number> = {
  "PLA": 6.51,
  "PETG": 7.56,
  "TPU": 5.72,
  "Nylon": 6.54,
  "ABS": 6.83,
  "ASA": 7.77,
  "PC": 6.07,
  "PEEK": 7.20,
  "PVA": 5.80,
  "HIPS": 6.10,
  "PP": 5.90,
  "CPE": 6.40,
  "PEI": 7.10,
  "PA-CF": 7.85,
  "PLA+": 6.80,
  "Wood": 5.50,
};

export function getMaterialAverage(material: string | null | undefined): number | null {
  if (!material) return null;
  
  // Extract base material (e.g., "PLA" from "PLA+", "PLA Silk", etc.)
  const baseMaterial = material.split(/[\s\-+]/)[0]?.toUpperCase();
  
  // Check for exact match first
  if (MATERIAL_AVERAGES[baseMaterial]) {
    return MATERIAL_AVERAGES[baseMaterial];
  }
  
  // Check for partial matches
  for (const key of Object.keys(MATERIAL_AVERAGES)) {
    if (baseMaterial?.includes(key) || key.includes(baseMaterial || "")) {
      return MATERIAL_AVERAGES[key];
    }
  }
  
  return null;
}

export function getScoreComparison(score: number, materialAvg: number | null): {
  text: string;
  isAbove: boolean;
  difference: number;
} | null {
  if (materialAvg === null) return null;
  
  const difference = score - materialAvg;
  const isAbove = difference >= 0;
  
  if (Math.abs(difference) < 0.3) {
    return { text: "Average", isAbove: true, difference: 0 };
  }
  
  return {
    text: isAbove ? "Above average" : "Below average",
    isAbove,
    difference: Math.abs(difference),
  };
}
