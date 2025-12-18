import React, { useState, useRef, useCallback, useEffect } from 'react';
import { ZoomIn, Share2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { GalleryImage } from './types';

interface SwipeableGalleryProps {
  images: GalleryImage[];
  onShare?: () => void;
  onZoom?: (index: number) => void;
  className?: string;
}

const SwipeableGallery: React.FC<SwipeableGalleryProps> = ({
  images,
  onShare,
  onZoom,
  className,
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState(0);
  const [showSwipeHint, setShowSwipeHint] = useState(true);
  const containerRef = useRef<HTMLDivElement>(null);
  const startXRef = useRef(0);
  const startTimeRef = useRef(0);

  const SWIPE_THRESHOLD = 50;
  const VELOCITY_THRESHOLD = 0.5;

  // Hide swipe hint after 3 seconds
  useEffect(() => {
    if (images.length > 1) {
      const timer = setTimeout(() => setShowSwipeHint(false), 3000);
      return () => clearTimeout(timer);
    }
  }, [images.length]);

  // Handle touch start
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    startXRef.current = e.touches[0].clientX;
    startTimeRef.current = Date.now();
    setIsDragging(true);
  }, []);

  // Handle touch move
  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (!isDragging) return;
    
    const currentX = e.touches[0].clientX;
    const diff = currentX - startXRef.current;
    
    // Add resistance at edges
    if ((currentIndex === 0 && diff > 0) || 
        (currentIndex === images.length - 1 && diff < 0)) {
      setDragOffset(diff * 0.3); // Rubber band effect
    } else {
      setDragOffset(diff);
    }
  }, [isDragging, currentIndex, images.length]);

  // Handle touch end
  const handleTouchEnd = useCallback(() => {
    if (!isDragging) return;
    
    const endTime = Date.now();
    const duration = endTime - startTimeRef.current;
    const velocity = Math.abs(dragOffset) / duration;
    
    // Determine if swipe should trigger navigation
    const shouldNavigate = 
      Math.abs(dragOffset) > SWIPE_THRESHOLD || 
      velocity > VELOCITY_THRESHOLD;

    if (shouldNavigate) {
      if (dragOffset > 0 && currentIndex > 0) {
        setCurrentIndex(prev => prev - 1);
      } else if (dragOffset < 0 && currentIndex < images.length - 1) {
        setCurrentIndex(prev => prev + 1);
      }
    }

    setIsDragging(false);
    setDragOffset(0);
  }, [isDragging, dragOffset, currentIndex, images.length]);

  // Go to specific image
  const goToImage = (index: number) => {
    setCurrentIndex(Math.max(0, Math.min(index, images.length - 1)));
  };

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft' && currentIndex > 0) {
        setCurrentIndex(prev => prev - 1);
      } else if (e.key === 'ArrowRight' && currentIndex < images.length - 1) {
        setCurrentIndex(prev => prev + 1);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentIndex, images.length]);

  // Calculate offset percentage
  const containerWidth = containerRef.current?.offsetWidth || 1;
  const offsetPercent = -currentIndex * 100 + (dragOffset / containerWidth) * 100;

  if (images.length === 0) {
    return (
      <div className={cn(
        "relative w-full h-[60vh] max-h-[400px] min-h-[280px] bg-background flex items-center justify-center",
        className
      )}>
        <span className="text-muted-foreground">No images available</span>
      </div>
    );
  }

  return (
    <div 
      ref={containerRef}
      className={cn(
        "relative w-full h-[60vh] max-h-[400px] min-h-[280px] bg-background overflow-hidden",
        "touch-pan-y",
        className
      )}
    >
      {/* Image Track */}
      <div
        className={cn(
          "flex h-full will-change-transform",
          !isDragging && "transition-transform duration-300 ease-out"
        )}
        style={{ transform: `translateX(${offsetPercent}%)` }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {images.map((image, index) => (
          <div 
            key={index}
            className="flex-shrink-0 w-full h-full flex items-center justify-center p-4"
          >
            <img 
              src={image.url} 
              alt={image.alt}
              loading={index === 0 ? 'eager' : 'lazy'}
              draggable={false}
              className="max-w-full max-h-full w-auto h-auto object-contain select-none"
            />
          </div>
        ))}
      </div>

      {/* Action Buttons */}
      <div className="absolute top-3 right-3 flex gap-2">
        {onZoom && (
          <button 
            onClick={() => onZoom(currentIndex)}
            aria-label="Zoom image"
            className="flex items-center justify-center w-11 h-11 bg-black/50 backdrop-blur-sm border border-white/10 rounded-xl text-white transition-all hover:bg-black/70 active:scale-95"
          >
            <ZoomIn size={20} />
          </button>
        )}
        {onShare && (
          <button 
            onClick={onShare}
            aria-label="Share product"
            className="flex items-center justify-center w-11 h-11 bg-black/50 backdrop-blur-sm border border-white/10 rounded-xl text-white transition-all hover:bg-black/70 active:scale-95"
          >
            <Share2 size={20} />
          </button>
        )}
      </div>

      {/* Dot Indicators */}
      {images.length > 1 && (
        <div 
          className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2 px-3 py-2 bg-black/40 backdrop-blur-sm rounded-full"
          role="tablist" 
          aria-label="Image gallery navigation"
        >
          {images.map((_, index) => (
            <button
              key={index}
              className={cn(
                "h-2 rounded-full transition-all duration-300",
                index === currentIndex 
                  ? "w-6 bg-primary" 
                  : "w-2 bg-white/40 hover:bg-white/60"
              )}
              onClick={() => goToImage(index)}
              role="tab"
              aria-selected={index === currentIndex}
              aria-label={`View image ${index + 1} of ${images.length}`}
              tabIndex={index === currentIndex ? 0 : -1}
            />
          ))}
        </div>
      )}

      {/* Image Counter */}
      <div className="absolute bottom-4 left-4 px-2.5 py-1.5 bg-black/50 backdrop-blur-sm rounded-lg text-xs font-semibold text-white">
        {currentIndex + 1} / {images.length}
      </div>

      {/* Swipe Hint */}
      {showSwipeHint && images.length > 1 && currentIndex === 0 && (
        <div className="absolute bottom-16 left-1/2 -translate-x-1/2 px-4 py-2 bg-primary/90 rounded-full text-xs font-semibold text-primary-foreground animate-pulse pointer-events-none">
          ← Swipe to see more →
        </div>
      )}
    </div>
  );
};

export default SwipeableGallery;
