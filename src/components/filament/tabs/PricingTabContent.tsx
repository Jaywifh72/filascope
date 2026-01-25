import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  ExternalLink, 
  TrendingDown, 
  Store, 
  ShoppingCart,
  ChevronRight,
  CheckCircle2,
  Loader2,
  Bell,
  ArrowDown,
  Clock,
  MapPin,
  Truck,
  Info,
  Globe
} from 'lucide-react';
import { Database } from '@/integrations/supabase/types';
import { useRegion } from '@/contexts/RegionContext';
import { useCurrentPrice } from '@/hooks/useCurrentPrice';
import { usePriceHistory } from '@/hooks/usePriceHistory';
import { usePriceAlerts } from '@/hooks/usePriceAlerts';
import { useRegionalPriceV2 } from '@/hooks/useRegionalPriceV2';
import { cn } from '@/lib/utils';
import { format, parseISO } from 'date-fns';
import type { Retailer } from '../hero/RetailersModal';
import { PriceHistoryChart } from '../PriceHistoryChart';
import { PriceAlertModal } from '../PriceAlertModal';
import { REGIONS } from '@/config/regions';
import { formatPrice as formatCurrencyPrice } from '@/config/currencies';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import type { CurrencyCode } from '@/types/regional';
import { interpolateProductUrl } from '@/utils/regionalStoreUtils';

type Filament = Database["public"]["Tables"]["filaments"]["Row"];

interface PricingTabContentProps {
  filament: Filament;
  retailers: Retailer[];
  pricePerKg: number | null;
  pricePerSpool: number | null;
  affiliateUrl: string | null;
  hasActualRegionalPrice: boolean;
  productUrl?: string | null;
  originalUsUrl?: string | null;
  onViewRetailers: () => void;
  onRetailerClick: (retailer: Retailer) => void;
  brandId?: string | null;
  productSku?: string | null;
}

export function PricingTabContent({
  filament,
  retailers,
  pricePerKg,
  pricePerSpool,
  affiliateUrl,
  hasActualRegionalPrice,
  productUrl,
  originalUsUrl,
  onViewRetailers,
  onRetailerClick,
  brandId,
  productSku,
}: PricingTabContentProps) {
  const { formatPrice, currency, region, convertPrice, getConversionRate } = useRegion();
  const { hasAlert, getAlert } = usePriceAlerts();
  const [priceAlertModalOpen, setPriceAlertModalOpen] = useState(false);

  // Fetch regional stores for this brand
  const { 
    allStores, 
    hasRegionalStore,
    isLoading: storesLoading 
  } = useRegionalPriceV2({
    brandId: brandId || '',
    basePrice: pricePerSpool || undefined,
    baseCurrency: 'USD',
  });

  // Sort stores: user's region first
  const sortedStores = [...allStores].sort((a, b) => {
    if (a.region_code === region) return -1;
    if (b.region_code === region) return 1;
    return 0;
  });

  // Fetch live price to match the sidebar
  const { 
    currentPrice: livePrice, 
    weightGrams: liveWeightGrams,
    isLoading: priceLoading, 
    isLivePrice,
    currency: livePriceCurrency
  } = useCurrentPrice(productUrl, pricePerSpool, originalUsUrl);

  // Get price history data
  const { 
    min: historicalLow,
    isBestIn6Months,
    isLoading: historyLoading
  } = usePriceHistory(filament.id, pricePerKg, 180);

  // Calculate live price per kg
  const liveWeightKg = liveWeightGrams ? liveWeightGrams / 1000 : null;
  const fallbackWeightKg = filament.net_weight_g ? filament.net_weight_g / 1000 : 1;

  let displayPricePerKg: number | null = null;
  let displayPricePerSpool: number | null = null;

  if (isLivePrice && livePrice !== null) {
    displayPricePerSpool = livePrice;
    displayPricePerKg = liveWeightKg 
      ? livePrice / liveWeightKg 
      : livePrice / fallbackWeightKg;
  } else {
    displayPricePerKg = pricePerKg;
    displayPricePerSpool = pricePerSpool;
  }

  // Check for existing alert
  const existingAlert = getAlert(filament.id);
  const alertExists = hasAlert(filament.id);

  // Format live prices in their original currency
  const formatLivePrice = (price: number): string => {
    const symbols: Record<string, string> = { 'USD': '$', 'CAD': 'C$', 'EUR': '€', 'GBP': '£', 'AUD': 'A$', 'JPY': '¥' };
    const symbol = symbols[livePriceCurrency] || '$';
    return `${symbol}${price.toFixed(2)}`;
  };

  const formatDisplayPrice = (price: number | null, forceNoSuffix = true) => {
    if (!price) return null;
    if (isLivePrice) {
      return formatLivePrice(price);
    }
    return formatPrice(price);
  };

  // Get currency symbol for charts
  const currencySymbol = isLivePrice 
    ? ({ 'USD': '$', 'CAD': 'C$', 'EUR': '€', 'GBP': '£', 'AUD': 'A$', 'JPY': '¥' }[livePriceCurrency] || '$')
    : '$';

  // Calculate % above historical low
  const percentAboveLow = displayPricePerKg && historicalLow && historicalLow > 0
    ? Math.round(((displayPricePerKg - historicalLow) / historicalLow) * 100)
    : null;

  return (
    <div className="space-y-6">
      {/* Current Best Price */}
      <Card className="bg-gradient-to-br from-primary/5 to-primary/[0.02] border-primary/20">
        <CardContent className="p-6">
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                <span className="text-sm font-medium text-emerald-400">Best Price Available</span>
                {priceLoading && (
                  <Loader2 className="w-4 h-4 text-muted-foreground animate-spin" />
                )}
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-4xl font-bold text-white">
                  {formatDisplayPrice(displayPricePerKg) || 'N/A'}
                </span>
                <span className="text-lg text-muted-foreground">/kg</span>
              </div>
              {displayPricePerSpool && (
                <p className="text-sm text-muted-foreground mt-1">
                  {formatDisplayPrice(displayPricePerSpool)} per spool ({filament.net_weight_g}g)
                </p>
              )}
              
              {/* Price badges */}
              <div className="flex flex-wrap gap-2 mt-3">
                {isBestIn6Months && (
                  <Badge className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20 gap-1">
                    <ArrowDown className="w-3 h-3" />
                    Best in 6 months
                  </Badge>
                )}
                {alertExists && existingAlert && (
                  <Badge variant="outline" className="gap-1">
                    <Bell className="w-3 h-3" />
                    Alert: {currencySymbol}{existingAlert.targetPrice.toFixed(2)}/kg
                  </Badge>
                )}
              </div>
            </div>
            <div className="flex flex-col gap-2">
              {affiliateUrl && (
                <Button
                  onClick={() => window.open(affiliateUrl, '_blank')}
                  className="gap-2"
                >
                  <ShoppingCart className="w-4 h-4" />
                  Buy Now
                  <ExternalLink className="w-3.5 h-3.5 opacity-70" />
                </Button>
              )}
              <Button
                variant="outline"
                onClick={() => setPriceAlertModalOpen(true)}
                className={cn(
                  "gap-2",
                  alertExists && "border-primary/50 text-primary"
                )}
              >
                <Bell className="w-4 h-4" />
                {alertExists ? 'Edit Alert' : 'Set Alert'}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Historical Low Indicator */}
      {historicalLow && historicalLow > 0 && !historyLoading && (
        <Card className="bg-card/50 border-border">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-emerald-500/10 rounded-lg">
                  <TrendingDown className="w-5 h-5 text-emerald-400" />
                </div>
                <div>
                  <div className="text-sm font-medium">Historical Low Price</div>
                  <div className="text-xs text-muted-foreground flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    Lowest recorded in the past 6 months
                  </div>
                </div>
              </div>
              <div className="text-right">
                <div className="text-lg font-bold text-emerald-400">
                  {currencySymbol}{historicalLow.toFixed(2)}/kg
                </div>
                {percentAboveLow !== null && percentAboveLow > 0 && (
                  <div className="text-xs text-muted-foreground">
                    Current is {percentAboveLow}% above low
                  </div>
                )}
                {percentAboveLow !== null && percentAboveLow <= 0 && (
                  <div className="text-xs text-emerald-400">
                    At or below historical low!
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Price History Chart */}
      <Card className="bg-card/50 border-border">
        <CardContent className="p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-primary/10 rounded-lg text-primary">
              <TrendingDown className="w-5 h-5" />
            </div>
            <h3 className="text-lg font-semibold">Price History</h3>
          </div>
          <PriceHistoryChart
            filamentId={filament.id}
            currentPrice={displayPricePerKg}
            currencySymbol={currencySymbol}
          />
        </CardContent>
      </Card>

      {/* All Retailers */}
      <Card className="bg-card/50 border-border">
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-lg text-primary">
                <Store className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-semibold">Available Retailers</h3>
            </div>
            {retailers.length > 3 && (
              <Button variant="ghost" size="sm" onClick={onViewRetailers}>
                View All ({retailers.length})
                <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            )}
          </div>

          <div className="space-y-3">
            {retailers.map((retailer, idx) => {
              // For the primary store retailer, use the live price if available
              const retailerPrice = (idx === 0 && retailer.id === 'store' && isLivePrice && livePrice !== null)
                ? livePrice
                : retailer.price;
              
              return (
                <div 
                  key={retailer.id}
                  className={cn(
                    "flex items-center justify-between p-4 rounded-lg border transition-colors cursor-pointer",
                    idx === 0 
                      ? "bg-primary/5 border-primary/20 hover:bg-primary/10" 
                      : "bg-muted/20 border-border hover:bg-muted/40"
                  )}
                  onClick={() => {
                    onRetailerClick(retailer);
                    if (retailer.url) window.open(retailer.url, '_blank');
                  }}
                >
                  <div className="flex items-center gap-3">
                    <div className={cn(
                      "w-2 h-2 rounded-full",
                      retailer.inStock ? "bg-emerald-500" : "bg-red-500"
                    )} />
                    <div>
                      <div className="font-medium">{retailer.name}</div>
                      <div className="text-xs text-muted-foreground">
                        {retailer.inStock ? retailer.shippingEstimate : 'Out of stock'}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    {retailerPrice && (
                      <div className="text-right">
                        <div className="font-bold">
                          {idx === 0 && retailer.id === 'store' && isLivePrice
                            ? formatLivePrice(retailerPrice)
                            : formatDisplayPrice(retailerPrice)
                          }
                        </div>
                      </div>
                    )}
                    <ExternalLink className="w-4 h-4 text-muted-foreground" />
                  </div>
                </div>
              );
            })}

            {retailers.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                <Store className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p>No retailers available for this region</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Regional Stores Section */}
      {brandId && (
        <Card className="bg-card/50 border-border">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-primary/10 rounded-lg text-primary">
                  <Globe className="w-5 h-5" />
                </div>
                <h3 className="text-lg font-semibold">Regional Stores</h3>
                {hasRegionalStore && (
                  <Badge className="bg-primary/20 text-primary border-primary/30 gap-1">
                    {REGIONS[region]?.flag} Ships Locally
                  </Badge>
                )}
              </div>
            </div>

            {storesLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
              </div>
            ) : sortedStores.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Globe className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p>No regional stores available for this brand</p>
              </div>
            ) : (
              <div className="space-y-3">
                {sortedStores.map((store) => {
                  const isUserRegion = store.region_code === region;
                  const storeRegion = REGIONS[store.region_code as keyof typeof REGIONS];
                  const storeCurrency = store.currency_code as CurrencyCode;
                  const needsConversion = storeCurrency !== currency;
                  
                  // Get the base price in the store's native currency
                  // If store currency matches base (USD), use pricePerSpool directly
                  // Otherwise, convert from USD to store's currency first
                  const baseUsdPrice = pricePerSpool || 0;
                  const usdToStoreRate = storeCurrency === 'USD' ? 1 : getConversionRate('USD', storeCurrency);
                  const nativePriceInStoreCurrency = baseUsdPrice * usdToStoreRate;
                  
                  // Now convert store's native price to user's currency if needed
                  const storeToUserRate = needsConversion 
                    ? getConversionRate(storeCurrency, currency) 
                    : 1;
                  const displayPrice = nativePriceInStoreCurrency * storeToUserRate;

                  // Generate product-specific URL using interpolation
                  const storeUrl = store.product_url_pattern && productSku
                    ? interpolateProductUrl(store.product_url_pattern, productSku)
                    : store.base_url;

                  return (
                    <div 
                      key={store.id}
                      className={cn(
                        "flex items-center justify-between p-4 rounded-lg border transition-colors cursor-pointer",
                        isUserRegion 
                          ? "bg-primary/5 border-primary/20 hover:bg-primary/10" 
                          : "bg-muted/20 border-border hover:bg-muted/40"
                      )}
                      onClick={() => window.open(storeUrl, '_blank')}
                    >
                      <div className="flex items-center gap-3">
                        {/* Store Region Flag */}
                        <span className="text-2xl">{storeRegion?.flag}</span>
                        
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-medium">{store.store_name}</span>
                            {isUserRegion && (
                              <Badge className="bg-primary/20 text-primary border-primary/30 text-xs">
                                Local
                              </Badge>
                            )}
                          </div>
                          <div className="text-xs text-muted-foreground flex items-center gap-2">
                            {store.ships_from_country && (
                              <>
                                <MapPin className="w-3 h-3" />
                                <span>Ships from {store.ships_from_country}</span>
                              </>
                            )}
                            {store.estimated_shipping_days && (
                              <span>• {store.estimated_shipping_days} days</span>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <div className="flex items-center gap-1 font-bold">
                            {needsConversion && (
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Info className="w-3.5 h-3.5 text-muted-foreground cursor-help" />
                                </TooltipTrigger>
                                <TooltipContent side="top" className="text-xs max-w-xs">
                                  <p className="font-medium">Store Price: {formatCurrencyPrice(nativePriceInStoreCurrency, storeCurrency)}</p>
                                  <p className="text-muted-foreground">Rate: 1 {storeCurrency} = {storeToUserRate.toFixed(4)} {currency}</p>
                                </TooltipContent>
                              </Tooltip>
                            )}
                            <span className={needsConversion ? "text-muted-foreground" : ""}>
                              {needsConversion ? '~' : ''}{formatCurrencyPrice(displayPrice, currency)}
                            </span>
                          </div>
                          {needsConversion && (
                            <div className="text-xs text-muted-foreground">
                              {formatCurrencyPrice(nativePriceInStoreCurrency, storeCurrency)} native
                            </div>
                          )}
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            window.open(storeUrl, '_blank');
                          }}
                        >
                          Visit
                          <ExternalLink className="w-3.5 h-3.5 ml-1" />
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* No Local Store Notice */}
            {!hasRegionalStore && sortedStores.length > 0 && (
              <div className="mt-4 p-3 bg-amber-500/10 border border-amber-500/20 rounded-lg">
                <p className="text-sm text-amber-400">
                  {REGIONS[region]?.flag} {REGIONS[region]?.name}: This brand doesn't have a dedicated store in your region. 
                  Prices shown are converted from other regional stores.
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Price Alert Modal */}
      <PriceAlertModal
        filamentId={filament.id}
        filamentName={filament.product_title}
        currentPrice={displayPricePerKg}
        isOpen={priceAlertModalOpen}
        onClose={() => setPriceAlertModalOpen(false)}
        currencySymbol={currencySymbol}
      />
    </div>
  );
}
