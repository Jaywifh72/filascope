import { useState, useEffect, useCallback, useRef } from 'react';
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
 * Uses history.replaceState for clean URLs without navigation/redirect loops
 */
export function useFilamentBySlug(idOrSlug: string | undefined): UseFilamentBySlugResult {
  const [filament, setFilament] = useState<Filament | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  // isRedirecting is now deprecated but kept for backward compatibility
  const [isRedirecting] = useState(false);
  const lastIdOrSlugRef = useRef<string | undefined>(undefined);

  const fetchFilament = useCallback(async () => {
    if (!idOrSlug) {
      setLoading(false);
      setError('No filament ID provided');
      return;
    }

    // Reset state when URL parameter changes
    if (lastIdOrSlugRef.current !== idOrSlug) {
      setFilament(null);
      setError(null);
      lastIdOrSlugRef.current = idOrSlug;
    }

    setLoading(true);
    setError(null);

    try {
      let data: Filament | null = null;

      if (isUuid(idOrSlug)) {
        // Fetch by UUID - render immediately, no redirect
        const { data: uuidData, error: uuidError } = await supabase
          .from('filaments')
          .select('*')
          .eq('id', idOrSlug)
          .maybeSingle();

        if (uuidError) throw uuidError;
        data = uuidData;

        // If found, update URL to SEO-friendly slug without navigation
        if (data) {
          const slug = data.product_handle || generateFilamentSlug(
            data.vendor,
            data.material,
            data.product_title,
            data.color_family
          );
          
          if (slug && slug !== idOrSlug) {
            // Update URL for SEO without triggering navigation
            window.history.replaceState(null, '', `/filament/${slug}`);
            
            // Optionally update product_handle in background for future lookups
            if (!data.product_handle && slug) {
              (async () => {
                try {
                  await supabase
                    .from('filaments')
                    .update({ product_handle: slug })
                    .eq('id', data!.id);
                  console.log('[useFilamentBySlug] Updated product_handle for', data!.id);
                } catch (err) {
                  console.warn('[useFilamentBySlug] Failed to update product_handle:', err);
                }
              })();
            }
          }
        }
      } else {
        // Fetch by product_handle (slug)
        const { data: slugData, error: slugError } = await supabase
          .from('filaments')
          .select('*')
          .eq('product_handle', idOrSlug)
          .limit(1);

        if (slugError) throw slugError;
        data = slugData?.[0] ?? null;

        // If not found by product_handle, try fuzzy matching
        if (!data) {
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
        if (!data) {
          const parsed = parseFilamentSlug(idOrSlug);
          
          if (parsed.brand || parsed.material || parsed.color) {
            let query = supabase.from('filaments').select('*');
            
            if (parsed.brand) {
              const brandNormalized = parsed.brand.replace(/-/g, ' ');
              query = query.ilike('vendor', `%${brandNormalized}%`);
            }
            
            if (parsed.material) {
              query = query.ilike('material', `%${parsed.material}%`);
            }
            
            if (parsed.color) {
              const colorNormalized = parsed.color.replace(/-/g, ' ');
              query = query.or(`color_family.ilike.%${colorNormalized}%,product_title.ilike.%${colorNormalized}%`);
            }
            
            const { data: componentData, error: componentError } = await query.limit(5);
            
            if (!componentError && componentData?.length) {
              const bestMatch = componentData.find(f => {
                const generatedSlug = generateFilamentSlug(f.vendor, f.material, f.product_title, f.color_family);
                return generatedSlug === idOrSlug;
              });
              
              if (bestMatch) {
                data = bestMatch;
                // Update product_handle for future lookups
                (async () => {
                  try {
                    await supabase
                      .from('filaments')
                      .update({ product_handle: idOrSlug })
                      .eq('id', bestMatch.id);
                    console.log('[useFilamentBySlug] Updated product_handle for matched filament');
                  } catch {
                    // Silently ignore - this is a background optimization
                  }
                })();
              } else if (componentData.length === 1) {
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
  }, [idOrSlug]);

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
