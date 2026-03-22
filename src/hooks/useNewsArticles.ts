import { useQuery } from "@tanstack/react-query";
import { useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useRegion } from "@/contexts/RegionContext";
import type { NewsArticle, NewsCategory } from "@/types/news";

const STALE_TIME = 15 * 60 * 1000; // 15 minutes

export function useLatestNews(limit = 4) {
  return useQuery({
    queryKey: ["news", "latest", limit],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("news_articles")
        .select("*")
        .eq("is_visible", true)
        .order("published_date", { ascending: false })
        .limit(limit);

      if (error) throw error;
      return (data ?? []) as NewsArticle[];
    },
    staleTime: STALE_TIME,
  });
}

export function useNewsPaginated(
  page: number,
  pageSize = 12,
  tagFilter?: string
) {
  return useQuery({
    queryKey: ["news", "paginated", page, pageSize, tagFilter],
    queryFn: async () => {
      const from = (page - 1) * pageSize;
      const to = from + pageSize - 1;

      let query = supabase
        .from("news_articles")
        .select("*", { count: "exact" })
        .eq("is_visible", true)
        .order("published_date", { ascending: false })
        .range(from, to);

      if (tagFilter) {
        query = query.contains("tags", [tagFilter]);
      }

      const { data, error, count } = await query;

      if (error) throw error;
      return {
        articles: (data ?? []) as NewsArticle[],
        total: count ?? 0,
      };
    },
    staleTime: STALE_TIME,
  });
}

export function useNewsTags() {
  return useQuery({
    queryKey: ["news", "tags"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("news_articles")
        .select("tags")
        .eq("is_visible", true);

      if (error) throw error;

      const tagSet = new Set<string>();
      for (const row of data ?? []) {
        if (Array.isArray(row.tags)) {
          for (const tag of row.tags) {
            tagSet.add(tag);
          }
        }
      }
      return Array.from(tagSet).sort();
    },
    staleTime: STALE_TIME,
  });
}

// ── Personalized News Hook ──────────────────────────────────

interface UserNewsContext {
  region: string;
  printerBrand?: string;
  topMaterials: string[];
}

function computePersonalizedScore(article: NewsArticle, ctx: UserNewsContext): number {
  const recencyDays = (Date.now() - new Date(article.published_date).getTime()) / 86400000;
  const recencyDecay = Math.max(0, 1 - recencyDays / 14);

  const baseScore = (article.relevance_score || 50) / 100;

  // Region boost: +20% if article matches user's region
  const regionBoost = article.region_scores?.[ctx.region]
    ? (article.region_scores[ctx.region] / 100) * 0.2
    : 0;

  // Printer brand boost: +15% if article mentions user's printer brand
  const printerBrand = ctx.printerBrand?.toLowerCase();
  const brandBoost = printerBrand && article.brand_mentions?.some(
    b => b.toLowerCase().includes(printerBrand)
  ) ? 0.15 : 0;

  // Material interest boost: +10% if article tags match user's material interests
  const materialBoost = ctx.topMaterials?.some(
    m => article.tags?.some(t => t.toLowerCase().includes(m.toLowerCase()))
  ) ? 0.10 : 0;

  return (baseScore + regionBoost + brandBoost + materialBoost) * recencyDecay;
}

/**
 * Returns news articles ranked by personalized relevance score.
 * Uses user's region, selected printer brand, and material interests
 * to boost articles that are most relevant to them.
 */
export function usePersonalizedNews(limit = 12, categoryFilter?: NewsCategory) {
  const { region } = useRegion();

  // Fetch extra articles for ranking (2x limit) so we have room to re-sort
  const { data: articles, isLoading } = useQuery({
    queryKey: ["news", "personalized-source", limit * 2, categoryFilter],
    queryFn: async () => {
      let query = supabase
        .from("news_articles")
        .select("*")
        .eq("is_visible", true)
        .order("published_date", { ascending: false })
        .limit(limit * 2);

      if (categoryFilter) {
        query = query.eq("category", categoryFilter);
      }

      const { data, error } = await query;
      if (error) throw error;
      return (data ?? []) as NewsArticle[];
    },
    staleTime: STALE_TIME,
  });

  // Get printer brand from localStorage (avoid importing heavy hooks)
  const printerBrand = useMemo(() => {
    try {
      const brand = localStorage.getItem("selected_printer_brand");
      return brand || undefined;
    } catch { return undefined; }
  }, []);

  const ranked = useMemo(() => {
    if (!articles || articles.length === 0) return [];

    const ctx: UserNewsContext = {
      region: region || "US",
      printerBrand,
      topMaterials: [], // Could be enhanced with useUserPersonalization
    };

    return articles
      .map(a => ({ ...a, personalScore: computePersonalizedScore(a, ctx) }))
      .sort((a, b) => b.personalScore - a.personalScore)
      .slice(0, limit);
  }, [articles, region, printerBrand, limit]);

  return { articles: ranked, isLoading };
}
