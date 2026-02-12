import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { TrendingUp } from "lucide-react";
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

function useTrendingFilaments() {
  return useQuery({
    queryKey: ["trending-filaments"],
    queryFn: async (): Promise<TrendingFilament[]> => {
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

  // Extract short name: strip vendor prefix
  let name = filament.product_title || "";
  if (filament.vendor && name.toLowerCase().startsWith(filament.vendor.toLowerCase())) {
    name = name.slice(filament.vendor.length).replace(/^[:\-]\s*/, "").trim();
  }

  return (
    <Link
      to={`/filament/${filament.id}`}
      className="block shrink-0 w-[200px] bg-slate-800/60 border border-slate-700/40 rounded-lg p-3 hover:border-cyan-500/30 hover:scale-[1.02] transition-all duration-200 cursor-pointer"
    >
      <div className="flex items-center gap-2 mb-2">
        <div
          className="w-3 h-3 rounded-full border border-border/50 flex-shrink-0"
          style={{ backgroundColor: colorHex }}
        />
        <span className="text-sm font-medium text-foreground truncate">{name}</span>
      </div>
      <div className="flex items-center justify-between">
        {price && <span className="text-sm font-bold text-cyan-400">{price}</span>}
        <span className="text-xs text-slate-500 truncate ml-auto">{filament.vendor}</span>
      </div>
    </Link>
  );
}

export function TrendingSection() {
  const { regionConfig } = useRegion();
  const { data: filaments, isLoading } = useTrendingFilaments();

  if (!isLoading && (!filaments || filaments.length === 0)) return null;

  return (
    <section className="max-w-7xl mx-auto px-4 py-3">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-cyan-400" />
          <h2 className="text-lg font-semibold text-foreground">
            Trending in {regionConfig.name}
          </h2>
        </div>
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
