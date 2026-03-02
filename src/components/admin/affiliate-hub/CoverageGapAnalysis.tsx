import { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, Info } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface Brand {
  id: string;
  brand_name: string;
  supported_regions: string[] | null;
}

interface Program {
  brand_id: string | null;
  region_code: string;
  is_active: boolean | null;
}

export const CoverageGapAnalysis = () => {
  const [brands, setBrands] = useState<Brand[]>([]);
  const [programs, setPrograms] = useState<Program[]>([]);

  useEffect(() => {
    const load = async () => {
      const [b, p] = await Promise.all([
        supabase.from("automated_brands").select("id, brand_name, supported_regions").eq("is_visible", true),
        supabase.from("affiliate_programs").select("brand_id, region_code, is_active").eq("is_active", true),
      ]);
      if (b.data) setBrands(b.data as Brand[]);
      if (p.data) setPrograms(p.data as Program[]);
    };
    load();
  }, []);

  const analysis = useMemo(() => {
    const programsByBrand = new Map<string, Set<string>>();
    for (const p of programs) {
      if (!p.brand_id) continue;
      const s = programsByBrand.get(p.brand_id) || new Set();
      s.add(p.region_code);
      programsByBrand.set(p.brand_id, s);
    }

    const noAffiliate: Brand[] = [];
    const partial: { brand: Brand; missing: string[] }[] = [];
    let withPrograms = 0;

    for (const brand of brands) {
      const regions = programsByBrand.get(brand.id);
      if (!regions || regions.size === 0) {
        noAffiliate.push(brand);
      } else {
        withPrograms++;
        const supported = brand.supported_regions ?? [];
        if (supported.length > 0) {
          const missing = supported.filter((r) => !regions.has(r));
          if (missing.length > 0) partial.push({ brand, missing });
        }
      }
    }

    return { total: brands.length, withPrograms, noAffiliate, partial };
  }, [brands, programs]);

  const pct = analysis.total > 0 ? Math.round((analysis.withPrograms / analysis.total) * 100) : 0;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Affiliate Coverage Gaps</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span>{analysis.withPrograms} of {analysis.total} brands have affiliate programs</span>
            <span className="text-muted-foreground">{pct}%</span>
          </div>
          <Progress value={pct} className="h-2" />
        </div>

        {analysis.noAffiliate.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-sm font-medium text-amber-400 flex items-center gap-1.5">
              <AlertTriangle className="h-3.5 w-3.5" /> No Affiliate Program ({analysis.noAffiliate.length})
            </h4>
            <div className="flex flex-wrap gap-2">
              {analysis.noAffiliate.map((b) => (
                <Badge key={b.id} variant="outline" className="border-amber-500/40 text-amber-300">
                  {b.brand_name}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {analysis.partial.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-sm font-medium text-blue-400 flex items-center gap-1.5">
              <Info className="h-3.5 w-3.5" /> Partial Regional Coverage ({analysis.partial.length})
            </h4>
            <div className="flex flex-wrap gap-2">
              {analysis.partial.map(({ brand, missing }) => (
                <Badge key={brand.id} variant="outline" className="border-blue-500/40 text-blue-300">
                  {brand.brand_name} — missing: {missing.join(", ")}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {analysis.noAffiliate.length === 0 && analysis.partial.length === 0 && (
          <p className="text-sm text-muted-foreground">All visible brands have full affiliate coverage. 🎉</p>
        )}
      </CardContent>
    </Card>
  );
};
