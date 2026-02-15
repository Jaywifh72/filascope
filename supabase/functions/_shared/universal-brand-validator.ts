/**
 * Universal Brand URL Validator
 * 
 * Uses brand-url-patterns.ts to validate and repair URLs for any supported brand.
 * Handles domain correction, soft 404 detection, and slug variant discovery.
 */

import {
  type BrandUrlPattern,
  findBrandPattern,
  findBrandPatternByUrl,
  extractHandle,
  buildBrandUrl,
  correctBrandDomain,
  generateSlugVariants,
} from "./brand-url-patterns.ts";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface BrandValidationResult {
  original_url: string;
  is_valid: boolean;
  http_status: number | null;
  is_soft_404: boolean;
  failure_reason: string | null;
  suggested_fix_url: string | null;
  fix_source: string | null;
  fix_validated: boolean;
  response_time_ms: number;
  brand_name: string | null;
  details: Record<string, unknown>;
}

// ─── Rate Limiter ─────────────────────────────────────────────────────────────

let lastRequestTime = 0;
const MIN_DELAY_MS = 1500;
const REQUEST_TIMEOUT_MS = 10000;

async function rateLimitedFetch(url: string, options: RequestInit = {}): Promise<Response> {
  const now = Date.now();
  const elapsed = now - lastRequestTime;
  if (elapsed < MIN_DELAY_MS) {
    await new Promise(r => setTimeout(r, MIN_DELAY_MS - elapsed));
  }
  lastRequestTime = Date.now();

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
      headers: {
        'User-Agent': 'FilaScope-BrandValidator/1.0',
        'Accept': 'text/html,application/xhtml+xml',
        ...options.headers,
      },
    });
    clearTimeout(timeoutId);
    return response;
  } catch (e) {
    clearTimeout(timeoutId);
    throw e;
  }
}

// ─── Soft 404 Detection ──────────────────────────────────────────────────────

async function checkSoft404(url: string, patterns: string[]): Promise<boolean> {
  try {
    const response = await rateLimitedFetch(url, { method: 'GET' });
    if (response.status !== 200) return false;

    const html = await response.text();
    const lowerHtml = html.toLowerCase();

    for (const pattern of patterns) {
      if (lowerHtml.includes(pattern.toLowerCase())) return true;
    }

    // Very short page with no product indicators
    if (html.length < 5000 && !lowerHtml.includes('add to cart') && !lowerHtml.includes('product-price') && !lowerHtml.includes('buy now')) {
      return true;
    }

    return false;
  } catch {
    return false;
  }
}

// ─── Main Validation ──────────────────────────────────────────────────────────

export async function validateBrandUrl(
  url: string,
  vendor?: string,
  region?: string
): Promise<BrandValidationResult> {
  const start = Date.now();
  const result: BrandValidationResult = {
    original_url: url,
    is_valid: false,
    http_status: null,
    is_soft_404: false,
    failure_reason: null,
    suggested_fix_url: null,
    fix_source: null,
    fix_validated: false,
    response_time_ms: 0,
    brand_name: vendor || null,
    details: {},
  };

  // Find brand pattern by vendor name or URL
  const brand = vendor ? findBrandPattern(vendor) : findBrandPatternByUrl(url);
  if (!brand) {
    result.details = { note: 'No brand pattern found, using generic validation' };
    result.response_time_ms = Date.now() - start;
    return result;
  }

  result.brand_name = brand.vendorNames[0];

  // Step 0: Domain correction
  const domainFix = correctBrandDomain(url, brand);
  if (domainFix.corrected) {
    result.details = { ...result.details, domain_corrected: true, original_domain: url };
    // Validate corrected URL
    try {
      const check = await rateLimitedFetch(domainFix.url, { method: 'HEAD', redirect: 'manual' });
      if (check.status === 200) {
        const isSoft = brand.checkSoft404 && brand.soft404Patterns
          ? await checkSoft404(domainFix.url, brand.soft404Patterns)
          : false;
        if (!isSoft) {
          result.suggested_fix_url = domainFix.url;
          result.fix_source = 'domain_correction';
          result.fix_validated = true;
          result.http_status = check.status;
          result.response_time_ms = Date.now() - start;
          return result;
        }
      }
    } catch { /* continue */ }
    url = domainFix.url;
  }

  // Step 1: HEAD request on current URL
  try {
    const headResponse = await rateLimitedFetch(url, { method: 'HEAD', redirect: 'manual' });
    result.http_status = headResponse.status;

    // Handle redirects
    if (headResponse.status >= 300 && headResponse.status < 400) {
      const location = headResponse.headers.get('location');
      if (location) {
        const absLoc = location.startsWith('http') ? location : new URL(location, url).href;
        try {
          const locUrl = new URL(absLoc);
          // Redirect to homepage = discontinued
          if (locUrl.pathname === '/' || locUrl.pathname.length <= 1) {
            result.failure_reason = 'redirect_homepage';
          } else {
            // Redirect to another product page
            const checkRedirect = await rateLimitedFetch(absLoc, { method: 'HEAD' });
            if (checkRedirect.status === 200) {
              result.is_valid = true;
              result.suggested_fix_url = absLoc;
              result.fix_source = 'redirect_follow';
              result.fix_validated = true;
              result.response_time_ms = Date.now() - start;
              return result;
            }
          }
        } catch { /* ignore */ }
      }
      result.details = { ...result.details, redirect_to: location };
    }

    // Valid 200
    if (headResponse.status === 200) {
      if (brand.checkSoft404 && brand.soft404Patterns) {
        const isSoft = await checkSoft404(url, brand.soft404Patterns);
        if (isSoft) {
          result.is_soft_404 = true;
          result.failure_reason = 'soft_404';
        } else {
          result.is_valid = true;
          result.response_time_ms = Date.now() - start;
          return result;
        }
      } else {
        result.is_valid = true;
        result.response_time_ms = Date.now() - start;
        return result;
      }
    }

    // Hard 404
    if (headResponse.status === 404 || headResponse.status === 410) {
      result.failure_reason = 'hard_404';
    }

  } catch (e: any) {
    if (e.name === 'AbortError') {
      result.failure_reason = 'timeout';
    } else {
      result.failure_reason = 'error';
      result.details = { ...result.details, error: e.message };
    }
    result.response_time_ms = Date.now() - start;
    return result;
  }

  // Step 2: Slug variant repair (skip for Amazon/ASIN)
  if (!result.is_valid && brand.regional.pattern !== 'tld') {
    const handle = extractHandle(url, brand);
    if (handle) {
      const variants = generateSlugVariants(handle, brand);
      const attempted: string[] = [];

      for (const variant of variants) {
        if (variant === handle) continue;
        const candidateUrl = buildBrandUrl(brand, variant, region || 'US');
        attempted.push(variant);

        try {
          const check = await rateLimitedFetch(candidateUrl, { method: 'HEAD', redirect: 'manual' });
          if (check.status === 200) {
            const isSoft = brand.checkSoft404 && brand.soft404Patterns
              ? await checkSoft404(candidateUrl, brand.soft404Patterns)
              : false;
            if (!isSoft) {
              result.suggested_fix_url = candidateUrl;
              result.fix_source = 'slug_variant';
              result.fix_validated = true;
              result.details = { ...result.details, attempted_variants: attempted, winning_variant: variant };
              result.response_time_ms = Date.now() - start;
              return result;
            }
          }
        } catch { /* skip */ }

        // Limit variants to check (avoid excessive requests)
        if (attempted.length >= 8) break;
      }

      result.details = { ...result.details, attempted_variants: attempted };
    }
  }

  result.response_time_ms = Date.now() - start;
  return result;
}

/**
 * Check if a URL belongs to a brand with a defined pattern (not Creality, which has its own validator)
 */
export function hasUniversalBrandPattern(url: string, vendor?: string): boolean {
  const brand = vendor ? findBrandPattern(vendor) : findBrandPatternByUrl(url);
  return brand !== null;
}
