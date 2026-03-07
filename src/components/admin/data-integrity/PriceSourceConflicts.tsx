import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { AlertTriangle, CheckCircle, ChevronDown, ChevronRight } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';

interface Conflict {
  filament_id: string;
  product_title: string;
  vendor: string;
  region_code: string;
  flat_price: number | null;
  listing_price: number | null;
  prp_price: number | null;
  flat_vs_listing_pct: number | null;
  flat_vs_prp_pct: number | null;
  listing_vs_prp_pct: number | null;
  max_diff_pct: number;
}

type ThresholdFilter = 5 | 10 | 20;

export function PriceSourceConflicts() {
  const [threshold, setThreshold] = useState<ThresholdFilter>(5);
  const [expanded, setExpanded] = useState(false);

  const { data: conflicts, isLoading } = useQuery({
    queryKey: ['data-integrity', 'three-way-price-conflicts', threshold],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_three_way_price_conflicts', {
        p_threshold_pct: threshold,
        p_limit: 100,
      });
      if (error) throw error;
      return (data ?? []) as Conflict[];
    },
    staleTime: 1000 * 60 * 5,
  });

  const count = conflicts?.length ?? 0;

  // Summary stats
  const byRegion = new Map<string, number>();
  const severeCount = conflicts?.filter(c => c.max_diff_pct >= 20).length ?? 0;
  conflicts?.forEach(c => {
    byRegion.set(c.region_code, (byRegion.get(c.region_code) || 0) + 1);
  });

  const fmtPrice = (v: number | null) => v != null ? v.toFixed(2) : '—';
  const fmtPct = (v: number | null) => v != null ? `${v}%` : '—';

  return (
    <div className="space-y-3">
      {/* Summary card */}
      <Card>
        <CardContent className="p-4 flex items-center gap-3">
          {count > 0 ? (
            <AlertTriangle className="w-5 h-5 text-yellow-500 shrink-0" />
          ) : (
            <CheckCircle className="w-5 h-5 text-green-500 shrink-0" />
          )}
          <div className="flex-1">
            <p className="text-sm font-medium text-foreground">
              {isLoading ? 'Checking…' : count === 0
                ? `No 3-way price conflicts detected (>${threshold}% threshold)`
                : `${count} filament×region pairs have >${threshold}% price divergence across sources`}
            </p>
            {count > 0 && (
              <p className="text-xs text-muted-foreground mt-0.5">
                {severeCount > 0 && <span className="text-destructive font-medium">{severeCount} severe (>20%) · </span>}
                Regions: {[...byRegion.entries()].map(([r, n]) => `${r}: ${n}`).join(', ')}
              </p>
            )}
            <p className="text-xs text-muted-foreground mt-1">
              Compares: <strong>filaments flat columns</strong> vs <strong>filament_listings</strong> vs <strong>product_regional_prices</strong> (canonical)
            </p>
          </div>
          <div className="flex gap-1">
            {([5, 10, 20] as ThresholdFilter[]).map(t => (
              <Button
                key={t}
                size="sm"
                variant={threshold === t ? 'default' : 'outline'}
                onClick={() => setThreshold(t)}
                className="text-xs h-7 px-2"
              >
                {'>'}{t}%
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Conflict table */}
      {!isLoading && count > 0 && (
        <Card>
          <button
            className="w-full flex items-center gap-2 px-4 py-3 text-sm font-medium text-foreground hover:bg-accent transition-colors text-left"
            onClick={() => setExpanded(!expanded)}
          >
            {expanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
            {count} conflicts — view details
          </button>
          {expanded && (
            <div className="overflow-auto max-h-[500px]">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Filament</TableHead>
                    <TableHead>Region</TableHead>
                    <TableHead className="text-right">Flat</TableHead>
                    <TableHead className="text-right">Listings</TableHead>
                    <TableHead className="text-right">PRP (canonical)</TableHead>
                    <TableHead className="text-right">Flat↔List</TableHead>
                    <TableHead className="text-right">Flat↔PRP</TableHead>
                    <TableHead className="text-right">List↔PRP</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {conflicts!.map((c, i) => {
                    const severe = c.max_diff_pct >= 20;
                    return (
                      <TableRow key={`${c.filament_id}-${c.region_code}-${i}`} className={severe ? 'bg-destructive/5' : ''}>
                        <TableCell className="max-w-[180px] truncate text-xs">
                          <span className="font-medium">{c.product_title}</span>
                          <br />
                          <span className="text-muted-foreground">{c.vendor}</span>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="text-xs">{c.region_code}</Badge>
                        </TableCell>
                        <TableCell className="font-mono text-xs text-right">{fmtPrice(c.flat_price)}</TableCell>
                        <TableCell className="font-mono text-xs text-right">{fmtPrice(c.listing_price)}</TableCell>
                        <TableCell className="font-mono text-xs text-right font-semibold">{fmtPrice(c.prp_price)}</TableCell>
                        <TableCell className="text-right">
                          <DiffBadge pct={c.flat_vs_listing_pct} />
                        </TableCell>
                        <TableCell className="text-right">
                          <DiffBadge pct={c.flat_vs_prp_pct} />
                        </TableCell>
                        <TableCell className="text-right">
                          <DiffBadge pct={c.listing_vs_prp_pct} />
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </Card>
      )}
    </div>
  );
}

function DiffBadge({ pct }: { pct: number | null }) {
  if (pct == null) return <span className="text-xs text-muted-foreground">—</span>;
  return (
    <span className={`text-xs font-mono ${pct >= 20 ? 'text-destructive font-semibold' : pct >= 10 ? 'text-yellow-500 font-medium' : 'text-muted-foreground'}`}>
      {pct}%
    </span>
  );
}
