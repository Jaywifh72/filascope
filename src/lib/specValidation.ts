/**
 * Validation ranges for physical filament properties.
 * Values outside these ranges are flagged as suspect (likely data import errors).
 */

export interface SpecValidationResult {
  isSuspect: boolean;
  warningMessage: string | null;
}

const VALIDATION_RANGES: Record<string, { min: number; max: number; unit: string }> = {
  spool_outer_diameter: { min: 100, max: 350, unit: 'mm' },
  spool_width:          { min: 30,  max: 120, unit: 'mm' },
  net_weight:           { min: 100, max: 10000, unit: 'g' },
};

/** Valid nominal diameters with ±0.1mm tolerance */
const VALID_DIAMETERS = [1.75, 2.85];
const DIAMETER_TOLERANCE = 0.1;

/**
 * Check whether a physical spec value falls outside its expected range.
 */
export function validateSpec(
  field: keyof typeof VALIDATION_RANGES,
  value: number | null | undefined
): SpecValidationResult {
  if (value == null) return { isSuspect: false, warningMessage: null };

  const range = VALIDATION_RANGES[field];
  if (!range) return { isSuspect: false, warningMessage: null };

  if (value < range.min || value > range.max) {
    return {
      isSuspect: true,
      warningMessage: `Value seems unusually ${value > range.max ? 'high' : 'low'} — please verify (expected ${range.min}–${range.max}${range.unit})`,
    };
  }

  return { isSuspect: false, warningMessage: null };
}

/**
 * Check whether a filament diameter is a standard size (1.75 or 2.85mm ±0.1).
 */
export function validateDiameter(value: number | null | undefined): SpecValidationResult {
  if (value == null) return { isSuspect: false, warningMessage: null };

  const isValid = VALID_DIAMETERS.some(
    (d) => Math.abs(value - d) <= DIAMETER_TOLERANCE
  );

  if (!isValid) {
    return {
      isSuspect: true,
      warningMessage: `Non-standard diameter — expected 1.75mm or 2.85mm`,
    };
  }

  return { isSuspect: false, warningMessage: null };
}
