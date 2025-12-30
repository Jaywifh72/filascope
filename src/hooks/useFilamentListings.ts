import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAffiliateLinks } from "./useAffiliateLinks";

export interface FilamentListing {
  listing_id: string;
  filament_id: string;
  retailer_id: string;
  retailer_name: string;
  retailer_slug: string;
  retailer_logo: string | null;
  retailer_trust_score: number | null;
  current_price: number | null;
  compare_at_price: number | null;
  currency: string;
  region: string;
  available: boolean;
  stock_level: string | null;
  product_url: string;
  affiliate_url: string | null;
  price_per_kg: number | null;
  is_primary: boolean;
  last_scraped_at: string | null;
  scrape_status: string | null;
}

interface UseFilamentListingsOptions {
  region?: string;
  currency?: string;
  includeUnavailable?: boolean;
}

export function useFilamentListings(
  filamentId: string | undefined,
  options: UseFilamentListingsOptions = {}
) {
  const { region = "US", currency = "USD", includeUnavailable = false } = options;
  const { getAffiliateUrl } = useAffiliateLinks();

  return useQuery({
    queryKey: ["filament-listings", filamentId, region, currency, includeUnavailable],
    queryFn: async (): Promise<FilamentListing[]> => {
      if (!filamentId) return [];

      let query = supabase
        .from("filament_listings")
        .select(`
          id,
          filament_id,
          retailer_id,
          product_url,
          affiliate_url,
          current_price,
          compare_at_price,
          currency,
          region,
          available,
          stock_level,
          is_primary,
          last_scraped_at,
          scrape_status,
          retailers (
            name,
            slug,
            logo_url,
            trust_score
          )
        `)
        .eq("filament_id", filamentId)
        .eq("region", region)
        .eq("currency", currency)
        .order("current_price", { ascending: true, nullsFirst: false });

      if (!includeUnavailable) {
        query = query.eq("available", true);
      }

      const { data, error } = await query;

      if (error) {
        console.error("Error fetching filament listings:", error);
        throw error;
      }

      // Transform and add affiliate URLs
      return (data || []).map((listing: any) => {
        const retailer = listing.retailers;
        const affiliateUrl = listing.affiliate_url || 
          getAffiliateUrl(listing.product_url, retailer?.name || "");

        return {
          listing_id: listing.id,
          filament_id: listing.filament_id,
          retailer_id: listing.retailer_id,
          retailer_name: retailer?.name || "Unknown",
          retailer_slug: retailer?.slug || "",
          retailer_logo: retailer?.logo_url || null,
          retailer_trust_score: retailer?.trust_score || null,
          current_price: listing.current_price,
          compare_at_price: listing.compare_at_price,
          currency: listing.currency,
          region: listing.region,
          available: listing.available,
          stock_level: listing.stock_level,
          product_url: listing.product_url,
          affiliate_url: affiliateUrl,
          price_per_kg: null, // Computed client-side if needed
          is_primary: listing.is_primary,
          last_scraped_at: listing.last_scraped_at,
          scrape_status: listing.scrape_status,
        };
      });
    },
    enabled: !!filamentId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}
