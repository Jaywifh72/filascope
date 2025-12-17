import { useState, useMemo, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Slider } from "@/components/ui/slider";
import { MaterialBadge } from "@/components/MaterialBadge";
import { ExternalLink, ChevronDown, GitCompare, X, CheckCircle, XCircle, TreeDeciduous, Layers, Palette } from "lucide-react";
import FilamentCard from "@/components/FilamentCard";
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
import { isAMSCompatible } from "@/lib/amsCompatibility";
import { useCompare } from "@/hooks/useCompare";
import { useCompatibleCount } from "@/hooks/useCompatibleCount";
import HeroSection from "@/components/HeroSection";
import SectionSeparator from "@/components/SectionSeparator";
import ResultsHeader from "@/components/ResultsHeader";
import { FilamentFilters } from "@/components/FilamentFilters";
import { HorizontalFilterBar } from "@/components/filters/HorizontalFilterBar";
import { ActiveFilterTags, type ActiveFilter } from "@/components/filters/ActiveFilterTags";
import { MATERIAL_CATEGORIES } from "@/lib/materialHierarchy";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { MoreFiltersModal } from "@/components/filters/MoreFiltersModal";
import { ViewToggle } from "@/components/ViewToggle";
import { FilamentTableView } from "@/components/FilamentTableView";
import { useIsMobile } from "@/hooks/use-mobile";

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
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedMaterials, setSelectedMaterials] = useState<string[]>(["All"]);
  const [selectedVariants, setSelectedVariants] = useState<Record<string, string[]>>({});
  const [brassOnly, setBrassOnly] = useState(false);
  const [foodContact, setFoodContact] = useState(false);
  const [amsOnly, setAmsOnly] = useState(false);
  const [selectedBrands, setSelectedBrands] = useState<string[]>([]);
  const [maxPrice, setMaxPrice] = useState("");
  const [filtersOpen, setFiltersOpen] = useState(true);
  const [printerSelectorOpen, setPrinterSelectorOpen] = useState(false);
  const [moreFiltersOpen, setMoreFiltersOpen] = useState(false);
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
  const [sortBy, setSortBy] = useState<string>("truecost-asc");
  const [viewMode, setViewMode] = useState<"grid" | "list">(() => {
    const saved = localStorage.getItem("finderViewMode");
    return saved === "list" ? "list" : "grid";
  });
  
  // Force card view on mobile
  const effectiveViewMode = isMobile ? "grid" : viewMode;


  // New filter states
  const [highSpeed, setHighSpeed] = useState(false);
  const [matte, setMatte] = useState(false);
  const [carbonFiber, setCarbonFiber] = useState(false);
  const [glassFiber, setGlassFiber] = useState(false);
  const [woodFilled, setWoodFilled] = useState(false);
  const [glow, setGlow] = useState(false);
  const [plasticSpool, setPlasticSpool] = useState(false);
  const [cardboardSpool, setCardboardSpool] = useState(false);
  const [singleSpool, setSingleSpool] = useState(false);
  const [multiPack, setMultiPack] = useState(false);
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 100]);
  const MAX_PRICE_LIMIT = 100;
  
  // Pagination state
  const ITEMS_PER_PAGE = 16;
  const [displayCount, setDisplayCount] = useState(ITEMS_PER_PAGE);
  
  // Color filter states - initialize from URL params
  const [selectedColorFamilies, setSelectedColorFamilies] = useState<string[]>([]);
  const [hexSearch, setHexSearch] = useState(() => searchParams.get("hexSearch") || "");
  const [colorTolerance, setColorTolerance] = useState(() => {
    const urlTolerance = searchParams.get("colorTolerance");
    return urlTolerance ? parseInt(urlTolerance, 10) : 30;
  });
  const [colorSectionOpen, setColorSectionOpen] = useState(() => !!searchParams.get("hexSearch"));
  const [colorPickerMode, setColorPickerMode] = useState<"grid" | "spectrum">("grid");
  const [spectrumHue, setSpectrumHue] = useState(0);
  const [spectrumSaturation, setSpectrumSaturation] = useState(100);
  const [spectrumLightness, setSpectrumLightness] = useState(50);
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
  
  // Reset display count when filters change
  useEffect(() => {
    setDisplayCount(ITEMS_PER_PAGE);
  }, [searchTerm, selectedMaterials, selectedBrands, priceRange, sortBy, hexSearch, selectedColorFamilies, highSpeed, matte, carbonFiber, glassFiber, woodFilled, glow, brassOnly, foodContact, amsOnly]);
  
  // Printer selection hook
  const { selectedPrinter } = usePrinterSelection();
  
  // Compatible count context - update navbar badge
  const { setCount: setCompatibleCount } = useCompatibleCount();
  
  // Affiliate links hook
  const { getAffiliateUrl } = useAffiliateLinks();
  
  // Currency hook
  const { formatPrice, currencyInfo, convertPrice } = useCurrency();

  // Normalize variant names to group similar variants
  const normalizeVariantName = (material: string, base: string): string => {
    const variantPatterns: Record<string, Record<string, string[]>> = {
      PLA: {
        "+": ["PLA+"],
        "Carbon Fiber": ["PLA Carbon Fiber", "PLA CF", "PLA-CF", "PLA CF03"],
        "Glow": ["Glow PLA", "PLA Glow", "PLA Glow in Dark", "PLA-Luminous"],
        "Silk": ["Silk PLA", "PLA Silk", "PLA-Silk", "Silky PLA", "Silk PLA+"],
        "Marble": ["Marble PLA", "PLA Marble", "PLA-Marble"],
        "Matte": ["Matte PLA", "PLA Matte", "PLA-Matte"],
        "Metallic": ["Metallic PLA", "PLA Metal", "PLA-Metal"],
        "Wood": ["PLA Wood", "Wood PLA", "PLA-Wood", "PLA Wood Composite"],
        "Lightweight": ["LW-PLA", "PLA Lightweight", "LW-PLA-HT"],
        "Crystal": ["PLA Crystal", "PLA Crystal Clear"],
        "Bronze": ["PLA Bronze Composite"],
        "Copper": ["PLA Copper Composite"],
        "Cork": ["PLA Cork Composite"],
        "Steel": ["PLA Steel Composite"],
        "Stone": ["PLA Stone Composite"],
      },
      PETG: {
        "Carbon Fiber": ["PETG-CF", "PETG Carbon Fiber", "PETG CF"],
        "Wood": ["PETG Wood", "PETG-Wood"],
        "Silk": ["PETG Silk", "Silk PETG", "PETG-Silk"],
        "Matte": ["PETG Matte", "Matte PETG", "PETG-Matte"],
        "Pro": ["PETG Pro"],
        "HF": ["PETG HF"],
      },
      ABS: {
        "+": ["ABS+"],
      },
      ASA: {
        "+": ["ASA+"],
      },
      TPU: {
        "95A": ["TPU 95A", "TPU-95A", "TPU95A"],
        "85A": ["TPU 85A", "TPU-85A", "TPU85A"],
        "98A": ["TPU 98A", "TPU-98A", "TPU98A"],
        "60D": ["TPU 60D", "TPU-60D", "TPU60D"],
        "Flex": ["TPU Flex", "TPU-Flex"],
      },
      Nylon: {
        "NylonG": ["NylonG"],
        "NylonX": ["NylonX"],
      },
      PC: {
        "Blend Carbon Fiber": ["PC Blend Carbon Fiber"],
        "Blend": ["PC Blend"],
        "Carbon Fiber": ["PC CF"],
        "FR": ["PC FR"],
        "Pro": ["PC Pro"],
        "Space Grade": ["PC Space Grade"],
        "PBT": ["PC-PBT"],
        "TPE": ["PCTPE"],
      },
      "Co-Polyester": {
        "CF": ["Co-Polyester CF"],
        "HT": ["HT"],
        "XT": ["XT"],
        "nGen": ["nGen"],
        "nGen Flex": ["nGen_FLEX"],
      },
      "Co-Polymer": {
        "PE": ["PE Co-Polymer"],
      },
      PA: {
        "CF": ["PA-CF"],
        "11 Carbon Fiber": ["PA11 Carbon Fiber"],
        "12-CF": ["PA12-CF"],
        "6-CF": ["PA6-CF"],
        "6-GF": ["PA6-GF"],
      },
      CPE: {
        "+": ["CPE+"],
        "HG100": ["CPE HG100"],
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
      PP: {
        "CF": ["PP-CF", "PP Carbon Fiber"],
        "GF": ["PP-GF", "PP Glass Fiber"],
      },
      Support: {
        "Material": ["Support material"],
      },
      PEBA: {
        "90A": ["PEBA-90A", "PEBA 90A"],
      }
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
      const baseStandards = ['PLA', 'PETG', 'ABS', 'ASA', 'TPU', 'Nylon', 'PC', 'Co-Polyester', 'PA', 'CPE', 'PET', 'PEEK', 'PP', 'Support', 'PEBA', 'Co-Polymer'];
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

  const { data: filaments, isLoading } = useQuery({
    queryKey: ["filaments", searchTerm, selectedMaterials, selectedVariants, brassOnly, foodContact, amsOnly, selectedBrands, materials],
    enabled: !!materials, // Wait for materials to load first
    queryFn: async () => {
      let query = supabase.from("filaments").select("*");

      if (searchTerm) {
        query = query.or(`product_title.ilike.%${searchTerm}%,vendor.ilike.%${searchTerm}%`);
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
          const materialFilters = selectedMaterials.map(m => `material.ilike.%${m}%`).join(",");
          query = query.or(materialFilters);
        }
      }

      if (brassOnly) {
        query = query.eq("is_nozzle_abrasive", false);
      }

      if (foodContact) {
        query = query.not("food_contact_rating", "is", null);
      }

      // AMS filtering is done client-side using isAMSCompatible function

      if (selectedBrands.length > 0) {
        const brandFilters = selectedBrands.map(b => `vendor.eq.${b}`).join(",");
        query = query.or(brandFilters);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
  });

  const { data: brands } = useQuery({
    queryKey: ["brands"],
    queryFn: async () => {
      // Fetch from automated_brands (primary source - all configured brands)
      const { data: automatedBrands, error: automatedError } = await supabase
        .from("automated_brands")
        .select("display_name, brand_name")
        .eq("is_visible", true)
        .order("display_name");
      
      if (automatedError) throw automatedError;
      
      // Also fetch vendors from filaments to catch any not in automated_brands
      const { data: filamentVendors, error: filamentError } = await supabase
        .from("filaments")
        .select("vendor")
        .not("vendor", "is", null);
      
      if (filamentError) throw filamentError;
      
      // Create set of automated brand names (both display_name and brand_name)
      const automatedNames = new Set(
        automatedBrands.flatMap(b => [
          b.display_name.toLowerCase(), 
          b.brand_name.toLowerCase()
        ])
      );
      
      // Get all automated brand display names
      const allBrands = automatedBrands.map(b => b.display_name);
      
      // Add any vendors from filaments that aren't in automated_brands
      const uniqueVendors = Array.from(new Set(filamentVendors.map(f => f.vendor)));
      for (const vendor of uniqueVendors) {
        if (!automatedNames.has(vendor.toLowerCase())) {
          allBrands.push(vendor);
        }
      }
      
      return allBrands.sort();
    },
  });

  // Get accurate total filament count (bypasses 1000 row limit)
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
    return hasWoodContent || material.includes('wood') || title.includes('wood') || title.includes('timber') || material.includes('cork');
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
    // Match patterns: -GF, +GF, GF+, _GF, " GF", "glass fiber", NylonG, material ending in GF
    return hasGFContent || 
      material.includes('-gf') || material.includes('+gf') || material.endsWith('gf') ||
      title.includes('+gf') || title.includes('gf+') || title.includes('-gf') ||
      title.includes('glass fiber') || title.includes('glass-fiber') ||
      material.includes('nylong');
  };

  // Get glass fiber percentage for display
  const getGlassFiberPercentage = (filament: any): number | null => {
    return filament.glass_fiber_percentage ?? null;
  };

  // Helper to check if filament is a carbon fiber filament
  const isCarbonFiberFilament = (filament: any): boolean => {
    const material = filament.material?.toLowerCase() || '';
    const title = filament.product_title?.toLowerCase() || '';
    const hasCFContent = filament.carbon_fiber_percentage !== null && filament.carbon_fiber_percentage !== undefined && filament.carbon_fiber_percentage > 0;
    // Match patterns: -CF, +CF, CF+, _CF, material ending in CF, "carbon fiber" - but exclude "Polycarbonate" (PC)
    const hasPolycarbonate = title.includes('polycarbonate');
    return hasCFContent || (!hasPolycarbonate && (
      material.includes('-cf') || material.includes('+cf') || material.endsWith('cf') ||
      title.includes('+cf') || title.includes('-cf') || title.includes('cf+') ||
      title.includes('carbon fiber') || title.includes('carbon-fiber')
    ));
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
    if (!filaments) return {};

    const counts: Record<string, number> = {};

    // Apply base filters (search, price, compatibility, brand) to get filtered set
    const baseFiltered = filaments.filter(f => {
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
      if (foodContact && !f.food_contact_rating) return false;
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
      if (f.food_contact_rating) {
        counts['food_contact'] = (counts['food_contact'] || 0) + 1;
      }
      if (isAMSCompatible(f)) {
        counts['ams_fit'] = (counts['ams_fit'] || 0) + 1;
      }
    });

    return counts;
  }, [filaments, searchTerm, maxPrice, selectedMaterials, selectedVariants, brassOnly, foodContact, amsOnly, selectedBrands, materials]);

  // Helper function to get count for a material (checks both base and variants)
  const getMaterialCount = (baseMaterial: string) => {
    if (!materials || !filaments) return 0;
    
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
      count = filaments.filter(f => f.material?.includes(baseMaterial)).length;
    }
    
    return count;
  };

  // Helper function to get count for a specific variant
  const getVariantCount = (baseMaterial: string, variant: string) => {
    if (!materials || !filaments) return 0;
    
    const rawMaterials = materials.normalizedToRaw?.[baseMaterial]?.[variant] || [];
    return rawMaterials.reduce((sum, rawMaterial) => {
      return sum + (filterCounts[`material_${rawMaterial}`] || 0);
    }, 0);
  };

  const filteredAndSortedFilaments = filaments?.filter(f => {
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
    
    // Apply spool type filters
    if (plasticSpool && !cardboardSpool && f.spool_material?.toLowerCase() !== 'plastic') return false;
    if (cardboardSpool && !plasticSpool && f.spool_material?.toLowerCase() !== 'cardboard') return false;
    
    // Apply pack quantity filters
    const packQty = f.pack_quantity || 1;
    if (singleSpool && !multiPack && packQty !== 1) return false;
    if (multiPack && !singleSpool && packQty <= 1) return false;
    
    // Apply color family filter
    if (selectedColorFamilies.length > 0) {
      const filamentColorFamily = f.color_family?.toLowerCase() || '';
      const matchesFamily = selectedColorFamilies.some(family => {
        const colorDef = COLOR_FAMILIES.find(c => c.name === family);
        if (!colorDef) return false;
        return colorDef.families.some(fam => filamentColorFamily.includes(fam.toLowerCase()));
      });
      if (!matchesFamily) return false;
    }
    
    // Apply HEX color search filter
    if (hexSearch && hexSearch.match(/^#?[0-9A-Fa-f]{6}$/)) {
      const searchHex = hexSearch.startsWith('#') ? hexSearch : `#${hexSearch}`;
      const filamentHex = f.color_hex;
      if (!filamentHex) return false;
      const distance = colorDistance(searchHex, filamentHex);
      if (distance > colorTolerance) return false;
    }
    
    return true;
  }).sort((a, b) => {
    // Calculate true per-kg price: total_price / (pack_quantity * weight_per_spool_kg)
    const getPricePerKg = (filament: typeof a) => {
      if (!filament.variant_price || !filament.net_weight_g) return 999999;
      const packQty = (filament as any).pack_quantity || 1;
      const weightKg = filament.net_weight_g / 1000;
      return filament.variant_price / (weightKg * packQty);
    };

    switch (sortBy) {
      case "truecost-asc":
        return getPricePerKg(a) - getPricePerKg(b);
      case "truecost-desc":
        return getPricePerKg(b) - getPricePerKg(a);
      case "print-desc":
        return (b.printability_index || 0) - (a.printability_index || 0);
      case "print-asc":
        return (a.printability_index || 0) - (b.printability_index || 0);
      case "strength-desc":
        return (b.strength_index || 0) - (a.strength_index || 0);
      case "strength-asc":
        return (a.strength_index || 0) - (b.strength_index || 0);
      case "heat-desc":
        return (b.tg_c || b.nozzle_temp_max_c || 0) - (a.tg_c || a.nozzle_temp_max_c || 0);
      case "heat-asc":
        return (a.tg_c || a.nozzle_temp_max_c || 0) - (b.tg_c || b.nozzle_temp_max_c || 0);
      case "score-desc":
        return (b.value_score || 0) - (a.value_score || 0);
      case "score-asc":
        return (a.value_score || 0) - (b.value_score || 0);
      case "price-asc":
        return getPricePerKg(a) - getPricePerKg(b);
      case "price-desc":
        return getPricePerKg(b) - getPricePerKg(a);
      default:
        return getPricePerKg(a) - getPricePerKg(b);
    }
  });

  // Pagination: slice the filtered results
  const displayedFilaments = filteredAndSortedFilaments?.slice(0, displayCount) || [];
  const totalCount = filteredAndSortedFilaments?.length || 0;
  const hasMore = displayCount < totalCount;

  // Check if any filters are active
  const hasActiveFilters = useMemo(() => {
    return (
      !selectedMaterials.includes("All") ||
      selectedBrands.length > 0 ||
      priceRange[0] > 0 ||
      priceRange[1] < MAX_PRICE_LIMIT ||
      highSpeed || matte || carbonFiber || glassFiber ||
      woodFilled || glow || brassOnly || foodContact || amsOnly ||
      selectedColorFamilies.length > 0 ||
      hexSearch !== "" ||
      plasticSpool || cardboardSpool || singleSpool || multiPack
    );
  }, [selectedMaterials, selectedBrands, priceRange, highSpeed, matte, carbonFiber, glassFiber, woodFilled, glow, brassOnly, foodContact, amsOnly, selectedColorFamilies, hexSearch, plasticSpool, cardboardSpool, singleSpool, multiPack]);

  // Clear all filters function
  const handleClearAllFilters = () => {
    setSelectedMaterials(["All"]);
    setSelectedBrands([]);
    setPriceRange([0, MAX_PRICE_LIMIT]);
    setHighSpeed(false);
    setMatte(false);
    setCarbonFiber(false);
    setGlassFiber(false);
    setWoodFilled(false);
    setGlow(false);
    setBrassOnly(false);
    setFoodContact(false);
    setAmsOnly(false);
    setSelectedColorFamilies([]);
    setHexSearch("");
    setPlasticSpool(false);
    setCardboardSpool(false);
    setSingleSpool(false);
    setMultiPack(false);
  };

  // Update navbar compatible count
  useEffect(() => {
    setCompatibleCount(totalCount);
  }, [totalCount, setCompatibleCount]);

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <HeroSection 
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        filamentCount={filamentCount || 1881}
        brandCount={brands?.length || 28}
        compatibleCount={totalCount}
      />

      {/* Visual Section Separator */}
      <SectionSeparator />

      {/* Results Header with Context */}
      <ResultsHeader
        count={totalCount}
        selectedPrinter={selectedPrinter}
        hasActiveFilters={hasActiveFilters}
        onClearFilters={handleClearAllFilters}
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
        selectedMaterial={selectedMaterials.includes("All") ? "All" : selectedMaterials[0] || "All"}
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
        brands={(brands || []).map(b => ({ name: b, count: filterCounts[`brand_${b}`] || 0 }))}
        selectedBrands={selectedBrands}
        onBrandsChange={setSelectedBrands}
        priceRange={priceRange}
        maxPriceLimit={MAX_PRICE_LIMIT}
        onPriceRangeChange={setPriceRange}
        onOpenMoreFilters={() => setMoreFiltersOpen(true)}
        moreFiltersCount={
          (highSpeed ? 1 : 0) +
          (matte ? 1 : 0) +
          (carbonFiber ? 1 : 0) +
          (glassFiber ? 1 : 0) +
          (woodFilled ? 1 : 0) +
          (glow ? 1 : 0) +
          (plasticSpool ? 1 : 0) +
          (cardboardSpool ? 1 : 0) +
          (singleSpool ? 1 : 0) +
          (multiPack ? 1 : 0) +
          (brassOnly ? 1 : 0) +
          (foodContact ? 1 : 0) +
          (amsOnly ? 1 : 0)
        }
        sortBy={sortBy}
        onSortChange={setSortBy}
      />

      {/* Active Filter Tags */}
      <ActiveFilterTags
        filters={[
          ...(!selectedMaterials.includes("All") ? selectedMaterials.map(m => ({ id: m, label: m, type: 'material' as const })) : []),
          ...selectedBrands.map(b => ({ id: b, label: b, type: 'brand' as const })),
          ...(priceRange[0] > 0 || priceRange[1] < MAX_PRICE_LIMIT ? [{ id: 'price', label: `$${priceRange[0]}-$${priceRange[1]}/kg`, type: 'price' as const }] : []),
          ...(highSpeed ? [{ id: 'highSpeed', label: 'High Speed', type: 'property' as const }] : []),
          ...(matte ? [{ id: 'matte', label: 'Matte Finish', type: 'property' as const }] : []),
          ...(carbonFiber ? [{ id: 'carbonFiber', label: 'Carbon Fiber', type: 'property' as const }] : []),
          ...(glassFiber ? [{ id: 'glassFiber', label: 'Glass Fiber', type: 'property' as const }] : []),
          ...(woodFilled ? [{ id: 'woodFilled', label: 'Wood Filled', type: 'property' as const }] : []),
          ...(glow ? [{ id: 'glow', label: 'Glow', type: 'property' as const }] : []),
          ...(brassOnly ? [{ id: 'brassOnly', label: 'Brass Safe', type: 'property' as const }] : []),
          ...(foodContact ? [{ id: 'foodContact', label: 'Food Safe', type: 'property' as const }] : []),
          ...(amsOnly ? [{ id: 'amsOnly', label: 'AMS Compatible', type: 'property' as const }] : []),
          ...selectedColorFamilies.map(c => ({ id: c, label: c, type: 'color' as const })),
        ]}
        onRemove={(id, type) => {
          if (type === 'material') {
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
              case 'carbonFiber': setCarbonFiber(false); break;
              case 'glassFiber': setGlassFiber(false); break;
              case 'woodFilled': setWoodFilled(false); break;
              case 'glow': setGlow(false); break;
              case 'brassOnly': setBrassOnly(false); break;
              case 'foodContact': setFoodContact(false); break;
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
          setCarbonFiber(false);
          setGlassFiber(false);
          setWoodFilled(false);
          setGlow(false);
          setBrassOnly(false);
          setFoodContact(false);
          setAmsOnly(false);
          setSelectedColorFamilies([]);
          setHexSearch("");
        }}
      />

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
        highSpeed={highSpeed}
        onHighSpeedChange={setHighSpeed}
        matte={matte}
        onMatteChange={setMatte}
        glow={glow}
        onGlowChange={setGlow}
        carbonFiber={carbonFiber}
        onCarbonFiberChange={setCarbonFiber}
        glassFiber={glassFiber}
        onGlassFiberChange={setGlassFiber}
        woodFilled={woodFilled}
        onWoodFilledChange={setWoodFilled}
        plasticSpool={plasticSpool}
        onPlasticSpoolChange={setPlasticSpool}
        cardboardSpool={cardboardSpool}
        onCardboardSpoolChange={setCardboardSpool}
        singleSpool={singleSpool}
        onSingleSpoolChange={setSingleSpool}
        multiPack={multiPack}
        onMultiPackChange={setMultiPack}
        brassOnly={brassOnly}
        onBrassOnlyChange={setBrassOnly}
        foodContact={foodContact}
        onFoodContactChange={setFoodContact}
        amsOnly={amsOnly}
        onAmsOnlyChange={setAmsOnly}
        selectedColorFamilies={selectedColorFamilies}
        onColorFamiliesChange={setSelectedColorFamilies}
      />

      {/* Main Content Area - Full Width (sidebar removed) */}
      <div className="max-w-[1400px] mx-auto px-4 lg:px-8 py-6">
        {/* Main Content */}
        <main className="w-full">

        {/* Results count and View Mode Toggle */}
        <div className="flex items-center justify-between mb-3">
          <p className="text-sm text-muted-foreground">
            {filteredAndSortedFilaments?.length || 0} filaments
          </p>
          <div className="flex items-center gap-3">
            <span className="text-xs text-muted-foreground hidden sm:inline">🇺🇸 United States</span>
            {!isMobile && (
              <ViewToggle 
                viewMode={viewMode} 
                onViewModeChange={setViewMode}
              />
            )}
          </div>
        </div>

        {/* Filaments Display */}
        {isLoading ? (
          <FilamentCardSkeletonGrid count={12} />
        ) : displayedFilaments.length > 0 ? (
          <>
          {
          effectiveViewMode === "list" ? (
            /* List View - Sortable Table */
            <FilamentTableView
              filaments={displayedFilaments as any}
              sortBy={sortBy}
              onSortChange={setSortBy}
              isInCompare={isInCompare}
              addItem={addItem}
              removeItem={removeItem}
              getAffiliateUrl={getAffiliateUrl}
              hexSearch={hexSearch}
              getColorMatchPercent={getColorMatchPercent}
            />
          ) : (
            /* Grid View - Redesigned Cards */
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8" id="filament-grid">
              {displayedFilaments.map((filament, index) => {
                // Calculate color match percentage for hex search
                const isHexSearchActive = hexSearch && hexSearch.match(/^#?[0-9A-Fa-f]{6}$/);
                const searchHex = isHexSearchActive ? (hexSearch.startsWith('#') ? hexSearch : `#${hexSearch}`) : null;
                const normalizedHex = filament.color_hex 
                  ? (filament.color_hex.startsWith('#') ? filament.color_hex : `#${filament.color_hex}`)
                  : null;
                const colorMatchPercent = searchHex && normalizedHex 
                  ? getColorMatchPercent(searchHex, normalizedHex) 
                  : null;

                return (
                  <FilamentCard
                    key={filament.id}
                    filament={filament}
                    colorMatchPercent={colorMatchPercent}
                    index={index}
                  />
                );
              })}
            </div>
          )}
          
          {/* Load More Button */}
          {hasMore && (
            <div className="flex flex-col items-center gap-3 mt-10 mb-8">
              <p className="text-sm text-muted-foreground">
                Showing {displayedFilaments.length} of {totalCount} filaments
              </p>
              <Button 
                onClick={() => setDisplayCount(prev => prev + ITEMS_PER_PAGE)}
                variant="outline"
                className="px-8"
              >
                Load More
              </Button>
            </div>
          )}
          </>
        ) : (
          <div className="text-center py-16">
            <p className="text-muted-foreground text-lg">No filaments found</p>
          </div>
        )}
      </main>
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
