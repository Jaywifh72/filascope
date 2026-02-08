import { useState } from "react";
import { Link } from "react-router-dom";
import {
  TrendingDown,
  TrendingUp,
  Clock,
  Tag,
  Folder,
  Trash2,
  MoreHorizontal,
  Lightbulb,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { WishlistItem as WishlistItemType } from "@/hooks/useWishlist";
import { WishlistCollection } from "@/hooks/useWishlistCollections";
import { computePricePerKg } from "@/lib/resolveFilamentPrice";
import { formatDistanceToNow } from "date-fns";

interface WishlistItemProps {
  item: WishlistItemType;
  collections: WishlistCollection[];
  isSelected: boolean;
  onSelect: (selected: boolean) => void;
  onRemove: () => void;
  onMoveToCollection: (collectionId: string | null) => void;
  onAddTag: (tag: string) => void;
  onRemoveTag: (tag: string) => void;
}

export function WishlistItemCard({
  item,
  collections,
  isSelected,
  onSelect,
  onRemove,
  onMoveToCollection,
  onAddTag,
  onRemoveTag,
}: WishlistItemProps) {
  const [tagInput, setTagInput] = useState("");

  const priceChange =
    item.price_when_added && item.filament?.variant_price
      ? item.price_when_added - item.filament.variant_price
      : 0;

  const priceChangePercent =
    item.price_when_added && priceChange
      ? (priceChange / item.price_when_added) * 100
      : 0;

  const daysWatching = Math.floor(
    (Date.now() - new Date(item.created_at).getTime()) / (1000 * 60 * 60 * 24)
  );

  const currentCollection = collections.find((c) => c.id === item.collection_id);

  const trueCost = item.filament?.variant_price
    ? computePricePerKg(item.filament.variant_price, item.filament.net_weight_g, (item.filament as any).pack_quantity)
    : null;

  const handleTagKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && tagInput.trim()) {
      onAddTag(tagInput.trim().toLowerCase().replace(/\s+/g, "-"));
      setTagInput("");
    }
  };

  return (
    <div className="border border-border rounded-lg p-4 hover:bg-muted/30 transition-colors">
      <div className="flex items-start gap-4">
        {/* Checkbox */}
        <Checkbox
          checked={isSelected}
          onCheckedChange={onSelect}
          className="mt-1"
        />

        {/* Image */}
        <Link
          to={`/filament/${item.filament_id}`}
          className="h-20 w-20 rounded-lg overflow-hidden bg-muted flex-shrink-0"
        >
          {item.filament?.featured_image ? (
            <img
              src={item.filament.featured_image}
              alt={item.filament.product_title}
              className="h-full w-full object-cover hover:scale-105 transition-transform"
              onError={(e) => {
                e.currentTarget.style.display = 'none';
                const fallback = e.currentTarget.nextElementSibling;
                if (fallback) (fallback as HTMLElement).style.display = 'block';
              }}
            />
          ) : null}
          <div
            className="h-full w-full"
            style={{
              backgroundColor: item.filament?.color_hex || "#333",
              display: item.filament?.featured_image ? 'none' : 'block',
            }}
          />
        </Link>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div>
              <Link
                to={`/filament/${item.filament_id}`}
                className="font-medium hover:text-primary transition-colors line-clamp-1"
              >
                {item.filament?.product_title || "Unknown"}
              </Link>
              <div className="flex items-center gap-2 text-sm text-muted-foreground mt-0.5">
                <span>{item.filament?.vendor}</span>
                <span>•</span>
                <span>{item.filament?.material}</span>
              </div>
            </div>

            {/* Price */}
            <div className="text-right flex-shrink-0">
              {item.filament?.variant_price && (
                <div className="font-mono font-semibold text-primary">
                  ${item.filament.variant_price.toFixed(2)}
                </div>
              )}
              {trueCost && (
                <div className="text-xs text-muted-foreground font-mono">
                  ${trueCost.toFixed(2)}/kg
                </div>
              )}
            </div>
          </div>

          {/* Analytics */}
          <div className="flex flex-wrap items-center gap-3 mt-2 text-xs">
            {priceChange !== 0 && (
              <div
                className={`flex items-center gap-1 ${
                  priceChange > 0 ? "text-green-500" : "text-red-500"
                }`}
              >
                {priceChange > 0 ? (
                  <TrendingDown className="h-3.5 w-3.5" />
                ) : (
                  <TrendingUp className="h-3.5 w-3.5" />
                )}
                <span>
                  {priceChange > 0 ? "-" : "+"}${Math.abs(priceChange).toFixed(2)} (
                  {Math.abs(priceChangePercent).toFixed(0)}%)
                </span>
              </div>
            )}
            <div className="flex items-center gap-1 text-muted-foreground">
              <Clock className="h-3.5 w-3.5" />
              <span>
                {daysWatching === 0
                  ? "Added today"
                  : `Watching for ${daysWatching} day${daysWatching !== 1 ? "s" : ""}`}
              </span>
            </div>
            {currentCollection && (
              <div className="flex items-center gap-1 text-muted-foreground">
                <Folder className="h-3.5 w-3.5" />
                <span>{currentCollection.name}</span>
              </div>
            )}
          </div>

          {/* Recommendation */}
          {priceChange > 0 && priceChangePercent >= 10 && (
            <div className="flex items-center gap-2 mt-2 p-2 rounded-md bg-green-500/10 text-green-500 text-xs">
              <Lightbulb className="h-3.5 w-3.5" />
              <span>Great deal! Price is {priceChangePercent.toFixed(0)}% lower than when you added it.</span>
            </div>
          )}

          {/* Tags */}
          <div className="flex flex-wrap items-center gap-1.5 mt-3">
            {(item.tags || []).map((tag) => (
              <Badge
                key={tag}
                variant="secondary"
                className="text-xs cursor-pointer hover:bg-destructive hover:text-destructive-foreground"
                onClick={() => onRemoveTag(tag)}
              >
                #{tag}
                <span className="ml-1">×</span>
              </Badge>
            ))}
            <input
              type="text"
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              onKeyDown={handleTagKeyDown}
              placeholder="Add tag..."
              className="bg-transparent text-xs border-none outline-none w-20 placeholder:text-muted-foreground"
            />
          </div>
        </div>

        {/* Actions */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8" aria-label="Item options">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem asChild>
              <Link to={`/filament/${item.filament_id}`}>View Details</Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => onMoveToCollection(null)}>
              <Folder className="h-4 w-4 mr-2" />
              Remove from Collection
            </DropdownMenuItem>
            {collections.map((collection) => (
              <DropdownMenuItem
                key={collection.id}
                onClick={() => onMoveToCollection(collection.id)}
              >
                <Folder className="h-4 w-4 mr-2" />
                Move to {collection.name}
              </DropdownMenuItem>
            ))}
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={onRemove}
              className="text-destructive focus:text-destructive"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Remove from Wishlist
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}
