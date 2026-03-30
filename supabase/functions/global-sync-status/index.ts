/**
 * GLOBAL SYNC STATUS
 *
 * Returns real-time status of the global brand sync, plus run history.
 *
 * GET  /global-sync-status          → current status + last result
 * GET  /global-sync-status?history=1 → last 10 runs
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  const supabase = createClient(supabaseUrl, supabaseKey);

  const url = new URL(req.url);
  const wantHistory = url.searchParams.get('history') === '1';

  try {
    if (wantHistory) {
      // Return last 10 runs
      const { data, error } = await supabase
        .from('global_sync_runs')
        .select('id, started_at, completed_at, status, mode, scope, result, error')
        .order('started_at', { ascending: false })
        .limit(10);

      if (error) throw error;

      return new Response(
        JSON.stringify({ history: data || [] }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 },
      );
    }

    // Current status: find in-progress run or last completed
    const { data: running, error: runErr } = await supabase
      .from('global_sync_runs')
      .select('id, started_at, status, mode, scope, current_brand, current_phase, progress_done, progress_total')
      .eq('status', 'running')
      .order('started_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (runErr) throw runErr;

    const { data: lastRun, error: lastErr } = await supabase
      .from('global_sync_runs')
      .select('id, started_at, completed_at, status, mode, scope, result, error')
      .in('status', ['completed', 'failed'])
      .order('completed_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (lastErr) throw lastErr;

    const status = {
      isRunning: !!running,
      startedAt: running?.started_at || null,
      currentBrand: running?.current_brand || null,
      currentPhase: running?.current_phase || null,
      progress: {
        done: running?.progress_done || 0,
        total: running?.progress_total || 0,
      },
      lastResult: lastRun?.result || null,
      lastRunAt: lastRun?.completed_at || null,
      lastRunStatus: lastRun?.status || null,
      lastRunError: lastRun?.error || null,
    };

    return new Response(
      JSON.stringify(status),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 },
    );

  } catch (err) {
    const error = err instanceof Error ? err.message : String(err);
    return new Response(
      JSON.stringify({ error }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 },
    );
  }
});
