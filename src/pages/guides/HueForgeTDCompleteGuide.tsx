import { Link } from 'react-router-dom';
import { DocumentHead } from '@/components/seo/DocumentHead';
import { ArticleSchema, HowToSchema, FAQSection } from '@/components/seo';
import { Breadcrumbs } from '@/components/seo/Breadcrumbs';
import { RelatedContentBlock } from '@/components/seo/RelatedContentBlock';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Sun, ArrowRight, Layers, Lightbulb, Target, Ruler, BookOpen } from 'lucide-react';

const TD_RANGE_TABLE = [
  { range: '0.3 – 1.0', label: 'Jet Black / Ultra Opaque', desc: 'Near-perfect light blocker. Used as the bottom anchor layer in every HueForge stack. Carbon black and very dark pigments.', color: 'slate' },
  { range: '1.0 – 2.0', label: 'Opaque', desc: 'Dark colors, saturated reds/blues/greens. Strong color contribution with minimal light bleed-through.', color: 'slate' },
  { range: '2.0 – 3.5', label: 'Semi-Opaque', desc: 'Standard white PLA sweet spot for lithophane bases. Good contrast with controlled light transmission.', color: 'blue' },
  { range: '3.5 – 5.0', label: 'Semi-Translucent', desc: 'Light pastels, some white PETG. Used for lithophane detail layers and mid-stack color blending.', color: 'blue' },
  { range: '5.0 – 8.0', label: 'Translucent', desc: 'Natural/clear PLA, silk filaments. Strong light transmission for highlight and glow effects.', color: 'purple' },
  { range: '8.0 – 15.0+', label: 'Highly Translucent', desc: 'Glow-in-the-dark, clear PETG, specialty transparent filaments. Maximum light pass-through.', color: 'purple' },
];

const MATERIAL_TD_RANGES = [
  { material: 'Black PLA', td: '0.3 – 1.0', count: '~400+', role: 'Anchor layer' },
  { material: 'White PLA', td: '1.5 – 4.0', count: '~500+', role: 'Base / lithophane' },
  { material: 'Colored PLA', td: '1.0 – 4.5', count: '~3,000+', role: 'Color layers' },
  { material: 'Silk PLA', td: '4.0 – 9.0', count: '~600+', role: 'Highlight / sheen' },
  { material: 'Matte PLA', td: '1.0 – 3.5', count: '~400+', role: 'Diffused layers' },
  { material: 'Natural PLA', td: '4.0 – 8.0', count: '~100+', role: 'Translucent base' },
  { material: 'White PETG', td: '2.0 – 5.0', count: '~200+', role: 'Alternative base' },
  { material: 'Glow PLA', td: '6.0 – 15.0', count: '~50+', role: 'Special effects' },
  { material: 'Clear PETG', td: '8.0 – 15.0+', count: '~80+', role: 'Backlit effects' },
];

const HOW_TO_STEPS = [
  { name: 'Understand Your Project Type', text: 'Determine whether you are printing a HueForge lithophane, a multicolor image stack, or a standard 3D print. TD only matters for light-transmission projects.' },
  { name: 'Identify the Role of Each Layer', text: 'In a typical HueForge stack: bottom layer = black anchor (TD 0.3–1.0), middle layers = colored detail (TD 1.0–4.0), top layer = white base (TD 2.0–4.0 for lithophanes).' },
  { name: 'Search the FilaScope TD Database', text: 'Look up your specific filament\'s measured TD value in the FilaScope HueForge TD Database. Filter by brand, color family, or material type.' },
  { name: 'Match TD to Your Layer Needs', text: 'Ensure each filament in your stack has the right TD for its intended role. A white base with TD 5.0+ will be too translucent for standard lithophanes — aim for 2.0–3.5.' },
  { name: 'Calibrate with Test Prints', text: 'Print a small test section of your design before committing to a full print. Adjust layer counts in HueForge if the contrast is too strong or too weak.' },
];

const FAQS = [
  {
    question: 'What does TD stand for in 3D printing?',
    answer: 'TD stands for Transmissivity Distance (also called Transmission Distance). It measures how far light can travel through a wall of 3D-printed filament (in millimeters) before being fully blocked. A TD of 2.0 means a 2mm-thick wall of that filament will block all light. The term was standardized by the HueForge software team for lithophane printing.',
  },
  {
    question: 'How is TD different from opacity or translucency?',
    answer: 'Opacity and translucency are qualitative descriptions. TD is a quantitative measurement in millimeters that precisely describes the same property. A filament with TD 1.0 is very opaque; TD 8.0 is very translucent. HueForge requires exact TD values (not vague "opaque" or "translucent") to calculate correct layer profiles for lithophane printing.',
  },
  {
    question: 'What is a good TD value for HueForge lithophanes?',
    answer: 'For the white or natural base layer of a backlit lithophane, aim for TD 2.0–3.5. Lower TD (1.5–2.5) produces stronger contrast — better for outdoor or high-ambient-light display. Higher TD (3.0–4.5) allows more light through — better for LED-backlit displays. Black anchor layers should always be TD below 1.0. Most HueForge projects use filaments across the full TD spectrum.',
  },
  {
    question: 'Can I use the same TD value for different colors of the same filament?',
    answer: 'No. TD varies dramatically by color, even within the same brand and material line. A black PLA from Brand X might have TD 0.5, while the same brand\'s white PLA could be TD 3.0. Each color has its own pigment formulation that affects light absorption and scattering. Always look up the specific color you\'re using, not just the brand or material.',
  },
  {
    question: 'Where can I find TD values for my filaments?',
    answer: 'FilaScope maintains the largest public HueForge TD database with verified measurements for hundreds of filaments from 57+ brands. Search by brand, color, or material at filascope.com/hueforge-td-database. You can also find TD values in the HueForge community library built into the software, or measure your own using a calibration wall test.',
  },
  {
    question: 'Does layer height affect TD values?',
    answer: 'Yes. TD values in FilaScope\'s database and the HueForge standard are measured at 0.2mm layer height. Printing at different layer heights (0.12mm, 0.16mm, 0.28mm) changes the effective opacity per layer, which means the same filament behaves differently at different layer heights. HueForge handles this internally when you set your layer height in the software.',
  },
  {
    question: 'What is the lowest possible TD value?',
    answer: 'The lowest practical TD value is around 0.3mm, achieved by jet black PLA with high carbon black pigment concentration. At TD 0.3, even a single 0.2mm layer blocks most light. True zero TD is not achievable with FDM printing — even the darkest filaments transmit a tiny amount of light through microscopic gaps between extrusion lines.',
  },
];

export default function HueForgeTDCompleteGuide() {
  const canonicalUrl = 'https://filascope.com/guides/hueforge-td-complete-guide';

  return (
    <>
      <DocumentHead
        title="HueForge TD Values: Complete Guide to Transmissivity Distance | FilaScope"
        description="Everything about HueForge Transmissivity Distance (TD) values: what they mean, how they're measured, TD ranges by material, and how to use TD for perfect lithophanes."
        ogTitle="HueForge TD Values: The Complete Guide"
        ogDescription="Master Transmissivity Distance (TD) for HueForge lithophanes. Understand TD ranges, find your filament's TD, and get perfect prints every time."
      />
      <ArticleSchema
        headline="HueForge TD Values: Complete Guide to Transmissivity Distance"
        description="Everything about HueForge Transmissivity Distance (TD) values: what they mean, how they're measured, TD ranges by material, and how to use TD for perfect lithophanes."
        datePublished="2026-05-11"
        dateModified="2026-05-25"
        url="/guides/hueforge-td-complete-guide"
        articleType="TechArticle"
        about={{ '@type': 'Thing', name: 'HueForge Transmissivity Distance' }}
        proficiencyLevel="Beginner"
      />
      <HowToSchema
        name="How to Use TD Values in HueForge"
        description="A step-by-step guide to selecting and applying Transmissivity Distance (TD) values for HueForge lithophane and multicolor printing projects."
        totalTime="PT30M"
        steps={HOW_TO_STEPS}
      />

      <div className="min-h-screen bg-background">
        <div className="max-w-4xl mx-auto px-4 py-6">
          <Breadcrumbs items={[
            { name: 'Guides', url: '/guides' },
            { name: 'HueForge TD Complete Guide', url: '/guides/hueforge-td-complete-guide' },
          ]} />
        </div>

        {/* Hero */}
        <section className="bg-gradient-to-b from-purple-500/5 to-transparent py-12 px-4">
          <div className="max-w-4xl mx-auto">
            <Badge className="mb-4 bg-purple-500/10 text-purple-400 border-purple-500/20">
              <Sun className="w-3 h-3 mr-1" />
              HueForge Guide · Updated May 2026
            </Badge>
            <h1 className="text-3xl md:text-4xl font-bold mb-4 text-foreground">
              HueForge TD Values: The Complete Guide to Transmissivity Distance
            </h1>
            <p className="text-lg text-muted-foreground leading-relaxed max-w-2xl">
              Transmissivity Distance (TD) is the key to perfect HueForge lithophanes. This comprehensive guide
              covers everything from the basics of TD to advanced layer-stack optimization, with data from our
              database of 500+ measured filaments.
            </p>
            <div className="flex flex-wrap gap-3 mt-4">
              <Link to="/hueforge-td-database" className="inline-flex items-center gap-1.5 text-sm text-purple-400 hover:text-purple-300 transition-colors">
                <Sun className="w-4 h-4" />Search TD Database<ArrowRight className="w-3.5 h-3.5" />
              </Link>
              <Link to="/guides/how-to-measure-filament-td" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors">
                Measure Your Own TD<ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        </section>

        <div className="max-w-4xl mx-auto px-4 py-10 space-y-14">

          {/* AI Snippet Zone */}
          <section aria-label="Quick Summary" className="bg-muted/30 border border-border/40 rounded-lg px-5 py-4">
            <p className="text-sm text-muted-foreground leading-relaxed">
              <strong className="text-foreground">Transmissivity Distance (TD)</strong> in HueForge measures how many
              millimeters of printed filament are needed to fully block light. TD values range from 0.3 (jet black,
              nearly opaque) to 15+ (clear/glow filaments, highly translucent). For HueForge lithophanes, use
              TD 0.3–1.0 for black anchors, TD 2.0–3.5 for white bases, and TD 1.0–4.0 for colored detail layers.
              FilaScope maintains verified TD values for 500+ filaments.
            </p>
            <p className="sr-only">
              Summary: TD (Transmissivity Distance) measures light-blocking capacity of 3D printer filament in
              millimeters. Lower TD = more opaque. Higher TD = more translucent. HueForge uses TD values to
              calculate layer profiles for lithophane and multicolor prints. Search verified TD values at
              filascope.com/hueforge-td-database.
            </p>
          </section>

          {/* What Is TD */}
          <section>
            <h2 className="text-2xl font-bold mb-4">What Is Transmissivity Distance (TD)?</h2>
            <div className="text-muted-foreground space-y-4 text-sm leading-relaxed">
              <p>
                Transmissivity Distance — abbreviated as <strong className="text-foreground">TD</strong> — is a
                numerical measurement that describes how translucent or opaque a 3D-printed filament is at standard
                layer height. Specifically, TD represents the wall thickness (in millimeters) at which printed
                filament transitions from transmitting light to fully blocking it.
              </p>
              <p>
                The concept was standardized by the HueForge software team as a way to mathematically model
                how each filament in a multi-color layer stack contributes to the final image. Without accurate
                TD values, HueForge cannot calculate the correct number of layers for each color, resulting in
                lithophanes that are too bright, too dark, or washed out.
              </p>
              <Card className="border-purple-500/20 bg-purple-500/5">
                <CardContent className="p-4 flex gap-3 items-start">
                  <Sun className="w-5 h-5 text-purple-400 shrink-0 mt-0.5" />
                  <p className="text-sm text-muted-foreground">
                    <strong className="text-foreground">Key insight:</strong> TD is measured at 0.2mm layer height — the
                    HueForge standard. A filament's effective opacity per layer changes if you print at 0.12mm or 0.28mm.
                    HueForge compensates for this internally when you set your layer height in the software.
                  </p>
                </CardContent>
              </Card>
            </div>
          </section>

          {/* TD Range Breakdown */}
          <section>
            <h2 className="text-2xl font-bold mb-4">Complete TD Range Breakdown</h2>
            <p className="text-muted-foreground text-sm mb-4">
              Every filament falls somewhere on the TD spectrum. Here's what each range means and how it's used in HueForge projects:
            </p>
            <Card className="border-border overflow-hidden">
              <CardContent className="p-0 overflow-x-auto">
                <table className="w-full text-sm min-w-[540px]">
                  <thead>
                    <tr className="border-b border-border bg-muted/30">
                      <th className="text-left p-3 font-semibold">TD Range</th>
                      <th className="text-left p-3 font-semibold">Classification</th>
                      <th className="text-left p-3 font-semibold">Description & Use</th>
                    </tr>
                  </thead>
                  <tbody>
                    {TD_RANGE_TABLE.map((row) => (
                      <tr key={row.range} className="border-b border-border last:border-0 hover:bg-muted/20 transition-colors">
                        <td className="p-3 font-mono text-xs font-medium text-purple-400">{row.range}</td>
                        <td className="p-3">
                          <Badge
                            variant="outline"
                            className={
                              row.color === 'slate'
                                ? 'bg-slate-500/10 text-slate-400 border-slate-500/20 text-xs'
                                : row.color === 'blue'
                                ? 'bg-blue-500/10 text-blue-400 border-blue-500/20 text-xs'
                                : 'bg-purple-500/10 text-purple-400 border-purple-500/20 text-xs'
                            }
                          >
                            {row.label}
                          </Badge>
                        </td>
                        <td className="p-3 text-muted-foreground text-xs">{row.desc}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </CardContent>
            </Card>
          </section>

          {/* TD by Material */}
          <section>
            <h2 className="text-2xl font-bold mb-4">TD Values by Material Type</h2>
            <p className="text-muted-foreground text-sm mb-4">
              Based on data from FilaScope's database of 500+ measured filaments. Actual values vary by brand and color.
            </p>
            <Card className="border-border overflow-hidden">
              <CardContent className="p-0 overflow-x-auto">
                <table className="w-full text-sm min-w-[500px]">
                  <thead>
                    <tr className="border-b border-border bg-muted/30">
                      <th className="text-left p-3 font-semibold">Material / Color</th>
                      <th className="text-left p-3 font-semibold">Typical TD Range</th>
                      <th className="text-left p-3 font-semibold">Database Count</th>
                      <th className="text-left p-3 font-semibold">HueForge Role</th>
                    </tr>
                  </thead>
                  <tbody>
                    {MATERIAL_TD_RANGES.map((row) => (
                      <tr key={row.material} className="border-b border-border last:border-0 hover:bg-muted/20 transition-colors">
                        <td className="p-3 font-medium text-sm">{row.material}</td>
                        <td className="p-3 font-mono text-xs text-purple-400">{row.td}</td>
                        <td className="p-3 text-muted-foreground text-xs">{row.count}</td>
                        <td className="p-3 text-muted-foreground text-xs">{row.role}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </CardContent>
            </Card>
            <p className="text-xs text-muted-foreground mt-2">
              For exact values for specific products, search the{' '}
              <Link to="/hueforge-td-database" className="text-purple-400 hover:text-purple-300">FilaScope TD Database</Link>.
            </p>
          </section>

          {/* How TD Affects Lithophanes */}
          <section>
            <h2 className="text-2xl font-bold mb-4">How TD Values Affect Lithophane Quality</h2>
            <div className="text-muted-foreground space-y-4 text-sm leading-relaxed">
              <p>
                In a HueForge lithophane, the software uses TD values to calculate exactly how many layers of each
                filament to print at every point in the image. The white base layer transmits backlight, while darker
                layers printed on top absorb progressively more light, creating the visible image.
              </p>
              <p>
                If your white base TD is too high (too translucent), highlights wash out and the image appears
                overexposed. If the TD is too low (too opaque), not enough light gets through and the image is
                uniformly dark with no detail in shadow areas.
              </p>
              <div className="grid sm:grid-cols-3 gap-4">
                {[
                  { title: 'Outdoor Display', tdLabel: 'White base: TD 1.5–2.5', desc: 'Higher ambient light means you need a more opaque base to maintain contrast. Lower TD white filaments work best.' },
                  { title: 'LED Backlit', tdLabel: 'White base: TD 2.5–3.5', desc: 'Standard backlit display with moderate light source. The most common setup for HueForge lithophanes.' },
                  { title: 'Window / Sunlit', tdLabel: 'White base: TD 3.0–4.5', desc: 'Very bright light source allows higher TD bases. More light transmission creates nuanced gradients.' },
                ].map(({ title, tdLabel, desc }) => (
                  <div key={title} className="rounded-lg border border-border bg-card p-4">
                    <h3 className="font-semibold mb-1 text-sm">{title}</h3>
                    <Badge className="mb-2 bg-purple-500/10 text-purple-400 border-purple-500/20 text-xs">{tdLabel}</Badge>
                    <p className="text-xs text-muted-foreground leading-relaxed">{desc}</p>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* How to Find TD */}
          <section>
            <h2 className="text-2xl font-bold mb-4">How to Find Your Filament's TD Value</h2>
            <div className="space-y-4">
              {[
                {
                  icon: Target,
                  title: '1. Search the FilaScope TD Database',
                  desc: 'The fastest way. FilaScope maintains the largest public HueForge TD database with verified measurements for 500+ filaments from 57+ brands. Search by brand, color, or material.',
                  link: { to: '/hueforge-td-database', label: 'Search TD Database →' },
                },
                {
                  icon: Layers,
                  title: '2. Check HueForge\'s Built-In Library',
                  desc: 'HueForge includes a community-submitted filament library. Search by brand and product name inside the app. Values are validated by the HueForge community.',
                },
                {
                  icon: Ruler,
                  title: '3. Measure It Yourself',
                  desc: 'Print calibration walls at 1mm, 2mm, 3mm, 4mm, 6mm, and 8mm thickness. Hold to a bright light in a dim room. The thickness where light is fully blocked = your TD.',
                  link: { to: '/guides/how-to-measure-filament-td', label: 'TD Measurement Guide →' },
                },
              ].map(({ icon: Icon, title, desc, link }) => (
                <div key={title} className="flex gap-4 p-4 rounded-lg border border-border bg-card/50">
                  <div className="w-8 h-8 rounded-full bg-purple-500/10 border border-purple-500/20 flex items-center justify-center shrink-0 mt-0.5">
                    <Icon className="w-4 h-4 text-purple-400" />
                  </div>
                  <div>
                    <h3 className="font-semibold mb-1 text-sm">{title}</h3>
                    <p className="text-sm text-muted-foreground mb-2">{desc}</p>
                    {link && (
                      <Link to={link.to} className="inline-flex items-center gap-1 text-xs text-purple-400 hover:text-purple-300 transition-colors">
                        {link.label}
                      </Link>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* How to Use TD Step by Step */}
          <section>
            <h2 className="text-2xl font-bold mb-4">How to Use TD Values in Your Projects — Step by Step</h2>
            <div className="space-y-4">
              {HOW_TO_STEPS.map((step, i) => (
                <div key={step.name} className="flex gap-4">
                  <div className="w-8 h-8 rounded-full bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400 font-bold text-sm shrink-0 mt-0.5">
                    {i + 1}
                  </div>
                  <div>
                    <h3 className="font-semibold mb-1 text-sm">{step.name}</h3>
                    <p className="text-sm text-muted-foreground">{step.text}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* TD Mistakes */}
          <section>
            <h2 className="text-2xl font-bold mb-4">Common TD Mistakes (and How to Avoid Them)</h2>
            <div className="grid sm:grid-cols-2 gap-4">
              {[
                { mistake: 'Using generic TD for "white PLA"', fix: 'Every white PLA has a different TD. Bambu Lab White PLA might be TD 2.8 while Polymaker White PLA is TD 3.4. Always check the specific product.' },
                { mistake: 'Measuring at wrong layer height', fix: 'TD values in FilaScope\'s database are standardized to 0.2mm layer height. Measure at 0.2mm for values that match the database and HueForge.' },
                { mistake: 'Ignoring batch-to-batch variation', fix: 'Filament manufacturers can change pigment formulations. If your results seem off, re-measure with the current batch.' },
                { mistake: 'Using silk PLA as a base layer', fix: 'Silk PLA has high TD (5.0–9.0) and creates washed-out lithophanes. Use silk for highlight layers only, never as a lithophane base.' },
              ].map(({ mistake, fix }) => (
                <div key={mistake} className="p-4 rounded-lg border border-border bg-card/50">
                  <p className="font-semibold text-sm text-destructive mb-1">✗ {mistake}</p>
                  <p className="text-xs text-muted-foreground"><strong className="text-foreground">Fix:</strong> {fix}</p>
                </div>
              ))}
            </div>
          </section>

          <FAQSection
            faqs={FAQS}
            title="HueForge TD Values — Frequently Asked Questions"
          />

          <RelatedContentBlock
            title="Related HueForge Resources"
            links={[
              { label: 'HueForge TD Database', href: '/hueforge-td-database', description: 'Search verified TD values for 500+ filaments' },
              { label: 'Best White Filaments for HueForge', href: '/guides/best-white-filaments-for-hueforge', description: 'TD-ranked white filament picks for lithophanes' },
              { label: 'Best Filaments for HueForge', href: '/guides/best-filaments-for-hueforge', description: 'TD-ranked picks across all colors' },
              { label: 'How to Measure Filament TD', href: '/guides/how-to-measure-filament-td', description: 'Step-by-step calibration and measurement guide' },
              { label: 'What Is HueForge TD?', href: '/guides/what-is-hueforge-td', description: 'Beginner-friendly TD introduction' },
              { label: 'Browse All Colors', href: '/colors', description: 'Find filaments by color with TD data' },
            ]}
          />
        </div>
      </div>
    </>
  );
}
