import { Link } from "react-router-dom";
import { Printer as PrinterIcon, CheckCircle2 } from "lucide-react";
import type { Database } from "@/integrations/supabase/types";
import { getBrandLogo } from "@/lib/brandLogos";
import { useCurrency } from "@/hooks/useCurrency";
import { usePrinterCurrentPrice } from "@/hooks/usePrinterCurrentPrice";
import { getPrinterImage, getPrinterBadges } from "@/lib/printerCardUtils";
import PrinterBadge from "./PrinterBadge";
import ComparisonCheckbox from "./ComparisonCheckbox";

type Printer = Database["public"]["Tables"]["printers"]["Row"] & {
  brand: { brand: string } | null;
  series: { series_name: string } | null;
};

interface MediumStandardPrinterCardProps {
  printer: Printer;
  isSelected: boolean;
  isMaxReached: boolean;
  onToggleCompare: () => void;
  isAdmin?: boolean;
  onEditImage?: (e: React.MouseEvent) => void;
  onRescrape?: (e: React.MouseEvent) => void;
  isRescraping?: boolean;
}

export default function MediumStandardPrinterCard({
  printer,
  isSelected,
  isMaxReached,
  onToggleCompare,
  isAdmin,
  onEditImage,
  onRescrape,
  isRescraping
}: MediumStandardPrinterCardProps) {
  const { formatPrice, formatRegionalPrice, currency: userCurrency } = useCurrency();
  const productImage = getPrinterImage(printer);
  const badges = getPrinterBadges(printer, 2);

  // Calculate fallback price from database (store > amazon > msrp)
  const databasePrice = printer.current_price_usd_store ?? printer.current_price_usd_amazon ?? printer.msrp_usd;
  
  // Debug logging for K2 pricing issue
  if (printer.model_name === 'K2') {
    console.log('[K2 Pricing Debug]', {
      model: printer.model_name,
      store: printer.current_price_usd_store,
      amazon: printer.current_price_usd_amazon,
      msrp: printer.msrp_usd,
      databasePrice,
    });
  }
  
  // Fetch live price from store (uses caching to avoid excessive API calls)
  const { 
    currentPrice: livePrice, 
    isLoading: priceLoading, 
    isLivePrice,
    currency: livePriceCurrency
  } = usePrinterCurrentPrice(printer.official_store_url, databasePrice);

  // Debug logging for K2 pricing issue - after hook
  if (printer.model_name === 'K2') {
    console.log('[K2 Pricing Debug - After Hook]', {
      livePrice,
      priceLoading,
      isLivePrice,
      finalPrice: livePrice ?? databasePrice,
    });
  }

  // Use live price if available, otherwise use the hook's returned price (which includes fallback)
  // The hook already handles fallback internally, so we just need to ensure we have a value
  const price = livePrice ?? databasePrice;
  
  // Determine if live price is already in user's currency (no conversion needed)
  const isLivePriceInUserCurrency = isLivePrice && livePriceCurrency === userCurrency;
  
  // Format price correctly based on whether conversion is needed
  const formatDisplayPrice = (priceValue: number): string => {
    if (isLivePriceInUserCurrency) {
      return formatRegionalPrice(priceValue);
    }
    return formatPrice(priceValue);
  };

  // Format simplified specs: "256×256×256mm • 500mm/s • 300°C"
  const formatSimplifiedSpecs = () => {
    const parts: string[] = [];
    
    // Build Volume
    if (printer.build_volume_x_mm && printer.build_volume_y_mm && printer.build_volume_z_mm) {
      const { build_volume_x_mm: x, build_volume_y_mm: y, build_volume_z_mm: z } = printer;
      if (x === y && y === z) {
        parts.push(`${x}³mm`);
      } else {
        parts.push(`${x}×${y}×${z}mm`);
      }
    }
    
    // Speed
    if (printer.max_print_speed_mms) {
      parts.push(`${printer.max_print_speed_mms}mm/s`);
    }
    
    // Hotend Temp
    if (printer.max_nozzle_temp_c) {
      parts.push(`${printer.max_nozzle_temp_c}°C`);
    }
    
    return parts.join(' • ');
  };

  // Calculate discount percentage
  const discountPercent = printer.msrp_usd && price && price < printer.msrp_usd
    ? Math.round((1 - price / printer.msrp_usd) * 100)
    : null;

  return (
    <article 
      className="group relative"
      role="article"
      aria-label={`${printer.brand?.brand} ${printer.model_name}`}
    >
      {/* Compare Checkbox - Top right corner */}
      <div className="absolute top-3 right-3 z-10">
        <ComparisonCheckbox
          checked={isSelected}
          disabled={isMaxReached}
          onChange={onToggleCompare}
          printerName={printer.model_name}
        />
      </div>

      <Link to={`/printers/${printer.id}`}>
        <div 
          className={`
            relative
            bg-card/80 
            border 
            rounded-xl 
            p-6 
            transition-all duration-300 ease-out
            hover:-translate-y-1 
            hover:shadow-[0_0_30px_rgba(0,207,232,0.12)]
            cursor-pointer
            h-full
            flex flex-col
            gap-3
            ${isSelected 
              ? 'border-primary/60 shadow-[0_0_15px_rgba(0,207,232,0.15)]' 
              : 'border-white/10 hover:border-primary/50'
            }
          `}
        >
          {/* Brand Logo - Top of Card (PROMINENT) */}
          {getBrandLogo(printer.brand?.brand || null) && (
            <div className="flex justify-center">
              <img 
                src={getBrandLogo(printer.brand?.brand || null)!} 
                alt={`${printer.brand?.brand} logo`}
                className="h-12 w-auto object-contain opacity-60 group-hover:opacity-90 transition-opacity duration-300"
              />
            </div>
          )}

          {/* Feature Badges - Directly under logo */}
          {badges.length > 0 && (
            <div className="flex flex-wrap gap-1.5 justify-center">
              {badges.map((badge, idx) => (
                <PrinterBadge 
                  key={`${badge.type}-${idx}`}
                  type={badge.type}
                  size="sm"
                  compact
                />
              ))}
            </div>
          )}

          {/* Printer Image - Slightly larger */}
          <div className={`relative h-[200px] flex items-center justify-center ${!getBrandLogo(printer.brand?.brand || null) ? 'mt-4' : ''}`}>
            {productImage ? (
              <img 
                src={productImage} 
                alt={`${printer.brand?.brand} ${printer.model_name}`}
                className="max-h-full max-w-full object-contain drop-shadow-[0_4px_20px_rgba(0,0,0,0.5)]"
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = 'none';
                  (e.target as HTMLImageElement).nextElementSibling?.classList.remove('hidden');
                }}
              />
            ) : null}
            <div className={`flex items-center justify-center ${productImage ? 'hidden' : ''}`}>
              <PrinterIcon className="h-20 w-20 text-white/15" />
            </div>
          </div>

          {/* Printer Name - Larger, bolder */}
          <div className="mt-auto">
            <h3 className="text-lg font-semibold text-foreground leading-snug line-clamp-2">
              {printer.model_name}
            </h3>
            {printer.variant_or_bundle_name && (
              <p className="text-sm text-muted-foreground mt-0.5">{printer.variant_or_bundle_name}</p>
            )}
          </div>

          {/* Price Section - Clean, no label */}
          <div className="flex items-baseline gap-2 flex-wrap">
            {printer.discontinued ? (
              <span className="text-sm font-medium text-destructive/70">DISCONTINUED</span>
            ) : priceLoading ? (
              <span className="text-sm text-muted-foreground animate-pulse">Loading...</span>
            ) : price ? (
              <>
                <span className="text-xl font-bold text-foreground inline-flex items-center gap-1.5">
                  {formatDisplayPrice(price)}
                  {isLivePrice && <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />}
                </span>
                {printer.msrp_usd && price < printer.msrp_usd && (
                  <>
                    <span className="text-sm text-muted-foreground line-through">
                      {formatDisplayPrice(printer.msrp_usd)}
                    </span>
                    <span className="text-xs font-semibold bg-primary text-primary-foreground px-1.5 py-0.5 rounded">
                      -{discountPercent}%
                    </span>
                  </>
                )}
              </>
            ) : (
              <span className="text-sm text-muted-foreground">Price TBD</span>
            )}
          </div>

          {/* Simplified Specs Row */}
          <p className="text-sm text-muted-foreground">
            {formatSimplifiedSpecs() || "Specs unavailable"}
          </p>

          {/* CTA Button - Full width */}
          <button
            className="w-full h-11 rounded-lg bg-primary text-primary-foreground font-medium text-sm transition-all duration-200 hover:bg-primary/90 hover:shadow-[0_0_20px_rgba(0,207,232,0.3)] flex items-center justify-center gap-2 mt-1"
            onClick={(e) => e.preventDefault()}
          >
            View Details
          </button>

        </div>
      </Link>
    </article>
  );
}
