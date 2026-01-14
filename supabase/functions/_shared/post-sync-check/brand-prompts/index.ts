// Brand Prompts Index - Routes to brand-specific prompt generators

import { CheckResult } from '../types.ts';
import { generateZiroFixPrompt } from './ziro-prompt.ts';

// Re-export individual generators for direct import if needed
export { generateZiroFixPrompt } from './ziro-prompt.ts';

/**
 * Route to the appropriate brand-specific prompt generator
 * Returns null if no custom generator exists for this brand
 */
export function getBrandFixPrompt(
  brandSlug: string,
  checks: CheckResult[],
  totalProducts: number
): string | null {
  switch (brandSlug) {
    case 'ziro':
      return generateZiroFixPrompt(checks, totalProducts);
    
    // Future brand prompts will be added here as they're extracted:
    // case 'bambu-lab':
    //   return generateBambuLabFixPrompt(checks, totalProducts);
    // case 'sunlu':
    //   return generateSunluFixPrompt(checks, totalProducts);
    // case 'ultimaker':
    //   return generateUltimakerFixPrompt(checks, totalProducts);
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
