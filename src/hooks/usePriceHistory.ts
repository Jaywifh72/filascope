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
 * Returns daily price snapshots for charting.
 */
export function usePriceHistory(filamentId: string | undefined) {
  return useQuery({
    queryKey: ["price-history", filamentId],
    queryFn: () =>
      withRetry(async () => {
        if (!filamentId) return [];

        const { data, error } = await supabase
          .from("price_history")
          .select("price, recorded_at, source, region")
          .eq("filament_id", filamentId)
          .order("recorded_at", { ascending: true })
          .limit(90); // Last 90 days

        if (error) throw error;
        return (
          (data || []).map((d) => ({
            date: new Date(d.recorded_at).toISOString().split("T")[0],
            price: parseFloat(d.price),
            source: d.source,
            region: d.region,
          }))
        );
      }),
    enabled: !!filamentId,
    staleTime: 1000 * 60 * 60, // 1 hour cache
  });
}
