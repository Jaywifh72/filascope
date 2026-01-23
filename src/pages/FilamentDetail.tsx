import { useEffect, useState, useRef, useMemo, useCallback } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, ExternalLink, Printer } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Database } from "@/integrations/supabase/types";
import { useAuth } from "@/hooks/useAuth";
import { usePrinterSelection } from "@/hooks/usePrinterSelection";
import { checkPrinterFilamentCompatibility } from "@/lib/printerCompatibility";
import { useAffiliateLinks } from "@/hooks/useAffiliateLinks";
import { useCurrency } from "@/hooks/useCurrency";
import { isDiscontinuedUrl } from "@/lib/urlValidation";
import { useAchievements } from "@/hooks/useAchievements";
import { validateFilamentPrice } from "@/lib/priceValidation";
import { StickyBuyBar } from "@/components/filament/StickyBuyBar";
import { RetailersModal, type Retailer } from "@/components/filament/hero/RetailersModal";
import { FilamentHeroSection } from "@/components/filament/hero/FilamentHeroSection";
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
import { useRegionalPrice, type FilamentWithRegionalPrices } from "@/hooks/useRegionalPrice";
import { isFilamentAvailableInRegion, isRegionalBrand, type FilamentWithRegion } from "@/hooks/useRegionalFiltering";
import { RegionNotAvailable } from "@/components/filament/RegionNotAvailable";
import { useFilamentColorVariants } from "@/hooks/useFilamentColorVariants";
import { ProductSEO, ProductJsonLd } from "@/components/seo";
import { cleanFilamentDisplayName } from "@/lib/productNameUtils";
import { SimilarFilamentsSection } from "@/components/filament/similar/SimilarFilamentsSection";

type Filament = Database["public"]["Tables"]["filaments"]["Row"];

const FilamentDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { isAdmin } = useAuth();
  const { selectedPrinter, printerLoading } = usePrinterSelection();
  const [filament, setFilament] = useState<Filament | null>(null);
  const [loading, setLoading] = useState(true);
  const [rescrapingImage, setRescrapingImage] = useState(false);
  const [scrapingData, setScrapingData] = useState(false);
  const [scrapingColors, setScrapingColors] = useState(false);
  
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
  const { formatPrice, formatRegionalPrice } = useCurrency();
  const { incrementStat } = useAchievements();
  const { trackStoreClick } = useConversionTracking();
  const { getRegionalUrl, regionShortName, currentRegion } = useRegionalStore();
  
  // Use the extracted color variants hook
  const {
    colorVariants,
    selectedVariant,
    handleColorVariantSelect,
    productLineAvailableInRegion,
    getColorFromTitle: getColorName,
    getBaseProductName: getBaseName,
  } = useFilamentColorVariants(filament, currentRegion);
  
  // The filament to display - either the selected color variant or the base filament from URL
  const displayFilament = selectedVariant || filament;
  
  // IMPORTANT: Use the BASE filament (not selected variant) for pricing, URLs, and regional availability
  const pricingFilament = filament;
  
  // Get regional price and URL from database
  const regionalPriceData = useRegionalPrice(pricingFilament as FilamentWithRegionalPrices | null);

  const compatibility = selectedPrinter && displayFilament 
    ? checkPrinterFilamentCompatibility(selectedPrinter, displayFilament)
    : null;

  // Build retailers array for modal
  const retailers: Retailer[] = useMemo(() => {
    if (!pricingFilament) return [];
    
    const result: Retailer[] = [];
    
    const bestRegionalUrl = regionalPriceData.regionalUrl || getRegionalUrl(pricingFilament.product_url, pricingFilament.vendor);
    
    if (bestRegionalUrl) {
      result.push({
        id: 'store',
        name: `${pricingFilament.vendor || 'Store'} (${regionShortName})`,
        price: regionalPriceData.regionalPrice,
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
      result.push({
        id: amazon.id,
        name: amazon.name,
        price: amazon.price,
        inStock: true,
        url: getAmazonUrl(amazon.link!),
        shippingEstimate: 'Prime eligible',
      });
    }
    
    return result;
  }, [pricingFilament, getAffiliateUrl, getAmazonUrl, getRegionalUrl, regionShortName, regionalPriceData]);

  const handleViewRetailers = () => {
    if (filament) {
      trackStoreClick({
        moduleName: 'view_all_retailers_modal',
        entityId: filament.id,
        entityType: 'filament',
      });
    }
    setRetailersModalOpen(true);
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

  useEffect(() => {
    fetchFilament();
  }, [id]);

  useEffect(() => {
    if (filament?.id) {
      incrementStat('materials_explored');
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

  const fetchFilament = async () => {
    try {
      const { data, error } = await supabase
        .from("filaments")
        .select("*")
        .eq("id", id)
        .maybeSingle();

      if (error) throw error;
      
      if (!data) {
        toast({
          title: "Not Found",
          description: "Filament not found",
          variant: "destructive",
        });
        navigate("/");
        return;
      }
      
      setFilament(data);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to load filament details",
        variant: "destructive",
      });
      navigate("/");
    } finally {
      setLoading(false);
    }
  };

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

      await fetchFilament();
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

      await fetchFilament();
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

      await fetchFilament();
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
      await fetchFilament();
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
      await fetchFilament();
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

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-muted-foreground">Loading filament details...</div>
      </div>
    );
  }

  if (!filament || !displayFilament || !pricingFilament) return null;

  // Check if this product is available in the user's region
  const isAvailableInRegion = productLineAvailableInRegion || isFilamentAvailableInRegion(
    displayFilament as FilamentWithRegion,
    currentRegion
  );
  
  // Show "Not Available" message for regional products not available in user's region
  if (!isAvailableInRegion && isRegionalBrand(displayFilament.vendor)) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-background via-background to-muted/20">
        <div className="max-w-[1400px] mx-auto p-4 lg:p-8">
          <Button variant="ghost" onClick={() => navigate(-1)} className="mb-6 hover:bg-accent/50 transition-colors">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
          
          <RegionNotAvailable
            productTitle={displayFilament.product_title}
            vendor={displayFilament.vendor}
            material={displayFilament.material}
            regionName={getRegionDisplayName(currentRegion)}
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
  
  const hasActualRegionalPrice = regionalPriceData.isActualRegionalPrice && regionalPriceData.regionalPrice !== null;
  
  const rawPricePerKg = hasActualRegionalPrice
    ? (regionalPriceData.regionalPrice! / totalWeightKg)
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
  
  const rawPricePerSpool = hasActualRegionalPrice
    ? (regionalPriceData.regionalPrice! / packQuantity)
    : pricingFilament.variant_price 
      ? (pricingFilament.variant_price / packQuantity)
      : null;
  
  const totalPackPrice = isMultiPack 
    ? hasActualRegionalPrice && regionalPriceData.regionalPrice
      ? formatRegionalPrice(regionalPriceData.regionalPrice) 
      : displayFilament.variant_price
        ? formatPrice(displayFilament.variant_price)
        : null
    : null;

  const baseProductName = getBaseName(filament.product_title);

  // Build SEO description
  const seoDescription = `${displayFilament.vendor || ''} ${displayFilament.material || ''} filament${displayFilament.transmission_distance ? ` with TD ${displayFilament.transmission_distance} for HueForge` : ''}. ${
    displayFilament.nozzle_temp_min_c && displayFilament.nozzle_temp_max_c
      ? `Nozzle: ${displayFilament.nozzle_temp_min_c}-${displayFilament.nozzle_temp_max_c}°C. `
      : ''
  }${
    displayFilament.bed_temp_min_c && displayFilament.bed_temp_max_c
      ? `Bed: ${displayFilament.bed_temp_min_c}-${displayFilament.bed_temp_max_c}°C. `
      : ''
  }${rawPricePerKg ? `From $${rawPricePerKg.toFixed(2)}/kg. ` : ''}Compare specs & prices at FilaScope.`;

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-background to-muted/20">
      {/* SEO Meta Tags */}
      <ProductSEO
        title={`${displayFilament.vendor || ''} ${cleanFilamentDisplayName(baseProductName)}`}
        description={seoDescription}
        canonicalUrl={`/filament/${displayFilament.id}`}
        image={displayFilament.featured_image}
        brand={displayFilament.vendor}
        material={displayFilament.material}
        price={rawPricePerKg}
        availability={displayFilament.variant_available ?? true}
        transmissionDistance={displayFilament.transmission_distance}
      />
      
      {/* JSON-LD Structured Data */}
      <ProductJsonLd
        name={`${displayFilament.vendor || ''} ${cleanFilamentDisplayName(baseProductName)}`}
        description={seoDescription}
        image={displayFilament.featured_image}
        brand={displayFilament.vendor}
        sku={displayFilament.variant_sku}
        gtin={displayFilament.gtin || displayFilament.ean || displayFilament.upc}
        mpn={displayFilament.mpn}
        material={displayFilament.material}
        color={displayFilament.color_family}
        url={`https://filascope.com/filament/${displayFilament.id}`}
        price={rawPricePerKg}
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
      />

      <div className="max-w-[1400px] mx-auto p-4 lg:p-8">
        <Button variant="ghost" onClick={() => navigate(-1)} className="mb-6 hover:bg-accent/50 transition-colors">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Button>

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
              }))}
              onSelectColor={(variant) => {
                const fullVariant = colorVariants.find(v => v.id === variant.id);
                if (fullVariant) handleColorVariantSelect(fullVariant);
              }}
              getColorFromTitle={(title) => getColorName(title, baseProductName)}
              isMultiPack={isMultiPack}
              packQuantity={packQuantity}
              isAdmin={isAdmin}
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
            <FilamentTabNav activeTab={activeTab} onTabChange={setActiveTab} />

            {/* Tab Content */}
            <FilamentTabContent activeTab={activeTab}>
              {activeTab === "overview" && (
                <OverviewTabContent filament={displayFilament} />
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
                  pricePerKg={rawPricePerKg}
                  pricePerSpool={rawPricePerSpool}
                  affiliateUrl={getAffiliateUrl(
                    selectedVariant?.product_url || regionalPriceData.regionalUrl || pricingFilament.product_url || '', 
                    pricingFilament.vendor
                  )}
                  productUrl={selectedVariant?.product_url || regionalPriceData.regionalUrl || pricingFilament.product_url || ''}
                  originalUsUrl={regionalPriceData.fallbackUrl || pricingFilament.product_url || undefined}
                  hasActualRegionalPrice={hasActualRegionalPrice}
                  onViewRetailers={handleViewRetailers}
                  onRetailerClick={handleRetailerClick}
                />
              )}

              {activeTab === "community" && (
                <CommunityTabContent filament={displayFilament} />
              )}
            </FilamentTabContent>

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
              }}
            />
          </div>

          {/* Sticky Sidebar - Desktop Only */}
          <FilamentPurchaseSidebar
            filamentId={displayFilament.id}
            vendor={pricingFilament.vendor}
            material={pricingFilament.material}
            pricePerKg={rawPricePerKg}
            pricePerSpool={rawPricePerSpool}
            weightGrams={pricingFilament.net_weight_g}
            affiliateUrl={getAffiliateUrl(
              selectedVariant?.product_url || regionalPriceData.regionalUrl || pricingFilament.product_url || '', 
              pricingFilament.vendor
            )}
            productUrl={selectedVariant?.product_url || regionalPriceData.regionalUrl || pricingFilament.product_url || ''}
            originalUsUrl={regionalPriceData.fallbackUrl || pricingFilament.product_url || undefined}
            retailerName={pricingFilament.vendor || undefined}
            retailerCount={retailers.length}
            onViewRetailers={handleViewRetailers}
            hasActualRegionalPrice={hasActualRegionalPrice}
            isUsingFallbackRegion={regionalPriceData.isUsingFallbackRegion}
            actualUrlCurrency={regionalPriceData.actualUrlCurrency}
            isAvailableInUserRegion={regionalPriceData.isAvailableInUserRegion}
            isRegionalBrand={regionalPriceData.isRegionalBrand}
            onOpenCalculator={() => setIsCalculatorOpen(true)}
          />
        </div>
      </div>

      {/* Mobile Bottom Bar */}
      <FilamentMobileBottomBar
        filamentId={displayFilament.id}
        pricePerKg={rawPricePerKg}
        pricePerSpool={rawPricePerSpool}
        weightGrams={pricingFilament.net_weight_g}
        affiliateUrl={getAffiliateUrl(
          selectedVariant?.product_url || regionalPriceData.regionalUrl || pricingFilament.product_url || '', 
          pricingFilament.vendor
        )}
        productUrl={selectedVariant?.product_url || regionalPriceData.regionalUrl || pricingFilament.product_url || ''}
        originalUsUrl={regionalPriceData.fallbackUrl || pricingFilament.product_url || undefined}
        hasActualRegionalPrice={hasActualRegionalPrice}
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
              price: filament.variant_price || 0,
              density: filament.density_g_cm3,
              spoolWeight: filament.net_weight_g || 1000,
              nozzleTempMin: filament.nozzle_temp_min_c,
              nozzleTempMax: filament.nozzle_temp_max_c,
              bedTempMin: filament.bed_temp_min_c,
              bedTempMax: filament.bed_temp_max_c,
            }}
            isOpen={isCalculatorOpen}
            onClose={() => setIsCalculatorOpen(false)}
          />
        </>
      )}

      {/* Sticky Buy Bar */}
      {pricingFilament && (
        <StickyBuyBar
          filament={pricingFilament}
          affiliateUrl={getAffiliateUrl(regionalPriceData.regionalUrl || pricingFilament.product_url || '', pricingFilament.vendor)}
          pricePerKg={rawPricePerKg}
          isVisible={stickyBarVisible}
          hasActualRegionalPrice={hasActualRegionalPrice}
        />
      )}

      {/* Spacer for sticky bar */}
      <div className="h-20 md:h-16" />
    </div>
  );
};

export default FilamentDetail;
