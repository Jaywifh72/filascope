import { useMemo } from "react";
import { useAuth } from "./useAuth";
import { useBrowseHistory } from "./useBrowseHistory";
import { getSuggestedUpgrades } from "@/lib/personalizationEngine";

// Derives purchase-like personalization signals from browse history
// Used by the personalization engine; actual purchase tracking uses useUserPurchases

export interface PurchaseAnalysis {
  purchasedMaterials: string[];
  preferredBrands: string[];
  avgPricePerKg: number | null;
  purchaseCount: number;
  daysSinceLastPurchase: number | null;
  suggestedUpgrades: Array<{
    from: string;
    to: string;
    reason: string;
  }>;
}

export function usePurchaseHistory(): PurchaseAnalysis & { isLoading: boolean } {
  const { user } = useAuth();
  const { history, isLoading } = useBrowseHistory(50);

  const analysis: PurchaseAnalysis = useMemo(() => {
    const materialsSet = new Set<string>();
    const brandCounts: Record<string, number> = {};
    let totalPricePerKg = 0;
    let priceCount = 0;

    history.forEach((item) => {
      if (item.filament?.material) {
        materialsSet.add(item.filament.material);
      }
      if (item.filament?.vendor) {
        const brand = item.filament.vendor.toLowerCase();
        brandCounts[brand] = (brandCounts[brand] || 0) + 1;
      }
      if (item.filament?.variant_price && item.filament?.net_weight_g) {
        const pricePerKg = (item.filament.variant_price / item.filament.net_weight_g) * 1000;
        totalPricePerKg += pricePerKg;
        priceCount++;
      }
    });

    const purchasedMaterials = Array.from(materialsSet);
    const preferredBrands = Object.entries(brandCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([brand]) => brand);

    const avgPricePerKg = priceCount > 0 ? totalPricePerKg / priceCount : null;
    const suggestedUpgrades = getSuggestedUpgrades(purchasedMaterials);

    return {
      purchasedMaterials,
      preferredBrands,
      avgPricePerKg,
      purchaseCount: 0,
      daysSinceLastPurchase: null,
      suggestedUpgrades,
    };
  }, [history]);

  return {
    ...analysis,
    isLoading,
  };
}
