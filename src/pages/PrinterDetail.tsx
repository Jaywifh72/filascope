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
import { useState, useEffect } from "react";
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
import { ValueProposition } from "@/components/printer/ValueProposition";
import { KeySpecsBar, generateKeySpecs } from "@/components/printer/KeySpecsBar";
import { FeatureHighlightCards } from "@/components/printer/FeatureHighlightCards";
import AdvantageCardsSection from "@/components/printer/AdvantageCardsSection";
import { PriceSection } from "@/components/printer/PriceSection";
import { CTAButtons } from "@/components/printer/CTAButtons";
import { PriceInsightsWidget } from "@/components/printer/PriceInsightsWidget";
import { PriceHistoryModal } from "@/components/printer/PriceHistoryModal";
import { SimilarPrintersSection } from "@/components/printer/SimilarPrintersSection";
import { HardwareIntelligenceReport } from "@/components/printer/HardwareIntelligenceReport";
import { SocialProofSidebar, MobileSocialProof } from "@/components/printer/SocialProofSidebar";
import { FAQSection } from "@/components/printer/FAQSection";
import { generatePrinterBenefits, generatePrinterDescription } from "@/lib/printerBenefitsGenerator";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft,
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
} from "lucide-react";
import { isDiscontinuedUrl } from "@/lib/urlValidation";

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
  const [showPriceHistoryModal, setShowPriceHistoryModal] = useState(false);
  const { data: printer, isLoading } = useQuery({
    queryKey: ["printer-detail", id],
    queryFn: async () => {
      // Try by printer_id slug first, then by UUID
      const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id || '');
      
      const { data, error } = await supabase
        .from("printers")
        .select(`
          *,
          brand:printer_brands!brand_id(brand),
          series:printer_series!series_id(series_name)
        `)
        .eq(isUUID ? "id" : "printer_id", id)
        .maybeSingle();

      if (error) throw error;
      return data;
    },
  });


  // Extract brand name for accessory query
  const printerBrand = typeof printer?.brand === 'object' && printer?.brand !== null && 'brand' in printer.brand 
    ? printer.brand.brand 
    : null;

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
    },
    onError: (error) => {
      toast({ 
        title: "Error", 
        description: error.message || "Failed to update image",
        variant: "destructive"
      });
    }
  });

  // Extract product images when printer data changes and validate them
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

  // Use only validated images for lightbox navigation
  const displayImages = productImages.filter(img => validImages.has(img));

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

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted/20 to-primary/5">
      <div className="max-w-[1600px] mx-auto p-4 md:p-8 space-y-8">
        {/* Navigation */}
        <div className="flex items-center gap-4">
          <Link to="/printers">
            <Button variant="ghost" size="icon" className="rounded-full">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
        </div>

        {/* Hero Section - 30%/70% Layout */}
        <div className="relative bg-[#0A0A0A] rounded-2xl py-10 md:py-14 px-6 md:px-10">
          {/* Admin: Update Image & Refresh Prices Buttons */}
          {isAdmin && (
            <div className="absolute top-4 right-4 flex gap-2 z-10">
              <Button
                variant="outline"
                size="sm"
                className="gap-2"
                onClick={(e) => {
                  e.stopPropagation();
                  setImageDialogOpen(true);
                }}
              >
                <ImagePlus className="h-4 w-4" />
                Update Image
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="gap-2"
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
                <RefreshCw className={`h-4 w-4 ${isUpdatingPrices ? 'animate-spin' : ''}`} />
                {isUpdatingPrices ? 'Updating...' : 'Refresh Prices'}
              </Button>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-[30%_70%] gap-10 lg:gap-16 items-start">
            {/* Left Column: Product Image Gallery (30%) */}
            <div className="w-full">
              {(() => {
                const displayImages = productImages.filter(img => validImages.has(img));
                const isLoadingImages = productImages.length > 0 && checkedImages.size < productImages.length;
                
                if (isLoadingImages) {
                  return (
                    <div className="h-[250px] bg-muted/20 rounded-lg animate-pulse flex items-center justify-center">
                      <span className="text-muted-foreground">Loading images...</span>
                    </div>
                  );
                }
                
                if (displayImages.length === 0) {
                  return (
                    <div className="h-[250px] bg-muted/10 rounded-lg flex items-center justify-center border border-border/20">
                      <Box className="h-20 w-20 text-muted-foreground/30" />
                    </div>
                  );
                }
                
                return (
                  <div className="space-y-3">
                    {/* Main Image */}
                    <div 
                      className="h-[250px] bg-white/[0.02] border border-white/[0.08] rounded-xl p-5 flex items-center justify-center cursor-pointer transition-all duration-200 hover:border-primary/30 hover:-translate-y-0.5 hover:shadow-[0_4px_16px_rgba(0,0,0,0.3)]"
                      onClick={() => openLightbox(0)}
                      role="button"
                      aria-label={`View ${printer.model_name} product image in fullscreen`}
                    >
                      <img 
                        src={displayImages[0]} 
                        alt={`${printer.model_name} product image`}
                        className="max-w-full max-h-full object-contain"
                      />
                    </div>
                    
                    {/* Thumbnail Grid */}
                    {displayImages.length > 1 && (
                      <div className="grid grid-cols-4 gap-2">
                        {displayImages.slice(0, 4).map((img: string, idx: number) => (
                          <div 
                            key={idx} 
                            className={`h-[60px] bg-white/[0.02] border rounded-md p-1.5 flex items-center justify-center cursor-pointer transition-all duration-200 hover:scale-105 ${
                              idx === 0 
                                ? 'border-primary bg-primary/[0.08]' 
                                : 'border-white/[0.08] hover:border-primary/50'
                            }`}
                            onClick={() => openLightbox(idx)}
                            role="button"
                            aria-label={`View ${printer.model_name} image ${idx + 1}`}
                          >
                            <img 
                              src={img} 
                              alt={`${printer.model_name} view ${idx + 1}`}
                              className="max-w-full max-h-full object-contain"
                              loading="lazy"
                            />
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })()}
            </div>

            {/* Right Column: Product Info (70%) */}
            <div className="space-y-6">
              {/* Brand Name */}
              <div className="text-[13px] font-bold uppercase tracking-[0.05em] text-primary">
                {brand}
              </div>

              {/* Product Model */}
              <h1 className="text-3xl md:text-4xl font-bold text-foreground leading-tight -mt-4">
                {printer.model_name}
              </h1>

              {/* Product Description */}
              <p className="text-base font-medium text-muted-foreground -mt-3">
                {generatePrinterDescription({
                  ...printer,
                  brand: brand || undefined
                })}
              </p>

              {/* Social Proof Badges */}
              <SocialProofBadges
                isStaffPick={false}
                rating={printer.rating_community_overall}
                reviewCount={printer.review_count_aggregated}
              />

              {/* Price Section */}
              <PriceSection
                price={printer.current_price_usd_store}
                msrp={printer.msrp_usd}
              />

              {/* Price Insights Widget - Inline */}
              <PriceInsightsWidget
                printerId={printer.id}
                currentPrice={printer.current_price_usd_store}
                currentAmazonPrice={printer.current_price_usd_amazon}
                msrp={printer.msrp_usd}
                onViewFullHistory={() => setShowPriceHistoryModal(true)}
              />

              {/* Value Proposition */}
              <ValueProposition benefits={generatePrinterBenefits(printer)} />

              {/* CTA Buttons */}
              <CTAButtons
                printer={{
                  id: printer.id,
                  name: printer.model_name,
                  imageUrl: displayImages[0] || null,
                  brand: brand,
                }}
                officialStoreUrl={printer.official_store_url}
                storePrice={printer.current_price_usd_store}
                getAffiliateUrl={getAffiliateUrl}
                brand={brand}
              />
            </div>
          </div>
        </div>

        {/* Key Specifications Bar - Full Width Below Hero */}
        <KeySpecsBar specs={generateKeySpecs(printer)} />

        {/* Sidebar Data for Social Proof */}
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

          // Generate mock activity (in production, this would be real analytics)
          const activityData = {
            views: Math.floor(Math.random() * 15) + 3,
            comparisons: Math.floor(Math.random() * 5) + 1,
            purchases: Math.floor(Math.random() * 4) + 1,
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

          const sidebarData = {
            rating: printer.rating_community_overall,
            reviewCount: printer.review_count_aggregated,
            recentReviews,
            staffPick: (printer.rating_community_overall || 0) >= 4.5 || (printer.current_price_usd_store || 0) > 1000,
            staffPickReasons,
            stockStatus: 'in-stock' as const,
            shippingTime: 'Ships within 2-3 business days',
            trustSignals: [
              'Free shipping on orders over $500',
              '30-day return policy',
              '1-year manufacturer warranty',
              'Expert customer support'
            ],
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
            <>
              {/* Mobile Social Proof Accordion - Shows on smaller screens */}
              <div className="max-w-[1400px] mx-auto px-5 md:px-10">
                <MobileSocialProof
                  data={sidebarData}
                  onReadReviews={scrollToRatings}
                  onTakeQuiz={handleTakeQuiz}
                />
              </div>

              {/* Desktop Layout: Main Content + Sidebar */}
              <div className="max-w-[1400px] mx-auto px-5 md:px-10">
                <div className="grid grid-cols-1 xl:grid-cols-[1fr_320px] gap-10 items-start">
                  {/* Main Content Column */}
                  <div className="space-y-8">
                    {/* Feature Highlight Cards - Decision Matrix */}
                    <FeatureHighlightCards printer={printer} />

                    {/* Advantage Callout Cards - Feature Benefits */}
                    <AdvantageCardsSection printer={printer} />

                    {/* Ratings */}
                    {(printer.rating_community_overall || printer.rating_ease_of_use || printer.rating_print_quality) && (
                      <Card className="overflow-hidden border-2" data-section="ratings">
                        <div className="bg-gradient-to-r from-primary/10 via-primary/5 to-background p-6">
                          <div className="flex items-center gap-3 mb-6">
                            <div className="p-3 rounded-full bg-primary/20">
                              <Star className="h-6 w-6 text-primary" />
                            </div>
                            <div>
                              <h3 className="text-xl font-bold">Community Ratings</h3>
                              {printer.review_count_aggregated && (
                                <p className="text-sm text-muted-foreground">Based on {printer.review_count_aggregated} reviews</p>
                              )}
                            </div>
                          </div>
                          <div className="grid grid-cols-2 md:grid-cols-5 gap-6">
                            {printer.rating_community_overall && (
                              <div className="text-center space-y-2">
                                <div className="text-4xl font-bold text-primary">{printer.rating_community_overall.toFixed(1)}</div>
                                <div className="flex justify-center">
                                  {[...Array(5)].map((_, i) => (
                                    <Star key={i} className={`h-4 w-4 ${i < Math.round(printer.rating_community_overall || 0) ? 'fill-primary text-primary' : 'text-muted'}`} />
                                  ))}
                                </div>
                                <div className="text-xs text-muted-foreground font-medium uppercase tracking-wide">Overall</div>
                              </div>
                            )}
                            {printer.rating_ease_of_use && (
                              <div className="text-center space-y-2">
                                <div className="text-4xl font-bold">{printer.rating_ease_of_use.toFixed(1)}</div>
                                <div className="flex justify-center">
                                  {[...Array(5)].map((_, i) => (
                                    <Star key={i} className={`h-4 w-4 ${i < Math.round(printer.rating_ease_of_use || 0) ? 'fill-primary text-primary' : 'text-muted'}`} />
                                  ))}
                                </div>
                                <div className="text-xs text-muted-foreground font-medium uppercase tracking-wide">Ease of Use</div>
                              </div>
                            )}
                            {printer.rating_print_quality && (
                              <div className="text-center space-y-2">
                                <div className="text-4xl font-bold">{printer.rating_print_quality.toFixed(1)}</div>
                                <div className="flex justify-center">
                                  {[...Array(5)].map((_, i) => (
                                    <Star key={i} className={`h-4 w-4 ${i < Math.round(printer.rating_print_quality || 0) ? 'fill-primary text-primary' : 'text-muted'}`} />
                                  ))}
                                </div>
                                <div className="text-xs text-muted-foreground font-medium uppercase tracking-wide">Print Quality</div>
                              </div>
                            )}
                            {printer.rating_reliability && (
                              <div className="text-center space-y-2">
                                <div className="text-4xl font-bold">{printer.rating_reliability.toFixed(1)}</div>
                                <div className="flex justify-center">
                                  {[...Array(5)].map((_, i) => (
                                    <Star key={i} className={`h-4 w-4 ${i < Math.round(printer.rating_reliability || 0) ? 'fill-primary text-primary' : 'text-muted'}`} />
                                  ))}
                                </div>
                                <div className="text-xs text-muted-foreground font-medium uppercase tracking-wide">Reliability</div>
                              </div>
                            )}
                            {printer.rating_value_for_money && (
                              <div className="text-center space-y-2">
                                <div className="text-4xl font-bold">{printer.rating_value_for_money.toFixed(1)}</div>
                                <div className="flex justify-center">
                                  {[...Array(5)].map((_, i) => (
                                    <Star key={i} className={`h-4 w-4 ${i < Math.round(printer.rating_value_for_money || 0) ? 'fill-primary text-primary' : 'text-muted'}`} />
                                  ))}
                                </div>
                                <div className="text-xs text-muted-foreground font-medium uppercase tracking-wide">Value</div>
                              </div>
                            )}
                          </div>
                        </div>
                      </Card>
                    )}

                    {/* Detailed Specifications - Expandable Drawers */}
                    <SpecsDrawerSection 
                      printer={printer} 
                      accessories={accessories || []}
                      brand={brand}
                    />
                  </div>

                  {/* Desktop Sidebar */}
                  <SocialProofSidebar
                    data={sidebarData}
                    onReadReviews={scrollToRatings}
                    onTakeQuiz={handleTakeQuiz}
                  />
                </div>
              </div>
            </>
          );
        })()}

        {/* Hardware Intelligence Report */}
        <HardwareIntelligenceReport printer={printer} brand={brand} />

        {/* Firmware & Software Sections */}
        <div className="max-w-[1400px] mx-auto px-10 md:px-10 px-5 space-y-6">
          <FirmwareSection printerId={printer.id} brandName={brand} printerName={printer.model_name} />
          <SoftwareSection printerId={printer.id} brandName={brand} printerName={printer.model_name} />
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

        {/* FAQ Section */}
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
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Update Product Image</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="image-url">Image URL</Label>
                <Input
                  id="image-url"
                  placeholder="https://example.com/image.png"
                  value={newImageUrl}
                  onChange={(e) => {
                    setNewImageUrl(e.target.value);
                    setImagePreviewError(false);
                  }}
                />
              </div>
              {newImageUrl && (
                <div className="space-y-2">
                  <Label>Preview</Label>
                  <div className="border rounded-lg p-2 bg-muted/50">
                    {!imagePreviewError ? (
                      <img
                        src={newImageUrl}
                        alt="Preview"
                        className="w-full h-48 object-contain"
                        onError={() => setImagePreviewError(true)}
                      />
                    ) : (
                      <div className="w-full h-48 flex items-center justify-center text-muted-foreground">
                        Failed to load image preview
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setImageDialogOpen(false)}>
                Cancel
              </Button>
              <Button 
                onClick={() => updateImageMutation.mutate(newImageUrl)}
                disabled={!newImageUrl || imagePreviewError || updateImageMutation.isPending}
              >
                {updateImageMutation.isPending ? "Saving..." : "Save Image"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Price History Modal */}
        <PriceHistoryModal
          isOpen={showPriceHistoryModal}
          onClose={() => setShowPriceHistoryModal(false)}
          printerName={printer.model_name}
          printerId={printer.id}
        />
      </div>
    </div>
  );
};

export default PrinterDetail;