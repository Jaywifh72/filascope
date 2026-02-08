import { useState } from "react";
import { Link } from "react-router-dom";
import { formatDistanceToNow } from "date-fns";
import {
  Heart,
  ShoppingBag,
  Star,
  FileText,
  Bell,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { QuickRateStars } from "./QuickRateStars";
import { LibraryProductDetail } from "./LibraryProductDetail";
import type { LibraryProduct } from "@/hooks/useFilamentLibrary";

interface LibraryProductRowProps {
  product: LibraryProduct;
  onQuickRate: (productId: string, rating: number) => void;
  isRating: boolean;
}

export function LibraryProductRow({ product, onQuickRate, isRating }: LibraryProductRowProps) {
  const [expanded, setExpanded] = useState(false);

  const canQuickRate = (product.wishlisted || product.purchased) && !product.reviewed;

  return (
    <div
      className={cn(
        "rounded-xl border border-border/40 bg-card/50 overflow-hidden transition-all",
        expanded && "border-primary/20 shadow-sm",
      )}
    >
      {/* Main Row */}
      <button
        type="button"
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center gap-3 p-3 sm:p-4 text-left hover:bg-muted/30 transition-colors"
      >
        {/* Product Image */}
        <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-lg overflow-hidden shrink-0 bg-muted/40 flex items-center justify-center">
          {product.featured_image ? (
            <img
              src={product.featured_image}
              alt=""
              className="w-full h-full object-cover"
              loading="lazy"
            />
          ) : product.color_hex ? (
            <div
              className="w-full h-full"
              style={{ backgroundColor: product.color_hex }}
            />
          ) : (
            <div className="w-full h-full bg-muted" />
          )}
        </div>

        {/* Product Info */}
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-foreground truncate">
            {product.product_title}
          </p>
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground mt-0.5">
            {product.vendor && <span>{product.vendor}</span>}
            {product.vendor && product.material && <span>·</span>}
            {product.material && <span>{product.material}</span>}
          </div>
        </div>

        {/* Interaction Icons */}
        <div className="flex items-center gap-1 shrink-0">
          {product.wishlisted && (
            <Heart className="w-3.5 h-3.5 fill-pink-400 text-pink-400" aria-label="Wishlisted" />
          )}
          {product.purchased && (
            <ShoppingBag className="w-3.5 h-3.5 text-emerald-400" aria-label="Purchased" />
          )}
          {product.reviewed && (
            <Star className="w-3.5 h-3.5 fill-[#FFB800] text-[#FFB800]" aria-label="Reviewed" />
          )}
          {product.hasNote && (
            <FileText className="w-3.5 h-3.5 text-blue-400" aria-label="Has note" />
          )}
          {product.hasAlert && (
            <Bell className="w-3.5 h-3.5 text-orange-400" aria-label="Has alert" />
          )}
        </div>

        {/* Rating or Quick Rate */}
        <div className="shrink-0 hidden sm:block" onClick={(e) => e.stopPropagation()}>
          {canQuickRate ? (
            <QuickRateStars
              currentRating={null}
              onRate={(r) => onQuickRate(product.filament_id, r)}
              disabled={isRating}
              size={14}
            />
          ) : product.rating ? (
            <div className="flex items-center gap-0.5">
              <Star className="w-3.5 h-3.5 fill-[#FFB800] text-[#FFB800]" />
              <span className="text-xs font-medium tabular-nums">{product.rating}</span>
            </div>
          ) : (
            <span className="text-[11px] text-muted-foreground">Not rated</span>
          )}
        </div>

        {/* Price */}
        <div className="shrink-0 hidden md:block w-16 text-right">
          {product.current_price ? (
            <span className="text-sm font-medium tabular-nums">
              ${product.current_price.toFixed(2)}
            </span>
          ) : (
            <span className="text-xs text-muted-foreground">—</span>
          )}
        </div>

        {/* Last Interacted */}
        <div className="shrink-0 hidden lg:block w-24 text-right">
          <span className="text-[11px] text-muted-foreground">
            {formatDistanceToNow(new Date(product.lastInteracted), { addSuffix: true })}
          </span>
        </div>

        {/* Expand toggle */}
        <div className="shrink-0 ml-1">
          {expanded ? (
            <ChevronUp className="w-4 h-4 text-muted-foreground" />
          ) : (
            <ChevronDown className="w-4 h-4 text-muted-foreground" />
          )}
        </div>
      </button>

      {/* Mobile: Quick Rate + Price row */}
      <div className="flex items-center justify-between px-4 pb-2 sm:hidden">
        <div onClick={(e) => e.stopPropagation()}>
          {canQuickRate ? (
            <QuickRateStars
              currentRating={null}
              onRate={(r) => onQuickRate(product.filament_id, r)}
              disabled={isRating}
              size={14}
            />
          ) : product.rating ? (
            <div className="flex items-center gap-0.5">
              <Star className="w-3.5 h-3.5 fill-[#FFB800] text-[#FFB800]" />
              <span className="text-xs font-medium tabular-nums">{product.rating}</span>
            </div>
          ) : (
            <span className="text-[11px] text-muted-foreground">Not rated</span>
          )}
        </div>
        {product.current_price && (
          <span className="text-sm font-medium tabular-nums">
            ${product.current_price.toFixed(2)}
          </span>
        )}
      </div>

      {/* Expanded Detail */}
      {expanded && <LibraryProductDetail product={product} />}
    </div>
  );
}
