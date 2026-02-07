/**
 * useWizardRecommendations — Fetches real FilaScope products for wizard results
 * 
 * Ports the material scoring logic from Wizard.tsx, queries the filaments DB,
 * resolves regional prices, computes FilaScore, and ranks products by relevance.
 */

import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useRegion } from '@/contexts/RegionContext';
import { useAffiliateLinks } from '@/hooks/useAffiliateLinks';
import { resolveFilamentPrice, type FilamentForPricing } from '@/lib/resolveFilamentPrice';
import { calculateUnifiedScore, getScoreNumberColor, type FilamentForScoring } from '@/lib/unifiedFilamentScore';
import { getMaterialsInCategory } from '@/lib/materialHierarchy';
import { cleanFilamentDisplayName } from '@/lib/productNameUtils';
import { generateFilamentSlug } from '@/lib/seoSlugUtils';
import type { CurrencyCode } from '@/types/regional';

// ─── Types ──────────────────────────────────────────────────────────────────

export interface WizardProduct {
  id: string;
  productTitle: string;
  vendor: string;
  material: string;
  featuredImage: string | null;
  colorHex: string | null;
  formattedPrice: string | null;
  formattedPricePerKg: string | null;
  isConverted: boolean;
  score: number | null;
  scoreColor: string;
  detailUrl: string;
  buyUrl: string | null;
  buyStoreName: string | null;
}

export interface WizardMaterialResult {
  material: string;
  matchPercent: number;
  description: string;
  whyRecommended: string[];
  difficulty: 'Easy' | 'Moderate' | 'Advanced';
  priceRange: { min: number; max: number } | null;
  formattedPriceRange: string;
  products: WizardProduct[];
  finderUrl: string;
}

export interface WizardAnswers {
  use_case?: string;
  printer?: string;
  priority?: string;
  budget?: string;
  special?: string[];
  [key: string]: string | string[] | undefined;
}

// ─── Material Scoring (ported from Wizard.tsx getRecommendations) ───────────

interface ScoredMaterial {
  material: string;
  score: number;
  matchPercent: number;
  reasons: string[];
  desc: string;
  difficulty: 'Easy' | 'Moderate' | 'Advanced';
  dbMaterials: string[];
}

function scoreMaterials(answers: WizardAnswers): ScoredMaterial[] {
  const useCase = answers.use_case as string;
  const priority = answers.priority as string;
  const budget = answers.budget as string;
  const special = (answers.special as string[]) || [];
  const printer = answers.printer as string;

  const materials: Record<string, {
    score: number; reasons: string[]; desc: string;
    difficulty: 'Easy' | 'Moderate' | 'Advanced'; dbMaterials: string[];
  }> = {
    'PLA': {
      score: 50, reasons: [],
      desc: "The most popular and beginner-friendly filament. Great print quality with minimal hassle.",
      difficulty: 'Easy',
      dbMaterials: getMaterialsInCategory('pla-family'),
    },
    'PETG': {
      score: 40, reasons: [],
      desc: "Strong, durable, and food-safe. A great step up from PLA for functional parts.",
      difficulty: 'Easy',
      dbMaterials: getMaterialsInCategory('petg-family'),
    },
    'TPU': {
      score: 20, reasons: [],
      desc: "Flexible, rubber-like material perfect for phone cases, gaskets, and wearables.",
      difficulty: 'Moderate',
      dbMaterials: getMaterialsInCategory('flexible'),
    },
    'ABS': {
      score: 30, reasons: [],
      desc: "Classic engineering plastic with excellent heat resistance and durability.",
      difficulty: 'Advanced',
      dbMaterials: getMaterialsInCategory('abs-family'),
    },
    'ASA': {
      score: 25, reasons: [],
      desc: "UV-stable alternative to ABS. Ideal for outdoor applications that need to last.",
      difficulty: 'Advanced',
      dbMaterials: getMaterialsInCategory('asa-family'),
    },
    'PLA+': {
      score: 45, reasons: [],
      desc: "Enhanced PLA with better strength and temperature resistance while staying easy to print.",
      difficulty: 'Easy',
      dbMaterials: ['PLA+', 'PLA+ 2.0', 'Standard PLA+'],
    },
  };

  // Use case scoring
  if (useCase === 'functional') {
    materials['PETG'].score += 25; materials['PETG'].reasons.push("Excellent strength for functional parts");
    materials['ABS'].score += 20; materials['ABS'].reasons.push("High durability for mechanical components");
    materials['PLA+'].score += 15; materials['PLA+'].reasons.push("Enhanced strength over standard PLA");
  } else if (useCase === 'art_display') {
    materials['PLA'].score += 30; materials['PLA'].reasons.push("Best surface finish for display pieces");
    materials['PLA+'].score += 20; materials['PLA+'].reasons.push("Great colors and print quality");
  } else if (useCase === 'prototypes') {
    materials['PLA'].score += 25; materials['PLA'].reasons.push("Fast, reliable prints for prototyping");
    materials['PLA+'].score += 20; materials['PLA+'].reasons.push("Quick iteration cycles");
  } else if (useCase === 'outdoor') {
    materials['ASA'].score += 35; materials['ASA'].reasons.push("UV-resistant for outdoor durability");
    materials['PETG'].score += 20; materials['PETG'].reasons.push("Weather-resistant option");
  } else if (useCase === 'household') {
    materials['PETG'].score += 20; materials['PETG'].reasons.push("Food-safe and durable for home use");
    materials['PLA'].score += 15; materials['PLA'].reasons.push("Easy prints for everyday items");
  }

  // Priority scoring
  if (priority === 'strength') {
    materials['PETG'].score += 20; materials['PETG'].reasons.push("High strength-to-ease ratio");
    materials['ABS'].score += 15; materials['ABS'].reasons.push("Excellent impact resistance");
  } else if (priority === 'appearance') {
    materials['PLA'].score += 25; materials['PLA'].reasons.push("Best surface quality and color options");
    materials['PLA+'].score += 15; materials['PLA+'].reasons.push("Great finish with added strength");
  } else if (priority === 'easy') {
    materials['PLA'].score += 30; materials['PLA'].reasons.push("Most forgiving material to print");
    materials['PLA+'].score += 25; materials['PLA+'].reasons.push("Easy printing with enhanced properties");
    materials['PETG'].score += 10; materials['PETG'].reasons.push("Relatively easy for engineering material");
  } else if (priority === 'price') {
    materials['PLA'].score += 20; materials['PLA'].reasons.push("Most affordable quality option");
    materials['PLA+'].score += 15; materials['PLA+'].reasons.push("Great value for enhanced properties");
  }

  // Budget scoring
  if (budget === 'budget') {
    materials['PLA'].score += 15;
    materials['PLA+'].score += 10;
  } else if (budget === 'premium' || budget === 'any') {
    materials['ASA'].score += 10;
    materials['ABS'].score += 10;
  }

  // Special requirements
  if (special.includes('food_safe')) {
    materials['PETG'].score += 25; materials['PETG'].reasons.push("FDA compliant for food contact");
  }
  if (special.includes('uv_resistant')) {
    materials['ASA'].score += 30; materials['ASA'].reasons.push("Excellent UV stability");
  }
  if (special.includes('flexible')) {
    materials['TPU'].score += 50; materials['TPU'].reasons.push("Flexible, rubber-like properties");
  }
  if (special.includes('high_temp')) {
    materials['ABS'].score += 25; materials['ABS'].reasons.push("High temperature resistance");
    materials['ASA'].score += 20; materials['ASA'].reasons.push("Excellent heat resistance");
  }

  // Printer compatibility
  if (printer === 'bambu' || printer === 'prusa') {
    materials['ABS'].score += 5;
    materials['ASA'].score += 5;
  } else if (printer === 'creality' || printer === 'other') {
    materials['PLA'].score += 10;
    materials['PETG'].score += 5;
  }

  // Sort and take top 3
  const sorted = Object.entries(materials)
    .sort(([, a], [, b]) => b.score - a.score)
    .slice(0, 3);

  const maxScore = sorted[0][1].score;

  return sorted.map(([name, data]) => ({
    material: name,
    score: data.score,
    matchPercent: Math.min(Math.round((data.score / maxScore) * 100), 98),
    reasons: data.reasons.length > 0 ? data.reasons : ["Good all-around choice for your needs"],
    desc: data.desc,
    difficulty: data.difficulty,
    dbMaterials: data.dbMaterials,
  }));
}

// ─── Regional URL Resolution ───────────────────────────────────────────────

const CURRENCY_TO_URL_KEY: Partial<Record<CurrencyCode, string>> = {
  CAD: 'product_url_ca',
  GBP: 'product_url_uk',
  EUR: 'product_url_eu',
  AUD: 'product_url_au',
  JPY: 'product_url_jp',
  CHF: 'product_url_eu',
  SEK: 'product_url_eu',
  NZD: 'product_url_au',
  PLN: 'product_url_eu',
  CZK: 'product_url_eu',
};

function getRegionalUrl(filament: Record<string, unknown>, currency: CurrencyCode): string | null {
  const urlKey = CURRENCY_TO_URL_KEY[currency];
  if (urlKey) {
    const regionalUrl = filament[urlKey] as string | null;
    if (regionalUrl) return regionalUrl;
  }
  return (filament.product_url as string | null) || null;
}

function getStoreName(url: string | null, vendor: string | null): string {
  if (!url) return vendor ? `${vendor} Store` : 'Store';
  if (url.toLowerCase().includes('amazon')) return 'Amazon';
  return vendor ? `${vendor} Store` : 'Store';
}

// ─── Budget Thresholds (USD) ────────────────────────────────────────────────

function getBudgetFilter(budget: string | undefined): { min?: number; max?: number } {
  switch (budget) {
    case 'budget': return { max: 20 };
    case 'mid': return { min: 15, max: 40 };
    case 'premium': return { min: 30 };
    default: return {};
  }
}

// ─── Verified Brands ────────────────────────────────────────────────────────

const VERIFIED_BRANDS = [
  'bambu lab', 'polymaker', 'esun', 'overture', 'prusament',
  'hatchbox', 'colorfabb', 'fillamentum', 'atomic filament',
  'protopasta', 'ninjatek', 'matterhackers', 'inland',
];

// ─── Main Hook ──────────────────────────────────────────────────────────────

// The select query columns (no diameter_mm - the actual column is diameter_nominal_mm)
const FILAMENT_SELECT = `
  id, product_title, vendor, material, color_hex, featured_image,
  variant_price, variant_compare_at_price, net_weight_g, pack_quantity,
  product_url, product_url_ca, product_url_uk, product_url_eu, product_url_au, product_url_jp,
  amazon_link_us,
  price_cad, price_eur, price_gbp, price_aud, price_jpy,
  product_line_id, product_handle, color_family,
  nozzle_temp_min_c, nozzle_temp_max_c, bed_temp_min_c, bed_temp_max_c,
  diameter_nominal_mm, density_g_cm3, net_weight_g,
  tds_url, tensile_strength_xy_mpa, flexural_strength_mpa, elongation_break_xy_percent,
  high_speed_capable, finish_type, is_nozzle_abrasive
`;

export function useWizardRecommendations(answers: WizardAnswers) {
  const { currency, convertPrice, hasRates, formatPrice } = useRegion();
  const { getAffiliateUrl } = useAffiliateLinks();

  // 1. Score materials from wizard answers (stable memo)
  const topMaterials = useMemo(
    () => scoreMaterials(answers),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [answers.use_case, answers.printer, answers.priority, answers.budget, JSON.stringify(answers.special)]
  );

  // 2. Collect all DB material names to query
  const allDbMaterials = useMemo(() => {
    const all = new Set<string>();
    topMaterials.forEach(m => m.dbMaterials.forEach(dm => all.add(dm)));
    return Array.from(all);
  }, [topMaterials]);

  // 3. Budget filter
  const budgetFilter = useMemo(() => getBudgetFilter(answers.budget as string), [answers.budget]);

  // 4. Printer filter (exclude abrasive for basic printers)
  const excludeAbrasive = answers.printer === 'creality' || answers.printer === 'other';

  // 5. DB query
  const { data: rawFilaments, isLoading: isQueryLoading, error } = useQuery({
    queryKey: ['wizard-recommendations', allDbMaterials, budgetFilter, excludeAbrasive],
    queryFn: async () => {
      let query = supabase
        .from('filaments')
        .select(FILAMENT_SELECT)
        .in('material', allDbMaterials)
        .eq('variant_available', true)
        .gte('net_weight_g', 300);

      if (budgetFilter.max) {
        query = query.lte('variant_price', budgetFilter.max);
      }
      if (budgetFilter.min) {
        query = query.gte('variant_price', budgetFilter.min);
      }
      if (excludeAbrasive) {
        query = query.neq('is_nozzle_abrasive', true);
      }

      query = query.order('variant_price', { ascending: true, nullsFirst: false }).limit(60);

      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    },
    staleTime: 5 * 60 * 1000,
    enabled: allDbMaterials.length > 0,
  });

  // 6. Process results into WizardMaterialResult[]
  const results: WizardMaterialResult[] = useMemo(() => {
    if (!rawFilaments || !hasRates) return [];

    const priceContext = {
      userCurrency: currency,
      convertFromCurrency: convertPrice,
      hasRates,
    };

    return topMaterials.map((mat) => {
      // Filter filaments belonging to this material group
      const groupFilaments = rawFilaments.filter((f: any) =>
        mat.dbMaterials.includes(f.material || '')
      );

      // Resolve prices & compute scores, rank
      const scored = groupFilaments.map((f: any) => {
        const resolved = resolveFilamentPrice(f as FilamentForPricing, priceContext);
        const scoreResult = calculateUnifiedScore(f as FilamentForScoring);

        // Relevance ranking
        let relevance = 0;
        if (resolved.source === 'regional') relevance += 30;
        else if (resolved.source === 'converted') relevance += 15;

        const vendorLower = (f.vendor || '').toLowerCase();
        if (VERIFIED_BRANDS.some(b => vendorLower.includes(b))) relevance += 25;
        else relevance += 10;

        if (f.featured_image) relevance += 20;

        const regionalUrl = getRegionalUrl(f as Record<string, unknown>, currency);
        if (regionalUrl && regionalUrl !== f.product_url) relevance += 15;
        else if (regionalUrl) relevance += 8;

        if (scoreResult.score && scoreResult.score >= 6) relevance += 10;

        return { filament: f, resolved, scoreResult, relevance };
      });

      // Deduplicate by product_line_id (keep best per product line)
      const deduped = new Map<string, (typeof scored)[0]>();
      for (const item of scored.sort((a, b) => b.relevance - a.relevance)) {
        const key = item.filament.product_line_id || item.filament.id;
        if (!deduped.has(key)) {
          deduped.set(key, item);
        }
      }

      // Take top 5
      const top5 = Array.from(deduped.values()).slice(0, 5);

      // Compute price range from resolved prices
      const prices = top5
        .map(t => t.resolved.spoolPrice)
        .filter((p): p is number => p != null && p > 0);
      const priceRange = prices.length > 0
        ? { min: Math.min(...prices), max: Math.max(...prices) }
        : null;

      const formattedPriceRange = priceRange
        ? `${formatPrice(priceRange.min)} – ${formatPrice(priceRange.max)}`
        : 'Price unavailable';

      // Build product cards
      const products: WizardProduct[] = top5.map(({ filament: f, resolved, scoreResult }) => {
        const slug = generateFilamentSlug(f.vendor, f.material, f.product_title, f.color_family);
        const regionalUrl = getRegionalUrl(f as Record<string, unknown>, currency);
        const affiliateUrl = getAffiliateUrl(regionalUrl, f.vendor);
        const storeName = getStoreName(regionalUrl, f.vendor);

        return {
          id: f.id,
          productTitle: cleanFilamentDisplayName(f.product_title || ''),
          vendor: f.vendor || 'Unknown',
          material: f.material || '',
          featuredImage: f.featured_image || null,
          colorHex: f.color_hex || null,
          formattedPrice: resolved.spoolPrice != null
            ? formatPrice(resolved.spoolPrice, { showApproximate: resolved.isConverted })
            : null,
          formattedPricePerKg: resolved.pricePerKg != null
            ? formatPrice(resolved.pricePerKg, { showApproximate: resolved.isConverted })
            : null,
          isConverted: resolved.isConverted,
          score: scoreResult.score,
          scoreColor: getScoreNumberColor(scoreResult.score),
          detailUrl: `/filament/${slug}`,
          buyUrl: affiliateUrl || null,
          buyStoreName: affiliateUrl ? storeName : null,
        };
      });

      return {
        material: mat.material,
        matchPercent: mat.matchPercent,
        description: mat.desc,
        whyRecommended: mat.reasons,
        difficulty: mat.difficulty,
        priceRange,
        formattedPriceRange,
        products,
        finderUrl: `/finder?material=${encodeURIComponent(mat.material)}`,
      };
    });
  }, [rawFilaments, hasRates, currency, convertPrice, formatPrice, topMaterials, getAffiliateUrl]);

  const isLoading = isQueryLoading || !hasRates;

  return { results, isLoading, error };
}
