import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export interface VaultProfile {
  id: string;
  display_name: string | null;
  avatar_url: string | null;
  email: string | null;
  created_at: string | null;
  username_slug: string | null;
  is_public: boolean;
}

export interface VaultCounts {
  wishlist: number;
  purchased: number;
  projects: number;
  reviews: number;
  notes: number;
  alerts: number;
  history: number;
}

export function useVaultProfile() {
  const { user } = useAuth();

  const profileQuery = useQuery({
    queryKey: ["vault-profile", user?.id],
    queryFn: async (): Promise<VaultProfile | null> => {
      if (!user?.id) return null;

      const { data, error } = await supabase
        .from("profiles")
        .select("id, display_name, avatar_url, email, created_at, username_slug, is_public")
        .eq("id", user.id)
        .single();

      if (error) {
        console.error("Error fetching profile:", error);
        return null;
      }
      return data;
    },
    enabled: !!user?.id,
    staleTime: 1000 * 60 * 5,
  });

  const countsQuery = useQuery({
    queryKey: ["vault-counts", user?.id],
    queryFn: async (): Promise<VaultCounts> => {
      if (!user?.id)
        return { wishlist: 0, purchased: 0, projects: 0, reviews: 0, notes: 0, alerts: 0, history: 0 };

      const [wishlistRes, purchasedRes, projectsRes, reviewsRes, notesRes, alertsRes, historyRes] =
        await Promise.all([
          supabase
            .from("user_favorites")
            .select("id", { count: "exact", head: true })
            .eq("user_id", user.id),
          supabase
            .from("user_purchases")
            .select("id", { count: "exact", head: true })
            .eq("user_id", user.id),
          supabase
            .from("projects")
            .select("id", { count: "exact", head: true })
            .eq("user_id", user.id),
          supabase
            .from("product_reviews")
            .select("id", { count: "exact", head: true })
            .eq("user_id", user.id)
            .eq("is_public", true)
            .is("deleted_at", null),
          supabase
            .from("user_notes")
            .select("id", { count: "exact", head: true })
            .eq("user_id", user.id),
          supabase
            .from("price_alerts")
            .select("id", { count: "exact", head: true })
            .eq("user_id", user.id)
            .eq("is_active", true),
          supabase
            .from("user_browse_history")
            .select("id", { count: "exact", head: true })
            .eq("user_id", user.id),
        ]);

      return {
        wishlist: wishlistRes.count ?? 0,
        purchased: purchasedRes.count ?? 0,
        projects: projectsRes.count ?? 0,
        reviews: reviewsRes.count ?? 0,
        notes: notesRes.count ?? 0,
        alerts: alertsRes.count ?? 0,
        history: historyRes.count ?? 0,
      };
    },
    enabled: !!user?.id,
    staleTime: 1000 * 60 * 2,
  });

  return {
    profile: profileQuery.data ?? null,
    counts: countsQuery.data ?? {
      wishlist: 0,
      purchased: 0,
      projects: 0,
      reviews: 0,
      notes: 0,
      alerts: 0,
      history: 0,
    },
    isLoading: profileQuery.isLoading || countsQuery.isLoading,
  };
}
