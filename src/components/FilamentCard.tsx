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
  MapPin,
  Clock,
  ExternalLink,
  Lightbulb,
  Printer,
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
import { calculateUnifiedScore, type FilamentForScoring } from "@/lib/unifiedFilamentScore";
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

// === PLAN HELPERS ===

// Luminance-based contrast text color for swatch pill labels
function getContrastTextColor(hex: string): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance >= 0.5 ? '#111111' : '#ffffff';
}

// Reliable color hex resolution — skips default placeholder colors
const DEFAULT_HEXES = new Set(['#0000ff', '#000000', '#ffffff']);

function getReliableColorHex(
  filamentHex: string | null | undefined,
  variantColors: string[]
): string | null {
  for (const hex of variantColors) {
    const normalized = normalizeColorHex(hex).toLowerCase();
    if (!DEFAULT_HEXES.has(normalized)) return normalized;
  }
  if (filamentHex) {
    const normalized = normalizeColorHex(filamentHex).toLowerCase();
    if (!DEFAULT_HEXES.has(normalized)) return normalized;
  }
  return filamentHex ? normalizeColorHex(filamentHex) : null;
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
  nozzle_temp_min_c?: number | null;
  nozzle_temp_max_c?: number | null;
  bed_temp_min_c?: number | null;
  bed_temp_max_c?: number | null;
  tensile_strength_xy_mpa?: number | null;
  density_g_cm3?: number | null;
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
  last_scraped_at?: string | null;
  price_confidence?: string | null;
  price_source?: string | null;
  transmission_distance?: number | null;
}

// Variant indicator data for grouped products
interface VariantIndicators {
  colors: string[];
  weights: number[];
  variantCount: number;
  priceRange?: { min: number | null; max: number | null };
  anyInStock?: boolean;
  colorStockStatus?: Record<string, boolean>;
}

interface FilamentCardProps {
  filament: Filament;
  colorMatchPercent?: number | null;
  priceTrend?: number | null;
  index?: number;
  displayTitle?: string;
  variantIndicators?: VariantIndicators;
  communityRating?: { avgRating: number; reviewCount: number; avgQuality?: number | null; avgEase?: number | null; avgValue?: number | null } | null;
  showCostPerPrint?: boolean;
  retailerCount?: number;
}

// Get the single most important standout feature
function getStandoutFeature(filament: Filament): { label: string; colorClass: string; icon: typeof Shield } | null {
  if (filament.is_nozzle_abrasive === false) {
    return { label: "Brass Safe", colorClass: "bg-emerald-500/15 border-emerald-500/30 text-emerald-400", icon: Shield };
  }
  if (filament.high_speed_capable) {
    return { label: "High Speed", colorClass: "bg-blue-500/15 border-blue-500/30 text-blue-400", icon: Zap };
  }
  if (filament.carbon_fiber_percentage && filament.carbon_fiber_percentage > 0) {
    return { label: "Carbon Fiber", colorClass: "bg-slate-500/15 border-slate-500/30 text-slate-400", icon: Layers };
  }
  if (filament.glass_fiber_percentage && filament.glass_fiber_percentage > 0) {
    return { label: "Glass Fiber", colorClass: "bg-blue-500/15 border-blue-500/30 text-blue-400", icon: Layers };
  }
  if (filament.wood_powder_percentage && filament.wood_powder_percentage > 0) {
    return { label: "Wood Fill", colorClass: "bg-amber-500/15 border-amber-500/30 text-amber-400", icon: Layers };
  }
  return null;
}

// Freshness dot color helper
function getFreshnessDotColor(confidence: string | null): string {
  if (confidence === 'high') return 'bg-emerald-400';
  if (confidence === 'medium') return 'bg-amber-400';
  return 'bg-red-400';
}

// Freshness tooltip text based on confidence + timeAgo
function getFreshnessTooltipText(confidence: string | null, timeAgo: string | null): string {
  if (confidence === 'high') return 'Price updated today';
  if (confidence === 'medium') return `Price updated ${timeAgo || 'a few days'} ago`;
  return `Price data may be outdated — updated ${timeAgo || 'a while'} ago`;
}

// Compact time ago (e.g., "24d", "3h")
function getCompactTimeAgo(timeAgo: string | null): string | null {
  if (!timeAgo) return null;
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
  const isOutOfStock = variantIndicators && variantIndicators.variantCount > 1
    ? variantIndicators.anyInStock === false
    : filament.variant_available === false;
  const [isHovered, setIsHovered] = useState(false);
  const [imageError, setImageError] = useState(false);
  const { currency: userCurrency, formatPrice, regionConfig } = useRegion();
  
  const fetchedVariants = useFilamentVariantCounts(
    filament.id,
    filament.product_title,
    filament.vendor || null,
    filament.product_line_id || null
  );
  
  const effectiveVariantIndicators = variantIndicators || {
    colors: fetchedVariants.colors,
    weights: [],
    variantCount: fetchedVariants.count,
  };
  
  const { regionalUrl, isLocalStore, isRatesLoading } = useRegionalPrice(filament as FilamentWithRegionalPrices);
  
  const { getAffiliateUrl } = useAffiliateLinks();
  const affiliateUrl = useMemo(
    () => getAffiliateUrl(regionalUrl, filament.vendor),
    [getAffiliateUrl, regionalUrl, filament.vendor]
  );
  
  const resolved = useResolvedPrice(filament);
  const isConvertedPrice = resolved.isConverted;
  
  const { addItem, removeItem, isInCompare, isFull, triggerGlow, isMultiSelectMode, addToPending, removeFromPending, isPending } = useCompare();
  
  const isSelected = isInCompare(filament.id);
  const isPendingSelection = isPending(filament.id);
  const isCompareDisabled = isFull && !isSelected;

  const pricePerKg = resolved.pricePerKg;
  const maxValid = userCurrency === 'JPY' || userCurrency === 'KRW' ? 100000 : 500;
  const isValidPrice = pricePerKg && pricePerKg > 0 && pricePerKg < maxValid;

  const hasMultipleVariants = effectiveVariantIndicators.variantCount > 1;
  const hasPriceRange = hasMultipleVariants && 
    variantIndicators?.priceRange?.min !== null && 
    variantIndicators?.priceRange?.max !== null &&
    variantIndicators?.priceRange?.min !== variantIndicators?.priceRange?.max;

  const { confidence: priceConfidence, timeAgo, isStale } = usePriceFreshness(filament.last_scraped_at);
  
  const shouldShowPrice = !isStale && isValidPrice && pricePerKg;
  const isHighConfidence = priceConfidence === 'high' || priceConfidence === 'medium';

  const { score: overallScore, factors: scoreFactors, confidence: scoreConfidence, dataPointCount, label: scoreLabel } = useMemo(() => 
    calculateUnifiedScore(filament as FilamentForScoring),
    [filament]
  );
  
  const hasPrice = filament.variant_price !== null && filament.variant_price !== undefined;
  const hasTempSpecs = (filament.nozzle_temp_min_c || filament.nozzle_temp_max_c) && 
                       (filament.bed_temp_min_c || filament.bed_temp_max_c);
  const hasStrengthData = filament.tensile_strength_xy_mpa || filament.density_g_cm3;
  const hasAnyScore = filament.ease_of_printing_score || filament.strength_index || filament.printability_index;
  const hasMaterial = filament.material !== null && filament.material !== undefined;
  
  const hasLimitedData = !hasPrice || (!hasAnyScore && !hasTempSpecs && !hasStrengthData && !hasMaterial);

  const isBudgetFriendly = pricePerKg && pricePerKg < 20;

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
  const standoutFeature = getStandoutFeature(filament);
  
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

  const compactTimeAgo = getCompactTimeAgo(timeAgo);

  // === PLAN: Reliable color for swatch pill ===
  const reliableColor = getReliableColorHex(filament.color_hex, effectiveVariantIndicators.colors);
  const swatchTextColor = reliableColor ? getContrastTextColor(reliableColor) : '#ffffff';
  // Try to extract a color name from the product title
  const colorName = useMemo(() => {
    const title = filament.product_title || '';
    // Common color keywords — match last word-like color token
    const colorWords = ['Black', 'White', 'Red', 'Blue', 'Green', 'Yellow', 'Orange', 'Purple', 'Pink', 'Gray', 'Grey', 'Silver', 'Gold', 'Brown', 'Beige', 'Tan', 'Teal', 'Cyan', 'Magenta', 'Navy', 'Olive', 'Maroon', 'Coral', 'Salmon', 'Ivory', 'Clear', 'Transparent', 'Natural', 'Wood'];
    for (const c of colorWords) {
      if (title.toLowerCase().includes(c.toLowerCase())) return c;
    }
    return null;
  }, [filament.product_title]);

  // CTA state
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
        "filament-card-hover",
        isOutOfStock && "is-oos",
        "active:scale-[0.99] active:duration-[50ms]",
        "focus-within:ring-2 focus-within:ring-cyan-500/50 focus-within:ring-offset-2 focus-within:ring-offset-slate-900",
        "hover:-translate-y-1 hover:shadow-lg hover:shadow-black/30",
        isSelected && "border-2 border-primary bg-primary/5 border-l-[3px] border-l-amber-500",
        isPendingSelection && "border-2 border-primary/60 bg-primary/5 border-l-[3px] border-l-amber-500/60",
      )}
      style={{
        animation: `card-enter 0.4s cubic-bezier(0.4, 0, 0.2, 1) ${index * 0.1}s both`,
        ...(isOutOfStock ? { opacity: 0.82 } : {}),
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => {
        setIsHovered(false);
      }}
    >
      {/* === PLAN #2: TD Value Badge — top-left overlay === */}
      {filament.transmission_distance != null && (
        <div className="absolute top-3 left-3 z-10 bg-black/65 text-white text-[10px] font-semibold px-2 py-0.5 rounded">
          TD {filament.transmission_distance}
        </div>
      )}

      {/* === OOS Badge: centered overlay === */}
      {isOutOfStock && (
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 z-10 pointer-events-none">
          <span className="text-white text-[11px] font-semibold uppercase tracking-[0.05em] px-2 py-[3px] rounded whitespace-nowrap" style={{ backgroundColor: 'rgba(0,0,0,0.75)' }}>
            Out of Stock
          </span>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════
          COMPARE ICON BUTTON (Top-Right — visible on hover only)
          ═══════════════════════════════════════════════════════════════ */}
      <div className="absolute top-3 right-3 z-10">
        <button
          onClick={handleCompareToggle}
          disabled={isCompareDisabled}
          aria-label={isSelected ? "Remove from comparison" : `Add ${filament.product_title} to comparison`}
          className={cn(
            "w-8 h-8 rounded-lg flex items-center justify-center cursor-pointer",
            "transition-all duration-200 ease-out",
            isSelected || isPendingSelection
              ? "bg-amber-500 border border-amber-500 opacity-100"
              : cn(
                  "bg-card/80 border border-border backdrop-blur-sm",
                  "opacity-0 group-hover:opacity-100",
                ),
            isCompareDisabled && "opacity-30 cursor-not-allowed"
          )}
        >
          {isSelected || isPendingSelection ? (
            <Check className="w-4 h-4 text-black" strokeWidth={2.5} />
          ) : (
            <Columns className="w-4 h-4 text-muted-foreground" />
          )}
        </button>
      </div>

      {/* ═══════════════════════════════════════════════════════════════
          ELEMENT 1: Brand Row (logo + name + color swatch pill)
          ═══════════════════════════════════════════════════════════════ */}
       <div className="px-6 pt-4 pb-2 border-b border-border/30" data-card-element="1">
        {/* Brand row */}
        <div className="flex items-center gap-2 mb-2">
          <BrandLogo
            src={brandLogo}
            brandName={filament.vendor || "Unknown"}
            size="sm"
            className="rounded"
          />
          <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider truncate">
            {filament.vendor || "Unknown"}
          </span>
        </div>

        {/* Product Name */}
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
              <div 
                className="flex items-center gap-1 cursor-pointer mt-1.5" 
                role="group" 
                aria-label="Color variants"
                style={{ filter: isOutOfStock ? 'grayscale(0.55)' : undefined }}
              >
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
          ELEMENT 2: Badges Row — Color Swatch + Material + TD + Standout
          ═══════════════════════════════════════════════════════════════ */}
      <div className="px-6 py-3 flex flex-wrap items-center gap-2" data-card-element="2">
        {/* === Color swatch circle (28×28) === */}
        <Tooltip delayDuration={200}>
          <TooltipTrigger asChild>
            <div className="flex-shrink-0" style={{ filter: isOutOfStock ? 'grayscale(0.55)' : undefined }}>
              {reliableColor ? (
                <div 
                  className="w-7 h-7 rounded-full cursor-help ring-1 ring-border"
                  style={{ backgroundColor: reliableColor }}
                  role="img"
                  aria-label={`Color: ${colorName || reliableColor}`}
                />
              ) : (
                <div 
                  className="w-7 h-7 rounded-full bg-muted/50 ring-1 ring-border cursor-help"
                  style={{ backgroundImage: 'repeating-linear-gradient(45deg, transparent, transparent 3px, hsl(var(--muted-foreground) / 0.15) 3px, hsl(var(--muted-foreground) / 0.15) 4px)' }}
                  role="img"
                  aria-label="Color unknown"
                />
              )}
            </div>
          </TooltipTrigger>
          <TooltipContent
            side="top"
            className="text-xs border-0"
            style={{ backgroundColor: '#1a1a1a', color: '#ffffff', fontSize: '12px', borderRadius: '4px', padding: '4px 8px' }}
          >
            <p>{colorName ? `${colorName} — ${reliableColor}` : reliableColor || 'Unknown color'}</p>
          </TooltipContent>
        </Tooltip>

        {/* Material Badge */}
        {filament.material && (
          <div className={cn(
            "inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 border",
            getMaterialBadgeClass(filament.material)
          )}>
            <Layers className="w-3.5 h-3.5" />
            <span className="text-[13px] font-medium">{filament.material.split(" ")[0]}</span>
          </div>
        )}

        {/* "New" Badge */}
        {(filament as any).created_at && 
          (Date.now() - new Date((filament as any).created_at).getTime()) < 30 * 24 * 60 * 60 * 1000 && (
          <div className="inline-flex items-center rounded-full px-2 py-0.5 bg-emerald-500/20 text-emerald-400 text-xs font-semibold">
            New
          </div>
        )}
        
        {/* "Popular" Badge */}
        {filament.value_score != null && filament.value_score >= 8 && communityRating && communityRating.reviewCount > 0 && (
          <div className="inline-flex items-center rounded-full px-2 py-0.5 bg-amber-500/20 text-amber-400 text-xs font-semibold">
            Popular
          </div>
        )}
        
        {/* HueForge TD Badge */}
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
        
        {/* ONE Standout Feature Badge */}
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
          ELEMENT 3: Price Block
          ═══════════════════════════════════════════════════════════════ */}
      <div className="px-6 py-3" data-card-element="3">
        {(resolved.isLoading || isRatesLoading) ? (
          <div className="flex items-center gap-2">
            <Loader2 className="w-4 h-4 animate-spin text-primary" />
            <span className="text-sm text-muted-foreground">Loading rates...</span>
          </div>
        ) : shouldShowPrice ? (
          <div className="flex flex-col gap-1">
            {/* Crossed-out original price + discount pill when on sale */}
            {isDeal && priceTrend != null && pricePerKg && (
              <div className="flex items-center gap-2">
                <span className="text-[11px] text-muted-foreground line-through">
                  {formatPrice(pricePerKg / (1 + priceTrend / 100), { showApproximate: isConvertedPrice })}/kg
                </span>
                <span className="bg-red-500/20 text-red-400 text-xs font-bold px-2 py-0.5 rounded-full">
                  {Math.round(priceTrend)}%
                </span>
              </div>
            )}
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
              
              {/* Budget-Friendly Badge */}
              {isBudgetFriendly && (
                <div className="inline-flex items-center gap-1 bg-emerald-500/15 border border-emerald-500/30 rounded-md px-2 py-1">
                  <DollarSign className="w-3 h-3 text-emerald-400" />
                  <span className="text-[10px] font-semibold text-emerald-400">Budget</span>
                </div>
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

            {/* === PLAN #3: Freshness dot + hover-only timestamp === */}
            <div className="inline-flex items-center gap-1.5">
              <Tooltip delayDuration={300}>
                <TooltipTrigger asChild>
                  <span className={cn("w-2 h-2 rounded-full inline-block flex-shrink-0 cursor-help", getFreshnessDotColor(priceConfidence))} />
                </TooltipTrigger>
                <TooltipContent
                  side="top"
                  className="text-[12px] text-white px-2.5 py-1.5 rounded-md animate-in fade-in-0 duration-150"
                  style={{ backgroundColor: '#1a1a1a' }}
                >
                  {getFreshnessTooltipText(priceConfidence, timeAgo)}
                </TooltipContent>
              </Tooltip>
              {isHovered && compactTimeAgo && (
                <span className="text-[10px] text-muted-foreground animate-in fade-in-0 duration-150">
                  {compactTimeAgo}
                </span>
              )}
            </div>
            
            {/* Secondary local price when best price is international */}
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
          ELEMENT 4: Meta Row — FilaScore + Community Rating
          ═══════════════════════════════════════════════════════════════ */}
      <div className="px-6 py-2 flex items-center gap-2 flex-wrap" data-card-element="4">
        {/* Community Rating */}
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

        {/* Vertical divider */}
        {communityRating && communityRating.reviewCount > 0 && overallScore !== null && !(scoreConfidence === 'low' && hasLimitedData) && (
          <div className="h-4 border-r border-border/50" />
        )}

        {/* FilaScore — compact horizontal bar */}
        {overallScore !== null && scoreConfidence === 'low' ? (
          <div className="inline-flex items-center gap-1 bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-xs font-semibold px-2.5 py-0.5 rounded-full">
            <Check className="w-3.5 h-3.5" />
            Verified specs
          </div>
        ) : overallScore !== null && !(scoreConfidence === 'low' && hasLimitedData) ? (
          <>
          <Tooltip delayDuration={200}>
            <TooltipTrigger asChild>
              <div className="inline-flex items-center gap-2 cursor-help" role="img" aria-label={`FilaScore: ${overallScore.toFixed(1)} out of 10`}>
                <div className="w-16 h-1.5 rounded-full bg-muted/50 overflow-hidden">
                  <div 
                    className="h-full rounded-full transition-all"
                    style={{ 
                      width: `${(overallScore / 10) * 100}%`,
                      backgroundColor: overallScore >= 8 ? '#6366f1' : overallScore >= 6.5 ? '#22c55e' : overallScore >= 4 ? '#f59e0b' : '#ef4444'
                    }}
                  />
                </div>
                <span className="text-[11px] font-semibold" style={{ color: overallScore >= 8 ? '#6366f1' : overallScore >= 6.5 ? '#22c55e' : overallScore >= 4 ? '#f59e0b' : '#ef4444' }}>
                  {overallScore.toFixed(1)}
                </span>
              </div>
            </TooltipTrigger>
            <TooltipContent side="top" className="text-xs max-w-[260px]">
              <p className="font-medium mb-1">FilaScore: {overallScore.toFixed(1)}/10</p>
              <p className="text-muted-foreground">Combines community ratings, spec quality, and price value.</p>
            </TooltipContent>
          </Tooltip>
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
      </div>

      </div>{/* End flex-grow wrapper */}

      {/* ═══════════════════════════════════════════════════════════════
          ELEMENT 5: CTA Button (single — no compare button here)
          ═══════════════════════════════════════════════════════════════ */}
      <div className="px-6 py-4 flex flex-col gap-2" data-card-element="5">
        <Button
          asChild
          variant={isOutOfStock ? "ghost" : "default"}
          className={cn(
            "w-full h-10 rounded-lg font-semibold transition-all duration-200",
            isOutOfStock
              ? "bg-transparent text-white hover:bg-white/10"
              : "bg-amber-500 text-black hover:bg-amber-400 hover:-translate-y-0 hover:shadow-none",
            "active:scale-[0.98]"
          )}
          style={isOutOfStock ? { border: '1px solid rgba(255,255,255,0.3)' } : undefined}
        >
          <Link to={`${filamentHref}${ctaTab}`} aria-label={`${ctaText} for ${filament.product_title}`}>
            {ctaText}
            <ArrowRight className="w-[18px] h-[18px] ml-2" />
          </Link>
        </Button>
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
