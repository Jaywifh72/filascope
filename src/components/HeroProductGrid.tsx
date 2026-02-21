import { useState } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { normalizeColorHex } from "@/lib/utils";
import { getFilamentHref } from "@/lib/filamentUrl";
import { Package } from "lucide-react";

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

function HeroTile({ filament, hidden }: { filament: PopularFilament; hidden?: boolean }) {
  const [imgStatus, setImgStatus] = useState<"loading" | "loaded" | "error">("loading");
  const href = getFilamentHref(filament.id, filament.product_handle);
  const colorHex = filament.color_hex ? normalizeColorHex(filament.color_hex) : "#334155";
  const label = filament.vendor || "";

  return (
    <Link
      to={href}
      className={`group relative aspect-square rounded-xl overflow-hidden border border-border/30 transition-transform duration-200 ease-out hover:scale-105 cursor-pointer focus-visible:ring-2 focus-visible:ring-primary ${hidden ? "hidden xl:block" : ""}`}
    >
      {/* Loading skeleton */}
      {imgStatus === "loading" && (
        <div className="absolute inset-0 animate-pulse bg-muted rounded-xl" />
      )}

      {/* Actual image */}
      {imgStatus !== "error" && filament.featured_image && (
        <img
          src={filament.featured_image}
          alt={filament.product_title}
          className={`w-full h-full object-cover transition-opacity duration-300 ${imgStatus === "loaded" ? "opacity-100" : "opacity-0"}`}
          loading="lazy"
          onLoad={() => setImgStatus("loaded")}
          onError={() => setImgStatus("error")}
        />
      )}

      {/* Branded fallback on error */}
      {imgStatus === "error" && (
        <div
          className="w-full h-full flex flex-col items-center justify-center gap-1.5 p-2"
          style={{
            background: `linear-gradient(135deg, ${colorHex}66 0%, ${colorHex}cc 100%)`,
          }}
        >
          <Package className="w-8 h-8 text-white/40" />
          <span className="text-[11px] text-white/70 text-center leading-tight line-clamp-2 font-medium">
            {filament.product_title}
          </span>
        </div>
      )}

      {/* Bottom gradient overlay */}
      {imgStatus !== "error" && (
        <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black/70 to-transparent pointer-events-none" />
      )}

      {/* Color swatch + vendor label */}
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
}

/**
 * 2×3 grid of popular filament product images for the hero section.
 */
export function HeroProductGrid() {
  const { data: filaments, isLoading } = usePopularFilaments(6);

  if (isLoading || !filaments || filaments.length === 0) {
    return (
      <div className="grid grid-cols-3 gap-3 w-full max-w-[400px]">
        {Array.from({ length: 6 }).map((_, i) => (
          <div
            key={i}
            className={`aspect-square rounded-xl bg-muted animate-pulse ${i >= 3 ? "hidden xl:block" : ""}`}
          />
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-3 gap-3 w-full max-w-[400px]">
      {filaments.map((f, i) => (
        <HeroTile key={f.id} filament={f} hidden={i >= 3} />
      ))}
    </div>
  );
}
