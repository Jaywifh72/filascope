import { useState, useEffect } from "react";
import { Heart } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { Button } from "./ui/button";

interface LikeButtonProps {
  filamentId: string;
  size?: "default" | "sm" | "lg";
}

export const LikeButton = ({ filamentId, size = "default" }: LikeButtonProps) => {
  const { user } = useAuth();
  const [isLiked, setIsLiked] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (user) {
      checkLikeStatus();
    }
  }, [user, filamentId]);

  const checkLikeStatus = async () => {
    if (!user) return;
    
    const { data } = await supabase
      .from("user_favorites")
      .select("id")
      .eq("user_id", user.id)
      .eq("filament_id", filamentId)
      .maybeSingle();
    
    setIsLiked(!!data);
  };

  const handleToggleLike = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!user) {
      toast.error("Please sign in to like filaments");
      return;
    }

    setIsLoading(true);
    
    try {
      if (isLiked) {
        const { error } = await supabase
          .from("user_favorites")
          .delete()
          .eq("user_id", user.id)
          .eq("filament_id", filamentId);
        
        if (error) throw error;
        setIsLiked(false);
        toast.success("Removed from liked filaments");
      } else {
        const { error } = await supabase
          .from("user_favorites")
          .insert({ user_id: user.id, filament_id: filamentId });
        
        if (error) throw error;
        setIsLiked(true);
        toast.success("Added to liked filaments");
      }
    } catch (error) {
      console.error("Error toggling like:", error);
      toast.error("Failed to update likes");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Button
      variant="ghost"
      size={size === "sm" ? "sm" : size === "lg" ? "lg" : "default"}
      onClick={handleToggleLike}
      disabled={isLoading}
      className={`transition-colors ${isLiked ? "text-red-500 hover:text-red-600" : "text-muted-foreground hover:text-foreground"}`}
      aria-label={isLiked ? "Remove from favorites" : "Add to favorites"}
      aria-pressed={isLiked}
    >
      <Heart className={`w-4 h-4 ${isLiked ? "fill-current" : ""}`} />
    </Button>
  );
};
