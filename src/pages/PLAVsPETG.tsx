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
    question: 'Is PLA or PETG easier to print?',
    answer: 'PLA is significantly easier to print. It requires lower temperatures (190–220°C nozzle, 50–60°C bed), has minimal warping, and works well on most printers without an enclosure. PETG needs higher temperatures (230–250°C nozzle, 70–85°C bed), is more prone to stringing, and benefits from a heated enclosure. For beginners, PLA is the clear choice.',
  },
  {
    question: 'Is PETG stronger than PLA?',
    answer: 'PETG is more impact-resistant and flexible than PLA, making it better for functional parts that need to absorb shocks. PLA is stiffer and can have higher tensile strength in some grades (like PLA+), but it is more brittle. PETG handles repeated stress better and is more durable for mechanical applications.',
  },
  {
    question: 'Which is better for HueForge, PLA or PETG?',
    answer: 'PLA is strongly preferred for HueForge lithophanes. PLA has more consistent TD (Transmission Distance) values across batches, a wider TD range (0.5–6.0mm), and far more community-tested data. PETG tends to have higher, less consistent TD values, making it harder to achieve opaque dark layers essential for lithophane depth and contrast.',
  },
  {
    question: 'Can I mix PLA and PETG in the same print?',
    answer: 'Generally not recommended. PLA and PETG have incompatible print temperatures — PETG requires temperatures that can degrade PLA. They also have poor interlayer adhesion to each other. Multi-material systems can physically handle both but adhesion between layers of different materials remains poor.',
  },
  {
    question: 'Can I print PETG without an enclosure?',
    answer: 'Yes. Unlike ABS, PETG does not require an enclosure. It has much lower warping tendency than ABS. However, PETG is more sensitive to cooling than PLA, so reduce part cooling fan speed to 30-50% for best layer adhesion.',
  },
  {
    question: 'Does PETG warp more than PLA?',
    answer: 'Slightly. PETG warps more than PLA due to higher printing temperatures, but much less than ABS. A heated bed at 70-80°C with clean PEI or glass virtually eliminates PETG warping on most printers.',
  },
  {
    question: 'Is PLA or PETG better for outdoor use?',
    answer: 'PETG is much better outdoors. PLA softens at just 60°C and degrades under UV light within weeks. PETG handles 80°C and resists UV degradation significantly better. For maximum outdoor durability, consider ASA instead.',
  },
  {
    question: 'Which is easier to paint — PLA or PETG?',
    answer: "PLA accepts paint much better. PLA's slightly porous surface bonds well with primers and acrylic paints. PETG's smoother surface requires light sanding or a specialty primer before painting for proper adhesion.",
  },
  {
    question: 'Is PETG food safe?',
    answer: 'Raw PETG is generally more food-safe than PLA, and PETG is the material used for water bottles. However, 3D printed parts have microscopic layer gaps where bacteria can grow. For food contact, coat prints with food-safe epoxy regardless of material choice.',
  },
  {
    question: 'How much more expensive is PETG than PLA?',
    answer: 'PETG typically costs 10-30% more than PLA. On FilaScope, average PLA prices range from $15-25/kg while PETG ranges from $18-35/kg depending on brand and region. Both are considered budget-friendly compared to engineering filaments like Nylon or PC.',
  },
  {
    question: 'Can I use PLA settings for PETG?',
    answer: "No. PETG requires different settings: higher nozzle temperature (230-245°C vs PLA's 200-215°C), higher bed temperature (70-80°C vs 50-60°C), slower speed, and reduced part cooling fan. Using PLA settings for PETG will cause poor layer adhesion and under-extrusion.",
  },
];

const COMPARISON_TABLE = [
  { property: 'Nozzle Temperature', pla: '190–220°C', petg: '230–250°C', winner: 'pla' as const },
  { property: 'Bed Temperature', pla: '50–60°C', petg: '70–85°C', winner: 'pla' as const },
  { property: 'Ease of Printing', pla: 'Very Easy', petg: 'Moderate', winner: 'pla' as const },
  { property: 'Enclosure Needed', pla: 'No', petg: 'Recommended', winner: 'pla' as const },
  { property: 'Strength (Tensile)', pla: 'High (brittle)', petg: 'Moderate (flexible)', winner: 'tie' as const },
  { property: 'Impact Resistance', pla: 'Low', petg: 'High', winner: 'petg' as const },
  { property: 'Heat Resistance', pla: '~60°C', petg: '~80°C', winner: 'petg' as const },
  { property: 'UV Resistance', pla: 'Poor', petg: 'Good', winner: 'petg' as const },
  { property: 'Price Range', pla: '$15–$35/kg', petg: '$18–$40/kg', winner: 'pla' as const },
  { property: 'TD Value Range', pla: '0.5–6.0mm', petg: '3.0–8.0mm', winner: 'pla' as const },
  { property: 'HueForge Suitability', pla: 'Excellent', petg: 'Limited', winner: 'pla' as const },
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

function WinnerIcon({ winner, material }: { winner: 'pla' | 'petg' | 'tie'; material: 'pla' | 'petg' }) {
  if (winner === 'tie') return <MinusCircle className="w-4 h-4 text-muted-foreground" />;
  if (winner === material) return <CheckCircle className="w-4 h-4 text-green-500" />;
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

export default function PLAVsPETG() {
  const { data: plaFilaments, isLoading: plaLoading } = useQuery({
    queryKey: ['pla-top'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('filaments')
        .select('id, product_handle, product_title, display_name, vendor, color_family, color_hex, variant_price, filascope_score')
        .eq('material', 'PLA')
        .not('filascope_score', 'is', null)
        .order('filascope_score', { ascending: false })
        .limit(6);
      if (error) throw error;
      return (data ?? []) as unknown as FilamentRow[];
    },
  });

  const { data: petgFilaments, isLoading: petgLoading } = useQuery({
    queryKey: ['petg-top'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('filaments')
        .select('id, product_handle, product_title, display_name, vendor, color_family, color_hex, variant_price, filascope_score')
        .eq('material', 'PETG')
        .not('filascope_score', 'is', null)
        .order('filascope_score', { ascending: false })
        .limit(6);
      if (error) throw error;
      return (data ?? []) as unknown as FilamentRow[];
    },
  });

  const breadcrumbs = [{ name: 'Home', url: '/' }, { name: 'PLA vs PETG', url: '/guides/pla-vs-petg' }];

  return (
    <div className="min-h-screen bg-background">
      <DocumentHead
        title="PLA vs PETG — 3D Filament Comparison Guide | FilaScope"
        description="PLA vs PETG compared: strength, flexibility, print settings, price & HueForge TD values. Data-driven comparison from 1,080+ filaments on FilaScope."
        ogType="article"
        keywords="PLA vs PETG, PLA PETG comparison, filament comparison, 3D printing materials, best filament, filament strength"
      />
      <BreadcrumbSchema items={breadcrumbs} />
      <ArticleSchema
        headline="PLA vs PETG — Which 3D Printer Filament Is Right for You?"
        description="PLA vs PETG compared: strength, flexibility, print settings, price & HueForge TD values."
        datePublished="2026-01-01"
        dateModified="2026-02-20"
        url="/guides/pla-vs-petg"
        articleType="TechArticle"
        about={{ '@type': 'Thing', name: 'PLA vs PETG 3D Printing Filament Comparison' }}
        proficiencyLevel="Beginner"
      />

      <div className="max-w-4xl mx-auto px-4 py-8">
        <nav className="text-sm text-muted-foreground mb-6 flex items-center gap-1.5">
          <Link to="/" className="hover:text-foreground transition-colors">Home</Link>
          <span>›</span>
          <span>PLA vs PETG</span>
        </nav>

        <header className="mb-10">
          <h1 className="text-3xl font-bold mb-3">PLA vs PETG — Which 3D Printer Filament Is Right for You?</h1>
          <p className="text-muted-foreground text-lg leading-relaxed">
            PLA and PETG are the two most popular 3D printing filaments — but they serve very different purposes. This data-driven comparison breaks down print settings, strength, HueForge TD values, and price using live data from FilaScope's 1,080+ filament database.
          </p>
        </header>

        <section className="mb-10">
          <h2 className="text-xl font-semibold mb-4">PLA vs PETG — Full Comparison</h2>
          <div className="rounded-lg border border-border overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/50">
                  <th className="text-left p-3 font-medium text-muted-foreground">Property</th>
                  <th className="text-center p-3 font-medium text-blue-400">PLA</th>
                  <th className="text-center p-3 font-medium text-green-400">PETG</th>
                </tr>
              </thead>
              <tbody>
                {COMPARISON_TABLE.map((row, i) => (
                  <tr key={row.property} className={`border-b border-border last:border-0 ${i % 2 === 0 ? '' : 'bg-muted/20'}`}>
                    <td className="p-3 text-muted-foreground">{row.property}</td>
                    <td className="p-3 text-center"><div className="flex items-center justify-center gap-1.5"><WinnerIcon winner={row.winner} material="pla" /><span>{row.pla}</span></div></td>
                    <td className="p-3 text-center"><div className="flex items-center justify-center gap-1.5"><WinnerIcon winner={row.winner} material="petg" /><span>{row.petg}</span></div></td>
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

        <section className="mb-10 rounded-lg border border-purple-500/30 bg-purple-500/5 p-6">
          <h2 className="text-xl font-semibold mb-3">PLA vs PETG for HueForge</h2>
          <p className="text-muted-foreground text-sm leading-relaxed mb-4">
            When it comes to HueForge lithophanes, <strong className="text-foreground">PLA is the clear winner</strong>. HueForge relies on precise TD values to control light opacity. PLA has a wider measurable TD range (0.5–6.0mm) and far more community-verified data than PETG.
          </p>
          <Link to="/guides/best-filaments-for-hueforge" className="inline-flex items-center gap-1.5 text-sm text-purple-400 hover:text-purple-300 transition-colors">
            See our top-ranked HueForge filament picks <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </section>

        <FAQSection faqs={FAQS} />
      </div>
    </div>
  );
}
