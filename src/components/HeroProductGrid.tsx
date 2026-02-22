import { useState, useEffect, useCallback, useRef } from "react";
import { Link } from "react-router-dom";
import { toBrandSlug } from "@/utils/brandSlug";
import { getBrandLogoUrl } from "@/lib/brandLogos";
import { BrandLogo } from "@/components/ui/BrandLogo";

// Curated list of well-known brands with good logos
const HERO_BRANDS = [
  "Bambu Lab",
  "Polymaker",
  "Prusament",
  "eSun",
  "Overture",
  "Hatchbox",
  "Sunlu",
  "ColorFabb",
  "Filamentum",
  "Eryone",
  "Fiberlogy",
  "Proto-Pasta",
  "3DXTech",
  "Atomic Filament",
  "Creality",
  "Anycubic",
  "Elegoo",
  "Spectrum Filaments",
];

function pickInitial(count: number): string[] {
  const shuffled = [...HERO_BRANDS].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
}

/**
 * 2×3 grid of rotating brand logos for the hero section.
 * Every few seconds, one tile swaps to a new brand not already visible.
 */
export function HeroProductGrid() {
  const TILE_COUNT = 6;
  const [brands, setBrands] = useState<string[]>(() => pickInitial(TILE_COUNT));
  const [fadingIndex, setFadingIndex] = useState<number | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval>>();

  const swapOne = useCallback(() => {
    setBrands((prev) => {
      const available = HERO_BRANDS.filter((b) => !prev.includes(b));
      if (available.length === 0) return prev;
      const idx = Math.floor(Math.random() * TILE_COUNT);
      const newBrand = available[Math.floor(Math.random() * available.length)];
      setFadingIndex(idx);
      // After fade-out, swap and fade-in
      setTimeout(() => {
        setBrands((curr) => {
          const next = [...curr];
          next[idx] = newBrand;
          return next;
        });
        setTimeout(() => setFadingIndex(null), 50);
      }, 300);
      return prev;
    });
  }, []);

  useEffect(() => {
    intervalRef.current = setInterval(swapOne, 3000);
    return () => clearInterval(intervalRef.current);
  }, [swapOne]);

  return (
    <div className="grid grid-cols-3 gap-3 w-full max-w-[400px]">
      {brands.map((brand, i) => {
        const logoUrl = getBrandLogoUrl(brand, 120);
        const slug = toBrandSlug(brand);
        const isFading = fadingIndex === i;

        return (
          <Link
            key={`${i}-${brand}`}
            to={`/brands/${slug}`}
            className={`group relative aspect-[3/1] rounded-xl overflow-hidden bg-card border border-border/30 flex items-center justify-center p-3 transition-all duration-200 ease-out hover:scale-105 cursor-pointer focus-visible:ring-2 focus-visible:ring-primary ${
              i >= 3 ? "hidden xl:block" : ""
            }`}
            style={{
              opacity: isFading ? 0 : 1,
              transition: "opacity 300ms ease-in-out, transform 200ms ease-out",
            }}
          >
            <BrandLogo
              src={logoUrl}
              brandName={brand}
              size="lg"
              className="w-full h-full object-contain"
            />
            {/* Brand name label on hover */}
            <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/60 to-transparent p-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
              <span className="text-[10px] font-medium text-white truncate block text-center drop-shadow-sm">
                {brand}
              </span>
            </div>
          </Link>
        );
      })}
    </div>
  );
}
