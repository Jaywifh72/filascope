import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { DocumentHead } from '@/components/seo/DocumentHead';
import { ArticleSchema, BreadcrumbSchema, ItemListSchema, FAQSection, Breadcrumbs } from '@/components/seo';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { normalizeColorHex } from '@/lib/utils';
import { ArrowRight, Thermometer, Ruler, Weight, ShieldCheck } from 'lucide-react';

const FAQS = [
  {
    question: 'What is the best PLA filament brand?',
    answer: 'The top PLA filament brands in 2026 are Bambu Lab, Prusament, eSUN, Hatchbox, and Polymaker. Bambu Lab PLA Basic offers exceptional consistency at a competitive price. Prusament PLA is manufactured to tight ±0.02mm tolerance. eSUN PLA+ is the go-to budget option with excellent reliability. The best brand for you depends on regional availability, printer compatibility, and your quality-vs-price priority.',
  },
  {
    question: 'Is PLA+ better than regular PLA?',
    answer: 'PLA+ (also called PLA Pro or Tough PLA) is a modified PLA formulation with improved impact resistance and reduced brittleness. It prints at similar temperatures to standard PLA but produces parts that are less likely to shatter on impact. The tradeoff is a slightly higher price and occasionally reduced detail on very fine features. For functional prints, PLA+ is generally worth the upgrade.',
  },
  {
    question: 'What temperature should I print PLA at?',
    answer: 'Most PLA filaments print best at 190-220°C nozzle temperature and 50-60°C bed temperature. Start at 210°C and adjust in 5°C increments. Too low causes under-extrusion and poor layer adhesion; too high causes stringing and oozing. Always check the manufacturer-recommended range printed on the spool or product page — some specialty PLAs (silk, wood-fill) run hotter.',
  },
  {
    question: 'How long does PLA filament last?',
    answer: 'Unopened PLA filament stored in a cool, dry place lasts 1-2 years. Once opened, PLA absorbs moisture from the air which degrades print quality — you will notice popping sounds, stringing, and rough surfaces. Store opened spools in a sealed container with desiccant packets, or use a filament dry box. If a spool has absorbed moisture, dry it at 45-50°C for 4-6 hours before printing.',
  },
  {
    question: 'What is the cheapest good PLA filament?',
    answer: 'eSUN PLA+ is consistently the best budget PLA, typically $15-20 per kg with reliable quality. Bambu Lab PLA Basic is competitively priced if you order directly. For bulk printing, Overture PLA and SUNLU PLA offer decent quality at even lower price points. Avoid no-name brands under $12/kg — poor diameter tolerance leads to jams and failed prints that waste more money than you save.',
  },
];

const PLA_TRAITS = [
  { icon: Thermometer, label: 'Temperature Range', desc: 'Look for 190-220°C nozzle. Lower ranges mean easier printing on basic printers without all-metal hotends.' },
  { icon: Ruler, label: 'Diameter Tolerance', desc: 'Premium PLA holds ±0.02mm. Budget PLA at ±0.05mm is acceptable. Wider tolerance causes inconsistent extrusion.' },
  { icon: Weight, label: 'Spool Weight', desc: '1kg is standard. Larger 2-3kg spools offer better per-gram value for high-volume printers.' },
  { icon: ShieldCheck, label: 'Brand Reliability', desc: 'Established brands publish technical data sheets and maintain batch-to-batch consistency — critical for repeatable results.' },
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

export default function BestPLAFilament() {
  const { data: filaments, isLoading } = useQuery({
    queryKey: ['best-pla-filaments'],
    queryFn: async () => {
      const { data } = await supabase
        .from('filaments')
        .select('id, product_handle, product_title, display_name, vendor, material, color_family, color_hex, variant_price, filascope_score')
        .or('material.ilike.%PLA%,material.ilike.%pla%')
        .not('material', 'ilike', '%PETG%')
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
    { name: 'Guides', url: '/guides' },
    { name: 'Best PLA Filament', url: '/guides/best-pla-filaments' },
  ];

  const itemListItems = (filaments ?? []).map((f, i) => ({
    name: `${f.vendor} ${f.display_name || f.product_title}`,
    url: `https://filascope.com/filament/${f.product_handle || f.id}`,
    description: f.material ? `${f.material} filament` : 'PLA filament',
    position: i + 1,
  }));

  return (
    <>
      <DocumentHead
        title="Best PLA Filament 2026 — Top 12 Picks Ranked by FilaScore | FilaScope"
        description="The best PLA filaments in 2026 — ranked by quality, price & print performance. Data-driven picks from 16,000+ filaments across Bambu Lab, Prusament, Hatchbox, eSUN & more."
        canonical="https://filascope.com/guides/best-pla-filaments"
        ogType="article"
        keywords="best pla filament, best pla filament 2026, top pla filament, pla filament review, best pla for 3d printing"
      />
      <ArticleSchema
        headline="Best PLA Filament in 2026 — Top 12 Picks Ranked"
        description="The best PLA filaments in 2026 — ranked by quality, price, and print performance using the FilaScore algorithm."
        datePublished="2026-03-01"
        dateModified="2026-03-22"
        url="/guides/best-pla-filaments"
      />
      <BreadcrumbSchema items={breadcrumbs.map(b => ({ name: b.name, url: `https://filascope.com${b.url}` }))} />
      <ItemListSchema
        name="Best PLA Filament 2026"
        description="Top 12 PLA filaments ranked by FilaScore"
        items={itemListItems}
      />

      <div className="min-h-screen bg-background">
        {/* Hero */}
        <section className="bg-gradient-to-b from-primary/5 to-transparent py-12 px-4">
          <div className="max-w-4xl mx-auto">
            <Breadcrumbs items={breadcrumbs} className="mb-6" />
            <Badge className="mb-4 bg-primary/10 text-primary border-primary/20">Updated Mar 2026</Badge>
            <h1 className="text-3xl md:text-4xl font-bold mb-4 text-foreground">
              Best PLA Filament in 2026
            </h1>
            <p className="text-lg text-muted-foreground leading-relaxed max-w-2xl">
              PLA is the most popular 3D printing filament for good reason — it's easy to print, affordable, and produces
              excellent surface finishes. We've ranked the top 12 PLA filaments using FilaScore, weighing quality
              consistency, pricing, tolerance, and community data from 48+ brands.
            </p>
          </div>
        </section>

        <div className="max-w-4xl mx-auto px-4 py-10 space-y-14">

          {/* Why PLA */}
          <section>
            <h2 className="text-2xl font-bold mb-4">Why PLA?</h2>
            <div className="prose prose-sm max-w-none text-muted-foreground space-y-3">
              <p>
                PLA (polylactic acid) is a plant-based thermoplastic derived from corn starch or sugarcane. It prints
                at low temperatures (190-220°C), requires no heated bed or enclosure, warps minimally, and works
                on virtually every FDM printer out of the box. These properties make it the default choice for
                beginners, hobbyists, and anyone printing decorative or low-stress parts.
              </p>
              <p>
                The tradeoff is that PLA is more brittle than PETG or ABS and softens at relatively low temperatures
                (~60°C), so it isn't ideal for functional parts exposed to heat or repeated impact. But for prototyping,
                display models, cosplay props, HueForge projects, and general-purpose printing, nothing beats PLA's
                combination of ease, quality, and price.
              </p>
              <p>
                With hundreds of PLA variants on the market — including PLA+, Silk PLA, Matte PLA, and specialty
                blends — the challenge isn't finding PLA, it's finding <em>good</em> PLA. The ranked list below
                surfaces the top-performing options based on real data, not marketing claims.
              </p>
            </div>
          </section>

          {/* Top 12 */}
          <section>
            <h2 className="text-2xl font-bold mb-2">Top 12 PLA Filaments — Ranked by FilaScore</h2>
            <p className="text-sm text-muted-foreground mb-6">
              Ranked using the FilaScore algorithm across quality, pricing, availability, and community data. Higher score = better overall pick.
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
                            <div className="text-xs text-muted-foreground">{f.vendor} · {f.material || 'PLA'}</div>
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
              <Link to="/filaments/pla" className="inline-flex items-center gap-2 text-sm text-primary hover:underline">
                Browse all PLA filaments in the database <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </section>

          {/* What to look for */}
          <section>
            <h2 className="text-2xl font-bold mb-4">What to Look for in PLA Filament</h2>
            <div className="grid sm:grid-cols-2 gap-4">
              {PLA_TRAITS.map(({ icon: Icon, label, desc }) => (
                <Card key={label} className="border-border">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Icon className="w-4 h-4 text-primary" />
                      <span className="font-semibold text-sm">{label}</span>
                    </div>
                    <p className="text-xs text-muted-foreground leading-relaxed">{desc}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </section>

          {/* Internal links */}
          <section className="bg-muted/30 rounded-xl p-6 border border-border">
            <h2 className="text-lg font-semibold mb-4">Related Pages</h2>
            <div className="grid sm:grid-cols-2 gap-3">
              {[
                { to: '/filaments/pla', label: 'Browse All PLA Filaments' },
                { to: '/filament-temperature-chart', label: 'Filament Temperature Chart' },
                { to: '/colors', label: 'Filament Color Browser' },
                { to: '/guides/pla-vs-petg', label: 'PLA vs PETG — Full Comparison' },
                { to: '/guides/best-filaments-for-beginners', label: 'Best Filaments for Beginners' },
              ].map((link) => (
                <Link key={link.to} to={link.to} className="flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors">
                  <ArrowRight className="w-3.5 h-3.5 text-primary shrink-0" />
                  {link.label}
                </Link>
              ))}
            </div>
          </section>

          <FAQSection faqs={FAQS} title="Frequently Asked Questions — Best PLA Filament" />
        </div>
      </div>
    </>
  );
}
