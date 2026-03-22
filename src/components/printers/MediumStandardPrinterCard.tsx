import { useState, useCallback } from "react";
import { Link } from "react-router-dom";
import { Printer as PrinterIcon, ExternalLinkIcon, Tag, Box, Zap, Thermometer, Loader2, CircleDot, Cog, Star, XCircle } from "lucide-react";
import type { Database } from "@/integrations/supabase/types";
import { getBrandLogo } from "@/lib/brandLogos";
import { BrandLogo } from "@/components/ui/BrandLogo";
import { useRegion } from "@/contexts/RegionContext";
import { usePrinterCurrentPrice } from "@/hooks/usePrinterCurrentPrice";
import { getPrinterImage, getPrinterBadges } from "@/lib/printerCardUtils";
import PrinterBadge from "./PrinterBadge";
import ComparisonCheckbox from "./ComparisonCheckbox";
import { ImageWithFallback } from "@/components/ui/ImageWithFallback";
import { REGIONS } from "@/config/regions";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { useMultiplePrinters } from "@/hooks/useMultiplePrinters";
import { toast } from "sonner";
import { formatPrice as formatCurrencyPrice } from "@/config/currencies";
import { getPrinterRegionalPrice } from "@/utils/printerRegionalPrice";

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
  const { printers: userPrinters, addPrinter, setPrimaryPrinter, isAddingPrinter } = useMultiplePrinters();

  // Check if this printer is the user's primary printer
  const primaryUserPrinter = userPrinters.find((p) => p.is_primary);
  const isMyPrinter = primaryUserPrinter?.printer_id === printer.printer_id;

  const handleSetMyPrinter = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (isMyPrinter) return;

    const existing = userPrinters.find((p) => p.printer_id === printer.printer_id);
    if (existing) {
      setPrimaryPrinter(existing.id);
      toast.success(`${printer.model_name} set as your printer`, {
        description: "Filament compatibility now active.",
      });
    } else {
      addPrinter(
        { printerId: printer.printer_id || printer.id },
        {
          onSuccess: () => {
            toast.success(`${printer.model_name} set as your printer`, {
              description: "Filament compatibility now active.",
            });
          },
        }
      );
    }
  }, [isMyPrinter, userPrinters, printer, addPrinter, setPrimaryPrinter]);

  // Resolve regional price based on user's selected region
  const regionalData = getPrinterRegionalPrice(printer as any, region);
  
  // Calculate fallback price from database (store > amazon > msrp) — used for live price hook
  const databasePrice = printer.current_price_usd_store ?? printer.current_price_usd_amazon ?? printer.msrp_usd;
  
  // Fetch live price from store (uses caching to avoid excessive API calls)
  const { 
    currentPrice: livePrice, 
    isLoading: priceLoading, 
    isLivePrice,
    currency: livePriceCurrency
  } = usePrinterCurrentPrice(printer.official_store_url, databasePrice);

  // Use regional price if available, otherwise live price, then USD fallback
  const price = regionalData.isRegional ? regionalData.price : (livePrice ?? databasePrice);
  const priceCurrency = regionalData.isRegional ? regionalData.currency : 'USD';
  const priceIsUsdFallback = !regionalData.isRegional && region !== 'US';
  
  // Format price in its native currency (no conversion)
  const formatDisplayPrice = (priceValue: number): string => {
    return formatCurrencyPrice(priceValue, priceCurrency);
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

  // Derive kinematics label from machine_style / motion_system_notes
  const getKinematics = (): string | null => {
    const motion = (printer.motion_system_notes || '').toLowerCase();
    const style = (printer.machine_style || '').toLowerCase();
    if (motion.includes('corexy') || style.includes('corexy')) return 'CoreXY';
    if (motion.includes('delta') || style.includes('delta')) return 'Delta';
    if (motion.includes('cartesian') || style.includes('cartesian') || style.includes('bed slinger') || motion.includes('bed slinger')) return 'Bed Slinger';
    if (style) return style.charAt(0).toUpperCase() + style.slice(1);
    return null;
  };
  const kinematics = getKinematics();

  // Calculate discount percentage using regional MSRP when available
  const regionalMsrp = regionalData.msrp;
  const discountPercent = regionalMsrp && price && price < regionalMsrp
    ? Math.round((1 - price / regionalMsrp) * 100)
    : null;

  // Price freshness check (>7 days = stale)
  const priceIsStale = (() => {
    const updated = printer.prices_last_updated_at;
    if (!updated) return true;
    const diff = Date.now() - new Date(updated).getTime();
    return diff > 7 * 24 * 60 * 60 * 1000;
  })();

  return (
    <article 
      className="group relative rounded-xl transition-all duration-200 ease-out [@media(hover:hover)]:hover:scale-[1.02] [@media(hover:hover)]:hover:shadow-[0_8px_30px_rgba(0,210,200,0.08)]"
      role="article"
      aria-label={`${printer.brand?.brand} ${printer.model_name}`}
    >
      {/* Set as My Printer - Top left corner */}
      <div className={`absolute top-2 left-2 sm:top-3 sm:left-3 z-10 ${isMyPrinter ? 'opacity-100' : 'opacity-100 sm:opacity-0 [@media(hover:hover)]:sm:group-hover:opacity-100'} transition-opacity duration-150`}>
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              onClick={handleSetMyPrinter}
              className={`w-7 h-7 rounded-full flex items-center justify-center transition-all duration-200 ${
                isMyPrinter
                  ? 'text-cyan-400 bg-cyan-500/10'
                  : 'text-muted-foreground/60 hover:text-cyan-400 bg-transparent hover:bg-cyan-500/10'
              }`}
              aria-label={isMyPrinter ? "This is your printer" : `Set ${printer.model_name} as your printer`}
            >
              <Star className={`h-4 w-4 ${isMyPrinter ? 'fill-cyan-400' : ''}`} />
            </button>
          </TooltipTrigger>
          <TooltipContent side="right" className="text-xs">
            {isMyPrinter ? "Your printer" : "Set as your printer for filament compatibility"}
          </TooltipContent>
        </Tooltip>
      </div>

      {/* Compare Checkbox - Top right corner */}
      <div className="absolute top-2 right-2 sm:top-3 sm:right-3 z-10 opacity-100 sm:opacity-0 [@media(hover:hover)]:sm:group-hover:opacity-100 transition-opacity duration-150">
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
            cursor-pointer
            h-full
            flex flex-row sm:flex-col
            sm:min-h-[420px]
            gap-3 sm:gap-2
            ${isSelected 
              ? 'border-primary/60 shadow-[0_0_15px_rgba(0,207,232,0.15)]' 
              : 'border-gray-700 [@media(hover:hover)]:group-hover:border-cyan-500/30'
            }
          `}
        >
          {/* Mobile: Left side (Image) */}
          {/* Desktop: Full width stacked layout */}
          <div className="flex-shrink-0 w-[100px] sm:w-full">
            {/* Brand label — inline text with optional small logo */}
            <div className="hidden sm:flex items-center gap-1.5 mb-2">
              {getBrandLogo(printer.brand?.brand || null) ? (
                <BrandLogo
                  src={getBrandLogo(printer.brand?.brand || null)}
                  brandName={printer.brand?.brand || "Brand"}
                  size="sm"
                  className="h-5 opacity-60 group-hover:opacity-90 transition-opacity duration-300"
                />
              ) : null}
              <span className="text-[10px] font-semibold text-muted-foreground/70 uppercase tracking-wider">
                {printer.brand?.brand || "Brand"}
              </span>
            </div>

            {/* Feature Badges — Hidden on mobile */}
            {badges.length > 0 && (
              <div className="hidden sm:flex flex-wrap gap-1.5 mb-2">
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

            {/* Printer Image */}
            <div className="relative aspect-auto w-full h-auto sm:h-[200px] rounded-lg overflow-hidden">
              {/* Discontinued overlay badge */}
              {printer.discontinued && (
                <div className="absolute top-1.5 left-1.5 sm:top-2 sm:left-2 z-[5] flex items-center gap-1 bg-destructive/90 text-destructive-foreground text-[10px] sm:text-xs font-bold uppercase tracking-wider px-2 py-1 rounded">
                  <XCircle className="h-3 w-3" />
                  Discontinued
                </div>
              )}
              {printer.discontinued && (
                <div className="absolute inset-0 bg-background/40 z-[2] pointer-events-none" />
              )}
              <ImageWithFallback
                src={productImage}
                alt={`${printer.brand?.brand} ${printer.model_name}`}
                type="printer"
                aspectRatio="4/3"
                className={`object-contain drop-shadow-[0_4px_20px_rgba(0,0,0,0.5)] ${printer.discontinued ? 'grayscale opacity-60' : ''}`}
              />
            </div>
          </div>

          {/* Mobile: Right side (Content) / Desktop: Below image */}
          <div className="flex flex-col flex-1 min-w-0 justify-between gap-1.5 sm:gap-2">
            {/* Brand name on mobile */}
            <div className="sm:hidden text-[10px] font-bold text-primary uppercase tracking-wider">
              {printer.brand?.brand}
            </div>

            {/* Printer Name + Kinematics */}
            <div>
              <div className="flex items-start gap-1.5">
                <p className="text-sm sm:text-lg font-semibold text-foreground leading-snug line-clamp-2">
                  {printer.model_name}
                </p>
                {kinematics && (
                  <span className="hidden sm:inline-flex flex-shrink-0 mt-0.5 text-[10px] text-muted-foreground bg-muted/40 px-1.5 py-0.5 rounded">
                    {kinematics}
                  </span>
                )}
              </div>
              {printer.variant_or_bundle_name && (
                <p className="text-xs sm:text-sm text-muted-foreground mt-0.5 line-clamp-1">{printer.variant_or_bundle_name}</p>
              )}
              {isMyPrinter && (
                <span className="inline-flex items-center text-xs bg-cyan-500/10 text-cyan-400 px-2 py-0.5 rounded-full mt-1 gap-1">
                  <Star className="h-3 w-3 fill-cyan-400" />
                  Your Printer
                </span>
              )}
            </div>

            {/* Price Section */}
            <div className="flex flex-col gap-0.5">
              <div className="flex items-center gap-2 flex-wrap">
              {printer.discontinued ? (
                  <div className="flex flex-col gap-0.5">
                    {price ? (
                      <span className="text-sm text-muted-foreground line-through">
                        Was {formatDisplayPrice(price)}
                      </span>
                    ) : null}
                    <span className="text-xs text-muted-foreground italic">No longer available</span>
                  </div>
                ) : priceLoading ? (
                  <span className="h-5 w-20 rounded bg-muted animate-pulse" />
                ) : price ? (
                  <>
                    <span className="text-lg font-bold text-cyan-400 inline-flex items-center gap-1">
                      <Tag className="h-3.5 w-3.5 text-muted-foreground/50" />
                      {formatDisplayPrice(price)}
                    </span>
                    {regionalMsrp && price < regionalMsrp && discountPercent && discountPercent >= 5 && (
                      <span className="bg-emerald-500/15 text-emerald-400 text-xs font-semibold px-1.5 py-0.5 rounded">
                        -{discountPercent}%
                      </span>
                    )}
                    {regionalMsrp && price < regionalMsrp && (
                      <span className="text-sm text-muted-foreground line-through hidden sm:inline">
                        {formatCurrencyPrice(regionalMsrp, priceCurrency)}
                      </span>
                    )}
                    {priceIsUsdFallback && (
                      <span className="text-[10px] text-muted-foreground/60">(USD)</span>
                    )}
                  </>
                ) : (
                  <span className="text-sm text-muted-foreground italic">Price TBD</span>
                )}
              </div>
              {!printer.discontinued && price && priceIsStale && (
                <Link to={`/printers/${printer.printer_id || printer.id}`} className="flex items-center text-xs text-amber-400/70 cursor-pointer hover:text-amber-300 transition-colors">
                  <ExternalLinkIcon size={10} className="mr-0.5" />
                  <span>Verify at store</span>
                </Link>
              )}
              {!printer.discontinued && !price && !priceLoading && (
                <Link to={`/printers/${printer.printer_id || printer.id}`} className="flex items-center text-xs text-cyan-400/70 cursor-pointer hover:text-cyan-300 transition-colors">
                  <span>Check store for pricing</span>
                </Link>
              )}
            </div>

            {/* Spec Micro-Grid — 4 columns, hidden on mobile, hidden if no specs */}
            <div className={`${(printer.build_volume_x_mm || printer.max_print_speed_mms || printer.max_nozzle_temp_c || kinematics) ? 'hidden sm:grid' : 'hidden'} grid-cols-4 gap-0`}>
              <div className="text-center py-1.5 min-w-0 border-r border-border/30">
                <span className="text-[10px] text-muted-foreground uppercase tracking-wide block mb-0.5">Vol</span>
                <span className={`text-xs font-medium whitespace-nowrap overflow-hidden text-ellipsis block ${
                  printer.build_volume_x_mm ? 'text-foreground' : 'text-muted-foreground/50'
                }`}>
                  {printer.build_volume_x_mm && printer.build_volume_y_mm && printer.build_volume_z_mm
                    ? (printer.build_volume_x_mm === printer.build_volume_y_mm && printer.build_volume_y_mm === printer.build_volume_z_mm
                        ? `${printer.build_volume_x_mm}³`
                        : `${printer.build_volume_x_mm}×${printer.build_volume_y_mm}×${printer.build_volume_z_mm}`)
                    : '—'}
                </span>
              </div>
              <div className="text-center py-1.5 min-w-0 border-r border-border/30">
                <span className="text-[10px] text-muted-foreground uppercase tracking-wide block mb-0.5">Speed</span>
                <span className={`text-xs font-medium whitespace-nowrap overflow-hidden text-ellipsis block ${
                  printer.max_print_speed_mms ? 'text-foreground' : 'text-muted-foreground/50'
                }`}>
                  {printer.max_print_speed_mms ? `${printer.max_print_speed_mms}mm/s` : '—'}
                </span>
              </div>
              <div className="text-center py-1.5 min-w-0 border-r border-border/30">
                <span className="text-[10px] text-muted-foreground uppercase tracking-wide block mb-0.5">Nozzle</span>
                <span className={`text-xs font-medium whitespace-nowrap overflow-hidden text-ellipsis block ${
                  printer.max_nozzle_temp_c ? 'text-foreground' : 'text-muted-foreground/50'
                }`}>
                  {printer.max_nozzle_temp_c ? `${printer.max_nozzle_temp_c}°C` : '—'}
                </span>
              </div>
              <div className="text-center py-1.5 min-w-0">
                <span className="text-[10px] text-muted-foreground uppercase tracking-wide block mb-0.5">Type</span>
                <span className={`text-xs font-medium whitespace-nowrap overflow-hidden text-ellipsis block ${
                  kinematics ? 'text-foreground' : 'text-muted-foreground/50'
                }`}>
                  {kinematics || '—'}
                </span>
              </div>
            </div>

            {/* Compatible filaments link */}
            <Link
              to="/filaments"
              className="hidden sm:flex items-center gap-1.5 justify-center text-xs text-cyan-400/60 hover:text-cyan-300 transition-colors"
              onClick={(e) => e.stopPropagation()}
            >
              <CircleDot className="h-3 w-3" />
              View compatible filaments →
            </Link>

            {/* CTA Button — Hidden on mobile */}
            <button
              className="hidden sm:flex w-full h-10 rounded-lg border border-cyan-500/50 text-cyan-400 hover:bg-cyan-500 hover:text-black [@media(hover:hover)]:group-hover:text-cyan-300 [@media(hover:hover)]:group-hover:border-cyan-400/60 font-medium text-sm transition-colors duration-200 items-center justify-center gap-2 mt-auto"
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
