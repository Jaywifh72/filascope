/**
 * Universal Brand URL Pattern Library
 * 
 * Defines URL structures, domain patterns, regional variants,
 * and slug mutation strategies for the top filament brands.
 */

// ─── Types ────────────────────────────────────────────────────────────────────

export type RegionPattern = 'subdomain' | 'path' | 'tld' | 'asin' | 'none';

export interface BrandRegionConfig {
  pattern: RegionPattern;
  /** For subdomain: "{region}.domain.com" — the template */
  subdomainTemplate?: string;
  /** For path: base domain + path prefix per region */
  pathPrefixes?: Record<string, string>;
  /** For tld: amazon.{tld} per region */
  tldMap?: Record<string, string>;
  /** Regions this brand supports */
  regions: string[];
}

export interface BrandUrlPattern {
  /** Brand name as stored in vendor column */
  vendorNames: string[];  // case-insensitive matches
  /** Primary domain(s) for this brand's store */
  domains: string[];
  /** Legacy/wrong domains that should be rewritten */
  wrongDomains?: string[];
  /** Correct canonical domain */
  canonicalDomain: string;
  /** Product URL path pattern, e.g. "/products/{handle}" */
  productPathPattern: string;
  /** Regional configuration */
  regional: BrandRegionConfig;
  /** Soft 404 patterns (text found in HTML body on fake 200 pages) */
  soft404Patterns?: string[];
  /** Slug mutation strategies to try when URL is broken */
  slugMutations?: Array<(handle: string) => string[]>;
  /** Whether to do full HTML body scan for soft 404 (expensive) */
  checkSoft404?: boolean;
}

// ─── Common Soft 404 Patterns ─────────────────────────────────────────────────

const COMMON_SOFT_404 = [
  'page not found',
  '404 not found',
  'page you requested does not exist',
  'sorry, we couldn\'t find',
  'this product is no longer available',
  'template-404',
  'class="page-404"',
];

// ─── Slug Mutation Helpers ────────────────────────────────────────────────────

function removeWeightSuffix(h: string): string[] {
  const cleaned = h.replace(/-?\d+(?:-?\d+)?(?:g|kg)$/i, '').replace(/-+$/, '');
  return cleaned !== h && cleaned.length > 3 ? [cleaned] : [];
}

function removeDiameterSuffix(h: string): string[] {
  const cleaned = h.replace(/-?(?:1-75|175|1\.75|2-85|285|2\.85)(?:mm)?$/i, '').replace(/-+$/, '');
  return cleaned !== h && cleaned.length > 3 ? [cleaned] : [];
}

function removeFilamentSuffix(h: string): string[] {
  const results: string[] = [];
  const v1 = h.replace(/-3d-printing-filament.*$/i, '').replace(/-+$/, '');
  if (v1 !== h) results.push(v1);
  const v2 = h.replace(/-3d-printer-filament.*$/i, '').replace(/-+$/, '');
  if (v2 !== h) results.push(v2);
  const v3 = h.replace(/-filament.*$/i, '').replace(/-+$/, '');
  if (v3 !== h) results.push(v3);
  return results;
}

function addFilamentSuffix(h: string): string[] {
  if (h.includes('filament')) return [];
  return [`${h}-filament`, `${h}-3d-printing-filament`, `${h}-3d-printer-filament`];
}

function swapDashPatterns(h: string): string[] {
  const results: string[] = [];
  if (h.includes('-1-75')) results.push(h.replace('-1-75', '-175'));
  if (h.includes('-175')) results.push(h.replace('-175', '-1-75'));
  return results;
}

// ─── Brand Pattern Definitions ────────────────────────────────────────────────

export const BRAND_URL_PATTERNS: BrandUrlPattern[] = [
  // 1. Bambu Lab — subdomain-based regions
  {
    vendorNames: ['Bambu Lab', 'BambuLab'],
    domains: ['store.bambulab.com', 'us.store.bambulab.com', 'ca.store.bambulab.com', 'eu.store.bambulab.com', 'uk.store.bambulab.com', 'au.store.bambulab.com'],
    canonicalDomain: 'store.bambulab.com',
    productPathPattern: '/products/{handle}',
    regional: {
      pattern: 'subdomain',
      subdomainTemplate: '{region}.store.bambulab.com',
      regions: ['US', 'CA', 'EU', 'UK', 'AU'],
    },
    soft404Patterns: [...COMMON_SOFT_404],
    checkSoft404: true,
    slugMutations: [removeWeightSuffix, removeDiameterSuffix, removeFilamentSuffix, addFilamentSuffix],
  },

  // 2. Polymaker — subdomain-based regions
  {
    vendorNames: ['Polymaker'],
    domains: ['us.polymaker.com', 'eu.polymaker.com', 'polymaker.com'],
    canonicalDomain: 'us.polymaker.com',
    productPathPattern: '/products/{handle}',
    regional: {
      pattern: 'subdomain',
      subdomainTemplate: '{region}.polymaker.com',
      regions: ['US', 'EU'],
    },
    soft404Patterns: [...COMMON_SOFT_404],
    checkSoft404: true,
    slugMutations: [removeWeightSuffix, removeDiameterSuffix, removeFilamentSuffix, addFilamentSuffix],
  },

  // 3. Prusament — single domain, no regions
  {
    vendorNames: ['Prusament', 'Prusa'],
    domains: ['www.prusa3d.com', 'prusa3d.com'],
    canonicalDomain: 'www.prusa3d.com',
    productPathPattern: '/product/{handle}',
    regional: {
      pattern: 'none',
      regions: ['US'],
    },
    soft404Patterns: [...COMMON_SOFT_404],
    checkSoft404: false,
    slugMutations: [removeWeightSuffix, removeFilamentSuffix],
  },

  // 4. eSUN — domain fix (esun3d.com → esun3dstore.com)
  {
    vendorNames: ['eSUN', 'eSun', 'Esun'],
    domains: ['esun3dstore.com', 'www.esun3dstore.com'],
    wrongDomains: ['esun3d.com', 'www.esun3d.com'],
    canonicalDomain: 'esun3dstore.com',
    productPathPattern: '/products/{handle}',
    regional: {
      pattern: 'none',
      regions: ['US'],
    },
    soft404Patterns: [...COMMON_SOFT_404],
    checkSoft404: true,
    slugMutations: [removeWeightSuffix, removeDiameterSuffix, removeFilamentSuffix, addFilamentSuffix],
  },

  // 5. Hatchbox — Amazon ASIN-based
  {
    vendorNames: ['Hatchbox', 'HATCHBOX'],
    domains: ['www.amazon.com', 'amazon.com', 'amazon.ca', 'amazon.co.uk', 'amazon.com.au', 'amazon.de'],
    canonicalDomain: 'www.amazon.com',
    productPathPattern: '/dp/{handle}',
    regional: {
      pattern: 'tld',
      tldMap: {
        US: 'amazon.com',
        CA: 'amazon.ca',
        UK: 'amazon.co.uk',
        AU: 'amazon.com.au',
        EU: 'amazon.de',
      },
      regions: ['US', 'CA', 'UK', 'AU', 'EU'],
    },
    checkSoft404: false,
    // Amazon doesn't need slug mutations — ASINs are fixed
  },

  // 6. Anycubic — subdomain-based (store.anycubic.com)
  {
    vendorNames: ['Anycubic'],
    domains: ['store.anycubic.com', 'www.anycubic.com', 'anycubic.com'],
    wrongDomains: ['anycubic3d.com', 'www.anycubic3d.com'],
    canonicalDomain: 'store.anycubic.com',
    productPathPattern: '/products/{handle}',
    regional: {
      pattern: 'none',
      regions: ['US'],
    },
    soft404Patterns: [...COMMON_SOFT_404],
    checkSoft404: true,
    slugMutations: [removeWeightSuffix, removeDiameterSuffix, removeFilamentSuffix, addFilamentSuffix],
  },

  // 7. Eryone — single domain
  {
    vendorNames: ['Eryone'],
    domains: ['www.eryone3d.com', 'eryone3d.com'],
    canonicalDomain: 'www.eryone3d.com',
    productPathPattern: '/products/{handle}',
    regional: {
      pattern: 'none',
      regions: ['US'],
    },
    soft404Patterns: [...COMMON_SOFT_404],
    checkSoft404: false,
    slugMutations: [removeWeightSuffix, removeDiameterSuffix, removeFilamentSuffix, addFilamentSuffix],
  },

  // 8. Sunlu — single domain (sunlu.com)
  {
    vendorNames: ['Sunlu', 'SUNLU'],
    domains: ['www.sunlu.com', 'sunlu.com'],
    canonicalDomain: 'www.sunlu.com',
    productPathPattern: '/products/{handle}',
    regional: {
      pattern: 'none',
      regions: ['US'],
    },
    soft404Patterns: [...COMMON_SOFT_404, 'sunlu-404'],
    checkSoft404: true,
    slugMutations: [removeWeightSuffix, removeDiameterSuffix, removeFilamentSuffix, addFilamentSuffix],
  },

  // 9. Kingroon — single domain
  {
    vendorNames: ['Kingroon', 'KINGROON'],
    domains: ['www.kingroon.com', 'kingroon.com'],
    canonicalDomain: 'www.kingroon.com',
    productPathPattern: '/products/{handle}',
    regional: {
      pattern: 'none',
      regions: ['US'],
    },
    soft404Patterns: [...COMMON_SOFT_404],
    checkSoft404: false,
    slugMutations: [removeWeightSuffix, removeFilamentSuffix, addFilamentSuffix],
  },

  // 10. Overture — single domain
  {
    vendorNames: ['Overture', 'OVERTURE'],
    domains: ['overture3d.com', 'www.overture3d.com'],
    wrongDomains: ['overturefilament.com', 'www.overturefilament.com'],
    canonicalDomain: 'overture3d.com',
    productPathPattern: '/products/{handle}',
    regional: {
      pattern: 'none',
      regions: ['US'],
    },
    soft404Patterns: [...COMMON_SOFT_404],
    checkSoft404: false,
    slugMutations: [removeWeightSuffix, removeDiameterSuffix, removeFilamentSuffix, addFilamentSuffix],
  },
];

// ─── Lookup Helpers ───────────────────────────────────────────────────────────

/**
 * Find the brand pattern config by vendor name (case-insensitive)
 */
export function findBrandPattern(vendor: string): BrandUrlPattern | null {
  const lower = vendor.toLowerCase();
  return BRAND_URL_PATTERNS.find(b =>
    b.vendorNames.some(v => v.toLowerCase() === lower)
  ) || null;
}

/**
 * Find the brand pattern config by URL domain
 */
export function findBrandPatternByUrl(url: string): BrandUrlPattern | null {
  try {
    const hostname = new URL(url).hostname.toLowerCase();
    return BRAND_URL_PATTERNS.find(b =>
      b.domains.some(d => hostname === d || hostname.endsWith('.' + d)) ||
      b.wrongDomains?.some(d => hostname === d || hostname.endsWith('.' + d))
    ) || null;
  } catch {
    return null;
  }
}

/**
 * Extract product handle from a URL using the brand's pattern
 */
export function extractHandle(url: string, brand: BrandUrlPattern): string | null {
  try {
    const parsed = new URL(url);
    const path = parsed.pathname;

    // For Amazon ASIN pattern: /dp/{asin}
    if (brand.productPathPattern === '/dp/{handle}') {
      const match = path.match(/\/dp\/([A-Z0-9]{10})/i);
      return match ? match[1] : null;
    }

    // For /products/{handle} or /product/{handle}
    const match = path.match(/\/products?\/([^?#/]+)/i);
    return match ? match[1] : null;
  } catch {
    return null;
  }
}

/**
 * Build a product URL for a brand + handle + region
 */
export function buildBrandUrl(brand: BrandUrlPattern, handle: string, region: string = 'US'): string {
  const r = brand.regional;

  if (r.pattern === 'subdomain' && r.subdomainTemplate) {
    const regionLower = region.toLowerCase();
    // US typically has no region prefix or uses base domain
    const domain = region === 'US'
      ? brand.canonicalDomain
      : r.subdomainTemplate.replace('{region}', regionLower);
    const pathPattern = brand.productPathPattern.replace('{handle}', handle);
    return `https://${domain}${pathPattern}`;
  }

  if (r.pattern === 'path' && r.pathPrefixes) {
    const prefix = r.pathPrefixes[region] || '';
    const pathPattern = brand.productPathPattern.replace('{handle}', handle);
    return `https://${brand.canonicalDomain}${prefix}${pathPattern}`;
  }

  if (r.pattern === 'tld' && r.tldMap) {
    const tld = r.tldMap[region] || r.tldMap['US'] || brand.canonicalDomain;
    const pathPattern = brand.productPathPattern.replace('{handle}', handle);
    return `https://www.${tld}${pathPattern}`;
  }

  // Default: simple canonical domain
  const pathPattern = brand.productPathPattern.replace('{handle}', handle);
  return `https://${brand.canonicalDomain}${pathPattern}`;
}

/**
 * Correct wrong domains for a brand URL
 */
export function correctBrandDomain(url: string, brand: BrandUrlPattern): { corrected: boolean; url: string } {
  if (!brand.wrongDomains || brand.wrongDomains.length === 0) {
    return { corrected: false, url };
  }

  try {
    const parsed = new URL(url);
    const hostname = parsed.hostname.toLowerCase();

    for (const wrongDomain of brand.wrongDomains) {
      if (hostname === wrongDomain) {
        const correctedUrl = `https://${brand.canonicalDomain}${parsed.pathname}${parsed.search}${parsed.hash}`;
        return { corrected: true, url: correctedUrl };
      }
    }

    return { corrected: false, url };
  } catch {
    return { corrected: false, url };
  }
}

/**
 * Generate slug variants for a brand using its mutation strategies
 */
export function generateSlugVariants(handle: string, brand: BrandUrlPattern): string[] {
  const variants = new Set<string>();
  variants.add(handle);

  if (brand.slugMutations) {
    for (const mutationFn of brand.slugMutations) {
      const mutated = mutationFn(handle);
      for (const v of mutated) {
        if (v && v.length > 2) variants.add(v);
      }
    }
  }

  return [...variants];
}
