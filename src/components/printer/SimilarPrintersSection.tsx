import React from "react";
import { useNavigate, Link } from "react-router-dom";
import { GitCompare, Grid, ChevronRight, Clock } from "lucide-react";
import { SimilarPrinterCard } from "./SimilarPrinterCard";
import { useSimilarPrinters, SimilarPrinter } from "@/hooks/useSimilarPrinters";
import { usePrinterCompare } from "@/hooks/usePrinterCompare";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { ScrollCarousel, ScrollCarouselItem } from "@/components/ui/scroll-carousel";

interface CurrentPrinterData {
  id: string;
  brand: string;
  model: string;
  price: number | null;
  rating: number | null;
  reviewCount: number | null;
  imageUrl: string | null;
  buildVolume: number | null;
  maxSpeed: number | null;
  maxNozzleTemp: number | null;
  hasEnclosure: boolean;
  multiMaterialSupported: boolean;
  multiMaterialMaxSpools: number | null;
  priceTier: string | null;
  buildVolumeX: number | null;
  buildVolumeY: number | null;
  buildVolumeZ: number | null;
}

interface SimilarPrintersSectionProps {
  currentPrinter: CurrentPrinterData;
}

// Calculate build volume in liters
const calculateBuildVolume = (x: number | null, y: number | null, z: number | null): number | null => {
  if (!x || !y || !z) return null;
  return (x * y * z) / 1000000;
};

export const SimilarPrintersSection: React.FC<SimilarPrintersSectionProps> = ({
  currentPrinter,
}) => {
  const navigate = useNavigate();
  const { selectedPrinters, count } = usePrinterCompare();
  
  const { similarPrinters, isLoading } = useSimilarPrinters(
    currentPrinter.id,
    currentPrinter.priceTier,
    currentPrinter.price,
    currentPrinter.buildVolumeX,
    currentPrinter.buildVolumeY,
    currentPrinter.buildVolumeZ,
    currentPrinter.brand,
    currentPrinter.hasEnclosure,
    currentPrinter.multiMaterialSupported
  );

  // Show empty state if no similar printers found (after loading)
  const showEmptyState = !isLoading && similarPrinters.length === 0;

  // Create current printer card data
  const currentPrinterCard: SimilarPrinter = {
    id: currentPrinter.id,
    printerId: null, // Current printer already on this page, no need for slug
    brand: currentPrinter.brand,
    model: currentPrinter.model,
    price: currentPrinter.price,
    rating: currentPrinter.rating,
    reviewCount: currentPrinter.reviewCount,
    imageUrl: currentPrinter.imageUrl,
    buildVolume: currentPrinter.buildVolume || calculateBuildVolume(
      currentPrinter.buildVolumeX,
      currentPrinter.buildVolumeY,
      currentPrinter.buildVolumeZ
    ),
    maxSpeed: currentPrinter.maxSpeed,
    maxNozzleTemp: currentPrinter.maxNozzleTemp,
    hasEnclosure: currentPrinter.hasEnclosure,
    multiMaterialSupported: currentPrinter.multiMaterialSupported,
    multiMaterialMaxSpools: currentPrinter.multiMaterialMaxSpools,
    priceTier: currentPrinter.priceTier,
    similarityReasons: [],
  };

  // Combine current printer with similar printers
  const allPrinters = [currentPrinterCard, ...similarPrinters];

  const handleCompareAll = () => {
    const printerIds = allPrinters.map(p => p.id).join(",");
    navigate(`/printers/compare?printers=${printerIds}`);
  };

  const handleCompareSelected = () => {
    if (count >= 2) {
      const printerIds = selectedPrinters.map(p => p.id).join(",");
      navigate(`/printers/compare?printers=${printerIds}`);
    }
  };

  const handleSeeAllPrinters = () => {
    navigate("/printers");
  };

  // Get category name based on price tier
  const getCategoryName = () => {
    switch (currentPrinter.priceTier) {
      case "budget": return "budget";
      case "mid-range": return "mid-range";
      case "premium": return "premium";
      case "professional": return "professional";
      default: return "similar";
    }
  };

  return (
    <section className="max-w-[1400px] mx-auto py-12 md:py-16 px-4 md:px-10">
      {/* Section Header */}
      <div className="flex items-center justify-between mb-6 md:mb-8">
        <h2 className="text-xl md:text-2xl font-bold text-foreground">
          Compare Similar Printers
        </h2>
        <Link 
          to="/printers" 
          className="text-sm text-primary hover:text-primary/80 font-medium inline-flex items-center gap-1 transition-colors"
        >
          View All
          <ChevronRight className="h-4 w-4" />
        </Link>
      </div>

      {/* Empty State */}
      {showEmptyState && (
        <div className="flex flex-col items-center justify-center py-12 px-4 rounded-xl border border-dashed border-border/50 bg-muted/10">
          <Clock className="h-10 w-10 text-muted-foreground/40 mb-3" />
          <p className="text-muted-foreground text-center">
            Similar printers coming soon. Check back later!
          </p>
        </div>
      )}

      {/* Carousel Container */}
      {isLoading && (
        <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-thin scrollbar-thumb-border scrollbar-track-transparent">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="w-[240px] h-[340px] flex-shrink-0 rounded-xl p-4 bg-card/50 border border-border/50">
              <Skeleton className="w-full h-5 mb-3" />
              <Skeleton className="w-[120px] h-[100px] mx-auto mb-3" />
              <Skeleton className="w-16 h-3 mb-2" />
              <Skeleton className="w-28 h-5 mb-3" />
              <Skeleton className="w-20 h-5 mb-4" />
              <div className="flex gap-2 mb-3">
                <Skeleton className="w-16 h-5 rounded-full" />
                <Skeleton className="w-14 h-5 rounded-full" />
              </div>
              <Skeleton className="w-full h-8 rounded-lg" />
            </div>
          ))}
        </div>
      )}
      
      {!isLoading && !showEmptyState && (
        <ScrollCarousel>
          {allPrinters.map((printer, index) => (
            <ScrollCarouselItem key={printer.id}>
              <SimilarPrinterCard
                printer={printer}
                isCurrent={index === 0}
                currentPrinterPrice={currentPrinter.price}
                showCompareToggle={true}
              />
            </ScrollCarouselItem>
          ))}
        </ScrollCarousel>
      )}

      {/* Action Buttons */}
      {!isLoading && similarPrinters.length > 0 && (
        <div className="flex justify-center gap-3 md:gap-4 mt-8 flex-wrap px-4">
          {/* Show Compare Selected if items are selected */}
          {count >= 2 && (
            <Button
              onClick={handleCompareSelected}
              className="h-10 md:h-11 px-5 md:px-6 bg-green-600 hover:bg-green-500 text-white font-semibold rounded-lg"
            >
              <GitCompare className="h-4 w-4 mr-2" />
              <span>Compare Selected ({count})</span>
            </Button>
          )}

          <Button
            onClick={handleCompareAll}
            variant="default"
            className="h-10 md:h-11 px-5 md:px-6 font-semibold rounded-lg"
          >
            <GitCompare className="h-4 w-4 mr-2" />
            <span>Compare All {allPrinters.length}</span>
          </Button>

          <Button
            onClick={handleSeeAllPrinters}
            variant="outline"
            className="h-10 md:h-11 px-5 md:px-6 font-medium rounded-lg border-border hover:bg-muted/50"
          >
            <Grid className="h-4 w-4 mr-2" />
            <span>See All Printers</span>
          </Button>
        </div>
      )}
    </section>
  );
};

export default SimilarPrintersSection;
