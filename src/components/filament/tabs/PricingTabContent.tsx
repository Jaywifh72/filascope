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
import { cn } from '@/lib/utils';
import type { Retailer } from '../hero/RetailersModal';
import { PriceHistoryChart } from '../PriceHistoryChart';
import { DatabasePriceAlertModal } from '../DatabasePriceAlertModal';
import { REGIONS } from '@/config/regions';
import type { CurrencyCode } from '@/types/regional';
import type { PriceCandidate } from '@/hooks/useFilamentDetailPricing';
import { useExchangeRates } from '@/hooks/useExchangeRates';
import { formatPrice as formatCurrencyPrice } from '@/config/currencies';

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
  /** Real per-store price candidates from useFilamentDetailPricing */
  priceCandidates?: PriceCandidate[];
  /** Whether candidates are still loading */
  candidatesLoading?: boolean;
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
  const freshnessInfo = checkedAt ? (() => {
    const date = new Date(checkedAt);
    if (isNaN(date.getTime())) return null;
    const days = differenceInDays(new Date(), date);
    const text = days < 1 ? 'Today' : days === 1 ? '1 day ago' : `${days} days ago`;
    // Color coding: green <3d, amber 3-14d, orange 14-30d, red >30d
    const colorClass = days < 3 ? 'text-emerald-400' 
      : days < 14 ? 'text-amber-400' 
      : days < 30 ? 'text-orange-400' 
      : 'text-red-400';
    const dotClass = days < 3 ? 'bg-emerald-500'
      : days < 14 ? 'bg-amber-400'
      : days < 30 ? 'bg-orange-500'
      : 'bg-red-500';
    const fullDate = date.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
    return { text, colorClass, dotClass, fullDate };
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
          {/* Last checked timestamp — color-coded by freshness */}
          {freshnessInfo && (
            <div className={cn("flex items-center gap-1.5 mt-0.5 text-xs", freshnessInfo.colorClass)}>
              <span className={cn("w-1.5 h-1.5 rounded-full flex-shrink-0", freshnessInfo.dotClass)} />
              <span>Last checked: {freshnessInfo.text}</span>
              <span className="text-muted-foreground/50 text-[10px]">({freshnessInfo.fullDate})</span>
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
  priceCandidates,
  candidatesLoading,
}: PricingTabContentProps) {
  const { formatPrice, currency, region, convertPrice, getConversionRate } = useRegion();
  const { hasAlert, getAlert } = useDatabasePriceAlerts();
  const [priceAlertModalOpen, setPriceAlertModalOpen] = useState(false);

  // Exchange rates for freshness indicator
  const { data: exchangeRates } = useExchangeRates();

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

  // Build unified store list from priceCandidates (real per-store prices)
  // instead of allStores metadata (which had no per-store prices)
  const unifiedStoreList = useMemo((): UnifiedStoreItem[] => {
    // If we have real price candidates from useFilamentDetailPricing, use them
    if (priceCandidates && priceCandidates.length > 0) {
      const items: UnifiedStoreItem[] = priceCandidates.map((candidate, idx) => {
        const regionConfig = REGIONS[candidate.storeRegion as keyof typeof REGIONS];
        const isLocal = candidate.isLocal;
        
        // Determine store's native currency from the region
        const storeCurrencyCode = regionConfig?.defaultCurrency || currency;
        
        // For local stores: price is already in user's currency, show directly
        // For international stores: reverse-convert from user's currency to store's native currency
        let nativePrice: number | null = null;
        let nativeCurrency: string = storeCurrencyCode as string;
        
        if (isLocal || !candidate.isConverted) {
          // Local store or not converted — pricePerKg IS in user's/native currency
          nativePrice = candidate.pricePerKg;
          nativeCurrency = currency;
        } else if (candidate.originalCurrency) {
          // International store with known original currency
          // Reverse-convert from user's currency back to store's native currency
          nativeCurrency = candidate.originalCurrency;
          const rate = getConversionRate(currency as CurrencyCode, candidate.originalCurrency as CurrencyCode);
          nativePrice = Math.round(candidate.pricePerKg * rate * 100) / 100;
        } else {
          // Fallback: use the region's default currency for reverse conversion
          nativeCurrency = storeCurrencyCode;
          if (storeCurrencyCode !== currency) {
            const rate = getConversionRate(currency as CurrencyCode, storeCurrencyCode as CurrencyCode);
            nativePrice = Math.round(candidate.pricePerKg * rate * 100) / 100;
          } else {
            nativePrice = candidate.pricePerKg;
          }
        }
        
        return {
          id: `candidate-${idx}-${candidate.name}`,
          name: candidate.name,
          regionCode: candidate.storeRegion || region,
          regionFlag: regionConfig?.flag || '🌐',
          nativePrice,
          nativeCurrency,
          convertedPrice: candidate.pricePerKg, // already in user's currency
          userCurrency: currency,
          isLocal,
          url: candidate.affiliateUrl || candidate.productUrl,
          type: candidate.isBrandDirect ? 'official' 
            : candidate.name.toLowerCase().includes('amazon') ? 'marketplace' 
            : 'retailer',
          inStock: true,
        };
      });
      
      // Deduplicate: group by normalized name + region, pick best price
      const deduplicatedItems: UnifiedStoreItem[] = [];
      const seenGroups = new Map<string, UnifiedStoreItem[]>();
      
      items.forEach((item) => {
        const baseName = item.name
          .replace(/\s*\((US|EU|UK|CA|AU|JP|CN|DE|FR|IT|ES)\)\s*/gi, '')
          .replace(/\s*(US|EU|UK|CA|AU|JP|CN)\s*$/gi, '')
          .trim()
          .toLowerCase();
        const groupKey = `${baseName}::${item.regionCode}`;
        if (!seenGroups.has(groupKey)) {
          seenGroups.set(groupKey, []);
        }
        seenGroups.get(groupKey)!.push(item);
      });
      
      seenGroups.forEach((groupItems) => {
        if (groupItems.length === 1) {
          deduplicatedItems.push(groupItems[0]);
        } else {
          // Keep the one with best (lowest) converted price
          const sorted = [...groupItems].sort((a, b) => {
            const priceA = a.convertedPrice ?? Infinity;
            const priceB = b.convertedPrice ?? Infinity;
            return priceA - priceB;
          });
          deduplicatedItems.push(sorted[0]);
        }
      });
      
      // Sort: local stores first, then by converted price
      return deduplicatedItems.sort((a, b) => {
        if (a.isLocal && !b.isLocal) return -1;
        if (!a.isLocal && b.isLocal) return 1;
        const priceA = a.convertedPrice ?? Infinity;
        const priceB = b.convertedPrice ?? Infinity;
        return priceA - priceB;
      });
    }
    
    // Fallback: no candidates available — return empty
    return [];
  }, [priceCandidates, region, currency, getConversionRate]);

  // Check if any store has converted prices (for exchange rate indicator)
  const hasConvertedPrices = useMemo(() => 
    priceCandidates?.some(c => c.isConverted) ?? false,
  [priceCandidates]);
  
  // Get exchange rate last updated timestamp
  const exchangeRateLastUpdated = useMemo(() => {
    if (!exchangeRates || exchangeRates.length === 0) return null;
    return exchangeRates[0]?.updated_at || null;
  }, [exchangeRates]);

  const storesLoading = candidatesLoading ?? false;

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

          {/* Exchange rate freshness indicator */}
          {hasConvertedPrices && exchangeRateLastUpdated && (
            <div className="flex items-center justify-center gap-1.5 text-xs text-muted-foreground mt-3">
              <Clock className="w-3 h-3" />
              <span>
                Exchange rates updated{' '}
                {formatDistanceToNow(new Date(exchangeRateLastUpdated), { addSuffix: true })}
              </span>
            </div>
          )}

          {/* Disclaimer */}
          <p className="text-xs text-muted-foreground mt-2 text-center">
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
