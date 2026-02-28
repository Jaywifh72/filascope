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
    question: 'Is PETG or ABS stronger?',
    answer: 'PETG and ABS have similar tensile strength (~50 MPa for PETG, ~40 MPa for ABS), but they differ in failure mode. PETG is more flexible and absorbs impact by deforming, while ABS is stiffer and can be tougher in applications requiring rigidity. For most functional parts, PETG offers a better balance of strength and printability.',
  },
  {
    question: 'Does PETG warp like ABS?',
    answer: 'PETG warps significantly less than ABS. PETG has a lower coefficient of thermal expansion, meaning it shrinks less as it cools. While large PETG prints can still warp slightly, it rarely requires an enclosure — unlike ABS, which almost always needs one to prevent warping and layer splitting.',
  },
  {
    question: 'Can I use PETG instead of ABS?',
    answer: 'In most cases, yes. PETG is easier to print, warps less, has no harmful fumes, and offers comparable strength. The main exceptions are when you need heat resistance above 80°C (ABS handles ~105°C), acetone vapor smoothing for cosmetic finish, or compatibility with existing ABS-based assemblies.',
  },
  {
    question: 'Which is better for outdoor use, PETG or ABS?',
    answer: 'PETG is better for outdoor use. It has superior UV resistance compared to ABS, which yellows and becomes brittle with prolonged sun exposure. PETG also has better chemical resistance to common outdoor contaminants. For maximum outdoor durability, consider ASA — essentially UV-stable ABS.',
  },
  {
    question: 'Does PETG smell when printing?',
    answer: 'PETG produces minimal odor during printing — far less than ABS, which emits styrene fumes that require ventilation. PETG is generally considered safe to print in a home environment without special ventilation, though an enclosure with a carbon filter is always good practice for any filament.',
  },
];

const COMPARISON_TABLE = [
  { property: 'Nozzle Temperature', a: '230–250°C', b: '230–260°C', winner: 'tie' as const },
  { property: 'Bed Temperature', a: '70–85°C', b: '90–110°C', winner: 'a' as const },
  { property: 'Ease of Printing', a: 'Moderate', b: 'Difficult', winner: 'a' as const },
  { property: 'Enclosure Needed', a: 'Optional', b: 'Yes', winner: 'a' as const },
  { property: 'Strength (Tensile)', a: '~50 MPa', b: '~40 MPa', winner: 'a' as const },
  { property: 'Impact Resistance', a: 'High', b: 'High', winner: 'tie' as const },
  { property: 'Heat Resistance', a: '~80°C', b: '~105°C', winner: 'b' as const },
  { property: 'UV Resistance', a: 'Good', b: 'Poor', winner: 'a' as const },
  { property: 'Chemical Resistance', a: 'Good', b: 'Moderate', winner: 'a' as const },
  { property: 'Surface Finish', a: 'Glossy', b: 'Matte (vapor smoothable)', winner: 'b' as const },
  { property: 'Fumes / Safety', a: 'Low odor', b: 'Styrene fumes', winner: 'a' as const },
  { property: 'Price Range', a: '$18–$40/kg', b: '$18–$38/kg', winner: 'tie' as const },
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
        title="PETG vs ABS — 3D Filament Comparison Guide | FilaScope"
        description="PETG vs ABS compared: strength, heat resistance, ease of printing, UV durability & post-processing. Data-driven comparison from FilaScope's filament database."
        ogType="article"
      />
      <BreadcrumbSchema items={[{ name: 'Home', url: '/' }, { name: 'PETG vs ABS', url: '/guides/petg-vs-abs' }]} />
      <ArticleSchema
        headline="PETG vs ABS — Which 3D Printer Filament Is Right for You?"
        description="PETG vs ABS compared: strength, heat resistance, ease of printing, UV durability & post-processing."
        datePublished="2026-02-28"
        dateModified="2026-02-28"
        url="/guides/petg-vs-abs"
        articleType="TechArticle"
        about={{ '@type': 'Thing', name: 'PETG vs ABS 3D Printing Filament Comparison' }}
        proficiencyLevel="Intermediate"
      />

      <div className="max-w-4xl mx-auto px-4 py-8">
        <nav className="text-sm text-muted-foreground mb-6 flex items-center gap-1.5">
          <Link to="/" className="hover:text-foreground transition-colors">Home</Link>
          <span>›</span>
          <span>PETG vs ABS</span>
        </nav>

        <header className="mb-10">
          <h1 className="text-3xl font-bold mb-3">PETG vs ABS — Which 3D Printer Filament Is Right for You?</h1>
          <p className="text-muted-foreground text-lg leading-relaxed">
            PETG and ABS are both popular choices for functional and engineering prints — but they trade off ease-of-use against heat resistance. This comparison breaks down strength, temperature tolerance, post-processing options, and real-world printability using data from FilaScope's database.
          </p>
        </header>

        <section className="mb-10">
          <h2 className="text-xl font-semibold mb-4">PETG vs ABS — Full Comparison</h2>
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

        <section className="mb-10 rounded-lg border border-primary/30 bg-primary/5 p-6">
          <h2 className="text-xl font-semibold mb-3">Which Should You Choose?</h2>
          <div className="space-y-3 text-sm text-muted-foreground leading-relaxed">
            <p><strong className="text-foreground">Choose PETG if:</strong> You want a strong, easy-to-print material for functional parts. PETG is the best all-rounder for enclosures, brackets, outdoor parts, and anything needing chemical or UV resistance without an enclosed printer.</p>
            <p><strong className="text-foreground">Choose ABS if:</strong> You need heat resistance above 80°C, want to acetone-smooth parts for a glossy finish, or are matching existing ABS assemblies. ABS is the traditional choice for automotive, electronics, and industrial prototyping.</p>
            <p><strong className="text-foreground">Consider ASA instead if:</strong> You want ABS-like properties with UV stability for outdoor use. <Link to="/materials/asa" className="text-primary hover:underline">Learn about ASA →</Link></p>
          </div>
        </section>

        <section className="mb-10">
          <h2 className="text-lg font-semibold mb-3">Related Comparisons</h2>
          <div className="flex flex-wrap gap-2">
            {[
              { to: '/guides/pla-vs-abs', label: 'PLA vs ABS' },
              { to: '/guides/pla-vs-petg', label: 'PLA vs PETG' },
              { to: '/guides/best-petg-filaments', label: 'Best PETG Filaments' },
              { to: '/guides/best-abs-filaments', label: 'Best ABS Filaments' },
              { to: '/materials/petg', label: 'PETG Material Guide' },
              { to: '/materials/abs', label: 'ABS Material Guide' },
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
