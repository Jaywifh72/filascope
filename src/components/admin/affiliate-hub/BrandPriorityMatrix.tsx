import { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Save } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

interface StoreRow {
  id: string;
  brand_id: string;
  region_code: string;
  affiliate_priority_boost: number;
}

interface BrandInfo {
  id: string;
  brand_name: string;
}

interface AffiliateProgram {
  brand_id: string | null;
  region_code: string;
  is_active: boolean | null;
}

type Filter = "all" | "affiliated" | "none";

export const BrandPriorityMatrix = () => {
  const [stores, setStores] = useState<StoreRow[]>([]);
  const [brands, setBrands] = useState<BrandInfo[]>([]);
  const [programs, setPrograms] = useState<AffiliateProgram[]>([]);
  const [edits, setEdits] = useState<Record<string, number>>({});
  const [filter, setFilter] = useState<Filter>("all");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const load = async () => {
      const [storeRes, brandRes, progRes] = await Promise.all([
        supabase.from("brand_regional_stores").select("id, brand_id, region_code, affiliate_priority_boost"),
        supabase.from("automated_brands").select("id, brand_name"),
        supabase.from("affiliate_programs").select("brand_id, region_code, is_active"),
      ]);
      if (storeRes.data) setStores(storeRes.data as StoreRow[]);
      if (brandRes.data) setBrands(brandRes.data as BrandInfo[]);
      if (progRes.data) setPrograms(progRes.data as AffiliateProgram[]);
    };
    load();
  }, []);

  const regions = useMemo(() => {
    const s = new Set(stores.map((r) => r.region_code));
    return Array.from(s).sort();
  }, [stores]);

  const brandMap = useMemo(() => new Map(brands.map((b) => [b.id, b.brand_name])), [brands]);

  const affiliateSet = useMemo(() => {
    const s = new Set<string>();
    for (const p of programs) {
      if (p.brand_id && p.is_active) s.add(`${p.brand_id}::${p.region_code}`);
    }
    return s;
  }, [programs]);

  const affiliatedBrandIds = useMemo(() => {
    const s = new Set<string>();
    for (const p of programs) {
      if (p.brand_id && p.is_active) s.add(p.brand_id);
    }
    return s;
  }, [programs]);

  const grouped = useMemo(() => {
    const map = new Map<string, StoreRow[]>();
    for (const s of stores) {
      const arr = map.get(s.brand_id) || [];
      arr.push(s);
      map.set(s.brand_id, arr);
    }
    let entries = Array.from(map.entries());
    if (filter === "affiliated") entries = entries.filter(([bid]) => affiliatedBrandIds.has(bid));
    if (filter === "none") entries = entries.filter(([bid]) => !affiliatedBrandIds.has(bid));
    return entries.sort(([a], [b]) => (brandMap.get(a) ?? "").localeCompare(brandMap.get(b) ?? ""));
  }, [stores, filter, affiliatedBrandIds, brandMap]);

  const getValue = (store: StoreRow) => edits[store.id] ?? store.affiliate_priority_boost;

  const setVal = (id: string, v: number) => setEdits((e) => ({ ...e, [id]: Math.min(100, Math.max(0, v)) }));

  const changeCount = Object.keys(edits).length;

  const applyPreset = (preset: string) => {
    const next: Record<string, number> = {};
    for (const [brandId, rows] of grouped) {
      for (const row of rows) {
        const isAffiliated = affiliateSet.has(`${brandId}::${row.region_code}`);
        if (preset === "aff75" && isAffiliated) next[row.id] = 75;
        else if (preset === "aff50" && isAffiliated) next[row.id] = 50;
        else if (preset === "reset") next[row.id] = 0;
        else if (preset === "max") next[row.id] = isAffiliated ? 100 : 0;
      }
    }
    setEdits((e) => ({ ...e, ...next }));
  };

  const saveAll = async () => {
    if (changeCount === 0) return;
    setSaving(true);
    const ids = Object.keys(edits);
    let errors = 0;
    for (const id of ids) {
      const { error } = await supabase
        .from("brand_regional_stores")
        .update({ affiliate_priority_boost: edits[id] } as Record<string, unknown>)
        .eq("id", id);
      if (error) errors++;
    }
    setSaving(false);
    if (errors) {
      toast({ title: `Saved with ${errors} error(s)`, variant: "destructive" });
    } else {
      toast({ title: `${ids.length} boost value(s) saved` });
      setStores((prev) =>
        prev.map((s) => (edits[s.id] !== undefined ? { ...s, affiliate_priority_boost: edits[s.id] } : s))
      );
      setEdits({});
    }
  };

  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between gap-4 space-y-0">
        <CardTitle className="text-lg">Brand Affiliate Boost by Region</CardTitle>
        <div className="flex items-center gap-2">
          <div className="flex gap-1">
            {(["all", "affiliated", "none"] as Filter[]).map((f) => (
              <Button key={f} size="sm" variant={filter === f ? "default" : "outline"} onClick={() => setFilter(f)}>
                {f === "all" ? "All Brands" : f === "affiliated" ? "Affiliated Only" : "No Affiliate"}
              </Button>
            ))}
          </div>
          <Select onValueChange={applyPreset}>
            <SelectTrigger className="w-44">
              <SelectValue placeholder="Quick Set…" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="aff75">Affiliated → 75</SelectItem>
              <SelectItem value="aff50">Affiliated → 50</SelectItem>
              <SelectItem value="max">Affiliated max, rest 0</SelectItem>
              <SelectItem value="reset">Reset all to 0</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left text-muted-foreground">
                <th className="py-2 pr-4 font-medium">Brand</th>
                {regions.map((r) => (
                  <th key={r} className="px-2 py-2 text-center font-medium">{r}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {grouped.map(([brandId, rows]) => (
                <tr key={brandId} className="border-b border-border/50">
                  <td className="py-2 pr-4 font-medium">{brandMap.get(brandId) ?? brandId.slice(0, 8)}</td>
                  {regions.map((region) => {
                    const store = rows.find((r) => r.region_code === region);
                    if (!store) return <td key={region} className="px-2 py-2 text-center text-muted-foreground">—</td>;
                    const isAffiliated = affiliateSet.has(`${brandId}::${region}`);
                    return (
                      <td key={region} className="px-2 py-2">
                        <div className="flex items-center justify-center gap-1.5">
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger>
                                <span
                                  className={`inline-block h-2.5 w-2.5 rounded-full ${
                                    isAffiliated ? "bg-emerald-500" : "bg-muted-foreground/40"
                                  }`}
                                />
                              </TooltipTrigger>
                              <TooltipContent>
                                {isAffiliated ? "Active affiliate program" : "No affiliate program"}
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                          <Input
                            type="number"
                            min={0}
                            max={100}
                            value={getValue(store)}
                            onChange={(e) => setVal(store.id, Number(e.target.value))}
                            className="h-7 w-14 px-1 text-center text-xs"
                          />
                        </div>
                      </td>
                    );
                  })}
                </tr>
              ))}
              {grouped.length === 0 && (
                <tr>
                  <td colSpan={regions.length + 1} className="py-8 text-center text-muted-foreground">
                    No brand regional stores found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <div className="mt-4 flex items-center justify-between">
          {changeCount > 0 && (
            <Badge variant="secondary">{changeCount} unsaved change(s)</Badge>
          )}
          <Button onClick={saveAll} disabled={saving || changeCount === 0} className="ml-auto gap-2">
            <Save className="h-4 w-4" />
            {saving ? "Saving…" : "Save All Changes"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
