import { useState, useEffect, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { getTypoSuggestion, getSimilarSuggestions } from "@/lib/fuzzySearch";
import { SEARCH_INTENT_MAP } from "@/lib/personalizationEngine";
import { analyzeSearchQuery } from "@/lib/multiTermSearch";
import { COLOR_FAMILIES } from "@/lib/colorMatchUtils";

export interface SearchSuggestion {
  type: "brand" | "material" | "product" | "typo" | "color";
  value: string;
  displayText: string;
  subtitle?: string;
  count?: number;
  variantCount?: number;
  id?: string;
  productHandle?: string;
  colorHex?: string;
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
        const { data, error } = await supabase
          .from("filaments")
          .select("vendor")
          .ilike("vendor", `%${debouncedQuery}%`)
          .limit(50);

        if (error) throw error;

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
    staleTime: 30000,
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

  // Fetch product title suggestions (fetch more so we can group variants)
  const { data: productSuggestions = [] } = useQuery({
    queryKey: ["search-suggestions-products", debouncedQuery, context],
    queryFn: async () => {
      if (!debouncedQuery || debouncedQuery.length < 3) return [];

      if (context === "filaments" || context === "all") {
        const { data, error } = await supabase
          .from("filaments")
          .select("id, product_title, vendor, product_handle, material")
          .ilike("product_title", `%${debouncedQuery}%`)
          .limit(30);

        if (error) throw error;

        const stripColorSuffix = (title: string) =>
          title
            .replace(/\s*[-–/|]\s*[^-–/|]+$/, "")
            .trim();

        type GroupEntry = {
          id: string;
          product_title: string;
          vendor: string | null;
          product_handle: string | null;
          material: string | null;
        };
        const groups: Record<string, GroupEntry[]> = {};

        (data || []).forEach((item) => {
          const base = stripColorSuffix(item.product_title || "");
          const key = `${item.vendor || ""}||${base}`;
          if (!groups[key]) groups[key] = [];
          groups[key].push(item as GroupEntry);
        });

        return Object.values(groups).map((variants) => {
          const rep = variants[0];
          const base = stripColorSuffix(rep.product_title || "");
          const variantCount = variants.length;
          return {
            type: "product" as const,
            value: base,
            displayText: base,
            subtitle: rep.vendor || undefined,
            id: rep.id,
            productHandle: rep.product_handle || undefined,
            variantCount: variantCount > 1 ? variantCount : undefined,
          };
        });
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

  // Multi-term decomposition query (e.g. "bambu lab petg")
  const { data: multiTermSuggestions = [] } = useQuery({
    queryKey: ["search-suggestions-multiterm", debouncedQuery],
    queryFn: async (): Promise<SearchSuggestion[]> => {
      const analysis = analyzeSearchQuery(debouncedQuery);
      if (analysis.detectedBrands.length === 0) return [];
      const brand = analysis.detectedBrands[0];
      const remaining = analysis.terms
        .filter((t) => !brand.toLowerCase().includes(t))
        .join(" ");
      if (!remaining) return [];

      const { data, error } = await supabase
        .from("filaments")
        .select("id, product_title, vendor, material, product_handle")
        .ilike("vendor", `%${brand}%`)
        .ilike("material", `%${remaining}%`)
        .limit(5);

      if (error) throw error;

      return (data || []).map((item) => ({
        type: "product" as const,
        value: item.product_title || "",
        displayText: item.product_title || "",
        subtitle: `${item.vendor || ""} · ${item.material || ""}`,
        id: item.id,
        productHandle: item.product_handle || undefined,
      }));
    },
    enabled:
      debouncedQuery.split(/\s+/).length >= 2 &&
      debouncedQuery.length >= 4 &&
      context !== "printers",
    staleTime: 30000,
  });

  // Check for typo corrections
  const typoSuggestion = useMemo(() => {
    if (!debouncedQuery || debouncedQuery.length < 3) return null;
    return getTypoSuggestion(debouncedQuery);
  }, [debouncedQuery]);

  // Intent-based suggestions from SEARCH_INTENT_MAP
  const intentSuggestions = useMemo((): SearchSuggestion[] => {
    if (!debouncedQuery || debouncedQuery.length < 2) return [];
    const words = debouncedQuery.toLowerCase().split(/\s+/);
    const matched: SearchSuggestion[] = [];

    for (const intent of Object.values(SEARCH_INTENT_MAP)) {
      if (matched.length >= 2) break;
      const hasMatch = intent.keywords.some((kw) => words.some((w) => w === kw || kw.includes(w)));
      if (hasMatch && intent.boostMaterials.length > 0) {
        matched.push({
          type: "material",
          value: intent.boostMaterials[0],
          displayText: `Best for ${intent.context.replace(/_/g, " ")}`,
          subtitle: `Try ${intent.boostMaterials.join(", ")}`,
        });
      }
    }
    return matched;
  }, [debouncedQuery]);

  // Color family suggestions (client-side matching against COLOR_FAMILIES)
  const colorSuggestions = useMemo((): SearchSuggestion[] => {
    if (!debouncedQuery || debouncedQuery.length < 2) return [];
    const q = debouncedQuery.toLowerCase();
    const matches: SearchSuggestion[] = [];
    for (const family of COLOR_FAMILIES) {
      if (family.hex.includes("gradient")) continue;
      const allNames = [family.name, ...family.families];
      if (allNames.some((n) => n.toLowerCase().includes(q))) {
        matches.push({
          type: "color",
          value: family.name,
          displayText: `${family.name} filaments`,
          subtitle: `Browse all ${family.name.toLowerCase()} colors`,
          colorHex: family.hex,
        });
      }
      if (matches.length >= 2) break;
    }
    return matches;
  }, [debouncedQuery]);

  // Get similar suggestions if no results
  const similarSuggestions = useMemo(() => {
    if (!debouncedQuery || debouncedQuery.length < 3) return [];
    
    const totalResults = brandSuggestions.length + materialSuggestions.length + productSuggestions.length;
    if (totalResults > 2) return [];
    
    return getSimilarSuggestions(debouncedQuery, 3);
  }, [debouncedQuery, brandSuggestions, materialSuggestions, productSuggestions]);

  // Combine all suggestions with diversity
  const suggestions: SearchSuggestion[] = useMemo(() => {
    const all: SearchSuggestion[] = [];

    // 1. Typo correction first
    if (typoSuggestion) {
      all.push({
        type: "typo",
        value: typoSuggestion,
        displayText: typoSuggestion,
        subtitle: `Did you mean "${typoSuggestion}"?`,
      });
    }

    // 2. Intent suggestions if few direct matches
    const directMatchCount = brandSuggestions.length + materialSuggestions.length + productSuggestions.length;
    if (directMatchCount < 2 && intentSuggestions.length > 0) {
      all.push(...intentSuggestions);
    }

    // 3. Top brand matches (max 2)
    all.push(...brandSuggestions.slice(0, 2));

    // 4. Top material match (max 1)
    all.push(...materialSuggestions.slice(0, 1));

    // 5. Color suggestions (max 2) — only if query matches a color term
    if (colorSuggestions.length > 0) {
      all.push(...colorSuggestions.slice(0, 2));
    }

    // 6. Multi-term product matches first in product section
    if (multiTermSuggestions.length > 0) {
      all.push(...multiTermSuggestions.slice(0, 3));
    }

    // 7. Generic product matches (fill remaining slots)
    const remainingProductSlots = Math.max(0, 4 - multiTermSuggestions.length);
    all.push(...productSuggestions.slice(0, remainingProductSlots));

    // 8. Similar suggestions fallback
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
  }, [brandSuggestions, materialSuggestions, productSuggestions, multiTermSuggestions, colorSuggestions, typoSuggestion, intentSuggestions, similarSuggestions, maxSuggestions]);

  const isLoading = debouncedQuery !== query;
  const hasQuery = query.length >= 2;
  const totalProductGroups = productSuggestions.length;

  return {
    suggestions,
    isLoading,
    hasQuery,
    typoCorrection: typoSuggestion,
    totalProductGroups,
  };
}
