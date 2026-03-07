import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { RefreshCw, AlertTriangle, CheckCircle, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from '@/hooks/use-toast';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';

interface PriceConflict {
  filament_id: string;
  product_title: string;
  vendor: string;
  region_code: string;
  canonical_price: number;
  canonical_source: string;
  flat_price: number;
  pct_diff: number;
}

const SOURCE_LABELS: Record<string, string> = {
  filament_listings: 'Listings',
  product_regional_prices: 'Regional Prices',
  filament_prices: 'Store Prices',
  filaments_flat: 'Flat Column',
};

export function PriceSourceAudit() {
  const queryClient = useQueryClient();
  const [refreshing, setRefreshing] = useState(false);

  const { data: conflicts, isLoading, dataUpdatedAt } = useQuery({
    queryKey: ['price-source-audit'],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_price_conflicts', { p_limit: 50 });
      if (error) throw error;
      return (data ?? []) as PriceConflict[];
    },
    staleTime: 1000 * 60 * 5,
  });

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      const { error } = await supabase.rpc('refresh_canonical_prices');
      if (error) throw error;
      toast({ title: 'Canonical prices refreshed', description: 'Materialized view updated successfully.' });
      queryClient.invalidateQueries({ queryKey: ['price-source-audit'] });
    } catch (e: any) {
      toast({ title: 'Refresh failed', description: e.message, variant: 'destructive' });
    } finally {
      setRefreshing(false);
    }
  };

  const conflictCount = conflicts?.length ?? 0;

  return (
    <section className="space-y-3">
      <div className="flex items-center gap-3">
        <h2 className="text-lg font-semibold text-foreground">Price Source Audit</h2>
        {dataUpdatedAt != null && dataUpdatedAt > 0 && (
          <span className="text-xs text-muted-foreground">
            Updated {Math.floor((Date.now() - dataUpdatedAt) / 60000)}m ago
          </span>
        )}
      </div>

      <div className="flex items-center gap-4">
        <Card className="flex-1">
          <CardContent className="p-4 flex items-center gap-3">
            {conflictCount > 0 ? (
              <AlertTriangle className="w-5 h-5 text-yellow-500 shrink-0" />
            ) : (
              <CheckCircle className="w-5 h-5 text-green-500 shrink-0" />
            )}
            <div>
              <p className="text-sm font-medium text-foreground">
                {isLoading ? 'Checking…' : conflictCount === 0
                  ? 'No price conflicts detected'
                  : `${conflictCount} filament×region pairs have >5% price conflict`}
              </p>
              <p className="text-xs text-muted-foreground">
                Canonical price (from listings/regional/store) vs flat column on filaments table
              </p>
            </div>
          </CardContent>
        </Card>

        <Button
          size="sm"
          variant="outline"
          onClick={handleRefresh}
          disabled={refreshing}
        >
          {refreshing ? <Loader2 className="w-3.5 h-3.5 mr-1 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5 mr-1" />}
          Refresh View
        </Button>
      </div>

      {!isLoading && conflictCount > 0 && (
        <Card>
          <CardHeader className="py-3 px-4">
            <CardTitle className="text-sm font-medium">Top {conflictCount} Conflicts</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-auto max-h-[420px]">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Filament</TableHead>
                    <TableHead>Region</TableHead>
                    <TableHead>Canonical</TableHead>
                    <TableHead>Source</TableHead>
                    <TableHead>Flat Price</TableHead>
                    <TableHead className="text-right">Diff %</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {conflicts!.map((c, i) => (
                    <TableRow key={`${c.filament_id}-${c.region_code}-${i}`}>
                      <TableCell className="max-w-[200px] truncate text-xs">
                        <span className="font-medium">{c.product_title}</span>
                        <br />
                        <span className="text-muted-foreground">{c.vendor}</span>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-xs">{c.region_code}</Badge>
                      </TableCell>
                      <TableCell className="font-mono text-xs">{c.canonical_price?.toFixed(2)}</TableCell>
                      <TableCell>
                        <Badge variant="secondary" className="text-xs">
                          {SOURCE_LABELS[c.canonical_source] ?? c.canonical_source}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-mono text-xs">{c.flat_price?.toFixed(2)}</TableCell>
                      <TableCell className="text-right">
                        <span className={c.pct_diff > 20 ? 'text-destructive font-semibold' : 'text-yellow-500'}>
                          {c.pct_diff}%
                        </span>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}
    </section>
  );
}
