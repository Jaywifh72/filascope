import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { DocumentHead } from '@/components/seo/DocumentHead';
import { BreadcrumbSchema, ArticleSchema, FAQSection } from '@/components/seo';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { normalizeColorHex } from '@/lib/utils';
import { ArrowRight, CheckCircle, XCircle, MinusCircle } from 'lucide-react';

const FAQS = [
  {
    question: 'Is PLA or ABS easier to print?',
    answer: 'PLA is significantly easier to print. It requires lower temperatures (190–220°C nozzle, 50–60°C bed), produces minimal warping, and works on any FDM printer without an enclosure. ABS needs 230–260°C nozzle temperature, 90–110°C bed temperature, and an enclosed printer to prevent warping and cracking. ABS also emits styrene fumes during printing, requiring good ventilation.',
  },
  {
    question: 'Is ABS stronger than PLA?',
    answer: 'ABS is tougher than PLA — it has significantly better impact resistance and can flex before breaking, whereas PLA is more brittle and tends to snap under sudden force. However, PLA has comparable or higher tensile strength in some grades (especially PLA+). For parts that need to absorb shocks or survive drops, ABS is the better choice.',
  },
  {
    question: 'Can ABS be used outdoors?',
    answer: 'ABS has moderate UV resistance and a higher glass transition temperature (~105°C vs ~60°C for PLA), making it more suitable for outdoor use than PLA. However, ABS will still degrade with prolonged UV exposure. For true outdoor durability, ASA is a better alternative — it offers the same mechanical properties as ABS with superior UV stability.',
  },
  {
    question: 'Why does ABS warp so much?',
    answer: 'ABS has a high coefficient of thermal expansion, meaning it shrinks significantly as it cools. This uneven shrinkage creates internal stresses that pull corners off the build plate (warping) and can cause layer splitting (cracking). An enclosed printer maintains ambient temperature around 45–60°C, dramatically reducing warping by slowing the cooling rate.',
  },
  {
    question: 'Should I switch from PLA to ABS?',
    answer: 'Only if your application requires it. Switch to ABS when you need higher heat resistance (functional parts near electronics or engines), better impact toughness (cases, enclosures, mechanical parts), or acetone vapor smoothing for a glossy finish. If you just want better strength than standard PLA, consider PLA+ or PETG first — both are easier to print than ABS.',
  },
];

const COMPARISON_TABLE = [
  { property: 'Nozzle Temperature', a: '190–220°C', b: '230–260°C', winner: 'a' as const },
  { property: 'Bed Temperature', a: '50–60°C', b: '90–110°C', winner: 'a' as const },
  { property: 'Ease of Printing', a: 'Very Easy', b: 'Difficult', winner: 'a' as const },
  { property: 'Enclosure Needed', a: 'No', b: 'Yes', winner: 'a' as const },
  { property: 'Strength (Tensile)', a: '~37 MPa', b: '~40 MPa', winner: 'tie' as const },
  { property: 'Impact Resistance', a: 'Low', b: 'High', winner: 'b' as const },
  { property: 'Heat Resistance', a: '~60°C', b: '~105°C', winner: 'b' as const },
  { property: 'UV Resistance', a: 'Poor', b: 'Moderate', winner: 'b' as const },
  { property: 'Surface Finish', a: 'Smooth', b: 'Smooth (vapor smoothable)', winner: 'b' as const },
  { property: 'Fumes / Safety', a: 'Low odor, safe', b: 'Styrene fumes, ventilate', winner: 'a' as const },
  { property: 'Price Range', a: '$15–$35/kg', b: '$18–$38/kg', winner: 'a' as const },
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

export default function PLAvsABS() {
  const { data: plaFilaments, isLoading: plaLoading } = useQuery({
    queryKey: ['pla-top-vs-abs'],
    queryFn: async () => {
      const { data, error } = await supabase.from('filaments')
        .select('id, product_handle, product_title, display_name, vendor, color_family, color_hex, variant_price, filascope_score')
        .eq('material', 'PLA').not('filascope_score', 'is', null)
        .order('filascope_score', { ascending: false }).limit(6);
      if (error) throw error;
      return (data ?? []) as unknown as FilamentRow[];
    },
  });

  const { data: absFilaments, isLoading: absLoading } = useQuery({
    queryKey: ['abs-top-vs-pla'],
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
        title="PLA vs ABS — 3D Filament Comparison Guide | FilaScope"
        description="PLA vs ABS compared: strength, heat resistance, ease of printing, price & post-processing. Data-driven comparison from FilaScope's filament database."
        ogType="article"
      />
      <BreadcrumbSchema items={[{ name: 'Home', url: '/' }, { name: 'PLA vs ABS', url: '/guides/pla-vs-abs' }]} />
      <ArticleSchema
        headline="PLA vs ABS — Which 3D Printer Filament Is Right for You?"
        description="PLA vs ABS compared: strength, heat resistance, ease of printing, price & post-processing."
        datePublished="2026-02-28"
        dateModified="2026-02-28"
        url="/guides/pla-vs-abs"
        articleType="TechArticle"
        about={{ '@type': 'Thing', name: 'PLA vs ABS 3D Printing Filament Comparison' }}
        proficiencyLevel="Beginner"
      />

      <div className="max-w-4xl mx-auto px-4 py-8">
        <nav className="text-sm text-muted-foreground mb-6 flex items-center gap-1.5">
          <Link to="/" className="hover:text-foreground transition-colors">Home</Link>
          <span>›</span>
          <span>PLA vs ABS</span>
        </nav>

        <header className="mb-10">
          <h1 className="text-3xl font-bold mb-3">PLA vs ABS — Which 3D Printer Filament Is Right for You?</h1>
          <p className="text-muted-foreground text-lg leading-relaxed">
            PLA and ABS are two of the most established FDM filaments — but they're suited for very different workflows. PLA excels in ease-of-use and surface quality, while ABS offers superior heat and impact resistance. This data-driven comparison covers print settings, mechanical properties, post-processing, and cost.
          </p>
        </header>

        {/* Comparison Table */}
        <section className="mb-10">
          <h2 className="text-xl font-semibold mb-4">PLA vs ABS — Full Comparison</h2>
          <div className="rounded-lg border border-border overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/50">
                  <th className="text-left p-3 font-medium text-muted-foreground">Property</th>
                  <th className="text-center p-3 font-medium text-blue-400">PLA</th>
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
        </section>

        {/* Top Filaments */}
        <div className="grid md:grid-cols-2 gap-6 mb-10">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30">Top Rated</Badge>
                Best PLA Filaments
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {plaLoading ? Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-14 rounded-lg" />) : plaFilaments?.map(f => <FilamentMiniCard key={f.id} f={f} />)}
              <Link to="/filaments/pla" className="flex items-center justify-center gap-1 text-xs text-muted-foreground hover:text-foreground pt-1 transition-colors">
                Browse all PLA filaments <ArrowRight className="w-3 h-3" />
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

        {/* Which Should You Choose */}
        <section className="mb-10 rounded-lg border border-primary/30 bg-primary/5 p-6">
          <h2 className="text-xl font-semibold mb-3">Which Should You Choose?</h2>
          <div className="space-y-3 text-sm text-muted-foreground leading-relaxed">
            <p><strong className="text-foreground">Choose PLA if:</strong> You want hassle-free printing, sharp detail, and good surface finish. Ideal for prototyping, decorative models, miniatures, cosplay props (non-structural), and anything that won't be exposed to heat above 50°C.</p>
            <p><strong className="text-foreground">Choose ABS if:</strong> You need heat resistance above 80°C, high impact toughness, or acetone vapor smoothing for a glossy finish. Best for automotive parts, electronic enclosures, mechanical housings, and functional parts exposed to heat.</p>
            <p><strong className="text-foreground">Consider PETG instead if:</strong> You want strength and moderate heat resistance without the difficulty of ABS. <Link to="/guides/petg-vs-abs" className="text-primary hover:underline">See our PETG vs ABS comparison →</Link></p>
          </div>
        </section>

        {/* Related Guides */}
        <section className="mb-10">
          <h2 className="text-lg font-semibold mb-3">Related Guides</h2>
          <div className="flex flex-wrap gap-2">
            {[
              { to: '/guides/pla-vs-petg', label: 'PLA vs PETG Comparison' },
              { to: '/guides/petg-vs-abs', label: 'PETG vs ABS Comparison' },
              { to: '/guides/best-pla-filaments', label: 'Best PLA Filaments 2026' },
              { to: '/guides/best-abs-filaments', label: 'Best ABS Filaments 2026' },
              { to: '/guides/how-to-choose-3d-printer-filament', label: 'How to Choose 3D Printer Filament' },
              { to: '/filaments', label: 'Browse all filaments on FilaScope' },
              { to: '/compare', label: 'Compare filaments side by side' },
            ].map(link => (
              <Link key={link.to} to={link.to} className="text-xs px-3 py-1.5 rounded-full border border-border hover:border-primary hover:text-primary transition-colors">
                {link.label}
              </Link>
            ))}
          </div>
        </section>

        <FAQSection faqs={FAQS} />
      </div>
    </div>
  );
}
