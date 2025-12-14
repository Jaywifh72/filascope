import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface HistoricalAlert {
  id: string;
  brand: string;
  material: string;
  batch_info: string | null;
  headline: string;
  reason: string;
  priority: "critical" | "warning" | "info";
  resolution_status: string | null;
  resolved_at: string | null;
  resolution_notes: string | null;
  created_at: string;
  is_active: boolean;
}

export function useAlertHistory(filter: "all" | "resolved" | "active" = "all", search: string = "") {
  return useQuery({
    queryKey: ["alert-history", filter, search],
    queryFn: async () => {
      let query = supabase
        .from("safety_alerts")
        .select("id, brand, material, batch_info, headline, reason, priority, resolution_status, resolved_at, resolution_notes, created_at, is_active")
        .order("created_at", { ascending: false })
        .limit(50);

      // Filter by status
      if (filter === "resolved") {
        query = query.eq("resolution_status", "resolved");
      } else if (filter === "active") {
        query = query.neq("resolution_status", "resolved");
      }

      const { data, error } = await query;

      if (error) throw error;

      // Client-side search filter
      let results = data as HistoricalAlert[];
      if (search.trim()) {
        const searchLower = search.toLowerCase();
        results = results.filter(
          (alert) =>
            alert.brand.toLowerCase().includes(searchLower) ||
            alert.material.toLowerCase().includes(searchLower) ||
            alert.headline.toLowerCase().includes(searchLower)
        );
      }

      return results;
    },
    staleTime: 1000 * 60 * 5,
  });
}
