import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface AISummary {
  generatedAt: string;
  model: string;
  summary: {
    headline: string;
    whatWentRight: string[];
    whatWentWrong: string[];
    userImpact: string;
    actionsNeeded: string[];
    healthScore: number;
    lovablePrompt: string | null;
  };
}

export interface ScrapeJobWithAI {
  id: string;
  job_type: string;
  status: string;
  materials: string[];
  dry_run: boolean;
  started_at: string;
  completed_at: string | null;
  error: string | null;
  results: {
    productsScraped?: number;
    colorsDiscovered?: number;
    filamentsCreated?: number;
    filamentsUpdated?: number;
    errors?: string[];
    timing?: {
      totalMs?: number;
    };
    validation?: {
      overallCoveragePercent?: number;
    };
  } | null;
  ai_summary: AISummary | null;
}

export function useAIScrapeLogs(limit: number = 10) {
  return useQuery({
    queryKey: ['ai-scrape-logs', limit],
    queryFn: async (): Promise<ScrapeJobWithAI[]> => {
      const { data, error } = await supabase
        .from('scrape_jobs')
        .select('id, job_type, status, materials, dry_run, started_at, completed_at, error, results, ai_summary')
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) throw error;
      
      // Type assertion for the response
      return (data || []) as unknown as ScrapeJobWithAI[];
    },
    refetchInterval: 30000, // Refresh every 30 seconds
  });
}
