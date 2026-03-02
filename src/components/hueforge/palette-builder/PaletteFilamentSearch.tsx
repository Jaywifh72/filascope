import { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { trackEvent } from '@/lib/analytics';
import { supabase } from '@/integrations/supabase/client';
import { Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { SwatchCircle } from '@/components/hueforge/SwatchCircle';
import { cn } from '@/lib/utils';
import type { PaletteEntry } from '@/hooks/usePaletteBuilder';

const TD_RANGES = [
  { label: 'All', min: 0, max: 10 },
  { label: 'Opaque (0–1)', min: 0, max: 1 },
  { label: 'Mid-tone (1–3)', min: 1, max: 3 },
  { label: 'Translucent (3–5)', min: 3, max: 5 },
  { label: 'Highlights (5+)', min: 5, max: 10 },
] as const;

function getTdBadgeClasses(td: number): string {
  if (td <= 1) return 'bg-gray-800 text-gray-300';
  if (td <= 3) return 'bg-amber-900/50 text-amber-400';
  if (td <= 5) return 'bg-cyan-900/50 text-cyan-400';
  return 'bg-purple-900/50 text-purple-400';
}

interface Props {
  onAdd: (entry: Omit<PaletteEntry, 'layers'>) => void;
  isFull: boolean;
  existingIds?: string[];
}

export function PaletteFilamentSearch({ onAdd, isFull, existingIds = [] }: Props) {
  const [query, setQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [activeRange, setActiveRange] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  // Debounce 300ms
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedQuery(query.trim()), 300);
    return () => clearTimeout(timer);
  }, [query]);

  // Close on outside click
  useEffect(() => {
    function handler(e: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // Fetch all TD filaments
  const { data: filaments } = useQuery({
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
      return data;
    },
    staleTime: 5 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
  });

  const existingSet = useMemo(() => new Set(existingIds), [existingIds]);

  const results = useMemo(() => {
    if (!filaments || !debouncedQuery) return [];
    const range = TD_RANGES[activeRange];
    const q = debouncedQuery.toLowerCase();
    return filaments
      .filter((f) => {
        if (existingSet.has(f.id)) return false;
        const td = f.transmission_distance ?? 0;
        if (td < range.min || td > range.max) return false;
        const searchable = `${f.product_title} ${f.vendor} ${f.color_family} ${f.material}`.toLowerCase();
        return searchable.includes(q);
      })
      .slice(0, 20);
  }, [filaments, debouncedQuery, activeRange, existingSet]);

  // Reset active index when results change
  useEffect(() => { setActiveIndex(-1); }, [results]);

  const handleSelect = useCallback((f: (typeof results)[0]) => {
    onAdd({
      filamentId: f.id,
      filamentName: f.product_title ?? '',
      brand: f.vendor ?? '',
      material: f.material ?? '',
      color: f.color_hex ?? '',
      tdValue: f.transmission_distance ?? 0,
      colorFamily: f.color_family ?? '',
      slug: f.product_handle ?? undefined,
      price: f.variant_price,
    });
    trackEvent('palette_builder_filament_added', {
      filament_name: f.product_title ?? '',
      brand: f.vendor ?? '',
      td_value: f.transmission_distance ?? 0,
      source: 'search',
    });
    setQuery('');
    setDebouncedQuery('');
    setIsOpen(false);
  }, [onAdd]);

  // Keyboard navigation
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (!isOpen || !results.length) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setActiveIndex((prev) => Math.min(prev + 1, results.length - 1));
        break;
      case 'ArrowUp':
        e.preventDefault();
        setActiveIndex((prev) => Math.max(prev - 1, 0));
        break;
      case 'Enter':
        e.preventDefault();
        if (activeIndex >= 0 && activeIndex < results.length) {
          handleSelect(results[activeIndex]);
        }
        break;
      case 'Escape':
        e.preventDefault();
        setIsOpen(false);
        break;
    }
  }, [isOpen, results, activeIndex, handleSelect]);

  // Scroll active option into view
  useEffect(() => {
    if (activeIndex < 0 || !listRef.current) return;
    const el = listRef.current.children[activeIndex] as HTMLElement;
    el?.scrollIntoView({ block: 'nearest' });
  }, [activeIndex]);

  const listboxId = 'palette-search-listbox';

  return (
    <div ref={wrapperRef} className="space-y-3">
      {/* Search input */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" aria-hidden="true" />
        <Input
          ref={inputRef}
          placeholder="Search by filament name, brand, or color…"
          className="pl-9"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setIsOpen(true);
          }}
          onFocus={() => { if (debouncedQuery) setIsOpen(true); }}
          onKeyDown={handleKeyDown}
          disabled={isFull}
          role="combobox"
          aria-expanded={isOpen && !!debouncedQuery}
          aria-controls={listboxId}
          aria-activedescendant={activeIndex >= 0 ? `palette-option-${activeIndex}` : undefined}
          aria-autocomplete="list"
          aria-label="Search filaments to add to palette"
        />
      </div>

      {/* TD range chips */}
      <div className="flex flex-wrap gap-1.5" role="radiogroup" aria-label="TD range filter">
        {TD_RANGES.map((range, i) => (
          <button
            key={range.label}
            onClick={() => setActiveRange(i)}
            role="radio"
            aria-checked={i === activeRange}
            className={cn(
              'px-2.5 py-1 text-xs rounded-full border transition-colors',
              i === activeRange
                ? 'border-primary bg-primary/10 text-primary'
                : 'border-border text-muted-foreground hover:border-muted-foreground/50'
            )}
          >
            {range.label}
          </button>
        ))}
      </div>

      {/* Dropdown results */}
      {isOpen && debouncedQuery && results.length > 0 && (
        <div
          ref={listRef}
          id={listboxId}
          role="listbox"
          aria-label="Filament search results"
          className="border border-border rounded-lg bg-card shadow-lg max-h-[min(320px,50vh)] overflow-y-auto"
        >
          {results.map((f, i) => (
            <button
              key={f.id}
              id={`palette-option-${i}`}
              role="option"
              aria-selected={i === activeIndex}
              onClick={() => handleSelect(f)}
              className={cn(
                'w-full flex items-center gap-2.5 px-3 py-2.5 text-left hover:bg-muted/50 transition-colors border-b border-border/40 last:border-b-0',
                i === activeIndex && 'bg-muted/50'
              )}
            >
              <SwatchCircle
                hexColor={f.color_hex}
                colorFamily={f.color_family}
                size="w-4 h-4"
              />
              <span className="text-xs text-muted-foreground shrink-0 max-w-[80px] truncate">
                {f.vendor}
              </span>
              <span className="text-sm truncate flex-1">{f.product_title}</span>
              {f.material && (
                <Badge variant="outline" className="text-[10px] px-1.5 py-0 shrink-0 hidden sm:inline-flex">
                  {f.material}
                </Badge>
              )}
              <span
                className={cn(
                  'font-mono text-xs rounded px-1.5 py-0.5 shrink-0',
                  getTdBadgeClasses(f.transmission_distance ?? 0)
                )}
              >
                {f.transmission_distance?.toFixed(2)}
              </span>
              {f.variant_price != null && (
                <span className="text-xs text-muted-foreground shrink-0 hidden sm:inline">
                  ${f.variant_price.toFixed(2)}
                </span>
              )}
            </button>
          ))}
        </div>
      )}
      {isOpen && debouncedQuery && results.length === 0 && (
        <div className="border border-border rounded-lg bg-card p-4 text-center text-sm text-muted-foreground" role="status">
          No filaments found matching "{debouncedQuery}"
        </div>
      )}
    </div>
  );
}
