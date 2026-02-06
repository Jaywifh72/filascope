import { Link } from "react-router-dom";
import { ChevronRight, Clock } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselPrevious,
  CarouselNext,
} from "@/components/ui/carousel";
import { SimilarFilamentCard, type SimilarFilamentData } from "./SimilarFilamentCard";
import { useSimilarFilamentsEnhanced } from "@/hooks/useSimilarFilamentsEnhanced";

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
}

interface SimilarFilamentsSectionProps {
  currentFilament: CurrentFilament;
}

function FilamentCarousel({ filaments, showCurrent }: { filaments: SimilarFilamentData[]; showCurrent?: boolean }) {
  const items = showCurrent ? filaments : filaments;
  if (items.length === 0) return null;

  return (
    <Carousel
      opts={{ align: "start", loop: false }}
      className="w-full"
    >
      <CarouselContent className="-ml-3 md:-ml-4">
        {items.map((filament) => (
          <CarouselItem
            key={filament.id}
            className="pl-3 md:pl-4 basis-auto"
          >
            <SimilarFilamentCard
              filament={filament}
              showCompareToggle={!filament.isCurrent}
            />
          </CarouselItem>
        ))}
      </CarouselContent>
      <CarouselPrevious className="hidden md:flex -left-4 lg:-left-6 h-10 w-10 bg-card/80 border-border hover:bg-card" />
      <CarouselNext className="hidden md:flex -right-4 lg:-right-6 h-10 w-10 bg-card/80 border-border hover:bg-card" />
    </Carousel>
  );
}

export function SimilarFilamentsSection({ currentFilament }: SimilarFilamentsSectionProps) {
  const { groupedFilaments, similarFilaments, isLoading } = useSimilarFilamentsEnhanced(currentFilament);

  const materialBase = currentFilament.material?.split(/[\s\-+]/)[0] || currentFilament.material || "this material";
  const brandName = currentFilament.vendor || "this brand";

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
            Similar Filaments
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
      {/* Other brands, same material */}
      {hasOtherBrands && (
        <div>
          <div className="flex items-center justify-between mb-6 md:mb-8">
            <h2 className="text-xl md:text-2xl font-bold text-foreground">
              Similar {materialBase} From Other Brands
            </h2>
            <Link
              to={`/materials?material=${encodeURIComponent(currentFilament.material || "")}`}
              className="text-sm text-primary hover:text-primary/80 font-medium inline-flex items-center gap-1 transition-colors"
            >
              View All
              <ChevronRight className="h-4 w-4" />
            </Link>
          </div>
          <FilamentCarousel filaments={groupedFilaments.otherBrandsSameMaterial} />
        </div>
      )}

      {/* Same brand, other materials */}
      {hasSameBrand && (
        <div>
          <div className="flex items-center justify-between mb-6 md:mb-8">
            <h2 className="text-xl md:text-2xl font-bold text-foreground">
              Other {brandName} Materials
            </h2>
            <Link
              to={`/brands/${encodeURIComponent((currentFilament.vendor || "").toLowerCase().replace(/\s+/g, "-"))}`}
              className="text-sm text-primary hover:text-primary/80 font-medium inline-flex items-center gap-1 transition-colors"
            >
              All Products
              <ChevronRight className="h-4 w-4" />
            </Link>
          </div>
          <FilamentCarousel filaments={groupedFilaments.sameBrandOtherMaterial} />
        </div>
      )}

      {/* Fallback: if only one group exists, still show a combined header */}
      {!hasOtherBrands && !hasSameBrand && similarFilaments.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-6 md:mb-8">
            <h2 className="text-xl md:text-2xl font-bold text-foreground">
              Similar Filaments
            </h2>
          </div>
          <FilamentCarousel filaments={similarFilaments} />
        </div>
      )}
    </section>
  );
}
