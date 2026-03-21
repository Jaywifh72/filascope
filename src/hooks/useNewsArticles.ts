import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { NewsArticle } from "@/types/news";

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
