import { useState, useMemo, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { DocumentHead } from '@/components/seo/DocumentHead';
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
  RefreshCw,
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
import { FAQSchema, DatasetSchema, BreadcrumbSchema, Breadcrumbs } from '@/components/seo';
import { FilamentsNeedingTdSection } from '@/components/filament/td-community/FilamentsNeedingTdSection';
import { TdSubstituteFinder } from '@/components/hueforge/TdSubstituteFinder';
import { LayerPreviewCompact } from '@/components/hueforge/layer-preview/LayerPreviewCompact';
import { HowToSchema } from '@/components/seo/HowToSchema';
import { RelatedContentBlock } from '@/components/seo/RelatedContentBlock';
import { useCurrency } from '@/hooks/useCurrency';
import { trackTDSearch as trackGA4TDSearch } from '@/lib/analytics';
import { TdRangeSlider } from '@/components/hueforge/TdRangeSlider';
import { TdDistributionChart } from '@/components/hueforge/TdDistributionChart';
import { TdValueCell } from '@/components/hueforge/TdValueCell';

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
  {
    question: 'What TD value should I use for HueForge?',
    answer:
      'The ideal TD depends on the layer role. For dark anchor layers (black), use TD 0.5–1.5. For mid-tones, use TD 1.5–3.0. For highlights and white layers, TD 3.0–6.0 works best. Silk and translucent filaments with TD 5.0+ create beautiful glow effects but are harder to control in multi-layer stacks. Always match your TD values to the HueForge color profile for accurate previews.',
  },
  {
    question: 'Where can I find HueForge TD values for my filament?',
    answer:
      'FilaScope maintains the world\'s largest verified HueForge TD database. Search by brand, color, or material on this page. If your filament isn\'t listed, check the HueForge community spreadsheet, ask in the HueForge Discord, or measure it yourself using a calibration print.',
  },
  {
    question: 'How do I measure TD values for filaments not in the database?',
    answer:
      'Print a calibration swatch — a flat rectangle at 100% infill — starting at 0.2mm layer height. Shine a bright light (phone flashlight works) behind the print and count the number of layers where light is still visible. Multiply the layer count by your layer height (e.g., 15 layers × 0.2mm = TD 3.0). Repeat at different thicknesses for accuracy. Many makers share their measurements in the HueForge community.',
  },
  {
    question: 'Can I use any PLA filament for HueForge?',
    answer:
      'Technically yes, but results vary dramatically. Standard PLA typically has TD values between 2.0–5.0, which works well. However, matte PLA tends to have lower TD (more opaque), silk PLA has very high TD (more translucent), and PLA+ can vary by brand. For best results, use filaments with known, verified TD values from this database rather than guessing.',
  },
  {
    question: 'What filament should I use for HueForge?',
    answer:
      'For HueForge projects, choose filaments with known TD (Transmission Distance) values. White PLA with TD values between 1.0–4.0mm is ideal for most lithophane-style projects. FilaScope\'s HueForge TD database tracks transmissivity data for 500+ filaments from 40+ brands to help you find the perfect match.',
  },
  {
    question: 'What is the best white filament for HueForge?',
    answer:
      'The best white filaments for HueForge have consistent, well-documented TD values. Popular choices include Polymaker PolyTerra PLA White and Bambu Lab PLA Basic White. The ideal TD value depends on your project — lower TD values (1–2mm) create higher contrast, while higher values (3–5mm) create softer, more translucent effects.',
  },
  {
    question: 'How do I measure filament TD value?',
    answer:
      'TD (Transmission Distance) is measured by printing a calibration block at known thickness and measuring light transmission. The HueForge software includes a calibration tool for this purpose. Alternatively, use FilaScope\'s pre-measured TD database with values for 500+ filaments so you don\'t need to measure yourself.',
  },
  {
    question: 'What is the difference between TD value and transmissivity?',
    answer:
      'In HueForge, TD (Transmission Distance) represents the thickness in millimeters at which a filament transitions from opaque to translucent. It is a practical measurement specific to HueForge. General transmissivity is a broader physics term. For HueForge projects, TD value is the measurement that matters.',
  },
];

// People Also Ask data (merged into FAQPage schema)
const paaData = [
  {
    question: 'What is a good TD value for HueForge?',
    answer:
      'The ideal TD value depends on the filament\'s role in your print. Black/dark filaments work best at TD 0.1–1.0 (very opaque). Dark mid-tones perform well at TD 1.0–1.5. Standard colors should be TD 1.5–5.0 for balanced light control. White filaments are best at TD 3.5–5.0+ for highlights. Translucent and silk filaments at TD 5.0–10.0+ create dramatic glow effects but are harder to control.',
  },
  {
    question: 'What filament brand has the best HueForge colors?',
    answer:
      'Polymaker and Bambu Lab have the most comprehensive TD data coverage in the FilaScope database, with verified values across dozens of colors. eSUN, Hatchbox, and Prusament also have strong coverage. The best brand depends on color availability in your region — use this database to filter by brand and see which has verified TD values for the colors you need.',
  },
  {
    question: 'Can I use PETG for HueForge?',
    answer:
      'Yes, PETG works for HueForge and lithophanes. PETG typically has higher TD values than PLA of the same color, making it naturally more translucent. This is advantageous for lithophanes (brighter results with fewer layers) but means you may need more layers for opaque regions in multicolor HueForge prints. White PETG is a popular choice for bright, high-contrast lithophanes.',
  },
  {
    question: 'How do I measure filament TD?',
    answer:
      'Print a flat calibration swatch at 100% infill using 0.2mm layer height. Shine a bright light behind the swatch and count layers where light passes through. Multiply layer count by layer height (e.g., 15 layers × 0.2mm = TD 3.0). For a detailed step-by-step guide with calibration tips, see How to Measure Filament TD.',
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
  const [searchParams, setSearchParams] = useSearchParams();
  const [searchTerm, setSearchTerm] = useState('');
  const [materialFilter, setMaterialFilter] = useState<string>('all');
  const [brandFilter, setBrandFilter] = useState<string>('all');
  const [colorFilter, setColorFilter] = useState<string>('all');
  const [sortField, setSortField] = useState<SortField>('transmission_distance');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');
  const { formatPrice } = useCurrency();

  // TD range from URL params or default
  const [tdRange, setTdRange] = useState<[number, number]>(() => {
    const min = parseFloat(searchParams.get('td_min') || '0');
    const max = parseFloat(searchParams.get('td_max') || '10');
    return [isNaN(min) ? 0 : min, isNaN(max) ? 10 : max];
  });

  const handleTdRangeChange = useCallback((range: [number, number]) => {
    setTdRange(range);
    const params = new URLSearchParams(searchParams);
    if (range[0] === 0 && range[1] === 10) {
      params.delete('td_min');
      params.delete('td_max');
    } else {
      params.set('td_min', range[0].toString());
      params.set('td_max', range[1].toString());
    }
    setSearchParams(params, { replace: true });
  }, [searchParams, setSearchParams]);

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

  // Lightweight count query for accurate SEO meta (not capped by row limit)
  const { data: tdCounts } = useQuery({
    queryKey: ['hueforge-td-counts'],
    queryFn: async () => {
      const { count } = await supabase
        .from('filaments')
        .select('id', { count: 'exact', head: true })
        .not('transmission_distance', 'is', null);
      const { data: brandData } = await supabase
        .from('filaments')
        .select('vendor')
        .not('transmission_distance', 'is', null)
        .not('vendor', 'is', null);
      const uniqueBrands = new Set((brandData ?? []).map((f: { vendor: string }) => f.vendor));
      return { totalFilaments: count ?? 0, totalBrands: uniqueBrands.size };
    },
    staleTime: 10 * 60_000,
  });

  const brandCount = tdCounts?.totalBrands || brands.length;
  const totalCount = tdCounts?.totalFilaments || filaments?.length || 0;

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

    // TD range filter
    if (tdRange[0] > 0 || tdRange[1] < 10) {
      result = result.filter((f) => {
        const td = f.transmission_distance;
        if (td == null) return false;
        return td >= tdRange[0] && td <= tdRange[1];
      });
    }

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
  }, [filaments, searchTerm, materialFilter, brandFilter, colorFilter, tdRange, sortField, sortDirection]);

  // GA4: track TD search when filters change
  useEffect(() => {
    if (searchTerm || colorFilter !== 'all') {
      trackGA4TDSearch(colorFilter !== 'all' ? colorFilter : searchTerm, null, filteredData.length);
    }
  }, [searchTerm, colorFilter, filteredData.length]);

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
  const seoTitle = 'HueForge TD Value Database — Filament Transmissivity Data for Lithophanes | FilaScope';
  const seoDescription = totalCount > 100
    ? `Search the world's largest HueForge TD value database with transmissivity data for ${totalCount}+ filaments from ${brandCount}+ brands. Find the perfect filament for lithophane printing.`
    : "Search the world's largest HueForge TD value database with transmissivity data for 500+ filaments from 40+ brands. Find the perfect filament for lithophane printing with FilaScope.";

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-background to-muted/20">
      <DocumentHead
        title={seoTitle}
        description={seoDescription}
        ogTitle={seoTitle}
        ogDescription={seoDescription}
        keywords="HueForge TD values, filament TD database, transmissivity data, lithophane filament, HueForge transmissivity, best filament for HueForge"
      />

      <Breadcrumbs
        items={[{ name: "HueForge TD Database", url: "/hueforge-td-database" }]}
        className="max-w-7xl mx-auto px-4 pt-6 pb-1"
      />
      <DatasetSchema
        name="HueForge Transmissivity Distance (TD) Database"
        description="The world's most comprehensive database of transmissivity distance (TD) values for 3D printing filaments used in HueForge lithophane and multicolor printing. Includes TD values, colors, materials, and pricing across 48+ brands."
        url="https://filascope.com/hueforge-td-database"
        keywords={[
          'HueForge',
          'transmissivity distance',
          'TD value',
          'lithophane filament',
          '3D printing filament data',
          'filament TD database',
        ]}
        creator={{ '@type': 'Organization', name: 'FilaScope', url: 'https://filascope.com' }}
        temporalCoverage="2024/.."
        spatialCoverage="Global"
        variableMeasured={[
          { '@type': 'PropertyValue', name: 'Transmissivity Distance (TD)', unitText: 'mm' },
        ]}
        distribution={{
          '@type': 'DataDownload',
          encodingFormat: 'text/csv',
          contentUrl: 'https://filascope.com/hueforge-td-database',
        }}
        isAccessibleForFree={true}
        license="https://filascope.com/terms"
      />
      <FAQSchema faqs={[...faqData, ...paaData]} />
      <HowToSchema
        name="How to Use TD Values for Better Lithophanes"
        description="Learn how to select the right filament transmissivity distance (TD) value for HueForge lithophane and multicolor 3D printing projects."
        steps={[
          {
            name: 'Determine your project type',
            text: 'Decide whether you are creating a lithophane, a multicolor HueForge print, or a standard print. Lithophanes and HueForge projects require specific TD values for optimal results.',
          },
          {
            name: 'Choose TD value for your layer role',
            text: 'For dark/base layers (black anchor), select filaments with TD 0.5–1.5 (very opaque). For mid-tone layers, use TD 1.5–3.0 (balanced opacity). For light/highlight layers (white, natural), use TD 3.0–5.0. For silk PLA or special effects, use TD 5.0+ (highly translucent).',
          },
          {
            name: "Search FilaScope's TD Database",
            text: "Use FilaScope's HueForge TD Database to filter filaments by TD value, material type, color, and brand. Compare prices and availability across retailers in your region.",
          },
          {
            name: 'Verify and test print',
            text: 'Once you find a candidate filament, click through to its detail page for printing temperature recommendations, community photos, and pricing. Print a small test to confirm the TD value matches your expectations before committing to a full project.',
          },
        ]}
        tool={[
          'HueForge software',
          '3D printer with 1.75mm filament support',
        ]}
      />

      <div className="max-w-7xl mx-auto px-4 py-12">
        {/* ── Hero ──────────────────────────────────────────────────── */}
        <section className="text-center mb-16">
          <Badge variant="outline" className="mb-4 text-sm">
            <Sun className="w-3 h-3 mr-1 text-purple-400" />
            Transmissivity Data
          </Badge>
          <h1 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-purple-400 to-primary bg-clip-text text-transparent">
            HueForge TD Value Database — Filament Transmissivity Data for Lithophanes
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

          <div className="flex justify-center gap-3 flex-wrap">
            <Button
              onClick={() =>
                document.getElementById('td-table')?.scrollIntoView({ behavior: 'smooth' })
              }
            >
              <Search className="w-4 h-4 mr-2" />
              Find Filaments by TD Value
            </Button>
            <Button variant="outline" asChild>
              <Link to="/hueforge-filament-substitute-finder">
                <RefreshCw className="w-4 h-4 mr-2" />
                Find Substitutes
              </Link>
            </Button>
            <Button variant="outline" asChild>
              <Link to="/hueforge-layer-preview">
                <Sun className="w-4 h-4 mr-2" />
                Layer Preview
              </Link>
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
                TD (Transmission Distance) measures how many millimeters of light can pass through a filament. Lower TD values (0.1–1.0) indicate opaque filaments, while higher values (4.0–10.0+) indicate translucent ones. This measurement is critical for any project where light interaction matters — lithophanes, HueForge multicolor prints, lamp shades, and decorative light panels all depend on accurate TD data.
              </p>
              <p>
                HueForge, the popular software for creating multicolor prints on single-extruder
                printers, relies on accurate TD values to calculate how colors blend when stacked
                layer-by-layer. Without correct TD data the software cannot predict what your finished
                print will look like, often resulting in washed-out colors or muddy shadows. This is why having a verified TD database is essential for any serious HueForge project.
              </p>
              <p>
                TD values also matter for traditional lithophane printing. A lithophane works by
                varying wall thickness so that backlighting reveals an image — and the contrast of
                that image depends directly on how translucent the filament is. Choosing the right TD
                ensures crisp highlights and deep shadows. A filament with TD 4.0 will produce a very different lithophane than one with TD 8.0, even if they appear identical on the spool.
              </p>

              {/* TD Value Range Reference */}
              <div className="not-prose my-6">
                <h3 className="text-lg font-semibold text-foreground mb-3">TD Value Range Reference</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="flex items-center gap-3 p-3 rounded-lg border border-border/50 bg-muted/30">
                    <div className="w-8 h-8 rounded-full bg-gray-900 border shrink-0" />
                    <div>
                      <p className="text-sm font-medium text-foreground">Black / Dark Colors</p>
                      <p className="text-xs text-muted-foreground">TD 0.3 – 0.8 (very opaque)</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-3 rounded-lg border border-border/50 bg-muted/30">
                    <div className="w-8 h-8 rounded-full bg-blue-500 border shrink-0" />
                    <div>
                      <p className="text-sm font-medium text-foreground">Standard Colors</p>
                      <p className="text-xs text-muted-foreground">TD 1.5 – 5.0 (moderate)</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-3 rounded-lg border border-border/50 bg-muted/30">
                    <div className="w-8 h-8 rounded-full bg-white border shrink-0" />
                    <div>
                      <p className="text-sm font-medium text-foreground">White</p>
                      <p className="text-xs text-muted-foreground">TD 3.5 – 5.0+ (translucent)</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-3 rounded-lg border border-border/50 bg-muted/30">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-white/80 to-white/30 border shrink-0" />
                    <div>
                      <p className="text-sm font-medium text-foreground">Translucent / Clear</p>
                      <p className="text-xs text-muted-foreground">TD 5.0 – 10.0+ (highly translucent)</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div>
            <h2 className="text-2xl md:text-3xl font-bold mb-4">
              How to Choose Filaments for HueForge Projects
            </h2>
            <div className="prose prose-lg dark:prose-invert text-muted-foreground space-y-4">
              <p>
                Selecting the right filament for a HueForge project goes beyond just picking colors you like — TD values, layer adhesion, and print consistency all play a role in the final result. The most successful HueForge creators build curated filament palettes where every color has a known, verified TD value. FilaScope is the world's largest HueForge TD database with transmissivity data for <strong>{totalCount}+</strong> filaments, making it the most reliable starting point for palette building.
              </p>
              <p>
                Start with your anchor colors: a true black with TD 0.5–1.0 for deep shadows, and a white with TD 3.5–5.0 for highlights. These two colors form the foundation of almost every HueForge project. From there, add mid-tone colors — skin tones, browns, blues, and greens — in the TD 1.5–3.5 range. The key is knowing exactly how opaque each color prints, which is what TD data tells you.
              </p>
              <p>
                Material choice matters too. Standard PLA is the most popular for HueForge because of its consistent TD, low warping, and wide color availability. Silk PLA offers striking metallic sheens but has characteristically high TD values (often 5.0+), making it better for highlights and accents than base layers. PETG works but is generally more translucent than PLA, requiring careful calibration.
              </p>
              <p>
                Finally, always verify TD values before committing to a large project. Brand-to-brand variation is real — two filaments labeled "Red PLA" can have wildly different TD values. Use <Link to="/hueforge-td-database" className="text-primary hover:underline">FilaScope's TD database</Link> to cross-reference your filament choices, and consider printing a small test swatch to confirm the TD matches your expectations.
              </p>
            </div>
          </div>

          <div>
            <h2 className="text-2xl md:text-3xl font-bold mb-4">
              Best Filaments for HueForge by Category
            </h2>
            <div className="prose prose-lg dark:prose-invert text-muted-foreground space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-foreground">Best for Beginners</h3>
                <p>
                  If you're new to HueForge, start with well-known PLA brands like Bambu Lab, Polymaker, or eSUN — they have the most widely verified TD values and consistent batch-to-batch quality. Look for standard colors (not silk or matte) with TD values between 2.0–5.0. Browse our <Link to="/guides/best-filaments-hueforge" className="text-primary hover:underline">Best Filaments for HueForge guide</Link> for curated beginner picks.
                </p>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-foreground">Best for Detail & Contrast</h3>
                <p>
                  For maximum detail in portraits and fine-art HueForge prints, you need filaments with precise, low TD values in your dark layers and consistent mid-range TD for transitions. Matte PLA filaments often provide the best detail because their surface doesn't reflect light, allowing the lithophane effect to shine. Check our <Link to="/filaments/pla" className="text-primary hover:underline">PLA filament catalog</Link> filtered by TD value.
                </p>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-foreground">Best for Color Accuracy</h3>
                <p>
                  Color accuracy in HueForge depends on matching your physical filament colors to the HueForge color profile. Brands like Polymaker and Bambu Lab publish official HueForge profiles, making color matching much easier. Use <Link to="/colors" className="text-primary hover:underline">FilaScope's Color Finder</Link> to match specific hex colors to real filaments with known TD values.
                </p>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-foreground">Most Affordable Options</h3>
                <p>
                  HueForge projects use relatively little filament per color, so even budget brands work well. eSUN, SUNLU, and Overture offer PLA with verified TD values at lower price points. Check our <Link to="/deals" className="text-primary hover:underline">Deals page</Link> for current discounts on filaments with TD data.
                </p>
              </div>
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
          {/* TD Range Slider */}
          <Card className="mb-4">
            <CardContent className="pt-5 pb-4">
              <TdRangeSlider value={tdRange} onChange={handleTdRangeChange} />
            </CardContent>
          </Card>

          {/* Existing Filters */}
          <Card className="mb-4">
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

          {/* TD Distribution Chart */}
          <div className="mb-4">
            <TdDistributionChart
              filaments={filteredData}
              onZoneClick={(min, max) => handleTdRangeChange([min, max])}
            />
          </div>

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
                      <TableCell className="text-right">
                        {f.transmission_distance != null && (
                          <TdValueCell value={f.transmission_distance} />
                        )}
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

        {/* ── Filaments Needing TD Data ─────────────────────────────── */}
        <FilamentsNeedingTdSection />

        {/* ── TD Substitute Finder (inline compact) ────────────────── */}
        {filaments && filaments.length > 0 && (
          <section className="mt-16">
            <TdSubstituteFinder filaments={filaments} compact />
          </section>
        )}

        {/* ── Layer Preview Compact Widget ──────────────────────────── */}
        {filaments && filaments.length > 0 && (
          <section className="mt-16 max-w-2xl mx-auto">
            <LayerPreviewCompact filaments={filaments} />
          </section>
        )}

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

        {/* ── People Also Ask ──────────────────────────────────────── */}
        <section className="mt-16 max-w-3xl mx-auto">
          <h2 className="text-2xl md:text-3xl font-bold mb-6 text-center">
            People Also Ask
          </h2>
          <Accordion type="single" collapsible className="w-full">
            {paaData.map((faq, i) => (
              <AccordionItem key={i} value={`paa-${i}`}>
                <AccordionTrigger className="text-left">{faq.question}</AccordionTrigger>
                <AccordionContent className="text-muted-foreground">
                  {faq.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </section>

        <RelatedContentBlock
          title="Related HueForge Resources"
          className="max-w-7xl mx-auto px-4 py-8"
          links={[
            { label: 'Best Filaments for HueForge', href: '/best-filaments-for-hueforge', description: 'TD-ranked picks for lithophane and multicolor printing' },
            { label: 'Best White Filaments', href: '/best-white-filaments', description: 'Top white filaments for HueForge base layers' },
            { label: 'What Is HueForge TD?', href: '/guides/what-is-hueforge-td', description: 'Complete beginner guide to Transmissivity Distance' },
            { label: 'How to Measure Filament TD', href: '/guides/how-to-measure-filament-td', description: 'Step-by-step calibration and measurement guide' },
            { label: 'Best White Filaments for HueForge', href: '/guides/best-white-filaments-for-hueforge', description: 'TD-ranked white filament picks for lithophanes' },
            { label: 'Find by Color', href: '/colors', description: 'Match any color to real filaments with TD data' },
          ]}
        />
      </div>
    </div>
  );
}
