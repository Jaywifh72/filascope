import React, { useMemo, useEffect, useState, useRef, useCallback } from "react";
import { Helmet } from "react-helmet-async";
import { useQuery } from "@tanstack/react-query";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useSessionFilters } from "@/hooks/useSessionFilters";
import { supabase } from "@/integrations/supabase/client";
import { useFinderQuery, type FinderFilters, DEFAULT_PAGE_SIZE } from "@/hooks/useFinderQuery";
import { useSmartSearch } from "@/hooks/useSmartSearch";
import { useFilterCounts } from "@/hooks/useFilterCounts";
import { useFilterAnalytics } from "@/hooks/useFilterAnalytics";
import { useSearchContext } from "@/hooks/useSearchContext";
import { trackSearch as trackGA4Search, trackFilterApply as trackGA4Filter } from "@/lib/analytics";
import { useRegionalFiltering } from "@/hooks/useRegionalFiltering";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Slider } from "@/components/ui/slider";
import { MaterialBadge } from "@/components/MaterialBadge";
import { ExternalLink, ChevronDown, GitCompare, X, CheckCircle, XCircle, TreeDeciduous, Layers, Palette } from "lucide-react";
import { FilamentCard } from "@/components/FilamentCard";
import { LabReadoutCard } from "@/components/LabReadoutCard";
import { DataInventoryControlBar, type SortOption } from "@/components/DataInventoryControlBar";
import { FilamentCardSkeletonGrid } from "@/components/FilamentCardSkeleton";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { getBrandLogo } from "@/lib/brandLogos";
import { LikeButton } from "@/components/LikeButton";
import { PrinterSelector } from "@/components/PrinterSelector";
import { MaterialRecommendations } from "@/components/MaterialRecommendations";
import { usePrinterSelection } from "@/hooks/usePrinterSelection";
import { checkPrinterFilamentCompatibility } from "@/lib/printerCompatibility";
import { CompatibilityBadge } from "@/components/CompatibilityBadge";
import { useAffiliateLinks } from "@/hooks/useAffiliateLinks";
import { useCurrency } from "@/hooks/useCurrency";
import { useRegion } from "@/contexts/RegionContext";
import { isAMSCompatible } from "@/lib/amsCompatibility";
import { useCompare } from "@/hooks/useCompare";
import { useCompatibleCount } from "@/hooks/useCompatibleCount";
import { BRAND_SPECIFIC_FUNCTIONS } from "@/lib/brand-sync-config";
import { DocumentHead } from "@/components/seo/DocumentHead";
import { HomeSEOContent } from "@/components/HomeSEOContent";
import { HomeFAQSection } from "@/components/HomeFAQSection";
import { LatestNewsSection } from "@/components/news/LatestNewsSection";
import HeroSection from "@/components/HeroSection";
import { TrendingItemListSchema } from "@/components/seo";
import SectionSeparator from "@/components/SectionSeparator";
import ResultsHeader from "@/components/ResultsHeader";
import { QuickPathsPills } from "@/components/QuickPathsPills";
import { HeroProductGrid } from "@/components/HeroProductGrid";
import { SearchIntelligenceBar } from "@/components/search/SearchIntelligenceBar";
import { FilamentFilters } from "@/components/FilamentFilters";
import { TechnicalConsoleSidebar } from "@/components/TechnicalConsoleSidebar";
import { HorizontalFilterBar } from "@/components/filters/HorizontalFilterBar";
import { QuickFilterPills } from "@/components/QuickFilterPills";
import { FilamentsEmptyState } from "@/components/filament/FilamentsEmptyState";
import { ActiveFilterTags, type ActiveFilter } from "@/components/filters/ActiveFilterTags";
import { SearchSmartChips } from "@/components/search/SearchSmartChips";
import { MATERIAL_CATEGORIES } from "@/lib/materialHierarchy";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { MoreFiltersModal } from "@/components/filters/MoreFiltersModal";
import { ViewToggle } from "@/components/ViewToggle";
import { FilamentTableView } from "@/components/FilamentTableView";
import { FinderPaginationBar } from "@/components/FinderPaginationBar";
import { useIsMobile } from "@/hooks/use-mobile";
import { extractColorFromText } from "@/lib/colorIntelligence";
import { OnboardingTour } from "@/components/onboarding";
import { WelcomeBanner } from "@/components/onboarding/WelcomeBanner";
import { SkipLinks } from "@/components/accessibility/SkipLink";
import { RecentlyViewedSection } from "@/components/RecentlyViewedSection";
import { TrendingSection } from "@/components/TrendingSection";
import { MobileQuickMatchPrompt } from "@/components/MobileQuickMatchPrompt";
import WhyFilaScope from "@/components/WhyFilaScope";
import { ScrollToTopButton } from "@/components/ScrollToTopButton";
import { GridBreakCard, getBreakType, isDismissed } from "@/components/GridBreakCard";
import { useTopDeals } from "@/hooks/useTopDeals";

import { MobileFilamentFilterSheet } from "@/components/filters/MobileFilamentFilterSheet";
import { MobileActiveFilterChips } from "@/components/filters/MobileActiveFilterChips";
import { MobilePrinterQuickSelect } from "@/components/filters/MobilePrinterQuickSelect";
import { useScrollRestoration } from "@/hooks/useScrollRestoration";
import { RegionTransitionIndicator, RegionLoadingSpinner } from "@/components/RegionTransitionIndicator";
import { useBulkCommunityRatings } from "@/hooks/useCommunityReviewStats";
import { analyzeSearchQuery } from "@/lib/multiTermSearch";

// Color family definitions with representative HEX colors
const COLOR_FAMILIES = [
  { name: "Red", hex: "#DC2626", families: ["Red", "Burgundy", "Maroon", "Crimson"] },
  { name: "Orange", hex: "#EA580C", families: ["Orange", "Coral", "Peach"] },
  { name: "Yellow", hex: "#EAB308", families: ["Yellow", "Gold", "Amber", "Mustard"] },
  { name: "Green", hex: "#16A34A", families: ["Green", "Olive", "Lime", "Forest", "Mint", "Sage"] },
  { name: "Teal", hex: "#0D9488", families: ["Teal", "Turquoise", "Aqua"] },
  { name: "Blue", hex: "#2563EB", families: ["Blue", "Navy", "Sky", "Royal", "Cobalt"] },
  { name: "Purple", hex: "#9333EA", families: ["Purple", "Violet", "Lavender", "Plum"] },
  { name: "Pink", hex: "#EC4899", families: ["Pink", "Magenta", "Rose", "Fuchsia"] },
  { name: "Brown", hex: "#92400E", families: ["Brown", "Tan", "Chocolate", "Coffee", "Mocha"] },
  { name: "Beige", hex: "#D4A574", families: ["Beige", "Cream", "Ivory", "Natural", "Nude"] },
  { name: "Black", hex: "#1A1A1A", families: ["Black", "Charcoal", "Ebony"] },
  { name: "White", hex: "#F5F5F5", families: ["White", "Ivory", "Snow"] },
  { name: "Gray", hex: "#6B7280", families: ["Gray", "Grey", "Silver", "Slate", "Ash"] },
  { name: "Clear", hex: "#E0F2FE", families: ["Clear", "Transparent", "Translucent", "Crystal"] },
  { name: "Multi", hex: "linear-gradient(135deg, #DC2626, #EA580C, #EAB308, #16A34A, #2563EB, #9333EA)", families: ["Rainbow", "Multi", "Multicolor", "Gradient", "Silk"] },
  { name: "Glow", hex: "#84CC16", families: ["Glow", "Phosphorescent", "Luminous"] },
];

// Helper to convert HEX to RGB
const hexToRgb = (hex: string): { r: number; g: number; b: number } | null => {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16),
      }
    : null;
};

// Calculate color distance (Euclidean in RGB space, approximates delta-E)
const colorDistance = (hex1: string, hex2: string): number => {
  const rgb1 = hexToRgb(hex1);
  const rgb2 = hexToRgb(hex2);
  if (!rgb1 || !rgb2) return Infinity;
  
  // Weighted Euclidean distance (human eye is more sensitive to green)
  const rMean = (rgb1.r + rgb2.r) / 2;
  const deltaR = rgb1.r - rgb2.r;
  const deltaG = rgb1.g - rgb2.g;
  const deltaB = rgb1.b - rgb2.b;
  
  // Redmean color difference formula (better perceptual accuracy)
  const weightR = 2 + rMean / 256;
  const weightG = 4;
  const weightB = 2 + (255 - rMean) / 256;
  
  return Math.sqrt(weightR * deltaR * deltaR + weightG * deltaG * deltaG + weightB * deltaB * deltaB);
};

// Calculate color match percentage (100% = exact match, 0% = max difference)
const getColorMatchPercent = (searchHex: string, filamentHex: string): number => {
  const distance = colorDistance(searchHex, filamentHex);
  // Max distance in redmean formula is ~764 (black to white)
  const maxDistance = 764;
  const percent = Math.max(0, Math.min(100, 100 - (distance / maxDistance) * 100));
  return Math.round(percent);
};

// Convert HSL to HEX
const hslToHex = (h: number, s: number, l: number): string => {
  s /= 100;
  l /= 100;
  const a = s * Math.min(l, 1 - l);
  const f = (n: number) => {
    const k = (n + h / 30) % 12;
    const color = l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
    return Math.round(255 * color).toString(16).padStart(2, '0');
  };
  return `#${f(0)}${f(8)}${f(4)}`;
};

const Finder = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const isMobile = useIsMobile();

  // Redirect legacy ?material= param to /filaments/:slug
  useEffect(() => {
    const materialParam = searchParams.get("material");
    if (materialParam) {
      const slugMap: Record<string, string> = {
        PLA: "pla", PETG: "petg", ABS: "abs", TPU: "tpu", ASA: "asa",
        "Silk PLA": "silk-pla", "Silk+PLA": "silk-pla",
        PA: "nylon", Nylon: "nylon",
        "High+Speed+PLA": "high-speed-pla", "High Speed PLA": "high-speed-pla",
        "PLA+": "pla-plus", "PLA-HS": "high-speed-pla",
        PC: "polycarbonate", Polycarbonate: "polycarbonate",
        "PETG-CF": "petg-cf",
      };
      const decoded = decodeURIComponent(materialParam);
      const targetSlug = slugMap[materialParam] || slugMap[decoded];
      if (targetSlug) {
        navigate(`/filaments/${targetSlug}`, { replace: true });
      }
    }
  }, []); // Only on mount
  
  // Scroll restoration for back/forward navigation
  const { savePaginationState, restorePaginationState } = useScrollRestoration('finder');
  
  // Search analytics tracking
  const { startSearchTimer, trackSearch } = useFilterAnalytics();
  const { trackSearch: trackSearchHistory } = useSearchContext();
  const searchTimerRef = useRef<number | null>(null);
  
  // Get URL params for color search
  const urlHexSearch = searchParams.get("hexSearch");
  const urlColorTolerance = searchParams.get("colorTolerance") ? parseInt(searchParams.get("colorTolerance")!, 10) : null;
  
  // Session-persisted filters
  const { filters, updateFilter, resetFilters } = useSessionFilters(urlHexSearch, urlColorTolerance);
  
  // Destructure for convenience
  const {
    searchTerm,
    selectedMaterials,
    selectedVariants,
    brassOnly,
    amsOnly,
    selectedBrands,
    maxPrice,
    sortBy,
    // Surface Finish
    matte,
    silk,
    metallic,
    sparkle,
    translucent,
    glow,
    // Reinforced Materials
    carbonFiber,
    glassFiber,
    woodFilled,
    // Performance
    highSpeed,
    // Spool Size
    largeSpools,
    // Color
    priceRange,
    selectedColorFamilies,
    hexSearch,
    colorTolerance,
    // HueForge
    hasTdData,
  } = filters;
  
  // Setter wrappers for convenience
  const setSearchTerm = (v: string) => updateFilter("searchTerm", v);
  const setSelectedMaterials = (v: string[]) => updateFilter("selectedMaterials", v);
  const setSelectedVariants = (v: Record<string, string[]>) => updateFilter("selectedVariants", v);
  const setBrassOnly = (v: boolean) => updateFilter("brassOnly", v);
  const setAmsOnly = (v: boolean) => updateFilter("amsOnly", v);
  const setSelectedBrands = (v: string[]) => updateFilter("selectedBrands", v);
  const setMaxPrice = (v: string) => updateFilter("maxPrice", v);
  const setSortBy = (v: string) => updateFilter("sortBy", v);
  // Surface Finish setters
  const setMatte = (v: boolean) => updateFilter("matte", v);
  const setSilk = (v: boolean) => updateFilter("silk", v);
  const setMetallic = (v: boolean) => updateFilter("metallic", v);
  const setSparkle = (v: boolean) => updateFilter("sparkle", v);
  const setTranslucent = (v: boolean) => updateFilter("translucent", v);
  const setGlow = (v: boolean) => updateFilter("glow", v);
  // Reinforced Materials setters
  const setCarbonFiber = (v: boolean) => updateFilter("carbonFiber", v);
  const setGlassFiber = (v: boolean) => updateFilter("glassFiber", v);
  const setWoodFilled = (v: boolean) => updateFilter("woodFilled", v);
  // Performance setters
  const setHighSpeed = (v: boolean) => updateFilter("highSpeed", v);
  // Spool Size setters
  const setLargeSpools = (v: boolean) => updateFilter("largeSpools", v);
  // Color setters
  const setPriceRange = (v: [number, number]) => updateFilter("priceRange", v);
  const setSelectedColorFamilies = (v: string[]) => updateFilter("selectedColorFamilies", v);
  const setHexSearch = (v: string) => updateFilter("hexSearch", v);
  const setColorTolerance = (v: number) => updateFilter("colorTolerance", v);
  const setHasTdData = (v: boolean) => updateFilter("hasTdData", v);
  
  // Local UI state (not persisted)
  const [filtersOpen, setFiltersOpen] = useState(true);
  const [printerSelectorOpen, setPrinterSelectorOpen] = useState(false);
  const [moreFiltersOpen, setMoreFiltersOpen] = useState(false);
  const [colorSectionOpen, setColorSectionOpen] = useState(() => !!urlHexSearch || hexSearch !== "");
  const [colorPickerMode, setColorPickerMode] = useState<"grid" | "spectrum">("grid");
  const [spectrumHue, setSpectrumHue] = useState(0);
  const [spectrumSaturation, setSpectrumSaturation] = useState(100);
  const [spectrumLightness, setSpectrumLightness] = useState(50);
  const [activeQuickFilter, setActiveQuickFilter] = useState<string | null>(null);
  
  const { 
    isInCompare, 
    addItem, 
    removeItem, 
    isMultiSelectMode, 
    setMultiSelectMode, 
    pendingItems,
    commitPendingItems,
    clearPendingItems 
  } = useCompare();
  
  const [viewMode, setViewMode] = useState<"grid" | "list">(() => {
    const saved = localStorage.getItem("finderViewMode");
    return saved === "list" ? "list" : "grid";
  });

  // Cost per print toggle
  const [showCostPerPrint, setShowCostPerPrint] = useState(() => {
    return localStorage.getItem("finderShowCostPerPrint") === "true";
  });

  // In Stock Only toggle (default: OFF — show all products)
  const [inStockOnly, setInStockOnly] = useState(() => {
    const saved = localStorage.getItem("finderInStockOnly");
    return saved === null ? false : saved === "true";
  });

  // Bulk community ratings for all filaments
  const { data: communityRatingsMap } = useBulkCommunityRatings();
  
  // Force card view on mobile
  const effectiveViewMode = isMobile ? "grid" : viewMode;

  const MAX_PRICE_LIMIT = 100;
  
  // Server-side pagination
  const [currentPage, setCurrentPage] = useState(0);
  const [pageSize, setPageSize] = useState(() => {
    const saved = localStorage.getItem("finderPageSize");
    return saved ? Number(saved) : DEFAULT_PAGE_SIZE;
  });
  // Multi-select mode keyboard listeners
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Shift' && !e.repeat) {
        setMultiSelectMode(true);
      }
    };
    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.key === 'Shift') {
        commitPendingItems();
        setMultiSelectMode(false);
      }
      if (e.key === 'Escape') {
        clearPendingItems();
        setMultiSelectMode(false);
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [setMultiSelectMode, commitPendingItems, clearPendingItems]);
  
  // Persist viewMode and costPerPrint to localStorage
  useEffect(() => {
    localStorage.setItem("finderViewMode", viewMode);
  }, [viewMode]);

  useEffect(() => {
    localStorage.setItem("finderShowCostPerPrint", showCostPerPrint ? "true" : "false");
  }, [showCostPerPrint]);

  useEffect(() => {
    localStorage.setItem("finderInStockOnly", inStockOnly ? "true" : "false");
  }, [inStockOnly]);
  
  // Clear search term on fresh homepage visit (mount with no search params)
  // This ensures returning visitors see the full catalog, not filtered results
  useEffect(() => {
    const urlSearchQuery = searchParams.get("q") || searchParams.get("search");
    // Only clear if there's no URL search param driving the search
    if (!urlSearchQuery && searchTerm) {
      setSearchTerm("");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Only run on mount
  
  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(0);
  }, [searchTerm, selectedMaterials, selectedBrands, priceRange, sortBy, hexSearch, selectedColorFamilies, highSpeed, matte, silk, metallic, sparkle, translucent, carbonFiber, glassFiber, woodFilled, glow, brassOnly, amsOnly, hasTdData]);
  
  // Track search analytics - start timer on search change
  useEffect(() => {
    if (searchTerm && searchTerm.trim().length > 0) {
      startSearchTimer();
      // Track search in history
      trackSearchHistory(searchTerm);
    }
  }, [searchTerm, startSearchTimer, trackSearchHistory]);
  
  // Printer selection hook
  const { selectedPrinter } = usePrinterSelection();

  // Top deals for break cards
  const { data: topDeals } = useTopDeals();
  const [dismissedBreaks, setDismissedBreaks] = useState<Record<string, boolean>>({});
  
  // Compatible count context - update navbar badge
  const { setCount: setCompatibleCount } = useCompatibleCount();
  
  // Affiliate links hook
  const { getAffiliateUrl } = useAffiliateLinks();
  
  // Currency hook
  const { formatPrice, currencyInfo, convertPrice } = useCurrency();
  
  // Region hook for displaying current region
  const { regionConfig } = useRegion();
  
  // Region transition state moved to after useFinderQuery

  // Normalize variant names to group similar variants
  const normalizeVariantName = (material: string, base: string): string => {
    const variantPatterns: Record<string, Record<string, string[]>> = {
      PLA: {
        "+": ["PLA+"],
        "Carbon Fiber": ["PLA Carbon Fiber", "PLA CF", "PLA-CF", "PLA CF03", "PLA Carbon", "The Filament PLA CF"],
        "Glow": ["Glow PLA", "PLA Glow", "PLA Glow in Dark", "PLA-Luminous", "PLA-Glow", "PLA-GLOW", "PLA Glow in the Dark"],
        "Silk": ["Silk PLA", "PLA Silk", "PLA-Silk", "Silky PLA", "Silk PLA+", "PLA SILK", "PLA-SILK", "PLA Magic SILK", "PLA SILK Rainbow"],
        "Marble": ["Marble PLA", "PLA Marble", "PLA-Marble", "PLA-MARBLE"],
        "Matte": ["Matte PLA", "PLA Matte", "PLA-Matte", "PLA-MATTE", "PLA Matte Dual-Color"],
        "Metallic": ["Metallic PLA", "PLA Metal", "PLA-Metal"],
        "Wood": ["PLA Wood", "Wood PLA", "PLA-Wood", "PLA Wood Composite"],
        "Lightweight": ["LW-PLA", "PLA Lightweight", "LW-PLA-HT"],
        "Crystal": ["PLA Crystal", "PLA Crystal Clear"],
        "Bronze": ["PLA Bronze Composite"],
        "Copper": ["PLA Copper Composite"],
        "Cork": ["PLA Cork Composite"],
        "Steel": ["PLA Steel Composite"],
        "Stone": ["PLA Stone Composite", "PLA Stone Age", "PLA-Stone"],
        "High Speed": ["PLA-HS", "PLA High Speed Pro", "Premium PLA High Speed", "PLA Hi-Flow Pro", "The Filament PLA HS"],
        "High Temp": ["PLA-HT", "PLA-HP", "HTPLA", "HTPLA-CF"],
        "Premium": ["PLA Premium", "The Filament PLA"],
        "Pro": ["PLA Pro"],
        "Galaxy": ["PLA Galaxy", "PLA-Galaxy"],
        "Glitter": ["PLA Glitter"],
        "Starlight": ["PLA-Starlight"],
        "Thermoactive": ["PLA Thermoactive"],
        "Tough": ["PLA-Tough"],
        "Conductive": ["PLA-Conductive", "ESD-PLA"],
      },
      PETG: {
        "Carbon Fiber": ["PETG-CF", "PETG Carbon Fiber", "PETG CF", "The Filament PETG CF"],
        "Glass Fiber": ["PETG-GF"],
        "Wood": ["PETG Wood", "PETG-Wood"],
        "Silk": ["PETG Silk", "Silk PETG", "PETG-Silk"],
        "Matte": ["PETG Matte", "Matte PETG", "PETG-Matte"],
        "Pro": ["PETG Pro"],
        "HF": ["PETG HF"],
        "High Speed": ["PETG-HS", "PET-G Premium High Speed"],
        "Translucent": ["PETG-TRANSLUCENT"],
        "Premium": ["PET-G Premium", "The Filament PETG"],
        "Glow": ["PET-G Glow in the Dark"],
        "FR": ["PET-G FR V0"],
        "ESD": ["ESD-PETG"],
      },
      ABS: {
        "+": ["ABS+"],
        "CF": ["ABS-CF"],
        "GF": ["ABS-GF"],
        "HT": ["ABS HT", "ABS-HT"],
        "HS": ["ABS-HS"],
        "R": ["ABS-R"],
        "ESD": ["ABS-ESD", "ESD-ABS"],
        "PC": ["ABS-PC"],
        "CF-Core": ["ABS-CF-Core"],
        "Medical": ["ABS Medical"],
        "Easy": ["Easy ABS"],
        "Smart": ["Smart ABS"],
        "FR": ["FR-ABS"],
      },
      ASA: {
        "+": ["ASA+"],
        "CF": ["ASA-CF"],
        "GF": ["ASA-GF"],
        "275": ["ASA 275", "FlameGuard ASA 275"],
        "Kevlar": ["ASA Kevlar"],
        "X CF10": ["ASA-X CF10"],
        "X GF10": ["ASA-X GF10"],
        "Lightweight": ["LW-ASA"],
      },
      TPU: {
        "95A": ["TPU 95A", "TPU-95A", "TPU95A"],
        "85A": ["TPU 85A", "TPU-85A", "TPU85A"],
        "98A": ["TPU 98A", "TPU-98A", "TPU98A"],
        "60D": ["TPU 60D", "TPU-60D", "TPU60D"],
        "60A": ["TPU-60A"],
        "64D": ["TPU-64D"],
        "70A": ["TPU-70A"],
        "75A": ["TPU-75A", "TPU 75A"],
        "75D": ["TPU-75D"],
        "82A": ["TPU-82A"],
        "88A": ["TPU-88A"],
        "90A": ["TPU-90A"],
        "92A": ["TPU-92A"],
        "30D": ["TPU-30D"],
        "40D": ["TPU-40D"],
        "Flex": ["TPU Flex", "TPU-Flex"],
        "Foam": ["TPU-FOAM", "TPU-95A-FOAM"],
        "Bio": ["TPU-Bio"],
        "SEBS": ["TPU-SEBS"],
        "ESD": ["ESD-TPU"],
      },
      Nylon: {
        "NylonG": ["NylonG"],
        "NylonX": ["NylonX"],
        "PA6 Low Warp": ["Nylon PA6 Low Warp"],
        "CF": ["Nylon-CF"],
        "GF": ["Nylon-GF"],
        "AF": ["Nylon-AF"],
      },
      PA: {
        "CF": ["PA-CF", "PA11-CF", "PA12-CF", "PA6-CF", "PA612-CF", "PAHT-CF", "PPA-CF", "PPA-CF-Core"],
        "GF": ["PA-GF", "PA6-GF", "PA12-GF", "PPA-GF"],
        "AF": ["PA-AF"],
        "6": ["PA6", "PA6 Neat", "PA6-66", "PA6-Wear", "PA6 CF15", "PA6 CS20 FR V0"],
        "12": ["PA12", "PA12 CF15", "ESD-PA12"],
        "11": ["PA11-CF"],
        "612": ["PA612-CF"],
        "HT": ["PAHT-CF"],
        "PPA": ["PPA", "PPA-CF", "PPA-GF", "PPA-CF-Core"],
        "TPA": ["TPA"],
        "ThermaTech": ["ThermaTech PA"],
      },
      PC: {
        "Blend Carbon Fiber": ["PC Blend Carbon Fiber"],
        "Blend": ["PC Blend"],
        "Carbon Fiber": ["PC CF", "PC-CF"],
        "FR": ["PC FR", "PC-FR", "FR-PC", "FR-PC-ABS", "PC-ABS-FR"],
        "Pro": ["PC Pro"],
        "Space Grade": ["PC Space Grade"],
        "PBT": ["PC-PBT", "PC+PBT", "PC-PBT-GF"],
        "TPE": ["PCTPE"],
        "ABS": ["PC-ABS"],
        "275": ["PC-275"],
        "PTFE": ["PC PTFE"],
        "ESD": ["ESD-PC"],
      },
      "Co-Polyester": {
        "CF": ["Co-Polyester CF", "CoPoly-CF"],
        "HT": ["HT", "CoPoly-HT"],
        "XT": ["XT", "CoPoly-XT"],
        "nGen": ["nGen", "CoPoly-nGen"],
        "nGen Flex": ["nGen_FLEX"],
      },
      "Co-Polymer": {
        "PE": ["PE Co-Polymer"],
      },
      CPE: {
        "+": ["CPE+"],
        "HG100": ["CPE HG100"],
        "CF": ["CPE-CF"],
      },
      PET: {
        "GF": ["PET-GF"],
        "CF": ["PET-CF"],
      },
      PEEK: {
        "CF": ["PEEK-CF", "Peek CF"],
        "GF": ["PEEK-GF", "Peek GF"],
        "A": ["PEEK A", "Peek A"],
      },
      PEKK: {
        "CF": ["PEKK-CF"],
        "A": ["PEKK-A"],
        "ESD": ["ESD-PEKK"],
      },
      PEI: {
        "CF": ["PEI-CF"],
        "1010": ["PEI 1010", "PEI-1010", "ESD-PEI-1010"],
        "9085": ["PEI 9085", "PEI-9085"],
        "ESD": ["ESD-PEI", "ESD-PEI-1010"],
      },
      PP: {
        "CF": ["PP-CF", "PP Carbon Fiber"],
        "GF": ["PP-GF", "PP Glass Fiber"],
      },
      Support: {
        "Material": ["Support material"],
      },
      PEBA: {
        "85A": ["PEBA-85A", "PEBA 85A"],
        "90A": ["PEBA-90A", "PEBA 90A"],
        "95A": ["PEBA-95A", "PEBA 95A"],
        "Air": ["PEBA Air"],
        "Foam": ["PEBA-FOAM"],
      },
      TPE: {
        "E": ["TPE-E"],
        "90A": ["TPE-90A"],
        "96A": ["TPE-96A"],
      },
      PCTG: {
        "Premium": ["PCTG Premium"],
        "CF10": ["PCTG CF10"],
        "GF10": ["PCTG GF10"],
      },
    };

    const patterns = variantPatterns[base];
    if (patterns) {
      for (const [canonical, alternatives] of Object.entries(patterns)) {
        if (alternatives.includes(material)) {
          return canonical;
        }
      }
    }
    
    return material;
  };

  // Fetch unique materials for filters with variants
  const { data: materials } = useQuery({
    queryKey: ["materials"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("filaments")
        .select("material")
        .not("material", "is", null)
        .order("material");
      
      if (error) throw error;
      
      // Get unique materials
      const uniqueMaterials = Array.from(new Set(data.map(f => f.material))).sort();
      
      // Define base standard materials that can have variants
      const baseStandards = ['PLA', 'PETG', 'ABS', 'ASA', 'TPU', 'Nylon', 'PC', 'Co-Polyester', 'PA', 'CPE', 'PET', 'PEEK', 'PEKK', 'PEI', 'PP', 'Support', 'PEBA', 'Co-Polymer', 'TPE', 'PCTG', 'PPA'];
      const otherStandards = ['HIPS', 'TPE', 'CO-PE'];
      
      // Materials that should appear in specialty despite supporting variants
      const specialtyWithVariants: string[] = [];
      
      // Materials that should appear in composites despite supporting variants
      const compositeWithVariants = ['PC', 'Co-Polyester', 'PA', 'CPE', 'PET', 'PP', 'Nylon', 'Co-Polymer'];
      
      // Materials that should appear in other materials despite supporting variants
      const otherWithVariants = ['Support', 'PEBA'];
      
      // Function to check if a material is a variant of a base material
      const getBaseMaterial = (material: string): string | null => {
        for (const base of baseStandards) {
          // Match patterns like "PLA-CF", "PLA Carbon Fiber", "ABS+", "ABS-GF", etc.
          if (material !== base && (
            material.startsWith(base + '-') ||
            material.startsWith(base + ' ') ||
            material.startsWith(base + '+') ||
            (material.includes(base) && material.length > base.length + 1)
          )) {
            return base;
          }
        }
        return null;
      };
      
      // Group materials by their base with normalized names
      // Keep track of raw material names that map to each normalized variant
      const materialsByBase: Record<string, string[]> = {};
      const rawToNormalized: Record<string, { base: string; normalized: string }> = {};
      const normalizedToRaw: Record<string, Record<string, string[]>> = {};
      const standalone: string[] = [];
      
      uniqueMaterials.forEach(material => {
        const base = getBaseMaterial(material);
        if (base) {
          const normalized = normalizeVariantName(material, base);
          
          // Track raw to normalized mapping
          rawToNormalized[material] = { base, normalized };
          
          // Track normalized to raw mappings
          if (!normalizedToRaw[base]) {
            normalizedToRaw[base] = {};
          }
          if (!normalizedToRaw[base][normalized]) {
            normalizedToRaw[base][normalized] = [];
          }
          normalizedToRaw[base][normalized].push(material);
          
          // Add normalized variant to base material
          if (!materialsByBase[base]) {
            materialsByBase[base] = [];
          }
          if (!materialsByBase[base].includes(normalized)) {
            materialsByBase[base].push(normalized);
          }
        } else if (baseStandards.includes(material) || otherStandards.includes(material)) {
          standalone.push(material);
        }
      });
      
      // Get all materials that are variants (already grouped under base materials)
      const allVariants = Object.values(materialsByBase).flat();
      
      // Categorize remaining materials (not variants)
      const composites = uniqueMaterials.filter(m => 
        !Object.keys(rawToNormalized).includes(m) &&
        !baseStandards.includes(m) &&
        !otherStandards.includes(m) &&
        (m.includes('-CF') || m.includes('-GF') || m.includes('Carbon Fiber') || m.includes('Wood Fill') || 
         m === 'PPS' || m === 'PSU' || m.startsWith('PPS ') || m.startsWith('PSU '))
      );
      
      const specialty = uniqueMaterials.filter(m => 
        !Object.keys(rawToNormalized).includes(m) &&
        !baseStandards.includes(m) &&
        !otherStandards.includes(m) &&
        !composites.includes(m)
      );
      
      // Add specialty materials that support variants
      const specialtyWithVariantsList = specialtyWithVariants.filter(m => 
        uniqueMaterials.includes(m) || materialsByBase[m]?.length > 0
      );
      
      // Add composite materials that support variants
      const compositeWithVariantsList = compositeWithVariants.filter(m => 
        uniqueMaterials.includes(m) || materialsByBase[m]?.length > 0
      );
      
      // Add other materials that support variants
      const otherWithVariantsList = otherWithVariants.filter(m => 
        uniqueMaterials.includes(m) || materialsByBase[m]?.length > 0
      );
      
      return {
        all: uniqueMaterials,
        baseStandards: baseStandards.filter(m => 
          !specialtyWithVariants.includes(m) && 
          !compositeWithVariants.includes(m) &&
          !otherWithVariants.includes(m) &&
          (uniqueMaterials.includes(m) || materialsByBase[m]?.length > 0)
        ),
        otherStandards: [...otherStandards.filter(m => uniqueMaterials.includes(m)), ...otherWithVariantsList],
        variantsByBase: materialsByBase,
        normalizedToRaw: normalizedToRaw,
        composites: [...composites, ...compositeWithVariantsList],
        specialty: [...specialty, ...specialtyWithVariantsList]
      };
    },
  });

  // Get regional filtering hook BEFORE the query so currentRegion is available for cache key
  const { filterByRegion, currentRegion } = useRegionalFiltering();

  // Fetch brands - only show brands that are in the sync manager
  const SYNC_MANAGER_BRANDS = new Set<string>(BRAND_SPECIFIC_FUNCTIONS);
  
  const { data: brandsData } = useQuery({
    queryKey: ["brands-synced"],
    queryFn: async () => {
      // Fetch from public brands view - excludes sensitive scraping config
      const { data: automatedBrands, error: automatedError } = await supabase
        .from("v_public_brands")
        .select("display_name, brand_name, brand_slug")
        .order("display_name");
      
      if (automatedError) throw automatedError;
      
      // Filter to only include brands in the sync manager
      const syncedBrands = automatedBrands.filter(b => SYNC_MANAGER_BRANDS.has(b.brand_slug));
      
      // Create map from display_name to brand_name (for filtering)
      const brandNameMap: Record<string, string> = {};
      // Create map from brand_slug to brand_name (for count lookup)
      const slugToNameMap: Record<string, string> = {};
      syncedBrands.forEach(b => {
        brandNameMap[b.display_name] = b.brand_name;
        slugToNameMap[b.brand_slug] = b.brand_name;
      });
      
      // Get all synced brand display names
      const allBrands = syncedBrands.map(b => b.display_name);
      
      return {
        displayNames: allBrands.sort(),
        brandNameMap,
        slugToNameMap
      };
    },
  });
  
  // Extract for convenience
  const brands = brandsData?.displayNames;
  const brandNameMap = brandsData?.brandNameMap || {};
  const slugToNameMap = brandsData?.slugToNameMap || {};

  // Fetch true filament counts per brand via server-side RPC (avoids 1000-row limit)
  const { data: brandFilamentCounts } = useQuery({
    queryKey: ["brand-filament-counts-rpc", slugToNameMap],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("get_catalog_counts_by_brand");
      if (error) throw error;
      
      // Map vendor_lower (slugs) to brand_name using slugToNameMap
      const counts: Record<string, number> = {};
      for (const row of (data as any[]) || []) {
        const brandName = slugToNameMap[row.vendor_lower];
        if (brandName) {
          counts[brandName] = Number(row.variant_count);
        }
      }
      
      return counts;
    },
    staleTime: 1000 * 60 * 10, // 10 minutes
    enabled: Object.keys(slugToNameMap).length > 0,
  });

  // === SERVER-SIDE PAGINATED QUERY (replaces fetch-all + client-side processing) ===
  const finderFilters: FinderFilters = useMemo(() => ({
    searchTerm,
    selectedMaterials,
    selectedBrands,
    priceRange,
    sortBy,
    matte, silk, metallic, sparkle, translucent, glow,
    carbonFiber, glassFiber, woodFilled,
    highSpeed, largeSpools, amsOnly, brassOnly,
    selectedColorFamilies,
    hasTdData,
  }), [searchTerm, selectedMaterials, selectedBrands, priceRange, sortBy,
    matte, silk, metallic, sparkle, translucent, glow,
    carbonFiber, glassFiber, woodFilled, highSpeed, largeSpools, amsOnly, brassOnly,
    selectedColorFamilies, hasTdData]);

  const { groups: rawGroups, totalCount: rawTotalCount, isLoading: finderLoading, isFetching: finderFetching, isPlaceholderData } = 
    useFinderQuery(finderFilters, currentPage, brandNameMap, pageSize);

  // Smart search: when searchTerm is active, overlay ranked results
  const smartSearch = useSmartSearch(searchTerm, currentPage, pageSize);
  const useSmartResults = smartSearch.isSmartSearchActive && searchTerm.trim().length >= 2;

  // Merge: use smart search results when searching, otherwise finder results
  const isLoading = useSmartResults ? smartSearch.isLoading : finderLoading;
  const isFetching = useSmartResults ? smartSearch.isFetching : finderFetching;

  // Client-side "In Stock Only" filtering — when active, partition: in-stock first, OOS last
  const effectiveRawGroups = useSmartResults ? smartSearch.groups : rawGroups;
  const effectiveRawTotalCount = useSmartResults ? smartSearch.totalCount : rawTotalCount;
  const stockFiltered = useMemo(() => {
    if (!inStockOnly) return effectiveRawGroups;
    const inStock = effectiveRawGroups.filter(g => g.anyInStock !== false);
    const oos = effectiveRawGroups.filter(g => g.anyInStock === false);
    return [...inStock, ...oos];
  }, [effectiveRawGroups, inStockOnly]);

  // Index where OOS section begins (for divider rendering)
  const oosStartIndex = useMemo(() => {
    if (!inStockOnly) return -1;
    const idx = stockFiltered.findIndex(g => g.anyInStock === false);
    return idx;
  }, [stockFiltered, inStockOnly]);

  // Brand diversity: max 3 per brand in first 12 positions
  const displayedGroups = useMemo(() => {
    if (stockFiltered.length <= 12) return stockFiltered;
    const brandCount = new Map<string, number>();
    const top: typeof stockFiltered = [];
    const deferred: typeof stockFiltered = [];
    for (const g of stockFiltered) {
      const vendor = (g.representativeFilament.vendor || "Unknown").toLowerCase();
      if (top.length < 12 && (brandCount.get(vendor) || 0) >= 3) {
        deferred.push(g);
      } else {
        if (top.length < 12) brandCount.set(vendor, (brandCount.get(vendor) || 0) + 1);
        top.push(g);
      }
    }
    const insertAt = Math.min(top.length, 12);
    top.splice(insertAt, 0, ...deferred);
    return top;
  }, [stockFiltered]);

  const totalCount = inStockOnly
    ? displayedGroups.length + (effectiveRawTotalCount > effectiveRawGroups.length ? effectiveRawTotalCount - effectiveRawGroups.length : 0)
    : effectiveRawTotalCount;

  // === SERVER-SIDE FILTER COUNTS ===
  const { data: serverFilterCounts } = useFilterCounts(
    searchTerm, selectedMaterials, selectedBrands, priceRange, brandNameMap
  );
  const filterCounts = useMemo(() => {
    if (!serverFilterCounts) return {};
    const counts: Record<string, number> = {};
    // Map material counts
    if (serverFilterCounts.materials) {
      Object.entries(serverFilterCounts.materials).forEach(([mat, count]) => {
        counts[`material_${mat}`] = count as number;
      });
    }
    // Map brand counts
    if (serverFilterCounts.brands) {
      Object.entries(serverFilterCounts.brands).forEach(([brand, count]) => {
        counts[`brand_${brand}`] = count as number;
      });
    }
    // Map filter counts
    if (serverFilterCounts.filters) {
      Object.entries(serverFilterCounts.filters).forEach(([key, count]) => {
        counts[key] = count as number;
      });
    }
    return counts;
  }, [serverFilterCounts]);

  // Aggregate material counts by category for sidebar chips
  const materialCategoryCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    MATERIAL_CATEGORIES.forEach(cat => {
      counts[cat.id] = cat.materials.reduce((sum, mat) => sum + (filterCounts[`material_${mat}`] || 0), 0);
    });
    return counts;
  }, [filterCounts]);

  // Server-side pagination — no client-side "hasMore" needed

  // Track region transitions for smooth UI updates
  const [previousRegion, setPreviousRegion] = useState<string | null>(null);
  const [isRegionTransitioning, setIsRegionTransitioning] = useState(false);

  // Search analytics tracking
  const prevSearchTermRef = useRef<string>("");
  useEffect(() => {
    if (searchTerm && searchTerm.trim().length > 0 && !isLoading && displayedGroups.length >= 0) {
      if (prevSearchTermRef.current !== searchTerm) {
        prevSearchTermRef.current = searchTerm;
        const appliedFilters: string[] = [];
        if (!selectedMaterials.includes("All") && selectedMaterials.length > 0) {
          appliedFilters.push(`material:${selectedMaterials.join(",")}`);
        }
        if (selectedBrands.length > 0) {
          appliedFilters.push(`brand:${selectedBrands.join(",")}`);
        }
        trackSearch({
          query: searchTerm,
          result_count: totalCount,
          has_results: totalCount > 0,
          filters_applied: appliedFilters,
        });
        // GA4
        trackGA4Search(searchTerm, totalCount);
      }
    }
  }, [searchTerm, isLoading, displayedGroups, selectedMaterials, selectedBrands, trackSearch, totalCount]);

  // GA4: track filter changes
  const prevMaterialsRef = useRef(selectedMaterials);
  const prevBrandsRef = useRef(selectedBrands);
  useEffect(() => {
    if (prevMaterialsRef.current !== selectedMaterials && selectedMaterials.length > 0 && !selectedMaterials.includes("All")) {
      trackGA4Filter('material', selectedMaterials.join(','), totalCount);
    }
    prevMaterialsRef.current = selectedMaterials;
  }, [selectedMaterials, totalCount]);
  useEffect(() => {
    if (prevBrandsRef.current !== selectedBrands && selectedBrands.length > 0) {
      trackGA4Filter('brand', selectedBrands.join(','), totalCount);
    }
    prevBrandsRef.current = selectedBrands;
  }, [selectedBrands, totalCount]);

  // Track region changes for smooth transitions
  useEffect(() => {
    if (previousRegion !== null && previousRegion !== currentRegion) {
      setIsRegionTransitioning(true);
    }
    setPreviousRegion(currentRegion);
  }, [currentRegion, previousRegion]);
  
  // End transition when data finishes loading
  useEffect(() => {
    if (!isFetching && isRegionTransitioning) {
      setIsRegionTransitioning(false);
    }
  }, [isFetching, isRegionTransitioning]);

  // Catalog counts for hero section
  const { data: filamentCount } = useQuery({
    queryKey: ["filamentCount"],
    queryFn: async () => {
      const { count, error } = await supabase
        .from("filaments")
        .select("id", { count: "exact" })
        .limit(1);
      if (error) throw error;
      return count || 0;
    },
  });

  const { data: catalogCounts } = useQuery({
    queryKey: ["catalog-counts"],
    queryFn: async () => {
      const [rpcResult, brandResult] = await Promise.all([
        supabase.rpc("get_catalog_counts"),
        supabase.from("v_public_brands").select("brand_slug"),
      ]);
      if (rpcResult.error) throw rpcResult.error;
      const row = rpcResult.data?.[0] || { product_count: 0, variant_count: 0 };
      // Count distinct brands; fall back to 25 if the query fails
      const brandCount = brandResult.error
        ? 25
        : (brandResult.data?.length ?? 25);
      return {
        productCount: Number(row.product_count) || 0,
        variantCount: Number(row.variant_count) || 0,
        brandCount,
      };
    },
  });
  const unfilteredProductCount = catalogCounts?.productCount || 0;
  const unfilteredBrandCount = catalogCounts?.brandCount || 0;

  // Check if any filters are active (including search term)
  const hasActiveFilters = useMemo(() => {
    const hasColorSearch = searchTerm ? extractColorFromText(searchTerm) !== null : false;
    return (
      searchTerm !== "" ||  // Include search term in active filters check
      !selectedMaterials.includes("All") ||
      selectedBrands.length > 0 ||
      priceRange[0] > 0 ||
      priceRange[1] < MAX_PRICE_LIMIT ||
      highSpeed || matte || silk || metallic || sparkle || translucent ||
      carbonFiber || glassFiber || woodFilled || glow || 
      brassOnly || amsOnly ||
      hasTdData ||
      selectedColorFamilies.length > 0 ||
      hexSearch !== "" ||
      hasColorSearch
    );
  }, [searchTerm, selectedMaterials, selectedBrands, priceRange, highSpeed, matte, silk, metallic, sparkle, translucent, carbonFiber, glassFiber, woodFilled, glow, brassOnly, amsOnly, hasTdData, selectedColorFamilies, hexSearch]);

  // Clear all filters function
  const handleClearAllFilters = () => {
    resetFilters();
  };

  // Update navbar compatible count
  useEffect(() => {
    setCompatibleCount(totalCount);
  }, [totalCount, setCompatibleCount]);

  return (
    <div className="min-h-screen">
      {/* Skip Links for keyboard users */}
      <SkipLinks links={[
        { targetId: "filament-filters", label: "Skip to filters" },
        { targetId: "filament-results", label: "Skip to results" },
      ]} />
      <DocumentHead
        title="FilaScope — 22,000+ Filaments, Live Prices & TD Values"
        description="Compare 22,000+ 3D printer filaments from 49+ brands. Live pricing from 15+ stores, HueForge TD values, printer compatibility & detailed specs. The most comprehensive filament database online."
        ogTitle="FilaScope — Compare 22,000+ 3D Printer Filaments | Specs, Prices & TD Values"
        ogDescription="Compare 22,000+ 3D printer filaments from 49+ brands. Live pricing from 15+ stores, HueForge TD values, printer compatibility & detailed specs. The most comprehensive filament database online."
        ogType="website"
        ogUrl="https://filascope.com"
        ogSiteName="FilaScope"
        ogImage="https://filascope.com/og-image.png"
        twitterCard="summary_large_image"
        twitterSite="@FilaScope"
        twitterTitle="FilaScope — Compare 22,000+ 3D Printer Filaments | Specs, Prices & TD Values"
        twitterDescription="Compare 22,000+ 3D printer filaments from 49+ brands. Live pricing from 15+ stores, HueForge TD values, printer compatibility & detailed specs. The most comprehensive filament database online."
        twitterImage="https://filascope.com/og-image.png"
        keywords="3D printer filament comparison, filament database, compare filaments, filament specs, HueForge TD values, filament prices, 3D printing"
      />
      {/* WebSiteSchema + OrganizationSchema now rendered globally in App.tsx */}
      <TrendingItemListSchema />
      <Helmet>
        <script type="application/ld+json">{JSON.stringify({
          "@context": "https://schema.org",
          "@type": "Dataset",
          "name": "FilaScope 3D Printer Filament Database",
          "description": "Structured database of 22,000+ 3D printer filaments from 49+ brands with material specifications, nozzle and bed temperatures, HueForge Transmission Distance values, real-time pricing from 15+ retailers, printer compatibility data, and FilaScore quality ratings.",
          "url": "https://filascope.com/filaments",
          "keywords": ["3D printer filament database","filament specifications","HueForge TD values","filament price comparison","PLA filament data","PETG filament data","3D printing materials"],
          "creator": {"@type": "Organization","name": "FilaScope","url": "https://filascope.com"},
          "dateModified": "2026-02-28",
          "variableMeasured": ["Nozzle Temperature","Bed Temperature","Filament Diameter","Spool Weight","HueForge Transmission Distance","Tensile Strength","Price per Kilogram","FilaScore Rating"],
          "spatialCoverage": "Global",
          "temporalCoverage": "2024/2026",
          "isAccessibleForFree": true
        })}</script>
      </Helmet>
      {/* Onboarding Tour */}
      <OnboardingTour />
      
      {/* Hero Section */}
      <HeroSection 
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        filamentCount={catalogCounts?.variantCount || filamentCount || 0}
        productCount={unfilteredProductCount}
        brandCount={unfilteredBrandCount || brands?.length || 0}
        compatibleCount={totalCount}
        isLoading={isLoading || filamentCount === undefined}
      />

      {/* First-visit onboarding banner — dismissible, drives Quick Match */}
      <div className="max-w-[1600px] mx-auto px-4 sm:px-6 md:px-10">
        <WelcomeBanner />
      </div>

      {/* Region Transition Indicator - fixed at top of viewport during region changes */}
      <RegionTransitionIndicator 
        isTransitioning={isRegionTransitioning || (isFetching && isPlaceholderData)}
        newRegionName={regionConfig.name}
      />

      {/* sr-only H2 for SEO — visible ResultsHeader removed to get products above fold */}
      <h2 className="sr-only">Browse All Filaments</h2>

      {/* Property sort indicator */}
      {useSmartResults && smartSearch.searchIntent.propertyIntent && (
        <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
          <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-amber-500/15 text-amber-400 rounded-full border border-amber-500/30">
            Sorted by: {smartSearch.searchIntent.propertyIntent.name} — {smartSearch.searchIntent.propertyIntent.explanation}
          </span>
        </div>
      )}

      {/* Quick Filter Pills */}
      <QuickFilterPills
        activeFilter={activeQuickFilter}
        filteredCount={totalCount}
        onFilterChange={(filterId) => {
          setActiveQuickFilter(filterId);
          // Apply filter presets
          if (!filterId) {
            // Cleared — reset to defaults
            handleClearAllFilters();
            return;
          }
          handleClearAllFilters();
          switch (filterId) {
            case "popular":
              setSortBy("popular");
              break;
            case "deals":
              setSortBy("price_asc");
              setPriceRange([0, 25]);
              break;
            case "new":
              setSortBy("newest");
              break;
            case "hueforge":
              setHasTdData(true);
              setSortBy("popular");
              break;
            case "highspeed":
              setSelectedMaterials(["PLA"]);
              setHighSpeed(true);
              break;
            case "silk":
              setSilk(true);
              break;
          }
        }}
      />

      {/* Horizontal Filter Bar */}
      <HorizontalFilterBar
        materialCategories={[
          { name: "All", count: filamentCount || 0 },
          ...MATERIAL_CATEGORIES.map(cat => ({
            name: cat.name,
            count: cat.materials.reduce((sum, mat) => sum + (filterCounts[`material_${mat}`] || 0), 0)
          }))
        ]}
        selectedMaterial={(() => {
          if (selectedMaterials.includes("All") || selectedMaterials.length === 0) return "All";
          // Check if selectedMaterials matches a category's materials list
          const matchedCategory = MATERIAL_CATEGORIES.find(cat => {
            // Check if the first material in selectedMaterials is in this category
            return cat.materials.includes(selectedMaterials[0]);
          });
          return matchedCategory?.name || selectedMaterials[0] || "All";
        })()}
        onMaterialChange={(material) => {
          if (material === "All") {
            setSelectedMaterials(["All"]);
          } else {
            // Find the category and set the base materials
            const category = MATERIAL_CATEGORIES.find(cat => cat.name === material);
            if (category) {
              setSelectedMaterials(category.materials);
            } else {
              setSelectedMaterials([material]);
            }
          }
        }}
        brands={(brands || []).map(b => ({ name: b, count: brandFilamentCounts?.[brandNameMap[b] || b] || 0 })).sort((a, b) => a.name.localeCompare(b.name))}
        selectedBrands={selectedBrands}
        onBrandsChange={setSelectedBrands}
        priceRange={priceRange}
        maxPriceLimit={MAX_PRICE_LIMIT}
        onPriceRangeChange={setPriceRange}
        onOpenMoreFilters={() => setMoreFiltersOpen(true)}
        moreFiltersCount={
          // Surface Finish
          (matte ? 1 : 0) +
          (silk ? 1 : 0) +
          (metallic ? 1 : 0) +
          (sparkle ? 1 : 0) +
          (translucent ? 1 : 0) +
          (glow ? 1 : 0) +
          // Reinforced
          (carbonFiber ? 1 : 0) +
          (glassFiber ? 1 : 0) +
          (woodFilled ? 1 : 0) +
          // Performance
          (highSpeed ? 1 : 0) +
          (brassOnly ? 1 : 0) +
          (amsOnly ? 1 : 0) +
          // Spool Size
          (largeSpools ? 1 : 0) +
          // HueForge
          (hasTdData ? 1 : 0)
        }
        sortBy={sortBy}
        onSortChange={setSortBy}
        onClearAll={handleClearAllFilters}
      />

      {/* Active Filter Tags */}
      {(() => {
        const detectedColor = searchTerm ? extractColorFromText(searchTerm) : null;
        return (
          <ActiveFilterTags
            filters={[
              // Show detected color search from searchTerm
              ...(detectedColor && !hexSearch ? [{ 
                id: 'colorSearch', 
                label: `Color: ${detectedColor.colorName.charAt(0).toUpperCase() + detectedColor.colorName.slice(1)}`, 
                type: 'color' as const 
              }] : []),
              ...(!selectedMaterials.includes("All") ? selectedMaterials.map(m => ({ id: m, label: m, type: 'material' as const })) : []),
              ...selectedBrands.map(b => ({ id: b, label: b, type: 'brand' as const })),
              ...(priceRange[0] > 0 || priceRange[1] < MAX_PRICE_LIMIT ? [{ id: 'price', label: `$${priceRange[0]}-$${priceRange[1]}/kg`, type: 'price' as const }] : []),
              ...(highSpeed ? [{ id: 'highSpeed', label: 'High Speed', type: 'property' as const }] : []),
              ...(matte ? [{ id: 'matte', label: 'Matte', type: 'property' as const }] : []),
              ...(silk ? [{ id: 'silk', label: 'Silk/Shimmer', type: 'property' as const }] : []),
              ...(metallic ? [{ id: 'metallic', label: 'Metallic', type: 'property' as const }] : []),
              ...(sparkle ? [{ id: 'sparkle', label: 'Sparkle', type: 'property' as const }] : []),
              ...(translucent ? [{ id: 'translucent', label: 'Translucent', type: 'property' as const }] : []),
              ...(carbonFiber ? [{ id: 'carbonFiber', label: 'Carbon Fiber', type: 'property' as const }] : []),
              ...(glassFiber ? [{ id: 'glassFiber', label: 'Glass Fiber', type: 'property' as const }] : []),
              ...(woodFilled ? [{ id: 'woodFilled', label: 'Wood Filled', type: 'property' as const }] : []),
              ...(glow ? [{ id: 'glow', label: 'Glow', type: 'property' as const }] : []),
              ...(largeSpools ? [{ id: 'largeSpools', label: 'Large Spools', type: 'property' as const }] : []),
              ...(brassOnly ? [{ id: 'brassOnly', label: 'Brass Safe', type: 'property' as const }] : []),
              ...(amsOnly ? [{ id: 'amsOnly', label: 'AMS Compatible', type: 'property' as const }] : []),
              ...(hasTdData ? [{ id: 'hasTdData', label: 'HueForge TD', type: 'property' as const }] : []),
              ...(inStockOnly ? [{ id: 'inStockOnly', label: 'In Stock', type: 'property' as const }] : []),
              ...selectedColorFamilies.map(c => ({ id: c, label: c, type: 'color' as const })),
            ]}
            onRemove={(id, type) => {
              if (id === 'colorSearch') {
                setSearchTerm("");
              } else if (type === 'material') {
                const newMaterials = selectedMaterials.filter(m => m !== id);
                setSelectedMaterials(newMaterials.length === 0 ? ["All"] : newMaterials);
              } else if (type === 'brand') {
                setSelectedBrands(selectedBrands.filter(b => b !== id));
              } else if (type === 'price') {
                setPriceRange([0, MAX_PRICE_LIMIT]);
              } else if (type === 'color') {
                setSelectedColorFamilies(selectedColorFamilies.filter(c => c !== id));
              } else if (type === 'property') {
                switch (id) {
                  case 'highSpeed': setHighSpeed(false); break;
                  case 'matte': setMatte(false); break;
                  case 'silk': setSilk(false); break;
                  case 'metallic': setMetallic(false); break;
                  case 'sparkle': setSparkle(false); break;
                  case 'translucent': setTranslucent(false); break;
                  case 'carbonFiber': setCarbonFiber(false); break;
                  case 'glassFiber': setGlassFiber(false); break;
                  case 'woodFilled': setWoodFilled(false); break;
                  case 'glow': setGlow(false); break;
                  case 'largeSpools': setLargeSpools(false); break;
                  case 'brassOnly': setBrassOnly(false); break;
                  case 'amsOnly': setAmsOnly(false); break;
                  case 'hasTdData': setHasTdData(false); break;
                  case 'inStockOnly': setInStockOnly(false); break;
                }
              }
            }}
            onClearAll={() => {
              setSelectedMaterials(["All"]);
              setSelectedBrands([]);
              setPriceRange([0, MAX_PRICE_LIMIT]);
              setHighSpeed(false);
              setMatte(false);
              setSilk(false);
              setMetallic(false);
              setSparkle(false);
              setTranslucent(false);
              setCarbonFiber(false);
              setGlassFiber(false);
              setWoodFilled(false);
              setGlow(false);
              setLargeSpools(false);
              setBrassOnly(false);
              setAmsOnly(false);
              setHasTdData(false);
              setSelectedColorFamilies([]);
              setHexSearch("");
              setSearchTerm("");
            }}
          />
        );
      })()}

      {/* Smart Search Chips - shown when smart search expanded the query */}
      {useSmartResults && (
        <SearchSmartChips
          chips={smartSearch.chips}
          expandedQuery={smartSearch.expandedQuery}
          originalQuery={searchTerm}
          onRemoveChip={smartSearch.removeChip}
        />
      )}

      {/* Printer Selector Sheet */}
      <Sheet open={printerSelectorOpen} onOpenChange={setPrinterSelectorOpen}>
        <SheetContent side="right" className="w-full sm:max-w-lg">
          <SheetHeader>
            <SheetTitle>Select Your Printer</SheetTitle>
          </SheetHeader>
          <div className="mt-6">
            <PrinterSelector />
            <MaterialRecommendations />
          </div>
        </SheetContent>
      </Sheet>

      {/* More Filters Modal */}
      <MoreFiltersModal
        open={moreFiltersOpen}
        onOpenChange={setMoreFiltersOpen}
        // Surface Finish
        matte={matte}
        onMatteChange={setMatte}
        silk={silk}
        onSilkChange={setSilk}
        metallic={metallic}
        onMetallicChange={setMetallic}
        sparkle={sparkle}
        onSparkleChange={setSparkle}
        translucent={translucent}
        onTranslucentChange={setTranslucent}
        glow={glow}
        onGlowChange={setGlow}
        // Reinforced Materials
        carbonFiber={carbonFiber}
        onCarbonFiberChange={setCarbonFiber}
        glassFiber={glassFiber}
        onGlassFiberChange={setGlassFiber}
        woodFilled={woodFilled}
        onWoodFilledChange={setWoodFilled}
        // Performance
        highSpeed={highSpeed}
        onHighSpeedChange={setHighSpeed}
        brassOnly={brassOnly}
        onBrassOnlyChange={setBrassOnly}
        amsOnly={amsOnly}
        onAmsOnlyChange={setAmsOnly}
        // Spool Size
        largeSpools={largeSpools}
        onLargeSpoolsChange={setLargeSpools}
        // Color
        selectedColorFamilies={selectedColorFamilies}
        onColorFamiliesChange={setSelectedColorFamilies}
        // HueForge
        hasTdData={hasTdData}
        onHasTdDataChange={setHasTdData}
        // Filter counts
        filterCounts={filterCounts}
      />

      {/* Mobile Filter Controls */}
      <div className="lg:hidden sticky top-16 z-30 bg-background/95 backdrop-blur-md border-b border-gray-800 px-4 py-3">
        <div className="flex items-center gap-3">
          <MobileFilamentFilterSheet
            selectedMaterials={selectedMaterials}
            onMaterialChange={(material, checked) => {
              if (checked) {
                const category = MATERIAL_CATEGORIES.find(cat => cat.id === material);
                const materialsToAdd = category ? category.materials : [material];
                const base = selectedMaterials.includes("All") ? [] : selectedMaterials;
                setSelectedMaterials([...base, ...materialsToAdd]);
              } else {
                const category = MATERIAL_CATEGORIES.find(cat => cat.id === material);
                const materialsToRemove = category ? category.materials : [material];
                const remaining = selectedMaterials.filter(m => !materialsToRemove.includes(m));
                setSelectedMaterials(remaining.length === 0 ? ["All"] : remaining);
              }
            }}
            selectedBrands={selectedBrands}
            onBrandChange={(brand, checked) => {
              if (checked) {
                setSelectedBrands([...selectedBrands, brand]);
              } else {
                setSelectedBrands(selectedBrands.filter(b => b !== brand));
              }
            }}
            carbonFiber={carbonFiber}
            onCarbonFiberChange={setCarbonFiber}
            glassFiber={glassFiber}
            onGlassFiberChange={setGlassFiber}
            woodFilled={woodFilled}
            onWoodFilledChange={setWoodFilled}
            spoolSize={largeSpools ? "large" : "standard"}
            onSpoolSizeChange={(size) => setLargeSpools(size === "large")}
            onClearAll={() => {
              setSelectedMaterials(["All"]);
              setSelectedBrands([]);
              setCarbonFiber(false);
              setGlassFiber(false);
              setWoodFilled(false);
              setLargeSpools(false);
            }}
            sortBy={sortBy}
            onSortChange={setSortBy}
            resultCount={totalCount}
          />
        </div>
      </div>

      {/* Mobile Active Filter Chips - Horizontal scroll */}
      <MobileActiveFilterChips
        filters={[
          // Only show material chips if user selected specific materials (not the default "All")
          ...(selectedMaterials.length > 0 && !(selectedMaterials.length === 1 && selectedMaterials[0] === "All")
            ? selectedMaterials.map(m => ({ id: m, label: m.replace('-family', '').toUpperCase(), type: 'material' as const }))
            : []),
          ...selectedBrands.map(b => ({ id: b, label: b, type: 'brand' as const })),
          ...(carbonFiber ? [{ id: 'carbon', label: 'Carbon Fiber', type: 'reinforced' as const }] : []),
          ...(glassFiber ? [{ id: 'glass', label: 'Glass Fiber', type: 'reinforced' as const }] : []),
          ...(woodFilled ? [{ id: 'wood', label: 'Wood Filled', type: 'reinforced' as const }] : []),
          ...(largeSpools ? [{ id: 'large', label: 'Large Spool', type: 'spool' as const }] : []),
        ]}
        onRemove={(id, type) => {
          if (type === 'material') {
            const newMaterials = selectedMaterials.filter(m => m !== id);
            setSelectedMaterials(newMaterials.length === 0 ? ["All"] : newMaterials);
          }
          if (type === 'brand') setSelectedBrands(selectedBrands.filter(b => b !== id));
          if (type === 'reinforced') {
            if (id === 'carbon') setCarbonFiber(false);
            if (id === 'glass') setGlassFiber(false);
            if (id === 'wood') setWoodFilled(false);
          }
          if (type === 'spool') setLargeSpools(false);
        }}
        onClearAll={() => {
          setSelectedMaterials(["All"]);
          setSelectedBrands([]);
          setCarbonFiber(false);
          setGlassFiber(false);
          setWoodFilled(false);
          setLargeSpools(false);
        }}
        selectedPrinterName={selectedPrinter?.model_name}
        onChangePrinter={() => setPrinterSelectorOpen(true)}
        onEdit={() => {
          // Trigger the mobile filter sheet to open by dispatching a custom event
          const btn = document.querySelector<HTMLButtonElement>('[data-mobile-filter-trigger]');
          btn?.click();
        }}
        className="border-b border-gray-800/50"
      />

      {/* Main Content Area with Technical Console Sidebar */}
      <div id="filament-filters" className="flex gap-8 max-w-[1600px] mx-auto px-4 lg:px-8 py-6 lg:py-10 items-start">
        {/* Technical Console Sidebar - Desktop only */}
        <TechnicalConsoleSidebar
          selectedMaterials={selectedMaterials}
          onMaterialChange={(material, checked) => {
            if (checked) {
              // Expand category ID to actual material names
              const category = MATERIAL_CATEGORIES.find(cat => cat.id === material);
              const materialsToAdd = category ? category.materials : [material];
              const base = selectedMaterials.includes("All") ? [] : selectedMaterials;
              setSelectedMaterials([...base, ...materialsToAdd]);
            } else {
              // Remove all materials belonging to this category
              const category = MATERIAL_CATEGORIES.find(cat => cat.id === material);
              const materialsToRemove = category ? category.materials : [material];
              const remaining = selectedMaterials.filter(m => !materialsToRemove.includes(m));
              setSelectedMaterials(remaining.length === 0 ? ["All"] : remaining);
            }
          }}
          selectedBrands={selectedBrands}
          onBrandChange={(brand, checked) => {
            if (checked) {
              setSelectedBrands([...selectedBrands, brand]);
            } else {
              setSelectedBrands(selectedBrands.filter(b => b !== brand));
            }
          }}
          carbonFiber={carbonFiber}
          onCarbonFiberChange={setCarbonFiber}
          glassFiber={glassFiber}
          onGlassFiberChange={setGlassFiber}
          woodFilled={woodFilled}
          onWoodFilledChange={setWoodFilled}
          spoolSize={largeSpools ? "large" : "standard"}
          onSpoolSizeChange={(size) => setLargeSpools(size === "large")}
          onClearAll={handleClearAllFilters}
          showCostPerPrint={showCostPerPrint}
          onShowCostPerPrintChange={setShowCostPerPrint}
          materialCategoryCounts={materialCategoryCounts}
        />

        {/* Main Content */}
        <div className="flex-1 min-w-0">
          <section className="w-full" role="region" aria-label="Filament product listings" id="filament-results">

        {/* Search Intelligence Bar — appears when search is active */}
        {useSmartResults && (
          <SearchIntelligenceBar
            searchQuery={searchTerm}
            intent={smartSearch.searchIntent}
            filteredCount={totalCount}
            onClear={() => {
              setSearchTerm("");
              window.history.replaceState({}, "", window.location.pathname);
            }}
            onMaterialOnly={(mat) => {
              setSearchTerm(mat);
            }}
          />
        )}

        {/* Results count and View Mode Toggle */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-4">
            <p className="text-sm text-muted-foreground">
              {isLoading && !isPlaceholderData ? (
                <span className="inline-block w-20 h-4 bg-muted/30 rounded animate-pulse align-middle" />
              ) : (
                <>
                  {inStockOnly
                    ? `${displayedGroups.length.toLocaleString()} in-stock products`
                    : `${totalCount.toLocaleString()} products`
                  }
                </>
              )}
            </p>
            {/* In Stock Only toggle */}
            <div className="hidden sm:flex items-center gap-1.5">
              <Switch
                id="in-stock-toggle"
                checked={inStockOnly}
                onCheckedChange={setInStockOnly}
                className="data-[state=checked]:bg-primary"
              />
              <Label htmlFor="in-stock-toggle" className="text-xs text-muted-foreground cursor-pointer">
                In Stock
              </Label>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {/* Cost per print toggle */}
            <label className="hidden sm:flex items-center gap-1.5 cursor-pointer text-xs text-muted-foreground hover:text-foreground transition-colors">
              <input
                type="checkbox"
                checked={showCostPerPrint}
                onChange={(e) => setShowCostPerPrint(e.target.checked)}
                className="rounded border-border w-3.5 h-3.5 accent-primary"
              />
              Cost/print
            </label>
            <span className="text-xs text-muted-foreground hidden sm:inline">
              {regionConfig.flag} {regionConfig.name}
              <RegionLoadingSpinner isLoading={isRegionTransitioning || (isFetching && isPlaceholderData)} />
            </span>
            {!isMobile && (
              <ViewToggle 
                viewMode={viewMode} 
                onViewModeChange={setViewMode}
              />
            )}
          </div>
        </div>

        {/* DataInventoryControlBar removed — sort is in HorizontalFilterBar */}
        {/* RecentlyViewed moved below grid */}

        {/* Filaments Display - only show skeleton on initial load, keep products visible during region transition */}
        {isLoading && !isPlaceholderData ? (
          <div className="space-y-6">
            {/* Show skeleton grid immediately for visual feedback */}
            <FilamentCardSkeletonGrid count={12} />
          </div>
        ) : displayedGroups.length > 0 ? (
          <>
          {
          effectiveViewMode === "list" ? (
            /* List View - Sortable Table (uses representative filaments from groups) */
            <FilamentTableView
              filaments={displayedGroups.map(g => g.representativeFilament) as any}
              isInCompare={isInCompare}
              addItem={addItem}
              removeItem={removeItem}
              getAffiliateUrl={getAffiliateUrl}
              hexSearch={hexSearch}
              getColorMatchPercent={getColorMatchPercent}
              sortBy={sortBy}
              onSortChange={setSortBy}
            />
          ) : (
            /* Grid View - Laboratory Readout Cards */
            <div className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 grid-filter-fade${(isFetching && !isLoading) ? " is-updating" : ""}`} id="filament-grid">
              {displayedGroups.map((group, index) => {
                const filament = group.representativeFilament;

                return (
                  <React.Fragment key={filament.id}>
                    {/* Break moment card every 8th item */}
                    {index > 0 && index % 8 === 0 && (() => {
                      const breakType = getBreakType(index, !!selectedPrinter);
                      if (isDismissed(breakType) || dismissedBreaks[breakType]) return null;
                      const topDeal = topDeals?.[0];
                      return (
                        <GridBreakCard
                          type={breakType}
                          tipIndex={Math.floor(index / 8)}
                          dealData={topDeal ? {
                            name: topDeal.product_title,
                            discount: topDeal.savings_percent,
                            pricePerKg: `$${topDeal.price_per_kg}`,
                            slug: topDeal.id,
                          } : undefined}
                          onDismiss={(t) => setDismissedBreaks(prev => ({ ...prev, [t]: true }))}
                        />
                      );
                    })()}
                    {/* OOS section divider */}
                    {oosStartIndex > 0 && index === oosStartIndex && (
                      <div className="col-span-full flex items-center gap-3 py-3" role="separator">
                        <div className="flex-1 border-t" style={{ borderColor: 'rgba(255,255,255,0.15)' }} />
                        <span className="text-[11px] whitespace-nowrap" style={{ color: 'rgba(255,255,255,0.3)' }}>Out of Stock</span>
                        <div className="flex-1 border-t" style={{ borderColor: 'rgba(255,255,255,0.15)' }} />
                      </div>
                    )}
                    <LabReadoutCard
                      filament={filament}
                      index={index}
                      displayTitle={group.baseName}
                      communityRating={communityRatingsMap?.get(filament.id) || null}
                      priority={index < 4}
                      variantIndicators={group.variants.length > 1 ? {
                        colors: Array.from(group.colors),
                        weights: Array.from(group.weights).sort((a, b) => a - b),
                        variantCount: group.variants.length,
                        priceRange: group.priceRange,
                        anyInStock: group.anyInStock,
                      } : undefined}
                      showCostPerPrint={showCostPerPrint}
                      searchPropertyBadge={useSmartResults && smartSearch.searchIntent.propertyIntent ? {
                        badge: smartSearch.searchIntent.propertyIntent.name,
                        sortCol: smartSearch.searchIntent.propertyIntent.sortColumn,
                      } : undefined}
                      searchPropertyIntent={useSmartResults && smartSearch.searchIntent.propertyIntent ? {
                        column: smartSearch.searchIntent.propertyIntent.sortColumn,
                        label: smartSearch.searchIntent.propertyIntent.badgeLabel,
                        unit: smartSearch.searchIntent.propertyIntent.badgeUnit,
                      } : null}
                    />
                  </React.Fragment>
                );
              })}
            </div>
          )}
          
          {/* Pagination Bar */}
          <FinderPaginationBar
            currentPage={currentPage}
            totalCount={totalCount}
            pageSize={pageSize}
            displayedCount={displayedGroups.length}
            onPageChange={setCurrentPage}
            onPageSizeChange={(size) => {
              setPageSize(size);
              localStorage.setItem("finderPageSize", String(size));
              setCurrentPage(0);
            }}
          />

          {/* Recently Viewed — below grid for returning users */}
          <RecentlyViewedSection limit={12} showClear title="Recently Viewed" filterType="filament" />

          {/* Trending Section — social proof below grid */}
          <TrendingSection />

          </>
        ) : (
          (() => {
            // Analyze search query for smart suggestions
            const searchAnalysis = searchTerm ? analyzeSearchQuery(searchTerm) : null;
            return (
              <FilamentsEmptyState
                searchTerm={searchTerm}
                hasActiveFilters={hasActiveFilters}
                onClearFilters={handleClearAllFilters}
                onSearchChange={setSearchTerm}
                detectedBrands={searchAnalysis?.detectedBrands}
                detectedMaterials={searchAnalysis?.detectedMaterials}
                selectedMaterials={selectedMaterials}
                selectedBrands={selectedBrands}
                onBrandFilter={(brand) => {
                  setSearchTerm("");
                  setSelectedBrands([brand]);
                }}
                onMaterialFilter={(material) => {
                  setSearchTerm("");
                  setSelectedMaterials([material]);
                }}
              />
            );
          })()
        )}
          </section>
        </div>
      </div>

      {/* Multi-select mode banner */}
      {isMultiSelectMode && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 multi-select-banner">
          <div className="bg-primary text-primary-foreground px-4 py-2 rounded-full shadow-lg flex items-center gap-2 text-sm font-medium">
            <span className="w-2 h-2 rounded-full bg-primary-foreground animate-pulse" />
            Multi-select mode • Click cards to add
            {pendingItems.length > 0 && (
              <span className="bg-primary-foreground/20 px-2 py-0.5 rounded-full ml-1">
                {pendingItems.length} selected
              </span>
            )}
          </div>
        </div>
      )}

      {/* Old Floating Compare Bar - replaced by global CompareTray */}

      {/* Mobile Quick Match Prompt */}
      <MobileQuickMatchPrompt />
      <ScrollToTopButton />

      {/* === ZONE 4: SEO + TRUST (below catalog) === */}

      {/* What is FilaScope — AEO answer block */}
      <section className="max-w-4xl mx-auto px-4 py-10 text-center space-y-4">
        <h2 className="text-2xl font-bold text-foreground">What is FilaScope?</h2>
        <p className="text-muted-foreground text-base leading-relaxed">
          FilaScope is a free 3D printer filament comparison platform that indexes 1,080+ filaments from 48+ brands with real-time pricing from 15+ retailers worldwide. It features the largest public HueForge Transmission Distance (TD) database, detailed material specifications, printer compatibility data, and FilaScore quality ratings — helping makers find the perfect filament for any project.
        </p>
        <p className="text-muted-foreground text-base leading-relaxed">
          Whether you need the best PLA for beginners, the strongest PETG for functional parts, or a specific TD value for HueForge lithophane printing, FilaScope's data-driven approach compares filaments across 6 regional markets so you can make informed decisions with transparent, up-to-date pricing.
        </p>
      </section>

      {/* Why FilaScope value proposition */}
      <WhyFilaScope />

      {/* Brand logos — trust signal */}
      <div className="max-w-[1600px] mx-auto px-4 sm:px-6 md:px-10 py-8 flex justify-center">
        <HeroProductGrid />
      </div>

      {/* AI snippet zone — supplementary SEO content */}
      <div className="max-w-[800px] mx-auto px-4 sm:px-6 py-10 text-center" style={{ background: 'rgba(255,255,255,0.015)' }}>
        <h2 className="text-sm font-semibold mb-3" style={{ color: 'rgba(255,255,255,0.5)' }}>
          The Internet's Most Complete 3D Printer Filament Database
        </h2>
        <p className="text-[14px] leading-relaxed mb-3" style={{ color: 'rgba(255,255,255,0.5)' }}>
          FilaScope is the most powerful <strong>filament comparison tool</strong> on the web — letting you <strong>compare 3D printer filaments</strong> across 1,080+ products from 48+ manufacturers and 15+ retailers worldwide. Every listing in our <strong>filament specs database</strong> includes nozzle temperature, bed temperature, density, tensile strength, and shore hardness — plus live <strong>filament prices</strong> in USD, CAD, EUR, GBP, and AUD. FilaScope also maintains the world's largest verified database of <strong>HueForge TD values</strong>, making it the go-to resource for lithophane and multicolor 3D printing projects.
        </p>
        <p className="text-[14px] leading-relaxed" style={{ color: 'rgba(255,255,255,0.5)' }}>
          Whether you're a beginner choosing your first PLA or an advanced maker sourcing carbon-fiber PETG, FilaScope's <strong>printer compatibility</strong> filters, real-time deal tracking, and side-by-side comparison tools help you find the right filament at the best price — every time.
        </p>
      </div>

      {/* SEO content block — above implicit footer, discoverable by crawlers */}
      <HomeSEOContent />
      <LatestNewsSection />
      <HomeFAQSection />
    </div>
  );
};

export default Finder;
