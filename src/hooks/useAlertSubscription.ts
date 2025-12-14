import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import { toast } from "sonner";

export interface AlertSubscription {
  id: string;
  user_id: string;
  email: string;
  phone: string | null;
  alert_levels: string[];
  brand_filters: string[];
  sms_enabled: boolean;
  email_enabled: boolean;
  created_at: string;
  updated_at: string;
}

export interface SubscriptionFormData {
  email: string;
  phone?: string;
  alert_levels: string[];
  brand_filters: string[];
  sms_enabled: boolean;
  email_enabled: boolean;
}

export function useAlertSubscription() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ["alert-subscription", user?.id],
    queryFn: async () => {
      if (!user?.id) return null;

      const { data, error } = await supabase
        .from("safety_alert_subscriptions")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();

      if (error) throw error;
      return data as AlertSubscription | null;
    },
    enabled: !!user?.id,
    staleTime: 1000 * 60 * 5,
  });

  const saveMutation = useMutation({
    mutationFn: async (formData: SubscriptionFormData) => {
      if (!user?.id) throw new Error("Must be logged in");

      const subscriptionData = {
        user_id: user.id,
        email: formData.email,
        phone: formData.phone || null,
        alert_levels: formData.alert_levels,
        brand_filters: formData.brand_filters,
        sms_enabled: formData.sms_enabled,
        email_enabled: formData.email_enabled,
        updated_at: new Date().toISOString(),
      };

      const { data, error } = await supabase
        .from("safety_alert_subscriptions")
        .upsert(subscriptionData, { onConflict: "user_id" })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["alert-subscription"] });
      toast.success("Subscription preferences saved");
    },
    onError: (error) => {
      toast.error("Failed to save preferences: " + error.message);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async () => {
      if (!user?.id) throw new Error("Must be logged in");

      const { error } = await supabase
        .from("safety_alert_subscriptions")
        .delete()
        .eq("user_id", user.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["alert-subscription"] });
      toast.success("Subscription removed");
    },
    onError: (error) => {
      toast.error("Failed to remove subscription: " + error.message);
    },
  });

  return {
    subscription: query.data,
    isLoading: query.isLoading,
    saveSubscription: saveMutation.mutate,
    isSaving: saveMutation.isPending,
    deleteSubscription: deleteMutation.mutate,
    isDeleting: deleteMutation.isPending,
  };
}
