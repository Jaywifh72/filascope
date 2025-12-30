import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { 
  Building2, Search, Package, RefreshCw, CheckCircle2, XCircle, 
  Clock, TrendingUp, AlertCircle, Play, Activity, ArrowLeft,
  Zap, Database, Image, FileText, Palette, Thermometer, 
  Barcode, Tag, PlayCircle, ShoppingCart, Link2, DollarSign,
  Store, Loader2, Trash2
} from "lucide-react";
import { toast } from "sonner";
import { BrandCategoryTabs } from "@/components/admin/BrandCategoryTabs";
import { ScrapeProgressBanner } from "@/components/admin/ScrapeProgressBanner";
import { ScrapeAnalyticsWidget } from "@/components/admin/ScrapeAnalyticsWidget";

interface AutomatedBrand {
  id: string;
  brand_name: string;
  brand_slug: string;
  display_name: string;
  platform_type: string;
  base_url: string;
  scraping_enabled: boolean;
  scraping_active: boolean;
  auto_create_products: boolean;
  product_count: number;
  active_product_count: number;
  products_created: number;
  products_updated: number;
  products_with_prices: number;
  products_with_urls: number;
  products_with_images: number;
  products_with_tds: number;
  products_with_mpn: number;
  products_with_codes: number;
  products_with_color_hex: number;
  products_with_amazon_prices: number;
  products_with_amazon_links: number;
  total_scrapes: number;
  successful_scrapes: number;
  failed_scrapes: number;
  last_scrape_at: string | null;
  next_scrape_at: string | null;
  last_error: string | null;
  last_error_at: string | null;
  avg_scrape_duration_seconds: number | null;
  description: string | null;
  logo_url: string | null;
  has_amazon_store: boolean;
  amazon_store_url: string | null;
  amazon_last_scrape_at: string | null;
}

interface SyncLog {
  id: string;
  brand_slug: string;
  sync_type: string;
  status: string;
  started_at: string;
  completed_at: string | null;
  duration_seconds: number | null;
  products_discovered: number | null;
  products_created: number | null;
  products_updated: number | null;
  products_failed: number | null;
  price_changes: number | null;
  error_details: Record<string, unknown> | null;
  success_details: Record<string, unknown> | null;
  products_processed: Record<string, unknown> | null;
  triggered_by: string | null;
}

const AdminBrandPipeline = () => {
  const navigate = useNavigate();
  const { user, isAdmin, loading: authLoading } = useAuth();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState("all-brands");
  const [scrapingBrandId, setScrapingBrandId] = useState<string | null>(null);
  const [deletingBrandId, setDeletingBrandId] = useState<string | null>(null);
  const [deleteConfirmBrand, setDeleteConfirmBrand] = useState<AutomatedBrand | null>(null);

  useEffect(() => {
    if (!authLoading && user && !isAdmin) {
      navigate("/");
    } else if (!authLoading && !user) {
      navigate("/auth");
    }
  }, [isAdmin, authLoading, user, navigate]);

  // Fetch automated brands
  const { data: brands, isLoading: brandsLoading, refetch: refetchBrands } = useQuery({
    queryKey: ["admin-brand-pipeline"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("automated_brands")
        .select("*")
        .order("display_order", { ascending: true });
      if (error) throw error;
      return data as AutomatedBrand[];
    },
    enabled: isAdmin,
  });

  // Fetch recent sync logs
  const { data: syncLogs, refetch: refetchLogs } = useQuery({
    queryKey: ["admin-sync-logs-recent"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("brand_sync_logs")
        .select("*")
        .order("started_at", { ascending: false })
        .limit(20);
      if (error) throw error;
      return data as SyncLog[];
    },
    enabled: isAdmin,
  });

  // Toggle scraping enabled
  const toggleScraping = useMutation({
    mutationFn: async ({ id, enabled }: { id: string; enabled: boolean }) => {
      const { error } = await supabase
        .from("automated_brands")
        .update({ scraping_enabled: enabled })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-brand-pipeline"] });
      toast.success("Scraping setting updated");
    },
    onError: (error) => {
      toast.error("Failed to update: " + error.message);
    },
  });

  // Trigger brand scrape - routes to specialized scrapers for certain brands
  const triggerScrape = useMutation({
    mutationFn: async (brand: AutomatedBrand) => {
      setScrapingBrandId(brand.id);
      
      // Route to specialized scrapers for brands with custom implementations
      const specializedScrapers: Record<string, { function: string; body: Record<string, unknown> }> = {
        'anycubic': {
          function: 'sync-anycubic-products',
          body: { limit: 200, dryRun: false }
        },
        'elegoo': {
          function: 'sync-elegoo-products', 
          body: { limit: 200, dryRun: false }
        }
      };
      
      const specialized = specializedScrapers[brand.brand_slug];
      const functionName = specialized?.function || 'scrape-brand-data';
      const requestBody = specialized?.body || { 
        vendor: brand.brand_name, 
        limit: 200, 
        force: true,
        dryRun: false,
        parseTds: true,
        tdsLimit: 20
      };
      
      const { data, error } = await supabase.functions.invoke(functionName, {
        body: requestBody,
      });
      if (error) throw error;
      return data;
    },
    onSuccess: (data, brand) => {
      setScrapingBrandId(null);
      queryClient.invalidateQueries({ queryKey: ["admin-brand-pipeline"] });
      queryClient.invalidateQueries({ queryKey: ["admin-sync-logs-recent"] });
      const stats = data?.totalStats || data?.stats || {};
      toast.success(`${brand.display_name}: ${stats.created || 0} created, ${stats.updated || 0} updated`);
    },
    onError: (error, brand) => {
      setScrapingBrandId(null);
      toast.error(`Failed to scrape ${brand.display_name}: ${error.message}`);
    },
  });

  // Delete all products for a brand (clean-slate resync)
  const deleteProducts = useMutation({
    mutationFn: async (brand: AutomatedBrand) => {
      setDeletingBrandId(brand.id);
      
      // Delete all filaments for this vendor
      const { error } = await supabase
        .from('filaments')
        .delete()
        .ilike('vendor', brand.brand_name);
      
      if (error) throw error;
      
      // Update brand product counts
      await supabase.rpc('update_brand_product_counts', { 
        p_brand_slug: brand.brand_slug 
      });
      
      return { brandName: brand.display_name };
    },
    onSuccess: (data) => {
      setDeletingBrandId(null);
      setDeleteConfirmBrand(null);
      queryClient.invalidateQueries({ queryKey: ["admin-brand-pipeline"] });
      toast.success(`Deleted all ${data.brandName} products`);
    },
    onError: (error, brand) => {
      setDeletingBrandId(null);
      setDeleteConfirmBrand(null);
      toast.error(`Failed to delete ${brand.display_name} products: ${error.message}`);
    },
  });

  // Calculate stats
  const stats = brands ? {
    total: brands.length,
    enabled: brands.filter(b => b.scraping_enabled).length,
    active: brands.filter(b => b.scraping_active).length,
    totalProducts: brands.reduce((sum, b) => sum + (b.product_count || 0), 0),
    withImages: brands.reduce((sum, b) => sum + (b.products_with_images || 0), 0),
    withPrices: brands.reduce((sum, b) => sum + (b.products_with_prices || 0), 0),
    withTds: brands.reduce((sum, b) => sum + (b.products_with_tds || 0), 0),
  } : null;

  const filteredBrands = brands?.filter(b => 
    b.display_name.toLowerCase().includes(search.toLowerCase()) ||
    b.brand_slug.toLowerCase().includes(search.toLowerCase())
  );

  if (authLoading) {
    return <div className="min-h-screen flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin" /></div>;
  }

  if (!isAdmin) return null;

  return (
    <>
      <ScrapeProgressBanner />
      
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
                <Building2 className="w-8 h-8 text-primary" />
                Brand Pipeline
              </h1>
              <p className="text-muted-foreground">Unified brand scraping, sync, and data management</p>
            </div>
          </div>
          <Button onClick={() => { refetchBrands(); refetchLogs(); }} variant="outline" size="sm">
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
        </div>

        {/* Summary Stats */}
        {stats && (
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
            <Card className="p-4">
              <div className="text-2xl font-bold">{stats.total}</div>
              <div className="text-sm text-muted-foreground">Brands</div>
            </Card>
            <Card className="p-4">
              <div className="text-2xl font-bold text-green-500">{stats.enabled}</div>
              <div className="text-sm text-muted-foreground">Enabled</div>
            </Card>
            <Card className="p-4">
              <div className="text-2xl font-bold text-blue-500">{stats.active}</div>
              <div className="text-sm text-muted-foreground">Active</div>
            </Card>
            <Card className="p-4">
              <div className="text-2xl font-bold">{stats.totalProducts.toLocaleString()}</div>
              <div className="text-sm text-muted-foreground">Products</div>
            </Card>
            <Card className="p-4">
              <div className="text-2xl font-bold">{stats.withImages.toLocaleString()}</div>
              <div className="text-sm text-muted-foreground flex items-center gap-1"><Image className="w-3 h-3" />Images</div>
            </Card>
            <Card className="p-4">
              <div className="text-2xl font-bold">{stats.withPrices.toLocaleString()}</div>
              <div className="text-sm text-muted-foreground flex items-center gap-1"><DollarSign className="w-3 h-3" />Prices</div>
            </Card>
            <Card className="p-4">
              <div className="text-2xl font-bold">{stats.withTds.toLocaleString()}</div>
              <div className="text-sm text-muted-foreground flex items-center gap-1"><FileText className="w-3 h-3" />TDS</div>
            </Card>
          </div>
        )}

        {/* Scrape Analytics */}
        <ScrapeAnalyticsWidget />

        {/* Main Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3 max-w-md">
            <TabsTrigger value="all-brands" className="flex items-center gap-2">
              <Store className="w-4 h-4" />
              All Brands
            </TabsTrigger>
            <TabsTrigger value="brand-list" className="flex items-center gap-2">
              <Database className="w-4 h-4" />
              Brand List
            </TabsTrigger>
            <TabsTrigger value="sync-logs" className="flex items-center gap-2">
              <Activity className="w-4 h-4" />
              Sync Logs
            </TabsTrigger>
          </TabsList>

          {/* All Brands - Category Tabs */}
          <TabsContent value="all-brands" className="mt-6">
            <BrandCategoryTabs />
          </TabsContent>

          {/* Brand List */}
          <TabsContent value="brand-list" className="mt-6 space-y-4">
            <div className="flex items-center gap-4">
              <div className="relative flex-1 max-w-sm">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input 
                  placeholder="Search brands..." 
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            <div className="grid gap-4">
              {brandsLoading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="w-8 h-8 animate-spin" />
                </div>
              ) : filteredBrands?.map(brand => (
                <Card key={brand.id} className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div>
                        <div className="font-semibold">{brand.display_name}</div>
                        <div className="text-sm text-muted-foreground">{brand.platform_type} • {brand.product_count} products</div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-4">
                      {/* Data quality badges */}
                      <div className="flex items-center gap-2">
                        <Badge variant={brand.products_with_images > brand.product_count * 0.8 ? "default" : "secondary"}>
                          <Image className="w-3 h-3 mr-1" />{Math.round((brand.products_with_images / Math.max(brand.product_count, 1)) * 100)}%
                        </Badge>
                        <Badge variant={brand.products_with_prices > brand.product_count * 0.8 ? "default" : "secondary"}>
                          <DollarSign className="w-3 h-3 mr-1" />{Math.round((brand.products_with_prices / Math.max(brand.product_count, 1)) * 100)}%
                        </Badge>
                      </div>

                      {/* Scrape toggle */}
                      <Switch
                        checked={brand.scraping_enabled}
                        onCheckedChange={(checked) => toggleScraping.mutate({ id: brand.id, enabled: checked })}
                      />

                      {/* Delete button */}
                      <Button
                        size="sm"
                        variant="destructive"
                        disabled={deletingBrandId === brand.id || brand.product_count === 0}
                        onClick={() => setDeleteConfirmBrand(brand)}
                        title="Delete all products"
                      >
                        {deletingBrandId === brand.id ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <Trash2 className="w-4 h-4" />
                        )}
                      </Button>

                      {/* Scrape button */}
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={scrapingBrandId === brand.id}
                        onClick={() => triggerScrape.mutate(brand)}
                      >
                        {scrapingBrandId === brand.id ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <Play className="w-4 h-4" />
                        )}
                      </Button>
                    </div>
                  </div>

                  {/* Last scrape info */}
                  {brand.last_scrape_at && (
                    <div className="mt-2 text-xs text-muted-foreground">
                      Last sync: {new Date(brand.last_scrape_at).toLocaleString()}
                      {brand.last_error && (
                        <span className="text-destructive ml-2">• Error: {brand.last_error.slice(0, 50)}...</span>
                      )}
                    </div>
                  )}
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* Sync Logs */}
          <TabsContent value="sync-logs" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Recent Sync Activity</CardTitle>
                <CardDescription>Last 20 sync operations across all brands</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {syncLogs?.map(log => (
                    <div key={log.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                      <div className="flex items-center gap-3">
                        {log.status === 'completed' ? (
                          <CheckCircle2 className="w-4 h-4 text-green-500" />
                        ) : log.status === 'failed' ? (
                          <XCircle className="w-4 h-4 text-destructive" />
                        ) : (
                          <Loader2 className="w-4 h-4 animate-spin text-blue-500" />
                        )}
                        <div>
                          <div className="font-medium">{log.brand_slug}</div>
                          <div className="text-xs text-muted-foreground">
                            {log.sync_type} • {new Date(log.started_at).toLocaleString()}
                          </div>
                        </div>
                      </div>
                      <div className="text-right text-sm">
                        {log.products_created !== null && (
                          <span className="text-green-500">+{log.products_created}</span>
                        )}
                        {log.products_updated !== null && (
                          <span className="text-blue-500 ml-2">↻{log.products_updated}</span>
                        )}
                        {log.duration_seconds && (
                          <span className="text-muted-foreground ml-2">{log.duration_seconds}s</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deleteConfirmBrand} onOpenChange={(open) => !open && setDeleteConfirmBrand(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete All {deleteConfirmBrand?.display_name} Products?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete <strong>{deleteConfirmBrand?.product_count} products</strong> from the database. 
              This action cannot be undone. You can resync after deletion to get fresh data.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => deleteConfirmBrand && deleteProducts.mutate(deleteConfirmBrand)}
            >
              Delete All Products
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default AdminBrandPipeline;
