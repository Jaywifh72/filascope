import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

/** Returns the count of visible brands from the database. Cached for 1 hour. */
export function useBrandCount() {
  return useQuery({
    queryKey: ["visible-brand-count"],
    queryFn: async () => {
      const { count, error } = await supabase
        .from("automated_brands")
        .select("*", { count: "exact", head: true })
        .eq("is_visible", true);
      if (error) throw error;
      return count ?? 48;
    },
    staleTime: 60 * 60 * 1000, // 1 hour
    gcTime: 60 * 60 * 1000,
  });
}
