import { useParams, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft, ExternalLink, Square, Check, X } from "lucide-react";
import { getBrandLogo } from "@/lib/brandLogos";

export default function BuildPlateDetail() {
  const { id } = useParams<{ id: string }>();

  const { data: buildPlate, isLoading } = useQuery({
    queryKey: ["build-plate-detail", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("printer_accessories")
        .select("*")
        .eq("id", id)
        .single();
      
      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });

  // Fetch compatible printers
  const { data: compatiblePrinters } = useQuery({
    queryKey: ["build-plate-compatible-printers", id, buildPlate?.brand],
    queryFn: async () => {
      if (!buildPlate) return [];
      
      let query = supabase
        .from("printers")
        .select(`
          id,
          model_name,
          brand:printer_brands!brand_id(brand)
        `)
        .limit(20);
      
      // If plate has specific printer_id, use that
      if (buildPlate.printer_id) {
        query = query.eq("id", buildPlate.printer_id);
      } else if (buildPlate.compatible_printer_brands?.length) {
        // Otherwise check brand compatibility
        const { data } = await supabase
          .from("printers")
          .select(`
            id,
            model_name,
            brand:printer_brands!brand_id(brand)
          `)
          .limit(50);
        
        return data?.filter(p => 
          buildPlate.compatible_printer_brands?.includes(p.brand?.brand || '')
        ) || [];
      } else if (buildPlate.brand) {
        // Fall back to same brand
        const { data: brandData } = await supabase
          .from("printer_brands")
          .select("id")
          .eq("brand", buildPlate.brand)
          .single();
        
        if (brandData) {
          query = query.eq("brand_id", brandData.id);
        }
      }
      
      const { data } = await query;
      return data || [];
    },
    enabled: !!buildPlate,
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background p-6">
        <div className="max-w-6xl mx-auto space-y-6">
          <Skeleton className="h-10 w-48" />
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <Skeleton className="aspect-square" />
            <div className="space-y-4">
              <Skeleton className="h-8 w-64" />
              <Skeleton className="h-6 w-32" />
              <Skeleton className="h-40" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!buildPlate) {
    return (
      <div className="min-h-screen bg-background p-6">
        <div className="max-w-6xl mx-auto text-center py-12">
          <h1 className="text-2xl font-bold mb-4">Build Plate Not Found</h1>
          <Link to={{ pathname: "/printers", search: "?tab=build-plates" }}>
            <Button variant="outline">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Build Plates
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  const specs = buildPlate.specs as Record<string, unknown> | null;
  const brandLogo = buildPlate.brand ? getBrandLogo(buildPlate.brand) : null;

  // Extract spec fields
  const surface = specs?.surface as string | undefined;
  const isMagnetic = specs?.magnetic as boolean | undefined;
  const sizeX = specs?.size_x_mm as number | undefined;
  const sizeY = specs?.size_y_mm as number | undefined;
  const thickness = specs?.thickness_mm as number | undefined;
  const maxTemp = specs?.max_temp_c as number | undefined;
  const coating = specs?.coating as string | undefined;
  const material = specs?.material as string | undefined;

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-6xl mx-auto p-6 space-y-6">
        {/* Back button */}
        <Link to={{ pathname: "/printers", search: "?tab=build-plates" }}>
          <Button variant="ghost" className="gap-2">
            <ArrowLeft className="h-4 w-4" />
            Back to Build Plates
          </Button>
        </Link>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Image */}
          <Card className="p-6">
            <div className="aspect-square rounded-lg overflow-hidden bg-muted flex items-center justify-center">
              {buildPlate.image_url ? (
                <img
                  src={buildPlate.image_url}
                  alt={buildPlate.name}
                  className="w-full h-full object-contain"
                  onError={(e) => {
                    const target = e.currentTarget;
                    target.style.display = 'none';
                    const fallback = target.parentElement?.querySelector('.image-fallback');
                    if (fallback) fallback.classList.remove('hidden');
                  }}
                />
              ) : null}
              <div className={`image-fallback flex flex-col items-center justify-center text-muted-foreground ${buildPlate.image_url ? 'hidden' : ''}`}>
                <Square className="h-24 w-24 mb-4 opacity-30" />
                <span className="text-lg">No image available</span>
              </div>
            </div>
          </Card>

          {/* Details */}
          <div className="space-y-6">
            {/* Brand & Name */}
            <div>
              {brandLogo && (
                <img
                  src={brandLogo}
                  alt={buildPlate.brand || "Brand"}
                  className="h-8 w-auto object-contain mb-3"
                />
              )}
              <h1 className="text-3xl font-bold">{buildPlate.name}</h1>
              {buildPlate.brand && (
                <p className="text-muted-foreground mt-1">{buildPlate.brand}</p>
              )}
            </div>

            {/* Price */}
            {buildPlate.price && (
              <p className="text-3xl font-bold text-primary">
                ${buildPlate.price.toFixed(2)}
                <span className="text-sm font-normal text-muted-foreground ml-2">
                  {buildPlate.currency || "USD"}
                </span>
              </p>
            )}

            {/* Quick specs badges */}
            <div className="flex flex-wrap gap-2">
              {surface && <Badge>{surface}</Badge>}
              {isMagnetic && <Badge variant="secondary">Magnetic</Badge>}
              {coating && <Badge variant="outline">{coating}</Badge>}
            </div>

            {/* Buy button */}
            {buildPlate.product_url && (
              <a 
                href={buildPlate.product_url} 
                target="_blank" 
                rel="noopener noreferrer"
              >
                <Button className="w-full gap-2">
                  <ExternalLink className="h-4 w-4" />
                  View on Store
                </Button>
              </a>
            )}

            {/* Description */}
            {buildPlate.description && (
              <Card className="p-4">
                <h3 className="font-semibold mb-2">Description</h3>
                <p className="text-muted-foreground">{buildPlate.description}</p>
              </Card>
            )}
          </div>
        </div>

        {/* Specifications */}
        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4">Specifications</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {surface && (
              <div className="p-3 bg-muted/50 rounded-lg">
                <p className="text-xs text-muted-foreground uppercase">Surface Type</p>
                <p className="font-semibold">{surface}</p>
              </div>
            )}
            {material && (
              <div className="p-3 bg-muted/50 rounded-lg">
                <p className="text-xs text-muted-foreground uppercase">Material</p>
                <p className="font-semibold">{material}</p>
              </div>
            )}
            {coating && (
              <div className="p-3 bg-muted/50 rounded-lg">
                <p className="text-xs text-muted-foreground uppercase">Coating</p>
                <p className="font-semibold">{coating}</p>
              </div>
            )}
            {(sizeX && sizeY) && (
              <div className="p-3 bg-muted/50 rounded-lg">
                <p className="text-xs text-muted-foreground uppercase">Size</p>
                <p className="font-semibold">{sizeX} × {sizeY} mm</p>
              </div>
            )}
            {thickness && (
              <div className="p-3 bg-muted/50 rounded-lg">
                <p className="text-xs text-muted-foreground uppercase">Thickness</p>
                <p className="font-semibold">{thickness} mm</p>
              </div>
            )}
            {maxTemp && (
              <div className="p-3 bg-muted/50 rounded-lg">
                <p className="text-xs text-muted-foreground uppercase">Max Temperature</p>
                <p className="font-semibold">{maxTemp}°C</p>
              </div>
            )}
            <div className="p-3 bg-muted/50 rounded-lg">
              <p className="text-xs text-muted-foreground uppercase">Magnetic</p>
              <div className="flex items-center gap-1">
                {isMagnetic ? (
                  <><Check className="h-4 w-4 text-green-500" /> <span className="font-semibold">Yes</span></>
                ) : (
                  <><X className="h-4 w-4 text-muted-foreground" /> <span className="font-semibold">No</span></>
                )}
              </div>
            </div>
          </div>
        </Card>

        {/* Compatible Printers */}
        {compatiblePrinters && compatiblePrinters.length > 0 && (
          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-4">Compatible Printers</h2>
            <div className="flex flex-wrap gap-2">
              {compatiblePrinters.map((printer: any) => (
                <Link key={printer.id} to={`/printers/${printer.id}`}>
                  <Badge 
                    variant="outline" 
                    className="cursor-pointer hover:bg-muted transition-colors"
                  >
                    {printer.brand?.brand} {printer.model_name}
                  </Badge>
                </Link>
              ))}
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}
