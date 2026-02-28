import { BookOpen } from "lucide-react";

interface GuideLink {
  href: string;
  label: string;
}

/** Static map of brand name → relevant guide links */
const BRAND_GUIDES: Record<string, GuideLink[]> = {
  "Bambu Lab": [
    { href: "/guides/best-filament-for-bambu-lab-p1s", label: "Best Filament for Bambu Lab P1S" },
    { href: "/guides/best-filament-for-bambu-lab-x1-carbon", label: "Best Filament for Bambu Lab X1 Carbon" },
    { href: "/guides/best-filament-for-bambu-lab-a1-mini", label: "Best Filament for Bambu Lab A1 Mini" },
    { href: "/guides/best-filament-for-bambu-lab-a1", label: "Best Filament for Bambu Lab A1" },
    { href: "/guides/best-pla-filaments", label: "Best PLA Filaments 2026" },
  ],
  "Polymaker": [
    { href: "/guides/best-petg-filaments", label: "Best PETG Filaments" },
    { href: "/guides/best-pla-filaments", label: "Best PLA Filaments 2026" },
    { href: "/guides/best-filaments-for-hueforge", label: "Best Filaments for HueForge" },
  ],
  "Prusament": [
    { href: "/guides/best-pla-filaments", label: "Best PLA Filaments 2026" },
    { href: "/guides/best-petg-filaments", label: "Best PETG Filaments" },
    { href: "/guides/best-filaments-for-beginners", label: "Best Filament for Beginners" },
  ],
  "ColorFabb": [
    { href: "/guides/best-filaments-for-hueforge", label: "Best Filaments for HueForge" },
    { href: "/guides/best-petg-filaments", label: "Best PETG Filaments" },
  ],
  "Fillamentum": [
    { href: "/guides/best-pla-filaments", label: "Best PLA Filaments 2026" },
    { href: "/guides/best-filaments-for-hueforge", label: "Best Filaments for HueForge" },
  ],
  "eSUN": [
    { href: "/guides/best-filaments-for-beginners", label: "Best Filament for Beginners" },
    { href: "/guides/best-pla-filaments", label: "Best PLA Filaments 2026" },
    { href: "/guides/best-petg-filaments", label: "Best PETG Filaments" },
    { href: "/guides/best-abs-filaments", label: "Best ABS Filaments" },
  ],
  "Hatchbox": [
    { href: "/guides/best-filaments-for-beginners", label: "Best Filament for Beginners" },
    { href: "/guides/best-pla-filaments", label: "Best PLA Filaments 2026" },
  ],
  "Overture": [
    { href: "/guides/best-filaments-for-beginners", label: "Best Filament for Beginners" },
    { href: "/guides/best-pla-filaments", label: "Best PLA Filaments 2026" },
  ],
  "MatterHackers": [
    { href: "/guides/best-pla-filaments", label: "Best PLA Filaments 2026" },
    { href: "/guides/best-petg-filaments", label: "Best PETG Filaments" },
    { href: "/guides/best-filaments-for-hueforge", label: "Best Filaments for HueForge" },
  ],
  "Amolen": [
    { href: "/guides/best-filaments-for-hueforge", label: "Best Filaments for HueForge" },
    { href: "/guides/best-pla-filaments", label: "Best PLA Filaments 2026" },
  ],
  "Anycubic": [
    { href: "/guides/best-filaments-for-beginners", label: "Best Filament for Beginners" },
    { href: "/guides/best-pla-filaments", label: "Best PLA Filaments 2026" },
  ],
  "Creality": [
    { href: "/guides/best-filament-for-creality-k1-max", label: "Best Filament for Creality K1 Max" },
    { href: "/guides/best-filament-for-creality-ender-3-v3", label: "Best Filament for Ender 3 V3" },
    { href: "/guides/best-filaments-for-beginners", label: "Best Filament for Beginners" },
    { href: "/guides/best-pla-filaments", label: "Best PLA Filaments 2026" },
  ],
  "Sunlu": [
    { href: "/guides/best-filaments-for-beginners", label: "Best Filament for Beginners" },
    { href: "/guides/best-pla-filaments", label: "Best PLA Filaments 2026" },
    { href: "/guides/best-filaments-for-hueforge", label: "Best Filaments for HueForge" },
  ],
};

interface BrandGuidesLinksProps {
  brandName: string;
}

export function BrandGuidesLinks({ brandName }: BrandGuidesLinksProps) {
  const guides = BRAND_GUIDES[brandName];
  if (!guides || guides.length === 0) return null;

  return (
    <section aria-label={`Guides featuring ${brandName}`} className="mt-6">
      <h2 className="text-lg font-semibold text-foreground mb-3 flex items-center gap-2">
        <BookOpen className="w-4 h-4 text-primary" aria-hidden="true" />
        Guides Featuring {brandName}
      </h2>
      <nav className="flex flex-wrap gap-2">
        {guides.map(({ href, label }) => (
          <a
            key={href}
            href={href}
            className="inline-flex items-center gap-1.5 text-sm px-3 py-1.5 rounded-full border border-border bg-muted/50 text-muted-foreground hover:border-primary/60 hover:text-primary hover:bg-primary/5 transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
          >
            <BookOpen className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
            {label}
          </a>
        ))}
      </nav>
    </section>
  );
}
