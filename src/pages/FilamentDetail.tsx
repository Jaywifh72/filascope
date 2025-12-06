import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, ExternalLink, ShoppingCart, ThermometerSun, Droplets, Settings, Package, Shield, Award, Gauge, Zap, Ruler, Wind, Flame, Snowflake, Clock, Printer, RefreshCw, AlertTriangle, Store } from "lucide-react";
import { Database } from "@/integrations/supabase/types";
import { getBrandLogo } from "@/lib/brandLogos";
import { LikeButton } from "@/components/LikeButton";
import { useAuth } from "@/hooks/useAuth";
import { usePrinterSelection } from "@/hooks/usePrinterSelection";
import { checkPrinterFilamentCompatibility } from "@/lib/printerCompatibility";
import { CompatibilityBadge } from "@/components/CompatibilityBadge";
import { useAffiliateLinks } from "@/hooks/useAffiliateLinks";

type Filament = Database["public"]["Tables"]["filaments"]["Row"];
type Accessory = Database["public"]["Tables"]["printer_accessories"]["Row"];

interface HotendWithRating extends Accessory {
  rating: "green" | "orange" | "red";
  ratingReason: string;
}

// Extract material from hotend specs - checks multiple field names for flexibility
const getHotendMaterial = (hotend: Accessory): string => {
  const specs = hotend.specs as Record<string, any> | null;
  // Check various field names where material might be stored
  const material = specs?.material || specs?.nozzle_material || specs?.tip_material || "";
  return String(material).toLowerCase();
};

// Rate hotend compatibility with filament - based on material and specs
// Green = Best choice, Orange = Acceptable, Red = Not recommended
const rateHotend = (hotend: Accessory, filament: Filament): { rating: "green" | "orange" | "red"; reason: string } => {
  const specs = hotend.specs as Record<string, any> | null;
  const maxTemp = specs?.max_temp_c || specs?.max_temp || 0;
  const nozzleMaterial = getHotendMaterial(hotend);
  const nameAndDesc = (hotend.name + " " + (hotend.description || "")).toLowerCase();
  const isAbrasionResistant = specs?.abrasion_resistant === true || specs?.hardened === true;
  const diameter = specs?.diameter_mm || specs?.diameter || 0;
  
  // Detect material type from specs and name - check both specs.material and name
  const isHardened = isAbrasionResistant ||
                     nozzleMaterial.includes("hardened") ||
                     nozzleMaterial.includes("obxidian") || // E3D's hardened material
                     nozzleMaterial.includes("hta") || // High Temp Alloy
                     nozzleMaterial.includes("diamondback") ||
                     nozzleMaterial.includes("tungsten") ||
                     nozzleMaterial.includes("ruby") ||
                     nozzleMaterial.includes("sapphire") ||
                     nozzleMaterial.includes("diamond") ||
                     nozzleMaterial.includes("pcd") ||
                     nozzleMaterial.includes("carbide") ||
                     nameAndDesc.includes("hardened") ||
                     nameAndDesc.includes("obxidian") ||
                     nameAndDesc.includes("diamondback") ||
                     nameAndDesc.includes("tungsten") ||
                     nameAndDesc.includes("ruby") ||
                     nameAndDesc.includes("diamond") ||
                     nameAndDesc.includes("pcd") ||
                     nameAndDesc.includes("carbide") ||
                     nameAndDesc.includes("hta ");
  
  const isStainless = nozzleMaterial.includes("stainless") ||
                      nameAndDesc.includes("stainless");
  
  const isBrass = nozzleMaterial.includes("brass") ||
                  nameAndDesc.includes("brass");
  
  // If no material indicators found, check if it's likely a standard hotend
  const hasKnownMaterial = isHardened || isStainless || isBrass || nozzleMaterial.length > 0;
  
  const requiredTemp = filament.nozzle_temp_sweetspot_c || filament.nozzle_temp_max_c || 0;
  const isAbrasive = filament.is_nozzle_abrasive || false;
  
  // Temperature check - if can't handle temp, it's not recommended
  if (maxTemp > 0 && requiredTemp > maxTemp) {
    return { rating: "red", reason: `Max temp ${maxTemp}°C below required ${requiredTemp}°C` };
  }

  // Build reason with diameter info if available
  const diameterInfo = diameter > 0 ? ` (${diameter}mm)` : "";

  // For ABRASIVE filaments (CF, GF, etc.)
  if (isAbrasive) {
    if (isHardened) {
      // Larger diameters are better for abrasive filaments
      if (diameter >= 0.6) {
        return { rating: "green", reason: `Hardened + larger nozzle${diameterInfo} - ideal for abrasive filament` };
      }
      return { rating: "green", reason: `Hardened material${diameterInfo} - best for abrasive filament` };
    }
    if (isStainless) {
      return { rating: "orange", reason: `Stainless steel${diameterInfo} - acceptable, will wear over time` };
    }
    if (isBrass) {
      return { rating: "red", reason: `Brass nozzle${diameterInfo} - will wear rapidly with abrasive filament` };
    }
    // Unknown material - assume not ideal for abrasives
    if (!hasKnownMaterial) {
      return { rating: "orange", reason: `Material unknown${diameterInfo} - verify hardened for abrasive use` };
    }
    return { rating: "orange", reason: `Check material specs${diameterInfo} - ensure suitable for abrasives` };
  }

  // For NON-ABRASIVE filaments - most hotends work well
  if (isBrass) {
    return { rating: "green", reason: `Brass${diameterInfo} - excellent thermal conductivity` };
  }
  if (isStainless || isHardened) {
    return { rating: "green", reason: `Compatible${diameterInfo} - works great with this material` };
  }
  
  // Default - temp is ok, material unknown but should work for non-abrasive
  return { rating: "green", reason: `Compatible${diameterInfo}` };
};

const FilamentDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { isAdmin } = useAuth();
  const { selectedPrinter, printerLoading, selectedPrinterId } = usePrinterSelection();
  const [filament, setFilament] = useState<Filament | null>(null);
  const [loading, setLoading] = useState(true);
  const [rescrapingImage, setRescrapingImage] = useState(false);
  const [compatibleHotends, setCompatibleHotends] = useState<HotendWithRating[]>([]);
  const { getAffiliateUrl, getAmazonUrl } = useAffiliateLinks();

  const compatibility = selectedPrinter && filament 
    ? checkPrinterFilamentCompatibility(selectedPrinter, filament)
    : null;

  // Debug logging
  useEffect(() => {
    console.log("FilamentDetail - Printer Selection State:", {
      selectedPrinterId,
      printerLoading,
      hasSelectedPrinter: !!selectedPrinter,
      selectedPrinter: selectedPrinter ? {
        model_name: selectedPrinter.model_name,
        brand: selectedPrinter.brand
      } : null
    });
  }, [selectedPrinterId, printerLoading, selectedPrinter]);

  useEffect(() => {
    fetchFilament();
  }, [id]);

  // Fetch compatible hotends when printer is selected
  useEffect(() => {
    const fetchCompatibleHotends = async () => {
      if (!selectedPrinter || !filament) {
        setCompatibleHotends([]);
        return;
      }

      try {
        // Get printer brand name
        const printerBrand = typeof selectedPrinter.brand === 'object' && selectedPrinter.brand !== null && 'brand' in selectedPrinter.brand 
          ? (selectedPrinter.brand as { brand: string }).brand 
          : null;

        const printerModel = selectedPrinter.model_name?.toLowerCase() || '';

        // Query all hotends for the printer's brand (no limit to get all compatible)
        let query = supabase
          .from("printer_accessories")
          .select("*")
          .eq("accessory_type", "hotend");
        
        // If we know the brand, filter by it
        if (printerBrand) {
          query = query.or(`compatible_printer_brands.cs.{${printerBrand}},brand.eq.${printerBrand}`);
        }

        const { data: hotends, error } = await query.limit(100);

        if (error) throw error;

        // Helper to check if hotend is compatible with printer model
        const isCompatibleWithPrinter = (hotend: Accessory): boolean => {
          const specs = hotend.specs as Record<string, any> | null;
          const compatibleModels = specs?.compatible_models || specs?.compatible_printers || '';
          const compatibleBrands = hotend.compatible_printer_brands || [];
          const hotendTypes = hotend.compatible_hotend_types || [];
          const hotendName = hotend.name?.toLowerCase() || '';
          
          // 1. Check specs.compatible_models (string or array)
          if (compatibleModels) {
            const modelsStr = Array.isArray(compatibleModels) ? compatibleModels.join(' ') : String(compatibleModels);
            const modelsLower = modelsStr.toLowerCase();
            
            // Check for model name match
            if (printerModel && (
              modelsLower.includes(printerModel) ||
              printerModel.split(/[\s-]+/).some(part => part.length > 1 && modelsLower.includes(part))
            )) {
              return true;
            }
          }
          
          // 2. Parse series from hotend NAME - e.g., "(H2/P2S)", "(X1/P1)", "(A1)"
          // This is crucial for Bambu Lab OEM hotends
          const seriesMatch = hotendName.match(/\(([^)]+)\)/);
          if (seriesMatch) {
            const seriesParts = seriesMatch[1].toLowerCase().split(/[\/,\s]+/);
            // Check if printer model matches any series part
            for (const part of seriesParts) {
              if (part.length >= 2 && (
                printerModel.includes(part) ||
                printerModel.replace(/[\s-]+/g, '').includes(part.replace(/[\s-]+/g, ''))
              )) {
                return true;
              }
            }
          }
          
          // 3. Check compatible_hotend_types for series hints like "Bambu-H2", "Bambu-X1"
          for (const hType of hotendTypes) {
            const typeLower = String(hType).toLowerCase();
            // Extract model identifiers from type strings like "Bambu-H2", "Bambu-X1", "Bambu-P1"
            const typeMatch = typeLower.match(/(h2|p2s|x1|p1|a1|mini)/gi);
            if (typeMatch) {
              for (const tm of typeMatch) {
                if (printerModel.includes(tm.toLowerCase())) {
                  return true;
                }
              }
            }
          }
          
          // 4. Brand-only match (fallback for third-party universal hotends)
          // Only if no series-specific info is found
          if (printerBrand && !seriesMatch && !compatibleModels) {
            const brandMatch = compatibleBrands.some((brand: string) => 
              brand.toLowerCase().includes(printerBrand.toLowerCase()) ||
              printerBrand.toLowerCase().includes(brand.toLowerCase())
            );
            // For brand-only matches, also check if hotend name mentions the brand
            if (brandMatch && hotendName.includes(printerBrand.toLowerCase())) {
              return true;
            }
          }

          return false;
        };

        // Filter to those compatible with this printer
        const compatible = (hotends || []).filter(isCompatibleWithPrinter);

        // Rate each hotend for this filament
        const rated: HotendWithRating[] = compatible.map(hotend => {
          const { rating, reason } = rateHotend(hotend, filament);
          return { ...hotend, rating, ratingReason: reason };
        });

        // Sort: green first, then orange, then red
        rated.sort((a, b) => {
          const order = { green: 0, orange: 1, red: 2 };
          return order[a.rating] - order[b.rating];
        });

        setCompatibleHotends(rated);
        console.log(`Found ${rated.length} compatible hotends for ${printerModel}:`, rated.map(h => h.name));
      } catch (error) {
        console.error("Error fetching compatible hotends:", error);
      }
    };

    fetchCompatibleHotends();
  }, [selectedPrinter, filament]);

  const fetchFilament = async () => {
    try {
      const { data, error } = await supabase
        .from("filaments")
        .select("*")
        .eq("id", id)
        .maybeSingle();

      if (error) throw error;
      
      if (!data) {
        toast({
          title: "Not Found",
          description: "Filament not found",
          variant: "destructive",
        });
        navigate("/");
        return;
      }
      
      setFilament(data);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to load filament details",
        variant: "destructive",
      });
      navigate("/");
    } finally {
      setLoading(false);
    }
  };

  const handleRescrapeImage = async () => {
    if (!id) return;
    
    setRescrapingImage(true);
    try {
      const { data, error } = await supabase.functions.invoke('scrape-images', {
        body: { 
          filamentIds: [id],
          forceRescrape: true
        }
      });

      if (error) throw error;

      toast({
        title: "Image rescrape completed",
        description: data.message || "Image rescraped successfully. Check edge function logs for details.",
        duration: 5000,
      });

      // Refresh filament data
      await fetchFilament();
    } catch (error: any) {
      toast({
        title: "Rescrape failed",
        description: error.message || "Failed to rescrape image. Check edge function logs for details.",
        variant: "destructive",
        duration: 5000,
      });
    } finally {
      setRescrapingImage(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-muted-foreground">Loading filament details...</div>
      </div>
    );
  }

  if (!filament) return null;

  const pricePerKg = filament.variant_price && filament.net_weight_g
    ? ((filament.variant_price / filament.net_weight_g) * 1000).toFixed(2)
    : null;

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-background to-muted/20">
      <div className="max-w-[1400px] mx-auto p-4 lg:p-8">
        <Button variant="ghost" asChild className="mb-6 hover:bg-accent/50 transition-colors">
          <Link to="/">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Finder
          </Link>
        </Button>

        {/* Hero Section */}
        <Card className="bg-gradient-to-br from-card via-card to-card/50 border-border shadow-lg mb-8 overflow-hidden animate-fade-in">
          <CardContent className="p-8">
            <div className="flex flex-col lg:flex-row gap-8">
              {/* Product Image */}
              <div className="w-full lg:w-72 h-72 flex-shrink-0 relative">
                {filament.featured_image ? (
                  <img
                    src={filament.featured_image}
                    alt={filament.product_title}
                    className="w-full h-full object-contain rounded-xl bg-muted/50 border border-border p-4 hover:scale-105 transition-transform duration-300"
                    onError={(e) => {
                      e.currentTarget.style.display = 'none';
                      const placeholder = e.currentTarget.nextElementSibling as HTMLElement;
                      if (placeholder) placeholder.style.display = 'flex';
                    }}
                  />
                ) : null}
                <div 
                  className="w-full h-full rounded-xl bg-muted/50 border border-border flex items-center justify-center p-6"
                  style={{ display: filament.featured_image ? 'none' : 'flex' }}
                >
                  {getBrandLogo(filament.vendor) ? (
                    <img
                      src={getBrandLogo(filament.vendor)!}
                      alt={filament.vendor || 'Brand logo'}
                      className="w-full h-full object-contain"
                    />
                  ) : (
                    <Package className="w-16 h-16 text-muted-foreground/30" />
                  )}
                </div>
                {isAdmin && (
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={handleRescrapeImage}
                    disabled={rescrapingImage}
                    className="absolute bottom-2 right-2 gap-2"
                    title="Rescrape product image with detailed logging"
                  >
                    <RefreshCw className={`w-4 h-4 ${rescrapingImage ? 'animate-spin' : ''}`} />
                    {rescrapingImage ? 'Scraping...' : 'Rescrape Image'}
                  </Button>
                )}
              </div>

              {/* Product Info */}
              <div className="flex-1 min-w-0 space-y-6">
                <div>
                  <div className="flex items-start justify-between gap-4 mb-3">
                    <div className="flex-1">
                      <h1 className="text-4xl lg:text-5xl font-bold text-foreground mb-3 leading-tight">
                        {filament.product_title}
                      </h1>
                      <Link 
                        to={`/brands/${encodeURIComponent(filament.vendor || '')}`}
                        className="text-xl text-primary hover:underline inline-flex items-center gap-2 group"
                      >
                        {filament.vendor}
                        <ExternalLink className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity" />
                      </Link>
                    </div>
                    {pricePerKg && (
                      <div className="text-right bg-primary/10 px-6 py-4 rounded-xl border border-primary/20">
                        <div className="text-4xl font-bold text-primary">
                          ${pricePerKg}
                        </div>
                        <div className="text-sm text-muted-foreground">per kg</div>
                        {filament.variant_price && (
                          <div className="text-xs text-muted-foreground mt-1">
                            ${filament.variant_price} total
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Badges */}
                  <div className="flex gap-2 flex-wrap">
                    {filament.material && (
                      <Badge variant="default" className="text-base px-4 py-1.5 font-semibold">
                        {filament.material}
                      </Badge>
                    )}
                    {filament.diameter_nominal_mm && (
                      <Badge variant="outline" className="text-sm px-3 py-1.5">
                        {filament.diameter_nominal_mm}mm
                      </Badge>
                    )}
                    {filament.color_family && (
                      <Badge variant="outline" className="text-sm px-3 py-1.5 flex items-center gap-2">
                        {filament.color_hex && (
                          <div className="w-3 h-3 rounded-full border border-border" style={{ backgroundColor: filament.color_hex }} />
                        )}
                        {filament.color_family}
                      </Badge>
                    )}
                    {filament.finish_type && (
                      <Badge variant="secondary" className="text-sm px-3 py-1.5">{filament.finish_type}</Badge>
                    )}
                    {filament.is_nozzle_abrasive && (
                      <Badge variant="destructive" className="text-sm px-3 py-1.5 animate-pulse">⚠️ Abrasive</Badge>
                    )}
                    {filament.net_weight_g && (
                      <Badge variant="outline" className="text-sm px-3 py-1.5">
                        <Package className="w-3 h-3 mr-1" />
                        {filament.net_weight_g}g
                      </Badge>
                    )}
                  </div>
                </div>

                {/* Performance Scores */}
                {(filament.ease_of_printing_score || filament.strength_index || filament.value_score) && (
                  <div className="grid grid-cols-3 gap-4">
                    {filament.ease_of_printing_score && (
                      <div className="bg-accent/30 rounded-lg p-4 text-center">
                        <Zap className="w-5 h-5 mx-auto mb-2 text-primary" />
                        <div className="text-2xl font-bold text-foreground">{filament.ease_of_printing_score}/10</div>
                        <div className="text-xs text-muted-foreground">Ease of Printing</div>
                      </div>
                    )}
                    {filament.strength_index && (
                      <div className="bg-accent/30 rounded-lg p-4 text-center">
                        <Award className="w-5 h-5 mx-auto mb-2 text-primary" />
                        <div className="text-2xl font-bold text-foreground">{filament.strength_index}/10</div>
                        <div className="text-xs text-muted-foreground">Strength Index</div>
                      </div>
                    )}
                    {filament.value_score && (
                      <div className="bg-accent/30 rounded-lg p-4 text-center">
                        <Gauge className="w-5 h-5 mx-auto mb-2 text-primary" />
                        <div className="text-2xl font-bold text-foreground">{filament.value_score}/10</div>
                        <div className="text-xs text-muted-foreground">Value Score</div>
                      </div>
                    )}
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex flex-wrap gap-3">
                  <LikeButton filamentId={filament.id} size="lg" />
                  {filament.product_url && (
                    <Button asChild variant="default" size="lg" className="hover:scale-105 transition-transform">
                      <a href={getAffiliateUrl(filament.product_url, filament.vendor) || filament.product_url} target="_blank" rel="noopener noreferrer">
                        <ShoppingCart className="w-4 h-4 mr-2" />
                        Buy from {filament.vendor}
                      </a>
                    </Button>
                  )}
                  {filament.amazon_link_us && (
                    <Button asChild variant="outline" size="lg" className="hover:scale-105 transition-transform">
                      <a href={getAmazonUrl(filament.amazon_link_us, "us") || filament.amazon_link_us} target="_blank" rel="noopener noreferrer">
                        <ShoppingCart className="w-4 h-4 mr-2" />
                        Amazon US
                      </a>
                    </Button>
                  )}
                  {filament.amazon_link_uk && (
                    <Button asChild variant="outline" size="lg" className="hover:scale-105 transition-transform">
                      <a href={getAmazonUrl(filament.amazon_link_uk, "uk") || filament.amazon_link_uk} target="_blank" rel="noopener noreferrer">
                        Amazon UK
                      </a>
                    </Button>
                  )}
                  {filament.amazon_link_de && (
                    <Button asChild variant="outline" size="lg" className="hover:scale-105 transition-transform">
                      <a href={getAmazonUrl(filament.amazon_link_de, "de") || filament.amazon_link_de} target="_blank" rel="noopener noreferrer">
                        Amazon DE
                      </a>
                    </Button>
                  )}
                  {filament.tds_url && (
                    <Button asChild variant="secondary" size="lg" className="hover:scale-105 transition-transform">
                      <a href={filament.tds_url} target="_blank" rel="noopener noreferrer">
                        <ExternalLink className="w-4 h-4 mr-2" />
                        Technical Data Sheet
                      </a>
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Printer Compatibility Section - Featured & Dynamic */}
        {selectedPrinter && compatibility ? (
          <Card className="bg-gradient-to-br from-primary/10 via-card to-primary/5 border-primary/30 shadow-xl mb-8 animate-fade-in">
            <CardHeader className="bg-gradient-to-r from-primary/20 to-transparent border-b border-primary/20 pb-4">
              <CardTitle className="flex items-center gap-3 text-xl">
                <div className="p-2 bg-primary/20 rounded-lg">
                  <Printer className="w-6 h-6 text-primary" />
                </div>
                <div className="flex-1">
                  <div className="text-xl font-bold">Print Settings for Your Printer</div>
                  <div className="text-sm font-normal text-muted-foreground">
                    {typeof selectedPrinter.brand === 'object' && selectedPrinter.brand !== null && 'brand' in selectedPrinter.brand ? selectedPrinter.brand.brand : 'Selected Printer'} {selectedPrinter.model_name}
                  </div>
                </div>
                <CompatibilityBadge compatibility={compatibility} showIcon={true} />
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-6">
              {/* Quick Settings Grid - Most Important Info First */}
              <div className="grid md:grid-cols-2 gap-4">
                {/* Temperature & Nozzle Setup Combined */}
                <Card className="bg-gradient-to-br from-background to-background/50 border-border shadow-md hover:shadow-lg transition-shadow">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base flex items-center gap-2">
                      <Flame className="w-5 h-5 text-orange-500" />
                      Temperature & Nozzle Setup
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* Temperature Settings */}
                    <div className="grid grid-cols-2 gap-3">
                      <div className="p-3 bg-orange-500/10 rounded-lg border border-orange-500/20">
                        <div className="text-xs text-muted-foreground mb-1">🌡️ Nozzle</div>
                        <div className="text-xl font-bold text-orange-500">
                          {compatibility.recommendations.slicer.nozzle_temp_range}
                        </div>
                      </div>
                      <div className="p-3 bg-blue-500/10 rounded-lg border border-blue-500/20">
                        <div className="text-xs text-muted-foreground mb-1">🔥 Bed</div>
                        <div className="text-xl font-bold text-blue-500">
                          {compatibility.recommendations.slicer.bed_temp_range}
                        </div>
                      </div>
                    </div>

                    {/* Nozzle Recommendations */}
                    <div className="pt-3 border-t border-border space-y-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="text-xs text-muted-foreground mb-1">Recommended Sizes</div>
                          <div className="flex gap-1.5 flex-wrap">
                            {compatibility.recommendations.nozzle.size.map((size, i) => (
                              <Badge key={i} variant="secondary" className="text-sm font-bold px-2 py-0.5">
                                {size}
                              </Badge>
                            ))}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-xs text-muted-foreground mb-1">Material</div>
                          <Badge variant="default" className="text-xs font-semibold">
                            {compatibility.recommendations.nozzle.material}
                          </Badge>
                        </div>
                      </div>
                      {compatibility.recommendations.nozzle.notes && (
                        <p className="text-xs text-muted-foreground">
                          💡 {compatibility.recommendations.nozzle.notes}
                        </p>
                      )}
                    </div>
                  </CardContent>
                </Card>

                {/* Build Plate Card */}
                <Card className="bg-gradient-to-br from-background to-background/50 border-border shadow-md hover:shadow-lg transition-shadow">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base flex items-center gap-2">
                      <Package className="w-5 h-5 text-primary" />
                      Build Plate
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div>
                      <div className="text-xs text-muted-foreground mb-2">Recommended Types</div>
                      <div className="flex gap-2 flex-wrap">
                        {compatibility.recommendations.bed.plate_types.map((type, i) => (
                          <Badge key={i} variant="outline" className="text-sm">
                            {type}
                          </Badge>
                        ))}
                      </div>
                    </div>
                    {compatibility.recommendations.bed.notes && (
                      <p className="text-xs text-muted-foreground pt-2 border-t border-border">
                        💡 {compatibility.recommendations.bed.notes}
                      </p>
                    )}
                  </CardContent>
                </Card>
              </div>

              {/* Compatible Hotends - Full Width */}
              {compatibleHotends.length > 0 && (() => {
                // Group hotends by diameter
                const getDiameter = (hotend: typeof compatibleHotends[0]): string => {
                  const specs = hotend.specs as Record<string, any> | null;
                  if (specs?.diameter) {
                    const d = parseFloat(specs.diameter);
                    if (d === 0.2) return '0.2';
                    if (d === 0.4) return '0.4';
                    if (d === 0.6) return '0.6';
                    if (d === 0.8) return '0.8';
                    return 'other';
                  }
                  // Try to extract from name
                  const name = hotend.name.toLowerCase();
                  if (name.includes('0.2mm') || name.includes('0.2 mm')) return '0.2';
                  if (name.includes('0.4mm') || name.includes('0.4 mm')) return '0.4';
                  if (name.includes('0.6mm') || name.includes('0.6 mm')) return '0.6';
                  if (name.includes('0.8mm') || name.includes('0.8 mm')) return '0.8';
                  return 'other';
                };

                const grouped = compatibleHotends.reduce((acc, hotend) => {
                  const diameter = getDiameter(hotend);
                  if (!acc[diameter]) acc[diameter] = [];
                  acc[diameter].push(hotend);
                  return acc;
                }, {} as Record<string, typeof compatibleHotends>);

                const diameterOrder = ['0.2', '0.4', '0.6', '0.8', 'other'];
                const diameterLabels: Record<string, string> = {
                  '0.2': '0.2mm Nozzles',
                  '0.4': '0.4mm Nozzles',
                  '0.6': '0.6mm Nozzles',
                  '0.8': '0.8mm Nozzles',
                  'other': 'Other Sizes'
                };

                return (
                  <Card className="bg-gradient-to-br from-background to-background/50 border-border shadow-md">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-base flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Settings className="w-5 h-5 text-primary" />
                          Compatible Hotends
                        </div>
                        <span className="text-xs font-normal text-muted-foreground">🟢 Best • 🟠 Caution • 🔴 Not Recommended</span>
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      <TooltipProvider delayDuration={200}>
                        {diameterOrder.map((diameter) => {
                          const hotends = grouped[diameter];
                          if (!hotends || hotends.length === 0) return null;
                          
                          return (
                            <div key={diameter} className="space-y-3">
                              <h4 className="text-sm font-semibold text-muted-foreground border-b border-border pb-2">
                                {diameterLabels[diameter]} ({hotends.length})
                              </h4>
                              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                                {hotends.map((hotend) => {
                                  const specs = hotend.specs as Record<string, any> | null;
                                  return (
                                    <Tooltip key={hotend.id}>
                                      <TooltipTrigger asChild>
                                        <div 
                                          className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer ${
                                            hotend.rating === 'green' ? 'bg-green-500/5 border-green-500/20 hover:bg-green-500/10' :
                                            hotend.rating === 'orange' ? 'bg-orange-500/5 border-orange-500/20 hover:bg-orange-500/10' :
                                            'bg-red-500/5 border-red-500/20 hover:bg-red-500/10'
                                          } transition-colors`}
                                        >
                                          {/* Rating indicator */}
                                          <div className={`w-3 h-3 rounded-full flex-shrink-0 ${
                                            hotend.rating === 'green' ? 'bg-green-500' :
                                            hotend.rating === 'orange' ? 'bg-orange-500' :
                                            'bg-red-500'
                                          }`} />
                                          
                                          {/* Hotend image */}
                                          <div className="w-12 h-12 flex-shrink-0 rounded bg-muted/50 overflow-hidden">
                                            {hotend.image_url ? (
                                              <img 
                                                src={hotend.image_url} 
                                                alt={hotend.name}
                                                className="w-full h-full object-cover"
                                              />
                                            ) : (
                                              <div className="w-full h-full flex items-center justify-center">
                                                <Settings className="w-5 h-5 text-muted-foreground/50" />
                                              </div>
                                            )}
                                          </div>

                                          {/* Hotend info */}
                                          <div className="flex-1 min-w-0">
                                            <div className="text-sm font-medium truncate">{hotend.name}</div>
                                            <div className="text-xs text-muted-foreground truncate">
                                              {hotend.brand}
                                            </div>
                                            <div className="text-xs text-muted-foreground/80 truncate">
                                              {hotend.ratingReason}
                                            </div>
                                          </div>

                                          {/* Action links */}
                                          <div className="flex flex-col gap-1 flex-shrink-0">
                                            <Link 
                                              to={`/hotends/${hotend.id}`}
                                              className="p-1.5 hover:bg-muted rounded text-muted-foreground hover:text-foreground transition-colors"
                                              onClick={(e) => e.stopPropagation()}
                                            >
                                              <ExternalLink className="w-4 h-4" />
                                            </Link>
                                            {hotend.product_url && (
                                              <a 
                                                href={getAffiliateUrl(hotend.product_url, hotend.brand) || hotend.product_url}
                                                target="_blank" 
                                                rel="noopener noreferrer"
                                                className="p-1.5 hover:bg-muted rounded text-muted-foreground hover:text-foreground transition-colors"
                                                onClick={(e) => e.stopPropagation()}
                                              >
                                                <Store className="w-4 h-4" />
                                              </a>
                                            )}
                                          </div>
                                        </div>
                                      </TooltipTrigger>
                                      <TooltipContent side="top" className="max-w-xs p-3">
                                        <div className="space-y-2">
                                          <div className="font-semibold text-sm">{hotend.name}</div>
                                          <div className={`text-xs font-medium ${
                                            hotend.rating === 'green' ? 'text-green-500' :
                                            hotend.rating === 'orange' ? 'text-orange-500' :
                                            'text-red-500'
                                          }`}>
                                            {hotend.rating === 'green' ? '✓ Recommended' : 
                                             hotend.rating === 'orange' ? '⚠ Use with caution' : 
                                             '✗ Not recommended'}
                                          </div>
                                          <p className="text-xs text-muted-foreground">{hotend.ratingReason}</p>
                                          {specs && (
                                            <div className="pt-2 border-t border-border space-y-1">
                                              <div className="text-[10px] text-muted-foreground font-medium uppercase">Specifications</div>
                                              {specs.max_temp && (
                                                <div className="text-xs flex justify-between">
                                                  <span className="text-muted-foreground">Max Temp:</span>
                                                  <span>{specs.max_temp}°C</span>
                                                </div>
                                              )}
                                              {specs.diameter && (
                                                <div className="text-xs flex justify-between">
                                                  <span className="text-muted-foreground">Diameter:</span>
                                                  <span>{specs.diameter}mm</span>
                                                </div>
                                              )}
                                              {specs.material && (
                                                <div className="text-xs flex justify-between">
                                                  <span className="text-muted-foreground">Material:</span>
                                                  <span>{specs.material}</span>
                                                </div>
                                              )}
                                              {specs.hardened !== undefined && (
                                                <div className="text-xs flex justify-between">
                                                  <span className="text-muted-foreground">Hardened:</span>
                                                  <span>{specs.hardened ? 'Yes' : 'No'}</span>
                                                </div>
                                              )}
                                            </div>
                                          )}
                                          {hotend.price && (
                                            <div className="pt-2 border-t border-border">
                                              <div className="text-xs flex justify-between">
                                                <span className="text-muted-foreground">Price:</span>
                                                <span className="font-medium">${hotend.price}</span>
                                              </div>
                                            </div>
                                          )}
                                        </div>
                                      </TooltipContent>
                                    </Tooltip>
                                  );
                                })}
                              </div>
                            </div>
                          );
                        })}
                      </TooltipProvider>
                    </CardContent>
                  </Card>
                );
              })()}

              {/* Limitations & Warnings */}
              {(compatibility.limitations.length > 0 || compatibility.recommendations.warnings.length > 0) && (
                <div className="grid md:grid-cols-2 gap-4">
                  {compatibility.limitations.length > 0 && (
                    <Card className="bg-destructive/5 border-destructive/20">
                      <CardHeader className="pb-3">
                        <CardTitle className="text-base flex items-center gap-2 text-destructive">
                          <AlertTriangle className="w-5 h-5" />
                          Limitations
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <ul className="space-y-2">
                          {compatibility.limitations.map((limitation, index) => (
                            <li key={index} className="text-sm flex items-start gap-2">
                              <span className="text-destructive mt-0.5 font-bold">✗</span>
                              <span>{limitation}</span>
                            </li>
                          ))}
                        </ul>
                      </CardContent>
                    </Card>
                  )}

                  {compatibility.recommendations.warnings.length > 0 && (
                    <Card className="bg-yellow-500/5 border-yellow-500/20">
                      <CardHeader className="pb-3">
                        <CardTitle className="text-base flex items-center gap-2 text-yellow-600">
                          <AlertTriangle className="w-5 h-5" />
                          Warnings
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <ul className="space-y-2">
                          {compatibility.recommendations.warnings.map((warning, index) => (
                            <li key={index} className="text-sm flex items-start gap-2">
                              <span className="text-yellow-600 mt-0.5 font-bold">⚠</span>
                              <span>{warning}</span>
                            </li>
                          ))}
                        </ul>
                      </CardContent>
                    </Card>
                  )}
                </div>
              )}

              {/* Slicer Notes */}
              {compatibility.recommendations.slicer.notes.length > 0 && (
                <Card className="bg-primary/5 border-primary/20">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base flex items-center gap-2">
                      <Settings className="w-5 h-5 text-primary" />
                      Additional Slicer Settings
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2">
                      {compatibility.recommendations.slicer.notes.map((note, index) => (
                        <li key={index} className="text-sm flex items-start gap-2">
                          <span className="text-primary mt-0.5 font-bold">•</span>
                          <span>{note}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              )}

              {/* Action Buttons */}
              <div className="flex gap-3 pt-2 flex-wrap">
                <Button variant="outline" asChild>
                  <Link to="/">
                    <Printer className="w-4 h-4 mr-2" />
                    Change Printer
                  </Link>
                </Button>
                <Button variant="outline" asChild>
                  <Link to="/matrix">
                    View Full Compatibility Matrix
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : !printerLoading && !selectedPrinter && (
          <Card className="bg-gradient-to-br from-muted/30 to-muted/10 border-dashed border-2 border-border mb-8 animate-fade-in hover:border-primary/30 transition-colors">
            <CardContent className="p-8 text-center">
              <div className="p-4 bg-primary/10 rounded-full w-20 h-20 mx-auto mb-4 flex items-center justify-center">
                <Printer className="w-10 h-10 text-primary" />
              </div>
              <h3 className="text-xl font-bold mb-2">Select Your Printer for Custom Settings</h3>
              <p className="text-muted-foreground mb-4 max-w-md mx-auto">
                Get personalized temperature ranges, nozzle recommendations, and build plate suggestions specifically for this filament
              </p>
              <Button size="lg" asChild className="hover:scale-105 transition-transform">
                <Link to="/">
                  <Printer className="w-4 h-4 mr-2" />
                  Select Your Printer
                </Link>
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Tabs Section */}
        <Tabs defaultValue="specs" className="space-y-6">
          <TabsList className="bg-muted/50 p-1 h-auto">
            <TabsTrigger value="specs" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              <Package className="w-4 h-4 mr-2" />
              Technical Specs
            </TabsTrigger>
            <TabsTrigger value="printing" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              <Printer className="w-4 h-4 mr-2" />
              Print Settings
            </TabsTrigger>
            <TabsTrigger value="properties" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              <Award className="w-4 h-4 mr-2" />
              Material Properties
            </TabsTrigger>
            <TabsTrigger value="compatibility" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              <Shield className="w-4 h-4 mr-2" />
              Compatibility
            </TabsTrigger>
          </TabsList>

          {/* Technical Specs Tab */}
          <TabsContent value="specs" className="space-y-6 animate-fade-in">
            <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-6">
              {/* Physical Properties */}
              <Card className="bg-card border-border hover:shadow-lg transition-shadow">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Ruler className="w-5 h-5 text-primary" />
                    Physical Specifications
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {filament.diameter_nominal_mm && (
                    <PropertyRow label="Filament Diameter" value={`${filament.diameter_nominal_mm} mm`} icon={<Ruler className="w-4 h-4" />} />
                  )}
                  {filament.net_weight_g && (
                    <PropertyRow label="Net Weight" value={`${filament.net_weight_g}g (${(filament.net_weight_g / 1000).toFixed(2)}kg)`} icon={<Package className="w-4 h-4" />} />
                  )}
                  {filament.density_g_cm3 && (
                    <PropertyRow label="Material Density" value={`${filament.density_g_cm3} g/cm³`} />
                  )}
                  {filament.dimensional_accuracy_score && (
                    <PropertyRow label="Dimensional Accuracy" value={`${filament.dimensional_accuracy_score}/10`} highlight />
                  )}
                </CardContent>
              </Card>

              {/* Spool Dimensions */}
              <Card className="bg-card border-border hover:shadow-lg transition-shadow">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Package className="w-5 h-5 text-primary" />
                    Spool Specifications
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {filament.spool_outer_d_mm && (
                    <PropertyRow label="Outer Diameter" value={`${filament.spool_outer_d_mm} mm`} />
                  )}
                  {filament.spool_width_mm && (
                    <PropertyRow label="Spool Width" value={`${filament.spool_width_mm} mm`} />
                  )}
                  {filament.spool_ams_fit !== null && (
                    <PropertyRow 
                      label="AMS/MMU Compatible" 
                      value={filament.spool_ams_fit ? "✓ Yes" : "✗ No"} 
                      highlight={filament.spool_ams_fit}
                    />
                  )}
                  {filament.color_hex && (
                    <div className="flex justify-between items-center py-2">
                      <span className="text-sm text-muted-foreground">Color Code</span>
                      <div className="flex items-center gap-2">
                        <div 
                          className="w-8 h-8 rounded-lg border-2 border-border shadow-sm"
                          style={{ backgroundColor: filament.color_hex }}
                        />
                        <span className="text-sm font-mono text-foreground">{filament.color_hex}</span>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Product Information */}
              <Card className="bg-card border-border hover:shadow-lg transition-shadow">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Settings className="w-5 h-5 text-primary" />
                    Product Details
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {filament.product_id && (
                    <PropertyRow label="Product ID" value={filament.product_id} />
                  )}
                  {filament.variant_sku && (
                    <PropertyRow label="SKU" value={filament.variant_sku} />
                  )}
                  {filament.variant_available !== null && (
                    <PropertyRow 
                      label="Stock Status" 
                      value={filament.variant_available ? "✓ In Stock" : "✗ Out of Stock"} 
                      highlight={filament.variant_available}
                    />
                  )}
                  {filament.published_at && (
                    <PropertyRow 
                      label="Published" 
                      value={new Date(filament.published_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })} 
                    />
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Performance Indexes */}
            {(filament.printability_index || filament.strength_index || filament.value_score) && (
              <Card className="bg-gradient-to-r from-primary/5 via-primary/10 to-primary/5 border-primary/20">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Award className="w-5 h-5 text-primary" />
                    Performance Indexes
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid sm:grid-cols-2 md:grid-cols-4 gap-4">
                    {filament.printability_index && (
                      <div className="text-center">
                        <div className="text-4xl font-bold text-primary mb-1">{filament.printability_index}/10</div>
                        <div className="text-sm text-muted-foreground">Printability</div>
                      </div>
                    )}
                    {filament.ease_of_printing_score && (
                      <div className="text-center">
                        <div className="text-4xl font-bold text-primary mb-1">{filament.ease_of_printing_score}/10</div>
                        <div className="text-sm text-muted-foreground">Ease of Use</div>
                      </div>
                    )}
                    {filament.strength_index && (
                      <div className="text-center">
                        <div className="text-4xl font-bold text-primary mb-1">{filament.strength_index}/10</div>
                        <div className="text-sm text-muted-foreground">Strength</div>
                      </div>
                    )}
                    {filament.value_score && (
                      <div className="text-center">
                        <div className="text-4xl font-bold text-primary mb-1">{filament.value_score}/10</div>
                        <div className="text-sm text-muted-foreground">Value</div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Print Settings Tab */}
          <TabsContent value="printing" className="space-y-6 animate-fade-in">
            <div className="grid md:grid-cols-2 gap-6">
              {/* Temperature Settings */}
              <Card className="bg-card border-border hover:shadow-lg transition-shadow">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Flame className="w-5 h-5 text-primary" />
                    Temperature Settings
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {(filament.nozzle_temp_min_c || filament.nozzle_temp_max_c) && (
                    <PropertyRow
                      label="Nozzle Temperature Range"
                      value={`${filament.nozzle_temp_min_c || "?"} - ${filament.nozzle_temp_max_c || "?"}°C`}
                      icon={<ThermometerSun className="w-4 h-4" />}
                    />
                  )}
                  {filament.nozzle_temp_sweetspot_c && (
                    <PropertyRow
                      label="🎯 Recommended Nozzle Temp"
                      value={`${filament.nozzle_temp_sweetspot_c}°C`}
                      highlight
                    />
                  )}
                  {(filament.bed_temp_min_c || filament.bed_temp_max_c) && (
                    <PropertyRow
                      label="Bed Temperature Range"
                      value={`${filament.bed_temp_min_c || "?"} - ${filament.bed_temp_max_c || "?"}°C`}
                      icon={<Flame className="w-4 h-4" />}
                    />
                  )}
                  {filament.tg_c && (
                    <PropertyRow label="Glass Transition (Tg)" value={`${filament.tg_c}°C`} />
                  )}
                  {filament.melt_temp_c && (
                    <PropertyRow label="Melt Temperature" value={`${filament.melt_temp_c}°C`} />
                  )}
                </CardContent>
              </Card>

              {/* Print Parameters */}
              <Card className="bg-card border-border hover:shadow-lg transition-shadow">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Zap className="w-5 h-5 text-primary" />
                    Print Parameters
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {filament.print_speed_max_mms && (
                    <PropertyRow
                      label="Maximum Print Speed"
                      value={`${filament.print_speed_max_mms} mm/s`}
                      icon={<Gauge className="w-4 h-4" />}
                    />
                  )}
                  {(filament.fan_min_percent !== null || filament.fan_max_percent !== null) && (
                    <PropertyRow
                      label="Cooling Fan Range"
                      value={`${filament.fan_min_percent || 0}% - ${filament.fan_max_percent || 100}%`}
                      icon={<Wind className="w-4 h-4" />}
                    />
                  )}
                  {filament.recommended_nozzle_type && (
                    <PropertyRow
                      label="🎯 Recommended Nozzle"
                      value={filament.recommended_nozzle_type}
                      highlight
                    />
                  )}
                  {filament.is_nozzle_abrasive !== null && (
                    <PropertyRow
                      label="Nozzle Requirement"
                      value={filament.is_nozzle_abrasive ? "⚠️ Hardened Steel Required" : "✓ Brass Compatible"}
                      highlight={!filament.is_nozzle_abrasive}
                    />
                  )}
                </CardContent>
              </Card>

              {/* Moisture & Care */}
              <Card className="bg-card border-border md:col-span-2 hover:shadow-lg transition-shadow">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Droplets className="w-5 h-5 text-primary" />
                    Moisture Management & Care
                  </CardTitle>
                </CardHeader>
                <CardContent className="grid md:grid-cols-3 gap-6">
                  <div className="space-y-2">
                    {filament.moisture_sensitivity_level && (
                      <PropertyRow
                        label="Moisture Sensitivity"
                        value={filament.moisture_sensitivity_level}
                        icon={<Droplets className="w-4 h-4" />}
                      />
                    )}
                    {filament.drying_temp_c && (
                      <PropertyRow
                        label="Drying Temperature"
                        value={`${filament.drying_temp_c}°C`}
                        icon={<ThermometerSun className="w-4 h-4" />}
                      />
                    )}
                    {filament.drying_time_hours && (
                      <PropertyRow
                        label="Drying Duration"
                        value={`${filament.drying_time_hours} hours`}
                        icon={<Clock className="w-4 h-4" />}
                      />
                    )}
                  </div>
                  {(filament.moisture_care || filament.nozzle_care) && (
                    <div className="md:col-span-2 space-y-4">
                      {filament.moisture_care && (
                        <div className="bg-muted/30 p-4 rounded-lg">
                          <h4 className="font-semibold text-foreground mb-2 flex items-center gap-2">
                            <Droplets className="w-4 h-4 text-primary" />
                            Storage Instructions
                          </h4>
                          <p className="text-sm text-muted-foreground leading-relaxed">{filament.moisture_care}</p>
                        </div>
                      )}
                      {filament.nozzle_care && (
                        <div className="bg-muted/30 p-4 rounded-lg">
                          <h4 className="font-semibold text-foreground mb-2 flex items-center gap-2">
                            <Settings className="w-4 h-4 text-primary" />
                            Nozzle Care Tips
                          </h4>
                          <p className="text-sm text-muted-foreground leading-relaxed">{filament.nozzle_care}</p>
                        </div>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Material Properties Tab */}
          <TabsContent value="properties" className="space-y-6 animate-fade-in">
            <div className="grid md:grid-cols-2 gap-6">
              {/* Mechanical Properties */}
              <Card className="bg-card border-border hover:shadow-lg transition-shadow">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Award className="w-5 h-5 text-primary" />
                    Mechanical Properties
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {filament.tensile_strength_xy_mpa && (
                    <PropertyRow
                      label="Tensile Strength (XY)"
                      value={`${filament.tensile_strength_xy_mpa} MPa`}
                      highlight
                    />
                  )}
                  {filament.tensile_modulus_xy_mpa && (
                    <PropertyRow
                      label="Tensile Modulus (XY)"
                      value={`${filament.tensile_modulus_xy_mpa} MPa`}
                    />
                  )}
                  {filament.flexural_strength_mpa && (
                    <PropertyRow
                      label="Flexural Strength"
                      value={`${filament.flexural_strength_mpa} MPa`}
                    />
                  )}
                  {filament.elongation_break_xy_percent && (
                    <PropertyRow
                      label="Elongation at Break"
                      value={`${filament.elongation_break_xy_percent}%`}
                    />
                  )}
                  {filament.shore_hardness_d && (
                    <PropertyRow
                      label="Shore Hardness (D)"
                      value={`${filament.shore_hardness_d}D`}
                    />
                  )}
                </CardContent>
              </Card>

              {/* Thermal Properties */}
              <Card className="bg-card border-border hover:shadow-lg transition-shadow">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <ThermometerSun className="w-5 h-5 text-primary" />
                    Thermal Properties
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {filament.tg_c && (
                    <PropertyRow
                      label="Glass Transition Temp"
                      value={`${filament.tg_c}°C`}
                      highlight
                    />
                  )}
                  {filament.melt_temp_c && (
                    <PropertyRow
                      label="Melt Temperature"
                      value={`${filament.melt_temp_c}°C`}
                    />
                  )}
                  {filament.nozzle_temp_sweetspot_c && (
                    <PropertyRow
                      label="Optimal Print Temp"
                      value={`${filament.nozzle_temp_sweetspot_c}°C`}
                    />
                  )}
                  {filament.bed_temp_min_c && filament.bed_temp_max_c && (
                    <PropertyRow
                      label="Recommended Bed Temp"
                      value={`${Math.round((filament.bed_temp_min_c + filament.bed_temp_max_c) / 2)}°C`}
                    />
                  )}
                </CardContent>
              </Card>

              {/* Application Tags */}
              <Card className="bg-card border-border md:col-span-2 hover:shadow-lg transition-shadow">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Package className="w-5 h-5 text-primary" />
                    Applications & Use Cases
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {filament.use_case_tags && filament.use_case_tags.length > 0 && (
                    <div>
                      <span className="text-sm text-muted-foreground block mb-3 font-medium">Recommended Use Cases</span>
                      <div className="flex flex-wrap gap-2">
                        {filament.use_case_tags.map((tag, index) => (
                          <Badge key={index} variant="secondary" className="text-sm px-3 py-1.5">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                  {filament.industry_tags && filament.industry_tags.length > 0 && (
                    <div>
                      <span className="text-sm text-muted-foreground block mb-3 font-medium">Industries & Applications</span>
                      <div className="flex flex-wrap gap-2">
                        {filament.industry_tags.map((tag, index) => (
                          <Badge key={index} variant="outline" className="text-sm px-3 py-1.5">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                  {filament.food_contact_rating && (
                    <div className="bg-muted/30 p-4 rounded-lg">
                      <h4 className="font-semibold text-foreground mb-2">Food Contact Rating</h4>
                      <p className="text-sm text-muted-foreground capitalize">{filament.food_contact_rating}</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Compatibility Tab */}
          <TabsContent value="compatibility" className="space-y-6 animate-fade-in">
            <Card className="bg-card border-border hover:shadow-lg transition-shadow">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="w-5 h-5 text-primary" />
                  Printer & Equipment Compatibility
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  <CompatibilityCard
                    label="Brass Nozzle"
                    value={!filament.is_nozzle_abrasive}
                    description={filament.is_nozzle_abrasive ? "Requires hardened steel nozzle" : "Safe with standard brass nozzles"}
                    icon={<Settings className="w-5 h-5" />}
                  />
                  <CompatibilityCard
                    label="AMS/MMU"
                    value={filament.spool_ams_fit}
                    description={filament.spool_ams_fit ? "Compatible with AMS/MMU systems" : "May not fit standard AMS"}
                    icon={<Package className="w-5 h-5" />}
                  />
                  <CompatibilityCard
                    label="Food Safe"
                    value={filament.food_contact_rating === "approved"}
                    description={filament.food_contact_rating || "Rating unknown"}
                    icon={<Shield className="w-5 h-5" />}
                  />
                  <CompatibilityCard
                    label="Easy to Print"
                    value={filament.ease_of_printing_score ? filament.ease_of_printing_score >= 7 : null}
                    description={filament.ease_of_printing_score ? `Score: ${filament.ease_of_printing_score}/10` : "Not rated"}
                    icon={<Zap className="w-5 h-5" />}
                  />
                </div>

                <Separator />

                {/* Recommended Setup */}
                <div className="grid md:grid-cols-2 gap-4">
                  {filament.recommended_nozzle_type && (
                    <div className="bg-primary/5 border border-primary/20 p-4 rounded-lg">
                      <h4 className="font-semibold text-foreground mb-2 flex items-center gap-2">
                        <Settings className="w-4 h-4 text-primary" />
                        Recommended Nozzle
                      </h4>
                      <p className="text-foreground font-medium">{filament.recommended_nozzle_type}</p>
                    </div>
                  )}
                  {filament.moisture_sensitivity_level && (
                    <div className="bg-muted/30 p-4 rounded-lg">
                      <h4 className="font-semibold text-foreground mb-2 flex items-center gap-2">
                        <Droplets className="w-4 h-4 text-primary" />
                        Storage Requirements
                      </h4>
                      <p className="text-foreground font-medium capitalize">{filament.moisture_sensitivity_level} Sensitivity</p>
                      {filament.drying_temp_c && filament.drying_time_hours && (
                        <p className="text-sm text-muted-foreground mt-1">
                          Dry at {filament.drying_temp_c}°C for {filament.drying_time_hours}h if exposed
                        </p>
                      )}
                    </div>
                  )}
                </div>

                {/* Additional Details */}
                {(filament.spool_outer_d_mm || filament.spool_width_mm) && (
                  <div className="bg-muted/30 p-4 rounded-lg">
                    <h4 className="font-semibold text-foreground mb-3">Spool Dimensions</h4>
                    <div className="grid grid-cols-2 gap-4">
                      {filament.spool_outer_d_mm && (
                        <div>
                          <p className="text-sm text-muted-foreground">Outer Diameter</p>
                          <p className="text-lg font-semibold text-foreground">{filament.spool_outer_d_mm}mm</p>
                        </div>
                      )}
                      {filament.spool_width_mm && (
                        <div>
                          <p className="text-sm text-muted-foreground">Width</p>
                          <p className="text-lg font-semibold text-foreground">{filament.spool_width_mm}mm</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};



const PropertyRow = ({ 
  label, 
  value, 
  highlight = false,
  icon
}: { 
  label: string; 
  value: string; 
  highlight?: boolean;
  icon?: React.ReactNode;
}) => (
  <div className={`flex justify-between items-center py-2 ${highlight ? 'bg-primary/5 px-3 rounded-lg border border-primary/20' : ''}`}>
    <span className="text-sm text-muted-foreground flex items-center gap-2">
      {icon && <span className="text-muted-foreground">{icon}</span>}
      {label}
    </span>
    <span className={`text-sm font-medium ${highlight ? 'text-primary font-semibold' : 'text-foreground'}`}>{value}</span>
  </div>
);

const CompatibilityCard = ({ 
  label, 
  value, 
  description,
  icon
}: { 
  label: string; 
  value?: boolean | null; 
  description: string;
  icon?: React.ReactNode;
}) => {
  const getStatusColor = () => {
    if (value === true) return "bg-emerald-500/10 border-emerald-500/30";
    if (value === false) return "bg-red-500/10 border-red-500/30";
    return "bg-muted border-border";
  };

  const getStatusIcon = () => {
    if (value === true) return "✓";
    if (value === false) return "✗";
    return "?";
  };

  return (
    <div className={`p-4 rounded-lg border ${getStatusColor()} transition-all hover:shadow-md`}>
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-semibold text-foreground flex items-center gap-2">
          {icon && <span className="text-primary">{icon}</span>}
          {label}
        </span>
        <span className="text-xl font-bold">
          {getStatusIcon()}
        </span>
      </div>
      <p className="text-xs text-muted-foreground leading-relaxed">{description}</p>
    </div>
  );
};

export default FilamentDetail;