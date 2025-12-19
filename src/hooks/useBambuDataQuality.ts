import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

// Garbage detection patterns
const GARBAGE_PATTERNS = [
  /suggest one/i,
  /curated range/i,
  /ideal for/i,
  /perfect for/i,
  /designed to/i,
  /experience the/i,
  /discover the/i,
  /introducing the/i,
  /the ultimate/i,
  /high-?quality/i,
  /premium quality/i,
  /best selling/i,
  /top rated/i,
  /our newest/i,
  /our latest/i,
  /\bwe\b.*\boffer\b/i,
  /\byou\b.*\bneed\b/i,
  /^The\s+/i, // Starts with "The"
];

const SUSPICIOUS_LONG_TITLE_THRESHOLD = 60;

export type IssueType = 'no_url' | 'no_price' | 'garbage_name' | 'stale_data' | 'suspicious_title';

export interface DataQualityIssue {
  id: string;
  productTitle: string;
  material: string | null;
  productUrl: string | null;
  issueType: IssueType;
  issueLabel: string;
  possibleCause: string;
  lastUpdated: string | null;
  canRescrape: boolean;
  canDelete: boolean;
}

export interface DataQualityStats {
  totalProducts: number;
  validProducts: number;
  qualityScore: number;
  issues: {
    noUrl: number;
    noPrice: number;
    garbageName: number;
    staleData: number;
    suspiciousTitle: number;
  };
  issuesList: DataQualityIssue[];
}

function isGarbageTitle(title: string): boolean {
  return GARBAGE_PATTERNS.some(pattern => pattern.test(title));
}

function isSuspiciouslyLongTitle(title: string): boolean {
  return title.length > SUSPICIOUS_LONG_TITLE_THRESHOLD;
}

function detectIssueType(filament: {
  id: string;
  product_title: string;
  material: string | null;
  product_url: string | null;
  variant_price: number | null;
  updated_at: string | null;
  regional_prices_updated_at: string | null;
}): { type: IssueType; label: string; cause: string } | null {
  const title = filament.product_title || '';
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  
  // Priority 1: No URL (can't be scraped)
  if (!filament.product_url) {
    if (isGarbageTitle(title)) {
      return {
        type: 'garbage_name',
        label: 'Garbage Entry',
        cause: 'Scraper extracted marketing text instead of product name. No URL to reference.'
      };
    }
    return {
      type: 'no_url',
      label: 'Missing URL',
      cause: 'Product has no URL. May have been created manually or URL was removed.'
    };
  }
  
  // Priority 2: Garbage name (even with URL)
  if (isGarbageTitle(title)) {
    return {
      type: 'garbage_name',
      label: 'Garbage Entry',
      cause: 'Product title contains marketing text. Scraper likely extracted wrong content.'
    };
  }
  
  // Priority 3: Suspiciously long title
  if (isSuspiciouslyLongTitle(title)) {
    return {
      type: 'suspicious_title',
      label: 'Suspicious Title',
      cause: `Title is ${title.length} chars long. May contain extra text or be incorrectly parsed.`
    };
  }
  
  // Priority 4: No price (has URL)
  if (filament.variant_price === null) {
    return {
      type: 'no_price',
      label: 'Missing Price',
      cause: 'Has URL but no US price. Price extraction may have failed or product is unavailable.'
    };
  }
  
  // Priority 5: Stale data
  const lastUpdate = filament.regional_prices_updated_at || filament.updated_at;
  if (lastUpdate && new Date(lastUpdate) < sevenDaysAgo) {
    return {
      type: 'stale_data',
      label: 'Stale Data',
      cause: 'Data is over 7 days old. May need re-scraping to refresh prices.'
    };
  }
  
  return null;
}

export function useBambuDataQuality() {
  return useQuery({
    queryKey: ['bambu-data-quality'],
    queryFn: async (): Promise<DataQualityStats> => {
      const { data: filaments, error } = await supabase
        .from('filaments')
        .select(`
          id, product_title, material, product_url,
          variant_price, updated_at, regional_prices_updated_at
        `)
        .ilike('vendor', 'bambu lab');

      if (error) throw error;

      const issues: DataQualityIssue[] = [];
      let noUrl = 0;
      let noPrice = 0;
      let garbageName = 0;
      let staleData = 0;
      let suspiciousTitle = 0;

      filaments?.forEach(f => {
        const issue = detectIssueType(f);
        
        if (issue) {
          switch (issue.type) {
            case 'no_url': noUrl++; break;
            case 'no_price': noPrice++; break;
            case 'garbage_name': garbageName++; break;
            case 'stale_data': staleData++; break;
            case 'suspicious_title': suspiciousTitle++; break;
          }
          
          issues.push({
            id: f.id,
            productTitle: f.product_title,
            material: f.material,
            productUrl: f.product_url,
            issueType: issue.type,
            issueLabel: issue.label,
            possibleCause: issue.cause,
            lastUpdated: f.regional_prices_updated_at || f.updated_at,
            canRescrape: !!f.product_url,
            canDelete: issue.type === 'garbage_name' || issue.type === 'no_url',
          });
        }
      });

      const totalProducts = filaments?.length || 0;
      const totalIssues = noUrl + noPrice + garbageName + staleData + suspiciousTitle;
      const validProducts = totalProducts - totalIssues;
      const qualityScore = totalProducts > 0 
        ? Math.round((validProducts / totalProducts) * 100) 
        : 0;

      // Sort issues by severity: garbage > no_url > no_price > suspicious > stale
      const severityOrder: Record<IssueType, number> = {
        garbage_name: 0,
        no_url: 1,
        no_price: 2,
        suspicious_title: 3,
        stale_data: 4,
      };
      issues.sort((a, b) => severityOrder[a.issueType] - severityOrder[b.issueType]);

      return {
        totalProducts,
        validProducts,
        qualityScore,
        issues: { noUrl, noPrice, garbageName, staleData, suspiciousTitle },
        issuesList: issues,
      };
    },
    staleTime: 30000,
  });
}

export function useDeleteBambuFilaments() {
  return async (ids: string[]) => {
    const { error } = await supabase
      .from('filaments')
      .delete()
      .in('id', ids);
    
    if (error) throw error;
    return true;
  };
}
