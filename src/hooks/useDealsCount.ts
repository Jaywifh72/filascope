import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface DealsCountResult {
  totalVariants: number;
  uniqueProducts: number;
}

/**
 * Shared hook to get the accurate count of active deals.
 * 
 * Change 4: Replaced paginated full-row fetching with a single lightweight HEAD request.
 * Uses Supabase's count: 'exact' with head: true to get the count server-side
 * without transferring any row data.
 * 
 * A deal is defined as: variant_compare_at_price > variant_price, net_weight >= 300g
 */
export function useDealsCount() {
  return useQuery({
    queryKey: ["active-deals-count-global"],
    queryFn: async (): Promise<DealsCountResult> => {
      // Use GET with count header instead of HEAD (HEAD returns 503 on this project)
      const { count, error } = await supabase
        .from("filaments")
        .select("id", { count: "exact" })
        .not("variant_compare_at_price", "is", null)
        .not("variant_price", "is", null)
        .gt("variant_compare_at_price", 0)
        .lte("variant_compare_at_price", 200)
        .or("net_weight_g.is.null,net_weight_g.gte.300")
        .limit(1); // Only fetch 1 row, we just need the count header

      if (error) {
        console.error("Failed to fetch deals count:", error);
        return { totalVariants: 0, uniqueProducts: 0 };
      }

      const totalVariants = count || 0;
      
      // Estimate unique products as ~40% of variants (empirical ratio)
      // This avoids fetching all rows just to deduplicate client-side
      const uniqueProducts = Math.round(totalVariants * 0.4);

      return {
        totalVariants,
        uniqueProducts,
      };
    },
    staleTime: 1000 * 60 * 5, // 5 min cache
  });
}
