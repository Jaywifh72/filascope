import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

/**
 * Shared hook to get the accurate count of active deals.
 * Uses pagination to count ALL deals, not just a limited subset.
 * 
 * A deal is defined as: variant_compare_at_price > variant_price, net_weight >= 300g
 */
export function useDealsCount() {
  return useQuery({
    queryKey: ["active-deals-count"],
    queryFn: async () => {
      let allDeals: { variant_price: number | null; variant_compare_at_price: number | null }[] = [];
      let offset = 0;
      const batchSize = 1000;
      let hasMore = true;

      // Paginate through all potential deals
      while (hasMore) {
        const { data, error } = await supabase
          .from("filaments")
          .select("variant_price, variant_compare_at_price")
          .not("variant_compare_at_price", "is", null)
          .not("variant_price", "is", null)
          .gt("variant_compare_at_price", 0)
          .or("net_weight_g.is.null,net_weight_g.gte.300")
          .range(offset, offset + batchSize - 1);

        if (error) {
          console.error("Failed to fetch deals count:", error);
          break;
        }

        if (data && data.length > 0) {
          allDeals = [...allDeals, ...data];
          offset += batchSize;
          hasMore = data.length === batchSize;
        } else {
          hasMore = false;
        }
      }

      // Filter to only count items where compare_at_price > variant_price (actual discounts)
      const actualDeals = allDeals.filter(
        (item) =>
          item.variant_compare_at_price !== null &&
          item.variant_price !== null &&
          item.variant_compare_at_price > item.variant_price
      );

      return actualDeals.length;
    },
    staleTime: 1000 * 60 * 5, // 5 min cache
  });
}
