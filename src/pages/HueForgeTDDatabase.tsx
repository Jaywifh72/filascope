import { useState, useMemo } from 'react';
import { Helmet } from 'react-helmet-async';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import {
  Database,
  Download,
  Search,
  ArrowUpDown,
  ExternalLink,
  Filter,
  Sun,
  ChevronRight,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { FAQSchema, DatasetSchema, BreadcrumbSchema } from '@/components/seo';
import { useCurrency } from '@/hooks/useCurrency';

// ── FAQ data ──────────────────────────────────────────────────────────
const faqData = [
  {
    question: 'What TD value should I use for lithophanes?',
    answer:
      'For traditional single-color lithophanes, choose a filament with a TD value between 4 and 8. Higher TD means more light passes through, giving better contrast between thin and thick sections. White or natural PLA in the 4–6 range is the most popular starting point.',
  },
  {
    question: 'Which filament colors work best for HueForge?',
    answer:
      'Black, white, and skin tones are essential for most HueForge projects. Black filaments with very low TD (1–2) create strong shadows, while white with moderate TD (4–6) provides highlights. Build your palette around these anchor colors, then add accent colors as needed.',
  },
  {
    question: 'How do I find a filament\'s TD value?',
    answer:
      'Check this database first — we aggregate TD data from manufacturer specs and community measurements. If your filament isn\'t listed, you can measure it yourself by printing a calibration swatch and counting layers until light no longer passes through, then multiplying by your layer height.',
  },
  {
    question: 'Can I use PETG for HueForge lithophanes?',
    answer:
      'Yes, PETG works for HueForge and lithophanes. PETG tends to have higher TD values than PLA, making it naturally more translucent. This is an advantage for lithophanes but means you may need more layers for opaque regions in multicolor prints.',
  },
  {
    question: 'What is the difference between TD and opacity?',
    answer:
      'TD (Transmission Distance) is measured in millimeters and represents the thickness of filament needed to block light completely. Opacity is a general term for how see-through a material is. TD is more precise — a filament with TD 2 blocks light in 2 mm of printed layers, while TD 8 needs 8 mm. Lower TD = more opaque.',
  },
];

// ── Types ─────────────────────────────────────────────────────────────
interface TDFilament {
  id: string;
  product_title: string | null;
  vendor: string | null;
  material: string | null;
  color_family: string | null;
  color_hex: string | null;
  transmission_distance: number | null;
  variant_price: number | null;
  net_weight_g: number | null;
  product_handle: string | null;
  featured_image: string | null;
}

type SortField = 'vendor' | 'material' | 'transmission_distance' | 'color_family';
type SortDirection = 'asc' | 'desc';

// ── Component ─────────────────────────────────────────────────────────
export default function HueForgeTDDatabase() {
  const [searchTerm, setSearchTerm] = useState('');
  const [materialFilter, setMaterialFilter] = useState<string>('all');
  const [brandFilter, setBrandFilter] = useState<string>('all');
  const [colorFilter, setColorFilter] = useState<string>('all');
  const [sortField, setSortField] = useState<SortField>('transmission_distance');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');
  const { formatPrice } = useCurrency();

  // ── Data query ──────────────────────────────────────────────────────
  const { data: filaments, isLoading } = useQuery({
    queryKey: ['hueforge-td-database'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('filaments')
        .select(
          'id, product_title, vendor, material, color_family, color_hex, transmission_distance, variant_price, net_weight_g, product_handle, featured_image'
        )
        .not('transmission_distance', 'is', null)
        .order('transmission_distance', { ascending: true });
      if (error) throw error;
      return data as TDFilament[];
    },
  });

  // ── Derived filter options ──────────────────────────────────────────
  const { materials, brands, colorFamilies } = useMemo(() => {
    if (!filaments) return { materials: [], brands: [], colorFamilies: [] };
    return {
      materials: [...new Set(filaments.map((f) => f.material).filter(Boolean))].sort() as string[],
      brands: [...new Set(filaments.map((f) => f.vendor).filter(Boolean))].sort() as string[],
      colorFamilies: [...new Set(filaments.map((f) => f.color_family).filter(Boolean))].sort() as string[],
    };
  }, [filaments]);

  const brandCount = brands.length;
  const totalCount = filaments?.length || 0;

  // ── Filter + sort logic ─────────────────────────────────────────────
  const filteredData = useMemo(() => {
    if (!filaments) return [];
    let result = [...filaments];

    if (searchTerm) {
      const s = searchTerm.toLowerCase();
      result = result.filter(
        (f) =>
          f.product_title?.toLowerCase().includes(s) ||
          f.vendor?.toLowerCase().includes(s) ||
          f.color_family?.toLowerCase().includes(s) ||
          f.material?.toLowerCase().includes(s)
      );
    }
    if (materialFilter !== 'all') result = result.filter((f) => f.material === materialFilter);
    if (brandFilter !== 'all') result = result.filter((f) => f.vendor === brandFilter);
    if (colorFilter !== 'all') result = result.filter((f) => f.color_family === colorFilter);

    result.sort((a, b) => {
      let aVal = a[sortField];
      let bVal = b[sortField];
      if (aVal === null) return 1;
      if (bVal === null) return -1;
      if (typeof aVal === 'string') {
        aVal = aVal.toLowerCase();
        bVal = (bVal as string).toLowerCase();
      }
      if (aVal < bVal) return sortDirection === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });
    return result;
  }, [filaments, searchTerm, materialFilter, brandFilter, colorFilter, sortField, sortDirection]);

  // ── Top 10 most opaque ──────────────────────────────────────────────
  const top10 = useMemo(() => (filaments ? filaments.slice(0, 10) : []), [filaments]);

  // ── Sort handler ────────────────────────────────────────────────────
  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  // ── CSV export ──────────────────────────────────────────────────────
  const exportCSV = () => {
    if (!filteredData.length) return;
    const headers = ['Brand', 'Product', 'Material', 'Color Family', 'TD Value', 'Price'];
    const rows = filteredData.map((f) => [
      f.vendor || '',
      f.product_title || '',
      f.material || '',
      f.color_family || '',
      f.transmission_distance?.toString() || '',
      f.variant_price?.toString() || '',
    ]);
    const csv = [headers, ...rows].map((r) => r.map((c) => `"${c}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `hueforge-td-database-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const SortIndicator = ({ field }: { field: SortField }) => (
    <ArrowUpDown
      className={`w-4 h-4 inline ml-1 ${sortField === field ? 'text-primary' : 'text-muted-foreground'}`}
    />
  );

  // ── SEO meta ────────────────────────────────────────────────────────
  const seoTitle = 'HueForge TD Value Database — Transmissivity Data | FilaScope';
  const seoDescription = `Search the world's largest HueForge TD database. Find filament transmissivity values for lithophane printing. Compare TD data across ${totalCount}+ filaments from ${brandCount}+ brands.`;

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-background to-muted/20">
      <Helmet>
        <title>{seoTitle}</title>
        <meta name="description" content={seoDescription} />
        <meta property="og:title" content={seoTitle} />
        <meta property="og:description" content={seoDescription} />
        <meta
          name="keywords"
          content="HueForge TD values, filament TD database, transmissivity data, lithophane filament, HueForge transmissivity, best filament for HueForge"
        />
        <link rel="canonical" href="https://filascope.com/hueforge-td-database" />
      </Helmet>

      <BreadcrumbSchema
        items={[
          { name: 'Home', url: 'https://filascope.com/' },
          { name: 'HueForge TD Database', url: 'https://filascope.com/hueforge-td-database' },
        ]}
      />
      <DatasetSchema
        name="HueForge TD Value Database"
        description="Comprehensive transmissivity distance (TD) values for 3D printing filaments used in HueForge and lithophane projects"
        url="https://filascope.com/hueforge-td-database"
        keywords={[
          'HueForge',
          'TD value',
          'Transmission Distance',
          'transmissivity',
          'lithophane',
          'filament database',
        ]}
        recordCount={totalCount}
      />
      <FAQSchema faqs={faqData} />

      <div className="max-w-7xl mx-auto px-4 py-12">
        {/* ── Hero ──────────────────────────────────────────────────── */}
        <section className="text-center mb-16">
          <Badge variant="outline" className="mb-4 text-sm">
            <Sun className="w-3 h-3 mr-1 text-purple-400" />
            Transmissivity Data
          </Badge>
          <h1 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-purple-400 to-primary bg-clip-text text-transparent">
            HueForge TD Value Database
          </h1>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto mb-8">
            The world's most comprehensive transmissivity database for HueForge lithophane printing.
            Search{' '}
            <span className="text-foreground font-semibold">{totalCount}+</span> filaments by TD
            value, color, and brand.
          </p>

          <div className="flex justify-center gap-8 mb-8">
            <div className="text-center">
              <div className="text-3xl font-bold text-purple-400">{totalCount}</div>
              <div className="text-sm text-muted-foreground">Filaments</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-purple-400">{brandCount}</div>
              <div className="text-sm text-muted-foreground">Brands</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-purple-400">{materials.length}</div>
              <div className="text-sm text-muted-foreground">Materials</div>
            </div>
          </div>

          <div className="flex justify-center gap-3">
            <Button
              onClick={() =>
                document.getElementById('td-table')?.scrollIntoView({ behavior: 'smooth' })
              }
            >
              <Search className="w-4 h-4 mr-2" />
              Find Filaments by TD Value
            </Button>
            <Button variant="outline" onClick={exportCSV} disabled={!filteredData.length}>
              <Download className="w-4 h-4 mr-2" />
              Export CSV
            </Button>
          </div>
        </section>

        {/* ── Educational Content ──────────────────────────────────── */}
        <section className="max-w-4xl mx-auto mb-16 space-y-12">
          <div>
            <h2 className="text-2xl md:text-3xl font-bold mb-4">
              What is TD (Transmissivity Distance) in HueForge?
            </h2>
            <div className="prose prose-lg dark:prose-invert text-muted-foreground space-y-4">
              <p>
                Transmissivity Distance — commonly abbreviated as <strong>TD</strong> — measures how
                far light can travel through a 3D-printed filament wall before it is fully blocked.
                Expressed in millimeters, TD tells you how many layers of printed plastic it takes to
                become completely opaque. A filament with a TD of 2 blocks all light in just 2 mm of
                material, whereas a TD of 8 means light passes through up to 8 mm of thickness.
              </p>
              <p>
                HueForge, the popular software for creating multicolor prints on single-extruder
                printers, relies on accurate TD values to calculate how colors blend when stacked
                layer-by-layer. Without correct TD data the software cannot predict what your finished
                print will look like, often resulting in washed-out colors or muddy shadows.
              </p>
              <p>
                TD values also matter for traditional lithophane printing. A lithophane works by
                varying wall thickness so that backlighting reveals an image — and the contrast of
                that image depends directly on how translucent the filament is. Choosing the right TD
                ensures crisp highlights and deep shadows.
              </p>
            </div>
          </div>

          <div>
            <h2 className="text-2xl md:text-3xl font-bold mb-4">
              How to Use TD Values for Better Lithophanes
            </h2>
            <div className="prose prose-lg dark:prose-invert text-muted-foreground space-y-4">
              <p>
                Start by selecting a filament whose TD matches your project's requirements. For
                standard lithophanes, a TD between 4 and 6 provides the best balance of contrast and
                detail. Lower TD filaments (1–3) are better suited for opaque base layers in
                multicolor HueForge prints, while higher TD filaments (6+) create beautiful
                translucent effects when backlit.
              </p>
              <p>
                Use the filters below to narrow down by material — PLA is the most common choice for
                lithophanes due to its low warping and consistent TD, but PETG offers higher
                translucency and impact resistance. Once you find a candidate filament, click through
                to its detail page for printing temperature recommendations, community photos, and
                pricing.
              </p>
            </div>
          </div>
        </section>

        {/* ── Top 10 Most Popular for HueForge ─────────────────────── */}
        <section className="mb-16">
          <h2 className="text-2xl md:text-3xl font-bold mb-2">Most Popular Filaments for HueForge</h2>
          <p className="text-muted-foreground mb-6">
            The 10 most opaque filaments — lowest TD values, most commonly needed for vivid base
            layers.
          </p>
          {isLoading ? (
            <div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-4">
              {Array.from({ length: 10 }).map((_, i) => (
                <Skeleton key={i} className="h-36" />
              ))}
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-4">
              {top10.map((f, i) => (
                <Link
                  key={f.id}
                  to={`/filament/${f.product_handle || f.id}`}
                  className="block"
                >
                  <Card className="h-full group hover:border-purple-400/50 transition-colors">
                    <CardContent className="pt-4 pb-4">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-xs font-bold text-muted-foreground">#{i + 1}</span>
                        {f.color_hex && (
                          <div
                            className="w-5 h-5 rounded-full border shrink-0"
                            style={{ backgroundColor: f.color_hex }}
                          />
                        )}
                      </div>
                      <p className="text-sm font-semibold line-clamp-1 group-hover:text-primary transition-colors">
                        {f.product_title}
                      </p>
                      <p className="text-xs text-muted-foreground">{f.vendor}</p>
                      <div className="mt-2 flex items-baseline gap-1">
                        <span className="text-lg font-bold text-purple-400">
                          TD {f.transmission_distance}
                        </span>
                        {f.variant_price != null && (
                          <span className="text-xs text-muted-foreground ml-auto">
                            {formatPrice(f.variant_price)}
                          </span>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          )}
        </section>

        {/* ── Filterable Data Table ────────────────────────────────── */}
        <section id="td-table">
          <h2 className="text-2xl md:text-3xl font-bold mb-6">Browse Filaments by TD Value</h2>

          {/* Filters */}
          <Card className="mb-6">
            <CardContent className="pt-6">
              <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    placeholder="Search filaments by name, brand, color…"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <div className="flex flex-wrap gap-3">
                  <Select value={brandFilter} onValueChange={setBrandFilter}>
                    <SelectTrigger className="w-40">
                      <Filter className="w-4 h-4 mr-2" />
                      <SelectValue placeholder="Brand" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Brands</SelectItem>
                      {brands.map((b) => (
                        <SelectItem key={b} value={b}>
                          {b}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <Select value={materialFilter} onValueChange={setMaterialFilter}>
                    <SelectTrigger className="w-40">
                      <Filter className="w-4 h-4 mr-2" />
                      <SelectValue placeholder="Material" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Materials</SelectItem>
                      {materials.map((m) => (
                        <SelectItem key={m} value={m}>
                          {m}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <Select value={colorFilter} onValueChange={setColorFilter}>
                    <SelectTrigger className="w-40">
                      <Filter className="w-4 h-4 mr-2" />
                      <SelectValue placeholder="Color" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Colors</SelectItem>
                      {colorFamilies.map((c) => (
                        <SelectItem key={c} value={c}>
                          {c}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="text-sm text-muted-foreground mb-4">
            Showing {Math.min(filteredData.length, 100)} of {filteredData.length} records
          </div>

          {isLoading ? (
            <div className="space-y-2">
              {Array.from({ length: 10 }).map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : (
            <div className="border rounded-lg overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">Color</TableHead>
                    <TableHead
                      className="cursor-pointer hover:bg-muted/50"
                      onClick={() => handleSort('vendor')}
                    >
                      Brand <SortIndicator field="vendor" />
                    </TableHead>
                    <TableHead>Product</TableHead>
                    <TableHead
                      className="cursor-pointer hover:bg-muted/50"
                      onClick={() => handleSort('material')}
                    >
                      Material <SortIndicator field="material" />
                    </TableHead>
                    <TableHead
                      className="cursor-pointer hover:bg-muted/50"
                      onClick={() => handleSort('color_family')}
                    >
                      Color Family <SortIndicator field="color_family" />
                    </TableHead>
                    <TableHead
                      className="cursor-pointer hover:bg-muted/50 text-right"
                      onClick={() => handleSort('transmission_distance')}
                    >
                      TD Value <SortIndicator field="transmission_distance" />
                    </TableHead>
                    <TableHead className="text-right">Price</TableHead>
                    <TableHead className="w-12" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredData.slice(0, 100).map((f) => (
                    <TableRow key={f.id}>
                      <TableCell>
                        {f.color_hex ? (
                          <div
                            className="w-6 h-6 rounded-full border"
                            style={{ backgroundColor: f.color_hex }}
                          />
                        ) : (
                          <div className="w-6 h-6 rounded-full border bg-muted" />
                        )}
                      </TableCell>
                      <TableCell className="font-medium">{f.vendor}</TableCell>
                      <TableCell className="max-w-[200px] truncate">{f.product_title}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{f.material}</Badge>
                      </TableCell>
                      <TableCell>{f.color_family}</TableCell>
                      <TableCell className="text-right font-mono font-bold text-purple-400">
                        {f.transmission_distance}
                      </TableCell>
                      <TableCell className="text-right text-sm">
                        {f.variant_price != null ? formatPrice(f.variant_price) : '—'}
                      </TableCell>
                      <TableCell>
                        <Button variant="ghost" size="icon" asChild>
                          <Link to={`/filament/${f.product_handle || f.id}`}>
                            <ExternalLink className="w-4 h-4" />
                          </Link>
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              {filteredData.length > 100 && (
                <div className="p-4 text-center text-sm text-muted-foreground border-t">
                  Showing 100 of {filteredData.length} results. Use filters to narrow down or export
                  full dataset.
                </div>
              )}
            </div>
          )}
        </section>

        {/* ── FAQ ──────────────────────────────────────────────────── */}
        <section className="mt-16 max-w-3xl mx-auto">
          <h2 className="text-2xl md:text-3xl font-bold mb-6 text-center">
            Frequently Asked Questions
          </h2>
          <Accordion type="single" collapsible className="w-full">
            {faqData.map((faq, i) => (
              <AccordionItem key={i} value={`faq-${i}`}>
                <AccordionTrigger className="text-left">{faq.question}</AccordionTrigger>
                <AccordionContent className="text-muted-foreground">
                  {faq.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </section>

        {/* ── Cross-links ──────────────────────────────────────────── */}
        <section className="mt-16 flex flex-col sm:flex-row justify-center gap-4">
          <Button variant="outline" asChild>
            <Link to="/hueforge-filaments">
              <ChevronRight className="w-4 h-4 mr-2" />
              HueForge Filament Finder
            </Link>
          </Button>
          <Button variant="outline" asChild>
            <Link to="/td-database">
              <Database className="w-4 h-4 mr-2" />
              Full TD Database
            </Link>
          </Button>
        </section>
      </div>
    </div>
  );
}
