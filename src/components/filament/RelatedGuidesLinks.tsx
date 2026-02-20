import { BookOpen, Layers, GitCompare, Sparkles } from 'lucide-react';
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

// Material-specific comparison guides
const MATERIAL_COMPARISONS: Record<string, { href: string; label: string }> = {
  PLA: { href: '/pla-vs-petg', label: 'PLA vs PETG: Which Should You Choose?' },
  'PLA+': { href: '/pla-vs-petg', label: 'PLA+ vs PETG: Which Should You Choose?' },
  PETG: { href: '/pla-vs-petg', label: 'PETG vs PLA: Complete Material Comparison' },
  ABS: { href: '/guides/asa-vs-abs-outdoor-printing', label: 'ABS vs ASA for Outdoor Printing' },
  ASA: { href: '/guides/asa-vs-abs-outdoor-printing', label: 'ASA vs ABS for Outdoor Printing' },
};

// Material-specific "Best of" guide slugs
const BEST_OF_GUIDES: Record<string, string> = {
  PLA: '/guides/best-pla-filaments',
  'PLA+': '/guides/best-pla-filaments',
  PETG: '/guides/best-petg-filaments',
  ABS: '/guides/best-abs-filaments',
};

export function RelatedGuidesLinks({ brand, material, filamentId, hasTransmissionDistance }: RelatedGuidesLinksProps) {
  if (!brand && !material) return null;

  const materialKey = material?.toUpperCase().split(/[^A-Z+]/)[0] || '';
  const materialSlug = material ? getMaterialSlug(material) : null;
  const brandSlug = brand ? toBrandSlug(brand) : null;
  const comparisonGuide = MATERIAL_COMPARISONS[material || ''] || MATERIAL_COMPARISONS[materialKey];
  const bestOfGuide = BEST_OF_GUIDES[material || ''] || BEST_OF_GUIDES[materialKey];

  const links: Array<{ href: string; label: string; icon: React.ReactNode }> = [];

  // 1. Material hub
  if (materialSlug && material) {
    links.push({
      href: `/materials/${materialSlug}`,
      label: `All ${material} Filaments — Material Hub`,
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

  // 3. HueForge guide — always shown, highlighted when TD data exists
  links.push({
    href: '/best-filaments-for-hueforge',
    label: hasTransmissionDistance
      ? 'Best Filaments for HueForge — TD Value Guide'
      : 'Best Filaments for HueForge Lithophanes',
    icon: <Sparkles className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />,
  });

  // 4. Material comparison guide
  if (comparisonGuide) {
    links.push({
      href: comparisonGuide.href,
      label: comparisonGuide.label,
      icon: <GitCompare className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />,
    });
  }

  // 5. Brand collection
  if (brand && brandSlug) {
    links.push({
      href: `/brands/${brandSlug}`,
      label: `${brand} Filament Collection — All Products`,
      icon: <BookOpen className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />,
    });
  }

  // Cap at 5 links
  const visibleLinks = links.slice(0, 5);

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
