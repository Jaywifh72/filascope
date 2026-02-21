import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { useQuery, keepPreviousData } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useRegionalFiltering } from "@/hooks/useRegionalFiltering";
import { formatProductLineIdForDisplay } from "@/lib/productNameUtils";
import { parseSearchIntent, type SearchIntent } from "@/lib/searchIntentParser";
import type { GroupedFilament } from "@/lib/productNameUtils";

export interface SmartSearchChip {
  id: string;
  label: string;
  type: "expansion" | "material" | "tag";
  removable: boolean;
}

export interface SmartSearchResult {
  groups: GroupedFilament[];
  totalCount: number;
  isLoading: boolean;
  isFetching: boolean;
  expandedQuery: string | null;
  materialHint: string | null;
  tagHint: string | null;
  expansions: string[];
  chips: SmartSearchChip[];
  removeChip: (chipId: string) => void;
  isSmartSearchActive: boolean;
  searchIntent: SearchIntent;
}

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
      variants: [item],
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

export function useSmartSearch(
  searchTerm: string,
  page: number = 0,
  pageSize: number = 48
): SmartSearchResult {
  const { currentRegion } = useRegionalFiltering();
  const [removedChips, setRemovedChips] = useState<Set<string>>(new Set());
  const debouncedTermRef = useRef(searchTerm);
  const [debouncedTerm, setDebouncedTerm] = useState(searchTerm);

  // Debounce the search term (300ms)
  useEffect(() => {
    debouncedTermRef.current = searchTerm;
    const timer = setTimeout(() => {
      setDebouncedTerm(searchTerm);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Reset removed chips when search term changes
  useEffect(() => {
    setRemovedChips(new Set());
  }, [debouncedTerm]);

  // Parse intent from debounced term (client-side, instant)
  const searchIntent = useMemo(
    () => parseSearchIntent(debouncedTerm),
    [debouncedTerm]
  );

  const isSmartSearchActive = debouncedTerm.trim().length >= 2;

  const { data, isLoading, isFetching } = useQuery({
    queryKey: ["smart-search", debouncedTerm, currentRegion, page, pageSize],
    enabled: isSmartSearchActive,
    placeholderData: keepPreviousData,
    queryFn: async () => {
      const { data: result, error } = await supabase.functions.invoke("smart-search", {
        body: {
          query: debouncedTerm,
          region: currentRegion,
          limit: pageSize,
          offset: page * pageSize,
          materialFilter: searchIntent.materialFilter,
          propertySortCol: searchIntent.propertyHints[0]?.sortCol ?? null,
          propertySortDir: searchIntent.propertyHints[0]?.dir ?? null,
        },
      });

      if (error) throw error;
      return result as {
        results: any[];
        expandedQuery: string | null;
        materialHint: string | null;
        tagHint: string | null;
        totalCount: number;
        expansions: string[];
      };
    },
    staleTime: 30_000,
    gcTime: 5 * 60_000,
  });

  const groups = useMemo(
    () => (data?.results ? mapRpcResultToGroups(data.results) : []),
    [data?.results]
  );

  // Build chips from expansions
  const chips = useMemo<SmartSearchChip[]>(() => {
    if (!data) return [];
    const result: SmartSearchChip[] = [];

    if (data.materialHint && !removedChips.has(`material-${data.materialHint}`)) {
      result.push({
        id: `material-${data.materialHint}`,
        label: `Expanded: ${data.materialHint}`,
        type: "material",
        removable: true,
      });
    }

    if (data.tagHint && !removedChips.has(`tag-${data.tagHint}`)) {
      result.push({
        id: `tag-${data.tagHint}`,
        label: `Tag: ${data.tagHint.replace(/_/g, " ")}`,
        type: "tag",
        removable: true,
      });
    }

    return result;
  }, [data, removedChips]);

  const removeChip = useCallback((chipId: string) => {
    setRemovedChips((prev) => new Set([...prev, chipId]));
  }, []);

  return {
    groups,
    totalCount: data?.totalCount ?? 0,
    isLoading: isLoading && isSmartSearchActive,
    isFetching,
    expandedQuery: data?.expandedQuery ?? null,
    materialHint: data?.materialHint ?? null,
    tagHint: data?.tagHint ?? null,
    expansions: data?.expansions ?? [],
    chips,
    removeChip,
    isSmartSearchActive,
    searchIntent,
  };
}
