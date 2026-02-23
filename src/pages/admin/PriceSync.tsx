import { useState, useEffect } from 'react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { AdminPageHeader } from '@/components/admin/AdminPageHeader';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Table, TableHeader, TableBody, TableRow, TableHead, TableCell,
} from '@/components/ui/table';
import {
  Collapsible, CollapsibleTrigger, CollapsibleContent,
} from '@/components/ui/collapsible';
import { RefreshCw, DollarSign, AlertTriangle, CheckCircle, ChevronDown, Clock, TrendingUp } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface RegionResult {
  oldPrice: number | null;
  newPrice: number;
  msrp: number;
  variantId?: number;
  variantTitle?: string;
  status: string;
  isAnomaly?: boolean;
  error?: string;
}

interface PrinterResult {
  printer: string;
  slug: string | null;
  error?: string;
  regions: Record<string, RegionResult>;
}

interface SyncResponse {
  success: boolean;
  brand: string;
  timestamp: string;
  results: PrinterResult[];
  summary: {
    printersChecked: number;
    pricesUpdated: number;
    errors: number;
    anomalies: number;
  };
  error?: string;
}

interface LastSyncInfo {
  lastSyncAt: string | null;
  pricesUpdated: number;
}

export default function PriceSync() {
  const [syncing, setSyncing] = useState(false);
  const [lastResult, setLastResult] = useState<SyncResponse | null>(null);
  const [lastSyncInfo, setLastSyncInfo] = useState<LastSyncInfo>({ lastSyncAt: null, pricesUpdated: 0 });
  const [diffOpen, setDiffOpen] = useState(true);

  // Fetch last sync info from price_history
  useEffect(() => {
    async function fetchLastSync() {
      const { data } = await supabase
        .from('price_history')
        .select('recorded_at')
        .eq('source', 'bambu-resync')
        .eq('product_type', 'printer')
        .order('recorded_at', { ascending: false })
        .limit(1);

      if (data && data.length > 0) {
        const lastAt = data[0].recorded_at;
        // Count how many updates in last sync batch (within 5 min window)
        const { count } = await supabase
          .from('price_history')
          .select('id', { count: 'exact', head: true })
          .eq('source', 'bambu-resync')
          .eq('product_type', 'printer')
          .gte('recorded_at', new Date(new Date(lastAt).getTime() - 5 * 60000).toISOString());

        setLastSyncInfo({ lastSyncAt: lastAt, pricesUpdated: count || 0 });
      }
    }
    fetchLastSync();
  }, [lastResult]);

  const handleSync = async () => {
    setSyncing(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast.error('You must be logged in');
        return;
      }

      const { data, error } = await supabase.functions.invoke('resync-bambu-prices', {
        body: { brand: 'bambu-lab' },
      });

      if (error) throw error;
      setLastResult(data as SyncResponse);

      if (data?.success) {
        toast.success(`Sync complete: ${data.summary.pricesUpdated} prices updated, ${data.summary.errors} errors`);
      } else {
        toast.error(data?.error || 'Sync failed');
      }
    } catch (err: any) {
      toast.error(err.message || 'Sync failed');
    } finally {
      setSyncing(false);
    }
  };

  const formatDate = (d: string | null) => {
    if (!d) return 'Never';
    return new Date(d).toLocaleString();
  };

  const getChangePercent = (oldPrice: number | null, newPrice: number) => {
    if (!oldPrice || oldPrice === 0) return null;
    return ((newPrice - oldPrice) / oldPrice * 100).toFixed(1);
  };

  const getStatusColor = (status: string, isAnomaly?: boolean) => {
    if (isAnomaly) return 'text-destructive';
    switch (status) {
      case 'updated': return 'text-amber-500';
      case 'new': return 'text-primary';
      case 'unchanged': return 'text-muted-foreground';
      case 'not_found': return 'text-destructive';
      case 'error': return 'text-destructive';
      default: return 'text-muted-foreground';
    }
  };

  const getStatusBadge = (status: string, isAnomaly?: boolean) => {
    if (isAnomaly) return <Badge variant="destructive">Anomaly &gt;20%</Badge>;
    switch (status) {
      case 'updated': return <Badge className="bg-amber-500/20 text-amber-500 border-amber-500/30">Updated</Badge>;
      case 'new': return <Badge className="bg-primary/20 text-primary border-primary/30">New</Badge>;
      case 'unchanged': return <Badge variant="secondary">Unchanged</Badge>;
      case 'not_found': return <Badge variant="destructive">404</Badge>;
      case 'error': return <Badge variant="destructive">Error</Badge>;
      default: return <Badge variant="outline">{status}</Badge>;
    }
  };

  // Flatten results for the diff table
  const diffRows = lastResult?.results.flatMap((pr) =>
    Object.entries(pr.regions).map(([region, r]) => ({
      printer: pr.printer,
      region,
      ...r,
    }))
  ) || [];

  return (
    <AdminLayout>
      <div className="p-6 space-y-6">
        <AdminPageHeader
          title="Price Sync"
          description="Automated price syncing from Bambu Lab Shopify stores"
          icon={DollarSign}
          actions={
            <Button onClick={handleSync} disabled={syncing}>
              <RefreshCw className={cn('w-4 h-4 mr-2', syncing && 'animate-spin')} />
              {syncing ? 'Syncing...' : 'Sync Now'}
            </Button>
          }
        />

        {/* Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <Clock className="w-8 h-8 text-muted-foreground" />
              <div>
                <p className="text-xs text-muted-foreground">Last Sync</p>
                <p className="text-sm font-medium">{formatDate(lastSyncInfo.lastSyncAt)}</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <TrendingUp className="w-8 h-8 text-primary" />
              <div>
                <p className="text-xs text-muted-foreground">Prices Updated (Last)</p>
                <p className="text-sm font-medium">{lastResult?.summary.pricesUpdated ?? lastSyncInfo.pricesUpdated}</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <CheckCircle className="w-8 h-8 text-green-500" />
              <div>
                <p className="text-xs text-muted-foreground">Printers Checked</p>
                <p className="text-sm font-medium">{lastResult?.summary.printersChecked ?? '—'}</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <AlertTriangle className="w-8 h-8 text-destructive" />
              <div>
                <p className="text-xs text-muted-foreground">Errors / Anomalies</p>
                <p className="text-sm font-medium">
                  {lastResult ? `${lastResult.summary.errors} / ${lastResult.summary.anomalies}` : '—'}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Brand Sync Table */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Brand Sync Status</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Brand</TableHead>
                  <TableHead>Last Synced</TableHead>
                  <TableHead>Prices Updated</TableHead>
                  <TableHead>Errors</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow>
                  <TableCell className="font-medium">Bambu Lab</TableCell>
                  <TableCell>{formatDate(lastResult?.timestamp || lastSyncInfo.lastSyncAt)}</TableCell>
                  <TableCell>{lastResult?.summary.pricesUpdated ?? lastSyncInfo.pricesUpdated}</TableCell>
                  <TableCell>{lastResult?.summary.errors ?? '—'}</TableCell>
                  <TableCell>
                    {syncing ? (
                      <Badge className="bg-amber-500/20 text-amber-500 border-amber-500/30">Syncing</Badge>
                    ) : lastResult?.success ? (
                      <Badge className="bg-green-500/20 text-green-500 border-green-500/30">Success</Badge>
                    ) : lastResult ? (
                      <Badge variant="destructive">Failed</Badge>
                    ) : (
                      <Badge variant="secondary">Idle</Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button size="sm" variant="outline" onClick={handleSync} disabled={syncing}>
                      <RefreshCw className={cn('w-3 h-3 mr-1', syncing && 'animate-spin')} />
                      Sync
                    </Button>
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Diff View */}
        {lastResult && diffRows.length > 0 && (
          <Collapsible open={diffOpen} onOpenChange={setDiffOpen}>
            <Card>
              <CardHeader>
                <CollapsibleTrigger className="flex items-center gap-2 w-full">
                  <CardTitle className="text-lg flex-1 text-left">Price Changes</CardTitle>
                  <ChevronDown className={cn('w-4 h-4 transition-transform', diffOpen && 'rotate-180')} />
                </CollapsibleTrigger>
              </CardHeader>
              <CollapsibleContent>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Printer</TableHead>
                        <TableHead>Region</TableHead>
                        <TableHead className="text-right">Old Price</TableHead>
                        <TableHead className="text-right">New Price</TableHead>
                        <TableHead className="text-right">Change %</TableHead>
                        <TableHead>Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {diffRows.map((row, idx) => {
                        const pct = getChangePercent(row.oldPrice, row.newPrice);
                        const pctNum = pct ? parseFloat(pct) : 0;
                        return (
                          <TableRow key={idx}>
                            <TableCell className="font-medium">{row.printer}</TableCell>
                            <TableCell>{row.region}</TableCell>
                            <TableCell className="text-right font-mono">
                              {row.oldPrice != null ? `$${row.oldPrice.toFixed(2)}` : '—'}
                            </TableCell>
                            <TableCell className="text-right font-mono">
                              {row.newPrice != null ? `$${row.newPrice.toFixed(2)}` : '—'}
                            </TableCell>
                            <TableCell className={cn(
                              'text-right font-mono',
                              pctNum > 20 || pctNum < -20 ? 'text-destructive font-bold' :
                              pctNum > 10 || pctNum < -10 ? 'text-amber-500' :
                              'text-muted-foreground'
                            )}>
                              {pct ? `${pctNum > 0 ? '+' : ''}${pct}%` : '—'}
                            </TableCell>
                            <TableCell>
                              {row.error ? (
                                <span className="text-xs text-destructive">{row.error}</span>
                              ) : (
                                getStatusBadge(row.status, row.isAnomaly)
                              )}
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </CardContent>
              </CollapsibleContent>
            </Card>
          </Collapsible>
        )}
      </div>
    </AdminLayout>
  );
}
