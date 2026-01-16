import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useQueryClient } from '@tanstack/react-query';

export type EnrichmentOperation = 
  | { type: 'color-extraction'; brandSlug: string; dryRun?: boolean }
  | { type: 'tds-discovery'; brandSlug: string; dryRun?: boolean }
  | { type: 'regional-pricing'; brandSlug: string; regions: string[]; dryRun?: boolean };

export interface EnrichmentResult {
  operation: EnrichmentOperation;
  success: boolean;
  message: string;
  details?: Record<string, any>;
  duration_ms?: number;
}

export interface EnrichmentQueueState {
  isRunning: boolean;
  currentIndex: number;
  totalOperations: number;
  currentOperation: EnrichmentOperation | null;
  results: EnrichmentResult[];
  errors: string[];
}

export function useEnrichmentQueue() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [state, setState] = useState<EnrichmentQueueState>({
    isRunning: false,
    currentIndex: 0,
    totalOperations: 0,
    currentOperation: null,
    results: [],
    errors: [],
  });

  const runColorExtraction = async (brandSlug: string, dryRun: boolean = true): Promise<EnrichmentResult> => {
    const startTime = Date.now();
    try {
      const { data, error } = await supabase.functions.invoke('extract-brand-colors', {
        body: { brandSlug, dryRun }
      });
      
      if (error) throw error;
      
      return {
        operation: { type: 'color-extraction', brandSlug, dryRun },
        success: data?.success ?? false,
        message: data?.success 
          ? `Extracted colors for ${data?.results?.length || 0} products` 
          : (data?.error || 'Unknown error'),
        details: data,
        duration_ms: Date.now() - startTime,
      };
    } catch (err) {
      return {
        operation: { type: 'color-extraction', brandSlug, dryRun },
        success: false,
        message: err instanceof Error ? err.message : 'Unknown error',
        duration_ms: Date.now() - startTime,
      };
    }
  };

  const runTdsDiscovery = async (brandSlug: string, dryRun: boolean = true): Promise<EnrichmentResult> => {
    const startTime = Date.now();
    try {
      const { data, error } = await supabase.functions.invoke('discover-brand-tds', {
        body: { brandSlug, dryRun }
      });
      
      if (error) throw error;
      
      return {
        operation: { type: 'tds-discovery', brandSlug, dryRun },
        success: data?.success ?? false,
        message: data?.success 
          ? `Discovered ${data?.tdsFound || data?.discovered || 0} TDS URLs` 
          : (data?.error || 'Unknown error'),
        details: data,
        duration_ms: Date.now() - startTime,
      };
    } catch (err) {
      return {
        operation: { type: 'tds-discovery', brandSlug, dryRun },
        success: false,
        message: err instanceof Error ? err.message : 'Unknown error',
        duration_ms: Date.now() - startTime,
      };
    }
  };

  const runRegionalPricing = async (brandSlug: string, regions: string[], dryRun: boolean = true): Promise<EnrichmentResult> => {
    const startTime = Date.now();
    try {
      const { data, error } = await supabase.functions.invoke('sync-regional-prices', {
        body: { brandSlug, regions, dryRun }
      });
      
      if (error) throw error;
      
      return {
        operation: { type: 'regional-pricing', brandSlug, regions, dryRun },
        success: data?.success ?? false,
        message: data?.success 
          ? `Synced ${data?.summary?.totalUpdated || 0} regional prices` 
          : (data?.error || 'Unknown error'),
        details: data,
        duration_ms: Date.now() - startTime,
      };
    } catch (err) {
      return {
        operation: { type: 'regional-pricing', brandSlug, regions, dryRun },
        success: false,
        message: err instanceof Error ? err.message : 'Unknown error',
        duration_ms: Date.now() - startTime,
      };
    }
  };

  const runOperation = async (op: EnrichmentOperation): Promise<EnrichmentResult> => {
    switch (op.type) {
      case 'color-extraction':
        return runColorExtraction(op.brandSlug, op.dryRun);
      case 'tds-discovery':
        return runTdsDiscovery(op.brandSlug, op.dryRun);
      case 'regional-pricing':
        return runRegionalPricing(op.brandSlug, op.regions, op.dryRun);
    }
  };

  const runQueue = useCallback(async (operations: EnrichmentOperation[]) => {
    if (operations.length === 0) return;

    setState(prev => ({
      ...prev,
      isRunning: true,
      currentIndex: 0,
      totalOperations: operations.length,
      currentOperation: operations[0],
      results: [],
      errors: [],
    }));

    const results: EnrichmentResult[] = [];
    const errors: string[] = [];

    for (let i = 0; i < operations.length; i++) {
      const op = operations[i];
      setState(prev => ({
        ...prev,
        currentIndex: i,
        currentOperation: op,
      }));

      const result = await runOperation(op);
      results.push(result);

      if (!result.success) {
        errors.push(`${op.type} (${op.brandSlug}): ${result.message}`);
      }

      setState(prev => ({
        ...prev,
        results: [...results],
        errors: [...errors],
      }));
    }

    setState(prev => ({
      ...prev,
      isRunning: false,
      currentOperation: null,
    }));

    toast({
      title: 'Enrichment Complete',
      description: `${results.filter(r => r.success).length}/${results.length} operations succeeded`,
      variant: errors.length > 0 ? 'destructive' : 'default',
    });

    // Invalidate related queries to refresh data
    queryClient.invalidateQueries({ queryKey: ['enrichment-history'] });
    queryClient.invalidateQueries({ queryKey: ['enrichment-metrics'] });

    return results;
  }, [toast, queryClient]);

  const runSingle = useCallback(async (operation: EnrichmentOperation) => {
    setState(prev => ({
      ...prev,
      isRunning: true,
      currentIndex: 0,
      totalOperations: 1,
      currentOperation: operation,
      results: [],
      errors: [],
    }));

    const result = await runOperation(operation);

    setState(prev => ({
      ...prev,
      isRunning: false,
      currentOperation: null,
      results: [result],
      errors: result.success ? [] : [result.message],
    }));

    toast({
      title: result.success ? 'Success' : 'Failed',
      description: result.message,
      variant: result.success ? 'default' : 'destructive',
    });

    // Invalidate related queries to refresh data
    queryClient.invalidateQueries({ queryKey: ['enrichment-history'] });
    queryClient.invalidateQueries({ queryKey: ['enrichment-metrics'] });

    return result;
  }, [toast, queryClient]);

  const reset = useCallback(() => {
    setState({
      isRunning: false,
      currentIndex: 0,
      totalOperations: 0,
      currentOperation: null,
      results: [],
      errors: [],
    });
  }, []);

  return {
    state,
    runQueue,
    runSingle,
    runColorExtraction,
    runTdsDiscovery,
    runRegionalPricing,
    reset,
    isRunning: state.isRunning,
    progress: state.totalOperations > 0 
      ? Math.round((state.currentIndex / state.totalOperations) * 100) 
      : 0,
  };
}
