import { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { useToast } from "@/hooks/use-toast";
import {
  AlertTriangle,
  ExternalLink,
  CheckCircle2,
  EyeOff,
  RefreshCw,
  ChevronDown,
  Search,
  XCircle,
  Clock,
  ArrowRightLeft,
  Globe,
  ShieldX,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";

// ── Types ────────────────────────────────────────────────────────────────────

type BreakType =
  | "hard_404"
  | "soft_404"
  | "wrong_redirect"
  | "geo_redirect"
  | "out_of_stock"
  | "affiliate_failure"
  | "timeout"
  | "ssl_error"
  | "domain_dead";

type LinkStatus = "open" | "fixed" | "ignored" | "manual_review";

interface BrokenLink {
  id: string;
  listing_id: string | null;
  filament_id: string | null;
  retailer_id: string | null;
  product_url: string;
  affiliate_url: string | null;
  region: string;
  break_type: BreakType;
  http_status: number | null;
  final_url: string | null;
  redirect_chain: any;
  error_message: string | null;
  status: LinkStatus;
  first_detected_at: string;
  last_checked_at: string;
  fixed_at: string | null;
  scan_batch_id: string | null;
  retailer_name: string | null;
  filament_name: string | null;
  brand_name: string | null;
}

interface ScanRun {
  id: string;
  batch_id: string;
  started_at: string;
  completed_at: string | null;
  total_links: number;
  checked: number;
  broken_found: number;
  status: string;
  scan_type: string;
}

// ── Badge helpers ─────────────────────────────────────────────────────────────

const BREAK_TYPE_CONFIG: Record<BreakType, { label: string; className: string; Icon: React.ComponentType<any> }> = {
  hard_404:        { label: "Hard 404",        className: "bg-destructive/10 text-destructive border-destructive/30",   Icon: XCircle },
  soft_404:        { label: "Soft 404",         className: "bg-orange-500/10 text-orange-500 border-orange-500/30",      Icon: AlertTriangle },
  wrong_redirect:  { label: "Wrong Redirect",  className: "bg-yellow-500/10 text-yellow-500 border-yellow-500/30",      Icon: ArrowRightLeft },
  geo_redirect:    { label: "Geo Redirect",    className: "bg-blue-500/10 text-blue-400 border-blue-500/30",             Icon: Globe },
  out_of_stock:    { label: "Out of Stock",    className: "bg-purple-500/10 text-purple-400 border-purple-500/30",       Icon: AlertTriangle },
  affiliate_failure: { label: "Affiliate Err", className: "bg-pink-500/10 text-pink-400 border-pink-500/30",            Icon: ShieldX },
  timeout:         { label: "Timeout",         className: "bg-muted text-muted-foreground border-border",                Icon: Clock },
  ssl_error:       { label: "SSL Error",       className: "bg-yellow-900/20 text-yellow-300 border-yellow-700/30",      Icon: ShieldX },
  domain_dead:     { label: "Domain Dead",     className: "bg-rose-900/20 text-rose-400 border-rose-700/30",             Icon: XCircle },
};

const STATUS_CONFIG: Record<LinkStatus, { label: string; className: string }> = {
  open:          { label: "Open",          className: "bg-destructive/10 text-destructive border-destructive/30" },
  fixed:         { label: "Fixed",         className: "bg-green-500/10 text-green-500 border-green-500/30" },
  ignored:       { label: "Ignored",       className: "bg-muted text-muted-foreground border-border" },
  manual_review: { label: "Manual Review", className: "bg-yellow-500/10 text-yellow-500 border-yellow-500/30" },
};

function BreakBadge({ type }: { type: BreakType }) {
  const cfg = BREAK_TYPE_CONFIG[type] ?? { label: type, className: "", Icon: AlertTriangle };
  const { Icon } = cfg;
  return (
    <Badge variant="outline" className={`gap-1 text-xs ${cfg.className}`}>
      <Icon className="w-3 h-3" />
      {cfg.label}
    </Badge>
  );
}

function StatusBadge({ status }: { status: LinkStatus }) {
  const cfg = STATUS_CONFIG[status] ?? { label: status, className: "" };
  return <Badge variant="outline" className={`text-xs ${cfg.className}`}>{cfg.label}</Badge>;
}

// ── Main component ────────────────────────────────────────────────────────────

export default function AdminLinkHealth() {
  const { isAdmin, loading } = useAuth();
  const { toast } = useToast();

  const [links, setLinks] = useState<BrokenLink[]>([]);
  const [scanRuns, setScanRuns] = useState<ScanRun[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isScanning, setIsScanning] = useState(false);
  const [scanOpen, setScanOpen] = useState(false);

  // Stats
  const [stats, setStats] = useState({
    totalOpen: 0,
    hard404: 0,
    soft404OrRedirect: 0,
    fixedThisWeek: 0,
    lastScan: null as string | null,
  });

  // Filters
  const [statusFilter, setStatusFilter] = useState("open");
  const [typeFilter, setTypeFilter] = useState("all");
  const [regionFilter, setRegionFilter] = useState("all");
  const [retailerFilter, setRetailerFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [retailers, setRetailers] = useState<string[]>([]);

  const fetchData = useCallback(async () => {
    setIsLoading(true);

    // Build query
    let q = supabase
      .from("broken_links")
      .select("*")
      .order("first_detected_at", { ascending: false })
      .limit(500);

    if (statusFilter !== "all") q = q.eq("status", statusFilter);
    if (typeFilter !== "all") q = q.eq("break_type", typeFilter);
    if (regionFilter !== "all") q = q.eq("region", regionFilter);
    if (retailerFilter !== "all") q = q.eq("retailer_name", retailerFilter);
    if (search.trim()) q = q.ilike("filament_name", `%${search.trim()}%`);

    const [linksRes, statsRes, scansRes] = await Promise.all([
      q,
      // Stats counters
      Promise.all([
        supabase.from("broken_links").select("id", { count: "exact", head: true }).eq("status", "open"),
        supabase.from("broken_links").select("id", { count: "exact", head: true }).eq("status", "open").eq("break_type", "hard_404"),
        supabase.from("broken_links").select("id", { count: "exact", head: true }).eq("status", "open").in("break_type", ["soft_404", "wrong_redirect", "geo_redirect"]),
        supabase.from("broken_links").select("id", { count: "exact", head: true }).eq("status", "fixed").gte("fixed_at", new Date(Date.now() - 7 * 86400_000).toISOString()),
      ]),
      // Scan history
      supabase.from("link_scan_runs").select("*").order("started_at", { ascending: false }).limit(20),
    ]);

    const [totalOpen, hard404, soft, fixedWeek] = statsRes;

    setLinks((linksRes.data as BrokenLink[]) ?? []);
    setStats({
      totalOpen: totalOpen.count ?? 0,
      hard404: hard404.count ?? 0,
      soft404OrRedirect: soft.count ?? 0,
      fixedThisWeek: fixedWeek.count ?? 0,
      lastScan: scansRes.data?.[0]?.completed_at ?? null,
    });
    setScanRuns((scansRes.data as ScanRun[]) ?? []);

    // Collect distinct retailer names for filter dropdown
    const { data: retailerRows } = await supabase
      .from("broken_links")
      .select("retailer_name")
      .not("retailer_name", "is", null);
    const unique = [...new Set((retailerRows ?? []).map((r: any) => r.retailer_name))].filter(Boolean) as string[];
    setRetailers(unique.sort());

    setIsLoading(false);
  }, [statusFilter, typeFilter, regionFilter, retailerFilter, search]);

  useEffect(() => { if (isAdmin) fetchData(); }, [isAdmin, fetchData]);

  const handleUpdateStatus = async (id: string, newStatus: LinkStatus) => {
    const update: Record<string, any> = { status: newStatus };
    if (newStatus === "fixed") update.fixed_at = new Date().toISOString();

    const { error } = await supabase.from("broken_links").update(update).eq("id", id);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Updated", description: `Link marked as ${newStatus}` });
      fetchData();
    }
  };

  const handleRunScan = async () => {
    setIsScanning(true);
    try {
      const { data, error } = await supabase.functions.invoke("validate-product-links", {
        body: { limit: 500 },
      });
      if (error) throw error;
      toast({
        title: "Scan complete",
        description: `Checked ${data?.checked ?? 0} links, found ${data?.broken ?? 0} broken.`,
      });
      fetchData();
    } catch (e: any) {
      toast({ title: "Scan failed", description: String(e?.message || e), variant: "destructive" });
    } finally {
      setIsScanning(false);
    }
  };

  const truncateUrl = (url: string, max = 50) =>
    url.length > max ? url.slice(0, max) + "…" : url;

  if (loading) return null;
  if (!isAdmin) return null;

  return (
    <AdminLayout>
      <div className="p-6 max-w-[1600px] mx-auto space-y-6">
        <AdminPageHeader
          title="Link Health"
          description="Monitor and fix broken product links across all regions"
          icon={AlertTriangle}
          iconColor="text-destructive"
          actions={
            <Button onClick={handleRunScan} disabled={isScanning} size="sm">
              <RefreshCw className={`w-4 h-4 mr-2 ${isScanning ? "animate-spin" : ""}`} />
              {isScanning ? "Scanning…" : "Run Scan"}
            </Button>
          }
        />

        {/* Stats cards */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <Card className={`p-4 ${stats.totalOpen > 0 ? "border-destructive/40" : ""}`}>
            <div className="text-2xl font-bold text-destructive">{stats.totalOpen}</div>
            <div className="text-xs text-muted-foreground mt-1">Total Open</div>
          </Card>
          <Card className="p-4">
            <div className="text-2xl font-bold">{stats.hard404}</div>
            <div className="text-xs text-muted-foreground mt-1">Hard 404s</div>
          </Card>
          <Card className="p-4">
            <div className="text-2xl font-bold">{stats.soft404OrRedirect}</div>
            <div className="text-xs text-muted-foreground mt-1">Soft 404s / Redirects</div>
          </Card>
          <Card className="p-4">
            <div className="text-2xl font-bold text-green-500">{stats.fixedThisWeek}</div>
            <div className="text-xs text-muted-foreground mt-1">Fixed This Week</div>
          </Card>
          <Card className="p-4">
            <div className="text-xs font-medium text-muted-foreground mb-1">Last Scan</div>
            <div className="text-sm">
              {stats.lastScan
                ? formatDistanceToNow(new Date(stats.lastScan), { addSuffix: true })
                : "Never"}
            </div>
          </Card>
        </div>

        {/* Filters */}
        <Card className="p-4">
          <div className="flex flex-wrap gap-3">
            <div className="relative flex-1 min-w-[180px]">
              <Search className="absolute left-2.5 top-2.5 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search product name…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-8"
              />
            </div>

            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-36"><SelectValue placeholder="Status" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="open">Open</SelectItem>
                <SelectItem value="fixed">Fixed</SelectItem>
                <SelectItem value="ignored">Ignored</SelectItem>
                <SelectItem value="manual_review">Manual Review</SelectItem>
              </SelectContent>
            </Select>

            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-44"><SelectValue placeholder="Break Type" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="hard_404">Hard 404</SelectItem>
                <SelectItem value="soft_404">Soft 404</SelectItem>
                <SelectItem value="wrong_redirect">Wrong Redirect</SelectItem>
                <SelectItem value="geo_redirect">Geo Redirect</SelectItem>
                <SelectItem value="timeout">Timeout</SelectItem>
                <SelectItem value="ssl_error">SSL Error</SelectItem>
                <SelectItem value="domain_dead">Domain Dead</SelectItem>
                <SelectItem value="out_of_stock">Out of Stock</SelectItem>
                <SelectItem value="affiliate_failure">Affiliate Failure</SelectItem>
              </SelectContent>
            </Select>

            <Select value={regionFilter} onValueChange={setRegionFilter}>
              <SelectTrigger className="w-32"><SelectValue placeholder="Region" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Regions</SelectItem>
                <SelectItem value="US">US</SelectItem>
                <SelectItem value="UK">UK</SelectItem>
                <SelectItem value="EU">EU</SelectItem>
                <SelectItem value="CA">CA</SelectItem>
                <SelectItem value="AU">AU</SelectItem>
                <SelectItem value="JP">JP</SelectItem>
              </SelectContent>
            </Select>

            {retailers.length > 0 && (
              <Select value={retailerFilter} onValueChange={setRetailerFilter}>
                <SelectTrigger className="w-40"><SelectValue placeholder="Retailer" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Retailers</SelectItem>
                  {retailers.map((r) => (
                    <SelectItem key={r} value={r}>{r}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}

            <Button variant="ghost" size="sm" onClick={fetchData} className="shrink-0">
              <RefreshCw className="w-4 h-4" />
            </Button>
          </div>
        </Card>

        {/* Results table */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">
              Broken Links
              {!isLoading && (
                <span className="ml-2 text-muted-foreground font-normal text-sm">
                  ({links.length} results)
                </span>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {isLoading ? (
              <div className="py-12 text-center text-muted-foreground text-sm">Loading…</div>
            ) : links.length === 0 ? (
              <div className="py-12 text-center text-muted-foreground text-sm flex flex-col items-center gap-2">
                <CheckCircle2 className="w-8 h-8 text-green-500" />
                No broken links found with current filters.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Product</TableHead>
                      <TableHead>Brand</TableHead>
                      <TableHead>Retailer</TableHead>
                      <TableHead>Region</TableHead>
                      <TableHead>Break Type</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>HTTP</TableHead>
                      <TableHead>URL</TableHead>
                      <TableHead>Detected</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {links.map((link) => (
                      <TableRow key={link.id}>
                        <TableCell className="max-w-[180px]">
                          <span className="text-sm font-medium truncate block" title={link.filament_name ?? ""}>
                            {link.filament_name ?? "—"}
                          </span>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground whitespace-nowrap">
                          {link.brand_name ?? "—"}
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground whitespace-nowrap">
                          {link.retailer_name ?? "—"}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="text-xs">{link.region}</Badge>
                        </TableCell>
                        <TableCell>
                          <BreakBadge type={link.break_type} />
                        </TableCell>
                        <TableCell>
                          <StatusBadge status={link.status} />
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {link.http_status ?? "—"}
                        </TableCell>
                        <TableCell className="max-w-[200px]">
                          <div className="flex flex-col gap-0.5">
                            <a
                              href={link.product_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-xs text-primary hover:underline truncate block"
                              title={link.product_url}
                            >
                              {truncateUrl(link.product_url)}
                            </a>
                            {link.final_url && link.final_url !== link.product_url && (
                              <span className="text-xs text-muted-foreground truncate block" title={link.final_url}>
                                → {truncateUrl(link.final_url, 40)}
                              </span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                          {formatDistanceToNow(new Date(link.first_detected_at), { addSuffix: true })}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1 justify-end">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7"
                              title="Test Link"
                              asChild
                            >
                              <a href={link.product_url} target="_blank" rel="noopener noreferrer">
                                <ExternalLink className="w-3.5 h-3.5" />
                              </a>
                            </Button>
                            {link.status !== "fixed" && (
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7 text-green-500 hover:text-green-400"
                                title="Mark Fixed"
                                onClick={() => handleUpdateStatus(link.id, "fixed")}
                              >
                                <CheckCircle2 className="w-3.5 h-3.5" />
                              </Button>
                            )}
                            {link.status !== "ignored" && (
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7 text-muted-foreground hover:text-foreground"
                                title="Ignore"
                                onClick={() => handleUpdateStatus(link.id, "ignored")}
                              >
                                <EyeOff className="w-3.5 h-3.5" />
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

        {/* Scan history */}
        <Collapsible open={scanOpen} onOpenChange={setScanOpen}>
          <Card>
            <CollapsibleTrigger asChild>
              <CardHeader className="cursor-pointer hover:bg-muted/30 transition-colors rounded-lg">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base">Scan History</CardTitle>
                  <ChevronDown className={`w-4 h-4 text-muted-foreground transition-transform ${scanOpen ? "rotate-180" : ""}`} />
                </div>
              </CardHeader>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <CardContent className="p-0">
                {scanRuns.length === 0 ? (
                  <div className="py-8 text-center text-muted-foreground text-sm">No scans run yet.</div>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Batch ID</TableHead>
                          <TableHead>Type</TableHead>
                          <TableHead>Started</TableHead>
                          <TableHead>Duration</TableHead>
                          <TableHead>Total</TableHead>
                          <TableHead>Checked</TableHead>
                          <TableHead>Broken</TableHead>
                          <TableHead>Status</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {scanRuns.map((run) => {
                          const duration = run.completed_at
                            ? Math.round((new Date(run.completed_at).getTime() - new Date(run.started_at).getTime()) / 1000)
                            : null;
                          return (
                            <TableRow key={run.id}>
                              <TableCell className="font-mono text-xs text-muted-foreground">{run.batch_id}</TableCell>
                              <TableCell className="text-sm">{run.scan_type}</TableCell>
                              <TableCell className="text-sm text-muted-foreground whitespace-nowrap">
                                {formatDistanceToNow(new Date(run.started_at), { addSuffix: true })}
                              </TableCell>
                              <TableCell className="text-sm text-muted-foreground">
                                {duration != null ? `${duration}s` : "—"}
                              </TableCell>
                              <TableCell className="text-sm">{run.total_links}</TableCell>
                              <TableCell className="text-sm">{run.checked}</TableCell>
                              <TableCell className="text-sm text-destructive font-medium">{run.broken_found}</TableCell>
                              <TableCell>
                                <Badge
                                  variant="outline"
                                  className={
                  run.status === "completed"
                      ? "bg-green-500/10 text-green-500 border-green-500/30 text-xs"
                      : run.status === "running"
                      ? "bg-primary/10 text-primary border-primary/30 text-xs"
                      : "bg-destructive/10 text-destructive border-destructive/30 text-xs"
                                  }
                                >
                                  {run.status}
                                </Badge>
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </CollapsibleContent>
          </Card>
        </Collapsible>
      </div>
    </AdminLayout>
  );
}
