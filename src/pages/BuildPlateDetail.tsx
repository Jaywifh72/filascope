import { useParams, Link, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { ArrowLeft, ExternalLink, Square, Check, X, ImageIcon, AlertTriangle, Link2, FileText, Ban } from "lucide-react";
import { getBrandLogo } from "@/lib/brandLogos";
import { BrandLogo } from "@/components/ui/BrandLogo";
import { useAffiliateLinks } from "@/hooks/useAffiliateLinks";
import { useCurrency } from "@/hooks/useCurrency";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { validateProductUrl, fixProductUrl, isDiscontinuedUrl } from "@/lib/urlValidation";

export default function BuildPlateDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { getAffiliateUrl } = useAffiliateLinks();
  const { formatPrice } = useCurrency();
  const { isAdmin } = useAuth();
  const queryClient = useQueryClient();
  
  const [imageDialogOpen, setImageDialogOpen] = useState(false);
  const [newImageUrl, setNewImageUrl] = useState("");

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

  // Mutation for updating image
  const updateImageMutation = useMutation({
    mutationFn: async (imageUrl: string) => {
      const { error } = await supabase
        .from("printer_accessories")
        .update({ image_url: imageUrl })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["build-plate-detail", id] });
      toast.success("Image updated successfully");
      setImageDialogOpen(false);
      setNewImageUrl("");
    },
    onError: (error) => {
      toast.error("Failed to update image: " + error.message);
    },
  });

  const handleSaveImage = () => {
    if (!newImageUrl.trim()) {
      toast.error("Please enter an image URL");
      return;
    }
    updateImageMutation.mutate(newImageUrl.trim());
  };

  const openImageDialog = () => {
    setNewImageUrl(buildPlate?.image_url || "");
    setImageDialogOpen(true);
  };

  // URL validation
  const urlValidation = useMemo(() => {
    if (!buildPlate?.product_url) return null;
    return validateProductUrl(buildPlate.product_url, buildPlate.brand);
  }, [buildPlate?.product_url, buildPlate?.brand]);

  // Mutation for fixing URL
  const fixUrlMutation = useMutation({
    mutationFn: async (newUrl: string) => {
      const { error } = await supabase
        .from("printer_accessories")
        .update({ product_url: newUrl })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["build-plate-detail", id] });
      toast.success("URL fixed successfully");
    },
    onError: (error) => {
      toast.error("Failed to fix URL: " + error.message);
    },
  });

  const handleFixUrl = () => {
    if (urlValidation?.suggestedUrl) {
      fixUrlMutation.mutate(urlValidation.suggestedUrl);
    }
  };

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
          <Button 
            variant="outline"
            onClick={() => navigate(-1)}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Build Plates
          </Button>
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
      <div className="max-w-4xl mx-auto p-6 space-y-6">
        {/* Back button */}
        <Button 
          variant="ghost" 
          className="gap-2"
          onClick={() => navigate(-1)}
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Build Plates
        </Button>

        {/* Header with image and main info */}
        <Card className="p-6">
          <div className="flex gap-6">
            {/* Small image in corner */}
            <div className="relative flex-shrink-0">
              <div className="w-32 h-32 rounded-lg overflow-hidden bg-muted flex items-center justify-center">
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
                  <Square className="h-10 w-10 opacity-30" />
                </div>
              </div>
              {isAdmin && (
                <Button
                  variant="outline"
                  size="icon"
                  className="absolute -top-2 -right-2 h-7 w-7"
                  onClick={openImageDialog}
                >
                  <ImageIcon className="h-3.5 w-3.5" />
                </Button>
              )}
            </div>

            {/* Main info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <BrandLogo
                    src={brandLogo}
                    brandName={buildPlate.brand || "Brand"}
                    size="sm"
                    className="h-6 mb-2"
                  />
                  <h1 className="text-2xl font-bold leading-tight">{buildPlate.name}</h1>
                  {buildPlate.brand && !brandLogo && (
                    <p className="text-muted-foreground text-sm mt-0.5">{buildPlate.brand}</p>
                  )}
                </div>
                
                {/* Price */}
                {buildPlate.price && (
                  <div className="text-right flex-shrink-0">
                    <p className="text-2xl font-bold text-primary">
                      ${buildPlate.price.toFixed(2)} <span className="text-sm font-medium">{buildPlate.currency || "USD"}</span>
                    </p>
                  </div>
                )}
              </div>

              {/* Quick specs badges */}
              <div className="flex flex-wrap gap-1.5 mt-3">
                {surface && <Badge variant="secondary" className="text-xs">{surface}</Badge>}
                {isMagnetic && <Badge variant="outline" className="text-xs">Magnetic</Badge>}
                {coating && <Badge variant="outline" className="text-xs">{coating}</Badge>}
                {(sizeX && sizeY) && <Badge variant="outline" className="text-xs">{sizeX}×{sizeY}mm</Badge>}
              </div>

              {/* Buy button */}
              {buildPlate.product_url && isDiscontinuedUrl(buildPlate.product_url) ? (
                <div className="mt-4">
                  <Badge variant="outline" className="text-orange-600 border-orange-300 bg-orange-50 dark:bg-orange-950/30 py-1.5 px-3">
                    <Ban className="h-3.5 w-3.5 mr-1.5" />
                    Discontinued
                  </Badge>
                </div>
              ) : buildPlate.product_url && (
                <div className="mt-4 space-y-2">
                  {/* URL validation warning for admins */}
                  {isAdmin && urlValidation && !urlValidation.isValid && (
                    <div className="flex items-center gap-2 p-2 bg-yellow-500/10 border border-yellow-500/30 rounded-lg text-xs">
                      <AlertTriangle className="h-3.5 w-3.5 text-yellow-500 flex-shrink-0" />
                      <span className="text-yellow-600 dark:text-yellow-400 flex-1">{urlValidation.issue}</span>
                      {urlValidation.suggestedUrl && (
                        <Button
                          size="sm"
                          variant="outline"
                          className="gap-1 text-xs h-7"
                          onClick={handleFixUrl}
                          disabled={fixUrlMutation.isPending}
                        >
                          <Link2 className="h-3 w-3" />
                          {fixUrlMutation.isPending ? "Fixing..." : "Fix URL"}
                        </Button>
                      )}
                    </div>
                  )}
                  <a 
                    href={getAffiliateUrl(buildPlate.product_url, buildPlate.brand) || buildPlate.product_url} 
                    target="_blank" 
                    rel="nofollow sponsored noopener noreferrer"
                  >
                    <Button size="sm" className="gap-2">
                      <ExternalLink className="h-3.5 w-3.5" />
                      View on Store
                    </Button>
                  </a>
                </div>
              )}
              {/* TDS Link */}
              {(specs?.tds_url || (buildPlate as any).tds_url) && (
                <a
                  href={String(specs?.tds_url || (buildPlate as any).tds_url)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-2 inline-block"
                >
                  <Button variant="outline" size="sm" className="gap-2">
                    <FileText className="h-3.5 w-3.5" />
                    Technical Data Sheet
                  </Button>
                </a>
              )}
            </div>
          </div>

          {/* Description */}
          {buildPlate.description && (
            <div className="mt-4 pt-4 border-t">
              <p className="text-sm text-muted-foreground">{buildPlate.description}</p>
            </div>
          )}
        </Card>

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
                <Link key={printer.id} to={`/printers/${printer.printer_id || printer.id}`}>
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

        {/* Image Edit Dialog */}
        <Dialog open={imageDialogOpen} onOpenChange={setImageDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Update Build Plate Image</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <Input
                placeholder="Enter image URL..."
                value={newImageUrl}
                onChange={(e) => setNewImageUrl(e.target.value)}
              />
              {newImageUrl && (
                <div className="border rounded-lg p-2 bg-muted">
                  <img
                    src={newImageUrl}
                    alt="Preview"
                    className="w-full h-48 object-contain"
                    onError={(e) => {
                      e.currentTarget.style.display = 'none';
                    }}
                  />
                </div>
              )}
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setImageDialogOpen(false)}>
                Cancel
              </Button>
              <Button 
                onClick={handleSaveImage}
                disabled={updateImageMutation.isPending}
              >
                {updateImageMutation.isPending ? "Saving..." : "Save"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
