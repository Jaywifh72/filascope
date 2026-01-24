import { Star, Truck, HeadphonesIcon, RotateCcw } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface RetailerRatingProps {
  trustScore: number | null;
  shippingSpeedRating?: number | null;
  customerServiceRating?: number | null;
  returnPolicyDays?: number | null;
  compact?: boolean;
  className?: string;
}

function StarRating({ rating, max = 5 }: { rating: number; max?: number }) {
  const fullStars = Math.floor(rating);
  const hasHalfStar = rating % 1 >= 0.5;
  
  return (
    <div className="flex items-center gap-0.5">
      {Array.from({ length: max }).map((_, i) => (
        <Star
          key={i}
          className={cn(
            "h-3 w-3 drop-shadow-[0_0_4px_rgba(252,211,77,0.6)]",
            i < fullStars
              ? "fill-amber-300 text-amber-300"
              : i === fullStars && hasHalfStar
              ? "fill-amber-300/50 text-amber-300"
              : "fill-muted text-muted drop-shadow-none"
          )}
        />
      ))}
    </div>
  );
}

export function RetailerRating({
  trustScore,
  shippingSpeedRating,
  customerServiceRating,
  returnPolicyDays,
  compact = false,
  className,
}: RetailerRatingProps) {
  if (trustScore === null) {
    return null;
  }

  const ratingDisplay = (
    <div className={cn("flex items-center gap-1.5", className)}>
      <StarRating rating={trustScore} />
      <span className="text-xs text-muted-foreground font-medium">
        {trustScore.toFixed(1)}
      </span>
    </div>
  );

  if (compact) {
    return ratingDisplay;
  }

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="cursor-help">{ratingDisplay}</div>
        </TooltipTrigger>
        <TooltipContent side="top" className="w-64 p-3">
          <div className="space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium">Overall Rating</span>
              <div className="flex items-center gap-1">
                <StarRating rating={trustScore} />
                <span className="text-xs font-medium">{trustScore.toFixed(1)}</span>
              </div>
            </div>
            
            {shippingSpeedRating && (
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <Truck className="h-3 w-3" />
                  <span>Shipping Speed</span>
                </div>
                <div className="flex items-center gap-1">
                  <StarRating rating={shippingSpeedRating} />
                </div>
              </div>
            )}
            
            {customerServiceRating && (
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <HeadphonesIcon className="h-3 w-3" />
                  <span>Customer Service</span>
                </div>
                <div className="flex items-center gap-1">
                  <StarRating rating={customerServiceRating} />
                </div>
              </div>
            )}
            
            {returnPolicyDays && (
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <RotateCcw className="h-3 w-3" />
                  <span>Returns</span>
                </div>
                <span className="text-xs font-medium">{returnPolicyDays} days</span>
              </div>
            )}
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
