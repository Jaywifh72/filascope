import { getBaseProductName } from '@/hooks/useFilamentColorVariants';
import type { DealWithMeta } from '@/hooks/useDealsWithFilters';

export interface GroupedDeal {
  groupKey: string;
  baseName: string;
  representativeDeal: DealWithMeta;
  variants: DealWithMeta[];
  bestDiscount: number;
  priceRange: { min: number; max: number };
  colorHexes: string[];
  colorCount: number;
  storeName: string;
  storeRegion: string;
  regionFlag: string;
  isLocal: boolean;
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
  return Array.from(groups.entries()).map(([groupKey, variants]) => {
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
    
    return {
      groupKey,
      baseName: getBaseProductName(representative.product_title),
      representativeDeal: representative,
      variants: sorted,
      bestDiscount: representative.discount,
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
    };
  }).sort((a, b) => b.bestDiscount - a.bestDiscount);
}
