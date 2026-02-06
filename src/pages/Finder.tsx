import { useMemo, useEffect, useState, useRef, useCallback } from "react"; // v4
import { useQuery, keepPreviousData } from "@tanstack/react-query";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useSessionFilters } from "@/hooks/useSessionFilters";
import { supabase } from "@/integrations/supabase/client";
import { fetchAllFilaments, type FetchProgressCallback } from "@/lib/supabaseHelpers";
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
import HeroSection from "@/components/HeroSection";
import { WebSiteSchema, OrganizationSchema } from "@/components/seo";
import SectionSeparator from "@/components/SectionSeparator";
import ResultsHeader from "@/components/ResultsHeader";
import { FilamentFilters } from "@/components/FilamentFilters";
import { TechnicalConsoleSidebar } from "@/components/TechnicalConsoleSidebar";
import { HorizontalFilterBar } from "@/components/filters/HorizontalFilterBar";
import { FilamentsEmptyState } from "@/components/filament/FilamentsEmptyState";
import { ActiveFilterTags, type ActiveFilter } from "@/components/filters/ActiveFilterTags";
import { MATERIAL_CATEGORIES } from "@/lib/materialHierarchy";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { MoreFiltersModal } from "@/components/filters/MoreFiltersModal";
import { ViewToggle } from "@/components/ViewToggle";
import { FilamentTableView } from "@/components/FilamentTableView";
import { useIsMobile } from "@/hooks/use-mobile";
import { extractColorFromText } from "@/lib/colorIntelligence";
import { groupFilamentsByProduct, type GroupedFilament } from "@/lib/productNameUtils";
import { OnboardingTour, WelcomeBanner } from "@/components/onboarding";
import { MobileFilamentFilterSheet } from "@/components/filters/MobileFilamentFilterSheet";
import { MobileActiveFilterChips } from "@/components/filters/MobileActiveFilterChips";
import { MobilePrinterQuickSelect } from "@/components/filters/MobilePrinterQuickSelect";
import { useScrollRestoration } from "@/hooks/useScrollRestoration";
import { LoadingProgress } from "@/components/LoadingProgress";
import { RegionTransitionIndicator, RegionLoadingSpinner } from "@/components/RegionTransitionIndicator";
import { createScoringContext, type FilamentForScoring } from "@/lib/filamentScoring";
import { calculateUnifiedScore, type FilamentForScoring as UnifiedFilamentForScoring } from "@/lib/unifiedFilamentScore";
import { isSilkFilament, isMetallicFilament, isSparkleFilament, isTranslucentFilament } from "@/lib/filamentHelpers";
import { 
  tokenizeSearchQuery, 
  matchesAllTerms, 
  analyzeSearchQuery, 
  getPreFilterTerm,
  type FilamentSearchable 
} from "@/lib/multiTermSearch";

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
  
  // Loading progress state for progressive feedback
  const [loadingProgress, setLoadingProgress] = useState<{ loaded: number; total: number | null; phase: "fetching" | "processing" | "rendering" }>({
    loaded: 0,
    total: null,
    phase: "fetching",
  });
  
  // Progress callback for data fetching - memoized to prevent rerenders
  const handleLoadingProgress = useCallback<FetchProgressCallback>((progress) => {
    setLoadingProgress(progress);
  }, []);
  
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
  
  // Local UI state (not persisted)
  const [filtersOpen, setFiltersOpen] = useState(true);
  const [printerSelectorOpen, setPrinterSelectorOpen] = useState(false);
  const [moreFiltersOpen, setMoreFiltersOpen] = useState(false);
  const [colorSectionOpen, setColorSectionOpen] = useState(() => !!urlHexSearch || hexSearch !== "");
  const [colorPickerMode, setColorPickerMode] = useState<"grid" | "spectrum">("grid");
  const [spectrumHue, setSpectrumHue] = useState(0);
  const [spectrumSaturation, setSpectrumSaturation] = useState(100);
  const [spectrumLightness, setSpectrumLightness] = useState(50);
  
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
  
  // Force card view on mobile
  const effectiveViewMode = isMobile ? "grid" : viewMode;

  const MAX_PRICE_LIMIT = 100;
  
  // Pagination state - restore from session on back navigation
  const ITEMS_PER_PAGE = 16;
  const [displayCount, setDisplayCount] = useState(() => 
    restorePaginationState(ITEMS_PER_PAGE)
  );
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
  
  // Persist viewMode to localStorage
  useEffect(() => {
    localStorage.setItem("finderViewMode", viewMode);
  }, [viewMode]);
  
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
  
  // Reset display count when filters change
  useEffect(() => {
    setDisplayCount(ITEMS_PER_PAGE);
  }, [searchTerm, selectedMaterials, selectedBrands, priceRange, sortBy, hexSearch, selectedColorFamilies, highSpeed, matte, silk, metallic, sparkle, translucent, carbonFiber, glassFiber, woodFilled, glow, brassOnly, amsOnly]);
  
  // Save pagination state for scroll restoration
  useEffect(() => {
    savePaginationState(displayCount);
  }, [displayCount, savePaginationState]);
  
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
  
  // Track region transitions for smooth UI updates
  const [previousRegion, setPreviousRegion] = useState<string | null>(null);
  const [isRegionTransitioning, setIsRegionTransitioning] = useState(false);

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

  // Fetch true filament counts per brand (matching Sync Manager logic exactly)
  const { data: brandFilamentCounts } = useQuery({
    queryKey: ["brand-filament-counts", brandNameMap],
    queryFn: async () => {
      // Get all brand names we care about
      const brandNames = Object.values(brandNameMap);
      if (brandNames.length === 0) return {};
      
      // Fetch counts for each brand using the same logic as Sync Manager
      const counts: Record<string, number> = {};
      
      for (const brandName of brandNames) {
        const { count, error } = await supabase
          .from("filaments")
          .select("*", { count: "exact", head: true })
          .ilike("vendor", brandName);
        
        if (!error && count !== null) {
          counts[brandName] = count;
        }
      }
      
      return counts;
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
    enabled: Object.keys(brandNameMap).length > 0,
  });

  const { data: filaments, isLoading, isFetching, isPlaceholderData } = useQuery({
    queryKey: ["filaments", currentRegion, searchTerm, selectedMaterials, selectedVariants, brassOnly, amsOnly, selectedBrands, materials, brandNameMap, carbonFiber, glassFiber, woodFilled],
    enabled: !!materials && !!brandsData, // Wait for materials and brands to load first
    // Keep showing previous data while new region data loads - prevents "0 MATERIALS" flash
    placeholderData: keepPreviousData,
    queryFn: async () => {
      // Build the query function that will be called for each page
      const buildQuery = () => {
        let query = supabase.from("filaments").select("*");

        // Filter 1: Exclude non-filament products (null material = not a filament)
        query = query.not("material", "is", null);

        // Filter 2: Exclude sample/small spools (< 300g) but allow null weights
        query = query.or("net_weight_g.is.null,net_weight_g.gte.300");

        // Check if search term is a color name - if so, skip text search (will filter by color later)
        const isColorSearch = searchTerm ? extractColorFromText(searchTerm) : null;
        
        // Multi-term search: Use the most specific (longest) term for database pre-filtering
        // Client-side filtering will handle matching ALL terms across fields
        if (searchTerm && !isColorSearch) {
          const terms = tokenizeSearchQuery(searchTerm);
          const preFilterTerm = getPreFilterTerm(terms);
          
          if (preFilterTerm) {
            // Pre-filter in database with the most specific term across all searchable fields
            query = query.or(
              `product_title.ilike.%${preFilterTerm}%,` +
              `vendor.ilike.%${preFilterTerm}%,` +
              `material.ilike.%${preFilterTerm}%,` +
              `finish_type.ilike.%${preFilterTerm}%`
            );
          }
        }

        if (!selectedMaterials.includes("All") && selectedMaterials.length > 0) {
          // Check if any base materials have specific variants selected
          const allRawMaterials: string[] = [];
          selectedMaterials.forEach(baseMaterial => {
            const selectedNormalizedVariants = selectedVariants[baseMaterial];
            if (selectedNormalizedVariants && selectedNormalizedVariants.length > 0) {
              // Expand normalized variants to raw material names
              selectedNormalizedVariants.forEach(normalizedVariant => {
                const rawMaterials = materials?.normalizedToRaw?.[baseMaterial]?.[normalizedVariant] || [];
                allRawMaterials.push(...rawMaterials);
              });
            }
          });
          
          // If specific variants are selected, filter by those raw material names
          // Otherwise filter by base materials
          if (allRawMaterials.length > 0) {
            const materialFilters = allRawMaterials.map(m => `material.eq.${m}`).join(",");
            query = query.or(materialFilters);
          } else {
            // Check if any selected materials are category IDs (e.g., "nylon-family")
            // If so, expand them to include all materials in that category
            const expandedMaterials: string[] = [];
            selectedMaterials.forEach(m => {
              const category = MATERIAL_CATEGORIES.find(c => c.id === m);
              if (category) {
                // It's a category ID - add all materials from this category
                expandedMaterials.push(...category.materials);
              } else {
                // It's a direct material name - add as-is
                expandedMaterials.push(m);
              }
            });
            
            // Build OR filter for all expanded materials
            if (expandedMaterials.length > 0) {
              const materialFilters = expandedMaterials.map(m => `material.eq.${m}`).join(",");
              query = query.or(materialFilters);
            }
          }
        }

        if (brassOnly) {
          query = query.eq("is_nozzle_abrasive", false);
        }

        // AMS filtering is done client-side using isAMSCompatible function

        if (selectedBrands.length > 0) {
          // Use brandNameMap to convert display names to actual vendor names for filtering
          const vendorNames = selectedBrands.map(b => brandNameMap[b] || b);
          const brandFilters = vendorNames.map(v => `vendor.eq.${v}`).join(",");
          query = query.or(brandFilters);
        }

        // Add finish_type filters for reinforced materials (moves filtering to database)
        if (carbonFiber) {
          query = query.eq("finish_type", "Carbon");
        }
        if (glassFiber) {
          query = query.eq("finish_type", "Glass Fiber");
        }
        if (woodFilled) {
          query = query.eq("finish_type", "Wood");
        }

        return query;
      };

      // Use pagination to fetch all matching filaments (bypasses 1000-row limit)
      // Pass progress callback for loading indicator
      const data = await fetchAllFilaments(buildQuery, 1000, handleLoadingProgress);
      
      // Update progress to rendering phase
      handleLoadingProgress({ loaded: data.length, total: data.length, phase: "rendering" });
      
      return data;
    },
  });

  // Apply regional filtering to filaments
  const regionalFilaments = useMemo(() => {
    if (!filaments) return undefined;
    return filterByRegion(filaments);
  }, [filaments, filterByRegion]);
  
  // Track search results when they're displayed
  const prevSearchTermRef = useRef<string>("");
  useEffect(() => {
    // Only track when we have a search term and results have loaded
    if (searchTerm && searchTerm.trim().length > 0 && !isLoading && regionalFilaments !== undefined) {
      // Only track if search term changed (avoid duplicate tracking)
      if (prevSearchTermRef.current !== searchTerm) {
        prevSearchTermRef.current = searchTerm;
        
        // Get the active filters as strings
        const appliedFilters: string[] = [];
        if (!selectedMaterials.includes("All") && selectedMaterials.length > 0) {
          appliedFilters.push(`material:${selectedMaterials.join(",")}`);
        }
        if (selectedBrands.length > 0) {
          appliedFilters.push(`brand:${selectedBrands.join(",")}`);
        }
        if (priceRange[0] > 0 || priceRange[1] < 100) {
          appliedFilters.push(`price:${priceRange[0]}-${priceRange[1]}`);
        }
        
        // Calculate result count
        const resultCount = regionalFilaments?.length || 0;
        
        trackSearch({
          query: searchTerm,
          result_count: resultCount,
          has_results: resultCount > 0,
          filters_applied: appliedFilters,
        });
      }
    }
  }, [searchTerm, isLoading, regionalFilaments, selectedMaterials, selectedBrands, priceRange, trackSearch]);

  // Track region changes for smooth transitions
  useEffect(() => {
    if (previousRegion !== null && previousRegion !== currentRegion) {
      // Region changed - start transition
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
  const { data: filamentCount } = useQuery({
    queryKey: ["filamentCount"],
    queryFn: async () => {
      const { count, error } = await supabase
        .from("filaments")
        .select("*", { count: "exact", head: true });
      
      if (error) throw error;
      return count || 0;
    },
  });

  const toggleMaterial = (material: string) => {
    if (material === "All") {
      setSelectedMaterials(["All"]);
      setSelectedVariants({});
    } else {
      const newMaterials = selectedMaterials.includes("All") 
        ? [material]
        : selectedMaterials.includes(material)
          ? selectedMaterials.filter(m => m !== material)
          : [...selectedMaterials, material];
      
      // Clear variants for deselected materials
      if (!newMaterials.includes(material)) {
        const newVariants = { ...selectedVariants };
        delete newVariants[material];
        setSelectedVariants(newVariants);
      }
      
      setSelectedMaterials(newMaterials.length === 0 ? ["All"] : newMaterials);
    }
  };

  const toggleVariant = (baseMaterial: string, variant: string) => {
    const currentVariants = selectedVariants[baseMaterial] || [];
    const newVariants = currentVariants.includes(variant)
      ? currentVariants.filter(v => v !== variant)
      : [...currentVariants, variant];
    
    setSelectedVariants({
      ...selectedVariants,
      [baseMaterial]: newVariants
    });
  };

  // Compare functions removed - now using global useCompare context

  const getScoreColor = (score: number) => {
    if (score >= 8) return "text-green-400";
    if (score >= 6) return "text-cyan-400";
    return "text-orange-400";
  };

  // Helper to check if filament is a wood filament
  const isWoodFilament = (filament: any): boolean => {
    const material = filament.material?.toLowerCase() || '';
    const title = filament.product_title?.toLowerCase() || '';
    const hasWoodContent = filament.wood_powder_percentage !== null && filament.wood_powder_percentage !== undefined && filament.wood_powder_percentage > 0;
    const finishType = filament.finish_type?.toLowerCase() || '';
    if (finishType === 'wood') return true;
    // Exclude color names that contain "wood"
    if (/hollywood|rosewood|driftwood|deadwood|cherrywood/i.test(title)) return false;
    return hasWoodContent || /\bwood\b|timber|bamboo/i.test(title) || /\bwood\b|cork/i.test(material);
  };

  // Get wood percentage for display
  const getWoodPercentage = (filament: any): number | null => {
    return filament.wood_powder_percentage ?? null;
  };

  // Helper to check if filament is a glass fiber filament
  const isGlassFiberFilament = (filament: any): boolean => {
    const material = filament.material?.toLowerCase() || '';
    const title = filament.product_title?.toLowerCase() || '';
    const hasGFContent = filament.glass_fiber_percentage !== null && filament.glass_fiber_percentage !== undefined && filament.glass_fiber_percentage > 0;
    const finishType = filament.finish_type?.toLowerCase() || '';
    
    // Check finish_type variations
    if (finishType.includes('glass') || finishType.includes('gf')) return true;
    
    return hasGFContent || /glass\s*fiber|glass-fiber|-gf\b|\+gf\b|gf\s*\d|fiberglass/i.test(title) || /glass\s*fiber|-gf\b|\+gf\b/i.test(material);
  };

  // Get glass fiber percentage for display
  const getGlassFiberPercentage = (filament: any): number | null => {
    return filament.glass_fiber_percentage ?? null;
  };

  // Helper to check if filament is a carbon fiber filament
  const isCarbonFiberFilament = (filament: any): boolean => {
    // Primary: check normalized finish_type
    if (filament.finish_type === 'Carbon') return true;
    
    // Secondary: check carbon_fiber_percentage
    if (filament.carbon_fiber_percentage && filament.carbon_fiber_percentage > 0) return true;
    
    // Fallback: pattern match for any missed cases (but avoid Polycarbonate false positives)
    const text = ((filament.product_title || '') + ' ' + (filament.material || '')).toLowerCase();
    const hasPolycarbonate = /polycarbonate/i.test(text) && !/carbon\s*fiber/i.test(text);
    if (hasPolycarbonate) return false;
    
    return /-cf\b|\+cf\b|\bcf\d+|carbon\s*fiber/i.test(text);
  };

  // Get carbon fiber percentage for display
  const getCarbonFiberPercentage = (filament: any): number | null => {
    return filament.carbon_fiber_percentage ?? null;
  };

  // Helper to strip vendor name from product title
  const getDisplayTitle = (filament: any): string => {
    const title = filament.product_title || '';
    const vendor = filament.vendor || '';
    if (vendor && title.toLowerCase().startsWith(vendor.toLowerCase())) {
      return title.slice(vendor.length).trim();
    }
    return title;
  };

  // Calculate filter counts based on currently applied filters (excluding the filter being counted)
  const filterCounts = useMemo(() => {
    if (!regionalFilaments) return {};

    const counts: Record<string, number> = {};

    // Apply base filters (search, price, compatibility, brand) to get filtered set
    const baseFiltered = regionalFilaments.filter(f => {
      // Apply search filter
      if (searchTerm && f.product_title && f.vendor) {
        const searchLower = searchTerm.toLowerCase();
        if (!f.product_title.toLowerCase().includes(searchLower) && 
            !f.vendor.toLowerCase().includes(searchLower)) {
          return false;
        }
      }
      
      // Apply price filter - variant_price is already per-kg
      if (maxPrice && f.variant_price) {
        if (f.variant_price > parseFloat(maxPrice)) return false;
      }
      
      return true;
    });

    // Count by material (excluding material filter itself to show total available)
    baseFiltered.forEach(f => {
      const material = f.material;
      if (material) {
        // Count by base material
        const baseMaterial = material.split(' ')[0];
        counts[`material_${baseMaterial}`] = (counts[`material_${baseMaterial}`] || 0) + 1;
        
        // Count by full material name (for variants)
        counts[`material_${material}`] = (counts[`material_${material}`] || 0) + 1;
      }
      
      // Count by pack quantity
      const packQty = f.pack_quantity || 1;
      if (packQty === 1) {
        counts['pack_single'] = (counts['pack_single'] || 0) + 1;
      } else {
        counts['pack_multi'] = (counts['pack_multi'] || 0) + 1;
      }
      
      // Count large spools (>1kg)
      const weightG = f.net_weight_g || 1000;
      if (weightG > 1000) {
        counts['large_spools'] = (counts['large_spools'] || 0) + 1;
      }
      
      // Count advanced filters (surface finish, reinforced, performance)
      const finishType = f.finish_type?.toLowerCase() || '';
      const titleLower = f.product_title?.toLowerCase() || '';
      const materialLower = f.material?.toLowerCase() || '';
      
      // Surface Finish counts
      if (finishType === 'matte' || titleLower.includes('matte')) {
        counts['matte'] = (counts['matte'] || 0) + 1;
      }
      if (finishType === 'silk' || finishType.includes('shimmer') || titleLower.includes('silk') || titleLower.includes('shimmer')) {
        counts['silk'] = (counts['silk'] || 0) + 1;
      }
      if (finishType === 'metallic' || finishType.includes('metal') || titleLower.includes('metallic')) {
        counts['metallic'] = (counts['metallic'] || 0) + 1;
      }
      if (finishType === 'sparkle' || finishType.includes('glitter') || finishType.includes('galaxy') || 
          titleLower.includes('sparkle') || titleLower.includes('glitter') || titleLower.includes('galaxy')) {
        counts['sparkle'] = (counts['sparkle'] || 0) + 1;
      }
      if (finishType === 'translucent' || finishType.includes('transparent') || finishType.includes('clear') ||
          titleLower.includes('translucent') || titleLower.includes('transparent')) {
        counts['translucent'] = (counts['translucent'] || 0) + 1;
      }
      if (finishType === 'glow' || materialLower.includes('glow') || titleLower.includes('glow')) {
        counts['glow'] = (counts['glow'] || 0) + 1;
      }
      
      // Reinforced Materials counts
      if (isCarbonFiberFilament(f)) {
        counts['carbonFiber'] = (counts['carbonFiber'] || 0) + 1;
      }
      if (isGlassFiberFilament(f)) {
        counts['glassFiber'] = (counts['glassFiber'] || 0) + 1;
      }
      if (isWoodFilament(f)) {
        counts['woodFilled'] = (counts['woodFilled'] || 0) + 1;
      }
      
      // Performance counts
      if (f.high_speed_capable || /high[\s-]?speed|highspeed|-hs\b|hs-|\brapid\b/i.test(titleLower + ' ' + materialLower)) {
        counts['highSpeed'] = (counts['highSpeed'] || 0) + 1;
      }
      if (f.is_nozzle_abrasive === false) {
        counts['brassOnly'] = (counts['brassOnly'] || 0) + 1;
      }
      if (isAMSCompatible(f)) {
        counts['amsOnly'] = (counts['amsOnly'] || 0) + 1;
      }
    });

    // Count by brand (apply all filters except brand)
    const forBrandCount = baseFiltered.filter(f => {
      // Apply material filters
      if (!selectedMaterials.includes("All") && selectedMaterials.length > 0) {
        const allRawMaterials: string[] = [];
        selectedMaterials.forEach(baseMaterial => {
          const selectedNormalizedVariants = selectedVariants[baseMaterial];
          if (selectedNormalizedVariants && selectedNormalizedVariants.length > 0) {
            selectedNormalizedVariants.forEach(normalizedVariant => {
              const rawMaterials = materials?.normalizedToRaw?.[baseMaterial]?.[normalizedVariant] || [];
              allRawMaterials.push(...rawMaterials);
            });
          }
        });
        
        if (allRawMaterials.length > 0) {
          if (!allRawMaterials.includes(f.material || '')) return false;
        } else {
          const matchesMaterial = selectedMaterials.some(m => f.material?.includes(m));
          if (!matchesMaterial) return false;
        }
      }
      
      // Apply compatibility filters
      if (brassOnly && f.is_nozzle_abrasive !== false) return false;
      if (amsOnly && !isAMSCompatible(f)) return false;
      
      return true;
    });
    
    forBrandCount.forEach(f => {
      if (f.vendor) {
        counts[`brand_${f.vendor}`] = (counts[`brand_${f.vendor}`] || 0) + 1;
      }
    });

    // Count compatibility options (apply all filters except the compatibility filter being counted)
    const forCompatCount = baseFiltered.filter(f => {
      // Apply material filters
      if (!selectedMaterials.includes("All") && selectedMaterials.length > 0) {
        const allRawMaterials: string[] = [];
        selectedMaterials.forEach(baseMaterial => {
          const selectedNormalizedVariants = selectedVariants[baseMaterial];
          if (selectedNormalizedVariants && selectedNormalizedVariants.length > 0) {
            selectedNormalizedVariants.forEach(normalizedVariant => {
              const rawMaterials = materials?.normalizedToRaw?.[baseMaterial]?.[normalizedVariant] || [];
              allRawMaterials.push(...rawMaterials);
            });
          }
        });
        
        if (allRawMaterials.length > 0) {
          if (!allRawMaterials.includes(f.material || '')) return false;
        } else {
          const matchesMaterial = selectedMaterials.some(m => f.material?.includes(m));
          if (!matchesMaterial) return false;
        }
      }
      
      // Apply brand filter
      if (selectedBrands.length > 0 && !selectedBrands.includes(f.vendor || '')) return false;
      
      return true;
    });
    
    forCompatCount.forEach(f => {
      if (f.is_nozzle_abrasive === false) {
        counts['brass_safe'] = (counts['brass_safe'] || 0) + 1;
      }
      if (isAMSCompatible(f)) {
        counts['ams_fit'] = (counts['ams_fit'] || 0) + 1;
      }
    });

    return counts;
  }, [regionalFilaments, searchTerm, maxPrice, selectedMaterials, selectedVariants, brassOnly, amsOnly, selectedBrands, materials]);

  // Helper function to get count for a material (checks both base and variants)
  const getMaterialCount = (baseMaterial: string) => {
    if (!materials || !regionalFilaments) return 0;
    
    // Check if this material has variants
    const variants = materials.variantsByBase?.[baseMaterial] || [];
    const normalizedToRaw = materials.normalizedToRaw?.[baseMaterial] || {};
    
    let count = 0;
    
    // If it has variants, count all raw materials under this base
    if (variants.length > 0) {
      Object.values(normalizedToRaw).forEach(rawMaterials => {
        rawMaterials.forEach(rawMaterial => {
          count += filterCounts[`material_${rawMaterial}`] || 0;
        });
      });
    } else {
      // Otherwise count materials that match the base
      count = regionalFilaments.filter(f => f.material?.includes(baseMaterial)).length;
    }
    
    return count;
  };

  // Helper function to get count for a specific variant
  const getVariantCount = (baseMaterial: string, variant: string) => {
    if (!materials || !regionalFilaments) return 0;
    
    const rawMaterials = materials.normalizedToRaw?.[baseMaterial]?.[variant] || [];
    return rawMaterials.reduce((sum, rawMaterial) => {
      return sum + (filterCounts[`material_${rawMaterial}`] || 0);
    }, 0);
  };

  // Create scoring context from the full dataset for relative scoring
  const scoringContext = useMemo(() => {
    if (!regionalFilaments || regionalFilaments.length === 0) return null;
    return createScoringContext(regionalFilaments as FilamentForScoring[]);
  }, [regionalFilaments]);

  const filteredAndSortedFilaments = useMemo(() => regionalFilaments?.filter(f => {
    // Apply price range filter
    if (f.variant_price) {
      if (f.variant_price < priceRange[0] || f.variant_price > priceRange[1]) return false;
    }
    
    // Apply AMS filter client-side (since it's calculated dynamically)
    if (amsOnly && !isAMSCompatible(f)) return false;
    
    // Apply high speed filter
    if (highSpeed && !f.high_speed_capable) return false;
    
    // Apply matte filter
    if (matte && f.finish_type?.toLowerCase() !== 'matte') return false;
    
    // Apply carbon fiber filter
    if (carbonFiber && !isCarbonFiberFilament(f)) return false;
    
    // Apply glass fiber filter
    if (glassFiber && !isGlassFiberFilament(f)) return false;
    
    // Apply wood filled filter
    if (woodFilled && !isWoodFilament(f)) return false;
    
    // Apply glow filter
    if (glow && !f.material?.toLowerCase().includes('glow') && !f.product_title?.toLowerCase().includes('glow')) return false;
    
    // Apply silk filter
    if (silk && !isSilkFilament(f)) return false;
    
    // Apply metallic filter  
    if (metallic && !isMetallicFilament(f)) return false;
    
    // Apply sparkle filter
    if (sparkle && !isSparkleFilament(f)) return false;
    
    // Apply translucent filter
    if (translucent && !isTranslucentFilament(f)) return false;
    
    // Apply large spools filter (1kg+)
    if (largeSpools && (!f.net_weight_g || f.net_weight_g < 1000)) return false;
    
    // Apply color family filter (OR logic - match any selected family)
    if (selectedColorFamilies.length > 0) {
      // Find which color families this filament's color_hex matches
      if (!f.color_hex) return false;
      
      const matchesAnyFamily = selectedColorFamilies.some(familyName => {
        const familyDef = COLOR_FAMILIES.find(cf => cf.name === familyName);
        if (!familyDef || familyDef.name === 'Multi' || familyDef.name === 'Glow') {
          // For Multi/Glow, check product_title or material for keywords
          if (familyDef?.name === 'Multi') {
            const title = f.product_title?.toLowerCase() || '';
            const mat = f.material?.toLowerCase() || '';
            return familyDef.families.some(kw => title.includes(kw.toLowerCase()) || mat.includes(kw.toLowerCase()));
          }
          if (familyDef?.name === 'Glow') {
            const title = f.product_title?.toLowerCase() || '';
            const mat = f.material?.toLowerCase() || '';
            return familyDef.families.some(kw => title.includes(kw.toLowerCase()) || mat.includes(kw.toLowerCase()));
          }
          return false;
        }
        // Calculate color distance to the family's representative hex
        const distance = colorDistance(familyDef.hex, f.color_hex!);
        return distance <= 45; // More generous tolerance for family matching
      });
      
      if (!matchesAnyFamily) return false;
    }
    
    // Apply hex-based color search (precise matching)
    if (hexSearch) {
      if (!f.color_hex) return false;
      const distance = colorDistance(hexSearch, f.color_hex);
      if (distance > colorTolerance) return false;
    }
    
    // Apply multi-term search filter client-side
    // This ensures ALL search terms match across ANY combination of fields
    if (searchTerm && searchTerm.trim().length > 0) {
      const colorFromSearchCheck = extractColorFromText(searchTerm);
      
      // Skip text matching if this is a pure color search
      if (!colorFromSearchCheck) {
        const terms = tokenizeSearchQuery(searchTerm);
        
        if (terms.length > 0) {
          // Use multi-term matching: ALL terms must match across ANY fields
          if (!matchesAllTerms(f as FilamentSearchable, terms)) {
            return false;
          }
        }
      }
    }
    
    // Apply intelligent color name search (e.g., "orange" finds filaments with orange-like hex colors)
    const colorFromSearch = searchTerm ? extractColorFromText(searchTerm) : null;
    if (colorFromSearch && !hexSearch) {
      const filamentHex = f.color_hex;
      if (!filamentHex) return false;
      const distance = colorDistance(colorFromSearch.hex, filamentHex);
      // Use a more generous tolerance for color name searches (50 delta)
      if (distance > 60) return false;
    }
    
    return true;
  }).sort((a, b) => {
    // Calculate true per-kg price in user's currency
    // Uses the same regional price resolution as FilamentCard for consistency
    const getPricePerKg = (filament: typeof a) => {
      if (!filament.net_weight_g) return 999999;
      
      const packQty = (filament as any).pack_quantity || 1;
      const weightKg = filament.net_weight_g / 1000;
      
      // Map currency to database column (same as useRegionalPrice)
      const currencyToPriceColumn: Record<string, keyof typeof filament> = {
        USD: 'variant_price',
        CAD: 'price_cad',
        GBP: 'price_gbp',
        EUR: 'price_eur',
        AUD: 'price_aud',
        JPY: 'price_jpy',
      };
      
      // Get the regional price column for user's currency
      const priceColumn = currencyToPriceColumn[currencyInfo.code] || 'variant_price';
      const regionalPrice = filament[priceColumn] as number | null;
      
      // Priority 1: Use actual regional price if available
      if (regionalPrice && regionalPrice > 0) {
        return regionalPrice / (weightKg * packQty);
      }
      
      // Priority 2: Convert from variant_price (USD) to user's currency
      const basePrice = filament.variant_price;
      if (!basePrice) return 999999;
      
      const convertedPrice = convertPrice(basePrice) || basePrice;
      return convertedPrice / (weightKg * packQty);
    };

    // Use the unified score for consistent sorting with card display
    const getScore = (filament: typeof a) => {
      const { score } = calculateUnifiedScore(filament as UnifiedFilamentForScoring);
      return score ?? 0; // Treat null/unrated as 0 for sorting
    };

    // Check if product is in stock - consider it in stock if variant_available is true
    // or if it has a price (meaning it's available somewhere)
    const isInStock = (filament: typeof a): boolean => {
      // Explicit variant_available flag
      if (filament.variant_available === true) return true;
      if (filament.variant_available === false) return false;
      // Fallback: if no explicit flag, assume in stock if there's a price
      return (filament.variant_price ?? 0) > 0;
    };

    // Primary sort: in-stock items first (for score-based sorting)
    const stockCompare = (stockA: boolean, stockB: boolean): number => {
      if (stockA === stockB) return 0;
      return stockB ? 1 : -1; // in-stock (true) comes first
    };

    switch (sortBy) {
      case "scoring-asc": {
        const stockDiff = stockCompare(isInStock(a), isInStock(b));
        if (stockDiff !== 0) return -stockDiff; // Reverse for ascending
        return getScore(a) - getScore(b);
      }
      case "scoring-desc": {
        const stockDiff = stockCompare(isInStock(a), isInStock(b));
        if (stockDiff !== 0) return stockDiff;
        const scoreA = getScore(a);
        const scoreB = getScore(b);
        if (scoreB !== scoreA) return scoreB - scoreA;
        // Secondary sort by price (lower first) for products with same score
        return getPricePerKg(a) - getPricePerKg(b);
      }
      case "alpha-asc":
        return (a.product_title || '').localeCompare(b.product_title || '');
      case "alpha-desc":
        return (b.product_title || '').localeCompare(a.product_title || '');
      case "price-asc":
        return getPricePerKg(a) - getPricePerKg(b);
      case "price-desc":
        return getPricePerKg(b) - getPricePerKg(a);
      case "strength-desc":
        return (b.strength_index || 0) - (a.strength_index || 0);
      case "heat-desc":
        return (b.tg_c || b.nozzle_temp_max_c || 0) - (a.tg_c || a.nozzle_temp_max_c || 0);
      case "print-desc":
        return (b.printability_index || 0) - (a.printability_index || 0);
      default: {
        const stockDiff = stockCompare(isInStock(a), isInStock(b));
        if (stockDiff !== 0) return stockDiff;
        return getScore(b) - getScore(a);
      }
    }
  }), [regionalFilaments, scoringContext, priceRange, amsOnly, highSpeed, matte, carbonFiber, glassFiber, woodFilled, glow, silk, metallic, sparkle, translucent, largeSpools, selectedColorFamilies, hexSearch, colorTolerance, searchTerm, sortBy, currencyInfo.code, convertPrice]);

  // Group filaments by product before pagination
  const groupedFilaments = useMemo(() => {
    if (!filteredAndSortedFilaments) return [];
    return groupFilamentsByProduct(filteredAndSortedFilaments);
  }, [filteredAndSortedFilaments]);

  // Pagination: slice the grouped results
  const displayedGroups = groupedFilaments.slice(0, displayCount);
  const totalCount = groupedFilaments.length;
  const hasMore = displayCount < totalCount;

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
      selectedColorFamilies.length > 0 ||
      hexSearch !== "" ||
      hasColorSearch
    );
  }, [searchTerm, selectedMaterials, selectedBrands, priceRange, highSpeed, matte, silk, metallic, sparkle, translucent, carbonFiber, glassFiber, woodFilled, glow, brassOnly, amsOnly, selectedColorFamilies, hexSearch]);

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
      {/* JSON-LD Structured Data for Homepage */}
      <WebSiteSchema />
      <OrganizationSchema />
      {/* Onboarding Tour */}
      <OnboardingTour />
      
      {/* Hero Section */}
      <HeroSection 
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        filamentCount={filamentCount || 0}
        brandCount={brands?.length || 23}
        compatibleCount={totalCount}
        isLoading={isLoading || filamentCount === undefined}
      />

      {/* Welcome Banner for New Visitors */}
      <div className="max-w-7xl mx-auto px-4 py-4">
        <WelcomeBanner />
      </div>

      {/* Visual Section Separator */}
      <SectionSeparator />

      {/* Results Header with Context */}
      <ResultsHeader
        count={totalCount}
        selectedPrinter={selectedPrinter}
        hasActiveFilters={hasActiveFilters}
        onClearFilters={handleClearAllFilters}
        isUpdating={isRegionTransitioning || (isFetching && isPlaceholderData)}
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
          (largeSpools ? 1 : 0)
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
                const newMaterials = selectedMaterials.includes("All") ? [material] : [...selectedMaterials, material];
                setSelectedMaterials(newMaterials);
              } else {
                setSelectedMaterials(selectedMaterials.filter(m => m !== material));
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
              setSelectedMaterials([]);
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
          ...selectedMaterials.map(m => ({ id: m, label: m.replace('-family', '').toUpperCase(), type: 'material' as const })),
          ...selectedBrands.map(b => ({ id: b, label: b, type: 'brand' as const })),
          ...(carbonFiber ? [{ id: 'carbon', label: 'Carbon Fiber', type: 'reinforced' as const }] : []),
          ...(glassFiber ? [{ id: 'glass', label: 'Glass Fiber', type: 'reinforced' as const }] : []),
          ...(woodFilled ? [{ id: 'wood', label: 'Wood Filled', type: 'reinforced' as const }] : []),
          ...(largeSpools ? [{ id: 'large', label: 'Large Spool', type: 'spool' as const }] : []),
        ]}
        onRemove={(id, type) => {
          if (type === 'material') setSelectedMaterials(selectedMaterials.filter(m => m !== id));
          if (type === 'brand') setSelectedBrands(selectedBrands.filter(b => b !== id));
          if (type === 'reinforced') {
            if (id === 'carbon') setCarbonFiber(false);
            if (id === 'glass') setGlassFiber(false);
            if (id === 'wood') setWoodFilled(false);
          }
          if (type === 'spool') setLargeSpools(false);
        }}
        onClearAll={() => {
          setSelectedMaterials([]);
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
      <div id="system-config" className="flex gap-8 max-w-[1600px] mx-auto px-4 lg:px-8 py-6 lg:py-10 items-start">
        {/* Technical Console Sidebar - Desktop only */}
        <TechnicalConsoleSidebar
          selectedMaterials={selectedMaterials}
          onMaterialChange={(material, checked) => {
            if (checked) {
              const newMaterials = selectedMaterials.includes("All") ? [material] : [...selectedMaterials, material];
              setSelectedMaterials(newMaterials);
            } else {
              setSelectedMaterials(selectedMaterials.filter(m => m !== material));
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
        />

        {/* Main Content */}
        <div className="flex-1 min-w-0">
          <section className="w-full" role="region" aria-label="Filament product listings">

        {/* Region Transition Indicator - shows when prices are updating */}
        <RegionTransitionIndicator 
          isTransitioning={isRegionTransitioning || (isFetching && isPlaceholderData)}
          newRegionName={regionConfig.name}
        />

        {/* Results count and View Mode Toggle */}
        <div className="flex items-center justify-between mb-3">
          <p className="text-sm text-muted-foreground">
            {/* Only show skeleton on initial load, not during region transitions */}
            {isLoading && !isPlaceholderData ? (
              <span className="inline-block w-20 h-4 bg-muted/30 rounded animate-pulse align-middle" />
            ) : (
              <>
                {totalCount} products{filteredAndSortedFilaments && filteredAndSortedFilaments.length !== totalCount 
                  ? ` (${filteredAndSortedFilaments.length} variants)` 
                  : ''}
              </>
            )}
          </p>
          <div className="flex items-center gap-3">
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
            <FilamentCardSkeletonGrid count={8} />
            {/* Progress indicator overlay */}
            <LoadingProgress
              loaded={loadingProgress.loaded}
              total={loadingProgress.total}
              phase={loadingProgress.phase}
              className="!py-4"
            />
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
                    variantIndicators={group.variants.length > 1 ? {
                      colors: Array.from(group.colors),
                      weights: Array.from(group.weights).sort((a, b) => a - b),
                      variantCount: group.variants.length,
                      priceRange: group.priceRange,
                      anyInStock: group.anyInStock,
                    } : undefined}
                  />
                );
              })}
            </div>
          )}
          
          {/* Load More Button */}
          {hasMore && (
            <div className="flex flex-col items-center gap-3 mt-10 mb-8">
              <p className="text-sm text-muted-foreground">
                Showing {displayedGroups.length} of {totalCount} products
              </p>
              <Button 
                onClick={() => setDisplayCount(prev => prev + ITEMS_PER_PAGE)}
                variant="outline"
                className="px-8 bg-gray-800 hover:bg-gray-700 border-gray-700 hover:border-primary text-white transition-all duration-200"
              >
                Load More
              </Button>
            </div>
          )}
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
    </div>
  );
};

export default Finder;
