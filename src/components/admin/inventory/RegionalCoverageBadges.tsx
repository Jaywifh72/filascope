import { Check, X } from 'lucide-react';
import { RegionCode } from '@/types/regional';
import { REGIONS } from '@/config/regions';
import { cn } from '@/lib/utils';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

interface RegionalCoverageBadgesProps {
  availableRegions: RegionCode[];
  allRegions?: RegionCode[];
  compact?: boolean;
  showLabels?: boolean;
}

const DEFAULT_REGIONS: RegionCode[] = ['US', 'CA', 'UK', 'EU', 'AU'];

export function RegionalCoverageBadges({
  availableRegions,
  allRegions = DEFAULT_REGIONS,
  compact = false,
  showLabels = true,
}: RegionalCoverageBadgesProps) {
  const availableSet = new Set(availableRegions);
  const covered = allRegions.filter((r) => availableSet.has(r));
  const missing = allRegions.filter((r) => !availableSet.has(r));

  const tooltipContent = (
    <div className="text-xs space-y-1">
      {covered.length > 0 && (
        <p className="text-green-400">
          Available: {covered.map((r) => REGIONS[r]?.name || r).join(', ')}
        </p>
      )}
      {missing.length > 0 && (
        <p className="text-muted-foreground">
          Not configured: {missing.map((r) => REGIONS[r]?.name || r).join(', ')}
        </p>
      )}
    </div>
  );

  if (compact) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="flex items-center gap-1 cursor-help">
            {covered.slice(0, 3).map((regionCode) => (
              <span key={regionCode} className="text-sm">
                {REGIONS[regionCode]?.flag}
              </span>
            ))}
            {covered.length > 3 && (
              <span className="text-xs text-muted-foreground">+{covered.length - 3}</span>
            )}
            <span className="text-xs text-muted-foreground ml-1">
              ({covered.length}/{allRegions.length})
            </span>
          </div>
        </TooltipTrigger>
        <TooltipContent side="top">{tooltipContent}</TooltipContent>
      </Tooltip>
    );
  }

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <div className="flex flex-wrap items-center gap-2 cursor-help">
          {allRegions.map((regionCode) => {
            const region = REGIONS[regionCode];
            const isAvailable = availableSet.has(regionCode);

            return (
              <div
                key={regionCode}
                className={cn(
                  'flex items-center gap-1 text-sm',
                  isAvailable ? 'opacity-100' : 'opacity-50'
                )}
              >
                <span>{region?.flag}</span>
                {showLabels && (
                  <span className="text-xs text-muted-foreground">{regionCode}</span>
                )}
                {isAvailable ? (
                  <Check className="w-3 h-3 text-green-500" />
                ) : (
                  <X className="w-3 h-3 text-muted-foreground" />
                )}
              </div>
            );
          })}
        </div>
      </TooltipTrigger>
      <TooltipContent side="top">{tooltipContent}</TooltipContent>
    </Tooltip>
  );
}

interface RegionalCoverageSummaryProps {
  availableRegions: RegionCode[];
  allRegions?: RegionCode[];
}

export function RegionalCoverageSummary({
  availableRegions,
  allRegions = DEFAULT_REGIONS,
}: RegionalCoverageSummaryProps) {
  const count = availableRegions.filter((r) => allRegions.includes(r)).length;
  const total = allRegions.length;
  
  const percentage = total > 0 ? Math.round((count / total) * 100) : 0;
  
  return (
    <div className="flex items-center gap-2 text-sm">
      <span className="text-muted-foreground">Coverage:</span>
      <span className={cn(
        'font-medium',
        percentage === 100 ? 'text-green-500' : 
        percentage >= 50 ? 'text-yellow-500' : 
        'text-muted-foreground'
      )}>
        {count}/{total} regions ({percentage}%)
      </span>
    </div>
  );
}
