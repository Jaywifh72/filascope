import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { DocumentHead } from '@/components/seo/DocumentHead';
import { ArticleSchema, FAQSection } from '@/components/seo';
import { Breadcrumbs } from '@/components/seo/Breadcrumbs';
import { RelatedContentBlock } from '@/components/seo/RelatedContentBlock';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Printer, ArrowRight, DollarSign, Zap, Shield, Layers } from 'lucide-react';

interface PrinterRow {
  id: string;
  printer_id: string | null;
  brand: string | null;
  model: string | null;
  price_usd: number | null;
  build_volume_x: number | null;
  build_volume_y: number | null;
  build_volume_z: number | null;
  max_speed: number | null;
  max_temp: number | null;
  has_enclosure: boolean | null;
  has_auto_leveling: boolean | null;
  extruder_type: string | null;
  compatible_materials: string[] | null;
}

const FAQS = [
  {
    question: 'What is the best 3D printer under $500 in 2026?',
    answer: 'The best 3D printer under $500 depends on your needs. For most users, the Bambu Lab A1 offers the best combination of speed, quality, and ease of use. For enclosed printing with engineering materials, the Creality K1C is the top pick under $500. For budget-conscious beginners, the Creality Ender 3 V3 provides excellent value at under $200.',
  },
  {
    question: 'Can a 3D printer under $500 print ABS and PETG?',
    answer: 'Yes, many printers under $500 can print PETG effectively — you just need a heated bed (70–80°C). For ABS, you ideally want an enclosed printer with a bed that reaches 100°C+. Some sub-$500 printers like the Creality K1C include enclosures. For open-frame printers, you can build or buy a DIY enclosure for $30–60 to print ABS successfully.',
  },
  {
    question: 'Is the Bambu Lab A1 worth it?',
    answer: 'The Bambu Lab A1 is widely considered the best value in 3D printing as of 2026. It offers automatic calibration, high-speed printing (up to 500mm/s), excellent print quality out of the box, and multi-color capability with the AMS Lite add-on. At its price point, it matches or exceeds printers costing 2–3× more from just two years ago.',
  },
  {
    question: 'Should I buy a bed-slinger or CoreXY printer under $500?',
    answer: 'Bed-slingers (where the bed moves on the Y axis) like the Bambu Lab A1 and Ender 3 V3 are simpler and more affordable. CoreXY printers (where the bed moves only on Z) like the Creality K1 offer faster printing with less ghosting on tall prints. For most users under $500, a modern bed-slinger with input shaping (like the A1) produces results comparable to CoreXY.',
  },
  {
    question: 'Do I need an enclosure for my 3D printer?',
    answer: 'An enclosure is required for ABS, ASA, and Nylon printing to prevent warping. It is not needed for PLA or PETG. If you primarily print PLA and PETG, an open-frame printer like the Bambu Lab A1 is ideal. If you plan to print engineering materials, look for enclosed options like the Creality K1C or budget for a DIY enclosure.',
  },
  {
    question: 'How much does 3D printer filament cost per kilogram?',
    answer: 'Standard PLA costs $15–25/kg, PETG costs $18–28/kg, and ABS costs $16–25/kg. Budget brands like Hatchbox and eSUN offer reliable quality at the lower end. Premium brands like Prusament and Polymaker cost more but offer tighter tolerances. A 1kg spool lasts most casual users 2–4 weeks of printing.',
  },
];

function PrinterCard({ printer, rank }: { printer: PrinterRow; rank: number }) {
  const name = [printer.brand, printer.model].filter(Boolean).join(' ');
  const slug = printer.printer_id || printer.id;
  const buildVol = printer.build_volume_x && printer.build_volume_y && printer.build_volume_z
    ? `${printer.build_volume_x}×${printer.build_volume_y}×${printer.build_volume_z}mm`
    : null;

  return (
    <Card className="hover:border-primary transition-colors">
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0 w-9 h-9 rounded-full bg-muted flex items-center justify-center font-bold text-muted-foreground text-sm">
            #{rank}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs text-muted-foreground font-medium">{printer.brand}</p>
            <p className="font-semibold truncate text-sm">{printer.model || name}</p>
            <div className="flex flex-wrap gap-1.5 mt-1.5">
              {printer.price_usd != null && (
                <Badge className="bg-green-500/20 text-green-400 border-green-500/30 text-xs">
                  <DollarSign className="w-3 h-3 mr-0.5" />${printer.price_usd}
                </Badge>
              )}
              {printer.max_speed != null && (
                <Badge variant="outline" className="text-xs">
                  <Zap className="w-3 h-3 mr-0.5" />{printer.max_speed}mm/s
                </Badge>
              )}
              {printer.has_enclosure && (
                <Badge variant="outline" className="text-xs">
                  <Shield className="w-3 h-3 mr-0.5" />Enclosed
                </Badge>
              )}
              {buildVol && (
                <Badge variant="outline" className="text-xs">
                  <Layers className="w-3 h-3 mr-0.5" />{buildVol}
                </Badge>
              )}
            </div>
            {printer.compatible_materials && printer.compatible_materials.length > 0 && (
              <p className="text-xs text-muted-foreground mt-1.5">
                Materials: {printer.compatible_materials.slice(0, 5).join(', ')}
              </p>
            )}
          </div>
          <div className="flex-shrink-0">
            <Button asChild size="sm" variant="outline" className="text-xs h-7">
              <Link to={`/printers/${slug}`}>View</Link>
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function SkeletonCard() {
  return (
    <Card><CardContent className="p-4"><div className="flex items-start gap-3">
      <Skeleton className="w-9 h-9 rounded-full" />
      <div className="flex-1 space-y-2">
        <Skeleton className="h-3 w-20" />
        <Skeleton className="h-4 w-48" />
        <div className="flex gap-1.5"><Skeleton className="h-5 w-16 rounded-full" /><Skeleton className="h-5 w-14 rounded-full" /></div>
      </div>
    </div></CardContent></Card>
  );
}

export default function Best3DPrintersUnder500() {
  const { data: printers, isLoading } = useQuery({
    queryKey: ['best-printers-under-500-guide'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('printers')
        .select('id, printer_id, brand, model, price_usd, build_volume_x, build_volume_y, build_volume_z, max_speed, max_temp, has_enclosure, has_auto_leveling, extruder_type, compatible_materials')
        .not('price_usd', 'is', null)
        .lte('price_usd', 500)
        .order('price_usd', { ascending: true })
        .limit(12);
      if (error) throw error;
      return (data ?? []) as unknown as PrinterRow[];
    },
  });

  const ranked = printers ?? [];
  const canonicalUrl = 'https://filascope.com/guides/best-3d-printers-under-500';

  return (
    <>
      <DocumentHead
        title="Best 3D Printers Under $500 (2026) — Top Picks Compared | FilaScope"
        description="The best 3D printers under $500 in 2026. Compare Bambu Lab, Creality, Prusa and more. Real specs, pricing, and material compatibility from our database."
        ogTitle="Best 3D Printers Under $500 — 2026 Buyer's Guide"
        ogDescription="Top-rated 3D printers under $500 compared by speed, build volume, material support, and features. Data-driven recommendations."
      />
      <ArticleSchema
        headline="Best 3D Printers Under $500 (2026) — Top Picks Compared"
        description="The best 3D printers under $500 in 2026. Compare Bambu Lab, Creality, Prusa and more. Real specs, pricing, and material compatibility."
        datePublished="2026-05-11"
        dateModified="2026-05-25"
        url="/guides/best-3d-printers-under-500"
        articleType="TechArticle"
        about={{ '@type': 'Thing', name: 'Budget 3D Printers' }}
        proficiencyLevel="Beginner"
      />

      <div className="min-h-screen bg-background">
        <div className="max-w-4xl mx-auto px-4 py-6">
          <Breadcrumbs items={[
            { name: 'Guides', url: '/guides' },
            { name: 'Best 3D Printers Under $500', url: '/guides/best-3d-printers-under-500' },
          ]} />
        </div>

        {/* Hero */}
        <section className="bg-gradient-to-b from-green-500/5 to-transparent py-12 px-4">
          <div className="max-w-4xl mx-auto">
            <Badge className="mb-4 bg-green-500/10 text-green-400 border-green-500/20">
              <Printer className="w-3 h-3 mr-1" />
              Buyer's Guide · Updated May 2026
            </Badge>
            <h1 className="text-3xl md:text-4xl font-bold mb-4 text-foreground">
              Best 3D Printers Under $500 in 2026
            </h1>
            <p className="text-lg text-muted-foreground leading-relaxed max-w-2xl">
              You don't need to spend a fortune to get an excellent 3D printer in 2026. We've compared the top
              budget options from our printer database, looking at speed, build volume, material compatibility,
              and real-world features that matter.
            </p>
          </div>
        </section>

        <div className="max-w-4xl mx-auto px-4 py-10 space-y-14">

          {/* AI Snippet Zone */}
          <section aria-label="Quick Summary" className="bg-muted/30 border border-border/40 rounded-lg px-5 py-4">
            <p className="text-sm text-muted-foreground leading-relaxed">
              The best 3D printers under $500 in 2026 include the <strong className="text-foreground">Bambu Lab A1</strong> for
              best overall value, the <strong className="text-foreground">Creality K1C</strong> for enclosed engineering printing,
              and the <strong className="text-foreground">Creality Ender 3 V3</strong> for budget beginners. Modern sub-$500 printers
              offer features that cost $1,000+ just two years ago: auto bed leveling, input shaping for high speeds, and
              multi-material capability.
            </p>
            <p className="sr-only">
              Summary: Best 3D printers under $500 in 2026 are Bambu Lab A1 (best value), Creality K1C (best enclosed),
              and Ender 3 V3 (best budget). All offer auto-leveling, high-speed printing, and broad material compatibility.
              Data sourced from FilaScope's printer database.
            </p>
          </section>

          {/* What to Look For */}
          <section>
            <h2 className="text-2xl font-bold mb-4">What to Look for in a Budget 3D Printer</h2>
            <div className="grid sm:grid-cols-2 gap-4">
              {[
                { icon: Zap, title: 'Print Speed', desc: 'Modern printers with input shaping achieve 200–500mm/s. Look for Klipper firmware or Bambu\'s proprietary motion system for fast, quality prints.' },
                { icon: Layers, title: 'Build Volume', desc: 'Standard is ~220×220×250mm. Larger volumes (300mm+) cost more but let you print bigger parts without splitting. Most users are fine with standard.' },
                { icon: Shield, title: 'Material Support', desc: 'PLA and PETG work on any printer. For ABS/ASA/Nylon, you need a 100°C+ heated bed and ideally an enclosure. Check max nozzle temp (260°C+ for engineering materials).' },
                { icon: Printer, title: 'Auto-Leveling', desc: 'Automatic bed leveling is a must-have in 2026. Manual leveling is tedious and error-prone. All recommended printers include auto-leveling.' },
              ].map(({ icon: Icon, title, desc }) => (
                <div key={title} className="flex gap-3 p-4 rounded-lg border border-border bg-card/50">
                  <div className="w-8 h-8 rounded-full bg-green-500/10 border border-green-500/20 flex items-center justify-center shrink-0">
                    <Icon className="w-4 h-4 text-green-400" />
                  </div>
                  <div>
                    <p className="font-semibold text-sm">{title}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Live Ranked Table */}
          <section>
            <h2 className="text-2xl font-bold mb-2">Top 3D Printers Under $500 — From Our Database</h2>
            <p className="text-muted-foreground text-sm mb-4">
              Live data from FilaScope's printer database. All priced at $500 or below.
            </p>
            <div className="space-y-2">
              {isLoading
                ? Array.from({ length: 10 }).map((_, i) => <SkeletonCard key={i} />)
                : ranked.length > 0
                ? ranked.map((p, i) => <PrinterCard key={p.id} printer={p} rank={i + 1} />)
                : (
                  <p className="text-center text-muted-foreground py-8 text-sm">
                    No printers under $500 found.{' '}
                    <Link to="/printers" className="text-green-400 hover:text-green-300">Browse all printers</Link>.
                  </p>
                )
              }
            </div>
            <div className="mt-4">
              <Button asChild variant="outline" size="sm">
                <Link to="/printers">
                  <Printer className="w-4 h-4 mr-1.5" />Browse All Printers
                  <ArrowRight className="w-3.5 h-3.5 ml-1" />
                </Link>
              </Button>
            </div>
          </section>

          {/* Category Picks */}
          <section>
            <h2 className="text-2xl font-bold mb-4">Best Picks by Category</h2>
            <div className="grid sm:grid-cols-3 gap-4">
              {[
                { title: 'Best Overall', pick: 'Bambu Lab A1', price: '~$299', desc: 'Auto-calibration, 500mm/s speed, AMS Lite multi-color option. The most user-friendly printer at this price point.' },
                { title: 'Best Enclosed', pick: 'Creality K1C', price: '~$449', desc: 'CoreXY with full enclosure. Print ABS, ASA, and Nylon reliably. All-metal hotend for high-temp materials.' },
                { title: 'Best Budget', pick: 'Ender 3 V3', price: '~$189', desc: 'Incredible value for beginners. Input shaping, auto-leveling, and decent speed. Huge community support.' },
              ].map(({ title, pick, price, desc }) => (
                <div key={title} className="rounded-lg border border-border bg-card p-4">
                  <Badge className="mb-2 bg-green-500/10 text-green-400 border-green-500/20 text-xs">{title}</Badge>
                  <h3 className="font-semibold mb-0.5">{pick}</h3>
                  <p className="text-xs text-green-400 mb-2">{price}</p>
                  <p className="text-xs text-muted-foreground leading-relaxed">{desc}</p>
                </div>
              ))}
            </div>
          </section>

          {/* Compatibility */}
          <section>
            <h2 className="text-2xl font-bold mb-4">Filament Compatibility at This Price Range</h2>
            <div className="text-muted-foreground space-y-4 text-sm leading-relaxed">
              <p>
                Most sub-$500 printers handle PLA, PETG, and TPU without issues. The main differentiator is whether
                the printer can reliably print high-temperature materials like ABS (240–260°C, bed 100°C+), ASA, and
                Nylon. For these, you need:
              </p>
              <ul className="list-disc pl-5 space-y-1">
                <li>An all-metal hotend (not PTFE-lined, which degrades above 240°C)</li>
                <li>A heated bed reaching 100°C+</li>
                <li>An enclosure (for ABS/ASA — prevents warping from uneven cooling)</li>
              </ul>
              <p>
                Check FilaScope's{' '}
                <Link to="/matrix" className="text-green-400 hover:text-green-300">compatibility matrix</Link>{' '}
                to see which filament materials work with each printer model.
              </p>
            </div>
          </section>

          <FAQSection
            faqs={FAQS}
            title="3D Printers Under $500 — Frequently Asked Questions"
          />

          <RelatedContentBlock
            title="Related Resources"
            links={[
              { label: 'All 3D Printers', href: '/printers', description: 'Browse our complete printer database' },
              { label: 'Filament Compatibility Matrix', href: '/matrix', description: 'Check which filaments work with your printer' },
              { label: 'Best PLA Filaments', href: '/guides/best-pla-filaments', description: 'Top PLA picks to pair with your new printer' },
              { label: 'Best Filaments for Beginners', href: '/guides/best-filaments-for-beginners', description: 'Starter filament recommendations' },
              { label: 'Best Filament for Bambu Lab A1', href: '/guides/best-filament-for-bambu-lab-a1', description: 'Filament picks specifically for the A1' },
              { label: 'Filament Temperature Guide', href: '/guides/filament-temperature-guide', description: 'Settings for every material type' },
            ]}
          />
        </div>
      </div>
    </>
  );
}
