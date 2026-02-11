import { useEffect, useState, useRef, useMemo, useCallback } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { ExternalLink, Printer } from "lucide-react";
import { DetailBreadcrumb } from "@/components/navigation/DetailBreadcrumb";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Database } from "@/integrations/supabase/types";
import { useAuth } from "@/hooks/useAuth";
import { usePrinterSelection } from "@/hooks/usePrinterSelection";
import { checkPrinterFilamentCompatibility } from "@/lib/printerCompatibility";
import { useAffiliateLinks } from "@/hooks/useAffiliateLinks";
import { toBrandSlug } from "@/utils/brandSlug";
import { useCurrency } from "@/hooks/useCurrency";
import { isDiscontinuedUrl } from "@/lib/urlValidation";
import { useAchievements } from "@/hooks/useAchievements";
import { validateFilamentPrice } from "@/lib/priceValidation";
import { StickyBuyBar } from "@/components/filament/StickyBuyBar";
import { RetailersModal, type Retailer } from "@/components/filament/hero/RetailersModal";
import { FilamentHeroSection } from "@/components/filament/hero/FilamentHeroSection";
import { AdminToolbar } from "@/components/filament/AdminToolbar";
import { FilamentPurchaseSidebar, FilamentMobileBottomBar } from "@/components/filament/sidebar";
import { 
  FilamentTabNav, 
  FilamentTabContent, 
  OverviewTabContent,
  SpecificationsTabContent,
  CompatibilityTabContent,
  PricingTabContent,
  CommunityTabContent,
  type FilamentTab 
} from "@/components/filament/tabs";
import { useConversionTracking } from "@/hooks/useConversionTracking";
import { CalculatorTabs, FloatingCalculatorButton } from "@/components/filament/calculator";
import { useRegionalStore, getRegionDisplayName } from "@/hooks/useRegionalStore";
import { useUnifiedRegionalPricing, type UnifiedRegionalPricingResult } from "@/hooks/useUnifiedRegionalPricing";
import { extractProductSlug } from "@/hooks/useRegionalPricing";
import { isFilamentAvailableInRegion, isRegionalBrand, type FilamentWithRegion } from "@/hooks/useRegionalFiltering";
import { useRegion } from "@/contexts/RegionContext";
import type { RegionCode, CurrencyCode } from "@/types/regional";
import { REGIONS } from "@/config/regions";
import { RegionNotAvailable } from "@/components/filament/RegionNotAvailable";
import { useFilamentColorVariants } from "@/hooks/useFilamentColorVariants";
import { ProductSEO, ProductJsonLd } from "@/components/seo";
import { cleanFilamentDisplayName, getProductLineName } from "@/lib/productNameUtils";
import { SimilarFilamentsSection } from "@/components/filament/similar/SimilarFilamentsSection";
import { useFilamentStorePricing } from "@/hooks/useFilamentStorePricing";
import { useFilamentBySlug } from "@/hooks/useFilamentBySlug";
import { useFilamentListings } from "@/hooks/useFilamentListings";
import { useFilamentDetailPricing } from "@/hooks/useFilamentDetailPricing";
import { useBrowseHistory } from "@/hooks/useBrowseHistory";
import { RecentlyViewedSection } from "@/components/RecentlyViewedSection";
import { useCommunityReviewStats } from "@/hooks/useCommunityReviewStats";

type Filament = Database["public"]["Tables"]["filaments"]["Row"];

const FilamentDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { isAdmin } = useAuth();
  const { selectedPrinter, printerLoading } = usePrinterSelection();
  
  // Use the slug-aware hook instead of inline fetch
  const { filament, loading, error: fetchError, isRedirecting, refetch } = useFilamentBySlug(id);
  
  const [rescrapingImage, setRescrapingImage] = useState(false);
  const [scrapingData, setScrapingData] = useState(false);
  const [scrapingColors, setScrapingColors] = useState(false);
  const [brandId, setBrandId] = useState<string | null>(null);
  
  const [editImageOpen, setEditImageOpen] = useState(false);
  const [newImageUrl, setNewImageUrl] = useState("");
  const [savingImage, setSavingImage] = useState(false);
  const [editUrlOpen, setEditUrlOpen] = useState(false);
  const [newProductUrl, setNewProductUrl] = useState("");
  const [savingUrl, setSavingUrl] = useState(false);
  const [stickyBarVisible, setStickyBarVisible] = useState(false);
  const [retailersModalOpen, setRetailersModalOpen] = useState(false);
  const [isCalculatorOpen, setIsCalculatorOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<FilamentTab>("overview");
  const heroSentinelRef = useRef<HTMLDivElement>(null);
  const { getAffiliateUrl, getAmazonUrl } = useAffiliateLinks();
  const { formatPrice: legacyFormatPrice, formatRegionalPrice } = useCurrency();
  const { incrementStat } = useAchievements();
  const { trackStoreClick } = useConversionTracking();
  const { getRegionalUrl, regionShortName } = useRegionalStore();
  
  // Community review stats for hero badge
  const { data: communityReviewStats } = useCommunityReviewStats(filament?.id);
  // Get region from the correct source (URL parameter-based)
  const { region: currentRegionCode, currency, formatPrice, convertPrice: regionConvertPrice, hasRates } = useRegion();
  
  // Use the extracted color variants hook with CORRECT region from RegionContext
  const {
    colorVariants,
    selectedVariant,
    handleColorVariantSelect,
    productLineAvailableInRegion,
    getColorFromTitle: getColorName,
    getBaseProductName: getBaseName,
  } = useFilamentColorVariants(filament, currentRegionCode as any);
  
  // The filament to display - either the selected color variant or the base filament from URL
  const displayFilament = selectedVariant || filament;
  
  // IMPORTANT: Use the BASE filament (not selected variant) for pricing, URLs, and regional availability
  const pricingFilament = filament;
  
  // currentRegionCode already defined above from useRegion()
  
  // ─── UNIFIED PRICING: Single source of truth for all price data ───
  // This replaces the previous 4 independent pricing hooks + sidebarBest logic.
  const detailPricing = useFilamentDetailPricing(pricingFilament as any);
  
  // Extract values for backward compatibility
  const unifiedPricing = useUnifiedRegionalPricing({
    brandName: pricingFilament?.vendor || '',
    productSlug: pricingFilament?.product_handle || extractProductSlug(pricingFilament?.product_url),
    basePrice: pricingFilament?.variant_price ?? null,
    baseCurrency: 'USD',
    originalUrl: pricingFilament?.product_url || null,
    productName: pricingFilament?.product_title,
    filamentId: pricingFilament?.id,
    priceLastVerifiedAt: pricingFilament?.last_scraped_at,
    priceSource: (pricingFilament as any)?.price_source,
    priceConfidence: (pricingFilament as any)?.price_confidence,
    regionalPrices: {
      price_cad: (pricingFilament as any)?.price_cad,
      price_eur: (pricingFilament as any)?.price_eur,
      price_gbp: (pricingFilament as any)?.price_gbp,
      price_aud: (pricingFilament as any)?.price_aud,
      price_jpy: (pricingFilament as any)?.price_jpy,
    },
  });
  
  // Store pricing for the pricing tab (still needed for detailed store info)
  const { 
    bestPrice: storeBestPrice, 
    hasPriceData: hasStorePriceData,
    isLoading: storePriceLoading 
  } = useFilamentStorePricing(pricingFilament?.id);
  
  // Retailer listings for the modal (still needed for the modal view)
  const userCurrency = REGIONS[currentRegionCode as RegionCode]?.defaultCurrency || 'USD';
  const { data: usRetailerListings } = useFilamentListings(pricingFilament?.id, {
    region: 'US', currency: 'USD', includeUnavailable: false,
  });
  const isUserRegionUS = currentRegionCode === 'US';
  const { data: localRetailerListings } = useFilamentListings(
    !isUserRegionUS ? pricingFilament?.id : undefined, 
    { region: currentRegionCode, currency: userCurrency, includeUnavailable: false }
  );
  const allRetailerListings = useMemo(() => {
    const local = localRetailerListings || [];
    const us = usRetailerListings || [];
    const seen = new Set(local.map(l => l.listing_id));
    return [...local, ...us.filter(l => !seen.has(l.listing_id))];
  }, [localRetailerListings, usRetailerListings]);
  
  // Backward-compat: regionalPriceResult used by the modal and pricing tab
  const regionalPriceResult = detailPricing.sidebarRegionalPrice;
  const regionalPriceLoading = detailPricing.isLoading;
  const regionalStores = unifiedPricing.allStores;
  const hasLocalStore = detailPricing.cheapestLocal != null;

  const compatibility = selectedPrinter && displayFilament 
    ? checkPrinterFilamentCompatibility(selectedPrinter, displayFilament)
    : null;

  // Build retailers array for modal
  const retailers: Retailer[] = useMemo(() => {
    if (!pricingFilament) return [];
    
    const result: Retailer[] = [];
    
    // Use new regional pricing hook result for URL
    const bestRegionalUrl = regionalPriceResult?.store?.url || getRegionalUrl(pricingFilament.product_url, pricingFilament.vendor);
    
    if (bestRegionalUrl) {
      result.push({
        id: 'store',
        name: `${pricingFilament.vendor || 'Store'} (${regionShortName})`,
        price: regionalPriceResult?.displayPrice ?? null,
        inStock: !isDiscontinuedUrl(bestRegionalUrl),
        url: getAffiliateUrl(bestRegionalUrl, pricingFilament.vendor),
        shippingEstimate: 'Ships within 24hrs',
      });
    }
    
    const amazonLinks = [
      { id: 'amazon_us', name: 'Amazon US', link: pricingFilament.amazon_link_us, price: pricingFilament.amazon_price_usd, region: 'US' },
      { id: 'amazon_uk', name: 'Amazon UK', link: pricingFilament.amazon_link_uk, price: null, region: 'UK' },
      { id: 'amazon_de', name: 'Amazon DE', link: pricingFilament.amazon_link_de, price: null, region: 'EU' },
    ].filter(a => a.link);
    
    const sortedAmazon = amazonLinks.sort((a, b) => {
      if (a.region === regionShortName) return -1;
      if (b.region === regionShortName) return 1;
      if (regionShortName === 'EU' && a.region === 'EU') return -1;
      if (regionShortName === 'EU' && b.region === 'EU') return 1;
      return 0;
    });
    
    for (const amazon of sortedAmazon) {
      // Defensive check: Only add Amazon retailer if URL construction succeeds
      const affiliateUrl = getAmazonUrl(amazon.link);
      if (!affiliateUrl) continue;
      
      result.push({
        id: amazon.id,
        name: amazon.name,
        price: amazon.price,
        inStock: true,
        url: affiliateUrl,
        shippingEstimate: 'Prime eligible',
      });
    }
    
    return result;
  }, [pricingFilament, getAffiliateUrl, getAmazonUrl, getRegionalUrl, regionShortName, regionalPriceResult]);

  // ─── Best Price: now comes from the unified hook ───
  // sidebarBest, sidebarRegionalPrice, and unifiedRetailerCount are all
  // replaced by detailPricing.bestPrice, detailPricing.sidebarRegionalPrice,
  // and detailPricing.retailerCount respectively.

  const handleViewRetailers = () => {
    if (filament) {
      trackStoreClick({
        moduleName: 'view_all_retailers_pricing_tab',
        entityId: filament.id,
        entityType: 'filament',
      });
    }
    // Switch to the Pricing tab instead of opening a modal
    setActiveTab("pricing");
  };

  const handleRetailerClick = (retailer: Retailer) => {
    if (filament) {
      trackStoreClick({
        moduleName: 'retailer_modal_click',
        entityId: retailer.id,
        entityType: 'filament',
        metadata: { retailerName: retailer.name, price: retailer.price },
      });
    }
  };

  // Handle fetch error from slug hook - show not found UI instead of redirecting
  // This preserves deep links and allows users to search from the error page
  // Note: isRedirecting is now deprecated (always false) but kept for API compatibility
  const showNotFound = fetchError && !loading;

  // Fetch brandId from automated_brands table based on vendor name
  useEffect(() => {
    const fetchBrandId = async () => {
      if (!filament?.vendor) {
        setBrandId(null);
        return;
      }
      const { data } = await supabase
        .from('automated_brands')
        .select('id')
        .ilike('brand_name', filament.vendor)
        .limit(1)
        .maybeSingle();
      setBrandId(data?.id || null);
    };
    fetchBrandId();
  }, [filament?.vendor]);

  // Track browse history
  const { addToHistory } = useBrowseHistory();
  
  useEffect(() => {
    if (filament?.id) {
      incrementStat('materials_explored');
      addToHistory(filament.id, 'filament');
    }
  }, [filament?.id]);

  useEffect(() => {
    const sentinel = heroSentinelRef.current;
    if (!sentinel) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        setStickyBarVisible(!entry.isIntersecting);
      },
      {
        threshold: 0,
        rootMargin: '-100px 0px 0px 0px',
      }
    );

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, []);

  // Callback for admin price refresh - refetches filament data to update UI
  const handleAdminRefresh = useCallback(() => {
    console.log('[AdminRefresh] Refetching filament data after price update');
    refetch();
  }, [refetch]);

  // Callback to scroll to pricing tab and show full price history
  const handleScrollToPricing = useCallback(() => {
    setActiveTab("pricing");
    // Wait for tab content to render, then scroll into view
    requestAnimationFrame(() => {
      const pricingSection = document.querySelector('[data-tab="pricing"]');
      if (pricingSection) {
        pricingSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    });
  }, []);


  const handleRescrapeImage = async () => {
    if (!id || !filament) return;
    
    if (!filament.product_url) {
      toast({
        title: "No product URL",
        description: "This filament has no product URL to scrape from.",
        variant: "destructive",
      });
      return;
    }
    
    setRescrapingImage(true);
    try {
      toast({
        title: "Scraping image...",
        description: `Fetching image from: ${filament.product_url}`,
      });

      const { data, error } = await supabase.functions.invoke('scrape-images', {
        body: { 
          filamentIds: [id],
          forceRescrape: true
        }
      });

      if (error) throw error;

      toast({
        title: "Image rescrape completed",
        description: data.message || "Image rescraped from product URL successfully.",
        duration: 5000,
      });

      await refetch();
    } catch (error: any) {
      toast({
        title: "Rescrape failed",
        description: error.message || "Failed to rescrape image from product URL.",
        variant: "destructive",
        duration: 5000,
      });
    } finally {
      setRescrapingImage(false);
    }
  };

  const handleScrapeData = async () => {
    if (!id || !filament) return;
    
    if (!filament.product_url) {
      toast({
        title: "No product URL",
        description: "This filament has no product URL to scrape from.",
        variant: "destructive",
      });
      return;
    }
    
    setScrapingData(true);
    try {
      toast({
        title: "Scraping product data...",
        description: `Fetching all data from: ${filament.product_url}`,
      });

      const { data, error } = await supabase.functions.invoke('fetch-prices', {
        body: { 
          filamentIds: [id],
          forceRescrape: true
        }
      });

      if (error) throw error;

      toast({
        title: "Data scrape completed",
        description: data.message || "Product data scraped successfully from product URL.",
        duration: 5000,
      });

      await refetch();
    } catch (error: any) {
      toast({
        title: "Scrape failed",
        description: error.message || "Failed to scrape data from product URL.",
        variant: "destructive",
        duration: 5000,
      });
    } finally {
      setScrapingData(false);
    }
  };

  const handleScrapeColors = async () => {
    if (!id || !filament) return;
    
    if (!filament.product_url) {
      toast({
        title: "No product URL",
        description: "This filament has no product URL to scrape colors from.",
        variant: "destructive",
      });
      return;
    }
    
    setScrapingColors(true);
    try {
      toast({
        title: "Scraping colors...",
        description: `Fetching color variants from: ${filament.product_url}`,
      });

      const { data, error } = await supabase.functions.invoke('scrape-filament-colors', {
        body: { filamentId: id }
      });

      if (error) throw error;

      toast({
        title: data.success ? "Colors scraped" : "No colors found",
        description: data.message || "Color scraping completed.",
        duration: 5000,
      });

      await refetch();
    } catch (error: any) {
      toast({
        title: "Scrape failed",
        description: error.message || "Failed to scrape colors from product URL.",
        variant: "destructive",
        duration: 5000,
      });
    } finally {
      setScrapingColors(false);
    }
  };

  const handleSaveImage = async () => {
    if (!id || !newImageUrl.trim()) return;
    
    setSavingImage(true);
    try {
      const { error } = await supabase
        .from("filaments")
        .update({ featured_image: newImageUrl.trim() })
        .eq("id", id);

      if (error) throw error;

      toast({
        title: "Image updated",
        description: "Product image has been updated successfully.",
      });

      setEditImageOpen(false);
      await refetch();
    } catch (error: any) {
      toast({
        title: "Update failed",
        description: error.message || "Failed to update product image.",
        variant: "destructive",
      });
    } finally {
      setSavingImage(false);
    }
  };

  const handleSaveProductUrl = async () => {
    if (!id) return;
    
    setSavingUrl(true);
    try {
      const { error } = await supabase
        .from("filaments")
        .update({ product_url: newProductUrl.trim() || null })
        .eq("id", id);

      if (error) throw error;

      toast({
        title: "Product URL updated",
        description: "Product URL has been updated successfully.",
      });

      setEditUrlOpen(false);
      await refetch();
    } catch (error: any) {
      toast({
        title: "Update failed",
        description: error.message || "Failed to update product URL.",
        variant: "destructive",
      });
    } finally {
      setSavingUrl(false);
    }
  };

  // Show loading state while redirecting from UUID to slug
  if (isRedirecting) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-muted-foreground">Redirecting...</div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-muted-foreground">Loading filament details...</div>
      </div>
    );
  }

  // Show not found UI with search capability instead of redirecting
  if (showNotFound || !filament || !displayFilament || !pricingFilament) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-background via-background to-muted/20">
        <div className="max-w-[1400px] mx-auto p-4 lg:p-8">
          <DetailBreadcrumb
            segments={[{ label: "Filaments", href: "/" }]}
            mobileBackLabel="Filaments"
          />
          
          <Card className="max-w-2xl mx-auto bg-card/50 border-border/50">
            <CardContent className="p-8 text-center">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-muted/50 flex items-center justify-center">
                <Printer className="w-8 h-8 text-muted-foreground" />
              </div>
              <h1 className="text-2xl font-bold text-foreground mb-2">Filament Not Found</h1>
              <p className="text-muted-foreground mb-6">
                {fetchError || "We couldn't find a filament matching this URL. It may have been removed or the URL might be incorrect."}
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Button onClick={() => navigate("/")} variant="default">
                  Browse All Filaments
                </Button>
                <Button onClick={() => navigate("/wizard")} variant="outline">
                  Try Quick Match
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Check if this product is available in the user's region
  const isAvailableInRegion = productLineAvailableInRegion || isFilamentAvailableInRegion(
    displayFilament as FilamentWithRegion,
    currentRegionCode
  );
  
  // Show "Not Available" message for regional products not available in user's region
  if (!isAvailableInRegion && isRegionalBrand(displayFilament.vendor)) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-background via-background to-muted/20">
        <div className="max-w-[1400px] mx-auto p-4 lg:p-8">
          <DetailBreadcrumb
            segments={[{ label: "Filaments", href: "/" }]}
            mobileBackLabel="Filaments"
          />
          
          <RegionNotAvailable
            productTitle={displayFilament.product_title}
            vendor={displayFilament.vendor}
            material={displayFilament.material}
            regionName={getRegionDisplayName(currentRegionCode as any)}
          />
        </div>
      </div>
    );
  }

  // Pricing calculations
  const packQuantity = (pricingFilament as any).pack_quantity || 1;
  const isMultiPack = packQuantity > 1;
  
  const totalWeightKg = pricingFilament.net_weight_g 
    ? (pricingFilament.net_weight_g / 1000) * packQuantity 
    : packQuantity;
  
  // Use converted price from the new hook if available
  const hasActualRegionalPrice = !!(regionalPriceResult && regionalPriceResult.displayPrice > 0);
  
  // ── VALIDATION ONLY: rawPricePerKg for SEO meta and price sanity checks ──
  // Do NOT use this for display — all display values come from detailPricing (SSOT)
  const validationPricePerKg = hasActualRegionalPrice
    ? (regionalPriceResult.displayPrice / totalWeightKg)
    : pricingFilament.variant_price 
      ? (pricingFilament.variant_price / totalWeightKg) 
      : null;
  
  const priceValidation = validateFilamentPrice(
    pricingFilament.variant_price,
    pricingFilament.net_weight_g,
    packQuantity,
    pricingFilament.material,
    pricingFilament.product_title,
    pricingFilament.product_url
  );
  
  const totalPackPrice = isMultiPack 
    ? hasActualRegionalPrice && regionalPriceResult?.displayPrice
      ? regionalPriceResult.formattedPrice
      : displayFilament.variant_price
        ? formatPrice(displayFilament.variant_price)
        : null
    : null;

  // ─── Sidebar props from unified pricing hook (SSOT — no fallback to independent hooks) ───
  // detailPricing is the single source of truth. No rawPricePerKg fallbacks.
  const sidebarAffiliateUrl = detailPricing.affiliateUrl
    || getAffiliateUrl(
        pricingFilament?.product_url || '',
        pricingFilament?.vendor
      );
  const sidebarRetailerName = detailPricing.storeName
    || pricingFilament?.vendor || undefined;
  const sidebarPricePerKg = detailPricing.pricePerKg;
  const sidebarPricePerSpool = detailPricing.pricePerSpool;
  const sidebarProductUrl = detailPricing.productUrl
    || pricingFilament?.product_url || '';
  
  // Sticky/mobile bar uses local-first pricing
  const stickyBarCandidate = detailPricing.stickyBarPrice;
  const stickyBarPricePerKg = stickyBarCandidate?.pricePerKg ?? sidebarPricePerKg;
  const stickyBarAffiliateUrl = stickyBarCandidate?.affiliateUrl ?? sidebarAffiliateUrl;
  const stickyBarRetailerName = stickyBarCandidate?.name ?? sidebarRetailerName;

  const baseProductName = getBaseName(filament.product_title);
  
  // Get the best product line name for SEO and display
  const productLineName = getProductLineName(displayFilament.material, displayFilament.product_title);

  // Build full SEO title, avoiding doubled brand name.
  // If productLineName already starts with the vendor, don't prepend vendor again.
  const vendorName = displayFilament.vendor || '';
  const productLineStartsWithVendor = vendorName && productLineName.toLowerCase().startsWith(
    vendorName.replace(/™|®|©/g, '').trim().toLowerCase()
  );
  const seoFullName = productLineStartsWithVendor
    ? productLineName
    : `${vendorName} ${productLineName}`.trim();

  // Build SEO description — template:
  // "[Brand] [Product Name] — [Material Type] filament. [Nozzle Temp Range]. From [Best Price] in [Region]. Compare specs, read reviews, and find the best deal."
  const regionName = getRegionDisplayName(currentRegionCode as any);
  const tempDisplay = displayFilament.nozzle_temp_min_c && displayFilament.nozzle_temp_max_c
    ? `Nozzle temp ${displayFilament.nozzle_temp_min_c}-${displayFilament.nozzle_temp_max_c}°C.`
    : null;
  const materialType = displayFilament.material || 'filament';
  const priceSnippet = sidebarPricePerKg
    ? `From ${formatPrice(sidebarPricePerKg)}/kg in ${regionName}.`
    : sidebarPricePerSpool
      ? `From ${formatPrice(sidebarPricePerSpool)} in ${regionName}.`
      : null;
  const seoDescParts = [
    `${seoFullName} — ${materialType} filament.`,
    tempDisplay,
    priceSnippet,
    'Compare specs, read reviews, and find the best deal.',
  ].filter(Boolean);
  const seoDescription = seoDescParts.join(' ').replace(/\s+/g, ' ').trim();

  // Build brand slug for breadcrumb link
  const brandSlug = displayFilament.vendor ? toBrandSlug(displayFilament.vendor) : '';

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-background to-muted/20">
      {/* Breadcrumb Schema - now handled by DetailBreadcrumb */}

      {/* SEO Meta Tags - Uses product line name for better SEO */}
      <ProductSEO
        title={seoFullName}
        description={seoDescription}
        canonicalUrl={`/filament/${id}`}
        image={displayFilament.featured_image}
        brand={displayFilament.vendor}
        material={displayFilament.material}
        price={validationPricePerKg}
        availability={displayFilament.variant_available ?? true}
        transmissionDistance={displayFilament.transmission_distance}
        productType="filament"
      />
      
      {/* JSON-LD Structured Data — enriched with offers, ratings, and weight */}
      <ProductJsonLd
        name={seoFullName}
        description={seoDescription}
        image={displayFilament.featured_image}
        brand={displayFilament.vendor}
        sku={displayFilament.variant_sku}
        gtin={displayFilament.gtin || displayFilament.ean || displayFilament.upc}
        mpn={displayFilament.mpn}
        material={displayFilament.material}
        color={displayFilament.color_family}
        url={`https://filascope.com/filament/${displayFilament.id}`}
        price={validationPricePerKg}
        availability={displayFilament.variant_available ?? true}
        transmissionDistance={displayFilament.transmission_distance}
        nozzleTempMin={displayFilament.nozzle_temp_min_c}
        nozzleTempMax={displayFilament.nozzle_temp_max_c}
        bedTempMin={displayFilament.bed_temp_min_c}
        bedTempMax={displayFilament.bed_temp_max_c}
        tensileStrength={displayFilament.tensile_strength_xy_mpa}
        printSpeedMax={displayFilament.print_speed_max_mms}
        weightGrams={displayFilament.net_weight_g}
        diameter={displayFilament.diameter_nominal_mm}
        // ── Rich offers from detail pricing (enables Google price range snippets) ──
        regionalOffers={
          detailPricing.allCandidates.length > 0
            ? detailPricing.allCandidates.map(c => ({
                region: (c.storeRegion || currentRegionCode) as any,
                price: c.pricePerSpool,
                currency: (c.originalCurrency || currency) as any,
                url: c.affiliateUrl || c.productUrl,
                availability: true,
                sellerName: c.name,
              }))
            : undefined
        }
        // ── Community rating (enables Google star rating snippets) ──
        ratingValue={communityReviewStats?.avgRating ?? null}
        ratingCount={communityReviewStats?.reviewCount ?? null}
        bestRating={5}
        worstRating={1}
      />

      <div className="max-w-[1400px] mx-auto p-4 lg:p-8">
        {/* Admin Toolbar — collapsed by default, only for admins */}
        {isAdmin && filament && (
          <AdminToolbar
            productUrl={filament.product_url}
            rescrapingImage={rescrapingImage}
            scrapingData={scrapingData}
            scrapingColors={scrapingColors}
            onEditImage={() => {
              setNewImageUrl(filament.featured_image || "");
              setEditImageOpen(true);
            }}
            onRescrapeImage={handleRescrapeImage}
            onEditUrl={() => {
              setNewProductUrl(filament.product_url || "");
              setEditUrlOpen(true);
            }}
            onScrapeData={handleScrapeData}
            onScrapeColors={handleScrapeColors}
          />
        )}

        <DetailBreadcrumb
          segments={[
            { label: "Filaments", href: "/" },
            ...(displayFilament.material ? [{ label: displayFilament.material, href: `/?material=${encodeURIComponent(displayFilament.material)}` }] : []),
            ...(displayFilament.vendor ? [{ label: displayFilament.vendor, href: `/brands/${brandSlug}` }] : []),
            { label: productLineName, href: `/filament/${id}` },
          ]}
          mobileBackLabel={displayFilament.vendor || "Filaments"}
          hideHome
        />

        {/* Main Layout: Content + Sidebar */}
        <div className="flex gap-8">
          {/* Main Content */}
          <div className="flex-1 min-w-0">
            {/* Hero Section */}
            <FilamentHeroSection
              displayFilament={displayFilament}
              pricingFilament={pricingFilament}
              baseProductName={baseProductName}
              colorVariants={colorVariants.map(v => ({
                id: v.id,
                color_hex: v.color_hex,
                color_family: v.color_family,
                product_title: v.product_title,
                net_weight_g: v.net_weight_g,
                product_url: v.product_url,
                variant_available: v.variant_available,
              }))}
              onSelectColor={(variant) => {
                const fullVariant = colorVariants.find(v => v.id === variant.id);
                if (fullVariant) handleColorVariantSelect(fullVariant);
              }}
              getColorFromTitle={(title) => getColorName(title, baseProductName)}
              isMultiPack={isMultiPack}
              packQuantity={packQuantity}
              communityRating={communityReviewStats}
              onNavigateToCommunity={() => setActiveTab("community")}
            />

            {/* Retailers Modal */}
            <RetailersModal
              open={retailersModalOpen}
              onOpenChange={setRetailersModalOpen}
              productName={displayFilament.product_title}
              retailers={retailers}
              onRetailerClick={handleRetailerClick}
            />

            {/* Sentinel for sticky buy bar trigger */}
            <div ref={heroSentinelRef} className="h-0" aria-hidden="true" />

            {/* Tab Navigation */}
            <FilamentTabNav 
              activeTab={activeTab} 
              onTabChange={setActiveTab}
              counts={{
                pricing: detailPricing.retailerCount,
                community: communityReviewStats?.reviewCount ?? 0,
              }}
            />

            {/* Tab Content */}
            <FilamentTabContent activeTab={activeTab}>
              {activeTab === "overview" && (
                <OverviewTabContent 
                  filament={displayFilament} 
                  priceCandidates={detailPricing.allCandidates}
                  priceCandidatesLoading={detailPricing.isLoading}
                  totalRetailerCount={detailPricing.retailerCount}
                  onNavigateToPricing={() => setActiveTab("pricing")}
                  onNavigateToCommunity={() => setActiveTab("community")}
                />
              )}

              {activeTab === "specifications" && (
                <SpecificationsTabContent filament={displayFilament} />
              )}

              {activeTab === "compatibility" && (
                <CompatibilityTabContent
                  filament={displayFilament}
                  selectedPrinter={selectedPrinter}
                  compatibility={compatibility}
                  printerLoading={printerLoading}
                />
              )}

              {activeTab === "pricing" && (
                <PricingTabContent
                  filament={displayFilament}
                  retailers={retailers}
                  pricePerKg={sidebarPricePerKg}
                  pricePerSpool={sidebarPricePerSpool}
                  affiliateUrl={getAffiliateUrl(
                    selectedVariant?.product_url || unifiedPricing.storeUrl || pricingFilament.product_url || '', 
                    pricingFilament.vendor
                  )}
                  productUrl={selectedVariant?.product_url || unifiedPricing.storeUrl || pricingFilament.product_url || ''}
                  originalUsUrl={pricingFilament.product_url || undefined}
                  hasActualRegionalPrice={hasActualRegionalPrice}
                  onViewRetailers={handleViewRetailers}
                  onRetailerClick={handleRetailerClick}
                  brandId={brandId}
                  productSku={pricingFilament.variant_sku || pricingFilament.product_handle}
                  priceCandidates={detailPricing.allCandidates}
                  candidatesLoading={detailPricing.isLoading}
                />
              )}

              {activeTab === "community" && (
                <CommunityTabContent filament={displayFilament} />
              )}
            </FilamentTabContent>

            {/* Recently Viewed Section */}
            <div className="mt-8">
              <RecentlyViewedSection
                limit={5}
                excludeId={displayFilament.id}
                showClear={false}
                compact
                title="Recently Viewed"
              />
            </div>

            {/* Similar Filaments Section - Below tabs, visible on all tabs */}
            <SimilarFilamentsSection
              currentFilament={{
                id: displayFilament.id,
                product_title: displayFilament.product_title,
                vendor: displayFilament.vendor,
                material: displayFilament.material,
                variant_price: pricingFilament.variant_price,
                net_weight_g: pricingFilament.net_weight_g,
                color_family: displayFilament.color_family,
                color_hex: displayFilament.color_hex,
                featured_image: displayFilament.featured_image,
                nozzle_temp_min_c: displayFilament.nozzle_temp_min_c,
                nozzle_temp_max_c: displayFilament.nozzle_temp_max_c,
                ease_of_printing_score: displayFilament.ease_of_printing_score,
                finish_type: displayFilament.finish_type,
                carbon_fiber_percentage: displayFilament.carbon_fiber_percentage,
                glass_fiber_percentage: displayFilament.glass_fiber_percentage,
                high_speed_capable: displayFilament.high_speed_capable,
                is_nozzle_abrasive: displayFilament.is_nozzle_abrasive,
                diameter_nominal_mm: displayFilament.diameter_nominal_mm,
              }}
            />
          </div>

          {/* Sticky Sidebar - Desktop Only */}
          <FilamentPurchaseSidebar
            filamentId={displayFilament.id}
            vendor={pricingFilament.vendor}
            material={pricingFilament.material}
            productTitle={displayFilament.product_title}
            pricePerKg={sidebarPricePerKg}
            pricePerSpool={sidebarPricePerSpool}
            weightGrams={pricingFilament.net_weight_g}
            affiliateUrl={sidebarAffiliateUrl}
            productUrl={sidebarProductUrl}
            originalUsUrl={pricingFilament.product_url || undefined}
            retailerName={sidebarRetailerName}
            retailerCount={detailPricing.retailerCount}
            onViewRetailers={handleViewRetailers}
            hasActualRegionalPrice={hasActualRegionalPrice || hasStorePriceData || !!detailPricing.bestPrice}
            isUsingFallbackRegion={!hasLocalStore}
            actualUrlCurrency={unifiedPricing.originalCurrency || null}
            isAvailableInUserRegion={hasLocalStore}
            isRegionalBrand={unifiedPricing.allStores.length > 0 || hasStorePriceData}
            onOpenCalculator={() => setIsCalculatorOpen(true)}
            regionalPriceResult={detailPricing.sidebarRegionalPrice}
            lastScrapedAt={storeBestPrice?.lastVerifiedAt ?? unifiedPricing.lastVerifiedAt?.toISOString() ?? pricingFilament.last_scraped_at}
            priceSource={unifiedPricing.priceSource}
            priceConfidence={unifiedPricing.priceConfidence}
            onAdminRefresh={handleAdminRefresh}
            storePricing={storeBestPrice}
            hasStorePricing={hasStorePriceData}
            onViewPriceHistory={handleScrollToPricing}
            bestSpoolPrice={detailPricing.bestPrice?.spoolPrice ?? null}
            bestSpoolStoreName={detailPricing.bestPrice?.name ?? null}
            bestSpoolIsConverted={detailPricing.bestPrice?.isConverted ?? false}
            finishType={displayFilament.finish_type}
            carbonFiberPercentage={displayFilament.carbon_fiber_percentage}
            glassFiberPercentage={displayFilament.glass_fiber_percentage}
            highSpeedCapable={displayFilament.high_speed_capable}
            isNozzleAbrasive={displayFilament.is_nozzle_abrasive}
            diameterNominalMm={displayFilament.diameter_nominal_mm}
            nozzleTempMinC={displayFilament.nozzle_temp_min_c}
            nozzleTempMaxC={displayFilament.nozzle_temp_max_c}
          />
        </div>
      </div>

      {/* Mobile Bottom Bar — uses local-first pricing */}
      <FilamentMobileBottomBar
        filamentId={displayFilament.id}
        pricePerKg={stickyBarPricePerKg}
        affiliateUrl={stickyBarAffiliateUrl}
        storeName={stickyBarRetailerName || 'Store'}
        storeRegion={stickyBarCandidate?.storeRegion || detailPricing.storeRegion || undefined}
        isConverted={stickyBarCandidate?.isConverted ?? detailPricing.isConverted}
        onOpenCalculator={() => setIsCalculatorOpen(true)}
      />

      {/* Admin Edit Image Dialog */}
      <Dialog open={editImageOpen} onOpenChange={setEditImageOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Edit Product Image</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="imageUrl">Image URL</Label>
              <Input
                id="imageUrl"
                value={newImageUrl}
                onChange={(e) => setNewImageUrl(e.target.value)}
                placeholder="https://example.com/image.jpg"
              />
            </div>
            {newImageUrl && (
              <div className="space-y-2">
                <Label>Preview</Label>
                <div className="border rounded-lg p-4 bg-muted/50">
                  <img
                    src={newImageUrl}
                    alt="Preview"
                    className="max-h-48 mx-auto object-contain"
                    onError={(e) => {
                      e.currentTarget.style.display = 'none';
                    }}
                  />
                </div>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditImageOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveImage} disabled={savingImage || !newImageUrl.trim()}>
              {savingImage ? "Saving..." : "Save"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Admin Edit Product URL Dialog */}
      <Dialog open={editUrlOpen} onOpenChange={setEditUrlOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Edit Product URL</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="productUrl">Product URL</Label>
              <Input
                id="productUrl"
                value={newProductUrl}
                onChange={(e) => setNewProductUrl(e.target.value)}
                placeholder="https://store.example.com/product/filament"
              />
            </div>
            {newProductUrl && (
              <div className="text-sm text-muted-foreground">
                <a 
                  href={newProductUrl} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-primary hover:underline flex items-center gap-1"
                >
                  <ExternalLink className="w-3 h-3" />
                  Test link
                </a>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditUrlOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveProductUrl} disabled={savingUrl}>
              {savingUrl ? "Saving..." : "Save"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Smart Print Calculator */}
      {filament && (
        <>
          <CalculatorTabs
            filament={{
              id: filament.id,
              name: filament.product_title || 'Filament',
              material: filament.material || 'PLA',
              price: sidebarPricePerKg ?? filament.variant_price ?? 0,
              density: filament.density_g_cm3,
              spoolWeight: filament.net_weight_g || 1000,
              nozzleTempMin: filament.nozzle_temp_min_c,
              nozzleTempMax: filament.nozzle_temp_max_c,
              bedTempMin: filament.bed_temp_min_c,
              bedTempMax: filament.bed_temp_max_c,
            }}
            isOpen={isCalculatorOpen}
            onClose={() => setIsCalculatorOpen(false)}
            currencySymbol={({ USD: '$', CAD: 'C$', EUR: '€', GBP: '£', AUD: 'A$', JPY: '¥', CNY: '¥' } as Record<string, string>)[currency] || '$'}
            currencyCode={currency}
            regionCode={currentRegionCode}
            isConverted={detailPricing.isConverted}
          />
        </>
      )}

      {/* Sticky Buy Bar */}
      {pricingFilament && (
        <StickyBuyBar
          filament={pricingFilament}
          affiliateUrl={stickyBarAffiliateUrl}
          pricePerKg={stickyBarPricePerKg}
          isVisible={stickyBarVisible}
          isConverted={stickyBarCandidate?.isConverted ?? detailPricing.isConverted}
          storeName={stickyBarRetailerName || undefined}
          storeRegion={stickyBarCandidate?.storeRegion || detailPricing.storeRegion || undefined}
        />
      )}

      {/* Spacer for sticky bar */}
      <div className="h-20 md:h-16" />
    </div>
  );
};

export default FilamentDetail;
