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
import { normalizeColorHex } from '@/lib/utils';
import { useResolvedPrice } from '@/hooks/useResolvedPrice';
import { Sun, ArrowRight, Zap, Thermometer, Palette } from 'lucide-react';

interface FilamentRow {
  id: string;
  product_handle: string | null;
  product_title: string;
  display_name: string | null;
  vendor: string;
  material: string | null;
  color_family: string | null;
  color_hex: string | null;
  variant_price: number | null;
  price_cad: number | null;
  price_eur: number | null;
  price_gbp: number | null;
  price_aud: number | null;
  price_jpy: number | null;
  net_weight_g: number | null;
  pack_quantity: number | null;
  transmission_distance: number | null;
  nozzle_temp_min: number | null;
  nozzle_temp_max: number | null;
  bed_temp_min: number | null;
  bed_temp_max: number | null;
}

const MATERIAL_GUIDE = [
  {
    material: 'PLA',
    tempRange: '190–220°C nozzle / 55–65°C bed',
    speed: 'Up to 500mm/s with A1',
    amsCompatible: true,
    notes: 'The default choice. A1 prints PLA beautifully at high speed. Bambu Lab PLA Basic is pre-tuned in the slicer.',
    topUse: 'Prototypes, decorative items, HueForge lithophanes',
  },
  {
    material: 'PETG',
    tempRange: '230–250°C nozzle / 70–80°C bed',
    speed: 'Up to 300mm/s (HF variants)',
    amsCompatible: true,
    notes: 'Use Bambu Lab PETG HF for best high-speed results. Increase retraction by 1mm over PLA settings.',
    topUse: 'Functional parts, outdoor items, mechanical components',
  },
  {
    material: 'ABS / ASA',
    tempRange: '240–260°C nozzle / 90–100°C bed',
    speed: 'Up to 200mm/s',
    amsCompatible: true,
    notes: 'A1 is open-frame — printing ABS requires a DIY enclosure or warm room. ASA is easier and UV-resistant.',
    topUse: 'Automotive parts, high-temp applications, outdoor use',
  },
  {
    material: 'TPU',
    tempRange: '220–240°C nozzle / 40–60°C bed',
    speed: '20–60mm/s (slow down significantly)',
    amsCompatible: false,
    notes: 'Direct-drive on A1 handles TPU well. Do NOT run TPU through the AMS — it will jam. Load directly into the extruder.',
    topUse: 'Phone cases, gaskets, vibration dampeners, flexible parts',
  },
  {
    material: 'PLA-CF',
    tempRange: '210–230°C nozzle / 55–65°C bed',
    speed: 'Up to 300mm/s',
    amsCompatible: true,
    notes: 'Carbon fiber PLA needs a hardened steel nozzle (A1 ships with stainless — upgrade recommended). Beautiful matte finish.',
    topUse: 'Stiff functional parts, aesthetic matte finishes',
  },
];

const FAQS = [
  {
    question: 'What filament does the Bambu Lab A1 come with?',
    answer: 'The Bambu Lab A1 typically ships with a small starter spool of Bambu Lab PLA Basic (usually white or a random color, ~250g). This is enough for a few test prints. You\'ll want to buy additional spools — Bambu Lab PLA Basic is the recommended starting point for new A1 owners.',
  },
  {
    question: 'Can the Bambu Lab A1 print ABS?',
    answer: 'The A1 can reach ABS temperatures (240–260°C nozzle, 100°C bed), but being an open-frame printer, ABS will warp and crack without an enclosure. For occasional ABS prints, a DIY enclosure (cardboard box, IKEA LACK enclosure, or third-party enclosure) helps significantly. For regular ABS printing, consider the enclosed Bambu Lab P1S instead.',
  },
  {
    question: 'Can I use non-Bambu filament in the A1?',
    answer: 'Absolutely. The A1 works with any standard 1.75mm filament from any brand. You may need to manually set temperatures and flow rates for non-Bambu filaments, but the Bambu Studio slicer has profiles for many popular brands. Third-party filaments from Polymaker, Hatchbox, eSUN, and Overture all work well.',
  },
  {
    question: 'Is the AMS Lite worth it for the A1?',
    answer: 'The AMS Lite enables automatic multi-color printing and automatic spool switching when one spool runs out. It\'s worth it if you print multi-color models, want to run 4 colors without manual changes, or want to always have filament loaded and ready. It does NOT support TPU or very flexible filaments. For single-color printing, it\'s a convenience but not essential.',
  },
  {
    question: 'What is the best cheap filament for the Bambu Lab A1?',
    answer: 'For budget printing on the A1, Hatchbox PLA (~$18–20/kg) and eSUN PLA+ (~$16–20/kg) offer excellent quality at low prices. Overture PLA ($16–18/kg) is another reliable budget option. All three produce consistent results on the A1 with minimal tuning.',
  },
  {
    question: 'Do I need a hardened nozzle for carbon fiber filament?',
    answer: 'Yes. Carbon fiber (CF) filaments are abrasive and will wear out a standard stainless steel nozzle within 1–2 spools. The A1 ships with a stainless steel nozzle. For CF filaments, upgrade to a hardened steel nozzle ($10–15 from Bambu Lab). The same applies to glow-in-the-dark and metal-filled filaments.',
  },
];

function FilamentRankRow({ filament, rank }: { filament: FilamentRow; rank: number }) {
  const slug = filament.product_handle || filament.id;
  const name = filament.display_name || filament.product_title;
  const hex = normalizeColorHex(filament.color_hex, '#FFFFFF');
  const resolved = useResolvedPrice(filament);

  return (
    <Card className="hover:border-primary transition-colors">
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0 w-9 h-9 rounded-full bg-muted flex items-center justify-center font-bold text-muted-foreground text-sm">
            #{rank}
          </div>
          <div className="flex-shrink-0 w-9 h-9 rounded-full border-2 border-border shadow-sm" style={{ backgroundColor: hex }} title={filament.color_family || ''} />
          <div className="flex-1 min-w-0">
            <p className="text-xs text-muted-foreground font-medium">{filament.vendor}</p>
            <p className="font-semibold truncate text-sm">{name}</p>
            <p className="text-xs text-muted-foreground">{filament.color_family} · {filament.material}</p>
            <div className="flex flex-wrap gap-1.5 mt-1.5">
              {filament.transmission_distance != null && (
                <Badge className="bg-purple-500/20 text-purple-400 border-purple-500/30 text-xs">
                  <Sun className="w-3 h-3 mr-1" />TD {filament.transmission_distance}
                </Badge>
              )}
              {resolved.formattedSpoolPrice && (
                <Badge variant="outline" className="text-xs">
                  {resolved.formattedSpoolPrice}
                </Badge>
              )}
              {filament.nozzle_temp_max != null && (
                <Badge variant="outline" className="text-xs">
                  <Thermometer className="w-3 h-3 mr-0.5" />{filament.nozzle_temp_min}–{filament.nozzle_temp_max}°C
                </Badge>
              )}
            </div>
          </div>
          <div className="flex-shrink-0 flex flex-col gap-1.5">
            <Button asChild size="sm" variant="outline" className="text-xs h-7"><Link to={`/filament/${slug}`}>View</Link></Button>
            <Button asChild size="sm" variant="ghost" className="text-xs h-7"><Link to={`/compare?add=${slug}`}>Compare</Link></Button>
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
      <Skeleton className="w-9 h-9 rounded-full" />
      <div className="flex-1 space-y-2">
        <Skeleton className="h-3 w-20" />
        <Skeleton className="h-4 w-48" />
        <div className="flex gap-1.5"><Skeleton className="h-5 w-16 rounded-full" /><Skeleton className="h-5 w-14 rounded-full" /></div>
      </div>
    </div></CardContent></Card>
  );
}

export default function BestFilamentForBambuLabA1() {
  const { data: filaments, isLoading } = useQuery({
    queryKey: ['best-filament-bambu-a1-guide'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('filaments')
        .select('id, product_handle, product_title, display_name, vendor, material, color_family, color_hex, variant_price, price_cad, price_eur, price_gbp, price_aud, price_jpy, net_weight_g, pack_quantity, transmission_distance, nozzle_temp_min, nozzle_temp_max, bed_temp_min, bed_temp_max')
        .in('material', ['PLA', 'PETG'])
        .not('variant_price', 'is', null)
        .order('variant_price', { ascending: true })
        .limit(12);
      if (error) throw error;
      return (data ?? []) as unknown as FilamentRow[];
    },
  });

  const ranked = filaments ?? [];
  const canonicalUrl = 'https://filascope.com/guides/best-filament-for-bambu-lab-a1';

  return (
    <>
      <DocumentHead
        title="Best Filament for Bambu Lab A1 (2026) — Top Picks with AMS Compatibility | FilaScope"
        description="The best filaments for the Bambu Lab A1 in 2026. PLA, PETG, and specialty picks with AMS Lite compatibility, pricing, and print settings."
        ogTitle="Best Filament for Bambu Lab A1 — 2026 Guide"
        ogDescription="Top filament picks for Bambu Lab A1 with AMS compatibility notes, material breakdown, and pricing data from FilaScope."
      />
      <ArticleSchema
        headline="Best Filament for Bambu Lab A1 (2026) — Top Picks"
        description="The best filaments for the Bambu Lab A1. PLA, PETG, and specialty picks with AMS Lite compatibility and print settings."
        datePublished="2026-05-11"
        dateModified="2026-05-25"
        url="/guides/best-filament-for-bambu-lab-a1"
        articleType="TechArticle"
        about={{ '@type': 'Thing', name: 'Bambu Lab A1 Filament' }}
        proficiencyLevel="Beginner"
      />

      <div className="min-h-screen bg-background">
        <div className="max-w-4xl mx-auto px-4 py-6">
          <Breadcrumbs items={[
            { name: 'Guides', url: '/guides' },
            { name: 'Best Filament for Bambu Lab A1', url: '/guides/best-filament-for-bambu-lab-a1' },
          ]} />
        </div>

        {/* Hero */}
        <section className="bg-gradient-to-b from-green-500/5 to-transparent py-12 px-4">
          <div className="max-w-4xl mx-auto">
            <Badge className="mb-4 bg-green-500/10 text-green-400 border-green-500/20">
              <Zap className="w-3 h-3 mr-1" />
              Printer-Specific Guide · Updated May 2026
            </Badge>
            <h1 className="text-3xl md:text-4xl font-bold mb-4 text-foreground">
              Best Filament for Bambu Lab A1 (2026)
            </h1>
            <p className="text-lg text-muted-foreground leading-relaxed max-w-2xl">
              The Bambu Lab A1 is one of the best-value 3D printers available, but choosing the right filament
              makes all the difference. This guide covers the top filament picks for PLA, PETG, and specialty
              materials — all with AMS Lite compatibility notes and optimized print settings.
            </p>
          </div>
        </section>

        <div className="max-w-4xl mx-auto px-4 py-10 space-y-14">

          {/* AI Snippet Zone */}
          <section aria-label="Quick Summary" className="bg-muted/30 border border-border/40 rounded-lg px-5 py-4">
            <p className="text-sm text-muted-foreground leading-relaxed">
              The best filament for the Bambu Lab A1 is <strong className="text-foreground">Bambu Lab PLA Basic</strong> for
              everyday printing — it's pre-tuned in Bambu Studio slicer and offers excellent quality at $19.99/kg. For
              functional parts, <strong className="text-foreground">Bambu Lab PETG HF</strong> handles high-speed printing
              up to 300mm/s. Third-party filaments from Polymaker, Hatchbox, and eSUN also work great. The A1 accepts
              any standard 1.75mm filament with AMS Lite support for PLA and PETG.
            </p>
            <p className="sr-only">
              Summary: Best filament for Bambu Lab A1 is Bambu Lab PLA Basic for everyday prints and PETG HF for functional
              parts. Any 1.75mm filament works. AMS Lite supports PLA and PETG (not TPU). Third-party brands like
              Polymaker, Hatchbox, and eSUN are compatible.
            </p>
          </section>

          {/* A1 Quick Specs */}
          <section>
            <h2 className="text-2xl font-bold mb-4">Bambu Lab A1 Filament Specs</h2>
            <div className="grid sm:grid-cols-3 gap-4">
              {[
                { label: 'Filament Diameter', value: '1.75mm', desc: 'Standard — all major brands' },
                { label: 'Max Nozzle Temp', value: '300°C', desc: 'Handles all common materials' },
                { label: 'Max Bed Temp', value: '100°C', desc: 'Hot enough for PETG, ABS, ASA' },
                { label: 'Extruder Type', value: 'Direct Drive', desc: 'Excellent TPU and retraction control' },
                { label: 'AMS Lite Support', value: 'Yes (4 slots)', desc: 'Multi-color PLA/PETG printing' },
                { label: 'Nozzle Type', value: 'Stainless Steel', desc: 'Upgrade to hardened for CF filaments' },
              ].map(({ label, value, desc }) => (
                <div key={label} className="p-3 rounded-lg border border-border bg-card/50">
                  <p className="text-xs text-muted-foreground">{label}</p>
                  <p className="font-semibold text-sm">{value}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{desc}</p>
                </div>
              ))}
            </div>
          </section>

          {/* Material Breakdown */}
          <section>
            <h2 className="text-2xl font-bold mb-4">Materials Compatible with the Bambu Lab A1</h2>
            <div className="space-y-4">
              {MATERIAL_GUIDE.map((mat) => (
                <Card key={mat.material} className="border-border">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <h3 className="font-semibold text-sm">{mat.material}</h3>
                        <p className="text-xs text-muted-foreground">{mat.tempRange}</p>
                      </div>
                      <div className="flex gap-1.5">
                        <Badge variant="outline" className="text-xs">
                          <Zap className="w-3 h-3 mr-0.5" />{mat.speed}
                        </Badge>
                        <Badge
                          className={mat.amsCompatible
                            ? 'bg-green-500/10 text-green-400 border-green-500/20 text-xs'
                            : 'bg-red-500/10 text-red-400 border-red-500/20 text-xs'
                          }
                        >
                          {mat.amsCompatible ? 'AMS ✓' : 'AMS ✗'}
                        </Badge>
                      </div>
                    </div>
                    <p className="text-sm text-muted-foreground mb-1.5">{mat.notes}</p>
                    <p className="text-xs text-green-400">Best for: {mat.topUse}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </section>

          {/* Live Ranked Filaments */}
          <section>
            <h2 className="text-2xl font-bold mb-2">Top Filaments for the A1 — From Our Database</h2>
            <p className="text-muted-foreground text-sm mb-4">
              PLA and PETG filaments sorted by price. All are compatible with the Bambu Lab A1.
            </p>
            <div className="space-y-2">
              {isLoading
                ? Array.from({ length: 10 }).map((_, i) => <SkeletonCard key={i} />)
                : ranked.length > 0
                ? ranked.map((f, i) => <FilamentRankRow key={f.id} filament={f} rank={i + 1} />)
                : (
                  <p className="text-center text-muted-foreground py-8 text-sm">
                    No filaments found.{' '}
                    <Link to="/filament-database" className="text-green-400 hover:text-green-300">Browse all filaments</Link>.
                  </p>
                )
              }
            </div>
            <div className="mt-4">
              <Button asChild variant="outline" size="sm">
                <Link to="/filament-database">
                  <Palette className="w-4 h-4 mr-1.5" />Browse All Filaments
                  <ArrowRight className="w-3.5 h-3.5 ml-1" />
                </Link>
              </Button>
            </div>
          </section>

          {/* Top Picks by Category */}
          <section>
            <h2 className="text-2xl font-bold mb-4">Our Top Picks by Category</h2>
            <div className="grid sm:grid-cols-3 gap-4">
              {[
                { title: 'Best Overall PLA', pick: 'Bambu Lab PLA Basic', price: '~$20/kg', desc: 'Pre-tuned slicer profiles, excellent consistency, wide color selection. The obvious first choice for A1 owners.' },
                { title: 'Best for Functional Parts', pick: 'Bambu Lab PETG HF', price: '~$22/kg', desc: 'High-flow formula optimized for A1 speeds. Excellent layer adhesion up to 300mm/s. Low stringing.' },
                { title: 'Best Budget Option', pick: 'Hatchbox PLA', price: '~$18/kg', desc: 'Proven reliability at a lower price point. Works great on the A1 with minimal tuning. Wide color selection.' },
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

          {/* AMS Lite Tips */}
          <section>
            <h2 className="text-2xl font-bold mb-4">AMS Lite Compatibility & Tips</h2>
            <div className="text-muted-foreground space-y-4 text-sm leading-relaxed">
              <p>
                The Bambu Lab AMS Lite is a 4-slot automatic material system that enables multi-color printing and
                automatic spool switching. Here's what you need to know about filament compatibility:
              </p>
              <ul className="list-disc pl-5 space-y-2">
                <li><strong className="text-foreground">PLA, PETG, ABS, ASA:</strong> All AMS Lite compatible. Use standard spools (200mm diameter recommended).</li>
                <li><strong className="text-foreground">TPU:</strong> NOT AMS Lite compatible. The flexible filament jams in the AMS feed mechanism. Load TPU directly into the A1's extruder, bypassing the AMS.</li>
                <li><strong className="text-foreground">Third-party spools:</strong> Most standard 1kg spools fit the AMS Lite. Oversized spools (3kg+) may not fit. Bambu Lab sells reusable spool adapters for cardboard spool brands.</li>
                <li><strong className="text-foreground">Multi-material:</strong> Don't mix PLA and PETG in the same print — they don't bond well at interfaces. Use the same material family for multi-color prints.</li>
              </ul>
            </div>
          </section>

          <FAQSection
            faqs={FAQS}
            title="Bambu Lab A1 Filament — Frequently Asked Questions"
          />

          <RelatedContentBlock
            title="Related Resources"
            links={[
              { label: 'Best PLA Filaments', href: '/guides/best-pla-filaments', description: 'Top PLA picks ranked by quality and value' },
              { label: 'Best PETG Filaments', href: '/guides/best-petg-filaments', description: 'Top PETG picks for functional parts' },
              { label: 'Filament Compatibility Matrix', href: '/matrix', description: 'Check which filaments work with your printer' },
              { label: '3D Printers Under $500', href: '/guides/best-3d-printers-under-500', description: 'Top budget printer recommendations' },
              { label: 'Filament Temperature Guide', href: '/guides/filament-temperature-guide', description: 'Settings for every material' },
              { label: 'Filament Drying Guide', href: '/guides/filament-drying-guide', description: 'How to dry and store filament' },
            ]}
          />
        </div>
      </div>
    </>
  );
}
