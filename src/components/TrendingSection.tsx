import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useRegion } from "@/contexts/RegionContext";
import { ScrollCarousel, ScrollCarouselItem } from "@/components/ui/scroll-carousel";
import { Skeleton } from "@/components/ui/skeleton";
import { normalizeColorHex } from "@/lib/utils";
import { getOptimizedImageUrl } from "@/utils/imageOptimization";

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

function TrendingCard({ filament }: { filament: TrendingFilament }) {
  const { formatPrice } = useRegion();
  const colorHex = normalizeColorHex(filament.color_hex);
  const price = filament.variant_price ? formatPrice(filament.variant_price) : null;
  const hasImage = !!filament.featured_image;

  let name = filament.product_title || "";
  if (filament.vendor && name.toLowerCase().startsWith(filament.vendor.toLowerCase())) {
    name = name.slice(filament.vendor.length).replace(/^[:\-]\s*/, "").trim();
  }

  return (
    <Link
      to={`/filament/${filament.id}`}
      className="group/card block shrink-0 w-[220px] bg-card/60 border border-border/40 rounded-xl p-3 hover:bg-card hover:border-primary/30 hover:shadow-lg hover:shadow-black/20 transition-all duration-150 ease-out cursor-pointer"
    >
      <div className="flex gap-3">
        {/* Thumbnail area with color swatch badge */}
        <div className="relative flex-shrink-0">
          {hasImage ? (
            <div className="w-14 h-14 rounded-lg bg-muted/30 overflow-hidden flex items-center justify-center">
              <img
                src={getOptimizedImageUrl(filament.featured_image!, 112)}
                alt={`${filament.vendor || ''} ${name} ${filament.material || ''} filament spool`.trim()}
                className="w-full h-full object-contain"
                loading="lazy"
                onError={(e) => { e.currentTarget.style.display = 'none'; }}
              />
            </div>
          ) : (
            <div
              className="w-14 h-14 rounded-lg border border-border/50"
              style={{ backgroundColor: colorHex }}
            />
          )}
          {/* Color swatch badge overlapping top-left */}
          {hasImage && (
            <div
              className="absolute -top-1 -left-1 w-5 h-5 rounded-full ring-2 ring-background"
              style={{ backgroundColor: colorHex }}
            />
          )}
        </div>

        {/* Text content */}
        <div className="flex-1 min-w-0 flex flex-col">
          <span className="text-sm font-medium text-foreground/90 group-hover/card:text-foreground transition-colors duration-150 line-clamp-2 leading-tight">
            {name}
          </span>
          <span className="text-xs text-muted-foreground truncate mt-0.5">
            {filament.vendor}
          </span>
        </div>
      </div>

      {/* Bottom row: trending badge + price */}
      <div className="flex items-center justify-between mt-2.5 gap-2">
        <span className="inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-full bg-orange-500/10 text-orange-400 whitespace-nowrap">
          🔥 Popular
        </span>
        {price && (
          <span className="text-sm font-bold text-primary group-hover/card:text-primary/90 transition-colors duration-150 whitespace-nowrap">
            <span className="text-muted-foreground text-[10px] font-normal">From </span>{price}
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
        <h2 className="text-xl font-bold text-foreground">
          🔥 Trending in {regionConfig.name}
        </h2>
        <Link
          to="/?sort=popular"
          className="text-primary text-sm font-semibold hover:underline"
        >
          See All →
        </Link>
      </div>

      {/* Carousel */}
      {isLoading ? (
        <div className="flex gap-4 overflow-hidden">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="shrink-0 w-[220px] h-[100px] rounded-xl" />
          ))}
        </div>
      ) : (
        <ScrollCarousel gap={12}>
          {filaments!.map((f) => (
            <ScrollCarouselItem key={f.id}>
              <TrendingCard filament={f} />
            </ScrollCarouselItem>
          ))}
        </ScrollCarousel>
      )}
    </section>
  );
}