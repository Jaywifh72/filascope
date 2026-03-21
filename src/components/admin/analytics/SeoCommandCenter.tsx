import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import { Checkbox } from "@/components/ui/checkbox";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";
import {
  RefreshCw,
  TrendingUp,
  TrendingDown,
  MousePointerClick,
  Eye,
  Target,
  FileText,
  Zap,
  Bot,
  ExternalLink,
  Plus,
  ChevronUp,
  ChevronDown,
  Sparkles,
  Globe,
  Search,
  ClipboardCopy,
} from "lucide-react";
import { toast } from "sonner";
import {
  useGscKpis,
  useGscTopQueries,
  useTargetKeywords,
  usePositionDistribution,
  useCitationLog,
  useAdvisorActions,
  useAddCitation,
  useToggleAction,
  useGenerateReport,
  useSyncGsc,
} from "@/hooks/useSeoCommandCenter";

// ─── Helpers ────────────────────────────────────────────────────────────────

function positionColor(pos: number | null): string {
  if (pos == null) return "text-muted-foreground";
  if (pos <= 3) return "text-green-500";
  if (pos <= 10) return "text-yellow-500";
  if (pos <= 20) return "text-orange-500";
  return "text-destructive";
}

function fmtPos(v: number | null): string {
  if (v == null) return "--";
  return v.toFixed(1);
}

function fmtCtr(v: number | null): string {
  if (v == null) return "--";
  return `${(v * 100).toFixed(1)}%`;
}

function priorityBadge(priority: string) {
  switch (priority) {
    case "P0":
      return <Badge className="bg-destructive/20 text-destructive border-0 text-xs">P0</Badge>;
    case "P1":
      return <Badge className="bg-orange-500/20 text-orange-500 border-0 text-xs">P1</Badge>;
    case "P2":
      return <Badge className="bg-yellow-500/20 text-yellow-500 border-0 text-xs">P2</Badge>;
    default:
      return <Badge variant="secondary" className="text-xs">{priority}</Badge>;
  }
}

function statusBadge(status: string) {
  switch (status) {
    case "ranking":
      return <Badge className="bg-green-500/20 text-green-500 border-0 text-xs">Ranking</Badge>;
    case "needs-work":
      return <Badge className="bg-orange-500/20 text-orange-500 border-0 text-xs">Needs Work</Badge>;
    default:
      return <Badge variant="secondary" className="text-xs">Not Found</Badge>;
  }
}

function changeBadge(change: number, invert = false) {
  const positive = invert ? change < 0 : change > 0;
  if (change === 0) return null;
  return (
    <span
      className={`inline-flex items-center gap-0.5 text-xs font-medium ${
        positive ? "text-green-500" : "text-destructive"
      }`}
    >
      {positive ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
      {Math.abs(change)}%
    </span>
  );
}

// ─── Section 1: Indexing Health ─────────────────────────────────────────────

function IndexingHealthSection() {
  const { data: kpis, isLoading } = useGscKpis();
  const syncGsc = useSyncGsc();

  const handleSync = async () => {
    try {
      const result = await syncGsc.mutateAsync();
      if (result.synced > 0) {
        toast.success(`Synced ${result.synced} rows from ${result.date_range}`);
      } else {
        toast.info("Connected. No new data returned -- GSC data has a 2-3 day delay.");
      }
    } catch (e) {
      toast.error(`Sync failed: ${e instanceof Error ? e.message : String(e)}`);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-base flex items-center gap-2">
            <Globe className="w-5 h-5 text-primary" />
            Indexing Health
          </h3>
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-28 rounded-lg" />
          ))}
        </div>
      </div>
    );
  }

  if (!kpis || (kpis.totalClicks === 0 && kpis.totalImpressions === 0)) {
    return (
      <Card>
        <CardContent className="py-8 text-center">
          <p className="text-muted-foreground mb-4">No GSC data yet -- click Sync to fetch</p>
          <Button onClick={handleSync} disabled={syncGsc.isPending} className="gap-2">
            <RefreshCw className={`w-4 h-4 ${syncGsc.isPending ? "animate-spin" : ""}`} />
            {syncGsc.isPending ? "Syncing..." : "Sync GSC"}
          </Button>
        </CardContent>
      </Card>
    );
  }

  const indexedTotal = Math.max(kpis.indexedPages, 30); // estimate total crawlable pages
  const indexPct = Math.min(100, Math.round((kpis.indexedPages / indexedTotal) * 100));

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-base flex items-center gap-2">
          <Globe className="w-5 h-5 text-primary" />
          Indexing Health
        </h3>
        <Button
          variant="outline"
          size="sm"
          onClick={handleSync}
          disabled={syncGsc.isPending}
          className="gap-2"
        >
          <RefreshCw className={`w-4 h-4 ${syncGsc.isPending ? "animate-spin" : ""}`} />
          {syncGsc.isPending ? "Syncing..." : "Sync GSC"}
        </Button>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Pages Indexed */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-start justify-between">
              <div className="space-y-1 flex-1">
                <p className="text-sm text-muted-foreground">Pages Indexed</p>
                <p className="text-2xl font-bold">{kpis.indexedPages}</p>
                <Progress value={indexPct} className="h-1.5 mt-2" />
                <p className="text-xs text-muted-foreground">{indexPct}% of estimated total</p>
              </div>
              <FileText className="w-5 h-5 text-muted-foreground/60" />
            </div>
          </CardContent>
        </Card>

        {/* Avg Position */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-start justify-between">
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Avg Position</p>
                <div className="flex items-center gap-2">
                  <p className={`text-2xl font-bold ${positionColor(kpis.avgPosition)}`}>
                    {fmtPos(kpis.avgPosition)}
                  </p>
                  {kpis.positionChange !== 0 && (
                    <span
                      className={`inline-flex items-center gap-0.5 text-xs font-medium ${
                        kpis.positionChange > 0 ? "text-green-500" : "text-destructive"
                      }`}
                    >
                      {kpis.positionChange > 0 ? (
                        <TrendingUp className="w-3 h-3" />
                      ) : (
                        <TrendingDown className="w-3 h-3" />
                      )}
                      {Math.abs(kpis.positionChange).toFixed(1)}
                    </span>
                  )}
                </div>
              </div>
              <Target className="w-5 h-5 text-muted-foreground/60" />
            </div>
          </CardContent>
        </Card>

        {/* Impressions */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-start justify-between">
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Impressions (28d)</p>
                <div className="flex items-center gap-2">
                  <p className="text-2xl font-bold">{kpis.totalImpressions.toLocaleString()}</p>
                  {changeBadge(kpis.impressionsChange)}
                </div>
              </div>
              <Eye className="w-5 h-5 text-muted-foreground/60" />
            </div>
          </CardContent>
        </Card>

        {/* Clicks */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-start justify-between">
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Clicks (28d)</p>
                <div className="flex items-center gap-2">
                  <p className="text-2xl font-bold">{kpis.totalClicks.toLocaleString()}</p>
                  {changeBadge(kpis.clicksChange)}
                </div>
              </div>
              <MousePointerClick className="w-5 h-5 text-muted-foreground/60" />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

// ─── Section 2: Ranking Tracker ─────────────────────────────────────────────

function RankingTrackerSection() {
  const { data: targetKeywords, isLoading: kwLoading } = useTargetKeywords();
  const { data: posDist, isLoading: posLoading } = usePositionDistribution();
  const { data: topQueries, isLoading: queriesLoading } = useGscTopQueries("impressions", 50);

  const quickWins = (topQueries ?? []).filter((q) => q.quickWin).slice(0, 10);

  if (kwLoading && posLoading) {
    return (
      <div className="space-y-4">
        <h3 className="font-semibold text-base flex items-center gap-2">
          <Target className="w-5 h-5 text-primary" />
          Ranking Tracker
        </h3>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Skeleton className="h-72 rounded-lg" />
          <Skeleton className="h-72 rounded-lg" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h3 className="font-semibold text-base flex items-center gap-2">
        <Target className="w-5 h-5 text-primary" />
        Ranking Tracker
      </h3>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Target Keywords Table */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">Target Keywords</CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-2 pr-2 font-medium text-muted-foreground">Keyword</th>
                    <th className="text-left py-2 px-1 font-medium text-muted-foreground">Page</th>
                    <th className="text-right py-2 px-1 font-medium text-muted-foreground">Pos</th>
                    <th className="text-right py-2 px-1 font-medium text-muted-foreground">Impr</th>
                    <th className="text-right py-2 font-medium text-muted-foreground">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {(targetKeywords ?? []).map((kw, i) => (
                    <tr key={i} className="border-b border-border/50 hover:bg-muted/30 transition-colors">
                      <td className="py-2 pr-2 max-w-[140px] truncate font-medium" title={kw.keyword}>
                        {kw.keyword}
                      </td>
                      <td className="py-2 px-1 text-xs text-muted-foreground max-w-[100px] truncate" title={kw.targetPage}>
                        {kw.targetPage}
                      </td>
                      <td className={`py-2 text-right px-1 font-medium ${positionColor(kw.currentPosition)}`}>
                        {kw.currentPosition !== null ? fmtPos(kw.currentPosition) : "--"}
                      </td>
                      <td className="py-2 text-right px-1">
                        {kw.impressions > 0 ? kw.impressions.toLocaleString() : "--"}
                      </td>
                      <td className="py-2 text-right">{statusBadge(kw.status)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* Position Distribution Chart */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">Position Distribution</CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            {posLoading ? (
              <Skeleton className="h-48 w-full" />
            ) : !posDist || posDist.every((d) => d.count === 0) ? (
              <p className="text-sm text-muted-foreground text-center py-8">No position data</p>
            ) : (
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={posDist} barCategoryGap="20%">
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis
                    dataKey="label"
                    tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }}
                  />
                  <YAxis tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} />
                  <Tooltip
                    contentStyle={{
                      background: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: 6,
                    }}
                    formatter={(v: number) => [v, "Queries"]}
                  />
                  <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                    {(posDist ?? []).map((entry, idx) => (
                      <Cell key={idx} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Quick Wins */}
      {quickWins.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <Zap className="w-4 h-4 text-yellow-500" />
              <CardTitle className="text-sm">Quick Wins (Position 4-20, High Impressions)</CardTitle>
            </div>
            <p className="text-xs text-muted-foreground">
              These queries are close to page 1 with significant visibility -- optimize to capture more clicks
            </p>
          </CardHeader>
          <CardContent className="pt-0">
            {queriesLoading ? (
              <Skeleton className="h-32 w-full" />
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {quickWins.map((q, i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between gap-2 rounded-md border border-border/50 px-3 py-2 text-sm"
                  >
                    <span className="truncate text-foreground" title={q.query}>
                      {q.query}
                    </span>
                    <div className="flex items-center gap-3 shrink-0">
                      <span className="text-xs text-muted-foreground">
                        {q.impressions.toLocaleString()} impr
                      </span>
                      <span className={`font-medium ${positionColor(q.position)}`}>
                        #{fmtPos(q.position)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}

// ─── Section 3: AI Citation Tracker ─────────────────────────────────────────

function CitationTrackerSection() {
  const { data: citations, isLoading } = useCitationLog();
  const addCitation = useAddCitation();

  const [showForm, setShowForm] = useState(false);
  const [formEngine, setFormEngine] = useState("perplexity");
  const [formQuery, setFormQuery] = useState("");
  const [formCited, setFormCited] = useState(false);
  const [formNotes, setFormNotes] = useState("");

  const citedCount = (citations ?? []).filter((c) => c.cited).length;
  const totalChecked = (citations ?? []).length;

  const handleSubmit = async () => {
    if (!formQuery.trim()) {
      toast.error("Query is required");
      return;
    }
    try {
      await addCitation.mutateAsync({
        engine: formEngine,
        query: formQuery.trim(),
        cited: formCited,
        notes: formNotes.trim() || undefined,
      });
      toast.success("Citation logged");
      setFormQuery("");
      setFormNotes("");
      setFormCited(false);
      setShowForm(false);
    } catch (e) {
      toast.error(`Failed: ${e instanceof Error ? e.message : String(e)}`);
    }
  };

  const [autoChecking, setAutoChecking] = useState(false);

  const handleAutoCheck = async () => {
    setAutoChecking(true);
    try {
      const { data, error } = await (await import("@/integrations/supabase/client")).supabase
        .functions.invoke("citation-tracker", { body: {} });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      const { summary } = data;
      toast.success(
        `Checked ${summary.total_checks} queries: ${summary.cited} cited (${summary.citation_rate})`
      );
      // Refetch citations
      window.location.reload();
    } catch (e) {
      toast.error(`Auto-check failed: ${e instanceof Error ? e.message : String(e)}`);
    } finally {
      setAutoChecking(false);
    }
  };

  const checkNowLinks = [
    {
      label: "Perplexity",
      url: "https://www.perplexity.ai/search?q=best+PLA+filament+2026",
    },
    {
      label: "ChatGPT",
      url: "https://chatgpt.com/?q=best+PLA+filament+comparison",
    },
  ];

  return (
    <div className="space-y-4">
      <h3 className="font-semibold text-base flex items-center gap-2">
        <Bot className="w-5 h-5 text-primary" />
        AI Citation Tracker
      </h3>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Score Card */}
        <Card>
          <CardContent className="pt-6">
            <div className="text-center space-y-2">
              <p className="text-sm text-muted-foreground">Citation Score</p>
              <p className="text-3xl font-bold">
                {citedCount} <span className="text-lg text-muted-foreground">/ {totalChecked}</span>
              </p>
              <p className="text-xs text-muted-foreground">queries cite FilaScope</p>
              <Progress
                value={totalChecked > 0 ? (citedCount / totalChecked) * 100 : 0}
                className="h-2 mt-3"
              />
            </div>
            <div className="flex gap-2 mt-4 justify-center flex-wrap">
              <Button
                variant="default"
                size="sm"
                className="gap-1 text-xs"
                onClick={handleAutoCheck}
                disabled={autoChecking}
              >
                {autoChecking ? (
                  <RefreshCw className="w-3 h-3 animate-spin" />
                ) : (
                  <Bot className="w-3 h-3" />
                )}
                {autoChecking ? "Checking 18 queries..." : "Auto-Check All Engines"}
              </Button>
              {checkNowLinks.map((link) => (
                <a key={link.label} href={link.url} target="_blank" rel="noopener noreferrer">
                  <Button variant="outline" size="sm" className="gap-1 text-xs">
                    <Search className="w-3 h-3" />
                    {link.label}
                    <ExternalLink className="w-3 h-3" />
                  </Button>
                </a>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Citation Log */}
        <Card className="lg:col-span-2">
          <CardHeader className="pb-3 flex flex-row items-center justify-between">
            <CardTitle className="text-sm">Recent Citations</CardTitle>
            <Button variant="outline" size="sm" onClick={() => setShowForm(!showForm)} className="gap-1">
              <Plus className="w-3 h-3" />
              Add
            </Button>
          </CardHeader>
          <CardContent className="pt-0">
            {/* Add Form */}
            {showForm && (
              <div className="rounded-lg border border-border bg-muted/30 p-3 mb-4 space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-medium text-muted-foreground">Engine</label>
                    <select
                      value={formEngine}
                      onChange={(e) => setFormEngine(e.target.value)}
                      className="mt-1 w-full rounded-md border border-border bg-background px-3 py-1.5 text-sm"
                    >
                      <option value="perplexity">Perplexity</option>
                      <option value="chatgpt">ChatGPT</option>
                      <option value="gemini">Gemini</option>
                      <option value="google-aio">Google AI Overview</option>
                      <option value="copilot">Copilot</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-medium text-muted-foreground">Query</label>
                    <input
                      value={formQuery}
                      onChange={(e) => setFormQuery(e.target.value)}
                      placeholder="e.g. best PLA filament"
                      className="mt-1 w-full rounded-md border border-border bg-background px-3 py-1.5 text-sm"
                    />
                  </div>
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground">Notes</label>
                  <input
                    value={formNotes}
                    onChange={(e) => setFormNotes(e.target.value)}
                    placeholder="Optional notes"
                    className="mt-1 w-full rounded-md border border-border bg-background px-3 py-1.5 text-sm"
                  />
                </div>
                <div className="flex items-center justify-between">
                  <label className="flex items-center gap-2 text-sm">
                    <Checkbox checked={formCited} onCheckedChange={(v) => setFormCited(!!v)} />
                    FilaScope was cited
                  </label>
                  <Button size="sm" onClick={handleSubmit} disabled={addCitation.isPending}>
                    {addCitation.isPending ? "Saving..." : "Save"}
                  </Button>
                </div>
              </div>
            )}

            {isLoading ? (
              <Skeleton className="h-40 w-full" />
            ) : !citations || citations.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-6">
                No citations logged yet. Use the "Check Now" buttons to test AI engines and log results.
              </p>
            ) : (
              <div className="overflow-x-auto max-h-64 overflow-y-auto">
                <table className="w-full text-sm">
                  <thead className="sticky top-0 bg-card">
                    <tr className="border-b border-border">
                      <th className="text-left py-2 pr-2 font-medium text-muted-foreground">Engine</th>
                      <th className="text-left py-2 px-1 font-medium text-muted-foreground">Query</th>
                      <th className="text-center py-2 px-1 font-medium text-muted-foreground">Cited</th>
                      <th className="text-left py-2 px-1 font-medium text-muted-foreground">Notes</th>
                      <th className="text-right py-2 font-medium text-muted-foreground">Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {citations.slice(0, 20).map((c) => (
                      <tr key={c.id} className="border-b border-border/50 hover:bg-muted/30 transition-colors">
                        <td className="py-2 pr-2 capitalize">{c.engine}</td>
                        <td className="py-2 px-1 max-w-[160px] truncate" title={c.query}>
                          {c.query}
                        </td>
                        <td className="py-2 px-1 text-center">
                          {c.cited ? (
                            <Badge className="bg-green-500/20 text-green-500 border-0 text-xs">Yes</Badge>
                          ) : (
                            <Badge variant="secondary" className="text-xs">No</Badge>
                          )}
                        </td>
                        <td className="py-2 px-1 text-xs text-muted-foreground max-w-[120px] truncate" title={c.notes ?? ""}>
                          {c.notes || "--"}
                        </td>
                        <td className="py-2 text-right text-xs text-muted-foreground whitespace-nowrap">
                          {new Date(c.checked_at).toLocaleDateString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

// ─── Section 4: AI Strategy Advisor ─────────────────────────────────────────

function StrategyAdvisorSection() {
  const { data: actions, isLoading } = useAdvisorActions();
  const generateReport = useGenerateReport();
  const toggleAction = useToggleAction();

  const handleGenerate = async () => {
    try {
      await generateReport.mutateAsync();
      toast.success("SEO report generated -- new actions added");
    } catch (e) {
      toast.error(`Failed: ${e instanceof Error ? e.message : String(e)}`);
    }
  };

  const handleToggle = async (id: string, completed: boolean) => {
    try {
      await toggleAction.mutateAsync({ id, completed });
    } catch (e) {
      toast.error(`Failed: ${e instanceof Error ? e.message : String(e)}`);
    }
  };

  const pendingActions = (actions ?? []).filter((a) => !a.completed);
  const completedActions = (actions ?? []).filter((a) => a.completed);

  const handleCopyForClaude = () => {
    if (!pendingActions.length) {
      toast.error("No pending actions to copy");
      return;
    }

    const actionList = pendingActions
      .map(
        (a, i) =>
          `${i + 1}. [${a.priority}] ${a.title}\n   ${a.description}\n   Effort: ${a.effort} | Impact: ${a.impact}`
      )
      .join("\n\n");

    const prompt = `Execute the following SEO/AEO improvements on the FilaScope codebase (filascope.com). These were generated by the SEO Command Center AI Advisor based on live Google Search Console data.

IMPORTANT: Do NOT change the visual aesthetics or layout of the site. Only modify code that affects SEO, structured data, meta tags, content, and crawlability.

Actions to implement (ordered by priority):

${actionList}

For each action:
1. Identify which files need to change
2. Make the code changes
3. After all changes, build and deploy with: npm run build && npx netlify deploy --prod --dir=dist

When complete, summarize what was done for each action.`;

    navigator.clipboard.writeText(prompt).then(() => {
      toast.success("Copied! Paste into Claude Code to execute");
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-base flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-primary" />
          AI Strategy Advisor
        </h3>
        <div className="flex items-center gap-2">
          {pendingActions.length > 0 && (
            <Button
              onClick={handleCopyForClaude}
              variant="outline"
              className="gap-2"
              size="sm"
            >
              <ClipboardCopy className="w-4 h-4" />
              Copy for Claude Code
            </Button>
          )}
          <Button
            onClick={handleGenerate}
            disabled={generateReport.isPending}
            className="gap-2"
            size="sm"
          >
            <Sparkles className={`w-4 h-4 ${generateReport.isPending ? "animate-pulse" : ""}`} />
            {generateReport.isPending ? "Generating..." : "Generate SEO Report"}
          </Button>
        </div>
      </div>

      {generateReport.isPending && (
        <Card>
          <CardContent className="py-8 text-center space-y-3">
            <div className="flex justify-center">
              <RefreshCw className="w-8 h-8 text-primary animate-spin" />
            </div>
            <p className="text-sm text-muted-foreground">
              Analyzing GSC data and generating recommendations...
            </p>
          </CardContent>
        </Card>
      )}

      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-20 rounded-lg" />
          ))}
        </div>
      ) : !actions || actions.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center">
            <p className="text-muted-foreground">
              No advisor actions yet. Click "Generate SEO Report" to analyze your data and get recommendations.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {/* Pending Actions */}
          {pendingActions.length > 0 && (
            <div className="space-y-2">
              {pendingActions.map((action) => (
                <Card key={action.id} className="hover:bg-muted/20 transition-colors">
                  <CardContent className="py-4">
                    <div className="flex items-start gap-3">
                      <Checkbox
                        checked={false}
                        onCheckedChange={() => handleToggle(action.id, true)}
                        className="mt-1"
                      />
                      <div className="flex-1 min-w-0 space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          {priorityBadge(action.priority)}
                          <span className="font-medium text-sm">{action.title}</span>
                        </div>
                        <p className="text-xs text-muted-foreground">{action.description}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge variant="outline" className="text-xs">
                            Effort: {action.effort}
                          </Badge>
                          <Badge variant="outline" className="text-xs">
                            Impact: {action.impact}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {/* Completed Actions */}
          {completedActions.length > 0 && (
            <details className="group">
              <summary className="cursor-pointer text-sm text-muted-foreground hover:text-foreground transition-colors">
                {completedActions.length} completed action{completedActions.length !== 1 ? "s" : ""}
              </summary>
              <div className="space-y-2 mt-2">
                {completedActions.map((action) => (
                  <Card key={action.id} className="opacity-60">
                    <CardContent className="py-3">
                      <div className="flex items-start gap-3">
                        <Checkbox
                          checked={true}
                          onCheckedChange={() => handleToggle(action.id, false)}
                          className="mt-1"
                        />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            {priorityBadge(action.priority)}
                            <span className="font-medium text-sm line-through">{action.title}</span>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </details>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Main Component ─────────────────────────────────────────────────────────

export default function SeoCommandCenter() {
  return (
    <div className="space-y-8">
      <div className="flex items-center gap-2">
        <Search className="w-6 h-6 text-primary" />
        <h2 className="text-xl font-bold">SEO Command Center</h2>
      </div>

      {/* Section 1: Indexing Health */}
      <IndexingHealthSection />

      {/* Section 2: Ranking Tracker */}
      <RankingTrackerSection />

      {/* Section 3: AI Citation Tracker */}
      <CitationTrackerSection />

      {/* Section 4: AI Strategy Advisor */}
      <StrategyAdvisorSection />
    </div>
  );
}
