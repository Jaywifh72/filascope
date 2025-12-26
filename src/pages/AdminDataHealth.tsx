import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  ArrowLeft, CheckCircle, AlertCircle, XCircle, RefreshCw, 
  Database, Printer, DollarSign, Loader2, Image, Thermometer,
  FileText, Link2, Copy, BarChart3
} from "lucide-react";
import { toast } from "sonner";

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

const AdminDataHealth = () => {
  const navigate = useNavigate();
  const { isAdmin, loading } = useAuth();
  const [activeTab, setActiveTab] = useState("overview");
  const [printerMetrics, setPrinterMetrics] = useState<DataQualityMetrics | null>(null);
  const [filamentMetrics, setFilamentMetrics] = useState<DataQualityMetrics | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRunningAudit, setIsRunningAudit] = useState(false);

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
    await Promise.all([fetchPrinterData(), fetchFilamentData()]);
    setIsLoading(false);
  };

  const fetchPrinterData = async () => {
    const { data: printers, error } = await supabase
      .from("printers")
      .select("id, model_name, msrp_usd, current_price_usd_store, build_volume_x_mm, build_volume_y_mm, build_volume_z_mm, max_nozzle_temp_c, bed_max_temp_c, official_product_url, scraped_data, printer_brands(brand)");

    if (error || !printers) return;

    const total = printers.length;
    const fieldChecks = [
      { name: "msrp_usd", label: "MSRP Price", priority: "critical" as const },
      { name: "current_price_usd_store", label: "Store Price", priority: "critical" as const },
      { name: "build_volume", label: "Build Volume", priority: "critical" as const },
      { name: "max_nozzle_temp_c", label: "Max Nozzle Temp", priority: "critical" as const },
      { name: "bed_max_temp_c", label: "Max Bed Temp", priority: "critical" as const },
      { name: "official_product_url", label: "Product URL", priority: "important" as const },
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

    setPrinterMetrics({ total, fields, inconsistencies: [] });
  };

  const fetchFilamentData = async () => {
    const { data: filaments, error } = await supabase
      .from("filaments")
      .select("id, product_title, vendor, material, variant_price, featured_image, nozzle_temp_min_c, nozzle_temp_max_c, bed_temp_min_c, bed_temp_max_c, color_hex, product_url, tds_url");

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
      { name: "product_url", label: "Product URL", priority: "important" as const },
      { name: "tds_url", label: "TDS URL", priority: "nice-to-have" as const },
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

    setFilamentMetrics({ total, fields, inconsistencies: [] });
  };

  const runFilamentAudit = async () => {
    setIsRunningAudit(true);
    try {
      const { data, error } = await supabase.functions.invoke('audit-filament-data');
      if (error) throw error;
      toast.success(`Audit complete: ${data.issues_found} issues found`);
    } catch (error) {
      toast.error('Failed to run audit');
    } finally {
      setIsRunningAudit(false);
    }
  };

  const getProgressColor = (percentage: number) => {
    if (percentage >= 90) return "bg-green-500";
    if (percentage >= 70) return "bg-yellow-500";
    return "bg-red-500";
  };

  const getOverallScore = (metrics: DataQualityMetrics | null) => {
    if (!metrics) return 0;
    const criticalFields = metrics.fields.filter(f => f.priority === "critical");
    const avgPercentage = criticalFields.reduce((sum, f) => sum + f.percentage, 0) / criticalFields.length;
    return Math.round(avgPercentage);
  };

  if (loading || isLoading) {
    return <div className="min-h-screen flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin" /></div>;
  }

  if (!isAdmin) return null;

  const filamentScore = getOverallScore(filamentMetrics);
  const printerScore = getOverallScore(printerMetrics);
  const overallScore = Math.round((filamentScore + printerScore) / 2);

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link to="/admin">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <BarChart3 className="w-8 h-8 text-primary" />
              Data Health
            </h1>
            <p className="text-muted-foreground">Monitor data completeness and quality across all entities</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button onClick={fetchAllData} variant="outline" size="sm">
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
          <Button onClick={runFilamentAudit} disabled={isRunningAudit} size="sm">
            {isRunningAudit ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <CheckCircle className="w-4 h-4 mr-2" />}
            Run Audit
          </Button>
        </div>
      </div>

      {/* Overall Health Score */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <span className="text-sm font-medium text-muted-foreground">Overall Health</span>
            <Badge variant={overallScore >= 80 ? "default" : overallScore >= 60 ? "secondary" : "destructive"}>
              {overallScore}%
            </Badge>
          </div>
          <Progress value={overallScore} className="h-3" />
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <span className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Database className="w-4 h-4" /> Filaments ({filamentMetrics?.total || 0})
            </span>
            <Badge variant={filamentScore >= 80 ? "default" : "secondary"}>{filamentScore}%</Badge>
          </div>
          <Progress value={filamentScore} className="h-3" />
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <span className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Printer className="w-4 h-4" /> Printers ({printerMetrics?.total || 0})
            </span>
            <Badge variant={printerScore >= 80 ? "default" : "secondary"}>{printerScore}%</Badge>
          </div>
          <Progress value={printerScore} className="h-3" />
        </Card>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3 max-w-md">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="filaments">Filaments</TabsTrigger>
          <TabsTrigger value="printers">Printers</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="mt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Quick Links */}
            <Card>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-2 gap-3">
                <Link to="/admin/broken-links">
                  <Button variant="outline" className="w-full justify-start">
                    <Link2 className="w-4 h-4 mr-2" />
                    Broken Links
                  </Button>
                </Link>
                <Link to="/admin/duplicates">
                  <Button variant="outline" className="w-full justify-start">
                    <Copy className="w-4 h-4 mr-2" />
                    Duplicates
                  </Button>
                </Link>
                <Link to="/admin/price-anomalies">
                  <Button variant="outline" className="w-full justify-start">
                    <DollarSign className="w-4 h-4 mr-2" />
                    Price Anomalies
                  </Button>
                </Link>
                <Link to="/admin/filament-audit">
                  <Button variant="outline" className="w-full justify-start">
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Full Audit
                  </Button>
                </Link>
              </CardContent>
            </Card>

            {/* Critical Fields Summary */}
            <Card>
              <CardHeader>
                <CardTitle>Critical Fields Coverage</CardTitle>
                <CardDescription>Fields that must be populated for data quality</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {filamentMetrics?.fields.filter(f => f.priority === "critical").map(field => (
                  <div key={field.name} className="flex items-center justify-between">
                    <span className="text-sm">{field.label}</span>
                    <div className="flex items-center gap-2">
                      <Progress value={field.percentage} className="w-24 h-2" />
                      <span className="text-sm text-muted-foreground w-12 text-right">{field.percentage}%</span>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="filaments" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Filament Data Completeness</CardTitle>
              <CardDescription>{filamentMetrics?.total || 0} total filaments</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {filamentMetrics?.fields.map(field => (
                <div key={field.name} className="flex items-center gap-4">
                  <div className="w-40">
                    <span className="text-sm font-medium">{field.label}</span>
                    <Badge variant="outline" className="ml-2 text-xs">{field.priority}</Badge>
                  </div>
                  <div className="flex-1">
                    <Progress value={field.percentage} className={`h-3 ${getProgressColor(field.percentage)}`} />
                  </div>
                  <div className="w-20 text-right">
                    <span className="text-sm text-muted-foreground">{field.filled}/{filamentMetrics.total}</span>
                  </div>
                  <div className="w-16 text-right">
                    <span className={`text-sm font-medium ${field.percentage >= 90 ? 'text-green-500' : field.percentage >= 70 ? 'text-yellow-500' : 'text-red-500'}`}>
                      {field.percentage}%
                    </span>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="printers" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Printer Data Completeness</CardTitle>
              <CardDescription>{printerMetrics?.total || 0} total printers</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {printerMetrics?.fields.map(field => (
                <div key={field.name} className="flex items-center gap-4">
                  <div className="w-40">
                    <span className="text-sm font-medium">{field.label}</span>
                    <Badge variant="outline" className="ml-2 text-xs">{field.priority}</Badge>
                  </div>
                  <div className="flex-1">
                    <Progress value={field.percentage} className={`h-3 ${getProgressColor(field.percentage)}`} />
                  </div>
                  <div className="w-20 text-right">
                    <span className="text-sm text-muted-foreground">{field.filled}/{printerMetrics.total}</span>
                  </div>
                  <div className="w-16 text-right">
                    <span className={`text-sm font-medium ${field.percentage >= 90 ? 'text-green-500' : field.percentage >= 70 ? 'text-yellow-500' : 'text-red-500'}`}>
                      {field.percentage}%
                    </span>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdminDataHealth;
