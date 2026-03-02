import { getSwatchColor, needsContrastRing, needsLightContrastRing, isApproximateColor } from '@/lib/swatchColor';
import { cn } from '@/lib/utils';

interface SwatchCircleProps {
  hexColor: string | null | undefined;
  colorFamily: string | null | undefined;
  /** Tailwind size classes, e.g. "w-8 h-8" (default) */
  size?: string;
  /** Additional class names */
  className?: string;
}

const NO_COLOR_GRADIENT =
  'repeating-linear-gradient(45deg, hsl(var(--muted)) 0px, hsl(var(--muted)) 2px, hsl(var(--muted-foreground) / 0.18) 2px, hsl(var(--muted-foreground) / 0.18) 4px)';

/**
 * Renders a circular color swatch that is always visually distinguishable:
 * - All swatches get a baseline ring
 * - Very dark colors get an inset highlight for depth
 * - Very light colors get a darker ring so they don't blend
 * - Missing hex data renders a diagonal-stripe "no color" hatch
 */
export function SwatchCircle({
  hexColor,
  colorFamily,
  size = 'w-8 h-8',
  className,
}: SwatchCircleProps) {
  const displayHex = getSwatchColor(hexColor, colorFamily);
  const hasHex = !!hexColor || !!colorFamily; // we resolved to something meaningful
  const isDark = needsContrastRing(displayHex);
  const isLight = needsLightContrastRing(displayHex);
  const approximate = isApproximateColor(hexColor);

  // No color data at all → hatch pattern
  if (!hasHex && displayHex === '#808080') {
    return (
      <div
        className={cn(
          size,
          'rounded-full border border-border shrink-0',
          className,
        )}
        style={{ background: NO_COLOR_GRADIENT }}
        title="Color data not available"
      />
    );
  }

  return (
    <div
      className={cn(
        size,
        'rounded-full border border-border shrink-0',
        isDark && 'shadow-[inset_0_0_0_1px_rgba(255,255,255,0.15)]',
        className,
      )}
      style={{ backgroundColor: displayHex }}
      title={
        approximate
          ? 'Approximate color — exact hex not available'
          : undefined
      }
    />
  );
}
