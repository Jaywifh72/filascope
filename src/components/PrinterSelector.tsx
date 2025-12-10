import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Loader2, Printer, Flame } from "lucide-react";
import { usePrinterSelection } from "@/hooks/usePrinterSelection";

export function PrinterSelector() {
  const {
    brands,
    brandsLoading,
    selectedBrand,
    setSelectedBrand,
    models,
    modelsLoading,
    selectedPrinterId,
    setSelectedPrinterId,
    compatibleHotends,
    hotendsLoading,
    selectedHotendId,
    setSelectedHotendId,
  } = usePrinterSelection();

  return (
    <div className="p-4 bg-card rounded-lg border">
      <div className="flex items-center gap-2 mb-4">
        <Printer className="h-5 w-5 text-primary" />
        <h3 className="font-semibold">Your Printer</h3>
      </div>
      
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-end max-w-2xl">
        {/* Brand Selection */}
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="printer-brand" className="text-sm font-medium">
            Brand
          </Label>
          {brandsLoading ? (
            <div className="flex items-center justify-center h-9 border rounded-md bg-muted/50">
              <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <Select value={selectedBrand} onValueChange={setSelectedBrand}>
              <SelectTrigger id="printer-brand" className="h-9">
                <SelectValue placeholder="Select brand" />
              </SelectTrigger>
              <SelectContent className="bg-popover">
                {brands?.map((brand) => (
                  <SelectItem key={brand.id} value={brand.brand}>
                    {brand.brand}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>

        {/* Model Selection */}
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="printer-model" className="text-sm font-medium">
            Model
          </Label>
          {modelsLoading ? (
            <div className="flex items-center justify-center h-9 border rounded-md bg-muted/50">
              <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <Select
              value={selectedPrinterId}
              onValueChange={setSelectedPrinterId}
              disabled={!selectedBrand || !models || models.length === 0}
            >
              <SelectTrigger id="printer-model" className="h-9">
                <SelectValue placeholder="Select model" />
              </SelectTrigger>
              <SelectContent className="bg-popover">
                {models?.map((model) => (
                  <SelectItem key={model.id} value={model.printer_id}>
                    {model.model_name}
                    {model.variant_or_bundle_name && ` - ${model.variant_or_bundle_name}`}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>

        {/* Hotend Selection */}
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="printer-hotend" className="text-sm font-medium flex items-center gap-1.5">
            <Flame className="h-3.5 w-3.5 text-orange-500" />
            Hotend
            {compatibleHotends && compatibleHotends.length > 0 && (
              <span className="text-xs text-muted-foreground font-normal">
                ({compatibleHotends.length})
              </span>
            )}
          </Label>
          {hotendsLoading ? (
            <div className="flex items-center justify-center h-9 border rounded-md bg-muted/50">
              <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <Select
              value={selectedHotendId}
              onValueChange={setSelectedHotendId}
              disabled={!selectedPrinterId || !compatibleHotends || compatibleHotends.length === 0}
            >
              <SelectTrigger id="printer-hotend" className="h-9">
                <SelectValue placeholder={
                  !selectedPrinterId 
                    ? "Select printer first" 
                    : compatibleHotends?.length === 0 
                      ? "No compatible hotends" 
                      : "Optional"
                } />
              </SelectTrigger>
              <SelectContent className="bg-popover max-h-60">
                {compatibleHotends?.map((hotend) => {
                  const specs = hotend.specs as Record<string, unknown> | null;
                  const diameter = specs?.diameter_mm || specs?.diameter;
                  return (
                    <SelectItem key={hotend.id} value={hotend.id}>
                      {hotend.name}
                      {diameter && ` (${diameter}mm)`}
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
          )}
        </div>
      </div>

      {!selectedBrand && (
        <p className="text-sm text-muted-foreground mt-3">
          Select your printer to see compatibility information and recommendations
        </p>
      )}
    </div>
  );
}
