import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface PrinterInsertData {
  product_url: string;
  vendor: string;
  source_type: string;
  model_name: string;
  printer_type: string;
  build_volume_x_mm?: number;
  build_volume_y_mm?: number;
  build_volume_z_mm?: number;
  max_print_speed_mm_s?: number;
  connectivity: string[];
  features: string[];
  filament_compatibility: string[];
  msrp_usd: number;
  current_price_usd?: number;
  compare_at_price_usd?: number;
  description?: string;
  image_url?: string;
  specifications?: Record<string, string>;
  admin_notes?: string;
}

export function useCreatePrinter() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: PrinterInsertData) => {
      const { data: result, error } = await supabase
        .from('printers')
        .insert([{
          model_name: data.model_name,
          display_name: data.model_name,
          official_product_url: data.product_url,
          printer_technology: data.printer_type,
          build_volume_x_mm: data.build_volume_x_mm || null,
          build_volume_y_mm: data.build_volume_y_mm || null,
          build_volume_z_mm: data.build_volume_z_mm || null,
          max_print_speed_mms: data.max_print_speed_mm_s || null,
          has_wifi: data.connectivity.includes('WiFi'),
          has_ethernet: data.connectivity.includes('Ethernet'),
          has_sd_card: data.connectivity.includes('SD Card'),
          has_usb_a_port: data.connectivity.includes('USB'),
          has_bluetooth: data.connectivity.includes('Bluetooth'),
          auto_bed_leveling: data.features.includes('Auto Bed Leveling'),
          enclosed: data.features.includes('Enclosure'),
          multi_material_capable: data.features.includes('Multi-Color'),
          direct_drive: data.features.includes('Direct Drive'),
          msrp_usd: data.msrp_usd,
          current_price_usd_store: data.current_price_usd || null,
          compare_at_price_usd: data.compare_at_price_usd || null,
          description: data.description || null,
          image_url: data.image_url || null,
          admin_notes: data.admin_notes || null,
          sync_enabled: true,
          status: 'active',
        }])
        .select()
        .single();

      if (error) throw error;
      return result;
    },
    onSuccess: (result) => {
      toast.success('Printer created successfully', {
        description: result.model_name || result.display_name,
      });
    },
    onError: (err) => {
      toast.error('Failed to create printer', {
        description: err instanceof Error ? err.message : 'Unknown error',
      });
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-printers'] });
      queryClient.invalidateQueries({ queryKey: ['printers'] });
      queryClient.invalidateQueries({ queryKey: ['printer'] });
    },
  });
}
