import { Link } from 'react-router-dom';
import { DocumentHead } from '@/components/seo/DocumentHead';
import { ArticleSchema, HowToSchema, FAQSection } from '@/components/seo';
import { Breadcrumbs } from '@/components/seo/Breadcrumbs';
import { RelatedContentBlock } from '@/components/seo/RelatedContentBlock';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Sun, ArrowRight, Lightbulb, Ruler, Printer, CheckCircle } from 'lucide-react';

const METHOD1_STEPS = [
  {
    step: 1,
    name: 'Prepare Your Calibration Print File',
    text: 'Download or create a calibration wall with multiple segments at known thicknesses: 1mm, 2mm, 3mm, 4mm, 5mm, 6mm, and 8mm. Print it in your target filament at 0.2mm layer height with your standard settings.',
  },
  {
    step: 2,
    name: 'Hold the Print to a Bright Light Source',
    text: 'Use a bright LED lamp, monitor, or phone flashlight in a darkened room. Hold each wall thickness segment up to the light and observe how much light passes through each section.',
  },
  {
    step: 3,
    name: 'Identify the Transition Point',
    text: 'Find the wall thickness at which the light is completely blocked — no glow visible from the other side. This thickness in millimeters is your approximate TD value.',
  },
  {
    step: 4,
    name: 'Fine-Tune with Half-Millimeter Increments',
    text: 'If the transition happens between two segments (e.g., 2mm lets light through but 3mm blocks it), print additional segments at 2.25, 2.5, and 2.75mm to narrow down the exact value.',
  },
  {
    step: 5,
    name: 'Record and Submit Your Result',
    text: 'Document your measured TD value with your filament brand, product name, color, and batch number. Submit the measurement to FilaScope\'s TD Database to help the community.',
  },
];

const METHOD2_STEPS = [
  {
    step: 1,
    name: 'Set Up Your Light Source',
    text: 'Position a consistent, calibrated light source (LED panel or lightbox) at a fixed distance. Note the lux reading with no obstruction.',
  },
  {
    step: 2,
    name: 'Measure Through Each Thickness',
    text: 'Place each wall thickness segment between the light source and your lux meter. Record the lux reading for each thickness.',
  },
  {
    step: 3,
    name: 'Calculate the 1% Transmission Point',
    text: 'The TD value is the thickness at which lux drops to approximately 1% of the unobstructed reading. For example: 1000 lux baseline → TD is the thickness where reading drops to ≤10 lux.',
  },
  {
    step: 4,
    name: 'Average Multiple Measurements',
    text: 'Take at least 3 measurements at each thickness and average them. Variations in layer texture can affect readings. Rotate the sample between measurements for consistency.',
  },
];

const MATERIAL_TD_TABLE = [
  { material: 'White PLA', tdRange: '1.5 – 4.0', notes: 'Most common lithophane base' },
  { material: 'Natural PLA', tdRange: '4.0 – 8.0', notes: 'Unpigmented, highly translucent' },
  { material: 'Black PLA', tdRange: '0.3 – 1.0', notes: 'Strong opaque anchor layer' },
  { material: 'Colored PLA (saturated)', tdRange: '1.0 – 3.0', notes: 'Varies greatly by pigment type' },
  { material: 'Silk PLA', tdRange: '5.0 – 9.0', notes: 'Metallic sheen, very translucent' },
  { material: 'White PETG', tdRange: '2.0 – 5.0', notes: 'Good alternative base layer' },
  { material: 'ABS (white)', tdRange: '2.0 – 4.0', notes: 'Less common for HueForge' },
  { material: 'Glow-in-the-dark PLA', tdRange: '6.0 – 12.0', notes: 'Highly translucent, phosphor-loaded' },
];

const HOW_TO_STEPS_SCHEMA = [
  { name: 'Print a Calibration Wall', text: 'Print test segments at 1mm, 2mm, 3mm, 4mm, 6mm, and 8mm wall thickness using your target filament at standard settings.' },
  { name: 'Hold to Bright Light', text: 'In a dim room, hold each segment to a bright LED light and identify the thickness where light is fully blocked.' },
  { name: 'Identify the TD Value', text: 'The wall thickness in millimeters at which light is fully blocked is your filament\'s approximate TD value.' },
  { name: 'Validate Against Existing Data', text: 'Compare your result with FilaScope\'s database to verify it is in a plausible range for your material type and color.' },
  { name: 'Submit Your Measurement', text: 'Add your verified TD value to FilaScope\'s community TD database to help other HueForge users.' },
];

const FAQS = [
  {
    question: 'How accurate is the calibration cube method?',
    answer: 'The visual calibration method is accurate to approximately ±0.5mm for most filaments, which is sufficient for HueForge. HueForge itself uses TD values with one decimal place of precision. The primary source of error is the subjective judgment of "fully blocked" — using a consistently bright light source in a dim room reduces this significantly. The lux meter method is more accurate (±0.1mm) but requires additional equipment.',
  },
  {
    question: 'Can I use a smartphone flashlight to test TD?',
    answer: 'Yes, a smartphone flashlight works for a quick estimate, but results vary between phone models due to different brightness levels and beam spread. For consistent measurements, use a fixed LED light source or lightbox. Position the light source consistently and test all samples at the same distance. For submission to FilaScope, try to use a consistent, repeatable setup.',
  },
  {
    question: 'What layer height should I use when measuring TD?',
    answer: 'Print your calibration wall at 0.2mm layer height, which is the standard layer height HueForge uses for its TD calculations. If you print at a different layer height, your effective TD will differ from the measured value — HueForge accounts for this internally, so always measure at 0.2mm for consistency with the database.',
  },
  {
    question: 'Do I need to measure TD for every color I own?',
    answer: 'Yes, ideally. Even the same material from the same brand in different colors will have different TD values. However, you only strictly need TD values for the filaments you are actually using in a given HueForge project. Start by measuring your white base and black anchor, then measure other colors as you add them to your stack. Check FilaScope first — your specific filament may already have a verified TD value.',
  },
];

export default function HowToMeasureFilamentTD() {
  const canonicalUrl = 'https://filascope.com/guides/how-to-measure-filament-td';

  return (
    <>
      <DocumentHead
        title="How to Measure Filament TD Value for HueForge | FilaScope"
        description="Step-by-step guide to measuring filament TD values for HueForge. Learn the test print method, light meter method, and how to submit TD values to the community."
        ogTitle="How to Measure Filament TD for HueForge"
        ogDescription="Two methods to measure filament Transmissivity Distance (TD): calibration wall test and light meter method. Step-by-step with tables and tips."
      />
      <ArticleSchema
        headline="How to Measure Filament Transmissivity Distance (TD) for HueForge"
        description="Step-by-step guide to measuring filament TD values for HueForge. Learn the test print method, light meter method, and how to submit TD values to the community."
        datePublished="2026-02-20"
        dateModified="2026-02-20"
        url="/guides/how-to-measure-filament-td"
        articleType="TechArticle"
        about={{ '@type': 'Thing', name: 'HueForge Transmissivity Distance Measurement' }}
        proficiencyLevel="Intermediate"
      />
      <HowToSchema
        name="How to Measure Filament TD Value for HueForge"
        description="A step-by-step process for measuring a filament's Transmissivity Distance (TD) value for use in HueForge lithophane and multicolor printing."
        totalTime="PT45M"
        supply={['3D printer', 'Calibration wall STL file', 'Bright LED light source', 'Ruler or calipers']}
        tool={['3D printer', 'Bright LED light or lightbox', 'Lux meter (optional, for Method 2)']}
        steps={HOW_TO_STEPS_SCHEMA}
      />

      <div className="min-h-screen bg-background">
        <div className="max-w-4xl mx-auto px-4 py-6">
          <Breadcrumbs items={[
            { name: 'Learn', url: '/learn' },
            { name: 'How to Measure Filament TD', url: '/guides/how-to-measure-filament-td' },
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
              How to Measure Filament Transmissivity Distance (TD) for HueForge
            </h1>
            <p className="text-lg text-muted-foreground leading-relaxed max-w-2xl">
              If your filament isn't in FilaScope's database, you can measure its TD value yourself with
              just a test print and a light source. This guide covers two methods — the calibration wall
              test and the precision lux meter method.
            </p>
          </div>
        </section>

        <div className="max-w-4xl mx-auto px-4 py-10 space-y-14">

          {/* AI Snippet Zone */}
          <section aria-label="Quick Summary" className="bg-muted/30 border border-border/40 rounded-lg px-5 py-4">
            <p className="text-sm text-muted-foreground leading-relaxed">
              To measure a filament's TD value for HueForge, print a calibration wall with segments at known
              thicknesses (1mm through 8mm) and hold it up to a bright light source in a dim room. The wall
              thickness at which light no longer passes through is the approximate TD value in millimeters.
              Print at 0.2mm layer height for measurements consistent with the HueForge standard.
            </p>
            <p className="sr-only">
              Summary: To measure filament TD for HueForge, print a calibration wall at multiple thicknesses
              (1mm to 8mm) at 0.2mm layer height. Hold to bright light in a dim room. The thickness at which
              light is fully blocked is the TD value in millimeters. This value can then be entered into
              HueForge or submitted to FilaScope's community TD database.
            </p>
          </section>

          {/* What You'll Need */}
          <section>
            <h2 className="text-2xl font-bold mb-4">What You'll Need</h2>
            <div className="grid sm:grid-cols-2 gap-3">
              {[
                { icon: Printer, label: 'Your 3D Printer', desc: 'Any FDM printer capable of printing the target filament at standard settings.' },
                { icon: Ruler, label: 'Calibration Wall File', desc: 'An STL or 3MF file with multiple wall segments at 1mm, 2mm, 3mm, 4mm, 5mm, 6mm, and 8mm thickness.' },
                { icon: Lightbulb, label: 'Bright Light Source', desc: 'A consistent LED desk lamp, lightbox, or phone flashlight. The brighter and more consistent, the better.' },
                { icon: CheckCircle, label: 'Dark Room (Optional)', desc: 'A dimmed room significantly improves the visibility of the light-through-filament transition.' },
              ].map(({ icon: Icon, label, desc }) => (
                <div key={label} className="flex gap-3 p-4 rounded-lg border border-border bg-card/50">
                  <div className="w-8 h-8 rounded-full bg-purple-500/10 border border-purple-500/20 flex items-center justify-center shrink-0">
                    <Icon className="w-4 h-4 text-purple-400" />
                  </div>
                  <div>
                    <p className="font-semibold text-sm">{label}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Method 1 */}
          <section>
            <h2 className="text-2xl font-bold mb-2">Method 1: The Calibration Wall Test</h2>
            <p className="text-muted-foreground text-sm mb-6">
              The simplest and most widely used method. No special equipment required beyond your printer
              and a light source. Accuracy: approximately ±0.5mm.
            </p>
            <div className="space-y-4">
              {METHOD1_STEPS.map((step) => (
                <div key={step.step} className="flex gap-4">
                  <div className="w-8 h-8 rounded-full bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400 font-bold text-sm shrink-0 mt-0.5">
                    {step.step}
                  </div>
                  <div>
                    <h3 className="font-semibold mb-1 text-sm">{step.name}</h3>
                    <p className="text-sm text-muted-foreground">{step.text}</p>
                  </div>
                </div>
              ))}
            </div>
            <Card className="mt-5 border-purple-500/20 bg-purple-500/5">
              <CardContent className="p-4 flex gap-3 items-start">
                <Lightbulb className="w-5 h-5 text-purple-400 shrink-0 mt-0.5" />
                <p className="text-sm text-muted-foreground">
                  <strong className="text-foreground">Tip:</strong> Always print at <strong className="text-foreground">0.2mm layer height</strong> for
                  measurements consistent with the HueForge community standard. Printing at different layer heights
                  will give you a TD value that does not match the database.
                </p>
              </CardContent>
            </Card>
          </section>

          {/* Method 2 */}
          <section>
            <h2 className="text-2xl font-bold mb-2">Method 2: Using a Light Meter</h2>
            <p className="text-muted-foreground text-sm mb-6">
              A more precise approach using a lux meter for quantitative measurements. Best for users who
              want to submit highly accurate values to the FilaScope database. Accuracy: approximately ±0.1mm.
            </p>
            <div className="space-y-4">
              {METHOD2_STEPS.map((step) => (
                <div key={step.step} className="flex gap-4">
                  <div className="w-8 h-8 rounded-full bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400 font-bold text-sm shrink-0 mt-0.5">
                    {step.step}
                  </div>
                  <div>
                    <h3 className="font-semibold mb-1 text-sm">{step.name}</h3>
                    <p className="text-sm text-muted-foreground">{step.text}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Submit CTA */}
          <section>
            <h2 className="text-2xl font-bold mb-4">How to Submit TD Values to FilaScope</h2>
            <Card className="border-border bg-card">
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-full bg-purple-500/10 border border-purple-500/20 flex items-center justify-center shrink-0">
                    <Sun className="w-5 h-5 text-purple-400" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold mb-2">Share Your Measurement With the Community</h3>
                    <p className="text-sm text-muted-foreground mb-4 leading-relaxed">
                      FilaScope's TD database is community-powered. Every submitted measurement helps HueForge
                      users around the world get better lithophane results. To submit your TD value:
                    </p>
                    <ol className="space-y-1.5 text-sm text-muted-foreground mb-4">
                      <li className="flex gap-2"><span className="text-purple-400 font-medium shrink-0">1.</span><span>Navigate to the filament's detail page on FilaScope</span></li>
                      <li className="flex gap-2"><span className="text-purple-400 font-medium shrink-0">2.</span><span>Find your filament using search or the TD database</span></li>
                      <li className="flex gap-2"><span className="text-purple-400 font-medium shrink-0">3.</span><span>Use the community contribution form to submit your measurement</span></li>
                    </ol>
                    <Button asChild variant="outline" size="sm">
                      <Link to="/hueforge-td-database">
                        <Sun className="w-4 h-4 mr-1.5" />Go to TD Database
                        <ArrowRight className="w-3.5 h-3.5 ml-1" />
                      </Link>
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </section>

          {/* Common TD Values by Material */}
          <section>
            <h2 className="text-2xl font-bold mb-4">Common TD Values by Material Type</h2>
            <p className="text-muted-foreground text-sm mb-4">
              Use these typical ranges to validate your measurements. If your result is far outside the
              expected range for your material, repeat the measurement.
            </p>
            <Card className="border-border overflow-hidden">
              <CardContent className="p-0 overflow-x-auto">
                <table className="w-full text-sm min-w-[440px]">
                  <thead>
                    <tr className="border-b border-border bg-muted/30">
                      <th className="text-left p-3 font-semibold">Material</th>
                      <th className="text-left p-3 font-semibold">Typical TD Range</th>
                      <th className="text-left p-3 font-semibold">Notes</th>
                    </tr>
                  </thead>
                  <tbody>
                    {MATERIAL_TD_TABLE.map((row) => (
                      <tr key={row.material} className="border-b border-border last:border-0 hover:bg-muted/20 transition-colors">
                        <td className="p-3 font-medium text-sm">{row.material}</td>
                        <td className="p-3 font-mono text-xs text-purple-400">{row.tdRange}</td>
                        <td className="p-3 text-muted-foreground text-xs">{row.notes}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </CardContent>
            </Card>
          </section>

          <FAQSection
            faqs={FAQS}
            title="Measuring Filament TD — Frequently Asked Questions"
          />

          <RelatedContentBlock
            title="Related HueForge Resources"
            links={[
              { label: 'HueForge TD Database', href: '/hueforge-td-database', description: 'Search verified TD values — your filament may already be there' },
              { label: 'Best Filaments for HueForge', href: '/guides/best-filaments-for-hueforge', description: 'TD-ranked picks for lithophane printing' },
              { label: 'What Is HueForge TD?', href: '/guides/what-is-hueforge-td', description: 'Complete beginner guide to Transmissivity Distance' },
              { label: 'Best White Filaments for HueForge', href: '/guides/best-white-filaments-for-hueforge', description: 'Top white filament picks ranked by TD' },
            ]}
          />
        </div>
      </div>
    </>
  );
}
