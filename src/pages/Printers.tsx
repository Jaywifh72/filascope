import { useState, useMemo } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useNavigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { GitCompare, X, ExternalLink, Eye, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import type { Database } from "@/integrations/supabase/types";

type Printer = Database["public"]["Tables"]["printers"]["Row"] & {
  brand: { brand: string } | null;
  series: { series_name: string } | null;
};

export default function Printers() {
  const navigate = useNavigate();
  const { isAdmin } = useAuth();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedBrand, setSelectedBrand] = useState("all");
  const [selectedMaterial, setSelectedMaterial] = useState("all");
  const [hasEnclosure, setHasEnclosure] = useState(false);
  const [multiMaterial, setMultiMaterial] = useState(false);
  const [minBuildVolume, setMinBuildVolume] = useState("");
  const [selectedForCompare, setSelectedForCompare] = useState<string[]>([]);

  // Fetch brands
  const { data: brands } = useQuery({
    queryKey: ["printer-brands"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("printer_brands")
        .select("brand")
        .order("brand");
      
      if (error) throw error;
      return data.map(b => b.brand);
    },
  });

  // Fetch printers
  const { data: printers, isLoading } = useQuery({
    queryKey: ["printers-list", searchTerm, selectedBrand, selectedMaterial, hasEnclosure, multiMaterial],
    queryFn: async () => {
      let query = supabase
        .from("printers")
        .select(`
          *,
          brand:printer_brands!brand_id(brand),
          series:printer_series!series_id(series_name)
        `);

      if (searchTerm) {
        query = query.or(`model_name.ilike.%${searchTerm}%,variant_or_bundle_name.ilike.%${searchTerm}%`);
      }

      if (hasEnclosure) {
        query = query.eq("has_enclosure", true);
      }

      if (multiMaterial) {
        query = query.eq("multi_material_supported", true);
      }

      const { data, error } = await query.order("model_name");
      
      if (error) throw error;
      return data as Printer[];
    },
  });

  // Extract unique materials from all printers
  const availableMaterials = useMemo(() => {
    if (!printers) return [];
    
    const materialsSet = new Set<string>();
    printers.forEach(printer => {
      const supported = printer.official_supported_materials || printer.recommended_materials || "";
      const materials = supported.split(/[,;|]/).map(m => m.trim()).filter(m => m.length > 0);
      materials.forEach(m => materialsSet.add(m));
    });
    
    return Array.from(materialsSet).sort();
  }, [printers]);

  // Filter by brand, material, and build volume on client side
  const filteredPrinters = useMemo(() => {
    if (!printers) return [];

    return printers.filter(printer => {
      if (selectedBrand !== "all" && printer.brand?.brand !== selectedBrand) {
        return false;
      }

      if (selectedMaterial !== "all") {
        const supported = printer.official_supported_materials || printer.recommended_materials || "";
        const materials = supported.split(/[,;|]/).map(m => m.trim().toLowerCase());
        if (!materials.some(m => m.includes(selectedMaterial.toLowerCase()))) {
          return false;
        }
      }

      if (minBuildVolume) {
        const volume = (printer.build_volume_x_mm || 0) * 
                      (printer.build_volume_y_mm || 0) * 
                      (printer.build_volume_z_mm || 0);
        if (volume < parseFloat(minBuildVolume) * 1000000) {
          return false;
        }
      }

      return true;
    });
  }, [printers, selectedBrand, selectedMaterial, minBuildVolume]);

  const toggleCompareSelection = (printerId: string) => {
    setSelectedForCompare(prev => 
      prev.includes(printerId)
        ? prev.filter(id => id !== printerId)
        : [...prev, printerId]
    );
  };

  const handleCompare = () => {
    if (selectedForCompare.length > 0) {
      navigate(`/printers/compare?ids=${selectedForCompare.join(',')}`);
    }
  };

  const clearCompareSelection = () => {
    setSelectedForCompare([]);
  };

  const rescrapeMutation = useMutation({
    mutationFn: async (printerId: string) => {
      const { error } = await supabase
        .from("printers")
        .update({
          status: "pending",
          scrape_status: "not_started",
          scraped_data: null,
          scrape_error: null,
        })
        .eq("id", printerId);

      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Printer queued for rescraping");
    },
    onError: (error) => {
      toast.error("Failed to queue printer for rescraping");
      console.error(error);
    },
  });

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-[1800px] mx-auto p-6 space-y-6">
        {/* Header */}
        <div className="space-y-2">
          <h1 className="text-4xl font-bold tracking-tight">3D Printers</h1>
          <p className="text-muted-foreground">
            Browse and compare 3D printers
          </p>
        </div>

        {/* Filters */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <Input
            type="text"
            placeholder="Search by model or brand..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="md:col-span-2"
          />

          <Select value={selectedBrand} onValueChange={setSelectedBrand}>
            <SelectTrigger>
              <SelectValue placeholder="Select brand" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Brands</SelectItem>
              {brands?.map(brand => (
                <SelectItem key={brand} value={brand}>{brand}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={selectedMaterial} onValueChange={setSelectedMaterial}>
            <SelectTrigger>
              <SelectValue placeholder="Filter by material" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Materials</SelectItem>
              {availableMaterials.map(material => (
                <SelectItem key={material} value={material}>{material}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Input
            type="number"
            placeholder="Min volume (liters)"
            value={minBuildVolume}
            onChange={(e) => setMinBuildVolume(e.target.value)}
          />
        </div>

        {/* Feature Filters */}
        <div className="flex flex-wrap gap-4">
          <label className="flex items-center gap-2 cursor-pointer">
            <Checkbox 
              checked={hasEnclosure} 
              onCheckedChange={(checked) => setHasEnclosure(checked as boolean)} 
            />
            <span className="text-sm">Has Enclosure</span>
          </label>

          <label className="flex items-center gap-2 cursor-pointer">
            <Checkbox 
              checked={multiMaterial} 
              onCheckedChange={(checked) => setMultiMaterial(checked as boolean)} 
            />
            <span className="text-sm">Multi-Material Support</span>
          </label>
        </div>

        {/* Results Count */}
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold">
            {filteredPrinters?.length || 0} <span className="text-muted-foreground font-normal">printers</span>
          </h2>
        </div>

        {/* Compare Bar */}
        {selectedForCompare.length > 0 && (
          <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-card border rounded-lg shadow-lg p-4 flex items-center gap-4 z-50">
            <span className="text-sm font-medium">
              {selectedForCompare.length} printer{selectedForCompare.length !== 1 ? 's' : ''} selected
            </span>
            <Button onClick={handleCompare} size="sm" className="gap-2">
              <GitCompare className="h-4 w-4" />
              Compare
            </Button>
            <Button onClick={clearCompareSelection} variant="ghost" size="sm">
              <X className="h-4 w-4" />
            </Button>
          </div>
        )}

        {/* Printer Grid */}
        {isLoading ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">Loading printers...</p>
          </div>
        ) : filteredPrinters.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">No printers found matching your criteria</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredPrinters.map((printer) => (
              <Card key={printer.id} className="p-6 space-y-4 relative">
                {/* Compare Checkbox, View Button, and Rescrape Button */}
                <div className="absolute top-4 right-4 flex gap-2">
                  {isAdmin && printer.official_product_url && (
                    <Button 
                      variant="ghost" 
                      size="icon"
                      onClick={() => rescrapeMutation.mutate(printer.id)}
                      disabled={rescrapeMutation.isPending}
                      title="Re-scrape printer data from official product page"
                    >
                      <RefreshCw className={`h-4 w-4 ${rescrapeMutation.isPending ? 'animate-spin' : ''}`} />
                    </Button>
                  )}
                  <Link to={`/printers/${printer.id}`}>
                    <Button variant="ghost" size="icon">
                      <Eye className="h-4 w-4" />
                    </Button>
                  </Link>
                  <Checkbox
                    checked={selectedForCompare.includes(printer.printer_id)}
                    onCheckedChange={() => toggleCompareSelection(printer.printer_id)}
                  />
                </div>

                {/* Header */}
                <div className="space-y-2 pr-16">
                  <div className="text-sm text-muted-foreground">
                    {printer.brand?.brand}
                  </div>
                  <h3 className="text-xl font-bold">
                    {printer.model_name}
                  </h3>
                  {printer.series?.series_name && (
                    <Badge variant="secondary">{printer.series.series_name}</Badge>
                  )}
                  {printer.variant_or_bundle_name && (
                    <p className="text-sm text-muted-foreground">
                      {printer.variant_or_bundle_name}
                    </p>
                  )}
                </div>

                {/* Price */}
                {printer.current_price_usd_store && (
                  <div className="text-2xl font-bold text-primary">
                    ${printer.current_price_usd_store}
                  </div>
                )}

                {/* Key Specs */}
                <div className="space-y-2 text-sm">
                  {printer.build_volume_x_mm && printer.build_volume_y_mm && printer.build_volume_z_mm && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Build Volume:</span>
                      <span className="font-medium">
                        {printer.build_volume_x_mm}×{printer.build_volume_y_mm}×{printer.build_volume_z_mm}mm
                      </span>
                    </div>
                  )}
                  
                  {printer.max_nozzle_temp_c && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Max Nozzle Temp:</span>
                      <span className="font-medium">{printer.max_nozzle_temp_c}°C</span>
                    </div>
                  )}

                  {printer.bed_max_temp_c && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Max Bed Temp:</span>
                      <span className="font-medium">{printer.bed_max_temp_c}°C</span>
                    </div>
                  )}

                  {printer.max_print_speed_mms && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Max Speed:</span>
                      <span className="font-medium">{printer.max_print_speed_mms} mm/s</span>
                    </div>
                  )}
                </div>

                {/* Features */}
                <div className="flex flex-wrap gap-2">
                  {printer.has_enclosure && (
                    <Badge variant="outline">Enclosure</Badge>
                  )}
                  {printer.auto_bed_leveling && (
                    <Badge variant="outline">Auto Leveling</Badge>
                  )}
                  {printer.multi_material_supported && (
                    <Badge variant="outline">Multi-Material</Badge>
                  )}
                  {printer.has_wifi && (
                    <Badge variant="outline">WiFi</Badge>
                  )}
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}