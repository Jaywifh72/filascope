/**
 * Creality URL Intelligence Module
 * 
 * Understands Creality's URL structure:
 *   - Subdirectory regions: store.creality.com/{region}/products/{handle}
 *   - US has no prefix: store.creality.com/products/{handle}
 *   - Soft 404 detection via HTML content check
 *   - Intelligent slug variant generation
 *   - Rate limiting: 30 req/min with 2s delays
 */

// ─── Types ────────────────────────────────────────────────────────────────────

export interface CrealityValidationResult {
  original_url: string;
  is_valid: boolean;
  http_status: number | null;
  is_soft_404: boolean;
  failure_reason: string | null; // 'hard_404' | 'soft_404' | 'redirect_homepage' | 'timeout' | 'error' | null
  suggested_fix_url: string | null;
  fix_source: string | null; // 'slug_variant' | 'redirect_follow' | 'region_fix' | null
  fix_validated: boolean;
  response_time_ms: number;
  details: Record<string, unknown>;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const CREALITY_DOMAIN = 'store.creality.com';
const REQUEST_TIMEOUT_MS = 10000;

// Creality region path prefixes (subdirectory-based, NOT subdomain-based)
const REGION_PREFIXES: Record<string, string> = {
  US: '',       // no prefix for US
  CA: '/ca',
  UK: '/uk',
  EU: '/eu',
  AU: '/au',
  JP: '/jp',
};

// Soft 404 indicators in Creality's HTML
const SOFT_404_PATTERNS = [
  'Oops! Page not found',
  'page you requested does not exist',
  'Page Not Found',
  'Sorry, we couldn\'t find',
  '404 Not Found',
  'This product is no longer available',
  'class="page-404"',
  'template-404',
];

// ─── Rate Limiter ─────────────────────────────────────────────────────────────

let lastRequestTime = 0;
const MIN_DELAY_MS = 2000; // 2 seconds between requests (30/min)

async function rateLimitedFetch(url: string, options: RequestInit & { timeout?: number } = {}): Promise<Response> {
  const now = Date.now();
  const elapsed = now - lastRequestTime;
  if (elapsed < MIN_DELAY_MS) {
    await new Promise(r => setTimeout(r, MIN_DELAY_MS - elapsed));
  }
  lastRequestTime = Date.now();

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), options.timeout || REQUEST_TIMEOUT_MS);

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
      headers: {
        'User-Agent': 'FilaScope-CrealityValidator/1.0',
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

// ─── URL Parsing ──────────────────────────────────────────────────────────────

export function parseCrealityUrl(url: string): { region: string; handle: string } | null {
  try {
    const parsed = new URL(url);
    if (!parsed.hostname.includes('creality.com')) return null;

    // Match: /products/handle OR /{region}/products/handle
    const match = parsed.pathname.match(/^(?:\/(ca|uk|eu|au|jp))?\/products\/([^?#/]+)/i);
    if (!match) return null;

    return {
      region: match[1] ? match[1].toUpperCase() : 'US',
      handle: match[2],
    };
  } catch {
    return null;
  }
}

export function buildCrealityUrl(handle: string, region: string = 'US'): string {
  const prefix = REGION_PREFIXES[region.toUpperCase()] || '';
  return `https://${CREALITY_DOMAIN}${prefix}/products/${handle}`;
}

// ─── Slug Variant Generation ──────────────────────────────────────────────────

export function generateCrealitySlugVariants(handle: string): string[] {
  const variants = new Set<string>();
  variants.add(handle); // original always first

  // 1. Remove weight suffixes: -1kg, -500g, -1-kg, etc.
  const noWeight = handle
    .replace(/-?\d+(?:-?\d+)?(?:g|kg)$/i, '')
    .replace(/-+$/, '');
  if (noWeight !== handle) variants.add(noWeight);

  // 2. Remove diameter suffixes: -1-75mm, -175mm, -1.75mm, -2-85mm
  const noDiameter = handle
    .replace(/-?(?:1-75|175|1\.75|2-85|285|2\.85)(?:mm)?$/i, '')
    .replace(/-+$/, '');
  if (noDiameter !== handle) variants.add(noDiameter);

  // 3. Combined: remove both weight AND diameter
  const noWeightDiam = handle
    .replace(/-?(?:1-75|175|2-85|285)(?:mm)?/i, '')
    .replace(/-?\d+(?:-?\d+)?(?:g|kg)/i, '')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
  if (noWeightDiam !== handle && noWeightDiam.length > 3) variants.add(noWeightDiam);

  // 4. Try with "creality-" prefix
  if (!handle.startsWith('creality-')) {
    variants.add(`creality-${handle}`);
  }
  // 5. Try without "creality-" prefix
  if (handle.startsWith('creality-')) {
    variants.add(handle.replace(/^creality-/, ''));
  }

  // 6. Try with common suffixes
  const base = noWeight !== handle ? noWeight : handle;
  variants.add(`${base}-3d-printer-filament`);
  variants.add(`${base}-filament`);

  // 7. Remove trailing "-3d-printer-filament" or "-filament"
  const noFilSuffix = handle
    .replace(/-3d-printer-filament$/, '')
    .replace(/-filament$/, '');
  if (noFilSuffix !== handle) variants.add(noFilSuffix);

  // 8. PLA variants: cr-pla ↔ cr-silk-pla, etc.
  if (handle.includes('cr-silk-')) {
    variants.add(handle.replace('cr-silk-', 'cr-'));
  }
  if (handle.includes('cr-pla') && !handle.includes('cr-silk-pla')) {
    variants.add(handle.replace('cr-pla', 'cr-silk-pla'));
  }

  // 9. Hyper series: hyper-pla → hyper-pla-v2 or reverse
  if (handle.includes('hyper-') && !handle.includes('-v2')) {
    variants.add(`${handle}-v2`);
  }
  if (handle.endsWith('-v2')) {
    variants.add(handle.replace(/-v2$/, ''));
  }

  // 10. Try swapping dash patterns for weights: -1-75mm → -175mm and vice versa
  if (handle.includes('-1-75')) {
    variants.add(handle.replace('-1-75', '-175'));
  }
  if (handle.includes('-175')) {
    variants.add(handle.replace('-175', '-1-75'));
  }

  return [...variants];
}

// ─── Soft 404 Detection ──────────────────────────────────────────────────────

async function isSoft404(url: string): Promise<boolean> {
  try {
    const response = await rateLimitedFetch(url, { method: 'GET' });
    if (response.status !== 200) return false; // not a soft 404, it's a real error

    const html = await response.text();
    const lowerHtml = html.toLowerCase();

    // Check for soft 404 patterns
    for (const pattern of SOFT_404_PATTERNS) {
      if (lowerHtml.includes(pattern.toLowerCase())) {
        return true;
      }
    }

    // Check if page has no product content (very short body = likely empty/error page)
    if (html.length < 5000 && !lowerHtml.includes('add to cart') && !lowerHtml.includes('product-price')) {
      return true;
    }

    return false;
  } catch {
    return false; // can't determine, assume not soft 404
  }
}

// ─── Main Validation Function ─────────────────────────────────────────────────

export async function validateCrealityUrl(url: string, region?: string): Promise<CrealityValidationResult> {
  const start = Date.now();
  const result: CrealityValidationResult = {
    original_url: url,
    is_valid: false,
    http_status: null,
    is_soft_404: false,
    failure_reason: null,
    suggested_fix_url: null,
    fix_source: null,
    fix_validated: false,
    response_time_ms: 0,
    details: {},
  };

  const parsed = parseCrealityUrl(url);
  if (!parsed) {
    result.failure_reason = 'error';
    result.details = { error: 'Not a valid Creality store URL' };
    result.response_time_ms = Date.now() - start;
    return result;
  }

  try {
    // Step 1: HEAD request
    const headResponse = await rateLimitedFetch(url, { method: 'HEAD', redirect: 'manual' });
    result.http_status = headResponse.status;

    // Handle redirects
    if (headResponse.status >= 300 && headResponse.status < 400) {
      const location = headResponse.headers.get('location');
      result.details = { redirect_to: location };

      if (location) {
        // Resolve relative URLs
        const absoluteLocation = location.startsWith('http') ? location : new URL(location, url).href;

        // Check if redirect goes to homepage (= product removed)
        try {
          const locUrl = new URL(absoluteLocation);
          if (locUrl.pathname === '/' || locUrl.pathname === '' || locUrl.pathname.match(/^\/(ca|uk|eu|au|jp)\/?$/i)) {
            result.failure_reason = 'redirect_homepage';
            result.details = { ...result.details, note: 'Redirects to homepage — product likely discontinued' };
          } else {
            // Redirect to another product page — validate it
            const checkRedirect = await rateLimitedFetch(absoluteLocation, { method: 'HEAD' });
            if (checkRedirect.status === 200) {
              result.is_valid = true;
              result.suggested_fix_url = absoluteLocation;
              result.fix_source = 'redirect_follow';
              result.fix_validated = true;
              result.response_time_ms = Date.now() - start;
              return result;
            }
          }
        } catch { /* ignore parse errors */ }
      }
    }

    // Valid
    if (headResponse.status === 200) {
      // Check for soft 404
      const soft = await isSoft404(url);
      if (soft) {
        result.is_soft_404 = true;
        result.failure_reason = 'soft_404';
        result.details = { note: 'Page returns 200 but contains "not found" content' };
      } else {
        result.is_valid = true;
        result.response_time_ms = Date.now() - start;
        return result;
      }
    }

    // Hard 404 / 410
    if (headResponse.status === 404 || headResponse.status === 410) {
      result.failure_reason = 'hard_404';
    }

    // Step 2: If broken, try slug variants to find the correct URL
    if (!result.is_valid) {
      const targetRegion = region || parsed.region;
      const variants = generateCrealitySlugVariants(parsed.handle);
      const attemptedVariants: string[] = [];

      for (const variant of variants) {
        if (variant === parsed.handle) continue; // skip original

        const candidateUrl = buildCrealityUrl(variant, targetRegion);
        attemptedVariants.push(variant);

        try {
          const checkResponse = await rateLimitedFetch(candidateUrl, { method: 'HEAD', redirect: 'manual' });

          if (checkResponse.status === 200) {
            // Verify it's not a soft 404
            const soft = await isSoft404(candidateUrl);
            if (!soft) {
              result.suggested_fix_url = candidateUrl;
              result.fix_source = 'slug_variant';
              result.fix_validated = true;
              result.details = { ...result.details, attempted_variants: attemptedVariants, winning_variant: variant };
              result.response_time_ms = Date.now() - start;
              return result;
            }
          }

          // Follow redirect if it goes to a product page
          if (checkResponse.status >= 300 && checkResponse.status < 400) {
            const loc = checkResponse.headers.get('location');
            if (loc) {
              const absLoc = loc.startsWith('http') ? loc : new URL(loc, candidateUrl).href;
              const locParsed = parseCrealityUrl(absLoc);
              if (locParsed) {
                // Redirect goes to another product — check it
                const finalCheck = await rateLimitedFetch(absLoc, { method: 'HEAD' });
                if (finalCheck.status === 200) {
                  result.suggested_fix_url = absLoc;
                  result.fix_source = 'slug_variant';
                  result.fix_validated = true;
                  result.details = { ...result.details, attempted_variants: attemptedVariants, winning_variant: variant, via_redirect: true };
                  result.response_time_ms = Date.now() - start;
                  return result;
                }
              }
            }
          }
        } catch {
          // Skip this variant on error
        }
      }

      result.details = { ...result.details, attempted_variants: attemptedVariants };
    }

    // Step 3: Try other regions to see if the product exists elsewhere
    if (!result.is_valid && !result.suggested_fix_url) {
      const otherRegions = Object.keys(REGION_PREFIXES).filter(r => r !== (region || parsed.region));
      const regionChecks: string[] = [];

      for (const r of otherRegions.slice(0, 3)) { // check up to 3 other regions
        const regionUrl = buildCrealityUrl(parsed.handle, r);
        regionChecks.push(r);

        try {
          const checkResponse = await rateLimitedFetch(regionUrl, { method: 'HEAD' });
          if (checkResponse.status === 200) {
            result.details = {
              ...result.details,
              note: `Product exists in ${r} region but not in ${region || parsed.region}`,
              available_in_region: r,
              region_url: regionUrl,
              regions_checked: regionChecks,
            };
            // Don't suggest as fix since it's a different region
            break;
          }
        } catch { /* skip */ }
      }
    }

  } catch (e: any) {
    if (e.name === 'AbortError') {
      result.failure_reason = 'timeout';
      result.details = { error: 'Request timed out' };
    } else {
      result.failure_reason = 'error';
      result.details = { error: e.message };
    }
  }

  result.response_time_ms = Date.now() - start;
  return result;
}

// ─── Batch validation with proper rate limiting ───────────────────────────────

export async function validateCrealityUrls(
  urls: Array<{ url: string; product_id: string; region: string; url_column: string }>,
  onProgress?: (completed: number, total: number) => void
): Promise<CrealityValidationResult[]> {
  const results: CrealityValidationResult[] = [];

  for (let i = 0; i < urls.length; i++) {
    const item = urls[i];
    const result = await validateCrealityUrl(item.url, item.region);
    results.push(result);

    if (onProgress) onProgress(i + 1, urls.length);
  }

  return results;
}
