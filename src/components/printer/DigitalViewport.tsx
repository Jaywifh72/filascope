import { useState } from "react";
import { Box } from "lucide-react";
import { getOptimizedImageUrl } from "@/utils/imageOptimization";

interface DigitalViewportProps {
  images: string[];
  productName: string;
  onOpenLightbox: (index: number) => void;
}

export function DigitalViewport({ images, productName, onOpenLightbox }: DigitalViewportProps) {
  const [selectedIndex, setSelectedIndex] = useState(0);

  if (images.length === 0) {
    return (
      <div className="relative h-[280px] bg-[#0A0C10] border border-primary/20 rounded-none flex items-center justify-center">
        {/* Corner brackets */}
        <div className="absolute top-0 left-0 w-6 h-6 border-l-2 border-t-2 border-primary" />
        <div className="absolute top-0 right-0 w-6 h-6 border-r-2 border-t-2 border-primary" />
        <div className="absolute bottom-0 left-0 w-6 h-6 border-l-2 border-b-2 border-primary" />
        <div className="absolute bottom-0 right-0 w-6 h-6 border-r-2 border-b-2 border-primary" />
        
        <Box className="h-20 w-20 text-muted-foreground/30" />
        
        {/* HUD overlay */}
        <div className="absolute top-3 left-4 font-mono text-[10px] text-primary/60 uppercase tracking-wider">
          IMG_SOURCE: NO_SIGNAL
        </div>
      </div>
    );
  }

  const handleThumbnailClick = (index: number) => {
    setSelectedIndex(index);
  };

  return (
    <div className="space-y-3">
      {/* Main Viewport */}
      <div 
        className="relative h-[280px] bg-[#0A0C10] border border-primary/30 cursor-pointer group overflow-hidden"
        onClick={() => onOpenLightbox(selectedIndex)}
        role="button"
        aria-label={`View ${productName} product image in fullscreen`}
      >
        {/* Corner brackets */}
        <div className="absolute top-0 left-0 w-6 h-6 border-l-2 border-t-2 border-primary z-10" />
        <div className="absolute top-0 right-0 w-6 h-6 border-r-2 border-t-2 border-primary z-10" />
        <div className="absolute bottom-0 left-0 w-6 h-6 border-l-2 border-b-2 border-primary z-10" />
        <div className="absolute bottom-0 right-0 w-6 h-6 border-r-2 border-b-2 border-primary z-10" />
        
        {/* Grid background */}
        <div 
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: `
              linear-gradient(to right, hsl(var(--primary)) 1px, transparent 1px),
              linear-gradient(to bottom, hsl(var(--primary)) 1px, transparent 1px)
            `,
            backgroundSize: '20px 20px'
          }}
        />
        
        {/* Scanline effect on hover */}
        <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none overflow-hidden">
          <div className="absolute left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-primary/60 to-transparent animate-scan" />
        </div>
        
        {/* HUD overlays */}
        <div className="absolute top-3 left-4 font-mono text-[10px] text-primary/70 uppercase tracking-wider z-10">
          IMG_SOURCE: LIVE_FEED
        </div>
        <div className="absolute top-3 right-4 font-mono text-[10px] text-primary/70 uppercase tracking-wider z-10">
          SCALE: 1:1
        </div>
        <div className="absolute bottom-3 left-4 font-mono text-[10px] text-primary/70 uppercase tracking-wider z-10">
          [{String(selectedIndex + 1).padStart(2, '0')}/{String(images.length).padStart(2, '0')}]
        </div>
        <div className="absolute bottom-3 right-4 font-mono text-[10px] text-muted-foreground/50 uppercase tracking-wider z-10">
          CLICK TO EXPAND
        </div>
        
        {/* Main Image */}
        <div className="absolute inset-8 flex items-center justify-center">
          <img 
            src={getOptimizedImageUrl(images[selectedIndex], 560)} 
            alt={`${productName} product image`}
            className="max-w-full max-h-full object-contain transition-transform duration-300 group-hover:scale-[1.02]"
          />
        </div>
      </div>
      
      {/* Thumbnail Grid */}
      {images.length > 1 && (
        <div className="grid grid-cols-4 gap-2">
          {images.slice(0, 4).map((img, idx) => (
            <button 
              key={idx} 
              className={`relative h-[60px] bg-[#0A0C10] border p-1.5 flex items-center justify-center cursor-pointer transition-all duration-200 hover:border-primary ${
                idx === selectedIndex 
                  ? 'border-primary bg-primary/10' 
                  : 'border-white/10 hover:bg-white/5'
              }`}
              onClick={(e) => {
                e.stopPropagation();
                handleThumbnailClick(idx);
              }}
              aria-label={`View ${productName} image ${idx + 1}`}
            >
              {/* Mini corner brackets for selected */}
              {idx === selectedIndex && (
                <>
                  <div className="absolute top-0 left-0 w-2 h-2 border-l border-t border-primary" />
                  <div className="absolute top-0 right-0 w-2 h-2 border-r border-t border-primary" />
                  <div className="absolute bottom-0 left-0 w-2 h-2 border-l border-b border-primary" />
                  <div className="absolute bottom-0 right-0 w-2 h-2 border-r border-b border-primary" />
                </>
              )}
              <img 
                src={getOptimizedImageUrl(img, 120)} 
                alt={`${productName} view ${idx + 1}`}
                className="max-w-full max-h-full object-contain"
                loading="lazy"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
