import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { getBaseProductName as getBaseProductNameFromUtils } from '@/lib/productNameUtils';

interface VariantInfo {
  colors: string[];
  count: number;
}

/**
 * Fetches all color variants for a filament from the database
 * This ensures cards show the same color dots as the detail page
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
        const baseName = getBaseProductNameFromUtils(productTitle);
        
        // Fetch all filaments from this vendor
        const { data, error } = await supabase
          .from('filaments')
          .select('id, product_title, color_hex')
          .eq('vendor', vendor)
          .not('color_hex', 'is', null);

        if (error) throw error;

        // Filter to only those matching the base product name
        const matchingVariants = (data || []).filter(f => {
          const fBaseName = getBaseProductNameFromUtils(f.product_title);
          return fBaseName === baseName;
        });

        // Extract unique colors
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
