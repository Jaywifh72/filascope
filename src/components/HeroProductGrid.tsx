import { useMemo } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { normalizeColorHex } from "@/lib/utils";
import { getFilamentHref } from "@/lib/filamentUrl";

interface PopularFilament {
  id: string;
  product_title: string;
  vendor: string | null;
  color_hex: string | null;
  featured_image: string | null;
  product_handle: string | null;
}

function usePopularFilaments(limit = 6) {
  return useQuery({
    queryKey: ["hero-popular-filaments", limit],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("filaments")
        .select("id, product_title, vendor, color_hex, featured_image, product_handle")
        .not("featured_image", "is", null)
        .eq("variant_available", true)
        .order("filascope_score", { ascending: false, nullsFirst: false })
        .limit(limit);
      if (error) throw error;
      return (data || []) as unknown as PopularFilament[];
    },
    staleTime: 5 * 60 * 1000,
  });
}

/**
 * 2×3 grid of popular filament product images for the hero section.
 * Hidden on mobile, 1×3 on tablet (md), 2×3 on desktop (xl).
 */
export function HeroProductGrid() {
  const { data: filaments, isLoading } = usePopularFilaments(6);

  if (isLoading || !filaments || filaments.length === 0) {
    // Skeleton placeholders
    return (
      <div className="grid grid-cols-3 gap-3 w-full max-w-[400px]">
        {Array.from({ length: 6 }).map((_, i) => (
          <div
            key={i}
            className={`aspect-square rounded-xl bg-slate-800/60 animate-pulse ${i >= 3 ? 'hidden xl:block' : ''}`}
          />
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-3 gap-3 w-full max-w-[400px]">
      {filaments.map((f, i) => {
        const href = getFilamentHref(f.id, f.product_handle);
        const colorHex = f.color_hex ? normalizeColorHex(f.color_hex) : null;
        const label = f.vendor || "";

        return (
          <Link
            key={f.id}
            to={href}
            className={`group relative aspect-square rounded-xl overflow-hidden bg-slate-800/60 border border-slate-700/30 transition-transform duration-200 ease-out hover:scale-[1.03] focus-visible:ring-2 focus-visible:ring-primary ${i >= 3 ? 'hidden xl:block' : ''}`}
          >
            {/* Product image */}
            {f.featured_image ? (
              <img
                src={f.featured_image}
                alt={f.product_title}
                className="w-full h-full object-cover"
                loading="lazy"
              />
            ) : (
              <div
                className="w-full h-full"
                style={{ backgroundColor: colorHex || '#334155' }}
              />
            )}

            {/* Bottom gradient overlay */}
            <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black/70 to-transparent pointer-events-none" />

            {/* Color swatch + name label */}
            <div className="absolute bottom-2 left-2 right-2 flex items-center gap-1.5">
              {colorHex && (
                <span
                  className="w-3 h-3 rounded-full flex-shrink-0 ring-1 ring-white/30"
                  style={{ backgroundColor: colorHex }}
                />
              )}
              {label && (
                <span className="text-[10px] font-medium text-white truncate leading-tight drop-shadow-sm">
                  {label}
                </span>
              )}
            </div>
          </Link>
        );
      })}
    </div>
  );
}
