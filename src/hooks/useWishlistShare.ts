import { useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

export interface SharedWishlist {
  id: string;
  collection_id: string | null;
  share_code: string;
  title: string | null;
  is_active: boolean;
  views_count: number;
  created_at: string;
  expires_at: string | null;
}

function generateShareCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789";
  let code = "";
  for (let i = 0; i < 8; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

export function useWishlistShare() {
  const { user } = useAuth();
  const [shares, setShares] = useState<SharedWishlist[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const fetchShares = useCallback(async () => {
    if (!user) return;

    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from("shared_wishlists")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setShares(data || []);
    } catch (error) {
      console.error("Error fetching shares:", error);
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  const createShareLink = async (options?: {
    collectionId?: string;
    title?: string;
    expiresInDays?: number;
  }) => {
    if (!user) {
      toast.error("Please sign in to share wishlists");
      return null;
    }

    try {
      const shareCode = generateShareCode();
      const expiresAt = options?.expiresInDays
        ? new Date(Date.now() + options.expiresInDays * 24 * 60 * 60 * 1000).toISOString()
        : null;

      const { data, error } = await supabase
        .from("shared_wishlists")
        .insert({
          user_id: user.id,
          collection_id: options?.collectionId || null,
          share_code: shareCode,
          title: options?.title || "My Wishlist",
          expires_at: expiresAt,
        })
        .select()
        .single();

      if (error) throw error;

      const shareUrl = `${window.location.origin}/wishlist/${shareCode}`;
      await navigator.clipboard.writeText(shareUrl);
      toast.success("Share link copied to clipboard!");

      await fetchShares();
      return { ...data, url: shareUrl };
    } catch (error) {
      console.error("Error creating share link:", error);
      toast.error("Failed to create share link");
      return null;
    }
  };

  const revokeShareLink = async (shareId: string) => {
    if (!user) return false;

    try {
      const { error } = await supabase
        .from("shared_wishlists")
        .update({ is_active: false })
        .eq("id", shareId)
        .eq("user_id", user.id);

      if (error) throw error;

      toast.success("Share link revoked");
      await fetchShares();
      return true;
    } catch (error) {
      console.error("Error revoking share:", error);
      toast.error("Failed to revoke share link");
      return false;
    }
  };

  const getSharedWishlist = async (shareCode: string) => {
    try {
      // Get the share record
      const { data: share, error: shareError } = await supabase
        .from("shared_wishlists")
        .select("*")
        .eq("share_code", shareCode)
        .eq("is_active", true)
        .maybeSingle();

      if (shareError) throw shareError;
      if (!share) return null;

      // Check if expired
      if (share.expires_at && new Date(share.expires_at) < new Date()) {
        return null;
      }

      // Increment view count
      await supabase
        .from("shared_wishlists")
        .update({ views_count: (share.views_count || 0) + 1 })
        .eq("id", share.id);

      // Get the wishlist items
      let query = supabase
        .from("user_favorites")
        .select(`
          id,
          filament_id,
          tags,
          created_at,
          filament:filaments (
            id,
            product_title,
            vendor,
            material,
            featured_image,
            variant_price,
            net_weight_g,
            color_hex
          )
        `)
        .eq("user_id", share.user_id);

      if (share.collection_id) {
        query = query.eq("collection_id", share.collection_id);
      }

      const { data: items, error: itemsError } = await query.order("created_at", {
        ascending: false,
      });

      if (itemsError) throw itemsError;

      return {
        share,
        items: items || [],
      };
    } catch (error) {
      console.error("Error fetching shared wishlist:", error);
      return null;
    }
  };

  return {
    shares,
    isLoading,
    fetchShares,
    createShareLink,
    revokeShareLink,
    getSharedWishlist,
  };
}
