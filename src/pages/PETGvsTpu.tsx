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
    question: 'What is the main difference between PETG and TPU?',
    answer: 'The main difference is rigidity versus flexibility. PETG is a rigid, strong thermoplastic ideal for structural parts, enclosures, and brackets. TPU is a flexible, rubber-like material designed for parts that need to bend, compress, or absorb impact — like phone cases, gaskets, and drone bumpers. They serve fundamentally different mechanical roles in 3D printing.',
  },
  {
    question: 'Is PETG stronger than TPU?',
    answer: 'PETG has higher tensile strength (~50 MPa vs ~30 MPa for TPU), meaning it resists pulling forces better and is more rigid. However, TPU has far superior impact resistance and flexibility — it absorbs energy by deforming rather than cracking. "Stronger" depends on your application: PETG wins for structural load-bearing parts, while TPU wins for parts that must survive drops, vibration, or repeated bending.',
  },
  {
    question: 'Can my printer handle both PETG and TPU?',
    answer: 'Most FDM printers can print PETG without issue. TPU is trickier — it requires a direct-drive extruder for reliable results. Bowden-tube printers (like the stock Ender 3) struggle with TPU because the flexible filament buckles in the long tube. If your printer has direct drive, you can print both. With a Bowden setup, stick to PETG or use only stiff 95A TPU at very slow speeds (15–25 mm/s).',
  },
  {
    question: 'Which is better for functional parts, PETG or TPU?',
    answer: 'It depends entirely on the function. PETG excels for rigid functional parts: brackets, housings, tool holders, and anything that needs dimensional stability and heat resistance up to ~80°C. TPU is better for functional parts requiring flexibility: seals, bumpers, vibration dampeners, hinges, and wearables. Many projects combine both — a rigid PETG frame with flexible TPU grips or bumpers.',
  },
  {
    question: 'Can I use PETG instead of TPU?',
    answer: 'Only if you don\'t need flexibility. PETG cannot replicate TPU\'s rubber-like properties — it will crack under bending loads where TPU would flex. If your part needs to be rigid, heat-resistant, and structurally strong, PETG is the better choice anyway. But for anything requiring elasticity, impact absorption, or repeated deformation, there is no rigid substitute for TPU.',
  },
];

const COMPARISON_TABLE = [
  { property: 'Nozzle Temperature', a: '230–250°C', b: '210–240°C', winner: 'tie' as const },
  { property: 'Bed Temperature', a: '70–85°C', b: '40–60°C', winner: 'b' as const },
  { property: 'Print Speed', a: '40–80 mm/s', b: '15–35 mm/s', winner: 'a' as const },
  { property: 'Ease of Printing', a: 'Moderate', b: 'Difficult', winner: 'a' as const },
  { property: 'Extruder Type', a: 'Any', b: 'Direct drive required', winner: 'a' as const },
  { property: 'Flexibility', a: 'None (rigid)', b: 'Very High (85A–98A)', winner: 'b' as const },
  { property: 'Impact Resistance', a: 'High', b: 'Excellent', winner: 'b' as const },
  { property: 'Tensile Strength', a: '~50 MPa', b: '~30 MPa', winner: 'a' as const },
  { property: 'Heat Resistance', a: '~80°C', b: '~60°C', winner: 'a' as const },
  { property: 'Abrasion Resistance', a: 'Moderate', b: 'Excellent', winner: 'b' as const },
  { property: 'Chemical Resistance', a: 'Good', b: 'Good', winner: 'tie' as const },
  { property: 'Price Range', a: '$18–$40/kg', b: '$25–$55/kg', winner: 'a' as const },
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

export default function PETGvsTpu() {
  const { data: petgFilaments, isLoading: petgLoading } = useQuery({
    queryKey: ['petg-top-vs-tpu'],
    queryFn: async () => {
      const { data, error } = await supabase.from('filaments')
        .select('id, product_handle, product_title, display_name, vendor, color_family, color_hex, variant_price, filascope_score')
        .ilike('material', '%PETG%').not('filascope_score', 'is', null)
        .order('filascope_score', { ascending: false }).limit(6);
      if (error) throw error;
      return (data ?? []) as unknown as FilamentRow[];
    },
  });

  const { data: tpuFilaments, isLoading: tpuLoading } = useQuery({
    queryKey: ['tpu-top-vs-petg-rev'],
    queryFn: async () => {
      const { data, error } = await supabase.from('filaments')
        .select('id, product_handle, product_title, display_name, vendor, color_family, color_hex, variant_price, filascope_score')
        .ilike('material', '%TPU%').not('filascope_score', 'is', null)
        .order('filascope_score', { ascending: false }).limit(6);
      if (error) throw error;
      return (data ?? []) as unknown as FilamentRow[];
    },
  });

  return (
    <div className="min-h-screen bg-background">
      <DocumentHead
        title="PETG vs TPU — Which Filament Should You Use? | FilaScope"
        description="PETG vs TPU comparison — side-by-side specs, strength, flexibility, and use cases. Learn when to choose rigid PETG over flexible TPU for your 3D printing project."
        ogType="article"
      />
      <BreadcrumbSchema items={[{ name: 'Home', url: '/' }, { name: 'PETG vs TPU', url: '/guides/petg-vs-tpu' }]} />
      <ArticleSchema
        headline="PETG vs TPU — Which Filament Should You Use?"
        description="PETG vs TPU compared: rigidity, flexibility, strength, print difficulty, and use cases. Rigid vs flexible filament comparison."
        datePublished="2026-03-01"
        dateModified="2026-03-22"
        url="/guides/petg-vs-tpu"
        articleType="TechArticle"
        about={{ '@type': 'Thing', name: 'PETG vs TPU 3D Printing Filament Comparison' }}
        proficiencyLevel="Intermediate"
      />

      <div className="max-w-4xl mx-auto px-4 py-8">
        <nav className="text-sm text-muted-foreground mb-6 flex items-center gap-1.5">
          <Link to="/" className="hover:text-foreground transition-colors">Home</Link>
          <span>›</span>
          <span>PETG vs TPU</span>
        </nav>

        <header className="mb-10">
          <h1 className="text-3xl font-bold mb-3">PETG vs TPU — Which Filament Should You Use?</h1>
          <p className="text-muted-foreground text-lg leading-relaxed">
            PETG and TPU are both popular choices for functional 3D prints, but they serve very different purposes — one is rigid and strong, the other flexible and impact-resistant. This comparison covers printability, mechanical properties, and the best use cases for each material.
          </p>
          <p className="text-sm text-muted-foreground mt-3">
            This comparison uses data from FilaScope's database of 8,200+ filaments across 48+ brands, with real-time pricing from 15+ retailers.
          </p>
        </header>

        <section className="mb-10">
          <h2 className="text-xl font-semibold mb-4">PETG vs TPU — Full Comparison</h2>
          <div className="rounded-lg border border-border overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/50">
                  <th className="text-left p-3 font-medium text-muted-foreground">Property</th>
                  <th className="text-center p-3 font-medium text-green-400">PETG</th>
                  <th className="text-center p-3 font-medium text-purple-400">TPU</th>
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
                <Badge className="bg-purple-500/20 text-purple-400 border-purple-500/30">Top Rated</Badge>
                Best TPU Filaments
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {tpuLoading ? Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-14 rounded-lg" />) : tpuFilaments?.map(f => <FilamentMiniCard key={f.id} f={f} />)}
              <Link to="/filaments/tpu" className="flex items-center justify-center gap-1 text-xs text-muted-foreground hover:text-foreground pt-1 transition-colors">
                Browse all TPU filaments <ArrowRight className="w-3 h-3" />
              </Link>
            </CardContent>
          </Card>
        </div>

        <section className="mb-10 rounded-lg border border-primary/30 bg-primary/5 p-6">
          <h2 className="text-xl font-semibold mb-3">Which Should You Choose?</h2>
          <div className="space-y-3 text-sm text-muted-foreground leading-relaxed">
            <p><strong className="text-foreground">Choose PETG if:</strong> You need a rigid, strong material for structural parts, enclosures, brackets, or outdoor components. PETG is easier to print than TPU, faster, and cheaper — with excellent chemical and UV resistance and heat tolerance up to ~80°C.</p>
            <p><strong className="text-foreground">Choose TPU if:</strong> You need flexibility, impact absorption, or vibration dampening. TPU is ideal for phone cases, drone bumpers, shoe insoles, gaskets, hinges, watch bands, and any part that needs to bend or compress repeatedly without breaking.</p>
            <p><strong className="text-foreground">Consider using both:</strong> Many projects benefit from combining rigid PETG structures with flexible TPU components — for example, a PETG drone frame with TPU landing bumpers, or a PETG enclosure with TPU seals.</p>
          </div>
        </section>

        <section className="mb-10">
          <h2 className="text-lg font-semibold mb-3">Related Comparisons</h2>
          <div className="flex flex-wrap gap-2">
            {[
              { to: '/guides/best-petg-filaments', label: 'Best PETG Filaments' },
              { to: '/guides/best-tpu-filaments', label: 'Best TPU Filaments' },
              { to: '/guides/pla-vs-petg', label: 'PLA vs PETG' },
              { to: '/guides/tpu-vs-petg', label: 'TPU vs PETG' },
              { to: '/guides/nylon-vs-petg', label: 'Nylon vs PETG' },
              { to: '/materials/petg', label: 'PETG Material Guide' },
              { to: '/materials/tpu', label: 'TPU Material Guide' },
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
