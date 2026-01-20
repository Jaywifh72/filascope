import { useState, useEffect } from "react";
import { Star, Check } from "lucide-react";
import { cn } from "@/lib/utils";

interface Review {
  id: string;
  rating: number;
  text: string;
  author: string;
  verified: boolean;
}

interface OperatorLogsProps {
  reviews: Review[];
  rating: number | null;
  reviewCount: number | null;
  onReadReviews?: () => void;
}

function OperatorLogEntry({ review }: { review: Review }) {
  // Extract initials from author name
  const initials = review.author
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  // Generate a pseudo-timestamp
  const timestamp = `2024-${String(Math.floor(Math.random() * 12) + 1).padStart(2, '0')}-${String(Math.floor(Math.random() * 28) + 1).padStart(2, '0')} ${String(Math.floor(Math.random() * 24)).padStart(2, '0')}:${String(Math.floor(Math.random() * 60)).padStart(2, '0')} UTC`;

  return (
    <div className="border border-white/10 bg-white/[0.02] p-4 space-y-3 hover:border-primary/30 transition-colors">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          {/* Hexagonal avatar */}
          <div 
            className="w-10 h-10 bg-primary/20 border border-primary/40 flex items-center justify-center font-mono text-sm font-bold text-primary"
            style={{ clipPath: 'polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)' }}
          >
            {initials}
          </div>
          <div>
            <div className="font-mono text-xs text-muted-foreground uppercase tracking-wider">
              OPERATOR: <span className="text-foreground">{review.author}</span>
            </div>
            <div className="font-mono text-[10px] text-muted-foreground/60 uppercase tracking-wider">
              TIMESTAMP: {timestamp}
            </div>
          </div>
        </div>
        
        {/* Rating */}
        <div className="flex gap-0.5">
          {Array.from({ length: 5 }).map((_, i) => (
            <Star 
              key={i} 
              size={12} 
              className={i < review.rating ? 'fill-amber-400 text-amber-400' : 'text-white/20'}
            />
          ))}
        </div>
      </div>
      
      {/* Log entry */}
      <div className="space-y-1">
        <div className="font-mono text-[10px] text-primary/70 uppercase tracking-wider">
          LOG_ENTRY:
        </div>
        <blockquote className="text-sm text-muted-foreground italic pl-3 border-l-2 border-primary/30">
          "{review.text}"
        </blockquote>
      </div>
      
      {/* Status */}
      {review.verified && (
        <div className="flex items-center gap-2 pt-1">
          <div className="font-mono text-[10px] text-muted-foreground/60 uppercase tracking-wider">
            STATUS:
          </div>
          <div className="inline-flex items-center gap-1.5 px-2 py-0.5 bg-green-500/10 border border-green-500/30 text-green-500 font-mono text-[10px] uppercase tracking-wider">
            <Check size={10} />
            VERIFIED_BUYER
          </div>
        </div>
      )}
    </div>
  );
}

export function OperatorLogs({ reviews, rating, reviewCount, onReadReviews }: OperatorLogsProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  useEffect(() => {
    if (isPaused || reviews.length <= 1) return;

    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % reviews.length);
    }, 10000);

    return () => clearInterval(interval);
  }, [isPaused, reviews.length]);

  if (!rating && reviews.length === 0) return null;

  return (
    <div className="space-y-4">
      {/* Section Header */}
      <div className="flex items-center justify-between">
        <h3 className="font-mono text-xs uppercase tracking-[0.2em] text-primary">
          &gt;&gt; OPERATOR_LOGS
        </h3>
        {reviewCount && (
          <span className="font-mono text-[10px] text-muted-foreground uppercase">
            TOTAL_ENTRIES: {reviewCount}
          </span>
        )}
      </div>

      {/* Rating Summary */}
      {rating && (
        <div className="flex items-center gap-4 p-4 border border-white/10 bg-white/[0.02]">
          <div className="text-center">
            <div className="font-mono text-2xl font-bold text-primary">{rating.toFixed(1)}</div>
            <div className="flex gap-0.5 mt-1">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star 
                  key={i} 
                  size={12} 
                  className={i < Math.round(rating) ? 'fill-amber-400 text-amber-400' : 'text-white/20'}
                />
              ))}
            </div>
          </div>
          <div className="flex-1 border-l border-white/10 pl-4">
            <div className="font-mono text-[10px] text-muted-foreground uppercase tracking-wider">
              AGGREGATE_RATING
            </div>
            <div className="font-mono text-xs text-foreground mt-1">
              Based on {reviewCount || 0} operator submissions
            </div>
          </div>
        </div>
      )}

      {/* Current Review */}
      {reviews.length > 0 && (
        <div 
          onMouseEnter={() => setIsPaused(true)}
          onMouseLeave={() => setIsPaused(false)}
        >
          <OperatorLogEntry review={reviews[currentIndex]} />
          
          {/* Navigation dots */}
          {reviews.length > 1 && (
            <div className="flex justify-center gap-2 mt-3">
              {reviews.map((_, index) => (
                <button
                  key={index}
                  className={cn(
                    "w-2 h-2 transition-all",
                    index === currentIndex 
                      ? "bg-primary" 
                      : "bg-white/20 hover:bg-white/40"
                  )}
                  onClick={() => setCurrentIndex(index)}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* Read All Button */}
      {onReadReviews && (
        <button 
          onClick={onReadReviews}
          className="w-full h-10 bg-transparent border border-primary/30 font-mono text-xs uppercase tracking-wider text-primary flex items-center justify-center gap-2 transition-all hover:bg-primary/10 hover:border-primary/50"
        >
          ACCESS_FULL_LOGS
        </button>
      )}
    </div>
  );
}
