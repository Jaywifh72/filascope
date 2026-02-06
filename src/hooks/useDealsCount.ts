import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useRegion } from "@/contexts/RegionContext";
import { RegionCode } from "@/types/regional";

interface DealsCountResult {
  totalVariants: number;
  uniqueProducts: number;
}

// Region detection from URL (simplified version matching dealStoreRegion.ts logic)
function detectRegionFromUrl(url: string | null): RegionCode {
  if (!url) return "US";
  
  const lowerUrl = url.toLowerCase();
  
  // Amazon domains
  if (lowerUrl.includes("amazon.ca")) return "CA";
  if (lowerUrl.includes("amazon.co.uk")) return "UK";
  if (lowerUrl.includes("amazon.de") || lowerUrl.includes("amazon.fr") || 
      lowerUrl.includes("amazon.it") || lowerUrl.includes("amazon.es") || 
      lowerUrl.includes("amazon.nl")) return "EU";
  if (lowerUrl.includes("amazon.com.au")) return "AU";
  if (lowerUrl.includes("amazon.co.jp")) return "JP";
  if (lowerUrl.includes("amazon.cn")) return "CN";
  
  // Other regional patterns
  if (lowerUrl.includes(".co.uk") || lowerUrl.includes("-uk.") || lowerUrl.includes("/uk/")) return "UK";
  if (lowerUrl.includes(".eu") || lowerUrl.includes("-eu.") || lowerUrl.includes("/eu/") ||
      lowerUrl.includes(".de/") || lowerUrl.includes(".fr/")) return "EU";
  if (lowerUrl.includes(".ca/") || lowerUrl.includes("-ca.") || lowerUrl.includes("/ca/")) return "CA";
  if (lowerUrl.includes(".com.au") || lowerUrl.includes("-au.") || lowerUrl.includes("/au/")) return "AU";
  if (lowerUrl.includes(".co.jp") || lowerUrl.includes("-jp.") || lowerUrl.includes("/jp/")) return "JP";
  
  // Default to US for .com stores
  return "US";
}

/**
 * Shared hook to get the accurate count of active deals.
 * Returns both total variants and unique product count (grouped by vendor + base product name).
 * Now filters by user's region to match what's shown on the Deals page.
 * 
 * A deal is defined as: variant_compare_at_price > variant_price, net_weight >= 300g
 */
export function useDealsCount() {
  const { region } = useRegion();
  const userRegion = region as RegionCode;
  
  return useQuery({
    queryKey: ["active-deals-count", userRegion],
    queryFn: async (): Promise<DealsCountResult> => {
      let allDeals: { 
        variant_price: number | null; 
        variant_compare_at_price: number | null;
        vendor: string | null;
        product_title: string | null;
        product_url: string | null;
      }[] = [];
      let offset = 0;
      const batchSize = 1000;
      let hasMore = true;

      // Paginate through all potential deals
      while (hasMore) {
        const { data, error } = await supabase
          .from("filaments")
          .select("variant_price, variant_compare_at_price, vendor, product_title, product_url")
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

      // Filter by user's region (matching Deals page logic)
      const regionalDeals = actualDeals.filter((deal) => {
        const dealRegion = detectRegionFromUrl(deal.product_url);
        return dealRegion === userRegion;
      });

      // Group by vendor + base product name to get unique product count
      const productGroups = new Set<string>();
      for (const deal of regionalDeals) {
        // Extract base product name (remove color variants)
        const baseTitle = deal.product_title
          ?.replace(/\s*-\s*[^-]+$/, '') // Remove " - Color" suffix
          ?.replace(/\s*\([^)]+\)\s*$/, '') // Remove "(Color)" suffix
          ?.trim() || 'Unknown';
        const groupKey = `${deal.vendor || 'Unknown'}::${baseTitle}`;
        productGroups.add(groupKey);
      }

      return {
        totalVariants: regionalDeals.length,
        uniqueProducts: productGroups.size,
      };
    },
    staleTime: 1000 * 60 * 5, // 5 min cache
  });
}
