import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, Plus } from "lucide-react";
import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

interface UnmatchedBrand {
  vendor: string;
  count: number;
}

export function UnmatchedBrandsReport() {
  const queryClient = useQueryClient();
  const [creatingFor, setCreatingFor] = useState<string | null>(null);
  const [affiliateName, setAffiliateName] = useState("");

  const { data: unmatched = [], isLoading } = useQuery({
    queryKey: ["unmatched-brands"],
    staleTime: 2 * 60_000,
    queryFn: async () => {
      // Get distinct vendors with counts
      const { data: vendorData, error: vendorErr } = await supabase
        .from("filaments")
        .select("vendor")
        .not("vendor", "is", null);
      if (vendorErr) throw vendorErr;

      const vendorCounts = new Map<string, number>();
      for (const row of vendorData || []) {
        if (!row.vendor) continue;
        vendorCounts.set(row.vendor, (vendorCounts.get(row.vendor) || 0) + 1);
      }

      // Get aliases
      const { data: aliases } = await supabase.from("brand_affiliate_aliases").select("product_vendor_name");
      const aliasSet = new Set((aliases || []).map((a) => a.product_vendor_name.toLowerCase()));

      // Get affiliate program brand names
      const { data: programs } = await supabase.from("affiliate_programs").select("brand_name");
      const programSet = new Set((programs || []).map((p) => p.brand_name.toLowerCase()));

      const results: UnmatchedBrand[] = [];
      for (const [vendor, count] of vendorCounts) {
        const lv = vendor.toLowerCase();
        if (!aliasSet.has(lv) && !programSet.has(lv)) {
          results.push({ vendor, count });
        }
      }
      return results.sort((a, b) => b.count - a.count);
    },
  });

  const createAliasMutation = useMutation({
    mutationFn: async ({ vendor, affiliate }: { vendor: string; affiliate: string }) => {
      const { error } = await supabase
        .from("brand_affiliate_aliases")
        .insert({ product_vendor_name: vendor, affiliate_brand_name: affiliate });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["brand-affiliate-aliases-all"] });
      queryClient.invalidateQueries({ queryKey: ["brand-affiliate-alias"] });
      queryClient.invalidateQueries({ queryKey: ["unmatched-brands"] });
      setCreatingFor(null);
      setAffiliateName("");
      toast.success("Alias created");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  if (isLoading) return null;
  if (unmatched.length === 0) {
    return (
      <Card className="bg-card border-border">
        <CardContent className="p-6 text-center text-muted-foreground">
          ✅ All product brands are mapped to affiliate programs or aliases.
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-card border-border">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <AlertTriangle className="w-5 h-5 text-yellow-500" />
          Unmatched Brands
          <Badge variant="secondary" className="ml-2">{unmatched.length}</Badge>
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          These brands have products in the database but no affiliate program or alias mapping.
        </p>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {unmatched.map((b) => (
            <div key={b.vendor} className="flex items-center justify-between p-3 rounded-lg bg-muted/30 border border-border/50">
              <div className="flex items-center gap-3">
                <span className="font-mono text-sm font-medium">{b.vendor}</span>
                <Badge variant="outline" className="text-xs">{b.count} products</Badge>
              </div>
              {creatingFor === b.vendor ? (
                <div className="flex items-center gap-2">
                  <Input
                    value={affiliateName}
                    onChange={(e) => setAffiliateName(e.target.value)}
                    placeholder="Affiliate brand name"
                    className="h-8 w-48"
                    autoFocus
                  />
                  <Button
                    size="sm"
                    variant="default"
                    disabled={!affiliateName.trim() || createAliasMutation.isPending}
                    onClick={() => createAliasMutation.mutate({ vendor: b.vendor, affiliate: affiliateName.trim() })}
                  >
                    Save
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => { setCreatingFor(null); setAffiliateName(""); }}>
                    Cancel
                  </Button>
                </div>
              ) : (
                <Button size="sm" variant="outline" onClick={() => { setCreatingFor(b.vendor); setAffiliateName(b.vendor); }}>
                  <Plus className="w-3.5 h-3.5 mr-1" /> Create Mapping
                </Button>
              )}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
