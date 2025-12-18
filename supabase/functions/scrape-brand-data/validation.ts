import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";

// Valid filament diameters (industry standards)
const VALID_DIAMETERS = [1.75, 2.85, 3.0] as const;

// Scraped product validation schema
export const ScrapedProductSchema = z.object({
  productId: z.string().min(1, "Product ID required"),
  title: z.string().min(1, "Title required").max(500, "Title too long"),
  sku: z.string().nullable(),
  
  // Price validation: positive and reasonable (< $10,000)
  price: z.number()
    .positive("Price must be positive")
    .max(9999.99, "Price exceeds $10,000 limit")
    .nullable(),
  compareAtPrice: z.number()
    .positive("Compare-at price must be positive")
    .max(9999.99, "Compare-at price exceeds limit")
    .nullable(),
  
  available: z.boolean(),
  currency: z.string().default("USD"),
  url: z.string().url("Invalid URL"),
  scrapedAt: z.date(),
  source: z.string(),
  
  // Enhanced fields
  imageUrl: z.string().url().nullable(),
  barcode: z.string().nullable(),
  description: z.string().nullable(),
  mpn: z.string().nullable(),
  tdsUrl: z.string().url().nullable().or(z.literal(null)),
  
  // Color
  colorHex: z.string()
    .regex(/^#[0-9A-Fa-f]{6}$/, "Invalid hex color format")
    .nullable()
    .or(z.literal(null)),
  colorName: z.string().nullable(),
  
  // Diameter: must be standard size (1.75, 2.85, or 3.0mm)
  diameterMm: z.number()
    .refine(
      (d) => d === null || VALID_DIAMETERS.includes(d as typeof VALID_DIAMETERS[number]),
      { message: "Diameter must be 1.75, 2.85, or 3.0mm" }
    )
    .nullable(),
  
  // Temperature ranges with bounds checking
  nozzleTempMin: z.number().int().min(100).max(500).nullable(),
  nozzleTempMax: z.number().int().min(100).max(500).nullable(),
  bedTempMin: z.number().int().min(0).max(200).nullable(),
  bedTempMax: z.number().int().min(0).max(200).nullable(),
  
  // Physical specs
  spoolMaterial: z.string().nullable(),
  netWeightG: z.number().int().positive().max(50000).nullable(),
  
  // Spool dimensions
  spoolOuterDiameterMm: z.number().positive().max(500).nullable(),
  spoolWidthMm: z.number().positive().max(200).nullable(),
}).refine(
  (data) => {
    // Validate nozzle temperature range: min <= max
    if (data.nozzleTempMin !== null && data.nozzleTempMax !== null) {
      if (data.nozzleTempMin > data.nozzleTempMax) {
        return false;
      }
    }
    return true;
  },
  { message: "Nozzle temp min must be <= max", path: ["nozzleTempMin"] }
).refine(
  (data) => {
    // Validate bed temperature range: min <= max
    if (data.bedTempMin !== null && data.bedTempMax !== null) {
      if (data.bedTempMin > data.bedTempMax) {
        return false;
      }
    }
    return true;
  },
  { message: "Bed temp min must be <= max", path: ["bedTempMin"] }
);

export type ValidatedProduct = z.infer<typeof ScrapedProductSchema>;

// Validation result interface
export interface ValidationResult {
  valid: boolean;
  data?: ValidatedProduct;
  errors?: string[];
}

/**
 * Validate a scraped product against the schema
 * Returns typed, validated data or error messages
 */
export function validateScrapedProduct(product: unknown): ValidationResult {
  const result = ScrapedProductSchema.safeParse(product);
  
  if (result.success) {
    return { valid: true, data: result.data };
  }
  
  return {
    valid: false,
    errors: result.error.errors.map(e => `${e.path.join('.')}: ${e.message}`)
  };
}

/**
 * Validate an array of products and return both valid and invalid
 * Useful for batch processing with partial success
 */
export function validateProductBatch(products: unknown[]): {
  valid: ValidatedProduct[];
  invalid: Array<{ index: number; product: unknown; errors: string[] }>;
  stats: { total: number; passed: number; failed: number };
} {
  const valid: ValidatedProduct[] = [];
  const invalid: Array<{ index: number; product: unknown; errors: string[] }> = [];
  
  products.forEach((product, index) => {
    const result = validateScrapedProduct(product);
    if (result.valid && result.data) {
      valid.push(result.data);
    } else {
      invalid.push({ index, product, errors: result.errors || ["Unknown validation error"] });
    }
  });
  
  return {
    valid,
    invalid,
    stats: {
      total: products.length,
      passed: valid.length,
      failed: invalid.length
    }
  };
}

/**
 * Sanitize a scraped product to fix common issues before validation
 * This applies safe transformations to make data more likely to pass validation
 */
export function sanitizeScrapedProduct(product: Record<string, unknown>): Record<string, unknown> {
  const sanitized = { ...product };
  
  // Normalize hex color (ensure # prefix, uppercase)
  if (sanitized.colorHex && typeof sanitized.colorHex === 'string') {
    let hex = sanitized.colorHex.trim().toUpperCase();
    if (!hex.startsWith('#')) hex = '#' + hex;
    // Expand 3-char hex to 6-char
    if (/^#[0-9A-F]{3}$/.test(hex)) {
      hex = '#' + hex[1] + hex[1] + hex[2] + hex[2] + hex[3] + hex[3];
    }
    sanitized.colorHex = /^#[0-9A-F]{6}$/.test(hex) ? hex : null;
  }
  
  // Clamp diameter to nearest valid value
  if (typeof sanitized.diameterMm === 'number') {
    const d = sanitized.diameterMm;
    if (d >= 1.5 && d < 2.3) sanitized.diameterMm = 1.75;
    else if (d >= 2.3 && d < 2.95) sanitized.diameterMm = 2.85;
    else if (d >= 2.95 && d <= 3.1) sanitized.diameterMm = 3.0;
    else sanitized.diameterMm = null;
  }
  
  // Ensure temperature order (swap if reversed)
  if (typeof sanitized.nozzleTempMin === 'number' && typeof sanitized.nozzleTempMax === 'number') {
    if (sanitized.nozzleTempMin > sanitized.nozzleTempMax) {
      [sanitized.nozzleTempMin, sanitized.nozzleTempMax] = [sanitized.nozzleTempMax, sanitized.nozzleTempMin];
    }
  }
  if (typeof sanitized.bedTempMin === 'number' && typeof sanitized.bedTempMax === 'number') {
    if (sanitized.bedTempMin > sanitized.bedTempMax) {
      [sanitized.bedTempMin, sanitized.bedTempMax] = [sanitized.bedTempMax, sanitized.bedTempMin];
    }
  }
  
  // Clamp unreasonable prices
  if (typeof sanitized.price === 'number' && sanitized.price >= 10000) {
    sanitized.price = null;
  }
  if (typeof sanitized.compareAtPrice === 'number' && sanitized.compareAtPrice >= 10000) {
    sanitized.compareAtPrice = null;
  }
  
  return sanitized;
}
