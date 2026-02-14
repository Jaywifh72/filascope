import React from 'react';
import { 
  DollarSign, TrendingDown, Globe, Store, ExternalLink, Tag, Clock, 
  Wrench, BookOpen, ChartLine, ShoppingCart, Check, X, MapPin, Info, Loader2
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { PrinterPriceChart } from '@/components/PrinterPriceChart';
import { useRegion } from '@/contexts/RegionContext';
import { useAffiliateLinks } from '@/hooks/useAffiliateLinks';
import { useAffiliateLink } from '@/hooks/useAffiliateLink';
import { useRegionalPriceV2 } from '@/hooks/useRegionalPriceV2';
import { REGIONS } from '@/config/regions';
import { formatPrice as formatCurrencyPrice } from '@/config/currencies';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import type { CurrencyCode } from '@/types/regional';
import { interpolateProductUrl } from '@/utils/regionalStoreUtils';
import { AffiliateDisclosure } from '@/components/affiliate/AffiliateDisclosure';

interface PricingTabContentProps {
  printer: any;
  brand: string | null;
  displayPrice: number | null | undefined;
  displayMsrp: number | null | undefined;
  isLivePrice: boolean;
  livePriceCurrency?: string;
  brandId?: string | null;
  productSlug?: string | null;
  /** Regional display price (already converted to user's currency if needed) */
  regionalDisplayPrice?: number | null;
  /** Whether the regional price is a conversion estimate */
  isRegionalConverted?: boolean;
}

// Section header with icon and border
function SectionHeader({ icon: Icon, title }: { icon: React.ElementType; title: string }) {
  return (
    <div className="section-header">
      <div className="section-header-icon">
        <Icon className="w-5 h-5 text-primary" />
      </div>
      <h3 className="section-title">{title}</h3>
    </div>
  );
}

// Info row for assembly section with improved boolean icons
function InfoRow({ 
  label, 
  value, 
  unit = '' 
}: { 
  label: string; 
  value: any; 
  unit?: string;
}) {
  const isEmpty = value === null || value === undefined || value === '';
  const isBoolean = typeof value === 'boolean';

  let displayValue: React.ReactNode;
  if (isEmpty) {
    displayValue = <span className="text-muted-foreground/50 italic">—</span>;
  } else if (isBoolean) {
    displayValue = value ? (
      <span className="inline-flex items-center gap-1.5 text-green-400">
        <Check className="w-4 h-4" />
        Yes
      </span>
    ) : (
      <span className="inline-flex items-center gap-1.5 text-gray-500">
        <X className="w-4 h-4" />
        No
      </span>
    );
  } else {
    displayValue = <span className="text-foreground">{String(value)}{unit}</span>;
  }

  return (
    <div className={cn("spec-row", isEmpty && "opacity-60")}>
      <span className="data-label">{label}</span>
      <span className="data-value">{displayValue}</span>
    </div>
  );
}

export function PricingTabContent({ 
  printer, 
  brand, 
  displayPrice, 
  displayMsrp,
  isLivePrice,
  livePriceCurrency,
  brandId,
  productSlug,
  regionalDisplayPrice,
  isRegionalConverted,
}: PricingTabContentProps) {
  const { formatPrice, currency, region, getConversionRate } = useRegion();
  const { getAffiliateUrl, getAmazonUrl } = useAffiliateLinks();
  const { trackAndOpen, hasAffiliate } = useAffiliateLink(brand);

  // Fetch regional stores for this brand
  const { 
    allStores, 
    hasRegionalStore,
    isLoading: storesLoading 
  } = useRegionalPriceV2({
    brandId: brandId || '',
    basePrice: displayPrice || undefined,
    baseCurrency: 'USD',
  });

  // Sort stores: user's region first
  const sortedStores = [...allStores].sort((a, b) => {
    if (a.region_code === region) return -1;
    if (b.region_code === region) return 1;
    return 0;
  });

  // Calculate savings if there's a discount
  const savings = displayMsrp && displayPrice ? displayMsrp - displayPrice : null;
  const savingsPercent = displayMsrp && displayPrice && savings && savings > 0 
    ? Math.round((savings / displayMsrp) * 100) 
    : null;

  // displayPrice and displayMsrp are always USD values from the DB
  const isUserCurrencyUsd = currency === 'USD';
  const usdToUserRate = isUserCurrencyUsd ? 1 : getConversionRate('USD', currency);
  // Guard: if rates haven't loaded yet, usdToUserRate will be 1 (fallback)
  // In that case, don't show "converted" prices — they'd be misleading
  const ratesReady = isUserCurrencyUsd || usdToUserRate !== 1;

  // Format a USD price into the user's currency with proper conversion label
  const formatUsdAsUserCurrency = (usdPrice: number): string => {
    if (isUserCurrencyUsd) {
      return formatCurrencyPrice(usdPrice, 'USD');
    }
    if (!ratesReady) return '...';
    const converted = usdPrice * usdToUserRate;
    return `~${formatCurrencyPrice(converted, currency)}`;
  };

  const hasAnyAmazonLink = printer.amazon_link_us || printer.amazon_link_uk || printer.amazon_link_de;

  // Detect potentially unconverted store prices (store price equals MSRP exactly)
  const storePrice = printer.current_price_usd_store;
  const msrpUsd = printer.msrp_usd;
  const storePriceSuspect = storePrice && msrpUsd && storePrice === msrpUsd;

  return (
    <div className="tab-content">
      {/* Current Prices Comparison Card */}
      <section className="section-card">
        <div className="flex items-center justify-between mb-6">
          <SectionHeader icon={DollarSign} title="Current Price" />
          {isLivePrice && (
            <Badge variant="outline" className="text-xs">
              <span className="w-1.5 h-1.5 bg-green-500 rounded-full mr-1.5 animate-pulse" />
              Live Price
            </Badge>
          )}
        </div>

        <div className="flex flex-col gap-6 lg:flex-row lg:gap-8">
          {/* Main Price Display - use regional price if available for consistency with sidebar */}
          <div className="flex-1">
            {(regionalDisplayPrice ?? displayPrice) ? (
              <div className="space-y-3 sm:space-y-4">
                <div className="text-3xl sm:text-4xl lg:text-5xl font-bold text-primary tracking-tight">
                  {/* regionalDisplayPrice is already in user's currency from unified pricing */}
                  {regionalDisplayPrice != null ? (
                    <>{isRegionalConverted ? '~' : ''}{formatCurrencyPrice(regionalDisplayPrice, currency)}</>
                  ) : (
                    /* displayPrice is raw USD — show as USD */
                    <>{formatCurrencyPrice(displayPrice!, 'USD')}</>
                  )}
                </div>
                {/* Show USD MSRP line when price >= MSRP (no discount) */}
                {displayMsrp && (regionalDisplayPrice ?? displayPrice ?? 0) >= (isRegionalConverted && ratesReady ? displayMsrp * usdToUserRate : displayMsrp) && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <span>MSRP: {formatCurrencyPrice(displayMsrp, 'USD')}</span>
                    {!isUserCurrencyUsd && ratesReady && (
                      <span className="text-xs">({formatUsdAsUserCurrency(displayMsrp)})</span>
                    )}
                  </div>
                )}
                {/* Show discount when price < MSRP */}
                {displayMsrp && displayPrice && displayPrice < displayMsrp && (
                  <div className="flex items-center gap-4">
                    <span className="text-xl text-muted-foreground line-through">
                      {formatCurrencyPrice(displayMsrp, 'USD')}
                    </span>
                    {savingsPercent && (
                      <Badge className="bg-green-500/20 text-green-500 border-green-500/30 text-sm px-3 py-1">
                        <TrendingDown className="h-4 w-4 mr-1" />
                        -{savingsPercent}% OFF
                      </Badge>
                    )}
                  </div>
                )}
              </div>
            ) : (
              <div className="text-2xl text-muted-foreground">Price not available</div>
            )}
          </div>

          {/* Price Sources Grid - Responsive: always show USD source prices with conversion */}
          <div className="grid grid-cols-3 gap-2 sm:gap-4 lg:w-[400px]">
            {/* Store Price Card */}
            <div className="p-3 sm:p-6 rounded-xl bg-muted/30 border border-border/40 text-center">
              <Store className="h-4 w-4 sm:h-5 sm:w-5 text-muted-foreground mx-auto mb-2 sm:mb-3" />
              <div className="text-xs sm:text-sm text-muted-foreground mb-1">Store</div>
              {storePrice ? (
                <div>
                  <div className="text-sm sm:text-lg font-bold text-foreground">
                    {formatCurrencyPrice(storePrice, 'USD')}
                  </div>
                  {!isUserCurrencyUsd && (
                    <div className="text-[10px] sm:text-xs text-muted-foreground mt-0.5">
                      {formatUsdAsUserCurrency(storePrice)}
                    </div>
                  )}
                  {storePriceSuspect && (
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div className="text-[10px] text-amber-400 mt-1 cursor-help">⚠ May be MSRP</div>
                      </TooltipTrigger>
                      <TooltipContent side="bottom" className="text-xs max-w-xs">
                        Store price matches MSRP exactly — this may be the list price rather than a live store price.
                      </TooltipContent>
                    </Tooltip>
                  )}
                </div>
              ) : (
                <span className="text-muted-foreground/50 italic text-sm font-normal">Not available</span>
              )}
            </div>
            {/* Amazon Price Card */}
            <div className="p-3 sm:p-6 rounded-xl bg-muted/30 border border-border/40 text-center">
              <Tag className="h-4 w-4 sm:h-5 sm:w-5 text-muted-foreground mx-auto mb-2 sm:mb-3" />
              <div className="text-xs sm:text-sm text-muted-foreground mb-1">Amazon</div>
              {printer.current_price_usd_amazon ? (
                <div>
                  <div className="text-sm sm:text-lg font-bold text-foreground">
                    {formatCurrencyPrice(printer.current_price_usd_amazon, 'USD')}
                  </div>
                  {!isUserCurrencyUsd && (
                    <div className="text-[10px] sm:text-xs text-muted-foreground mt-0.5">
                      {formatUsdAsUserCurrency(printer.current_price_usd_amazon)}
                    </div>
                  )}
                </div>
              ) : hasAnyAmazonLink ? (
                <a 
                  href={getAmazonUrl(printer.amazon_link_us || printer.amazon_link_uk || printer.amazon_link_de) || printer.amazon_link_us}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs sm:text-sm text-primary hover:underline inline-flex items-center gap-1"
                >
                  Check Amazon <ExternalLink className="w-3 h-3" />
                </a>
              ) : (
                <span className="text-muted-foreground/50 italic text-sm font-normal">Not available</span>
              )}
            </div>
            {/* MSRP Card - always shown in USD */}
            <div className="p-3 sm:p-6 rounded-xl bg-muted/30 border border-border/40 text-center">
              <Globe className="h-4 w-4 sm:h-5 sm:w-5 text-muted-foreground mx-auto mb-2 sm:mb-3" />
              <div className="text-xs sm:text-sm text-muted-foreground mb-1">MSRP</div>
              {msrpUsd ? (
                <div>
                  <div className="text-sm sm:text-lg font-bold text-foreground">
                    {formatCurrencyPrice(msrpUsd, 'USD')}
                  </div>
                  {!isUserCurrencyUsd && (
                    <div className="text-[10px] sm:text-xs text-muted-foreground mt-0.5">
                      {formatUsdAsUserCurrency(msrpUsd)}
                    </div>
                  )}
                </div>
              ) : (
                <span className="text-muted-foreground/50 italic text-sm font-normal">Not set</span>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Where to Buy - Prominent CTAs */}
      <section className="section-card">
        <SectionHeader icon={ShoppingCart} title="Where to Buy" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
          {/* Official Store - Primary CTA */}
          {printer.official_store_url ? (
            <a 
              href={getAffiliateUrl(printer.official_store_url, brand) || printer.official_store_url}
              target="_blank" 
              rel="noopener noreferrer"
              className="block"
            >
              <Button size="lg" className="w-full h-auto py-5 gap-4 text-base">
                <Store className="h-5 w-5" />
                <div className="flex flex-col items-start">
                  <span className="font-semibold">Official {brand || 'Store'}</span>
                  <span className="text-xs opacity-80">Best warranty & support</span>
                </div>
                <ExternalLink className="h-4 w-4 ml-auto" />
              </Button>
            </a>
          ) : (
            <div className="flex items-center justify-center p-6 border-2 border-dashed border-border/50 rounded-xl">
              <span className="text-sm text-muted-foreground">No official store link</span>
            </div>
          )}

          {/* Amazon - Secondary CTA */}
          {hasAnyAmazonLink ? (
            <a 
              href={getAmazonUrl(printer.amazon_link_us || printer.amazon_link_uk || printer.amazon_link_de) || printer.amazon_link_us}
              target="_blank" 
              rel="noopener noreferrer"
              className="block"
            >
              <Button size="lg" variant="amazon" className="w-full h-auto py-5 gap-4 text-base">
                <Tag className="h-5 w-5" />
                <div className="flex flex-col items-start">
                  <span className="font-semibold">Amazon</span>
                  <span className="text-xs opacity-80">Fast shipping</span>
                </div>
                <ExternalLink className="h-4 w-4 ml-auto" />
              </Button>
            </a>
          ) : (
            <div className="flex items-center justify-center p-6 border-2 border-dashed border-border/50 rounded-xl">
              <span className="text-sm text-muted-foreground">Not available on Amazon</span>
            </div>
          )}

          {/* Other Retailers Placeholder */}
          <div className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-border/50 rounded-xl">
            <span className="text-sm text-muted-foreground">More retailers coming soon</span>
          </div>
        </div>

        {/* Additional Amazon Links */}
        {(printer.amazon_link_uk || printer.amazon_link_de) && (
          <div className="mt-6 pt-6 border-t border-border/30 flex flex-wrap gap-3">
            {printer.amazon_link_uk && (
              <a 
                href={getAmazonUrl(printer.amazon_link_uk) || printer.amazon_link_uk}
                target="_blank" 
                rel="noopener noreferrer"
              >
                <Button variant="outline" size="sm" className="gap-2">
                  Amazon UK <ExternalLink className="h-3 w-3" />
                </Button>
              </a>
            )}
            {printer.amazon_link_de && (
              <a 
                href={getAmazonUrl(printer.amazon_link_de) || printer.amazon_link_de}
                target="_blank" 
                rel="noopener noreferrer"
              >
                <Button variant="outline" size="sm" className="gap-2">
                  Amazon DE <ExternalLink className="h-3 w-3" />
                </Button>
              </a>
            )}
          </div>
        )}
      </section>

      {/* Price by Region - uses actual MSRP columns with proper formatting */}
      <section className="section-card">
        <SectionHeader icon={Globe} title="Price by Region (MSRP)" />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-4">
          {([
            { regionCode: 'US', label: '🇺🇸 USD', msrp: printer.msrp_usd, currency: 'USD' as CurrencyCode },
            { regionCode: 'CA', label: '🇨🇦 CAD', msrp: printer.msrp_cad, currency: 'CAD' as CurrencyCode },
            { regionCode: 'EU', label: '🇪🇺 EUR', msrp: printer.msrp_eur, currency: 'EUR' as CurrencyCode },
            { regionCode: 'UK', label: '🇬🇧 GBP', msrp: printer.msrp_gbp, currency: 'GBP' as CurrencyCode },
          ]).map(({ regionCode, label, msrp, currency: regionCurrency }) => {
            // If MSRP exists for this region, show it in native currency
            // If not, convert from USD as an estimate
            const hasNativeMsrp = msrp !== null && msrp !== undefined;
            const estimatedFromUsd = !hasNativeMsrp && msrpUsd && regionCurrency !== 'USD'
              ? msrpUsd * getConversionRate('USD', regionCurrency)
              : null;
            
            // Check: if regional MSRP equals USD MSRP exactly, it's likely unconverted data
            const suspectSameAsUsd = hasNativeMsrp && msrpUsd && regionCurrency !== 'USD' && msrp === msrpUsd;
            
            const priceValue = hasNativeMsrp ? msrp : estimatedFromUsd;
            const isEstimate = !hasNativeMsrp && estimatedFromUsd !== null;

            return (
              <div key={regionCode} className={cn(
                "p-3 sm:p-6 rounded-xl border",
                region === regionCode 
                  ? "bg-primary/10 border-primary/30" 
                  : "bg-muted/30 border-border/40"
              )}>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs sm:text-sm text-muted-foreground">{label}</span>
                  {region === regionCode && (
                    <Badge className="bg-primary/20 text-primary border-primary/30 text-[10px] px-1.5 py-0">
                      Your Region
                    </Badge>
                  )}
                </div>
                {priceValue ? (
                  <div>
                    <div className={cn(
                      "text-sm sm:text-lg font-bold",
                      isEstimate || suspectSameAsUsd ? "text-muted-foreground" : "text-foreground"
                    )}>
                      {isEstimate ? '~' : ''}{formatCurrencyPrice(priceValue, regionCurrency)}
                    </div>
                    {isEstimate && (
                      <span className="text-[10px] text-muted-foreground/70">
                        Converted from {formatCurrencyPrice(msrpUsd!, 'USD')}
                      </span>
                    )}
                    {suspectSameAsUsd && (
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <span className="text-[10px] text-amber-400 cursor-help">⚠ Awaiting Verification</span>
                        </TooltipTrigger>
                        <TooltipContent side="bottom" className="text-xs max-w-xs">
                          This regional MSRP matches the USD price exactly ({formatCurrencyPrice(msrpUsd!, 'USD')}), which may indicate unconverted data.
                        </TooltipContent>
                      </Tooltip>
                    )}
                  </div>
                ) : (
                  <div className="text-sm sm:text-lg text-muted-foreground/50 italic font-normal">
                    Not set
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* Price History */}
      <section className="section-card">
        <SectionHeader icon={ChartLine} title="Price History" />
        <PrinterPriceChart
          printerId={printer.id}
          currentStorePrice={printer.current_price_usd_store}
          currentAmazonPrice={printer.current_price_usd_amazon}
          msrp={printer.msrp_usd}
        />
      </section>

      <section className="section-card">
        <SectionHeader icon={Clock} title="Availability & Status" />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-4">
          <div className="p-3 sm:p-6 rounded-xl bg-muted/30 border border-border/40">
            <div className="text-xs sm:text-sm text-muted-foreground mb-1">Status</div>
            {printer.discontinued ? (
              <Badge variant="destructive" className="text-xs sm:text-sm">Discontinued</Badge>
            ) : (
              <Badge className="bg-green-500/20 text-green-500 border-green-500/30 text-xs sm:text-sm">
                Available
              </Badge>
            )}
          </div>
          <div className="p-3 sm:p-6 rounded-xl bg-muted/30 border border-border/40">
            <div className="text-xs sm:text-sm text-muted-foreground mb-1">Release Date</div>
            <div className={cn(
              "text-sm sm:text-base font-medium",
              !printer.release_date ? "text-muted-foreground italic" : "text-foreground"
            )}>
              {printer.release_date || '—'}
            </div>
          </div>
          <div className="p-3 sm:p-6 rounded-xl bg-muted/30 border border-border/40">
            <div className="text-xs sm:text-sm text-muted-foreground mb-1">Price Tier</div>
            {printer.price_tier ? (
              <Badge variant="secondary" className="capitalize text-xs sm:text-sm">{printer.price_tier}</Badge>
            ) : (
              <span className="text-sm sm:text-base text-muted-foreground italic">Not set</span>
            )}
          </div>
          <div className="p-3 sm:p-6 rounded-xl bg-muted/30 border border-border/40">
            <div className="text-xs sm:text-sm text-muted-foreground mb-1">Target User</div>
            {printer.target_user_segment ? (
              <Badge variant="secondary" className="text-xs sm:text-sm">{printer.target_user_segment}</Badge>
            ) : (
              <span className="text-sm sm:text-base text-muted-foreground italic">Not set</span>
            )}
          </div>
        </div>
      </section>

      {/* Regional Stores Section */}
      {brandId && sortedStores.length > 0 && (
        <section className="section-card">
          <div className="flex items-center justify-between mb-6">
            <SectionHeader icon={Globe} title="Regional Stores" />
            {hasRegionalStore && (
              <Badge className="bg-primary/20 text-primary border-primary/30 gap-1">
                {REGIONS[region]?.flag} Ships Locally
              </Badge>
            )}
          </div>

          {storesLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <div className="space-y-3">
              {sortedStores.map((store) => {
                const isUserRegion = store.region_code === region;
                const storeRegion = REGIONS[store.region_code as keyof typeof REGIONS];
                const storeCurrency = store.currency_code as CurrencyCode;
                const needsConversion = storeCurrency !== currency;
                
                // Get the base price in the store's native currency
                // Convert from USD to store's native currency
                const baseUsdPrice = displayPrice || 0;
                const usdToStoreRate = storeCurrency === 'USD' ? 1 : getConversionRate('USD', storeCurrency);
                // Guard against 1:1 fallback rate when rates aren't loaded
                const storeRatesReady = storeCurrency === 'USD' || usdToStoreRate !== 1;
                const nativePriceInStoreCurrency = storeRatesReady 
                  ? baseUsdPrice * usdToStoreRate 
                  : null;
                
                // Flag if native price suspiciously equals the USD price (likely unconverted)
                const isSuspectPrice = storeCurrency !== 'USD' && nativePriceInStoreCurrency === baseUsdPrice;
                
                // Now convert store's native price to user's currency if needed
                const storeToUserRate = needsConversion 
                  ? getConversionRate(storeCurrency, currency) 
                  : 1;
                const convertedDisplayPrice = nativePriceInStoreCurrency != null 
                  ? nativePriceInStoreCurrency * storeToUserRate 
                  : null;

                // All store prices are estimates from USD conversion
                const isEstimate = storeCurrency !== 'USD';

                // Generate product-specific URL using interpolation
                const storeUrl = store.product_url_pattern && productSlug
                  ? interpolateProductUrl(store.product_url_pattern, productSlug)
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
                    onClick={() => {
                      if (hasAffiliate) {
                        trackAndOpen(storeUrl, { productName: printer.model_name || printer.display_name, sourceComponent: 'printer_regional_store' });
                      } else {
                        window.open(storeUrl, '_blank');
                      }
                    }}
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
                        {nativePriceInStoreCurrency != null ? (
                          <>
                            {/* Show native store currency price */}
                            <div className="text-sm font-bold text-foreground">
                              {isEstimate ? '~' : ''}{formatCurrencyPrice(nativePriceInStoreCurrency, storeCurrency)}
                            </div>
                            {/* If user's currency differs from store currency, show converted */}
                            {needsConversion && convertedDisplayPrice != null && (
                              <div className="text-xs text-muted-foreground">
                                ~{formatCurrencyPrice(convertedDisplayPrice, currency)}
                              </div>
                            )}
                            {/* Source label for converted prices */}
                            {isEstimate && (
                              <div className="text-[10px] text-muted-foreground/60">
                                est. from {formatCurrencyPrice(baseUsdPrice, 'USD')}
                              </div>
                            )}
                          </>
                        ) : (
                          <div className="text-sm text-muted-foreground italic">Loading...</div>
                        )}
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          if (hasAffiliate) {
                            trackAndOpen(storeUrl, { productName: printer.model_name || printer.display_name, sourceComponent: 'printer_regional_store_visit' });
                          } else {
                            window.open(storeUrl, '_blank');
                          }
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
        </section>
      )}

      {/* Assembly Info */}
      <section className="section-card">
        <SectionHeader icon={Wrench} title="Assembly Information" />
        <div className="space-y-0">
          <InfoRow label="Assembly Required" value={printer.assembly_required} />
          <InfoRow label="Average Assembly Time" value={printer.average_assembly_time_min} unit=" minutes" />
        </div>
        
        {printer.assembly_guide_url && (
          <div className="mt-6 pt-6 border-t border-border/30">
            <a 
              href={printer.assembly_guide_url}
              target="_blank"
              rel="noopener noreferrer"
            >
              <Button variant="outline" className="gap-3">
                <BookOpen className="h-4 w-4" />
                View Assembly Guide
                <ExternalLink className="h-3 w-3" />
              </Button>
            </a>
          </div>
        )}
      </section>

      {/* Affiliate Disclosure */}
      {hasAffiliate && <AffiliateDisclosure className="mt-4" />}
    </div>
  );
}
