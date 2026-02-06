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

interface BestPricesSectionProps {
  filamentId: string;
  onViewAllPrices?: () => void;
}

export function BestPricesSection({ filamentId, onViewAllPrices }: BestPricesSectionProps) {
  const { region, currency, formatPrice, convertPrice, hasRates } = useRegion();
  
  // Determine the user's region currency for listing queries
  const userCurrency = REGIONS[region as RegionCode]?.defaultCurrency || 'USD';
  
  // Fetch listings for the USER'S region first
  const { data: localListings, isLoading: localLoading } = useFilamentListings(filamentId, {
    region: region,
    currency: userCurrency,
    includeUnavailable: false,
  });
  
  // Also fetch US listings as fallback (if user is not in US)
  const isUserUS = region === 'US';
  const { data: usListings, isLoading: usLoading } = useFilamentListings(
    !isUserUS ? filamentId : undefined,
    {
      region: 'US',
      currency: 'USD',
      includeUnavailable: false,
    }
  );

  const isLoading = localLoading || usLoading;

  // Merge listings: local first, then US (de-duplicated), with price conversion
  const mergedListings = React.useMemo(() => {
    const local = localListings || [];
    const us = usListings || [];
    const seen = new Set(local.map(l => l.listing_id));
    
    // Local listings are already in user's currency — use directly
    const result = local.map(l => ({
      ...l,
      displayPrice: l.current_price,
      isConverted: false,
    }));
    
    // US listings need conversion if user isn't in US
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
    
    // Sort by converted price ascending
    result.sort((a, b) => (a.displayPrice ?? Infinity) - (b.displayPrice ?? Infinity));
    
    return result;
  }, [localListings, usListings, hasRates, convertPrice, isUserUS]);

  // Get top 3 retailers
  const topRetailers = mergedListings.slice(0, 3);
  const totalCount = mergedListings.length;

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
          {topRetailers.map((retailer, idx) => (
            <a
              key={retailer.listing_id}
              href={retailer.affiliate_url || retailer.product_url}
              target="_blank"
              rel="noopener noreferrer"
              className={cn(
                "flex items-center justify-between p-3 rounded-lg border transition-all",
                "hover:scale-[1.01] hover:shadow-md",
                idx === 0
                  ? "bg-emerald-500/10 border-emerald-500/30"
                  : "bg-muted/20 border-border hover:bg-muted/40"
              )}
            >
              <div className="flex items-center gap-3">
                {retailer.retailer_logo ? (
                  <img 
                    src={retailer.retailer_logo} 
                    alt={retailer.retailer_name}
                    className="w-8 h-8 object-contain rounded"
                  />
                ) : (
                  <div className="w-8 h-8 rounded bg-muted flex items-center justify-center text-xs font-bold">
                    {retailer.retailer_name.charAt(0)}
                  </div>
                )}
                <div>
                  <span className="font-medium text-sm">{retailer.retailer_name}</span>
                  {idx === 0 && (
                    <Badge className="ml-2 bg-emerald-500/20 text-emerald-400 border-emerald-500/30 text-[10px]">
                      Best Price
                    </Badge>
                  )}
                  {retailer.isConverted && (
                    <span className="ml-1 text-[10px] text-muted-foreground">(converted)</span>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className={cn(
                  "font-bold",
                  idx === 0 ? "text-emerald-400 text-lg" : "text-foreground"
                )}>
                  {retailer.displayPrice != null 
                    ? formatPrice(retailer.displayPrice, { showApproximate: retailer.isConverted })
                    : 'N/A'}
                </span>
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
