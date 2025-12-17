import React, { useState } from "react";
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
  XCircle
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { getBrandLogo } from "@/lib/brandLogos";
import { useCompare } from "@/hooks/useCompare";

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
}

interface FilamentCardProps {
  filament: Filament;
  colorMatchPercent?: number | null;
  priceTrend?: number | null;
  index?: number;
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

export function FilamentCard({ filament, colorMatchPercent, index = 0 }: FilamentCardProps) {
  const isOutOfStock = filament.variant_available === false;
  const [isHovered, setIsHovered] = useState(false);
  const [showTooltip, setShowTooltip] = useState(false);
  const [imageError, setImageError] = useState(false);
  
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

  // Calculate price per kg
  const packQty = filament.pack_quantity || 1;
  const weightKg = filament.net_weight_g ? filament.net_weight_g / 1000 : null;
  const pricePerKg = (filament.variant_price && weightKg)
    ? filament.variant_price / (weightKg * packQty)
    : null;
  const isValidPrice = pricePerKg && pricePerKg > 0 && pricePerKg < 500;

  // Score
  const overallScore = filament.value_score || 7.0;
  
  // Check for limited data
  const dataPoints = [
    filament.ease_of_printing_score,
    filament.strength_index,
    filament.printability_index,
    filament.variant_price,
  ].filter(v => v !== null && v !== undefined);
  const hasLimitedData = dataPoints.length < 3;

  // Budget-friendly threshold
  const isBudgetFriendly = pricePerKg && pricePerKg < 20;

  // Display title without brand name
  const getDisplayTitle = () => {
    const title = filament.product_title || "";
    const vendor = filament.vendor || "";
    if (vendor && title.toLowerCase().startsWith(vendor.toLowerCase())) {
      return title.slice(vendor.length).trim();
    }
    return title;
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
        "group relative rounded-2xl transition-all duration-300 min-h-[340px]",
        "bg-white/[0.03] border border-white/[0.08]",
        "focus-within:ring-2 focus-within:ring-primary focus-within:ring-offset-2 focus-within:ring-offset-background",
        isHovered && !isOutOfStock && "transform -translate-y-1 shadow-[0_12px_24px_rgba(0,0,0,0.3)] border-primary/30",
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

      {/* Stock Status Indicator - Hover Only (top-right corner) */}
      {isHovered && !isOutOfStock && filament.variant_available === true && (
        <div className="absolute top-4 right-4 z-10 animate-fadeIn">
          <div className="inline-flex items-center gap-1 bg-emerald-500/20 border border-emerald-500/40 rounded-md px-2 py-1">
            <CheckCircle className="w-3 h-3 text-emerald-400" />
            <span className="text-[10px] font-semibold text-emerald-400">In Stock</span>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════
          CHECKBOX (Top-Left - Not counted in 5 elements)
          ═══════════════════════════════════════════════════════════════ */}
      <div 
        className="absolute top-4 left-4 z-10"
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
            "w-6 h-6 rounded-md border-2 flex items-center justify-center transition-all duration-200 cursor-pointer",
            isSelected || isPendingSelection
              ? "bg-primary border-primary"
              : "bg-black/30 border-white/30 hover:border-primary hover:bg-primary/10",
            isCompareDisabled && "opacity-50 cursor-not-allowed"
          )}
        >
          {(isSelected || isPendingSelection) && (
            <Check className="w-4 h-4 text-background" strokeWidth={3} />
          )}
        </button>
        
        {/* Tooltip */}
        {showTooltip && !isSelected && !isCompareDisabled && (
          <div className="absolute top-full left-0 mt-2 px-2.5 py-1.5 bg-slate-800 text-white text-xs rounded-md whitespace-nowrap z-20">
            Add to compare (max 6)
          </div>
        )}
      </div>

      {/* ═══════════════════════════════════════════════════════════════
          ELEMENT 1: Brand + Product Name
          ═══════════════════════════════════════════════════════════════ */}
      <div className="px-6 pt-6 pb-3 border-b border-white/[0.05]" data-card-element="1">
        {/* Brand */}
        <div className="flex items-center gap-2 mb-2 pl-8">
          {brandLogo && !imageError ? (
            <img 
              src={brandLogo} 
              alt={`${filament.vendor} logo`}
              className="w-5 h-5 rounded object-contain"
              onError={() => setImageError(true)}
            />
          ) : null}
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
            {filament.vendor || "Unknown"}
          </span>
        </div>
        
        {/* Product Name + Color Swatch */}
        <div className="flex items-start gap-2 pl-8">
          <h3 className="text-lg font-semibold text-white leading-tight line-clamp-2 flex-1">
            {getDisplayTitle()}
          </h3>
          {filament.color_hex && (
            <div 
              className="w-4 h-4 rounded-full border-2 border-white/20 flex-shrink-0 mt-1"
              style={{ backgroundColor: filament.color_hex.startsWith('#') ? filament.color_hex : `#${filament.color_hex}` }}
            />
          )}
        </div>
        
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
        {/* Rating Badge */}
        <div className="inline-flex items-center gap-1.5 bg-primary/[0.12] border border-primary/30 rounded-lg px-3 py-1.5">
          <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
          <span className="text-lg font-bold text-white">{overallScore.toFixed(1)}</span>
          <span className="text-sm font-medium text-slate-400">/10</span>
        </div>
        
        {/* Limited Data Badge (inline with rating) */}
        {hasLimitedData && (
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="inline-flex items-center gap-1 bg-slate-500/15 border border-slate-500/30 rounded-md px-2 py-1 cursor-help">
                <Info className="w-3 h-3 text-slate-400" />
                <span className="text-[10px] font-medium text-slate-400">Limited Data</span>
              </div>
            </TooltipTrigger>
            <TooltipContent side="top" className="text-xs max-w-[200px]">
              Score based on limited specifications - may not be fully representative
            </TooltipContent>
          </Tooltip>
        )}
      </div>

      {/* ═══════════════════════════════════════════════════════════════
          ELEMENT 3: Price
          ═══════════════════════════════════════════════════════════════ */}
      <div className="px-6 py-3" data-card-element="3">
        {isValidPrice && pricePerKg ? (
          <div className="flex items-center gap-3">
            <div className="flex items-baseline gap-1">
              <span className="text-[28px] font-bold text-white leading-none">
                ${pricePerKg.toFixed(2)}
              </span>
              <span className="text-sm font-medium text-slate-400">/kg</span>
            </div>
            
            {/* Budget-Friendly Badge (inline with price) */}
            {isBudgetFriendly && (
              <div className="inline-flex items-center gap-1 bg-emerald-500/15 border border-emerald-500/30 rounded-md px-2 py-1">
                <DollarSign className="w-3 h-3 text-emerald-400" />
                <span className="text-[10px] font-medium text-emerald-400">Budget</span>
              </div>
            )}
          </div>
        ) : (
          <span className="text-lg text-slate-500">Price unavailable</span>
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
      </div>

      {/* ═══════════════════════════════════════════════════════════════
          ELEMENT 5: CTA Button
          ═══════════════════════════════════════════════════════════════ */}
      <div className="px-6 py-4 flex justify-center" data-card-element="5">
        <Button
          asChild
          className={cn(
            "w-full h-11 font-semibold transition-all duration-200",
            "bg-transparent border-2 border-primary/40 text-primary",
            "hover:bg-primary/[0.12] hover:border-primary hover:translate-x-0.5",
            "active:scale-[0.98]"
          )}
        >
          <Link to={`/filament/${filament.id}`} aria-label={`View details for ${filament.product_title}`}>
            View Details
            <ArrowRight className="w-[18px] h-[18px] ml-2" />
          </Link>
        </Button>
      </div>
    </div>
  );
}

export default FilamentCard;
