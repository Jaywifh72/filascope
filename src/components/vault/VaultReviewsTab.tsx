import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Star, ThumbsUp } from "lucide-react";
import { VaultEmptyState } from "./VaultEmptyState";

export function VaultReviewsTab() {
  const { user } = useAuth();

  const { data: reviews } = useQuery({
    queryKey: ["vault-reviews", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("filament_reviews")
        .select("*, filament:filaments(id, product_title, vendor, featured_image, material)")
        .eq("user_id", user!.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  if (!reviews?.length) {
    return (
      <VaultEmptyState
        icon={Star}
        title="No reviews yet"
        description="Share your experience with filaments to help the community make better choices."
        actionLabel="Browse Filaments to Review"
        actionHref="/"
      />
    );
  }

  return (
    <div className="space-y-4">
      {reviews.map((review: any) => (
        <Card key={review.id}>
          <CardHeader className="pb-3">
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-center gap-3 min-w-0">
                {review.filament?.featured_image && (
                  <img
                    src={review.filament.featured_image}
                    alt=""
                    className="w-10 h-10 rounded object-cover shrink-0"
                  />
                )}
                <div className="min-w-0">
                  <Link
                    to={`/filament/${review.filament?.id}`}
                    className="hover:text-primary transition-colors"
                  >
                    <CardTitle className="text-base truncate">
                      {review.filament?.product_title}
                    </CardTitle>
                  </Link>
                  <p className="text-xs text-muted-foreground">{review.filament?.vendor}</p>
                </div>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star
                    key={i}
                    className={`w-3.5 h-3.5 ${
                      i < review.rating
                        ? "fill-primary text-primary"
                        : "text-muted-foreground/30"
                    }`}
                  />
                ))}
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            {review.review_text && (
              <p className="text-sm text-foreground/80 mb-3">{review.review_text}</p>
            )}
            <div className="flex items-center gap-3 text-xs text-muted-foreground">
              <span>{new Date(review.created_at).toLocaleDateString()}</span>
              {review.verified_purchase && (
                <Badge variant="secondary" className="text-xs">
                  Verified Purchase
                </Badge>
              )}
              {(review.helpful_count ?? 0) > 0 && (
                <span className="flex items-center gap-1">
                  <ThumbsUp className="w-3 h-3" />
                  {review.helpful_count} helpful
                </span>
              )}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
