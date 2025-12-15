import { useMemo } from "react";
import { Database } from "@/integrations/supabase/types";
import { useTrendingMaterials } from "./useTrendingMaterials";
import { generateIntelligentContent, IntelligentContent } from "@/lib/intelligentContentService";

type Filament = Database["public"]["Tables"]["filaments"]["Row"];
type Printer = Database["public"]["Tables"]["printers"]["Row"];
type Accessory = Database["public"]["Tables"]["printer_accessories"]["Row"];

export function useIntelligentContent(
  filament: Filament | null,
  printer: Printer | null,
  hotend: Accessory | null
): IntelligentContent | null {
  const { activeTrends } = useTrendingMaterials();

  return useMemo(() => {
    if (!filament) return null;

    return generateIntelligentContent(filament, printer, hotend, activeTrends);
  }, [filament, printer, hotend, activeTrends]);
}
