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
  Info,
  Globe,
  AlertTriangle,
  Truck,
  ShoppingBag
} from 'lucide-react';
import { Database } from '@/integrations/supabase/types';
import { useRegion } from '@/contexts/RegionContext';
import { useCurrentPrice } from '@/hooks/useCurrentPrice';
import { usePriceHistory } from '@/hooks/usePriceHistory';
import { usePriceAlerts } from '@/hooks/usePriceAlerts';
import { useUnifiedRegionalPricing, RegionalStoreData } from '@/hooks/useUnifiedRegionalPricing';
import { PriceFreshnessText } from '@/components/price/PriceFreshnessIndicator';
import { cn } from '@/lib/utils';
import type { Retailer } from '../hero/RetailersModal';
import { PriceHistoryChart } from '../PriceHistoryChart';
import { PriceAlertModal } from '../PriceAlertModal';
import { REGIONS } from '@/config/regions';
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

// Store Card Component - Focus on links rather than prices
interface StoreCardProps {
  store: RegionalStoreData;
  productSku: string | null | undefined;
  userRegion: string;
  brandName: string;
}

function StoreCard({ store, productSku, userRegion, brandName }: StoreCardProps) {
  const isUserRegion = store.regionCode === userRegion;
  const storeRegionConfig = REGIONS[store.regionCode as keyof typeof REGIONS];
  
  // Generate product-specific URL
  const storeUrl = store.productUrlPattern && productSku
    ? interpolateProductUrl(store.productUrlPattern, productSku)
    : store.baseUrl;

  const handleClick = () => {
    window.open(storeUrl, '_blank', 'noopener,noreferrer');
  };

  return (
    <div 
      className={cn(
        "p-4 rounded-lg border transition-all cursor-pointer group",
        isUserRegion 
          ? "border-primary bg-primary/5 hover:bg-primary/10" 
          : "border-border hover:border-primary/50 hover:bg-muted/30"
      )}
      onClick={handleClick}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="text-2xl">{store.flag}</span>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-medium">{store.storeName}</span>
              {isUserRegion && (
                <Badge className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20 text-xs">
                  Your Region
                </Badge>
              )}
            </div>
            <div className="text-xs text-muted-foreground flex items-center gap-2">
              <span>{storeRegionConfig?.name || store.regionCode}</span>
              <span>•</span>
              <span>{store.currencyCode}</span>
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <Button 
            size="sm"
            variant={isUserRegion ? "default" : "outline"}
            onClick={(e) => {
              e.stopPropagation();
              handleClick();
            }}
            className={cn(
              "gap-1",
              isUserRegion && [
                "bg-gradient-to-r from-primary to-primary/80",
                "hover:from-primary/90 hover:to-primary/70",
              ]
            )}
          >
            Check Price
            <ExternalLink className="w-3 h-3" />
          </Button>
        </div>
      </div>
      
      {/* Shipping info */}
      <div className="mt-2 flex flex-wrap gap-2">
        {store.shipsFrom && (
          <span className="text-xs text-muted-foreground flex items-center gap-1">
            <MapPin className="w-3 h-3" />
            Ships from {store.shipsFrom}
          </span>
        )}
        {store.estimatedShippingDays && (
          <span className="text-xs text-muted-foreground flex items-center gap-1">
            <Truck className="w-3 h-3" />
            {store.estimatedShippingDays} days
          </span>
        )}
        {store.freeShippingThreshold && (
          <span className="text-xs text-emerald-400 flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3" />
            Free shipping over {store.currencyCode === 'USD' ? '$' : store.currencyCode}{store.freeShippingThreshold}
          </span>
        )}
      </div>
    </div>
  );
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

  // Use unified regional pricing for stores and freshness
  const unifiedPricing = useUnifiedRegionalPricing({
    brandName: filament.vendor || '',
    basePrice: pricePerSpool,
    baseCurrency: 'USD',
    productSlug: productSku || filament.product_handle || undefined,
    originalUrl: productUrl,
    productName: filament.product_title,
    filamentId: filament.id,
    priceLastVerifiedAt: filament.last_scraped_at,
    priceSource: filament.price_source,
    priceConfidence: filament.price_confidence,
  });

  const { 
    allStores, 
    isLocalStore: hasRegionalStore,
    isLoading: storesLoading,
    priceConfidence,
    lastVerifiedAt,
    timeAgo: freshnessTimeAgo,
  } = unifiedPricing;

  // Sort stores: user's region first
  const sortedStores = [...allStores].sort((a, b) => {
    if (a.regionCode === region) return -1;
    if (b.regionCode === region) return 1;
    return 0;
  });

  // Fetch live price for chart/alert purposes
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

  // Calculate display price for alerts/charts
  const liveWeightKg = liveWeightGrams ? liveWeightGrams / 1000 : null;
  const fallbackWeightKg = filament.net_weight_g ? filament.net_weight_g / 1000 : 1;

  let displayPricePerKg: number | null = null;
  if (isLivePrice && livePrice !== null) {
    displayPricePerKg = liveWeightKg 
      ? livePrice / liveWeightKg 
      : livePrice / fallbackWeightKg;
  } else {
    displayPricePerKg = pricePerKg;
  }

  // Check for existing alert
  const existingAlert = getAlert(filament.id);
  const alertExists = hasAlert(filament.id);

  // Currency symbol
  const currencySymbol = isLivePrice 
    ? ({ 'USD': '$', 'CAD': 'C$', 'EUR': '€', 'GBP': '£', 'AUD': 'A$', 'JPY': '¥' }[livePriceCurrency] || '$')
    : '$';

  return (
    <div className="space-y-6">
      {/* Honest Pricing Disclaimer */}
      <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <AlertTriangle className="h-5 w-5 text-amber-500 mt-0.5 shrink-0" />
          <div>
            <p className="text-sm text-amber-200 font-medium">
              Prices change frequently
            </p>
            <p className="text-sm text-amber-200/80 mt-1">
              We track prices for reference, but stores run sales and promotions that we can't always capture in real-time. 
              Click on a store below to see the current price.
            </p>
          </div>
        </div>
      </div>

      {/* Where to Buy - Regional Stores */}
      <Card className="bg-card/50 border-border">
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-lg text-primary">
                <Globe className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-semibold">Where to Buy</h3>
                <p className="text-xs text-muted-foreground">Official {filament.vendor} stores</p>
              </div>
            </div>
            {hasRegionalStore && (
              <Badge className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20 gap-1">
                <CheckCircle2 className="w-3 h-3" />
                Available in {REGIONS[region]?.name}
              </Badge>
            )}
          </div>

          {storesLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
            </div>
          ) : sortedStores.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <ShoppingBag className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p className="mb-2">No regional stores found for {filament.vendor}</p>
              {productUrl && (
                <Button 
                  variant="outline" 
                  onClick={() => window.open(productUrl, '_blank', 'noopener,noreferrer')}
                  className="gap-2"
                >
                  Visit Product Page
                  <ExternalLink className="w-3.5 h-3.5" />
                </Button>
              )}
            </div>
          ) : (
            <div className="space-y-3">
              {sortedStores.map((store) => (
                <StoreCard
                  key={store.id}
                  store={store}
                  productSku={productSku || filament.product_handle}
                  userRegion={region}
                  brandName={filament.vendor || 'Store'}
                />
              ))}
            </div>
          )}

          {/* No Local Store Notice */}
          {!hasRegionalStore && sortedStores.length > 0 && (
            <div className="mt-4 p-3 bg-amber-500/10 border border-amber-500/20 rounded-lg">
              <p className="text-sm text-amber-400 flex items-center gap-2">
                <Info className="w-4 h-4 shrink-0" />
                {filament.vendor} doesn't have a dedicated store in {REGIONS[region]?.name}. 
                You may need to order from another region.
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Price Alerts - Still useful for tracking */}
      <Card className="bg-card/50 border-border">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-lg text-primary">
                <Bell className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-semibold">Price Alerts</h3>
                <p className="text-xs text-muted-foreground">Get notified when we detect a price drop</p>
              </div>
            </div>
            <Button
              variant={alertExists ? "default" : "outline"}
              onClick={() => setPriceAlertModalOpen(true)}
              className={cn(
                "gap-2",
                alertExists && "border-primary/50"
              )}
            >
              <Bell className="w-4 h-4" />
              {alertExists ? 'Edit Alert' : 'Set Price Alert'}
            </Button>
          </div>
          
          {alertExists && existingAlert && (
            <div className="mt-4 p-3 bg-primary/10 border border-primary/20 rounded-lg">
              <p className="text-sm text-primary flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4" />
                Alert set for {currencySymbol}{existingAlert.targetPrice.toFixed(2)}/kg
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Price History Chart - Still valuable context */}
      <Card className="bg-card/50 border-border">
        <CardContent className="p-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-primary/10 rounded-lg text-primary">
              <TrendingDown className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-semibold">Price History</h3>
              <p className="text-xs text-muted-foreground">Track price trends over time</p>
            </div>
          </div>
          
          {/* Historical low indicator */}
          {historicalLow && historicalLow > 0 && !historyLoading && (
            <div className="mb-4 p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-lg flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ArrowDown className="w-4 h-4 text-emerald-400" />
                <span className="text-sm text-emerald-400">Lowest recorded in 6 months:</span>
              </div>
              <span className="font-bold text-emerald-400">{currencySymbol}{historicalLow.toFixed(2)}/kg</span>
            </div>
          )}
          
          <PriceHistoryChart
            filamentId={filament.id}
            currentPrice={displayPricePerKg}
            currencySymbol={currencySymbol}
          />
          
          <p className="text-xs text-muted-foreground mt-4 text-center">
            Historical data is based on our periodic price checks. Actual prices may have varied.
          </p>
        </CardContent>
      </Card>

      {/* Other Retailers - Keep but simplify */}
      {retailers.length > 0 && (
        <Card className="bg-card/50 border-border">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-primary/10 rounded-lg text-primary">
                  <Store className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold">Other Retailers</h3>
                  <p className="text-xs text-muted-foreground">Amazon and third-party sellers</p>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              {retailers.map((retailer) => (
                <div 
                  key={retailer.id}
                  className={cn(
                    "flex items-center justify-between p-3 rounded-lg border transition-colors cursor-pointer",
                    "bg-muted/20 border-border hover:bg-muted/40 hover:border-primary/30"
                  )}
                  onClick={() => {
                    onRetailerClick(retailer);
                    if (retailer.url) window.open(retailer.url, '_blank', 'noopener,noreferrer');
                  }}
                >
                  <div className="flex items-center gap-3">
                    <div className={cn(
                      "w-2 h-2 rounded-full shrink-0",
                      retailer.inStock ? "bg-emerald-500" : "bg-red-500"
                    )} />
                    <div>
                      <div className="font-medium text-sm">{retailer.name}</div>
                      <div className="text-xs text-muted-foreground">
                        {retailer.inStock ? retailer.shippingEstimate : 'Check availability'}
                      </div>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="gap-1"
                  >
                    View
                    <ExternalLink className="w-3 h-3" />
                  </Button>
                </div>
              ))}
            </div>
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
