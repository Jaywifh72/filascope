export interface RetryOptions {
  maxRetries?: number;
  baseDelay?: number;
  maxDelay?: number;
  backoffMultiplier?: number;
  shouldRetry?: (error: any) => boolean;
}

function defaultShouldRetry(error: any): boolean {
  // Always retry fetch/network failures (TypeError)
  if (error instanceof TypeError) return true;
  // Retry 5xx, don't retry 4xx
  const status = error?.status ?? error?.response?.status;
  if (typeof status === 'number') return status >= 500;
  return true;
}

/**
 * Execute an async function with exponential backoff + jitter.
 * Complements retryWithBackoff.ts by adding jitter and smart shouldRetry.
 */
export async function withRetry<T>(
  fn: () => Promise<T>,
  options?: RetryOptions
): Promise<T> {
  const {
    maxRetries = 2,
    baseDelay = 1000,
    maxDelay = 8000,
    backoffMultiplier = 2,
    shouldRetry = defaultShouldRetry,
  } = options ?? {};

  let lastError: any;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      if (attempt < maxRetries && shouldRetry(error)) {
        const raw = Math.min(baseDelay * Math.pow(backoffMultiplier, attempt), maxDelay);
        const jittered = raw * (0.8 + Math.random() * 0.4);
        await new Promise(r => setTimeout(r, jittered));
      } else {
        throw error;
      }
    }
  }

  throw lastError;
}
