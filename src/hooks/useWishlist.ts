import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

export interface WishlistItem {
  id: string;
  filament_id: string;
  collection_id: string | null;
  tags: string[];
  notes: string | null;
  price_when_added: number | null;
  created_at: string;
  filament: {
    id: string;
    product_title: string;
    vendor: string | null;
    material: string | null;
    featured_image: string | null;
    variant_price: number | null;
    net_weight_g: number | null;
    color_hex: string | null;
  } | null;
}

export interface WishlistStats {
  totalItems: number;
  onSaleCount: number;
  backInStockCount: number;
  totalSavings: number;
}

export function useWishlist() {
  const { user } = useAuth();
  const [items, setItems] = useState<WishlistItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [stats, setStats] = useState<WishlistStats>({
    totalItems: 0,
    onSaleCount: 0,
    backInStockCount: 0,
    totalSavings: 0,
  });

  const fetchWishlist = useCallback(async () => {
    if (!user) {
      setItems([]);
      setIsLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from("user_favorites")
        .select(`
          id,
          filament_id,
          collection_id,
          tags,
          notes,
          price_when_added,
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
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (error) throw error;

      const wishlistItems = (data || []).map((item: any) => ({
        ...item,
        tags: item.tags || [],
        filament: item.filament,
      }));

      setItems(wishlistItems);

      // Calculate stats
      let onSaleCount = 0;
      let totalSavings = 0;

      wishlistItems.forEach((item) => {
        if (item.price_when_added && item.filament?.variant_price) {
          const priceDiff = item.price_when_added - item.filament.variant_price;
          if (priceDiff > 0) {
            onSaleCount++;
            totalSavings += priceDiff;
          }
        }
      });

      setStats({
        totalItems: wishlistItems.length,
        onSaleCount,
        backInStockCount: 0, // Would need availability tracking
        totalSavings,
      });
    } catch (error) {
      console.error("Error fetching wishlist:", error);
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchWishlist();
  }, [fetchWishlist]);

  const addToWishlist = async (
    filamentId: string,
    options?: {
      collectionId?: string;
      tags?: string[];
      notes?: string;
      priceWhenAdded?: number;
    }
  ) => {
    if (!user) {
      toast.error("Please sign in to add to wishlist");
      return false;
    }

    try {
      const { error } = await supabase.from("user_favorites").insert({
        user_id: user.id,
        filament_id: filamentId,
        collection_id: options?.collectionId || null,
        tags: options?.tags || [],
        notes: options?.notes || null,
        price_when_added: options?.priceWhenAdded || null,
      });

      if (error) throw error;

      toast.success("Added to wishlist");
      await fetchWishlist();
      return true;
    } catch (error) {
      console.error("Error adding to wishlist:", error);
      toast.error("Failed to add to wishlist");
      return false;
    }
  };

  const removeFromWishlist = async (filamentId: string) => {
    if (!user) return false;

    try {
      const { error } = await supabase
        .from("user_favorites")
        .delete()
        .eq("user_id", user.id)
        .eq("filament_id", filamentId);

      if (error) throw error;

      toast.success("Removed from wishlist");
      await fetchWishlist();
      return true;
    } catch (error) {
      console.error("Error removing from wishlist:", error);
      toast.error("Failed to remove from wishlist");
      return false;
    }
  };

  const updateItem = async (
    itemId: string,
    updates: {
      collection_id?: string | null;
      tags?: string[];
      notes?: string | null;
    }
  ) => {
    if (!user) return false;

    try {
      const { error } = await supabase
        .from("user_favorites")
        .update(updates)
        .eq("id", itemId)
        .eq("user_id", user.id);

      if (error) throw error;

      await fetchWishlist();
      return true;
    } catch (error) {
      console.error("Error updating wishlist item:", error);
      toast.error("Failed to update item");
      return false;
    }
  };

  const isInWishlist = (filamentId: string) => {
    return items.some((item) => item.filament_id === filamentId);
  };

  const getItemByFilamentId = (filamentId: string) => {
    return items.find((item) => item.filament_id === filamentId);
  };

  return {
    items,
    stats,
    isLoading,
    addToWishlist,
    removeFromWishlist,
    updateItem,
    isInWishlist,
    getItemByFilamentId,
    refetch: fetchWishlist,
  };
}
