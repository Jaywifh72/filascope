import { useState, useCallback, useEffect, useRef } from 'react';
import { toast } from 'sonner';

const STORAGE_KEY = 'filascope-palette-builder';
const MAX_FILAMENTS = 12;

export interface PaletteEntry {
  filamentId: string;
  filamentName: string;
  brand: string;
  material: string;
  color: string; // hex
  tdValue: number;
  colorFamily: string;
  layers: number;
  slug?: string;
  price?: number | null;
}

function isValidEntry(x: unknown): x is PaletteEntry {
  return (
    typeof x === 'object' && x !== null &&
    typeof (x as any).filamentId === 'string' &&
    typeof (x as any).tdValue === 'number'
  );
}

function loadFromStorage(): PaletteEntry[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.every(isValidEntry)) return parsed;
      // Corrupted shape — clear it
      localStorage.removeItem(STORAGE_KEY);
    }
  } catch {
    try { localStorage.removeItem(STORAGE_KEY); } catch { /* ignore */ }
  }
  return [];
}

function saveToStorage(entries: PaletteEntry[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
  } catch { /* ignore */ }
}

export function usePaletteBuilder() {
  const [palette, setPalette] = useState<PaletteEntry[]>(loadFromStorage);
  const paletteRef = useRef(palette);
  paletteRef.current = palette;

  useEffect(() => {
    saveToStorage(palette);
  }, [palette]);

  const addFilament = useCallback((entry: Omit<PaletteEntry, 'layers'>) => {
    const prev = paletteRef.current;
    if (prev.length >= MAX_FILAMENTS) {
      toast.error('Maximum 12 filaments per palette');
      return;
    }
    if (prev.some((p) => p.filamentId === entry.filamentId)) {
      toast('This filament is already in your palette');
      return;
    }
    setPalette((cur) => [...cur, { ...entry, layers: 1 }]);
    toast.success(`${entry.filamentName} added to palette`);
  }, []);

  const removeFilament = useCallback((id: string) => {
    setPalette((prev) => prev.filter((p) => p.filamentId !== id));
  }, []);

  const updateLayers = useCallback((id: string, count: number) => {
    const clamped = Math.max(1, Math.min(6, count));
    setPalette((prev) =>
      prev.map((p) => (p.filamentId === id ? { ...p, layers: clamped } : p))
    );
  }, []);

  const reorderFilament = useCallback((id: string, direction: 'up' | 'down') => {
    setPalette((prev) => {
      const idx = prev.findIndex((p) => p.filamentId === id);
      if (idx < 0) return prev;
      const swapIdx = direction === 'up' ? idx - 1 : idx + 1;
      if (swapIdx < 0 || swapIdx >= prev.length) return prev;
      const next = [...prev];
      [next[idx], next[swapIdx]] = [next[swapIdx], next[idx]];
      return next;
    });
  }, []);

  const clearPalette = useCallback(() => {
    setPalette([]);
    try { localStorage.removeItem(STORAGE_KEY); } catch { /* ignore */ }
  }, []);

  /** Replace the entire palette (used for URL restore & presets) */
  const loadPalette = useCallback((entries: PaletteEntry[]) => {
    setPalette(entries.slice(0, MAX_FILAMENTS));
  }, []);

  const totalLayers = palette.reduce((sum, p) => sum + p.layers, 0);
  const tdValues = palette.map((p) => p.tdValue);
  const tdMin = tdValues.length ? Math.min(...tdValues) : null;
  const tdMax = tdValues.length ? Math.max(...tdValues) : null;
  const tdAvg = tdValues.length ? tdValues.reduce((s, v) => s + v, 0) / tdValues.length : null;

  return {
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
    isFull: palette.length >= MAX_FILAMENTS,
  };
}
