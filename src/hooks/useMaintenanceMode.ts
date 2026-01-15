import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

interface MaintenanceModeValue {
  enabled: boolean;
}

export const useMaintenanceMode = () => {
  const [isMaintenanceMode, setIsMaintenanceMode] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMaintenanceMode = async () => {
      try {
        const { data, error } = await supabase
          .from("site_settings")
          .select("value")
          .eq("key", "maintenance_mode")
          .single();

        if (!error && data) {
          const value = data.value as unknown as MaintenanceModeValue;
          setIsMaintenanceMode(value?.enabled ?? false);
        }
      } catch {
        setIsMaintenanceMode(false);
      } finally {
        setLoading(false);
      }
    };

    fetchMaintenanceMode();

    // Subscribe to realtime changes
    const channel = supabase
      .channel("site_settings_changes")
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "site_settings",
          filter: "key=eq.maintenance_mode",
        },
        (payload) => {
          const value = payload.new.value as unknown as MaintenanceModeValue;
          setIsMaintenanceMode(value?.enabled ?? false);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const setMaintenanceMode = async (enabled: boolean) => {
    const { error } = await supabase
      .from("site_settings")
      .update({ value: { enabled }, updated_at: new Date().toISOString() })
      .eq("key", "maintenance_mode");

    if (!error) {
      setIsMaintenanceMode(enabled);
    }

    return { error };
  };

  return { isMaintenanceMode, loading, setMaintenanceMode };
};
