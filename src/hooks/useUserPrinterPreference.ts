import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import { toast } from "sonner";

interface PrinterPreference {
  id: string;
  printer_id: string | null;
  printer_name: string | null;
  auto_filter: boolean;
  nozzle_temp_max: number | null;
  bed_temp_max: number | null;
  has_enclosure: boolean;
  printer?: {
    id: string;
    model_name: string;
    max_nozzle_temp_c: number | null;
    bed_max_temp_c: number | null;
    has_enclosure: boolean | null;
    printer_brands?: {
      brand: string;
    } | null;
  } | null;
}

export function useUserPrinterPreference() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Fetch user's saved printer preference
  const prefQuery = useQuery({
    queryKey: ["user-printer-preference", user?.id],
    queryFn: async () => {
      if (!user?.id) return null;

      const { data, error } = await supabase
        .from("user_printer_preferences")
        .select(`
          *,
          printer:printers(
            id,
            model_name,
            max_nozzle_temp_c,
            bed_max_temp_c,
            has_enclosure,
            printer_brands(brand)
          )
        `)
        .eq("user_id", user.id)
        .maybeSingle();

      if (error) throw error;
      return data as PrinterPreference | null;
    },
    enabled: !!user?.id,
    staleTime: 1000 * 60 * 10,
  });

  // Save printer preference
  const savePrinterMutation = useMutation({
    mutationFn: async ({ 
      printerId, 
      printerName,
      autoFilter = true,
      nozzleTempMax,
      bedTempMax,
      hasEnclosure = false,
    }: { 
      printerId?: string; 
      printerName?: string;
      autoFilter?: boolean;
      nozzleTempMax?: number;
      bedTempMax?: number;
      hasEnclosure?: boolean;
    }) => {
      if (!user?.id) throw new Error("Must be logged in");

      const { data, error } = await supabase
        .from("user_printer_preferences")
        .upsert({
          user_id: user.id,
          printer_id: printerId || null,
          printer_name: printerName || null,
          auto_filter: autoFilter,
          nozzle_temp_max: nozzleTempMax || null,
          bed_temp_max: bedTempMax || null,
          has_enclosure: hasEnclosure,
        }, {
          onConflict: "user_id",
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["user-printer-preference"] });
      toast.success(`Printer saved as "My Printer"`, {
        description: variables.printerName ? `${variables.printerName} will be used for recommendations` : undefined,
      });
    },
    onError: (error) => {
      toast.error("Failed to save printer preference");
      console.error(error);
    },
  });

  // Clear printer preference
  const clearPrinterMutation = useMutation({
    mutationFn: async () => {
      if (!user?.id) throw new Error("Must be logged in");

      const { error } = await supabase
        .from("user_printer_preferences")
        .delete()
        .eq("user_id", user.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["user-printer-preference"] });
      toast.success("Printer preference cleared");
    },
  });

  // Toggle auto-filter
  const toggleAutoFilterMutation = useMutation({
    mutationFn: async (enabled: boolean) => {
      if (!user?.id) throw new Error("Must be logged in");

      const { error } = await supabase
        .from("user_printer_preferences")
        .update({ auto_filter: enabled })
        .eq("user_id", user.id);

      if (error) throw error;
    },
    onSuccess: (_, enabled) => {
      queryClient.invalidateQueries({ queryKey: ["user-printer-preference"] });
      toast.success(enabled ? "Auto-filter enabled" : "Auto-filter disabled");
    },
  });

  const printerName = prefQuery.data?.printer 
    ? `${prefQuery.data.printer.printer_brands?.brand || ''} ${prefQuery.data.printer.model_name}`.trim()
    : prefQuery.data?.printer_name || null;

  return {
    preference: prefQuery.data,
    printerName,
    printerId: prefQuery.data?.printer_id,
    autoFilter: prefQuery.data?.auto_filter ?? false,
    nozzleTempMax: prefQuery.data?.nozzle_temp_max ?? prefQuery.data?.printer?.max_nozzle_temp_c,
    bedTempMax: prefQuery.data?.bed_temp_max ?? prefQuery.data?.printer?.bed_max_temp_c,
    hasEnclosure: prefQuery.data?.has_enclosure ?? prefQuery.data?.printer?.has_enclosure ?? false,
    isLoading: prefQuery.isLoading,
    hasSavedPrinter: !!prefQuery.data,
    savePrinter: savePrinterMutation.mutate,
    clearPrinter: clearPrinterMutation.mutate,
    toggleAutoFilter: toggleAutoFilterMutation.mutate,
    isSaving: savePrinterMutation.isPending,
  };
}
