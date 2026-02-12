import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

interface FeatureSwitchValue {
  enabled: boolean;
}

export const useFeatureSwitch = (key: string) => {
  const [enabled, setEnabledState] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      try {
        const { data, error } = await supabase
          .from("site_settings")
          .select("value")
          .eq("key", key)
          .single();

        if (!error && data) {
          const value = data.value as unknown as FeatureSwitchValue;
          setEnabledState(value?.enabled ?? false);
        }
      } catch {
        setEnabledState(false);
      } finally {
        setLoading(false);
      }
    };

    fetch();

    const channel = supabase
      .channel(`site_settings_${key}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "site_settings",
          filter: `key=eq.${key}`,
        },
        (payload) => {
          const value = payload.new.value as unknown as FeatureSwitchValue;
          setEnabledState(value?.enabled ?? false);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [key]);

  const setEnabled = async (newEnabled: boolean) => {
    const { error } = await supabase
      .from("site_settings")
      .update({ value: { enabled: newEnabled }, updated_at: new Date().toISOString() })
      .eq("key", key);

    if (!error) {
      setEnabledState(newEnabled);
    }

    return { error };
  };

  return { enabled, loading, setEnabled };
};
