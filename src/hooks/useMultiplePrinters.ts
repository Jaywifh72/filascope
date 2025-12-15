import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import { toast } from "sonner";

const SESSION_KEY = "filascope_session_id";

function getOrCreateSessionId(): string {
  let sessionId = localStorage.getItem(SESSION_KEY);
  if (!sessionId) {
    sessionId = `anon_${Date.now()}_${Math.random().toString(36).slice(2)}`;
    localStorage.setItem(SESSION_KEY, sessionId);
  }
  return sessionId;
}

export interface UserPrinter {
  id: string;
  user_id: string | null;
  session_id: string | null;
  printer_id: string;
  nickname: string | null;
  is_primary: boolean;
  hardware_config: {
    hotend_id?: string;
    build_plate_id?: string;
    firmware_version?: string;
  };
  created_at: string;
  updated_at: string;
  // Joined printer data
  printer?: {
    model_name: string;
    brand: { brand: string } | null;
    scraped_data: { images?: { product_images?: string[] } } | null;
    build_volume_x_mm: number | null;
    build_volume_y_mm: number | null;
    build_volume_z_mm: number | null;
    max_nozzle_temp_c: number | null;
    current_price_usd_store: number | null;
  };
}

export function useMultiplePrinters() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ["user-printers", user?.id],
    queryFn: async () => {
      const userId = user?.id;
      const sessionId = userId ? null : getOrCreateSessionId();

      // First fetch user printers
      let queryBuilder = supabase
        .from("user_printers")
        .select("*")
        .order("is_primary", { ascending: false })
        .order("created_at", { ascending: false });

      if (userId) {
        queryBuilder = queryBuilder.eq("user_id", userId);
      } else {
        queryBuilder = queryBuilder.eq("session_id", sessionId);
      }

      const { data: userPrinters, error } = await queryBuilder;
      if (error) throw error;
      if (!userPrinters || userPrinters.length === 0) return [];

      // Fetch printer details for each user printer
      const printerIds = userPrinters.map((up) => up.printer_id);
      const { data: printers } = await supabase
        .from("printers")
        .select(`
          printer_id,
          model_name,
          brand:printer_brands(brand),
          scraped_data,
          build_volume_x_mm,
          build_volume_y_mm,
          build_volume_z_mm,
          max_nozzle_temp_c,
          current_price_usd_store
        `)
        .in("printer_id", printerIds);

      // Merge printer data with user printers
      return userPrinters.map((up) => {
        const printerData = printers?.find((p) => p.printer_id === up.printer_id);
        return {
          ...up,
          hardware_config: (up.hardware_config || {}) as UserPrinter["hardware_config"],
          printer: printerData
            ? {
                model_name: printerData.model_name,
                brand: printerData.brand as { brand: string } | null,
                scraped_data: printerData.scraped_data as UserPrinter["printer"]["scraped_data"],
                build_volume_x_mm: printerData.build_volume_x_mm,
                build_volume_y_mm: printerData.build_volume_y_mm,
                build_volume_z_mm: printerData.build_volume_z_mm,
                max_nozzle_temp_c: printerData.max_nozzle_temp_c,
                current_price_usd_store: printerData.current_price_usd_store,
              }
            : undefined,
        };
      }) as UserPrinter[];
    },
    staleTime: 1000 * 60 * 5,
  });

  const addPrinter = useMutation({
    mutationFn: async ({
      printerId,
      nickname,
      hardwareConfig,
    }: {
      printerId: string;
      nickname?: string;
      hardwareConfig?: UserPrinter["hardware_config"];
    }) => {
      const userId = user?.id;
      const sessionId = userId ? null : getOrCreateSessionId();

      // Check if this is the first printer (make it primary)
      const existingCount = query.data?.length || 0;
      const isPrimary = existingCount === 0;

      const { data, error } = await supabase
        .from("user_printers")
        .insert({
          user_id: userId || null,
          session_id: sessionId,
          printer_id: printerId,
          nickname: nickname || null,
          is_primary: isPrimary,
          hardware_config: hardwareConfig || {},
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["user-printers"] });
      toast.success("Printer added to your collection");
    },
    onError: () => {
      toast.error("Failed to add printer");
    },
  });

  const updatePrinter = useMutation({
    mutationFn: async ({
      id,
      nickname,
      hardwareConfig,
    }: {
      id: string;
      nickname?: string;
      hardwareConfig?: UserPrinter["hardware_config"];
    }) => {
      const { error } = await supabase
        .from("user_printers")
        .update({
          nickname,
          hardware_config: hardwareConfig,
        })
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["user-printers"] });
    },
  });

  const removePrinter = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("user_printers").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["user-printers"] });
      toast.success("Printer removed");
    },
  });

  const setPrimaryPrinter = useMutation({
    mutationFn: async (id: string) => {
      const userId = user?.id;
      const sessionId = userId ? null : getOrCreateSessionId();

      // First, unset all as primary
      const updateQuery = userId
        ? supabase.from("user_printers").update({ is_primary: false }).eq("user_id", userId)
        : supabase.from("user_printers").update({ is_primary: false }).eq("session_id", sessionId);

      await updateQuery;

      // Then set the selected one as primary
      const { error } = await supabase
        .from("user_printers")
        .update({ is_primary: true })
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["user-printers"] });
      toast.success("Primary printer updated");
    },
  });

  const primaryPrinter = query.data?.find((p) => p.is_primary) || query.data?.[0];

  return {
    printers: query.data || [],
    primaryPrinter,
    isLoading: query.isLoading,
    addPrinter: addPrinter.mutate,
    updatePrinter: updatePrinter.mutate,
    removePrinter: removePrinter.mutate,
    setPrimaryPrinter: setPrimaryPrinter.mutate,
    isAddingPrinter: addPrinter.isPending,
  };
}
