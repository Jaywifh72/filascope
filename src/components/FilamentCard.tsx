import React, { useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { 
  Star, 
  Check, 
  ArrowRight,
  Shield,
  Zap,
  Layers,
  Info,
  DollarSign,
  CheckCircle,
  XCircle,
  Loader2,
  Plus,
  MapPin,
  Clock,
  ExternalLink,
  Lightbulb
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { HoverCard, HoverCardContent, HoverCardTrigger } from "@/components/ui/hover-card";
import { cn } from "@/lib/utils";
import { getBrandLogo } from "@/lib/brandLogos";
import { useCompare } from "@/hooks/useCompare";
import { useRegion } from "@/contexts/RegionContext";
import { useResolvedPrice } from "@/hooks/useResolvedPrice";
import { useRegionalPrice, type FilamentWithRegionalPrices } from "@/hooks/useRegionalPrice";
import { useFilamentVariantCounts } from "@/hooks/useFilamentVariantCounts";
import { cleanFilamentDisplayName } from "@/lib/productNameUtils";
import { calculateUnifiedScore, type FilamentForScoring, getScoreNumberColor, SCORE_EXPLANATION } from "@/lib/unifiedFilamentScore";
import { Tooltip as ScoreTooltip, TooltipContent as ScoreTooltipContent, TooltipTrigger as ScoreTooltipTrigger } from "@/components/ui/tooltip";
import { REGIONS } from "@/config/regions";
import { usePriceFreshness } from "@/hooks/usePriceFreshness";

// Material badge colors - using purple as specified
const MATERIAL_COLORS: Record<string, string> = {
  "PLA": "bg-violet-500/15 border-violet-500/30 text-violet-400",
  "PETG": "bg-violet-500/15 border-violet-500/30 text-violet-400",
  "ABS": "bg-violet-500/15 border-violet-500/30 text-violet-400",
  "ASA": "bg-violet-500/15 border-violet-500/30 text-violet-400",
  "TPU": "bg-violet-500/15 border-violet-500/30 text-violet-400",
  "Nylon": "bg-violet-500/15 border-violet-500/30 text-violet-400",
  "PC": "bg-violet-500/15 border-violet-500/30 text-violet-400",
  "PEEK": "bg-violet-500/15 border-violet-500/30 text-violet-400",
};

function getMaterialBadgeClass(material: string): string {
  const baseMaterial = material?.split(/[\s\-+]/)[0]?.toUpperCase() || "";
  return MATERIAL_COLORS[baseMaterial] || "bg-violet-500/15 border-violet-500/30 text-violet-400";
}

interface Filament {
  id: string;
  product_title: string;
  vendor?: string | null;
  material?: string | null;
  color_hex?: string | null;
  variant_price?: number | null;
  net_weight_g?: number | null;
  pack_quantity?: number | null;
  value_score?: number | null;
  ease_of_printing_score?: number | null;
  strength_index?: number | null;
  printability_index?: number | null;
  is_nozzle_abrasive?: boolean | null;
  high_speed_capable?: boolean | null;
  carbon_fiber_percentage?: number | null;
  glass_fiber_percentage?: number | null;
  wood_powder_percentage?: number | null;
  featured_image?: string | null;
  variant_available?: boolean | null;
  product_line_id?: string | null;
  // TDS specs for data completeness check
  nozzle_temp_min_c?: number | null;
  nozzle_temp_max_c?: number | null;
  bed_temp_min_c?: number | null;
  bed_temp_max_c?: number | null;
  tensile_strength_xy_mpa?: number | null;
  density_g_cm3?: number | null;
  // Regional pricing fields
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
  // Price freshness fields
  last_scraped_at?: string | null;
  price_confidence?: string | null;
  price_source?: string | null;
  // HueForge TD
  transmission_distance?: number | null;
}

// Variant indicator data for grouped products
interface VariantIndicators {
  colors: string[];       // Array of color hex values
  weights: number[];      // Array of weights in grams
  variantCount: number;   // Total number of variants
  priceRange?: { min: number | null; max: number | null };
  anyInStock?: boolean;   // True if ANY variant is in stock (for grouped products)
  colorStockStatus?: Record<string, boolean>; // Map of color hex -> inStock status
}

interface FilamentCardProps {
  filament: Filament;
  colorMatchPercent?: number | null;
  priceTrend?: number | null;
  index?: number;
  // For grouped product display
  displayTitle?: string;           // Override title for grouped products
  variantIndicators?: VariantIndicators;  // Show color swatches and weight options
  // Community rating (from bulk hook)
  communityRating?: { avgRating: number; reviewCount: number; avgQuality?: number | null; avgEase?: number | null; avgValue?: number | null } | null;
}

// Get the single most important standout feature
function getStandoutFeature(filament: Filament): { label: string; colorClass: string; icon: typeof Shield } | null {
  if (filament.is_nozzle_abrasive === false) {
    return { 
      label: "Brass Safe", 
      colorClass: "bg-emerald-500/15 border-emerald-500/30 text-emerald-400",
      icon: Shield 
    };
  }
  if (filament.high_speed_capable) {
    return { 
      label: "High Speed", 
      colorClass: "bg-blue-500/15 border-blue-500/30 text-blue-400",
      icon: Zap 
    };
  }
  if (filament.carbon_fiber_percentage && filament.carbon_fiber_percentage > 0) {
    return { 
      label: "Carbon Fiber", 
      colorClass: "bg-slate-500/15 border-slate-500/30 text-slate-400",
      icon: Layers 
    };
  }
  if (filament.glass_fiber_percentage && filament.glass_fiber_percentage > 0) {
    return { 
      label: "Glass Fiber", 
      colorClass: "bg-blue-500/15 border-blue-500/30 text-blue-400",
      icon: Layers 
    };
  }
  if (filament.wood_powder_percentage && filament.wood_powder_percentage > 0) {
    return { 
      label: "Wood Fill", 
      colorClass: "bg-amber-500/15 border-amber-500/30 text-amber-400",
      icon: Layers 
    };
  }
  return null;
}

export function FilamentCard({ filament, colorMatchPercent, index = 0, displayTitle, variantIndicators, communityRating }: FilamentCardProps) {
  // For grouped products (multiple variants), only show out of stock if ALL variants are out
  // For single products, use the individual filament's status
  const isOutOfStock = variantIndicators && variantIndicators.variantCount > 1
    ? variantIndicators.anyInStock === false  // All variants out of stock
    : filament.variant_available === false;   // Single filament check
  const [isHovered, setIsHovered] = useState(false);
  const [showTooltip, setShowTooltip] = useState(false);
  const [imageError, setImageError] = useState(false);
  const { currency: userCurrency, formatPrice, regionConfig } = useRegion();
  
  // Fetch all color variants from DB if not provided via variantIndicators
  // Pass product_line_id to ensure cards use same grouping logic as detail pages
  const fetchedVariants = useFilamentVariantCounts(
    filament.id,
    filament.product_title,
    filament.vendor || null,
    filament.product_line_id || null
  );
  
  // Use provided variantIndicators or fall back to fetched data
  const effectiveVariantIndicators = variantIndicators || {
    colors: fetchedVariants.colors,
    weights: [],
    variantCount: fetchedVariants.count,
  };
  
  // Use regional price hook only for URL resolution (not price)
  const { 
    regionalUrl,
    isLocalStore,
    isRatesLoading,
  } = useRegionalPrice(filament as FilamentWithRegionalPrices);
  
  // === UNIFIED PRICE RESOLUTION ===
  // Use the single source of truth for all price calculations
  const resolved = useResolvedPrice(filament);
  const isConvertedPrice = resolved.isConverted;
  
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

  // === PRICE VALUES FROM UNIFIED RESOLVER ===
  const pricePerKg = resolved.pricePerKg;
  // Scale the validity threshold for non-decimal currencies
  const maxValid = userCurrency === 'JPY' || userCurrency === 'KRW' ? 100000 : 500;
  const isValidPrice = pricePerKg && pricePerKg > 0 && pricePerKg < maxValid;

  // For grouped products, show price range if available
  const hasMultipleVariants = effectiveVariantIndicators.variantCount > 1;
  const hasPriceRange = hasMultipleVariants && 
    variantIndicators?.priceRange?.min !== null && 
    variantIndicators?.priceRange?.max !== null &&
    variantIndicators?.priceRange?.min !== variantIndicators?.priceRange?.max;

  // Price freshness - determine confidence level
  const { confidence: priceConfidence, timeAgo, isStale } = usePriceFreshness(
    filament.last_scraped_at
  );
  
  // Determine if we should show the actual price or "Check price"
  const shouldShowPrice = !isStale && isValidPrice && pricePerKg;
  const isHighConfidence = priceConfidence === 'high' || priceConfidence === 'medium';

  // Calculate unified score with factors breakdown
  const { score: overallScore, factors: scoreFactors, confidence: scoreConfidence, dataPointCount, label: scoreLabel } = useMemo(() => 
    calculateUnifiedScore(filament as FilamentForScoring),
    [filament]
  );
  
  // Check for limited data - count available data points
  // Requires at least: price + (one score OR two TDS specs)
  const hasPrice = filament.variant_price !== null && filament.variant_price !== undefined;
  const hasTempSpecs = (filament.nozzle_temp_min_c || filament.nozzle_temp_max_c) && 
                       (filament.bed_temp_min_c || filament.bed_temp_max_c);
  const hasStrengthData = filament.tensile_strength_xy_mpa || filament.density_g_cm3;
  const hasAnyScore = filament.ease_of_printing_score || filament.strength_index || filament.printability_index;
  const hasMaterial = filament.material !== null && filament.material !== undefined;
  
  // Not limited if: has price AND (has any score OR has temp specs OR has strength data OR has material)
  const hasLimitedData = !hasPrice || (!hasAnyScore && !hasTempSpecs && !hasStrengthData && !hasMaterial);

  // Budget-friendly threshold
  const isBudgetFriendly = pricePerKg && pricePerKg < 20;

  // Display title - use override for grouped products or strip vendor and size/weight from product title
  const getDisplayTitle = () => {
    if (displayTitle) return cleanFilamentDisplayName(displayTitle);
    let title = filament.product_title || "";
    const vendor = filament.vendor || "";
    if (vendor && title.toLowerCase().startsWith(vendor.toLowerCase())) {
      title = title.slice(vendor.length).trim();
    }
    // Strip leading colon/dash if present after vendor removal
    title = title.replace(/^[:\-]\s*/, '');
    return cleanFilamentDisplayName(title);
  };

  const brandLogo = filament.vendor ? getBrandLogo(filament.vendor) : null;
  const standoutFeature = getStandoutFeature(filament);
  
  // Handle compare toggle
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

  return (
    <div
      role="article"
      aria-label={`${filament.vendor || 'Unknown'} ${filament.product_title} filament card`}
      className={cn(
        "group relative rounded-2xl transition-all duration-200 min-h-[340px]",
        "bg-white/[0.03] border border-gray-700",
        "hover:scale-[1.02] hover:shadow-lg hover:shadow-primary/10 hover:border-primary/50",
        "focus-within:ring-2 focus-within:ring-primary focus-within:ring-offset-2 focus-within:ring-offset-background",
        isSelected && "border-2 border-primary bg-primary/5",
        isPendingSelection && "border-2 border-primary/60 bg-primary/5",
        isOutOfStock && "opacity-70"
      )}
      style={{
        animation: `card-enter 0.4s cubic-bezier(0.4, 0, 0.2, 1) ${index * 0.1}s both`
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => {
        setIsHovered(false);
        setShowTooltip(false);
      }}
    >
      {/* Out of Stock Overlay */}
      {isOutOfStock && (
        <div className="absolute inset-0 bg-black/40 rounded-2xl flex items-center justify-center z-[5] pointer-events-none">
          <span className="text-sm font-semibold text-white/80 bg-black/60 px-4 py-2 rounded-lg">
            Out of Stock
          </span>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════
          CHECKBOX (Top-Right - Persistent with enhanced visibility)
          ═══════════════════════════════════════════════════════════════ */}
      <div 
        className="absolute top-4 right-4 z-10"
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
              ? "w-6 h-6 bg-primary border-2 border-primary shadow-[0_0_12px_rgba(0,207,232,0.4)]"
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
            <Check className="w-3.5 h-3.5 text-primary-foreground animate-check-draw" strokeWidth={3} />
          ) : (
            <Plus className={cn(
              "text-gray-400 transition-all duration-200",
              "w-3 h-3 group-hover:w-3.5 group-hover:h-3.5 group-hover:text-primary"
            )} />
          )}
        </button>
        
        {/* Tooltip */}
        {showTooltip && !isSelected && !isCompareDisabled && (
          <div className="absolute top-full right-0 mt-2 px-2.5 py-1.5 bg-slate-800 text-white text-xs rounded-md whitespace-nowrap z-20 border border-gray-700">
            Add to Compare
          </div>
        )}
      </div>

      {/* ═══════════════════════════════════════════════════════════════
          ELEMENT 1: Brand + Product Name
          ═══════════════════════════════════════════════════════════════ */}
      <div className="px-6 pt-6 pb-3 border-b border-white/[0.05]" data-card-element="1">
        {/* Brand + Vendor Name - centered */}
        <div className="flex items-center justify-center gap-2 mb-2">
          {brandLogo && !imageError ? (
            <img 
              src={brandLogo} 
              alt={`${filament.vendor} logo`}
              className="w-5 h-5 rounded object-contain"
              onError={() => setImageError(true)}
            />
          ) : null}
          <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            {filament.vendor || "Unknown"}
          </span>
        </div>
        
        {/* Color swatches - centered below brand/vendor with hover stock info */}
        <div className="flex items-center justify-center gap-1 mb-2">
          {hasMultipleVariants && effectiveVariantIndicators.colors.length > 0 ? (
            <HoverCard openDelay={200} closeDelay={100}>
              <HoverCardTrigger asChild>
                <div className="flex items-center gap-1 cursor-pointer" role="group" aria-label="Color variants">
                  {effectiveVariantIndicators.colors.slice(0, 6).map((hex, i) => {
                    const isColorInStock = variantIndicators?.colorStockStatus?.[hex] !== false;
                    return (
                      <div 
                        key={i}
                        className={cn(
                          "w-3.5 h-3.5 rounded-full border shadow-sm transition-opacity",
                          isColorInStock ? "border-white/20" : "border-white/10 opacity-50"
                        )}
                        style={{ backgroundColor: hex }}
                        role="img"
                        aria-label={`Color swatch ${hex}${isColorInStock ? '' : ', out of stock'}`}
                      />
                    );
                  })}
                  {effectiveVariantIndicators.colors.length > 6 && (
                    <span className="text-[10px] text-slate-400 ml-1">+{effectiveVariantIndicators.colors.length - 6}</span>
                  )}
                </div>
              </HoverCardTrigger>
              <HoverCardContent 
                side="bottom" 
                align="start" 
                className="w-64 p-3 bg-slate-900/95 border-white/10"
              >
                <div className="space-y-2">
                  <div className="text-xs font-semibold text-white/90 mb-2">Color Availability</div>
                  <div className="grid grid-cols-2 gap-1.5 max-h-48 overflow-y-auto">
                    {effectiveVariantIndicators.colors.map((hex, i) => {
                      const isColorInStock = variantIndicators?.colorStockStatus?.[hex] !== false;
                      return (
                        <div 
                          key={i}
                          className={cn(
                            "flex items-center gap-2 px-2 py-1 rounded text-[11px]",
                            isColorInStock 
                              ? "bg-emerald-500/10 text-emerald-400" 
                              : "bg-red-500/10 text-red-400"
                          )}
                        >
                          <div 
                            className="w-3 h-3 rounded-full border border-white/20 flex-shrink-0"
                            style={{ backgroundColor: hex }}
                          />
                          {isColorInStock ? (
                            <CheckCircle className="w-3 h-3 flex-shrink-0" />
                          ) : (
                            <XCircle className="w-3 h-3 flex-shrink-0" />
                          )}
                          <span className="truncate">{isColorInStock ? "In Stock" : "Out"}</span>
                        </div>
                      );
                    })}
                  </div>
                  {variantIndicators?.anyInStock && (
                    <div className="text-[10px] text-slate-400 mt-2 pt-2 border-t border-white/10">
                      {effectiveVariantIndicators.colors.filter(hex => variantIndicators?.colorStockStatus?.[hex] !== false).length} of {effectiveVariantIndicators.colors.length} colors available
                    </div>
                  )}
                </div>
              </HoverCardContent>
            </HoverCard>
          ) : filament.color_hex ? (
            <div 
              className="w-4 h-4 rounded-full border-2 border-white/20 shadow-sm"
              style={{ backgroundColor: filament.color_hex.startsWith('#') ? filament.color_hex : `#${filament.color_hex}` }}
              role="img"
              aria-label={`Color: ${filament.color_hex}`}
            />
          ) : null}
        </div>
        
        {/* Product Name - centered */}
        <div className="text-center">
          <h3 className="text-lg font-semibold text-foreground leading-tight line-clamp-2">
            {getDisplayTitle()}
          </h3>
        </div>
        
        {/* Weight options indicator for grouped products - centered */}
        {hasMultipleVariants && variantIndicators?.weights && variantIndicators.weights.length > 1 && (
          <div className="text-center mt-1">
            <span className="text-[10px] text-muted-foreground">
              {variantIndicators.weights.map(w => w >= 1000 ? `${(w/1000).toFixed(1)}kg` : `${w}g`).join(' • ')}
            </span>
          </div>
        )}
        
        {/* Color Match Indicator */}
        {colorMatchPercent !== null && colorMatchPercent !== undefined && (
          <span className={cn(
            "ml-8 mt-1 inline-block text-xs font-semibold px-2 py-0.5 rounded",
            colorMatchPercent >= 95 ? "bg-emerald-500/20 text-emerald-400" :
            colorMatchPercent >= 85 ? "bg-blue-500/20 text-blue-400" :
            "bg-amber-500/20 text-amber-400"
          )}>
            {colorMatchPercent}% match
          </span>
        )}
      </div>

      {/* ═══════════════════════════════════════════════════════════════
          ELEMENT 2: Rating
          ═══════════════════════════════════════════════════════════════ */}
      <div className="px-6 py-3 flex items-center gap-3" data-card-element="2">
        {/* Rating Badge with Tooltip */}
        {overallScore !== null ? (
          <HoverCard openDelay={200}>
            <HoverCardTrigger asChild>
              <div 
                className="inline-flex items-center gap-1.5 bg-primary/[0.12] border border-primary/30 rounded-lg px-3 py-1.5 cursor-help"
                role="img"
                aria-label={`FilaScore rating: ${overallScore.toFixed(1)} out of 10`}
              >
                <Star className="w-4 h-4 fill-[#FFB800] text-[#FFB800] drop-shadow-[0_0_4px_rgba(255,184,0,0.6)]" aria-hidden="true" />
                <span className={cn("text-lg font-bold", getScoreNumberColor(overallScore))} aria-hidden="true">{overallScore.toFixed(1)}</span>
                <span className="text-sm font-medium text-muted-foreground" aria-hidden="true">/10</span>
                <Info className="w-3.5 h-3.5 text-muted-foreground/60 ml-0.5" aria-hidden="true" />
              </div>
            </HoverCardTrigger>
            <HoverCardContent side="top" className="w-80 p-4 bg-popover border-border">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-foreground">Score Breakdown</span>
                  <span className={cn("text-xs px-2 py-0.5 rounded-full", 
                    scoreConfidence === 'high' ? 'bg-emerald-500/20 text-emerald-400' :
                    scoreConfidence === 'medium' ? 'bg-cyan-500/20 text-cyan-400' :
                    'bg-orange-500/20 text-orange-400'
                  )}>
                    {scoreConfidence === 'high' ? 'High' : scoreConfidence === 'medium' ? 'Good' : 'Limited'} confidence
                  </span>
                </div>
                <div className="space-y-1.5">
                  {scoreFactors.map((factor, idx) => (
                    <div key={idx} className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">{factor.label}</span>
                      <span className="font-mono text-emerald-400">+{factor.points.toFixed(2)}</span>
                    </div>
                  ))}
                </div>
                <div className="pt-2 border-t border-border/50 flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">{dataPointCount} data points</span>
                  <span className={cn("font-bold", getScoreNumberColor(overallScore))}>{overallScore.toFixed(1)} / 10</span>
                </div>
                <p className="text-[10px] text-muted-foreground pt-1 border-t border-border/50">
                  {SCORE_EXPLANATION}
                </p>
              </div>
            </HoverCardContent>
          </HoverCard>
        ) : (
          <div className="inline-flex items-center gap-1.5 bg-gray-500/15 border border-gray-500/30 rounded-lg px-3 py-1.5">
            <Star className="w-4 h-4 text-gray-600" />
            <span className="text-sm font-medium text-muted-foreground">Unrated</span>
          </div>
        )}
        
        {/* Limited Data Badge (inline with rating) */}
        {hasLimitedData && (
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="inline-flex items-center gap-1 bg-slate-500/15 border border-slate-500/30 rounded-md px-2 py-1 cursor-help">
                <Info className="w-3 h-3 text-slate-400" />
                <span className="text-[10px] font-medium text-slate-400">Limited Data</span>
              </div>
            </TooltipTrigger>
            <TooltipContent side="top" className="text-xs max-w-[240px]">
              <p className="font-medium mb-1">Score based on limited data</p>
              <p className="text-muted-foreground">Missing key specs like tensile strength, density, or calculated scores. Data is enriched via TDS parsing.</p>
            </TooltipContent>
          </Tooltip>
        )}
      </div>

      {/* ═══════════════════════════════════════════════════════════════
          ELEMENT 2b: Community Rating
          ═══════════════════════════════════════════════════════════════ */}
      <div className="px-6 pb-2 -mt-1" data-card-element="2b">
        {communityRating && communityRating.reviewCount > 0 ? (
          <Tooltip>
            <TooltipTrigger asChild>
              <Link
                to={`/filament/${filament.id}?tab=community`}
                className="inline-flex items-center gap-1.5 text-sm hover:opacity-80 transition-opacity"
              >
                <Star className="w-3.5 h-3.5 fill-primary text-primary" aria-hidden="true" />
                <span className="font-semibold text-primary">{communityRating.avgRating.toFixed(1)}</span>
                <span className="text-muted-foreground text-xs">
                  ({communityRating.reviewCount} review{communityRating.reviewCount !== 1 ? 's' : ''})
                </span>
              </Link>
            </TooltipTrigger>
            <TooltipContent side="bottom" className="text-xs max-w-[220px]">
              <p className="font-medium mb-1">{communityRating.avgRating.toFixed(1)} average from {communityRating.reviewCount} reviews</p>
              <div className="space-y-0.5 text-muted-foreground">
                {communityRating.avgQuality != null && <p>Print Quality: {communityRating.avgQuality.toFixed(1)}</p>}
                {communityRating.avgEase != null && <p>Ease: {communityRating.avgEase.toFixed(1)}</p>}
                {communityRating.avgValue != null && <p>Value: {communityRating.avgValue.toFixed(1)}</p>}
              </div>
            </TooltipContent>
          </Tooltip>
        ) : (
          <span className="text-xs text-muted-foreground/60">No reviews yet</span>
        )}
      </div>
      {/* ═══════════════════════════════════════════════════════════════
          ELEMENT 3: Price
          ═══════════════════════════════════════════════════════════════ */}
      <div className="px-6 py-3" data-card-element="3">
        {(resolved.isLoading || isRatesLoading) ? (
          <div className="flex items-center gap-2">
            <Loader2 className="w-4 h-4 animate-spin text-primary" />
            <span className="text-sm text-muted-foreground">
              Loading rates...
            </span>
          </div>
        ) : shouldShowPrice ? (
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-3">
              <div className="flex items-baseline gap-1">
                <span className="text-xl font-bold text-foreground leading-none">
                  {formatPrice(pricePerKg, { showApproximate: isConvertedPrice })}
                </span>
                <span className="text-sm font-medium text-muted-foreground">/kg</span>
              </div>
              
              {/* Budget-Friendly Badge (inline with price) */}
              {isBudgetFriendly && (
                <div className="inline-flex items-center gap-1 bg-emerald-500/15 border border-emerald-500/30 rounded-md px-2 py-1">
                  <DollarSign className="w-3 h-3 text-emerald-400" />
                  <span className="text-[10px] font-medium text-emerald-400">Budget</span>
                </div>
              )}
            </div>
            
            {/* Price freshness indicator */}
            {timeAgo && (
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <Clock className="w-3 h-3" />
                <span>{timeAgo}</span>
                {/* Local badge */}
                {isLocalStore && (
                  <span className="inline-flex items-center px-1.5 py-0.5 text-[9px] font-medium bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded ml-1">
                    Local
                  </span>
                )}
              </div>
            )}
            {/* Show Local badge even without freshness indicator */}
            {!timeAgo && isLocalStore && (
              <div className="flex items-center gap-1 text-xs">
                <span className="inline-flex items-center px-1.5 py-0.5 text-[9px] font-medium bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded">
                  Local
                </span>
              </div>
            )}
          </div>
        ) : isValidPrice && pricePerKg && isStale ? (
          // Stale price - show muted with warning
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-2">
              <span className="text-lg text-muted-foreground line-through opacity-60">
                {formatPrice(pricePerKg)}/kg
              </span>
            </div>
            <div className="flex items-center gap-1 text-xs text-amber-500">
              <Clock className="w-3 h-3" />
              <span>Price may have changed</span>
            </div>
          </div>
        ) : (
          // No price available
          <div className="flex items-center gap-2">
            <ExternalLink className="w-4 h-4 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">Check price at store</span>
          </div>
        )}
      </div>

      {/* ═══════════════════════════════════════════════════════════════
          ELEMENT 4: Material + ONE Standout Feature (max 2 badges)
          ═══════════════════════════════════════════════════════════════ */}
      <div className="px-6 py-3 flex flex-wrap gap-2 border-b border-white/[0.05]" data-card-element="4">
        {/* Material Badge (always show) */}
        {filament.material && (
          <div className={cn(
            "inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 border",
            getMaterialBadgeClass(filament.material)
          )}>
            <Layers className="w-3.5 h-3.5" />
            <span className="text-[13px] font-medium">{filament.material.split(" ")[0]}</span>
          </div>
        )}
        
        {/* ONE Standout Feature Badge - ONLY ONE */}
        {standoutFeature && (
          <div 
            className={cn(
              "inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 border",
              standoutFeature.colorClass
            )}
            data-feature-badge={standoutFeature.label.toLowerCase().replace(/\s+/g, '-')}
          >
            <standoutFeature.icon className="w-3.5 h-3.5" />
            <span className="text-[13px] font-medium">{standoutFeature.label}</span>
          </div>
        )}
        
        {/* HueForge TD Badge (amber/gold premium indicator) */}
        {filament.transmission_distance != null && (
          <div className="inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 border bg-amber-500/15 border-amber-500/30 text-amber-400">
            <Lightbulb className="w-3.5 h-3.5" />
            <span className="text-[13px] font-medium">TD {filament.transmission_distance}</span>
          </div>
        )}
      </div>

      {/* ═══════════════════════════════════════════════════════════════
          ELEMENT 5: CTA Button
          ═══════════════════════════════════════════════════════════════ */}
      <div className="px-6 py-4 flex justify-center" data-card-element="5">
        <Button
          asChild
          className={cn(
            "w-full h-11 font-semibold transition-all duration-200",
            "bg-primary hover:bg-primary/90 text-primary-foreground",
            "active:scale-[0.98]"
          )}
        >
          <Link to={`/filament/${filament.id}`} aria-label={`View details for ${filament.product_title}`}>
            {isHighConfidence ? 'View Details' : 'Check Price'}
            <ArrowRight className="w-[18px] h-[18px] ml-2" />
          </Link>
        </Button>
      </div>
    </div>
  );
}

export default FilamentCard;
