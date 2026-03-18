import { Link } from 'react-router-dom';
import { DocumentHead } from '@/components/seo/DocumentHead';
import { ArticleSchema, FAQSection } from '@/components/seo';
import { HowToSchema } from '@/components/seo/HowToSchema';
import { Breadcrumbs } from '@/components/seo/Breadcrumbs';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { AlertTriangle, ArrowRight, ThumbsDown } from 'lucide-react';

const TEMP_TABLE = [
  { material: 'PLA', nozzle: '190–220°C', bed: '50–60°C', speed: '40–100 mm/s', fan: '100%', enclosure: 'No', difficulty: 'Beginner', link: '/filaments/pla' },
  { material: 'PLA+', nozzle: '205–230°C', bed: '55–65°C', speed: '40–80 mm/s', fan: '80–100%', enclosure: 'No', difficulty: 'Beginner', link: '/filaments/pla-plus' },
  { material: 'PETG', nozzle: '230–250°C', bed: '70–85°C', speed: '40–80 mm/s', fan: '30–50%', enclosure: 'Optional', difficulty: 'Intermediate', link: '/filaments/petg' },
  { material: 'ABS', nozzle: '230–260°C', bed: '90–110°C', speed: '40–80 mm/s', fan: '0–20%', enclosure: 'Yes', difficulty: 'Advanced', link: '/filaments/abs' },
  { material: 'ASA', nozzle: '240–265°C', bed: '90–110°C', speed: '40–80 mm/s', fan: '0–20%', enclosure: 'Yes', difficulty: 'Advanced', link: '/filaments/asa' },
  { material: 'TPU (95A)', nozzle: '220–250°C', bed: '40–60°C', speed: '20–40 mm/s', fan: '50%', enclosure: 'No', difficulty: 'Intermediate', link: '/filaments/tpu' },
  { material: 'Nylon (PA)', nozzle: '240–270°C', bed: '70–90°C', speed: '30–60 mm/s', fan: '30–50%', enclosure: 'Yes', difficulty: 'Advanced', link: '/filaments/nylon' },
  { material: 'Polycarbonate', nozzle: '260–310°C', bed: '100–120°C', speed: '30–60 mm/s', fan: '0–30%', enclosure: 'Yes', difficulty: 'Expert', link: '/filaments/polycarbonate' },
  { material: 'HIPS', nozzle: '220–250°C', bed: '90–110°C', speed: '40–60 mm/s', fan: '0–50%', enclosure: 'Yes', difficulty: 'Intermediate', link: null },
  { material: 'PVA', nozzle: '180–210°C', bed: '45–60°C', speed: '30–50 mm/s', fan: '100%', enclosure: 'No', difficulty: 'Intermediate', link: null },
];

const DIFFICULTY_COLORS: Record<string, string> = {
  Beginner: 'bg-green-500/10 text-green-400 border-green-500/20',
  Intermediate: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
  Advanced: 'bg-orange-500/10 text-orange-400 border-orange-500/20',
  Expert: 'bg-red-500/10 text-red-400 border-red-500/20',
};

const FAQS = [
  {
    question: 'What happens if my nozzle temperature is too low?',
    answer: 'Under-temperature causes under-extrusion, poor layer adhesion, brittle prints, clogging, and rough surfaces. The filament does not melt fully, leaving gaps between layers and weak bonds. Increase nozzle temp in 5°C increments until layers fuse cleanly.',
  },
  {
    question: 'What happens if my nozzle temperature is too high?',
    answer: 'Over-temperature causes stringing, oozing, blobbing, discoloration (yellowing or browning), and material degradation. Some plastics like Nylon and PC can burn if run too hot for extended periods. Decrease by 5°C and check your retraction settings.',
  },
  {
    question: 'Why does my bed temperature matter?',
    answer: 'Bed temperature affects first-layer adhesion and warping. Too cold: prints pop off mid-print. Too hot: parts fuse to the bed and are impossible to remove. The sweet spot keeps the bottom layers warm enough to stay stuck but cool enough to release cleanly after printing.',
  },
  {
    question: 'How do I find the perfect temperature for a new filament?',
    answer: 'Print a temperature tower — a single object printed at varying temperatures from top to bottom. Examine each section for surface quality, layer adhesion, stringing, and bridging performance. The best section is your optimal temperature. Many slicers have a built-in temperature tower plugin.',
  },
  {
    question: 'Does brand matter for temperature settings?',
    answer: 'Yes. Even the same material type can vary 10–15°C between brands. Always start with the temperature range printed on the spool label, then use a temperature tower to fine-tune. FilaScope\'s filament detail pages show the documented temperature range for each specific product.',
  },
];

const HOW_TO_STEPS = [
  { name: 'Check the Spool Label', text: 'Every filament spool lists a recommended temperature range on the label. Start at the middle of this range for your first test print.' },
  { name: 'Print a Temperature Tower', text: 'Use your slicer\'s temperature tower plugin to print a test object at 5°C intervals across your target range. Evaluate each section for surface quality and layer adhesion.' },
  { name: 'Evaluate the Results', text: 'Look for the section with the smoothest surface, strongest layer bonding, and least stringing. Avoid sections with gaps (too cold) or excessive oozing (too hot).' },
  { name: 'Fine-Tune in 2–3°C Steps', text: 'Once you have identified your ideal range, adjust in smaller 2–3°C increments for final optimization. Document your result for future reference.' },
  { name: 'Set Your Slicer Profile', text: 'Update your printer profile in your slicer with the optimal temperature and save it. Name it specifically by filament brand and color for easy recall.' },
];

export default function FilamentTemperatureGuide() {
  const canonical = 'https://filascope.com/guides/filament-temperature-guide';

  return (
    <>
      <DocumentHead
        title="3D Printer Filament Temperature Guide — Settings Chart for Every Material | FilaScope"
        description="Complete filament temperature settings chart for PLA, PETG, ABS, TPU, Nylon, ASA & more. Nozzle temp, bed temp, and print speed for every material type."
        canonical={canonical}
        ogTitle="3D Printer Filament Temperature Guide — Every Material"
        ogDescription="Complete filament temperature settings chart for PLA, PETG, ABS, TPU, Nylon, ASA & more. Nozzle temp, bed temp, and print speed for every material type."
      />
      <ArticleSchema
        headline="3D Printer Filament Temperature Guide"
        description="Complete filament temperature settings chart for PLA, PETG, ABS, TPU, Nylon, ASA & more. Nozzle temp, bed temp, and print speed for every material type."
        datePublished="2026-02-19"
        dateModified="2026-02-28"
        url="/guides/filament-temperature-guide"
        articleType="TechArticle"
        about={{ '@type': 'Thing', name: '3D Printer Filament Temperature Settings' }}
        proficiencyLevel="Beginner"
      />
      <HowToSchema
        name="How to Find the Right 3D Printing Temperature for Any Filament"
        description="A step-by-step process for dialing in the optimal nozzle and bed temperature for any 3D printing filament."
        totalTime="PT30M"
        steps={HOW_TO_STEPS}
      />
      <FAQSection faqs={FAQS} />

      <div className="min-h-screen bg-background">
        <div className="max-w-4xl mx-auto px-4 py-6">
          <Breadcrumbs items={[
            { name: 'Guides', url: '/guides' },
            { name: 'Filament Temperature Guide', url: '/guides/filament-temperature-guide' },
          ]} />
        </div>

        {/* Hero */}
        <section className="bg-gradient-to-b from-primary/5 to-transparent py-12 px-4">
          <div className="max-w-4xl mx-auto">
            <Badge className="mb-4 bg-primary/10 text-primary border-primary/20">Reference Guide · Updated Feb 2026</Badge>
            <h1 className="text-3xl md:text-4xl font-bold mb-4 text-foreground">
              3D Printer Filament Temperature Guide
            </h1>
            <p className="text-lg text-muted-foreground leading-relaxed max-w-2xl">
              The definitive temperature reference for every common 3D printing filament. Find nozzle and bed temperatures,
              fan speeds, enclosure requirements, and print speed recommendations for PLA, PETG, ABS, ASA, TPU, Nylon, PC, and more.
            </p>
          </div>
        </section>

        <div className="max-w-4xl mx-auto px-4 py-10 space-y-14">

          {/* Quick Answer Callout */}
          <section>
            <div className="rounded-xl border-2 border-primary/20 bg-primary/5 p-6">
              <h2 className="text-lg font-bold text-foreground mb-2">Quick Answer</h2>
              <p className="text-base text-muted-foreground leading-relaxed">
                Most <Link to="/filaments/pla" className="text-primary hover:underline font-medium">PLA</Link> filaments print best at 200–215°C nozzle with a 50–60°C bed.{' '}
                <Link to="/filaments/petg" className="text-primary hover:underline font-medium">PETG</Link> needs 230–250°C nozzle and 70–85°C bed.{' '}
                <Link to="/filaments/abs" className="text-primary hover:underline font-medium">ABS</Link> requires 230–260°C nozzle, 90–110°C bed, and an enclosed printer.
                Always start at the midpoint of the manufacturer's range and print a temperature tower to fine-tune. See the full chart below for all materials.
              </p>
            </div>
          </section>

          {/* Filament Temperature Chart */}
          <section>
            <h2 className="text-2xl font-bold mb-2">Filament Temperature Chart</h2>
            <p className="text-muted-foreground text-sm mb-4">
              These are typical ranges. Always start with the temperature printed on your spool label — values vary between brands.
              Check <Link to="/filaments" className="text-primary hover:underline">FilaScope's filament database</Link> for brand-specific temperatures.
            </p>
            <Card className="border-border overflow-hidden">
              <CardContent className="p-0 overflow-x-auto">
                <table className="w-full text-sm min-w-[740px]">
                  <thead>
                    <tr className="border-b border-border bg-muted/30">
                      <th className="text-left p-3 font-semibold">Material</th>
                      <th className="text-left p-3 font-semibold">Nozzle Temp</th>
                      <th className="text-left p-3 font-semibold">Bed Temp</th>
                      <th className="text-left p-3 font-semibold">Speed</th>
                      <th className="text-left p-3 font-semibold">Fan</th>
                      <th className="text-left p-3 font-semibold">Enclosure</th>
                      <th className="text-left p-3 font-semibold">Difficulty</th>
                    </tr>
                  </thead>
                  <tbody>
                    {TEMP_TABLE.map((row) => (
                      <tr key={row.material} className="border-b border-border last:border-0 hover:bg-muted/20 transition-colors">
                        <td className="p-3 font-medium">
                          {row.link ? (
                            <Link to={row.link} className="text-primary hover:underline">{row.material}</Link>
                          ) : (
                            row.material
                          )}
                        </td>
                        <td className="p-3 text-muted-foreground font-mono text-xs">{row.nozzle}</td>
                        <td className="p-3 text-muted-foreground font-mono text-xs">{row.bed}</td>
                        <td className="p-3 text-muted-foreground font-mono text-xs">{row.speed}</td>
                        <td className="p-3 text-muted-foreground">{row.fan}</td>
                        <td className="p-3 text-muted-foreground">{row.enclosure}</td>
                        <td className="p-3">
                          <Badge variant="outline" className={DIFFICULTY_COLORS[row.difficulty]}>
                            {row.difficulty}
                          </Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </CardContent>
            </Card>
          </section>

          {/* How Temperature Affects Print Quality */}
          <section>
            <h2 className="text-2xl font-bold mb-4">How Temperature Affects Print Quality</h2>
            <p className="text-muted-foreground leading-relaxed">
              Temperature is the single most important variable in FDM printing. The nozzle temperature controls how fully the filament melts — too cold and the plastic doesn't flow properly, creating weak layer bonds and rough surfaces. Too hot and the material becomes overly fluid, causing stringing, oozing, and poor dimensional accuracy. Bed temperature controls first-layer adhesion and warping prevention. Getting both right means the difference between a strong, smooth print and a failed one. Every material has a different optimal window, and even within the same material type, brands can vary by 10–15°C.
            </p>
          </section>

          {/* Temperature Troubleshooting */}
          <section>
            <h2 className="text-2xl font-bold mb-6">Temperature Troubleshooting</h2>
            <div className="grid sm:grid-cols-2 gap-6">
              <Card className="border-destructive/30 bg-destructive/5">
                <CardContent className="p-5">
                  <div className="flex items-center gap-2 mb-3">
                    <ThumbsDown className="w-5 h-5 text-destructive" />
                    <h3 className="font-semibold text-destructive">Too Cold (Under-Temperature)</h3>
                  </div>
                  <ul className="space-y-1.5 text-sm text-muted-foreground">
                    <li>• Under-extrusion — gaps between lines</li>
                    <li>• Poor layer adhesion — brittle, delaminating prints</li>
                    <li>• Rough, textured surface finish</li>
                    <li>• Nozzle clogs from partially-melted filament</li>
                    <li>• Extruder skipping / grinding filament</li>
                  </ul>
                  <p className="text-xs text-muted-foreground mt-3"><strong>Fix:</strong> Increase nozzle temp by 5°C increments until resolved.</p>
                </CardContent>
              </Card>

              <Card className="border-amber-500/30 bg-amber-500/5">
                <CardContent className="p-5">
                  <div className="flex items-center gap-2 mb-3">
                    <ThumbsDown className="w-5 h-5 text-amber-500" />
                    <h3 className="font-semibold text-amber-500">Too Hot (Over-Temperature)</h3>
                  </div>
                  <ul className="space-y-1.5 text-sm text-muted-foreground">
                    <li>• Stringing between features</li>
                    <li>• Blobbing and oozing on walls</li>
                    <li>• Drooping or sagging on overhangs</li>
                    <li>• Discoloration — yellowing or browning</li>
                    <li>• Material degradation over long prints</li>
                  </ul>
                  <p className="text-xs text-muted-foreground mt-3"><strong>Fix:</strong> Decrease nozzle temp by 5°C and check retraction settings.</p>
                </CardContent>
              </Card>
            </div>
          </section>

          {/* Material-Specific Temperature Tips */}
          <section>
            <h2 className="text-2xl font-bold mb-6">Material-Specific Temperature Tips</h2>
            <div className="grid sm:grid-cols-2 gap-6">
              <div className="rounded-lg border border-border p-5 bg-card/50">
                <h3 className="font-semibold text-foreground mb-2">
                  <Link to="/filaments/pla" className="text-primary hover:underline">PLA</Link> — 190–220°C
                </h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  PLA is the most forgiving material. Start at 210°C and adjust ±5°C. Use 100% part cooling fan for sharp overhangs. Higher temperatures (215–220°C) improve layer adhesion on larger parts but increase stringing. High-speed PLA formulations need 5–10°C higher than standard PLA.
                </p>
              </div>

              <div className="rounded-lg border border-border p-5 bg-card/50">
                <h3 className="font-semibold text-foreground mb-2">
                  <Link to="/filaments/petg" className="text-primary hover:underline">PETG</Link> — 230–250°C
                </h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  PETG requires higher nozzle temps than PLA and benefits from reduced part cooling (30–50% fan). Print at 235–245°C for most brands. Too-hot PETG strings excessively — increase retraction before raising temperature. PETG sticks extremely well to PEI sheets; use a release agent to prevent bed damage.
                </p>
              </div>

              <div className="rounded-lg border border-border p-5 bg-card/50">
                <h3 className="font-semibold text-foreground mb-2">
                  <Link to="/filaments/abs" className="text-primary hover:underline">ABS</Link> — 230–260°C
                </h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  ABS is temperature-sensitive and demands an enclosed build chamber at 35–50°C ambient. Use minimal fan (0–20%) to prevent layer splitting. Bed temperature must be 90–110°C for proper adhesion. ABS slurry (dissolved ABS in acetone) on a glass bed provides excellent first-layer grip.
                </p>
              </div>

              <div className="rounded-lg border border-border p-5 bg-card/50">
                <h3 className="font-semibold text-foreground mb-2">
                  <Link to="/filaments/tpu" className="text-primary hover:underline">TPU</Link> — 220–250°C
                </h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  TPU prints slowly (20–40mm/s) and requires a direct drive extruder for reliable feeding. Use 220–235°C for 95A shore hardness; softer variants (85A) need higher temps. Disable or minimize retraction to prevent filament buckling. Bed temperature of 40–60°C provides gentle adhesion without parts sticking permanently.
                </p>
              </div>
            </div>
          </section>

          {/* How to Dial In Temperature */}
          <section>
            <h2 className="text-2xl font-bold mb-4">How to Dial In Your Temperature Settings</h2>
            <div className="space-y-4">
              {HOW_TO_STEPS.map((step, i) => (
                <div key={step.name} className="flex gap-4">
                  <div className="w-8 h-8 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center text-primary font-bold text-sm shrink-0 mt-0.5">
                    {i + 1}
                  </div>
                  <div>
                    <h3 className="font-semibold mb-1">{step.name}</h3>
                    <p className="text-sm text-muted-foreground">{step.text}</p>
                  </div>
                </div>
              ))}
            </div>

            <Card className="mt-6 border-primary/20 bg-primary/5">
              <CardContent className="p-4 flex gap-3 items-start">
                <AlertTriangle className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium mb-1">Brand matters — don't assume one PLA equals another</p>
                  <p className="text-sm text-muted-foreground">
                    Two "PLA" filaments from different brands can differ by 15°C in optimal temperature.
                    Always start with the label and run a temperature tower for any new brand or color.
                    Our <Link to="/filaments/pla" className="text-primary hover:underline">filament catalog</Link> shows
                    the documented temperature range for each product, or use the <Link to="/compare" className="text-primary hover:underline">comparison tool</Link> to check settings side by side.
                  </p>
                </div>
              </CardContent>
            </Card>
          </section>

          {/* Related Links */}
          <section className="bg-muted/30 rounded-xl p-6 border border-border">
            <h2 className="text-lg font-semibold mb-4">Related Guides & Tools</h2>
            <div className="grid sm:grid-cols-2 gap-3">
              {[
                { to: '/filaments', label: 'Browse all filaments on FilaScope' },
                { to: '/matrix', label: 'Printer–Filament Compatibility Matrix' },
                { to: '/compare', label: 'Compare filaments side by side' },
                { to: '/guides/how-to-choose-3d-printer-filament', label: 'How to Choose 3D Printer Filament' },
                { to: '/guides/pla-vs-petg', label: 'PLA vs PETG Comparison' },
                { to: '/guides/best-pla-filaments', label: 'Best PLA Filaments 2026' },
                { to: '/guides/3d-printer-filament-types-explained', label: 'Filament Types Explained' },
              ].map((link) => (
                <Link key={link.to} to={link.to} className="flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors">
                  <ArrowRight className="w-3.5 h-3.5 text-primary shrink-0" />
                  {link.label}
                </Link>
              ))}
            </div>
          </section>

          {/* FAQ */}
          <section className="border-t border-border pt-8">
            <h2 className="text-xl font-semibold mb-6">Frequently Asked Questions</h2>
            <Accordion type="single" collapsible className="space-y-2">
              {FAQS.map((faq, i) => (
                <AccordionItem
                  key={i}
                  value={`faq-${i}`}
                  className="border border-border rounded-lg px-4 bg-card"
                >
                  <AccordionTrigger className="text-left font-medium py-4 hover:no-underline">
                    {faq.question}
                  </AccordionTrigger>
                  <AccordionContent className="text-muted-foreground pb-4 leading-relaxed">
                    {faq.answer}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </section>
        </div>
      </div>
    </>
  );
}
