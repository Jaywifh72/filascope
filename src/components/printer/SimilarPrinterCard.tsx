import React from "react";
import { Link } from "react-router-dom";
import { Star, Check, ArrowRight, Eye, Zap, Box, Palette, Thermometer } from "lucide-react";
import { cn } from "@/lib/utils";

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
  };
  isCurrent?: boolean;
  currentPrinterPrice?: number | null;
}

export const SimilarPrinterCard: React.FC<SimilarPrinterCardProps> = ({
  printer,
  isCurrent = false,
  currentPrinterPrice,
}) => {
  const priceDifference = 
    currentPrinterPrice && printer.price && !isCurrent
      ? printer.price - currentPrinterPrice
      : null;

  const formatPriceDiff = (diff: number) => {
    if (diff < 0) {
      return `↓ $${Math.abs(diff).toLocaleString()} less`;
    } else {
      return `↑ $${diff.toLocaleString()} more`;
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

  const cardContent = (
    <div
      className={cn(
        "w-[260px] h-[400px] flex-shrink-0 rounded-xl p-5 flex flex-col items-center text-center transition-all duration-200",
        isCurrent 
          ? "bg-primary/10 border-2 border-primary" 
          : "bg-white/5 border border-white/10 hover:border-primary/30 hover:-translate-y-1 hover:shadow-lg hover:shadow-black/30",
        "md:w-[260px] md:h-[400px]"
      )}
    >
      {/* Current Badge */}
      {isCurrent && (
        <div className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-primary/15 border border-primary/30 rounded-md mb-3">
          <Eye className="h-3 w-3 text-primary" />
          <span className="text-[11px] font-bold text-primary uppercase tracking-wide">Viewing</span>
        </div>
      )}

      {/* Printer Image */}
      <div className="w-[120px] h-[120px] bg-white/5 rounded-lg p-3 mb-3 flex items-center justify-center">
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
          <Box className="h-12 w-12 text-muted-foreground/30" />
        )}
      </div>

      {/* Brand */}
      <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide mb-1">
        {printer.brand || "Unknown"}
      </div>

      {/* Model Name */}
      <h3 className="text-base font-bold text-white leading-tight mb-3 line-clamp-2">
        {printer.model}
      </h3>

      {/* Price */}
      <div className="text-xl font-bold text-white">
        {printer.price ? `$${printer.price.toLocaleString()}` : "Price N/A"}
      </div>
      
      {/* Price Difference */}
      {priceDifference !== null && (
        <div className={cn(
          "text-xs font-semibold mt-1 mb-2",
          priceDifference < 0 ? "text-green-500" : "text-slate-400"
        )}>
          {formatPriceDiff(priceDifference)}
        </div>
      )}

      {/* Rating */}
      {printer.rating && (
        <div className="flex items-center justify-center gap-1.5 text-[13px] font-medium text-slate-300 mb-4">
          <Star className="h-3.5 w-3.5 fill-yellow-400 text-yellow-400" />
          <span>{printer.rating.toFixed(1)}/5</span>
          {printer.reviewCount && (
            <span className="text-slate-500">({printer.reviewCount})</span>
          )}
        </div>
      )}

      {/* Specs List */}
      <div className="flex flex-col gap-2 flex-1 w-full mb-4">
        {specs.slice(0, 4).map((spec, index) => (
          <div key={index} className="flex items-center gap-2 text-[13px] font-medium text-slate-200">
            <span className="flex-shrink-0">
              {typeof spec.icon === 'string' ? spec.icon : spec.icon}
            </span>
            <span>{spec.text}</span>
          </div>
        ))}
      </div>

      {/* CTA Button */}
      {isCurrent ? (
        <div className="w-full h-10 rounded-lg border-[1.5px] border-primary bg-transparent flex items-center justify-center gap-1.5 text-sm font-semibold text-primary">
          <Check className="h-4 w-4" />
          <span>Selected</span>
        </div>
      ) : (
        <div className="w-full h-10 rounded-lg border-[1.5px] border-primary/30 bg-primary/10 flex items-center justify-center gap-1.5 text-sm font-semibold text-primary hover:bg-primary/15 hover:border-primary/50 transition-colors cursor-pointer">
          <span>View</span>
          <ArrowRight className="h-4 w-4" />
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
