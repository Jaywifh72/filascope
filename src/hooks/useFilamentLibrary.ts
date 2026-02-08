import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

export type InteractionType = "wishlist" | "purchased" | "reviewed" | "noted" | "alert";
export type LibrarySortOption = "recent" | "rating" | "price" | "brand";
export type LibraryFilterOption = InteractionType | "all";

export interface LibraryInteraction {
  type: InteractionType;
  date: string;
  detail?: string;
}

export interface LibraryProduct {
  filament_id: string;
  product_title: string;
  vendor: string | null;
  material: string | null;
  featured_image: string | null;
  color_hex: string | null;
  current_price: number | null;
  // Interaction flags
  wishlisted: boolean;
  purchased: boolean;
  reviewed: boolean;
  hasNote: boolean;
  hasAlert: boolean;
  // Details
  rating: number | null; // user's review rating
  reviewId: string | null;
  purchasePrice: number | null;
  purchaseDate: string | null;
  purchaseStore: string | null;
  notePreview: string | null;
  lastInteracted: string; // most recent interaction date
  interactions: LibraryInteraction[];
}

export function useFilamentLibrary() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const libraryQuery = useQuery({
    queryKey: ["filament-library", user?.id],
    enabled: !!user,
    queryFn: async (): Promise<LibraryProduct[]> => {
      const userId = user!.id;

      // Fetch all user interaction data in parallel
      const [wishlistRes, purchaseRes, reviewRes, noteRes, alertRes] = await Promise.all([
        supabase
          .from("user_favorites")
          .select("filament_id, created_at")
          .eq("user_id", userId),
        supabase
          .from("user_purchases")
          .select("filament_id, purchase_date, store_name, price_paid")
          .eq("user_id", userId),
        supabase
          .from("product_reviews")
          .select("id, product_id, overall_rating, headline, created_at")
          .eq("user_id", userId)
          .eq("product_type", "filament")
          .is("deleted_at", null),
        supabase
          .from("user_notes")
          .select("product_id, note_text, status, updated_at")
          .eq("user_id", userId)
          .eq("product_type", "filament"),
        supabase
          .from("price_alerts")
          .select("filament_id, created_at")
          .eq("user_id", userId)
          .eq("is_active", true),
      ]);

      // Collect all unique filament IDs
      const filamentIds = new Set<string>();
      const wishlistMap = new Map<string, string>();
      const purchaseMap = new Map<string, { date: string; store: string | null; price: number | null }>();
      const reviewMap = new Map<string, { id: string; rating: number; headline: string; date: string }>();
      const noteMap = new Map<string, { text: string; status: string | null; date: string }>();
      const alertMap = new Map<string, string>();

      (wishlistRes.data || []).forEach((w: any) => {
        filamentIds.add(w.filament_id);
        wishlistMap.set(w.filament_id, w.created_at);
      });

      (purchaseRes.data || []).forEach((p: any) => {
        if (p.filament_id) {
          filamentIds.add(p.filament_id);
          // Keep the most recent purchase
          const existing = purchaseMap.get(p.filament_id);
          if (!existing || new Date(p.purchase_date) > new Date(existing.date)) {
            purchaseMap.set(p.filament_id, {
              date: p.purchase_date,
              store: p.store_name,
              price: p.price_paid,
            });
          }
        }
      });

      (reviewRes.data || []).forEach((r: any) => {
        filamentIds.add(r.product_id);
        reviewMap.set(r.product_id, {
          id: r.id,
          rating: r.overall_rating,
          headline: r.headline,
          date: r.created_at,
        });
      });

      (noteRes.data || []).forEach((n: any) => {
        filamentIds.add(n.product_id);
        noteMap.set(n.product_id, {
          text: n.note_text,
          status: n.status,
          date: n.updated_at,
        });
      });

      (alertRes.data || []).forEach((a: any) => {
        filamentIds.add(a.filament_id);
        alertMap.set(a.filament_id, a.created_at);
      });

      if (filamentIds.size === 0) return [];

      // Fetch filament details
      const ids = Array.from(filamentIds);
      const { data: filaments } = await supabase
        .from("filaments")
        .select("id, product_title, vendor, material, featured_image, variant_price, color_hex")
        .in("id", ids);

      const filamentMap = new Map((filaments || []).map((f: any) => [f.id, f]));

      // Build library items
      return ids
        .map((fId) => {
          const f = filamentMap.get(fId);
          if (!f) return null;

          const wishDate = wishlistMap.get(fId);
          const purchase = purchaseMap.get(fId);
          const review = reviewMap.get(fId);
          const note = noteMap.get(fId);
          const alertDate = alertMap.get(fId);

          // Build interactions timeline
          const interactions: LibraryInteraction[] = [];
          if (wishDate) interactions.push({ type: "wishlist", date: wishDate, detail: "Added to wishlist" });
          if (purchase) interactions.push({
            type: "purchased",
            date: purchase.date,
            detail: `Purchased${purchase.store ? ` at ${purchase.store}` : ""}${purchase.price ? ` for $${purchase.price.toFixed(2)}` : ""}`,
          });
          if (note) interactions.push({
            type: "noted",
            date: note.date,
            detail: note.text.length > 80 ? note.text.slice(0, 80) + "…" : note.text,
          });
          if (review) interactions.push({
            type: "reviewed",
            date: review.date,
            detail: `${review.rating}★ "${review.headline}"`,
          });
          if (alertDate) interactions.push({ type: "alert", date: alertDate, detail: "Price alert set" });

          interactions.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

          // Most recent interaction
          const dates = [wishDate, purchase?.date, review?.date, note?.date, alertDate].filter(Boolean) as string[];
          const lastInteracted = dates.sort((a, b) => new Date(b).getTime() - new Date(a).getTime())[0] || "";

          return {
            filament_id: fId,
            product_title: f.product_title,
            vendor: f.vendor,
            material: f.material,
            featured_image: f.featured_image,
            color_hex: f.color_hex,
            current_price: f.variant_price,
            wishlisted: !!wishDate,
            purchased: !!purchase,
            reviewed: !!review,
            hasNote: !!note,
            hasAlert: !!alertDate,
            rating: review?.rating ?? null,
            reviewId: review?.id ?? null,
            purchasePrice: purchase?.price ?? null,
            purchaseDate: purchase?.date ?? null,
            purchaseStore: purchase?.store ?? null,
            notePreview: note?.text ? (note.text.length > 60 ? note.text.slice(0, 60) + "…" : note.text) : null,
            lastInteracted,
            interactions,
          } as LibraryProduct;
        })
        .filter(Boolean) as LibraryProduct[];
    },
    staleTime: 1000 * 60 * 2,
  });

  // Quick rate mutation — creates a minimal public review
  const quickRate = useMutation({
    mutationFn: async ({ productId, rating }: { productId: string; rating: number }) => {
      if (!user?.id) throw new Error("Must be logged in");

      // Check if review already exists
      const { data: existing } = await supabase
        .from("product_reviews")
        .select("id")
        .eq("user_id", user.id)
        .eq("product_id", productId)
        .eq("product_type", "filament")
        .is("deleted_at", null)
        .maybeSingle();

      if (existing) {
        // Update existing review rating
        const { error } = await supabase
          .from("product_reviews")
          .update({ overall_rating: rating, updated_at: new Date().toISOString() })
          .eq("id", existing.id)
          .eq("user_id", user.id);
        if (error) throw error;
      } else {
        // Create minimal review
        const { error } = await supabase
          .from("product_reviews")
          .insert({
            user_id: user.id,
            product_id: productId,
            product_type: "filament",
            overall_rating: rating,
            headline: "",
            body: "",
            is_public: true,
            status: "published",
          });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["filament-library"] });
      queryClient.invalidateQueries({ queryKey: ["vault-reviews-full"] });
      queryClient.invalidateQueries({ queryKey: ["vault-counts"] });
      queryClient.invalidateQueries({ queryKey: ["product-reviews"] });
      toast.success("Rating saved!");
    },
    onError: () => {
      toast.error("Failed to save rating");
    },
  });

  return {
    products: libraryQuery.data ?? [],
    isLoading: libraryQuery.isLoading,
    quickRate: quickRate.mutate,
    isRating: quickRate.isPending,
  };
}
