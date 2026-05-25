import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { DocumentHead } from '@/components/seo/DocumentHead';
import { ArticleSchema, FAQSection } from '@/components/seo';
import { Breadcrumbs } from '@/components/seo/Breadcrumbs';
import { RelatedContentBlock } from '@/components/seo/RelatedContentBlock';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Sun, ArrowRight, CheckCircle2, XCircle, AlertTriangle, Thermometer, Shield, Zap } from 'lucide-react';

interface MaterialStats {
  material: string;
  count: number;
  avgPrice: number | null;
  minNozzle: number | null;
  maxNozzle: number | null;
  minBed: number | null;
  maxBed: number | null;
}

const COMPARISON_ROWS = [
  { property: 'Ease of Printing', pla: '★★★★★', petg: '★★★★', abs: '★★★', winner: 'pla' },
  { property: 'Tensile Strength', pla: '★★★', petg: '★★★★', abs: '★★★★', winner: 'petg' },
  { property: 'Impact Resistance', pla: '★★', petg: '★★★★', abs: '★★★★', winner: 'tie' },
  { property: 'Heat Resistance', pla: '★★ (~60°C)', petg: '★★★ (~80°C)', abs: '★★★★★ (~100°C)', winner: 'abs' },
  { property: 'Flexibility', pla: '★★', petg: '★★★★', abs: '★★★', winner: 'petg' },
  { property: 'Surface Quality', pla: '★★★★★', petg: '★★★', abs: '★★★★', winner: 'pla' },
  { property: 'UV Resistance', pla: '★', petg: '★★★', abs: '★★', winner: 'petg' },
  { property: 'Enclosure Required', pla: 'No', petg: 'No', abs: 'Yes', winner: 'pla' },
  { property: 'Odor During Printing', pla: 'Minimal', petg: 'Minimal', abs: 'Strong (styrene)', winner: 'pla' },
  { property: 'Post-Processing', pla: 'Sanding, painting', petg: 'Sanding, painting', abs: 'Acetone vapor smooth', winner: 'abs' },
  { property: 'Cost per kg (avg)', pla: '$15–25', petg: '$18–28', abs: '$16–25', winner: 'pla' },
];

const HOW_TO_STEPS = [
  { name: 'Assess Your Project Requirements', text: 'Determine what your part needs to survive: indoor vs outdoor use, mechanical stress, heat exposure, and cosmetic requirements.' },
  { name: 'Check Material Constraints', text: 'If you need heat resistance above 80°C, ABS is your only option among the three. If you need outdoor UV resistance, consider PETG (or ASA as an alternative to ABS).' },
  { name: 'Consider Your Printer Setup', text: 'Do you have an enclosure? ABS requires one. Do you have a direct-drive extruder? PETG benefits from one for retraction control. Any FDM printer handles PLA.' },
  { name: 'Choose and Test', text: 'Buy a single 1kg spool of your chosen material from a trusted brand. Print a calibration test (benchy or temperature tower) to dial in settings before your main project.' },
];

const FAQS = [
  {
    question: 'Which is stronger, PLA, PETG, or ABS?',
    answer: 'PETG and ABS have comparable tensile strength, both stronger than PLA. However, they excel differently: PETG has better impact resistance (it bends before breaking), while ABS has better rigidity and heat resistance. PLA is the most rigid but also the most brittle — it cracks under sudden impact rather than deforming.',
  },
  {
    question: 'Can I print ABS without an enclosure?',
    answer: 'You can try, but expect warping and layer splitting on anything larger than 50mm. ABS shrinks significantly as it cools, and uneven cooling without an enclosure causes corners to lift and layers to crack. For small parts in a warm room, it may work. For reliable results, an enclosure maintaining 40–50°C ambient is strongly recommended.',
  },
  {
    question: 'Is PETG better than PLA for functional parts?',
    answer: 'Yes, for most functional parts PETG is the better choice. It has higher impact resistance, better heat tolerance (~80°C vs ~60°C), improved layer adhesion, and moderate chemical resistance. PLA is fine for low-stress indoor functional parts like cable clips, organizers, and jigs. For anything load-bearing, outdoor, or heat-exposed, choose PETG.',
  },
  {
    question: 'Which material is best for beginners?',
    answer: 'PLA is the best material for beginners. It prints at low temperatures (190–220°C), doesn\'t require a heated bed (though it helps), has virtually no warping, produces no harmful fumes, and gives excellent surface quality. Start with PLA, learn your printer, then branch out to PETG when you need stronger parts.',
  },
  {
    question: 'Can I use PLA, PETG, and ABS on the same printer?',
    answer: 'Yes, most FDM printers can handle all three materials. You\'ll need to change temperature settings between materials (PLA: ~210°C, PETG: ~235°C, ABS: ~245°C). Purge the nozzle thoroughly when switching — residual PLA in a hot ABS-printing nozzle can carbonize and cause clogs. An all-metal hotend is required for ABS temperatures above 240°C.',
  },
  {
    question: 'Which material is best for outdoor use?',
    answer: 'Of the three, PETG is the best for outdoor use due to moderate UV resistance and moisture tolerance. However, for permanent outdoor installations, ASA (not ABS) is the best choice — it has UV-stable properties that neither PETG nor ABS can match. PLA should not be used outdoors as it softens at ~60°C and degrades under UV.',
  },
  {
    question: 'Is ABS being replaced by newer materials?',
    answer: 'Partially. ASA has largely replaced ABS for outdoor applications due to UV stability. PETG has replaced ABS for many functional parts due to easier printing and no enclosure requirement. However, ABS retains advantages for acetone vapor smoothing (unique to ABS), high-temperature applications (~100°C), and cosplay/prop making where post-processing is essential.',
  },
];

export default function PLAvsPETGvsABSComparison() {
  const { data: materialStats } = useQuery({
    queryKey: ['pla-petg-abs-stats-guide'],
    queryFn: async () => {
      const materials = ['PLA', 'PETG', 'ABS'];
      const results: Record<string, { count: number; avgPrice: number | null }> = {};

      for (const mat of materials) {
        const { count } = await supabase
          .from('filaments')
          .select('id', { count: 'exact', head: true })
          .eq('material', mat);

        const { data: priceData } = await supabase
          .from('filaments')
          .select('variant_price')
          .eq('material', mat)
          .not('variant_price', 'is', null)
          .limit(100);

        const prices = (priceData ?? []).map(d => d.variant_price).filter(Boolean) as number[];
        const avgPrice = prices.length > 0 ? Math.round(prices.reduce((a, b) => a + b, 0) / prices.length * 100) / 100 : null;

        results[mat] = { count: count ?? 0, avgPrice };
      }

      return results;
    },
  });

  const canonicalUrl = 'https://filascope.com/guides/pla-vs-petg-vs-abs';

  return (
    <>
      <DocumentHead
        title="PLA vs PETG vs ABS: Which Filament Should You Use? | FilaScope"
        description="Data-driven comparison of PLA, PETG, and ABS 3D printer filaments. Strength, heat resistance, print settings, and real-world use cases compared with database stats."
        ogTitle="PLA vs PETG vs ABS — Which Filament Should You Use?"
        ogDescription="The definitive filament comparison: PLA vs PETG vs ABS with real data on strength, temperature, printability, and pricing from 22,000+ products."
      />
      <ArticleSchema
        headline="PLA vs PETG vs ABS: Which 3D Printer Filament Should You Use?"
        description="Data-driven comparison of PLA, PETG, and ABS 3D printer filaments. Strength, heat resistance, print settings, and real-world use cases."
        datePublished="2026-05-11"
        dateModified="2026-05-25"
        url="/guides/pla-vs-petg-vs-abs"
        articleType="TechArticle"
        about={{ '@type': 'Thing', name: '3D Printer Filament Comparison' }}
        proficiencyLevel="Beginner"
      />

      <div className="min-h-screen bg-background">
        <div className="max-w-4xl mx-auto px-4 py-6">
          <Breadcrumbs items={[
            { name: 'Guides', url: '/guides' },
            { name: 'PLA vs PETG vs ABS', url: '/guides/pla-vs-petg-vs-abs' },
          ]} />
        </div>

        {/* Hero */}
        <section className="bg-gradient-to-b from-blue-500/5 to-transparent py-12 px-4">
          <div className="max-w-4xl mx-auto">
            <Badge className="mb-4 bg-blue-500/10 text-blue-400 border-blue-500/20">
              <Zap className="w-3 h-3 mr-1" />
              Material Comparison · Updated May 2026
            </Badge>
            <h1 className="text-3xl md:text-4xl font-bold mb-4 text-foreground">
              PLA vs PETG vs ABS: Which 3D Printer Filament Should You Use?
            </h1>
            <p className="text-lg text-muted-foreground leading-relaxed max-w-2xl">
              PLA, PETG, and ABS are the three most popular FDM filaments. Each has distinct strengths.
              This data-driven comparison uses real product data from FilaScope's database to help you
              choose the right material for your project.
            </p>
          </div>
        </section>

        <div className="max-w-4xl mx-auto px-4 py-10 space-y-14">

          {/* AI Snippet Zone */}
          <section aria-label="Quick Summary" className="bg-muted/30 border border-border/40 rounded-lg px-5 py-4">
            <p className="text-sm text-muted-foreground leading-relaxed">
              <strong className="text-foreground">PLA</strong> is the easiest to print and best for beginners, decorative
              items, and prototypes. <strong className="text-foreground">PETG</strong> is stronger and more heat-resistant,
              ideal for functional parts and outdoor use. <strong className="text-foreground">ABS</strong> handles the
              highest temperatures (~100°C) and can be acetone-smoothed, but requires an enclosure and ventilation.
              For most users, start with PLA and upgrade to PETG when you need durability.
            </p>
            <p className="sr-only">
              Summary: PLA is easiest to print, best for beginners. PETG is stronger and more heat-resistant for functional
              parts. ABS handles highest temperatures but needs an enclosure. PLA prints at 190-220°C, PETG at 230-250°C,
              ABS at 230-260°C. Most users should start with PLA.
            </p>
          </section>

          {/* Database Stats */}
          {materialStats && (
            <section>
              <h2 className="text-2xl font-bold mb-4">By the Numbers: PLA, PETG & ABS in Our Database</h2>
              <div className="grid sm:grid-cols-3 gap-4">
                {[
                  { mat: 'PLA', color: 'emerald', stats: materialStats.PLA },
                  { mat: 'PETG', color: 'blue', stats: materialStats.PETG },
                  { mat: 'ABS', color: 'amber', stats: materialStats.ABS },
                ].map(({ mat, color, stats }) => (
                  <Card key={mat} className={`border-${color}-500/20`}>
                    <CardContent className="p-4 text-center">
                      <p className={`font-bold text-lg text-${color}-400`}>{mat}</p>
                      <p className="text-2xl font-bold mt-1">{stats?.count?.toLocaleString() ?? '—'}</p>
                      <p className="text-xs text-muted-foreground">products in database</p>
                      {stats?.avgPrice && (
                        <p className="text-sm mt-2">
                          <span className="text-muted-foreground">Avg price:</span>{' '}
                          <span className="font-medium">${stats.avgPrice}</span>
                        </p>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            </section>
          )}

          {/* Head-to-Head Comparison Table */}
          <section>
            <h2 className="text-2xl font-bold mb-4">Head-to-Head Comparison</h2>
            <Card className="border-border overflow-hidden">
              <CardContent className="p-0 overflow-x-auto">
                <table className="w-full text-sm min-w-[540px]">
                  <thead>
                    <tr className="border-b border-border bg-muted/30">
                      <th className="text-left p-3 font-semibold">Property</th>
                      <th className="text-center p-3 font-semibold text-emerald-400">PLA</th>
                      <th className="text-center p-3 font-semibold text-blue-400">PETG</th>
                      <th className="text-center p-3 font-semibold text-amber-400">ABS</th>
                    </tr>
                  </thead>
                  <tbody>
                    {COMPARISON_ROWS.map((row) => (
                      <tr key={row.property} className="border-b border-border last:border-0 hover:bg-muted/20 transition-colors">
                        <td className="p-3 font-medium text-sm">{row.property}</td>
                        <td className={`text-center p-3 text-xs ${row.winner === 'pla' ? 'text-emerald-400 font-medium' : 'text-muted-foreground'}`}>
                          {row.pla}{row.winner === 'pla' && ' 🏆'}
                        </td>
                        <td className={`text-center p-3 text-xs ${row.winner === 'petg' ? 'text-blue-400 font-medium' : 'text-muted-foreground'}`}>
                          {row.petg}{row.winner === 'petg' && ' 🏆'}
                        </td>
                        <td className={`text-center p-3 text-xs ${row.winner === 'abs' ? 'text-amber-400 font-medium' : 'text-muted-foreground'}`}>
                          {row.abs}{row.winner === 'abs' && ' 🏆'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </CardContent>
            </Card>
          </section>

          {/* Deep Dive: PLA */}
          <section>
            <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-emerald-400" /> PLA (Polylactic Acid)
            </h2>
            <div className="text-muted-foreground space-y-3 text-sm leading-relaxed">
              <p>
                PLA is the most popular 3D printing filament in the world. Made from renewable resources (corn starch),
                it's biodegradable, prints at low temperatures (190–220°C), requires no enclosure, and produces
                excellent surface quality with sharp details.
              </p>
              <div className="grid sm:grid-cols-2 gap-3">
                <div className="p-3 rounded-lg border border-emerald-500/20 bg-emerald-500/5">
                  <p className="font-medium text-emerald-400 text-xs mb-1 flex items-center gap-1"><CheckCircle2 className="w-3 h-3" /> Strengths</p>
                  <ul className="text-xs text-muted-foreground space-y-0.5">
                    <li>• Easiest material to print</li>
                    <li>• Best surface quality and detail</li>
                    <li>• Widest color selection</li>
                    <li>• No warping, minimal shrinkage</li>
                    <li>• Lowest cost per kg</li>
                    <li>• No harmful fumes</li>
                  </ul>
                </div>
                <div className="p-3 rounded-lg border border-red-500/20 bg-red-500/5">
                  <p className="font-medium text-red-400 text-xs mb-1 flex items-center gap-1"><XCircle className="w-3 h-3" /> Weaknesses</p>
                  <ul className="text-xs text-muted-foreground space-y-0.5">
                    <li>• Low heat resistance (~60°C)</li>
                    <li>• Brittle — cracks under impact</li>
                    <li>• Not suitable for outdoor use</li>
                    <li>• Degrades in humid conditions</li>
                  </ul>
                </div>
              </div>
              <p>
                <strong className="text-foreground">Best for:</strong> Beginners, prototypes, decorative items, cosplay props,
                figurines, HueForge lithophanes, indoor display pieces, and any print that won't face mechanical stress or heat.
              </p>
            </div>
          </section>

          {/* Deep Dive: PETG */}
          <section>
            <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-blue-400" /> PETG (Polyethylene Terephthalate Glycol)
            </h2>
            <div className="text-muted-foreground space-y-3 text-sm leading-relaxed">
              <p>
                PETG bridges the gap between PLA's ease of use and ABS's mechanical performance. It offers
                superior impact resistance, moderate heat resistance (~80°C), and chemical resistance — all
                without requiring an enclosure.
              </p>
              <div className="grid sm:grid-cols-2 gap-3">
                <div className="p-3 rounded-lg border border-blue-500/20 bg-blue-500/5">
                  <p className="font-medium text-blue-400 text-xs mb-1 flex items-center gap-1"><CheckCircle2 className="w-3 h-3" /> Strengths</p>
                  <ul className="text-xs text-muted-foreground space-y-0.5">
                    <li>• Excellent layer adhesion</li>
                    <li>• Impact resistant — bends, doesn't crack</li>
                    <li>• Good heat resistance (~80°C)</li>
                    <li>• Moderate UV resistance</li>
                    <li>• No enclosure needed</li>
                    <li>• Food-safe options available</li>
                  </ul>
                </div>
                <div className="p-3 rounded-lg border border-red-500/20 bg-red-500/5">
                  <p className="font-medium text-red-400 text-xs mb-1 flex items-center gap-1"><XCircle className="w-3 h-3" /> Weaknesses</p>
                  <ul className="text-xs text-muted-foreground space-y-0.5">
                    <li>• More prone to stringing</li>
                    <li>• Hygroscopic (absorbs moisture)</li>
                    <li>• Can stick too well to smooth PEI</li>
                    <li>• Slightly translucent in light colors</li>
                  </ul>
                </div>
              </div>
              <p>
                <strong className="text-foreground">Best for:</strong> Functional parts, outdoor use (seasonal), mechanical
                components, brackets, enclosures, food-adjacent containers, and parts that need to survive drops and impacts.
              </p>
            </div>
          </section>

          {/* Deep Dive: ABS */}
          <section>
            <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-amber-400" /> ABS (Acrylonitrile Butadiene Styrene)
            </h2>
            <div className="text-muted-foreground space-y-3 text-sm leading-relaxed">
              <p>
                ABS is an engineering thermoplastic — the same material used in LEGO bricks and automotive parts.
                Its key advantages are heat resistance (~100°C), toughness, and the unique ability to be
                acetone-vapor-smoothed for injection-molded-looking surfaces.
              </p>
              <div className="grid sm:grid-cols-2 gap-3">
                <div className="p-3 rounded-lg border border-amber-500/20 bg-amber-500/5">
                  <p className="font-medium text-amber-400 text-xs mb-1 flex items-center gap-1"><CheckCircle2 className="w-3 h-3" /> Strengths</p>
                  <ul className="text-xs text-muted-foreground space-y-0.5">
                    <li>• Highest heat resistance (~100°C)</li>
                    <li>• Acetone vapor smoothing</li>
                    <li>• Excellent impact toughness</li>
                    <li>• Great for post-processing & painting</li>
                    <li>• Proven engineering material</li>
                  </ul>
                </div>
                <div className="p-3 rounded-lg border border-red-500/20 bg-red-500/5">
                  <p className="font-medium text-red-400 text-xs mb-1 flex items-center gap-1"><XCircle className="w-3 h-3" /> Weaknesses</p>
                  <ul className="text-xs text-muted-foreground space-y-0.5">
                    <li>• Requires enclosure (mandatory)</li>
                    <li>• Emits styrene fumes — needs ventilation</li>
                    <li>• Warps without proper setup</li>
                    <li>• More difficult to print</li>
                  </ul>
                </div>
              </div>
              <Card className="border-amber-500/20 bg-amber-500/5">
                <CardContent className="p-4 flex gap-3 items-start">
                  <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                  <p className="text-sm text-muted-foreground">
                    <strong className="text-foreground">Safety:</strong> ABS emits styrene fumes during printing. Always use
                    in a well-ventilated area or with an enclosure with activated carbon filtration. Never print ABS
                    in a bedroom or unventilated space.
                  </p>
                </CardContent>
              </Card>
              <p>
                <strong className="text-foreground">Best for:</strong> High-temperature applications (automotive, electronics
                enclosures), vapor-smoothed display pieces, cosplay props that need post-processing, engineering prototypes
                requiring heat resistance.
              </p>
            </div>
          </section>

          {/* Decision Flowchart */}
          <section>
            <h2 className="text-2xl font-bold mb-4">Quick Decision Guide</h2>
            <div className="space-y-3">
              {[
                { q: 'Are you a beginner or printing decorative items?', a: 'PLA', color: 'emerald' },
                { q: 'Do you need parts that survive drops and impacts?', a: 'PETG', color: 'blue' },
                { q: 'Will the part be exposed to temperatures above 80°C?', a: 'ABS', color: 'amber' },
                { q: 'Do you need outdoor UV resistance?', a: 'PETG (or ASA for permanent outdoor)', color: 'blue' },
                { q: 'Do you want to acetone-vapor-smooth the finish?', a: 'ABS (unique capability)', color: 'amber' },
                { q: 'Do you need food-safe containers?', a: 'PETG (FDA-approved base material)', color: 'blue' },
                { q: 'Are you printing HueForge lithophanes?', a: 'PLA (best TD data and surface quality)', color: 'emerald' },
                { q: 'Are you on a tight budget?', a: 'PLA (cheapest per kg, lowest failure rate)', color: 'emerald' },
              ].map(({ q, a, color }) => (
                <div key={q} className="flex items-start gap-3 p-3 rounded-lg border border-border bg-card/50">
                  <span className={`w-3 h-3 rounded-full bg-${color}-400 shrink-0 mt-1`} />
                  <div>
                    <p className="text-sm font-medium">{q}</p>
                    <p className={`text-sm text-${color}-400`}>→ {a}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Step by Step */}
          <section>
            <h2 className="text-2xl font-bold mb-4">How to Choose Between PLA, PETG, and ABS</h2>
            <div className="space-y-4">
              {HOW_TO_STEPS.map((step, i) => (
                <div key={step.name} className="flex gap-4">
                  <div className="w-8 h-8 rounded-full bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400 font-bold text-sm shrink-0 mt-0.5">
                    {i + 1}
                  </div>
                  <div>
                    <h3 className="font-semibold mb-1 text-sm">{step.name}</h3>
                    <p className="text-sm text-muted-foreground">{step.text}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>

          <FAQSection
            faqs={FAQS}
            title="PLA vs PETG vs ABS — Frequently Asked Questions"
          />

          <RelatedContentBlock
            title="Related Filament Resources"
            links={[
              { label: 'Best PLA Filaments', href: '/guides/best-pla-filaments', description: 'Top PLA picks ranked by quality and value' },
              { label: 'Best PETG Filaments', href: '/guides/best-petg-filaments', description: 'Top PETG picks for functional parts' },
              { label: 'Best ABS Filaments', href: '/guides/best-abs-filaments', description: 'Top ABS picks for engineering use' },
              { label: 'PLA vs PETG (Detailed)', href: '/guides/pla-vs-petg', description: 'In-depth two-way comparison' },
              { label: 'Filament Temperature Guide', href: '/guides/filament-temperature-guide', description: 'Nozzle & bed temps for all materials' },
              { label: 'How to Choose Filament', href: '/guides/how-to-choose-3d-printer-filament', description: 'Complete beginner filament guide' },
            ]}
          />
        </div>
      </div>
    </>
  );
}
