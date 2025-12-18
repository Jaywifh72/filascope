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
  const sizeConfig = {
    tiny: {
      star: 12,
      star5: 10,
      rating: 'text-[11px]',
      count: 'text-[10px]',
      gap: 'gap-0.5'
    },
    small: {
      star: 14,
      star5: 12,
      rating: 'text-[13px]',
      count: 'text-[12px]',
      gap: 'gap-1'
    },
    medium: {
      star: 16,
      star5: 14,
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
              fill="#F59E0B" 
              className="text-amber-500" 
            />
          ) : (
            [...Array(5)].map((_, i) => (
              <Star
                key={i}
                size={config.star5}
                fill={i < Math.round(rating) ? '#F59E0B' : 'transparent'}
                className="text-amber-500"
              />
            ))
          )}
        </div>
      )}
      <span className={cn('font-bold text-amber-500', config.rating)}>
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
