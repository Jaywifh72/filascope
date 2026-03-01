import { useMemo } from "react";
import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { getFilamentHref } from "@/lib/filamentUrl";
import { normalizeColorHex } from "@/lib/utils";
import { cn } from "@/lib/utils";
import type { SimilarFilamentData } from "./SimilarFilamentCard";

interface MakersAlsoExploredProps {
  similarFilaments: SimilarFilamentData[];
  currentVendor: string | null;
  currentMaterial: string | null;
}

export function MakersAlsoExplored({ similarFilaments, currentVendor, currentMaterial }: MakersAlsoExploredProps) {
  const pills = useMemo(() => {
    // Pick 3 filaments from different brands/materials
    const candidates = similarFilaments.filter(
      (f) => !f.isCurrent && (f.vendor !== currentVendor || f.material !== currentMaterial)
    );
    return candidates.slice(0, 3);
  }, [similarFilaments, currentVendor, currentMaterial]);

  if (pills.length === 0) return null;

  return (
    <div className="mt-6">
      <p className="text-xs text-muted-foreground mb-2.5">
        Makers who viewed this also explored:
      </p>
      <div className="flex flex-wrap gap-2">
        {pills.map((f) => {
          const colorHex = f.color_hex ? normalizeColorHex(f.color_hex) : null;
          const materialBase = f.material?.split(/[\s-]/)[0] || f.material;
          return (
            <Link
              key={f.id}
              to={getFilamentHref(f.id, f.product_handle)}
              className={cn(
                "group inline-flex items-center gap-1.5 bg-card border border-border/50 rounded-full px-3 py-1.5 text-xs text-muted-foreground",
                "hover:border-primary/50 hover:text-foreground transition-all duration-200",
                "focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1"
              )}
            >
              {colorHex && (
                <div
                  className="w-3 h-3 rounded-full flex-shrink-0 ring-1 ring-white/10"
                  style={{ backgroundColor: colorHex }}
                />
              )}
              <span className="truncate max-w-[140px]">{f.product_title}</span>
              {materialBase && (
                <span className="text-[10px] text-muted-foreground/70">{materialBase}</span>
              )}
              <ArrowRight className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" />
            </Link>
          );
        })}
      </div>
    </div>
  );
}
