import { useState, useMemo } from "react";
import { useAffiliatePrograms, useAffiliateDiscountCodes, useUpdateDiscountCode } from "@/hooks/useAffiliatePrograms";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableHeader, TableHead, TableBody, TableRow, TableCell } from "@/components/ui/table";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertTriangle, Copy, ExternalLink, Pencil, Plus, Tag } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { DiscountCodeFormDialog } from "./DiscountCodeFormDialog";
import type { AffiliateDiscountCode } from "@/types/affiliate";

/** Check if a code row is a placeholder (inactive + CHECK-DASHBOARD code) */
function isPlaceholderCode(c: AffiliateDiscountCode): boolean {
  return !c.is_active && c.code === "CHECK-DASHBOARD";
}

export function DiscountCodesTab() {
  const { data: programs } = useAffiliatePrograms();
  const [brandFilter, setBrandFilter] = useState("all");
  const [regionFilter, setRegionFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [editingCode, setEditingCode] = useState<AffiliateDiscountCode | null>(null);
  const [showAdd, setShowAdd] = useState(false);
  const [prefillProgramId, setPrefillProgramId] = useState<string | null>(null);
  const updateCode = useUpdateDiscountCode();

  const uniqueBrands = useMemo(
    () => [...new Set((programs || []).map((p) => p.brand_name))].sort(),
    [programs]
  );

  const uniqueRegions = useMemo(
    () => [...new Set((programs || []).map((p) => p.region_code))].sort(),
    [programs]
  );

  // Get program IDs matching filters
  const filteredProgramIds = useMemo(() => {
    if (!programs) return [];
    return programs
      .filter((p) => brandFilter === "all" || p.brand_name === brandFilter)
      .filter((p) => regionFilter === "all" || p.region_code === regionFilter)
      .map((p) => p.id);
  }, [programs, brandFilter, regionFilter]);

  const allProgramIds = useMemo(() => (programs || []).map((p) => p.id), [programs]);
  const queryIds = filteredProgramIds.length > 0 ? filteredProgramIds : allProgramIds;

  const { data: codes, isLoading } = useAffiliateDiscountCodes(undefined, queryIds);

  // Build a lookup from program_id to brand+region+network
  const programMap = useMemo(() => {
    const m = new Map<string, { brand: string; region: string; network: string; portalUrl: string | null }>();
    (programs || []).forEach((p) => m.set(p.id, { brand: p.brand_name, region: p.region_code, network: p.affiliate_network, portalUrl: p.portal_url }));
    return m;
  }, [programs]);

  const filteredCodes = useMemo(() => {
    if (!codes) return [];
    return codes.filter((c) => {
      if (statusFilter === "active" && !c.is_active) return false;
      if (statusFilter === "inactive" && c.is_active) return false;
      return true;
    });
  }, [codes, statusFilter]);

  // Determine if we're filtering to a specific brand+region with no codes
  const isFilteredEmpty = filteredCodes.length === 0 && (brandFilter !== "all" || regionFilter !== "all");
  const filteredBrandLabel = brandFilter !== "all" ? brandFilter : null;
  const filteredRegionLabel = regionFilter !== "all" ? regionFilter : null;

  // Check if any visible codes are placeholders — show info banner
  const hasPlaceholders = filteredCodes.some(isPlaceholderCode);
  const placeholderProgram = hasPlaceholders
    ? (() => {
        const pc = filteredCodes.find(isPlaceholderCode);
        return pc ? programMap.get(pc.program_id) : null;
      })()
    : null;

  const handleToggleActive = (code: AffiliateDiscountCode) => {
    const wasPlaceholder = isPlaceholderCode(code);
    updateCode.mutate(
      { id: code.id, program_id: code.program_id, is_active: !code.is_active },
      {
        onSuccess: () => {
          if (!code.is_active && wasPlaceholder) {
            toast({ title: "Coupon code activated" });
          } else {
            toast({ title: "Code updated" });
          }
        },
        onError: (e) => toast({ title: "Error", description: e.message, variant: "destructive" }),
      }
    );
  };

  const copyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    toast({ title: "Copied" });
  };

  const handleAddFromEmpty = () => {
    const matchingProgram = (programs || []).find(
      (p) =>
        (brandFilter === "all" || p.brand_name === brandFilter) &&
        (regionFilter === "all" || p.region_code === regionFilter)
    );
    setPrefillProgramId(matchingProgram?.id || null);
    setShowAdd(true);
  };

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <Select value={brandFilter} onValueChange={setBrandFilter}>
          <SelectTrigger className="w-[180px]"><SelectValue placeholder="Brand" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Brands</SelectItem>
            {uniqueBrands.map((b) => <SelectItem key={b} value={b}>{b}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={regionFilter} onValueChange={setRegionFilter}>
          <SelectTrigger className="w-[120px]"><SelectValue placeholder="Region" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Regions</SelectItem>
            {uniqueRegions.map((r) => <SelectItem key={r} value={r}>{r}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[120px]"><SelectValue placeholder="Status" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="inactive">Inactive</SelectItem>
          </SelectContent>
        </Select>
        <div className="ml-auto">
          <Button size="sm" onClick={() => { setPrefillProgramId(null); setShowAdd(true); }}>
            <Plus className="w-4 h-4 mr-1" /> Add Code
          </Button>
        </div>
      </div>

      {/* Placeholder info banner */}
      {hasPlaceholders && (
        <div className="flex items-start gap-3 rounded-lg border border-amber-500/30 bg-amber-500/5 px-4 py-3">
          <AlertTriangle className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
          <div className="space-y-1 text-sm">
            <p className="text-foreground font-medium">No active coupon code confirmed yet</p>
            <p className="text-muted-foreground text-xs">
              Check your UpPromote dashboard for an assigned coupon code, then edit the placeholder row with the real code and activate it.
            </p>
            {placeholderProgram?.portalUrl && (
              <a
                href={placeholderProgram.portalUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-xs text-primary hover:underline mt-1"
              >
                Open UpPromote Dashboard
                <ExternalLink className="w-3 h-3" />
              </a>
            )}
          </div>
        </div>
      )}

      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <p className="text-muted-foreground text-sm py-8 text-center">Loading codes…</p>
          ) : isFilteredEmpty ? (
            <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
              <Tag className="w-10 h-10 text-muted-foreground mb-3" />
              <h3 className="text-sm font-semibold text-foreground mb-1">
                No discount codes{filteredBrandLabel ? ` for ${filteredBrandLabel}` : ""}{filteredRegionLabel ? ` ${filteredRegionLabel}` : ""}
              </h3>
              <p className="text-xs text-muted-foreground max-w-sm mb-4">
                No codes have been added yet for this region. Add one using the button below when promotional codes are available.
              </p>
              <Button size="sm" onClick={handleAddFromEmpty}>
                <Plus className="w-4 h-4 mr-1" /> Add Discount Code
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Code</TableHead>
                  <TableHead>Brand / Region</TableHead>
                  <TableHead>Type / Value</TableHead>
                  <TableHead>Display Text</TableHead>
                  <TableHead>Exclusive</TableHead>
                  <TableHead>Active</TableHead>
                  <TableHead>Valid Until</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredCodes.map((c) => {
                  const info = programMap.get(c.program_id);
                  const placeholder = isPlaceholderCode(c);
                  return (
                    <TableRow key={c.id} className={placeholder ? "bg-amber-500/5" : undefined}>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          {placeholder ? (
                            <Badge variant="outline" className="bg-amber-500/10 text-amber-400 border-amber-500/30 text-xs">
                              Placeholder
                            </Badge>
                          ) : (
                            <>
                              <code className="text-xs font-mono bg-muted px-1.5 py-0.5 rounded">{c.code}</code>
                              {c.code && (
                                <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => copyCode(c.code!)}>
                                  <Copy className="w-3 h-3" />
                                </Button>
                              )}
                            </>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="inline-flex items-center rounded-full bg-secondary px-2 py-0.5 text-xs font-medium">
                          {info?.brand || "?"} · {info?.region || "?"}
                        </span>
                      </TableCell>
                      <TableCell className="text-sm">
                        {c.discount_type === "fixed"
                          ? `Fixed — $${c.discount_value}`
                          : c.discount_value != null
                          ? `${c.discount_value}%`
                          : "—"}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground max-w-[200px] truncate">
                        {c.display_text || "—"}
                      </TableCell>
                      <TableCell>
                      {c.is_exclusive ? (
                          <span className="inline-flex items-center rounded-full bg-accent text-accent-foreground px-2 py-0.5 text-xs font-medium">Yes</span>
                        ) : (
                          <span className="text-xs text-muted-foreground">No</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <Switch checked={!!c.is_active} onCheckedChange={() => handleToggleActive(c)} />
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {c.valid_until ? new Date(c.valid_until).toLocaleDateString() : "No expiry"}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="icon" onClick={() => setEditingCode(c)}>
                          <Pencil className="w-4 h-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
                {filteredCodes.length === 0 && !isFilteredEmpty && (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center text-muted-foreground py-8">
                      No discount codes found
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <DiscountCodeFormDialog
        open={showAdd || !!editingCode}
        onOpenChange={(open) => {
          if (!open) { setShowAdd(false); setEditingCode(null); setPrefillProgramId(null); }
        }}
        code={editingCode}
        programs={programs || []}
        prefillProgramId={prefillProgramId}
      />
    </div>
  );
}
