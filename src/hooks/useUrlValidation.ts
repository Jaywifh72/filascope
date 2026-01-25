import { useState, useEffect, useCallback } from 'react';
import { 
  UrlValidationResult, 
  validateStoreUrl, 
  getUrlValidationFromCache,
  getValidatedUrl
} from '@/services/urlValidationService';

interface UseUrlValidationOptions {
  /** Skip validation if true */
  skip?: boolean;
  /** Force recheck even if cached */
  forceRecheck?: boolean;
  /** Fallback URL if primary is invalid */
  fallbackUrl?: string;
}

interface UseUrlValidationResult {
  /** The best URL to use (original, redirect, or fallback) */
  validatedUrl: string;
  /** Full validation result */
  validation: UrlValidationResult | null;
  /** Whether validation is in progress */
  isValidating: boolean;
  /** Whether the URL is known to be invalid */
  isInvalid: boolean;
  /** Whether the URL was redirected */
  isRedirect: boolean;
  /** Manually trigger revalidation */
  revalidate: () => Promise<void>;
}

/**
 * Hook to validate a store URL and get the best URL to use
 */
export function useUrlValidation(
  url: string | null | undefined,
  options: UseUrlValidationOptions = {}
): UseUrlValidationResult {
  const { skip = false, forceRecheck = false, fallbackUrl } = options;
  
  const [validation, setValidation] = useState<UrlValidationResult | null>(null);
  const [isValidating, setIsValidating] = useState(false);
  
  const validate = useCallback(async () => {
    if (!url || skip) {
      setValidation(null);
      return;
    }
    
    setIsValidating(true);
    
    try {
      // Check cache first for instant feedback
      if (!forceRecheck) {
        const cached = await getUrlValidationFromCache(url);
        if (cached) {
          setValidation(cached);
          setIsValidating(false);
          return;
        }
      }
      
      // Validate via edge function
      const result = await validateStoreUrl(url, forceRecheck);
      setValidation(result);
    } catch (error) {
      console.error('URL validation error:', error);
      setValidation({
        url,
        status: 'unknown',
        statusCode: null,
        redirectUrl: null,
        lastChecked: new Date(),
        fromCache: false
      });
    } finally {
      setIsValidating(false);
    }
  }, [url, skip, forceRecheck]);
  
  useEffect(() => {
    validate();
  }, [validate]);
  
  // Determine the best URL to use
  const validatedUrl = (() => {
    if (!url) return fallbackUrl || '';
    if (!validation) return url;
    
    if (validation.status === 'valid') return url;
    if (validation.status === 'redirect' && validation.redirectUrl) {
      return validation.redirectUrl;
    }
    if (validation.status === 'invalid' && fallbackUrl) {
      return fallbackUrl;
    }
    
    return url;
  })();
  
  return {
    validatedUrl,
    validation,
    isValidating,
    isInvalid: validation?.status === 'invalid',
    isRedirect: validation?.status === 'redirect',
    revalidate: validate
  };
}

/**
 * Hook to get a validated URL with automatic fallback
 */
export function useValidatedUrl(
  url: string | null | undefined,
  fallbackUrl?: string
): string {
  const { validatedUrl } = useUrlValidation(url, { fallbackUrl });
  return validatedUrl;
}
