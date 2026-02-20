import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Printer } from "lucide-react";

interface CompatiblePrintersLinksProps {
  nozzleTempMaxC: number | null | undefined;
  material: string | null | undefined;
}

export function CompatiblePrintersLinks({ nozzleTempMaxC, material }: CompatiblePrintersLinksProps) {
  const tempThreshold = nozzleTempMaxC ?? 220;

  const { data: printers } = useQuery({
    queryKey: ["compatible-printers-links", tempThreshold],
    queryFn: async () => {
      const { data } = await supabase
        .from("printers")
        .select("id, model_name, display_name")
        .gte("max_nozzle_temp_c", tempThreshold)
        .order("model_name")
        .limit(6);
      return data ?? [];
    },
    staleTime: 1000 * 60 * 30,
  });

  if (!printers || printers.length < 2) return null;

  return (
    <section aria-label="Compatible 3D printers" className="mt-4 mb-4">
      <h2 className="text-sm font-semibold text-foreground mb-2 flex items-center gap-1.5">
        <Printer className="w-3.5 h-3.5 text-muted-foreground" aria-hidden="true" />
        {material ? `Printers Compatible with ${material}` : "Compatible Printers"}
      </h2>
      <nav className="flex flex-wrap gap-2">
        {printers.map((printer) => (
          <a
            key={printer.id}
            href={`/printers/${printer.id}`}
            className="inline-flex items-center gap-1.5 text-sm px-3 py-1.5 rounded-full border border-border bg-muted/50 text-muted-foreground hover:border-primary/60 hover:text-primary hover:bg-primary/5 transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
          >
            <Printer className="w-3 h-3 shrink-0" aria-hidden="true" />
            {printer.display_name || printer.model_name}
          </a>
        ))}
        <a
          href="/printers"
          className="inline-flex items-center gap-1.5 text-sm px-3 py-1.5 rounded-full border border-dashed border-border bg-transparent text-muted-foreground hover:border-primary/60 hover:text-primary transition-all duration-200"
        >
          All Printers →
        </a>
      </nav>
    </section>
  );
}
