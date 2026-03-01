import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from '@/hooks/use-toast';

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
}

interface RunOptions {
  dryRun: boolean;
  brandFilter?: string;
}

export function useTdMatching() {
  const qc = useQueryClient();
  const [matches, setMatches] = useState<TdMatchResult[]>([]);
  const [unmatchedRefs, setUnmatchedRefs] = useState<UnmatchedRef[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [isApplying, setIsApplying] = useState(false);
  const [progress, setProgress] = useState<MatchProgress>({ current: 0, total: 0, phase: '' });
  const [stats, setStats] = useState<MatchStats>({ total: 0, matched: 0, applied: 0, skipped: 0, errors: 0 });

  const runMatching = useCallback(async ({ dryRun, brandFilter }: RunOptions) => {
    setIsRunning(true);
    setMatches([]);
    setUnmatchedRefs([]);
    setStats({ total: 0, matched: 0, applied: 0, skipped: 0, errors: 0 });

    try {
      // 1. Fetch reference values
      setProgress({ current: 0, total: 0, phase: 'Loading reference values...' });
      let refQuery = supabase.from('td_reference_values').select('*');
      if (brandFilter && brandFilter !== 'all') {
        refQuery = refQuery.ilike('brand_name', `%${brandFilter}%`);
      }
      const { data: refs, error: refErr } = await refQuery;
      if (refErr) throw refErr;
      if (!refs?.length) {
        toast({ title: 'No reference values found' });
        setIsRunning(false);
        return;
      }

      const total = refs.length;
      const allMatches: TdMatchResult[] = [];
      const unmatched: UnmatchedRef[] = [];

      // 2. Process each reference value
      for (let i = 0; i < total; i++) {
        const ref = refs[i];
        setProgress({ current: i + 1, total, phase: `Matching ${ref.brand_name} ${ref.color_name}...` });

        // Build query for matching filaments
        const materialType = ref.material_type as string;
        const brandName = ref.brand_name as string;
        const colorName = ref.color_name as string;
        const isSimpleMaterial = !materialType.includes(' ') && !materialType.includes('+');

        let query = supabase
          .from('filaments')
          .select('id, vendor, product_title, color_family, material, transmission_distance')
          .ilike('vendor', `%${brandName}%`)
          .is('transmission_distance', null);

        // For product-line materials (e.g. "PLA Basic", "PolyTerra PLA"), match in product_title
        // For simple materials (e.g. "PLA"), also try material column
        if (!isSimpleMaterial) {
          query = query.ilike('product_title', `%${materialType}%`);
        }

        const { data: filaments, error: filErr } = await query;
        if (filErr) {
          console.error('Query error for ref:', ref, filErr);
          continue;
        }

        let foundMatch = false;
        for (const fil of filaments ?? []) {
          const filColor = (fil.color_family ?? '').toLowerCase();
          const refColor = colorName.toLowerCase();

          // Color matching: require exact match for color_family
          // For multi-word ref colors, match exactly — don't partial match just the last word
          const colorMatch = filColor === refColor;
          if (!colorMatch) continue;

          // Material matching & confidence
          const titleLower = (fil.product_title ?? '').toLowerCase();
          const materialLower = materialType.toLowerCase();
          const titleContainsMaterial = titleLower.includes(materialLower);
          const baseMaterialMatch = isSimpleMaterial && (fil.material ?? '').toLowerCase() === materialLower;

          if (!titleContainsMaterial && !baseMaterialMatch) continue;

          const confidence: 'high' | 'medium' | 'low' = titleContainsMaterial ? 'high' : 'medium';
          const matchReason = titleContainsMaterial
            ? `product_title contains "${materialType}", exact color match`
            : `base material "${fil.material}" matches, exact color match`;

          allMatches.push({
            filamentId: fil.id,
            vendor: fil.vendor ?? '',
            productTitle: fil.product_title ?? '',
            colorFamily: fil.color_family ?? '',
            material: fil.material ?? '',
            refBrand: brandName,
            refColor: colorName,
            refMaterial: materialType,
            tdValue: Number(ref.td_value),
            confidence,
            matchReason,
            previousTd: fil.transmission_distance ?? null,
          });
          foundMatch = true;
        }

        if (!foundMatch) {
          unmatched.push({
            brand_name: brandName,
            material_type: materialType,
            color_name: colorName,
            td_value: Number(ref.td_value),
          });
        }

        // Yield to UI every 5 refs
        if (i % 5 === 0) await new Promise(r => setTimeout(r, 0));
      }

      setMatches(allMatches);
      setUnmatchedRefs(unmatched);
      setStats(s => ({ ...s, total: total, matched: allMatches.length }));
      setProgress({ current: total, total, phase: `Found ${allMatches.length} matches` });

      toast({
        title: `Matching complete`,
        description: `${allMatches.length} matches found, ${unmatched.length} refs unmatched`,
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
      // Process in batches of 10
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
              .update({ transmission_distance: match.tdValue })
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
              }),
            });

            applied++;
          } catch (e: any) {
            console.error('Apply error:', e);
            errors++;
          }
        }
        // Yield between batches
        await new Promise(r => setTimeout(r, 0));
      }

      setStats(s => ({ ...s, applied, errors }));
      setProgress({ current: toApply.length, total: toApply.length, phase: `Applied ${applied} TD values` });

      // Remove applied matches from the list
      const appliedIds = new Set(toApply.map(m => m.filamentId));
      setMatches(prev => prev.filter(m => !appliedIds.has(m.filamentId)));

      // Invalidate caches
      qc.invalidateQueries({ queryKey: ['td-stats'] });
      qc.invalidateQueries({ queryKey: ['td-filaments'] });
      qc.invalidateQueries({ queryKey: ['td-population-log'] });

      toast({ title: `Applied ${applied} TD values`, description: errors ? `${errors} errors` : undefined });
    } catch (err: any) {
      toast({ title: 'Apply failed', description: err.message, variant: 'destructive' });
    } finally {
      setIsApplying(false);
    }
  }, [qc]);

  return { matches, unmatchedRefs, isRunning, isApplying, progress, stats, runMatching, applyMatches };
}
