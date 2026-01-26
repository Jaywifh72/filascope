import { RegionCode } from '@/types/regional';

// Common URL patterns that indicate a specific region
const REGION_URL_PATTERNS: Record<RegionCode, RegExp[]> = {
  US: [
    /\.com\/us\//i,
    /\/en-us\//i,
    /us\.store\./i,
    /store\.us\./i,
    /\.us\.store\./i,
    /www\..*\.com(?!.*\/(ca|uk|eu|au)\/)/i, // .com without other region paths
  ],
  CA: [
    /\.ca\//i,
    /\/ca\//i,
    /\/en-ca\//i,
    /\/fr-ca\//i,
    /ca\.store\./i,
    /store\.ca\./i,
    /\.ca\.store\./i,
  ],
  UK: [
    /\.co\.uk\//i,
    /\.uk\//i,
    /\/uk\//i,
    /\/en-gb\//i,
    /uk\.store\./i,
    /store\.uk\./i,
    /\.uk\.store\./i,
  ],
  EU: [
    /\.eu\//i,
    /\/eu\//i,
    /\/de\//i,
    /\/fr\//i,
    /\/es\//i,
    /\/it\//i,
    /eu\.store\./i,
    /store\.eu\./i,
    /\.de$/i,
    /\.fr$/i,
    /\.es$/i,
    /\.it$/i,
  ],
  AU: [
    /\.com\.au\//i,
    /\.au\//i,
    /\/au\//i,
    /\/en-au\//i,
    /au\.store\./i,
    /store\.au\./i,
    /\.au\.store\./i,
  ],
  JP: [
    /\.jp\//i,
    /\/jp\//i,
    /\/ja\//i,
    /jp\.store\./i,
    /store\.jp\./i,
  ],
  CN: [
    /\.cn\//i,
    /\/cn\//i,
    /\/zh\//i,
    /\.com\.cn\//i,
    /cn\.store\./i,
    /store\.cn\./i,
  ],
};

export interface RegionValidationResult {
  isValid: boolean;
  detectedRegion: RegionCode | null;
  matchesExpected: boolean;
  warnings: string[];
  suggestions: string[];
}

/**
 * Detect the region from a URL based on common patterns
 */
export function detectRegionFromUrl(url: string): RegionCode | null {
  if (!url) return null;
  
  const normalizedUrl = url.toLowerCase();
  
  // Check each region's patterns
  for (const [region, patterns] of Object.entries(REGION_URL_PATTERNS) as [RegionCode, RegExp[]][]) {
    for (const pattern of patterns) {
      if (pattern.test(normalizedUrl)) {
        return region;
      }
    }
  }
  
  return null;
}

/**
 * Validate that a URL matches the expected region
 */
export function validateRegionalUrl(
  url: string, 
  expectedRegion: RegionCode
): RegionValidationResult {
  const warnings: string[] = [];
  const suggestions: string[] = [];
  
  if (!url) {
    return {
      isValid: false,
      detectedRegion: null,
      matchesExpected: false,
      warnings: ['URL is empty'],
      suggestions: [],
    };
  }
  
  // Try to detect region from URL
  const detectedRegion = detectRegionFromUrl(url);
  
  // Check if detected region matches expected
  const matchesExpected = detectedRegion === expectedRegion || detectedRegion === null;
  
  if (detectedRegion && detectedRegion !== expectedRegion) {
    warnings.push(
      `URL appears to be for ${detectedRegion} region, but you're adding it to ${expectedRegion}`
    );
    
    // Suggest URL transformation
    const suggestion = suggestUrlForRegion(url, expectedRegion, detectedRegion);
    if (suggestion) {
      suggestions.push(`Try: ${suggestion}`);
    }
  }
  
  // Check for common issues
  if (url.includes(' ')) {
    warnings.push('URL contains spaces');
  }
  
  try {
    new URL(url);
  } catch {
    warnings.push('URL format is invalid');
    return {
      isValid: false,
      detectedRegion,
      matchesExpected,
      warnings,
      suggestions,
    };
  }
  
  return {
    isValid: warnings.length === 0 || (warnings.length > 0 && matchesExpected),
    detectedRegion,
    matchesExpected,
    warnings,
    suggestions,
  };
}

/**
 * Suggest a URL transformation for a different region
 */
export function suggestUrlForRegion(
  originalUrl: string,
  targetRegion: RegionCode,
  sourceRegion: RegionCode | null
): string | null {
  if (!sourceRegion) return null;
  
  const regionPathMap: Record<RegionCode, string> = {
    US: '/us/',
    CA: '/ca/',
    UK: '/uk/',
    EU: '/eu/',
    AU: '/au/',
    JP: '/jp/',
    CN: '/cn/',
  };
  
  const sourcePath = regionPathMap[sourceRegion];
  const targetPath = regionPathMap[targetRegion];
  
  if (originalUrl.toLowerCase().includes(sourcePath.toLowerCase())) {
    return originalUrl.replace(new RegExp(sourcePath, 'i'), targetPath);
  }
  
  // Try subdomain transformation
  const sourceSubdomain = sourceRegion.toLowerCase() + '.';
  const targetSubdomain = targetRegion.toLowerCase() + '.';
  
  if (originalUrl.includes(sourceSubdomain)) {
    return originalUrl.replace(sourceSubdomain, targetSubdomain);
  }
  
  return null;
}

/**
 * Check if a URL is accessible for a given region (basic heuristic)
 */
export function isUrlLikelyAccessible(url: string, userRegion: RegionCode): boolean {
  const detectedRegion = detectRegionFromUrl(url);
  
  // If no region detected, assume accessible
  if (!detectedRegion) return true;
  
  // If URL region matches user region, it's accessible
  if (detectedRegion === userRegion) return true;
  
  // Some cross-region access is usually fine
  const accessibleCrossRegion: Record<RegionCode, RegionCode[]> = {
    US: ['CA'],
    CA: ['US'],
    UK: ['EU'],
    EU: ['UK'],
    AU: ['US', 'UK'],
    JP: ['US'],
    CN: ['US'],
  };
  
  return accessibleCrossRegion[userRegion]?.includes(detectedRegion) ?? false;
}

/**
 * Get region-specific URL patterns for a brand
 */
export function getRegionalUrlPatterns(baseUrl: string, region: RegionCode): string[] {
  const patterns: string[] = [];
  
  try {
    const url = new URL(baseUrl);
    const domain = url.hostname;
    const path = url.pathname;
    
    // Pattern 1: Replace /us/ with target region
    if (path.includes('/us/')) {
      patterns.push(baseUrl.replace('/us/', `/${region.toLowerCase()}/`));
    }
    
    // Pattern 2: Add region to path if not present
    if (!path.match(/\/(us|ca|uk|eu|au)\//i)) {
      const pathParts = path.split('/').filter(Boolean);
      if (pathParts.length > 0) {
        pathParts.unshift(region.toLowerCase());
        patterns.push(`${url.origin}/${pathParts.join('/')}`);
      }
    }
    
    // Pattern 3: Subdomain approach
    if (domain.startsWith('www.')) {
      const newDomain = domain.replace('www.', `${region.toLowerCase()}.`);
      patterns.push(`${url.protocol}//${newDomain}${path}`);
    }
    
    // Pattern 4: Country TLD approach for specific regions
    const tldMap: Partial<Record<RegionCode, string>> = {
      UK: '.co.uk',
      CA: '.ca',
      AU: '.com.au',
    };
    
    if (tldMap[region] && domain.endsWith('.com')) {
      const newDomain = domain.replace('.com', tldMap[region]!);
      patterns.push(`${url.protocol}//${newDomain}${path}`);
    }
    
  } catch {
    // Invalid URL, return empty patterns
  }
  
  return patterns;
}
