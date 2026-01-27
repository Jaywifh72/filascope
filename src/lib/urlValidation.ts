// URL validation and fixing utilities for product links

export interface UrlValidationResult {
  isValid: boolean;
  suggestedUrl?: string;
  issue?: string;
}

// Brand-specific URL patterns that need region prefixes or domain fixes
const BRAND_URL_FIXES: Record<string, { pattern: RegExp; fix: (url: string) => string }> = {
  // Creality URLs work without region prefix - removing the old fix that added /us/
  // The global store URL (store.creality.com/products/...) works correctly
  'Bambu Lab': {
    pattern: /^https?:\/\/store\.bambulab\.com\/products\//,
    fix: (url: string) => url.replace('store.bambulab.com/products/', 'us.store.bambulab.com/products/')
  },
  'Ultimaker': {
    // Ultimaker S-Series materials use new path format: /3d-printer-materials/s-series-materials/um-{material}-packaged
    pattern: /^https?:\/\/store\.ultimaker\.com\/products\//,
    fix: (url: string) => {
      // Extract product slug from old /products/ URL
      const match = url.match(/\/products\/ultimaker-(.+?)-(?:3d-printer-)?filament/i);
      if (match) {
        const material = match[1].toLowerCase()
          .replace(/-2-85mm$/, '')
          .replace(/-(black|white|red|blue|green|yellow|orange|grey|silver|natural|transparent)$/i, '');
        
        // High-temp materials use packaged format
        if (['pps-cf', 'peek', 'pei'].includes(material)) {
          return `https://store.ultimaker.com/3d-printer-materials/s-series-materials/um-${material}-packaged`;
        }
        // Standard materials use s-series format
        const cleanMaterial = material.replace(/-cf$/i, 'cf').replace(/-95a$/i, '95a');
        return `https://store.ultimaker.com/ultimaker-s-series-${cleanMaterial}-material`;
      }
      return url;
    }
  },
  // eSUN: esun3d.com is broken, correct domain is esun3dstore.com
  'eSun': {
    pattern: /^https?:\/\/(www\.)?esun3d\.com\//,
    fix: (url: string) => url.replace(/esun3d\.com/, 'esun3dstore.com')
  },
  'eSUN': {
    pattern: /^https?:\/\/(www\.)?esun3d\.com\//,
    fix: (url: string) => url.replace(/esun3d\.com/, 'esun3dstore.com')
  }
};

// Known broken URL patterns
const KNOWN_ISSUES: Array<{ pattern: RegExp; issue: string }> = [
  { pattern: /^https?:\/\/[^\/]+\/?$/, issue: 'URL points to homepage, not a product page' },
  { pattern: /404|not-found/i, issue: 'URL contains 404 or not-found' },
];

export function validateProductUrl(url: string | null | undefined, brand?: string | null): UrlValidationResult {
  if (!url) {
    return { isValid: false, issue: 'No URL provided' };
  }

  // Check if URL starts with http/https
  if (!url.startsWith('http://') && !url.startsWith('https://')) {
    return { isValid: false, issue: 'URL must start with http:// or https://' };
  }

  // Check for known issues
  for (const { pattern, issue } of KNOWN_ISSUES) {
    if (pattern.test(url)) {
      // Try to fix if we know the brand
      if (brand && BRAND_URL_FIXES[brand]) {
        const { pattern: brandPattern, fix } = BRAND_URL_FIXES[brand];
        if (brandPattern.test(url)) {
          return {
            isValid: false,
            issue,
            suggestedUrl: fix(url)
          };
        }
      }
      return { isValid: false, issue };
    }
  }

  // Brand-specific validation
  if (brand && BRAND_URL_FIXES[brand]) {
    const { pattern, fix } = BRAND_URL_FIXES[brand];
    if (pattern.test(url)) {
      return {
        isValid: false,
        issue: 'Missing region prefix',
        suggestedUrl: fix(url)
      };
    }
  }

  return { isValid: true };
}

export function fixProductUrl(url: string, brand?: string | null): string {
  const validation = validateProductUrl(url, brand);
  return validation.suggestedUrl || url;
}

// Validate and fix product URLs before saving to database
// Use this function in data imports and scraping functions
export function validateAndFixProductUrl(url: string, vendor?: string): string {
  if (!url) return url;
  
  let fixedUrl = url;
  
  // eSUN: esun3d.com → esun3dstore.com
  if (fixedUrl.includes('esun3d.com') && !fixedUrl.includes('esun3dstore.com')) {
    fixedUrl = fixedUrl
      .replace('www.esun3d.com', 'esun3dstore.com')
      .replace('esun3d.com', 'esun3dstore.com');
  }
  
  // Creality: Remove /us/ regional path (global store URLs work without region)
  if (fixedUrl.includes('store.creality.com/us/')) {
    fixedUrl = fixedUrl.replace('store.creality.com/us/', 'store.creality.com/');
  }
  
  // Additional brand-specific fixes can be added here
  
  return fixedUrl;
}

// Batch validate multiple URLs
export function validateMultipleUrls(items: Array<{ id: string; url: string | null; brand?: string | null }>): Array<{
  id: string;
  url: string | null;
  validation: UrlValidationResult;
}> {
  return items.map(item => ({
    id: item.id,
    url: item.url,
    validation: validateProductUrl(item.url, item.brand)
  }));
}

// Check if a URL is marked as discontinued
export const DISCONTINUED_MARKER = 'DISCONTINUED';

export function isDiscontinuedUrl(url: string | null | undefined): boolean {
  if (!url) return false;
  return url.toUpperCase() === DISCONTINUED_MARKER;
}
