import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useRegion } from "@/contexts/RegionContext";

export interface LocalStore {
  storeName: string;
  baseUrl: string;
  brandName: string;
}

/**
 * Hook that fetches regional stores for the user's active region.
 * Provides a lookup function to find local store alternatives for any brand.
 */
export function useRegionalStores() {
  const { region } = useRegion();

  const { data: storeMap = new Map<string, LocalStore>() } = useQuery({
    queryKey: ["regional-stores-map", region],
    queryFn: async () => {
      // Fetch regional stores for user's region
      const { data: stores, error: storesError } = await supabase
        .from("brand_regional_stores")
        .select("store_name, base_url, brand_id")
        .eq("region_code", region)
        .eq("is_active", true);

      if (storesError) throw storesError;
      if (!stores || stores.length === 0) return new Map<string, LocalStore>();

      // Fetch brand names for these stores
      const brandIds = [...new Set(stores.map((s) => s.brand_id))];
      const { data: brands, error: brandsError } = await supabase
        .from("automated_brands")
        .select("id, brand_name")
        .in("id", brandIds);

      if (brandsError) throw brandsError;

      const brandMap = new Map(brands?.map((b) => [b.id, b.brand_name]) || []);
      const result = new Map<string, LocalStore>();

      for (const store of stores) {
        const brandName = brandMap.get(store.brand_id);
        if (brandName) {
          result.set(brandName.toLowerCase(), {
            storeName: store.store_name,
            baseUrl: store.base_url,
            brandName,
          });
        }
      }

      return result;
    },
    staleTime: 1000 * 60 * 60, // 1 hour cache
  });

  const getLocalStore = (vendor: string | null): LocalStore | null => {
    if (!vendor) return null;
    return storeMap.get(vendor.toLowerCase()) || null;
  };

  return { storeMap, getLocalStore, region };
}
