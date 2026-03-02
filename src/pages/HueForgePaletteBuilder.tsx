import { useState, useEffect, useCallback, useMemo } from 'react';
import { Link, useSearchParams, useNavigate } from "react-router-dom";
import { Palette, ArrowRight, Clipboard, Link2, Download, RotateCcw, BarChart3, Layers, ShoppingCart, Eye, Loader2, MoreHorizontal } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { DocumentHead } from "@/components/seo/DocumentHead";
import { Breadcrumbs, BreadcrumbSchema } from "@/components/seo";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { SiteFooter } from "@/components/SiteFooter";
import { HueForgeToolsNav } from "@/components/hueforge/HueForgeToolsNav";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { trackEvent } from "@/lib/analytics";
import { useIsMobile } from "@/hooks/use-mobile";
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
  const isMobile = useIsMobile();
  const [presetLoading, setPresetLoading] = useState(false);
  const [urlRestored, setUrlRestored] = useState(false);
  const [activePreset, setActivePreset] = useState<string | undefined>(undefined);
  const [skeletonCount, setSkeletonCount] = useState(0);

  const hasPalette = palette.length > 0;

  // ── URL restore (?p=) and ?add= handler ──────────────────────
  useEffect(() => {
    if (urlRestored) return;
    const pParam = searchParams.get('p');
    const addParam = searchParams.get('add');

    const UUID_ADD_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    const processAdd = async () => {
      if (!addParam || !UUID_ADD_RE.test(addParam)) return;
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

    const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    const segments = pParam.split('|').map((s) => {
      const [id, layersStr] = s.split(',');
      return { id, layers: parseInt(layersStr) || 1 };
    }).filter((s) => s.id && UUID_RE.test(s.id));

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
    trackEvent('palette_builder_config_copied', { filament_count: palette.length });
  }, [palette, tdMin, tdMax, tdAvg, hasPalette]);

  const handleCopyLink = useCallback(() => {
    if (!hasPalette) { toast.info('Add filaments to share your palette'); return; }
    const url = buildShareUrl(palette);
    navigator.clipboard.writeText(url);
    toast.success('Palette link copied to clipboard!');
    trackEvent('palette_builder_shared', { filament_count: palette.length, total_layers: totalLayers });
  }, [palette, hasPalette, totalLayers]);

  const handleExportCsv = useCallback(() => {
    if (!hasPalette) { toast.info('Add filaments to export'); return; }
    downloadCsv(palette);
    toast.success('CSV exported');
    trackEvent('palette_builder_exported', { filament_count: palette.length, format: 'csv' });
  }, [palette, hasPalette]);

  // ── Load preset ──────────────────────────────────────────────

  const loadPreset = useCallback(async (presetKey: string) => {
    const preset = PRESETS.find((p) => p.key === presetKey);
    if (!preset) return;

    setPresetLoading(true);
    setSkeletonCount(preset.slots.length);
    setActivePreset(presetKey);
    try {
      const entries: PaletteEntry[] = [];
      const usedIds = new Set<string>();

      for (const slot of preset.slots) {
        let query = supabase
          .from('filaments')
          .select('id, product_title, vendor, material, color_family, color_hex, transmission_distance, variant_price, product_handle')
          .not('transmission_distance', 'is', null)
          .gte('transmission_distance', slot.tdMin)
          .lte('transmission_distance', slot.tdMax)
          .ilike('color_family', `%${slot.colorFamily}%`)
          .order('transmission_distance', { ascending: true })
          .limit(5);

        if (usedIds.size > 0) {
          query = query.not('id', 'in', `(${[...usedIds].join(',')})`);
        }

        const { data } = await query;

        if (data && data.length > 0) {
          const f = data[0];
          usedIds.add(f.id);
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
          let fallbackQuery = supabase
            .from('filaments')
            .select('id, product_title, vendor, material, color_family, color_hex, transmission_distance, variant_price, product_handle')
            .not('transmission_distance', 'is', null)
            .gte('transmission_distance', slot.tdMin)
            .lte('transmission_distance', slot.tdMax)
            .order('transmission_distance', { ascending: true })
            .limit(5);

          if (usedIds.size > 0) {
            fallbackQuery = fallbackQuery.not('id', 'in', `(${[...usedIds].join(',')})`);
          }

          const { data: fallback } = await fallbackQuery;

          if (fallback && fallback.length > 0) {
            const f = fallback[0];
            usedIds.add(f.id);
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
        trackEvent('palette_builder_preset_loaded', { preset_name: preset.name, filament_count: entries.length });
      } else {
        toast.error('Could not load preset — no matching filaments found in the database. Try again or build your palette manually.');
        setActivePreset(undefined);
      }
      if (entries.length > 0 && entries.length < preset.slots.length) {
        toast.warning('Could not load preset — some filaments weren\'t found in the database. Try again or build your palette manually.');
      }
    } catch {
      toast.error('Could not load preset — some filaments weren\'t found in the database. Try again or build your palette manually.');
      setActivePreset(undefined);
    } finally {
      setPresetLoading(false);
      setSkeletonCount(0);
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

  // Reset activePreset when user manually modifies palette
  const handleRemoveFilament = useCallback((id: string) => {
    setActivePreset(undefined);
    removeFilament(id);
  }, [removeFilament]);

  const handleUpdateLayers = useCallback((id: string, count: number) => {
    setActivePreset(undefined);
    updateLayers(id, count);
  }, [updateLayers]);

  const handleReorderFilament = useCallback((id: string, direction: 'up' | 'down') => {
    reorderFilament(id, direction);
  }, [reorderFilament]);

  const handleAddFilament = useCallback((entry: Omit<PaletteEntry, 'layers'>) => {
    setActivePreset(undefined);
    addFilament(entry);
  }, [addFilament]);

  // Memoize summary text
  const summaryText = useMemo(() => {
    if (!hasPalette) return { filaments: '0 filaments', layers: '0 layers', td: 'TD range: —' };
    return {
      filaments: `${palette.length} filament${palette.length !== 1 ? 's' : ''}`,
      layers: `${totalLayers} layer${totalLayers !== 1 ? 's' : ''}`,
      td: `TD: ${tdMin?.toFixed(2)} – ${tdMax?.toFixed(2)}`,
    };
  }, [palette.length, totalLayers, tdMin, tdMax, hasPalette]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-background to-muted/20">
      <DocumentHead
        title="HueForge Palette Builder — Build & Analyze Multi-Filament Palettes | FilaScope"
        description="Build and analyze multi-filament palettes for HueForge lithophane projects. Check TD coverage, find gaps, get filament suggestions, and create your shopping list on FilaScope."
        canonical="https://filascope.com/hueforge-palette-builder"
        ogType="website"
        ogImage="https://filascope.com/og-image.png"
        ogSiteName="FilaScope"
        twitterCard="summary_large_image"
        twitterSite="@FilaScope"
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

      <div className="max-w-7xl mx-auto px-4 py-8 md:py-12">
        {/* Hero */}
        <section className="text-center mb-8 md:mb-12">
          <Badge variant="outline" className="mb-4 text-sm">
            <Palette className="w-3 h-3 mr-1 text-primary" />
            Palette Builder
          </Badge>
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-purple-400 to-primary bg-clip-text text-transparent">
            HueForge Palette Builder
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground max-w-3xl mx-auto">
            Build and analyze multi-filament palettes for your HueForge projects.
            Check TD coverage, find gaps, and share your palette — all in one place.
          </p>
        </section>

        {/* Toolbar */}
        <TooltipProvider delayDuration={300}>
        <div className="flex items-center gap-2 mb-6 md:mb-8 rounded-lg border border-border/60 bg-card/60 px-3 py-2 flex-wrap">
          {/* Preset loader */}
          <Select value={activePreset ?? ''} onValueChange={handlePresetSelect} disabled={presetLoading}>
            <SelectTrigger className="w-[180px] sm:w-[200px] h-8 text-sm border-border/60" aria-label="Load a preset palette">
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

          {/* Divider */}
          <div className="w-px h-5 bg-border/60 hidden sm:block" />

          {/* Export actions */}
          <div className="flex items-center gap-0.5 ml-auto">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="sm" className="text-xs gap-1" onClick={handleCopyLink} disabled={!hasPalette} aria-label="Copy shareable palette link">
                  <Link2 className="w-3.5 h-3.5" /> <span className="hidden sm:inline">Copy Link</span>
                </Button>
              </TooltipTrigger>
              {!hasPalette && <TooltipContent>Add filaments first</TooltipContent>}
            </Tooltip>

            {isMobile ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="text-xs gap-1" disabled={!hasPalette} aria-label="More actions">
                    <MoreHorizontal className="w-3.5 h-3.5" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={handleCopyConfig} disabled={!hasPalette}>
                    <Clipboard className="w-3.5 h-3.5 mr-2" /> Copy Config
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handleExportCsv} disabled={!hasPalette}>
                    <Download className="w-3.5 h-3.5 mr-2" /> Export CSV
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="ghost" size="sm" className="text-xs gap-1" onClick={handleCopyConfig} disabled={!hasPalette} aria-label="Copy palette configuration text">
                      <Clipboard className="w-3.5 h-3.5" /> Copy Config
                    </Button>
                  </TooltipTrigger>
                  {!hasPalette && <TooltipContent>Add filaments first</TooltipContent>}
                </Tooltip>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="ghost" size="sm" className="text-xs gap-1" onClick={handleExportCsv} disabled={!hasPalette} aria-label="Export palette as CSV file">
                      <Download className="w-3.5 h-3.5" /> Export CSV
                    </Button>
                  </TooltipTrigger>
                  {!hasPalette && <TooltipContent>Add filaments first</TooltipContent>}
                </Tooltip>
              </>
            )}

            {/* Divider before destructive action */}
            <div className="w-px h-5 bg-border/60 mx-0.5" />

            <AlertDialog>
              <Tooltip>
                <TooltipTrigger asChild>
                  <AlertDialogTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-xs gap-1 text-destructive hover:text-destructive"
                      disabled={!hasPalette}
                      aria-label="Reset palette"
                    >
                      <RotateCcw className="w-3.5 h-3.5" /> <span className="hidden sm:inline">Reset</span>
                    </Button>
                  </AlertDialogTrigger>
                </TooltipTrigger>
                {!hasPalette && <TooltipContent>Nothing to reset</TooltipContent>}
              </Tooltip>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Reset palette?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This will remove all filaments from your palette. This action cannot be undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={() => { clearPalette(); setActivePreset(undefined); toast.success('Palette cleared'); }}>
                    Reset
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>
        </TooltipProvider>

        {/* Main grid — responsive: 1-col mobile, 2-col tablet, 5-col desktop */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 lg:gap-8">
          {/* Left column */}
          <div className="md:col-span-1 lg:col-span-2 space-y-6">
            {/* Add Filaments */}
            <Card className="border-border/60">
              <CardContent className="p-4">
                <h2 className="uppercase tracking-wide text-xs text-muted-foreground font-semibold mb-3">Add Filaments</h2>
                <PaletteFilamentSearch onAdd={handleAddFilament} isFull={isFull} existingIds={palette.map(p => p.filamentId)} />
              </CardContent>
            </Card>

            {/* Your Palette */}
            <Card className="border-border/60">
              <CardContent className="p-4">
                <h2 className="uppercase tracking-wide text-xs text-muted-foreground font-semibold mb-3">
                  Your Palette {hasPalette && <span className="text-primary ml-1">({palette.length})</span>}
                </h2>
                {/* Live region for screen readers */}
                <div aria-live="polite" aria-atomic="false">
                  {presetLoading && skeletonCount > 0 ? (
                    <div className="space-y-1.5">
                      {Array.from({ length: skeletonCount }).map((_, i) => (
                        <div key={i} className="flex items-center gap-2 px-3 py-2 rounded-lg border border-border/60 bg-card/60 animate-pulse">
                          <div className="w-5 h-5 rounded-full bg-muted shrink-0" />
                          <div className="flex-1 space-y-1.5">
                            <div className="h-3 bg-muted rounded w-3/4" />
                            <div className="h-2.5 bg-muted rounded w-1/2" />
                          </div>
                          <div className="h-4 w-10 bg-muted rounded" />
                        </div>
                      ))}
                    </div>
                  ) : hasPalette ? (
                    <PaletteList
                      palette={palette}
                      onRemove={handleRemoveFilament}
                      onUpdateLayers={handleUpdateLayers}
                      onReorder={handleReorderFilament}
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
                </div>
              </CardContent>
            </Card>

            {/* Summary bar — only when palette has filaments */}
            {hasPalette && (
              <div className="rounded-lg border border-border/60 bg-muted/30 px-4 py-3 text-xs text-muted-foreground flex items-center gap-2 flex-wrap" role="status" aria-label="Palette summary">
                <span>{summaryText.filaments}</span>
                <span className="text-border">|</span>
                <span>{summaryText.layers}</span>
                <span className="text-border">|</span>
                <span>{summaryText.td}</span>
              </div>
            )}
          </div>

          {/* Right column */}
          <div className="md:col-span-1 lg:col-span-3 space-y-6">
            {hasPalette ? (
              <>
                {/* Palette Analysis */}
                <Card className="border-border/60">
                  <CardContent className="p-4 md:p-6">
                    <h2 className="uppercase tracking-wide text-xs text-muted-foreground font-semibold mb-4">Palette Analysis</h2>
                    <PaletteAnalysis palette={palette} onAdd={handleAddFilament} isFull={isFull} />
                  </CardContent>
                </Card>

                {/* Layer Preview */}
                <Card className="border-border/60">
                  <CardContent className="p-4 md:p-6">
                    <h2 className="uppercase tracking-wide text-xs text-muted-foreground font-semibold mb-4 flex items-center gap-1.5">
                      <Eye className="w-3.5 h-3.5" />
                      Layer Preview
                    </h2>
                    <PaletteLayerPreview palette={palette} />
                  </CardContent>
                </Card>

                {/* Shopping List */}
                <Card className="border-border/60">
                  <CardContent className="p-4 md:p-6">
                    <h2 className="uppercase tracking-wide text-xs text-muted-foreground font-semibold mb-4 flex items-center gap-1.5">
                      <ShoppingCart className="w-3.5 h-3.5" />
                      Shopping List
                    </h2>
                    <PaletteShoppingList palette={palette} />
                  </CardContent>
                </Card>
              </>
            ) : (
              /* Collapsed "What You'll See" preview when palette is empty */
              <Card className="border-border/60">
                <CardContent className="p-4 md:p-6">
                  <h2 className="uppercase tracking-wide text-xs text-muted-foreground font-semibold mb-4">
                    Palette Analysis & Tools
                  </h2>
                  <p className="text-sm text-muted-foreground mb-4">
                    Add filaments to unlock these analysis tools:
                  </p>
                  <ul className="space-y-3 text-sm">
                    <li className="flex items-start gap-2.5">
                      <BarChart3 className="w-4 h-4 text-purple-400 shrink-0 mt-0.5" />
                      <div>
                        <span className="font-medium text-foreground">TD Coverage Spectrum</span>
                        <span className="text-muted-foreground"> — See how your filaments span the opacity range</span>
                      </div>
                    </li>
                    <li className="flex items-start gap-2.5">
                      <Layers className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                      <div>
                        <span className="font-medium text-foreground">Gap Analysis</span>
                        <span className="text-muted-foreground"> — Get warnings about missing TD ranges</span>
                      </div>
                    </li>
                    <li className="flex items-start gap-2.5">
                      <Eye className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
                      <div>
                        <span className="font-medium text-foreground">Layer Preview</span>
                        <span className="text-muted-foreground"> — Visualize your color stack with backlit simulation</span>
                      </div>
                    </li>
                    <li className="flex items-start gap-2.5">
                      <ShoppingCart className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                      <div>
                        <span className="font-medium text-foreground">Shopping List</span>
                        <span className="text-muted-foreground"> — Get prices and buy links for your whole palette</span>
                      </div>
                    </li>
                  </ul>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>

      {/* Footer */}
      <SiteFooter />
    </div>
  );
}
