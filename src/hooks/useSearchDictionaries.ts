import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface SearchDictionaries {
  brands: string[];
  materials: string[];
  colors: string[];
}

export function useSearchDictionaries() {
  return useQuery({
    queryKey: ["search-dictionaries"],
    queryFn: async (): Promise<SearchDictionaries> => {
      const { data, error } = await supabase
        .from("search_dictionaries")
        .select("dict_type, term");
      if (error) throw error;

      const brands: string[] = [];
      const materials: string[] = [];
      const colors: string[] = [];

      for (const row of data || []) {
        if (row.dict_type === "brand") brands.push(row.term);
        else if (row.dict_type === "material") materials.push(row.term);
        else if (row.dict_type === "color") colors.push(row.term);
      }

      return { brands, materials, colors };
    },
    staleTime: 60 * 60 * 1000,
    gcTime: 24 * 60 * 60 * 1000,
  });
}
