import { useState, useEffect, useMemo } from "react";
import { useQuery, keepPreviousData } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toBrandSlug } from "@/utils/brandSlug";

export interface MaterialSuggestion {
  material: string;
  count: number;
}

export interface BrandSuggestion {
  name: string;
  slug: string;
  logoUrl: string | null;
}

export interface FilamentSuggestion {
  id: string;
  name: string;
  vendor: string | null;
  price: number | null;
  colorHex: string | null;
  slug: string;
}

export interface AutocompleteResult {
  materials: MaterialSuggestion[];
  brands: BrandSuggestion[];
  filaments: FilamentSuggestion[];
  isLoading: boolean;
  hasResults: boolean;
}

/**
 * Client-side autocomplete hook — queries filaments table directly
 * for instant material, brand, and product suggestions.
 */
export function useSearchAutocomplete(
  query: string,
  enabled: boolean = true
): AutocompleteResult {
  const [debouncedQuery, setDebouncedQuery] = useState(query);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedQuery(query), 250);
    return () => clearTimeout(timer);
  }, [query]);

  const isActive = debouncedQuery.trim().length >= 2 && enabled;
  const q = debouncedQuery.trim();

  // Materials query — distinct materials matching the query
  const { data: rawMaterials, isLoading: matLoading } = useQuery({
    queryKey: ["autocomplete-materials", q],
    enabled: isActive,
    placeholderData: keepPreviousData,
    staleTime: 60_000,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("filaments")
        .select("material")
        .ilike("material", `%${q}%`)
        .not("material", "is", null)
        .limit(200);
      if (error) throw error;
      // Aggregate counts
      const counts: Record<string, number> = {};
      data?.forEach((r) => {
        if (r.material) counts[r.material] = (counts[r.material] || 0) + 1;
      });
      return Object.entries(counts)
        .map(([material, count]) => ({ material, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 3);
    },
  });

  // Brands query — distinct vendors matching the query
  const { data: rawBrands, isLoading: brandLoading } = useQuery({
    queryKey: ["autocomplete-brands", q],
    enabled: isActive,
    placeholderData: keepPreviousData,
    staleTime: 60_000,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("automated_brands")
        .select("brand_name, brand_slug, logo_url")
        .ilike("brand_name", `%${q}%`)
        .eq("is_visible", true)
        .limit(3);
      if (error) throw error;
      return (data || []).map((b) => ({
        name: b.brand_name,
        slug: b.brand_slug || toBrandSlug(b.brand_name),
        logoUrl: b.logo_url,
      }));
    },
  });

  // Filaments query — products matching the query
  const { data: rawFilaments, isLoading: filLoading } = useQuery({
    queryKey: ["autocomplete-filaments", q],
    enabled: isActive && q.length >= 2,
    placeholderData: keepPreviousData,
    staleTime: 30_000,
    queryFn: async () => {
      // Primary: full-text search across search_vector (vendor, material, product_title, etc.)
      const { data: ftsData, error: ftsError } = await supabase
        .from("filaments")
        .select("id, product_title, vendor, variant_price, color_hex, product_handle")
        .textSearch("search_vector", q, { type: "websearch" })
        .limit(5);
      if (ftsError) throw ftsError;
      if (ftsData && ftsData.length > 0) return (ftsData).map((f) => ({
        id: f.id,
        name: f.product_title || "",
        vendor: f.vendor,
        price: f.variant_price,
        colorHex: f.color_hex,
        slug: f.product_handle || f.id,
      }));

      // Fallback: broad ILIKE across multiple columns
      const { data, error } = await supabase
        .from("filaments")
        .select("id, product_title, vendor, variant_price, color_hex, product_handle")
        .or(`product_title.ilike.%${q}%,vendor.ilike.%${q}%,material.ilike.%${q}%,display_name.ilike.%${q}%`)
        .limit(5);
      if (error) throw error;
      return (data || []).map((f) => ({
        id: f.id,
        name: f.product_title || "",
        vendor: f.vendor,
        price: f.variant_price,
        colorHex: f.color_hex,
        slug: f.product_handle || f.id,
      }));
    },
  });

  const materials = rawMaterials ?? [];
  const brands = rawBrands ?? [];
  const filaments = rawFilaments ?? [];

  const isDebouncing = debouncedQuery !== query && query.trim().length >= 2;
  const isLoading = isDebouncing || (isActive && (matLoading || brandLoading || filLoading));
  const hasResults = materials.length > 0 || brands.length > 0 || filaments.length > 0;

  return { materials, brands, filaments, isLoading, hasResults };
}
