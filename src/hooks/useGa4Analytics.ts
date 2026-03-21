import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

// ─── Types ──────────────────────────────────────────────────────────────────

export type DateRange = "7d" | "30d" | "90d";

export interface Ga4DailySummary {
  date: string;
  sessions: number;
  totalUsers: number;
  screenPageViews: number;
  bounceRate: number;
  avgSessionDuration: number;
}

export interface Ga4TopPage {
  path: string;
  pageviews: number;
  users: number;
  avgEngagement: number;
}

export interface Ga4TrafficSource {
  channel: string;
  sessions: number;
  users: number;
}

export interface Ga4DeviceBreakdown {
  category: string;
  sessions: number;
  percentage: number;
}

export interface Ga4Kpis {
  totalSessions: number;
  totalUsers: number;
  totalPageviews: number;
  avgBounceRate: number;
  avgSessionDuration: number;
}

// ─── Helpers ────────────────────────────────────────────────────────────────

function daysFromRange(range: DateRange): number {
  return range === "7d" ? 7 : range === "30d" ? 30 : 90;
}

function dateNDaysAgo(n: number): string {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString().slice(0, 10);
}

// ─── Hooks ──────────────────────────────────────────────────────────────────

export function useGa4Kpis(dateRange: DateRange) {
  const days = daysFromRange(dateRange);
  const startDate = dateNDaysAgo(days);

  return useQuery({
    queryKey: ["ga4-kpis", dateRange],
    queryFn: async (): Promise<Ga4Kpis> => {
      const { data, error } = await supabase
        .from("ga4_analytics")
        .select("data")
        .eq("metric_type", "daily_summary")
        .gte("date", startDate)
        .order("date", { ascending: true });

      if (error) throw error;
      if (!data || data.length === 0) {
        return { totalSessions: 0, totalUsers: 0, totalPageviews: 0, avgBounceRate: 0, avgSessionDuration: 0 };
      }

      let totalSessions = 0, totalUsers = 0, totalPageviews = 0;
      let bounceSum = 0, durationSum = 0;

      for (const row of data) {
        const d = row.data as any;
        totalSessions += d.sessions ?? 0;
        totalUsers += d.totalUsers ?? 0;
        totalPageviews += d.screenPageViews ?? 0;
        bounceSum += d.bounceRate ?? 0;
        durationSum += d.avgSessionDuration ?? 0;
      }

      return {
        totalSessions,
        totalUsers,
        totalPageviews,
        avgBounceRate: data.length > 0 ? bounceSum / data.length : 0,
        avgSessionDuration: data.length > 0 ? durationSum / data.length : 0,
      };
    },
    staleTime: 5 * 60 * 1000,
  });
}

export function useGa4DailyTrend(dateRange: DateRange) {
  const days = daysFromRange(dateRange);
  const startDate = dateNDaysAgo(days);

  return useQuery({
    queryKey: ["ga4-daily-trend", dateRange],
    queryFn: async (): Promise<Ga4DailySummary[]> => {
      const { data, error } = await supabase
        .from("ga4_analytics")
        .select("date, data")
        .eq("metric_type", "daily_summary")
        .gte("date", startDate)
        .order("date", { ascending: true });

      if (error) throw error;
      return (data ?? []).map((row) => {
        const d = row.data as any;
        return {
          date: row.date,
          sessions: d.sessions ?? 0,
          totalUsers: d.totalUsers ?? 0,
          screenPageViews: d.screenPageViews ?? 0,
          bounceRate: d.bounceRate ?? 0,
          avgSessionDuration: d.avgSessionDuration ?? 0,
        };
      });
    },
    staleTime: 5 * 60 * 1000,
  });
}

export function useGa4TopPages(dateRange: DateRange) {
  return useQuery({
    queryKey: ["ga4-top-pages", dateRange],
    queryFn: async (): Promise<Ga4TopPage[]> => {
      const { data, error } = await supabase
        .from("ga4_analytics")
        .select("data")
        .eq("metric_type", "top_pages")
        .order("date", { ascending: false })
        .limit(1);

      if (error) throw error;
      if (!data || data.length === 0) return [];
      const d = data[0].data as any;
      return (d.pages ?? []).map((p: any) => ({
        path: p.path ?? p.pagePath ?? "",
        pageviews: p.pageviews ?? p.screenPageViews ?? 0,
        users: p.users ?? p.totalUsers ?? 0,
        avgEngagement: p.avgEngagement ?? p.averageSessionDuration ?? 0,
      }));
    },
    staleTime: 5 * 60 * 1000,
  });
}

export function useGa4TrafficSources(dateRange: DateRange) {
  return useQuery({
    queryKey: ["ga4-traffic-sources", dateRange],
    queryFn: async (): Promise<Ga4TrafficSource[]> => {
      const { data, error } = await supabase
        .from("ga4_analytics")
        .select("data")
        .eq("metric_type", "traffic_sources")
        .order("date", { ascending: false })
        .limit(1);

      if (error) throw error;
      if (!data || data.length === 0) return [];
      const d = data[0].data as any;
      return (d.sources ?? []).map((s: any) => ({
        channel: s.channel ?? s.sessionDefaultChannelGroup ?? "",
        sessions: s.sessions ?? 0,
        users: s.users ?? 0,
      }));
    },
    staleTime: 5 * 60 * 1000,
  });
}

export function useGa4Devices(dateRange: DateRange) {
  return useQuery({
    queryKey: ["ga4-devices", dateRange],
    queryFn: async (): Promise<Ga4DeviceBreakdown[]> => {
      const { data, error } = await supabase
        .from("ga4_analytics")
        .select("data")
        .eq("metric_type", "devices")
        .order("date", { ascending: false })
        .limit(1);

      if (error) throw error;
      if (!data || data.length === 0) return [];
      const d = data[0].data as any;
      const devices = d.devices ?? [];
      const totalSessions = devices.reduce((sum: number, dev: any) => sum + (dev.sessions ?? 0), 0);
      return devices.map((dev: any) => ({
        category: dev.category ?? dev.deviceCategory ?? "",
        sessions: dev.sessions ?? 0,
        percentage: totalSessions > 0 ? ((dev.sessions ?? 0) / totalSessions) * 100 : 0,
      }));
    },
    staleTime: 5 * 60 * 1000,
  });
}

export function useSyncGa4() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (dateRange: DateRange = "30d") => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("Not authenticated");

      const resp = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ga4-sync`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({ date_range: dateRange }),
        }
      );
      const json = await resp.json();
      if (!resp.ok) throw new Error(json.error ?? "GA4 sync failed");
      return json;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ga4"] });
    },
  });
}

export function useGa4HasData() {
  return useQuery({
    queryKey: ["ga4-has-data"],
    queryFn: async (): Promise<boolean> => {
      const { count, error } = await supabase
        .from("ga4_analytics")
        .select("id", { count: "exact", head: true });
      if (error) return false;
      return (count ?? 0) > 0;
    },
    staleTime: 60 * 1000,
  });
}
