import { useRef, useState, useCallback, useEffect } from "react";
import { Link } from "react-router-dom";
import { Search, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useEnhancedSimilarFilaments } from "@/hooks/useEnhancedSimilarFilaments";
import { SimilarMaterialCard } from "./SimilarMaterialCard";
import { useCompare } from "@/hooks/useCompare";
import { useUserPersonalization } from "@/hooks/useUserPersonalization";
import { useUserSkillLevel } from "@/hooks/useUserSkillLevel";

interface SimilarMaterialsModuleProps {
  filamentId: string;
  material: string | null | undefined;
  vendor: string | null | undefined;
  currentPricePerKg: number | null;
  currentScores: {
    ease_of_printing_score?: number | null;
    value_score?: number | null;
    strength_index?: number | null;
    printability_index?: number | null;
  };
}

export function SimilarMaterialsModule({
  filamentId,
  material,
  vendor,
  currentPricePerKg,
  currentScores,
}: SimilarMaterialsModuleProps) {
  // Get user context for personalized recommendations
  const {
    favoriteFilamentIds,
    printerSpecs,
    priceSensitivity,
    recentlyViewed,
  } = useUserPersonalization();
  const { skillLevel } = useUserSkillLevel();

  const { recommendations, isLoading } = useEnhancedSimilarFilaments(
    filamentId,
    material,
    vendor,
    currentPricePerKg,
    currentScores,
    {
      favoriteFilamentIds,
      printerSpecs,
      skillLevel,
      priceSensitivity,
      limit: 6,
    }
  );
  const { addItem } = useCompare();

  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);

  const updateScrollState = useCallback(() => {
    if (!scrollRef.current) return;
    const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
    setCanScrollLeft(scrollLeft > 10);
    setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 10);

    // Calculate current index for dots
    const cardWidth = 296; // 280px + 16px gap
    const index = Math.round(scrollLeft / cardWidth);
    setCurrentIndex(index);
  }, []);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    el.addEventListener("scroll", updateScrollState);
    updateScrollState();
    return () => el.removeEventListener("scroll", updateScrollState);
  }, [updateScrollState, recommendations]);

  const scroll = (direction: "left" | "right") => {
    if (!scrollRef.current) return;
    const cardWidth = 296;
    const scrollAmount = direction === "left" ? -cardWidth : cardWidth;
    scrollRef.current.scrollBy({ left: scrollAmount, behavior: "smooth" });
  };

  const handleSeeFullComparison = () => {
    // Add recommendations to compare
    recommendations.slice(0, 3).forEach((rec) => {
      addItem({
        id: rec.id,
        product_title: rec.product_title,
        vendor: rec.vendor,
        material: rec.material,
        color_hex: null,
        variant_price: rec.variant_price,
        net_weight_g: rec.net_weight_g,
        featured_image: rec.featured_image,
      });
    });
  };

  if (isLoading) {
    return (
      <div className="my-10 rounded-2xl border border-primary/15 bg-primary/[0.03] p-6 md:p-8">
        <div className="mb-6 flex items-center gap-3">
          <Skeleton className="h-6 w-6" />
          <Skeleton className="h-6 w-48" />
        </div>
        <div className="flex gap-4 overflow-hidden">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-[380px] w-[280px] flex-shrink-0 rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  if (recommendations.length === 0) {
    return null;
  }

  return (
    <div className="my-10 rounded-2xl border border-primary/15 bg-primary/[0.03] p-6 md:p-8">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-3">
          <Search className="h-6 w-6 text-primary" />
          <h3 className="text-xl font-semibold text-primary md:text-2xl">
            Compare Similar Materials
          </h3>
        </div>
        <p className="mt-1 text-sm text-muted-foreground">
          Personalized recommendations based on your preferences
        </p>
      </div>

      {/* Carousel */}
      <div className="relative">
        {/* Left Arrow */}
        {canScrollLeft && (
          <Button
            variant="ghost"
            size="icon"
            onClick={() => scroll("left")}
            className="absolute -left-3 top-1/2 z-10 h-10 w-10 -translate-y-1/2 rounded-full bg-background/80 shadow-lg backdrop-blur-sm hover:bg-primary/20 md:-left-5"
          >
            <ChevronLeft className="h-5 w-5" />
          </Button>
        )}

        {/* Cards Container */}
        <div
          ref={scrollRef}
          className="scrollbar-hide flex gap-4 overflow-x-auto scroll-smooth pb-4 snap-x snap-mandatory"
          style={{ scrollSnapType: "x mandatory" }}
        >
          {recommendations.map((rec) => (
            <div key={rec.id} className="snap-start">
              <SimilarMaterialCard filament={rec} currentScores={currentScores} />
            </div>
          ))}
        </div>

        {/* Right Arrow */}
        {canScrollRight && (
          <Button
            variant="ghost"
            size="icon"
            onClick={() => scroll("right")}
            className="absolute -right-3 top-1/2 z-10 h-10 w-10 -translate-y-1/2 rounded-full bg-background/80 shadow-lg backdrop-blur-sm hover:bg-primary/20 md:-right-5"
          >
            <ChevronRight className="h-5 w-5" />
          </Button>
        )}
      </div>

      {/* Dot Indicators */}
      {recommendations.length > 3 && (
        <div className="mt-4 flex justify-center gap-1.5">
          {recommendations.map((_, idx) => (
            <button
              key={idx}
              onClick={() => {
                if (!scrollRef.current) return;
                scrollRef.current.scrollTo({
                  left: idx * 296,
                  behavior: "smooth",
                });
              }}
              className={`h-2 w-2 rounded-full transition-colors ${
                idx === currentIndex ? "bg-primary" : "bg-primary/30"
              }`}
            />
          ))}
        </div>
      )}

      {/* Footer CTA */}
      <div className="mt-6 flex justify-center border-t border-border/50 pt-4">
        <Link
          to="/compare"
          onClick={handleSeeFullComparison}
          className="text-sm font-medium text-primary hover:underline"
        >
          See full comparison table →
        </Link>
      </div>
    </div>
  );
}
