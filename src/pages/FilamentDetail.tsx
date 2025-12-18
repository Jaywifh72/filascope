import { useEffect, useState, useRef, useMemo } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MaterialBadge } from "@/components/MaterialBadge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, ExternalLink, ShoppingCart, ThermometerSun, Droplets, Settings, Package, Shield, Award, Gauge, Zap, Ruler, Wind, Flame, Snowflake, Clock, Printer, RefreshCw, AlertTriangle, Store, ChevronDown, ImageIcon, Link2, Copy, CheckCircle, Download, Palette, Ban, Search, PlayCircle, Star } from "lucide-react";
import { ScoreCardsSection } from "@/components/filament/ScoreCardsSection";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Database } from "@/integrations/supabase/types";
import { getBrandLogo } from "@/lib/brandLogos";
import { LikeButton } from "@/components/LikeButton";
import { useAuth } from "@/hooks/useAuth";
import { usePrinterSelection } from "@/hooks/usePrinterSelection";
import { checkPrinterFilamentCompatibility } from "@/lib/printerCompatibility";
import { checkHotendFilamentCompatibility, checkBuildPlateFilamentCompatibility, checkAmsFilamentCompatibility, type AccessoryCompatibilityResult } from "@/lib/accessoryCompatibility";
import { CompatibilityBadge } from "@/components/CompatibilityBadge";
import { AccessoryCompatibilityBadge } from "@/components/AccessoryCompatibilityBadge";
import { useAffiliateLinks } from "@/hooks/useAffiliateLinks";
import { useCurrency } from "@/hooks/useCurrency";
import { normalizeColorHex } from "@/lib/utils";
import { isDiscontinuedUrl } from "@/lib/urlValidation";
import { MaterialValueProposition } from "@/components/filament/MaterialValueProposition";
import { PurchaseSection } from "@/components/filament/PurchaseSection";
import { CommonMistakesPanel } from "@/components/filament/education/CommonMistakesPanel";
import { VideoThumbnail } from "@/components/filament/education/VideoThumbnail";
import { VideoPlayerModal } from "@/components/filament/education/VideoPlayerModal";
import { getVideosByMaterial } from "@/lib/videoTutorials";
import { useAchievements } from "@/hooks/useAchievements";
import { SimilarMaterialsModule } from "@/components/filament/similar/SimilarMaterialsModule";
import { PerformanceAtAGlance } from "@/components/filament/performance/PerformanceAtAGlance";
import { validateFilamentPrice } from "@/lib/priceValidation";
import { SpoolSizeSelector } from "@/components/filament/SpoolSizeSelector";
import { StickyBuyBar } from "@/components/filament/StickyBuyBar";
import { FilamentHeroGallery } from "@/components/filament/hero/FilamentHeroGallery";
import { FilamentHeroPurchaseCard } from "@/components/filament/hero/FilamentHeroPurchaseCard";
import { FilamentHeroQuickFeatures } from "@/components/filament/hero/FilamentHeroQuickFeatures";
import { RetailersModal, type Retailer } from "@/components/filament/hero/RetailersModal";
import { useConversionTracking } from "@/hooks/useConversionTracking";
import { QuickSummaryCard, CollapsibleContentContainer, SocialProofToast, ActivityStatsBanner } from "@/components/filament";
import { CalculatorTabs, FloatingCalculatorButton } from "@/components/filament/calculator";
import { useRegionalStore } from "@/hooks/useRegionalStore";
import { useRegionalPrice, type FilamentWithRegionalPrices } from "@/hooks/useRegionalPrice";

type Filament = Database["public"]["Tables"]["filaments"]["Row"];
type Accessory = Database["public"]["Tables"]["printer_accessories"]["Row"];

interface AccessoryWithCompatibility extends Accessory {
  compatibility: AccessoryCompatibilityResult;
}

const FilamentDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { isAdmin } = useAuth();
  const { selectedPrinter, printerLoading, selectedPrinterId } = usePrinterSelection();
  const [filament, setFilament] = useState<Filament | null>(null);
  const [loading, setLoading] = useState(true);
  const [rescrapingImage, setRescrapingImage] = useState(false);
  const [scrapingData, setScrapingData] = useState(false);
  const [scrapingColors, setScrapingColors] = useState(false);
  const [compatibleHotends, setCompatibleHotends] = useState<AccessoryWithCompatibility[]>([]);
  const [compatibleBuildPlates, setCompatibleBuildPlates] = useState<AccessoryWithCompatibility[]>([]);
  const [compatibleAms, setCompatibleAms] = useState<AccessoryWithCompatibility[]>([]);
  const [colorVariants, setColorVariants] = useState<Filament[]>([]);
  const [selectedWeight, setSelectedWeight] = useState<number | null>(null);
  const [availableWeights, setAvailableWeights] = useState<{ weight: number; pricePerKg: number | null; count: number }[]>([]);
  const [editImageOpen, setEditImageOpen] = useState(false);
  const [newImageUrl, setNewImageUrl] = useState("");
  const [savingImage, setSavingImage] = useState(false);
  const [editUrlOpen, setEditUrlOpen] = useState(false);
  const [newProductUrl, setNewProductUrl] = useState("");
  const [savingUrl, setSavingUrl] = useState(false);
  const [stickyBarVisible, setStickyBarVisible] = useState(false);
  const [retailersModalOpen, setRetailersModalOpen] = useState(false);
  const [isCalculatorOpen, setIsCalculatorOpen] = useState(false);
  const heroSentinelRef = useRef<HTMLDivElement>(null);
  const { getAffiliateUrl, getAmazonUrl } = useAffiliateLinks();
  const { formatPrice, formatRegionalPrice, currencyInfo } = useCurrency();
  const { incrementStat } = useAchievements();
  const { trackStoreClick } = useConversionTracking();
  const { getRegionalUrl, regionShortName, currentRegion } = useRegionalStore();
  
  // Get regional price and URL from database (prioritizes actual regional prices over converted)
  const regionalPriceData = useRegionalPrice(filament as FilamentWithRegionalPrices | null);

  const compatibility = selectedPrinter && filament 
    ? checkPrinterFilamentCompatibility(selectedPrinter, filament)
    : null;

  // Build retailers array for modal - uses regional store URLs based on user's currency setting
  const retailers: Retailer[] = useMemo(() => {
    if (!filament) return [];
    
    const result: Retailer[] = [];
    
    // Primary retailer (brand store) - use regional URL from database if available, otherwise transform
    const bestRegionalUrl = regionalPriceData.regionalUrl || getRegionalUrl(filament.product_url, filament.vendor);
    
    if (bestRegionalUrl) {
      result.push({
        id: 'store',
        name: `${filament.vendor || 'Store'} (${regionShortName})`,
        price: regionalPriceData.regionalPrice, // Use actual regional price if available
        inStock: !isDiscontinuedUrl(bestRegionalUrl),
        url: getAffiliateUrl(bestRegionalUrl, filament.vendor),
        shippingEstimate: 'Ships within 24hrs',
      });
    }
    
    // Amazon - show region-appropriate Amazon first based on user's currency
    const amazonLinks = [
      { id: 'amazon_us', name: 'Amazon US', link: filament.amazon_link_us, price: filament.amazon_price_usd, region: 'US' },
      { id: 'amazon_uk', name: 'Amazon UK', link: filament.amazon_link_uk, price: null, region: 'UK' },
      { id: 'amazon_de', name: 'Amazon DE', link: filament.amazon_link_de, price: null, region: 'EU' },
    ].filter(a => a.link);
    
    // Sort Amazon links: user's region first, then others
    const sortedAmazon = amazonLinks.sort((a, b) => {
      if (a.region === regionShortName) return -1;
      if (b.region === regionShortName) return 1;
      // For EU, prefer DE Amazon
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
  }, [filament, getAffiliateUrl, getAmazonUrl, getRegionalUrl, regionShortName, regionalPriceData]);

  // Track modal open
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

  // Track retailer click in modal
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

  // Debug logging
  useEffect(() => {
    console.log("FilamentDetail - Printer Selection State:", {
      selectedPrinterId,
      printerLoading,
      hasSelectedPrinter: !!selectedPrinter,
      selectedPrinter: selectedPrinter ? {
        model_name: selectedPrinter.model_name,
        brand: selectedPrinter.brand
      } : null
    });
  }, [selectedPrinterId, printerLoading, selectedPrinter]);

  useEffect(() => {
    fetchFilament();
  }, [id]);

  // Track material exploration for achievements
  useEffect(() => {
    if (filament?.id) {
      incrementStat('materials_explored');
    }
  }, [filament?.id]);

  // Sticky buy bar scroll detection
  useEffect(() => {
    const sentinel = heroSentinelRef.current;
    if (!sentinel) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        // Show sticky bar when sentinel scrolls out of view (hero no longer visible)
        setStickyBarVisible(!entry.isIntersecting);
      },
      {
        threshold: 0,
        rootMargin: '-100px 0px 0px 0px', // Trigger slightly before hero fully disappears
      }
    );

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, []);

  // Fetch compatible hotends when printer is selected
  useEffect(() => {
    const fetchCompatibleHotends = async () => {
      if (!selectedPrinter || !filament) {
        setCompatibleHotends([]);
        return;
      }

      try {
        // Get printer brand name
        const printerBrand = typeof selectedPrinter.brand === 'object' && selectedPrinter.brand !== null && 'brand' in selectedPrinter.brand 
          ? (selectedPrinter.brand as { brand: string }).brand 
          : null;

        const printerModel = selectedPrinter.model_name?.toLowerCase() || '';

        // Query all hotends for the printer's brand (no limit to get all compatible)
        let query = supabase
          .from("printer_accessories")
          .select("*")
          .eq("accessory_type", "hotend");
        
        // If we know the brand, filter by it
        if (printerBrand) {
          query = query.or(`compatible_printer_brands.cs.{${printerBrand}},brand.eq.${printerBrand}`);
        }

        const { data: hotends, error } = await query.limit(100);

        if (error) throw error;

        // Helper to check if hotend is compatible with printer model
        const isCompatibleWithPrinter = (hotend: Accessory): boolean => {
          const specs = hotend.specs as Record<string, any> | null;
          const compatibleModels = specs?.compatible_models || specs?.compatible_printers || '';
          const compatibleBrands = hotend.compatible_printer_brands || [];
          const hotendTypes = hotend.compatible_hotend_types || [];
          const hotendName = hotend.name?.toLowerCase() || '';
          
          // 1. Check specs.compatible_models (string or array)
          if (compatibleModels) {
            const modelsStr = Array.isArray(compatibleModels) ? compatibleModels.join(' ') : String(compatibleModels);
            const modelsLower = modelsStr.toLowerCase();
            
            // Check for model name match
            if (printerModel && (
              modelsLower.includes(printerModel) ||
              printerModel.split(/[\s-]+/).some(part => part.length > 1 && modelsLower.includes(part))
            )) {
              return true;
            }
          }
          
          // 2. Parse series from hotend NAME - e.g., "(H2/P2S)", "(X1/P1)", "(A1)"
          // This is crucial for Bambu Lab OEM hotends
          const seriesMatch = hotendName.match(/\(([^)]+)\)/);
          if (seriesMatch) {
            const seriesParts = seriesMatch[1].toLowerCase().split(/[\/,\s]+/);
            // Check if printer model matches any series part
            for (const part of seriesParts) {
              if (part.length >= 2 && (
                printerModel.includes(part) ||
                printerModel.replace(/[\s-]+/g, '').includes(part.replace(/[\s-]+/g, ''))
              )) {
                return true;
              }
            }
          }
          
          // 3. Check compatible_hotend_types for series hints like "Bambu-H2", "Bambu-X1"
          for (const hType of hotendTypes) {
            const typeLower = String(hType).toLowerCase();
            // Extract model identifiers from type strings like "Bambu-H2", "Bambu-X1", "Bambu-P1"
            const typeMatch = typeLower.match(/(h2|p2s|x1|p1|a1|mini)/gi);
            if (typeMatch) {
              for (const tm of typeMatch) {
                if (printerModel.includes(tm.toLowerCase())) {
                  return true;
                }
              }
            }
          }
          
          // 4. Brand-only match (fallback for third-party universal hotends)
          // Only if no series-specific info is found
          if (printerBrand && !seriesMatch && !compatibleModels) {
            const brandMatch = compatibleBrands.some((brand: string) => 
              brand.toLowerCase().includes(printerBrand.toLowerCase()) ||
              printerBrand.toLowerCase().includes(brand.toLowerCase())
            );
            // For brand-only matches, also check if hotend name mentions the brand
            if (brandMatch && hotendName.includes(printerBrand.toLowerCase())) {
              return true;
            }
          }

          return false;
        };

        // Filter to those compatible with this printer
        const compatible = (hotends || []).filter(isCompatibleWithPrinter);

        // Rate each hotend for this filament using unified service
        const rated: AccessoryWithCompatibility[] = compatible.map(hotend => {
          const compatibility = checkHotendFilamentCompatibility(hotend, filament);
          return { ...hotend, compatibility };
        });

        // Sort: green first, then orange, then red
        rated.sort((a, b) => {
          const order = { green: 0, orange: 1, red: 2 };
          return order[a.compatibility.rating] - order[b.compatibility.rating];
        });

        setCompatibleHotends(rated);
        console.log(`Found ${rated.length} compatible hotends for ${printerModel}:`, rated.map(h => h.name));
      } catch (error) {
        console.error("Error fetching compatible hotends:", error);
      }
    };

    fetchCompatibleHotends();
  }, [selectedPrinter, filament]);

  // Fetch compatible build plates for this filament
  useEffect(() => {
    const fetchCompatibleBuildPlates = async () => {
      if (!filament) {
        setCompatibleBuildPlates([]);
        return;
      }

      try {
        // Fetch all build plates
        const { data: buildPlates, error } = await supabase
          .from("printer_accessories")
          .select("*")
          .eq("accessory_type", "build_plate")
          .limit(100);

        if (error) throw error;

        // Rate each build plate for this filament using unified service
        const rated: AccessoryWithCompatibility[] = (buildPlates || []).map(plate => {
          const compatibility = checkBuildPlateFilamentCompatibility(plate, filament);
          return { ...plate, compatibility };
        });

        // Sort: green first, then orange, then red
        rated.sort((a, b) => {
          const order = { green: 0, orange: 1, red: 2 };
          return order[a.compatibility.rating] - order[b.compatibility.rating];
        });

        setCompatibleBuildPlates(rated);
        console.log(`Found ${rated.length} build plates rated for ${filament.material}:`, rated.map(p => `${p.name}: ${p.compatibility.rating}`));
      } catch (error) {
        console.error("Error fetching build plates:", error);
      }
    };

    fetchCompatibleBuildPlates();
  }, [filament]);

  // Fetch compatible AMS/MMU systems for this filament
  useEffect(() => {
    const fetchCompatibleAms = async () => {
      if (!filament) {
        setCompatibleAms([]);
        return;
      }

      try {
        // Fetch all AMS/MMU systems
        const { data: amsSystems, error } = await supabase
          .from("printer_accessories")
          .select("*")
          .eq("accessory_type", "ams_mmu")
          .limit(100);

        if (error) throw error;

        // Rate each AMS/MMU for this filament using unified service
        const rated: AccessoryWithCompatibility[] = (amsSystems || []).map(ams => {
          const compatibility = checkAmsFilamentCompatibility(ams, filament);
          return { ...ams, compatibility };
        });

        // Sort: green first, then orange, then red
        rated.sort((a, b) => {
          const order = { green: 0, orange: 1, red: 2 };
          return order[a.compatibility.rating] - order[b.compatibility.rating];
        });

        setCompatibleAms(rated);
        console.log(`Found ${rated.length} AMS/MMU systems rated for ${filament.material}:`, rated.map(a => `${a.name}: ${a.compatibility.rating}`));
      } catch (error) {
        console.error("Error fetching AMS/MMU systems:", error);
      }
    };

    fetchCompatibleAms();
  }, [filament]);

  // Common color names to detect at the end of product titles
  const COLOR_WORDS = [
    'Beige', 'Black', 'Blue', 'Brown', 'Burgundy', 'Charcoal', 'Copper', 'Cream', 'Cyan',
    'Gold', 'Gray', 'Grey', 'Green', 'Ivory', 'Lavender', 'Magenta', 'Maroon', 'Navy',
    'Olive', 'Orange', 'Peach', 'Pink', 'Purple', 'Red', 'Rose', 'Salmon', 'Silver',
    'Tan', 'Teal', 'Turquoise', 'Violet', 'White', 'Yellow', 'Natural', 'Clear', 'Transparent',
    // Prusament style colors
    'Jet Black', 'Lipstick Red', 'Prusa Pro Green', 'Prusa Galaxy Black', 'Prusa Orange',
    'Signal White', 'Olive Green', 'Sapphire Blue', 'Azure Blue', 'Opal Green', 'Mystic Green',
    'Mystic Brown', 'Galaxy Black', 'Galaxy Silver',
    // Other brand colors
    'Anthracite Grey', 'Carmine Red', 'Chalky Blue', 'Jungle Green', 'Mango Yellow',
    'Neon Green', 'Shimmering Violet', 'Ultramarine Blue', 'Carbon Fiber Black',
  ];

  // Terms that are PRODUCT VARIANTS (not colors) - should be kept in base name
  const PRODUCT_VARIANT_TERMS = [
    'Matte', 'Matt', 'Silk', 'Glitter', 'Silk Glitter', 'Carbon Fiber', 'CF',
    'Recycled', 'CMYK Bundle', 'CMYK', 'Bundle', 'Bulk Buy', 'Wood Fill', 'Wood', 'HF', 'High Flow',
    '10 rolls', '10 packs', 'Pack', 'Pellets', 'Large-Format',
    'Conductive', 'ESD', 'Performance', 'Essentials', 'Basics',
  ];

  // Marketing/compatibility suffixes to strip from titles (NOT colors or variants)
  const TITLE_CLEANUP_PATTERNS = [
    /\s*-?\s*Bambu\s+AMS\s+Compatible\s*$/i,
    /\s*-?\s*AMS\s+Compatible\s*$/i,
    /\s*-?\s*Bambu\s+Compatible\s*$/i,
    /\s*\|\s*Matter3D\s*$/i,
    /\s*\|\s*[\w\s]+$/i,  // " | BrandName" suffixes
  ];

  // Clean title by removing marketing/compatibility suffixes
  const cleanProductTitle = (title: string): string => {
    let cleaned = title.trim();
    for (const pattern of TITLE_CLEANUP_PATTERNS) {
      cleaned = cleaned.replace(pattern, '').trim();
    }
    return cleaned.replace(/\s+/g, ' ').trim();
  };

  // Extract base product name by removing color suffix
  const getBaseProductName = (title: string): string => {
    // First, clean the title of marketing suffixes
    const cleanedTitle = cleanProductTitle(title);
    
    // Normalize the title
    let normalizedTitle = cleanedTitle
      .replace(/\s*\(NFC\)\s*/gi, '')            // "(NFC)"
      .replace(/\s+Refill\s*$/gi, '')            // "Refill" at end
      .trim();
    
    // Pattern 0: Paramount 3D style - "Material (Color) Diameter Weight Filament"
    // e.g., "ABS (Autobot Blue) 1.75mm 1kg Filament" -> "ABS"
    const paramountMatch = normalizedTitle.match(/^((?:PLA\+?|PETG|ABS|TPU|TPE|ASA|PA\d*|PC|HIPS|PVA|Nylon|Carbon\s+Fiber\s+\w+))\s*\(.+\)\s+[\d.]+mm\s+[\d.]+kg\s+Filament$/i);
    if (paramountMatch) {
      return paramountMatch[1].trim();
    }
    
    // Pattern 1: Handle "Brand Material Color Weight" pattern (Prusament style)
    // e.g., "Prusament ASA Jet Black 800g" -> "Prusament ASA"
    const weightMatch = normalizedTitle.match(/^(.+?\s+(?:PLA\+?|PETG|ABS|TPU|TPE|ASA|PA\d*|PC(?:\s+Blend)?|HIPS|PVA|Nylon|PA11\s+Carbon\s+Fiber))\s+.+?\s+\d+(?:\.\d+)?(?:kg|g)\s*$/i);
    if (weightMatch) {
      return weightMatch[1].trim();
    }
    
    // Pattern 2: "Brand Material - Variant" (dash separator)
    // For Matter3D style: "Basics Series PLA - Matte Bambu AMS Compatible"
    // Check if the part after dash contains a product variant term - if so, keep it in base name
    const dashMatch = normalizedTitle.match(/^(.+?)\s+-\s+(.+)$/);
    if (dashMatch) {
      const beforeDash = dashMatch[1].trim();
      const afterDash = dashMatch[2].trim();
      
      // Check if afterDash starts with a product variant term
      const startsWithVariant = PRODUCT_VARIANT_TERMS.some(term => 
        afterDash.toLowerCase().startsWith(term.toLowerCase())
      );
      
      // If it's a product variant, the whole title is the base name (minus generic suffixes)
      if (startsWithVariant) {
        // Remove generic suffixes like "Bambu AMS Compatible", "AMS Compatible"
        return normalizedTitle
          .replace(/\s+Bambu\s+AMS\s+Compatible\s*$/i, '')
          .replace(/\s+AMS\s+Compatible\s*$/i, '')
          .trim();
      }
      
      // Otherwise, it's likely a color after the dash
      return beforeDash;
    }
    
    // Pattern 3: Check for color word at the end
    const sortedColors = [...COLOR_WORDS].sort((a, b) => b.length - a.length);
    for (const color of sortedColors) {
      const regex = new RegExp(`^(.+?)\\s+${color}$`, 'i');
      const match = normalizedTitle.match(regex);
      if (match) {
        return match[1].trim();
      }
    }
    
    return normalizedTitle;
  };

  // Check if a term is a product variant (not a color)
  const isProductVariant = (term: string): boolean => {
    const termLower = term.toLowerCase();
    return PRODUCT_VARIANT_TERMS.some(v => termLower.includes(v.toLowerCase()));
  };

  // Extract color from product title  
  const getColorFromTitle = (title: string, baseName: string): string | null => {
    // First clean the title of marketing suffixes
    const cleanedTitle = cleanProductTitle(title);
    
    // Remove packaging suffixes for comparison
    const cleanTitle = cleanedTitle
      .replace(/\s*\(NFC\)\s*/gi, '')
      .replace(/\s+Refill\s*$/gi, '')
      .replace(/\s+\d+(?:\.\d+)?(?:kg|g)\s*$/gi, '')
      .trim();
    
    if (cleanTitle === baseName) return null;
    
    // Prusament-specific handling: extract just the color part from product line
    if (cleanTitle.toLowerCase().includes('prusament')) {
      const prusamentPatterns = [
        { pattern: /^Prusament\s+Premium\s+PLA\s+Galaxy\s+(.+)$/i, line: 'Galaxy' },
        { pattern: /^Prusament\s+Premium\s+PLA\s+Mystic\s+(.+)$/i, line: 'Mystic' },
        { pattern: /^Prusament\s+Premium\s+PLA\s+Pearl\s+(.+)$/i, line: 'Pearl' },
        { pattern: /^Prusament\s+PLA\s+Galaxy\s+(.+)$/i, line: 'Galaxy' },
        { pattern: /^Prusament\s+PLA\s+Blend\s+(.+)$/i, line: 'Blend' },
        { pattern: /^Prusament\s+PLA\s+Recycled\s*(.*)$/i, line: 'Recycled' },
        { pattern: /^Prusament\s+rPLA\s+(.+)$/i, line: 'rPLA' },
        { pattern: /^Prusament\s+PLA\s+(.+)$/i, line: 'Basic' },
      ];
      
      for (const { pattern, line } of prusamentPatterns) {
        const match = cleanTitle.match(pattern);
        if (match) {
          let colorPart = match[1]?.trim() || '';
          // Strip "Prusa" prefix and redundant line name from color
          colorPart = colorPart.replace(/^Prusa\s+/i, '').trim();
          if (line === 'Galaxy') {
            colorPart = colorPart.replace(/^Galaxy\s+/i, '').trim();
          }
          return colorPart || null;
        }
      }
    }
    
    // Pattern 0: Paramount 3D style - extract color from parentheses
    // e.g., "ABS (Autobot Blue) 1.75mm 1kg Filament" -> "Autobot Blue"
    // Use cleanTitle (NFC already removed) to avoid matching "(NFC)" as a color
    const parenMatch = cleanTitle.match(/\(([^)]+)\)/);
    if (parenMatch) {
      const extracted = parenMatch[1].trim();
      // Don't return if it's a product variant
      if (isProductVariant(extracted)) return null;
      return extracted;
    }
    
    // Pattern 1: Dash separator
    const dashMatch = cleanedTitle.match(/^.+?\s+-\s+(.+?)(?:\s+\d+(?:\.\d+)?(?:kg|g))?(?:\s*\(NFC\))?(?:\s+Refill)?$/i);
    if (dashMatch) {
      const extracted = dashMatch[1].trim();
      // Don't return if it's a product variant
      if (isProductVariant(extracted)) return null;
      return extracted;
    }
    
    // Pattern 2: Extract color between base name and weight
    const weightColorMatch = cleanedTitle.match(new RegExp(`^${baseName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\s+(.+?)\\s+\\d+(?:\\.\\d+)?(?:kg|g)`, 'i'));
    if (weightColorMatch) {
      const extracted = weightColorMatch[1].trim();
      if (isProductVariant(extracted)) return null;
      return extracted;
    }
    
    // Fallback: everything after base name
    if (cleanTitle.startsWith(baseName)) {
      const extracted = cleanTitle.slice(baseName.length).replace(/^[\s-]+/, '').trim();
      if (!extracted || isProductVariant(extracted)) return null;
      return extracted;
    }
    
    return null;
  };

  // Extract Prusament product line from title
  // Returns { productLine: string, colorPart: string }
  const extractPrusamentProductLine = (title: string): { productLine: string; colorPart: string } | null => {
    const cleanTitle = title
      .replace(/\s*\(NFC\)\s*/gi, '')
      .replace(/\s+Refill\s*$/gi, '')
      .replace(/\s+\d+(?:\.\d+)?(?:kg|g)\s*$/gi, '')
      .trim();
    
    // Prusament PLA product line patterns (order matters - most specific first)
    const productLinePatterns = [
      { pattern: /^Prusament\s+Premium\s+PLA\s+Galaxy\s+(.+)$/i, line: 'Premium Galaxy' },
      { pattern: /^Prusament\s+Premium\s+PLA\s+Mystic\s+(.+)$/i, line: 'Premium Mystic' },
      { pattern: /^Prusament\s+Premium\s+PLA\s+Pearl\s+(.+)$/i, line: 'Premium Pearl' },
      { pattern: /^Prusament\s+PLA\s+Galaxy\s+(.+)$/i, line: 'Galaxy' },
      { pattern: /^Prusament\s+PLA\s+Blend\s+(.+)$/i, line: 'Blend' },
      { pattern: /^Prusament\s+PLA\s+Recycled\s*(.*)$/i, line: 'Recycled' },
      { pattern: /^Prusament\s+rPLA\s+(.+)$/i, line: 'rPLA' },
      { pattern: /^Prusament\s+PLA\s+(.+)$/i, line: 'Basic' }, // Catch-all for basic colors
    ];
    
    for (const { pattern, line } of productLinePatterns) {
      const match = cleanTitle.match(pattern);
      if (match) {
        let colorPart = match[1]?.trim() || '';
        // Strip "Prusa" prefix from color (e.g., "Prusa Galaxy Black" -> "Black" within Galaxy line)
        colorPart = colorPart.replace(/^Prusa\s+/i, '').trim();
        // For Galaxy line, also strip "Galaxy" if it appears in color (redundant)
        if (line === 'Galaxy' || line === 'Premium Galaxy') {
          colorPart = colorPart.replace(/^Galaxy\s+/i, '').trim();
        }
        return { productLine: line, colorPart };
      }
    }
    
    return null;
  };

  // Normalize color name by stripping brand prefixes for deduplication
  const normalizeColorName = (colorName: string, vendor: string): string => {
    let normalized = colorName.toLowerCase().trim();
    
    // Strip common brand prefixes from color names
    const brandPrefixes = [
      'prusa', 'prusament', 'bambu', 'bambulab', 'creality', 'anycubic',
      'polymaker', 'esun', 'hatchbox', 'overture', 'sunlu', 'elegoo'
    ];
    
    // Also strip the vendor name as a prefix
    const vendorLower = vendor?.toLowerCase() || '';
    const allPrefixes = [...brandPrefixes, vendorLower].filter(Boolean);
    
    for (const prefix of allPrefixes) {
      if (normalized.startsWith(prefix + ' ')) {
        normalized = normalized.slice(prefix.length).trim();
        break;
      }
    }
    
    return normalized;
  };

  // Deduplicate color variants by extracted color name
  // Prioritizes non-NFC/non-Refill variants over suffixed ones
  // Uses product line + color for Prusament products
  const deduplicateColorVariants = (variants: any[], baseName: string): any[] => {
    const seenColors = new Set<string>();
    const result: any[] = [];
    const vendor = variants[0]?.vendor || '';
    const isPrusament = vendor.toLowerCase().includes('prusa');
    
    // Sort to prioritize variants without suffixes (NFC, Refill) first
    // Also prioritize shorter names (base product without brand prefix in color)
    const sorted = [...variants].sort((a, b) => {
      const aTitle = a.product_title.toLowerCase();
      const bTitle = b.product_title.toLowerCase();
      const aHasSuffix = aTitle.includes('(nfc)') || aTitle.includes('refill');
      const bHasSuffix = bTitle.includes('(nfc)') || bTitle.includes('refill');
      if (aHasSuffix && !bHasSuffix) return 1;
      if (!aHasSuffix && bHasSuffix) return -1;
      // Prefer shorter titles (less likely to have brand prefix in color)
      return aTitle.length - bTitle.length;
    });
    
    for (const variant of sorted) {
      let colorKey: string;
      
      if (isPrusament) {
        // Use product line + color for Prusament
        const lineInfo = extractPrusamentProductLine(variant.product_title);
        if (lineInfo) {
          colorKey = `${lineInfo.productLine.toLowerCase()}-${lineInfo.colorPart.toLowerCase()}`;
        } else {
          colorKey = variant.color_hex?.toLowerCase() || variant.id;
        }
      } else {
        // Standard deduplication for other vendors
        const colorName = getColorFromTitle(variant.product_title, baseName);
        colorKey = colorName 
          ? normalizeColorName(colorName, vendor) 
          : (variant.color_hex?.toLowerCase() || variant.id);
      }
      
      if (!seenColors.has(colorKey)) {
        seenColors.add(colorKey);
        result.push(variant);
      }
    }
    
    return result;
  };

  // Fetch color variants - other filaments of the same base product from the same vendor
  // Also calculates available spool weights for the SpoolSizeSelector
  useEffect(() => {
    const fetchColorVariants = async () => {
      if (!filament || !filament.vendor) {
        setColorVariants([]);
        setAvailableWeights([]);
        return;
      }

      try {
        const baseName = getBaseProductName(filament.product_title);
        const isPrusament = filament.vendor.toLowerCase().includes('prusa');
        
        // For Prusament, get the product line for grouping
        let productLineKey: string | null = null;
        if (isPrusament) {
          const lineInfo = extractPrusamentProductLine(filament.product_title);
          productLineKey = lineInfo?.productLine || null;
        }
        
        // Fetch all filaments from the same vendor
        const { data, error } = await supabase
          .from("filaments")
          .select("*")
          .eq("vendor", filament.vendor)
          .order("product_title");

        if (error) throw error;

        // Filter to same product line/base name
        const variants = (data || []).filter(f => {
          if (isPrusament && productLineKey) {
            // For Prusament, match by product line
            const fLineInfo = extractPrusamentProductLine(f.product_title);
            return fLineInfo?.productLine === productLineKey;
          } else {
            // Standard matching by base name
            const fBaseName = getBaseProductName(f.product_title);
            if (fBaseName !== baseName) return false;
            if (f.id === filament.id) return true;
            const color = getColorFromTitle(f.product_title, baseName);
            return color !== null;
          }
        });

        // Calculate available weights with price/kg and color counts
        const weightMap = new Map<number, { priceSum: number; priceCount: number; colorCount: number }>();
        variants.forEach(v => {
          if (v.net_weight_g) {
            const existing = weightMap.get(v.net_weight_g) || { priceSum: 0, priceCount: 0, colorCount: 0 };
            existing.colorCount++;
            if (v.variant_price && v.net_weight_g) {
              const pricePerKg = v.variant_price / (v.net_weight_g / 1000);
              existing.priceSum += pricePerKg;
              existing.priceCount++;
            }
            weightMap.set(v.net_weight_g, existing);
          }
        });

        const weights = Array.from(weightMap.entries())
          .map(([weight, data]) => ({
            weight,
            pricePerKg: data.priceCount > 0 ? data.priceSum / data.priceCount : null,
            count: data.colorCount,
          }))
          .sort((a, b) => a.weight - b.weight);

        setAvailableWeights(weights);

        // Deduplicate by color name, prioritizing non-NFC/Refill variants
        const deduplicatedVariants = deduplicateColorVariants(variants, baseName);

        // Sort: current filament first, then alphabetically by color
        deduplicatedVariants.sort((a, b) => {
          if (a.id === filament.id) return -1;
          if (b.id === filament.id) return 1;
          const colorA = getColorFromTitle(a.product_title, baseName) || '';
          const colorB = getColorFromTitle(b.product_title, baseName) || '';
          return colorA.localeCompare(colorB);
        });

        setColorVariants(deduplicatedVariants);
        // Reset weight selection when filament changes
        setSelectedWeight(null);
      } catch (error) {
        console.error("Error fetching color variants:", error);
        setColorVariants([]);
        setAvailableWeights([]);
      }
    };

    fetchColorVariants();
  }, [filament]);

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

      // Refresh filament data
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

      // Refresh filament data
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

      // Refresh filament data
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

  const handleCopyProfile = async () => {
    if (!filament) return;
    
    const profile = {
      Brand: filament.vendor || "Unknown",
      Material: filament.material || "Unknown",
      Nozzle_Temp: filament.nozzle_temp_sweetspot_c 
        ? `${filament.nozzle_temp_sweetspot_c}°C`
        : filament.nozzle_temp_min_c && filament.nozzle_temp_max_c
          ? `${filament.nozzle_temp_min_c}-${filament.nozzle_temp_max_c}°C`
          : "Not specified",
      Bed_Temp: filament.bed_temp_min_c && filament.bed_temp_max_c
        ? `${filament.bed_temp_min_c}-${filament.bed_temp_max_c}°C`
        : "Not specified",
      Max_Volumetric_Speed: filament.print_speed_max_mms
        ? `${filament.print_speed_max_mms} mm/s`
        : "Not specified",
      Retraction: filament.material?.includes("TPU") || filament.material?.includes("TPE")
        ? "0.5-1.0mm (Flexible)"
        : "1.0-2.0mm (Standard)"
    };
    
    try {
      await navigator.clipboard.writeText(JSON.stringify(profile, null, 2));
      toast({
        title: "✓ Profile copied to clipboard",
        description: "Print settings JSON copied successfully.",
        duration: 3000,
      });
    } catch (error) {
      toast({
        title: "Failed to copy",
        description: "Could not copy profile to clipboard.",
        variant: "destructive",
      });
    }
  };

  const generateSlicerProfile = (slicerType: 'prusaslicer' | 'orcaslicer' | 'cura' | 'bambu') => {
    if (!filament) return;

    const nozzleTemp = filament.nozzle_temp_sweetspot_c || filament.nozzle_temp_max_c || 200;
    const bedTemp = filament.bed_temp_max_c || filament.bed_temp_min_c || 60;
    const fanMin = filament.fan_min_percent || 0;
    const fanMax = filament.fan_max_percent || 100;
    const maxSpeed = filament.print_speed_max_mms || 60;
    const material = filament.material || 'PLA';
    const vendor = filament.vendor || 'Unknown';
    const productName = filament.product_title || 'Custom Filament';
    const isFlexible = material.includes('TPU') || material.includes('TPE');
    const retraction = isFlexible ? 0.8 : 1.5;
    const density = filament.density_g_cm3 || 1.24;

    let content = '';
    let filename = '';
    let mimeType = 'text/plain';

    switch (slicerType) {
      case 'prusaslicer':
        filename = `${vendor}_${material}_PrusaSlicer.ini`;
        content = `# PrusaSlicer Filament Profile
# Generated by Filament Finder
# ${productName}

[filament:${vendor} ${material}]
filament_vendor = ${vendor}
filament_type = ${material}
filament_colour = #${filament.color_hex || 'FFFFFF'}
filament_density = ${density}
filament_diameter = ${filament.diameter_nominal_mm || 1.75}

# Temperature Settings
temperature = ${nozzleTemp}
first_layer_temperature = ${nozzleTemp + 5}
bed_temperature = ${bedTemp}
first_layer_bed_temperature = ${bedTemp + 5}

# Cooling Settings
fan_always_on = ${fanMin > 0 ? 1 : 0}
min_fan_speed = ${fanMin}
max_fan_speed = ${fanMax}
bridge_fan_speed = 100
disable_fan_first_layers = 1

# Retraction Settings
filament_retract_length = ${retraction}
filament_retract_speed = 35
filament_retract_lift = 0.2
filament_deretract_speed = 25

# Speed Limits
filament_max_volumetric_speed = ${maxSpeed * 0.4}

# Notes
filament_notes = Exported from Filament Finder\\n${filament.product_url || ''}
`;
        break;

      case 'orcaslicer':
        filename = `${vendor}_${material}_OrcaSlicer.json`;
        mimeType = 'application/json';
        content = JSON.stringify({
          "type": "filament",
          "name": `${vendor} ${material}`,
          "from": "User",
          "instantiation": "true",
          "filament_vendor": vendor,
          "filament_type": material,
          "filament_colour": `#${filament.color_hex || 'FFFFFF'}`,
          "filament_density": density,
          "filament_diameter": filament.diameter_nominal_mm || 1.75,
          "nozzle_temperature": [nozzleTemp],
          "nozzle_temperature_initial_layer": [nozzleTemp + 5],
          "bed_temperature": [bedTemp],
          "bed_temperature_initial_layer": [bedTemp + 5],
          "fan_min_speed": [fanMin],
          "fan_max_speed": [fanMax],
          "fan_cooling_layer_time": [100],
          "overhang_fan_speed": [100],
          "close_fan_the_first_x_layers": [1],
          "filament_retraction_length": [retraction],
          "filament_retraction_speed": [35],
          "filament_z_hop": [0.2],
          "filament_deretraction_speed": [25],
          "filament_max_volumetric_speed": [maxSpeed * 0.4],
          "filament_flow_ratio": [1.0],
          "reduce_fan_stop_start_freq": [1],
          "slow_down_for_layer_cooling": [1],
          "filament_notes": `Exported from Filament Finder\n${filament.product_url || ''}`
        }, null, 2);
        break;

      case 'cura':
        filename = `${vendor}_${material}_Cura.xml.fdm_material`;
        mimeType = 'application/xml';
        content = `<?xml version="1.0" encoding="UTF-8"?>
<fdmmaterial xmlns="http://www.ultimaker.com/material" xmlns:cura="http://www.ultimaker.com/cura" version="1.3">
  <metadata>
    <name>
      <brand>${vendor}</brand>
      <material>${material}</material>
      <color>${filament.color_family || 'Generic'}</color>
      <label>${productName}</label>
    </name>
    <GUID>${crypto.randomUUID()}</GUID>
    <version>1</version>
    <color_code>#${filament.color_hex || 'FFFFFF'}</color_code>
    <description>Exported from Filament Finder</description>
    <adhesion_info>Use appropriate bed adhesion for ${material}</adhesion_info>
  </metadata>
  <properties>
    <density>${density}</density>
    <diameter>${filament.diameter_nominal_mm || 1.75}</diameter>
  </properties>
  <settings>
    <setting key="print temperature">${nozzleTemp}</setting>
    <setting key="heated bed temperature">${bedTemp}</setting>
    <setting key="standby temperature">${nozzleTemp - 20}</setting>
    <setting key="retraction amount">${retraction}</setting>
    <setting key="retraction speed">35</setting>
    <cura:setting key="material_flow">100</cura:setting>
    <cura:setting key="cool_fan_speed_min">${fanMin}</cura:setting>
    <cura:setting key="cool_fan_speed_max">${fanMax}</cura:setting>
  </settings>
</fdmmaterial>`;
        break;

      case 'bambu':
        filename = `${vendor}_${material}_BambuStudio.json`;
        mimeType = 'application/json';
        content = JSON.stringify({
          "type": "filament",
          "filament_id": `GFL99_${material.toUpperCase().replace(/\s/g, '_')}`,
          "name": `${vendor} ${material}`,
          "from": "User",
          "instantiation": "true",
          "filament_vendor": vendor,
          "filament_type": material,
          "filament_colour": [`#${filament.color_hex || 'FFFFFF'}`],
          "filament_density": [density],
          "filament_diameter": [filament.diameter_nominal_mm || 1.75],
          "nozzle_temperature": [nozzleTemp],
          "nozzle_temperature_initial_layer": [nozzleTemp + 5],
          "hot_plate_temp": [bedTemp],
          "hot_plate_temp_initial_layer": [bedTemp + 5],
          "textured_plate_temp": [bedTemp],
          "textured_plate_temp_initial_layer": [bedTemp + 5],
          "cool_plate_temp": [bedTemp - 10],
          "cool_plate_temp_initial_layer": [bedTemp - 5],
          "eng_plate_temp": [bedTemp + 5],
          "eng_plate_temp_initial_layer": [bedTemp + 10],
          "fan_min_speed": [fanMin],
          "fan_max_speed": [fanMax],
          "overhang_fan_speed": [100],
          "close_fan_the_first_x_layers": [1],
          "filament_retraction_length": [retraction],
          "filament_retraction_speed": [35],
          "filament_z_hop": [0.2],
          "filament_deretraction_speed": [25],
          "filament_max_volumetric_speed": [maxSpeed * 0.4],
          "filament_flow_ratio": [1.0],
          "required_nozzle_HRC": [3],
          "filament_notes": `Exported from Filament Finder\n${filament.product_url || ''}`
        }, null, 2);
        break;
    }

    // Create and download the file
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename.replace(/[^a-zA-Z0-9_.-]/g, '_');
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    toast({
      title: `✓ ${slicerType === 'prusaslicer' ? 'PrusaSlicer' : slicerType === 'orcaslicer' ? 'OrcaSlicer' : slicerType === 'cura' ? 'Cura' : 'Bambu Studio'} profile exported`,
      description: `Saved as ${filename.replace(/[^a-zA-Z0-9_.-]/g, '_')}`,
      duration: 3000,
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-muted-foreground">Loading filament details...</div>
      </div>
    );
  }

  if (!filament) return null;

  // Get pack quantity (default to 1 for single spools)
  const packQuantity = (filament as any).pack_quantity || 1;
  const isMultiPack = packQuantity > 1;
  
  // variant_price is the TOTAL price for the listing in USD (may be multi-pack)
  // Calculate true per-kg price: total_price / (pack_quantity * weight_per_spool_kg)
  const totalWeightKg = filament.net_weight_g 
    ? (filament.net_weight_g / 1000) * packQuantity 
    : packQuantity; // Assume 1kg per spool if weight unknown
  
  // Use actual scraped regional price if available, otherwise fall back to USD conversion
  // regionalPriceData.regionalPrice is already in the user's local currency (e.g., CAD $25.99)
  const hasActualRegionalPrice = regionalPriceData.isActualRegionalPrice && regionalPriceData.regionalPrice !== null;
  
  // Calculate raw price values based on whether we have actual regional data
  const rawPricePerKg = hasActualRegionalPrice
    ? (regionalPriceData.regionalPrice! / totalWeightKg)
    : filament.variant_price 
      ? (filament.variant_price / totalWeightKg) 
      : null;
  
  // Validate price for suspicious patterns (MOQ/bundle miscalculations)
  // Use USD price for validation since thresholds are USD-based
  const priceValidation = validateFilamentPrice(
    filament.variant_price,
    filament.net_weight_g,
    packQuantity,
    filament.material,
    filament.product_title,
    filament.product_url
  );
  
  // Per-spool price = total price / pack quantity
  const rawPricePerSpool = hasActualRegionalPrice
    ? (regionalPriceData.regionalPrice! / packQuantity)
    : filament.variant_price 
      ? (filament.variant_price / packQuantity)
      : null;
  
  // Format prices - use formatRegionalPrice for actual scraped prices (no conversion),
  // or formatPrice for USD values that need conversion
  const pricePerKg = rawPricePerKg !== null
    ? hasActualRegionalPrice
      ? formatRegionalPrice(rawPricePerKg, false)
      : formatPrice(rawPricePerKg, false)
    : null;
  
  const pricePerSpool = rawPricePerSpool !== null
    ? hasActualRegionalPrice
      ? formatRegionalPrice(rawPricePerSpool)
      : formatPrice(rawPricePerSpool)
    : null;
  
  // Total pack price is just the variant_price for multi-packs
  const totalPackPrice = isMultiPack 
    ? hasActualRegionalPrice && regionalPriceData.regionalPrice
      ? formatRegionalPrice(regionalPriceData.regionalPrice) 
      : filament.variant_price
        ? formatPrice(filament.variant_price)
        : null
    : null;

  // Helper functions for QuickSummaryCard
  const getRecommendationSummary = (f: Filament): string => {
    const mat = f.material?.toUpperCase() || '';
    if (mat.includes('PLA')) {
      return `${f.vendor || 'This'} ${f.material} is a great choice for beginners and everyday printing. It offers easy printability with minimal warping and good surface quality.`;
    }
    if (mat.includes('PETG')) {
      return `${f.vendor || 'This'} ${f.material} provides excellent durability and chemical resistance, making it ideal for functional parts that need to withstand stress.`;
    }
    if (mat.includes('ABS') || mat.includes('ASA')) {
      return `${f.vendor || 'This'} ${f.material} offers superior heat resistance and impact strength, best suited for experienced users with enclosed printers.`;
    }
    if (mat.includes('TPU') || mat.includes('TPE')) {
      return `${f.vendor || 'This'} ${f.material} is a flexible filament perfect for rubber-like parts. Requires slower print speeds and direct drive extruders.`;
    }
    return `${f.vendor || 'This'} ${f.material || 'filament'} offers reliable performance for a variety of 3D printing applications.`;
  };

  const getPerfectFor = (f: Filament): string[] => {
    const mat = f.material?.toUpperCase() || '';
    if (mat.includes('PLA')) {
      return ['Decorative prints', 'Prototyping', 'Beginners', 'Low-stress parts'];
    }
    if (mat.includes('PETG')) {
      return ['Functional parts', 'Outdoor use', 'Food containers (single use)', 'Mechanical components'];
    }
    if (mat.includes('ABS') || mat.includes('ASA')) {
      return ['Heat-resistant parts', 'Automotive components', 'Enclosures', 'Outdoor applications'];
    }
    if (mat.includes('TPU') || mat.includes('TPE')) {
      return ['Phone cases', 'Gaskets & seals', 'Wearables', 'Vibration dampeners'];
    }
    return ['General purpose printing', 'Hobby projects', 'Prototypes'];
  };

  const getNotIdealFor = (f: Filament): string[] => {
    const mat = f.material?.toUpperCase() || '';
    if (mat.includes('PLA')) {
      return ['High-heat applications', 'Outdoor UV exposure', 'Mechanical stress parts'];
    }
    if (mat.includes('PETG')) {
      return ['High-temp applications', 'Sharp detail miniatures', 'Bridging-heavy designs'];
    }
    if (mat.includes('ABS') || mat.includes('ASA')) {
      return ['Open-frame printers', 'Beginners', 'Large flat parts without enclosure'];
    }
    if (mat.includes('TPU') || mat.includes('TPE')) {
      return ['Bowden extruders', 'High-speed printing', 'Fine detail work'];
    }
    return ['Specialized engineering applications', 'Extreme environments'];
  };

  const getStandoutFeature = (f: Filament): { title: string; description: string } | undefined => {
    if (f.high_speed_capable) {
      return { title: 'High-Speed Ready', description: 'Optimized for fast printing without sacrificing quality.' };
    }
    if (f.ease_of_printing_score && f.ease_of_printing_score >= 9) {
      return { title: 'Exceptionally Easy to Print', description: 'One of the easiest filaments to work with, great for any skill level.' };
    }
    if (f.strength_index && f.strength_index >= 8) {
      return { title: 'Superior Strength', description: 'Excellent mechanical properties for demanding applications.' };
    }
    return undefined;
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-background to-muted/20">
      <div className="max-w-[1400px] mx-auto p-4 lg:p-8">
        <Button variant="ghost" onClick={() => navigate(-1)} className="mb-6 hover:bg-accent/50 transition-colors">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Button>

        {/* New Conversion-Focused Hero Section */}
        <Card className="bg-gradient-to-br from-card via-card to-card/50 border-border shadow-xl mb-6 overflow-hidden animate-fade-in">
          <CardContent className="p-6 lg:p-10">
            <div className="grid lg:grid-cols-2 gap-8 lg:gap-12">
              {/* Left Column - Image Gallery */}
              <div className="relative">
                <FilamentHeroGallery
                  images={[filament.featured_image]}
                  productTitle={filament.product_title}
                  colorHex={filament.color_hex}
                />
                {isAdmin && (
                  <div className="absolute bottom-4 right-4 flex gap-2 z-10">
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => {
                        setNewImageUrl(filament.featured_image || "");
                        setEditImageOpen(true);
                      }}
                      title="Edit product image URL"
                    >
                      <ImageIcon className="w-4 h-4" />
                    </Button>
                    {filament.product_url && (
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={handleRescrapeImage}
                        disabled={rescrapingImage}
                        title={`Rescrape image from: ${filament.product_url}`}
                      >
                        <RefreshCw className={`w-4 h-4 ${rescrapingImage ? 'animate-spin' : ''}`} />
                      </Button>
                    )}
                  </div>
                )}
              </div>

              {/* Right Column - Info & Purchase */}
              <div className="flex flex-col gap-6">
                {/* Title Block */}
                <div>
                  {/* Brand Name */}
                  <Link 
                    to={`/brands/${encodeURIComponent(filament.vendor || '')}`}
                    className="text-sm font-bold text-primary uppercase tracking-wider hover:underline inline-flex items-center gap-1.5 group"
                  >
                    {filament.vendor}
                    <ExternalLink className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </Link>
                  
                  {/* Product Title */}
                  <div className="flex items-start gap-4 mt-2">
                    <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-foreground leading-tight tracking-tight">
                      {getBaseProductName(filament.product_title)}
                    </h1>
                    {isAdmin && (
                      <div className="flex gap-2 flex-shrink-0">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setNewProductUrl(filament.product_url || "");
                            setEditUrlOpen(true);
                          }}
                          title="Edit product URL"
                        >
                          <Link2 className="w-4 h-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={handleScrapeData}
                          disabled={scrapingData || !filament.product_url}
                          title={filament.product_url ? `Scrape all data from: ${filament.product_url}` : "No product URL"}
                        >
                          <RefreshCw className={`w-4 h-4 ${scrapingData ? 'animate-spin' : ''}`} />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={handleScrapeColors}
                          disabled={scrapingColors || !filament.product_url}
                          title={filament.product_url ? `Scrape color variants` : "No product URL"}
                        >
                          <Palette className={`w-4 h-4 ${scrapingColors ? 'animate-pulse' : ''}`} />
                        </Button>
                      </div>
                    )}
                  </div>

                  {/* Rating & Meta Row */}
                  <div className="flex items-center gap-3 mt-3 flex-wrap">
                    {/* Rating - placeholder for now */}
                    <div className="flex items-center gap-1.5">
                      <Star className="w-4 h-4 fill-amber-500 text-amber-500" />
                      <span className="font-bold text-amber-500">4.8</span>
                      <span className="text-sm text-muted-foreground">(234 reviews)</span>
                    </div>
                    {filament.material && (
                      <>
                        <span className="text-muted-foreground">•</span>
                        <MaterialBadge 
                          material={filament.material} 
                          variant="default" 
                          size="sm"
                          className="text-xs"
                        />
                      </>
                    )}
                  </div>

                  {/* Quick Badges */}
                  <div className="flex gap-2 flex-wrap mt-4">
                    {filament.diameter_nominal_mm && (
                      <Badge variant="outline" className="text-xs px-2.5 py-1">
                        {filament.diameter_nominal_mm}mm
                      </Badge>
                    )}
                    {filament.color_family && (
                      <Badge variant="outline" className="text-xs px-2.5 py-1 flex items-center gap-1.5">
                        {filament.color_hex && (
                          <div className="w-3 h-3 rounded-full border border-border" style={{ backgroundColor: normalizeColorHex(filament.color_hex) }} />
                        )}
                        {filament.color_family}
                      </Badge>
                    )}
                    {filament.net_weight_g && filament.net_weight_g > 0 && (
                      <Badge variant="outline" className="text-xs px-2.5 py-1">
                        <Package className="w-3 h-3 mr-1" />
                        {filament.net_weight_g}g
                      </Badge>
                    )}
                    {filament.finish_type && (
                      <Badge variant="secondary" className="text-xs px-2.5 py-1">{filament.finish_type}</Badge>
                    )}
                    {filament.is_nozzle_abrasive && (
                      <Badge variant="destructive" className="text-xs px-2.5 py-1">⚠️ Abrasive</Badge>
                    )}
                    {isMultiPack && (
                      <Badge variant="secondary" className="text-xs px-2.5 py-1 bg-primary/20 text-primary border-primary/30">
                        📦 {packQuantity}-Pack
                      </Badge>
                    )}
                  </div>
                </div>

                {/* Purchase Card - THE CONVERSION ENGINE */}
                <FilamentHeroPurchaseCard
                  filamentId={filament.id}
                  vendor={filament.vendor}
                  pricePerKg={rawPricePerKg}
                  pricePerSpool={rawPricePerSpool}
                  affiliateUrl={getAffiliateUrl(getRegionalUrl(filament.product_url, filament.vendor), filament.vendor)}
                  retailerName={filament.vendor || undefined}
                  inStock={!isDiscontinuedUrl(getRegionalUrl(filament.product_url, filament.vendor))}
                  retailerCount={retailers.length}
                  onViewRetailers={handleViewRetailers}
                  hasActualRegionalPrice={hasActualRegionalPrice}
                />

                {/* Suspicious price warning */}
                {priceValidation.isSuspicious && (
                  <div className="bg-warning/10 border border-warning/30 rounded-xl p-3">
                    <div className="flex items-center gap-2 text-warning">
                      <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                      <span className="text-sm font-semibold">Price may be incorrect</span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1.5 leading-relaxed">
                      {priceValidation.detectedPattern === 'moq' 
                        ? 'This appears to be an MOQ (minimum order) listing where weight was miscalculated.'
                        : priceValidation.detectedPattern === 'bundle' || priceValidation.detectedPattern === 'pack'
                          ? 'This appears to be a bundle/pack listing.'
                          : `Price/kg ($${priceValidation.rawPricePerKg.toFixed(2)}) is below realistic market rates.`
                      }
                    </p>
                    {priceValidation.estimatedTruePricePerKg && (
                      <p className="text-xs text-warning font-medium mt-1">
                        Estimated true cost: ~{formatPrice(priceValidation.estimatedTruePricePerKg, false)}/kg
                      </p>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Quick Features Bar */}
            <FilamentHeroQuickFeatures
              material={filament.material}
              easeOfPrintingScore={filament.ease_of_printing_score}
              strengthIndex={filament.strength_index}
              highSpeedCapable={filament.high_speed_capable}
              isAbrasive={filament.is_nozzle_abrasive}
            />
          </CardContent>
        </Card>

        {/* Retailers Modal */}
        <RetailersModal
          open={retailersModalOpen}
          onOpenChange={setRetailersModalOpen}
          productName={filament.product_title}
          retailers={retailers}
          onRetailerClick={handleRetailerClick}
        />

        {/* Sentinel for sticky buy bar trigger */}
        <div ref={heroSentinelRef} className="h-0" aria-hidden="true" />

        {/* Quick Summary Card - Key decision-making info */}
        <QuickSummaryCard
          quickFacts={[
            { label: 'Material', value: filament.material || 'Unknown' },
            { label: 'Weight', value: filament.net_weight_g ? `${filament.net_weight_g}g` : 'N/A' },
            { label: 'Diameter', value: filament.diameter_nominal_mm ? `${filament.diameter_nominal_mm}mm` : '1.75mm' },
            ...(filament.nozzle_temp_min_c && filament.nozzle_temp_max_c ? [{ label: 'Nozzle Temp', value: `${filament.nozzle_temp_min_c}-${filament.nozzle_temp_max_c}°C` }] : []),
            ...(filament.bed_temp_min_c && filament.bed_temp_max_c ? [{ label: 'Bed Temp', value: `${filament.bed_temp_min_c}-${filament.bed_temp_max_c}°C` }] : []),
            ...(filament.ease_of_printing_score ? [{ label: 'Ease Score', value: `${filament.ease_of_printing_score}/10` }] : []),
          ].slice(0, 6)}
          recommendation={{
            summary: getRecommendationSummary(filament),
            confidence: filament.ease_of_printing_score && filament.ease_of_printing_score >= 8 ? 'high' : 
                       filament.ease_of_printing_score && filament.ease_of_printing_score >= 6 ? 'medium' : 'low'
          }}
          perfectFor={getPerfectFor(filament)}
          notIdealFor={getNotIdealFor(filament)}
          standoutFeature={getStandoutFeature(filament)}
        />

        <Card className="bg-card/50 border-border shadow-lg mb-8">
          <CardContent className="p-6 lg:p-8 space-y-6">
            {/* Spool Size Selector */}
            {availableWeights.length > 1 && (
              <SpoolSizeSelector
                weights={availableWeights}
                selectedWeight={selectedWeight}
                onSelectWeight={setSelectedWeight}
              />
            )}

            {/* Color Variants Section */}
            {colorVariants.length > 1 && (
              <div className="space-y-4">
                <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                  Available Colors ({selectedWeight 
                    ? colorVariants.filter(v => v.net_weight_g === selectedWeight).length 
                    : colorVariants.length
                  })
                  {selectedWeight && (
                    <span className="ml-2 text-xs font-normal text-primary">
                      in {selectedWeight >= 1000 ? `${selectedWeight / 1000}kg` : `${selectedWeight}g`}
                    </span>
                  )}
                </h3>
                <div className="flex flex-wrap gap-2.5">
                  {colorVariants
                    .filter(variant => !selectedWeight || variant.net_weight_g === selectedWeight)
                    .map((variant) => {
                    const baseName = getBaseProductName(filament.product_title);
                    const variantColor = getColorFromTitle(variant.product_title, baseName) || variant.color_family || 'View';
                    const isCurrentVariant = variant.id === filament.id;
                    
                    return (
                      <TooltipProvider key={variant.id}>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            {isCurrentVariant ? (
                              <div className="flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium bg-primary text-primary-foreground ring-2 ring-primary ring-offset-2 ring-offset-background cursor-default">
                                {variant.color_hex ? (
                                  <div 
                                    className="w-4 h-4 rounded-full border-2 border-primary-foreground/30 shadow-inner"
                                    style={{ 
                                      backgroundColor: normalizeColorHex(variant.color_hex),
                                      boxShadow: normalizeColorHex(variant.color_hex).toUpperCase() === '#FFFFFF' ? 'inset 0 0 0 1px rgba(0,0,0,0.15)' : undefined
                                    }}
                                  />
                                ) : (
                                  <div className="w-4 h-4 rounded-full bg-primary-foreground/30 border-2 border-primary-foreground/30" />
                                )}
                                {variantColor}
                              </div>
                            ) : (
                              <Link 
                                to={`/filament/${variant.id}`}
                                className="flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium bg-muted hover:bg-primary/20 hover:text-primary transition-colors"
                              >
                                {variant.color_hex ? (
                                  <div 
                                    className="w-4 h-4 rounded-full border border-border shadow-sm"
                                    style={{ 
                                      backgroundColor: normalizeColorHex(variant.color_hex),
                                      boxShadow: normalizeColorHex(variant.color_hex).toUpperCase() === '#FFFFFF' ? 'inset 0 0 0 1px rgba(0,0,0,0.15)' : undefined
                                    }}
                                  />
                                ) : (
                                  <div className="w-4 h-4 rounded-full bg-gradient-to-br from-muted-foreground/30 to-muted-foreground/10 border border-border" />
                                )}
                                {variantColor}
                              </Link>
                            )}
                          </TooltipTrigger>
                          <TooltipContent>
                            <div className="text-center">
                              <div className="font-medium">{variantColor}</div>
                              {variant.net_weight_g && (
                                <div className="text-xs text-muted-foreground">
                                  {variant.net_weight_g >= 1000 ? `${variant.net_weight_g / 1000}kg` : `${variant.net_weight_g}g`}
                                </div>
                              )}
                              {variant.color_hex ? (
                                <div className="text-xs font-mono text-muted-foreground">{variant.color_hex.toUpperCase()}</div>
                              ) : (
                                <div className="text-xs text-muted-foreground">No hex code</div>
                              )}
                              {variant.product_url && (
                                <div className="text-xs text-primary mt-1">Click to view</div>
                              )}
                            </div>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Material Value Proposition */}
            <MaterialValueProposition
              material={filament.material}
              productTitle={filament.product_title}
              filamentId={filament.id}
              vendor={filament.vendor}
              filament={filament}
              printer={selectedPrinter}
              hotend={compatibleHotends.length > 0 ? compatibleHotends[0] : null}
            />

            {/* Score Cards */}
            <ScoreCardsSection filament={filament} />

            {/* Common Mistakes Panel */}
            {filament.material && (
              <CommonMistakesPanel 
                material={filament.material} 
                compact 
                maxItems={3}
              />
            )}

            {/* Helpful Videos Section */}
            {filament.material && getVideosByMaterial(filament.material).length > 0 && (
              <div className="pt-4 border-t border-border">
                <h3 className="text-base font-semibold flex items-center gap-2 mb-4">
                  <PlayCircle className="w-4 h-4 text-primary" />
                  Helpful Videos for {filament.material}
                </h3>
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {getVideosByMaterial(filament.material).slice(0, 3).map(video => (
                    <VideoThumbnail
                      key={video.id}
                      videoId={video.id}
                    />
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
        {filament && id && (
          <SimilarMaterialsModule
            filamentId={id}
            material={filament.material}
            vendor={filament.vendor}
            currentPricePerKg={
              filament.variant_price && filament.net_weight_g
                ? filament.variant_price / (filament.net_weight_g / 1000)
                : null
            }
            currentScores={{
              ease_of_printing_score: filament.ease_of_printing_score,
              value_score: filament.value_score,
              strength_index: filament.strength_index,
              printability_index: filament.printability_index,
            }}
          />
        )}

        {/* Collapsible Content Sections */}
        <CollapsibleContentContainer 
          filament={filament} 
          className="my-8"
        />

        {/* Printer Compatibility Section - Featured & Dynamic */}
        {selectedPrinter && compatibility ? (
          <Card className="bg-gradient-to-br from-primary/10 via-card to-primary/5 border-primary/30 shadow-xl mb-8 animate-fade-in">
            <CardHeader className="bg-gradient-to-r from-primary/20 to-transparent border-b border-primary/20 pb-4">
              <CardTitle className="flex items-center gap-3 text-xl">
                <div className="p-2 bg-primary/20 rounded-lg">
                  <Printer className="w-6 h-6 text-primary" />
                </div>
                <div className="flex-1">
                  <div className="text-xl font-bold">Print Settings for Your Printer</div>
                  <div className="text-sm font-normal text-muted-foreground">
                    {typeof selectedPrinter.brand === 'object' && selectedPrinter.brand !== null && 'brand' in selectedPrinter.brand ? selectedPrinter.brand.brand : 'Selected Printer'} {selectedPrinter.model_name}
                  </div>
                </div>
                <CompatibilityBadge compatibility={compatibility} showIcon={true} />
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-6">
              {/* Quick Settings Grid - Most Important Info First */}
              <div className="grid md:grid-cols-2 gap-4">
                {/* Temperature & Nozzle Setup Combined */}
                <Card className="bg-gradient-to-br from-background to-background/50 border-border shadow-md hover:shadow-lg transition-shadow">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base flex items-center gap-2">
                      <Flame className="w-5 h-5 text-orange-500" />
                      Temperature & Nozzle Setup
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* Temperature Settings */}
                    <div className="grid grid-cols-2 gap-3">
                      <div className="p-3 bg-orange-500/10 rounded-lg border border-orange-500/20">
                        <div className="text-xs text-muted-foreground mb-1">🌡️ Nozzle</div>
                        <div className="text-xl font-bold text-orange-500">
                          {compatibility.recommendations.slicer.nozzle_temp_range}
                        </div>
                      </div>
                      <div className="p-3 bg-blue-500/10 rounded-lg border border-blue-500/20">
                        <div className="text-xs text-muted-foreground mb-1">🔥 Bed</div>
                        <div className="text-xl font-bold text-blue-500">
                          {compatibility.recommendations.slicer.bed_temp_range}
                        </div>
                      </div>
                    </div>

                    {/* Nozzle Recommendations */}
                    <div className="pt-3 border-t border-border space-y-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="text-xs text-muted-foreground mb-1">Recommended Sizes</div>
                          <div className="flex gap-1.5 flex-wrap">
                            {compatibility.recommendations.nozzle.size.map((size, i) => (
                              <Badge key={i} variant="secondary" className="text-sm font-bold px-2 py-0.5">
                                {size}
                              </Badge>
                            ))}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-xs text-muted-foreground mb-1">Material</div>
                          <Badge variant="default" className="text-xs font-semibold">
                            {compatibility.recommendations.nozzle.material}
                          </Badge>
                        </div>
                      </div>
                      {compatibility.recommendations.nozzle.notes && (
                        <p className="text-xs text-muted-foreground">
                          💡 {compatibility.recommendations.nozzle.notes}
                        </p>
                      )}
                    </div>
                  </CardContent>
                </Card>

                {/* Build Plate Card */}
                <Card className="bg-gradient-to-br from-background to-background/50 border-border shadow-md hover:shadow-lg transition-shadow">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base flex items-center gap-2">
                      <Package className="w-5 h-5 text-primary" />
                      Build Plate
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div>
                      <div className="text-xs text-muted-foreground mb-2">Recommended Types</div>
                      <div className="flex gap-2 flex-wrap">
                        {compatibility.recommendations.bed.plate_types.map((type, i) => (
                          <Badge key={i} variant="outline" className="text-sm">
                            {type}
                          </Badge>
                        ))}
                      </div>
                    </div>
                    {compatibility.recommendations.bed.notes && (
                      <p className="text-xs text-muted-foreground pt-2 border-t border-border">
                        💡 {compatibility.recommendations.bed.notes}
                      </p>
                    )}
                  </CardContent>
                </Card>
              </div>

              {/* Compatible Hotends - Full Width */}
              {compatibleHotends.length > 0 && (() => {
                // Group hotends by diameter
                const getDiameter = (hotend: typeof compatibleHotends[0]): string => {
                  const specs = hotend.specs as Record<string, any> | null;
                  if (specs?.diameter) {
                    const d = parseFloat(specs.diameter);
                    if (d === 0.2) return '0.2';
                    if (d === 0.4) return '0.4';
                    if (d === 0.6) return '0.6';
                    if (d === 0.8) return '0.8';
                    return 'other';
                  }
                  // Try to extract from name
                  const name = hotend.name.toLowerCase();
                  if (name.includes('0.2mm') || name.includes('0.2 mm')) return '0.2';
                  if (name.includes('0.4mm') || name.includes('0.4 mm')) return '0.4';
                  if (name.includes('0.6mm') || name.includes('0.6 mm')) return '0.6';
                  if (name.includes('0.8mm') || name.includes('0.8 mm')) return '0.8';
                  return 'other';
                };

                const grouped = compatibleHotends.reduce((acc, hotend) => {
                  const diameter = getDiameter(hotend);
                  if (!acc[diameter]) acc[diameter] = [];
                  acc[diameter].push(hotend);
                  return acc;
                }, {} as Record<string, typeof compatibleHotends>);

                const diameterOrder = ['0.2', '0.4', '0.6', '0.8', 'other'];
                const diameterLabels: Record<string, string> = {
                  '0.2': '0.2mm Nozzles',
                  '0.4': '0.4mm Nozzles',
                  '0.6': '0.6mm Nozzles',
                  '0.8': '0.8mm Nozzles',
                  'other': 'Other Sizes'
                };

                return (
                  <Collapsible defaultOpen={false} className="group">
                    <Card className="bg-gradient-to-br from-background to-background/50 border-border shadow-md">
                      <CollapsibleTrigger asChild>
                        <CardHeader className="pb-3 cursor-pointer hover:bg-muted/50 transition-colors">
                          <CardTitle className="text-base flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <Settings className="w-5 h-5 text-primary" />
                              Compatible Hotends
                              <Badge variant="secondary" className="text-xs">{compatibleHotends.length}</Badge>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-normal text-muted-foreground hidden sm:inline">🟢 Best • 🟠 Caution • 🔴 Not Recommended</span>
                              <ChevronDown className="w-4 h-4 text-muted-foreground transition-transform duration-300 ease-out group-data-[state=open]:rotate-180" />
                            </div>
                          </CardTitle>
                        </CardHeader>
                      </CollapsibleTrigger>
                      <CollapsibleContent className="data-[state=open]:animate-accordion-down data-[state=closed]:animate-accordion-up overflow-hidden">
                        <CardContent className="space-y-6 pt-0">
                      <TooltipProvider delayDuration={200}>
                        {diameterOrder.map((diameter) => {
                          const hotends = grouped[diameter];
                          if (!hotends || hotends.length === 0) return null;
                          
                          return (
                            <div key={diameter} className="space-y-3">
                              <h4 className="text-sm font-semibold text-muted-foreground border-b border-border pb-2">
                                {diameterLabels[diameter]} ({hotends.length})
                              </h4>
                              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                                {hotends.map((hotend) => {
                                  const specs = hotend.specs as Record<string, any> | null;
                                  return (
                                    <Tooltip key={hotend.id}>
                                      <TooltipTrigger asChild>
                                        <div 
                                          className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer ${
                                            hotend.compatibility.rating === 'green' ? 'bg-green-500/5 border-green-500/20 hover:bg-green-500/10' :
                                            hotend.compatibility.rating === 'orange' ? 'bg-orange-500/5 border-orange-500/20 hover:bg-orange-500/10' :
                                            'bg-red-500/5 border-red-500/20 hover:bg-red-500/10'
                                          } transition-colors`}
                                        >
                                          {/* Rating badge */}
                                          <AccessoryCompatibilityBadge 
                                            compatibility={hotend.compatibility} 
                                            compact 
                                            showIcon={true}
                                          />
                                          
                                          {/* Hotend image */}
                                          <div className="w-12 h-12 flex-shrink-0 rounded bg-muted/50 overflow-hidden">
                                            {hotend.image_url ? (
                                              <img 
                                                src={hotend.image_url} 
                                                alt={hotend.name}
                                                className="w-full h-full object-cover"
                                              />
                                            ) : (
                                              <div className="w-full h-full flex items-center justify-center">
                                                <Settings className="w-5 h-5 text-muted-foreground/50" />
                                              </div>
                                            )}
                                          </div>

                                          {/* Hotend info */}
                                          <div className="flex-1 min-w-0">
                                            <div className="text-sm font-medium truncate">{hotend.name}</div>
                                            <div className="text-xs text-muted-foreground truncate">
                                              {hotend.brand}
                                            </div>
                                            <div className="text-xs text-muted-foreground/80 truncate">
                                              {hotend.compatibility.reason}
                                            </div>
                                          </div>

                                          {/* Action links */}
                                          <div className="flex flex-col gap-1 flex-shrink-0">
                                            <Link 
                                              to={`/hotends/${hotend.id}`}
                                              className="p-1.5 hover:bg-muted rounded text-muted-foreground hover:text-foreground transition-colors"
                                              onClick={(e) => e.stopPropagation()}
                                            >
                                              <ExternalLink className="w-4 h-4" />
                                            </Link>
                                            {hotend.product_url && (
                                              <a 
                                                href={getAffiliateUrl(hotend.product_url, hotend.brand) || hotend.product_url}
                                                target="_blank" 
                                                rel="noopener noreferrer"
                                                className="p-1.5 hover:bg-muted rounded text-muted-foreground hover:text-foreground transition-colors"
                                                onClick={(e) => e.stopPropagation()}
                                              >
                                                <Store className="w-4 h-4" />
                                              </a>
                                            )}
                                          </div>
                                        </div>
                                      </TooltipTrigger>
                                      <TooltipContent side="top" className="max-w-xs p-3">
                                        <div className="space-y-2">
                                          <div className="font-semibold text-sm">{hotend.name}</div>
                                          <div className={`text-xs font-medium ${
                                            hotend.compatibility.rating === 'green' ? 'text-green-500' :
                                            hotend.compatibility.rating === 'orange' ? 'text-orange-500' :
                                            'text-red-500'
                                          }`}>
                                            {hotend.compatibility.rating === 'green' ? '✓ Recommended' : 
                                             hotend.compatibility.rating === 'orange' ? '⚠ Use with caution' : 
                                             '✗ Not recommended'}
                                          </div>
                                          <p className="text-xs text-muted-foreground">{hotend.compatibility.reason}</p>
                                          {hotend.compatibility.details && hotend.compatibility.details.length > 0 && (
                                            <ul className="text-xs text-muted-foreground list-disc list-inside">
                                              {hotend.compatibility.details.map((detail, i) => (
                                                <li key={i}>{detail}</li>
                                              ))}
                                            </ul>
                                          )}
                                          {specs && (
                                            <div className="pt-2 border-t border-border space-y-1">
                                              <div className="text-[10px] text-muted-foreground font-medium uppercase">Specifications</div>
                                              {specs.max_temp && (
                                                <div className="text-xs flex justify-between">
                                                  <span className="text-muted-foreground">Max Temp:</span>
                                                  <span>{specs.max_temp}°C</span>
                                                </div>
                                              )}
                                              {specs.diameter && (
                                                <div className="text-xs flex justify-between">
                                                  <span className="text-muted-foreground">Diameter:</span>
                                                  <span>{specs.diameter}mm</span>
                                                </div>
                                              )}
                                              {specs.material && (
                                                <div className="text-xs flex justify-between">
                                                  <span className="text-muted-foreground">Material:</span>
                                                  <span>{specs.material}</span>
                                                </div>
                                              )}
                                              {specs.hardened !== undefined && (
                                                <div className="text-xs flex justify-between">
                                                  <span className="text-muted-foreground">Hardened:</span>
                                                  <span>{specs.hardened ? 'Yes' : 'No'}</span>
                                                </div>
                                              )}
                                            </div>
                                          )}
                                          {hotend.price && (
                                            <div className="pt-2 border-t border-border">
                                              <div className="text-xs flex justify-between">
                                                <span className="text-muted-foreground">Price:</span>
                                                <span className="font-medium">${hotend.price} USD</span>
                                              </div>
                                            </div>
                                          )}
                                        </div>
                                      </TooltipContent>
                                    </Tooltip>
                                  );
                                })}
                              </div>
                            </div>
                          );
                        })}
                      </TooltipProvider>
                        </CardContent>
                      </CollapsibleContent>
                    </Card>
                  </Collapsible>
                );
              })()}

              {/* Compatible Build Plates - Full Width */}
              {compatibleBuildPlates.length > 0 && (
                <Collapsible defaultOpen={false} className="group">
                  <Card className="bg-gradient-to-br from-background to-background/50 border-border shadow-md">
                    <CollapsibleTrigger asChild>
                      <CardHeader className="pb-3 cursor-pointer hover:bg-muted/50 transition-colors">
                        <CardTitle className="text-base flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Package className="w-5 h-5 text-primary" />
                            Compatible Build Plates
                            <Badge variant="secondary" className="text-xs">{compatibleBuildPlates.length}</Badge>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-normal text-muted-foreground hidden sm:inline">🟢 Best • 🟠 Check • 🔴 Not Ideal</span>
                            <ChevronDown className="w-4 h-4 text-muted-foreground transition-transform duration-300 ease-out group-data-[state=open]:rotate-180" />
                          </div>
                        </CardTitle>
                      </CardHeader>
                    </CollapsibleTrigger>
                    <CollapsibleContent className="data-[state=open]:animate-accordion-down data-[state=closed]:animate-accordion-up overflow-hidden">
                      <CardContent className="pt-0">
                    <TooltipProvider delayDuration={200}>
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                        {compatibleBuildPlates.map((plate) => {
                          const specs = plate.specs as Record<string, any> | null;
                          return (
                            <Tooltip key={plate.id}>
                              <TooltipTrigger asChild>
                                <div 
                                  className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer ${
                                    plate.compatibility.rating === 'green' ? 'bg-green-500/5 border-green-500/20 hover:bg-green-500/10' :
                                    plate.compatibility.rating === 'orange' ? 'bg-orange-500/5 border-orange-500/20 hover:bg-orange-500/10' :
                                    'bg-red-500/5 border-red-500/20 hover:bg-red-500/10'
                                  } transition-colors`}
                                >
                                  {/* Rating badge */}
                                  <AccessoryCompatibilityBadge 
                                    compatibility={plate.compatibility} 
                                    compact 
                                    showIcon={true}
                                  />
                                  
                                  {/* Plate image */}
                                  <div className="w-12 h-12 flex-shrink-0 rounded bg-muted/50 overflow-hidden">
                                    {plate.image_url ? (
                                      <img 
                                        src={plate.image_url} 
                                        alt={plate.name}
                                        className="w-full h-full object-cover"
                                      />
                                    ) : (
                                      <div className="w-full h-full flex items-center justify-center">
                                        <Package className="w-5 h-5 text-muted-foreground/50" />
                                      </div>
                                    )}
                                  </div>

                                  {/* Plate info */}
                                  <div className="flex-1 min-w-0">
                                    <div className="text-sm font-medium truncate">{plate.name}</div>
                                    <div className="text-xs text-muted-foreground truncate">
                                      {plate.brand}
                                    </div>
                                    <div className="text-xs text-muted-foreground/80 truncate">
                                      {plate.compatibility.reason}
                                    </div>
                                  </div>

                                  {/* Action links */}
                                  <div className="flex flex-col gap-1 flex-shrink-0">
                                    <Link 
                                      to={`/build-plates/${plate.id}`}
                                      className="p-1.5 hover:bg-muted rounded text-muted-foreground hover:text-foreground transition-colors"
                                      onClick={(e) => e.stopPropagation()}
                                    >
                                      <ExternalLink className="w-4 h-4" />
                                    </Link>
                                    {plate.product_url && (
                                      <a 
                                        href={getAffiliateUrl(plate.product_url, plate.brand) || plate.product_url}
                                        target="_blank" 
                                        rel="noopener noreferrer"
                                        className="p-1.5 hover:bg-muted rounded text-muted-foreground hover:text-foreground transition-colors"
                                        onClick={(e) => e.stopPropagation()}
                                      >
                                        <Store className="w-4 h-4" />
                                      </a>
                                    )}
                                  </div>
                                </div>
                              </TooltipTrigger>
                              <TooltipContent side="top" className="max-w-xs p-3">
                                <div className="space-y-2">
                                  <div className="font-semibold text-sm">{plate.name}</div>
                                  <div className={`text-xs font-medium ${
                                    plate.compatibility.rating === 'green' ? 'text-green-500' :
                                    plate.compatibility.rating === 'orange' ? 'text-orange-500' :
                                    'text-red-500'
                                  }`}>
                                    {plate.compatibility.rating === 'green' ? '✓ Recommended' : 
                                     plate.compatibility.rating === 'orange' ? '⚠ Use with caution' : 
                                     '✗ Not recommended'}
                                  </div>
                                  <p className="text-xs text-muted-foreground">{plate.compatibility.reason}</p>
                                  {plate.compatibility.details && plate.compatibility.details.length > 0 && (
                                    <ul className="text-xs text-muted-foreground list-disc list-inside">
                                      {plate.compatibility.details.map((detail, i) => (
                                        <li key={i}>{detail}</li>
                                      ))}
                                    </ul>
                                  )}
                                  {specs && (
                                    <div className="pt-2 border-t border-border space-y-1">
                                      <div className="text-[10px] text-muted-foreground font-medium uppercase">Specifications</div>
                                      {specs.surface_type && (
                                        <div className="text-xs flex justify-between">
                                          <span className="text-muted-foreground">Surface:</span>
                                          <span>{specs.surface_type}</span>
                                        </div>
                                      )}
                                      {specs.max_temp_c && (
                                        <div className="text-xs flex justify-between">
                                          <span className="text-muted-foreground">Max Temp:</span>
                                          <span>{specs.max_temp_c}°C</span>
                                        </div>
                                      )}
                                      {(specs.size_x_mm && specs.size_y_mm) && (
                                        <div className="text-xs flex justify-between">
                                          <span className="text-muted-foreground">Size:</span>
                                          <span>{specs.size_x_mm}×{specs.size_y_mm}mm</span>
                                        </div>
                                      )}
                                    </div>
                                  )}
                                  {plate.price && (
                                    <div className="pt-2 border-t border-border">
                                      <div className="text-xs flex justify-between">
                                        <span className="text-muted-foreground">Price:</span>
                                        <span className="font-medium">${plate.price} USD</span>
                                      </div>
                                    </div>
                                  )}
                                </div>
                              </TooltipContent>
                            </Tooltip>
                          );
                        })}
                      </div>
                    </TooltipProvider>
                      </CardContent>
                    </CollapsibleContent>
                  </Card>
                </Collapsible>
              )}

              {/* Compatible AMS/MMU Systems - Full Width */}
              {compatibleAms.length > 0 && (
                <Collapsible defaultOpen={false} className="group">
                  <Card className="bg-gradient-to-br from-background to-background/50 border-border shadow-md">
                    <CollapsibleTrigger asChild>
                      <CardHeader className="pb-3 cursor-pointer hover:bg-muted/50 transition-colors">
                        <CardTitle className="text-base flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Package className="w-5 h-5 text-primary" />
                            Compatible AMS/MMU Systems
                            <Badge variant="secondary" className="text-xs">{compatibleAms.length}</Badge>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-normal text-muted-foreground hidden sm:inline">🟢 Ideal • 🟠 Considerations • 🔴 Challenges</span>
                            <ChevronDown className="w-4 h-4 text-muted-foreground transition-transform duration-300 ease-out group-data-[state=open]:rotate-180" />
                          </div>
                        </CardTitle>
                      </CardHeader>
                    </CollapsibleTrigger>
                    <CollapsibleContent className="data-[state=open]:animate-accordion-down data-[state=closed]:animate-accordion-up overflow-hidden">
                      <CardContent className="pt-0">
                    <TooltipProvider delayDuration={200}>
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                        {compatibleAms.map((ams) => {
                          const specs = ams.specs as Record<string, any> | null;
                          return (
                            <Tooltip key={ams.id}>
                              <TooltipTrigger asChild>
                                <div 
                                  className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer ${
                                    ams.compatibility.rating === 'green' ? 'bg-green-500/5 border-green-500/20 hover:bg-green-500/10' :
                                    ams.compatibility.rating === 'orange' ? 'bg-orange-500/5 border-orange-500/20 hover:bg-orange-500/10' :
                                    'bg-red-500/5 border-red-500/20 hover:bg-red-500/10'
                                  } transition-colors`}
                                >
                                  {/* Rating badge */}
                                  <AccessoryCompatibilityBadge 
                                    compatibility={ams.compatibility} 
                                    compact 
                                    showIcon={true}
                                  />
                                  
                                  {/* AMS image */}
                                  <div className="w-12 h-12 flex-shrink-0 rounded bg-muted/50 overflow-hidden">
                                    {ams.image_url ? (
                                      <img 
                                        src={ams.image_url} 
                                        alt={ams.name}
                                        className="w-full h-full object-cover"
                                      />
                                    ) : (
                                      <div className="w-full h-full flex items-center justify-center">
                                        <Package className="w-5 h-5 text-muted-foreground/50" />
                                      </div>
                                    )}
                                  </div>

                                  {/* AMS info */}
                                  <div className="flex-1 min-w-0">
                                    <div className="text-sm font-medium truncate">{ams.name}</div>
                                    <div className="text-xs text-muted-foreground truncate">
                                      {ams.brand}
                                    </div>
                                    <div className="text-xs text-muted-foreground/80 truncate">
                                      {ams.compatibility.reason}
                                    </div>
                                  </div>

                                  {/* Action links */}
                                  <div className="flex flex-col gap-1 flex-shrink-0">
                                    <Link 
                                      to={`/ams/${ams.id}`}
                                      className="p-1.5 hover:bg-muted rounded text-muted-foreground hover:text-foreground transition-colors"
                                      onClick={(e) => e.stopPropagation()}
                                    >
                                      <ExternalLink className="w-4 h-4" />
                                    </Link>
                                    {ams.product_url && (
                                      <a 
                                        href={getAffiliateUrl(ams.product_url, ams.brand) || ams.product_url}
                                        target="_blank" 
                                        rel="noopener noreferrer"
                                        className="p-1.5 hover:bg-muted rounded text-muted-foreground hover:text-foreground transition-colors"
                                        onClick={(e) => e.stopPropagation()}
                                      >
                                        <Store className="w-4 h-4" />
                                      </a>
                                    )}
                                  </div>
                                </div>
                              </TooltipTrigger>
                              <TooltipContent side="top" className="max-w-xs p-3">
                                <div className="space-y-2">
                                  <div className="font-semibold text-sm">{ams.name}</div>
                                  <div className={`text-xs font-medium ${
                                    ams.compatibility.rating === 'green' ? 'text-green-500' :
                                    ams.compatibility.rating === 'orange' ? 'text-orange-500' :
                                    'text-red-500'
                                  }`}>
                                    {ams.compatibility.rating === 'green' ? '✓ Recommended' : 
                                     ams.compatibility.rating === 'orange' ? '⚠ Considerations' : 
                                     '✗ Not ideal'}
                                  </div>
                                  <p className="text-xs text-muted-foreground">{ams.compatibility.reason}</p>
                                  {ams.compatibility.details && ams.compatibility.details.length > 0 && (
                                    <ul className="text-xs text-muted-foreground list-disc list-inside">
                                      {ams.compatibility.details.map((detail, i) => (
                                        <li key={i}>{detail}</li>
                                      ))}
                                    </ul>
                                  )}
                                  {specs && (
                                    <div className="pt-2 border-t border-border space-y-1">
                                      <div className="text-[10px] text-muted-foreground font-medium uppercase">Features</div>
                                      {specs.spool_capacity && (
                                        <div className="text-xs flex justify-between">
                                          <span className="text-muted-foreground">Capacity:</span>
                                          <span>{specs.spool_capacity} spools</span>
                                        </div>
                                      )}
                                      {specs.drying_capability !== undefined && (
                                        <div className="text-xs flex justify-between">
                                          <span className="text-muted-foreground">Drying:</span>
                                          <span>{specs.drying_capability ? '✓ Yes' : '✗ No'}</span>
                                        </div>
                                      )}
                                      {specs.max_spool_weight_g && (
                                        <div className="text-xs flex justify-between">
                                          <span className="text-muted-foreground">Max Spool:</span>
                                          <span>{specs.max_spool_weight_g}g</span>
                                        </div>
                                      )}
                                    </div>
                                  )}
                                  {ams.price && (
                                    <div className="pt-2 border-t border-border">
                                      <div className="text-xs flex justify-between">
                                        <span className="text-muted-foreground">Price:</span>
                                        <span className="font-medium">${ams.price} USD</span>
                                      </div>
                                    </div>
                                  )}
                                </div>
                              </TooltipContent>
                            </Tooltip>
                          );
                        })}
                      </div>
                    </TooltipProvider>
                      </CardContent>
                    </CollapsibleContent>
                  </Card>
                </Collapsible>
              )}

              {/* Limitations & Warnings */}
              {(compatibility.limitations.length > 0 || compatibility.recommendations.warnings.length > 0) && (
                <div className="grid md:grid-cols-2 gap-4">
                  {compatibility.limitations.length > 0 && (
                    <Card className="bg-destructive/5 border-destructive/20">
                      <CardHeader className="pb-3">
                        <CardTitle className="text-base flex items-center gap-2 text-destructive">
                          <AlertTriangle className="w-5 h-5" />
                          Limitations
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <ul className="space-y-2">
                          {compatibility.limitations.map((limitation, index) => (
                            <li key={index} className="text-sm flex items-start gap-2">
                              <span className="text-destructive mt-0.5 font-bold">✗</span>
                              <span>{limitation}</span>
                            </li>
                          ))}
                        </ul>
                      </CardContent>
                    </Card>
                  )}

                  {compatibility.recommendations.warnings.length > 0 && (
                    <Card className="bg-yellow-500/5 border-yellow-500/20">
                      <CardHeader className="pb-3">
                        <CardTitle className="text-base flex items-center gap-2 text-yellow-600">
                          <AlertTriangle className="w-5 h-5" />
                          Warnings
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <ul className="space-y-2">
                          {compatibility.recommendations.warnings.map((warning, index) => (
                            <li key={index} className="text-sm flex items-start gap-2">
                              <span className="text-yellow-600 mt-0.5 font-bold">⚠</span>
                              <span>{warning}</span>
                            </li>
                          ))}
                        </ul>
                      </CardContent>
                    </Card>
                  )}
                </div>
              )}

              {/* Slicer Notes */}
              {compatibility.recommendations.slicer.notes.length > 0 && (
                <Card className="bg-primary/5 border-primary/20">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base flex items-center gap-2">
                      <Settings className="w-5 h-5 text-primary" />
                      Additional Slicer Settings
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2">
                      {compatibility.recommendations.slicer.notes.map((note, index) => (
                        <li key={index} className="text-sm flex items-start gap-2">
                          <span className="text-primary mt-0.5 font-bold">•</span>
                          <span>{note}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              )}

              {/* Action Buttons */}
              <div className="flex gap-3 pt-2 flex-wrap">
                <Button variant="outline" asChild>
                  <Link to="/">
                    <Printer className="w-4 h-4 mr-2" />
                    Change Printer
                  </Link>
                </Button>
                <Button variant="outline" asChild>
                  <Link to="/matrix">
                    View Full Compatibility Matrix
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : !printerLoading && !selectedPrinter && (
          <Card className="bg-gradient-to-br from-muted/30 to-muted/10 border-dashed border-2 border-border mb-8 animate-fade-in hover:border-primary/30 transition-colors">
            <CardContent className="p-8 text-center">
              <div className="p-4 bg-primary/10 rounded-full w-20 h-20 mx-auto mb-4 flex items-center justify-center">
                <Printer className="w-10 h-10 text-primary" />
              </div>
              <h3 className="text-xl font-bold mb-2">Select Your Printer for Custom Settings</h3>
              <p className="text-muted-foreground mb-4 max-w-md mx-auto">
                Get personalized temperature ranges, nozzle recommendations, and build plate suggestions specifically for this filament
              </p>
              <Button size="lg" asChild className="hover:scale-105 transition-transform">
                <Link to="/">
                  <Printer className="w-4 h-4 mr-2" />
                  Select Your Printer
                </Link>
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Tabs Section */}
        <Tabs defaultValue="specs" className="space-y-8">
          <TabsList className="bg-muted/50 p-1.5 h-auto flex-wrap gap-1">
            <TabsTrigger value="specs" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground px-4 py-2.5 text-sm font-medium">
              <Package className="w-4 h-4 mr-2" />
              Technical Specs
            </TabsTrigger>
            <TabsTrigger value="printing" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground px-4 py-2.5 text-sm font-medium">
              <Printer className="w-4 h-4 mr-2" />
              Print Settings
            </TabsTrigger>
            <TabsTrigger value="properties" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground px-4 py-2.5 text-sm font-medium">
              <Award className="w-4 h-4 mr-2" />
              Material Properties
            </TabsTrigger>
            <TabsTrigger value="compatibility" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground px-4 py-2.5 text-sm font-medium">
              <Shield className="w-4 h-4 mr-2" />
              Compatibility
            </TabsTrigger>
          </TabsList>

          {/* Technical Specs Tab */}
          <TabsContent value="specs" className="space-y-8 animate-fade-in">
            <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-6">
              {/* Physical Properties */}
              <Card className="bg-card border-border hover:shadow-lg transition-shadow">
                <CardHeader className="pb-4">
                  <CardTitle className="flex items-center gap-2.5 text-lg font-semibold">
                    <Ruler className="w-5 h-5 text-primary" />
                    Physical Specifications
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-1">
                  {filament.diameter_nominal_mm && (
                    <PropertyRow label="Filament Diameter" value={`${filament.diameter_nominal_mm} mm`} icon={<Ruler className="w-4 h-4" />} />
                  )}
                  {filament.net_weight_g && (
                    <PropertyRow label="Net Weight" value={`${filament.net_weight_g}g (${(filament.net_weight_g / 1000).toFixed(2)}kg)`} icon={<Package className="w-4 h-4" />} />
                  )}
                  {filament.density_g_cm3 && (
                    <PropertyRow label="Material Density" value={`${filament.density_g_cm3} g/cm³`} />
                  )}
                  {filament.dimensional_accuracy_score && (
                    <PropertyRow label="Dimensional Accuracy" value={`${filament.dimensional_accuracy_score}/10`} highlight />
                  )}
                </CardContent>
              </Card>

              {/* Spool Dimensions */}
              <Card className="bg-card border-border hover:shadow-lg transition-shadow">
                <CardHeader className="pb-4">
                  <CardTitle className="flex items-center gap-2.5 text-lg font-semibold">
                    <Package className="w-5 h-5 text-primary" />
                    Spool Specifications
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-1">
                  {filament.spool_outer_d_mm && (
                    <PropertyRow label="Outer Diameter" value={`${filament.spool_outer_d_mm} mm`} />
                  )}
                  {filament.spool_width_mm && (
                    <PropertyRow label="Spool Width" value={`${filament.spool_width_mm} mm`} />
                  )}
                  {filament.spool_ams_fit !== null && (
                    <PropertyRow 
                      label="AMS/MMU Compatible" 
                      value={filament.spool_ams_fit ? "✓ Yes" : "✗ No"} 
                      highlight={filament.spool_ams_fit}
                    />
                  )}
                  {filament.color_hex && (
                    <div className="flex justify-between items-center py-2">
                      <span className="text-sm text-muted-foreground">Color Code</span>
                      <div className="flex items-center gap-2">
                        <div 
                          className="w-8 h-8 rounded-lg border-2 border-border shadow-sm"
                          style={{ backgroundColor: normalizeColorHex(filament.color_hex) }}
                        />
                        <span className="text-sm font-mono text-foreground">{normalizeColorHex(filament.color_hex)}</span>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Product Information */}
              <Card className="bg-card border-border hover:shadow-lg transition-shadow">
                <CardHeader className="pb-4">
                  <CardTitle className="flex items-center gap-2.5 text-lg font-semibold">
                    <Settings className="w-5 h-5 text-primary" />
                    Product Details
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-1">
                  {filament.product_id && (
                    <PropertyRow label="Product ID" value={filament.product_id} />
                  )}
                  {filament.variant_sku && (
                    <PropertyRow label="SKU" value={filament.variant_sku} />
                  )}
                  {(filament as any).upc && (
                    <PropertyRow label="UPC" value={(filament as any).upc} />
                  )}
                  {(filament as any).ean && (
                    <PropertyRow label="EAN" value={(filament as any).ean} />
                  )}
                  {(filament as any).gtin && (
                    <PropertyRow label="GTIN" value={(filament as any).gtin} />
                  )}
                  {(filament as any).mpn && (
                    <PropertyRow label="MPN" value={(filament as any).mpn} />
                  )}
                  {filament.variant_available !== null && (
                    <PropertyRow 
                      label="Stock Status" 
                      value={filament.variant_available ? "✓ In Stock" : "✗ Out of Stock"} 
                      highlight={filament.variant_available}
                    />
                  )}
                  {filament.published_at && (
                    <PropertyRow 
                      label="Published" 
                      value={new Date(filament.published_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })} 
                    />
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Performance at a Glance */}
            <PerformanceAtAGlance
              filamentId={filament.id}
              filamentName={filament.product_title}
              material={filament.material}
              vendor={filament.vendor}
              ease_of_printing_score={filament.ease_of_printing_score}
              printability_index={filament.printability_index}
              strength_index={filament.strength_index}
              value_score={filament.value_score}
              variant_price={filament.variant_price}
              net_weight_g={filament.net_weight_g}
            />
          </TabsContent>

          {/* Print Settings Tab */}
          <TabsContent value="printing" className="space-y-8 animate-fade-in">
            <div className="grid md:grid-cols-2 gap-6">
              {/* Temperature Settings */}
              <Card className="bg-card border-border hover:shadow-lg transition-shadow">
                <CardHeader className="pb-4">
                  <CardTitle className="flex items-center gap-2.5 text-lg font-semibold">
                    <Flame className="w-5 h-5 text-primary" />
                    Temperature Settings
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-1">
                  {(filament.nozzle_temp_min_c || filament.nozzle_temp_max_c) && (
                    <PropertyRow
                      label="Nozzle Temperature Range"
                      value={`${filament.nozzle_temp_min_c || "?"} - ${filament.nozzle_temp_max_c || "?"}°C`}
                      icon={<ThermometerSun className="w-4 h-4" />}
                    />
                  )}
                  {filament.nozzle_temp_sweetspot_c && (
                    <PropertyRow
                      label="🎯 Recommended Nozzle Temp"
                      value={`${filament.nozzle_temp_sweetspot_c}°C`}
                      highlight
                    />
                  )}
                  {(filament.bed_temp_min_c || filament.bed_temp_max_c) && (
                    <PropertyRow
                      label="Bed Temperature Range"
                      value={`${filament.bed_temp_min_c || "?"} - ${filament.bed_temp_max_c || "?"}°C`}
                      icon={<Flame className="w-4 h-4" />}
                    />
                  )}
                  {filament.tg_c && (
                    <PropertyRow label="Glass Transition (Tg)" value={`${filament.tg_c}°C`} />
                  )}
                  {filament.melt_temp_c && (
                    <PropertyRow label="Melt Temperature" value={`${filament.melt_temp_c}°C`} />
                  )}
                </CardContent>
              </Card>

              {/* Print Parameters */}
              <Card className="bg-card border-border hover:shadow-lg transition-shadow">
                <CardHeader className="pb-4">
                  <CardTitle className="flex items-center gap-2.5 text-lg font-semibold">
                    <Zap className="w-5 h-5 text-primary" />
                    Print Parameters
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-1">
                  {filament.print_speed_max_mms && (
                    <PropertyRow
                      label="Maximum Print Speed"
                      value={`${filament.print_speed_max_mms} mm/s`}
                      icon={<Gauge className="w-4 h-4" />}
                    />
                  )}
                  {(filament.fan_min_percent !== null || filament.fan_max_percent !== null) && (
                    <PropertyRow
                      label="Cooling Fan Range"
                      value={`${filament.fan_min_percent || 0}% - ${filament.fan_max_percent || 100}%`}
                      icon={<Wind className="w-4 h-4" />}
                    />
                  )}
                  {filament.recommended_nozzle_type && (
                    <PropertyRow
                      label="🎯 Recommended Nozzle / Hotend"
                      value={filament.recommended_nozzle_type}
                      highlight
                    />
                  )}
                  {filament.is_nozzle_abrasive !== null && (
                    <PropertyRow
                      label="Nozzle Requirement"
                      value={filament.is_nozzle_abrasive ? "⚠️ Hardened Steel Required" : "✓ Brass Compatible"}
                      highlight={!filament.is_nozzle_abrasive}
                    />
                  )}
                </CardContent>
              </Card>

              {/* Moisture & Care */}
              <Card className="bg-card border-border md:col-span-2 hover:shadow-lg transition-shadow">
                <CardHeader className="pb-4">
                  <CardTitle className="flex items-center gap-2.5 text-lg font-semibold">
                    <Droplets className="w-5 h-5 text-primary" />
                    Moisture Management & Care
                  </CardTitle>
                </CardHeader>
                <CardContent className="grid md:grid-cols-3 gap-6">
                  <div className="space-y-1">
                    {filament.moisture_sensitivity_level && (
                      <PropertyRow
                        label="Moisture Sensitivity"
                        value={filament.moisture_sensitivity_level}
                        icon={<Droplets className="w-4 h-4" />}
                      />
                    )}
                    {filament.drying_temp_c && (
                      <PropertyRow
                        label="Drying Temperature"
                        value={`${filament.drying_temp_c}°C`}
                        icon={<ThermometerSun className="w-4 h-4" />}
                      />
                    )}
                    {filament.drying_time_hours && (
                      <PropertyRow
                        label="Drying Duration"
                        value={`${filament.drying_time_hours} hours`}
                        icon={<Clock className="w-4 h-4" />}
                      />
                    )}
                  </div>
                  {(filament.moisture_care || filament.nozzle_care) && (
                    <div className="md:col-span-2 space-y-4">
                      {filament.moisture_care && (
                        <div className="bg-muted/30 p-4 rounded-lg">
                          <h4 className="font-semibold text-foreground mb-2 flex items-center gap-2">
                            <Droplets className="w-4 h-4 text-primary" />
                            Storage Instructions
                          </h4>
                          <p className="text-sm text-muted-foreground leading-relaxed">{filament.moisture_care}</p>
                        </div>
                      )}
                      {filament.nozzle_care && (
                        <div className="bg-muted/30 p-4 rounded-lg">
                          <h4 className="font-semibold text-foreground mb-2 flex items-center gap-2">
                            <Settings className="w-4 h-4 text-primary" />
                            Nozzle Care Tips
                          </h4>
                          <p className="text-sm text-muted-foreground leading-relaxed">{filament.nozzle_care}</p>
                        </div>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Material Properties Tab */}
          <TabsContent value="properties" className="space-y-8 animate-fade-in">
            <div className="grid md:grid-cols-2 gap-6">
              {/* Mechanical Properties */}
              <Card className="bg-card border-border hover:shadow-lg transition-shadow">
                <CardHeader className="pb-4">
                  <CardTitle className="flex items-center gap-2.5 text-lg font-semibold">
                    <Award className="w-5 h-5 text-primary" />
                    Mechanical Properties
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-1">
                  {filament.tensile_strength_xy_mpa && (
                    <PropertyRow
                      label="Tensile Strength (XY)"
                      value={`${filament.tensile_strength_xy_mpa} MPa`}
                      highlight
                    />
                  )}
                  {filament.tensile_modulus_xy_mpa && (
                    <PropertyRow
                      label="Tensile Modulus (XY)"
                      value={`${filament.tensile_modulus_xy_mpa} MPa`}
                    />
                  )}
                  {filament.flexural_strength_mpa && (
                    <PropertyRow
                      label="Flexural Strength"
                      value={`${filament.flexural_strength_mpa} MPa`}
                    />
                  )}
                  {filament.elongation_break_xy_percent && (
                    <PropertyRow
                      label="Elongation at Break"
                      value={`${filament.elongation_break_xy_percent}%`}
                    />
                  )}
                  {filament.shore_hardness_d && (
                    <PropertyRow
                      label="Shore Hardness (D)"
                      value={`${filament.shore_hardness_d}D`}
                    />
                  )}
                </CardContent>
              </Card>

              {/* Thermal Properties */}
              <Card className="bg-card border-border hover:shadow-lg transition-shadow">
                <CardHeader className="pb-4">
                  <CardTitle className="flex items-center gap-2.5 text-lg font-semibold">
                    <ThermometerSun className="w-5 h-5 text-primary" />
                    Thermal Properties
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-1">
                  {filament.tg_c && (
                    <PropertyRow
                      label="Glass Transition Temp"
                      value={`${filament.tg_c}°C`}
                      highlight
                    />
                  )}
                  {filament.melt_temp_c && (
                    <PropertyRow
                      label="Melt Temperature"
                      value={`${filament.melt_temp_c}°C`}
                    />
                  )}
                  {filament.nozzle_temp_sweetspot_c && (
                    <PropertyRow
                      label="Optimal Print Temp"
                      value={`${filament.nozzle_temp_sweetspot_c}°C`}
                    />
                  )}
                  {filament.bed_temp_min_c && filament.bed_temp_max_c && (
                    <PropertyRow
                      label="Recommended Bed Temp"
                      value={`${Math.round((filament.bed_temp_min_c + filament.bed_temp_max_c) / 2)}°C`}
                    />
                  )}
                </CardContent>
              </Card>

              {/* Wood Properties - Only show for wood filaments */}
              {((filament as any).wood_powder_percentage !== null && (filament as any).wood_powder_percentage !== undefined) && (
                <Card className="bg-gradient-to-br from-amber-500/5 to-orange-500/5 border-amber-500/20 hover:shadow-lg transition-shadow md:col-span-2">
                  <CardHeader className="pb-4">
                    <CardTitle className="flex items-center gap-2.5 text-lg font-semibold">
                      <span className="text-2xl">🪵</span>
                      Wood Composition
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
                      {/* Wood Powder Percentage */}
                      <div className="p-4 bg-amber-500/10 rounded-lg border border-amber-500/20">
                        <div className="text-xs text-muted-foreground mb-1">Wood Content</div>
                        <div className="text-2xl font-bold text-amber-600">
                          {(filament as any).wood_powder_percentage}%
                        </div>
                        <div className="text-xs text-muted-foreground mt-1">wood powder/fiber</div>
                      </div>
                      
                      {/* Wood Type */}
                      {(filament as any).wood_type && (
                        <div className="p-4 bg-orange-500/10 rounded-lg border border-orange-500/20">
                          <div className="text-xs text-muted-foreground mb-1">Wood Type</div>
                          <div className="text-lg font-semibold text-orange-600">
                            {(filament as any).wood_type}
                          </div>
                        </div>
                      )}
                      
                      {/* Particle Size */}
                      {(filament as any).wood_particle_size_microns && (
                        <div className="p-4 bg-background rounded-lg border border-border">
                          <div className="text-xs text-muted-foreground mb-1">Particle Size</div>
                          <div className="text-lg font-semibold">
                            {(filament as any).wood_particle_size_microns} µm
                          </div>
                        </div>
                      )}
                      
                      {/* Fiber Length */}
                      {(filament as any).wood_fiber_length_mm && (
                        <div className="p-4 bg-background rounded-lg border border-border">
                          <div className="text-xs text-muted-foreground mb-1">Fiber Length</div>
                          <div className="text-lg font-semibold">
                            {(filament as any).wood_fiber_length_mm} mm
                          </div>
                        </div>
                      )}
                      
                      {/* Scent Level */}
                      {(filament as any).wood_scent_level && (
                        <div className="p-4 bg-background rounded-lg border border-border">
                          <div className="text-xs text-muted-foreground mb-1">Wood Scent</div>
                          <div className="text-lg font-semibold">
                            {(filament as any).wood_scent_level}
                          </div>
                        </div>
                      )}
                    </div>
                    
                    {/* Wood-specific tips */}
                    <div className="mt-4 p-4 bg-muted/30 rounded-lg">
                      <h4 className="font-semibold text-foreground mb-2 flex items-center gap-2">
                        <span>💡</span> Wood Filament Tips
                      </h4>
                      <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
                        <li>Use a larger nozzle (≥0.5mm) to prevent clogging from wood particles</li>
                        <li>Vary temperature between layers for a realistic wood grain effect</li>
                        <li>Post-process with sandpaper, stain, or wood finish for enhanced appearance</li>
                        {(filament as any).wood_powder_percentage >= 30 && (
                          <li>High wood content — expect more brittle prints, ideal for decorative pieces</li>
                        )}
                      </ul>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Glass Fiber Properties - Only show for GF filaments */}
              {((filament as any).glass_fiber_percentage !== null && (filament as any).glass_fiber_percentage !== undefined) && (
                <Card className="bg-gradient-to-br from-cyan-500/5 to-blue-500/5 border-cyan-500/20 hover:shadow-lg transition-shadow md:col-span-2">
                  <CardHeader className="pb-4">
                    <CardTitle className="flex items-center gap-2.5 text-lg font-semibold">
                      <span className="text-2xl">🔷</span>
                      Glass Fiber Composition
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
                      {/* Glass Fiber Percentage */}
                      <div className="p-4 bg-cyan-500/10 rounded-lg border border-cyan-500/20">
                        <div className="text-xs text-muted-foreground mb-1">Glass Fiber Content</div>
                        <div className="text-2xl font-bold text-cyan-600">
                          {(filament as any).glass_fiber_percentage}%
                        </div>
                        <div className="text-xs text-muted-foreground mt-1">glass fiber reinforcement</div>
                      </div>
                    </div>
                    
                    {/* Glass fiber-specific tips */}
                    <div className="mt-4 p-4 bg-muted/30 rounded-lg">
                      <h4 className="font-semibold text-foreground mb-2 flex items-center gap-2">
                        <span>💡</span> Glass Fiber Filament Tips
                      </h4>
                      <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
                        <li>Use a hardened steel or ruby nozzle — glass fibers are highly abrasive</li>
                        <li>Print slower than standard materials to reduce nozzle wear</li>
                        <li>Expect increased stiffness and dimensional stability vs non-reinforced variants</li>
                        <li>Reduced warping compared to unfilled counterparts</li>
                        {(filament as any).glass_fiber_percentage >= 25 && (
                          <li>High fiber content — excellent rigidity, but more brittle than low-fiber variants</li>
                        )}
                      </ul>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Carbon Fiber Properties - Only show for CF filaments */}
              {((filament as any).carbon_fiber_percentage !== null && (filament as any).carbon_fiber_percentage !== undefined) && (
                <Card className="bg-gradient-to-br from-gray-500/5 to-slate-500/5 border-gray-500/20 hover:shadow-lg transition-shadow md:col-span-2">
                  <CardHeader className="pb-4">
                    <CardTitle className="flex items-center gap-2.5 text-lg font-semibold">
                      <span className="text-2xl">⚫</span>
                      Carbon Fiber Composition
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
                      {/* Carbon Fiber Percentage */}
                      <div className="p-4 bg-gray-500/10 rounded-lg border border-gray-500/20">
                        <div className="text-xs text-muted-foreground mb-1">Carbon Fiber Content</div>
                        <div className="text-2xl font-bold text-gray-600 dark:text-gray-400">
                          {(filament as any).carbon_fiber_percentage}%
                        </div>
                        <div className="text-xs text-muted-foreground mt-1">carbon fiber reinforcement</div>
                      </div>
                    </div>
                    
                    {/* Carbon fiber-specific tips */}
                    <div className="mt-4 p-4 bg-muted/30 rounded-lg">
                      <h4 className="font-semibold text-foreground mb-2 flex items-center gap-2">
                        <span>💡</span> Carbon Fiber Filament Tips
                      </h4>
                      <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
                        <li>Use a hardened steel, ruby, or diamond-coated nozzle — carbon fibers are extremely abrasive</li>
                        <li>Print at moderate speeds to maintain surface quality and reduce nozzle wear</li>
                        <li>Expect excellent stiffness-to-weight ratio and dimensional stability</li>
                        <li>Carbon fiber reduces warping and shrinkage significantly</li>
                        <li>Parts will have a matte, professional finish with visible fiber texture</li>
                        {(filament as any).carbon_fiber_percentage >= 20 && (
                          <li>High fiber content — maximum rigidity but increased brittleness</li>
                        )}
                      </ul>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Application Tags */}
              <Card className="bg-card border-border md:col-span-2 hover:shadow-lg transition-shadow">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Package className="w-5 h-5 text-primary" />
                    Applications & Use Cases
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {filament.use_case_tags && filament.use_case_tags.length > 0 && (
                    <div>
                      <span className="text-sm text-muted-foreground block mb-3 font-medium">Recommended Use Cases</span>
                      <div className="flex flex-wrap gap-2">
                        {filament.use_case_tags.map((tag, index) => (
                          <Badge key={index} variant="secondary" className="text-sm px-3 py-1.5">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                  {filament.industry_tags && filament.industry_tags.length > 0 && (
                    <div>
                      <span className="text-sm text-muted-foreground block mb-3 font-medium">Industries & Applications</span>
                      <div className="flex flex-wrap gap-2">
                        {filament.industry_tags.map((tag, index) => (
                          <Badge key={index} variant="outline" className="text-sm px-3 py-1.5">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                  {filament.food_contact_rating && (
                    <div className="bg-muted/30 p-4 rounded-lg">
                      <h4 className="font-semibold text-foreground mb-2">Food Contact Rating</h4>
                      <p className="text-sm text-muted-foreground capitalize">{filament.food_contact_rating}</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Compatibility Tab */}
          <TabsContent value="compatibility" className="space-y-6 animate-fade-in">
            <Card className="bg-card border-border hover:shadow-lg transition-shadow">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="w-5 h-5 text-primary" />
                  Printer & Equipment Compatibility
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  <CompatibilityCard
                    label="Brass Nozzle"
                    value={!filament.is_nozzle_abrasive}
                    description={filament.is_nozzle_abrasive ? "Requires hardened steel nozzle" : "Safe with standard brass nozzles"}
                    icon={<Settings className="w-5 h-5" />}
                  />
                  <CompatibilityCard
                    label="AMS/MMU"
                    value={filament.spool_ams_fit}
                    description={filament.spool_ams_fit ? "Compatible with AMS/MMU systems" : "May not fit standard AMS"}
                    icon={<Package className="w-5 h-5" />}
                  />
                  <CompatibilityCard
                    label="Food Safe"
                    value={filament.food_contact_rating === "approved"}
                    description={filament.food_contact_rating || "Rating unknown"}
                    icon={<Shield className="w-5 h-5" />}
                  />
                  <CompatibilityCard
                    label="Easy to Print"
                    value={filament.ease_of_printing_score ? filament.ease_of_printing_score >= 7 : null}
                    description={filament.ease_of_printing_score ? `Score: ${filament.ease_of_printing_score}/10` : "Not rated"}
                    icon={<Zap className="w-5 h-5" />}
                  />
                </div>

                <Separator />

                {/* Recommended Setup */}
                <div className="grid md:grid-cols-2 gap-4">
                  {filament.recommended_nozzle_type && (
                    <div className="bg-primary/5 border border-primary/20 p-4 rounded-lg">
                      <h4 className="font-semibold text-foreground mb-2 flex items-center gap-2">
                        <Settings className="w-4 h-4 text-primary" />
                        Recommended Nozzle / Hotend
                      </h4>
                      <p className="text-foreground font-medium">{filament.recommended_nozzle_type}</p>
                    </div>
                  )}
                  {filament.moisture_sensitivity_level && (
                    <div className="bg-muted/30 p-4 rounded-lg">
                      <h4 className="font-semibold text-foreground mb-2 flex items-center gap-2">
                        <Droplets className="w-4 h-4 text-primary" />
                        Storage Requirements
                      </h4>
                      <p className="text-foreground font-medium capitalize">{filament.moisture_sensitivity_level} Sensitivity</p>
                      {filament.drying_temp_c && filament.drying_time_hours && (
                        <p className="text-sm text-muted-foreground mt-1">
                          Dry at {filament.drying_temp_c}°C for {filament.drying_time_hours}h if exposed
                        </p>
                      )}
                    </div>
                  )}
                </div>

                {/* Additional Details */}
                {(filament.spool_outer_d_mm || filament.spool_width_mm) && (
                  <div className="bg-muted/30 p-4 rounded-lg">
                    <h4 className="font-semibold text-foreground mb-3">Spool Dimensions</h4>
                    <div className="grid grid-cols-2 gap-4">
                      {filament.spool_outer_d_mm && (
                        <div>
                          <p className="text-sm text-muted-foreground">Outer Diameter</p>
                          <p className="text-lg font-semibold text-foreground">{filament.spool_outer_d_mm}mm</p>
                        </div>
                      )}
                      {filament.spool_width_mm && (
                        <div>
                          <p className="text-sm text-muted-foreground">Width</p>
                          <p className="text-lg font-semibold text-foreground">{filament.spool_width_mm}mm</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

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
          <FloatingCalculatorButton
            onClick={() => setIsCalculatorOpen(true)}
            pulseOnMount={true}
          />
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

      {/* Sticky Buy Bar - appears when scrolling past hero */}
      {filament && (
        <StickyBuyBar
          filament={filament}
          affiliateUrl={getAffiliateUrl(getRegionalUrl(filament.product_url, filament.vendor), filament.vendor)}
          pricePerKg={rawPricePerKg}
          isVisible={stickyBarVisible}
          hasActualRegionalPrice={hasActualRegionalPrice}
        />
      )}

      {/* Social Proof Toast - shows recent purchases */}
      <SocialProofToast
        purchases={[
          { name: 'Alex', location: 'California', timeAgo: '2 min ago' },
          { name: 'Sarah', location: 'Texas', timeAgo: '5 min ago' },
          { name: 'Mike', location: 'New York', timeAgo: '12 min ago' },
        ]}
        interval={45000}
        maxToasts={3}
      />

      {/* Spacer for sticky bar */}
      <div className="h-20 md:h-16" />
    </div>
  );
};



const PropertyRow = ({ 
  label, 
  value, 
  highlight = false,
  icon
}: { 
  label: string; 
  value: string; 
  highlight?: boolean;
  icon?: React.ReactNode;
}) => (
  <div className={`flex justify-between items-center py-3 ${highlight ? 'bg-primary/5 px-4 rounded-xl border border-primary/20 my-1' : 'border-b border-border/50 last:border-b-0'}`}>
    <span className="text-sm text-muted-foreground flex items-center gap-2.5 font-medium">
      {icon && <span className="text-muted-foreground/70">{icon}</span>}
      {label}
    </span>
    <span className={`text-sm ${highlight ? 'text-primary font-bold' : 'text-foreground font-semibold'}`}>{value}</span>
  </div>
);

const CompatibilityCard = ({ 
  label, 
  value, 
  description,
  icon
}: { 
  label: string; 
  value?: boolean | null; 
  description: string;
  icon?: React.ReactNode;
}) => {
  const getStatusColor = () => {
    if (value === true) return "bg-emerald-500/10 border-emerald-500/30";
    if (value === false) return "bg-red-500/10 border-red-500/30";
    return "bg-muted border-border";
  };

  const getStatusIcon = () => {
    if (value === true) return "✓";
    if (value === false) return "✗";
    return "?";
  };

  return (
    <div className={`p-5 rounded-xl border-2 ${getStatusColor()} transition-all hover:shadow-md`}>
      <div className="flex items-center justify-between mb-3">
        <span className="text-sm font-semibold text-foreground flex items-center gap-2.5">
          {icon && <span className="text-primary">{icon}</span>}
          {label}
        </span>
        <span className="text-2xl font-bold">
          {getStatusIcon()}
        </span>
      </div>
      <p className="text-sm text-muted-foreground leading-relaxed">{description}</p>
    </div>
  );
};

export default FilamentDetail;