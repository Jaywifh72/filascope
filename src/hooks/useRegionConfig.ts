import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { RegionConfigDb } from '@/types/regional';

// =============================================
// Query Hooks
// =============================================

/**
 * Get all active region configurations
 */
export function useRegionConfigs() {
  return useQuery({
    queryKey: ['region-config'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('region_config')
        .select('*')
        .eq('is_active', true)
        .order('region_name');

      if (error) throw error;
      return data as RegionConfigDb[];
    },
    staleTime: 1000 * 60 * 60, // 1 hour - rarely changes
  });
}

/**
 * Get a single region configuration by code
 */
export function useRegionConfig(regionCode: string | undefined) {
  return useQuery({
    queryKey: ['region-config', regionCode],
    queryFn: async () => {
      if (!regionCode) return null;

      const { data, error } = await supabase
        .from('region_config')
        .select('*')
        .eq('region_code', regionCode)
        .single();

      if (error) throw error;
      return data as RegionConfigDb;
    },
    enabled: !!regionCode,
    staleTime: 1000 * 60 * 60,
  });
}

/**
 * Get region configs as a lookup map { US: RegionConfigDb, CA: RegionConfigDb, ... }
 */
export function useRegionConfigMap() {
  const { data: configs, ...rest } = useRegionConfigs();

  const configMap: Record<string, RegionConfigDb> = {};
  if (configs) {
    for (const config of configs) {
      configMap[config.region_code] = config;
    }
  }

  return { data: configMap, ...rest };
}

/**
 * Get region options formatted for select dropdowns
 */
export function useRegionOptions() {
  const { data: configs, ...rest } = useRegionConfigs();

  const options = (configs || []).map((config) => ({
    value: config.region_code,
    label: `${config.flag_emoji || ''} ${config.region_name}`.trim(),
    currency: config.currency_code,
  }));

  return { data: options, ...rest };
}
