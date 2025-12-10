import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { 
  ArrowLeft, 
  Search, 
  Globe, 
  Package, 
  CheckCircle2, 
  Loader2, 
  Upload,
  AlertTriangle,
  Image as ImageIcon,
  DollarSign,
  Ruler,
  FileText,
  Tag,
  Thermometer,
  Sparkles
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { normalizeColorHex } from "@/lib/utils";

interface DiscoveredProduct {
  product_id: string;
  product_title: string;
  product_handle: string;
  product_url: string;
  vendor: string;
  material: string | null;
  color_name: string | null;
  color_hex: string | null;
  color_family: string | null;
  featured_image: string | null;
  variant_sku: string | null;
  variant_price: number | null;
  net_weight_g: number | null;
  diameter_nominal_mm: number | null;
  tds_url: string | null;
  upc: string | null;
  ean: string | null;
  gtin: string | null;
  mpn: string | null;
  nozzle_temp_min_c: number | null;
  nozzle_temp_max_c: number | null;
  bed_temp_min_c: number | null;
  bed_temp_max_c: number | null;
  is_nozzle_abrasive: boolean | null;
  data_completeness: number;
  existing_id: string | null;
  raw_data: any;
  selected?: boolean;
  tds_parsed?: boolean;
  tds_parsing?: boolean;
}

interface DiscoveryResult {
  platform: 'shopify' | 'woocommerce' | 'custom' | 'unknown';
  brand_name: string;
  website_url: string;
  products: DiscoveredProduct[];
  total_found: number;
  errors: string[];
}

interface TDSParseResult {
  product_id: string;
  success: boolean;
  fields_extracted?: number;
  error?: string;
}

interface DatabaseFilament {
  id: string;
  product_title: string;
  vendor: string | null;
  product_url: string | null;
  tds_url: string | null;
  nozzle_temp_min_c: number | null;
  nozzle_temp_max_c: number | null;
  bed_temp_min_c: number | null;
  bed_temp_max_c: number | null;
  featured_image: string | null;
  material: string | null;
  selected?: boolean;
  parsing?: boolean;
  parsed?: boolean;
}

const AdminImport = () => {
  const [brandName, setBrandName] = useState("");
  const [websiteUrl, setWebsiteUrl] = useState("");
  const [isDiscovering, setIsDiscovering] = useState(false);
  const [discoveryResult, setDiscoveryResult] = useState<DiscoveryResult | null>(null);
  const [products, setProducts] = useState<DiscoveredProduct[]>([]);
  const [isImporting, setIsImporting] = useState(false);
  const [importProgress, setImportProgress] = useState({ current: 0, total: 0 });
  const [importResults, setImportResults] = useState<{ success: number; updated: number; errors: string[] } | null>(null);
  const [isParsingTDS, setIsParsingTDS] = useState(false);
  const [tdsProgress, setTdsProgress] = useState({ current: 0, total: 0 });
  const [tdsResults, setTdsResults] = useState<TDSParseResult[]>([]);
  
  // Batch TDS parsing state for existing filaments
  const [batchBrandFilter, setBatchBrandFilter] = useState("");
  const [batchVendors, setBatchVendors] = useState<string[]>([]);
  const [batchFilaments, setBatchFilaments] = useState<DatabaseFilament[]>([]);
  const [isFetchingBatch, setIsFetchingBatch] = useState(false);
  const [isBatchParsing, setIsBatchParsing] = useState(false);
  const [batchProgress, setBatchProgress] = useState({ current: 0, total: 0 });
  const [batchResults, setBatchResults] = useState<TDSParseResult[]>([]);
  
  const { isAdmin, loading } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  // Fetch vendors for dropdown
  useEffect(() => {
    const fetchVendors = async () => {
      const { data } = await supabase
        .from('filaments')
        .select('vendor')
        .not('vendor', 'is', null);
      
      if (data) {
        const uniqueVendors = [...new Set(data.map(f => f.vendor).filter(Boolean))] as string[];
        setBatchVendors(uniqueVendors.sort());
      }
    };
    fetchVendors();
  }, []);

  useEffect(() => {
    if (!loading && !isAdmin) {
      toast({
        title: "Access Denied",
        description: "You must be an admin to access this page",
        variant: "destructive",
      });
      navigate("/");
    }
  }, [isAdmin, loading, navigate, toast]);

  const handleDiscover = async () => {
    if (!brandName.trim() || !websiteUrl.trim()) {
      toast({
        title: "Missing Information",
        description: "Please provide both brand name and website URL",
        variant: "destructive",
      });
      return;
    }

    // Normalize URL
    let normalizedUrl = websiteUrl.trim();
    if (!normalizedUrl.startsWith('http://') && !normalizedUrl.startsWith('https://')) {
      normalizedUrl = `https://${normalizedUrl}`;
    }

    setIsDiscovering(true);
    setDiscoveryResult(null);
    setProducts([]);
    setImportResults(null);

    try {
      const { data, error } = await supabase.functions.invoke('discover-filament-brand', {
        body: { brand_name: brandName.trim(), website_url: normalizedUrl }
      });

      if (error) throw error;

      setDiscoveryResult(data);
      setProducts(data.products.map((p: DiscoveredProduct) => ({ ...p, selected: true })));

      toast({
        title: "Discovery Complete",
        description: `Found ${data.total_found} filament products on ${data.platform} platform`,
      });

    } catch (error) {
      console.error('Discovery error:', error);
      toast({
        title: "Discovery Failed",
        description: error instanceof Error ? error.message : "Failed to discover products",
        variant: "destructive",
      });
    } finally {
      setIsDiscovering(false);
    }
  };

  const toggleProduct = (productId: string) => {
    setProducts(prev => prev.map(p => 
      p.product_id === productId ? { ...p, selected: !p.selected } : p
    ));
  };

  const toggleAll = (selected: boolean) => {
    setProducts(prev => prev.map(p => ({ ...p, selected })));
  };

  const handleImport = async () => {
    const selectedProducts = products.filter(p => p.selected);
    if (selectedProducts.length === 0) {
      toast({
        title: "No Products Selected",
        description: "Please select at least one product to import",
        variant: "destructive",
      });
      return;
    }

    setIsImporting(true);
    setImportProgress({ current: 0, total: selectedProducts.length });
    
    const results = { success: 0, updated: 0, errors: [] as string[] };

    for (let i = 0; i < selectedProducts.length; i++) {
      const product = selectedProducts[i];
      setImportProgress({ current: i + 1, total: selectedProducts.length });

      try {
        const filamentData = {
          product_id: product.product_id,
          product_title: product.product_title,
          product_handle: product.product_handle,
          product_url: product.product_url,
          vendor: product.vendor,
          material: product.material,
          color_hex: product.color_hex,
          color_family: product.color_family,
          featured_image: product.featured_image,
          variant_sku: product.variant_sku,
          variant_price: product.variant_price,
          net_weight_g: product.net_weight_g,
          diameter_nominal_mm: product.diameter_nominal_mm,
          tds_url: product.tds_url,
          upc: product.upc,
          ean: product.ean,
          gtin: product.gtin,
          mpn: product.mpn,
          nozzle_temp_min_c: product.nozzle_temp_min_c,
          nozzle_temp_max_c: product.nozzle_temp_max_c,
          bed_temp_min_c: product.bed_temp_min_c,
          bed_temp_max_c: product.bed_temp_max_c,
          is_nozzle_abrasive: product.is_nozzle_abrasive,
        };

        if (product.existing_id) {
          // Update existing
          const { error } = await supabase
            .from('filaments')
            .update(filamentData)
            .eq('id', product.existing_id);
          
          if (error) throw error;
          results.updated++;
        } else {
          // Insert new
          const { error } = await supabase
            .from('filaments')
            .insert(filamentData);
          
          if (error) throw error;
          results.success++;
        }
      } catch (error) {
        results.errors.push(`${product.product_title}: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }

    setImportResults(results);
    setIsImporting(false);

    toast({
      title: "Import Complete",
      description: `Created ${results.success}, Updated ${results.updated}, Errors: ${results.errors.length}`,
    });
  };

  const handleParseTDS = async () => {
    const selectedProducts = products.filter(p => p.selected);
    if (selectedProducts.length === 0) {
      toast({
        title: "No Products Selected",
        description: "Please select at least one product to parse TDS",
        variant: "destructive",
      });
      return;
    }

    setIsParsingTDS(true);
    setTdsProgress({ current: 0, total: selectedProducts.length });
    setTdsResults([]);
    
    const results: TDSParseResult[] = [];

    for (let i = 0; i < selectedProducts.length; i++) {
      const product = selectedProducts[i];
      setTdsProgress({ current: i + 1, total: selectedProducts.length });
      
      // Mark product as parsing
      setProducts(prev => prev.map(p => 
        p.product_id === product.product_id ? { ...p, tds_parsing: true } : p
      ));

      try {
        const { data, error } = await supabase.functions.invoke('parse-filament-tds', {
          body: { 
            tds_url: product.tds_url,
            product_url: product.product_url,
            filament_id: product.existing_id // Only update if already in DB
          }
        });

        if (error) throw error;

        if (data.success) {
          // Update product with extracted data
          setProducts(prev => prev.map(p => {
            if (p.product_id === product.product_id) {
              return {
                ...p,
                tds_url: data.tds_url || p.tds_url,
                nozzle_temp_min_c: data.data?.nozzle_temp_min_c ?? p.nozzle_temp_min_c,
                nozzle_temp_max_c: data.data?.nozzle_temp_max_c ?? p.nozzle_temp_max_c,
                bed_temp_min_c: data.data?.bed_temp_min_c ?? p.bed_temp_min_c,
                bed_temp_max_c: data.data?.bed_temp_max_c ?? p.bed_temp_max_c,
                is_nozzle_abrasive: data.data?.is_nozzle_abrasive ?? p.is_nozzle_abrasive,
                tds_parsed: true,
                tds_parsing: false,
                data_completeness: Math.min(100, p.data_completeness + (data.fields_extracted || 0) * 5),
              };
            }
            return p;
          }));
          
          results.push({
            product_id: product.product_id,
            success: true,
            fields_extracted: data.fields_extracted,
          });
        } else {
          setProducts(prev => prev.map(p => 
            p.product_id === product.product_id ? { ...p, tds_parsing: false } : p
          ));
          results.push({
            product_id: product.product_id,
            success: false,
            error: data.error,
          });
        }
      } catch (error) {
        setProducts(prev => prev.map(p => 
          p.product_id === product.product_id ? { ...p, tds_parsing: false } : p
        ));
        results.push({
          product_id: product.product_id,
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
      
      // Small delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 500));
    }

    setTdsResults(results);
    setIsParsingTDS(false);

    const successCount = results.filter(r => r.success).length;
    const totalFields = results.reduce((sum, r) => sum + (r.fields_extracted || 0), 0);
    
    toast({
      title: "TDS Parsing Complete",
      description: `Parsed ${successCount}/${results.length} products, extracted ${totalFields} total fields`,
    });
  };

  const getCompletenessColor = (percentage: number) => {
    if (percentage >= 80) return 'text-green-500';
    if (percentage >= 50) return 'text-yellow-500';
    return 'text-red-500';
  };

  // Fetch filaments missing print settings
  const handleFetchBatchFilaments = async () => {
    setIsFetchingBatch(true);
    setBatchFilaments([]);
    setBatchResults([]);

    try {
      let query = supabase
        .from('filaments')
        .select('id, product_title, vendor, product_url, tds_url, nozzle_temp_min_c, nozzle_temp_max_c, bed_temp_min_c, bed_temp_max_c, featured_image, material')
        .is('nozzle_temp_max_c', null);

      if (batchBrandFilter) {
        query = query.eq('vendor', batchBrandFilter);
      }

      const { data, error } = await query.order('vendor').limit(200);

      if (error) throw error;

      setBatchFilaments((data || []).map(f => ({ ...f, selected: true })));
      
      toast({
        title: "Filaments Loaded",
        description: `Found ${data?.length || 0} filaments missing print settings`,
      });
    } catch (error) {
      console.error('Error fetching filaments:', error);
      toast({
        title: "Error",
        description: "Failed to fetch filaments",
        variant: "destructive",
      });
    } finally {
      setIsFetchingBatch(false);
    }
  };

  // Batch parse TDS for existing filaments
  const handleBatchParseTDS = async () => {
    const selectedFilaments = batchFilaments.filter(f => f.selected);
    if (selectedFilaments.length === 0) return;

    setIsBatchParsing(true);
    setBatchProgress({ current: 0, total: selectedFilaments.length });
    setBatchResults([]);

    const results: TDSParseResult[] = [];

    for (let i = 0; i < selectedFilaments.length; i++) {
      const filament = selectedFilaments[i];
      setBatchProgress({ current: i + 1, total: selectedFilaments.length });

      // Mark as parsing
      setBatchFilaments(prev => prev.map(f => 
        f.id === filament.id ? { ...f, parsing: true } : f
      ));

      try {
        const { data, error } = await supabase.functions.invoke('parse-filament-tds', {
          body: { 
            tds_url: filament.tds_url,
            product_url: filament.product_url,
            filament_id: filament.id
          }
        });

        if (error) throw error;

        setBatchFilaments(prev => prev.map(f => 
          f.id === filament.id ? { ...f, parsing: false, parsed: data.success } : f
        ));

        results.push({
          product_id: filament.id,
          success: data.success,
          fields_extracted: data.fields_extracted,
          error: data.error,
        });
      } catch (error) {
        setBatchFilaments(prev => prev.map(f => 
          f.id === filament.id ? { ...f, parsing: false } : f
        ));
        results.push({
          product_id: filament.id,
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }

      // Rate limiting delay
      await new Promise(resolve => setTimeout(resolve, 500));
    }

    setBatchResults(results);
    setIsBatchParsing(false);

    const successCount = results.filter(r => r.success).length;
    const totalFields = results.reduce((sum, r) => sum + (r.fields_extracted || 0), 0);

    toast({
      title: "Batch Parsing Complete",
      description: `Parsed ${successCount}/${results.length} filaments, extracted ${totalFields} fields`,
    });
  };

  const selectedCount = products.filter(p => p.selected).length;
  const newCount = products.filter(p => p.selected && !p.existing_id).length;
  const updateCount = products.filter(p => p.selected && p.existing_id).length;
  const parsedCount = products.filter(p => p.tds_parsed).length;
  const avgCompleteness = products.length > 0 
    ? Math.round(products.reduce((sum, p) => sum + p.data_completeness, 0) / products.length)
    : 0;

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Link to="/admin">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold">Brand Discovery & Import</h1>
            <p className="text-muted-foreground">
              Automatically discover and import filament products from any brand website
            </p>
          </div>
        </div>

        {/* Discovery Form */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Search className="h-5 w-5" />
              Discover Brand Products
            </CardTitle>
            <CardDescription>
              Enter the brand name and their website URL. The system will automatically detect the platform and scrape all filament products.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="brand-name">Brand Name</Label>
                <Input
                  id="brand-name"
                  placeholder="e.g., Polymaker, eSUN, Eryone"
                  value={brandName}
                  onChange={(e) => setBrandName(e.target.value)}
                  disabled={isDiscovering}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="website-url">Website URL</Label>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Globe className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="website-url"
                      placeholder="e.g., polymaker.com or https://www.esun3d.com"
                      value={websiteUrl}
                      onChange={(e) => setWebsiteUrl(e.target.value)}
                      disabled={isDiscovering}
                      className="pl-10"
                    />
                  </div>
                  <Button 
                    onClick={handleDiscover} 
                    disabled={isDiscovering || !brandName || !websiteUrl}
                  >
                    {isDiscovering ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Discovering...
                      </>
                    ) : (
                      <>
                        <Search className="mr-2 h-4 w-4" />
                        Discover
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </div>

            {/* Platform Detection Result */}
            {discoveryResult && (
              <div className="flex items-center gap-4 p-3 bg-muted rounded-lg">
                <Badge variant="secondary" className="font-mono">
                  {discoveryResult.platform.toUpperCase()}
                </Badge>
                <span className="text-sm text-muted-foreground">
                  Platform detected • {discoveryResult.total_found} products found
                </span>
                {discoveryResult.errors.length > 0 && (
                  <Badge variant="destructive">
                    {discoveryResult.errors.length} errors
                  </Badge>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Results */}
        {products.length > 0 && (
          <>
            {/* Summary Stats */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              <Card>
                <CardContent className="pt-6">
                  <div className="text-2xl font-bold">{products.length}</div>
                  <p className="text-sm text-muted-foreground">Total Found</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <div className="text-2xl font-bold text-green-500">{selectedCount}</div>
                  <p className="text-sm text-muted-foreground">Selected</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <div className="text-2xl font-bold text-blue-500">{newCount}</div>
                  <p className="text-sm text-muted-foreground">New Products</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <div className="text-2xl font-bold text-yellow-500">{updateCount}</div>
                  <p className="text-sm text-muted-foreground">Updates</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <div className={`text-2xl font-bold ${getCompletenessColor(avgCompleteness)}`}>
                    {avgCompleteness}%
                  </div>
                  <p className="text-sm text-muted-foreground">Avg Completeness</p>
                </CardContent>
              </Card>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" onClick={() => toggleAll(true)}>
                  Select All
                </Button>
                <Button variant="outline" size="sm" onClick={() => toggleAll(false)}>
                  Deselect All
                </Button>
              </div>
              <div className="flex items-center gap-2">
                <Button 
                  variant="secondary"
                  onClick={handleParseTDS} 
                  disabled={isParsingTDS || isImporting || selectedCount === 0}
                >
                  {isParsingTDS ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Parsing TDS {tdsProgress.current}/{tdsProgress.total}...
                    </>
                  ) : (
                    <>
                      <Sparkles className="mr-2 h-4 w-4" />
                      Parse TDS with AI
                    </>
                  )}
                </Button>
                <Button 
                  onClick={handleImport} 
                  disabled={isImporting || isParsingTDS || selectedCount === 0}
                  size="lg"
                >
                  {isImporting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Importing {importProgress.current}/{importProgress.total}...
                    </>
                  ) : (
                    <>
                      <Upload className="mr-2 h-4 w-4" />
                      Import {selectedCount} Products
                    </>
                  )}
                </Button>
              </div>
            </div>

            {/* Progress Bars */}
            {isImporting && (
              <Progress value={(importProgress.current / importProgress.total) * 100} />
            )}
            {isParsingTDS && (
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Sparkles className="h-4 w-4" />
                  <span>AI is extracting print settings from Technical Data Sheets...</span>
                </div>
                <Progress value={(tdsProgress.current / tdsProgress.total) * 100} className="bg-purple-100" />
              </div>
            )}

            {/* TDS Parse Results */}
            {tdsResults.length > 0 && !isParsingTDS && (
              <Card className="border-purple-500">
                <CardContent className="pt-6">
                  <div className="flex items-center gap-4">
                    <Sparkles className="h-8 w-8 text-purple-500" />
                    <div>
                      <p className="font-semibold">TDS Parsing Complete</p>
                      <p className="text-sm text-muted-foreground">
                        Success: {tdsResults.filter(r => r.success).length} • 
                        Failed: {tdsResults.filter(r => !r.success).length} • 
                        Fields Extracted: {tdsResults.reduce((sum, r) => sum + (r.fields_extracted || 0), 0)}
                      </p>
                    </div>
                  </div>
                  {tdsResults.some(r => !r.success) && (
                    <ScrollArea className="h-32 mt-4">
                      <div className="space-y-1">
                        {tdsResults.filter(r => !r.success).map((result, i) => {
                          const product = products.find(p => p.product_id === result.product_id);
                          return (
                            <p key={i} className="text-sm text-destructive">
                              {product?.product_title?.substring(0, 50)}...: {result.error}
                            </p>
                          );
                        })}
                      </div>
                    </ScrollArea>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Import Results */}
            {importResults && (
              <Card className={importResults.errors.length > 0 ? 'border-yellow-500' : 'border-green-500'}>
                <CardContent className="pt-6">
                  <div className="flex items-center gap-4">
                    {importResults.errors.length === 0 ? (
                      <CheckCircle2 className="h-8 w-8 text-green-500" />
                    ) : (
                      <AlertTriangle className="h-8 w-8 text-yellow-500" />
                    )}
                    <div>
                      <p className="font-semibold">Import Complete</p>
                      <p className="text-sm text-muted-foreground">
                        Created: {importResults.success} • Updated: {importResults.updated} • Errors: {importResults.errors.length}
                      </p>
                    </div>
                  </div>
                  {importResults.errors.length > 0 && (
                    <ScrollArea className="h-32 mt-4">
                      <div className="space-y-1">
                        {importResults.errors.map((err, i) => (
                          <p key={i} className="text-sm text-destructive">{err}</p>
                        ))}
                      </div>
                    </ScrollArea>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Product Grid */}
            <Tabs defaultValue="grid" className="w-full">
              <TabsList>
                <TabsTrigger value="grid">Grid View</TabsTrigger>
                <TabsTrigger value="table">Table View</TabsTrigger>
              </TabsList>
              
              <TabsContent value="grid">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {products.map((product) => (
                    <Card 
                      key={product.product_id} 
                      className={`cursor-pointer transition-all ${
                        product.selected ? 'ring-2 ring-primary' : 'opacity-60'
                      }`}
                      onClick={() => toggleProduct(product.product_id)}
                    >
                      <CardContent className="p-4 space-y-3">
                        {/* Image */}
                        <div className="aspect-square bg-muted rounded-lg overflow-hidden relative">
                          {product.featured_image ? (
                            <img 
                              src={product.featured_image} 
                              alt={product.product_title}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <ImageIcon className="h-12 w-12 text-muted-foreground/30" />
                            </div>
                          )}
                          
                          {/* Selection indicator */}
                          <div className="absolute top-2 left-2">
                            <Checkbox checked={product.selected} />
                          </div>
                          
                          {/* Status badge */}
                          <div className="absolute top-2 right-2">
                            {product.existing_id ? (
                              <Badge variant="secondary" className="text-xs">Update</Badge>
                            ) : (
                              <Badge className="text-xs bg-green-500">New</Badge>
                            )}
                          </div>
                          
                          {/* Completeness */}
                          <div className="absolute bottom-2 right-2">
                            <Badge 
                              variant="outline" 
                              className={`text-xs ${getCompletenessColor(product.data_completeness)}`}
                            >
                              {product.data_completeness}%
                            </Badge>
                          </div>
                        </div>

                        {/* Title */}
                        <h3 className="font-medium text-sm line-clamp-2" title={product.product_title}>
                          {product.product_title}
                        </h3>

                        {/* Material & Color */}
                        <div className="flex items-center gap-2 flex-wrap">
                          {product.material && (
                            <Badge variant="secondary" className="text-xs">{product.material}</Badge>
                          )}
                          {product.color_name && (
                            <div className="flex items-center gap-1">
                                {product.color_hex && (
                                <div 
                                  className="w-3 h-3 rounded-full border"
                                  style={{ backgroundColor: normalizeColorHex(product.color_hex) }}
                                />
                              )}
                              <span className="text-xs text-muted-foreground">{product.color_name}</span>
                            </div>
                          )}
                        </div>

                        {/* Data indicators */}
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <DollarSign className={`h-4 w-4 ${product.variant_price ? 'text-green-500' : ''}`} />
                          <Ruler className={`h-4 w-4 ${product.net_weight_g ? 'text-green-500' : ''}`} />
                          <Tag className={`h-4 w-4 ${product.variant_sku ? 'text-green-500' : ''}`} />
                          <FileText className={`h-4 w-4 ${product.tds_url ? 'text-green-500' : ''}`} />
                          {product.tds_parsing ? (
                            <Loader2 className="h-4 w-4 animate-spin text-purple-500" />
                          ) : (
                            <Thermometer className={`h-4 w-4 ${product.nozzle_temp_max_c ? 'text-green-500' : product.tds_parsed ? 'text-yellow-500' : ''}`} />
                          )}
                        </div>

                        {/* Temperature info if parsed */}
                        {product.nozzle_temp_max_c && (
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <Thermometer className="h-3 w-3" />
                            <span>{product.nozzle_temp_min_c || '?'}-{product.nozzle_temp_max_c}°C</span>
                            {product.bed_temp_max_c && (
                              <span className="text-muted-foreground/60">| Bed: {product.bed_temp_min_c || '?'}-{product.bed_temp_max_c}°C</span>
                            )}
                          </div>
                        )}

                        {/* Price */}
                        {product.variant_price && (
                          <p className="text-lg font-bold font-mono">
                            ${product.variant_price.toFixed(2)}
                          </p>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </TabsContent>
              
              <TabsContent value="table">
                <Card>
                  <ScrollArea className="h-[600px]">
                    <table className="w-full">
                      <thead className="sticky top-0 bg-background border-b">
                        <tr>
                          <th className="p-3 text-left">Select</th>
                          <th className="p-3 text-left">Product</th>
                          <th className="p-3 text-left">Material</th>
                          <th className="p-3 text-left">Color</th>
                          <th className="p-3 text-left">Price</th>
                          <th className="p-3 text-left">Weight</th>
                          <th className="p-3 text-left">SKU</th>
                          <th className="p-3 text-left">Completeness</th>
                          <th className="p-3 text-left">Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {products.map((product) => (
                          <tr 
                            key={product.product_id} 
                            className={`border-b cursor-pointer hover:bg-muted/50 ${
                              product.selected ? '' : 'opacity-50'
                            }`}
                            onClick={() => toggleProduct(product.product_id)}
                          >
                            <td className="p-3">
                              <Checkbox checked={product.selected} />
                            </td>
                            <td className="p-3">
                              <div className="flex items-center gap-2">
                                {product.featured_image && (
                                  <img 
                                    src={product.featured_image} 
                                    alt=""
                                    className="w-10 h-10 object-cover rounded"
                                  />
                                )}
                                <span className="max-w-[200px] truncate" title={product.product_title}>
                                  {product.product_title}
                                </span>
                              </div>
                            </td>
                            <td className="p-3">
                              {product.material && (
                                <Badge variant="secondary">{product.material}</Badge>
                              )}
                            </td>
                            <td className="p-3">
                              {product.color_name && (
                                <div className="flex items-center gap-1">
                                  {product.color_hex && (
                                    <div 
                                      className="w-4 h-4 rounded-full border"
                                      style={{ backgroundColor: normalizeColorHex(product.color_hex) }}
                                    />
                                  )}
                                  <span>{product.color_name}</span>
                                </div>
                              )}
                            </td>
                            <td className="p-3 font-mono">
                              {product.variant_price ? `$${product.variant_price.toFixed(2)}` : '-'}
                            </td>
                            <td className="p-3">
                              {product.net_weight_g ? `${product.net_weight_g}g` : '-'}
                            </td>
                            <td className="p-3 font-mono text-sm">
                              {product.variant_sku || '-'}
                            </td>
                            <td className="p-3">
                              <Badge 
                                variant="outline" 
                                className={getCompletenessColor(product.data_completeness)}
                              >
                                {product.data_completeness}%
                              </Badge>
                            </td>
                            <td className="p-3">
                              {product.existing_id ? (
                                <Badge variant="secondary">Update</Badge>
                              ) : (
                                <Badge className="bg-green-500">New</Badge>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </ScrollArea>
                </Card>
              </TabsContent>
            </Tabs>
          </>
        )}

        {/* Empty State */}
        {!isDiscovering && products.length === 0 && !discoveryResult && (
          <Card className="border-dashed">
            <CardContent className="py-12 text-center">
              <Package className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-lg font-semibold mb-2">No Products Discovered Yet</h3>
              <p className="text-muted-foreground max-w-md mx-auto">
                Enter a brand name and website URL above, then click "Discover" to automatically 
                find and extract all filament products from their store.
              </p>
            </CardContent>
          </Card>
        )}

        {/* Batch TDS Parsing Section */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Thermometer className="h-5 w-5" />
              Batch TDS Parsing for Existing Filaments
            </CardTitle>
            <CardDescription>
              Parse TDS documents for existing filaments in the database that are missing print settings (nozzle temp, bed temp, etc.)
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-wrap gap-4 items-end">
              <div className="space-y-2 flex-1 min-w-[200px]">
                <Label htmlFor="batch-brand">Filter by Brand</Label>
                <select
                  id="batch-brand"
                  className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm"
                  value={batchBrandFilter}
                  onChange={(e) => setBatchBrandFilter(e.target.value)}
                  disabled={isFetchingBatch || isBatchParsing}
                >
                  <option value="">All Brands</option>
                  {batchVendors.map(vendor => (
                    <option key={vendor} value={vendor}>{vendor}</option>
                  ))}
                </select>
              </div>
              <Button 
                onClick={handleFetchBatchFilaments} 
                disabled={isFetchingBatch || isBatchParsing}
                variant="secondary"
              >
                {isFetchingBatch ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Loading...
                  </>
                ) : (
                  <>
                    <Search className="mr-2 h-4 w-4" />
                    Find Filaments Missing Settings
                  </>
                )}
              </Button>
            </div>

            {/* Batch Filaments Results */}
            {batchFilaments.length > 0 && (
              <div className="space-y-4">
                <div className="flex items-center justify-between flex-wrap gap-4">
                  <div className="flex items-center gap-4">
                    <Badge variant="outline" className="text-lg px-3 py-1">
                      {batchFilaments.length} filaments missing print settings
                    </Badge>
                    <span className="text-sm text-muted-foreground">
                      Selected: {batchFilaments.filter(f => f.selected).length}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => setBatchFilaments(prev => prev.map(f => ({ ...f, selected: true })))}
                    >
                      Select All
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => setBatchFilaments(prev => prev.map(f => ({ ...f, selected: false })))}
                    >
                      Deselect All
                    </Button>
                    <Button 
                      onClick={handleBatchParseTDS} 
                      disabled={isBatchParsing || batchFilaments.filter(f => f.selected).length === 0}
                    >
                      {isBatchParsing ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Parsing {batchProgress.current}/{batchProgress.total}...
                        </>
                      ) : (
                        <>
                          <Sparkles className="mr-2 h-4 w-4" />
                          Parse TDS ({batchFilaments.filter(f => f.selected).length})
                        </>
                      )}
                    </Button>
                  </div>
                </div>

                {/* Batch Progress */}
                {isBatchParsing && (
                  <div className="space-y-2">
                    <Progress value={(batchProgress.current / batchProgress.total) * 100} />
                    <p className="text-sm text-muted-foreground text-center">
                      AI is extracting print settings from TDS documents...
                    </p>
                  </div>
                )}

                {/* Batch Results Summary */}
                {batchResults.length > 0 && !isBatchParsing && (
                  <Card className="border-purple-500">
                    <CardContent className="pt-4">
                      <div className="flex items-center gap-4">
                        <Sparkles className="h-6 w-6 text-purple-500" />
                        <div>
                          <p className="font-semibold">Batch Parsing Complete</p>
                          <p className="text-sm text-muted-foreground">
                            Success: {batchResults.filter(r => r.success).length} • 
                            Failed: {batchResults.filter(r => !r.success).length} • 
                            Fields Extracted: {batchResults.reduce((sum, r) => sum + (r.fields_extracted || 0), 0)}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Batch Filaments List */}
                <ScrollArea className="h-[400px] border rounded-lg">
                  <div className="p-4 space-y-2">
                    {batchFilaments.map((filament) => (
                      <div 
                        key={filament.id}
                        className={`flex items-center gap-4 p-3 rounded-lg border cursor-pointer transition-all ${
                          filament.selected ? 'bg-primary/5 border-primary' : 'hover:bg-muted/50'
                        } ${filament.parsing ? 'opacity-50' : ''}`}
                        onClick={() => setBatchFilaments(prev => prev.map(f => 
                          f.id === filament.id ? { ...f, selected: !f.selected } : f
                        ))}
                      >
                        <Checkbox checked={filament.selected} disabled={filament.parsing} />
                        
                        {filament.featured_image ? (
                          <img 
                            src={filament.featured_image} 
                            alt="" 
                            className="w-12 h-12 object-cover rounded"
                          />
                        ) : (
                          <div className="w-12 h-12 bg-muted rounded flex items-center justify-center">
                            <ImageIcon className="h-6 w-6 text-muted-foreground/30" />
                          </div>
                        )}
                        
                        <div className="flex-1 min-w-0">
                          <p className="font-medium truncate">{filament.product_title}</p>
                          <p className="text-sm text-muted-foreground">{filament.vendor}</p>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          {filament.material && (
                            <Badge variant="secondary">{filament.material}</Badge>
                          )}
                          {filament.tds_url ? (
                            <Badge variant="outline" className="text-green-500">Has TDS</Badge>
                          ) : (
                            <Badge variant="outline" className="text-yellow-500">No TDS URL</Badge>
                          )}
                          {filament.parsing && (
                            <Loader2 className="h-4 w-4 animate-spin text-purple-500" />
                          )}
                          {filament.parsed && (
                            <CheckCircle2 className="h-4 w-4 text-green-500" />
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </div>
            )}

            {/* Empty state for batch */}
            {batchFilaments.length === 0 && !isFetchingBatch && (
              <div className="text-center py-8 text-muted-foreground">
                <Thermometer className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p>Click "Find Filaments Missing Settings" to load filaments that need TDS parsing</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AdminImport;
