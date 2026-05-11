import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { DocumentHead } from '@/components/seo/DocumentHead';
import { ArticleSchema, ItemListSchema, FAQSection, Breadcrumbs } from '@/components/seo';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { normalizeColorHex } from '@/lib/utils';
import { ArrowRight, DollarSign, AlertTriangle, CheckCircle } from 'lucide-react';

const FAQS = [
  {
    question: 'What is the cheapest PLA filament?',
    answer: 'The cheapest PLA filaments typically come from eSUN, Overture, Hatchbox, and house-brand offerings from Amazon. Prices range from $12–20 per 1kg spool in the US. eSUN PLA+ consistently delivers excellent quality at budget prices while remaining very affordable. Check FilaScope\'s live pricing for current lowest prices.',
  },
  {
    question: 'Is cheap filament bad for your printer?',
    answer: 'Not necessarily — but low-quality cheap filament can cause clogs, inconsistent extrusion, and failed prints. The risk is diameter inconsistency (poor tolerance control), low-quality drying during manufacturing (leading to moisture issues), and inconsistent pigmentation. Stick to budget brands with a proven track record like eSUN, Overture, and Bambu Lab rather than truly unknown brands.',
  },
  {
    question: 'How much should 3D printer filament cost?',
    answer: 'Quality 1kg PLA spools should cost $15–28 USD. PETG runs slightly higher at $18–35. Engineering materials (Nylon, PC) range from $35–80+ per kg. Prices have dropped significantly since 2022 due to Bambu Lab\'s market entry and increased competition. If you see PLA below $12/kg from an unknown brand, quality may be inconsistent.',
  },
  {
    question: 'Where can I get the cheapest filament?',
    answer: 'Amazon offers competitive pricing with fast shipping. Bambu Lab runs regular sales on their house-brand filaments. MatterHackers and Printed Solid offer deals on premium brands. eSUN\'s AliExpress store ships internationally at very low prices. FilaScope tracks live pricing from 48+ retailers so you can compare without leaving the site.',
  },
  {
    question: 'Is eSUN good filament?',
    answer: 'Yes — eSUN is one of the most reliable budget filament brands. They manufacture to consistent tolerances (+/- 0.05mm diameter), publish technical data sheets for most products, and have been a staple in the 3D printing community for years. Their PLA+ is a particularly popular budget option that outperforms many higher-priced competitors.',
  },
];

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
  filascope_score: number | null;
}

function FilamentCard({ f, rank }: { f: FilamentRow; rank: number }) {
  const hex = normalizeColorHex(f.color_hex);
  const name = f.display_name || f.product_title;
  return (
    <Link to={`/filament/${f.product_handle || f.id}`}>
      <Card className="border-border hover:border-primary/50 hover:bg-card/80 transition-all group h-full">
        <CardContent className="p-4 flex items-center gap-4">
          <span className="text-2xl font-bold text-muted-foreground/30 w-8 shrink-0">#{rank}</span>
          {hex && (
            <div
              className="w-8 h-8 rounded-full border border-border shrink-0"
              style={{ backgroundColor: hex }}
              aria-hidden="true"
            />
          )}
          <div className="flex-1 min-w-0">
            <div className="font-semibold text-sm group-hover:text-primary transition-colors truncate">{name}</div>
            <div className="text-xs text-muted-foreground">{f.vendor} · {f.material || 'Filament'}</div>
          </div>
          {f.variant_price && (
            <Badge className="bg-green-500/10 text-green-400 border-green-500/30 text-sm font-bold shrink-0">
              ${f.variant_price.toFixed(2)}
            </Badge>
          )}
        </CardContent>
      </Card>
    </Link>
  );
}

export default function CheapestFilament() {
  const { data: cheapest, isLoading: loadingCheapest } = useQuery({
    queryKey: ['cheapest-filaments'],
    queryFn: async () => {
      const { data } = await supabase
        .from('filaments')
        .select('id, product_handle, product_title, display_name, vendor, material, color_family, color_hex, variant_price, filascope_score')
        .not('variant_price', 'is', null)
        .gt('variant_price', 5)
        .order('variant_price', { ascending: true })
        .limit(12);
      return (data ?? []) as FilamentRow[];
    },
    staleTime: 1000 * 60 * 30,
  });

  const { data: budgetPLA, isLoading: loadingPLA } = useQuery({
    queryKey: ['budget-pla-quality'],
    queryFn: async () => {
      const { data } = await supabase
        .from('filaments')
        .select('id, product_handle, product_title, display_name, vendor, material, color_family, color_hex, variant_price, filascope_score')
        .eq('material', 'PLA')
        .not('filascope_score', 'is', null)
        .not('variant_price', 'is', null)
        .lt('variant_price', 30)
        .order('filascope_score', { ascending: false })
        .limit(8);
      return (data ?? []) as FilamentRow[];
    },
    staleTime: 1000 * 60 * 30,
  });

  const breadcrumbs = [
    { name: 'Home', url: '/' },
    { name: 'Cheapest 3D Printer Filament', url: '/cheapest-filament' },
  ];

  const itemListItems = (cheapest ?? []).map((f, i) => ({
    name: `${f.vendor} ${f.display_name || f.product_title}`,
    url: `https://filascope.com/filament/${f.product_handle || f.id}`,
    description: f.variant_price ? `$${f.variant_price.toFixed(2)} per spool` : 'Budget filament',
    position: i + 1,
  }));

  return (
    <>
      <DocumentHead
        title="Cheapest 3D Printer Filament 2026 — Best Budget PLA & PETG | FilaScope"
        description="Find the cheapest 3D printer filament in 2026. Budget PLA, PETG, and more ranked by price and quality score. Don't sacrifice quality for cheap filament."
        ogType="article"
      />
      <ArticleSchema
        headline="Cheapest 3D Printer Filament in 2026 — Budget Picks That Don't Sacrifice Quality"
        description="The cheapest 3D printer filament options in 2026, ranked by price with quality scores to help you find genuinely good budget filament."
        datePublished="2026-01-01"
        dateModified="2026-05-11"
        url="/cheapest-filament"
      />
      <ItemListSchema
        name="Cheapest 3D Printer Filament 2026"
        description="Budget 3D printer filaments sorted by price with quality scores"
        items={itemListItems}
      />

      <div className="min-h-screen bg-background">
        <section className="bg-gradient-to-b from-primary/5 to-transparent py-12 px-4">
          <div className="max-w-4xl mx-auto">
            <Breadcrumbs items={breadcrumbs} className="mb-6" />
            <Badge className="mb-4 bg-green-500/10 text-green-400 border-green-500/30">Budget Guide · Updated Feb 2026</Badge>
            <h1 className="text-3xl md:text-4xl font-bold mb-4 text-foreground">
              Cheapest 3D Printer Filament in 2026 — Budget Picks That Don't Sacrifice Quality
            </h1>
            <p className="text-lg text-muted-foreground leading-relaxed max-w-2xl">
              The filament market has matured dramatically — you no longer have to pay premium prices for reliable prints.
              Budget doesn't mean bad. This page tracks the lowest-priced filaments across our database and helps you
              separate genuinely affordable quality filaments from cheap options that will cost you in failed prints.
            </p>
          </div>
        </section>

        <div className="max-w-4xl mx-auto px-4 py-10 space-y-14">

          {/* What to look for */}
          <section>
            <h2 className="text-2xl font-bold mb-4">What Makes Budget Filament Reliable?</h2>
            <div className="prose prose-sm max-w-none text-muted-foreground space-y-3">
              <p>
                The 3D printing filament market has seen enormous price compression since 2022. Brands like eSUN, Overture,
                and Polymaker have pushed quality up while keeping prices flat. Meanwhile, Bambu Lab's entry into the filament
                market with their house-brand PLA created competitive pressure that benefits consumers — good 1kg PLA spools
                now cost $15–22 from reputable brands, down from $25–35 just a few years ago.
              </p>
              <p>
                When evaluating cheap filament, look for three things: <strong className="text-foreground">diameter
                tolerance</strong> (+/- 0.05mm or better prevents inconsistent extrusion and clogs),
                <strong className="text-foreground"> moisture content</strong> (well-dried filament is vacuum sealed with
                desiccant, not loose in a bag), and <strong className="text-foreground">brand history</strong> (brands that
                have been around for 3+ years with community track records are far less risky than unknown imports).
              </p>
              <p>
                PLA has the most competitive pricing because it is the highest-volume material — economies of scale benefit
                you here. PETG is slightly higher due to more complex manufacturing. Engineering materials (Nylon, PC,
                carbon fiber) have less volume and fewer producers, so budget options are rarer and riskier.
              </p>
              <p>
                Prices on FilaScope are updated regularly from 15+ retailers across US, EU, AU, and CA regions.
                Use the <Link to="/deals" className="text-primary hover:underline">Deals page</Link> for flash sales
                and limited-time discounts across all brands.
              </p>
            </div>
          </section>

          {/* Warning box */}
          <section>
            <div className="rounded-xl border border-yellow-500/20 bg-yellow-500/5 p-5 flex gap-4">
              <AlertTriangle className="w-5 h-5 text-yellow-500 shrink-0 mt-0.5" />
              <div>
                <h3 className="font-semibold text-sm mb-1">When to Spend More</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  For functional parts under mechanical load, engineering materials, or critical applications — do not
                  buy the cheapest option. CF composites, Nylon, and PC filaments need proper formulation to achieve
                  their rated mechanical properties. Stick to brands with published technical data sheets for these materials.
                </p>
              </div>
            </div>
          </section>

          {/* Cheapest right now */}
          <section>
            <h2 className="text-2xl font-bold mb-2">Cheapest 3D Printer Filaments Right Now</h2>
            <p className="text-sm text-muted-foreground mb-6">Sorted by current lowest price per spool across all materials.</p>
            {loadingCheapest ? (
              <div className="grid sm:grid-cols-2 gap-4">
                {Array.from({ length: 12 }).map((_, i) => <Skeleton key={i} className="h-20 rounded-xl" />)}
              </div>
            ) : (
              <div className="grid sm:grid-cols-2 gap-4">
                {(cheapest ?? []).map((f, i) => <FilamentCard key={f.id} f={f} rank={i + 1} />)}
              </div>
            )}
          </section>

          {/* Best budget PLA by quality */}
          <section>
            <h2 className="text-2xl font-bold mb-2">Best Cheap PLA Filaments — Quality Ranked</h2>
            <p className="text-sm text-muted-foreground mb-6">
              PLA filaments under $30/spool, ranked by FilaScore — so the top entries offer the best combination of quality and price.
            </p>
            <div className="grid sm:grid-cols-2 gap-4">
              {loadingPLA
                ? Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} className="h-20 rounded-xl" />)
                : (budgetPLA ?? []).map((f, i) => <FilamentCard key={f.id} f={f} rank={i + 1} />)}
            </div>
            <div className="mt-4 text-center">
              <Link to="/filaments/pla" className="inline-flex items-center gap-2 text-sm text-primary hover:underline">
                View all PLA filaments <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </section>

          {/* What you get for the money */}
          <section>
            <h2 className="text-2xl font-bold mb-4">Budget Guide: What You Get at Each Price Point</h2>
            <div className="space-y-3">
              {[
                { range: 'Under $15/kg', color: 'text-green-400', items: ['No-name or very early eSUN — use caution, look for reviews', 'Risk: diameter inconsistency, poor drying, colour deviation', 'OK for calibration prints, throwaway prototypes'] },
                { range: '$15–22/kg', color: 'text-blue-400', items: ['eSUN PLA+, Overture, Bambu Lab house-brand', 'Reliable for most hobby prints', 'Consistent diameter, decent technical data', 'Best price-to-quality ratio in 2026'] },
                { range: '$22–35/kg', color: 'text-purple-400', items: ['Polymaker, Prusament, Bambu Lab Engineering', 'Premium consistency and color accuracy', 'Ideal for HueForge, detailed miniatures, functional parts', 'Published technical data sheets'] },
                { range: '$35+/kg', color: 'text-orange-400', items: ['Specialty engineering materials, CF composites', 'PA/Nylon, PC, PA-CF, PETG-CF from quality brands', 'Required for structural applications', 'Do not buy cheap versions of these'] },
              ].map(({ range, color, items }) => (
                <Card key={range} className="border-border">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <DollarSign className={`w-4 h-4 ${color}`} />
                      <span className="font-semibold text-sm">{range}</span>
                    </div>
                    <ul className="space-y-1">
                      {items.map((item, i) => (
                        <li key={i} className="text-xs text-muted-foreground flex items-start gap-2">
                          <CheckCircle className="w-3 h-3 text-muted-foreground/40 shrink-0 mt-0.5" />
                          {item}
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
                { to: '/deals', label: 'Live Filament Deals & Sales' },
                { to: '/guides/best-budget-filaments', label: 'Best Budget Filaments Guide' },
                { to: '/filaments/pla', label: 'All PLA Filaments' },
                { to: '/guides/best-filaments-for-beginners', label: 'Best Filaments for Beginners' },
                { to: '/best-3d-printer-filament', label: 'Best 3D Printer Filament Overall' },
                { to: '/filament-types', label: 'Filament Types Guide' },
              ].map((link) => (
                <Link key={link.to} to={link.to} className="flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors">
                  <ArrowRight className="w-3.5 h-3.5 text-primary shrink-0" />
                  {link.label}
                </Link>
              ))}
            </div>
          </section>

          <FAQSection faqs={FAQS} title="Frequently Asked Questions — Cheapest 3D Printer Filament" />
        </div>
      </div>
    </>
  );
}
