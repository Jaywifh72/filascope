import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { getBaseProductName, getColorFromTitle } from '@/hooks/useFilamentColorVariants';

interface VariantInfo {
  colors: string[];
  count: number;
}

/**
 * Fetches all color variants for a filament from the database
 * This ensures cards show the same color dots as the detail page
 * 
 * IMPORTANT: This hook must use the SAME logic as useFilamentColorVariants
 * to ensure cards and detail pages show identical color options.
 * 
 * Priority:
 * 1. If filament has product_line_id, match by product_line_id (same as detail page)
 * 2. Otherwise, fallback to base name matching
 */
export function useFilamentVariantCounts(
  filamentId: string,
  productTitle: string,
  vendor: string | null,
  productLineId?: string | null
): VariantInfo {
  const [variantInfo, setVariantInfo] = useState<VariantInfo>({ colors: [], count: 1 });

  useEffect(() => {
    if (!vendor || !productTitle) {
      setVariantInfo({ colors: [], count: 1 });
      return;
    }

    const fetchVariants = async () => {
      try {
        const baseName = getBaseProductName(productTitle);
        
        // Fetch all filaments from this vendor with product_line_id
        const { data, error } = await supabase
          .from('filaments')
          .select('id, product_title, color_hex, product_line_id')
          .eq('vendor', vendor)
          .order('product_title');

        if (error) throw error;

        // Find the current filament to get its product_line_id
        const currentFilament = data?.find(f => f.id === filamentId);
        const effectiveProductLineId = productLineId || currentFilament?.product_line_id;

        let matchingVariants;

        if (effectiveProductLineId) {
          // Priority 1: Match by product_line_id (same as detail page)
          matchingVariants = (data || []).filter(f => 
            f.product_line_id === effectiveProductLineId
          );
        } else {
          // Priority 2: Fallback to base name matching
          matchingVariants = (data || []).filter(f => {
            const fBaseName = getBaseProductName(f.product_title);
            if (fBaseName.toLowerCase() !== baseName.toLowerCase()) return false;
            if (f.id === filamentId) return true;
            const color = getColorFromTitle(f.product_title, baseName);
            return color !== null || (f.color_hex && f.color_hex.length > 0);
          });
        }

        // Extract unique colors (by hex value, uppercased for deduplication)
        const uniqueColors = new Set<string>();
        matchingVariants.forEach(v => {
          if (v.color_hex) {
            const hex = v.color_hex.startsWith('#') ? v.color_hex : `#${v.color_hex}`;
            uniqueColors.add(hex.toUpperCase());
          }
        });

        setVariantInfo({
          colors: Array.from(uniqueColors),
          count: matchingVariants.length,
        });
      } catch (error) {
        console.error('Error fetching variant counts:', error);
        setVariantInfo({ colors: [], count: 1 });
      }
    };

    fetchVariants();
  }, [filamentId, productTitle, vendor, productLineId]);

  return variantInfo;
}
