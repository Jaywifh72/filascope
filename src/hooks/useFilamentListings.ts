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
      const listings = (data || []).map((listing: any) => {
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
          price_per_kg: null,
          is_primary: listing.is_primary,
          last_scraped_at: listing.last_scraped_at,
          scrape_status: listing.scrape_status,
        };
      });

      // If real listings exist, use them
      if (listings.length > 0) return listings;

      // Fallback: construct synthetic listings from filaments table
      console.debug('[useFilamentListings] No real listings found, using synthetic fallback for:', filamentId);
      return buildSyntheticListings(filamentId, region, currency, getAffiliateUrl);
    },
    enabled: !!filamentId,
    staleTime: 5 * 60 * 1000,
  });
}

const REGION_PRICE_MAP: Record<string, { priceCol: string; urlCol: string; currency: string }> = {
  US: { priceCol: "variant_price", urlCol: "product_url", currency: "USD" },
  AU: { priceCol: "price_aud", urlCol: "product_url_au", currency: "AUD" },
  CA: { priceCol: "price_cad", urlCol: "product_url_ca", currency: "CAD" },
  EU: { priceCol: "price_eur", urlCol: "product_url_eu", currency: "EUR" },
  UK: { priceCol: "price_gbp", urlCol: "product_url_uk", currency: "GBP" },
  JP: { priceCol: "price_jpy", urlCol: "product_url_jp", currency: "JPY" },
};

async function buildSyntheticListings(
  filamentId: string,
  userRegion: string,
  userCurrency: string,
  getAffiliateUrl: (url: string, vendor: string) => string | null
): Promise<FilamentListing[]> {
  const { data: filament, error } = await supabase
    .from("filaments")
    .select(`
      id, vendor, product_title, msrp,
      variant_price, variant_compare_at_price, product_url,
      price_aud, product_url_au,
      price_cad, product_url_ca,
      price_eur, product_url_eu,
      price_gbp, product_url_uk,
      price_jpy, product_url_jp,
      primary_region
    `)
    .eq("id", filamentId)
    .single();

  if (error) {
    console.warn('[useFilamentListings] Synthetic fallback failed for filament:', filamentId, error);
    return [];
  }
  if (!filament) {
    console.warn('[useFilamentListings] Filament not found for synthetic fallback:', filamentId);
    return [];
  }

  const vendor = filament.vendor || "Unknown";
  const listings: FilamentListing[] = [];

  // Build a listing for each region that has both price and URL
  for (const [regionCode, mapping] of Object.entries(REGION_PRICE_MAP)) {
    const price = (filament as any)[mapping.priceCol] as number | null;
    const url = (filament as any)[mapping.urlCol] as string | null;

    if (price == null || !url) continue;

    const compareAt = regionCode === "US" ? filament.variant_compare_at_price : null;
    const isPrimary = filament.primary_region
      ? regionCode === filament.primary_region
      : regionCode === "US";

    const affiliateUrl = getAffiliateUrl(url, vendor);

    listings.push({
      listing_id: `synthetic-${filament.id}-${regionCode}`,
      filament_id: filament.id,
      retailer_id: `synthetic-${vendor.toLowerCase().replace(/\s+/g, "-")}`,
      retailer_name: vendor,
      retailer_slug: vendor.toLowerCase().replace(/\s+/g, "-"),
      retailer_logo: null,
      retailer_trust_score: null,
      current_price: price,
      compare_at_price: compareAt ?? null,
      currency: mapping.currency,
      region: regionCode,
      available: true,
      stock_level: null,
      product_url: url,
      affiliate_url: affiliateUrl,
      price_per_kg: null,
      is_primary: isPrimary,
      last_scraped_at: null,
      scrape_status: null,
    });
  }

  // Filter to user's requested region/currency, or return all if no exact match
  const regionMatch = listings.filter(
    (l) => l.region === userRegion && l.currency === userCurrency
  );

  const result = regionMatch.length > 0 ? regionMatch : listings;
  console.debug('[useFilamentListings] Generated', result.length, 'synthetic listings for filament:', filamentId);
  return result;
}
