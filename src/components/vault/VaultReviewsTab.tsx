import { useState } from "react";
import { Star } from "lucide-react";
import { useVaultReviews } from "@/hooks/useVaultReviews";
import type {
  ReviewSortOption,
  ReviewProductFilter,
  ReviewRatingFilter,
  VaultReview,
} from "@/hooks/useVaultReviews";
import { ReviewStatsBar } from "./reviews/ReviewStatsBar";
import { ReviewFilters } from "./reviews/ReviewFilters";
import { VaultReviewCard } from "./reviews/VaultReviewCard";
import { ReviewGridCard } from "./reviews/ReviewGridCard";
import { ReviewEditDialog } from "./reviews/ReviewEditDialog";
import { VaultEmptyState } from "./VaultEmptyState";

export function VaultReviewsTab() {
  const {
    reviews,
    stats,
    isLoading,
    updateReview,
    isUpdating,
    deleteReview,
    isDeleting,
  } = useVaultReviews();

  const [sortBy, setSortBy] = useState<ReviewSortOption>("recent");
  const [productFilter, setProductFilter] = useState<ReviewProductFilter>("all");
  const [ratingFilter, setRatingFilter] = useState<ReviewRatingFilter>(0);
  const [viewMode, setViewMode] = useState<"list" | "grid">("list");
  const [editingReview, setEditingReview] = useState<VaultReview | null>(null);

  if (isLoading) {
    return (
      <div className="space-y-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="h-32 rounded-xl bg-muted/30 animate-pulse" />
        ))}
      </div>
    );
  }

  if (!reviews.length) {
    return (
      <VaultEmptyState
        icon={Star}
        title="No reviews yet"
        description="Share your experience with filaments and printers to help the community make better choices."
        actionLabel="Browse Filaments to Review"
        actionHref="/"
      />
    );
  }

  // Apply filters
  let filtered = [...reviews];

  if (productFilter !== "all") {
    filtered = filtered.filter((r) => r.product_type === productFilter);
  }

  if (ratingFilter > 0) {
    filtered = filtered.filter((r) => r.overall_rating === ratingFilter);
  }

  // Apply sort
  filtered.sort((a, b) => {
    switch (sortBy) {
      case "helpful":
        return b.helpful_count - a.helpful_count;
      case "highest":
        return b.overall_rating - a.overall_rating;
      case "lowest":
        return a.overall_rating - b.overall_rating;
      case "recent":
      default:
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    }
  });

  const handleEditSave = (reviewId: string, data: any) => {
    updateReview(
      { reviewId, data },
      { onSuccess: () => setEditingReview(null) }
    );
  };

  return (
    <div className="space-y-4">
      {/* Heading */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">
          My Public Reviews{" "}
          <span className="text-muted-foreground font-normal">({stats.totalReviews})</span>
        </h2>
      </div>

      {/* Stats */}
      <ReviewStatsBar stats={stats} />

      {/* Filters */}
      <ReviewFilters
        sortBy={sortBy}
        onSortChange={setSortBy}
        productFilter={productFilter}
        onProductFilterChange={setProductFilter}
        ratingFilter={ratingFilter}
        onRatingFilterChange={setRatingFilter}
        viewMode={viewMode}
        onViewModeChange={setViewMode}
      />

      {/* Content */}
      {filtered.length === 0 ? (
        <p className="text-sm text-muted-foreground py-8 text-center">
          No reviews match your filters.
        </p>
      ) : viewMode === "list" ? (
        <div className="space-y-3">
          {filtered.map((review) => (
            <VaultReviewCard
              key={review.id}
              review={review}
              onEdit={setEditingReview}
              onDelete={deleteReview}
              isDeleting={isDeleting}
            />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
          {filtered.map((review) => (
            <ReviewGridCard key={review.id} review={review} />
          ))}
        </div>
      )}

      {/* Edit Dialog */}
      <ReviewEditDialog
        review={editingReview}
        open={!!editingReview}
        onOpenChange={(open) => !open && setEditingReview(null)}
        onSave={handleEditSave}
        isSaving={isUpdating}
      />
    </div>
  );
}
