import { useState, useRef, useCallback, useEffect } from "react";
import { cn } from "@/lib/utils";
import { ZoomIn, Printer } from "lucide-react";
import { getOptimizedImageUrl } from "@/utils/imageOptimization";

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
  const containerRef = useRef<HTMLDivElement>(null);

  // 10-second timeout: if image hasn't loaded, show error state
  useEffect(() => {
    if (isLoaded || isError) return;
    const timer = setTimeout(() => {
      if (!isLoaded) setIsError(true);
    }, 10000);
    return () => clearTimeout(timer);
  }, [isLoaded, isError]);

  // Handle mouse move for zoom
  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!containerRef.current) return;
    
    const rect = containerRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    
    setZoomPosition({ x, y });
  }, []);

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
      {/* Pulsing Skeleton Placeholder */}
      {!isLoaded && !isError && (
        <div className="absolute inset-0 bg-gray-800 animate-pulse rounded-lg" />
      )}

      {/* Main Image — hero product image: eager + high priority */}
      <img
        src={getOptimizedImageUrl(src, 800)}
        alt={alt}
        width={800}
        height={800}
        loading="eager"
        decoding="async"
        // @ts-ignore – fetchpriority valid HTML
        fetchpriority="high"
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
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-muted/30">
          <Printer size={64} className="text-gray-600" />
          <span className="text-xs text-gray-500 font-mono mt-2">Image not available</span>
        </div>
      )}
    </div>
  );
}
