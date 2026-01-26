import { RegionCode } from '@/types/regional';

export interface SuggestedUrl {
  region: RegionCode;
  url: string;
  confidence: 'high' | 'medium' | 'low';
}

const TARGET_REGIONS: RegionCode[] = ['US', 'CA', 'UK', 'EU', 'AU'];

/**
 * Auto-generate regional URLs based on a primary URL.
 * Detects common URL patterns and generates variants for other regions.
 */
export function autoGenerateRegionalUrls(
  primaryUrl: string,
  sourceRegion: RegionCode = 'US'
): SuggestedUrl[] {
  const suggestions: SuggestedUrl[] = [];
  
  if (!primaryUrl || !primaryUrl.startsWith('http')) {
    return suggestions;
  }

  const targetRegions = TARGET_REGIONS.filter((r) => r !== sourceRegion);

  // Pattern 1: Path segment /us/ → /ca/, /eu/, etc. (high confidence)
  const pathPatterns: Record<RegionCode, RegExp> = {
    US: /\/us\//i,
    CA: /\/ca\//i,
    UK: /\/uk\//i,
    EU: /\/eu\//i,
    AU: /\/au\//i,
    JP: /\/jp\//i,
    CN: /\/cn\//i,
  };

  const regionPathMap: Record<RegionCode, string> = {
    US: '/us/',
    CA: '/ca/',
    UK: '/uk/',
    EU: '/eu/',
    AU: '/au/',
    JP: '/jp/',
    CN: '/cn/',
  };

  const sourcePathPattern = pathPatterns[sourceRegion];
  if (sourcePathPattern && sourcePathPattern.test(primaryUrl)) {
    for (const targetRegion of targetRegions) {
      const targetPath = regionPathMap[targetRegion];
      if (targetPath) {
        suggestions.push({
          region: targetRegion,
          url: primaryUrl.replace(sourcePathPattern, targetPath),
          confidence: 'high',
        });
      }
    }
    return suggestions;
  }

  // Pattern 2: Subdomain us.store.com → ca.store.com (medium confidence)
  const subdomainPatterns: Record<RegionCode, RegExp> = {
    US: /^(https?:\/\/)us\./i,
    CA: /^(https?:\/\/)ca\./i,
    UK: /^(https?:\/\/)uk\./i,
    EU: /^(https?:\/\/)eu\./i,
    AU: /^(https?:\/\/)au\./i,
    JP: /^(https?:\/\/)jp\./i,
    CN: /^(https?:\/\/)cn\./i,
  };

  const regionSubdomainMap: Record<RegionCode, string> = {
    US: '$1us.',
    CA: '$1ca.',
    UK: '$1uk.',
    EU: '$1eu.',
    AU: '$1au.',
    JP: '$1jp.',
    CN: '$1cn.',
  };

  const sourceSubdomainPattern = subdomainPatterns[sourceRegion];
  if (sourceSubdomainPattern && sourceSubdomainPattern.test(primaryUrl)) {
    for (const targetRegion of targetRegions) {
      const targetSubdomain = regionSubdomainMap[targetRegion];
      if (targetSubdomain) {
        suggestions.push({
          region: targetRegion,
          url: primaryUrl.replace(sourceSubdomainPattern, targetSubdomain),
          confidence: 'medium',
        });
      }
    }
    return suggestions;
  }

  // Pattern 3: TLD variants store.com → store.ca, store.co.uk (low confidence)
  // Only try if no other patterns matched
  try {
    const url = new URL(primaryUrl);
    const hostname = url.hostname;
    
    // Check for .com TLD
    if (hostname.endsWith('.com')) {
      const baseDomain = hostname.replace(/\.com$/, '');
      
      const tldMap: Record<RegionCode, string> = {
        US: '.com',
        CA: '.ca',
        UK: '.co.uk',
        EU: '.de',
        AU: '.com.au',
        JP: '.co.jp',
        CN: '.cn',
      };

      for (const targetRegion of targetRegions) {
        const tld = tldMap[targetRegion];
        if (tld && tld !== '.com') {
          const newHostname = baseDomain + tld;
          const newUrl = new URL(primaryUrl);
          newUrl.hostname = newHostname;
          suggestions.push({
            region: targetRegion,
            url: newUrl.toString(),
            confidence: 'low',
          });
        }
      }
    }
  } catch {
    // Invalid URL, skip TLD suggestions
  }

  return suggestions;
}

/**
 * Detect region from a URL based on common patterns
 */
export function detectRegionFromUrl(url: string): RegionCode | null {
  const patterns: Array<{ pattern: RegExp; region: RegionCode }> = [
    { pattern: /\/us\//i, region: 'US' },
    { pattern: /^https?:\/\/us\./i, region: 'US' },
    { pattern: /\/ca\//i, region: 'CA' },
    { pattern: /\.ca\//i, region: 'CA' },
    { pattern: /^https?:\/\/ca\./i, region: 'CA' },
    { pattern: /\/uk\//i, region: 'UK' },
    { pattern: /\.co\.uk/i, region: 'UK' },
    { pattern: /^https?:\/\/uk\./i, region: 'UK' },
    { pattern: /\/eu\//i, region: 'EU' },
    { pattern: /\.de\//i, region: 'EU' },
    { pattern: /\.fr\//i, region: 'EU' },
    { pattern: /^https?:\/\/eu\./i, region: 'EU' },
    { pattern: /\/au\//i, region: 'AU' },
    { pattern: /\.com\.au/i, region: 'AU' },
    { pattern: /^https?:\/\/au\./i, region: 'AU' },
    { pattern: /\/jp\//i, region: 'JP' },
    { pattern: /\.co\.jp/i, region: 'JP' },
    { pattern: /^https?:\/\/jp\./i, region: 'JP' },
    { pattern: /\/cn\//i, region: 'CN' },
    { pattern: /\.cn\//i, region: 'CN' },
    { pattern: /^https?:\/\/cn\./i, region: 'CN' },
  ];

  for (const { pattern, region } of patterns) {
    if (pattern.test(url)) {
      return region;
    }
  }

  // Default to US for .com domains without region indicators
  if (/\.com(?:\/|$)/i.test(url) && !url.includes('.com.')) {
    return 'US';
  }

  return null;
}

/**
 * Extract store name from URL
 */
export function extractStoreNameFromUrl(url: string): string {
  try {
    const hostname = new URL(url).hostname;
    let name = hostname
      .replace(/^www\./i, '')
      .replace(/^store\./i, '')
      .replace(/^shop\./i, '')
      .replace(/\.com$|\.ca$|\.co\.uk$|\.de$|\.fr$|\.com\.au$|\.co\.jp$|\.cn$/i, '');
    
    // Capitalize first letter
    return name.charAt(0).toUpperCase() + name.slice(1);
  } catch {
    return '';
  }
}
