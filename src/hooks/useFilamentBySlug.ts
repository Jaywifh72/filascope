import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { isUuid, generateFilamentSlug } from '@/lib/seoSlugUtils';
import type { Database } from '@/integrations/supabase/types';

type Filament = Database['public']['Tables']['filaments']['Row'];

interface UseFilamentBySlugResult {
  filament: Filament | null;
  loading: boolean;
  error: string | null;
  isRedirecting: boolean;
  refetch: () => Promise<void>;
}

/**
 * Hook to fetch a filament by either UUID or SEO-friendly slug
 * Automatically redirects UUID URLs to slug URLs for SEO
 */
export function useFilamentBySlug(idOrSlug: string | undefined): UseFilamentBySlugResult {
  const navigate = useNavigate();
  const [filament, setFilament] = useState<Filament | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isRedirecting, setIsRedirecting] = useState(false);

  const fetchFilament = useCallback(async () => {
    if (!idOrSlug) {
      setLoading(false);
      setError('No filament ID provided');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      let data: Filament | null = null;

      if (isUuid(idOrSlug)) {
        // Fetch by UUID
        const { data: uuidData, error: uuidError } = await supabase
          .from('filaments')
          .select('*')
          .eq('id', idOrSlug)
          .maybeSingle();

        if (uuidError) throw uuidError;
        data = uuidData;

        // If found and has product_handle, redirect to slug URL
        if (data?.product_handle) {
          setIsRedirecting(true);
          navigate(`/filament/${data.product_handle}`, { replace: true });
          return;
        }
        
        // Generate and redirect to SEO-friendly slug
        if (data) {
          const slug = generateFilamentSlug(
            data.vendor,
            data.material,
            data.product_title,
            data.color_family
          );
          
          if (slug && slug !== idOrSlug) {
            // Update the product_handle in DB for future use
            await supabase
              .from('filaments')
              .update({ product_handle: slug })
              .eq('id', data.id);
            
            setIsRedirecting(true);
            navigate(`/filament/${slug}`, { replace: true });
            return;
          }
        }
      } else {
        // Fetch by product_handle (slug)
        // Use .limit(1) instead of .maybeSingle() since product_handle is not unique
        const { data: slugData, error: slugError } = await supabase
          .from('filaments')
          .select('*')
          .eq('product_handle', idOrSlug)
          .limit(1);

        if (slugError) throw slugError;
        data = slugData?.[0] ?? null;

        // If not found by product_handle, try fuzzy matching
        if (!data) {
          // Try matching by vendor + material pattern
          const { data: fuzzyData, error: fuzzyError } = await supabase
            .from('filaments')
            .select('*')
            .ilike('product_handle', `%${idOrSlug}%`)
            .limit(1);

          if (!fuzzyError && fuzzyData?.[0]) {
            data = fuzzyData[0];
          }
        }
      }

      if (!data) {
        setError('Filament not found');
      }

      setFilament(data);
    } catch (err: any) {
      console.error('Error fetching filament:', err);
      setError(err.message || 'Failed to load filament');
    } finally {
      setLoading(false);
    }
  }, [idOrSlug, navigate]);

  useEffect(() => {
    fetchFilament();
  }, [fetchFilament]);

  const refetch = useCallback(async () => {
    await fetchFilament();
  }, [fetchFilament]);

  return { filament, loading, error, isRedirecting, refetch };
}

/**
 * Get the SEO-friendly URL for a filament
 */
export function getFilamentSeoUrl(filament: Filament): string {
  if (filament.product_handle) {
    return `/filament/${filament.product_handle}`;
  }
  
  const slug = generateFilamentSlug(
    filament.vendor,
    filament.material,
    filament.product_title,
    filament.color_family
  );
  
  return `/filament/${slug || filament.id}`;
}
