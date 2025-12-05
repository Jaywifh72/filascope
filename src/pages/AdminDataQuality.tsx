import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ArrowLeft, CheckCircle, AlertCircle, XCircle, RefreshCw, Database, Printer, TestTube, Wrench } from "lucide-react";

interface DataQualityMetrics {
  total: number;
  fields: {
    name: string;
    label: string;
    filled: number;
    percentage: number;
    priority: "critical" | "important" | "nice-to-have";
  }[];
  inconsistencies: {
    issue: string;
    count: number;
    items: string[];
  }[];
}

interface ItemWithIssues {
  id: string;
  name: string;
  secondary?: string;
  missingFields: string[];
  issueCount: number;
}

interface AccessoryMetrics {
  hotends: DataQualityMetrics | null;
  buildPlates: DataQualityMetrics | null;
  amsMmu: DataQualityMetrics | null;
}

const AdminDataQuality = () => {
  const navigate = useNavigate();
  const { isAdmin, loading } = useAuth();
  const [activeTab, setActiveTab] = useState("printers");
  const [printerMetrics, setPrinterMetrics] = useState<DataQualityMetrics | null>(null);
  const [filamentMetrics, setFilamentMetrics] = useState<DataQualityMetrics | null>(null);
  const [accessoryMetrics, setAccessoryMetrics] = useState<AccessoryMetrics>({ hotends: null, buildPlates: null, amsMmu: null });
  const [printersWithIssues, setPrintersWithIssues] = useState<ItemWithIssues[]>([]);
  const [filamentsWithIssues, setFilamentsWithIssues] = useState<ItemWithIssues[]>([]);
  const [accessoriesWithIssues, setAccessoriesWithIssues] = useState<ItemWithIssues[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!loading && !isAdmin) {
      navigate("/");
    }
  }, [isAdmin, loading, navigate]);

  useEffect(() => {
    if (isAdmin) {
      fetchAllData();
    }
  }, [isAdmin]);

  const fetchAllData = async () => {
    setIsLoading(true);
    await Promise.all([fetchPrinterData(), fetchFilamentData(), fetchAccessoryData()]);
    setIsLoading(false);
  };

  const fetchPrinterData = async () => {
    const { data: printers, error } = await supabase
      .from("printers")
      .select(`
        id, model_name, brand_id,
        msrp_usd, current_price_usd_store, current_price_usd_amazon,
        build_volume_x_mm, build_volume_y_mm, build_volume_z_mm,
        max_nozzle_temp_c, bed_max_temp_c, max_print_speed_mms,
        bed_heated, has_enclosure, auto_bed_leveling, has_wifi,
        official_product_url, release_date,
        machine_weight_kg, rated_power_w,
        extruder_type, hotend_type, nozzle_material,
        scraped_data, enclosure_heated,
        printer_brands(brand)
      `);

    if (error || !printers) return;

    const total = printers.length;
    const fieldChecks = [
      { name: "msrp_usd", label: "MSRP Price", priority: "critical" as const },
      { name: "current_price_usd_store", label: "Store Price", priority: "critical" as const },
      { name: "build_volume", label: "Build Volume", priority: "critical" as const },
      { name: "max_nozzle_temp_c", label: "Max Nozzle Temp", priority: "critical" as const },
      { name: "bed_max_temp_c", label: "Max Bed Temp", priority: "critical" as const },
      { name: "max_print_speed_mms", label: "Max Print Speed", priority: "important" as const },
      { name: "official_product_url", label: "Product URL", priority: "important" as const },
      { name: "release_date", label: "Release Date", priority: "important" as const },
      { name: "bed_heated", label: "Heated Bed Flag", priority: "important" as const },
      { name: "has_enclosure", label: "Enclosure Flag", priority: "important" as const },
      { name: "auto_bed_leveling", label: "ABL Flag", priority: "important" as const },
      { name: "has_wifi", label: "WiFi Flag", priority: "nice-to-have" as const },
      { name: "machine_weight_kg", label: "Machine Weight", priority: "nice-to-have" as const },
      { name: "rated_power_w", label: "Power Rating", priority: "nice-to-have" as const },
      { name: "extruder_type", label: "Extruder Type", priority: "nice-to-have" as const },
      { name: "hotend_type", label: "Hotend Type", priority: "nice-to-have" as const },
      { name: "product_images", label: "Product Images", priority: "important" as const },
    ];

    const fields = fieldChecks.map(field => {
      let filled = 0;
      printers.forEach((p: any) => {
        if (field.name === "build_volume") {
          if (p.build_volume_x_mm && p.build_volume_y_mm && p.build_volume_z_mm) filled++;
        } else if (field.name === "product_images") {
          const images = p.scraped_data?.images?.product_images;
          if (images && Array.isArray(images) && images.length > 0) filled++;
        } else {
          const value = p[field.name];
          if (value !== null && value !== undefined && value !== "") filled++;
        }
      });
      return { ...field, filled, percentage: Math.round((filled / total) * 100) };
    });

    const inconsistencies: DataQualityMetrics["inconsistencies"] = [];
    const bedIssues = printers.filter((p: any) => p.bed_max_temp_c && p.bed_max_temp_c > 0 && p.bed_heated === false);
    if (bedIssues.length > 0) {
      inconsistencies.push({ issue: "Has bed temp but bed_heated=false", count: bedIssues.length, items: bedIssues.map((p: any) => p.model_name) });
    }
    const enclosureIssues = printers.filter((p: any) => p.enclosure_heated === true && p.has_enclosure === false);
    if (enclosureIssues.length > 0) {
      inconsistencies.push({ issue: "Has heated enclosure but has_enclosure=false", count: enclosureIssues.length, items: enclosureIssues.map((p: any) => p.model_name) });
    }
    const priceIssues = printers.filter((p: any) => (p.msrp_usd && p.msrp_usd < 50) || (p.current_price_usd_store && p.current_price_usd_store < 50));
    if (priceIssues.length > 0) {
      inconsistencies.push({ issue: "Suspiciously low price (<$50)", count: priceIssues.length, items: priceIssues.map((p: any) => p.model_name) });
    }

    const printersIssues: ItemWithIssues[] = printers
      .map((p: any) => {
        const missingFields: string[] = [];
        if (!p.msrp_usd && !p.current_price_usd_store) missingFields.push("Any Price");
        if (!p.build_volume_x_mm || !p.build_volume_y_mm || !p.build_volume_z_mm) missingFields.push("Build Volume");
        if (!p.max_nozzle_temp_c) missingFields.push("Nozzle Temp");
        if (!p.bed_max_temp_c) missingFields.push("Bed Temp");
        if (!p.official_product_url) missingFields.push("Product URL");
        const images = p.scraped_data?.images?.product_images;
        if (!images || !Array.isArray(images) || images.length === 0) missingFields.push("Images");
        return { id: p.id, name: p.model_name, secondary: p.printer_brands?.brand, missingFields, issueCount: missingFields.length };
      })
      .filter(p => p.issueCount > 0)
      .sort((a, b) => b.issueCount - a.issueCount);

    setPrinterMetrics({ total, fields, inconsistencies });
    setPrintersWithIssues(printersIssues);
  };

  const fetchFilamentData = async () => {
    const { data: filaments, error } = await supabase
      .from("filaments")
      .select("*");

    if (error || !filaments) return;

    const total = filaments.length;
    const fieldChecks = [
      { name: "material", label: "Material Type", priority: "critical" as const },
      { name: "vendor", label: "Vendor/Brand", priority: "critical" as const },
      { name: "variant_price", label: "Price", priority: "critical" as const },
      { name: "featured_image", label: "Product Image", priority: "critical" as const },
      { name: "nozzle_temps", label: "Nozzle Temp Range", priority: "critical" as const },
      { name: "bed_temps", label: "Bed Temp Range", priority: "critical" as const },
      { name: "color_hex", label: "Color Hex", priority: "important" as const },
      { name: "color_family", label: "Color Family", priority: "important" as const },
      { name: "diameter_nominal_mm", label: "Diameter", priority: "important" as const },
      { name: "net_weight_g", label: "Net Weight", priority: "important" as const },
      { name: "product_url", label: "Product URL", priority: "important" as const },
      { name: "density_g_cm3", label: "Density", priority: "nice-to-have" as const },
      { name: "tensile_strength_xy_mpa", label: "Tensile Strength", priority: "nice-to-have" as const },
      { name: "print_speed_max_mms", label: "Max Print Speed", priority: "nice-to-have" as const },
      { name: "drying_temp_c", label: "Drying Temp", priority: "nice-to-have" as const },
      { name: "is_nozzle_abrasive", label: "Abrasive Flag", priority: "nice-to-have" as const },
      { name: "spool_ams_fit", label: "AMS Fit Flag", priority: "nice-to-have" as const },
    ];

    const fields = fieldChecks.map(field => {
      let filled = 0;
      filaments.forEach((f: any) => {
        if (field.name === "nozzle_temps") {
          if (f.nozzle_temp_min_c && f.nozzle_temp_max_c) filled++;
        } else if (field.name === "bed_temps") {
          if (f.bed_temp_min_c && f.bed_temp_max_c) filled++;
        } else {
          const value = f[field.name];
          if (value !== null && value !== undefined && value !== "") filled++;
        }
      });
      return { ...field, filled, percentage: Math.round((filled / total) * 100) };
    });

    const inconsistencies: DataQualityMetrics["inconsistencies"] = [];
    
    // Check for invalid temperature ranges
    const tempRangeIssues = filaments.filter((f: any) => 
      (f.nozzle_temp_min_c && f.nozzle_temp_max_c && f.nozzle_temp_min_c > f.nozzle_temp_max_c) ||
      (f.bed_temp_min_c && f.bed_temp_max_c && f.bed_temp_min_c > f.bed_temp_max_c)
    );
    if (tempRangeIssues.length > 0) {
      inconsistencies.push({ issue: "Min temp greater than max temp", count: tempRangeIssues.length, items: tempRangeIssues.map((f: any) => f.product_title) });
    }

    // Check for suspiciously low prices
    const priceIssues = filaments.filter((f: any) => f.variant_price && f.variant_price < 5);
    if (priceIssues.length > 0) {
      inconsistencies.push({ issue: "Suspiciously low price (<$5)", count: priceIssues.length, items: priceIssues.map((f: any) => f.product_title) });
    }

    // Check for missing material but has other specs
    const materialIssues = filaments.filter((f: any) => !f.material && (f.nozzle_temp_min_c || f.density_g_cm3));
    if (materialIssues.length > 0) {
      inconsistencies.push({ issue: "Has specs but missing material type", count: materialIssues.length, items: materialIssues.map((f: any) => f.product_title) });
    }

    // Check for invalid diameter
    const diameterIssues = filaments.filter((f: any) => f.diameter_nominal_mm && (f.diameter_nominal_mm < 1 || f.diameter_nominal_mm > 4));
    if (diameterIssues.length > 0) {
      inconsistencies.push({ issue: "Invalid diameter (not 1.75mm or 2.85mm)", count: diameterIssues.length, items: diameterIssues.map((f: any) => f.product_title) });
    }

    const filamentsIssues: ItemWithIssues[] = filaments
      .map((f: any) => {
        const missingFields: string[] = [];
        if (!f.material) missingFields.push("Material");
        if (!f.vendor) missingFields.push("Vendor");
        if (!f.variant_price) missingFields.push("Price");
        if (!f.featured_image) missingFields.push("Image");
        if (!f.nozzle_temp_min_c || !f.nozzle_temp_max_c) missingFields.push("Nozzle Temps");
        if (!f.bed_temp_min_c || !f.bed_temp_max_c) missingFields.push("Bed Temps");
        if (!f.color_hex) missingFields.push("Color");
        return { id: f.id, name: f.product_title, secondary: f.vendor, missingFields, issueCount: missingFields.length };
      })
      .filter(f => f.issueCount > 0)
      .sort((a, b) => b.issueCount - a.issueCount);

    setFilamentMetrics({ total, fields, inconsistencies });
    setFilamentsWithIssues(filamentsIssues);
  };

  const fetchAccessoryData = async () => {
    const { data: accessories, error } = await supabase
      .from("printer_accessories")
      .select("*");

    if (error || !accessories) return;

    const hotends = accessories.filter((a: any) => a.accessory_type === "hotend");
    const buildPlates = accessories.filter((a: any) => a.accessory_type === "build_plate");
    const amsMmu = accessories.filter((a: any) => a.accessory_type === "ams_mmu");

    const processAccessoryType = (items: any[], type: string) => {
      const total = items.length;
      if (total === 0) return null;

      const fieldChecks = [
        { name: "name", label: "Name", priority: "critical" as const },
        { name: "brand", label: "Brand", priority: "critical" as const },
        { name: "price", label: "Price", priority: "critical" as const },
        { name: "image_url", label: "Product Image", priority: "critical" as const },
        { name: "product_url", label: "Product URL", priority: "important" as const },
        { name: "compatible_printer_brands", label: "Compatible Brands", priority: "important" as const },
        { name: "description", label: "Description", priority: "nice-to-have" as const },
        { name: "specs", label: "Specifications", priority: "important" as const },
      ];

      const fields = fieldChecks.map(field => {
        let filled = 0;
        items.forEach((a: any) => {
          if (field.name === "specs") {
            if (a.specs && Object.keys(a.specs).length > 0) filled++;
          } else if (field.name === "compatible_printer_brands") {
            if (a.compatible_printer_brands && a.compatible_printer_brands.length > 0) filled++;
          } else {
            const value = a[field.name];
            if (value !== null && value !== undefined && value !== "") filled++;
          }
        });
        return { ...field, filled, percentage: total > 0 ? Math.round((filled / total) * 100) : 0 };
      });

      const inconsistencies: DataQualityMetrics["inconsistencies"] = [];
      
      const priceIssues = items.filter((a: any) => a.price && a.price < 1);
      if (priceIssues.length > 0) {
        inconsistencies.push({ issue: "Suspiciously low price (<$1)", count: priceIssues.length, items: priceIssues.map((a: any) => a.name) });
      }

      const noBrandNoCompat = items.filter((a: any) => !a.brand && (!a.compatible_printer_brands || a.compatible_printer_brands.length === 0));
      if (noBrandNoCompat.length > 0) {
        inconsistencies.push({ issue: "Missing both brand and compatible brands", count: noBrandNoCompat.length, items: noBrandNoCompat.map((a: any) => a.name) });
      }

      const brokenImages = items.filter((a: any) => a.image_url && (a.image_url.includes("placeholder") || !a.image_url.startsWith("http")));
      if (brokenImages.length > 0) {
        inconsistencies.push({ issue: "Potentially broken/placeholder image", count: brokenImages.length, items: brokenImages.map((a: any) => a.name) });
      }

      return { total, fields, inconsistencies };
    };

    const hotendMetrics = processAccessoryType(hotends, "hotend");
    const buildPlateMetrics = processAccessoryType(buildPlates, "build_plate");
    const amsMmuMetrics = processAccessoryType(amsMmu, "ams_mmu");

    setAccessoryMetrics({
      hotends: hotendMetrics,
      buildPlates: buildPlateMetrics,
      amsMmu: amsMmuMetrics,
    });

    // Build combined issues list
    const allAccessories = [...hotends, ...buildPlates, ...amsMmu];
    const accessoryIssues: ItemWithIssues[] = allAccessories
      .map((a: any) => {
        const missingFields: string[] = [];
        if (!a.name) missingFields.push("Name");
        if (!a.brand) missingFields.push("Brand");
        if (!a.price) missingFields.push("Price");
        if (!a.image_url) missingFields.push("Image");
        if (!a.product_url) missingFields.push("URL");
        if (!a.specs || Object.keys(a.specs).length === 0) missingFields.push("Specs");
        return { 
          id: a.id, 
          name: a.name || "Unnamed", 
          secondary: `${a.brand || "Unknown"} (${a.accessory_type})`, 
          missingFields, 
          issueCount: missingFields.length 
        };
      })
      .filter(a => a.issueCount > 0)
      .sort((a, b) => b.issueCount - a.issueCount);

    setAccessoriesWithIssues(accessoryIssues);
  };

  const getProgressColor = (percentage: number) => {
    if (percentage >= 90) return "bg-green-500";
    if (percentage >= 70) return "bg-yellow-500";
    if (percentage >= 50) return "bg-orange-500";
    return "bg-red-500";
  };

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case "critical":
        return <Badge variant="destructive" className="text-xs">Critical</Badge>;
      case "important":
        return <Badge variant="secondary" className="text-xs">Important</Badge>;
      default:
        return <Badge variant="outline" className="text-xs">Nice to have</Badge>;
    }
  };

  const renderMetricsContent = (
    metrics: DataQualityMetrics | null,
    itemsWithIssues: ItemWithIssues[],
    itemType: "printer" | "filament"
  ) => {
    const overallCompleteness = metrics 
      ? Math.round(metrics.fields.reduce((sum, f) => sum + f.percentage, 0) / metrics.fields.length)
      : 0;

    const criticalCompleteness = metrics
      ? Math.round(
          metrics.fields.filter(f => f.priority === "critical").reduce((sum, f) => sum + f.percentage, 0) / 
          metrics.fields.filter(f => f.priority === "critical").length
        )
      : 0;

    const detailPath = itemType === "printer" ? "/printers" : "/filament";

    return (
      <div className="space-y-8">
        {/* Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="p-6 bg-card border-border">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-muted-foreground">Overall Completeness</span>
              {overallCompleteness >= 80 ? (
                <CheckCircle className="w-5 h-5 text-green-500" />
              ) : overallCompleteness >= 60 ? (
                <AlertCircle className="w-5 h-5 text-yellow-500" />
              ) : (
                <XCircle className="w-5 h-5 text-red-500" />
              )}
            </div>
            <p className="text-4xl font-bold text-foreground mb-2">{overallCompleteness}%</p>
            <Progress value={overallCompleteness} className="h-2" />
          </Card>

          <Card className="p-6 bg-card border-border">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-muted-foreground">Critical Fields</span>
              <Badge variant="destructive">Critical</Badge>
            </div>
            <p className="text-4xl font-bold text-foreground mb-2">{criticalCompleteness}%</p>
            <Progress value={criticalCompleteness} className="h-2" />
          </Card>

          <Card className="p-6 bg-card border-border">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-muted-foreground">{itemType === "printer" ? "Printers" : "Filaments"} with Issues</span>
              <AlertCircle className="w-5 h-5 text-orange-500" />
            </div>
            <p className="text-4xl font-bold text-foreground mb-2">{itemsWithIssues.length}</p>
            <p className="text-xs text-muted-foreground">
              {Math.round((itemsWithIssues.length / (metrics?.total || 1)) * 100)}% need attention
            </p>
          </Card>
        </div>

        {/* Field Completeness */}
        <Card className="p-6 bg-card border-border">
          <h2 className="text-xl font-semibold text-foreground mb-4">Field Completeness</h2>
          <div className="space-y-4">
            {metrics?.fields.map((field) => (
              <div key={field.name} className="flex items-center gap-4">
                <div className="w-44 flex items-center gap-2">
                  <span className="text-sm text-foreground">{field.label}</span>
                  {getPriorityBadge(field.priority)}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <div className="flex-1 bg-muted rounded-full h-3 overflow-hidden">
                      <div
                        className={`h-full transition-all ${getProgressColor(field.percentage)}`}
                        style={{ width: `${field.percentage}%` }}
                      />
                    </div>
                    <span className="text-sm font-medium w-16 text-right">
                      {field.filled}/{metrics.total}
                    </span>
                    <span className="text-sm text-muted-foreground w-12 text-right">
                      {field.percentage}%
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Data Inconsistencies */}
        {metrics?.inconsistencies && metrics.inconsistencies.length > 0 && (
          <Card className="p-6 bg-card border-border">
            <h2 className="text-xl font-semibold text-foreground mb-4 flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-orange-500" />
              Data Inconsistencies
            </h2>
            <div className="space-y-3">
              {metrics.inconsistencies.map((issue, idx) => (
                <div key={idx} className="flex items-start gap-3 p-3 bg-orange-500/10 rounded-lg border border-orange-500/20">
                  <AlertCircle className="w-5 h-5 text-orange-500 mt-0.5" />
                  <div>
                    <p className="font-medium text-foreground">{issue.issue}</p>
                    <p className="text-sm text-muted-foreground">
                      {issue.count} {itemType}(s): {issue.items.slice(0, 5).join(", ")}
                      {issue.items.length > 5 && ` +${issue.items.length - 5} more`}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        )}

        {/* Items Needing Attention */}
        <Card className="p-6 bg-card border-border">
          <h2 className="text-xl font-semibold text-foreground mb-4">
            {itemType === "printer" ? "Printers" : "Filaments"} Missing Critical Data ({itemsWithIssues.length})
          </h2>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{itemType === "printer" ? "Printer" : "Filament"}</TableHead>
                  <TableHead>{itemType === "printer" ? "Brand" : "Vendor"}</TableHead>
                  <TableHead>Missing Fields</TableHead>
                  <TableHead className="text-right">Issues</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {itemsWithIssues.slice(0, 20).map((item) => (
                  <TableRow key={item.id}>
                    <TableCell>
                      <Link 
                        to={`${detailPath}/${item.id}`} 
                        className="text-primary hover:underline font-medium"
                      >
                        {item.name}
                      </Link>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {item.secondary || "Unknown"}
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {item.missingFields.map((field) => (
                          <Badge key={field} variant="outline" className="text-xs">
                            {field}
                          </Badge>
                        ))}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <Badge variant={item.issueCount >= 3 ? "destructive" : "secondary"}>
                        {item.issueCount}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            {itemsWithIssues.length > 20 && (
              <p className="text-sm text-muted-foreground mt-4 text-center">
                Showing 20 of {itemsWithIssues.length} {itemType}s with issues
              </p>
            )}
          </div>
        </Card>
      </div>
    );
  };

  const renderAccessoriesContent = () => {
    const totalAccessories = (accessoryMetrics.hotends?.total || 0) + 
                             (accessoryMetrics.buildPlates?.total || 0) + 
                             (accessoryMetrics.amsMmu?.total || 0);

    const getCombinedCompleteness = () => {
      const allMetrics = [accessoryMetrics.hotends, accessoryMetrics.buildPlates, accessoryMetrics.amsMmu].filter(Boolean);
      if (allMetrics.length === 0) return 0;
      const totalPercentage = allMetrics.reduce((sum, m) => {
        const avg = m!.fields.reduce((s, f) => s + f.percentage, 0) / m!.fields.length;
        return sum + avg;
      }, 0);
      return Math.round(totalPercentage / allMetrics.length);
    };

    const getCriticalCompleteness = () => {
      const allMetrics = [accessoryMetrics.hotends, accessoryMetrics.buildPlates, accessoryMetrics.amsMmu].filter(Boolean);
      if (allMetrics.length === 0) return 0;
      const totalPercentage = allMetrics.reduce((sum, m) => {
        const criticals = m!.fields.filter(f => f.priority === "critical");
        const avg = criticals.reduce((s, f) => s + f.percentage, 0) / (criticals.length || 1);
        return sum + avg;
      }, 0);
      return Math.round(totalPercentage / allMetrics.length);
    };

    const overallCompleteness = getCombinedCompleteness();
    const criticalCompleteness = getCriticalCompleteness();

    const renderAccessoryTypeCard = (metrics: DataQualityMetrics | null, title: string, detailPath: string) => {
      if (!metrics) return null;
      const avg = Math.round(metrics.fields.reduce((s, f) => s + f.percentage, 0) / metrics.fields.length);
      return (
        <Card className="p-4 bg-card border-border">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-foreground">{title}</h3>
            <Badge variant={avg >= 80 ? "default" : avg >= 60 ? "secondary" : "destructive"}>
              {avg}%
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground mb-3">{metrics.total} items</p>
          <div className="space-y-2">
            {metrics.fields.slice(0, 5).map((field) => (
              <div key={field.name} className="flex items-center gap-2 text-xs">
                <span className="w-24 truncate">{field.label}</span>
                <div className="flex-1 bg-muted rounded-full h-1.5 overflow-hidden">
                  <div
                    className={`h-full ${getProgressColor(field.percentage)}`}
                    style={{ width: `${field.percentage}%` }}
                  />
                </div>
                <span className="w-8 text-right text-muted-foreground">{field.percentage}%</span>
              </div>
            ))}
          </div>
        </Card>
      );
    };

    return (
      <div className="space-y-8">
        {/* Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="p-6 bg-card border-border">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-muted-foreground">Overall Completeness</span>
              {overallCompleteness >= 80 ? (
                <CheckCircle className="w-5 h-5 text-green-500" />
              ) : overallCompleteness >= 60 ? (
                <AlertCircle className="w-5 h-5 text-yellow-500" />
              ) : (
                <XCircle className="w-5 h-5 text-red-500" />
              )}
            </div>
            <p className="text-4xl font-bold text-foreground mb-2">{overallCompleteness}%</p>
            <Progress value={overallCompleteness} className="h-2" />
          </Card>

          <Card className="p-6 bg-card border-border">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-muted-foreground">Critical Fields</span>
              <Badge variant="destructive">Critical</Badge>
            </div>
            <p className="text-4xl font-bold text-foreground mb-2">{criticalCompleteness}%</p>
            <Progress value={criticalCompleteness} className="h-2" />
          </Card>

          <Card className="p-6 bg-card border-border">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-muted-foreground">Accessories with Issues</span>
              <AlertCircle className="w-5 h-5 text-orange-500" />
            </div>
            <p className="text-4xl font-bold text-foreground mb-2">{accessoriesWithIssues.length}</p>
            <p className="text-xs text-muted-foreground">
              {totalAccessories > 0 ? Math.round((accessoriesWithIssues.length / totalAccessories) * 100) : 0}% need attention
            </p>
          </Card>
        </div>

        {/* Accessory Type Breakdown */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {renderAccessoryTypeCard(accessoryMetrics.hotends, "Hotends", "/hotends")}
          {renderAccessoryTypeCard(accessoryMetrics.buildPlates, "Build Plates", "/build-plates")}
          {renderAccessoryTypeCard(accessoryMetrics.amsMmu, "AMS/MMU", "/ams")}
        </div>

        {/* Combined Inconsistencies */}
        {(() => {
          const allInconsistencies = [
            ...(accessoryMetrics.hotends?.inconsistencies?.map(i => ({ ...i, type: "Hotend" })) || []),
            ...(accessoryMetrics.buildPlates?.inconsistencies?.map(i => ({ ...i, type: "Build Plate" })) || []),
            ...(accessoryMetrics.amsMmu?.inconsistencies?.map(i => ({ ...i, type: "AMS/MMU" })) || []),
          ];
          if (allInconsistencies.length === 0) return null;
          return (
            <Card className="p-6 bg-card border-border">
              <h2 className="text-xl font-semibold text-foreground mb-4 flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-orange-500" />
                Data Inconsistencies
              </h2>
              <div className="space-y-3">
                {allInconsistencies.map((issue, idx) => (
                  <div key={idx} className="flex items-start gap-3 p-3 bg-orange-500/10 rounded-lg border border-orange-500/20">
                    <AlertCircle className="w-5 h-5 text-orange-500 mt-0.5" />
                    <div>
                      <p className="font-medium text-foreground">
                        <Badge variant="outline" className="mr-2 text-xs">{issue.type}</Badge>
                        {issue.issue}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {issue.count} item(s): {issue.items.slice(0, 5).join(", ")}
                        {issue.items.length > 5 && ` +${issue.items.length - 5} more`}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          );
        })()}

        {/* Accessories Needing Attention */}
        <Card className="p-6 bg-card border-border">
          <h2 className="text-xl font-semibold text-foreground mb-4">
            Accessories Missing Critical Data ({accessoriesWithIssues.length})
          </h2>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Accessory</TableHead>
                  <TableHead>Brand / Type</TableHead>
                  <TableHead>Missing Fields</TableHead>
                  <TableHead className="text-right">Issues</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {accessoriesWithIssues.slice(0, 20).map((item) => (
                  <TableRow key={item.id}>
                    <TableCell className="font-medium">{item.name}</TableCell>
                    <TableCell className="text-muted-foreground">{item.secondary}</TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {item.missingFields.map((field) => (
                          <Badge key={field} variant="outline" className="text-xs">
                            {field}
                          </Badge>
                        ))}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <Badge variant={item.issueCount >= 3 ? "destructive" : "secondary"}>
                        {item.issueCount}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            {accessoriesWithIssues.length > 20 && (
              <p className="text-sm text-muted-foreground mt-4 text-center">
                Showing 20 of {accessoriesWithIssues.length} accessories with issues
              </p>
            )}
          </div>
        </Card>
      </div>
    );
  };

  if (loading || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-muted-foreground">Loading data quality metrics...</div>
      </div>
    );
  }

  if (!isAdmin) return null;

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center gap-4 mb-8">
          <Button variant="ghost" size="icon" asChild>
            <Link to="/admin/dashboard">
              <ArrowLeft className="w-5 h-5" />
            </Link>
          </Button>
          <div className="flex items-center gap-3">
            <Database className="w-8 h-8 text-primary" />
            <div>
              <h1 className="text-3xl font-bold text-foreground">Data Quality Dashboard</h1>
              <p className="text-muted-foreground">
                {printerMetrics?.total || 0} printers • {filamentMetrics?.total || 0} filaments • {(accessoryMetrics.hotends?.total || 0) + (accessoryMetrics.buildPlates?.total || 0) + (accessoryMetrics.amsMmu?.total || 0)} accessories
              </p>
            </div>
          </div>
          <Button onClick={fetchAllData} variant="outline" className="ml-auto">
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full max-w-lg grid-cols-3">
            <TabsTrigger value="printers" className="flex items-center gap-2">
              <Printer className="w-4 h-4" />
              Printers
            </TabsTrigger>
            <TabsTrigger value="filaments" className="flex items-center gap-2">
              <TestTube className="w-4 h-4" />
              Filaments
            </TabsTrigger>
            <TabsTrigger value="accessories" className="flex items-center gap-2">
              <Wrench className="w-4 h-4" />
              Accessories
            </TabsTrigger>
          </TabsList>

          <TabsContent value="printers">
            {renderMetricsContent(printerMetrics, printersWithIssues, "printer")}
          </TabsContent>

          <TabsContent value="filaments">
            {renderMetricsContent(filamentMetrics, filamentsWithIssues, "filament")}
          </TabsContent>

          <TabsContent value="accessories">
            {renderAccessoriesContent()}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default AdminDataQuality;
