import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface PrinterSpecsRange {
  nozzleTempMin: number | null;
  nozzleTempMax: number | null;
  bedTempMin: number | null;
  bedTempMax: number | null;
  nozzleDiaMin: number | null;
  nozzleDiaMax: number | null;
  printSpeedMin: number | null;
  printSpeedMax: number | null;
  accelerationMin: number | null;
  accelerationMax: number | null;
  flowRateMin: number | null;
  flowRateMax: number | null;
}

async function fetchPrinterSpecsRange(): Promise<PrinterSpecsRange> {
  const { data, error } = await supabase
    .from("printers")
    .select(`
      max_nozzle_temp_c,
      bed_max_temp_c,
      stock_nozzle_diameter_mm,
      max_print_speed_mms,
      max_acceleration_xy_mmss,
      max_flow_rate_mm3s
    `);

  if (error) throw error;

  // Filter valid values and calculate ranges
  const nozzleTemps = data
    .map(p => p.max_nozzle_temp_c)
    .filter((v): v is number => v !== null && v > 0 && v < 600);
  
  const bedTemps = data
    .map(p => p.bed_max_temp_c)
    .filter((v): v is number => v !== null && v > 0 && v < 200);
  
  const nozzleDias = data
    .map(p => p.stock_nozzle_diameter_mm)
    .filter((v): v is number => v !== null && v > 0 && v < 3);
  
  const printSpeeds = data
    .map(p => p.max_print_speed_mms)
    .filter((v): v is number => v !== null && v > 0 && v < 2000);
  
  const accelerations = data
    .map(p => p.max_acceleration_xy_mmss)
    .filter((v): v is number => v !== null && v > 0 && v < 100000);
  
  const flowRates = data
    .map(p => p.max_flow_rate_mm3s)
    .filter((v): v is number => v !== null && v > 0 && v < 1000);

  return {
    nozzleTempMin: nozzleTemps.length ? Math.min(...nozzleTemps) : null,
    nozzleTempMax: nozzleTemps.length ? Math.max(...nozzleTemps) : null,
    bedTempMin: bedTemps.length ? Math.min(...bedTemps) : null,
    bedTempMax: bedTemps.length ? Math.max(...bedTemps) : null,
    nozzleDiaMin: nozzleDias.length ? Math.min(...nozzleDias) : null,
    nozzleDiaMax: nozzleDias.length ? Math.max(...nozzleDias) : null,
    printSpeedMin: printSpeeds.length ? Math.min(...printSpeeds) : null,
    printSpeedMax: printSpeeds.length ? Math.max(...printSpeeds) : null,
    accelerationMin: accelerations.length ? Math.min(...accelerations) : null,
    accelerationMax: accelerations.length ? Math.max(...accelerations) : null,
    flowRateMin: flowRates.length ? Math.min(...flowRates) : null,
    flowRateMax: flowRates.length ? Math.max(...flowRates) : null,
  };
}

export function usePrinterSpecsRange() {
  return useQuery({
    queryKey: ["printer-specs-range"],
    queryFn: fetchPrinterSpecsRange,
    staleTime: 1000 * 60 * 10, // 10 minutes
  });
}
