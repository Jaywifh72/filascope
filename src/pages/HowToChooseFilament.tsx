import { Link } from 'react-router-dom';
import { DocumentHead } from '@/components/seo/DocumentHead';
import { BreadcrumbSchema, ArticleSchema, FAQSection, ItemListSchema, HowToSchema } from '@/components/seo';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  ArrowRight, Thermometer, Shield, DollarSign, Paintbrush, Layers,
  Target, BookOpen, Sparkles, Wrench, Users, Sun, Puzzle, Droplets,
} from 'lucide-react';

/* ── Static data ── */

const MATERIALS = [
  { name: 'PLA', slug: 'pla', strength: '★★★☆☆', flex: '★☆☆☆☆', ease: '★★★★★', price: '$15–35', use: 'Prototyping, décor, HueForge', temp: '60°C' },
  { name: 'PETG', slug: 'petg', strength: '★★★★☆', flex: '★★★☆☆', ease: '★★★★☆', price: '$18–40', use: 'Functional parts, outdoor', temp: '80°C' },
  { name: 'ABS', slug: 'abs', strength: '★★★★☆', flex: '★★☆☆☆', ease: '★★☆☆☆', price: '$15–30', use: 'Enclosures, automotive', temp: '100°C' },
  { name: 'TPU', slug: 'tpu', strength: '★★★☆☆', flex: '★★★★★', ease: '★★☆☆☆', price: '$20–50', use: 'Phone cases, gaskets, wheels', temp: '60°C' },
  { name: 'ASA', slug: 'asa', strength: '★★★★☆', flex: '★★☆☆☆', ease: '★★★☆☆', price: '$20–40', use: 'Outdoor, automotive, UV-stable', temp: '100°C' },
  { name: 'Nylon', slug: 'nylon', strength: '★★★★★', flex: '★★★★☆', ease: '★★☆☆☆', price: '$25–60', use: 'Gears, hinges, functional parts', temp: '80–180°C' },
  { name: 'PC', slug: 'polycarbonate', strength: '★★★★★', flex: '★★☆☆☆', ease: '★☆☆☆☆', price: '$30–60', use: 'High-temp, engineering', temp: '140°C' },
];

const ITEM_LIST_ITEMS = MATERIALS.map((m, i) => ({
  position: i + 1,
  name: `${m.name} filament`,
  url: `https://filascope.com/materials/${m.slug}`,
}));

const USE_CASES: { title: string; icon: React.ReactNode; description: string; material: string; link: string; linkText: string }[] = [
  { title: 'Beginners', icon: <Users className="w-5 h-5" />, description: 'Start with PLA — it\'s the most forgiving filament. Low temperatures, minimal warping, and excellent print quality on any FDM printer. Upgrade to PLA+ for added toughness once you\'re comfortable.', material: 'PLA / PLA+', link: '/guides/best-filaments-for-beginners', linkText: 'Best Filaments for Beginners 2026' },
  { title: 'Outdoor Use', icon: <Sun className="w-5 h-5" />, description: 'PETG or ASA are your best choices. Both resist UV degradation far better than PLA. ASA offers ABS-like strength with superior weatherability, while PETG is easier to print. Avoid PLA outdoors — it softens above 60°C.', material: 'ASA / PETG', link: '/guides/best-filaments-for-outdoor-use', linkText: 'Best Filaments for Outdoor Printing' },
  { title: 'Functional Parts', icon: <Wrench className="w-5 h-5" />, description: 'Nylon and PETG excel here. Nylon provides the best impact resistance and fatigue strength, ideal for gears and living hinges. PETG offers a good balance of toughness and ease of printing for brackets and housings.', material: 'Nylon / PETG', link: '/guides/best-filaments-for-functional-parts', linkText: 'Best Filaments for Functional Parts' },
  { title: 'Cosplay & Props', icon: <Puzzle className="w-5 h-5" />, description: 'PLA is the cosplay community\'s top choice — it sands, paints, and glues easily with beautiful surface finish. For armor that needs to flex and absorb impacts, add TPU or PETG for specific components.', material: 'PLA / TPU', link: '/guides/best-filaments-for-cosplay', linkText: 'Best Cosplay Filaments' },
  { title: 'Miniatures & Detail', icon: <Target className="w-5 h-5" />, description: 'PLA wins for detail fidelity. Its low shrinkage and ability to bridge well makes it ideal for miniatures, terrain, and models with fine features. Print at 0.08–0.12mm layer height for best results.', material: 'PLA', link: '/guides/best-filaments-for-miniatures', linkText: 'Best Filaments for Miniatures' },
  { title: 'Food Contact', icon: <Droplets className="w-5 h-5" />, description: 'PETG is the safest FDM-printable option — it\'s BPA-free and widely used in food packaging. However, no FDM print is truly food-safe due to layer-line bacteria traps. Seal with food-safe epoxy for repeated use.', material: 'PETG', link: '/guides/best-food-safe-filaments', linkText: 'Best Food-Safe Filaments' },
  { title: 'HueForge & Lithophanes', icon: <Sparkles className="w-5 h-5" />, description: 'PLA is essential for HueForge. It has the widest TD (Transmission Distance) range, the most community-verified data, and excellent layer consistency. Check FilaScope\'s TD database to find tested values for specific colors.', material: 'PLA', link: '/guides/best-filaments-for-hueforge', linkText: 'Best Filaments for HueForge' },
];

const BRANDS = [
  { name: 'Polymaker', slug: 'polymaker', note: 'Premium quality, wide material range' },
  { name: 'Bambu Lab', slug: 'bambu-lab', note: 'Optimized for Bambu printers, consistent' },
  { name: 'eSUN', slug: 'esun', note: 'Great value, extensive color library' },
  { name: 'Prusament', slug: 'prusament', note: 'Tight tolerances, lab-tested quality' },
  { name: 'Overture', slug: 'overture', note: 'Budget-friendly, reliable PLA/PETG' },
  { name: 'Hatchbox', slug: 'hatchbox', note: 'Popular choice, consistent results' },
];

const FAQS = [
  { question: 'What filament should I start with as a beginner?', answer: 'PLA is the best starting filament. It prints at low temperatures (190–220°C), requires minimal bed adhesion setup, rarely warps, and produces great surface quality. Once comfortable, try PLA+ for added toughness or PETG for functional parts.' },
  { question: 'Is expensive filament worth it?', answer: 'Often yes. Premium filaments from brands like Polymaker or Prusament offer tighter diameter tolerances (±0.02mm vs ±0.05mm), more consistent colors, fewer tangles, and better quality control. For functional or visual prints, the extra $5–15/kg can save hours of failed prints.' },
  { question: 'What is the strongest 3D printer filament?', answer: 'For FDM printing, Nylon (PA6/PA12) and Polycarbonate (PC) offer the highest strength. Nylon excels in impact and fatigue resistance, while PC handles high temperatures. For most users, PETG provides excellent strength without the printing difficulty of engineering filaments.' },
  { question: 'Can I use any filament in my 3D printer?', answer: 'No — your printer\'s maximum nozzle temperature, heated bed, and enclosure determine which materials you can use. Most printers handle PLA and PETG. ABS and ASA need an enclosure. Nylon and PC require all-metal hotends capable of 260°C+.' },
  { question: 'What filament is best for outdoor use?', answer: 'ASA is the gold standard for outdoor prints — it combines ABS-like strength with excellent UV resistance. PETG is a good alternative that\'s easier to print. Avoid PLA outdoors; it degrades in sunlight and softens above 60°C.' },
  { question: 'How should I store 3D printer filament?', answer: 'Keep filament in an airtight container with desiccant. Nylon and TPU are especially hygroscopic — they absorb moisture within hours. Wet filament causes bubbling, stringing, and poor adhesion. Use a filament dryer before printing if you hear popping sounds.' },
  { question: 'What is TD value in filament?', answer: 'TD (Transmission Distance) measures how much light passes through a filament at a given thickness, measured in millimeters. It\'s critical for HueForge lithophanes — lower TD means more opaque (good for dark layers), higher TD means more translucent. FilaScope tracks TD values for 1,000+ filaments.' },
  { question: 'PLA vs PETG — which is better overall?', answer: 'Neither is universally better — it depends on your use case. PLA is easier to print, cheaper, and better for detail work and HueForge. PETG is stronger, more heat-resistant, and better for functional and outdoor parts. Most makers keep both on hand.' },
];

const BREADCRUMBS = [
  { name: 'Home', url: 'https://filascope.com/' },
  { name: 'Guides', url: 'https://filascope.com/guides' },
  { name: 'How to Choose Filament', url: 'https://filascope.com/guides/how-to-choose-3d-printer-filament' },
];

/* ── Component ── */

export default function HowToChooseFilament() {
  return (
    <div className="min-h-screen bg-background">
      <DocumentHead
        title="How to Choose 3D Printer Filament — Complete Buying Guide 2026 | FilaScope"
        description="Learn how to choose the right 3D printer filament for your project. Compare PLA, PETG, ABS, TPU & more by strength, ease of printing, cost, and use case. Data-backed guide from FilaScope."
        ogType="article"
      />
      <BreadcrumbSchema items={BREADCRUMBS} />
      <ArticleSchema
        headline="How to Choose 3D Printer Filament — The Complete Guide"
        description="Learn how to choose the right 3D printer filament for your project. Compare PLA, PETG, ABS, TPU & more by strength, ease of printing, cost, and use case."
        datePublished="2026-02-28"
        dateModified="2026-02-28"
        url="/guides/how-to-choose-3d-printer-filament"
        articleType="Article"
        about={{ '@type': 'Thing', name: 'Choosing 3D Printer Filament' }}
      />
      <ItemListSchema
        name="3D Printer Filament Materials Compared"
        description="Overview of the most popular FDM filament materials, ranked by ease of printing."
        items={ITEM_LIST_ITEMS}
      />
      <HowToSchema
        name="How to Choose the Right 3D Printer Filament"
        description="A step-by-step process for selecting the best 3D printer filament based on your project requirements, printer compatibility, and budget."
        totalTime="PT10M"
        steps={[
          { name: 'Define Your Project Requirements', text: 'Identify what you are printing and the key properties it needs — strength, flexibility, heat resistance, or visual quality. Functional parts need PETG or Nylon; decorative prints work best with PLA.' },
          { name: 'Check Your Printer Compatibility', text: 'Verify your printer\'s maximum nozzle temperature, heated bed capability, and whether it has an enclosure. Most printers handle PLA and PETG, but ABS, ASA, Nylon, and PC require enclosed chambers and all-metal hotends.' },
          { name: 'Compare Filament Materials', text: 'Review material properties side by side — tensile strength, ease of printing, temperature resistance, and cost per kilogram. Use FilaScope\'s comparison tools to narrow down the best material for your use case.' },
          { name: 'Match Material to Use Case', text: 'Select the material that best fits your application: PLA for prototyping and HueForge, PETG for outdoor and functional parts, TPU for flexible components, ASA for UV-exposed prints, and Nylon for high-strength mechanical parts.' },
          { name: 'Choose a Trusted Brand', text: 'Pick a filament brand with tight diameter tolerances (±0.02mm), consistent color, and positive community reviews. Premium brands like Polymaker, Bambu Lab, and Prusament offer better reliability than budget alternatives.' },
          { name: 'Verify Price and Availability', text: 'Compare prices across retailers in your region using FilaScope\'s price tracker. Factor in shipping costs and spool weight (typically 1kg) to find the best value without compromising quality.' },
        ]}
      />

      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Breadcrumb nav */}
        <nav className="text-sm text-muted-foreground mb-6 flex items-center gap-1.5 flex-wrap">
          <Link to="/" className="hover:text-foreground transition-colors">Home</Link>
          <span>›</span>
          <Link to="/guides/best-pla-filaments" className="hover:text-foreground transition-colors">Guides</Link>
          <span>›</span>
          <span>How to Choose Filament</span>
        </nav>

        {/* ── Header ── */}
        <header className="mb-10">
          <h1 className="text-3xl md:text-4xl font-bold mb-4">How to Choose 3D Printer Filament — The Complete Guide</h1>
          <p className="text-muted-foreground text-lg leading-relaxed">
            With dozens of filament materials, hundreds of brands, and thousands of color options, choosing the right 3D printer filament can feel overwhelming. This data-backed guide from FilaScope breaks down every factor — from material strength and print difficulty to cost and use case — so you can pick the perfect filament for your project. Whether you're a beginner printing your first benchy or an engineer designing load-bearing parts, we've got you covered.
          </p>
          <p className="text-sm text-muted-foreground mt-3">
            Last updated: February 2026 · Based on data from <Link to="/filaments" className="text-primary hover:underline">1,080+ filaments</Link> tracked on FilaScope
          </p>
        </header>

        {/* ── H2: What to Consider ── */}
        <section className="mb-12">
          <h2 className="text-2xl font-semibold mb-4 flex items-center gap-2">
            <Target className="w-5 h-5 text-primary" />
            What to Consider When Choosing Filament
          </h2>
          <p className="text-muted-foreground leading-relaxed mb-4">
            Choosing a filament isn't just about picking a material — it's about matching material properties to your project requirements. Here are the six key factors every maker should evaluate:
          </p>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3 mb-4">
            {[
              { icon: <Shield className="w-4 h-4" />, label: 'Strength & Durability', desc: 'Tensile strength, impact resistance, and fatigue life' },
              { icon: <Thermometer className="w-4 h-4" />, label: 'Temperature Resistance', desc: 'Heat deflection temperature (HDT) for functional parts' },
              { icon: <Layers className="w-4 h-4" />, label: 'Ease of Printing', desc: 'Warping tendency, stringing, and bed adhesion needs' },
              { icon: <DollarSign className="w-4 h-4" />, label: 'Cost', desc: 'Price per kg and value vs quality tradeoff' },
              { icon: <Paintbrush className="w-4 h-4" />, label: 'Surface Finish', desc: 'Layer visibility, glossiness, and post-processing options' },
              { icon: <Wrench className="w-4 h-4" />, label: 'Printer Compatibility', desc: 'Nozzle temp, bed temp, enclosure, and hotend requirements' },
            ].map(f => (
              <Card key={f.label} className="bg-card/50">
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 mb-1 text-sm font-medium">{f.icon}{f.label}</div>
                  <p className="text-xs text-muted-foreground">{f.desc}</p>
                </CardContent>
              </Card>
            ))}
          </div>
          <p className="text-muted-foreground leading-relaxed">
            Your printer's capabilities matter too. Most consumer FDM printers handle PLA and PETG without issues, but <strong className="text-foreground">ABS, ASA, Nylon, and PC require enclosed chambers and all-metal hotends</strong>. Check your printer's specifications before ordering a specialty filament. See our <Link to="/printer-filament-compatibility" className="text-primary hover:underline">printer-filament compatibility tool</Link> for specific recommendations.
          </p>
        </section>

        {/* ── H2: Materials Compared ── */}
        <section className="mb-12">
          <h2 className="text-2xl font-semibold mb-4 flex items-center gap-2">
            <Layers className="w-5 h-5 text-primary" />
            Filament Materials Compared
          </h2>
          <p className="text-muted-foreground leading-relaxed mb-4">
            The table below compares the seven most common FDM filament materials across key dimensions. Click any material name for a detailed deep-dive with print settings, brand rankings, and comparisons.
          </p>
          <div className="rounded-lg border border-border overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/50">
                  <th className="text-left p-3 font-medium text-muted-foreground">Material</th>
                  <th className="text-center p-3 font-medium text-muted-foreground">Strength</th>
                  <th className="text-center p-3 font-medium text-muted-foreground">Flexibility</th>
                  <th className="text-center p-3 font-medium text-muted-foreground">Ease</th>
                  <th className="text-center p-3 font-medium text-muted-foreground">Price/kg</th>
                  <th className="text-center p-3 font-medium text-muted-foreground hidden md:table-cell">Max Temp</th>
                  <th className="text-left p-3 font-medium text-muted-foreground hidden lg:table-cell">Best For</th>
                </tr>
              </thead>
              <tbody>
                {MATERIALS.map((m, i) => (
                  <tr key={m.slug} className={`border-b border-border last:border-0 ${i % 2 ? 'bg-muted/20' : ''}`}>
                    <td className="p-3">
                      <Link to={`/materials/${m.slug}`} className="font-medium text-primary hover:underline">{m.name}</Link>
                    </td>
                    <td className="p-3 text-center text-xs">{m.strength}</td>
                    <td className="p-3 text-center text-xs">{m.flex}</td>
                    <td className="p-3 text-center text-xs">{m.ease}</td>
                    <td className="p-3 text-center text-xs">{m.price}</td>
                    <td className="p-3 text-center text-xs hidden md:table-cell">{m.temp}</td>
                    <td className="p-3 text-xs text-muted-foreground hidden lg:table-cell">{m.use}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            Want a head-to-head breakdown? See our comparison guides: <Link to="/guides/pla-vs-petg" className="text-primary hover:underline">PLA vs PETG</Link> · <Link to="/guides/pla-vs-abs" className="text-primary hover:underline">PLA vs ABS</Link> · <Link to="/guides/petg-vs-abs" className="text-primary hover:underline">PETG vs ABS</Link> · <Link to="/guides/tpu-vs-petg" className="text-primary hover:underline">TPU vs PETG</Link> · <Link to="/guides/nylon-vs-petg" className="text-primary hover:underline">Nylon vs PETG</Link>
          </p>
        </section>

        {/* ── H2: Best by Use Case ── */}
        <section className="mb-12">
          <h2 className="text-2xl font-semibold mb-4 flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-primary" />
            Best Filament by Use Case
          </h2>
          <p className="text-muted-foreground leading-relaxed mb-6">
            The "best" filament depends entirely on what you're making. Below, we match common use cases to the ideal material and link to our in-depth guides for each application.
          </p>
          <div className="space-y-4">
            {USE_CASES.map(uc => (
              <Card key={uc.title} className="bg-card/50">
                <CardContent className="p-5">
                  <div className="flex items-start gap-3">
                    <div className="mt-0.5 text-primary">{uc.icon}</div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold mb-1 flex items-center gap-2 flex-wrap">
                        {uc.title}
                        <Badge variant="outline" className="text-xs font-normal">{uc.material}</Badge>
                      </h3>
                      <p className="text-sm text-muted-foreground leading-relaxed mb-2">{uc.description}</p>
                      <Link to={uc.link} className="inline-flex items-center gap-1 text-sm text-primary hover:underline">
                        {uc.linkText} <ArrowRight className="w-3.5 h-3.5" />
                      </Link>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* ── H2: Understanding Specs ── */}
        <section className="mb-12">
          <h2 className="text-2xl font-semibold mb-4 flex items-center gap-2">
            <Thermometer className="w-5 h-5 text-primary" />
            Understanding Filament Specifications
          </h2>
          <p className="text-muted-foreground leading-relaxed mb-4">
            Filament datasheets are packed with numbers. Here's what actually matters when choosing a filament:
          </p>
          <div className="space-y-4">
            <div className="rounded-lg border border-border p-4">
              <h3 className="font-semibold mb-1">Nozzle Temperature</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">The temperature your hotend needs to melt the filament. PLA prints at 190–220°C; engineering filaments like Nylon and PC require 250–300°C. Printing too cold causes poor adhesion; too hot causes stringing and oozing. Check our <Link to="/guides/filament-temperature-guide" className="text-primary hover:underline">filament temperature guide</Link> for optimal ranges.</p>
            </div>
            <div className="rounded-lg border border-border p-4">
              <h3 className="font-semibold mb-1">Bed Temperature</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">Heated bed temperature prevents warping by keeping the first layers warm. PLA needs 50–60°C; ABS and Nylon need 90–110°C. Without adequate bed heat, large prints will lift at the corners.</p>
            </div>
            <div className="rounded-lg border border-border p-4">
              <h3 className="font-semibold mb-1">Tensile Strength</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">Measured in MPa, this indicates how much pulling force a material can withstand before breaking. PC and Nylon lead (55–70 MPa), while PLA is moderate (37–50 MPa). Note: print orientation dramatically affects real-world strength.</p>
            </div>
            <div className="rounded-lg border border-border p-4">
              <h3 className="font-semibold mb-1">TD Value (Transmission Distance)</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">Unique to HueForge and lithophane work, TD measures light transmission in millimeters. Lower values (0.5–2.0) create opaque layers; higher values (4.0–6.0) allow light through. FilaScope tracks TD for 1,000+ filaments. <Link to="/hueforge-td-database" className="text-primary hover:underline">Browse our TD database →</Link></p>
            </div>
          </div>
          <p className="text-sm text-muted-foreground mt-3">
            Want to understand how FilaScope scores and ranks filaments? Read our <Link to="/methodology" className="text-primary hover:underline">scoring methodology</Link>.
          </p>
        </section>

        {/* ── H2: Brands ── */}
        <section className="mb-12">
          <h2 className="text-2xl font-semibold mb-4 flex items-center gap-2">
            <Shield className="w-5 h-5 text-primary" />
            How Filament Brands Compare
          </h2>
          <p className="text-muted-foreground leading-relaxed mb-4">
            Brand matters. Premium filaments have tighter diameter tolerances, better spool winding, and more consistent batch-to-batch colors. Here are some of the top brands tracked on FilaScope:
          </p>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {BRANDS.map(b => (
              <Link
                key={b.slug}
                to={`/brands/${b.slug}`}
                className="rounded-lg border border-border p-4 hover:border-primary/60 hover:bg-primary/5 transition-all"
              >
                <p className="font-medium text-sm">{b.name}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{b.note}</p>
              </Link>
            ))}
          </div>
          <p className="text-sm text-muted-foreground mt-3">
            <Link to="/brands" className="text-primary hover:underline">Browse all 49+ filament brands on FilaScope →</Link>
          </p>
        </section>

        {/* ── H2: Price vs Quality ── */}
        <section className="mb-12">
          <h2 className="text-2xl font-semibold mb-4 flex items-center gap-2">
            <DollarSign className="w-5 h-5 text-primary" />
            Filament Price vs Quality
          </h2>
          <p className="text-muted-foreground leading-relaxed mb-4">
            Filament pricing ranges from $12/kg for budget brands to $50+/kg for specialty engineering materials. Here's how to think about the price-quality tradeoff:
          </p>
          <div className="space-y-3">
            <div className="rounded-lg border border-border p-4">
              <h3 className="font-semibold text-sm mb-1">Budget ($12–20/kg)</h3>
              <p className="text-sm text-muted-foreground">Brands like Overture and Jayo offer solid PLA and PETG at low prices. Great for prototyping and learning. Expect occasional diameter variations and fewer color options.</p>
            </div>
            <div className="rounded-lg border border-border p-4">
              <h3 className="font-semibold text-sm mb-1">Mid-range ($20–35/kg)</h3>
              <p className="text-sm text-muted-foreground">Polymaker, eSUN, and Bambu Lab occupy this sweet spot. Tighter tolerances, better color consistency, and wider material selection. Best value for most users.</p>
            </div>
            <div className="rounded-lg border border-border p-4">
              <h3 className="font-semibold text-sm mb-1">Premium ($35–60+/kg)</h3>
              <p className="text-sm text-muted-foreground">Prusament and specialty engineering filaments. Lab-tested tolerances (±0.02mm), traceable batch data, and premium materials like carbon-fiber Nylon. Worth it for critical or production parts.</p>
            </div>
          </div>
          <p className="text-sm text-muted-foreground mt-3">
            Track real-time filament prices and deals on our <Link to="/deals" className="text-primary hover:underline">deals page</Link>.
          </p>
        </section>

        {/* ── FAQs ── */}
        <FAQSection faqs={FAQS} title="Frequently Asked Questions About Choosing Filament" />

        {/* ── Related guides ── */}
        <section className="mt-12 border-t border-border pt-8">
          <h2 className="text-lg font-semibold mb-4">Related Guides</h2>
          <div className="flex flex-wrap gap-2">
            {[
              { href: '/guides/best-pla-filaments', label: 'Best PLA Filaments 2026' },
              { href: '/guides/best-petg-filaments', label: 'Best PETG Filaments 2026' },
              { href: '/guides/best-abs-filaments', label: 'Best ABS Filaments 2026' },
              { href: '/guides/best-tpu-filaments', label: 'Best TPU Filaments 2026' },
              { href: '/guides/pla-vs-petg', label: 'PLA vs PETG Comparison' },
              { href: '/guides/3d-printer-filament-types-explained', label: 'Filament Types Explained' },
              { href: '/guides/filament-temperature-guide', label: 'Filament Temperature Guide' },
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
