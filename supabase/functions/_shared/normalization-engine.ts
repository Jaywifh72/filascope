/**
 * NORMALIZATION ENGINE
 *
 * Single source of truth for all data normalization across FilaScope scrapers.
 * Every scraper MUST use these functions for consistent, comparable data.
 */

import { getColorHex } from './color-mapping.ts';

// ============================================================================
// TEMPERATURE NORMALIZATION
// ============================================================================

/**
 * Normalize a temperature value to integer Celsius.
 * Handles: "220°C", "220 C", "220c", "374°F", "220", 220
 */
export function normalizeTemp(raw: string | number | null | undefined): number | null {
  if (raw === null || raw === undefined) return null;
  if (typeof raw === 'number') {
    if (isNaN(raw)) return null;
    return Math.round(raw);
  }
  const str = String(raw).trim();
  if (!str) return null;

  // Fahrenheit: "374°F", "374 F", "374f"
  const fMatch = str.match(/^([\d.]+)\s*°?\s*[Ff]$/);
  if (fMatch) {
    const f = parseFloat(fMatch[1]);
    return Math.round((f - 32) * 5 / 9);
  }

  // Celsius (explicit or bare number): "220°C", "220 C", "220c", "220"
  const cMatch = str.match(/^([\d.]+)\s*°?\s*[Cc]?$/);
  if (cMatch) return Math.round(parseFloat(cMatch[1]));

  return null;
}

/**
 * Normalize a temperature range string.
 * "190-220°C" → { min: 190, max: 220 }
 * "190 to 230°C" → { min: 190, max: 230 }
 * "220°C" → { min: 220, max: 220 }
 */
export function normalizeTempRange(raw: string | null | undefined): { min: number | null; max: number | null } {
  if (!raw) return { min: null, max: null };
  const str = String(raw).trim();

  // Range with dash or "to": "190-220°C", "190–230°C", "190 to 230°C"
  const rangeMatch = str.match(/^([\d.]+)\s*°?\s*[Cc]?\s*[-–]\s*([\d.]+)\s*°?\s*[Cc]?$/) ||
                     str.match(/^([\d.]+)\s*(?:°?\s*[Cc])?\s+to\s+([\d.]+)\s*°?\s*[Cc]?$/i);
  if (rangeMatch) {
    return {
      min: Math.round(parseFloat(rangeMatch[1])),
      max: Math.round(parseFloat(rangeMatch[2])),
    };
  }

  // Single value
  const single = normalizeTemp(str);
  return { min: single, max: single };
}

// ============================================================================
// WEIGHT NORMALIZATION
// ============================================================================

/**
 * Normalize weight to grams.
 * "1 kg" → 1000, "1000g" → 1000, "750g net" → 750, "2.2 lbs" → 998
 * If ≤10 and no unit, assumes kg.
 */
export function normalizeWeightToGrams(raw: string | number | null | undefined): number | null {
  if (raw === null || raw === undefined) return null;
  if (typeof raw === 'number') {
    if (isNaN(raw)) return null;
    return raw <= 10 ? Math.round(raw * 1000) : Math.round(raw);
  }
  const str = String(raw).trim().toLowerCase();
  if (!str) return null;

  // kg
  const kgMatch = str.match(/^([\d.]+)\s*kg\b/);
  if (kgMatch) return Math.round(parseFloat(kgMatch[1]) * 1000);

  // lbs / lb
  const lbsMatch = str.match(/^([\d.]+)\s*(?:lbs?|pounds?)\b/);
  if (lbsMatch) return Math.round(parseFloat(lbsMatch[1]) * 453.592);

  // g (grams) — match before bare number to avoid false positives
  const gMatch = str.match(/^([\d.]+)\s*g\b/);
  if (gMatch) return Math.round(parseFloat(gMatch[1]));

  // bare number
  const numMatch = str.match(/^([\d.]+)/);
  if (numMatch) {
    const val = parseFloat(numMatch[1]);
    return val <= 10 ? Math.round(val * 1000) : Math.round(val);
  }

  return null;
}

// ============================================================================
// SPEED NORMALIZATION
// ============================================================================

/**
 * Normalize print speed to mm/s.
 * "500mm/s" → 500, "30000mm/min" → 500, "500" → 500
 */
export function normalizeSpeedToMms(raw: string | number | null | undefined): number | null {
  if (raw === null || raw === undefined) return null;
  if (typeof raw === 'number') return isNaN(raw) ? null : Math.round(raw);

  const str = String(raw).trim().toLowerCase();
  if (!str) return null;

  // mm/min
  const mmMinMatch = str.match(/^([\d.]+)\s*mm\s*\/\s*min\b/);
  if (mmMinMatch) return Math.round(parseFloat(mmMinMatch[1]) / 60);

  // mm/s
  const mmsMatch = str.match(/^([\d.]+)\s*mm\s*\/\s*s\b/);
  if (mmsMatch) return Math.round(parseFloat(mmsMatch[1]));

  // bare number — assume mm/s
  const numMatch = str.match(/^([\d.]+)/);
  if (numMatch) return Math.round(parseFloat(numMatch[1]));

  return null;
}

// ============================================================================
// DIAMETER NORMALIZATION
// ============================================================================

/**
 * Normalize filament diameter to 1.75 or 2.85.
 * "3.0mm" → 2.85 (legacy 3mm spec maps to 2.85)
 * Returns null for ambiguous inputs.
 */
export function normalizeDiameter(raw: string | number | null | undefined): 1.75 | 2.85 | null {
  if (raw === null || raw === undefined) return null;

  const str = String(raw).trim().toLowerCase();

  // Ambiguous — multiple diameters in one string
  if (/1\.75.*(2\.85|3\.0|3mm)/i.test(str) || /(2\.85|3\.0|3mm).*1\.75/i.test(str)) return null;

  if (/1\.75/.test(str)) return 1.75;
  if (/2\.85/.test(str)) return 2.85;
  if (/3\.0|^3$|3\s*mm/.test(str)) return 2.85; // legacy 3mm

  // Bare number
  const numMatch = str.match(/^([\d.]+)/);
  if (numMatch) {
    const val = parseFloat(numMatch[1]);
    if (Math.abs(val - 1.75) < 0.15) return 1.75;
    if (Math.abs(val - 2.85) < 0.2 || Math.abs(val - 3.0) < 0.2) return 2.85;
  }

  return null;
}

// ============================================================================
// PRESSURE / STRENGTH NORMALIZATION
// ============================================================================

/**
 * Normalize a pressure/strength value to MPa.
 * "65 MPa" → 65, "9430 PSI" → 65.0, "663 kgf/cm²" → 65.0, "65 N/mm²" → 65
 */
export function normalizeToMpa(raw: string | number | null | undefined, unit?: string): number | null {
  if (raw === null || raw === undefined) return null;

  let value: number;
  let unitStr = (unit || '').toLowerCase().trim();

  if (typeof raw === 'number') {
    value = raw;
  } else {
    const str = String(raw).trim();
    const numMatch = str.match(/^([\d.]+)/);
    if (!numMatch) return null;
    value = parseFloat(numMatch[1]);
    // extract unit from string if not provided
    if (!unitStr) {
      unitStr = str.replace(numMatch[1], '').toLowerCase().trim();
    }
  }

  if (isNaN(value)) return null;

  if (unitStr.includes('psi')) return Math.round((value / 145.038) * 100) / 100;
  if (unitStr.includes('kgf') || unitStr.includes('kgf/cm')) return Math.round((value * 0.0981) * 100) / 100;
  if (unitStr.includes('n/mm') || unitStr === 'n/mm²') return value; // N/mm² = MPa
  // MPa, mpa, or no unit — assume MPa
  return value;
}

// ============================================================================
// MATERIAL NORMALIZATION
// ============================================================================

export const MATERIAL_VOCABULARY: Record<string, string[]> = {
  'PLA': ['pla basic', 'pla standard', 'pla regular', 'pla '],
  'PLA+': ['pla+', 'pla plus', 'pla pro', 'enhanced pla', 'pla hs', 'pro pla', 'tough pla', 'pla tough'],
  'PLA-SILK': ['pla silk', 'silk pla', 'silky pla', 'shiny pla', 'silk '],
  'PLA-MATTE': ['pla matte', 'matte pla', 'polyterra', 'matter3d pla', 'pla lite'],
  'PLA-GLOW': ['glow in the dark pla', 'glow pla', 'luminous pla', 'pla glow'],
  'PLA-WOOD': ['wood pla', 'pla wood', 'wood fill', 'woodfill'],
  'PLA-MARBLE': ['marble pla', 'pla marble', 'stone pla'],
  'PLA-CF': ['pla cf', 'pla carbon', 'carbon fiber pla', 'pla-cf', 'carbon pla', 'pla+cf'],
  'PLA-METAL': ['metal pla', 'metallic pla', 'copper fill', 'bronze fill', 'iron fill', 'steel fill'],
  'PLA-HS': ['pla hs', 'high speed pla', 'pla high speed', 'hs pla', 'pla rapid', 'pla rapide'],
  'PLA-GALAXY': ['galaxy pla', 'starlight pla', 'pla galaxy', 'sparkle pla', 'glitter pla'],
  'PLA-MULTICOLOR': ['multicolor pla', 'multi-color pla', 'panchroma', 'multicolour pla'],
  'PETG': ['petg', 'pet-g', 'pet g'],
  'PETG-CF': ['petg cf', 'petg carbon', 'carbon petg', 'petg-cf'],
  'PETG-HS': ['petg hs', 'high speed petg', 'hs petg'],
  'ABS': ['abs '],
  'ABS+': ['abs+', 'abs plus', 'abs pro'],
  'ASA': ['asa'],
  'ASA-CF': ['asa cf', 'asa carbon'],
  'TPU-95A': ['tpu 95a', '95a tpu', 'cheetah', 'tpu-95a'],
  'TPU-90A': ['tpu 90a', '90a tpu', 'tpu-90a'],
  'TPU-85A': ['tpu 85a', '85a tpu', 'ninjaflex', 'tpu-85a'],
  'TPU-83A': ['tpu 83a', '83a tpu', 'tpu-83a'],
  'TPU': ['tpu', 'tpe', 'flex ', 'flexible', 'filaflex', 'armadillo', 'chinchilla', 'semiflex'],
  'PA6': ['pa6', 'nylon 6', 'pa 6', 'pa6-'],
  'PA11': ['pa11', 'nylon 11', 'pa 11'],
  'PA12': ['pa12', 'nylon 12', 'pa 12', 'pa12-'],
  'PA11': ['pa11', 'nylon 11', 'pa 11'],
  'NYLON': ['nylon', 'polyamide', ' pa '],
  'PA-CF': ['pa cf', 'nylon cf', 'carbon nylon', 'pa6-cf', 'pa12-cf', 'pa-cf'],
  'PC': ['polycarbonate', ' pc '],
  'PC-ABS': ['pc-abs', 'pc abs', 'abs pc'],
  'HIPS': ['hips'],
  'PVA': ['pva'],
  'PVB': ['pvb'],
  'PEEK': ['peek'],
  'PEI': ['pei', 'ultem'],
  'RESIN': ['resin'],
};

/**
 * Normalize a material name to a canonical MATERIAL_VOCABULARY key.
 * "Pro PLA" → "PLA+", "PolyTerra PLA" → "PLA-MATTE", "NinjaFlex 85A" → "TPU-85A"
 */
export function normalizeMaterial(raw: string | null | undefined): string | null {
  if (!raw) return null;
  const lower = raw.toLowerCase().trim();

  // Longest match wins — check more specific materials first
  const orderedKeys = [
    'PLA-CF', 'PLA-SILK', 'PLA-MATTE', 'PLA-GLOW', 'PLA-WOOD', 'PLA-MARBLE',
    'PLA-METAL', 'PLA-HS', 'PLA-GALAXY', 'PLA-MULTICOLOR', 'PLA+',
    'PETG-CF', 'PETG-HS', 'PETG',
    'TPU-95A', 'TPU-90A', 'TPU-85A', 'TPU-83A', 'TPU',
    'ASA-CF', 'ASA',
    'PA-CF', 'PA6', 'PA11', 'PA12', 'NYLON',
    'PC-ABS', 'PC',
    'ABS+', 'ABS', 'HIPS', 'PVA', 'PVB', 'PEEK', 'PEI', 'RESIN',
    'PLA',
  ];

  for (const key of orderedKeys) {
    const synonyms = MATERIAL_VOCABULARY[key];
    if (!synonyms) continue;
    for (const syn of synonyms) {
      if (lower.includes(syn)) return key;
    }
  }

  // Last resort: if title literally contains the canonical key
  for (const key of orderedKeys) {
    if (lower.includes(key.toLowerCase())) return key;
  }

  return null;
}

// ============================================================================
// COLOR HEX NORMALIZATION
// ============================================================================

/**
 * Normalize a color value to a clean 6-digit uppercase #RRGGBB hex.
 * Accepts: "#fff", "fff", "rgb(255,255,255)", color names via color-mapping.ts
 */
export function normalizeColorHex(raw: string | null | undefined): string | null {
  if (!raw) return null;
  const str = raw.trim();

  // rgb(r,g,b)
  const rgbMatch = str.match(/^rgb\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*\)$/i);
  if (rgbMatch) {
    const r = parseInt(rgbMatch[1]).toString(16).padStart(2, '0');
    const g = parseInt(rgbMatch[2]).toString(16).padStart(2, '0');
    const b = parseInt(rgbMatch[3]).toString(16).padStart(2, '0');
    return `#${r}${g}${b}`.toUpperCase();
  }

  // Hex — with or without #, 3 or 6 digits
  const hexMatch = str.match(/^#?([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/);
  if (hexMatch) {
    let hex = hexMatch[1];
    if (hex.length === 3) hex = hex.split('').map(c => c + c).join('');
    return `#${hex.toUpperCase()}`;
  }

  // Color name — delegate to color-mapping.ts
  const mapped = getColorHex(str);
  if (mapped) return mapped.toUpperCase().startsWith('#') ? mapped.toUpperCase() : `#${mapped.toUpperCase()}`;

  return null;
}

// ============================================================================
// BOOLEAN NORMALIZATION
// ============================================================================

/**
 * Normalize a boolean-ish value.
 * "yes", "true", "1", "supported" → true
 * "no", "false", "0", "n/a" → false
 */
export function normalizeBoolean(raw: string | boolean | number | null | undefined): boolean | null {
  if (raw === null || raw === undefined) return null;
  if (typeof raw === 'boolean') return raw;
  if (typeof raw === 'number') return raw !== 0;
  const s = String(raw).toLowerCase().trim();
  if (['yes', 'true', '1', 'supported', 'available', 'yes (compatible)', 'y'].includes(s)) return true;
  if (['no', 'false', '0', 'not supported', 'n/a', 'none', 'n'].includes(s)) return false;
  return null;
}

// ============================================================================
// PRICE NORMALIZATION
// ============================================================================

/**
 * Normalize a price to a plain number. Never converts currency.
 * Strips symbols: "$19.99" → 19.99, "€24,99" → 24.99, "£18.50" → 18.50
 */
export function normalizePrice(raw: string | number | null | undefined): number | null {
  if (raw === null || raw === undefined) return null;
  if (typeof raw === 'number') return isNaN(raw) ? null : raw;

  const str = String(raw).trim()
    .replace(/^[$€£¥₹]/, '')          // leading currency symbol
    .replace(/[,](?=\d{2}$)/, '.')    // European decimal comma: "24,99" → "24.99"
    .replace(/[,]/g, '')              // thousands separator
    .trim();

  const val = parseFloat(str);
  return isNaN(val) ? null : val;
}

// ============================================================================
// DIMENSION NORMALIZATION
// ============================================================================

/**
 * Normalize a dimension to mm.
 * "220mm" → 220, "22 cm" → 220, "8.66 inches" → 220, "8.66\"" → 220
 */
export function normalizeDimensionToMm(raw: string | number | null | undefined): number | null {
  if (raw === null || raw === undefined) return null;
  if (typeof raw === 'number') return isNaN(raw) ? null : raw;

  const str = String(raw).trim().toLowerCase();

  // cm
  const cmMatch = str.match(/^([\d.]+)\s*cm\b/);
  if (cmMatch) return Math.round(parseFloat(cmMatch[1]) * 10);

  // inches / in / "
  const inMatch = str.match(/^([\d.]+)\s*(?:inches?|in\b|")/);
  if (inMatch) return Math.round(parseFloat(inMatch[1]) * 25.4);

  // mm or bare number
  const mmMatch = str.match(/^([\d.]+)/);
  if (mmMatch) return Math.round(parseFloat(mmMatch[1]));

  return null;
}

// ============================================================================
// SANITY VALIDATOR
// ============================================================================

export interface SanityRule {
  field: string;
  min: number;
  max: number;
  unit: string;
  materials?: string[];
}

export const SANITY_RULES: SanityRule[] = [
  // Filament
  { field: 'nozzle_temp_min_c',       min: 150, max: 450,   unit: '°C' },
  { field: 'nozzle_temp_max_c',       min: 150, max: 500,   unit: '°C' },
  { field: 'bed_temp_min_c',          min: 0,   max: 150,   unit: '°C' },
  { field: 'bed_temp_max_c',          min: 0,   max: 200,   unit: '°C' },
  { field: 'diameter_nominal_mm',     min: 1.5, max: 3.2,   unit: 'mm' },
  { field: 'net_weight_g',            min: 100, max: 10000, unit: 'g' },
  { field: 'variant_price',           min: 1,   max: 500,   unit: 'USD' },
  { field: 'tensile_strength_xy_mpa', min: 10,  max: 200,   unit: 'MPa' },
  { field: 'print_speed_max_mms',     min: 10,  max: 1000,  unit: 'mm/s' },
  { field: 'drying_temp_c',           min: 40,  max: 120,   unit: '°C' },
  { field: 'drying_time_hours',       min: 1,   max: 48,    unit: 'h' },
  { field: 'transmission_distance',   min: 0.01,max: 10.0,  unit: 'mm' },
  // Printer
  { field: 'build_volume_x_mm',       min: 50,  max: 2000,  unit: 'mm' },
  { field: 'build_volume_y_mm',       min: 50,  max: 2000,  unit: 'mm' },
  { field: 'build_volume_z_mm',       min: 50,  max: 2000,  unit: 'mm' },
  { field: 'max_nozzle_temp_c',       min: 180, max: 500,   unit: '°C' },
  { field: 'max_print_speed_mms',     min: 20,  max: 1500,  unit: 'mm/s' },
  { field: 'current_price_usd_store', min: 50,  max: 100000,unit: 'USD' },
];

export interface SanityResult {
  value: number | null;
  isSuspect: boolean;
  reason?: string;
}

/**
 * Check a numeric value against sanity bounds.
 * Returns the value + suspect flag. Suspect values are set to null.
 */
export function sanitizeValue(
  field: string,
  value: number | null,
  context?: string,
): SanityResult {
  if (value === null || value === undefined) return { value: null, isSuspect: false };

  const rule = SANITY_RULES.find(r => r.field === field);
  if (!rule) return { value, isSuspect: false };

  if (value < rule.min || value > rule.max) {
    const reason = `${field}=${value}${rule.unit} out of range [${rule.min}–${rule.max}]${context ? ` (${context})` : ''}`;
    console.warn(`[sanity] SUSPECT: ${reason}`);
    return { value: null, isSuspect: true, reason };
  }

  return { value, isSuspect: false };
}

/**
 * Run all sanity checks on a record object in-place.
 * Nullifies any fields that fail sanity checks and returns a list of issues.
 */
export function sanitizeRecord(
  record: Record<string, unknown>,
  context?: string,
): { field: string; original: number; reason: string }[] {
  const issues: { field: string; original: number; reason: string }[] = [];

  for (const rule of SANITY_RULES) {
    const val = record[rule.field];
    if (typeof val !== 'number') continue;

    const result = sanitizeValue(rule.field, val, context);
    if (result.isSuspect) {
      issues.push({ field: rule.field, original: val, reason: result.reason! });
      record[rule.field] = null;
    }
  }

  return issues;
}

// ============================================================================
// COMPOSITE NORMALIZER
// ============================================================================

/**
 * Normalize a raw scraped record using all relevant normalization functions.
 * Applies sanity checks and returns cleaned data ready for DB insertion.
 * Alias: normalizeScrapedFields (used by global-brand-sync)
 */
export function normalizeFilamentRecord(raw: Record<string, unknown>): Record<string, unknown> {
  const out: Record<string, unknown> = { ...raw };

  // Temperatures
  if (raw.nozzle_temp_min_c !== undefined)
    out.nozzle_temp_min_c = normalizeTemp(raw.nozzle_temp_min_c as string);
  if (raw.nozzle_temp_max_c !== undefined)
    out.nozzle_temp_max_c = normalizeTemp(raw.nozzle_temp_max_c as string);
  if (raw.bed_temp_min_c !== undefined)
    out.bed_temp_min_c = normalizeTemp(raw.bed_temp_min_c as string);
  if (raw.bed_temp_max_c !== undefined)
    out.bed_temp_max_c = normalizeTemp(raw.bed_temp_max_c as string);
  if (raw.drying_temp_c !== undefined)
    out.drying_temp_c = normalizeTemp(raw.drying_temp_c as string);

  // Weight
  if (raw.net_weight_g !== undefined)
    out.net_weight_g = normalizeWeightToGrams(raw.net_weight_g as string);

  // Speed
  if (raw.print_speed_max_mms !== undefined)
    out.print_speed_max_mms = normalizeSpeedToMms(raw.print_speed_max_mms as string);

  // Diameter
  if (raw.diameter_nominal_mm !== undefined)
    out.diameter_nominal_mm = normalizeDiameter(raw.diameter_nominal_mm as string);

  // Material
  if (raw.material !== undefined && typeof raw.material === 'string')
    out.material = normalizeMaterial(raw.material) ?? raw.material;

  // Color hex
  if (raw.color_hex !== undefined)
    out.color_hex = normalizeColorHex(raw.color_hex as string);

  // Price
  if (raw.variant_price !== undefined)
    out.variant_price = normalizePrice(raw.variant_price as string);

  // Mechanical
  if (raw.tensile_strength_xy_mpa !== undefined)
    out.tensile_strength_xy_mpa = normalizeToMpa(raw.tensile_strength_xy_mpa as string);

  // Sanity check all numeric fields
  sanitizeRecord(out as Record<string, unknown>);

  return out;
}

/** Alias for normalizeFilamentRecord — used by global-brand-sync and other callers. */
export const normalizeScrapedFields = normalizeFilamentRecord;
