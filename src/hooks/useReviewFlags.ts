import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

export function useReviewFlags(productId: string) {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const flagReview = useMutation({
    mutationFn: async ({
      reviewId,
      reason,
      details,
    }: {
      reviewId: string;
      reason: string;
      details?: string;
    }) => {
      if (!user?.id) throw new Error("Must be logged in");

      const { error } = await supabase.from("review_flags").insert({
        review_id: reviewId,
        reporter_id: user.id,
        reason,
        details: details || null,
      });

      if (error) {
        if (error.code === "23505") {
          throw new Error("already_reported");
        }
        throw error;
      }
    },
    onSuccess: () => {
      toast.success("Review reported. We'll look into it.");
      queryClient.invalidateQueries({ queryKey: ["product-reviews", productId] });
    },
    onError: (error: any) => {
      if (error?.message === "already_reported") {
        toast.info("You've already reported this review");
      } else {
        toast.error("Failed to submit report");
        console.error("Flag error:", error);
      }
    },
  });

  return {
    flagReview: flagReview.mutate,
    isFlagging: flagReview.isPending,
  };
}
