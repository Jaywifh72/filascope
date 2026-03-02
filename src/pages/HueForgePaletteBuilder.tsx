import { useState, useEffect, useCallback } from 'react';
import { Link, useSearchParams, useNavigate } from "react-router-dom";
import { Palette, ArrowRight, Clipboard, Link2, Download, RotateCcw, BarChart3, Layers, ShoppingCart, Eye, Loader2 } from "lucide-react";
import { DocumentHead } from "@/components/seo/DocumentHead";
import { Breadcrumbs, BreadcrumbSchema } from "@/components/seo";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { SiteFooter } from "@/components/SiteFooter";
import { HueForgeToolsCrossLinks } from "@/components/hueforge/HueForgeToolsCrossLinks";
import { HueForgeToolsNav } from "@/components/hueforge/HueForgeToolsNav";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { usePaletteBuilder, type PaletteEntry } from "@/hooks/usePaletteBuilder";
import { PaletteFilamentSearch } from "@/components/hueforge/palette-builder/PaletteFilamentSearch";
import { PaletteList } from "@/components/hueforge/palette-builder/PaletteList";
import { PaletteAnalysis } from "@/components/hueforge/palette-builder/PaletteAnalysis";
import { PaletteLayerPreview } from "@/components/hueforge/palette-builder/PaletteLayerPreview";
import { PaletteShoppingList } from "@/components/hueforge/palette-builder/PaletteShoppingList";

// ── Preset definitions ──────────────────────────────────────────

interface PresetSlot {
  colorFamily: string;
  tdMin: number;
  tdMax: number;
  layers: number;
}

interface PresetDef {
  key: string;
  name: string;
  slots: PresetSlot[];
}

const PRESETS: PresetDef[] = [
  {
    key: 'portrait',
    name: 'Classic Portrait (4 colors)',
    slots: [
      { colorFamily: 'black', tdMin: 0, tdMax: 0.8, layers: 3 },
      { colorFamily: 'brown', tdMin: 1, tdMax: 2, layers: 2 },
      { colorFamily: 'beige', tdMin: 2, tdMax: 3.5, layers: 1 },
      { colorFamily: 'white', tdMin: 3.5, tdMax: 10, layers: 1 },
    ],
  },
  {
    key: 'landscape',
    name: 'Landscape (5 colors)',
    slots: [
      { colorFamily: 'black', tdMin: 0, tdMax: 0.8, layers: 3 },
      { colorFamily: 'brown', tdMin: 0.8, tdMax: 2, layers: 2 },
      { colorFamily: 'green', tdMin: 1.5, tdMax: 3, layers: 1 },
      { colorFamily: 'blue', tdMin: 2.5, tdMax: 5, layers: 1 },
      { colorFamily: 'white', tdMin: 4, tdMax: 10, layers: 1 },
    ],
  },
  {
    key: 'contrast',
    name: 'High Contrast (3 colors)',
    slots: [
      { colorFamily: 'black', tdMin: 0, tdMax: 0.8, layers: 4 },
      { colorFamily: 'gray', tdMin: 1, tdMax: 3, layers: 2 },
      { colorFamily: 'white', tdMin: 3, tdMax: 10, layers: 1 },
    ],
  },
  {
    key: 'monochrome',
    name: 'Monochrome Gradient (4 colors)',
    slots: [
      { colorFamily: 'black', tdMin: 0, tdMax: 0.8, layers: 3 },
      { colorFamily: 'gray', tdMin: 0.8, tdMax: 2, layers: 2 },
      { colorFamily: 'gray', tdMin: 2, tdMax: 4, layers: 1 },
      { colorFamily: 'white', tdMin: 4, tdMax: 10, layers: 1 },
    ],
  },
];

// ── Helpers ──────────────────────────────────────────────────────

function buildShareUrl(palette: PaletteEntry[]): string {
  const segments = palette.map((p) => `${p.filamentId},${p.layers}`).join('|');
  return `${window.location.origin}/hueforge-palette-builder?p=${segments}`;
}

function buildConfigText(palette: PaletteEntry[], tdMin: number | null, tdMax: number | null, tdAvg: number | null): string {
  const totalLayers = palette.reduce((s, p) => s + p.layers, 0);
  const lines: string[] = [
    `HueForge Palette (${palette.length} filaments, ${totalLayers} total layers)`,
    '─────────────────────────',
  ];
  palette.forEach((p, i) => {
    const label = i === 0 ? 'Base' : i === palette.length - 1 ? 'Top' : `Layer ${i + 1}`;
    lines.push(`${label}: ${p.brand} ${p.filamentName} — TD ${p.tdValue.toFixed(2)} × ${p.layers} layer${p.layers > 1 ? 's' : ''}`);
  });
  lines.push('─────────────────────────');
  lines.push(`TD Range: ${tdMin?.toFixed(2) ?? '—'} – ${tdMax?.toFixed(2) ?? '—'} | Avg: ${tdAvg?.toFixed(2) ?? '—'}`);
  lines.push(`Built with FilaScope Palette Builder`);
  lines.push(`https://filascope.com/hueforge-palette-builder`);
  return lines.join('\n');
}

function downloadCsv(palette: PaletteEntry[]) {
  const header = 'Position,Brand,Product,Material,Color (hex),TD Value,Layers,Price';
  const rows = palette.map((p, i) =>
    [
      i + 1,
      `"${p.brand}"`,
      `"${p.filamentName}"`,
      `"${p.material}"`,
      p.color || '',
      p.tdValue.toFixed(2),
      p.layers,
      p.price != null ? p.price.toFixed(2) : '',
    ].join(',')
  );
  const csv = [header, ...rows].join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  const date = new Date().toISOString().slice(0, 10);
  a.href = url;
  a.download = `filascope-palette-${date}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

// ── Page component ───────────────────────────────────────────────

export default function HueForgePaletteBuilder() {
  const {
    palette,
    addFilament,
    removeFilament,
    updateLayers,
    reorderFilament,
    clearPalette,
    loadPalette,
    totalLayers,
    tdMin,
    tdMax,
    tdAvg,
    isFull,
  } = usePaletteBuilder();

  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [presetLoading, setPresetLoading] = useState(false);
  const [urlRestored, setUrlRestored] = useState(false);

  const hasPalette = palette.length > 0;

  // ── URL restore (?p=) and ?add= handler ──────────────────────
  useEffect(() => {
    if (urlRestored) return;
    const pParam = searchParams.get('p');
    const addParam = searchParams.get('add');

    const processAdd = async () => {
      if (!addParam) return;
      const { data, error } = await supabase
        .from('filaments')
        .select('id, product_title, vendor, material, color_family, color_hex, transmission_distance, variant_price, product_handle')
        .eq('id', addParam)
        .maybeSingle();

      if (error || !data || data.transmission_distance == null) {
        toast.error('Could not add filament — it may not have TD data');
        return;
      }

      addFilament({
        filamentId: data.id,
        filamentName: data.product_title ?? '',
        brand: data.vendor ?? '',
        material: data.material ?? '',
        color: data.color_hex ?? '',
        tdValue: data.transmission_distance ?? 0,
        colorFamily: data.color_family ?? '',
        slug: data.product_handle ?? undefined,
        price: data.variant_price,
      });
    };

    if (!pParam) {
      // No ?p= — just handle ?add= if present
      if (addParam) {
        processAdd().finally(() => {
          navigate('/hueforge-palette-builder', { replace: true });
          setUrlRestored(true);
        });
      } else {
        setUrlRestored(true);
      }
      return;
    }

    // Handle ?p= first, then ?add=
    const segments = pParam.split('|').map((s) => {
      const [id, layersStr] = s.split(',');
      return { id, layers: parseInt(layersStr) || 1 };
    }).filter((s) => s.id);

    if (!segments.length) {
      if (addParam) {
        processAdd().finally(() => {
          navigate('/hueforge-palette-builder', { replace: true });
          setUrlRestored(true);
        });
      } else {
        setUrlRestored(true);
      }
      return;
    }

    (async () => {
      const ids = segments.map((s) => s.id);
      const { data, error } = await supabase
        .from('filaments')
        .select('id, product_title, vendor, material, color_family, color_hex, transmission_distance, variant_price, product_handle')
        .in('id', ids);

      if (error || !data) {
        toast.error('Failed to load shared palette');
        if (addParam) await processAdd();
        navigate('/hueforge-palette-builder', { replace: true });
        setUrlRestored(true);
        return;
      }

      const entries: PaletteEntry[] = [];
      let skipped = 0;
      for (const seg of segments) {
        const f = data.find((d) => d.id === seg.id);
        if (!f) { skipped++; continue; }
        entries.push({
          filamentId: f.id,
          filamentName: f.product_title ?? '',
          brand: f.vendor ?? '',
          material: f.material ?? '',
          color: f.color_hex ?? '',
          tdValue: f.transmission_distance ?? 0,
          colorFamily: f.color_family ?? '',
          layers: seg.layers,
          slug: f.product_handle ?? undefined,
          price: f.variant_price,
        });
      }

      if (entries.length) {
        loadPalette(entries);
        toast.success(`Loaded shared palette with ${entries.length} filament${entries.length > 1 ? 's' : ''}`);
      }
      if (skipped > 0) {
        toast.warning('Some filaments could not be loaded from the shared palette');
      }

      // Process ?add= after palette restore
      if (addParam) await processAdd();

      navigate('/hueforge-palette-builder', { replace: true });
      setUrlRestored(true);
    })();
  }, [urlRestored]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Toolbar actions ──────────────────────────────────────────

  const handleCopyConfig = useCallback(() => {
    if (!hasPalette) { toast.info('Add filaments first'); return; }
    const text = buildConfigText(palette, tdMin, tdMax, tdAvg);
    navigator.clipboard.writeText(text);
    toast.success('Palette config copied to clipboard!');
  }, [palette, tdMin, tdMax, tdAvg, hasPalette]);

  const handleCopyLink = useCallback(() => {
    if (!hasPalette) { toast.info('Add filaments to share your palette'); return; }
    const url = buildShareUrl(palette);
    navigator.clipboard.writeText(url);
    toast.success('Palette link copied to clipboard!');
  }, [palette, hasPalette]);

  const handleExportCsv = useCallback(() => {
    if (!hasPalette) { toast.info('Add filaments to export'); return; }
    downloadCsv(palette);
    toast.success('CSV exported');
  }, [palette, hasPalette]);

  // ── Load preset ──────────────────────────────────────────────

  const loadPreset = useCallback(async (presetKey: string) => {
    const preset = PRESETS.find((p) => p.key === presetKey);
    if (!preset) return;

    setPresetLoading(true);
    try {
      const entries: PaletteEntry[] = [];
      for (const slot of preset.slots) {
        // Find best matching filament for this slot
        const { data } = await supabase
          .from('filaments')
          .select('id, product_title, vendor, material, color_family, color_hex, transmission_distance, variant_price, product_handle')
          .not('transmission_distance', 'is', null)
          .gte('transmission_distance', slot.tdMin)
          .lte('transmission_distance', slot.tdMax)
          .ilike('color_family', `%${slot.colorFamily}%`)
          .order('transmission_distance', { ascending: true })
          .limit(1);

        if (data && data.length > 0) {
          const f = data[0];
          entries.push({
            filamentId: f.id,
            filamentName: f.product_title ?? '',
            brand: f.vendor ?? '',
            material: f.material ?? '',
            color: f.color_hex ?? '',
            tdValue: f.transmission_distance ?? 0,
            colorFamily: f.color_family ?? '',
            layers: slot.layers,
            slug: f.product_handle ?? undefined,
            price: f.variant_price,
          });
        } else {
          // Fallback: ignore color family, just match TD range
          const { data: fallback } = await supabase
            .from('filaments')
            .select('id, product_title, vendor, material, color_family, color_hex, transmission_distance, variant_price, product_handle')
            .not('transmission_distance', 'is', null)
            .gte('transmission_distance', slot.tdMin)
            .lte('transmission_distance', slot.tdMax)
            .order('transmission_distance', { ascending: true })
            .limit(1);

          if (fallback && fallback.length > 0) {
            const f = fallback[0];
            entries.push({
              filamentId: f.id,
              filamentName: f.product_title ?? '',
              brand: f.vendor ?? '',
              material: f.material ?? '',
              color: f.color_hex ?? '',
              tdValue: f.transmission_distance ?? 0,
              colorFamily: f.color_family ?? '',
              layers: slot.layers,
              slug: f.product_handle ?? undefined,
              price: f.variant_price,
            });
          }
        }
      }

      if (entries.length) {
        loadPalette(entries);
        toast.success(`Loaded ${preset.name} with ${entries.length} filaments`);
      } else {
        toast.error('Could not find matching filaments for this preset');
      }
    } catch {
      toast.error('Failed to load preset');
    } finally {
      setPresetLoading(false);
    }
  }, [loadPalette]);

  const [pendingPreset, setPendingPreset] = useState<string | null>(null);

  const handlePresetSelect = useCallback((value: string) => {
    if (hasPalette) {
      setPendingPreset(value);
    } else {
      loadPreset(value);
    }
  }, [hasPalette, loadPreset]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-background to-muted/20">
      <DocumentHead
        title="HueForge Palette Builder — Build & Analyze Multi-Filament Palettes | FilaScope"
        description="Build and analyze multi-filament palettes for HueForge lithophane projects. Check TD coverage, find gaps, get filament suggestions, and create your shopping list."
      />
      <BreadcrumbSchema
        items={[
          { name: "Home", url: "https://filascope.com" },
          { name: "HueForge TD Database", url: "https://filascope.com/hueforge-td-database" },
          { name: "Palette Builder", url: "https://filascope.com/hueforge-palette-builder" },
        ]}
      />
      <Breadcrumbs
        items={[
          { name: "HueForge TD Database", url: "/hueforge-td-database" },
          { name: "Palette Builder", url: "/hueforge-palette-builder" },
        ]}
        className="max-w-7xl mx-auto px-4 pt-6 pb-1"
      />
      <HueForgeToolsNav />

      {/* Preset confirm dialog */}
      <AlertDialog open={!!pendingPreset} onOpenChange={(open) => { if (!open) setPendingPreset(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Load preset?</AlertDialogTitle>
            <AlertDialogDescription>
              Loading a preset will replace your current palette. Continue?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => { if (pendingPreset) { loadPreset(pendingPreset); setPendingPreset(null); } }}>
              Continue
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <div className="max-w-7xl mx-auto px-4 py-12">
        {/* Hero */}
        <section className="text-center mb-12">
          <Badge variant="outline" className="mb-4 text-sm">
            <Palette className="w-3 h-3 mr-1 text-primary" />
            Palette Builder
          </Badge>
          <h1 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-purple-400 to-primary bg-clip-text text-transparent">
            HueForge Palette Builder
          </h1>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Build and analyze multi-filament palettes for your HueForge projects.
            Check TD coverage, find gaps, and share your palette — all in one place.
          </p>
        </section>

        {/* Toolbar */}
        <div className="flex items-center justify-between gap-2 mb-8 flex-wrap">
          <Select onValueChange={handlePresetSelect} disabled={presetLoading}>
            <SelectTrigger className="w-[200px] h-9 text-sm">
              {presetLoading ? (
                <span className="flex items-center gap-1.5"><Loader2 className="w-3.5 h-3.5 animate-spin" /> Loading…</span>
              ) : (
                <SelectValue placeholder="Load Preset" />
              )}
            </SelectTrigger>
            <SelectContent>
              {PRESETS.map((p) => (
                <SelectItem key={p.key} value={p.key}>{p.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <div className="flex items-center gap-1 shrink-0 flex-wrap">
            <Button variant="ghost" size="sm" className="text-xs gap-1" onClick={handleCopyConfig}>
              <Clipboard className="w-3.5 h-3.5" /> <span className="hidden sm:inline">Copy Config</span>
            </Button>
            <Button variant="ghost" size="sm" className="text-xs gap-1" onClick={handleCopyLink}>
              <Link2 className="w-3.5 h-3.5" /> <span className="hidden sm:inline">Copy Link</span>
            </Button>
            <Button variant="ghost" size="sm" className="text-xs gap-1" onClick={handleExportCsv}>
              <Download className="w-3.5 h-3.5" /> <span className="hidden sm:inline">Export CSV</span>
            </Button>

            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-xs gap-1 text-destructive hover:text-destructive"
                  disabled={!hasPalette}
                >
                  <RotateCcw className="w-3.5 h-3.5" /> <span className="hidden sm:inline">Reset</span>
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Reset palette?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This will remove all filaments from your palette. This action cannot be undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={() => { clearPalette(); toast.success('Palette cleared'); }}>
                    Reset
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>

        {/* Main two-column grid */}
        <div className="grid md:grid-cols-5 gap-8">
          {/* Left column */}
          <div className="md:col-span-2 space-y-6">
            {/* Add Filaments */}
            <Card className="border-border/60">
              <CardContent className="p-4">
                <h2 className="uppercase tracking-wide text-xs text-muted-foreground font-semibold mb-3">Add Filaments</h2>
                <PaletteFilamentSearch onAdd={addFilament} isFull={isFull} />
              </CardContent>
            </Card>

            {/* Your Palette */}
            <Card className="border-border/60">
              <CardContent className="p-4">
                <h2 className="uppercase tracking-wide text-xs text-muted-foreground font-semibold mb-3">
                  Your Palette {hasPalette && <span className="text-primary ml-1">({palette.length})</span>}
                </h2>
                {hasPalette ? (
                  <PaletteList
                    palette={palette}
                    onRemove={removeFilament}
                    onUpdateLayers={updateLayers}
                    onReorder={reorderFilament}
                  />
                ) : (
                  <div className="flex flex-col items-center text-center py-6">
                    <div className="w-12 h-12 rounded-xl bg-muted flex items-center justify-center mb-4">
                      <Palette className="w-6 h-6 text-muted-foreground" />
                    </div>
                    <h3 className="text-base font-semibold mb-1">Start Building Your Palette</h3>
                    <p className="text-sm text-muted-foreground mb-5 max-w-xs">
                      Search for filaments above or load a preset to get started.
                    </p>
                    <div className="flex items-center gap-3 flex-wrap justify-center">
                      <Button variant="outline" size="sm" onClick={() => handlePresetSelect('portrait')}>
                        Load a Preset
                      </Button>
                      <Button asChild size="sm">
                        <Link to="/hueforge-td-database">
                          Browse TD Database <ArrowRight className="w-3.5 h-3.5 ml-1.5" />
                        </Link>
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Summary bar */}
            {hasPalette ? (
              <div className="rounded-lg border border-border/60 bg-muted/30 px-4 py-3 text-xs text-muted-foreground flex items-center gap-2">
                <span>{palette.length} filament{palette.length !== 1 ? 's' : ''}</span>
                <span className="text-border">|</span>
                <span>{totalLayers} layer{totalLayers !== 1 ? 's' : ''}</span>
                <span className="text-border">|</span>
                <span>TD: {tdMin?.toFixed(2)} – {tdMax?.toFixed(2)}</span>
              </div>
            ) : (
              <div className="rounded-lg border border-border/60 bg-muted/30 px-4 py-3 text-xs text-muted-foreground flex items-center gap-2">
                <span>0 filaments</span>
                <span className="text-border">|</span>
                <span>0 layers</span>
                <span className="text-border">|</span>
                <span>TD range: —</span>
              </div>
            )}
          </div>

          {/* Right column */}
          <div className="md:col-span-3 space-y-6">
            {/* Palette Analysis */}
            <Card className="border-border/60">
              <CardContent className="p-6">
                <h2 className="uppercase tracking-wide text-xs text-muted-foreground font-semibold mb-4">Palette Analysis</h2>
                <PaletteAnalysis palette={palette} onAdd={addFilament} isFull={isFull} />
              </CardContent>
            </Card>

            {/* Layer Preview */}
            <Card className="border-border/60">
              <CardContent className="p-6">
                <h2 className="uppercase tracking-wide text-xs text-muted-foreground font-semibold mb-4 flex items-center gap-1.5">
                  <Eye className="w-3.5 h-3.5" />
                  Layer Preview
                </h2>
                <PaletteLayerPreview palette={palette} />
              </CardContent>
            </Card>

            {/* Shopping List */}
            <Card className="border-border/60">
              <CardContent className="p-6">
                <h2 className="uppercase tracking-wide text-xs text-muted-foreground font-semibold mb-4 flex items-center gap-1.5">
                  <ShoppingCart className="w-3.5 h-3.5" />
                  Shopping List
                </h2>
                <PaletteShoppingList palette={palette} />
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Cross-links & footer */}
      <div className="max-w-5xl mx-auto px-4">
        <HueForgeToolsCrossLinks />
      </div>
      <SiteFooter />
    </div>
  );
}
