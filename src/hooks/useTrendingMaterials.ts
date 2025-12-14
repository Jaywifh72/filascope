import { useQuery } from "@tanstack/react-query";
import { useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";

interface SparklineDataPoint {
  day: number;
  value: number;
}

export interface TrendingMaterial {
  id: string;
  title: string;
  description: string | null;
  material_filter: string | null;
  search_increase_percent: number | null;
  context: string | null;
  article_url: string | null;
  position: number;
  week_of: string | null;
  updated_at: string | null;
  // Enhanced fields
  why_now: string | null;
  extended_context: string | null;
  related_content_count: number | null;
  related_content_url: string | null;
  trend_velocity: string | null;
  sparkline_data: SparklineDataPoint[] | null;
  upvote_count: number | null;
  is_prediction: boolean | null;
  prediction_reason: string | null;
}

export function useTrendingMaterials() {
  const navigate = useNavigate();
  const previousDataRef = useRef<TrendingMaterial[]>([]);

  const query = useQuery({
    queryKey: ["trending-materials"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("trending_materials")
        .select("*")
        .eq("is_active", true)
        .order("is_prediction", { ascending: true })
        .order("position", { ascending: true })
        .limit(5);

      if (error) throw error;
      
      // Parse sparkline_data if it's a string
      return (data || []).map(item => ({
        ...item,
        sparkline_data: typeof item.sparkline_data === 'string' 
          ? JSON.parse(item.sparkline_data) 
          : item.sparkline_data
      })) as TrendingMaterial[];
    },
    staleTime: 1000 * 60 * 5, // 5 min stale
    refetchInterval: 1000 * 60 * 30, // Auto-refresh every 30 min
    refetchIntervalInBackground: false, // Only when tab active
  });

  // Detect new trends and show toast
  useEffect(() => {
    if (query.data && previousDataRef.current.length > 0) {
      const newTrends = query.data.filter(
        trend => !trend.is_prediction && !previousDataRef.current.find(p => p.id === trend.id)
      );
      if (newTrends.length > 0) {
        toast.info(`New trend: ${newTrends[0].title}`, {
          description: "Just started trending this week",
          action: {
            label: "View",
            onClick: () => {
              if (newTrends[0].material_filter) {
                navigate(`/?material=${encodeURIComponent(newTrends[0].material_filter)}`);
              }
            },
          },
        });
      }
    }
    previousDataRef.current = query.data || [];
  }, [query.data, navigate]);

  // Separate active trends and predictions
  const activeTrends = query.data?.filter(t => !t.is_prediction) || [];
  const predictions = query.data?.filter(t => t.is_prediction) || [];

  return {
    ...query,
    activeTrends,
    predictions,
  };
}
