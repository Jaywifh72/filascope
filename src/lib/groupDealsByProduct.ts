import { getBaseProductName } from '@/hooks/useFilamentColorVariants';
import type { DealWithMeta } from '@/hooks/useDealsWithFilters';

export interface GroupedDeal {
  groupKey: string;
  baseName: string;
  representativeDeal: DealWithMeta;
  variants: DealWithMeta[];
  bestDiscount: number;
  /** Capped discount for display — if raw > 60%, shows "Great Deal" instead */
  displayDiscount: number | null;
  isUnusualDiscount: boolean;
  priceRange: { min: number; max: number };
  colorHexes: string[];
  colorCount: number;
  storeName: string;
  storeRegion: string;
  regionFlag: string;
  isLocal: boolean;
  lastScrapedAt: string | null;
  /** Earliest created_at across all variants in the group */
  earliestCreatedAt: string | null;
  fallbackImages: string[];
}

export function groupDealsByProduct(deals: DealWithMeta[]): GroupedDeal[] {
  const groups = new Map<string, DealWithMeta[]>();
  
  // Group deals by vendor + base product name
  for (const deal of deals) {
    const baseName = getBaseProductName(deal.product_title);
    const groupKey = `${(deal.vendor || 'unknown').toLowerCase()}-${baseName.toLowerCase().replace(/\s+/g, '-')}`;
    
    if (!groups.has(groupKey)) {
      groups.set(groupKey, []);
    }
    groups.get(groupKey)!.push(deal);
  }
  
  // Convert to grouped deals
  const grouped = Array.from(groups.entries()).map(([groupKey, variants]) => {
    // Sort by discount (best first)
    const sorted = [...variants].sort((a, b) => b.discount - a.discount);
    const representative = sorted[0];
    
    // Calculate aggregates
    const prices = variants
      .map(v => v.variant_price)
      .filter((p): p is number => p !== null);
    
    const colorHexes = [...new Set(
      variants
        .map(v => (v as any).color_hex as string | null)
        .filter((hex): hex is string => !!hex)
    )];
    
    // Collect fallback images from variants (excluding the representative's image)
    const fallbackImages = [...new Set(
      variants
        .map(v => v.featured_image)
        .filter((img): img is string => !!img && img !== representative.featured_image)
    )];

    // Find the most recent last_scraped_at from all variants
    const lastScrapedAt = variants.reduce<string | null>((latest, v) => {
      const ts = v.last_scraped_at || null;
      if (!ts) return latest;
      if (!latest) return ts;
      return ts > latest ? ts : latest;
    }, null);

    // Find the earliest created_at across all variants
    const earliestCreatedAt = variants.reduce<string | null>((earliest, v) => {
      const ts = v.created_at || null;
      if (!ts) return earliest;
      if (!earliest) return ts;
      return ts < earliest ? ts : earliest;
    }, null);

    const bestDiscount = representative.discount;
    // Flag unusual discounts (> 60%) — likely data quality issues
    const isUnusualDiscount = bestDiscount > 60;
    const displayDiscount = isUnusualDiscount ? null : bestDiscount;

    return {
      groupKey,
      baseName: getBaseProductName(representative.product_title),
      representativeDeal: representative,
      variants: sorted,
      bestDiscount,
      displayDiscount,
      isUnusualDiscount,
      priceRange: {
        min: prices.length > 0 ? Math.min(...prices) : 0,
        max: prices.length > 0 ? Math.max(...prices) : 0,
      },
      colorHexes,
      colorCount: variants.length,
      storeName: representative.storeName,
      storeRegion: representative.storeRegion,
      regionFlag: representative.regionFlag,
      isLocal: representative.isLocal,
      lastScrapedAt,
      earliestCreatedAt,
      fallbackImages,
    };
  });

  // Sort: local deals first, then by discount descending
  return grouped.sort((a, b) => {
    // Local deals always first
    if (a.isLocal && !b.isLocal) return -1;
    if (!a.isLocal && b.isLocal) return 1;
    // Then by discount
    return b.bestDiscount - a.bestDiscount;
  });
}
