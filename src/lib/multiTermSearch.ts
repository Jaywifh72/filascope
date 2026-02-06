/**
 * Multi-Term Search Utilities
 * 
 * Handles tokenization and matching for multi-word search queries like
 * "Bambu Lab PETG" → matches products where all terms appear across fields.
 */

import { getKnownBrands, getKnownMaterials } from "./fuzzySearch";

// Fields to search with their scoring weights
export const SEARCH_FIELDS = {
  vendor: 5,        // Brand name (highest priority)
  material: 4,      // Material type
  product_title: 3, // Product name
  finish_type: 2,   // Surface finish
  color_family: 1,  // Color category
} as const;

export type SearchableField = keyof typeof SEARCH_FIELDS;

export interface FilamentSearchable {
  id: string;
  vendor?: string | null;
  material?: string | null;
  product_title?: string | null;
  finish_type?: string | null;
  color_family?: string | null;
  [key: string]: unknown;
}

export interface SearchQueryAnalysis {
  terms: string[];
  detectedBrands: string[];
  detectedMaterials: string[];
  originalQuery: string;
}

/**
 * Remove diacritics/accents from a string for accent-insensitive matching
 */
export function removeAccents(str: string): string {
  return str.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}

/**
 * Normalize a string for comparison (lowercase, trim, remove accents)
 */
export function normalizeForSearch(str: string): string {
  return removeAccents(str.toLowerCase().trim());
}

/**
 * Tokenize a search query into individual terms
 * - Respects quoted phrases: "carbon fiber" stays together
 * - Normalizes hyphenated terms: "carbon-fiber" → "carbon fiber"
 * - Filters out very short terms (< 2 chars) unless they're in quotes
 */
export function tokenizeSearchQuery(query: string): string[] {
  if (!query || query.trim().length === 0) {
    return [];
  }

  const terms: string[] = [];
  const normalized = normalizeForSearch(query);

  // Extract quoted phrases first
  const quotedPhraseRegex = /"([^"]+)"/g;
  let remaining = normalized;
  let match: RegExpExecArray | null;

  while ((match = quotedPhraseRegex.exec(normalized)) !== null) {
    const phrase = match[1].trim();
    if (phrase.length > 0) {
      terms.push(phrase);
    }
    remaining = remaining.replace(match[0], " ");
  }

  // Process remaining text
  remaining = remaining
    // Normalize hyphens to spaces for matching
    .replace(/-/g, " ")
    // Remove extra whitespace
    .replace(/\s+/g, " ")
    .trim();

  // Split remaining into individual terms
  const individualTerms = remaining.split(" ").filter((term) => {
    // Filter out very short terms (likely noise)
    return term.length >= 2;
  });

  terms.push(...individualTerms);

  // Deduplicate while preserving order
  return [...new Set(terms)];
}

/**
 * Check if a single term matches within a field value
 */
export function termMatchesField(term: string, fieldValue: string | null | undefined): boolean {
  if (!fieldValue) return false;
  const normalizedField = normalizeForSearch(fieldValue);
  const normalizedTerm = normalizeForSearch(term);
  return normalizedField.includes(normalizedTerm);
}

/**
 * Check if ALL search terms match across ANY combination of searchable fields
 */
export function matchesAllTerms(
  filament: FilamentSearchable,
  terms: string[]
): boolean {
  if (terms.length === 0) return true;

  const searchableFields: SearchableField[] = Object.keys(SEARCH_FIELDS) as SearchableField[];

  // Each term must appear in at least one field
  return terms.every((term) => {
    return searchableFields.some((field) => {
      const value = filament[field];
      if (typeof value !== "string") return false;
      return termMatchesField(term, value);
    });
  });
}

/**
 * Calculate a relevance score for a filament based on how well it matches the search terms
 * Higher score = more relevant
 */
export function calculateRelevanceScore(
  filament: FilamentSearchable,
  terms: string[]
): number {
  if (terms.length === 0) return 0;

  let totalScore = 0;
  const searchableFields: SearchableField[] = Object.keys(SEARCH_FIELDS) as SearchableField[];

  terms.forEach((term) => {
    const normalizedTerm = normalizeForSearch(term);

    searchableFields.forEach((field) => {
      const value = filament[field];
      if (typeof value !== "string") return;

      const normalizedField = normalizeForSearch(value);
      const fieldWeight = SEARCH_FIELDS[field];

      if (normalizedField.includes(normalizedTerm)) {
        // Bonus for exact match (field value equals term)
        if (normalizedField === normalizedTerm) {
          totalScore += fieldWeight * 3;
        }
        // Bonus for starts-with match
        else if (normalizedField.startsWith(normalizedTerm)) {
          totalScore += fieldWeight * 2;
        }
        // Standard contains match
        else {
          totalScore += fieldWeight;
        }
      }
    });
  });

  return totalScore;
}

/**
 * Analyze a search query to extract detected brands and materials
 * Used for smart suggestions in the empty state
 */
export function analyzeSearchQuery(query: string): SearchQueryAnalysis {
  const terms = tokenizeSearchQuery(query);
  const knownBrands = getKnownBrands();
  const knownMaterials = getKnownMaterials();

  const detectedBrands: string[] = [];
  const detectedMaterials: string[] = [];

  // Check each term against known brands and materials
  terms.forEach((term) => {
    const normalizedTerm = normalizeForSearch(term);

    // Check for brand matches
    knownBrands.forEach((brand) => {
      const normalizedBrand = normalizeForSearch(brand);
      // Match if term is part of brand name (e.g., "bambu" matches "Bambu Lab")
      if (normalizedBrand.includes(normalizedTerm) || normalizedTerm.includes(normalizedBrand)) {
        if (!detectedBrands.includes(brand)) {
          detectedBrands.push(brand);
        }
      }
    });

    // Check for material matches
    knownMaterials.forEach((material) => {
      const normalizedMaterial = normalizeForSearch(material);
      if (normalizedMaterial === normalizedTerm || normalizedTerm === normalizedMaterial) {
        if (!detectedMaterials.includes(material)) {
          detectedMaterials.push(material);
        }
      }
    });
  });

  // Also try to match multi-word brand names (e.g., "Bambu Lab" from terms ["bambu", "lab"])
  if (terms.length > 1) {
    const combinedTerms = terms.join(" ");
    knownBrands.forEach((brand) => {
      const normalizedBrand = normalizeForSearch(brand);
      if (normalizedBrand === combinedTerms || combinedTerms.includes(normalizedBrand)) {
        if (!detectedBrands.includes(brand)) {
          detectedBrands.push(brand);
        }
      }
    });
  }

  return {
    terms,
    detectedBrands,
    detectedMaterials,
    originalQuery: query,
  };
}

/**
 * Sort filaments by relevance score (descending)
 */
export function sortByRelevance(
  filaments: FilamentSearchable[],
  terms: string[]
): FilamentSearchable[] {
  if (terms.length === 0) return filaments;

  return [...filaments].sort((a, b) => {
    const scoreA = calculateRelevanceScore(a, terms);
    const scoreB = calculateRelevanceScore(b, terms);
    return scoreB - scoreA;
  });
}

/**
 * Get the first significant term for database pre-filtering
 * Prefers longer terms over shorter ones as they're more specific
 */
export function getPreFilterTerm(terms: string[]): string | null {
  if (terms.length === 0) return null;

  // Sort by length descending, prefer longer more specific terms
  const sorted = [...terms].sort((a, b) => b.length - a.length);
  return sorted[0];
}
