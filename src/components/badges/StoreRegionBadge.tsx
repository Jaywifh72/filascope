import { Badge } from "@/components/ui/badge";
import { useRegion } from "@/contexts/RegionContext";
import { RegionCode, REGION_CONFIGS } from "@/types/regional";
import { cn } from "@/lib/utils";

interface StoreRegionBadgeProps {
  /** Region code for the store */
  region: RegionCode;
  /** Show the flag emoji */
  showFlag?: boolean;
  /** Show the region code label */
  showLabel?: boolean;
  /** Highlight as local if matches user's region */
  isLocal?: boolean;
  /** Badge size variant */
  size?: 'xs' | 'sm' | 'md';
  /** Additional className */
  className?: string;
}

const sizeClasses = {
  xs: 'text-[10px] px-1.5 py-0.5 gap-0.5',
  sm: 'text-xs px-2 py-0.5 gap-1',
  md: 'text-sm px-2.5 py-1 gap-1.5',
};

/**
 * StoreRegionBadge - Displays a region indicator for store attribution
 * 
 * Shows flag emoji, region code, and optionally highlights as "Local"
 * when the store matches the user's selected region.
 * 
 * @example
 * <StoreRegionBadge region="US" />
 * // Renders: 🇺🇸 US
 * 
 * @example
 * <StoreRegionBadge region="CA" isLocal showLabel={false} />
 * // Renders: 🇨🇦 Local (green highlight)
 */
export function StoreRegionBadge({
  region,
  showFlag = true,
  showLabel = true,
  isLocal,
  size = 'sm',
  className,
}: StoreRegionBadgeProps) {
  const regionConfig = REGION_CONFIGS[region];
  
  if (!regionConfig) {
    return null;
  }

  // If isLocal isn't explicitly set, we can auto-detect
  const { region: userRegion } = useRegion();
  const isUserLocal = isLocal ?? region === userRegion;

  return (
    <Badge
      variant="outline"
      className={cn(
        "inline-flex items-center font-medium border",
        sizeClasses[size],
        isUserLocal
          ? "bg-green-500/10 text-green-400 border-green-500/30"
          : "bg-muted/50 text-muted-foreground border-border/50",
        className
      )}
    >
      {showFlag && (
        <span className="flex-shrink-0" role="img" aria-label={regionConfig.name}>
          {regionConfig.flag}
        </span>
      )}
      {isUserLocal ? (
        <span>Local</span>
      ) : showLabel ? (
        <span>{region}</span>
      ) : null}
    </Badge>
  );
}

/**
 * StoreRegionIndicator - Inline text indicator for store region
 * 
 * A lighter-weight alternative to the badge for inline text usage.
 * 
 * @example
 * <StoreRegionIndicator region="EU" storeName="Prusa" />
 * // Renders: Prusa 🇪🇺
 */
interface StoreRegionIndicatorProps {
  region: RegionCode;
  storeName?: string;
  className?: string;
}

export function StoreRegionIndicator({
  region,
  storeName,
  className,
}: StoreRegionIndicatorProps) {
  const regionConfig = REGION_CONFIGS[region];
  
  if (!regionConfig) {
    return storeName ? <span className={className}>{storeName}</span> : null;
  }

  return (
    <span className={cn("inline-flex items-center gap-1", className)}>
      {storeName && <span>{storeName}</span>}
      <span role="img" aria-label={regionConfig.name}>
        {regionConfig.flag}
      </span>
    </span>
  );
}

export default StoreRegionBadge;
