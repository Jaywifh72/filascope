import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

interface FilamentHeroGalleryProps {
  images: (string | null | undefined)[];
  productTitle: string;
  colorHex?: string | null;
}

export function FilamentHeroGallery({ images, productTitle, colorHex }: FilamentHeroGalleryProps) {
  const [selectedIndex, setSelectedIndex] = useState(0);
  
  // Filter out null/undefined images
  const validImages = images.filter((img): img is string => !!img);
  
  // Reset to first image when images array changes (e.g., color variant selection)
  useEffect(() => {
    setSelectedIndex(0);
  }, [images[0]]);
  
  // If no valid images, show color swatch or placeholder
  const hasImages = validImages.length > 0;
  const currentImage = hasImages ? validImages[selectedIndex] : null;

  const goToPrevious = () => {
    setSelectedIndex(prev => prev === 0 ? validImages.length - 1 : prev - 1);
  };

  const goToNext = () => {
    setSelectedIndex(prev => prev === validImages.length - 1 ? 0 : prev + 1);
  };

  return (
    <div className="flex flex-col gap-4">
      {/* Main Image Container */}
      <div className="relative aspect-square max-w-[500px] w-full bg-white/[0.03] border border-white/[0.08] rounded-2xl overflow-hidden group">
        {currentImage ? (
          <img
            src={currentImage}
            alt={productTitle}
            className="w-full h-full object-contain p-6"
          />
        ) : colorHex ? (
          // Color swatch fallback
          <div className="w-full h-full flex items-center justify-center p-12">
            <div 
              className="w-full h-full rounded-xl shadow-lg"
              style={{ backgroundColor: colorHex.startsWith('#') ? colorHex : `#${colorHex}` }}
            />
          </div>
        ) : (
          // Placeholder
          <div className="w-full h-full flex items-center justify-center text-muted-foreground">
            <span className="text-sm">No image available</span>
          </div>
        )}

        {/* Navigation Arrows - only show if multiple images */}
        {validImages.length > 1 && (
          <>
            <button
              onClick={goToPrevious}
              className={cn(
                "absolute left-3 top-1/2 -translate-y-1/2",
                "w-10 h-10 rounded-full",
                "bg-background/80 backdrop-blur-sm border border-white/10",
                "flex items-center justify-center",
                "text-white cursor-pointer",
                "opacity-0 group-hover:opacity-100 transition-opacity duration-200",
                "hover:bg-primary/20 hover:border-primary/30",
                "md:opacity-0 md:group-hover:opacity-100",
                "max-md:opacity-100"
              )}
              aria-label="Previous image"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button
              onClick={goToNext}
              className={cn(
                "absolute right-3 top-1/2 -translate-y-1/2",
                "w-10 h-10 rounded-full",
                "bg-background/80 backdrop-blur-sm border border-white/10",
                "flex items-center justify-center",
                "text-white cursor-pointer",
                "opacity-0 group-hover:opacity-100 transition-opacity duration-200",
                "hover:bg-primary/20 hover:border-primary/30",
                "md:opacity-0 md:group-hover:opacity-100",
                "max-md:opacity-100"
              )}
              aria-label="Next image"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </>
        )}
      </div>

      {/* Thumbnail Row */}
      {validImages.length > 1 && (
        <div className="flex gap-3 overflow-x-auto pb-1 scrollbar-thin">
          {validImages.map((img, idx) => (
            <button
              key={idx}
              onClick={() => setSelectedIndex(idx)}
              className={cn(
                "flex-shrink-0 w-[72px] h-[72px] rounded-lg overflow-hidden",
                "bg-white/[0.03] border-2 transition-all duration-200",
                "p-2 cursor-pointer",
                idx === selectedIndex 
                  ? "border-primary" 
                  : "border-white/10 hover:border-white/30"
              )}
              aria-label={`View image ${idx + 1}`}
            >
              <img
                src={img}
                alt=""
                className="w-full h-full object-contain"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
