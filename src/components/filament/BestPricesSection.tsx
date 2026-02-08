import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2, ExternalLink, ChevronRight, Store, CheckCircle2 } from 'lucide-react';
import { useFilamentListings } from '@/hooks/useFilamentListings';
import { useRegion } from '@/contexts/RegionContext';
import { REGIONS } from '@/config/regions';
import type { RegionCode } from '@/types/regional';
import { cn } from '@/lib/utils';
import type { PriceCandidate } from '@/hooks/useFilamentDetailPricing';

interface BestPricesSectionProps {
  filamentId: string;
  onViewAllPrices?: () => void;
  /** Override the retailer count to keep it consistent with the sidebar */
  totalRetailerCount?: number;
  /** Pre-computed candidates from the unified pricing hook (preferred) */
  candidates?: PriceCandidate[];
  /** Whether the unified pricing data is still loading */
  candidatesLoading?: boolean;
}

export function BestPricesSection({ filamentId, onViewAllPrices, totalRetailerCount, candidates, candidatesLoading }: BestPricesSectionProps) {
  const { region, currency, formatPrice, convertPrice, hasRates } = useRegion();
  
  // ── If candidates are provided from parent, use them directly ──
  // This ensures the BestPricesSection shows the exact same data as the sidebar.
  const useFallbackFetch = candidates === undefined;
  
  // Determine the user's region currency for listing queries (only used in fallback mode)
  const userCurrency = REGIONS[region as RegionCode]?.defaultCurrency || 'USD';
  
  // Fallback: Fetch listings independently (only when candidates NOT provided)
  const { data: localListings, isLoading: localLoading } = useFilamentListings(
    useFallbackFetch ? filamentId : undefined,
    { region: region, currency: userCurrency, includeUnavailable: false }
  );
  const isUserUS = region === 'US';
  const { data: usListings, isLoading: usLoading } = useFilamentListings(
    useFallbackFetch && !isUserUS ? filamentId : undefined,
    { region: 'US', currency: 'USD', includeUnavailable: false }
  );

  const isLoading = useFallbackFetch ? (localLoading || usLoading) : (candidatesLoading ?? false);

  // Merge fallback listings (only used when no candidates prop)
  const fallbackListings = React.useMemo(() => {
    if (!useFallbackFetch) return [];
    const local = localListings || [];
    const us = usListings || [];
    const seen = new Set(local.map(l => l.listing_id));
    
    const result = local.map(l => ({
      ...l,
      displayPrice: l.current_price,
      isConverted: false,
    }));
    
    for (const listing of us) {
      if (seen.has(listing.listing_id)) continue;
      if (!listing.current_price) continue;
      const converted = hasRates 
        ? convertPrice(listing.current_price, 'USD')
        : listing.current_price;
      result.push({
        ...listing,
        displayPrice: converted,
        isConverted: !isUserUS && hasRates,
      });
    }
    
    result.sort((a, b) => (a.displayPrice ?? Infinity) - (b.displayPrice ?? Infinity));
    return result;
  }, [useFallbackFetch, localListings, usListings, hasRates, convertPrice, isUserUS]);

  // Build the display list from either candidates (preferred) or fallback
  const topRetailers = React.useMemo(() => {
    if (candidates) {
      // Candidates are already sorted by pricePerKg ascending (cheapest first)
      return candidates.slice(0, 3).map((c, idx) => ({
        key: `${c.name}-${idx}`,
        name: c.name,
        url: c.affiliateUrl || c.productUrl,
        displayPrice: c.spoolPrice,
        pricePerKg: c.pricePerKg,
        isConverted: c.isConverted,
        isLocal: c.isLocal,
        isCheapest: idx === 0, // First item is the absolute cheapest after global sort
        logo: c.retailerLogo || null,
      }));
    }
    return fallbackListings.slice(0, 3).map((r, idx) => ({
      key: r.listing_id,
      name: r.retailer_name,
      url: r.affiliate_url || r.product_url,
      displayPrice: r.displayPrice,
      pricePerKg: null as number | null,
      isConverted: r.isConverted,
      isLocal: (r.region?.toUpperCase() || '') === region,
      isCheapest: idx === 0,
      logo: r.retailer_logo || null,
    }));
  }, [candidates, fallbackListings, region]);

  const totalCount = totalRetailerCount ?? (candidates ? candidates.length : fallbackListings.length);

  if (isLoading) {
    return (
      <Card className="bg-card/50 border-border">
        <CardContent className="p-6">
          <div className="flex items-center gap-3 mb-4">
            <Store className="w-5 h-5 text-primary" />
            <h3 className="text-lg font-semibold">Best Prices</h3>
          </div>
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!topRetailers.length) {
    return null;
  }

  return (
    <Card className="bg-gradient-to-br from-emerald-500/5 to-emerald-500/[0.02] border-emerald-500/20">
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-emerald-500/10 rounded-lg text-emerald-500">
              <Store className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-semibold">Best Prices</h3>
              <p className="text-xs text-muted-foreground">Compare {totalCount} retailers</p>
            </div>
          </div>
          {totalCount > 3 && (
            <Button variant="ghost" size="sm" onClick={onViewAllPrices} className="gap-1">
              View All
              <ChevronRight className="w-4 h-4" />
            </Button>
          )}
        </div>

        <div className="space-y-2">
          {topRetailers.map((retailer) => (
            <a
              key={retailer.key}
              href={retailer.url}
              target="_blank"
              rel="noopener noreferrer"
              className={cn(
                "flex items-center justify-between p-3 rounded-lg border transition-all",
                "hover:scale-[1.01] hover:shadow-md",
                retailer.isCheapest
                  ? "bg-emerald-500/10 border-emerald-500/30"
                  : "bg-muted/20 border-border hover:bg-muted/40"
              )}
            >
              <div className="flex items-center gap-3">
                {retailer.logo ? (
                  <img 
                    src={retailer.logo} 
                    alt={retailer.name}
                    className="w-8 h-8 object-contain rounded"
                    onError={(e) => {
                      const target = e.currentTarget;
                      target.style.display = 'none';
                      target.parentElement!.innerHTML = `<div class="w-8 h-8 rounded bg-muted flex items-center justify-center text-xs font-bold">${retailer.name.charAt(0)}</div>`;
                    }}
                  />
                ) : (
                  <div className="w-8 h-8 rounded bg-muted flex items-center justify-center text-xs font-bold">
                    {retailer.name.charAt(0)}
                  </div>
                )}
                <div>
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="font-medium text-sm">{retailer.name}</span>
                    {retailer.isCheapest && (
                      <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30 text-[10px]">
                        Best Price
                      </Badge>
                    )}
                    {retailer.isLocal && (
                      <Badge className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20 text-[10px]">
                        Local
                      </Badge>
                    )}
                  </div>
                  {retailer.isConverted && (
                    <span className="text-[10px] text-muted-foreground">(converted)</span>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <div className="text-right">
                  <div className={cn(
                    "font-bold",
                    retailer.isCheapest ? "text-emerald-400 text-lg" : "text-foreground"
                  )}>
                    {retailer.displayPrice != null 
                      ? formatPrice(retailer.displayPrice, { showApproximate: retailer.isConverted })
                      : 'N/A'}
                    <span className="text-xs font-normal text-muted-foreground ml-0.5">/spool</span>
                  </div>
                  {retailer.pricePerKg != null && (
                    <div className="text-[11px] text-muted-foreground">
                      {formatPrice(retailer.pricePerKg, { showApproximate: retailer.isConverted })}/kg
                    </div>
                  )}
                </div>
                <ExternalLink className="w-4 h-4 text-muted-foreground" />
              </div>
            </a>
          ))}
        </div>

        {onViewAllPrices && (
          <Button 
            variant="outline" 
            className="w-full mt-4 gap-2"
            onClick={onViewAllPrices}
          >
            <CheckCircle2 className="w-4 h-4" />
            See All {totalCount} Retailers
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
