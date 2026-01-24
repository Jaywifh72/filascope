import { useState, useCallback } from 'react';
import { useErrorReporting } from '@/components/analytics/ErrorBoundary';

interface UseApiErrorOptions {
  /** Maximum number of retry attempts */
  maxRetries?: number;
  /** Delay between retries in milliseconds */
  retryDelay?: number;
  /** Context for error logging */
  context?: string;
}

interface ApiErrorState {
  /** Whether an error has occurred */
  hasError: boolean;
  /** Error message to display */
  message: string | null;
  /** Type of error for UI styling */
  errorType: 'network' | 'server' | 'generic';
  /** Number of retry attempts made */
  retryCount: number;
}

/**
 * Hook for handling API errors with retry functionality
 * 
 * Features:
 * - Automatic error type detection (network, server, generic)
 * - Retry mechanism with configurable attempts
 * - Error logging to database
 * - User-friendly error messages
 */
export function useApiError(options: UseApiErrorOptions = {}) {
  const { maxRetries = 3, retryDelay = 1000, context = 'api' } = options;
  const { reportError } = useErrorReporting();
  
  const [errorState, setErrorState] = useState<ApiErrorState>({
    hasError: false,
    message: null,
    errorType: 'generic',
    retryCount: 0,
  });
  
  const [isRetrying, setIsRetrying] = useState(false);

  const detectErrorType = (error: Error | Response | unknown): 'network' | 'server' | 'generic' => {
    // Network errors (offline, DNS, etc.)
    if (error instanceof TypeError && error.message.includes('fetch')) {
      return 'network';
    }
    
    // Check if it's a Response object with status
    if (error instanceof Response) {
      if (error.status >= 500) return 'server';
      if (error.status === 0) return 'network';
    }
    
    // Check error message for clues
    if (error instanceof Error) {
      const msg = error.message.toLowerCase();
      if (msg.includes('network') || msg.includes('offline') || msg.includes('failed to fetch')) {
        return 'network';
      }
      if (msg.includes('500') || msg.includes('server') || msg.includes('internal')) {
        return 'server';
      }
    }
    
    return 'generic';
  };

  const getUserFriendlyMessage = (errorType: 'network' | 'server' | 'generic'): string => {
    switch (errorType) {
      case 'network':
        return 'Unable to connect. Please check your internet connection.';
      case 'server':
        return 'Our servers are having trouble. Please try again in a moment.';
      default:
        return 'Something went wrong. Please try again.';
    }
  };

  const handleError = useCallback(async (error: Error | unknown, customMessage?: string) => {
    const errorType = detectErrorType(error);
    const message = customMessage || getUserFriendlyMessage(errorType);
    
    setErrorState(prev => ({
      hasError: true,
      message,
      errorType,
      retryCount: prev.retryCount,
    }));
    
    // Log the error
    if (error instanceof Error) {
      await reportError(error, { context, errorType });
    } else {
      await reportError(String(error), { context, errorType });
    }
  }, [context, reportError]);

  const clearError = useCallback(() => {
    setErrorState({
      hasError: false,
      message: null,
      errorType: 'generic',
      retryCount: 0,
    });
  }, []);

  const retry = useCallback(async <T>(
    operation: () => Promise<T>
  ): Promise<T | null> => {
    if (errorState.retryCount >= maxRetries) {
      setErrorState(prev => ({
        ...prev,
        message: 'Maximum retry attempts reached. Please refresh the page.',
      }));
      return null;
    }
    
    setIsRetrying(true);
    
    try {
      // Wait before retrying
      await new Promise(resolve => setTimeout(resolve, retryDelay));
      
      const result = await operation();
      clearError();
      return result;
    } catch (error) {
      setErrorState(prev => ({
        ...prev,
        retryCount: prev.retryCount + 1,
      }));
      await handleError(error);
      return null;
    } finally {
      setIsRetrying(false);
    }
  }, [errorState.retryCount, maxRetries, retryDelay, clearError, handleError]);

  const executeWithErrorHandling = useCallback(async <T>(
    operation: () => Promise<T>,
    options?: { onError?: (error: unknown) => void }
  ): Promise<T | null> => {
    try {
      const result = await operation();
      clearError();
      return result;
    } catch (error) {
      await handleError(error);
      options?.onError?.(error);
      return null;
    }
  }, [clearError, handleError]);

  return {
    ...errorState,
    isRetrying,
    canRetry: errorState.retryCount < maxRetries,
    handleError,
    clearError,
    retry,
    executeWithErrorHandling,
  };
}

/**
 * Simple wrapper for try-catch with error logging
 */
export async function safeApiCall<T>(
  operation: () => Promise<T>,
  fallback: T
): Promise<T> {
  try {
    return await operation();
  } catch (error) {
    console.error('[API Error]', error);
    return fallback;
  }
}
