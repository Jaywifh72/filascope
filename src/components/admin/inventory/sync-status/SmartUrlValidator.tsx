import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Loader2, Search, Wrench, CheckCircle2, XCircle, AlertTriangle, ExternalLink, RefreshCw, Download, Zap, ShieldAlert, Globe } from 'lucide-react';
import { toast } from 'sonner';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

interface RepairItem {
  id: string;
  original_url: string;
  product_id: string;
  product_name: string;
  brand_name: string;
  region: string;
  url_column: string;
  http_status: number | null;
  failure_reason: string;
  diagnosis_details: Record<string, unknown>;
  suggested_url: string | null;
  suggestion_source: string | null;
  suggestion_confidence: number;
  suggestion_validated: boolean;
  status: string;
  created_at: string;
}

const FAILURE_REASONS: Record<string, { label: string; color: string; icon: typeof AlertTriangle }> = {
  discontinued: { label: 'Discontinued', color: 'destructive', icon: XCircle },
  slug_changed: { label: 'Slug Changed', color: 'default', icon: RefreshCw },
  domain_changed: { label: 'Domain Changed', color: 'secondary', icon: Globe },
  store_down: { label: 'Store Down', color: 'outline', icon: ShieldAlert },
  soft_404: { label: 'Soft 404', color: 'destructive', icon: AlertTriangle },
  redirect_chain: { label: 'Redirect Chain', color: 'secondary', icon: RefreshCw },
  unknown: { label: 'Unknown', color: 'outline', icon: AlertTriangle },
};

export function SmartUrlValidator() {
  const queryClient = useQueryClient();
  const [brandFilter, setBrandFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('pending');
  const [searchQuery, setSearchQuery] = useState('');
  const [scanLimit, setScanLimit] = useState(50);
  const [scanProgress, setScanProgress] = useState<{ scanning: boolean; message: string }>({ scanning: false, message: '' });
  const [singleUrl, setSingleUrl] = useState('');
  const [singleDiagnosis, setSingleDiagnosis] = useState<any>(null);
  const [deepSearching, setDeepSearching] = useState<Record<string, boolean>>({});

  const SOURCE_BADGES: Record<string, { label: string; className: string }> = {
    slug_variant: { label: 'Slug Match', className: '' },
    shopify_catalog: { label: 'Catalog Search', className: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' },
    shopify_search: { label: 'Store Search', className: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' },
    site_search: { label: 'Site Search', className: 'bg-amber-500/20 text-amber-400 border-amber-500/30' },
    cross_region_lookup: { label: 'Cross-Region', className: 'bg-purple-500/20 text-purple-400 border-purple-500/30' },
  };

  const handleDeepSearch = useCallback(async (item: RepairItem) => {
    setDeepSearching(prev => ({ ...prev, [item.id]: true }));
    try {
      const { data, error } = await supabase.functions.invoke('smart-url-validator', {
        body: { action: 'diagnose', url: item.original_url, region: item.region },
      });
      if (error) throw error;
      const diag = data?.diagnosis;
      if (diag?.suggested_url) {
        await supabase
          .from('url_repair_queue')
          .update({
            suggested_url: diag.suggested_url,
            suggestion_source: diag.suggestion_source || 'unknown',
            suggestion_confidence: diag.suggestion_confidence || 0,
            suggestion_validated: diag.suggestion_validated ?? false,
          })
          .eq('id', item.id);
        queryClient.invalidateQueries({ queryKey: ['url-repair-queue'] });
        toast.success(`Found fix: ${diag.suggested_url.slice(0, 50)}...`);
      } else {
        toast.info('No match found for this URL');
      }
    } catch (err: any) {
      toast.error(`Deep search failed: ${err.message}`);
    } finally {
      setDeepSearching(prev => ({ ...prev, [item.id]: false }));
    }
  }, [queryClient]);

  // Fetch repair queue
  const { data: repairs, isLoading } = useQuery({
    queryKey: ['url-repair-queue', statusFilter, brandFilter, searchQuery],
    queryFn: async () => {
      let query = supabase
        .from('url_repair_queue')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(200);

      if (statusFilter && statusFilter !== 'all') query = query.eq('status', statusFilter);
      if (brandFilter) query = query.ilike('brand_name', `%${brandFilter}%`);
      if (searchQuery) query = query.or(`product_name.ilike.%${searchQuery}%,original_url.ilike.%${searchQuery}%`);

      const { data, error } = await query;
      if (error) throw error;
      return (data || []) as RepairItem[];
    },
  });

  // Summary stats
  const stats = {
    total: repairs?.length || 0,
    autoFixable: repairs?.filter(r => r.suggested_url && r.suggestion_validated).length || 0,
    pending: repairs?.filter(r => r.status === 'pending').length || 0,
    applied: repairs?.filter(r => r.status === 'applied').length || 0,
  };

  // Scan mutation
  const scanMutation = useMutation({
    mutationFn: async () => {
      setScanProgress({ scanning: true, message: `Scanning up to ${scanLimit} products...` });
      const { data, error } = await supabase.functions.invoke('smart-url-validator', {
        body: { action: 'scan', brand_filter: brandFilter || undefined, limit: scanLimit },
      });
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      setScanProgress({ scanning: false, message: '' });
      toast.success(`Scan complete: ${data.issues_found} issues found, ${data.auto_fixable} auto-fixable`);
      queryClient.invalidateQueries({ queryKey: ['url-repair-queue'] });
    },
    onError: (err: any) => {
      setScanProgress({ scanning: false, message: '' });
      toast.error(`Scan failed: ${err.message}`);
    },
  });

  // Single URL diagnose
  const diagnoseMutation = useMutation({
    mutationFn: async (url: string) => {
      const { data, error } = await supabase.functions.invoke('smart-url-validator', {
        body: { action: 'diagnose', url },
      });
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => setSingleDiagnosis(data.diagnosis),
    onError: (err: any) => toast.error(`Diagnosis failed: ${err.message}`),
  });

  // Update status mutation
  const updateStatusMutation = useMutation({
    mutationFn: async ({ ids, status }: { ids: string[]; status: string }) => {
      const { error } = await supabase
        .from('url_repair_queue')
        .update({ status, reviewed_at: new Date().toISOString() })
        .in('id', ids);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Status updated');
      queryClient.invalidateQueries({ queryKey: ['url-repair-queue'] });
    },
  });

  // Apply repairs mutation
  const applyMutation = useMutation({
    mutationFn: async (ids: string[]) => {
      const { data, error } = await supabase.functions.invoke('smart-url-validator', {
        body: { action: 'apply', repair_ids: ids },
      });
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      toast.success(`Applied ${data.applied} URL fixes`);
      queryClient.invalidateQueries({ queryKey: ['url-repair-queue'] });
    },
  });

  // CSV export
  const exportCsv = useCallback(() => {
    if (!repairs?.length) return;
    const headers = ['Product', 'Brand', 'Region', 'Original URL', 'Status Code', 'Failure Reason', 'Suggested URL', 'Confidence', 'Status'];
    const rows = repairs.map(r => [
      r.product_name, r.brand_name, r.region, r.original_url,
      r.http_status?.toString() || '', r.failure_reason,
      r.suggested_url || '', (r.suggestion_confidence * 100).toFixed(0) + '%', r.status,
    ]);
    const csv = [headers, ...rows].map(r => r.map(c => `"${(c || '').replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `url-repair-report-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  }, [repairs]);

  const ReasonBadge = ({ reason }: { reason: string }) => {
    const config = FAILURE_REASONS[reason] || FAILURE_REASONS.unknown;
    return (
      <Badge variant={config.color as any} className="text-xs gap-1">
        <config.icon className="h-3 w-3" />
        {config.label}
      </Badge>
    );
  };

  return (
    <div className="space-y-6">
      {/* Single URL Diagnosis Tool */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Zap className="h-4 w-4 text-amber-500" />
            Quick URL Diagnosis
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2">
            <Input
              placeholder="Paste a store URL to diagnose..."
              value={singleUrl}
              onChange={(e) => setSingleUrl(e.target.value)}
              className="flex-1"
            />
            <Button
              onClick={() => diagnoseMutation.mutate(singleUrl)}
              disabled={!singleUrl || diagnoseMutation.isPending}
              size="sm"
            >
              {diagnoseMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
              Diagnose
            </Button>
          </div>
          {singleDiagnosis && (
            <div className="mt-3 p-3 rounded-md bg-muted text-sm space-y-1">
              <div className="flex items-center gap-2">
                <span className="font-medium">Result:</span>
                <ReasonBadge reason={singleDiagnosis.failure_reason} />
                {singleDiagnosis.http_status && <Badge variant="outline">{singleDiagnosis.http_status}</Badge>}
              </div>
              {singleDiagnosis.suggested_url && (
                <div className="flex items-center gap-2 text-green-600">
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  <span className="font-medium">Fix found:</span>
                  <a href={singleDiagnosis.suggested_url} target="_blank" rel="noopener noreferrer" className="underline truncate max-w-md">
                    {singleDiagnosis.suggested_url}
                  </a>
                  <Badge variant="outline" className="text-xs">
                    {(singleDiagnosis.suggestion_confidence * 100).toFixed(0)}% confidence
                  </Badge>
                </div>
              )}
              <details className="text-xs text-muted-foreground">
                <summary className="cursor-pointer">Details</summary>
                <pre className="mt-1 overflow-auto max-h-32">{JSON.stringify(singleDiagnosis.diagnosis_details, null, 2)}</pre>
              </details>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Batch Scan Controls */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base flex items-center gap-2">
              <Wrench className="h-4 w-4" />
              URL Repair Queue
            </CardTitle>
            <div className="flex items-center gap-4 text-sm">
              <span className="text-muted-foreground">{stats.total} issues</span>
              <span className="text-green-600">{stats.autoFixable} auto-fixable</span>
              <span className="text-amber-600">{stats.pending} pending</span>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Filters & Actions */}
          <div className="flex flex-wrap gap-2 items-center">
            <Input
              placeholder="Search products..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-48"
            />
            <Input
              placeholder="Brand filter..."
              value={brandFilter}
              onChange={(e) => setBrandFilter(e.target.value)}
              className="w-36"
            />
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="approved">Approved</SelectItem>
                <SelectItem value="applied">Applied</SelectItem>
                <SelectItem value="rejected">Rejected</SelectItem>
                <SelectItem value="ignored">Ignored</SelectItem>
              </SelectContent>
            </Select>
            <div className="flex-1" />
            <Select value={String(scanLimit)} onValueChange={(v) => setScanLimit(Number(v))}>
              <SelectTrigger className="w-28">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="25">25 products</SelectItem>
                <SelectItem value="50">50 products</SelectItem>
                <SelectItem value="100">100 products</SelectItem>
                <SelectItem value="200">200 products</SelectItem>
              </SelectContent>
            </Select>
            <Button onClick={() => scanMutation.mutate()} disabled={scanProgress.scanning} size="sm">
              {scanProgress.scanning ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <Search className="h-4 w-4 mr-1" />}
              Scan Products
            </Button>
            <Button onClick={exportCsv} variant="outline" size="sm" disabled={!repairs?.length}>
              <Download className="h-4 w-4 mr-1" /> CSV
            </Button>
          </div>

          {scanProgress.scanning && (
            <div className="p-3 rounded-md bg-blue-50 dark:bg-blue-950 text-sm text-blue-700 dark:text-blue-300 flex items-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin" />
              {scanProgress.message}
            </div>
          )}

          {/* Bulk actions for pending items with suggestions */}
          {repairs && repairs.filter(r => r.status === 'pending' && r.suggested_url && r.suggestion_validated).length > 0 && (
            <div className="p-3 rounded-md bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 flex items-center justify-between">
              <span className="text-sm text-green-700 dark:text-green-300">
                {repairs.filter(r => r.status === 'pending' && r.suggested_url && r.suggestion_validated).length} verified fixes ready to apply
              </span>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    const ids = repairs.filter(r => r.status === 'pending' && r.suggested_url && r.suggestion_validated).map(r => r.id);
                    updateStatusMutation.mutate({ ids, status: 'approved' });
                  }}
                >
                  Approve All
                </Button>
                <Button
                  size="sm"
                  onClick={() => {
                    const ids = repairs.filter(r => r.status === 'approved').map(r => r.id);
                    if (ids.length) applyMutation.mutate(ids);
                    else toast.info('Approve repairs first');
                  }}
                  disabled={applyMutation.isPending}
                >
                  {applyMutation.isPending ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : <Wrench className="h-3 w-3 mr-1" />}
                  Apply Approved
                </Button>
              </div>
            </div>
          )}

          {/* Results Table */}
          {isLoading ? (
            <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
          ) : !repairs?.length ? (
            <div className="text-center py-8 text-muted-foreground text-sm">
              No items in repair queue. Run a scan to detect broken URLs.
            </div>
          ) : (
            <div className="rounded-md border overflow-auto max-h-[500px]">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[200px]">Product</TableHead>
                    <TableHead>Brand</TableHead>
                    <TableHead>Region</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Reason</TableHead>
                    <TableHead>Fix</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {repairs.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell className="font-medium text-xs max-w-[200px] truncate" title={item.product_name}>
                        {item.product_name || 'Unknown'}
                      </TableCell>
                      <TableCell className="text-xs">{item.brand_name}</TableCell>
                      <TableCell><Badge variant="outline" className="text-xs">{item.region}</Badge></TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-xs">
                          {item.http_status || '—'}
                        </Badge>
                      </TableCell>
                      <TableCell><ReasonBadge reason={item.failure_reason} /></TableCell>
                      <TableCell className="text-xs max-w-[250px]">
                        {item.suggested_url ? (
                          <div className="flex items-center gap-1 flex-wrap">
                            {item.suggestion_source && SOURCE_BADGES[item.suggestion_source] && (
                              <Badge variant="outline" className={`text-[9px] h-4 px-1 ${SOURCE_BADGES[item.suggestion_source].className}`}>
                                {SOURCE_BADGES[item.suggestion_source].label}
                              </Badge>
                            )}
                            {item.suggestion_validated ? (
                              <CheckCircle2 className="h-3.5 w-3.5 text-green-500 shrink-0" />
                            ) : (
                              <AlertTriangle className="h-3.5 w-3.5 text-amber-500 shrink-0" />
                            )}
                            <a href={item.suggested_url} target="_blank" rel="noopener noreferrer" className="truncate underline text-blue-600 max-w-[120px]">
                              {new URL(item.suggested_url).pathname}
                            </a>
                            <span className="text-muted-foreground shrink-0">
                              {(item.suggestion_confidence * 100).toFixed(0)}%
                            </span>
                          </div>
                        ) : (
                          <div className="flex items-center gap-1.5">
                            <span className="text-muted-foreground">No fix found</span>
                            {item.status === 'pending' && (
                              <Button
                                size="sm"
                                variant="ghost"
                                className="text-[10px] h-6 px-2 gap-1"
                                disabled={deepSearching[item.id]}
                                onClick={() => handleDeepSearch(item)}
                              >
                                {deepSearching[item.id] ? (
                                  <Loader2 className="w-3 h-3 animate-spin" />
                                ) : (
                                  <><Search className="w-3 h-3" /> Deep Search</>
                                )}
                              </Button>
                            )}
                          </div>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-7 w-7"
                            onClick={() => window.open(item.original_url, '_blank')}
                            title="Open original URL"
                          >
                            <ExternalLink className="h-3.5 w-3.5" />
                          </Button>
                          {item.status === 'pending' && item.suggested_url && (
                            <Button
                              size="icon"
                              variant="ghost"
                              className="h-7 w-7 text-green-600"
                              onClick={() => updateStatusMutation.mutate({ ids: [item.id], status: 'approved' })}
                              title="Approve fix"
                            >
                              <CheckCircle2 className="h-3.5 w-3.5" />
                            </Button>
                          )}
                          {item.status === 'pending' && (
                            <Button
                              size="icon"
                              variant="ghost"
                              className="h-7 w-7 text-red-500"
                              onClick={() => updateStatusMutation.mutate({ ids: [item.id], status: 'ignored' })}
                              title="Ignore"
                            >
                              <XCircle className="h-3.5 w-3.5" />
                            </Button>
                          )}
                        </div>
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
