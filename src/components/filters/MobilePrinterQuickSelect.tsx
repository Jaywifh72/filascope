import { useState } from "react";
import { Printer, ChevronDown, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { usePrinterSelection } from "@/hooks/usePrinterSelection";
import { useNozzleConfig } from "@/hooks/useNozzleConfig";
import { cn } from "@/lib/utils";

interface MobilePrinterQuickSelectProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

export function MobilePrinterQuickSelect({ isOpen, onOpenChange }: MobilePrinterQuickSelectProps) {
  const { 
    selectedPrinter, 
    brands, 
    models, 
    selectedBrand,
    setSelectedBrand,
    selectedPrinterId,
    setSelectedPrinterId,
  } = usePrinterSelection();

  const nozzleConfig = useNozzleConfig(selectedPrinter?.stock_nozzle_diameter_mm);

  const handleDone = () => {
    onOpenChange(false);
  };

  return (
    <Sheet open={isOpen} onOpenChange={onOpenChange}>
      <SheetContent 
        side="bottom" 
        className="h-auto max-h-[60vh] p-0 bg-gray-900/98 border-t border-gray-700 rounded-t-2xl backdrop-blur-xl"
      >
        <SheetHeader className="px-4 py-4 border-b border-gray-800">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-lg bg-primary/10 border border-primary/20">
                <Printer className="h-4 w-4 text-primary" />
              </div>
              <SheetTitle className="text-base font-semibold text-white">
                Select Your Printer
              </SheetTitle>
            </div>
            <button 
              onClick={() => onOpenChange(false)}
              className="rounded-full p-2.5 hover:bg-white/10 transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </SheetHeader>

        <div className="p-4 space-y-4">
          {/* Brand Select */}
          <div className="space-y-2">
            <label className="text-sm text-gray-400">Brand</label>
            <Select
              value={selectedBrand || ""}
              onValueChange={(val) => {
                setSelectedBrand(val);
                setSelectedPrinterId("");
              }}
            >
              <SelectTrigger className="w-full h-12 bg-gray-800 border-gray-700 text-white">
                <SelectValue placeholder="Select brand..." />
              </SelectTrigger>
              <SelectContent className="bg-gray-800 border-gray-700 z-[100]">
                {brands?.map((brand) => (
                  <SelectItem 
                    key={brand.id} 
                    value={brand.brand} 
                    className="text-white hover:bg-gray-700 min-h-[44px]"
                  >
                    {brand.brand}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Model Select */}
          {selectedBrand && (
            <div className="space-y-2">
              <label className="text-sm text-gray-400">Model</label>
              <Select
                value={selectedPrinterId || ""}
                onValueChange={setSelectedPrinterId}
              >
                <SelectTrigger className="w-full h-12 bg-gray-800 border-gray-700 text-white">
                  <SelectValue placeholder="Select model..." />
                </SelectTrigger>
                <SelectContent className="bg-gray-800 border-gray-700 z-[100]">
                  {models?.map((model) => (
                    <SelectItem 
                      key={model.printer_id} 
                      value={model.printer_id} 
                      className="text-white hover:bg-gray-700 min-h-[44px]"
                    >
                      {model.model_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Printer Specs Preview */}
          {selectedPrinter && (
            <div className="grid grid-cols-3 gap-3 pt-2">
              <div className="text-center p-3 rounded-lg bg-gray-800/70 border border-gray-700">
                <div className="text-xs text-gray-500 mb-1">Nozzle</div>
                <div className="text-base font-semibold text-white">{nozzleConfig.size}mm</div>
              </div>
              <div className="text-center p-3 rounded-lg bg-gray-800/70 border border-gray-700">
                <div className="text-xs text-gray-500 mb-1">Max Temp</div>
                <div className="text-base font-semibold text-white">{selectedPrinter.max_nozzle_temp_c || '--'}°C</div>
              </div>
              <div className="text-center p-3 rounded-lg bg-gray-800/70 border border-gray-700">
                <div className="text-xs text-gray-500 mb-1">Speed</div>
                <div className="text-base font-semibold text-white">{selectedPrinter.max_print_speed_mms || '--'}</div>
              </div>
            </div>
          )}
        </div>

        {/* Done Button */}
        <div className="p-4 border-t border-gray-800 pb-[max(1rem,env(safe-area-inset-bottom))]">
          <Button onClick={handleDone} className="w-full h-12">
            Done
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
