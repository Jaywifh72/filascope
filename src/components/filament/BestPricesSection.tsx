import React from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ExternalLink, Tag, ArrowRight, Store } from 'lucide-react';
import { useCurrency } from '@/hooks/useCurrency';
import { useFilamentListings } from '@/hooks/useFilamentListings';
import { cn } from '@/lib/utils';

interface BestPricesSectionProps {
  filamentId: string;
  onSeeAllPrices?: () => void;
}

export function BestPricesSection({ filamentId, onSeeAllPrices }: BestPricesSectionProps) {
  const { formatRegionalPrice, currency } = useCurrency();
  const { data: listings, isLoading } = useFilamentListings(filamentId, {
    region: 'US',
    currency: currency,
  });

  // Get top 3 available listings sorted by price
  const topListings = React.useMemo(() => {
    if (!listings) return [];
    return listings
      .filter(l => l.available && l.currentPrice)
      .sort((a, b) => (a.currentPrice || 0) - (b.currentPrice || 0))
      .slice(0, 3);
  }, [listings]);

  if (isLoading) {
    return (
      <Card className="bg-card/50 border-border">
        <CardContent className="p-6">
          <div className="animate-pulse space-y-3">
            <div className="h-5 bg-muted rounded w-32" />
            <div className="h-12 bg-muted rounded" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (topListings.length === 0) {
    return null;
  }

  const lowestPrice = topListings[0];

  return (
    <Card className="bg-gradient-to-br from-emerald-500/5 to-emerald-500/[0.02] border-emerald-500/20">
      <CardContent className="p-5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Tag className="w-5 h-5 text-emerald-500" />
            <h3 className="font-semibold text-emerald-400">Best Prices</h3>
          </div>
          {listings && listings.length > 3 && (
            <button
              onClick={onSeeAllPrices}
              className="text-sm text-primary hover:text-primary/80 flex items-center gap-1 transition-colors"
            >
              See all {listings.filter(l => l.available).length} retailers
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        <div className="space-y-2">
          {topListings.map((listing, idx) => (
            <a
              key={listing.id}
              href={listing.affiliateUrl}
              target="_blank"
              rel="noopener noreferrer"
              className={cn(
                "flex items-center justify-between p-3 rounded-lg transition-all",
                idx === 0 
                  ? "bg-emerald-500/10 border border-emerald-500/20 hover:bg-emerald-500/15" 
                  : "bg-muted/30 hover:bg-muted/50"
              )}
            >
              <div className="flex items-center gap-3">
                <Store className={cn(
                  "w-4 h-4",
                  idx === 0 ? "text-emerald-400" : "text-muted-foreground"
                )} />
                <div>
                  <span className={cn(
                    "font-medium text-sm",
                    idx === 0 ? "text-emerald-300" : "text-foreground"
                  )}>
                    {listing.retailerName}
                  </span>
                  {idx === 0 && (
                    <span className="ml-2 text-[10px] uppercase tracking-wider text-emerald-500 font-semibold">
                      Best Price
                    </span>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className={cn(
                  "font-bold",
                  idx === 0 ? "text-emerald-400 text-lg" : "text-foreground"
                )}>
                  {formatRegionalPrice(listing.currentPrice || 0)}
                </span>
                <ExternalLink className="w-3.5 h-3.5 text-muted-foreground" />
              </div>
            </a>
          ))}
        </div>

        {onSeeAllPrices && (
          <Button 
            variant="outline" 
            size="sm" 
            className="w-full mt-4 border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/10"
            onClick={onSeeAllPrices}
          >
            View All Pricing Options
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
