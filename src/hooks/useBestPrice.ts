import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAffiliateLinks } from "./useAffiliateLinks";

export interface BestPriceListing {
  listing_id: string;
  retailer_name: string;
  retailer_slug: string;
  current_price: number;
  product_url: string;
  affiliate_url: string;
  available: boolean;
}

interface UseBestPriceOptions {
  region?: string;
  currency?: string;
}

export function useBestPrice(
  filamentId: string | undefined,
  options: UseBestPriceOptions = {}
) {
  const { region = "US", currency = "USD" } = options;
  const { getAffiliateUrl } = useAffiliateLinks();

  return useQuery({
    queryKey: ["best-price", filamentId, region, currency],
    queryFn: async (): Promise<BestPriceListing | null> => {
      if (!filamentId) return null;

      // Use the database function for efficiency
      const { data, error } = await supabase
        .rpc("get_best_listing", {
          _filament_id: filamentId,
          _region: region,
          _currency: currency,
        });

      if (error) {
        console.error("Error fetching best price:", error);
        throw error;
      }

      if (!data || data.length === 0) return null;

      const listing = data[0];
      const affiliateUrl = getAffiliateUrl(listing.product_url, listing.retailer_name);

      return {
        listing_id: listing.listing_id,
        retailer_name: listing.retailer_name,
        retailer_slug: listing.retailer_slug,
        current_price: listing.current_price,
        product_url: listing.product_url,
        affiliate_url: affiliateUrl,
        available: listing.available,
      };
    },
    enabled: !!filamentId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

/**
 * Get best prices for multiple filaments at once
 */
export function useBestPrices(
  filamentIds: string[],
  options: UseBestPriceOptions = {}
) {
  const { region = "US", currency = "USD" } = options;
  const { getAffiliateUrl } = useAffiliateLinks();

  return useQuery({
    queryKey: ["best-prices-batch", filamentIds, region, currency],
    queryFn: async (): Promise<Map<string, BestPriceListing>> => {
      if (filamentIds.length === 0) return new Map();

      // Batch query for all filaments
      const { data, error } = await supabase
        .from("filament_listings")
        .select(`
          id,
          filament_id,
          product_url,
          current_price,
          available,
          retailers (
            name,
            slug
          )
        `)
        .in("filament_id", filamentIds)
        .eq("region", region)
        .eq("currency", currency)
        .eq("available", true)
        .not("current_price", "is", null)
        .order("current_price", { ascending: true });

      if (error) {
        console.error("Error fetching best prices:", error);
        throw error;
      }

      // Group by filament_id and take first (cheapest) for each
      const bestPrices = new Map<string, BestPriceListing>();
      
      for (const listing of data || []) {
        if (!bestPrices.has(listing.filament_id)) {
          const retailer = listing.retailers as any;
          bestPrices.set(listing.filament_id, {
            listing_id: listing.id,
            retailer_name: retailer?.name || "Unknown",
            retailer_slug: retailer?.slug || "",
            current_price: listing.current_price,
            product_url: listing.product_url,
            affiliate_url: getAffiliateUrl(listing.product_url, retailer?.name || ""),
            available: listing.available,
          });
        }
      }

      return bestPrices;
    },
    enabled: filamentIds.length > 0,
    staleTime: 5 * 60 * 1000,
  });
}
