import { useState, useMemo, useCallback } from "react";

export type DealSortOption = "discount-desc" | "price-asc" | "price-desc" | "newest" | "brand-az";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useDealsCount } from "@/hooks/useDealsCount";
import { withRetry } from "@/lib/retry";
import { useRegion } from "@/contexts/RegionContext";
import { getDealStoreInfo } from "@/lib/dealStoreRegion";
import { RegionCode } from "@/types/regional";
import { groupDealsByProduct, type GroupedDeal } from "@/lib/groupDealsByProduct";

export interface DealFilament {
  id: string;
  product_title: string;
  vendor: string | null;
  material: string | null;
  featured_image: string | null;
  variant_price: number | null;
  variant_compare_at_price: number | null;
  product_url: string | null;
  net_weight_g: number | null;
  last_scraped_at?: string | null;
  created_at?: string | null;
  color_hex?: string | null;
}

export interface DealWithMeta extends DealFilament {
  discount: number;
  savings: number;
  expiresIn?: string | null;
  stockStatus?: "in_stock" | "low_stock" | "limited" | null;
  viewsToday?: number;
  // Store region info
  storeName: string;
  storeRegion: string;
  regionFlag: string;
  isLocal: boolean;
}

// Simulated urgency data (in a real app, this would come from the database)
function generateUrgencyData(dealId: string): { expiresIn?: string; stockStatus?: "in_stock" | "low_stock" | "limited"; viewsToday?: number } {
  // Use deterministic "random" based on ID hash for consistency
  const hash = dealId.split('').reduce((a, b) => ((a << 5) - a + b.charCodeAt(0)) | 0, 0);
  const rand = Math.abs(hash) % 100;
  
  return {
    expiresIn: rand < 15 ? "Ends in 2 days" : rand < 25 ? "Ends tomorrow" : null,
    stockStatus: rand < 10 ? "low_stock" : rand < 20 ? "limited" : "in_stock",
    viewsToday: rand < 40 ? Math.floor((rand / 40) * 50) + 5 : undefined,
  };
}

export function useDealsWithFilters() {
  const { region } = useRegion();
  const userRegion = region as RegionCode;
  
  const [selectedMaterials, setSelectedMaterials] = useState<string[]>([]);
  const [selectedBrands, setSelectedBrands] = useState<string[]>([]);
  const [minDiscount, setMinDiscount] = useState(0);
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 200]);
  const [showLocalOnly, setShowLocalOnly] = useState(false);
  const [sortBy, setSortBy] = useState<DealSortOption>("discount-desc");
  
  // Use shared deals count for accurate total (not limited by query limit)
  const { data: dealsCountData } = useDealsCount();
  const totalDealsCount = dealsCountData?.uniqueProducts || 0; // Use grouped product count for consistency
  const { data: rawDeals = [], isLoading } = useQuery({
    queryKey: ["deals-page-enhanced"],
    queryFn: () => withRetry(async () => {
      // Paginate through deals — server-side filters reduce payload significantly
      let allData: DealFilament[] = [];
      let offset = 0;
      const batchSize = 1000;
      let hasMore = true;

      while (hasMore) {
        const { data, error } = await supabase
          .from("filaments")
          .select(
            "id, product_title, vendor, material, featured_image, variant_price, variant_compare_at_price, product_url, net_weight_g, last_scraped_at, created_at, color_hex"
          )
          .not("variant_compare_at_price", "is", null)
          .not("variant_price", "is", null)
          .gt("variant_compare_at_price", 0)
          .lte("variant_compare_at_price", 200) // Filter bad data server-side
          .or("net_weight_g.is.null,net_weight_g.gte.300")
          .order("variant_compare_at_price", { ascending: false })
          .range(offset, offset + batchSize - 1);

        if (error) throw error;

        if (data && data.length > 0) {
          allData = [...allData, ...data];
          offset += batchSize;
          hasMore = data.length === batchSize;
        } else {
          hasMore = false;
        }
      }

      // Server filters: compare_at_price <= 200 (removes bad data early)
      // Client-side: actual deal check + discount percentage (5-75%)
      const sanitizedDeals = allData.filter((item) => {
        const cap = item.variant_compare_at_price!;
        const cur = item.variant_price!;
        if (cap <= cur) return false; // Not actually a deal
        const discountPct = ((cap - cur) / cap) * 100;
        return discountPct >= 5 && discountPct <= 75;
      });

      // Add discount calculation, urgency data, and store info
      return sanitizedDeals.map((item) => {
        const discount = Math.round(
          ((item.variant_compare_at_price! - item.variant_price!) / item.variant_compare_at_price!) * 100
        );
        const savings = item.variant_compare_at_price! - item.variant_price!;
        const urgency = generateUrgencyData(item.id);
        
        return {
          ...item,
          discount,
          savings,
          ...urgency,
          // Placeholder store info - will be enriched with user region in useMemo
          storeName: "",
          storeRegion: "",
          regionFlag: "",
          isLocal: false,
        } as DealWithMeta;
      });
    }, { maxRetries: 2 }),
    staleTime: 1000 * 60 * 5,
  });

  // Enrich deals with store region info based on user's region
  const dealsWithStoreInfo = useMemo(() => {
    return rawDeals.map((deal) => {
      const storeInfo = getDealStoreInfo(deal.product_url, deal.vendor, userRegion);
      return {
        ...deal,
        storeName: storeInfo.storeName,
        storeRegion: storeInfo.storeRegion,
        regionFlag: storeInfo.regionFlag,
        isLocal: storeInfo.isLocal,
      };
    });
  }, [rawDeals, userRegion]);

  // Extract unique materials and brands for filters
  const availableMaterials = useMemo(() => {
    const materials = new Set<string>();
    rawDeals.forEach((deal) => {
      if (deal.material) materials.add(deal.material);
    });
    return Array.from(materials).sort();
  }, [rawDeals]);

  const availableBrands = useMemo(() => {
    const brands = new Set<string>();
    rawDeals.forEach((deal) => {
      if (deal.vendor) brands.add(deal.vendor);
    });
    return Array.from(brands).sort();
  }, [rawDeals]);

  // Last updated timestamp (most recent last_scraped_at)
  const lastUpdated = useMemo(() => {
    let latest: string | null = null;
    for (const deal of rawDeals) {
      if (deal.last_scraped_at && (!latest || deal.last_scraped_at > latest)) {
        latest = deal.last_scraped_at;
      }
    }
    return latest;
  }, [rawDeals]);

  // Calculate max price for slider
  const maxPrice = useMemo(() => {
    if (rawDeals.length === 0) return 200;
    const max = Math.max(...rawDeals.map((d) => d.variant_price || 0));
    return Math.ceil(max / 10) * 10; // Round up to nearest 10
  }, [rawDeals]);

  // Count local deals for filter badge
  const localDealCount = useMemo(() => {
    return dealsWithStoreInfo.filter((deal) => deal.isLocal).length;
  }, [dealsWithStoreInfo]);

  // Apply filters
  const filteredDeals = useMemo(() => {
    return dealsWithStoreInfo
      .filter((deal) => {
        // Material filter
        if (selectedMaterials.length > 0 && (!deal.material || !selectedMaterials.includes(deal.material))) {
          return false;
        }
        // Brand filter
        if (selectedBrands.length > 0 && (!deal.vendor || !selectedBrands.includes(deal.vendor))) {
          return false;
        }
        // Discount filter
        if (deal.discount < minDiscount) {
          return false;
        }
        // Price filter
        if (deal.variant_price && (deal.variant_price < priceRange[0] || deal.variant_price > priceRange[1])) {
          return false;
        }
        // Local only filter
        if (showLocalOnly && !deal.isLocal) {
          return false;
        }
        return true;
      })
      // Sort: local deals first as tiebreaker, then by selected sort
      .sort((a, b) => {
        // Local deals first tiebreaker
        if (a.isLocal && !b.isLocal) return -1;
        if (!a.isLocal && b.isLocal) return 1;
        
        switch (sortBy) {
          case "price-asc":
            return (a.variant_price ?? 0) - (b.variant_price ?? 0);
          case "price-desc":
            return (b.variant_price ?? 0) - (a.variant_price ?? 0);
          case "newest":
            return (b.last_scraped_at ?? "").localeCompare(a.last_scraped_at ?? "");
          case "brand-az":
            return (a.vendor ?? "").localeCompare(b.vendor ?? "");
          case "discount-desc":
          default:
            return b.discount - a.discount;
        }
      });
  }, [dealsWithStoreInfo, selectedMaterials, selectedBrands, minDiscount, priceRange, showLocalOnly, sortBy]);

  // Group deals by product (color variants combined)
  const groupedDeals = useMemo(() => {
    return groupDealsByProduct(filteredDeals);
  }, [filteredDeals]);

  const clearAllFilters = () => {
    setSelectedMaterials([]);
    setSelectedBrands([]);
    setMinDiscount(0);
    setPriceRange([0, maxPrice]);
    setShowLocalOnly(false);
  };

  return {
    deals: filteredDeals,
    groupedDeals,
    totalDeals: totalDealsCount, // Use accurate count from shared hook
    isLoading,
    // Filter state
    selectedMaterials,
    setSelectedMaterials,
    selectedBrands,
    setSelectedBrands,
    minDiscount,
    setMinDiscount,
    priceRange,
    setPriceRange,
    showLocalOnly,
    setShowLocalOnly,
    // Filter options
    availableMaterials,
    availableBrands,
    maxPrice,
    localDealCount,
    userRegion,
    lastUpdated,
    // Sort state
    sortBy,
    setSortBy,
    // Actions
    clearAllFilters,
  };
}
