import { useState, useEffect, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { getTypoSuggestion, getSimilarSuggestions } from "@/lib/fuzzySearch";

export interface SearchSuggestion {
  type: "brand" | "material" | "product" | "typo";
  value: string;
  displayText: string;
  subtitle?: string;
  count?: number;
}

interface UseSearchSuggestionsOptions {
  context?: "filaments" | "printers" | "all";
  debounceMs?: number;
  maxSuggestions?: number;
}

export function useSearchSuggestions(
  query: string,
  options: UseSearchSuggestionsOptions = {}
) {
  const {
    context = "filaments",
    debounceMs = 300,
    maxSuggestions = 8,
  } = options;

  const [debouncedQuery, setDebouncedQuery] = useState(query);

  // Debounce the query
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(query);
    }, debounceMs);

    return () => clearTimeout(timer);
  }, [query, debounceMs]);

  // Fetch brand suggestions
  const { data: brandSuggestions = [] } = useQuery({
    queryKey: ["search-suggestions-brands", debouncedQuery, context],
    queryFn: async () => {
      if (!debouncedQuery || debouncedQuery.length < 2) return [];

      if (context === "filaments" || context === "all") {
        // Get distinct vendors matching the query
        const { data, error } = await supabase
          .from("filaments")
          .select("vendor")
          .ilike("vendor", `%${debouncedQuery}%`)
          .limit(50);

        if (error) throw error;

        // Count and dedupe
        const vendorCounts: Record<string, number> = {};
        data?.forEach((item) => {
          if (item.vendor) {
            vendorCounts[item.vendor] = (vendorCounts[item.vendor] || 0) + 1;
          }
        });

        return Object.entries(vendorCounts)
          .map(([vendor, count]) => ({
            type: "brand" as const,
            value: vendor,
            displayText: vendor,
            subtitle: `${count}+ products`,
            count,
          }))
          .sort((a, b) => b.count - a.count)
          .slice(0, 5);
      }

      if (context === "printers") {
        const { data, error } = await supabase
          .from("printer_brands")
          .select("brand")
          .ilike("brand", `%${debouncedQuery}%`)
          .limit(5);

        if (error) throw error;

        return (data || []).map((item) => ({
          type: "brand" as const,
          value: item.brand,
          displayText: item.brand,
        }));
      }

      return [];
    },
    enabled: debouncedQuery.length >= 2,
    staleTime: 30000, // Cache for 30 seconds
  });

  // Fetch material suggestions (filaments only)
  const { data: materialSuggestions = [] } = useQuery({
    queryKey: ["search-suggestions-materials", debouncedQuery],
    queryFn: async () => {
      if (!debouncedQuery || debouncedQuery.length < 2 || context === "printers") return [];

      const { data, error } = await supabase
        .from("filaments")
        .select("material")
        .ilike("material", `%${debouncedQuery}%`)
        .limit(50);

      if (error) throw error;

      // Count and dedupe
      const materialCounts: Record<string, number> = {};
      data?.forEach((item) => {
        if (item.material) {
          materialCounts[item.material] = (materialCounts[item.material] || 0) + 1;
        }
      });

      return Object.entries(materialCounts)
        .map(([material, count]) => ({
          type: "material" as const,
          value: material,
          displayText: material,
          subtitle: `${count}+ products`,
          count,
        }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 3);
    },
    enabled: debouncedQuery.length >= 2 && context !== "printers",
    staleTime: 30000,
  });

  // Fetch product title suggestions
  const { data: productSuggestions = [] } = useQuery({
    queryKey: ["search-suggestions-products", debouncedQuery, context],
    queryFn: async () => {
      if (!debouncedQuery || debouncedQuery.length < 3) return [];

      if (context === "filaments" || context === "all") {
        const { data, error } = await supabase
          .from("filaments")
          .select("product_title, vendor")
          .ilike("product_title", `%${debouncedQuery}%`)
          .limit(5);

        if (error) throw error;

        return (data || []).map((item) => ({
          type: "product" as const,
          value: item.product_title,
          displayText: item.product_title,
          subtitle: item.vendor || undefined,
        }));
      }

      if (context === "printers") {
        const { data, error } = await supabase
          .from("printers")
          .select("model_name, brand:printer_brands!brand_id(brand)")
          .ilike("model_name", `%${debouncedQuery}%`)
          .limit(5);

        if (error) throw error;

        return (data || []).map((item) => ({
          type: "product" as const,
          value: item.model_name,
          displayText: item.model_name,
          subtitle: (item.brand as any)?.brand || undefined,
        }));
      }

      return [];
    },
    enabled: debouncedQuery.length >= 3,
    staleTime: 30000,
  });

  // Check for typo corrections
  const typoSuggestion = useMemo(() => {
    if (!debouncedQuery || debouncedQuery.length < 3) return null;
    return getTypoSuggestion(debouncedQuery);
  }, [debouncedQuery]);

  // Get similar suggestions if no results
  const similarSuggestions = useMemo(() => {
    if (!debouncedQuery || debouncedQuery.length < 3) return [];
    
    // Only show if we have few results
    const totalResults = brandSuggestions.length + materialSuggestions.length + productSuggestions.length;
    if (totalResults > 2) return [];
    
    return getSimilarSuggestions(debouncedQuery, 3);
  }, [debouncedQuery, brandSuggestions, materialSuggestions, productSuggestions]);

  // Combine all suggestions
  const suggestions: SearchSuggestion[] = useMemo(() => {
    const all: SearchSuggestion[] = [];

    // Add typo correction first if available
    if (typoSuggestion) {
      all.push({
        type: "typo",
        value: typoSuggestion,
        displayText: typoSuggestion,
        subtitle: `Did you mean "${typoSuggestion}"?`,
      });
    }

    // Add brands
    all.push(...brandSuggestions);

    // Add materials
    all.push(...materialSuggestions);

    // Add products (limit to avoid overwhelming)
    all.push(...productSuggestions.slice(0, 3));

    // Add similar suggestions if we have few results
    if (all.length < 3 && similarSuggestions.length > 0) {
      similarSuggestions.forEach((term) => {
        if (!all.some((s) => s.value.toLowerCase() === term.toLowerCase())) {
          all.push({
            type: "typo",
            value: term,
            displayText: term,
            subtitle: "Similar search",
          });
        }
      });
    }

    return all.slice(0, maxSuggestions);
  }, [brandSuggestions, materialSuggestions, productSuggestions, typoSuggestion, similarSuggestions, maxSuggestions]);

  const isLoading = debouncedQuery !== query;
  const hasQuery = query.length >= 2;

  return {
    suggestions,
    isLoading,
    hasQuery,
    typoCorrection: typoSuggestion,
  };
}
