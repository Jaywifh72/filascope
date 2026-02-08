import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

export interface CollectionItem {
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

/**
 * Add a filament to a specific collection.
 * Because the unique constraint is on (user_id, filament_id, collection_id),
 * the same filament can exist in multiple collections.
 */
export function useCollectionActions() {
  const { user } = useAuth();

  const addToCollection = async (
    filamentId: string,
    collectionId: string | null,
    priceWhenAdded?: number
  ) => {
    if (!user) {
      toast.error("Please sign in");
      return false;
    }

    try {
      const { error } = await supabase.from("user_favorites").insert({
        user_id: user.id,
        filament_id: filamentId,
        collection_id: collectionId,
        price_when_added: priceWhenAdded || null,
      });

      if (error) {
        if (error.code === "23505") {
          toast.info("Already in this collection");
          return false;
        }
        throw error;
      }

      toast.success("Added to collection");
      return true;
    } catch (error) {
      console.error("Error adding to collection:", error);
      toast.error("Failed to add to collection");
      return false;
    }
  };

  const removeFromCollection = async (
    filamentId: string,
    collectionId: string | null
  ) => {
    if (!user) return false;

    try {
      let query = supabase
        .from("user_favorites")
        .delete()
        .eq("user_id", user.id)
        .eq("filament_id", filamentId);

      if (collectionId) {
        query = query.eq("collection_id", collectionId);
      } else {
        query = query.is("collection_id", null);
      }

      const { error } = await query;
      if (error) throw error;

      toast.success("Removed from collection");
      return true;
    } catch (error) {
      console.error("Error removing from collection:", error);
      toast.error("Failed to remove");
      return false;
    }
  };

  const getCollectionsForFilament = async (filamentId: string): Promise<string[]> => {
    if (!user) return [];

    const { data } = await supabase
      .from("user_favorites")
      .select("collection_id")
      .eq("user_id", user.id)
      .eq("filament_id", filamentId);

    return (data || [])
      .map((d: any) => d.collection_id)
      .filter(Boolean) as string[];
  };

  const isInAnyCollection = async (filamentId: string): Promise<boolean> => {
    if (!user) return false;

    const { count } = await supabase
      .from("user_favorites")
      .select("id", { count: "exact", head: true })
      .eq("user_id", user.id)
      .eq("filament_id", filamentId);

    return (count || 0) > 0;
  };

  return {
    addToCollection,
    removeFromCollection,
    getCollectionsForFilament,
    isInAnyCollection,
  };
}
