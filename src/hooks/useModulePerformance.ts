import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface ModuleMetrics {
  module_name: string;
  total_views: number;
  total_clicks: number;
  cta_clicks: number;
  conversions: number;
  conversion_value: number;
  avg_time_spent_ms: number;
  scroll_past_count: number;
  unique_users: number;
  click_through_rate: number;
  engagement_score: number;
}

interface DailyMetrics {
  date: string;
  module_name: string;
  total_views: number;
  total_clicks: number;
  conversions: number;
}

interface TopContent {
  entity_id: string;
  entity_type: string;
  module_name: string;
  clicks: number;
  conversions: number;
}

export function useModulePerformance(dateRange: 'today' | '7days' | '30days' | 'custom' = '7days', customStart?: string, customEnd?: string) {
  const getDateFilter = () => {
    const now = new Date();
    switch (dateRange) {
      case 'today':
        return new Date(now.setHours(0, 0, 0, 0)).toISOString();
      case '7days':
        return new Date(now.setDate(now.getDate() - 7)).toISOString();
      case '30days':
        return new Date(now.setDate(now.getDate() - 30)).toISOString();
      case 'custom':
        return customStart || new Date(now.setDate(now.getDate() - 7)).toISOString();
      default:
        return new Date(now.setDate(now.getDate() - 7)).toISOString();
    }
  };
  
  // Aggregated metrics per module
  const { data: moduleMetrics, isLoading: metricsLoading } = useQuery({
    queryKey: ['module-performance', dateRange, customStart, customEnd],
    queryFn: async () => {
      const startDate = getDateFilter();
      
      // Get from daily aggregated table
      const { data } = await supabase
        .from('module_performance_daily')
        .select('*')
        .gte('date', startDate.split('T')[0]);
      
      if (!data || data.length === 0) return [];
      
      // Aggregate across days
      const aggregated = new Map<string, ModuleMetrics>();
      
      data.forEach(row => {
        const existing = aggregated.get(row.module_name) || {
          module_name: row.module_name,
          total_views: 0,
          total_clicks: 0,
          cta_clicks: 0,
          conversions: 0,
          conversion_value: 0,
          avg_time_spent_ms: 0,
          scroll_past_count: 0,
          unique_users: 0,
          click_through_rate: 0,
          engagement_score: 0,
        };
        
        existing.total_views += row.total_views || 0;
        existing.total_clicks += row.total_clicks || 0;
        existing.cta_clicks += row.cta_clicks || 0;
        existing.conversions += row.conversions || 0;
        existing.conversion_value += row.conversion_value || 0;
        existing.scroll_past_count += row.scroll_past_count || 0;
        existing.unique_users += row.unique_users || 0;
        
        aggregated.set(row.module_name, existing);
      });
      
      // Calculate derived metrics
      return Array.from(aggregated.values()).map(m => ({
        ...m,
        click_through_rate: m.total_views > 0 ? (m.total_clicks / m.total_views) * 100 : 0,
        engagement_score: calculateEngagementScore(m),
      })).sort((a, b) => b.engagement_score - a.engagement_score);
    },
    staleTime: 60 * 1000,
  });
  
  // Daily trend data for charts
  const { data: dailyTrends } = useQuery({
    queryKey: ['module-daily-trends', dateRange, customStart, customEnd],
    queryFn: async () => {
      const startDate = getDateFilter();
      
      const { data } = await supabase
        .from('module_performance_daily')
        .select('date, module_name, total_views, total_clicks, conversions')
        .gte('date', startDate.split('T')[0])
        .order('date', { ascending: true });
      
      return data as DailyMetrics[] | null;
    },
    staleTime: 60 * 1000,
  });
  
  // Top performing content
  const { data: topContent } = useQuery({
    queryKey: ['top-content', dateRange, customStart, customEnd],
    queryFn: async () => {
      const startDate = getDateFilter();
      
      const { data } = await supabase
        .from('module_engagement_metrics')
        .select('entity_id, entity_type, module_name')
        .gte('created_at', startDate)
        .eq('event_type', 'click')
        .not('entity_id', 'is', null);
      
      if (!data) return [];
      
      // Count by entity
      const counts = new Map<string, TopContent>();
      data.forEach(row => {
        const key = `${row.entity_id}-${row.module_name}`;
        const existing = counts.get(key) || {
          entity_id: row.entity_id!,
          entity_type: row.entity_type || 'unknown',
          module_name: row.module_name,
          clicks: 0,
          conversions: 0,
        };
        existing.clicks++;
        counts.set(key, existing);
      });
      
      return Array.from(counts.values())
        .sort((a, b) => b.clicks - a.clicks)
        .slice(0, 10);
    },
    staleTime: 60 * 1000,
  });
  
  // Summary totals
  const summary = moduleMetrics?.reduce(
    (acc, m) => ({
      totalViews: acc.totalViews + m.total_views,
      totalClicks: acc.totalClicks + m.total_clicks,
      totalConversions: acc.totalConversions + m.conversions,
      totalRevenue: acc.totalRevenue + m.conversion_value,
    }),
    { totalViews: 0, totalClicks: 0, totalConversions: 0, totalRevenue: 0 }
  ) || { totalViews: 0, totalClicks: 0, totalConversions: 0, totalRevenue: 0 };
  
  return {
    moduleMetrics: moduleMetrics || [],
    dailyTrends: dailyTrends || [],
    topContent: topContent || [],
    summary: {
      ...summary,
      avgCTR: summary.totalViews > 0 ? (summary.totalClicks / summary.totalViews) * 100 : 0,
    },
    isLoading: metricsLoading,
  };
}

function calculateEngagementScore(metrics: Omit<ModuleMetrics, 'click_through_rate' | 'engagement_score'>): number {
  // Weighted score based on different engagement types
  const ctrWeight = 3;
  const conversionWeight = 5;
  const timeWeight = 1;
  const scrollPastPenalty = -0.5;
  
  const ctr = metrics.total_views > 0 ? metrics.total_clicks / metrics.total_views : 0;
  const conversionRate = metrics.total_clicks > 0 ? metrics.conversions / metrics.total_clicks : 0;
  const avgTimeScore = Math.min(metrics.avg_time_spent_ms / 10000, 1); // Cap at 10s
  const scrollPastRate = metrics.total_views > 0 ? metrics.scroll_past_count / metrics.total_views : 0;
  
  return (
    ctr * ctrWeight * 100 +
    conversionRate * conversionWeight * 100 +
    avgTimeScore * timeWeight * 10 +
    scrollPastRate * scrollPastPenalty * 10
  );
}
