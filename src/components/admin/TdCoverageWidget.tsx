import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { Sun, TrendingUp } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export function TdCoverageWidget() {
  const { data: stats, isLoading } = useQuery({
    queryKey: ['td-coverage-stats'],
    queryFn: async () => {
      // Total filaments
      const { count: total } = await supabase
        .from('filaments')
        .select('*', { count: 'exact', head: true });

      // Filaments with TD value
      const { count: withTd } = await supabase
        .from('filaments')
        .select('*', { count: 'exact', head: true })
        .not('transmission_distance', 'is', null);

      // Filaments with TDS URL but no TD
      const { count: tdsNoTd } = await supabase
        .from('filaments')
        .select('*', { count: 'exact', head: true })
        .not('tds_url', 'is', null)
        .is('transmission_distance', null);

      // Pending in review queue
      const { count: inReview } = await supabase
        .from('tds_review_queue')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'pending')
        .eq('reason', 'td_missing');

      const totalCount = total || 0;
      const withTdCount = withTd || 0;
      const tdsNoTdCount = tdsNoTd || 0;
      const inReviewCount = inReview || 0;

      return {
        total: totalCount,
        withTd: withTdCount,
        tdsNoTd: tdsNoTdCount,
        inReview: inReviewCount,
        percentWithTd: totalCount > 0 ? Math.round((withTdCount / totalCount) * 100 * 10) / 10 : 0,
        percentPotential: totalCount > 0 ? Math.round(((withTdCount + tdsNoTdCount) / totalCount) * 100 * 10) / 10 : 0,
      };
    },
    staleTime: 60000,
  });

  if (isLoading) {
    return (
      <Card className="p-4">
        <div className="flex items-center gap-3">
          <Skeleton className="w-10 h-10 rounded" />
          <div className="space-y-1">
            <Skeleton className="h-5 w-16" />
            <Skeleton className="h-3 w-24" />
          </div>
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-4 border-primary/20 bg-gradient-to-br from-amber-50/50 to-orange-50/50 dark:from-amber-950/20 dark:to-orange-950/20">
      <div className="flex items-start gap-3">
        <div className="p-2 rounded-md bg-amber-100 dark:bg-amber-900/30">
          <Sun className="w-5 h-5 text-amber-600" />
        </div>
        <div className="flex-1">
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold text-amber-600">{stats?.withTd.toLocaleString()}</span>
            <span className="text-sm text-muted-foreground">/ {stats?.total.toLocaleString()}</span>
          </div>
          <p className="text-xs text-muted-foreground mb-2">
            Filaments with TD ({stats?.percentWithTd}%)
          </p>
          <Progress value={stats?.percentWithTd || 0} className="h-1.5 mb-2" />
          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <TrendingUp className="w-3 h-3 text-green-600" />
              {stats?.tdsNoTd} extractable from TDS
            </span>
            {stats?.inReview ? (
              <span>{stats.inReview} in review</span>
            ) : null}
          </div>
        </div>
      </div>
    </Card>
  );
}
