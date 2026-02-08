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
      // Fetch from new product_reviews table (public reviews only)
      const { data, error } = await supabase
        .from("product_reviews")
        .select("*")
        .eq("user_id", user!.id)
        .eq("is_public", true)
        .order("created_at", { ascending: false });
      if (error) throw error;

      // Enrich with filament data
      const filamentIds = (data || [])
        .filter((r: any) => r.product_type === "filament")
        .map((r: any) => r.product_id);

      let filamentMap = new Map();
      if (filamentIds.length > 0) {
        const { data: filaments } = await supabase
          .from("filaments")
          .select("id, product_title, vendor, featured_image, material")
          .in("id", filamentIds);
        filamentMap = new Map((filaments || []).map((f: any) => [f.id, f]));
      }

      return (data || []).map((review: any) => ({
        ...review,
        filament: filamentMap.get(review.product_id) || null,
      }));
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
                    to={`/filament/${review.product_id}`}
                    className="hover:text-primary transition-colors"
                  >
                    <CardTitle className="text-base truncate">
                      {review.filament?.product_title || review.headline}
                    </CardTitle>
                  </Link>
                  <p className="text-xs text-muted-foreground">{review.filament?.vendor}</p>
                </div>
              </div>
              <div className="flex items-center gap-0.5 shrink-0">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star
                    key={i}
                    className={`w-3.5 h-3.5 ${
                      i < review.overall_rating
                        ? "fill-primary text-primary"
                        : "text-muted-foreground/30"
                    }`}
                  />
                ))}
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            <h4 className="font-medium text-sm mb-1">{review.headline}</h4>
            {review.body && (
              <p className="text-sm text-foreground/80 mb-3 line-clamp-3">{review.body}</p>
            )}
            <div className="flex items-center gap-3 text-xs text-muted-foreground">
              <span>{new Date(review.created_at).toLocaleDateString()}</span>
              {review.is_verified_purchase && (
                <Badge variant="secondary" className="text-xs">Verified Purchase</Badge>
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
