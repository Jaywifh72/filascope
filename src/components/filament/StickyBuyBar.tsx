import { useEffect, useRef } from "react";
import { ShoppingCart, ExternalLink, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useConversionTracking } from "@/hooks/useConversionTracking";
import { useRegion } from "@/contexts/RegionContext";
import { cn } from "@/lib/utils";
import { PriceUrgencyBadge } from "./urgency/PriceUrgencyBadge";
import { StockUrgencyIndicator } from "./urgency/StockUrgencyIndicator";
import { ShippingCountdown } from "./urgency/ShippingCountdown";
import { differenceInDays } from "date-fns";

interface StickyBuyBarProps {
  filament: {
    id: string;
    product_title: string;
    vendor: string | null;
    featured_image: string | null;
    variant_price: number | null;
    net_weight_g: number | null;
    last_scraped_at?: string | null;
  };
  affiliateUrl: string | null;
  pricePerKg: number | null;
  isVisible: boolean;
  stockStatus?: 'in_stock' | 'low_stock' | 'out_of_stock';
  stockQuantity?: number | null;
  /** Whether the displayed price was converted from another currency */
  isConverted?: boolean;
  /** Best retailer's display name (from sidebarBest) */
  storeName?: string;
  /** Store's region code for flag/local detection */
  storeRegion?: string;
}

// Region flags for display
const regionFlags: Record<string, string> = {
  US: '🇺🇸', CA: '🇨🇦', UK: '🇬🇧', EU: '🇪🇺', AU: '🇦🇺', JP: '🇯🇵', CN: '🇨🇳', GLOBAL: '🌐'
};

/** Strip trailing region codes from store names to avoid redundancy like "Amazon US us" */
function cleanStoreName(name: string): string {
  // Always strip trailing region codes — the region is shown via flag or implied by "local"
  return name.replace(/\s+(US|UK|EU|CA|AU|JP|CN|DE)$/i, '').trim();
}

export function StickyBuyBar({ 
  filament, 
  affiliateUrl, 
  pricePerKg, 
  isVisible,
  stockStatus = 'in_stock',
  stockQuantity,
  isConverted = false,
  storeName,
  storeRegion,
}: StickyBuyBarProps) {
  const { trackStoreClick } = useConversionTracking();
  const { formatPrice, region: userRegion } = useRegion();

  // Normalize region code to uppercase for consistent comparison
  const normalizedStoreRegion = storeRegion?.toUpperCase() || null;
  
  // Determine if store is from a different region
  const showRegionFlag = !!normalizedStoreRegion && normalizedStoreRegion !== userRegion && normalizedStoreRegion !== 'GLOBAL';
  const regionFlag = normalizedStoreRegion ? regionFlags[normalizedStoreRegion] || '' : '';

  // Resolve display name: always strip trailing region codes to avoid "Amazon US us"
  const displayStoreName = cleanStoreName(storeName || filament.vendor || 'Store');
  const hasTrackedImpression = useRef(false);
  
  // Format using useRegion's formatPrice with approximate indicator for converted prices
  const formattedPrice = pricePerKg 
    ? formatPrice(pricePerKg, { showApproximate: isConverted })
    : null;

  // Price freshness for display — color-coded by age
  const priceFreshness = (() => {
    const lastScraped = filament.last_scraped_at;
    if (!lastScraped) return null;
    const date = new Date(lastScraped);
    if (isNaN(date.getTime())) return null;
    const days = differenceInDays(new Date(), date);
    const text = days < 1 ? 'Updated today' : days === 1 ? 'Updated 1d ago' : `Updated ${days}d ago`;
    // Color coding: green <3d, amber 3-14d, orange 14-30d, red >30d
    const colorClass = days < 3 ? 'text-emerald-400/80' 
      : days < 14 ? 'text-amber-400/80' 
      : days < 30 ? 'text-orange-400/80' 
      : 'text-red-400/80';
    return { text, colorClass };
  })();

  // Track impression when bar becomes visible
  useEffect(() => {
    if (isVisible && !hasTrackedImpression.current) {
      trackStoreClick({
        moduleName: 'sticky_buy_bar_impression',
        entityId: filament.id,
        entityType: 'filament',
      });
      hasTrackedImpression.current = true;
    }
  }, [isVisible, filament.id, trackStoreClick]);

  const handleBuyClick = () => {
    trackStoreClick({
      moduleName: 'sticky_buy_bar',
      entityId: filament.id,
      entityType: 'filament',
    });

    if (affiliateUrl) {
      window.open(affiliateUrl, '_blank', 'noopener,noreferrer');
    }
  };

  // Get product name without brand prefix
  const getDisplayName = () => {
    const title = filament.product_title || '';
    if (filament.vendor && title.toLowerCase().startsWith(filament.vendor.toLowerCase())) {
      return title.slice(filament.vendor.length).trim();
    }
    return title;
  };

  // Format weight display
  const weightDisplay = filament.net_weight_g 
    ? filament.net_weight_g >= 1000 
      ? `${(filament.net_weight_g / 1000).toFixed(1)}kg`
      : `${filament.net_weight_g}g`
    : null;

  if (!affiliateUrl) return null;

  return (
    <div
      className={cn(
        "fixed bottom-0 left-0 right-0 z-50",
        "bg-slate-900/98 backdrop-blur-xl",
        "border-t border-primary/30",
        "shadow-[0_-4px_20px_rgba(0,0,0,0.3),0_-1px_0_rgba(0,212,212,0.1)]",
        "transform transition-all duration-300 ease-out",
        "pb-[env(safe-area-inset-bottom)]",
        isVisible ? "translate-y-0 opacity-100" : "translate-y-full opacity-0 pointer-events-none"
      )}
      role="complementary"
      aria-label="Quick purchase bar"
      aria-hidden={!isVisible}
    >
      <div className="max-w-[1400px] mx-auto px-4 lg:px-6 py-3">
        {/* Desktop Layout */}
        <div className="hidden md:flex items-center justify-between gap-6">
          {/* Product Info Section */}
          <div className="flex items-center gap-4 flex-1 min-w-0">
            {/* Product Image */}
            {filament.featured_image && (
              <div className="w-12 h-12 flex-shrink-0 rounded-lg bg-white/5 border border-white/10 overflow-hidden">
                <img
                  src={filament.featured_image}
                  alt={filament.product_title}
                  className="w-full h-full object-contain p-1"
                  loading="lazy"
                />
              </div>
            )}
            
            {/* Product Name & Meta */}
            <div className="flex flex-col gap-0.5 min-w-0">
              <div className="flex items-center gap-2 text-[15px] font-semibold text-white truncate">
                <span className="text-primary font-bold">{filament.vendor}</span>
                <span className="truncate">{getDisplayName()}</span>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <StockUrgencyIndicator
                  stockStatus={stockStatus}
                  stockQuantity={stockQuantity}
                  compact={true}
                />
                {weightDisplay && (
                  <>
                    <span className="text-slate-500">•</span>
                    <span className="text-slate-400">{weightDisplay}</span>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Price Section with Urgency */}
          <div className="flex items-center gap-4 flex-shrink-0">
            <PriceUrgencyBadge
              filamentId={filament.id}
              currentPrice={pricePerKg}
              size="small"
            />
            {formattedPrice && (
              <div className="flex flex-col items-end">
                <div className="text-2xl font-bold text-white tracking-tight">
                  {formattedPrice}
                  <span className="text-sm font-medium text-slate-400 ml-1">/kg</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-400">
                    from {displayStoreName} {showRegionFlag && regionFlag}
                  </span>
                  {priceFreshness && (
                    <span className={cn("flex items-center gap-0.5 text-[11px]", priceFreshness.colorClass)}>
                      <Clock className="w-2.5 h-2.5" />
                      {priceFreshness.text}
                    </span>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Shipping + CTA */}
          <div className="flex items-center gap-4 flex-shrink-0">
            <ShippingCountdown compact />
            
            {/* CTA Button */}
            <Button
              onClick={handleBuyClick}
              disabled={stockStatus === 'out_of_stock'}
              className={cn(
                "min-w-[200px] h-[52px] px-7",
                "bg-gradient-to-r from-primary to-primary/80",
                "hover:from-primary/90 hover:to-primary/70",
                "text-primary-foreground font-bold text-base tracking-wide",
                "shadow-[0_4px_15px_rgba(0,212,212,0.3),inset_0_1px_0_rgba(255,255,255,0.2)]",
                "hover:shadow-[0_6px_25px_rgba(0,212,212,0.4),inset_0_1px_0_rgba(255,255,255,0.3)]",
                "hover:-translate-y-0.5 active:translate-y-0",
                "transition-all duration-200",
                "rounded-xl",
                "disabled:opacity-50 disabled:cursor-not-allowed"
              )}
              aria-label={`Buy ${filament.product_title} from ${filament.vendor}`}
            >
              <ShoppingCart className="w-[18px] h-[18px] mr-2.5" />
              <span>BUY NOW</span>
              <span className="ml-3 pl-3 border-l border-primary-foreground/20 flex items-center gap-1.5 text-sm font-semibold opacity-80">
                <ExternalLink className="w-3.5 h-3.5" />
                {displayStoreName}
              </span>
            </Button>
          </div>
        </div>

        {/* Mobile Layout */}
        <div className="md:hidden flex flex-col gap-3">
          {/* Top row: Product info + Price */}
          <div className="flex items-start justify-between gap-4">
            <div className="flex flex-col gap-0.5 min-w-0 flex-1">
              <div className="text-sm font-semibold text-white truncate">
                <span className="text-primary">{filament.vendor}</span>
                {' '}
                <span>{getDisplayName()}</span>
              </div>
              <div className="flex items-center gap-2 text-xs">
                <StockUrgencyIndicator
                  stockStatus={stockStatus}
                  stockQuantity={stockQuantity}
                  compact={true}
                />
                {weightDisplay && (
                  <>
                    <span className="text-slate-500">•</span>
                    <span className="text-slate-400">{weightDisplay}</span>
                  </>
                )}
              </div>
            </div>
            
            <div className="text-right flex-shrink-0">
              {formattedPrice && (
                <div className="text-xl font-bold text-white">
                  {formattedPrice}
                  <span className="text-xs font-medium text-slate-400 ml-0.5">/kg</span>
                </div>
              )}
              {priceFreshness && (
                <span className={cn("flex items-center gap-0.5 text-[11px] justify-end", priceFreshness.colorClass)}>
                  <Clock className="w-2.5 h-2.5" />
                  {priceFreshness.text}
                </span>
              )}
              <PriceUrgencyBadge
                filamentId={filament.id}
                currentPrice={pricePerKg}
                size="small"
                className="mt-1"
              />
            </div>
          </div>

          {/* Full-width button */}
          <Button
            onClick={handleBuyClick}
            disabled={stockStatus === 'out_of_stock'}
            className={cn(
              "w-full h-14",
              "bg-gradient-to-r from-primary to-primary/80",
              "hover:from-primary/90 hover:to-primary/70",
              "text-primary-foreground font-bold text-[17px] tracking-wide",
              "shadow-[0_4px_15px_rgba(0,212,212,0.3)]",
              "rounded-xl",
              "transition-all duration-200",
              "disabled:opacity-50 disabled:cursor-not-allowed"
            )}
            aria-label={`Buy ${filament.product_title}`}
          >
            <ShoppingCart className="w-5 h-5 mr-2.5" />
            Buy at {displayStoreName}
          </Button>
        </div>
      </div>
    </div>
  );
}
