import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useDealsCount } from "@/hooks/useDealsCount";
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
  
  // Use shared deals count for accurate total (not limited by query limit)
  const { data: dealsCountData } = useDealsCount();
  const totalDealsCount = dealsCountData?.totalVariants || 0;
  const { data: rawDeals = [], isLoading } = useQuery({
    queryKey: ["deals-page-enhanced"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("filaments")
        .select(
          "id, product_title, vendor, material, featured_image, variant_price, variant_compare_at_price, product_url, net_weight_g, last_scraped_at, created_at, color_hex"
        )
        .not("variant_compare_at_price", "is", null)
        .not("variant_price", "is", null)
        .gt("variant_compare_at_price", 0)
        .or("net_weight_g.is.null,net_weight_g.gte.300")
        .order("variant_compare_at_price", { ascending: false })
        .limit(200);

      if (error) throw error;

      // Filter to only show items where compare_at_price > variant_price
      const onSaleItems = (data || []).filter(
        (item) =>
          item.variant_compare_at_price !== null &&
          item.variant_price !== null &&
          item.variant_compare_at_price > item.variant_price
      ) as DealFilament[];

      // Add discount calculation, urgency data, and store info
      return onSaleItems.map((item) => {
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
    },
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
      .sort((a, b) => b.discount - a.discount);
  }, [dealsWithStoreInfo, selectedMaterials, selectedBrands, minDiscount, priceRange, showLocalOnly]);

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
    // Actions
    clearAllFilters,
  };
}
