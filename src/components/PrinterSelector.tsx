import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Loader2, Printer } from "lucide-react";
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
  } = usePrinterSelection();

  return (
    <div className="space-y-4 p-4 bg-card rounded-lg border">
      <div className="flex items-center gap-2">
        <Printer className="h-5 w-5 text-primary" />
        <h3 className="font-semibold">Your Printer</h3>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Brand Selection */}
        <div className="space-y-2">
          <Label htmlFor="printer-brand">Brand</Label>
          {brandsLoading ? (
            <div className="flex items-center justify-center h-10 border rounded-md">
              <Loader2 className="h-4 w-4 animate-spin" />
            </div>
          ) : (
            <Select value={selectedBrand} onValueChange={setSelectedBrand}>
              <SelectTrigger id="printer-brand">
                <SelectValue placeholder="Select printer brand" />
              </SelectTrigger>
              <SelectContent>
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
        <div className="space-y-2">
          <Label htmlFor="printer-model">Model</Label>
          {modelsLoading ? (
            <div className="flex items-center justify-center h-10 border rounded-md">
              <Loader2 className="h-4 w-4 animate-spin" />
            </div>
          ) : (
            <Select
              value={selectedPrinterId}
              onValueChange={setSelectedPrinterId}
              disabled={!selectedBrand || !models || models.length === 0}
            >
              <SelectTrigger id="printer-model">
                <SelectValue placeholder="Select printer model" />
              </SelectTrigger>
              <SelectContent>
                {models?.map((model) => (
                  <SelectItem key={model.id} value={model.printer_id}>
                    {model.model_name}
                    {model.series?.series_name && ` (${model.series.series_name})`}
                    {model.variant_or_bundle_name && ` - ${model.variant_or_bundle_name}`}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>
      </div>

      {!selectedBrand && (
        <p className="text-sm text-muted-foreground">
          Select your printer to see compatibility information and recommendations
        </p>
      )}
    </div>
  );
}