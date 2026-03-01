import { useState, useCallback } from 'react';
import { withRetry, RetryOptions } from '@/lib/retry';

export function useRetry(options?: RetryOptions) {
  const [isRetrying, setIsRetrying] = useState(false);
  const [retryCount, setRetryCount] = useState(0);

  const retryWithBackoff = useCallback(
    async <T>(fn: () => Promise<T>): Promise<T> => {
      setIsRetrying(true);
      setRetryCount(0);
      try {
        const result = await withRetry(fn, {
          ...options,
          shouldRetry: (error) => {
            setRetryCount(c => c + 1);
            return options?.shouldRetry?.(error) ?? true;
          },
        });
        setRetryCount(0);
        return result;
      } finally {
        setIsRetrying(false);
      }
    },
    [options]
  );

  return { retryWithBackoff, isRetrying, retryCount };
}
