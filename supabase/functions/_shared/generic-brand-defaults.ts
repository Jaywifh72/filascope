/**
 * GENERIC BRAND ENRICHMENT FALLBACK
 * 
 * Provides sensible defaults for ANY brand that doesn't have a custom
 * brand-specific defaults file. Used by sync-TEMPLATE-products and any
 * new brand sync function before a dedicated defaults file is created.
 */

import { guessFinishType } from './filament-utils.ts';

// ============================================================
// Material-based temperature defaults
// ============================================================
interface MaterialDefaults {
  nozzleTempMin: number;
  nozzleTempMax: number;
  bedTempMin: number;
  bedTempMax: number;
}

const MATERIAL_DEFAULTS: Record<string, MaterialDefaults> = {
  'PLA':   { nozzleTempMin: 190, nozzleTempMax: 220, bedTempMin: 50,  bedTempMax: 60  },
  'PLA+':  { nozzleTempMin: 190, nozzleTempMax: 220, bedTempMin: 50,  bedTempMax: 60  },
  'PETG':  { nozzleTempMin: 220, nozzleTempMax: 250, bedTempMin: 70,  bedTempMax: 80  },
  'ABS':   { nozzleTempMin: 230, nozzleTempMax: 260, bedTempMin: 90,  bedTempMax: 110 },
  'TPU':   { nozzleTempMin: 210, nozzleTempMax: 230, bedTempMin: 40,  bedTempMax: 60  },
  'ASA':   { nozzleTempMin: 240, nozzleTempMax: 260, bedTempMin: 90,  bedTempMax: 110 },
  'PC':    { nozzleTempMin: 260, nozzleTempMax: 300, bedTempMin: 100, bedTempMax: 120 },
  'PA':    { nozzleTempMin: 240, nozzleTempMax: 270, bedTempMin: 70,  bedTempMax: 90  },
  'NYLON': { nozzleTempMin: 240, nozzleTempMax: 270, bedTempMin: 70,  bedTempMax: 90  },
  'PVB':   { nozzleTempMin: 190, nozzleTempMax: 210, bedTempMin: 50,  bedTempMax: 60  },
  'HIPS':  { nozzleTempMin: 220, nozzleTempMax: 250, bedTempMin: 90,  bedTempMax: 110 },
};

/**
 * Get the base material family from a full material string.
 * "PLA-CF" → "PLA", "TPU-95A" → "TPU", "PA-CF" → "PA"
 */
function getBaseMaterial(material: string): string {
  const upper = material.toUpperCase().trim();
  if (MATERIAL_DEFAULTS[upper]) return upper;
  if (/NYLON|^PA\b/i.test(upper)) return 'PA';
  if (upper.startsWith('PC')) return 'PC';
  if (/PETG|PET-G/i.test(upper)) return 'PETG';
  if (upper.startsWith('ASA')) return 'ASA';
  if (upper.startsWith('ABS')) return 'ABS';
  if (upper.startsWith('TPU')) return 'TPU';
  if (/PLA|HTPLA/i.test(upper)) return 'PLA';
  if (upper.startsWith('HIPS')) return 'HIPS';
  if (upper.startsWith('PVB')) return 'PVB';
  return '';
}

// ============================================================
// Enrichment result interface
// ============================================================
export interface GenericEnrichmentResult {
  tdsUrl: string | null;
  material: string | null;
  nozzleTempMin: number | null;
  nozzleTempMax: number | null;
  bedTempMin: number | null;
  bedTempMax: number | null;
  finishType: string;
  productLineId: string;
  highSpeedCapable: boolean | null;
  isAbrasive: boolean | null;
}

/**
 * Generic enrichment for any brand.
 * Fills in temperature defaults from MATERIAL_DEFAULTS when missing,
 * guesses finish type, detects high-speed and abrasive materials.
 */
export function enrichGenericProduct(
  productTitle: string | null,
  material: string | null,
  tdsUrl: string | null,
  nozzleTempMin: number | null,
  nozzleTempMax: number | null,
  bedTempMin: number | null,
  bedTempMax: number | null,
  colorName: string | null,
  brandSlug: string,
): GenericEnrichmentResult {
  const title = productTitle || '';
  const mat = material || '';

  // --- Temperature defaults ---
  const baseMat = mat ? getBaseMaterial(mat) : '';
  const defaults = baseMat ? MATERIAL_DEFAULTS[baseMat] : null;

  const resolvedNozzleMin = nozzleTempMin ?? defaults?.nozzleTempMin ?? null;
  const resolvedNozzleMax = nozzleTempMax ?? defaults?.nozzleTempMax ?? null;
  const resolvedBedMin = bedTempMin ?? defaults?.bedTempMin ?? null;
  const resolvedBedMax = bedTempMax ?? defaults?.bedTempMax ?? null;

  // --- Finish type ---
  const finishType = guessFinishType(mat, title) || 'Standard';

  // --- Product line ID ---
  const matSlug = mat ? mat.toLowerCase().replace(/[^a-z0-9]+/g, '-') : 'unknown';
  const productLineId = `${brandSlug}-${matSlug}`;

  // --- High speed detection ---
  const highSpeedCapable = /high.?speed|\bhs\b|\bfast\b/i.test(title) ? true : null;

  // --- Abrasive detection ---
  const upperMat = mat.toUpperCase();
  const isAbrasive = (
    upperMat.includes('CF') ||
    upperMat.includes('GF') ||
    /carbon\s*fiber|glass\s*fiber|carbon\s*fibre|glass\s*fibre/i.test(title)
  ) ? true : null;

  return {
    tdsUrl: tdsUrl ?? null,
    material: material ?? null,
    nozzleTempMin: resolvedNozzleMin,
    nozzleTempMax: resolvedNozzleMax,
    bedTempMin: resolvedBedMin,
    bedTempMax: resolvedBedMax,
    finishType,
    productLineId,
    highSpeedCapable,
    isAbrasive,
  };
}
