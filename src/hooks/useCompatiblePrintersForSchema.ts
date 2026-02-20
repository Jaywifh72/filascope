import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface PrinterForSchema {
  modelName: string;
  brandName: string | null;
}

/**
 * Fetches up to 5 printers compatible with a filament's max nozzle temperature,
 * joining printer_brands for the brand name.
 * Used exclusively for Product JSON-LD `isRelatedTo` schema injection.
 */
export function useCompatiblePrintersForSchema(
  nozzleTempMaxC: number | null | undefined,
  filamentId: string | undefined
): PrinterForSchema[] {
  const { data } = useQuery({
    queryKey: ['compatible-printers-schema', nozzleTempMaxC, filamentId],
    enabled: !!filamentId && nozzleTempMaxC != null,
    staleTime: 1000 * 60 * 30, // 30 minutes
    queryFn: async (): Promise<PrinterForSchema[]> => {
      const { data, error } = await supabase
        .from('printers')
        .select('model_name, display_name, printer_brands!printers_brand_id_fkey(brand)')
        .gte('max_nozzle_temp_c', nozzleTempMaxC!)
        .order('model_name')
        .limit(5);

      if (error) throw error;
      if (!data || data.length === 0) return [];

      return data.map((p) => ({
        modelName: (p.display_name || p.model_name) as string,
        brandName: (p.printer_brands as any)?.brand ?? null,
      }));
    },
  });

  return data ?? [];
}
