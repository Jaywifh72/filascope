import { useQuery, keepPreviousData } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useRegionalFiltering } from "@/hooks/useRegionalFiltering";
import { QUERY_CONFIG } from "@/lib/queryConfig";
import { formatProductLineIdForDisplay } from "@/lib/productNameUtils";
import type { GroupedFilament } from "@/lib/productNameUtils";

export interface FinderFilters {
  searchTerm: string;
  selectedMaterials: string[];
  selectedBrands: string[];
  priceRange: [number, number];
  sortBy: string;
  // Surface finishes
  matte: boolean;
  silk: boolean;
  metallic: boolean;
  sparkle: boolean;
  translucent: boolean;
  glow: boolean;
  // Reinforced
  carbonFiber: boolean;
  glassFiber: boolean;
  woodFilled: boolean;
  // Performance
  highSpeed: boolean;
  largeSpools: boolean;
  amsOnly: boolean;
  brassOnly: boolean;
  // Color
  selectedColorFamilies: string[];
  // HueForge
  hasTdData: boolean;
}

export interface FinderQueryResult {
  groups: GroupedFilament[];
  totalCount: number;
  isLoading: boolean;
  isFetching: boolean;
  isPlaceholderData: boolean;
}

const PAGE_SIZE = 48;

/**
 * Converts the RPC JSON response into GroupedFilament[] for the UI.
 * The RPC already groups by product_line_id and returns representative filaments.
 */
function mapRpcResultToGroups(items: any[]): GroupedFilament[] {
  return items.map((item) => {
    const baseName = item.product_line_id
      ? formatProductLineIdForDisplay(item.product_line_id, item.product_title)
      : item.product_title || "";

    const colors = new Set<string>(
      (item.group_colors || []).filter((c: string | null) => c != null)
    );
    const weights = new Set<number>(
      (item.group_weights || []).filter((w: number | null) => w != null)
    );

    return {
      baseName,
      vendor: item.vendor || null,
      material: item.material || null,
      representativeFilament: item,
      variants: [item], // only representative; variants are pre-counted
      colors,
      weights,
      priceRange: {
        min: item.group_price_min ?? item.variant_price ?? null,
        max: item.group_price_max ?? item.variant_price ?? null,
      },
      anyInStock: item.group_any_in_stock ?? true,
      colorStockStatus: new Map<string, boolean>(),
    };
  });
}

/**
 * Server-side paginated finder query using search_filaments_paginated RPC.
 * Replaces the old approach of fetching all 8000+ filaments client-side.
 */
export function useFinderQuery(
  filters: FinderFilters,
  page: number = 0,
  brandNameMap: Record<string, string> = {}
): FinderQueryResult {
  const { currentRegion } = useRegionalFiltering();

  // Resolve brand display names to vendor names
  const vendorNames =
    filters.selectedBrands.length > 0
      ? filters.selectedBrands.map((b) => brandNameMap[b] || b)
      : undefined;

  // Resolve materials: skip "All", pass raw material names
  const materialsParam =
    filters.selectedMaterials.length > 0 &&
    !filters.selectedMaterials.includes("All")
      ? filters.selectedMaterials
      : undefined;

  const { data, isLoading, isFetching, isPlaceholderData } = useQuery({
    queryKey: [
      "finder-paginated",
      currentRegion,
      filters.searchTerm,
      materialsParam,
      vendorNames,
      filters.priceRange,
      filters.sortBy,
      filters.matte,
      filters.silk,
      filters.metallic,
      filters.sparkle,
      filters.translucent,
      filters.glow,
      filters.carbonFiber,
      filters.glassFiber,
      filters.woodFilled,
      filters.highSpeed,
      filters.largeSpools,
      filters.amsOnly,
      filters.brassOnly,
      filters.selectedColorFamilies,
      filters.hasTdData,
      page,
    ],
    placeholderData: keepPreviousData,
    queryFn: async () => {
      const { data: result, error } = await supabase.rpc(
        "search_filaments_paginated",
        {
          p_search: filters.searchTerm || undefined,
          p_materials: materialsParam as string[] | undefined,
          p_brands: vendorNames as string[] | undefined,
          p_sort: filters.sortBy,
          p_page_size: PAGE_SIZE,
          p_offset: page * PAGE_SIZE,
          p_region: currentRegion,
          p_high_speed: filters.highSpeed,
          p_brass_only: filters.brassOnly,
          p_ams_only: filters.amsOnly,
          p_matte: filters.matte,
          p_silk: filters.silk,
          p_metallic: filters.metallic,
          p_sparkle: filters.sparkle,
          p_translucent_filter: filters.translucent,
          p_glow: filters.glow,
          p_carbon_fiber: filters.carbonFiber,
          p_glass_fiber: filters.glassFiber,
          p_wood_filled: filters.woodFilled,
          p_large_spools: filters.largeSpools,
          p_has_td: filters.hasTdData,
          p_price_min:
            filters.priceRange[0] > 0 ? filters.priceRange[0] : undefined,
          p_price_max:
            filters.priceRange[1] < 100 ? filters.priceRange[1] : undefined,
          p_color_families:
            filters.selectedColorFamilies.length > 0
              ? (filters.selectedColorFamilies as string[])
              : undefined,
        }
      );

      if (error) throw error;

      const json = result as any;
      return {
        items: json?.items || [],
        total: json?.total || 0,
      };
    },
    staleTime: QUERY_CONFIG.products.staleTime,
    gcTime: QUERY_CONFIG.products.gcTime,
  });

  const groups = data ? mapRpcResultToGroups(data.items) : [];
  const totalCount = data?.total || 0;

  return {
    groups,
    totalCount,
    isLoading,
    isFetching,
    isPlaceholderData,
  };
}
