import { useParams, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
} from "lucide-react";

const PrinterDetail = () => {
  const { id } = useParams();

  const { data: printer, isLoading } = useQuery({
    queryKey: ["printer-detail", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("printers")
        .select(`
          *,
          printer_brands(brand),
          printer_series(series_name)
        `)
        .eq("id", id)
        .single();

      if (error) throw error;
      return data;
    },
  });

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

  const brand = printer.printer_brands?.brand;
  const series = printer.printer_series?.series_name;

  const SpecRow = ({ label, value, unit = "" }: { label: string; value: any; unit?: string }) => {
    if (value === null || value === undefined) return null;
    
    const displayValue = typeof value === "boolean" 
      ? (value ? "Yes" : "No")
      : `${value}${unit}`;

    return (
      <div className="flex justify-between py-2 border-b border-border/50">
        <span className="text-muted-foreground">{label}</span>
        <span className="font-medium">{displayValue}</span>
      </div>
    );
  };

  const SpecSection = ({ title, icon: Icon, children }: { title: string; icon: any; children: React.ReactNode }) => (
    <Card className="p-6">
      <div className="flex items-center gap-2 mb-4">
        <Icon className="h-5 w-5 text-primary" />
        <h3 className="text-lg font-semibold">{title}</h3>
      </div>
      <div className="space-y-1">{children}</div>
    </Card>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-accent/5">
      <div className="max-w-7xl mx-auto p-4 md:p-8 space-y-8">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Link to="/printers">
            <Button variant="outline" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <Badge variant="secondary">{brand}</Badge>
              {series && <Badge variant="outline">{series}</Badge>}
              {printer.discontinued && <Badge variant="destructive">Discontinued</Badge>}
            </div>
            <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
              {printer.model_name}
            </h1>
            {printer.variant_or_bundle_name && (
              <p className="text-muted-foreground mt-1">{printer.variant_or_bundle_name}</p>
            )}
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {printer.build_volume_x_mm && (
            <Card className="p-4 text-center">
              <Box className="h-6 w-6 mx-auto mb-2 text-primary" />
              <div className="text-2xl font-bold">
                {printer.build_volume_x_mm}×{printer.build_volume_y_mm}×{printer.build_volume_z_mm}
              </div>
              <div className="text-sm text-muted-foreground">Build Volume (mm)</div>
            </Card>
          )}
          {printer.max_print_speed_mms && (
            <Card className="p-4 text-center">
              <Gauge className="h-6 w-6 mx-auto mb-2 text-primary" />
              <div className="text-2xl font-bold">{printer.max_print_speed_mms}</div>
              <div className="text-sm text-muted-foreground">Max Speed (mm/s)</div>
            </Card>
          )}
          {printer.max_nozzle_temp_c && (
            <Card className="p-4 text-center">
              <Thermometer className="h-6 w-6 mx-auto mb-2 text-primary" />
              <div className="text-2xl font-bold">{printer.max_nozzle_temp_c}°C</div>
              <div className="text-sm text-muted-foreground">Max Nozzle Temp</div>
            </Card>
          )}
          {printer.msrp_usd && (
            <Card className="p-4 text-center">
              <DollarSign className="h-6 w-6 mx-auto mb-2 text-primary" />
              <div className="text-2xl font-bold">${printer.msrp_usd}</div>
              <div className="text-sm text-muted-foreground">MSRP</div>
            </Card>
          )}
        </div>

        {/* Purchase Links */}
        {(printer.official_store_url || printer.amazon_url_us || printer.amazon_url_uk || printer.amazon_url_ca) && (
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">Where to Buy</h3>
            <div className="flex flex-wrap gap-3">
              {printer.official_store_url && (
                <a href={printer.official_store_url} target="_blank" rel="noopener noreferrer">
                  <Button variant="default">
                    Official Store <ExternalLink className="ml-2 h-4 w-4" />
                  </Button>
                </a>
              )}
              {printer.amazon_url_us && (
                <a href={printer.amazon_url_us} target="_blank" rel="noopener noreferrer">
                  <Button variant="outline">
                    Amazon US <ExternalLink className="ml-2 h-4 w-4" />
                  </Button>
                </a>
              )}
              {printer.amazon_url_uk && (
                <a href={printer.amazon_url_uk} target="_blank" rel="noopener noreferrer">
                  <Button variant="outline">
                    Amazon UK <ExternalLink className="ml-2 h-4 w-4" />
                  </Button>
                </a>
              )}
              {printer.amazon_url_ca && (
                <a href={printer.amazon_url_ca} target="_blank" rel="noopener noreferrer">
                  <Button variant="outline">
                    Amazon CA <ExternalLink className="ml-2 h-4 w-4" />
                  </Button>
                </a>
              )}
            </div>
          </Card>
        )}

        {/* Ratings */}
        {(printer.rating_community_overall || printer.rating_ease_of_use || printer.rating_print_quality) && (
          <Card className="p-6">
            <div className="flex items-center gap-2 mb-4">
              <Star className="h-5 w-5 text-primary" />
              <h3 className="text-lg font-semibold">Community Ratings</h3>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              {printer.rating_community_overall && (
                <div className="text-center">
                  <div className="text-2xl font-bold text-primary">{printer.rating_community_overall.toFixed(1)}</div>
                  <div className="text-sm text-muted-foreground">Overall</div>
                </div>
              )}
              {printer.rating_ease_of_use && (
                <div className="text-center">
                  <div className="text-2xl font-bold">{printer.rating_ease_of_use.toFixed(1)}</div>
                  <div className="text-sm text-muted-foreground">Ease of Use</div>
                </div>
              )}
              {printer.rating_print_quality && (
                <div className="text-center">
                  <div className="text-2xl font-bold">{printer.rating_print_quality.toFixed(1)}</div>
                  <div className="text-sm text-muted-foreground">Print Quality</div>
                </div>
              )}
              {printer.rating_reliability && (
                <div className="text-center">
                  <div className="text-2xl font-bold">{printer.rating_reliability.toFixed(1)}</div>
                  <div className="text-sm text-muted-foreground">Reliability</div>
                </div>
              )}
              {printer.rating_value_for_money && (
                <div className="text-center">
                  <div className="text-2xl font-bold">{printer.rating_value_for_money.toFixed(1)}</div>
                  <div className="text-sm text-muted-foreground">Value</div>
                </div>
              )}
            </div>
          </Card>
        )}

        {/* Detailed Specs Tabs */}
        <Tabs defaultValue="build" className="w-full">
          <TabsList className="grid w-full grid-cols-2 md:grid-cols-6">
            <TabsTrigger value="build">Build</TabsTrigger>
            <TabsTrigger value="print">Print</TabsTrigger>
            <TabsTrigger value="materials">Materials</TabsTrigger>
            <TabsTrigger value="connectivity">Connect</TabsTrigger>
            <TabsTrigger value="power">Power</TabsTrigger>
            <TabsTrigger value="other">Other</TabsTrigger>
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
              
              <Separator className="my-4" />
              
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
        </Tabs>
      </div>
    </div>
  );
};

export default PrinterDetail;