import { Link } from 'react-router-dom';
import { DocumentHead } from '@/components/seo/DocumentHead';
import { ArticleSchema, BreadcrumbSchema, FAQSection, Breadcrumbs } from '@/components/seo';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { CheckCircle, XCircle, AlertCircle, ArrowRight } from 'lucide-react';

const FAQS = [
  {
    question: 'What filaments work on the Bambu Lab A1 Mini?',
    answer: 'The Bambu Lab A1 Mini supports PLA, PETG, TPU, and hardened-nozzle CF variants (with the optional hardened nozzle upgrade). It does not have a full enclosure, so ABS, ASA, PC, and Nylon are not officially supported — though limited small prints are possible with aftermarket enclosures.',
  },
  {
    question: 'Can an Ender 3 print PETG?',
    answer: 'Yes — the Creality Ender 3 can print PETG reliably. You need to raise the nozzle to 230–250°C and the bed to 70–85°C. PETG on the Ender 3 requires a glass or PEI bed with a release agent (glue stick) to prevent over-adhesion. The stock hotend handles PETG well.',
  },
  {
    question: 'What is the most compatible 3D printing filament?',
    answer: 'PLA is the most compatible filament — it works on every FDM printer, requires no enclosure, no special nozzle, and the lowest temperature (190–220°C). Any printer capable of reaching 220°C nozzle and 60°C bed can print PLA. This includes budget printers, all Bambu Lab machines, Prusa, Creality, and every major brand.',
  },
  {
    question: 'Do I need a hardened nozzle for carbon fiber filament?',
    answer: 'Yes, always. Carbon fiber filaments (PLA-CF, PETG-CF, Nylon-CF, etc.) are highly abrasive and will wear out a standard brass nozzle within 100–500 grams of printing. Use a hardened steel, ruby-tipped, or tungsten carbide nozzle. Many printers now include a hardened nozzle in the box — check your printer specs.',
  },
  {
    question: 'Does the Bambu Lab X1C print all filaments?',
    answer: 'The Bambu Lab X1C is one of the most versatile consumer printers available. With its enclosed chamber, 300°C hotend, and optional hardened nozzle, it supports PLA, PETG, ABS, ASA, TPU, CF composites, Nylon, and even Polycarbonate. It is one of the few printers that can reliably print the full range of common filament types out of the box.',
  },
];

type SupportLevel = 'yes' | 'limited' | 'no' | 'note';

interface PrinterRow {
  name: string;
  maxTemp: string;
  enclosure: string;
  pla: SupportLevel;
  petg: SupportLevel;
  abs: SupportLevel;
  asa: SupportLevel;
  tpu: SupportLevel;
  cf: SupportLevel;
  nylon: SupportLevel;
  pc: SupportLevel;
  guide?: string;
}

const PRINTERS: PrinterRow[] = [
  { name: 'Bambu Lab X1C', maxTemp: '300°C', enclosure: 'Yes', pla: 'yes', petg: 'yes', abs: 'yes', asa: 'yes', tpu: 'yes', cf: 'note', nylon: 'yes', pc: 'yes', guide: '/guides/best-filament-for-bambu-lab-x1-carbon' },
  { name: 'Bambu Lab P1S', maxTemp: '300°C', enclosure: 'Yes', pla: 'yes', petg: 'yes', abs: 'yes', asa: 'yes', tpu: 'yes', cf: 'note', nylon: 'yes', pc: 'yes', guide: '/guides/best-filament-for-bambu-lab-p1s' },
  { name: 'Bambu Lab A1 (non-Mini)', maxTemp: '300°C', enclosure: 'No', pla: 'yes', petg: 'yes', abs: 'limited', asa: 'limited', tpu: 'yes', cf: 'note', nylon: 'limited', pc: 'no', guide: '/guides/best-filament-for-bambu-lab-a1' },
  { name: 'Bambu Lab A1 Mini', maxTemp: '300°C', enclosure: 'No', pla: 'yes', petg: 'yes', abs: 'limited', asa: 'limited', tpu: 'yes', cf: 'note', nylon: 'no', pc: 'no', guide: '/guides/best-filament-for-bambu-lab-a1-mini' },
  { name: 'Prusa MK4', maxTemp: '290°C', enclosure: 'Optional', pla: 'yes', petg: 'yes', abs: 'yes', asa: 'yes', tpu: 'yes', cf: 'note', nylon: 'yes', pc: 'limited', guide: '/guides/best-filament-for-prusa-mk4' },
  { name: 'Prusa XL', maxTemp: '290°C', enclosure: 'No', pla: 'yes', petg: 'yes', abs: 'yes', asa: 'yes', tpu: 'yes', cf: 'note', nylon: 'yes', pc: 'limited' },
  { name: 'Creality Ender 3 V3', maxTemp: '300°C', enclosure: 'No', pla: 'yes', petg: 'yes', abs: 'limited', asa: 'limited', tpu: 'yes', cf: 'no', nylon: 'no', pc: 'no', guide: '/guides/best-filament-for-creality-ender-3-v3' },
  { name: 'Creality K1 Max', maxTemp: '300°C', enclosure: 'Yes', pla: 'yes', petg: 'yes', abs: 'yes', asa: 'yes', tpu: 'yes', cf: 'note', nylon: 'yes', pc: 'limited', guide: '/guides/best-filament-for-creality-k1-max' },
  { name: 'AnkerMake M5C', maxTemp: '260°C', enclosure: 'No', pla: 'yes', petg: 'yes', abs: 'limited', asa: 'limited', tpu: 'yes', cf: 'no', nylon: 'no', pc: 'no' },
];

function SupportIcon({ level }: { level: SupportLevel }) {
  if (level === 'yes') return <CheckCircle className="w-4 h-4 text-green-500 mx-auto" aria-label="Supported" />;
  if (level === 'limited') return <AlertCircle className="w-4 h-4 text-yellow-500 mx-auto" aria-label="Limited support" />;
  if (level === 'note') return <CheckCircle className="w-4 h-4 text-blue-400 mx-auto" aria-label="Supported with hardened nozzle" />;
  return <XCircle className="w-4 h-4 text-muted-foreground/40 mx-auto" aria-label="Not supported" />;
}

export default function FilamentPrinterCompatibility() {
  const breadcrumbs = [
    { name: 'Home', url: '/' },
    { name: '3D Printer Filament Compatibility', url: '/3d-printer-compatibility' },
  ];

  return (
    <>
      <DocumentHead
        title="3D Printer Filament Compatibility — Which Filaments Work With Your Printer | FilaScope"
        description="Find out which filaments work with your 3D printer. Compatibility table for Bambu Lab, Prusa, Creality, and more. PLA, PETG, ABS, ASA, TPU, Nylon, CF, and PC."
        ogType="article"
      />
      <ArticleSchema
        headline="3D Printer Filament Compatibility — Which Filaments Work With Your Printer?"
        description="Find out which filaments work with your 3D printer — a complete compatibility guide for Bambu Lab, Prusa, and Creality printers."
        datePublished="2026-01-15"
        dateModified="2026-05-11"
        url="/3d-printer-compatibility"
      />
      <BreadcrumbSchema items={breadcrumbs.map(b => ({ name: b.name, url: `https://filascope.com${b.url}` }))} />

      <div className="min-h-screen bg-background">
        <section className="bg-gradient-to-b from-primary/5 to-transparent py-12 px-4">
          <div className="max-w-5xl mx-auto">
            <Breadcrumbs items={breadcrumbs} className="mb-6" />
            <Badge className="mb-4 bg-primary/10 text-primary border-primary/20">Reference Guide · Updated Feb 2026</Badge>
            <h1 className="text-3xl md:text-4xl font-bold mb-4 text-foreground">
              3D Printer Filament Compatibility — Which Filaments Work With Your Printer?
            </h1>
            <p className="text-lg text-muted-foreground leading-relaxed max-w-3xl">
              Not every filament works on every printer. Compatibility depends on your printer's maximum nozzle
              temperature, whether it has an enclosed chamber, the type of extruder (direct drive vs Bowden),
              and whether you have a hardened nozzle for abrasive materials. This guide covers the most popular
              consumer printers and maps which filament types they reliably support.
            </p>
          </div>
        </section>

        <div className="max-w-5xl mx-auto px-4 py-10 space-y-14">

          {/* Why compatibility matters */}
          <section>
            <h2 className="text-2xl font-bold mb-4">Why Printer Compatibility Matters</h2>
            <div className="prose prose-sm max-w-none text-muted-foreground space-y-3">
              <p>
                Every FDM filament has minimum temperature requirements. If your printer cannot reach those temperatures,
                the filament will not melt properly and your prints will fail. ABS and ASA require an <strong className="text-foreground">enclosed
                build chamber</strong> to prevent warping from thermal gradients — printers without enclosures produce
                failed or delaminated ABS prints. Engineering materials like Nylon and Polycarbonate require
                <strong className="text-foreground"> all-metal hotends</strong> because PTFE-lined hotends cannot safely
                handle 260°C+ temperatures.
              </p>
              <p>
                Carbon fiber and glass fiber composite filaments are <strong className="text-foreground">abrasive</strong>
                — they grind through brass nozzles within a few hundred grams of printing. Always use a hardened steel,
                ruby-tipped, or tungsten carbide nozzle with any fiber-reinforced material.
              </p>
              <p>
                TPU (flexible filament) works better on <strong className="text-foreground">direct drive extruders</strong>
                than Bowden tube setups — the flexible filament tends to buckle inside long Bowden tubes and cause jams.
                Modern CoreXY printers like the Bambu Lab series use direct drive, making them excellent for TPU.
              </p>
            </div>
          </section>

          {/* Compatibility table */}
          <section>
            <h2 className="text-2xl font-bold mb-2">Printer Filament Compatibility Table</h2>
            <p className="text-sm text-muted-foreground mb-4">
              <span className="inline-flex items-center gap-1"><CheckCircle className="w-3.5 h-3.5 text-green-500" /> Supported</span>
              <span className="inline-flex items-center gap-1 ml-4"><AlertCircle className="w-3.5 h-3.5 text-yellow-500" /> Limited</span>
              <span className="inline-flex items-center gap-1 ml-4"><CheckCircle className="w-3.5 h-3.5 text-blue-400" /> Needs hardened nozzle</span>
              <span className="inline-flex items-center gap-1 ml-4"><XCircle className="w-3.5 h-3.5 text-muted-foreground/40" /> Not supported</span>
            </p>
            <div className="overflow-x-auto rounded-xl border border-border">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-muted/30">
                    <th className="text-left p-3 font-semibold min-w-[160px]">Printer</th>
                    <th className="p-3 font-semibold text-center">Max °C</th>
                    <th className="p-3 font-semibold text-center">Case</th>
                    <th className="p-3 font-semibold text-center">PLA</th>
                    <th className="p-3 font-semibold text-center">PETG</th>
                    <th className="p-3 font-semibold text-center">ABS</th>
                    <th className="p-3 font-semibold text-center">ASA</th>
                    <th className="p-3 font-semibold text-center">TPU</th>
                    <th className="p-3 font-semibold text-center">CF*</th>
                    <th className="p-3 font-semibold text-center">Nylon</th>
                    <th className="p-3 font-semibold text-center">PC</th>
                    <th className="p-3 font-semibold text-center">Guide</th>
                  </tr>
                </thead>
                <tbody>
                  {PRINTERS.map((p) => (
                    <tr key={p.name} className="border-b border-border last:border-0 hover:bg-muted/20">
                      <td className="p-3 font-medium">{p.name}</td>
                      <td className="p-3 text-center text-muted-foreground text-xs">{p.maxTemp}</td>
                      <td className="p-3 text-center text-muted-foreground text-xs">{p.enclosure}</td>
                      <td className="p-3"><SupportIcon level={p.pla} /></td>
                      <td className="p-3"><SupportIcon level={p.petg} /></td>
                      <td className="p-3"><SupportIcon level={p.abs} /></td>
                      <td className="p-3"><SupportIcon level={p.asa} /></td>
                      <td className="p-3"><SupportIcon level={p.tpu} /></td>
                      <td className="p-3"><SupportIcon level={p.cf} /></td>
                      <td className="p-3"><SupportIcon level={p.nylon} /></td>
                      <td className="p-3"><SupportIcon level={p.pc} /></td>
                      <td className="p-3 text-center">
                        {p.guide ? (
                          <Link to={p.guide} className="text-xs text-primary hover:underline">Guide</Link>
                        ) : (
                          <span className="text-muted-foreground/30 text-xs">—</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="text-xs text-muted-foreground mt-2">* CF = Carbon Fiber composite. Requires hardened steel nozzle. Check your printer's nozzle type before printing CF.</p>
          </section>

          {/* Per-material requirements */}
          <section>
            <h2 className="text-2xl font-bold mb-6">Printer Requirements by Filament Type</h2>
            <div className="space-y-6">
              {[
                {
                  material: 'PLA', slug: 'pla', requirements: [
                    'Minimum nozzle temperature: 190°C',
                    'Heated bed optional (55°C recommended)',
                    'No enclosure required',
                    'Standard brass nozzle is fine',
                    'Works on virtually every FDM printer',
                  ]
                },
                {
                  material: 'PETG', slug: 'petg', requirements: [
                    'Minimum nozzle temperature: 230°C',
                    'Heated bed required: 70–85°C',
                    'No enclosure required (draft shield helps)',
                    'Standard brass nozzle is fine',
                    'Direct drive or Bowden — both work',
                  ]
                },
                {
                  material: 'ABS / ASA', slug: 'abs', requirements: [
                    'Minimum nozzle temperature: 230°C',
                    'Heated bed required: 90–110°C',
                    'Enclosure strongly required — warping without it',
                    'Standard brass nozzle is fine',
                    'PTFE-lined hotends: ABS is marginal at these temps',
                  ]
                },
                {
                  material: 'TPU (Flexible)', slug: 'tpu', requirements: [
                    'Minimum nozzle temperature: 220°C',
                    'Heated bed optional (30–60°C)',
                    'No enclosure required',
                    'Direct drive extruder strongly recommended',
                    'Bowden setups: possible but challenging with soft TPU grades',
                  ]
                },
                {
                  material: 'Carbon Fiber Composites', slug: 'carbon-fiber', requirements: [
                    'Temperature depends on base material (PLA-CF: 220°C+, PETG-CF: 240°C+)',
                    'Hardened steel, ruby, or tungsten carbide nozzle — mandatory',
                    'Enclosure depends on base (ABS-CF needs enclosure; PLA-CF does not)',
                    'All-metal hotend required for Nylon-CF and PA-CF variants',
                  ]
                },
                {
                  material: 'Nylon (PA)', slug: 'nylon', requirements: [
                    'Minimum nozzle temperature: 240°C',
                    'Heated bed required: 70–90°C',
                    'Enclosure strongly recommended',
                    'All-metal hotend required (no PTFE above 240°C)',
                    'Dry filament before printing — nylon absorbs moisture rapidly',
                  ]
                },
                {
                  material: 'Polycarbonate (PC)', slug: 'polycarbonate', requirements: [
                    'Minimum nozzle temperature: 260°C (ideally 280–310°C)',
                    'Heated bed required: 100–130°C',
                    'Fully enclosed chamber required (chamber temp 50–80°C ideal)',
                    'All-metal hotend mandatory',
                    'Advanced users only — very prone to warping and moisture issues',
                  ]
                },
              ].map(({ material, slug, requirements }) => (
                <Card key={material} className="border-border">
                  <CardContent className="p-5">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="font-semibold">{material}</h3>
                      <Link to={`/filaments/${slug}`} className="text-xs text-primary hover:underline flex items-center gap-1">
                        Browse {material} <ArrowRight className="w-3 h-3" />
                      </Link>
                    </div>
                    <ul className="space-y-1">
                      {requirements.map((req, i) => (
                        <li key={i} className="text-sm text-muted-foreground flex items-start gap-2">
                          <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-primary/60 shrink-0" />
                          {req}
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              ))}
            </div>
          </section>

          {/* Internal links */}
          <section className="bg-muted/30 rounded-xl p-6 border border-border">
            <h2 className="text-lg font-semibold mb-4">Related Guides</h2>
            <div className="grid sm:grid-cols-2 gap-3">
              {[
                { to: '/filament-types', label: 'All Filament Types Explained' },
                { to: '/printers', label: 'Browse 3D Printers' },
                { to: '/guides/best-filament-for-ender-3', label: 'Best Filament for Ender 3' },
                { to: '/guides/best-filament-for-bambu-lab-p1s', label: 'Best Filament for Bambu P1S' },
                { to: '/best-3d-printer-filament', label: 'Best 3D Printer Filament Overall' },
                { to: '/pla-vs-petg', label: 'PLA vs PETG Comparison' },
              ].map((link) => (
                <Link key={link.to} to={link.to} className="flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors">
                  <ArrowRight className="w-3.5 h-3.5 text-primary shrink-0" />
                  {link.label}
                </Link>
              ))}
            </div>
          </section>

          <FAQSection faqs={FAQS} title="Frequently Asked Questions — 3D Printer Filament Compatibility" />
        </div>
      </div>
    </>
  );
}
