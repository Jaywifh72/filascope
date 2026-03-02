import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAffiliatePrioritization } from "./useAffiliatePrioritization";

/**
 * Fetches a Map<printer_brand_id, boost_value> for the given region.
 * Only queries when affiliate prioritization is enabled.
 * Falls back to empty map on any error.
 */
export function usePrinterAffiliateBoost(region: string) {
  const { isEnabled } = useAffiliatePrioritization();

  const { data: boostMap = new Map<string, number>() } = useQuery({
    queryKey: ["printer-affiliate-boost", region],
    enabled: isEnabled,
    queryFn: async () => {
      // 1. Get all printer_brands
      const { data: printerBrands, error: pbErr } = await supabase
        .from("printer_brands")
        .select("id, brand");
      if (pbErr || !printerBrands) return new Map<string, number>();

      // 2. Get automated_brands to map brand names
      const { data: autoBrands, error: abErr } = await supabase
        .from("automated_brands")
        .select("id, brand_name");
      if (abErr || !autoBrands) return new Map<string, number>();

      // 3. Get boost values for this region
      const { data: stores, error: stErr } = await supabase
        .from("brand_regional_stores")
        .select("brand_id, affiliate_priority_boost")
        .eq("region_code", region)
        .eq("is_active", true)
        .gt("affiliate_priority_boost", 0);
      if (stErr || !stores) return new Map<string, number>();

      // Build automated_brand name -> boost map
      const autoBrandBoost = new Map<string, number>();
      const autoBrandById = new Map(autoBrands.map((b) => [b.id, b.brand_name]));
      for (const s of stores) {
        const name = autoBrandById.get(s.brand_id);
        if (name) autoBrandBoost.set(name.toLowerCase(), s.affiliate_priority_boost);
      }

      // Map printer_brand.id -> boost via name matching
      const result = new Map<string, number>();
      for (const pb of printerBrands) {
        const boost = autoBrandBoost.get(pb.brand.toLowerCase());
        if (boost && boost > 0) result.set(pb.id, boost);
      }

      return result;
    },
    staleTime: 1000 * 60 * 30,
    gcTime: 1000 * 60 * 60,
  });

  return { boostMap, isEnabled };
}
