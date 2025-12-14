import { X, ImageOff } from "lucide-react";
import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";
import { getBrandLogo } from "@/lib/brandLogos";
import { CompareItem } from "@/hooks/useCompare";

const MATERIAL_BADGE_COLORS: Record<string, string> = {
  "PLA": "bg-blue-500/20 text-blue-400",
  "PETG": "bg-teal-500/20 text-teal-400",
  "ABS": "bg-orange-500/20 text-orange-400",
  "ASA": "bg-red-500/20 text-red-400",
  "TPU": "bg-purple-500/20 text-purple-400",
  "Nylon": "bg-green-500/20 text-green-400",
  "PC": "bg-gray-500/20 text-gray-400",
};

function getMaterialBadgeClass(material: string | null): string {
  if (!material) return "bg-muted text-muted-foreground";
  const baseMaterial = material.split(/[\s\-+]/)[0]?.toUpperCase() || "";
  return MATERIAL_BADGE_COLORS[baseMaterial] || "bg-primary/20 text-primary";
}

interface MiniFilamentCardProps {
  item: CompareItem;
  onRemove: (id: string) => void;
}

export function MiniFilamentCard({ item, onRemove }: MiniFilamentCardProps) {
  const brandLogo = item.vendor ? getBrandLogo(item.vendor) : null;
  const pricePerKg = item.variant_price && item.net_weight_g 
    ? item.variant_price / (item.net_weight_g / 1000) 
    : null;

  // Clean title - remove brand name if present
  const cleanTitle = item.product_title
    ?.replace(new RegExp(`^${item.vendor}\\s*`, 'i'), '')
    .trim() || item.product_title;

  return (
    <div className="relative group/mini w-[200px] h-[110px] flex-shrink-0 bg-card/80 rounded-lg border border-border/50 p-3 transition-all duration-200 hover:border-primary/40 hover:shadow-lg hover:-translate-y-0.5">
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

      <Link to={`/filament/${item.id}`} className="flex flex-col h-full">
        {/* Header: Brand + Material */}
        <div className="flex items-center gap-2 mb-1.5">
          {brandLogo ? (
            <img 
              src={brandLogo} 
              alt={item.vendor || ''} 
              className="w-5 h-5 object-contain rounded"
            />
          ) : (
            <div className="w-5 h-5 rounded bg-muted flex items-center justify-center">
              <ImageOff className="w-3 h-3 text-muted-foreground" />
            </div>
          )}
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

        {/* Price */}
        {pricePerKg && pricePerKg > 0 && pricePerKg < 500 && (
          <p className="text-sm font-mono font-bold text-primary mt-auto">
            ${pricePerKg.toFixed(2)}/kg
          </p>
        )}
      </Link>
    </div>
  );
}
