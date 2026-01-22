import React from "react";
import { useNavigate } from "react-router-dom";
import { GitCompare, Grid, ChevronLeft, ChevronRight } from "lucide-react";
import { SimilarPrinterCard } from "./SimilarPrinterCard";
import { useSimilarPrinters, SimilarPrinter } from "@/hooks/useSimilarPrinters";
import { usePrinterCompare } from "@/hooks/usePrinterCompare";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";

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

  // Don't render if no similar printers found
  if (!isLoading && similarPrinters.length === 0) {
    return null;
  }

  // Create current printer card data
  const currentPrinterCard: SimilarPrinter = {
    id: currentPrinter.id,
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
    <section className="max-w-[1400px] mx-auto py-16 md:py-20 px-4 md:px-10 bg-white/[0.02]">
      {/* Section Header */}
      <h2 className="text-xl md:text-2xl font-bold text-white text-center mb-2 md:mb-3">
        COMPARE SIMILAR PRINTERS
      </h2>
      <p className="text-sm md:text-[15px] font-medium text-slate-400 text-center max-w-[600px] mx-auto mb-8 md:mb-10 px-4">
        See how the {currentPrinter.model} stacks up against other {getCategoryName()} printers
      </p>

      {/* Carousel Container */}
      {isLoading ? (
        <div className="flex gap-4 overflow-hidden px-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="w-[220px] md:w-[260px] h-[380px] md:h-[420px] flex-shrink-0 rounded-xl p-4 md:p-5 bg-white/5 border border-white/10">
              <Skeleton className="w-full h-6 mb-3" />
              <Skeleton className="w-[100px] md:w-[120px] h-[100px] md:h-[120px] mx-auto mb-3" />
              <Skeleton className="w-20 h-4 mx-auto mb-2" />
              <Skeleton className="w-32 h-5 mx-auto mb-3" />
              <Skeleton className="w-24 h-6 mx-auto mb-2" />
              <Skeleton className="w-20 h-4 mx-auto mb-4" />
              <div className="space-y-2">
                <Skeleton className="w-full h-4" />
                <Skeleton className="w-full h-4" />
                <Skeleton className="w-full h-4" />
              </div>
            </div>
          ))}
        </div>
      ) : (
        <Carousel
          opts={{
            align: "start",
            loop: false,
          }}
          className="w-full"
        >
          <CarouselContent className="-ml-2 md:-ml-4">
            {allPrinters.map((printer, index) => (
              <CarouselItem 
                key={printer.id} 
                className="pl-2 md:pl-4 basis-auto"
              >
                <SimilarPrinterCard
                  printer={printer}
                  isCurrent={index === 0}
                  currentPrinterPrice={currentPrinter.price}
                  showCompareToggle={true}
                />
              </CarouselItem>
            ))}
          </CarouselContent>
          
          {/* Navigation Arrows - Hidden on mobile */}
          <CarouselPrevious className="hidden md:flex -left-4 lg:-left-6 h-10 w-10 bg-card/80 border-border hover:bg-card" />
          <CarouselNext className="hidden md:flex -right-4 lg:-right-6 h-10 w-10 bg-card/80 border-border hover:bg-card" />
        </Carousel>
      )}

      {/* Action Buttons */}
      {!isLoading && similarPrinters.length > 0 && (
        <div className="flex justify-center gap-3 md:gap-4 mt-8 flex-wrap px-4">
          {/* Show Compare Selected if items are selected */}
          {count >= 2 && (
            <Button
              onClick={handleCompareSelected}
              className="h-11 md:h-12 px-6 md:px-8 bg-green-600 hover:bg-green-500 text-white font-bold rounded-lg"
            >
              <GitCompare className="h-4 md:h-[18px] w-4 md:w-[18px] mr-2" />
              <span>Compare Selected ({count})</span>
            </Button>
          )}

          <Button
            onClick={handleCompareAll}
            variant="default"
            className="h-11 md:h-12 px-6 md:px-8 font-bold rounded-lg"
          >
            <GitCompare className="h-4 md:h-[18px] w-4 md:w-[18px] mr-2" />
            <span>Compare All {allPrinters.length}</span>
          </Button>

          <Button
            onClick={handleSeeAllPrinters}
            variant="outline"
            className="h-11 md:h-12 px-5 md:px-7 font-semibold rounded-lg border-primary/30 text-primary hover:bg-primary/10 hover:border-primary"
          >
            <Grid className="h-4 md:h-[18px] w-4 md:w-[18px] mr-2" />
            <span>See All Printers</span>
          </Button>
        </div>
      )}
    </section>
  );
};

export default SimilarPrintersSection;
