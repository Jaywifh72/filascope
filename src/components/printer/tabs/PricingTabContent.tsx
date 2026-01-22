import React from 'react';
import { 
  DollarSign, TrendingDown, Globe, Store, ExternalLink, Tag, Clock, 
  Wrench, BookOpen, ChartLine, ShoppingCart, Check, X
} from 'lucide-react';
import { cn } from '@/lib/utils';
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

// Section header component
function SectionHeader({ icon: Icon, title }: { icon: React.ElementType; title: string }) {
  return (
    <div className="flex items-center gap-3 mb-4">
      <div className="p-2 bg-primary/10 rounded-lg">
        <Icon className="w-5 h-5 text-primary" />
      </div>
      <h3 className="text-base font-semibold text-foreground">{title}</h3>
    </div>
  );
}

// Info row for assembly section
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
    displayValue = <span className="text-muted-foreground/50">—</span>;
  } else if (isBoolean) {
    displayValue = value ? (
      <span className="inline-flex items-center gap-1.5 text-primary">
        <Check className="w-4 h-4" />
        Yes
      </span>
    ) : (
      <span className="inline-flex items-center gap-1.5 text-muted-foreground/60">
        <X className="w-4 h-4" />
        No
      </span>
    );
  } else {
    displayValue = <span className="text-foreground">{String(value)}{unit}</span>;
  }

  return (
    <div className="flex items-center justify-between py-3 border-b border-border/20 last:border-b-0">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className="text-sm font-medium">{displayValue}</span>
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
    <div className="space-y-8">
      {/* Current Prices Comparison Card */}
      <section className="bg-card/50 border border-border/40 rounded-xl p-6">
        <div className="flex items-center justify-between mb-6">
          <SectionHeader icon={DollarSign} title="Current Price" />
          {isLivePrice && (
            <Badge variant="outline" className="text-xs">
              <span className="w-1.5 h-1.5 bg-green-500 rounded-full mr-1.5 animate-pulse" />
              Live Price
            </Badge>
          )}
        </div>

        <div className="flex flex-col lg:flex-row gap-6">
          {/* Main Price Display */}
          <div className="flex-1">
            {displayPrice ? (
              <div className="space-y-3">
                <div className="text-5xl font-bold text-primary tracking-tight">
                  {formatDisplayPrice(displayPrice)}
                </div>
                {displayMsrp && displayMsrp > displayPrice && (
                  <div className="flex items-center gap-3">
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
                  <div className="text-sm text-muted-foreground">
                    MSRP: {formatDisplayPrice(displayMsrp)}
                  </div>
                )}
              </div>
            ) : (
              <div className="text-2xl text-muted-foreground">Price not available</div>
            )}
          </div>

          {/* Price Sources Grid */}
          <div className="grid grid-cols-3 gap-3 lg:w-[400px]">
            <div className="p-4 rounded-xl bg-muted/30 border border-border/40 text-center">
              <Store className="h-5 w-5 text-muted-foreground mx-auto mb-2" />
              <div className="text-xs text-muted-foreground mb-1">Store</div>
              <div className="text-lg font-bold">
                {printer.current_price_usd_store 
                  ? formatPrice(printer.current_price_usd_store)
                  : '—'
                }
              </div>
            </div>
            <div className="p-4 rounded-xl bg-muted/30 border border-border/40 text-center">
              <Tag className="h-5 w-5 text-muted-foreground mx-auto mb-2" />
              <div className="text-xs text-muted-foreground mb-1">Amazon</div>
              <div className="text-lg font-bold">
                {printer.current_price_usd_amazon 
                  ? formatPrice(printer.current_price_usd_amazon)
                  : '—'
                }
              </div>
            </div>
            <div className="p-4 rounded-xl bg-muted/30 border border-border/40 text-center">
              <Globe className="h-5 w-5 text-muted-foreground mx-auto mb-2" />
              <div className="text-xs text-muted-foreground mb-1">MSRP</div>
              <div className="text-lg font-bold">
                {printer.msrp_usd 
                  ? formatPrice(printer.msrp_usd)
                  : '—'
                }
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Where to Buy - Prominent CTAs */}
      <section className="bg-card/50 border border-border/40 rounded-xl p-6">
        <SectionHeader icon={ShoppingCart} title="Where to Buy" />
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* Official Store - Primary CTA */}
          {printer.official_store_url ? (
            <a 
              href={getAffiliateUrl(printer.official_store_url, brand) || printer.official_store_url}
              target="_blank" 
              rel="noopener noreferrer"
              className="block"
            >
              <Button size="lg" className="w-full h-auto py-4 gap-3 text-base">
                <Store className="h-5 w-5" />
                <div className="flex flex-col items-start">
                  <span className="font-semibold">Official {brand || 'Store'}</span>
                  <span className="text-xs opacity-80">Best warranty & support</span>
                </div>
                <ExternalLink className="h-4 w-4 ml-auto" />
              </Button>
            </a>
          ) : (
            <div className="flex items-center justify-center p-4 border-2 border-dashed border-border/50 rounded-xl text-muted-foreground/60">
              <span className="text-sm">No official store link</span>
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
              <Button size="lg" variant="amazon" className="w-full h-auto py-4 gap-3 text-base">
                <Tag className="h-5 w-5" />
                <div className="flex flex-col items-start">
                  <span className="font-semibold">Amazon</span>
                  <span className="text-xs opacity-80">Fast shipping</span>
                </div>
                <ExternalLink className="h-4 w-4 ml-auto" />
              </Button>
            </a>
          ) : (
            <div className="flex items-center justify-center p-4 border-2 border-dashed border-border/50 rounded-xl text-muted-foreground/60">
              <span className="text-sm">Not available on Amazon</span>
            </div>
          )}

          {/* Other Retailers Placeholder */}
          <div className="flex flex-col items-center justify-center p-4 border-2 border-dashed border-border/50 rounded-xl text-muted-foreground/60">
            <span className="text-sm">More retailers coming soon</span>
          </div>
        </div>

        {/* Additional Amazon Links */}
        {(printer.amazon_link_uk || printer.amazon_link_de) && (
          <div className="mt-4 pt-4 border-t border-border/30 flex flex-wrap gap-2">
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

      {/* Price by Region Table */}
      <section className="bg-card/50 border border-border/40 rounded-xl p-6">
        <SectionHeader icon={Globe} title="Price by Region (MSRP)" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="p-4 rounded-xl bg-muted/30 border border-border/40">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xs font-medium text-muted-foreground">🇺🇸 USD</span>
            </div>
            <div className={cn(
              "text-xl font-bold",
              printer.msrp_usd ? "text-foreground" : "text-muted-foreground/50"
            )}>
              {printer.msrp_usd ? `$${printer.msrp_usd}` : 'Not available'}
            </div>
          </div>
          <div className="p-4 rounded-xl bg-muted/30 border border-border/40">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xs font-medium text-muted-foreground">🇨🇦 CAD</span>
            </div>
            <div className={cn(
              "text-xl font-bold",
              printer.msrp_cad ? "text-foreground" : "text-muted-foreground/50"
            )}>
              {printer.msrp_cad ? `C$${printer.msrp_cad}` : 'Not available'}
            </div>
          </div>
          <div className="p-4 rounded-xl bg-muted/30 border border-border/40">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xs font-medium text-muted-foreground">🇪🇺 EUR</span>
            </div>
            <div className={cn(
              "text-xl font-bold",
              printer.msrp_eur ? "text-foreground" : "text-muted-foreground/50"
            )}>
              {printer.msrp_eur ? `€${printer.msrp_eur}` : 'Not available'}
            </div>
          </div>
          <div className="p-4 rounded-xl bg-muted/30 border border-border/40">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xs font-medium text-muted-foreground">🇬🇧 GBP</span>
            </div>
            <div className={cn(
              "text-xl font-bold",
              printer.msrp_gbp ? "text-foreground" : "text-muted-foreground/50"
            )}>
              {printer.msrp_gbp ? `£${printer.msrp_gbp}` : 'Not available'}
            </div>
          </div>
        </div>
      </section>

      {/* Price History */}
      <section className="bg-card/50 border border-border/40 rounded-xl p-6">
        <SectionHeader icon={ChartLine} title="Price History" />
        <PrinterPriceChart
          printerId={printer.id}
          currentStorePrice={printer.current_price_usd_store}
          currentAmazonPrice={printer.current_price_usd_amazon}
          msrp={printer.msrp_usd}
        />
      </section>

      {/* Availability & Status */}
      <section className="bg-card/50 border border-border/40 rounded-xl p-6">
        <SectionHeader icon={Clock} title="Availability & Status" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="p-4 rounded-xl bg-muted/30 border border-border/40">
            <div className="text-xs text-muted-foreground mb-2">Status</div>
            {printer.discontinued ? (
              <Badge variant="destructive" className="text-sm">Discontinued</Badge>
            ) : (
              <Badge className="bg-green-500/20 text-green-500 border-green-500/30 text-sm">
                Available
              </Badge>
            )}
          </div>
          <div className="p-4 rounded-xl bg-muted/30 border border-border/40">
            <div className="text-xs text-muted-foreground mb-2">Release Date</div>
            <div className={cn(
              "text-sm font-medium",
              printer.release_date ? "text-foreground" : "text-muted-foreground/50"
            )}>
              {printer.release_date || '—'}
            </div>
          </div>
          <div className="p-4 rounded-xl bg-muted/30 border border-border/40">
            <div className="text-xs text-muted-foreground mb-2">Price Tier</div>
            {printer.price_tier ? (
              <Badge variant="secondary" className="capitalize text-sm">{printer.price_tier}</Badge>
            ) : (
              <span className="text-sm text-muted-foreground/50">—</span>
            )}
          </div>
          <div className="p-4 rounded-xl bg-muted/30 border border-border/40">
            <div className="text-xs text-muted-foreground mb-2">Target User</div>
            {printer.target_user_segment ? (
              <Badge variant="secondary" className="text-sm">{printer.target_user_segment}</Badge>
            ) : (
              <span className="text-sm text-muted-foreground/50">—</span>
            )}
          </div>
        </div>
      </section>

      {/* Assembly Info */}
      <section className="bg-card/50 border border-border/40 rounded-xl p-6">
        <SectionHeader icon={Wrench} title="Assembly Information" />
        <div className="space-y-0">
          <InfoRow label="Assembly Required" value={printer.assembly_required} />
          <InfoRow label="Average Assembly Time" value={printer.average_assembly_time_min} unit=" minutes" />
        </div>
        
        {printer.assembly_guide_url && (
          <div className="mt-4 pt-4 border-t border-border/30">
            <a 
              href={printer.assembly_guide_url}
              target="_blank"
              rel="noopener noreferrer"
            >
              <Button variant="outline" className="gap-2">
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
