/**
 * Client-side search intent parser for 3D printing filament queries.
 * Decomposes raw search strings into structured intent: material filters,
 * property-based sorting hints, and remaining free text.
 */

export interface PropertyIntent {
  name: string;
  sortColumn: string;
  sortDirection: 'asc' | 'desc';
  badgeLabel: string;
  badgeColumn: string;
  badgeUnit: string;
  explanation: string;
}

export interface SearchIntent {
  originalQuery: string;
  materialFilter: string | null;
  propertyIntent: PropertyIntent | null;
  brandFilter: string | null;
  freeTextTokens: string[];
  displayLabel: string;
  tsQuery: string;
  isEmpty: boolean;
}

// Keep legacy exports for backward compatibility with useSmartSearch / SearchSmartChips
export interface PropertyHint {
  sortCol: string;
  dir: "asc" | "desc";
  badge: string;
  label: string;
}

/** Maps common search keywords to canonical material names for WHERE material ILIKE */
const MATERIAL_ALIASES: Record<string, string> = {
  // Flexible / Elastomers
  'tpu': 'TPU',
  'tpe': 'TPE',
  'flex': 'TPU',
  'flexible': 'TPU',
  'elastomer': 'TPU',
  'rubber': 'TPU',
  'soft': 'TPU',
  // Standard materials
  'pla': 'PLA',
  'pla+': 'PLA',
  'petg': 'PETG',
  'pet': 'PETG',
  'abs': 'ABS',
  'abs+': 'ABS',
  'asa': 'ASA',
  'pc': 'PC',
  'polycarbonate': 'PC',
  // Engineering
  'nylon': 'Nylon/PA',
  'pa': 'Nylon/PA',
  'pa6': 'PA6',
  'pa12': 'PA12',
  'pa66': 'PA12',
  'peek': 'PEEK',
  'pei': 'PEI/Ultem',
  'ultem': 'PEI/Ultem',
  // Support / specialty
  'pva': 'PVA',
  'hips': 'HIPS',
  'wood': 'WOOD',
  'flax': 'FLAX',
  'greentec': 'GREENTEC',
  'rtofusion': 'RTOFUSION',
  // Additional aliases from legacy map
  'pekk': 'PEKK',
  'pp': 'PP',
  'pctg': 'PCTG',
  'peba': 'PEBA',
};

const FLEXIBILITY_INTENT: PropertyIntent = {
  name: 'Flexibility',
  sortColumn: 'hardness_shore_a',
  sortDirection: 'asc',
  badgeLabel: 'Shore',
  badgeColumn: 'hardness_shore_a',
  badgeUnit: 'A',
  explanation: 'Sorted by Shore A hardness (lower = more flexible)',
};

const STRENGTH_INTENT: PropertyIntent = {
  name: 'Strength',
  sortColumn: 'tensile_strength_xy_mpa',
  sortDirection: 'desc',
  badgeLabel: 'Tensile',
  badgeColumn: 'tensile_strength_xy_mpa',
  badgeUnit: 'MPa',
  explanation: 'Sorted by tensile strength (higher = stronger)',
};

const HEAT_INTENT: PropertyIntent = {
  name: 'Heat Resistance',
  sortColumn: 'hdt_18_mpa_c',
  sortDirection: 'desc',
  badgeLabel: 'HDT',
  badgeColumn: 'hdt_18_mpa_c',
  badgeUnit: '°C',
  explanation: 'Sorted by Heat Deflection Temperature',
};

const SPEED_INTENT: PropertyIntent = {
  name: 'Print Speed',
  sortColumn: 'print_speed_max_mms',
  sortDirection: 'desc',
  badgeLabel: 'Max Speed',
  badgeColumn: 'print_speed_max_mms',
  badgeUnit: 'mm/s',
  explanation: 'Sorted by maximum print speed',
};

const LIGHTWEIGHT_INTENT: PropertyIntent = {
  name: 'Lightweight',
  sortColumn: 'density_g_cm3',
  sortDirection: 'asc',
  badgeLabel: 'Density',
  badgeColumn: 'density_g_cm3',
  badgeUnit: 'g/cm³',
  explanation: 'Sorted by material density (lower = lighter)',
};

const STRETCH_INTENT: PropertyIntent = {
  name: 'Stretch',
  sortColumn: 'elongation_break_xy_percent',
  sortDirection: 'desc',
  badgeLabel: 'Elongation',
  badgeColumn: 'elongation_break_xy_percent',
  badgeUnit: '%',
  explanation: 'Sorted by elongation at break (higher = more elastic)',
};

/** Maps descriptive keywords to property-based sorting intents */
const PROPERTY_INTENTS: Record<string, PropertyIntent> = {
  'flexible': FLEXIBILITY_INTENT,
  'flex': FLEXIBILITY_INTENT,
  'soft': FLEXIBILITY_INTENT,
  'rubber': FLEXIBILITY_INTENT,
  'elastic': FLEXIBILITY_INTENT,
  'shore': FLEXIBILITY_INTENT,
  'bendy': FLEXIBILITY_INTENT,
  'strong': STRENGTH_INTENT,
  'rigid': STRENGTH_INTENT,
  'tough': STRENGTH_INTENT,
  'engineering': STRENGTH_INTENT,
  'heat': HEAT_INTENT,
  'hightemp': HEAT_INTENT,
  'hot': HEAT_INTENT,
  'high-temp': HEAT_INTENT,
  'outdoor': { ...HEAT_INTENT, explanation: 'Sorted by heat resistance for outdoor use' },
  'fast': SPEED_INTENT,
  'hs': SPEED_INTENT,
  'speed': SPEED_INTENT,
  'high-speed': SPEED_INTENT,
  'rapid': SPEED_INTENT,
  'lightweight': LIGHTWEIGHT_INTENT,
  'light': LIGHTWEIGHT_INTENT,
  'stretchy': STRETCH_INTENT,
};

/**
 * Parse a raw search query into structured intent.
 * Runs synchronously on every keystroke — no API calls.
 */
export function parseSearchIntent(query: string): SearchIntent {
  const trimmed = (query || '').trim();

  if (trimmed.length < 2) {
    return {
      originalQuery: query || '',
      materialFilter: null,
      propertyIntent: null,
      brandFilter: null,
      freeTextTokens: [],
      displayLabel: '',
      tsQuery: '',
      isEmpty: true,
    };
  }

  const normalized = trimmed.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  const tokens = normalized.toLowerCase().split(/\s+/);
  let materialFilter: string | null = null;
  let propertyIntent: PropertyIntent | null = null;
  const freeTextTokens: string[] = [];

  for (const token of tokens) {
    // Check material first
    if (!materialFilter && MATERIAL_ALIASES[token]) {
      materialFilter = MATERIAL_ALIASES[token];
      continue;
    }

    // Check property keywords
    if (!propertyIntent && PROPERTY_INTENTS[token]) {
      propertyIntent = PROPERTY_INTENTS[token];
      // Property tokens that also imply a material
      if (!materialFilter && ['flexible', 'flex', 'rubber', 'bendy', 'soft', 'elastic'].includes(token)) {
        materialFilter = 'TPU';
      }
      continue;
    }

    freeTextTokens.push(token);
  }

  // Build tsQuery: join all original tokens with ' | '
  const tsQuery = tokens.map(t => t.replace(/[^a-z0-9]/g, '')).filter(Boolean).join(' | ');

  // Build displayLabel
  const parts: string[] = [];
  if (propertyIntent) parts.push(propertyIntent.name);
  if (materialFilter) parts.push(materialFilter);
  if (freeTextTokens.length > 0) parts.push(freeTextTokens.join(' '));
  const displayLabel = parts.join(' · ') || trimmed;

  return {
    originalQuery: query || '',
    materialFilter,
    propertyIntent,
    brandFilter: null,
    freeTextTokens,
    displayLabel,
    tsQuery,
    isEmpty: false,
  };
}

/**
 * Returns a human-readable explanation of what the search will do.
 */
export function getSearchExplanation(intent: SearchIntent): string {
  if (intent.isEmpty) return '';

  const parts: string[] = [];

  if (intent.materialFilter) {
    parts.push(`Showing only ${intent.materialFilter} filaments`);
  }

  if (intent.propertyIntent) {
    const dir = intent.propertyIntent.sortDirection === 'asc' ? 'lower' : 'higher';
    parts.push(`sorted by ${intent.propertyIntent.name.toLowerCase()} (${intent.propertyIntent.badgeLabel} ${intent.propertyIntent.badgeUnit}, ${dir} = better)`);
  }

  if (intent.freeTextTokens.length > 0) {
    parts.push(`matching "${intent.freeTextTokens.join(' ')}"`);
  }

  if (parts.length === 0) return `Searching for "${intent.originalQuery}"`;

  // Capitalize first letter
  const result = parts.join(', ');
  return result.charAt(0).toUpperCase() + result.slice(1);
}

// ── Legacy adapter for useSmartSearch backward compatibility ──

/** @deprecated Use SearchIntent + propertyIntent instead */
export function toLegacyPropertyHints(intent: SearchIntent): PropertyHint[] {
  if (!intent.propertyIntent) return [];
  return [{
    sortCol: intent.propertyIntent.sortColumn,
    dir: intent.propertyIntent.sortDirection,
    badge: intent.propertyIntent.name,
    label: intent.propertyIntent.explanation,
  }];
}
