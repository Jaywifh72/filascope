import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

// ─── Types ──────────────────────────────────────────────────────────────────

export interface GscKpis {
  totalClicks: number;
  totalImpressions: number;
  avgPosition: number;
  indexedPages: number;
  clicksChange: number;
  impressionsChange: number;
  positionChange: number;
}

export interface GscQueryRow {
  query: string;
  clicks: number;
  impressions: number;
  ctr: number;
  position: number;
  quickWin: boolean;
}

export interface TargetKeyword {
  keyword: string;
  targetPage: string;
  currentPosition: number | null;
  impressions: number;
  status: "ranking" | "not-found" | "needs-work";
}

export interface PositionBucket {
  label: string;
  count: number;
  color: string;
}

export interface CitationEntry {
  id: string;
  engine: string;       // mapped from ai_engine column
  query: string;
  cited: boolean;
  notes: string | null;
  checked_at: string;
}

export interface AdvisorAction {
  id: string;
  title: string;
  description: string;
  priority: "P0" | "P1" | "P2";
  effort: string;
  impact: string;
  completed: boolean;
  created_at: string;
}

// ─── Constants ──────────────────────────────────────────────────────────────

const STALE_TIME = 1000 * 60 * 5;

const TARGET_KEYWORDS: { keyword: string; targetPage: string }[] = [
  { keyword: "best PLA filament 2026", targetPage: "/guides/best-pla-filaments" },
  { keyword: "filament comparison", targetPage: "/filaments" },
  { keyword: "HueForge TD values", targetPage: "/hueforge-td-database" },
  { keyword: "best filament for Bambu Lab", targetPage: "/guides/best-filament-for-bambu-lab-p1s" },
  { keyword: "PLA vs PETG", targetPage: "/guides/pla-vs-petg" },
  { keyword: "cheapest 3D printer filament", targetPage: "/guides/cheapest-pla-filament" },
  { keyword: "filament price comparison", targetPage: "/deals" },
  { keyword: "best 3D printer 2026", targetPage: "/printers" },
  { keyword: "best filament for beginners", targetPage: "/guides/best-filaments-for-beginners" },
  { keyword: "HueForge filament database", targetPage: "/hueforge-td-database" },
];

// ─── Helpers ────────────────────────────────────────────────────────────────

function dateNDaysAgo(n: number): string {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString().slice(0, 10);
}

function aggregateByQuery(
  rows: { query: string | null; clicks: number; impressions: number; ctr: number | null; position: number | null }[]
): Map<string, { clicks: number; impressions: number; ctrSum: number; posSum: number; count: number }> {
  const map = new Map<string, { clicks: number; impressions: number; ctrSum: number; posSum: number; count: number }>();
  for (const r of rows) {
    if (!r.query) continue;
    const existing = map.get(r.query);
    if (existing) {
      existing.clicks += r.clicks ?? 0;
      existing.impressions += r.impressions ?? 0;
      existing.ctrSum += r.ctr ?? 0;
      existing.posSum += r.position ?? 0;
      existing.count++;
    } else {
      map.set(r.query, {
        clicks: r.clicks ?? 0,
        impressions: r.impressions ?? 0,
        ctrSum: r.ctr ?? 0,
        posSum: r.position ?? 0,
        count: 1,
      });
    }
  }
  return map;
}

// ─── Hooks ──────────────────────────────────────────────────────────────────

export function useGscKpis() {
  const since28 = dateNDaysAgo(28);
  const since56 = dateNDaysAgo(56);

  return useQuery<GscKpis>({
    queryKey: ["seo-cmd-kpis", since28],
    staleTime: STALE_TIME,
    queryFn: async () => {
      // Current 28 days
      const { data: current, error: e1 } = await supabase
        .from("search_console_data")
        .select("clicks, impressions, position, page")
        .gte("date", since28);
      if (e1) throw e1;

      // Previous 28 days
      const { data: previous, error: e2 } = await supabase
        .from("search_console_data")
        .select("clicks, impressions, position")
        .gte("date", since56)
        .lt("date", since28);
      if (e2) throw e2;

      const curRows = current ?? [];
      const prevRows = previous ?? [];

      const totalClicks = curRows.reduce((s, r) => s + (r.clicks ?? 0), 0);
      const totalImpressions = curRows.reduce((s, r) => s + (r.impressions ?? 0), 0);
      const avgPosition = curRows.length
        ? curRows.reduce((s, r) => s + (r.position ?? 0), 0) / curRows.length
        : 0;

      // Distinct indexed pages
      const pages = new Set(curRows.map((r) => r.page).filter(Boolean));
      const indexedPages = pages.size;

      // Previous period totals
      const prevClicks = prevRows.reduce((s, r) => s + (r.clicks ?? 0), 0);
      const prevImpressions = prevRows.reduce((s, r) => s + (r.impressions ?? 0), 0);
      const prevPosition = prevRows.length
        ? prevRows.reduce((s, r) => s + (r.position ?? 0), 0) / prevRows.length
        : 0;

      const pctChange = (cur: number, prev: number) =>
        prev === 0 ? (cur > 0 ? 100 : 0) : Math.round(((cur - prev) / prev) * 100);

      return {
        totalClicks,
        totalImpressions,
        avgPosition,
        indexedPages,
        clicksChange: pctChange(totalClicks, prevClicks),
        impressionsChange: pctChange(totalImpressions, prevImpressions),
        positionChange: prevPosition === 0 ? 0 : parseFloat((prevPosition - avgPosition).toFixed(1)),
      };
    },
  });
}

export function useGscTopQueries(sortBy: "clicks" | "impressions" | "ctr" | "position" = "impressions", limit = 25) {
  const since = dateNDaysAgo(28);

  return useQuery<GscQueryRow[]>({
    queryKey: ["seo-cmd-top-queries", since, sortBy, limit],
    staleTime: STALE_TIME,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("search_console_data")
        .select("query, clicks, impressions, ctr, position")
        .gte("date", since)
        .not("query", "is", null);
      if (error) throw error;

      const map = aggregateByQuery(data ?? []);

      const rows: GscQueryRow[] = [];
      for (const [query, d] of map) {
        const avgPos = d.count ? d.posSum / d.count : 0;
        const avgCtr = d.count ? d.ctrSum / d.count : 0;
        rows.push({
          query,
          clicks: d.clicks,
          impressions: d.impressions,
          ctr: avgCtr,
          position: avgPos,
          quickWin: avgPos >= 4 && avgPos <= 20 && d.impressions > 50,
        });
      }

      rows.sort((a, b) => {
        if (sortBy === "position") return a.position - b.position;
        return b[sortBy] - a[sortBy];
      });

      return rows.slice(0, limit);
    },
  });
}

export function useTargetKeywords() {
  const since = dateNDaysAgo(28);

  return useQuery<TargetKeyword[]>({
    queryKey: ["seo-cmd-target-keywords", since],
    staleTime: STALE_TIME,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("search_console_data")
        .select("query, impressions, position")
        .gte("date", since)
        .not("query", "is", null);
      if (error) throw error;

      const map = aggregateByQuery(
        (data ?? []).map((r) => ({ ...r, clicks: 0, ctr: null }))
      );

      return TARGET_KEYWORDS.map(({ keyword, targetPage }) => {
        // Try exact match first, then partial match
        let match = map.get(keyword);
        if (!match) {
          for (const [q, d] of map) {
            if (q.toLowerCase().includes(keyword.toLowerCase())) {
              match = d;
              break;
            }
          }
        }

        const currentPosition = match ? match.posSum / match.count : null;
        const impressions = match?.impressions ?? 0;
        let status: TargetKeyword["status"] = "not-found";
        if (currentPosition !== null) {
          status = currentPosition <= 10 ? "ranking" : "needs-work";
        }

        return { keyword, targetPage, currentPosition, impressions, status };
      });
    },
  });
}

export function usePositionDistribution() {
  const since = dateNDaysAgo(28);

  return useQuery<PositionBucket[]>({
    queryKey: ["seo-cmd-pos-dist", since],
    staleTime: STALE_TIME,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("search_console_data")
        .select("query, position")
        .gte("date", since)
        .not("position", "is", null)
        .not("query", "is", null);
      if (error) throw error;

      const queryPos: Record<string, { sum: number; count: number }> = {};
      for (const r of data ?? []) {
        const q = r.query!;
        if (!queryPos[q]) queryPos[q] = { sum: 0, count: 0 };
        queryPos[q].sum += r.position ?? 0;
        queryPos[q].count++;
      }

      let top3 = 0,
        top10 = 0,
        top20 = 0,
        beyond = 0;
      for (const v of Object.values(queryPos)) {
        const avg = v.sum / v.count;
        if (avg <= 3) top3++;
        else if (avg <= 10) top10++;
        else if (avg <= 20) top20++;
        else beyond++;
      }

      return [
        { label: "Top 3", count: top3, color: "#22c55e" },
        { label: "4-10", count: top10, color: "#eab308" },
        { label: "11-20", count: top20, color: "#f97316" },
        { label: "20+", count: beyond, color: "#ef4444" },
      ];
    },
  });
}

export function useCitationLog() {
  return useQuery<CitationEntry[]>({
    queryKey: ["seo-cmd-citations"],
    staleTime: STALE_TIME,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("seo_citation_log")
        .select("id, ai_engine, query, cited, notes, checked_at")
        .order("checked_at", { ascending: false })
        .limit(50);
      if (error) throw error;
      // Map ai_engine column to engine for UI compatibility
      return (data ?? []).map((r: any) => ({
        id: r.id,
        engine: r.ai_engine,
        query: r.query,
        cited: r.cited,
        notes: r.notes,
        checked_at: r.checked_at,
      })) as CitationEntry[];
    },
  });
}

export function useAdvisorActions() {
  return useQuery<AdvisorAction[]>({
    queryKey: ["seo-cmd-actions"],
    staleTime: STALE_TIME,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("seo_advisor_actions")
        .select("*")
        .order("priority", { ascending: true })
        .order("completed", { ascending: true });
      if (error) throw error;
      return (data ?? []) as AdvisorAction[];
    },
  });
}

// ─── Mutations ──────────────────────────────────────────────────────────────

export function useAddCitation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (entry: { engine: string; query: string; cited: boolean; notes?: string }) => {
      const { error } = await supabase.from("seo_citation_log").insert({
        ai_engine: entry.engine,
        query: entry.query,
        cited: entry.cited,
        notes: entry.notes ?? null,
        checked_at: new Date().toISOString(),
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["seo-cmd-citations"] });
    },
  });
}

export function useToggleAction() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, completed }: { id: string; completed: boolean }) => {
      const { error } = await supabase
        .from("seo_advisor_actions")
        .update({ completed })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["seo-cmd-actions"] });
    },
  });
}

export function useGenerateReport() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session) throw new Error("Not authenticated");

      const resp = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/seo-advisor`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({ action: "generate_report" }),
        }
      );
      const json = await resp.json();
      if (!resp.ok) throw new Error(json.error ?? "Report generation failed");
      return json;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["seo-cmd-actions"] });
    },
  });
}

export function useSyncGsc() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session) throw new Error("Not authenticated");

      const resp = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/search-console-sync`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({ site_url: "https://filascope.com" }),
        }
      );
      const json = await resp.json();
      if (!resp.ok) throw new Error(json.error ?? "Sync failed");
      return json;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["seo-cmd"] });
    },
  });
}
