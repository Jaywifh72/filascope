import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Textarea } from "@/components/ui/textarea";
import { 
  CheckCircle2, 
  XCircle, 
  AlertTriangle, 
  Loader2, 
  ChevronDown,
  Download,
  ClipboardCheck,
  ExternalLink,
  Sparkles,
  Copy
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface CheckResult {
  checkName: string;
  status: 'pass' | 'fail' | 'warning';
  count: number;
  details?: string;
  products?: Array<{ id: string; title: string; issue: string; url?: string }>;
}

interface PostSyncCheckReport {
  generatedAt: string;
  brand: string;
  brandSlug: string;
  totalProducts: number;
  checks: CheckResult[];
  overallStatus: 'pass' | 'warning' | 'fail';
  scrapedProducts: number;
  scrapeErrors: string[];
  aiFixPrompt: string | null;
}

interface PostSyncCheckPanelProps {
  brandSlug: string;
  brandName: string;
  disabled?: boolean;
}

export function PostSyncCheckPanel({ brandSlug, brandName, disabled }: PostSyncCheckPanelProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [report, setReport] = useState<PostSyncCheckReport | null>(null);
  const [expandedChecks, setExpandedChecks] = useState<Set<string>>(new Set());
  const [isPromptExpanded, setIsPromptExpanded] = useState(false);

  const runCheck = async () => {
    setIsLoading(true);
    setReport(null);

    try {
      const { data, error } = await supabase.functions.invoke("run-post-sync-check", {
        body: { brandSlug, brandName, sampleSize: 5 },
      });

      if (error) throw error;

      if (data.success && data.report) {
        setReport(data.report);
        
        if (data.report.overallStatus === 'pass') {
          toast.success("All checks passed!");
        } else if (data.report.overallStatus === 'warning') {
          toast.warning("Some checks have warnings");
        } else {
          toast.error("Some checks failed");
        }
      } else {
        throw new Error(data.error || "Check failed");
      }
    } catch (error) {
      console.error("Post sync check error:", error);
      toast.error(`Check failed: ${error instanceof Error ? error.message : "Unknown error"}`);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleCheck = (checkName: string) => {
    setExpandedChecks((prev) => {
      const next = new Set(prev);
      if (next.has(checkName)) {
        next.delete(checkName);
      } else {
        next.add(checkName);
      }
      return next;
    });
  };

  const downloadReport = () => {
    if (!report) return;
    
    const blob = new Blob([JSON.stringify(report, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `post-sync-check-${brandSlug}-${new Date().toISOString().split("T")[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const copyPrompt = async () => {
    if (!report?.aiFixPrompt) return;
    
    try {
      await navigator.clipboard.writeText(report.aiFixPrompt);
      toast.success("AI fix prompt copied to clipboard");
    } catch (error) {
      toast.error("Failed to copy prompt");
    }
  };

  const getStatusIcon = (status: 'pass' | 'fail' | 'warning') => {
    switch (status) {
      case 'pass':
        return <CheckCircle2 className="w-4 h-4 text-green-500" />;
      case 'fail':
        return <XCircle className="w-4 h-4 text-destructive" />;
      case 'warning':
        return <AlertTriangle className="w-4 h-4 text-yellow-500" />;
    }
  };

  const getStatusBadge = (status: 'pass' | 'fail' | 'warning') => {
    switch (status) {
      case 'pass':
        return <Badge className="bg-green-600">Pass</Badge>;
      case 'fail':
        return <Badge variant="destructive">Fail</Badge>;
      case 'warning':
        return <Badge className="bg-yellow-600">Warning</Badge>;
    }
  };

  return (
    <div className="space-y-4 border border-border rounded-lg p-4 bg-muted/30">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <ClipboardCheck className="w-5 h-5 text-muted-foreground" />
          <span className="font-medium">Post Sync Quality Check</span>
        </div>
        <Button
          onClick={runCheck}
          disabled={disabled || isLoading}
          size="sm"
        >
          {isLoading ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Checking...
            </>
          ) : (
            "Run Check"
          )}
        </Button>
      </div>

      {report && (
        <div className="space-y-4">
          {/* Summary Header */}
          <div className="flex items-center justify-between bg-background rounded-lg p-3">
            <div className="flex items-center gap-4 text-sm">
              <div>
                <span className="text-muted-foreground">Brand:</span>{" "}
                <span className="font-medium">{report.brand}</span>
              </div>
              <div>
                <span className="text-muted-foreground">Products:</span>{" "}
                <span className="font-medium">{report.totalProducts}</span>
              </div>
              {report.scrapedProducts > 0 && (
                <div>
                  <span className="text-muted-foreground">Scraped:</span>{" "}
                  <span className="font-medium">{report.scrapedProducts}</span>
                </div>
              )}
            </div>
            <div className="flex items-center gap-2">
              {getStatusBadge(report.overallStatus)}
              <Button variant="ghost" size="sm" onClick={downloadReport}>
                <Download className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* Categorize all checks */}
          {(() => {
            // Database Quality Checks
            const databaseChecks = report.checks.filter(c =>
              ['Bulk', '2.85', '3.0mm', 'Sample', 'Gift', 'Non-Filament', 'Images', 'Cross-Material', 'Price Validity'].some(
                keyword => c.checkName.includes(keyword)
              )
            );

            // Data Consistency Checks
            const consistencyChecks = report.checks.filter(c =>
              ['Swatch', 'Distinguishability', 'Hex-Color', 'Product Line'].some(
                keyword => c.checkName.includes(keyword)
              ) && !c.checkName.includes('Title') && !c.checkName.includes('Color Count') && !c.checkName.includes('Color Names')
            );

            // Scrape Validation Checks
            const scrapeChecks = report.checks.filter(c =>
              ['Title Accuracy', 'Color Count', 'Color Names', 'Buy Now', 'H1 Title', 'DB matches'].some(
                keyword => c.checkName.includes(keyword)
              )
            );

            // UI Display Checks
            const uiChecks = report.checks.filter(c =>
              ['UI Display', 'Card Count', 'Card Title', 'Detail Page', 'Visual Hierarchy', 'Filament Card', 'Filament Detail'].some(
                keyword => c.checkName.includes(keyword)
              )
            );

            // Catch-all: checks not in any category above
            const categorizedIds = new Set([...databaseChecks, ...consistencyChecks, ...scrapeChecks, ...uiChecks].map(c => c.checkName));
            const otherChecks = report.checks.filter(c => !categorizedIds.has(c.checkName));

            return (
              <>
                {/* Database Quality Checks */}
                {databaseChecks.length > 0 && (
                  <div className="space-y-2">
                    <div className="text-sm font-medium text-muted-foreground">Database Quality</div>
                    {databaseChecks.map((check) => (
                      <CheckResultRow
                        key={check.checkName}
                        check={check}
                        expanded={expandedChecks.has(check.checkName)}
                        onToggle={() => toggleCheck(check.checkName)}
                        getStatusIcon={getStatusIcon}
                      />
                    ))}
                  </div>
                )}

                {/* Data Consistency Checks */}
                {consistencyChecks.length > 0 && (
                  <div className="space-y-2">
                    <div className="text-sm font-medium text-muted-foreground">Data Consistency</div>
                    {consistencyChecks.map((check) => (
                      <CheckResultRow
                        key={check.checkName}
                        check={check}
                        expanded={expandedChecks.has(check.checkName)}
                        onToggle={() => toggleCheck(check.checkName)}
                        getStatusIcon={getStatusIcon}
                      />
                    ))}
                  </div>
                )}

                {/* Scrape Validation Checks */}
                {scrapeChecks.length > 0 && (
                  <div className="space-y-2">
                    <div className="text-sm font-medium text-muted-foreground">
                      Scrape Validation {report.scrapedProducts > 0 && `(${report.scrapedProducts} sampled)`}
                    </div>
                    {scrapeChecks.map((check) => (
                      <CheckResultRow
                        key={check.checkName}
                        check={check}
                        expanded={expandedChecks.has(check.checkName)}
                        onToggle={() => toggleCheck(check.checkName)}
                        getStatusIcon={getStatusIcon}
                      />
                    ))}
                  </div>
                )}

                {/* UI Display Checks */}
                {uiChecks.length > 0 && (
                  <div className="space-y-2">
                    <div className="text-sm font-medium text-muted-foreground">UI Display Validation</div>
                    {uiChecks.map((check) => (
                      <CheckResultRow
                        key={check.checkName}
                        check={check}
                        expanded={expandedChecks.has(check.checkName)}
                        onToggle={() => toggleCheck(check.checkName)}
                        getStatusIcon={getStatusIcon}
                      />
                    ))}
                  </div>
                )}

                {/* Other Checks (catch-all) */}
                {otherChecks.length > 0 && (
                  <div className="space-y-2">
                    <div className="text-sm font-medium text-muted-foreground">Other Checks</div>
                    {otherChecks.map((check) => (
                      <CheckResultRow
                        key={check.checkName}
                        check={check}
                        expanded={expandedChecks.has(check.checkName)}
                        onToggle={() => toggleCheck(check.checkName)}
                        getStatusIcon={getStatusIcon}
                      />
                    ))}
                  </div>
                )}
              </>
            );
          })()}

          {/* Scrape Errors */}
          {report.scrapeErrors.length > 0 && (
            <div className="text-xs text-muted-foreground bg-destructive/10 rounded p-2">
              <div className="font-medium mb-1">Scrape Errors:</div>
              {report.scrapeErrors.slice(0, 3).map((err, i) => (
                <div key={i}>• {err}</div>
              ))}
              {report.scrapeErrors.length > 3 && (
                <div>...and {report.scrapeErrors.length - 3} more</div>
              )}
            </div>
          )}

          {/* AI Fix Prompt Section */}
          {report.aiFixPrompt && (
            <Collapsible 
              open={isPromptExpanded} 
              onOpenChange={setIsPromptExpanded}
              className="border border-purple-500/30 rounded-lg bg-purple-500/5"
            >
              <CollapsibleTrigger className="flex items-center justify-between w-full p-3 hover:bg-purple-500/10 rounded-lg transition-colors">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-purple-500" />
                  <span className="font-medium text-sm">AI Fix Prompt</span>
                  <Badge variant="secondary" className="text-xs bg-purple-500/20 text-purple-300">
                    Ready for Opus 4.5
                  </Badge>
                </div>
                <ChevronDown className={`w-4 h-4 transition-transform ${isPromptExpanded ? 'rotate-180' : ''}`} />
              </CollapsibleTrigger>
              <CollapsibleContent className="px-3 pb-3">
                <div className="space-y-3">
                  <p className="text-xs text-muted-foreground">
                    Copy this prompt and paste it into Lovable to automatically fix the sync issues:
                  </p>
                  <Textarea 
                    value={report.aiFixPrompt} 
                    readOnly 
                    className="min-h-[300px] font-mono text-xs bg-background"
                  />
                  <Button onClick={copyPrompt} size="sm" className="w-full">
                    <Copy className="w-4 h-4 mr-2" />
                    Copy Prompt to Clipboard
                  </Button>
                </div>
              </CollapsibleContent>
            </Collapsible>
          )}
        </div>
      )}
    </div>
  );
}

function CheckResultRow({ 
  check, 
  expanded, 
  onToggle,
  getStatusIcon 
}: { 
  check: CheckResult;
  expanded: boolean;
  onToggle: () => void;
  getStatusIcon: (status: 'pass' | 'fail' | 'warning') => React.ReactNode;
}) {
  const hasProducts = check.products && check.products.length > 0;
  
  // Detect if title issues are due to scraper blocking
  const isScraperBlocked = check.checkName.includes("Title") && 
    check.products?.some(p => 
      p.issue.toLowerCase().includes("shopping cart") ||
      p.issue.toLowerCase().includes("access denied") ||
      p.issue.toLowerCase().includes("captcha")
    );

  return (
    <div className="bg-background rounded-lg border border-border">
      <div 
        className={`flex items-center justify-between p-3 ${hasProducts ? 'cursor-pointer hover:bg-muted/50' : ''}`}
        onClick={hasProducts ? onToggle : undefined}
      >
        <div className="flex items-center gap-3">
          {getStatusIcon(check.status)}
          <span className="text-sm font-medium">{check.checkName}</span>
          {check.details && (
            <span className="text-xs text-muted-foreground">{check.details}</span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {check.status !== 'pass' && check.count > 0 && (
            <Badge variant="outline" className="text-xs">
              {check.count} {check.count === 1 ? 'issue' : 'issues'}
            </Badge>
          )}
          {hasProducts && (
            <ChevronDown className={`w-4 h-4 transition-transform ${expanded ? 'rotate-180' : ''}`} />
          )}
        </div>
      </div>
      
      {isScraperBlocked && (
        <div className="px-3 pb-2">
          <p className="text-xs text-yellow-500 flex items-center gap-1">
            <AlertTriangle className="h-3 w-3" />
            Website may be blocking the scraper (redirecting to Shopping Cart) - false positive
          </p>
        </div>
      )}

      {expanded && hasProducts && (
        <div className="border-t border-border p-3 space-y-2 max-h-48 overflow-y-auto">
          {check.products!.map((product, i) => (
            <div key={i} className="flex items-center justify-between text-xs bg-muted/50 rounded p-2">
              <div className="flex-1 min-w-0">
                <div className="font-medium truncate">{product.title}</div>
                <div className="text-destructive">{product.issue}</div>
              </div>
              {product.url && (
                <a 
                  href={product.url} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="ml-2 text-muted-foreground hover:text-foreground"
                  onClick={(e) => e.stopPropagation()}
                >
                  <ExternalLink className="w-3 h-3" />
                </a>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
