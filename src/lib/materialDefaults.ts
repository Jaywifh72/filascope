/**
 * Material-based default spec ranges.
 * Used as fallback when manufacturer-specific data is missing.
 * Sources: common TDS ranges for generic formulations.
 */

export interface MaterialDefaultSpecs {
  nozzleTempMin: number;
  nozzleTempMax: number;
  bedTempMin: number;
  bedTempMax: number;
  density?: number; // g/cm³ typical
}

// Canonical defaults keyed by normalized material root
const MATERIAL_DEFAULTS: Record<string, MaterialDefaultSpecs> = {
  PLA:   { nozzleTempMin: 190, nozzleTempMax: 220, bedTempMin: 20,  bedTempMax: 60,  density: 1.24 },
  PETG:  { nozzleTempMin: 220, nozzleTempMax: 250, bedTempMin: 60,  bedTempMax: 80,  density: 1.27 },
  ABS:   { nozzleTempMin: 230, nozzleTempMax: 260, bedTempMin: 90,  bedTempMax: 110, density: 1.04 },
  ASA:   { nozzleTempMin: 235, nozzleTempMax: 260, bedTempMin: 90,  bedTempMax: 110, density: 1.07 },
  TPU:   { nozzleTempMin: 210, nozzleTempMax: 230, bedTempMin: 30,  bedTempMax: 60,  density: 1.21 },
  PA:    { nozzleTempMin: 240, nozzleTempMax: 270, bedTempMin: 70,  bedTempMax: 100, density: 1.14 },
  NYLON: { nozzleTempMin: 240, nozzleTempMax: 270, bedTempMin: 70,  bedTempMax: 100, density: 1.14 },
  PC:    { nozzleTempMin: 260, nozzleTempMax: 310, bedTempMin: 100, bedTempMax: 120, density: 1.20 },
  HIPS:  { nozzleTempMin: 220, nozzleTempMax: 250, bedTempMin: 90,  bedTempMax: 110, density: 1.05 },
  PP:    { nozzleTempMin: 210, nozzleTempMax: 240, bedTempMin: 60,  bedTempMax: 100, density: 0.90 },
  PVA:   { nozzleTempMin: 185, nozzleTempMax: 210, bedTempMin: 45,  bedTempMax: 60,  density: 1.23 },
  PCTG:  { nozzleTempMin: 230, nozzleTempMax: 260, bedTempMin: 60,  bedTempMax: 80,  density: 1.23 },
  CPE:   { nozzleTempMin: 230, nozzleTempMax: 260, bedTempMin: 60,  bedTempMax: 80,  density: 1.25 },
};

/**
 * Extract the base material family from a full material string.
 * "PLA-CF" → "PLA", "TPU-95A" → "TPU", "PA-CF" → "PA", etc.
 */
function getBaseMaterial(material: string): string {
  const upper = material.toUpperCase().trim();
  
  // Check direct match first (handles "PLA", "PETG", "ABS" etc.)
  if (MATERIAL_DEFAULTS[upper]) return upper;
  
  // Nylon variants → PA
  if (/NYLON|^PA\b/i.test(upper)) return 'PA';
  
  // PC-PBT, PC-ABS → PC
  if (upper.startsWith('PC')) return 'PC';

  // PETG variants (PETG-CF, PETG-HS, rPETG, PET-G)
  if (/PETG|PET-G/i.test(upper)) return 'PETG';

  // PCTG
  if (upper.startsWith('PCTG')) return 'PCTG';

  // CPE / Copolyester
  if (/^CPE|COPOLYESTER/i.test(upper)) return 'CPE';
  
  // ASA variants
  if (upper.startsWith('ASA')) return 'ASA';
  
  // ABS variants
  if (upper.startsWith('ABS')) return 'ABS';
  
  // TPU variants (TPU-95A, TPU-85A, TPU-40D)
  if (upper.startsWith('TPU')) return 'TPU';
  
  // PLA variants (PLA+, PLA-CF, PLA-Wood, PLA Silk, HTPLA, PLA Premium, PLA Pro, etc.)
  if (/PLA|HTPLA/i.test(upper)) return 'PLA';
  
  // PP
  if (upper.startsWith('PP')) return 'PP';
  
  // HIPS
  if (upper.startsWith('HIPS')) return 'HIPS';
  
  // PVA
  if (upper.startsWith('PVA')) return 'PVA';
  
  return '';
}

export interface ResolvedSpec {
  value: string;
  isDefault: boolean;
  materialLabel?: string; // e.g. "PLA" for the tooltip "typical for PLA"
}

/**
 * Resolve a temperature range, falling back to material defaults.
 * Returns null if no data and no default available (hide the field entirely).
 */
export function resolveNozzleTemp(
  min: number | null | undefined,
  max: number | null | undefined,
  material: string | null | undefined,
): ResolvedSpec | null {
  if (min && max) return { value: `${min}-${max}°C`, isDefault: false };
  if (min) return { value: `${min}°C+`, isDefault: false };
  if (max) return { value: `≤${max}°C`, isDefault: false };

  // Fallback to material default
  if (!material) return null;
  const base = getBaseMaterial(material);
  const defaults = MATERIAL_DEFAULTS[base];
  if (!defaults) return null;
  
  return {
    value: `${defaults.nozzleTempMin}-${defaults.nozzleTempMax}°C`,
    isDefault: true,
    materialLabel: base,
  };
}

export function resolveBedTemp(
  min: number | null | undefined,
  max: number | null | undefined,
  material: string | null | undefined,
): ResolvedSpec | null {
  if (min && max) return { value: `${min}-${max}°C`, isDefault: false };
  if (min) return { value: `${min}°C+`, isDefault: false };
  if (max) return { value: `≤${max}°C`, isDefault: false };

  if (!material) return null;
  const base = getBaseMaterial(material);
  const defaults = MATERIAL_DEFAULTS[base];
  if (!defaults) return null;
  
  return {
    value: `${defaults.bedTempMin}-${defaults.bedTempMax}°C`,
    isDefault: true,
    materialLabel: base,
  };
}

/**
 * Get material defaults for a given material string.
 * Returns null if no defaults known for this material.
 */
export function getMaterialDefaults(material: string | null | undefined): MaterialDefaultSpecs | null {
  if (!material) return null;
  const base = getBaseMaterial(material);
  return MATERIAL_DEFAULTS[base] || null;
}
