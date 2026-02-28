/**
 * HomeSEOContent
 * Keyword-rich section placed above the footer for SEO discoverability.
 * Uses <a> tags (not React Router <Link>) so crawlers always see real anchors.
 */
export function HomeSEOContent() {
  const searchGroups = [
    {
      title: 'Material Comparisons',
      links: [
        { label: 'Best PLA Filaments 2026', href: '/guides/best-pla-filaments' },
        { label: 'Best PETG Filaments 2026', href: '/guides/best-petg-filaments' },
        { label: 'PLA vs PETG', href: '/guides/pla-vs-petg' },
        { label: 'Best ABS Filaments', href: '/guides/best-abs-filaments' },
        { label: 'ABS vs ASA for Outdoor Printing', href: '/guides/asa-vs-abs-outdoor-printing' },
        { label: 'Best Filaments for Miniatures', href: '/guides/best-filaments-for-miniatures' },
        { label: 'Filament Temperature Guide', href: '/filament-temperature-guide' },
      ],
    },
    {
      title: 'Material Categories',
      links: [
        { label: 'PLA Filament Database', href: '/filaments/pla' },
        { label: 'PETG Filament Comparison', href: '/filaments/petg' },
        { label: 'TPU Flexible Filaments', href: '/filaments/tpu' },
        { label: 'ASA Outdoor Filaments', href: '/filaments/asa' },
        { label: 'Silk PLA Filaments', href: '/filaments/silk-pla' },
      ],
    },
    {
      title: 'HueForge',
      links: [
        { label: 'HueForge TD Value Database — Search 500+ Filaments', href: '/hueforge-td-database' },
        { label: 'HueForge Filament Finder', href: '/hueforge-filaments' },
        { label: 'Best Filaments for HueForge', href: '/guides/best-filaments-hueforge' },
        { label: 'What is HueForge TD?', href: '/guides/what-is-hueforge-td' },
        { label: 'Best White Filaments for HueForge', href: '/guides/best-white-filaments-for-hueforge' },
        { label: 'Find Filaments by Color', href: '/color-finder' },
      ],
    },
    {
      title: 'Tools',
      links: [
        { label: 'Compare Filaments Side by Side', href: '/compare' },
        { label: 'Filament Deals Today', href: '/deals' },
        { label: '3D Printer Database', href: '/printers' },
      ],
    },
    {
      title: 'Top Brands',
      links: [
        { label: 'Bambu Lab Filaments', href: '/brands/bambu-lab' },
        { label: 'Polymaker Filaments', href: '/brands/polymaker' },
        { label: 'Prusament Filaments', href: '/brands/prusament' },
        { label: 'eSUN Filaments', href: '/brands/esun' },
        { label: 'Hatchbox Filaments', href: '/brands/hatchbox' },
      ],
    },
  ];

  return (
    <section
      aria-label="About FilaScope"
      className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 border-t border-border/50"
    >
      <div className="grid md:grid-cols-2 gap-10">
        {/* What is FilaScope? */}
        <div>
          <h2 className="text-lg font-semibold text-foreground mb-3">What is FilaScope?</h2>
          <p className="text-sm text-muted-foreground leading-relaxed">
            FilaScope is the most comprehensive <strong className="text-foreground/80">3D printer filament comparison</strong> platform on the web.
            Our live <strong className="text-foreground/80">filament database</strong> tracks prices, specs, and&nbsp;
            <strong className="text-foreground/80">HueForge TD values</strong> across 50+ brands and 15+ retailers — so you always
            find the best <strong className="text-foreground/80">filament prices</strong> for your region and printer.
          </p>
        </div>

        {/* Popular Searches */}
        <div>
          <h2 className="text-lg font-semibold text-foreground mb-4">Popular Searches</h2>
          <div className="space-y-4">
            {searchGroups.map((group) => (
              <div key={group.title}>
                <h3 className="text-xs font-medium text-muted-foreground/70 uppercase tracking-wider mb-2">{group.title}</h3>
                <div className="flex flex-wrap gap-1.5">
                  {group.links.map(({ label, href }) => (
                    <a
                      key={href}
                      href={href}
                      className="inline-flex items-center px-3 py-1.5 rounded-full text-xs font-medium border border-border bg-card hover:border-primary/40 hover:bg-primary/5 hover:text-primary transition-colors text-muted-foreground"
                    >
                      {label}
                    </a>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
