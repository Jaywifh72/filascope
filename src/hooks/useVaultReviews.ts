import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

export interface VaultReview {
  id: string;
  user_id: string;
  product_id: string;
  product_type: string;
  overall_rating: number;
  quality_rating: number | null;
  ease_rating: number | null;
  value_rating: number | null;
  headline: string;
  body: string;
  printer_used_id: string | null;
  nozzle_temp: number | null;
  bed_temp: number | null;
  print_speed: number | null;
  layer_height: number | null;
  pros: string[];
  cons: string[];
  is_public: boolean;
  is_verified_purchase: boolean;
  helpful_count: number;
  status: string;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
  photos: { id: string; photo_url: string; sort_order: number }[];
  filament?: {
    id: string;
    product_title: string;
    vendor: string;
    featured_image: string | null;
    material: string | null;
    color_hex: string | null;
  } | null;
  printer_info?: {
    id: string;
    model_name: string;
    display_name: string | null;
    brand_name: string | null;
    image_url: string | null;
  } | null;
}

export interface ReviewStats {
  totalReviews: number;
  averageRating: number;
  totalHelpfulVotes: number;
  reviewerRank: "new" | "active" | "top";
  rankLabel: string;
}

export type ReviewSortOption = "recent" | "helpful" | "lowest" | "highest";
export type ReviewProductFilter = "all" | "filament" | "printer";
export type ReviewRatingFilter = 0 | 1 | 2 | 3 | 4 | 5; // 0 = all

function getReviewerRank(count: number): { rank: ReviewStats["reviewerRank"]; label: string } {
  if (count >= 20) return { rank: "top", label: "Top Reviewer" };
  if (count >= 5) return { rank: "active", label: "Active Reviewer" };
  return { rank: "new", label: "New Reviewer" };
}

export function useVaultReviews() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const reviewsQuery = useQuery({
    queryKey: ["vault-reviews-full", user?.id],
    enabled: !!user,
    queryFn: async (): Promise<VaultReview[]> => {
      // Fetch all user reviews (including private, excluding deleted)
      const { data, error } = await supabase
        .from("product_reviews")
        .select(`
          *,
          photos:review_photos(id, photo_url, sort_order)
        `)
        .eq("user_id", user!.id)
        .is("deleted_at", null)
        .order("created_at", { ascending: false });

      if (error) throw error;

      const reviews = data || [];

      // Enrich with filament data
      const filamentIds = reviews
        .filter((r: any) => r.product_type === "filament")
        .map((r: any) => r.product_id);

      // Enrich with printer product data (for reviews of printers)
      const printerProductIds = reviews
        .filter((r: any) => r.product_type === "printer")
        .map((r: any) => r.product_id);

      const [filamentRes, printerRes] = await Promise.all([
        filamentIds.length > 0
          ? supabase
              .from("filaments")
              .select("id, product_title, vendor, featured_image, material, color_hex")
              .in("id", filamentIds)
          : { data: [] },
        printerProductIds.length > 0
          ? supabase
              .from("printers")
              .select("id, model_name, display_name, brand_name, image_url")
              .in("id", printerProductIds)
          : { data: [] },
      ]);

      const filamentMap = new Map((filamentRes.data || []).map((f: any) => [f.id, f]));
      const printerMap = new Map((printerRes.data || []).map((p: any) => [p.id, p]));

      return reviews.map((review: any) => ({
        ...review,
        pros: review.pros || [],
        cons: review.cons || [],
        photos: (review.photos || []).sort((a: any, b: any) => a.sort_order - b.sort_order),
        filament: filamentMap.get(review.product_id) || null,
        printer_info: printerMap.get(review.product_id) || null,
      }));
    },
    staleTime: 1000 * 60 * 2,
  });

  // Update review mutation
  const updateReview = useMutation({
    mutationFn: async ({
      reviewId,
      data,
    }: {
      reviewId: string;
      data: {
        overall_rating?: number;
        quality_rating?: number | null;
        ease_rating?: number | null;
        value_rating?: number | null;
        headline?: string;
        body?: string;
        pros?: string[];
        cons?: string[];
        printer_used_id?: string | null;
        nozzle_temp?: number | null;
        bed_temp?: number | null;
        print_speed?: number | null;
        layer_height?: number | null;
        is_public?: boolean;
      };
    }) => {
      if (!user?.id) throw new Error("Must be logged in");

      const { error } = await supabase
        .from("product_reviews")
        .update({
          ...data,
          updated_at: new Date().toISOString(),
        })
        .eq("id", reviewId)
        .eq("user_id", user.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["vault-reviews-full"] });
      queryClient.invalidateQueries({ queryKey: ["vault-counts"] });
      queryClient.invalidateQueries({ queryKey: ["product-reviews"] });
      toast.success("Review updated successfully!");
    },
    onError: () => {
      toast.error("Failed to update review");
    },
  });

  // Soft-delete review mutation
  const deleteReview = useMutation({
    mutationFn: async (reviewId: string) => {
      if (!user?.id) throw new Error("Must be logged in");

      const { error } = await supabase
        .from("product_reviews")
        .update({ deleted_at: new Date().toISOString() })
        .eq("id", reviewId)
        .eq("user_id", user.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["vault-reviews-full"] });
      queryClient.invalidateQueries({ queryKey: ["vault-counts"] });
      queryClient.invalidateQueries({ queryKey: ["product-reviews"] });
      toast.success("Review deleted");
    },
    onError: () => {
      toast.error("Failed to delete review");
    },
  });

  // Compute stats
  const allReviews = reviewsQuery.data ?? [];
  const publicReviews = allReviews.filter((r) => r.is_public);
  const totalHelpful = publicReviews.reduce((sum, r) => sum + r.helpful_count, 0);
  const avgRating =
    publicReviews.length > 0
      ? publicReviews.reduce((sum, r) => sum + r.overall_rating, 0) / publicReviews.length
      : 0;
  const { rank, label } = getReviewerRank(publicReviews.length);

  const stats: ReviewStats = {
    totalReviews: publicReviews.length,
    averageRating: avgRating,
    totalHelpfulVotes: totalHelpful,
    reviewerRank: rank,
    rankLabel: label,
  };

  return {
    reviews: publicReviews,
    stats,
    isLoading: reviewsQuery.isLoading,
    updateReview: updateReview.mutate,
    isUpdating: updateReview.isPending,
    deleteReview: deleteReview.mutate,
    isDeleting: deleteReview.isPending,
  };
}
