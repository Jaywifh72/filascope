// AI Role definitions based on issue types for Post Sync Check
// Split from main index.ts to reduce file size

import { CheckResult } from './types.ts';

export interface AIRole {
  title: string;
  triggers: string[];
  capabilities: string[];
  lessons?: string[];
}

// AI Role definitions based on issue types
export const AI_ROLES: Record<string, AIRole> = {
  dataEngineer: {
    title: 'Lead Data Engineer',
    triggers: ['bulk', 'sample', '2.85mm', 'weight', 'diameter', 'filtering'],
    capabilities: [
      'Data validation pipeline design and implementation',
      'Schema optimization and filtering logic',
      'Weight/diameter constraint enforcement',
      'Database query optimization',
      'Bulk data processing strategies'
    ]
  },
  scrapingEngineer: {
    title: 'Senior Web Scraping Engineer',
    triggers: ['title', 'url', 'scrape', 'page', 'consistency', 'mismatch'],
    capabilities: [
      'HTML parsing and DOM traversal',
      'Shopify/e-commerce site structure analysis',
      'Anti-bot detection avoidance strategies',
      'Dynamic content extraction',
      'Rate limiting and retry strategies'
    ]
  },
  colorSpecialist: {
    title: 'Color Data Specialist',
    triggers: ['color', 'swatch', 'hex', 'uniqueness'],
    capabilities: [
      'Color name extraction and normalization',
      'Hex code mapping and validation',
      'Swatch architecture analysis (CSS vs image-based)',
      'Cross-product color linking logic',
      'Color family categorization'
    ]
  },
  pricingAnalyst: {
    title: 'E-Commerce Pricing Analyst',
    triggers: ['price', 'validity', 'currency'],
    capabilities: [
      'Price extraction and validation',
      'Currency conversion and normalization',
      'Compare-at-price logic',
      'Price anomaly detection',
      'Multi-region pricing strategies'
    ]
  },
};

/**
 * Determine the best AI role based on the types of issues found
 */
export function determineAIRoleFromChecks(checks: CheckResult[], brandSlug: string): AIRole {
  const failedChecks = checks.filter(c => c.status === 'fail');
  
  // Check for specific issue types
  const hasColorIssues = failedChecks.some(c => 
    c.checkName.toLowerCase().includes('color') || 
    c.checkName.toLowerCase().includes('hex') ||
    c.checkName.toLowerCase().includes('swatch')
  );
  
  const hasPriceIssues = failedChecks.some(c => 
    c.checkName.toLowerCase().includes('price')
  );
  
  const hasStructuralIssues = failedChecks.some(c => 
    c.checkName.toLowerCase().includes('product line') ||
    c.checkName.toLowerCase().includes('card count') ||
    c.checkName.toLowerCase().includes('grouping')
  );
  
  if (hasColorIssues) return AI_ROLES.colorSpecialist;
  if (hasPriceIssues) return AI_ROLES.pricingAnalyst;
  if (hasStructuralIssues) return AI_ROLES.dataEngineer;
  
  return AI_ROLES.scrapingEngineer;
}
