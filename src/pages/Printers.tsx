import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate, Link, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { GitCompare, X, RefreshCw, BookOpen, Printer as PrinterIcon, CircleDot, Square, Layers, ImageIcon } from "lucide-react";
import { toast } from "sonner";
import type { Database } from "@/integrations/supabase/types";
import { getBrandLogo } from "@/lib/brandLogos";
import HotendList from "@/components/HotendList";
import BuildPlateList from "@/components/BuildPlateList";
import AMSList from "@/components/AMSList";

// Brand wiki/documentation URLs
const BRAND_WIKI_URLS: Record<string, string> = {
  "Bambu Lab": "https://wiki.bambulab.com",
  "Creality": "https://en.wikipedia.org/wiki/Creality",
  "Snapmaker": "https://wiki.snapmaker.com/Snapmaker_2",
  "FLSUN": "https://flsun3d.com",
  "Anycubic": "https://www.anycubic.com",
  "FlashForge": "https://wiki.flashforge.com/en/guider_series/guider_4/guider_4",
  "Elegoo": "https://wiki.elegoo.com/en/jupiter",
  "AnkerMake": "https://www.eufymake.com/blogs/news/ankermake-rebranding-to-eufymake",
  "eufyMake": "https://www.eufymake.com/blogs/news/ankermake-rebranding-to-eufymake",
  "Markforged": "https://markforged.com",
  "Raise3D": "https://www.raise3d.com",
  "Prusa Research": "https://www.prusa3d.com/category/3d-printers",
  "UltiMaker": "https://ultimaker.com/3d-printers",
  "Sovol": "https://www.sovol3d.com/collections/3d-printer",
  "Rat Rig": "https://ratrig.com/collections/3d-printers",
  "Voron Design": "https://vorondesign.com",
  "QIDI": "https://ca.qidi3d.com/collections/3d-printers",
  "QIDI Tech": "https://ca.qidi3d.com/collections/3d-printers",
};

type Printer = Database["public"]["Tables"]["printers"]["Row"] & {
  brand: { brand: string } | null;
  series: { series_name: string } | null;
};

export default function Printers() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [searchParams, setSearchParams] = useSearchParams();
  const { isAdmin } = useAuth();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedBrand, setSelectedBrand] = useState("all");
  const [selectedMaterial, setSelectedMaterial] = useState("all");
  const [hasEnclosure, setHasEnclosure] = useState(false);
  const [multiMaterial, setMultiMaterial] = useState(false);
  const [minBuildVolume, setMinBuildVolume] = useState("");
  const [selectedForCompare, setSelectedForCompare] = useState<string[]>([]);
  
  // Image edit dialog state
  const [imageEditPrinter, setImageEditPrinter] = useState<Printer | null>(null);
  const [newImageUrl, setNewImageUrl] = useState("");

  const activeTab = searchParams.get("tab") || "printers";
  
  const handleTabChange = (value: string) => {
    setSearchParams({ tab: value });
  };

  // Fetch brands
  const { data: brands } = useQuery({
    queryKey: ["printer-brands-list"],
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

  const updateImageMutation = useMutation({
    mutationFn: async ({ printerId, imageUrl }: { printerId: string; imageUrl: string }) => {
      // Get current scraped_data
      const { data: printer, error: fetchError } = await supabase
        .from("printers")
        .select("scraped_data")
        .eq("id", printerId)
        .single();

      if (fetchError) throw fetchError;

      // Update scraped_data with new image
      const currentData = (printer?.scraped_data as Record<string, unknown>) || {};
      const updatedData = {
        ...currentData,
        images: {
          ...(currentData.images as Record<string, unknown> || {}),
          product_images: [imageUrl],
        },
      };

      const { error } = await supabase
        .from("printers")
        .update({ scraped_data: updatedData })
        .eq("id", printerId);

      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Printer image updated");
      queryClient.invalidateQueries({ queryKey: ["printers-list"] });
      setImageEditPrinter(null);
      setNewImageUrl("");
    },
    onError: (error) => {
      toast.error("Failed to update printer image");
      console.error(error);
    },
  });

  const openImageEditDialog = (printer: Printer, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setImageEditPrinter(printer);
    // Pre-fill with existing image if available
    const existingImages = (printer.scraped_data as Record<string, unknown>)?.images as Record<string, unknown>;
    const productImages = existingImages?.product_images as string[] | undefined;
    setNewImageUrl(productImages?.[0] || "");
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-[1800px] mx-auto p-6 space-y-6">
        {/* Header */}
        <div className="space-y-2">
          <h1 className="text-4xl font-bold tracking-tight">Hardware</h1>
          <p className="text-muted-foreground">
            Browse and compare 3D printers, hotends, and build plates
          </p>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={handleTabChange}>
          <TabsList className="grid w-full max-w-2xl grid-cols-4">
            <TabsTrigger value="printers" className="gap-2">
              <PrinterIcon className="h-4 w-4" />
              Printers
            </TabsTrigger>
            <TabsTrigger value="hotends" className="gap-2">
              <CircleDot className="h-4 w-4" />
              Hotends
            </TabsTrigger>
            <TabsTrigger value="build-plates" className="gap-2">
              <Square className="h-4 w-4" />
              Build Plates
            </TabsTrigger>
            <TabsTrigger value="ams" className="gap-2">
              <Layers className="h-4 w-4" />
              AMS/MMU
            </TabsTrigger>
          </TabsList>

          {/* Printers Tab */}
          <TabsContent value="printers" className="space-y-6 mt-6">
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
                {filteredPrinters.map((printer) => {
                  // Extract product image from scraped_data
                  const scrapedData = printer.scraped_data as Record<string, unknown> | null;
                  const images = scrapedData?.images as Record<string, unknown> | null;
                  const productImages = images?.product_images as string[] | null;
                  const productImage = productImages?.[0];

                  return (
              <div key={printer.id} className="relative">
                <Link to={`/printers/${printer.id}`}>
                  <Card className="overflow-hidden hover:shadow-lg transition-shadow cursor-pointer">
                    {/* Product Image */}
                    <div className="relative h-48 bg-muted/30">
                      {productImage ? (
                        <img 
                          src={productImage} 
                          alt={printer.model_name}
                          className="w-full h-full object-contain p-4"
                          onError={(e) => {
                            (e.target as HTMLImageElement).style.display = 'none';
                          }}
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <PrinterIcon className="h-16 w-16 text-muted-foreground/30" />
                        </div>
                      )}
                      {/* Brand Logo Overlay */}
                      {getBrandLogo(printer.brand?.brand || null) && (
                        <div className="absolute bottom-2 left-2 p-1.5 bg-background/80 rounded-md border border-border/50 backdrop-blur-sm">
                          <img 
                            src={getBrandLogo(printer.brand?.brand || null)!} 
                            alt={`${printer.brand?.brand} logo`}
                            className="h-8 w-auto object-contain max-w-[60px]"
                          />
                        </div>
                      )}
                    </div>

                    {/* Card Content */}
                    <div className="p-4 space-y-3">
                      {/* Header */}
                      <div className="space-y-1">
                        <h3 className="text-lg font-bold line-clamp-1">
                          {printer.model_name}
                        </h3>
                        <div className="flex flex-wrap gap-1">
                          {printer.series?.series_name && (
                            <Badge variant="secondary" className="text-xs">{printer.series.series_name}</Badge>
                          )}
                          {printer.variant_or_bundle_name && (
                            <span className="text-xs text-muted-foreground">
                              {printer.variant_or_bundle_name}
                            </span>
                          )}
                        </div>
                      </div>

                    {/* Price */}
                    {(printer.current_price_usd_store || printer.current_price_usd_amazon || printer.msrp_usd) && (
                      <div className="space-y-1">
                        {printer.current_price_usd_store ? (
                          <div className="text-2xl font-bold text-primary">
                            ${printer.current_price_usd_store}
                          </div>
                        ) : printer.current_price_usd_amazon ? (
                          <div className="text-2xl font-bold text-primary">
                            ${printer.current_price_usd_amazon}
                            <span className="text-xs text-muted-foreground ml-1">(Amazon)</span>
                          </div>
                        ) : printer.msrp_usd ? (
                          <div className="text-2xl font-bold text-muted-foreground">
                            ${printer.msrp_usd}
                            <span className="text-xs ml-1">(MSRP)</span>
                          </div>
                        ) : null}
                      </div>
                    )}

                    {/* Key Specs */}
                      <div className="space-y-1 text-sm">
                        {printer.build_volume_x_mm && printer.build_volume_y_mm && printer.build_volume_z_mm && (
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Build Volume:</span>
                            <span className="font-medium">
                              {printer.build_volume_x_mm}×{printer.build_volume_y_mm}×{printer.build_volume_z_mm}mm
                            </span>
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
                      <div className="flex flex-wrap gap-1.5">
                        {printer.has_enclosure && (
                          <Badge variant="outline" className="text-xs">Enclosure</Badge>
                        )}
                        {printer.auto_bed_leveling && (
                          <Badge variant="outline" className="text-xs">Auto Level</Badge>
                        )}
                        {printer.multi_material_supported && (
                          <Badge variant="outline" className="text-xs">Multi-Material</Badge>
                        )}
                        {printer.has_wifi && (
                          <Badge variant="outline" className="text-xs">WiFi</Badge>
                        )}
                      </div>
                    </div>
                  </Card>
                </Link>

                {/* Interactive Controls - Positioned absolutely over the card */}
                <div className="absolute top-2 right-2 flex gap-1 z-10">
                  {BRAND_WIKI_URLS[printer.brand?.brand || ""] && (
                    <a
                      href={BRAND_WIKI_URLS[printer.brand?.brand || ""]}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      title={`${printer.brand?.brand} Wiki`}
                      className="bg-background/80 backdrop-blur-sm rounded-md p-1.5 hover:bg-background transition-colors"
                    >
                      <BookOpen className="h-4 w-4 text-muted-foreground hover:text-primary" />
                    </a>
                  )}
                  {isAdmin && (
                    <Button 
                      variant="ghost" 
                      size="icon"
                      className="h-7 w-7 bg-background/80 backdrop-blur-sm hover:bg-background"
                      onClick={(e) => openImageEditDialog(printer, e)}
                      title="Edit printer image"
                    >
                      <ImageIcon className="h-4 w-4" />
                    </Button>
                  )}
                  {isAdmin && printer.official_product_url && (
                    <Button 
                      variant="ghost" 
                      size="icon"
                      className="h-7 w-7 bg-background/80 backdrop-blur-sm hover:bg-background"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        rescrapeMutation.mutate(printer.id);
                      }}
                      disabled={rescrapeMutation.isPending}
                      title="Re-scrape printer data from official product page"
                    >
                      <RefreshCw className={`h-4 w-4 ${rescrapeMutation.isPending ? 'animate-spin' : ''}`} />
                    </Button>
                  )}
                  <div 
                    className="bg-background/80 backdrop-blur-sm rounded-md p-1.5 hover:bg-background transition-colors"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <Checkbox
                      checked={selectedForCompare.includes(printer.printer_id)}
                      onCheckedChange={() => toggleCompareSelection(printer.printer_id)}
                    />
                  </div>
                </div>
              </div>
              );
            })}
          </div>
        )}
          </TabsContent>

          {/* Hotends Tab */}
          <TabsContent value="hotends" className="mt-6">
            <HotendList />
          </TabsContent>

          {/* Build Plates Tab */}
          <TabsContent value="build-plates" className="mt-6">
            <BuildPlateList />
          </TabsContent>

          {/* AMS/MMU Tab */}
          <TabsContent value="ams" className="mt-6">
            <AMSList />
          </TabsContent>
        </Tabs>

        {/* Image Edit Dialog */}
        <Dialog open={!!imageEditPrinter} onOpenChange={(open) => !open && setImageEditPrinter(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit Printer Image</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="image-url">Image URL</Label>
                <Input
                  id="image-url"
                  placeholder="https://example.com/image.jpg"
                  value={newImageUrl}
                  onChange={(e) => setNewImageUrl(e.target.value)}
                />
              </div>
              {newImageUrl && (
                <div className="space-y-2">
                  <Label>Preview</Label>
                  <div className="border rounded-lg p-2 bg-muted/50">
                    <img
                      src={newImageUrl}
                      alt="Preview"
                      className="max-h-48 mx-auto object-contain"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = "/placeholder.svg";
                      }}
                    />
                  </div>
                </div>
              )}
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setImageEditPrinter(null)}>
                Cancel
              </Button>
              <Button
                onClick={() => imageEditPrinter && updateImageMutation.mutate({ 
                  printerId: imageEditPrinter.id, 
                  imageUrl: newImageUrl 
                })}
                disabled={!newImageUrl || updateImageMutation.isPending}
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