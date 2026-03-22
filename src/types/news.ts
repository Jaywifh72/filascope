export interface NewsArticle {
  id: string;
  title: string;
  source_name: string;
  source_url: string;
  summary: string;
  image_url: string | null;
  published_date: string;
  tags: string[];
  curated_at: string;
  relevance_score: number;
  // New fields for RSS aggregation + personalization
  category: "filament" | "printer" | "software" | "industry" | "community" | null;
  brand_mentions: string[];
  region_scores: Record<string, number> | null; // { US: 80, EU: 40, ... }
  source_logo_url: string | null;
  read_time_min: number | null;
}

export type NewsCategory = "filament" | "printer" | "software" | "industry" | "community";

export const NEWS_CATEGORY_COLORS: Record<NewsCategory, string> = {
  filament: "text-cyan-400 bg-cyan-500/10 border-cyan-500/30",
  printer: "text-green-400 bg-green-500/10 border-green-500/30",
  software: "text-purple-400 bg-purple-500/10 border-purple-500/30",
  industry: "text-amber-400 bg-amber-500/10 border-amber-500/30",
  community: "text-pink-400 bg-pink-500/10 border-pink-500/30",
};
