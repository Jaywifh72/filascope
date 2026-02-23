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
import { RefreshCw, DollarSign, AlertTriangle, CheckCircle, ChevronDown, Clock, TrendingUp, Ban } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface RegionResult {
  oldPrice: number | null;
  newPrice: number;
  msrp: number;
  variantName?: string;
  status: string;
  isAnomaly?: boolean;
  extraction_method?: string;
  error?: string;
}

interface PrinterResult {
  printer: string;
  brand: string;
  slug: string | null;
  error?: string;
  skipped?: boolean;
  reason?: string;
  regions?: Record<string, RegionResult>;
}

interface SyncResponse {
  success: boolean;
  timestamp: string;
  results: PrinterResult[];
  summary: {
    printersChecked: number;
    pricesUpdated: number;
    skipped: number;
    errors: number;
    anomalies: number;
    manualOnly: number;
  };
  error?: string;
}

interface BrandConfig {
  brand_id: string;
  store_platform: string;
  primary_extraction: string;
  shopify_json_available: boolean;
  uses_geo_pricing: boolean;
  sync_notes: string | null;
}

interface BrandSyncState {
  syncing: boolean;
  lastResult: SyncResponse | null;
}

export default function PriceSync() {
  const [brands, setBrands] = useState<BrandConfig[]>([]);
  const [brandStates, setBrandStates] = useState<Record<string, BrandSyncState>>({});
  const [syncAllState, setSyncAllState] = useState<BrandSyncState>({ syncing: false, lastResult: null });
  const [diffOpen, setDiffOpen] = useState(true);
  const [activeDiffResult, setActiveDiffResult] = useState<SyncResponse | null>(null);

  // Fetch brand configs
  useEffect(() => {
    async function fetchConfigs() {
      const { data } = await supabase
        .from('brand_sync_config')
        .select('brand_id, store_platform, primary_extraction, shopify_json_available, uses_geo_pricing, sync_notes')
        .order('brand_id');
      if (data) setBrands(data as BrandConfig[]);
    }
    fetchConfigs();
  }, []);

  const invokeSyncFunction = async (brandId?: string): Promise<SyncResponse> => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) throw new Error('You must be logged in');

    const { data, error } = await supabase.functions.invoke('sync-printer-prices', {
      body: brandId ? { brand_id: brandId } : {},
    });
    if (error) throw error;
    return data as SyncResponse;
  };

  const handleSyncBrand = async (brandId: string) => {
    setBrandStates(prev => ({ ...prev, [brandId]: { syncing: true, lastResult: null } }));
    try {
      const result = await invokeSyncFunction(brandId);
      setBrandStates(prev => ({ ...prev, [brandId]: { syncing: false, lastResult: result } }));
      setActiveDiffResult(result);
      if (result.success) {
        toast.success(`${brandId}: ${result.summary.pricesUpdated} updated, ${result.summary.errors} errors`);
      } else {
        toast.error(result.error || 'Sync failed');
      }
    } catch (err: any) {
      setBrandStates(prev => ({ ...prev, [brandId]: { syncing: false, lastResult: null } }));
      toast.error(err.message || 'Sync failed');
    }
  };

  const handleSyncAll = async () => {
    setSyncAllState({ syncing: true, lastResult: null });
    try {
      const result = await invokeSyncFunction();
      setSyncAllState({ syncing: false, lastResult: result });
      setActiveDiffResult(result);
      if (result.success) {
        toast.success(`All brands: ${result.summary.pricesUpdated} updated, ${result.summary.errors} errors, ${result.summary.manualOnly} manual-only`);
      } else {
        toast.error(result.error || 'Sync failed');
      }
    } catch (err: any) {
      setSyncAllState({ syncing: false, lastResult: null });
      toast.error(err.message || 'Sync failed');
    }
  };

  const anySyncing = syncAllState.syncing || Object.values(brandStates).some(s => s.syncing);

  const formatDate = (d: string | null) => {
    if (!d) return 'Never';
    return new Date(d).toLocaleString();
  };

  const getChangePercent = (oldPrice: number | null, newPrice: number) => {
    if (!oldPrice || oldPrice === 0) return null;
    return ((newPrice - oldPrice) / oldPrice * 100).toFixed(1);
  };

  const getStatusBadge = (status: string, isAnomaly?: boolean) => {
    if (isAnomaly) return <Badge variant="destructive">Anomaly &gt;40%</Badge>;
    switch (status) {
      case 'updated': return <Badge className="bg-amber-500/20 text-amber-500 border-amber-500/30">Updated</Badge>;
      case 'new': return <Badge className="bg-primary/20 text-primary border-primary/30">New</Badge>;
      case 'unchanged': return <Badge variant="secondary">Unchanged</Badge>;
      case 'not_found': return <Badge variant="destructive">404</Badge>;
      case 'extraction_failed': return <Badge variant="destructive">Failed</Badge>;
      case 'error': return <Badge variant="destructive">Error</Badge>;
      case 'skipped': return <Badge variant="outline">Skipped</Badge>;
      default: return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getExtractionBadge = (method: string) => {
    const colors: Record<string, string> = {
      manual_only: 'bg-muted text-muted-foreground',
      shopify_json: 'bg-green-500/20 text-green-500 border-green-500/30',
      json_ld: 'bg-blue-500/20 text-blue-500 border-blue-500/30',
      meta_tags: 'bg-amber-500/20 text-amber-500 border-amber-500/30',
    };
    return <Badge className={colors[method] || ''}>{method.replace(/_/g, ' ')}</Badge>;
  };

  const lastResult = activeDiffResult;
  const diffRows = lastResult?.results
    .filter(pr => pr.regions && !pr.skipped)
    .flatMap(pr =>
      Object.entries(pr.regions!).map(([region, r]) => ({
        printer: pr.printer,
        brand: pr.brand,
        region,
        ...r,
      }))
    ) || [];

  const summary = lastResult?.summary || syncAllState.lastResult?.summary;

  return (
    <AdminLayout>
      <div className="p-6 space-y-6">
        <AdminPageHeader
          title="Printer Price Sync"
          description="Automated price syncing from brand stores using brand_sync_config"
          icon={DollarSign}
          actions={
            <Button onClick={handleSyncAll} disabled={anySyncing}>
              <RefreshCw className={cn('w-4 h-4 mr-2', syncAllState.syncing && 'animate-spin')} />
              {syncAllState.syncing ? 'Syncing All...' : 'Sync All Brands'}
            </Button>
          }
        />

        {/* Summary Cards */}
        {summary && (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
            <Card>
              <CardContent className="p-4 flex items-center gap-3">
                <CheckCircle className="w-6 h-6 text-green-500 shrink-0" />
                <div>
                  <p className="text-xs text-muted-foreground">Checked</p>
                  <p className="text-lg font-semibold">{summary.printersChecked}</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 flex items-center gap-3">
                <TrendingUp className="w-6 h-6 text-primary shrink-0" />
                <div>
                  <p className="text-xs text-muted-foreground">Updated</p>
                  <p className="text-lg font-semibold">{summary.pricesUpdated}</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 flex items-center gap-3">
                <Clock className="w-6 h-6 text-muted-foreground shrink-0" />
                <div>
                  <p className="text-xs text-muted-foreground">Skipped</p>
                  <p className="text-lg font-semibold">{summary.skipped}</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 flex items-center gap-3">
                <AlertTriangle className="w-6 h-6 text-amber-500 shrink-0" />
                <div>
                  <p className="text-xs text-muted-foreground">Anomalies</p>
                  <p className="text-lg font-semibold">{summary.anomalies}</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 flex items-center gap-3">
                <AlertTriangle className="w-6 h-6 text-destructive shrink-0" />
                <div>
                  <p className="text-xs text-muted-foreground">Errors</p>
                  <p className="text-lg font-semibold">{summary.errors}</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 flex items-center gap-3">
                <Ban className="w-6 h-6 text-muted-foreground shrink-0" />
                <div>
                  <p className="text-xs text-muted-foreground">Manual Only</p>
                  <p className="text-lg font-semibold">{summary.manualOnly}</p>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Brand Sync Table */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Brand Sync Configuration</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Brand</TableHead>
                  <TableHead>Platform</TableHead>
                  <TableHead>Extraction</TableHead>
                  <TableHead>Geo-Pricing</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {brands.map(brand => {
                  const state = brandStates[brand.brand_id];
                  const isManual = brand.primary_extraction === 'manual_only';
                  return (
                    <TableRow key={brand.brand_id}>
                      <TableCell className="font-medium">{brand.brand_id}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{brand.store_platform}</Badge>
                      </TableCell>
                      <TableCell>{getExtractionBadge(brand.primary_extraction)}</TableCell>
                      <TableCell>
                        {brand.uses_geo_pricing ? (
                          <Badge className="bg-amber-500/20 text-amber-500 border-amber-500/30">Yes</Badge>
                        ) : (
                          <span className="text-muted-foreground text-sm">No</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {isManual ? (
                          <Badge variant="secondary">Manual Only</Badge>
                        ) : state?.syncing ? (
                          <Badge className="bg-amber-500/20 text-amber-500 border-amber-500/30">Syncing</Badge>
                        ) : state?.lastResult?.success ? (
                          <Badge className="bg-green-500/20 text-green-500 border-green-500/30">
                            {state.lastResult.summary.pricesUpdated} updated
                          </Badge>
                        ) : state?.lastResult ? (
                          <Badge variant="destructive">Failed</Badge>
                        ) : (
                          <Badge variant="outline">Idle</Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleSyncBrand(brand.brand_id)}
                          disabled={isManual || anySyncing}
                        >
                          <RefreshCw className={cn('w-3 h-3 mr-1', state?.syncing && 'animate-spin')} />
                          Sync
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
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
                  <CardTitle className="text-lg flex-1 text-left">Price Changes ({diffRows.length} rows)</CardTitle>
                  <ChevronDown className={cn('w-4 h-4 transition-transform', diffOpen && 'rotate-180')} />
                </CollapsibleTrigger>
              </CardHeader>
              <CollapsibleContent>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Brand</TableHead>
                        <TableHead>Printer</TableHead>
                        <TableHead>Region</TableHead>
                        <TableHead className="text-right">Old Price</TableHead>
                        <TableHead className="text-right">New Price</TableHead>
                        <TableHead className="text-right">Change %</TableHead>
                        <TableHead>Method</TableHead>
                        <TableHead>Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {diffRows.map((row, idx) => {
                        const pct = getChangePercent(row.oldPrice, row.newPrice);
                        const pctNum = pct ? parseFloat(pct) : 0;
                        return (
                          <TableRow key={idx}>
                            <TableCell className="text-xs text-muted-foreground">{row.brand}</TableCell>
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
                              {row.extraction_method && (
                                <span className="text-xs text-muted-foreground">{row.extraction_method}</span>
                              )}
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
