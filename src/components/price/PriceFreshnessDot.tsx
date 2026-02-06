import { cn } from '@/lib/utils';
import { differenceInHours, differenceInDays } from 'date-fns';

interface PriceFreshnessDotProps {
  lastScrapedAt: string | null | undefined;
  className?: string;
}

type FreshnessLevel = 'today' | 'recent' | 'aging' | 'stale' | 'unknown';

function getFreshnessLevel(lastScrapedAt: string | null | undefined): FreshnessLevel {
  if (!lastScrapedAt) return 'unknown';
  const date = new Date(lastScrapedAt);
  if (isNaN(date.getTime())) return 'unknown';

  const now = new Date();
  const hours = differenceInHours(now, date);
  const days = differenceInDays(now, date);

  if (hours < 24) return 'today';
  if (days < 7) return 'recent';
  if (days <= 30) return 'aging';
  return 'stale';
}

function getFreshnessLabel(lastScrapedAt: string | null | undefined, level: FreshnessLevel): string {
  if (level === 'unknown') return '';
  if (level === 'today') return 'Today';

  const date = new Date(lastScrapedAt!);
  const days = differenceInDays(new Date(), date);

  if (level === 'recent') return `${days}d ago`;
  if (level === 'aging') return `${days}d ago`;
  return 'Stale';
}

const dotColors: Record<FreshnessLevel, string> = {
  today: 'bg-emerald-500',
  recent: 'bg-amber-400',
  aging: 'bg-orange-500',
  stale: 'bg-red-500',
  unknown: 'bg-muted-foreground/40',
};

const textColors: Record<FreshnessLevel, string> = {
  today: 'text-emerald-400',
  recent: 'text-amber-400',
  aging: 'text-orange-400',
  stale: 'text-red-400',
  unknown: 'text-muted-foreground',
};

/**
 * Compact dot + label indicating price data freshness.
 * Shows nothing if no timestamp is available.
 */
export function PriceFreshnessDot({ lastScrapedAt, className }: PriceFreshnessDotProps) {
  const level = getFreshnessLevel(lastScrapedAt);
  if (level === 'unknown') return null;

  const label = getFreshnessLabel(lastScrapedAt, level);

  return (
    <span className={cn('inline-flex items-center gap-1 text-[10px]', textColors[level], className)}>
      <span className={cn('w-1.5 h-1.5 rounded-full flex-shrink-0', dotColors[level])} />
      <span>{label}</span>
    </span>
  );
}

/**
 * Table-oriented version with slightly larger text.
 */
export function PriceFreshnessCell({ lastScrapedAt, className }: PriceFreshnessDotProps) {
  const level = getFreshnessLevel(lastScrapedAt);

  if (level === 'unknown') {
    return <span className="text-xs text-muted-foreground">—</span>;
  }

  const label = getFreshnessLabel(lastScrapedAt, level);

  return (
    <span className={cn('inline-flex items-center gap-1.5 text-xs', textColors[level], className)}>
      <span className={cn('w-2 h-2 rounded-full flex-shrink-0', dotColors[level])} />
      <span>{label}</span>
    </span>
  );
}
