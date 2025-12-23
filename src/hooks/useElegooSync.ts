import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface ProductFields {
  tds: boolean;
  image: boolean;
  price: boolean;
  salePrice: boolean;
  url: boolean;
}

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
    fields: ProductFields;
  }[];
}

export type { ElegooSyncResult, ProductFields };

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

  const fetchCatalog = async (materialFilter?: string, page = 1, catalogId?: string) => {
    setIsLoading(true);
    setError(null);

    try {
      const { data, error: fnError } = await supabase.functions.invoke('fetch-elegoo-catalog', {
        body: { materialFilter, page, pageSize: 50, catalogId },
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

  const discoverCatalogs = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const { data, error: fnError } = await supabase.functions.invoke('list-impact-catalogs', {
        body: {},
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
    discoverCatalogs,
    isLoading,
    result,
    error,
    reset,
  };
}
