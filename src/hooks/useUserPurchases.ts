import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

export interface UserPurchase {
  id: string;
  user_id: string;
  filament_id: string;
  product_type: string;
  purchased_at: string | null;
  store_name: string | null;
  price_paid: number | null;
  currency: string | null;
  notes: string | null;
  created_at: string | null;
  filament?: {
    id: string;
    product_title: string;
    vendor: string | null;
    material: string | null;
    featured_image: string | null;
    variant_price: number | null;
    color_hex: string | null;
  } | null;
  printer?: {
    id: string;
    model_name: string;
    display_name: string | null;
    image_url: string | null;
  } | null;
}

export interface PurchaseFormData {
  product_id: string;
  product_type: "filament" | "printer";
  purchased_at: string;
  store_name?: string;
  price_paid?: number | null;
  currency?: string;
  notes?: string;
}

export interface PurchaseStats {
  totalPurchases: number;
  totalSpent: number;
  currency: string;
  spendingByMaterial: Record<string, number>;
  spendingByBrand: Record<string, number>;
}

export function useUserPurchases() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const purchasesQuery = useQuery({
    queryKey: ["user-purchases", user?.id],
    queryFn: async (): Promise<UserPurchase[]> => {
      if (!user?.id) return [];

      const { data, error } = await supabase
        .from("user_purchases")
        .select(`
          *,
          filament:filaments!user_purchases_filament_id_fkey(
            id, product_title, vendor, material, featured_image, variant_price, color_hex
          )
        `)
        .eq("user_id", user.id)
        .order("purchase_date", { ascending: false });

      if (error) throw error;

      // Map filament data to the expected shape
      return (data || []).map((p: any) => ({
        ...p,
        purchased_at: p.purchase_date,
        filament: p.filament,
        printer: null, // Printer purchases can be added later
      }));
    },
    enabled: !!user?.id,
    staleTime: 1000 * 60 * 2,
  });

  const addPurchase = useMutation({
    mutationFn: async (data: PurchaseFormData) => {
      if (!user?.id) throw new Error("Must be logged in");

      const { data: result, error } = await supabase
        .from("user_purchases")
        .insert({
          user_id: user.id,
          filament_id: data.product_id,
          product_type: data.product_type,
          purchase_date: data.purchased_at,
          store_name: data.store_name || null,
          price_paid: data.price_paid ?? null,
          currency: data.currency || "USD",
          notes: data.notes || null,
        })
        .select()
        .single();

      if (error) throw error;

      // Auto-set verified_purchase on existing reviews
      await supabase
        .from("product_reviews")
        .update({ verified_purchase: true })
        .eq("user_id", user.id)
        .eq("product_id", data.product_id)
        .eq("product_type", data.product_type);

      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["user-purchases"] });
      queryClient.invalidateQueries({ queryKey: ["vault-counts"] });
      queryClient.invalidateQueries({ queryKey: ["product-reviews"] });
      queryClient.invalidateQueries({ queryKey: ["purchase-check"] });
      toast.success("Purchase recorded!");
    },
    onError: (error: any) => {
      toast.error("Failed to record purchase", {
        description: error?.message || "Please try again",
      });
    },
  });

  const updatePurchase = useMutation({
    mutationFn: async ({
      purchaseId,
      data,
    }: {
      purchaseId: string;
      data: Partial<PurchaseFormData>;
    }) => {
      if (!user?.id) throw new Error("Must be logged in");

      const updateData: Record<string, any> = {};
      if (data.purchased_at !== undefined) updateData.purchase_date = data.purchased_at;
      if (data.store_name !== undefined) updateData.store_name = data.store_name;
      if (data.price_paid !== undefined) updateData.price_paid = data.price_paid;
      if (data.currency !== undefined) updateData.currency = data.currency;
      if (data.notes !== undefined) updateData.notes = data.notes;

      const { error } = await supabase
        .from("user_purchases")
        .update(updateData)
        .eq("id", purchaseId)
        .eq("user_id", user.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["user-purchases"] });
      toast.success("Purchase updated!");
    },
  });

  const deletePurchase = useMutation({
    mutationFn: async (purchaseId: string) => {
      if (!user?.id) throw new Error("Must be logged in");

      const { error } = await supabase
        .from("user_purchases")
        .delete()
        .eq("id", purchaseId)
        .eq("user_id", user.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["user-purchases"] });
      queryClient.invalidateQueries({ queryKey: ["vault-counts"] });
      queryClient.invalidateQueries({ queryKey: ["purchase-check"] });
      toast.success("Purchase removed");
    },
  });

  // Compute stats
  const stats: PurchaseStats = {
    totalPurchases: 0,
    totalSpent: 0,
    currency: "USD",
    spendingByMaterial: {},
    spendingByBrand: {},
  };

  if (purchasesQuery.data) {
    stats.totalPurchases = purchasesQuery.data.length;
    purchasesQuery.data.forEach((p) => {
      if (p.price_paid) {
        stats.totalSpent += p.price_paid;
      }
      const material = p.filament?.material || "Unknown";
      const brand = p.filament?.vendor || "Unknown";
      stats.spendingByMaterial[material] =
        (stats.spendingByMaterial[material] || 0) + (p.price_paid || 0);
      stats.spendingByBrand[brand] =
        (stats.spendingByBrand[brand] || 0) + (p.price_paid || 0);
    });
  }

  return {
    purchases: purchasesQuery.data ?? [],
    stats,
    isLoading: purchasesQuery.isLoading,
    addPurchase: addPurchase.mutate,
    isAdding: addPurchase.isPending,
    updatePurchase: updatePurchase.mutate,
    isUpdating: updatePurchase.isPending,
    deletePurchase: deletePurchase.mutate,
    isDeleting: deletePurchase.isPending,
  };
}

/** Check if a specific product has been purchased by the current user */
export function usePurchaseCheck(productId: string, productType: string = "filament") {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["purchase-check", productId, productType, user?.id],
    queryFn: async () => {
      if (!user?.id) return null;

      const { data, error } = await supabase
        .from("user_purchases")
        .select("id, purchase_date, store_name, price_paid")
        .eq("user_id", user.id)
        .eq("filament_id", productId)
        .order("purchase_date", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) throw error;
      return data;
    },
    enabled: !!user?.id && !!productId,
    staleTime: 1000 * 60 * 5,
  });
}
