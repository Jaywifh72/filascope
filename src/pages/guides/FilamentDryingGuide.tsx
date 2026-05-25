import { Link } from 'react-router-dom';
import { DocumentHead } from '@/components/seo/DocumentHead';
import { ArticleSchema, HowToSchema, FAQSection } from '@/components/seo';
import { Breadcrumbs } from '@/components/seo/Breadcrumbs';
import { RelatedContentBlock } from '@/components/seo/RelatedContentBlock';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Droplets, ArrowRight, Thermometer, Clock, AlertTriangle, CheckCircle2, Package } from 'lucide-react';

const DRYING_TABLE = [
  { material: 'PLA', temp: '45–50°C', time: '4–6 hours', sensitivity: 'Low-Medium', notes: 'Most forgiving. Dry if you hear popping or see bubbling.' },
  { material: 'PLA+ / PLA Pro', temp: '45–50°C', time: '4–6 hours', sensitivity: 'Low-Medium', notes: 'Same as standard PLA. Some formulations are slightly more hygroscopic.' },
  { material: 'PETG', temp: '60–65°C', time: '4–6 hours', sensitivity: 'Medium', notes: 'Absorbs moisture faster than PLA. Dry at first sign of stringing or bubbling.' },
  { material: 'ABS', temp: '75–80°C', time: '2–4 hours', sensitivity: 'Medium', notes: 'Moderately hygroscopic. Dry if surface becomes rough or cloudy.' },
  { material: 'ASA', temp: '75–80°C', time: '2–4 hours', sensitivity: 'Medium', notes: 'Similar to ABS. Critical for outdoor parts where surface quality matters.' },
  { material: 'TPU', temp: '55–65°C', time: '4–6 hours', sensitivity: 'High', notes: 'Very hygroscopic. Dry before every use for consistent flexible prints.' },
  { material: 'Nylon (PA)', temp: '70–80°C', time: '6–12 hours', sensitivity: 'Very High', notes: 'Extremely hygroscopic. Can saturate in hours. Dry before every print session.' },
  { material: 'Polycarbonate (PC)', temp: '75–80°C', time: '6–8 hours', sensitivity: 'High', notes: 'Absorbs moisture rapidly. Dry before every use. Store in dry box immediately after.' },
  { material: 'PVA', temp: '45–55°C', time: '4–6 hours', sensitivity: 'Very High', notes: 'Water-soluble support material. Extremely moisture-sensitive. Store in sealed container.' },
  { material: 'PETG-CF', temp: '60–65°C', time: '4–6 hours', sensitivity: 'Medium', notes: 'Same as standard PETG. Carbon fiber doesn\'t change moisture behavior.' },
];

const STORAGE_METHODS = [
  {
    name: 'Vacuum Bags with Desiccant',
    cost: '$15–25 for 10 bags',
    effectiveness: '★★★★',
    pros: ['Cheapest effective solution', 'Compact storage', 'Visual indicator shows seal status'],
    cons: ['Requires re-sealing after each use', 'Bags wear out over time'],
  },
  {
    name: 'Dry Box (Sealed Container + Desiccant)',
    cost: '$10–30 DIY',
    effectiveness: '★★★★',
    pros: ['Easy access during printing', 'Reusable indefinitely', 'Can feed filament directly to printer'],
    cons: ['Requires periodic desiccant replacement or recharging', 'Takes up more space'],
  },
  {
    name: 'Heated Dry Box / Filament Dryer',
    cost: '$40–100',
    effectiveness: '★★★★★',
    pros: ['Active drying while printing', 'Best for hygroscopic materials', 'Can dry and print simultaneously'],
    cons: ['Higher upfront cost', 'Requires power', 'Some models have limited spool capacity'],
  },
  {
    name: 'Original Packaging + Desiccant',
    cost: 'Free (reuse bags)',
    effectiveness: '★★★',
    pros: ['No extra cost', 'Resealable zip bags work for short-term storage'],
    cons: ['Not airtight long-term', 'Desiccant packets lose effectiveness over time'],
  },
];

const WET_FILAMENT_SYMPTOMS = [
  { symptom: 'Popping or crackling sounds', explanation: 'Moisture boils and creates steam bubbles as filament exits the nozzle. Most audible with PLA and PETG.' },
  { symptom: 'Stringing and oozing', explanation: 'Moisture reduces filament viscosity, causing more oozing during travel moves and retraction failures.' },
  { symptom: 'Rough or blobby surface finish', explanation: 'Steam bubbles burst on the surface, creating zits, blobs, and inconsistent layer lines.' },
  { symptom: 'Weak layer adhesion', explanation: 'Steam bubbles between layers prevent proper bonding, reducing part strength by 30–50%.' },
  { symptom: 'Cloudy or discolored prints', explanation: 'Moisture causes hydrolysis in PETG and nylon, creating a milky or cloudy appearance in transparent materials.' },
  { symptom: 'Inconsistent extrusion width', explanation: 'Steam pressure fluctuations cause variable extrusion, visible as uneven line widths.' },
];

const HOW_TO_STEPS = [
  { name: 'Identify Wet Filament Symptoms', text: 'Listen for popping/crackling during extrusion. Look for rough surfaces, excessive stringing, or weak layer adhesion. These indicate moisture in the filament.' },
  { name: 'Check the Recommended Drying Temperature', text: 'Each material has a specific drying temperature. PLA: 45–50°C, PETG: 60–65°C, ABS/ASA: 75–80°C, Nylon: 70–80°C. Never exceed the glass transition temperature.' },
  { name: 'Choose Your Drying Method', text: 'Use a dedicated filament dryer, food dehydrator, or oven (with accurate temperature control). Avoid microwaves. A food dehydrator ($30–50) works excellently for most materials.' },
  { name: 'Dry for the Recommended Time', text: 'PLA/PETG: 4–6 hours, ABS/ASA: 2–4 hours, Nylon: 6–12 hours. For severely saturated nylon, extend to 24 hours. Rotate the spool halfway through for even drying.' },
  { name: 'Store Properly After Drying', text: 'Immediately transfer dried filament to a sealed container with fresh desiccant or a dry box. Dried filament re-absorbs moisture within hours in humid environments.' },
];

const FAQS = [
  {
    question: 'How do I know if my filament needs drying?',
    answer: 'The most obvious sign is popping or crackling sounds during extrusion — this is moisture boiling off as steam. Other signs include excessive stringing, rough or blobby surfaces, weak layer adhesion, and inconsistent extrusion. If you hear any popping, your filament needs drying.',
  },
  {
    question: 'Can I dry filament in my kitchen oven?',
    answer: 'You can, but with caution. Most ovens have poor temperature accuracy at low temperatures (below 100°C), and temperature fluctuations can soften or warp PLA spools. If you use an oven, verify temperature with an oven thermometer, set it 5°C below target, and monitor closely. A food dehydrator or dedicated filament dryer is more reliable and safer.',
  },
  {
    question: 'How long does it take for filament to absorb moisture?',
    answer: 'It depends on the material and humidity. Nylon can become saturated in 2–4 hours in humid environments (>60% RH). PETG takes 1–2 weeks in normal indoor humidity. PLA is more resistant but will degrade over 2–4 weeks in humid conditions. In dry climates (<30% RH), filaments can last months without issues.',
  },
  {
    question: 'Can you over-dry filament?',
    answer: 'Technically yes, but it\'s difficult to damage filament from drying alone as long as you stay below the recommended temperature. Excessive heat (above the glass transition temperature) will soften and deform the spool and filament. Stick to the recommended temperatures and times, and you won\'t over-dry.',
  },
  {
    question: 'Is a filament dryer worth the investment?',
    answer: 'If you print with hygroscopic materials (nylon, TPU, PVA, PC) regularly, absolutely. A filament dryer ($40–100) pays for itself in prevented failed prints. For PLA-only users in dry climates, proper storage with desiccant is usually sufficient. If you live in a humid climate, a dryer is recommended regardless of material.',
  },
  {
    question: 'Do I need to dry new filament out of the box?',
    answer: 'Usually not, but it depends on the manufacturer and shipping conditions. Premium brands like Prusament and Polymaker vacuum-seal their filament with desiccant, so it arrives dry. Budget brands may not seal as carefully. If you hear popping on a brand-new spool, dry it before printing.',
  },
];

export default function FilamentDryingGuide() {
  const canonicalUrl = 'https://filascope.com/guides/filament-drying-guide';

  return (
    <>
      <DocumentHead
        title="Filament Drying Guide: How to Store & Dry 3D Printer Filament | FilaScope"
        description="Complete filament drying guide: exact temperatures and times for PLA, PETG, ABS, Nylon, TPU. Storage solutions, wet filament symptoms, and best dry boxes."
        ogTitle="Filament Drying & Storage Guide — All Materials"
        ogDescription="How to dry and store 3D printer filament. Material-specific temperatures, drying times, storage solutions, and how to tell if filament is wet."
      />
      <ArticleSchema
        headline="Filament Drying Guide: How to Store & Dry 3D Printer Filament"
        description="Complete filament drying guide: exact temperatures and times for PLA, PETG, ABS, Nylon, TPU. Storage solutions and wet filament symptoms."
        datePublished="2026-05-11"
        dateModified="2026-05-25"
        url="/guides/filament-drying-guide"
        articleType="TechArticle"
        about={{ '@type': 'Thing', name: '3D Printer Filament Drying and Storage' }}
        proficiencyLevel="Beginner"
      />
      <HowToSchema
        name="How to Dry 3D Printer Filament"
        description="Step-by-step guide to drying wet 3D printer filament using a filament dryer, food dehydrator, or oven. Covers PLA, PETG, ABS, Nylon, TPU, and more."
        totalTime="PT6H"
        steps={HOW_TO_STEPS}
      />

      <div className="min-h-screen bg-background">
        <div className="max-w-4xl mx-auto px-4 py-6">
          <Breadcrumbs items={[
            { name: 'Guides', url: '/guides' },
            { name: 'Filament Drying Guide', url: '/guides/filament-drying-guide' },
          ]} />
        </div>

        {/* Hero */}
        <section className="bg-gradient-to-b from-cyan-500/5 to-transparent py-12 px-4">
          <div className="max-w-4xl mx-auto">
            <Badge className="mb-4 bg-cyan-500/10 text-cyan-400 border-cyan-500/20">
              <Droplets className="w-3 h-3 mr-1" />
              Troubleshooting Guide · Updated May 2026
            </Badge>
            <h1 className="text-3xl md:text-4xl font-bold mb-4 text-foreground">
              Filament Drying Guide: How to Store & Dry 3D Printer Filament
            </h1>
            <p className="text-lg text-muted-foreground leading-relaxed max-w-2xl">
              Wet filament is the #1 cause of print quality issues that makers blame on their printer.
              This guide covers how to identify moisture problems, the exact drying temperatures for
              every material, and the best storage solutions to keep your filament dry.
            </p>
          </div>
        </section>

        <div className="max-w-4xl mx-auto px-4 py-10 space-y-14">

          {/* AI Snippet Zone */}
          <section aria-label="Quick Summary" className="bg-muted/30 border border-border/40 rounded-lg px-5 py-4">
            <p className="text-sm text-muted-foreground leading-relaxed">
              <strong className="text-foreground">3D printer filament absorbs moisture from the air</strong>, causing
              popping sounds, stringing, weak layers, and rough surfaces during printing. Dry PLA at 45–50°C for 4–6
              hours, PETG at 60–65°C for 4–6 hours, and ABS at 75–80°C for 2–4 hours. Store dried filament in sealed
              containers with silica desiccant. A food dehydrator ($30–50) or dedicated filament dryer ($40–100) are
              the most reliable drying methods.
            </p>
            <p className="sr-only">
              Summary: 3D printer filament absorbs moisture causing print defects. Dry PLA at 45-50°C, PETG at 60-65°C,
              ABS at 75-80°C, Nylon at 70-80°C. Use a food dehydrator or filament dryer. Store in sealed containers
              with desiccant. Signs of wet filament: popping sounds, stringing, rough surfaces, weak layers.
            </p>
          </section>

          {/* Symptoms of Wet Filament */}
          <section>
            <h2 className="text-2xl font-bold mb-4">Signs Your Filament Has Absorbed Moisture</h2>
            <p className="text-muted-foreground text-sm mb-4">
              Hygroscopic filaments absorb water vapor from the air. When heated in the nozzle, this water turns to steam
              and causes print defects. Here's what to look for:
            </p>
            <div className="grid sm:grid-cols-2 gap-3">
              {WET_FILAMENT_SYMPTOMS.map(({ symptom, explanation }) => (
                <div key={symptom} className="flex gap-3 p-3 rounded-lg border border-border bg-card/50">
                  <div className="w-6 h-6 rounded-full bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center shrink-0 mt-0.5">
                    <AlertTriangle className="w-3 h-3 text-cyan-400" />
                  </div>
                  <div>
                    <p className="font-semibold text-sm">{symptom}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{explanation}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Material-Specific Drying */}
          <section>
            <h2 className="text-2xl font-bold mb-4">Drying Temperatures & Times by Material</h2>
            <p className="text-muted-foreground text-sm mb-4">
              Each material has specific drying requirements. <strong className="text-foreground">Never exceed the glass transition
              temperature</strong> — this will soften and deform the filament on the spool.
            </p>
            <Card className="border-border overflow-hidden">
              <CardContent className="p-0 overflow-x-auto">
                <table className="w-full text-sm min-w-[600px]">
                  <thead>
                    <tr className="border-b border-border bg-muted/30">
                      <th className="text-left p-3 font-semibold">Material</th>
                      <th className="text-left p-3 font-semibold">Drying Temp</th>
                      <th className="text-left p-3 font-semibold">Duration</th>
                      <th className="text-left p-3 font-semibold">Moisture Sensitivity</th>
                      <th className="text-left p-3 font-semibold">Notes</th>
                    </tr>
                  </thead>
                  <tbody>
                    {DRYING_TABLE.map((row) => (
                      <tr key={row.material} className="border-b border-border last:border-0 hover:bg-muted/20 transition-colors">
                        <td className="p-3 font-medium text-sm">{row.material}</td>
                        <td className="p-3 font-mono text-xs text-cyan-400">{row.temp}</td>
                        <td className="p-3 text-muted-foreground text-xs">{row.time}</td>
                        <td className="p-3">
                          <Badge
                            variant="outline"
                            className={
                              row.sensitivity === 'Very High'
                                ? 'bg-red-500/10 text-red-400 border-red-500/20 text-xs'
                                : row.sensitivity === 'High'
                                ? 'bg-amber-500/10 text-amber-400 border-amber-500/20 text-xs'
                                : row.sensitivity === 'Medium'
                                ? 'bg-blue-500/10 text-blue-400 border-blue-500/20 text-xs'
                                : 'bg-green-500/10 text-green-400 border-green-500/20 text-xs'
                            }
                          >
                            {row.sensitivity}
                          </Badge>
                        </td>
                        <td className="p-3 text-muted-foreground text-xs">{row.notes}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </CardContent>
            </Card>
            <Card className="mt-4 border-cyan-500/20 bg-cyan-500/5">
              <CardContent className="p-4 flex gap-3 items-start">
                <Thermometer className="w-5 h-5 text-cyan-400 shrink-0 mt-0.5" />
                <p className="text-sm text-muted-foreground">
                  <strong className="text-foreground">Important:</strong> PLA's glass transition temperature is ~60°C.
                  Never dry PLA above 55°C or the spool and filament will soften and deform. PETG's glass transition
                  is ~80°C, so 65°C is safe. ABS/ASA can handle up to 100°C but 80°C is sufficient for drying.
                </p>
              </CardContent>
            </Card>
          </section>

          {/* Drying Methods */}
          <section>
            <h2 className="text-2xl font-bold mb-4">How to Dry Filament: 4 Methods Compared</h2>
            <div className="space-y-4">
              {[
                {
                  icon: Thermometer,
                  name: 'Dedicated Filament Dryer',
                  desc: 'Purpose-built devices that heat filament to precise temperatures while allowing you to feed directly to your printer. The most convenient option for regular use.',
                  price: '$40–100',
                  recommendation: 'Best for: Regular printers using hygroscopic materials',
                },
                {
                  icon: Droplets,
                  name: 'Food Dehydrator',
                  desc: 'A standard food dehydrator with stackable trays works perfectly. Remove trays to fit spools, set to the target temperature, and dry for the recommended time.',
                  price: '$30–50',
                  recommendation: 'Best for: Budget-conscious users who dry multiple spools',
                },
                {
                  icon: Thermometer,
                  name: 'Kitchen Oven',
                  desc: 'Works in a pinch but oven temperature accuracy at low settings (40–80°C) is often poor. Use an oven thermometer to verify. Set 5°C below target and monitor closely.',
                  price: 'Free (you have one)',
                  recommendation: 'Best for: Emergency drying when no other option is available',
                },
                {
                  icon: Clock,
                  name: 'On-Printer Heated Bed',
                  desc: 'Place the spool on your heated bed, set to the target temperature, and cover with a cardboard box to trap heat. Slow but effective for one spool at a time.',
                  price: 'Free',
                  recommendation: 'Best for: Single spool, occasional drying needs',
                },
              ].map(({ icon: Icon, name, desc, price, recommendation }) => (
                <div key={name} className="flex gap-4 p-4 rounded-lg border border-border bg-card/50">
                  <div className="w-8 h-8 rounded-full bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center shrink-0 mt-0.5">
                    <Icon className="w-4 h-4 text-cyan-400" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold text-sm">{name}</h3>
                      <Badge variant="outline" className="text-xs">{price}</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground mb-1.5">{desc}</p>
                    <p className="text-xs text-cyan-400">{recommendation}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Storage Solutions */}
          <section>
            <h2 className="text-2xl font-bold mb-4">Filament Storage Solutions</h2>
            <p className="text-muted-foreground text-sm mb-4">
              Drying filament is only half the battle — proper storage prevents re-absorption. Here are the
              most common storage methods ranked by effectiveness:
            </p>
            <div className="grid sm:grid-cols-2 gap-4">
              {STORAGE_METHODS.map((method) => (
                <Card key={method.name} className="border-border">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-semibold text-sm">{method.name}</h3>
                      <span className="text-xs text-cyan-400">{method.effectiveness}</span>
                    </div>
                    <p className="text-xs text-muted-foreground mb-2">{method.cost}</p>
                    <div className="space-y-2">
                      <div>
                        <p className="text-xs font-medium text-green-400 mb-0.5">Pros</p>
                        <ul className="space-y-0.5">
                          {method.pros.map(p => <li key={p} className="text-xs text-muted-foreground">✓ {p}</li>)}
                        </ul>
                      </div>
                      <div>
                        <p className="text-xs font-medium text-destructive mb-0.5">Cons</p>
                        <ul className="space-y-0.5">
                          {method.cons.map(c => <li key={c} className="text-xs text-muted-foreground">✗ {c}</li>)}
                        </ul>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </section>

          {/* Humidity by Material */}
          <section>
            <h2 className="text-2xl font-bold mb-4">Material Moisture Sensitivity Guide</h2>
            <div className="text-muted-foreground space-y-4 text-sm leading-relaxed">
              <p>
                Not all filaments absorb moisture at the same rate. Understanding your material's hygroscopicity
                helps you decide how aggressively to pursue storage and drying:
              </p>
              <div className="grid sm:grid-cols-3 gap-4">
                {[
                  { level: 'Low Sensitivity', materials: 'PLA, PETG (short-term)', color: 'green', desc: 'Can sit out for 1–2 weeks in normal indoor humidity. Store in original packaging or a simple sealed box.' },
                  { level: 'Medium Sensitivity', materials: 'ABS, ASA, PETG (long-term)', color: 'blue', desc: 'Store sealed with desiccant after opening. Dry if you notice quality issues after 1–2 weeks of exposure.' },
                  { level: 'High Sensitivity', materials: 'Nylon, TPU, PVA, PC', color: 'red', desc: 'Store in active dry box or vacuum-sealed with desiccant. Dry before every print session. Nylon can saturate in hours in humid environments.' },
                ].map(({ level, materials, color, desc }) => (
                  <div key={level} className={`p-4 rounded-lg border border-${color}-500/20 bg-${color}-500/5`}>
                    <Badge className={`mb-2 bg-${color}-500/10 text-${color}-400 border-${color}-500/20 text-xs`}>{level}</Badge>
                    <p className="font-medium text-sm mb-1">{materials}</p>
                    <p className="text-xs text-muted-foreground">{desc}</p>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* How to Dry Step by Step */}
          <section>
            <h2 className="text-2xl font-bold mb-4">How to Dry Filament — Step by Step</h2>
            <div className="space-y-4">
              {HOW_TO_STEPS.map((step, i) => (
                <div key={step.name} className="flex gap-4">
                  <div className="w-8 h-8 rounded-full bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400 font-bold text-sm shrink-0 mt-0.5">
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
            title="Filament Drying — Frequently Asked Questions"
          />

          <RelatedContentBlock
            title="Related Troubleshooting Resources"
            links={[
              { label: 'Filament Temperature Guide', href: '/guides/filament-temperature-guide', description: 'Nozzle & bed temperatures for every material' },
              { label: '3D Printer Accessories', href: '/accessories', description: 'Dry boxes, desiccant, and storage solutions' },
              { label: 'How to Store Filament', href: '/guides/how-to-store-filament', description: 'Detailed storage guide for all materials' },
              { label: 'Best PLA Filaments', href: '/guides/best-pla-filaments', description: 'Top PLA picks ranked by quality' },
              { label: 'Beginner\'s Filament Guide', href: '/guides/best-filaments-for-beginners', description: 'Recommended starter filaments' },
              { label: 'Print Troubleshooting', href: '/guides/troubleshooting', description: 'Fix common 3D printing problems' },
            ]}
          />
        </div>
      </div>
    </>
  );
}
