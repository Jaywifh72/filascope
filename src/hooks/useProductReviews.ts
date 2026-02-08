import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

export interface ProductReview {
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
  profile?: {
    display_name: string | null;
    avatar_url: string | null;
  };
  printer?: {
    id: string;
    model_name: string;
    display_name: string | null;
  } | null;
  photos?: {
    id: string;
    photo_url: string;
    sort_order: number;
  }[];
  user_voted?: boolean;
}

export interface ReviewSummary {
  averageRating: number;
  totalCount: number;
  distribution: Record<number, number>;
}

export function useProductReviews(productId: string, productType: string = "filament") {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const reviewsQuery = useQuery({
    queryKey: ["product-reviews", productId, productType],
    queryFn: async (): Promise<ProductReview[]> => {
      const { data, error } = await supabase
        .from("product_reviews")
        .select(`
          *,
          profile:profiles!product_reviews_user_id_fkey(display_name, avatar_url),
          printer:printers!product_reviews_printer_used_id_fkey(id, model_name, display_name),
          photos:review_photos(id, photo_url, sort_order)
        `)
        .eq("product_id", productId)
        .eq("product_type", productType)
        .eq("is_public", true)
        .eq("status", "published")
        .is("deleted_at", null)
        .order("created_at", { ascending: false });

      if (error) throw error;

      // Check if user has voted on each review
      let userVotes: Set<string> = new Set();
      if (user?.id) {
        const { data: votes } = await supabase
          .from("product_review_votes")
          .select("review_id")
          .eq("user_id", user.id);
        userVotes = new Set((votes || []).map((v: any) => v.review_id));
      }

      return (data || []).map((review: any) => ({
        ...review,
        pros: review.pros || [],
        cons: review.cons || [],
        photos: (review.photos || []).sort((a: any, b: any) => a.sort_order - b.sort_order),
        user_voted: userVotes.has(review.id),
      }));
    },
    staleTime: 1000 * 60 * 2,
  });

  // Check if user already reviewed this product
  const existingReviewQuery = useQuery({
    queryKey: ["user-review", productId, productType, user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      const { data, error } = await supabase
        .from("product_reviews")
        .select("id")
        .eq("user_id", user.id)
        .eq("product_id", productId)
        .eq("product_type", productType)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!user?.id,
  });

  const submitReview = useMutation({
    mutationFn: async (review: {
      overall_rating: number;
      quality_rating?: number;
      ease_rating?: number;
      value_rating?: number;
      headline: string;
      body: string;
      printer_used_id?: string;
      nozzle_temp?: number;
      bed_temp?: number;
      print_speed?: number;
      layer_height?: number;
      pros?: string[];
      cons?: string[];
      is_public?: boolean;
      is_verified_purchase?: boolean;
      photos?: File[];
    }) => {
      if (!user?.id) throw new Error("Must be logged in");

      const { photos, ...reviewData } = review;

      const { data, error } = await supabase
        .from("product_reviews")
        .insert({
          user_id: user.id,
          product_id: productId,
          product_type: productType,
          ...reviewData,
          pros: reviewData.pros || [],
          cons: reviewData.cons || [],
          is_public: reviewData.is_public ?? true,
          is_verified_purchase: reviewData.is_verified_purchase ?? false,
        })
        .select()
        .single();

      if (error) throw error;

      // Upload photos
      if (photos && photos.length > 0) {
        for (let i = 0; i < photos.length; i++) {
          const file = photos[i];
          const ext = file.name.split(".").pop();
          const path = `${user.id}/${data.id}/${i}.${ext}`;

          const { error: uploadError } = await supabase.storage
            .from("review-photos")
            .upload(path, file);

          if (uploadError) {
            console.error("Photo upload error:", uploadError);
            continue;
          }

          const { data: urlData } = supabase.storage
            .from("review-photos")
            .getPublicUrl(path);

          await supabase.from("review_photos").insert({
            review_id: data.id,
            photo_url: urlData.publicUrl,
            sort_order: i,
          });
        }
      }

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["product-reviews", productId] });
      queryClient.invalidateQueries({ queryKey: ["user-review", productId] });
      queryClient.invalidateQueries({ queryKey: ["vault-counts"] });
      toast.success("Review submitted successfully!");
    },
    onError: (error: any) => {
      if (error?.message?.includes("duplicate")) {
        toast.error("You've already reviewed this product");
      } else {
        toast.error("Failed to submit review");
      }
      console.error(error);
    },
  });

  const voteHelpful = useMutation({
    mutationFn: async (reviewId: string) => {
      if (!user?.id) throw new Error("Must be logged in");

      // Check if already voted
      const { data: existing } = await supabase
        .from("product_review_votes")
        .select("id")
        .eq("review_id", reviewId)
        .eq("user_id", user.id)
        .maybeSingle();

      if (existing) {
        // Remove vote and decrement count
        await supabase.from("product_review_votes").delete().eq("id", existing.id);
        // Get current count and decrement
        const { data: current } = await supabase
          .from("product_reviews")
          .select("helpful_count")
          .eq("id", reviewId)
          .single();
        const newCount = Math.max(0, (current?.helpful_count || 1) - 1);
        await supabase
          .from("product_reviews")
          .update({ helpful_count: newCount })
          .eq("id", reviewId);
      } else {
        // Add vote and increment count
        await supabase
          .from("product_review_votes")
          .insert({ review_id: reviewId, user_id: user.id });
        const { data: current } = await supabase
          .from("product_reviews")
          .select("helpful_count")
          .eq("id", reviewId)
          .single();
        const newCount = (current?.helpful_count || 0) + 1;
        await supabase
          .from("product_reviews")
          .update({ helpful_count: newCount })
          .eq("id", reviewId);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["product-reviews", productId] });
    },
  });

  // Compute summary
  const summary: ReviewSummary = {
    averageRating: 0,
    totalCount: 0,
    distribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
  };

  if (reviewsQuery.data) {
    summary.totalCount = reviewsQuery.data.length;
    if (summary.totalCount > 0) {
      const total = reviewsQuery.data.reduce((sum, r) => sum + r.overall_rating, 0);
      summary.averageRating = total / summary.totalCount;
      reviewsQuery.data.forEach((r) => {
        summary.distribution[r.overall_rating] = (summary.distribution[r.overall_rating] || 0) + 1;
      });
    }
  }

  return {
    reviews: reviewsQuery.data ?? [],
    summary,
    isLoading: reviewsQuery.isLoading,
    existingReview: existingReviewQuery.data,
    submitReview: submitReview.mutate,
    isSubmitting: submitReview.isPending,
    voteHelpful: voteHelpful.mutate,
    isVoting: voteHelpful.isPending,
  };
}
