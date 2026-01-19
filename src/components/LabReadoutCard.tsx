import React, { useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { 
  Star, 
  Check, 
  ArrowRight,
  Thermometer,
  Wind
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
  const idealTemp = filament.nozzle_temp_min_c && filament.nozzle_temp_max_c
    ? `${Math.round((filament.nozzle_temp_min_c + filament.nozzle_temp_max_c) / 2)}°C`
    : filament.nozzle_temp_min_c 
      ? `${filament.nozzle_temp_min_c}°C`
      : filament.nozzle_temp_max_c
        ? `${filament.nozzle_temp_max_c}°C`
        : "—";
  
  const volumetricFlow = filament.print_speed_max_mms 
    ? `${filament.print_speed_max_mms} mm³/s`
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
        "group relative rounded-2xl transition-all duration-300 overflow-hidden",
        "border border-white/10",
        "focus-within:ring-2 focus-within:ring-primary focus-within:ring-offset-2 focus-within:ring-offset-background",
        isHovered && !isOutOfStock && "border-[#00CFE8]/60 shadow-[0_0_30px_rgba(0,207,232,0.25)]",
        isSelected && "border-2 border-primary bg-primary/5",
        isPendingSelection && "border-2 border-primary/60 bg-primary/5",
        isOutOfStock && "opacity-70"
      )}
      style={{
        animation: `card-enter 0.4s cubic-bezier(0.4, 0, 0.2, 1) ${index * 0.08}s both`,
        background: "rgba(10, 12, 16, 0.85)",
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
          <span className="text-xs font-mono uppercase tracking-wider text-white/80 bg-black/70 px-3 py-1.5 rounded">
            Out of Stock
          </span>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════
          HEADER: Dark header with Stars, Material, Price
          ═══════════════════════════════════════════════════════════════ */}
      <div className="relative bg-[#14171C] px-4 py-3">
        {/* Scanning Line Animation on Hover */}
        <div 
          className={cn(
            "absolute inset-0 pointer-events-none overflow-hidden",
            isHovered && !isOutOfStock ? "opacity-100" : "opacity-0"
          )}
        >
          <div 
            className="absolute left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-[#00CFE8] to-transparent"
            style={{
              animation: isHovered && !isOutOfStock ? 'headerScan 2s ease-in-out infinite' : 'none',
              boxShadow: '0 0 15px 3px rgba(0, 207, 232, 0.5)',
            }}
          />
        </div>
        
        {/* Header Content Row */}
        <div className="relative flex items-center justify-between gap-2">
          {/* Left: Star Rating */}
          <div className="flex items-center gap-0.5">
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
          </div>
          
          {/* Center: Material Badge */}
          {filament.material && (
            <span className="inline-flex items-center px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider bg-violet-500/20 border border-violet-500/40 text-violet-300 rounded-md">
              {filament.material}
            </span>
          )}
          
          {/* Right: Price */}
          <div className="text-right flex-shrink-0">
            {isValidPrice && pricePerKg ? (
              <span className="text-lg font-black text-foreground font-mono tracking-tight">
                {formatRegionalPrice(pricePerKg, false, userCurrency)}
              </span>
            ) : (
              <span className="text-sm text-muted-foreground font-mono">—</span>
            )}
          </div>
        </div>
        
        {/* Bottom Glow Line */}
        <div 
          className={cn(
            "absolute bottom-0 left-0 right-0 h-px transition-all duration-300",
            isHovered && !isOutOfStock 
              ? "bg-[#00CFE8]/80" 
              : "bg-white/10"
          )}
        />
      </div>

      {/* ═══════════════════════════════════════════════════════════════
          MANUFACTURER MARK: Circular Brand Logo (Top Right of Body)
          ═══════════════════════════════════════════════════════════════ */}
      <div className="absolute top-[60px] right-4 z-10">
        <div 
          className={cn(
            "w-12 h-12 rounded-full border-2 overflow-hidden flex items-center justify-center transition-all duration-300",
            isHovered 
              ? "border-[#00CFE8]/60 bg-white/10" 
              : "border-white/20 bg-black/40"
          )}
        >
          {brandLogo ? (
            <img 
              src={brandLogo} 
              alt={filament.vendor || "Brand"}
              className={cn(
                "w-8 h-8 object-contain transition-all duration-300",
                isHovered ? "opacity-100 grayscale-0" : "opacity-50 grayscale"
              )}
              onError={(e) => {
                e.currentTarget.style.display = 'none';
              }}
            />
          ) : (
            <span className="text-[8px] font-bold text-muted-foreground uppercase">
              {(filament.vendor || "?").slice(0, 2)}
            </span>
          )}
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════════
          BODY: Material Name + 2-Column Specs Grid
          ═══════════════════════════════════════════════════════════════ */}
      <div className="px-4 pt-4 pb-3">
        {/* Checkbox */}
        <div 
          className="absolute top-[68px] left-4 z-10"
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
                : "bg-black/60 border-white/30 hover:border-primary hover:bg-primary/10",
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
        
        {/* Material Name */}
        <h3 className="text-sm font-semibold text-foreground truncate leading-tight mb-4 pr-14">
          {getDisplayTitle()}
        </h3>
        
        {/* 2-Column Specs Grid */}
        <div className="grid grid-cols-2 gap-3 mb-3">
          {/* Ideal Temp */}
          <div className="p-3 rounded-lg bg-white/[0.03] border border-white/5">
            <div className="flex items-center gap-1.5 mb-1">
              <Thermometer className="w-3 h-3 text-[#00CFE8]" />
              <span className="text-[9px] uppercase tracking-[0.15em] text-muted-foreground font-medium">
                Ideal Temp
              </span>
            </div>
            <span className="font-mono text-base font-bold text-foreground block">
              {idealTemp}
            </span>
          </div>
          
          {/* Volumetric Flow */}
          <div className="p-3 rounded-lg bg-white/[0.03] border border-white/5">
            <div className="flex items-center gap-1.5 mb-1">
              <Wind className="w-3 h-3 text-[#00CFE8]" />
              <span className="text-[9px] uppercase tracking-[0.15em] text-muted-foreground font-medium">
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
          FOOTER: View Details CTA
          ═══════════════════════════════════════════════════════════════ */}
      <div className="px-4 py-3 flex items-center justify-between border-t border-white/[0.05]">
        {/* Score Display */}
        {overallScore && (
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] uppercase tracking-wider text-muted-foreground">Score</span>
            <span className="font-mono text-sm font-bold text-[#00CFE8]">
              {overallScore.toFixed(1)}
            </span>
          </div>
        )}
        
        {!overallScore && <div />}

        {/* View Details Link */}
        <Link
          to={`/filament/${filament.id}`}
          className="inline-flex items-center gap-1 text-xs font-medium text-[#00CFE8] hover:text-[#00CFE8]/80 transition-colors group/link"
        >
          <span>Details</span>
          <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover/link:translate-x-0.5" />
        </Link>
      </div>
      
      {/* Animation keyframes */}
      <style>{`
        @keyframes headerScan {
          0% { top: 0%; opacity: 0; }
          10% { opacity: 1; }
          90% { opacity: 1; }
          100% { top: 100%; opacity: 0; }
        }
        @keyframes scanPulse {
          0%, 100% { opacity: 1; box-shadow: 0 0 12px #00CFE8, 0 0 24px rgba(0,207,232,0.5); }
          50% { opacity: 0.7; box-shadow: 0 0 6px #00CFE8, 0 0 12px rgba(0,207,232,0.3); }
        }
      `}</style>
    </div>
  );
}

export default LabReadoutCard;