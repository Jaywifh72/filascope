import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Grid3x3, Filter, Info } from "lucide-react";
import { usePrinterSelection } from "@/hooks/usePrinterSelection";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { checkPrinterFilamentCompatibility } from "@/lib/printerCompatibility";
import { CompatibilityBadge } from "@/components/CompatibilityBadge";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useState, useMemo } from "react";
import { DocumentHead } from "@/components/seo/DocumentHead";
import type { Database } from "@/integrations/supabase/types";
import { MatrixPrinterSelector } from "@/components/matrix/MatrixPrinterSelector";
import { PopularPrinterCards, type PopularPrinter } from "@/components/matrix/PopularPrinterCards";
import { SampleMatrixPreview } from "@/components/matrix/SampleMatrixPreview";

type Filament = Database["public"]["Tables"]["filaments"]["Row"];

const Matrix = () => {
  const {
    brands,
    brandsLoading,
    selectedBrand,
    setSelectedBrand,
    models,
    modelsLoading,
    selectedPrinterId,
    setSelectedPrinterId,
    selectedPrinter,
    printerLoading,
    compatibleHotends,
    hotendsLoading,
    selectedHotendId,
    setSelectedHotendId,
    firmwareVersions,
    firmwareLoading,
    selectedFirmwareVersion,
    setSelectedFirmwareVersion,
    latestFirmware,
    hasNewerFirmware,
  } = usePrinterSelection();

  const [searchQuery, setSearchQuery] = useState("");
  const [materialFilter, setMaterialFilter] = useState<string>("all");
  const [compatibilityFilter, setCompatibilityFilter] = useState<string>("all");

  const { data: filaments, isLoading: filamentsLoading } = useQuery({
    queryKey: ["filaments"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("filaments")
        .select("*")
        .order("vendor")
        .order("product_title");

      if (error) throw error;
      return data as Filament[];
    },
  });

  const compatibilityResults = useMemo(() => {
    if (!selectedPrinter || !filaments) return [];

    return filaments.map((filament) => ({
      filament,
      compatibility: checkPrinterFilamentCompatibility(selectedPrinter, filament),
    }));
  }, [selectedPrinter, filaments]);

  const filteredResults = useMemo(() => {
    return compatibilityResults.filter((result) => {
      const matchesSearch =
        (result.filament.product_title || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        result.filament.vendor?.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesMaterial =
        materialFilter === "all" ||
        result.filament.material === materialFilter;

      const matchesCompatibility =
        compatibilityFilter === "all" ||
        (compatibilityFilter === "compatible" && result.compatibility.is_supported) ||
        (compatibilityFilter === "easy" && result.compatibility.ease_rating === "Easy") ||
        (compatibilityFilter === "medium" && result.compatibility.ease_rating === "Medium") ||
        (compatibilityFilter === "hard" && result.compatibility.ease_rating === "Hard") ||
        (compatibilityFilter === "not-compatible" && !result.compatibility.is_supported);

      return matchesSearch && matchesMaterial && matchesCompatibility;
    });
  }, [compatibilityResults, searchQuery, materialFilter, compatibilityFilter]);

  const uniqueMaterials = useMemo(() => {
    if (!filaments) return [];
    const materials = new Set(filaments.map((f) => f.material).filter(Boolean));
    return Array.from(materials).sort();
  }, [filaments]);

  const isLoading = printerLoading || filamentsLoading;

  const handlePopularSelect = (printer: PopularPrinter) => {
    setSelectedBrand(printer.brand);
    // Small delay to let models load, then set printer ID
    setTimeout(() => {
      setSelectedPrinterId(printer.printer_id);
    }, 100);
  };

  const printerDisplayName = selectedPrinter
    ? `${typeof selectedPrinter.brand === "object" && selectedPrinter.brand !== null && "brand" in selectedPrinter.brand ? selectedPrinter.brand.brand : ""} ${selectedPrinter.model_name}`.trim()
    : "";

  return (
    <>
      <DocumentHead
        title="Compatibility Matrix — FilaScope"
        description="Check which filaments are compatible with your 3D printer. Get recommended print settings for every material type."
      />

      <div className="min-h-screen bg-gradient-to-br from-background via-background to-accent/5 p-4 md:p-8">
        <div className="max-w-7xl mx-auto space-y-6">
          {/* Header */}
          <div>
            <h1 className="text-3xl sm:text-4xl font-bold mb-2 bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
              Compatibility Matrix
            </h1>
            <p className="text-muted-foreground max-w-2xl">
              Select your printer below to see which filaments are compatible with it, with recommended print settings for each material.
            </p>
          </div>

          {/* Printer Selector — full-width dropdowns */}
          <MatrixPrinterSelector
            brands={brands}
            brandsLoading={brandsLoading}
            selectedBrand={selectedBrand}
            setSelectedBrand={setSelectedBrand}
            models={models}
            modelsLoading={modelsLoading}
            selectedPrinterId={selectedPrinterId}
            setSelectedPrinterId={setSelectedPrinterId}
            firmwareVersions={firmwareVersions}
            firmwareLoading={firmwareLoading}
            selectedFirmwareVersion={selectedFirmwareVersion}
            setSelectedFirmwareVersion={setSelectedFirmwareVersion}
            compatibleHotends={compatibleHotends}
            hotendsLoading={hotendsLoading}
            selectedHotendId={selectedHotendId}
            setSelectedHotendId={setSelectedHotendId}
            latestFirmware={latestFirmware}
            hasNewerFirmware={hasNewerFirmware}
          />

          {/* No printer selected — show guidance */}
          {!selectedPrinter && !isLoading && (
            <div className="space-y-6">
              {/* Popular printers quick-select */}
              <PopularPrinterCards
                onSelect={handlePopularSelect}
                selectedPrinterId={selectedPrinterId}
              />

              {/* Sample matrix preview */}
              <SampleMatrixPreview />

              {/* Info hint */}
              <div className="flex items-start gap-3 p-4 rounded-lg bg-muted/30 border border-border/50">
                <Info className="w-5 h-5 text-primary mt-0.5 shrink-0" />
                <div className="text-sm text-muted-foreground space-y-1">
                  <p className="font-medium text-foreground/80">How it works</p>
                  <p>
                    The compatibility matrix checks each filament against your printer's specifications — nozzle temperature limits, bed temperature, enclosure requirements, and material compatibility. Results are rated as Easy, Medium, or Hard based on how well your setup matches each filament's requirements.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Printer selected — show filters + results */}
          {selectedPrinter && (
            <>
              <Card className="border-border">
                <CardHeader>
                  <CardTitle className="flex items-center gap-3">
                    <Filter className="w-5 h-5 text-primary" />
                    Filters
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Search</label>
                      <Input
                        placeholder="Search by name or brand..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Material Type</label>
                      <Select value={materialFilter} onValueChange={setMaterialFilter}>
                        <SelectTrigger className="w-full">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-popover">
                          <SelectItem value="all">All Materials</SelectItem>
                          {uniqueMaterials.map((material) => (
                            <SelectItem key={material} value={material!}>
                              {material}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Compatibility</label>
                      <Select value={compatibilityFilter} onValueChange={setCompatibilityFilter}>
                        <SelectTrigger className="w-full">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-popover">
                          <SelectItem value="all">All Filaments</SelectItem>
                          <SelectItem value="compatible">Compatible Only</SelectItem>
                          <SelectItem value="easy">Easy to Print</SelectItem>
                          <SelectItem value="medium">Medium Difficulty</SelectItem>
                          <SelectItem value="hard">Hard to Print</SelectItem>
                          <SelectItem value="not-compatible">Not Compatible</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Showing {filteredResults.length} of {compatibilityResults.length} filaments
                  </div>
                </CardContent>
              </Card>

              <Card className="border-border">
                <CardHeader>
                  <CardTitle className="flex items-center gap-3">
                    <Grid3x3 className="w-5 h-5 text-primary" />
                    Filament Compatibility for {printerDisplayName}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {isLoading ? (
                    <div className="text-center py-12">
                      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto" />
                      <p className="mt-4 text-muted-foreground">Loading compatibility data...</p>
                    </div>
                  ) : filteredResults.length === 0 ? (
                    <div className="text-center py-12 text-muted-foreground">
                      <p>No filaments match your filters</p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {filteredResults.map(({ filament, compatibility }) => (
                        <div
                          key={filament.id}
                          className="flex items-center justify-between p-4 rounded-lg border border-border hover:bg-accent/5 transition-colors"
                        >
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-3 mb-1">
                              <h3 className="font-semibold truncate">{filament.product_title}</h3>
                              {filament.material && (
                                <Badge variant="secondary">{filament.material}</Badge>
                              )}
                            </div>
                            <p className="text-sm text-muted-foreground">{filament.vendor}</p>
                            {compatibility.limitations && compatibility.limitations.length > 0 && (
                              <div className="mt-2 text-xs text-muted-foreground">
                                {compatibility.limitations.slice(0, 2).join(" • ")}
                              </div>
                            )}
                          </div>
                          <div className="ml-4">
                            <CompatibilityBadge compatibility={compatibility} />
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </>
          )}
        </div>
      </div>
    </>
  );
};

export default Matrix;
