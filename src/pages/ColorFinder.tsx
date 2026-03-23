import { useState, useCallback, useEffect, useMemo } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { DocumentHead } from '@/components/seo/DocumentHead';
import { BreadcrumbSchema, WebApplicationSchema, Breadcrumbs } from '@/components/seo';
import { Palette, Copy, Layers, ArrowRight, Search, Lightbulb } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { isValidHexColor, normalizeColorHex } from '@/lib/utils';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { ColorPickerCanvas } from '@/components/color-finder/ColorPickerCanvas';
import { PopularColors } from '@/components/color-finder/PopularColors';
import { ColorFinderResults } from '@/components/color-finder/ColorFinderResults';
import { HueForgeStackBuilder } from '@/components/color-finder/HueForgeStackBuilder';
import { useColorFinderFilaments } from '@/hooks/useColorFinderFilaments';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';

type Mode = 'single' | 'hueforge';

const COLOR_FINDER_FAQS = [
  {
    q: "How does FilaScope's color matching work?",
    a: "According to FilaScope's database of 1,080+ filaments, our color matching tool compares filament colors across 48+ brands using hex codes and visual swatches. Search by color name, hex code, or use our visual color picker to find the closest matching filaments.",
  },
  {
    q: "Can I match filament colors across different brands?",
    a: "Yes. FilaScope lets you compare colors from different manufacturers side by side to find the closest match for your project. Our tool ranks results by color similarity so you can quickly identify alternatives across brands.",
  },
  {
    q: "How do I find filaments for HueForge by color?",
    a: "Use FilaScope's color tool to find filaments in specific shades, then check their TD values in our HueForge TD database to ensure they'll work for your lithophane project. Toggle 'HueForge Stack' mode for multi-layer color planning.",
  },
];

const POPULAR_CATEGORIES = [
  { name: "White", slug: "white", hex: "#FFFFFF", desc: "Essential for HueForge lithophanes and clean prints" },
  { name: "Black", slug: "black", hex: "#1A1A1A", desc: "Universal base color for functional and decorative parts" },
  { name: "Red", slug: "red", hex: "#DC2626", desc: "Vibrant reds from matte to silk finishes" },
  { name: "Blue", slug: "blue", hex: "#2563EB", desc: "Wide range from navy to sky blue across brands" },
  { name: "Green", slug: "green", hex: "#16A34A", desc: "Natural tones to vivid greens for every project" },
  { name: "Gray", slug: "gray", hex: "#6B7280", desc: "Neutral grays for prototyping and industrial looks" },
  { name: "Orange", slug: "orange", hex: "#EA580C", desc: "Bright safety orange to warm amber shades" },
  { name: "Yellow", slug: "yellow", hex: "#EAB308", desc: "From pale lemon to rich golden yellows" },
];

export default function ColorFinder() {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialHex = searchParams.get('hex') ? `#${searchParams.get('hex')}` : '#DC2626';
  const initialMode = (searchParams.get('mode') as Mode) || 'single';
  const initialMaterial = searchParams.get('material') || '';
  const initialBrand = searchParams.get('brand') || '';

  const [selectedHex, setSelectedHex] = useState(initialHex);
  const [hexInput, setHexInput] = useState(initialHex);
  const [mode, setMode] = useState<Mode>(initialMode);
  const [materialFilter, setMaterialFilter] = useState(initialMaterial);
  const [brandFilter, setBrandFilter] = useState(initialBrand);

  const { data: filaments = [], isLoading } = useColorFinderFilaments();

  // Sync URL params
  useEffect(() => {
    const params: Record<string, string> = {};
    const cleanHex = selectedHex.replace('#', '');
    if (cleanHex && cleanHex !== 'DC2626') params.hex = cleanHex;
    if (mode !== 'single') params.mode = mode;
    if (materialFilter) params.material = materialFilter;
    if (brandFilter) params.brand = brandFilter;
    setSearchParams(params, { replace: true });
  }, [selectedHex, mode, materialFilter, brandFilter, setSearchParams]);

  const handleColorChange = useCallback((hex: string) => {
    setSelectedHex(hex);
    setHexInput(hex);
  }, []);

  const handleHexInputChange = (value: string) => {
    setHexInput(value);
    const normalized = value.startsWith('#') ? value : `#${value}`;
    if (isValidHexColor(normalized)) {
      setSelectedHex(normalized.toUpperCase());
    }
  };

  const handleCopyHex = () => {
    navigator.clipboard.writeText(selectedHex.toUpperCase());
    toast.success(`Copied ${selectedHex.toUpperCase()}`);
  };

  const faqSchema = useMemo(() => ({
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: COLOR_FINDER_FAQS.map(faq => ({
      "@type": "Question",
      name: faq.q,
      acceptedAnswer: {
        "@type": "Answer",
        text: faq.a,
      },
    })),
  }), []);

  return (
    <>
      <DocumentHead
        title="3D Printer Filament Color Finder — Match Any Shade to 16,000+ Filaments"
        description="Free filament color finder tool — match any hex color to 16,000+ 3D printer filaments from 49+ brands. Visual color picker, HueForge TD data, and brand comparison. Find your exact color match."
        canonical="https://filascope.com/colors"
        ogTitle="3D Printer Filament Color Finder — Match Any Shade to 16,000+ Filaments"
        ogDescription="Free filament color finder tool — match any hex color to 16,000+ 3D printer filaments from 49+ brands. Visual color picker, HueForge TD data, and brand comparison. Find your exact color match."
        keywords="filament color finder, 3d printer filament color picker, filament color match, hex to filament, 3D printing color tool, HueForge color finder, filament color comparison"
      />
      <BreadcrumbSchema items={[{ name: 'Home', url: '/' }, { name: 'Color Finder', url: '/colors' }]} />
      <Breadcrumbs
        items={[{ name: "Color Finder", url: "/colors" }]}
        className="w-full max-w-[1600px] mx-auto px-4 sm:px-6 md:px-10 pt-4 pb-1"
      />
      <WebApplicationSchema
        name="FilaScope Color Finder"
        url="https://filascope.com/colors"
        applicationCategory="Utility"
        description="Match any color to 3D printer filaments. Search by hex code, color name, or visual match."
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />

      <div className="w-full max-w-[1600px] mx-auto px-4 sm:px-6 md:px-10 py-8 space-y-8">
        {/* Header */}
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10 border border-primary/20">
              <Palette className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-foreground">Color Finder</h1>
              <p className="text-sm text-muted-foreground">
                Match any color to 16,000+ filaments across 49+ brands. Pick a color or enter a hex code.
              </p>
            </div>
          </div>
        </div>

        {/* Mode Toggle */}
        <div className="flex items-center gap-1 bg-card/60 rounded-lg p-0.5 border border-border/50 w-fit">
          <button
            onClick={() => setMode('single')}
            className={cn(
              "px-4 py-1.5 text-sm rounded-md transition-all flex items-center gap-1.5",
              mode === 'single'
                ? "bg-primary/20 text-primary font-medium"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <Palette className="w-3.5 h-3.5" /> Single Color
          </button>
          <button
            onClick={() => setMode('hueforge')}
            className={cn(
              "px-4 py-1.5 text-sm rounded-md transition-all flex items-center gap-1.5",
              mode === 'hueforge'
                ? "bg-primary/20 text-primary font-medium"
                : "text-muted-foreground hover:text-foreground"
            )}
            title="Plan multi-layer color combinations for HueForge lithophane prints"
          >
            <Layers className="w-3.5 h-3.5" /> HueForge Stack
          </button>
        </div>

        {mode === 'single' ? (
          <div className="grid grid-cols-1 lg:grid-cols-[380px_1fr] gap-8">
            {/* Left Column: Picker */}
            <div className="space-y-6">
              {/* Color Preview */}
              <div className="flex items-center gap-4">
                <div
                  className="w-16 h-16 rounded-xl border-2 border-border shadow-lg"
                  style={{ backgroundColor: selectedHex }}
                />
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-lg font-mono font-bold text-foreground">
                      {selectedHex.toUpperCase()}
                    </span>
                    <button
                      onClick={handleCopyHex}
                      className="text-muted-foreground hover:text-primary transition-colors"
                      title="Copy hex code"
                    >
                      <Copy className="w-4 h-4" />
                    </button>
                  </div>
                  <p className="text-xs text-muted-foreground">Selected color</p>
                </div>
              </div>

              {/* Canvas Picker */}
              <ColorPickerCanvas
                selectedHex={selectedHex}
                onColorChange={handleColorChange}
              />

              {/* Hex Input */}
              <div className="space-y-1.5">
                <label className="text-xs font-mono uppercase tracking-wider text-muted-foreground">
                  Enter Hex Code
                </label>
                <Input
                  value={hexInput}
                  onChange={(e) => handleHexInputChange(e.target.value)}
                  placeholder="#FF5733"
                  className="font-mono h-9"
                  maxLength={7}
                />
              </div>

              {/* Popular Colors */}
              <PopularColors
                selectedHex={selectedHex}
                onSelectColor={handleColorChange}
              />
            </div>

            {/* Right Column: Results */}
            <div>
              <ColorFinderResults
                filaments={filaments}
                searchHex={selectedHex}
                isLoading={isLoading}
                materialFilter={materialFilter}
                brandFilter={brandFilter}
                onMaterialChange={setMaterialFilter}
                onBrandChange={setBrandFilter}
              />
            </div>
          </div>
        ) : (
          /* HueForge Stack Mode */
          <div className="max-w-4xl">
            <HueForgeStackBuilder filaments={filaments} />
          </div>
        )}

        {/* SEO Content Sections */}
        <div className="space-y-10 pt-8 border-t border-border/50">
          {/* How Color Matching Works */}
          <section>
            <h2 className="text-xl font-bold text-foreground mb-3 flex items-center gap-2">
              <Search className="w-5 h-5 text-primary" />
              How Color Matching Works
            </h2>
            <p className="text-sm text-muted-foreground leading-relaxed max-w-3xl">
              FilaScope's color matching tool compares filament colors across 48+ brands by analyzing hex color codes and computing perceptual color distance (Delta E). When you pick a target color — via hex input, visual picker, or popular presets — the tool ranks every filament in the database by how closely its measured swatch matches your selection. Results update instantly so you can find exact or near-exact color matches across manufacturers like Prusament, Polymaker, Bambu Lab, Hatchbox, and more.
            </p>
            <p className="text-sm text-muted-foreground leading-relaxed max-w-3xl mt-2">
              You can also filter results by material type (PLA, PETG, ABS, TPU) and brand to narrow down options for your specific printer and project requirements. Looking for full filament specs?{' '}
              <Link to="/filaments" className="text-primary hover:underline">Browse the complete filament database</Link>.
            </p>
          </section>

          {/* Popular Color Categories */}
          <section>
            <h2 className="text-xl font-bold text-foreground mb-4 flex items-center gap-2">
              <Palette className="w-5 h-5 text-primary" />
              Popular Color Categories
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {POPULAR_CATEGORIES.map(cat => (
                <Link
                  key={cat.slug}
                  to={`/colors/${cat.slug}`}
                  className="group flex items-start gap-3 p-3 rounded-lg border border-border/50 bg-card/40 hover:border-primary/40 hover:bg-card/80 transition-all"
                >
                  <div
                    className="w-8 h-8 rounded-lg border border-border/70 flex-shrink-0 shadow-sm"
                    style={{ backgroundColor: cat.hex }}
                  />
                  <div className="min-w-0">
                    <span className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors block">
                      {cat.name} Filaments
                    </span>
                    <span className="text-xs text-muted-foreground line-clamp-2">{cat.desc}</span>
                  </div>
                </Link>
              ))}
            </div>
          </section>

          {/* Color Matching for HueForge */}
          <section>
            <h2 className="text-xl font-bold text-foreground mb-3 flex items-center gap-2">
              <Lightbulb className="w-5 h-5 text-amber-400" />
              Color Matching for HueForge
            </h2>
            <p className="text-sm text-muted-foreground leading-relaxed max-w-3xl">
              Color accuracy is critical for HueForge lithophane prints. Because HueForge blends light through stacked filament layers, even small color differences between brands can significantly affect the final result. Use FilaScope's color picker to find filaments in your target shade, then cross-reference their{' '}
              <Link to="/hueforge-td-database" className="text-primary hover:underline">transmission distance (TD) values</Link>{' '}
              to ensure they'll produce the expected light transmission for your lithophane. Switch to "HueForge Stack" mode above to plan multi-layer color combinations with real TD data.
            </p>
            <div className="flex flex-wrap gap-2 mt-3">
              <Link
                to="/hueforge-td-database"
                className="inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full border border-border/60 text-muted-foreground hover:text-primary hover:border-primary/40 transition-colors"
              >
                HueForge TD Database <ArrowRight className="w-3 h-3" />
              </Link>
              <Link
                to="/hueforge-tools"
                className="inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full border border-border/60 text-muted-foreground hover:text-primary hover:border-primary/40 transition-colors"
              >
                All HueForge Tools <ArrowRight className="w-3 h-3" />
              </Link>
              <Link
                to="/guides/best-filaments-for-hueforge"
                className="inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full border border-border/60 text-muted-foreground hover:text-primary hover:border-primary/40 transition-colors"
              >
                Best Filaments for HueForge <ArrowRight className="w-3 h-3" />
              </Link>
            </div>
          </section>

          {/* Related Resources */}
          <section className="bg-muted/30 rounded-xl p-6 border border-border">
            <h2 className="text-lg font-semibold mb-4">Related Resources</h2>
            <div className="grid sm:grid-cols-2 gap-3">
              {[
                { to: '/filaments', label: 'Browse 16,000+ Filaments by Spec' },
                { to: '/filament-temperature-chart', label: '3D Filament Temperature Chart' },
                { to: '/guides/best-pla-filaments', label: 'Best PLA Filaments 2026' },
                { to: '/guides/pla-vs-petg', label: 'PLA vs PETG Comparison' },
                { to: '/guides/petg-vs-tpu', label: 'PETG vs TPU Comparison' },
                { to: '/guides/best-filaments-for-beginners', label: 'Best Filaments for Beginners' },
              ].map((link) => (
                <Link key={link.to} to={link.to} className="flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors">
                  <ArrowRight className="w-3.5 h-3.5 text-primary shrink-0" />
                  {link.label}
                </Link>
              ))}
            </div>
          </section>

          {/* FAQ Section */}
          <section>
            <h2 className="text-xl font-bold text-foreground mb-4">Frequently Asked Questions About Filament Color Matching</h2>
            <Accordion type="multiple" className="space-y-2 max-w-3xl">
              {COLOR_FINDER_FAQS.map((faq, i) => (
                <AccordionItem key={i} value={`faq-${i}`} className="border border-border/50 rounded-lg px-4 bg-card/30">
                  <AccordionTrigger className="text-sm font-medium text-foreground hover:no-underline py-3">
                    {faq.q}
                  </AccordionTrigger>
                  <AccordionContent forceMount className="data-[state=closed]:hidden text-sm text-muted-foreground pb-3 leading-relaxed">
                    {faq.a}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </section>
        </div>
      </div>
    </>
  );
}
