import React, { useState, useEffect } from 'react';
import { Quote } from 'lucide-react';
import { cn } from '@/lib/utils';

interface MicroReviewProps {
  reviews: Array<{
    text: string;
    author: string;
  }>;
  autoRotate?: boolean;
  maxLength?: number;
  className?: string;
}

export const MicroReview: React.FC<MicroReviewProps> = ({
  reviews,
  autoRotate = true,
  maxLength = 30,
  className
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);

  // Check for reduced motion preference
  const prefersReducedMotion = typeof window !== 'undefined' 
    ? window.matchMedia('(prefers-reduced-motion: reduce)').matches 
    : false;

  useEffect(() => {
    if (!autoRotate || reviews.length <= 1 || prefersReducedMotion) return;

    const interval = setInterval(() => {
      setCurrentIndex(prev => (prev + 1) % reviews.length);
    }, 4000);

    return () => clearInterval(interval);
  }, [autoRotate, reviews.length, prefersReducedMotion]);

  const currentReview = reviews[currentIndex];
  if (!currentReview || reviews.length === 0) return null;

  // Truncate text if needed
  const displayText = currentReview.text.length > maxLength
    ? currentReview.text.substring(0, maxLength) + '...'
    : currentReview.text;

  return (
    <div 
      className={cn(
        'flex items-center gap-1 py-1 px-2 bg-amber-500/[0.08] rounded max-w-[180px]',
        className
      )}
      aria-live="polite"
    >
      <Quote size={10} className="text-amber-500/70 flex-shrink-0" />
      <span className="text-[11px] font-medium italic text-foreground/90 truncate">
        "{displayText}"
      </span>
    </div>
  );
};
