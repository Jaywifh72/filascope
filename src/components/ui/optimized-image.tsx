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
  /** Base64 blur placeholder for blur-up effect */
  blurDataUrl?: string;
  /** Object fit mode for the image */
  objectFit?: "contain" | "cover" | "fill" | "none" | "scale-down";
}

/**
 * Generate optimized image URL with size parameters
 * This works with common CDN patterns and Supabase Storage
 */
/**
 * Generate optimized image URL with size and format parameters
 * Supports WebP format with automatic fallback
 */
function getOptimizedSrc(src: string, width?: number, format?: 'webp' | 'auto'): string {
  if (!src || !width) return src;

  const requestFormat = format || 'auto';

  // Supabase Storage transform
  if (src.includes("supabase") && src.includes("/storage/v1/object/")) {
    const url = new URL(src);
    url.searchParams.set("width", String(width));
    url.searchParams.set("quality", "80");
    if (requestFormat === 'webp') {
      url.searchParams.set("format", "webp");
    }
    return url.toString();
  }

  // Shopify CDN - supports format=webp via query param
  if (src.includes("shopify.com") || src.includes("cdn.shopify.com")) {
    let optimized = src.replace(/(\.\w+)(\?.*)?$/, `_${width}x$1$2`);
    if (requestFormat === 'webp') {
      const separator = optimized.includes('?') ? '&' : '?';
      optimized += `${separator}format=webp`;
    }
    return optimized;
  }

  // Cloudinary - f_webp or f_auto
  if (src.includes("cloudinary.com")) {
    const formatParam = requestFormat === 'webp' ? 'f_webp' : 'f_auto';
    return src.replace("/upload/", `/upload/w_${width},q_auto,${formatParam}/`);
  }

  // Imgix - auto=format for WebP when supported
  if (src.includes("imgix.net")) {
    const url = new URL(src);
    url.searchParams.set("w", String(width));
    url.searchParams.set("auto", "format,compress");
    if (requestFormat === 'webp') {
      url.searchParams.set("fm", "webp");
    }
    return url.toString();
  }

  return src;
}

/**
 * Generate WebP source URL if CDN supports it
 */
function getWebPSrc(src: string, width?: number): string | null {
  if (!src) return null;
  
  // Only generate WebP for CDNs that support it
  const supportsWebP = 
    src.includes("cloudinary.com") ||
    src.includes("imgix.net") ||
    src.includes("shopify.com") ||
    (src.includes("supabase") && src.includes("/storage/v1/object/"));
    
  if (!supportsWebP) return null;
  
  return getOptimizedSrc(src, width, 'webp');
}

/**
 * Generate srcset for responsive images
 */
/**
 * Generate srcset for responsive images
 */
function generateSrcSet(src: string, widths: number[], format?: 'webp' | 'auto'): string {
  return widths
    .map((w) => `${getOptimizedSrc(src, w, format)} ${w}w`)
    .join(", ");
}

/**
 * Generate WebP srcset if supported
 */
function generateWebPSrcSet(src: string, widths: number[]): string | null {
  if (!getWebPSrc(src, widths[0])) return null;
  return generateSrcSet(src, widths, 'webp');
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
  blurDataUrl,
  objectFit = "contain",
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
          "bg-muted/30 flex items-center justify-center",
          aspectRatioClasses[aspectRatio],
          className
        )}
      >
        {fallback || (
          <div className="flex flex-col items-center gap-1 text-muted-foreground">
            <span className="text-2xl">📦</span>
            <span className="text-[10px] opacity-50">No image</span>
          </div>
        )}
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
      {/* Blur placeholder for blur-up effect */}
      {!isLoaded && blurDataUrl && (
        <img
          src={blurDataUrl}
          alt=""
          aria-hidden="true"
          className="absolute inset-0 w-full h-full object-cover filter blur-lg scale-110"
        />
      )}

      {/* Skeleton placeholder (when no blur data) */}
      {!isLoaded && !blurDataUrl && (
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
            "w-full h-full transition-opacity duration-300",
            objectFit === "contain" && "object-contain",
            objectFit === "cover" && "object-cover",
            objectFit === "fill" && "object-fill",
            objectFit === "none" && "object-none",
            objectFit === "scale-down" && "object-scale-down",
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
