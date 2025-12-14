import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";

const SESSION_KEY = "filascope_session_id";

function getSessionId(): string {
  return localStorage.getItem(SESSION_KEY) || "";
}

interface BrowseHistoryItem {
  id: string;
  filament_id: string;
  viewed_at: string;
  filament: {
    id: string;
    product_title: string;
    vendor: string | null;
    material: string | null;
    featured_image: string | null;
    color_hex: string | null;
    variant_price: number | null;
    net_weight_g: number | null;
  } | null;
}

export function useBrowseHistory(limit = 10) {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ["browse-history", user?.id, limit],
    queryFn: async () => {
      const userId = user?.id;
      const sessionId = getSessionId();

      let queryBuilder = supabase
        .from("user_browse_history")
        .select(`
          id,
          filament_id,
          viewed_at,
          filament:filaments(
            id,
            product_title,
            vendor,
            material,
            featured_image,
            color_hex,
            variant_price,
            net_weight_g
          )
        `)
        .order("viewed_at", { ascending: false })
        .limit(limit);

      if (userId) {
        queryBuilder = queryBuilder.eq("user_id", userId);
      } else if (sessionId) {
        queryBuilder = queryBuilder.eq("session_id", sessionId);
      } else {
        return [];
      }

      const { data, error } = await queryBuilder;
      if (error) throw error;
      
      // Deduplicate by filament_id, keeping most recent
      const seen = new Set<string>();
      return (data || []).filter((item) => {
        if (seen.has(item.filament_id)) return false;
        seen.add(item.filament_id);
        return true;
      }) as BrowseHistoryItem[];
    },
    staleTime: 1000 * 60 * 5,
  });

  const addToHistory = useMutation({
    mutationFn: async (filamentId: string) => {
      const userId = user?.id;
      const sessionId = userId ? null : getSessionId();

      if (!userId && !sessionId) return;

      // Insert new view
      await supabase.from("user_browse_history").insert({
        user_id: userId || null,
        session_id: sessionId,
        filament_id: filamentId,
      });

      // Clean up old entries (keep last 50)
      const { data: oldEntries } = await supabase
        .from("user_browse_history")
        .select("id")
        .eq(userId ? "user_id" : "session_id", userId || sessionId)
        .order("viewed_at", { ascending: false })
        .range(50, 1000);

      if (oldEntries && oldEntries.length > 0) {
        const idsToDelete = oldEntries.map(e => e.id);
        await supabase.from("user_browse_history").delete().in("id", idsToDelete);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["browse-history"] });
    },
  });

  const clearHistory = useMutation({
    mutationFn: async () => {
      const userId = user?.id;
      if (!userId) return;
      
      await supabase.from("user_browse_history").delete().eq("user_id", userId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["browse-history"] });
    },
  });

  return {
    history: query.data || [],
    isLoading: query.isLoading,
    addToHistory: addToHistory.mutate,
    clearHistory: clearHistory.mutate,
  };
}
