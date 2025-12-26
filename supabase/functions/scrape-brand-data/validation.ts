/**
 * DEPRECATED: Use '../_shared/scraper-validation.ts' instead
 * 
 * This file is kept for backwards compatibility only.
 * All validation logic has been consolidated into the shared module.
 * 
 * Migration: Replace imports from './validation.ts' with:
 * import { 
 *   validateScrapedProduct, 
 *   validateScrapedProductStrict,
 *   validateProductBatch,
 *   sanitizeScrapedProduct,
 *   ScrapedProductSchema,
 *   type ValidatedProduct,
 *   type ValidationResult,
 * } from '../_shared/scraper-validation.ts';
 */

// Re-export everything from shared module for backwards compatibility
export { 
  ScrapedProductSchema,
  validateScrapedProduct,
  validateScrapedProductStrict,
  validateProductBatch,
  sanitizeScrapedProduct,
  type ValidatedProduct,
  type ValidationResult,
  type ZodValidationResult,
} from '../_shared/scraper-validation.ts';

// Legacy alias for backwards compatibility
export { validateScrapedProductStrict as validateScrapedProductZod } from '../_shared/scraper-validation.ts';
