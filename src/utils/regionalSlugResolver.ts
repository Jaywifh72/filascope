/**
 * Regional Slug Resolution Utility
 * 
 * Handles resolving product slugs for different regional stores.
 * Products may have different slugs across regions (e.g., "hyper-pla-cf" vs "hyper-pla-carbon-fibre").
 */

import { supabase } from '@/integrations/supabase/client';
import { RegionCode } from '@/types/regional';

// ============================================================================
// Types
// ============================================================================

export interface RegionalSlugData {
  slug: string;
  verified: boolean;
  httpStatus: number | null;
  verifiedAt: string | null;
}

export interface SlugResolutionResult {
  effectiveSlug: string;
  isVerified: boolean;
  source: 'database' | 'primary' | 'fallback';
}

// ============================================================================
// Slug Variant Generation
// ============================================================================

/**
 * Common abbreviation expansions used in product slugs
 */
const ABBREVIATION_EXPANSIONS: Record<string, string[]> = {
  'cf': ['carbon-fiber', 'carbon-fibre'],
  'gf': ['glass-fiber', 'glass-fibre', 'glass-filled'],
  'hf': ['high-flow', 'hyper-flow'],
  'hs': ['high-speed', 'hyper-speed'],
  'ht': ['high-temp', 'high-temperature'],
  'lt': ['low-temp', 'low-temperature'],
  'pro': ['professional'],
  'std': ['standard'],
  'abs': ['acrylonitrile-butadiene-styrene'],
  'pla': ['polylactic-acid'],
  'petg': ['polyethylene-terephthalate-glycol'],
  'asa': ['acrylonitrile-styrene-acrylate'],
  'tpu': ['thermoplastic-polyurethane'],
  'pa': ['polyamide', 'nylon'],
};

/**
 * Generate common slug variations for fallback attempts
 * 
 * @example
 * generateSlugVariants("hyper-pla-cf")
 * // Returns: ["hyper-pla-cf", "hyper-pla-carbon-fiber", "hyper-pla-carbon-fibre"]
 */
export function generateSlugVariants(primarySlug: string): string[] {
  const variants = new Set<string>([primarySlug]);
  
  // Try expanding abbreviations
  for (const [abbrev, expansions] of Object.entries(ABBREVIATION_EXPANSIONS)) {
    const abbrevPattern = new RegExp(`-${abbrev}(?:-|$)`, 'i');
    if (abbrevPattern.test(primarySlug)) {
      for (const expansion of expansions) {
        const variant = primarySlug.replace(abbrevPattern, `-${expansion}-`).replace(/-$/, '');
        variants.add(variant);
      }
    }
  }
  
  // Try with/without region-specific suffixes
  const regionSuffixes = ['-us', '-usa', '-eu', '-uk', '-ca', '-au', '-global'];
  for (const suffix of regionSuffixes) {
    if (primarySlug.endsWith(suffix)) {
      variants.add(primarySlug.slice(0, -suffix.length));
    }
    // Also try adding region suffix
    if (!primarySlug.endsWith(suffix)) {
      variants.add(primarySlug + suffix);
    }
  }
  
  // Try variations with/without common prefixes
  const prefixes = ['hyper-', 'ultra-', 'eco-', 'standard-', 'basic-'];
  for (const prefix of prefixes) {
    if (primarySlug.startsWith(prefix)) {
      variants.add(primarySlug.slice(prefix.length));
    }
  }
  
  return Array.from(variants);
}

// ============================================================================
// Database Fetching
// ============================================================================

/**
 * Fetch a verified regional slug from the database
 */
export async function fetchRegionalSlug(
  filamentId: string,
  regionCode: RegionCode
): Promise<RegionalSlugData | null> {
  if (!filamentId || !regionCode) return null;
  
  const { data, error } = await supabase
    .from('product_regional_slugs')
    .select('slug, verified, http_status, verified_at')
    .eq('filament_id', filamentId)
    .eq('region_code', regionCode)
    .maybeSingle();
  
  if (error) {
    console.error('Error fetching regional slug:', error);
    return null;
  }
  
  if (!data) return null;
  
  return {
    slug: data.slug,
    verified: data.verified ?? false,
    httpStatus: data.http_status,
    verifiedAt: data.verified_at,
  };
}

/**
 * Fetch all regional slugs for a filament
 */
export async function fetchAllRegionalSlugs(
  filamentId: string
): Promise<Record<RegionCode, RegionalSlugData>> {
  if (!filamentId) return {} as Record<RegionCode, RegionalSlugData>;
  
  const { data, error } = await supabase
    .from('product_regional_slugs')
    .select('region_code, slug, verified, http_status, verified_at')
    .eq('filament_id', filamentId);
  
  if (error) {
    console.error('Error fetching all regional slugs:', error);
    return {} as Record<RegionCode, RegionalSlugData>;
  }
  
  const result: Record<string, RegionalSlugData> = {};
  for (const row of data || []) {
    result[row.region_code] = {
      slug: row.slug,
      verified: row.verified ?? false,
      httpStatus: row.http_status,
      verifiedAt: row.verified_at,
    };
  }
  
  return result as Record<RegionCode, RegionalSlugData>;
}

// ============================================================================
// Slug Resolution Logic
// ============================================================================

/**
 * Resolve the effective slug for a product in a given region
 * 
 * Priority:
 * 1. Verified regional slug from database
 * 2. Unverified regional slug from database (might be stale)
 * 3. Primary slug (fallback)
 */
export function resolveRegionalSlug(
  regionalSlugData: RegionalSlugData | null,
  primarySlug: string
): SlugResolutionResult {
  // 1. Use verified database slug
  if (regionalSlugData?.verified && regionalSlugData.slug) {
    return {
      effectiveSlug: regionalSlugData.slug,
      isVerified: true,
      source: 'database',
    };
  }
  
  // 2. Use unverified database slug (better than nothing)
  if (regionalSlugData?.slug) {
    return {
      effectiveSlug: regionalSlugData.slug,
      isVerified: false,
      source: 'database',
    };
  }
  
  // 3. Fall back to primary slug
  return {
    effectiveSlug: primarySlug,
    isVerified: false,
    source: 'primary',
  };
}

/**
 * Build a regional URL with the resolved slug
 */
export function buildRegionalUrlWithSlug(
  pattern: string | null,
  baseUrl: string,
  slugData: SlugResolutionResult
): { url: string; slugVerified: boolean } {
  const { effectiveSlug, isVerified } = slugData;
  
  if (!pattern) {
    return { url: baseUrl, slugVerified: false };
  }
  
  // Replace placeholders
  let url = pattern
    .replace(/{slug}/gi, effectiveSlug)
    .replace(/{sku}/gi, effectiveSlug)
    .replace(/{product}/gi, effectiveSlug);
  
  // Ensure absolute URL
  if (!url.startsWith('http')) {
    url = baseUrl.replace(/\/$/, '') + '/' + url.replace(/^\//, '');
  }
  
  return { url, slugVerified: isVerified };
}
