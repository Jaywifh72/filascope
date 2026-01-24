import { useState, useRef, useCallback } from "react";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import { ZoomIn } from "lucide-react";

interface ZoomImageProps {
  src: string;
  alt: string;
  className?: string;
  containerClassName?: string;
  zoomScale?: number;
  onClick?: () => void;
  showZoomHint?: boolean;
}

export function ZoomImage({
  src,
  alt,
  className,
  containerClassName,
  zoomScale = 2,
  onClick,
  showZoomHint = true,
}: ZoomImageProps) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [isError, setIsError] = useState(false);
  const [showZoom, setShowZoom] = useState(false);
  const [zoomPosition, setZoomPosition] = useState({ x: 50, y: 50 });
  const [lowResLoaded, setLowResLoaded] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Handle mouse move for zoom
  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!containerRef.current) return;
    
    const rect = containerRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    
    setZoomPosition({ x, y });
  }, []);

  // Generate low-res URL for blur-up (if using an image service)
  const lowResSrc = src;

  return (
    <div
      ref={containerRef}
      className={cn(
        "relative overflow-hidden cursor-zoom-in group",
        containerClassName
      )}
      onMouseEnter={() => setShowZoom(true)}
      onMouseLeave={() => setShowZoom(false)}
      onMouseMove={handleMouseMove}
      onClick={onClick}
    >
      {/* Skeleton Loader */}
      {!isLoaded && !isError && (
        <div className="absolute inset-0 flex items-center justify-center">
          <Skeleton className="w-full h-full rounded-none" />
        </div>
      )}

      {/* Low-res Blur-up Image */}
      {!isLoaded && lowResSrc && (
        <img
          src={lowResSrc}
          alt=""
          className={cn(
            "absolute inset-0 w-full h-full object-contain blur-sm scale-105 transition-opacity duration-300",
            lowResLoaded ? "opacity-30" : "opacity-0"
          )}
          onLoad={() => setLowResLoaded(true)}
        />
      )}

      {/* Main Image */}
      <img
        src={src}
        alt={alt}
        className={cn(
          "w-full h-full object-contain transition-all duration-300",
          isLoaded ? "opacity-100" : "opacity-0",
          className
        )}
        onLoad={() => {
          setIsLoaded(true);
          setIsError(false);
        }}
        onError={() => {
          setIsError(true);
          setIsLoaded(true);
        }}
        draggable={false}
      />

      {/* Zoom Lens Overlay (Desktop only) */}
      {showZoom && isLoaded && !isError && (
        <div
          className="hidden md:block absolute inset-0 pointer-events-none"
          style={{
            backgroundImage: `url(${src})`,
            backgroundPosition: `${zoomPosition.x}% ${zoomPosition.y}%`,
            backgroundSize: `${zoomScale * 100}%`,
            backgroundRepeat: "no-repeat",
          }}
        />
      )}

      {/* Zoom Hint Icon */}
      {showZoomHint && isLoaded && !isError && (
        <div className="absolute bottom-3 right-3 bg-black/50 backdrop-blur-sm rounded-full p-2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
          <ZoomIn className="w-4 h-4 text-white" />
        </div>
      )}

      {/* Error State */}
      {isError && (
        <div className="absolute inset-0 flex items-center justify-center bg-muted/30">
          <span className="text-muted-foreground text-sm">Failed to load image</span>
        </div>
      )}
    </div>
  );
}
