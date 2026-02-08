import { Package } from "lucide-react";
import { cn } from "@/lib/utils";

interface FilamentImageFallbackProps {
  colorHex?: string | null;
  material?: string | null;
  className?: string;
  size?: "sm" | "md" | "lg";
}

/**
 * A clean fallback placeholder for filament product images.
 * Shows a color-tinted spool silhouette when the product image fails to load.
 * Uses the product's color_hex to give users a visual color reference.
 */
export function FilamentImageFallback({
  colorHex,
  material,
  className,
  size = "md",
}: FilamentImageFallbackProps) {
  const resolvedColor = colorHex || "#888888";

  // Compute a subtle background tint from the color
  const bgTint = `${resolvedColor}18`; // ~10% opacity hex suffix

  const swatchSizes = {
    sm: "w-8 h-8",
    md: "w-14 h-14",
    lg: "w-20 h-20",
  };

  const iconSizes = {
    sm: "w-4 h-4",
    md: "w-5 h-5",
    lg: "w-6 h-6",
  };

  return (
    <div
      className={cn(
        "w-full h-full flex flex-col items-center justify-center gap-2",
        className
      )}
      style={{ backgroundColor: bgTint }}
    >
      {/* Color swatch circle */}
      <div
        className={cn(
          "rounded-full shadow-lg border border-white/15 ring-1 ring-black/10",
          swatchSizes[size]
        )}
        style={{ backgroundColor: resolvedColor }}
        role="img"
        aria-label={`Color: ${colorHex || "unknown"}`}
      />

      {/* Material label + icon */}
      <div className="flex items-center gap-1 text-muted-foreground">
        <Package className={cn("opacity-40", iconSizes[size])} />
        <span className="text-[10px] uppercase tracking-wider opacity-50 font-medium">
          {material?.split(/[\s-]/)[0] || "Filament"}
        </span>
      </div>
    </div>
  );
}
