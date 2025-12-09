import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { 
  ArrowLeft, CheckCircle, AlertCircle, XCircle, RefreshCw, 
  ChevronDown, ChevronRight, ExternalLink, Image, DollarSign, 
  Palette, FileText, Link2, Search, TestTube, Loader2, Globe, Wrench
} from "lucide-react";
import { toast } from "sonner";

interface FilamentData {
  id: string;
  product_title: string;
  vendor: string;
  material: string | null;
  variant_price: number | null;
  featured_image: string | null;
  color_hex: string | null;
  color_family: string | null;
  nozzle_temp_min_c: number | null;
  nozzle_temp_max_c: number | null;
  bed_temp_min_c: number | null;
  bed_temp_max_c: number | null;
  tds_url: string | null;
  product_url: string | null;
  amazon_link_us: string | null;
  amazon_link_uk: string | null;
  amazon_link_de: string | null;
  net_weight_g: number | null;
  upc: string | null;
  ean: string | null;
  gtin: string | null;
  variant_sku: string | null;
  mpn: string | null;
  diameter_nominal_mm: number | null;
  density_g_cm3: number | null;
}

interface BrandReport {
  name: string;
  total: number;
  issues: {
    missingImages: number;
    missingPrices: number;
    missingColors: number;
    missingTds: number;
    missingProductUrl: number;
    missingAmazon: number;
    missingTemps: number;
    missingWeight: number;
    missingIdentifiers: number;
    missingMaterial: number;
  };
  score: number;
  filaments: FilamentData[];
  isExpanded: boolean;
}

interface UrlTestResult {
  url: string;
  filamentId: string;
  filamentTitle: string;
  vendor: string;
  status: "pending" | "success" | "error" | "redirect" | "fixing" | "fixed" | "fix-failed";
  statusCode?: number;
  error?: string;
  newUrl?: string;
}

const AdminFilamentAudit = () => {
  const navigate = useNavigate();
  const { isAdmin, loading } = useAuth();
  const [filaments, setFilaments] = useState<FilamentData[]>([]);
  const [brandReports, setBrandReports] = useState<BrandReport[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("overview");
  
  // URL Testing state
  const [isTesting, setIsTesting] = useState(false);
  const [isFixing, setIsFixing] = useState(false);
  const [urlTestResults, setUrlTestResults] = useState<UrlTestResult[]>([]);
  const [testProgress, setTestProgress] = useState(0);
  const [fixProgress, setFixProgress] = useState(0);
  const [selectedBrandForTest, setSelectedBrandForTest] = useState<string | null>(null);

  useEffect(() => {
    if (!loading && !isAdmin) {
      navigate("/");
    }
  }, [isAdmin, loading, navigate]);

  useEffect(() => {
    if (isAdmin) {
      fetchFilamentData();
    }
  }, [isAdmin]);

  const fetchFilamentData = async () => {
    setIsLoading(true);
    const { data, error } = await supabase
      .from("filaments")
      .select(`
        id, product_title, vendor, material, variant_price, featured_image,
        color_hex, color_family, nozzle_temp_min_c, nozzle_temp_max_c,
        bed_temp_min_c, bed_temp_max_c, tds_url, product_url,
        amazon_link_us, amazon_link_uk, amazon_link_de, net_weight_g,
        upc, ean, gtin, variant_sku, mpn, diameter_nominal_mm, density_g_cm3
      `)
      .order("vendor", { ascending: true });

    if (error) {
      toast.error("Failed to load filament data");
      setIsLoading(false);
      return;
    }

    setFilaments(data || []);
    generateBrandReports(data || []);
    setIsLoading(false);
  };

  const generateBrandReports = (data: FilamentData[]) => {
    const brandMap = new Map<string, FilamentData[]>();
    
    data.forEach((f) => {
      const vendor = f.vendor || "Unknown";
      if (!brandMap.has(vendor)) {
        brandMap.set(vendor, []);
      }
      brandMap.get(vendor)!.push(f);
    });

    const reports: BrandReport[] = Array.from(brandMap.entries()).map(([name, filaments]) => {
      const issues = {
        missingImages: filaments.filter((f) => !f.featured_image).length,
        missingPrices: filaments.filter((f) => !f.variant_price).length,
        missingColors: filaments.filter((f) => !f.color_hex).length,
        missingTds: filaments.filter((f) => !f.tds_url || f.tds_url.startsWith("N/A")).length,
        missingProductUrl: filaments.filter((f) => !f.product_url).length,
        missingAmazon: filaments.filter((f) => !f.amazon_link_us && !f.amazon_link_uk && !f.amazon_link_de).length,
        missingTemps: filaments.filter((f) => !f.nozzle_temp_min_c || !f.nozzle_temp_max_c).length,
        missingWeight: filaments.filter((f) => !f.net_weight_g).length,
        missingIdentifiers: filaments.filter((f) => !f.upc && !f.ean && !f.gtin && !f.variant_sku && !f.mpn).length,
        missingMaterial: filaments.filter((f) => !f.material).length,
      };

      // Calculate score (0-100) based on data completeness
      const totalChecks = filaments.length * 10; // 10 categories
      const totalIssues = Object.values(issues).reduce((a, b) => a + b, 0);
      const score = totalChecks > 0 ? Math.round(((totalChecks - totalIssues) / totalChecks) * 100) : 0;

      return {
        name,
        total: filaments.length,
        issues,
        score,
        filaments,
        isExpanded: false,
      };
    });

    // Sort by score (worst first)
    reports.sort((a, b) => a.score - b.score);
    setBrandReports(reports);
  };

  const toggleBrandExpand = (brandName: string) => {
    setBrandReports((prev) =>
      prev.map((r) =>
        r.name === brandName ? { ...r, isExpanded: !r.isExpanded } : r
      )
    );
  };

  const testBrandUrls = async (brand: BrandReport) => {
    setSelectedBrandForTest(brand.name);
    setIsTesting(true);
    setUrlTestResults([]);
    setTestProgress(0);

    const urlsToTest: { url: string; filamentId: string; filamentTitle: string; vendor: string }[] = [];

    brand.filaments.forEach((f) => {
      if (f.product_url && f.product_url.startsWith("http")) {
        urlsToTest.push({ url: f.product_url, filamentId: f.id, filamentTitle: f.product_title, vendor: f.vendor || brand.name });
      }
    });

    if (urlsToTest.length === 0) {
      toast.info("No valid URLs to test for this brand");
      setIsTesting(false);
      return;
    }

    const results: UrlTestResult[] = [];
    const batchSize = 5;
    
    for (let i = 0; i < urlsToTest.length; i += batchSize) {
      const batch = urlsToTest.slice(i, i + batchSize);
      
      const batchResults = await Promise.all(
        batch.map(async ({ url, filamentId, filamentTitle, vendor }) => {
          try {
            const { data, error } = await supabase.functions.invoke("test-url", {
              body: { url },
            });

            if (error) {
              return {
                url,
                filamentId,
                filamentTitle,
                vendor,
                status: "error" as const,
                error: error.message,
              };
            }

            return {
              url,
              filamentId,
              filamentTitle,
              vendor,
              status: data.ok ? "success" as const : (data.statusCode >= 300 && data.statusCode < 400 ? "redirect" as const : "error" as const),
              statusCode: data.statusCode,
              error: data.error,
            };
          } catch (err: any) {
            return {
              url,
              filamentId,
              filamentTitle,
              vendor,
              status: "error" as const,
              error: err.message,
            };
          }
        })
      );

      results.push(...batchResults);
      setUrlTestResults([...results]);
      setTestProgress(Math.round((results.length / urlsToTest.length) * 100));
    }

    setIsTesting(false);
    toast.success(`URL test complete: ${results.filter((r) => r.status === "success").length}/${results.length} OK`);
  };

  const fixBrokenUrl = async (result: UrlTestResult) => {
    // Update the result to show fixing status
    setUrlTestResults((prev) =>
      prev.map((r) =>
        r.filamentId === result.filamentId ? { ...r, status: "fixing" as const } : r
      )
    );

    try {
      const { data, error } = await supabase.functions.invoke("fix-filament-url", {
        body: {
          filamentId: result.filamentId,
          productTitle: result.filamentTitle,
          vendor: result.vendor,
          currentUrl: result.url,
        },
      });

      if (error || !data?.success) {
        setUrlTestResults((prev) =>
          prev.map((r) =>
            r.filamentId === result.filamentId
              ? { ...r, status: "fix-failed" as const, error: data?.error || error?.message || "Failed to fix" }
              : r
          )
        );
        toast.error(`Failed to fix URL: ${data?.error || error?.message}`);
        return;
      }

      setUrlTestResults((prev) =>
        prev.map((r) =>
          r.filamentId === result.filamentId
            ? { ...r, status: "fixed" as const, newUrl: data.newUrl, url: data.newUrl }
            : r
        )
      );
      toast.success(`Fixed URL for ${result.filamentTitle}`);
    } catch (err: any) {
      setUrlTestResults((prev) =>
        prev.map((r) =>
          r.filamentId === result.filamentId
            ? { ...r, status: "fix-failed" as const, error: err.message }
            : r
        )
      );
      toast.error(`Error fixing URL: ${err.message}`);
    }
  };

  const fixAllBrokenUrls = async () => {
    const brokenResults = urlTestResults.filter(
      (r) => r.status === "error" || r.status === "fix-failed"
    );

    if (brokenResults.length === 0) {
      toast.info("No broken URLs to fix");
      return;
    }

    setIsFixing(true);
    setFixProgress(0);

    let fixed = 0;
    let failed = 0;

    for (let i = 0; i < brokenResults.length; i++) {
      await fixBrokenUrl(brokenResults[i]);
      
      // Check the updated status
      const updatedResult = urlTestResults.find((r) => r.filamentId === brokenResults[i].filamentId);
      if (updatedResult?.status === "fixed") {
        fixed++;
      } else {
        failed++;
      }

      setFixProgress(Math.round(((i + 1) / brokenResults.length) * 100));
      
      // Small delay to avoid overwhelming the API
      await new Promise((resolve) => setTimeout(resolve, 500));
    }

    setIsFixing(false);
    toast.success(`URL fix complete: ${fixed} fixed, ${failed} failed`);
  };

  const getScoreColor = (score: number) => {
    if (score >= 90) return "text-green-500";
    if (score >= 70) return "text-yellow-500";
    if (score >= 50) return "text-orange-500";
    return "text-red-500";
  };

  const getScoreBadge = (score: number) => {
    if (score >= 90) return <Badge className="bg-green-500">Excellent</Badge>;
    if (score >= 70) return <Badge className="bg-yellow-500">Good</Badge>;
    if (score >= 50) return <Badge className="bg-orange-500">Needs Work</Badge>;
    return <Badge variant="destructive">Poor</Badge>;
  };

  const filteredBrands = brandReports.filter((b) =>
    b.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Overall stats
  const totalFilaments = filaments.length;
  const totalBrands = brandReports.length;
  const overallScore = brandReports.length > 0
    ? Math.round(brandReports.reduce((a, b) => a + b.score, 0) / brandReports.length)
    : 0;

  const totalMissingImages = brandReports.reduce((a, b) => a + b.issues.missingImages, 0);
  const totalMissingPrices = brandReports.reduce((a, b) => a + b.issues.missingPrices, 0);
  const totalMissingTds = brandReports.reduce((a, b) => a + b.issues.missingTds, 0);
  const totalMissingColors = brandReports.reduce((a, b) => a + b.issues.missingColors, 0);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-muted-foreground">Loading...</div>
      </div>
    );
  }

  if (!isAdmin) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate("/admin/dashboard")}>
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-foreground">Filament Data Audit</h1>
              <p className="text-muted-foreground">Comprehensive data quality analysis by brand</p>
            </div>
          </div>
          <Button onClick={fetchFilamentData} disabled={isLoading}>
            <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : (
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="mb-6">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="brands">Brand Reports</TabsTrigger>
              <TabsTrigger value="url-test">URL Testing</TabsTrigger>
            </TabsList>

            {/* Overview Tab */}
            <TabsContent value="overview">
              <div className="space-y-6">
                {/* Summary Cards */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <Card className="p-6 bg-card border-border">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-muted-foreground">Overall Score</span>
                      {overallScore >= 80 ? (
                        <CheckCircle className="w-5 h-5 text-green-500" />
                      ) : overallScore >= 60 ? (
                        <AlertCircle className="w-5 h-5 text-yellow-500" />
                      ) : (
                        <XCircle className="w-5 h-5 text-red-500" />
                      )}
                    </div>
                    <p className={`text-4xl font-bold ${getScoreColor(overallScore)}`}>{overallScore}%</p>
                    <Progress value={overallScore} className="h-2 mt-2" />
                  </Card>

                  <Card className="p-6 bg-card border-border">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-muted-foreground">Total Filaments</span>
                      <FileText className="w-5 h-5 text-primary" />
                    </div>
                    <p className="text-4xl font-bold text-foreground">{totalFilaments}</p>
                    <p className="text-xs text-muted-foreground mt-1">{totalBrands} brands</p>
                  </Card>

                  <Card className="p-6 bg-card border-border">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-muted-foreground">Missing Images</span>
                      <Image className="w-5 h-5 text-orange-500" />
                    </div>
                    <p className="text-4xl font-bold text-foreground">{totalMissingImages}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {Math.round((totalMissingImages / totalFilaments) * 100)}% incomplete
                    </p>
                  </Card>

                  <Card className="p-6 bg-card border-border">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-muted-foreground">Missing TDS</span>
                      <FileText className="w-5 h-5 text-red-500" />
                    </div>
                    <p className="text-4xl font-bold text-foreground">{totalMissingTds}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {Math.round((totalMissingTds / totalFilaments) * 100)}% incomplete
                    </p>
                  </Card>
                </div>

                {/* Issue Breakdown */}
                <Card className="p-6 bg-card border-border">
                  <h2 className="text-xl font-semibold text-foreground mb-4">Issue Breakdown</h2>
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                    {[
                      { label: "Missing Images", value: totalMissingImages, icon: Image, color: "text-orange-500" },
                      { label: "Missing Prices", value: totalMissingPrices, icon: DollarSign, color: "text-red-500" },
                      { label: "Missing TDS", value: totalMissingTds, icon: FileText, color: "text-purple-500" },
                      { label: "Missing Colors", value: totalMissingColors, icon: Palette, color: "text-cyan-500" },
                      { label: "Missing URLs", value: brandReports.reduce((a, b) => a + b.issues.missingProductUrl, 0), icon: Link2, color: "text-blue-500" },
                    ].map((item) => (
                      <div key={item.label} className="flex items-center gap-3 p-3 bg-muted/30 rounded-lg">
                        <item.icon className={`w-6 h-6 ${item.color}`} />
                        <div>
                          <p className="text-2xl font-bold text-foreground">{item.value}</p>
                          <p className="text-xs text-muted-foreground">{item.label}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </Card>

                {/* Top Issues by Brand */}
                <Card className="p-6 bg-card border-border">
                  <h2 className="text-xl font-semibold text-foreground mb-4">Brands Needing Most Attention</h2>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Brand</TableHead>
                        <TableHead className="text-center">Score</TableHead>
                        <TableHead className="text-center">Total</TableHead>
                        <TableHead className="text-center">Images</TableHead>
                        <TableHead className="text-center">Prices</TableHead>
                        <TableHead className="text-center">TDS</TableHead>
                        <TableHead className="text-center">Colors</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {brandReports.slice(0, 10).map((brand) => (
                        <TableRow key={brand.name}>
                          <TableCell className="font-medium">{brand.name}</TableCell>
                          <TableCell className="text-center">
                            <span className={`font-bold ${getScoreColor(brand.score)}`}>{brand.score}%</span>
                          </TableCell>
                          <TableCell className="text-center">{brand.total}</TableCell>
                          <TableCell className="text-center">
                            <Badge variant={brand.issues.missingImages > 0 ? "destructive" : "secondary"}>
                              {brand.issues.missingImages}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-center">
                            <Badge variant={brand.issues.missingPrices > 0 ? "destructive" : "secondary"}>
                              {brand.issues.missingPrices}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-center">
                            <Badge variant={brand.issues.missingTds > 0 ? "destructive" : "secondary"}>
                              {brand.issues.missingTds}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-center">
                            <Badge variant={brand.issues.missingColors > 0 ? "destructive" : "secondary"}>
                              {brand.issues.missingColors}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </Card>
              </div>
            </TabsContent>

            {/* Brand Reports Tab */}
            <TabsContent value="brands">
              <div className="space-y-4">
                <div className="flex items-center gap-4">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      placeholder="Search brands..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>

                <div className="space-y-3">
                  {filteredBrands.map((brand) => (
                    <Collapsible
                      key={brand.name}
                      open={brand.isExpanded}
                      onOpenChange={() => toggleBrandExpand(brand.name)}
                    >
                      <Card className="bg-card border-border overflow-hidden">
                        <CollapsibleTrigger asChild>
                          <div className="p-4 flex items-center justify-between cursor-pointer hover:bg-muted/30 transition-colors">
                            <div className="flex items-center gap-4">
                              {brand.isExpanded ? (
                                <ChevronDown className="w-5 h-5 text-muted-foreground" />
                              ) : (
                                <ChevronRight className="w-5 h-5 text-muted-foreground" />
                              )}
                              <div>
                                <h3 className="font-semibold text-foreground">{brand.name}</h3>
                                <p className="text-sm text-muted-foreground">{brand.total} filaments</p>
                              </div>
                            </div>
                            <div className="flex items-center gap-4">
                              <div className="flex gap-2">
                                {brand.issues.missingImages > 0 && (
                                  <Badge variant="outline" className="text-xs">
                                    <Image className="w-3 h-3 mr-1" />{brand.issues.missingImages}
                                  </Badge>
                                )}
                                {brand.issues.missingPrices > 0 && (
                                  <Badge variant="outline" className="text-xs">
                                    <DollarSign className="w-3 h-3 mr-1" />{brand.issues.missingPrices}
                                  </Badge>
                                )}
                                {brand.issues.missingTds > 0 && (
                                  <Badge variant="outline" className="text-xs">
                                    <FileText className="w-3 h-3 mr-1" />{brand.issues.missingTds}
                                  </Badge>
                                )}
                              </div>
                              <div className="flex items-center gap-2">
                                <span className={`text-xl font-bold ${getScoreColor(brand.score)}`}>
                                  {brand.score}%
                                </span>
                                {getScoreBadge(brand.score)}
                              </div>
                            </div>
                          </div>
                        </CollapsibleTrigger>
                        <CollapsibleContent>
                          <div className="border-t border-border p-4 bg-muted/10">
                            {/* Issue Summary */}
                            <div className="grid grid-cols-5 gap-3 mb-4">
                              {[
                                { label: "Images", value: brand.issues.missingImages, total: brand.total },
                                { label: "Prices", value: brand.issues.missingPrices, total: brand.total },
                                { label: "TDS", value: brand.issues.missingTds, total: brand.total },
                                { label: "Colors", value: brand.issues.missingColors, total: brand.total },
                                { label: "Temps", value: brand.issues.missingTemps, total: brand.total },
                              ].map((item) => (
                                <div key={item.label} className="text-center p-2 bg-card rounded-lg">
                                  <p className="text-lg font-bold text-foreground">
                                    {item.total - item.value}/{item.total}
                                  </p>
                                  <p className="text-xs text-muted-foreground">{item.label}</p>
                                  <Progress 
                                    value={((item.total - item.value) / item.total) * 100} 
                                    className="h-1 mt-1" 
                                  />
                                </div>
                              ))}
                            </div>

                            {/* Actions */}
                            <div className="flex gap-2 mb-4">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setActiveTab("url-test");
                                  testBrandUrls(brand);
                                }}
                              >
                                <TestTube className="w-4 h-4 mr-2" />
                                Test URLs
                              </Button>
                            </div>

                            {/* Filament List with Issues */}
                            <div className="max-h-96 overflow-y-auto">
                              <Table>
                                <TableHeader>
                                  <TableRow>
                                    <TableHead>Filament</TableHead>
                                    <TableHead className="text-center">Image</TableHead>
                                    <TableHead className="text-center">Price</TableHead>
                                    <TableHead className="text-center">Color</TableHead>
                                    <TableHead className="text-center">TDS</TableHead>
                                    <TableHead className="text-center">URL</TableHead>
                                  </TableRow>
                                </TableHeader>
                                <TableBody>
                                  {brand.filaments
                                    .filter((f) => 
                                      !f.featured_image || !f.variant_price || !f.color_hex || 
                                      !f.tds_url || f.tds_url.startsWith("N/A") || !f.product_url
                                    )
                                    .slice(0, 20)
                                    .map((f) => (
                                      <TableRow key={f.id}>
                                        <TableCell>
                                          <Link
                                            to={`/filament/${f.id}`}
                                            className="text-primary hover:underline text-sm"
                                          >
                                            {f.product_title}
                                          </Link>
                                        </TableCell>
                                        <TableCell className="text-center">
                                          {f.featured_image ? (
                                            <CheckCircle className="w-4 h-4 text-green-500 mx-auto" />
                                          ) : (
                                            <XCircle className="w-4 h-4 text-red-500 mx-auto" />
                                          )}
                                        </TableCell>
                                        <TableCell className="text-center">
                                          {f.variant_price ? (
                                            <CheckCircle className="w-4 h-4 text-green-500 mx-auto" />
                                          ) : (
                                            <XCircle className="w-4 h-4 text-red-500 mx-auto" />
                                          )}
                                        </TableCell>
                                        <TableCell className="text-center">
                                          {f.color_hex ? (
                                            <div 
                                              className="w-4 h-4 rounded-full mx-auto border border-border"
                                              style={{ backgroundColor: f.color_hex }}
                                            />
                                          ) : (
                                            <XCircle className="w-4 h-4 text-red-500 mx-auto" />
                                          )}
                                        </TableCell>
                                        <TableCell className="text-center">
                                          {f.tds_url && !f.tds_url.startsWith("N/A") ? (
                                            <CheckCircle className="w-4 h-4 text-green-500 mx-auto" />
                                          ) : (
                                            <XCircle className="w-4 h-4 text-red-500 mx-auto" />
                                          )}
                                        </TableCell>
                                        <TableCell className="text-center">
                                          {f.product_url ? (
                                            <a href={f.product_url} target="_blank" rel="noopener noreferrer">
                                              <ExternalLink className="w-4 h-4 text-primary mx-auto" />
                                            </a>
                                          ) : (
                                            <XCircle className="w-4 h-4 text-red-500 mx-auto" />
                                          )}
                                        </TableCell>
                                      </TableRow>
                                    ))}
                                </TableBody>
                              </Table>
                              {brand.filaments.filter((f) => 
                                !f.featured_image || !f.variant_price || !f.color_hex || 
                                !f.tds_url || f.tds_url.startsWith("N/A") || !f.product_url
                              ).length > 20 && (
                                <p className="text-xs text-muted-foreground text-center mt-2">
                                  Showing 20 of {brand.filaments.filter((f) => 
                                    !f.featured_image || !f.variant_price || !f.color_hex || 
                                    !f.tds_url || f.tds_url.startsWith("N/A") || !f.product_url
                                  ).length} filaments with issues
                                </p>
                              )}
                            </div>
                          </div>
                        </CollapsibleContent>
                      </Card>
                    </Collapsible>
                  ))}
                </div>
              </div>
            </TabsContent>

            {/* URL Testing Tab */}
            <TabsContent value="url-test">
              <div className="space-y-6">
                <Card className="p-6 bg-card border-border">
                  <h2 className="text-xl font-semibold text-foreground mb-4">URL Testing</h2>
                  <p className="text-muted-foreground mb-4">
                    Select a brand from the Brand Reports tab and click "Test URLs" to check for broken links.
                  </p>

                  {isTesting && (
                    <div className="mb-6">
                      <div className="flex items-center gap-4 mb-2">
                        <Loader2 className="w-5 h-5 animate-spin text-primary" />
                        <span className="text-foreground">
                          Testing URLs for {selectedBrandForTest}...
                        </span>
                      </div>
                      <Progress value={testProgress} className="h-2" />
                      <p className="text-sm text-muted-foreground mt-1">
                        {urlTestResults.length} URLs tested
                      </p>
                    </div>
                  )}

                  {isFixing && (
                    <div className="mb-6">
                      <div className="flex items-center gap-4 mb-2">
                        <Wrench className="w-5 h-5 animate-pulse text-primary" />
                        <span className="text-foreground">
                          Fixing broken URLs...
                        </span>
                      </div>
                      <Progress value={fixProgress} className="h-2" />
                    </div>
                  )}

                  {urlTestResults.length > 0 && (
                    <div>
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex gap-4">
                          <Badge className="bg-green-500">
                            {urlTestResults.filter((r) => r.status === "success" || r.status === "fixed").length} OK
                          </Badge>
                          <Badge variant="destructive">
                            {urlTestResults.filter((r) => r.status === "error" || r.status === "fix-failed").length} Failed
                          </Badge>
                          <Badge className="bg-yellow-500">
                            {urlTestResults.filter((r) => r.status === "redirect").length} Redirects
                          </Badge>
                          {urlTestResults.filter((r) => r.status === "fixed").length > 0 && (
                            <Badge className="bg-cyan-500">
                              {urlTestResults.filter((r) => r.status === "fixed").length} Fixed
                            </Badge>
                          )}
                        </div>
                        
                        {/* Fix All Button */}
                        {urlTestResults.filter((r) => r.status === "error" || r.status === "fix-failed").length > 0 && !isTesting && !isFixing && (
                          <Button onClick={fixAllBrokenUrls} variant="default" size="sm">
                            <Wrench className="w-4 h-4 mr-2" />
                            Fix All Broken URLs ({urlTestResults.filter((r) => r.status === "error" || r.status === "fix-failed").length})
                          </Button>
                        )}
                      </div>

                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Status</TableHead>
                            <TableHead>Filament</TableHead>
                            <TableHead>URL</TableHead>
                            <TableHead>Details</TableHead>
                            <TableHead>Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {urlTestResults
                            .filter((r) => r.status !== "success")
                            .slice(0, 50)
                            .map((result) => (
                              <TableRow key={result.filamentId}>
                                <TableCell>
                                  {result.status === "success" && (
                                    <CheckCircle className="w-5 h-5 text-green-500" />
                                  )}
                                  {result.status === "error" && (
                                    <XCircle className="w-5 h-5 text-red-500" />
                                  )}
                                  {result.status === "redirect" && (
                                    <AlertCircle className="w-5 h-5 text-yellow-500" />
                                  )}
                                  {result.status === "fixing" && (
                                    <Loader2 className="w-5 h-5 animate-spin text-primary" />
                                  )}
                                  {result.status === "fixed" && (
                                    <CheckCircle className="w-5 h-5 text-cyan-500" />
                                  )}
                                  {result.status === "fix-failed" && (
                                    <XCircle className="w-5 h-5 text-orange-500" />
                                  )}
                                </TableCell>
                                <TableCell>
                                  <Link
                                    to={`/filament/${result.filamentId}`}
                                    className="text-primary hover:underline text-sm"
                                  >
                                    {result.filamentTitle}
                                  </Link>
                                </TableCell>
                                <TableCell className="max-w-xs">
                                  {result.status === "fixed" && result.newUrl ? (
                                    <div className="space-y-1">
                                      <div className="text-xs text-muted-foreground line-through truncate">
                                        {result.url !== result.newUrl ? result.url : null}
                                      </div>
                                      <a
                                        href={result.newUrl}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-cyan-500 hover:text-cyan-400 text-sm truncate block"
                                      >
                                        {result.newUrl}
                                      </a>
                                    </div>
                                  ) : (
                                    <a
                                      href={result.url}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="text-muted-foreground hover:text-foreground text-sm truncate block"
                                    >
                                      {result.url}
                                    </a>
                                  )}
                                </TableCell>
                                <TableCell>
                                  <span className="text-sm text-muted-foreground">
                                    {result.status === "fixed" && "URL fixed!"}
                                    {result.status === "fixing" && "Finding correct URL..."}
                                    {result.status === "fix-failed" && `Fix failed: ${result.error}`}
                                    {(result.status === "error" || result.status === "redirect") && (
                                      <>
                                        {result.statusCode && `HTTP ${result.statusCode}`}
                                        {result.error && ` - ${result.error}`}
                                      </>
                                    )}
                                  </span>
                                </TableCell>
                                <TableCell>
                                  {(result.status === "error" || result.status === "fix-failed") && !isFixing && (
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      onClick={() => fixBrokenUrl(result)}
                                    >
                                      <Wrench className="w-3 h-3 mr-1" />
                                      Fix
                                    </Button>
                                  )}
                                  {result.status === "fixing" && (
                                    <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
                                  )}
                                  {result.status === "fixed" && (
                                    <Badge className="bg-cyan-500/20 text-cyan-400 border-cyan-500/30">
                                      Fixed
                                    </Badge>
                                  )}
                                </TableCell>
                              </TableRow>
                            ))}
                        </TableBody>
                      </Table>
                      
                      {urlTestResults.filter((r) => r.status !== "success").length > 50 && (
                        <p className="text-xs text-muted-foreground text-center mt-4">
                          Showing 50 of {urlTestResults.filter((r) => r.status !== "success").length} results with issues
                        </p>
                      )}
                    </div>
                  )}

                  {!isTesting && urlTestResults.length === 0 && (
                    <div className="text-center py-12 text-muted-foreground">
                      <Globe className="w-12 h-12 mx-auto mb-4 opacity-50" />
                      <p>No URL tests run yet. Select a brand and click "Test URLs" to begin.</p>
                    </div>
                  )}
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        )}
      </div>
    </div>
  );
};

export default AdminFilamentAudit;
