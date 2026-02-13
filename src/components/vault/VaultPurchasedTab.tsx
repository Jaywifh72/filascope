import { useState } from "react";
import { ShoppingBag, Filter, SortAsc } from "lucide-react";
import { useUserPurchases } from "@/hooks/useUserPurchases";
import { useVaultReviews } from "@/hooks/useVaultReviews";
import { PurchaseStatsBar, SpendingBreakdown } from "@/components/purchases/PurchaseStatsBar";
import { PurchaseCard } from "@/components/purchases/PurchaseCard";
import { PurchaseExportButton } from "@/components/purchases/PurchaseExportButton";
import { VaultEmptyState } from "./VaultEmptyState";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type SortOption = "date-desc" | "date-asc" | "price-desc" | "price-asc" | "name";
type MaterialFilter = string;

export function VaultPurchasedTab() {
  const { purchases, stats, isLoading, deletePurchase, isDeleting } = useUserPurchases();
  const { reviews } = useVaultReviews();
  const [sortBy, setSortBy] = useState<SortOption>("date-desc");
  const [materialFilter, setMaterialFilter] = useState<MaterialFilter>("all");
  const [brandFilter, setBrandFilter] = useState<string>("all");

  if (isLoading) {
    return (
      <div className="space-y-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="h-28 rounded-xl bg-muted/30 animate-pulse" />
        ))}
      </div>
    );
  }

  if (!purchases.length) {
    return (
      <VaultEmptyState
        icon={ShoppingBag}
        title="No purchases recorded"
        description="Track your filament purchases to monitor spending, get verified purchase badges on your reviews, and reorder easily."
        actionLabel="Browse Filaments"
        actionHref="/"
        tip="💡 Mark filaments as purchased to unlock verified review badges"
      />
    );
  }

  // Collect unique materials and brands for filters
  const materials = [...new Set(purchases.map((p) => p.filament?.material).filter(Boolean))] as string[];
  const brands = [...new Set(purchases.map((p) => p.filament?.vendor).filter(Boolean))] as string[];

  // Build a set of reviewed product IDs
  const reviewedProductIds = new Set(reviews.map((r) => r.product_id));

  // Filter
  let filtered = [...purchases];
  if (materialFilter !== "all") {
    filtered = filtered.filter((p) => p.filament?.material === materialFilter);
  }
  if (brandFilter !== "all") {
    filtered = filtered.filter((p) => p.filament?.vendor === brandFilter);
  }

  // Sort
  filtered.sort((a, b) => {
    switch (sortBy) {
      case "date-asc":
        return new Date(a.purchased_at || 0).getTime() - new Date(b.purchased_at || 0).getTime();
      case "price-desc":
        return (b.price_paid || 0) - (a.price_paid || 0);
      case "price-asc":
        return (a.price_paid || 0) - (b.price_paid || 0);
      case "name":
        return (a.filament?.product_title || "").localeCompare(b.filament?.product_title || "");
      case "date-desc":
      default:
        return new Date(b.purchased_at || 0).getTime() - new Date(a.purchased_at || 0).getTime();
    }
  });

  return (
    <div className="space-y-6">
      {/* Heading + Export */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">
          My Purchases{" "}
          <span className="text-muted-foreground font-normal">({stats.totalPurchases})</span>
        </h2>
        <PurchaseExportButton purchases={purchases} />
      </div>

      {/* Stats */}
      <PurchaseStatsBar stats={stats} />

      {/* Spending Breakdown */}
      <SpendingBreakdown stats={stats} />

      {/* Filters */}
      <div className="flex flex-wrap gap-2">
        <Select value={sortBy} onValueChange={(v) => setSortBy(v as SortOption)}>
          <SelectTrigger className="w-[160px] h-9 text-xs">
            <SortAsc className="w-3.5 h-3.5 mr-1.5" />
            <SelectValue placeholder="Sort" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="date-desc">Newest First</SelectItem>
            <SelectItem value="date-asc">Oldest First</SelectItem>
            <SelectItem value="price-desc">Highest Price</SelectItem>
            <SelectItem value="price-asc">Lowest Price</SelectItem>
            <SelectItem value="name">Product Name</SelectItem>
          </SelectContent>
        </Select>

        {materials.length > 1 && (
          <Select value={materialFilter} onValueChange={setMaterialFilter}>
            <SelectTrigger className="w-[140px] h-9 text-xs">
              <Filter className="w-3.5 h-3.5 mr-1.5" />
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

        {brands.length > 1 && (
          <Select value={brandFilter} onValueChange={setBrandFilter}>
            <SelectTrigger className="w-[140px] h-9 text-xs">
              <Filter className="w-3.5 h-3.5 mr-1.5" />
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
      </div>

      {/* Purchase List */}
      {filtered.length === 0 ? (
        <p className="text-sm text-muted-foreground py-8 text-center">
          No purchases match your filters.
        </p>
      ) : (
        <div className="space-y-3">
          {filtered.map((purchase) => (
            <PurchaseCard
              key={purchase.id}
              purchase={purchase}
              hasReview={reviewedProductIds.has(purchase.filament_id)}
              onDelete={deletePurchase}
              isDeleting={isDeleting}
            />
          ))}
        </div>
      )}
    </div>
  );
}
