import { useState, useRef, useEffect, memo } from "react";
import { Package } from "lucide-react";
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
  /** Color hex for tinted fallback placeholder when image fails */
  colorHex?: string | null;
  /** Material name for fallback label */
  material?: string | null;
  onLoad?: () => void;
  onError?: () => void;
  /** Base64 blur placeholder for blur-up effect */
  blurDataUrl?: string;
  /** Object fit mode for the image */
  objectFit?: "contain" | "cover" | "fill" | "none" | "scale-down";
}

/**
 * Check if a CDN source supports WebP transformation
 */
function cdnSupportsWebP(src: string): boolean {
  return (
    src.includes("cloudinary.com") ||
    src.includes("imgix.net") ||
    src.includes("shopify.com") ||
    src.includes("cdn.shopify.com") ||
    src.includes("caz3d.com/cdn/") ||
    /store\.bbl[a-z]*\.[a-z]+.*\/cdn\//i.test(src) ||
    (src.includes("supabase") && src.includes("/storage/v1/object/"))
  );
}

/**
 * Generate optimized image URL with size and format parameters
 * Supports WebP format with automatic fallback
 */
function getOptimizedSrc(src: string, width?: number, format?: "webp" | "auto"): string {
  if (!src || !width) return src;

  const requestFormat = format || "auto";

  // Supabase Storage transform
  if (src.includes("supabase") && src.includes("/storage/v1/object/")) {
    const url = new URL(src);
    url.searchParams.set("width", String(width));
    url.searchParams.set("quality", "80");
    if (requestFormat === "webp") {
      url.searchParams.set("format", "webp");
    }
    return url.toString();
  }

  // Shopify CDN - use width query param (avoids stacking _NNNx suffixes)
  if (src.includes("shopify.com") || src.includes("cdn.shopify.com") || src.includes("caz3d.com/cdn/") || /store\.bbl[a-z]*\.[a-z]+.*\/cdn\//i.test(src)) {
    // Remove any existing _NNNx size suffix from filename
    let cleanSrc = src.replace(/_\d+x\./g, '.');
    const separator = cleanSrc.includes("?") ? "&" : "?";
    let optimized = `${cleanSrc}${separator}width=${width}`;
    if (requestFormat === "webp") {
      optimized += `&format=webp`;
    }
    return optimized;
  }

  // Cloudinary - f_webp or f_auto
  if (src.includes("cloudinary.com")) {
    const formatParam = requestFormat === "webp" ? "f_webp" : "f_auto";
    return src.replace("/upload/", `/upload/w_${width},q_auto,${formatParam}/`);
  }

  // Imgix - auto=format for WebP when supported
  if (src.includes("imgix.net")) {
    const url = new URL(src);
    url.searchParams.set("w", String(width));
    url.searchParams.set("auto", "format,compress");
    if (requestFormat === "webp") {
      url.searchParams.set("fm", "webp");
    }
    return url.toString();
  }

  return src;
}

/**
 * Generate srcset for responsive images
 */
function generateSrcSet(src: string, widths: number[], format?: "webp" | "auto"): string {
  return widths
    .map((w) => `${getOptimizedSrc(src, w, format)} ${w}w`)
    .join(", ");
}

const aspectRatioClasses = {
  square: "aspect-square",
  video: "aspect-video",
  portrait: "aspect-[3/4]",
  auto: "",
};

/**
 * Optimized image component with lazy loading, WebP <picture>, srcset, and blur-up.
 *
 * Performance features:
 * - IntersectionObserver-based lazy loading (200px rootMargin)
 * - <picture> with WebP <source> for CDNs that support format transformation
 * - Responsive srcset at 200/400/600/800px breakpoints
 * - Explicit width/height to prevent CLS
 * - fetchpriority="high" for above-the-fold hero images
 * - Color-aware fallback placeholder when image fails
 */
export const OptimizedImage = memo(function OptimizedImage({
  src,
  alt,
  className,
  width,
  height,
  priority = false,
  sizes = "(max-width: 640px) 50vw, 200px",
  aspectRatio = "auto",
  fallback,
  onLoad,
  onError,
  blurDataUrl,
  objectFit = "contain",
  colorHex,
  material,
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

  // Responsive widths for srcset
  const srcSetWidths = [200, 400];

  // Generate srcsets
  const srcSet = src ? generateSrcSet(src, srcSetWidths) : undefined;
  const webpSrcSet = src && cdnSupportsWebP(src) ? generateSrcSet(src, srcSetWidths, "webp") : null;
  const optimizedSrc = src ? getOptimizedSrc(src, width || 400) : undefined;

  // Resolve explicit dimensions for CLS prevention
  const imgWidth = width || 400;
  const imgHeight = height || (aspectRatio === "square" ? imgWidth : aspectRatio === "video" ? Math.round(imgWidth * 9 / 16) : aspectRatio === "portrait" ? Math.round(imgWidth * 4 / 3) : imgWidth);

  const objectFitClass =
    objectFit === "contain" ? "object-contain" :
    objectFit === "cover" ? "object-cover" :
    objectFit === "fill" ? "object-fill" :
    objectFit === "none" ? "object-none" :
    "object-scale-down";

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
          colorHex ? (
            <div 
              className="flex flex-col items-center justify-center gap-2 w-full h-full relative overflow-hidden"
              style={{ background: `linear-gradient(135deg, ${colorHex}20 0%, ${colorHex}08 100%)` }}
            >
              <div
                className="w-12 h-12 rounded-xl shadow-lg border border-border ring-1 ring-white/10"
                style={{ backgroundColor: colorHex }}
                role="img"
                aria-label={`Color: ${colorHex}`}
              />
              <span className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/60">
                {material?.split(/[\s-]/)[0] || "Filament"}
              </span>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center gap-2 w-full h-full">
              <Package className="w-8 h-8 text-muted-foreground/20" />
              <span className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/60">
                {material?.split(/[\s-]/)[0] || "Filament"}
              </span>
            </div>
          )
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

      {/* Shimmer skeleton placeholder */}
      {!isLoaded && !blurDataUrl && (
        <div className="absolute inset-0 w-full h-full animate-pulse bg-gradient-to-r from-muted/60 via-muted/30 to-muted/60 bg-[length:200%_100%]" />
      )}

      {/* Actual image with <picture> for WebP support */}
      {isInView && (
        <picture>
          {webpSrcSet && (
            <source
              type="image/webp"
              srcSet={webpSrcSet}
              sizes={sizes}
            />
          )}
          <img
            src={optimizedSrc}
            srcSet={srcSet}
            sizes={sizes}
            alt={alt}
            width={imgWidth}
            height={imgHeight}
            loading={priority ? "eager" : "lazy"}
            decoding="async"
            // @ts-ignore – fetchpriority is valid HTML but not in React types yet
            fetchpriority={priority ? "high" : "auto"}
            onLoad={handleLoad}
            onError={handleError}
            className={cn(
              "w-full h-full transition-opacity duration-300",
              objectFitClass,
              isLoaded ? "opacity-100" : "opacity-0"
            )}
          />
        </picture>
      )}
    </div>
  );
});

/**
 * Product card image — uses 200px thumbnail width for listing grids.
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
      width={200}
      height={200}
      priority={priority}
      sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 200px"
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
      height={96}
      priority // Thumbnails are usually visible immediately
    />
  );
});
