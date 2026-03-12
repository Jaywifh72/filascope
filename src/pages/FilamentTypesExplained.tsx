import { Link } from 'react-router-dom';
import { DocumentHead } from '@/components/seo/DocumentHead';
import { BreadcrumbSchema, ArticleSchema, FAQSection, ItemListSchema } from '@/components/seo';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  ArrowRight, Thermometer, Shield, Layers, Zap,
  Target, BookOpen, Sparkles, Wrench, Gauge, Flame, Wind,
} from 'lucide-react';

/* ── Static data ── */

const FILAMENT_TYPES = [
  { name: 'PLA',  slug: 'pla',  difficulty: 1, strength: 'Medium',  flex: 'Low',    heat: '60°C',   price: '$15–30',  best: 'Prototyping, décor, HueForge' },
  { name: 'PLA+', slug: 'pla',  difficulty: 1, strength: 'Medium+', flex: 'Low',    heat: '65°C',   price: '$16–32',  best: 'Tougher prototypes, cosplay' },
  { name: 'PETG', slug: 'petg', difficulty: 2, strength: 'High',    flex: 'Medium', heat: '80°C',   price: '$18–40',  best: 'Functional parts, outdoor' },
  { name: 'ABS',  slug: 'abs',  difficulty: 3, strength: 'High',    flex: 'Low',    heat: '100°C',  price: '$15–30',  best: 'Enclosures, automotive' },
  { name: 'ASA',  slug: 'asa',  difficulty: 3, strength: 'High',    flex: 'Low',    heat: '100°C',  price: '$20–40',  best: 'Outdoor, UV-stable parts' },
  { name: 'TPU',  slug: 'tpu',  difficulty: 3, strength: 'Medium',  flex: 'Very High', heat: '60°C', price: '$20–50', best: 'Phone cases, gaskets, wheels' },
  { name: 'Nylon',slug: 'nylon',difficulty: 4, strength: 'Very High',flex: 'High',  heat: '80–180°C',price: '$25–60', best: 'Gears, hinges, living parts' },
  { name: 'PC',   slug: 'polycarbonate', difficulty: 5, strength: 'Very High', flex: 'Low', heat: '140°C', price: '$30–60', best: 'High-temp engineering' },
  { name: 'PEEK', slug: 'peek', difficulty: 5, strength: 'Extreme', flex: 'Low',    heat: '250°C',  price: '$300–600', best: 'Aerospace, medical' },
  { name: 'Silk PLA', slug: 'pla', difficulty: 1, strength: 'Low–Medium', flex: 'Low', heat: '55°C', price: '$18–35', best: 'Decorative vases, display' },
  { name: 'Wood-Fill', slug: 'pla', difficulty: 2, strength: 'Low',  flex: 'Low',    heat: '55°C',   price: '$25–45',  best: 'Props, artistic prints' },
  { name: 'Carbon Fiber', slug: 'petg', difficulty: 3, strength: 'Very High', flex: 'Low', heat: '80–150°C', price: '$35–70', best: 'Stiff structural parts' },
];

const ITEM_LIST_ITEMS = FILAMENT_TYPES.filter((_, i) => i < 9).map((m, i) => ({
  position: i + 1,
  name: `${m.name} filament`,
  url: `https://filascope.com/filaments/${m.slug}`,
}));

const FAQS = [
  { question: 'What is the easiest 3D printer filament to use?', answer: 'PLA is the easiest filament for beginners. It prints at low temperatures (190–215°C), rarely warps, requires minimal bed preparation, and works on virtually every FDM printer. PLA+ offers slightly better toughness with the same ease of printing.' },
  { question: 'What is the strongest filament for 3D printing?', answer: 'Polycarbonate (PC) and Nylon are the strongest FDM filaments. PC offers the highest impact resistance and heat tolerance (140°C HDT), while Nylon excels in fatigue resistance for gears and living hinges. Both require enclosed printers and all-metal hotends.' },
  { question: 'What filament is best for outdoor use?', answer: 'ASA is the best filament for outdoor applications. It combines ABS-like mechanical strength with excellent UV resistance, so prints won\'t yellow or become brittle in sunlight. PETG is a good alternative that\'s easier to print but slightly less UV-stable.' },
  { question: 'Is PETG stronger than PLA?', answer: 'Yes. PETG has higher impact resistance, better layer adhesion, and superior heat resistance (80°C vs 60°C HDT). However, PLA has higher rigidity and better detail resolution. Choose PETG for functional parts and PLA for visual or decorative prints.' },
  { question: 'Do I need an enclosure for ABS filament?', answer: 'Yes, an enclosure is strongly recommended for ABS. Without one, ABS warps severely due to uneven cooling and releases fumes that should be ventilated. ASA is a good alternative if you want similar properties with slightly easier printing.' },
  { question: 'What filament should I use for flexible prints?', answer: 'TPU (Thermoplastic Polyurethane) is the standard flexible filament. Shore 95A hardness suits most applications like phone cases and gaskets. For softer prints, look for Shore 85A TPU. A direct-drive extruder is strongly recommended — Bowden setups struggle with flexible materials.' },
];

const BREADCRUMBS = [
  { name: 'Home', url: 'https://filascope.com/' },
  { name: 'Guides', url: 'https://filascope.com/guides' },
  { name: 'Filament Types Explained', url: 'https://filascope.com/guides/3d-printer-filament-types-explained' },
];

const difficultyLabel = (d: number) => {
  const labels = ['', 'Easy', 'Moderate', 'Intermediate', 'Advanced', 'Expert'];
  return labels[d] || '';
};
const difficultyColor = (d: number) => {
  if (d <= 1) return 'text-green-400';
  if (d === 2) return 'text-emerald-400';
  if (d === 3) return 'text-amber-400';
  if (d === 4) return 'text-orange-400';
  return 'text-red-400';
};

/* ── Component ── */

export default function FilamentTypesExplained() {
  return (
    <div className="min-h-screen bg-background">
      <DocumentHead
        title="3D Printer Filament Types Explained — Complete Material Guide 2026 | FilaScope"
        description="Every 3D printer filament type explained: PLA, PETG, ABS, TPU, Nylon, ASA, PC & more. Properties, use cases, print difficulty & pricing compared."
        ogType="article"
      />
      <BreadcrumbSchema items={BREADCRUMBS} />
      <ArticleSchema
        headline="3D Printer Filament Types Explained — Every Material Compared"
        description="Every 3D printer filament type explained: PLA, PETG, ABS, TPU, Nylon, ASA, PC & more. Properties, use cases, print difficulty & pricing compared."
        datePublished="2026-02-28"
        dateModified="2026-02-28"
        url="/guides/3d-printer-filament-types-explained"
        articleType="TechArticle"
        about={{ '@type': 'Thing', name: '3D Printer Filament Types' }}
        proficiencyLevel="Beginner"
      />
      <ItemListSchema
        name="3D Printer Filament Types Compared"
        description="Every major FDM filament material type with difficulty rating, strength, and use cases."
        items={ITEM_LIST_ITEMS}
      />

      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Breadcrumb nav */}
        <nav className="text-sm text-muted-foreground mb-6 flex items-center gap-1.5 flex-wrap">
          <Link to="/" className="hover:text-foreground transition-colors">Home</Link>
          <span>›</span>
          <Link to="/guides/best-pla-filaments" className="hover:text-foreground transition-colors">Guides</Link>
          <span>›</span>
          <span>Filament Types Explained</span>
        </nav>

        {/* ── Header ── */}
        <header className="mb-10">
          <h1 className="text-3xl md:text-4xl font-bold mb-4">3D Printer Filament Types Explained — Every Material Compared</h1>
          <p className="text-muted-foreground text-lg leading-relaxed">
            From beginner-friendly PLA to aerospace-grade PEEK, there are over a dozen distinct filament materials available for FDM 3D printers — each with unique properties, print requirements, and ideal use cases. This comprehensive guide explains every major filament type, compares their strengths and limitations side by side, and helps you choose the right material for your project.
          </p>
          <p className="text-sm text-muted-foreground mt-3">
            Last updated: February 2026 · Based on data from <Link to="/filaments" className="text-primary hover:underline">1,080+ filaments</Link> tracked on FilaScope
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
                The four most common 3D printer filament types are <strong className="text-foreground">PLA</strong> (easiest, best for beginners and detail work), <strong className="text-foreground">PETG</strong> (stronger, heat-resistant, good for functional parts), <strong className="text-foreground">ABS</strong> (tough, heat-resistant, requires enclosure), and <strong className="text-foreground">TPU</strong> (flexible, ideal for gaskets and phone cases). Start with PLA, then expand to other materials as your projects demand. Use our <Link to="/wizard" className="text-primary hover:underline">Quick Match tool</Link> to find the best filament for your specific use case.
              </p>
            </div>
          </div>
          <p className="sr-only">
            Quick Answer: The four most common filament types are PLA for beginners, PETG for functional parts, ABS for heat resistance, and TPU for flexibility.
          </p>
        </div>

        {/* ── H2: Filament Types at a Glance ── */}
        <section className="mb-12">
          <h2 className="text-2xl font-semibold mb-4 flex items-center gap-2">
            <Layers className="w-5 h-5 text-primary" />
            Filament Types at a Glance
          </h2>
          <p className="text-muted-foreground leading-relaxed mb-4">
            This table compares every major FDM filament material across difficulty, strength, flexibility, heat resistance, price range, and primary use case. Click any material name for detailed print settings and product rankings.
          </p>
          <div className="rounded-lg border border-border overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/50">
                  <th className="text-left p-3 font-medium text-muted-foreground">Material</th>
                  <th className="text-center p-3 font-medium text-muted-foreground">Difficulty</th>
                  <th className="text-center p-3 font-medium text-muted-foreground">Strength</th>
                  <th className="text-center p-3 font-medium text-muted-foreground hidden sm:table-cell">Flexibility</th>
                  <th className="text-center p-3 font-medium text-muted-foreground hidden md:table-cell">Heat Resist.</th>
                  <th className="text-center p-3 font-medium text-muted-foreground">Price/kg</th>
                  <th className="text-left p-3 font-medium text-muted-foreground hidden lg:table-cell">Best For</th>
                </tr>
              </thead>
              <tbody>
                {FILAMENT_TYPES.map((m, i) => (
                  <tr key={`${m.name}-${i}`} className={`border-b border-border last:border-0 ${i % 2 ? 'bg-muted/20' : ''}`}>
                    <td className="p-3">
                      <Link to={`/filaments/${m.slug}`} className="font-medium text-primary hover:underline">{m.name}</Link>
                    </td>
                    <td className="p-3 text-center">
                      <span className={`text-xs font-medium ${difficultyColor(m.difficulty)}`}>{m.difficulty}/5</span>
                      <span className="block text-[10px] text-muted-foreground">{difficultyLabel(m.difficulty)}</span>
                    </td>
                    <td className="p-3 text-center text-xs">{m.strength}</td>
                    <td className="p-3 text-center text-xs hidden sm:table-cell">{m.flex}</td>
                    <td className="p-3 text-center text-xs hidden md:table-cell">{m.heat}</td>
                    <td className="p-3 text-center text-xs">{m.price}</td>
                    <td className="p-3 text-xs text-muted-foreground hidden lg:table-cell">{m.best}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            Need a full property comparison? Use the <Link to="/matrix" className="text-primary hover:underline">printer–filament compatibility matrix</Link> or <Link to="/compare" className="text-primary hover:underline">side-by-side comparison tool</Link>.
          </p>
        </section>

        {/* ── H2: Beginner-Friendly Filaments ── */}
        <section className="mb-12">
          <h2 className="text-2xl font-semibold mb-4 flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-primary" />
            Beginner-Friendly Filaments
          </h2>
          <p className="text-muted-foreground leading-relaxed mb-6">
            These materials work on virtually any FDM printer without special hardware. If you're new to 3D printing, start here.
          </p>

          <div className="space-y-4">
            <Card className="bg-card/50">
              <CardContent className="p-5">
                <h3 className="font-semibold text-lg mb-2 flex items-center gap-2">
                  <Link to="/filaments/pla" className="text-primary hover:underline">PLA (Polylactic Acid)</Link>
                  <Badge variant="outline" className="text-xs font-normal">Difficulty 1/5</Badge>
                </h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  PLA is the most popular 3D printer filament worldwide and the default choice for beginners. Made from renewable resources like cornstarch, it prints at low temperatures (190–215°C), rarely warps, and produces excellent surface finish with minimal stringing. PLA excels at detail work, HueForge lithophanes, cosplay props, and decorative prints. Its main limitations are low heat resistance (softens above 60°C) and brittleness under impact. Browse our <Link to="/guides/best-pla-filaments" className="text-primary hover:underline">best PLA filaments ranking</Link> for top-rated picks.
                </p>
              </CardContent>
            </Card>

            <Card className="bg-card/50">
              <CardContent className="p-5">
                <h3 className="font-semibold text-lg mb-2 flex items-center gap-2">
                  <Link to="/filaments/pla" className="text-primary hover:underline">PLA+ (Enhanced PLA)</Link>
                  <Badge variant="outline" className="text-xs font-normal">Difficulty 1/5</Badge>
                </h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  PLA+ is a modified version of standard PLA with improved toughness and reduced brittleness. Brands achieve this by blending PLA with impact modifiers or copolyesters. It prints identically to PLA — same temperatures, same ease — but offers noticeably better resistance to snapping and cracking. PLA+ is the ideal step up from standard PLA for functional prototypes, snap-fit assemblies, and parts that may see light mechanical stress. The price premium over standard PLA is typically only $2–5/kg.
                </p>
              </CardContent>
            </Card>

            <Card className="bg-card/50">
              <CardContent className="p-5">
                <h3 className="font-semibold text-lg mb-2 flex items-center gap-2">
                  <Link to="/filaments/petg" className="text-primary hover:underline">PETG (Polyethylene Terephthalate Glycol)</Link>
                  <Badge variant="outline" className="text-xs font-normal">Difficulty 2/5</Badge>
                </h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  PETG combines the ease of PLA with significantly better mechanical properties. It offers higher impact resistance, better layer adhesion, and a heat deflection temperature of ~80°C. PETG is food-safe (FDA-approved resin), chemical-resistant, and less brittle than PLA. It prints at 230–250°C with a 70–85°C bed. The main tradeoffs are more stringing than PLA and a glossy surface that's harder to paint. PETG is the go-to material for functional parts, outdoor applications, and anything that needs to survive real-world use. See our <Link to="/guides/pla-vs-petg" className="text-primary hover:underline">PLA vs PETG comparison</Link> for a detailed breakdown.
                </p>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* ── H2: Engineering & Advanced ── */}
        <section className="mb-12">
          <h2 className="text-2xl font-semibold mb-4 flex items-center gap-2">
            <Wrench className="w-5 h-5 text-primary" />
            Engineering &amp; Advanced Filaments
          </h2>
          <p className="text-muted-foreground leading-relaxed mb-6">
            These materials require enclosed printers, all-metal hotends, and careful tuning — but deliver professional-grade performance.
          </p>

          <div className="space-y-4">
            <Card className="bg-card/50">
              <CardContent className="p-5">
                <h3 className="font-semibold text-lg mb-2 flex items-center gap-2">
                  <Link to="/filaments/abs" className="text-primary hover:underline">ABS (Acrylonitrile Butadiene Styrene)</Link>
                  <Badge variant="outline" className="text-xs font-normal">Difficulty 3/5</Badge>
                </h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  ABS is the original engineering thermoplastic — LEGO bricks are made from it. It offers excellent heat resistance (100°C HDT), good impact strength, and easy post-processing with acetone vapor smoothing. ABS prints at 230–260°C and requires an enclosure to prevent severe warping. It emits styrene fumes during printing, so ventilation is essential. ABS is ideal for enclosures, automotive components, and parts that need to withstand heat. Despite being largely superseded by ASA for outdoor applications, it remains popular for its vapor-smoothing capability and low cost.
                </p>
              </CardContent>
            </Card>

            <Card className="bg-card/50">
              <CardContent className="p-5">
                <h3 className="font-semibold text-lg mb-2 flex items-center gap-2">
                  <Link to="/filaments/asa" className="text-primary hover:underline">ASA (Acrylonitrile Styrene Acrylate)</Link>
                  <Badge variant="outline" className="text-xs font-normal">Difficulty 3/5</Badge>
                </h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  ASA is essentially ABS with superior UV resistance. It maintains its color and mechanical properties after prolonged sun exposure, making it the top choice for outdoor prints like garden fixtures, car trim, and signage. ASA prints at 235–260°C with a 95–110°C bed and needs an enclosure. It warps less than ABS but still more than PETG. For anything going outdoors, ASA outperforms every other common filament material in long-term durability.
                </p>
              </CardContent>
            </Card>

            <Card className="bg-card/50">
              <CardContent className="p-5">
                <h3 className="font-semibold text-lg mb-2 flex items-center gap-2">
                  <Link to="/filaments/nylon" className="text-primary hover:underline">Nylon (PA6 / PA12)</Link>
                  <Badge variant="outline" className="text-xs font-normal">Difficulty 4/5</Badge>
                </h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Nylon is the king of functional filaments. It offers the best combination of tensile strength, impact resistance, and fatigue life of any FDM material. Nylon excels at gears, snap-fit mechanisms, living hinges, and load-bearing parts that undergo repeated stress. It prints at 250–280°C and is extremely hygroscopic — it absorbs moisture from air within hours, causing print defects. Always dry nylon before printing and store it with desiccant. PA12 variants are easier to print than PA6 and offer better moisture resistance.
                </p>
              </CardContent>
            </Card>

            <Card className="bg-card/50">
              <CardContent className="p-5">
                <h3 className="font-semibold text-lg mb-2 flex items-center gap-2">
                  <Link to="/filaments/polycarbonate" className="text-primary hover:underline">Polycarbonate (PC)</Link>
                  <Badge variant="outline" className="text-xs font-normal">Difficulty 5/5</Badge>
                </h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Polycarbonate is the strongest and most heat-resistant common FDM filament, with HDT above 140°C and exceptional impact resistance. It's used in automotive lenses, riot shields, and bulletproof glass. PC prints at 270–310°C, demands an enclosed printer with a high-temperature bed (110–130°C), and warps aggressively. It's the most difficult consumer filament to print reliably but rewards the effort with industrial-grade part performance.
                </p>
              </CardContent>
            </Card>

            <Card className="bg-card/50">
              <CardContent className="p-5">
                <h3 className="font-semibold text-lg mb-2 flex items-center gap-2">
                  PEEK (Polyether Ether Ketone)
                  <Badge variant="outline" className="text-xs font-normal">Difficulty 5/5</Badge>
                </h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  PEEK is an aerospace and medical-grade polymer with a heat deflection temperature above 250°C and mechanical properties rivaling aluminum. It requires specialized high-temperature printers (380–420°C nozzle, 120–160°C bed, 150°C+ chamber) and costs $300–600/kg. PEEK is used in surgical implants, aerospace brackets, and extreme-environment parts. It's not practical on consumer printers but represents the upper limit of FDM material capability.
                </p>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* ── H2: Specialty & Creative ── */}
        <section className="mb-12">
          <h2 className="text-2xl font-semibold mb-4 flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-primary" />
            Specialty &amp; Creative Filaments
          </h2>
          <p className="text-muted-foreground leading-relaxed mb-6">
            These materials prioritize aesthetics or unique mechanical properties over pure engineering performance.
          </p>

          <div className="space-y-4">
            <Card className="bg-card/50">
              <CardContent className="p-5">
                <h3 className="font-semibold text-lg mb-2 flex items-center gap-2">
                  <Link to="/filaments/tpu" className="text-primary hover:underline">TPU (Thermoplastic Polyurethane)</Link>
                  <Badge variant="outline" className="text-xs font-normal">Difficulty 3/5</Badge>
                </h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  TPU is the standard flexible filament, typically at Shore 95A hardness (similar to a shoe sole). It's used for phone cases, drone bumpers, gaskets, and vibration-dampening mounts. TPU prints at 220–250°C and requires a direct-drive extruder — Bowden setups struggle with its flexibility. Print slowly (20–40mm/s) with minimal retraction for best results.
                </p>
              </CardContent>
            </Card>

            <Card className="bg-card/50">
              <CardContent className="p-5">
                <h3 className="font-semibold text-lg mb-2 flex items-center gap-2">
                  Silk PLA
                  <Badge variant="outline" className="text-xs font-normal">Difficulty 1/5</Badge>
                </h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Silk PLA produces a glossy, metallic-like sheen that makes prints look polished without post-processing. It's popular for decorative vases, display models, and gifts. Silk PLA prints like standard PLA but is typically more brittle and has slightly lower detail resolution. The visual impact is striking — especially in gold, silver, and copper tones.
                </p>
              </CardContent>
            </Card>

            <Card className="bg-card/50">
              <CardContent className="p-5">
                <h3 className="font-semibold text-lg mb-2 flex items-center gap-2">
                  Wood-Fill PLA
                  <Badge variant="outline" className="text-xs font-normal">Difficulty 2/5</Badge>
                </h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Wood-fill filaments blend PLA with wood fibers (typically 20–40%) to create prints that look and feel like real wood. Varying nozzle temperature produces lighter or darker grain effects. Use a 0.6mm+ nozzle to prevent clogging from wood particles. Great for props, planters, and artistic pieces with an organic aesthetic.
                </p>
              </CardContent>
            </Card>

            <Card className="bg-card/50">
              <CardContent className="p-5">
                <h3 className="font-semibold text-lg mb-2 flex items-center gap-2">
                  <Link to="/filaments/petg" className="text-primary hover:underline">Carbon Fiber Composites</Link>
                  <Badge variant="outline" className="text-xs font-normal">Difficulty 3/5</Badge>
                </h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Carbon fiber filaments add chopped CF strands to a base polymer (PLA, PETG, Nylon, or PC) for dramatically increased stiffness and reduced weight. They produce a matte, professional-looking surface. CF composites require a hardened steel nozzle — brass nozzles wear out within hours. CF-Nylon and CF-PC offer the best strength-to-weight ratio in FDM printing.
                </p>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* ── H2: How to Choose ── */}
        <section className="mb-12">
          <h2 className="text-2xl font-semibold mb-4 flex items-center gap-2">
            <Target className="w-5 h-5 text-primary" />
            How to Choose the Right Filament Type
          </h2>
          <p className="text-muted-foreground leading-relaxed mb-4">
            Start by identifying your project's primary requirement: Is it <strong className="text-foreground">visual quality</strong> (choose PLA or Silk PLA), <strong className="text-foreground">mechanical strength</strong> (choose PETG, Nylon, or PC), <strong className="text-foreground">flexibility</strong> (choose TPU), or <strong className="text-foreground">heat resistance</strong> (choose ABS, ASA, or PC)? Then match against your printer's capabilities — most consumer printers handle PLA and PETG, while engineering filaments need enclosed chambers and all-metal hotends. For a step-by-step recommendation, use our <Link to="/wizard" className="text-primary hover:underline">Quick Match wizard</Link> or read the <Link to="/guides/how-to-choose-3d-printer-filament" className="text-primary hover:underline">complete buying guide</Link>.
          </p>
        </section>

        {/* ── FAQs ── */}
        <FAQSection faqs={FAQS} title="Frequently Asked Questions About Filament Types" />

        {/* ── Related guides ── */}
        <section className="mt-12 border-t border-border pt-8">
          <h2 className="text-lg font-semibold mb-4">Related Guides</h2>
          <div className="flex flex-wrap gap-2">
            {[
              { href: '/guides/how-to-choose-3d-printer-filament', label: 'How to Choose 3D Printer Filament' },
              { href: '/guides/pla-vs-petg', label: 'PLA vs PETG Comparison' },
              { href: '/guides/petg-vs-abs', label: 'PETG vs ABS Comparison' },
              { href: '/guides/best-pla-filaments', label: 'Best PLA Filaments 2026' },
              { href: '/guides/best-petg-filaments', label: 'Best PETG Filaments 2026' },
              { href: '/guides/best-abs-filaments', label: 'Best ABS Filaments 2026' },
              { href: '/guides/best-tpu-filaments', label: 'Best TPU Filaments 2026' },
              { href: '/guides/filament-temperature-guide', label: 'Filament Temperature Guide' },
              { href: '/filaments', label: 'Browse all filaments on FilaScope' },
              { href: '/compare', label: 'Compare filaments side by side' },
              { href: '/matrix', label: 'Printer–Filament Compatibility Matrix' },
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
