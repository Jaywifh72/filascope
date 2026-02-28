import { BookOpen, Layers, GitCompare, Sparkles, ArrowRight } from 'lucide-react';
import { toBrandSlug } from '@/utils/brandSlug';

interface RelatedGuidesLinksProps {
  brand: string | null;
  material: string | null;
  filamentId: string;
  hasTransmissionDistance?: boolean;
}

// Material → slug for the materials hub
function getMaterialSlug(material: string): string {
  return material.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

// Material-specific comparison guides (using /guides/ prefix)
const MATERIAL_COMPARISONS: Record<string, { href: string; label: string }[]> = {
  PLA: [
    { href: '/guides/pla-vs-petg', label: 'PLA vs PETG: Which Should You Choose?' },
    { href: '/guides/pla-vs-abs', label: 'PLA vs ABS: Strength & Ease Compared' },
  ],
  'PLA+': [
    { href: '/guides/pla-vs-petg', label: 'PLA+ vs PETG: Which Should You Choose?' },
    { href: '/guides/pla-plus-vs-pla-pro', label: 'PLA+ vs PLA Pro: What\'s the Difference?' },
  ],
  PETG: [
    { href: '/guides/pla-vs-petg', label: 'PETG vs PLA: Complete Material Comparison' },
    { href: '/guides/petg-vs-abs', label: 'PETG vs ABS: Strength & Heat Resistance' },
    { href: '/guides/nylon-vs-petg', label: 'Nylon vs PETG: Engineering Filament Guide' },
  ],
  ABS: [
    { href: '/guides/pla-vs-abs', label: 'PLA vs ABS: Strength & Ease Compared' },
    { href: '/guides/petg-vs-abs', label: 'PETG vs ABS: Which Is Better?' },
    { href: '/guides/asa-vs-abs-outdoor-printing', label: 'ABS vs ASA for Outdoor Printing' },
  ],
  ASA: [
    { href: '/guides/asa-vs-abs-outdoor-printing', label: 'ASA vs ABS for Outdoor Printing' },
  ],
  TPU: [
    { href: '/guides/tpu-vs-petg', label: 'TPU vs PETG: Flexible vs Rigid Compared' },
    { href: '/guides/best-tpu-filaments', label: 'Best TPU & Flexible Filaments 2026' },
  ],
  NYLON: [
    { href: '/guides/nylon-vs-petg', label: 'Nylon vs PETG: Engineering Filament Guide' },
    { href: '/guides/best-filaments-for-functional-parts', label: 'Best Filaments for Functional Parts' },
  ],
};

// Material-specific "Best of" guide slugs
const BEST_OF_GUIDES: Record<string, string> = {
  PLA: '/guides/best-pla-filaments',
  'PLA+': '/guides/best-pla-filaments',
  PETG: '/guides/best-petg-filaments',
  ABS: '/guides/best-abs-filaments',
  TPU: '/guides/best-tpu-filaments',
};

export function RelatedGuidesLinks({ brand, material, filamentId, hasTransmissionDistance }: RelatedGuidesLinksProps) {
  if (!brand && !material) return null;

  const materialKey = material?.toUpperCase().split(/[^A-Z+]/)[0] || '';
  const materialSlug = material ? getMaterialSlug(material) : null;
  const brandSlug = brand ? toBrandSlug(brand) : null;
  const comparisonGuides = MATERIAL_COMPARISONS[material || ''] || MATERIAL_COMPARISONS[materialKey] || [];
  const bestOfGuide = BEST_OF_GUIDES[material || ''] || BEST_OF_GUIDES[materialKey];

  const links: Array<{ href: string; label: string; icon: React.ReactNode }> = [];

  // 1. "Learn about [Material]" — descriptive anchor text for material hub
  if (materialSlug && material) {
    links.push({
      href: `/materials/${materialSlug}`,
      label: `Learn more about ${material} filament properties and print settings`,
      icon: <Layers className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />,
    });
  }

  // 2. Best-of guide for material
  if (bestOfGuide && material) {
    const year = new Date().getFullYear();
    links.push({
      href: bestOfGuide,
      label: `Best ${material} Filaments in ${year}`,
      icon: <BookOpen className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />,
    });
  }

  // 3. HueForge guide — highlighted when TD data exists
  if (hasTransmissionDistance) {
    links.push({
      href: '/guides/best-filaments-for-hueforge',
      label: 'Best Filaments for HueForge — TD Value Guide',
      icon: <Sparkles className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />,
    });
  }

  // 4. Material comparison guides (up to 2)
  for (const guide of comparisonGuides.slice(0, 2)) {
    links.push({
      href: guide.href,
      label: guide.label,
      icon: <GitCompare className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />,
    });
  }

  // 5. "Browse all [Brand] filaments" — descriptive anchor text
  if (brand && brandSlug) {
    links.push({
      href: `/brands/${brandSlug}`,
      label: `Browse all ${brand} filaments`,
      icon: <ArrowRight className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />,
    });
  }

  // Cap at 6 links
  const visibleLinks = links.slice(0, 6);

  return (
    <section aria-label="Related guides and comparisons" className="mt-4 mb-6">
      <h2 className="sr-only">Related Guides &amp; Comparisons</h2>
      <nav className="flex flex-wrap gap-2">
        {visibleLinks.map(({ href, label, icon }) => (
          <a
            key={href}
            href={href}
            className="inline-flex items-center gap-1.5 text-sm px-3 py-1.5 rounded-full border border-border bg-muted/50 text-muted-foreground hover:border-primary/60 hover:text-primary hover:bg-primary/5 transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
          >
            {icon}
            {label}
          </a>
        ))}
      </nav>
    </section>
  );
}
