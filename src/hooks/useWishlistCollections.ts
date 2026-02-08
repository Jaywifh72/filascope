import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

export interface WishlistCollection {
  id: string;
  name: string;
  description: string | null;
  icon: string;
  color: string;
  sort_order: number;
  is_default: boolean;
  is_public: boolean;
  slug: string | null;
  created_at: string;
  item_count?: number;
}

export function useWishlistCollections() {
  const { user } = useAuth();
  const [collections, setCollections] = useState<WishlistCollection[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchCollections = useCallback(async () => {
    if (!user) {
      setCollections([]);
      setIsLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from("wishlist_collections")
        .select("*")
        .eq("user_id", user.id)
        .order("sort_order", { ascending: true });

      if (error) throw error;

      // Get item counts for each collection
      const { data: favorites } = await supabase
        .from("user_favorites")
        .select("collection_id")
        .eq("user_id", user.id);

      const countMap: Record<string, number> = {};
      (favorites || []).forEach((fav: any) => {
        if (fav.collection_id) {
          countMap[fav.collection_id] = (countMap[fav.collection_id] || 0) + 1;
        }
      });

      const collectionsWithCount = (data || []).map((c) => ({
        ...c,
        item_count: countMap[c.id] || 0,
      }));

      setCollections(collectionsWithCount);
    } catch (error) {
      console.error("Error fetching collections:", error);
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchCollections();
  }, [fetchCollections]);

  const createCollection = async (
    name: string,
    options?: {
      description?: string;
      icon?: string;
      color?: string;
      is_public?: boolean;
    }
  ) => {
    if (!user) {
      toast.error("Please sign in to create collections");
      return null;
    }

    const slug = name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");

    try {
      const { data, error } = await supabase
        .from("wishlist_collections")
        .insert({
          user_id: user.id,
          name,
          description: options?.description || null,
          icon: options?.icon || "folder",
          color: options?.color || "#00d9ff",
          sort_order: collections.length,
          is_public: options?.is_public || false,
          slug,
        })
        .select()
        .single();

      if (error) throw error;

      toast.success(`Collection "${name}" created`);
      await fetchCollections();
      return data;
    } catch (error) {
      console.error("Error creating collection:", error);
      toast.error("Failed to create collection");
      return null;
    }
  };

  const updateCollection = async (
    id: string,
    updates: {
      name?: string;
      description?: string | null;
      icon?: string;
      color?: string;
      is_public?: boolean;
    }
  ) => {
    if (!user) return false;

    try {
      const { error } = await supabase
        .from("wishlist_collections")
        .update(updates)
        .eq("id", id)
        .eq("user_id", user.id);

      if (error) throw error;

      toast.success("Collection updated");
      await fetchCollections();
      return true;
    } catch (error) {
      console.error("Error updating collection:", error);
      toast.error("Failed to update collection");
      return false;
    }
  };

  const deleteCollection = async (id: string) => {
    if (!user) return false;

    try {
      const { error } = await supabase
        .from("wishlist_collections")
        .delete()
        .eq("id", id)
        .eq("user_id", user.id);

      if (error) throw error;

      toast.success("Collection deleted");
      await fetchCollections();
      return true;
    } catch (error) {
      console.error("Error deleting collection:", error);
      toast.error("Failed to delete collection");
      return false;
    }
  };

  return {
    collections,
    isLoading,
    createCollection,
    updateCollection,
    deleteCollection,
    refetch: fetchCollections,
  };
}
