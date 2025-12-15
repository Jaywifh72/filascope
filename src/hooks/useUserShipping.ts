import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import { toast } from "sonner";

export interface UserShippingPreferences {
  zipCode: string;
  country: string;
  amazonPrimeMember: boolean;
  retailerMemberships: Record<string, boolean>;
}

const DEFAULT_PREFERENCES: UserShippingPreferences = {
  zipCode: '',
  country: 'US',
  amazonPrimeMember: false,
  retailerMemberships: {},
};

export function useUserShipping() {
  const { user } = useAuth();
  const [preferences, setPreferences] = useState<UserShippingPreferences>(DEFAULT_PREFERENCES);
  const [isLoading, setIsLoading] = useState(true);

  // Load preferences from localStorage and/or database
  useEffect(() => {
    const loadPreferences = async () => {
      // First try localStorage
      const stored = localStorage.getItem('filascope_shipping_preferences');
      if (stored) {
        try {
          setPreferences(JSON.parse(stored));
        } catch {
          // Invalid JSON, ignore
        }
      }

      // If logged in, fetch from database (overrides localStorage)
      if (user) {
        const { data, error } = await supabase
          .from('profiles')
          .select('shipping_zip_code, shipping_country, amazon_prime_member, retailer_memberships')
          .eq('id', user.id)
          .single();

        if (!error && data) {
          const dbPrefs: UserShippingPreferences = {
            zipCode: data.shipping_zip_code || '',
            country: data.shipping_country || 'US',
            amazonPrimeMember: data.amazon_prime_member || false,
            retailerMemberships: (data.retailer_memberships as Record<string, boolean>) || {},
          };
          setPreferences(dbPrefs);
          localStorage.setItem('filascope_shipping_preferences', JSON.stringify(dbPrefs));
        }
      }

      setIsLoading(false);
    };

    loadPreferences();
  }, [user]);

  const updatePreferences = useCallback(async (updates: Partial<UserShippingPreferences>) => {
    const newPrefs = { ...preferences, ...updates };
    setPreferences(newPrefs);
    localStorage.setItem('filascope_shipping_preferences', JSON.stringify(newPrefs));

    // If logged in, also save to database
    if (user) {
      const { error } = await supabase
        .from('profiles')
        .update({
          shipping_zip_code: newPrefs.zipCode || null,
          shipping_country: newPrefs.country,
          amazon_prime_member: newPrefs.amazonPrimeMember,
          retailer_memberships: newPrefs.retailerMemberships,
          updated_at: new Date().toISOString(),
        })
        .eq('id', user.id);

      if (error) {
        console.error('Error saving shipping preferences:', error);
        toast.error('Failed to save shipping preferences');
      }
    }
  }, [preferences, user]);

  const setZipCode = useCallback((zipCode: string) => {
    updatePreferences({ zipCode });
  }, [updatePreferences]);

  const setCountry = useCallback((country: string) => {
    updatePreferences({ country });
  }, [updatePreferences]);

  const setPrimeMember = useCallback((isPrime: boolean) => {
    updatePreferences({ amazonPrimeMember: isPrime });
  }, [updatePreferences]);

  const setMembership = useCallback((retailerSlug: string, hasMembership: boolean) => {
    updatePreferences({
      retailerMemberships: {
        ...preferences.retailerMemberships,
        [retailerSlug]: hasMembership,
      },
    });
  }, [preferences.retailerMemberships, updatePreferences]);

  return {
    preferences,
    isLoading,
    updatePreferences,
    setZipCode,
    setCountry,
    setPrimeMember,
    setMembership,
    hasZipCode: !!preferences.zipCode,
    isPrimeMember: preferences.amazonPrimeMember,
  };
}
