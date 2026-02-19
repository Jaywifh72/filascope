// Utility for converting material names to URL-safe slugs and back.
// Used by MaterialHub, MaterialReference sidebar, and MaterialKnowledgeBase.

import { MATERIAL_CATEGORIES } from './materialHierarchy';

/**
 * Convert a material name to a URL-friendly slug.
 * Examples:
 *   "PLA"         → "pla"
 *   "PLA+"        → "pla-plus"
 *   "PLA-CF"      → "pla-cf"
 *   "PLA Silk"    → "pla-silk"
 *   "TPU 95A"     → "tpu-95a"
 *   "PLA/PHA"     → "pla-pha"
 */
export function materialNameToSlug(name: string): string {
  return name
    .replace(/\+/g, '-plus')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

/**
 * Returns all material names from MATERIAL_CATEGORIES whose slug matches.
 * Handles the case where multiple names produce the same slug
 * (e.g., "PLA-Silk" and "PLA Silk" both → "pla-silk").
 */
export function slugToMaterialNames(slug: string): string[] {
  const results: string[] = [];
  for (const cat of MATERIAL_CATEGORIES) {
    for (const mat of cat.materials) {
      if (materialNameToSlug(mat) === slug) {
        results.push(mat);
      }
    }
  }
  return results;
}

/**
 * Returns the single best material name for a given slug.
 * Prefers names that have reference data in the Knowledge Base.
 */
export function slugToMaterialName(slug: string): string | null {
  const names = slugToMaterialNames(slug);
  if (names.length === 0) return null;
  return names[0];
}

/**
 * Returns all unique slugs generated from MATERIAL_CATEGORIES.
 */
export function getAllMaterialSlugs(): string[] {
  const seen = new Set<string>();
  const slugs: string[] = [];
  for (const cat of MATERIAL_CATEGORIES) {
    for (const mat of cat.materials) {
      const slug = materialNameToSlug(mat);
      if (!seen.has(slug)) {
        seen.add(slug);
        slugs.push(slug);
      }
    }
  }
  return slugs;
}
