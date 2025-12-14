import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useState, useEffect } from "react";

export interface SafetyAlert {
  id: string;
  brand: string;
  material: string;
  batch_info: string | null;
  headline: string;
  reason: string;
  affected_timeframe: string | null;
  priority: "critical" | "warning" | "info";
  details_url: string | null;
  is_active: boolean;
  created_at: string;
  expires_at: string | null;
  filament_id: string | null;
}

const DISMISSED_ALERTS_KEY = "filascope_dismissed_alerts";

interface DismissedAlert {
  id: string;
  dismissedAt: number;
  expiresAt: number;
}

export function useSafetyAlerts() {
  const [dismissedAlerts, setDismissedAlerts] = useState<DismissedAlert[]>([]);

  // Load dismissed alerts from localStorage
  useEffect(() => {
    const stored = localStorage.getItem(DISMISSED_ALERTS_KEY);
    if (stored) {
      try {
        const parsed = JSON.parse(stored) as DismissedAlert[];
        // Filter out expired dismissals
        const now = Date.now();
        const valid = parsed.filter((d) => d.expiresAt > now);
        setDismissedAlerts(valid);
        // Clean up expired entries
        if (valid.length !== parsed.length) {
          localStorage.setItem(DISMISSED_ALERTS_KEY, JSON.stringify(valid));
        }
      } catch {
        setDismissedAlerts([]);
      }
    }
  }, []);

  const dismissAlert = (alertId: string) => {
    const now = Date.now();
    const expiresAt = now + 7 * 24 * 60 * 60 * 1000; // 7 days
    const newDismissed = [
      ...dismissedAlerts.filter((d) => d.id !== alertId),
      { id: alertId, dismissedAt: now, expiresAt },
    ];
    setDismissedAlerts(newDismissed);
    localStorage.setItem(DISMISSED_ALERTS_KEY, JSON.stringify(newDismissed));
  };

  const query = useQuery({
    queryKey: ["safety-alerts"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("safety_alerts")
        .select("*")
        .eq("is_active", true)
        .or(`expires_at.is.null,expires_at.gt.${new Date().toISOString()}`)
        .order("priority", { ascending: true }) // critical first
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as SafetyAlert[];
    },
    staleTime: 1000 * 60 * 5, // 5 minute cache
  });

  // Filter out dismissed alerts
  const dismissedIds = new Set(dismissedAlerts.map((d) => d.id));
  const visibleAlerts = query.data?.filter((a) => !dismissedIds.has(a.id)) || [];

  return {
    ...query,
    alerts: visibleAlerts,
    dismissAlert,
    dismissedCount: query.data ? query.data.length - visibleAlerts.length : 0,
  };
}
