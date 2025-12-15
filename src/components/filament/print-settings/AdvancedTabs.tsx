import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Printer, ChevronUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { QuickTips } from "./QuickTips";
import { WarningBanner } from "./WarningBanner";
import { TemperatureTab } from "./TemperatureTab";
import { HardwareTab } from "./HardwareTab";
import { PrintSettingsData } from "@/lib/printSettingsData";
import { SlicerActions } from "@/components/filament/SlicerActions";
import { cn } from "@/lib/utils";

interface HardwareItem {
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

interface AdvancedTabsProps {
  settings: PrintSettingsData;
  filament: {
    id: string;
    product_title: string;
    vendor?: string | null;
    material?: string | null;
    nozzle_temp_min_c?: number | null;
    nozzle_temp_max_c?: number | null;
    nozzle_temp_sweetspot_c?: number | null;
    bed_temp_min_c?: number | null;
    bed_temp_max_c?: number | null;
    fan_min_percent?: number | null;
    fan_max_percent?: number | null;
    diameter_nominal_mm?: number | null;
    density_g_cm3?: number | null;
    print_speed_max_mms?: number | null;
  };
  compatibleHotends: HardwareItem[];
  compatibleBuildPlates: HardwareItem[];
  compatibleAms: HardwareItem[];
  onChangePrinter: () => void;
  onHideAdvanced: () => void;
}

export function AdvancedTabs({
  settings,
  filament,
  compatibleHotends,
  compatibleBuildPlates,
  compatibleAms,
  onChangePrinter,
  onHideAdvanced,
}: AdvancedTabsProps) {
  const [activeTab, setActiveTab] = useState("quick-start");
  const { printerModel, printerBrand, warnings } = settings;

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-primary/10 rounded-lg">
            <Printer className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-foreground">
              Print Settings for{" "}
              <span className="text-primary">{printerModel}</span>
            </h3>
            {printerBrand && (
              <p className="text-sm text-muted-foreground">{printerBrand}</p>
            )}
          </div>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={onChangePrinter}
          className="shrink-0"
        >
          Change
        </Button>
      </div>

      {/* Warnings */}
      <WarningBanner warnings={warnings} />

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="w-full grid grid-cols-3 h-12 bg-muted/50">
          <TabsTrigger 
            value="quick-start" 
            className={cn(
              "data-[state=active]:bg-primary/10 data-[state=active]:text-primary",
              "data-[state=active]:border-b-2 data-[state=active]:border-primary"
            )}
          >
            Quick Start
          </TabsTrigger>
          <TabsTrigger 
            value="temperature"
            className={cn(
              "data-[state=active]:bg-primary/10 data-[state=active]:text-primary",
              "data-[state=active]:border-b-2 data-[state=active]:border-primary"
            )}
          >
            Temperature
          </TabsTrigger>
          <TabsTrigger 
            value="hardware"
            className={cn(
              "data-[state=active]:bg-primary/10 data-[state=active]:text-primary",
              "data-[state=active]:border-b-2 data-[state=active]:border-primary"
            )}
          >
            Hardware
          </TabsTrigger>
        </TabsList>

        {/* Quick Start Tab */}
        <TabsContent value="quick-start" className="mt-6 space-y-5 animate-fade-in">
          {/* Quick Settings Summary */}
          <div className="bg-primary/5 border border-primary/10 rounded-lg p-5 space-y-3">
            <h4 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
              Recommended Settings
            </h4>
            <div className="grid sm:grid-cols-2 gap-3">
              <div className="flex items-center justify-between p-2 bg-background/50 rounded">
                <span className="text-sm text-muted-foreground">Nozzle</span>
                <span className="font-semibold text-foreground">{settings.quickStart.nozzleTemp}°C</span>
              </div>
              <div className="flex items-center justify-between p-2 bg-background/50 rounded">
                <span className="text-sm text-muted-foreground">Bed</span>
                <span className="font-semibold text-foreground">{settings.quickStart.bedTemp}°C</span>
              </div>
              <div className="flex items-center justify-between p-2 bg-background/50 rounded">
                <span className="text-sm text-muted-foreground">Speed</span>
                <span className="font-semibold text-foreground">{settings.quickStart.printSpeed}</span>
              </div>
              <div className="flex items-center justify-between p-2 bg-background/50 rounded">
                <span className="text-sm text-muted-foreground">Surface</span>
                <span className="font-semibold text-foreground">{settings.quickStart.buildSurface.recommended}</span>
              </div>
            </div>
          </div>

          {/* Quick Tips */}
          <QuickTips material={filament.material || null} />

          {/* Download Profile */}
          <SlicerActions
            filament={filament}
            printerBrand={printerBrand}
            printerName={printerModel}
          />

          <p className="text-sm text-muted-foreground text-center">
            Need to adjust? See <button onClick={() => setActiveTab("temperature")} className="text-primary hover:underline">Temperature tab</button> for guidance
          </p>
        </TabsContent>

        {/* Temperature Tab */}
        <TabsContent value="temperature" className="mt-6 animate-fade-in">
          <TemperatureTab settings={settings} />
        </TabsContent>

        {/* Hardware Tab */}
        <TabsContent value="hardware" className="mt-6 animate-fade-in">
          <HardwareTab
            compatibleHotends={compatibleHotends}
            compatibleBuildPlates={compatibleBuildPlates}
            compatibleAms={compatibleAms}
            printerModel={printerModel}
          />
        </TabsContent>
      </Tabs>

      {/* Hide Advanced Settings Toggle */}
      <button
        onClick={onHideAdvanced}
        className="w-full flex items-center justify-center gap-2 text-sm text-primary hover:text-primary/80 transition-colors py-2"
      >
        <span>Hide advanced settings</span>
        <ChevronUp className="w-4 h-4" />
      </button>
    </div>
  );
}
