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
    question: 'Is Nylon stronger than PETG?',
    answer: 'Yes. Nylon has superior tensile strength (~70–85 MPa vs ~50 MPa for PETG), much higher impact resistance, and excellent fatigue resistance under repeated stress. Nylon parts can flex thousands of times without cracking, making it the go-to for hinges, gears, clips, and load-bearing functional parts.',
  },
  {
    question: 'Does Nylon absorb moisture?',
    answer: 'Yes — Nylon is highly hygroscopic, meaning it absorbs moisture from the air rapidly. Wet Nylon produces bubbling, stringing, poor layer adhesion, and weakened parts. You must store Nylon in a dry box with desiccant and ideally print from a filament dryer. PETG absorbs much less moisture and is more forgiving of imperfect storage.',
  },
  {
    question: 'Do I need an enclosure to print Nylon?',
    answer: 'An enclosed printer is strongly recommended for Nylon. Nylon warps significantly without consistent ambient temperature (ideally 45–60°C chamber). It also requires a high bed temperature (70–100°C) and often benefits from adhesion aids like PVA glue or garolite build surfaces. PETG can print on open-frame printers without issue.',
  },
  {
    question: 'Is Nylon or PETG better for gears?',
    answer: 'Nylon is significantly better for gears and moving parts. It has a naturally low coefficient of friction (self-lubricating), exceptional wear resistance, and high fatigue life — gears printed in Nylon can withstand tens of thousands of cycles. PETG gears will wear much faster under load.',
  },
  {
    question: 'What is Nylon-CF and is it worth it?',
    answer: 'Nylon-CF (carbon fiber reinforced Nylon) adds chopped carbon fibers to a Nylon base, increasing stiffness and dimensional stability while reducing warping. It is excellent for high-performance jigs, fixtures, and structural parts. The trade-offs are higher cost ($40–$80/kg), abrasive wear on brass nozzles (use hardened steel), and slightly reduced impact resistance compared to pure Nylon.',
  },
];

const COMPARISON_TABLE = [
  { property: 'Nozzle Temperature', a: '240–270°C', b: '230–250°C', winner: 'b' as const },
  { property: 'Bed Temperature', a: '70–100°C', b: '70–85°C', winner: 'b' as const },
  { property: 'Ease of Printing', a: 'Difficult', b: 'Moderate', winner: 'b' as const },
  { property: 'Enclosure Needed', a: 'Yes', b: 'Optional', winner: 'b' as const },
  { property: 'Drying Required', a: 'Critical', b: 'Recommended', winner: 'b' as const },
  { property: 'Tensile Strength', a: '~70–85 MPa', b: '~50 MPa', winner: 'a' as const },
  { property: 'Impact Resistance', a: 'Excellent', b: 'High', winner: 'a' as const },
  { property: 'Wear Resistance', a: 'Excellent', b: 'Moderate', winner: 'a' as const },
  { property: 'Heat Resistance', a: '~80–180°C*', b: '~80°C', winner: 'a' as const },
  { property: 'Moisture Sensitivity', a: 'Very High', b: 'Low', winner: 'b' as const },
  { property: 'Chemical Resistance', a: 'Good', b: 'Good', winner: 'tie' as const },
  { property: 'Price Range', a: '$30–$80/kg', b: '$18–$40/kg', winner: 'b' as const },
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

export default function NylonvsPETG() {
  const { data: nylonFilaments, isLoading: nylonLoading } = useQuery({
    queryKey: ['nylon-top-vs-petg'],
    queryFn: async () => {
      const { data, error } = await supabase.from('filaments')
        .select('id, product_handle, product_title, display_name, vendor, color_family, color_hex, variant_price, filascope_score')
        .eq('material', 'Nylon').not('filascope_score', 'is', null)
        .order('filascope_score', { ascending: false }).limit(6);
      if (error) throw error;
      return (data ?? []) as unknown as FilamentRow[];
    },
  });

  const { data: petgFilaments, isLoading: petgLoading } = useQuery({
    queryKey: ['petg-top-vs-nylon'],
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
        title="Nylon vs PETG — 3D Filament Comparison Guide | FilaScope"
        description="Nylon vs PETG compared: tensile strength, wear resistance, printability, moisture sensitivity & cost. Engineering filament comparison from FilaScope."
        ogType="article"
      />
      <BreadcrumbSchema items={[{ name: 'Home', url: '/' }, { name: 'Nylon vs PETG', url: '/guides/nylon-vs-petg' }]} />
      <ArticleSchema
        headline="Nylon vs PETG — Which 3D Printer Filament Is Right for You?"
        description="Nylon vs PETG compared: tensile strength, wear resistance, printability, moisture sensitivity & cost."
        datePublished="2026-02-28"
        dateModified="2026-02-28"
        url="/guides/nylon-vs-petg"
        articleType="TechArticle"
        about={{ '@type': 'Thing', name: 'Nylon vs PETG 3D Printing Filament Comparison' }}
        proficiencyLevel="Advanced"
      />

      <div className="max-w-4xl mx-auto px-4 py-8">
        <nav className="text-sm text-muted-foreground mb-6 flex items-center gap-1.5">
          <Link to="/" className="hover:text-foreground transition-colors">Home</Link>
          <span>›</span>
          <span>Nylon vs PETG</span>
        </nav>

        <header className="mb-10">
          <h1 className="text-3xl font-bold mb-3">Nylon vs PETG — Which 3D Printer Filament Is Right for You?</h1>
          <p className="text-muted-foreground text-lg leading-relaxed">
            Nylon and PETG both target functional and engineering applications — but they trade off raw performance against printability. Nylon is the strongest and most wear-resistant FDM filament, while PETG offers 80% of the performance with far easier printing. This comparison helps you decide when Nylon's advantages justify its difficulty.
          </p>
          <p className="text-xs text-muted-foreground mt-2">* Nylon heat resistance varies by grade: PA6 ~80°C, PA12 ~140°C, PA6-CF ~180°C.</p>
          <p className="text-sm text-muted-foreground mt-3">
            This comparison uses data from FilaScope's database of 21,000+ filaments across 57 brands, with real-time pricing from 15+ retailers.
          </p>
        </header>

        <section className="mb-10">
          <h2 className="text-xl font-semibold mb-4">Nylon vs PETG — Full Comparison</h2>
          <div className="rounded-lg border border-border overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/50">
                  <th className="text-left p-3 font-medium text-muted-foreground">Property</th>
                  <th className="text-center p-3 font-medium text-amber-400">Nylon</th>
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
                <Badge className="bg-amber-500/20 text-amber-400 border-amber-500/30">Top Rated</Badge>
                Best Nylon Filaments
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {nylonLoading ? Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-14 rounded-lg" />) : nylonFilaments?.map(f => <FilamentMiniCard key={f.id} f={f} />)}
              <Link to="/filaments/nylon" className="flex items-center justify-center gap-1 text-xs text-muted-foreground hover:text-foreground pt-1 transition-colors">
                Browse all Nylon filaments <ArrowRight className="w-3 h-3" />
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
            <p><strong className="text-foreground">Choose Nylon if:</strong> You're printing gears, hinges, bearings, snap-fit clips, or any part under repeated mechanical stress. Nylon's self-lubricating surface and fatigue resistance are unmatched in FDM. You'll need an enclosed printer, dry storage, and patience for tuning.</p>
            <p><strong className="text-foreground">Choose PETG if:</strong> You need functional parts that are strong, chemically resistant, and easy to print. PETG is the best "everyday engineering" filament — suitable for brackets, enclosures, outdoor parts, and food-adjacent containers without the drying and enclosure requirements of Nylon.</p>
            <p><strong className="text-foreground">Consider Nylon-CF if:</strong> You need maximum stiffness and dimensional stability for jigs, fixtures, or structural parts. <Link to="/guides/best-filaments-for-functional-parts" className="text-primary hover:underline">See our functional parts guide →</Link></p>
          </div>
        </section>

        <section className="mb-10">
          <h2 className="text-lg font-semibold mb-3">Related Comparisons</h2>
          <div className="flex flex-wrap gap-2">
            {[
              { to: '/guides/pla-vs-petg', label: 'PLA vs PETG' },
              { to: '/guides/petg-vs-abs', label: 'PETG vs ABS' },
              { to: '/guides/best-filaments-for-functional-parts', label: 'Best Filaments for Functional Parts' },
              { to: '/guides/best-petg-filaments', label: 'Best PETG Filaments' },
              { to: '/materials/nylon', label: 'Nylon Material Guide' },
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
