import { Star } from 'lucide-react';
import { cn } from '@/lib/utils';

interface StarRatingProps {
  rating: number;        // 1-5
  maxRating?: number;    // default 5
  showLabel?: boolean;   // show "X/5" text
  size?: 'sm' | 'md';    // icon size
  className?: string;
}

export function StarRating({ 
  rating, 
  maxRating = 5, 
  showLabel = false,
  size = 'sm',
  className 
}: StarRatingProps) {
  // Minimum 16px for touch accessibility
  const iconSize = size === 'sm' ? 16 : 20;
  
  const stars = Array.from({ length: maxRating }, (_, i) => {
    const starIndex = i + 1;
    const isFilled = starIndex <= rating;
    const isHalf = !isFilled && starIndex - 0.5 <= rating;
    
    return (
      <Star
        key={i}
        size={iconSize}
        className={cn(
          'transition-colors',
          isFilled 
            ? 'fill-[#FFB800] text-[#FFB800] drop-shadow-[0_0_4px_rgba(255,184,0,0.6)]' 
            : isHalf 
              ? 'fill-[#FFB800]/50 text-[#FFB800] drop-shadow-[0_0_4px_rgba(255,184,0,0.4)]' 
              : 'fill-none text-muted-foreground/40'
        )}
      />
    );
  });

  return (
    <div className={cn('inline-flex items-center gap-0.5', className)}>
      {stars}
      {showLabel && (
        <span className="ml-1.5 text-xs text-muted-foreground tabular-nums">
          {rating}/{maxRating}
        </span>
      )}
    </div>
  );
}
