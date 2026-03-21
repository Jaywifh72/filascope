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
}
