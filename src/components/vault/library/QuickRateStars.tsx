import { useState } from "react";
import { Star } from "lucide-react";
import { cn } from "@/lib/utils";

interface QuickRateStarsProps {
  currentRating: number | null;
  onRate: (rating: number) => void;
  disabled?: boolean;
  size?: number;
}

export function QuickRateStars({
  currentRating,
  onRate,
  disabled = false,
  size = 16,
}: QuickRateStarsProps) {
  const [hoverRating, setHoverRating] = useState(0);

  const displayRating = hoverRating || currentRating || 0;

  return (
    <div
      className="inline-flex items-center gap-0.5"
      onMouseLeave={() => setHoverRating(0)}
    >
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          disabled={disabled}
          onClick={(e) => {
            e.stopPropagation();
            onRate(star);
          }}
          onMouseEnter={() => !disabled && setHoverRating(star)}
          className={cn(
            "transition-all",
            disabled ? "cursor-default" : "cursor-pointer hover:scale-110",
          )}
          aria-label={`Rate ${star} star${star > 1 ? "s" : ""}`}
        >
          <Star
            size={size}
            className={cn(
              "transition-colors",
              star <= displayRating
                ? "fill-[#FFB800] text-[#FFB800] drop-shadow-[0_0_4px_rgba(255,184,0,0.6)]"
                : "fill-none text-muted-foreground/30",
            )}
          />
        </button>
      ))}
      {currentRating === null && !hoverRating && (
        <span className="text-[10px] text-muted-foreground ml-1">Rate</span>
      )}
    </div>
  );
}
