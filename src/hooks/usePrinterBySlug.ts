import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { isUuid, generatePrinterSlug, calculateSlugSimilarity, normalizeSlug } from '@/lib/printerSlugUtils';
import type { Database } from '@/integrations/supabase/types';

type Printer = Database['public']['Tables']['printers']['Row'] & {
  brand?: { brand: string; warranty_years?: number | null; warranty_coverage?: string | null } | null;
  series?: { series_name: string } | null;
};

interface UsePrinterBySlugResult {
  printer: Printer | null;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

/**
 * Find the best matching printer from candidates based on slug similarity
 */
function findBestMatch(candidates: Printer[], targetSlug: string): Printer | null {
  if (!candidates.length) return null;
  if (candidates.length === 1) return candidates[0];
  
  let bestMatch: Printer | null = null;
  let bestScore = -1;
  
  for (const printer of candidates) {
    const brandName = typeof printer.brand === 'object' && printer.brand?.brand 
      ? printer.brand.brand 
      : '';
    const generatedSlug = generatePrinterSlug(brandName, printer.model_name);
    const score = calculateSlugSimilarity(generatedSlug, targetSlug);
    
    if (score > bestScore) {
      bestScore = score;
      bestMatch = printer;
    }
  }
  
  return bestMatch;
}

/**
 * Update printer_id in background for future lookups
 */
async function updatePrinterId(printerId: string, slug: string): Promise<void> {
  try {
    await supabase
      .from('printers')
      .update({ printer_id: slug })
      .eq('id', printerId);
    console.log('[usePrinterBySlug] Updated printer_id for', printerId);
  } catch (err) {
    console.warn('[usePrinterBySlug] Failed to update printer_id:', err);
  }
}

/**
 * Hook to fetch a printer by either UUID or SEO-friendly slug (printer_id)
 * Uses history.replaceState for clean URLs without navigation/redirect loops
 */
export function usePrinterBySlug(idOrSlug: string | undefined): UsePrinterBySlugResult {
  const [printer, setPrinter] = useState<Printer | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const lastIdOrSlugRef = useRef<string | undefined>(undefined);

  const fetchPrinter = useCallback(async () => {
    if (!idOrSlug) {
      setLoading(false);
      setError('No printer ID provided');
      return;
    }

    // Reset state when URL parameter changes
    if (lastIdOrSlugRef.current !== idOrSlug) {
      setPrinter(null);
      setError(null);
      lastIdOrSlugRef.current = idOrSlug;
    }

    setLoading(true);
    setError(null);

    try {
      let data: Printer | null = null;
      const normalizedSlug = normalizeSlug(idOrSlug);

      if (isUuid(idOrSlug)) {
        // Fetch by UUID - render immediately, then update URL
        const { data: uuidData, error: uuidError } = await supabase
          .from('printers')
          .select(`
            *,
            brand:printer_brands!brand_id(brand, warranty_years, warranty_coverage),
            series:printer_series!series_id(series_name)
          `)
          .eq('id', idOrSlug)
          .maybeSingle();

        if (uuidError) throw uuidError;
        data = uuidData as Printer | null;

        // If found, update URL to SEO-friendly slug without navigation
        if (data && data.printer_id) {
          const slug = data.printer_id;
          
          if (slug && slug !== idOrSlug) {
            // Update URL for SEO without triggering navigation
            window.history.replaceState(null, '', `/printers/${slug}`);
          }
        } else if (data) {
          // Generate a slug and auto-heal if missing
          const brandName = typeof data.brand === 'object' && data.brand?.brand 
            ? data.brand.brand 
            : '';
          const generatedSlug = generatePrinterSlug(brandName, data.model_name);
          
          if (generatedSlug) {
            window.history.replaceState(null, '', `/printers/${generatedSlug}`);
            updatePrinterId(data.id, generatedSlug);
          }
        }
      } else {
        // Multi-stage fallback search for slug-based lookups
        data = await searchBySlug(normalizedSlug);
      }

      if (!data) {
        setError('Printer not found');
      }

      setPrinter(data);
    } catch (err: any) {
      console.error('Error fetching printer:', err);
      setError(err.message || 'Failed to load printer');
    } finally {
      setLoading(false);
    }
  }, [idOrSlug]);

  useEffect(() => {
    fetchPrinter();
  }, [fetchPrinter]);

  const refetch = useCallback(async () => {
    await fetchPrinter();
  }, [fetchPrinter]);

  return { printer, loading, error, refetch };
}

/**
 * Multi-stage fallback search for slug-based lookups
 */
async function searchBySlug(slug: string): Promise<Printer | null> {
  // Stage 1: Exact printer_id match
  const { data: exactMatch, error: exactError } = await supabase
    .from('printers')
    .select(`
      *,
      brand:printer_brands!brand_id(brand, warranty_years, warranty_coverage),
      series:printer_series!series_id(series_name)
    `)
    .eq('printer_id', slug)
    .limit(1);

  if (!exactError && exactMatch?.[0]) {
    console.log('[usePrinterBySlug] Found by exact printer_id');
    return exactMatch[0] as Printer;
  }

  // Stage 2: Fuzzy printer_id match (handles legacy underscores or partial matches)
  const { data: fuzzyMatch, error: fuzzyError } = await supabase
    .from('printers')
    .select(`
      *,
      brand:printer_brands!brand_id(brand, warranty_years, warranty_coverage),
      series:printer_series!series_id(series_name)
    `)
    .ilike('printer_id', `%${slug.replace(/-/g, '%')}%`)
    .limit(5);

  if (!fuzzyError && fuzzyMatch?.length) {
    const best = findBestMatch(fuzzyMatch as Printer[], slug);
    if (best) {
      console.log('[usePrinterBySlug] Found by fuzzy printer_id');
      return best;
    }
  }

  // Stage 3: Parse slug and search by components (brand + model)
  const slugParts = slug.split('-');
  if (slugParts.length < 2) {
    return null;
  }

  // Try to identify brand (usually first 1-3 parts)
  // Common brands: "bambu-lab", "prusa-research", "creality", "anycubic", etc.
  const knownBrandPrefixes = [
    'bambu-lab', 'prusa-research', 'prusa', 'creality', 'anycubic', 
    'elegoo', 'flashforge', 'sovol', 'qidi', 'snapmaker', 'ankermake',
    'geeetech', 'artillery', 'kingroon', 'longer', 'voxelab', 'tronxy',
    'flsun', 'mingda', 'two-trees', 'biqu', 'voron'
  ];

  let brandGuess = '';
  let modelGuess = '';

  for (const prefix of knownBrandPrefixes) {
    if (slug.startsWith(prefix + '-')) {
      brandGuess = prefix;
      modelGuess = slug.slice(prefix.length + 1);
      break;
    }
  }

  // Fallback: assume first part is brand
  if (!brandGuess && slugParts.length >= 2) {
    brandGuess = slugParts[0];
    modelGuess = slugParts.slice(1).join('-');
  }

  if (brandGuess && modelGuess) {
    const result = await searchByComponents(brandGuess, modelGuess, slug);
    if (result) {
      console.log('[usePrinterBySlug] Found by brand+model components');
      return result;
    }
  }

  return null;
}

/**
 * Search by component fields with similarity scoring
 */
async function searchByComponents(
  brand: string,
  model: string,
  targetSlug: string
): Promise<Printer | null> {
  const brandNormalized = brand.replace(/-/g, ' ');
  const modelNormalized = model.replace(/-/g, ' ');

  // Search for printers matching brand and model
  const { data: brandMatches, error: brandError } = await supabase
    .from('printers')
    .select(`
      *,
      brand:printer_brands!brand_id(brand, warranty_years, warranty_coverage),
      series:printer_series!series_id(series_name)
    `)
    .ilike('model_name', `%${modelNormalized}%`)
    .limit(20);

  if (brandError || !brandMatches?.length) {
    return null;
  }

  // Filter by brand name
  const filtered = (brandMatches as Printer[]).filter(p => {
    const printerBrand = typeof p.brand === 'object' && p.brand?.brand 
      ? p.brand.brand.toLowerCase() 
      : '';
    return printerBrand.includes(brandNormalized.toLowerCase()) ||
           brandNormalized.toLowerCase().includes(printerBrand);
  });

  if (!filtered.length) {
    // Try without brand filter if strict match fails
    return findBestMatch(brandMatches as Printer[], targetSlug);
  }

  return findBestMatch(filtered, targetSlug);
}

export default usePrinterBySlug;
