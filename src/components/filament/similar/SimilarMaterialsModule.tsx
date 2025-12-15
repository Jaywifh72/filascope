import { useRef, useState, useCallback, useEffect, useMemo } from "react";
import { Link } from "react-router-dom";
import { Search, ChevronLeft, ChevronRight, Bookmark } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useEnhancedSimilarFilaments } from "@/hooks/useEnhancedSimilarFilaments";
import { SimilarMaterialCard } from "./SimilarMaterialCard";
import { MaterialJourney, filterByTier } from "./MaterialJourney";
import { RecommendationFilters, applyRecommendationFilter, type FilterType } from "./RecommendationFilters";
import { BatchSelectControls } from "./BatchSelectControls";
import { ComparisonSuggestionTip } from "./ComparisonSuggestionTip";
import { ComparisonHistoryBanner } from "./ComparisonHistoryBanner";
import { useCompare } from "@/hooks/useCompare";
import { useComparePresets } from "@/hooks/useComparePresets";
import { useUserPersonalization } from "@/hooks/useUserPersonalization";
import { useUserSkillLevel } from "@/hooks/useUserSkillLevel";
import { toast } from "sonner";

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
    tg_c?: number | null;
  };
  currentFilament?: {
    id: string;
    product_title: string;
    vendor?: string | null;
    material?: string | null;
    featured_image?: string | null;
    variant_price?: number | null;
    net_weight_g?: number | null;
  };
}

export function SimilarMaterialsModule({
  filamentId,
  material,
  vendor,
  currentPricePerKg,
  currentScores,
  currentFilament,
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
      limit: 12, // Fetch more for filtering
    }
  );
  const { addItem } = useCompare();
  const { savePreset } = useComparePresets();

  // Filtering state
  const [activeFilter, setActiveFilter] = useState<FilterType>("all");
  const [activeTier, setActiveTier] = useState<string | null>(null);

  // Batch selection state
  const [isMultiSelectMode, setIsMultiSelectMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // Apply filters
  const filteredRecommendations = useMemo(() => {
    let result = recommendations;
    
    // Apply tier filter first
    if (activeTier) {
      result = filterByTier(result, activeTier);
    }
    
    // Apply dropdown filter
    result = applyRecommendationFilter(result, activeFilter, vendor);
    
    return result.slice(0, 6); // Limit to 6 visible
  }, [recommendations, activeFilter, activeTier, vendor]);

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
  }, [updateScrollState, filteredRecommendations]);

  // Reset scroll when filters change
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({ left: 0, behavior: "smooth" });
    }
  }, [activeFilter, activeTier]);

  const scroll = (direction: "left" | "right") => {
    if (!scrollRef.current) return;
    const cardWidth = 296;
    const scrollAmount = direction === "left" ? -cardWidth : cardWidth;
    scrollRef.current.scrollBy({ left: scrollAmount, behavior: "smooth" });
  };

  const handleSeeFullComparison = () => {
    // Add recommendations to compare
    filteredRecommendations.slice(0, 3).forEach((rec) => {
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

  const handleTierClick = (tier: string) => {
    setActiveTier(tier || null);
    // Reset dropdown filter when tier is clicked
    if (tier) {
      setActiveFilter("all");
    }
  };

  const handleToggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const handleSaveGroup = () => {
    if (!currentFilament) return;

    // Create items array including current filament + recommendations
    const items = [
      {
        id: currentFilament.id,
        product_title: currentFilament.product_title,
        vendor: currentFilament.vendor,
        material: currentFilament.material,
        color_hex: null,
        variant_price: currentFilament.variant_price,
        net_weight_g: currentFilament.net_weight_g,
        featured_image: currentFilament.featured_image,
      },
      ...filteredRecommendations.slice(0, 3).map((rec) => ({
        id: rec.id,
        product_title: rec.product_title,
        vendor: rec.vendor,
        material: rec.material,
        color_hex: null,
        variant_price: rec.variant_price,
        net_weight_g: rec.net_weight_g,
        featured_image: rec.featured_image,
      })),
    ];

    const preset = savePreset(
      `${material || "Material"} Comparison`,
      items
    );

    if (preset) {
      toast.success("Comparison saved!", {
        description: "Access it later from your saved presets",
      });
    }
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
      {/* Comparison History Banner */}
      <ComparisonHistoryBanner currentMaterial={material} />

      {/* Comparison Suggestion Tip */}
      <ComparisonSuggestionTip
        currentFilament={currentFilament}
        currentPricePerKg={currentPricePerKg}
        recommendations={recommendations}
      />

      {/* Header */}
      <div className="mb-4">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <Search className="h-6 w-6 text-primary" />
            <h3 className="text-xl font-semibold text-primary md:text-2xl">
              Compare Similar Materials
            </h3>
          </div>
          
          <div className="flex items-center gap-2">
            {/* Batch select controls */}
            <BatchSelectControls
              recommendations={filteredRecommendations}
              isMultiSelectMode={isMultiSelectMode}
              onToggleMode={() => {
                setIsMultiSelectMode(!isMultiSelectMode);
                setSelectedIds(new Set());
              }}
              selectedIds={selectedIds}
              onSelectionChange={setSelectedIds}
            />

            {/* Save group button */}
            {currentFilament && !isMultiSelectMode && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleSaveGroup}
                className="text-muted-foreground hover:text-primary"
              >
                <Bookmark className="mr-1.5 h-3.5 w-3.5" />
                Save
              </Button>
            )}

            {/* Filter dropdown */}
            {!isMultiSelectMode && (
              <RecommendationFilters
                activeFilter={activeFilter}
                onFilterChange={setActiveFilter}
                currentVendor={vendor}
              />
            )}
          </div>
        </div>
        <p className="mt-1 text-sm text-muted-foreground">
          {isMultiSelectMode 
            ? "Select 2-4 materials to compare together"
            : activeTier || activeFilter !== "all" 
              ? `Showing ${filteredRecommendations.length} filtered results`
              : "Personalized recommendations based on your preferences"
          }
        </p>
      </div>

      {/* Material Journey Tier Bar */}
      <MaterialJourney
        currentPricePerKg={currentPricePerKg}
        recommendations={recommendations}
        onTierClick={handleTierClick}
        activeTier={activeTier}
      />

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
          {filteredRecommendations.map((rec) => (
            <div key={rec.id} className="snap-start">
              <SimilarMaterialCard 
                filament={rec} 
                currentFilament={currentFilament}
                currentScores={currentScores}
                isMultiSelectMode={isMultiSelectMode}
                isSelected={selectedIds.has(rec.id)}
                onToggleSelect={() => handleToggleSelect(rec.id)}
              />
            </div>
          ))}
          
          {filteredRecommendations.length === 0 && (
            <div className="flex h-[380px] w-full items-center justify-center text-muted-foreground">
              <p>No materials match the current filter.</p>
            </div>
          )}
        </div>

        {/* Right Arrow */}
        {canScrollRight && filteredRecommendations.length > 0 && (
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
      {filteredRecommendations.length > 3 && (
        <div className="mt-4 flex justify-center gap-1.5">
          {filteredRecommendations.map((_, idx) => (
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
