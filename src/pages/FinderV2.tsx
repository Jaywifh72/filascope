import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { Helmet } from 'react-helmet-async';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useRegion } from '@/contexts/RegionContext';
import { getMatchScore } from '@/lib/matchScore';
import type { PrinterSpecsForMaterial } from '@/lib/materialCompatibility';

import { HeroSelector } from '@/components/finder-v2/HeroSelector';
import { TrustBar } from '@/components/finder-v2/TrustBar';
import { ResultsHeader } from '@/components/finder-v2/ResultsHeader';
import { SmartQuickFilters } from '@/components/finder-v2/SmartQuickFilters';
import { FilamentCardV2 } from '@/components/finder-v2/FilamentCardV2';
import { StickyContextBar } from '@/components/finder-v2/StickyContextBar';
import { FilamentCardSkeletonGrid } from '@/components/FilamentCardSkeleton';

// ─── localStorage keys ───
const LS_PRINTER_KEY = 'finderV2_selectedPrinterId';
const LS_MATERIAL_KEY = 'finderV2_selectedMaterial';

function readLS(key: string): string | null {
  try { return localStorage.getItem(key); } catch { return null; }
}
function writeLS(key: string, value: string | null) {
  try {
    if (value == null) localStorage.removeItem(key);
    else localStorage.setItem(key, value);
  } catch { /* ignore */ }
}

// ─── Region → price column mapping ───
const REGION_PRICE_COLS: Record<string, string> = {
  US: 'variant_price',
  CA: 'price_cad',
  EU: 'price_eur',
  UK: 'price_gbp',
  AU: 'price_aud',
};

export default function FinderV2() {
  const { region } = useRegion();

  // ─── Persisted selections ───
  const [selectedPrinterId, setSelectedPrinterId] = useState<string | null>(
    () => readLS(LS_PRINTER_KEY),
  );
  const [selectedMaterial, setSelectedMaterial] = useState<string | null>(
    () => readLS(LS_MATERIAL_KEY),
  );

  useEffect(() => { writeLS(LS_PRINTER_KEY, selectedPrinterId); }, [selectedPrinterId]);
  useEffect(() => { writeLS(LS_MATERIAL_KEY, selectedMaterial); }, [selectedMaterial]);

  // ─── UI state ───
  const [quickFilter, setQuickFilter] = useState('all');
  const [sortValue, setSortValue] = useState('recommended');
  const [stickyVisible, setStickyVisible] = useState(false);

  // Reset quick filter when material changes
  useEffect(() => { setQuickFilter('all'); }, [selectedMaterial]);

  // ─── Scroll detection for sticky bar ───
  const heroRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = heroRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => setStickyVisible(!entry.isIntersecting),
      { threshold: 0 },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  // ─── Data: Printers ───
  const { data: printers = [], isLoading: printersLoading } = useQuery({
    queryKey: ['finderV2-printers'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('printers')
        .select('*, printer_brands(brand)')
        .order('model_name');
      if (error) throw error;
      return (data ?? []).map((p: any) => ({
        ...p,
        brand: (p.printer_brands as any)?.brand ?? 'Unknown',
      }));
    },
    staleTime: 10 * 60 * 1000,
  });

  // ─── Data: Materials (distinct with counts) ───
  const { data: materials = [] } = useQuery({
    queryKey: ['finderV2-materials'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('filaments')
        .select('material')
        .not('material', 'is', null);
      if (error) throw error;
      const counts: Record<string, number> = {};
      for (const row of data ?? []) {
        const m = row.material as string;
        counts[m] = (counts[m] ?? 0) + 1;
      }
      return Object.entries(counts)
        .map(([name, count]) => ({ name, count }))
        .sort((a, b) => b.count - a.count);
    },
    staleTime: 10 * 60 * 1000,
  });

  // ─── Data: Counts ───
  const { data: filamentCount = 0 } = useQuery({
    queryKey: ['finderV2-filament-count'],
    queryFn: async () => {
      const { count, error } = await supabase
        .from('filaments')
        .select('*', { count: 'exact', head: true });
      if (error) throw error;
      return count ?? 0;
    },
    staleTime: 30 * 60 * 1000,
  });

  const { data: brandCount = 0 } = useQuery({
    queryKey: ['finderV2-brand-count'],
    queryFn: async () => {
      // brands table is not exposed via API — count distinct vendors from filaments
      const { data, error } = await supabase
        .from('filaments')
        .select('vendor')
        .not('vendor', 'is', null);
      if (error) throw error;
      const unique = new Set((data ?? []).map((r: any) => r.vendor));
      return unique.size;
    },
    staleTime: 30 * 60 * 1000,
  });

  // ─── Data: Filaments (filtered) ───
  const { data: filaments = [], isLoading: filamentsLoading } = useQuery({
    queryKey: ['finderV2-filaments', selectedMaterial, quickFilter, sortValue],
    queryFn: async () => {
      let query = supabase.from('filaments').select('*');

      // Material filter
      if (selectedMaterial) {
        query = query.eq('material', selectedMaterial);
      }

      // Quick-filter DB-level filters
      if (quickFilter === 'hueforge') {
        query = query.not('transmission_distance', 'is', null);
      } else if (quickFilter === 'high_speed') {
        query = query.eq('high_speed_capable', true);
      } else if (quickFilter === 'silk') {
        query = query.or('finish_type.ilike.%silk%,product_title.ilike.%silk%,product_title.ilike.%shimmer%');
      } else if (quickFilter === 'matte') {
        query = query.or('finish_type.ilike.%matte%,product_title.ilike.%matte%');
      } else if (quickFilter === 'carbon_fiber') {
        query = query.or('product_title.ilike.%CF%,product_title.ilike.%carbon%');
      } else if (quickFilter === 'high_temp') {
        query = query.gt('nozzle_temp_min_c', 240);
      }

      // Sort
      if (sortValue === 'price_asc') {
        query = query.order('variant_price', { ascending: true, nullsFirst: false });
      } else if (sortValue === 'price_desc') {
        query = query.order('variant_price', { ascending: false, nullsFirst: false });
      } else {
        // best_match, recommended, score_desc
        query = query.order('filascope_score', { ascending: false, nullsFirst: false });
      }

      query = query.limit(60);

      const { data, error } = await query;
      if (error) throw error;
      return data ?? [];
    },
    staleTime: 5 * 60 * 1000,
  });

  // ─── Client-side filters ───
  const filteredFilaments = useMemo(() => {
    let list = filaments;

    if (quickFilter === 'deals') {
      list = list.filter(
        (f: any) =>
          f.variant_compare_at_price != null &&
          f.variant_price != null &&
          f.variant_compare_at_price > f.variant_price,
      );
    }

    if (quickFilter === 'regional') {
      const col = REGION_PRICE_COLS[region];
      if (col && col !== 'variant_price') {
        list = list.filter((f: any) => f[col] != null);
      }
    }

    return list;
  }, [filaments, quickFilter, region]);

  // ─── Selected printer object ───
  const selectedPrinter = useMemo(
    () => printers.find((p: any) => p.id === selectedPrinterId) ?? null,
    [printers, selectedPrinterId],
  );

  // ─── Printer specs for HeroSelector ───
  const printerSpecs: PrinterSpecsForMaterial | null = useMemo(() => {
    if (!selectedPrinter) return null;
    return {
      max_nozzle_temp_c: selectedPrinter.max_nozzle_temp_c ?? null,
      has_enclosure: selectedPrinter.has_enclosure ?? null,
      extruder_type: selectedPrinter.extruder_type ?? null,
    };
  }, [selectedPrinter]);

  // ─── Match scores ───
  const scoredFilaments = useMemo(() => {
    if (!selectedPrinter) {
      return filteredFilaments.map((f: any) => ({ filament: f, matchPercent: null }));
    }
    return filteredFilaments
      .map((f: any) => {
        const score = getMatchScore(selectedPrinter, f);
        return { filament: f, matchPercent: score.percent };
      })
      .sort((a, b) => {
        // When sorting by best_match, sort by match score first
        if (sortValue === 'best_match') {
          return (b.matchPercent ?? 0) - (a.matchPercent ?? 0);
        }
        return 0; // preserve DB order for other sorts
      });
  }, [filteredFilaments, selectedPrinter, sortValue]);

  // ─── Helpers ───
  const printerName = selectedPrinter
    ? `${selectedPrinter.brand} ${selectedPrinter.model_name}`
    : null;

  const scrollToResults = useCallback(() => {
    document.getElementById('finder-results')?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  const scrollToHero = useCallback(() => {
    heroRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  return (
    <>
      <Helmet>
        <title>Smart Filament Finder (Beta) | FilaScope</title>
        <meta name="description" content="Find the perfect 3D printer filament in seconds. Select your printer, choose a material, and get personalized recommendations." />
        <meta name="robots" content="noindex" />
      </Helmet>

      {/* Hero */}
      <div ref={heroRef}>
        <HeroSelector
          printers={printers.map((p: any) => ({
            id: p.id,
            model_name: p.model_name,
            brand: p.brand,
            image_url: p.image_url ?? null,
          }))}
          selectedPrinterId={selectedPrinterId}
          onPrinterSelect={setSelectedPrinterId}
          printersLoading={printersLoading}
          materials={materials}
          selectedMaterial={selectedMaterial}
          onMaterialSelect={setSelectedMaterial}
          printerSpecs={printerSpecs}
          filamentCount={filamentCount}
          brandCount={brandCount}
          onShowResults={scrollToResults}
          onBrowseAll={scrollToResults}
        />
      </div>

      {/* Trust Bar */}
      <TrustBar
        filamentCount={filamentCount}
        brandCount={brandCount}
        regionCount={7}
      />

      {/* Results area */}
      <div id="finder-results">
        <ResultsHeader
          printerName={printerName}
          materialName={selectedMaterial}
          resultCount={scoredFilaments.length}
          sortValue={sortValue}
          onSortChange={setSortValue}
        />

        <SmartQuickFilters
          selectedMaterial={selectedMaterial}
          activeFilter={quickFilter}
          onFilterChange={setQuickFilter}
          userRegion={region}
        />

        {/* Card Grid */}
        {filamentsLoading ? (
          <div className="px-6 md:px-8">
            <FilamentCardSkeletonGrid count={12} />
          </div>
        ) : scoredFilaments.length === 0 ? (
          <div className="px-6 py-16 text-center md:px-8">
            <p className="text-lg font-medium text-muted-foreground">
              No filaments match your current filters.
            </p>
            <button
              onClick={() => { setQuickFilter('all'); setSelectedMaterial(null); }}
              className="mt-3 text-sm text-primary underline hover:no-underline"
            >
              Clear all filters
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 px-6 pb-12 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 md:px-8">
            {scoredFilaments.map(({ filament, matchPercent }) => (
              <FilamentCardV2
                key={filament.id}
                filament={filament}
                matchPercent={matchPercent}
              />
            ))}
          </div>
        )}
      </div>

      {/* Sticky Context Bar */}
      <StickyContextBar
        printerName={printerName}
        materialName={selectedMaterial}
        resultCount={scoredFilaments.length}
        isVisible={stickyVisible}
        onChangePrinter={scrollToHero}
      />
    </>
  );
}
