import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { GitCompare, X, RefreshCw, Printer as PrinterIcon, ImageIcon, Search, Heart, ExternalLink } from "lucide-react";
import { toast } from "sonner";
import type { Database } from "@/integrations/supabase/types";
import { getBrandLogo } from "@/lib/brandLogos";
import { useCurrency } from "@/hooks/useCurrency";

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
  const { isAdmin } = useAuth();
  const { formatPrice } = useCurrency();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedBrand, setSelectedBrand] = useState("all");
  const [sortBy, setSortBy] = useState("name-asc");
  
  const [hasEnclosure, setHasEnclosure] = useState(false);
  const [multiMaterial, setMultiMaterial] = useState(false);
  const [selectedSize, setSelectedSize] = useState("all");
  const [selectedSpeed, setSelectedSpeed] = useState("all");
  
  const [selectedForCompare, setSelectedForCompare] = useState<string[]>([]);
  
  // Image edit dialog state
  const [imageEditPrinter, setImageEditPrinter] = useState<Printer | null>(null);
  const [newImageUrl, setNewImageUrl] = useState("");

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
    queryKey: ["printers-list", searchTerm, selectedBrand, hasEnclosure, multiMaterial],
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


  // Filter and sort by brand and other criteria on client side
  const filteredPrinters = useMemo(() => {
    if (!printers) return [];

    const filtered = printers.filter(printer => {
      if (selectedBrand !== "all" && printer.brand?.brand !== selectedBrand) {
        return false;
      }

      // Size filter based on build volume (in liters)
      if (selectedSize !== "all") {
        const volume = (printer.build_volume_x_mm || 0) * 
                      (printer.build_volume_y_mm || 0) * 
                      (printer.build_volume_z_mm || 0) / 1000000000; // Convert to liters
        
        switch (selectedSize) {
          case "small":
            if (volume >= 0.02) return false; // Less than 20L (mini printers)
            break;
          case "medium":
            if (volume < 0.02 || volume >= 0.04) return false; // 20-40L
            break;
          case "large":
            if (volume < 0.04 || volume >= 0.07) return false; // 40-70L
            break;
          case "xlarge":
            if (volume < 0.07) return false; // 70L+
            break;
        }
      }

      // Speed filter based on max print speed
      if (selectedSpeed !== "all") {
        const minSpeed = parseInt(selectedSpeed);
        const printerSpeed = printer.max_print_speed_mms || 0;
        if (printerSpeed < minSpeed) return false;
      }

      return true;
    });

    // Sort the filtered results
    return filtered.sort((a, b) => {
      const getPrice = (p: Printer) => p.current_price_usd_store || p.current_price_usd_amazon || p.msrp_usd || Infinity;
      const getVolume = (p: Printer) => (p.build_volume_x_mm || 0) * (p.build_volume_y_mm || 0) * (p.build_volume_z_mm || 0);
      
      switch (sortBy) {
        case "name-asc":
          return a.model_name.localeCompare(b.model_name);
        case "name-desc":
          return b.model_name.localeCompare(a.model_name);
        case "price-asc":
          return getPrice(a) - getPrice(b);
        case "price-desc":
          return getPrice(b) - getPrice(a);
        case "speed-desc":
          return (b.max_print_speed_mms || 0) - (a.max_print_speed_mms || 0);
        case "speed-asc":
          return (a.max_print_speed_mms || 0) - (b.max_print_speed_mms || 0);
        case "volume-desc":
          return getVolume(b) - getVolume(a);
        case "volume-asc":
          return getVolume(a) - getVolume(b);
        default:
          return 0;
      }
    });
  }, [printers, selectedBrand, selectedSize, selectedSpeed, sortBy]);

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
      <div className="max-w-[1800px] mx-auto p-6 space-y-8">
        {/* Hero Section with Search */}
        <section className="text-center space-y-6 py-8">
          <div className="space-y-3">
            <h1 className="text-4xl md:text-5xl font-bold tracking-tight">Printers</h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Browse and compare 3D printers from all major brands
            </p>
          </div>

          {/* Hero Search Bar */}
          <div className="w-full max-w-[600px] mx-auto relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search 105 printers by name, brand, or feature..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full h-[56px] text-lg pl-12 pr-6 rounded-lg bg-[rgba(255,255,255,0.05)] border border-[rgba(255,255,255,0.1)] text-white placeholder:text-[rgba(255,255,255,0.4)] focus:border-[#00D4D4] focus:shadow-[0_0_12px_rgba(0,212,212,0.3)] focus:outline-none transition-all duration-200"
            />
          </div>
        </section>

        {/* Filters Section */}
        <section className="space-y-6 mt-8">
          {/* Filter Row */}
          <div className="flex flex-wrap items-center gap-4">
            <Select value={selectedBrand} onValueChange={setSelectedBrand}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Select brand" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Brands</SelectItem>
                {brands?.map(brand => (
                  <SelectItem key={brand} value={brand}>{brand}</SelectItem>
                ))}
              </SelectContent>
            </Select>

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

            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Size:</span>
              <Select value={selectedSize} onValueChange={setSelectedSize}>
                <SelectTrigger className="w-[140px] h-8">
                  <SelectValue placeholder="All Sizes" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Sizes</SelectItem>
                  <SelectItem value="small">Small (&lt;20L)</SelectItem>
                  <SelectItem value="medium">Medium (20-40L)</SelectItem>
                  <SelectItem value="large">Large (40-70L)</SelectItem>
                  <SelectItem value="xlarge">Extra Large (70L+)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Speed:</span>
              <Select value={selectedSpeed} onValueChange={setSelectedSpeed}>
                <SelectTrigger className="w-[120px] h-8">
                  <SelectValue placeholder="Any Speed" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Any Speed</SelectItem>
                  <SelectItem value="200">200+ mm/s</SelectItem>
                  <SelectItem value="300">300+ mm/s</SelectItem>
                  <SelectItem value="500">500+ mm/s</SelectItem>
                  <SelectItem value="700">700+ mm/s</SelectItem>
                  <SelectItem value="1000">1000+ mm/s</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

            {/* Results Count & Sort */}
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold">
                {filteredPrinters?.length || 0} <span className="text-muted-foreground font-normal">printers</span>
              </h2>
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">Sort by:</span>
                <Select value={sortBy} onValueChange={setSortBy}>
                  <SelectTrigger className="w-[160px] h-8">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="name-asc">Name (A-Z)</SelectItem>
                    <SelectItem value="name-desc">Name (Z-A)</SelectItem>
                    <SelectItem value="price-asc">Price: Low to High</SelectItem>
                    <SelectItem value="price-desc">Price: High to Low</SelectItem>
                    <SelectItem value="speed-desc">Speed: Fastest</SelectItem>
                    <SelectItem value="speed-asc">Speed: Slowest</SelectItem>
                    <SelectItem value="volume-desc">Build Volume: Largest</SelectItem>
                    <SelectItem value="volume-asc">Build Volume: Smallest</SelectItem>
                  </SelectContent>
                </Select>
              </div>
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
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {filteredPrinters.map((printer) => {
                  // Extract product image from scraped_data
                  const scrapedData = printer.scraped_data as Record<string, unknown> | null;
                  const images = scrapedData?.images as Record<string, unknown> | null;
                  const productImages = images?.product_images as string[] | null;
                  const productImage = productImages?.[0];

                  return (
                    <article 
                      key={printer.id} 
                      className="group relative"
                      role="article"
                      aria-label={`${printer.brand?.brand} ${printer.model_name}`}
                    >
                      <Link to={`/printers/${printer.id}`}>
                        <div 
                          className="
                            relative
                            bg-[hsl(0_0%_10%)] 
                            border border-white/10 
                            rounded-xl 
                            p-5 
                            transition-all duration-300 ease-out
                            hover:border-cyan-400 
                            hover:-translate-y-1 
                            hover:shadow-[0_8px_30px_rgba(0,212,212,0.15)]
                            cursor-pointer
                            h-full
                            flex flex-col
                          "
                        >
                          {/* Action Icons - Top Right */}
                          <div className="absolute top-3 right-3 flex gap-1.5 z-10">
                            <button 
                              className="p-1.5 bg-black/60 backdrop-blur-sm rounded-md hover:bg-black/80 transition-colors"
                              aria-label="Add to favorites"
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                // Future: implement favorite toggle
                              }}
                            >
                              <Heart className="h-4 w-4 text-white/70 hover:text-red-400 transition-colors" />
                            </button>
                            
                            <div 
                              className="p-1.5 bg-black/60 backdrop-blur-sm rounded-md hover:bg-black/80 transition-colors"
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                              }}
                            >
                              <Checkbox
                                className="h-4 w-4 border-white/50 data-[state=checked]:bg-cyan-500 data-[state=checked]:border-cyan-500"
                                checked={selectedForCompare.includes(printer.printer_id)}
                                onCheckedChange={() => toggleCompareSelection(printer.printer_id)}
                                aria-label="Add to comparison"
                              />
                            </div>
                            
                            {printer.official_product_url && (
                              <a
                                href={printer.official_product_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="p-1.5 bg-black/60 backdrop-blur-sm rounded-md hover:bg-black/80 transition-colors"
                                onClick={(e) => e.stopPropagation()}
                                aria-label="View on manufacturer website"
                              >
                                <ExternalLink className="h-4 w-4 text-white/70 hover:text-cyan-400 transition-colors" />
                              </a>
                            )}
                            
                            {isAdmin && (
                              <>
                                <button 
                                  className="p-1.5 bg-black/60 backdrop-blur-sm rounded-md hover:bg-black/80 transition-colors"
                                  onClick={(e) => openImageEditDialog(printer, e)}
                                  aria-label="Edit printer image"
                                >
                                  <ImageIcon className="h-4 w-4 text-white/70" />
                                </button>
                                {printer.official_product_url && (
                                  <button 
                                    className="p-1.5 bg-black/60 backdrop-blur-sm rounded-md hover:bg-black/80 transition-colors"
                                    onClick={(e) => {
                                      e.preventDefault();
                                      e.stopPropagation();
                                      rescrapeMutation.mutate(printer.id);
                                    }}
                                    disabled={rescrapeMutation.isPending}
                                    aria-label="Re-scrape printer data"
                                  >
                                    <RefreshCw className={`h-4 w-4 text-white/70 ${rescrapeMutation.isPending ? 'animate-spin' : ''}`} />
                                  </button>
                                )}
                              </>
                            )}
                          </div>

                          {/* Printer Image */}
                          <div className="relative aspect-square mb-4">
                            {productImage ? (
                              <img 
                                src={productImage} 
                                alt={`${printer.brand?.brand} ${printer.model_name}`}
                                className="w-full h-full object-contain drop-shadow-[0_4px_20px_rgba(0,0,0,0.5)]"
                                onError={(e) => {
                                  (e.target as HTMLImageElement).style.display = 'none';
                                  (e.target as HTMLImageElement).nextElementSibling?.classList.remove('hidden');
                                }}
                              />
                            ) : null}
                            <div className={`w-full h-full flex items-center justify-center ${productImage ? 'hidden' : ''}`}>
                              <PrinterIcon className="h-16 w-16 text-white/20" />
                            </div>
                          </div>

                          {/* Printer Name - Most Prominent */}
                          <h3 className="text-2xl font-bold text-white mb-1 line-clamp-2">
                            {printer.brand?.brand} {printer.model_name}
                          </h3>
                          {printer.variant_or_bundle_name && (
                            <p className="text-sm text-gray-400 mb-2">{printer.variant_or_bundle_name}</p>
                          )}

                          {/* Build Volume + Speed - Single Line */}
                          <p className="text-sm text-[#9CA3AF] mb-3">
                            {printer.build_volume_x_mm && printer.build_volume_y_mm && printer.build_volume_z_mm && (
                              <span>{printer.build_volume_x_mm}×{printer.build_volume_y_mm}×{printer.build_volume_z_mm}mm</span>
                            )}
                            {printer.build_volume_x_mm && printer.max_print_speed_mms && <span> • </span>}
                            {printer.max_print_speed_mms && <span>{printer.max_print_speed_mms}mm/s</span>}
                          </p>

                          {/* Price Section */}
                          <div className="mb-4">
                            {printer.current_price_usd_store ? (
                              <>
                                <span className="text-xl font-bold text-[#F59E0B]">
                                  {formatPrice(printer.current_price_usd_store)}
                                </span>
                                {printer.msrp_usd && printer.current_price_usd_store < printer.msrp_usd && (
                                  <div className="text-sm text-gray-500">
                                    <span className="line-through">{formatPrice(printer.msrp_usd)}</span>
                                    <span className="ml-2 text-green-500">
                                      ({Math.round((1 - printer.current_price_usd_store / printer.msrp_usd) * 100)}% off)
                                    </span>
                                  </div>
                                )}
                              </>
                            ) : printer.current_price_usd_amazon ? (
                              <span className="text-xl font-bold text-[#F59E0B]">
                                {formatPrice(printer.current_price_usd_amazon)}
                              </span>
                            ) : printer.msrp_usd ? (
                              <span className="text-xl font-bold text-[#F59E0B]">
                                {formatPrice(printer.msrp_usd)}
                              </span>
                            ) : (
                              <span className="text-lg text-gray-500">Price TBD</span>
                            )}
                          </div>

                          {/* Feature Tags - Hidden by Default, Show on Hover */}
                          <div className="flex flex-wrap gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity duration-200 mb-3 mt-auto">
                            {printer.has_enclosure && (
                              <span className="text-xs text-cyan-400 bg-cyan-400/10 border border-cyan-400/30 px-2 py-1 rounded-md">
                                Enclosure
                              </span>
                            )}
                            {printer.multi_material_supported && (
                              <span className="text-xs text-cyan-400 bg-cyan-400/10 border border-cyan-400/30 px-2 py-1 rounded-md">
                                Multi-Mat
                              </span>
                            )}
                            {printer.auto_bed_leveling && (
                              <span className="text-xs text-cyan-400 bg-cyan-400/10 border border-cyan-400/30 px-2 py-1 rounded-md">
                                ABL
                              </span>
                            )}
                          </div>

                          {/* Brand Logo - Bottom Right, Subtle */}
                          {getBrandLogo(printer.brand?.brand || null) && (
                            <div className="absolute bottom-5 right-5">
                              <img 
                                src={getBrandLogo(printer.brand?.brand || null)!} 
                                alt={`${printer.brand?.brand} logo`}
                                className="h-auto max-w-[40px] object-contain opacity-50"
                              />
                            </div>
                          )}
                        </div>
                      </Link>
                    </article>
                  );
                })}
              </div>
            )}
        </section>

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