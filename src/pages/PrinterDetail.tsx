import { useParams, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { AccessoryPriceChart } from "@/components/AccessoryPriceChart";
import { useState, useEffect } from "react";
import {
  ArrowLeft,
  Box,
  Cpu,
  Gauge,
  Thermometer,
  Zap,
  DollarSign,
  Star,
  ExternalLink,
  Layers,
  Settings,
  Wifi,
  Monitor,
  Package,
  CheckCircle2,
  XCircle,
  Flame,
  Activity,
  Ruler,
  Wind,
  Power,
  Blend,
  TrendingUp,
  TrendingDown,
  ChevronLeft,
  ChevronRight,
  X,
} from "lucide-react";

const PrinterDetail = () => {
  const { id } = useParams();
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [productImages, setProductImages] = useState<string[]>([]);

  const { data: printer, isLoading } = useQuery({
    queryKey: ["printer-detail", id],
    queryFn: async () => {
      // Try by printer_id slug first, then by UUID
      const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id || '');
      
      const { data, error } = await supabase
        .from("printers")
        .select(`
          *,
          brand:printer_brands!brand_id(brand),
          series:printer_series!series_id(series_name)
        `)
        .eq(isUUID ? "id" : "printer_id", id)
        .maybeSingle();

      if (error) throw error;
      return data;
    },
  });


  // Extract brand name for accessory query
  const printerBrand = typeof printer?.brand === 'object' && printer?.brand !== null && 'brand' in printer.brand 
    ? printer.brand.brand 
    : null;

  const { data: accessories } = useQuery({
    queryKey: ["printer-accessories", printer?.id, printerBrand],
    enabled: !!printer?.id,
    queryFn: async () => {
      // Fetch printer-specific accessories
      const { data: printerSpecific, error: error1 } = await supabase
        .from("printer_accessories")
        .select("*")
        .eq("printer_id", printer!.id);

      if (error1) throw error1;

      // Fetch brand-compatible accessories (where brand is in compatible_printer_brands array)
      let brandCompatible: typeof printerSpecific = [];
      if (printerBrand) {
        const { data: brandData, error: error2 } = await supabase
          .from("printer_accessories")
          .select("*")
          .contains("compatible_printer_brands", [printerBrand]);

        if (error2) throw error2;
        brandCompatible = brandData || [];
      }

      // Merge and deduplicate by id
      const allAccessories = [...(printerSpecific || []), ...brandCompatible];
      const uniqueAccessories = allAccessories.filter(
        (acc, index, self) => index === self.findIndex((a) => a.id === acc.id)
      );

      // Sort by accessory_type then name
      return uniqueAccessories.sort((a, b) => {
        const typeCompare = (a.accessory_type || "").localeCompare(b.accessory_type || "");
        if (typeCompare !== 0) return typeCompare;
        return (a.name || "").localeCompare(b.name || "");
      });
    },
  });

  // Extract product images when printer data changes
  useEffect(() => {
    try {
      if (printer?.scraped_data) {
        const scrapedData = printer.scraped_data as any;
        const images = scrapedData?.images?.product_images;
        if (Array.isArray(images) && images.length > 0) {
          setProductImages(images);
        }
      }
    } catch (error) {
      console.error("Error extracting product images:", error);
      setProductImages([]);
    }
  }, [printer]);

  const openLightbox = (index: number) => {
    setCurrentImageIndex(index);
    setLightboxOpen(true);
  };

  const nextImage = () => {
    if (productImages.length > 0) {
      setCurrentImageIndex((prev) => (prev + 1) % productImages.length);
    }
  };

  const prevImage = () => {
    if (productImages.length > 0) {
      setCurrentImageIndex((prev) => (prev - 1 + productImages.length) % productImages.length);
    }
  };


  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-accent/5 p-8">
        <div className="max-w-7xl mx-auto">
          <div className="animate-pulse space-y-8">
            <div className="h-8 bg-muted rounded w-1/4"></div>
            <div className="h-64 bg-muted rounded"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="h-48 bg-muted rounded"></div>
              <div className="h-48 bg-muted rounded"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!printer) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-accent/5 p-8">
        <div className="max-w-7xl mx-auto text-center">
          <h1 className="text-2xl font-bold mb-4">Printer not found</h1>
          <Link to="/printers">
            <Button>Back to Printers</Button>
          </Link>
        </div>
      </div>
    );
  }

  const brand = typeof printer.brand === 'object' && printer.brand !== null && 'brand' in printer.brand 
    ? printer.brand.brand 
    : null;
  const series = typeof printer.series === 'object' && printer.series !== null && 'series_name' in printer.series 
    ? printer.series.series_name 
    : null;

  const SpecRow = ({ label, value, unit = "" }: { label: string; value: any; unit?: string }) => {
    if (value === null || value === undefined) return null;
    
    const displayValue = typeof value === "boolean" 
      ? (value ? "Yes" : "No")
      : `${value}${unit}`;

    const icon = typeof value === "boolean" 
      ? (value ? <CheckCircle2 className="h-4 w-4 text-green-500" /> : <XCircle className="h-4 w-4 text-muted" />)
      : null;

    return (
      <div className="flex justify-between items-center py-3 border-b border-border/30 last:border-0 hover:bg-muted/30 px-3 rounded transition-colors">
        <span className="text-sm text-muted-foreground">{label}</span>
        <div className="flex items-center gap-2">
          <span className="font-semibold text-sm">{displayValue}</span>
          {icon}
        </div>
      </div>
    );
  };

  const SpecSection = ({ title, icon: Icon, children }: { title: string; icon: any; children: React.ReactNode }) => (
    <Card className="overflow-hidden border-2">
      <div className="bg-gradient-to-r from-muted/50 to-background p-4 border-b">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-primary/10">
            <Icon className="h-5 w-5 text-primary" />
          </div>
          <h3 className="text-lg font-semibold">{title}</h3>
        </div>
      </div>
      <div className="p-6 space-y-1">{children}</div>
    </Card>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted/20 to-primary/5">
      <div className="max-w-[1600px] mx-auto p-4 md:p-8 space-y-8">
        {/* Navigation */}
        <div className="flex items-center gap-4">
          <Link to="/printers">
            <Button variant="ghost" size="icon" className="rounded-full">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
        </div>

        {/* Hero Section */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-primary/10 via-primary/5 to-background border border-border/50 backdrop-blur-sm">
          <div className="absolute inset-0 bg-grid-white/5 [mask-image:linear-gradient(0deg,transparent,black)]" />
          <div className="relative p-8 md:p-12">
            <div className="flex flex-col lg:flex-row gap-8 items-start">
              {/* Product Images */}
              {productImages.length > 0 && (
                <div className="w-full lg:w-auto lg:min-w-[400px]">
                  <Card 
                    className="overflow-hidden border-2 bg-background/80 backdrop-blur-sm cursor-pointer hover:shadow-xl transition-shadow"
                    onClick={() => openLightbox(0)}
                  >
                    <CardContent className="p-0">
                      <img 
                        src={productImages[0]} 
                        alt={`${printer.model_name} product image`}
                        className="w-full h-auto object-contain max-h-[500px]"
                        onError={(e) => {
                          e.currentTarget.style.display = 'none';
                        }}
                      />
                    </CardContent>
                  </Card>
                  {productImages.length > 1 && (
                    <div className="grid grid-cols-4 gap-2 mt-2">
                      {productImages.slice(1, 5).map((img: string, idx: number) => (
                        <Card 
                          key={idx} 
                          className="overflow-hidden border bg-background/80 backdrop-blur-sm cursor-pointer hover:shadow-lg transition-shadow"
                          onClick={() => openLightbox(idx + 1)}
                        >
                          <CardContent className="p-1">
                            <img 
                              src={img} 
                              alt={`${printer.model_name} image ${idx + 2}`}
                              className="w-full h-20 object-cover rounded"
                              onError={(e) => {
                                e.currentTarget.style.display = 'none';
                              }}
                            />
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}
                </div>
              )}

              <div className="flex-1 space-y-4">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant="secondary" className="text-sm px-3 py-1">{brand}</Badge>
                  {series && <Badge variant="outline" className="text-sm px-3 py-1">{series}</Badge>}
                  {printer.discontinued && <Badge variant="destructive" className="text-sm px-3 py-1">Discontinued</Badge>}
                </div>
                <h1 className="text-4xl md:text-6xl font-bold bg-gradient-to-br from-foreground via-foreground/90 to-foreground/70 bg-clip-text text-transparent tracking-tight">
                  {printer.model_name}
                </h1>
                {printer.variant_or_bundle_name && (
                  <p className="text-lg text-muted-foreground">{printer.variant_or_bundle_name}</p>
                )}
                
                {/* Price & Buy Buttons */}
                <div className="flex flex-wrap items-center gap-4 pt-4">
                  {printer.msrp_usd && (
                    <div className="flex items-baseline gap-2">
                      <span className="text-4xl font-bold text-primary">${printer.msrp_usd}</span>
                      <span className="text-sm text-muted-foreground">MSRP</span>
                    </div>
                  )}
                </div>

                {(printer.official_product_url || printer.official_store_url || printer.amazon_url_us) && (
                  <div className="flex flex-wrap gap-3 pt-2">
                    {printer.official_product_url && (
                      <a href={printer.official_product_url} target="_blank" rel="noopener noreferrer">
                        <Button size="lg" className="gap-2">
                          <ExternalLink className="h-4 w-4" />
                          View Product
                        </Button>
                      </a>
                    )}
                    {printer.official_store_url && (
                      <a href={printer.official_store_url} target="_blank" rel="noopener noreferrer">
                        <Button size="lg" variant="outline" className="gap-2">
                          <ExternalLink className="h-4 w-4" />
                          Official Store
                        </Button>
                      </a>
                    )}
                    {printer.amazon_url_us && (
                      <a href={printer.amazon_url_us} target="_blank" rel="noopener noreferrer">
                        <Button size="lg" variant="outline" className="gap-2">
                          <ExternalLink className="h-4 w-4" />
                          Amazon US
                        </Button>
                      </a>
                    )}
                  </div>
                )}
              </div>
              
              {/* Quick Stats Card */}
              <Card className="w-full md:w-auto md:min-w-[320px] bg-background/80 backdrop-blur-sm border-2">
                <CardContent className="p-6 space-y-4">
                  <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">Key Specs</h3>
                  <div className="space-y-3">
                    {printer.build_volume_x_mm && (
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Box className="h-4 w-4 text-primary" />
                          <span className="text-sm text-muted-foreground">Build Volume</span>
                        </div>
                        <span className="font-semibold">
                          {printer.build_volume_x_mm}×{printer.build_volume_y_mm}×{printer.build_volume_z_mm}mm
                        </span>
                      </div>
                    )}
                    {printer.max_print_speed_mms && (
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Gauge className="h-4 w-4 text-primary" />
                          <span className="text-sm text-muted-foreground">Max Speed</span>
                        </div>
                        <span className="font-semibold">{printer.max_print_speed_mms} mm/s</span>
                      </div>
                    )}
                    {printer.max_nozzle_temp_c && (
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Thermometer className="h-4 w-4 text-primary" />
                          <span className="text-sm text-muted-foreground">Max Nozzle</span>
                        </div>
                        <span className="font-semibold">{printer.max_nozzle_temp_c}°C</span>
                      </div>
                    )}
                    {printer.bed_max_temp_c && (
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Flame className="h-4 w-4 text-primary" />
                          <span className="text-sm text-muted-foreground">Max Bed</span>
                        </div>
                        <span className="font-semibold">{printer.bed_max_temp_c}°C</span>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>

        {/* Feature Highlights */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {printer.has_enclosure && (
            <Card className="p-4 text-center hover:shadow-lg transition-all hover:scale-105 bg-gradient-to-br from-card to-card/50">
              <Package className="h-6 w-6 mx-auto mb-2 text-primary" />
              <div className="text-sm font-medium">Enclosure</div>
            </Card>
          )}
          {printer.auto_bed_leveling && (
            <Card className="p-4 text-center hover:shadow-lg transition-all hover:scale-105 bg-gradient-to-br from-card to-card/50">
              <Activity className="h-6 w-6 mx-auto mb-2 text-primary" />
              <div className="text-sm font-medium">Auto Leveling</div>
            </Card>
          )}
          {printer.multi_material_supported && (
            <Card className="p-4 text-center hover:shadow-lg transition-all hover:scale-105 bg-gradient-to-br from-card to-card/50">
              <Blend className="h-6 w-6 mx-auto mb-2 text-primary" />
              <div className="text-sm font-medium">Multi-Material</div>
            </Card>
          )}
          {printer.has_wifi && (
            <Card className="p-4 text-center hover:shadow-lg transition-all hover:scale-105 bg-gradient-to-br from-card to-card/50">
              <Wifi className="h-6 w-6 mx-auto mb-2 text-primary" />
              <div className="text-sm font-medium">WiFi</div>
            </Card>
          )}
          {printer.input_shaping_supported && (
            <Card className="p-4 text-center hover:shadow-lg transition-all hover:scale-105 bg-gradient-to-br from-card to-card/50">
              <Wind className="h-6 w-6 mx-auto mb-2 text-primary" />
              <div className="text-sm font-medium">Input Shaping</div>
            </Card>
          )}
          {printer.abrasive_materials_supported && (
            <Card className="p-4 text-center hover:shadow-lg transition-all hover:scale-105 bg-gradient-to-br from-card to-card/50">
              <Layers className="h-6 w-6 mx-auto mb-2 text-primary" />
              <div className="text-sm font-medium">Abrasive Safe</div>
            </Card>
          )}
        </div>

        {/* Ratings */}
        {(printer.rating_community_overall || printer.rating_ease_of_use || printer.rating_print_quality) && (
          <Card className="overflow-hidden border-2">
            <div className="bg-gradient-to-r from-primary/10 via-primary/5 to-background p-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-3 rounded-full bg-primary/20">
                  <Star className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h3 className="text-xl font-bold">Community Ratings</h3>
                  {printer.review_count_aggregated && (
                    <p className="text-sm text-muted-foreground">Based on {printer.review_count_aggregated} reviews</p>
                  )}
                </div>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-6">
                {printer.rating_community_overall && (
                  <div className="text-center space-y-2">
                    <div className="text-4xl font-bold text-primary">{printer.rating_community_overall.toFixed(1)}</div>
                    <div className="flex justify-center">
                      {[...Array(5)].map((_, i) => (
                        <Star key={i} className={`h-4 w-4 ${i < Math.round(printer.rating_community_overall || 0) ? 'fill-primary text-primary' : 'text-muted'}`} />
                      ))}
                    </div>
                    <div className="text-xs text-muted-foreground font-medium uppercase tracking-wide">Overall</div>
                  </div>
                )}
                {printer.rating_ease_of_use && (
                  <div className="text-center space-y-2">
                    <div className="text-4xl font-bold">{printer.rating_ease_of_use.toFixed(1)}</div>
                    <div className="flex justify-center">
                      {[...Array(5)].map((_, i) => (
                        <Star key={i} className={`h-4 w-4 ${i < Math.round(printer.rating_ease_of_use || 0) ? 'fill-primary text-primary' : 'text-muted'}`} />
                      ))}
                    </div>
                    <div className="text-xs text-muted-foreground font-medium uppercase tracking-wide">Ease of Use</div>
                  </div>
                )}
                {printer.rating_print_quality && (
                  <div className="text-center space-y-2">
                    <div className="text-4xl font-bold">{printer.rating_print_quality.toFixed(1)}</div>
                    <div className="flex justify-center">
                      {[...Array(5)].map((_, i) => (
                        <Star key={i} className={`h-4 w-4 ${i < Math.round(printer.rating_print_quality || 0) ? 'fill-primary text-primary' : 'text-muted'}`} />
                      ))}
                    </div>
                    <div className="text-xs text-muted-foreground font-medium uppercase tracking-wide">Print Quality</div>
                  </div>
                )}
                {printer.rating_reliability && (
                  <div className="text-center space-y-2">
                    <div className="text-4xl font-bold">{printer.rating_reliability.toFixed(1)}</div>
                    <div className="flex justify-center">
                      {[...Array(5)].map((_, i) => (
                        <Star key={i} className={`h-4 w-4 ${i < Math.round(printer.rating_reliability || 0) ? 'fill-primary text-primary' : 'text-muted'}`} />
                      ))}
                    </div>
                    <div className="text-xs text-muted-foreground font-medium uppercase tracking-wide">Reliability</div>
                  </div>
                )}
                {printer.rating_value_for_money && (
                  <div className="text-center space-y-2">
                    <div className="text-4xl font-bold">{printer.rating_value_for_money.toFixed(1)}</div>
                    <div className="flex justify-center">
                      {[...Array(5)].map((_, i) => (
                        <Star key={i} className={`h-4 w-4 ${i < Math.round(printer.rating_value_for_money || 0) ? 'fill-primary text-primary' : 'text-muted'}`} />
                      ))}
                    </div>
                    <div className="text-xs text-muted-foreground font-medium uppercase tracking-wide">Value</div>
                  </div>
                )}
              </div>
            </div>
          </Card>
        )}

        {/* Detailed Specs Tabs */}
        <Tabs defaultValue="build" className="w-full">
          <TabsList className="inline-flex w-full md:w-auto flex-wrap h-auto gap-2 bg-muted/50 p-2 rounded-xl">
            <TabsTrigger value="build" className="rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm">
              <Box className="h-4 w-4 mr-2" />
              Build
            </TabsTrigger>
            <TabsTrigger value="print" className="rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm">
              <Gauge className="h-4 w-4 mr-2" />
              Print
            </TabsTrigger>
            <TabsTrigger value="materials" className="rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm">
              <Layers className="h-4 w-4 mr-2" />
              Materials
            </TabsTrigger>
            <TabsTrigger value="connectivity" className="rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm">
              <Wifi className="h-4 w-4 mr-2" />
              Connect
            </TabsTrigger>
            <TabsTrigger value="power" className="rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm">
              <Zap className="h-4 w-4 mr-2" />
              Power
            </TabsTrigger>
            <TabsTrigger value="other" className="rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm">
              <Settings className="h-4 w-4 mr-2" />
              Other
            </TabsTrigger>
            <TabsTrigger value="accessories" className="rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm">
              <Package className="h-4 w-4 mr-2" />
              Accessories
            </TabsTrigger>
          </TabsList>

          <TabsContent value="build" className="space-y-4 mt-6">
            <SpecSection title="Build Volume & Dimensions" icon={Box}>
              <SpecRow label="Build Volume X" value={printer.build_volume_x_mm} unit=" mm" />
              <SpecRow label="Build Volume Y" value={printer.build_volume_y_mm} unit=" mm" />
              <SpecRow label="Build Volume Z" value={printer.build_volume_z_mm} unit=" mm" />
              <SpecRow label="Build Volume Shape" value={printer.build_volume_shape} />
              <SpecRow label="Machine Width" value={printer.machine_width_mm} unit=" mm" />
              <SpecRow label="Machine Depth" value={printer.machine_depth_mm} unit=" mm" />
              <SpecRow label="Machine Height" value={printer.machine_height_mm} unit=" mm" />
              <SpecRow label="Machine Weight" value={printer.machine_weight_kg} unit=" kg" />
              <SpecRow label="Frame Material" value={printer.frame_material} />
              <SpecRow label="Machine Style" value={printer.machine_style} />
            </SpecSection>

            <SpecSection title="Enclosure" icon={Package}>
              <SpecRow label="Has Enclosure" value={printer.has_enclosure} />
              <SpecRow label="Enclosure Type" value={printer.enclosure_type} />
              <SpecRow label="Enclosure Heated" value={printer.enclosure_heated} />
              <SpecRow label="Max Enclosure Temp" value={printer.enclosure_max_temp_c} unit="°C" />
              <SpecRow label="Internal Lighting" value={printer.internal_lighting} />
              <SpecRow label="Door Sensor" value={printer.door_sensor} />
            </SpecSection>
          </TabsContent>

          <TabsContent value="print" className="space-y-4 mt-6">
            <SpecSection title="Print Capabilities" icon={Gauge}>
              <SpecRow label="Max Travel Speed XY" value={printer.max_travel_speed_xy_mms} unit=" mm/s" />
              <SpecRow label="Max Print Speed" value={printer.max_print_speed_mms} unit=" mm/s" />
              <SpecRow label="Recommended Quality Speed" value={printer.recommended_quality_speed_mms} unit=" mm/s" />
              <SpecRow label="Max Acceleration XY" value={printer.max_acceleration_xy_mmss} unit=" mm/s²" />
              <SpecRow label="Max Acceleration Z" value={printer.max_acceleration_z_mmss} unit=" mm/s²" />
              <SpecRow label="Input Shaping" value={printer.input_shaping_supported} />
              <SpecRow label="Linear Rails" value={printer.linear_rails_on_axes} />
            </SpecSection>

            <SpecSection title="Extruder & Hotend" icon={Layers}>
              <SpecRow label="Extruder Count" value={printer.extruder_count} />
              <SpecRow label="Extruder Type" value={printer.extruder_type} />
              <SpecRow label="Extruder Drive Type" value={printer.extruder_drive_type} />
              <SpecRow label="Filament Diameter" value={printer.filament_diameter_mm} unit=" mm" />
              <SpecRow label="Max Nozzle Temp" value={printer.max_nozzle_temp_c} unit="°C" />
              <SpecRow label="Sustained Nozzle Temp" value={printer.sustained_nozzle_temp_c} unit="°C" />
              <SpecRow label="Hotend Type" value={printer.hotend_type} />
              <SpecRow label="Hotend Brand/Model" value={printer.hotend_brand_model} />
              <SpecRow label="Stock Nozzle Diameter" value={printer.stock_nozzle_diameter_mm} unit=" mm" />
              <SpecRow label="Supported Nozzle Diameters" value={printer.supported_nozzle_diameters_mm} />
              <SpecRow label="Nozzle Material" value={printer.nozzle_material} />
              <SpecRow label="Max Flow Rate" value={printer.max_flow_rate_mm3s} unit=" mm³/s" />
            </SpecSection>

            <SpecSection title="Bed" icon={Thermometer}>
              <SpecRow label="Bed Size X" value={printer.bed_size_x_mm} unit=" mm" />
              <SpecRow label="Bed Size Y" value={printer.bed_size_y_mm} unit=" mm" />
              <SpecRow label="Bed Type" value={printer.bed_type} />
              <SpecRow label="Heated Bed" value={printer.bed_heated} />
              <SpecRow label="Max Bed Temp" value={printer.bed_max_temp_c} unit="°C" />
              <SpecRow label="Bed Heater Power" value={printer.bed_heater_power_w} unit=" W" />
              <SpecRow label="Stock Plate Types" value={printer.stock_plate_types} />
              <SpecRow label="Supported Plate Types" value={printer.supported_plate_types} />
              <SpecRow label="Auto Bed Leveling" value={printer.auto_bed_leveling} />
              <SpecRow label="ABL Method" value={printer.auto_bed_leveling_method} />
            </SpecSection>
          </TabsContent>

          <TabsContent value="materials" className="space-y-4 mt-6">
            <SpecSection title="Material Support" icon={Layers}>
              <SpecRow label="Official Supported Materials" value={printer.official_supported_materials} />
              <SpecRow label="Recommended Materials" value={printer.recommended_materials} />
              <SpecRow label="Abrasive Materials Supported" value={printer.abrasive_materials_supported} />
              <SpecRow label="Max Material Temp" value={printer.max_recommended_material_temp_c} unit="°C" />
            </SpecSection>

            <SpecSection title="Multi-Material System Compatibility" icon={Layers}>
              <div className="space-y-3">
                {(() => {
                  const compatibleSystems = printer.compatible_multi_material_systems 
                    ? printer.compatible_multi_material_systems.toLowerCase().split(/[,;|]/).map(s => s.trim())
                    : [];
                  
                  const allSystems = [
                    { name: "Bambu Lab AMS", key: "ams" },
                    { name: "Bambu Lab AMS Lite", key: "ams lite" },
                    { name: "Prusa MMU2S", key: "mmu2s" },
                    { name: "Prusa MMU3", key: "mmu3" },
                    { name: "E3D ToolChanger", key: "toolchanger" },
                    { name: "Mosaic Palette", key: "palette" },
                    { name: "ERCF (Enraged Rabbit)", key: "ercf" },
                    { name: "3DChameleon", key: "3dchameleon" },
                  ];

                  return allSystems.map(system => {
                    const isCompatible = compatibleSystems.some(cs => 
                      cs.includes(system.key.toLowerCase()) || 
                      system.key.toLowerCase().includes(cs)
                    );

                    return (
                      <div key={system.key} className="flex items-center justify-between py-2 border-b border-border/50">
                        <span className="text-muted-foreground">{system.name}</span>
                        <div className="flex items-center gap-2">
                          {isCompatible ? (
                            <>
                              <CheckCircle2 className="h-5 w-5 text-green-600" />
                              <span className="font-medium text-green-600">Compatible</span>
                            </>
                          ) : (
                            <>
                              <XCircle className="h-5 w-5 text-destructive" />
                              <span className="font-medium text-muted-foreground">Not Compatible</span>
                            </>
                          )}
                        </div>
                      </div>
                    );
                  });
                })()}
              </div>
              
              <div className="h-px bg-border my-4" />
              
              <div className="space-y-1 mt-4">
                <SpecRow label="Multi-Material Supported" value={printer.multi_material_supported} />
                <SpecRow label="Native Multi-Material System" value={printer.native_multi_material_system} />
                <SpecRow label="Max Spools" value={printer.multi_material_max_spools} />
                <SpecRow label="Spool Chamber Max Temp" value={printer.multi_material_spool_chamber_max_temp_c} unit="°C" />
                <SpecRow label="Drying Capability" value={printer.multi_material_drying_capability} />
              </div>
            </SpecSection>
          </TabsContent>

          <TabsContent value="connectivity" className="space-y-4 mt-6">
            <SpecSection title="Connectivity" icon={Wifi}>
              <SpecRow label="WiFi" value={printer.has_wifi} />
              <SpecRow label="Ethernet" value={printer.has_ethernet} />
              <SpecRow label="Bluetooth" value={printer.has_bluetooth} />
              <SpecRow label="USB-A Port" value={printer.has_usb_a_port} />
              <SpecRow label="USB-C Port" value={printer.has_usb_c_port} />
              <SpecRow label="SD Card" value={printer.has_sd_card} />
              <SpecRow label="Micro SD Card" value={printer.has_micro_sd_card} />
              <SpecRow label="Onboard Storage" value={printer.onboard_storage_gb} unit=" GB" />
              <SpecRow label="Cloud Platforms" value={printer.cloud_platforms} />
              <SpecRow label="Remote Monitoring" value={printer.remote_monitoring_supported} />
              <SpecRow label="Remote Control" value={printer.remote_control_supported} />
            </SpecSection>

            <SpecSection title="Display & UI" icon={Monitor}>
              <SpecRow label="Screen Type" value={printer.screen_type} />
              <SpecRow label="Screen Size" value={printer.screen_size_inch} unit='"' />
              <SpecRow label="Screen Resolution" value={printer.screen_resolution} />
              <SpecRow label="Control Knob" value={printer.control_knob} />
              <SpecRow label="UI Languages" value={printer.ui_language_options} />
            </SpecSection>
          </TabsContent>

          <TabsContent value="power" className="space-y-4 mt-6">
            <SpecSection title="Power" icon={Zap}>
              <SpecRow label="Input Voltage" value={printer.power_input_voltage} />
              <SpecRow label="Rated Power" value={printer.rated_power_w} unit=" W" />
              <SpecRow label="Typical Power (PLA)" value={printer.typical_power_pla_w} unit=" W" />
              <SpecRow label="Typical Power (ABS)" value={printer.typical_power_abs_w} unit=" W" />
              <SpecRow label="Power Supply Type" value={printer.power_supply_type} />
              <SpecRow label="Thermal Runaway Protection" value={printer.thermal_runaway_protection} />
              <SpecRow label="Power Loss Recovery" value={printer.power_loss_recovery} />
            </SpecSection>

            <SpecSection title="Safety" icon={Settings}>
              <SpecRow label="Safety Certifications" value={printer.safety_certifications} />
              <SpecRow label="Smoke Sensor" value={printer.smoke_sensor} />
              <SpecRow label="Filter Type" value={printer.filter_type} />
              <SpecRow label="Temperature Sensors" value={printer.temperature_sensors} />
            </SpecSection>
          </TabsContent>


          <TabsContent value="other" className="space-y-4 mt-6">
            <SpecSection title="General Info" icon={Settings}>
              <SpecRow label="Printer ID" value={printer.printer_id} />
              <SpecRow label="SKU" value={printer.sku} />
              <SpecRow label="Release Date" value={printer.release_date} />
              <SpecRow label="Discontinued" value={printer.discontinued} />
              <SpecRow label="Printer Technology" value={printer.printer_technology} />
              <SpecRow label="Firmware Family" value={printer.firmware_family} />
              <SpecRow label="Firmware Open Source" value={printer.firmware_open_source} />
              <SpecRow label="Target User Segment" value={printer.target_user_segment} />
              <SpecRow label="Price Tier" value={printer.price_tier} />
            </SpecSection>

            <SpecSection title="Assembly & Maintenance" icon={Package}>
              <SpecRow label="Assembly Required" value={printer.assembly_required} />
              <SpecRow label="Average Assembly Time" value={printer.average_assembly_time_min} unit=" min" />
              <SpecRow label="Maintenance Interval" value={printer.maintenance_interval_hours} unit=" hrs" />
              <SpecRow label="Nozzle Change Ease" value={printer.nozzle_change_ease} />
              <SpecRow label="Belt Tensioning Method" value={printer.belt_tensioning_method} />
            </SpecSection>

            <SpecSection title="Pricing" icon={DollarSign}>
              <SpecRow label="MSRP (USD)" value={printer.msrp_usd} unit=" USD" />
              <SpecRow label="MSRP (CAD)" value={printer.msrp_cad} unit=" CAD" />
              <SpecRow label="MSRP (EUR)" value={printer.msrp_eur} unit=" EUR" />
              <SpecRow label="Current Price (Store)" value={printer.current_price_usd_store} unit=" USD" />
              <SpecRow label="Current Price (Amazon)" value={printer.current_price_usd_amazon} unit=" USD" />
            </SpecSection>
          </TabsContent>

          <TabsContent value="accessories" className="space-y-4 mt-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Package className="h-5 w-5 text-primary" />
                  Official Accessories
                </CardTitle>
                <p className="text-sm text-muted-foreground">
                  Hotends, build plates, and multi-material systems sold by {brand} for this printer
                </p>
              </CardHeader>
              <CardContent>
                {!accessories || accessories.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    No accessories found. Accessories are automatically discovered when the printer is scraped.
                  </div>
                ) : (
                  <div className="space-y-6">
                    {/* Hotends Section */}
                    {accessories.filter(a => a.accessory_type === 'nozzle').length > 0 && (
                      <div>
                        <h4 className="text-lg font-semibold mb-3 flex items-center gap-2">
                          <Cpu className="h-5 w-5 text-primary" />
                          Hotends ({accessories.filter(a => a.accessory_type === 'nozzle').length})
                        </h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                          {accessories
                            .filter(a => a.accessory_type === 'nozzle')
                            .map((acc) => {
                              const specs = acc.specs as any;
                              return (
                              <Card key={acc.id} className="hover:shadow-lg transition-shadow overflow-hidden flex flex-col h-[340px]">
                                <CardContent className="p-0 flex flex-col h-full">
                                  {/* Header with brand badge */}
                                  <div className="relative h-28 flex-shrink-0">
                                    {acc.image_url ? (
                                      <div className="h-full bg-muted/30 flex items-center justify-center p-3">
                                        <img 
                                          src={acc.image_url} 
                                          alt={acc.name}
                                          className="max-h-full max-w-full object-contain"
                                          onError={(e) => {
                                            e.currentTarget.style.display = 'none';
                                            e.currentTarget.parentElement!.innerHTML = '<div class="h-12 w-12 text-muted-foreground/30"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="4" y="4" width="16" height="16" rx="2"/><circle cx="12" cy="12" r="3"/></svg></div>';
                                          }}
                                        />
                                      </div>
                                    ) : (
                                      <div className="h-full bg-muted/30 flex items-center justify-center">
                                        <Cpu className="h-12 w-12 text-muted-foreground/30" />
                                      </div>
                                    )}
                                    {acc.brand && (
                                      <Badge className="absolute top-2 right-2 text-xs" variant="secondary">
                                        {acc.brand}
                                      </Badge>
                                    )}
                                  </div>
                                  
                                  {/* Content */}
                                  <div className="p-3 flex flex-col flex-1">
                                    <h5 className="font-semibold text-sm line-clamp-2 mb-2">{acc.name}</h5>
                                    <div className="space-y-1 text-xs flex-1">
                                      {specs?.diameter_mm && (
                                        <div className="flex justify-between">
                                          <span className="text-muted-foreground">Diameter:</span>
                                          <span className="font-medium">{specs.diameter_mm}mm</span>
                                        </div>
                                      )}
                                      {specs?.material && (
                                        <div className="flex justify-between">
                                          <span className="text-muted-foreground">Material:</span>
                                          <span className="font-medium capitalize">{specs.material}</span>
                                        </div>
                                      )}
                                      {specs?.max_temp_c && (
                                        <div className="flex justify-between">
                                          <span className="text-muted-foreground">Max Temp:</span>
                                          <span className="font-medium">{specs.max_temp_c}°C</span>
                                        </div>
                                      )}
                                      {acc.price && (
                                        <div className="flex justify-between pt-1 border-t mt-1">
                                          <span className="text-muted-foreground">Price:</span>
                                          <span className="font-bold text-primary">${acc.price}</span>
                                        </div>
                                      )}
                                    </div>
                                    
                                    {acc.product_url && (
                                      <a href={acc.product_url} target="_blank" rel="noopener noreferrer" className="mt-auto pt-2">
                                        <Button size="sm" variant="outline" className="w-full gap-2">
                                          <ExternalLink className="h-3 w-3" />
                                          View Product
                                        </Button>
                                      </a>
                                    )}
                                  </div>
                                </CardContent>
                              </Card>
                            );
                            })}
                        </div>
                      </div>
                    )}

                    {/* Build Plates Section */}
                    {accessories.filter(a => a.accessory_type === 'build_plate').length > 0 && (
                      <div>
                        <h4 className="text-lg font-semibold mb-3 flex items-center gap-2">
                          <Layers className="h-5 w-5 text-primary" />
                          Build Plates ({accessories.filter(a => a.accessory_type === 'build_plate').length})
                        </h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                          {accessories
                            .filter(a => a.accessory_type === 'build_plate')
                            .map((acc) => {
                              const specs = acc.specs as any;
                              return (
                              <Card key={acc.id} className="hover:shadow-lg transition-shadow">
                                <CardContent className="p-4 space-y-2">
                                  <h5 className="font-semibold text-sm capitalize">{acc.name}</h5>
                                  <div className="space-y-1 text-xs">
                                    {specs?.surface && (
                                      <div className="flex justify-between">
                                        <span className="text-muted-foreground">Surface:</span>
                                        <span className="font-medium">{specs.surface}</span>
                                      </div>
                                    )}
                                    {specs?.magnetic !== undefined && (
                                      <div className="flex justify-between">
                                        <span className="text-muted-foreground">Magnetic:</span>
                                        <span className="font-medium">{specs.magnetic ? 'Yes' : 'No'}</span>
                                      </div>
                                    )}
                                    {acc.price && (
                                      <div className="flex justify-between pt-2 border-t">
                                        <span className="text-muted-foreground">Price:</span>
                                        <span className="font-bold text-primary">${acc.price}</span>
                                      </div>
                                    )}
                                    {acc.price_change_percent !== null && acc.price_change_percent !== undefined && (
                                      <div className="flex items-center justify-between text-xs">
                                        <span className="text-muted-foreground">Change:</span>
                                        <span className={`flex items-center gap-1 font-semibold ${
                                          acc.price_change_percent > 0 ? 'text-red-500' : 
                                          acc.price_change_percent < 0 ? 'text-green-500' : 
                                          'text-muted-foreground'
                                        }`}>
                                          {acc.price_change_percent > 0 ? <TrendingUp className="h-3 w-3" /> : 
                                           acc.price_change_percent < 0 ? <TrendingDown className="h-3 w-3" /> : null}
                                          {acc.price_change_percent > 0 ? '+' : ''}{acc.price_change_percent.toFixed(1)}%
                                        </span>
                                      </div>
                                    )}
                                  </div>
                                  
                                  <AccessoryPriceChart 
                                    accessoryId={acc.id} 
                                    currentPrice={acc.price}
                                    currency={acc.currency || 'USD'}
                                  />
                                  
                                  {acc.product_url && (
                                    <a href={acc.product_url} target="_blank" rel="noopener noreferrer">
                                      <Button size="sm" variant="outline" className="w-full mt-2 gap-2">
                                        <ExternalLink className="h-3 w-3" />
                                        View Product
                                      </Button>
                                    </a>
                                  )}
                                </CardContent>
                              </Card>
                            );
                            })}
                        </div>
                      </div>
                    )}

                    {/* AMS/MMU Section */}
                    {accessories.filter(a => a.accessory_type === 'ams_mmu').length > 0 && (
                      <div>
                        <h4 className="text-lg font-semibold mb-3 flex items-center gap-2">
                          <Blend className="h-5 w-5 text-primary" />
                          Multi-Material Systems ({accessories.filter(a => a.accessory_type === 'ams_mmu').length})
                        </h4>
                         <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {accessories
                            .filter(a => a.accessory_type === 'ams_mmu')
                            .map((acc) => {
                              const specs = (acc.specs || {}) as any;
                              return (
                              <Card key={acc.id} className="hover:shadow-lg transition-shadow">
                                <CardContent className="p-4 space-y-3">
                                  <h5 className="font-semibold capitalize">{acc.name || 'Unknown'}</h5>
                                  <div className="space-y-2 text-sm">
                                    {specs.spool_capacity != null && (
                                      <div className="flex justify-between">
                                        <span className="text-muted-foreground">Spool Capacity:</span>
                                        <span className="font-medium">{specs.spool_capacity} spools</span>
                                      </div>
                                    )}
                                    {specs.heated !== undefined && specs.heated !== null && (
                                      <div className="flex justify-between">
                                        <span className="text-muted-foreground">Heated:</span>
                                        <span className="font-medium">{specs.heated ? 'Yes' : 'No'}</span>
                                      </div>
                                    )}
                                    {specs.max_temp_c != null && (
                                      <div className="flex justify-between">
                                        <span className="text-muted-foreground">Max Temperature:</span>
                                        <span className="font-medium">{specs.max_temp_c}°C</span>
                                      </div>
                                    )}
                                    {specs.power_requirements && (
                                      <div className="flex flex-col gap-1">
                                        <span className="text-muted-foreground">Power:</span>
                                        <span className="font-medium text-xs bg-muted/50 p-2 rounded">{specs.power_requirements}</span>
                                      </div>
                                    )}
                                    {specs.filament_drying !== undefined && specs.filament_drying !== null && (
                                      <div className="flex justify-between">
                                        <span className="text-muted-foreground">Filament Drying:</span>
                                        <span className="font-medium">{specs.filament_drying ? 'Yes' : 'No'}</span>
                                      </div>
                                    )}
                                    {acc.price && (
                                      <div className="flex justify-between pt-2 border-t">
                                        <span className="text-muted-foreground">Price:</span>
                                        <span className="font-bold text-primary">${acc.price}</span>
                                      </div>
                                    )}
                                    {acc.price_change_percent !== null && acc.price_change_percent !== undefined && (
                                      <div className="flex items-center justify-between text-xs">
                                        <span className="text-muted-foreground">Change:</span>
                                        <span className={`flex items-center gap-1 font-semibold ${
                                          acc.price_change_percent > 0 ? 'text-red-500' : 
                                          acc.price_change_percent < 0 ? 'text-green-500' : 
                                          'text-muted-foreground'
                                        }`}>
                                          {acc.price_change_percent > 0 ? <TrendingUp className="h-3 w-3" /> : 
                                           acc.price_change_percent < 0 ? <TrendingDown className="h-3 w-3" /> : null}
                                          {acc.price_change_percent > 0 ? '+' : ''}{acc.price_change_percent.toFixed(1)}%
                                        </span>
                                      </div>
                                    )}
                                  </div>
                                  
                                  <AccessoryPriceChart 
                                    accessoryId={acc.id} 
                                    currentPrice={acc.price}
                                    currency={acc.currency || 'USD'}
                                  />
                                  
                                  {acc.product_url && (
                                    <a href={acc.product_url} target="_blank" rel="noopener noreferrer">
                                      <Button size="sm" variant="outline" className="w-full mt-2 gap-2">
                                        <ExternalLink className="h-3 w-3" />
                                        View Product
                                      </Button>
                                    </a>
                                  )}
                                </CardContent>
                              </Card>
                            );
                            })}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Image Lightbox Modal */}
        <Dialog open={lightboxOpen} onOpenChange={setLightboxOpen}>
          <DialogContent className="max-w-[95vw] max-h-[95vh] p-0 overflow-hidden bg-black/95 border-none">
            <div className="relative w-full h-full flex items-center justify-center">
              {/* Close Button */}
              <Button
                variant="ghost"
                size="icon"
                className="absolute top-4 right-4 z-50 text-white hover:bg-white/20"
                onClick={() => setLightboxOpen(false)}
              >
                <X className="h-6 w-6" />
              </Button>

              {/* Image Counter */}
              {productImages.length > 1 && (
                <div className="absolute top-4 left-1/2 -translate-x-1/2 z-50 bg-black/60 text-white px-4 py-2 rounded-full text-sm">
                  {currentImageIndex + 1} / {productImages.length}
                </div>
              )}

              {/* Previous Button */}
              {productImages.length > 1 && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute left-4 z-50 text-white hover:bg-white/20 h-12 w-12"
                  onClick={prevImage}
                >
                  <ChevronLeft className="h-8 w-8" />
                </Button>
              )}

              {/* Main Image */}
              <img
                src={productImages[currentImageIndex]}
                alt={`${printer?.model_name} - Image ${currentImageIndex + 1}`}
                className="max-w-full max-h-[90vh] object-contain animate-fade-in"
                onError={(e) => {
                  e.currentTarget.src = '/placeholder.svg';
                }}
              />

              {/* Next Button */}
              {productImages.length > 1 && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute right-4 z-50 text-white hover:bg-white/20 h-12 w-12"
                  onClick={nextImage}
                >
                  <ChevronRight className="h-8 w-8" />
                </Button>
              )}

              {/* Thumbnail Navigation */}
              {productImages.length > 1 && (
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-50 flex gap-2 max-w-[90vw] overflow-x-auto p-2 bg-black/60 rounded-lg">
                  {productImages.map((img: string, idx: number) => (
                    <button
                      key={idx}
                      onClick={() => setCurrentImageIndex(idx)}
                      className={`flex-shrink-0 w-16 h-16 rounded overflow-hidden border-2 transition-all ${
                        idx === currentImageIndex 
                          ? 'border-primary scale-110' 
                          : 'border-white/30 opacity-60 hover:opacity-100'
                      }`}
                    >
                      <img
                        src={img}
                        alt={`Thumbnail ${idx + 1}`}
                        className="w-full h-full object-cover"
                      />
                    </button>
                  ))}
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};

export default PrinterDetail;