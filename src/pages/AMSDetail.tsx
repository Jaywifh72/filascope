import { useParams, Link, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowLeft, ExternalLink, Layers, Check, X, ImageIcon, AlertTriangle, Link2, FileText, Ban } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { useAffiliateLinks } from "@/hooks/useAffiliateLinks";
import { useCurrency } from "@/hooks/useCurrency";
import { validateProductUrl, isDiscontinuedUrl } from "@/lib/urlValidation";

interface AMSSpecs {
  max_spools?: number;
  spool_size?: string;
  humidity_control?: boolean;
  drying_capability?: boolean;
  max_temp_c?: number;
  filament_types?: string;
  compatible_models?: string;
  color_mixing?: boolean;
  material_detection?: boolean;
  wireless?: boolean;
  dimensions?: string;
  weight_kg?: number;
  buffer_system?: boolean;
  active_heating?: boolean;
  max_drying_temp_c?: number;
  supported_diameters?: string;
  interface_type?: string;
  power_requirements?: string;
  tds_url?: string;
}

export default function AMSDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { isAdmin } = useAuth();
  const queryClient = useQueryClient();
  const [imageDialogOpen, setImageDialogOpen] = useState(false);
  const [newImageUrl, setNewImageUrl] = useState("");
  const { getAffiliateUrl } = useAffiliateLinks();
  const { formatPrice } = useCurrency();

  const { data: ams, isLoading } = useQuery({
    queryKey: ["ams-detail", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("printer_accessories")
        .select("*")
        .eq("id", id)
        .eq("accessory_type", "ams_mmu")
        .single();

      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });

  // Fetch compatible printers
  const { data: compatiblePrinters } = useQuery({
    queryKey: ["ams-compatible-printers", id, ams?.brand, ams?.compatible_printer_brands],
    queryFn: async () => {
      if (!ams) return [];
      
      let query = supabase
        .from("printers")
        .select(`
          id,
          model_name,
          brand:printer_brands!brand_id(brand)
        `);

      // Filter by compatible brands or specific printer
      if (ams.printer_id) {
        query = query.eq("id", ams.printer_id);
      } else if (ams.compatible_printer_brands?.length) {
        const { data: brands } = await supabase
          .from("printer_brands")
          .select("id, brand")
          .in("brand", ams.compatible_printer_brands);

        if (brands?.length) {
          query = query.in("brand_id", brands.map(b => b.id));
        }
      } else if (ams.brand) {
        const { data: brandData } = await supabase
          .from("printer_brands")
          .select("id")
          .eq("brand", ams.brand)
          .single();

        if (brandData) {
          query = query.eq("brand_id", brandData.id);
        }
      }

      const { data, error } = await query.limit(20);
      if (error) throw error;
      return data;
    },
    enabled: !!ams,
  });

  // Mutation for updating AMS image
  const updateImageMutation = useMutation({
    mutationFn: async (imageUrl: string) => {
      const { error } = await supabase
        .from("printer_accessories")
        .update({ image_url: imageUrl })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ams-detail", id] });
      toast.success("Image updated successfully");
      setImageDialogOpen(false);
      setNewImageUrl("");
    },
    onError: (error) => {
      toast.error("Failed to update image: " + error.message);
    },
  });

  const handleUpdateImage = () => {
    if (newImageUrl.trim()) {
      updateImageMutation.mutate(newImageUrl.trim());
    }
  };

  // URL validation
  const urlValidation = useMemo(() => {
    if (!ams?.product_url) return null;
    return validateProductUrl(ams.product_url, ams.brand);
  }, [ams?.product_url, ams?.brand]);

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
      queryClient.invalidateQueries({ queryKey: ["ams-detail", id] });
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
      <div className="min-h-screen bg-background">
        <div className="max-w-6xl mx-auto p-6 space-y-6">
          <Skeleton className="h-8 w-48" />
          <div className="grid md:grid-cols-2 gap-8">
            <Skeleton className="aspect-square" />
            <div className="space-y-4">
              <Skeleton className="h-10 w-3/4" />
              <Skeleton className="h-6 w-1/2" />
              <Skeleton className="h-24" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!ams) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <Layers className="h-16 w-16 mx-auto text-muted-foreground" />
          <h1 className="text-2xl font-bold">AMS/MMU Not Found</h1>
          <Button 
            variant="outline"
            onClick={() => navigate(-1)}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to AMS/MMU List
          </Button>
        </div>
      </div>
    );
  }

  const specs = ams.specs as AMSSpecs | null;

  const BooleanIndicator = ({ value }: { value: boolean | undefined }) => {
    if (value === undefined) return <span className="text-muted-foreground">-</span>;
    return value ? (
      <Check className="h-4 w-4 text-green-500" />
    ) : (
      <X className="h-4 w-4 text-red-500" />
    );
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-6xl mx-auto p-6 space-y-6">
        {/* Back Button */}
        <Button 
          variant="ghost" 
          size="sm"
          onClick={() => navigate(-1)}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to AMS/MMU Systems
        </Button>

        {/* Main Content */}
        <div className="grid md:grid-cols-2 gap-8">
          {/* Image */}
          <div className="relative aspect-square bg-muted/30 rounded-xl flex items-center justify-center overflow-hidden border">
            {ams.image_url ? (
              <img
                src={ams.image_url}
                alt={ams.name}
                className="w-full h-full object-contain"
                onError={(e) => {
                  const target = e.currentTarget;
                  target.style.display = 'none';
                  const fallback = target.parentElement?.querySelector('.image-fallback');
                  if (fallback) fallback.classList.remove('hidden');
                }}
              />
            ) : null}
            <div className={`image-fallback flex flex-col items-center justify-center text-muted-foreground ${ams.image_url ? 'hidden' : ''}`}>
              <Layers className="h-24 w-24 mb-4 opacity-30" />
            </div>
            
            {/* Admin Image Edit Button */}
            {isAdmin && (
              <Dialog open={imageDialogOpen} onOpenChange={setImageDialogOpen}>
                <DialogTrigger asChild>
                  <Button
                    variant="secondary"
                    size="sm"
                    className="absolute top-3 right-3"
                    onClick={() => setNewImageUrl(ams.image_url || "")}
                  >
                    <ImageIcon className="h-4 w-4 mr-1" />
                    Update Image
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Update AMS/MMU Image</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="imageUrl">Image URL</Label>
                      <Input
                        id="imageUrl"
                        value={newImageUrl}
                        onChange={(e) => setNewImageUrl(e.target.value)}
                        placeholder="https://example.com/image.png"
                      />
                    </div>
                    {newImageUrl && (
                      <div className="aspect-square max-h-48 bg-muted/30 rounded-lg overflow-hidden">
                        <img
                          src={newImageUrl}
                          alt="Preview"
                          className="w-full h-full object-contain"
                          onError={(e) => {
                            e.currentTarget.style.display = 'none';
                          }}
                        />
                      </div>
                    )}
                    <Button
                      onClick={handleUpdateImage}
                      disabled={!newImageUrl.trim() || updateImageMutation.isPending}
                      className="w-full"
                    >
                      {updateImageMutation.isPending ? "Updating..." : "Save Image"}
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            )}
          </div>

          {/* Info */}
          <div className="space-y-6">
            <div>
              <p className="text-sm text-muted-foreground mb-1">{ams.brand}</p>
              <h1 className="text-3xl font-bold">{ams.name}</h1>
            </div>

            {/* Price */}
            {ams.price && (
              <div className="text-3xl font-bold text-primary">
                ${ams.price} <span className="text-lg font-medium">{ams.currency || "USD"}</span>
              </div>
            )}

            {/* Key Features */}
            <div className="flex flex-wrap gap-2">
              {specs?.max_spools && (
                <Badge variant="secondary" className="text-sm">
                  {specs.max_spools} Spool Capacity
                </Badge>
              )}
              {specs?.drying_capability && (
                <Badge variant="secondary" className="text-sm">
                  Built-in Drying
                </Badge>
              )}
              {specs?.humidity_control && (
                <Badge variant="secondary" className="text-sm">
                  Humidity Control
                </Badge>
              )}
              {specs?.color_mixing && (
                <Badge variant="secondary" className="text-sm">
                  Color Mixing
                </Badge>
              )}
              {specs?.material_detection && (
                <Badge variant="secondary" className="text-sm">
                  Material Detection
                </Badge>
              )}
              {specs?.wireless && (
                <Badge variant="secondary" className="text-sm">
                  Wireless
                </Badge>
              )}
            </div>

            {/* Description */}
            {ams.description && (
              <p className="text-muted-foreground">{ams.description}</p>
            )}

            {/* Store Link */}
            {ams.product_url && isDiscontinuedUrl(ams.product_url) ? (
              <Badge variant="outline" className="text-orange-600 border-orange-300 bg-orange-50 dark:bg-orange-950/30 py-2 px-4">
                <Ban className="h-4 w-4 mr-2" />
                Discontinued
              </Badge>
            ) : ams.product_url && (
              <div className="space-y-2">
                {/* URL validation warning for admins */}
                {isAdmin && urlValidation && !urlValidation.isValid && (
                  <div className="flex items-center gap-2 p-2 bg-yellow-500/10 border border-yellow-500/30 rounded-lg text-sm">
                    <AlertTriangle className="h-4 w-4 text-yellow-500 flex-shrink-0" />
                    <span className="text-yellow-600 dark:text-yellow-400 flex-1">{urlValidation.issue}</span>
                    {urlValidation.suggestedUrl && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="gap-1 text-xs"
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
                  href={getAffiliateUrl(ams.product_url, ams.brand) || ams.product_url}
                  target="_blank"
                  rel="nofollow sponsored noopener noreferrer"
                >
                  <Button className="w-full gap-2">
                    <ExternalLink className="h-4 w-4" />
                    View on Store
                  </Button>
                </a>
              </div>
            )}
            
            {/* TDS Link */}
            {(specs?.tds_url || (ams as any).tds_url) && (
              <a
                href={String(specs?.tds_url || (ams as any).tds_url)}
                target="_blank"
                rel="noopener noreferrer"
              >
                <Button variant="outline" className="w-full gap-2">
                  <FileText className="h-4 w-4" />
                  View Technical Data Sheet
                </Button>
              </a>
            )}
          </div>
        </div>

        {/* Specifications */}
        <Card>
          <CardHeader>
            <CardTitle>Specifications</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* Capacity */}
              <div className="space-y-3">
                <h4 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">Capacity</h4>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Max Spools</span>
                    <span className="font-medium">{specs?.max_spools || "-"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Spool Size</span>
                    <span className="font-medium">{specs?.spool_size || "-"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Supported Diameters</span>
                    <span className="font-medium">{specs?.supported_diameters || "1.75mm"}</span>
                  </div>
                </div>
              </div>

              {/* Features */}
              <div className="space-y-3">
                <h4 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">Features</h4>
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Drying Capability</span>
                    <BooleanIndicator value={specs?.drying_capability} />
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Humidity Control</span>
                    <BooleanIndicator value={specs?.humidity_control} />
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Active Heating</span>
                    <BooleanIndicator value={specs?.active_heating} />
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Buffer System</span>
                    <BooleanIndicator value={specs?.buffer_system} />
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Material Detection</span>
                    <BooleanIndicator value={specs?.material_detection} />
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Color Mixing</span>
                    <BooleanIndicator value={specs?.color_mixing} />
                  </div>
                </div>
              </div>

              {/* Technical */}
              <div className="space-y-3">
                <h4 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">Technical</h4>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Max Drying Temp</span>
                    <span className="font-medium">{specs?.max_drying_temp_c ? `${specs.max_drying_temp_c}°C` : "-"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Interface</span>
                    <span className="font-medium">{specs?.interface_type || "-"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Power</span>
                    <span className="font-medium">{specs?.power_requirements || "-"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Dimensions</span>
                    <span className="font-medium">{specs?.dimensions || "-"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Weight</span>
                    <span className="font-medium">{specs?.weight_kg ? `${specs.weight_kg} kg` : "-"}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Supported Filaments */}
            {specs?.filament_types && (
              <div className="mt-6 pt-6 border-t">
                <h4 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide mb-3">Supported Filament Types</h4>
                <p className="text-foreground">{specs.filament_types}</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Compatible Printers */}
        {compatiblePrinters && compatiblePrinters.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Compatible Printers</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                {compatiblePrinters.map((printer: any) => (
                  <Link
                    key={printer.id}
                    to={`/printers/${printer.printer_id || printer.id}`}
                    className="p-3 rounded-lg border hover:bg-muted/50 transition-colors"
                  >
                    <p className="font-medium text-sm">{printer.model_name}</p>
                    <p className="text-xs text-muted-foreground">{printer.brand?.brand}</p>
                  </Link>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
