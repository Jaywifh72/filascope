import { supabase } from "@/integrations/supabase/client";

export interface UrlValidationResult {
  url: string;
  status: 'valid' | 'invalid' | 'redirect' | 'unknown';
  statusCode: number | null;
  redirectUrl: string | null;
  lastChecked: Date;
  fromCache?: boolean;
}

interface CachedValidation {
  url: string;
  status: string;
  status_code: number | null;
  redirect_url: string | null;
  last_checked: string;
}

// Cache TTL in hours
const CACHE_TTL_HOURS = 24;

/**
 * Check URL validation from local cache (database)
 */
export async function getUrlValidationFromCache(url: string): Promise<UrlValidationResult | null> {
  try {
    const { data, error } = await supabase
      .from('url_validation_cache')
      .select('*')
      .eq('url', url)
      .single();
    
    if (error || !data) return null;
    
    // Check if cache is still valid
    const lastChecked = new Date(data.last_checked);
    const hoursAgo = (Date.now() - lastChecked.getTime()) / (1000 * 60 * 60);
    
    if (hoursAgo > CACHE_TTL_HOURS) return null;
    
    return {
      url: data.url,
      status: data.status as UrlValidationResult['status'],
      statusCode: data.status_code,
      redirectUrl: data.redirect_url,
      lastChecked,
      fromCache: true
    };
  } catch (error) {
    console.error('Error checking URL validation cache:', error);
    return null;
  }
}

/**
 * Validate a URL using the edge function
 */
export async function validateStoreUrl(url: string, forceRecheck = false): Promise<UrlValidationResult> {
  try {
    // Check cache first (unless forcing recheck)
    if (!forceRecheck) {
      const cached = await getUrlValidationFromCache(url);
      if (cached) return cached;
    }
    
    // Call edge function to validate
    const { data, error } = await supabase.functions.invoke('validate-url', {
      body: { url, forceRecheck }
    });
    
    if (error) throw error;
    
    return {
      url: data.url,
      status: data.status,
      statusCode: data.status_code || data.statusCode,
      redirectUrl: data.redirect_url || data.redirectUrl,
      lastChecked: new Date(data.last_checked || data.lastChecked),
      fromCache: data.fromCache
    };
  } catch (error) {
    console.error('Error validating URL:', error);
    return {
      url,
      status: 'unknown',
      statusCode: null,
      redirectUrl: null,
      lastChecked: new Date(),
      fromCache: false
    };
  }
}

/**
 * Batch validate multiple URLs
 */
export async function validateStoreUrls(urls: string[]): Promise<UrlValidationResult[]> {
  if (urls.length === 0) return [];
  
  try {
    // Check cache first
    const cachedResults: UrlValidationResult[] = [];
    const uncachedUrls: string[] = [];
    
    for (const url of urls) {
      const cached = await getUrlValidationFromCache(url);
      if (cached) {
        cachedResults.push(cached);
      } else {
        uncachedUrls.push(url);
      }
    }
    
    // If all are cached, return early
    if (uncachedUrls.length === 0) return cachedResults;
    
    // Validate uncached URLs via edge function
    const { data, error } = await supabase.functions.invoke('validate-url', {
      body: { urls: uncachedUrls }
    });
    
    if (error) throw error;
    
    const freshResults = (data.results || []).map((r: any) => ({
      url: r.url,
      status: r.status,
      statusCode: r.status_code || r.statusCode,
      redirectUrl: r.redirect_url || r.redirectUrl,
      lastChecked: new Date(r.last_checked || r.lastChecked),
      fromCache: false
    }));
    
    return [...cachedResults, ...freshResults];
  } catch (error) {
    console.error('Error batch validating URLs:', error);
    return urls.map(url => ({
      url,
      status: 'unknown' as const,
      statusCode: null,
      redirectUrl: null,
      lastChecked: new Date(),
      fromCache: false
    }));
  }
}

/**
 * Get a validated URL - returns redirect URL if available, or original if valid
 */
export async function getValidatedUrl(url: string, fallbackUrl?: string): Promise<string> {
  const validation = await validateStoreUrl(url);
  
  if (validation.status === 'valid') {
    return url;
  }
  
  if (validation.status === 'redirect' && validation.redirectUrl) {
    return validation.redirectUrl;
  }
  
  if (validation.status === 'invalid' && fallbackUrl) {
    return fallbackUrl;
  }
  
  // Return original URL for 'unknown' status
  return url;
}

/**
 * Check if a URL is known to be invalid
 */
export async function isUrlInvalid(url: string): Promise<boolean> {
  const cached = await getUrlValidationFromCache(url);
  return cached?.status === 'invalid';
}
