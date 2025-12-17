import React from "react";
import { useNavigate } from "react-router-dom";
import { GitCompare, Grid } from "lucide-react";
import { SimilarPrinterCard } from "./SimilarPrinterCard";
import { useSimilarPrinters, SimilarPrinter } from "@/hooks/useSimilarPrinters";
import { Skeleton } from "@/components/ui/skeleton";

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
  
  const { similarPrinters, isLoading } = useSimilarPrinters(
    currentPrinter.id,
    currentPrinter.priceTier,
    currentPrinter.price,
    currentPrinter.buildVolumeX,
    currentPrinter.buildVolumeY,
    currentPrinter.buildVolumeZ,
    currentPrinter.brand
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
  };

  // Combine current printer with similar printers
  const allPrinters = [currentPrinterCard, ...similarPrinters];

  const handleCompareAll = () => {
    const printerIds = allPrinters.map(p => p.id).join(",");
    navigate(`/printers/compare?printers=${printerIds}`);
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
    <section className="max-w-[1400px] mx-auto py-20 px-10 md:px-10 px-5 bg-white/[0.02]">
      {/* Section Header */}
      <h2 className="text-2xl md:text-xl font-bold text-white text-center mb-3">
        COMPARE SIMILAR PRINTERS
      </h2>
      <p className="text-[15px] font-medium text-slate-400 text-center max-w-[600px] mx-auto mb-10">
        See how the {currentPrinter.model} stacks up against other {getCategoryName()} printers
      </p>

      {/* Cards Container */}
      <div 
        className="flex gap-5 md:gap-4 overflow-x-auto pb-2 snap-x snap-mandatory md:snap-none"
        style={{
          scrollbarWidth: 'thin',
          scrollbarColor: 'rgba(0, 217, 217, 0.3) rgba(255, 255, 255, 0.05)',
        }}
      >
        {isLoading ? (
          // Loading skeletons
          Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="w-[260px] h-[400px] flex-shrink-0 rounded-xl p-5 bg-white/5 border border-white/10">
              <Skeleton className="w-full h-6 mb-3" />
              <Skeleton className="w-[120px] h-[120px] mx-auto mb-3" />
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
          ))
        ) : (
          allPrinters.map((printer, index) => (
            <div key={printer.id} className="snap-start">
              <SimilarPrinterCard
                printer={printer}
                isCurrent={index === 0}
                currentPrinterPrice={currentPrinter.price}
              />
            </div>
          ))
        )}
      </div>

      {/* Action Buttons */}
      {!isLoading && similarPrinters.length > 0 && (
        <div className="flex justify-center gap-4 mt-8 flex-wrap md:flex-row flex-col md:items-center items-stretch px-4 md:px-0">
          <button
            onClick={handleCompareAll}
            className="h-12 px-8 bg-primary border-none rounded-[10px] text-[15px] font-bold text-slate-900 flex items-center justify-center gap-2 cursor-pointer transition-all duration-200 hover:bg-[#00F0F0] hover:-translate-y-0.5 hover:shadow-lg hover:shadow-primary/40"
          >
            <GitCompare className="h-[18px] w-[18px]" />
            <span>Compare All {allPrinters.length}</span>
          </button>

          <button
            onClick={handleSeeAllPrinters}
            className="h-12 px-7 bg-transparent border-2 border-primary/30 rounded-[10px] text-[15px] font-semibold text-primary flex items-center justify-center gap-2 cursor-pointer transition-all duration-200 hover:bg-primary/10 hover:border-primary hover:-translate-y-0.5"
          >
            <Grid className="h-[18px] w-[18px]" />
            <span>See All Printers</span>
          </button>
        </div>
      )}
    </section>
  );
};

export default SimilarPrintersSection;
