import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { 
  Loader2, CheckCircle2, XCircle, AlertTriangle, 
  ExternalLink, Download, ChevronDown, ChevronUp,
  Palette, RefreshCw, FileWarning, Package, AlertCircle
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface AuditResult {
  productLineId: string;
  vendor: string;
  material: string | null;
  sampleProduct: {
    title: string;
    url: string | null;
  };
  databaseCount: number;
  uiDisplayCount: number;
  websiteCount: number | null;
  status: 'match' | 'mismatch' | 'data_quality_issue' | 'website_error' | 'no_url' | 'bundle_skipped';
  discrepancy: number | null;
  hexDuplicates: string[];
  errorMessage: string | null;
  scrapedAt: string;
}

interface AuditReport {
  generatedAt: string;
  vendor: string | null;
  totalProductLines: number;
  auditResults: AuditResult[];
  summary: {
    matches: number;
    mismatches: number;
    dataQualityIssues: number;
    websiteErrors: number;
    noUrl: number;
    bundlesSkipped: number;
    mismatchRate: string;
  };
}

type FilterType = 'all' | 'match' | 'mismatch' | 'data_quality_issue' | 'website_error' | 'no_url' | 'bundle_skipped';

export function ColorVariantAuditPanel() {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [isFixing, setIsFixing] = useState(false);
  const [report, setReport] = useState<AuditReport | null>(null);
  const [selectedVendor, setSelectedVendor] = useState<string>('all');
  const [skipScrape, setSkipScrape] = useState(false);
  const [saveResults, setSaveResults] = useState(true);
  const [filter, setFilter] = useState<FilterType>('all');
  const [isDetailsOpen, setIsDetailsOpen] = useState(true);
  const [vendors, setVendors] = useState<string[]>([]);
  const [limit, setLimit] = useState<number>(0);

  // Fix all color issues for a vendor
  const fixAllColorIssues = async (vendor: string) => {
    setIsFixing(true);
    try {
      const { data, error } = await supabase.functions.invoke('fix-color-issues', {
        body: { vendor },
      });

      if (error) throw error;
      
      toast({
        title: "Colors Fixed",
        description: `Fixed ${data.nullsFixed || 0} NULL hex codes and ${data.duplicatesFixed || 0} duplicates for ${vendor}`,
      });
      
      // Re-run audit after fix
      if (report) {
        await runAudit();
      }
    } catch (err) {
      console.error('Fix failed:', err);
      toast({
        title: "Fix Failed",
        description: err instanceof Error ? err.message : 'Unknown error',
        variant: "destructive",
      });
    } finally {
      setIsFixing(false);
    }
  };

  // Fetch unique vendors on mount
  useEffect(() => {
    async function fetchVendors() {
      const { data, error } = await supabase
        .from('filaments')
        .select('vendor')
        .not('vendor', 'is', null)
        .not('product_line_id', 'is', null);
      
      if (!error && data) {
        const uniqueVendors = [...new Set(data.map(f => f.vendor).filter(Boolean))] as string[];
        uniqueVendors.sort();
        setVendors(uniqueVendors);
      }
    }
    fetchVendors();
  }, []);

  const runAudit = async () => {
    setIsLoading(true);
    setReport(null);

    try {
      const { data, error } = await supabase.functions.invoke('audit-color-variants', {
        body: {
          vendor: selectedVendor === 'all' ? null : selectedVendor,
          limit: limit > 0 ? limit : null,
          skipScrape,
          saveResults,
        },
      });

      if (error) throw error;
      
      if (data.success && data.report) {
        setReport(data.report);
        toast({
          title: "Audit Complete",
          description: `Audited ${data.report.totalProductLines} product lines`,
        });
      } else {
        throw new Error(data.error || 'Unknown error');
      }
    } catch (err) {
      console.error('Audit failed:', err);
      toast({
        title: "Audit Failed",
        description: err instanceof Error ? err.message : 'Unknown error',
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'match':
        return <CheckCircle2 className="w-4 h-4 text-green-500" />;
      case 'mismatch':
        return <XCircle className="w-4 h-4 text-red-500" />;
      case 'data_quality_issue':
        return <AlertCircle className="w-4 h-4 text-purple-500" />;
      case 'website_error':
        return <AlertTriangle className="w-4 h-4 text-yellow-500" />;
      case 'bundle_skipped':
        return <Package className="w-4 h-4 text-blue-500" />;
      default:
        return <FileWarning className="w-4 h-4 text-muted-foreground" />;
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, 'default' | 'destructive' | 'secondary' | 'outline'> = {
      match: 'default',
      mismatch: 'destructive',
      data_quality_issue: 'secondary',
      website_error: 'secondary',
      no_url: 'outline',
      bundle_skipped: 'outline',
    };
    const labels: Record<string, string> = {
      match: 'Match',
      mismatch: 'Mismatch',
      data_quality_issue: 'Data Issue',
      website_error: 'Error',
      no_url: 'No URL',
      bundle_skipped: 'Bundle',
    };
    return (
      <Badge variant={variants[status] || 'outline'} className={status === 'data_quality_issue' ? 'bg-purple-500/20 text-purple-400 border-purple-500/50' : ''}>
        {labels[status] || status}
      </Badge>
    );
  };

  const filteredResults = report?.auditResults.filter(r => {
    if (filter === 'all') return true;
    return r.status === filter;
  }) || [];

  const downloadReport = () => {
    if (!report) return;
    const dataStr = JSON.stringify(report, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `color-audit-${report.vendor || 'all'}-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const downloadCSV = () => {
    if (!report) return;
    const headers = ['Product Line ID', 'Vendor', 'Material', 'Sample Title', 'DB Count', 'UI Display', 'Website Count', 'Discrepancy', 'Status', 'Hex Duplicates', 'Error'];
    const rows = report.auditResults.map(r => [
      r.productLineId,
      r.vendor,
      r.material || '',
      r.sampleProduct.title,
      r.databaseCount,
      r.uiDisplayCount,
      r.websiteCount ?? '',
      r.discrepancy ?? '',
      r.status,
      r.hexDuplicates?.join('; ') || '',
      r.errorMessage || '',
    ]);
    const csv = [headers.join(','), ...rows.map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `color-audit-${report.vendor || 'all'}-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const matchRate = report ? (report.summary.matches / (report.summary.matches + report.summary.mismatches + report.summary.dataQualityIssues || 1) * 100) : 0;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Palette className="w-5 h-5" />
          <CardTitle>Color Variant Audit</CardTitle>
        </div>
        <CardDescription>
          Compare UI display counts (after deduplication) against website color counts to identify sync discrepancies
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Controls */}
        <div className="flex flex-wrap gap-4 items-end">
          <div className="space-y-2">
            <Label>Brand</Label>
            <Select value={selectedVendor} onValueChange={setSelectedVendor}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Select brand" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Brands</SelectItem>
                {vendors.map(v => (
                  <SelectItem key={v} value={v}>{v}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Limit</Label>
            <Select value={String(limit)} onValueChange={(v) => setLimit(Number(v))}>
              <SelectTrigger className="w-[120px]">
                <SelectValue placeholder="No limit" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="0">No limit</SelectItem>
                <SelectItem value="5">5 products</SelectItem>
                <SelectItem value="10">10 products</SelectItem>
                <SelectItem value="25">25 products</SelectItem>
                <SelectItem value="50">50 products</SelectItem>
                <SelectItem value="100">100 products</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center space-x-2">
            <Switch
              id="skip-scrape"
              checked={skipScrape}
              onCheckedChange={setSkipScrape}
            />
            <Label htmlFor="skip-scrape" className="text-sm">Skip website scrape (DB only)</Label>
          </div>

          <div className="flex items-center space-x-2">
            <Switch
              id="save-results"
              checked={saveResults}
              onCheckedChange={setSaveResults}
            />
            <Label htmlFor="save-results" className="text-sm">Save results to history</Label>
          </div>

          <Button onClick={runAudit} disabled={isLoading || isFixing}>
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Auditing...
              </>
            ) : (
              <>
                <RefreshCw className="w-4 h-4 mr-2" />
                Run Audit
              </>
            )}
          </Button>

          {selectedVendor !== 'all' && (
            <Button 
              onClick={() => fixAllColorIssues(selectedVendor)} 
              disabled={isLoading || isFixing}
              variant="outline"
              className="border-orange-500/50 text-orange-500 hover:bg-orange-500/10"
            >
              {isFixing ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Fixing...
                </>
              ) : (
                <>
                  <Palette className="w-4 h-4 mr-2" />
                  Fix All Colors
                </>
              )}
            </Button>
          )}
        </div>

        {/* Summary Stats */}
        {report && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-7 gap-4">
              <Card className="p-4">
                <div className="text-2xl font-bold">{report.totalProductLines}</div>
                <div className="text-sm text-muted-foreground">Product Lines</div>
              </Card>
              <Card className="p-4 border-green-500/50">
                <div className="text-2xl font-bold text-green-600">{report.summary.matches}</div>
                <div className="text-sm text-muted-foreground">Matches</div>
              </Card>
              <Card className="p-4 border-red-500/50">
                <div className="text-2xl font-bold text-red-600">{report.summary.mismatches}</div>
                <div className="text-sm text-muted-foreground">Mismatches</div>
              </Card>
              <Card className="p-4 border-purple-500/50">
                <div className="text-2xl font-bold text-purple-600">{report.summary.dataQualityIssues}</div>
                <div className="text-sm text-muted-foreground">Data Issues</div>
              </Card>
              <Card className="p-4 border-yellow-500/50">
                <div className="text-2xl font-bold text-yellow-600">{report.summary.websiteErrors}</div>
                <div className="text-sm text-muted-foreground">Errors</div>
              </Card>
              <Card className="p-4 border-blue-500/50">
                <div className="text-2xl font-bold text-blue-600">{report.summary.bundlesSkipped}</div>
                <div className="text-sm text-muted-foreground">Bundles</div>
              </Card>
              <Card className="p-4">
                <div className="text-2xl font-bold">{report.summary.noUrl}</div>
                <div className="text-sm text-muted-foreground">No URL</div>
              </Card>
            </div>

            {/* Match Rate Progress */}
            {(report.summary.matches + report.summary.mismatches + report.summary.dataQualityIssues) > 0 && (
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Match Rate (excludes data quality issues)</span>
                  <span className={matchRate >= 90 ? 'text-green-600' : matchRate >= 70 ? 'text-yellow-600' : 'text-red-600'}>
                    {matchRate.toFixed(1)}%
                  </span>
                </div>
                <Progress value={matchRate} className="h-2" />
              </div>
            )}

            {/* Filter and Export Controls */}
            <div className="flex flex-wrap gap-2 justify-between items-center">
              <div className="flex flex-wrap gap-2">
                <Button
                  variant={filter === 'all' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setFilter('all')}
                >
                  All ({report.totalProductLines})
                </Button>
                <Button
                  variant={filter === 'match' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setFilter('match')}
                >
                  Matches ({report.summary.matches})
                </Button>
                <Button
                  variant={filter === 'mismatch' ? 'destructive' : 'outline'}
                  size="sm"
                  onClick={() => setFilter('mismatch')}
                >
                  Mismatches ({report.summary.mismatches})
                </Button>
                <Button
                  variant={filter === 'data_quality_issue' ? 'secondary' : 'outline'}
                  size="sm"
                  onClick={() => setFilter('data_quality_issue')}
                  className={filter === 'data_quality_issue' ? 'bg-purple-500/20 text-purple-400' : ''}
                >
                  Data Issues ({report.summary.dataQualityIssues})
                </Button>
                <Button
                  variant={filter === 'website_error' ? 'secondary' : 'outline'}
                  size="sm"
                  onClick={() => setFilter('website_error')}
                >
                  Errors ({report.summary.websiteErrors})
                </Button>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={downloadCSV}>
                  <Download className="w-4 h-4 mr-2" />
                  CSV
                </Button>
                <Button variant="outline" size="sm" onClick={downloadReport}>
                  <Download className="w-4 h-4 mr-2" />
                  JSON
                </Button>
              </div>
            </div>

            {/* Results Table */}
            <Collapsible open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
              <CollapsibleTrigger asChild>
                <Button variant="ghost" className="w-full flex justify-between">
                  <span>Detailed Results ({filteredResults.length})</span>
                  {isDetailsOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </Button>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <div className="max-h-[500px] overflow-auto rounded-md border mt-2">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Status</TableHead>
                        <TableHead>Product Line</TableHead>
                        <TableHead>Vendor</TableHead>
                        <TableHead>Material</TableHead>
                        <TableHead className="text-center">DB</TableHead>
                        <TableHead className="text-center">UI</TableHead>
                        <TableHead className="text-center">Web</TableHead>
                        <TableHead className="text-center">Diff</TableHead>
                        <TableHead>Hex Issues</TableHead>
                        <TableHead></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredResults.map((result, idx) => (
                        <TableRow 
                          key={`${result.productLineId}-${idx}`}
                          className={
                            result.status === 'mismatch' ? 'bg-red-500/5' :
                            result.status === 'match' ? 'bg-green-500/5' :
                            result.status === 'data_quality_issue' ? 'bg-purple-500/5' :
                            result.status === 'website_error' ? 'bg-yellow-500/5' :
                            ''
                          }
                        >
                          <TableCell>
                            <div className="flex items-center gap-2">
                              {getStatusIcon(result.status)}
                              {getStatusBadge(result.status)}
                            </div>
                          </TableCell>
                          <TableCell className="font-mono text-xs max-w-[200px] truncate" title={result.productLineId}>
                            {result.productLineId}
                          </TableCell>
                          <TableCell>{result.vendor}</TableCell>
                          <TableCell>{result.material || '-'}</TableCell>
                          <TableCell className="text-center font-bold">{result.databaseCount}</TableCell>
                          <TableCell className="text-center font-bold">
                            <span className={result.databaseCount !== result.uiDisplayCount ? 'text-purple-500' : ''}>
                              {result.uiDisplayCount}
                            </span>
                          </TableCell>
                          <TableCell className="text-center">
                            {result.websiteCount !== null ? result.websiteCount : '-'}
                          </TableCell>
                          <TableCell className="text-center">
                            {result.discrepancy !== null ? (
                              <span className={result.discrepancy > 0 ? 'text-red-500' : result.discrepancy < 0 ? 'text-orange-500' : 'text-green-500'}>
                                {result.discrepancy > 0 ? '+' : ''}{result.discrepancy}
                              </span>
                            ) : '-'}
                          </TableCell>
                          <TableCell className="text-xs text-muted-foreground max-w-[200px] truncate" title={result.hexDuplicates?.join('\n') || ''}>
                            {result.hexDuplicates?.length > 0 ? (
                              <span className="text-purple-400">{result.hexDuplicates.length} dupes</span>
                            ) : '-'}
                          </TableCell>
                          <TableCell>
                            {result.sampleProduct.url && (
                              <a
                                href={result.sampleProduct.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center text-primary hover:underline"
                              >
                                <ExternalLink className="w-3 h-3" />
                              </a>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                      {filteredResults.length === 0 && (
                        <TableRow>
                          <TableCell colSpan={10} className="text-center text-muted-foreground py-8">
                            No results found for selected filter
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
              </CollapsibleContent>
            </Collapsible>
          </div>
        )}

        {/* Initial State */}
        {!report && !isLoading && (
          <div className="text-center py-12 text-muted-foreground">
            <Palette className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>Select a brand and run an audit to compare color variant counts</p>
            <p className="text-sm mt-2">
              This tool compares: <strong>DB Count</strong> (raw variants) → <strong>UI Display</strong> (after deduplication) → <strong>Website Count</strong> (scraped)
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
