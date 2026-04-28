import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { DocumentHead } from '@/components/seo/DocumentHead';
import { BreadcrumbSchema, ArticleSchema, FAQSection } from '@/components/seo';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { normalizeColorHex } from '@/lib/utils';
import { ArrowRight, CheckCircle, XCircle, MinusCircle, Zap, BookOpen } from 'lucide-react';

const FAQS = [
  {
    question: 'Is PETG stronger than ABS?',
    answer: 'PETG has slightly higher tensile strength (~50 MPa vs ~40 MPa) and better impact absorption — it deforms rather than cracking. ABS is stiffer, which can be advantageous for rigid assemblies. For most functional prints, PETG offers a better balance of strength and printability without requiring an enclosure.',
  },
  {
    question: 'Does ABS need an enclosure?',
    answer: 'Yes, an enclosure is strongly recommended for ABS. Without one, ABS warps severely due to rapid, uneven cooling. An enclosure maintains a stable ambient temperature (40–60°C) around the print, dramatically reducing warping and layer splitting. PETG, by contrast, prints reliably without an enclosure.',
  },
  {
    question: 'Can I print ABS without fumes?',
    answer: 'ABS emits styrene fumes during printing, which cannot be fully eliminated. An enclosed printer with a HEPA + activated carbon filter significantly reduces exposure. Printing in a ventilated area or using an exhaust duct is recommended. If fumes are a concern, PETG is the better choice — it produces minimal odor and no harmful emissions.',
  },
  {
    question: 'Which is better for outdoor use, PETG or ABS?',
    answer: 'PETG is significantly better outdoors. ABS degrades under UV exposure — it yellows and becomes brittle within months. PETG has inherently better UV resistance and chemical stability. For maximum outdoor durability, consider ASA, which combines ABS-like mechanical properties with excellent UV stability.',
  },
  {
    question: 'Can you acetone-smooth PETG?',
    answer: 'No. Acetone vapor smoothing only works with ABS (and ASA). PETG is resistant to acetone, which is actually an advantage for chemical resistance but means you cannot chemically smooth it. PETG post-processing relies on sanding, filler primer, and epoxy coatings like XTC-3D.',
  },
];

const COMPARISON_TABLE = [
  { property: 'Print Temp (Nozzle)', a: '230–250°C', b: '230–260°C', winner: 'tie' as const },
  { property: 'Bed Temp', a: '70–85°C', b: '90–110°C', winner: 'a' as const },
  { property: 'Enclosure Needed', a: 'No', b: 'Yes', winner: 'a' as const },
  { property: 'Strength (Tensile)', a: '~50 MPa', b: '~40 MPa', winner: 'a' as const },
  { property: 'Heat Resistance (HDT)', a: '~80°C', b: '~105°C', winner: 'b' as const },
  { property: 'Chemical Resistance', a: 'Good', b: 'Moderate', winner: 'a' as const },
  { property: 'Ease of Printing', a: 'Moderate', b: 'Difficult', winner: 'a' as const },
  { property: 'Post-Processing', a: 'Sand + primer', b: 'Acetone smoothing', winner: 'b' as const },
  { property: 'Price Range', a: '$18–$40/kg', b: '$18–$38/kg', winner: 'tie' as const },
  { property: 'Fumes', a: 'Low odor', b: 'Styrene fumes ⚠️', winner: 'a' as const },
];

interface FilamentRow {
  id: string; product_handle: string | null; product_title: string; display_name: string | null;
  vendor: string; color_family: string | null; color_hex: string | null;
  variant_price: number | null; filascope_score: number | null;
}

function WinnerIcon({ winner, side }: { winner: 'a' | 'b' | 'tie'; side: 'a' | 'b' }) {
  if (winner === 'tie') return <MinusCircle className="w-4 h-4 text-muted-foreground" />;
  if (winner === side) return <CheckCircle className="w-4 h-4 text-green-500" />;
  return <XCircle className="w-4 h-4 text-destructive/50" />;
}

function FilamentMiniCard({ f }: { f: FilamentRow }) {
  const slug = f.product_handle || f.id;
  const name = f.display_name || f.product_title;
  const hex = normalizeColorHex(f.color_hex);
  return (
    <Link to={`/filament/${slug}`} className="flex items-center gap-2.5 p-2.5 rounded-lg border border-border hover:border-primary transition-colors bg-card">
      <div className="w-7 h-7 rounded-full border border-border flex-shrink-0" style={{ backgroundColor: hex }} />
      <div className="flex-1 min-w-0">
        <p className="text-xs text-muted-foreground">{f.vendor}</p>
        <p className="text-sm font-medium truncate">{name}</p>
      </div>
      {f.variant_price && <span className="text-xs text-muted-foreground flex-shrink-0">${f.variant_price.toFixed(2)}</span>}
    </Link>
  );
}

export default function PETGvsABS() {
  const { data: petgFilaments, isLoading: petgLoading } = useQuery({
    queryKey: ['petg-top-vs-abs'],
    queryFn: async () => {
      const { data, error } = await supabase.from('filaments')
        .select('id, product_handle, product_title, display_name, vendor, color_family, color_hex, variant_price, filascope_score')
        .eq('material', 'PETG').not('filascope_score', 'is', null)
        .order('filascope_score', { ascending: false }).limit(6);
      if (error) throw error;
      return (data ?? []) as unknown as FilamentRow[];
    },
  });

  const { data: absFilaments, isLoading: absLoading } = useQuery({
    queryKey: ['abs-top-vs-petg'],
    queryFn: async () => {
      const { data, error } = await supabase.from('filaments')
        .select('id, product_handle, product_title, display_name, vendor, color_family, color_hex, variant_price, filascope_score')
        .eq('material', 'ABS').not('filascope_score', 'is', null)
        .order('filascope_score', { ascending: false }).limit(6);
      if (error) throw error;
      return (data ?? []) as unknown as FilamentRow[];
    },
  });

  return (
    <div className="min-h-screen bg-background">
      <DocumentHead
        title="PETG vs ABS — Which Filament Should You Choose? | FilaScope"
        description="PETG vs ABS compared: strength, heat resistance, print difficulty, price & fumes. Data-driven comparison from 21,000+ filaments on FilaScope."
        ogType="article"
      />
      <BreadcrumbSchema items={[
        { name: 'Home', url: 'https://filascope.com/' },
        { name: 'Guides', url: 'https://filascope.com/guides' },
        { name: 'PETG vs ABS', url: 'https://filascope.com/guides/petg-vs-abs' },
      ]} />
      <ArticleSchema
        headline="PETG vs ABS — Which 3D Printer Filament Is Right for You?"
        description="PETG vs ABS compared: strength, heat resistance, print difficulty, price & fumes. Data-driven comparison from 21,000+ filaments on FilaScope."
        datePublished="2026-02-28"
        dateModified="2026-02-28"
        url="/guides/petg-vs-abs"
        articleType="TechArticle"
        about={{ '@type': 'Thing', name: 'PETG vs ABS 3D Printing Filament Comparison' }}
        proficiencyLevel="Intermediate"
      />

      <div className="max-w-4xl mx-auto px-4 py-8">
        <nav className="text-sm text-muted-foreground mb-6 flex items-center gap-1.5 flex-wrap">
          <Link to="/" className="hover:text-foreground transition-colors">Home</Link>
          <span>›</span>
          <Link to="/guides/best-pla-filaments" className="hover:text-foreground transition-colors">Guides</Link>
          <span>›</span>
          <span>PETG vs ABS</span>
        </nav>

        <header className="mb-10">
          <h1 className="text-3xl md:text-4xl font-bold mb-3">PETG vs ABS — Which 3D Printer Filament Is Right for You?</h1>
          <p className="text-muted-foreground text-lg leading-relaxed">
            PETG and ABS are both popular choices for functional and engineering 3D prints — but they trade off ease-of-use against heat resistance and post-processing options. This data-driven comparison breaks down strength, temperature tolerance, fumes, and real-world printability to help you choose the right material.
          </p>
          <p className="text-sm text-muted-foreground mt-3">
            Last updated: February 2026 · Based on data from <Link to="/filaments" className="text-primary hover:underline">FilaScope's database of 21,000+ filaments</Link> across 57 brands, with real-time pricing from 15+ retailers
          </p>
        </header>

        {/* ── Quick Answer ── */}
        <div role="region" aria-label="Quick answer summary" className="mb-10" data-ai-summary="true">
          <div className="rounded-lg border border-border bg-card/60 border-l-2 border-l-primary overflow-hidden">
            <div className="pl-4 pr-5 py-4">
              <header className="flex items-center gap-2 mb-3">
                <Zap className="w-4 h-4 text-primary shrink-0" aria-hidden="true" />
                <span className="text-primary text-xs font-semibold uppercase tracking-wider">Quick Answer</span>
              </header>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Choose <strong className="text-foreground">PETG</strong> for easier printing without an enclosure, better chemical and UV resistance, and lower fumes. Choose <strong className="text-foreground">ABS</strong> for higher heat resistance (105°C vs 80°C) and acetone vapor smoothing for a flawless surface finish. Both are strong engineering-grade materials with similar pricing. For most users, PETG is the safer default — switch to ABS only when you specifically need its heat tolerance or smoothing capability.
              </p>
            </div>
          </div>
          <p className="sr-only">
            Quick Answer: Choose PETG for easier printing and chemical resistance. Choose ABS for higher heat resistance and acetone smoothing. Both are strong engineering-grade materials.
          </p>
        </div>

        {/* ── Comparison Table ── */}
        <section className="mb-10">
          <h2 className="text-2xl font-semibold mb-4">PETG vs ABS at a Glance</h2>
          <div className="rounded-lg border border-border overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/50">
                  <th className="text-left p-3 font-medium text-muted-foreground">Property</th>
                  <th className="text-center p-3 font-medium text-green-400">PETG</th>
                  <th className="text-center p-3 font-medium text-orange-400">ABS</th>
                </tr>
              </thead>
              <tbody>
                {COMPARISON_TABLE.map((row, i) => (
                  <tr key={row.property} className={`border-b border-border last:border-0 ${i % 2 === 0 ? '' : 'bg-muted/20'}`}>
                    <td className="p-3 text-muted-foreground">{row.property}</td>
                    <td className="p-3 text-center"><div className="flex items-center justify-center gap-1.5"><WinnerIcon winner={row.winner} side="a" /><span>{row.a}</span></div></td>
                    <td className="p-3 text-center"><div className="flex items-center justify-center gap-1.5"><WinnerIcon winner={row.winner} side="b" /><span>{row.b}</span></div></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            Use our <Link to="/compare" className="text-primary hover:underline">side-by-side comparison tool</Link> to compare specific PETG and ABS products head-to-head.
          </p>
        </section>

        {/* ── When to Choose PETG ── */}
        <section className="mb-10">
          <h2 className="text-2xl font-semibold mb-4">When to Choose PETG</h2>
          <div className="text-sm text-muted-foreground leading-relaxed space-y-3">
            <p>
              <Link to="/filaments/petg" className="text-primary hover:underline font-medium">PETG</Link> is the better choice when you want a strong, functional material without the printing difficulties of ABS. It doesn't require an enclosure, produces minimal fumes, and warps far less — making it accessible to anyone with a standard FDM printer and a heated bed.
            </p>
            <p>
              PETG also wins for outdoor applications thanks to superior UV resistance (ABS yellows and becomes brittle in sunlight). Its chemical resistance makes it suitable for containers, lab equipment, and parts exposed to cleaning agents. PETG's higher impact absorption means it deforms under stress rather than cracking — critical for parts that may be dropped or bumped.
            </p>
            <p>
              The main tradeoff is a glossier surface finish that's harder to paint, and no chemical smoothing option. Post-processing relies on sanding and filler primer. See our <Link to="/guides/pla-vs-petg" className="text-primary hover:underline">PLA vs PETG guide</Link> for a comparison against the most popular beginner material.
            </p>
          </div>
        </section>

        {/* ── When to Choose ABS ── */}
        <section className="mb-10">
          <h2 className="text-2xl font-semibold mb-4">When to Choose ABS</h2>
          <div className="text-sm text-muted-foreground leading-relaxed space-y-3">
            <p>
              <Link to="/filaments/abs" className="text-primary hover:underline font-medium">ABS</Link> is the right choice when your application demands heat resistance above 80°C. With a heat deflection temperature of ~105°C, ABS parts survive automotive interiors, electronic enclosures near heat sources, and industrial environments that would deform PETG.
            </p>
            <p>
              ABS's killer feature is acetone vapor smoothing — placing ABS parts in an acetone vapor chamber produces a glossy, injection-molded appearance with completely invisible layer lines. This makes ABS the top choice for cosmetic prototypes, display pieces, and cosplay helmets where surface finish is paramount.
            </p>
            <p>
              The tradeoffs are significant: ABS requires an enclosed printer, emits styrene fumes that demand ventilation, and warps aggressively on large prints. If you need ABS-like properties with UV stability, consider <Link to="/guides/asa-vs-abs-outdoor-printing" className="text-primary hover:underline">ASA as an alternative</Link>.
            </p>
          </div>
        </section>

        {/* ── Print Settings Compared ── */}
        <section className="mb-10">
          <h2 className="text-2xl font-semibold mb-4">Print Settings Compared</h2>
          <div className="grid md:grid-cols-2 gap-4">
            <div className="rounded-lg border border-green-500/20 bg-green-500/5 p-5">
              <h3 className="font-semibold text-sm mb-3 text-green-400">PETG Settings</h3>
              <ul className="space-y-1.5 text-sm text-muted-foreground">
                <li><strong className="text-foreground">Nozzle:</strong> 230–250°C</li>
                <li><strong className="text-foreground">Bed:</strong> 70–85°C</li>
                <li><strong className="text-foreground">Speed:</strong> 40–60mm/s</li>
                <li><strong className="text-foreground">Enclosure:</strong> Not required</li>
                <li><strong className="text-foreground">Cooling:</strong> 30–50% fan</li>
                <li><strong className="text-foreground">Retraction:</strong> 4–6mm Bowden / 1–2mm DD</li>
                <li><strong className="text-foreground">Tip:</strong> Reduce first-layer squish to prevent bed adhesion that's too strong</li>
              </ul>
            </div>
            <div className="rounded-lg border border-orange-500/20 bg-orange-500/5 p-5">
              <h3 className="font-semibold text-sm mb-3 text-orange-400">ABS Settings</h3>
              <ul className="space-y-1.5 text-sm text-muted-foreground">
                <li><strong className="text-foreground">Nozzle:</strong> 230–260°C</li>
                <li><strong className="text-foreground">Bed:</strong> 90–110°C</li>
                <li><strong className="text-foreground">Speed:</strong> 40–60mm/s</li>
                <li><strong className="text-foreground">Enclosure:</strong> Required ⚠️</li>
                <li><strong className="text-foreground">Cooling:</strong> 0–15% fan (minimal)</li>
                <li><strong className="text-foreground">Retraction:</strong> 4–5mm Bowden / 0.5–1mm DD</li>
                <li><strong className="text-foreground">Tip:</strong> Use brim + glue stick for bed adhesion; keep enclosure closed during print</li>
              </ul>
            </div>
          </div>
        </section>

        {/* ── Top Rated Products ── */}
        <div className="grid md:grid-cols-2 gap-6 mb-10">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Badge className="bg-green-500/20 text-green-400 border-green-500/30">Top Rated</Badge>
                Best PETG Filaments
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {petgLoading ? Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-14 rounded-lg" />) : petgFilaments?.map(f => <FilamentMiniCard key={f.id} f={f} />)}
              <Link to="/filaments/petg" className="flex items-center justify-center gap-1 text-xs text-muted-foreground hover:text-foreground pt-1 transition-colors">
                Browse all PETG filaments <ArrowRight className="w-3 h-3" />
              </Link>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Badge className="bg-orange-500/20 text-orange-400 border-orange-500/30">Top Rated</Badge>
                Best ABS Filaments
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {absLoading ? Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-14 rounded-lg" />) : absFilaments?.map(f => <FilamentMiniCard key={f.id} f={f} />)}
              <Link to="/filaments/abs" className="flex items-center justify-center gap-1 text-xs text-muted-foreground hover:text-foreground pt-1 transition-colors">
                Browse all ABS filaments <ArrowRight className="w-3 h-3" />
              </Link>
            </CardContent>
          </Card>
        </div>

        {/* ── Price Comparison ── */}
        <section className="mb-10">
          <h2 className="text-2xl font-semibold mb-4">Price Comparison</h2>
          <p className="text-sm text-muted-foreground leading-relaxed">
            PETG and ABS are priced similarly, typically ranging from $18–40/kg depending on brand and quality. Premium brands like Polymaker and Prusament sit at the higher end, while budget options from eSUN and Overture start around $18/kg. The real cost difference is indirect: ABS requires an enclosed printer (potentially a $100–500+ upgrade) and ventilation setup, while PETG works on any heated-bed printer out of the box. For large projects, material cost is comparable — but PETG's lower failure rate (less warping, fewer reprints) makes it more economical in practice. Track live pricing and deals for both materials on our <Link to="/deals" className="text-primary hover:underline">deals page</Link>.
          </p>
        </section>

        {/* ── FAQs ── */}
        <FAQSection faqs={FAQS} title="Frequently Asked Questions" />

        {/* ── Related guides ── */}
        <section className="mt-12 border-t border-border pt-8">
          <h2 className="text-lg font-semibold mb-4">Related Guides</h2>
          <div className="flex flex-wrap gap-2">
            {[
              { href: '/guides/pla-vs-petg', label: 'PLA vs PETG Comparison' },
              { href: '/guides/pla-vs-abs', label: 'PLA vs ABS Comparison' },
              { href: '/guides/asa-vs-abs-outdoor-printing', label: 'ASA vs ABS for Outdoor Printing' },
              { href: '/guides/best-petg-filaments', label: 'Best PETG Filaments 2026' },
              { href: '/guides/best-abs-filaments', label: 'Best ABS Filaments 2026' },
              { href: '/guides/how-to-choose-3d-printer-filament', label: 'How to Choose 3D Printer Filament' },
              { href: '/filaments', label: 'Browse all filaments on FilaScope' },
              { href: '/compare', label: 'Compare filaments side by side' },
            ].map(g => (
              <Link
                key={g.href}
                to={g.href}
                className="inline-flex items-center gap-1.5 text-sm px-3 py-1.5 rounded-full border border-border bg-muted/50 text-muted-foreground hover:border-primary/60 hover:text-primary hover:bg-primary/5 transition-all"
              >
                <BookOpen className="w-3.5 h-3.5" />
                {g.label}
              </Link>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
