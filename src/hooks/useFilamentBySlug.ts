import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { isUuid, generateFilamentSlug, parseFilamentSlug } from '@/lib/seoSlugUtils';
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

        // If still not found, try to parse the slug and search by components
        // This handles cases where product_handle is NULL but slug can be matched
        if (!data) {
          const parsed = parseFilamentSlug(idOrSlug);
          
          if (parsed.brand || parsed.material || parsed.color) {
            // Build a query that matches the slug components
            let query = supabase.from('filaments').select('*');
            
            // Match vendor (brand)
            if (parsed.brand) {
              // Handle common brand name variations
              const brandNormalized = parsed.brand.replace(/-/g, ' ');
              query = query.ilike('vendor', `%${brandNormalized}%`);
            }
            
            // Match material
            if (parsed.material) {
              query = query.ilike('material', `%${parsed.material}%`);
            }
            
            // Match color in color_family or product_title
            if (parsed.color) {
              const colorNormalized = parsed.color.replace(/-/g, ' ');
              query = query.or(`color_family.ilike.%${colorNormalized}%,product_title.ilike.%${colorNormalized}%`);
            }
            
            const { data: componentData, error: componentError } = await query.limit(5);
            
            if (!componentError && componentData?.length) {
              // Find best match by scoring how well the generated slug matches
              const bestMatch = componentData.find(f => {
                const generatedSlug = generateFilamentSlug(f.vendor, f.material, f.product_title, f.color_family);
                return generatedSlug === idOrSlug;
              });
              
              if (bestMatch) {
                data = bestMatch;
                // Update the product_handle for future lookups
                await supabase
                  .from('filaments')
                  .update({ product_handle: idOrSlug })
                  .eq('id', bestMatch.id);
              } else if (componentData.length === 1) {
                // If only one match found, use it
                data = componentData[0];
              }
            }
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
