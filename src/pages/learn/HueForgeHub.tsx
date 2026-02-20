import { Link } from 'react-router-dom';
import { DocumentHead } from '@/components/seo/DocumentHead';
import { ArticleSchema } from '@/components/seo';
import { Breadcrumbs } from '@/components/seo/Breadcrumbs';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Sun, Database, Wand2, BookOpen, Ruler, Star, ArrowRight, ChevronRight } from 'lucide-react';

// ─── Content definitions ────────────────────────────────────────────────────

const TOOLS = [
  {
    icon: Database,
    label: 'Tool',
    title: 'HueForge TD Value Database',
    description:
      'Search verified Transmissivity Distance (TD) measurements for 500+ filaments from 48+ brands. Filter by material, color, or brand and export to CSV.',
    href: '/hueforge-td-database',
    cta: 'Open TD Database',
    accent: 'purple',
  },
  {
    icon: Wand2,
    label: 'Tool',
    title: 'HueForge Filament Finder',
    description:
      'Filter the full catalog by TD range, material, color family, and price to find the perfect filament for every slot in your HueForge stack.',
    href: '/hueforge-filaments',
    cta: 'Open Filament Finder',
    accent: 'blue',
  },
  {
    icon: Star,
    label: 'Ranked List',
    title: 'Best Filaments for HueForge',
    description:
      'Editor-curated picks of the top-performing filaments for HueForge lithophanes and multicolor prints, ranked by TD accuracy, price, and community ratings.',
    href: '/best-filaments-for-hueforge',
    cta: 'View Top Picks',
    accent: 'amber',
  },
];

const GUIDES = [
  {
    icon: BookOpen,
    badge: 'Beginner',
    title: 'What Is HueForge TD (Transmissivity Distance)?',
    description:
      'The complete beginner guide to TD values — what TD means, how it affects lithophane and multicolor prints, and which TD range to use for each layer in your stack.',
    href: '/guides/what-is-hueforge-td',
    readTime: '8 min read',
  },
  {
    icon: Ruler,
    badge: 'Intermediate',
    title: 'How to Measure Filament TD for HueForge',
    description:
      'Step-by-step methods for measuring your filament\'s Transmissivity Distance using calibration walls and a light meter. Includes how to submit your results to FilaScope.',
    href: '/guides/how-to-measure-filament-td',
    readTime: '10 min read',
  },
  {
    icon: Star,
    badge: 'Ranked List',
    title: 'Best White Filaments for HueForge Lithophanes',
    description:
      'The top-10 white and natural filaments for HueForge ranked by TD value, with material comparisons for White PLA, White PETG, and White Silk PLA.',
    href: '/guides/best-white-filaments-for-hueforge',
    readTime: '6 min read',
  },
];

const TD_QUICK_REF = [
  { range: '0.5 – 2.0', label: 'Very Opaque', role: 'Dark anchor & base layers' },
  { range: '2.0 – 4.0', label: 'Opaque',      role: 'Standard base, multicolor stacks' },
  { range: '4.0 – 6.0', label: 'Semi',         role: 'Lithophanes, detail layers' },
  { range: '6.0+',      label: 'Translucent',  role: 'Backlit effects, silk highlights' },
];

// ─── Accent helpers ─────────────────────────────────────────────────────────

const ACCENT = {
  purple: {
    bg: 'bg-purple-500/10',
    border: 'border-purple-500/20',
    text: 'text-purple-400',
    badge: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
    icon: 'text-purple-400',
    cta: 'text-purple-400 hover:text-purple-300',
  },
  blue: {
    bg: 'bg-blue-500/10',
    border: 'border-blue-500/20',
    text: 'text-blue-400',
    badge: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
    icon: 'text-blue-400',
    cta: 'text-blue-400 hover:text-blue-300',
  },
  amber: {
    bg: 'bg-amber-500/10',
    border: 'border-amber-500/20',
    text: 'text-amber-400',
    badge: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
    icon: 'text-amber-400',
    cta: 'text-amber-400 hover:text-amber-300',
  },
};

// ─── Component ───────────────────────────────────────────────────────────────

export default function HueForgeHub() {
  const canonicalUrl = 'https://filascope.com/learn/hueforge';

  return (
    <>
      <DocumentHead
        title="HueForge Filament Guide Hub — TD Database, Finder & Tutorials | FilaScope"
        description="Everything you need for HueForge printing: TD value database, filament finder, beginner TD guides, measurement tutorials, and white filament rankings — all in one place."
        ogTitle="HueForge Filament Hub — TD Database, Guides & Finder"
        ogDescription="FilaScope's complete HueForge resource: search the TD database, find the best filaments, learn what TD means, and measure your own filament TD values."
      />
      <ArticleSchema
        headline="HueForge Filament Hub — TD Database, Guides & Finder"
        description="Everything you need for HueForge printing: TD value database, filament finder, beginner TD guides, measurement tutorials, and white filament rankings."
        datePublished="2026-02-20"
        dateModified="2026-02-20"
        url="/learn/hueforge"
        articleType="TechArticle"
        about={{ '@type': 'Thing', name: 'HueForge 3D Printing' }}
        proficiencyLevel="Beginner"
      />

      <div className="min-h-screen bg-background">
        {/* Breadcrumb */}
        <div className="max-w-5xl mx-auto px-4 py-6">
          <Breadcrumbs items={[
            { name: 'Learn', url: '/learn' },
            { name: 'HueForge Hub', url: '/learn/hueforge' },
          ]} />
        </div>

        {/* ── Hero ── */}
        <section className="bg-gradient-to-b from-purple-500/8 to-transparent py-12 px-4">
          <div className="max-w-5xl mx-auto">
            <Badge className="mb-4 bg-purple-500/10 text-purple-400 border-purple-500/20">
              <Sun className="w-3 h-3 mr-1" />
              HueForge Resource Hub · Updated Feb 2026
            </Badge>
            <h1 className="text-3xl md:text-4xl font-bold mb-4 text-foreground max-w-3xl">
              HueForge Filament Hub — Everything You Need for TD-Accurate Printing
            </h1>
            <p className="text-lg text-muted-foreground leading-relaxed max-w-2xl">
              FilaScope is home to the world's largest public HueForge TD database, a dedicated filament finder, and
              in-depth guides covering every aspect of Transmissivity Distance — from what TD means to how to measure
              it yourself.
            </p>
            {/* Jump links */}
            <nav aria-label="Section shortcuts" className="mt-6 flex flex-wrap gap-2">
              {['Tools & Databases', 'Guides', 'TD Quick Reference'].map((section) => (
                <a
                  key={section}
                  href={`#${section.toLowerCase().replace(/[^a-z]+/g, '-')}`}
                  className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground border border-border rounded-full px-3 py-1 transition-colors hover:border-border/80"
                >
                  {section}
                  <ChevronRight className="w-3 h-3" />
                </a>
              ))}
            </nav>
          </div>
        </section>

        <div className="max-w-5xl mx-auto px-4 py-10 space-y-16">

          {/* ── AI Snippet Zone ── */}
          <section aria-label="Quick Summary" className="bg-muted/30 border border-border/40 rounded-lg px-5 py-4">
            <p className="text-sm text-muted-foreground leading-relaxed">
              <strong className="text-foreground">FilaScope's HueForge hub</strong> provides tools, data, and guides
              for filament selection in HueForge lithophane and multicolor printing. Resources include a searchable
              Transmissivity Distance (TD) database, a filament finder filtered by TD range, and tutorials covering
              what TD means, how to measure it, and which white filaments perform best for lithophanes.
            </p>
            <p className="sr-only">
              HueForge requires accurate Transmissivity Distance (TD) values for every filament in a print stack.
              FilaScope provides a TD value database with 500+ verified measurements, a HueForge filament finder,
              curated best-filament rankings, and step-by-step guides on understanding and measuring TD.
            </p>
          </section>

          {/* ── Tools & Databases ── */}
          <section id="tools-databases">
            <h2 className="text-2xl font-bold mb-2">Tools &amp; Databases</h2>
            <p className="text-muted-foreground text-sm mb-6 max-w-2xl">
              Interactive tools for finding, filtering, and comparing filaments by their HueForge TD values.
            </p>
            <div className="grid md:grid-cols-3 gap-4">
              {TOOLS.map(({ icon: Icon, label, title, description, href, cta, accent }) => {
                const a = ACCENT[accent as keyof typeof ACCENT];
                return (
                  <Card key={href} className={`border ${a.border} flex flex-col hover:shadow-md transition-shadow`}>
                    <CardContent className="p-5 flex flex-col h-full">
                      <div className="flex items-start justify-between mb-3">
                        <div className={`w-9 h-9 rounded-lg ${a.bg} border ${a.border} flex items-center justify-center`}>
                          <Icon className={`w-4 h-4 ${a.icon}`} />
                        </div>
                        <Badge variant="outline" className={`text-xs ${a.badge}`}>{label}</Badge>
                      </div>
                      <h3 className="font-semibold text-sm mb-2 text-foreground leading-snug">{title}</h3>
                      <p className="text-xs text-muted-foreground leading-relaxed flex-1 mb-4">{description}</p>
                      <Link
                        to={href}
                        className={`inline-flex items-center gap-1 text-xs font-medium ${a.cta} transition-colors`}
                      >
                        {cta}
                        <ArrowRight className="w-3 h-3" />
                      </Link>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </section>

          {/* ── Guides ── */}
          <section id="guides">
            <h2 className="text-2xl font-bold mb-2">HueForge Guides</h2>
            <p className="text-muted-foreground text-sm mb-6 max-w-2xl">
              In-depth tutorials covering Transmissivity Distance from first principles to hands-on measurement.
            </p>
            <div className="space-y-4">
              {GUIDES.map(({ icon: Icon, badge, title, description, href, readTime }) => (
                <Link
                  key={href}
                  to={href}
                  className="group flex gap-4 p-4 rounded-xl border border-border bg-card/50 hover:border-purple-500/30 hover:bg-purple-500/5 transition-all"
                >
                  <div className="w-9 h-9 rounded-lg bg-purple-500/10 border border-purple-500/20 flex items-center justify-center shrink-0 mt-0.5 group-hover:bg-purple-500/20 transition-colors">
                    <Icon className="w-4 h-4 text-purple-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <Badge variant="outline" className="text-xs bg-purple-500/10 text-purple-400 border-purple-500/20">
                        {badge}
                      </Badge>
                      <span className="text-xs text-muted-foreground">{readTime}</span>
                    </div>
                    <h3 className="font-semibold text-sm text-foreground mb-1 group-hover:text-purple-300 transition-colors">
                      {title}
                    </h3>
                    <p className="text-xs text-muted-foreground leading-relaxed">{description}</p>
                  </div>
                  <ArrowRight className="w-4 h-4 text-muted-foreground shrink-0 mt-1 group-hover:text-purple-400 group-hover:translate-x-0.5 transition-all" />
                </Link>
              ))}
            </div>
          </section>

          {/* ── TD Quick Reference ── */}
          <section id="td-quick-reference">
            <h2 className="text-2xl font-bold mb-2">TD Quick Reference</h2>
            <p className="text-muted-foreground text-sm mb-4 max-w-2xl">
              How Transmissivity Distance ranges map to printing roles — use this as a starting point when building
              your filament stack.
            </p>
            <Card className="border-border overflow-hidden">
              <CardContent className="p-0 overflow-x-auto">
                <table className="w-full text-sm min-w-[420px]">
                  <thead>
                    <tr className="border-b border-border bg-muted/30">
                      <th className="text-left p-3 font-semibold">TD Range</th>
                      <th className="text-left p-3 font-semibold">Opacity</th>
                      <th className="text-left p-3 font-semibold">Typical Role</th>
                    </tr>
                  </thead>
                  <tbody>
                    {TD_QUICK_REF.map((row) => (
                      <tr key={row.range} className="border-b border-border last:border-0 hover:bg-muted/20 transition-colors">
                        <td className="p-3 font-mono text-xs font-medium text-purple-400">{row.range}</td>
                        <td className="p-3 text-sm">{row.label}</td>
                        <td className="p-3 text-xs text-muted-foreground">{row.role}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </CardContent>
            </Card>
            <p className="text-xs text-muted-foreground mt-3">
              Need exact values for a specific filament?{' '}
              <Link to="/hueforge-td-database" className="text-purple-400 hover:text-purple-300 transition-colors">
                Search the TD Database →
              </Link>
            </p>
          </section>

          {/* ── CTA Banner ── */}
          <section>
            <div className="rounded-xl border border-purple-500/20 bg-purple-500/5 p-6 flex flex-col sm:flex-row items-start sm:items-center gap-4">
              <div className="flex-1">
                <h2 className="font-bold text-lg mb-1">Find Your Filament's TD Value</h2>
                <p className="text-sm text-muted-foreground">
                  Search FilaScope's database of 500+ verified TD measurements — filter by brand, color family, or
                  material and see exactly which filaments fit your HueForge stack.
                </p>
              </div>
              <Link
                to="/hueforge-td-database"
                className="shrink-0 inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-purple-500/20 hover:bg-purple-500/30 text-purple-300 hover:text-purple-200 text-sm font-medium border border-purple-500/30 transition-all"
              >
                Open TD Database
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </section>

        </div>
      </div>
    </>
  );
}
