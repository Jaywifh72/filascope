import React, { useState, useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  ExternalLink, 
  TrendingDown, 
  Store, 
  CheckCircle2,
  Loader2,
  Bell,
  ArrowDown,
  Globe,
  Truck,
  ShoppingCart,
  Clock
} from 'lucide-react';
import { formatDistanceToNow, differenceInDays } from 'date-fns';
import { Database } from '@/integrations/supabase/types';
import { useRegion } from '@/contexts/RegionContext';
import { useCurrentPrice } from '@/hooks/useCurrentPrice';
import { usePriceHistory } from '@/hooks/usePriceHistory';
import { useDatabasePriceAlerts } from '@/hooks/useDatabasePriceAlerts';
import { useUnifiedRegionalPricing, RegionalStoreData } from '@/hooks/useUnifiedRegionalPricing';
import { cn } from '@/lib/utils';
import type { Retailer } from '../hero/RetailersModal';
import { PriceHistoryChart } from '../PriceHistoryChart';
import { DatabasePriceAlertModal } from '../DatabasePriceAlertModal';
import { REGIONS } from '@/config/regions';
import { interpolateProductUrl } from '@/utils/regionalStoreUtils';
import type { CurrencyCode } from '@/types/regional';

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

// Currency symbols map
const CURRENCY_SYMBOLS: Record<string, string> = {
  USD: '$',
  CAD: 'C$',
  EUR: '€',
  GBP: '£',
  AUD: 'A$',
  JPY: '¥',
  CNY: '¥',
  KRW: '₩',
  PLN: 'zł',
  CZK: 'Kč',
  SEK: 'kr',
  CHF: 'CHF',
  INR: '₹',
  MXN: 'MX$',
};

// Unified store item for the list
interface UnifiedStoreItem {
  id: string;
  name: string;
  regionCode: string;
  regionFlag: string;
  nativePrice: number | null;
  nativeCurrency: string;
  convertedPrice: number | null;
  userCurrency: string;
  isLocal: boolean;
  url: string;
  type: 'official' | 'marketplace' | 'retailer';
  inStock: boolean;
  lastChecked?: string | null;
}

// Store Row Component
function StoreRow({ store, userCurrencySymbol, lastScrapedAt }: { store: UnifiedStoreItem; userCurrencySymbol: string; lastScrapedAt?: string | null }) {
  const nativeSymbol = CURRENCY_SYMBOLS[store.nativeCurrency] || store.nativeCurrency;
  
  // Determine freshness for display
  const checkedAt = store.lastChecked || lastScrapedAt;
  const freshnessText = checkedAt ? (() => {
    const date = new Date(checkedAt);
    if (isNaN(date.getTime())) return null;
    const days = differenceInDays(new Date(), date);
    if (days < 1) return 'Today';
    if (days === 1) return '1 day ago';
    return `${days} days ago`;
  })() : null;

  const handleClick = () => {
    window.open(store.url, '_blank', 'noopener,noreferrer');
  };

  return (
    <div 
      className={cn(
        "flex items-center justify-between p-3 rounded-lg border transition-all",
        store.isLocal 
          ? "border-primary/30 bg-primary/5" 
          : "border-border bg-muted/10 hover:bg-muted/20",
        !store.inStock && "opacity-60"
      )}
    >
      {/* Store Info */}
      <div className="flex items-center gap-3 min-w-0 flex-1">
        {/* Store Icon/Logo placeholder */}
        <div className={cn(
          "w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0",
          store.type === 'official' ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"
        )}>
          <Store className="w-4 h-4" />
        </div>
        
        {/* Name & Region */}
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-medium text-sm truncate">{store.name}</span>
            {store.isLocal && (
              <Badge variant="outline" className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20 text-[10px] px-1.5 py-0">
                Local
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <span>{store.regionFlag}</span>
            <span>{REGIONS[store.regionCode as keyof typeof REGIONS]?.name || store.regionCode}</span>
            {!store.isLocal && (
              <>
                <span>•</span>
                <span className="flex items-center gap-0.5">
                  <Truck className="w-3 h-3" />
                  International
                </span>
              </>
            )}
          </div>
          {/* Last checked timestamp */}
          {freshnessText && (
            <div className="flex items-center gap-1 mt-0.5 text-[10px] text-muted-foreground/70">
              <Clock className="w-2.5 h-2.5" />
              <span>Last checked: {freshnessText}</span>
            </div>
          )}
        </div>
      </div>

      {/* Price */}
      <div className="flex items-center gap-3 flex-shrink-0">
        <div className="text-right">
          {store.nativePrice !== null ? (
            <>
              {store.isLocal ? (
                <div className="font-semibold text-sm">
                  {nativeSymbol}{store.nativePrice.toFixed(2)}/kg
                </div>
              ) : (
                <>
                  <div className="font-semibold text-sm">
                    ~{userCurrencySymbol}{store.convertedPrice?.toFixed(2) || '—'}/kg
                  </div>
                  <div className="text-xs text-muted-foreground">
                    ({nativeSymbol}{store.nativePrice.toFixed(2)})
                  </div>
                </>
              )}
            </>
          ) : (
            <div className="text-xs text-muted-foreground">
              {store.inStock ? 'Check price' : 'Out of stock'}
            </div>
          )}
        </div>
        
        {/* Buy Button */}
        <Button 
          size="sm"
          variant={store.isLocal ? "default" : "outline"}
          onClick={handleClick}
          disabled={!store.inStock}
          className={cn(
            "gap-1 min-w-[60px]",
            store.isLocal && "bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70"
          )}
        >
          Buy
          <ExternalLink className="w-3 h-3" />
        </Button>
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
  const { hasAlert, getAlert } = useDatabasePriceAlerts();
  const [priceAlertModalOpen, setPriceAlertModalOpen] = useState(false);

  // Use unified regional pricing for stores
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
    regionalPrices: {
      price_cad: (filament as any)?.price_cad,
      price_eur: (filament as any)?.price_eur,
      price_gbp: (filament as any)?.price_gbp,
      price_aud: (filament as any)?.price_aud,
      price_jpy: (filament as any)?.price_jpy,
    },
  });

  const { 
    allStores, 
    isLoading: storesLoading,
  } = unifiedPricing;

  // Fetch live price for chart/alert purposes
  const { 
    currentPrice: livePrice, 
    weightGrams: liveWeightGrams,
    isLivePrice,
    currency: livePriceCurrency
  } = useCurrentPrice(productUrl, pricePerSpool, originalUsUrl);

  // Get price history data
  const { 
    min: historicalLow,
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

  // Currency symbol for user's currency
  const userCurrencySymbol = CURRENCY_SYMBOLS[currency] || currency;
  
  // For price history display
  const historyCurrencySymbol = isLivePrice 
    ? (CURRENCY_SYMBOLS[livePriceCurrency] || '$')
    : '$';

  // Combine official stores and retailers into unified list with deduplication
  const unifiedStoreList = useMemo((): UnifiedStoreItem[] => {
    const items: UnifiedStoreItem[] = [];
    
    // Add official stores from unified pricing
    allStores.forEach((store: RegionalStoreData) => {
      const storeUrl = store.productUrlPattern && (productSku || filament.product_handle)
        ? interpolateProductUrl(store.productUrlPattern, productSku || filament.product_handle || '')
        : store.baseUrl;
      
      const isLocal = store.regionCode === region;
      const regionConfig = REGIONS[store.regionCode as keyof typeof REGIONS];
      
      // pricePerKg is already in the user's currency (e.g., EUR for EU users)
      // Compute the native price in the store's own currency by reverse-converting
      const storeCurrencyCode = store.currencyCode as CurrencyCode;
      let nativePriceInStoreCurrency: number | null = null;
      if (pricePerKg) {
        if (storeCurrencyCode === currency) {
          nativePriceInStoreCurrency = pricePerKg;
        } else {
          const rate = getConversionRate(currency as CurrencyCode, storeCurrencyCode);
          nativePriceInStoreCurrency = Math.round(pricePerKg * rate * 100) / 100;
        }
      }
      
      items.push({
        id: store.id,
        name: store.storeName,
        regionCode: store.regionCode,
        regionFlag: regionConfig?.flag || '🌐',
        nativePrice: nativePriceInStoreCurrency,
        nativeCurrency: store.currencyCode,
        convertedPrice: pricePerKg, // already in user's currency
        userCurrency: currency,
        isLocal,
        url: storeUrl,
        type: 'official',
        inStock: true,
      });
    });
    
    // Add retailers
    retailers.forEach((retailer) => {
      // Determine retailer region from name (simple heuristic)
      let retailerRegion = 'US';
      let retailerCurrency = 'USD';
      if (retailer.name.includes('UK') || retailer.name.includes('🇬🇧')) {
        retailerRegion = 'UK';
        retailerCurrency = 'GBP';
      } else if (retailer.name.includes('EU') || retailer.name.includes('DE') || retailer.name.includes('🇪🇺')) {
        retailerRegion = 'EU';
        retailerCurrency = 'EUR';
      } else if (retailer.name.includes('CA') || retailer.name.includes('🇨🇦')) {
        retailerRegion = 'CA';
        retailerCurrency = 'CAD';
      } else if (retailer.name.includes('AU') || retailer.name.includes('🇦🇺')) {
        retailerRegion = 'AU';
        retailerCurrency = 'AUD';
      }
      
      const isLocal = retailerRegion === region;
      const regionConfig = REGIONS[retailerRegion as keyof typeof REGIONS];
      
      // retailer.price is in the retailer's native currency if from listings,
      // pricePerKg fallback is already in user's currency
      const hasRetailerNativePrice = !!retailer.price;
      let nativePrice: number | null;
      let convertedPrice: number | null;
      
      if (hasRetailerNativePrice && retailer.price) {
        // retailer.price is in the retailer's native currency
        nativePrice = retailer.price;
        convertedPrice = isLocal ? retailer.price : convertPrice(retailer.price, retailerCurrency as CurrencyCode);
      } else if (pricePerKg) {
        // pricePerKg is in user's currency — reverse-convert to get native price
        if (retailerCurrency === currency) {
          nativePrice = pricePerKg;
        } else {
          const rate = getConversionRate(currency as CurrencyCode, retailerCurrency as CurrencyCode);
          nativePrice = Math.round(pricePerKg * rate * 100) / 100;
        }
        convertedPrice = pricePerKg; // already in user's currency
      } else {
        nativePrice = null;
        convertedPrice = null;
      }
      
      items.push({
        id: retailer.id,
        name: retailer.name,
        regionCode: retailerRegion,
        regionFlag: regionConfig?.flag || '🌐',
        nativePrice: nativePrice,
        nativeCurrency: retailerCurrency,
        convertedPrice: convertedPrice,
        userCurrency: currency,
        isLocal,
        url: retailer.url || '',
        type: retailer.name.toLowerCase().includes('amazon') ? 'marketplace' : 'retailer',
        inStock: retailer.inStock ?? true,
      });
    });
    
    // Deduplicate stores: group by normalized domain + region
    const deduplicatedItems: UnifiedStoreItem[] = [];
    const seenGroups = new Map<string, UnifiedStoreItem[]>();
    
    items.forEach((item) => {
      // Extract base domain/brand name for grouping
      // Normalize name by removing region suffixes like "(US)", "(EU)", etc.
      const baseName = item.name
        .replace(/\s*\((US|EU|UK|CA|AU|JP|CN|DE|FR|IT|ES)\)\s*/gi, '')
        .replace(/\s*(US|EU|UK|CA|AU|JP|CN)\s*$/gi, '')
        .trim()
        .toLowerCase();
      
      // Create a group key: baseName + region
      const groupKey = `${baseName}::${item.regionCode}`;
      
      if (!seenGroups.has(groupKey)) {
        seenGroups.set(groupKey, []);
      }
      seenGroups.get(groupKey)!.push(item);
    });
    
    // Process each group
    seenGroups.forEach((groupItems) => {
      if (groupItems.length === 1) {
        // Only one item, no deduplication needed
        deduplicatedItems.push(groupItems[0]);
      } else {
        // Multiple items in same store+region group
        // Check if all have the same price
        const prices = groupItems.map(i => i.nativePrice).filter(p => p !== null);
        const uniquePrices = [...new Set(prices)];
        
        if (uniquePrices.length <= 1) {
          // Same price (or no prices) - keep the one with the more specific name
          // Prefer names with region indicators like "(US)" over plain names
          const sorted = [...groupItems].sort((a, b) => {
            const aHasRegion = /\((US|EU|UK|CA|AU|JP|CN|DE|FR|IT|ES)\)/i.test(a.name);
            const bHasRegion = /\((US|EU|UK|CA|AU|JP|CN|DE|FR|IT|ES)\)/i.test(b.name);
            if (aHasRegion && !bHasRegion) return -1;
            if (!aHasRegion && bHasRegion) return 1;
            // If both have or don't have region, prefer longer name (more specific)
            return b.name.length - a.name.length;
          });
          deduplicatedItems.push(sorted[0]);
        } else {
          // Different prices - keep the one with best (lowest) price
          // and add price alternatives info
          const sorted = [...groupItems].sort((a, b) => {
            const priceA = a.nativePrice ?? Infinity;
            const priceB = b.nativePrice ?? Infinity;
            return priceA - priceB;
          });
          
          // Use the best-priced item as the representative
          const bestItem = sorted[0];
          
          // Collect all unique prices for display
          const allPrices = sorted
            .map(i => i.nativePrice)
            .filter((p): p is number => p !== null);
          
          if (allPrices.length > 1) {
            // Multiple prices - we could enhance the name, but for now just keep the best
            // The UI already shows the price, so users will see the best option
          }
          
          deduplicatedItems.push(bestItem);
        }
      }
    });
    
    // Sort: local stores first, then by converted price (lowest first)
    return deduplicatedItems.sort((a, b) => {
      // Local stores first
      if (a.isLocal && !b.isLocal) return -1;
      if (!a.isLocal && b.isLocal) return 1;
      
      // Then by converted price (nulls last)
      const priceA = a.isLocal ? a.nativePrice : a.convertedPrice;
      const priceB = b.isLocal ? b.nativePrice : b.convertedPrice;
      
      if (priceA === null && priceB === null) return 0;
      if (priceA === null) return 1;
      if (priceB === null) return -1;
      
      return priceA - priceB;
    });
  }, [allStores, retailers, region, currency, pricePerKg, productSku, filament.product_handle, convertPrice, getConversionRate]);

  return (
    <div className="space-y-6">
      {/* Where to Buy - Unified Store List */}
      <Card className="bg-card/50 border-border">
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-lg text-primary">
                <ShoppingCart className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-semibold">Where to Buy</h3>
                <p className="text-xs text-muted-foreground">
                  {unifiedStoreList.length} store{unifiedStoreList.length !== 1 ? 's' : ''} available
                </p>
              </div>
            </div>
          </div>

          {storesLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
            </div>
          ) : unifiedStoreList.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Globe className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p className="mb-2">No stores found for this product</p>
              {productUrl && (
                <Button 
                  variant="outline" 
                  onClick={() => window.open(productUrl, '_blank', 'noopener,noreferrer')}
                  className="gap-2"
                >
                  View Product Page
                  <ExternalLink className="w-3.5 h-3.5" />
                </Button>
              )}
            </div>
          ) : (
            <div className="space-y-2">
              {unifiedStoreList.map((store) => (
                <StoreRow 
                  key={store.id} 
                  store={store} 
                  userCurrencySymbol={userCurrencySymbol}
                  lastScrapedAt={filament.last_scraped_at}
                />
              ))}
            </div>
          )}

          {/* Disclaimer */}
          <p className="text-xs text-muted-foreground mt-4 text-center">
            Prices may vary. Click "Buy" to see current pricing at each store.
          </p>
        </CardContent>
      </Card>

      {/* Price Alerts */}
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
                Alert set for {userCurrencySymbol}{existingAlert.target_price.toFixed(2)}/kg
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Price History Chart */}
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
              <span className="font-bold text-emerald-400">{historyCurrencySymbol}{historicalLow.toFixed(2)}/kg</span>
            </div>
          )}
          
          <PriceHistoryChart
            filamentId={filament.id}
            currentPrice={displayPricePerKg}
            currencySymbol={historyCurrencySymbol}
          />
          
          <p className="text-xs text-muted-foreground mt-4 text-center">
            Historical data is based on our periodic price checks. Actual prices may have varied.
          </p>
        </CardContent>
      </Card>

      {/* Price Alert Modal */}
      <DatabasePriceAlertModal
        filamentId={filament.id}
        filamentName={filament.product_title}
        currentPrice={displayPricePerKg}
        isOpen={priceAlertModalOpen}
        onClose={() => setPriceAlertModalOpen(false)}
        currencySymbol={userCurrencySymbol}
      />
    </div>
  );
}
