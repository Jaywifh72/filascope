import { useState, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Copy, Loader2, Zap } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import type { AffiliateProgram } from "@/types/affiliate";

interface Props {
  programs: AffiliateProgram[];
}

export function AffiliateLinkTester({ programs }: Props) {
  const [brandName, setBrandName] = useState("");
  const [regionCode, setRegionCode] = useState("");
  const [path, setPath] = useState("");
  const [result, setResult] = useState("");
  const [loading, setLoading] = useState(false);

  const uniqueBrands = useMemo(
    () => [...new Set(programs.map((p) => p.brand_name))].sort(),
    [programs]
  );

  const regionsForBrand = useMemo(
    () => programs.filter((p) => p.brand_name === brandName).map((p) => p.region_code),
    [programs, brandName]
  );

  const handleGenerate = async () => {
    if (!brandName || !regionCode) return;
    setLoading(true);
    setResult("");
    try {
      const { data, error } = await supabase.functions.invoke("generate-affiliate-link", {
        body: { brand_name: brandName, region_code: regionCode, path },
      });
      if (error) throw error;
      const url = data?.affiliate_url || "No URL generated";
      setResult(url);
      toast({ title: "Link generated" });
    } catch (e: any) {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const copyResult = () => {
    navigator.clipboard.writeText(result);
    toast({ title: "Code copied" });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <Zap className="w-4 h-4 text-primary" /> Affiliate Link Tester
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 items-end">
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1 block">Brand</label>
            <Select value={brandName} onValueChange={(v) => { setBrandName(v); setRegionCode(""); }}>
              <SelectTrigger><SelectValue placeholder="Select brand" /></SelectTrigger>
              <SelectContent>
                {uniqueBrands.map((b) => <SelectItem key={b} value={b}>{b}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1 block">Region</label>
            <Select value={regionCode} onValueChange={setRegionCode} disabled={!brandName}>
              <SelectTrigger><SelectValue placeholder="Region" /></SelectTrigger>
              <SelectContent>
                {regionsForBrand.map((r) => <SelectItem key={r} value={r}>{r}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1 block">Path</label>
            <Input value={path} onChange={(e) => setPath(e.target.value)} placeholder="products/kobra-s1-max" />
          </div>
          <Button onClick={handleGenerate} disabled={loading || !brandName || !regionCode}>
            {loading ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : null}
            Generate Link
          </Button>
        </div>
        {result && (
          <div className="mt-4 flex gap-2">
            <Input readOnly value={result} className="font-mono text-xs" />
            <Button variant="outline" size="icon" onClick={copyResult}>
              <Copy className="w-4 h-4" />
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
