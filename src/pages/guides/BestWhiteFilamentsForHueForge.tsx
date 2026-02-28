import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { DocumentHead } from '@/components/seo/DocumentHead';
import { ArticleSchema, FAQSection } from '@/components/seo';
import { Breadcrumbs } from '@/components/seo/Breadcrumbs';
import { RelatedContentBlock } from '@/components/seo/RelatedContentBlock';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { normalizeColorHex } from '@/lib/utils';
import { Sun, ArrowRight, DollarSign } from 'lucide-react';

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
  transmission_distance: number | null;
}

const FAQS = [
  {
    question: 'What white filament is best for HueForge lithophanes?',
    answer: 'The best white filaments for HueForge lithophanes have a TD (Transmissivity Distance) value between 2.0 and 4.0. Filaments with community-verified TD values from brands like Bambu Lab, Polymaker, and eSUN consistently perform well. Always check FilaScope\'s TD database for your specific filament before printing.',
  },
  {
    question: 'Should I use white or natural PLA for lithophanes?',
    answer: 'White PLA (TD 1.5–4.0) is the standard choice for lithophane base layers. It produces a bright, clean white appearance with good contrast. Natural/translucent PLA has a much higher TD (4.0–8.0) and lets more light through, which can wash out fine details. Natural PLA is better for highlight layers or glow effects, not the primary base layer.',
  },
  {
    question: 'What TD value should white filament have for HueForge?',
    answer: 'For most HueForge lithophane projects, aim for a white filament with TD between 2.0 and 3.5. Lower TD (1.5–2.5) gives stronger contrast and is better for outdoor-lit lithophanes. Higher TD (3.0–4.5) lets more light through and works well for LED-backlit displays. Start in the middle (around TD 2.5–3.0) and adjust based on your results.',
  },
  {
    question: 'Does the brand of white PLA affect TD value?',
    answer: 'Yes, significantly. Two white PLAs from different brands can have TD values that differ by 1–2 units due to variations in titanium dioxide (TiO₂) concentration and polymer formulation. Even different shades of "white" from the same brand (bright white vs. cool white vs. warm white) can have noticeably different TD values. Always verify with FilaScope\'s database before starting a project.',
  },
];

function FilamentRankRow({ filament, rank }: { filament: FilamentRow; rank: number }) {
  const slug = filament.product_handle || filament.id;
  const name = filament.display_name || filament.product_title;
  const hex = normalizeColorHex(filament.color_hex, '#FFFFFF');

  return (
    <Card className="hover:border-primary transition-colors">
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0 w-9 h-9 rounded-full bg-muted flex items-center justify-center font-bold text-muted-foreground text-sm">
            #{rank}
          </div>
          <div className="flex-shrink-0 w-9 h-9 rounded-full border-2 border-border shadow-sm" style={{ backgroundColor: hex }} title={filament.color_family || 'White'} />
          <div className="flex-1 min-w-0">
            <p className="text-xs text-muted-foreground font-medium">{filament.vendor}</p>
            <p className="font-semibold truncate text-sm">{name}</p>
            <p className="text-xs text-muted-foreground">{filament.color_family} · {filament.material}</p>
            <div className="flex flex-wrap gap-1.5 mt-1.5">
              {filament.transmission_distance != null && (
                <Badge className="bg-purple-500/20 text-purple-400 border-purple-500/30 text-xs">
                  <Sun className="w-3 h-3 mr-1" />TD {filament.transmission_distance}
                </Badge>
              )}
              {filament.variant_price != null && (
                <Badge variant="outline" className="text-xs">
                  <DollarSign className="w-3 h-3" />{filament.variant_price.toFixed(2)}
                </Badge>
              )}
            </div>
          </div>
          <div className="flex-shrink-0 flex flex-col gap-1.5">
            <Button asChild size="sm" variant="outline" className="text-xs h-7"><Link to={`/filament/${slug}`}>View</Link></Button>
            <Button asChild size="sm" variant="ghost" className="text-xs h-7"><Link to={`/compare?add=${slug}`}>Compare</Link></Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function SkeletonCard() {
  return (
    <Card><CardContent className="p-4"><div className="flex items-start gap-3">
      <Skeleton className="w-9 h-9 rounded-full" />
      <Skeleton className="w-9 h-9 rounded-full" />
      <div className="flex-1 space-y-2">
        <Skeleton className="h-3 w-20" />
        <Skeleton className="h-4 w-48" />
        <div className="flex gap-1.5"><Skeleton className="h-5 w-16 rounded-full" /><Skeleton className="h-5 w-14 rounded-full" /></div>
      </div>
    </div></CardContent></Card>
  );
}

export default function BestWhiteFilamentsForHueForge() {
  const { data: filaments, isLoading } = useQuery({
    queryKey: ['best-white-filaments-hueforge-guide'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('filaments')
        .select('id, product_handle, product_title, display_name, vendor, material, color_family, color_hex, variant_price, transmission_distance')
        .in('color_family', ['White', 'Natural'])
        .not('transmission_distance', 'is', null)
        .order('transmission_distance', { ascending: true })
        .limit(10);
      if (error) throw error;
      return (data ?? []) as unknown as FilamentRow[];
    },
  });

  const ranked = filaments ?? [];
  const canonicalUrl = 'https://filascope.com/guides/best-white-filaments-for-hueforge';

  return (
    <>
      <DocumentHead
        title="Best White Filaments for HueForge Lithophanes 2026 | FilaScope"
        description="Find the best white PLA filaments for HueForge lithophane printing. Compare TD values, translucency, and prices for the top white filaments in 2026."
        ogTitle="Best White Filaments for HueForge Lithophanes — TD-Ranked"
        ogDescription="Top white and natural PLA filaments for HueForge, ranked by Transmissivity Distance (TD) value. Compare prices and buy links."
      />
      <ArticleSchema
        headline="Best White Filaments for HueForge Lithophanes — TD-Ranked"
        description="Find the best white PLA filaments for HueForge lithophane printing. Compare TD values, translucency, and prices for the top white filaments in 2026."
        datePublished="2026-02-20"
        dateModified="2026-02-20"
        url="/guides/best-white-filaments-for-hueforge"
        articleType="TechArticle"
        about={{ '@type': 'Thing', name: 'White Filament for HueForge Lithophanes' }}
        proficiencyLevel="Beginner"
      />

      <div className="min-h-screen bg-background">
        <div className="max-w-4xl mx-auto px-4 py-6">
          <Breadcrumbs items={[
            { name: 'Learn', url: '/learn' },
            { name: 'Best White Filaments for HueForge', url: '/guides/best-white-filaments-for-hueforge' },
          ]} />
        </div>

        {/* Hero */}
        <section className="bg-gradient-to-b from-purple-500/5 to-transparent py-12 px-4">
          <div className="max-w-4xl mx-auto">
            <Badge className="mb-4 bg-purple-500/10 text-purple-400 border-purple-500/20">
              <Sun className="w-3 h-3 mr-1" />
              HueForge Guide · Updated Feb 2026
            </Badge>
            <h1 className="text-3xl md:text-4xl font-bold mb-4 text-foreground">
              Best White Filaments for HueForge Lithophanes — TD-Ranked
            </h1>
            <p className="text-lg text-muted-foreground leading-relaxed max-w-2xl">
              White filament is the foundation of every HueForge lithophane stack. We've ranked the top white
              and natural filaments by their verified Transmissivity Distance (TD) values so you can choose
              the perfect base layer for your project.
            </p>
            <div className="flex flex-wrap gap-3 mt-4">
              <Link to="/hueforge-td-database" className="inline-flex items-center gap-1.5 text-sm text-purple-400 hover:text-purple-300 transition-colors">
                <Sun className="w-4 h-4" />Full TD Database<ArrowRight className="w-3.5 h-3.5" />
              </Link>
              <Link to="/guides/what-is-hueforge-td" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors">
                What is TD?<ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        </section>

        <div className="max-w-4xl mx-auto px-4 py-10 space-y-14">

          {/* AI Snippet Zone */}
          <section aria-label="Quick Summary" className="bg-muted/30 border border-border/40 rounded-lg px-5 py-4">
            <p className="text-sm text-muted-foreground leading-relaxed">
              The best white filaments for HueForge lithophanes are those with consistent TD values between 2.0
              and 4.0. White PLA is the most popular choice for lithophane base layers because of its high light
              diffusion and controlled opacity. Natural PLA (unpigmented) has higher TD values (4.0–8.0) and is
              better suited for highlight or glow layers.
            </p>
            <p className="sr-only">
              Summary: The best white filaments for HueForge lithophanes have TD values between 2.0 and 4.0.
              White PLA is the standard choice for base layers due to its consistent light diffusion. Natural PLA
              has higher TD values and works better as a highlight layer. FilaScope maintains a live database of
              the best white filaments for HueForge ranked by verified TD values.
            </p>
          </section>

          {/* Why White Matters */}
          <section>
            <h2 className="text-2xl font-bold mb-4">Why White Filament Matters for Lithophanes</h2>
            <div className="text-muted-foreground space-y-4 text-sm leading-relaxed">
              <p>
                In HueForge lithophane printing, your white or natural filament forms the light-transmitting base
                that all other colors are printed over. The TD value of this base layer directly controls how much
                light passes through the entire stack when it is backlit.
              </p>
              <p>
                If your white base has too low a TD (extremely opaque), the lithophane will appear flat and
                overexposed — fine details in dark areas disappear because not enough light differential exists
                between thin and thick sections. If the white base has too high a TD (too translucent), highlights
                become washed out and the overall image loses contrast.
              </p>
              <p>
                Most HueForge users find the sweet spot for their white base between TD 2.0 and TD 3.5 for
                standard backlit lithophanes. For outdoor or sun-lit lithophanes, lower TD (1.5–2.5) typically
                works better due to the much higher ambient light level.
              </p>
            </div>
          </section>

          {/* Live Ranked Table */}
          <section>
            <h2 className="text-2xl font-bold mb-2">Top White Filaments for HueForge — Ranked by TD</h2>
            <p className="text-muted-foreground text-sm mb-4">
              Live data from the FilaScope database. Sorted ascending — lower TD = more opaque.
            </p>
            <div className="space-y-2">
              {isLoading
                ? Array.from({ length: 10 }).map((_, i) => <SkeletonCard key={i} />)
                : ranked.length > 0
                ? ranked.map((f, i) => <FilamentRankRow key={f.id} filament={f} rank={i + 1} />)
                : (
                  <p className="text-center text-muted-foreground py-8 text-sm">
                    No white filaments with TD values found.{' '}
                    <Link to="/hueforge-td-database" className="text-purple-400 hover:text-purple-300">Check the full TD Database</Link>.
                  </p>
                )
              }
            </div>
            <div className="mt-4">
              <Button asChild variant="outline" size="sm">
                <Link to="/hueforge-td-database">
                  <Sun className="w-4 h-4 mr-1.5" />View Full TD Database
                  <ArrowRight className="w-3.5 h-3.5 ml-1" />
                </Link>
              </Button>
            </div>
          </section>

          {/* White vs PETG vs Silk */}
          <section>
            <h2 className="text-2xl font-bold mb-4">How to Choose Between White PLA, White PETG, and White Silk</h2>
            <div className="grid sm:grid-cols-3 gap-4">
              {[
                {
                  title: 'White PLA',
                  tdRange: 'TD 1.5 – 3.5',
                  pros: ['Most popular choice', 'Consistent batch to batch', 'Easy to print', 'Wide brand selection'],
                  cons: ['Slightly brittle', 'Not ideal for outdoor display'],
                },
                {
                  title: 'White PETG',
                  tdRange: 'TD 2.5 – 5.0',
                  pros: ['More durable than PLA', 'Better for outdoor lithophanes', 'More translucent range'],
                  cons: ['Harder to dial in settings', 'More stringing', 'Less consistent between brands'],
                },
                {
                  title: 'White Silk PLA',
                  tdRange: 'TD 4.0 – 7.0',
                  pros: ['Highly translucent', 'Beautiful sheen', 'Good for backlit displays'],
                  cons: ['Higher TD reduces contrast', 'Not ideal for standard lithophanes', 'More expensive'],
                },
              ].map(({ title, tdRange, pros, cons }) => (
                <div key={title} className="rounded-lg border border-border bg-card p-4">
                  <h3 className="font-semibold mb-1">{title}</h3>
                  <Badge className="mb-3 bg-purple-500/10 text-purple-400 border-purple-500/20 text-xs">{tdRange}</Badge>
                  <div className="space-y-2">
                    <div>
                      <p className="text-xs font-medium text-green-400 mb-1">Pros</p>
                      <ul className="space-y-1">
                        {pros.map(p => <li key={p} className="text-xs text-muted-foreground">✓ {p}</li>)}
                      </ul>
                    </div>
                    <div>
                      <p className="text-xs font-medium text-destructive mb-1">Cons</p>
                      <ul className="space-y-1">
                        {cons.map(c => <li key={c} className="text-xs text-muted-foreground">✗ {c}</li>)}
                      </ul>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>

          <FAQSection
            faqs={FAQS}
            title="White Filament for HueForge — Frequently Asked Questions"
          />

          <RelatedContentBlock
            title="Related Resources"
            links={[
              { label: 'HueForge TD Database', href: '/hueforge-td-database', description: 'Full transmissivity database for all filaments' },
              { label: 'Best Filaments for HueForge', href: '/guides/best-filaments-for-hueforge', description: 'TD-ranked picks across all colors and materials' },
              { label: 'What Is HueForge TD?', href: '/guides/what-is-hueforge-td', description: 'Complete beginner guide to TD values' },
              { label: 'How to Measure Filament TD', href: '/guides/how-to-measure-filament-td', description: 'Measure your own filament TD values' },
              { label: 'PLA Materials Guide', href: '/materials/pla', description: 'Everything about PLA filament' },
              { label: 'Browse All Colors', href: '/colors', description: 'Find filaments by color with TD data' },
            ]}
          />
        </div>
      </div>
    </>
  );
}
