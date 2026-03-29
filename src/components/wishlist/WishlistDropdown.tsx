import { Heart, X, TrendingDown, Package, ArrowRight, Loader2 } from "lucide-react";
import { PriceDisplay } from "@/components/ui/PriceDisplay";
import { useCurrencyPreference } from "@/hooks/useCurrencyPreference";
import { Button } from "@/components/ui/button";
import { WishlistItem, WishlistStats } from "@/hooks/useWishlist";
import { useWishlist } from "@/hooks/useWishlist";
import { Link } from "react-router-dom";
import { getFilamentHref } from "@/lib/filamentUrl";

interface WishlistDropdownProps {
  items: WishlistItem[];
  stats: WishlistStats;
  isLoading: boolean;
  onViewAll: () => void;
  onClose: () => void;
}

export function WishlistDropdown({
  items,
  stats,
  isLoading,
  onViewAll,
  onClose,
}: WishlistDropdownProps) {
  const { removeFromWishlist } = useWishlist();
  const currency = useCurrencyPreference();

  const handleRemove = async (e: React.MouseEvent, filamentId: string) => {
    e.preventDefault();
    e.stopPropagation();
    await removeFromWishlist(filamentId);
  };

  if (isLoading) {
    return (
      <div className="p-6 flex items-center justify-center">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="p-6 text-center">
        <Heart className="h-10 w-10 mx-auto mb-3 text-muted-foreground/50" />
        <p className="text-sm text-muted-foreground mb-3">Your wishlist is empty</p>
        <Button variant="outline" size="sm" onClick={onClose} asChild>
          <Link to="/materials">Browse Filaments</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="divide-y divide-border">
      {/* Header */}
      <div className="p-3 flex items-center justify-between bg-muted/30">
        <div className="flex items-center gap-2">
          <Heart className="h-4 w-4 text-red-500 fill-red-500" />
          <span className="font-medium text-sm">My Wishlist</span>
          <span className="text-xs text-muted-foreground">
            ({stats.totalItems} item{stats.totalItems !== 1 ? "s" : ""})
          </span>
        </div>
        <Button variant="ghost" size="sm" onClick={onViewAll} className="text-xs h-7">
          View All
          <ArrowRight className="ml-1 h-3 w-3" />
        </Button>
      </div>

      {/* Items */}
      <div className="max-h-64 overflow-y-auto">
        {items.map((item) => {
          const priceChange =
            item.price_when_added && item.filament?.variant_price
              ? item.price_when_added - item.filament.variant_price
              : 0;

          return (
            <Link
              key={item.id}
              to={getFilamentHref(item.filament_id, (item.filament as any)?.product_handle)}
              onClick={onClose}
              className="flex items-center gap-3 p-3 hover:bg-muted/50 transition-colors group"
            >
              {/* Image */}
              <div className="h-12 w-12 rounded-md overflow-hidden bg-muted flex-shrink-0">
                {item.filament?.featured_image ? (
                  <img
                    src={item.filament.featured_image}
                    alt={item.filament.product_title}
                    className="h-full w-full object-cover"
                    loading="lazy"
                    width={48}
                    height={48}
                    decoding="async"
                  />
                ) : (
                  <div
                    className="h-full w-full"
                    style={{ backgroundColor: item.filament?.color_hex || "#333" }}
                  />
                )}
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">
                  {item.filament?.product_title || "Unknown"}
                </p>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <span>{item.filament?.vendor}</span>
                  {item.filament?.variant_price && (
                    <span className="font-mono">
                      <PriceDisplay priceUsd={item.filament.variant_price} currency={currency} />
                    </span>
                  )}
                </div>
                {priceChange > 0 && (
                  <div className="flex items-center gap-1 text-xs text-green-500 mt-0.5">
                    <TrendingDown className="h-3 w-3" />
                    <span>-${priceChange.toFixed(2)} since added</span>
                  </div>
                )}
              </div>

              {/* Remove button */}
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={(e) => handleRemove(e, item.filament_id)}
              >
                <X className="h-4 w-4" />
              </Button>
            </Link>
          );
        })}
      </div>

      {/* Alerts */}
      {(stats.onSaleCount > 0 || stats.backInStockCount > 0) && (
        <div className="p-3 space-y-1.5 bg-muted/20">
          {stats.onSaleCount > 0 && (
            <div className="flex items-center gap-2 text-xs text-green-500">
              <TrendingDown className="h-3.5 w-3.5" />
              <span>{stats.onSaleCount} item{stats.onSaleCount !== 1 ? "s" : ""} on sale!</span>
            </div>
          )}
          {stats.backInStockCount > 0 && (
            <div className="flex items-center gap-2 text-xs text-blue-500">
              <Package className="h-3.5 w-3.5" />
              <span>{stats.backInStockCount} item{stats.backInStockCount !== 1 ? "s" : ""} back in stock</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
