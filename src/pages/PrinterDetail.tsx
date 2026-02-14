import { useParams, Link } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import SpecsDrawerSection from "@/components/printer/SpecsDrawerSection";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AccessoryPriceChart } from "@/components/AccessoryPriceChart";
import { PrinterPriceChart } from "@/components/PrinterPriceChart";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useState, useEffect, useCallback } from "react";
import { useRecentlyViewed } from "@/hooks/useRecentlyViewed";
import { 
  PrinterTabNav, 
  PrinterTabContent,
  OverviewTabContent,
  SpecificationsTabContent,
  MaterialsTabContent,
  ConnectivityTabContent,
  PricingTabContent,
  type PrinterTab 
} from "@/components/printer/PrinterTabNav";
import { useAffiliateLinks } from "@/hooks/useAffiliateLinks";
import { useCurrency } from "@/hooks/useCurrency";
import { 
  checkHotendPrinterCompatibility, 
  checkBuildPlatePrinterCompatibility, 
  checkAmsPrinterCompatibility 
} from "@/lib/accessoryCompatibility";
import { AccessoryCompatibilityBadge } from "@/components/AccessoryCompatibilityBadge";
import { FirmwareSection } from "@/components/FirmwareSection";
import { SoftwareSection } from "@/components/SoftwareSection";
import BuildVolumeVisualization from "@/components/printer/BuildVolumeVisualization";
import { SocialProofBadges } from "@/components/printer/SocialProofBadges";
import { DataQualityIndicator } from "@/components/printer/DataQualityIndicator";
import AdvantageCardsSection from "@/components/printer/AdvantageCardsSection";
import { PriceSection } from "@/components/printer/PriceSection";
import { CTAButtons } from "@/components/printer/CTAButtons";
import { SimilarPrintersSection } from "@/components/printer/SimilarPrintersSection";
import { SocialProofSidebar, MobileSocialProof } from "@/components/printer/SocialProofSidebar";
import { FAQSection } from "@/components/printer/FAQSection";
import { generatePrinterDescription } from "@/lib/printerBenefitsGenerator";
import { PrinterHeroSection } from "@/components/printer/PrinterHeroSection";
import { PurchaseSidebar } from "@/components/printer/PurchaseSidebar";
import { MobileBottomBar } from "@/components/printer/MobileBottomBar";
import { usePrinterInventory } from "@/hooks/usePrinterInventory";
import { usePrinterCurrentPrice } from "@/hooks/usePrinterCurrentPrice";
import { useUnifiedRegionalPricing } from "@/hooks/useUnifiedRegionalPricing";
import { 
  useTrackPrinterView, 
  usePrinterActivityStats
} from "@/hooks/usePrinterAnalytics";
import { useBrowseHistory } from "@/hooks/useBrowseHistory";
import { RecentlyViewedSection } from "@/components/RecentlyViewedSection";
import { useNavigate } from "react-router-dom";
import { DetailBreadcrumb } from "@/components/navigation/DetailBreadcrumb";
import {
  Box,
  Cpu,
  Gauge,
  Thermometer,
  Zap,
  DollarSign,
  Star,
  ExternalLink,
  Layers,
  Settings,
  Wifi,
  Monitor,
  Package,
  CheckCircle2,
  XCircle,
  Flame,
  Activity,
  Ruler,
  Wind,
  Power,
  Blend,
  TrendingUp,
  TrendingDown,
  ChevronLeft,
  ChevronRight,
  X,
  ImagePlus,
  Ban,
  FileCode,
  AppWindow,
  Download,
  RefreshCw,
  Calendar,
  AlertTriangle,
  Upload,
} from "lucide-react";
import { isDiscontinuedUrl } from "@/lib/urlValidation";
import { ProductSEO, ProductJsonLd, BreadcrumbSchema } from "@/components/seo";
import { toBrandSlug } from "@/utils/brandSlug";

const PrinterDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isAdmin } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { getAffiliateUrl, getAmazonUrl } = useAffiliateLinks();
  const { formatPrice } = useCurrency();
  
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [productImages, setProductImages] = useState<string[]>([]);
  const [validImages, setValidImages] = useState<Set<string>>(new Set());
  const [checkedImages, setCheckedImages] = useState<Set<string>>(new Set());
  const [imageDialogOpen, setImageDialogOpen] = useState(false);
  const [newImageUrl, setNewImageUrl] = useState("");
  const [imagePreviewError, setImagePreviewError] = useState(false);
  const [isUpdatingPrices, setIsUpdatingPrices] = useState(false);
  const [storeImages, setStoreImages] = useState<string[]>([]);
  const [isLoadingStoreImages, setIsLoadingStoreImages] = useState(false);
  const [storeImagesError, setStoreImagesError] = useState<string | null>(null);
  const [isUploadingFile, setIsUploadingFile] = useState(false);
  const [uploadedFilePreview, setUploadedFilePreview] = useState<string | null>(null);
  const [brandId, setBrandId] = useState<string | null>(null);
  
  // Tab navigation state
  const [activeTab, setActiveTab] = useState<PrinterTab>("overview");
  const handleTabChange = useCallback((tab: PrinterTab) => {
    setActiveTab(tab);
  }, []);

  const { data: printer, isLoading } = useQuery({
    queryKey: ["printer-detail", id],
    queryFn: async () => {
      // Try by printer_id slug first, then by UUID
      const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id || '');
      
      const { data, error } = await supabase
        .from("printers")
        .select(`
          *,
          brand:printer_brands!brand_id(brand, warranty_years, warranty_coverage),
          series:printer_series!series_id(series_name)
        `)
        .eq(isUUID ? "id" : "printer_id", id)
        .maybeSingle();

      if (error) throw error;
      return data;
    },
  });

  // Fetch real inventory data
  const { data: inventoryData } = usePrinterInventory(printer?.id);

  // Track page view and fetch real analytics
  useTrackPrinterView(printer?.id);
  const { data: activityStats } = usePrinterActivityStats(printer?.id);
  
  // Track browse history
  const { addToHistory } = useBrowseHistory();
  const { addItem: addRecentlyViewed } = useRecentlyViewed();
  useEffect(() => {
    if (printer?.id) {
      addToHistory(printer.id, 'printer');
      const brand = typeof printer.brand === 'object' && printer.brand !== null && 'brand' in printer.brand
        ? (printer.brand as any).brand : "";
      addRecentlyViewed({
        id: printer.id,
        name: printer.model_name || "Unknown Printer",
        brand: brand || "",
        price: printer.current_price_usd_store ? `$${printer.current_price_usd_store.toFixed(2)}` : "",
        image: (printer as any).featured_image || null,
        url: `/printer/${printer.printer_id || printer.id}`,
        type: "printer",
      });
    }
  }, [printer?.id]);


  // Fetch live price from store
  const { 
    currentPrice: livePrice, 
    compareAtPrice: liveCompareAtPrice,
    isLoading: priceLoading, 
    isLivePrice,
    currency: livePriceCurrency
  } = usePrinterCurrentPrice(
    printer?.official_store_url, 
    printer?.current_price_usd_store ?? null
  );

  // Use live price if available, otherwise fall back to database price
  const displayPrice = isLivePrice && livePrice !== null ? livePrice : printer?.current_price_usd_store;
  const displayMsrp = isLivePrice && liveCompareAtPrice ? liveCompareAtPrice : printer?.msrp_usd;

  const printerBrand = typeof printer?.brand === 'object' && printer?.brand !== null && 'brand' in printer.brand 
    ? printer.brand.brand 
    : null;

  // Get regional pricing and store URL using unified hook
  const unifiedPricing = useUnifiedRegionalPricing({
    brandName: printerBrand || '',
    productSlug: printer?.printer_id || '',
    basePrice: displayPrice ?? null,
    baseCurrency: 'USD',
    originalUrl: printer?.official_store_url || null,
    priceLastVerifiedAt: (printer as any)?.prices_last_updated_at,
    priceSource: (printer as any)?.price_source,
    priceConfidence: (printer as any)?.price_confidence,
    // Pass actual regional store prices for printers (prioritize actual prices over MSRP conversion)
    regionalPrices: {
      price_cad: (printer as any)?.current_price_cad_store ?? (printer as any)?.msrp_cad,
      price_eur: (printer as any)?.current_price_eur_store ?? (printer as any)?.msrp_eur,
      price_gbp: (printer as any)?.current_price_gbp_store,
      price_aud: (printer as any)?.current_price_aud_store,
      price_jpy: (printer as any)?.current_price_jpy_store,
    },
  });

  // Fetch brandId from automated_brands for regional store lookups
  useEffect(() => {
    const fetchBrandId = async () => {
      if (!printerBrand) {
        setBrandId(null);
        return;
      }
      const { data } = await supabase
        .from('automated_brands')
        .select('id')
        .ilike('brand_name', printerBrand)
        .limit(1)
        .maybeSingle();
      setBrandId(data?.id || null);
    };
    fetchBrandId();
  }, [printerBrand]);

  const { data: accessories } = useQuery({
    queryKey: ["printer-accessories", printer?.id, printerBrand, printer?.model_name],
    enabled: !!printer?.id,
    queryFn: async () => {
      // Fetch printer-specific accessories
      const { data: printerSpecific, error: error1 } = await supabase
        .from("printer_accessories")
        .select("*")
        .eq("printer_id", printer!.id);

      if (error1) throw error1;

      // Fetch brand-compatible accessories (where brand is in compatible_printer_brands array)
      let brandCompatible: typeof printerSpecific = [];
      if (printerBrand) {
        const { data: brandData, error: error2 } = await supabase
          .from("printer_accessories")
          .select("*")
          .contains("compatible_printer_brands", [printerBrand]);

        if (error2) throw error2;
        brandCompatible = brandData || [];
      }

      // Merge and deduplicate by id
      const allAccessories = [...(printerSpecific || []), ...brandCompatible];
      const uniqueAccessories = allAccessories.filter(
        (acc, index, self) => index === self.findIndex((a) => a.id === acc.id)
      );

        // Filter accessories using unified compatibility service
        const modelFilteredAccessories = uniqueAccessories.filter(acc => {
          // Use accessory compatibility service for consistent checking
          if (acc.accessory_type === 'build_plate') {
            const result = checkBuildPlatePrinterCompatibility(acc, printer!);
            return result.is_compatible;
          }
          
          if (acc.accessory_type === 'ams_mmu') {
            const result = checkAmsPrinterCompatibility(acc, printer!);
            return result.is_compatible;
          }
          
          // Hotends (accessory_type === 'nozzle' or 'hotend')
          if (acc.accessory_type === 'nozzle' || acc.accessory_type === 'hotend') {
            const result = checkHotendPrinterCompatibility(acc, printer!);
            return result.is_compatible;
          }
          
          // Unknown accessory type - include by default
          return true;
        });

      // Sort by accessory_type then name
      return modelFilteredAccessories.sort((a, b) => {
        const typeCompare = (a.accessory_type || "").localeCompare(b.accessory_type || "");
        if (typeCompare !== 0) return typeCompare;
        return (a.name || "").localeCompare(b.name || "");
      });
    },
  });

  // Mutation to update printer product images
  const updateImageMutation = useMutation({
    mutationFn: async (imageUrl: string) => {
      const { error } = await supabase
        .from("printers")
        .update({
          scraped_data: {
            ...(printer?.scraped_data as object || {}),
            images: {
              ...((printer?.scraped_data as any)?.images || {}),
              product_images: [imageUrl]
            }
          }
        })
        .eq("id", printer!.id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      toast({ title: "Success", description: "Product image updated" });
      queryClient.invalidateQueries({ queryKey: ["printer-detail", id] });
      setImageDialogOpen(false);
      setNewImageUrl("");
      setUploadedFilePreview(null);
    },
    onError: (error) => {
      toast({ 
        title: "Error", 
        description: error.message || "Failed to update image",
        variant: "destructive"
      });
    }
  });

  // Handle file upload
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !printer) return;

    // Validate file type
    const allowedTypes = ['image/png', 'image/jpeg', 'image/webp', 'image/gif'];
    if (!allowedTypes.includes(file.type)) {
      toast({
        title: "Invalid file type",
        description: "Please upload a PNG, JPEG, WebP, or GIF image",
        variant: "destructive"
      });
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "File too large",
        description: "Please upload an image smaller than 5MB",
        variant: "destructive"
      });
      return;
    }

    setIsUploadingFile(true);
    try {
      // Generate a unique filename
      const ext = file.name.split('.').pop()?.toLowerCase() || 'png';
      const sanitizedModelName = printer.model_name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/-+/g, '-')
        .replace(/^-|-$/g, '');
      const timestamp = Date.now();
      const fileName = `${sanitizedModelName}-${timestamp}.${ext}`;
      const filePath = `printers/${fileName}`;

      // Upload to storage
      const { error: uploadError } = await supabase.storage
        .from('printer-images')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) throw uploadError;

      // Get the public URL
      const { data: { publicUrl } } = supabase.storage
        .from('printer-images')
        .getPublicUrl(filePath);

      // Set the URL for preview and selection
      setNewImageUrl(publicUrl);
      setUploadedFilePreview(publicUrl);
      setImagePreviewError(false);
      
      toast({
        title: "Upload complete",
        description: "Image uploaded. Click CONFIRM to save."
      });
    } catch (error: any) {
      toast({
        title: "Upload failed",
        description: error.message || "Failed to upload image",
        variant: "destructive"
      });
    } finally {
      setIsUploadingFile(false);
    }
  };

  // Fetch images from store URL
  const fetchStoreImages = async () => {
    if (!printer?.official_product_url) {
      setStoreImagesError("No store URL available");
      return;
    }
    
    setIsLoadingStoreImages(true);
    setStoreImagesError(null);
    setStoreImages([]);
    
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) {
        setStoreImagesError("Authentication required");
        return;
      }
      
      const response = await supabase.functions.invoke("fetch-store-images", {
        body: { url: printer.official_product_url },
      });
      
      if (response.error) {
        setStoreImagesError(response.error.message || "Failed to fetch images");
        return;
      }
      
      if (response.data?.success && response.data?.images) {
        setStoreImages(response.data.images);
        if (response.data.images.length === 0) {
          setStoreImagesError("No images found on the store page");
        }
      } else {
        setStoreImagesError(response.data?.error || "Failed to fetch images");
      }
    } catch (error) {
      console.error("Error fetching store images:", error);
      setStoreImagesError(error instanceof Error ? error.message : "Unknown error");
    } finally {
      setIsLoadingStoreImages(false);
    }
  };

  // Fetch store images when dialog opens
  useEffect(() => {
    if (imageDialogOpen && printer?.official_product_url) {
      fetchStoreImages();
    } else if (!imageDialogOpen) {
      // Reset state when dialog closes
      setStoreImages([]);
      setStoreImagesError(null);
      setNewImageUrl("");
    }
  }, [imageDialogOpen, printer?.official_product_url]);


  useEffect(() => {
    const validateImages = async (images: string[]) => {
      const valid = new Set<string>();
      const checked = new Set<string>();
      
      await Promise.all(
        images.map(async (url) => {
          checked.add(url);
          try {
            const img = new Image();
            await new Promise<void>((resolve, reject) => {
              img.onload = () => resolve();
              img.onerror = () => reject();
              img.src = url;
            });
            valid.add(url);
          } catch {
            // Image failed to load
          }
        })
      );
      
      setValidImages(valid);
      setCheckedImages(checked);
    };

    try {
      if (printer?.scraped_data) {
        const scrapedData = printer.scraped_data as any;
        const images = scrapedData?.images?.product_images;
        if (Array.isArray(images) && images.length > 0) {
          setProductImages(images);
          validateImages(images);
        } else {
          setProductImages([]);
          setValidImages(new Set());
          setCheckedImages(new Set());
        }
      }
    } catch (error) {
      console.error("Error extracting product images:", error);
      setProductImages([]);
      setValidImages(new Set());
      setCheckedImages(new Set());
    }
  }, [printer]);

  const openLightbox = (index: number) => {
    setCurrentImageIndex(index);
    setLightboxOpen(true);
  };

  // Show images immediately; filter only after validation completes
  const displayImages = checkedImages.size === 0
    ? productImages
    : productImages.filter(img => validImages.has(img));

  const nextImage = () => {
    if (displayImages.length > 0) {
      setCurrentImageIndex((prev) => (prev + 1) % displayImages.length);
    }
  };

  const prevImage = () => {
    if (displayImages.length > 0) {
      setCurrentImageIndex((prev) => (prev - 1 + displayImages.length) % displayImages.length);
    }
  };


  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-accent/5 p-8">
        <div className="max-w-7xl mx-auto">
          <div className="animate-pulse space-y-8">
            <div className="h-8 bg-muted rounded w-1/4"></div>
            <div className="h-64 bg-muted rounded"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="h-48 bg-muted rounded"></div>
              <div className="h-48 bg-muted rounded"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!printer) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-accent/5 p-8">
        <div className="max-w-7xl mx-auto text-center">
          <h1 className="text-2xl font-bold mb-4">Printer not found</h1>
          <Link to="/printers">
            <Button>Back to Printers</Button>
          </Link>
        </div>
      </div>
    );
  }

  const brand = typeof printer.brand === 'object' && printer.brand !== null && 'brand' in printer.brand 
    ? printer.brand.brand 
    : null;
  const series = typeof printer.series === 'object' && printer.series !== null && 'series_name' in printer.series 
    ? printer.series.series_name 
    : null;

  const SpecRow = ({ label, value, unit = "" }: { label: string; value: any; unit?: string }) => {
    if (value === null || value === undefined) return null;
    
    const displayValue = typeof value === "boolean" 
      ? (value ? "Yes" : "No")
      : `${value}${unit}`;

    const icon = typeof value === "boolean" 
      ? (value ? <CheckCircle2 className="h-4 w-4 text-green-500" /> : <XCircle className="h-4 w-4 text-muted" />)
      : null;

    return (
      <div className="flex justify-between items-center py-3 border-b border-border/30 last:border-0 hover:bg-muted/30 px-3 rounded transition-colors">
        <span className="text-sm text-muted-foreground">{label}</span>
        <div className="flex items-center gap-2">
          <span className="font-semibold text-sm">{displayValue}</span>
          {icon}
        </div>
      </div>
    );
  };

  const SpecSection = ({ title, icon: Icon, children }: { title: string; icon: any; children: React.ReactNode }) => (
    <Card className="overflow-hidden border-2">
      <div className="bg-gradient-to-r from-muted/50 to-background p-4 border-b">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-primary/10">
            <Icon className="h-5 w-5 text-primary" />
          </div>
          <h3 className="text-lg font-semibold">{title}</h3>
        </div>
      </div>
      <div className="p-6 space-y-1">{children}</div>
    </Card>
  );

  // Build SEO description
  const printerModel = printer.model_name || printer.printer_id || 'Unknown Printer';
  const printerName = `${printerBrand || ''} ${printerModel}`.trim();
  const isDiscontinued = printer.discontinued === true;
  
  const buildVolumeDisplay = printer.build_volume_x_mm && printer.build_volume_y_mm && printer.build_volume_z_mm
    ? `${printer.build_volume_x_mm}×${printer.build_volume_y_mm}×${printer.build_volume_z_mm}mm`
    : null;
  const speedDisplay = printer.max_print_speed_mms ? `up to ${printer.max_print_speed_mms}mm/s` : null;
  const printerPriceDisplay = displayPrice ? `from ${formatPrice(displayPrice)}` : null;
  const seoDescParts = [
    `Buy ${printerName} 3D printer`,
    buildVolumeDisplay || speedDisplay ? ' — ' : '',
    [buildVolumeDisplay, speedDisplay].filter(Boolean).join(', '),
    printerPriceDisplay ? `, ${printerPriceDisplay}` : '',
    '. Detailed specs and price comparison on FilaScope.',
  ];
  const seoDescription = seoDescParts.join('').replace(/\s+/g, ' ').trim();

  // Get primary image for SEO
  const seoImage = productImages[0] || null;

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-background to-muted/20 pb-20 lg:pb-0">
      {/* Breadcrumb Schema */}
      <BreadcrumbSchema items={[
        { name: 'Home', url: 'https://filascope.com/' },
        { name: 'Printers', url: 'https://filascope.com/printers' },
        { name: printerName, url: `https://filascope.com/printers/${printer.printer_id || id}` },
      ]} />
      {/* SEO Meta Tags */}
      <ProductSEO
        title={printerName}
        description={seoDescription}
        canonicalUrl={`/printers/${printer.printer_id || id}`}
        image={seoImage}
        brand={printerBrand}
        price={displayPrice}
        availability={!isDiscontinued}
        productType="printer"
      />
      
      {/* JSON-LD Structured Data */}
      <ProductJsonLd
        name={printerName}
        description={seoDescription}
        image={seoImage}
        brand={printerBrand}
        sku={printer.printer_id}
        url={`https://filascope.com/printers/${printer.printer_id || printer.id}`}
        price={displayPrice}
        availability={!isDiscontinued}
        buildVolume={printer.build_volume_x_mm && printer.build_volume_y_mm && printer.build_volume_z_mm ? {
          x: printer.build_volume_x_mm,
          y: printer.build_volume_y_mm,
          z: printer.build_volume_z_mm,
        } : null}
        maxPrintSpeed={printer.max_print_speed_mms}
        printerType={printer.printer_technology}
        nozzleTempMax={printer.max_nozzle_temp_c}
        bedTempMax={printer.bed_max_temp_c}
      />

      <div className="max-w-[1400px] mx-auto p-4 lg:p-8">
        {/* Navigation */}
        <DetailBreadcrumb
          segments={[
            { label: "Printers", href: "/printers" },
            ...(printerBrand ? [{ label: printerBrand, href: `/printers?brand=${toBrandSlug(printerBrand)}` }] : []),
            { label: printerModel, href: `/printers/${printer.printer_id || printer.id}` },
          ]}
          mobileBackLabel="Printers"
        />

        {/* Main Content with Sticky Sidebar Container - spans full page */}
        <div className="flex gap-6 lg:gap-8 items-start">
          {/* Main Content Column */}
          <div className="flex-1 min-w-0 space-y-6 lg:space-y-8">
            {/* Hero Section */}
            <div className="relative bg-card/50 backdrop-blur-sm border border-border/50 rounded-xl lg:rounded-2xl py-6 md:py-8 lg:py-10 px-4 md:px-6 lg:px-10 !mb-0">
              
              {/* Admin: Update Image & Refresh Prices Buttons */}
              {isAdmin && (
                <div className="absolute top-4 right-6 flex gap-3 z-10">
                  <button
                    className="opacity-30 hover:opacity-70 transition-opacity text-[10px] text-gray-500 font-mono uppercase tracking-wider inline-flex items-center"
                    onClick={(e) => {
                      e.stopPropagation();
                      setImageDialogOpen(true);
                    }}
                  >
                    <ImagePlus size={10} className="mr-1.5" />
                    Update Image
                  </button>
                  <button
                    className="opacity-30 hover:opacity-70 transition-opacity text-[10px] text-gray-500 font-mono uppercase tracking-wider inline-flex items-center disabled:opacity-20"
                    disabled={isUpdatingPrices}
                    onClick={async (e) => {
                      e.stopPropagation();
                      setIsUpdatingPrices(true);
                      try {
                        const response = await supabase.functions.invoke('fetch-printer-prices', {
                          body: { printerIds: [printer.id] }
                        });
                        
                        if (response.error) {
                          throw new Error(response.error.message || 'Failed to fetch prices');
                        }
                        
                        const result = response.data;
                        if (result?.results?.[0]) {
                          const printerResult = result.results[0];
                          if (printerResult.success && printerResult.prices) {
                            const { msrp_usd, current_price_usd_store } = printerResult.prices;
                            toast({
                              title: "Prices Updated",
                              description: `MSRP: ${msrp_usd ? `$${msrp_usd}` : 'N/A'}, Store: ${current_price_usd_store ? `$${current_price_usd_store}` : 'N/A'}`
                            });
                          } else {
                            toast({
                              title: "No Prices Found",
                              description: printerResult.error || "Could not extract prices from the product page",
                              variant: "destructive"
                            });
                          }
                        }
                        
                        queryClient.invalidateQueries({ queryKey: ["printer-detail", id] });
                      } catch (error: any) {
                        toast({
                          title: "Error",
                          description: error.message || "Failed to update prices",
                          variant: "destructive"
                        });
                      } finally {
                        setIsUpdatingPrices(false);
                      }
                    }}
                  >
                    <RefreshCw size={10} className={`mr-1.5 ${isUpdatingPrices ? 'animate-spin' : ''}`} />
                    {isUpdatingPrices ? 'Syncing...' : 'Refresh Prices'}
                  </button>
                </div>
              )}

              {/* Hero Section Content */}
              {(() => {
                const heroDisplayImages = productImages.filter(img => validImages.has(img));
                const isLoadingImages = productImages.length > 0 && checkedImages.size < productImages.length;
                
                if (isLoadingImages) {
                  return (
                    <div className="grid grid-cols-1 lg:grid-cols-[45%_55%] gap-8 lg:gap-10 items-start">
                      <div className="aspect-square bg-muted/30 rounded-xl border border-border/50 flex items-center justify-center">
                        <span className="text-sm text-muted-foreground animate-pulse">
                          Loading images...
                        </span>
                      </div>
                      <div className="space-y-4">
                        <div className="h-6 bg-muted/30 rounded w-1/4 animate-pulse" />
                        <div className="h-10 bg-muted/30 rounded w-3/4 animate-pulse" />
                        <div className="h-20 bg-muted/30 rounded animate-pulse" />
                      </div>
                    </div>
                  );
                }
                
                return (
                  <PrinterHeroSection
                    printer={printer}
                    brand={brand}
                    displayImages={heroDisplayImages}
                    isAdmin={isAdmin}
                    onOpenLightbox={openLightbox}
                  />
                );
              })()}
            </div>

            {/* Tab Navigation - Sticky below hero */}
            {(() => {
              // Count non-null spec fields
              const specFields = [
                'build_volume_x_mm', 'build_volume_y_mm', 'build_volume_z_mm', 'build_volume_shape',
                'machine_width_mm', 'machine_depth_mm', 'machine_height_mm', 'machine_weight_kg',
                'frame_material', 'machine_style', 'max_print_speed_mms', 'max_travel_speed_mms',
                'max_acceleration_mms2', 'layer_resolution_min_um', 'layer_resolution_max_um',
                'xy_positioning_accuracy_um', 'z_positioning_accuracy_um', 'filament_diameter_mm',
                'nozzle_diameter_default_mm', 'max_nozzle_temp_c', 'bed_max_temp_c', 'hotend_type',
                'extruder_type', 'direct_drive', 'motion_system', 'has_enclosure', 'enclosure_type',
                'auto_bed_leveling', 'bed_leveling_type', 'bed_surface_type', 'rated_power_w',
                'power_input_voltage', 'power_loss_recovery', 'has_wifi', 'has_ethernet', 'has_usb',
                'has_sd_card', 'has_camera', 'screen_type', 'screen_size_inch',
                'multi_material_supported', 'multi_material_max_spools', 'noise_level_db',
              ];
              const specsCount = specFields.filter(f => printer[f] != null && printer[f] !== '').length;

              // Count materials
              const materialsCount = printer.official_supported_materials
                ? printer.official_supported_materials.split(',').map((m: string) => m.trim()).filter(Boolean).length
                : 0;

              return (
                <PrinterTabNav
                  activeTab={activeTab}
                  onTabChange={handleTabChange}
                  tabCounts={{
                    specifications: specsCount > 0 ? specsCount : undefined,
                    materials: materialsCount > 0 ? materialsCount : undefined,
                  }}
                />
              );
            })()}

            {/* Tab Content Area */}
            <PrinterTabContent activeTab={activeTab}>
              {activeTab === "overview" && (
                <>
                  {/* Mobile Social Proof Accordion - Shows on smaller screens */}
                  {(() => {
                    // Generate staff pick reasons based on printer features
                    const staffPickReasons: string[] = [];
                    if (printer.max_print_speed_mms && printer.max_print_speed_mms >= 500) {
                      staffPickReasons.push("High-speed printing professionals");
                    }
                    if (printer.multi_material_supported) {
                      staffPickReasons.push("Multi-color and multi-material projects");
                    }
                    if (printer.has_enclosure) {
                      staffPickReasons.push("Engineering materials and enclosed printing");
                    }
                    if (printer.build_volume_x_mm && printer.build_volume_y_mm && printer.build_volume_z_mm) {
                      const volumeLiters = (printer.build_volume_x_mm * printer.build_volume_y_mm * printer.build_volume_z_mm) / 1000000;
                      if (volumeLiters > 20) {
                        staffPickReasons.push("Large format printing needs");
                      }
                    }
                    if (printer.auto_bed_leveling) {
                      staffPickReasons.push("Hassle-free setup and maintenance");
                    }
                    if (staffPickReasons.length === 0) {
                      staffPickReasons.push("Hobbyists and home users", "Beginner-friendly printing", "Great value for features");
                    }

                    // Use real activity data from analytics
                    const activityData = {
                      views: activityStats?.views_24h || 0,
                      comparisons: activityStats?.comparisons_7d || 0,
                      purchases: activityStats?.buy_clicks_7d || 0,
                    };

                    // Generate recent reviews (in production, fetch from reviews table)
                    const recentReviews = printer.rating_community_overall ? [
                      {
                        id: '1',
                        rating: 5,
                        text: 'Amazing print quality and speed. The setup was incredibly easy and I was printing within an hour of unboxing.',
                        author: 'Mike T.',
                        verified: true
                      },
                      {
                        id: '2',
                        rating: 5,
                        text: 'Best printer I\'ve owned. Worth every penny for the features and reliability.',
                        author: 'Sarah M.',
                        verified: true
                      },
                      {
                        id: '3',
                        rating: 4,
                        text: 'Great machine with excellent support. Would recommend to anyone looking for quality prints.',
                        author: 'Alex K.',
                        verified: true
                      }
                    ] : [];

                    // Use printer-level warranty if set, otherwise fall back to brand-level warranty
                    const brandData = printer.brand as { brand?: string; warranty_years?: number; warranty_coverage?: string } | null;
                    const warrantyYears = (printer as any).warranty_years ?? brandData?.warranty_years ?? null;
                    const warrantyCoverage = (printer as any).warranty_coverage ?? brandData?.warranty_coverage ?? null;
                    
                    const sidebarData = {
                      rating: printer.rating_community_overall,
                      reviewCount: printer.review_count_aggregated,
                      recentReviews,
                      staffPick: (printer.rating_community_overall || 0) >= 4.5 || (printer.current_price_usd_store || 0) > 1000,
                      staffPickReasons,
                      warrantyYears,
                      warrantyCoverage,
                      brandName: brandData?.brand || null,
                      activity: activityData
                    };

                    const handleTakeQuiz = () => {
                      navigate('/printers');
                    };

                    const scrollToRatings = () => {
                      const ratingsSection = document.querySelector('[data-section="ratings"]');
                      ratingsSection?.scrollIntoView({ behavior: 'smooth' });
                    };

                    return (
                      <div className="lg:hidden mt-6">
                        <MobileSocialProof
                          data={sidebarData}
                          onReadReviews={scrollToRatings}
                          onTakeQuiz={handleTakeQuiz}
                        />
                      </div>
                    );
                  })()}

                  {/* Community Ratings */}
                  {(printer.rating_community_overall || printer.rating_ease_of_use || printer.rating_print_quality) && (
                    <Card className="overflow-hidden" data-section="ratings">
                      <CardHeader className="pb-4">
                        <div className="flex items-center justify-between">
                          <CardTitle className="text-lg font-semibold">Community Ratings</CardTitle>
                          {printer.review_count_aggregated && (
                            <span className="text-sm text-muted-foreground">
                              {printer.review_count_aggregated} reviews
                            </span>
                          )}
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                          {printer.rating_community_overall && (
                            <div className="text-center space-y-2 p-4 bg-primary/5 rounded-xl border border-primary/20">
                              <div className="text-2xl md:text-3xl font-bold text-primary">{printer.rating_community_overall.toFixed(1)}</div>
                              <div className="flex justify-center gap-0.5">
                                {[...Array(5)].map((_, i) => (
                                  <Star key={i} className={`h-3.5 w-3.5 ${i < Math.round(printer.rating_community_overall || 0) ? 'fill-amber-400 text-amber-400' : 'text-muted-foreground/30'}`} />
                                ))}
                              </div>
                              <div className="text-xs text-muted-foreground font-medium">Overall</div>
                            </div>
                          )}
                          {printer.rating_ease_of_use && (
                            <div className="text-center space-y-2 p-4 bg-muted/30 rounded-xl border border-border/50">
                              <div className="text-2xl md:text-3xl font-bold text-foreground">{printer.rating_ease_of_use.toFixed(1)}</div>
                              <div className="flex justify-center gap-0.5">
                                {[...Array(5)].map((_, i) => (
                                  <Star key={i} className={`h-3.5 w-3.5 ${i < Math.round(printer.rating_ease_of_use || 0) ? 'fill-amber-400 text-amber-400' : 'text-muted-foreground/30'}`} />
                                ))}
                              </div>
                              <div className="text-xs text-muted-foreground font-medium">Ease of Use</div>
                            </div>
                          )}
                          {printer.rating_print_quality && (
                            <div className="text-center space-y-2 p-4 bg-muted/30 rounded-xl border border-border/50">
                              <div className="text-2xl md:text-3xl font-bold text-foreground">{printer.rating_print_quality.toFixed(1)}</div>
                              <div className="flex justify-center gap-0.5">
                                {[...Array(5)].map((_, i) => (
                                  <Star key={i} className={`h-3.5 w-3.5 ${i < Math.round(printer.rating_print_quality || 0) ? 'fill-amber-400 text-amber-400' : 'text-muted-foreground/30'}`} />
                                ))}
                              </div>
                              <div className="text-xs text-muted-foreground font-medium">Print Quality</div>
                            </div>
                          )}
                          {printer.rating_reliability && (
                            <div className="text-center space-y-2 p-4 bg-muted/30 rounded-xl border border-border/50">
                              <div className="text-2xl md:text-3xl font-bold text-foreground">{printer.rating_reliability.toFixed(1)}</div>
                              <div className="flex justify-center gap-0.5">
                                {[...Array(5)].map((_, i) => (
                                  <Star key={i} className={`h-3.5 w-3.5 ${i < Math.round(printer.rating_reliability || 0) ? 'fill-amber-400 text-amber-400' : 'text-muted-foreground/30'}`} />
                                ))}
                              </div>
                              <div className="text-xs text-muted-foreground font-medium">Reliability</div>
                            </div>
                          )}
                          {printer.rating_value_for_money && (
                            <div className="text-center space-y-2 p-4 bg-muted/30 rounded-xl border border-border/50">
                              <div className="text-2xl md:text-3xl font-bold text-foreground">{printer.rating_value_for_money.toFixed(1)}</div>
                              <div className="flex justify-center gap-0.5">
                                {[...Array(5)].map((_, i) => (
                                  <Star key={i} className={`h-3.5 w-3.5 ${i < Math.round(printer.rating_value_for_money || 0) ? 'fill-amber-400 text-amber-400' : 'text-muted-foreground/30'}`} />
                                ))}
                              </div>
                              <div className="text-xs text-muted-foreground font-medium">Value</div>
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  )}
                  
                  {/* Placeholder for other overview content */}
                  <OverviewTabContent printer={printer} brand={brand} accessories={accessories || []} />
                  
                  {/* FAQ Section - Only on Overview tab */}
                  <FAQSection
                    printerModel={printer.model_name}
                    printerBrand={brand}
                    buildVolume={printer.build_volume_x_mm && printer.build_volume_y_mm && printer.build_volume_z_mm
                      ? `${printer.build_volume_x_mm}×${printer.build_volume_y_mm}×${printer.build_volume_z_mm}mm`
                      : undefined}
                    maxSpeed={printer.max_print_speed_mms || undefined}
                    maxNozzleTemp={printer.max_nozzle_temp_c || undefined}
                    maxColors={printer.multi_material_max_spools || undefined}
                    hasEnclosure={printer.has_enclosure || undefined}
                  />
                </>
              )}

              {activeTab === "specifications" && (
                <SpecificationsTabContent printer={printer} />
              )}

              {activeTab === "materials" && (
                <MaterialsTabContent printer={printer} accessories={accessories || []} />
              )}

              {activeTab === "connectivity" && (
                <ConnectivityTabContent printer={printer} brand={brand} />
              )}

              {activeTab === "pricing" && (
                <PricingTabContent 
                  printer={printer} 
                  brand={brand} 
                  displayPrice={displayPrice}
                  displayMsrp={displayMsrp}
                  isLivePrice={isLivePrice}
                  livePriceCurrency={livePriceCurrency}
                  brandId={brandId}
                  productSlug={printer.printer_id || printer.model_name}
                  regionalDisplayPrice={unifiedPricing.displayPrice}
                  isRegionalConverted={unifiedPricing.isConverted}
                />
              )}
            </PrinterTabContent>
          </div>

          {/* Sticky Purchase Sidebar - Desktop Only */}
          {(() => {
            const heroDisplayImages = productImages.filter(img => validImages.has(img));
            const brandData = printer.brand as { brand?: string; warranty_years?: number; warranty_coverage?: string } | null;
            const warrantyYears = (printer as any).warranty_years ?? brandData?.warranty_years ?? null;
            const warrantyCoverage = (printer as any).warranty_coverage ?? brandData?.warranty_coverage ?? null;
            
            // Use regional store URL if available, otherwise fall back to original
            const regionalStoreUrl = unifiedPricing.storeUrl || printer.official_store_url;
            
            // Use regional price from unified pricing (same as mobile bar)
            const regionalPrice = unifiedPricing.displayPrice ?? displayPrice;
            const regionalMsrp = unifiedPricing.isConverted && displayMsrp 
              ? displayMsrp * (unifiedPricing.conversionRate || 1)
              : displayMsrp;
            
            return (
              <PurchaseSidebar
                printer={{
                  id: printer.id,
                  model_name: printer.model_name,
                  official_store_url: regionalStoreUrl,
                  discontinued: printer.discontinued,
                  prices_last_updated_at: unifiedPricing.lastVerifiedAt?.toISOString() ?? (printer as any).prices_last_updated_at,
                  price_source: unifiedPricing.priceSource ?? (printer as any).price_source,
                  price_confidence: unifiedPricing.priceConfidence ?? (printer as any).price_confidence,
                }}
                brand={brand}
                displayPrice={regionalPrice}
                displayMsrp={regionalMsrp}
                displayImageUrl={heroDisplayImages[0] || null}
                isLivePrice={isLivePrice}
                livePriceCurrency={livePriceCurrency}
                liveCompareAtPrice={liveCompareAtPrice}
                warrantyYears={warrantyYears}
                warrantyCoverage={warrantyCoverage}
                getAffiliateUrl={getAffiliateUrl}
                isLocalStore={unifiedPricing.isLocalStore}
                storeRegion={unifiedPricing.storeRegion}
                shipsFromCountry={unifiedPricing.shipsFromCountry}
                isConverted={unifiedPricing.isConverted}
                originalPrice={unifiedPricing.originalPrice}
                originalCurrency={unifiedPricing.originalCurrency}
                storeName={unifiedPricing.storeName}
              />
            );
          })()}
        </div>

        {/* Mobile Bottom Bar - Fixed price/buy button on mobile */}
        {(() => {
          // Use regional store URL if available
          const regionalStoreUrl = unifiedPricing.storeUrl || printer.official_store_url;
          
          // Use regional price from unified pricing (same data as Pricing tab)
          const regionalPrice = unifiedPricing.displayPrice ?? displayPrice;
          const regionalMsrp = unifiedPricing.isConverted && displayMsrp 
            ? displayMsrp * (unifiedPricing.conversionRate || 1)
            : displayMsrp;
          
          return (
            <MobileBottomBar
              price={regionalPrice}
              msrp={regionalMsrp}
              officialStoreUrl={regionalStoreUrl}
              getAffiliateUrl={getAffiliateUrl}
              brand={brand}
              isDiscontinued={printer.discontinued}
              isConverted={unifiedPricing.isConverted}
              originalPrice={unifiedPricing.originalPrice}
              originalCurrency={unifiedPricing.originalCurrency}
              isLocalStore={unifiedPricing.isLocalStore}
              storeRegion={unifiedPricing.storeRegion}
              shipsFromCountry={unifiedPricing.shipsFromCountry}
            />
          );
        })()}

        {/* Recently Viewed Section */}
        <div className="max-w-7xl mx-auto px-4 mt-8">
          <RecentlyViewedSection
            limit={5}
            excludeId={printer.id}
            showClear={false}
            compact
            title="Recently Viewed"
          />
        </div>

        {/* Similar Printers Comparison Section */}
        <SimilarPrintersSection
          currentPrinter={{
            id: printer.id,
            brand: brand,
            model: printer.model_name,
            price: printer.current_price_usd_store,
            rating: printer.rating_community_overall,
            reviewCount: printer.review_count_aggregated,
            imageUrl: displayImages[0] || null,
            buildVolume: null,
            maxSpeed: printer.max_print_speed_mms,
            maxNozzleTemp: printer.max_nozzle_temp_c,
            hasEnclosure: printer.has_enclosure || false,
            multiMaterialSupported: printer.multi_material_supported || false,
            multiMaterialMaxSpools: printer.multi_material_max_spools,
            priceTier: printer.price_tier,
            buildVolumeX: printer.build_volume_x_mm,
            buildVolumeY: printer.build_volume_y_mm,
            buildVolumeZ: printer.build_volume_z_mm,
          }}
        />


        <Dialog open={lightboxOpen} onOpenChange={setLightboxOpen}>
          <DialogContent className="max-w-[95vw] max-h-[95vh] p-0 overflow-hidden bg-black/95 border-none">
            <div className="relative w-full h-full flex items-center justify-center">
              {/* Close Button */}
              <Button
                variant="ghost"
                size="icon"
                className="absolute top-4 right-4 z-50 text-white hover:bg-white/20"
                onClick={() => setLightboxOpen(false)}
              >
                <X className="h-6 w-6" />
              </Button>

              {/* Image Counter */}
              {displayImages.length > 1 && (
                <div className="absolute top-4 left-1/2 -translate-x-1/2 z-50 bg-black/60 text-white px-4 py-2 rounded-full text-sm">
                  {currentImageIndex + 1} / {displayImages.length}
                </div>
              )}

              {/* Previous Button */}
              {displayImages.length > 1 && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute left-4 z-50 text-white hover:bg-white/20 h-12 w-12"
                  onClick={prevImage}
                >
                  <ChevronLeft className="h-8 w-8" />
                </Button>
              )}

              {/* Main Image */}
              {displayImages[currentImageIndex] && (
                <img
                  src={displayImages[currentImageIndex]}
                  alt={`${printer?.model_name} - Image ${currentImageIndex + 1}`}
                  className="max-w-full max-h-[90vh] object-contain animate-fade-in"
                />
              )}

              {/* Next Button */}
              {displayImages.length > 1 && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute right-4 z-50 text-white hover:bg-white/20 h-12 w-12"
                  onClick={nextImage}
                >
                  <ChevronRight className="h-8 w-8" />
                </Button>
              )}

              {/* Thumbnail Navigation */}
              {displayImages.length > 1 && (
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-50 flex gap-2 max-w-[90vw] overflow-x-auto p-2 bg-black/60 rounded-lg">
                  {displayImages.map((img: string, idx: number) => (
                    <button
                      key={idx}
                      onClick={() => setCurrentImageIndex(idx)}
                      className={`flex-shrink-0 w-16 h-16 rounded overflow-hidden border-2 transition-all ${
                        idx === currentImageIndex 
                          ? 'border-primary scale-110' 
                          : 'border-white/30 opacity-60 hover:opacity-100'
                      }`}
                    >
                      <img
                        src={img}
                        alt={`Thumbnail ${idx + 1}`}
                        className="w-full h-full object-cover"
                      />
                    </button>
                  ))}
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>

        {/* Admin: Update Image Dialog */}
        <Dialog open={imageDialogOpen} onOpenChange={setImageDialogOpen}>
          <DialogContent className="sm:max-w-2xl bg-[#0A0C10] border-primary/30">
            <DialogHeader>
              <DialogTitle className="font-mono text-sm uppercase tracking-wider text-primary">
                {">> "}SELECT_PRODUCT_IMAGE
              </DialogTitle>
            </DialogHeader>
            
            <div className="space-y-4">
              {/* Store Images Grid */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label className="font-mono text-[11px] uppercase tracking-wider text-muted-foreground">
                    Images from Store URL
                  </Label>
                  <button
                    onClick={fetchStoreImages}
                    disabled={isLoadingStoreImages}
                    className="font-mono text-[10px] uppercase tracking-wider text-primary hover:text-primary/80 disabled:opacity-50 flex items-center gap-1.5"
                  >
                    <RefreshCw className={`w-3 h-3 ${isLoadingStoreImages ? 'animate-spin' : ''}`} />
                    REFRESH
                  </button>
                </div>
                
                {isLoadingStoreImages ? (
                  <div className="grid grid-cols-5 gap-3">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <div key={i} className="aspect-square bg-white/5 border border-white/10 animate-pulse" />
                    ))}
                  </div>
                ) : storeImagesError ? (
                  <div className="p-4 bg-red-500/10 border border-red-500/20 font-mono text-[11px] text-red-400 uppercase tracking-wider">
                    ERROR: {storeImagesError}
                  </div>
                ) : storeImages.length > 0 ? (
                  <div className="grid grid-cols-5 gap-3">
                    {storeImages.map((img, idx) => (
                      <button
                        key={idx}
                        onClick={() => {
                          setNewImageUrl(img);
                          setImagePreviewError(false);
                        }}
                        className={`relative aspect-square border-2 transition-all overflow-hidden group ${
                          newImageUrl === img 
                            ? 'border-primary bg-primary/10' 
                            : 'border-white/10 hover:border-primary/50'
                        }`}
                      >
                        <img
                          src={img}
                          alt={`Store image ${idx + 1}`}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            (e.target as HTMLImageElement).style.display = 'none';
                          }}
                        />
                        {newImageUrl === img && (
                          <div className="absolute inset-0 bg-primary/20 flex items-center justify-center">
                            <CheckCircle2 className="w-6 h-6 text-primary" />
                          </div>
                        )}
                        <div className="absolute bottom-0 left-0 right-0 bg-black/70 py-0.5 px-1 font-mono text-[9px] text-white/70 text-center opacity-0 group-hover:opacity-100 transition-opacity">
                          IMG_{String(idx + 1).padStart(2, '0')}
                        </div>
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className="p-4 bg-white/5 border border-white/10 font-mono text-[11px] text-muted-foreground uppercase tracking-wider text-center">
                    NO_IMAGES_LOADED
                  </div>
                )}
              </div>
              
              {/* File Upload Section */}
              <div className="space-y-2 pt-2 border-t border-white/10">
                <Label className="font-mono text-[11px] uppercase tracking-wider text-muted-foreground">
                  Or Upload Image File
                </Label>
                <div className="flex items-center gap-3">
                  <label className="flex-1">
                    <input
                      type="file"
                      accept="image/png,image/jpeg,image/webp,image/gif"
                      onChange={handleFileUpload}
                      disabled={isUploadingFile}
                      className="hidden"
                    />
                    <div className={`
                      flex items-center justify-center gap-2 px-4 py-3
                      border-2 border-dashed border-white/20 rounded-lg
                      cursor-pointer transition-all
                      hover:border-primary/50 hover:bg-white/[0.02]
                      ${isUploadingFile ? 'opacity-50 cursor-not-allowed' : ''}
                    `}>
                      <Upload className={`h-4 w-4 text-muted-foreground ${isUploadingFile ? 'animate-pulse' : ''}`} />
                      <span className="font-mono text-[11px] uppercase tracking-wider text-muted-foreground">
                        {isUploadingFile ? "UPLOADING..." : "CLICK_TO_UPLOAD"}
                      </span>
                    </div>
                  </label>
                  {uploadedFilePreview && (
                    <div className="relative w-14 h-14 border border-primary/30 rounded overflow-hidden">
                      <img 
                        src={uploadedFilePreview} 
                        alt="Uploaded" 
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 bg-primary/20 flex items-center justify-center">
                        <CheckCircle2 className="w-4 h-4 text-primary" />
                      </div>
                    </div>
                  )}
                </div>
                <p className="font-mono text-[9px] text-muted-foreground/60 uppercase tracking-wider">
                  MAX 5MB · PNG, JPEG, WEBP, GIF
                </p>
              </div>
              
              {/* Manual URL Input */}
              <div className="space-y-2 pt-2 border-t border-white/10">
                <Label className="font-mono text-[11px] uppercase tracking-wider text-muted-foreground">
                  Or Enter URL Manually
                </Label>
                <Input
                  id="image-url"
                  placeholder="https://example.com/image.png"
                  value={newImageUrl}
                  onChange={(e) => {
                    setNewImageUrl(e.target.value);
                    setImagePreviewError(false);
                    setUploadedFilePreview(null);
                  }}
                  className="font-mono text-sm bg-white/5 border-white/10"
                />
              </div>
              
              {/* Selected Image Preview */}
              {newImageUrl && (
                <div className="space-y-2">
                  <Label className="font-mono text-[11px] uppercase tracking-wider text-muted-foreground">
                    Selected Image Preview
                  </Label>
                  <div className="border border-primary/30 bg-white/[0.02] p-2">
                    {!imagePreviewError ? (
                      <img
                        src={newImageUrl}
                        alt="Preview"
                        className="w-full h-48 object-contain"
                        onError={() => setImagePreviewError(true)}
                      />
                    ) : (
                      <div className="w-full h-48 flex items-center justify-center font-mono text-[11px] text-red-400 uppercase tracking-wider">
                        ERROR: FAILED_TO_LOAD_PREVIEW
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
            
            <DialogFooter className="gap-2">
              <Button 
                variant="outline" 
                onClick={() => setImageDialogOpen(false)}
                className="font-mono text-[11px] uppercase tracking-wider"
              >
                Cancel
              </Button>
              <Button 
                onClick={() => updateImageMutation.mutate(newImageUrl)}
                disabled={!newImageUrl || imagePreviewError || updateImageMutation.isPending}
                className="font-mono text-[11px] uppercase tracking-wider"
              >
                {updateImageMutation.isPending ? "SAVING..." : "CONFIRM_SELECTION"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

      </div>
    </div>
  );
};

export default PrinterDetail;