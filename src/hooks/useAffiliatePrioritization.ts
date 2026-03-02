import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface AffiliatePrioritizationSettings {
  enabled: boolean;
  default_boost: number;
  max_boost: number;
  boost_deals_active: boolean;
}

/**
 * Session-cached hook that reads the affiliate_prioritization setting.
 * Returns whether affiliate boost sorting is enabled.
 * Falls back to disabled on any error.
 */
export function useAffiliatePrioritization() {
  const { data, isLoading } = useQuery({
    queryKey: ["affiliate-prioritization-setting"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("site_settings")
        .select("value")
        .eq("key", "affiliate_prioritization")
        .single();

      if (error || !data) return { enabled: false };

      const value = data.value as unknown as AffiliatePrioritizationSettings;
      return { enabled: value?.enabled ?? false };
    },
    staleTime: 1000 * 60 * 30, // 30 minutes
    gcTime: 1000 * 60 * 60,    // 1 hour
  });

  return {
    isEnabled: data?.enabled ?? false,
    isLoading,
  };
}
