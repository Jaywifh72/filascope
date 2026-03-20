import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { DocumentHead } from '@/components/seo/DocumentHead';
import { ArticleSchema, FAQSection } from '@/components/seo';
import { Breadcrumbs } from '@/components/seo/Breadcrumbs';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { ArrowRight, Search, Thermometer, ThermometerSun, Wind, Gauge, Shield, Info } from 'lucide-react';

/* ------------------------------------------------------------------ */
/*  Data                                                               */
/* ------------------------------------------------------------------ */

interface FilamentTempData {
  material: string;
  category: string;
  nozzleMin: number;
  nozzleMax: number;
  bedMin: number;
  bedMax: number;
  enclosure: 'Required' | 'Recommended' | 'Optional' | 'Not needed';
  speedMin: number;
  speedMax: number;
  notes: string;
  link: string | null;
  highlight?: boolean;
}

const FILAMENT_DATA: FilamentTempData[] = [
  // --- Standard ---
  { material: 'PLA', category: 'Standard', nozzleMin: 190, nozzleMax: 220, bedMin: 50, bedMax: 60, enclosure: 'Not needed', speedMin: 40, speedMax: 100, notes: 'Easiest to print. 100% fan. Start at 210\u00B0C.', link: '/filaments/pla', highlight: true },
  { material: 'PLA+', category: 'Standard', nozzleMin: 205, nozzleMax: 230, bedMin: 55, bedMax: 65, enclosure: 'Not needed', speedMin: 40, speedMax: 80, notes: 'Tougher than PLA. Slightly higher temps needed.', link: '/filaments/pla-plus', highlight: true },
  { material: 'PLA Silk', category: 'Standard', nozzleMin: 200, nozzleMax: 230, bedMin: 50, bedMax: 65, enclosure: 'Not needed', speedMin: 30, speedMax: 70, notes: 'Glossy finish. Print slower for best sheen.', link: '/filaments/pla' },
  { material: 'PETG', category: 'Standard', nozzleMin: 230, nozzleMax: 250, bedMin: 70, bedMax: 85, enclosure: 'Optional', speedMin: 40, speedMax: 80, notes: 'Reduce fan to 30\u201350%. Sticks to PEI.', link: '/filaments/petg', highlight: true },
  { material: 'ABS', category: 'Standard', nozzleMin: 230, nozzleMax: 260, bedMin: 90, bedMax: 110, enclosure: 'Required', speedMin: 40, speedMax: 80, notes: 'Needs enclosure. Minimal fan. Warps easily.', link: '/filaments/abs', highlight: true },
  { material: 'ASA', category: 'Standard', nozzleMin: 240, nozzleMax: 265, bedMin: 90, bedMax: 110, enclosure: 'Required', speedMin: 40, speedMax: 80, notes: 'UV-resistant ABS alternative. Similar requirements.', link: '/filaments/asa' },
  // --- Flexible ---
  { material: 'TPU 95A', category: 'Flexible', nozzleMin: 220, nozzleMax: 250, bedMin: 40, bedMax: 60, enclosure: 'Not needed', speedMin: 20, speedMax: 40, notes: 'Direct drive required. Minimize retraction.', link: '/filaments/tpu', highlight: true },
  { material: 'TPU 85A', category: 'Flexible', nozzleMin: 225, nozzleMax: 255, bedMin: 40, bedMax: 60, enclosure: 'Not needed', speedMin: 15, speedMax: 30, notes: 'Very soft. Print extremely slowly.', link: '/filaments/tpu' },
  { material: 'TPE', category: 'Flexible', nozzleMin: 210, nozzleMax: 240, bedMin: 30, bedMax: 50, enclosure: 'Not needed', speedMin: 15, speedMax: 30, notes: 'Highly elastic. Bowden extruders struggle.', link: null },
  // --- Engineering ---
  { material: 'Nylon (PA6)', category: 'Engineering', nozzleMin: 240, nozzleMax: 270, bedMin: 70, bedMax: 90, enclosure: 'Required', speedMin: 30, speedMax: 60, notes: 'Hygroscopic \u2014 must dry before printing.', link: '/filaments/nylon' },
  { material: 'Nylon (PA12)', category: 'Engineering', nozzleMin: 240, nozzleMax: 280, bedMin: 70, bedMax: 100, enclosure: 'Required', speedMin: 30, speedMax: 60, notes: 'Lower moisture absorption than PA6.', link: '/filaments/nylon' },
  { material: 'Polycarbonate (PC)', category: 'Engineering', nozzleMin: 260, nozzleMax: 310, bedMin: 100, bedMax: 120, enclosure: 'Required', speedMin: 30, speedMax: 60, notes: 'Extremely strong. Needs all-metal hotend.', link: '/filaments/polycarbonate' },
  { material: 'PCTG', category: 'Engineering', nozzleMin: 240, nozzleMax: 260, bedMin: 70, bedMax: 90, enclosure: 'Recommended', speedMin: 30, speedMax: 60, notes: 'Tougher PETG variant. Better impact resistance.', link: null },
  { material: 'POM (Acetal)', category: 'Engineering', nozzleMin: 210, nozzleMax: 235, bedMin: 100, bedMax: 130, enclosure: 'Recommended', speedMin: 20, speedMax: 50, notes: 'Low friction. Very difficult bed adhesion.', link: null },
  { material: 'PP (Polypropylene)', category: 'Engineering', nozzleMin: 220, nozzleMax: 250, bedMin: 80, bedMax: 100, enclosure: 'Recommended', speedMin: 20, speedMax: 50, notes: 'Chemically resistant. Warps significantly.', link: null },
  // --- High-Temp ---
  { material: 'PEEK', category: 'High-Temperature', nozzleMin: 370, nozzleMax: 420, bedMin: 120, bedMax: 160, enclosure: 'Required', speedMin: 15, speedMax: 40, notes: 'Industrial-grade. Requires specialty printer.', link: null },
  { material: 'PEI (ULTEM)', category: 'High-Temperature', nozzleMin: 340, nozzleMax: 380, bedMin: 120, bedMax: 160, enclosure: 'Required', speedMin: 15, speedMax: 40, notes: 'Aerospace-grade. Very high temps needed.', link: null },
  // --- Support ---
  { material: 'PVA', category: 'Support', nozzleMin: 180, nozzleMax: 210, bedMin: 45, bedMax: 60, enclosure: 'Not needed', speedMin: 30, speedMax: 50, notes: 'Water-soluble support. Store sealed \u2014 hygroscopic.', link: null },
  { material: 'HIPS', category: 'Support', nozzleMin: 220, nozzleMax: 250, bedMin: 90, bedMax: 110, enclosure: 'Required', speedMin: 40, speedMax: 60, notes: 'Limonene-soluble support. Pairs with ABS.', link: null },
  { material: 'BVOH', category: 'Support', nozzleMin: 190, nozzleMax: 220, bedMin: 50, bedMax: 70, enclosure: 'Not needed', speedMin: 20, speedMax: 40, notes: 'Water-soluble. Faster dissolving than PVA.', link: null },
  // --- Composite ---
  { material: 'PLA Carbon Fiber', category: 'Composite', nozzleMin: 200, nozzleMax: 230, bedMin: 50, bedMax: 65, enclosure: 'Not needed', speedMin: 30, speedMax: 60, notes: 'Abrasive \u2014 use hardened steel nozzle.', link: '/filaments/pla' },
  { material: 'PETG Carbon Fiber', category: 'Composite', nozzleMin: 230, nozzleMax: 260, bedMin: 70, bedMax: 90, enclosure: 'Optional', speedMin: 30, speedMax: 60, notes: 'Stiff and light. Hardened nozzle required.', link: '/filaments/petg' },
  { material: 'Nylon Carbon Fiber', category: 'Composite', nozzleMin: 250, nozzleMax: 280, bedMin: 70, bedMax: 100, enclosure: 'Required', speedMin: 25, speedMax: 50, notes: 'Very strong. Must dry filament thoroughly.', link: '/filaments/nylon' },
  { material: 'PLA Wood Fill', category: 'Composite', nozzleMin: 190, nozzleMax: 220, bedMin: 50, bedMax: 60, enclosure: 'Not needed', speedMin: 30, speedMax: 60, notes: 'Higher temps darken the wood appearance.', link: '/filaments/pla' },
  { material: 'PLA Metal Fill', category: 'Composite', nozzleMin: 195, nozzleMax: 220, bedMin: 50, bedMax: 65, enclosure: 'Not needed', speedMin: 25, speedMax: 50, notes: 'Heavy filament. Abrasive \u2014 hardened nozzle.', link: '/filaments/pla' },
  // --- Specialty ---
  { material: 'PLA Glow-in-Dark', category: 'Specialty', nozzleMin: 195, nozzleMax: 225, bedMin: 50, bedMax: 65, enclosure: 'Not needed', speedMin: 30, speedMax: 60, notes: 'Abrasive particles. Use hardened nozzle.', link: '/filaments/pla' },
  { material: 'PLA Marble', category: 'Specialty', nozzleMin: 195, nozzleMax: 220, bedMin: 50, bedMax: 60, enclosure: 'Not needed', speedMin: 30, speedMax: 70, notes: 'Random marble pattern. No special requirements.', link: '/filaments/pla' },
  { material: 'PLA Color Change', category: 'Specialty', nozzleMin: 190, nozzleMax: 215, bedMin: 50, bedMax: 60, enclosure: 'Not needed', speedMin: 30, speedMax: 60, notes: 'Temp-reactive pigment. Avoid exceeding 220\u00B0C.', link: '/filaments/pla' },
];

const ENCLOSURE_COLORS: Record<string, string> = {
  'Required': 'bg-red-500/10 text-red-400 border-red-500/20',
  'Recommended': 'bg-amber-500/10 text-amber-400 border-amber-500/20',
  'Optional': 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  'Not needed': 'bg-green-500/10 text-green-400 border-green-500/20',
};

const CATEGORY_COLORS: Record<string, string> = {
  'Standard': 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  'Flexible': 'bg-purple-500/10 text-purple-400 border-purple-500/20',
  'Engineering': 'bg-orange-500/10 text-orange-400 border-orange-500/20',
  'High-Temperature': 'bg-red-500/10 text-red-400 border-red-500/20',
  'Support': 'bg-teal-500/10 text-teal-400 border-teal-500/20',
  'Composite': 'bg-amber-500/10 text-amber-400 border-amber-500/20',
  'Specialty': 'bg-pink-500/10 text-pink-400 border-pink-500/20',
};

const CATEGORIES = [...new Set(FILAMENT_DATA.map(f => f.category))];

const FAQS = [
  {
    question: 'What is the best nozzle temperature for PLA filament?',
    answer: 'Most PLA filaments print best between 200\u2013215\u00B0C. Start at 210\u00B0C and adjust in 5\u00B0C increments. PLA+ and silk PLA variants typically need 5\u201310\u00B0C higher. Always check the temperature range printed on your spool label, as values vary between brands by up to 15\u00B0C.',
  },
  {
    question: 'Do I need a heated bed for all filament types?',
    answer: 'No. PLA can print without a heated bed (though 50\u201360\u00B0C improves adhesion). PETG, ABS, ASA, Nylon, and Polycarbonate all require heated beds ranging from 70\u00B0C to 120\u00B0C. Flexible filaments like TPU only need 40\u201360\u00B0C. Check the chart above for each material\u2019s bed temperature range.',
  },
  {
    question: 'Which filaments require an enclosed 3D printer?',
    answer: 'ABS, ASA, Nylon, Polycarbonate, and PEEK all require an enclosed printer to prevent warping and layer splitting caused by drafts and temperature fluctuations. PETG and some composites benefit from an enclosure but can print without one. PLA should generally be printed without an enclosure, as excess ambient heat can cause heat creep.',
  },
  {
    question: 'How do I find the right temperature for a new filament brand?',
    answer: 'Start at the midpoint of the range printed on your spool label. Print a temperature tower (most slicers include a built-in plugin) to test 5\u00B0C increments across the full range. Evaluate each section for surface quality, layer adhesion, stringing, and bridging. The section with the best overall quality is your target temperature.',
  },
  {
    question: 'What is the difference between nozzle temperature and bed temperature?',
    answer: 'Nozzle temperature (also called hotend temperature) controls how fully the filament melts as it is extruded. It affects layer adhesion, surface finish, and stringing. Bed temperature controls first-layer adhesion and warping prevention. Both must be set correctly for a successful print \u2014 wrong nozzle temp causes extrusion issues, while wrong bed temp causes adhesion failures or warping.',
  },
];

/* ------------------------------------------------------------------ */
/*  Quick Reference Cards (top 5 materials)                            */
/* ------------------------------------------------------------------ */

const QUICK_REF = FILAMENT_DATA.filter(f => f.highlight).slice(0, 5);

function QuickRefCard({ data }: { data: FilamentTempData }) {
  return (
    <Card className="border-border hover:border-primary/30 transition-colors">
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-bold text-foreground text-lg">
            {data.link ? (
              <Link to={data.link} className="text-primary hover:underline">{data.material}</Link>
            ) : data.material}
          </h3>
          <Badge variant="outline" className={CATEGORY_COLORS[data.category]}>{data.category}</Badge>
        </div>
        <div className="grid grid-cols-2 gap-y-2 gap-x-4 text-sm">
          <div className="flex items-center gap-1.5 text-muted-foreground">
            <Thermometer className="w-3.5 h-3.5 text-red-400 shrink-0" />
            <span>Nozzle: <span className="font-mono font-medium text-foreground">{data.nozzleMin}\u2013{data.nozzleMax}\u00B0C</span></span>
          </div>
          <div className="flex items-center gap-1.5 text-muted-foreground">
            <ThermometerSun className="w-3.5 h-3.5 text-amber-400 shrink-0" />
            <span>Bed: <span className="font-mono font-medium text-foreground">{data.bedMin}\u2013{data.bedMax}\u00B0C</span></span>
          </div>
          <div className="flex items-center gap-1.5 text-muted-foreground">
            <Gauge className="w-3.5 h-3.5 text-blue-400 shrink-0" />
            <span>Speed: <span className="font-mono font-medium text-foreground">{data.speedMin}\u2013{data.speedMax} mm/s</span></span>
          </div>
          <div className="flex items-center gap-1.5 text-muted-foreground">
            <Shield className="w-3.5 h-3.5 text-green-400 shrink-0" />
            <span>Enclosure: <span className="font-medium text-foreground">{data.enclosure}</span></span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

/* ------------------------------------------------------------------ */
/*  Temperature Bar Visualization                                      */
/* ------------------------------------------------------------------ */

function TempBar({ min, max, globalMin, globalMax, color }: { min: number; max: number; globalMin: number; globalMax: number; color: string }) {
  const range = globalMax - globalMin;
  const left = ((min - globalMin) / range) * 100;
  const width = ((max - min) / range) * 100;

  return (
    <div className="relative w-full h-5 bg-muted/30 rounded-sm overflow-hidden" title={`${min}\u2013${max}\u00B0C`}>
      <div
        className={`absolute top-0 h-full rounded-sm ${color}`}
        style={{ left: `${left}%`, width: `${Math.max(width, 2)}%` }}
      />
      <span className="absolute inset-0 flex items-center justify-center text-[10px] font-mono font-medium text-foreground leading-none">
        {min}\u2013{max}\u00B0C
      </span>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Page Component                                                     */
/* ------------------------------------------------------------------ */

export default function FilamentTemperatureChart() {
  const canonical = 'https://filascope.com/filament-temperature-chart';
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState<string | null>(null);

  const filtered = useMemo(() => {
    let results = FILAMENT_DATA;
    if (activeCategory) {
      results = results.filter(f => f.category === activeCategory);
    }
    if (search.trim()) {
      const q = search.toLowerCase().trim();
      results = results.filter(f =>
        f.material.toLowerCase().includes(q) ||
        f.category.toLowerCase().includes(q) ||
        f.notes.toLowerCase().includes(q)
      );
    }
    return results;
  }, [search, activeCategory]);

  const nozzleGlobalMin = 170;
  const nozzleGlobalMax = 430;
  const bedGlobalMin = 20;
  const bedGlobalMax = 170;

  return (
    <>
      <DocumentHead
        title="3D Printer Filament Temperature Chart — Complete Settings Reference | FilaScope"
        description="Complete 3D filament temperature chart with nozzle and bed temp settings for PLA, PETG, ABS, TPU, Nylon, ASA, PC and 15+ materials. Updated 2026."
        canonical={canonical}
        ogTitle="3D Printer Filament Temperature Chart — Complete Reference"
        ogDescription="Complete 3D filament temperature chart with nozzle and bed temp settings for PLA, PETG, ABS, TPU, Nylon, ASA, PC and 15+ materials."
      />
      <ArticleSchema
        headline="3D Printer Filament Temperature Chart"
        description="Complete 3D filament temperature chart with nozzle and bed temp settings for PLA, PETG, ABS, TPU, Nylon, ASA, PC and 15+ materials. Updated 2026."
        datePublished="2026-03-20"
        dateModified="2026-03-20"
        url="/filament-temperature-chart"
        articleType="TechArticle"
        about={{ '@type': 'Thing', name: '3D Printer Filament Temperature Settings' }}
        proficiencyLevel="Beginner"
      />

      <div className="min-h-screen bg-background">
        {/* Breadcrumbs */}
        <div className="max-w-6xl mx-auto px-4 py-6">
          <Breadcrumbs items={[
            { name: 'Guides', url: '/guides' },
            { name: 'Filament Temperature Chart', url: '/filament-temperature-chart' },
          ]} />
        </div>

        {/* Hero */}
        <section className="bg-gradient-to-b from-primary/5 to-transparent py-12 px-4">
          <div className="max-w-6xl mx-auto">
            <Badge className="mb-4 bg-primary/10 text-primary border-primary/20">Reference Chart &middot; Updated March 2026</Badge>
            <h1 className="text-3xl md:text-4xl font-bold mb-4 text-foreground">
              3D Printer Filament Temperature Chart
            </h1>
            <p className="text-lg text-muted-foreground leading-relaxed max-w-3xl">
              A complete temperature reference chart for every common 3D printing filament type. Find the right nozzle temperature,
              bed temperature, print speed, and enclosure requirements for {FILAMENT_DATA.length} materials at a glance.
            </p>
          </div>
        </section>

        <div className="max-w-6xl mx-auto px-4 py-10 space-y-14">

          {/* Quick Reference */}
          <section>
            <h2 className="text-2xl font-bold mb-2">Quick Reference &mdash; 5 Most Common Materials</h2>
            <p className="text-sm text-muted-foreground mb-4">
              The five filament types you will use most often. For the full chart with {FILAMENT_DATA.length} materials, scroll down.
            </p>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
              {QUICK_REF.map(data => (
                <QuickRefCard key={data.material} data={data} />
              ))}
            </div>
          </section>

          {/* Full Temperature Chart */}
          <section>
            <h2 className="text-2xl font-bold mb-2">Complete Filament Temperature Chart</h2>
            <p className="text-sm text-muted-foreground mb-5">
              All {FILAMENT_DATA.length} filament types with nozzle temperatures, bed temperatures, speed ranges, enclosure requirements, and usage notes.
              Temperature bars show the relative range visually. Click a material name to view brand-specific temperatures in our{' '}
              <Link to="/filaments" className="text-primary hover:underline">filament database</Link>.
            </p>

            {/* Filters */}
            <div className="flex flex-col sm:flex-row gap-3 mb-5">
              <div className="relative flex-1 max-w-sm">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                <Input
                  type="text"
                  placeholder="Search materials..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-9"
                />
              </div>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => setActiveCategory(null)}
                  className={`px-3 py-1.5 text-xs font-medium rounded-md border transition-colors ${
                    activeCategory === null
                      ? 'bg-primary text-primary-foreground border-primary'
                      : 'bg-muted/30 text-muted-foreground border-border hover:border-primary/30'
                  }`}
                >
                  All ({FILAMENT_DATA.length})
                </button>
                {CATEGORIES.map(cat => {
                  const count = FILAMENT_DATA.filter(f => f.category === cat).length;
                  return (
                    <button
                      key={cat}
                      onClick={() => setActiveCategory(activeCategory === cat ? null : cat)}
                      className={`px-3 py-1.5 text-xs font-medium rounded-md border transition-colors ${
                        activeCategory === cat
                          ? 'bg-primary text-primary-foreground border-primary'
                          : 'bg-muted/30 text-muted-foreground border-border hover:border-primary/30'
                      }`}
                    >
                      {cat} ({count})
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Chart Table */}
            <Card className="border-border overflow-hidden">
              <CardContent className="p-0 overflow-x-auto">
                <table className="w-full text-sm min-w-[960px]">
                  <thead>
                    <tr className="border-b border-border bg-muted/30">
                      <th className="text-left p-3 font-semibold w-[160px]">Material</th>
                      <th className="text-left p-3 font-semibold">Category</th>
                      <th className="text-left p-3 font-semibold w-[200px]">
                        <span className="flex items-center gap-1"><Thermometer className="w-3.5 h-3.5 text-red-400" /> Nozzle Temp</span>
                      </th>
                      <th className="text-left p-3 font-semibold w-[200px]">
                        <span className="flex items-center gap-1"><ThermometerSun className="w-3.5 h-3.5 text-amber-400" /> Bed Temp</span>
                      </th>
                      <th className="text-left p-3 font-semibold">
                        <span className="flex items-center gap-1"><Gauge className="w-3.5 h-3.5 text-blue-400" /> Speed</span>
                      </th>
                      <th className="text-left p-3 font-semibold">Enclosure</th>
                      <th className="text-left p-3 font-semibold">Notes</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.length === 0 && (
                      <tr>
                        <td colSpan={7} className="p-8 text-center text-muted-foreground">
                          No materials match your search. Try a different term.
                        </td>
                      </tr>
                    )}
                    {filtered.map((row) => (
                      <tr key={row.material} className="border-b border-border last:border-0 hover:bg-muted/20 transition-colors">
                        <td className="p-3 font-medium">
                          {row.link ? (
                            <Link to={row.link} className="text-primary hover:underline">{row.material}</Link>
                          ) : (
                            row.material
                          )}
                        </td>
                        <td className="p-3">
                          <Badge variant="outline" className={`text-[10px] ${CATEGORY_COLORS[row.category]}`}>
                            {row.category}
                          </Badge>
                        </td>
                        <td className="p-3">
                          <TempBar min={row.nozzleMin} max={row.nozzleMax} globalMin={nozzleGlobalMin} globalMax={nozzleGlobalMax} color="bg-red-500/40" />
                        </td>
                        <td className="p-3">
                          <TempBar min={row.bedMin} max={row.bedMax} globalMin={bedGlobalMin} globalMax={bedGlobalMax} color="bg-amber-500/40" />
                        </td>
                        <td className="p-3 font-mono text-xs text-muted-foreground whitespace-nowrap">
                          {row.speedMin}&ndash;{row.speedMax} mm/s
                        </td>
                        <td className="p-3">
                          <Badge variant="outline" className={`text-[10px] ${ENCLOSURE_COLORS[row.enclosure]}`}>
                            {row.enclosure}
                          </Badge>
                        </td>
                        <td className="p-3 text-xs text-muted-foreground max-w-[200px]">{row.notes}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </CardContent>
            </Card>

            <p className="text-xs text-muted-foreground mt-3 flex items-start gap-1.5">
              <Info className="w-3.5 h-3.5 shrink-0 mt-0.5" />
              Temperature ranges shown are typical starting points. Actual values vary between brands by up to 15&deg;C.
              Check the spool label and print a temperature tower for best results.
            </p>
          </section>

          {/* How to Read This Chart */}
          <section>
            <h2 className="text-2xl font-bold mb-4">How to Read This Temperature Chart</h2>
            <div className="grid sm:grid-cols-2 gap-6">
              <div className="rounded-lg border border-border p-5 bg-card/50">
                <div className="flex items-center gap-2 mb-2">
                  <Thermometer className="w-5 h-5 text-red-400" />
                  <h3 className="font-semibold">Nozzle Temperature</h3>
                </div>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  The hotend temperature at which the filament melts and is extruded. Start at the midpoint of the range shown in the chart,
                  then adjust in 5&deg;C increments based on print quality. The red bars show the range visually so you can compare materials at a glance.
                </p>
              </div>
              <div className="rounded-lg border border-border p-5 bg-card/50">
                <div className="flex items-center gap-2 mb-2">
                  <ThermometerSun className="w-5 h-5 text-amber-400" />
                  <h3 className="font-semibold">Bed Temperature</h3>
                </div>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  The heated build plate temperature for first-layer adhesion. Too low causes prints to pop off mid-print; too high makes them
                  fuse permanently to the bed. The amber bars show the relative range for easy comparison across material types.
                </p>
              </div>
              <div className="rounded-lg border border-border p-5 bg-card/50">
                <div className="flex items-center gap-2 mb-2">
                  <Gauge className="w-5 h-5 text-blue-400" />
                  <h3 className="font-semibold">Print Speed</h3>
                </div>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  The recommended speed range in millimeters per second. Flexible filaments require much slower speeds than rigid materials.
                  Higher speeds may require slightly higher nozzle temperatures to maintain proper melt flow.
                </p>
              </div>
              <div className="rounded-lg border border-border p-5 bg-card/50">
                <div className="flex items-center gap-2 mb-2">
                  <Shield className="w-5 h-5 text-green-400" />
                  <h3 className="font-semibold">Enclosure Requirement</h3>
                </div>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Whether the material needs an enclosed build chamber. Required means the material will warp or delaminate without one.
                  Recommended means it helps with consistency but is not strictly necessary. PLA should not be enclosed.
                </p>
              </div>
            </div>
          </section>

          {/* Visual Temperature Map */}
          <section>
            <h2 className="text-2xl font-bold mb-2">Temperature Comparison by Category</h2>
            <p className="text-sm text-muted-foreground mb-5">
              Side-by-side nozzle temperature ranges grouped by category. Engineering and high-temperature materials
              require significantly hotter nozzles than standard materials.
            </p>
            <div className="space-y-6">
              {CATEGORIES.map(cat => {
                const items = FILAMENT_DATA.filter(f => f.category === cat);
                return (
                  <Card key={cat} className="border-border">
                    <CardContent className="p-4">
                      <h3 className="font-semibold text-sm mb-3 flex items-center gap-2">
                        <Badge variant="outline" className={CATEGORY_COLORS[cat]}>{cat}</Badge>
                        <span className="text-muted-foreground font-normal">{items.length} material{items.length !== 1 ? 's' : ''}</span>
                      </h3>
                      <div className="space-y-2">
                        {items.map(item => (
                          <div key={item.material} className="flex items-center gap-3">
                            <span className="text-xs font-medium w-[130px] shrink-0 truncate text-muted-foreground">{item.material}</span>
                            <div className="flex-1">
                              <TempBar min={item.nozzleMin} max={item.nozzleMax} globalMin={nozzleGlobalMin} globalMax={nozzleGlobalMax} color="bg-red-500/40" />
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </section>

          {/* Related Links */}
          <section className="bg-muted/30 rounded-xl p-6 border border-border">
            <h2 className="text-lg font-semibold mb-4">Related Guides & Tools</h2>
            <div className="grid sm:grid-cols-2 gap-3">
              {[
                { to: '/guides/filament-temperature-guide', label: 'Filament Temperature Guide (in-depth)' },
                { to: '/filaments', label: 'Browse all filaments with brand-specific temps' },
                { to: '/matrix', label: 'Printer\u2013Filament Compatibility Matrix' },
                { to: '/compare', label: 'Compare filaments side by side' },
                { to: '/guides/how-to-choose-3d-printer-filament', label: 'How to Choose 3D Printer Filament' },
                { to: '/guides/pla-vs-petg', label: 'PLA vs PETG Comparison' },
                { to: '/guides/best-pla-filaments', label: 'Best PLA Filaments 2026' },
                { to: '/guides/3d-printer-filament-types-explained', label: 'Filament Types Explained' },
              ].map((link) => (
                <Link key={link.to} to={link.to} className="flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors">
                  <ArrowRight className="w-3.5 h-3.5 text-primary shrink-0" />
                  {link.label}
                </Link>
              ))}
            </div>
          </section>

          {/* FAQ */}
          <FAQSection faqs={FAQS} />
        </div>
      </div>
    </>
  );
}
