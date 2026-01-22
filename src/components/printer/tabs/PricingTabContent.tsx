import React from 'react';
import { DollarSign, TrendingDown, TrendingUp, Globe, Store, ExternalLink, Tag, Clock } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { PrinterPriceChart } from '@/components/PrinterPriceChart';
import { useCurrency } from '@/hooks/useCurrency';
import { useAffiliateLinks } from '@/hooks/useAffiliateLinks';

interface PricingTabContentProps {
  printer: any;
  brand: string | null;
  displayPrice: number | null | undefined;
  displayMsrp: number | null | undefined;
  isLivePrice: boolean;
  livePriceCurrency?: string;
}

export function PricingTabContent({ 
  printer, 
  brand, 
  displayPrice, 
  displayMsrp,
  isLivePrice,
  livePriceCurrency
}: PricingTabContentProps) {
  const { formatPrice, formatRegionalPrice, currency } = useCurrency();
  const { getAffiliateUrl, getAmazonUrl } = useAffiliateLinks();

  // Calculate savings if there's a discount
  const savings = displayMsrp && displayPrice ? displayMsrp - displayPrice : null;
  const savingsPercent = displayMsrp && displayPrice && savings && savings > 0 
    ? Math.round((savings / displayMsrp) * 100) 
    : null;

  // Format price based on whether it's a live regional price or database USD
  const formatDisplayPrice = (price: number | null | undefined) => {
    if (price === null || price === undefined) return null;
    if (isLivePrice && livePriceCurrency && livePriceCurrency === currency) {
      return formatRegionalPrice(price);
    }
    return formatPrice(price);
  };

  return (
    <div className="space-y-6">
      {/* Current Pricing Card */}
      <Card className="overflow-hidden">
        <CardHeader className="pb-4 bg-gradient-to-r from-primary/5 to-transparent">
          <CardTitle className="text-lg font-semibold flex items-center gap-2">
            <DollarSign className="h-5 w-5 text-primary" />
            Current Pricing
            {isLivePrice && (
              <Badge variant="outline" className="text-xs ml-auto">
                <span className="w-1.5 h-1.5 bg-green-500 rounded-full mr-1.5 animate-pulse" />
                Live
              </Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Main Price Display */}
          <div className="flex flex-col md:flex-row md:items-end gap-4">
            <div className="flex-1">
              {displayPrice ? (
                <div className="space-y-1">
                  <div className="text-4xl font-bold text-primary">
                    {formatDisplayPrice(displayPrice)}
                  </div>
                  {displayMsrp && displayMsrp > displayPrice && (
                    <div className="flex items-center gap-2">
                      <span className="text-lg text-muted-foreground line-through">
                        {formatDisplayPrice(displayMsrp)}
                      </span>
                      {savingsPercent && (
                        <Badge className="bg-green-500/20 text-green-600 border-green-500/30">
                          <TrendingDown className="h-3 w-3 mr-1" />
                          Save {savingsPercent}%
                        </Badge>
                      )}
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-2xl text-muted-foreground">Price not available</div>
              )}
            </div>
            
            {/* Quick CTA */}
            {printer.official_store_url && (
              <a 
                href={getAffiliateUrl(printer.official_store_url, brand) || printer.official_store_url} 
                target="_blank" 
                rel="noopener noreferrer"
              >
                <Button size="lg" className="gap-2">
                  <Store className="h-4 w-4" />
                  Buy from {brand || 'Store'}
                  <ExternalLink className="h-3 w-3" />
                </Button>
              </a>
            )}
          </div>

          {/* Price Sources Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t">
            {/* Store Price */}
            <div className="p-4 rounded-lg bg-muted/30 border border-border/50">
              <div className="flex items-center gap-2 mb-2">
                <Store className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">Official Store</span>
              </div>
              <div className="text-xl font-bold">
                {printer.current_price_usd_store 
                  ? formatPrice(printer.current_price_usd_store)
                  : '—'
                }
              </div>
            </div>

            {/* Amazon Price */}
            <div className="p-4 rounded-lg bg-muted/30 border border-border/50">
              <div className="flex items-center gap-2 mb-2">
                <Tag className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">Amazon</span>
              </div>
              <div className="text-xl font-bold">
                {printer.current_price_usd_amazon 
                  ? formatPrice(printer.current_price_usd_amazon)
                  : '—'
                }
              </div>
            </div>

            {/* MSRP */}
            <div className="p-4 rounded-lg bg-muted/30 border border-border/50">
              <div className="flex items-center gap-2 mb-2">
                <Globe className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">MSRP</span>
              </div>
              <div className="text-xl font-bold">
                {printer.msrp_usd 
                  ? formatPrice(printer.msrp_usd)
                  : '—'
                }
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Regional MSRP */}
      {(printer.msrp_cad || printer.msrp_eur || printer.msrp_gbp) && (
        <Card>
          <CardHeader className="pb-4">
            <CardTitle className="text-lg font-semibold flex items-center gap-2">
              <Globe className="h-5 w-5 text-primary" />
              Regional MSRP
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {printer.msrp_usd && (
                <div className="p-3 rounded-lg bg-muted/30 border border-border/50">
                  <div className="text-xs text-muted-foreground mb-1">USD</div>
                  <div className="text-lg font-bold">${printer.msrp_usd}</div>
                </div>
              )}
              {printer.msrp_cad && (
                <div className="p-3 rounded-lg bg-muted/30 border border-border/50">
                  <div className="text-xs text-muted-foreground mb-1">CAD</div>
                  <div className="text-lg font-bold">C${printer.msrp_cad}</div>
                </div>
              )}
              {printer.msrp_eur && (
                <div className="p-3 rounded-lg bg-muted/30 border border-border/50">
                  <div className="text-xs text-muted-foreground mb-1">EUR</div>
                  <div className="text-lg font-bold">€{printer.msrp_eur}</div>
                </div>
              )}
              {printer.msrp_gbp && (
                <div className="p-3 rounded-lg bg-muted/30 border border-border/50">
                  <div className="text-xs text-muted-foreground mb-1">GBP</div>
                  <div className="text-lg font-bold">£{printer.msrp_gbp}</div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Price History Chart */}
      <PrinterPriceChart
        printerId={printer.id}
        currentStorePrice={printer.current_price_usd_store}
        currentAmazonPrice={printer.current_price_usd_amazon}
        msrp={printer.msrp_usd}
      />

      {/* Availability & Status */}
      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="text-lg font-semibold flex items-center gap-2">
            <Clock className="h-5 w-5 text-primary" />
            Availability & Status
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
              <span className="text-sm text-muted-foreground">Status</span>
              {printer.discontinued ? (
                <Badge variant="destructive">Discontinued</Badge>
              ) : (
                <Badge variant="outline" className="bg-green-500/10 text-green-600 border-green-500/30">
                  Available
                </Badge>
              )}
            </div>
            {printer.release_date && (
              <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                <span className="text-sm text-muted-foreground">Release Date</span>
                <span className="text-sm font-medium">{printer.release_date}</span>
              </div>
            )}
            {printer.price_tier && (
              <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                <span className="text-sm text-muted-foreground">Price Tier</span>
                <Badge variant="secondary" className="capitalize">{printer.price_tier}</Badge>
              </div>
            )}
            {printer.target_user_segment && (
              <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                <span className="text-sm text-muted-foreground">Target User</span>
                <Badge variant="secondary">{printer.target_user_segment}</Badge>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Where to Buy */}
      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="text-lg font-semibold flex items-center gap-2">
            <Store className="h-5 w-5 text-primary" />
            Where to Buy
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-3">
            {printer.official_store_url && (
              <a 
                href={getAffiliateUrl(printer.official_store_url, brand) || printer.official_store_url}
                target="_blank" 
                rel="noopener noreferrer"
              >
                <Button variant="outline" className="gap-2">
                  <Store className="h-4 w-4" />
                  {brand || 'Official'} Store
                  <ExternalLink className="h-3 w-3" />
                </Button>
              </a>
            )}
            {printer.amazon_link_us && (
              <a 
                href={getAmazonUrl(printer.amazon_link_us) || printer.amazon_link_us}
                target="_blank" 
                rel="noopener noreferrer"
              >
                <Button variant="outline" className="gap-2">
                  <Tag className="h-4 w-4" />
                  Amazon US
                  <ExternalLink className="h-3 w-3" />
                </Button>
              </a>
            )}
            {printer.amazon_link_uk && (
              <a 
                href={getAmazonUrl(printer.amazon_link_uk) || printer.amazon_link_uk}
                target="_blank" 
                rel="noopener noreferrer"
              >
                <Button variant="outline" className="gap-2">
                  <Tag className="h-4 w-4" />
                  Amazon UK
                  <ExternalLink className="h-3 w-3" />
                </Button>
              </a>
            )}
            {printer.amazon_link_de && (
              <a 
                href={getAmazonUrl(printer.amazon_link_de) || printer.amazon_link_de}
                target="_blank" 
                rel="noopener noreferrer"
              >
                <Button variant="outline" className="gap-2">
                  <Tag className="h-4 w-4" />
                  Amazon DE
                  <ExternalLink className="h-3 w-3" />
                </Button>
              </a>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
