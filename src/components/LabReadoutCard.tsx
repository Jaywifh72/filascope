import React, { useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { 
  Star, 
  Check, 
  ArrowRight,
  Thermometer,
  Droplets
} from "lucide-react";
import { cn } from "@/lib/utils";
import { getBrandLogo } from "@/lib/brandLogos";
import { useCompare } from "@/hooks/useCompare";
import { useCurrency } from "@/hooks/useCurrency";
import { useRegionalPrice, type FilamentWithRegionalPrices } from "@/hooks/useRegionalPrice";
import { useCurrentPrice } from "@/hooks/useCurrentPrice";
import { cleanFilamentDisplayName } from "@/lib/productNameUtils";
import { calculateEaseBreakdown, type FilamentDataForScoring } from "@/lib/scoreCalculation";

interface Filament {
  id: string;
  product_title: string;
  vendor?: string | null;
  material?: string | null;
  color_hex?: string | null;
  variant_price?: number | null;
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
  const { formatRegionalPrice, currency: userCurrency } = useCurrency();
  
  const isOutOfStock = variantIndicators && variantIndicators.variantCount > 1
    ? variantIndicators.anyInStock === false
    : filament.variant_available === false;

  const { 
    regionalPrice, 
    regionalUrl,
    fallbackUrl 
  } = useRegionalPrice(filament as FilamentWithRegionalPrices);
  
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

  // Dynamic score calculation
  const dynamicScore = useMemo(() => {
    const breakdown = calculateEaseBreakdown(filament as FilamentDataForScoring);
    return breakdown.score;
  }, [filament]);
  
  const overallScore = filament.ease_of_printing_score ?? dynamicScore ?? null;

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
        "group relative rounded-3xl transition-all duration-300 overflow-hidden",
        "border border-white/10",
        "focus-within:ring-2 focus-within:ring-primary focus-within:ring-offset-2 focus-within:ring-offset-background",
        isHovered && !isOutOfStock && "border-[#00CFE8]/60 shadow-[0_0_30px_rgba(0,207,232,0.3)]",
        isSelected && "border-2 border-primary bg-primary/5",
        isPendingSelection && "border-2 border-primary/60 bg-primary/5",
        isOutOfStock && "opacity-70"
      )}
      style={{
        animation: `card-enter 0.4s cubic-bezier(0.4, 0, 0.2, 1) ${index * 0.08}s both`,
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
        <div className="absolute inset-0 bg-black/50 flex items-center justify-center z-10 pointer-events-none rounded-3xl">
          <span className="text-xs font-mono uppercase tracking-wider text-white/80 bg-black/70 px-3 py-1.5 rounded">
            Out of Stock
          </span>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════
          HEADER: Dark header area with material name + price
          ═══════════════════════════════════════════════════════════════ */}
      <div className="relative bg-[#14171C] px-4 pt-4 pb-4">
        {/* Checkbox positioned in header */}
        <div 
          className="absolute top-3 left-3 z-10"
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
              "w-5 h-5 rounded border-2 flex items-center justify-center transition-all duration-200 cursor-pointer",
              isSelected || isPendingSelection
                ? "bg-primary border-primary"
                : "bg-black/40 border-white/30 hover:border-primary hover:bg-primary/10",
              isCompareDisabled && "opacity-50 cursor-not-allowed"
            )}
          >
            {(isSelected || isPendingSelection) && (
              <Check className="w-3 h-3 text-background" strokeWidth={3} />
            )}
          </button>
          
          {showTooltip && !isSelected && !isCompareDisabled && (
            <div className="absolute top-full left-0 mt-1.5 px-2 py-1 bg-slate-800 text-white text-[10px] rounded whitespace-nowrap z-20">
              Add to compare
            </div>
          )}
        </div>

        <div className="flex items-start justify-between gap-3 pl-7">
          {/* Left: Brand + Name */}
          <div className="flex-1 min-w-0">
            {/* Brand */}
            <div className="mb-1.5">
              <span className="text-[10px] text-muted-foreground uppercase tracking-wider">
                {filament.vendor || "Unknown"}
              </span>
            </div>
            
            {/* Material Name */}
            <h3 className="text-sm font-semibold text-foreground truncate leading-tight">
              {getDisplayTitle()}
            </h3>
          </div>

        </div>
        
        {/* Cyan Scan Line at bottom of header */}
        <div 
          className={cn(
            "absolute bottom-0 left-0 right-0 h-[2px] transition-all duration-300",
            isHovered && !isOutOfStock 
              ? "bg-[#00CFE8] shadow-[0_0_12px_#00CFE8,0_0_24px_rgba(0,207,232,0.5)]" 
              : "bg-[#00CFE8]/30"
          )}
          style={{
            animation: isHovered && !isOutOfStock ? 'scanPulse 1.5s ease-in-out infinite' : 'none',
          }}
        />
      </div>

      {/* ═══════════════════════════════════════════════════════════════
          BODY: 2-Column Technical Grid - Nozzle Temp & Flow Rate
          ═══════════════════════════════════════════════════════════════ */}
      <div className="px-4 py-4 bg-black/20">
        {/* Material Badge + Price Row */}
        <div className="flex items-center justify-between mb-3">
          {/* Material Type Badge */}
          {filament.material && (
            <span className="inline-flex items-center px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider bg-violet-500/15 border border-violet-500/30 text-violet-400 rounded">
              {filament.material}
            </span>
          )}
          
          {/* Price */}
          <div className="text-right flex-shrink-0">
            {isValidPrice && pricePerKg ? (
              <div className="flex items-baseline gap-1">
                <span className="text-xl font-bold text-foreground font-mono">
                  {formatRegionalPrice(pricePerKg, false, userCurrency)}
                </span>
                <span className="text-[10px] text-muted-foreground font-mono">
                  /kg
                </span>
              </div>
            ) : (
              <span className="text-sm text-muted-foreground font-mono">
                —
              </span>
            )}
          </div>
        </div>
        
        <div className="grid grid-cols-2 gap-3">
          {/* Nozzle Temp */}
          <div className="space-y-1">
            <div className="flex items-center gap-1.5">
              <Thermometer className="w-3 h-3 text-[#00CFE8]" />
              <span className="text-[9px] uppercase tracking-wider text-muted-foreground font-medium">
                Nozzle Temp
              </span>
            </div>
            <span className="font-mono text-base font-bold text-foreground block">
              {nozzleTemp}
            </span>
          </div>

          {/* Flow Rate */}
          <div className="space-y-1">
            <div className="flex items-center gap-1.5">
              <Droplets className="w-3 h-3 text-[#00CFE8]" />
              <span className="text-[9px] uppercase tracking-wider text-muted-foreground font-medium">
                Flow Rate
              </span>
            </div>
            <span className="font-mono text-base font-bold text-foreground block">
              {volumetricFlow}
            </span>
          </div>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════════
          FOOTER: Rating + View Details CTA
          ═══════════════════════════════════════════════════════════════ */}
      <div className="px-4 py-3 flex items-center justify-between border-t border-white/[0.05]">
        {/* Star Rating */}
        <div className="flex items-center gap-1">
          {[...Array(5)].map((_, i) => (
            <Star 
              key={i}
              className={cn(
                "w-3 h-3",
                i < starCount 
                  ? "fill-amber-400 text-amber-400" 
                  : "fill-transparent text-white/20"
              )}
            />
          ))}
          {overallScore && (
            <span className="ml-1 text-[10px] font-mono text-muted-foreground">
              {overallScore.toFixed(1)}
            </span>
          )}
        </div>

        {/* View Details Link */}
        <Link
          to={`/filament/${filament.id}`}
          className="inline-flex items-center gap-1 text-xs font-medium text-[#00CFE8] hover:text-[#00CFE8]/80 transition-colors group/link"
        >
          <span>Details</span>
          <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover/link:translate-x-0.5" />
        </Link>
      </div>
      
      {/* Scan pulse animation keyframes */}
      <style>{`
        @keyframes scanPulse {
          0%, 100% { opacity: 1; box-shadow: 0 0 12px #00CFE8, 0 0 24px rgba(0,207,232,0.5); }
          50% { opacity: 0.7; box-shadow: 0 0 6px #00CFE8, 0 0 12px rgba(0,207,232,0.3); }
        }
      `}</style>
    </div>
  );
}

export default LabReadoutCard;
