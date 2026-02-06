import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { 
  isUuid, 
  generateFilamentSlug, 
  parseFilamentSlug,
  calculateSlugSimilarity,
  extractPrimaryColor
} from '@/lib/seoSlugUtils';
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
 * Find the best matching filament from candidates based on slug similarity
 */
function findBestMatch(candidates: Filament[], targetSlug: string): Filament | null {
  if (!candidates.length) return null;
  if (candidates.length === 1) return candidates[0];
  
  let bestMatch: Filament | null = null;
  let bestScore = -1;
  
  for (const filament of candidates) {
    const generatedSlug = generateFilamentSlug(
      filament.vendor,
      filament.material,
      filament.product_title,
      filament.color_family
    );
    
    const score = calculateSlugSimilarity(generatedSlug, targetSlug);
    
    if (score > bestScore) {
      bestScore = score;
      bestMatch = filament;
    }
  }
  
  return bestMatch;
}

/**
 * Update product_handle in background for future lookups
 */
async function updateProductHandle(filamentId: string, slug: string): Promise<void> {
  try {
    await supabase
      .from('filaments')
      .update({ product_handle: slug })
      .eq('id', filamentId);
    console.log('[useFilamentBySlug] Updated product_handle for', filamentId);
  } catch (err) {
    console.warn('[useFilamentBySlug] Failed to update product_handle:', err);
  }
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
            
            // Update product_handle in background for future lookups
            if (!data.product_handle && slug) {
              updateProductHandle(data.id, slug);
            }
          }
        }
      } else {
        // Multi-stage fallback search for slug-based lookups
        data = await searchBySlug(idOrSlug);
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
 * Multi-stage fallback search for slug-based lookups
 */
async function searchBySlug(slug: string): Promise<Filament | null> {
  // Stage 1: Exact product_handle match
  const { data: exactMatch, error: exactError } = await supabase
    .from('filaments')
    .select('*')
    .eq('product_handle', slug)
    .limit(1);

  if (!exactError && exactMatch?.[0]) {
    console.log('[useFilamentBySlug] Found by exact product_handle');
    return exactMatch[0];
  }

  // Stage 2: Fuzzy product_handle match
  const { data: fuzzyMatch, error: fuzzyError } = await supabase
    .from('filaments')
    .select('*')
    .ilike('product_handle', `%${slug}%`)
    .limit(5);

  if (!fuzzyError && fuzzyMatch?.length) {
    const best = findBestMatch(fuzzyMatch, slug);
    if (best) {
      console.log('[useFilamentBySlug] Found by fuzzy product_handle');
      return best;
    }
  }

  // Stage 3+: Component-based search
  const parsed = parseFilamentSlug(slug);
  
  if (!parsed.brand && !parsed.material) {
    // Can't do component search without at least brand or material
    return null;
  }

  // Stage 3: Brand + Material + Full Color
  if (parsed.color) {
    const colorNormalized = parsed.color.replace(/-/g, ' ');
    const result = await searchByComponents(parsed.brand, parsed.material, colorNormalized, slug);
    if (result) {
      console.log('[useFilamentBySlug] Found by brand+material+color');
      return result;
    }
  }

  // Stage 4: Brand + Material + Primary Color Word
  if (parsed.color) {
    const primaryColor = extractPrimaryColor(parsed.color);
    if (primaryColor && primaryColor !== parsed.color.replace(/-/g, ' ')) {
      const result = await searchByComponents(parsed.brand, parsed.material, primaryColor, slug);
      if (result) {
        console.log('[useFilamentBySlug] Found by brand+material+primaryColor');
        return result;
      }
    }
  }

  // Stage 5: Brand + Material only (best-effort)
  const result = await searchByComponents(parsed.brand, parsed.material, undefined, slug);
  if (result) {
    console.log('[useFilamentBySlug] Found by brand+material only (best-effort)');
    return result;
  }

  return null;
}

/**
 * Search by component fields with similarity scoring
 */
async function searchByComponents(
  brand: string | undefined,
  material: string | undefined,
  color: string | undefined,
  targetSlug: string
): Promise<Filament | null> {
  let query = supabase.from('filaments').select('*');
  
  if (brand) {
    const brandNormalized = brand.replace(/-/g, ' ');
    query = query.ilike('vendor', `%${brandNormalized}%`);
  }
  
  if (material) {
    query = query.ilike('material', `%${material}%`);
  }
  
  if (color) {
    query = query.or(`color_family.ilike.%${color}%,product_title.ilike.%${color}%`);
  }
  
  const { data, error } = await query.limit(20);
  
  if (error || !data?.length) {
    return null;
  }

  // Find best match using similarity scoring
  const bestMatch = findBestMatch(data, targetSlug);
  
  if (bestMatch) {
    // Auto-heal: update product_handle for future lookups
    if (!bestMatch.product_handle) {
      updateProductHandle(bestMatch.id, targetSlug);
    }
  }
  
  return bestMatch;
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
