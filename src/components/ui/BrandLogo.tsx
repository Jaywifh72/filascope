import { useState } from "react";
import { cn } from "@/lib/utils";

interface BrandLogoProps {
  src: string | null | undefined;
  brandName: string;
  className?: string;
  size?: "sm" | "md" | "lg";
}

// Generate a consistent color from brand name
function brandColor(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  const hue = Math.abs(hash) % 360;
  return `hsl(${hue}, 50%, 40%)`;
}

const sizeMap = {
  sm: { container: "h-5 w-5", text: "text-[10px]", img: "h-5 max-w-[60px]", width: 60, height: 20, sizes: "60px" },
  md: { container: "h-8 w-8", text: "text-xs", img: "h-8 max-w-[100px]", width: 100, height: 32, sizes: "100px" },
  lg: { container: "h-12 w-12", text: "text-base", img: "h-12 max-w-[180px]", width: 180, height: 48, sizes: "180px" },
};

/**
 * Renders a brand logo image with graceful fallback.
 * If the image fails to load (corrupt, missing, blocked), shows a
 * styled circle with the brand's initial instead of a broken icon.
 */
export function BrandLogo({ src, brandName, className, size = "md" }: BrandLogoProps) {
  const [failed, setFailed] = useState(false);
  const sizes = sizeMap[size];
  const initial = brandName?.charAt(0)?.toUpperCase() || "?";

  if (!src || failed) {
    return (
      <div
        className={cn(
          "rounded flex items-center justify-center font-semibold text-white flex-shrink-0",
          sizes.container,
          className
        )}
        style={{ backgroundColor: brandColor(brandName || "?") }}
        title={brandName}
        role="img"
        aria-label={`${brandName} logo`}
      >
        {initial}
      </div>
    );
  }

  const needsBrightness = /^fiber[lo]/i.test(brandName);

  return (
    <img
      src={src}
      alt={`${brandName} logo`}
      className={cn("object-contain flex-shrink-0", sizes.img, needsBrightness && "dark:brightness-[2.5]", className)}
      width={sizes.width}
      height={sizes.height}
      sizes={sizes.sizes}
      decoding="async"
      onError={() => setFailed(true)}
      loading="lazy"
    />
  );
}
