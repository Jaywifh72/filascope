import { useEffect, useState, useRef, useMemo } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MaterialBadge } from "@/components/MaterialBadge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, ExternalLink, Package, Printer, RefreshCw, AlertTriangle, ChevronDown, ImageIcon, Link2, Copy, CheckCircle, Download, Palette, Zap } from "lucide-react";
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
import { CompatibilityBadge } from "@/components/CompatibilityBadge";
import { useAffiliateLinks } from "@/hooks/useAffiliateLinks";
import { useCurrency } from "@/hooks/useCurrency";
import { normalizeColorHex } from "@/lib/utils";
import { isDiscontinuedUrl } from "@/lib/urlValidation";
import { useAchievements } from "@/hooks/useAchievements";
import { SimilarMaterialsModule } from "@/components/filament/similar/SimilarMaterialsModule";
import { validateFilamentPrice } from "@/lib/priceValidation";
import { StickyBuyBar } from "@/components/filament/StickyBuyBar";
import { FilamentHeroGallery } from "@/components/filament/hero/FilamentHeroGallery";
import { FilamentHeroPurchaseCard } from "@/components/filament/hero/FilamentHeroPurchaseCard";
import { FilamentHeroQuickFeatures } from "@/components/filament/hero/FilamentHeroQuickFeatures";
import { HeroColorQuantitySelector } from "@/components/filament/hero/HeroColorQuantitySelector";
import { SimplifiedCompatibility } from "@/components/filament/hero/SimplifiedCompatibility";
import { RetailersModal, type Retailer } from "@/components/filament/hero/RetailersModal";
import { useConversionTracking } from "@/hooks/useConversionTracking";
import { TechnicalDetailsAccordion } from "@/components/filament/TechnicalDetailsAccordion";
import { CalculatorTabs, FloatingCalculatorButton } from "@/components/filament/calculator";
import { useRegionalStore } from "@/hooks/useRegionalStore";
import { useRegionalPrice, type FilamentWithRegionalPrices } from "@/hooks/useRegionalPrice";

type Filament = Database["public"]["Tables"]["filaments"]["Row"];

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
  const [colorVariants, setColorVariants] = useState<Filament[]>([]);
  const [selectedWeight, setSelectedWeight] = useState<number | null>(null);
  const [availableWeights, setAvailableWeights] = useState<{ weight: number; pricePerKg: number | null; count: number }[]>([]);
  const [selectedVariant, setSelectedVariant] = useState<Filament | null>(null);
  
  // The filament to display - either the selected color variant or the base filament from URL
  const displayFilament = selectedVariant || filament;
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
  // Uses displayFilament to get correct prices when a color variant is selected
  const regionalPriceData = useRegionalPrice(displayFilament as FilamentWithRegionalPrices | null);

  const compatibility = selectedPrinter && displayFilament 
    ? checkPrinterFilamentCompatibility(selectedPrinter, displayFilament)
    : null;

  // Build retailers array for modal - uses regional store URLs based on user's currency setting
  // Uses displayFilament to show correct retailer URLs for selected color variant
  const retailers: Retailer[] = useMemo(() => {
    if (!displayFilament) return [];
    
    const result: Retailer[] = [];
    
    // Primary retailer (brand store) - use regional URL from database if available, otherwise transform
    const bestRegionalUrl = regionalPriceData.regionalUrl || getRegionalUrl(displayFilament.product_url, displayFilament.vendor);
    
    if (bestRegionalUrl) {
      result.push({
        id: 'store',
        name: `${displayFilament.vendor || 'Store'} (${regionShortName})`,
        price: regionalPriceData.regionalPrice, // Use actual regional price if available
        inStock: !isDiscontinuedUrl(bestRegionalUrl),
        url: getAffiliateUrl(bestRegionalUrl, displayFilament.vendor),
        shippingEstimate: 'Ships within 24hrs',
      });
    }
    
    // Amazon - show region-appropriate Amazon first based on user's currency
    const amazonLinks = [
      { id: 'amazon_us', name: 'Amazon US', link: displayFilament.amazon_link_us, price: displayFilament.amazon_price_usd, region: 'US' },
      { id: 'amazon_uk', name: 'Amazon UK', link: displayFilament.amazon_link_uk, price: null, region: 'UK' },
      { id: 'amazon_de', name: 'Amazon DE', link: displayFilament.amazon_link_de, price: null, region: 'EU' },
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
  }, [displayFilament, getAffiliateUrl, getAmazonUrl, getRegionalUrl, regionShortName, regionalPriceData]);
  
  // Reset selected variant when base filament changes (new page load)
  useEffect(() => {
    setSelectedVariant(null);
  }, [id]);
  
  // Handle color variant selection - updates display without navigation
  const handleColorVariantSelect = (variant: Filament) => {
    setSelectedVariant(variant);
    // Optionally update URL without navigation for bookmarking
    window.history.replaceState({}, '', `/filament/${variant.id}`);
  };

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
    // Bambu Lab PETG-CF colors
    'Brick Red', 'Indigo Blue', 'Malachite Green', 'Titan Gray', 'Violet Purple',
    // Bambu Lab ABS colors
    'Bambu Green', 'Navy Blue', 'Tangerine Yellow', 'Azure',
    // Other brand colors
    'Anthracite Grey', 'Carmine Red', 'Chalky Blue', 'Jungle Green', 'Mango Yellow',
    'Neon Green', 'Shimmering Violet', 'Ultramarine Blue', 'Carbon Fiber Black',
  ];

  // Terms that are PRODUCT VARIANTS (not colors) - should be kept in base name
  // NOTE: "Wood" is NOT here because "PLA Wood Black Walnut" should extract "Bambu Lab PLA Wood" as base
  const PRODUCT_VARIANT_TERMS = [
    'Matte', 'Matt', 'Silk', 'Glitter', 'Silk Glitter', 'Carbon Fiber', 'CF',
    'Recycled', 'CMYK Bundle', 'CMYK', 'Bundle', 'Bulk Buy', 'Wood Fill', 'HF', 'High Flow',
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
    
    // Pattern 0.5: Bambu Lab Wood filaments - "Brand PLA Wood ColorName"
    // e.g., "Bambu Lab PLA Wood Black Walnut" -> "Bambu Lab PLA Wood"
    // The color names for wood are: Black Walnut, Classic Birch, Clay Brown, Ochre Yellow, Rosewood, White Oak
    const bambuWoodMatch = normalizedTitle.match(/^((?:Bambu\s*Lab|Bambu)\s+PLA\s+Wood)\s+(.+)$/i);
    if (bambuWoodMatch) {
      const basePart = bambuWoodMatch[1].trim();
      const colorPart = bambuWoodMatch[2].trim();
      // Known wood color names
      const woodColors = ['Black Walnut', 'Classic Birch', 'Clay Brown', 'Ochre Yellow', 'Rosewood', 'White Oak'];
      if (woodColors.some(c => colorPart.toLowerCase() === c.toLowerCase())) {
        return basePart;
      }
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
    
    // Sort to prioritize:
    // 1. Variants with regional prices (better data quality)
    // 2. Variants without suffixes (NFC, Refill)
    // 3. Shorter names (base product without brand prefix in color)
    const sorted = [...variants].sort((a, b) => {
      // First: prefer variants with regional prices (indicates better scraped data)
      const aHasRegionalPrices = !!(a.price_cad || a.price_eur || a.price_gbp || a.price_aud);
      const bHasRegionalPrices = !!(b.price_cad || b.price_eur || b.price_gbp || b.price_aud);
      if (aHasRegionalPrices && !bHasRegionalPrices) return -1;
      if (!aHasRegionalPrices && bHasRegionalPrices) return 1;
      
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
  
  // Use displayFilament for all rendering (supports color variant selection)
  if (!displayFilament) return null;

  // Get pack quantity (default to 1 for single spools)
  const packQuantity = (displayFilament as any).pack_quantity || 1;
  const isMultiPack = packQuantity > 1;
  
  // variant_price is the TOTAL price for the listing in USD (may be multi-pack)
  // Calculate true per-kg price: total_price / (pack_quantity * weight_per_spool_kg)
  const totalWeightKg = displayFilament.net_weight_g 
    ? (displayFilament.net_weight_g / 1000) * packQuantity 
    : packQuantity; // Assume 1kg per spool if weight unknown
  
  // Use actual scraped regional price if available, otherwise fall back to USD conversion
  // regionalPriceData.regionalPrice is already in the user's local currency (e.g., CAD $25.99)
  const hasActualRegionalPrice = regionalPriceData.isActualRegionalPrice && regionalPriceData.regionalPrice !== null;
  
  // Calculate raw price values based on whether we have actual regional data
  const rawPricePerKg = hasActualRegionalPrice
    ? (regionalPriceData.regionalPrice! / totalWeightKg)
    : displayFilament.variant_price 
      ? (displayFilament.variant_price / totalWeightKg) 
      : null;
  
  // Validate price for suspicious patterns (MOQ/bundle miscalculations)
  // Use USD price for validation since thresholds are USD-based
  const priceValidation = validateFilamentPrice(
    displayFilament.variant_price,
    displayFilament.net_weight_g,
    packQuantity,
    displayFilament.material,
    displayFilament.product_title,
    displayFilament.product_url
  );
  
  // Per-spool price = total price / pack quantity
  const rawPricePerSpool = hasActualRegionalPrice
    ? (regionalPriceData.regionalPrice! / packQuantity)
    : displayFilament.variant_price 
      ? (displayFilament.variant_price / packQuantity)
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
      : displayFilament.variant_price
        ? formatPrice(displayFilament.variant_price)
        : null
    : null;


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
                  images={[displayFilament.featured_image]}
                  productTitle={displayFilament.product_title}
                  colorHex={displayFilament.color_hex}
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

                  {/* Material & Specs Row */}
                  <div className="flex items-center gap-3 mt-3 flex-wrap">
                    {filament.material && (
                      <MaterialBadge 
                        material={filament.material} 
                        variant="default" 
                        size="sm"
                        className="text-xs"
                      />
                    )}
                    {filament.high_speed_capable && (
                      <>
                        <span className="text-muted-foreground">•</span>
                        <Badge variant="secondary" className="text-xs bg-primary/10 text-primary border-primary/20">
                          <Zap className="w-3 h-3 mr-1" />
                          High-Speed Ready
                        </Badge>
                      </>
                    )}
                  </div>

                  {/* Quick Badges */}
                  <div className="flex gap-2 flex-wrap mt-4">
                    {displayFilament.diameter_nominal_mm && (
                      <Badge variant="outline" className="text-xs px-2.5 py-1">
                        {displayFilament.diameter_nominal_mm}mm
                      </Badge>
                    )}
                    {displayFilament.color_family && (
                      <Badge variant="outline" className="text-xs px-2.5 py-1 flex items-center gap-1.5">
                        {displayFilament.color_hex && (
                          <div className="w-3 h-3 rounded-full border border-border" style={{ backgroundColor: normalizeColorHex(displayFilament.color_hex) }} />
                        )}
                        {displayFilament.color_family}
                      </Badge>
                    )}
                    {displayFilament.net_weight_g && displayFilament.net_weight_g > 0 && (
                      <Badge variant="outline" className="text-xs px-2.5 py-1">
                        <Package className="w-3 h-3 mr-1" />
                        {displayFilament.net_weight_g}g
                      </Badge>
                    )}
                    {displayFilament.finish_type && (
                      <Badge variant="secondary" className="text-xs px-2.5 py-1">{displayFilament.finish_type}</Badge>
                    )}
                    {displayFilament.is_nozzle_abrasive && (
                      <Badge variant="destructive" className="text-xs px-2.5 py-1">⚠️ Abrasive</Badge>
                    )}
                    {isMultiPack && (
                      <Badge variant="secondary" className="text-xs px-2.5 py-1 bg-primary/20 text-primary border-primary/30">
                        📦 {packQuantity}-Pack
                      </Badge>
                    )}
                  </div>
                </div>

                {/* Color/Size/Quantity Selectors - Always show for conversion */}
                <HeroColorQuantitySelector
                    colorVariants={colorVariants.map(v => ({
                      id: v.id,
                      color_hex: v.color_hex,
                      color_family: v.color_family,
                      product_title: v.product_title,
                      net_weight_g: v.net_weight_g,
                    }))}
                    availableWeights={availableWeights}
                    selectedWeight={selectedWeight}
                    currentVariantId={displayFilament.id}
                    onSelectWeight={setSelectedWeight}
                    onSelectColor={(variant) => {
                      const fullVariant = colorVariants.find(v => v.id === variant.id);
                      if (fullVariant) handleColorVariantSelect(fullVariant);
                    }}
                    getColorFromTitle={getColorFromTitle}
                    getBaseProductName={getBaseProductName}
                />

                {/* Purchase Card - THE CONVERSION ENGINE */}
                <FilamentHeroPurchaseCard
                  filamentId={displayFilament.id}
                  vendor={displayFilament.vendor}
                  pricePerKg={rawPricePerKg}
                  pricePerSpool={rawPricePerSpool}
                  weightGrams={displayFilament.net_weight_g}
                  affiliateUrl={getAffiliateUrl(regionalPriceData.regionalUrl || displayFilament.product_url || '', displayFilament.vendor)}
                  productUrl={regionalPriceData.regionalUrl || displayFilament.product_url || ''}
                  originalUsUrl={displayFilament.product_url || undefined}
                  retailerName={displayFilament.vendor || undefined}
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
              material={displayFilament.material}
              easeOfPrintingScore={displayFilament.ease_of_printing_score}
              strengthIndex={displayFilament.strength_index}
              highSpeedCapable={displayFilament.high_speed_capable}
              isAbrasive={displayFilament.is_nozzle_abrasive}
            />
          </CardContent>
        </Card>

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

        {/* Similar Materials - Positioned early for social validation */}
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

        {/* Technical Details Accordion - Consolidated */}
        <TechnicalDetailsAccordion filament={filament} className="mb-8" />

        {/* Simplified Printer Compatibility */}
        {selectedPrinter && compatibility && (
          <SimplifiedCompatibility
            printer={selectedPrinter}
            compatibility={{
              overallRating: compatibility.is_supported ? (compatibility.ease_rating === 'Easy' ? 'green' : 'orange') : 'red',
              summary: compatibility.is_supported ? 'Compatible' : 'Limited compatibility',
              limitations: compatibility.limitations,
              recommendations: compatibility.recommendations,
            }}
            className="mb-8"
          />
        )}

        {/* Prompt to select printer if none selected */}
        {!printerLoading && !selectedPrinter && (
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
      {displayFilament && (
        <StickyBuyBar
          filament={displayFilament}
          affiliateUrl={getAffiliateUrl(getRegionalUrl(displayFilament.product_url, displayFilament.vendor), displayFilament.vendor)}
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