import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface DealsCountResult {
  totalVariants: number;
  uniqueProducts: number;
}

/**
 * Shared hook to get the accurate count of active deals.
 * Returns both total variants and unique product count (grouped by vendor + base product name).
 * 
 * A deal is defined as: variant_compare_at_price > variant_price, net_weight >= 300g
 */
export function useDealsCount() {
  return useQuery({
    queryKey: ["active-deals-count"],
    queryFn: async (): Promise<DealsCountResult> => {
      let allDeals: { 
        variant_price: number | null; 
        variant_compare_at_price: number | null;
        vendor: string | null;
        product_title: string | null;
      }[] = [];
      let offset = 0;
      const batchSize = 1000;
      let hasMore = true;

      // Paginate through all potential deals
      while (hasMore) {
        const { data, error } = await supabase
          .from("filaments")
          .select("variant_price, variant_compare_at_price, vendor, product_title")
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

      // Group by vendor + base product name to get unique product count
      const productGroups = new Set<string>();
      for (const deal of actualDeals) {
        // Extract base product name (remove color variants)
        const baseTitle = deal.product_title
          ?.replace(/\s*-\s*[^-]+$/, '') // Remove " - Color" suffix
          ?.replace(/\s*\([^)]+\)\s*$/, '') // Remove "(Color)" suffix
          ?.trim() || 'Unknown';
        const groupKey = `${deal.vendor || 'Unknown'}::${baseTitle}`;
        productGroups.add(groupKey);
      }

      return {
        totalVariants: actualDeals.length,
        uniqueProducts: productGroups.size,
      };
    },
    staleTime: 1000 * 60 * 5, // 5 min cache
  });
}
