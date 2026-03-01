import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useTdStats } from '@/hooks/useTdManagement';
import { Skeleton } from '@/components/ui/skeleton';

export function TdStatsHeader() {
  const { data: stats, isLoading } = useTdStats();

  if (isLoading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i}><CardContent className="pt-6"><Skeleton className="h-8 w-24" /></CardContent></Card>
        ))}
      </div>
    );
  }

  if (!stats) return null;

  const cards = [
    { label: 'Total Filaments', value: stats.total.toLocaleString() },
    { label: 'With TD', value: stats.withTd.toLocaleString() },
    { label: 'Missing TD', value: stats.withoutTd.toLocaleString() },
    { label: 'Coverage', value: `${stats.coverage}%` },
  ];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {cards.map((c) => (
          <Card key={c.label}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">{c.label}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{c.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* By Material */}
        <Card>
          <CardHeader><CardTitle className="text-sm">Coverage by Material</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            {stats.byMaterial.map((m) => (
              <div key={m.material} className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground w-20 truncate">{m.material}</span>
                <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                  <div className="h-full bg-primary rounded-full" style={{ width: `${m.pct}%` }} />
                </div>
                <span className="text-xs font-medium w-10 text-right">{m.pct}%</span>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* By Brand */}
        <Card>
          <CardHeader><CardTitle className="text-sm">Coverage by Brand (Top 10)</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            {stats.byBrand.map((b) => (
              <div key={b.brand} className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground w-24 truncate">{b.brand}</span>
                <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                  <div className="h-full bg-primary rounded-full" style={{ width: `${b.pct}%` }} />
                </div>
                <span className="text-xs font-medium w-10 text-right">{b.pct}%</span>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
