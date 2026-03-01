import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface TdCommunityStatsRow {
  filament_id: string;
  official_td: number | null;
  submission_count: number;
  community_avg_td: number | null;
  community_td_stddev: number | null;
  verification_count: number;
  accurate_votes: number;
  too_high_votes: number;
  too_low_votes: number;
}

export function useTdCommunityStats(filamentId: string | undefined) {
  return useQuery({
    queryKey: ['td-community-stats', filamentId],
    queryFn: async () => {
      if (!filamentId) return null;
      const { data, error } = await supabase
        .from('td_community_stats')
        .select('*')
        .eq('filament_id', filamentId)
        .maybeSingle();
      if (error) throw error;
      return data as TdCommunityStatsRow | null;
    },
    enabled: !!filamentId,
  });
}
