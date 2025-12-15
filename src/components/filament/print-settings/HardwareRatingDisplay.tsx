import { Star, MessageSquare } from "lucide-react";
import { cn } from "@/lib/utils";

interface HardwareRatingDisplayProps {
  rating: number; // 1-5
  ratingCount: number;
  material?: string; // e.g., "PLA" - for material-specific ratings
  className?: string;
}

export function HardwareRatingDisplay({
  rating,
  ratingCount,
  material,
  className,
}: HardwareRatingDisplayProps) {
  const fullStars = Math.floor(rating);
  const hasHalfStar = rating % 1 >= 0.5;
  const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);

  return (
    <div className={cn("flex items-center gap-2", className)}>
      {/* Stars */}
      <div className="flex items-center gap-0.5">
        {Array.from({ length: fullStars }).map((_, i) => (
          <Star 
            key={`full-${i}`} 
            className="w-3.5 h-3.5 text-amber-400 fill-amber-400" 
          />
        ))}
        {hasHalfStar && (
          <div className="relative w-3.5 h-3.5">
            <Star className="absolute w-3.5 h-3.5 text-amber-400/30" />
            <div className="absolute overflow-hidden w-[50%]">
              <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
            </div>
          </div>
        )}
        {Array.from({ length: emptyStars }).map((_, i) => (
          <Star 
            key={`empty-${i}`} 
            className="w-3.5 h-3.5 text-amber-400/30" 
          />
        ))}
      </div>
      
      {/* Rating text */}
      <span className="text-xs text-foreground font-medium">
        {rating.toFixed(1)}/5
      </span>
      
      {/* Count */}
      <span className="text-xs text-muted-foreground">
        ({ratingCount.toLocaleString()} ratings)
      </span>
      
      {/* Material context */}
      {material && (
        <span className="text-xs text-muted-foreground">
          for {material}
        </span>
      )}
    </div>
  );
}

// Comparison component showing top-rated alternatives
interface RatingComparisonProps {
  items: {
    name: string;
    rating: number;
    ratingCount: number;
    note?: string; // e.g., "Most reliable", "Best value"
    price?: string;
  }[];
}

export function RatingComparison({ items }: RatingComparisonProps) {
  if (items.length === 0) return null;

  return (
    <div className="space-y-2">
      <div className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
        <MessageSquare className="w-3.5 h-3.5" />
        Community favorites:
      </div>
      <div className="space-y-1.5">
        {items.map((item, i) => (
          <div key={i} className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              {item.note && (
                <span className="text-amber-400 font-medium">{item.note}:</span>
              )}
              <span className="text-foreground">{item.name}</span>
              {item.price && (
                <span className="text-muted-foreground">({item.price})</span>
              )}
            </div>
            <div className="flex items-center gap-1">
              <Star className="w-3 h-3 text-amber-400 fill-amber-400" />
              <span className="text-muted-foreground">{item.rating.toFixed(1)}/5</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
