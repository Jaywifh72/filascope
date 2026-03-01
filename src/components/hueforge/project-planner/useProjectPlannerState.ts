import { useReducer, useEffect, useCallback } from 'react';

export interface PlannerSlot {
  role: string;
  targetTdMin: number;
  targetTdMax: number;
  targetColorFamily: string;
  selectedFilamentId: string | null;
}

export interface PlannerState {
  step: number;
  projectType: string | null;
  colorCount: number;
  slots: PlannerSlot[];
  customRoles: boolean;
}

type Action =
  | { type: 'SET_PROJECT_TYPE'; payload: { projectType: string; colorCount: number } }
  | { type: 'SET_COLOR_COUNT'; payload: number }
  | { type: 'SET_SLOT_FILAMENT'; payload: { index: number; filamentId: string | null } }
  | { type: 'SET_STEP'; payload: number }
  | { type: 'UPDATE_SLOT_ROLE'; payload: { index: number; slot: Partial<PlannerSlot> } }
  | { type: 'TOGGLE_CUSTOM_ROLES' }
  | { type: 'RESET' }
  | { type: 'HYDRATE'; payload: PlannerState };

const PROJECT_TYPES: Record<string, number> = {
  portrait: 5,
  landscape: 4,
  pet: 4,
  logo: 2,
  lithophane: 1,
  custom: 3,
};

export function generateSlots(count: number): PlannerSlot[] {
  if (count === 1) {
    return [{ role: 'Single Color', targetTdMin: 2, targetTdMax: 6, targetColorFamily: 'White', selectedFilamentId: null }];
  }
  if (count === 2) {
    return [
      { role: 'Base Layer — Opaque', targetTdMin: 0.3, targetTdMax: 1.0, targetColorFamily: 'Black', selectedFilamentId: null },
      { role: 'Highlights', targetTdMin: 3.0, targetTdMax: 10, targetColorFamily: 'White', selectedFilamentId: null },
    ];
  }
  const slots: PlannerSlot[] = [];
  // Base
  slots.push({ role: 'Base Layer — Opaque', targetTdMin: 0.3, targetTdMax: 1.0, targetColorFamily: 'Black', selectedFilamentId: null });
  // Middle slots
  const midCount = count - 2;
  for (let i = 0; i < midCount; i++) {
    const t = (i + 1) / (midCount + 1);
    const tdMin = +(1.0 + t * 2.0).toFixed(1);
    const tdMax = +(tdMin + 0.8).toFixed(1);
    const labels = ['Dark Mid-tone', 'Mid-tone', 'Light Mid-tone', 'Skin/Primary', 'Accent', 'Detail'];
    slots.push({
      role: labels[i] || `Layer ${i + 2}`,
      targetTdMin: tdMin,
      targetTdMax: tdMax,
      targetColorFamily: 'Any',
      selectedFilamentId: null,
    });
  }
  // Top
  slots.push({ role: 'Highlights', targetTdMin: 3.0, targetTdMax: 10, targetColorFamily: 'White', selectedFilamentId: null });
  return slots;
}

const STORAGE_KEY = 'hfp-project-planner';

function loadState(): PlannerState | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
}

const defaultState: PlannerState = {
  step: 1,
  projectType: null,
  colorCount: 3,
  slots: generateSlots(3),
  customRoles: false,
};

function reducer(state: PlannerState, action: Action): PlannerState {
  switch (action.type) {
    case 'SET_PROJECT_TYPE': {
      const { projectType, colorCount } = action.payload;
      return { ...state, projectType, colorCount, slots: generateSlots(colorCount), step: 2 };
    }
    case 'SET_COLOR_COUNT': {
      const c = Math.max(1, Math.min(8, action.payload));
      // Preserve selected filaments where possible
      const newSlots = generateSlots(c);
      for (let i = 0; i < Math.min(state.slots.length, newSlots.length); i++) {
        newSlots[i].selectedFilamentId = state.slots[i].selectedFilamentId;
      }
      return { ...state, colorCount: c, slots: newSlots };
    }
    case 'SET_SLOT_FILAMENT': {
      const slots = [...state.slots];
      slots[action.payload.index] = { ...slots[action.payload.index], selectedFilamentId: action.payload.filamentId };
      return { ...state, slots };
    }
    case 'SET_STEP':
      return { ...state, step: action.payload };
    case 'UPDATE_SLOT_ROLE': {
      const slots = [...state.slots];
      slots[action.payload.index] = { ...slots[action.payload.index], ...action.payload.slot };
      return { ...state, slots };
    }
    case 'TOGGLE_CUSTOM_ROLES':
      return { ...state, customRoles: !state.customRoles };
    case 'RESET':
      return { ...defaultState };
    case 'HYDRATE':
      return action.payload;
    default:
      return state;
  }
}

export function useProjectPlannerState() {
  const [state, dispatch] = useReducer(reducer, defaultState, (init) => loadState() || init);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }, [state]);

  const allSlotsFilled = state.slots.every((s) => s.selectedFilamentId !== null);

  const setProjectType = useCallback((type: string) => {
    dispatch({ type: 'SET_PROJECT_TYPE', payload: { projectType: type, colorCount: PROJECT_TYPES[type] || 3 } });
  }, []);

  return { state, dispatch, allSlotsFilled, setProjectType, PROJECT_TYPES };
}

export function getSuggestedLayers(td: number): string {
  if (td < 1) return '3–4';
  if (td < 2) return '2–3';
  if (td < 3) return '1–2';
  return '1';
}
