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
  const iconSize = size === 'sm' ? 12 : 16;
  
  const stars = Array.from({ length: maxRating }, (_, i) => {
    const starIndex = i + 1;
    const isFilled = starIndex <= rating;
    const isHalf = !isFilled && starIndex - 0.5 <= rating;
    
    return (
      <Star
        key={i}
        size={iconSize}
        className={cn(
          'transition-colors drop-shadow-[0_0_4px_rgba(252,211,77,0.6)]',
          isFilled 
            ? 'fill-amber-300 text-amber-300' 
            : isHalf 
              ? 'fill-amber-300/50 text-amber-300' 
              : 'fill-none text-muted-foreground/40 drop-shadow-none'
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
