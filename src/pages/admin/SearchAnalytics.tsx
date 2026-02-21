import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useSearchDictionaries } from "@/hooks/useSearchDictionaries";
import { levenshteinDistance } from "@/lib/fuzzySearch";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { DocumentHead } from "@/components/seo/DocumentHead";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Search, Plus, Copy, ArrowUpDown, TrendingUp, BookOpen, Lightbulb } from "lucide-react";
import { format } from "date-fns";

/* ------------------------------------------------------------------ */
/*  Tab 1 – Zero-Result Queries                                       */
/* ------------------------------------------------------------------ */
function ZeroResultsTab() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { data: dictionaries } = useSearchDictionaries();

  const [synonymDialog, setSynonymDialog] = useState<{ term: string } | null>(null);
  const [targetTerm, setTargetTerm] = useState("");
  const [targetType, setTargetType] = useState<string>("brand");

  const { data: zeroResults, isLoading } = useQuery({
    queryKey: ["admin-zero-results"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("search_zero_results")
        .select("*")
        .order("search_count", { ascending: false })
        .limit(50);
      if (error) throw error;
      return data || [];
    },
  });

  const addSynonym = useMutation({
    mutationFn: async ({ source, target, type }: { source: string; target: string; type: string }) => {
      const { error } = await supabase.from("search_synonyms").insert({
        term: source,
        synonyms: [target],
        maps_to_material: type === 'material' ? target : null,
        maps_to_tag: type === 'tag' ? target : null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Synonym added");
      setSynonymDialog(null);
      setTargetTerm("");
      queryClient.invalidateQueries({ queryKey: ["admin-zero-results"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const allTargets = useMemo(() => {
    if (!dictionaries) return [];
    return [
      ...dictionaries.brands.map(b => ({ label: b, type: "brand" })),
      ...dictionaries.materials.map(m => ({ label: m, type: "material" })),
    ];
  }, [dictionaries]);

  return (
    <>
      <Card className="border-border/50">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Search className="w-5 h-5 text-destructive" />
            Zero-Result Queries
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <p className="text-muted-foreground text-sm py-8 text-center">Loading…</p>
          ) : (
            <div className="overflow-auto max-h-[600px]">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Search Term</TableHead>
                    <TableHead className="text-right">Count</TableHead>
                    <TableHead className="text-right">Sessions</TableHead>
                    <TableHead>Last Seen</TableHead>
                    <TableHead>Region</TableHead>
                    <TableHead />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(zeroResults || []).map((r) => (
                    <TableRow key={r.search_term}>
                      <TableCell className="font-medium">{r.search_term}</TableCell>
                      <TableCell className="text-right">{r.search_count}</TableCell>
                      <TableCell className="text-right">{r.unique_sessions}</TableCell>
                      <TableCell className="text-muted-foreground text-xs">
                        {r.last_searched_at ? format(new Date(r.last_searched_at), "MMM d, HH:mm") : "—"}
                      </TableCell>
                      <TableCell>
                        {r.most_common_region ? (
                          <Badge variant="outline">{r.most_common_region}</Badge>
                        ) : "—"}
                      </TableCell>
                      <TableCell>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setSynonymDialog({ term: r.search_term })}
                        >
                          <Plus className="w-3 h-3 mr-1" /> Synonym
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add Synonym Dialog */}
      <Dialog open={!!synonymDialog} onOpenChange={() => setSynonymDialog(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Map "{synonymDialog?.term}" to existing term</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <label className="text-sm font-medium text-foreground">Target Type</label>
              <Select value={targetType} onValueChange={setTargetType}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="brand">Brand</SelectItem>
                  <SelectItem value="material">Material</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium text-foreground">Target Term</label>
              <Input
                placeholder="Start typing to find…"
                value={targetTerm}
                onChange={(e) => setTargetTerm(e.target.value)}
                list="target-terms"
              />
              <datalist id="target-terms">
                {allTargets
                  .filter(t => t.type === targetType)
                  .filter(t => t.label.toLowerCase().includes(targetTerm.toLowerCase()))
                  .slice(0, 20)
                  .map(t => (
                    <option key={t.label} value={t.label} />
                  ))}
              </datalist>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSynonymDialog(null)}>Cancel</Button>
            <Button
              disabled={!targetTerm || addSynonym.isPending}
              onClick={() => {
                if (synonymDialog) {
                  addSynonym.mutate({ source: synonymDialog.term, target: targetTerm, type: targetType });
                }
              }}
            >
              {addSynonym.isPending ? "Adding…" : "Add Synonym"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

/* ------------------------------------------------------------------ */
/*  Tab 2 – Top Search Queries                                         */
/* ------------------------------------------------------------------ */
function TopQueriesTab() {
  const thirtyDaysAgo = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() - 30);
    return d.toISOString();
  }, []);

  const { data: topQueries, isLoading } = useQuery({
    queryKey: ["admin-top-queries"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("search_logs")
        .select("search_term, results_count, has_results")
        .gte("created_at", thirtyDaysAgo)
        .limit(1000);
      if (error) throw error;

      const map: Record<string, { total: number; withResults: number; sumResults: number }> = {};
      for (const row of data || []) {
        const term = (row.search_term || "").toLowerCase().trim();
        if (!term) continue;
        if (!map[term]) map[term] = { total: 0, withResults: 0, sumResults: 0 };
        map[term].total++;
        if (row.has_results) map[term].withResults++;
        map[term].sumResults += row.results_count || 0;
      }

      return Object.entries(map)
        .map(([term, d]) => ({
          term,
          total: d.total,
          pctWithResults: ((d.withResults / d.total) * 100).toFixed(1),
          avgResults: (d.sumResults / d.total).toFixed(1),
        }))
        .sort((a, b) => b.total - a.total)
        .slice(0, 30);
    },
  });

  return (
    <Card className="border-border/50">
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <ArrowUpDown className="w-5 h-5 text-primary" />
          Top Search Queries (30 days)
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <p className="text-muted-foreground text-sm py-8 text-center">Loading…</p>
        ) : (
          <div className="overflow-auto max-h-[600px]">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>#</TableHead>
                  <TableHead>Search Term</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                  <TableHead className="text-right">% With Results</TableHead>
                  <TableHead className="text-right">Avg Results</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(topQueries || []).map((q, i) => (
                  <TableRow key={q.term}>
                    <TableCell className="text-muted-foreground">{i + 1}</TableCell>
                    <TableCell className="font-medium">{q.term}</TableCell>
                    <TableCell className="text-right">{q.total}</TableCell>
                    <TableCell className="text-right">
                      <Badge variant={Number(q.pctWithResults) > 80 ? "default" : "destructive"}>
                        {q.pctWithResults}%
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">{q.avgResults}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

/* ------------------------------------------------------------------ */
/*  Tab 3 – Search → Click Conversion                                 */
/* ------------------------------------------------------------------ */
function ConversionTab() {
  const thirtyDaysAgo = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() - 30);
    return d.toISOString();
  }, []);

  const { data, isLoading } = useQuery({
    queryKey: ["admin-search-conversion"],
    queryFn: async () => {
      // Get search sessions
      const { data: searches, error: sErr } = await supabase
        .from("search_logs")
        .select("session_id, search_term")
        .gte("created_at", thirtyDaysAgo)
        .not("session_id", "is", null)
        .limit(1000);
      if (sErr) throw sErr;

      // Get affiliate clicks
      const { data: clicks, error: cErr } = await supabase
        .from("affiliate_clicks")
        .select("session_id")
        .gte("clicked_at", thirtyDaysAgo)
        .not("session_id", "is", null)
        .limit(1000);
      if (cErr) throw cErr;

      const clickSessions = new Set((clicks || []).map(c => c.session_id));
      const searchSessions = new Map<string, Set<string>>();

      for (const s of searches || []) {
        if (!s.session_id) continue;
        if (!searchSessions.has(s.session_id)) searchSessions.set(s.session_id, new Set());
        searchSessions.get(s.session_id)!.add(s.search_term || "");
      }

      const totalSearchSessions = searchSessions.size;
      let convertedSessions = 0;
      const termConversions: Record<string, { total: number; converted: number }> = {};

      for (const [sid, terms] of searchSessions) {
        const converted = clickSessions.has(sid);
        if (converted) convertedSessions++;
        for (const term of terms) {
          if (!termConversions[term]) termConversions[term] = { total: 0, converted: 0 };
          termConversions[term].total++;
          if (converted) termConversions[term].converted++;
        }
      }

      const topConverting = Object.entries(termConversions)
        .filter(([, d]) => d.converted > 0)
        .map(([term, d]) => ({
          term,
          searches: d.total,
          conversions: d.converted,
          rate: ((d.converted / d.total) * 100).toFixed(1),
        }))
        .sort((a, b) => b.conversions - a.conversions)
        .slice(0, 15);

      return {
        totalSearchSessions,
        convertedSessions,
        rate: totalSearchSessions > 0 ? ((convertedSessions / totalSearchSessions) * 100).toFixed(1) : "0",
        topConverting,
      };
    },
  });

  return (
    <Card className="border-border/50">
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-primary" />
          Search → Click Conversion (30 days)
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {isLoading ? (
          <p className="text-muted-foreground text-sm py-8 text-center">Loading…</p>
        ) : data ? (
          <>
            <div className="grid grid-cols-3 gap-4">
              <div className="p-4 rounded-lg bg-muted/30 border border-border/50 text-center">
                <p className="text-2xl font-bold text-foreground">{data.totalSearchSessions}</p>
                <p className="text-xs text-muted-foreground">Search Sessions</p>
              </div>
              <div className="p-4 rounded-lg bg-muted/30 border border-border/50 text-center">
                <p className="text-2xl font-bold text-foreground">{data.convertedSessions}</p>
                <p className="text-xs text-muted-foreground">With Clicks</p>
              </div>
              <div className="p-4 rounded-lg bg-primary/10 border border-primary/20 text-center">
                <p className="text-2xl font-bold text-primary">{data.rate}%</p>
                <p className="text-xs text-muted-foreground">Conversion Rate</p>
              </div>
            </div>

            {data.topConverting.length > 0 && (
              <div>
                <h3 className="text-sm font-medium mb-2 text-foreground">Top Converting Terms</h3>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Term</TableHead>
                      <TableHead className="text-right">Searches</TableHead>
                      <TableHead className="text-right">Clicks</TableHead>
                      <TableHead className="text-right">Rate</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data.topConverting.map((t) => (
                      <TableRow key={t.term}>
                        <TableCell className="font-medium">{t.term}</TableCell>
                        <TableCell className="text-right">{t.searches}</TableCell>
                        <TableCell className="text-right">{t.conversions}</TableCell>
                        <TableCell className="text-right">
                          <Badge variant="default">{t.rate}%</Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </>
        ) : null}
      </CardContent>
    </Card>
  );
}

/* ------------------------------------------------------------------ */
/*  Tab 4 – Suggested Dictionary Additions                             */
/* ------------------------------------------------------------------ */
function DictionarySuggestionsTab() {
  const { data: dictionaries } = useSearchDictionaries();

  const { data: zeroResults } = useQuery({
    queryKey: ["admin-zero-results"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("search_zero_results")
        .select("*")
        .order("search_count", { ascending: false })
        .limit(100);
      if (error) throw error;
      return data || [];
    },
  });

  const suggestions = useMemo(() => {
    if (!zeroResults || !dictionaries) return [];
    const allTerms = [...dictionaries.brands, ...dictionaries.materials];
    return zeroResults
      .map((zr) => {
        let bestMatch = "";
        let bestDist = Infinity;
        for (const known of allTerms) {
          const dist = levenshteinDistance(zr.search_term.toLowerCase(), known.toLowerCase());
          if (dist < bestDist) {
            bestDist = dist;
            bestMatch = known;
          }
        }
        return { ...zr, closestMatch: bestMatch, distance: bestDist };
      })
      .filter((s) => s.distance >= 1 && s.distance <= 2)
      .sort((a, b) => a.distance - b.distance || b.search_count - a.search_count);
  }, [zeroResults, dictionaries]);

  const copyToClipboard = (source: string, target: string) => {
    const snippet = `  "${target.toLowerCase()}": ["${source.toLowerCase()}"],`;
    navigator.clipboard.writeText(snippet);
    toast.success("Snippet copied to clipboard");
  };

  return (
    <Card className="border-border/50">
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <Lightbulb className="w-5 h-5 text-accent-foreground" />
          Suggested Dictionary Additions
        </CardTitle>
      </CardHeader>
      <CardContent>
        {suggestions.length === 0 ? (
          <p className="text-muted-foreground text-sm py-8 text-center">
            No close matches found — all zero-result terms differ by 3+ characters from known terms.
          </p>
        ) : (
          <div className="overflow-auto max-h-[600px]">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Searched Term</TableHead>
                  <TableHead>Closest Match</TableHead>
                  <TableHead className="text-right">Distance</TableHead>
                  <TableHead className="text-right">Searches</TableHead>
                  <TableHead />
                </TableRow>
              </TableHeader>
              <TableBody>
                {suggestions.map((s) => (
                  <TableRow key={s.search_term}>
                    <TableCell className="font-medium">{s.search_term}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{s.closestMatch}</Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Badge variant={s.distance === 1 ? "default" : "secondary"}>
                        {s.distance}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">{s.search_count}</TableCell>
                    <TableCell>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => copyToClipboard(s.search_term, s.closestMatch)}
                      >
                        <Copy className="w-3 h-3 mr-1" /> Copy Typo
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

/* ------------------------------------------------------------------ */
/*  Main Page                                                          */
/* ------------------------------------------------------------------ */
export default function SearchAnalytics() {
  return (
    <AdminLayout>
      <DocumentHead title="Search Analytics" robots="noindex, nofollow" />
      <div className="p-6">
        <div className="max-w-7xl mx-auto space-y-6">
          <AdminPageHeader
            title="Search Analytics"
            description="Understand search behavior, identify content gaps, and improve discovery"
            icon={Search}
          />

          <Tabs defaultValue="zero-results">
            <TabsList className="grid grid-cols-4 w-full max-w-2xl">
              <TabsTrigger value="zero-results">Zero Results</TabsTrigger>
              <TabsTrigger value="top-queries">Top Queries</TabsTrigger>
              <TabsTrigger value="conversion">Conversion</TabsTrigger>
              <TabsTrigger value="suggestions">Suggestions</TabsTrigger>
            </TabsList>

            <TabsContent value="zero-results">
              <ZeroResultsTab />
            </TabsContent>
            <TabsContent value="top-queries">
              <TopQueriesTab />
            </TabsContent>
            <TabsContent value="conversion">
              <ConversionTab />
            </TabsContent>
            <TabsContent value="suggestions">
              <DictionarySuggestionsTab />
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </AdminLayout>
  );
}
