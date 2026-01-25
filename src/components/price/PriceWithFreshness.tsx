import { formatDistanceToNow } from 'date-fns';
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from '@/components/ui/tooltip';
import { Clock, AlertTriangle, CheckCircle, AlertCircle } from 'lucide-react';
import { useRegion } from '@/contexts/RegionContext';
import { cn } from '@/lib/utils';
import { PriceConfidence } from '@/hooks/usePriceFreshness';

interface PriceWithFreshnessProps {
  price: number | null;
  lastVerifiedAt: string | Date | null;
  priceConfidence?: PriceConfidence | string | null;
  priceSource?: string | null;
  showTooltip?: boolean;
  showPerKg?: boolean;
  isConverted?: boolean;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function PriceWithFreshness({
  price,
  lastVerifiedAt,
  priceConfidence,
  priceSource,
  showTooltip = true,
  showPerKg = true,
  isConverted = false,
  size = 'lg',
  className,
}: PriceWithFreshnessProps) {
  const { formatPrice } = useRegion();

  // Normalize confidence to our known types
  const confidence = (priceConfidence as PriceConfidence) || 'unknown';

  // Parse date if string
  const verifiedDate = lastVerifiedAt 
    ? (lastVerifiedAt instanceof Date ? lastVerifiedAt : new Date(lastVerifiedAt))
    : null;
  const isValidDate = verifiedDate && !isNaN(verifiedDate.getTime());

  const getConfidenceColor = () => {
    switch (confidence) {
      case 'high': return 'text-green-500 dark:text-green-400';
      case 'medium': return 'text-blue-500 dark:text-blue-400';
      case 'low': return 'text-amber-500 dark:text-amber-400';
      case 'stale': return 'text-red-500 dark:text-red-400';
      default: return 'text-muted-foreground';
    }
  };

  const getConfidenceIcon = () => {
    const iconClass = 'h-3 w-3';
    switch (confidence) {
      case 'high': return <CheckCircle className={iconClass} />;
      case 'medium': return <Clock className={iconClass} />;
      case 'low': return <AlertTriangle className={iconClass} />;
      case 'stale': return <AlertCircle className={iconClass} />;
      default: return <Clock className={iconClass} />;
    }
  };

  const getConfidenceText = () => {
    if (!isValidDate) return 'Price not recently verified';
    
    const timeAgo = formatDistanceToNow(verifiedDate, { addSuffix: false });
    
    switch (confidence) {
      case 'high': return `Checked ${timeAgo} ago`;
      case 'medium': return `Checked ${timeAgo} ago`;
      case 'low': return `Last checked ${timeAgo} ago - may have changed`;
      case 'stale': return `Outdated (${timeAgo} ago) - verify at store`;
      default: return 'No recent price data';
    }
  };

  const getSourceLabel = () => {
    switch (priceSource) {
      case 'scraper': return 'Auto-updated from store';
      case 'api': return 'API sync';
      case 'affiliate': return 'Affiliate network';
      case 'manual': return 'Manual entry';
      default: return priceSource || 'Unknown';
    }
  };

  const sizeClasses = {
    sm: { price: 'text-lg', unit: 'text-xs', status: 'text-[10px]' },
    md: { price: 'text-2xl', unit: 'text-sm', status: 'text-xs' },
    lg: { price: 'text-3xl', unit: 'text-sm', status: 'text-xs' },
  };

  const sizes = sizeClasses[size];

  if (price === null || price === undefined) {
    return (
      <div className={cn('space-y-1', className)}>
        <span className="text-lg text-muted-foreground">Price unavailable</span>
      </div>
    );
  }

  const formattedPrice = formatPrice(price, { showApproximate: isConverted });

  const FreshnessContent = () => (
    <div className={cn('flex items-center gap-1', getConfidenceColor(), sizes.status)}>
      {getConfidenceIcon()}
      <span>{getConfidenceText()}</span>
    </div>
  );

  return (
    <TooltipProvider>
      <div className={cn('space-y-1.5', className)}>
        {/* Price Display */}
        <div className="flex items-baseline gap-2">
          <span className={cn('font-bold text-white', sizes.price)}>
            {formattedPrice}
          </span>
          {showPerKg && (
            <span className={cn('text-muted-foreground font-medium', sizes.unit)}>/kg</span>
          )}
        </div>

        {/* Freshness Indicator */}
        {showTooltip ? (
          <Tooltip>
            <TooltipTrigger asChild>
              <button type="button" className="cursor-help">
                <FreshnessContent />
              </button>
            </TooltipTrigger>
            <TooltipContent side="bottom" className="max-w-[260px]">
              <div className="space-y-2 text-xs">
                <p className="font-medium capitalize">
                  Data freshness: {confidence === 'unknown' ? 'Unknown' : confidence}
                </p>
                {isValidDate && (
                  <p className="text-muted-foreground">
                    Last checked: {verifiedDate.toLocaleDateString()} at {verifiedDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </p>
                )}
                {priceSource && (
                  <p className="text-muted-foreground">
                    Source: {getSourceLabel()}
                  </p>
                )}
                <p className="text-muted-foreground pt-1 border-t border-border/40">
                  {confidence === 'high' || confidence === 'medium'
                    ? 'Prices may still vary — click "Buy Now" to verify'
                    : 'This price may have changed. We recommend checking the store for the current price.'}
                </p>
              </div>
            </TooltipContent>
          </Tooltip>
        ) : (
          <FreshnessContent />
        )}
      </div>
    </TooltipProvider>
  );
}

/**
 * Compact version for use in cards and lists
 */
export function PriceWithFreshnessCompact({
  price,
  lastVerifiedAt,
  priceConfidence,
  isConverted = false,
  className,
}: Pick<PriceWithFreshnessProps, 'price' | 'lastVerifiedAt' | 'priceConfidence' | 'isConverted' | 'className'>) {
  const { formatPrice } = useRegion();
  const confidence = (priceConfidence as PriceConfidence) || 'unknown';

  const getConfidenceColor = () => {
    switch (confidence) {
      case 'high': return 'text-green-500';
      case 'medium': return 'text-blue-500';
      case 'low': return 'text-amber-500';
      case 'stale': return 'text-red-500';
      default: return 'text-muted-foreground';
    }
  };

  if (price === null || price === undefined) {
    return <span className="text-muted-foreground text-sm">—</span>;
  }

  return (
    <div className={cn('flex items-center gap-1.5', className)}>
      <span className="font-semibold text-foreground">
        {formatPrice(price, { showApproximate: isConverted })}
      </span>
      <span className={cn('w-1.5 h-1.5 rounded-full', {
        'bg-green-500': confidence === 'high',
        'bg-blue-500': confidence === 'medium',
        'bg-amber-500': confidence === 'low',
        'bg-red-500': confidence === 'stale',
        'bg-muted-foreground': confidence === 'unknown',
      })} />
    </div>
  );
}
