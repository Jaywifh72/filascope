import { useEffect, useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useTdStats, type TdCoverageStats } from '@/hooks/useTdManagement';
import { Skeleton } from '@/components/ui/skeleton';
import { TrendSparkline } from '@/components/sidebar/TrendSparkline';
import { ArrowUp, Database, Target, AlertTriangle, Activity } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

// ── Circular Progress Ring ──
function CoverageRing({ pct }: { pct: number }) {
  const r = 28;
  const circ = 2 * Math.PI * r;
  const offset = circ - (pct / 100) * circ;
  const color =
    pct < 5 ? 'hsl(0 84% 60%)' :
    pct < 20 ? 'hsl(38 92% 50%)' :
    pct < 50 ? 'hsl(186 95% 42%)' :
    'hsl(142 76% 36%)';

  return (
    <svg width="64" height="64" viewBox="0 0 64 64" className="shrink-0">
      <circle cx="32" cy="32" r={r} fill="none" stroke="hsl(var(--muted))" strokeWidth="5" />
      <circle
        cx="32" cy="32" r={r}
        fill="none" stroke={color} strokeWidth="5"
        strokeLinecap="round"
        strokeDasharray={circ}
        strokeDashoffset={offset}
        transform="rotate(-90 32 32)"
        className="transition-all duration-700"
      />
      <text x="32" y="36" textAnchor="middle" fontSize="13" fontWeight="700" fill="currentColor">
        {pct}%
      </text>
    </svg>
  );
}

// ── Color for coverage bar ──
function barColor(pct: number) {
  if (pct < 5) return 'bg-destructive';
  if (pct < 20) return 'bg-amber-500';
  return 'bg-emerald-500';
}

export function TdStatsHeader() {
  const { data: stats, isLoading, dataUpdatedAt } = useTdStats();
  const [prevWithTd, setPrevWithTd] = useState<number | null>(null);

  // Delta tracking via localStorage
  useEffect(() => {
    if (!stats) return;
    const stored = localStorage.getItem('td_prev_with_td');
    if (stored) setPrevWithTd(parseInt(stored, 10));
    localStorage.setItem('td_prev_with_td', String(stats.with_td));
  }, [stats]);

  const delta = stats && prevWithTd !== null && prevWithTd !== stats.with_td
    ? stats.with_td - prevWithTd
    : null;

  // Group recent logs into batches (within 2 second windows)
  const recentBatches = useMemo(() => {
    if (!stats?.recent_logs?.length) return [];
    const logs = stats.recent_logs;
    const batches: { ts: string; source: string; entries: typeof logs; count: number }[] = [];
    let currentBatch: typeof logs = [];
    let batchTs = '';

    for (const log of logs) {
      const ts = new Date(log.created_at).getTime();
      const batchStart = batchTs ? new Date(batchTs).getTime() : 0;

      if (!batchTs || Math.abs(ts - batchStart) < 2000) {
        currentBatch.push(log);
        if (!batchTs) batchTs = log.created_at;
      } else {
        batches.push({ ts: batchTs, source: currentBatch[0]?.source ?? '', entries: currentBatch, count: currentBatch.length });
        currentBatch = [log];
        batchTs = log.created_at;
      }
    }
    if (currentBatch.length) {
      batches.push({ ts: batchTs, source: currentBatch[0]?.source ?? '', entries: currentBatch, count: currentBatch.length });
    }
    return batches.slice(0, 5);
  }, [stats]);

  // Sparkline data from recent logs (daily counts over past 30 days)
  const sparklineData = useMemo(() => {
    if (!stats?.recent_logs?.length) return [];
    const dayMap = new Map<number, number>();
    const now = Date.now();
    for (const log of stats.recent_logs) {
      if (log.status !== 'applied') continue;
      const dayAgo = Math.floor((now - new Date(log.created_at).getTime()) / 86400000);
      if (dayAgo <= 30) {
        dayMap.set(dayAgo, (dayMap.get(dayAgo) ?? 0) + 1);
      }
    }
    return Array.from({ length: 7 }, (_, i) => ({ day: i + 1, value: dayMap.get(i) ?? 0 }));
  }, [stats]);

  if (isLoading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <Card key={i}><CardContent className="pt-6"><Skeleton className="h-8 w-24" /></CardContent></Card>
        ))}
      </div>
    );
  }

  if (!stats) return null;

  const matchRate = stats.reference_count > 0
    ? Math.round((stats.with_td / stats.reference_count) * 100)
    : 0;

  return (
    <div className="space-y-6">
      {/* Section B — Stat Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground flex items-center gap-1">
              <Database className="w-3 h-3" /> Total Filaments
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total_filaments.toLocaleString()}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground">With TD</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-500">{stats.with_td.toLocaleString()}</div>
            {delta !== null && delta > 0 && (
              <span className="text-xs text-emerald-500 flex items-center gap-0.5 mt-0.5">
                <ArrowUp className="w-3 h-3" /> +{delta} since last view
              </span>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground">Missing TD</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">{stats.missing_td.toLocaleString()}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground">Coverage</CardTitle>
          </CardHeader>
          <CardContent className="flex items-center gap-2">
            <CoverageRing pct={stats.coverage_pct} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground flex items-center gap-1">
              <Target className="w-3 h-3" /> Reference Values
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.reference_count.toLocaleString()}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground">Match Rate</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{matchRate}%</div>
            <span className="text-xs text-muted-foreground">{stats.with_td}/{stats.reference_count}</span>
          </CardContent>
        </Card>
      </div>

      {/* Section C — Coverage Charts */}
      <div className="grid md:grid-cols-2 gap-6">
        <Card>
          <CardHeader><CardTitle className="text-sm">Coverage by Material</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            {stats.by_material.map((m) => (
              <div key={m.material} className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground w-20 truncate" title={m.material}>{m.material}</span>
                <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                  <div className={`h-full rounded-full ${barColor(m.pct)}`} style={{ width: `${Math.max(m.pct, 1)}%` }} />
                </div>
                <span className="text-xs font-medium w-28 text-right whitespace-nowrap">
                  {m.pct}% ({m.with_td.toLocaleString()}/{m.total.toLocaleString()})
                </span>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-sm">Coverage by Brand (Top 10)</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            {stats.by_brand.map((b) => (
              <div key={b.brand} className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground w-24 truncate" title={b.brand}>{b.brand}</span>
                <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                  <div className={`h-full rounded-full ${barColor(b.pct)}`} style={{ width: `${Math.max(b.pct, 1)}%` }} />
                </div>
                <span className="text-xs font-medium w-28 text-right whitespace-nowrap">
                  {b.pct}% ({b.with_td.toLocaleString()}/{b.total.toLocaleString()})
                </span>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* Section D — Recent Activity + Section E — Priority Gaps */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm flex items-center gap-1">
              <Activity className="w-4 h-4" /> Recent Activity
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {recentBatches.length === 0 && (
              <p className="text-xs text-muted-foreground">No recent activity</p>
            )}
            {recentBatches.map((batch, i) => {
              const high = batch.entries.filter(e => e.confidence === 'high').length;
              const med = batch.entries.filter(e => e.confidence === 'medium').length;
              const low = batch.entries.filter(e => e.confidence === 'low').length;
              return (
                <div key={i} className="rounded-md border bg-muted/30 px-3 py-2 text-xs space-y-0.5">
                  <div className="flex items-center justify-between">
                    <span className="font-medium capitalize">{batch.source.replace(/_/g, ' ')}</span>
                    <span className="text-muted-foreground">
                      {formatDistanceToNow(new Date(batch.ts), { addSuffix: true })}
                    </span>
                  </div>
                  <div className="text-muted-foreground">
                    Applied {batch.count} TD value{batch.count !== 1 ? 's' : ''}
                    {(high > 0 || med > 0 || low > 0) && (
                      <span> ({high > 0 && `${high} high`}{med > 0 && `${high > 0 ? ', ' : ''}${med} med`}{low > 0 && `${(high > 0 || med > 0) ? ', ' : ''}${low} low`})</span>
                    )}
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>

        {/* Priority Gaps */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm flex items-center gap-1">
              <AlertTriangle className="w-4 h-4" /> Priority Gaps
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h4 className="text-xs font-medium text-muted-foreground mb-2">Top Brands Missing TD</h4>
              <div className="space-y-1">
                {stats.top_gaps_brand.map((b) => (
                  <div key={b.brand} className="flex justify-between text-xs">
                    <span className="truncate">{b.brand}</span>
                    <span className="text-destructive font-medium shrink-0 ml-2">{b.missing.toLocaleString()} missing</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="border-t pt-3">
              <h4 className="text-xs font-medium text-muted-foreground mb-2">Lowest Material Coverage</h4>
              <div className="space-y-1">
                {stats.top_gaps_material.map((m) => (
                  <div key={m.material} className="flex justify-between text-xs">
                    <span className="truncate">{m.material}</span>
                    <span className="text-muted-foreground shrink-0 ml-2">{m.pct}% ({m.missing.toLocaleString()} missing)</span>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Section F — Coverage Trend Sparkline */}
      {sparklineData.some(d => d.value > 0) && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm flex items-center gap-2">
              TD Population Trend (7 days)
              <TrendSparkline
                data={sparklineData}
                velocity={sparklineData[sparklineData.length - 1]?.value > sparklineData[0]?.value ? 'rising' : 'steady'}
                className="w-24 h-6"
              />
            </CardTitle>
          </CardHeader>
        </Card>
      )}
    </div>
  );
}
