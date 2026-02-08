import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useRegionalFiltering } from "@/hooks/useRegionalFiltering";
import { QUERY_CONFIG } from "@/lib/queryConfig";

export interface FilterCountsResult {
  materials: Record<string, number>;
  brands: Record<string, number>;
  filters: Record<string, number>;
  total: number;
}

/**
 * Fetches filter facet counts from the server via get_filter_counts RPC.
 * This replaces the expensive client-side useMemo that iterated all 8000+ rows.
 * Cached aggressively (5 min staleTime) since counts don't change often.
 */
export function useFilterCounts(
  searchTerm: string = "",
  selectedMaterials: string[] = [],
  selectedBrands: string[] = [],
  priceRange: [number, number] = [0, 100],
  brandNameMap: Record<string, string> = {}
) {
  const { currentRegion } = useRegionalFiltering();

  const vendorNames =
    selectedBrands.length > 0
      ? selectedBrands.map((b) => brandNameMap[b] || b)
      : undefined;

  const materialsParam =
    selectedMaterials.length > 0 && !selectedMaterials.includes("All")
      ? selectedMaterials
      : undefined;

  return useQuery<FilterCountsResult>({
    queryKey: [
      "filter-counts",
      currentRegion,
      searchTerm,
      materialsParam,
      vendorNames,
      priceRange,
    ],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("get_filter_counts", {
        p_search: searchTerm || undefined,
        p_region: currentRegion,
        p_materials: materialsParam as string[] | undefined,
        p_brands: vendorNames as string[] | undefined,
        p_price_min: priceRange[0] > 0 ? priceRange[0] : undefined,
        p_price_max: priceRange[1] < 100 ? priceRange[1] : undefined,
      });

      if (error) throw error;

      const json = data as any;
      return {
        materials: json?.materials || {},
        brands: json?.brands || {},
        filters: json?.filters || {},
        total: json?.filters?.total || 0,
      };
    },
    staleTime: QUERY_CONFIG.brands.staleTime, // 15 minutes
    gcTime: QUERY_CONFIG.brands.gcTime,
  });
}
