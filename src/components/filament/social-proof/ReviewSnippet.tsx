import React, { useState, useEffect, useCallback } from 'react';
import { Star, Quote, ChevronLeft, ChevronRight, BadgeCheck } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { FeaturedReview, RatingData } from './types';

interface ReviewSnippetProps {
  reviews: FeaturedReview[];
  rating: RatingData;
  autoRotate?: boolean;
  rotationInterval?: number;
  size?: 'small' | 'medium' | 'large';
  showNavigation?: boolean;
  className?: string;
}

export const ReviewSnippet: React.FC<ReviewSnippetProps> = ({
  reviews,
  rating,
  autoRotate = true,
  rotationInterval = 5000,
  size = 'medium',
  showNavigation = true,
  className
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);

  // Check for reduced motion preference
  const prefersReducedMotion = typeof window !== 'undefined' 
    ? window.matchMedia('(prefers-reduced-motion: reduce)').matches 
    : false;

  const goToNext = useCallback(() => {
    if (reviews.length <= 1) return;
    setIsAnimating(true);
    setTimeout(() => {
      setCurrentIndex(prev => (prev + 1) % reviews.length);
      setIsAnimating(false);
    }, 300);
  }, [reviews.length]);

  const goToPrev = useCallback(() => {
    if (reviews.length <= 1) return;
    setIsAnimating(true);
    setTimeout(() => {
      setCurrentIndex(prev => (prev - 1 + reviews.length) % reviews.length);
      setIsAnimating(false);
    }, 300);
  }, [reviews.length]);

  // Auto-rotate reviews
  useEffect(() => {
    if (!autoRotate || reviews.length <= 1 || prefersReducedMotion) return;

    const interval = setInterval(goToNext, rotationInterval);
    return () => clearInterval(interval);
  }, [autoRotate, rotationInterval, reviews.length, prefersReducedMotion, goToNext]);

  const currentReview = reviews[currentIndex];

  if (!currentReview || reviews.length === 0) return null;

  const sizeClasses = {
    small: {
      container: 'p-2 px-3 gap-2 rounded-lg',
      star: 14,
      rating: 'text-[13px]',
      count: 'text-[11px]',
      quote: 'text-[12px]',
      author: 'text-[11px]',
      quoteIcon: 10,
      nav: 'w-5 h-5'
    },
    medium: {
      container: 'p-2.5 px-3.5 gap-3 rounded-xl',
      star: 18,
      rating: 'text-[15px]',
      count: 'text-[13px]',
      quote: 'text-[14px]',
      author: 'text-[12px]',
      quoteIcon: 14,
      nav: 'w-6 h-6'
    },
    large: {
      container: 'p-3.5 px-4 gap-3 rounded-xl',
      star: 20,
      rating: 'text-[17px]',
      count: 'text-[14px]',
      quote: 'text-[15px]',
      author: 'text-[13px]',
      quoteIcon: 16,
      nav: 'w-7 h-7'
    }
  };

  const styles = sizeClasses[size];

  return (
    <div 
      className={cn(
        'flex items-center flex-wrap bg-amber-500/5 border border-amber-500/15',
        styles.container,
        className
      )}
      role="region"
      aria-label="Featured customer reviews"
    >
      {/* Rating Summary */}
      <div className="flex items-center gap-1.5 flex-shrink-0">
        <Star size={styles.star} fill="#F59E0B" className="text-amber-500" />
        <span className={cn('font-extrabold text-amber-500', styles.rating)}>
          {rating.average.toFixed(1)}
        </span>
        <span className={cn('font-medium text-muted-foreground', styles.count)}>
          ({rating.count.toLocaleString()} reviews)
        </span>
      </div>

      <span className="text-muted-foreground/60 flex-shrink-0">•</span>

      {/* Review Quote */}
      <div 
        className={cn(
          'flex items-center gap-1.5 flex-1 min-w-0 transition-opacity duration-300',
          isAnimating ? 'opacity-0' : 'opacity-100',
          prefersReducedMotion && 'transition-none'
        )}
        aria-live="polite"
      >
        <Quote size={styles.quoteIcon} className="text-amber-500/60 flex-shrink-0" />
        <span className={cn('font-medium italic text-foreground/90 truncate', styles.quote)}>
          "{currentReview.text}"
        </span>
        <span className={cn('flex items-center gap-1 font-semibold text-muted-foreground flex-shrink-0', styles.author)}>
          — {currentReview.author}
          {currentReview.verified && (
            <BadgeCheck size={12} className="text-primary" aria-label="Verified buyer" />
          )}
        </span>
      </div>

      {/* Navigation */}
      {showNavigation && reviews.length > 1 && (
        <div className="flex items-center gap-1.5 ml-auto">
          <button 
            onClick={goToPrev} 
            className={cn(
              'flex items-center justify-center bg-white/5 rounded hover:bg-white/10 text-muted-foreground hover:text-foreground transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2',
              styles.nav
            )}
            aria-label="Previous review"
          >
            <ChevronLeft size={14} />
          </button>
          <div className="flex gap-1">
            {reviews.map((_, idx) => (
              <button
                key={idx}
                onClick={() => setCurrentIndex(idx)}
                className={cn(
                  'w-1.5 h-1.5 rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary',
                  idx === currentIndex ? 'bg-amber-500' : 'bg-white/20 hover:bg-white/40'
                )}
                aria-label={`Go to review ${idx + 1} of ${reviews.length}`}
                aria-current={idx === currentIndex ? 'true' : 'false'}
              />
            ))}
          </div>
          <button 
            onClick={goToNext} 
            className={cn(
              'flex items-center justify-center bg-white/5 rounded hover:bg-white/10 text-muted-foreground hover:text-foreground transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2',
              styles.nav
            )}
            aria-label="Next review"
          >
            <ChevronRight size={14} />
          </button>
        </div>
      )}
    </div>
  );
};
