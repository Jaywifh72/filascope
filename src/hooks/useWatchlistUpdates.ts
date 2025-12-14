import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import { subDays } from "date-fns";

interface WatchlistUpdate {
  id: string;
  filament_id: string;
  product_title: string;
  vendor: string | null;
  material: string | null;
  featured_image: string | null;
  color_hex: string | null;
  current_price: number | null;
  net_weight_g: number | null;
  variant_available: boolean | null;
  // Update info
  updateType: "price_drop" | "back_in_stock";
  priceDropPercent?: number;
  previousPrice?: number;
  savedAt: string;
}

export function useWatchlistUpdates() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["watchlist-updates", user?.id],
    queryFn: async () => {
      if (!user?.id) return { onSale: [], backInStock: [], totalUpdates: 0 };

      // Fetch user's favorites with filament details
      const { data: favorites, error } = await supabase
        .from("user_favorites")
        .select(`
          id,
          filament_id,
          created_at,
          filament:filaments(
            id,
            product_title,
            vendor,
            material,
            featured_image,
            color_hex,
            variant_price,
            net_weight_g,
            variant_available
          )
        `)
        .eq("user_id", user.id);

      if (error) throw error;
      if (!favorites || favorites.length === 0) {
        return { onSale: [], backInStock: [], totalUpdates: 0 };
      }

      const filamentIds = favorites.map(f => f.filament_id);
      const thirtyDaysAgo = subDays(new Date(), 30).toISOString();

      // Fetch recent price history for favorites
      const { data: priceHistory } = await supabase
        .from("price_history")
        .select("filament_id, price, recorded_at")
        .in("filament_id", filamentIds)
        .gte("recorded_at", thirtyDaysAgo)
        .order("recorded_at", { ascending: true });

      // Calculate price drops
      const priceDrops: Record<string, { current: number; previous: number; percent: number }> = {};
      
      if (priceHistory && priceHistory.length > 0) {
        // Group by filament
        const byFilament = priceHistory.reduce((acc, ph) => {
          if (!acc[ph.filament_id]) acc[ph.filament_id] = [];
          acc[ph.filament_id].push(ph);
          return acc;
        }, {} as Record<string, typeof priceHistory>);

        // Find significant drops (>10%)
        Object.entries(byFilament).forEach(([filamentId, history]) => {
          if (history.length < 2) return;
          const oldest = history[0].price;
          const newest = history[history.length - 1].price;
          const dropPercent = ((oldest - newest) / oldest) * 100;
          
          if (dropPercent >= 10) {
            priceDrops[filamentId] = {
              current: newest,
              previous: oldest,
              percent: Math.round(dropPercent),
            };
          }
        });
      }

      const onSale: WatchlistUpdate[] = [];
      const backInStock: WatchlistUpdate[] = [];

      favorites.forEach((fav) => {
        const filament = fav.filament as any;
        if (!filament) return;

        const priceInfo = priceDrops[fav.filament_id];
        
        if (priceInfo) {
          onSale.push({
            id: fav.id,
            filament_id: fav.filament_id,
            product_title: filament.product_title,
            vendor: filament.vendor,
            material: filament.material,
            featured_image: filament.featured_image,
            color_hex: filament.color_hex,
            current_price: filament.variant_price,
            net_weight_g: filament.net_weight_g,
            variant_available: filament.variant_available,
            updateType: "price_drop",
            priceDropPercent: priceInfo.percent,
            previousPrice: priceInfo.previous,
            savedAt: fav.created_at,
          });
        }

        // Check back in stock (available now, might have been unavailable)
        if (filament.variant_available === true) {
          // We'd need to track availability history for accurate "back in stock"
          // For now, just check if it's available
        }
      });

      return {
        onSale,
        backInStock,
        totalUpdates: onSale.length + backInStock.length,
      };
    },
    enabled: !!user?.id,
    staleTime: 1000 * 60 * 5,
  });
}
