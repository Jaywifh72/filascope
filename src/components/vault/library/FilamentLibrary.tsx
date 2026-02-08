import { useState, useMemo } from "react";
import { Library, SortAsc, Filter } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useFilamentLibrary, type LibrarySortOption, type LibraryFilterOption } from "@/hooks/useFilamentLibrary";
import { LibraryProductRow } from "./LibraryProductRow";

export function FilamentLibrary() {
  const { products, isLoading, quickRate, isRating } = useFilamentLibrary();
  const [filter, setFilter] = useState<LibraryFilterOption>("all");
  const [sortBy, setSortBy] = useState<LibrarySortOption>("recent");

  const filtered = useMemo(() => {
    let result = [...products];

    // Apply filter
    switch (filter) {
      case "wishlist":
        result = result.filter((p) => p.wishlisted);
        break;
      case "purchased":
        result = result.filter((p) => p.purchased);
        break;
      case "reviewed":
        result = result.filter((p) => p.reviewed);
        break;
      case "noted":
        result = result.filter((p) => p.hasNote);
        break;
      case "alert":
        result = result.filter((p) => p.hasAlert);
        break;
    }

    // Apply sort
    result.sort((a, b) => {
      switch (sortBy) {
        case "rating":
          return (b.rating ?? 0) - (a.rating ?? 0);
        case "price":
          return (a.current_price ?? Infinity) - (b.current_price ?? Infinity);
        case "brand":
          return (a.vendor || "").localeCompare(b.vendor || "");
        case "recent":
        default:
          return new Date(b.lastInteracted).getTime() - new Date(a.lastInteracted).getTime();
      }
    });

    return result;
  }, [products, filter, sortBy]);

  if (isLoading) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Library className="w-4 h-4 text-primary" />
            My Filament Library
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-16 rounded-xl bg-muted/30 animate-pulse" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (products.length === 0) {
    return null; // Don't show the section if no interactions
  }

  const filterCounts = {
    all: products.length,
    wishlist: products.filter((p) => p.wishlisted).length,
    purchased: products.filter((p) => p.purchased).length,
    reviewed: products.filter((p) => p.reviewed).length,
    noted: products.filter((p) => p.hasNote).length,
    alert: products.filter((p) => p.hasAlert).length,
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <CardTitle className="text-base flex items-center gap-2">
            <Library className="w-4 h-4 text-primary" />
            My Filament Library
            <Badge variant="secondary" className="text-[10px] font-normal ml-1">
              {products.length} product{products.length !== 1 ? "s" : ""}
            </Badge>
          </CardTitle>

          {/* Sort */}
          <Select value={sortBy} onValueChange={(v) => setSortBy(v as LibrarySortOption)}>
            <SelectTrigger className="w-[155px] h-8 text-xs">
              <SortAsc className="w-3 h-3 mr-1" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="recent">Recently Interacted</SelectItem>
              <SelectItem value="rating">Highest Rated</SelectItem>
              <SelectItem value="price">Price</SelectItem>
              <SelectItem value="brand">Brand</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardHeader>

      <CardContent className="pt-0 space-y-3">
        {/* Filter Pills */}
        <div className="flex flex-wrap gap-1.5">
          {(
            [
              { key: "all", label: "All" },
              { key: "wishlisted", label: "❤️ Wishlisted", filterKey: "wishlist" },
              { key: "purchased", label: "✅ Purchased", filterKey: "purchased" },
              { key: "reviewed", label: "⭐ Reviewed", filterKey: "reviewed" },
              { key: "noted", label: "📝 Noted", filterKey: "noted" },
              { key: "alert", label: "🔔 Alert", filterKey: "alert" },
            ] as const
          ).map((item) => {
            const filterKey = "filterKey" in item ? item.filterKey : "all";
            const count = filterCounts[filterKey as keyof typeof filterCounts];
            const isActive = filter === filterKey;

            if (filterKey !== "all" && count === 0) return null;

            return (
              <button
                key={item.key}
                onClick={() => setFilter(filterKey as LibraryFilterOption)}
                className={`
                  inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium transition-all
                  ${isActive
                    ? "bg-primary/15 text-primary border border-primary/30"
                    : "bg-muted/50 text-muted-foreground hover:bg-muted/80 border border-transparent"
                  }
                `}
              >
                {item.label}
                <span className="tabular-nums opacity-70">{count}</span>
              </button>
            );
          })}
        </div>

        {/* Product List */}
        {filtered.length === 0 ? (
          <p className="text-sm text-muted-foreground py-6 text-center">
            No products match this filter.
          </p>
        ) : (
          <div className="space-y-2">
            {filtered.map((product) => (
              <LibraryProductRow
                key={product.filament_id}
                product={product}
                onQuickRate={(id, rating) => quickRate({ productId: id, rating })}
                isRating={isRating}
              />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
