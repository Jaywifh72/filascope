import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { CheckCircle, XCircle, ArrowRight, AlertTriangle, Clock, Download, ExternalLink, RefreshCw, Play, Loader2 } from 'lucide-react';
import { downloadCSV } from '@/lib/csvExport';

const REGIONS = ['US', 'CA', 'UK', 'EU', 'AU', 'JP'];

function statusBadge(status: string) {
  switch (status) {
    case 'valid':
      return <Badge variant="default" className="bg-green-600"><CheckCircle className="w-3 h-3 mr-1" />Valid</Badge>;
    case 'broken':
      return <Badge variant="destructive"><XCircle className="w-3 h-3 mr-1" />Broken</Badge>;
    case 'redirect':
      return <Badge variant="secondary" className="bg-yellow-600 text-white"><ArrowRight className="w-3 h-3 mr-1" />Redirect</Badge>;
    case 'timeout':
      return <Badge variant="secondary"><Clock className="w-3 h-3 mr-1" />Timeout</Badge>;
    default:
      return <Badge variant="outline"><AlertTriangle className="w-3 h-3 mr-1" />Error</Badge>;
  }
}

export function BuyButtonValidator() {
  const queryClient = useQueryClient();
  const [brandFilter, setBrandFilter] = useState<string>('all');
  const [regionFilter, setRegionFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRunId, setSelectedRunId] = useState<string | null>(null);

  // Fetch validation runs
  const { data: runs } = useQuery({
    queryKey: ['validation-runs'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('validation_runs')
        .select('*')
        .order('started_at', { ascending: false })
        .limit(20);
      if (error) throw error;
      return data;
    },
    refetchInterval: 5000,
  });

  const latestRun = runs?.[0];
  const activeRunId = selectedRunId || latestRun?.id;

  // Fetch validation results for active run
  const { data: results, isLoading: resultsLoading } = useQuery({
    queryKey: ['validation-results', activeRunId, brandFilter, regionFilter, statusFilter, searchTerm],
    queryFn: async () => {
      if (!activeRunId) return [];
      let query = supabase
        .from('buy_button_validation_log')
        .select('*')
        .eq('validation_run_id', activeRunId)
        .order('validation_status', { ascending: true })
        .order('brand_name')
        .limit(500);

      if (brandFilter && brandFilter !== 'all') query = query.ilike('brand_name', brandFilter);
      if (regionFilter && regionFilter !== 'all') query = query.eq('region', regionFilter);
      if (statusFilter && statusFilter !== 'all') query = query.eq('validation_status', statusFilter);
      if (searchTerm) query = query.ilike('product_name', `%${searchTerm}%`);

      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
    enabled: !!activeRunId,
    refetchInterval: latestRun?.status === 'running' ? 3000 : false,
  });

  // Get unique brands from results
  const { data: brands } = useQuery({
    queryKey: ['validation-brands', activeRunId],
    queryFn: async () => {
      if (!activeRunId) return [];
      const { data } = await supabase
        .from('buy_button_validation_log')
        .select('brand_name')
        .eq('validation_run_id', activeRunId)
        .order('brand_name');
      const unique = [...new Set(data?.map(d => d.brand_name).filter(Boolean))];
      return unique as string[];
    },
    enabled: !!activeRunId,
  });

  // Trigger validation mutation
  const validateMutation = useMutation({
    mutationFn: async (params: { brand_filter?: string; region_filter?: string }) => {
      const { data, error } = await supabase.functions.invoke('validate-all-buy-buttons', {
        body: {
          brand_filter: params.brand_filter === 'all' ? undefined : params.brand_filter,
          region_filter: params.region_filter === 'all' ? undefined : params.region_filter,
        },
      });
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['validation-runs'] });
      queryClient.invalidateQueries({ queryKey: ['validation-results'] });
      const broken = data.broken_count || 0;
      if (broken > 10) {
        toast.warning(`Validation complete: ${broken} broken links found!`, { duration: 8000 });
      } else if (broken > 0) {
        toast.error(`Validation complete: ${broken} broken link(s) found`);
      } else {
        toast.success(`Validation complete: All ${data.total_checks} links valid!`);
      }
    },
    onError: (err: any) => {
      toast.error(`Validation failed: ${err.message}`);
    },
  });

  const handleExportCSV = () => {
    if (!results?.length) return;
    const csvData = results.map(r => ({
      product_name: r.product_name || '',
      brand_name: r.brand_name || '',
      region: r.region,
      store_url: r.store_url || '',
      http_status_code: r.http_status_code || '',
      validation_status: r.validation_status,
      error_message: r.error_message || '',
      response_time_ms: r.response_time_ms || '',
      checked_at: r.checked_at,
    }));
    downloadCSV(csvData as any, 'buy-button-validation-report');
    toast.success('CSV exported');
  };

  const isRunning = latestRun?.status === 'running' || validateMutation.isPending;

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      {latestRun && (
        <div className="grid grid-cols-2 md:grid-cols-6 gap-3">
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold">{latestRun.total_checks || 0}</div>
              <div className="text-xs text-muted-foreground">Total Checks</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-green-600">{latestRun.valid_count || 0}</div>
              <div className="text-xs text-muted-foreground">Valid</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-red-600">{latestRun.broken_count || 0}</div>
              <div className="text-xs text-muted-foreground">Broken</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-yellow-600">{latestRun.redirect_count || 0}</div>
              <div className="text-xs text-muted-foreground">Redirects</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-orange-600">{(latestRun.error_count || 0) + (latestRun.timeout_count || 0)}</div>
              <div className="text-xs text-muted-foreground">Errors</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold">
                {latestRun.total_checks ? Math.round(((latestRun.valid_count || 0) / latestRun.total_checks) * 100) : 0}%
              </div>
              <div className="text-xs text-muted-foreground">Success Rate</div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center justify-between">
            <span>Buy Button Validation</span>
            {isRunning && (
              <Badge variant="outline" className="animate-pulse">
                <Loader2 className="w-3 h-3 mr-1 animate-spin" />Running...
              </Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-3">
            <Button
              onClick={() => validateMutation.mutate({})}
              disabled={isRunning}
            >
              {isRunning ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Play className="w-4 h-4 mr-2" />}
              Validate All Products
            </Button>

            <Select value={brandFilter} onValueChange={(v) => {
              setBrandFilter(v);
            }}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Filter Brand" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Brands</SelectItem>
                {brands?.map(b => <SelectItem key={b} value={b}>{b}</SelectItem>)}
              </SelectContent>
            </Select>

            <Button
              variant="outline"
              onClick={() => validateMutation.mutate({ brand_filter: brandFilter !== 'all' ? brandFilter : undefined })}
              disabled={isRunning || brandFilter === 'all'}
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Validate Brand
            </Button>

            <Select value={regionFilter} onValueChange={setRegionFilter}>
              <SelectTrigger className="w-36">
                <SelectValue placeholder="Region" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Regions</SelectItem>
                {REGIONS.map(r => <SelectItem key={r} value={r}>{r}</SelectItem>)}
              </SelectContent>
            </Select>

            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-36">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="valid">Valid</SelectItem>
                <SelectItem value="broken">Broken</SelectItem>
                <SelectItem value="redirect">Redirect</SelectItem>
                <SelectItem value="timeout">Timeout</SelectItem>
                <SelectItem value="error">Error</SelectItem>
              </SelectContent>
            </Select>

            <Input
              placeholder="Search product..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-48"
            />

            <Button variant="outline" onClick={handleExportCSV} disabled={!results?.length}>
              <Download className="w-4 h-4 mr-2" />Export CSV
            </Button>
          </div>

          {/* Validation History */}
          {runs && runs.length > 1 && (
            <div className="mt-4">
              <p className="text-xs text-muted-foreground mb-2">Past Runs:</p>
              <div className="flex flex-wrap gap-2">
                {runs.slice(0, 5).map(r => (
                  <Button
                    key={r.id}
                    variant={activeRunId === r.id ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setSelectedRunId(r.id)}
                    className="text-xs"
                  >
                    {new Date(r.started_at).toLocaleDateString()} — {r.total_checks || '?'} checks
                    {r.broken_count ? ` (${r.broken_count} broken)` : ''}
                  </Button>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Results Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">
            Validation Results {results ? `(${results.length} shown)` : ''}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {resultsLoading ? (
            <div className="text-center py-8 text-muted-foreground">Loading results...</div>
          ) : !results?.length ? (
            <div className="text-center py-8 text-muted-foreground">
              No results yet. Run a validation to get started.
            </div>
          ) : (
            <div className="overflow-auto max-h-[600px]">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Product</TableHead>
                    <TableHead>Brand</TableHead>
                    <TableHead>Region</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>HTTP</TableHead>
                    <TableHead>Time</TableHead>
                    <TableHead>Error</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {results.map(row => (
                    <TableRow key={row.id} className={row.validation_status === 'broken' ? 'bg-red-50 dark:bg-red-950/20' : ''}>
                      <TableCell className="max-w-[200px] truncate text-xs font-medium">
                        {row.product_name || 'Unknown'}
                      </TableCell>
                      <TableCell className="text-xs">{row.brand_name}</TableCell>
                      <TableCell><Badge variant="outline" className="text-xs">{row.region}</Badge></TableCell>
                      <TableCell>{statusBadge(row.validation_status)}</TableCell>
                      <TableCell className="text-xs font-mono">{row.http_status_code || '—'}</TableCell>
                      <TableCell className="text-xs">{row.response_time_ms ? `${row.response_time_ms}ms` : '—'}</TableCell>
                      <TableCell className="max-w-[150px] truncate text-xs text-muted-foreground">
                        {row.error_message || (row.redirect_url ? `→ ${row.redirect_url}` : '—')}
                      </TableCell>
                      <TableCell>
                        {row.store_url && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => window.open(row.store_url, '_blank')}
                          >
                            <ExternalLink className="w-3 h-3" />
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
