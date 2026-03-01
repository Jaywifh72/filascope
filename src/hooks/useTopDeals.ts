import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { withRetry } from "@/lib/retry";

export interface TopDeal {
  id: string;
  product_title: string;
  vendor: string | null;
  material: string | null;
  featured_image: string | null;
  variant_price: number | null;
  net_weight_g: number | null;
  product_url: string | null;
  previous_price: number;
  current_price: number;
  savings_percent: number;
  savings_amount: number;
  price_per_kg: number;
}

export function useTopDeals() {
  return useQuery({
    queryKey: ["top-deals"],
    queryFn: () => withRetry(async () => {
      // Get filaments with prices (excluding small/sample spools)
      const { data: filaments, error: filamentsError } = await supabase
        .from("filaments")
        .select("id, product_title, vendor, material, featured_image, variant_price, net_weight_g, product_url")
        .not("variant_price", "is", null)
        .gt("variant_price", 0)
        .or("net_weight_g.is.null,net_weight_g.gte.300") // Exclude small/sample spools
        .order("updated_at", { ascending: false })
        .limit(200);

      if (filamentsError) throw filamentsError;
      if (!filaments || filaments.length === 0) return [];

      // Get price history for these filaments (last 30 days)
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const filamentIds = filaments.map((f) => f.id);
      const { data: priceHistory, error: priceError } = await supabase
        .from("price_history")
        .select("filament_id, price, recorded_at")
        .in("filament_id", filamentIds)
        .gte("recorded_at", thirtyDaysAgo.toISOString())
        .order("recorded_at", { ascending: true });

      if (priceError) throw priceError;

      // Calculate price drops
      const deals: TopDeal[] = [];

      for (const filament of filaments) {
        if (!filament.variant_price) continue;

        const history = priceHistory?.filter((h) => h.filament_id === filament.id) || [];
        if (history.length === 0) continue;

        // Get the highest price in the last 30 days
        const maxPrice = Math.max(...history.map((h) => h.price));
        const currentPrice = filament.variant_price;

        if (maxPrice > currentPrice) {
          const savingsAmount = maxPrice - currentPrice;
          const savingsPercent = (savingsAmount / maxPrice) * 100;

          // Only include if 15%+ drop
          if (savingsPercent >= 15) {
            const weightKg = (filament.net_weight_g || 1000) / 1000;
            deals.push({
              id: filament.id,
              product_title: filament.product_title,
              vendor: filament.vendor,
              material: filament.material,
              featured_image: filament.featured_image,
              variant_price: filament.variant_price,
              net_weight_g: filament.net_weight_g,
              product_url: filament.product_url,
              previous_price: maxPrice,
              current_price: currentPrice,
              savings_percent: Math.round(savingsPercent),
              savings_amount: Math.round(savingsAmount * 100) / 100,
              price_per_kg: Math.round((currentPrice / weightKg) * 100) / 100,
            });
          }
        }
      }

      // Sort by savings percent and return top 3
      return deals.sort((a, b) => b.savings_percent - a.savings_percent).slice(0, 3);
    }, { maxRetries: 2 }),
    staleTime: 1000 * 60 * 30, // 30 minute cache
  });
}
