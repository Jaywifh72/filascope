import { useState } from "react";
import { Printer, ChevronRight, Flame } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { usePrinterSelection } from "@/hooks/usePrinterSelection";
import { PrinterSelectionModal } from "./PrinterSelectionModal";
import { toast } from "sonner";

interface PrinterContextBarProps {
  compatibleCount: number;
}

// Generic profile display names
const GENERIC_PROFILE_NAMES: Record<string, string> = {
  "direct-drive-all-metal": "Direct Drive (All Metal)",
  "direct-drive-standard": "Direct Drive (Standard)",
  "bowden-standard": "Bowden Setup",
  "corexy-enclosed": "CoreXY Enclosed",
};

export function PrinterContextBar({ compatibleCount }: PrinterContextBarProps) {
  const { 
    selectedPrinter, 
    selectedBrand, 
    setSelectedBrand, 
    setSelectedPrinterId,
    genericProfile,
    setGenericProfile,
    clearPrinter,
    compatibleHotends,
    hotendsLoading,
    selectedHotendId,
    setSelectedHotendId,
    selectedHotend,
  } = usePrinterSelection();
  
  const [modalOpen, setModalOpen] = useState(false);

  const hasPrinter = selectedPrinter && selectedBrand;
  const hasGenericProfile = !!genericProfile;
  
  const printerName = hasPrinter 
    ? `${selectedPrinter.brand?.brand || selectedBrand} ${selectedPrinter.model_name}`
    : hasGenericProfile
    ? GENERIC_PROFILE_NAMES[genericProfile] || genericProfile
    : null;

  const handleSelectPrinter = (printerId: string, brand: string, modelName: string) => {
    // Clear any generic profile
    localStorage.removeItem("generic_printer_profile");
    
    setSelectedBrand(brand);
    setSelectedPrinterId(printerId);
    
    toast.success(`Printer updated to ${brand} ${modelName}`, {
      icon: "✓",
      duration: 3000,
    });
  };

  const handleSelectGeneric = (profileType: string) => {
    setGenericProfile(profileType);
    
    const profileName = GENERIC_PROFILE_NAMES[profileType] || profileType;
    toast.success(`Profile set to ${profileName}`, {
      icon: "✓",
      duration: 3000,
    });
  };

  const handleHotendChange = (hotendId: string) => {
    if (hotendId === "stock") {
      setSelectedHotendId("");
      toast.success("Using stock hotend");
    } else {
      setSelectedHotendId(hotendId);
      const hotend = compatibleHotends?.find(h => h.id === hotendId);
      if (hotend) {
        toast.success(`Hotend set to ${hotend.name}`);
      }
    }
  };

  return (
    <>
      <div className="sticky top-0 z-40 bg-card/95 backdrop-blur-sm border-b border-border">
        <div className="max-w-[1800px] mx-auto px-4 lg:px-6 h-14 flex items-center justify-between gap-4">
          {hasPrinter || hasGenericProfile ? (
            <>
              <div className="flex items-center gap-3 flex-wrap min-w-0">
                {/* Printer Selection */}
                <div className="flex items-center gap-2 text-primary shrink-0">
                  <Printer className="h-5 w-5" />
                  <span className="font-medium hidden sm:inline">Your Printer:</span>
                </div>
                <span className="font-semibold text-foreground truncate">{printerName}</span>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => setModalOpen(true)}
                  className="text-muted-foreground hover:text-foreground h-7 px-2 shrink-0"
                >
                  Change
                  <ChevronRight className="h-4 w-4 ml-1" />
                </Button>

                {/* Hotend Selection - only show when a printer is selected (not generic) */}
                {hasPrinter && compatibleHotends && compatibleHotends.length > 0 && (
                  <div className="flex items-center gap-2 ml-2 pl-2 border-l border-border shrink-0">
                    <Flame className="h-4 w-4 text-orange-500" />
                    <span className="text-sm text-muted-foreground hidden md:inline">Hotend:</span>
                    <Select
                      value={selectedHotendId || "stock"}
                      onValueChange={handleHotendChange}
                      disabled={hotendsLoading}
                    >
                      <SelectTrigger className="h-7 w-[160px] text-xs bg-background">
                        <SelectValue placeholder="Select hotend" />
                      </SelectTrigger>
                      <SelectContent className="bg-popover z-50">
                        <SelectItem value="stock">Stock Hotend</SelectItem>
                        {compatibleHotends.map((hotend) => (
                          <SelectItem key={hotend.id} value={hotend.id}>
                            {hotend.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </div>
              <div className="text-sm text-muted-foreground shrink-0">
                <span className="hidden sm:inline">Showing </span>
                <span className="text-primary font-semibold">{compatibleCount.toLocaleString()}</span>
                <span className="hidden sm:inline"> compatible materials</span>
              </div>
            </>
          ) : (
            <>
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Printer className="h-5 w-5" />
                  <span className="font-medium">No printer selected</span>
                </div>
              </div>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => setModalOpen(true)}
                className="border-primary/50 text-primary hover:bg-primary/10"
              >
                Select Your Printer
                <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </>
          )}
        </div>
      </div>

      <PrinterSelectionModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        onSelect={handleSelectPrinter}
        onSelectGeneric={handleSelectGeneric}
        currentPrinterId={selectedPrinter?.printer_id}
      />
    </>
  );
}
