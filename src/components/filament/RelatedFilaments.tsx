import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toBrandSlug } from "@/utils/brandSlug";
import { normalizeColorHex } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";

interface RelatedFilament {
  id: string;
  product_title: string | null;
  vendor: string | null;
  material: string | null;
  variant_price: number | null;
  net_weight_g: number | null;
  color_hex: string | null;
  featured_image: string | null;
  transmission_distance: number | null;
  product_handle: string | null;
}

interface RelatedFilamentsProps {
  filamentId: string;
  brand: string | null;
  material: string | null;
  colorFamily: string | null;
  transmissionDistance: number | null;
}

function getFilamentHref(f: RelatedFilament): string {
  return f.product_handle ? `/filament/${f.product_handle}` : `/filament/${f.id}`;
}

function FilamentRelatedCard({ filament, badge }: { filament: RelatedFilament; badge: string }) {
  const hex = normalizeColorHex(filament.color_hex);
  const pricePerKg = filament.variant_price != null
    ? (filament.net_weight_g && filament.net_weight_g > 0
        ? (filament.variant_price / filament.net_weight_g) * 1000
        : filament.variant_price)
    : null;

  return (
    <a
      href={getFilamentHref(filament)}
      className="flex-shrink-0 w-48 group rounded-xl border border-border bg-card hover:border-primary/60 transition-all duration-200 overflow-hidden focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
      aria-label={`${filament.vendor} ${filament.product_title}`}
    >
      {/* Color + Image header */}
      <div className="relative h-28 bg-muted/40 overflow-hidden">
        {filament.featured_image ? (
          <img
            src={filament.featured_image}
            alt={filament.product_title || "Filament"}
            className="w-full h-full object-contain p-2 group-hover:scale-105 transition-transform duration-300"
            loading="lazy"
          />
        ) : (
          <div
            className="absolute inset-0 opacity-30"
            style={{ background: `radial-gradient(circle at center, ${hex}, transparent 70%)` }}
          />
        )}
        {/* Color swatch */}
        <span
          className="absolute bottom-2 right-2 w-5 h-5 rounded-full border-2 border-white/20 shadow-sm"
          style={{ backgroundColor: hex }}
          aria-hidden="true"
        />
      </div>

      {/* Info */}
      <div className="p-3 space-y-1.5">
        <Badge
          variant="outline"
          className="text-[10px] px-1.5 py-0 border-primary/30 text-primary bg-primary/10"
        >
          {badge}
        </Badge>
        <p className="text-xs text-muted-foreground leading-none truncate">
          {filament.vendor}
        </p>
        <p className="text-sm font-medium text-foreground leading-snug line-clamp-2">
          {filament.product_title}
        </p>
        <div className="flex items-center justify-between pt-0.5">
          {filament.transmission_distance != null ? (
            <span className="text-xs font-semibold text-violet-400">
              TD {filament.transmission_distance.toFixed(1)}
            </span>
          ) : (
            <span className="text-xs text-muted-foreground">{filament.material}</span>
          )}
          {pricePerKg != null && (
            <span className="text-xs text-muted-foreground">
              ${pricePerKg.toFixed(0)}/kg
            </span>
          )}
        </div>
      </div>
    </a>
  );
}

const COLS = `
  id, product_title, vendor, material, variant_price, net_weight_g,
  color_hex, featured_image, transmission_distance, product_handle
`;

export function RelatedFilaments({
  filamentId,
  brand,
  material,
  colorFamily,
  transmissionDistance,
}: RelatedFilamentsProps) {
  const [sameBrandSameMaterial, setSameBrandSameMaterial] = useState<RelatedFilament[]>([]);
  const [sameMaterialSimilarTD, setSameMaterialSimilarTD] = useState<RelatedFilament[]>([]);
  const [sameColorDifferentBrand, setSameColorDifferentBrand] = useState<RelatedFilament[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!filamentId || !material) {
      setIsLoading(false);
      return;
    }

    let cancelled = false;

    async function fetchBuckets() {
      setIsLoading(true);

      // Bucket 1: Same brand + same material
      const bucket1Promise = brand
        ? supabase
            .from("filaments")
            .select(COLS)
            .ilike("material", `${material}%`)
            .eq("vendor", brand)
            .neq("id", filamentId)
            .limit(6)
            .then(({ data }) => data ?? [])
        : Promise.resolve<RelatedFilament[]>([]);

      // Bucket 2: Same material + similar TD
      const bucket2Promise =
        transmissionDistance != null
          ? supabase
              .from("filaments")
              .select(COLS)
              .ilike("material", `${material}%`)
              .neq("id", filamentId)
              .gte("transmission_distance", transmissionDistance - 0.5)
              .lte("transmission_distance", transmissionDistance + 0.5)
              .neq("vendor", brand ?? "")
              .limit(6)
              .then(({ data }) => data ?? [])
          : supabase
              .from("filaments")
              .select(COLS)
              .ilike("material", `${material}%`)
              .neq("id", filamentId)
              .neq("vendor", brand ?? "")
              .not("transmission_distance", "is", null)
              .limit(6)
              .then(({ data }) => data ?? []);

      // Bucket 3: Same color family + same material, different brand
      const bucket3Promise =
        colorFamily
          ? supabase
              .from("filaments")
              .select(COLS)
              .ilike("material", `${material}%`)
              .eq("color_family", colorFamily)
              .neq("id", filamentId)
              .neq("vendor", brand ?? "")
              .limit(6)
              .then(({ data }) => data ?? [])
          : Promise.resolve<RelatedFilament[]>([]);

      const [b1, b2, b3] = await Promise.all([bucket1Promise, bucket2Promise, bucket3Promise]);

      if (cancelled) return;

      // Deduplicate across buckets, take 2 from each
      const seen = new Set<string>([filamentId]);
      const pickUnique = (list: RelatedFilament[], limit: number) => {
        const result: RelatedFilament[] = [];
        for (const f of list) {
          if (!seen.has(f.id) && result.length < limit) {
            seen.add(f.id);
            result.push(f);
          }
        }
        return result;
      };

      setSameBrandSameMaterial(pickUnique(b1, 2));
      setSameMaterialSimilarTD(pickUnique(b2, 2));
      setSameColorDifferentBrand(pickUnique(b3, 2));
      setIsLoading(false);
    }

    fetchBuckets();
    return () => { cancelled = true; };
  }, [filamentId, material, brand, colorFamily, transmissionDistance]);

  const allRelated = [
    ...sameBrandSameMaterial.map(f => ({ filament: f, badge: `More ${material} from ${brand}` })),
    ...sameMaterialSimilarTD.map(f => ({ filament: f, badge: `Similar TD Value` })),
    ...sameColorDifferentBrand.map(f => ({ filament: f, badge: `Same Color, Different Brand` })),
  ];

  if (!isLoading && allRelated.length === 0) return null;

  return (
    <section className="mt-8 mb-4" aria-label={`Similar ${material} Filaments`}>
      <h2 className="text-lg font-semibold text-foreground mb-4">
        Similar {material} Filaments
      </h2>

      <div className="overflow-x-auto pb-2 -mx-1 px-1">
        <div className="flex gap-3" style={{ width: "max-content" }}>
          {isLoading
            ? Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} className="w-48 h-56 rounded-xl flex-shrink-0" />
              ))
            : allRelated.map(({ filament, badge }) => (
                <FilamentRelatedCard
                  key={filament.id}
                  filament={filament}
                  badge={badge}
                />
              ))}
        </div>
      </div>
    </section>
  );
}
