import React from 'react';
import { Star } from 'lucide-react';
import { cn } from '@/lib/utils';

interface CompactRatingProps {
  rating: number;
  count: number;
  size?: 'tiny' | 'small' | 'medium';
  showCount?: boolean;
  showStars?: boolean;
  starCount?: 1 | 5;
  className?: string;
}

export const CompactRating: React.FC<CompactRatingProps> = ({
  rating,
  count,
  size = 'small',
  showCount = true,
  showStars = true,
  starCount = 1,
  className
}) => {
  // Minimum 16px for touch accessibility on single stars
  const sizeConfig = {
    tiny: {
      star: 16,
      star5: 14,
      rating: 'text-[11px]',
      count: 'text-[10px]',
      gap: 'gap-0.5'
    },
    small: {
      star: 16,
      star5: 14,
      rating: 'text-[13px]',
      count: 'text-[12px]',
      gap: 'gap-1'
    },
    medium: {
      star: 18,
      star5: 16,
      rating: 'text-[15px]',
      count: 'text-[13px]',
      gap: 'gap-1.5'
    }
  };

  const config = sizeConfig[size];
  const ariaLabel = `Rating: ${rating.toFixed(1)} out of 5 stars${showCount ? ` based on ${count} reviews` : ''}`;

  return (
    <div 
      className={cn('flex items-center', config.gap, className)}
      role="img" 
      aria-label={ariaLabel}
    >
      {showStars && (
        <div className="flex items-center gap-px">
          {starCount === 1 ? (
            <Star 
              size={config.star} 
              fill="#FFB800" 
              className="text-[#FFB800] drop-shadow-[0_0_4px_rgba(255,184,0,0.6)]" 
            />
          ) : (
            [...Array(5)].map((_, i) => (
              <Star
                key={i}
                size={config.star5}
                fill={i < Math.round(rating) ? '#FFB800' : 'transparent'}
                className={cn(
                  i < Math.round(rating) 
                    ? 'text-[#FFB800] drop-shadow-[0_0_4px_rgba(255,184,0,0.6)]'
                    : 'text-muted-foreground/40'
                )}
              />
            ))
          )}
        </div>
      )}
      <span className={cn('font-bold text-[#FFB800]', config.rating)}>
        {rating.toFixed(1)}
      </span>
      {showCount && (
        <span className={cn('font-medium text-muted-foreground', config.count)}>
          ({count.toLocaleString()})
        </span>
      )}
    </div>
  );
};
