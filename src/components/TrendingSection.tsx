import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useRegion } from "@/contexts/RegionContext";
import { ScrollCarousel, ScrollCarouselItem } from "@/components/ui/scroll-carousel";
import { Skeleton } from "@/components/ui/skeleton";
import { normalizeColorHex } from "@/lib/utils";

interface TrendingFilament {
  id: string;
  product_title: string;
  vendor: string | null;
  material: string | null;
  color_hex: string | null;
  variant_price: number | null;
  featured_image: string | null;
  product_url: string | null;
  net_weight_g: number | null;
}

function useTrendingFilaments(regionCode: string) {
  return useQuery({
    queryKey: ["trending-filaments", regionCode],
    queryFn: async (): Promise<TrendingFilament[]> => {
      // Primary: filaments with available listings in the user's region
      const { data: regional, error: regionalError } = await supabase
        .from("filament_listings")
        .select(`
          filament_id,
          current_price,
          filaments!inner (
            id, product_title, vendor, material, color_hex,
            variant_price, featured_image, product_url, net_weight_g
          )
        `)
        .eq("region", regionCode)
        .eq("available", true)
        .not("current_price", "is", null)
        .order("current_price", { ascending: true })
        .limit(8);

      if (!regionalError && regional && regional.length >= 4) {
        // Deduplicate by filament_id, keep cheapest
        const seen = new Set<string>();
        const results: TrendingFilament[] = [];
        for (const row of regional) {
          const f = row.filaments as any;
          if (!f || seen.has(f.id)) continue;
          seen.add(f.id);
          results.push({
            id: f.id,
            product_title: f.product_title,
            vendor: f.vendor,
            material: f.material,
            color_hex: f.color_hex,
            variant_price: row.current_price ?? f.variant_price,
            featured_image: f.featured_image,
            product_url: f.product_url,
            net_weight_g: f.net_weight_g,
          });
          if (results.length >= 8) break;
        }
        if (results.length >= 4) return results;
      }

      // Fallback: global value_score
      const { data, error } = await supabase
        .from("filaments")
        .select(
          "id, product_title, vendor, material, color_hex, variant_price, featured_image, product_url, net_weight_g"
        )
        .not("variant_price", "is", null)
        .not("color_hex", "is", null)
        .order("value_score", { ascending: false })
        .limit(8);
      if (error) throw error;
      return (data || []) as TrendingFilament[];
    },
    staleTime: 5 * 60 * 1000,
    gcTime: 15 * 60 * 1000,
  });
}

function MiniFilamentCard({ filament }: { filament: TrendingFilament }) {
  const { formatPrice } = useRegion();
  const colorHex = normalizeColorHex(filament.color_hex);
  const price = filament.variant_price ? formatPrice(filament.variant_price) : null;

  let name = filament.product_title || "";
  if (filament.vendor && name.toLowerCase().startsWith(filament.vendor.toLowerCase())) {
    name = name.slice(filament.vendor.length).replace(/^[:\-]\s*/, "").trim();
  }

  return (
    <Link
      to={`/filament/${filament.id}`}
      className="group/card block shrink-0 w-[200px] bg-white/5 border border-white/10 rounded-lg p-3 hover:bg-white/10 hover:border-cyan-500/30 transition-all duration-150 cursor-pointer"
    >
      <div className="flex items-center gap-2 mb-1">
        <div
          className="w-4 h-4 rounded-full ring-1 ring-white/20 flex-shrink-0"
          style={{ backgroundColor: colorHex }}
        />
        <span className="text-sm font-medium text-slate-200 group-hover/card:text-white transition-colors duration-150 truncate">{name}</span>
      </div>
      <div className="text-xs text-gray-400 truncate mb-2">{filament.vendor}</div>
      <div className="flex items-center justify-between">
        {price && (
          <span className="text-sm font-bold text-cyan-400 group-hover/card:text-cyan-300 transition-colors duration-150">
            <span className="text-slate-500 text-xs font-normal">From </span>{price}
          </span>
        )}
      </div>
    </Link>
  );
}

export function TrendingSection() {
  const { regionConfig, region } = useRegion();
  const { data: filaments, isLoading } = useTrendingFilaments(region);

  if (!isLoading && (!filaments || filaments.length === 0)) return null;

  return (
    <section className="max-w-7xl mx-auto px-4 py-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-xl font-bold text-white">
          🔥 Trending in {regionConfig.name}
        </h2>
        <Link
          to="/?sort=popular"
          className="text-cyan-400 text-sm hover:underline"
        >
          See All →
        </Link>
      </div>

      {/* Carousel */}
      {isLoading ? (
        <div className="flex gap-4 overflow-hidden">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="shrink-0 w-[200px] h-[72px] rounded-lg" />
          ))}
        </div>
      ) : (
        <ScrollCarousel gap={12}>
          {filaments!.map((f) => (
            <ScrollCarouselItem key={f.id}>
              <MiniFilamentCard filament={f} />
            </ScrollCarouselItem>
          ))}
        </ScrollCarousel>
      )}
    </section>
  );
}