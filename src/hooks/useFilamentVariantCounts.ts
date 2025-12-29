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
 */
export function useFilamentVariantCounts(
  filamentId: string,
  productTitle: string,
  vendor: string | null
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
        
        // Fetch all filaments from this vendor (same as detail page hook)
        const { data, error } = await supabase
          .from('filaments')
          .select('id, product_title, color_hex')
          .eq('vendor', vendor)
          .order('product_title');

        if (error) throw error;

        // Filter using the SAME logic as useFilamentColorVariants (lines 347-358)
        const matchingVariants = (data || []).filter(f => {
          const fBaseName = getBaseProductName(f.product_title);
          // Match base name (case-insensitive for robustness)
          if (fBaseName.toLowerCase() !== baseName.toLowerCase()) return false;
          // If it's the current filament, include it
          if (f.id === filamentId) return true;
          // Otherwise, must have a detectable color name OR a color_hex
          const color = getColorFromTitle(f.product_title, baseName);
          return color !== null || (f.color_hex && f.color_hex.length > 0);
        });

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
  }, [filamentId, productTitle, vendor]);

  return variantInfo;
}
