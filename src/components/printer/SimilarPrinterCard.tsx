import React from "react";
import { Link } from "react-router-dom";
import { Star, Check, ArrowRight, Eye, Zap, Box, Palette, Thermometer, DollarSign, TrendingUp, Award, Layers } from "lucide-react";
import { cn } from "@/lib/utils";
import { SimilarityReason } from "@/hooks/useSimilarPrinters";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { usePrinterCompare } from "@/hooks/usePrinterCompare";
import ComparisonCheckbox from "@/components/printers/ComparisonCheckbox";
import { useRegion } from "@/contexts/RegionContext";
import { RegionalPrice } from "@/components/price/RegionalPrice";

interface SimilarPrinterCardProps {
  printer: {
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
    similarityReasons?: SimilarityReason[];
  };
  isCurrent?: boolean;
  currentPrinterPrice?: number | null;
  showCompareToggle?: boolean;
}

// Badge configurations for similarity reasons
const reasonBadges: Record<SimilarityReason, { 
  label: string; 
  icon: React.ReactNode; 
  className: string;
  tooltip: string;
}> = {
  similar_price: {
    label: "Similar Price",
    icon: <DollarSign className="h-3 w-3" />,
    className: "bg-teal-500/20 text-teal-400 border-teal-500/30",
    tooltip: "Within 15% of the current printer's price"
  },
  same_size: {
    label: "Same Size",
    icon: <Box className="h-3 w-3" />,
    className: "bg-blue-500/20 text-blue-400 border-blue-500/30",
    tooltip: "Build volume within 20% of the current printer"
  },
  same_features: {
    label: "Same Features",
    icon: <Layers className="h-3 w-3" />,
    className: "bg-purple-500/20 text-purple-400 border-purple-500/30",
    tooltip: "Matches enclosure and multi-material capabilities"
  },
  highly_rated: {
    label: "Top Rated",
    icon: <Award className="h-3 w-3" />,
    className: "bg-amber-500/20 text-amber-400 border-amber-500/30",
    tooltip: "Community rating of 4.0 or higher"
  },
  budget_option: {
    label: "Budget Pick",
    icon: <DollarSign className="h-3 w-3" />,
    className: "bg-green-500/20 text-green-400 border-green-500/30",
    tooltip: "More affordable alternative"
  },
  upgrade_pick: {
    label: "Upgrade",
    icon: <TrendingUp className="h-3 w-3" />,
    className: "bg-orange-500/20 text-orange-400 border-orange-500/30",
    tooltip: "Premium option with better specs"
  },
  same_brand: {
    label: "Same Brand",
    icon: null,
    className: "bg-slate-500/20 text-slate-400 border-slate-500/30",
    tooltip: "From the same manufacturer"
  },
  same_motion: {
    label: "Same Motion",
    icon: <Zap className="h-3 w-3" />,
    className: "bg-indigo-500/20 text-indigo-400 border-indigo-500/30",
    tooltip: "Same motion system type (CoreXY, Bed-slinger, etc.)"
  },
  high_speed: {
    label: "High Speed",
    icon: <Zap className="h-3 w-3" />,
    className: "bg-cyan-500/20 text-cyan-400 border-cyan-500/30",
    tooltip: "Both printers support 300+ mm/s speeds"
  },
};

export const SimilarPrinterCard: React.FC<SimilarPrinterCardProps> = ({
  printer,
  isCurrent = false,
  currentPrinterPrice,
  showCompareToggle = true,
}) => {
  const { addPrinter, removePrinter, isSelected, isMaxReached } = usePrinterCompare();
  const { formatPrice, currency, getConversionRate } = useRegion();

  // Prices are stored in USD - check if conversion needed
  const sourceCurrency = 'USD';
  const needsConversion = currency !== sourceCurrency;
  const rate = needsConversion ? getConversionRate(sourceCurrency, currency) : 1;

  const displayPrice = printer.price ? (needsConversion ? printer.price * rate : printer.price) : null;
  const displayCurrentPrice = currentPrinterPrice ? (needsConversion ? currentPrinterPrice * rate : currentPrinterPrice) : null;

  const priceDifference = 
    displayCurrentPrice && displayPrice && !isCurrent
      ? displayPrice - displayCurrentPrice
      : null;

  const formatPriceDiff = (diff: number) => {
    if (diff < 0) {
      return `↓ ${formatPrice(Math.abs(diff))} less`;
    } else {
      return `↑ ${formatPrice(diff)} more`;
    }
  };

  // Build specs list
  const specs: Array<{ icon: React.ReactNode; text: string }> = [];
  
  if (printer.maxSpeed) {
    specs.push({ icon: <Zap className="h-3.5 w-3.5 text-slate-500" />, text: `${printer.maxSpeed}mm/s` });
  }
  if (printer.buildVolume) {
    specs.push({ icon: <Box className="h-3.5 w-3.5 text-slate-500" />, text: `${printer.buildVolume.toFixed(1)}L` });
  }
  if (printer.multiMaterialSupported && printer.multiMaterialMaxSpools) {
    specs.push({ icon: <Palette className="h-3.5 w-3.5 text-slate-500" />, text: `${printer.multiMaterialMaxSpools}-color` });
  }
  if (printer.hasEnclosure) {
    specs.push({ icon: "🏠", text: "Enclosed" });
  }
  if (printer.maxNozzleTemp) {
    specs.push({ icon: <Thermometer className="h-3.5 w-3.5 text-slate-500" />, text: `${printer.maxNozzleTemp}°C` });
  }

  // Get top 2 similarity reasons to display
  const displayReasons = (printer.similarityReasons || [])
    .filter(reason => reason !== 'same_brand') // Exclude same_brand from badges
    .slice(0, 2);

  const isInCompare = isSelected(printer.id);
  const canAddMore = !isMaxReached || isInCompare;

  const handleCompareToggle = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (isInCompare) {
      removePrinter(printer.id);
    } else if (canAddMore) {
      addPrinter({
        id: printer.id,
        name: printer.model,
        imageUrl: printer.imageUrl,
        brand: printer.brand,
      });
    }
  };

  const cardContent = (
    <div
      className={cn(
        "w-[220px] md:w-[260px] h-[380px] md:h-[420px] flex-shrink-0 rounded-xl p-4 md:p-5 flex flex-col items-center text-center transition-all duration-200 relative",
        isCurrent 
          ? "bg-primary/10 border-2 border-primary" 
          : "bg-white/5 border border-white/10 hover:border-primary/30 hover:-translate-y-1 hover:shadow-lg hover:shadow-black/30"
      )}
    >
      {/* Compare Checkbox - Top Right */}
      {showCompareToggle && !isCurrent && (
        <div 
          className="absolute top-3 right-3 z-10"
          onClick={handleCompareToggle}
        >
          <ComparisonCheckbox
            checked={isInCompare}
            disabled={!canAddMore}
            onChange={() => {}}
            printerName={printer.model}
          />
        </div>
      )}

      {/* Current Badge */}
      {isCurrent && (
        <div className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-primary/15 border border-primary/30 rounded-md mb-2">
          <Eye className="h-3 w-3 text-primary" />
          <span className="text-[10px] md:text-[11px] font-bold text-primary uppercase tracking-wide">Viewing</span>
        </div>
      )}

      {/* Similarity Reason Badges */}
      {!isCurrent && displayReasons.length > 0 && (
        <TooltipProvider>
          <div className="flex flex-wrap gap-1.5 justify-center mb-2 min-h-[24px]">
            {displayReasons.map((reason) => {
              const badge = reasonBadges[reason];
              return (
                <Tooltip key={reason}>
                  <TooltipTrigger asChild>
                    <div className={cn(
                      "inline-flex items-center gap-1 px-2 py-0.5 rounded-full border text-[10px] font-semibold cursor-help",
                      badge.className
                    )}>
                      {badge.icon}
                      <span className="hidden md:inline">{badge.label}</span>
                      <span className="md:hidden">{badge.label.split(' ')[0]}</span>
                    </div>
                  </TooltipTrigger>
                  <TooltipContent side="top" className="max-w-[200px]">
                    <p className="text-xs">{badge.tooltip}</p>
                  </TooltipContent>
                </Tooltip>
              );
            })}
          </div>
        </TooltipProvider>
      )}

      {/* Printer Image */}
      <div className="w-[100px] md:w-[120px] h-[100px] md:h-[120px] bg-white/5 rounded-lg p-2 md:p-3 mb-2 md:mb-3 flex items-center justify-center">
        {printer.imageUrl ? (
          <img
            src={printer.imageUrl}
            alt={`${printer.brand} ${printer.model}`}
            className="max-w-full max-h-full object-contain"
            onError={(e) => {
              (e.target as HTMLImageElement).src = "/placeholder.svg";
            }}
          />
        ) : (
          <Box className="h-10 md:h-12 w-10 md:w-12 text-muted-foreground/30" />
        )}
      </div>

      {/* Brand */}
      <div className="text-[10px] md:text-[11px] font-semibold text-slate-500 uppercase tracking-wide mb-0.5 md:mb-1">
        {printer.brand || "Unknown"}
      </div>

      {/* Model Name */}
      <h3 className="text-sm md:text-base font-bold text-white leading-tight mb-2 md:mb-3 line-clamp-2 px-1">
        {printer.model}
      </h3>

      {/* Price */}
      {printer.price ? (
        <RegionalPrice
          amount={printer.price}
          sourceCurrency="USD"
          size="lg"
        />
      ) : (
        <div className="text-lg md:text-xl font-bold text-muted-foreground">
          Price N/A
        </div>
      )}
      
      {/* Price Difference */}
      {priceDifference !== null && (
        <div className={cn(
          "text-[11px] md:text-xs font-semibold mt-0.5 md:mt-1 mb-1.5 md:mb-2",
          priceDifference < 0 ? "text-green-500" : "text-slate-400"
        )}>
          {formatPriceDiff(priceDifference)}
        </div>
      )}

      {/* Rating */}
      {printer.rating && (
        <div className="flex items-center justify-center gap-1 md:gap-1.5 text-[12px] md:text-[13px] font-medium text-slate-300 mb-2 md:mb-3">
          <Star className="h-4 w-4 fill-[#FFB800] text-[#FFB800] drop-shadow-[0_0_4px_rgba(255,184,0,0.6)]" />
          <span>{printer.rating.toFixed(1)}/5</span>
          {printer.reviewCount && (
            <span className="text-slate-500">({printer.reviewCount})</span>
          )}
        </div>
      )}

      {/* Specs List - Show 2 on mobile, 3 on desktop */}
      <div className="flex flex-col gap-1.5 md:gap-2 flex-1 w-full mb-3 md:mb-4">
        {specs.slice(0, 3).map((spec, index) => (
          <div 
            key={index} 
            className={cn(
              "flex items-center gap-2 text-[12px] md:text-[13px] font-medium text-slate-200",
              index >= 2 && "hidden md:flex" // Hide 3rd spec on mobile
            )}
          >
            <span className="flex-shrink-0">
              {typeof spec.icon === 'string' ? spec.icon : spec.icon}
            </span>
            <span>{spec.text}</span>
          </div>
        ))}
      </div>

      {/* CTA Button */}
      {isCurrent ? (
        <div className="w-full h-9 md:h-10 rounded-lg border-[1.5px] border-primary bg-transparent flex items-center justify-center gap-1.5 text-xs md:text-sm font-semibold text-primary">
          <Check className="h-3.5 md:h-4 w-3.5 md:w-4" />
          <span>Selected</span>
        </div>
      ) : (
        <div className="w-full h-9 md:h-10 rounded-lg border-[1.5px] border-primary/30 bg-primary/10 flex items-center justify-center gap-1.5 text-xs md:text-sm font-semibold text-primary hover:bg-primary/15 hover:border-primary/50 transition-colors cursor-pointer">
          <span>View Details</span>
          <ArrowRight className="h-3.5 md:h-4 w-3.5 md:w-4" />
        </div>
      )}
    </div>
  );

  if (isCurrent) {
    return cardContent;
  }

  return (
    <Link to={`/printers/${printer.id}`} className="block">
      {cardContent}
    </Link>
  );
};

export default SimilarPrinterCard;
