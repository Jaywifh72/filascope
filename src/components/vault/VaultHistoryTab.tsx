import { useState, useMemo, useCallback } from "react";
import { Link } from "react-router-dom";
import {
  History,
  Trash2,
  Search,
  Heart,
  FolderPlus,
  X,
  ExternalLink,
  Filter,
} from "lucide-react";
import { useBrowseHistory, type BrowseHistoryItem } from "@/hooks/useBrowseHistory";
import { useRegion } from "@/contexts/RegionContext";
import { useWishlist } from "@/hooks/useWishlist";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import { VaultEmptyState } from "./VaultEmptyState";

// ---- helpers ----

function formatTimeAgo(dateStr: string): string {
  const now = Date.now();
  const then = new Date(dateStr).getTime();
  const diffMs = now - then;
  const diffMin = Math.floor(diffMs / 60000);
  const diffHr = Math.floor(diffMs / 3600000);
  const diffDay = Math.floor(diffMs / 86400000);

  if (diffMin < 1) return "Just now";
  if (diffMin < 60) return `${diffMin} min ago`;
  if (diffHr < 24) return `${diffHr} hour${diffHr !== 1 ? "s" : ""} ago`;
  if (diffDay === 1) return "Yesterday";
  if (diffDay < 7) return `${diffDay} days ago`;
  return new Date(dateStr).toLocaleDateString();
}

type DateGroup = "Today" | "Yesterday" | "This Week" | "Earlier";

function getDateGroup(dateStr: string): DateGroup {
  const now = new Date();
  const then = new Date(dateStr);
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterdayStart = new Date(todayStart.getTime() - 86400000);
  const weekStart = new Date(todayStart.getTime() - 6 * 86400000);

  if (then >= todayStart) return "Today";
  if (then >= yesterdayStart) return "Yesterday";
  if (then >= weekStart) return "This Week";
  return "Earlier";
}

const GROUP_ORDER: DateGroup[] = ["Today", "Yesterday", "This Week", "Earlier"];

// ---- sub-components ----

function HistoryListItem({
  item,
  onRemove,
  onAddToWishlist,
}: {
  item: BrowseHistoryItem;
  onRemove: () => void;
  onAddToWishlist: () => void;
}) {
  const { formatPrice, convertPrice, hasRates, currency } = useRegion();

  const isFilament = item.product_type === "filament" && item.filament;
  const isPrinter = item.product_type === "printer" && item.printer;

  if (!isFilament && !isPrinter) return null;

  const href = isFilament
    ? `/filament/${item.product_id}`
    : `/printers/${item.product_id}`;

  const title = isFilament
    ? item.filament!.product_title
    : item.printer!.display_name || item.printer!.model_name;

  const image = isFilament ? item.filament!.featured_image : item.printer!.image_url;
  const colorHex = isFilament ? item.filament!.color_hex : null;
  const material = isFilament ? item.filament!.material : null;
  const brand = isFilament ? item.filament!.vendor : null;

  const rawPrice = isFilament
    ? item.filament!.variant_price
    : item.printer!.current_price_usd_store;

  const displayPrice =
    rawPrice && hasRates
      ? formatPrice(convertPrice(rawPrice, "USD"), {
          showApproximate: currency !== "USD",
        })
      : rawPrice
        ? `$${rawPrice.toFixed(2)}`
        : null;

  return (
    <div className="flex items-center gap-4 p-3 rounded-lg hover:bg-muted/50 transition-colors group">
      {/* Thumbnail */}
      <Link
        to={href}
        className="shrink-0 w-14 h-14 rounded-lg overflow-hidden border border-border bg-muted/30"
      >
        {image ? (
          <img
            src={image}
            alt=""
            className="w-full h-full object-cover"
            loading="lazy"
          />
        ) : colorHex ? (
          <div className="w-full h-full" style={{ backgroundColor: colorHex }} />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <History className="w-5 h-5 text-muted-foreground" />
          </div>
        )}
      </Link>

      {/* Info */}
      <Link to={href} className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate text-foreground">{title}</p>
        <div className="flex items-center gap-2 mt-0.5">
          {material && (
            <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
              {material}
            </Badge>
          )}
          {isPrinter && (
            <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
              Printer
            </Badge>
          )}
          {brand && (
            <span className="text-xs text-muted-foreground">{brand}</span>
          )}
        </div>
      </Link>

      {/* Price + Time */}
      <div className="shrink-0 text-right">
        {displayPrice && (
          <p className="text-sm font-semibold text-foreground">{displayPrice}</p>
        )}
        <p className="text-xs text-muted-foreground">
          {formatTimeAgo(item.viewed_at)}
        </p>
      </div>

      {/* Actions */}
      <div className="shrink-0 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        {isFilament && (
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={(e) => {
              e.preventDefault();
              onAddToWishlist();
            }}
            title="Add to Wishlist"
          >
            <Heart className="w-3.5 h-3.5" />
          </Button>
        )}
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-muted-foreground hover:text-destructive"
          onClick={(e) => {
            e.preventDefault();
            onRemove();
          }}
          title="Remove from History"
        >
          <X className="w-3.5 h-3.5" />
        </Button>
        <Link to={href}>
          <ExternalLink className="w-3.5 h-3.5 text-muted-foreground" />
        </Link>
      </div>
    </div>
  );
}

// ---- main component ----

export function VaultHistoryTab() {
  const { history, isLoading, clearHistory, removeFromHistory } =
    useBrowseHistory(100);
  const { addToWishlist } = useWishlist();

  const [searchQuery, setSearchQuery] = useState("");
  const [materialFilter, setMaterialFilter] = useState<string>("all");
  const [brandFilter, setBrandFilter] = useState<string>("all");

  // Extract unique materials and brands
  const { materials, brands } = useMemo(() => {
    const mats = new Set<string>();
    const brnds = new Set<string>();
    history.forEach((item) => {
      if (item.filament?.material) mats.add(item.filament.material);
      if (item.filament?.vendor) brnds.add(item.filament.vendor);
    });
    return {
      materials: Array.from(mats).sort(),
      brands: Array.from(brnds).sort(),
    };
  }, [history]);

  // Filter + search
  const filteredHistory = useMemo(() => {
    let items = [...history];

    // Search
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      items = items.filter((item) => {
        const title =
          item.filament?.product_title ||
          item.printer?.display_name ||
          item.printer?.model_name ||
          "";
        const brand = item.filament?.vendor || "";
        const material = item.filament?.material || "";
        return (
          title.toLowerCase().includes(q) ||
          brand.toLowerCase().includes(q) ||
          material.toLowerCase().includes(q)
        );
      });
    }

    // Material filter
    if (materialFilter !== "all") {
      items = items.filter(
        (item) => item.filament?.material === materialFilter
      );
    }

    // Brand filter
    if (brandFilter !== "all") {
      items = items.filter((item) => item.filament?.vendor === brandFilter);
    }

    return items;
  }, [history, searchQuery, materialFilter, brandFilter]);

  // Group by date
  const grouped = useMemo(() => {
    const groups: Record<DateGroup, BrowseHistoryItem[]> = {
      Today: [],
      Yesterday: [],
      "This Week": [],
      Earlier: [],
    };

    filteredHistory.forEach((item) => {
      const group = getDateGroup(item.viewed_at);
      groups[group].push(item);
    });

    return groups;
  }, [filteredHistory]);

  const handleRemoveItem = useCallback(
    (productId: string, productType: string) => {
      if (removeFromHistory) {
        removeFromHistory(productId, productType);
        toast.success("Removed from history");
      }
    },
    [removeFromHistory]
  );

  const handleAddToWishlist = useCallback(
    (filamentId: string) => {
      addToWishlist(filamentId);
      toast.success("Added to wishlist");
    },
    [addToWishlist]
  );

  const hasActiveFilters =
    searchQuery.trim() !== "" ||
    materialFilter !== "all" ||
    brandFilter !== "all";

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-8 text-center text-muted-foreground">
          Loading view history...
        </CardContent>
      </Card>
    );
  }

  if (history.length === 0) {
    return (
      <VaultEmptyState
        icon={History}
        title="No browsing history yet"
        description="Visit filament or printer pages to build your history. Your recent views will appear here."
        actionLabel="Browse Filaments"
        actionHref="/"
      />
    );
  }

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3 flex-wrap flex-1 w-full sm:w-auto">
          {/* Search */}
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search history..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 h-9"
            />
          </div>

          {/* Material filter */}
          {materials.length > 1 && (
            <Select value={materialFilter} onValueChange={setMaterialFilter}>
              <SelectTrigger className="w-36 h-9">
                <SelectValue placeholder="Material" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Materials</SelectItem>
                {materials.map((m) => (
                  <SelectItem key={m} value={m}>
                    {m}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}

          {/* Brand filter */}
          {brands.length > 1 && (
            <Select value={brandFilter} onValueChange={setBrandFilter}>
              <SelectTrigger className="w-36 h-9">
                <SelectValue placeholder="Brand" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Brands</SelectItem>
                {brands.map((b) => (
                  <SelectItem key={b} value={b}>
                    {b}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}

          {hasActiveFilters && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setSearchQuery("");
                setMaterialFilter("all");
                setBrandFilter("all");
              }}
              className="text-xs"
            >
              <X className="w-3 h-3 mr-1" />
              Clear Filters
            </Button>
          )}
        </div>

        <div className="flex items-center gap-3">
          <p className="text-sm text-muted-foreground whitespace-nowrap">
            {filteredHistory.length} item
            {filteredHistory.length !== 1 ? "s" : ""}
          </p>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className="text-destructive hover:text-destructive gap-2"
              >
                <Trash2 className="w-3.5 h-3.5" />
                Clear All
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Clear browsing history?</AlertDialogTitle>
                <AlertDialogDescription>
                  This will permanently remove all {history.length} items from
                  your browsing history. This action cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={() => {
                    clearHistory();
                    toast.success("History cleared");
                  }}
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                >
                  Clear All
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>

      {/* Grouped list */}
      {filteredHistory.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center text-muted-foreground">
            No items match your search or filters.
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {GROUP_ORDER.map((group) => {
            const items = grouped[group];
            if (items.length === 0) return null;

            return (
              <div key={group}>
                <h3 className="text-sm font-semibold text-muted-foreground mb-2 px-1">
                  {group}
                </h3>
                <Card>
                  <CardContent className="p-2 divide-y divide-border">
                    {items.map((item) => (
                      <HistoryListItem
                        key={item.id}
                        item={item}
                        onRemove={() =>
                          handleRemoveItem(item.product_id, item.product_type)
                        }
                        onAddToWishlist={() =>
                          handleAddToWishlist(item.product_id)
                        }
                      />
                    ))}
                  </CardContent>
                </Card>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
