import { useState, useEffect, useCallback, useRef } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { ChevronLeft, ChevronRight, X, ZoomIn, ZoomOut } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ImageLightboxProps {
  images: string[];
  initialIndex?: number;
  isOpen: boolean;
  onClose: () => void;
  productTitle?: string;
}

export function ImageLightbox({
  images,
  initialIndex = 0,
  isOpen,
  onClose,
  productTitle,
}: ImageLightboxProps) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [scale, setScale] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const lastPinchDistance = useRef<number | null>(null);
  const lastTouchPosition = useRef({ x: 0, y: 0 });
  const containerRef = useRef<HTMLDivElement>(null);

  // Reset state when opening or changing index
  useEffect(() => {
    setCurrentIndex(initialIndex);
    setScale(1);
    setPosition({ x: 0, y: 0 });
  }, [initialIndex, isOpen]);

  const goToPrevious = useCallback(() => {
    setCurrentIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1));
    setScale(1);
    setPosition({ x: 0, y: 0 });
  }, [images.length]);

  const goToNext = useCallback(() => {
    setCurrentIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1));
    setScale(1);
    setPosition({ x: 0, y: 0 });
  }, [images.length]);

  // Keyboard navigation
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") goToPrevious();
      if (e.key === "ArrowRight") goToNext();
      if (e.key === "Escape") onClose();
      if (e.key === "+" || e.key === "=") setScale((s) => Math.min(s + 0.5, 4));
      if (e.key === "-") setScale((s) => Math.max(s - 0.5, 1));
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, goToPrevious, goToNext, onClose]);

  // Pinch to zoom handling
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (e.touches.length === 2) {
      const distance = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY
      );
      lastPinchDistance.current = distance;
    } else if (e.touches.length === 1 && scale > 1) {
      setIsDragging(true);
      lastTouchPosition.current = {
        x: e.touches[0].clientX,
        y: e.touches[0].clientY,
      };
    }
  }, [scale]);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (e.touches.length === 2 && lastPinchDistance.current !== null) {
      const distance = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY
      );
      const delta = distance - lastPinchDistance.current;
      setScale((s) => Math.min(Math.max(s + delta * 0.01, 1), 4));
      lastPinchDistance.current = distance;
    } else if (e.touches.length === 1 && isDragging && scale > 1) {
      const deltaX = e.touches[0].clientX - lastTouchPosition.current.x;
      const deltaY = e.touches[0].clientY - lastTouchPosition.current.y;
      setPosition((p) => ({ x: p.x + deltaX, y: p.y + deltaY }));
      lastTouchPosition.current = {
        x: e.touches[0].clientX,
        y: e.touches[0].clientY,
      };
    }
  }, [isDragging, scale]);

  const handleTouchEnd = useCallback(() => {
    lastPinchDistance.current = null;
    setIsDragging(false);
  }, []);

  // Zoom controls
  const zoomIn = () => setScale((s) => Math.min(s + 0.5, 4));
  const zoomOut = () => {
    setScale((s) => {
      const newScale = Math.max(s - 0.5, 1);
      if (newScale === 1) setPosition({ x: 0, y: 0 });
      return newScale;
    });
  };

  // Double tap to zoom
  const lastTapTime = useRef(0);
  const handleDoubleTap = useCallback(() => {
    const now = Date.now();
    if (now - lastTapTime.current < 300) {
      if (scale > 1) {
        setScale(1);
        setPosition({ x: 0, y: 0 });
      } else {
        setScale(2);
      }
    }
    lastTapTime.current = now;
  }, [scale]);

  if (images.length === 0) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent 
        className="max-w-[100vw] max-h-[100vh] w-screen h-screen p-0 overflow-hidden bg-black/95 border-none"
        aria-label={`Image gallery${productTitle ? ` for ${productTitle}` : ''}`}
        aria-describedby="lightbox-description"
      >
        <span id="lightbox-description" className="sr-only">
          Use arrow keys to navigate between images. Press Escape to close. 
          {images.length > 1 ? ` Viewing image ${currentIndex + 1} of ${images.length}.` : ''}
        </span>
        <div
          ref={containerRef}
          className="relative w-full h-full flex items-center justify-center touch-none"
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          onClick={handleDoubleTap}
          role="group"
          aria-roledescription="Image viewer"
        >
          {/* Close Button */}
          <Button
            variant="ghost"
            size="icon"
            className="absolute top-4 right-4 z-50 text-white hover:bg-white/20 min-h-[44px] min-w-[44px]"
            onClick={(e) => {
              e.stopPropagation();
              onClose();
            }}
            aria-label="Close image viewer"
          >
            <X className="h-6 w-6" />
          </Button>

          {/* Zoom Controls (Desktop) */}
          <div className="hidden md:flex absolute top-4 left-4 z-50 gap-2" role="group" aria-label="Zoom controls">
            <Button
              variant="ghost"
              size="icon"
              className="text-white hover:bg-white/20"
              onClick={(e) => {
                e.stopPropagation();
                zoomIn();
              }}
              disabled={scale >= 4}
              aria-label={`Zoom in. Current zoom: ${Math.round(scale * 100)}%`}
            >
              <ZoomIn className="h-5 w-5" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="text-white hover:bg-white/20"
              onClick={(e) => {
                e.stopPropagation();
                zoomOut();
              }}
              disabled={scale <= 1}
              aria-label={`Zoom out. Current zoom: ${Math.round(scale * 100)}%`}
            >
              <ZoomOut className="h-5 w-5" />
            </Button>
            <span className="text-white/60 text-sm flex items-center px-2">
              {Math.round(scale * 100)}%
            </span>
          </div>

          {/* Image Counter */}
          {images.length > 1 && (
            <div className="absolute top-4 left-1/2 -translate-x-1/2 z-50 bg-black/60 text-white px-4 py-2 rounded-full text-sm" role="status" aria-live="polite">
              {currentIndex + 1} / {images.length}
            </div>
          )}

          {/* Previous Button */}
          {images.length > 1 && (
            <Button
              variant="ghost"
              size="icon"
              className="absolute left-4 z-50 text-white hover:bg-white/20 h-12 w-12 min-h-[44px] min-w-[44px]"
              onClick={(e) => {
                e.stopPropagation();
                goToPrevious();
              }}
              aria-label="Previous image"
            >
              <ChevronLeft className="h-8 w-8" />
            </Button>
          )}

          {/* Main Image */}
          <div
            className={cn(
              "max-w-[90vw] max-h-[85vh] transition-transform duration-200",
              scale > 1 && "cursor-grab",
              isDragging && "cursor-grabbing transition-none"
            )}
            style={{
              transform: `scale(${scale}) translate(${position.x / scale}px, ${position.y / scale}px)`,
            }}
          >
            <img
              src={images[currentIndex]}
              alt={productTitle || `Image ${currentIndex + 1}`}
              className="max-w-full max-h-[85vh] object-contain select-none"
              draggable={false}
            />
          </div>

          {/* Next Button */}
          {images.length > 1 && (
            <Button
              variant="ghost"
              size="icon"
              className="absolute right-4 z-50 text-white hover:bg-white/20 h-12 w-12 min-h-[44px] min-w-[44px]"
              onClick={(e) => {
                e.stopPropagation();
                goToNext();
              }}
              aria-label="Next image"
            >
              <ChevronRight className="h-8 w-8" />
            </Button>
          )}

          {/* Dot Indicators */}
          {images.length > 1 && (
            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-2 px-3 py-2 bg-black/40 backdrop-blur-sm rounded-full">
              {images.map((_, index) => (
                <button
                  key={index}
                  className={cn(
                    "h-2 rounded-full transition-all duration-300",
                    index === currentIndex
                      ? "w-6 bg-primary"
                      : "w-2 bg-white/40 hover:bg-white/60"
                  )}
                  onClick={(e) => {
                    e.stopPropagation();
                    setCurrentIndex(index);
                    setScale(1);
                    setPosition({ x: 0, y: 0 });
                  }}
                  aria-label={`View image ${index + 1}`}
                />
              ))}
            </div>
          )}

          {/* Mobile Zoom Hint */}
          <div className="md:hidden absolute bottom-16 left-1/2 -translate-x-1/2 text-white/50 text-xs">
            Pinch to zoom • Double-tap to toggle
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
