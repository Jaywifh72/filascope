import React, { useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { 
  Star, 
  Check, 
  ArrowRight,
  Thermometer,
  Plus,
  Info,
  Package,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { getBrandLogo } from "@/lib/brandLogos";
import { useCompare } from "@/hooks/useCompare";
import { useRegion } from "@/contexts/RegionContext";
import { useRegionalPrice, type FilamentWithRegionalPrices } from "@/hooks/useRegionalPrice";
import { useCurrentPrice } from "@/hooks/useCurrentPrice";
import { cleanFilamentDisplayName } from "@/lib/productNameUtils";
import { calculateUnifiedScore, type FilamentForScoring, getScoreNumberColor, SCORE_EXPLANATION } from "@/lib/unifiedFilamentScore";
import { OptimizedImage } from "@/components/ui/optimized-image";
import { REGIONS } from "@/config/regions";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { generateFilamentSlug } from "@/lib/seoSlugUtils";
import { PriceFreshnessDot } from "@/components/price/PriceFreshnessDot";

interface Filament {
  id: string;
  product_title: string;
  product_handle?: string | null;
  color_family?: string | null;
  vendor?: string | null;
  material?: string | null;
  color_hex?: string | null;
  variant_price?: number | null;
  variant_compare_at_price?: number | null;
  net_weight_g?: number | null;
  pack_quantity?: number | null;
  ease_of_printing_score?: number | null;
  nozzle_temp_min_c?: number | null;
  nozzle_temp_max_c?: number | null;
  bed_temp_min_c?: number | null;
  bed_temp_max_c?: number | null;
  print_speed_max_mms?: number | null;
  featured_image?: string | null;
  variant_available?: boolean | null;
  product_line_id?: string | null;
  product_url?: string | null;
  product_url_ca?: string | null;
  product_url_uk?: string | null;
  product_url_eu?: string | null;
  product_url_au?: string | null;
  product_url_jp?: string | null;
  last_scraped_at?: string | null;
  price_cad?: number | null;
  price_gbp?: number | null;
  price_eur?: number | null;
  price_aud?: number | null;
  price_jpy?: number | null;
}


interface VariantIndicators {
  colors: string[];
  weights: number[];
  variantCount: number;
  priceRange?: { min: number | null; max: number | null };
  anyInStock?: boolean;
}

interface LabReadoutCardProps {
  filament: Filament;
  index?: number;
  displayTitle?: string;
  variantIndicators?: VariantIndicators;
}

export function LabReadoutCard({ 
  filament, 
  index = 0, 
  displayTitle, 
  variantIndicators 
}: LabReadoutCardProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [showTooltip, setShowTooltip] = useState(false);
  const [imageError, setImageError] = useState(false);
  const { currency: userCurrency, formatPrice, region } = useRegion();
  
  const isOutOfStock = variantIndicators && variantIndicators.variantCount > 1
    ? variantIndicators.anyInStock === false
    : filament.variant_available === false;

  const { 
    regionalPrice, 
    regionalUrl,
    fallbackUrl,
    isActualRegionalPrice,
    isUsingFallbackRegion,
    currency: priceCurrency,
    isLocalStore,
    priceSource,
    isRatesLoading,
  } = useRegionalPrice(filament as FilamentWithRegionalPrices);
  
  // Use priceSource for accurate conversion detection (matches FilamentCard behavior)
  const isConverted = priceSource === 'converted';
  
  const {
    currentPrice: livePrice,
    isLivePrice,
    weightGrams: liveWeightGrams,
  } = useCurrentPrice(regionalUrl || filament.product_url, regionalPrice, fallbackUrl);
  
  const { 
    addItem, 
    removeItem, 
    isInCompare, 
    isFull, 
    triggerGlow,
    isMultiSelectMode,
    addToPending,
    removeFromPending,
    isPending,
  } = useCompare();
  
  const isSelected = isInCompare(filament.id);
  const isPendingSelection = isPending(filament.id);
  const isCompareDisabled = isFull && !isSelected;

  const effectivePrice = isLivePrice && livePrice ? livePrice : regionalPrice;
  const effectiveWeightKg = liveWeightGrams ? liveWeightGrams / 1000 : (filament.net_weight_g ? filament.net_weight_g / 1000 : null);

  const packQty = filament.pack_quantity || 1;
  const pricePerKg = (effectivePrice && effectiveWeightKg)
    ? effectivePrice / (effectiveWeightKg * packQty)
    : null;
  const isValidPrice = pricePerKg && pricePerKg > 0 && pricePerKg < 500;

  // Calculate original price per kg for sale comparison
  const originalPrice = filament.variant_compare_at_price;
  const originalPricePerKg = (originalPrice && effectiveWeightKg)
    ? originalPrice / (effectiveWeightKg * packQty)
    : null;
  const isOnSale = originalPricePerKg && pricePerKg && originalPricePerKg > pricePerKg;
  const discountPercent = isOnSale 
    ? Math.round(((originalPricePerKg - pricePerKg) / originalPricePerKg) * 100)
    : 0;

  // Calculate unified score
  const { score: overallScore, factors: scoreFactors, confidence: scoreConfidence } = useMemo(() => 
    calculateUnifiedScore(filament as FilamentForScoring),
    [filament]
  );

  const getDisplayTitle = () => {
    if (displayTitle) return cleanFilamentDisplayName(displayTitle);
    let title = filament.product_title || "";
    const vendor = filament.vendor || "";
    if (vendor && title.toLowerCase().startsWith(vendor.toLowerCase())) {
      title = title.slice(vendor.length).trim();
    }
    title = title.replace(/^[:\-]\s*/, '');
    return cleanFilamentDisplayName(title);
  };

  const brandLogo = filament.vendor ? getBrandLogo(filament.vendor) : null;
  
  // Temp calculations
  const nozzleTemp = filament.nozzle_temp_min_c && filament.nozzle_temp_max_c
    ? `${filament.nozzle_temp_min_c}–${filament.nozzle_temp_max_c}°C`
    : filament.nozzle_temp_min_c 
      ? `${filament.nozzle_temp_min_c}°C`
      : filament.nozzle_temp_max_c
        ? `${filament.nozzle_temp_max_c}°C`
        : "—";
  
  const volumetricFlow = filament.print_speed_max_mms 
    ? `${filament.print_speed_max_mms} mm/s`
    : "—";

  const handleCompareToggle = () => {
    if (isMultiSelectMode) {
      if (isPendingSelection) {
        removeFromPending(filament.id);
      } else if (isSelected) {
        removeItem(filament.id);
      } else {
        addToPending({
          id: filament.id,
          product_title: filament.product_title,
          vendor: filament.vendor || null,
          material: filament.material || null,
          color_hex: filament.color_hex || null,
          variant_price: filament.variant_price || null,
          net_weight_g: filament.net_weight_g || null,
          featured_image: filament.featured_image,
        });
      }
      return;
    }

    if (isSelected) {
      removeItem(filament.id);
    } else if (!isFull) {
      addItem({
        id: filament.id,
        product_title: filament.product_title,
        vendor: filament.vendor || null,
        material: filament.material || null,
        color_hex: filament.color_hex || null,
        variant_price: filament.variant_price || null,
        net_weight_g: filament.net_weight_g || null,
        featured_image: filament.featured_image,
      });
      triggerGlow();
    }
  };

  // Star rating (out of 5 stars based on 10-point score)
  const starCount = overallScore ? Math.round((overallScore / 10) * 5) : 0;

  return (
    <div
      role="article"
      aria-label={`${filament.vendor || 'Unknown'} ${filament.product_title} filament card`}
      className={cn(
        "group relative rounded-2xl overflow-hidden",
        "border border-gray-700",
        // Faster transition (150ms) with enhanced hover effects
        "transition-all duration-150 ease-out",
        "hover:scale-[1.02] hover:shadow-xl hover:shadow-primary/15 hover:border-primary/60",
        "focus-within:ring-2 focus-within:ring-primary focus-within:ring-offset-2 focus-within:ring-offset-background",
        isSelected && "border-2 border-primary bg-primary/5",
        isPendingSelection && "border-2 border-primary/60 bg-primary/5",
        isOutOfStock && "opacity-70"
      )}
      style={{
        // Animation respects prefers-reduced-motion via CSS media query
        // Cap animation delay to first 12 cards to avoid long waits
        animation: `card-enter 0.4s cubic-bezier(0.4, 0, 0.2, 1) ${Math.min(index, 12) * 0.05}s both`,
        background: "rgba(10, 12, 16, 0.6)",
        backdropFilter: "blur(12px)",
        WebkitBackdropFilter: "blur(12px)",
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => {
        setIsHovered(false);
        setShowTooltip(false);
      }}
    >

      {/* Out of Stock Overlay */}
      {isOutOfStock && (
        <div className="absolute inset-0 bg-black/50 flex items-center justify-center z-10 pointer-events-none rounded-2xl">
          <span className="text-xs font-semibold uppercase tracking-wider text-white/80 bg-black/70 px-3 py-1.5 rounded">
            Out of Stock
          </span>
        </div>
      )}

      {/* Sale Badge - Top Left */}
      {isOnSale && discountPercent > 0 && (
        <div className="absolute top-3 left-3 z-10">
          <span className="inline-flex items-center px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider bg-green-500/20 border border-green-500/30 text-green-400 rounded">
            -{discountPercent}%
          </span>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════
          HEADER: Dark header area with brand logo
          ═══════════════════════════════════════════════════════════════ */}
      <div className="relative bg-[#14171C] px-4 pt-4 pb-4 h-[72px]">
        {/* Compare Button - Persistent with enhanced visibility */}
        <div 
          className="absolute top-3 right-3 z-10"
          onMouseEnter={() => setShowTooltip(true)}
          onMouseLeave={() => setShowTooltip(false)}
        >
          <button
            onClick={handleCompareToggle}
            disabled={isCompareDisabled}
            aria-label={`Add ${filament.product_title} to comparison`}
            aria-checked={isSelected}
            role="checkbox"
            className={cn(
              "rounded-full flex items-center justify-center cursor-pointer",
              "transition-all duration-200 ease-out",
              // Selected state - always visible with glow
              isSelected || isPendingSelection
                ? "w-6 h-6 bg-primary border-2 border-primary shadow-[0_0_12px_rgba(0,207,232,0.5)]"
                : cn(
                    // Default state - subtle but visible
                    "w-5 h-5 bg-gray-800/60 border border-gray-600/60 opacity-50",
                    // Hover state - prominent
                    "group-hover:w-6 group-hover:h-6 group-hover:opacity-100",
                    "group-hover:border-primary/60 group-hover:bg-primary/20",
                    "hover:!opacity-100 hover:!scale-110 hover:!border-primary hover:!bg-primary/30"
                  ),
              isCompareDisabled && "opacity-30 cursor-not-allowed"
            )}
          >
            {isSelected || isPendingSelection ? (
              <Check className="w-3.5 h-3.5 text-white animate-check-draw" strokeWidth={3} />
            ) : (
              <Plus className={cn(
                "text-gray-400 transition-all duration-200",
                "w-3 h-3 group-hover:w-3.5 group-hover:h-3.5 group-hover:text-primary"
              )} />
            )}
          </button>
          
          {/* Tooltip */}
          {showTooltip && !isSelected && !isCompareDisabled && (
            <div className="absolute top-full right-0 mt-1.5 px-2 py-1 bg-slate-800 text-white text-[10px] rounded whitespace-nowrap z-20 shadow-lg border border-gray-700">
              Add to Compare
            </div>
          )}
        </div>

        <div className="flex items-center justify-center gap-3 h-full">
          {/* Center: Brand Logo - Using OptimizedImage */}
          <div className="h-full flex items-center justify-center">
            <div className="h-[90%] flex items-center justify-center">
              {filament.vendor && getBrandLogo(filament.vendor) ? (
                <OptimizedImage 
                  src={getBrandLogo(filament.vendor)} 
                  alt={filament.vendor}
                  className="h-full w-auto max-w-[200px] opacity-70"
                  objectFit="contain"
                  width={200}
                  height={48}
                  priority
                />
              ) : null}
              <span className={cn(
                "text-[10px] text-muted-foreground uppercase tracking-wider",
                filament.vendor && getBrandLogo(filament.vendor) ? "hidden" : ""
              )}>
                {filament.vendor || "Unknown"}
              </span>
            </div>
          </div>
        </div>
        
        {/* Subtle bottom border instead of scan line */}
        <div className="absolute bottom-0 left-0 right-0 h-px bg-white/10" />
      </div>

      {/* ═══════════════════════════════════════════════════════════════
          PRODUCT IMAGE SECTION - Always shows with fallback for missing images
          ═══════════════════════════════════════════════════════════════ */}
      <div className="relative h-32 bg-gradient-to-b from-black/20 to-black/40 border-b border-gray-700/50 flex items-center justify-center overflow-hidden">
        {filament.featured_image && !imageError ? (
          <OptimizedImage
            src={filament.featured_image}
            alt={getDisplayTitle()}
            className="h-full w-full"
            objectFit="contain"
            width={200}
            height={128}
            onError={() => setImageError(true)}
            fallback={
              <div className="flex flex-col items-center justify-center gap-2 text-muted-foreground">
                <Package className="w-8 h-8 opacity-40" />
                <span className="text-[10px] uppercase tracking-wider opacity-60">No Image</span>
              </div>
            }
          />
        ) : (
          /* Fallback placeholder when no image or error */
          <div className="flex flex-col items-center justify-center gap-2 text-muted-foreground">
            {/* Color swatch as main visual when no image */}
            {filament.color_hex ? (
              <div 
                className="w-16 h-16 rounded-xl shadow-lg border border-white/10"
                style={{ backgroundColor: filament.color_hex }}
              />
            ) : (
              <Package className="w-10 h-10 opacity-30" />
            )}
            <span className="text-[10px] uppercase tracking-wider opacity-50">
              {filament.material || 'Filament'}
            </span>
          </div>
        )}
        
        {/* Color swatch overlay - bottom right (only when image is shown) */}
        {filament.featured_image && !imageError && filament.color_hex && (
          <div 
            className="absolute bottom-2 right-2 w-6 h-6 rounded-full border-2 border-white/40 shadow-md ring-1 ring-black/20"
            style={{ backgroundColor: filament.color_hex }}
            title={`Color: ${filament.color_hex}`}
          />
        )}
        
        {/* Subtle gradient overlay for better text contrast below */}
        <div className="absolute inset-x-0 bottom-0 h-8 bg-gradient-to-t from-black/60 to-transparent pointer-events-none" />
      </div>

      {/* ═══════════════════════════════════════════════════════════════
          BODY: Material Name, Badge, Price, Temp
          ═══════════════════════════════════════════════════════════════ */}
      <div className="px-4 py-4 bg-black/20">
        {/* Material Name */}
        <h3 className="text-lg font-semibold text-foreground truncate leading-tight mb-3">
          {getDisplayTitle()}
        </h3>
        
        {/* Material Badge + Price Row */}
        <div className="flex items-center justify-between mb-3">
          {/* Material Type Badge */}
          {filament.material && (
            <span className="inline-flex items-center px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider bg-violet-500/15 border border-violet-500/30 text-violet-400 rounded">
              {filament.material}
            </span>
          )}
          
          {/* Price Display - Enhanced with "From $X at [Retailer]" */}
          <div className="text-right flex-shrink-0">
            {isValidPrice && pricePerKg ? (
              <div className="flex flex-col items-end">
                {/* Original price with strikethrough if on sale */}
                {isOnSale && originalPricePerKg && (
                  <span className="text-xs text-gray-500 line-through">
                    {formatPrice(originalPricePerKg)}/kg
                  </span>
                )}
                {/* Current/Sale price with "From" prefix and tilde for converted */}
                <div className="flex items-baseline gap-1">
                  <span className="text-xs text-muted-foreground">From</span>
                  <span className={cn(
                    "text-xl font-bold",
                    isOnSale ? "text-green-400" : "text-foreground"
                  )}>
                    {formatPrice(pricePerKg, { showApproximate: isConverted })}
                  </span>
                  <span className="text-sm text-muted-foreground">
                    /kg
                  </span>
                </div>
                {/* Retailer hint + Regional indicator */}
                <div className="flex items-center gap-1.5">
                  {/* Regional flag indicator */}
                  {REGIONS[region] && (
                    <span className="text-sm">{REGIONS[region].flag}</span>
                  )}
                  {filament.vendor && (
                    <span className="text-[10px] text-muted-foreground">
                      at {filament.vendor}
                    </span>
                  )}
                  {/* Conversion indicator */}
                  {isConverted && (
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <button className="text-muted-foreground hover:text-foreground transition-colors">
                          <Info className="w-3 h-3" />
                        </button>
                      </TooltipTrigger>
                      <TooltipContent side="top" className="text-xs max-w-[200px]">
                        <p className="font-medium">Converted Price</p>
                        <p className="text-muted-foreground">
                          Price converted from {priceCurrency || 'USD'} to {userCurrency}
                        </p>
                      </TooltipContent>
                    </Tooltip>
                  )}
                  {/* Local badge - use isLocalStore from hook */}
                  {isLocalStore && (
                    <span className="inline-flex items-center px-1.5 py-0.5 text-[9px] font-medium bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded">
                      Local
                    </span>
                  )}
                  <span className="text-[10px] text-primary hover:text-primary/80 cursor-pointer">
                    Compare →
                  </span>
                </div>
                {/* Price freshness indicator */}
                <PriceFreshnessDot lastScrapedAt={filament.last_scraped_at} />
              </div>
            ) : (
              <span className="text-sm text-muted-foreground">
                —
              </span>
            )}
          </div>
        </div>
        
        {/* Nozzle Temp */}
        <div className="space-y-1">
          <div className="flex items-center gap-1.5">
            <Thermometer className="w-3 h-3 text-primary" />
            <span className="text-xs uppercase tracking-wider text-muted-foreground font-medium">
              Nozzle Temp
            </span>
          </div>
          <span className="text-sm font-semibold text-foreground block">
            {nozzleTemp}
          </span>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════════
          FOOTER: Rating + View Details Button
          ═══════════════════════════════════════════════════════════════ */}
      <div className="px-4 py-3 border-t border-white/[0.05]">
        {/* Star Rating - Enhanced brightness and contrast */}
        <div className="flex items-center gap-1 mb-3">
          {[...Array(5)].map((_, i) => (
            <Star 
              key={i}
              className={cn(
                "w-4 h-4",
                i < starCount 
                  ? "fill-[#FFB800] text-[#FFB800] drop-shadow-[0_0_4px_rgba(255,184,0,0.6)]" 
                  : "fill-transparent text-gray-600"
              )}
            />
          ))}
          {overallScore && (
            <span className="ml-1.5 text-sm font-medium text-amber-400/90">
              {overallScore.toFixed(1)}
            </span>
          )}
        </div>

        {/* View Details Button - Full width, solid bg-primary */}
        <Link
          to={`/filament/${filament.product_handle || generateFilamentSlug(filament.vendor, filament.material, filament.product_title, filament.color_family) || filament.id}`}
          className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-semibold text-primary-foreground bg-primary hover:bg-primary/90 rounded-lg transition-all duration-150"
        >
          <span>View Details</span>
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    </div>
  );
}

export default LabReadoutCard;
