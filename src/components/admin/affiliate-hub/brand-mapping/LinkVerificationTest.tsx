import { useState, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { CheckCircle2, XCircle, Link2, Play, Loader2, ExternalLink } from "lucide-react";
import { buildAffiliateLinkLocal } from "@/utils/affiliateLinks";
import { useRegion } from "@/contexts/RegionContext";
import type { AffiliateProgram } from "@/types/affiliate";

interface TestResult {
  brand: string;
  originalUrl: string;
  affiliateUrl: string | null;
  found: boolean;
  method: string | null;
  regionCode: string;
}

export function LinkVerificationTest() {
  const { region } = useRegion();
  const [selectedBrand, setSelectedBrand] = useState<string>("");
  const [singleResult, setSingleResult] = useState<TestResult | null>(null);
  const [bulkResults, setBulkResults] = useState<TestResult[]>([]);
  const [testing, setTesting] = useState(false);
  const [bulkTesting, setBulkTesting] = useState(false);

  const { data: vendors = [] } = useQuery({
    queryKey: ["distinct-filament-vendors"],
    staleTime: 5 * 60_000,
    queryFn: async () => {
      const { data } = await supabase.from("filaments").select("vendor").not("vendor", "is", null);
      return [...new Set((data || []).map((d) => d.vendor).filter(Boolean))] as string[];
    },
  });

  const resolveAndTest = useCallback(async (vendor: string, regionCode: string): Promise<TestResult> => {
    // Step 1: Check alias
    const { data: aliasData } = await supabase
      .from("brand_affiliate_aliases")
      .select("affiliate_brand_name")
      .ilike("product_vendor_name", vendor)
      .limit(1)
      .maybeSingle();
    const resolvedName = aliasData?.affiliate_brand_name || vendor;

    // Step 2: Look up program (exact region first, then fallback)
    let program: any = null;
    let matchedRegion = regionCode;
    const { data: exactProgram } = await supabase
      .from("affiliate_programs")
      .select("*")
      .ilike("brand_name", resolvedName)
      .eq("region_code", regionCode)
      .eq("is_active", true)
      .limit(1)
      .maybeSingle();
    if (exactProgram) {
      program = exactProgram;
    } else {
      const { data: fallbackProgram } = await supabase
        .from("affiliate_programs")
        .select("*")
        .ilike("brand_name", resolvedName)
        .eq("is_active", true)
        .limit(1)
        .maybeSingle();
      if (fallbackProgram) {
        program = fallbackProgram;
        matchedRegion = `${(fallbackProgram as any).region_code} (fallback)`;
      }
    }

    // Step 3: Get a sample product URL
    const { data: sample } = await supabase
      .from("filaments")
      .select("product_url")
      .ilike("vendor", vendor)
      .not("product_url", "is", null)
      .limit(1)
      .maybeSingle();

    const originalUrl = sample?.product_url || "(no product URL found)";

    if (!program) {
      return { brand: vendor, originalUrl, affiliateUrl: null, found: false, method: null, regionCode: matchedRegion };
    }

    const typedProgram = program as unknown as AffiliateProgram;
    let affiliateUrl: string;
    try {
      if (typedProgram.link_generation_method === "awin_redirect") {
        affiliateUrl = buildAffiliateLinkLocal(typedProgram, originalUrl);
      } else if (typedProgram.link_generation_method === "redirect_link") {
        affiliateUrl = buildAffiliateLinkLocal(typedProgram, "");
      } else {
        const urlObj = new URL(originalUrl);
        affiliateUrl = buildAffiliateLinkLocal(typedProgram, urlObj.pathname + urlObj.search);
      }
    } catch {
      affiliateUrl = buildAffiliateLinkLocal(typedProgram, "");
    }

    return {
      brand: vendor,
      originalUrl,
      affiliateUrl,
      found: true,
      method: typedProgram.link_generation_method || "url_parameter",
      regionCode: matchedRegion,
    };
  }, []);

  const handleTestSingle = async () => {
    if (!selectedBrand) return;
    setTesting(true);
    setSingleResult(null);
    try {
      const result = await resolveAndTest(selectedBrand, region);
      setSingleResult(result);
    } finally {
      setTesting(false);
    }
  };

  const handleTestAll = async () => {
    setBulkTesting(true);
    setBulkResults([]);
    try {
      const results: TestResult[] = [];
      for (const vendor of vendors) {
        const result = await resolveAndTest(vendor, region);
        results.push(result);
      }
      setBulkResults(results.sort((a, b) => (a.found === b.found ? a.brand.localeCompare(b.brand) : a.found ? -1 : 1)));
    } finally {
      setBulkTesting(false);
    }
  };

  const methodBadgeColor = (method: string | null) => {
    if (method === "awin_redirect") return "bg-blue-500/10 text-blue-400 border-blue-500/30";
    if (method === "redirect_link") return "bg-purple-500/10 text-purple-400 border-purple-500/30";
    if (method === "url_parameter") return "bg-green-500/10 text-green-400 border-green-500/30";
    return "";
  };

  return (
    <Card className="bg-card border-border">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <Link2 className="w-5 h-5 text-primary" />
          Link Verification Test
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Single brand test */}
        <div className="flex items-end gap-3">
          <div className="flex-1">
            <label className="text-sm text-muted-foreground mb-1 block">Select Brand</label>
            <Select value={selectedBrand} onValueChange={setSelectedBrand}>
              <SelectTrigger>
                <SelectValue placeholder="Choose a brand..." />
              </SelectTrigger>
              <SelectContent>
                {vendors.sort().map((v) => (
                  <SelectItem key={v} value={v}>{v}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Button onClick={handleTestSingle} disabled={!selectedBrand || testing}>
            {testing ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Play className="w-4 h-4 mr-2" />}
            Test
          </Button>
          <Button variant="outline" onClick={handleTestAll} disabled={bulkTesting}>
            {bulkTesting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Play className="w-4 h-4 mr-2" />}
            Test All Brands
          </Button>
        </div>

        {/* Single result */}
        {singleResult && (
          <div className={`p-4 rounded-lg border ${singleResult.found ? "border-green-500/30 bg-green-500/5" : "border-destructive/30 bg-destructive/5"}`}>
            <div className="flex items-center gap-2 mb-3">
              {singleResult.found ? (
                <CheckCircle2 className="w-5 h-5 text-green-500" />
              ) : (
                <XCircle className="w-5 h-5 text-destructive" />
              )}
              <span className="font-semibold">{singleResult.brand}</span>
              {singleResult.method && (
                <Badge variant="outline" className={methodBadgeColor(singleResult.method)}>
                  {singleResult.method}
                </Badge>
              )}
              <Badge variant="outline" className="text-xs">{singleResult.regionCode}</Badge>
            </div>
            <div className="space-y-1 text-sm font-mono">
              <div>
                <span className="text-muted-foreground">Original: </span>
                <span className="text-foreground break-all">{singleResult.originalUrl}</span>
              </div>
              {singleResult.affiliateUrl && (
                <div>
                  <span className="text-muted-foreground">Affiliate: </span>
                  <a href={singleResult.affiliateUrl} target="_blank" rel="noopener noreferrer" className="text-primary break-all hover:underline">
                    {singleResult.affiliateUrl}
                    <ExternalLink className="w-3 h-3 inline ml-1" />
                  </a>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Bulk results */}
        {bulkResults.length > 0 && (
          <div>
            <div className="flex items-center gap-3 mb-3">
              <Badge variant="default">{bulkResults.filter((r) => r.found).length} matched</Badge>
              <Badge variant="destructive">{bulkResults.filter((r) => !r.found).length} unmatched</Badge>
            </div>
            <div className="max-h-96 overflow-y-auto rounded-lg border border-border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-10">Status</TableHead>
                    <TableHead>Brand</TableHead>
                    <TableHead>Method</TableHead>
                    <TableHead>Affiliate URL</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {bulkResults.map((r) => (
                    <TableRow key={r.brand}>
                      <TableCell>
                        {r.found ? <CheckCircle2 className="w-4 h-4 text-green-500" /> : <XCircle className="w-4 h-4 text-destructive" />}
                      </TableCell>
                      <TableCell className="font-mono text-sm">{r.brand}</TableCell>
                      <TableCell>
                        {r.method ? (
                          <Badge variant="outline" className={`text-xs ${methodBadgeColor(r.method)}`}>{r.method}</Badge>
                        ) : (
                          <span className="text-muted-foreground text-xs">—</span>
                        )}
                      </TableCell>
                      <TableCell className="max-w-xs truncate text-xs font-mono">
                        {r.affiliateUrl ? (
                          <a href={r.affiliateUrl} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                            {r.affiliateUrl.slice(0, 80)}…
                          </a>
                        ) : (
                          <span className="text-muted-foreground">No program</span>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
