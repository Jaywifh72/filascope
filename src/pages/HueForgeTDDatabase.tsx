import { useState, useMemo, useEffect, useCallback, useRef, useTransition } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
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
  ChevronDown,
  RefreshCw,
  Palette,
  LayoutGrid,
  List,
  Package,
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
import { toast } from 'sonner';
import { SkeletonBox, SkeletonCircle } from '@/components/ui/skeleton-primitives';
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
import { HueForgeToolsNav } from '@/components/hueforge/HueForgeToolsNav';
import { getSwatchColor, needsContrastRing, needsLightContrastRing, isApproximateColor } from '@/lib/swatchColor';
import { SwatchCircle } from '@/components/hueforge/SwatchCircle';

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

// Helper to detect dark colors for swatch ring visibility
function isColorDark(hex: string): boolean {
  const c = hex.replace('#', '');
  const r = parseInt(c.substring(0, 2), 16);
  const g = parseInt(c.substring(2, 4), 16);
  const b = parseInt(c.substring(4, 6), 16);
  return (r * 299 + g * 587 + b * 114) / 1000 < 80;
}

// Use shared swatch utilities from @/lib/swatchColor
// (getFallbackHex and needsContrastRing are now imported)

// ── Component ─────────────────────────────────────────────────────────
export default function HueForgeTDDatabase() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [searchInput, setSearchInput] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const searchDebounceRef = useRef<ReturnType<typeof setTimeout>>();
  const [filterFlash, setFilterFlash] = useState(false);
  const tableContainerRef = useRef<HTMLDivElement>(null);
  const tableScrollRef = useRef<HTMLDivElement>(null);
  const [isScrolledToBottom, setIsScrolledToBottom] = useState(false);

  // Debounced search
  const handleSearchChange = useCallback((value: string) => {
    setSearchInput(value);
    if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current);
    searchDebounceRef.current = setTimeout(() => setSearchTerm(value), 300);
  }, []);

  // Flash table border on filter change
  const flashBorder = useCallback(() => {
    setFilterFlash(true);
    setTimeout(() => setFilterFlash(false), 300);
  }, []);
  const [materialFilter, setMaterialFilter] = useState<string>('all');
  const [brandFilter, setBrandFilter] = useState<string>('all');
  const [colorFilter, setColorFilter] = useState<string>('all');
  const [sortField, setSortField] = useState<SortField>('transmission_distance');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');
  const { formatPrice } = useCurrency();
  const [viewTransition, setViewTransition] = useState(false);

  // View mode: card vs table, persisted + mobile-default
  const LS_VIEW_KEY = 'filascope-td-view-mode';
  const [viewMode, setViewMode] = useState<'table' | 'card'>(() => {
    try {
      const saved = localStorage.getItem(LS_VIEW_KEY);
      if (saved === 'card' || saved === 'table') return saved;
    } catch {}
    return typeof window !== 'undefined' && window.innerWidth < 768 ? 'card' : 'table';
  });

  const switchView = useCallback((mode: 'table' | 'card') => {
    if (mode === viewMode) return;
    setViewTransition(true);
    setTimeout(() => {
      setViewMode(mode);
      try { localStorage.setItem(LS_VIEW_KEY, mode); } catch {}
      setTimeout(() => setViewTransition(false), 30);
    }, 150);
  }, [viewMode]);

  // Rows per page, persisted
  const LS_ROWS_KEY = 'filascope-td-rows-per-page';
  const [rowsPerPage, setRowsPerPage] = useState<number>(() => {
    try {
      const saved = localStorage.getItem(LS_ROWS_KEY);
      if (saved === 'all') return Infinity;
      const n = parseInt(saved || '100', 10);
      return [25, 50, 100].includes(n) ? n : 100;
    } catch { return 100; }
  });

  const handleRowsPerPageChange = useCallback((val: string) => {
    const v = val === 'all' ? Infinity : parseInt(val, 10);
    setRowsPerPage(v);
    try { localStorage.setItem(LS_ROWS_KEY, val); } catch {}
  }, []);

  // Card-view sort option
  const [cardSort, setCardSort] = useState('td-asc');

  // TD range from URL params or default
  const [tdRange, setTdRange] = useState<[number, number]>(() => {
    const min = parseFloat(searchParams.get('td_min') || '0');
    const max = parseFloat(searchParams.get('td_max') || '10');
    return [isNaN(min) ? 0 : min, isNaN(max) ? 10 : max];
  });

  const handleTdRangeChange = useCallback((range: [number, number]) => {
    setTdRange(range);
    flashBorder();
    const params = new URLSearchParams(searchParams);
    if (range[0] === 0 && range[1] === 10) {
      params.delete('td_min');
      params.delete('td_max');
    } else {
      params.set('td_min', range[0].toString());
      params.set('td_max', range[1].toString());
    }
    setSearchParams(params, { replace: true });
  }, [searchParams, setSearchParams, flashBorder]);

  // Reset all filters
  const resetAllFilters = useCallback(() => {
    setSearchInput('');
    setSearchTerm('');
    setMaterialFilter('all');
    setBrandFilter('all');
    setColorFilter('all');
    setTdRange([0, 10]);
    const params = new URLSearchParams(searchParams);
    params.delete('td_min');
    params.delete('td_max');
    setSearchParams(params, { replace: true });
    toast.success('Filters reset');
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

  // ── Curated mini-lists ────────────────────────────────────────────────
  const curatedLists = useMemo(() => {
    if (!filaments) return { opaque: [], midTone: [], highlights: [] };
    const opaque = filaments.filter(f => f.transmission_distance != null && f.transmission_distance <= 1.5).slice(0, 3);
    const midTone = filaments.filter(f => f.transmission_distance != null && f.transmission_distance >= 1.5 && f.transmission_distance <= 3.5).slice(0, 3);
    const highlights = [...filaments].filter(f => f.transmission_distance != null && f.transmission_distance >= 3.0)
      .sort((a, b) => (b.transmission_distance ?? 0) - (a.transmission_distance ?? 0)).slice(0, 3);
    return { opaque, midTone, highlights };
  }, [filaments]);

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
    toast.success(`Exported ${filteredData.length} filaments to CSV`);
  };

  const hasActiveFilters = searchTerm || materialFilter !== 'all' || brandFilter !== 'all' || colorFilter !== 'all' || tdRange[0] > 0 || tdRange[1] < 10;

  const isDefaultSort = sortField === 'transmission_distance' && sortDirection === 'asc';

  const SortIndicator = ({ field }: { field: SortField }) => {
    const isActive = sortField === field;
    return isActive ? (
      <span className="inline-flex ml-1 text-primary font-bold">{sortDirection === 'asc' ? '↑' : '↓'}</span>
    ) : (
      <ArrowUpDown className="w-4 h-4 inline ml-1 text-muted-foreground" />
    );
  };

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
      <HueForgeToolsNav onExportCsv={exportCSV} />
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

          {/* NEW: Jump to Database CTA */}
          <div className="flex flex-col items-center gap-2 mb-8">
            <Button
              size="lg"
              className="bg-cyan-500 hover:bg-cyan-400 text-black font-bold py-3 px-8 rounded-lg text-lg"
              onClick={() =>
                document.getElementById('td-browser')?.scrollIntoView({ behavior: 'smooth' })
              }
            >
              <Search className="w-5 h-5 mr-2" />
              Search the Database
            </Button>
            <ChevronDown className="w-6 h-6 text-cyan-500 animate-bounce opacity-60" />
            <button
              onClick={() =>
                document.getElementById('td-education')?.scrollIntoView({ behavior: 'smooth' })
              }
              className="text-sm text-muted-foreground hover:text-cyan-400 transition-colors"
            >
              Or learn about TD values below ↓
            </button>
          </div>

        </section>

        {/* ── Browse Filaments Table (MOVED UP) ────────────────────── */}
        <section id="td-browser">
          <h2 className="text-2xl md:text-3xl font-bold mb-6">Browse Filaments by TD Value</h2>

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
                    value={searchInput}
                    onChange={(e) => handleSearchChange(e.target.value)}
                    className="pl-10 pr-20"
                  />
                  {searchInput && (
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-2">
                      {searchInput !== searchTerm && (
                        <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                      )}
                      {searchInput === searchTerm && filteredData.length > 0 && (
                        <Badge variant="secondary" className="text-[10px] h-5 px-1.5">
                          {filteredData.length} match{filteredData.length !== 1 ? 'es' : ''}
                        </Badge>
                      )}
                      <button
                        onClick={() => { setSearchInput(''); setSearchTerm(''); }}
                        className="text-muted-foreground hover:text-foreground transition-colors animate-fade-in"
                      >
                        ✕
                      </button>
                    </div>
                  )}
                </div>
                <div className="flex flex-wrap gap-3">
                  <Select value={brandFilter} onValueChange={(v) => { setBrandFilter(v); flashBorder(); }}>
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

                  <Select value={materialFilter} onValueChange={(v) => { setMaterialFilter(v); flashBorder(); }}>
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

                  <Select value={colorFilter} onValueChange={(v) => { setColorFilter(v); flashBorder(); }}>
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

          {/* Active Filter Chips */}
          {hasActiveFilters && (
            <div className="flex flex-wrap items-center gap-2 py-2 mb-2 animate-fade-in">
              {(tdRange[0] > 0 || tdRange[1] < 10) && (
                <span className="bg-primary/10 text-primary border border-primary/20 rounded-full px-3 py-1 text-xs font-medium flex items-center gap-1.5 animate-fade-in">
                  TD: {tdRange[0]}–{tdRange[1]}
                  <button onClick={() => handleTdRangeChange([0, 10])} className="w-3.5 h-3.5 text-primary/60 hover:text-primary transition-colors">✕</button>
                </span>
              )}
              {brandFilter !== 'all' && (
                <span className="bg-primary/10 text-primary border border-primary/20 rounded-full px-3 py-1 text-xs font-medium flex items-center gap-1.5 animate-fade-in">
                  Brand: {brandFilter}
                  <button onClick={() => { setBrandFilter('all'); flashBorder(); }} className="w-3.5 h-3.5 text-primary/60 hover:text-primary transition-colors">✕</button>
                </span>
              )}
              {materialFilter !== 'all' && (
                <span className="bg-primary/10 text-primary border border-primary/20 rounded-full px-3 py-1 text-xs font-medium flex items-center gap-1.5 animate-fade-in">
                  Material: {materialFilter}
                  <button onClick={() => { setMaterialFilter('all'); flashBorder(); }} className="w-3.5 h-3.5 text-primary/60 hover:text-primary transition-colors">✕</button>
                </span>
              )}
              {colorFilter !== 'all' && (
                <span className="bg-primary/10 text-primary border border-primary/20 rounded-full px-3 py-1 text-xs font-medium flex items-center gap-1.5 animate-fade-in">
                  Color: {colorFilter}
                  <button onClick={() => { setColorFilter('all'); flashBorder(); }} className="w-3.5 h-3.5 text-primary/60 hover:text-primary transition-colors">✕</button>
                </span>
              )}
              {searchTerm && (
                <span className="bg-primary/10 text-primary border border-primary/20 rounded-full px-3 py-1 text-xs font-medium flex items-center gap-1.5 animate-fade-in">
                  Search: '{searchTerm}'
                  <button onClick={() => { setSearchInput(''); setSearchTerm(''); }} className="w-3.5 h-3.5 text-primary/60 hover:text-primary transition-colors">✕</button>
                </span>
              )}
              {[tdRange[0] > 0 || tdRange[1] < 10, brandFilter !== 'all', materialFilter !== 'all', colorFilter !== 'all', !!searchTerm].filter(Boolean).length >= 2 && (
                <button
                  onClick={resetAllFilters}
                  className="text-xs text-muted-foreground hover:text-foreground underline-offset-2 hover:underline cursor-pointer ml-1"
                >
                  Clear all
                </button>
              )}
            </div>
          )}
          {/* TD Distribution Chart */}
          <div className="mb-4">
            <TdDistributionChart
              filaments={filteredData}
              totalCount={filaments?.length}
              activeTdRange={tdRange}
              onZoneClick={(min, max) => handleTdRangeChange([min, max])}
            />
          </div>

          {/* View toggle + record count + card sort */}
          <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
            {(() => {
              const limit = rowsPerPage === Infinity ? filteredData.length : rowsPerPage;
              const shown = Math.min(filteredData.length, limit);
              const totalDb = filaments?.length || 0;
              const isFiltered = hasActiveFilters;
              return (
                <div className="text-sm text-muted-foreground">
                  Showing {shown} of {filteredData.length}{isFiltered ? ` matching records (${totalDb} total)` : ' records'}
                  {shown < filteredData.length && (
                    <>
                      {' · '}
                      <button
                        onClick={() => handleRowsPerPageChange('all')}
                        className="text-cyan-400 hover:underline underline-offset-2 cursor-pointer"
                      >
                        Show all →
                      </button>
                    </>
                  )}
                </div>
              );
            })()}
            <div className="flex items-center gap-3">
              {viewMode === 'card' && (
                <Select value={cardSort} onValueChange={setCardSort}>
                  <SelectTrigger className="w-40 h-8 text-xs">
                    <SelectValue placeholder="Sort by…" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="td-asc">TD Value ↑</SelectItem>
                    <SelectItem value="td-desc">TD Value ↓</SelectItem>
                    <SelectItem value="price-asc">Price ↑</SelectItem>
                    <SelectItem value="price-desc">Price ↓</SelectItem>
                    <SelectItem value="brand-az">Brand A–Z</SelectItem>
                  </SelectContent>
                </Select>
              )}
              <div className="flex items-center gap-1 bg-muted/40 rounded-lg p-1">
                <button
                  onClick={() => switchView('card')}
                  className={`p-1.5 rounded transition-colors ${viewMode === 'card' ? 'bg-muted text-cyan-400' : 'text-muted-foreground hover:text-foreground'}`}
                  aria-label="Card view"
                >
                  <LayoutGrid className="w-4 h-4" />
                </button>
                <button
                  onClick={() => switchView('table')}
                  className={`p-1.5 rounded transition-colors ${viewMode === 'table' ? 'bg-muted text-cyan-400' : 'text-muted-foreground hover:text-foreground'}`}
                  aria-label="Table view"
                >
                  <List className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          {isLoading ? (
            /* Shimmer skeleton table rows */
            <div className="border rounded-lg overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">Color</TableHead>
                    <TableHead>Brand</TableHead>
                    <TableHead>Product</TableHead>
                    <TableHead>Material</TableHead>
                    <TableHead>Color Family</TableHead>
                    <TableHead className="text-right">TD Value</TableHead>
                    <TableHead className="text-right">Price</TableHead>
                    <TableHead className="w-20" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {Array.from({ length: 8 }).map((_, i) => (
                    <TableRow key={i}>
                      <TableCell><SkeletonCircle size={32} /></TableCell>
                      <TableCell><SkeletonBox className="h-4 w-24" /></TableCell>
                      <TableCell><SkeletonBox className="h-4 w-32" /></TableCell>
                      <TableCell><SkeletonBox className="h-4 w-16" /></TableCell>
                      <TableCell><SkeletonBox className="h-4 w-20" /></TableCell>
                      <TableCell><SkeletonBox className="h-4 w-12 ml-auto" /></TableCell>
                      <TableCell><SkeletonBox className="h-4 w-14 ml-auto" /></TableCell>
                      <TableCell><SkeletonBox className="h-4 w-8" /></TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : filteredData.length === 0 && hasActiveFilters ? (
            /* Empty state with filter reset */
            <div className="text-center py-16 space-y-4 border rounded-lg bg-card/30">
              <p className="text-lg text-muted-foreground">No filaments match your filters.</p>
              <p className="text-sm text-muted-foreground">Try adjusting your TD range or removing some filters.</p>
              <Button variant="outline" size="sm" onClick={resetAllFilters} className="text-primary hover:text-primary/80">
                Reset all filters
              </Button>
            </div>
          ) : (
            <div
              ref={tableContainerRef}
              className={`transition-all duration-150 ${viewTransition ? 'opacity-0' : 'opacity-100'} ${filterFlash ? 'ring-2 ring-primary/50 rounded-lg' : ''}`}
            >
              {viewMode === 'table' ? (
                /* ── Table View ── */
                <div
                  ref={tableScrollRef}
                  className="border rounded-lg overflow-hidden max-h-[700px] overflow-y-auto relative"
                  onScroll={(e) => {
                    const el = e.currentTarget;
                    setIsScrolledToBottom(el.scrollHeight - el.scrollTop - el.clientHeight < 10);
                  }}
                >
                  <Table>
                    <TableHeader className="sticky top-0 bg-background z-10 border-b border-border shadow-[0_2px_8px_rgba(0,0,0,0.3)]">
                      <TableRow>
                        <TableHead className="w-12">Color</TableHead>
                        <TableHead className={`cursor-pointer hover:bg-muted/50 ${sortField === 'vendor' ? 'text-primary' : ''}`} onClick={() => handleSort('vendor')}>
                          Brand <SortIndicator field="vendor" />
                        </TableHead>
                        <TableHead>Product</TableHead>
                        <TableHead className={`cursor-pointer hover:bg-muted/50 ${sortField === 'material' ? 'text-primary' : ''}`} onClick={() => handleSort('material')}>
                          Material <SortIndicator field="material" />
                        </TableHead>
                        <TableHead className={`cursor-pointer hover:bg-muted/50 ${sortField === 'color_family' ? 'text-primary' : ''}`} onClick={() => handleSort('color_family')}>
                          Color Family <SortIndicator field="color_family" />
                        </TableHead>
                        <TableHead className={`cursor-pointer hover:bg-muted/50 text-right ${sortField === 'transmission_distance' ? 'text-primary' : ''}`} onClick={() => handleSort('transmission_distance')}>
                          TD Value <SortIndicator field="transmission_distance" />
                        </TableHead>
                        <TableHead className="text-right">Price</TableHead>
                        <TableHead className="w-20" />
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {(() => {
                        const rows: React.ReactNode[] = [];
                        const limit = rowsPerPage === Infinity ? filteredData.length : rowsPerPage;
                        const sliced = filteredData.slice(0, limit);
                        let passedMidTone = false;
                        let passedTranslucent = false;
                        let passedVeryTranslucent = false;

                        sliced.forEach((f, idx) => {
                          const td = f.transmission_distance ?? 0;

                          // Insert TD range dividers only in default sort (TD asc)
                          if (isDefaultSort && !hasActiveFilters) {
                            if (!passedMidTone && td > 1) {
                              passedMidTone = true;
                              rows.push(
                                <TableRow key="divider-midtone" className="hover:bg-transparent">
                                  <TableCell colSpan={8} className="py-1 text-center border-t border-border/50">
                                    <span className="text-xs text-muted-foreground">— Mid-tone (TD 1–3) —</span>
                                  </TableCell>
                                </TableRow>
                              );
                            }
                            if (!passedTranslucent && td > 3) {
                              passedTranslucent = true;
                              rows.push(
                                <TableRow key="divider-translucent" className="hover:bg-transparent">
                                  <TableCell colSpan={8} className="py-1 text-center border-t border-border/50">
                                    <span className="text-xs text-muted-foreground">— Translucent (TD 3–5) —</span>
                                  </TableCell>
                                </TableRow>
                              );
                            }
                            if (!passedVeryTranslucent && td > 5) {
                              passedVeryTranslucent = true;
                              rows.push(
                                <TableRow key="divider-very-translucent" className="hover:bg-transparent">
                                  <TableCell colSpan={8} className="py-1 text-center border-t border-border/50">
                                    <span className="text-xs text-muted-foreground">— Very Translucent (TD 5+) —</span>
                                  </TableCell>
                                </TableRow>
                              );
                            }
                          }

                          const filamentUrl = `/filament/${f.product_handle || f.id}`;
                          const displayHex = getSwatchColor(f.color_hex, f.color_family);
                          const darkSwatch = needsContrastRing(displayHex);
                          const lightSwatch = needsLightContrastRing(displayHex);
                          rows.push(
                            <TableRow
                              key={f.id}
                              className={`group cursor-pointer transition-all duration-150 border-l-[3px] border-l-transparent hover:border-l-primary hover:bg-muted/40 ${idx % 2 === 0 ? 'bg-white/[0.02]' : ''}`}
                              onClick={() => navigate(filamentUrl)}
                            >
                              <TableCell>
                                <SwatchCircle
                                  hexColor={f.color_hex}
                                  colorFamily={f.color_family}
                                  className="transition-transform duration-150 group-hover:scale-110"
                                />
                              </TableCell>
                              <TableCell className="font-medium">{f.vendor}</TableCell>
                              <TableCell className="max-w-[200px]">
                                <span className="truncate block text-primary group-hover:text-primary/80 group-hover:underline" title={f.product_title || ''}>
                                  {f.product_title}
                                </span>
                              </TableCell>
                              <TableCell>
                                <Badge variant="outline">{f.material}</Badge>
                              </TableCell>
                              <TableCell>{f.color_family}</TableCell>
                              <TableCell className="text-right">
                                {f.transmission_distance != null && <TdValueCell value={f.transmission_distance} />}
                              </TableCell>
                              <TableCell className="text-right text-sm">
                                {f.variant_price != null ? formatPrice(f.variant_price) : '—'}
                              </TableCell>
                              <TableCell>
                                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 md:opacity-0 max-md:opacity-100 transition-opacity">
                                  <Button variant="ghost" size="icon" asChild onClick={(e: React.MouseEvent) => e.stopPropagation()}>
                                    <Link to={filamentUrl}>
                                      <ExternalLink className="w-4 h-4" />
                                    </Link>
                                  </Button>
                                </div>
                              </TableCell>
                            </TableRow>
                          );
                        });
                        return rows;
                      })()}
                    </TableBody>
                  </Table>
                  {/* Fade-out gradient hint */}
                  {!isScrolledToBottom && (
                    <div className="sticky bottom-0 left-0 right-0 h-10 bg-gradient-to-t from-background to-transparent pointer-events-none z-[5]" />
                  )}
                  {(() => {
                    const limit = rowsPerPage === Infinity ? filteredData.length : rowsPerPage;
                    const shown = Math.min(filteredData.length, limit);
                    if (shown >= filteredData.length) return null;
                    const remaining = filteredData.length - shown;
                    return (
                      <div className="flex items-center justify-between py-3 px-4 border-t border-border bg-muted/30 rounded-b-lg">
                        <span className="text-sm text-muted-foreground">
                          Showing {shown} of {filteredData.length} results
                        </span>
                        <div className="flex items-center gap-3">
                          <button
                            onClick={() => handleRowsPerPageChange('all')}
                            className="text-sm text-primary hover:text-primary/80 underline-offset-2 hover:underline cursor-pointer"
                          >
                            Show remaining {remaining} →
                          </button>
                          <Select value={rowsPerPage === Infinity ? 'all' : String(rowsPerPage)} onValueChange={handleRowsPerPageChange}>
                            <SelectTrigger className="w-28 h-8 text-xs">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="25">25 rows</SelectItem>
                              <SelectItem value="50">50 rows</SelectItem>
                              <SelectItem value="100">100 rows</SelectItem>
                              <SelectItem value="all">All rows</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    );
                  })()}
                </div>
              ) : (
                /* ── Card View ── */
                <div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {(() => {
                      let sorted = [...filteredData];
                      switch (cardSort) {
                        case 'td-desc': sorted.sort((a, b) => (b.transmission_distance ?? 0) - (a.transmission_distance ?? 0)); break;
                        case 'price-asc': sorted.sort((a, b) => (a.variant_price ?? 999) - (b.variant_price ?? 999)); break;
                        case 'price-desc': sorted.sort((a, b) => (b.variant_price ?? 0) - (a.variant_price ?? 0)); break;
                        case 'brand-az': sorted.sort((a, b) => (a.vendor ?? '').localeCompare(b.vendor ?? '')); break;
                        default: sorted.sort((a, b) => (a.transmission_distance ?? 0) - (b.transmission_distance ?? 0));
                      }
                      const cardLimit = rowsPerPage === Infinity ? sorted.length : rowsPerPage;
                      return sorted.slice(0, cardLimit).map((f, idx) => {
                        const filamentUrl = `/filament/${f.product_handle || f.id}`;
                        const displayHex = getSwatchColor(f.color_hex, f.color_family);
                        const darkSwatch = needsContrastRing(displayHex);
                        const lightSwatch = needsLightContrastRing(displayHex);
                        return (
                          <Link
                            key={f.id}
                            to={filamentUrl}
                            className={`border border-border rounded-xl p-4 hover:border-primary/30 transition-all group block animate-fade-in ${idx % 2 === 0 ? 'bg-muted/20' : 'bg-white/[0.02]'}`}
                            style={{ animationDelay: `${Math.min(idx * 30, 300)}ms`, animationFillMode: 'backwards' }}
                          >
                            {/* Top: swatch + name + brand */}
                            <div className="flex items-center gap-3 mb-3">
                              <SwatchCircle
                                hexColor={f.color_hex}
                                colorFamily={f.color_family}
                                size="w-10 h-10"
                              />
                              <div className="min-w-0">
                                <p className="font-semibold text-foreground truncate text-sm group-hover:text-cyan-400 transition-colors">{f.product_title}</p>
                                <p className="text-xs text-muted-foreground">{f.vendor}</p>
                              </div>
                            </div>
                            {/* Middle: badges */}
                            <div className="flex flex-wrap items-center gap-1.5 mb-3">
                              {f.material && (
                                <span className="bg-muted text-muted-foreground text-xs px-2 py-0.5 rounded">{f.material}</span>
                              )}
                              {f.color_family && (
                                <span className="bg-muted text-muted-foreground text-xs px-2 py-0.5 rounded">{f.color_family}</span>
                              )}
                              {f.transmission_distance != null && <TdValueCell value={f.transmission_distance} />}
                            </div>
                            {/* Bottom: price + link */}
                            <div className="flex justify-between items-center">
                              <span className="font-semibold text-foreground text-sm">
                                {f.variant_price != null ? formatPrice(f.variant_price) : '—'}
                              </span>
                              <ExternalLink className="w-4 h-4 text-muted-foreground group-hover:text-cyan-400 transition-colors" />
                            </div>
                          </Link>
                        );
                      });
                    })()}
                  </div>
                  {(() => {
                    const limit = rowsPerPage === Infinity ? filteredData.length : rowsPerPage;
                    const shown = Math.min(filteredData.length, limit);
                    if (shown >= filteredData.length) return null;
                    const remaining = filteredData.length - shown;
                    return (
                      <div className="flex items-center justify-between py-3 px-4 border border-border bg-muted/30 rounded-lg mt-3">
                        <span className="text-sm text-muted-foreground">
                          Showing {shown} of {filteredData.length} results
                        </span>
                        <button
                          onClick={() => handleRowsPerPageChange('all')}
                          className="text-sm text-primary hover:text-primary/80 underline-offset-2 hover:underline cursor-pointer"
                        >
                          Show remaining {remaining} →
                        </button>
                      </div>
                    );
                  })()}
                </div>
              )}
            </div>
          )}
        </section>

        {/* ── Curated Mini-Lists ──────────────────────────────────── */}
        <section className="mt-16 mb-16">
          <h2 className="text-2xl md:text-3xl font-bold mb-8">Most Popular Filaments for HueForge</h2>

          {isLoading ? (
            <div className="space-y-8">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="grid grid-cols-3 gap-4">
                  {Array.from({ length: 3 }).map((_, j) => <Skeleton key={j} className="h-40" />)}
                </div>
              ))}
            </div>
          ) : (
            <div className="space-y-10">
              {([
                { emoji: '🏆', label: 'Most Opaque (Base Layers)', items: curatedLists.opaque, viewLabel: 'View all opaque filaments →', tdMin: 0, tdMax: 1.5 },
                { emoji: '🎨', label: 'Best Mid-Tones', items: curatedLists.midTone, viewLabel: 'View all mid-tone filaments →', tdMin: 1.5, tdMax: 3.5 },
                { emoji: '✨', label: 'Best for Highlights', items: curatedLists.highlights, viewLabel: 'View all highlight filaments →', tdMin: 3.0, tdMax: 10 },
              ] as const).map((group) => (
                <div key={group.label}>
                  <p className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-4">
                    {group.emoji} {group.label}
                  </p>
                  <div className="grid grid-cols-3 gap-4 max-md:grid-cols-1 max-md:flex max-md:overflow-x-auto max-md:snap-x max-md:snap-mandatory max-md:gap-4 max-md:pb-2">
                    {group.items.map((f, i) => {
                      const displayHex = getSwatchColor(f.color_hex, f.color_family);
                      const darkSwatch = needsContrastRing(displayHex);
                      const lightSwatch = needsLightContrastRing(displayHex);
                      return (
                      <Link
                        key={f.id}
                        to={`/filament/${f.product_handle || f.id}`}
                        className="relative bg-muted/20 border border-border rounded-xl p-4 hover:border-primary/40 hover:bg-muted/40 transition-all duration-200 cursor-pointer group block max-md:min-w-[260px] max-md:snap-center max-md:shrink-0"
                      >
                        <span className="absolute -top-2 -left-2 bg-primary text-primary-foreground text-xs font-bold w-6 h-6 rounded-full flex items-center justify-center z-10">
                          #{i + 1}
                        </span>
                        <div
                          className={`relative h-12 w-full rounded-lg mb-3 overflow-hidden transition-all ${lightSwatch ? 'border border-gray-600 group-hover:border-gray-500' : 'border border-white/10 group-hover:border-white/20'}`}
                          style={{ backgroundColor: displayHex || 'hsl(var(--muted))' }}
                        >
                          {/* Subtle diagonal gradient for depth on dark swatches */}
                          <div className="absolute inset-0 bg-gradient-to-br from-transparent via-transparent to-white/[0.05] pointer-events-none" />
                          {/* Spool watermark — dark icon for light swatches, white for dark */}
                          <Package className={`absolute inset-0 m-auto w-6 h-6 opacity-[0.15] pointer-events-none ${lightSwatch ? 'text-black' : 'text-white'}`} />
                        </div>
                        <p className="text-sm font-semibold text-foreground truncate">{f.product_title}</p>
                        <p className="text-xs text-muted-foreground mb-2">{f.vendor}</p>
                        <div className="flex items-center justify-between">
                          {f.transmission_distance != null && (
                            <TdValueCell value={f.transmission_distance} />
                          )}
                          {f.variant_price != null && (
                            <span className="text-sm text-muted-foreground">{formatPrice(f.variant_price)}</span>
                          )}
                        </div>
                      </Link>
                      );
                    })}
                  </div>
                  <button
                    onClick={() => {
                      handleTdRangeChange([group.tdMin, group.tdMax]);
                      document.getElementById('td-browser')?.scrollIntoView({ behavior: 'smooth' });
                    }}
                    className="text-sm text-cyan-500 hover:text-cyan-400 transition-colors mt-3 inline-block"
                  >
                    {group.viewLabel}
                  </button>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* ── Visual Separator + Educational Content (MOVED DOWN) ─── */}
        <div id="td-education" className="border-t border-border pt-12 mt-12">
          <p className="text-muted-foreground text-center mb-12">
            New to HueForge TD values? Read our complete guide below.
          </p>

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
        </div>

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
