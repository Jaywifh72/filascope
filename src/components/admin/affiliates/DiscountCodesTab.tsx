import { useState, useMemo } from "react";
import { useAffiliatePrograms, useAffiliateDiscountCodes, useUpdateDiscountCode } from "@/hooks/useAffiliatePrograms";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableHeader, TableHead, TableBody, TableRow, TableCell } from "@/components/ui/table";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Copy, Pencil, Plus } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { DiscountCodeFormDialog } from "./DiscountCodeFormDialog";
import type { AffiliateDiscountCode } from "@/types/affiliate";

export function DiscountCodesTab() {
  const { data: programs } = useAffiliatePrograms();
  const [brandFilter, setBrandFilter] = useState("all");
  const [regionFilter, setRegionFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [editingCode, setEditingCode] = useState<AffiliateDiscountCode | null>(null);
  const [showAdd, setShowAdd] = useState(false);
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

  // Build a lookup from program_id to brand+region
  const programMap = useMemo(() => {
    const m = new Map<string, { brand: string; region: string }>();
    (programs || []).forEach((p) => m.set(p.id, { brand: p.brand_name, region: p.region_code }));
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

  const handleToggleActive = (code: AffiliateDiscountCode) => {
    updateCode.mutate(
      { id: code.id, program_id: code.program_id, is_active: !code.is_active },
      {
        onSuccess: () => toast({ title: "Code updated" }),
        onError: (e) => toast({ title: "Error", description: e.message, variant: "destructive" }),
      }
    );
  };

  const copyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    toast({ title: "Code copied" });
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
          <Button size="sm" onClick={() => setShowAdd(true)}>
            <Plus className="w-4 h-4 mr-1" /> Add Code
          </Button>
        </div>
      </div>

      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <p className="text-muted-foreground text-sm py-8 text-center">Loading codes…</p>
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
                  return (
                    <TableRow key={c.id}>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <code className="text-xs font-mono bg-muted px-1.5 py-0.5 rounded">{c.code}</code>
                          {c.code && (
                            <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => copyCode(c.code!)}>
                              <Copy className="w-3 h-3" />
                            </Button>
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
                {filteredCodes.length === 0 && (
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
          if (!open) { setShowAdd(false); setEditingCode(null); }
        }}
        code={editingCode}
        programs={programs || []}
      />
    </div>
  );
}
