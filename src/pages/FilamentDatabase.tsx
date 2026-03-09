import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { DocumentHead } from '@/components/seo/DocumentHead';
import { BreadcrumbSchema, WebApplicationSchema, FAQSection } from '@/components/seo';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Search, ArrowRight, Database, Tag, Layers } from 'lucide-react';

const FAQS = [
  {
    question: 'How many filaments are in the FilaScope database?',
    answer:
      'FilaScope indexes 1,080+ 3D printer filaments across 48+ brands. The database covers PLA, PETG, ABS, TPU, ASA, Nylon, PC, and specialty materials. Each product includes available specs like nozzle/bed temperature, diameter, net weight, density, mechanical properties, regional pricing, and where available, HueForge TD values.',
  },
  {
    question: 'How do I filter filaments by material or brand?',
    answer:
      'Use the main FilaScope catalog (the homepage search) to filter filaments by material type (PLA, PETG, ABS, etc.), brand, diameter, color, price range, and more. Advanced filters include TD value range, nozzle temperature, and FilaScope quality score. You can also combine multiple filters to narrow down results.',
  },
  {
    question: "How often is FilaScope's filament data updated?",
    answer:
      "FilaScope's database is updated automatically through web scraping and manual verification. Pricing is updated frequently (often weekly) for active products. Specs like nozzle temperature and TD values are verified manually and updated when manufacturers change their formulations. New products are typically added within days of brand announcements.",
  },
  {
    question: 'What is the most popular 3D printer filament material?',
    answer:
      "PLA (Polylactic Acid) is the most popular material by far, accounting for over 56% of all filaments in FilaScope's database. It is the easiest to print, requires the lowest temperatures (190-220°C), and produces excellent surface quality. PETG is the second most popular for users who need more strength and heat resistance.",
  },
  {
    question: 'How do I choose between different filament brands?',
    answer:
      "Compare specs (temperature range, tolerance), pricing across your region, color availability, and community reviews. FilaScope's FilaScore rating weighs all these factors from 1-10. Brands like Bambu Lab, Polymaker, and Prusament consistently score high for documentation and consistency, while eSUN and Hatchbox offer excellent value.",
  },
  {
    question: 'What does HueForge TD value mean on a filament listing?',
    answer:
      "TD (Transmissivity Distance) measures how translucent a filament is when printed — specifically, how many millimeters of light pass through before being blocked. It matters for HueForge lithophane printing and multicolor prints. Lower TD (0.5-2.0) means opaque, higher TD (4.0+) means translucent. FilaScope tracks TD values to help HueForge users find the right filaments.",
  },
  {
    question: 'Why do filament prices vary so much between regions?',
    answer:
      'Filament prices differ due to shipping costs, import duties, local distribution, and currency exchange rates. A filament that costs $20/kg in the US might cost $30/kg equivalent in Canada or Europe after duties. FilaScope tracks real-time pricing from 15+ retailers across 6 regions so you can find the best price for your location.',
  },
];

const MATERIALS = [
  { name: 'PLA', slug: 'pla', desc: 'Easy to print, biodegradable', count: null, color: 'bg-blue-500/20 text-blue-400 border-blue-500/30' },
  { name: 'PETG', slug: 'petg', desc: 'Durable, food-safe options', count: null, color: 'bg-green-500/20 text-green-400 border-green-500/30' },
  { name: 'ABS', slug: 'abs', desc: 'Heat resistant, strong', count: null, color: 'bg-orange-500/20 text-orange-400 border-orange-500/30' },
  { name: 'TPU', slug: 'tpu', desc: 'Flexible, rubber-like', count: null, color: 'bg-pink-500/20 text-pink-400 border-pink-500/30' },
  { name: 'ASA', slug: 'asa', desc: 'UV resistant, outdoor use', count: null, color: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30' },
  { name: 'Nylon', slug: 'nylon', desc: 'Strong, engineering grade', count: null, color: 'bg-purple-500/20 text-purple-400 border-purple-500/30' },
];

const FEATURED_LINKS = [
  { to: '/guides/best-filaments-for-hueforge', label: 'Best for HueForge', desc: 'TD-ranked lithophane picks' },
  { to: '/guides/pla-vs-petg', label: 'PLA vs PETG Guide', desc: 'Comprehensive comparison' },
  { to: '/best-white-filaments', label: 'Best White Filaments', desc: 'Ranked by TD value' },
  { to: '/deals', label: "Today's Deals", desc: 'Filaments on sale now' },
  { to: '/wizard', label: 'Filament Wizard', desc: 'Get personalized picks' },
  { to: '/compare', label: 'Compare Tool', desc: 'Side-by-side comparison' },
];

export default function FilamentDatabase() {
  const [searchQuery, setSearchQuery] = useState('');
  const navigate = useNavigate();

  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ['filament-database-stats'],
    queryFn: async () => {
      const [totalResult, tdResult, brandsResult] = await Promise.all([
        supabase.from('filaments').select('id', { count: 'exact', head: true }),
        supabase.from('filaments').select('id', { count: 'exact', head: true }).not('td_value', 'is', null),
        supabase.from('automated_brands').select('id', { count: 'exact', head: true }).eq('is_visible', true),
      ]);
      return {
        total: totalResult.count ?? 1080,
        withTD: tdResult.count ?? 500,
        brands: brandsResult.count ?? 48,
      };
    },
    staleTime: 1000 * 60 * 10,
  });

  const { data: brands, isLoading: brandsLoading } = useQuery({
    queryKey: ['filament-database-brands'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('automated_brands')
        .select('brand_slug, display_name, logo_url, product_count')
        .eq('is_visible', true)
        .order('product_count', { ascending: false })
        .limit(24);
      if (error) throw error;
      return data;
    },
    staleTime: 1000 * 60 * 10,
  });

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/filaments?search=${encodeURIComponent(searchQuery.trim())}`);
    } else {
      navigate('/filaments');
    }
  };

  const breadcrumbs = [
    { name: 'Home', url: '/' },
    { name: 'Filament Database', url: '/filament-database' },
  ];

  const displayTotal = statsLoading ? '1,080' : stats?.total.toLocaleString();
  const displayBrands = statsLoading ? '48' : String(stats?.brands);

  return (
    <div className="min-h-screen bg-background">
      <DocumentHead
        title={`3D Filament Database — Compare ${displayTotal}+ Products | FilaScope`}
        description={`The most comprehensive 3D printer filament database. Compare PLA, PETG, ABS & more across ${displayBrands}+ brands. Filter by specs, price, TD value & compatibility.`}
        ogType="website"
      />
      <BreadcrumbSchema items={breadcrumbs} />
      <WebApplicationSchema
        name="FilaScope 3D Filament Database"
        url="https://filascope.com/filament-database"
        description={`The most comprehensive 3D printer filament database. Compare PLA, PETG, ABS & more across ${displayBrands}+ brands.`}
        applicationCategory="UtilitiesApplication"
      />

      <div className="max-w-5xl mx-auto px-4 py-8">
        {/* Breadcrumb */}
        <nav className="text-sm text-muted-foreground mb-6 flex items-center gap-1.5">
          <Link to="/" className="hover:text-foreground transition-colors">Home</Link>
          <span>›</span>
          <span>Filament Database</span>
        </nav>

        {/* Hero */}
        <header className="mb-10">
          <h1 className="text-3xl font-bold mb-3">
            Compare 3D Printer Filaments — {displayTotal}+ Products from {displayBrands}+ Brands
          </h1>
          <p className="text-muted-foreground text-lg leading-relaxed mb-6">
            The most comprehensive 3D printer filament database. Compare{' '}
            {statsLoading ? '1,080+' : `${stats?.total.toLocaleString()}+`} filaments across{' '}
            {statsLoading ? '48+' : `${stats?.brands}+`} brands by specs, price, HueForge TD values,
            and printer compatibility — all in one place.
          </p>

          {/* Stats row */}
          <div className="flex flex-wrap gap-4 mb-6">
            {[
              { icon: Database, label: statsLoading ? '1,080+' : `${stats?.total.toLocaleString()}+`, desc: 'Filaments indexed' },
              { icon: Tag, label: statsLoading ? '48+' : `${stats?.brands}+`, desc: 'Brands covered' },
              { icon: Layers, label: statsLoading ? '500+' : `${stats?.withTD}+`, desc: 'With TD values' },
            ].map(({ icon: Icon, label, desc }) => (
              <div key={desc} className="flex items-center gap-2.5 rounded-lg border border-border bg-card px-4 py-2.5">
                <Icon className="w-4 h-4 text-muted-foreground" />
                <div>
                  <span className="font-bold text-sm">{label}</span>
                  <span className="text-xs text-muted-foreground ml-1.5">{desc}</span>
                </div>
              </div>
            ))}
          </div>

          {/* Search */}
          <form onSubmit={handleSearch} className="flex gap-2 max-w-xl">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Search filaments by name, brand, material..."
                className="pl-9"
              />
            </div>
            <Button type="submit">Search</Button>
          </form>
          <p className="text-xs text-muted-foreground mt-2">
            Or{' '}
            <Link to="/" className="text-primary hover:underline">
              browse the full catalog with advanced filters →
            </Link>
          </p>
        </header>

        {/* Material categories */}
        <section className="mb-10">
          <h2 className="text-xl font-semibold mb-4">Browse by Material</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {MATERIALS.map(mat => (
              <Link
                key={mat.name}
                to={`/filaments/${mat.slug}`}
                className="rounded-lg border border-border bg-card p-4 hover:border-primary transition-colors"
              >
                <div className="flex items-center justify-between mb-1">
                  <Badge className={`text-xs ${mat.color}`}>{mat.name}</Badge>
                  <ArrowRight className="w-3.5 h-3.5 text-muted-foreground" />
                </div>
                <p className="text-xs text-muted-foreground">{mat.desc}</p>
              </Link>
            ))}
          </div>
        </section>

        {/* Featured links */}
        <section className="mb-10">
          <h2 className="text-xl font-semibold mb-4">Popular Comparisons & Guides</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {FEATURED_LINKS.map(({ to, label, desc }) => (
              <Link
                key={to}
                to={to}
                className="rounded-lg border border-border bg-card p-4 hover:border-primary transition-colors"
              >
                <p className="font-medium text-sm">{label}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{desc}</p>
              </Link>
            ))}
          </div>
        </section>

        {/* Brand directory */}
        <section className="mb-10">
          <h2 className="text-xl font-semibold mb-4">Browse by Brand</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
            {brandsLoading
              ? Array.from({ length: 12 }).map((_, i) => <Skeleton key={i} className="h-14 rounded-lg" />)
              : brands?.map(brand => (
                  <Link
                    key={brand.brand_slug}
                    to={`/brands/${brand.brand_slug}`}
                    className="rounded-lg border border-border bg-card p-3 hover:border-primary transition-colors flex items-center gap-2.5"
                  >
                    {brand.logo_url ? (
                      <img src={brand.logo_url} alt={brand.display_name} className="w-6 h-6 object-contain flex-shrink-0" />
                    ) : (
                      <div className="w-6 h-6 rounded bg-muted flex-shrink-0" />
                    )}
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate">{brand.display_name}</p>
                      {brand.product_count && (
                        <p className="text-xs text-muted-foreground">{brand.product_count} products</p>
                      )}
                    </div>
                  </Link>
                ))}
          </div>
          <div className="mt-3 text-center">
            <Link
              to="/brands"
              className="text-sm text-muted-foreground hover:text-foreground transition-colors inline-flex items-center gap-1"
            >
              View all {stats?.brands ?? 48}+ brands
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </section>

        {/* About the database */}
        <section className="mb-10 rounded-lg border border-border bg-card p-6">
          <h2 className="text-lg font-semibold mb-3">About the FilaScope Database</h2>
          <p className="text-muted-foreground text-sm leading-relaxed mb-3">
            FilaScope is the most comprehensive free 3D printer filament database. We automatically 
            scrape and verify data from 48+ brand websites, aggregating specs, pricing, and availability 
            across multiple regions (US, EU, UK, CA, AU, JP).
          </p>
          <p className="text-muted-foreground text-sm leading-relaxed mb-3">
            Our unique TD (Transmission Distance) database is the largest publicly available collection 
            of HueForge filament data, covering 500+ filaments with community-verified transmission 
            distance values for lithophane printing.
          </p>
          <p className="text-muted-foreground text-sm leading-relaxed">
            FilaScope is free to use. We earn revenue through affiliate commissions when you purchase 
            through our retailer links — this never affects our data or rankings.{' '}
            <Link to="/methodology" className="text-primary hover:underline">Read our methodology →</Link>
          </p>
        </section>

        <FAQSection faqs={FAQS} />
      </div>
    </div>
  );
}
