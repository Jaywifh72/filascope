import { useEffect, useState } from "react";
import { useSearchParams, useNavigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { 
  ArrowLeft, 
  ExternalLink, 
  Eye, 
  X, 
  Check, 
  Minus, 
  Printer as PrinterIcon, 
  Share2, 
  Trash2,
  Plus,
  Wifi,
  Box,
  Palette,
  ThermometerSun,
  Gauge
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { useCurrency } from "@/hooks/useCurrency";
import { usePrinterCompare } from "@/hooks/usePrinterCompare";
import { getPrinterImage } from "@/lib/printerCardUtils";
import { toast } from "sonner";
import type { Database } from "@/integrations/supabase/types";
import { cn } from "@/lib/utils";
import { PrinterRadarChart } from "@/components/printers/compare/PrinterRadarChart";
import { PrinterWinnerBadges } from "@/components/printers/compare/PrinterWinnerBadges";
import { QuickComparisonSidebar } from "@/components/printers/compare/QuickComparisonSidebar";
import { RecommendedFilaments } from "@/components/printers/compare/RecommendedFilaments";

type Printer = Database["public"]["Tables"]["printers"]["Row"] & {
  brand: { brand: string } | null;
  series: { series_name: string } | null;
};

const PrinterCompare = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { formatPrice } = useCurrency();
  const { removePrinter, clearAll, isMaxReached, maxPrinters, count: selectedCount } = usePrinterCompare();
  const [printers, setPrinters] = useState<Printer[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPrinters = async () => {
      // Support both "ids" and "printers" query params for backwards compatibility
      const ids = searchParams.get("ids")?.split(",").filter(Boolean) || searchParams.get("printers")?.split(",").filter(Boolean) || [];
      
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

  const handleAddPrinter = () => {
    navigate("/printers");
  };

  // Helper to calculate volume in liters
  const calculateVolumeLiters = (printer: Printer): number | null => {
    const x = printer.build_volume_x_mm;
    const y = printer.build_volume_y_mm;
    const z = printer.build_volume_z_mm;
    if (x && y && z) {
      return Math.round((x * y * z) / 1000000 * 10) / 10; // Convert mm³ to liters, 1 decimal
    }
    return null;
  };

  // Helper to format volume dimensions
  const formatVolumeDimensions = (printer: Printer): string | null => {
    const x = printer.build_volume_x_mm;
    const y = printer.build_volume_y_mm;
    const z = printer.build_volume_z_mm;
    if (x && y && z) {
      if (x === y && y === z) return `${x}³ mm`;
      if (x === y) return `${x}² × ${z} mm`;
      return `${x} × ${y} × ${z} mm`;
    }
    return null;
  };

  // Helper to get current price
  const getCurrentPrice = (printer: Printer): number | null => {
    return printer.current_price_usd_store || printer.current_price_usd_amazon || printer.msrp_usd || null;
  };

  // Helper to calculate discount percentage
  const getDiscountPercent = (printer: Printer): number | null => {
    const currentPrice = printer.current_price_usd_store || printer.current_price_usd_amazon;
    const msrp = printer.msrp_usd;
    if (currentPrice && msrp && currentPrice < msrp) {
      return Math.round(((msrp - currentPrice) / msrp) * 100);
    }
    return null;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          <p className="text-muted-foreground">Loading comparison...</p>
        </div>
      </div>
    );
  }

  // Empty state
  if (printers.length === 0) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-6">
        <Card className="max-w-md w-full p-8 text-center space-y-6 bg-card/50 border-border/50">
          <div className="mx-auto w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
            <PrinterIcon className="h-8 w-8 text-primary" />
          </div>
          <div className="space-y-2">
            <h2 className="text-xl font-bold">No Printers Selected</h2>
            <p className="text-muted-foreground">
              No printers selected for comparison. Browse our printer registry to add some for a side-by-side comparison.
            </p>
          </div>
          <Button onClick={() => navigate("/printers")} className="gap-2">
            <ArrowLeft className="h-4 w-4" />
            Browse Printers
          </Button>
        </Card>
      </div>
    );
  }

  // Enhanced ComparisonRow with best value highlighting
  const ComparisonRow = ({ 
    label, 
    values, 
    highlight = false,
    highlightType = "max", // "max" for higher is better, "min" for lower is better
    icon
  }: { 
    label: string; 
    values: (string | number | boolean | null)[]; 
    highlight?: boolean;
    highlightType?: "max" | "min";
    icon?: React.ReactNode;
  }) => {
    // Find best value for highlighting (for numeric values)
    const numericValues = values.map((v, i) => ({ value: typeof v === 'number' ? v : null, index: i }));
    const validNumerics = numericValues.filter(n => n.value !== null).map(n => n.value as number);
    const bestNumeric = highlightType === "max" 
      ? Math.max(...validNumerics)
      : Math.min(...validNumerics);
    
    return (
      <div 
        className={cn(
          "grid gap-4 py-3 border-b border-border/50 last:border-b-0",
          highlight && "bg-primary/5"
        )} 
        style={{ gridTemplateColumns: `200px repeat(${printers.length}, 1fr)` }}
      >
        <div className="font-medium text-sm text-muted-foreground px-4 flex items-center gap-2">
          {icon}
          {label}
        </div>
        {values.map((value, index) => {
          const isBest = typeof value === 'number' && value === bestNumeric && validNumerics.length > 1;
          return (
            <div key={index} className={cn(
              "text-sm text-center transition-colors",
              isBest && "bg-primary/20 rounded-md py-1 text-primary font-semibold"
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
          <div className="flex items-center gap-2 flex-wrap">
            {printers.length < maxPrinters && (
              <Button variant="outline" size="sm" onClick={handleAddPrinter} className="gap-2">
                <Plus className="h-4 w-4" />
                Add Printer
              </Button>
            )}
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
            Side-by-side comparison of specifications and features. Best values are highlighted.
          </p>
        </div>

        {/* Winner Badges */}
        <PrinterWinnerBadges printers={printers} />

        {/* Main layout: sidebar + comparison */}
        <div className="flex gap-6">
          {/* Quick Comparison Sidebar - desktop only */}
          <div className="hidden xl:block w-[280px] flex-shrink-0 sticky top-4 self-start">
            <Card className="p-4 bg-card/50 border-border/50">
              <QuickComparisonSidebar printers={printers} />
            </Card>
          </div>

          {/* Main comparison content */}
          <div className="flex-1 min-w-0 space-y-6">
            {/* Scrollable comparison container */}
            <div className="overflow-x-auto">
          <div className="min-w-max">
            {/* Printer Cards Header - Sticky */}
            <div 
              className="grid gap-4 sticky top-0 z-20 bg-background/95 backdrop-blur-sm py-4" 
              style={{ gridTemplateColumns: `200px repeat(${printers.length}, minmax(200px, 1fr))` }}
            >
              <div className="hidden md:flex items-center justify-center text-sm text-muted-foreground">
                {printers.length}/{maxPrinters} selected
              </div>
              {printers.map((printer) => {
                const currentPrice = getCurrentPrice(printer);
                const discountPercent = getDiscountPercent(printer);
                
                return (
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
                    <div className="aspect-square w-full max-w-[120px] mx-auto mb-3 flex items-center justify-center">
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

                    {/* Price Section */}
                    <div className="text-center mb-3 space-y-1">
                      {currentPrice ? (
                        <>
                          <div className="flex items-center justify-center gap-2">
                            <span className="text-xl font-bold text-white">
                              {formatPrice(currentPrice)}
                            </span>
                            {discountPercent && (
                              <span className="text-xs font-semibold bg-emerald-500/90 text-white px-2 py-0.5 rounded-full">
                                -{discountPercent}%
                              </span>
                            )}
                          </div>
                          {discountPercent && printer.msrp_usd && (
                            <span className="text-xs text-muted-foreground line-through">
                              MSRP {formatPrice(printer.msrp_usd)}
                            </span>
                          )}
                        </>
                      ) : (
                        <span className="text-sm text-muted-foreground">Price TBD</span>
                      )}
                    </div>

                    {/* Action buttons */}
                    <div className="flex gap-2">
                      <Link to={`/printers/${printer.printer_id || printer.id}`} className="flex-1">
                        <Button variant="outline" size="sm" className="w-full gap-1.5 text-xs">
                          <Eye className="h-3.5 w-3.5" />
                          View Details
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
                );
              })}
            </div>

            {/* Comparison Tables */}
            <div className="space-y-6 mt-6">
              {/* Price Summary */}
              <Card className="p-4 md:p-6">
                <h2 className="text-lg font-bold mb-4 text-primary border-b border-primary/20 pb-2 flex items-center gap-2">
                  💰 Pricing
                </h2>
                <ComparisonRow 
                  label="Current Price" 
                  values={printers.map(p => getCurrentPrice(p))} 
                  highlight 
                  highlightType="min" 
                />
                <ComparisonRow 
                  label="MSRP" 
                  values={printers.map(p => p.msrp_usd ? formatPrice(p.msrp_usd) : null)} 
                />
                <ComparisonRow 
                  label="Discount" 
                  values={printers.map(p => {
                    const discount = getDiscountPercent(p);
                    return discount ? `${discount}% off` : null;
                  })} 
                />
                <ComparisonRow 
                  label="Price per cm³" 
                  values={printers.map(p => {
                    const price = getCurrentPrice(p);
                    const x = p.build_volume_x_mm;
                    const y = p.build_volume_y_mm;
                    const z = p.build_volume_z_mm;
                    if (price && x && y && z) {
                      const volumeCm3 = (x * y * z) / 1000;
                      return `$${(price / volumeCm3).toFixed(4)}/cm³`;
                    }
                    return null;
                  })} 
                  highlightType="min"
                />
              </Card>

              {/* Build Volume */}
              <Card className="p-4 md:p-6">
                <h2 className="text-lg font-bold mb-4 text-primary border-b border-primary/20 pb-2 flex items-center gap-2">
                  <Box className="h-5 w-5" /> Build Volume
                </h2>
                <ComparisonRow 
                  label="Dimensions" 
                  values={printers.map(p => formatVolumeDimensions(p))} 
                />
                <ComparisonRow 
                  label="Volume (Liters)" 
                  values={printers.map(p => calculateVolumeLiters(p))} 
                  highlight 
                />
                <ComparisonRow label="X (mm)" values={printers.map(p => p.build_volume_x_mm)} />
                <ComparisonRow label="Y (mm)" values={printers.map(p => p.build_volume_y_mm)} />
                <ComparisonRow label="Z (mm)" values={printers.map(p => p.build_volume_z_mm)} />
                <ComparisonRow label="Shape" values={printers.map(p => p.build_volume_shape)} />
              </Card>

              {/* Performance */}
              <Card className="p-4 md:p-6">
                <h2 className="text-lg font-bold mb-4 text-primary border-b border-primary/20 pb-2 flex items-center gap-2">
                  <Gauge className="h-5 w-5" /> Performance
                </h2>
                <ComparisonRow 
                  label="Max Print Speed (mm/s)" 
                  values={printers.map(p => p.max_print_speed_mms)} 
                  highlight 
                />
                <ComparisonRow label="Max Travel Speed (mm/s)" values={printers.map(p => p.max_travel_speed_xy_mms)} />
                <ComparisonRow label="Max Flow Rate (mm³/s)" values={printers.map(p => p.max_flow_rate_mm3s)} highlight />
                <ComparisonRow label="Motion System" values={printers.map(p => p.motion_system_notes)} />
                <ComparisonRow label="Input Shaping" values={printers.map(p => p.input_shaping_supported)} />
                <ComparisonRow label="Linear Rails" values={printers.map(p => p.linear_rails_on_axes)} />
              </Card>

              {/* Temperature */}
              <Card className="p-4 md:p-6">
                <h2 className="text-lg font-bold mb-4 text-primary border-b border-primary/20 pb-2 flex items-center gap-2">
                  <ThermometerSun className="h-5 w-5" /> Temperature
                </h2>
                <ComparisonRow 
                  label="Max Nozzle Temp (°C)" 
                  values={printers.map(p => p.max_nozzle_temp_c)} 
                  highlight 
                />
                <ComparisonRow 
                  label="Max Bed Temp (°C)" 
                  values={printers.map(p => p.bed_max_temp_c)} 
                  highlight 
                />
                <ComparisonRow label="Stock Nozzle Size (mm)" values={printers.map(p => p.stock_nozzle_diameter_mm)} />
                <ComparisonRow label="Nozzle Material" values={printers.map(p => p.nozzle_material)} />
              </Card>

              {/* Key Features */}
              <Card className="p-4 md:p-6">
                <h2 className="text-lg font-bold mb-4 text-primary border-b border-primary/20 pb-2 flex items-center gap-2">
                  ✨ Key Features
                </h2>
                <ComparisonRow 
                  label="Multi-Color" 
                  values={printers.map(p => p.multi_material_supported)} 
                  icon={<Palette className="h-4 w-4" />}
                />
                <ComparisonRow 
                  label="Enclosed" 
                  values={printers.map(p => p.has_enclosure)} 
                />
                <ComparisonRow 
                  label="Auto Bed Leveling" 
                  values={printers.map(p => p.auto_bed_leveling)} 
                />
                <ComparisonRow 
                  label="Wi-Fi" 
                  values={printers.map(p => p.has_wifi)} 
                  icon={<Wifi className="h-4 w-4" />}
                />
                <ComparisonRow label="Remote Monitoring" values={printers.map(p => p.remote_monitoring_supported)} />
                <ComparisonRow label="Filament Runout Sensor" values={printers.map(p => p.filament_runout_detection)} />
                <ComparisonRow label="Camera / AI Detection" values={printers.map(p => p.ai_spaghetti_detection)} />
                <ComparisonRow 
                  label="Touchscreen" 
                  values={printers.map(p => p.screen_type ? p.screen_type : null)} 
                />
                <ComparisonRow label="Power Loss Recovery" values={printers.map(p => p.power_loss_recovery)} />
              </Card>

              {/* Connectivity */}
              <Card className="p-4 md:p-6">
                <h2 className="text-lg font-bold mb-4 text-primary border-b border-primary/20 pb-2 flex items-center gap-2">
                  <Wifi className="h-5 w-5" /> Connectivity
                </h2>
                <ComparisonRow label="WiFi" values={printers.map(p => p.has_wifi)} />
                <ComparisonRow label="Ethernet" values={printers.map(p => p.has_ethernet)} />
                <ComparisonRow label="USB-A Port" values={printers.map(p => p.has_usb_a_port)} />
                <ComparisonRow label="USB-C Port" values={printers.map(p => p.has_usb_c_port)} />
                <ComparisonRow label="SD Card" values={printers.map(p => p.has_sd_card)} />
                <ComparisonRow label="Cloud Platforms" values={printers.map(p => p.cloud_platforms)} />
              </Card>

              {/* Extruder & Hotend */}
              <Card className="p-4 md:p-6">
                <h2 className="text-lg font-bold mb-4 text-primary border-b border-primary/20 pb-2">Extruder & Hotend</h2>
                <ComparisonRow label="Extruder Count" values={printers.map(p => p.extruder_count)} />
                <ComparisonRow label="Extruder Type" values={printers.map(p => p.extruder_type)} />
                <ComparisonRow label="Abrasive Support" values={printers.map(p => p.abrasive_filament_support)} />
              </Card>

              {/* Multi-Material */}
              <Card className="p-4 md:p-6">
                <h2 className="text-lg font-bold mb-4 text-primary border-b border-primary/20 pb-2">Multi-Material</h2>
                <ComparisonRow label="Multi-Material" values={printers.map(p => p.multi_material_supported)} />
                <ComparisonRow label="Native System" values={printers.map(p => p.native_multi_material_system)} />
                <ComparisonRow label="Max Spools" values={printers.map(p => p.multi_material_max_spools)} highlight />
              </Card>

              {/* Enclosure */}
              <Card className="p-4 md:p-6">
                <h2 className="text-lg font-bold mb-4 text-primary border-b border-primary/20 pb-2">Enclosure</h2>
                <ComparisonRow label="Has Enclosure" values={printers.map(p => p.has_enclosure)} />
                <ComparisonRow label="Enclosure Type" values={printers.map(p => p.enclosure_type)} />
                <ComparisonRow label="Heated Enclosure" values={printers.map(p => p.enclosure_heated)} />
                <ComparisonRow label="Max Temp (°C)" values={printers.map(p => p.enclosure_max_temp_c)} highlight />
              </Card>

              {/* Physical Specs */}
              <Card className="p-4 md:p-6">
                <h2 className="text-lg font-bold mb-4 text-primary border-b border-primary/20 pb-2">Physical Dimensions</h2>
                <ComparisonRow label="Width (mm)" values={printers.map(p => p.machine_width_mm)} />
                <ComparisonRow label="Depth (mm)" values={printers.map(p => p.machine_depth_mm)} />
                <ComparisonRow label="Height (mm)" values={printers.map(p => p.machine_height_mm)} />
                <ComparisonRow label="Weight (kg)" values={printers.map(p => p.machine_weight_kg)} highlightType="min" />
              </Card>

              {/* Release Info */}
              <Card className="p-4 md:p-6">
                <h2 className="text-lg font-bold mb-4 text-primary border-b border-primary/20 pb-2">Release Info</h2>
                <ComparisonRow label="Release Date" values={printers.map(p => p.release_date ? new Date(p.release_date).toLocaleDateString() : null)} />
                <ComparisonRow label="Discontinued" values={printers.map(p => p.discontinued)} />
              </Card>

              {/* Power & Safety */}
              <Card className="p-4 md:p-6">
                <h2 className="text-lg font-bold mb-4 text-primary border-b border-primary/20 pb-2">Power & Safety</h2>
                <ComparisonRow label="Rated Power (W)" values={printers.map(p => p.rated_power_w)} highlightType="min" />
                <ComparisonRow label="Power Input" values={printers.map(p => p.power_input_voltage)} />
                <ComparisonRow label="Thermal Runaway Protection" values={printers.map(p => p.thermal_runaway_protection)} />
              </Card>

              {/* Community Ratings */}
              <Card className="p-4 md:p-6">
                <h2 className="text-lg font-bold mb-4 text-primary border-b border-primary/20 pb-2">Community Ratings</h2>
                <ComparisonRow label="Overall Rating" values={printers.map(p => p.rating_community_overall)} highlight />
                <ComparisonRow label="Ease of Use" values={printers.map(p => p.rating_ease_of_use)} highlight />
                <ComparisonRow label="Print Quality" values={printers.map(p => p.rating_print_quality)} highlight />
                <ComparisonRow label="Reliability" values={printers.map(p => p.rating_reliability)} highlight />
                <ComparisonRow label="Value for Money" values={printers.map(p => p.rating_value_for_money)} highlight />
              </Card>

              {/* Performance Radar Chart */}
              <Card className="p-4 md:p-6">
                <h2 className="text-lg font-bold mb-4 text-primary border-b border-primary/20 pb-2">
                  📊 Performance Overview
                </h2>
                <PrinterRadarChart printers={printers} />
              </Card>

              {/* Recommended Filaments */}
              <Card className="p-4 md:p-6">
                <RecommendedFilaments printers={printers} />
              </Card>
            </div>
          </div>
          </div>
          </div>

          {/* Quick Comparison on mobile (below main content) */}
          <div className="xl:hidden">
            <Card className="p-4 bg-card/50 border-border/50">
              <QuickComparisonSidebar printers={printers} />
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PrinterCompare;
