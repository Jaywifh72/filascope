import { useMemo } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useBrowseHistory } from "@/hooks/useBrowseHistory";
import { useAuth } from "@/hooks/useAuth";
import { useRegion } from "@/contexts/RegionContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Sparkles, X, Printer, TrendingDown, Star } from "lucide-react";
import { useState } from "react";

interface Recommendation {
  id: string;
  type: "material" | "brand" | "printer_suggestion" | "cheaper_alternative";
  reason: string;
  filament?: {
    id: string;
    product_title: string;
    vendor: string | null;
    material: string | null;
    featured_image: string | null;
    color_hex: string | null;
    variant_price: number | null;
  };
}

export function BrowsingRecommendations() {
  const { user } = useAuth();
  const { history } = useBrowseHistory(50);
  const { formatPrice, convertPrice, hasRates, currency } = useRegion();
  const [dismissed, setDismissed] = useState<Set<string>>(new Set());

  // Analyze browsing patterns
  const patterns = useMemo(() => {
    const materialCounts: Record<string, number> = {};
    const brandCounts: Record<string, number> = {};
    const viewedIds = new Set<string>();
    let hasViewedPrinters = false;
    const prices: number[] = [];

    history.forEach((item) => {
      viewedIds.add(item.product_id);
      if (item.product_type === "printer") {
        hasViewedPrinters = true;
      }
      if (item.filament) {
        if (item.filament.material) {
          const baseMat = item.filament.material.split(/[\s-]/)[0].toUpperCase();
          materialCounts[baseMat] = (materialCounts[baseMat] || 0) + 1;
        }
        if (item.filament.vendor) {
          brandCounts[item.filament.vendor] = (brandCounts[item.filament.vendor] || 0) + 1;
        }
        if (item.filament.variant_price) {
          prices.push(item.filament.variant_price);
        }
      }
    });

    // Top materials (viewed 3+ times)
    const topMaterials = Object.entries(materialCounts)
      .filter(([, count]) => count >= 3)
      .sort((a, b) => b[1] - a[1])
      .map(([mat]) => mat);

    // Top brands (viewed 2+ times)
    const topBrands = Object.entries(brandCounts)
      .filter(([, count]) => count >= 2)
      .sort((a, b) => b[1] - a[1])
      .map(([brand]) => brand);

    const avgPrice = prices.length > 0 ? prices.reduce((a, b) => a + b, 0) / prices.length : 0;

    return {
      topMaterials,
      topBrands,
      viewedIds,
      hasViewedPrinters,
      avgPrice,
      hasEnoughData: history.length >= 3,
    };
  }, [history]);

  // Fetch recommendations based on patterns
  const { data: recommendations } = useQuery({
    queryKey: ["browsing-recommendations", patterns.topMaterials, patterns.topBrands, patterns.avgPrice],
    queryFn: async (): Promise<Recommendation[]> => {
      if (!patterns.hasEnoughData) return [];

      const recs: Recommendation[] = [];

      // 1. Material-based: suggest highest-rated filament of top material user hasn't seen
      if (patterns.topMaterials.length > 0) {
        const topMat = patterns.topMaterials[0];
        const { data: matRecs } = await supabase
          .from("filaments")
          .select("id, product_title, vendor, material, featured_image, color_hex, variant_price")
          .ilike("material", `${topMat}%`)
          .not("id", "in", `(${Array.from(patterns.viewedIds).slice(0, 50).join(",") || "00000000-0000-0000-0000-000000000000"})`)
          .not("variant_price", "is", null)
          .order("variant_price", { ascending: false })
          .limit(5);

        if (matRecs && matRecs.length > 0) {
          // Pick one with good price
          const pick = matRecs[Math.floor(matRecs.length / 2)];
          recs.push({
            id: `mat-${pick.id}`,
            type: "material",
            reason: `Because you've been exploring ${topMat} filaments`,
            filament: pick,
          });
        }
      }

      // 2. Brand-based: suggest another product from a brand they like
      if (patterns.topBrands.length > 0) {
        const topBrand = patterns.topBrands[0];
        const { data: brandRecs } = await supabase
          .from("filaments")
          .select("id, product_title, vendor, material, featured_image, color_hex, variant_price")
          .eq("vendor", topBrand)
          .not("id", "in", `(${Array.from(patterns.viewedIds).slice(0, 50).join(",") || "00000000-0000-0000-0000-000000000000"})`)
          .not("variant_price", "is", null)
          .limit(3);

        if (brandRecs && brandRecs.length > 0) {
          const pick = brandRecs[0];
          recs.push({
            id: `brand-${pick.id}`,
            type: "brand",
            reason: `More from ${topBrand}`,
            filament: pick,
          });
        }
      }

      // 3. Printer suggestion if user only viewed filaments
      if (!patterns.hasViewedPrinters && history.length >= 5) {
        recs.push({
          id: "printer-suggestion",
          type: "printer_suggestion",
          reason: "Need a printer? Check our recommendations",
        });
      }

      // 4. Cheaper alternative for expensive viewed items
      if (patterns.avgPrice > 25 && patterns.topMaterials.length > 0) {
        const topMat = patterns.topMaterials[0];
        const { data: cheapRecs } = await supabase
          .from("filaments")
          .select("id, product_title, vendor, material, featured_image, color_hex, variant_price")
          .ilike("material", `${topMat}%`)
          .not("id", "in", `(${Array.from(patterns.viewedIds).slice(0, 50).join(",") || "00000000-0000-0000-0000-000000000000"})`)
          .not("variant_price", "is", null)
          .lt("variant_price", patterns.avgPrice * 0.7)
          .gt("variant_price", 5)
          .order("variant_price", { ascending: true })
          .limit(3);

        if (cheapRecs && cheapRecs.length > 0) {
          const pick = cheapRecs[0];
          recs.push({
            id: `cheap-${pick.id}`,
            type: "cheaper_alternative",
            reason: `Similar ${topMat} for less`,
            filament: pick,
          });
        }
      }

      return recs;
    },
    enabled: patterns.hasEnoughData,
    staleTime: 1000 * 60 * 5,
  });

  const visibleRecs = (recommendations || []).filter((r) => !dismissed.has(r.id)).slice(0, 4);

  if (visibleRecs.length === 0) return null;

  const typeIcon = {
    material: Star,
    brand: Sparkles,
    printer_suggestion: Printer,
    cheaper_alternative: TrendingDown,
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-primary" />
          <CardTitle className="text-base">Based on Your Browsing</CardTitle>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="grid gap-3 sm:grid-cols-2">
          {visibleRecs.map((rec) => {
            const Icon = typeIcon[rec.type];

            if (rec.type === "printer_suggestion") {
              return (
                <Link
                  key={rec.id}
                  to="/printers"
                  className="relative flex items-center gap-3 p-3 rounded-lg border border-border hover:border-primary/40 hover:bg-primary/5 transition-all group"
                >
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                    <Printer className="w-5 h-5 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground">
                      Explore Printers
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {rec.reason}
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="absolute top-1 right-1 h-6 w-6 opacity-0 group-hover:opacity-100"
                    onClick={(e) => {
                      e.preventDefault();
                      setDismissed((prev) => new Set([...prev, rec.id]));
                    }}
                  >
                    <X className="w-3 h-3" />
                  </Button>
                </Link>
              );
            }

            if (!rec.filament) return null;

            const displayPrice =
              rec.filament.variant_price && hasRates
                ? formatPrice(convertPrice(rec.filament.variant_price, "USD"), {
                    showApproximate: currency !== "USD",
                  })
                : rec.filament.variant_price
                  ? `$${rec.filament.variant_price.toFixed(2)}`
                  : null;

            return (
              <Link
                key={rec.id}
                to={`/filament/${rec.filament.id}`}
                className="relative flex items-center gap-3 p-3 rounded-lg border border-border hover:border-primary/40 hover:bg-primary/5 transition-all group"
              >
                {/* Thumbnail */}
                <div className="w-12 h-12 rounded-lg overflow-hidden border border-border bg-muted/30 shrink-0">
                  {rec.filament.featured_image ? (
                    <img
                      src={rec.filament.featured_image}
                      alt={`${rec.filament.product_title} filament`}
                      className="w-full h-full object-cover"
                      loading="lazy"
                    />
                  ) : rec.filament.color_hex ? (
                    <div
                      className="w-full h-full"
                      style={{ backgroundColor: rec.filament.color_hex }}
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Icon className="w-4 h-4 text-muted-foreground" />
                    </div>
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate text-foreground">
                    {rec.filament.product_title}
                  </p>
                  <p className="text-xs text-muted-foreground truncate">
                    {rec.reason}
                  </p>
                  <div className="flex items-center gap-2 mt-0.5">
                    {rec.filament.material && (
                      <Badge
                        variant="secondary"
                        className="text-[10px] px-1.5 py-0"
                      >
                        {rec.filament.material}
                      </Badge>
                    )}
                    {displayPrice && (
                      <span className="text-xs font-semibold text-primary">
                        {displayPrice}
                      </span>
                    )}
                  </div>
                </div>

                {/* Dismiss */}
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute top-1 right-1 h-6 w-6 opacity-0 group-hover:opacity-100"
                  onClick={(e) => {
                    e.preventDefault();
                    setDismissed((prev) => new Set([...prev, rec.id]));
                  }}
                >
                  <X className="w-3 h-3" />
                </Button>
              </Link>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
