import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface ElegooSyncResult {
  success: boolean;
  dryRun: boolean;
  jobId: string | null;
  summary: {
    created: number;
    updated: number;
    skipped: number;
    errors: number;
    total: number;
  };
  products: {
    title: string;
    action: 'created' | 'updated' | 'skipped' | 'error';
    reason?: string;
  }[];
}

export function useElegooSync() {
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<ElegooSyncResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const syncProducts = async (dryRun: boolean, materialFilter?: string) => {
    setIsLoading(true);
    setError(null);
    setResult(null);

    try {
      const { data, error: fnError } = await supabase.functions.invoke('sync-elegoo-products', {
        body: { dryRun, materialFilter },
      });

      if (fnError) {
        throw new Error(fnError.message);
      }

      if (data.error) {
        throw new Error(data.error);
      }

      setResult(data as ElegooSyncResult);
      return data as ElegooSyncResult;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      setError(message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const fetchCatalog = async (materialFilter?: string, page = 1) => {
    setIsLoading(true);
    setError(null);

    try {
      const { data, error: fnError } = await supabase.functions.invoke('fetch-elegoo-catalog', {
        body: { materialFilter, page, pageSize: 50 },
      });

      if (fnError) {
        throw new Error(fnError.message);
      }

      if (data.error) {
        throw new Error(data.error);
      }

      return data;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      setError(message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const reset = () => {
    setResult(null);
    setError(null);
  };

  return {
    syncProducts,
    fetchCatalog,
    isLoading,
    result,
    error,
    reset,
  };
}
