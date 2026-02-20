/**
 * HomeSEOContent
 * Keyword-rich section placed above the footer for SEO discoverability.
 * Uses <a> tags (not React Router <Link>) so crawlers always see real anchors.
 */
export function HomeSEOContent() {
  const popularSearches = [
    { label: "Best PLA for beginners", href: "/best-filaments-for-beginners" },
    { label: "PLA vs PETG", href: "/pla-vs-petg" },
    { label: "Cheapest filament", href: "/filaments?sort=price_asc" },
    { label: "HueForge compatible filaments", href: "/best-filaments-for-hueforge" },
    { label: "High speed PLA", href: "/filaments/high-speed-pla" },
    { label: "Best filament for Bambu Lab", href: "/guides/best-filament-for-bambu-lab-p1s" },
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
          <h2 className="text-lg font-semibold text-foreground mb-3">Popular Searches</h2>
          <div className="flex flex-wrap gap-2">
            {popularSearches.map(({ label, href }) => (
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
      </div>
    </section>
  );
}
