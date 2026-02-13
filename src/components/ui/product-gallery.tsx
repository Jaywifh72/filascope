import { useState, useRef, useCallback, useEffect } from "react";
import { cn } from "@/lib/utils";
import { ChevronLeft, ChevronRight, Maximize2, Palette, ZoomIn } from "lucide-react";
import { ZoomImage } from "./zoom-image";
import { ImageLightbox } from "./image-lightbox";
import { Skeleton } from "./skeleton";
import { Badge } from "./badge";
import { getOptimizedImageUrl } from "@/utils/imageOptimization";

interface GalleryImage {
  url: string;
  alt?: string;
  colorHex?: string;
  colorName?: string;
}

interface ProductGalleryProps {
  images: GalleryImage[];
  productTitle: string;
  fallbackColorHex?: string | null;
  className?: string;
  onColorSwatchClick?: (colorHex: string) => void;
  colorSwatches?: Array<{ hex: string; name?: string; hasImage: boolean }>;
  selectedColorHex?: string | null;
}

export function ProductGallery({
  images,
  productTitle,
  fallbackColorHex,
  className,
  onColorSwatchClick,
  colorSwatches,
  selectedColorHex,
}: ProductGalleryProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState(0);
  const startXRef = useRef(0);
  const containerRef = useRef<HTMLDivElement>(null);

  // Filter valid images
  const validImages = images.filter((img) => img.url);

  // Reset to first image when images change
  useEffect(() => {
    setCurrentIndex(0);
  }, [images[0]?.url]);

  // Swipe handlers for mobile
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    startXRef.current = e.touches[0].clientX;
    setIsDragging(true);
  }, []);

  const handleTouchMove = useCallback(
    (e: React.TouchEvent) => {
      if (!isDragging) return;
      const diff = e.touches[0].clientX - startXRef.current;

      // Add resistance at edges
      if (
        (currentIndex === 0 && diff > 0) ||
        (currentIndex === validImages.length - 1 && diff < 0)
      ) {
        setDragOffset(diff * 0.3);
      } else {
        setDragOffset(diff);
      }
    },
    [isDragging, currentIndex, validImages.length]
  );

  const handleTouchEnd = useCallback(() => {
    if (!isDragging) return;

    const threshold = 50;
    if (dragOffset > threshold && currentIndex > 0) {
      setCurrentIndex((prev) => prev - 1);
    } else if (dragOffset < -threshold && currentIndex < validImages.length - 1) {
      setCurrentIndex((prev) => prev + 1);
    }

    setIsDragging(false);
    setDragOffset(0);
  }, [isDragging, dragOffset, currentIndex, validImages.length]);

  const goToPrevious = () => {
    setCurrentIndex((prev) => (prev === 0 ? validImages.length - 1 : prev - 1));
  };

  const goToNext = () => {
    setCurrentIndex((prev) => (prev === validImages.length - 1 ? 0 : prev + 1));
  };

  const handleColorSwatchClick = (hex: string, hasImage: boolean) => {
    if (onColorSwatchClick) {
      onColorSwatchClick(hex);
    }
  };

  // No images - show color swatch or placeholder
  if (validImages.length === 0) {
    return (
      <div className={cn("space-y-4", className)}>
        <div className="relative aspect-square bg-muted/20 rounded-xl border border-border/50 flex items-center justify-center overflow-hidden">
          {fallbackColorHex ? (
            <div className="relative w-full h-full">
              <div
                className="absolute inset-8 rounded-xl shadow-lg"
                style={{
                  backgroundColor: fallbackColorHex.startsWith("#")
                    ? fallbackColorHex
                    : `#${fallbackColorHex}`,
                }}
              />
              <Badge
                variant="secondary"
                className="absolute bottom-4 left-1/2 -translate-x-1/2 gap-1"
              >
                <Palette className="w-3 h-3" />
                Color Preview Only
              </Badge>
            </div>
          ) : (
            <div className="text-muted-foreground text-sm">No image available</div>
          )}
        </div>
      </div>
    );
  }

  const imageUrls = validImages.map((img) => img.url);

  return (
    <div className={cn("space-y-4 border border-border/30 rounded-xl overflow-hidden", className)}>
      {/* Main Image Container */}
      <div
        ref={containerRef}
        className={cn(
          "relative bg-gradient-to-b from-muted/5 to-muted/10 border border-border/50 rounded-xl overflow-hidden group",
          validImages.length === 1 ? "max-h-[400px]" : "aspect-square"
        )}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {/* Image Track (for swipe animation) */}
        <div
          className={cn(
            "flex h-full will-change-transform",
            !isDragging && "transition-transform duration-300 ease-out"
          )}
          style={{
            transform: `translateX(calc(-${currentIndex * 100}% + ${dragOffset}px))`,
          }}
        >
          {validImages.map((image, index) => (
            <div key={index} className="flex-shrink-0 w-full h-full p-6 transition-transform duration-300 ease-out group-hover:scale-105">
              <ZoomImage
                src={image.url}
                alt={image.alt || productTitle}
                className="w-full h-full"
                containerClassName="w-full h-full"
                onClick={() => setLightboxOpen(true)}
                zoomScale={2.5}
              />
            </div>
          ))}
        </div>

        {/* Bottom gradient overlay */}
        <div className="absolute bottom-0 left-0 right-0 h-8 bg-gradient-to-t from-background/80 via-transparent pointer-events-none" />

        {/* Navigation Arrows (Desktop) */}
        {validImages.length > 1 && (
          <>
            <button
              onClick={goToPrevious}
              className={cn(
                "hidden md:flex absolute left-3 top-1/2 -translate-y-1/2",
                "w-10 h-10 rounded-full",
                "bg-background/80 backdrop-blur-sm border border-white/10",
                "items-center justify-center",
                "text-white cursor-pointer",
                "opacity-0 group-hover:opacity-100 transition-opacity duration-200",
                "hover:bg-primary/20 hover:border-primary/30"
              )}
              aria-label="Previous image"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button
              onClick={goToNext}
              className={cn(
                "hidden md:flex absolute right-3 top-1/2 -translate-y-1/2",
                "w-10 h-10 rounded-full",
                "bg-background/80 backdrop-blur-sm border border-white/10",
                "items-center justify-center",
                "text-white cursor-pointer",
                "opacity-0 group-hover:opacity-100 transition-opacity duration-200",
                "hover:bg-primary/20 hover:border-primary/30"
              )}
              aria-label="Next image"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </>
        )}

        {/* Click to zoom indicator */}
        <button
          onClick={() => setLightboxOpen(true)}
          className="absolute bottom-2 right-2 flex items-center gap-1 bg-background/80 backdrop-blur-sm text-muted-foreground text-xs px-2 py-1 rounded-lg border border-border/40 opacity-70 group-hover:opacity-100 transition-opacity duration-200 z-10"
          aria-label="Expand image"
        >
          <ZoomIn className="w-3 h-3" />
          <span>Click to zoom</span>
        </button>
      </div>

      {/* Thumbnail Strip */}
      {validImages.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-thin">
          {validImages.map((img, idx) => (
            <button
              key={idx}
              onClick={() => setCurrentIndex(idx)}
              className={cn(
                "relative flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden",
                "bg-white/[0.03] border-2 transition-all duration-200",
                "p-1.5 cursor-pointer min-h-[44px] min-w-[44px]",
                idx === currentIndex
                  ? "border-primary"
                  : "border-white/10 hover:border-white/30"
              )}
              aria-label={`View image ${idx + 1}`}
            >
              <img
                src={getOptimizedImageUrl(img.url, 128)}
                alt=""
                className="w-full h-full object-contain"
                loading="lazy"
                width={64}
                height={64}
              />
            </button>
          ))}
        </div>
      )}

      {/* Dot Indicators (Mobile) */}
      {validImages.length > 1 && (
        <div className="flex md:hidden justify-center gap-2">
          {validImages.map((_, index) => (
            <button
              key={index}
              className={cn(
                "h-2 rounded-full transition-all duration-300 min-w-[8px]",
                index === currentIndex
                  ? "w-6 bg-primary"
                  : "w-2 bg-white/30 hover:bg-white/50"
              )}
              onClick={() => setCurrentIndex(index)}
              aria-label={`View image ${index + 1}`}
            />
          ))}
        </div>
      )}

      {/* Color Swatches */}
      {colorSwatches && colorSwatches.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {colorSwatches.slice(0, 12).map((swatch, idx) => (
            <button
              key={idx}
              onClick={() => handleColorSwatchClick(swatch.hex, swatch.hasImage)}
              className={cn(
                "relative w-8 h-8 rounded-full border-2 transition-all duration-200 min-h-[32px] min-w-[32px]",
                "hover:scale-110",
                selectedColorHex === swatch.hex
                  ? "border-primary ring-2 ring-primary/30"
                  : "border-white/20 hover:border-white/40"
              )}
              style={{
                backgroundColor: swatch.hex.startsWith("#")
                  ? swatch.hex
                  : `#${swatch.hex}`,
              }}
              title={swatch.name || swatch.hex}
            >
              {!swatch.hasImage && (
                <div className="absolute -bottom-1 -right-1 w-3 h-3 rounded-full bg-muted border border-border flex items-center justify-center">
                  <Palette className="w-2 h-2 text-muted-foreground" />
                </div>
              )}
            </button>
          ))}
          {colorSwatches.length > 12 && (
            <span className="text-xs text-muted-foreground self-center">
              +{colorSwatches.length - 12} more
            </span>
          )}
        </div>
      )}

      {/* Lightbox */}
      <ImageLightbox
        images={imageUrls}
        initialIndex={currentIndex}
        isOpen={lightboxOpen}
        onClose={() => setLightboxOpen(false)}
        productTitle={productTitle}
      />
    </div>
  );
}

// Skeleton loader for gallery
export function ProductGallerySkeleton() {
  return (
    <div className="space-y-4">
      <Skeleton className="aspect-square rounded-2xl" />
      <div className="flex gap-2">
        {[1, 2, 3, 4].map((i) => (
          <Skeleton key={i} className="w-16 h-16 rounded-lg flex-shrink-0" />
        ))}
      </div>
    </div>
  );
}
