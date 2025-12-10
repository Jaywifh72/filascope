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
  XCircle, 
  Loader2, 
  Download,
  Upload,
  AlertTriangle,
  Image as ImageIcon,
  DollarSign,
  Ruler,
  FileText,
  Tag,
  Palette
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

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
}

interface DiscoveryResult {
  platform: 'shopify' | 'woocommerce' | 'custom' | 'unknown';
  brand_name: string;
  website_url: string;
  products: DiscoveredProduct[];
  total_found: number;
  errors: string[];
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
  
  const { isAdmin, loading } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

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

  const getCompletenessColor = (percentage: number) => {
    if (percentage >= 80) return 'text-green-500';
    if (percentage >= 50) return 'text-yellow-500';
    return 'text-red-500';
  };

  const selectedCount = products.filter(p => p.selected).length;
  const newCount = products.filter(p => p.selected && !p.existing_id).length;
  const updateCount = products.filter(p => p.selected && p.existing_id).length;
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
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" onClick={() => toggleAll(true)}>
                  Select All
                </Button>
                <Button variant="outline" size="sm" onClick={() => toggleAll(false)}>
                  Deselect All
                </Button>
              </div>
              <Button 
                onClick={handleImport} 
                disabled={isImporting || selectedCount === 0}
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

            {/* Import Progress */}
            {isImporting && (
              <Progress value={(importProgress.current / importProgress.total) * 100} />
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
                                  style={{ backgroundColor: product.color_hex }}
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
                        </div>

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
                                      style={{ backgroundColor: product.color_hex }}
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
      </div>
    </div>
  );
};

export default AdminImport;
