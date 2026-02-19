import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card";
import { normalizeColorHex } from "@/lib/utils";

interface FilamentSnapshot {
  id: string;
  product_title: string | null;
  vendor: string | null;
  material: string | null;
  variant_price: number | null;
  net_weight_g: number | null;
  color_hex: string | null;
  transmission_distance: number | null;
}

interface FilamentMentionProps {
  /** The filament's URL slug (product_handle) or UUID */
  slug: string;
  /** Display text rendered as the link label */
  children: React.ReactNode;
}

export function FilamentMention({ slug, children }: FilamentMentionProps) {
  const [data, setData] = useState<FilamentSnapshot | null>(null);

  useEffect(() => {
    let cancelled = false;

    const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(slug);

    const query = isUUID
      ? supabase
          .from("filaments")
          .select("id, product_title, vendor, material, variant_price, net_weight_g, color_hex, transmission_distance")
          .eq("id", slug)
          .maybeSingle()
      : supabase
          .from("filaments")
          .select("id, product_title, vendor, material, variant_price, net_weight_g, color_hex, transmission_distance")
          .eq("product_handle", slug)
          .maybeSingle();

    query.then(({ data: row }) => {
      if (!cancelled && row) setData(row);
    });

    return () => { cancelled = true; };
  }, [slug]);

  const href = `/filament/${slug}`;

  const link = (
    <a
      href={href}
      className="text-primary underline underline-offset-2 decoration-primary/40 hover:decoration-primary transition-colors font-medium"
    >
      {children}
    </a>
  );

  if (!data) return link;

  const hex = normalizeColorHex(data.color_hex);
  const pricePerKg =
    data.variant_price != null
      ? data.net_weight_g && data.net_weight_g > 0
        ? (data.variant_price / data.net_weight_g) * 1000
        : data.variant_price
      : null;

  return (
    <HoverCard openDelay={200} closeDelay={100}>
      <HoverCardTrigger asChild>{link}</HoverCardTrigger>
      <HoverCardContent
        className="w-64 p-3 bg-popover border border-border shadow-lg rounded-xl"
        side="top"
        align="start"
      >
        <div className="flex items-start gap-3">
          {/* Color swatch */}
          <span
            className="mt-0.5 w-8 h-8 rounded-lg border border-white/10 shrink-0 shadow-sm"
            style={{ backgroundColor: hex }}
            aria-hidden="true"
          />
          <div className="flex-1 min-w-0 space-y-0.5">
            <p className="text-xs text-muted-foreground truncate">{data.vendor}</p>
            <p className="text-sm font-semibold text-foreground leading-snug line-clamp-2">
              {data.product_title}
            </p>
            <div className="flex items-center gap-3 pt-1 text-xs text-muted-foreground">
              {data.material && <span>{data.material}</span>}
              {data.transmission_distance != null && (
                <span className="font-semibold text-violet-400">
                  TD {data.transmission_distance.toFixed(1)}
                </span>
              )}
              {pricePerKg != null && (
                <span>${pricePerKg.toFixed(0)}/kg</span>
              )}
            </div>
          </div>
        </div>
        <a
          href={href}
          className="mt-2 block text-xs text-center text-primary hover:underline"
        >
          View full details →
        </a>
      </HoverCardContent>
    </HoverCard>
  );
}
