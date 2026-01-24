import { useState, useRef, useEffect, memo } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

interface OptimizedImageProps {
  src: string | null | undefined;
  alt: string;
  className?: string;
  width?: number;
  height?: number;
  priority?: boolean;
  sizes?: string;
  aspectRatio?: "square" | "video" | "portrait" | "auto";
  fallback?: React.ReactNode;
  onLoad?: () => void;
  onError?: () => void;
}

/**
 * Generate optimized image URL with size parameters
 * This works with common CDN patterns and Supabase Storage
 */
function getOptimizedSrc(src: string, width?: number): string {
  if (!src || !width) return src;

  // Supabase Storage transform
  if (src.includes("supabase") && src.includes("/storage/v1/object/")) {
    const url = new URL(src);
    url.searchParams.set("width", String(width));
    url.searchParams.set("quality", "80");
    return url.toString();
  }

  // Shopify CDN
  if (src.includes("shopify.com") || src.includes("cdn.shopify.com")) {
    // Insert size before file extension: image.jpg -> image_400x.jpg
    return src.replace(/(\.\w+)(\?.*)?$/, `_${width}x$1$2`);
  }

  // Cloudinary
  if (src.includes("cloudinary.com")) {
    return src.replace("/upload/", `/upload/w_${width},q_auto,f_auto/`);
  }

  // Imgix
  if (src.includes("imgix.net")) {
    const url = new URL(src);
    url.searchParams.set("w", String(width));
    url.searchParams.set("auto", "format,compress");
    return url.toString();
  }

  return src;
}

/**
 * Generate srcset for responsive images
 */
function generateSrcSet(src: string, widths: number[]): string {
  return widths
    .map((w) => `${getOptimizedSrc(src, w)} ${w}w`)
    .join(", ");
}

const aspectRatioClasses = {
  square: "aspect-square",
  video: "aspect-video",
  portrait: "aspect-[3/4]",
  auto: "",
};

/**
 * Optimized image component with lazy loading, srcset, and blur-up
 */
export const OptimizedImage = memo(function OptimizedImage({
  src,
  alt,
  className,
  width,
  height,
  priority = false,
  sizes = "(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw",
  aspectRatio = "auto",
  fallback,
  onLoad,
  onError,
}: OptimizedImageProps) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [isInView, setIsInView] = useState(priority);
  const [error, setError] = useState(false);
  const imgRef = useRef<HTMLDivElement>(null);

  // Set up intersection observer for lazy loading
  useEffect(() => {
    if (priority || !imgRef.current) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInView(true);
          observer.disconnect();
        }
      },
      { rootMargin: "200px", threshold: 0.01 }
    );

    observer.observe(imgRef.current);
    return () => observer.disconnect();
  }, [priority]);

  const handleLoad = () => {
    setIsLoaded(true);
    onLoad?.();
  };

  const handleError = () => {
    setError(true);
    onError?.();
  };

  // Generate srcset for responsive images
  const srcSet = src ? generateSrcSet(src, [200, 400, 600, 800]) : undefined;
  const optimizedSrc = src ? getOptimizedSrc(src, width || 400) : undefined;

  if (!src || error) {
    return (
      <div
        ref={imgRef}
        className={cn(
          "bg-muted/50 flex items-center justify-center",
          aspectRatioClasses[aspectRatio],
          className
        )}
      >
        {fallback || <span className="text-2xl text-muted-foreground">📦</span>}
      </div>
    );
  }

  return (
    <div
      ref={imgRef}
      className={cn(
        "relative overflow-hidden",
        aspectRatioClasses[aspectRatio],
        className
      )}
    >
      {/* Skeleton placeholder */}
      {!isLoaded && (
        <Skeleton className="absolute inset-0 w-full h-full" />
      )}

      {/* Actual image - only load when in view */}
      {isInView && (
        <img
          src={optimizedSrc}
          srcSet={srcSet}
          sizes={sizes}
          alt={alt}
          width={width}
          height={height}
          loading={priority ? "eager" : "lazy"}
          decoding="async"
          onLoad={handleLoad}
          onError={handleError}
          className={cn(
            "w-full h-full object-contain transition-opacity duration-300",
            isLoaded ? "opacity-100" : "opacity-0"
          )}
        />
      )}
    </div>
  );
});

/**
 * Product card image with optimized loading
 */
export const ProductCardImage = memo(function ProductCardImage({
  src,
  alt,
  className,
  priority = false,
}: {
  src: string | null | undefined;
  alt: string;
  className?: string;
  priority?: boolean;
}) {
  return (
    <OptimizedImage
      src={src}
      alt={alt}
      className={cn("w-full", className)}
      aspectRatio="square"
      width={400}
      priority={priority}
      sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
    />
  );
});

/**
 * Thumbnail image for small displays
 */
export const ThumbnailImage = memo(function ThumbnailImage({
  src,
  alt,
  className,
}: {
  src: string | null | undefined;
  alt: string;
  className?: string;
}) {
  return (
    <OptimizedImage
      src={src}
      alt={alt}
      className={cn("w-12 h-12 rounded", className)}
      aspectRatio="square"
      width={96}
      priority // Thumbnails are usually visible immediately
    />
  );
});
