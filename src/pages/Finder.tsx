import { useMemo, useEffect, useState, useRef, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useSessionFilters } from "@/hooks/useSessionFilters";
import { supabase } from "@/integrations/supabase/client";
import { useFinderQuery, type FinderFilters, DEFAULT_PAGE_SIZE } from "@/hooks/useFinderQuery";
import { useFilterCounts } from "@/hooks/useFilterCounts";
import { useFilterAnalytics } from "@/hooks/useFilterAnalytics";
import { useSearchContext } from "@/hooks/useSearchContext";
import { useRegionalFiltering } from "@/hooks/useRegionalFiltering";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Slider } from "@/components/ui/slider";
import { MaterialBadge } from "@/components/MaterialBadge";
import { ExternalLink, ChevronDown, GitCompare, X, CheckCircle, XCircle, TreeDeciduous, Layers, Palette, DollarSign, SlidersHorizontal } from "lucide-react";
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
import { Helmet } from "react-helmet-async";
import HeroSection from "@/components/HeroSection";
import { WebSiteSchema, OrganizationSchema } from "@/components/seo";
import SectionSeparator from "@/components/SectionSeparator";
import ResultsHeader from "@/components/ResultsHeader";
import { FilamentFilters } from "@/components/FilamentFilters";
import { TechnicalConsoleSidebar } from "@/components/TechnicalConsoleSidebar";
import { HorizontalFilterBar } from "@/components/filters/HorizontalFilterBar";
import { QuickFilterPills } from "@/components/QuickFilterPills";
import { FilamentsEmptyState } from "@/components/filament/FilamentsEmptyState";
import { ActiveFilterTags, type ActiveFilter } from "@/components/filters/ActiveFilterTags";
import { MATERIAL_CATEGORIES } from "@/lib/materialHierarchy";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { MoreFiltersModal } from "@/components/filters/MoreFiltersModal";
import { ViewToggle } from "@/components/ViewToggle";
import { FilamentTableView } from "@/components/FilamentTableView";
import { FinderPaginationBar } from "@/components/FinderPaginationBar";
import { useIsMobile } from "@/hooks/use-mobile";
import { extractColorFromText } from "@/lib/colorIntelligence";
import { OnboardingTour } from "@/components/onboarding";
import { SkipLinks } from "@/components/accessibility/SkipLink";
import { RecentlyViewedSection } from "@/components/RecentlyViewedSection";
import { TrendingSection } from "@/components/TrendingSection";
import { MobileQuickMatchPrompt } from "@/components/MobileQuickMatchPrompt";
import WhyFilaScope from "@/components/WhyFilaScope";

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
      syncedBrands.forEach(b => {
        brandNameMap[b.display_name] = b.brand_name;
      });
      
      // Get all synced brand display names
      const allBrands = syncedBrands.map(b => b.display_name);
      
      return {
        displayNames: allBrands.sort(),
        brandNameMap
      };
    },
  });
  
  // Extract for convenience
  const brands = brandsData?.displayNames;
  const brandNameMap = brandsData?.brandNameMap || {};

  // Fetch true filament counts per brand in a SINGLE query (replaces N+1 loop)
  const { data: brandFilamentCounts } = useQuery({
    queryKey: ["brand-filament-counts", brandNameMap],
    queryFn: async () => {
      const brandNames = Object.values(brandNameMap);
      if (brandNames.length === 0) return {};
      
      // Single query: fetch vendor column for all brands, then count client-side
      const { data, error } = await supabase
        .from("filaments")
        .select("vendor")
        .in("vendor", brandNames);
      
      if (error) throw error;
      
      // Group and count client-side
      const counts: Record<string, number> = {};
      for (const row of data || []) {
        if (row.vendor) {
          counts[row.vendor] = (counts[row.vendor] || 0) + 1;
        }
      }
      
      return counts;
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
    enabled: Object.keys(brandNameMap).length > 0,
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

  const { groups: displayedGroups, totalCount, isLoading, isFetching, isPlaceholderData } = 
    useFinderQuery(finderFilters, currentPage, brandNameMap, pageSize);

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
      }
    }
  }, [searchTerm, isLoading, displayedGroups, selectedMaterials, selectedBrands, trackSearch, totalCount]);

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
        supabase.from("v_public_brands").select("id", { count: "exact" }).limit(1),
      ]);
      if (rpcResult.error) throw rpcResult.error;
      const row = rpcResult.data?.[0] || { product_count: 0, variant_count: 0 };
      return {
        productCount: Number(row.product_count) || 0,
        variantCount: Number(row.variant_count) || 0,
        brandCount: brandResult.count || brandResult.data?.length || 0,
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
      <Helmet>
        <title>FilaScope — Compare 3D Printer Filaments, Specs & Prices</title>
        <meta name="description" content={`Compare ${unfilteredProductCount || filamentCount || '1000'}+ 3D printer filaments from ${unfilteredBrandCount || '45'}+ brands with specs, regional pricing, and transmissivity data for HueForge. Find your perfect filament.`} />
        <meta property="og:title" content="FilaScope — Compare 3D Printer Filaments, Specs & Prices" />
        <meta property="og:description" content={`Compare ${unfilteredProductCount || filamentCount || '1000'}+ 3D printer filaments from ${unfilteredBrandCount || '45'}+ brands with specs, regional pricing, and transmissivity data for HueForge. Find your perfect filament.`} />
      </Helmet>
      {/* JSON-LD Structured Data for Homepage */}
      <WebSiteSchema />
      <OrganizationSchema />
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

      {/* Quick Match banner moved to sidebar and mobile bottom sheet */}

      {/* Trending Section — between hero and registry */}
      <TrendingSection />

      {/* Why FilaScope value proposition */}
      <WhyFilaScope />

      {/* Value Proposition Row */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col md:flex-row items-center md:items-start justify-center gap-8 md:gap-12">
          <div className="flex flex-col items-center text-center gap-2">
            <div className="w-10 h-10 rounded-full bg-cyan-500/10 flex items-center justify-center">
              <DollarSign className="w-6 h-6 text-cyan-400" />
            </div>
            <h3 className="text-sm font-semibold text-foreground">Real Prices, Real Stores</h3>
            <p className="text-xs text-muted-foreground">Live pricing from 15+ retailers in your currency</p>
          </div>
          <div className="flex flex-col items-center text-center gap-2">
            <div className="w-10 h-10 rounded-full bg-cyan-500/10 flex items-center justify-center">
              <SlidersHorizontal className="w-6 h-6 text-cyan-400" />
            </div>
            <h3 className="text-sm font-semibold text-foreground">Filtered For Your Printer</h3>
            <p className="text-xs text-muted-foreground">See only compatible filaments instantly</p>
          </div>
          <div className="flex flex-col items-center text-center gap-2">
            <div className="w-10 h-10 rounded-full bg-cyan-500/10 flex items-center justify-center">
              <Palette className="w-6 h-6 text-cyan-400" />
            </div>
            <h3 className="text-sm font-semibold text-foreground">Find by Color & TD</h3>
            <p className="text-xs text-muted-foreground">The world's largest HueForge TD database</p>
          </div>
        </div>
      </div>

      {/* Bridge: Discovery → Catalog transition */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-6">
          <h2 className="text-xl font-semibold text-foreground">Browse All Filaments</h2>
          <p className="text-sm text-muted-foreground mt-1.5">
            Explore {unfilteredProductCount ? `${unfilteredProductCount.toLocaleString()}+` : "1,000+"} filaments from 48+ brands. Filter by material, printer compatibility, price, and more.
          </p>
        </div>
      </div>

      {/* Region Transition Indicator - fixed at top of viewport during region changes */}
      <RegionTransitionIndicator 
        isTransitioning={isRegionTransitioning || (isFetching && isPlaceholderData)}
        newRegionName={regionConfig.name}
      />

      {/* Results Header with Context */}
      <ResultsHeader
        count={totalCount}
        totalCatalogCount={unfilteredProductCount}
        totalVariantCount={catalogCounts?.variantCount || 0}
        selectedPrinter={selectedPrinter}
        hasActiveFilters={hasActiveFilters}
        onClearFilters={handleClearAllFilters}
        isUpdating={isRegionTransitioning || (isFetching && isPlaceholderData)}
      />

      {/* Quick Filter Pills */}
      <QuickFilterPills
        activeFilter={activeQuickFilter}
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
            onClearAll={() => {
              setSelectedMaterials(["All"]);
              setSelectedBrands([]);
              setCarbonFiber(false);
              setGlassFiber(false);
              setWoodFilled(false);
              setLargeSpools(false);
            }}
          />
          
          {/* Sort dropdown for mobile */}
          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="flex-1 h-11 bg-gray-800/50 border-gray-700">
              <SelectValue placeholder="Sort by..." />
            </SelectTrigger>
            <SelectContent className="bg-gray-800 border-gray-700 z-50">
              <SelectItem value="scoring-desc" className="min-h-[44px]">Scoring: High to Low</SelectItem>
              <SelectItem value="price-asc" className="min-h-[44px]">Price: Low to High</SelectItem>
              <SelectItem value="price-desc" className="min-h-[44px]">Price: High to Low</SelectItem>
              <SelectItem value="alpha-asc" className="min-h-[44px]">Name: A-Z</SelectItem>
            </SelectContent>
          </Select>
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

        {/* Results count and View Mode Toggle */}
        <div className="flex items-center justify-between mb-3">
          <p className="text-sm text-muted-foreground">
            {/* Only show skeleton on initial load, not during region transitions */}
            {isLoading && !isPlaceholderData ? (
              <span className="inline-block w-20 h-4 bg-muted/30 rounded animate-pulse align-middle" />
            ) : (
              <>
                {totalCount.toLocaleString()} products{unfilteredProductCount > 0 && totalCount < unfilteredProductCount ? ` of ${unfilteredProductCount.toLocaleString()} total` : ''}
              </>
            )}
          </p>
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

        {/* Data Inventory Control Bar - Desktop only - show even during region transition if we have data */}
        {(!isLoading || isPlaceholderData) && displayedGroups.length > 0 && !isMobile && (
          <DataInventoryControlBar
            sortBy={sortBy as SortOption}
            onSortChange={(val) => setSortBy(val)}
            resultCount={totalCount}
          />
        )}

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
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6" id="filament-grid">
              {displayedGroups.map((group, index) => {
                const filament = group.representativeFilament;

                return (
                  <LabReadoutCard
                    key={filament.id}
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
                  />
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

          {/* Recently Viewed — return-visit hook at bottom of grid */}
          <div className="mt-6">
            <RecentlyViewedSection limit={6} showClear title="Recently Viewed" filterType="filament" compact />
          </div>
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
    </div>
  );
};

export default Finder;
