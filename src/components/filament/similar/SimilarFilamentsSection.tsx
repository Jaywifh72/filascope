import { useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { ChevronRight, Clock } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollCarousel, ScrollCarouselItem } from "@/components/ui/scroll-carousel";
import { SimilarFilamentCard, type SimilarFilamentData, type SimilarityReason } from "./SimilarFilamentCard";
import { useSimilarFilamentsEnhanced } from "@/hooks/useSimilarFilamentsEnhanced";
import { SimilarSortControls } from "./SimilarSortControls";
import { ConsiderInsteadBanner } from "./ConsiderInsteadBanner";
import { toBrandSlug } from "@/utils/brandSlug";
import { computePricePerKg } from "@/lib/resolveFilamentPrice";
import { cn } from "@/lib/utils";

interface CurrentFilament {
  id: string;
  product_title: string;
  vendor: string | null;
  material: string | null;
  variant_price: number | null;
  net_weight_g: number | null;
  color_family: string | null;
  color_hex: string | null;
  featured_image: string | null;
  nozzle_temp_min_c: number | null;
  nozzle_temp_max_c: number | null;
  ease_of_printing_score: number | null;
  finish_type?: string | null;
  carbon_fiber_percentage?: number | null;
  glass_fiber_percentage?: number | null;
  high_speed_capable?: boolean | null;
  is_nozzle_abrasive?: boolean | null;
  diameter_nominal_mm?: number | null;
}

interface SimilarFilamentsSectionProps {
  currentFilament: CurrentFilament;
}

type CategoryFilter = "all" | "same_material" | "same_brand" | "same_color" | "similar_price";

const CATEGORY_FILTERS: { id: CategoryFilter; label: string }[] = [
  { id: "all", label: "All" },
  { id: "same_material", label: "Same Material" },
  { id: "same_brand", label: "Same Brand" },
  { id: "same_color", label: "Same Color" },
  { id: "similar_price", label: "Similar Price" },
];

function FilamentCarousel({ 
  filaments, 
  currentPricePerKg,
  currentColorHex,
}: { 
  filaments: SimilarFilamentData[]; 
  currentPricePerKg?: number | null;
  currentColorHex?: string | null;
}) {
  if (filaments.length === 0) return null;

  return (
    <ScrollCarousel>
      {filaments.map((filament) => (
        <ScrollCarouselItem key={filament.id}>
          <SimilarFilamentCard
            filament={filament}
            showCompareToggle={!filament.isCurrent}
            currentPricePerKg={currentPricePerKg}
            showColorSwatch={filament.similarityReason === "same_color"}
          />
        </ScrollCarouselItem>
      ))}
    </ScrollCarousel>
  );
}

export function SimilarFilamentsSection({ currentFilament }: SimilarFilamentsSectionProps) {
  const { groupedFilaments, similarFilaments, isLoading, sortOption, setSortOption } = useSimilarFilamentsEnhanced(currentFilament);
  const [activeCategory, setActiveCategory] = useState<CategoryFilter>("all");

  const materialBase = currentFilament.material?.split(/[\s\-+]/)[0] || currentFilament.material || "this material";
  const brandName = currentFilament.vendor || "this brand";

  const currentPricePerKg = currentFilament.variant_price
    ? computePricePerKg(currentFilament.variant_price, currentFilament.net_weight_g, null)
    : null;

  // Filter filaments by active category
  const filteredFilaments = useMemo(() => {
    if (activeCategory === "all") return similarFilaments;
    return similarFilaments.filter(f => f.similarityReason === activeCategory);
  }, [similarFilaments, activeCategory]);

  // Count per category for showing availability
  const categoryCounts = useMemo(() => {
    const counts: Record<CategoryFilter, number> = {
      all: similarFilaments.length,
      same_material: 0,
      same_brand: 0,
      same_color: 0,
      similar_price: 0,
    };
    for (const f of similarFilaments) {
      if (f.similarityReason && f.similarityReason in counts) {
        counts[f.similarityReason as CategoryFilter]++;
      }
    }
    return counts;
  }, [similarFilaments]);

  // Loading state
  if (isLoading) {
    return (
      <section className="py-12 md:py-16 px-4">
        <div className="flex items-center justify-between mb-6 md:mb-8">
          <Skeleton className="h-7 w-48" />
          <Skeleton className="h-5 w-20" />
        </div>
        <div className="flex gap-4 overflow-hidden">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="w-[240px] h-[360px] rounded-xl flex-shrink-0" />
          ))}
        </div>
      </section>
    );
  }

  // Empty state
  if (similarFilaments.length === 0) {
    return (
      <section className="py-12 md:py-16 px-4">
        <div className="flex items-center justify-between mb-6 md:mb-8">
          <h2 className="text-xl md:text-2xl font-bold text-foreground">
            Explore Similar Options
          </h2>
        </div>
        <div className="flex flex-col items-center justify-center py-12 text-center bg-card/30 rounded-xl border border-border/50">
          <Clock className="w-10 h-10 text-muted-foreground mb-4" />
          <p className="text-muted-foreground mb-4">
            No similar filaments found for this material.
          </p>
          <Link
            to="/materials"
            className="text-sm text-primary hover:text-primary/80 font-medium inline-flex items-center gap-1 transition-colors"
          >
            Browse all materials
            <ChevronRight className="h-4 w-4" />
          </Link>
        </div>
      </section>
    );
  }

  const hasOtherBrands = groupedFilaments.otherBrandsSameMaterial.length > 0;
  const hasSameBrand = groupedFilaments.sameBrandOtherMaterial.length > 0;
  const showGroupedView = activeCategory === "all" && (hasOtherBrands || hasSameBrand);

  return (
    <section className="py-12 md:py-16 px-4 space-y-8">
      {/* Section Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl md:text-2xl font-bold text-foreground">
            Explore Similar Options
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            Based on material, brand, and color matching
          </p>
        </div>
        <SimilarSortControls value={sortOption} onChange={setSortOption} />
      </div>

      {/* Category Filter Pills */}
      <div className="flex gap-2 flex-wrap">
        {CATEGORY_FILTERS.map((cat) => {
          const count = categoryCounts[cat.id];
          const isActive = activeCategory === cat.id;
          // Hide categories with 0 items (except "all")
          if (cat.id !== "all" && count === 0) return null;
          return (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              className={cn(
                "text-xs px-3 py-1.5 rounded-full border transition-colors duration-150",
                isActive
                  ? "bg-primary/15 text-primary border-primary/30"
                  : "bg-card text-muted-foreground border-border hover:text-foreground hover:border-border"
              )}
            >
              {cat.label}
              {cat.id !== "all" && count > 0 && (
                <span className="ml-1 text-muted-foreground">({count})</span>
              )}
            </button>
          );
        })}
      </div>

      {/* Consider Instead Banner */}
      {activeCategory === "all" && (
        <ConsiderInsteadBanner currentMaterial={currentFilament.material} />
      )}

      {/* Grouped view (only in "All" mode) */}
      {showGroupedView ? (
        <div className="space-y-10">
          {/* Other brands, same material */}
          {hasOtherBrands && (
            <div>
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-foreground">
                  Similar {materialBase} From Other Brands
                </h3>
                <Link
                  to={`/?material=${encodeURIComponent(currentFilament.material || "")}`}
                  className="text-sm text-primary hover:text-primary/80 font-medium inline-flex items-center gap-1 transition-colors"
                >
                  View All
                  <ChevronRight className="h-4 w-4" />
                </Link>
              </div>
              <FilamentCarousel
                filaments={groupedFilaments.otherBrandsSameMaterial}
                currentPricePerKg={currentPricePerKg}
                currentColorHex={currentFilament.color_hex}
              />
            </div>
          )}

          {/* Same brand, other materials */}
          {hasSameBrand && (
            <div>
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-foreground">
                  More From {brandName}
                </h3>
                <Link
                  to={`/brands/${toBrandSlug(currentFilament.vendor || '')}`}
                  className="text-sm text-primary hover:text-primary/80 font-medium inline-flex items-center gap-1 transition-colors"
                >
                  All Products
                  <ChevronRight className="h-4 w-4" />
                </Link>
              </div>
              <FilamentCarousel
                filaments={groupedFilaments.sameBrandOtherMaterial}
                currentPricePerKg={currentPricePerKg}
                currentColorHex={currentFilament.color_hex}
              />
            </div>
          )}
        </div>
      ) : (
        /* Filtered view */
        <div>
          {filteredFilaments.length > 0 ? (
            <FilamentCarousel
              filaments={filteredFilaments}
              currentPricePerKg={currentPricePerKg}
              currentColorHex={currentFilament.color_hex}
            />
          ) : (
            <div className="flex flex-col items-center justify-center py-10 text-center bg-card/30 rounded-xl border border-dashed border-border/50">
              <p className="text-sm text-muted-foreground">
                No {CATEGORY_FILTERS.find(c => c.id === activeCategory)?.label.toLowerCase()} filaments found yet
              </p>
            </div>
          )}
        </div>
      )}

      {/* Fallback: if only one group and in "all" mode */}
      {activeCategory === "all" && !hasOtherBrands && !hasSameBrand && similarFilaments.length > 0 && (
        <div>
          <FilamentCarousel
            filaments={similarFilaments}
            currentPricePerKg={currentPricePerKg}
            currentColorHex={currentFilament.color_hex}
          />
        </div>
      )}
    </section>
  );
}
