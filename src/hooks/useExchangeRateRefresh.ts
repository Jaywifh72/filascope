import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useQueryClient } from '@tanstack/react-query';

interface RefreshResult {
  success: boolean;
  updated_currencies?: string[];
  new_table_updated_count?: number;
  legacy_updated_count?: number;
  duration_ms?: number;
  error?: string;
}

export function useExchangeRateRefresh() {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const refreshRates = async (): Promise<RefreshResult> => {
    if (isRefreshing) return { success: false, error: 'Already refreshing' };

    setIsRefreshing(true);

    try {
      const { data, error } = await supabase.functions.invoke('update-exchange-rates');

      if (error) {
        throw new Error(error.message || 'Failed to invoke edge function');
      }

      if (!data.success) {
        throw new Error(data.error || 'Edge function returned failure');
      }

      // Invalidate exchange rates queries
      queryClient.invalidateQueries({ queryKey: ['admin-exchange-rates'] });
      queryClient.invalidateQueries({ queryKey: ['exchange-rates'] });
      queryClient.invalidateQueries({ queryKey: ['exchange-rate-status'] });

      toast({
        title: 'Exchange rates updated',
        description: `Updated ${data.new_table_updated_count} currencies in ${data.duration_ms}ms`,
      });

      return {
        success: true,
        updated_currencies: data.updated_currencies,
        new_table_updated_count: data.new_table_updated_count,
        legacy_updated_count: data.legacy_updated_count,
        duration_ms: data.duration_ms,
      };
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      
      toast({
        title: 'Failed to update rates',
        description: message,
        variant: 'destructive',
      });

      return { success: false, error: message };
    } finally {
      setIsRefreshing(false);
    }
  };

  return { refreshRates, isRefreshing };
}
