/**
 * Universal fetch wrapper with timeout for all FilaScope scrapers
 *
 * This prevents edge function timeouts by failing fast on slow responses.
 * Supabase edge functions have a 15-second execution limit, so individual
 * fetch requests must complete well within this window.
 *
 * Usage:
 * ```typescript
 * import { fetchWithTimeout } from '../_shared/fetch-with-timeout.ts';
 *
 * const response = await fetchWithTimeout(url, {
 *   headers: { 'User-Agent': 'FilaScopeBot/1.0' },
 * }, 10000); // 10 second timeout
 * ```
 *
 * Recommended timeout values:
 * - API calls (Shopify JSON, REST APIs): 8-12 seconds
 * - HTML scraping (product pages): 15-20 seconds
 * - Image downloads: 10 seconds (should use CDN)
 *
 * For complex multi-step scrapers, allocate timeouts per step to ensure
 * the total execution time stays under 15 seconds.
 */

/**
 * Fetch with timeout support
 *
 * @param url - The URL to fetch
 * @param options - RequestInit options (headers, method, etc.)
 * @param timeoutMs - Timeout in milliseconds (default: 10000ms = 10s)
 * @returns Promise<Response> - Fetch response
 * @throws Error if timeout or fetch fails
 */
export async function fetchWithTimeout(
  url: string,
  options: RequestInit = {},
  timeoutMs: number = 10000
): Promise<Response> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
    });
    clearTimeout(timeoutId);
    return response;
  } catch (error) {
    clearTimeout(timeoutId);
    if (error instanceof Error && error.name === 'AbortError') {
      throw new Error(`Request timeout after ${timeoutMs}ms: ${url}`);
    }
    throw error;
  }
}

/**
 * Fetch with retry logic for transient failures
 *
 * @param url - The URL to fetch
 * @param options - RequestInit options
 * @param timeoutMs - Timeout per attempt
 * @param maxAttempts - Maximum number of retry attempts (default: 3)
 * @param baseDelayMs - Base delay between retries (default: 1000ms)
 * @returns Promise<Response> - Fetch response
 * @throws Error if all attempts fail
 */
export async function fetchWithRetry(
  url: string,
  options: RequestInit = {},
  timeoutMs: number = 10000,
  maxAttempts: number = 3,
  baseDelayMs: number = 1000
): Promise<Response> {
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fetchWithTimeout(url, options, timeoutMs);
    } catch (error) {
      const isLastAttempt = attempt === maxAttempts;
      const delayMs = baseDelayMs * Math.pow(2, attempt - 1);

      if (isLastAttempt) {
        console.error(
          `[FETCH_RETRY] All ${maxAttempts} attempts failed for ${url}:`,
          error
        );
        throw error;
      }

      console.log(
        `[FETCH_RETRY] Attempt ${attempt}/${maxAttempts} failed for ${url}, ` +
        `retrying in ${delayMs}ms...`
      );
      await new Promise(resolve => setTimeout(resolve, delayMs));
    }
  }

  throw new Error('Fetch retry logic error: should never reach here');
}

/**
 * Configuration presets for common scraping scenarios
 */
export const TIMEOUT_PRESETS = {
  /** Fast API calls (Shopify JSON, REST APIs) */
  FAST: 8000,           // 8 seconds
  /** Standard HTML scraping (product pages, catalogs) */

  // SLOW preset for slower websites/APIs (15s - max edge function timeout)
  SLOW: 15000,

  // SLOW preset for slower websites/APIs (15s - max edge function timeout)
  SLOW: 15000,
  STANDARD: 12000,      // 12 seconds
  /** Complex pages (large product listings, heavy JS sites) */
  COMPLEX: 15000,       // 15 seconds (approaches edge function limit)
  /** Image/media downloads (should prefer CDN links) */
  MEDIA: 10000,         // 10 seconds
  /** TDS PDF/document validation */
  DOCUMENT: 20000,      // 20 seconds (only for final validation step)
} as const;

/**
 * User agent presets for different scraping scenarios
 */
export const USER_AGENTS = {
  /** Standard bot identification (recommended for most scrapers) */
  BOT: 'FilaScopeBot/1.0 (+https://filascope.com)',
  /** Browser-like identification (for sites blocking bots) */
  BROWSER: 'Mozilla/5.0 (compatible; FilaScopeBot/1.0; +https://filascope.com)',
  /** Minimal identification (for restrictive sites) */
  MINIMAL: 'FilaScope/1.0',
} as const;
