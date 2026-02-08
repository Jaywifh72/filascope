import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Link } from "react-router-dom";
import { FlaskConical, ExternalLink } from "lucide-react";
import { useCurrency } from "@/hooks/useCurrency";
import type { Database } from "@/integrations/supabase/types";

type Printer = Database["public"]["Tables"]["printers"]["Row"] & {
  brand: { brand: string } | null;
  series: { series_name: string } | null;
};

interface RecommendedFilamentsProps {
  printers: Printer[];
}

export function RecommendedFilaments({ printers }: RecommendedFilamentsProps) {
  const { formatPrice } = useCurrency();

  // Query top 5 compatible filaments per printer based on nozzle temp
  const { data: filamentsByPrinter } = useQuery({
    queryKey: ["recommended-filaments", printers.map(p => p.id)],
    queryFn: async () => {
      const results: Record<string, any[]> = {};

      for (const printer of printers) {
        const maxTemp = printer.max_nozzle_temp_c || 260;

        // Get top filaments that can be printed within this printer's temp range
        const { data } = await supabase
          .from("filaments")
          .select("id, product_title, vendor, material, variant_price, featured_image, product_handle, color_hex")
          .not("variant_price", "is", null)
          .lte("nozzle_temp_min_c", maxTemp)
          .order("strength_index", { ascending: false })
          .limit(5);

        results[printer.id] = data || [];
      }

      return results;
    },
    staleTime: 1000 * 60 * 10,
    enabled: printers.length > 0,
  });

  if (!filamentsByPrinter || printers.length === 0) return null;

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-bold text-primary border-b border-primary/20 pb-2 flex items-center gap-2">
        <FlaskConical className="h-5 w-5" />
        Recommended Filaments
      </h2>

      <div
        className="grid gap-4"
        style={{ gridTemplateColumns: `200px repeat(${printers.length}, 1fr)` }}
      >
        <div className="text-sm text-muted-foreground px-4 flex items-center">
          Top compatible
        </div>
        {printers.map((printer) => {
          const filaments = filamentsByPrinter[printer.id] || [];
          return (
            <div key={printer.id} className="space-y-2">
              {filaments.length > 0 ? (
                filaments.map((f) => (
                  <Link
                    key={f.id}
                    to={`/filaments/${f.product_handle || f.id}`}
                    className="flex items-center gap-2 p-2 rounded-lg hover:bg-muted/30 transition-colors group"
                  >
                    {f.color_hex ? (
                      <div
                        className="w-6 h-6 rounded-full border border-border flex-shrink-0"
                        style={{ backgroundColor: f.color_hex }}
                      />
                    ) : f.featured_image ? (
                      <img src={f.featured_image} alt="" className="w-6 h-6 object-contain rounded flex-shrink-0" />
                    ) : (
                      <FlaskConical className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                    )}
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-medium truncate group-hover:text-primary transition-colors">
                        {f.product_title}
                      </p>
                      <p className="text-[10px] text-muted-foreground">
                        {f.material} • {f.variant_price ? formatPrice(f.variant_price) : "—"}
                      </p>
                    </div>
                  </Link>
                ))
              ) : (
                <p className="text-xs text-muted-foreground px-2">No data available</p>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
