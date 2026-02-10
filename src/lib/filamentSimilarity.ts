/**
 * Filament Similarity Engine
 *
 * Shared utility for determining how "similar" two filaments are, using
 * finish type, reinforcement, diameter, temperature compatibility, and
 * high-speed capability — all data already in the filaments table.
 *
 * Used by:
 * - useSimilarFilamentsEnhanced (You Might Also Like section)
 * - CheaperAlternativeCallout (cheaper alternative banner)
 * - useSimilarFilaments (SuggestionChips in compare tray)
 */

import { supabase } from "@/integrations/supabase/client";
import { isValidFinishType } from "@/lib/finishTypeValidation";

// ─── Types ──────────────────────────────────────────────────────────────────

export type SimilarityTier = "exact_match" | "close_match" | "loose_match";

export interface FilamentProfile {
  material: string | null;
  finish_type: string | null;
  carbon_fiber_percentage: number | null;
  glass_fiber_percentage: number | null;
  high_speed_capable: boolean | null;
  is_nozzle_abrasive: boolean | null;
  diameter_nominal_mm: number | null;
  nozzle_temp_min_c: number | null;
  nozzle_temp_max_c: number | null;
  product_title: string;
  net_weight_g?: number | null;
  featured_image?: string | null;
  variant_price?: number | null;
}

export interface SimilarityScore {
  total: number;
  breakdown: Record<string, number>;
  tier: SimilarityTier;
  disqualified: boolean;
  disqualifyReason?: string;
}

// ─── Constants ──────────────────────────────────────────────────────────────

const FINISH_FAMILIES: Record<string, string[]> = {
  smooth_standard: ["standard", "matte", "satin"],
  glossy_decorative: ["silk", "gloss", "metallic", "galaxy", "sparkle"],
  effect: ["marble", "glow", "dual-color", "gradient", "wood", "stone"],
  transparent_family: ["transparent", "translucent"],
};

/** Reverse lookup: finish → family name */
const FINISH_TO_FAMILY: Record<string, string> = {};
for (const [family, finishes] of Object.entries(FINISH_FAMILIES)) {
  for (const f of finishes) {
    FINISH_TO_FAMILY[f] = family;
  }
}

// ─── A) getBaseMaterial ─────────────────────────────────────────────────────

/**
 * Normalizes a material string to its base material.
 * "PLA-CF" → "PLA", "PA6-GF" → "PA", "PETG-CF" → "PETG"
 */
export function getBaseMaterial(material: string | null): string {
  if (!material) return "";
  const upper = material.toUpperCase().trim();

  // Handle PA/Nylon family: PA6, PA12, PA6-CF, PA6-GF etc.
  if (/^(PA\d|NYLON)/i.test(upper)) return "PA";

  // Split on common separators and take first token
  const base = upper.split(/[\s\-+]/)[0];

  // Handle PET-G → PETG
  if (base === "PET" && upper.includes("G")) return "PETG";

  return base;
}

// ─── B) getFinishType ───────────────────────────────────────────────────────

/**
 * Returns a normalized finish type string.
 * Primary: finish_type column. Fallback: title parsing.
 */
export function getFinishType(filament: FilamentProfile): string {
  // Try the DB column first
  if (filament.finish_type) {
    const dbFinish = filament.finish_type.toLowerCase().trim();
    if (isValidFinishType(filament.finish_type)) {
      // Map known DB values to our canonical set
      if (dbFinish === "glossy") return "gloss";
      if (dbFinish === "glitter") return "sparkle";
      if (dbFinish === "rainbow") return "gradient";
      if (dbFinish === "textured") return "standard";
      if (dbFinish === "semi-matte" || dbFinish === "semi-glossy") return "standard";
      if (dbFinish === "frosted") return "translucent";
      if (dbFinish === "opaque") return "standard";
      if (FINISH_TO_FAMILY[dbFinish]) return dbFinish;
    }
  }

  // Fallback: parse from product_title
  const title = (filament.product_title || "").toLowerCase();

  if (title.includes("matte")) return "matte";
  if (title.includes("silk") || title.includes("shiny silk")) return "silk";
  if (title.includes("satin")) return "satin";
  if (title.includes("galaxy")) return "galaxy";
  if (title.includes("metallic")) return "metallic";
  if (title.includes("marble")) return "marble";
  if (title.includes("glow") || title.includes("glow-in")) return "glow";
  if (title.includes("dual-color") || title.includes("dual color") || /\bdual\b/.test(title)) return "dual-color";
  if (title.includes("gradient") || title.includes("rainbow")) return "gradient";
  if (title.includes("sparkle") || title.includes("glitter")) return "sparkle";
  if (title.includes("wood")) return "wood";
  if (title.includes("stone")) return "stone";
  if (title.includes("transparent") || title.includes("clear")) return "transparent";
  if (title.includes("translucent")) return "translucent";

  return "standard";
}

// ─── C) isReinforced ────────────────────────────────────────────────────────

export function isReinforced(filament: FilamentProfile): { reinforced: boolean; type: string } {
  if (filament.carbon_fiber_percentage != null && filament.carbon_fiber_percentage > 0) {
    return { reinforced: true, type: "carbon-fiber" };
  }
  if (filament.glass_fiber_percentage != null && filament.glass_fiber_percentage > 0) {
    return { reinforced: true, type: "glass-fiber" };
  }

  const title = (filament.product_title || "").toUpperCase();
  if (/[-\s]CF\b/.test(title) || title.endsWith(" CF")) return { reinforced: true, type: "carbon-fiber" };
  if (/[-\s]GF\b/.test(title) || title.endsWith(" GF")) return { reinforced: true, type: "glass-fiber" };

  return { reinforced: false, type: "none" };
}

// ─── D) isDisqualified ──────────────────────────────────────────────────────

export function isDisqualified(
  source: FilamentProfile,
  candidate: FilamentProfile
): { disqualified: boolean; reason?: string } {
  // 1. Different base material
  const srcBase = getBaseMaterial(source.material);
  const candBase = getBaseMaterial(candidate.material);
  if (srcBase && candBase && srcBase !== candBase) {
    return { disqualified: true, reason: "Different base material" };
  }

  // 2. Different diameter
  if (
    source.diameter_nominal_mm != null &&
    candidate.diameter_nominal_mm != null &&
    source.diameter_nominal_mm !== candidate.diameter_nominal_mm
  ) {
    return { disqualified: true, reason: "Different diameter" };
  }

  // 3. Reinforcement mismatch
  const srcReinf = isReinforced(source);
  const candReinf = isReinforced(candidate);
  if (srcReinf.reinforced !== candReinf.reinforced) {
    return { disqualified: true, reason: "Reinforcement mismatch" };
  }
  if (srcReinf.reinforced && candReinf.reinforced && srcReinf.type !== candReinf.type) {
    return { disqualified: true, reason: "Reinforcement mismatch" };
  }

  // 4. Nozzle abrasiveness mismatch
  if (
    source.is_nozzle_abrasive === false &&
    candidate.is_nozzle_abrasive === true
  ) {
    return { disqualified: true, reason: "Nozzle requirement mismatch" };
  }

  return { disqualified: false };
}

// ─── E) computeSimilarityScore ──────────────────────────────────────────────

export function computeSimilarityScore(
  source: FilamentProfile,
  candidate: FilamentProfile
): SimilarityScore {
  const dq = isDisqualified(source, candidate);
  if (dq.disqualified) {
    return {
      total: -1,
      breakdown: {},
      tier: "loose_match",
      disqualified: true,
      disqualifyReason: dq.reason,
    };
  }

  const breakdown: Record<string, number> = {};

  // — Finish type (35 pts) —
  const srcFinish = getFinishType(source);
  const candFinish = getFinishType(candidate);
  if (srcFinish === candFinish) {
    breakdown.finish = 35;
  } else {
    const srcFamily = FINISH_TO_FAMILY[srcFinish];
    const candFamily = FINISH_TO_FAMILY[candFinish];
    breakdown.finish = srcFamily && candFamily && srcFamily === candFamily ? 20 : 0;
  }

  // — Temperature compatibility (20 pts) —
  if (
    source.nozzle_temp_min_c != null && source.nozzle_temp_max_c != null &&
    candidate.nozzle_temp_min_c != null && candidate.nozzle_temp_max_c != null
  ) {
    const srcMid = (source.nozzle_temp_min_c + source.nozzle_temp_max_c) / 2;
    const candMid = (candidate.nozzle_temp_min_c + candidate.nozzle_temp_max_c) / 2;
    const diff = Math.abs(srcMid - candMid);
    if (diff <= 20) breakdown.temperature = 20;
    else if (diff <= 40) breakdown.temperature = 12;
    else breakdown.temperature = 0;
  } else {
    breakdown.temperature = 10; // neutral
  }

  // — High speed match (15 pts) —
  if (source.high_speed_capable != null && candidate.high_speed_capable != null) {
    breakdown.highSpeed = source.high_speed_capable === candidate.high_speed_capable ? 15 : 5;
  } else {
    breakdown.highSpeed = 10; // neutral
  }

  // — Price tier (15 pts — always neutral) —
  breakdown.priceTier = 15;

  // — Spool size (10 pts) —
  if (source.net_weight_g != null && candidate.net_weight_g != null) {
    const diff = Math.abs(source.net_weight_g - candidate.net_weight_g);
    if (diff <= 100) breakdown.spoolSize = 10;
    else if (diff <= 250) breakdown.spoolSize = 6;
    else breakdown.spoolSize = 2;
  } else {
    breakdown.spoolSize = 5; // neutral
  }

  // — Image available (5 pts) —
  breakdown.image = candidate.featured_image ? 5 : 0;

  const total = Object.values(breakdown).reduce((a, b) => a + b, 0);
  const tier: SimilarityTier =
    total >= 75 ? "exact_match" : total >= 50 ? "close_match" : "loose_match";

  return { total, breakdown, tier, disqualified: false };
}

// ─── F) buildSimilarityQuery ────────────────────────────────────────────────

const SIMILARITY_SELECT = `
  id, product_title, vendor, material, variant_price,
  net_weight_g, pack_quantity, product_handle, featured_image,
  finish_type, carbon_fiber_percentage, glass_fiber_percentage,
  high_speed_capable, is_nozzle_abrasive, diameter_nominal_mm,
  nozzle_temp_min_c, nozzle_temp_max_c, color_family,
  ease_of_printing_score, filascope_score, color_hex
`;

export function buildSimilarityQuery(
  source: FilamentProfile,
  options: {
    excludeId: string;
    excludeVendor?: string;
    limit?: number;
    select?: string;
  }
) {
  const baseMaterial = getBaseMaterial(source.material);
  const reinforcement = isReinforced(source);
  const limit = options.limit ?? 120;

  let query = supabase
    .from("filaments")
    .select(options.select || SIMILARITY_SELECT)
    .ilike("material", `${baseMaterial}%`)
    .neq("id", options.excludeId)
    .not("variant_price", "is", null)
    .eq("variant_available", true)
    .or("net_weight_g.is.null,net_weight_g.gte.300");

  // Exclude same vendor if specified
  if (options.excludeVendor) {
    query = query.neq("vendor", options.excludeVendor);
  }

  // Diameter match
  if (source.diameter_nominal_mm != null) {
    query = query.eq("diameter_nominal_mm", source.diameter_nominal_mm);
  }

  // Reinforcement filters
  if (reinforcement.reinforced) {
    if (reinforcement.type === "carbon-fiber") {
      query = query.gt("carbon_fiber_percentage", 0);
    } else if (reinforcement.type === "glass-fiber") {
      query = query.gt("glass_fiber_percentage", 0);
    }
  } else {
    query = query.or("carbon_fiber_percentage.is.null,carbon_fiber_percentage.eq.0");
    query = query.or("glass_fiber_percentage.is.null,glass_fiber_percentage.eq.0");
  }

  return query.order("variant_price", { ascending: true }).limit(limit);
}
