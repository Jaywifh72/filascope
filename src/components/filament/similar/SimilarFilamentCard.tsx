import { useState } from "react";
import { Link } from "react-router-dom";
import { Star, ThermometerSun, Check, Plus, TrendingDown, TrendingUp } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useCompare } from "@/hooks/useCompare";
import { getBrandLogo } from "@/lib/brandLogos";
import { RegionalPrice } from "@/components/price/RegionalPrice";
import { useRegion } from "@/contexts/RegionContext";
import { computePricePerKg } from "@/lib/resolveFilamentPrice";
import { cn } from "@/lib/utils";
import { FilamentImageFallback } from "@/components/ui/FilamentImageFallback";

export type SimilarityReason = 
  | "same_material" 
  | "same_brand" 
  | "similar_price" 
  | "budget_pick"
  | "premium_pick"
  | "same_color";

export interface SimilarFilamentData {
  id: string;
  product_title: string;
  vendor: string | null;
  material: string | null;
  variant_price: number | null;
  net_weight_g: number | null;
  color_hex: string | null;
  color_family: string | null;
  featured_image: string | null;
  nozzle_temp_min_c: number | null;
  nozzle_temp_max_c: number | null;
  ease_of_printing_score: number | null;
  similarityReason?: SimilarityReason;
  isCurrent?: boolean;
}

interface SimilarFilamentCardProps {
  filament: SimilarFilamentData;
  showCompareToggle?: boolean;
  /** Current product's price per kg in USD for diff calculation */
  currentPricePerKg?: number | null;
}

const REASON_BADGES: Record<SimilarityReason, { label: string; className: string }> = {
  same_material: { label: "Same Material", className: "bg-violet-500/20 text-violet-400 border-violet-500/30" },
  same_brand: { label: "Same Brand", className: "bg-blue-500/20 text-blue-400 border-blue-500/30" },
  similar_price: { label: "Similar Price", className: "bg-green-500/20 text-green-400 border-green-500/30" },
  budget_pick: { label: "Budget Pick", className: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30" },
  premium_pick: { label: "Premium", className: "bg-amber-500/20 text-amber-400 border-amber-500/30" },
  same_color: { label: "Same Color", className: "bg-pink-500/20 text-pink-400 border-pink-500/30" },
};

const MATERIAL_COLORS: Record<string, string> = {
  PLA: "bg-violet-500/20 text-violet-400 border-violet-500/30",
  PETG: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  ABS: "bg-orange-500/20 text-orange-400 border-orange-500/30",
  ASA: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
  TPU: "bg-cyan-500/20 text-cyan-400 border-cyan-500/30",
  NYLON: "bg-indigo-500/20 text-indigo-400 border-indigo-500/30",
  PC: "bg-red-500/20 text-red-400 border-red-500/30",
};

function getMaterialColor(material: string | null): string {
  if (!material) return "bg-muted text-muted-foreground border-border";
  const base = material.split(/[\s-]/)[0].toUpperCase();
  return MATERIAL_COLORS[base] || "bg-violet-500/20 text-violet-400 border-violet-500/30";
}

export function SimilarFilamentCard({ filament, showCompareToggle = true, currentPricePerKg }: SimilarFilamentCardProps) {
  const [imageError, setImageError] = useState(false);
  const { items, addItem, removeItem } = useCompare();
  const { currency, convertPrice, hasRates, formatPrice } = useRegion();
  
  const isInCompare = items.some((item) => item.id === filament.id);
  const brandLogo = getBrandLogo(filament.vendor);
  
  // Calculate price per kg using canonical utility
  const pricePerKg = filament.variant_price
    ? computePricePerKg(filament.variant_price, filament.net_weight_g, (filament as any).pack_quantity)
    : null;

  // Calculate price difference in user's currency
  const priceDiff = (() => {
    if (!pricePerKg || !currentPricePerKg || !hasRates) return null;
    const thisConverted = convertPrice(pricePerKg, "USD");
    const currentConverted = convertPrice(currentPricePerKg, "USD");
    const diff = thisConverted - currentConverted;
    if (Math.abs(diff) < 0.5) return null; // Ignore trivial differences
    return { amount: diff, formatted: formatPrice(Math.abs(diff), { compact: true }) };
  })();
  
  // Format nozzle temp range
  const nozzleTempRange = filament.nozzle_temp_min_c && filament.nozzle_temp_max_c
    ? `${filament.nozzle_temp_min_c}-${filament.nozzle_temp_max_c}°C`
    : filament.nozzle_temp_min_c
      ? `${filament.nozzle_temp_min_c}°C`
      : null;
  
  // Get base material for badge
  const materialBase = filament.material?.split(/[\s-]/)[0] || filament.material;
  
  const handleCompareToggle = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (isInCompare) {
      removeItem(filament.id);
    } else {
      addItem({
        id: filament.id,
        product_title: filament.product_title,
        vendor: filament.vendor,
        material: filament.material,
        color_hex: filament.color_hex,
        variant_price: filament.variant_price,
        net_weight_g: filament.net_weight_g,
        featured_image: filament.featured_image,
      });
    }
  };

  const cardContent = (
    <div
      className={cn(
        "group relative w-[240px] flex-shrink-0 rounded-xl border bg-card/80 backdrop-blur-sm p-4",
        "transition-all duration-200",
        "hover:scale-[1.02] hover:shadow-lg hover:shadow-primary/10",
        filament.isCurrent
          ? "border-primary shadow-lg shadow-primary/20 ring-2 ring-primary/30"
          : "border-border/50 hover:border-primary/50"
      )}
    >
      {/* Compare Checkbox */}
      {showCompareToggle && !filament.isCurrent && (
        <div
          className="absolute top-3 right-3 z-10"
          onClick={handleCompareToggle}
        >
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <div
                  className={cn(
                    "w-6 h-6 rounded-full border-2 flex items-center justify-center cursor-pointer transition-all",
                    isInCompare
                      ? "bg-primary border-primary text-primary-foreground shadow-lg shadow-primary/30"
                      : "bg-background/80 border-muted-foreground/30 hover:border-primary/50"
                  )}
                >
                  {isInCompare ? (
                    <Check className="w-3.5 h-3.5" />
                  ) : (
                    <Plus className="w-3.5 h-3.5 text-muted-foreground" />
                  )}
                </div>
              </TooltipTrigger>
              <TooltipContent side="left">
                {isInCompare ? "Remove from compare" : "Quick Add to Compare"}
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      )}

      {/* Current Indicator */}
      {filament.isCurrent && (
        <Badge className="absolute top-3 right-3 bg-primary text-primary-foreground text-xs">
          Current
        </Badge>
      )}

      {/* Why Similar Badge */}
      {filament.similarityReason && !filament.isCurrent && (
        <div className="absolute -top-2.5 left-3 z-10">
          <Badge
            variant="outline"
            className={cn("text-xs font-medium", REASON_BADGES[filament.similarityReason].className)}
          >
            {REASON_BADGES[filament.similarityReason].label}
          </Badge>
        </div>
      )}

      {/* Brand Logo */}
      <div className="flex items-center justify-between mb-3 mt-1">
        {brandLogo ? (
          <img
            src={brandLogo}
            alt={filament.vendor || "Brand"}
            className="h-5 w-auto object-contain max-w-[80px] opacity-80"
          />
        ) : (
          <div className="h-5 w-5 rounded bg-muted flex items-center justify-center text-xs font-medium text-muted-foreground">
            {filament.vendor?.charAt(0) || "?"}
          </div>
        )}
        
        {/* Material Badge */}
        <Badge variant="outline" className={cn("text-xs", getMaterialColor(filament.material))}>
          {materialBase || "Unknown"}
        </Badge>
      </div>

      {/* Product Image */}
      <div className="aspect-square w-full mb-3 rounded-lg bg-muted/30 overflow-hidden">
        {filament.featured_image && !imageError ? (
          <img
            src={filament.featured_image}
            alt={filament.product_title}
            className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-300"
            onError={() => setImageError(true)}
            loading="lazy"
          />
        ) : (
          <FilamentImageFallback
            colorHex={filament.color_hex}
            material={filament.material}
            size="md"
          />
        )}
      </div>

      {/* Product Title */}
      <h4 className="text-sm font-semibold text-foreground line-clamp-2 mb-2 group-hover:text-primary transition-colors">
        {filament.product_title}
      </h4>

      {/* Price with regional conversion */}
      {pricePerKg && (
        <div className="mb-1">
          <RegionalPrice
            amount={pricePerKg}
            sourceCurrency="USD"
            size="lg"
            suffix="/kg"
          />
        </div>
      )}

      {/* Price difference indicator */}
      {priceDiff && !filament.isCurrent && (
        <div className={cn(
          "flex items-center gap-1 text-xs font-medium mb-2",
          priceDiff.amount < 0 ? "text-green-400" : "text-amber-400"
        )}>
          {priceDiff.amount < 0 ? (
            <>
              <TrendingDown className="w-3 h-3" />
              <span>{priceDiff.formatted} cheaper</span>
            </>
          ) : (
            <>
              <TrendingUp className="w-3 h-3" />
              <span>{priceDiff.formatted} more</span>
            </>
          )}
        </div>
      )}

      {/* Nozzle Temp */}
      {nozzleTempRange && (
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-3">
          <ThermometerSun className="w-3.5 h-3.5 text-primary" />
          <span>{nozzleTempRange}</span>
        </div>
      )}

      {/* Rating */}
      {filament.ease_of_printing_score && (
        <div className="flex items-center gap-1 mb-3">
          <Star className="w-4 h-4 fill-[#FFB800] text-[#FFB800] drop-shadow-[0_0_4px_rgba(255,184,0,0.6)]" />
          <span className="text-xs text-muted-foreground">
            {filament.ease_of_printing_score.toFixed(1)} Ease of Print
          </span>
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-2">
        <Button
          variant="default"
          size="sm"
          className="flex-1 bg-primary hover:bg-primary/80 text-primary-foreground transition-colors duration-200"
        >
          View Details
        </Button>
        {showCompareToggle && !filament.isCurrent && (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleCompareToggle}
                  className={cn(
                    "px-2 transition-all",
                    isInCompare 
                      ? "border-primary text-primary hover:bg-primary/10" 
                      : "border-border hover:border-primary/50"
                  )}
                >
                  {isInCompare ? <Check className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                {isInCompare ? "Remove from compare" : "Quick Add to Compare"}
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}
      </div>
    </div>
  );

  if (filament.isCurrent) {
    return cardContent;
  }

  return (
    <Link to={`/filament/${filament.id}`} className="block">
      {cardContent}
    </Link>
  );
}
