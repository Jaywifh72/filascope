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
import { ArrowRight, Sun, DollarSign, Palette } from 'lucide-react';

const FAQS = [
  {
    question: 'Why do white filaments matter for HueForge?',
    answer: 'White filaments serve as the critical base layer in HueForge lithophane stacks. They provide the light-transmitting foundation that makes the lithophane glow when backlit. The TD value of your white filament directly controls how much light passes through the base, affecting overall brightness and contrast.',
  },
  {
    question: 'What is the difference between white and natural filament?',
    answer: "White filaments contain white pigment (titanium dioxide), making them more opaque with a lower TD value. Natural/translucent filaments contain no pigment and are significantly more translucent with higher TD values. For HueForge, white is used when you want controlled opacity; natural works for highlight/glow layers. Natural filament also slightly yellows the light passing through it.",
  },
  {
    question: 'What TD value should my white filament have?',
    answer: 'For most HueForge lithophane projects, a white filament with TD between 1.5–4.0mm is ideal. Lower TD (1.5–2.5) gives a more opaque white with strong contrast. Higher TD (3.0–4.0) lets more light through for subtle, detailed lithophanes. Start with a tested white PLA in the 2.0–3.0mm range.',
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

function FilamentRankCard({ filament, rank }: { filament: FilamentRow; rank: number }) {
  const slug = filament.product_handle || filament.id;
  const name = filament.display_name || filament.product_title;
  const hex = normalizeColorHex(filament.color_hex, '#FFFFFF');

  return (
    <Card className="hover:border-primary transition-colors">
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0 w-9 h-9 rounded-full bg-muted flex items-center justify-center font-bold text-muted-foreground text-sm">
            #{rank}
          </div>
          <div className="flex-shrink-0 w-9 h-9 rounded-full border-2 border-border shadow-sm" style={{ backgroundColor: hex }} title={filament.color_family || 'White'} />
          <div className="flex-1 min-w-0">
            <p className="text-xs text-muted-foreground font-medium">{filament.vendor}</p>
            <p className="font-semibold truncate">{name}</p>
            <p className="text-xs text-muted-foreground">{filament.color_family} · {filament.material}</p>
            <div className="flex flex-wrap gap-1.5 mt-1.5">
              {filament.td_value && (
                <Badge className="bg-purple-500/20 text-purple-400 border-purple-500/30 text-xs">
                  <Sun className="w-3 h-3 mr-1" />TD {filament.td_value}
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

export default function BestWhiteFilaments() {
  const { data: filaments, isLoading } = useQuery({
    queryKey: ['white-filaments-ranked'],
    queryFn: async () => {
      const { data: byFamily } = await supabase
        .from('filaments')
        .select('id, product_handle, product_title, display_name, vendor, material, color_family, color_hex, variant_price, td_value')
        .in('color_family', ['White', 'Natural'])
        .not('td_value', 'is', null)
        .order('td_value', { ascending: true })
        .limit(30);

      if (byFamily && byFamily.length >= 10) return (byFamily ?? []) as unknown as FilamentRow[];

      const { data: byColor } = await supabase
        .from('filaments')
        .select('id, product_handle, product_title, display_name, vendor, material, color_family, color_hex, variant_price, td_value')
        .not('td_value', 'is', null)
        .order('td_value', { ascending: true })
        .limit(30);

      return (byColor ?? []) as unknown as FilamentRow[];
    },
  });

  const allRanked = filaments ?? [];

  const breadcrumbs = [{ name: 'Home', url: '/' }, { name: 'Best White Filaments', url: '/best-white-filaments' }];

  const itemListItems = allRanked.slice(0, 10).map((f, i) => ({
    name: `${f.vendor} ${f.display_name || f.product_title}`,
    url: `https://filascope.com/filament/${f.product_handle || f.id}`,
    description: `TD: ${f.td_value} — ${f.color_family || 'White'} ${f.material || 'Filament'}`,
    position: i + 1,
  }));

  return (
    <div className="min-h-screen bg-background">
      <DocumentHead
        title="Best White Filaments for 3D Printing & HueForge | FilaScope"
        description="Compare white 3D printer filaments ranked by TD value, print quality & price. Find the perfect white PLA for HueForge lithophanes and general printing."
        ogType="article"
      />
      <BreadcrumbSchema items={breadcrumbs} />
      <ArticleSchema
        headline="Best White Filaments for 3D Printing & HueForge — TD-Ranked"
        description="Compare white 3D printer filaments ranked by TD value, print quality & price. Find the perfect white PLA for HueForge lithophanes and general printing."
        datePublished="2025-06-01"
        dateModified="2026-05-11"
        url="/best-white-filaments"
        articleType="TechArticle"
        about={{ '@type': 'Thing', name: 'White 3D Printer Filament for HueForge' }}
        proficiencyLevel="Beginner"
      />
      <ItemListSchema name="Best White 3D Printer Filaments — Ranked by TD Value" description="White and natural 3D printer filaments ranked by TD value for HueForge lithophane projects." items={itemListItems} />

      <div className="max-w-4xl mx-auto px-4 py-8">
        <nav className="text-sm text-muted-foreground mb-6 flex items-center gap-1.5">
          <Link to="/" className="hover:text-foreground transition-colors">Home</Link>
          <span>›</span>
          <span>Best White Filaments</span>
        </nav>

        <header className="mb-10">
          <h1 className="text-3xl font-bold mb-3">Best White Filaments for 3D Printing &amp; HueForge</h1>
          <p className="text-muted-foreground text-lg leading-relaxed">
            White filaments are the most critical choice for HueForge lithophanes — they act as your light-transmitting base layer. We've ranked the best white and natural filaments by TD value using verified data from 57 brands.
          </p>
          <div className="flex flex-wrap gap-3 mt-4">
            <Link to="/hueforge-td-database" className="inline-flex items-center gap-1.5 text-sm text-purple-400 hover:text-purple-300 transition-colors">
              <Sun className="w-4 h-4" />Full TD Database<ArrowRight className="w-3.5 h-3.5" />
            </Link>
            <Link to="/color-finder?hex=FFFFFF" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors">
              <Palette className="w-4 h-4" />Color Finder<ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </header>

        <section className="mb-10 rounded-lg border border-border bg-card p-6">
          <h2 className="text-lg font-semibold mb-3">Why White Filaments for HueForge?</h2>
          <p className="text-muted-foreground text-sm leading-relaxed">
            In HueForge lithophane printing, your white/natural filament forms the base that all light passes through. Its TD value determines how much light transmits through the full stack. Too low a TD = flat, overexposed lithophane. Too high = dark details disappear. The sweet spot is typically TD 2.0–3.5.
          </p>
        </section>

        <section className="mb-10">
          <h2 className="text-xl font-semibold mb-2">White &amp; Natural Filaments — Ranked by TD Value</h2>
          <p className="text-muted-foreground text-sm mb-4">Sorted ascending — lower TD = more opaque. Higher TD = more translucent.</p>
          <div className="space-y-2">
            {isLoading ? Array.from({ length: 10 }).map((_, i) => <SkeletonCard key={i} />) : allRanked.map((f, i) => <FilamentRankCard key={f.id} filament={f} rank={i + 1} />)}
            {!isLoading && allRanked.length === 0 && (
              <p className="text-center text-muted-foreground py-8 text-sm">
                No white filaments with TD values found. Check the <Link to="/hueforge-td-database" className="text-purple-400 hover:text-purple-300">TD Database</Link> for all filaments with TD data.
              </p>
            )}
          </div>
        </section>

        <section className="mb-10">
          <h2 className="text-xl font-semibold mb-4">Natural vs White — What's the Difference?</h2>
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="rounded-lg border border-border bg-card p-4">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-6 h-6 rounded-full bg-white border border-border" />
                <span className="font-semibold">White Filament</span>
              </div>
              <ul className="space-y-1.5 text-sm text-muted-foreground">
                <li>• Contains white pigment (TiO₂)</li>
                <li>• Lower TD values (more opaque)</li>
                <li>• Bright, clean white appearance</li>
                <li>• TD typically 1.0–4.0mm</li>
              </ul>
            </div>
            <div className="rounded-lg border border-border bg-card p-4">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-6 h-6 rounded-full bg-amber-50/40 border border-border" />
                <span className="font-semibold">Natural Filament</span>
              </div>
              <ul className="space-y-1.5 text-sm text-muted-foreground">
                <li>• No pigment — raw polymer</li>
                <li>• Higher TD values (more translucent)</li>
                <li>• Slightly warm/yellow tint</li>
                <li>• TD typically 4.0–8.0mm</li>
              </ul>
            </div>
          </div>
        </section>

        <section className="mb-10">
          <h2 className="text-xl font-semibold mb-4">Related Resources</h2>
          <div className="grid sm:grid-cols-3 gap-3">
            {[
              { to: '/guides/best-filaments-for-hueforge', label: 'Best HueForge Filaments', desc: 'All materials, TD-ranked' },
              { to: '/hueforge-td-database', label: 'TD Value Database', desc: '500+ verified TD values' },
              { to: '/compare', label: 'Compare Filaments', desc: 'Side-by-side spec comparison' },
            ].map(({ to, label, desc }) => (
              <Link key={to} to={to} className="rounded-lg border border-border bg-card p-4 hover:border-primary transition-colors">
                <p className="font-medium text-sm">{label}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{desc}</p>
              </Link>
            ))}
          </div>
        </section>

        <FAQSection faqs={FAQS} />

        <RelatedContentBlock
          title="Related Guides"
          className="mt-8"
          links={[
            { label: 'Best Filaments for HueForge', href: '/guides/best-filaments-for-hueforge', description: 'TD-ranked picks for lithophane printing' },
            { label: 'HueForge TD Database', href: '/hueforge-td-database', description: 'Full transmissivity database' },
            { label: 'PLA vs PETG', href: '/guides/pla-vs-petg', description: 'Which material is best for your project?' },
            { label: 'Best Filaments for Beginners', href: '/guides/best-filaments-for-beginners', description: 'Easy-to-print filament recommendations' },
          ]}
        />
      </div>
    </div>
  );
}
