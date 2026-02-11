import { useState, useMemo, useEffect, useRef } from "react";
import { Helmet } from "react-helmet-async";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { usePrinterCompare } from "@/hooks/usePrinterCompare";
import { useFilterAnalytics } from "@/hooks/useFilterAnalytics";
import { useSearchContext } from "@/hooks/useSearchContext";

import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { ArrowDown, ArrowUp, Check, Download, Loader2, X, Database as DatabaseIcon, GitCompareArrows } from "lucide-react";
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
import { TechFooter } from "@/components/TechFooter";
import { exportPrinterDatabaseCSV } from "@/lib/printerExportUtils";
import ActiveFilterChips from "@/components/printers/ActiveFilterChips";
import { useScrollRestoration } from "@/hooks/useScrollRestoration";

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
  
  // Scroll restoration for back/forward navigation
  const { savePaginationState, restorePaginationState } = useScrollRestoration('printers');
  
  // Search analytics tracking
  const { startSearchTimer, trackSearch } = useFilterAnalytics();
  const { trackSearch: trackSearchHistory } = useSearchContext();
  const searchTimerRef = useRef<number | null>(null);
  
  // Search and quick filters
  const [searchTerm, setSearchTerm] = useState("");
  const [activeQuickFilters, setActiveQuickFilters] = useState<string[]>([]);
  
  // Filter bar state
  const [activeCategory, setActiveCategory] = useState("all");
  const [sortBy, setSortBy] = useState("name-asc");
  const [priceRangeFilter, setPriceRangeFilter] = useState("all");
  const [buildVolumeFilter, setBuildVolumeFilter] = useState("all");
  const [advancedFilters, setAdvancedFilters] = useState<AdvancedFilters>(defaultAdvancedFilters);
  
  
  // Progressive disclosure state - restore from session on back navigation
  const [displayedCount, setDisplayedCount] = useState(() =>
    restorePaginationState(PRINTERS_PER_PAGE)
  );
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  
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
    setSortBy('name-asc');
    setPriceRangeFilter('all');
    setBuildVolumeFilter('all');
    setAdvancedFilters(defaultAdvancedFilters);
    setActiveQuickFilters([]);
    setSearchTerm('');
    setDisplayedCount(PRINTERS_PER_PAGE);
  };
  
  // Reset displayed count when filters change
  useEffect(() => {
    setDisplayedCount(PRINTERS_PER_PAGE);
  }, [activeCategory, priceRangeFilter, buildVolumeFilter, advancedFilters, searchTerm, activeQuickFilters]);
  
  // Save pagination state for scroll restoration
  useEffect(() => {
    savePaginationState(displayedCount);
  }, [displayedCount, savePaginationState]);
  
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
    activeQuickFilters.length > 0;
  
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
      const price = getPrice(printer);
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
            if (price > 500) return false;
            break;
          case 'multicolor':
            if (!printer.multi_material_supported) return false;
            break;
        }
      }

      // Price range filter
      if (priceRangeFilter !== 'all') {
        switch (priceRangeFilter) {
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
            case 'budget': return price <= 500;
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

      return true;
    });

    // Sort
    return filtered.sort((a, b) => {
      const getPrinterPrice = (p: Printer) => getPrice(p);
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
  }, [printers, activeCategory, priceRangeFilter, buildVolumeFilter, advancedFilters, activeQuickFilters, sortBy]);

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

  // Progressive disclosure computed values
  const displayedPrinters = filteredPrinters.slice(0, displayedCount);
  const hasMore = displayedCount < filteredPrinters.length;
  const remaining = filteredPrinters.length - displayedCount;

  // Load more function
  const loadMore = async () => {
    setIsLoadingMore(true);
    await new Promise(resolve => setTimeout(resolve, 300)); // Smooth UX
    setDisplayedCount(prev => Math.min(prev + PRINTERS_PER_PAGE, filteredPrinters.length));
    setIsLoadingMore(false);
  };

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
      <Helmet>
        <title>3D Printer Comparison — Compare FDM & Resin Printers | FilaScope</title>
        <meta name="description" content={`Compare ${printers?.length || 118} FDM 3D printers by build volume, speed, price, and features. Find the best printer for your budget at FilaScope.`} />
        <meta property="og:description" content={`Compare ${printers?.length || 118} FDM 3D printers by build volume, speed, price, and features. Find the best printer for your budget at FilaScope.`} />
      </Helmet>
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

      {/* Results Header - Industrial style */}
      <div className="w-full max-w-[1800px] mx-auto px-4 sm:px-6 mb-4 sm:mb-6 mt-6 sm:mt-8 animate-fade-in">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-white/[0.02] border border-white/5 rounded-xl px-4 sm:px-6 py-3 sm:py-4">
          <div className="flex items-center gap-3">
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
            <DatabaseIcon className="w-5 h-5 text-primary hidden sm:block" />
            <h2 className="font-mono text-xs sm:text-sm uppercase tracking-[0.1em] sm:tracking-[0.2em] text-foreground">
              <span className="hidden sm:inline">Hardware Registry </span>
              <span className="text-primary font-bold">{filteredPrinters?.length.toLocaleString() || 0}</span>
              <span className="text-muted-foreground font-light ml-1 text-[10px] sm:text-sm">
                {hasActiveFilters ? "Matching" : "Units"}
              </span>
            </h2>
          </div>
          <div className="flex items-center gap-2">
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
            {hasActiveFilters && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleClearAllFilters}
                className="text-xs text-gray-400 hover:text-destructive"
              >
                <X className="w-3.5 h-3.5 mr-1.5" />
                Clear Filters
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

                {/* Load More / End State */}
                {hasMore ? (
                  <div className="flex flex-col items-center gap-4 py-12">
                    <Button
                      onClick={loadMore}
                      disabled={isLoadingMore}
                      variant="outline"
                      className="h-14 px-10 bg-primary/5 border-2 border-primary/30 hover:bg-primary/10 hover:border-primary text-primary font-mono text-[11px] uppercase tracking-[0.15em]"
                    >
                      {isLoadingMore ? (
                        <>
                          <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                          Loading...
                        </>
                      ) : (
                        <>
                          Load {Math.min(remaining, PRINTERS_PER_PAGE)} More Units
                          <ArrowDown className="ml-2 h-5 w-5" />
                        </>
                      )}
                    </Button>
                    <p className="font-mono text-[10px] uppercase tracking-[0.1em] text-muted-foreground">
                      Displaying {displayedCount} of {filteredPrinters.length} units
                    </p>
                    <div className="w-48 h-1 bg-gray-800 rounded-full mx-auto mt-3">
                      <div
                        className="h-1 bg-cyan-500/60 rounded-full transition-all duration-300"
                        style={{ width: `${Math.min((displayedCount / filteredPrinters.length) * 100, 100)}%` }}
                      />
                    </div>
                  </div>
                ) : filteredPrinters.length > PRINTERS_PER_PAGE && (
                  <div className="flex flex-col items-center gap-4 py-12">
                    <div className="w-12 h-12 rounded-full bg-emerald-500/10 border-2 border-emerald-500/30 flex items-center justify-center">
                      <Check className="h-6 w-6 text-emerald-500" />
                    </div>
                    <p className="font-mono text-sm uppercase tracking-[0.1em]">
                      Registry Complete — {filteredPrinters.length} Units
                    </p>
                    <Button variant="ghost" onClick={scrollToTop} className="font-mono text-[10px] uppercase tracking-[0.1em] text-muted-foreground hover:text-primary">
                      <ArrowUp className="mr-2 h-4 w-4" />
                      Return to Top
                    </Button>
                  </div>
                )}
              </>
            )}
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

      {/* Tech Footer */}
      <TechFooter />
    </div>
    </>
  );
}