import { usePriceHistory } from '@/hooks/usePriceHistory';
import { cn } from '@/lib/utils';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface BadgeDef {
  label: string;
  tooltip: string;
  style: string;
}

interface PriceIntelligenceBadgesProps {
  filamentId: string;
  currentPrice: number | null;
  lastScrapedAt?: string | null;
  className?: string;
}

export function PriceIntelligenceBadges({
  filamentId,
  currentPrice,
  lastScrapedAt,
  className,
}: PriceIntelligenceBadgesProps) {
  const priceHistory = usePriceHistory(filamentId, currentPrice, 90);

  if (priceHistory.isLoading || !currentPrice || priceHistory.prices.length < 2) {
    return null;
  }

  const { isBestIn6Months, isBestIn30Days, trendPercent, prices } = priceHistory;

  const badges: BadgeDef[] = [];

  // --- Trend badge (pick first matching) ---

  // a) Lowest in X months
  if (isBestIn6Months) {
    badges.push({
      label: '↓ Lowest price in 6 months',
      tooltip:
        'This is the lowest price we\'ve recorded for this filament in the past 6 months.',
      style:
        'bg-emerald-500/15 text-emerald-400 border-emerald-500/20',
    });
  } else if (isBestIn30Days) {
    badges.push({
      label: '↓ Lowest price in 30 days',
      tooltip:
        'This is the lowest price we\'ve recorded for this filament in the past 30 days.',
      style:
        'bg-emerald-500/15 text-emerald-400 border-emerald-500/20',
    });
  }
  // b) Price dropped
  else if (trendPercent !== null && trendPercent < -2) {
    badges.push({
      label: '↓ Price dropped recently',
      tooltip:
        'The price has decreased compared to recent history. Could be a good time to buy.',
      style:
        'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    });
  }
  // c) Price rising
  else if (trendPercent !== null && trendPercent > 5) {
    badges.push({
      label: '↑ Price increased recently',
      tooltip:
        'The price has increased recently. Set a price alert to get notified of drops.',
      style:
        'bg-amber-500/10 text-amber-400 border-amber-500/20',
    });
  }
  // d) Stable price — no significant change and 30+ data points
  else if (
    trendPercent !== null &&
    Math.abs(trendPercent) <= 2 &&
    prices.length >= 10
  ) {
    badges.push({
      label: '→ Price stable for 30+ days',
      tooltip:
        'The price hasn\'t changed significantly in over 30 days — it\'s holding steady.',
      style:
        'bg-muted/40 text-muted-foreground border-border/40',
    });
  }

  // --- e) Live verified (secondary trust signal) ---
  if (lastScrapedAt) {
    const hoursSinceCheck =
      (Date.now() - new Date(lastScrapedAt).getTime()) / (1000 * 60 * 60);
    if (hoursSinceCheck <= 48) {
      badges.push({
        label: '✓ Live price verified',
        tooltip:
          'This price was automatically checked within the last 48 hours.',
        style:
          'bg-primary/10 text-primary border-primary/20',
      });
    }
  }

  // Max 2 badges
  const visibleBadges = badges.slice(0, 2);

  if (visibleBadges.length === 0) return null;

  return (
    <div className={cn('flex flex-col gap-1.5', className)}>
      {visibleBadges.map((badge) => (
        <TooltipProvider key={badge.label} delayDuration={200}>
          <Tooltip>
            <TooltipTrigger asChild>
              <span
                className={cn(
                  'inline-flex items-center text-xs px-2.5 py-1 rounded-full border cursor-default',
                  badge.style,
                )}
              >
                {badge.label}
              </span>
            </TooltipTrigger>
            <TooltipContent
              side="bottom"
              className="max-w-xs text-xs leading-relaxed"
            >
              {badge.tooltip}
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      ))}
    </div>
  );
}
