import { Link } from "react-router-dom";
import { format } from "date-fns";
import {
  Heart,
  ShoppingBag,
  Star,
  FileText,
  Bell,
  ExternalLink,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { LibraryProduct, InteractionType } from "@/hooks/useFilamentLibrary";
import { getFilamentHref } from "@/lib/filamentUrl";

const INTERACTION_ICONS: Record<InteractionType, { icon: typeof Heart; color: string }> = {
  wishlist: { icon: Heart, color: "text-pink-400" },
  purchased: { icon: ShoppingBag, color: "text-emerald-400" },
  reviewed: { icon: Star, color: "text-[#FFB800]" },
  noted: { icon: FileText, color: "text-blue-400" },
  alert: { icon: Bell, color: "text-orange-400" },
};

interface LibraryProductDetailProps {
  product: LibraryProduct;
}

export function LibraryProductDetail({ product }: LibraryProductDetailProps) {
  const priceDiff =
    product.purchasePrice && product.current_price
      ? product.current_price - product.purchasePrice
      : null;

  return (
    <div className="px-4 pb-4 pt-1 space-y-4 bg-muted/20 rounded-b-xl border-t border-border/30">
      {/* Interaction Timeline */}
      <div className="space-y-2">
        <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
          Your History
        </h4>
        <div className="relative pl-5 space-y-2.5">
          {/* Timeline line */}
          <div className="absolute left-[7px] top-1 bottom-1 w-px bg-border/60" />

          {product.interactions.map((interaction, i) => {
            const config = INTERACTION_ICONS[interaction.type];
            const Icon = config.icon;

            return (
              <div key={i} className="relative flex items-start gap-3">
                {/* Dot */}
                <div
                  className={cn(
                    "absolute -left-5 top-0.5 w-3.5 h-3.5 rounded-full border-2 border-background flex items-center justify-center",
                    "bg-card",
                  )}
                >
                  <Icon className={cn("w-2 h-2", config.color)} />
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-foreground/90">{interaction.detail}</p>
                  <p className="text-[11px] text-muted-foreground">
                    {format(new Date(interaction.date), "MMM d, yyyy")}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Price Comparison */}
      {product.purchased && product.purchasePrice && product.current_price && (
        <div className="flex items-center gap-3 text-sm p-2.5 rounded-lg bg-card/60 border border-border/30">
          <span className="text-muted-foreground">You paid:</span>
          <span className="font-medium">${product.purchasePrice.toFixed(2)}</span>
          <span className="text-muted-foreground">→ Now:</span>
          <span className="font-medium">${product.current_price.toFixed(2)}</span>
          {priceDiff !== null && priceDiff !== 0 && (
            <span
              className={cn(
                "text-xs px-1.5 py-0.5 rounded-full font-medium",
                priceDiff > 0
                  ? "bg-emerald-500/10 text-emerald-400"
                  : "bg-destructive/10 text-destructive",
              )}
            >
              {priceDiff > 0 ? `You saved $${priceDiff.toFixed(2)}` : `Up $${Math.abs(priceDiff).toFixed(2)}`}
            </span>
          )}
        </div>
      )}

      {/* View Product Link */}
      <Link
        to={getFilamentHref(product.filament_id, (product as any).product_handle)}
        className="inline-flex items-center gap-1.5 text-sm text-primary hover:text-primary/80 font-medium transition-colors"
      >
        View Product Page
        <ExternalLink className="w-3.5 h-3.5" />
      </Link>
    </div>
  );
}
