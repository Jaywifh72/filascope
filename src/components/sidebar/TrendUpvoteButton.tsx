import { useState, useEffect } from "react";
import { ThumbsUp } from "lucide-react";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

interface TrendUpvoteButtonProps {
  trendId: string;
  initialCount: number;
}

export function TrendUpvoteButton({ trendId, initialCount }: TrendUpvoteButtonProps) {
  const { user } = useAuth();
  const [hasUpvoted, setHasUpvoted] = useState(false);
  const [upvoteCount, setUpvoteCount] = useState(initialCount);
  const [isLoading, setIsLoading] = useState(false);

  // Get or create anonymous ID for non-logged-in users
  const getAnonymousId = () => {
    let id = localStorage.getItem("filascope_anonymous_id");
    if (!id) {
      id = crypto.randomUUID();
      localStorage.setItem("filascope_anonymous_id", id);
    }
    return id;
  };

  // Check if user has already upvoted
  useEffect(() => {
    const checkUpvote = () => {
      const upvotedTrends = JSON.parse(localStorage.getItem("trend_upvotes") || "[]");
      setHasUpvoted(upvotedTrends.includes(trendId));
    };
    checkUpvote();
  }, [trendId]);

  const handleUpvote = async () => {
    if (hasUpvoted || isLoading) return;
    
    setIsLoading(true);
    
    try {
      const anonymousId = user ? null : getAnonymousId();
      
      // Insert upvote record
      const { error } = await supabase.from("trend_upvotes").insert({
        trend_id: trendId,
        user_id: user?.id || null,
        anonymous_id: anonymousId,
      });

      if (error) {
        // If duplicate, just update local state
        if (error.code === "23505") {
          setHasUpvoted(true);
          return;
        }
        throw error;
      }

      // Update count in trending_materials
      await supabase
        .from("trending_materials")
        .update({ upvote_count: upvoteCount + 1 })
        .eq("id", trendId);

      // Store in localStorage
      const upvotedTrends = JSON.parse(localStorage.getItem("trend_upvotes") || "[]");
      upvotedTrends.push(trendId);
      localStorage.setItem("trend_upvotes", JSON.stringify(upvotedTrends));

      setHasUpvoted(true);
      setUpvoteCount(prev => prev + 1);
    } catch (error) {
      console.error("Error upvoting:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <button
      onClick={handleUpvote}
      disabled={hasUpvoted || isLoading}
      className={cn(
        "flex items-center gap-1.5 text-xs rounded-full px-2 py-0.5 transition-all",
        hasUpvoted
          ? "bg-primary/20 text-primary cursor-default"
          : "bg-muted/50 hover:bg-muted text-muted-foreground hover:text-foreground"
      )}
    >
      <ThumbsUp className={cn("h-3 w-3", hasUpvoted && "fill-current")} />
      <span>{upvoteCount} makers agree</span>
    </button>
  );
}
