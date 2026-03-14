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
  {
    question: 'Which filament is better for functional parts?',
    answer: 'PETG is better for functional parts that need to withstand stress, vibration, or impact. Its superior impact resistance, chemical resistance, and heat tolerance (80°C vs 60°C) make it ideal for brackets, tool holders, enclosure panels, and mechanical components. PLA is only suitable for low-stress functional parts that stay indoors.',
  },
  {
    question: 'Does PLA or PETG have better bed adhesion?',
    answer: 'PLA has easier bed adhesion — it sticks well to almost any surface at lower temperatures. PETG bonds very strongly to certain surfaces like bare glass or PEI sheets, sometimes too strongly. Use a release agent (glue stick, hairspray) on glass beds with PETG to prevent surface damage when removing prints.',
  },
  {
    question: 'Which filament produces less stringing?',
    answer: 'PLA produces significantly less stringing than PETG. PETG is notoriously stringy due to its higher print temperature and the material\'s tendency to ooze. Dialing in retraction settings (5-7mm for Bowden, 1-3mm for direct drive) and reducing temperature by 5°C can help, but PLA will always be cleaner in this regard.',
  },
  {
    question: 'Can I use PLA for mechanical parts like gears?',
    answer: 'PLA can work for light-duty gears and mechanical parts, but it is brittle under repeated stress and may crack at layer lines. For gears, hinges, and snap-fit parts, PETG or Nylon are better choices. PLA+ offers some improvement over standard PLA for these applications.',
  },
  {
    question: 'Is PLA biodegradable?',
    answer: 'PLA is technically biodegradable but only in industrial composting conditions (60°C+ sustained temperature with specific microbes). It will not break down in a home compost bin, landfill, or natural environment within any reasonable timeframe. Recycle PLA through specialized filament recycling programs where available.',
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
  { property: 'Chemical Resistance', pla: 'Poor', petg: 'Good', winner: 'petg' as const },
  { property: 'Moisture Sensitivity', pla: 'Low', petg: 'Moderate', winner: 'pla' as const },
  { property: 'Stringing Tendency', pla: 'Low', petg: 'High', winner: 'pla' as const },
  { property: 'Layer Adhesion', pla: 'Good', petg: 'Excellent', winner: 'petg' as const },
  { property: 'Bridging Performance', pla: 'Excellent', petg: 'Moderate', winner: 'pla' as const },
  { property: 'Post-Processing', pla: 'Easy (sand, paint)', petg: 'Difficult (resists paint)', winner: 'pla' as const },
  { property: 'Food Safety', pla: 'Limited', petg: 'Better (with coating)', winner: 'petg' as const },
  { property: 'Flexibility', pla: 'Rigid / brittle', petg: 'Semi-flexible', winner: 'petg' as const },
  { property: 'Print Speed', pla: 'Fast (60–150 mm/s)', petg: 'Moderate (40–80 mm/s)', winner: 'pla' as const },
  { property: 'Odor While Printing', pla: 'Minimal (sweet)', petg: 'Minimal', winner: 'tie' as const },
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
        description="PLA vs PETG compared side by side — print settings, strength, impact resistance, heat tolerance, cost, HueForge TD values & more. Data-driven guide with recommended settings for both materials."
        ogType="article"
        keywords="PLA vs PETG, PLA PETG comparison, filament comparison, 3D printing materials, best filament, filament strength"
      />
      <BreadcrumbSchema items={breadcrumbs} />
      <ArticleSchema
        headline="PLA vs PETG — Which 3D Printer Filament Is Right for You?"
        description="PLA vs PETG compared: strength, flexibility, print settings, price & HueForge TD values."
        datePublished="2026-01-01"
        dateModified="2026-03-13"
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

        {/* ── Editorial Deep-Dive Sections ── */}

        <section className="mb-10">
          <h2 className="text-xl font-semibold mb-4">Understanding PLA — The Beginner-Friendly Standard</h2>
          <div className="text-muted-foreground text-sm leading-relaxed space-y-3">
            <p>
              PLA (Polylactic Acid) is the most widely used 3D printing filament in the world, and for good reason. Derived from renewable resources like cornstarch or sugarcane, PLA prints at low temperatures, produces minimal odor, and requires almost no print bed preparation. Most printers work with PLA straight out of the box.
            </p>
            <p>
              The ideal nozzle temperature range for PLA is <strong className="text-foreground">190–220°C</strong>, with most brands performing best around 200–210°C. Bed temperature is forgiving — anywhere from room temperature to 60°C works, though 50–60°C on a PEI or glass bed gives the most consistent first-layer adhesion.
            </p>
            <p>
              PLA excels at visual prints: miniatures, decorative items, cosplay props, prototypes, and HueForge lithophanes. Its low shrinkage rate means dimensional accuracy is excellent — overhangs, bridges, and fine details print cleanly without the tuning that PETG or ABS demands.
            </p>
            <p>
              The main limitations of PLA are heat sensitivity and brittleness. Parts left in a car on a hot day (above 60°C) will soften and deform. PLA snaps under sudden impact rather than flexing, making it unsuitable for parts that absorb shock or repeated mechanical stress. High-speed PLA variants from brands like Bambu Lab, eSUN, and Polymaker have improved layer adhesion speed but do not fundamentally change these material properties.
            </p>
          </div>
        </section>

        <section className="mb-10">
          <h2 className="text-xl font-semibold mb-4">Understanding PETG — The Durable All-Rounder</h2>
          <div className="text-muted-foreground text-sm leading-relaxed space-y-3">
            <p>
              PETG (Polyethylene Terephthalate Glycol-modified) bridges the gap between easy-to-print PLA and industrial-strength ABS. It offers significantly better impact resistance, heat tolerance, and chemical resistance than PLA — without requiring the enclosed, heated build chamber that ABS demands.
            </p>
            <p>
              Print temperatures for PETG run higher: <strong className="text-foreground">230–250°C nozzle</strong> and <strong className="text-foreground">70–85°C bed</strong>. The higher bed temperature is critical — PETG that lifts off the bed mid-print is almost always a temperature issue. A clean PEI sheet at 80°C provides excellent adhesion.
            </p>
            <p>
              PETG handles mechanical stress better than PLA. Where PLA cracks or shatters under impact, PETG flexes and absorbs the force. This makes it the material of choice for functional parts: brackets, enclosure panels, tool holders, phone cases, and outdoor fixtures. Its glass transition temperature of approximately 80°C means parts survive in cars, greenhouses, and equipment housings where PLA would fail.
            </p>
            <p>
              The trade-offs are real, though. PETG is notoriously stringy — thin wisps of filament stretch between travel moves, requiring careful retraction tuning. It also bonds aggressively to certain bed surfaces; printing PETG directly on bare glass can pull chunks out of the surface. A glue-stick release layer or textured PEI sheet prevents this.
            </p>
            <p>
              PETG also resists sanding and painting more than PLA. Its smooth, slightly glossy surface finish looks good on its own, but applying primer and paint requires mechanical abrasion (220-grit sandpaper) or a specialty adhesion primer. For projects that need a painted finish, PLA saves significant post-processing time.
            </p>
          </div>
        </section>

        <section className="mb-10">
          <h2 className="text-xl font-semibold mb-4">Print Settings — Side by Side</h2>
          <div className="text-muted-foreground text-sm leading-relaxed space-y-3">
            <p>
              Getting the right print settings is critical for both materials. Here is what works for the majority of PLA and PETG brands tested on FilaScope.
            </p>
            <div className="grid md:grid-cols-2 gap-4 mt-4">
              <div className="rounded-lg border border-blue-500/20 bg-blue-500/5 p-4">
                <h3 className="text-sm font-semibold text-blue-400 mb-2">Recommended PLA Settings</h3>
                <ul className="text-xs space-y-1.5">
                  <li><strong className="text-foreground">Nozzle:</strong> 200–215°C (start at 210°C)</li>
                  <li><strong className="text-foreground">Bed:</strong> 55–60°C</li>
                  <li><strong className="text-foreground">Print speed:</strong> 60–150 mm/s</li>
                  <li><strong className="text-foreground">Cooling fan:</strong> 100% after first layer</li>
                  <li><strong className="text-foreground">Retraction:</strong> 1–2 mm (direct drive) / 4–6 mm (Bowden)</li>
                  <li><strong className="text-foreground">First layer speed:</strong> 20–30 mm/s</li>
                  <li><strong className="text-foreground">Enclosure:</strong> Not needed</li>
                </ul>
              </div>
              <div className="rounded-lg border border-green-500/20 bg-green-500/5 p-4">
                <h3 className="text-sm font-semibold text-green-400 mb-2">Recommended PETG Settings</h3>
                <ul className="text-xs space-y-1.5">
                  <li><strong className="text-foreground">Nozzle:</strong> 230–245°C (start at 235°C)</li>
                  <li><strong className="text-foreground">Bed:</strong> 75–85°C</li>
                  <li><strong className="text-foreground">Print speed:</strong> 40–80 mm/s</li>
                  <li><strong className="text-foreground">Cooling fan:</strong> 30–50% (reduce for adhesion)</li>
                  <li><strong className="text-foreground">Retraction:</strong> 1–3 mm (direct drive) / 5–7 mm (Bowden)</li>
                  <li><strong className="text-foreground">First layer speed:</strong> 15–25 mm/s</li>
                  <li><strong className="text-foreground">Enclosure:</strong> Recommended, not required</li>
                </ul>
              </div>
            </div>
            <p className="mt-3">
              A common mistake is using full cooling fan on PETG. High airflow causes poor interlayer bonding and can introduce layer-splitting (delamination). Start at 30% fan speed and increase only if you see significant stringing. For PLA, the opposite is true — maximum cooling produces sharper details and better overhangs.
            </p>
          </div>
        </section>

        <section className="mb-10">
          <h2 className="text-xl font-semibold mb-4">Strength and Durability — Real-World Performance</h2>
          <div className="text-muted-foreground text-sm leading-relaxed space-y-3">
            <p>
              Filament strength is not one-dimensional. PLA and PETG excel in different loading scenarios, and choosing the wrong material for your application can mean the difference between a part that lasts years and one that fails on first use.
            </p>
            <p>
              <strong className="text-foreground">Tensile strength</strong> measures how much pulling force a part can withstand before breaking. Standard PLA has a tensile strength of approximately 50–65 MPa, while PETG typically measures 45–55 MPa. On paper, PLA wins — but this number is misleading because PLA fails suddenly. Once it reaches its limit, it snaps with no warning. PETG deforms first, giving visible warning before ultimate failure.
            </p>
            <p>
              <strong className="text-foreground">Impact resistance</strong> is where PETG dominates. Drop a PLA part on concrete and it may shatter. Drop the same part printed in PETG and it bounces. PETG absorbs energy through deformation rather than fracture, making it essential for parts that experience drops, vibration, or sudden loads — such as drone frames, tool handles, or automotive brackets.
            </p>
            <p>
              <strong className="text-foreground">Layer adhesion</strong> also favors PETG. Because PETG prints at higher temperatures with lower cooling, each layer bonds more thoroughly to the one beneath it. This makes PETG parts stronger along the Z-axis (perpendicular to layers) — the weakest direction in any FDM print. PLA parts are more prone to splitting along layer lines, especially under bending or torsional loads.
            </p>
            <p>
              For structural applications like shelving brackets, enclosure parts, or jigs and fixtures, PETG is the safer choice. For prototypes, display models, and form-testing, PLA's stiffness and dimensional accuracy make it more practical.
            </p>
          </div>
        </section>

        <section className="mb-10">
          <h2 className="text-xl font-semibold mb-4">Outdoor and Heat Exposure</h2>
          <div className="text-muted-foreground text-sm leading-relaxed space-y-3">
            <p>
              If your print lives outdoors or in a warm environment, material choice matters enormously. PLA's glass transition temperature of approximately 60°C means it begins to soften in direct sunlight during summer months, inside parked cars, or near heat-generating equipment. A PLA mount on a window-facing wall can warp within weeks during hot weather.
            </p>
            <p>
              PETG handles roughly 80°C before softening, which covers most real-world thermal environments. Combined with better UV resistance, PETG outdoor parts maintain their shape and structural integrity for months to years. Garden tool holders, mailbox hardware, outdoor camera mounts, and irrigation fittings are all practical PETG applications.
            </p>
            <p>
              Neither PLA nor PETG is ideal for truly demanding outdoor applications with extended UV exposure. For permanent outdoor installations, ASA is the preferred material — it offers UV resistance comparable to injection-molded plastics. But for parts that need to survive outside for a season or in partially shaded environments, PETG is more than adequate.
            </p>
          </div>
        </section>

        <section className="mb-10">
          <h2 className="text-xl font-semibold mb-4">Cost Comparison — Price per Kilogram</h2>
          <div className="text-muted-foreground text-sm leading-relaxed space-y-3">
            <p>
              PLA is the most affordable filament category. Across FilaScope's database, PLA averages <strong className="text-foreground">$15–$25 per kilogram</strong> from major brands, with budget options from eSUN, Kingroon, and SUNLU frequently available under $15/kg during sales. Premium PLA from brands like Prusament or Bambu Lab sits at the higher end of this range.
            </p>
            <p>
              PETG runs <strong className="text-foreground">$18–$35 per kilogram</strong> on average, representing a 10–30% premium over equivalent PLA from the same brand. This premium reflects PETG's more complex manufacturing process and the higher raw material cost of glycol-modified PET versus polylactic acid.
            </p>
            <p>
              Effective cost per print is more nuanced than spool price alone. PETG's higher stringing means more post-processing time. PLA's faster print speeds (60–150 mm/s vs. PETG's 40–80 mm/s) translate to lower electricity costs and higher throughput on the same printer. For prototyping iterations where dozens of test prints precede a final version, PLA's combination of lower spool cost and faster printing delivers meaningful savings.
            </p>
            <p>
              For functional end-use parts where PETG's strength and durability are required, the small price premium is easily justified — replacing a broken PLA part costs more than printing it in PETG the first time.
            </p>
          </div>
        </section>

        <section className="mb-10">
          <h2 className="text-xl font-semibold mb-4">When to Choose PLA</h2>
          <div className="rounded-lg border border-blue-500/20 bg-blue-500/5 p-5">
            <ul className="text-sm text-muted-foreground space-y-2">
              <li className="flex items-start gap-2"><CheckCircle className="w-4 h-4 text-blue-400 mt-0.5 flex-shrink-0" /><span>You are new to 3D printing and want reliable, low-maintenance prints</span></li>
              <li className="flex items-start gap-2"><CheckCircle className="w-4 h-4 text-blue-400 mt-0.5 flex-shrink-0" /><span>Your project is decorative — miniatures, figurines, vases, art pieces</span></li>
              <li className="flex items-start gap-2"><CheckCircle className="w-4 h-4 text-blue-400 mt-0.5 flex-shrink-0" /><span>You are making HueForge lithophanes (PLA has better TD consistency)</span></li>
              <li className="flex items-start gap-2"><CheckCircle className="w-4 h-4 text-blue-400 mt-0.5 flex-shrink-0" /><span>You need precise dimensional accuracy for prototypes or test fits</span></li>
              <li className="flex items-start gap-2"><CheckCircle className="w-4 h-4 text-blue-400 mt-0.5 flex-shrink-0" /><span>The part stays indoors and will not be exposed to temperatures above 55°C</span></li>
              <li className="flex items-start gap-2"><CheckCircle className="w-4 h-4 text-blue-400 mt-0.5 flex-shrink-0" /><span>You plan to sand, prime, and paint the finished print</span></li>
              <li className="flex items-start gap-2"><CheckCircle className="w-4 h-4 text-blue-400 mt-0.5 flex-shrink-0" /><span>Speed matters — PLA supports faster print speeds on high-speed printers</span></li>
            </ul>
          </div>
        </section>

        <section className="mb-10">
          <h2 className="text-xl font-semibold mb-4">When to Choose PETG</h2>
          <div className="rounded-lg border border-green-500/20 bg-green-500/5 p-5">
            <ul className="text-sm text-muted-foreground space-y-2">
              <li className="flex items-start gap-2"><CheckCircle className="w-4 h-4 text-green-400 mt-0.5 flex-shrink-0" /><span>The part must withstand mechanical stress — brackets, clips, enclosures</span></li>
              <li className="flex items-start gap-2"><CheckCircle className="w-4 h-4 text-green-400 mt-0.5 flex-shrink-0" /><span>Your print will live outdoors or in a warm environment (up to 80°C)</span></li>
              <li className="flex items-start gap-2"><CheckCircle className="w-4 h-4 text-green-400 mt-0.5 flex-shrink-0" /><span>Chemical resistance matters — exposure to solvents, oils, or cleaning products</span></li>
              <li className="flex items-start gap-2"><CheckCircle className="w-4 h-4 text-green-400 mt-0.5 flex-shrink-0" /><span>You need food-adjacent parts (with proper food-safe coating applied)</span></li>
              <li className="flex items-start gap-2"><CheckCircle className="w-4 h-4 text-green-400 mt-0.5 flex-shrink-0" /><span>The part may be dropped, bumped, or subjected to vibration</span></li>
              <li className="flex items-start gap-2"><CheckCircle className="w-4 h-4 text-green-400 mt-0.5 flex-shrink-0" /><span>You want stronger Z-axis (layer-to-layer) bonding for tall prints</span></li>
              <li className="flex items-start gap-2"><CheckCircle className="w-4 h-4 text-green-400 mt-0.5 flex-shrink-0" /><span>A glossy, smooth surface finish is acceptable without painting</span></li>
            </ul>
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
