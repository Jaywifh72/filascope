/**
 * UNIFIED SCRAPER VALIDATION MODULE
 * 
 * Single source of truth for all scraped product interfaces and validation.
 * All scrapers MUST import ScrapedProduct from this file for consistency.
 * 
 * Consolidates:
 * - ScrapedProduct interface (from scrapers/base.ts)
 * - Validation functions (from scrape-brand-data/validation.ts)
 * - Sanitization utilities
 */

import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";
import { 
  REGION_CURRENCIES, 
  type RegionCode,
  FILAMENT_SCHEMA 
} from './filament-schema.ts';

// ============================================================================
// SCRAPED PRODUCT INTERFACE - UNIFIED FOR ALL SCRAPERS
// ============================================================================

/**
 * Standard interface for products returned by all scrapers.
 * All scrapers MUST return data in this format for consistency.
 * 
 * This interface consolidates fields from:
 * - scrape-brand-data/scrapers/base.ts
 * - sync-brand-products requirements
 * - sync-elegoo-products requirements
 * - sync-bambulab-colors requirements
 */
export interface ScrapedProduct {
  // === Required Fields ===
  productId: string;
  title: string;
  
  // === Pricing ===
  price: number | null;
  compareAtPrice?: number | null;
  currency?: string;
  
  // === URLs ===
  url: string | null;
  imageUrl?: string | null;
  tdsUrl?: string | null;
  
  // === Product Info ===
  material?: string | null;
  colorFamily?: string | null;
  colorHex?: string | null;
  colorName?: string | null;
  netWeightG?: number | null;
  productLineId?: string | null;
  description?: string | null;
  
  // === Identifiers ===
  mpn?: string | null;
  sku?: string | null;
  barcode?: string | null;
  
  // === Print Settings ===
  nozzleTempMin?: number | null;
  nozzleTempMax?: number | null;
  bedTempMin?: number | null;
  bedTempMax?: number | null;
  
  // === Physical Specs ===
  diameterMm?: number | null;
  spoolMaterial?: string | null;
  spoolOuterDiameterMm?: number | null;
  spoolWidthMm?: number | null;
  
  // === Availability ===
  available?: boolean;
  
  // === Regional Context ===
  region?: string;
  
  // === Metadata ===
  scrapedAt?: Date;
  source?: string;
}

// ============================================================================
// ZOD VALIDATION SCHEMA
// ============================================================================

// Valid filament diameters (industry standards)
const VALID_DIAMETERS = [1.75, 2.85, 3.0] as const;

/**
 * Zod schema for comprehensive product validation
 * Used for strict validation before database insertion
 */
export const ScrapedProductSchema = z.object({
  productId: z.string().min(1, "Product ID required"),
  title: z.string().min(1, "Title required").max(500, "Title too long"),
  sku: z.string().nullable().optional(),
  
  // Price validation: positive and reasonable (< $10,000)
  price: z.number()
    .positive("Price must be positive")
    .max(9999.99, "Price exceeds $10,000 limit")
    .nullable(),
  compareAtPrice: z.number()
    .positive("Compare-at price must be positive")
    .max(9999.99, "Compare-at price exceeds limit")
    .nullable()
    .optional(),
  
  available: z.boolean().optional(),
  currency: z.string().default("USD").optional(),
  url: z.string().url("Invalid URL").nullable(),
  scrapedAt: z.date().optional(),
  source: z.string().optional(),
  
  // Enhanced fields
  imageUrl: z.string().url().nullable().optional(),
  barcode: z.string().nullable().optional(),
  description: z.string().nullable().optional(),
  mpn: z.string().nullable().optional(),
  tdsUrl: z.string().url().nullable().optional().or(z.literal(null)),
  
  // Material
  material: z.string().nullable().optional(),
  
  // Color
  colorHex: z.string()
    .regex(/^#[0-9A-Fa-f]{6}$/, "Invalid hex color format")
    .nullable()
    .optional()
    .or(z.literal(null)),
  colorName: z.string().nullable().optional(),
  colorFamily: z.string().nullable().optional(),
  
  // Diameter: must be standard size (1.75, 2.85, or 3.0mm)
  diameterMm: z.number()
    .refine(
      (d) => d === null || d === undefined || VALID_DIAMETERS.includes(d as typeof VALID_DIAMETERS[number]),
      { message: "Diameter must be 1.75, 2.85, or 3.0mm" }
    )
    .nullable()
    .optional(),
  
  // Temperature ranges with bounds checking
  nozzleTempMin: z.number().int().min(100).max(500).nullable().optional(),
  nozzleTempMax: z.number().int().min(100).max(500).nullable().optional(),
  bedTempMin: z.number().int().min(0).max(200).nullable().optional(),
  bedTempMax: z.number().int().min(0).max(200).nullable().optional(),
  
  // Physical specs
  spoolMaterial: z.string().nullable().optional(),
  netWeightG: z.number().int().positive().max(50000).nullable().optional(),
  
  // Spool dimensions
  spoolOuterDiameterMm: z.number().positive().max(500).nullable().optional(),
  spoolWidthMm: z.number().positive().max(200).nullable().optional(),
  
  // Product organization
  productLineId: z.string().nullable().optional(),
  
  // Region
  region: z.string().optional(),
}).refine(
  (data) => {
    // Validate nozzle temperature range: min <= max
    if (data.nozzleTempMin !== null && data.nozzleTempMin !== undefined && 
        data.nozzleTempMax !== null && data.nozzleTempMax !== undefined) {
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
    if (data.bedTempMin !== null && data.bedTempMin !== undefined && 
        data.bedTempMax !== null && data.bedTempMax !== undefined) {
      if (data.bedTempMin > data.bedTempMax) {
        return false;
      }
    }
    return true;
  },
  { message: "Bed temp min must be <= max", path: ["bedTempMin"] }
);

export type ValidatedProduct = z.infer<typeof ScrapedProductSchema>;

// ============================================================================
// VALIDATION RESULT INTERFACES
// ============================================================================

export interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

export interface ZodValidationResult {
  valid: boolean;
  data?: ValidatedProduct;
  errors?: string[];
}

// ============================================================================
// VALIDATION FUNCTIONS
// ============================================================================

/**
 * Validate a scraped product against the unified schema
 * Returns detailed errors and warnings for debugging
 */
export function validateScrapedProduct(product: ScrapedProduct): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  
  // === Required field validation ===
  if (!product.productId || product.productId.trim() === '') {
    errors.push('Missing or empty productId');
  }
  
  if (!product.title || product.title.trim() === '') {
    errors.push('Missing or empty title');
  }
  
  // === Price validation ===
  if (product.price !== null && product.price !== undefined) {
    if (typeof product.price !== 'number' || isNaN(product.price)) {
      errors.push(`Invalid price type: ${typeof product.price}`);
    } else if (product.price < 0) {
      errors.push(`Negative price: ${product.price}`);
    } else if (product.price > 1000 && product.currency !== 'JPY') {
      warnings.push(`Unusually high price: ${product.price} (expected < 1000 for non-JPY)`);
    }
  }
  
  // === Material validation ===
  if (product.material) {
    const materialField = FILAMENT_SCHEMA.find(f => f.key === 'material');
    const allowedMaterials = materialField?.validation?.allowedValues || [];
    
    if (allowedMaterials.length > 0 && !allowedMaterials.includes(product.material)) {
      warnings.push(`Unknown material: ${product.material}. Allowed: ${allowedMaterials.join(', ')}`);
    }
  }
  
  // === Color family validation ===
  if (product.colorFamily) {
    const colorField = FILAMENT_SCHEMA.find(f => f.key === 'color_family');
    const allowedColors = colorField?.validation?.allowedValues || [];
    
    if (allowedColors.length > 0 && !allowedColors.includes(product.colorFamily)) {
      warnings.push(`Unknown color family: ${product.colorFamily}`);
    }
  }
  
  // === Color hex validation ===
  if (product.colorHex) {
    const hexPattern = /^#?[0-9A-Fa-f]{6}$/;
    if (!hexPattern.test(product.colorHex)) {
      warnings.push(`Invalid color hex format: ${product.colorHex}`);
    }
  }
  
  // === URL validation ===
  if (product.url) {
    try {
      new URL(product.url);
    } catch {
      errors.push(`Invalid product URL: ${product.url}`);
    }
  }
  
  if (product.imageUrl) {
    try {
      new URL(product.imageUrl);
    } catch {
      warnings.push(`Invalid image URL: ${product.imageUrl}`);
    }
  }
  
  if (product.tdsUrl) {
    try {
      new URL(product.tdsUrl);
    } catch {
      warnings.push(`Invalid TDS URL: ${product.tdsUrl}`);
    }
  }
  
  // === Temperature validation ===
  if (product.nozzleTempMin !== null && product.nozzleTempMin !== undefined) {
    if (product.nozzleTempMin < 100 || product.nozzleTempMin > 400) {
      warnings.push(`Unusual nozzle temp min: ${product.nozzleTempMin}°C`);
    }
  }
  
  if (product.nozzleTempMax !== null && product.nozzleTempMax !== undefined) {
    if (product.nozzleTempMax < 100 || product.nozzleTempMax > 450) {
      warnings.push(`Unusual nozzle temp max: ${product.nozzleTempMax}°C`);
    }
  }
  
  if (product.nozzleTempMin && product.nozzleTempMax && product.nozzleTempMin > product.nozzleTempMax) {
    errors.push(`Nozzle temp min (${product.nozzleTempMin}) > max (${product.nozzleTempMax})`);
  }
  
  if (product.bedTempMin && product.bedTempMax && product.bedTempMin > product.bedTempMax) {
    errors.push(`Bed temp min (${product.bedTempMin}) > max (${product.bedTempMax})`);
  }
  
  // === Weight validation ===
  if (product.netWeightG !== null && product.netWeightG !== undefined) {
    if (product.netWeightG < 100 || product.netWeightG > 10000) {
      warnings.push(`Unusual weight: ${product.netWeightG}g (expected 100-10000)`);
    }
  }
  
  // === Diameter validation ===
  if (product.diameterMm !== null && product.diameterMm !== undefined) {
    if (![1.75, 2.85, 3.0].includes(product.diameterMm)) {
      warnings.push(`Non-standard diameter: ${product.diameterMm}mm (expected 1.75, 2.85, or 3.0)`);
    }
  }
  
  // === Region/Currency validation ===
  if (product.region && product.currency) {
    const expectedCurrency = REGION_CURRENCIES[product.region as RegionCode];
    if (expectedCurrency && product.currency !== expectedCurrency) {
      warnings.push(`Currency mismatch: ${product.currency} for region ${product.region} (expected ${expectedCurrency})`);
    }
  }
  
  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * Strict Zod-based validation for database insertion
 * Returns typed, validated data or error messages
 */
export function validateScrapedProductStrict(product: unknown): ZodValidationResult {
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
 * Validate a batch of scraped products
 */
export function validateScrapedProducts(products: ScrapedProduct[]): {
  validCount: number;
  invalidCount: number;
  totalWarnings: number;
  results: Array<{ product: ScrapedProduct; validation: ValidationResult }>;
} {
  const results = products.map(product => ({
    product,
    validation: validateScrapedProduct(product),
  }));
  
  return {
    validCount: results.filter(r => r.validation.valid).length,
    invalidCount: results.filter(r => !r.validation.valid).length,
    totalWarnings: results.reduce((sum, r) => sum + r.validation.warnings.length, 0),
    results,
  };
}

/**
 * Validate an array of products with strict Zod validation
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
    const result = validateScrapedProductStrict(product);
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
 * Validate regional price against expected currency
 */
export function validateRegionalPrice(price: number, region: string, currency?: string): boolean {
  const expectedCurrency = REGION_CURRENCIES[region as RegionCode];
  
  if (!expectedCurrency) {
    console.warn(`Unknown region for price validation: ${region}`);
    return true; // Allow unknown regions
  }
  
  // If currency is provided, verify it matches
  if (currency && currency !== expectedCurrency) {
    console.warn(`Currency mismatch: ${currency} for region ${region} (expected ${expectedCurrency})`);
    return false;
  }
  
  // Validate price range based on currency
  const priceRanges: Record<string, [number, number]> = {
    USD: [0, 500],
    CAD: [0, 700],
    GBP: [0, 400],
    EUR: [0, 500],
    AUD: [0, 800],
    JPY: [0, 50000],
  };
  
  const range = priceRanges[expectedCurrency];
  if (range && (price < range[0] || price > range[1])) {
    console.warn(`Price ${price} ${expectedCurrency} outside expected range ${range[0]}-${range[1]}`);
    return false;
  }
  
  return true;
}

// ============================================================================
// SANITIZATION UTILITIES
// ============================================================================

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
  
  // Normalize URL fields (trim whitespace)
  if (typeof sanitized.url === 'string') {
    sanitized.url = sanitized.url.trim() || null;
  }
  if (typeof sanitized.imageUrl === 'string') {
    sanitized.imageUrl = sanitized.imageUrl.trim() || null;
  }
  if (typeof sanitized.tdsUrl === 'string') {
    sanitized.tdsUrl = sanitized.tdsUrl.trim() || null;
  }
  
  return sanitized;
}

/**
 * Normalize a ScrapedProduct before database insertion
 * Applies sanitization and returns a clean object
 */
export function normalizeScrapedProduct(product: ScrapedProduct): ScrapedProduct {
  const sanitized = sanitizeScrapedProduct(product as unknown as Record<string, unknown>);
  return sanitized as unknown as ScrapedProduct;
}
