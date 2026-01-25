import { useMemo } from 'react';
import { formatDistanceToNow, differenceInHours, differenceInDays } from 'date-fns';

export type PriceConfidence = 'high' | 'medium' | 'low' | 'stale' | 'unknown';

export interface PriceFreshnessResult {
  confidence: PriceConfidence;
  timeAgo: string | null;
  isStale: boolean;
  isRecent: boolean;
  lastVerifiedDate: Date | null;
}

/**
 * Calculate price confidence based on age thresholds:
 * - high: < 24 hours
 * - medium: 1-7 days
 * - low: 7-30 days
 * - stale: > 30 days
 * - unknown: no timestamp
 */
function calculateConfidence(lastVerified: string | null | undefined): PriceConfidence {
  if (!lastVerified) return 'unknown';
  
  const date = new Date(lastVerified);
  if (isNaN(date.getTime())) return 'unknown';
  
  const now = new Date();
  const hoursAgo = differenceInHours(now, date);
  const daysAgo = differenceInDays(now, date);
  
  if (hoursAgo < 24) return 'high';
  if (daysAgo < 7) return 'medium';
  if (daysAgo < 30) return 'low';
  return 'stale';
}

/**
 * Hook to calculate price freshness information from a timestamp
 */
export function usePriceFreshness(lastVerified: string | null | undefined): PriceFreshnessResult {
  return useMemo(() => {
    const confidence = calculateConfidence(lastVerified);
    const lastVerifiedDate = lastVerified ? new Date(lastVerified) : null;
    const isValidDate = lastVerifiedDate && !isNaN(lastVerifiedDate.getTime());
    
    return {
      confidence,
      timeAgo: isValidDate ? formatDistanceToNow(lastVerifiedDate, { addSuffix: true }) : null,
      isStale: confidence === 'stale' || confidence === 'unknown',
      isRecent: confidence === 'high',
      lastVerifiedDate: isValidDate ? lastVerifiedDate : null,
    };
  }, [lastVerified]);
}

/**
 * Get a human-readable label for confidence level - honest messaging
 */
export function getConfidenceLabel(confidence: PriceConfidence): string {
  switch (confidence) {
    case 'high':
      return 'Updated today';
    case 'medium':
      return 'Updated this week';
    case 'low':
      return 'May be outdated';
    case 'stale':
      return 'Outdated - verify at store';
    case 'unknown':
    default:
      return 'Check store for price';
  }
}

/**
 * Get variant style for confidence badges
 */
export function getConfidenceVariant(confidence: PriceConfidence): 'default' | 'secondary' | 'destructive' | 'outline' {
  switch (confidence) {
    case 'high':
      return 'default';
    case 'medium':
      return 'secondary';
    case 'low':
    case 'stale':
      return 'outline';
    case 'unknown':
    default:
      return 'outline';
  }
}
