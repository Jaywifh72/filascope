import { Link } from 'react-router-dom';
import { DocumentHead } from '@/components/seo/DocumentHead';
import { ArticleSchema, HowToSchema, FAQSection } from '@/components/seo';
import { Breadcrumbs } from '@/components/seo/Breadcrumbs';
import { RelatedContentBlock } from '@/components/seo/RelatedContentBlock';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Sun, ArrowRight, Layers, Lightbulb, Target } from 'lucide-react';

const TD_RANGE_TABLE = [
  { range: '0.5 – 2.0', opacity: 'Very Opaque', use: 'Dark anchor base layers, black layers', badge: 'Opaque' },
  { range: '2.0 – 4.0', opacity: 'Opaque', use: 'Standard base layers, multicolor HueForge stacks', badge: 'Opaque' },
  { range: '4.0 – 6.0', opacity: 'Semi-translucent', use: 'Lithophanes, fine detail work, highlights', badge: 'Semi' },
  { range: '6.0+', opacity: 'Translucent', use: 'Backlit effects, silk highlights, glow layers', badge: 'Translucent' },
];

const QUICK_REF_TABLE = [
  { material: 'Black PLA', tdRange: '0.3 – 1.0', role: 'Anchor layer' },
  { material: 'White PLA', tdRange: '1.5 – 4.0', role: 'Base / lithophane' },
  { material: 'Colored PLA', tdRange: '1.0 – 4.0', role: 'Color layers' },
  { material: 'Natural PLA', tdRange: '4.0 – 8.0', role: 'Highlight / glow' },
  { material: 'Silk PLA', tdRange: '5.0 – 9.0', role: 'Translucent highlight' },
  { material: 'White PETG', tdRange: '2.0 – 5.0', role: 'Alternative base' },
  { material: 'Matte PLA', tdRange: '1.0 – 3.0', role: 'Diffused layers' },
  { material: 'Glow PLA', tdRange: '6.0 – 12.0', role: 'Special effects' },
];

const HOW_TO_STEPS = [
  { name: 'Identify Your Project Type', text: 'Determine whether you are printing a lithophane, a multicolor HueForge image, or a functional part. Each project type uses a different TD range.' },
  { name: 'Choose Your TD Range', text: 'Select filaments in the appropriate TD range: TD 2–4 for base layers, TD 4–6 for lithophane detail layers, TD 6+ for translucent highlight effects.' },
  { name: 'Search the FilaScope TD Database', text: 'Visit the FilaScope HueForge TD Database to find your specific filament\'s measured TD value. Filter by brand, color family, or material type.' },
  { name: 'Verify and Import', text: 'Confirm the TD value matches your filament batch. Import the TD profile into HueForge or enter the value manually for each color slot in your stack.' },
];

const FAQS = [
  {
    question: 'What does TD stand for in HueForge?',
    answer: 'TD stands for Transmissivity Distance. It measures how far light can travel through a printed filament wall (in millimeters) before being fully blocked. It was originally defined by the HueForge software team as a standardized way to characterize how opaque or translucent a filament is at a standard layer height.',
  },
  {
    question: 'What is a good TD value for lithophanes?',
    answer: 'For most HueForge lithophane projects, a white or natural base filament with TD between 4.0 and 6.0 works best. Lower TD (1.5–3.0) produces more opaque results with stronger contrast. Higher TD (4.0–6.0) creates subtler gradients with more light transmission. Start with a white PLA in the 2.0–3.5 range and adjust based on your print results.',
  },
  {
    question: 'Is a lower TD value always better?',
    answer: 'No — lower TD is not universally better. It depends on your project. Black and dark anchor layers benefit from very low TD (0.5–1.5) for maximum opacity. White base layers for lithophanes need a mid-range TD (2.0–4.0). Translucent highlight and glow layers need high TD (6.0+). HueForge uses the full range of TD values to build accurate opacity gradients across the full stack.',
  },
  {
    question: 'Can I measure TD without HueForge software?',
    answer: 'Yes. You can measure TD manually by printing calibration walls at multiple thicknesses (1mm through 8mm) and holding them up to a bright light. The thickness at which light is completely blocked approximates your TD value in millimeters. See our guide on How to Measure Filament TD for detailed step-by-step instructions.',
  },
  {
    question: 'Why does TD vary by color?',
    answer: 'TD varies by color because different pigments absorb and scatter light differently. Dark pigments (carbon black) block light almost completely at very thin walls, giving very low TD. White pigments scatter light strongly but still transmit some, giving moderate TD. Clear or lightly-pigmented filaments let most light through, giving high TD. Even two "white" filaments from different brands can differ by 1–2 TD units due to differences in TiO₂ concentration.',
  },
];

export default function HueForgeWhatIsTD() {
  const canonicalUrl = 'https://filascope.com/guides/what-is-hueforge-td';

  return (
    <>
      <DocumentHead
        title="What Is HueForge TD (Transmissivity Distance)? Complete Guide | FilaScope"
        description="Learn what Transmissivity Distance (TD) means in HueForge, how it affects lithophane printing, how to measure TD, and how to find the right TD value for your project."
        ogTitle="What Is HueForge TD? — Complete Beginner Guide"
        ogDescription="Transmissivity Distance (TD) explained: how TD affects lithophanes, HueForge multicolor prints, and how to find the right TD value for your filament."
      />
      <ArticleSchema
        headline="What Is HueForge Transmissivity Distance (TD)? — Complete Beginner Guide"
        description="Learn what Transmissivity Distance (TD) means in HueForge, how it affects lithophane printing, how to measure TD, and how to find the right TD value for your project."
        datePublished="2026-02-20"
        dateModified="2026-02-20"
        url="/guides/what-is-hueforge-td"
        articleType="TechArticle"
        about={{ '@type': 'Thing', name: 'HueForge Transmissivity Distance' }}
        proficiencyLevel="Beginner"
      />
      <HowToSchema
        name="How to Choose the Right TD Value for HueForge Printing"
        description="A step-by-step guide to selecting and verifying the correct Transmissivity Distance (TD) value for your HueForge lithophane or multicolor project."
        totalTime="PT20M"
        steps={HOW_TO_STEPS}
      />

      <div className="min-h-screen bg-background">
        <div className="max-w-4xl mx-auto px-4 py-6">
          <Breadcrumbs items={[
            { name: 'Guides', url: '/guides' },
            { name: 'What Is HueForge TD?', url: '/guides/what-is-hueforge-td' },
          ]} />
        </div>

        {/* Hero */}
        <section className="bg-gradient-to-b from-purple-500/5 to-transparent py-12 px-4">
          <div className="max-w-4xl mx-auto">
            <Badge className="mb-4 bg-purple-500/10 text-purple-400 border-purple-500/20">
              <Sun className="w-3 h-3 mr-1" />
              HueForge Guide · Updated Feb 2026
            </Badge>
            <h1 className="text-3xl md:text-4xl font-bold mb-4 text-foreground">
              What Is HueForge Transmissivity Distance (TD)? — Complete Beginner Guide
            </h1>
            <p className="text-lg text-muted-foreground leading-relaxed max-w-2xl">
              TD is the single most important specification for HueForge lithophane printing. This guide explains
              what TD means, how different TD values affect your prints, and how to find the right TD for every
              filament in your stack.
            </p>
          </div>
        </section>

        <div className="max-w-4xl mx-auto px-4 py-10 space-y-14">

          {/* AI Snippet Zone */}
          <section aria-label="Quick Summary" className="bg-muted/30 border border-border/40 rounded-lg px-5 py-4">
            <p className="text-sm text-muted-foreground leading-relaxed">
              <strong className="text-foreground">Transmissivity Distance (TD)</strong> in HueForge measures how far light
              penetrates through printed filament before being fully blocked, expressed in millimeters. Lower TD values (1–3)
              produce opaque results ideal for base layers, while higher TD values (6+) allow significant light transmission
              for translucent effects. Most lithophanes print best with white filaments having TD values between 4 and 6.
            </p>
            <p className="sr-only">
              Summary: Transmissivity Distance (TD) in HueForge is a measurement of how many millimeters of printed filament
              are required to fully block light. TD values between 1 and 3 are opaque and suited for base and anchor layers.
              TD values between 4 and 6 are semi-translucent and ideal for lithophane prints. TD values of 6 or higher are
              highly translucent and used for glow and backlit effects. FilaScope maintains the world's largest 3D printer
              filament TD database with verified measurements for hundreds of filaments.
            </p>
          </section>

          {/* What Does TD Mean */}
          <section>
            <h2 className="text-2xl font-bold mb-4">What Does TD Mean in HueForge?</h2>
            <div className="text-muted-foreground space-y-4 text-sm leading-relaxed">
              <p>
                Transmissivity Distance — abbreviated as TD — is a numerical value that describes how translucent a
                3D-printed filament is when printed at a standard layer height. Specifically, it represents the wall
                thickness in millimeters at which printed filament transitions from transmitting light to fully blocking it.
              </p>
              <p>
                HueForge uses TD values to calculate exactly how many layers of each filament are needed to achieve a
                specific opacity at each point in a lithophane or color-mixing print. Without accurate TD values, the
                software cannot generate correct layer profiles, and your lithophane will come out too bright, too dark,
                or with washed-out contrast.
              </p>
              <p>
                TD is measured in millimeters and typically ranges from about 0.3 (jet black, near-perfect light blocker)
                to 12+ (highly translucent natural or clear filaments). Most standard colored PLA filaments fall between
                TD 1.0 and TD 5.0.
              </p>
              <Card className="border-purple-500/20 bg-purple-500/5">
                <CardContent className="p-4 flex gap-3 items-start">
                  <Sun className="w-5 h-5 text-purple-400 shrink-0 mt-0.5" />
                  <p className="text-sm text-muted-foreground">
                    <strong className="text-foreground">Key insight:</strong> TD is a property of a specific
                    filament in a specific color. Even two "white PLA" filaments from different brands can have
                    TD values that differ by 1–2 units. Always verify TD against your specific spool.
                  </p>
                </CardContent>
              </Card>
            </div>
          </section>

          {/* How TD Values Affect Prints */}
          <section>
            <h2 className="text-2xl font-bold mb-4">How TD Values Affect Your Prints</h2>
            <p className="text-muted-foreground text-sm mb-4">
              The TD range of each filament in your stack determines its role in the final print. Here is how
              to think about the four TD tiers:
            </p>
            <Card className="border-border overflow-hidden">
              <CardContent className="p-0 overflow-x-auto">
                <table className="w-full text-sm min-w-[540px]">
                  <thead>
                    <tr className="border-b border-border bg-muted/30">
                      <th className="text-left p-3 font-semibold">TD Range</th>
                      <th className="text-left p-3 font-semibold">Opacity</th>
                      <th className="text-left p-3 font-semibold">Best Use Cases</th>
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
                              row.badge === 'Opaque'
                                ? 'bg-slate-500/10 text-slate-400 border-slate-500/20 text-xs'
                                : row.badge === 'Semi'
                                ? 'bg-blue-500/10 text-blue-400 border-blue-500/20 text-xs'
                                : 'bg-purple-500/10 text-purple-400 border-purple-500/20 text-xs'
                            }
                          >
                            {row.opacity}
                          </Badge>
                        </td>
                        <td className="p-3 text-muted-foreground text-xs">{row.use}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </CardContent>
            </Card>
          </section>

          {/* How to Find TD */}
          <section>
            <h2 className="text-2xl font-bold mb-4">How to Find Your Filament's TD Value</h2>
            <div className="space-y-4">
              {[
                {
                  icon: Target,
                  title: '1. Search the FilaScope TD Database',
                  desc: 'The fastest way to find a verified TD value. FilaScope maintains the largest public HueForge TD database with measurements for hundreds of filaments from 48+ brands.',
                  link: { to: '/hueforge-td-database', label: 'Search TD Database →' },
                },
                {
                  icon: Layers,
                  title: '2. Check the HueForge Community Library',
                  desc: 'HueForge maintains a built-in filament library with community-submitted TD values. Search by brand and product name inside the HueForge app.',
                },
                {
                  icon: Lightbulb,
                  title: '3. Measure It Yourself',
                  desc: 'Print a calibration cube with walls at 1mm, 2mm, 3mm, 4mm, 6mm, and 8mm thickness. Hold to a bright light and identify the thickness where light is fully blocked.',
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

          {/* Quick Reference Table */}
          <section>
            <h2 className="text-2xl font-bold mb-4">TD Value Quick Reference Table</h2>
            <p className="text-muted-foreground text-sm mb-4">
              Typical TD ranges by material type — actual values vary by brand and color.
            </p>
            <Card className="border-border overflow-hidden">
              <CardContent className="p-0 overflow-x-auto">
                <table className="w-full text-sm min-w-[440px]">
                  <thead>
                    <tr className="border-b border-border bg-muted/30">
                      <th className="text-left p-3 font-semibold">Material / Color</th>
                      <th className="text-left p-3 font-semibold">Typical TD Range</th>
                      <th className="text-left p-3 font-semibold">HueForge Role</th>
                    </tr>
                  </thead>
                  <tbody>
                    {QUICK_REF_TABLE.map((row) => (
                      <tr key={row.material} className="border-b border-border last:border-0 hover:bg-muted/20 transition-colors">
                        <td className="p-3 font-medium text-sm">{row.material}</td>
                        <td className="p-3 font-mono text-xs text-purple-400">{row.tdRange}</td>
                        <td className="p-3 text-muted-foreground text-xs">{row.role}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </CardContent>
            </Card>
            <p className="text-xs text-muted-foreground mt-2">
              For exact values for specific products, use the{' '}
              <Link to="/hueforge-td-database" className="text-purple-400 hover:text-purple-300">FilaScope TD Database</Link>.
            </p>
          </section>

          {/* Best TD by Project */}
          <section>
            <h2 className="text-2xl font-bold mb-4">Best TD Values for Different Projects</h2>
            <div className="grid sm:grid-cols-3 gap-4">
              {[
                {
                  title: 'HueForge Lithophanes',
                  tdLabel: 'White base: TD 2.0–4.0',
                  desc: 'Use a white or natural PLA with TD 2.0–4.0 as your base layer. Lower TD gives stronger contrast; higher TD creates subtler gradients. Black anchor layers should have TD below 1.0.',
                },
                {
                  title: 'Multicolor HueForge Images',
                  tdLabel: 'Color layers: TD 1.0–4.0',
                  desc: 'Each color in your stack needs its own TD profile. Darker colors typically have lower TD, lighter and brighter colors have higher TD. Silk and metallic filaments often have high TD (5+).',
                },
                {
                  title: 'Functional Parts',
                  tdLabel: 'TD less critical',
                  desc: 'For non-HueForge functional prints, TD is usually irrelevant. Focus on material properties instead. TD only matters when light transmission is part of the design intent.',
                },
              ].map(({ title, tdLabel, desc }) => (
                <div key={title} className="rounded-lg border border-border bg-card p-4">
                  <h3 className="font-semibold mb-1 text-sm">{title}</h3>
                  <Badge className="mb-2 bg-purple-500/10 text-purple-400 border-purple-500/20 text-xs">{tdLabel}</Badge>
                  <p className="text-xs text-muted-foreground leading-relaxed">{desc}</p>
                </div>
              ))}
            </div>
          </section>

          {/* How-to steps */}
          <section>
            <h2 className="text-2xl font-bold mb-4">How to Choose the Right TD Value — Step by Step</h2>
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

          <FAQSection
            faqs={FAQS}
            title="HueForge TD — Frequently Asked Questions"
          />

          <RelatedContentBlock
            title="Related HueForge Resources"
            links={[
              { label: 'HueForge TD Database', href: '/hueforge-td-database', description: 'Search verified TD values for 500+ filaments' },
              { label: 'Best Filaments for HueForge', href: '/guides/best-filaments-for-hueforge', description: 'TD-ranked picks for lithophane printing' },
              { label: 'Best White Filaments for HueForge', href: '/guides/best-white-filaments-for-hueforge', description: 'TD-ranked white filament picks for lithophanes' },
              { label: 'How to Measure Filament TD', href: '/guides/how-to-measure-filament-td', description: 'Step-by-step calibration and measurement guide' },
              { label: 'Browse All Colors', href: '/colors', description: 'Find filaments by color with TD data' },
            ]}
          />
        </div>
      </div>
    </>
  );
}
