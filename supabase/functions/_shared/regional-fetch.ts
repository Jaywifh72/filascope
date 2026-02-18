/**
 * REGIONAL FETCH MODULE
 * 
 * Provides geo-redirect bypass for accessing regional storefronts directly.
 * Uses a cascading strategy: custom headers → spoofed headers → follow redirect.
 * 
 * Usage:
 *   import { fetchRegionalStore, getRegionHeaders } from '../_shared/regional-fetch.ts';
 *   const result = await fetchRegionalStore(url, 'CA');
 */

// ============================================================
// Region Mapping Helpers
// ============================================================

const REGION_IPS: Record<string, string> = {
  US: '8.8.8.8',
  CA: '142.150.0.1',
  UK: '81.128.0.1',
  EU: '87.224.0.1',
  AU: '1.128.0.1',
  JP: '133.1.0.1',
};

const REGION_COUNTRY_CODES: Record<string, string> = {
  US: 'US',
  CA: 'CA',
  UK: 'GB',
  EU: 'DE',
  AU: 'AU',
  JP: 'JP',
};

const REGION_LANGUAGES: Record<string, string> = {
  US: 'en-US,en;q=0.9',
  CA: 'en-CA,fr-CA;q=0.8,en;q=0.7',
  UK: 'en-GB,en;q=0.9',
  EU: 'de-DE,de;q=0.9,en;q=0.8',
  AU: 'en-AU,en;q=0.9',
  JP: 'ja-JP,ja;q=0.9,en;q=0.8',
};

const REGION_TIMEZONES: Record<string, string> = {
  US: 'America/New_York',
  CA: 'America/Toronto',
  UK: 'Europe/London',
  EU: 'Europe/Berlin',
  AU: 'Australia/Sydney',
  JP: 'Asia/Tokyo',
};

// Domains known to geo-redirect aggressively
const GEO_REDIRECT_DOMAINS = [
  'store.bambulab.com',
  'bambulab.com',
  'polymaker.com',
  'elegoo.com',
  'anycubic.com',
  'store.creality.com',
  'creality.com',
  'qidi3d.com',
  'flashforge.com',
  'www.extrudr.com',
  'extrudr.com',
];

export type FetchMethod = 'direct' | 'spoofed' | 'redirected';

export interface RegionalFetchResult {
  success: boolean;
  response: Response | null;
  method: FetchMethod;
  warning?: string;
  redirectedTo?: string;
  statusCode: number | null;
}

// ============================================================
// Header Generation
// ============================================================

/**
 * Build browser-like headers targeting a specific region.
 * These fool basic geo-detection that relies on Accept-Language.
 */
export function getRegionHeaders(region: string): Record<string, string> {
  const lang = REGION_LANGUAGES[region] || REGION_LANGUAGES.US;
  return {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
    'Accept-Language': lang,
    'Accept-Encoding': 'gzip, deflate, br',
    'DNT': '1',
    'Connection': 'keep-alive',
    'Upgrade-Insecure-Requests': '1',
    'Sec-Fetch-Dest': 'document',
    'Sec-Fetch-Mode': 'navigate',
    'Sec-Fetch-Site': 'none',
    'Sec-Fetch-User': '?1',
    'Cache-Control': 'max-age=0',
    'Sec-CH-UA-Platform': '"Windows"',
  };
}

/**
 * Build spoofed headers that attempt to override IP-based detection.
 * X-Forwarded-For and CF-IPCountry are respected by some CDNs/proxies.
 */
export function getSpoofedHeaders(region: string): Record<string, string> {
  const ip = REGION_IPS[region] || REGION_IPS.US;
  const countryCode = REGION_COUNTRY_CODES[region] || 'US';
  const timezone = REGION_TIMEZONES[region] || 'America/New_York';

  return {
    ...getRegionHeaders(region),
    'X-Forwarded-For': ip,
    'CF-IPCountry': countryCode,
    'X-Real-IP': ip,
    'True-Client-IP': ip,
    // Cloudflare workers sometimes read this
    'CF-Connecting-IP': ip,
    // Some reverse proxies read timezone to infer region
    'X-Timezone': timezone,
  };
}

// ============================================================
// Geo-Redirect Detection
// ============================================================

/**
 * Determine if a redirect is a geo-redirect (same brand, different region subdomain)
 * vs a legitimate product redirect.
 */
export function isGeoRedirect(originalUrl: string, redirectUrl: string): boolean {
  if (!redirectUrl) return false;

  try {
    const orig = new URL(originalUrl);
    const redir = new URL(redirectUrl);

    // Same host = not a geo-redirect (probably a path redirect)
    if (orig.hostname === redir.hostname) return false;

    // Check if both hostnames share the same base domain
    const origParts = orig.hostname.split('.');
    const redirParts = redir.hostname.split('.');
    
    // Extract base domain (last 2 parts, or last 3 for .co.uk etc.)
    const origBase = origParts.slice(-2).join('.');
    const redirBase = redirParts.slice(-2).join('.');
    
    if (origBase !== redirBase) return false;

    // Different subdomain on same base domain → likely geo-redirect
    // e.g., eu.store.bambulab.com → us.store.bambulab.com
    console.log(`Geo-redirect detected: ${orig.hostname} → ${redir.hostname}`);
    return true;
  } catch {
    return false;
  }
}

/**
 * Check if a domain is known to geo-redirect.
 */
export function isGeoRedirectDomain(url: string): boolean {
  try {
    const hostname = new URL(url).hostname.toLowerCase();
    return GEO_REDIRECT_DOMAINS.some(d => hostname.includes(d));
  } catch {
    return false;
  }
}

/**
 * Detect the target region from a URL's subdomain.
 * e.g., "eu.store.bambulab.com" → "EU", "ca.polymaker.com" → "CA"
 */
export function detectRegionFromUrl(url: string): string | null {
  try {
    const hostname = new URL(url).hostname.toLowerCase();
    const firstPart = hostname.split('.')[0];
    
    const subdomainMap: Record<string, string> = {
      us: 'US', ca: 'CA', uk: 'UK', eu: 'EU', au: 'AU', jp: 'JP',
      store: 'US', // store.anycubic.com = US
      www: null as unknown as string,
    };
    
    return subdomainMap[firstPart] ?? null;
  } catch {
    return null;
  }
}

// ============================================================
// Cascading Regional Fetch
// ============================================================

/**
 * Fetch a URL with geo-redirect bypass using a cascading strategy:
 * 
 * 1. Direct fetch with region-appropriate Accept-Language headers (free, fast)
 * 2. Spoofed headers with X-Forwarded-For + CF-IPCountry (free, may work on some CDNs)
 * 3. Accept redirect but flag it (free, last resort)
 * 
 * @param url - The regional store URL to fetch
 * @param region - Target region code (US, CA, UK, EU, AU, JP)
 * @param options - Additional fetch options (method, timeout)
 */
export async function fetchRegionalStore(
  url: string,
  region: string,
  options: {
    method?: 'GET' | 'HEAD';
    timeoutMs?: number;
    abortSignal?: AbortSignal;
  } = {}
): Promise<RegionalFetchResult> {
  const { method = 'GET', timeoutMs = 15000 } = options;
  const isKnownGeoRedirector = isGeoRedirectDomain(url);

  // ── Method 1: Direct with region headers ──────────────────
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

    const response = await fetch(url, {
      method,
      headers: getRegionHeaders(region),
      redirect: 'manual',
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    if (response.status === 200) {
      return { success: true, response, method: 'direct', statusCode: 200 };
    }

    // Check for geo-redirect
    if (response.status >= 300 && response.status < 400) {
      const redirectUrl = response.headers.get('location') || '';
      const fullRedirectUrl = redirectUrl.startsWith('/') 
        ? `${new URL(url).origin}${redirectUrl}` 
        : redirectUrl;
      
      if (!isGeoRedirect(url, fullRedirectUrl)) {
        // Legitimate redirect (e.g., product slug change), follow it
        const followResponse = await fetch(fullRedirectUrl, {
          method,
          headers: getRegionHeaders(region),
          redirect: 'follow',
        });
        return {
          success: followResponse.status === 200,
          response: followResponse,
          method: 'direct',
          redirectedTo: fullRedirectUrl,
          statusCode: followResponse.status,
        };
      }

      // It IS a geo-redirect — try method 2
      console.log(`Method 1 (direct) got geo-redirect ${response.status} → ${redirectUrl}`);
      // Consume body to prevent leak
      await response.text().catch(() => {});
    } else if (!isKnownGeoRedirector) {
      // Non-redirect, non-200 on a store we don't know geo-redirects → return as-is
      return { success: false, response, method: 'direct', statusCode: response.status };
    }
  } catch (err) {
    console.error(`Method 1 (direct) failed for ${url}:`, err);
  }

  // ── Method 2: Spoofed IP/country headers ──────────────────
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

    const response = await fetch(url, {
      method,
      headers: getSpoofedHeaders(region),
      redirect: 'manual',
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    if (response.status === 200) {
      console.log(`Method 2 (spoofed) succeeded for ${url} region=${region}`);
      return { success: true, response, method: 'spoofed', statusCode: 200 };
    }

    if (response.status >= 300 && response.status < 400) {
      const redirectUrl = response.headers.get('location') || '';
      const fullRedirectUrl = redirectUrl.startsWith('/')
        ? `${new URL(url).origin}${redirectUrl}`
        : redirectUrl;

      if (!isGeoRedirect(url, fullRedirectUrl)) {
        const followResponse = await fetch(fullRedirectUrl, {
          method,
          headers: getSpoofedHeaders(region),
          redirect: 'follow',
        });
        return {
          success: followResponse.status === 200,
          response: followResponse,
          method: 'spoofed',
          redirectedTo: fullRedirectUrl,
          statusCode: followResponse.status,
        };
      }

      console.log(`Method 2 (spoofed) still geo-redirected for ${url}`);
      await response.text().catch(() => {});
    }
  } catch (err) {
    console.error(`Method 2 (spoofed) failed for ${url}:`, err);
  }

  // ── Method 3: Follow redirect (last resort) ──────────────
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

    const response = await fetch(url, {
      method,
      headers: getRegionHeaders(region),
      redirect: 'follow',
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    const finalUrl = response.url || url;
    const wasRedirected = finalUrl !== url;

    return {
      success: response.status === 200,
      response,
      method: 'redirected',
      statusCode: response.status,
      redirectedTo: wasRedirected ? finalUrl : undefined,
      warning: wasRedirected
        ? `Geo-redirected to ${new URL(finalUrl).hostname} — price may be from wrong region`
        : undefined,
    };
  } catch (err) {
    console.error(`Method 3 (follow redirect) failed for ${url}:`, err);
    return {
      success: false,
      response: null,
      method: 'redirected',
      statusCode: null,
      warning: `All fetch methods failed: ${err instanceof Error ? err.message : 'Unknown error'}`,
    };
  }
}

/**
 * Fetch a HEAD request for link validation with geo-bypass.
 * Returns status code and redirect info.
 */
export async function validateRegionalUrl(
  url: string,
  region?: string
): Promise<{
  status: 'valid' | 'invalid' | 'redirect' | 'geo_restricted' | 'unknown';
  statusCode: number | null;
  redirectUrl: string | null;
  method: FetchMethod;
  isGeoRedirected: boolean;
  lastChecked: string;
}> {
  const targetRegion = region || detectRegionFromUrl(url) || 'US';
  const now = new Date().toISOString();

  const result = await fetchRegionalStore(url, targetRegion, {
    method: 'HEAD',
    timeoutMs: 10000,
  });

  if (!result.response) {
    return {
      status: 'unknown',
      statusCode: null,
      redirectUrl: null,
      method: result.method,
      isGeoRedirected: false,
      lastChecked: now,
    };
  }

  const { status } = result.response;
  const isGeoRedirected = result.method === 'redirected' && !!result.warning;

  if (status === 200 || status === 204) {
    return {
      status: isGeoRedirected ? 'geo_restricted' : 'valid',
      statusCode: status,
      redirectUrl: result.redirectedTo || null,
      method: result.method,
      isGeoRedirected,
      lastChecked: now,
    };
  }

  if (status === 404 || status === 410) {
    return {
      status: 'invalid',
      statusCode: status,
      redirectUrl: null,
      method: result.method,
      isGeoRedirected: false,
      lastChecked: now,
    };
  }

  if (status >= 300 && status < 400) {
    return {
      status: 'redirect',
      statusCode: status,
      redirectUrl: result.redirectedTo || null,
      method: result.method,
      isGeoRedirected,
      lastChecked: now,
    };
  }

  return {
    status: 'unknown',
    statusCode: status,
    redirectUrl: null,
    method: result.method,
    isGeoRedirected: false,
    lastChecked: now,
  };
}

/**
 * Check if a URL+currency combo should bypass Shopify JSON and use Firecrawl directly.
 * Returns true for geo-redirect domains when the requested currency is not USD.
 */
export function shouldUseFirecrawlForRegion(url: string, currency: string): boolean {
  return isGeoRedirectDomain(url) && currency !== 'USD';
}
