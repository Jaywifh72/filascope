import { useParams, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft, ExternalLink, Thermometer, CircleDot, Wrench, Package, Printer } from "lucide-react";
import type { Database } from "@/integrations/supabase/types";

type Accessory = Database["public"]["Tables"]["printer_accessories"]["Row"];

export default function NozzleDetail() {
  const { id } = useParams<{ id: string }>();

  // Fetch nozzle details
  const { data: nozzle, isLoading } = useQuery({
    queryKey: ["nozzle-detail", id],
    enabled: !!id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("printer_accessories")
        .select("*")
        .eq("id", id)
        .maybeSingle();

      if (error) throw error;
      return data as Accessory | null;
    },
  });

  // Fetch compatible printers based on specs.compatible_printers field (model-level matching)
  const { data: compatiblePrinters } = useQuery({
    queryKey: ["compatible-printers", nozzle?.id, nozzle?.specs],
    enabled: !!nozzle,
    queryFn: async () => {
      if (!nozzle) return [];

      const specs = nozzle.specs as Record<string, unknown> | null;
      const compatiblePrintersStr = specs?.compatible_printers as string | undefined;
      
      // If no specific printer models listed, fall back to brand-level matching
      if (!compatiblePrintersStr) {
        const brandsToMatch = nozzle.compatible_printer_brands || [nozzle.brand].filter(Boolean);
        if (brandsToMatch.length === 0) return [];

        const { data: brands } = await supabase
          .from("printer_brands")
          .select("id, brand")
          .in("brand", brandsToMatch);

        if (!brands || brands.length === 0) return [];
        const brandIds = brands.map(b => b.id);
        
        const { data: printers, error } = await supabase
          .from("printers")
          .select(`id, model_name, brand:printer_brands!brand_id(brand)`)
          .in("brand_id", brandIds)
          .eq("status", "active")
          .order("model_name")
          .limit(50);

        if (error) throw error;
        return printers || [];
      }

      // Parse compatible printer models from specs (e.g., "Snapmaker U1" or "Snapmaker J1, J1s")
      const modelPatterns = compatiblePrintersStr
        .split(/[,;]/)
        .map(m => m.trim())
        .filter(Boolean);

      // Fetch all active printers from compatible brands
      const brandsToMatch = nozzle.compatible_printer_brands || [nozzle.brand].filter(Boolean);
      if (brandsToMatch.length === 0) return [];

      const { data: brands } = await supabase
        .from("printer_brands")
        .select("id, brand")
        .in("brand", brandsToMatch);

      if (!brands || brands.length === 0) return [];
      const brandIds = brands.map(b => b.id);

      const { data: allPrinters, error } = await supabase
        .from("printers")
        .select(`id, model_name, brand:printer_brands!brand_id(brand)`)
        .in("brand_id", brandIds)
        .eq("status", "active")
        .order("model_name");

      if (error) throw error;
      if (!allPrinters) return [];

      // Filter printers that match any of the model patterns
      const matchingPrinters = allPrinters.filter(printer => {
        const modelName = printer.model_name.toLowerCase();
        return modelPatterns.some(pattern => {
          const patternLower = pattern.toLowerCase();
          // Check if printer model contains the pattern or vice versa
          return modelName.includes(patternLower) || patternLower.includes(modelName);
        });
      });

      return matchingPrinters.slice(0, 50);
    },
  });

  // Parse specs from JSONB
  const specs = nozzle?.specs as Record<string, unknown> | null;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="max-w-5xl mx-auto p-6 space-y-6">
          <Skeleton className="h-10 w-48" />
          <Skeleton className="h-96 w-full" />
        </div>
      </div>
    );
  }

  if (!nozzle) {
    return (
      <div className="min-h-screen bg-background">
        <div className="max-w-5xl mx-auto p-6 space-y-6">
          <Link to="/printers?tab=hotends">
            <Button variant="ghost" className="gap-2">
              <ArrowLeft className="h-4 w-4" />
              Back to Hotends
            </Button>
          </Link>
          <div className="text-center py-12">
            <p className="text-muted-foreground">Hotend not found</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-5xl mx-auto p-6 space-y-6">
        {/* Back Button */}
        <Link to="/printers?tab=hotends">
          <Button variant="ghost" className="gap-2">
            <ArrowLeft className="h-4 w-4" />
            Back to Hotends
          </Button>
        </Link>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Image & Basic Info */}
          <div className="lg:col-span-1 space-y-4">
            {/* Product Image */}
            {nozzle.image_url && (
              <Card>
                <CardContent className="p-4">
                  <img
                    src={nozzle.image_url}
                    alt={nozzle.name}
                    className="w-full h-auto rounded-lg object-contain bg-muted"
                  />
                </CardContent>
              </Card>
            )}

            {/* Price & Purchase */}
            <Card>
              <CardContent className="p-4 space-y-4">
                {nozzle.price && (
                  <div className="text-3xl font-bold text-primary">
                    {nozzle.currency || "USD"} ${nozzle.price.toFixed(2)}
                  </div>
                )}
                {nozzle.product_url && (
                  <a
                    href={nozzle.product_url}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <Button className="w-full gap-2">
                      <ExternalLink className="h-4 w-4" />
                      Buy Now
                    </Button>
                  </a>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Details */}
          <div className="lg:col-span-2 space-y-4">
            {/* Header */}
            <Card>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="space-y-2">
                    <CardTitle className="text-2xl">{nozzle.name}</CardTitle>
                    {nozzle.brand && (
                      <Badge variant="secondary" className="text-sm">
                        {nozzle.brand}
                      </Badge>
                    )}
                  </div>
                  {nozzle.model && (
                    <Badge variant="outline">{nozzle.model}</Badge>
                  )}
                </div>
                {nozzle.description && (
                  <p className="text-muted-foreground mt-2">{nozzle.description}</p>
                )}
              </CardHeader>
            </Card>

            {/* Technical Specifications */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Wrench className="h-5 w-5" />
                  Technical Specifications
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  {specs?.diameter && (
                    <div className="flex items-center gap-2 p-3 bg-muted/50 rounded-lg">
                      <CircleDot className="h-5 w-5 text-muted-foreground" />
                      <div>
                        <p className="text-xs text-muted-foreground">Diameter</p>
                        <p className="font-medium">{String(specs.diameter)}mm</p>
                      </div>
                    </div>
                  )}
                  
                  {specs?.material && (
                    <div className="flex items-center gap-2 p-3 bg-muted/50 rounded-lg">
                      <Package className="h-5 w-5 text-muted-foreground" />
                      <div>
                        <p className="text-xs text-muted-foreground">Material</p>
                        <p className="font-medium">{String(specs.material)}</p>
                      </div>
                    </div>
                  )}

                  {specs?.max_temp && (
                    <div className="flex items-center gap-2 p-3 bg-muted/50 rounded-lg">
                      <Thermometer className="h-5 w-5 text-muted-foreground" />
                      <div>
                        <p className="text-xs text-muted-foreground">Max Temperature</p>
                        <p className="font-medium">{String(specs.max_temp)}°C</p>
                      </div>
                    </div>
                  )}

                  {specs?.hardened !== undefined && (
                    <div className="flex items-center gap-2 p-3 bg-muted/50 rounded-lg">
                      <Wrench className="h-5 w-5 text-muted-foreground" />
                      <div>
                        <p className="text-xs text-muted-foreground">Hardened</p>
                        <p className="font-medium">{specs.hardened ? "Yes" : "No"}</p>
                      </div>
                    </div>
                  )}

                  {specs?.thread_type && (
                    <div className="flex items-center gap-2 p-3 bg-muted/50 rounded-lg">
                      <Wrench className="h-5 w-5 text-muted-foreground" />
                      <div>
                        <p className="text-xs text-muted-foreground">Thread Type</p>
                        <p className="font-medium">{String(specs.thread_type)}</p>
                      </div>
                    </div>
                  )}

                  {specs?.mounting_interface && (
                    <div className="flex items-center gap-2 p-3 bg-muted/50 rounded-lg">
                      <Wrench className="h-5 w-5 text-muted-foreground" />
                      <div>
                        <p className="text-xs text-muted-foreground">Mounting Interface</p>
                        <p className="font-medium">{String(specs.mounting_interface)}</p>
                      </div>
                    </div>
                  )}

                  {specs?.hotend_system && (
                    <div className="flex items-center gap-2 p-3 bg-muted/50 rounded-lg">
                      <Thermometer className="h-5 w-5 text-muted-foreground" />
                      <div>
                        <p className="text-xs text-muted-foreground">Hotend System</p>
                        <p className="font-medium">{String(specs.hotend_system)}</p>
                      </div>
                    </div>
                  )}

                  {specs?.heatbreak_material && (
                    <div className="flex items-center gap-2 p-3 bg-muted/50 rounded-lg">
                      <Package className="h-5 w-5 text-muted-foreground" />
                      <div>
                        <p className="text-xs text-muted-foreground">Heatbreak Material</p>
                        <p className="font-medium">{String(specs.heatbreak_material)}</p>
                      </div>
                    </div>
                  )}

                  {specs?.heater_cartridge && (
                    <div className="flex items-center gap-2 p-3 bg-muted/50 rounded-lg">
                      <Thermometer className="h-5 w-5 text-muted-foreground" />
                      <div>
                        <p className="text-xs text-muted-foreground">Heater Cartridge</p>
                        <p className="font-medium">
                          {typeof specs.heater_cartridge === 'object' 
                            ? JSON.stringify(specs.heater_cartridge) 
                            : String(specs.heater_cartridge)}
                        </p>
                      </div>
                    </div>
                  )}

                  {specs?.thermistor_type && (
                    <div className="flex items-center gap-2 p-3 bg-muted/50 rounded-lg">
                      <Thermometer className="h-5 w-5 text-muted-foreground" />
                      <div>
                        <p className="text-xs text-muted-foreground">Thermistor Type</p>
                        <p className="font-medium">{String(specs.thermistor_type)}</p>
                      </div>
                    </div>
                  )}

                  {specs?.sustained_temp_c && (
                    <div className="flex items-center gap-2 p-3 bg-muted/50 rounded-lg">
                      <Thermometer className="h-5 w-5 text-muted-foreground" />
                      <div>
                        <p className="text-xs text-muted-foreground">Sustained Temp</p>
                        <p className="font-medium">{String(specs.sustained_temp_c)}°C</p>
                      </div>
                    </div>
                  )}

                  {specs?.cooling_method && (
                    <div className="flex items-center gap-2 p-3 bg-muted/50 rounded-lg">
                      <Wrench className="h-5 w-5 text-muted-foreground" />
                      <div>
                        <p className="text-xs text-muted-foreground">Cooling Method</p>
                        <p className="font-medium">{String(specs.cooling_method)}</p>
                      </div>
                    </div>
                  )}
                </div>

                {/* Supported Filament Types */}
                {specs?.supported_filament_types && (
                  <div className="mt-4">
                    <p className="text-sm text-muted-foreground mb-2">Supported Filament Types</p>
                    <div className="flex flex-wrap gap-2">
                      {(Array.isArray(specs.supported_filament_types) 
                        ? specs.supported_filament_types 
                        : String(specs.supported_filament_types).split(',')
                      ).map((type: string, idx: number) => (
                        <Badge key={idx} variant="outline">{String(type).trim()}</Badge>
                      ))}
                    </div>
                  </div>
                )}

                {/* Special Features */}
                {specs?.special_features && (
                  <div className="mt-4">
                    <p className="text-sm text-muted-foreground mb-2">Special Features</p>
                    <p className="text-sm">{String(specs.special_features)}</p>
                  </div>
                )}

                {/* Extraction Notes */}
                {specs?.extraction_notes && (
                  <div className="mt-4">
                    <p className="text-sm text-muted-foreground mb-2">Notes</p>
                    <p className="text-sm text-muted-foreground">{String(specs.extraction_notes)}</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Compatible Hotend Types */}
            {nozzle.compatible_hotend_types && nozzle.compatible_hotend_types.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Compatible Hotend Types</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {nozzle.compatible_hotend_types.map((type, idx) => (
                      <Badge key={idx} variant="secondary">{type}</Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Compatible Printers */}
            {compatiblePrinters && compatiblePrinters.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Printer className="h-5 w-5" />
                    Compatible Printers
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {compatiblePrinters.map((printer: { id: string; model_name: string; brand: { brand: string } | null }) => (
                      <Link
                        key={printer.id}
                        to={`/printers/${printer.id}`}
                        className="flex items-center gap-2 p-2 rounded-lg hover:bg-muted/50 transition-colors"
                      >
                        <Printer className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm">
                          {printer.brand?.brand && <span className="text-muted-foreground">{printer.brand.brand} </span>}
                          {printer.model_name}
                        </span>
                      </Link>
                    ))}
                  </div>
                  {compatiblePrinters.length >= 50 && (
                    <p className="text-sm text-muted-foreground mt-4">
                      Showing first 50 compatible printers
                    </p>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Compatible Printer Brands */}
            {nozzle.compatible_printer_brands && nozzle.compatible_printer_brands.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Compatible Printer Brands</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {nozzle.compatible_printer_brands.map((brand, idx) => (
                      <Badge key={idx} variant="outline">{brand}</Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
