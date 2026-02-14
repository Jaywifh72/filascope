import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { AffiliateClick } from "@/types/affiliate";

export interface ClickFilters {
  startDate: string; // ISO date string YYYY-MM-DD
  endDate: string;
  brandNames: string[] | null;
  regionCodes: string[] | null;
}

export interface ClickSummary {
  total_clicks: number;
  unique_sessions: number;
  top_brand: string | null;
  top_source_page: string | null;
}

export interface ClicksByDay {
  click_date: string;
  brand_name: string;
  click_count: number;
}

export function useClickSummary(filters: ClickFilters) {
  return useQuery({
    queryKey: ["affiliate-click-summary", filters],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("get_affiliate_clicks_summary", {
        p_start_date: filters.startDate,
        p_end_date: filters.endDate,
        p_brand_names: filters.brandNames,
        p_region_codes: filters.regionCodes,
      });
      if (error) throw error;
      const row = (data as any)?.[0] || { total_clicks: 0, unique_sessions: 0, top_brand: null, top_source_page: null };
      return row as ClickSummary;
    },
  });
}

export function useClicksByDay(filters: ClickFilters) {
  return useQuery({
    queryKey: ["affiliate-clicks-by-day", filters],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("get_affiliate_clicks_by_day", {
        p_start_date: filters.startDate,
        p_end_date: filters.endDate,
        p_brand_names: filters.brandNames,
        p_region_codes: filters.regionCodes,
      });
      if (error) throw error;
      return (data || []) as ClicksByDay[];
    },
  });
}

export function useClicksToday() {
  const today = new Date().toISOString().slice(0, 10);
  return useQuery({
    queryKey: ["affiliate-clicks-today"],
    queryFn: async () => {
      const { count, error } = await supabase
        .from("affiliate_clicks")
        .select("id", { count: "exact", head: true })
        .gte("clicked_at", today);
      if (error) throw error;
      return count || 0;
    },
    staleTime: 30_000,
  });
}

export function useRecentClicks(filters: ClickFilters, page: number = 0, pageSize: number = 100) {
  return useQuery({
    queryKey: ["affiliate-recent-clicks", filters, page],
    queryFn: async () => {
      let q = supabase
        .from("affiliate_clicks")
        .select("*", { count: "exact" })
        .gte("clicked_at", filters.startDate)
        .lte("clicked_at", filters.endDate + "T23:59:59.999Z")
        .order("clicked_at", { ascending: false })
        .range(page * pageSize, (page + 1) * pageSize - 1);

      if (filters.brandNames?.length) {
        q = q.in("brand_name", filters.brandNames);
      }
      if (filters.regionCodes?.length) {
        q = q.in("region_code", filters.regionCodes);
      }

      const { data, error, count } = await q;
      if (error) throw error;
      return { clicks: (data || []) as AffiliateClick[], totalCount: count || 0 };
    },
  });
}

export function useDistinctBrandNames() {
  return useQuery({
    queryKey: ["affiliate-click-brands"],
    staleTime: 60_000,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("affiliate_clicks")
        .select("brand_name")
        .limit(500);
      if (error) throw error;
      const unique = [...new Set((data || []).map((d) => d.brand_name))].sort();
      return unique;
    },
  });
}
