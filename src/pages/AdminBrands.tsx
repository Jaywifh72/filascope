import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Progress } from "@/components/ui/progress";
import { 
  Building2, Search, Package, RefreshCw, CheckCircle2, XCircle, 
  Clock, TrendingUp, AlertCircle, Play, Activity,
  Zap, Database, ChevronDown, ChevronUp, Image, FileText, 
  Palette, Thermometer, Barcode, Tag, PlayCircle, ShoppingCart,
  Link, DollarSign, Pencil, ExternalLink
} from "lucide-react";
import { BrandAffiliateSettings } from "@/components/admin/BrandAffiliateSettings";
import { BrandLogo } from "@/components/ui/BrandLogo";
import { getBrandLogo } from "@/lib/brandLogos";
import { toast } from "sonner";

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

interface SuccessDetails {
  imagesAdded?: number;
  tdsUrlsFound?: number;
  tdsParsed?: number;
  mpnsExtracted?: number;
  barcodesAdded?: number;
  colorHexCaptured?: number;
  tempSpecsExtracted?: number;
  priceHistoryLogged?: number;
  availabilityChanges?: number;
}

interface ProductsProcessed {
  created?: string[];
  updated?: string[];
  failed?: string[];
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
  success_details: SuccessDetails | null;
  products_processed: ProductsProcessed | null;
  triggered_by: string | null;
}

interface BulkScrapeProgress {
  current: number;
  total: number;
  currentBrand: string;
  completed: string[];
  failed: string[];
}

interface BulkScrapeSummary {
  totalBrands: number;
  totalProducts: number;
  created: number;
  updated: number;
  errors: number;
  imagesAdded: number;
  tdsFound: number;
  mpnsExtracted: number;
  duration: number;
  failedBrands: string[];
}

const AdminBrands = () => {
  const navigate = useNavigate();
  const { user, isAdmin, loading: authLoading } = useAuth();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState("overview");
  const [expandedLogs, setExpandedLogs] = useState<Set<string>>(new Set());
  const [isScrapeAllRunning, setIsScrapeAllRunning] = useState(false);
  const [scrapeAllProgress, setScrapeAllProgress] = useState<BulkScrapeProgress | null>(null);
  const [bulkScrapeSummary, setBulkScrapeSummary] = useState<BulkScrapeSummary | null>(null);
  
  // Individual brand scraping progress state
  const [scrapingBrandId, setScrapingBrandId] = useState<string | null>(null);
  const [scrapeProgress, setScrapeProgress] = useState<number>(0);
  const scrapeStartTimeRef = useRef<number | null>(null);
  
  // Amazon scraping progress state
  const [amazonScrapingBrandId, setAmazonScrapingBrandId] = useState<string | null>(null);
  const [amazonScrapeProgress, setAmazonScrapeProgress] = useState<number>(0);
  
  // Amazon discovery progress state
  const [amazonDiscoveryBrandId, setAmazonDiscoveryBrandId] = useState<string | null>(null);
  const [amazonDiscoveryProgress, setAmazonDiscoveryProgress] = useState<number>(0);
  const amazonDiscoveryStartTimeRef = useRef<number | null>(null);
  const amazonScrapeStartTimeRef = useRef<number | null>(null);
  
  // Amazon store URL editing state
  const [editingAmazonUrl, setEditingAmazonUrl] = useState<{id: string, url: string} | null>(null);

  useEffect(() => {
    if (!authLoading && user && !isAdmin) {
      navigate("/");
    } else if (!authLoading && !user) {
      navigate("/auth");
    }
  }, [isAdmin, authLoading, user, navigate]);

  // Fetch automated brands
  const { data: brands, isLoading: brandsLoading, refetch: refetchBrands } = useQuery({
    queryKey: ["admin-automated-brands"],
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

  // Progress animation effect for individual brand scraping
  useEffect(() => {
    if (!scrapingBrandId || !scrapeStartTimeRef.current) return;
    
    const brand = brands?.find(b => b.id === scrapingBrandId);
    const estimatedDuration = (brand?.avg_scrape_duration_seconds || 30) * 1000;
    
    const interval = setInterval(() => {
      const elapsed = Date.now() - (scrapeStartTimeRef.current || Date.now());
      // Animate to 90% over estimated time with easing, then slow asymptotic approach
      const rawProgress = Math.min((elapsed / estimatedDuration) * 85, 95);
      // Apply easing function for smoother feel
      const easedProgress = rawProgress < 85 
        ? rawProgress 
        : 85 + (rawProgress - 85) * 0.3; // Slow down after 85%
      setScrapeProgress(easedProgress);
    }, 100);
    
    return () => clearInterval(interval);
  }, [scrapingBrandId, brands]);

  // Progress animation effect for Amazon scraping
  useEffect(() => {
    if (!amazonScrapingBrandId || !amazonScrapeStartTimeRef.current) return;
    
    // Amazon scraping is generally faster - estimate 20 seconds
    const estimatedDuration = 20 * 1000;
    
    const interval = setInterval(() => {
      const elapsed = Date.now() - (amazonScrapeStartTimeRef.current || Date.now());
      const rawProgress = Math.min((elapsed / estimatedDuration) * 85, 95);
      const easedProgress = rawProgress < 85 
        ? rawProgress 
        : 85 + (rawProgress - 85) * 0.3;
      setAmazonScrapeProgress(easedProgress);
    }, 100);
    
    return () => clearInterval(interval);
  }, [amazonScrapingBrandId]);

  // Progress animation effect for Amazon discovery
  useEffect(() => {
    if (!amazonDiscoveryBrandId || !amazonDiscoveryStartTimeRef.current) return;
    
    // Discovery takes longer due to API calls - estimate 45 seconds
    const estimatedDuration = 45 * 1000;
    
    const interval = setInterval(() => {
      const elapsed = Date.now() - (amazonDiscoveryStartTimeRef.current || Date.now());
      const rawProgress = Math.min((elapsed / estimatedDuration) * 85, 95);
      const easedProgress = rawProgress < 85 
        ? rawProgress 
        : 85 + (rawProgress - 85) * 0.3;
      setAmazonDiscoveryProgress(easedProgress);
    }, 100);
    
    return () => clearInterval(interval);
  }, [amazonDiscoveryBrandId]);

  const { data: syncLogs, isLoading: logsLoading, refetch: refetchLogs } = useQuery({
    queryKey: ["admin-sync-logs"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("brand_sync_logs")
        .select("*")
        .order("started_at", { ascending: false })
        .limit(100);
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
      queryClient.invalidateQueries({ queryKey: ["admin-automated-brands"] });
      toast.success("Scraping setting updated");
    },
    onError: (error) => {
      toast.error("Failed to update: " + error.message);
    },
  });

  // Toggle auto-create
  const toggleAutoCreate = useMutation({
    mutationFn: async ({ id, enabled }: { id: string; enabled: boolean }) => {
      const { error } = await supabase
        .from("automated_brands")
        .update({ auto_create_products: enabled })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-automated-brands"] });
      toast.success("Auto-create setting updated");
    },
    onError: (error) => {
      toast.error("Failed to update: " + error.message);
    },
  });

  // Trigger single brand scrape
  const triggerScrape = useMutation({
    mutationFn: async (brand: AutomatedBrand) => {
      // Start progress tracking
      setScrapingBrandId(brand.id);
      scrapeStartTimeRef.current = Date.now();
      setScrapeProgress(0);
      
      const { data, error } = await supabase.functions.invoke("scrape-brand-data", {
        body: { 
          vendor: brand.brand_name, 
          limit: 200, 
          force: true,
          dryRun: false,
          parseTds: true,
          tdsLimit: 20
        },
      });
      if (error) throw error;
      return data;
    },
    onSuccess: (data, brand) => {
      // Complete progress
      setScrapeProgress(100);
      setTimeout(() => {
        setScrapingBrandId(null);
        setScrapeProgress(0);
        scrapeStartTimeRef.current = null;
      }, 800);
      
      queryClient.invalidateQueries({ queryKey: ["admin-automated-brands"] });
      queryClient.invalidateQueries({ queryKey: ["admin-sync-logs"] });
      const stats = data?.totalStats || data?.stats || {};
      toast.success(`${brand.display_name}: ${stats.created || 0} created, ${stats.updated || 0} updated, ${stats.imagesAdded || 0} images`);
    },
    onError: (error, brand) => {
      // Clear progress on error
      setScrapingBrandId(null);
      setScrapeProgress(0);
      scrapeStartTimeRef.current = null;
      toast.error(`Failed to scrape ${brand.display_name}: ${error.message}`);
    },
  });

  // Trigger Amazon price scrape
  const scrapeAmazonPrices = useMutation({
    mutationFn: async (brand: AutomatedBrand) => {
      setAmazonScrapingBrandId(brand.id);
      amazonScrapeStartTimeRef.current = Date.now();
      setAmazonScrapeProgress(0);
      
      const { data, error } = await supabase.functions.invoke("scrape-amazon-prices", {
        body: { vendor: brand.brand_name, limit: 100 },
      });
      if (error) throw error;
      return data;
    },
    onSuccess: (data, brand) => {
      setAmazonScrapeProgress(100);
      setTimeout(() => {
        setAmazonScrapingBrandId(null);
        setAmazonScrapeProgress(0);
        amazonScrapeStartTimeRef.current = null;
      }, 800);
      
      queryClient.invalidateQueries({ queryKey: ["admin-automated-brands"] });
      toast.success(`${brand.display_name}: ${data?.updated || 0} Amazon prices updated`);
    },
    onError: (error, brand) => {
      setAmazonScrapingBrandId(null);
      setAmazonScrapeProgress(0);
      amazonScrapeStartTimeRef.current = null;
      toast.error(`Failed to scrape Amazon prices for ${brand.display_name}: ${error.message}`);
    },
  });

  // Update Amazon store URL
  const updateAmazonStoreUrl = useMutation({
    mutationFn: async ({ id, url }: { id: string; url: string }) => {
      const { error } = await supabase
        .from("automated_brands")
        .update({ 
          amazon_store_url: url || null,
          has_amazon_store: !!url 
        })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-automated-brands"] });
      toast.success("Amazon store URL updated");
      setEditingAmazonUrl(null);
    },
    onError: (error) => {
      toast.error("Failed to update URL: " + error.message);
    },
  });

  // Discover Amazon products via SerpApi
  const discoverAmazonProducts = useMutation({
    mutationFn: async (brand: AutomatedBrand) => {
      setAmazonDiscoveryBrandId(brand.id);
      amazonDiscoveryStartTimeRef.current = Date.now();
      setAmazonDiscoveryProgress(0);
      
      const { data, error } = await supabase.functions.invoke("discover-amazon-products", {
        body: { vendor: brand.brand_name, limit: 30 },
      });
      if (error) throw error;
      return data;
    },
    onSuccess: (data, brand) => {
      setAmazonDiscoveryProgress(100);
      setTimeout(() => {
        setAmazonDiscoveryBrandId(null);
        setAmazonDiscoveryProgress(0);
        amazonDiscoveryStartTimeRef.current = null;
      }, 800);
      
      queryClient.invalidateQueries({ queryKey: ["admin-automated-brands"] });
      toast.success(`${brand.display_name}: ${data?.high_confidence || 0} Amazon products discovered (${data?.updated || 0} updated)`);
    },
    onError: (error, brand) => {
      setAmazonDiscoveryBrandId(null);
      setAmazonDiscoveryProgress(0);
      amazonDiscoveryStartTimeRef.current = null;
      toast.error(`Failed to discover Amazon products for ${brand.display_name}: ${error.message}`);
    },
  });

  // Scrape all enabled brands
  const scrapeAllBrands = async () => {
    if (!brands) return;
    
    const enabledBrands = brands.filter(b => b.scraping_enabled);
    if (enabledBrands.length === 0) {
      toast.error("No enabled brands to scrape");
      return;
    }

    setIsScrapeAllRunning(true);
    setBulkScrapeSummary(null);
    
    const progress: BulkScrapeProgress = {
      current: 0,
      total: enabledBrands.length,
      currentBrand: "",
      completed: [],
      failed: [],
    };
    setScrapeAllProgress(progress);

    const summary: BulkScrapeSummary = {
      totalBrands: enabledBrands.length,
      totalProducts: 0,
      created: 0,
      updated: 0,
      errors: 0,
      imagesAdded: 0,
      tdsFound: 0,
      mpnsExtracted: 0,
      duration: 0,
      failedBrands: [],
    };

    const startTime = Date.now();

    for (let i = 0; i < enabledBrands.length; i++) {
      const brand = enabledBrands[i];
      progress.current = i + 1;
      progress.currentBrand = brand.display_name;
      setScrapeAllProgress({ ...progress });

      try {
        const { data, error } = await supabase.functions.invoke("scrape-brand-data", {
          body: { 
            vendor: brand.brand_name, 
            limit: 200, 
            force: true,
            dryRun: false,
            parseTds: true,
            tdsLimit: 20
          },
        });

        if (error) throw error;

        const stats = data?.totalStats || data?.stats || {};
        summary.totalProducts += stats.processed || 0;
        summary.created += stats.created || 0;
        summary.updated += stats.updated || 0;
        summary.errors += stats.errors || 0;
        summary.imagesAdded += stats.imagesAdded || 0;
        summary.tdsFound += stats.tdsFound || 0;
        summary.mpnsExtracted += stats.mpnsExtracted || 0;
        
        progress.completed.push(brand.display_name);
        console.log(`✅ Scraped ${brand.display_name}: ${stats.created || 0} created, ${stats.updated || 0} updated`);
      } catch (err) {
        progress.failed.push(brand.display_name);
        summary.failedBrands.push(brand.display_name);
        console.error(`❌ Failed to scrape ${brand.display_name}:`, err);
      }

      setScrapeAllProgress({ ...progress });
    }

    summary.duration = Math.round((Date.now() - startTime) / 1000);
    setBulkScrapeSummary(summary);
    setIsScrapeAllRunning(false);
    setScrapeAllProgress(null);
    
    queryClient.invalidateQueries({ queryKey: ["admin-automated-brands"] });
    queryClient.invalidateQueries({ queryKey: ["admin-sync-logs"] });
    
    toast.success(`Bulk scrape complete: ${summary.created} created, ${summary.updated} updated in ${summary.duration}s`);
  };

  const toggleLogExpanded = (logId: string) => {
    setExpandedLogs(prev => {
      const next = new Set(prev);
      if (next.has(logId)) {
        next.delete(logId);
      } else {
        next.add(logId);
      }
      return next;
    });
  };

  // Calculate stats
  const stats = {
    totalBrands: brands?.length || 0,
    enabledBrands: brands?.filter(b => b.scraping_enabled).length || 0,
    autoCreateBrands: brands?.filter(b => b.auto_create_products).length || 0,
    totalProducts: brands?.reduce((sum, b) => sum + (b.product_count || 0), 0) || 0,
    productsCreated: brands?.reduce((sum, b) => sum + (b.products_created || 0), 0) || 0,
    totalScrapes: brands?.reduce((sum, b) => sum + (b.total_scrapes || 0), 0) || 0,
    successfulScrapes: brands?.reduce((sum, b) => sum + (b.successful_scrapes || 0), 0) || 0,
    activeScrapes: brands?.filter(b => b.scraping_active).length || 0,
  };

  const filteredBrands = brands?.filter(b => 
    b.display_name.toLowerCase().includes(search.toLowerCase()) ||
    b.brand_slug.toLowerCase().includes(search.toLowerCase())
  ) || [];

  const getPlatformColor = (platform: string) => {
    switch (platform?.toLowerCase()) {
      case "shopify": return "bg-green-500/10 text-green-500 border-green-500/30";
      case "woocommerce": return "bg-purple-500/10 text-purple-500 border-purple-500/30";
      case "bigcommerce": return "bg-blue-500/10 text-blue-500 border-blue-500/30";
      case "amazon": return "bg-orange-500/10 text-orange-500 border-orange-500/30";
      default: return "bg-muted text-muted-foreground";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "completed": return <CheckCircle2 className="w-4 h-4 text-green-500" />;
      case "failed": return <XCircle className="w-4 h-4 text-destructive" />;
      case "running": return <RefreshCw className="w-4 h-4 text-primary animate-spin" />;
      default: return <Clock className="w-4 h-4 text-muted-foreground" />;
    }
  };

  const hasEnrichmentData = (log: SyncLog) => {
    const s = log.success_details;
    if (!s) return false;
    return (s.imagesAdded || 0) + (s.tdsUrlsFound || 0) + (s.mpnsExtracted || 0) + 
           (s.barcodesAdded || 0) + (s.colorHexCaptured || 0) + (s.tempSpecsExtracted || 0) > 0;
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-muted-foreground">Loading...</div>
      </div>
    );
  }

  if (!isAdmin) return null;

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <Building2 className="w-8 h-8 text-primary" />
            <div>
              <h1 className="text-3xl font-bold text-foreground">Brand Scraping</h1>
              <p className="text-muted-foreground">Manage automated brand scraping and product discovery</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              onClick={scrapeAllBrands}
              disabled={isScrapeAllRunning || brandsLoading}
              className="bg-primary hover:bg-primary/90"
            >
              {isScrapeAllRunning ? (
                <>
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  Scraping {scrapeAllProgress?.current}/{scrapeAllProgress?.total}...
                </>
              ) : (
                <>
                  <PlayCircle className="w-4 h-4 mr-2" />
                  Scrape All Enabled ({stats.enabledBrands})
                </>
              )}
            </Button>
            <Button 
              onClick={() => { refetchBrands(); refetchLogs(); }} 
              variant="outline" 
              size="sm" 
              disabled={brandsLoading}
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${brandsLoading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
        </div>

        {/* Bulk Scrape Progress */}
        {scrapeAllProgress && (
          <Card className="mb-6 border-primary/50 bg-primary/5">
            <CardContent className="py-4">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <RefreshCw className="w-5 h-5 text-primary animate-spin" />
                  <span className="font-medium">Scraping: {scrapeAllProgress.currentBrand}</span>
                </div>
                <span className="text-sm text-muted-foreground">
                  {scrapeAllProgress.current} of {scrapeAllProgress.total} brands
                </span>
              </div>
              <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                <div 
                  className="h-full bg-primary transition-all duration-300"
                  style={{ width: `${(scrapeAllProgress.current / scrapeAllProgress.total) * 100}%` }}
                />
              </div>
              {scrapeAllProgress.completed.length > 0 && (
                <p className="text-xs text-muted-foreground mt-2">
                  Completed: {scrapeAllProgress.completed.slice(-3).join(", ")}
                  {scrapeAllProgress.completed.length > 3 && ` (+${scrapeAllProgress.completed.length - 3} more)`}
                </p>
              )}
            </CardContent>
          </Card>
        )}

        {/* Bulk Scrape Summary */}
        {bulkScrapeSummary && (
          <Card className="mb-6 border-green-500/50 bg-green-500/5">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg flex items-center gap-2 text-green-500">
                <CheckCircle2 className="w-5 h-5" />
                Bulk Scrape Complete
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-4 text-center">
                <div>
                  <p className="text-2xl font-bold text-foreground">{bulkScrapeSummary.totalBrands}</p>
                  <p className="text-xs text-muted-foreground">Brands</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-foreground">{bulkScrapeSummary.totalProducts}</p>
                  <p className="text-xs text-muted-foreground">Products</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-green-500">{bulkScrapeSummary.created}</p>
                  <p className="text-xs text-muted-foreground">Created</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-primary">{bulkScrapeSummary.updated}</p>
                  <p className="text-xs text-muted-foreground">Updated</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-cyan-500">{bulkScrapeSummary.imagesAdded}</p>
                  <p className="text-xs text-muted-foreground">Images</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-amber-500">{bulkScrapeSummary.tdsFound}</p>
                  <p className="text-xs text-muted-foreground">TDS Found</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-purple-500">{bulkScrapeSummary.mpnsExtracted}</p>
                  <p className="text-xs text-muted-foreground">MPNs</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-foreground">{bulkScrapeSummary.duration}s</p>
                  <p className="text-xs text-muted-foreground">Duration</p>
                </div>
              </div>
              {bulkScrapeSummary.failedBrands.length > 0 && (
                <div className="mt-4 p-2 bg-destructive/10 rounded text-sm">
                  <span className="text-destructive font-medium">Failed:</span>{" "}
                  <span className="text-muted-foreground">{bulkScrapeSummary.failedBrands.join(", ")}</span>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-4 mb-6">
          <Card className="p-4">
            <div className="flex items-center gap-2 text-muted-foreground mb-1">
              <Building2 className="w-4 h-4" />
              <span className="text-xs">Brands</span>
            </div>
            <p className="text-2xl font-bold text-foreground">{stats.totalBrands}</p>
          </Card>
          <Card className="p-4">
            <div className="flex items-center gap-2 text-muted-foreground mb-1">
              <CheckCircle2 className="w-4 h-4 text-green-500" />
              <span className="text-xs">Enabled</span>
            </div>
            <p className="text-2xl font-bold text-green-500">{stats.enabledBrands}</p>
          </Card>
          <Card className="p-4">
            <div className="flex items-center gap-2 text-muted-foreground mb-1">
              <Zap className="w-4 h-4 text-primary" />
              <span className="text-xs">Auto-Create</span>
            </div>
            <p className="text-2xl font-bold text-primary">{stats.autoCreateBrands}</p>
          </Card>
          <Card className="p-4">
            <div className="flex items-center gap-2 text-muted-foreground mb-1">
              <Package className="w-4 h-4" />
              <span className="text-xs">Products</span>
            </div>
            <p className="text-2xl font-bold text-foreground">{stats.totalProducts.toLocaleString()}</p>
          </Card>
          <Card className="p-4">
            <div className="flex items-center gap-2 text-muted-foreground mb-1">
              <TrendingUp className="w-4 h-4 text-green-500" />
              <span className="text-xs">Created</span>
            </div>
            <p className="text-2xl font-bold text-green-500">{stats.productsCreated.toLocaleString()}</p>
          </Card>
          <Card className="p-4">
            <div className="flex items-center gap-2 text-muted-foreground mb-1">
              <Database className="w-4 h-4" />
              <span className="text-xs">Total Scrapes</span>
            </div>
            <p className="text-2xl font-bold text-foreground">{stats.totalScrapes}</p>
          </Card>
          <Card className="p-4">
            <div className="flex items-center gap-2 text-muted-foreground mb-1">
              <CheckCircle2 className="w-4 h-4" />
              <span className="text-xs">Success Rate</span>
            </div>
            <p className="text-2xl font-bold text-foreground">
              {stats.totalScrapes > 0 ? Math.round((stats.successfulScrapes / stats.totalScrapes) * 100) : 0}%
            </p>
          </Card>
          <Card className="p-4">
            <div className="flex items-center gap-2 text-muted-foreground mb-1">
              <Activity className="w-4 h-4 text-primary" />
              <span className="text-xs">Active</span>
            </div>
            <p className="text-2xl font-bold text-primary">{stats.activeScrapes}</p>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-4">
            <TabsTrigger value="overview">
              <Building2 className="w-4 h-4 mr-2" />
              Brands ({filteredBrands.length})
            </TabsTrigger>
            <TabsTrigger value="logs">
              <Activity className="w-4 h-4 mr-2" />
              Sync Logs ({syncLogs?.length || 0})
            </TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview">
            <div className="mb-4">
              <div className="relative max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search brands..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            {brandsLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[...Array(6)].map((_, i) => (
                  <Card key={i} className="p-4 animate-pulse">
                    <div className="h-6 bg-muted rounded w-32 mb-3"></div>
                    <div className="h-4 bg-muted rounded w-full mb-2"></div>
                    <div className="h-4 bg-muted rounded w-2/3"></div>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {filteredBrands.map((brand) => (
                  <Card key={brand.id} className="overflow-hidden">
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                          <BrandLogo src={brand.logo_url || getBrandLogo(brand.display_name)} brandName={brand.display_name} size="md" />
                          <div>
                            <CardTitle className="text-lg flex items-center gap-2">
                              {brand.display_name}
                              {brand.scraping_active && (
                                <RefreshCw className="w-4 h-4 text-primary animate-spin" />
                              )}
                            </CardTitle>
                            <div className="flex items-center gap-2 mt-1">
                              <Badge className={getPlatformColor(brand.platform_type)}>
                                {brand.platform_type}
                              </Badge>
                              {brand.auto_create_products && (
                                <Badge variant="outline" className="text-primary border-primary/30">
                                  <Zap className="w-3 h-3 mr-1" />
                                  Auto
                                </Badge>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {brand.has_amazon_store && (
                            <>
                              {/* Discover Amazon Products Button - Cyan */}
                              <Button
                                size="sm"
                                variant="outline"
                                className="bg-cyan-500/10 border-cyan-500/50 hover:bg-cyan-500/20 text-cyan-400"
                                onClick={() => discoverAmazonProducts.mutate(brand)}
                                disabled={discoverAmazonProducts.isPending || amazonDiscoveryBrandId === brand.id}
                                title="Find Amazon products"
                              >
                                {discoverAmazonProducts.isPending && amazonDiscoveryBrandId === brand.id ? (
                                  <RefreshCw className="w-4 h-4 animate-spin" />
                                ) : (
                                  <Search className="w-4 h-4" />
                                )}
                              </Button>
                              {/* Scrape Amazon Prices Button - Orange */}
                              <Button
                                size="sm"
                                variant="outline"
                                className="bg-orange-500/10 border-orange-500/50 hover:bg-orange-500/20 text-orange-400"
                                onClick={() => scrapeAmazonPrices.mutate(brand)}
                                disabled={scrapeAmazonPrices.isPending || amazonScrapingBrandId === brand.id}
                                title="Scrape Amazon prices"
                              >
                                {scrapeAmazonPrices.isPending && amazonScrapingBrandId === brand.id ? (
                                  <RefreshCw className="w-4 h-4 animate-spin" />
                                ) : (
                                  <DollarSign className="w-4 h-4" />
                                )}
                              </Button>
                            </>
                          )}
                          <Button
                            size="sm"
                            onClick={() => triggerScrape.mutate(brand)}
                            disabled={!brand.scraping_enabled || triggerScrape.isPending || brand.scraping_active}
                          >
                            {triggerScrape.isPending || brand.scraping_active ? (
                              <RefreshCw className="w-4 h-4 animate-spin" />
                            ) : (
                              <Play className="w-4 h-4" />
                            )}
                          </Button>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      {/* Scraping Progress Bar */}
                      {scrapingBrandId === brand.id && (
                        <div className="mb-4 animate-in fade-in slide-in-from-top-2 duration-300">
                          <div className="flex items-center justify-between mb-1.5">
                            <span className="text-xs text-muted-foreground flex items-center gap-1.5">
                              <RefreshCw className="w-3 h-3 animate-spin text-primary" />
                              Scraping products...
                            </span>
                            <span className="text-xs font-medium text-primary tabular-nums">
                              {Math.round(scrapeProgress)}%
                            </span>
                          </div>
                          <Progress 
                            value={scrapeProgress} 
                            className="h-2"
                          />
                          {brand.avg_scrape_duration_seconds && (
                            <p className="text-xs text-muted-foreground mt-1.5">
                              Est. ~{Math.round(brand.avg_scrape_duration_seconds)}s
                            </p>
                          )}
                        </div>
                      )}

                      {/* Amazon Scraping Progress Bar */}
                      {amazonScrapingBrandId === brand.id && (
                        <div className="mb-4 animate-in fade-in slide-in-from-top-2 duration-300">
                          <div className="flex items-center justify-between mb-1.5">
                            <span className="text-xs text-muted-foreground flex items-center gap-1.5">
                              <DollarSign className="w-3 h-3 animate-pulse text-orange-400" />
                              Scraping Amazon prices...
                            </span>
                            <span className="text-xs font-medium text-orange-400 tabular-nums">
                              {Math.round(amazonScrapeProgress)}%
                            </span>
                          </div>
                          <Progress 
                            value={amazonScrapeProgress} 
                            className="h-2 [&>div]:bg-orange-500"
                          />
                        </div>
                      )}

                      {/* Amazon Discovery Progress Bar */}
                      {amazonDiscoveryBrandId === brand.id && (
                        <div className="mb-4 animate-in fade-in slide-in-from-top-2 duration-300">
                          <div className="flex items-center justify-between mb-1.5">
                            <span className="text-xs text-muted-foreground flex items-center gap-1.5">
                              <Search className="w-3 h-3 animate-pulse text-cyan-400" />
                              Discovering Amazon products...
                            </span>
                            <span className="text-xs font-medium text-cyan-400 tabular-nums">
                              {Math.round(amazonDiscoveryProgress)}%
                            </span>
                          </div>
                          <Progress 
                            value={amazonDiscoveryProgress} 
                            className="h-2 [&>div]:bg-cyan-500"
                          />
                        </div>
                      )}
                      <div className="grid grid-cols-5 gap-2 mb-3 text-center">
                        <div>
                          <p className="text-lg font-semibold text-foreground">{brand.product_count || 0}</p>
                          <p className="text-xs text-muted-foreground">Products</p>
                        </div>
                        <div>
                          <p className="text-lg font-semibold text-green-500">{brand.products_created || 0}</p>
                          <p className="text-xs text-muted-foreground">Created</p>
                        </div>
                        <div>
                          <p className="text-lg font-semibold text-foreground">{brand.products_with_prices || 0}</p>
                          <p className="text-xs text-muted-foreground">w/ Prices</p>
                        </div>
                        <div>
                          <p className="text-lg font-semibold text-foreground">{brand.total_scrapes || 0}</p>
                          <p className="text-xs text-muted-foreground">Scrapes</p>
                        </div>
                        <div>
                          <p className="text-lg font-semibold text-foreground">
                            {brand.total_scrapes > 0 
                              ? `${Math.round(((brand.successful_scrapes || 0) / brand.total_scrapes) * 100)}%`
                              : "N/A"
                            }
                          </p>
                          <p className="text-xs text-muted-foreground">Success</p>
                        </div>
                      </div>

                      {/* Enrichment Stats Row */}
                      <div className="flex items-center justify-between gap-2 py-2 px-3 bg-muted/30 rounded-lg mb-3">
                        <div className="flex items-center gap-1.5">
                          <Image className="w-3.5 h-3.5 text-cyan-500" />
                          <span className="text-sm font-medium text-foreground">{brand.products_with_images || 0}</span>
                          <span className="text-xs text-muted-foreground">images</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <FileText className="w-3.5 h-3.5 text-amber-500" />
                          <span className="text-sm font-medium text-foreground">{brand.products_with_tds || 0}</span>
                          <span className="text-xs text-muted-foreground">TDS</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <Barcode className="w-3.5 h-3.5 text-purple-500" />
                          <span className="text-sm font-medium text-foreground">{brand.products_with_codes || 0}</span>
                          <span className="text-xs text-muted-foreground">codes</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <Tag className="w-3.5 h-3.5 text-emerald-500" />
                          <span className="text-sm font-medium text-foreground">{brand.products_with_mpn || 0}</span>
                          <span className="text-xs text-muted-foreground">MPN</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <Palette className="w-3.5 h-3.5 text-pink-500" />
                          <span className="text-sm font-medium text-foreground">{brand.products_with_color_hex || 0}</span>
                          <span className="text-xs text-muted-foreground">colors</span>
                        </div>
                        {brand.has_amazon_store && (
                          <>
                            <div className="flex items-center gap-1.5">
                              <Link className="w-3.5 h-3.5 text-cyan-500" />
                              <span className="text-sm font-medium text-cyan-400">{brand.products_with_amazon_links || 0}</span>
                              <span className="text-xs text-muted-foreground">links</span>
                            </div>
                            <div className="flex items-center gap-1.5">
                              <DollarSign className="w-3.5 h-3.5 text-orange-500" />
                              <span className="text-sm font-medium text-orange-400">{brand.products_with_amazon_prices || 0}</span>
                              <span className="text-xs text-muted-foreground">$</span>
                            </div>
                          </>
                        )}
                      </div>

                      {/* Amazon Store URL Section */}
                      <div className="flex items-center gap-2 py-2 px-3 bg-orange-500/5 rounded-lg mb-3 border border-orange-500/20">
                        <ShoppingCart className="w-4 h-4 text-orange-400 flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          {editingAmazonUrl?.id === brand.id ? (
                            <div className="flex items-center gap-2">
                              <Input
                                value={editingAmazonUrl.url}
                                onChange={(e) => setEditingAmazonUrl({ id: brand.id, url: e.target.value })}
                                placeholder="https://www.amazon.com/s?k=brand+filament"
                                className="h-8 text-xs bg-background"
                              />
                              <Button
                                size="sm"
                                variant="ghost"
                                className="h-8 px-2"
                                onClick={() => updateAmazonStoreUrl.mutate({ 
                                  id: brand.id, 
                                  url: editingAmazonUrl.url 
                                })}
                                disabled={updateAmazonStoreUrl.isPending}
                              >
                                {updateAmazonStoreUrl.isPending ? (
                                  <RefreshCw className="w-3 h-3 animate-spin" />
                                ) : (
                                  <CheckCircle2 className="w-3 h-3 text-green-500" />
                                )}
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                className="h-8 px-2"
                                onClick={() => setEditingAmazonUrl(null)}
                              >
                                <XCircle className="w-3 h-3 text-red-500" />
                              </Button>
                            </div>
                          ) : (
                            <div className="flex items-center gap-2">
                              <span className="text-xs text-muted-foreground truncate flex-1">
                                {brand.amazon_store_url || "No Amazon URL set"}
                              </span>
                              <Button
                                size="sm"
                                variant="ghost"
                                className="h-6 px-2"
                                onClick={() => setEditingAmazonUrl({ 
                                  id: brand.id, 
                                  url: brand.amazon_store_url || "" 
                                })}
                              >
                                <Pencil className="w-3 h-3" />
                              </Button>
                              {brand.amazon_store_url && (
                                <a
                                  href={brand.amazon_store_url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-orange-400 hover:text-orange-300"
                                >
                                  <ExternalLink className="w-3 h-3" />
                                </a>
                              )}
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Controls Row */}
                      <div className="flex items-center justify-between py-3 border-t border-border">
                        <div className="flex items-center gap-4">
                          <div className="flex items-center gap-2">
                            <Switch
                              checked={brand.scraping_enabled}
                              onCheckedChange={(checked) => toggleScraping.mutate({ id: brand.id, enabled: checked })}
                            />
                            <span className="text-sm text-muted-foreground">Enabled</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Switch
                              checked={brand.auto_create_products}
                              onCheckedChange={(checked) => toggleAutoCreate.mutate({ id: brand.id, enabled: checked })}
                            />
                            <span className="text-sm text-muted-foreground">Auto-Create</span>
                          </div>
                        </div>
                        <span className="text-xs text-muted-foreground">
                          {brand.last_scrape_at 
                            ? `Last: ${new Date(brand.last_scrape_at).toLocaleDateString()}`
                            : "Never scraped"
                          }
                        </span>
                      </div>

                      {/* Affiliate Settings Section */}
                      <BrandAffiliateSettings
                        brandId={brand.id}
                        brandName={brand.brand_name}
                        brandSlug={brand.brand_slug}
                      />

                      {/* Error Display */}
                      {brand.last_error && (
                        <div className="flex items-start gap-2 mt-3 p-2 bg-destructive/10 rounded text-sm">
                          <AlertCircle className="w-4 h-4 text-destructive shrink-0 mt-0.5" />
                          <div>
                            <p className="font-medium text-destructive">Last Error:</p>
                            <p className="text-muted-foreground text-xs line-clamp-2">{brand.last_error}</p>
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          {/* Sync Logs Tab */}
          <TabsContent value="logs">
            {logsLoading ? (
              <div className="space-y-2">
                {[...Array(5)].map((_, i) => (
                  <Card key={i} className="p-4 animate-pulse">
                    <div className="h-4 bg-muted rounded w-full"></div>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="space-y-2">
                {syncLogs?.map((log) => (
                  <Collapsible key={log.id} open={expandedLogs.has(log.id)}>
                    <Card className="overflow-hidden">
                      <CollapsibleTrigger 
                        className="w-full p-4 text-left hover:bg-muted/30 transition-colors"
                        onClick={() => toggleLogExpanded(log.id)}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            {getStatusIcon(log.status)}
                            <div>
                              <p className="font-medium text-foreground">{log.brand_slug}</p>
                              <p className="text-xs text-muted-foreground">
                                {new Date(log.started_at).toLocaleString()} • {log.sync_type}
                                {log.triggered_by && ` • ${log.triggered_by}`}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-4">
                            <div className="flex items-center gap-6 text-sm">
                              <div className="text-center">
                                <p className="font-medium text-foreground">{log.products_discovered || 0}</p>
                                <p className="text-xs text-muted-foreground">Discovered</p>
                              </div>
                              <div className="text-center">
                                <p className="font-medium text-green-500">{log.products_created || 0}</p>
                                <p className="text-xs text-muted-foreground">Created</p>
                              </div>
                              <div className="text-center">
                                <p className="font-medium text-foreground">{log.products_updated || 0}</p>
                                <p className="text-xs text-muted-foreground">Updated</p>
                              </div>
                              <div className="text-center">
                                <p className="font-medium text-foreground">{log.price_changes || 0}</p>
                                <p className="text-xs text-muted-foreground">Prices</p>
                              </div>
                              <div className="text-center">
                                <p className="font-medium text-foreground">
                                  {log.duration_seconds ? `${log.duration_seconds.toFixed(1)}s` : "-"}
                                </p>
                                <p className="text-xs text-muted-foreground">Duration</p>
                              </div>
                            </div>
                            {(hasEnrichmentData(log) || log.error_details || log.products_processed) && (
                              expandedLogs.has(log.id) ? (
                                <ChevronUp className="w-4 h-4 text-muted-foreground" />
                              ) : (
                                <ChevronDown className="w-4 h-4 text-muted-foreground" />
                              )
                            )}
                          </div>
                        </div>
                      </CollapsibleTrigger>

                      <CollapsibleContent>
                        <div className="px-4 pb-4 space-y-4">
                          {/* Enrichment Stats */}
                          {log.success_details && hasEnrichmentData(log) && (
                            <div className="p-3 bg-muted/30 rounded-lg">
                              <p className="text-sm font-medium text-foreground mb-2">Data Enrichment</p>
                              <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
                                {(log.success_details.imagesAdded || 0) > 0 && (
                                  <div className="flex items-center gap-2">
                                    <Image className="w-4 h-4 text-cyan-500" />
                                    <span className="text-sm">{log.success_details.imagesAdded} images</span>
                                  </div>
                                )}
                                {(log.success_details.tdsUrlsFound || 0) > 0 && (
                                  <div className="flex items-center gap-2">
                                    <FileText className="w-4 h-4 text-amber-500" />
                                    <span className="text-sm">{log.success_details.tdsUrlsFound} TDS</span>
                                  </div>
                                )}
                                {(log.success_details.mpnsExtracted || 0) > 0 && (
                                  <div className="flex items-center gap-2">
                                    <Tag className="w-4 h-4 text-purple-500" />
                                    <span className="text-sm">{log.success_details.mpnsExtracted} MPNs</span>
                                  </div>
                                )}
                                {(log.success_details.barcodesAdded || 0) > 0 && (
                                  <div className="flex items-center gap-2">
                                    <Barcode className="w-4 h-4 text-blue-500" />
                                    <span className="text-sm">{log.success_details.barcodesAdded} barcodes</span>
                                  </div>
                                )}
                                {(log.success_details.colorHexCaptured || 0) > 0 && (
                                  <div className="flex items-center gap-2">
                                    <Palette className="w-4 h-4 text-pink-500" />
                                    <span className="text-sm">{log.success_details.colorHexCaptured} colors</span>
                                  </div>
                                )}
                                {(log.success_details.tempSpecsExtracted || 0) > 0 && (
                                  <div className="flex items-center gap-2">
                                    <Thermometer className="w-4 h-4 text-orange-500" />
                                    <span className="text-sm">{log.success_details.tempSpecsExtracted} temps</span>
                                  </div>
                                )}
                              </div>
                            </div>
                          )}

                          {/* Products Processed Lists */}
                          {log.products_processed && (
                            <div className="space-y-2">
                              {log.products_processed.created && log.products_processed.created.length > 0 && (
                                <div>
                                  <p className="text-xs font-medium text-green-500 mb-1">
                                    Created ({log.products_processed.created.length})
                                  </p>
                                  <p className="text-xs text-muted-foreground line-clamp-2">
                                    {log.products_processed.created.slice(0, 10).join(", ")}
                                    {log.products_processed.created.length > 10 && ` (+${log.products_processed.created.length - 10} more)`}
                                  </p>
                                </div>
                              )}
                              {log.products_processed.updated && log.products_processed.updated.length > 0 && (
                                <div>
                                  <p className="text-xs font-medium text-primary mb-1">
                                    Updated ({log.products_processed.updated.length})
                                  </p>
                                  <p className="text-xs text-muted-foreground line-clamp-2">
                                    {log.products_processed.updated.slice(0, 10).join(", ")}
                                    {log.products_processed.updated.length > 10 && ` (+${log.products_processed.updated.length - 10} more)`}
                                  </p>
                                </div>
                              )}
                              {log.products_processed.failed && log.products_processed.failed.length > 0 && (
                                <div>
                                  <p className="text-xs font-medium text-destructive mb-1">
                                    Failed ({log.products_processed.failed.length})
                                  </p>
                                  <p className="text-xs text-muted-foreground">
                                    {log.products_processed.failed.join(", ")}
                                  </p>
                                </div>
                              )}
                            </div>
                          )}

                          {/* Error Details */}
                          {log.error_details && (
                            <div className="p-2 bg-destructive/10 rounded text-xs text-destructive">
                              <p className="font-medium mb-1">Error Details:</p>
                              <pre className="whitespace-pre-wrap">
                                {typeof log.error_details === 'object' 
                                  ? JSON.stringify(log.error_details, null, 2) 
                                  : log.error_details
                                }
                              </pre>
                            </div>
                          )}
                        </div>
                      </CollapsibleContent>
                    </Card>
                  </Collapsible>
                ))}
                {(!syncLogs || syncLogs.length === 0) && (
                  <div className="text-center py-8 text-muted-foreground">
                    No sync logs yet. Trigger a scrape to see activity.
                  </div>
                )}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default AdminBrands;
