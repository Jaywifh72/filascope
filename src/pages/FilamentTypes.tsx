import { Link } from 'react-router-dom';
import { DocumentHead } from '@/components/seo/DocumentHead';
import { ArticleSchema, ItemListSchema, FAQSection, Breadcrumbs } from '@/components/seo';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { ArrowRight } from 'lucide-react';

const FAQS = [
  {
    question: 'What are the main types of 3D printer filament?',
    answer: 'The main 3D printer filament types are: PLA (easiest, most popular), PETG (stronger and more heat-resistant than PLA), ABS (heat-resistant engineering plastic, needs enclosure), ASA (UV-resistant outdoor version of ABS), TPU (flexible rubber-like material), Nylon/PA (tough engineering material), and Polycarbonate (strongest common filament). Specialty types include Silk PLA, Carbon Fiber composites, and Wood PLA.',
  },
  {
    question: 'What is the difference between PLA and PETG?',
    answer: 'PLA prints at lower temperatures (190–220°C) and is easier to use, but softens at ~60°C and is not UV-resistant. PETG prints at 230–250°C, is stronger and impact-resistant, tolerates up to 80°C, and has better chemical resistance. PETG is slightly harder to print than PLA and requires a release agent on PEI beds. For decorative and prototype prints, use PLA. For functional and outdoor-adjacent parts, use PETG.',
  },
  {
    question: 'What is the strongest 3D printing filament?',
    answer: 'Polycarbonate (PC) has the highest tensile strength and impact resistance of common filaments. Carbon fiber composites (especially PA-CF/Nylon-CF) offer the best stiffness-to-weight ratio. For practical functional parts, Nylon-CF and PETG-CF offer excellent performance without requiring extreme print conditions. PC requires 260–310°C nozzle, enclosed chamber, and an all-metal hotend.',
  },
  {
    question: 'Is 1.75mm or 2.85mm filament better?',
    answer: '1.75mm filament is the dominant standard used by the vast majority of modern consumer printers including all Bambu Lab, Creality, and most Prusa machines. 2.85mm (sometimes called 3mm) is used by some Ultimaker and older Prusa machines. For most people buying a new printer, 1.75mm is the right choice — it has a far wider selection of brands, colors, and specialty materials.',
  },
  {
    question: 'What filament type is best for outdoor use?',
    answer: 'ASA (Acrylonitrile Styrene Acrylate) is the best choice for outdoor use — it has excellent UV resistance and won\'t yellow or become brittle in sunlight. PETG is an acceptable option for moderate outdoor exposure. PLA will degrade and warp in direct sunlight within weeks. ABS has poor UV resistance despite similar temperature tolerance to ASA.',
  },
];

const MATERIALS = [
  {
    name: 'PLA', slug: 'pla', nozzle: '190–220°C', bed: '0–60°C', enclosure: 'No',
    strength: 'Medium', difficulty: 'Beginner', bestFor: 'Prototypes, decor, miniatures', price: '$',
    description: 'PLA (Polylactic Acid) is the most popular 3D printing material and the best starting point for beginners. Made from plant-based materials, it has low warping, prints at low temperatures, and is available in hundreds of colors and finishes including Silk, Matte, and High-Speed variants.',
  },
  {
    name: 'PLA+', slug: 'pla-plus', nozzle: '195–230°C', bed: '25–60°C', enclosure: 'No',
    strength: 'Medium+', difficulty: 'Beginner', bestFor: 'Stronger PLA prints, functional parts', price: '$',
    description: 'PLA+ (also called PLA Pro) adds impact-resistance modifiers to standard PLA, making it tougher and less brittle. It prints identically to standard PLA and is an excellent upgrade for prints that need more abuse resistance without the complexity of PETG.',
  },
  {
    name: 'PETG', slug: 'petg', nozzle: '220–250°C', bed: '70–85°C', enclosure: 'No',
    strength: 'High', difficulty: 'Intermediate', bestFor: 'Functional parts, enclosures, food-adjacent', price: '$$',
    description: 'PETG bridges PLA\'s ease of use with ABS\'s strength. It\'s impact-resistant, chemically resistant, and tolerates up to 80°C. The most common first upgrade from PLA. Watch for over-adhesion on PEI beds — use glue stick as a release agent.',
  },
  {
    name: 'ABS', slug: 'abs', nozzle: '230–260°C', bed: '90–110°C', enclosure: 'Required',
    strength: 'High', difficulty: 'Intermediate', bestFor: 'Heat-resistant parts, post-processing (acetone)', price: '$$',
    description: 'ABS is a classic engineering plastic used in LEGO bricks and automotive parts. It handles temperatures up to 100°C and can be smoothed with acetone vapor. Requires an enclosed printer — without one, it warps severely. Emits fumes; ensure ventilation.',
  },
  {
    name: 'ASA', slug: 'asa', nozzle: '230–260°C', bed: '90–110°C', enclosure: 'Required',
    strength: 'High', difficulty: 'Intermediate', bestFor: 'Outdoor use, UV-resistant parts', price: '$$',
    description: 'ASA is ABS\'s weatherproof upgrade. It adds excellent UV resistance — parts don\'t yellow or become brittle in sunlight. Ideal for outdoor signage, garden hardware, and car parts. Prints similarly to ABS with the same enclosure requirements.',
  },
  {
    name: 'TPU', slug: 'tpu', nozzle: '220–240°C', bed: '30–60°C', enclosure: 'No',
    strength: 'Flexible', difficulty: 'Intermediate', bestFor: 'Phone cases, gaskets, wearables, shoe soles', price: '$$',
    description: 'TPU (Thermoplastic Polyurethane) is a rubber-like flexible filament. Shore hardness (95A is most common) controls stiffness. Requires a direct-drive extruder for best results — Bowden setups struggle with flexible filament buckling. Print slowly (20–35mm/s).',
  },
  {
    name: 'Nylon (PA)', slug: 'nylon', nozzle: '240–270°C', bed: '70–90°C', enclosure: 'Recommended',
    strength: 'Very High', difficulty: 'Advanced', bestFor: 'Gears, snap-fits, functional engineering parts', price: '$$$',
    description: 'Nylon is a tough, fatigue-resistant engineering material ideal for moving parts, gears, and hinges. It\'s highly hygroscopic — always dry before printing and use a dry box during long prints. Requires an all-metal hotend (no PTFE at these temperatures).',
  },
  {
    name: 'Polycarbonate (PC)', slug: 'polycarbonate', nozzle: '260–310°C', bed: '100–130°C', enclosure: 'Required',
    strength: 'Extreme', difficulty: 'Advanced', bestFor: 'Maximum strength, heat tolerance up to 130°C', price: '$$$',
    description: 'Polycarbonate is one of the strongest and most heat-tolerant common filaments, used in bulletproof glass and aerospace components. Requires an all-metal hotend, high-temperature enclosed printer, and careful moisture management. Advanced users only.',
  },
  {
    name: 'Carbon Fiber', slug: 'carbon-fiber', nozzle: '230–270°C', bed: '60–100°C', enclosure: 'Varies',
    strength: 'Stiff', difficulty: 'Advanced', bestFor: 'Lightweight structural parts, drone frames', price: '$$$',
    description: 'CF composites add short-strand carbon fibers to a base polymer (PLA, PETG, Nylon). This dramatically increases stiffness and reduces weight — ideal for structural parts, RC frames, and robotic components. Highly abrasive: requires a hardened steel nozzle.',
  },
  {
    name: 'Wood PLA', slug: 'wood', nozzle: '190–220°C', bed: '25–60°C', enclosure: 'No',
    strength: 'Medium', difficulty: 'Intermediate', bestFor: 'Realistic textures, props, decor, models', price: '$$',
    description: 'Wood PLA blends PLA with 10–30% real wood particles (sawdust, bamboo, or cork). The result can be sanded, stained, and painted like real wood. Requires a 0.5mm+ nozzle to prevent clogging. Higher print temperatures produce darker "burnt" tones.',
  },
  {
    name: 'Silk PLA', slug: 'silk-pla', nozzle: '200–230°C', bed: '25–60°C', enclosure: 'No',
    strength: 'Medium', difficulty: 'Beginner', bestFor: 'Decorative prints, HueForge, display models', price: '$$',
    description: 'Silk PLA contains additives that produce a shimmering metallic satin finish. It shares PLA\'s easy printability and is particularly popular for HueForge lithophanes due to characteristically high TD values (5.0+). Reduce fan speed slightly for best sheen.',
  },
  {
    name: 'Glow in the Dark', slug: 'glow-in-the-dark', nozzle: '190–220°C', bed: '25–60°C', enclosure: 'No',
    strength: 'Medium', difficulty: 'Beginner', bestFor: 'Safety markers, cosplay, novelty prints', price: '$$',
    description: 'Glow in the dark PLA uses strontium aluminate phosphor particles that charge under light and glow for 6–12 hours. Prints like standard PLA. Green glows brightest; blue and purple variants have shorter duration. Thicker walls = longer, brighter glow.',
  },
];

const itemListItems = MATERIALS.map((m, i) => ({
  name: `${m.name} 3D Printer Filament`,
  url: `https://filascope.com/filaments/${m.slug}`,
  description: m.description.slice(0, 100) + '...',
  position: i + 1,
}));

const breadcrumbs = [
  { name: 'Home', url: '/' },
  { name: 'Filament Types', url: '/filament-types' },
];

function DifficultyBadge({ level }: { level: string }) {
  const colors: Record<string, string> = {
    Beginner: 'bg-green-500/10 text-green-400 border-green-500/30',
    Intermediate: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/30',
    Advanced: 'bg-red-500/10 text-red-400 border-red-500/30',
  };
  return <Badge className={`text-xs ${colors[level] || 'bg-muted text-muted-foreground'}`}>{level}</Badge>;
}

export default function FilamentTypes() {
  return (
    <>
      <DocumentHead
        title="3D Printer Filament Types — Complete Materials Guide"
        description="A complete guide to all 3D printer filament types — PLA, PETG, ABS, ASA, TPU, Nylon, PC, Carbon Fiber, and specialty materials. Comparison table, print settings, and use cases."
        ogType="article"
      />
      <ArticleSchema
        headline="3D Printer Filament Types — Complete Guide to Every Material"
        description="A complete guide to all 3D printer filament types including PLA, PETG, ABS, ASA, TPU, Nylon, PC, and specialty materials with comparison table and use cases."
        datePublished="2026-01-01"
        dateModified="2026-05-11"
        url="/filament-types"
      />
      <ItemListSchema
        name="3D Printer Filament Types"
        description="Complete guide to all 3D printer filament materials"
        items={itemListItems}
      />

      <div className="min-h-screen bg-background">
        {/* Hero */}
        <section className="bg-gradient-to-b from-primary/5 to-transparent py-12 px-4">
          <div className="max-w-5xl mx-auto">
            <Breadcrumbs items={breadcrumbs} className="mb-6" />
            <Badge className="mb-4 bg-primary/10 text-primary border-primary/20">Reference Guide · Updated Feb 2026</Badge>
            <h1 className="text-3xl md:text-4xl font-bold mb-4 text-foreground">
              3D Printer Filament Types — Complete Guide to Every Material
            </h1>
            <p className="text-lg text-muted-foreground leading-relaxed max-w-3xl">
              Filament choice is the most impactful setting in 3D printing — more so than printer speed, layer height, or any
              other parameter. The right material determines mechanical strength, heat resistance, surface finish, printability,
              and cost. This guide covers every major filament type with print settings, use cases, and links to browse
              options on FilaScope.
            </p>
          </div>
        </section>

        <div className="max-w-5xl mx-auto px-4 py-10 space-y-14">

          {/* Material categories overview */}
          <section>
            <h2 className="text-2xl font-bold mb-4">The Three Tiers of 3D Printing Filament</h2>
            <div className="grid md:grid-cols-3 gap-4">
              {[
                {
                  tier: 'Beginner / Everyday',
                  materials: 'PLA, PLA+, Silk PLA, Wood PLA, Glow in the Dark',
                  desc: 'Prints at low temperatures, no enclosure needed, widely available. Start here.',
                  color: 'border-green-500/30 bg-green-500/5',
                },
                {
                  tier: 'Functional / Intermediate',
                  materials: 'PETG, ABS, ASA, TPU',
                  desc: 'Better mechanical properties for real-world use cases. May require enclosure or higher temps.',
                  color: 'border-yellow-500/30 bg-yellow-500/5',
                },
                {
                  tier: 'Engineering / Advanced',
                  materials: 'Nylon, Polycarbonate, Carbon Fiber composites',
                  desc: 'Maximum performance requires high-temp hotends, enclosures, and moisture control.',
                  color: 'border-red-500/30 bg-red-500/5',
                },
              ].map(({ tier, materials, desc, color }) => (
                <Card key={tier} className={`border ${color}`}>
                  <CardContent className="p-5">
                    <h3 className="font-semibold mb-2">{tier}</h3>
                    <p className="text-xs font-medium text-primary mb-2">{materials}</p>
                    <p className="text-sm text-muted-foreground">{desc}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </section>

          {/* Comparison table */}
          <section>
            <h2 className="text-2xl font-bold mb-4">Filament Comparison Table — All Materials</h2>
            <div className="overflow-x-auto rounded-xl border border-border">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-muted/30">
                    <th className="text-left p-3 font-semibold min-w-[120px]">Material</th>
                    <th className="p-3 font-semibold text-left">Nozzle Temp</th>
                    <th className="p-3 font-semibold text-left">Enclosure</th>
                    <th className="p-3 font-semibold text-left">Difficulty</th>
                    <th className="p-3 font-semibold text-left">Best For</th>
                    <th className="p-3 font-semibold text-center">Price</th>
                    <th className="p-3 font-semibold text-center">Browse</th>
                  </tr>
                </thead>
                <tbody>
                  {MATERIALS.map((m) => (
                    <tr key={m.slug} className="border-b border-border last:border-0 hover:bg-muted/20">
                      <td className="p-3 font-semibold">{m.name}</td>
                      <td className="p-3 text-muted-foreground text-xs">{m.nozzle}</td>
                      <td className="p-3 text-muted-foreground text-xs">{m.enclosure}</td>
                      <td className="p-3"><DifficultyBadge level={m.difficulty} /></td>
                      <td className="p-3 text-muted-foreground text-xs max-w-[180px]">{m.bestFor}</td>
                      <td className="p-3 text-center font-mono text-muted-foreground">{m.price}</td>
                      <td className="p-3 text-center">
                        <Link to={`/filaments/${m.slug}`} className="text-xs text-primary hover:underline">
                          Browse
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          {/* Per-material deep dives */}
          <section>
            <h2 className="text-2xl font-bold mb-6">Every Filament Type Explained</h2>
            <div className="space-y-5">
              {MATERIALS.map((m) => (
                <Card key={m.slug} className="border-border">
                  <CardContent className="p-5">
                    <div className="flex items-start justify-between gap-4 mb-3">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-bold text-lg">{m.name}</h3>
                          <DifficultyBadge level={m.difficulty} />
                          <span className="text-muted-foreground/60 font-mono text-sm">{m.price}</span>
                        </div>
                        <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                          <span>Nozzle: {m.nozzle}</span>
                          <span>Bed: {m.bed}</span>
                          <span>Enclosure: {m.enclosure}</span>
                        </div>
                      </div>
                      <Link
                        to={`/filaments/${m.slug}`}
                        className="shrink-0 inline-flex items-center gap-1 text-xs text-primary hover:underline whitespace-nowrap"
                      >
                        Browse {m.name} <ArrowRight className="w-3 h-3" />
                      </Link>
                    </div>
                    <p className="text-sm text-muted-foreground leading-relaxed">{m.description}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </section>

          {/* Decision guide */}
          <section className="bg-muted/30 rounded-xl p-6 border border-border">
            <h2 className="text-xl font-bold mb-4">Which Filament Should I Start With?</h2>
            <div className="prose prose-sm max-w-none text-muted-foreground space-y-2">
              <p><strong className="text-foreground">New to 3D printing?</strong> Start with PLA. Every printer handles it. It's cheap, forgiving, and available everywhere. Once you've completed 10–20 prints in PLA, you'll understand your printer well enough to move to other materials.</p>
              <p><strong className="text-foreground">Printing functional parts that need to hold weight or heat?</strong> Upgrade to PETG. It's only slightly harder than PLA and dramatically more capable for anything structural.</p>
              <p><strong className="text-foreground">Printing outdoor parts?</strong> Use ASA. It's the only common material with real UV resistance. PETG is acceptable for partial shade.</p>
              <p><strong className="text-foreground">Need flexibility?</strong> Use TPU 95A — the most common flexible grade. Get a direct-drive printer if you can.</p>
              <p><strong className="text-foreground">Maximum strength required?</strong> Look at Nylon-CF or PC. These require advanced printer setups but produce genuinely engineering-grade parts.</p>
            </div>
          </section>

          {/* Internal links */}
          <section className="bg-muted/30 rounded-xl p-6 border border-border">
            <h2 className="text-lg font-semibold mb-4">Explore More</h2>
            <div className="grid sm:grid-cols-2 gap-3">
              {[
                { to: '/guides/best-filaments-for-beginners', label: 'Best Filaments for Beginners' },
                { to: '/guides/pla-vs-petg', label: 'PLA vs PETG — Full Comparison' },
                { to: '/3d-printer-compatibility', label: '3D Printer Compatibility Guide' },
                { to: '/filament-temperature-guide', label: 'Filament Temperature Guide' },
                { to: '/best-3d-printer-filament', label: 'Best 3D Printer Filament 2026' },
                { to: '/cheapest-filament', label: 'Cheapest Filament Options' },
              ].map((link) => (
                <Link key={link.to} to={link.to} className="flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors">
                  <ArrowRight className="w-3.5 h-3.5 text-primary shrink-0" />
                  {link.label}
                </Link>
              ))}
            </div>
          </section>

          <FAQSection faqs={FAQS} title="Frequently Asked Questions — 3D Printer Filament Types" />
        </div>
      </div>
    </>
  );
}
