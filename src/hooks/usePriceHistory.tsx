import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface PriceHistoryData {
  prices: { date: string; price: number }[];
  min: number;
  max: number;
  avg: number;
  currentPrice: number;
  isBestIn30Days: boolean;
  isBestIn6Months: boolean;
  trendPercent: number | null;
  isLoading: boolean;
}

export function usePriceHistory(filamentId: string, currentPrice: number | null): PriceHistoryData {
  const [data, setData] = useState<PriceHistoryData>({
    prices: [],
    min: 0,
    max: 0,
    avg: 0,
    currentPrice: currentPrice || 0,
    isBestIn30Days: false,
    isBestIn6Months: false,
    trendPercent: null,
    isLoading: true,
  });

  useEffect(() => {
    if (!filamentId || !currentPrice) {
      setData(prev => ({ ...prev, isLoading: false }));
      return;
    }

    const fetchPriceHistory = async () => {
      try {
        // Fetch last 6 months of price history
        const sixMonthsAgo = new Date();
        sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

        const { data: history, error } = await supabase
          .from("price_history")
          .select("price, recorded_at")
          .eq("filament_id", filamentId)
          .gte("recorded_at", sixMonthsAgo.toISOString())
          .order("recorded_at", { ascending: true });

        if (error || !history || history.length === 0) {
          setData(prev => ({ ...prev, isLoading: false }));
          return;
        }

        const prices = history.map(h => ({
          date: h.recorded_at || "",
          price: Number(h.price),
        }));

        const priceValues = prices.map(p => p.price);
        const min = Math.min(...priceValues, currentPrice);
        const max = Math.max(...priceValues);
        const avg = priceValues.reduce((a, b) => a + b, 0) / priceValues.length;

        // Check best price in 30 days
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        const last30Days = prices.filter(p => new Date(p.date) >= thirtyDaysAgo);
        const min30 = last30Days.length > 0 
          ? Math.min(...last30Days.map(p => p.price))
          : currentPrice;
        const isBestIn30Days = currentPrice <= min30 * 1.02; // Within 2%

        // Check best price in 6 months
        const isBestIn6Months = currentPrice <= min * 1.02;

        // Calculate trend (compare to 30 days ago)
        let trendPercent: number | null = null;
        if (last30Days.length > 0) {
          const oldPrice = last30Days[0].price;
          if (oldPrice > 0) {
            trendPercent = Math.round(((currentPrice - oldPrice) / oldPrice) * 100);
          }
        }

        setData({
          prices: prices.slice(-30), // Last 30 data points for sparkline
          min,
          max,
          avg,
          currentPrice,
          isBestIn30Days,
          isBestIn6Months,
          trendPercent,
          isLoading: false,
        });
      } catch (err) {
        console.error("Error fetching price history:", err);
        setData(prev => ({ ...prev, isLoading: false }));
      }
    };

    fetchPriceHistory();
  }, [filamentId, currentPrice]);

  return data;
}
