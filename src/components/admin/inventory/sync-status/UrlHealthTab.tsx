import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { 
  CheckCircle, XCircle, AlertTriangle, HelpCircle, RefreshCw, Search, 
  ExternalLink, Loader2, ShieldAlert, ArrowRight
} from 'lucide-react';
import { toast } from 'sonner';
import { formatDistanceToNow } from 'date-fns';
import { validateStoreUrl, validateStoreUrls } from '@/services/urlValidationService';

type StatusFilter = 'all' | 'valid' | 'invalid' | 'redirect' | 'unknown' | 'unchecked';

interface UrlRecord {
  url: string;
  status: string;
  status_code: number | null;
  redirect_url: string | null;
  last_checked: string;
  check_count: number;
  consecutive_failures: number;
}

const statusConfig: Record<string, { icon: React.ReactNode; color: string; label: string }> = {
  valid: { icon: <CheckCircle className="h-4 w-4" />, color: 'text-emerald-400', label: 'Valid' },
  invalid: { icon: <XCircle className="h-4 w-4" />, color: 'text-red-400', label: 'Broken' },
  redirect: { icon: <ArrowRight className="h-4 w-4" />, color: 'text-amber-400', label: 'Redirect' },
  unknown: { icon: <HelpCircle className="h-4 w-4" />, color: 'text-muted-foreground', label: 'Unknown' },
};

export function UrlHealthTab() {
  const queryClient = useQueryClient();
  const [filter, setFilter] = useState<StatusFilter>('all');
  const [search, setSearch] = useState('');
  const [validatingAll, setValidatingAll] = useState(false);
  const [validatingBroken, setValidatingBroken] = useState(false);

  // Fetch cached validation results
  const { data: cachedUrls = [], isLoading } = useQuery({
    queryKey: ['url-validation-cache', filter],
    queryFn: async () => {
      let query = supabase
        .from('url_validation_cache')
        .select('*')
        .order('last_checked', { ascending: false })
        .limit(500);
      
      if (filter !== 'all' && filter !== 'unchecked') {
        query = query.eq('status', filter);
      }
      
      const { data, error } = await query;
      if (error) throw error;
      return (data || []) as UrlRecord[];
    }
  });

  // Fetch total product URLs not yet validated
  const { data: uncheckedStats } = useQuery({
    queryKey: ['url-unchecked-stats'],
    queryFn: async () => {
      const { data: allUrls } = await supabase
        .from('filaments')
        .select('product_url')
        .not('product_url', 'is', null);
      
      const { data: cachedAll } = await supabase
        .from('url_validation_cache')
        .select('url');
      
      const cachedSet = new Set((cachedAll || []).map(c => c.url));
      const unchecked = (allUrls || []).filter(f => !cachedSet.has(f.product_url));
      return { uncheckedCount: unchecked.length, totalUrls: allUrls?.length || 0 };
    }
  });

  // Validate a single URL
  const validateSingle = useMutation({
    mutationFn: async (url: string) => {
      return validateStoreUrl(url, true);
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ['url-validation-cache'] });
      queryClient.invalidateQueries({ queryKey: ['url-unchecked-stats'] });
      toast.success(`${result.url}: ${result.status} (${result.statusCode})`);
    },
    onError: (err) => toast.error('Validation failed: ' + String(err)),
  });

  // Validate all broken URLs
  const handleValidateBroken = async () => {
    setValidatingBroken(true);
    try {
      const broken = cachedUrls.filter(u => u.status === 'invalid' || u.status === 'unknown');
      const urls = broken.map(u => u.url);
      if (urls.length === 0) {
        toast.info('No broken URLs to revalidate');
        return;
      }
      await validateStoreUrls(urls);
      queryClient.invalidateQueries({ queryKey: ['url-validation-cache'] });
      toast.success(`Revalidated ${urls.length} URLs`);
    } catch (err) {
      toast.error('Batch validation failed');
    } finally {
      setValidatingBroken(false);
    }
  };

  // Validate ALL unchecked product URLs
  const handleValidateAll = async () => {
    setValidatingAll(true);
    try {
      const { data: allUrls } = await supabase
        .from('filaments')
        .select('product_url')
        .not('product_url', 'is', null);
      
      const { data: cachedAll } = await supabase
        .from('url_validation_cache')
        .select('url');
      
      const cachedSet = new Set((cachedAll || []).map(c => c.url));
      const unchecked = (allUrls || [])
        .map(f => f.product_url)
        .filter((url): url is string => !!url && !cachedSet.has(url));
      
      // Deduplicate
      const uniqueUrls = [...new Set(unchecked)];
      
      if (uniqueUrls.length === 0) {
        toast.info('All URLs already validated');
        return;
      }

      // Process in chunks of 10
      for (let i = 0; i < uniqueUrls.length; i += 10) {
        const batch = uniqueUrls.slice(i, i + 10);
        await validateStoreUrls(batch);
        toast.info(`Validated ${Math.min(i + 10, uniqueUrls.length)} / ${uniqueUrls.length}`);
      }
      
      queryClient.invalidateQueries({ queryKey: ['url-validation-cache'] });
      queryClient.invalidateQueries({ queryKey: ['url-unchecked-stats'] });
      toast.success(`Validated ${uniqueUrls.length} URLs`);
    } catch (err) {
      toast.error('Full validation failed');
    } finally {
      setValidatingAll(false);
    }
  };

  // Filter by search
  const filteredUrls = cachedUrls.filter(u => 
    !search || u.url.toLowerCase().includes(search.toLowerCase())
  );

  // Summary stats
  const stats = {
    valid: cachedUrls.filter(u => u.status === 'valid').length,
    invalid: cachedUrls.filter(u => u.status === 'invalid').length,
    redirect: cachedUrls.filter(u => u.status === 'redirect').length,
    unknown: cachedUrls.filter(u => u.status === 'unknown').length,
    unchecked: uncheckedStats?.uncheckedCount || 0,
  };

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <SummaryCard label="Valid" count={stats.valid} color="text-emerald-400" icon={<CheckCircle className="h-5 w-5" />} onClick={() => setFilter('valid')} active={filter === 'valid'} />
        <SummaryCard label="Broken" count={stats.invalid} color="text-red-400" icon={<XCircle className="h-5 w-5" />} onClick={() => setFilter('invalid')} active={filter === 'invalid'} />
        <SummaryCard label="Redirects" count={stats.redirect} color="text-amber-400" icon={<ArrowRight className="h-5 w-5" />} onClick={() => setFilter('redirect')} active={filter === 'redirect'} />
        <SummaryCard label="Unknown" count={stats.unknown} color="text-muted-foreground" icon={<HelpCircle className="h-5 w-5" />} onClick={() => setFilter('unknown')} active={filter === 'unknown'} />
        <SummaryCard label="Unchecked" count={stats.unchecked} color="text-blue-400" icon={<ShieldAlert className="h-5 w-5" />} onClick={() => setFilter('all')} active={filter === 'unchecked'} />
      </div>

      {/* Actions */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div>
              <CardTitle className="text-lg">URL Health Monitor</CardTitle>
              <CardDescription>
                {uncheckedStats?.totalUrls || 0} total product URLs tracked
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <Button 
                variant="outline" size="sm" 
                onClick={handleValidateBroken}
                disabled={validatingBroken || stats.invalid === 0}
              >
                {validatingBroken ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <RefreshCw className="h-4 w-4 mr-1" />}
                Revalidate Broken ({stats.invalid})
              </Button>
              <Button 
                size="sm"
                onClick={handleValidateAll}
                disabled={validatingAll}
              >
                {validatingAll ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <RefreshCw className="h-4 w-4 mr-1" />}
                Validate All Unchecked ({stats.unchecked})
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* Search & Filter */}
          <div className="flex gap-3 mb-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input 
                placeholder="Search URLs..." 
                value={search} 
                onChange={e => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={filter} onValueChange={(v) => setFilter(v as StatusFilter)}>
              <SelectTrigger className="w-[160px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="valid">Valid</SelectItem>
                <SelectItem value="invalid">Broken</SelectItem>
                <SelectItem value="redirect">Redirects</SelectItem>
                <SelectItem value="unknown">Unknown</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Table */}
          {isLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : filteredUrls.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              {filter === 'all' ? 'No validated URLs yet. Click "Validate All" to start.' : `No ${filter} URLs found.`}
            </div>
          ) : (
            <div className="rounded-md border border-border/30 overflow-auto max-h-[600px]">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[50px]">Status</TableHead>
                    <TableHead>URL</TableHead>
                    <TableHead className="w-[80px]">HTTP</TableHead>
                    <TableHead className="w-[140px]">Last Checked</TableHead>
                    <TableHead className="w-[80px]">Fails</TableHead>
                    <TableHead className="w-[100px]">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredUrls.map((urlRecord) => {
                    const cfg = statusConfig[urlRecord.status] || statusConfig.unknown;
                    return (
                      <TableRow key={urlRecord.url}>
                        <TableCell>
                          <span className={cfg.color} title={cfg.label}>{cfg.icon}</span>
                        </TableCell>
                        <TableCell className="max-w-[400px]">
                          <div className="truncate text-sm font-mono">{urlRecord.url}</div>
                          {urlRecord.status === 'redirect' && urlRecord.redirect_url && (
                            <div className="text-xs text-amber-400/70 truncate mt-0.5">
                              → {urlRecord.redirect_url}
                            </div>
                          )}
                        </TableCell>
                        <TableCell>
                          <Badge variant={urlRecord.status_code === 200 ? 'default' : 'destructive'} className="text-xs">
                            {urlRecord.status_code || '—'}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground">
                          {urlRecord.last_checked 
                            ? formatDistanceToNow(new Date(urlRecord.last_checked), { addSuffix: true })
                            : 'Never'}
                        </TableCell>
                        <TableCell>
                          {urlRecord.consecutive_failures > 0 && (
                            <Badge variant="destructive" className="text-xs">
                              {urlRecord.consecutive_failures}×
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-1">
                            <Button 
                              variant="ghost" size="icon" className="h-7 w-7"
                              onClick={() => validateSingle.mutate(urlRecord.url)}
                              disabled={validateSingle.isPending}
                              title="Recheck"
                            >
                              <RefreshCw className="h-3.5 w-3.5" />
                            </Button>
                            <Button 
                              variant="ghost" size="icon" className="h-7 w-7"
                              onClick={() => window.open(urlRecord.url, '_blank')}
                              title="Open URL"
                            >
                              <ExternalLink className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function SummaryCard({ label, count, color, icon, onClick, active }: {
  label: string; count: number; color: string; icon: React.ReactNode; onClick: () => void; active: boolean;
}) {
  return (
    <Card 
      className={`cursor-pointer transition-all hover:border-primary/30 ${active ? 'border-primary/50 bg-primary/5' : ''}`}
      onClick={onClick}
    >
      <CardContent className="p-3 flex items-center gap-3">
        <span className={color}>{icon}</span>
        <div>
          <p className="text-2xl font-bold">{count}</p>
          <p className="text-xs text-muted-foreground">{label}</p>
        </div>
      </CardContent>
    </Card>
  );
}
