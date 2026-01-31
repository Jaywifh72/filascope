// Helper functions for Post Sync Check
// Split from main index.ts to reduce file size

import { CheckResult } from './types.ts';
import { 
  SCRAPER_BLOCKED_TITLES, 
  NON_COLOR_WORDS, 
  PRODUCT_LINE_SYNONYMS,
  SKIP_URL_CHECK_BRANDS,
  SKIP_TITLE_CHECK_BRANDS,
  SKIP_HEX_CHECK_BRANDS,
  SKIP_PRICE_CHECK_BRANDS,
} from './brand-config.ts';

/**
 * Check if a page title indicates the scraper was blocked
 */
export function isScraperBlockedTitle(title: string): boolean {
  const lowerTitle = title.toLowerCase();
  return SCRAPER_BLOCKED_TITLES.some(blocked => lowerTitle.includes(blocked));
}

/**
 * Extract color name from variant title
 */
export function extractColorFromVariant(variantTitle: string): string {
  // Remove common prefixes/suffixes
  let color = variantTitle
    .replace(/\s*-\s*1\.75mm.*$/i, '')
    .replace(/\s*-\s*1kg.*$/i, '')
    .replace(/\s*,\s*1\.75mm.*$/i, '')
    .replace(/\s*\(.*\)$/i, '')
    .trim();
  
  // If title has " - ", take the part after it
  if (color.includes(' - ')) {
    color = color.split(' - ').pop() || color;
  }
  
  // Filter out non-color words
  const words = color.split(/\s+/);
  const colorWords = words.filter(w => !NON_COLOR_WORDS.has(w.toLowerCase()));
  
  return colorWords.join(' ').trim() || color;
}

/**
 * Normalize product line name for comparison
 */
export function normalizeProductLineName(name: string): string {
  const lower = name.toLowerCase().trim();
  
  // Check synonyms
  for (const [canonical, synonyms] of Object.entries(PRODUCT_LINE_SYNONYMS)) {
    if (synonyms.some(syn => lower.includes(syn))) {
      return canonical;
    }
    if (lower.includes(canonical)) {
      return canonical;
    }
  }
  
  return lower;
}

/**
 * Check if a brand should skip URL consistency check
 */
export function shouldSkipUrlCheck(brandSlug: string): boolean {
  return SKIP_URL_CHECK_BRANDS.includes(brandSlug);
}

/**
 * Check if a brand should skip title check
 */
export function shouldSkipTitleCheck(brandSlug: string): boolean {
  return SKIP_TITLE_CHECK_BRANDS.includes(brandSlug);
}

/**
 * Check if a brand should skip hex validation
 */
export function shouldSkipHexCheck(brandSlug: string): boolean {
  return SKIP_HEX_CHECK_BRANDS.includes(brandSlug);
}

/**
 * Check if a brand should skip price check
 */
export function shouldSkipPriceCheck(brandSlug: string): boolean {
  return SKIP_PRICE_CHECK_BRANDS.includes(brandSlug);
}

/**
 * Calculate overall status from check results
 */
export function calculateOverallStatus(checks: CheckResult[]): 'pass' | 'warning' | 'fail' {
  const failCount = checks.filter(c => c.status === 'fail').length;
  const warnCount = checks.filter(c => c.status === 'warning').length;
  
  if (failCount > 0) return 'fail';
  if (warnCount > 0) return 'warning';
  return 'pass';
}

/**
 * Extract color from product title using various patterns
 */
export function extractColorFromTitle(title: string): string {
  // Pattern: "Product Name - Color Name" or "Product Name - Color Name, 1.75mm"
  const dashMatch = title.match(/\s+-\s+([^,]+)/);
  if (dashMatch) return dashMatch[1].trim().toLowerCase();
  
  // Pattern: "Product Name, Color Name, 1.75mm"
  const parts = title.split(',');
  if (parts.length >= 2) {
    const potentialColor = parts[1].trim();
    if (!/\d+\.\d+mm/i.test(potentialColor)) {
      return potentialColor.toLowerCase();
    }
  }
  
  // Return cleaned title as fallback
  return title.toLowerCase().replace(/[^a-z\s]/g, '').trim();
}
