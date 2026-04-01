// Cross-region deduplication for brand sync pipeline
// Prevents duplicate filament rows when the same product has different product_ids across regional stores

import { type SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2.49.1';

/**
 * Finds an existing filament that matches the given product across regions.
 * Uses brand_id + material + (color_hex OR product_title) as matching criteria.
 * 
 * @returns The ID of the matching filament, or null if no match found.
 */
export async function findCrossRegionMatch(
  supabase: SupabaseClient,
  brandId: string,
  productTitle: string,
  material: string | null,
  colorHex: string | null,
  vendor: string
): Promise<string | null> {
  if (!brandId || !productTitle) return null;

  // Build query: brand_id + material must match
  // Then either color_hex matches OR product_title is similar
  let query = supabase
    .from('filaments')
    .select('id, variant_price, price_cad, price_eur, price_gbp, price_aud, price_jpy')
    .eq('brand_id', brandId);

  // Material must match if provided
  if (material) {
    query = query.eq('material', material);
  } else {
    query = query.is('material', null);
  }

  // Match on color_hex OR product_title
  if (colorHex) {
    query = query.or(`color_hex.eq.${colorHex},product_title.ilike.${productTitle}`);
  } else {
    query = query.ilike('product_title', productTitle);
  }

  const { data: matches, error } = await query.limit(10);

  if (error) {
    console.error('[cross-region-dedup] Query error:', error.message);
    return null;
  }

  if (!matches || matches.length === 0) {
    // Fallback: match by vendor name instead of brand_id
    // Handles filaments seeded with a legacy brand_id that doesn't match automated_brands
    let vendorQuery = supabase
      .from('filaments')
      .select('id, variant_price, price_cad, price_eur, price_gbp, price_aud, price_jpy')
      .eq('vendor', vendor);

    if (material) {
      vendorQuery = vendorQuery.eq('material', material);
    } else {
      vendorQuery = vendorQuery.is('material', null);
    }

    if (colorHex) {
      vendorQuery = vendorQuery.or(`color_hex.eq.${colorHex},product_title.ilike.${productTitle}`);
    } else {
      vendorQuery = vendorQuery.ilike('product_title', productTitle);
    }

    const { data: vendorMatches } = await vendorQuery.limit(10);

    if (!vendorMatches || vendorMatches.length === 0) {
      return null;
    }

    console.log(`[cross-region-dedup] Vendor fallback match found for ${vendor}`);
    return selectBestMatch(vendorMatches);
  }

  if (matches.length === 1) {
    console.log(`[cross-region-dedup] Exact single match found: ${matches[0].id}`);
    return matches[0].id;
  }

  // Multiple matches: pick the one with most regional prices filled
  console.log(`[cross-region-dedup] ${matches.length} candidates found, selecting best quality match`);
  return selectBestMatch(matches);
}

type PriceRow = {
  id: string;
  variant_price: number | null;
  price_cad: number | null;
  price_eur: number | null;
  price_gbp: number | null;
  price_aud: number | null;
  price_jpy: number | null;
};

function selectBestMatch(matches: PriceRow[]): string {
  let bestMatch = matches[0];
  let bestScore = 0;

  for (const match of matches) {
    let score = 0;
    if (match.variant_price != null) score++;
    if (match.price_cad != null) score++;
    if (match.price_eur != null) score++;
    if (match.price_gbp != null) score++;
    if (match.price_aud != null) score++;
    if (match.price_jpy != null) score++;

    if (score > bestScore) {
      bestScore = score;
      bestMatch = match;
    }
  }

  console.log(`[cross-region-dedup] Best match: ${bestMatch.id} (quality score: ${bestScore}/6)`);
  return bestMatch.id;
}
