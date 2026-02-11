import { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { Printer as PrinterIcon, ExternalLinkIcon, Tag, Info, Box, Zap, Thermometer, HelpCircle, Loader2 } from "lucide-react";
import type { Database } from "@/integrations/supabase/types";
import { getBrandLogo } from "@/lib/brandLogos";
import { BrandLogo } from "@/components/ui/BrandLogo";
import { useRegion } from "@/contexts/RegionContext";
import { usePrinterCurrentPrice } from "@/hooks/usePrinterCurrentPrice";
import { getPrinterImage, getPrinterBadges } from "@/lib/printerCardUtils";
import PrinterBadge from "./PrinterBadge";
import ComparisonCheckbox from "./ComparisonCheckbox";
import { OptimizedImage } from "@/components/ui/optimized-image";
import { REGIONS } from "@/config/regions";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

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
  const { formatPrice, currency: userCurrency, region, regionConfig } = useRegion();
  const productImage = getPrinterImage(printer);
  const badges = getPrinterBadges(printer, 2);

  const [imageTimedOut, setImageTimedOut] = useState(false);
  const imageLoadedRef = useRef(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (!imageLoadedRef.current) {
        setImageTimedOut(true);
      }
    }, 8000);
    return () => clearTimeout(timer);
  }, []);

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
      className="group relative transition-all duration-200 ease-out hover:-translate-y-1 hover:shadow-lg hover:shadow-cyan-500/10 rounded-xl"
      role="article"
      aria-label={`${printer.brand?.brand} ${printer.model_name}`}
    >
      {/* Compare Checkbox - Top right corner */}
      <div className="absolute top-2 right-2 sm:top-3 sm:right-3 z-10 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity duration-200">
        <ComparisonCheckbox
          checked={isSelected}
          disabled={isMaxReached}
          onChange={onToggleCompare}
          printerName={printer.model_name}
        />
      </div>

      <Link to={`/printers/${printer.printer_id || printer.id}`}>
        <div 
          className={`
            relative
            bg-card/80 
            border 
            rounded-xl 
            p-3 sm:p-6 
            transition-all duration-200 ease-out
            hover:shadow-lg hover:shadow-cyan-500/5
            cursor-pointer
            h-full
            flex flex-row sm:flex-col
            sm:min-h-[480px]
            gap-3 sm:gap-3
            ${isSelected 
              ? 'border-primary/60 shadow-[0_0_15px_rgba(0,207,232,0.15)]' 
              : 'border-gray-700 hover:border-gray-600/50'
            }
          `}
        >
          {/* Mobile: Left side (Image) */}
          {/* Desktop: Full width stacked layout */}
          <div className="flex-shrink-0 w-[100px] sm:w-full">
            {/* Brand Logo - Hidden on mobile, shown on desktop */}
            <div className="hidden sm:flex justify-center min-h-[48px] items-center">
              {getBrandLogo(printer.brand?.brand || null) ? (
                <BrandLogo
                  src={getBrandLogo(printer.brand?.brand || null)}
                  brandName={printer.brand?.brand || "Brand"}
                  size="lg"
                  className="h-12 opacity-60 group-hover:opacity-90 transition-opacity duration-300"
                />
              ) : (
                <span className="text-sm font-semibold text-muted-foreground/60 text-center py-2 tracking-wide">
                  {printer.brand?.brand || "Brand"}
                </span>
              )}
            </div>

            {/* Feature Badges - Hidden on mobile */}
            <div className="hidden sm:flex flex-wrap gap-1.5 justify-center mt-3 min-h-[32px]">
              {badges.map((badge, idx) => (
                <PrinterBadge 
                  key={`${badge.type}-${idx}`}
                  type={badge.type}
                  size="sm"
                  compact
                />
              ))}
            </div>

            {/* Printer Image - Using OptimizedImage with consistent aspect ratio */}
            <div className={`relative aspect-auto w-full h-auto sm:h-[220px] flex items-center justify-center bg-[#0d1117] rounded-lg overflow-hidden ${!getBrandLogo(printer.brand?.brand || null) ? 'sm:mt-4' : 'sm:mt-3'}`}>
              {imageTimedOut ? (
              <div className="flex flex-col items-center justify-center gap-1 bg-gradient-to-b from-muted/10 to-muted/5 w-full h-full relative">
                  <PrinterIcon className="h-16 w-16 text-muted-foreground/20" />
                  <span className="absolute bottom-2 right-2 text-xs text-muted-foreground/40 italic">Photo coming soon</span>
                </div>
              ) : (
                <OptimizedImage
                  src={productImage}
                  alt={`${printer.brand?.brand} ${printer.model_name}`}
                  className="w-auto h-full max-w-full max-h-[220px] object-contain drop-shadow-[0_4px_20px_rgba(0,0,0,0.5)]"
                  aspectRatio="auto"
                  objectFit="contain"
                  width={400}
                  onLoad={() => { imageLoadedRef.current = true; }}
                  onError={() => { setImageTimedOut(true); }}
                  fallback={
                    <div className="flex flex-col items-center justify-center gap-1 bg-gradient-to-b from-muted/10 to-muted/5 w-full h-full relative">
                      <PrinterIcon className="h-16 w-16 text-muted-foreground/20" />
                      <span className="absolute bottom-2 right-2 text-xs text-muted-foreground/40 italic">Photo coming soon</span>
                    </div>
                  }
                />
              )}
            </div>
          </div>

          {/* Mobile: Right side (Content) / Desktop: Below image */}
          <div className="flex flex-col flex-1 min-w-0 justify-between gap-2 sm:gap-3">
            {/* Brand name on mobile (since logo is hidden on mobile) */}
            <div className="sm:hidden text-[10px] font-bold text-primary uppercase tracking-wider">
              {printer.brand?.brand}
            </div>

            {/* Printer Name */}
            <div>
              <h3 className="text-sm sm:text-lg font-semibold text-foreground leading-snug line-clamp-2">
                {printer.model_name}
              </h3>
              {printer.variant_or_bundle_name && (
                <p className="text-xs sm:text-sm text-muted-foreground mt-0.5 line-clamp-1">{printer.variant_or_bundle_name}</p>
              )}
            </div>

            {/* Price Section */}
            <div className="flex flex-col gap-1">
              <div className="flex items-center gap-2 flex-wrap">
                {printer.discontinued ? (
                  <span className="text-xs sm:text-sm font-medium text-destructive/70">DISCONTINUED</span>
                ) : priceLoading ? (
                  <span className="h-5 w-20 rounded bg-muted animate-pulse" />
                ) : price ? (
                  <>
                    {/* Current Price - WHITE for consistency */}
                    <span className="text-base sm:text-xl font-bold text-white inline-flex items-center gap-1">
                      <Tag className="h-3 w-3 sm:h-4 sm:w-4 text-primary opacity-70" />
                      {formatDisplayPrice(price)}
                    </span>
                    
                    {/* Discount Badge - prominent green pill */}
                    {printer.msrp_usd && price < printer.msrp_usd && discountPercent && discountPercent >= 5 && (
                      <span className="bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-xs font-mono font-semibold px-1.5 py-0.5 rounded">
                        -{discountPercent}% OFF
                      </span>
                    )}
                    
                    {/* Original Price strikethrough */}
                    {printer.msrp_usd && price < printer.msrp_usd && (
                      <span className="text-xs text-gray-500 line-through hidden sm:inline">
                        {formatDisplayPrice(printer.msrp_usd)}
                      </span>
                    )}
                  </>
                ) : (
                  <span className="bg-gray-800/50 border border-gray-700 border-dashed text-gray-500 text-xs font-mono italic px-3 py-1 rounded-full inline-flex items-center gap-1.5">
                    <HelpCircle size={12} className="text-gray-600" />
                    Price TBD
                  </span>
                )}
              </div>
              
              {/* Price disclaimer */}
              {!printer.discontinued && price && (
                <Link to={`/printers/${printer.printer_id || printer.id}`} className="flex items-center text-[10px] text-gray-600 italic cursor-pointer hover:text-gray-400 transition-colors">
                  <ExternalLinkIcon size={10} className="mr-0.5" />
                  <span>Verify at store</span>
                </Link>
              )}
            </div>

            {/* Spec Micro-Grid - Hidden on mobile */}
            <div className="hidden sm:grid grid-cols-3 gap-0 min-h-[24px]">
              <div className="text-center py-2 min-w-0 border-r border-border/30">
                <div className="flex items-center justify-center gap-1 mb-1">
                  <Box className="h-4 w-4 text-muted-foreground" />
                  <span className="text-[10px] text-muted-foreground uppercase tracking-wide">Build Vol</span>
                </div>
                <span className={`text-sm font-medium whitespace-nowrap overflow-hidden text-ellipsis block ${
                  printer.build_volume_x_mm ? 'text-foreground' : 'text-muted-foreground/50'
                }`}>
                  {printer.build_volume_x_mm && printer.build_volume_y_mm && printer.build_volume_z_mm
                    ? (printer.build_volume_x_mm === printer.build_volume_y_mm && printer.build_volume_y_mm === printer.build_volume_z_mm
                        ? `${printer.build_volume_x_mm}³`
                        : `${printer.build_volume_x_mm}×${printer.build_volume_y_mm}×${printer.build_volume_z_mm}`)
                    : '—'}
                </span>
              </div>
              <div className="text-center py-2 min-w-0 border-r border-border/30">
                <div className="flex items-center justify-center gap-1 mb-1">
                  <Zap className="h-4 w-4 text-muted-foreground" />
                  <span className="text-[10px] text-muted-foreground uppercase tracking-wide">Speed</span>
                </div>
                <span className={`text-sm font-medium whitespace-nowrap overflow-hidden text-ellipsis block ${
                  printer.max_print_speed_mms ? 'text-foreground' : 'text-muted-foreground/50'
                }`}>
                  {printer.max_print_speed_mms ? `${printer.max_print_speed_mms}mm/s` : '—'}
                </span>
              </div>
              <div className="text-center py-2 min-w-0">
                <div className="flex items-center justify-center gap-1 mb-1">
                  <Thermometer className="h-4 w-4 text-muted-foreground" />
                  <span className="text-[10px] text-muted-foreground uppercase tracking-wide">Nozzle</span>
                </div>
                <span className={`text-sm font-medium whitespace-nowrap overflow-hidden text-ellipsis block ${
                  printer.max_nozzle_temp_c ? 'text-foreground' : 'text-muted-foreground/50'
                }`}>
                  {printer.max_nozzle_temp_c ? `${printer.max_nozzle_temp_c}°C` : '—'}
                </span>
              </div>
            </div>

            {/* CTA Button - Hidden on mobile, full width on desktop */}
            <button
              className="hidden sm:flex w-full h-11 rounded-lg border border-cyan-500/50 text-cyan-400 hover:bg-cyan-500 hover:text-black font-medium text-sm transition-colors items-center justify-center gap-2 mt-auto"
              onClick={(e) => e.preventDefault()}
            >
              View Details
            </button>
          </div>

        </div>
      </Link>
    </article>
  );
}
