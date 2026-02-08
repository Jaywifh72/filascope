import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import { toast } from "sonner";

interface PriceAlert {
  id: string;
  filament_id: string;
  target_price: number;
  current_price_when_set: number | null;
  email_notifications: boolean;
  is_active: boolean;
  triggered_at: string | null;
  triggered_price: number | null;
  created_at: string;
  filament?: {
    id: string;
    product_title: string;
    vendor: string | null;
    material: string | null;
    featured_image: string | null;
    variant_price: number | null;
  };
}

export function useDatabasePriceAlerts() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Fetch all user's price alerts
  const alertsQuery = useQuery({
    queryKey: ["price-alerts", user?.id],
    queryFn: async () => {
      if (!user?.id) return [];

      const { data, error } = await supabase
        .from("price_alerts")
        .select(`
          *,
          filament:filaments(
            id,
            product_title,
            vendor,
            material,
            featured_image,
            variant_price
          )
        `)
        .eq("user_id", user.id)
        .eq("is_active", true)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return (data || []) as PriceAlert[];
    },
    enabled: !!user?.id,
    staleTime: 1000 * 60 * 5,
  });

  // Create or update a price alert (logged-in user)
  const setAlertMutation = useMutation({
    mutationFn: async ({ 
      filamentId, 
      targetPrice, 
      currentPrice,
      emailNotifications = true,
      currency: alertCurrency,
      region: alertRegion,
    }: { 
      filamentId: string; 
      targetPrice: number; 
      currentPrice?: number;
      emailNotifications?: boolean;
      currency?: string;
      region?: string;
    }) => {
      if (!user?.id) throw new Error("Must be logged in");

      const { data, error } = await supabase
        .from("price_alerts")
        .upsert({
          user_id: user.id,
          filament_id: filamentId,
          target_price: targetPrice,
          current_price_when_set: currentPrice,
          email_notifications: emailNotifications,
          is_active: true,
          triggered_at: null,
          triggered_price: null,
          ...(alertCurrency ? { currency: alertCurrency } : {}),
          ...(alertRegion ? { region: alertRegion } : {}),
        }, {
          onConflict: "user_id,filament_id",
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["price-alerts"] });
      toast.success("Price alert set! We'll notify you when the price drops.");
    },
    onError: (error) => {
      toast.error("Failed to set price alert");
      console.error(error);
    },
  });

  // Create a guest price alert (email only, no account)
  const setGuestAlertMutation = useMutation({
    mutationFn: async ({
      filamentId,
      targetPrice,
      currentPrice,
      email,
    }: {
      filamentId: string;
      targetPrice: number;
      currentPrice?: number;
      email: string;
    }) => {
      const { data, error } = await supabase
        .from("price_alerts")
        .upsert({
          user_id: null,
          filament_id: filamentId,
          target_price: targetPrice,
          current_price_when_set: currentPrice,
          email,
          email_notifications: true,
          is_active: true,
          triggered_at: null,
          triggered_price: null,
        }, {
          onConflict: "email,filament_id",
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast.success("Price alert set! We'll email you when the price drops.");
    },
    onError: (error) => {
      toast.error("Failed to set price alert");
      console.error(error);
    },
  });

  // Remove a price alert
  const removeAlertMutation = useMutation({
    mutationFn: async (filamentId: string) => {
      if (!user?.id) throw new Error("Must be logged in");

      const { error } = await supabase
        .from("price_alerts")
        .delete()
        .eq("user_id", user.id)
        .eq("filament_id", filamentId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["price-alerts"] });
      toast.success("Price alert removed");
    },
  });

  // Check if alert exists for a filament
  const hasAlert = (filamentId: string) => {
    return alertsQuery.data?.some(a => a.filament_id === filamentId) ?? false;
  };

  // Get alert for a specific filament
  const getAlert = (filamentId: string) => {
    return alertsQuery.data?.find(a => a.filament_id === filamentId);
  };

  // Get triggered alerts (price dropped below target)
  const triggeredAlerts = alertsQuery.data?.filter(alert => {
    if (!alert.filament?.variant_price) return false;
    return alert.filament.variant_price <= alert.target_price;
  }) ?? [];

  return {
    alerts: alertsQuery.data ?? [],
    triggeredAlerts,
    isLoading: alertsQuery.isLoading,
    setAlert: setAlertMutation.mutate,
    removeAlert: removeAlertMutation.mutate,
    hasAlert,
    getAlert,
    isSettingAlert: setAlertMutation.isPending,
    setGuestAlert: setGuestAlertMutation.mutate,
    isSettingGuestAlert: setGuestAlertMutation.isPending,
  };
}
