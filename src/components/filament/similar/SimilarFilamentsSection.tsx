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

export function SimilarFilamentsSection({ currentFilament }: SimilarFilamentsSectionProps) {
  const { similarFilaments, isLoading } = useSimilarFilamentsEnhanced(currentFilament);

  // Build current filament card data
  const currentCard: SimilarFilamentData = {
    ...currentFilament,
    isCurrent: true,
  };

  // Combine current with similar
  const allFilaments = [currentCard, ...similarFilaments];

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

  return (
    <section className="py-12 md:py-16 px-4">
      {/* Section Header */}
      <div className="flex items-center justify-between mb-6 md:mb-8">
        <h2 className="text-xl md:text-2xl font-bold text-foreground">
          Similar Filaments
        </h2>
        <Link
          to={`/materials?material=${encodeURIComponent(currentFilament.material || "")}`}
          className="text-sm text-primary hover:text-primary/80 font-medium inline-flex items-center gap-1 transition-colors"
        >
          View All
          <ChevronRight className="h-4 w-4" />
        </Link>
      </div>

      {/* Carousel of Similar Filaments */}
      <Carousel
        opts={{
          align: "start",
          loop: false,
        }}
        className="w-full"
      >
        <CarouselContent className="-ml-3 md:-ml-4">
          {allFilaments.map((filament) => (
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

        {/* Navigation Arrows - Hidden on mobile */}
        <CarouselPrevious className="hidden md:flex -left-4 lg:-left-6 h-10 w-10 bg-card/80 border-border hover:bg-card" />
        <CarouselNext className="hidden md:flex -right-4 lg:-right-6 h-10 w-10 bg-card/80 border-border hover:bg-card" />
      </Carousel>
    </section>
  );
}
