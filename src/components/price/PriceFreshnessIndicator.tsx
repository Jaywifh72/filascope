import { CheckCircle2, Clock, AlertTriangle, AlertCircle, ExternalLink } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { usePriceFreshness, PriceConfidence, getConfidenceLabel } from '@/hooks/usePriceFreshness';
import { cn } from '@/lib/utils';

interface PriceFreshnessIndicatorProps {
  lastVerified: string | null | undefined;
  confidence?: PriceConfidence;
  source?: string | null;
  compact?: boolean;
  className?: string;
}

const confidenceConfig: Record<PriceConfidence, {
  icon: typeof CheckCircle2;
  colorClass: string;
  bgClass: string;
}> = {
  high: {
    icon: CheckCircle2,
    colorClass: 'text-green-600 dark:text-green-400',
    bgClass: 'bg-green-100 dark:bg-green-900/30 border-green-200 dark:border-green-800',
  },
  medium: {
    icon: Clock,
    colorClass: 'text-blue-600 dark:text-blue-400',
    bgClass: 'bg-blue-100 dark:bg-blue-900/30 border-blue-200 dark:border-blue-800',
  },
  low: {
    icon: AlertTriangle,
    colorClass: 'text-amber-600 dark:text-amber-400',
    bgClass: 'bg-amber-100 dark:bg-amber-900/30 border-amber-200 dark:border-amber-800',
  },
  stale: {
    icon: AlertCircle,
    colorClass: 'text-red-600 dark:text-red-400',
    bgClass: 'bg-red-100 dark:bg-red-900/30 border-red-200 dark:border-red-800',
  },
  unknown: {
    icon: ExternalLink,
    colorClass: 'text-muted-foreground',
    bgClass: 'bg-muted/50 border-border',
  },
};

function getSourceLabel(source: string | null | undefined): string {
  if (!source) return '';
  switch (source) {
    case 'scraper':
      return 'Auto-updated';
    case 'api':
      return 'API sync';
    case 'affiliate':
      return 'Affiliate data';
    case 'manual':
      return 'Manual entry';
    default:
      return '';
  }
}

export function PriceFreshnessIndicator({
  lastVerified,
  confidence: providedConfidence,
  source,
  compact = false,
  className,
}: PriceFreshnessIndicatorProps) {
  const freshness = usePriceFreshness(lastVerified);
  const confidence = providedConfidence || freshness.confidence;
  const config = confidenceConfig[confidence];
  const Icon = config.icon;
  const label = getConfidenceLabel(confidence);
  const sourceLabel = getSourceLabel(source);

  if (compact) {
    // Hide stale/unknown indicators in compact sidebar mode (red circle-alert with no useful context)
    if (confidence === 'stale' || confidence === 'unknown') return null;
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <span
              className={cn('inline-flex items-center gap-1', config.colorClass, className)}
              title="Price sourced from store listing and may change"
            >
              <Icon className="h-3 w-3" />
              <span className="text-[10px] text-muted-foreground">Price may vary by retailer</span>
            </span>
          </TooltipTrigger>
          <TooltipContent side="top" className="text-xs">
            <p>{label}</p>
            {freshness.timeAgo && <p className="text-muted-foreground">{freshness.timeAgo}</p>}
            {sourceLabel && <p className="text-muted-foreground">{sourceLabel}</p>}
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className={cn('flex flex-col gap-0.5 cursor-help', className)}>
            <Badge
              variant="outline"
              className={cn(
                'gap-1 text-xs font-normal border w-fit',
                config.bgClass,
                config.colorClass,
              )}
            >
              <Icon className="h-3 w-3" />
              <span>{label}</span>
            </Badge>
            {/* Explicit timestamp text */}
            {freshness.timeAgo && (
              <span className={cn('text-[11px]', config.colorClass)}>
                {confidence === 'high' || confidence === 'medium'
                  ? `✓ Price verified ${freshness.timeAgo}`
                  : `⚠️ Price may be outdated (last checked ${freshness.timeAgo})`}
              </span>
            )}
          </div>
        </TooltipTrigger>
        <TooltipContent side="top" className="text-xs max-w-[220px]">
          {freshness.timeAgo ? (
            <p className="font-medium">Last checked {freshness.timeAgo}</p>
          ) : (
            <p className="font-medium">No price data available</p>
          )}
          {sourceLabel && <p className="text-muted-foreground mt-1">Source: {sourceLabel}</p>}
          <p className="text-muted-foreground mt-2 pt-2 border-t border-border/40">
            {confidence === 'high' || confidence === 'medium' 
              ? 'Price may still vary — click to see current store price'
              : 'This price may have changed — we recommend verifying at the store'}
          </p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

/**
 * Simple inline text version for use in smaller spaces - honest messaging
 */
export function PriceFreshnessText({
  lastVerified,
  confidence: providedConfidence,
  className,
}: {
  lastVerified: string | null | undefined;
  confidence?: PriceConfidence;
  className?: string;
}) {
  const freshness = usePriceFreshness(lastVerified);
  const confidence = providedConfidence || freshness.confidence;
  const config = confidenceConfig[confidence];
  const Icon = config.icon;

  const getText = () => {
    if (confidence === 'high' || confidence === 'medium') {
      return freshness.timeAgo ? `Checked ${freshness.timeAgo}` : 'Recently checked';
    }
    if (confidence === 'low') {
      return freshness.timeAgo ? `Last checked ${freshness.timeAgo}` : 'May be outdated';
    }
    return 'Verify at store';
  };

  return (
    <span className={cn('inline-flex items-center gap-1 text-xs', config.colorClass, className)}>
      <Icon className="h-3 w-3" />
      <span>{getText()}</span>
    </span>
  );
}
