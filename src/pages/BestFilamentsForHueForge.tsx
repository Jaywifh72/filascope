import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { DocumentHead } from '@/components/seo/DocumentHead';
import { BreadcrumbSchema, ItemListSchema, FAQSection, ArticleSchema } from '@/components/seo';
import { RelatedContentBlock } from '@/components/seo/RelatedContentBlock';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { normalizeColorHex } from '@/lib/utils';
import { ArrowRight, Sun, DollarSign, Info, Zap } from 'lucide-react';

const FAQS = [
  {
    question: 'What is the best TD value for HueForge?',
    answer:
      'TD (Transmission Distance) values for HueForge typically range from 0.5 to 6.0mm. For lithophanes, values between 1.0–3.0mm work best. Lower TD means more opaque (better for dark/anchor layers), higher TD means more translucent (better for light/highlight layers). Your white base filament should ideally have a TD of 1.5–4.0.',
  },
  {
    question: 'Can I use any PLA for HueForge?',
    answer:
      'Technically yes, but results vary greatly. HueForge requires measured TD values for each specific filament to generate accurate layer profiles. Without a known TD value, the lithophane output will be unpredictable. White and black filaments act as critical anchors in most projects — their TD values must be precise. Use filaments with community-verified TD values for best results.',
  },
  {
    question: 'How do I find TD values for my filament?',
    answer:
      'FilaScope maintains the largest public TD value database with 500+ filaments. Search by brand, color, or material on the HueForge TD Database page. You can also measure TD yourself using the HueForge app by printing a series of test squares at known layer heights.',
  },
  {
    question: "What is silk PLA's TD value?",
    answer:
      "Silk PLA filaments typically have high TD values (5.0+), making them more translucent than standard PLA. This makes silk PLA excellent for highlight/bright layers in HueForge stacks. Check FilaScope's database for specific measurements by color.",
  },
  {
    question: 'Do I need special HueForge settings per filament?',
    answer:
      'Yes. Each filament needs its own TD profile in HueForge. The app uses TD values to calculate exactly how many layers of each filament are needed to achieve the correct opacity gradient. Import your filament profiles from FilaScope directly into HueForge, or enter the TD value manually for each color slot in your stack.',
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
  td_value: number | null;
}

function FilamentCard({ filament, rank }: { filament: FilamentRow; rank: number }) {
  const slug = filament.product_handle || filament.id;
  const name = filament.display_name || filament.product_title;
  const hex = normalizeColorHex(filament.color_hex);

  return (
    <Card className="hover:border-primary transition-colors">
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0 w-8 h-8 rounded-full bg-muted flex items-center justify-center font-bold text-sm text-muted-foreground">
            {rank}
          </div>
          <div
            className="flex-shrink-0 w-8 h-8 rounded-full border border-border"
            style={{ backgroundColor: hex }}
            title={filament.color_family || 'Color'}
          />
          <div className="flex-1 min-w-0">
            <p className="text-xs text-muted-foreground font-medium">{filament.vendor}</p>
            <p className="font-semibold text-sm truncate">{name}</p>
            <div className="flex flex-wrap gap-1.5 mt-1.5">
              {filament.td_value && (
                <Badge className="bg-purple-500/20 text-purple-400 border-purple-500/30 text-xs">
                  <Sun className="w-3 h-3 mr-1" />
                  TD {filament.td_value}
                </Badge>
              )}
              {filament.material && (
                <Badge variant="secondary" className="text-xs">
                  {filament.material}
                </Badge>
              )}
              {filament.variant_price && (
                <Badge variant="outline" className="text-xs">
                  <DollarSign className="w-3 h-3" />{filament.variant_price.toFixed(2)}
                </Badge>
              )}
            </div>
          </div>
          <div className="flex-shrink-0 flex flex-col gap-1.5">
            <Button asChild size="sm" variant="outline" className="text-xs h-7">
              <Link to={`/filament/${slug}`}>View</Link>
            </Button>
            <Button asChild size="sm" variant="ghost" className="text-xs h-7">
              <Link to={`/compare?add=${slug}`}>Compare</Link>
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function SkeletonCard() {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <Skeleton className="w-8 h-8 rounded-full" />
          <Skeleton className="w-8 h-8 rounded-full" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-3 w-20" />
            <Skeleton className="h-4 w-48" />
            <div className="flex gap-1.5">
              <Skeleton className="h-5 w-16 rounded-full" />
              <Skeleton className="h-5 w-12 rounded-full" />
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function BestFilamentsForHueForge() {
  const { data: filaments, isLoading } = useQuery({
    queryKey: ['hueforge-best-filaments'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('filaments')
        .select('id, product_handle, product_title, display_name, vendor, material, color_family, color_hex, variant_price, td_value')
        .not('td_value', 'is', null)
        .order('td_value', { ascending: true })
        .limit(20);
      if (error) throw error;
      return (data ?? []) as unknown as FilamentRow[];
    },
  });

  const top10 = filaments?.slice(0, 10) ?? [];
  const budget = filaments?.filter(f => f.variant_price != null && f.variant_price < 25).slice(0, 5) ?? [];

  const breadcrumbs = [
    { name: 'Home', url: '/' },
    { name: 'Best Filaments for HueForge', url: '/best-filaments-for-hueforge' },
  ];

  const itemListItems = top10.map((f, i) => ({
    name: `${f.vendor} ${f.display_name || f.product_title}`,
    url: `https://filascope.com/filament/${f.product_handle || f.id}`,
    description: `TD: ${f.td_value} — ${f.material || 'Filament'}`,
    position: i + 1,
  }));

  return (
    <div className="min-h-screen bg-background">
      <DocumentHead
        title="Best Filament for HueForge 2026 — TD-Ranked Picks | FilaScope"
        description="Find the best HueForge filament for lithophanes and color mixing. TD-ranked picks for PLA, silk, and translucent filaments. Compare TD values, prices & buy links."
        ogType="article"
      />
      <BreadcrumbSchema items={breadcrumbs} />
      <ArticleSchema
        headline="Best Filaments for HueForge in 2026 — TD-Ranked Picks"
        description="Find the best HueForge filament for lithophanes and color mixing. TD-ranked picks for PLA, silk, and translucent filaments. Compare TD values, prices & buy links."
        datePublished="2025-01-15"
        dateModified="2026-02-20"
        url="/best-filaments-for-hueforge"
        articleType="TechArticle"
        about={{ '@type': 'Thing', name: 'HueForge 3D Printing' }}
        proficiencyLevel="Beginner"
      />
      <ItemListSchema
        name="Best Filaments for HueForge 2026 — TD-Ranked"
        description="Top-ranked filaments for HueForge lithophane printing, sorted by Transmission Distance (TD) value."
        items={itemListItems}
      />

      <div className="max-w-4xl mx-auto px-4 py-8">
        <nav className="text-sm text-muted-foreground mb-6 flex items-center gap-1.5">
          <Link to="/" className="hover:text-foreground transition-colors">Home</Link>
          <span>›</span>
          <span>Best Filaments for HueForge</span>
        </nav>

        <header className="mb-10">
          <h1 className="text-3xl font-bold mb-3">
            Best Filaments for HueForge in 2026 — TD-Ranked Picks
          </h1>
          <p className="text-muted-foreground text-lg leading-relaxed">
            HueForge lithophanes live and die by Transmission Distance (TD) values. We've ranked the
            top 3D printing filaments from 48+ brands by their verified TD data, so you can build
            perfect lithophane stacks without guesswork.
          </p>
          <div className="flex flex-wrap gap-3 mt-4">
            <Link to="/hueforge-td-database" className="inline-flex items-center gap-1.5 text-sm text-purple-400 hover:text-purple-300 transition-colors">
              <Sun className="w-4 h-4" />View Full TD Database<ArrowRight className="w-3.5 h-3.5" />
            </Link>
            <Link to="/compare" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors">
              <Zap className="w-4 h-4" />Compare Filaments<ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </header>

        <section className="mb-10">
          <h2 className="text-xl font-semibold mb-4">What Makes a Good HueForge Filament?</h2>
          <div className="grid sm:grid-cols-3 gap-4">
            {[
              { icon: Sun, label: 'Known TD Value', desc: 'A community-verified TD value is essential. Without it, HueForge cannot generate accurate layer profiles.' },
              { icon: Info, label: 'Consistent Color', desc: 'Batch-to-batch color consistency matters. Inconsistent pigmentation changes your TD value between spools.' },
              { icon: DollarSign, label: 'Right Price Point', desc: 'HueForge projects use multiple filaments. Budget-friendly options let you experiment without overspending.' },
            ].map(({ icon: Icon, label, desc }) => (
              <div key={label} className="rounded-lg border border-border bg-card p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Icon className="w-4 h-4 text-purple-400" />
                  <span className="font-medium text-sm">{label}</span>
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="mb-10">
          <h2 className="text-xl font-semibold mb-2">Top 10 Filaments by TD Value</h2>
          <p className="text-muted-foreground text-sm mb-4">Sorted ascending — lower TD values are more opaque and ideal for base/dark layers.</p>
          <div className="space-y-2">
            {isLoading ? Array.from({ length: 10 }).map((_, i) => <SkeletonCard key={i} />) : top10.map((f, i) => <FilamentCard key={f.id} filament={f} rank={i + 1} />)}
          </div>
        </section>

        {(budget.length > 0 || isLoading) && (
          <section className="mb-10">
            <h2 className="text-xl font-semibold mb-2">Best Budget HueForge Filaments</h2>
            <p className="text-muted-foreground text-sm mb-4">Quality TD-verified filaments under $25 per spool.</p>
            <div className="space-y-2">
              {isLoading ? Array.from({ length: 5 }).map((_, i) => <SkeletonCard key={i} />) : budget.map((f, i) => <FilamentCard key={f.id} filament={f} rank={i + 1} />)}
            </div>
          </section>
        )}

        <section className="mb-10 rounded-lg border border-border bg-card p-6">
          <h2 className="text-lg font-semibold mb-2">Best White Filaments for Lithophanes</h2>
          <p className="text-muted-foreground text-sm mb-4">
            White filaments are the cornerstone of every HueForge lithophane — they act as the light-transmitting base layer.
          </p>
          <Button asChild variant="outline">
            <Link to="/best-white-filaments">View Best White Filaments<ArrowRight className="w-4 h-4 ml-1.5" /></Link>
          </Button>
        </section>

        <section className="mb-10">
          <h2 className="text-xl font-semibold mb-4">How to Choose the Right TD Value</h2>
          <div className="text-muted-foreground space-y-3 text-sm leading-relaxed">
            <p>TD values in HueForge represent how far light travels through your filament at a 1mm layer height. Higher = more translucent, lower = more opaque.</p>
            <ul className="list-disc list-inside space-y-1">
              <li><strong className="text-foreground">Dark/base layer (black anchor):</strong> TD 0.5–1.5 — very opaque</li>
              <li><strong className="text-foreground">Mid-tone layers:</strong> TD 1.5–3.0 — balanced opacity</li>
              <li><strong className="text-foreground">Light/highlight layers (white, natural):</strong> TD 3.0–5.0</li>
              <li><strong className="text-foreground">Silk PLA / special effects:</strong> TD 5.0+ — highly translucent</li>
            </ul>
            <p>
              Use{' '}
              <Link to="/hueforge-td-database" className="text-purple-400 hover:text-purple-300">FilaScope's TD Database</Link>{' '}
              to find exact values, or check the{' '}
              <Link to="/guides/hueforge-filaments" className="text-purple-400 hover:text-purple-300">HueForge Filaments Guide</Link>{' '}
              for a complete setup walkthrough.
            </p>
          </div>
        </section>

        <FAQSection faqs={FAQS} />

        <RelatedContentBlock
          title="Related Guides"
          className="mt-8"
          links={[
            { label: 'HueForge TD Database', href: '/hueforge-td-database', description: 'Search all filament TD values' },
            { label: 'Best White Filaments', href: '/best-white-filaments', description: 'Essential base layer filaments for HueForge' },
            { label: 'Filament Temperature Guide', href: '/filament-temperature-guide', description: 'Print settings for every material type' },
            { label: 'Best PLA Filaments', href: '/guides/best-pla-filaments', description: 'Top PLA picks across all categories' },
          ]}
        />
      </div>
    </div>
  );
}
