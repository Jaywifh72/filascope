import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface FilamentUpdateData {
  id: string;
  display_name?: string;
  product_url?: string;
  msrp?: number | null;
  variant_price?: number | null;
  material?: string;
  diameter?: string;
  weight_grams?: number | null;
  color_name?: string;
  image_url?: string;
  sync_enabled?: boolean;
  admin_notes?: string;
}

export interface PrinterUpdateData {
  id: string;
  display_name?: string;
  official_product_url?: string;
  msrp_usd?: number | null;
  current_price_usd_store?: number | null;
  image_url?: string;
  build_volume?: string;
  max_print_speed_mm_s?: number | null;
  connectivity?: string[];
  sync_enabled?: boolean;
  admin_notes?: string;
}

export function useUpdateFilament() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: FilamentUpdateData) => {
      const { id, ...updateData } = data;
      
      // Remove undefined values
      const cleanData = Object.fromEntries(
        Object.entries(updateData).filter(([_, v]) => v !== undefined)
      );

      const { data: result, error } = await supabase
        .from('filaments')
        .update(cleanData)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return result;
    },
    onMutate: async (newData) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['admin-filaments'] });

      // Snapshot the previous value
      const previousFilaments = queryClient.getQueryData(['admin-filaments']);

      // Optimistically update
      queryClient.setQueryData(['admin-filaments'], (old: any[] | undefined) => {
        if (!old) return old;
        return old.map((f) =>
          f.id === newData.id ? { ...f, ...newData } : f
        );
      });

      return { previousFilaments };
    },
    onError: (err, _newData, context) => {
      // Rollback on error
      if (context?.previousFilaments) {
        queryClient.setQueryData(['admin-filaments'], context.previousFilaments);
      }
      toast.error('Failed to update filament', {
        description: err instanceof Error ? err.message : 'Unknown error',
      });
    },
    onSuccess: () => {
      toast.success('Filament updated successfully');
    },
    onSettled: () => {
      // Invalidate all relevant queries to ensure consistency
      queryClient.invalidateQueries({ queryKey: ['admin-filaments'] });
      queryClient.invalidateQueries({ queryKey: ['filaments'] });
      queryClient.invalidateQueries({ queryKey: ['filament'] });
    },
  });
}

export function useUpdatePrinter() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: PrinterUpdateData) => {
      const { id, ...updateData } = data;
      
      // Remove undefined values
      const cleanData = Object.fromEntries(
        Object.entries(updateData).filter(([_, v]) => v !== undefined)
      );

      const { data: result, error } = await supabase
        .from('printers')
        .update(cleanData)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return result;
    },
    onMutate: async (newData) => {
      await queryClient.cancelQueries({ queryKey: ['admin-printers'] });

      const previousPrinters = queryClient.getQueryData(['admin-printers']);

      queryClient.setQueryData(['admin-printers'], (old: any[] | undefined) => {
        if (!old) return old;
        return old.map((p) =>
          p.id === newData.id ? { ...p, ...newData } : p
        );
      });

      return { previousPrinters };
    },
    onError: (err, _newData, context) => {
      if (context?.previousPrinters) {
        queryClient.setQueryData(['admin-printers'], context.previousPrinters);
      }
      toast.error('Failed to update printer', {
        description: err instanceof Error ? err.message : 'Unknown error',
      });
    },
    onSuccess: () => {
      toast.success('Printer updated successfully');
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-printers'] });
      queryClient.invalidateQueries({ queryKey: ['printers'] });
      queryClient.invalidateQueries({ queryKey: ['printer'] });
    },
  });
}
