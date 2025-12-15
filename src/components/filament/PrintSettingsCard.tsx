import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { QuickStartView } from "./print-settings/QuickStartView";
import { AdvancedTabs } from "./print-settings/AdvancedTabs";
import { generatePrintSettingsData } from "@/lib/printSettingsData";
import { PrinterSelectionModal } from "@/components/filters/PrinterSelectionModal";
import { usePrinterSelection } from "@/hooks/usePrinterSelection";
import { checkPrinterFilamentCompatibility } from "@/lib/printerCompatibility";
import { Database } from "@/integrations/supabase/types";

type Filament = Database["public"]["Tables"]["filaments"]["Row"];

interface AccessoryWithCompatibility {
  id: string;
  name: string;
  brand: string | null;
  image_url: string | null;
  product_url: string | null;
  compatibility: {
    rating: 'green' | 'orange' | 'red';
    reason: string;
    details?: string[];
  };
}

interface PrintSettingsCardProps {
  filament: Filament;
  compatibleHotends: AccessoryWithCompatibility[];
  compatibleBuildPlates: AccessoryWithCompatibility[];
  compatibleAms: AccessoryWithCompatibility[];
}

export function PrintSettingsCard({
  filament,
  compatibleHotends,
  compatibleBuildPlates,
  compatibleAms,
}: PrintSettingsCardProps) {
  const { 
    selectedPrinter, 
    printerLoading, 
    setSelectedBrand,
    setSelectedPrinterId 
  } = usePrinterSelection();
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [printerModalOpen, setPrinterModalOpen] = useState(false);

  // Load expanded state from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('filascope_print_settings_expanded');
    if (saved === 'true') {
      setShowAdvanced(true);
    }
  }, []);

  // Save expanded state
  useEffect(() => {
    localStorage.setItem('filascope_print_settings_expanded', String(showAdvanced));
  }, [showAdvanced]);

  // Get printer brand name
  const printerBrand = selectedPrinter && typeof selectedPrinter.brand === 'object' && selectedPrinter.brand !== null && 'brand' in selectedPrinter.brand
    ? (selectedPrinter.brand as { brand: string }).brand
    : null;

  // Calculate compatibility
  const rawCompatibility = selectedPrinter && filament
    ? checkPrinterFilamentCompatibility(selectedPrinter, filament)
    : null;

  // Transform to simpler format for settings data
  const compatibility = rawCompatibility ? {
    is_supported: rawCompatibility.is_supported,
    ease_rating: rawCompatibility.ease_rating,
    limitations: rawCompatibility.limitations,
    recommendations: rawCompatibility.recommendations.warnings || [],
  } : null;

  // Generate settings data
  const settings = generatePrintSettingsData(
    filament,
    selectedPrinter,
    printerBrand,
    compatibility
  );

  // Simplified filament object for SlicerActions
  const filamentForSlicer = {
    id: filament.id,
    product_title: filament.product_title,
    vendor: filament.vendor,
    material: filament.material,
    nozzle_temp_min_c: filament.nozzle_temp_min_c,
    nozzle_temp_max_c: filament.nozzle_temp_max_c,
    nozzle_temp_sweetspot_c: filament.nozzle_temp_sweetspot_c,
    bed_temp_min_c: filament.bed_temp_min_c,
    bed_temp_max_c: filament.bed_temp_max_c,
    fan_min_percent: filament.fan_min_percent,
    fan_max_percent: filament.fan_max_percent,
    diameter_nominal_mm: filament.diameter_nominal_mm,
    density_g_cm3: filament.density_g_cm3,
    print_speed_max_mms: filament.print_speed_max_mms,
  };

  const handleSelectPrinter = (printerId: string, brand: string, modelName: string) => {
    setSelectedBrand(brand);
    setSelectedPrinterId(printerId);
  };

  const handleSelectGeneric = (profileType: string) => {
    setSelectedBrand('');
    setSelectedPrinterId('');
  };

  if (printerLoading) {
    return (
      <Card className="bg-gradient-to-br from-primary/10 via-card to-primary/5 border-primary/30 shadow-xl animate-pulse">
        <CardContent className="p-6">
          <div className="h-48 flex items-center justify-center">
            <div className="text-muted-foreground">Loading printer settings...</div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card className="bg-gradient-to-br from-primary/10 via-card to-primary/5 border-primary/30 shadow-xl overflow-hidden">
        <CardContent className="p-6">
          <div 
            className="transition-all duration-400 ease-in-out"
            style={{ 
              maxHeight: showAdvanced ? '2000px' : '500px',
            }}
          >
            {showAdvanced ? (
              <AdvancedTabs
                settings={settings}
                filament={filamentForSlicer}
                compatibleHotends={compatibleHotends}
                compatibleBuildPlates={compatibleBuildPlates}
                compatibleAms={compatibleAms}
                onChangePrinter={() => setPrinterModalOpen(true)}
                onHideAdvanced={() => setShowAdvanced(false)}
              />
            ) : (
              <QuickStartView
                settings={settings}
                filament={filamentForSlicer}
                onChangePrinter={() => setPrinterModalOpen(true)}
                onShowAdvanced={() => setShowAdvanced(true)}
              />
            )}
          </div>
        </CardContent>
      </Card>

      <PrinterSelectionModal
        open={printerModalOpen}
        onOpenChange={setPrinterModalOpen}
        onSelect={handleSelectPrinter}
        onSelectGeneric={handleSelectGeneric}
        currentPrinterId={selectedPrinter?.printer_id}
      />
    </>
  );
}
