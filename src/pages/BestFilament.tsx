import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { DocumentHead } from '@/components/seo/DocumentHead';
import { ArticleSchema, BreadcrumbSchema, ItemListSchema, FAQSection, Breadcrumbs } from '@/components/seo';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { normalizeColorHex } from '@/lib/utils';
import { ArrowRight, Trophy, Star, Zap, Shield, Layers } from 'lucide-react';

const FAQS = [
  {
    question: 'What is the best 3D printer filament overall?',
    answer: 'PLA is the best all-around 3D printer filament for most users — it is the easiest to print, widely available, affordable, and works on virtually every FDM printer without an enclosure. For functional or heat-resistant parts, PETG is the next step up. For the absolute highest-ranked filaments across all materials, see our FilaScore rankings above.',
  },
  {
    question: 'What is the best filament for beginners?',
    answer: 'PLA is the universal recommendation for beginners. It prints at low temperatures (190–220°C), requires no enclosed printer, warps minimally, and is available from dozens of reliable brands. Top beginner picks include Bambu Lab PLA Basic, eSUN PLA+, and Hatchbox PLA.',
  },
  {
    question: 'Is PLA or PETG better?',
    answer: 'PLA is better for decorative, detailed, and low-stress prints — it is easier to print and cheaper. PETG is better for functional parts that need impact resistance, heat tolerance (up to ~80°C), and moisture resistance. Both are excellent choices; the right one depends on your application.',
  },
  {
    question: 'What filament is the strongest?',
    answer: 'Polycarbonate (PC) is the strongest common 3D printing filament, followed by PA/Nylon and carbon-fiber reinforced composites. For practical use, Nylon-CF offers the best combination of strength, stiffness, and printability. These require advanced printer setups with all-metal hotends and enclosed chambers.',
  },
  {
    question: 'What is the cheapest good 3D printer filament?',
    answer: 'eSUN PLA+ consistently delivers excellent quality at budget prices — typically $15–20 per kg. Bambu Lab house-brand PLA is competitively priced with excellent consistency. For the cheapest options currently in stock across all brands, see our dedicated cheapest filament page.',
  },
];

const MATERIAL_TIERS = [
  { slug: 'pla', label: 'PLA', desc: 'Best for beginners. Easy, cheap, minimal warping.', icon: Star, color: 'text-green-400' },
  { slug: 'petg', label: 'PETG', desc: 'Great all-rounder. Stronger, more heat-resistant than PLA.', icon: Shield, color: 'text-blue-400' },
  { slug: 'abs', label: 'ABS', desc: 'Heat-resistant engineering plastic. Needs an enclosure.', icon: Zap, color: 'text-orange-400' },
  { slug: 'asa', label: 'ASA', desc: 'Outdoor-grade UV-resistant ABS alternative.', icon: Zap, color: 'text-yellow-400' },
  { slug: 'tpu', label: 'TPU', desc: 'Flexible, rubber-like. Perfect for phone cases and gaskets.', icon: Layers, color: 'text-purple-400' },
  { slug: 'nylon', label: 'Nylon', desc: 'Engineering-grade strength. Fatigue and chemical resistant.', icon: Trophy, color: 'text-red-400' },
];

interface FilamentRow {
  id: string;
  product_handle: string | null;
  product_title: string;
  display_name: string | null;
  vendor: string;
  material: string | null;
  color_family: string | null;
  color_hex: string | null;
  variant_price: number | null;
  filascope_score: number | null;
}

export default function BestFilament() {
  const { data: filaments, isLoading } = useQuery({
    queryKey: ['best-filament-overall'],
    queryFn: async () => {
      const { data } = await supabase
        .from('filaments')
        .select('id, product_handle, product_title, display_name, vendor, material, color_family, color_hex, variant_price, filascope_score')
        .not('filascope_score', 'is', null)
        .not('variant_price', 'is', null)
        .order('filascope_score', { ascending: false })
        .limit(12);
      return (data ?? []) as FilamentRow[];
    },
    staleTime: 1000 * 60 * 30,
  });

  const breadcrumbs = [
    { name: 'Home', url: '/' },
    { name: 'Best 3D Printer Filament', url: '/best-3d-printer-filament' },
  ];

  const itemListItems = (filaments ?? []).map((f, i) => ({
    name: `${f.vendor} ${f.display_name || f.product_title}`,
    url: `https://filascope.com/filament/${f.product_handle || f.id}`,
    description: f.material ? `${f.material} filament` : 'Filament',
    position: i + 1,
  }));

  return (
    <>
      <DocumentHead
        title="Best 3D Printer Filament 2026 — Top Picks Across All Materials | FilaScope"
        description="The best 3D printer filament in 2026 — ranked by FilaScore across PLA, PETG, ABS, TPU, and more. Find the right filament for your printer and project."
        ogType="article"
      />
      <ArticleSchema
        headline="Best 3D Printer Filament in 2026 — Every Material Ranked"
        description="The best 3D printer filament in 2026 — ranked by FilaScore across PLA, PETG, ABS, TPU, and more."
        datePublished="2026-01-01"
        dateModified="2026-02-20"
        url="/best-3d-printer-filament"
      />
      <BreadcrumbSchema items={breadcrumbs.map(b => ({ name: b.name, url: `https://filascope.com${b.url}` }))} />
      <ItemListSchema
        name="Best 3D Printer Filament 2026"
        description="Top-ranked filaments across all materials by FilaScore"
        items={itemListItems}
      />

      <div className="min-h-screen bg-background">
        {/* Hero */}
        <section className="bg-gradient-to-b from-primary/5 to-transparent py-12 px-4">
          <div className="max-w-4xl mx-auto">
            <Breadcrumbs items={breadcrumbs} className="mb-6" />
            <Badge className="mb-4 bg-primary/10 text-primary border-primary/20">Updated Feb 2026</Badge>
            <h1 className="text-3xl md:text-4xl font-bold mb-4 text-foreground">
              Best 3D Printer Filament in 2026 — Every Material Ranked
            </h1>
            <p className="text-lg text-muted-foreground leading-relaxed max-w-2xl">
              Choosing the right filament is the most impactful decision you can make for your 3D printing results.
              We've ranked the top filaments from 48+ brands using our FilaScore algorithm — weighing quality consistency,
              pricing, regional availability, documentation quality, and community data — so you don't have to guess.
            </p>
          </div>
        </section>

        <div className="max-w-4xl mx-auto px-4 py-10 space-y-14">

          {/* Why filament choice matters */}
          <section>
            <h2 className="text-2xl font-bold mb-4">How to Choose the Best 3D Printer Filament</h2>
            <div className="prose prose-sm max-w-none text-muted-foreground space-y-3">
              <p>
                Your filament determines everything about your print: mechanical strength, heat resistance, surface finish,
                printability, and cost. Unlike choosing a printer — a one-time purchase — you'll buy filament repeatedly,
                and the wrong choice costs you failed prints, wasted time, and frustration.
              </p>
              <p>
                The 3D printing filament market has grown dramatically. There are now thousands of options across hundreds
                of brands, making it genuinely difficult to separate quality filament from cheap alternatives that ship
                with inconsistent diameter, poor adhesion, and no technical data sheets. That's why FilaScope indexes
                specifications, prices, and community data from 48+ brands into one searchable database.
              </p>
              <p>
                <strong className="text-foreground">For most people, the decision tree is simple:</strong> Start with PLA.
                Once you've mastered PLA, move to PETG for functional parts or ASA for outdoor applications.
                Advanced users printing engineering-grade parts should consider Nylon, carbon-fiber composites, or Polycarbonate.
                The ranked list below covers the top-scoring filaments across all materials — with{' '}
                <Link to="/pla-vs-petg" className="text-primary hover:underline">PLA vs PETG</Link> being the most common first upgrade decision.
              </p>
              <p>
                Our <strong className="text-foreground">FilaScore algorithm</strong> weights each filament on quality consistency,
                brand reputation, price competitiveness, regional availability across US/EU/AU/CA, community print data,
                HueForge TD values, and technical documentation completeness. Higher scores indicate filaments that reliably
                perform across diverse use cases and user skill levels.
              </p>
            </div>
          </section>

          {/* Material tier overview */}
          <section>
            <h2 className="text-2xl font-bold mb-4">Filament Materials at a Glance</h2>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {MATERIAL_TIERS.map(({ slug, label, desc, icon: Icon, color }) => (
                <Link key={slug} to={`/filaments/${slug}`}>
                  <Card className="border-border hover:border-primary/40 transition-all h-full">
                    <CardContent className="p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <Icon className={`w-4 h-4 ${color}`} />
                        <span className="font-semibold text-sm">{label}</span>
                      </div>
                      <p className="text-xs text-muted-foreground leading-relaxed">{desc}</p>
                      <span className="text-xs text-primary mt-2 inline-flex items-center gap-1">Browse {label} <ArrowRight className="w-3 h-3" /></span>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          </section>

          {/* Top ranked */}
          <section>
            <h2 className="text-2xl font-bold mb-2">Top 12 Filaments — Ranked by FilaScore</h2>
            <p className="text-sm text-muted-foreground mb-6">
              Ranked across all materials using the FilaScore algorithm. Higher score = more reliable, better documented, widely available.
            </p>
            {isLoading ? (
              <div className="grid sm:grid-cols-2 gap-4">
                {Array.from({ length: 12 }).map((_, i) => <Skeleton key={i} className="h-24 rounded-xl" />)}
              </div>
            ) : (
              <div className="grid sm:grid-cols-2 gap-4">
                {(filaments ?? []).map((f, i) => {
                  const hex = normalizeColorHex(f.color_hex);
                  const name = f.display_name || f.product_title;
                  return (
                    <Link key={f.id} to={`/filament/${f.product_handle || f.id}`}>
                      <Card className="border-border hover:border-primary/50 hover:bg-card/80 transition-all group h-full">
                        <CardContent className="p-4 flex items-center gap-4">
                          <span className="text-2xl font-bold text-muted-foreground/30 w-8 shrink-0">#{i + 1}</span>
                          {hex && (
                            <div
                              className="w-8 h-8 rounded-full border border-border shrink-0"
                              style={{ backgroundColor: hex }}
                              aria-hidden="true"
                            />
                          )}
                          <div className="flex-1 min-w-0">
                            <div className="font-semibold text-sm group-hover:text-primary transition-colors truncate">{name}</div>
                            <div className="text-xs text-muted-foreground">{f.vendor} · {f.material || 'Filament'}</div>
                            {f.variant_price && (
                              <div className="text-xs text-primary font-medium mt-0.5">${f.variant_price.toFixed(2)}</div>
                            )}
                          </div>
                          {f.filascope_score && (
                            <Badge variant="outline" className="text-xs shrink-0">
                              {f.filascope_score.toFixed(1)}
                            </Badge>
                          )}
                        </CardContent>
                      </Card>
                    </Link>
                  );
                })}
              </div>
            )}
            <div className="mt-4 text-center">
              <Link to="/filaments" className="inline-flex items-center gap-2 text-sm text-primary hover:underline">
                Browse all filaments in the database <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </section>

          {/* Internal links */}
          <section className="bg-muted/30 rounded-xl p-6 border border-border">
            <h2 className="text-lg font-semibold mb-4">Explore by Category</h2>
            <div className="grid sm:grid-cols-2 gap-3">
              {[
                { to: '/best-filaments-for-beginners', label: 'Best Filaments for Beginners' },
                { to: '/pla-vs-petg', label: 'PLA vs PETG — Full Comparison' },
                { to: '/filament-types', label: 'All Filament Types Explained' },
                { to: '/cheapest-filament', label: 'Cheapest 3D Printer Filament' },
                { to: '/best-filaments-for-hueforge', label: 'Best Filaments for HueForge' },
                { to: '/deals', label: 'Current Filament Deals' },
              ].map((link) => (
                <Link key={link.to} to={link.to} className="flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors">
                  <ArrowRight className="w-3.5 h-3.5 text-primary shrink-0" />
                  {link.label}
                </Link>
              ))}
            </div>
          </section>

          <FAQSection faqs={FAQS} title="Frequently Asked Questions — Best 3D Printer Filament" />
        </div>
      </div>
    </>
  );
}
