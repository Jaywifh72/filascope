import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

/**
 * Check if a product URL is known to be broken via the validation cache.
 * Returns { isBroken, isRedirect, redirectUrl } synchronously from cache.
 */
export function useBrokenUrlCheck(url: string | null | undefined) {
  const { data } = useQuery({
    queryKey: ['url-broken-check', url],
    queryFn: async () => {
      if (!url) return null;
      const { data, error } = await supabase
        .from('url_validation_cache')
        .select('status, redirect_url')
        .eq('url', url)
        .maybeSingle();
      if (error || !data) return null;
      return data;
    },
    enabled: !!url,
    staleTime: 5 * 60 * 1000, // 5 min
  });

  return {
    isBroken: data?.status === 'invalid',
    isRedirect: data?.status === 'redirect',
    redirectUrl: data?.redirect_url || null,
    status: data?.status || null,
  };
}
