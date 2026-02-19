import { Link } from 'react-router-dom';
import { DocumentHead } from '@/components/seo/DocumentHead';
import { BreadcrumbSchema, ArticleSchema, FAQSection, HowToSchema } from '@/components/seo';
import { Breadcrumbs } from '@/components/seo/Breadcrumbs';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { AlertTriangle, ArrowRight, ThumbsUp, ThumbsDown } from 'lucide-react';

const TEMP_TABLE = [
  { material: 'PLA', nozzle: '190–220°C', bed: '50–60°C', fan: '100%', enclosure: 'No', difficulty: 'Beginner', link: '/materials/pla' },
  { material: 'PLA+', nozzle: '205–230°C', bed: '55–65°C', fan: '80–100%', enclosure: 'No', difficulty: 'Beginner', link: '/filaments/pla-plus' },
  { material: 'Silk PLA', nozzle: '210–230°C', bed: '55–65°C', fan: '100%', enclosure: 'No', difficulty: 'Beginner', link: '/filaments/silk-pla' },
  { material: 'PETG', nozzle: '230–250°C', bed: '70–85°C', fan: '30–50%', enclosure: 'Optional', difficulty: 'Intermediate', link: '/materials/petg' },
  { material: 'ABS', nozzle: '230–260°C', bed: '90–110°C', fan: '0–20%', enclosure: 'Required', difficulty: 'Advanced', link: '/materials/abs' },
  { material: 'ASA', nozzle: '240–265°C', bed: '90–110°C', fan: '0–20%', enclosure: 'Required', difficulty: 'Advanced', link: '/materials/asa' },
  { material: 'TPU (95A)', nozzle: '210–235°C', bed: '30–60°C', fan: '50%', enclosure: 'No', difficulty: 'Intermediate', link: '/materials/tpu' },
  { material: 'Nylon (PA)', nozzle: '240–270°C', bed: '70–90°C', fan: '30–50%', enclosure: 'Recommended', difficulty: 'Advanced', link: '/materials/nylon' },
  { material: 'PC', nozzle: '260–310°C', bed: '100–120°C', fan: '0–30%', enclosure: 'Required', difficulty: 'Expert', link: null },
  { material: 'PETG-CF', nozzle: '240–260°C', bed: '70–85°C', fan: '20–40%', enclosure: 'Optional', difficulty: 'Intermediate', link: '/filaments/petg-cf' },
  { material: 'PLA-CF', nozzle: '200–220°C', bed: '50–60°C', fan: '100%', enclosure: 'No', difficulty: 'Beginner', link: null },
  { material: 'High Speed PLA', nozzle: '200–230°C', bed: '55–65°C', fan: '100%', enclosure: 'No', difficulty: 'Beginner', link: '/filaments/high-speed-pla' },
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
    answer: 'Yes. Even the same material type can vary 10–15°C between brands. Always start with the temperature range printed on the spool label, then use a temperature tower to fine-tune. Our filament detail pages show the documented temperature range for each specific product.',
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
  return (
    <>
      <DocumentHead
        title="Filament Temperature Guide 2026 — PLA, PETG, ABS & More | FilaScope"
        description="Complete 3D printer filament temperature chart. Nozzle and bed temperatures for PLA, PETG, ABS, ASA, TPU, Nylon, PC and more. Includes print speed and enclosure requirements."
        ogTitle="3D Printer Filament Temperature Guide — Every Material"
        ogDescription="Comprehensive temperature chart for PLA, PETG, ABS, ASA, TPU, Nylon, PC and more. Includes enclosure and fan requirements."
      />
      <ArticleSchema
        headline="3D Printer Filament Temperature Guide — Every Material"
        description="Complete 3D printer filament temperature chart. Nozzle and bed temperatures for PLA, PETG, ABS, ASA, TPU, Nylon, PC and more."
        datePublished="2026-02-19"
        dateModified="2026-02-19"
        url="/filament-temperature-guide"
      />
      <BreadcrumbSchema items={[
        { name: 'Home', url: 'https://filascope.com/' },
        { name: 'Guides', url: 'https://filascope.com/learn' },
        { name: 'Filament Temperature Guide', url: 'https://filascope.com/filament-temperature-guide' },
      ]} />
      <HowToSchema
        name="How to Find the Right 3D Printing Temperature for Any Filament"
        description="A step-by-step process for dialing in the optimal nozzle and bed temperature for any 3D printing filament."
        totalTime="PT30M"
        steps={HOW_TO_STEPS}
      />

      <div className="min-h-screen bg-background">
        <div className="max-w-4xl mx-auto px-4 py-6">
          <Breadcrumbs items={[
            { name: 'Guides', url: '/learn' },
            { name: 'Filament Temperature Guide', url: '/filament-temperature-guide' },
          ]} />
        </div>

        {/* Hero */}
        <section className="bg-gradient-to-b from-primary/5 to-transparent py-12 px-4">
          <div className="max-w-4xl mx-auto">
            <Badge className="mb-4 bg-primary/10 text-primary border-primary/20">Reference Guide · Updated Feb 2026</Badge>
            <h1 className="text-3xl md:text-4xl font-bold mb-4 text-foreground">
              3D Printer Filament Temperature Guide — Every Material
            </h1>
            <p className="text-lg text-muted-foreground leading-relaxed max-w-2xl">
              The definitive temperature reference for every common 3D printing filament. Find nozzle and bed temperatures,
              fan speeds, enclosure requirements, and difficulty ratings for PLA, PETG, ABS, ASA, TPU, Nylon, PC, and more.
            </p>
          </div>
        </section>

        <div className="max-w-4xl mx-auto px-4 py-10 space-y-14">

          {/* Temperature Table */}
          <section>
            <h2 className="text-2xl font-bold mb-2">Complete Filament Temperature Chart</h2>
            <p className="text-muted-foreground text-sm mb-4">
              These are typical ranges. Always start with the temperature printed on your spool label — values vary between brands.
            </p>
            <Card className="border-border overflow-hidden">
              <CardContent className="p-0 overflow-x-auto">
                <table className="w-full text-sm min-w-[640px]">
                  <thead>
                    <tr className="border-b border-border bg-muted/30">
                      <th className="text-left p-3 font-semibold">Material</th>
                      <th className="text-left p-3 font-semibold">Nozzle Temp</th>
                      <th className="text-left p-3 font-semibold">Bed Temp</th>
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

          {/* Temperature Problems */}
          <section>
            <h2 className="text-2xl font-bold mb-6">What Happens When Temperature Is Wrong?</h2>
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

          {/* Dialing In Temps */}
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
                    the documented temperature range for each product.
                  </p>
                </div>
              </CardContent>
            </Card>
          </section>

          {/* Material Deep Dives */}
          <section>
            <h2 className="text-2xl font-bold mb-4">Temperature Settings by Material — Deep Dives</h2>
            <div className="grid sm:grid-cols-2 gap-3">
              {[
                { to: '/materials/pla', label: 'PLA Temperature Guide' },
                { to: '/materials/petg', label: 'PETG Temperature Guide' },
                { to: '/materials/abs', label: 'ABS Temperature & Enclosure' },
                { to: '/materials/asa', label: 'ASA Temperature Guide' },
                { to: '/materials/tpu', label: 'TPU Flexible Print Settings' },
                { to: '/materials/nylon', label: 'Nylon (PA) Temperature Guide' },
              ].map((link) => (
                <Link key={link.to} to={link.to} className="flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors border border-border rounded-lg px-4 py-3 hover:border-primary/50 bg-card/50">
                  <ArrowRight className="w-3.5 h-3.5 text-primary shrink-0" />
                  {link.label}
                </Link>
              ))}
            </div>
          </section>

          {/* Related Links */}
          <section className="bg-muted/30 rounded-xl p-6 border border-border">
            <h2 className="text-lg font-semibold mb-4">Related Guides</h2>
            <div className="grid sm:grid-cols-2 gap-3">
              {[
                { to: '/best-filaments-for-beginners', label: 'Best Filaments for Beginners' },
                { to: '/filament-storage-guide', label: 'Filament Storage & Drying Guide' },
                { to: '/diagnose', label: 'Diagnose My Print Problem' },
                { to: '/pla-vs-petg', label: 'PLA vs PETG Comparison' },
              ].map((link) => (
                <Link key={link.to} to={link.to} className="flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors">
                  <ArrowRight className="w-3.5 h-3.5 text-primary shrink-0" />
                  {link.label}
                </Link>
              ))}
            </div>
          </section>

          <FAQSection
            faqs={FAQS}
            title="Filament Temperature — Frequently Asked Questions"
          />
        </div>
      </div>
    </>
  );
}
