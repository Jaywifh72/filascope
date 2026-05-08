import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { withRetry } from "@/lib/retry";

export interface DetectedDeal {
  id: string;
  filament_id: string;
  vendor: string | null;
  product_title: string | null;
  material: string | null;
  color_family: string | null;
  old_price: number;
  new_price: number;
  drop_pct: number;
  drop_amount: number;
  product_url: string | null;
  featured_image: string | null;
  deal_date: string;
  is_active: boolean;
}

export interface PricePoint {
  date: string;
  price: number;
  source: string | null;
  region: string | null;
}

export interface PriceHistoryResult {
  prices: PricePoint[];
  min: number;
  max: number;
  avg: number;
  currentPrice: number;
  minPoint: PricePoint | null;
  maxPoint: PricePoint | null;
  trendPercent: number | null;
  isBestIn30Days: boolean;
  isBestIn6Months: boolean;
  isLoading: boolean;
  error: Error | null;
}

/**
 * Hook to fetch detected price drops from the price_drop_deals table.
 * These are price drops detected by the Deal Hunter agent comparing
 * current prices against historical snapshots.
 */
export function useDetectedDeals() {
  return useQuery({
    queryKey: ["detected-deals"],
    queryFn: () =>
      withRetry(async () => {
        const { data, error } = await supabase
          .from("price_drop_deals")
          .select("*")
          .eq("is_active", true)
          .order("drop_pct", { ascending: false })
          .limit(200);

        if (error) throw error;
        return (data || []) as DetectedDeal[];
      }),
    staleTime: 1000 * 60 * 30, // 30 min cache
    refetchOnWindowFocus: false,
  });
}

/**
 * Hook to fetch price history for a specific filament.
 * Returns daily price snapshots with computed stats for charting.
 *
 * @param filamentId - The filament ID to fetch history for
 * @param currentPrice - The current price (used for trend calculation)
 * @param days - Number of days of history to fetch (default 90)
 */
export function usePriceHistory(
  filamentId: string | undefined,
  currentPrice?: number | null,
  days?: number
): PriceHistoryResult {
  const limit = days || 90;

  const query = useQuery({
    queryKey: ["price-history", filamentId, limit],
    queryFn: () =>
      withRetry(async () => {
        if (!filamentId) return [];

        const { data, error } = await supabase
          .from("price_history")
          .select("price, recorded_at, source, region")
          .eq("filament_id", filamentId)
          .order("recorded_at", { ascending: true })
          .limit(limit);

        if (error) throw error;
        return (
          (data || []).map((d) => ({
            date: new Date(d.recorded_at).toISOString().split("T")[0],
            price: parseFloat(d.price),
            source: d.source,
            region: d.region,
          })) as PricePoint[]
        );
      }),
    enabled: !!filamentId,
    staleTime: 1000 * 60 * 60, // 1 hour cache
  });

  // Compute derived stats from the raw price data
  const computed = useMemo(() => {
    const prices = query.data || [];

    if (prices.length === 0) {
      return {
        prices: [] as PricePoint[],
        min: 0,
        max: 0,
        avg: 0,
        currentPrice: currentPrice ?? 0,
        minPoint: null,
        maxPoint: null,
        trendPercent: null,
        isBestIn30Days: false,
        isBestIn6Months: false,
      };
    }

    const priceValues = prices.map((p) => p.price);
    const min = Math.min(...priceValues);
    const max = Math.max(...priceValues);
    const avg = priceValues.reduce((sum, p) => sum + p, 0) / priceValues.length;
    const minIdx = priceValues.indexOf(min);
    const maxIdx = priceValues.indexOf(max);

    const effectiveCurrentPrice = currentPrice ?? priceValues[priceValues.length - 1];

    // Trend: percentage change from first to current price
    const firstPrice = priceValues[0];
    const trendPercent =
      firstPrice > 0
        ? Math.round(((effectiveCurrentPrice - firstPrice) / firstPrice) * 10000) / 100
        : null;

    // Best price checks
    const isBestIn30Days =
      effectiveCurrentPrice <= min &&
      prices.some(
        (p) =>
          new Date(p.date).getTime() >
          Date.now() - 30 * 24 * 60 * 60 * 1000
      );

    const isBestIn6Months =
      effectiveCurrentPrice <= min &&
      prices.some(
        (p) =>
          new Date(p.date).getTime() >
          Date.now() - 180 * 24 * 60 * 60 * 1000
      );

    return {
      prices,
      min,
      max,
      avg,
      currentPrice: effectiveCurrentPrice,
      minPoint: { ...prices[minIdx], y: prices[minIdx].price },
      maxPoint: { ...prices[maxIdx], y: prices[maxIdx].price },
      trendPercent,
      isBestIn30Days,
      isBestIn6Months,
    };
  }, [query.data, currentPrice]);

  return {
    ...computed,
    isLoading: query.isLoading,
    error: query.error,
  };
}
