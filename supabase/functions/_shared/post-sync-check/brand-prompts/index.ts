// Brand Prompts Index - Routes to brand-specific prompt generators

import { CheckResult } from '../types.ts';
import { generateZiroFixPrompt } from './ziro-prompt.ts';
import { generateRecreusFixPrompt } from './recreus-prompt.ts';
import { generateVoxelPLAFixPrompt } from './voxelpla-prompt.ts';
import { generateSunluFixPrompt } from './sunlu-prompt.ts';
import { generateSpectrumFilamentsFixPrompt } from './spectrum-prompt.ts';
import { generateGenericFixPrompt, determineAIRole } from './generic-prompt.ts';

// Re-export individual generators for direct import if needed
export { generateZiroFixPrompt } from './ziro-prompt.ts';
export { generateRecreusFixPrompt } from './recreus-prompt.ts';
export { generateVoxelPLAFixPrompt } from './voxelpla-prompt.ts';
export { generateSunluFixPrompt } from './sunlu-prompt.ts';
export { generateSpectrumFilamentsFixPrompt } from './spectrum-prompt.ts';
export { generateGenericFixPrompt, determineAIRole } from './generic-prompt.ts';

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
    swatchType?: string;
    rootCause?: string;
    wrongDecisions?: string[];
    correctBehavior?: string;
    missingReason?: string;
    fixCode?: string;
    colorMappings?: Record<string, string>;
  } | null;
}

/**
 * Route to the appropriate brand-specific prompt generator
 * Returns the generated prompt, or falls back to generic prompt
 */
export function getBrandFixPrompt(
  brandSlug: string,
  brandName: string,
  checks: CheckResult[],
  totalProducts: number,
  context?: BrandPromptContext
): string | null {
  const failedChecks = checks.filter(c => c.status === 'fail');
  const warningChecks = checks.filter(c => c.status === 'warning');
  
  // If no issues, return null (no prompt needed)
  if (failedChecks.length === 0 && warningChecks.length === 0) {
    return null;
  }

  switch (brandSlug) {
    case 'ziro':
      return generateZiroFixPrompt(
        checks, 
        totalProducts,
        context?.aiAnalysis ? {
          swatchArchitecture: context.aiAnalysis.swatchArchitecture,
          rootCauseAnalysis: context.aiAnalysis.rootCauseAnalysis,
          missingColors: context.aiAnalysis.missingColors,
          extractionPattern: context.aiAnalysis.extractionPattern
        } : null,
        {
          expectedCardCount: context?.expectedCardCount,
          actualCardCount: context?.actualCardCount,
          productLineIds: context?.productLineIds
        }
      );
    
    case 'recreus':
      return generateRecreusFixPrompt(
        brandName,
        checks,
        totalProducts,
        context?.aiAnalysis ? {
          swatchType: context.aiAnalysis.swatchType,
          rootCause: context.aiAnalysis.rootCause,
          wrongDecisions: context.aiAnalysis.wrongDecisions,
          correctBehavior: context.aiAnalysis.correctBehavior
        } : null
      );
    
    case 'voxelpla':
      return generateVoxelPLAFixPrompt(
        brandName,
        checks,
        totalProducts,
        context?.aiAnalysis ? {
          swatchType: context.aiAnalysis.swatchType,
          rootCause: context.aiAnalysis.rootCause,
          wrongDecisions: context.aiAnalysis.wrongDecisions,
          correctBehavior: context.aiAnalysis.correctBehavior
        } : null
      );
    
    case 'sunlu':
      return generateSunluFixPrompt(
        brandName,
        checks,
        totalProducts,
        context?.aiAnalysis ? {
          swatchType: context.aiAnalysis.swatchType,
          rootCause: context.aiAnalysis.rootCause,
          wrongDecisions: context.aiAnalysis.wrongDecisions,
          correctBehavior: context.aiAnalysis.correctBehavior
        } : null
      );
    
    case 'spectrum-filaments':
      return generateSpectrumFilamentsFixPrompt(
        brandName,
        checks,
        totalProducts,
        context?.aiAnalysis ? {
          swatchType: context.aiAnalysis.swatchType,
          rootCause: context.aiAnalysis.rootCause,
          wrongDecisions: context.aiAnalysis.wrongDecisions,
          correctBehavior: context.aiAnalysis.correctBehavior
        } : null
      );
    
    default:
      // Fall back to generic prompt for brands without specific generators
      return generateGenericFixPrompt(
        brandName,
        brandSlug,
        checks,
        totalProducts,
        context?.aiAnalysis
      );
  }
}

/**
 * Check if a brand has a custom prompt generator (vs using generic)
 */
export function hasBrandPromptGenerator(brandSlug: string): boolean {
  return MODULARIZED_BRANDS.includes(brandSlug as typeof MODULARIZED_BRANDS[number]);
}

/**
 * List of all brands that have been modularized to shared prompts
 * These can be removed from the main index.ts inline generators
 */
export const MODULARIZED_BRANDS = [
  'ziro',
  'recreus', 
  'voxelpla',
  'sunlu',
  'spectrum-filaments'
] as const;
