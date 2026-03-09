import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { DocumentHead } from '@/components/seo/DocumentHead';
import { ArticleSchema, FAQSection } from '@/components/seo';
import { Breadcrumbs } from '@/components/seo/Breadcrumbs';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { normalizeColorHex } from '@/lib/utils';
import { CheckCircle, Thermometer, Package, BookOpen, ArrowRight, Lightbulb, Shield, Zap } from 'lucide-react';


const FAQS = [
  {
    question: 'What is the best filament for beginners?',
    answer: 'PLA (Polylactic Acid) is universally recommended for beginners. It prints at low temperatures (190–220°C), requires no heated enclosure, warps minimally, and is available in hundreds of colors. Brands like Hatchbox, eSUN, and Bambu Lab offer reliable, affordable PLA that produces excellent results on most printers.',
  },
  {
    question: 'What temperature should I print PLA at?',
    answer: 'For most PLA filaments, set your nozzle to 200–215°C and your bed to 50–60°C. Start in the middle of the recommended range on the label and adjust in 5°C increments. Signs of too-low temperature: poor layer adhesion, rough surface. Too high: stringing and oozing.',
  },
  {
    question: 'Do I need a heated bed for PLA?',
    answer: 'PLA can technically print without a heated bed, but a bed at 50–60°C significantly improves first-layer adhesion and reduces warping. Most modern printers have a heated bed, and we recommend using it at 55°C for best results.',
  },
  {
    question: 'How do I store PLA filament?',
    answer: 'Store PLA in an airtight container or sealed bag with silica gel desiccant. PLA absorbs moisture from the air, which causes popping, stringing, and surface defects during printing. If your filament has been exposed to humidity, dry it at 45–50°C for 4–6 hours before use.',
  },
  {
    question: 'When should I switch from PLA to PETG?',
    answer: 'Move to PETG when your prints need better heat resistance (PLA softens at ~60°C), more impact resistance, or outdoor durability. PETG is only slightly harder to print than PLA and is an excellent second material for beginners who have mastered PLA.',
  },
  {
    question: 'What filament should I buy first for my 3D printer?',
    answer: 'Start with PLA in a light color (white or light gray) so you can clearly see print quality issues. A 1kg spool from Bambu Lab, Hatchbox, or eSUN costs under $20 and will last through dozens of test prints while you learn your printer\'s settings.',
  },
  {
    question: 'Is expensive filament worth it for beginners?',
    answer: 'Not initially. Budget PLA from reliable brands like Hatchbox, eSUN, or Overture ($15-18/kg) prints just as well for learning. Premium filaments ($22-30/kg) from Prusament or Polymaker offer tighter tolerances and more color consistency, but the difference only matters once you have experience dialing in your printer.',
  },
  {
    question: 'How should I store 3D printer filament?',
    answer: 'Store filament in airtight containers or sealed bags with silica desiccant packets. PLA absorbs moisture from air which causes popping, stringing, and rough surface finish during printing. A dry box or vacuum-sealed bag extends filament life significantly.',
  },
  {
    question: 'Do I need different filament for different 3D printers?',
    answer: 'Most FDM printers use standard 1.75mm filament regardless of brand. Check your printer\'s max nozzle temperature — if it reaches 260°C+, you can use PETG, ABS, and TPU in addition to PLA. Budget printers limited to 240°C should stick with PLA and PLA+.',
  },
  {
    question: 'How much filament do I need to get started?',
    answer: 'One 1kg spool is enough for 20-50 small prints (phone stands, keychains, small figurines). For a complete beginner kit, get one spool of white PLA and one of black PLA — this covers most starter projects and lets you learn with good visual feedback.',
  },
];

const BEGINNER_TIPS = [
  {
    icon: Thermometer,
    title: 'Start with the Right Temperature',
    tip: 'Print at 200–215°C nozzle and 55°C bed. Use the temperature recommended on the spool label as your starting point.',
  },
  {
    icon: Zap,
    title: 'Slow Down for Better Results',
    tip: 'Print at 40–60mm/s while learning. Slower speeds reduce errors and give you more time to spot problems early.',
  },
  {
    icon: Package,
    title: 'Level Your Bed Carefully',
    tip: 'A properly leveled bed is the single biggest factor for print success. The first layer should be slightly squished into the build plate.',
  },
  {
    icon: Shield,
    title: 'Store Filament Properly',
    tip: 'Keep PLA sealed with desiccant when not in use. Wet filament creates bubbles, stringing, and weak prints.',
  },
  {
    icon: Lightbulb,
    title: 'Stick with Verified Brands',
    tip: 'Budget no-name filaments have inconsistent diameter and quality. Start with Hatchbox, eSUN, Bambu Lab, or Polymaker.',
  },
  {
    icon: BookOpen,
    title: 'Learn From Your Prints',
    tip: 'Every failed print teaches you something. Use our Diagnose tool to identify common issues like stringing, warping, and layer separation.',
  },
];

interface FilamentRow {
  id: string;
  product_handle: string | null;
  product_title: string;
  display_name: string | null;
  vendor: string;
  color_family: string | null;
  color_hex: string | null;
  variant_price: number | null;
  filascope_score: number | null;
}

export default function BestFilamentsForBeginners() {
  const { data: filaments, isLoading } = useQuery({
    queryKey: ['beginners-top-pla'],
    queryFn: async () => {
      const { data } = await supabase
        .from('filaments')
        .select('id, product_handle, product_title, display_name, vendor, color_family, color_hex, variant_price, filascope_score')
        .eq('material', 'PLA')
        .not('filascope_score', 'is', null)
        .order('filascope_score', { ascending: false })
        .limit(8);
      return (data ?? []) as FilamentRow[];
    },
    staleTime: 1000 * 60 * 30,
  });

  return (
    <>
      <DocumentHead
        title="Best Filaments for Beginners 2026 — Easiest to Print | FilaScope"
        description="The best 3D printer filaments for beginners in 2026. Start with easy-to-print PLA picks from 48+ brands, with tips, temperature guides, and storage advice."
        ogTitle="Best 3D Printer Filaments for Beginners in 2026"
        ogDescription="Curated PLA picks, beginner tips, temperature guides, and storage advice for new 3D printer owners."
      />
      <ArticleSchema
        headline="Best 3D Printer Filaments for Beginners in 2026"
        description="The best 3D printer filaments for beginners in 2026. Start with easy-to-print PLA picks from 48+ brands, with tips, temperature guides, and storage advice."
        datePublished="2026-01-10"
        dateModified="2026-02-20"
        url="/guides/best-filaments-for-beginners"
        articleType="TechArticle"
        about={{ '@type': 'Thing', name: '3D Printer Filament for Beginners' }}
        proficiencyLevel="Beginner"
      />

      <div className="min-h-screen bg-background">
        <div className="max-w-4xl mx-auto px-4 py-6">
          <Breadcrumbs items={[
            { name: 'Guides', url: '/learn' },
            { name: 'Best Filaments for Beginners', url: '/guides/best-filaments-for-beginners' },
          ]} />
        </div>

        {/* Hero */}
        <section className="bg-gradient-to-b from-primary/5 to-transparent py-12 px-4">
          <div className="max-w-4xl mx-auto">
            <Badge className="mb-4 bg-primary/10 text-primary border-primary/20">Beginner Guide · Updated Feb 2026</Badge>
            <h1 className="text-3xl md:text-4xl font-bold mb-4 text-foreground">
              Best 3D Printer Filaments for Beginners in 2026
            </h1>
            <p className="text-lg text-muted-foreground leading-relaxed max-w-2xl">
              New to 3D printing? Start with PLA — it's forgiving, widely available, and produces great results on virtually any printer.
              Below we've curated the top beginner-friendly PLA filaments ranked by our FilaScore algorithm, plus everything you need
              to know to succeed from day one.
            </p>
            <div className="flex flex-wrap gap-3 mt-6 text-sm">
              <span className="flex items-center gap-1.5 text-muted-foreground"><CheckCircle className="w-4 h-4 text-green-500" /> No enclosure needed</span>
              <span className="flex items-center gap-1.5 text-muted-foreground"><CheckCircle className="w-4 h-4 text-green-500" /> Prints at 190–220°C</span>
              <span className="flex items-center gap-1.5 text-muted-foreground"><CheckCircle className="w-4 h-4 text-green-500" /> Minimal warping</span>
              <span className="flex items-center gap-1.5 text-muted-foreground"><CheckCircle className="w-4 h-4 text-green-500" /> Biodegradable</span>
            </div>
          </div>
        </section>

        <div className="max-w-4xl mx-auto px-4 py-10 space-y-14">

          {/* Why PLA */}
          <section>
            <h2 className="text-2xl font-bold mb-4">Why PLA Is the Best Filament for Beginners</h2>
            <div className="prose prose-sm max-w-none text-muted-foreground space-y-3">
              <p>
                PLA (Polylactic Acid) is made from corn starch, making it biodegradable and low-odor compared to petroleum-based plastics.
                More importantly for beginners, it has the widest printing temperature window, the lowest tendency to warp, and
                the largest community of users sharing tips and troubleshooting advice.
              </p>
              <p>
                While PETG offers better mechanical properties and ABS more heat resistance, both require more dialing in.
                PLA is your best first filament — once you've printed confidently in PLA for a few weeks, you'll be ready to
                experiment with <Link to="/guides/pla-vs-petg" className="text-primary hover:underline">PETG</Link> or explore our{' '}
                <Link to="/guides/beginners-guide" className="text-primary hover:underline">complete beginner's guide</Link>.
              </p>
              <p>
                Key advantages over other materials:{' '}
                <strong className="text-foreground">no enclosure required</strong>,{' '}
                <strong className="text-foreground">no heated bed required</strong> (though we recommend one at 55°C),{' '}
                <strong className="text-foreground">prints at low 190–220°C</strong> (safe for most budget printers),{' '}
                and <strong className="text-foreground">available in 200+ colors</strong> from dozens of brands.
              </p>
            </div>
          </section>

          {/* Top Picks */}
          <section>
            <h2 className="text-2xl font-bold mb-2">Top PLA Filaments for Beginners — Ranked by FilaScore</h2>
            <p className="text-muted-foreground mb-6 text-sm">
              Ranked by our data-driven FilaScore algorithm — weighing quality consistency, brand trust, regional availability, and documentation.
            </p>
            {isLoading ? (
              <div className="grid sm:grid-cols-2 gap-4">
                {Array.from({ length: 6 }).map((_, i) => (
                  <Skeleton key={i} className="h-24 rounded-xl" />
                ))}
              </div>
            ) : (
              <div className="grid sm:grid-cols-2 gap-4">
                {(filaments ?? []).map((f, i) => {
                  const slug = f.product_handle || f.id;
                  const name = f.display_name || f.product_title;
                  const hex = normalizeColorHex(f.color_hex);
                  return (
                    <Link key={f.id} to={`/filament/${f.product_handle || f.id}`}>
                      <Card className="border-border hover:border-primary/50 hover:bg-card/80 transition-all group">
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
                            <div className="text-xs text-muted-foreground">{f.vendor} · PLA</div>
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
                View all PLA filaments <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </section>

          {/* Beginner Tips */}
          <section>
            <h2 className="text-2xl font-bold mb-6">6 Tips for Successful Beginner Prints</h2>
            <div className="grid sm:grid-cols-2 gap-4">
              {BEGINNER_TIPS.map((tip) => (
                <Card key={tip.title} className="border-border bg-card/50">
                  <CardContent className="p-5">
                    <div className="flex items-start gap-3">
                      <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                        <tip.icon className="w-4.5 h-4.5 text-primary" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-sm mb-1">{tip.title}</h3>
                        <p className="text-xs text-muted-foreground leading-relaxed">{tip.tip}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </section>

          {/* Temperature Quick Reference */}
          <section>
            <h2 className="text-2xl font-bold mb-4">PLA Temperature Quick Reference</h2>
            <Card className="border-border">
              <CardContent className="p-0 overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border bg-muted/30">
                      <th className="text-left p-3 font-semibold">Material</th>
                      <th className="text-left p-3 font-semibold">Nozzle</th>
                      <th className="text-left p-3 font-semibold">Bed</th>
                      <th className="text-left p-3 font-semibold">Fan</th>
                      <th className="text-left p-3 font-semibold">Difficulty</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[
                      { mat: 'PLA', nozzle: '190–220°C', bed: '50–60°C', fan: '100%', diff: '⭐ Easiest' },
                      { mat: 'PLA+', nozzle: '205–230°C', bed: '55–65°C', fan: '80–100%', diff: '⭐ Easy' },
                      { mat: 'PETG', nozzle: '230–250°C', bed: '70–85°C', fan: '30–50%', diff: '⭐⭐ Moderate' },
                      { mat: 'ABS', nozzle: '230–260°C', bed: '90–110°C', fan: '0–20%', diff: '⭐⭐⭐ Hard' },
                    ].map((row) => (
                      <tr key={row.mat} className="border-b border-border last:border-0 hover:bg-muted/20">
                        <td className="p-3 font-medium">{row.mat}</td>
                        <td className="p-3 text-muted-foreground">{row.nozzle}</td>
                        <td className="p-3 text-muted-foreground">{row.bed}</td>
                        <td className="p-3 text-muted-foreground">{row.fan}</td>
                        <td className="p-3 text-muted-foreground">{row.diff}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </CardContent>
            </Card>
            <p className="text-xs text-muted-foreground mt-2">
              See our <Link to="/filament-temperature-guide" className="text-primary hover:underline">complete filament temperature guide</Link> for all materials.
            </p>
          </section>

          {/* Internal Links */}
          <section className="bg-muted/30 rounded-xl p-6 border border-border">
            <h2 className="text-lg font-semibold mb-4">Next Steps for Beginners</h2>
            <div className="grid sm:grid-cols-2 gap-3">
              {[
                { to: '/guides/beginners-guide', label: "Complete Beginner's Guide to Filaments" },
                { to: '/guides/pla-vs-petg', label: 'PLA vs PETG — When to Upgrade' },
                { to: '/filament-storage-guide', label: 'How to Store Filament Properly' },
                { to: '/filament-temperature-guide', label: 'Filament Temperature Guide' },
                { to: '/materials/pla', label: 'PLA Material Hub — All Specs' },
                { to: '/wizard', label: 'Filament Wizard — Get a Recommendation' },
              ].map((link) => (
                <Link key={link.to} to={link.to} className="flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors">
                  <ArrowRight className="w-3.5 h-3.5 text-primary shrink-0" />
                  {link.label}
                </Link>
              ))}
            </div>
          </section>

          <FAQSection
            faqs={FAQS}
            title="Frequently Asked Questions — Beginner Filament"
          />
        </div>
      </div>
    </>
  );
}
