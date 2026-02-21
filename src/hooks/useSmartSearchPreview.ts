import { useState, useEffect, useMemo } from "react";
import { useQuery, keepPreviousData } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useRegionalFiltering } from "@/hooks/useRegionalFiltering";
import type { SearchSuggestion } from "@/hooks/useSearchSuggestions";

interface SmartSearchPreviewResult {
  suggestions: SearchSuggestion[];
  isLoading: boolean;
  expandedQuery: string | null;
  materialHint: string | null;
  totalCount: number;
}

/**
 * Lightweight smart-search hook for the search dropdown.
 * Calls the smart-search edge function with a small limit for preview suggestions.
 */
export function useSmartSearchPreview(
  query: string,
  enabled: boolean = true
): SmartSearchPreviewResult {
  const { currentRegion } = useRegionalFiltering();
  const [debouncedQuery, setDebouncedQuery] = useState(query);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedQuery(query), 300);
    return () => clearTimeout(timer);
  }, [query]);

  const isActive = debouncedQuery.trim().length >= 2 && enabled;

  const { data, isLoading, isFetching } = useQuery({
    queryKey: ["smart-search-preview", debouncedQuery, currentRegion],
    enabled: isActive,
    placeholderData: keepPreviousData,
    queryFn: async () => {
      const { data: result, error } = await supabase.functions.invoke("smart-search", {
        body: {
          query: debouncedQuery,
          region: currentRegion,
          limit: 6,
          offset: 0,
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

  // Convert smart-search results into SearchSuggestion format
  const suggestions = useMemo<SearchSuggestion[]>(() => {
    if (!data?.results) return [];
    return data.results.map((item: any) => {
      const title = item.product_title || "";
      // Strip color suffix for cleaner display
      const baseName = title.replace(/\s*[-–/|]\s*[^-–/|]+$/, "").trim();
      return {
        type: "product" as const,
        value: baseName,
        displayText: baseName,
        subtitle: [item.vendor, item.material].filter(Boolean).join(" · "),
        id: item.id,
        productHandle: item.product_handle || undefined,
        variantCount: item.variant_count > 1 ? item.variant_count : undefined,
      };
    });
  }, [data?.results]);

  // Show loading when debounce hasn't settled OR when query is fetching
  const showLoading = (debouncedQuery !== query && query.trim().length >= 2) || (isLoading && isActive);

  return {
    suggestions,
    isLoading: showLoading,
    expandedQuery: data?.expandedQuery ?? null,
    materialHint: data?.materialHint ?? null,
    totalCount: data?.totalCount ?? 0,
  };
}
