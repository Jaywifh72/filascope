import { useState } from "react";
import { Link } from "react-router-dom";
import { Star, ThumbsUp } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { getOptimizedImageUrl } from "@/utils/imageOptimization";
import type { PublicReview } from "@/hooks/usePublicProfile";

type SortKey = "recent" | "highest" | "helpful";

interface ProfileReviewsTabProps {
  reviews: PublicReview[];
}

export function ProfileReviewsTab({ reviews }: ProfileReviewsTabProps) {
  const [sort, setSort] = useState<SortKey>("recent");

  const sorted = [...reviews].sort((a, b) => {
    if (sort === "highest") return b.overall_rating - a.overall_rating;
    if (sort === "helpful") return b.helpful_count - a.helpful_count;
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
  });

  if (reviews.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <p className="text-lg font-medium">No public reviews yet</p>
        <p className="text-sm mt-1">Reviews will appear here once published.</p>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm text-muted-foreground">{reviews.length} review{reviews.length !== 1 ? "s" : ""}</p>
        <Select value={sort} onValueChange={(v) => setSort(v as SortKey)}>
          <SelectTrigger className="w-[160px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="recent">Most Recent</SelectItem>
            <SelectItem value="highest">Highest Rated</SelectItem>
            <SelectItem value="helpful">Most Helpful</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {sorted.map((review) => (
          <ReviewCard key={review.id} review={review} />
        ))}
      </div>
    </div>
  );
}

function ReviewCard({ review }: { review: PublicReview }) {
  const productName = review.filament?.product_title || "Product";
  const brandName = review.filament?.vendor || "";
  const image = review.filament?.featured_image;
  const productLink = review.product_type === "filament" ? `/filament/${review.product_id}` : `/printers/${review.product_id}`;

  return (
    <Link
      to={productLink}
      className="group rounded-lg border border-border/50 bg-card/50 overflow-hidden hover:border-primary/50 transition-colors"
    >
      {/* Image */}
      <div className="aspect-[3/2] bg-muted/30 relative overflow-hidden">
        {image ? (
          <img src={getOptimizedImageUrl(image, 400)} alt={productName} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-muted-foreground text-sm">
            No image
          </div>
        )}
        {/* Rating overlay */}
        <div className="absolute bottom-2 left-2 flex items-center gap-1 bg-background/80 backdrop-blur-sm rounded-full px-2 py-1">
          {Array.from({ length: 5 }).map((_, i) => (
            <Star
              key={i}
              className={`w-3.5 h-3.5 ${i < review.overall_rating ? "fill-amber-400 text-amber-400" : "text-muted-foreground/30"}`}
            />
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="p-3">
        <p className="text-xs text-muted-foreground truncate">{brandName}</p>
        <p className="text-sm font-medium truncate mt-0.5">{productName}</p>
        <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{review.headline}</p>
        <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
          {review.helpful_count > 0 && (
            <span className="flex items-center gap-1">
              <ThumbsUp className="w-3 h-3" />
              {review.helpful_count}
            </span>
          )}
          <span>{formatDistanceToNow(new Date(review.created_at), { addSuffix: true })}</span>
        </div>
      </div>
    </Link>
  );
}
