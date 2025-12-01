import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Grid3x3, Filter } from "lucide-react";
import { usePrinterSelection } from "@/hooks/usePrinterSelection";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { checkPrinterFilamentCompatibility } from "@/lib/printerCompatibility";
import { CompatibilityBadge } from "@/components/CompatibilityBadge";
import { PrinterSelector } from "@/components/PrinterSelector";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useState, useMemo } from "react";
import type { Database } from "@/integrations/supabase/types";

type Filament = Database["public"]["Tables"]["filaments"]["Row"];

const Matrix = () => {
  const { selectedPrinter, printerLoading } = usePrinterSelection();
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

    return filaments.map(filament => ({
      filament,
      compatibility: checkPrinterFilamentCompatibility(selectedPrinter, filament),
    }));
  }, [selectedPrinter, filaments]);

  const filteredResults = useMemo(() => {
    return compatibilityResults.filter(result => {
      const matchesSearch = 
        result.filament.product_title.toLowerCase().includes(searchQuery.toLowerCase()) ||
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
    const materials = new Set(filaments.map(f => f.material).filter(Boolean));
    return Array.from(materials).sort();
  }, [filaments]);

  const isLoading = printerLoading || filamentsLoading;

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-accent/5 p-4 md:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        <div>
          <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
            Compatibility Matrix
          </h1>
          <p className="text-muted-foreground">Check which filaments work with your printer</p>
        </div>

        <PrinterSelector />

        {!selectedPrinter && !isLoading && (
          <Card className="border-border">
            <CardContent className="py-12 text-center">
              <Grid3x3 className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
              <p className="text-lg font-medium mb-2">Select a Printer</p>
              <p className="text-sm text-muted-foreground">Choose your 3D printer above to see compatible filaments</p>
            </CardContent>
          </Card>
        )}

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
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Materials</SelectItem>
                        {uniqueMaterials.map(material => (
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
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
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
                  Filament Compatibility for {selectedPrinter.brand?.brand} {selectedPrinter.model_name}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="text-center py-12">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
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
  );
};

export default Matrix;
