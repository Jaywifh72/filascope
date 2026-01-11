import { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { 
  ClipboardCheck, 
  Loader2, 
  RefreshCw, 
  ChevronDown, 
  ChevronRight,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  SkipForward,
  Filter,
  Download,
  TrendingUp,
  TrendingDown,
  Minus,
  History
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface TaskResult {
  task: string;
  status: 'pass' | 'fail' | 'warning' | 'skipped';
  value: string | null;
  message?: string;
}

interface FilamentDetail {
  id: string;
  productTitle: string;
  material: string;
  colorFamily: string | null;
  overallStatus: 'pass' | 'warning' | 'fail';
  taskResults: TaskResult[];
}

interface TaskSummary {
  taskName: string;
  passed: number;
  failed: number;
  warnings: number;
  skipped: number;
  total: number;
  passRate: string;
}

interface QualityReport {
  generatedAt: string;
  totalFilaments: number;
  taskSummary: TaskSummary[];
  filamentDetails: FilamentDetail[];
  overallStats: {
    passed: number;
    warnings: number;
    failed: number;
  };
}

interface Comparison {
  passedDiff: number;
  warningsDiff: number;
  failedDiff: number;
  totalDiff: number;
  taskChanges: {
    taskName: string;
    oldPassRate: number;
    newPassRate: number;
    diff: number;
  }[];
  previousDate: string;
}

type FilterType = 'all' | 'fail' | 'warning' | 'pass';

const STORAGE_KEY = 'sync-quality-check-previous-report';

function parsePassRate(passRate: string): number {
  return parseFloat(passRate.replace('%', '')) || 0;
}

export function SyncQualityCheckPanel() {
  const [isLoading, setIsLoading] = useState(false);
  const [report, setReport] = useState<QualityReport | null>(null);
  const [previousReport, setPreviousReport] = useState<QualityReport | null>(null);
  const [filter, setFilter] = useState<FilterType>('all');
  const [expandedFilaments, setExpandedFilaments] = useState<Set<string>>(new Set());
  const [showDetails, setShowDetails] = useState(false);

  // Load previous report from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        setPreviousReport(JSON.parse(stored));
      }
    } catch (e) {
      console.error('Failed to load previous report:', e);
    }
  }, []);

  // Calculate comparison between current and previous report
  const comparison = useMemo<Comparison | null>(() => {
    if (!report || !previousReport) return null;

    const taskChanges = report.taskSummary.map(task => {
      const prevTask = previousReport.taskSummary.find(t => t.taskName === task.taskName);
      const newRate = parsePassRate(task.passRate);
      const oldRate = prevTask ? parsePassRate(prevTask.passRate) : 0;
      return {
        taskName: task.taskName,
        oldPassRate: oldRate,
        newPassRate: newRate,
        diff: newRate - oldRate,
      };
    }).filter(t => t.diff !== 0);

    return {
      passedDiff: report.overallStats.passed - previousReport.overallStats.passed,
      warningsDiff: report.overallStats.warnings - previousReport.overallStats.warnings,
      failedDiff: report.overallStats.failed - previousReport.overallStats.failed,
      totalDiff: report.totalFilaments - previousReport.totalFilaments,
      taskChanges: taskChanges.sort((a, b) => b.diff - a.diff),
      previousDate: previousReport.generatedAt,
    };
  }, [report, previousReport]);

  const runQualityCheck = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('run-sync-quality-check');
      
      if (error) throw error;
      
      // Store current report as previous before updating
      if (report) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(report));
        setPreviousReport(report);
      }
      
      setReport(data);
      setShowDetails(true);
      toast.success(`Quality check complete: ${data.totalFilaments} filaments analyzed`);
    } catch (error) {
      console.error('Quality check error:', error);
      toast.error('Failed to run quality check');
    } finally {
      setIsLoading(false);
    }
  };

  const toggleFilament = (id: string) => {
    const newExpanded = new Set(expandedFilaments);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpandedFilaments(newExpanded);
  };

  const expandAll = () => {
    if (!report) return;
    const filtered = getFilteredFilaments();
    setExpandedFilaments(new Set(filtered.map(f => f.id)));
  };

  const collapseAll = () => {
    setExpandedFilaments(new Set());
  };

  const getFilteredFilaments = () => {
    if (!report) return [];
    if (filter === 'all') return report.filamentDetails;
    return report.filamentDetails.filter(f => f.overallStatus === filter);
  };

  const getStatusIcon = (status: 'pass' | 'fail' | 'warning' | 'skipped') => {
    switch (status) {
      case 'pass': return <CheckCircle2 className="h-4 w-4 text-green-500" />;
      case 'fail': return <XCircle className="h-4 w-4 text-destructive" />;
      case 'warning': return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      case 'skipped': return <SkipForward className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const getTaskStatusBadge = (task: TaskSummary) => {
    const applicable = task.total - task.skipped;
    if (applicable === 0) return 'secondary';
    const passPercent = (task.passed / applicable) * 100;
    if (passPercent >= 90) return 'default';
    if (passPercent >= 70) return 'secondary';
    return 'destructive';
  };

  const downloadReport = () => {
    if (!report) return;
    const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `quality-report-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const filteredFilaments = getFilteredFilaments();

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ClipboardCheck className="h-5 w-5 text-primary" />
            <CardTitle className="text-lg">Sync Quality Check</CardTitle>
          </div>
          <div className="flex items-center gap-2">
            {report && (
              <Button variant="outline" size="sm" onClick={downloadReport}>
                <Download className="h-4 w-4 mr-1" />
                Export
              </Button>
            )}
            <Button 
              onClick={runQualityCheck} 
              disabled={isLoading}
              size="sm"
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Analyzing...
                </>
              ) : (
                <>
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Run Quality Check
                </>
              )}
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {!report && !isLoading && (
          <div className="text-center py-8 text-muted-foreground">
            <ClipboardCheck className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p>Click "Run Quality Check" to analyze all Elegoo filaments</p>
            <p className="text-sm mt-1">This will check prices, URLs, images, colors, and TDS parsing</p>
          </div>
        )}

        {isLoading && (
          <div className="text-center py-8">
            <Loader2 className="h-10 w-10 mx-auto mb-3 animate-spin text-primary" />
            <p className="text-muted-foreground">Analyzing filaments...</p>
          </div>
        )}

        {report && (
          <>
            {/* Overall Stats */}
            <div className="flex items-center justify-between text-sm text-muted-foreground border-b pb-3">
              <span>Last run: {new Date(report.generatedAt).toLocaleString()}</span>
              <span>{report.totalFilaments} filaments checked</span>
            </div>

            {/* Comparison Section - Shows improvements since last check */}
            {comparison && (
              <div className="bg-muted/30 rounded-lg p-4 space-y-4 border">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-sm font-medium">
                    <History className="h-4 w-4 text-muted-foreground" />
                    <span>Changes since {new Date(comparison.previousDate).toLocaleDateString()}</span>
                  </div>
                  {(comparison.passedDiff > 0 || comparison.failedDiff < 0) && (
                    <Badge className="bg-green-500/20 text-green-700 border-green-500/30">
                      <TrendingUp className="h-3 w-3 mr-1" />
                      Improved
                    </Badge>
                  )}
                </div>
                
                {/* Overall stat changes */}
                <div className="grid grid-cols-4 gap-2 text-sm">
                  <ComparisonStat 
                    label="Total" 
                    value={comparison.totalDiff} 
                    suffix=" filaments"
                    invertColors={false}
                  />
                  <ComparisonStat 
                    label="Passed" 
                    value={comparison.passedDiff} 
                    isGoodWhenPositive={true}
                  />
                  <ComparisonStat 
                    label="Warnings" 
                    value={comparison.warningsDiff} 
                    isGoodWhenPositive={false}
                  />
                  <ComparisonStat 
                    label="Failed" 
                    value={comparison.failedDiff} 
                    isGoodWhenPositive={false}
                  />
                </div>

                {/* Improvements Section - Highlight what got better */}
                {comparison.taskChanges.filter(t => t.diff > 0).length > 0 && (
                  <div className="space-y-2 pt-2 border-t border-green-500/20">
                    <p className="text-xs font-medium text-green-700 flex items-center gap-1">
                      <TrendingUp className="h-3 w-3" />
                      Improvements
                    </p>
                    <div className="flex flex-wrap gap-1">
                      {comparison.taskChanges.filter(t => t.diff > 0).map(task => (
                        <Badge 
                          key={task.taskName}
                          className="text-xs bg-green-500/20 text-green-700 border-green-500/30"
                        >
                          <TrendingUp className="h-3 w-3 mr-1" />
                          {task.taskName}: +{task.diff.toFixed(0)}%
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {/* Regressions Section - Highlight what got worse */}
                {comparison.taskChanges.filter(t => t.diff < 0).length > 0 && (
                  <div className="space-y-2 pt-2 border-t border-destructive/20">
                    <p className="text-xs font-medium text-destructive flex items-center gap-1">
                      <TrendingDown className="h-3 w-3" />
                      Regressions
                    </p>
                    <div className="flex flex-wrap gap-1">
                      {comparison.taskChanges.filter(t => t.diff < 0).map(task => (
                        <Badge 
                          key={task.taskName}
                          variant="destructive"
                          className="text-xs bg-destructive/20"
                        >
                          <TrendingDown className="h-3 w-3 mr-1" />
                          {task.taskName}: {task.diff.toFixed(0)}%
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {comparison.taskChanges.length === 0 && comparison.passedDiff === 0 && comparison.failedDiff === 0 && (
                  <p className="text-xs text-muted-foreground flex items-center gap-1 pt-2">
                    <Minus className="h-3 w-3" />
                    No significant changes detected since last check
                  </p>
                )}
              </div>
            )}

            {/* Overall Progress */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="font-medium">Overall Status</span>
                <span className="text-muted-foreground">
                  {report.overallStats.passed} passed, {report.overallStats.warnings} warnings, {report.overallStats.failed} failed
                </span>
              </div>
              <div className="flex gap-1 h-3 rounded-full overflow-hidden bg-muted">
                <div 
                  className="bg-green-500 transition-all" 
                  style={{ width: `${(report.overallStats.passed / report.totalFilaments) * 100}%` }} 
                />
                <div 
                  className="bg-yellow-500 transition-all" 
                  style={{ width: `${(report.overallStats.warnings / report.totalFilaments) * 100}%` }} 
                />
                <div 
                  className="bg-destructive transition-all" 
                  style={{ width: `${(report.overallStats.failed / report.totalFilaments) * 100}%` }} 
                />
              </div>
            </div>

            {/* Task Summary */}
            <Collapsible defaultOpen>
              <CollapsibleTrigger className="flex items-center gap-2 font-medium text-sm w-full py-2 hover:bg-muted/50 rounded px-2 -mx-2">
                <ChevronDown className="h-4 w-4" />
                Task Summary
              </CollapsibleTrigger>
              <CollapsibleContent>
                <div className="grid grid-cols-2 gap-2 mt-2">
                  {report.taskSummary.map((task) => (
                    <div key={task.taskName} className="flex items-center justify-between p-2 bg-muted/30 rounded text-sm">
                      <span className="truncate">{task.taskName}</span>
                      <Badge variant={getTaskStatusBadge(task)} className="ml-2 shrink-0">
                        {task.passRate}
                      </Badge>
                    </div>
                  ))}
                </div>
              </CollapsibleContent>
            </Collapsible>

            {/* Detailed Log */}
            <Collapsible open={showDetails} onOpenChange={setShowDetails}>
              <CollapsibleTrigger className="flex items-center gap-2 font-medium text-sm w-full py-2 hover:bg-muted/50 rounded px-2 -mx-2">
                {showDetails ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                Detailed Log ({filteredFilaments.length} filaments)
              </CollapsibleTrigger>
              <CollapsibleContent>
                {/* Filter Bar */}
                <div className="flex items-center gap-2 mt-2 mb-3">
                  <Filter className="h-4 w-4 text-muted-foreground" />
                  <div className="flex gap-1">
                    <Button
                      variant={filter === 'all' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setFilter('all')}
                    >
                      All ({report.totalFilaments})
                    </Button>
                    <Button
                      variant={filter === 'fail' ? 'destructive' : 'outline'}
                      size="sm"
                      onClick={() => setFilter('fail')}
                    >
                      Failed ({report.overallStats.failed})
                    </Button>
                    <Button
                      variant={filter === 'warning' ? 'secondary' : 'outline'}
                      size="sm"
                      onClick={() => setFilter('warning')}
                      className={filter === 'warning' ? 'bg-yellow-500/20 text-yellow-700 border-yellow-500/50' : ''}
                    >
                      Warnings ({report.overallStats.warnings})
                    </Button>
                    <Button
                      variant={filter === 'pass' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setFilter('pass')}
                      className={filter === 'pass' ? 'bg-green-500/20 text-green-700 border-green-500/50' : ''}
                    >
                      Passed ({report.overallStats.passed})
                    </Button>
                  </div>
                  <div className="ml-auto flex gap-1">
                    <Button variant="ghost" size="sm" onClick={expandAll}>Expand All</Button>
                    <Button variant="ghost" size="sm" onClick={collapseAll}>Collapse All</Button>
                  </div>
                </div>

                {/* Filament List */}
                <ScrollArea className="h-[400px] border rounded-md">
                  <div className="p-2 space-y-1">
                    {filteredFilaments.map((filament) => (
                      <Collapsible
                        key={filament.id}
                        open={expandedFilaments.has(filament.id)}
                        onOpenChange={() => toggleFilament(filament.id)}
                      >
                        <CollapsibleTrigger className="flex items-center gap-2 w-full p-2 hover:bg-muted/50 rounded text-left">
                          {expandedFilaments.has(filament.id) ? (
                            <ChevronDown className="h-4 w-4 shrink-0" />
                          ) : (
                            <ChevronRight className="h-4 w-4 shrink-0" />
                          )}
                          {getStatusIcon(filament.overallStatus)}
                          <span className="font-medium truncate flex-1">{filament.productTitle}</span>
                          <Badge variant="outline" className="shrink-0">{filament.material || 'Unknown'}</Badge>
                        </CollapsibleTrigger>
                        <CollapsibleContent>
                          <div className="ml-8 pl-2 border-l space-y-1 py-2">
                            {filament.taskResults.map((result, idx) => (
                              <div key={idx} className="flex items-start gap-2 text-sm">
                                {getStatusIcon(result.status)}
                                <span className="text-muted-foreground w-40 shrink-0">{result.task}:</span>
                                <span className={result.status === 'fail' ? 'text-destructive' : result.status === 'warning' ? 'text-yellow-600' : ''}>
                                  {result.value || result.message || '-'}
                                </span>
                              </div>
                            ))}
                          </div>
                        </CollapsibleContent>
                      </Collapsible>
                    ))}
                    {filteredFilaments.length === 0 && (
                      <div className="text-center py-8 text-muted-foreground">
                        No filaments match the selected filter
                      </div>
                    )}
                  </div>
                </ScrollArea>
              </CollapsibleContent>
            </Collapsible>
          </>
        )}
      </CardContent>
    </Card>
  );
}

// Helper component to show comparison stats with trend indicators
function ComparisonStat({ 
  label, 
  value, 
  suffix = '', 
  isGoodWhenPositive = true,
  invertColors = true 
}: { 
  label: string; 
  value: number; 
  suffix?: string;
  isGoodWhenPositive?: boolean;
  invertColors?: boolean;
}) {
  const isPositive = value > 0;
  const isNegative = value < 0;
  const isGood = invertColors ? (isGoodWhenPositive ? isPositive : isNegative) : false;
  const isBad = invertColors ? (isGoodWhenPositive ? isNegative : isPositive) : false;

  return (
    <div className="flex flex-col items-center p-2 bg-background rounded border">
      <span className="text-xs text-muted-foreground">{label}</span>
      <span className={`text-sm font-medium flex items-center gap-1 ${
        isGood ? 'text-green-600' : isBad ? 'text-destructive' : 'text-muted-foreground'
      }`}>
        {isPositive && <TrendingUp className="h-3 w-3" />}
        {isNegative && <TrendingDown className="h-3 w-3" />}
        {value === 0 && <Minus className="h-3 w-3" />}
        {value > 0 ? '+' : ''}{value}{suffix}
      </span>
    </div>
  );
}
