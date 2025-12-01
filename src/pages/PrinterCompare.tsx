import { useEffect, useState } from "react";
import { useSearchParams, useNavigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { ArrowLeft, ExternalLink, Eye } from "lucide-react";
import { Card } from "@/components/ui/card";
import type { Database } from "@/integrations/supabase/types";

type Printer = Database["public"]["Tables"]["printers"]["Row"] & {
  brand: { brand: string } | null;
  series: { series_name: string } | null;
};

const PrinterCompare = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [printers, setPrinters] = useState<Printer[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPrinters = async () => {
      const ids = searchParams.get("ids")?.split(",") || [];
      
      if (ids.length === 0) {
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from("printers")
        .select(`
          *,
          brand:printer_brands(brand),
          series:printer_series(series_name)
        `)
        .in("printer_id", ids);

      if (error) {
        console.error("Error fetching printers:", error);
      } else {
        setPrinters(data as Printer[]);
      }
      setLoading(false);
    };

    fetchPrinters();
  }, [searchParams]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">Loading printers...</p>
      </div>
    );
  }

  if (printers.length === 0) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-6">
        <div className="text-center space-y-4">
          <p className="text-muted-foreground">No printers selected for comparison</p>
          <Button onClick={() => navigate("/")}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Finder
          </Button>
        </div>
      </div>
    );
  }

  const ComparisonRow = ({ label, values }: { label: string; values: (string | number | boolean | null)[] }) => (
    <div className="grid gap-4 py-3 border-b border-border last:border-b-0" style={{ gridTemplateColumns: `200px repeat(${printers.length}, 1fr)` }}>
      <div className="font-medium text-sm text-muted-foreground">{label}</div>
      {values.map((value, index) => (
        <div key={index} className="text-sm">
          {value === null || value === undefined || value === "" ? (
            <span className="text-muted-foreground">—</span>
          ) : typeof value === "boolean" ? (
            value ? "Yes" : "No"
          ) : (
            value
          )}
        </div>
      ))}
    </div>
  );

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-[1800px] mx-auto space-y-6">
        <Button variant="ghost" onClick={() => navigate("/")} className="gap-2">
          <ArrowLeft className="h-4 w-4" />
          Back to Finder
        </Button>

        <div className="space-y-2">
          <h1 className="text-4xl font-bold tracking-tight">Printer Comparison</h1>
          <p className="text-muted-foreground">
            Compare specifications side by side
          </p>
        </div>

        {/* Printer Headers */}
        <div className="grid gap-4" style={{ gridTemplateColumns: `200px repeat(${printers.length}, 1fr)` }}>
          <div></div>
          {printers.map((printer) => (
            <Card key={printer.id} className="p-4 space-y-2">
              <div className="flex items-start justify-between">
                <h3 className="font-bold text-lg">
                  {printer.brand?.brand} {printer.model_name}
                </h3>
                <Link to={`/printers/${printer.id}`}>
                  <Button variant="ghost" size="icon">
                    <Eye className="h-4 w-4" />
                  </Button>
                </Link>
              </div>
              {printer.series?.series_name && (
                <p className="text-sm text-muted-foreground">{printer.series.series_name}</p>
              )}
              {printer.variant_or_bundle_name && (
                <p className="text-xs text-muted-foreground">{printer.variant_or_bundle_name}</p>
              )}
              {printer.current_price_usd_store && (
                <p className="text-lg font-semibold text-primary">
                  ${printer.current_price_usd_store}
                </p>
              )}
              {printer.official_product_url && (
                <a
                  href={printer.official_product_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-primary hover:underline flex items-center gap-1"
                >
                  View Product <ExternalLink className="h-3 w-3" />
                </a>
              )}
            </Card>
          ))}
        </div>

        {/* Build Volume */}
        <Card className="p-6">
          <h2 className="text-xl font-bold mb-4">Build Volume</h2>
          <ComparisonRow 
            label="X (mm)" 
            values={printers.map(p => p.build_volume_x_mm)} 
          />
          <ComparisonRow 
            label="Y (mm)" 
            values={printers.map(p => p.build_volume_y_mm)} 
          />
          <ComparisonRow 
            label="Z (mm)" 
            values={printers.map(p => p.build_volume_z_mm)} 
          />
          <ComparisonRow 
            label="Shape" 
            values={printers.map(p => p.build_volume_shape)} 
          />
        </Card>

        {/* Enclosure */}
        <Card className="p-6">
          <h2 className="text-xl font-bold mb-4">Enclosure</h2>
          <ComparisonRow 
            label="Has Enclosure" 
            values={printers.map(p => p.has_enclosure)} 
          />
          <ComparisonRow 
            label="Enclosure Type" 
            values={printers.map(p => p.enclosure_type)} 
          />
          <ComparisonRow 
            label="Heated Enclosure" 
            values={printers.map(p => p.enclosure_heated)} 
          />
          <ComparisonRow 
            label="Max Temp (°C)" 
            values={printers.map(p => p.enclosure_max_temp_c)} 
          />
        </Card>

        {/* Extruder & Hotend */}
        <Card className="p-6">
          <h2 className="text-xl font-bold mb-4">Extruder & Hotend</h2>
          <ComparisonRow 
            label="Extruder Count" 
            values={printers.map(p => p.extruder_count)} 
          />
          <ComparisonRow 
            label="Extruder Type" 
            values={printers.map(p => p.extruder_type)} 
          />
          <ComparisonRow 
            label="Max Nozzle Temp (°C)" 
            values={printers.map(p => p.max_nozzle_temp_c)} 
          />
          <ComparisonRow 
            label="Stock Nozzle Size (mm)" 
            values={printers.map(p => p.stock_nozzle_diameter_mm)} 
          />
          <ComparisonRow 
            label="Nozzle Material" 
            values={printers.map(p => p.nozzle_material)} 
          />
          <ComparisonRow 
            label="Max Flow Rate (mm³/s)" 
            values={printers.map(p => p.max_flow_rate_mm3s)} 
          />
          <ComparisonRow 
            label="Abrasive Support" 
            values={printers.map(p => p.abrasive_filament_support)} 
          />
        </Card>

        {/* Heated Bed */}
        <Card className="p-6">
          <h2 className="text-xl font-bold mb-4">Heated Bed</h2>
          <ComparisonRow 
            label="Bed Heated" 
            values={printers.map(p => p.bed_heated)} 
          />
          <ComparisonRow 
            label="Max Bed Temp (°C)" 
            values={printers.map(p => p.bed_max_temp_c)} 
          />
          <ComparisonRow 
            label="Bed Size X (mm)" 
            values={printers.map(p => p.bed_size_x_mm)} 
          />
          <ComparisonRow 
            label="Bed Size Y (mm)" 
            values={printers.map(p => p.bed_size_y_mm)} 
          />
          <ComparisonRow 
            label="Auto Bed Leveling" 
            values={printers.map(p => p.auto_bed_leveling)} 
          />
          <ComparisonRow 
            label="ABL Technique" 
            values={printers.map(p => p.abl_technique)} 
          />
          <ComparisonRow 
            label="Supported Plate Types" 
            values={printers.map(p => p.supported_plate_types)} 
          />
        </Card>

        {/* Motion System */}
        <Card className="p-6">
          <h2 className="text-xl font-bold mb-4">Motion System</h2>
          <ComparisonRow 
            label="Machine Style" 
            values={printers.map(p => p.machine_style)} 
          />
          <ComparisonRow 
            label="Max Print Speed (mm/s)" 
            values={printers.map(p => p.max_print_speed_mms)} 
          />
          <ComparisonRow 
            label="Max Travel Speed (mm/s)" 
            values={printers.map(p => p.max_travel_speed_xy_mms)} 
          />
          <ComparisonRow 
            label="Input Shaping" 
            values={printers.map(p => p.input_shaping_supported)} 
          />
          <ComparisonRow 
            label="Linear Rails" 
            values={printers.map(p => p.linear_rails_on_axes)} 
          />
        </Card>

        {/* Material Support */}
        <Card className="p-6">
          <h2 className="text-xl font-bold mb-4">Material Support</h2>
          <ComparisonRow 
            label="Official Supported" 
            values={printers.map(p => p.official_supported_materials)} 
          />
          <ComparisonRow 
            label="Recommended" 
            values={printers.map(p => p.recommended_materials)} 
          />
          <ComparisonRow 
            label="Abrasive Materials" 
            values={printers.map(p => p.abrasive_materials_supported)} 
          />
          <ComparisonRow 
            label="Max Material Temp (°C)" 
            values={printers.map(p => p.max_recommended_material_temp_c)} 
          />
        </Card>

        {/* Multi-Material */}
        <Card className="p-6">
          <h2 className="text-xl font-bold mb-4">Multi-Material Support</h2>
          <ComparisonRow 
            label="Multi-Material" 
            values={printers.map(p => p.multi_material_supported)} 
          />
          <ComparisonRow 
            label="Native System" 
            values={printers.map(p => p.native_multi_material_system)} 
          />
          <ComparisonRow 
            label="Compatible Systems" 
            values={printers.map(p => p.compatible_multi_material_systems)} 
          />
          <ComparisonRow 
            label="Max Spools" 
            values={printers.map(p => p.multi_material_max_spools)} 
          />
        </Card>

        {/* Features */}
        <Card className="p-6">
          <h2 className="text-xl font-bold mb-4">Features</h2>
          <ComparisonRow 
            label="Filter Type" 
            values={printers.map(p => p.filter_type)} 
          />
          <ComparisonRow 
            label="Internal Lighting" 
            values={printers.map(p => p.internal_lighting)} 
          />
          <ComparisonRow 
            label="Door Sensor" 
            values={printers.map(p => p.door_sensor)} 
          />
          <ComparisonRow 
            label="Screen Type" 
            values={printers.map(p => p.screen_type)} 
          />
          <ComparisonRow 
            label="Screen Size (inch)" 
            values={printers.map(p => p.screen_size_inch)} 
          />
        </Card>

        {/* Connectivity */}
        <Card className="p-6">
          <h2 className="text-xl font-bold mb-4">Connectivity</h2>
          <ComparisonRow 
            label="WiFi" 
            values={printers.map(p => p.has_wifi)} 
          />
          <ComparisonRow 
            label="Ethernet" 
            values={printers.map(p => p.has_ethernet)} 
          />
          <ComparisonRow 
            label="Cloud Platforms" 
            values={printers.map(p => p.cloud_platforms)} 
          />
          <ComparisonRow 
            label="Remote Monitoring" 
            values={printers.map(p => p.remote_monitoring_supported)} 
          />
          <ComparisonRow 
            label="SD Card" 
            values={printers.map(p => p.has_sd_card)} 
          />
        </Card>

        {/* Physical Specs */}
        <Card className="p-6">
          <h2 className="text-xl font-bold mb-4">Physical Dimensions</h2>
          <ComparisonRow 
            label="Width (mm)" 
            values={printers.map(p => p.machine_width_mm)} 
          />
          <ComparisonRow 
            label="Depth (mm)" 
            values={printers.map(p => p.machine_depth_mm)} 
          />
          <ComparisonRow 
            label="Height (mm)" 
            values={printers.map(p => p.machine_height_mm)} 
          />
          <ComparisonRow 
            label="Weight (kg)" 
            values={printers.map(p => p.machine_weight_kg)} 
          />
        </Card>

        {/* Power & Safety */}
        <Card className="p-6">
          <h2 className="text-xl font-bold mb-4">Power & Safety</h2>
          <ComparisonRow 
            label="Rated Power (W)" 
            values={printers.map(p => p.rated_power_w)} 
          />
          <ComparisonRow 
            label="Power Input" 
            values={printers.map(p => p.power_input_voltage)} 
          />
          <ComparisonRow 
            label="Thermal Runaway Protection" 
            values={printers.map(p => p.thermal_runaway_protection)} 
          />
          <ComparisonRow 
            label="Power Loss Recovery" 
            values={printers.map(p => p.power_loss_recovery)} 
          />
          <ComparisonRow 
            label="Safety Certifications" 
            values={printers.map(p => p.safety_certifications)} 
          />
        </Card>

        {/* Community Ratings */}
        <Card className="p-6">
          <h2 className="text-xl font-bold mb-4">Community Ratings</h2>
          <ComparisonRow 
            label="Overall Rating" 
            values={printers.map(p => p.rating_community_overall)} 
          />
          <ComparisonRow 
            label="Ease of Use" 
            values={printers.map(p => p.rating_ease_of_use)} 
          />
          <ComparisonRow 
            label="Print Quality" 
            values={printers.map(p => p.rating_print_quality)} 
          />
          <ComparisonRow 
            label="Reliability" 
            values={printers.map(p => p.rating_reliability)} 
          />
          <ComparisonRow 
            label="Value for Money" 
            values={printers.map(p => p.rating_value_for_money)} 
          />
        </Card>
      </div>
    </div>
  );
};

export default PrinterCompare;