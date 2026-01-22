import React from 'react';
import { 
  DollarSign, TrendingDown, Globe, Store, ExternalLink, Tag, Clock, 
  Wrench, BookOpen, ChartLine, ShoppingCart, Check, X
} from 'lucide-react';
import { cn } from '@/lib/utils';
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
    displayValue = <span className="text-muted-foreground/50 italic">Not specified</span>;
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

  const hasAnyAmazonLink = printer.amazon_link_us || printer.amazon_link_uk || printer.amazon_link_de;

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
          {/* Main Price Display */}
          <div className="flex-1">
            {displayPrice ? (
              <div className="space-y-3 sm:space-y-4">
                <div className="text-3xl sm:text-4xl lg:text-5xl font-bold text-primary tracking-tight">
                  {formatDisplayPrice(displayPrice)}
                </div>
                {displayMsrp && displayMsrp > displayPrice && (
                  <div className="flex items-center gap-4">
                    <span className="text-xl text-muted-foreground line-through">
                      {formatDisplayPrice(displayMsrp)}
                    </span>
                    {savingsPercent && (
                      <Badge className="bg-green-500/20 text-green-500 border-green-500/30 text-sm px-3 py-1">
                        <TrendingDown className="h-4 w-4 mr-1" />
                        -{savingsPercent}% OFF
                      </Badge>
                    )}
                  </div>
                )}
                {displayMsrp && displayMsrp <= displayPrice && (
                  <div className="data-label">
                    MSRP: {formatDisplayPrice(displayMsrp)}
                  </div>
                )}
              </div>
            ) : (
              <div className="text-2xl text-muted-foreground">Price not available</div>
            )}
          </div>

          {/* Price Sources Grid - Responsive */}
          <div className="grid grid-cols-3 gap-2 sm:gap-4 lg:w-[400px]">
            <div className="p-3 sm:p-6 rounded-xl bg-muted/30 border border-border/40 text-center">
              <Store className="h-4 w-4 sm:h-5 sm:w-5 text-gray-400 mx-auto mb-2 sm:mb-3" />
              <div className="text-xs sm:text-sm text-gray-400 mb-1">Store</div>
              <div className="text-sm sm:text-lg font-bold text-foreground">
                {printer.current_price_usd_store 
                  ? formatPrice(printer.current_price_usd_store)
                  : <span className="text-gray-500 italic text-sm font-normal">Not available</span>
                }
              </div>
            </div>
            <div className="p-3 sm:p-6 rounded-xl bg-muted/30 border border-border/40 text-center">
              <Tag className="h-4 w-4 sm:h-5 sm:w-5 text-gray-400 mx-auto mb-2 sm:mb-3" />
              <div className="text-xs sm:text-sm text-gray-400 mb-1">Amazon</div>
              {printer.current_price_usd_amazon ? (
                <div className="text-sm sm:text-lg font-bold text-foreground">
                  {formatPrice(printer.current_price_usd_amazon)}
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
                <span className="text-gray-500 italic text-sm font-normal">Not available</span>
              )}
            </div>
            <div className="p-3 sm:p-6 rounded-xl bg-muted/30 border border-border/40 text-center">
              <Globe className="h-4 w-4 sm:h-5 sm:w-5 text-gray-400 mx-auto mb-2 sm:mb-3" />
              <div className="text-xs sm:text-sm text-gray-400 mb-1">MSRP</div>
              <div className="text-sm sm:text-lg font-bold text-foreground">
                {printer.msrp_usd 
                  ? formatPrice(printer.msrp_usd)
                  : <span className="text-gray-500 italic text-sm font-normal">Not set</span>
                }
              </div>
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
              <span className="text-sm text-gray-400">No official store link</span>
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
              <span className="text-sm text-gray-400">Not available on Amazon</span>
            </div>
          )}

          {/* Other Retailers Placeholder */}
          <div className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-border/50 rounded-xl">
            <span className="text-sm text-gray-400">More retailers coming soon</span>
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

      <section className="section-card">
        <SectionHeader icon={Globe} title="Price by Region (MSRP)" />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-4">
          <div className="p-3 sm:p-6 rounded-xl bg-muted/30 border border-border/40">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs sm:text-sm text-gray-400">🇺🇸 USD</span>
            </div>
            <div className={cn(
              "text-sm sm:text-lg font-bold",
              !printer.msrp_usd ? "text-gray-500 italic font-normal" : "text-foreground"
            )}>
              {printer.msrp_usd ? `$${printer.msrp_usd}` : 'Not set'}
            </div>
          </div>
          <div className="p-3 sm:p-6 rounded-xl bg-muted/30 border border-border/40">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs sm:text-sm text-gray-400">🇨🇦 CAD</span>
            </div>
            <div className={cn(
              "text-sm sm:text-lg font-bold",
              !printer.msrp_cad ? "text-gray-500 italic font-normal" : "text-foreground"
            )}>
              {printer.msrp_cad ? `C$${printer.msrp_cad}` : 'Not set'}
            </div>
          </div>
          <div className="p-3 sm:p-6 rounded-xl bg-muted/30 border border-border/40">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs sm:text-sm text-gray-400">🇪🇺 EUR</span>
            </div>
            <div className={cn(
              "text-sm sm:text-lg font-bold",
              !printer.msrp_eur ? "text-gray-500 italic font-normal" : "text-foreground"
            )}>
              {printer.msrp_eur ? `€${printer.msrp_eur}` : 'Not set'}
            </div>
          </div>
          <div className="p-3 sm:p-6 rounded-xl bg-muted/30 border border-border/40">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs sm:text-sm text-gray-400">🇬🇧 GBP</span>
            </div>
            <div className={cn(
              "text-sm sm:text-lg font-bold",
              !printer.msrp_gbp ? "text-gray-500 italic font-normal" : "text-foreground"
            )}>
              {printer.msrp_gbp ? `£${printer.msrp_gbp}` : 'Not set'}
            </div>
          </div>
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
            <div className="text-xs sm:text-sm text-gray-400 mb-1">Status</div>
            {printer.discontinued ? (
              <Badge variant="destructive" className="text-xs sm:text-sm">Discontinued</Badge>
            ) : (
              <Badge className="bg-green-500/20 text-green-500 border-green-500/30 text-xs sm:text-sm">
                Available
              </Badge>
            )}
          </div>
          <div className="p-3 sm:p-6 rounded-xl bg-muted/30 border border-border/40">
            <div className="text-xs sm:text-sm text-gray-400 mb-1">Release Date</div>
            <div className={cn(
              "text-sm sm:text-base font-medium",
              !printer.release_date ? "text-gray-500 italic" : "text-white"
            )}>
              {printer.release_date || 'Not specified'}
            </div>
          </div>
          <div className="p-3 sm:p-6 rounded-xl bg-muted/30 border border-border/40">
            <div className="text-xs sm:text-sm text-gray-400 mb-1">Price Tier</div>
            {printer.price_tier ? (
              <Badge variant="secondary" className="capitalize text-xs sm:text-sm">{printer.price_tier}</Badge>
            ) : (
              <span className="text-sm sm:text-base text-gray-500 italic">Not set</span>
            )}
          </div>
          <div className="p-3 sm:p-6 rounded-xl bg-muted/30 border border-border/40">
            <div className="text-xs sm:text-sm text-gray-400 mb-1">Target User</div>
            {printer.target_user_segment ? (
              <Badge variant="secondary" className="text-xs sm:text-sm">{printer.target_user_segment}</Badge>
            ) : (
              <span className="text-sm sm:text-base text-gray-500 italic">Not set</span>
            )}
          </div>
        </div>
      </section>

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
    </div>
  );
}
