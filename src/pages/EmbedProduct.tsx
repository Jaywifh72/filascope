import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { ExternalLink, Star } from "lucide-react";
import { useRegion } from "@/contexts/RegionContext";
import { calculateUnifiedScore } from "@/lib/unifiedFilamentScore";
import { cn } from "@/lib/utils";

/**
 * Lightweight embeddable product card — designed to be iframed on external sites.
 * Hides the site's navbar, footer, and chrome on mount.
 */

/** Lightweight embeddable product card — designed to be iframed on external sites. */
export default function EmbedProduct() {
  const { id } = useParams<{ id: string }>();
  const [filament, setFilament] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const { formatPrice } = useRegion();

  // Hide site chrome (navbar, footer, compare trays) when embedded
  useEffect(() => {
    document.body.classList.add("embed-mode");
    return () => document.body.classList.remove("embed-mode");
  }, []);

  useEffect(() => {
    if (!id) return;
    (async () => {
      const { data } = await supabase
        .from("filaments")
        .select("id, product_title, vendor, material, featured_image, variant_price, color_hex, net_weight_g, product_handle, ease_of_printing_score, strength_index, printability_index, dimensional_accuracy_score, value_score, data_completeness_score")
        .eq("id", id)
        .maybeSingle();
      setFilament(data);
      setLoading(false);
    })();
  }, [id]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full bg-background p-4">
        <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!filament) {
    return (
      <div className="flex items-center justify-center h-full bg-background p-4 text-muted-foreground text-sm">
        Product not found
      </div>
    );
  }

  const scoreResult = calculateUnifiedScore(filament);
  const score = scoreResult.score;
  const priceDisplay = filament.variant_price ? formatPrice(filament.variant_price) : null;
  const slug = filament.product_handle || filament.id;
  const detailUrl = `https://filascope.com/filament/${slug}`;

  return (
    <div className="h-full bg-background text-foreground p-4 flex gap-4" style={{ fontFamily: "'Inter', system-ui, sans-serif" }}>
      {/* Image */}
      <div className="w-24 h-24 shrink-0 rounded-lg overflow-hidden border border-border bg-muted/30 flex items-center justify-center">
        {filament.featured_image ? (
          <img
            src={filament.featured_image}
            alt={filament.product_title}
            className="w-full h-full object-contain"
          />
        ) : filament.color_hex ? (
          <div
            className="w-16 h-16 rounded-full"
            style={{ backgroundColor: filament.color_hex }}
          />
        ) : (
          <div className="w-16 h-16 rounded-full bg-muted" />
        )}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0 flex flex-col justify-between">
        <div>
          <p className="text-xs text-muted-foreground truncate">{filament.vendor}</p>
          <p className="text-sm font-semibold truncate leading-tight mt-0.5">
            {filament.product_title}
          </p>
          <div className="flex items-center gap-2 mt-1.5">
            {filament.material && (
              <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-primary/10 text-primary">
                {filament.material}
              </span>
            )}
            {score != null && score > 0 && (
              <span
                className="flex items-center gap-0.5 text-xs text-accent-foreground"
                aria-label={`FilaScore: ${score.toFixed(1)} out of 10`}
              >
                <Star className="w-3 h-3 fill-current" />
                {score.toFixed(1)}
              </span>
            )}
          </div>
        </div>

        <div className="flex items-end justify-between mt-2">
          {priceDisplay && (
            <span className="text-base font-bold text-foreground">
              {priceDisplay}
            </span>
          )}
          <a
            href={detailUrl}
            target="_blank"
            rel="noopener noreferrer"
            className={cn(
              "inline-flex items-center gap-1 text-[11px] font-medium",
              "text-primary hover:text-primary/80 transition-colors"
            )}
          >
            View on FilaScope
            <ExternalLink className="w-3 h-3" />
          </a>
        </div>
      </div>
    </div>
  );
}
