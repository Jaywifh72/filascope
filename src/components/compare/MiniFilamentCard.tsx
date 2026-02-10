import { X, ImageOff, GripVertical, AlertCircle, RefreshCw, ShoppingCart } from "lucide-react";
import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";
import { getBrandLogo } from "@/lib/brandLogos";
import { BrandLogo } from "@/components/ui/BrandLogo";
import { CompareItem } from "@/hooks/useCompare";
import { Button } from "@/components/ui/button";
import { cleanFilamentDisplayName } from "@/lib/productNameUtils";
import { useResolvedPrice } from "@/hooks/useResolvedPrice";
import { useAffiliateLinks } from "@/hooks/useAffiliateLinks";
import { getRegionalUrlForCurrency } from "@/hooks/useRegionalPrice";
import { useRegion } from "@/contexts/RegionContext";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

// WCAG 2.1 AA compliant - increased text lightness for 4.5:1 contrast on dark bg
const MATERIAL_BADGE_COLORS: Record<string, string> = {
  "PLA": "bg-blue-500/20 text-blue-300",
  "PETG": "bg-teal-500/20 text-teal-300",
  "ABS": "bg-orange-500/20 text-orange-300",
  "ASA": "bg-red-500/20 text-red-300",
  "TPU": "bg-purple-500/20 text-purple-300",
  "Nylon": "bg-green-500/20 text-green-300",
  "PC": "bg-gray-500/20 text-gray-300",
};

function getMaterialBadgeClass(material: string | null): string {
  if (!material) return "bg-muted text-muted-foreground";
  const baseMaterial = material.split(/[\s\-+]/)[0]?.toUpperCase() || "";
  return MATERIAL_BADGE_COLORS[baseMaterial] || "bg-primary/20 text-primary";
}

interface MiniFilamentCardProps {
  item: CompareItem;
  onRemove: (id: string) => void;
  onSwapUnavailable?: (id: string) => void;
  isNew?: boolean;
  isDragging?: boolean;
  isDragOver?: boolean;
  isDuplicatePulse?: boolean;
  isFocused?: boolean;
  isFiltered?: boolean;
  dragDirection?: 'left' | 'right';
  onDragStart?: () => void;
  onDragOver?: (e: React.DragEvent) => void;
  onDragLeave?: () => void;
  onDrop?: () => void;
  onDragEnd?: () => void;
  cardIndex?: number;
}

export function MiniFilamentCard({ 
  item, 
  onRemove,
  onSwapUnavailable,
  isNew,
  isDragging,
  isDragOver,
  isDuplicatePulse,
  isFocused,
  isFiltered,
  dragDirection,
  onDragStart,
  onDragOver,
  onDragLeave,
  onDrop,
  onDragEnd,
  cardIndex,
}: MiniFilamentCardProps) {
  const { getAffiliateUrl } = useAffiliateLinks();
  const { currency } = useRegion();
  const brandLogo = item.vendor ? getBrandLogo(item.vendor) : null;
  
  // Use the canonical resolved price hook for regional pricing
  const resolved = useResolvedPrice(item as any);
  
  // Get regional URL for affiliate link
  const regionalUrl = getRegionalUrlForCurrency(item as any, currency);
  const affiliateUrl = regionalUrl
    ? getAffiliateUrl(regionalUrl, item.vendor)
    : null;

  // Clean title - remove brand name and size/weight suffixes
  const cleanTitle = cleanFilamentDisplayName(
    item.product_title?.replace(new RegExp(`^${item.vendor}\\s*`, 'i'), '').trim() || item.product_title
  );

  // Unavailable state
  if (item.unavailable) {
    return (
      <div 
        className="relative w-[200px] h-[110px] flex-shrink-0 bg-muted/50 rounded-lg border border-border/30 p-3"
      >
        <div className="absolute inset-0 bg-muted/80 rounded-lg flex items-center justify-center flex-col gap-2 z-10">
          <AlertCircle className="w-5 h-5 text-amber-500" />
          <span className="text-xs text-muted-foreground text-center">No longer available</span>
          <div className="flex gap-2">
            {onSwapUnavailable && (
              <Button 
                size="sm" 
                variant="outline" 
                className="h-6 px-2 text-xs"
                onClick={() => onSwapUnavailable(item.id)}
              >
                <RefreshCw className="w-3 h-3 mr-1" />
                Swap
              </Button>
            )}
            <Button 
              size="sm" 
              variant="ghost" 
              className="h-6 px-2 text-xs"
              onClick={() => onRemove(item.id)}
            >
              Remove
            </Button>
          </div>
        </div>
        <p className="text-xs text-muted-foreground line-clamp-2 opacity-50">
          {cleanTitle}
        </p>
      </div>
    );
  }

  return (
    <div 
      draggable
      onDragStart={onDragStart}
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      onDrop={onDrop}
      onDragEnd={onDragEnd}
      className={cn(
        "relative group/mini w-[200px] h-[110px] flex-shrink-0 bg-card/80 rounded-lg border border-border/50 p-3",
        "transition-all duration-200 cursor-grab",
        "hover:border-primary/40 hover:shadow-lg hover:-translate-y-0.5",
        isNew && "mini-card-enter",
        isDragging && "mini-card-dragging opacity-90",
        isDragOver && dragDirection === 'right' && "mini-card-drag-over",
        isDragOver && dragDirection === 'left' && "mini-card-drag-left",
        isDuplicatePulse && "duplicate-pulse",
        isFocused && "ring-2 ring-primary ring-offset-2 ring-offset-background",
        isFiltered && "opacity-40"
      )}
    >
      {/* Drag Handle - Always visible with grip icon */}
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <div 
              className={cn(
                "absolute top-1 left-1 p-0.5 rounded cursor-grab active:cursor-grabbing",
                "opacity-40 group-hover/mini:opacity-100 transition-all",
                "hover:bg-muted/50",
                isDragging && "opacity-100 bg-primary/20"
              )}
              role="button"
              aria-label="Drag to reorder"
              tabIndex={0}
            >
              <GripVertical className="w-3.5 h-3.5 text-muted-foreground" aria-hidden="true" />
              <span className="sr-only">Drag handle</span>
            </div>
          </TooltipTrigger>
          <TooltipContent side="top" className="text-xs">
            Drag to reorder
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>

      {/* Drop Zone Indicator */}
      {isDragOver && (
        <div className={cn(
          "absolute inset-y-0 w-1 bg-primary rounded-full transition-all",
          dragDirection === 'right' ? "-right-2" : "-left-2"
        )} />
      )}

      {/* Remove Button */}
      <button
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          onRemove(item.id);
        }}
        className="absolute -top-2 -right-2 w-5 h-5 rounded-full bg-destructive/80 text-destructive-foreground flex items-center justify-center opacity-0 group-hover/mini:opacity-100 transition-opacity z-10 hover:bg-destructive"
        aria-label="Remove from comparison"
      >
        <X className="w-3 h-3" />
      </button>

      <Link to={`/filament/${item.id}`} className="flex flex-col h-full" draggable={false}>
        {/* Header: Brand + Material */}
        <div className="flex items-center gap-2 mb-1.5">
          <BrandLogo src={brandLogo} brandName={item.vendor || ''} size="sm" />
          {item.material && (
            <span className={cn(
              "text-[10px] font-medium px-1.5 py-0.5 rounded",
              getMaterialBadgeClass(item.material)
            )}>
              {item.material}
            </span>
          )}
          {item.color_hex && (
            <div 
              className="w-4 h-4 rounded-full border border-border/50 ml-auto" 
              style={{ backgroundColor: item.color_hex }}
              title={item.color_hex}
            />
          )}
        </div>

        {/* Title */}
        <p className="text-xs font-medium text-foreground line-clamp-2 flex-1 leading-tight">
          {cleanTitle}
        </p>

        {/* Price & Quick Buy */}
        <div className="flex items-center justify-between mt-auto gap-2">
          {resolved.formattedPricePerKg && (
            <p className="text-sm font-mono font-bold text-primary">
              {resolved.formattedPricePerKg}/kg
            </p>
          )}
          {affiliateUrl && (
            <a
              href={affiliateUrl}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              draggable={false}
              className="opacity-0 group-hover/mini:opacity-100 transition-opacity p-1.5 rounded-md bg-primary/20 hover:bg-primary/30 text-primary"
              aria-label={`Buy ${item.product_title} from ${item.vendor}`}
            >
              <ShoppingCart className="w-3.5 h-3.5" aria-hidden="true" />
            </a>
          )}
        </div>
      </Link>
    </div>
  );
}
