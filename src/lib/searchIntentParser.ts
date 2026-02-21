/**
 * Client-side search intent parser for 3D printing filament queries.
 * Decomposes raw search strings into structured intent: material filters,
 * property-based sorting hints, and remaining free text.
 */

export interface PropertyHint {
  sortCol: string;
  dir: "asc" | "desc";
  badge: string;
  label: string;
}

export interface SearchIntent {
  materialFilter: string | null;
  propertyHints: PropertyHint[];
  freeText: string;
}

/** Maps common search keywords to canonical material names for WHERE material ILIKE */
const MATERIAL_KEYWORDS: Record<string, string> = {
  tpu: "TPU",
  tpe: "TPE",
  pla: "PLA",
  petg: "PETG",
  abs: "ABS",
  asa: "ASA",
  pc: "PC",
  nylon: "Nylon",
  pa: "Nylon",
  pa6: "PA6",
  pa12: "PA12",
  peek: "PEEK",
  pei: "PEI",
  pekk: "PEKK",
  pva: "PVA",
  hips: "HIPS",
  pp: "PP",
  pctg: "PCTG",
  peba: "PEBA",
};

/** Maps descriptive keywords to database column sorting + badge info */
const PROPERTY_KEYWORDS: Record<string, PropertyHint> = {
  flexible: { sortCol: "shore_hardness_d", dir: "asc", badge: "Flexibility", label: "softest first" },
  flex: { sortCol: "shore_hardness_d", dir: "asc", badge: "Flexibility", label: "softest first" },
  soft: { sortCol: "shore_hardness_d", dir: "asc", badge: "Flexibility", label: "softest first" },
  shore: { sortCol: "shore_hardness_d", dir: "asc", badge: "Flexibility", label: "softest first" },
  rubber: { sortCol: "shore_hardness_d", dir: "asc", badge: "Flexibility", label: "softest first" },
  bendy: { sortCol: "shore_hardness_d", dir: "asc", badge: "Flexibility", label: "softest first" },
  strong: { sortCol: "tensile_strength_xy_mpa", dir: "desc", badge: "Strength", label: "strongest first" },
  rigid: { sortCol: "tensile_strength_xy_mpa", dir: "desc", badge: "Strength", label: "strongest first" },
  tough: { sortCol: "tensile_strength_xy_mpa", dir: "desc", badge: "Strength", label: "strongest first" },
  engineering: { sortCol: "tensile_strength_xy_mpa", dir: "desc", badge: "Strength", label: "strongest first" },
  heat: { sortCol: "hdt_18_mpa_c", dir: "desc", badge: "Heat Resistance", label: "most heat-resistant first" },
  hot: { sortCol: "hdt_18_mpa_c", dir: "desc", badge: "Heat Resistance", label: "most heat-resistant first" },
  outdoor: { sortCol: "hdt_18_mpa_c", dir: "desc", badge: "Heat Resistance", label: "most heat-resistant first" },
  "high-temp": { sortCol: "hdt_18_mpa_c", dir: "desc", badge: "Heat Resistance", label: "most heat-resistant first" },
  fast: { sortCol: "print_speed_max_mms", dir: "desc", badge: "Print Speed", label: "fastest first" },
  hs: { sortCol: "print_speed_max_mms", dir: "desc", badge: "Print Speed", label: "fastest first" },
  "high-speed": { sortCol: "print_speed_max_mms", dir: "desc", badge: "Print Speed", label: "fastest first" },
  rapid: { sortCol: "print_speed_max_mms", dir: "desc", badge: "Print Speed", label: "fastest first" },
  lightweight: { sortCol: "density_g_cm3", dir: "asc", badge: "Lightweight", label: "lightest first" },
  light: { sortCol: "density_g_cm3", dir: "asc", badge: "Lightweight", label: "lightest first" },
  stretchy: { sortCol: "elongation_break_xy_percent", dir: "desc", badge: "Stretch", label: "most elastic first" },
  elastic: { sortCol: "elongation_break_xy_percent", dir: "desc", badge: "Stretch", label: "most elastic first" },
};

/**
 * Parse a raw search query into structured intent.
 * Runs synchronously on every keystroke — no API calls.
 */
export function parseSearchIntent(query: string): SearchIntent {
  if (!query || query.trim().length < 2) {
    return { materialFilter: null, propertyHints: [], freeText: query };
  }

  const tokens = query.toLowerCase().trim().split(/\s+/);
  let materialFilter: string | null = null;
  const propertyHints: PropertyHint[] = [];
  const remainingTokens: string[] = [];

  for (const token of tokens) {
    // Check material first
    if (!materialFilter && MATERIAL_KEYWORDS[token]) {
      materialFilter = MATERIAL_KEYWORDS[token];
      // Don't add to remaining — it's consumed by the material filter
      continue;
    }

    // Check property keywords
    const prop = PROPERTY_KEYWORDS[token];
    if (prop && propertyHints.length === 0) {
      propertyHints.push(prop);
      // Also check if certain property tokens imply a material
      if (!materialFilter && (token === "flexible" || token === "flex" || token === "rubber" || token === "bendy")) {
        materialFilter = "TPU";
      }
      continue;
    }

    remainingTokens.push(token);
  }

  return {
    materialFilter,
    propertyHints,
    freeText: remainingTokens.join(" "),
  };
}
