import { Link } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { CircleDot, Square, Layers } from "lucide-react";
import { getBrandLogo } from "@/lib/brandLogos";
import { cn } from "@/lib/utils";
import { useRegion } from "@/contexts/RegionContext";

interface AccessoryCardProps {
  id: string;
  name: string;
  subtitle?: string;
  brand: string;
  price: number | null;
  priceUsd?: number | null; // Base price in USD for conversion
  minPriceUsd?: number | null; // For price ranges
  maxPriceUsd?: number | null; // For price ranges
  imageUrl: string | null;
  href: string;
  type: "hotend" | "build_plate" | "ams_mmu";
  specs?: React.ReactNode;
  badges?: { label: string; variant?: "default" | "secondary" | "outline" }[];
  isSelected?: boolean;
  topRightContent?: React.ReactNode;
  discontinued?: boolean;
}

const typeIcons = {
  hotend: CircleDot,
  build_plate: Square,
  ams_mmu: Layers,
};

export default function AccessoryCard({
  id,
  name,
  subtitle,
  brand,
  price,
  priceUsd,
  minPriceUsd,
  maxPriceUsd,
  imageUrl,
  href,
  type,
  specs,
  badges = [],
  isSelected = false,
  topRightContent,
  discontinued = false,
}: AccessoryCardProps) {
  const Icon = typeIcons[type];
  const brandLogo = getBrandLogo(brand);
  const { formatPrice, convertPrice, currency } = useRegion();
  
  // Determine the display price
  let displayPrice: string | null = null;
  const isConverted = currency !== 'USD';
  
  if (discontinued) {
    // Don't show price for discontinued items
    displayPrice = null;
  } else if (minPriceUsd !== null && minPriceUsd !== undefined) {
    // Price range case
    const convertedMin = convertPrice(minPriceUsd, 'USD');
    const convertedMax = maxPriceUsd ? convertPrice(maxPriceUsd, 'USD') : null;
    
    if (convertedMax && convertedMax !== convertedMin) {
      // Show range indicator
      displayPrice = `${isConverted ? '~' : ''}${formatPrice(convertedMin)}+`;
    } else {
      displayPrice = `${isConverted ? '~' : ''}${formatPrice(convertedMin)}`;
    }
  } else if (priceUsd !== null && priceUsd !== undefined) {
    // Single price case
    const convertedPrice = convertPrice(priceUsd, 'USD');
    displayPrice = `${isConverted ? '~' : ''}${formatPrice(convertedPrice)}`;
  } else if (price !== null && price !== undefined) {
    // Legacy: direct price prop (assumed USD)
    const convertedPrice = convertPrice(price, 'USD');
    displayPrice = `${isConverted ? '~' : ''}${formatPrice(convertedPrice)}`;
  }

  return (
    <div className="relative h-full">
      {topRightContent && (
        <div className="absolute top-2 right-2 z-10">
          {topRightContent}
        </div>
      )}
      
      <Link to={href} className="block h-full">
        <div
          className={cn(
            "h-full bg-gray-800 border border-gray-700 rounded-xl overflow-hidden",
            "transition-all duration-300 cursor-pointer",
            "hover:scale-[1.02] hover:shadow-lg hover:shadow-primary/10 hover:border-primary/50",
            isSelected && "ring-2 ring-primary border-primary/50"
          )}
        >
          <div className="flex flex-col sm:flex-row h-full">
            {/* Product Image - Top on mobile, Left on desktop */}
            <div className="relative w-full sm:w-28 h-32 sm:h-auto shrink-0 bg-gray-900/50 flex items-center justify-center">
              {imageUrl ? (
                <img
                  src={imageUrl}
                  alt={name}
                  className="w-full h-full object-contain p-3"
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = 'none';
                    (e.target as HTMLImageElement).nextElementSibling?.classList.remove('hidden');
                  }}
                />
              ) : null}
              <div className={cn(
                "w-full h-full flex items-center justify-center absolute inset-0",
                imageUrl ? "hidden" : ""
              )}>
                <Icon className="h-10 w-10 text-muted-foreground/30" />
              </div>
            </div>

            {/* Card Content - Bottom on mobile, Right on desktop */}
            <div className="flex-1 p-3 sm:p-4 min-w-0 flex flex-col">
              {/* Header with Name and Price */}
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0 flex-1">
                  <h4 className="text-sm sm:text-base font-bold text-foreground line-clamp-2 sm:line-clamp-1">{name}</h4>
                  {subtitle && (
                    <span className="text-xs text-muted-foreground line-clamp-1">{subtitle}</span>
                  )}
                </div>
                {/* Price or Discontinued */}
                <div className="shrink-0 text-right">
                  {discontinued ? (
                    <span className="text-sm font-semibold text-orange-500">
                      Discontinued
                    </span>
                  ) : displayPrice ? (
                    <span className="text-sm font-bold text-primary">
                      {displayPrice}
                    </span>
                  ) : null}
                </div>
              </div>

              {/* Quick Specs */}
              {specs && (
                <div className="text-xs text-muted-foreground space-y-0.5 mt-2">
                  {specs}
                </div>
              )}

              {/* Badges and Brand Logo Row */}
              <div className="flex items-end justify-between gap-2 mt-auto pt-3">
                <div className="flex flex-wrap gap-1">
                  {badges.map((badge, index) => (
                    <span
                      key={index}
                      className="bg-gray-700 text-gray-300 text-xs px-2 py-0.5 rounded"
                    >
                      {badge.label}
                    </span>
                  ))}
                </div>
                {/* Brand Logo - Bottom Right */}
                {brandLogo && (
                  <div className="shrink-0 px-2 py-1.5 bg-gray-900/50 rounded-lg border border-gray-700/50">
                    <img 
                      src={brandLogo} 
                      alt={`${brand} logo`}
                      className="h-8 w-auto object-contain max-w-[100px]"
                    />
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </Link>
    </div>
  );
}
