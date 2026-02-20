import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toBrandSlug } from "@/utils/brandSlug";
import { ExternalLink } from "lucide-react";

interface TopBrand {
  vendor: string;
  count: number;
}

interface MaterialBrandComparisonTableProps {
  topBrands: TopBrand[];
  material: string;
}

/** Static "Best For" descriptors per brand — curated editorial copy */
const BRAND_BEST_FOR: Record<string, string> = {
  "Bambu Lab": "High-speed printing, AMS compatibility",
  "Polymaker": "Wide color selection, engineering grades",
  "Prusament": "Tight tolerances, verified lab quality",
  "eSUN": "Budget-friendly, broadest material range",
  "Hatchbox": "Value pick, consistent quality",
  "Overture": "Budget prints, matte finishes",
  "MatterHackers": "Premium & specialty materials",
  "ColorFabb": "Specialty & composite filaments",
  "Fillamentum": "European quality, vibrant colors",
  "Amolen": "Silk & dual-color effects",
  "Sunlu": "Budget-conscious, wide color range",
  "Anycubic": "Printer-matched filament bundles",
  "Creality": "Optimized for Creality printers",
  "Eryone": "Affordable silk & matte options",
  "Inland": "Micro Center value brand",
  "3DXTech": "Engineering & composite grades",
  "Fiberlogy": "EU precision, specialty filaments",
  "FormFutura": "Specialty & advanced materials",
  "Prusa Research": "Tight tolerances, open-source quality",
};

function useBrandPriceRanges(vendors: string[], material: string) {
  return useQuery({
    queryKey: ["brand-price-ranges", vendors.join(","), material],
    queryFn: async () => {
      if (vendors.length === 0) return {};
      const { data } = await supabase
        .from("filaments")
        .select("vendor, variant_price, net_weight_g")
        .in("vendor", vendors)
        .ilike("material", `%${material}%`)
        .not("variant_price", "is", null)
        .not("net_weight_g", "is", null)
        .gt("net_weight_g", 0);

      const ranges: Record<string, { min: number; max: number }> = {};
      (data ?? []).forEach((row) => {
        if (!row.vendor || !row.variant_price || !row.net_weight_g) return;
        const pricePerKg = (row.variant_price / row.net_weight_g) * 1000;
        if (!ranges[row.vendor]) {
          ranges[row.vendor] = { min: pricePerKg, max: pricePerKg };
        } else {
          ranges[row.vendor].min = Math.min(ranges[row.vendor].min, pricePerKg);
          ranges[row.vendor].max = Math.max(ranges[row.vendor].max, pricePerKg);
        }
      });
      return ranges;
    },
    staleTime: 1000 * 60 * 30,
    enabled: vendors.length > 0,
  });
}

function formatPriceRange(range: { min: number; max: number } | undefined): string {
  if (!range) return "—";
  const fmt = (v: number) => `$${v.toFixed(2)}`;
  if (Math.abs(range.max - range.min) < 0.5) return `${fmt(range.min)}/kg`;
  return `${fmt(range.min)} – ${fmt(range.max)}/kg`;
}

export function MaterialBrandComparisonTable({ topBrands, material }: MaterialBrandComparisonTableProps) {
  const displayBrands = topBrands.slice(0, 6);
  const vendors = displayBrands.map((b) => b.vendor);
  const { data: priceRanges } = useBrandPriceRanges(vendors, material);

  if (displayBrands.length < 2) return null;

  return (
    <section className="mb-10" aria-label={`Top ${material} brands comparison`}>
      <h2 className="text-xl font-semibold mb-4">Top {material} Brands Compared</h2>
      <div className="overflow-x-auto rounded-xl border border-border">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-muted/50">
              <th className="text-left px-4 py-3 font-semibold text-foreground">Brand</th>
              <th className="text-left px-4 py-3 font-semibold text-foreground hidden sm:table-cell">Products</th>
              <th className="text-left px-4 py-3 font-semibold text-foreground">Price Range</th>
              <th className="text-left px-4 py-3 font-semibold text-foreground hidden md:table-cell">Best For</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody>
            {displayBrands.map(({ vendor, count }, idx) => {
              const brandSlug = toBrandSlug(vendor);
              const range = priceRanges?.[vendor];
              const bestFor = BRAND_BEST_FOR[vendor] ?? "Quality filaments";
              return (
                <tr
                  key={vendor}
                  className={`border-b border-border last:border-0 hover:bg-muted/30 transition-colors ${idx % 2 === 0 ? "" : "bg-muted/10"}`}
                >
                  <td className="px-4 py-3">
                    <a
                      href={`/brands/${brandSlug}`}
                      className="font-medium text-foreground hover:text-primary transition-colors"
                    >
                      {vendor}
                    </a>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground hidden sm:table-cell">{count}</td>
                  <td className="px-4 py-3 text-muted-foreground tabular-nums">
                    {formatPriceRange(range)}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground hidden md:table-cell">{bestFor}</td>
                  <td className="px-4 py-3">
                    <a
                      href={`/brands/${brandSlug}`}
                      className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
                      aria-label={`View all ${vendor} filaments`}
                    >
                      View <ExternalLink className="w-3 h-3" aria-hidden="true" />
                    </a>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
}
