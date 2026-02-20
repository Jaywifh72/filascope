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
  Lightbulb,
  Printer,
  Award,
  AlertTriangle,
  Columns,
  Thermometer,
  Store,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { HoverCard, HoverCardContent, HoverCardTrigger } from "@/components/ui/hover-card";
import { cn, normalizeColorHex } from "@/lib/utils";
import { useAffiliateLinks } from "@/hooks/useAffiliateLinks";
import { getBrandLogo } from "@/lib/brandLogos";
import { BrandLogo } from "@/components/ui/BrandLogo";
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
import { useUserPrinterPreference } from "@/hooks/useUserPrinterPreference";
import { getFilamentHref } from "@/lib/filamentUrl";

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
  // Cost per print toggle
  showCostPerPrint?: boolean;
  // Number of retailers/price entries for this product in the user's region
  // TODO: This data needs a data-layer change — currently only available on the detail page
  // via useFilamentDetailPricing. To populate on cards, consider adding a lightweight
  // bulk RPC or denormalizing the count onto the filament row/view.
  retailerCount?: number;
}

// Price freshness reframe helper (Change 4)
function getReframedFreshness(confidence: string | null, timeAgo: string | null): { dot: string | null; text: string | null } {
  if (confidence === 'high') return { dot: 'bg-emerald-400', text: 'Updated recently' };
  if (confidence === 'medium' || confidence === 'low') {
    const match = timeAgo?.match(/(\d+)\s*(d|day|h|hour|w|week|mo|month)/i);
    if (match) {
      const num = match[1];
      const unit = match[2].toLowerCase();
      const label = unit.startsWith('mo') ? `${num}mo` : unit.startsWith('w') ? `${num}w` : unit.startsWith('d') ? `${num}d` : `${num}h`;
      return { dot: null, text: `Checked ${label} ago` };
    }
    return { dot: null, text: null };
  }
  if (confidence === 'stale') return { dot: 'bg-amber-400', text: 'Price may have changed' };
  return { dot: null, text: null };
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

// Freshness dot color helper
function getFreshnessDotColor(confidence: string | null): string {
  if (confidence === 'high') return 'bg-emerald-400';
  if (confidence === 'medium') return 'bg-amber-400';
  return 'bg-red-400';
}

// Compact time ago (e.g., "24d", "3h")
function getCompactTimeAgo(timeAgo: string | null): string | null {
  if (!timeAgo) return null;
  // Already compact-ish, just strip "ago" and extra words
  const match = timeAgo.match(/(\d+)\s*(d|h|m|min|day|hour|week|month|mo|w)/i);
  if (!match) return timeAgo;
  const num = match[1];
  const unit = match[2].toLowerCase();
  if (unit.startsWith('mo')) return `${num}mo`;
  if (unit.startsWith('w')) return `${num}w`;
  if (unit.startsWith('d')) return `${num}d`;
  if (unit.startsWith('h')) return `${num}h`;
  if (unit.startsWith('m')) return `${num}m`;
  return `${num}${unit.charAt(0)}`;
}

export function FilamentCard({ filament, colorMatchPercent, priceTrend, index = 0, displayTitle, variantIndicators, communityRating, showCostPerPrint = false, retailerCount }: FilamentCardProps) {
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
  
  // Affiliate links for direct store link
  const { getAffiliateUrl } = useAffiliateLinks();
  const affiliateUrl = useMemo(
    () => getAffiliateUrl(regionalUrl, filament.vendor),
    [getAffiliateUrl, regionalUrl, filament.vendor]
  );
  
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

  // Printer compatibility check
  const { printerName: savedPrinterName, nozzleTempMax, bedTempMax, hasEnclosure, hasSavedPrinter } = useUserPrinterPreference();
  
  const printerCompatibility = useMemo(() => {
    if (!hasSavedPrinter) return null;
    
    const nozzleMin = filament.nozzle_temp_min_c;
    const needsEnclosure = ["ABS", "ASA", "NYLON", "PC", "PEEK"].some(
      (m) => filament.material?.toUpperCase()?.includes(m)
    );
    const isAbrasive = filament.is_nozzle_abrasive;

    let level: "compatible" | "warning" | "incompatible" = "compatible";
    let message = "Compatible with your printer";

    if (nozzleMin && nozzleTempMax && nozzleMin > nozzleTempMax) {
      level = "incompatible";
      message = "Not recommended for your printer";
    } else if (needsEnclosure && !hasEnclosure) {
      level = "warning";
      message = "May need enclosure";
    } else if (isAbrasive) {
      level = "warning";
      message = "Hardened nozzle needed";
    }

    return { level, message };
  }, [hasSavedPrinter, filament.nozzle_temp_min_c, filament.material, filament.is_nozzle_abrasive, nozzleTempMax, hasEnclosure]);

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

  // Compact freshness text
  const compactTimeAgo = getCompactTimeAgo(timeAgo);

  // Change 4: Reframed freshness
  const reframedFreshness = getReframedFreshness(priceConfidence, timeAgo);

  // Change 3: Determine CTA state
  const isDeal = priceTrend != null && priceTrend < 0;
  const ctaText = isOutOfStock ? 'Check Availability' : isDeal ? 'View Deal' : 'View Prices';
  const ctaTab = isOutOfStock ? '' : '?tab=pricing';
  const filamentHref = getFilamentHref(filament.id, (filament as any).product_handle);

  return (
    <div
      role="article"
      aria-label={`${filament.vendor || 'Unknown'} ${filament.product_title} filament card`}
      className={cn(
        "group relative rounded-2xl transition-all duration-200 ease-out min-h-[420px] flex flex-col",
        "bg-slate-800/80 border border-slate-700/50",
        // Hover effects scoped to pointer devices via CSS class
        "filament-card-hover",
        isOutOfStock && "opacity-75 is-oos",
        // Active: tactile press
        "active:scale-[0.99] active:duration-[50ms]",
        // Focus: accessible cyan ring
        "focus-within:ring-2 focus-within:ring-cyan-500/50 focus-within:ring-offset-2 focus-within:ring-offset-slate-900",
        isSelected && "border-2 border-primary bg-primary/5",
        isPendingSelection && "border-2 border-primary/60 bg-primary/5",
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
      {/* Change 2: Out of Stock overlay on card image area */}
      {isOutOfStock && (
        <div className="absolute inset-x-0 top-0 h-24 z-[1] bg-slate-900/60 flex items-center justify-center pointer-events-none rounded-t-2xl">
          <span className="text-sm font-semibold text-slate-400 tracking-wide">Out of Stock</span>
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
                  // Default state - visible on mobile (no hover), hidden on desktop
                  "w-5 h-5 bg-muted border border-border compare-checkbox-desktop",
                  "opacity-100 md:opacity-0",
                  // Direct button hover
                  "hover:!opacity-100 hover:!scale-110 hover:!border-primary hover:!bg-primary/30"
                ),
            isCompareDisabled && "opacity-30 cursor-not-allowed"
          )}
        >
          {isSelected || isPendingSelection ? (
            <Check className="w-3.5 h-3.5 text-primary-foreground animate-check-draw" strokeWidth={3} />
          ) : (
            <Plus className={cn(
              "text-muted-foreground transition-all duration-200",
              "w-3 h-3 group-hover:w-3.5 group-hover:h-3.5 group-hover:text-primary"
            )} />
          )}
        </button>
        
        {/* Tooltip */}
        {showTooltip && !isSelected && !isCompareDisabled && (
          <div className="absolute top-full right-0 mt-2 px-2.5 py-1.5 bg-popover text-popover-foreground text-xs rounded-md whitespace-nowrap z-20 border border-border">
            Add to Compare
          </div>
        )}
      </div>

      {/* ═══════════════════════════════════════════════════════════════
          ELEMENT 1: Brand Row (logo + name + prominent color swatch)
          ═══════════════════════════════════════════════════════════════ */}
      <div className="px-6 pt-4 pb-2 border-b border-border/30" data-card-element="1">
        {/* Brand row */}
        <div className="flex items-center gap-2 mb-2">
          <BrandLogo
            src={brandLogo}
            brandName={filament.vendor || "Unknown"}
            size="sm"
            className="w-5 h-5 rounded"
          />
          <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider truncate">
            {filament.vendor || "Unknown"}
          </span>
        </div>

        {/* Product Name with inline color swatch */}
        <div className="flex items-start gap-2.5">
          {/* Color swatch with tooltip */}
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="flex-shrink-0 flex flex-col items-center gap-0.5 mt-0.5">
                {filament.color_hex ? (
                  <div 
                    className="w-7 h-7 rounded-lg ring-2 ring-white/20 shadow-sm cursor-help"
                    style={{ backgroundColor: normalizeColorHex(filament.color_hex) }}
                    role="img"
                    aria-label={`Color: ${filament.color_hex}`}
                  />
                ) : (
                  <div 
                    className="w-7 h-7 rounded-lg ring-2 ring-white/20 shadow-sm bg-muted/50 flex items-center justify-center cursor-help"
                    style={{ backgroundImage: 'repeating-linear-gradient(45deg, transparent, transparent 3px, hsl(var(--muted-foreground) / 0.15) 3px, hsl(var(--muted-foreground) / 0.15) 4px)' }}
                    role="img"
                    aria-label="Color unknown"
                  >
                    <span className="text-[10px] text-muted-foreground font-mono">?</span>
                  </div>
                )}
                {/* Variant count indicator */}
                {hasMultipleVariants && effectiveVariantIndicators.colors.length > 1 && (
                  <span className="text-[10px] text-muted-foreground font-medium">
                    +{effectiveVariantIndicators.colors.length - 1}
                  </span>
                )}
              </div>
            </TooltipTrigger>
            <TooltipContent side="right" className="text-xs">
              <p className="font-medium">{getDisplayTitle()}</p>
              <p className="text-muted-foreground font-mono">
                {filament.color_hex ? normalizeColorHex(filament.color_hex) : 'Unknown color'}
              </p>
              {hasMultipleVariants && effectiveVariantIndicators.colors.length > 1 && (
                <p className="text-muted-foreground mt-1">{effectiveVariantIndicators.colors.length} colors available</p>
              )}
            </TooltipContent>
          </Tooltip>
          
          <div className="flex-1 min-w-0">
            <h3 
              className="text-lg font-semibold text-foreground leading-tight line-clamp-3"
              title={filament.product_title || ''}
            >
              {getDisplayTitle()}
            </h3>
            
            {/* Variant color swatches row (for grouped products) */}
            {hasMultipleVariants && effectiveVariantIndicators.colors.length > 0 && (
              <HoverCard openDelay={200} closeDelay={100}>
                <HoverCardTrigger asChild>
                  <div className="flex items-center gap-1 cursor-pointer mt-1.5" role="group" aria-label="Color variants">
                    {effectiveVariantIndicators.colors.slice(0, 5).map((hex, i) => {
                      const isColorInStock = variantIndicators?.colorStockStatus?.[hex] !== false;
                      return (
                        <div 
                          key={i}
                          className={cn(
                            "w-4 h-4 rounded-full border shadow-sm ring-1 ring-white/20 transition-opacity",
                            isColorInStock ? "border-border" : "border-border/50 opacity-50"
                          )}
                          style={{ backgroundColor: hex }}
                          role="img"
                          aria-label={`Color swatch ${hex}${isColorInStock ? '' : ', out of stock'}`}
                        />
                      );
                    })}
                    {effectiveVariantIndicators.colors.length > 5 && (
                      <span className="text-[10px] text-muted-foreground ml-0.5">+{effectiveVariantIndicators.colors.length - 5}</span>
                    )}
                  </div>
                </HoverCardTrigger>
                <HoverCardContent 
                  side="bottom" 
                  align="start" 
                  className="w-64 p-3 bg-popover border-border"
                >
                  <div className="space-y-2">
                    <div className="text-xs font-semibold text-foreground mb-2">Color Availability</div>
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
                              className="w-3 h-3 rounded-full border border-border flex-shrink-0"
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
                      <div className="text-[10px] text-muted-foreground mt-2 pt-2 border-t border-border/30">
                        {effectiveVariantIndicators.colors.filter(hex => variantIndicators?.colorStockStatus?.[hex] !== false).length} of {effectiveVariantIndicators.colors.length} colors available
                      </div>
                    )}
                  </div>
                </HoverCardContent>
              </HoverCard>
            )}
          </div>
        </div>
        
        {/* Weight options indicator for grouped products */}
        {hasMultipleVariants && variantIndicators?.weights && variantIndicators.weights.length > 1 && (
          <div className="mt-1">
            <span className="text-[10px] text-muted-foreground">
              {variantIndicators.weights.map(w => w >= 1000 ? `${(w/1000).toFixed(1)}kg` : `${w}g`).join(' • ')}
            </span>
          </div>
        )}
        
        {/* Color Match Indicator */}
        {colorMatchPercent !== null && colorMatchPercent !== undefined && (
          <span className={cn(
            "mt-1 inline-block text-xs font-semibold px-2 py-0.5 rounded",
            colorMatchPercent >= 95 ? "bg-emerald-500/20 text-emerald-400" :
            colorMatchPercent >= 85 ? "bg-blue-500/20 text-blue-400" :
            "bg-amber-500/20 text-amber-400"
          )}>
            {colorMatchPercent}% match
          </span>
        )}
      </div>

      {/* Flex-grow wrapper for middle content to push CTA to bottom */}
      <div className="flex-grow flex flex-col">

      {/* ═══════════════════════════════════════════════════════════════
          ELEMENT 2: Badges Row — Material + TD + Standout Feature
          Plan #3: TD badge moved to priority position after material
          ═══════════════════════════════════════════════════════════════ */}
      <div className="px-6 py-3 flex flex-wrap gap-2" data-card-element="2">
        {/* "New" Badge — products added in last 30 days */}
        {(filament as any).created_at && 
          (Date.now() - new Date((filament as any).created_at).getTime()) < 30 * 24 * 60 * 60 * 1000 && (
          <div className="inline-flex items-center rounded-full px-2 py-0.5 bg-emerald-500/20 text-emerald-400 text-xs font-semibold">
            New
          </div>
        )}
        
        {/* "Popular" Badge — high value_score heuristic */}
        {filament.value_score != null && filament.value_score >= 8 && communityRating && communityRating.reviewCount > 0 && (
          <div className="inline-flex items-center rounded-full px-2 py-0.5 bg-amber-500/20 text-amber-400 text-xs font-semibold">
            Popular
          </div>
        )}
        
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
        
        {/* Plan #3: HueForge TD Badge — priority position right after material */}
        {filament.transmission_distance != null && (
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 border bg-purple-500/15 border-purple-500/30 text-purple-400">
                <Lightbulb className="w-3.5 h-3.5" />
                <span className="text-xs font-semibold">TD {filament.transmission_distance}</span>
              </div>
            </TooltipTrigger>
            <TooltipContent side="top" className="text-xs max-w-[240px]">
              Transmissivity value for HueForge multi-color prints. Lower = more opaque, higher = more translucent.
            </TooltipContent>
          </Tooltip>
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
        
        {/* Printer Compatibility Badge */}
        {printerCompatibility && (
          <Tooltip>
            <TooltipTrigger asChild>
              <div className={cn(
                "inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 border",
                printerCompatibility.level === "compatible"
                  ? "bg-emerald-500/15 border-emerald-500/30 text-emerald-400"
                  : printerCompatibility.level === "warning"
                  ? "bg-amber-500/15 border-amber-500/30 text-amber-400"
                  : "bg-red-500/15 border-red-500/30 text-red-400"
              )}>
                {printerCompatibility.level === "compatible" ? (
                  <Check className="w-3.5 h-3.5" />
                ) : printerCompatibility.level === "warning" ? (
                  <AlertTriangle className="w-3.5 h-3.5" />
                ) : (
                  <XCircle className="w-3.5 h-3.5" />
                )}
                <span className="text-[13px] font-medium">
                  {printerCompatibility.level === "compatible" ? "Compatible" : 
                   printerCompatibility.level === "warning" ? "Caution" : "Incompatible"}
                </span>
              </div>
            </TooltipTrigger>
            <TooltipContent side="top" className="text-xs max-w-[220px]">
              <div className="flex items-center gap-1.5">
                <Printer className="w-3 h-3 text-muted-foreground" />
                <span className="font-medium">{savedPrinterName || "Your Printer"}</span>
              </div>
              <p className="mt-1 text-muted-foreground">{printerCompatibility.message}</p>
            </TooltipContent>
          </Tooltip>
        )}
      </div>

      {/* ═══════════════════════════════════════════════════════════════
          ELEMENT 3: Price Block — Visual anchor with store domain
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
                <span className="text-xs text-muted-foreground mr-0.5">From</span>
                <span className={cn(
                  "text-lg font-bold leading-none",
                  isOutOfStock ? "text-muted-foreground line-through" : "text-foreground"
                )}>
                  {formatPrice(pricePerKg, { showApproximate: isConvertedPrice })}
                </span>
                <span className="text-xs font-medium text-muted-foreground/60">/kg</span>
              </div>
              
              {/* Budget-Friendly Badge (inline with price) */}
              {isBudgetFriendly && (
                <div className="inline-flex items-center gap-1 bg-emerald-500/15 border border-emerald-500/30 rounded-md px-2 py-1">
                  <DollarSign className="w-3 h-3 text-emerald-400" />
                  <span className="text-[10px] font-medium text-emerald-400">Budget</span>
                </div>
              )}

              {/* Converted/International indicator when best price is not local */}
              {isConvertedPrice && !resolved.bestIsLocal && (
                <span className="text-[9px] font-medium text-muted-foreground bg-muted/50 border border-border/50 rounded px-1.5 py-0.5">
                  intl
                </span>
              )}
            </div>
            
            {/* Store domain link */}
            {(() => {
              const storeDomain = extractStoreDomain(filament.product_url);
                return storeDomain ? (
                <a 
                  href={filament.product_url!}
                  target="_blank"
                  rel="nofollow sponsored noopener noreferrer"
                  className="text-xs text-primary hover:underline"
                  onClick={(e) => e.stopPropagation()}
                >
                  at {storeDomain}
                </a>
              ) : null;
            })()}

            {/* Mini confidence badge */}
            <Tooltip>
              <TooltipTrigger asChild>
                <span className={cn(
                  "inline-flex items-center gap-0.5 text-[10px]",
                  priceConfidence === 'high' ? "text-green-500" :
                  priceConfidence === 'medium' ? "text-muted-foreground" :
                  "text-amber-500"
                )}>
                  {priceConfidence === 'high' ? '✓' : priceConfidence === 'stale' || priceConfidence === 'unknown' ? '⚠' : '⏰'}
                  <span className="sr-only">Price confidence: {priceConfidence}</span>
                </span>
              </TooltipTrigger>
              <TooltipContent side="top" className="text-xs">
                {timeAgo ? `Last updated ${timeAgo}` : 'No price data'}
              </TooltipContent>
            </Tooltip>
            
            {/* Secondary local price when best price is international — green dot instead of MapPin */}
            {resolved.localPricePerKg != null && resolved.formattedLocalPricePerKg && (
              <div className="flex items-center gap-1 text-xs">
                <span className="bg-emerald-400 rounded-full w-2 h-2 inline-block flex-shrink-0" />
                <span className="text-muted-foreground">
                  Local: {resolved.formattedLocalPricePerKg}/kg
                </span>
              </div>
            )}
          </div>
        ) : isValidPrice && pricePerKg && isStale ? (
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
          <div className="flex items-center gap-2">
            <ExternalLink className="w-4 h-4 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">View at store</span>
          </div>
       )}

        {/* Cost per print estimate */}
        {showCostPerPrint && shouldShowPrice && pricePerKg && (
          <div className="-mt-1 pb-1">
            <span className="text-xs text-muted-foreground">
              ~{formatPrice(pricePerKg * 0.1)} per 100g print
            </span>
          </div>
        )}
      </div>

      {/* ═══════════════════════════════════════════════════════════════
          ELEMENT 3b: Nozzle Temp Compact Row
          ═══════════════════════════════════════════════════════════════ */}
      {(filament.nozzle_temp_min_c || filament.nozzle_temp_max_c) && (
        <div className="px-6 pb-2 flex items-center gap-1.5">
          <Thermometer className="w-3 h-3 text-muted-foreground" />
          <span className="text-xs text-muted-foreground">
            {filament.nozzle_temp_min_c && filament.nozzle_temp_max_c
              ? `${filament.nozzle_temp_min_c}–${filament.nozzle_temp_max_c}°C`
              : filament.nozzle_temp_max_c
              ? `≤${filament.nozzle_temp_max_c}°C`
              : `≥${filament.nozzle_temp_min_c}°C`
            }
          </span>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════
          ELEMENT 4: Meta Row — FilaScore + Freshness + Compare
          Plan #8, #9 (freshness), #10
          ═══════════════════════════════════════════════════════════════ */}
      <div className="px-6 py-2 flex items-center gap-2 flex-wrap" data-card-element="4">
        {/* Community Rating — star + count */}
        {communityRating && communityRating.reviewCount > 0 && (
          <Tooltip>
            <TooltipTrigger asChild>
              <Link
                to={`${filamentHref}?tab=community`}
                className="inline-flex items-center gap-1 text-xs hover:opacity-80 transition-opacity"
              >
                <Star className="w-3 h-3 fill-primary text-primary" aria-hidden="true" />
                <span className="font-semibold text-primary">{communityRating.avgRating.toFixed(1)}</span>
                <span className="text-muted-foreground text-[10px]">
                  ({communityRating.reviewCount})
                </span>
              </Link>
            </TooltipTrigger>
            <TooltipContent side="bottom" className="text-xs max-w-[220px]">
              <p className="font-medium mb-1">Community rating: {communityRating.avgRating.toFixed(1)} from {communityRating.reviewCount} reviews</p>
              <div className="space-y-0.5 text-muted-foreground">
                {communityRating.avgQuality != null && <p>Print Quality: {communityRating.avgQuality.toFixed(1)}</p>}
                {communityRating.avgEase != null && <p>Ease: {communityRating.avgEase.toFixed(1)}</p>}
                {communityRating.avgValue != null && <p>Value: {communityRating.avgValue.toFixed(1)}</p>}
              </div>
            </TooltipContent>
          </Tooltip>
        )}

        {/* Vertical divider when both community rating and FilaScore are shown */}
        {communityRating && communityRating.reviewCount > 0 && overallScore !== null && !(scoreConfidence === 'low' && hasLimitedData) && (
          <div className="h-4 border-r border-border/50" />
        )}

        {/* FilaScore — labeled badge with info icon */}
        {overallScore !== null && scoreConfidence === 'low' ? (
          <div className="inline-flex items-center gap-1 bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-xs font-semibold px-2.5 py-0.5 rounded-full">
            <Check className="w-3.5 h-3.5" />
            Verified specs
          </div>
        ) : overallScore !== null && !(scoreConfidence === 'low' && hasLimitedData) ? (
          <>
          <HoverCard openDelay={200}>
            <HoverCardTrigger asChild>
              <div 
                className="bg-cyan-500/15 border border-cyan-500/30 text-cyan-400 text-sm font-semibold px-2.5 py-0.5 rounded-full cursor-help inline-flex items-center gap-1.5"
                role="img"
                aria-label={`FilaScore rating: ${overallScore.toFixed(1)} out of 10`}
              >
                <Award className="w-3.5 h-3.5" />
                <span className="text-[10px] font-normal text-cyan-400/70">FilaScore</span>
                <span>{overallScore.toFixed(1)}</span>
                <Info className="w-3 h-3 text-cyan-400/50" />
              </div>
            </HoverCardTrigger>
            <HoverCardContent side="top" className="w-80 p-4 bg-popover border-border">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-foreground">FilaScore — algorithmic quality rating</span>
                  <span className={cn("text-xs px-2 py-0.5 rounded-full flex-shrink-0", 
                    scoreConfidence === 'high' ? 'bg-emerald-500/20 text-emerald-400' :
                    scoreConfidence === 'medium' ? 'bg-cyan-500/20 text-cyan-400' :
                    'bg-orange-500/20 text-orange-400'
                  )}>
                    {scoreConfidence === 'high' ? 'High' : scoreConfidence === 'medium' ? 'Good' : 'Limited'} confidence
                  </span>
                </div>
                <p className="text-xs text-muted-foreground">
                  FilaScore rates filaments on data completeness, price value, and community feedback. Scale: 1–10.
                </p>
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
          {overallScore >= 8.5 && (
            <span className="inline-flex items-center bg-amber-500/15 border border-amber-500/30 text-amber-400 text-[10px] font-semibold px-1.5 py-0.5 rounded-full">
              Top Rated
            </span>
          )}
          </>
        ) : null}

        {/* Limited Data Badge */}
        {hasLimitedData && (
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="inline-flex items-center gap-1 bg-muted/60 border border-border/50 rounded-full px-2 py-0.5 cursor-help">
                <Info className="w-3 h-3 text-muted-foreground" />
                <span className="text-[10px] font-medium text-muted-foreground">Limited</span>
              </div>
            </TooltipTrigger>
            <TooltipContent side="top" className="text-xs max-w-[240px]">
              <p className="font-medium mb-1">Score based on limited data</p>
              <p className="text-muted-foreground">Missing key specs like tensile strength, density, or calculated scores.</p>
            </TooltipContent>
          </Tooltip>
        )}
        
        {/* Reframed freshness indicator */}
        {reframedFreshness.text && shouldShowPrice && (
          <div className="inline-flex items-center gap-1 text-[10px] text-slate-500">
            {reframedFreshness.dot && (
              <div className={cn("w-1.5 h-1.5 rounded-full", reframedFreshness.dot)} />
            )}
            <span>{reframedFreshness.text}</span>
          </div>
        )}
      </div>

      </div>{/* End flex-grow wrapper */}

      {/* ═══════════════════════════════════════════════════════════════
          ELEMENT 5: Two-Button CTA — View Prices + Compare Toggle
          ═══════════════════════════════════════════════════════════════ */}
      <div className="px-6 py-4 flex flex-col gap-2" data-card-element="5">
        <div className="flex gap-2">
          <Button
            asChild
            variant={isOutOfStock ? "outline" : "default"}
            className={cn(
              "flex-1 h-11 font-semibold transition-all duration-200",
              isOutOfStock
                ? "bg-slate-700 border-slate-600 text-slate-400 hover:bg-slate-600 hover:text-slate-300"
                : isDeal
                ? "bg-amber-500 border-amber-500 text-black hover:bg-amber-400 hover:border-amber-400"
                : cn(
                    "bg-primary/10 border border-primary/30 text-primary cta-view-prices",
                    "hover:shadow-[0_0_12px_rgba(6,182,212,0.3)]"
                  ),
              "active:scale-[0.98]"
            )}
          >
            <Link to={`${filamentHref}${ctaTab}`} aria-label={`${ctaText} for ${filament.product_title}`}>
              {ctaText}
              <ArrowRight className="w-[18px] h-[18px] ml-2" />
            </Link>
          </Button>
          {/* Change 6: Compare button expands on hover */}
          <button
            onClick={handleCompareToggle}
            disabled={isCompareDisabled}
            aria-label={isSelected ? "Remove from comparison" : "Add to comparison"}
            className={cn(
              "h-11 flex items-center justify-center rounded-md border transition-all duration-200 overflow-hidden compare-expand-btn",
              "w-10",
              isSelected || isPendingSelection
                ? "bg-primary/20 border-primary text-primary"
                : cn(
                    "border-border text-muted-foreground",
                    "hover:border-primary hover:text-primary",
                    "opacity-60"
                  ),
              isCompareDisabled && "opacity-30 cursor-not-allowed"
            )}
          >
            <Columns className="w-4 h-4 flex-shrink-0" />
            <span className="max-w-0 overflow-hidden transition-all duration-200 opacity-0 text-xs font-medium whitespace-nowrap ml-0">
              Compare
            </span>
          </button>
        </div>
        {/* Watch Price link for out-of-stock */}
        {isOutOfStock && (
          <Link 
            to={filamentHref} 
            className="text-xs text-slate-500 underline hover:text-slate-400 transition-colors text-center"
          >
            Watch Price
          </Link>
        )}
        {/* Multi-store indicator or direct store link */}
        {!isOutOfStock && retailerCount != null && retailerCount > 1 ? (
          <Link
            to={`${filamentHref}?tab=pricing`}
            className="inline-flex items-center justify-center gap-1 text-xs font-medium text-primary hover:text-primary/80 transition-colors"
          >
            <Store className="w-3 h-3" />
            {retailerCount} prices →
          </Link>
        ) : !isOutOfStock && regionalUrl ? (() => {
          const domain = extractStoreDomain(regionalUrl);
          return domain ? (
            <a
            href={affiliateUrl || regionalUrl}
              target="_blank"
              rel="nofollow sponsored noopener noreferrer"
              className="text-xs text-cyan-400/70 hover:text-cyan-400 transition-colors text-center"
              onClick={(e) => e.stopPropagation()}
            >
              View on {domain} →
            </a>
          ) : null;
        })() : null}
      </div>

      {/* Quick Compare hover button — desktop only */}
      <button
        onClick={handleCompareToggle}
        disabled={isCompareDisabled}
        aria-label="Quick compare"
        className={cn(
          "absolute bottom-4 right-4 w-8 h-8 rounded-full flex items-center justify-center compare-btn-corner",
          "opacity-0 transition-opacity duration-150 ease-out",
          "hidden md:flex",
          isSelected || isPendingSelection
            ? "bg-primary/30 text-primary"
            : "bg-cyan-500/20 hover:bg-cyan-500/40 text-cyan-400",
          isCompareDisabled && "opacity-0 pointer-events-none"
        )}
      >
        <Columns className="w-4 h-4" />
      </button>
    </div>
  );
}

// Utility: extract store domain from product URL
function extractStoreDomain(url: string | null | undefined): string | null {
  if (!url) return null;
  try {
    const hostname = new URL(url).hostname;
    return hostname.replace(/^www\./, '');
  } catch { return null; }
}

export default FilamentCard;
