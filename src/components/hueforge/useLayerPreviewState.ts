import { useReducer, useEffect, useCallback, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import type { TDFilament } from './SubstituteFilamentPicker';

export interface LayerSlot {
  filamentId: string | null;
  layerCount: number;
}

export interface LayerPreviewState {
  layers: LayerSlot[];
}

type Action =
  | { type: 'ADD_LAYER' }
  | { type: 'REMOVE_LAYER'; index: number }
  | { type: 'SET_FILAMENT'; index: number; filamentId: string | null }
  | { type: 'SET_LAYER_COUNT'; index: number; count: number }
  | { type: 'CLEAR' }
  | { type: 'LOAD_PRESET'; layers: LayerSlot[] }
  | { type: 'LOAD_STATE'; state: LayerPreviewState };

const DEFAULT_STATE: LayerPreviewState = {
  layers: [
    { filamentId: null, layerCount: 3 },
    { filamentId: null, layerCount: 1 },
  ],
};

function reducer(state: LayerPreviewState, action: Action): LayerPreviewState {
  switch (action.type) {
    case 'ADD_LAYER':
      if (state.layers.length >= 6) return state;
      return { layers: [...state.layers, { filamentId: null, layerCount: 1 }] };
    case 'REMOVE_LAYER':
      if (state.layers.length <= 2) return state;
      return { layers: state.layers.filter((_, i) => i !== action.index) };
    case 'SET_FILAMENT':
      return {
        layers: state.layers.map((l, i) =>
          i === action.index ? { ...l, filamentId: action.filamentId } : l
        ),
      };
    case 'SET_LAYER_COUNT':
      return {
        layers: state.layers.map((l, i) =>
          i === action.index ? { ...l, layerCount: Math.max(1, Math.min(20, action.count)) } : l
        ),
      };
    case 'CLEAR':
      return DEFAULT_STATE;
    case 'LOAD_PRESET':
      return { layers: action.layers };
    case 'LOAD_STATE':
      return action.state;
    default:
      return state;
  }
}

const LS_KEY = 'hfp-layer-preview';

export function useLayerPreviewState(syncUrl = false) {
  // Always call useSearchParams (hooks must be unconditional)
  const [searchParams, setSearchParams] = useSearchParams();

  // Init from URL > localStorage > default
  const initialState = useMemo(() => {
    if (syncUrl) {
      const layers: LayerSlot[] = [];
      for (let i = 1; i <= 6; i++) {
        const param = searchParams.get(`l${i}`);
        if (!param) break;
        const [fid, countStr] = param.split(',');
        layers.push({ filamentId: fid || null, layerCount: parseInt(countStr) || 1 });
      }
      if (layers.length >= 2) return { layers };
    }
    try {
      const saved = localStorage.getItem(LS_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed?.layers?.length >= 2) return parsed as LayerPreviewState;
      }
    } catch {}
    return DEFAULT_STATE;
  }, []); // Only on mount

  const [state, dispatch] = useReducer(reducer, initialState);

  // Persist to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(LS_KEY, JSON.stringify(state));
    } catch {}
  }, [state]);

  // Sync to URL params
  useEffect(() => {
    if (!syncUrl) return;
    const params = new URLSearchParams(searchParams);
    // Clear old
    for (let i = 1; i <= 6; i++) params.delete(`l${i}`);
    state.layers.forEach((l, i) => {
      if (l.filamentId) {
        params.set(`l${i + 1}`, `${l.filamentId},${l.layerCount}`);
      }
    });
    setSearchParams(params, { replace: true });
  }, [state, syncUrl]);

  return { state, dispatch };
}

// Physics helpers
export function calcEffectiveOpacity(layerCount: number, td: number): number {
  if (td <= 0) return 1;
  const raw = 1 - Math.exp((-layerCount * 0.2) / td);
  return Math.max(0.1, Math.min(1.0, raw));
}

export function calcCumulativeTransmission(layers: { opacity: number }[]): number[] {
  const result: number[] = [];
  let transmission = 1.0;
  for (const l of layers) {
    transmission *= 1 - l.opacity;
    result.push(transmission);
  }
  return result;
}

export function hexToRgb(hex: string): [number, number, number] {
  const h = hex.replace('#', '');
  return [
    parseInt(h.substring(0, 2), 16),
    parseInt(h.substring(2, 4), 16),
    parseInt(h.substring(4, 6), 16),
  ];
}

export function compositeColor(
  layers: { hex: string; opacity: number }[],
  bgColor: [number, number, number]
): [number, number, number] {
  let [r, g, b] = bgColor;
  for (const layer of layers) {
    const [lr, lg, lb] = hexToRgb(layer.hex);
    const a = layer.opacity;
    r = lr * a + r * (1 - a);
    g = lg * a + g * (1 - a);
    b = lb * a + b * (1 - a);
  }
  return [Math.round(r), Math.round(g), Math.round(b)];
}
