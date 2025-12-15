import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { SlicerType } from "@/lib/slicerMapping";

export function useSlicerPreference() {
  const { user } = useAuth();
  const [preference, setPreference] = useState<SlicerType | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadPreference = async () => {
      // First try localStorage for non-auth users
      const stored = localStorage.getItem('filascope_slicer_preference');
      if (stored) {
        setPreference(stored as SlicerType);
      }

      // If logged in, fetch from DB
      if (user) {
        const { data, error } = await supabase
          .from('profiles')
          .select('preferred_slicer')
          .eq('id', user.id)
          .single();

        if (!error && data?.preferred_slicer) {
          setPreference(data.preferred_slicer as SlicerType);
          localStorage.setItem('filascope_slicer_preference', data.preferred_slicer);
        }
      }

      setIsLoading(false);
    };

    loadPreference();
  }, [user]);

  const updatePreference = useCallback(async (slicer: SlicerType) => {
    setPreference(slicer);
    localStorage.setItem('filascope_slicer_preference', slicer);

    if (user) {
      await supabase
        .from('profiles')
        .update({ 
          preferred_slicer: slicer,
          updated_at: new Date().toISOString()
        })
        .eq('id', user.id);
    }
  }, [user]);

  const clearPreference = useCallback(async () => {
    setPreference(null);
    localStorage.removeItem('filascope_slicer_preference');

    if (user) {
      await supabase
        .from('profiles')
        .update({ 
          preferred_slicer: null,
          updated_at: new Date().toISOString()
        })
        .eq('id', user.id);
    }
  }, [user]);

  return {
    preference,
    isLoading,
    updatePreference,
    clearPreference,
    hasPreference: !!preference,
  };
}
