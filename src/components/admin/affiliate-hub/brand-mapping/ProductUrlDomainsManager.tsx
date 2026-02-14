import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Globe, Plus, X, AlertTriangle, Save, Loader2 } from "lucide-react";
import { toast } from "sonner";

interface ProgramDomains {
  id: string;
  brand_name: string;
  region_code: string;
  store_base_url: string;
  product_url_domains: string[] | null;
}

export function ProductUrlDomainsManager() {
  const queryClient = useQueryClient();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editDomains, setEditDomains] = useState<string[]>([]);
  const [newDomain, setNewDomain] = useState("");

  const { data: programs = [] } = useQuery({
    queryKey: ["affiliate-programs-domains"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("affiliate_programs")
        .select("id, brand_name, region_code, store_base_url, product_url_domains")
        .eq("is_active", true)
        .order("brand_name");
      if (error) throw error;
      return data as ProgramDomains[];
    },
  });

  // Get all unique domains from product URLs per vendor
  const { data: productDomains = new Map<string, Set<string>>() } = useQuery({
    queryKey: ["product-url-domains-audit"],
    staleTime: 5 * 60_000,
    queryFn: async () => {
      const { data } = await supabase
        .from("filaments")
        .select("vendor, product_url")
        .not("vendor", "is", null)
        .not("product_url", "is", null);
      const map = new Map<string, Set<string>>();
      for (const row of data || []) {
        if (!row.vendor || !row.product_url) continue;
        try {
          const host = new URL(row.product_url).hostname;
          const existing = map.get(row.vendor.toLowerCase()) || new Set();
          existing.add(host);
          map.set(row.vendor.toLowerCase(), existing);
        } catch { /* skip invalid URLs */ }
      }
      return map;
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, domains }: { id: string; domains: string[] }) => {
      const { error } = await supabase
        .from("affiliate_programs")
        .update({ product_url_domains: domains.length > 0 ? domains : null })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["affiliate-programs-domains"] });
      setEditingId(null);
      toast.success("Domains updated");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const startEdit = (p: ProgramDomains) => {
    setEditingId(p.id);
    setEditDomains(p.product_url_domains || []);
    setNewDomain("");
  };

  const addDomain = () => {
    const d = newDomain.trim().toLowerCase();
    if (d && !editDomains.includes(d)) {
      setEditDomains([...editDomains, d]);
    }
    setNewDomain("");
  };

  const removeDomain = (domain: string) => {
    setEditDomains(editDomains.filter((d) => d !== domain));
  };

  // Deduplicate programs by brand_name (show one row per brand, take the first region's domains)
  const uniqueBrands = new Map<string, ProgramDomains>();
  for (const p of programs) {
    if (!uniqueBrands.has(p.brand_name)) {
      uniqueBrands.set(p.brand_name, p);
    }
  }

  const getMissingDomains = (brandName: string, configuredDomains: string[] | null): string[] => {
    const actual = productDomains.get(brandName.toLowerCase());
    if (!actual || !configuredDomains) return actual ? [...actual] : [];
    return [...actual].filter((d) => !configuredDomains.some((cd) => d.includes(cd) || cd.includes(d)));
  };

  return (
    <Card className="bg-card border-border">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <Globe className="w-5 h-5 text-primary" />
          Product URL Domains
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Configure which domains are recognized for each brand's products. Warnings appear when product URLs use unlisted domains.
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        {[...uniqueBrands.values()].map((p) => {
          const isEditing = editingId === p.id;
          const missing = getMissingDomains(p.brand_name, p.product_url_domains);

          return (
            <div key={p.id} className="p-4 rounded-lg border border-border/50 bg-muted/20 space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-sm">{p.brand_name}</span>
                  <span className="text-xs text-muted-foreground font-mono">{p.store_base_url}</span>
                </div>
                {isEditing ? (
                  <div className="flex gap-2">
                    <Button size="sm" onClick={() => updateMutation.mutate({ id: p.id, domains: editDomains })} disabled={updateMutation.isPending}>
                      {updateMutation.isPending ? <Loader2 className="w-3.5 h-3.5 mr-1 animate-spin" /> : <Save className="w-3.5 h-3.5 mr-1" />}
                      Save
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => setEditingId(null)}>Cancel</Button>
                  </div>
                ) : (
                  <Button size="sm" variant="outline" onClick={() => startEdit(p)}>Edit</Button>
                )}
              </div>

              {/* Configured domains */}
              <div className="flex flex-wrap gap-1.5">
                {(isEditing ? editDomains : p.product_url_domains || []).map((d) => (
                  <Badge key={d} variant="secondary" className="text-xs font-mono gap-1">
                    {d}
                    {isEditing && (
                      <button onClick={() => removeDomain(d)} className="ml-1 hover:text-destructive">
                        <X className="w-3 h-3" />
                      </button>
                    )}
                  </Badge>
                ))}
                {!isEditing && (!p.product_url_domains || p.product_url_domains.length === 0) && (
                  <span className="text-xs text-muted-foreground italic">No domains configured</span>
                )}
              </div>

              {/* Add domain input when editing */}
              {isEditing && (
                <div className="flex gap-2 mt-2">
                  <Input
                    value={newDomain}
                    onChange={(e) => setNewDomain(e.target.value)}
                    placeholder="e.g. store.example.com"
                    className="h-8 w-64 font-mono text-sm"
                    onKeyDown={(e) => e.key === "Enter" && addDomain()}
                  />
                  <Button size="sm" variant="outline" onClick={addDomain} disabled={!newDomain.trim()}>
                    <Plus className="w-3.5 h-3.5" />
                  </Button>
                </div>
              )}

              {/* Missing domain warning */}
              {!isEditing && missing.length > 0 && (
                <div className="flex items-start gap-2 text-xs p-2 rounded bg-yellow-500/10 border border-yellow-500/20">
                  <AlertTriangle className="w-3.5 h-3.5 text-yellow-500 mt-0.5 flex-shrink-0" />
                  <div>
                    <span className="text-yellow-500 font-medium">Unrecognized domains in products: </span>
                    <span className="font-mono text-yellow-400">{missing.join(", ")}</span>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
