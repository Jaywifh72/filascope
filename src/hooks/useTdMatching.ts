import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from '@/hooks/use-toast';
import {
  normalizeColor, stripTrademark, extractColorFromTitle,
  materialsMatch, sameMaterialFamily, extractBaseMaterial,
  extractProductLine, fuzzyColorMatch, hexDistance,
} from '@/lib/tdMatchingUtils';

export interface TdMatchResult {
  filamentId: string;
  vendor: string;
  productTitle: string;
  colorFamily: string;
  material: string;
  refBrand: string;
  refColor: string;
  refMaterial: string;
  tdValue: number;
  confidence: 'high' | 'medium' | 'low';
  matchReason: string;
  matchRule: number;
  previousTd: number | null;
}

interface UnmatchedRef {
  brand_name: string;
  material_type: string;
  color_name: string;
  td_value: number;
}

interface MatchProgress {
  current: number;
  total: number;
  phase: string;
}

interface MatchStats {
  total: number;
  matched: number;
  applied: number;
  skipped: number;
  errors: number;
  highCount: number;
  mediumCount: number;
  lowCount: number;
}

interface RunOptions {
  dryRun: boolean;
  brandFilter?: string;
}

// ─── Types for internal processing ───────────────────────────────────

interface RefValue {
  brand_name: string;
  color_name: string;
  material_type: string;
  td_value: number;
  color_hex: string | null;
  normalizedColor: string;
  productLine: string | null;
  baseMaterial: string;
}

interface FilamentCandidate {
  id: string;
  vendor: string;
  product_title: string;
  color_family: string | null;
  material: string | null;
  color_hex: string | null;
  transmission_distance: number | null;
  extractedColor: string | null;
  normalizedColor: string;
  cleanTitle: string;
}

// ─── Core matching engine ────────────────────────────────────────────

function tryMatch(
  fil: FilamentCandidate,
  refs: RefValue[],
): TdMatchResult | null {
  const filVendor = fil.vendor.toLowerCase();
  const filMaterial = (fil.material ?? '').toLowerCase().trim();

  // Filter refs to same brand first
  const brandRefs = refs.filter(r => r.brand_name.toLowerCase() === filVendor);
  if (brandRefs.length === 0) return null;

  let bestMatch: TdMatchResult | null = null;
  let bestPriority = 99;

  for (const ref of brandRefs) {
    const refNormColor = ref.normalizedColor;
    const filNormColor = fil.normalizedColor;

    // ── Rule 1: Exact Brand + Color + Material (high) ──
    if (bestPriority > 1) {
      const colorExact = filNormColor === refNormColor;
      const materialOk = materialsMatch(filMaterial, ref.baseMaterial) ||
        materialsMatch(filMaterial, ref.material_type);
      if (colorExact && materialOk) {
        bestMatch = buildResult(fil, ref, 'high', 1,
          `R1: exact brand+color+material`);
        bestPriority = 1;
        continue;
      }
    }

    // ── Rule 2: Product Line Match (high) ──
    if (bestPriority > 2 && ref.productLine) {
      const plLower = ref.productLine.toLowerCase();
      const titleHasProductLine = fil.cleanTitle.toLowerCase().includes(plLower);
      if (titleHasProductLine) {
        const colorOk = filNormColor === refNormColor ||
          fil.cleanTitle.toLowerCase().includes(refNormColor);
        const baseMat = ref.baseMaterial.toLowerCase();
        const matOk = filMaterial.includes(baseMat) ||
          fil.cleanTitle.toLowerCase().includes(baseMat);
        if (colorOk && matOk) {
          bestMatch = buildResult(fil, ref, 'high', 2,
            `R2: product line "${ref.productLine}" + color match`);
          bestPriority = 2;
          continue;
        }
      }
    }

    // ── Rule 3: Fuzzy Color Match (medium) ──
    if (bestPriority > 3) {
      const materialOk = materialsMatch(filMaterial, ref.baseMaterial) ||
        materialsMatch(filMaterial, ref.material_type);
      if (materialOk && filNormColor && refNormColor) {
        const fuzzy = fuzzyColorMatch(filNormColor, refNormColor);
        if (fuzzy && filNormColor !== refNormColor) {
          bestMatch = buildResult(fil, ref, 'medium', 3,
            `R3: fuzzy color "${fil.extractedColor ?? fil.color_family}" ≈ "${ref.color_name}"`);
          bestPriority = 3;
          continue;
        }
      }
    }

    // ── Rule 4: Hex Code Proximity (low) ──
    if (bestPriority > 4 && ref.color_hex && fil.color_hex) {
      const materialOk = materialsMatch(filMaterial, ref.baseMaterial) ||
        materialsMatch(filMaterial, ref.material_type);
      if (materialOk) {
        const dist = hexDistance(ref.color_hex, fil.color_hex);
        if (dist < 30) {
          bestMatch = buildResult(fil, ref, 'low', 4,
            `R4: hex proximity (dist=${Math.round(dist)}) ${ref.color_hex}≈${fil.color_hex}`);
          bestPriority = 4;
          continue;
        }
      }
    }

    // ── Rule 5: Material Family Fallback (low) ──
    if (bestPriority > 5) {
      const colorExact = filNormColor === refNormColor;
      if (colorExact && sameMaterialFamily(filMaterial, ref.baseMaterial) &&
          filMaterial !== ref.baseMaterial.toLowerCase()) {
        bestMatch = buildResult(fil, ref, 'low', 5,
          `R5: material family fallback "${filMaterial}" ← "${ref.baseMaterial}" TD`);
        bestPriority = 5;
        continue;
      }
    }
  }

  return bestMatch;
}

function buildResult(
  fil: FilamentCandidate, ref: RefValue,
  confidence: 'high' | 'medium' | 'low', rule: number, reason: string,
): TdMatchResult {
  return {
    filamentId: fil.id,
    vendor: fil.vendor,
    productTitle: fil.product_title,
    colorFamily: fil.extractedColor ?? fil.color_family ?? '',
    material: fil.material ?? '',
    refBrand: ref.brand_name,
    refColor: ref.color_name,
    refMaterial: ref.material_type,
    tdValue: ref.td_value,
    confidence,
    matchRule: rule,
    matchReason: reason,
    previousTd: fil.transmission_distance ?? null,
  };
}

// ─── Hook ────────────────────────────────────────────────────────────

export function useTdMatching() {
  const qc = useQueryClient();
  const [matches, setMatches] = useState<TdMatchResult[]>([]);
  const [unmatchedRefs, setUnmatchedRefs] = useState<UnmatchedRef[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [isApplying, setIsApplying] = useState(false);
  const [progress, setProgress] = useState<MatchProgress>({ current: 0, total: 0, phase: '' });
  const [stats, setStats] = useState<MatchStats>({
    total: 0, matched: 0, applied: 0, skipped: 0, errors: 0,
    highCount: 0, mediumCount: 0, lowCount: 0,
  });

  const runMatching = useCallback(async ({ dryRun, brandFilter }: RunOptions) => {
    setIsRunning(true);
    setMatches([]);
    setUnmatchedRefs([]);
    setStats({ total: 0, matched: 0, applied: 0, skipped: 0, errors: 0, highCount: 0, mediumCount: 0, lowCount: 0 });

    try {
      // ─── 1. Load all reference values ───
      setProgress({ current: 0, total: 0, phase: 'Loading reference values...' });
      let refQuery = supabase.from('td_reference_values').select('*');
      if (brandFilter && brandFilter !== 'all') {
        refQuery = refQuery.ilike('brand_name', brandFilter);
      }
      const { data: rawRefs, error: refErr } = await refQuery;
      if (refErr) throw refErr;
      if (!rawRefs?.length) {
        toast({ title: 'No reference values found' });
        setIsRunning(false);
        return;
      }

      // Pre-process references
      const refs: RefValue[] = rawRefs.map(r => ({
        brand_name: r.brand_name as string,
        color_name: r.color_name as string,
        material_type: r.material_type as string,
        td_value: Number(r.td_value),
        color_hex: (r as any).color_hex ?? null,
        normalizedColor: normalizeColor(r.color_name as string),
        productLine: extractProductLine(r.material_type as string),
        baseMaterial: extractBaseMaterial(r.material_type as string),
      }));

      // ─── 2. Load all filaments missing TD (paginated) ───
      setProgress({ current: 0, total: 0, phase: 'Loading filaments...' });
      const allFilaments: FilamentCandidate[] = [];
      const PAGE_SIZE = 1000;
      let page = 0;
      let hasMore = true;

      while (hasMore) {
        let q = supabase
          .from('filaments')
          .select('id, vendor, product_title, color_family, material, color_hex, transmission_distance')
          .is('transmission_distance', null)
          .range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1);

        if (brandFilter && brandFilter !== 'all') {
          q = q.ilike('vendor', brandFilter);
        }

        const { data, error } = await q;
        if (error) throw error;

        if (data) {
          for (const f of data) {
            const extractedColor = f.color_family ? null : extractColorFromTitle(f.product_title ?? '');
            const colorSource = f.color_family ?? extractedColor ?? '';
            allFilaments.push({
              id: f.id,
              vendor: f.vendor ?? '',
              product_title: f.product_title ?? '',
              color_family: f.color_family,
              material: f.material,
              color_hex: f.color_hex ?? null,
              transmission_distance: f.transmission_distance,
              extractedColor,
              normalizedColor: normalizeColor(colorSource),
              cleanTitle: stripTrademark(f.product_title ?? ''),
            });
          }
        }

        hasMore = (data?.length ?? 0) === PAGE_SIZE;
        page++;
        setProgress({ current: allFilaments.length, total: 0, phase: `Loaded ${allFilaments.length} filaments...` });
      }

      if (allFilaments.length === 0) {
        toast({ title: 'No filaments missing TD values' });
        setIsRunning(false);
        return;
      }

      // ─── 3. Run matching engine ───
      const totalFil = allFilaments.length;
      const allMatches: TdMatchResult[] = [];
      const matchedRefKeys = new Set<string>();

      for (let i = 0; i < totalFil; i++) {
        if (i % 100 === 0) {
          setProgress({ current: i, total: totalFil, phase: `Matching ${i}/${totalFil} filaments...` });
          await new Promise(r => setTimeout(r, 0));
        }

        const result = tryMatch(allFilaments[i], refs);
        if (result) {
          allMatches.push(result);
          matchedRefKeys.add(`${result.refBrand}|${result.refMaterial}|${result.refColor}`.toLowerCase());
        }
      }

      // ─── 4. Find unmatched refs ───
      const unmatched: UnmatchedRef[] = [];
      for (const ref of refs) {
        const key = `${ref.brand_name}|${ref.material_type}|${ref.color_name}`.toLowerCase();
        if (!matchedRefKeys.has(key)) {
          unmatched.push({
            brand_name: ref.brand_name,
            material_type: ref.material_type,
            color_name: ref.color_name,
            td_value: ref.td_value,
          });
        }
      }

      const highCount = allMatches.filter(m => m.confidence === 'high').length;
      const mediumCount = allMatches.filter(m => m.confidence === 'medium').length;
      const lowCount = allMatches.filter(m => m.confidence === 'low').length;

      setMatches(allMatches);
      setUnmatchedRefs(unmatched);
      setStats(s => ({ ...s, total: totalFil, matched: allMatches.length, highCount, mediumCount, lowCount }));
      setProgress({ current: totalFil, total: totalFil, phase: `Found ${allMatches.length} matches` });

      toast({
        title: 'Matching complete',
        description: `${highCount} high, ${mediumCount} medium, ${lowCount} low — ${unmatched.length} refs unmatched`,
      });
    } catch (err: any) {
      console.error('Matching error:', err);
      toast({ title: 'Matching failed', description: err.message, variant: 'destructive' });
    } finally {
      setIsRunning(false);
    }
  }, []);

  const applyMatches = useCallback(async (toApply: TdMatchResult[]) => {
    setIsApplying(true);
    let applied = 0;
    let errors = 0;

    try {
      for (let i = 0; i < toApply.length; i += 10) {
        const batch = toApply.slice(i, i + 10);
        setProgress({
          current: i,
          total: toApply.length,
          phase: `Applying ${i + 1}-${Math.min(i + 10, toApply.length)} of ${toApply.length}...`,
        });

        for (const match of batch) {
          try {
            const { error: updErr } = await supabase
              .from('filaments')
              .update({
                transmission_distance: match.tdValue,
                td_confidence: match.confidence,
                td_source: 'reference_match',
                td_matched_at: new Date().toISOString(),
              } as any)
              .eq('id', match.filamentId);
            if (updErr) throw updErr;

            await supabase.from('td_population_log').insert({
              filament_id: match.filamentId,
              td_value: match.tdValue,
              previous_value: match.previousTd,
              source: 'reference_match',
              confidence: match.confidence,
              status: 'applied',
              notes: JSON.stringify({
                refBrand: match.refBrand,
                refColor: match.refColor,
                refMaterial: match.refMaterial,
                matchReason: match.matchReason,
                matchRule: match.matchRule,
              }),
            });
            applied++;
          } catch (e: any) {
            console.error('Apply error:', e);
            errors++;
          }
        }
        await new Promise(r => setTimeout(r, 0));
      }

      setStats(s => ({ ...s, applied, errors }));
      setProgress({ current: toApply.length, total: toApply.length, phase: `Applied ${applied} TD values` });

      const appliedIds = new Set(toApply.map(m => m.filamentId));
      setMatches(prev => prev.filter(m => !appliedIds.has(m.filamentId)));

      qc.invalidateQueries({ queryKey: ['td-stats'] });
      qc.invalidateQueries({ queryKey: ['td-filaments'] });
      qc.invalidateQueries({ queryKey: ['td-population-log'] });
      qc.invalidateQueries({ queryKey: ['td-reference-match-stats'] });

      toast({ title: `✅ Matching complete: ${applied} filaments updated`, description: errors ? `${errors} errors` : undefined });
    } catch (err: any) {
      toast({ title: 'Apply failed', description: err.message, variant: 'destructive' });
    } finally {
      setIsApplying(false);
    }
  }, [qc]);

  return { matches, unmatchedRefs, isRunning, isApplying, progress, stats, runMatching, applyMatches };
}
