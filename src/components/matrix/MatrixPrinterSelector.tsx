import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Loader2, Printer, Flame, FileCode, AlertTriangle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface MatrixPrinterSelectorProps {
  brands: { id: string; brand: string }[] | undefined;
  brandsLoading: boolean;
  selectedBrand: string;
  setSelectedBrand: (v: string) => void;
  models: { id: string; printer_id: string; model_name: string; variant_or_bundle_name: string | null }[] | undefined;
  modelsLoading: boolean;
  selectedPrinterId: string;
  setSelectedPrinterId: (v: string) => void;
  firmwareVersions: { id: string; version: string; is_latest: boolean; release_date: string | null }[] | undefined;
  firmwareLoading: boolean;
  selectedFirmwareVersion: string;
  setSelectedFirmwareVersion: (v: string) => void;
  compatibleHotends: { id: string; name: string; specs: unknown }[] | undefined;
  hotendsLoading: boolean;
  selectedHotendId: string;
  setSelectedHotendId: (v: string) => void;
  latestFirmware: { version: string; release_date: string | null } | null;
  hasNewerFirmware: boolean;
}

export function MatrixPrinterSelector({
  brands,
  brandsLoading,
  selectedBrand,
  setSelectedBrand,
  models,
  modelsLoading,
  selectedPrinterId,
  setSelectedPrinterId,
  firmwareVersions,
  firmwareLoading,
  selectedFirmwareVersion,
  setSelectedFirmwareVersion,
  compatibleHotends,
  hotendsLoading,
  selectedHotendId,
  setSelectedHotendId,
  latestFirmware,
  hasNewerFirmware,
}: MatrixPrinterSelectorProps) {
  return (
    <div className="p-5 bg-card rounded-xl border border-border space-y-4">
      <div className="flex items-center gap-2">
        <Printer className="h-5 w-5 text-primary" />
        <h2 className="font-semibold text-lg">Your Printer</h2>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Brand */}
        <div className="space-y-1.5">
          <Label htmlFor="matrix-brand" className="text-sm font-medium">Brand</Label>
          {brandsLoading ? (
            <div className="flex items-center justify-center h-10 border rounded-md bg-muted/50">
              <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <Select value={selectedBrand} onValueChange={setSelectedBrand}>
              <SelectTrigger id="matrix-brand" className="w-full h-10">
                <SelectValue placeholder="Select Brand" />
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

        {/* Model */}
        <div className="space-y-1.5">
          <Label htmlFor="matrix-model" className="text-sm font-medium">Model</Label>
          {modelsLoading ? (
            <div className="flex items-center justify-center h-10 border rounded-md bg-muted/50">
              <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <Select
              value={selectedPrinterId}
              onValueChange={setSelectedPrinterId}
              disabled={!selectedBrand || !models || models.length === 0}
            >
              <SelectTrigger id="matrix-model" className="w-full h-10">
                <SelectValue placeholder={!selectedBrand ? "Select brand first" : "Select Model"} />
              </SelectTrigger>
              <SelectContent className="bg-popover">
                {models?.map((model) => (
                  <SelectItem key={model.id} value={model.printer_id}>
                    {model.model_name}
                    {model.variant_or_bundle_name && ` – ${model.variant_or_bundle_name}`}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>

        {/* Firmware */}
        <div className="space-y-1.5">
          <Label htmlFor="matrix-firmware" className="text-sm font-medium flex items-center gap-1.5">
            <FileCode className="h-3.5 w-3.5 text-blue-500" />
            Firmware
          </Label>
          {firmwareLoading ? (
            <div className="flex items-center justify-center h-10 border rounded-md bg-muted/50">
              <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <Select
              value={selectedFirmwareVersion}
              onValueChange={setSelectedFirmwareVersion}
              disabled={!selectedPrinterId || !firmwareVersions || firmwareVersions.length === 0}
            >
              <SelectTrigger id="matrix-firmware" className="w-full h-10">
                <SelectValue placeholder={
                  !selectedPrinterId
                    ? "Select model first"
                    : firmwareVersions?.length === 0
                      ? "No firmware data"
                      : "Select Firmware"
                } />
              </SelectTrigger>
              <SelectContent className="bg-popover max-h-60">
                {firmwareVersions?.map((fw) => (
                  <SelectItem key={fw.id} value={fw.version}>
                    {fw.version}
                    {fw.is_latest && " (Latest)"}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>

        {/* Hotend */}
        <div className="space-y-1.5">
          <Label htmlFor="matrix-hotend" className="text-sm font-medium flex items-center gap-1.5">
            <Flame className="h-3.5 w-3.5 text-orange-500" />
            Hotend
            {compatibleHotends && compatibleHotends.length > 0 && (
              <span className="text-xs text-muted-foreground font-normal">
                ({compatibleHotends.length})
              </span>
            )}
          </Label>
          {hotendsLoading ? (
            <div className="flex items-center justify-center h-10 border rounded-md bg-muted/50">
              <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <Select
              value={selectedHotendId}
              onValueChange={setSelectedHotendId}
              disabled={!selectedPrinterId || !compatibleHotends || compatibleHotends.length === 0}
            >
              <SelectTrigger id="matrix-hotend" className="w-full h-10">
                <SelectValue placeholder={
                  !selectedPrinterId
                    ? "Select model first"
                    : compatibleHotends?.length === 0
                      ? "No compatible hotends"
                      : "Select Hotend (optional)"
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

      {/* Firmware update alert */}
      {hasNewerFirmware && latestFirmware && (
        <Alert className="border-amber-500/50 bg-amber-500/10">
          <AlertTriangle className="h-4 w-4 text-amber-500" />
          <AlertDescription className="text-sm">
            <span className="font-medium text-amber-600 dark:text-amber-400">Firmware update available!</span>
            {" "}You're on <span className="font-mono text-xs bg-muted px-1 py-0.5 rounded">{selectedFirmwareVersion}</span>,
            latest is <span className="font-mono text-xs bg-primary/10 text-primary px-1 py-0.5 rounded">{latestFirmware.version}</span>
            {latestFirmware.release_date && (
              <span className="text-muted-foreground"> (released {new Date(latestFirmware.release_date).toLocaleDateString()})</span>
            )}
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}
