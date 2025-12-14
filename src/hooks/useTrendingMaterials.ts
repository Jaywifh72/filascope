import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface TrendingMaterial {
  id: string;
  title: string;
  description: string | null;
  material_filter: string | null;
  search_increase_percent: number | null;
  context: string | null;
  article_url: string | null;
  position: number;
  week_of: string | null;
  updated_at: string | null;
}

export function useTrendingMaterials() {
  return useQuery({
    queryKey: ["trending-materials"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("trending_materials")
        .select("*")
        .eq("is_active", true)
        .order("position", { ascending: true })
        .limit(3);

      if (error) throw error;
      return data as TrendingMaterial[];
    },
    staleTime: 1000 * 60 * 60, // 1 hour cache
  });
}
