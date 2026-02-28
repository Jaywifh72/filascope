import { useState, useMemo, useEffect, useRef } from "react";
import { DocumentHead } from "@/components/seo/DocumentHead";
import { BreadcrumbSchema, ItemListSchema, FAQSection, PrinterListProductSchema, CollectionPageSchema } from "@/components/seo";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { usePrinterCompare } from "@/hooks/usePrinterCompare";
import { useFilterAnalytics } from "@/hooks/useFilterAnalytics";
import { useSearchContext } from "@/hooks/useSearchContext";
import { useRegion } from "@/contexts/RegionContext";
import { getPrinterSortPrice } from "@/utils/printerRegionalPrice";

import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { ArrowUp, Download, Loader2, X, Database as DatabaseIcon, GitCompareArrows, Sparkles, Tag } from "lucide-react";
import type { Database } from "@/integrations/supabase/types";
import PrintersHeroSection from "@/components/PrintersHeroSection";
import PrintersLeftSidebar, { type AdvancedFilters } from "@/components/printers/PrintersLeftSidebar";
import { MobileFilterDrawer } from "@/components/printers/MobileFilterDrawer";
import MediumStandardPrinterCard from "@/components/printers/MediumStandardPrinterCard";
import { PrinterCardSkeletonGrid } from "@/components/printers/PrinterCardSkeleton";
import { PrintersEmptyState } from "@/components/printers/PrintersEmptyState";
import PrinterQuiz from "@/components/printers/PrinterQuiz";
import PrinterQuizResults from "@/components/printers/PrinterQuizResults";
import { calculateRecommendations, QuizResults } from "@/lib/printerQuizService";
import { QuizAnswers } from "@/lib/printerQuizData";
import { exportPrinterDatabaseCSV } from "@/lib/printerExportUtils";
import ActiveFilterChips from "@/components/printers/ActiveFilterChips";
import { PrinterQuickFilterChips, type PrinterQuickFilter } from "@/components/printers/PrinterQuickFilterChips";

const PRINTERS_PER_PAGE = 24;

// Brand wiki/documentation URLs
const BRAND_WIKI_URLS: Record<string, string> = {
  "Bambu Lab": "https://wiki.bambulab.com",
  "Creality": "https://en.wikipedia.org/wiki/Creality",
  "Snapmaker": "https://wiki.snapmaker.com/Snapmaker_2",
  "FLSUN": "https://flsun3d.com",
  "Anycubic": "https://www.anycubic.com",
  "FlashForge": "https://wiki.flashforge.com/en/guider_series/guider_4/guider_4",
  "Elegoo": "https://wiki.elegoo.com/en/jupiter",
  "AnkerMake": "https://www.eufymake.com/blogs/news/ankermake-rebranding-to-eufymake",
  "eufyMake": "https://www.eufymake.com/blogs/news/ankermake-rebranding-to-eufymake",
  "Markforged": "https://markforged.com",
  "Raise3D": "https://www.raise3d.com",
  "Prusa Research": "https://www.prusa3d.com/category/3d-printers",
  "UltiMaker": "https://ultimaker.com/3d-printers",
  "Sovol": "https://www.sovol3d.com/collections/3d-printer",
  "Rat Rig": "https://ratrig.com/collections/3d-printers",
  "Voron Design": "https://vorondesign.com",
  "QIDI": "https://ca.qidi3d.com/collections/3d-printers",
  "QIDI Tech": "https://ca.qidi3d.com/collections/3d-printers",
};

type Printer = Database["public"]["Tables"]["printers"]["Row"] & {
  brand: { brand: string } | null;
  series: { series_name: string } | null;
};

// Helper functions for category filtering
const isFDM = (p: Printer) => {
  const tech = (p.printer_technology || "").toLowerCase();
  return tech.includes("fdm") || tech.includes("fff") || (!tech.includes("resin") && !tech.includes("sla") && !tech.includes("msla") && !tech.includes("dlp"));
};

const isResin = (p: Printer) => {
  const tech = (p.printer_technology || "").toLowerCase();
  return tech.includes("resin") || tech.includes("sla") || tech.includes("msla") || tech.includes("dlp");
};

const isCoreXY = (p: Printer) => {
  const motion = (p.motion_system_notes || "").toLowerCase();
  const style = (p.machine_style || "").toLowerCase();
  return motion.includes("corexy") || style.includes("corexy");
};

const getPrice = (p: Printer) => p.current_price_usd_store || p.current_price_usd_amazon || p.msrp_usd || Infinity;

// This is a static USD-only helper used for category counts. 
// For region-aware sorting/filtering, we use getPrinterSortPrice inside the component.

const defaultAdvancedFilters: AdvancedFilters = {
  brands: [],
  motionSystem: "any",
  minSpeed: 0,
  maxSpeed: 1000,
  features: [],
};

export default function Printers() {
  const navigate = useNavigate(); 
  const queryClient = useQueryClient();
  const { isAdmin } = useAuth();
  const { region, getConversionRate, currency } = useRegion();
  
  // Scroll restoration hook (kept for potential future use)
  
  // Search analytics tracking
  const { startSearchTimer, trackSearch } = useFilterAnalytics();
  const { trackSearch: trackSearchHistory } = useSearchContext();
  const searchTimerRef = useRef<number | null>(null);
  
  // Search and quick filters
  const [searchTerm, setSearchTerm] = useState("");
  const [activeQuickFilters, setActiveQuickFilters] = useState<string[]>([]);
  const [activeChip, setActiveChip] = useState<PrinterQuickFilter | null>(null);
  const [showDiscontinued, setShowDiscontinued] = useState(false);
  
  // Filter bar state
  const [activeCategory, setActiveCategory] = useState("all");
  const [sortBy, setSortBy] = useState("price-asc");
  const [priceRangeFilter, setPriceRangeFilter] = useState("all");
  const [buildVolumeFilter, setBuildVolumeFilter] = useState("all");
  const [advancedFilters, setAdvancedFilters] = useState<AdvancedFilters>(defaultAdvancedFilters);
  
  
  
  
  // Quiz state
  const [isQuizOpen, setIsQuizOpen] = useState(false);
  const [quizResults, setQuizResults] = useState<QuizResults | null>(null);
  
  // Export state
  const [isExporting, setIsExporting] = useState(false);

  const handleExportCSV = async () => {
    setIsExporting(true);
    try {
      const result = await exportPrinterDatabaseCSV();
      if (result.success) {
        toast.success(`Exported ${result.count} printers to CSV`);
      } else {
        toast.error(result.error || 'Export failed');
      }
    } catch (error) {
      toast.error('Failed to export printers');
      console.error(error);
    } finally {
      setIsExporting(false);
    }
  };

  const handleQuizComplete = (answers: QuizAnswers) => {
    if (printers) {
      const results = calculateRecommendations(printers, answers);
      setQuizResults(results);
      setIsQuizOpen(false);
    }
  };

  const handleQuizRetake = () => {
    setQuizResults(null);
    setIsQuizOpen(true);
  };

  const handleAddToCompareFromQuiz = (printerId: string) => {
    const printer = printers?.find(p => p.id === printerId);
    if (printer && !isMaxReached && !isSelected(printerId)) {
      const scrapedData = printer.scraped_data as Record<string, unknown> | null;
      const images = scrapedData?.images as Record<string, unknown> | null;
      const productImages = images?.product_images as string[] | null;
      const productImage = productImages?.[0] || null;

      addPrinter({
        id: printer.id,
        name: `${printer.brand?.brand || ""} ${printer.model_name}`.trim(),
        imageUrl: productImage,
        brand: printer.brand?.brand || null,
      });
    }
  };

  // Toggle quick filter with sync to category tabs
  const handleQuickFilterToggle = (filterId: string) => {
    setActiveQuickFilters(prev => {
      const newFilters = prev.includes(filterId) 
        ? prev.filter(id => id !== filterId)
        : [...prev, filterId];
      
      // Sync with category tabs
      if (filterId === 'resin' && newFilters.includes('resin')) {
        setActiveCategory('resin');
      } else if (filterId === 'budget' && newFilters.includes('budget')) {
        setActiveCategory('budget');
        setPriceRangeFilter('0-500');
      } else if (filterId === 'multicolor' && newFilters.includes('multicolor')) {
        setActiveCategory('multicolor');
      }
      
      return newFilters;
    });
  };

  // Handle category change with sync to quick filters
  const handleCategoryChange = (category: string) => {
    setActiveCategory(category);
    
    // Sync with quick filters
    if (category === 'resin' && !activeQuickFilters.includes('resin')) {
      setActiveQuickFilters(prev => [...prev.filter(f => f !== 'budget' && f !== 'multicolor'), 'resin']);
    } else if (category === 'budget') {
      setActiveQuickFilters(prev => [...prev.filter(f => f !== 'resin' && f !== 'multicolor'), 'budget']);
      setPriceRangeFilter('0-500');
    } else if (category === 'multicolor') {
      setActiveQuickFilters(prev => [...prev.filter(f => f !== 'resin' && f !== 'budget'), 'multicolor']);
    } else if (category === 'all' || category === 'fdm' || category === 'corexy') {
      // Clear category-specific quick filters
      setActiveQuickFilters(prev => prev.filter(f => !['resin', 'budget', 'multicolor'].includes(f)));
      if (category === 'all') setPriceRangeFilter('all');
    }
  };

  // Clear all filters
  const handleClearAllFilters = () => {
    setActiveCategory('all');
    setSortBy('price-asc');
    setPriceRangeFilter('all');
    setBuildVolumeFilter('all');
    setAdvancedFilters(defaultAdvancedFilters);
    setActiveQuickFilters([]);
    setActiveChip(null);
    setSearchTerm('');
  };
  
  // Track search analytics - start timer on search change
  useEffect(() => {
    if (searchTerm && searchTerm.trim().length > 0) {
      startSearchTimer();
      // Track search in history
      trackSearchHistory(searchTerm);
    }
  }, [searchTerm, startSearchTimer, trackSearchHistory]);

  const hasActiveFilters = 
    activeCategory !== 'all' ||
    priceRangeFilter !== 'all' ||
    buildVolumeFilter !== 'all' ||
    advancedFilters.brands.length > 0 ||
    advancedFilters.motionSystem !== 'any' ||
    advancedFilters.minSpeed > 0 ||
    advancedFilters.maxSpeed < 1000 ||
    advancedFilters.features.length > 0 ||
    activeQuickFilters.length > 0 ||
    activeChip !== null;
  
  // Printer compare context
  // Printer compare context
  const { addPrinter, removePrinter, isSelected, isMaxReached, selectedPrinters, count: compareCount } = usePrinterCompare();
  
  // Image edit dialog state
  const [imageEditPrinter, setImageEditPrinter] = useState<Printer | null>(null);
  const [newImageUrl, setNewImageUrl] = useState("");

  // Fetch brands
  const { data: brands } = useQuery({
    queryKey: ["printer-brands-list"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("printer_brands")
        .select("brand")
        .order("brand");
      
      if (error) throw error;
      return data.map(b => b.brand);
    },
  });

  // Fetch printers
  const { data: printers, isLoading } = useQuery({
    queryKey: ["printers-list", searchTerm],
    queryFn: async () => {
      let query = supabase
        .from("printers")
        .select(`
          *,
          brand:printer_brands!brand_id(brand),
          series:printer_series!series_id(series_name)
        `);

      if (searchTerm) {
        query = query.or(`model_name.ilike.%${searchTerm}%,variant_or_bundle_name.ilike.%${searchTerm}%`);
      }

      const { data, error } = await query.order("model_name");
      
      if (error) throw error;
      return data as Printer[];
    },
  });

  // Calculate category counts
  const categoryCounts = useMemo(() => {
    if (!printers) return { all: 0, fdm: 0, resin: 0, corexy: 0, budget: 0, multicolor: 0 };
    
    return {
      all: printers.length,
      fdm: printers.filter(p => isFDM(p)).length,
      resin: printers.filter(p => isResin(p)).length,
      corexy: printers.filter(p => isCoreXY(p)).length,
      budget: printers.filter(p => getPrice(p) <= 500).length,
      multicolor: printers.filter(p => p.multi_material_supported).length,
    };
  }, [printers]);

  // Filter and sort printers
  const filteredPrinters = useMemo(() => {
    if (!printers) return [];

    const filtered = printers.filter(printer => {
      // Discontinued filter — hide by default
      if (printer.discontinued && !showDiscontinued) return false;

      const price = getPrinterSortPrice(printer as any, region);
      const priceUsd = getPrice(printer); // keep USD for category counts
      const maxDimension = Math.max(
        printer.build_volume_x_mm || 0,
        printer.build_volume_y_mm || 0,
        printer.build_volume_z_mm || 0
      );
      const printerSpeed = printer.max_print_speed_mms || 0;

      // Category filter
      if (activeCategory !== 'all') {
        switch (activeCategory) {
          case 'fdm':
            if (!isFDM(printer)) return false;
            break;
          case 'resin':
            if (!isResin(printer)) return false;
            break;
          case 'corexy':
            if (!isCoreXY(printer)) return false;
            break;
          case 'budget':
            if (priceUsd > 500) return false;
            break;
          case 'multicolor':
            if (!printer.multi_material_supported) return false;
            break;
        }
      }

      // Price range filter
      if (priceRangeFilter !== 'all') {
        switch (priceRangeFilter) {
          case '0-300':
            if (price > 300) return false;
            break;
          case '0-500':
            if (price > 500) return false;
            break;
          case '500-1000':
            if (price < 500 || price > 1000) return false;
            break;
          case '1000-2000':
            if (price < 1000 || price > 2000) return false;
            break;
          case '2000-3000':
            if (price < 2000 || price > 3000) return false;
            break;
          case '3000+':
            if (price < 3000) return false;
            break;
        }
      }

      // Build volume filter
      if (buildVolumeFilter !== 'all') {
        switch (buildVolumeFilter) {
          case 'small':
            if (maxDimension >= 200) return false;
            break;
          case 'medium':
            if (maxDimension < 200 || maxDimension >= 300) return false;
            break;
          case 'large':
            if (maxDimension < 300) return false;
            break;
        }
      }

      // Advanced filters
      if (advancedFilters.brands.length > 0) {
        if (!printer.brand?.brand || !advancedFilters.brands.includes(printer.brand.brand)) return false;
      }

      if (advancedFilters.motionSystem !== 'any') {
        const motion = (printer.motion_system_notes || '').toLowerCase();
        const style = (printer.machine_style || '').toLowerCase();
        const matchesMotion = motion.includes(advancedFilters.motionSystem) || style.includes(advancedFilters.motionSystem);
        if (!matchesMotion) return false;
      }

      if (advancedFilters.minSpeed > 0 || advancedFilters.maxSpeed < 1000) {
        if (printerSpeed < advancedFilters.minSpeed || printerSpeed > advancedFilters.maxSpeed) return false;
      }

      if (advancedFilters.features.length > 0) {
        const hasAllFeatures = advancedFilters.features.every(feature => {
          switch (feature) {
            case 'auto_bed_leveling': return printer.auto_bed_leveling;
            case 'heated_bed': return printer.bed_heated;
            case 'enclosed': return printer.has_enclosure;
            case 'camera': return printer.ai_spaghetti_detection || printer.remote_monitoring_supported;
            case 'wifi': return printer.has_wifi;
            case 'filament_sensor': return printer.filament_runout_detection;
            case 'dual_extruder': return (printer.extruder_count || 1) > 1;
            default: return true;
          }
        });
        if (!hasAllFeatures) return false;
      }

      // Quick filters (OR logic)
      if (activeQuickFilters.length > 0) {
        const matchesAny = activeQuickFilters.some(filterId => {
          switch (filterId) {
            case 'budget': return priceUsd <= 500;
            case 'beginner': return printer.has_enclosure && printer.auto_bed_leveling;
            case 'multicolor': return printer.multi_material_supported;
            case 'large': return maxDimension >= 300;
            case 'resin': return isResin(printer);
            case 'speed': return printerSpeed >= 300;
            default: return false;
          }
        });
        if (!matchesAny) return false;
      }

      // Quick chip filter (mutually exclusive, AND logic with other filters)
      if (activeChip) {
        const POPULAR_BRANDS = ["Bambu Lab", "Creality", "Prusa Research"];
        switch (activeChip) {
          case "popular":
            if (!printer.brand?.brand || !POPULAR_BRANDS.includes(printer.brand.brand)) return false;
            if (printer.discontinued) return false; // Exclude discontinued from Popular
            break;
          case "under500":
            if (priceUsd > 500) return false;
            break;
          case "enclosed":
            if (!printer.has_enclosure) return false;
            break;
          case "multicolor":
            if (!printer.multi_material_supported) return false;
            break;
          case "highspeed":
            if (printerSpeed < 300) return false;
            break;
          case "large":
            if (maxDimension < 300) return false;
            break;
          case "new": {
            if (printer.discontinued) return false; // Exclude discontinued from New Arrivals
            const createdAt = printer.created_at ? new Date(printer.created_at).getTime() : 0;
            const sixtyDaysAgo = Date.now() - 60 * 24 * 60 * 60 * 1000;
            if (createdAt < sixtyDaysAgo) return false;
            break;
          }
        }
      }

      return true;
    });

    // Sort using regional prices
    return filtered.sort((a, b) => {
      const getPrinterPrice = (p: Printer) => getPrinterSortPrice(p as any, region);
      const getVolume = (p: Printer) => (p.build_volume_x_mm || 0) * (p.build_volume_y_mm || 0) * (p.build_volume_z_mm || 0);
      
      switch (sortBy) {
        case "name-asc": return a.model_name.localeCompare(b.model_name);
        case "name-desc": return b.model_name.localeCompare(a.model_name);
        case "price-asc": return getPrinterPrice(a) - getPrinterPrice(b);
        case "price-desc": return getPrinterPrice(b) - getPrinterPrice(a);
        case "speed-desc": return (b.max_print_speed_mms || 0) - (a.max_print_speed_mms || 0);
        case "volume-desc": return getVolume(b) - getVolume(a);
        default: return 0;
      }
    });
  }, [printers, activeCategory, priceRangeFilter, buildVolumeFilter, advancedFilters, activeQuickFilters, sortBy, activeChip, region, showDiscontinued]);

  const advancedFilterCount = 
    advancedFilters.brands.length +
    (advancedFilters.motionSystem !== 'any' ? 1 : 0) +
    (advancedFilters.minSpeed > 0 || advancedFilters.maxSpeed < 1000 ? 1 : 0) +
    advancedFilters.features.length;

  // Track search results when they're displayed
  const prevSearchTermRef = useRef<string>("");
  useEffect(() => {
    // Only track when we have a search term and results have loaded
    if (searchTerm && searchTerm.trim().length > 0 && !isLoading && printers !== undefined) {
      // Only track if search term changed (avoid duplicate tracking)
      if (prevSearchTermRef.current !== searchTerm) {
        prevSearchTermRef.current = searchTerm;
        
        // Get the active filters as strings
        const appliedFilters: string[] = [];
        if (activeCategory !== "all") {
          appliedFilters.push(`category:${activeCategory}`);
        }
        if (priceRangeFilter !== "all") {
          appliedFilters.push(`price:${priceRangeFilter}`);
        }
        if (advancedFilters.brands.length > 0) {
          appliedFilters.push(`brand:${advancedFilters.brands.join(",")}`);
        }
        
        // Calculate result count
        const resultCount = filteredPrinters?.length || 0;
        
        trackSearch({
          query: searchTerm,
          result_count: resultCount,
          has_results: resultCount > 0,
          filters_applied: appliedFilters,
        });
      }
    }
  }, [searchTerm, isLoading, printers, filteredPrinters, activeCategory, priceRangeFilter, advancedFilters, trackSearch]);

  // Render all printers (no load-more for full SEO crawlability)
  const displayedPrinters = filteredPrinters;

  // Scroll to top helper
  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const toggleCompareSelection = (printer: Printer) => {
    const scrapedData = printer.scraped_data as Record<string, unknown> | null;
    const images = scrapedData?.images as Record<string, unknown> | null;
    const productImages = images?.product_images as string[] | null;
    const productImage = productImages?.[0] || null;

    if (isSelected(printer.id)) {
      removePrinter(printer.id);
    } else {
      addPrinter({
        id: printer.id,
        name: `${printer.brand?.brand || ""} ${printer.model_name}`.trim(),
        imageUrl: productImage,
        brand: printer.brand?.brand || null,
      });
    }
  };

  const rescrapeMutation = useMutation({
    mutationFn: async (printerId: string) => {
      const { error } = await supabase
        .from("printers")
        .update({
          status: "pending",
          scrape_status: "not_started",
          scraped_data: null,
          scrape_error: null,
        })
        .eq("id", printerId);

      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Printer queued for rescraping");
    },
    onError: (error) => {
      toast.error("Failed to queue printer for rescraping");
      console.error(error);
    },
  });

  const updateImageMutation = useMutation({
    mutationFn: async ({ printerId, imageUrl }: { printerId: string; imageUrl: string }) => {
      // Get current scraped_data
      const { data: printer, error: fetchError } = await supabase
        .from("printers")
        .select("scraped_data")
        .eq("id", printerId)
        .single();

      if (fetchError) throw fetchError;

      // Update scraped_data with new image
      const currentData = (printer?.scraped_data as Record<string, unknown>) || {};
      const updatedData = {
        ...currentData,
        images: {
          ...(currentData.images as Record<string, unknown> || {}),
          product_images: [imageUrl],
        },
      };

      const { error } = await supabase
        .from("printers")
        .update({ scraped_data: updatedData })
        .eq("id", printerId);

      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Printer image updated");
      queryClient.invalidateQueries({ queryKey: ["printers-list"] });
      setImageEditPrinter(null);
      setNewImageUrl("");
    },
    onError: (error) => {
      toast.error("Failed to update printer image");
      console.error(error);
    },
  });

  const openImageEditDialog = (printer: Printer, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setImageEditPrinter(printer);
    // Pre-fill with existing image if available
    const existingImages = (printer.scraped_data as Record<string, unknown>)?.images as Record<string, unknown>;
    const productImages = existingImages?.product_images as string[] | undefined;
    setNewImageUrl(productImages?.[0] || "");
  };

  return (
    <>
      <DocumentHead
        title={`3D Printer Database — Compare ${printers?.length || 118}+ Printers | FilaScope`}
        description={`Compare ${printers?.length || 118}+ 3D printers from ${brands?.length || 17}+ brands. Filter by build volume, speed, features, and price. Find compatible filaments for your printer on FilaScope.`}
        ogTitle={`3D Printer Database — Compare ${printers?.length || 118}+ Printers | FilaScope`}
        ogDescription={`Compare ${printers?.length || 118}+ 3D printers from ${brands?.length || 17}+ brands. Filter by build volume, speed, features, and price. Find compatible filaments for your printer on FilaScope.`}
      />
      <BreadcrumbSchema items={[
        { name: 'Home', url: 'https://filascope.com/' },
        { name: '3D Printers', url: 'https://filascope.com/printers' },
      ]} />
      <ItemListSchema
        name="3D Printer Database"
        description={`Compare ${printers?.length || 118}+ 3D printers from ${brands?.length || 17}+ brands with detailed specs and filament compatibility.`}
        items={(printers || []).slice(0, 50).map((p, i) => ({
          name: `${p.brand?.brand || ''} ${p.model_name}`.trim(),
          url: `https://filascope.com/printers/${p.printer_id || p.id}`,
          position: i + 1,
        }))}
      />
      <PrinterListProductSchema printers={filteredPrinters} />
      <CollectionPageSchema
        name="3D Printer Database"
        description={`Compare ${printers?.length || 118}+ 3D printers from ${brands?.length || 17}+ brands. Filter by build volume, speed, features, and price.`}
        url="https://filascope.com/printers"
        numberOfItems={printers?.length || 0}
      />
      <div className="min-h-screen bg-background pb-16">
      {/* Hero Section */}
      <PrintersHeroSection
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        printerCount={printers?.length || 0}
        brandCount={brands?.length || 0}
        activeQuickFilters={activeQuickFilters}
        onQuickFilterToggle={handleQuickFilterToggle}
        onOpenQuiz={() => setIsQuizOpen(true)}
      />

      {/* Quiz Modal */}
      {isQuizOpen && (
        <PrinterQuiz
          onClose={() => setIsQuizOpen(false)}
          onComplete={handleQuizComplete}
        />
      )}

      {/* Quiz Results Modal */}
      {quizResults && (
        <PrinterQuizResults
          results={quizResults}
          onClose={() => setQuizResults(null)}
          onRetake={handleQuizRetake}
          onAddToCompare={handleAddToCompareFromQuiz}
        />
      )}

      {/* Quick Action Cards */}
      <div className="w-full max-w-[1800px] mx-auto px-4 sm:px-6 mt-3 sm:mt-4">
        <div className="flex flex-col sm:flex-row gap-3">
          {/* Hardware Quiz */}
          <button
            onClick={() => setIsQuizOpen(true)}
            className="flex-1 bg-cyan-500/5 border border-cyan-500/20 rounded-lg p-3 flex items-start gap-3 hover:border-cyan-500/40 transition-colors text-left"
          >
            <Sparkles className="h-5 w-5 text-cyan-400 mt-0.5 flex-shrink-0" />
            <div>
              <div className="text-sm font-semibold text-foreground">Hardware Quiz</div>
              <div className="text-xs text-muted-foreground">Find your ideal printer in 60 seconds</div>
            </div>
          </button>

          {/* Compare Printers */}
          <Link
            to="/printers/compare"
            className="flex-1 bg-muted/5 border border-border rounded-lg p-3 flex items-start gap-3 hover:border-border/80 transition-colors"
          >
            <GitCompareArrows className="h-5 w-5 text-cyan-400 mt-0.5 flex-shrink-0" />
            <div>
              <div className="text-sm font-semibold text-foreground">Compare Printers</div>
              <div className="text-xs text-muted-foreground">Side-by-side specs & pricing</div>
            </div>
          </Link>

          {/* Printer Deals */}
          <Link
            to="/deals?type=printer"
            className="flex-1 bg-muted/5 border border-border rounded-lg p-3 flex items-start gap-3 hover:border-border/80 transition-colors"
          >
            <Tag className="h-5 w-5 text-cyan-400 mt-0.5 flex-shrink-0" />
            <div>
              <div className="text-sm font-semibold text-foreground">Printer Deals</div>
              <div className="text-xs text-muted-foreground">Current discounts & offers</div>
            </div>
          </Link>
        </div>
      </div>

      {/* Results Header - Industrial style */}
      <div className="w-full max-w-[1800px] mx-auto px-4 sm:px-6 mb-4 sm:mb-6 mt-3 sm:mt-4 animate-fade-in">
        <div className="flex flex-col gap-2.5 bg-white/[0.02] border border-white/5 rounded-xl px-4 sm:px-6 py-3 sm:py-4">
          {/* Top row */}
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              {/* Mobile Filter Button */}
              <MobileFilterDrawer
                sortBy={sortBy}
                onSortChange={setSortBy}
                priceRange={priceRangeFilter}
                onPriceChange={setPriceRangeFilter}
                buildVolume={buildVolumeFilter}
                onBuildVolumeChange={setBuildVolumeFilter}
                advancedFilters={advancedFilters}
                onAdvancedFiltersChange={setAdvancedFilters}
                availableBrands={brands || []}
                hasActiveFilters={hasActiveFilters}
                activeFilterCount={advancedFilterCount + (activeCategory !== 'all' ? 1 : 0) + (priceRangeFilter !== 'all' ? 1 : 0) + (buildVolumeFilter !== 'all' ? 1 : 0)}
                onClearFilters={handleClearAllFilters}
              />
              <DatabaseIcon className="w-5 h-5 text-primary hidden sm:block flex-shrink-0" />
              <h2 className="flex items-center gap-1.5 flex-wrap">
                <span className="text-xs font-semibold uppercase tracking-[0.35em] text-muted-foreground hidden sm:inline">Hardware Registry</span>
                <span className="text-muted-foreground hidden sm:inline">—</span>
                {hasActiveFilters ? (
                  <>
                    <span className="text-xs font-semibold text-cyan-400">{filteredPrinters?.length.toLocaleString() || 0}</span>
                    <span className="text-xs text-muted-foreground">of {printers?.length.toLocaleString() || 0} printers</span>
                  </>
                ) : (
                  <>
                    <span className="text-xs font-medium text-cyan-400">{filteredPrinters?.length.toLocaleString() || 0}</span>
                    <span className="text-xs text-muted-foreground">printers</span>
                  </>
                )}
              </h2>
              {hasActiveFilters && (
                <button
                  onClick={handleClearAllFilters}
                  className="text-xs text-gray-400 hover:text-cyan-400 transition-colors inline-flex items-center gap-1 ml-1"
                >
                  <X className="w-3 h-3" />
                  Clear all
                </button>
              )}
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              {/* Compare Selected Button */}
              {compareCount > 0 && (
                <Button
                  size="sm"
                  onClick={() => {
                    const ids = selectedPrinters.map(p => p.id).join(',');
                    navigate(`/printers/compare?ids=${ids}`);
                  }}
                  className="bg-primary text-primary-foreground hover:bg-primary/90 font-medium text-xs"
                >
                  <GitCompareArrows className="w-3.5 h-3.5 mr-1.5" />
                  Compare Selected ({compareCount})
                </Button>
              )}
              <button
                onClick={handleExportCSV}
                disabled={isExporting}
                className="border border-gray-700 text-gray-400 hover:text-cyan-400 hover:border-cyan-500/30 text-xs font-mono uppercase tracking-wider px-3 py-1.5 rounded transition-colors duration-200 inline-flex items-center disabled:opacity-50"
              >
                {isExporting ? (
                  <Loader2 className="mr-1.5 animate-spin" size={14} />
                ) : (
                  <Download className="mr-1.5" size={14} />
                )}
                Export CSV
              </button>
            </div>
          </div>

          {/* Active filter pills row */}
          {hasActiveFilters && (() => {
            const pills: { label: string; onRemove: () => void }[] = [];

            if (searchTerm) pills.push({ label: `"${searchTerm}"`, onRemove: () => setSearchTerm("") });
            if (activeCategory !== 'all') {
              const catLabels: Record<string, string> = { fdm: "FDM", resin: "Resin", corexy: "CoreXY", budget: "Budget", multicolor: "Multi-Color" };
              pills.push({ label: catLabels[activeCategory] || activeCategory, onRemove: () => setActiveCategory("all") });
            }
            if (priceRangeFilter !== 'all') {
              const priceLabels: Record<string, string> = { "0-300": "Under $300", "0-500": "Under $500", "500-1000": "$500–$1K", "1000-2000": "$1K–$2K", "2000-3000": "$2K–$3K", "3000+": "$3K+" };
              pills.push({ label: priceLabels[priceRangeFilter] || priceRangeFilter, onRemove: () => setPriceRangeFilter("all") });
            }
            if (buildVolumeFilter !== 'all') {
              const volLabels: Record<string, string> = { small: "Small (<200mm)", medium: "Medium (200-300mm)", large: "Large (300mm+)" };
              pills.push({ label: volLabels[buildVolumeFilter] || buildVolumeFilter, onRemove: () => setBuildVolumeFilter("all") });
            }
            advancedFilters.brands.forEach(brand => {
              pills.push({ label: brand, onRemove: () => setAdvancedFilters(prev => ({ ...prev, brands: prev.brands.filter(b => b !== brand) })) });
            });
            if (advancedFilters.motionSystem !== 'any') {
              pills.push({ label: advancedFilters.motionSystem, onRemove: () => setAdvancedFilters(prev => ({ ...prev, motionSystem: "any" })) });
            }
            advancedFilters.features.forEach(f => {
              const featureLabels: Record<string, string> = { auto_bed_leveling: "ABL", heated_bed: "Heated Bed", enclosed: "Enclosed", camera: "Camera", wifi: "WiFi", filament_sensor: "Filament Sensor", dual_extruder: "Dual Extruder" };
              pills.push({ label: featureLabels[f] || f, onRemove: () => setAdvancedFilters(prev => ({ ...prev, features: prev.features.filter(x => x !== f) })) });
            });
            if (activeChip) {
              const chipLabels: Record<string, string> = { popular: "Popular", under500: "Under $500", enclosed: "Enclosed", multicolor: "Multi-Color", highspeed: "High Speed", large: "Large Format", new: "New Arrivals" };
              pills.push({ label: chipLabels[activeChip] || activeChip, onRemove: () => setActiveChip(null) });
            }

            const visible = pills.slice(0, 3);
            const extra = pills.length - 3;

            return (
              <div className="flex items-center gap-1.5 flex-wrap">
                {visible.map((pill, i) => (
                  <span key={i} className="inline-flex items-center gap-1 bg-gray-800 text-gray-300 text-xs px-2 py-0.5 rounded-full">
                    {pill.label}
                    <button onClick={pill.onRemove} className="hover:text-cyan-400 transition-colors">
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
                {extra > 0 && (
                  <span className="text-xs text-muted-foreground">+{extra} more</span>
                )}
              </div>
            );
          })()}
        </div>
      </div>

      {/* Main Content with Sidebar */}
      <div className="max-w-[1800px] mx-auto px-4 sm:px-6 py-4 sm:py-6">
        <div className="flex gap-6">
          {/* Left Sidebar - Filters (Desktop Only) */}
          <PrintersLeftSidebar
            className="hidden lg:block"
            sortBy={sortBy}
            onSortChange={setSortBy}
            priceRange={priceRangeFilter}
            onPriceChange={setPriceRangeFilter}
            buildVolume={buildVolumeFilter}
            onBuildVolumeChange={setBuildVolumeFilter}
            advancedFilters={advancedFilters}
            onAdvancedFiltersChange={setAdvancedFilters}
            availableBrands={brands || []}
            hasActiveFilters={hasActiveFilters}
            onClearFilters={handleClearAllFilters}
          />

          {/* Main Content */}
          <div className="flex-1 min-w-0">
            {/* Quick Filter Chips + Discontinued Toggle */}
            <div className="flex items-center justify-between gap-4 mb-0">
              <div className="flex-1 min-w-0 overflow-hidden">
                <PrinterQuickFilterChips active={activeChip} onChange={setActiveChip} />
              </div>
              <label className="flex items-center gap-2 flex-shrink-0 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={showDiscontinued}
                  onChange={(e) => setShowDiscontinued(e.target.checked)}
                  className="w-3.5 h-3.5 rounded border-border accent-primary"
                />
                <span className="text-xs text-muted-foreground whitespace-nowrap">Show discontinued</span>
              </label>
            </div>

            {/* Active Filter Chips */}
            {hasActiveFilters && (
              <div className="mb-4">
                <ActiveFilterChips
                  activeCategory={activeCategory}
                  priceRange={priceRangeFilter}
                  buildVolume={buildVolumeFilter}
                  advancedFilters={advancedFilters}
                  activeQuickFilters={activeQuickFilters}
                  searchTerm={searchTerm}
                  onRemoveCategory={() => setActiveCategory("all")}
                  onRemovePriceRange={() => setPriceRangeFilter("all")}
                  onRemoveBuildVolume={() => setBuildVolumeFilter("all")}
                  onRemoveBrand={(brand) => {
                    setAdvancedFilters(prev => ({
                      ...prev,
                      brands: prev.brands.filter(b => b !== brand)
                    }));
                  }}
                  onRemoveMotionSystem={() => {
                    setAdvancedFilters(prev => ({
                      ...prev,
                      motionSystem: "any"
                    }));
                  }}
                  onRemoveSpeedFilter={() => {
                    setAdvancedFilters(prev => ({
                      ...prev,
                      minSpeed: 0,
                      maxSpeed: 1000
                    }));
                  }}
                  onRemoveFeature={(feature) => {
                    setAdvancedFilters(prev => ({
                      ...prev,
                      features: prev.features.filter(f => f !== feature)
                    }));
                  }}
                  onRemoveQuickFilter={(filter) => {
                    setActiveQuickFilters(prev => prev.filter(f => f !== filter));
                  }}
                  onRemoveSearch={() => setSearchTerm("")}
                  onClearAll={handleClearAllFilters}
                />
              </div>
            )}

            {/* Printer Grid */}
            {isLoading ? (
              <PrinterCardSkeletonGrid count={PRINTERS_PER_PAGE} />
            ) : filteredPrinters.length === 0 ? (
              <PrintersEmptyState
                searchQuery={searchTerm}
                activeFiltersCount={advancedFilterCount + (activeCategory !== 'all' ? 1 : 0) + (priceRangeFilter !== 'all' ? 1 : 0) + (buildVolumeFilter !== 'all' ? 1 : 0) + activeQuickFilters.length}
                onResetFilters={handleClearAllFilters}
                onSearchBrand={(brand) => setSearchTerm(brand)}
                totalPrinters={printers?.length || 0}
              />
            ) : (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-4 sm:gap-6" style={{ gridAutoFlow: 'dense' }}>
                  {displayedPrinters.map((printer) => {
                    const printerIsSelected = isSelected(printer.id);

                    const handleToggleCompare = () => toggleCompareSelection(printer);
                    const handleEditImage = (e: React.MouseEvent) => openImageEditDialog(printer, e);
                    const handleRescrape = (e: React.MouseEvent) => {
                      e.preventDefault();
                      e.stopPropagation();
                      rescrapeMutation.mutate(printer.id);
                    };

                    return (
                      <MediumStandardPrinterCard
                        key={printer.id}
                        printer={printer}
                        isSelected={printerIsSelected}
                        isMaxReached={isMaxReached}
                        onToggleCompare={handleToggleCompare}
                        isAdmin={isAdmin}
                        onEditImage={handleEditImage}
                        onRescrape={handleRescrape}
                        isRescraping={rescrapeMutation.isPending}
                      />
                    );
                  })}
                </div>

                {/* Footer — all printers shown */}
                {filteredPrinters.length > 0 && (
                  <div className="flex flex-col items-center gap-4 py-8">
                    <p className="font-mono text-xs uppercase tracking-[0.1em] text-muted-foreground">
                      {filteredPrinters.length} printers listed
                    </p>
                    <Button variant="ghost" onClick={scrollToTop} className="font-mono text-[10px] uppercase tracking-[0.1em] text-muted-foreground hover:text-primary">
                      <ArrowUp className="mr-2 h-4 w-4" />
                      Return to Top
                    </Button>
                  </div>
                )}
              </>
            )}

            {/* FAQ Section — FAQPage schema + visible accordion */}
            <FAQSection
              title="3D Printer FAQ"
              faqs={[
                {
                  question: "What is the best 3D printer for beginners in 2026?",
                  answer: "For beginners, popular choices include the Bambu Lab A1 Mini (from ~$199) and Creality Ender 3 V3 SE (from ~$179), both offering easy setup and reliable printing. Use FilaScope's Hardware Quiz to find the best printer for your specific needs.",
                },
                {
                  question: "How many 3D printers does FilaScope track?",
                  answer: `FilaScope tracks ${printers?.length || 118}+ 3D printers from ${brands?.length || 17}+ brands with detailed specifications including build volume, print speed, nozzle temperature, motion system type, and connectivity options. We also show filament compatibility and real-time pricing.`,
                },
                {
                  question: "What 3D printer features should I look for?",
                  answer: "Key features to consider include build volume (print size), print speed, enclosed chamber (essential for ABS/PETG), multi-color capability, and connectivity (Wi-Fi, USB). FilaScope lets you filter printers by all these features to find the perfect match.",
                },
                {
                  question: "Which 3D printers work best with HueForge filaments?",
                  answer: "For HueForge lithophanes, you need a printer with precise temperature control and consistent layer heights. Bambu Lab printers (P1S, X1C, A1) are popular choices due to their accuracy and multi-color AMS support. FilaScope shows filament compatibility for each printer to help you find the right match.",
                },
                {
                  question: "Do I need an enclosed 3D printer?",
                  answer: `An enclosed printer is recommended if you plan to print ABS, ASA, or engineering materials like Nylon and Polycarbonate. These materials require consistent ambient temperature to prevent warping. PLA and most PETG print fine on open-frame printers. FilaScope tracks ${printers?.filter(p => p.has_enclosure).length || 40}+ enclosed printers you can compare.`,
                },
                {
                  question: "What is the best 3D printer in 2026?",
                  answer: "The best 3D printer depends on your budget and use case. For most users, the Bambu Lab P1S offers the best combination of speed, reliability, and enclosed printing at ~$599. The Bambu Lab X1C is the top pick for multi-color printing with AMS support. For budget buyers, the Bambu Lab A1 Mini delivers excellent value under $300.",
                },
                {
                  question: "What is the cheapest good 3D printer?",
                  answer: "The Bambu Lab A1 Mini (~$199) and Creality Ender 3 V3 SE (~$179) are the best budget 3D printers in 2026. Both offer auto bed leveling, reliable PLA/PETG printing, and active community support. The A1 Mini is faster; the Ender 3 V3 SE has a larger build volume.",
                },
                {
                  question: "What 3D printer should a beginner buy?",
                  answer: "Beginners should prioritize easy setup, auto bed leveling, and good community support. The Bambu Lab A1 Mini is the most recommended beginner printer in 2026 — it prints well out of the box with minimal calibration. The Creality Ender 3 V3 SE is a strong alternative with a larger community and more tutorials available.",
                },
                {
                  question: "How do I compare 3D printer specs?",
                  answer: "FilaScope's printer comparison tool lets you compare up to 4 printers side-by-side on build volume, print speed, motion system, features, and pricing. You can also use the filters on this page to narrow down printers by category, price range, and specific features.",
                },
              ]}
            />

            {/* People Also Ask — merged into the same FAQPage schema above */}
            <section className="mt-10 border-t border-border pt-8">
              <h2 className="text-xl font-semibold mb-6">People Also Ask</h2>
              <div className="space-y-6">
                <div>
                  <h3 className="text-base font-medium text-foreground mb-2">What is the best 3D printer in 2026?</h3>
                  <p className="text-muted-foreground leading-relaxed">
                    The best 3D printer depends on your budget and use case. For most users, the Bambu Lab P1S offers the best combination of speed, reliability, and enclosed printing at ~$599. The Bambu Lab X1C is the top pick for multi-color printing with AMS support. For budget buyers, the Bambu Lab A1 Mini delivers excellent value under $300.
                  </p>
                </div>
                <div>
                  <h3 className="text-base font-medium text-foreground mb-2">What is the cheapest good 3D printer?</h3>
                  <p className="text-muted-foreground leading-relaxed">
                    The Bambu Lab A1 Mini (~$199) and Creality Ender 3 V3 SE (~$179) are the best budget 3D printers in 2026. Both offer auto bed leveling, reliable PLA/PETG printing, and active community support. The A1 Mini is faster; the Ender 3 V3 SE has a larger build volume.
                  </p>
                </div>
                <div>
                  <h3 className="text-base font-medium text-foreground mb-2">What 3D printer should a beginner buy?</h3>
                  <p className="text-muted-foreground leading-relaxed">
                    Beginners should prioritize easy setup, auto bed leveling, and good community support. The Bambu Lab A1 Mini is the most recommended beginner printer in 2026 — it prints well out of the box with minimal calibration. The Creality Ender 3 V3 SE is a strong alternative with a larger community and more tutorials available.
                  </p>
                </div>
                <div>
                  <h3 className="text-base font-medium text-foreground mb-2">How do I compare 3D printer specs?</h3>
                  <p className="text-muted-foreground leading-relaxed">
                    FilaScope's <Link to="/printers/compare" className="text-primary hover:underline">printer comparison tool</Link> lets you compare up to 4 printers side-by-side on build volume, print speed, motion system, features, and pricing. You can also use the filters on this page to narrow down printers by category, price range, and specific features.
                  </p>
                </div>
              </div>
            </section>
          </div>
        </div>

        {/* Image Edit Dialog */}
        <Dialog open={!!imageEditPrinter} onOpenChange={(open) => !open && setImageEditPrinter(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit Printer Image</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="image-url">Image URL</Label>
                <Input
                  id="image-url"
                  placeholder="https://example.com/image.jpg"
                  value={newImageUrl}
                  onChange={(e) => setNewImageUrl(e.target.value)}
                />
              </div>
              {newImageUrl && (
                <div className="space-y-2">
                  <Label>Preview</Label>
                  <div className="border rounded-lg p-2 bg-muted/50">
                    <img
                      src={newImageUrl}
                      alt="Preview"
                      className="max-h-48 mx-auto object-contain"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = "/placeholder.svg";
                      }}
                    />
                  </div>
                </div>
              )}
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setImageEditPrinter(null)}>
                Cancel
              </Button>
              <Button
                onClick={() => imageEditPrinter && updateImageMutation.mutate({ 
                  printerId: imageEditPrinter.id, 
                  imageUrl: newImageUrl 
                })}
                disabled={!newImageUrl || updateImageMutation.isPending}
              >
                {updateImageMutation.isPending ? "Saving..." : "Save"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

      </div>

      {/* SEO Content Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 border-t border-border/50 mt-8">
        <div className="grid md:grid-cols-2 gap-10">
          <div>
            <h2 className="text-lg font-semibold text-foreground mb-3">Find the Right Filament for Your Printer</h2>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Once you've chosen your printer, find the best filaments for it in our{' '}
              <Link to="/filaments" className="text-primary hover:underline font-medium">filament database</Link>.
              Browse 8,000+ filaments filtered by material, brand, price, and printer compatibility. Not sure which
              materials your printer supports? Use our{' '}
              <Link to="/matrix" className="text-primary hover:underline font-medium">compatibility matrix</Link>{' '}
              to see recommended print settings for every printer and material combination.
            </p>
          </div>
          <div>
            <h2 className="text-lg font-semibold text-foreground mb-3">Printer Filament Guides</h2>
            <div className="flex flex-wrap gap-1.5">
              {[
                { label: 'How to Choose Filament', href: '/guides/how-to-choose-3d-printer-filament' },
                { label: 'Filament Types Explained', href: '/guides/3d-printer-filament-types-explained' },
                { label: 'Temperature Guide', href: '/guides/filament-temperature-guide' },
                { label: 'Best Filaments for Bambu Lab P1S', href: '/guides/best-filament-for-bambu-lab-p1s' },
                { label: 'Best Filaments for Prusa MK4', href: '/guides/best-filament-for-prusa-mk4' },
                { label: 'Best Filaments for Creality K1', href: '/guides/best-filament-for-creality-k1' },
              ].map(link => (
                <Link
                  key={link.href}
                  to={link.href}
                  className="inline-flex items-center px-3 py-1.5 rounded-full text-xs font-medium border border-border bg-card hover:border-primary/40 hover:bg-primary/5 hover:text-primary transition-colors text-muted-foreground"
                >
                  {link.label}
                </Link>
              ))}
            </div>
          </div>
        </div>
      </section>

    </div>
    </>
  );
}