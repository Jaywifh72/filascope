import { useEffect, useState } from "react";
import { useSearchParams, useNavigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { ArrowLeft, ExternalLink, Eye, X, Check, Minus, Printer as PrinterIcon, Share2, Trash2 } from "lucide-react";
import { Card } from "@/components/ui/card";
import { useCurrency } from "@/hooks/useCurrency";
import { usePrinterCompare } from "@/hooks/usePrinterCompare";
import { getPrinterImage } from "@/lib/printerCardUtils";
import { toast } from "sonner";
import type { Database } from "@/integrations/supabase/types";
import { cn } from "@/lib/utils";

type Printer = Database["public"]["Tables"]["printers"]["Row"] & {
  brand: { brand: string } | null;
  series: { series_name: string } | null;
};

const PrinterCompare = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { formatPrice } = useCurrency();
  const { removePrinter, clearAll } = usePrinterCompare();
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
        .in("id", ids);

      if (error) {
        console.error("Error fetching printers:", error);
      } else {
        setPrinters(data as Printer[]);
      }
      setLoading(false);
    };

    fetchPrinters();
  }, [searchParams]);

  const handleRemovePrinter = (printerId: string) => {
    removePrinter(printerId);
    setPrinters(prev => prev.filter(p => p.id !== printerId));
    
    // Update URL
    const remainingIds = printers.filter(p => p.id !== printerId).map(p => p.id);
    if (remainingIds.length > 0) {
      navigate(`/printers/compare?ids=${remainingIds.join(",")}`, { replace: true });
    } else {
      navigate("/printers");
    }
  };

  const handleClearAll = () => {
    clearAll();
    navigate("/printers");
  };

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    toast.success("Comparison link copied to clipboard");
  };

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
          <Button onClick={() => navigate("/printers")}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Printers
          </Button>
        </div>
      </div>
    );
  }

  const ComparisonRow = ({ 
    label, 
    values, 
    highlight = false 
  }: { 
    label: string; 
    values: (string | number | boolean | null)[]; 
    highlight?: boolean;
  }) => {
    // Find best value for highlighting (for numeric values)
    const numericValues = values.map((v, i) => ({ value: typeof v === 'number' ? v : null, index: i }));
    const maxNumeric = Math.max(...numericValues.filter(n => n.value !== null).map(n => n.value as number));
    
    return (
      <div 
        className={cn(
          "grid gap-4 py-3 border-b border-border/50 last:border-b-0",
          highlight && "bg-primary/5"
        )} 
        style={{ gridTemplateColumns: `200px repeat(${printers.length}, 1fr)` }}
      >
        <div className="font-medium text-sm text-muted-foreground px-4">{label}</div>
        {values.map((value, index) => {
          const isMax = typeof value === 'number' && value === maxNumeric && maxNumeric > 0;
          return (
            <div key={index} className={cn(
              "text-sm text-center",
              isMax && "text-emerald-400 font-semibold"
            )}>
              {value === null || value === undefined || value === "" ? (
                <span className="text-muted-foreground/50">—</span>
              ) : typeof value === "boolean" ? (
                value ? (
                  <Check className="h-5 w-5 text-emerald-500 mx-auto" />
                ) : (
                  <Minus className="h-5 w-5 text-muted-foreground/40 mx-auto" />
                )
              ) : (
                value
              )}
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-background p-4 md:p-6">
      <div className="max-w-[1800px] mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-4">
            <Button variant="ghost" onClick={() => navigate("/printers")} className="gap-2">
              <ArrowLeft className="h-4 w-4" />
              Back to Printers
            </Button>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={handleShare} className="gap-2">
              <Share2 className="h-4 w-4" />
              Share
            </Button>
            <Button variant="outline" size="sm" onClick={handleClearAll} className="gap-2 text-destructive hover:text-destructive">
              <Trash2 className="h-4 w-4" />
              Clear All
            </Button>
          </div>
        </div>

        <div className="space-y-2">
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight">
            Compare <span className="text-primary">{printers.length}</span> Printers
          </h1>
          <p className="text-muted-foreground">
            Side-by-side comparison of specifications and features
          </p>
        </div>

        {/* Printer Cards Header */}
        <div 
          className="grid gap-4 sticky top-0 z-20 bg-background/95 backdrop-blur-sm py-4 -mx-4 px-4 md:-mx-6 md:px-6" 
          style={{ gridTemplateColumns: `200px repeat(${printers.length}, 1fr)` }}
        >
          <div className="hidden md:block" />
          {printers.map((printer) => (
            <Card key={printer.id} className="p-4 bg-card/50 border-border/50 relative group">
              {/* Remove button */}
              <button
                onClick={() => handleRemovePrinter(printer.id)}
                className="absolute top-2 right-2 p-1.5 rounded-full bg-destructive/10 hover:bg-destructive/20 text-destructive opacity-0 group-hover:opacity-100 transition-opacity"
                aria-label={`Remove ${printer.model_name} from comparison`}
              >
                <X className="h-4 w-4" />
              </button>

              {/* Printer Image */}
              <div className="aspect-square w-full max-w-[140px] mx-auto mb-3 flex items-center justify-center">
                {getPrinterImage(printer) ? (
                  <img
                    src={getPrinterImage(printer) || ""}
                    alt={`${printer.brand?.brand} ${printer.model_name}`}
                    className="w-full h-full object-contain"
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = 'none';
                      (e.target as HTMLImageElement).nextElementSibling?.classList.remove('hidden');
                    }}
                  />
                ) : null}
                <PrinterIcon className={cn(
                  "h-12 w-12 text-muted-foreground/30",
                  getPrinterImage(printer) && "hidden"
                )} />
              </div>

              {/* Brand */}
              <div className="text-xs font-bold text-primary uppercase tracking-wider text-center mb-1">
                {printer.brand?.brand}
              </div>

              {/* Model Name */}
              <h3 className="font-bold text-base text-center line-clamp-2 mb-1">
                {printer.model_name}
              </h3>

              {printer.series?.series_name && (
                <p className="text-xs text-muted-foreground text-center mb-2">{printer.series.series_name}</p>
              )}

              {/* Price */}
              <div className="text-center mb-3">
                {printer.current_price_usd_store ? (
                  <span className="text-xl font-bold text-amber-500">
                    {formatPrice(printer.current_price_usd_store)}
                  </span>
                ) : printer.current_price_usd_amazon ? (
                  <span className="text-xl font-bold text-amber-500">
                    {formatPrice(printer.current_price_usd_amazon)}
                  </span>
                ) : printer.msrp_usd ? (
                  <span className="text-xl font-bold text-amber-500">
                    {formatPrice(printer.msrp_usd)}
                  </span>
                ) : (
                  <span className="text-sm text-muted-foreground">Price TBD</span>
                )}
              </div>

              {/* Action buttons */}
              <div className="flex gap-2">
                <Link to={`/printers/${printer.id}`} className="flex-1">
                  <Button variant="outline" size="sm" className="w-full gap-1.5 text-xs">
                    <Eye className="h-3.5 w-3.5" />
                    Details
                  </Button>
                </Link>
                {printer.official_product_url && (
                  <a href={printer.official_product_url} target="_blank" rel="noopener noreferrer">
                    <Button variant="outline" size="sm" className="gap-1.5 text-xs">
                      <ExternalLink className="h-3.5 w-3.5" />
                    </Button>
                  </a>
                )}
              </div>
            </Card>
          ))}
        </div>

        {/* Comparison Tables */}
        <div className="space-y-6">
          {/* Build Volume */}
          <Card className="p-4 md:p-6 overflow-x-auto">
            <h2 className="text-lg font-bold mb-4 text-primary border-b border-primary/20 pb-2">Build Volume</h2>
            <ComparisonRow label="X (mm)" values={printers.map(p => p.build_volume_x_mm)} />
            <ComparisonRow label="Y (mm)" values={printers.map(p => p.build_volume_y_mm)} />
            <ComparisonRow label="Z (mm)" values={printers.map(p => p.build_volume_z_mm)} />
            <ComparisonRow label="Shape" values={printers.map(p => p.build_volume_shape)} />
          </Card>

          {/* Performance */}
          <Card className="p-4 md:p-6 overflow-x-auto">
            <h2 className="text-lg font-bold mb-4 text-primary border-b border-primary/20 pb-2">Performance</h2>
            <ComparisonRow label="Max Print Speed (mm/s)" values={printers.map(p => p.max_print_speed_mms)} highlight />
            <ComparisonRow label="Max Travel Speed (mm/s)" values={printers.map(p => p.max_travel_speed_xy_mms)} />
            <ComparisonRow label="Max Flow Rate (mm³/s)" values={printers.map(p => p.max_flow_rate_mm3s)} />
            <ComparisonRow label="Input Shaping" values={printers.map(p => p.input_shaping_supported)} />
            <ComparisonRow label="Linear Rails" values={printers.map(p => p.linear_rails_on_axes)} />
          </Card>

          {/* Extruder & Hotend */}
          <Card className="p-4 md:p-6 overflow-x-auto">
            <h2 className="text-lg font-bold mb-4 text-primary border-b border-primary/20 pb-2">Extruder & Hotend</h2>
            <ComparisonRow label="Extruder Count" values={printers.map(p => p.extruder_count)} />
            <ComparisonRow label="Extruder Type" values={printers.map(p => p.extruder_type)} />
            <ComparisonRow label="Max Nozzle Temp (°C)" values={printers.map(p => p.max_nozzle_temp_c)} highlight />
            <ComparisonRow label="Stock Nozzle Size (mm)" values={printers.map(p => p.stock_nozzle_diameter_mm)} />
            <ComparisonRow label="Nozzle Material" values={printers.map(p => p.nozzle_material)} />
            <ComparisonRow label="Abrasive Support" values={printers.map(p => p.abrasive_filament_support)} />
          </Card>

          {/* Heated Bed */}
          <Card className="p-4 md:p-6 overflow-x-auto">
            <h2 className="text-lg font-bold mb-4 text-primary border-b border-primary/20 pb-2">Heated Bed</h2>
            <ComparisonRow label="Bed Heated" values={printers.map(p => p.bed_heated)} />
            <ComparisonRow label="Max Bed Temp (°C)" values={printers.map(p => p.bed_max_temp_c)} highlight />
            <ComparisonRow label="Auto Bed Leveling" values={printers.map(p => p.auto_bed_leveling)} />
            <ComparisonRow label="ABL Technique" values={printers.map(p => p.abl_technique)} />
            <ComparisonRow label="Supported Plate Types" values={printers.map(p => p.supported_plate_types)} />
          </Card>

          {/* Enclosure */}
          <Card className="p-4 md:p-6 overflow-x-auto">
            <h2 className="text-lg font-bold mb-4 text-primary border-b border-primary/20 pb-2">Enclosure</h2>
            <ComparisonRow label="Has Enclosure" values={printers.map(p => p.has_enclosure)} />
            <ComparisonRow label="Enclosure Type" values={printers.map(p => p.enclosure_type)} />
            <ComparisonRow label="Heated Enclosure" values={printers.map(p => p.enclosure_heated)} />
            <ComparisonRow label="Max Temp (°C)" values={printers.map(p => p.enclosure_max_temp_c)} />
          </Card>

          {/* Material Support */}
          <Card className="p-4 md:p-6 overflow-x-auto">
            <h2 className="text-lg font-bold mb-4 text-primary border-b border-primary/20 pb-2">Material Support</h2>
            <ComparisonRow label="Official Supported" values={printers.map(p => p.official_supported_materials)} />
            <ComparisonRow label="Recommended" values={printers.map(p => p.recommended_materials)} />
            <ComparisonRow label="Abrasive Materials" values={printers.map(p => p.abrasive_materials_supported)} />
          </Card>

          {/* Multi-Material */}
          <Card className="p-4 md:p-6 overflow-x-auto">
            <h2 className="text-lg font-bold mb-4 text-primary border-b border-primary/20 pb-2">Multi-Material</h2>
            <ComparisonRow label="Multi-Material" values={printers.map(p => p.multi_material_supported)} />
            <ComparisonRow label="Native System" values={printers.map(p => p.native_multi_material_system)} />
            <ComparisonRow label="Max Spools" values={printers.map(p => p.multi_material_max_spools)} />
          </Card>

          {/* Features */}
          <Card className="p-4 md:p-6 overflow-x-auto">
            <h2 className="text-lg font-bold mb-4 text-primary border-b border-primary/20 pb-2">Features</h2>
            <ComparisonRow label="Filter Type" values={printers.map(p => p.filter_type)} />
            <ComparisonRow label="Internal Lighting" values={printers.map(p => p.internal_lighting)} />
            <ComparisonRow label="Door Sensor" values={printers.map(p => p.door_sensor)} />
            <ComparisonRow label="Screen Type" values={printers.map(p => p.screen_type)} />
            <ComparisonRow label="Screen Size (inch)" values={printers.map(p => p.screen_size_inch)} />
          </Card>

          {/* Connectivity */}
          <Card className="p-4 md:p-6 overflow-x-auto">
            <h2 className="text-lg font-bold mb-4 text-primary border-b border-primary/20 pb-2">Connectivity</h2>
            <ComparisonRow label="WiFi" values={printers.map(p => p.has_wifi)} />
            <ComparisonRow label="Ethernet" values={printers.map(p => p.has_ethernet)} />
            <ComparisonRow label="Cloud Platforms" values={printers.map(p => p.cloud_platforms)} />
            <ComparisonRow label="Remote Monitoring" values={printers.map(p => p.remote_monitoring_supported)} />
            <ComparisonRow label="SD Card" values={printers.map(p => p.has_sd_card)} />
          </Card>

          {/* Physical Specs */}
          <Card className="p-4 md:p-6 overflow-x-auto">
            <h2 className="text-lg font-bold mb-4 text-primary border-b border-primary/20 pb-2">Physical Dimensions</h2>
            <ComparisonRow label="Width (mm)" values={printers.map(p => p.machine_width_mm)} />
            <ComparisonRow label="Depth (mm)" values={printers.map(p => p.machine_depth_mm)} />
            <ComparisonRow label="Height (mm)" values={printers.map(p => p.machine_height_mm)} />
            <ComparisonRow label="Weight (kg)" values={printers.map(p => p.machine_weight_kg)} />
          </Card>

          {/* Power & Safety */}
          <Card className="p-4 md:p-6 overflow-x-auto">
            <h2 className="text-lg font-bold mb-4 text-primary border-b border-primary/20 pb-2">Power & Safety</h2>
            <ComparisonRow label="Rated Power (W)" values={printers.map(p => p.rated_power_w)} />
            <ComparisonRow label="Power Input" values={printers.map(p => p.power_input_voltage)} />
            <ComparisonRow label="Thermal Runaway Protection" values={printers.map(p => p.thermal_runaway_protection)} />
            <ComparisonRow label="Power Loss Recovery" values={printers.map(p => p.power_loss_recovery)} />
          </Card>

          {/* Community Ratings */}
          <Card className="p-4 md:p-6 overflow-x-auto">
            <h2 className="text-lg font-bold mb-4 text-primary border-b border-primary/20 pb-2">Community Ratings</h2>
            <ComparisonRow label="Overall Rating" values={printers.map(p => p.rating_community_overall)} highlight />
            <ComparisonRow label="Ease of Use" values={printers.map(p => p.rating_ease_of_use)} />
            <ComparisonRow label="Print Quality" values={printers.map(p => p.rating_print_quality)} />
            <ComparisonRow label="Reliability" values={printers.map(p => p.rating_reliability)} />
            <ComparisonRow label="Value for Money" values={printers.map(p => p.rating_value_for_money)} />
          </Card>
        </div>
      </div>
    </div>
  );
};

export default PrinterCompare;
