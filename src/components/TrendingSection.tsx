import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { getFilamentUrl } from "@/lib/filamentUrl";
import { supabase } from "@/integrations/supabase/client";
import { useRegion } from "@/contexts/RegionContext";
import { ScrollCarousel, ScrollCarouselItem } from "@/components/ui/scroll-carousel";
import { Skeleton } from "@/components/ui/skeleton";
import { normalizeColorHex } from "@/lib/utils";
import { getOptimizedImageUrl } from "@/utils/imageOptimization";
import { ImageWithFallback } from "@/components/ui/ImageWithFallback";
import { SectionError } from "@/components/ui/SectionError";
import { withRetry } from "@/lib/retry";
import { MaterialBadge } from "@/components/MaterialBadge";

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
  product_handle?: string | null;
}

function useTrendingFilaments(regionCode: string) {
  return useQuery({
    queryKey: ["trending-filaments", regionCode],
    queryFn: () => withRetry(async (): Promise<TrendingFilament[]> => {
      const { data: regional, error: regionalError } = await supabase
        .from("filament_listings")
        .select(`
          filament_id,
          current_price,
          filaments!inner (
            id, product_title, vendor, material, color_hex,
            variant_price, featured_image, product_url, net_weight_g,
            product_handle
          )
        `)
        .eq("region", regionCode)
        .eq("available", true)
        .not("current_price", "is", null)
        .order("current_price", { ascending: true })
        .limit(8);

      if (!regionalError && regional && regional.length >= 4) {
        const seen = new Set<string>();
        const brandCount = new Map<string, number>();
        const results: TrendingFilament[] = [];
        for (const row of regional) {
          const f = row.filaments as any;
          if (!f || seen.has(f.id)) continue;
          const vendor = (f.vendor || "Unknown").toLowerCase();
          if ((brandCount.get(vendor) || 0) >= 2) continue;
          seen.add(f.id);
          brandCount.set(vendor, (brandCount.get(vendor) || 0) + 1);
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

      const { data, error } = await supabase
        .from("filaments")
        .select(
          "id, product_title, vendor, material, color_hex, variant_price, featured_image, product_url, net_weight_g, product_handle"
        )
        .not("variant_price", "is", null)
        .not("color_hex", "is", null)
        .order("value_score", { ascending: false })
        .limit(20);
      if (error) throw error;
      const brandCount = new Map<string, number>();
      const filtered: TrendingFilament[] = [];
      for (const f of (data || []) as TrendingFilament[]) {
        const vendor = (f.vendor || "Unknown").toLowerCase();
        if ((brandCount.get(vendor) || 0) >= 2) continue;
        brandCount.set(vendor, (brandCount.get(vendor) || 0) + 1);
        filtered.push(f);
        if (filtered.length >= 8) break;
      }
      return filtered;
    }, { maxRetries: 2 }),
    staleTime: 5 * 60 * 1000,
    gcTime: 15 * 60 * 1000,
  });
}

function getRankStyle(index: number) {
  if (index === 0) return "text-2xl font-black text-cyan-400/80";
  if (index === 1) return "text-xl font-bold text-cyan-400/60";
  return "text-lg font-semibold text-gray-500/60";
}

function getTrendBadge(index: number) {
  if (index < 2)
    return { emoji: "🔥", label: "Most Viewed", classes: "bg-orange-500/20 text-orange-300 border border-orange-500/30" };
  if (index < 4)
    return { emoji: "📈", label: "Rising", classes: "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30" };
  return { emoji: "⭐", label: "Popular", classes: "bg-cyan-500/20 text-cyan-300 border border-cyan-500/30" };
}

function TrendingCard({ filament, index }: { filament: TrendingFilament; index: number }) {
  const { formatPrice } = useRegion();
  const colorHex = normalizeColorHex(filament.color_hex);
  const price = filament.variant_price ? formatPrice(filament.variant_price) : null;
  const hasImage = !!filament.featured_image;
  const badge = getTrendBadge(index);

  let name = filament.product_title || "";
  if (filament.vendor && name.toLowerCase().startsWith(filament.vendor.toLowerCase())) {
    name = name.slice(filament.vendor.length).replace(/^[:\-]\s*/, "").trim();
  }

  return (
    <Link
      to={getFilamentUrl(filament)}
      className="group/card relative block shrink-0 w-[220px] bg-card/60 border border-border/40 rounded-xl p-3 hover:bg-card hover:border-primary/30 hover:shadow-lg hover:shadow-cyan-500/10 hover:scale-[1.03] transition-all duration-150 ease-out cursor-pointer"
    >
      {/* Rank number */}
      <span className={`absolute top-2 left-2 z-10 ${getRankStyle(index)} leading-none select-none sm:text-inherit`} style={{ fontSize: index > 1 ? undefined : undefined }}>
        #{index + 1}
      </span>

      <div className="flex gap-3">
        {/* Thumbnail area with color swatch badge */}
        <div className="relative flex-shrink-0 mt-1">
          <div className="w-14 h-14 rounded-lg overflow-hidden">
            <ImageWithFallback
              src={filament.featured_image ? getOptimizedImageUrl(filament.featured_image, 112) : null}
              alt={`${filament.vendor || ''} ${name} ${filament.material || ''} filament spool`.trim()}
              type="filament"
              colorHex={colorHex}
              material={filament.material}
              aspectRatio="1/1"
              className="object-contain"
            />
          </div>
          {/* Color swatch badge overlapping top-left */}
          {hasImage && (
            <div
              className="absolute -top-1 -left-1 w-5 h-5 rounded-full ring-2 ring-background"
              style={{ backgroundColor: colorHex }}
            />
          )}
        </div>

        {/* Text content */}
        <div className="flex-1 min-w-0 flex flex-col pt-4">
          <span className="text-sm font-medium text-foreground/90 group-hover/card:text-foreground transition-colors duration-150 line-clamp-2 leading-tight">
            {name}
          </span>
          <span className="text-xs text-muted-foreground truncate mt-0.5">
            {filament.vendor}
          </span>
          {/* Material badge */}
          {filament.material && (
            <div className="mt-1">
              <span className="inline-block text-[10px] font-medium px-1.5 py-0.5 rounded bg-muted text-muted-foreground">
                {filament.material}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Bottom row: trending badge + price */}
      <div className="flex items-center justify-between mt-2.5 gap-2">
        <span className={`inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-full whitespace-nowrap ${badge.classes}`}>
          {badge.emoji} {badge.label}
        </span>
        {price && (
          <span className="text-sm font-bold text-primary group-hover/card:text-primary/90 transition-colors duration-150 whitespace-nowrap">
            <span className="text-muted-foreground text-[10px] font-normal">From </span>{price}
          </span>
        )}
      </div>

      {/* Hover detail line */}
      <div className="h-0 group-hover/card:h-5 overflow-hidden transition-all duration-150 ease-out">
        <p className="text-[11px] text-muted-foreground mt-1 opacity-0 group-hover/card:opacity-100 transition-opacity duration-150">
          {index < 2 ? "Lowest price this month" : "Available at multiple stores"}
        </p>
      </div>
    </Link>
  );
}

export function TrendingSection() {
  const { regionConfig, region } = useRegion();
  const { data: filaments, isLoading, isError, refetch } = useTrendingFilaments(region);

  if (!isLoading && !isError && (!filaments || filaments.length === 0)) return null;

  return (
    <section id="trending-section" className="max-w-7xl mx-auto px-4 py-4">
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div>
          <h2 className="text-xl font-bold text-foreground">
            🔥 Trending in {regionConfig.name}
          </h2>
          <p className="text-sm text-muted-foreground mt-0.5">
            Based on what makers in your region are viewing this week
          </p>
        </div>
        <Link
          to="/?sort=popular"
          className="shrink-0 mt-1 border border-border hover:border-primary px-3 py-1 rounded-full text-sm text-muted-foreground hover:text-primary font-semibold transition-all"
        >
          See All →
        </Link>
      </div>

      {/* Error state */}
      {isError ? (
        <SectionError
          title="Couldn't load trending filaments"
          onRetry={() => refetch()}
          compact
        />
      ) : isLoading ? (
        <div className="flex gap-4 overflow-hidden">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="shrink-0 w-[220px] h-[100px] rounded-xl" />
          ))}
        </div>
      ) : (
        <ScrollCarousel gap={12}>
          {filaments!.map((f, i) => (
            <ScrollCarouselItem key={f.id}>
              <TrendingCard filament={f} index={i} />
            </ScrollCarouselItem>
          ))}
        </ScrollCarousel>
      )}
    </section>
  );
}
