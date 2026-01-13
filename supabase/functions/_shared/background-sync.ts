/**
 * Background Sync Utilities
 * 
 * Provides patterns for running sync operations in the background
 * while returning job IDs immediately to prevent client timeouts.
 * 
 * HTTP requests time out after ~60s, but EdgeRuntime.waitUntil()
 * allows functions to run for up to 150s in the background.
 */

declare const EdgeRuntime: {
  waitUntil: (promise: Promise<unknown>) => void;
};

export const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

export interface SyncLogEntry {
  id: string;
  brand_slug: string;
  sync_type: string;
  status: string;
  triggered_by: string;
  triggered_by_user?: string;
}

export interface SyncProgress {
  stage: string;
  current: number;
  total: number;
  message?: string;
  productsProcessed?: number;
  variantsFound?: number;
  created?: number;
  updated?: number;
  errors?: number;
}

/**
 * Create a sync log entry in brand_sync_logs table
 */
export async function createSyncLog(
  supabase: any,
  brandSlug: string,
  syncType: 'clean_slate' | 'incremental',
  userId?: string
): Promise<{ syncLogId: string | null; error: Error | null }> {
  try {
    const { data, error } = await supabase
      .from('brand_sync_logs')
      .insert({
        brand_slug: brandSlug,
        sync_type: syncType,
        status: 'running',
        triggered_by: 'admin',
        triggered_by_user: userId,
      })
      .select('id')
      .single();

    if (error) {
      console.error(`[${brandSlug}] Failed to create sync log:`, error.message);
      return { syncLogId: null, error: new Error(error.message) };
    }

    return { syncLogId: data.id, error: null };
  } catch (err) {
    console.error(`[${brandSlug}] Sync log creation error:`, err);
    return { syncLogId: null, error: err instanceof Error ? err : new Error('Unknown error') };
  }
}

/**
 * Update sync progress in brand_sync_logs
 */
export async function updateSyncProgress(
  supabase: any,
  syncLogId: string,
  progress: SyncProgress
): Promise<void> {
  try {
    await supabase
      .from('brand_sync_logs')
      .update({ products_processed: progress })
      .eq('id', syncLogId);
  } catch (err) {
    console.error(`[updateSyncProgress] Error:`, err);
  }
}

/**
 * Complete a sync log with final status
 */
export async function completeSyncLog(
  supabase: any,
  syncLogId: string,
  stats: {
    status: 'completed' | 'failed' | 'partial';
    created: number;
    updated: number;
    discovered: number;
    failed: number;
    durationSeconds: number;
    errorDetails?: any;
    successDetails?: any;
    notes?: string;
  }
): Promise<void> {
  try {
    await supabase
      .from('brand_sync_logs')
      .update({
        status: stats.status,
        completed_at: new Date().toISOString(),
        duration_seconds: stats.durationSeconds,
        products_created: stats.created,
        products_updated: stats.updated,
        products_discovered: stats.discovered,
        products_failed: stats.failed,
        error_details: stats.errorDetails,
        success_details: stats.successDetails,
        notes: stats.notes,
      })
      .eq('id', syncLogId);
  } catch (err) {
    console.error(`[completeSyncLog] Error:`, err);
  }
}

/**
 * Create an immediate response with sync job ID
 */
export function createImmediateResponse(
  brandName: string,
  syncLogId: string | null,
  options: { dryRun?: boolean; cleanSlate?: boolean }
): Response {
  return new Response(JSON.stringify({
    success: true,
    message: `${brandName} sync started in background`,
    syncLogId,
    checkStatus: 'Check brand_sync_logs table for progress',
    dryRun: options.dryRun || false,
    cleanSlate: options.cleanSlate || false,
  }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

/**
 * Run a sync function in the background using EdgeRuntime.waitUntil
 */
export function runInBackground(syncPromise: Promise<void>, brandSlug: string): void {
  if (typeof EdgeRuntime !== 'undefined' && EdgeRuntime.waitUntil) {
    EdgeRuntime.waitUntil(syncPromise);
  } else {
    // Fallback: don't await, just start the promise
    syncPromise.catch(err => 
      console.error(`[${brandSlug}] Background sync error:`, err)
    );
  }
}

/**
 * Validate admin authentication for sync functions
 */
export async function validateAdminAuth(
  req: Request,
  supabase: any,
  anonKey: string,
  supabaseUrl: string
): Promise<{ userId: string | null; error: Response | null }> {
  const authHeader = req.headers.get('Authorization');
  if (!authHeader) {
    return {
      userId: null,
      error: new Response(JSON.stringify({ error: 'Authorization required' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }),
    };
  }

  const { createClient } = await import('https://esm.sh/@supabase/supabase-js@2');
  const authClient = createClient(supabaseUrl, anonKey, {
    global: { headers: { Authorization: authHeader } },
  });

  const { data: { user }, error: userError } = await authClient.auth.getUser();
  if (userError || !user) {
    return {
      userId: null,
      error: new Response(JSON.stringify({ error: 'Invalid authentication' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }),
    };
  }

  const { data: isAdmin } = await supabase.rpc('has_role', {
    _user_id: user.id,
    _role: 'admin',
  });

  if (!isAdmin) {
    return {
      userId: null,
      error: new Response(JSON.stringify({ error: 'Admin role required' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }),
    };
  }

  return { userId: user.id, error: null };
}

/**
 * Create a progress update helper function
 */
export function createProgressUpdater(
  supabase: any,
  syncLogId: string | undefined,
  getStats: () => { productsProcessed: number; variantsFound: number; created: number; updated: number; errors: number }
) {
  return async (stage: string, current: number, total: number, message?: string) => {
    if (!syncLogId) return;
    const stats = getStats();
    await updateSyncProgress(supabase, syncLogId, {
      stage,
      current,
      total,
      message,
      ...stats,
    });
  };
}
