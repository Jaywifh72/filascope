import { useMemo, useCallback } from 'react';
import { trackEvent } from '@/lib/analytics';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import {
  AlertTriangle, CheckCircle2, Info, Lightbulb, Plus,
  Layers as LayersIcon, Hash, ArrowLeftRight, BarChart3, Building, Gauge,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { SwatchCircle } from '@/components/hueforge/SwatchCircle';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import type { PaletteEntry } from '@/hooks/usePaletteBuilder';

// ── Helpers ──────────────────────────────────────────────────────

function getTdBadgeClasses(td: number): string {
  if (td <= 1) return 'bg-gray-800 text-gray-300';
  if (td <= 3) return 'bg-amber-900/50 text-amber-400';
  if (td <= 5) return 'bg-cyan-900/50 text-cyan-400';
  return 'bg-purple-900/50 text-purple-400';
}

function getCategoryName(td: number): string {
  if (td <= 1) return 'opaque';
  if (td <= 3) return 'mid-tone';
  if (td <= 5) return 'translucent';
  return 'very translucent';
}

interface Gap {
  from: number;
  to: number;
  category: string;
}

interface Props {
  palette: PaletteEntry[];
  onAdd: (entry: Omit<PaletteEntry, 'layers'>) => void;
  isFull: boolean;
}

// ── Component ────────────────────────────────────────────────────

export function PaletteAnalysis({ palette, onAdd, isFull }: Props) {
  const sorted = useMemo(
    () => [...palette].sort((a, b) => a.tdValue - b.tdValue),
    [palette]
  );

  const hasOpaque = useMemo(() => palette.some((p) => p.tdValue <= 1), [palette]);
  const hasMidTone = useMemo(() => palette.some((p) => p.tdValue > 1 && p.tdValue <= 3), [palette]);
  const hasTranslucent = useMemo(() => palette.some((p) => p.tdValue > 3), [palette]);

  const gaps = useMemo<Gap[]>(() => {
    if (sorted.length < 2) return [];
    const result: Gap[] = [];
    for (let i = 0; i < sorted.length - 1; i++) {
      const gap = sorted[i + 1].tdValue - sorted[i].tdValue;
      if (gap > 1.5) {
        const mid = (sorted[i].tdValue + sorted[i + 1].tdValue) / 2;
        result.push({
          from: sorted[i].tdValue,
          to: sorted[i + 1].tdValue,
          category: getCategoryName(mid),
        });
      }
    }
    return result;
  }, [sorted]);

  const stats = useMemo(() => {
    if (palette.length === 0) return null;
    const tds = palette.map((p) => p.tdValue);
    const brands = new Set(palette.map((p) => p.brand));
    const totalLayers = palette.reduce((s, p) => s + p.layers, 0);
    const avg = tds.reduce((s, v) => s + v, 0) / tds.length;
    let difficulty = 'Beginner';
    if (palette.length >= 10) difficulty = 'Expert';
    else if (palette.length >= 7) difficulty = 'Advanced';
    else if (palette.length >= 4) difficulty = 'Intermediate';
    return {
      count: palette.length,
      totalLayers,
      tdMin: Math.min(...tds),
      tdMax: Math.max(...tds),
      avg,
      brands: brands.size,
      difficulty,
    };
  }, [palette]);

  const allCovered = hasOpaque && hasMidTone && hasTranslucent && gaps.length === 0;

  // Fetch suggested filaments for gaps
  const paletteIds = useMemo(() => palette.map((p) => p.filamentId), [palette]);
  const gapRanges = useMemo(
    () => gaps.map((g) => ({ min: g.from, max: g.to })),
    [gaps]
  );

  const { data: suggestions } = useQuery({
    queryKey: ['palette-gap-suggestions', gapRanges, paletteIds],
    queryFn: async () => {
      if (gapRanges.length === 0) return [];
      const results: Array<{
        id: string;
        product_title: string;
        vendor: string;
        material: string;
        color_family: string;
        color_hex: string;
        transmission_distance: number;
        variant_price: number | null;
        product_handle: string | null;
        gapIndex: number;
      }> = [];
      const queries = gapRanges.map(async ({ min, max }, i) => {
        let query = supabase
          .from('filaments')
          .select('id, product_title, vendor, material, color_family, color_hex, transmission_distance, variant_price, product_handle')
          .not('transmission_distance', 'is', null)
          .gt('transmission_distance', min)
          .lt('transmission_distance', max)
          .order('transmission_distance', { ascending: true })
          .limit(4);
        if (paletteIds.length > 0) {
          query = query.not('id', 'in', `(${paletteIds.join(',')})`);
        }
        const { data } = await query;
        if (data) {
          results.push(...data.map((d) => ({ ...d, gapIndex: i } as any)));
        }
      });
      await Promise.all(queries);
      // Deduplicate and limit to 2 per gap
      const seen = new Set<string>();
      return results.filter((r) => {
        if (seen.has(r.id)) return false;
        seen.add(r.id);
        return true;
      }).slice(0, gapRanges.length * 2);
    },
    enabled: gapRanges.length > 0,
    staleTime: 5 * 60 * 1000,
  });

  const handleAddSuggestion = useCallback((s: NonNullable<typeof suggestions>[0]) => {
    onAdd({
      filamentId: s.id,
      filamentName: s.product_title ?? '',
      brand: s.vendor ?? '',
      material: s.material ?? '',
      color: s.color_hex ?? '',
      tdValue: s.transmission_distance ?? 0,
      colorFamily: s.color_family ?? '',
      slug: s.product_handle ?? undefined,
      price: s.variant_price,
    });
    trackEvent('palette_builder_filament_added', {
      filament_name: s.product_title ?? '',
      brand: s.vendor ?? '',
      td_value: s.transmission_distance ?? 0,
      source: 'suggestion',
    });
  }, [onAdd]);

  const isEmpty = palette.length === 0;

  return (
    <div className="space-y-5">
      {/* ── Spectrum bar ───────────────────────── */}
      <div>
        <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">TD Coverage Spectrum</h3>
        <div className="relative min-w-[280px] overflow-x-auto">
          {/* Gradient bar */}
          <div
            role="img"
            aria-label="TD coverage spectrum showing filament positions from opaque at 0 to translucent at 10"
            className={cn(
              'w-full h-8 rounded-lg overflow-hidden relative',
              isEmpty && 'opacity-30'
            )}
            style={{
              background: 'linear-gradient(to right, #1a1a1a 0%, #3d2b1f 10%, #7a5c3a 20%, #b8860b 30%, #d4a44a 40%, #e0c878 50%, #a8d8d0 60%, #7ec8e3 70%, #a9c4f5 80%, #d4c6f0 90%, #f0e8ff 100%)',
            }}
          >
            {/* Filament markers */}
            {sorted.map((entry) => {
              const pct = Math.min((entry.tdValue / 10) * 100, 100);
              return (
                <TooltipProvider key={entry.filamentId}>
                  <Tooltip delayDuration={100}>
                    <TooltipTrigger asChild>
                      <div
                        className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-4 h-4 rounded-full ring-2 ring-white border border-border shadow-md cursor-default z-10 transition-transform hover:scale-125"
                        style={{
                          left: `${pct}%`,
                          backgroundColor: entry.color || '#808080',
                        }}
                        aria-label={`${entry.brand} ${entry.filamentName}, TD ${entry.tdValue.toFixed(2)}`}
                      />
                    </TooltipTrigger>
                    <TooltipContent side="top" className="text-xs">
                      <p className="font-semibold">{entry.filamentName}</p>
                      <p className="text-muted-foreground">TD {entry.tdValue.toFixed(2)}</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              );
            })}
            {isEmpty && (
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-xs text-muted-foreground bg-background/60 px-2 py-0.5 rounded">
                  Add filaments to see TD coverage
                </span>
              </div>
            )}
          </div>

          {/* Tick marks */}
          <div className="relative w-full h-4 mt-1">
            {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((v) => (
              <div
                key={v}
                className="absolute top-0 -translate-x-1/2 flex flex-col items-center"
                style={{ left: `${(v / 10) * 100}%` }}
              >
                <div className="w-px h-1.5 bg-muted-foreground/40" />
                {v % 2 === 0 && (
                  <span className="text-[9px] text-muted-foreground mt-0.5">{v}</span>
                )}
              </div>
            ))}
          </div>

          {/* Range labels */}
          <div className="flex mt-0.5 text-[9px] text-muted-foreground">
            <span className="w-[10%] text-center">Opaque</span>
            <span className="w-[20%] text-center">Mid-tone</span>
            <span className="w-[20%] text-center">Translucent</span>
            <span className="flex-1 text-center">Very Translucent</span>
          </div>
        </div>
      </div>

      {/* ── Role checks & gap analysis ─────────── */}
      {palette.length === 1 ? (
        <div className="space-y-3">
          <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground flex items-center gap-1">
            Coverage Analysis
            <Info className="w-3 h-3 text-muted-foreground/60" />
          </h3>
          {(() => {
            const td = palette[0].tdValue;
            if (td <= 1) return (
              <div className="flex items-start gap-2 p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-sm">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <p className="text-emerald-300">
                  <span className="font-medium">Good start!</span> You have an opaque base. Add a mid-tone filament (TD 1–3) next for smoother gradients.
                </p>
              </div>
            );
            if (td <= 3) return (
              <div className="flex items-start gap-2 p-3 rounded-lg bg-amber-500/10 border border-amber-500/20 text-sm">
                <Lightbulb className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                <p className="text-amber-300">
                  You have a mid-tone filament. Add an <span className="font-medium">opaque base (TD 0–1)</span> and a <span className="font-medium">highlight (TD 3+)</span> to complete your palette.
                </p>
              </div>
            );
            return (
              <div className="flex items-start gap-2 p-3 rounded-lg bg-cyan-500/10 border border-cyan-500/20 text-sm">
                <Lightbulb className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
                <p className="text-cyan-300">
                  You have a highlight filament. Add an <span className="font-medium">opaque base (TD 0–1)</span> first — it's essential for HueForge projects.
                </p>
              </div>
            );
          })()}
        </div>
      ) : palette.length < 2 ? (
        <div className="text-center py-6 text-sm text-muted-foreground">
          Add at least 2 filaments for coverage analysis
        </div>
      ) : (
        <div className="space-y-3">
          <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground flex items-center gap-1">
            Coverage Analysis
            <Info className="w-3 h-3 text-muted-foreground/60" />
          </h3>

          {/* Role warnings */}
          {!hasOpaque && (
            <div className="flex items-start gap-2 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-sm">
              <AlertTriangle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
              <p className="text-red-300">
                <span className="font-medium">Missing opaque base</span> — Most HueForge projects need a dark, opaque base layer filament (TD 0–1).
              </p>
            </div>
          )}

          {!hasMidTone && palette.length >= 2 && (
            <div className="flex items-start gap-2 p-3 rounded-lg bg-amber-500/10 border border-amber-500/20 text-sm">
              <Lightbulb className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
              <p className="text-amber-300">
                Consider adding a mid-tone filament (TD 1–3) for smoother gradients.
              </p>
            </div>
          )}

          {!hasTranslucent && (
            <div className="flex items-start gap-2 p-3 rounded-lg bg-cyan-500/10 border border-cyan-500/20 text-sm">
              <Lightbulb className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
              <p className="text-cyan-300">
                Adding a high-TD filament (3+) will improve highlight and detail in your print.
              </p>
            </div>
          )}

          {/* Gap warnings */}
          {gaps.map((gap, i) => (
            <div
              key={i}
              className="flex items-start gap-2 p-3 rounded-lg bg-amber-500/10 border border-amber-500/20 text-sm"
            >
              <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
              <p className="text-amber-300">
                <span className="font-medium">Gap detected:</span> TD {gap.from.toFixed(1)} – {gap.to.toFixed(1)} range is not covered. Consider adding a {gap.category} filament.
              </p>
            </div>
          ))}

          {/* All good */}
          {allCovered && (
            <div className="flex items-start gap-2 p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-sm">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <p className="text-emerald-300">
                <span className="font-medium">Good TD coverage</span> — Your palette covers the key TD ranges for HueForge printing.
              </p>
            </div>
          )}
        </div>
      )}

      {/* ── Stats grid ─────────────────────────── */}
      {stats && (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {[
            { label: 'Filaments', value: stats.count, icon: LayersIcon },
            { label: 'Total Layers', value: stats.totalLayers, icon: Hash },
            { label: 'TD Range', value: `${stats.tdMin.toFixed(1)}–${stats.tdMax.toFixed(1)}`, icon: ArrowLeftRight },
            { label: 'Avg TD', value: stats.avg.toFixed(2), icon: BarChart3 },
            { label: 'Brands', value: stats.brands, icon: Building },
            { label: 'Difficulty', value: stats.difficulty, icon: Gauge },
          ].map((s) => (
            <div
              key={s.label}
              className="rounded-lg border border-border/60 bg-card/60 px-3 py-2.5 text-center"
            >
              <s.icon className="w-3.5 h-3.5 text-muted-foreground mx-auto mb-1" />
              <p className="text-sm font-bold">{s.value}</p>
              <p className="text-[10px] text-muted-foreground uppercase tracking-wide">{s.label}</p>
            </div>
          ))}
        </div>
      )}

      {/* ── Suggested filaments ─────────────────── */}
      {suggestions && suggestions.length > 0 && (
        <div>
          <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">Fill the Gaps</h3>
          <div className="space-y-1.5">
            {suggestions.map((s) => (
              <div
                key={s.id}
                className="flex items-center gap-2 px-3 py-2 rounded-lg border border-border/60 bg-card/60"
              >
                <SwatchCircle hexColor={s.color_hex} colorFamily={s.color_family} size="w-4 h-4" />
                <span className="text-xs text-muted-foreground shrink-0 truncate max-w-[70px]">{s.vendor}</span>
                <span className="text-sm truncate flex-1">{s.product_title}</span>
                <span className={cn('font-mono text-xs rounded px-1.5 py-0.5 shrink-0', getTdBadgeClasses(s.transmission_distance ?? 0))}>
                  {s.transmission_distance?.toFixed(2)}
                </span>
                <Button
                  size="sm"
                  variant="ghost"
                  className="text-xs text-primary gap-1 shrink-0 h-7 px-2"
                  disabled={isFull}
                  onClick={() => handleAddSuggestion(s)}
                >
                  <Plus className="w-3 h-3" /> Add
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
