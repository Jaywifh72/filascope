import { Link } from "react-router-dom";
import { ChevronRight, Clock } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollCarousel, ScrollCarouselItem } from "@/components/ui/scroll-carousel";
import { SimilarFilamentCard, type SimilarFilamentData } from "./SimilarFilamentCard";
import { useSimilarFilamentsEnhanced } from "@/hooks/useSimilarFilamentsEnhanced";
import { SimilarSortControls } from "./SimilarSortControls";
import { ConsiderInsteadBanner } from "./ConsiderInsteadBanner";
import { toBrandSlug } from "@/utils/brandSlug";
import { computePricePerKg } from "@/lib/resolveFilamentPrice";

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

function FilamentCarousel({ 
  filaments, 
  currentPricePerKg 
}: { 
  filaments: SimilarFilamentData[]; 
  currentPricePerKg?: number | null;
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
          />
        </ScrollCarouselItem>
      ))}
    </ScrollCarousel>
  );
}

export function SimilarFilamentsSection({ currentFilament }: SimilarFilamentsSectionProps) {
  const { groupedFilaments, similarFilaments, isLoading, sortOption, setSortOption } = useSimilarFilamentsEnhanced(currentFilament);

  const materialBase = currentFilament.material?.split(/[\s\-+]/)[0] || currentFilament.material || "this material";
  const brandName = currentFilament.vendor || "this brand";

  // Current product's price per kg for diff calculations
  const currentPricePerKg = currentFilament.variant_price
    ? computePricePerKg(currentFilament.variant_price, currentFilament.net_weight_g, null)
    : null;

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
            You Might Also Like
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

  return (
    <section className="py-12 md:py-16 px-4 space-y-10">
      {/* Section Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-xl md:text-2xl font-bold text-foreground">
          You Might Also Like
        </h2>
        <SimilarSortControls value={sortOption} onChange={setSortOption} />
      </div>

      {/* Consider Instead Banner */}
      <ConsiderInsteadBanner currentMaterial={currentFilament.material} />

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
          />
        </div>
      )}

      {/* Fallback: if only one group exists, still show a combined header */}
      {!hasOtherBrands && !hasSameBrand && similarFilaments.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-foreground">
              Similar Filaments
            </h3>
          </div>
          <FilamentCarousel
            filaments={similarFilaments}
            currentPricePerKg={currentPricePerKg}
          />
        </div>
      )}
    </section>
  );
}
