// Brand Prompts Index - Routes to brand-specific prompt generators

import { CheckResult } from '../types.ts';
import { generateZiroFixPrompt } from './ziro-prompt.ts';

// Re-export individual generators for direct import if needed
export { generateZiroFixPrompt } from './ziro-prompt.ts';

/**
 * Extended context for brand-specific prompt generation
 */
export interface BrandPromptContext {
  expectedCardCount?: number;
  actualCardCount?: number;
  productLineIds?: string[];
  aiAnalysis?: {
    swatchArchitecture?: string;
    rootCauseAnalysis?: string;
    missingColors?: string[];
    extractionPattern?: string;
  } | null;
}

/**
 * Route to the appropriate brand-specific prompt generator
 * Returns null if no custom generator exists for this brand
 */
export function getBrandFixPrompt(
  brandSlug: string,
  checks: CheckResult[],
  totalProducts: number,
  context?: BrandPromptContext
): string | null {
  switch (brandSlug) {
    case 'ziro':
      return generateZiroFixPrompt(
        checks, 
        totalProducts,
        context?.aiAnalysis,
        {
          expectedCardCount: context?.expectedCardCount,
          actualCardCount: context?.actualCardCount,
          productLineIds: context?.productLineIds
        }
      );
    
    // Future brand prompts will be added here as they're extracted:
    // case 'bambu-lab':
    //   return generateBambuLabFixPrompt(checks, totalProducts, context);
    // case 'sunlu':
    //   return generateSunluFixPrompt(checks, totalProducts, context);
    // case 'ultimaker':
    //   return generateUltimakerFixPrompt(checks, totalProducts, context);
    // etc.
    
    default:
      return null;
  }
}

/**
 * Check if a brand has a custom prompt generator
 */
export function hasBrandPromptGenerator(brandSlug: string): boolean {
  const brandsWithPrompts = [
    'ziro',
    // Add more brands as they're extracted
  ];
  return brandsWithPrompts.includes(brandSlug);
}
