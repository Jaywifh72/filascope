import { Link } from 'react-router-dom';
import { DocumentHead } from '@/components/seo/DocumentHead';
import { ArticleSchema, FAQSection, HowToSchema } from '@/components/seo';
import { Breadcrumbs } from '@/components/seo/Breadcrumbs';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { AlertTriangle, ArrowRight, Droplets, ThermometerSun, Package, Clock } from 'lucide-react';

const DRYING_TABLE = [
  { material: 'PLA', temp: '45–50°C', time: '4–6 hours', urgency: 'Low', note: 'Dry if stored >3 months unsealed' },
  { material: 'PLA+', temp: '45–50°C', time: '4–6 hours', urgency: 'Low', note: 'More moisture-tolerant than Nylon' },
  { material: 'PETG', temp: '60–65°C', time: '4–6 hours', urgency: 'Medium', note: 'Dry if stringing persists' },
  { material: 'ABS', temp: '65–80°C', time: '4–6 hours', urgency: 'Medium', note: 'Always dry unsealed ABS' },
  { material: 'ASA', temp: '65–80°C', time: '4–6 hours', urgency: 'Medium', note: 'Similar to ABS moisture sensitivity' },
  { material: 'TPU', temp: '50°C', time: '4–8 hours', urgency: 'High', note: 'Very hygroscopic, always dry' },
  { material: 'Nylon (PA)', temp: '70–80°C', time: '8–12 hours', urgency: 'Critical', note: 'ALWAYS dry before use' },
  { material: 'PC', temp: '80–90°C', time: '8–12 hours', urgency: 'Critical', note: 'Extremely hygroscopic' },
  { material: 'PETG-CF', temp: '60–65°C', time: '4–6 hours', urgency: 'Medium', note: 'Same as PETG' },
];

const WET_SIGNS = [
  { icon: '💧', title: 'Popping & Crackling', description: 'Audible popping from the nozzle during printing — moisture vaporizing inside the melt zone. Most obvious sign of wet filament.' },
  { icon: '🕸️', title: 'Excessive Stringing', description: 'Hair-thin strands between features that persist even after tuning retraction. Often caused by moisture lowering viscosity.' },
  { icon: '💨', title: 'Bubbles & Foam', description: 'Bubbled or foamy extrusion, often with a rough or porous surface on finished prints. Steam creates voids in layers.' },
  { icon: '😵', title: 'Poor Surface Quality', description: 'Rough, matte, or pitted surfaces on what should be smooth areas. Moisture disrupts consistent layer deposition.' },
  { icon: '🔴', title: 'Discoloration', description: 'Yellowing, browning, or darkening of clear/light filaments during printing, caused by hydrolysis at print temperatures.' },
  { icon: '⚡', title: 'Weak Layer Adhesion', description: 'Prints snap along layer lines with minimal force. Moisture reduces layer bonding strength by up to 50% in some materials.' },
];

const HOW_TO_STEPS = [
  { name: 'Identify Wet Filament', text: 'Listen for popping or crackling during printing. Check for excessive stringing that doesn\'t improve with retraction tuning. Examine extruded material for bubbles or foam.' },
  { name: 'Set Your Dryer Temperature', text: 'Use a food dehydrator, purpose-built filament dryer, or oven (if temperature-accurate). Set to the temperature for your material: PLA 45–50°C, PETG 60–65°C, Nylon 70–80°C.' },
  { name: 'Dry for the Recommended Time', text: 'Place the spool in the dryer. Do not exceed the recommended temperature — PLA will deform above 60°C. Nylon and PC need 8–12 hours minimum.' },
  { name: 'Test Before Full Print', text: 'After drying, extrude a short length and listen for popping. Print a small test. If issues persist, dry for another 2–4 hours.' },
  { name: 'Store Immediately After Drying', text: 'Place dried filament in an airtight container or vacuum bag with fresh desiccant while still warm. It will re-absorb moisture within hours if left open.' },
];

const FAQS = [
  {
    question: 'How do I know if my filament is wet?',
    answer: 'The most obvious sign is popping or crackling sounds from the nozzle during printing — that\'s moisture vaporizing. Other signs include excessive stringing that doesn\'t improve with retraction tuning, bubbles or foam in the extrudate, rough surface quality, and weak layer adhesion. Nylon is particularly sensitive and can feel sticky or limp when wet.',
  },
  {
    question: 'Can I dry filament in a regular oven?',
    answer: 'Yes, but with caution. Many kitchen ovens are inaccurate at low temperatures and can spike higher. Use an oven thermometer to verify the actual temperature. PLA will deform above 60°C. PETG softens around 80°C. Never leave the oven unattended and don\'t use convection mode for PLA (the fan can deform the spool). A purpose-built filament dryer or food dehydrator is safer and more consistent.',
  },
  {
    question: 'What humidity should I store filament at?',
    answer: 'Store filament at below 15% relative humidity for best results. Most sealed containers with desiccant achieve 10–15% RH. For critical materials like Nylon and PC, aim for below 10% RH. Add a hygrometer to your storage container to monitor conditions — cheap humidity sensors are available for a few dollars.',
  },
  {
    question: 'How long can I leave PLA open before it absorbs too much moisture?',
    answer: 'It depends on your local humidity. In dry climates (30–40% RH), PLA can stay open for weeks without noticeable degradation. In humid climates (60–80% RH), you may see print quality decline in 24–48 hours. Always reseal your filament between print sessions and add fresh desiccant at least monthly.',
  },
  {
    question: 'What is the best container for storing filament?',
    answer: 'Airtight plastic storage containers (like IRIS, Sterilite, or similar) with rubber gasket lids are ideal. Add 2–4 silica gel packets (color-changing indicators are best) per container. Vacuum storage bags also work well, especially for expensive engineering materials like Nylon and PC. Purpose-built filament dry boxes with hygrometers are available for $20–$40 and offer the most control.',
  },
];

export default function FilamentStorageGuide() {
  return (
    <>
      <DocumentHead
        title="Filament Storage Guide — How to Store & Dry Filament | FilaScope"
        description="Complete guide to storing 3D printer filament. Proper humidity control, drying instructions for PLA, PETG, Nylon & more. Prevent moisture damage and extend filament life."
        ogTitle="How to Store 3D Printer Filament — Complete Guide"
        ogDescription="Humidity control, drying temperatures, and storage tips for PLA, PETG, Nylon, and all 3D printing filaments."
      />
      <ArticleSchema
        headline="How to Store 3D Printer Filament — Complete Guide"
        description="Complete guide to storing 3D printer filament. Proper humidity control, drying instructions for PLA, PETG, Nylon & more."
        datePublished="2026-02-19"
        dateModified="2026-02-20"
        url="/filament-storage-guide"
        articleType="TechArticle"
        about={{ '@type': 'Thing', name: '3D Printer Filament Storage' }}
        proficiencyLevel="Beginner"
      />
      <HowToSchema
        name="How to Dry and Store 3D Printer Filament"
        description="Step-by-step guide to drying wet filament and storing it properly to prevent moisture damage."
        totalTime="PT8H"
        supply={['Filament dryer, food dehydrator, or oven', 'Silica gel desiccant packets', 'Airtight storage containers', 'Hygrometer (humidity sensor)']}
        steps={HOW_TO_STEPS}
      />

      <div className="min-h-screen bg-background">
        <div className="max-w-4xl mx-auto px-4 py-6">
          <Breadcrumbs items={[
            { name: 'Guides', url: '/guides' },
            { name: 'Filament Storage Guide', url: '/filament-storage-guide' },
          ]} />
        </div>

        {/* Hero */}
        <section className="bg-gradient-to-b from-primary/5 to-transparent py-12 px-4">
          <div className="max-w-4xl mx-auto">
            <Badge className="mb-4 bg-primary/10 text-primary border-primary/20">Reference Guide · Updated Feb 2026</Badge>
            <h1 className="text-3xl md:text-4xl font-bold mb-4 text-foreground">
              How to Store 3D Printer Filament — Complete Guide
            </h1>
            <p className="text-lg text-muted-foreground leading-relaxed max-w-2xl">
              Moisture is the silent killer of filament quality. Even PLA absorbs humidity from the air, leading to
              stringing, bubbles, weak prints, and wasted material. This guide covers how to identify wet filament,
              dry it correctly, and store it long-term for perfect prints every time.
            </p>
          </div>
        </section>

        <div className="max-w-4xl mx-auto px-4 py-10 space-y-14">

          {/* Why Moisture Is the Enemy */}
          <section>
            <h2 className="text-2xl font-bold mb-4">Why Moisture Ruins Filament</h2>
            <div className="prose prose-sm max-w-none text-muted-foreground space-y-3">
              <p>
                3D printing filaments are hygroscopic — they absorb water from the air. When filament with absorbed
                moisture enters your hot nozzle, the water instantly vaporizes, creating steam bubbles that disrupt
                the extrusion flow. The result: popping sounds, rough surfaces, weak layer bonds, and excessive stringing.
              </p>
              <p>
                Nylon (PA) and PC are critically sensitive and can become unprintable within hours of exposure in humid conditions.
                PLA and PETG are more forgiving but still degrade measurably. The solution is simple: seal your filament with
                desiccant between print sessions, and dry it when you notice quality declining.
              </p>
            </div>
          </section>

          {/* Signs of Wet Filament */}
          <section>
            <h2 className="text-2xl font-bold mb-6">Signs Your Filament Is Too Wet</h2>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {WET_SIGNS.map((sign) => (
                <Card key={sign.title} className="border-border bg-card/50">
                  <CardContent className="p-4">
                    <div className="text-2xl mb-2">{sign.icon}</div>
                    <h3 className="font-semibold text-sm mb-1">{sign.title}</h3>
                    <p className="text-xs text-muted-foreground leading-relaxed">{sign.description}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </section>

          {/* Drying Table */}
          <section>
            <h2 className="text-2xl font-bold mb-2">Filament Drying Temperature Reference</h2>
            <p className="text-muted-foreground text-sm mb-4">
              Do not exceed the maximum drying temperature for your material — PLA deforms above 60°C and will ruin the spool.
            </p>
            <Card className="border-border overflow-hidden">
              <CardContent className="p-0 overflow-x-auto">
                <table className="w-full text-sm min-w-[560px]">
                  <thead>
                    <tr className="border-b border-border bg-muted/30">
                      <th className="text-left p-3 font-semibold">Material</th>
                      <th className="text-left p-3 font-semibold">Drying Temp</th>
                      <th className="text-left p-3 font-semibold">Duration</th>
                      <th className="text-left p-3 font-semibold">Priority</th>
                      <th className="text-left p-3 font-semibold">Notes</th>
                    </tr>
                  </thead>
                  <tbody>
                    {DRYING_TABLE.map((row) => (
                      <tr key={row.material} className="border-b border-border last:border-0 hover:bg-muted/20">
                        <td className="p-3 font-medium">{row.material}</td>
                        <td className="p-3 text-muted-foreground font-mono text-xs">{row.temp}</td>
                        <td className="p-3 text-muted-foreground">{row.time}</td>
                        <td className="p-3">
                          <Badge
                            variant="outline"
                            className={
                              row.urgency === 'Critical' ? 'bg-red-500/10 text-red-400 border-red-500/20' :
                              row.urgency === 'High' ? 'bg-orange-500/10 text-orange-400 border-orange-500/20' :
                              row.urgency === 'Medium' ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' :
                              'bg-green-500/10 text-green-400 border-green-500/20'
                            }
                          >
                            {row.urgency}
                          </Badge>
                        </td>
                        <td className="p-3 text-xs text-muted-foreground">{row.note}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </CardContent>
            </Card>
          </section>

          {/* How to Dry Steps */}
          <section>
            <h2 className="text-2xl font-bold mb-6">Step-by-Step: How to Dry Wet Filament</h2>
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
          </section>

          {/* Storage Best Practices */}
          <section>
            <h2 className="text-2xl font-bold mb-6">Long-Term Storage Best Practices</h2>
            <div className="grid sm:grid-cols-2 gap-4">
              {[
                { icon: Package, title: 'Airtight Containers', desc: 'Use containers with rubber-gasket lids. Sterilite, IRIS, and Rubbermaid Cleverstore all work well. One medium container holds 2–4 standard spools.' },
                { icon: Droplets, title: 'Desiccant Packs', desc: 'Add 2–4 silica gel packs per container. Use color-changing packets (blue→pink indicates saturation). Regenerate in the oven at 120°C for 1 hour when saturated.' },
                { icon: ThermometerSun, title: 'Monitor Humidity', desc: 'Add a cheap hygrometer inside the container. Target below 15% RH for most materials, below 10% for Nylon and PC.' },
                { icon: Clock, title: 'Check Monthly', desc: 'Inspect desiccant monthly. Check that container seals are intact. Rotate older spools to use first. Label spools with purchase date.' },
              ].map((tip) => (
                <Card key={tip.title} className="border-border bg-card/50">
                  <CardContent className="p-5">
                    <div className="flex items-start gap-3">
                      <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                        <tip.icon className="w-4.5 h-4.5 text-primary" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-sm mb-1">{tip.title}</h3>
                        <p className="text-xs text-muted-foreground leading-relaxed">{tip.desc}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </section>

          {/* Filament Dryers callout */}
          <Card className="border-primary/20 bg-primary/5">
            <CardContent className="p-5 flex gap-4">
              <AlertTriangle className="w-5 h-5 text-primary shrink-0 mt-0.5" />
              <div>
                <h3 className="font-semibold mb-1">Filament Dryers — The Best Investment</h3>
                <p className="text-sm text-muted-foreground mb-3">
                  Purpose-built filament dryers like the Sunlu S4, eSUN eBOX Lite, and Creality Filament Dryer maintain
                  precise temperatures and can even print while drying. If you print regularly with moisture-sensitive
                  materials, they're worth every penny.
                </p>
                <Link to="/accessories" className="inline-flex items-center gap-1.5 text-sm text-primary hover:underline">
                  Browse filament dryers and accessories <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </CardContent>
          </Card>

          {/* Internal Links */}
          <section className="bg-muted/30 rounded-xl p-6 border border-border">
            <h2 className="text-lg font-semibold mb-4">Related Guides</h2>
            <div className="grid sm:grid-cols-2 gap-3">
              {[
                { to: '/guides/best-filaments-for-beginners', label: 'Best Filaments for Beginners' },
                { to: '/filament-temperature-guide', label: 'Filament Temperature Guide' },
                { to: '/diagnose', label: 'Diagnose My Print Problems' },
                { to: '/materials/nylon', label: 'Nylon (PA) — High Moisture Risk' },
                { to: '/accessories', label: 'Filament Dryers & Accessories' },
                { to: '/guides/beginners-guide', label: "Complete Beginner's Guide" },
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
            title="Filament Storage & Drying — FAQ"
          />
        </div>
      </div>
    </>
  );
}
