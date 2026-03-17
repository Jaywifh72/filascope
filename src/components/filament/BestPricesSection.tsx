import React, { useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2, ExternalLink, Store } from 'lucide-react';
import { useFilamentListings } from '@/hooks/useFilamentListings';
import { useRegion } from '@/contexts/RegionContext';
import { REGIONS } from '@/config/regions';
import type { RegionCode } from '@/types/regional';
import { cn } from '@/lib/utils';
import type { PriceCandidate } from '@/hooks/useFilamentDetailPricing';
import { useAffiliateLink } from '@/hooks/useAffiliateLink';
import { useAmazonBestDetails } from '@/hooks/useAmazonProductDetails';
import { AmazonBadges } from './AmazonBadges';

interface BestPricesSectionProps {
  filamentId: string;
  onViewAllPrices?: () => void;
  totalRetailerCount?: number;
  candidates?: PriceCandidate[];
  candidatesLoading?: boolean;
  vendor?: string | null;
}

export function BestPricesSection({ filamentId, onViewAllPrices, totalRetailerCount, candidates, candidatesLoading, vendor }: BestPricesSectionProps) {
  const { buildLink, trackAndOpen, hasAffiliate } = useAffiliateLink(vendor);
  const { region, currency, formatPrice, convertPrice, hasRates } = useRegion();

  // Fetch Amazon product details for this filament (Prime, coupons, ratings)
  const { data: amazonDetails } = useAmazonBestDetails(filamentId, region);

  const useFallbackFetch = candidates === undefined;
  const userCurrency = REGIONS[region as RegionCode]?.defaultCurrency || 'USD';

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

  // Get the single best-price retailer
  const bestRetailer = React.useMemo(() => {
    if (candidates && candidates.length > 0) {
      const c = candidates[0];
      return {
        name: c.name,
        url: c.affiliateUrl || c.productUrl,
        displayPrice: c.spoolPrice,
        pricePerKg: c.pricePerKg,
        isConverted: c.isConverted,
        isLocal: c.isLocal,
        logo: c.retailerLogo || null,
      };
    }
    if (fallbackListings.length > 0) {
      const r = fallbackListings[0];
      return {
        name: r.retailer_name,
        url: r.affiliate_url || r.product_url,
        displayPrice: r.displayPrice,
        pricePerKg: null as number | null,
        isConverted: r.isConverted,
        isLocal: (r.region?.toUpperCase() || '') === region,
        logo: r.retailer_logo || null,
      };
    }
    return null;
  }, [candidates, fallbackListings, region]);

  const totalCount = totalRetailerCount ?? (candidates ? candidates.length : fallbackListings.length);

  // Check if the best retailer is Amazon (for showing Amazon-specific badges)
  const isAmazonRetailer = useMemo(() => {
    if (!bestRetailer) return false;
    const name = bestRetailer.name.toLowerCase();
    return name.includes('amazon') || bestRetailer.url.includes('amazon.');
  }, [bestRetailer]);

  const buyNowUrl = useMemo(() => {
    if (!bestRetailer) return '';
    return hasAffiliate ? buildLink(bestRetailer.url) : bestRetailer.url;
  }, [bestRetailer, hasAffiliate, buildLink]);

  if (isLoading) {
    return (
      <Card className="bg-card/50 border-border">
        <CardContent className="p-5">
          <div className="flex items-center gap-3">
            <Store className="w-5 h-5 text-primary" />
            <h3 className="text-lg font-semibold">Best Prices</h3>
          </div>
          <div className="flex items-center justify-center py-6">
            <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!bestRetailer) return null;

  const retailerLabel = totalCount === 1
    ? '1 retailer carries this filament'
    : `${totalCount} retailers carry this filament`;

  return (
    <Card className="bg-gradient-to-br from-emerald-500/5 to-emerald-500/[0.02] border-emerald-500/20">
      <CardContent className="p-5">
        {/* Header */}
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 bg-emerald-500/10 rounded-lg text-emerald-500">
            <Store className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-base font-semibold">Best Prices</h3>
            <p className="text-xs text-muted-foreground">{retailerLabel}</p>
          </div>
        </div>

        {/* Best price row */}
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            {bestRetailer.logo ? (
              <img
                src={bestRetailer.logo}
                alt={bestRetailer.name}
                className="w-8 h-8 object-contain rounded flex-shrink-0"
                onError={(e) => {
                  const target = e.currentTarget;
                  target.style.display = 'none';
                  target.parentElement!.innerHTML = `<div class="w-8 h-8 rounded bg-muted flex items-center justify-center text-xs font-bold flex-shrink-0">${bestRetailer.name.charAt(0)}</div>`;
                }}
              />
            ) : (
              <div className="w-8 h-8 rounded bg-muted flex items-center justify-center text-xs font-bold flex-shrink-0">
                {bestRetailer.name.charAt(0)}
              </div>
            )}
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="font-medium text-sm truncate">{bestRetailer.name}</span>
                <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30 text-[10px] flex-shrink-0">
                  Best Price
                </Badge>
                {bestRetailer.isLocal && (
                  <Badge className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20 text-[10px] flex-shrink-0">
                    Local
                  </Badge>
                )}
              </div>
              <div className="flex items-baseline gap-1.5 mt-0.5">
                <span className="text-lg font-bold text-emerald-400">
                  {bestRetailer.displayPrice != null
                    ? formatPrice(bestRetailer.displayPrice, { showApproximate: bestRetailer.isConverted })
                    : 'N/A'}
                </span>
                <span className="text-xs text-muted-foreground">/spool</span>
                {bestRetailer.pricePerKg != null && (
                  <span className="text-[11px] text-muted-foreground ml-1">
                    ({formatPrice(bestRetailer.pricePerKg, { showApproximate: bestRetailer.isConverted })}/kg)
                  </span>
                )}
              </div>
              {/* Amazon badges: show if best retailer is Amazon and we have details */}
              {isAmazonRetailer && amazonDetails && (
                <AmazonBadges details={amazonDetails} layout="inline" className="mt-1" />
              )}
            </div>
          </div>

          {/* Buy Now CTA */}
          <Button
            asChild
            size="sm"
            className="bg-emerald-600 hover:bg-emerald-500 text-white gap-1.5 flex-shrink-0"
          >
            <a
              href={buyNowUrl}
              target="_blank"
              rel={hasAffiliate ? "nofollow sponsored noopener noreferrer" : "noopener noreferrer"}
              onClick={(e) => {
                if (hasAffiliate && bestRetailer) {
                  e.preventDefault();
                  trackAndOpen(bestRetailer.url, { productName: bestRetailer.name, sourcePage: window.location.pathname, sourceComponent: 'best_prices_section' });
                }
              }}
            >
              Buy Now
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </Button>
        </div>

        {/* Teaser link to Pricing tab (only if 2+ retailers) */}
        {totalCount >= 2 && onViewAllPrices && (
          <button
            onClick={onViewAllPrices}
            className="mt-3 text-sm text-primary font-medium hover:underline transition-colors"
          >
            Compare all {totalCount} prices, view price history &amp; set alerts →
          </button>
        )}
      </CardContent>
    </Card>
  );
}
