import { useState, useMemo, useCallback, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { HexColorPicker } from 'react-colorful';
import { Palette, Search, Pipette, Image as ImageIcon, Layers } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Skeleton } from '@/components/ui/skeleton';
import { DocumentHead } from '@/components/seo/DocumentHead';
import { Breadcrumbs, BreadcrumbSchema } from '@/components/seo';
import { useColorFinderFilaments, type ColorFinderFilament } from '@/hooks/useColorFinderFilaments';
import { hexToLab, deltaE76, deltaEToMatchPercent } from '@/lib/colorLabUtils';
import { ImageEyedropper } from '@/components/hueforge/color-matcher/ImageEyedropper';
import { ColorMatchResultCard } from '@/components/hueforge/color-matcher/ColorMatchResultCard';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';

const LS_KEY = 'hfp-color-matcher-recent';

function isValidHex(hex: string): boolean {
  return /^#[0-9a-fA-F]{6}$/.test(hex);
}

interface MatchedFilament {
  filament: ColorFinderFilament;
  matchPercent: number;
  deltaE: number;
  td: number;
}

function computeMatches(
  filaments: ColorFinderFilament[],
  targetHex: string,
  tdRange: [number, number],
  materialFilter: string
): MatchedFilament[] {
  const targetLab = hexToLab(targetHex);
  if (!targetLab) return [];

  const results: MatchedFilament[] = [];
  for (const f of filaments) {
    if (!f.color_hex || f.transmission_distance == null) continue;
    const td = f.transmission_distance;
    if (td < tdRange[0] || td > tdRange[1]) continue;
    if (materialFilter !== 'all' && f.material?.toLowerCase() !== materialFilter) continue;

    const lab = hexToLab(f.color_hex);
    if (!lab) continue;
    const de = deltaE76(targetLab, lab);
    const pct = deltaEToMatchPercent(de);
    if (pct > 0) {
      results.push({ filament: f, matchPercent: pct, deltaE: de, td });
    }
  }

  results.sort((a, b) => a.deltaE - b.deltaE);
  return results;
}

export default function HueForgeColorMatcher() {
  const { data: allFilaments, isLoading } = useColorFinderFilaments();
  const tdFilaments = useMemo(
    () => (allFilaments || []).filter((f) => f.transmission_distance != null),
    [allFilaments]
  );

  const [hexInput, setHexInput] = useState('#8B4513');
  const [activeColor, setActiveColor] = useState('#8B4513');
  const [pickerColor, setPickerColor] = useState('#8B4513');
  const [tdRange, setTdRange] = useState<[number, number]>([0, 10]);
  const [materialFilter, setMaterialFilter] = useState('all');
  const [groupByTd, setGroupByTd] = useState(false);
  const [visibleCount, setVisibleCount] = useState(20);
  const [recentColors, setRecentColors] = useState<string[]>([]);

  // Load recent colors from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem(LS_KEY);
      if (saved) setRecentColors(JSON.parse(saved));
    } catch {}
  }, []);

  const saveRecentColor = useCallback((hex: string) => {
    setRecentColors((prev) => {
      const next = [hex, ...prev.filter((c) => c !== hex)].slice(0, 8);
      try { localStorage.setItem(LS_KEY, JSON.stringify(next)); } catch {}
      return next;
    });
  }, []);

  const doMatch = useCallback((hex: string) => {
    if (!isValidHex(hex)) return;
    setActiveColor(hex);
    setVisibleCount(20);
    saveRecentColor(hex);
  }, [saveRecentColor]);

  const matches = useMemo(
    () => computeMatches(tdFilaments, activeColor, tdRange, materialFilter),
    [tdFilaments, activeColor, tdRange, materialFilter]
  );

  const materials = useMemo(() => {
    const set = new Set<string>();
    tdFilaments.forEach((f) => { if (f.material) set.add(f.material); });
    return Array.from(set).sort();
  }, [tdFilaments]);

  const grouped = useMemo(() => {
    if (!groupByTd) return null;
    return {
      opaque: matches.filter((m) => m.td < 1),
      midtone: matches.filter((m) => m.td >= 1 && m.td <= 3),
      translucent: matches.filter((m) => m.td > 3 && m.td <= 5),
      veryTranslucent: matches.filter((m) => m.td > 5),
    };
  }, [matches, groupByTd]);

  const renderResults = (items: MatchedFilament[], limit?: number) => {
    const shown = limit ? items.slice(0, limit) : items;
    if (!shown.length) return <p className="text-sm text-muted-foreground py-4">No matches in this range.</p>;
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {shown.map((m) => (
          <ColorMatchResultCard
            key={m.filament.id}
            filament={m.filament}
            targetHex={activeColor}
            matchPercent={m.matchPercent}
            td={m.td}
          />
        ))}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-background to-muted/20">
      <DocumentHead
        title="HueForge Color Matcher — Find Filaments by Color + TD"
        description="Match any color to real filaments with verified TD values. Upload an image, pick colors, and find the perfect filament for your HueForge project."
      />
      <BreadcrumbSchema
        items={[
          { name: 'Home', url: 'https://filascope.com' },
          { name: 'HueForge TD Database', url: 'https://filascope.com/hueforge-td-database' },
          { name: 'Color Matcher', url: 'https://filascope.com/hueforge-color-matcher' },
        ]}
      />
      <Breadcrumbs
        items={[
          { name: 'HueForge TD Database', url: '/hueforge-td-database' },
          { name: 'Color Matcher', url: '/hueforge-color-matcher' },
        ]}
        className="max-w-6xl mx-auto px-4 pt-6 pb-1"
      />

      <div className="max-w-6xl mx-auto px-4 py-12">
        {/* Hero */}
        <section className="text-center mb-12">
          <Badge variant="outline" className="mb-4 text-sm">
            <Palette className="w-3 h-3 mr-1 text-primary" />
            Color Matcher
          </Badge>
          <h1 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-orange-400 to-primary bg-clip-text text-transparent">
            HueForge Color Matcher
          </h1>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Match any color to real filaments with verified TD values. Find the perfect filament for every shade in your HueForge project.
          </p>
        </section>

        {/* Color Input */}
        <section className="mb-10">
          <Tabs defaultValue="hex" className="max-w-2xl mx-auto">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="hex" className="gap-1.5"><Search className="w-3.5 h-3.5" /> Hex Code</TabsTrigger>
              <TabsTrigger value="picker" className="gap-1.5"><Pipette className="w-3.5 h-3.5" /> Color Picker</TabsTrigger>
              <TabsTrigger value="image" className="gap-1.5"><ImageIcon className="w-3.5 h-3.5" /> Image Eyedropper</TabsTrigger>
            </TabsList>

            <TabsContent value="hex" className="mt-6">
              <div className="flex items-center gap-4 justify-center">
                <div
                  className="w-20 h-20 rounded-lg border border-border/30 shrink-0 transition-colors"
                  style={{ backgroundColor: isValidHex(hexInput) ? hexInput : '#333' }}
                />
                <div className="flex flex-col gap-2">
                  <Input
                    value={hexInput}
                    onChange={(e) => {
                      let v = e.target.value;
                      if (!v.startsWith('#')) v = '#' + v;
                      setHexInput(v.toUpperCase());
                    }}
                    placeholder="#8B4513"
                    className="w-40 text-lg font-mono"
                    maxLength={7}
                  />
                  <Button onClick={() => doMatch(hexInput)} disabled={!isValidHex(hexInput)}>
                    Match
                  </Button>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="picker" className="mt-6">
              <div className="flex flex-col items-center gap-4">
                <HexColorPicker
                  color={pickerColor}
                  onChange={(c) => {
                    setPickerColor(c);
                    setHexInput(c.toUpperCase());
                  }}
                  style={{ width: '100%', maxWidth: 280 }}
                />
                <div className="flex items-center gap-3">
                  <div
                    className="w-12 h-12 rounded-lg border border-border/30"
                    style={{ backgroundColor: pickerColor }}
                  />
                  <span className="font-mono text-sm">{pickerColor.toUpperCase()}</span>
                  <Button size="sm" onClick={() => doMatch(pickerColor)}>Match</Button>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="image" className="mt-6">
              <ImageEyedropper
                onColorPick={(hex) => {
                  setHexInput(hex);
                  doMatch(hex);
                }}
              />
            </TabsContent>
          </Tabs>

          {/* Recent colors */}
          {recentColors.length > 0 && (
            <div className="flex items-center justify-center gap-2 mt-6">
              <span className="text-xs text-muted-foreground">Recent:</span>
              {recentColors.map((c) => (
                <button
                  key={c}
                  onClick={() => {
                    setHexInput(c);
                    doMatch(c);
                  }}
                  className="w-6 h-6 rounded border border-border/30 hover:ring-2 ring-primary transition-all"
                  style={{ backgroundColor: c }}
                  title={c}
                />
              ))}
            </div>
          )}
        </section>

        {/* Results */}
        {isLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-24" />)}
          </div>
        ) : (
          <section>
            {/* Results header + filters */}
            <div className="flex flex-wrap items-center gap-4 mb-6">
              <div className="flex items-center gap-2">
                <div
                  className="w-6 h-6 rounded border border-border/30"
                  style={{ backgroundColor: activeColor }}
                />
                <h2 className="text-lg font-semibold">
                  Filaments matching <span className="font-mono text-primary">{activeColor}</span>
                </h2>
                <Badge variant="secondary" className="text-xs">{matches.length} results</Badge>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-4 mb-6">
              {/* TD filter */}
              <div className="flex items-center gap-2 min-w-[200px]">
                <Label className="text-xs whitespace-nowrap">TD Range:</Label>
                <Slider
                  min={0}
                  max={10}
                  step={0.1}
                  value={tdRange}
                  onValueChange={(v) => setTdRange(v as [number, number])}
                  className="w-32"
                />
                <span className="text-xs text-muted-foreground font-mono w-16">
                  {tdRange[0].toFixed(1)}–{tdRange[1].toFixed(1)}
                </span>
              </div>

              {/* Material filter */}
              <Select value={materialFilter} onValueChange={setMaterialFilter}>
                <SelectTrigger className="w-32 h-8 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Materials</SelectItem>
                  {materials.map((m) => (
                    <SelectItem key={m} value={m.toLowerCase()}>{m}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* Group by TD */}
              <div className="flex items-center gap-2">
                <Switch checked={groupByTd} onCheckedChange={setGroupByTd} id="group-td" />
                <Label htmlFor="group-td" className="text-xs cursor-pointer">Group by TD range</Label>
              </div>
            </div>

            {/* Results grid */}
            {groupByTd && grouped ? (
              <div className="space-y-8">
                {[
                  { title: 'Opaque matches (TD 0–1)', subtitle: 'Good for base layers', items: grouped.opaque },
                  { title: 'Mid-tone matches (TD 1–3)', subtitle: 'Good for detail layers', items: grouped.midtone },
                  { title: 'Translucent matches (TD 3–5)', subtitle: 'Good for highlight layers', items: grouped.translucent },
                  { title: 'Very Translucent (TD 5+)', subtitle: 'Maximum light transmission', items: grouped.veryTranslucent },
                ].map((g) => g.items.length > 0 && (
                  <div key={g.title}>
                    <h3 className="text-sm font-semibold mb-1">{g.title}</h3>
                    <p className="text-xs text-muted-foreground mb-3">{g.subtitle}</p>
                    {renderResults(g.items, 10)}
                  </div>
                ))}
              </div>
            ) : (
              <>
                {renderResults(matches.slice(0, visibleCount))}
                {visibleCount < matches.length && (
                  <div className="text-center mt-6">
                    <Button variant="outline" onClick={() => setVisibleCount((c) => c + 20)}>
                      Show more ({matches.length - visibleCount} remaining)
                    </Button>
                  </div>
                )}
              </>
            )}
          </section>
        )}

        {/* Tips */}
        <section className="mt-16 max-w-3xl mx-auto">
          <Accordion type="single" collapsible defaultValue="tips">
            <AccordionItem value="tips" className="border rounded-lg px-4">
              <AccordionTrigger className="text-sm font-semibold">
                Tips for Color Matching in HueForge
              </AccordionTrigger>
              <AccordionContent>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li className="flex gap-2"><span className="text-primary shrink-0">•</span>HueForge displays colors differently than they appear on screen — always print a test swatch.</li>
                  <li className="flex gap-2"><span className="text-primary shrink-0">•</span>Matte filaments photograph closer to their true color than glossy or silk finishes.</li>
                  <li className="flex gap-2"><span className="text-primary shrink-0">•</span>TD affects how colors appear when backlit — a high-TD red looks completely different from a low-TD red.</li>
                  <li className="flex gap-2"><span className="text-primary shrink-0">•</span>Some brands publish official HueForge color profiles — check Polymaker and Bambu Lab for verified swatches.</li>
                </ul>
                <p className="mt-4 text-xs text-muted-foreground/70 italic">
                  Color accuracy note: Filament hex codes in our database are approximations. Actual printed colors vary based on temperature, speed, and lighting.
                </p>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </section>
      </div>
    </div>
  );
}
