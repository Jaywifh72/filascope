// URL validation and fixing utilities for product links

export interface UrlValidationResult {
  isValid: boolean;
  suggestedUrl?: string;
  issue?: string;
}

// Brand-specific URL patterns that need region prefixes
const BRAND_URL_FIXES: Record<string, { pattern: RegExp; fix: (url: string) => string }> = {
  'Creality': {
    pattern: /^https?:\/\/store\.creality\.com\/products\//,
    fix: (url: string) => url.replace('store.creality.com/products/', 'store.creality.com/us/products/')
  },
  'Bambu Lab': {
    pattern: /^https?:\/\/store\.bambulab\.com\/products\//,
    fix: (url: string) => url.replace('store.bambulab.com/products/', 'us.store.bambulab.com/products/')
  }
};

// Known broken URL patterns
const KNOWN_ISSUES: Array<{ pattern: RegExp; issue: string }> = [
  { pattern: /^https?:\/\/[^\/]+\/?$/, issue: 'URL points to homepage, not a product page' },
  { pattern: /^https?:\/\/store\.creality\.com\/products\//, issue: 'Missing region prefix (e.g., /us/)' },
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
