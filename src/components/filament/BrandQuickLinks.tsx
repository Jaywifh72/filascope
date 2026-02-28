import { ArrowRight, GitCompare, Package } from "lucide-react";
import { toBrandSlug } from "@/utils/brandSlug";

interface BrandQuickLinksProps {
  brand: string | null;
  material: string | null;
  filamentId: string;
}

export function BrandQuickLinks({ brand, material, filamentId }: BrandQuickLinksProps) {
  if (!brand && !material) return null;

  const brandSlug = brand ? toBrandSlug(brand) : null;

  const links = [
    brand && brandSlug
      ? {
          href: `/brands/${brandSlug}`,
          label: `Browse all ${brand} filaments`,
          icon: Package,
        }
      : null,
    material
      ? {
          href: `/filaments/${material.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`,
          label: `All ${material} filaments`,
          icon: ArrowRight,
        }
      : null,
    {
      href: `/compare?ids=${filamentId}`,
      label: "Compare this filament",
      icon: GitCompare,
    },
  ].filter(Boolean) as { href: string; label: string; icon: React.ComponentType<{ className?: string }> }[];

  return (
    <nav
      aria-label="Quick links for this filament"
      className="flex flex-wrap gap-2 mb-4"
    >
      {links.map(({ href, label, icon: Icon }) => (
        <a
          key={href}
          href={href}
          className="inline-flex items-center gap-1.5 text-sm px-3 py-1.5 rounded-full border border-border bg-muted/50 text-muted-foreground hover:border-primary/60 hover:text-primary hover:bg-primary/5 transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
        >
          <Icon className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
          {label}
        </a>
      ))}
    </nav>
  );
}
