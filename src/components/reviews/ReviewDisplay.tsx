import { useState } from "react";
import { Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
} from "@/components/ui/dialog";
import {
  Star,
  ThumbsUp,
  Flag,
  ChevronDown,
  ChevronUp,
  Camera,
  Printer,
  CheckCircle2,
  Filter,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";
import { useAuth } from "@/hooks/useAuth";
import type { ProductReview, ReviewSummary } from "@/hooks/useProductReviews";

// ─── Summary Bar ───

interface ReviewSummaryBarProps {
  summary: ReviewSummary;
}

export function ReviewSummaryBar({ summary }: ReviewSummaryBarProps) {
  if (summary.totalCount === 0) return null;

  return (
    <Card className="bg-card/50 border-border">
      <CardContent className="p-5">
        <div className="flex items-start gap-6">
          {/* Average */}
          <div className="text-center shrink-0">
            <div className="text-4xl font-bold text-foreground">
              {summary.averageRating.toFixed(1)}
            </div>
            <div className="flex gap-0.5 justify-center my-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <Star
                  key={star}
                  className={cn(
                    "w-4 h-4",
                    star <= Math.round(summary.averageRating)
                      ? "fill-primary text-primary"
                      : "text-muted-foreground/30"
                  )}
                />
              ))}
            </div>
            <p className="text-xs text-muted-foreground">
              {summary.totalCount} review{summary.totalCount !== 1 ? "s" : ""}
            </p>
          </div>

          {/* Distribution Bars */}
          <div className="flex-1 space-y-1.5">
            {[5, 4, 3, 2, 1].map((star) => {
              const count = summary.distribution[star] || 0;
              const pct = summary.totalCount > 0 ? (count / summary.totalCount) * 100 : 0;
              return (
                <div key={star} className="flex items-center gap-2 text-sm">
                  <span className="w-3 text-muted-foreground">{star}</span>
                  <Star className="w-3 h-3 text-muted-foreground/50" />
                  <div className="flex-1 h-2 bg-muted/50 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-primary rounded-full transition-all"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <span className="w-6 text-xs text-muted-foreground text-right">{count}</span>
                </div>
              );
            })}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// ─── Review List with Filters ───

interface ReviewListProps {
  reviews: ProductReview[];
  onVoteHelpful: (reviewId: string) => void;
  isVoting: boolean;
}

type SortOption = "recent" | "highest" | "helpful";

export function ReviewList({ reviews, onVoteHelpful, isVoting }: ReviewListProps) {
  const [sortBy, setSortBy] = useState<SortOption>("recent");
  const [filterPhotos, setFilterPhotos] = useState(false);
  const [filterVerified, setFilterVerified] = useState(false);

  let filtered = [...reviews];

  if (filterPhotos) {
    filtered = filtered.filter((r) => r.photos && r.photos.length > 0);
  }
  if (filterVerified) {
    filtered = filtered.filter((r) => r.is_verified_purchase);
  }

  filtered.sort((a, b) => {
    switch (sortBy) {
      case "highest":
        return b.overall_rating - a.overall_rating;
      case "helpful":
        return b.helpful_count - a.helpful_count;
      case "recent":
      default:
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    }
  });

  if (reviews.length === 0) return null;

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-2">
        <Select value={sortBy} onValueChange={(v) => setSortBy(v as SortOption)}>
          <SelectTrigger className="w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="recent">Most Recent</SelectItem>
            <SelectItem value="highest">Highest Rated</SelectItem>
            <SelectItem value="helpful">Most Helpful</SelectItem>
          </SelectContent>
        </Select>

        <Button
          variant={filterPhotos ? "default" : "outline"}
          size="sm"
          onClick={() => setFilterPhotos(!filterPhotos)}
          className="gap-1.5"
        >
          <Camera className="w-3.5 h-3.5" />
          Has Photos
        </Button>

        <Button
          variant={filterVerified ? "default" : "outline"}
          size="sm"
          onClick={() => setFilterVerified(!filterVerified)}
          className="gap-1.5"
        >
          <CheckCircle2 className="w-3.5 h-3.5" />
          Verified
        </Button>
      </div>

      {/* Reviews */}
      {filtered.length === 0 ? (
        <p className="text-sm text-muted-foreground py-4 text-center">
          No reviews match your filters.
        </p>
      ) : (
        filtered.map((review) => (
          <ReviewCard
            key={review.id}
            review={review}
            onVoteHelpful={onVoteHelpful}
            isVoting={isVoting}
          />
        ))
      )}
    </div>
  );
}

// ─── Single Review Card ───

function ReviewCard({
  review,
  onVoteHelpful,
  isVoting,
}: {
  review: ProductReview;
  onVoteHelpful: (id: string) => void;
  isVoting: boolean;
}) {
  const { user } = useAuth();
  const [expanded, setExpanded] = useState(false);
  const [lightboxPhoto, setLightboxPhoto] = useState<string | null>(null);

  const bodyTruncated = review.body.length > 250;
  const displayBody = expanded ? review.body : review.body.slice(0, 250);
  const initials =
    review.profile?.display_name
      ?.split(" ")
      .map((w) => w[0])
      .join("")
      .toUpperCase()
      .slice(0, 2) || "U";

  return (
    <>
      <Card className="bg-card/50 border-border">
        <CardContent className="p-5 space-y-3">
          {/* Header: User + Ratings */}
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3">
              <Avatar className="h-9 w-9">
                <AvatarImage src={review.profile?.avatar_url ?? undefined} />
                <AvatarFallback className="bg-primary/10 text-primary text-xs">
                  {initials}
                </AvatarFallback>
              </Avatar>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-medium text-sm">
                    {review.profile?.display_name || "Anonymous"}
                  </span>
                  {review.is_verified_purchase && (
                    <Badge variant="secondary" className="text-[10px] gap-1 py-0">
                      <CheckCircle2 className="w-2.5 h-2.5" />
                      Verified
                    </Badge>
                  )}
                </div>
                <span className="text-xs text-muted-foreground">
                  {formatDistanceToNow(new Date(review.created_at), { addSuffix: true })}
                </span>
              </div>
            </div>

            {/* Stars */}
            <div className="flex gap-0.5 shrink-0">
              {[1, 2, 3, 4, 5].map((star) => (
                <Star
                  key={star}
                  className={cn(
                    "w-3.5 h-3.5",
                    star <= review.overall_rating
                      ? "fill-primary text-primary"
                      : "text-muted-foreground/30"
                  )}
                />
              ))}
            </div>
          </div>

          {/* Category Ratings (if any) */}
          {(review.quality_rating || review.ease_rating || review.value_rating) && (
            <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
              {review.quality_rating && (
                <span>Quality: {review.quality_rating}/5</span>
              )}
              {review.ease_rating && (
                <span>Ease: {review.ease_rating}/5</span>
              )}
              {review.value_rating && (
                <span>Value: {review.value_rating}/5</span>
              )}
            </div>
          )}

          {/* Headline */}
          <h4 className="font-semibold text-sm">{review.headline}</h4>

          {/* Body */}
          <div className="text-sm text-foreground/80">
            <p className="whitespace-pre-line">{displayBody}{bodyTruncated && !expanded && "…"}</p>
            {bodyTruncated && (
              <button
                onClick={() => setExpanded(!expanded)}
                className="text-primary text-xs font-medium mt-1 flex items-center gap-0.5"
              >
                {expanded ? (
                  <>Show less <ChevronUp className="w-3 h-3" /></>
                ) : (
                  <>Read more <ChevronDown className="w-3 h-3" /></>
                )}
              </button>
            )}
          </div>

          {/* Printer Badge */}
          {review.printer && (
            <Badge variant="outline" className="gap-1 text-xs">
              <Printer className="w-3 h-3" />
              {review.printer.display_name || review.printer.model_name}
            </Badge>
          )}

          {/* Pros / Cons */}
          {(review.pros.length > 0 || review.cons.length > 0) && (
            <div className="flex flex-wrap gap-1.5">
              {review.pros.map((pro) => (
                <Badge
                  key={pro}
                  variant="secondary"
                  className="text-[10px] bg-[hsl(var(--color-success)/0.1)] text-[hsl(var(--color-success))] border-0"
                >
                  + {pro}
                </Badge>
              ))}
              {review.cons.map((con) => (
                <Badge
                  key={con}
                  variant="secondary"
                  className="text-[10px] bg-destructive/10 text-destructive border-0"
                >
                  − {con}
                </Badge>
              ))}
            </div>
          )}

          {/* Photos */}
          {review.photos && review.photos.length > 0 && (
            <div className="flex gap-2 overflow-x-auto scrollbar-hide">
              {review.photos.map((photo) => (
                <button
                  key={photo.id}
                  onClick={() => setLightboxPhoto(photo.photo_url)}
                  className="shrink-0 w-16 h-16 rounded-lg overflow-hidden border border-border hover:border-primary/50 transition-colors"
                >
                  <img
                    src={photo.photo_url}
                    alt="Review photo"
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />
                </button>
              ))}
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center gap-4 pt-1">
            <Button
              variant="ghost"
              size="sm"
              className={cn(
                "gap-1.5 text-xs",
                review.user_voted && "text-primary"
              )}
              onClick={() => user && onVoteHelpful(review.id)}
              disabled={!user || isVoting}
            >
              <ThumbsUp className={cn("w-3.5 h-3.5", review.user_voted && "fill-primary")} />
              Helpful {review.helpful_count > 0 && `(${review.helpful_count})`}
            </Button>

            <Button variant="ghost" size="sm" className="gap-1.5 text-xs text-muted-foreground">
              <Flag className="w-3.5 h-3.5" />
              Report
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Lightbox */}
      <Dialog open={!!lightboxPhoto} onOpenChange={() => setLightboxPhoto(null)}>
        <DialogContent className="max-w-3xl p-2 bg-background/95">
          {lightboxPhoto && (
            <img
              src={lightboxPhoto}
              alt="Review photo enlarged"
              className="w-full h-auto max-h-[80vh] object-contain rounded-lg"
            />
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
