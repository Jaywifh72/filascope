import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface PricePoint {
  date: string;
  price: number;
  x?: number;
  y?: number;
}

export interface PriceHistoryData {
  prices: PricePoint[];
  min: number;
  max: number;
  avg: number;
  currentPrice: number;
  isBestIn30Days: boolean;
  isBestIn6Months: boolean;
  trendPercent: number | null;
  isLoading: boolean;
  minPoint: PricePoint | null;
  maxPoint: PricePoint | null;
}

const EMPTY_DATA: Omit<PriceHistoryData, 'isLoading'> = {
  prices: [],
  min: 0,
  max: 0,
  avg: 0,
  currentPrice: 0,
  isBestIn30Days: false,
  isBestIn6Months: false,
  trendPercent: null,
  minPoint: null,
  maxPoint: null,
};

/**
 * Fetches 6 months of raw price history for a filament.
 * Uses React Query for automatic deduplication — multiple components
 * calling this hook with the same filamentId share a single request.
 */
function useRawPriceHistory(filamentId: string) {
  return useQuery({
    queryKey: ["price-history", filamentId],
    queryFn: async () => {
      const sixMonthsAgo = new Date();
      sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

      const { data, error } = await supabase
        .from("price_history")
        .select("price, recorded_at")
        .eq("filament_id", filamentId)
        .gte("recorded_at", sixMonthsAgo.toISOString())
        .order("recorded_at", { ascending: true });

      if (error) throw error;
      return data ?? [];
    },
    enabled: !!filamentId,
    staleTime: 1000 * 60 * 5, // 5 min
    gcTime: 1000 * 60 * 30,
  });
}

export function usePriceHistory(filamentId: string, currentPrice: number | null, days: number = 30): PriceHistoryData {
  const { data: history, isLoading } = useRawPriceHistory(filamentId);

  return useMemo(() => {
    if (!history || history.length === 0 || !currentPrice) {
      return { ...EMPTY_DATA, currentPrice: currentPrice || 0, isLoading };
    }

    const prices: PricePoint[] = history.map(h => ({
      date: h.recorded_at || "",
      price: Number(h.price),
    }));

    const priceValues = prices.map(p => p.price);
    const min = Math.min(...priceValues, currentPrice);
    const max = Math.max(...priceValues);
    const avg = priceValues.reduce((a, b) => a + b, 0) / priceValues.length;

    // Best in 30 days
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const last30Days = prices.filter(p => new Date(p.date) >= thirtyDaysAgo);
    const min30 = last30Days.length > 0
      ? Math.min(...last30Days.map(p => p.price))
      : currentPrice;
    const isBestIn30Days = currentPrice <= min30 * 1.02;

    // Best in 6 months
    const isBestIn6Months = currentPrice <= min * 1.02;

    // Trend
    let trendPercent: number | null = null;
    if (last30Days.length > 0) {
      const oldPrice = last30Days[0].price;
      if (oldPrice > 0) {
        trendPercent = Math.round(((currentPrice - oldPrice) / oldPrice) * 100);
      }
    }

    // Min/max points
    let minPoint: PricePoint | null = null;
    let maxPoint: PricePoint | null = null;
    let minP = Infinity;
    let maxP = -Infinity;
    prices.forEach((p, i) => {
      if (p.price < minP) { minP = p.price; minPoint = { ...p, x: i, y: p.price }; }
      if (p.price > maxP) { maxP = p.price; maxPoint = { ...p, x: i, y: p.price }; }
    });

    return {
      prices: prices.slice(-days),
      min,
      max,
      avg,
      currentPrice,
      isBestIn30Days,
      isBestIn6Months,
      trendPercent,
      isLoading,
      minPoint,
      maxPoint,
    };
  }, [history, currentPrice, days, isLoading]);
}
