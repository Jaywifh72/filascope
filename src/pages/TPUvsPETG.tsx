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
    question: 'Can I print TPU on any 3D printer?',
    answer: 'Most direct-drive FDM printers can print TPU. Bowden-tube printers (like the stock Ender 3) struggle with flexible filaments because the long filament path causes buckling and under-extrusion. If you have a Bowden setup, use a hardened 95A TPU at very slow speeds (15–25mm/s). Direct drive extruders handle softer TPU (85A–90A) much more reliably.',
  },
  {
    question: 'Is TPU stronger than PETG?',
    answer: 'They excel in different ways. PETG has higher tensile strength (~50 MPa vs ~30 MPa for TPU) and rigidity, making it better for structural parts. TPU has dramatically better impact resistance and flexibility — it absorbs energy by deforming instead of breaking. For parts that need to survive drops, vibration, or repeated bending, TPU is stronger in practice.',
  },
  {
    question: 'What Shore hardness TPU should I use?',
    answer: 'TPU comes in Shore hardness from 60A (very soft, rubber-like) to 98A (semi-rigid). 95A is the most common and easiest to print — suitable for phone cases, bumpers, and gaskets. 85A–90A is softer for wearables and grips. Below 85A requires a well-tuned direct-drive setup and very slow print speeds.',
  },
  {
    question: 'Can I use PETG and TPU in the same print?',
    answer: 'Multi-material prints combining PETG (rigid structure) and TPU (flexible sections) are possible on dual-extruder or multi-material printers, but layer adhesion between the two materials is moderate at best. Design mechanical interlocks rather than relying on chemical bonding between layers.',
  },
  {
    question: 'Which is better for outdoor use, TPU or PETG?',
    answer: 'PETG is generally better for outdoor structural parts due to its UV resistance and dimensional stability. TPU has good UV resistance for a flexible material but can sag under sustained load in heat. For outdoor applications requiring flexibility (like protective bumpers or seals), TPU works well; for rigid outdoor parts, PETG is the better choice.',
  },
];

const COMPARISON_TABLE = [
  { property: 'Nozzle Temperature', a: '210–240°C', b: '230–250°C', winner: 'tie' as const },
  { property: 'Bed Temperature', a: '40–60°C', b: '70–85°C', winner: 'a' as const },
  { property: 'Print Speed', a: '15–35 mm/s', b: '40–80 mm/s', winner: 'b' as const },
  { property: 'Ease of Printing', a: 'Difficult', b: 'Moderate', winner: 'b' as const },
  { property: 'Extruder Type', a: 'Direct drive required', b: 'Any', winner: 'b' as const },
  { property: 'Flexibility', a: 'Very High (85A–98A)', b: 'None (rigid)', winner: 'a' as const },
  { property: 'Impact Resistance', a: 'Excellent', b: 'High', winner: 'a' as const },
  { property: 'Tensile Strength', a: '~30 MPa', b: '~50 MPa', winner: 'b' as const },
  { property: 'Heat Resistance', a: '~60°C', b: '~80°C', winner: 'b' as const },
  { property: 'Abrasion Resistance', a: 'Excellent', b: 'Moderate', winner: 'a' as const },
  { property: 'Chemical Resistance', a: 'Good', b: 'Good', winner: 'tie' as const },
  { property: 'Price Range', a: '$25–$55/kg', b: '$18–$40/kg', winner: 'b' as const },
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

export default function TPUvsPETG() {
  const { data: tpuFilaments, isLoading: tpuLoading } = useQuery({
    queryKey: ['tpu-top-vs-petg'],
    queryFn: async () => {
      const { data, error } = await supabase.from('filaments')
        .select('id, product_handle, product_title, display_name, vendor, color_family, color_hex, variant_price, filascope_score')
        .eq('material', 'TPU').not('filascope_score', 'is', null)
        .order('filascope_score', { ascending: false }).limit(6);
      if (error) throw error;
      return (data ?? []) as unknown as FilamentRow[];
    },
  });

  const { data: petgFilaments, isLoading: petgLoading } = useQuery({
    queryKey: ['petg-top-vs-tpu'],
    queryFn: async () => {
      const { data, error } = await supabase.from('filaments')
        .select('id, product_handle, product_title, display_name, vendor, color_family, color_hex, variant_price, filascope_score')
        .eq('material', 'PETG').not('filascope_score', 'is', null)
        .order('filascope_score', { ascending: false }).limit(6);
      if (error) throw error;
      return (data ?? []) as unknown as FilamentRow[];
    },
  });

  return (
    <div className="min-h-screen bg-background">
      <DocumentHead
        title="TPU vs PETG — 3D Filament Comparison Guide | FilaScope"
        description="TPU vs PETG compared: flexibility, strength, print difficulty, and use cases. Flexible vs rigid filament data-driven comparison from FilaScope."
        ogType="article"
      />
      <BreadcrumbSchema items={[{ name: 'Home', url: '/' }, { name: 'TPU vs PETG', url: '/guides/tpu-vs-petg' }]} />
      <ArticleSchema
        headline="TPU vs PETG — Which 3D Printer Filament Is Right for You?"
        description="TPU vs PETG compared: flexibility, strength, print difficulty, and use cases. Flexible vs rigid filament comparison."
        datePublished="2026-02-28"
        dateModified="2026-02-28"
        url="/guides/tpu-vs-petg"
        articleType="TechArticle"
        about={{ '@type': 'Thing', name: 'TPU vs PETG 3D Printing Filament Comparison' }}
        proficiencyLevel="Intermediate"
      />

      <div className="max-w-4xl mx-auto px-4 py-8">
        <nav className="text-sm text-muted-foreground mb-6 flex items-center gap-1.5">
          <Link to="/" className="hover:text-foreground transition-colors">Home</Link>
          <span>›</span>
          <span>TPU vs PETG</span>
        </nav>

        <header className="mb-10">
          <h1 className="text-3xl font-bold mb-3">TPU vs PETG — Which 3D Printer Filament Is Right for You?</h1>
          <p className="text-muted-foreground text-lg leading-relaxed">
            TPU and PETG serve fundamentally different purposes — one is flexible, the other rigid. But they're both popular choices for functional parts. This comparison covers printability, mechanical properties, and the best use cases for each material.
          </p>
          <p className="text-sm text-muted-foreground mt-3">
            This comparison uses data from FilaScope's database of 8,200+ filaments across 48+ brands, with real-time pricing from 15+ retailers.
          </p>
        </header>

        <section className="mb-10">
          <h2 className="text-xl font-semibold mb-4">TPU vs PETG — Full Comparison</h2>
          <div className="rounded-lg border border-border overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/50">
                  <th className="text-left p-3 font-medium text-muted-foreground">Property</th>
                  <th className="text-center p-3 font-medium text-purple-400">TPU</th>
                  <th className="text-center p-3 font-medium text-green-400">PETG</th>
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
        </div>

        <section className="mb-10 rounded-lg border border-primary/30 bg-primary/5 p-6">
          <h2 className="text-xl font-semibold mb-3">Which Should You Choose?</h2>
          <div className="space-y-3 text-sm text-muted-foreground leading-relaxed">
            <p><strong className="text-foreground">Choose TPU if:</strong> You need flexibility, impact absorption, or vibration dampening. TPU is ideal for phone cases, drone bumpers, shoe insoles, gaskets, hinges, watch bands, and any part that needs to bend or compress repeatedly without breaking.</p>
            <p><strong className="text-foreground">Choose PETG if:</strong> You need a rigid, strong material for structural parts, enclosures, brackets, or outdoor components. PETG is easier to print, faster, and cheaper — and it offers excellent chemical and UV resistance.</p>
            <p><strong className="text-foreground">Consider using both:</strong> Many projects benefit from combining rigid PETG structures with flexible TPU components — for example, a PETG drone frame with TPU landing bumpers.</p>
          </div>
        </section>

        <section className="mb-10">
          <h2 className="text-lg font-semibold mb-3">Related Comparisons</h2>
          <div className="flex flex-wrap gap-2">
            {[
              { to: '/guides/best-tpu-filaments', label: 'Best TPU Filaments' },
              { to: '/guides/best-petg-filaments', label: 'Best PETG Filaments' },
              { to: '/guides/pla-vs-petg', label: 'PLA vs PETG' },
              { to: '/guides/nylon-vs-petg', label: 'Nylon vs PETG' },
              { to: '/materials/tpu', label: 'TPU Material Guide' },
              { to: '/materials/petg', label: 'PETG Material Guide' },
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
