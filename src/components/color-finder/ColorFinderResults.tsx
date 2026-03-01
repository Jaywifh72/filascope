import { useMemo, useState } from 'react';
import { colorDistance, getColorMatchPercent } from '@/lib/colorMatchUtils';
import { normalizeColorHex } from '@/lib/utils';
import { ColorResultCard } from './ColorResultCard';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { ChevronDown, Sun } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import type { ColorFinderFilament } from '@/hooks/useColorFinderFilaments';
import { ColorFinderEmptyState } from '@/components/empty-states';

type SortMode = 'match' | 'price' | 'rated';

interface ColorFinderResultsProps {
  filaments: ColorFinderFilament[];
  searchHex: string;
  isLoading: boolean;
  materialFilter: string;
  brandFilter: string;
  onMaterialChange: (v: string) => void;
  onBrandChange: (v: string) => void;
}

export function ColorFinderResults({
  filaments,
  searchHex,
  isLoading,
  materialFilter,
  brandFilter,
  onMaterialChange,
  onBrandChange,
}: ColorFinderResultsProps) {
  const [sortMode, setSortMode] = useState<SortMode>('match');
  const [visibleCount, setVisibleCount] = useState(50);
  const [tdOnly, setTdOnly] = useState(false);

  // Extract unique materials and brands for filters
  const { materials, brands } = useMemo(() => {
    const mats = new Set<string>();
    const brnds = new Set<string>();
    filaments.forEach(f => {
      if (f.material) mats.add(f.material);
      if (f.vendor) brnds.add(f.vendor);
    });
    return {
      materials: Array.from(mats).sort(),
      brands: Array.from(brnds).sort(),
    };
  }, [filaments]);

  // Filter and sort
  const results = useMemo(() => {
    let filtered = filaments.filter(f => f.color_hex);

    if (materialFilter) {
      filtered = filtered.filter(f => f.material === materialFilter);
    }
    if (brandFilter) {
      filtered = filtered.filter(f => f.vendor === brandFilter);
    }
    if (tdOnly) {
      filtered = filtered.filter(f => f.transmission_distance != null);
    }

    // Add match score
    const scored = filtered.map(f => ({
      ...f,
      matchScore: getColorMatchPercent(searchHex, normalizeColorHex(f.color_hex)),
      distance: colorDistance(searchHex, normalizeColorHex(f.color_hex)),
    }));

    // Sort
    switch (sortMode) {
      case 'match':
        scored.sort((a, b) => a.distance - b.distance);
        break;
      case 'price':
        scored.sort((a, b) => (a.variant_price ?? 9999) - (b.variant_price ?? 9999));
        break;
      case 'rated':
        scored.sort((a, b) => a.distance - b.distance);
        break;
    }

    return scored;
  }, [filaments, searchHex, materialFilter, brandFilter, sortMode, tdOnly]);

  const visibleResults = results.slice(0, visibleCount);
  const hasMore = results.length > visibleCount;

  if (isLoading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-16 w-full rounded-lg" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Controls Row */}
      <div className="flex flex-wrap items-center gap-3">
        {/* Sort pills */}
        <div className="flex items-center gap-1 bg-card/60 rounded-lg p-0.5 border border-border/50">
          {([
            { id: 'match', label: 'Best Match' },
            { id: 'price', label: 'Lowest Price' },
          ] as const).map(opt => (
            <button
              key={opt.id}
              onClick={() => setSortMode(opt.id)}
              className={cn(
                "px-3 py-1 text-xs rounded-md transition-all",
                sortMode === opt.id
                  ? "bg-primary/20 text-primary font-medium"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              {opt.label}
            </button>
          ))}
        </div>

        {/* Material filter */}
        <select
          value={materialFilter}
          onChange={(e) => onMaterialChange(e.target.value)}
          className="h-8 px-2 text-xs rounded-md border border-border/50 bg-card/60 text-foreground"
        >
          <option value="">All Materials</option>
          {materials.map(m => (
            <option key={m} value={m}>{m}</option>
          ))}
        </select>

        {/* Brand filter */}
        <select
          value={brandFilter}
          onChange={(e) => onBrandChange(e.target.value)}
          className="h-8 px-2 text-xs rounded-md border border-border/50 bg-card/60 text-foreground"
        >
          <option value="">All Brands</option>
          {brands.map(b => (
            <option key={b} value={b}>{b}</option>
          ))}
        </select>

        <span className="text-xs text-muted-foreground ml-auto">
          {results.length.toLocaleString()} results
        </span>
      </div>

      {/* TD Filter Toggle */}
      <div className="flex items-center gap-2.5 p-2.5 rounded-lg bg-card/40 border border-border/40 w-fit">
        <Tooltip delayDuration={200}>
          <TooltipTrigger asChild>
            <Sun className="w-4 h-4 text-cyan-400 flex-shrink-0" />
          </TooltipTrigger>
          <TooltipContent side="top" className="text-xs">
            Filter to filaments with measured Transmissivity Distance values
          </TooltipContent>
        </Tooltip>
        <Switch
          id="td-filter"
          checked={tdOnly}
          onCheckedChange={setTdOnly}
          className="data-[state=checked]:bg-cyan-500"
        />
        <Label htmlFor="td-filter" className="text-xs text-muted-foreground cursor-pointer select-none">
          Only show filaments with TD values
        </Label>
      </div>

      {/* Results list */}
      {visibleResults.length === 0 ? (
        <ColorFinderEmptyState />
      ) : (
        <div className="space-y-2">
          {visibleResults.map(f => (
            <ColorResultCard key={f.id} filament={f} searchHex={searchHex} />
          ))}
        </div>
      )}

      {/* Load More */}
      {hasMore && (
        <button
          onClick={() => setVisibleCount(prev => prev + 50)}
          className="w-full py-2 text-sm text-primary hover:text-primary/80 flex items-center justify-center gap-1 transition-colors"
        >
          Load More ({results.length - visibleCount} remaining)
          <ChevronDown className="w-4 h-4" />
        </button>
      )}
    </div>
  );
}
