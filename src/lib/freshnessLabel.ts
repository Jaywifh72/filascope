type FreshnessColor = 'green' | 'amber' | 'red';

export interface FreshnessLabel {
  label: string;
  color: FreshnessColor;
  isStale: boolean;
}

export function getFreshnessLabel(lastScrapedAt: string | null | undefined): FreshnessLabel {
  if (!lastScrapedAt) {
    return { label: 'Price may be outdated', color: 'red', isStale: true };
  }

  const now = new Date();
  const scraped = new Date(lastScrapedAt);
  const diffMs = now.getTime() - scraped.getTime();
  const diffHours = diffMs / (1000 * 60 * 60);
  const diffDays = diffMs / (1000 * 60 * 60 * 24);

  if (diffHours < 6) return { label: 'Verified just now', color: 'green', isStale: false };
  if (diffHours < 24) return { label: 'Verified today', color: 'green', isStale: false };
  if (diffDays < 3) return { label: 'Verified this week', color: 'green', isStale: false };
  if (diffDays < 7) {
    const days = Math.floor(diffDays);
    return { label: `Verified ${days} days ago`, color: 'amber', isStale: false };
  }
  if (diffDays < 14) return { label: 'Verified recently', color: 'amber', isStale: false };
  return { label: 'Price may be outdated', color: 'red', isStale: true };
}
