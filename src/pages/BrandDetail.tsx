import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MaterialBadge } from "@/components/MaterialBadge";
import { ArrowLeft, ExternalLink, Building2, MapPin, Calendar, Users, Globe, TrendingUp, Filter, Palette, Loader2, CheckCircle2, Clock, AlertCircle, RefreshCw } from "lucide-react";
import { getBrandLogo } from "@/lib/brandLogos";
import { getBrandInfo } from "@/lib/brandInfo";
import type { Tables } from "@/integrations/supabase/types";
import { useMemo, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { normalizeColorHex } from "@/lib/utils";
import { useCurrency } from "@/hooks/useCurrency";
import { useRegionalStore } from "@/hooks/useRegionalStore";
import { formatProductLineIdForDisplay } from "@/lib/productNameUtils";

// Platform color mapping
const PLATFORM_COLORS: Record<string, string> = {
  shopify: "bg-green-500",
  amazon: "bg-orange-500",
  woocommerce: "bg-purple-500",
  bigcommerce: "bg-blue-500",
  magento: "bg-red-500",
  custom: "bg-zinc-500",
};

type Filament = Tables<"filaments">;

interface GroupedProduct {
  baseName: string;
  material: string | null;
  variants: Filament[];
  representativeImage: string | null;
  priceRange: { min: number | null; max: number | null };
  productUrl: string | null;
  categoryUrl: string | null;
}

// Extract Prusament product line for grouping
const getPrusamentProductLine = (material: string | null, title: string): string => {
  const titleLower = title.toLowerCase();
  const isRefill = titleLower.includes('refill');
  
  // Handle Refills first
  if (isRefill) {
    if (material === 'PLA' || titleLower.includes(' pla ')) return 'Prusament PLA Refill';
    if (material === 'PETG' || titleLower.includes(' petg ')) return 'Prusament PETG Refill';
    return `Prusament ${material || 'Filament'} Refill`;
  }
  
  // Map materials to product line names
  const materialLineMap: Record<string, string> = {
    'PLA': 'Prusament PLA',
    'PETG': 'Prusament PETG',
    'ASA': 'Prusament ASA',
    'ABS': 'Prusament ABS',
    'PC Blend': 'Prusament PC Blend',
    'PVB': 'Prusament PVB',
    'TPU 95A': 'Prusament TPU',
    'TPU': 'Prusament TPU',
    'PA11 Carbon Fiber': 'Prusament PA (Nylon)',
    'PA11-CF': 'Prusament PA (Nylon)',
    'Nylon-CF': 'Prusament PA (Nylon)',
    'rPLA': 'Prusament rPLA',
  };
  
  // Check for wood fill in title
  if (titleLower.includes('wood')) {
    return 'Prusament Woodfill';
  }
  
  if (material && materialLineMap[material]) {
    return materialLineMap[material];
  }
  
  return `Prusament ${material || 'Filament'}`;
};

// Brand-specific category URL patterns for grouped products
// Note: This returns a base URL that will be transformed by getRegionalUrl in the component
const getCategoryUrl = (brand: string, material: string | null, baseName: string): string | null => {
  if (!material) return null;
  
  const materialLower = material.toLowerCase();
  const brandLower = brand.toLowerCase();
  
  // Prusament category URLs (global store, no regional variants)
  if (brandLower === 'prusament') {
    const prusaCategoryMap: Record<string, string> = {
      'asa': 'prusament-asa',
      'petg': 'prusament-petg',
      'pla': 'prusament-pla',
      'pc blend': 'prusament-pc-blend',
      'pvb': 'prusament-pvb',
      'pa11 carbon fiber': 'prusament-pa11-cf',
    };
    
    const categorySlug = prusaCategoryMap[materialLower];
    if (categorySlug) {
      return `https://www.prusa3d.com/category/${categorySlug}/`;
    }
  }
  
  // Polymaker category URLs - use US as base, will be transformed by getRegionalUrl
  if (brandLower === 'polymaker') {
    return `https://us.polymaker.com/collections/${materialLower}`;
  }
  
  // Bambu Lab category URLs - use US as base, will be transformed by getRegionalUrl
  if (brandLower === 'bambu lab') {
    return `https://us.store.bambulab.com/collections/filament`;
  }
  
  return null;
};

// Common color names to detect at the end of product titles
const COLOR_WORDS = [
  // Basic colors
  'Beige', 'Black', 'Blue', 'Brown', 'Burgundy', 'Charcoal', 'Copper', 'Cream', 'Cyan',
  'Gold', 'Gray', 'Grey', 'Green', 'Ivory', 'Lavender', 'Magenta', 'Maroon', 'Navy',
  'Olive', 'Orange', 'Peach', 'Pink', 'Purple', 'Red', 'Rose', 'Salmon', 'Silver',
  'Tan', 'Teal', 'Turquoise', 'Violet', 'White', 'Yellow', 'Kraft', 'Lemonade', 'Terracotta',
  'Bronze', 'Rust', 'Khaki', 'Mustard', 'Amber', 'Aqua', 'Azure', 'Bone', 'Champagne',
  // Fillamentum style colors
  'Cobalt Blue', 'Concrete Grey', 'Luminous Orange', 'Metallic Grey', 'Signal Brown',
  'Sky Blue', 'Traffic Black', 'Traffic Red', 'Traffic White', 'Traffic Yellow',
  'Turquoise Green', 'Anthracite Grey', 'Dijon Mustard', 'Green Grass', 'Grey Blue',
  'Snow White', 'Vertigo Grey', 'Vivid Pink', 'White Aluminium', 'Army Green',
  'Black Soul', 'Caramel Brown Metallic', 'Deep Sea Transparent', 'Flash Yellow Metallic',
  'Flirty Plum', 'Ghost White', 'Grey Mouse Transparent', 'Iced Green Transparent',
  'Jungle Green Metallic', 'Lagoon Transparent', 'Lemonade Translucent', 'Mistake Blue Metallic',
  'Morning Mist', 'Noble Green', 'Passion Fruit Metallic', 'Perl Ruby', 'Portofino Blue',
  'Pure Clear', 'Rapunzel Silver', 'Traffic Blue', 'Urban Grey', 'Wizard Voodoo',
  'Crystal Clear', 'Crystal Clear Blue', 'Crystal Clear Green', 'Crystal Clear Purple',
  // Polymaker style colors  
  'Teal Green', 'Army Dark Green', 'Fossil Grey', 'Luminous White', 'Luminous Green',
  'Luminous Blue', 'Luminous Red', 'Galaxy Dark Blue', 'Galaxy Purple', 'Galaxy Rose',
  // Prusament style colors
  'Galaxy Black', 'Galaxy Silver', 'Jet Black', 'Signal White', 'Opal Green',
  'Prusa Orange', 'Mystic Green', 'Mystic Brown', 'Lipstick Red', 'Azure Blue',
  // Sunlu style colors
  'Army Beige', 'Coffee Brown', 'Grass Green', 'Light Pink', 'Skin', 'Wood',
  // Stylized color names (Hatchbox PETG style)
  'Midnight', 'Peacock', 'Lake', 'Baby', 'Electric Lime', 'Dusk', 'Dawn', 'Sunset', 'Ocean',
  'Sky', 'Coral', 'Mint', 'Sage', 'Moss', 'Sand', 'Clay', 'Slate', 'Storm', 'Fog', 'Mist',
  'Eggplant', 'Caribbean', 'Pastel', 'Apple Sauce', 'Lemon', 'Electric', 'Neon', 'Arctic',
  'Crimson', 'Ruby', 'Sapphire', 'Emerald', 'Cobalt', 'Indigo', 'Plum', 'Wine', 'Berry',
  'Tangerine', 'Pumpkin', 'Caramel', 'Mocha', 'Espresso', 'Chocolate', 'Coffee', 'Butter',
  'Cream', 'Ivory', 'Pearl', 'Snow', 'Ice', 'Frost', 'Steel', 'Smoke', 'Charcoal', 'Onyx',
  'Jet', 'Raven', 'Shadow', 'Graphite', 'Gunmetal', 'Titanium', 'Chrome', 'Platinum',
  // Standalone modifier colors (Hatchbox style)
  'Light', 'Dark', 'Bright', 'Deep', 'Pale', 'Vivid', 'Pure', 'Signal', 'Traffic',
  // Multi-word Hatchbox colors
  'Ash Gray', 'Stone Gray', 'Baby Pink', 'Blush Pink', 'Soft Purple', 'Light Lavender',
  'Cherry Red', 'Lemon Yellow', 'Seafoam Blue', 'Seafoam Green',
  'Baby Blue', 'Gray Blue', 'Lake Blue', 'Peacock Blue', 'Midnight Purple', 'Eggplant Purple',
  'Caribbean Green', 'Mint Green', 'Pastel Green', 'Forest Green',
  'Light Brown', 'Light Orange', 'Light Purple', 'Dark Yellow', 'Dark Green',
  'Transparent Black', 'Transparent Blue', 'Transparent Green', 'Transparent White',
  'Paint Free Brown',
  // Glow variants
  'Glow in the Dark', 'Glow in the Dark Blue', 'Glow in the Dark Green',
  // General multi-word colors
  'Light Blue', 'Dark Blue', 'Sky Blue', 'Royal Blue', 'Light Green', 'Ocean Blue',
  'Light Gray', 'Dark Gray', 'Light Grey', 'Dark Grey', 'Lime Green', 'Neon Blue',
  'Hot Pink', 'Light Pink', 'Neon Green', 'Neon Orange', 'Neon Pink', 'Neon Yellow',
  'Glow Green', 'Glow Blue', 'True Black', 'True White', 'Jet Black', 'Snow White',
  'Natural', 'Clear', 'Transparent', 'Translucent',
];

// Extract base product name by removing color suffix
const getBaseProductName = (title: string, material?: string | null): string => {
  // Normalize the title first - merge variant names into base product
  let normalizedTitle = title
    .replace(/\bPLA\s+PRO\+/gi, 'PLA+')  // "PLA PRO+" -> "PLA+"
    .replace(/\bPLA\s+PRO\b/gi, 'PLA+'); // "PLA PRO" -> "PLA+"
  
  // Pre-process: Remove product variant suffixes like "(with Spool)", "Refill", "(NFC)", etc.
  // These indicate the same product in different packaging, not different products
  normalizedTitle = normalizedTitle
    .replace(/\s*\(with\s+Spool\)\s*/gi, ' ')  // "(with Spool)"
    .replace(/\s*\(NFC\)\s*/gi, '')            // "(NFC)"
    .replace(/\s+Refill\s*$/gi, '')            // "Refill" at end
    .replace(/\s+w\/\s*Spool\s*/gi, ' ')       // "w/ Spool"
    .replace(/\s+with\s+Spool\s*/gi, ' ')      // "with Spool"
    .trim();
  
  // Pattern 0: Paramount 3D style - "Material (Color) Diameter Weight Filament"
  // e.g., "ABS (Autobot Blue) 1.75mm 1kg Filament" -> "ABS"
  // e.g., "PLA (Black) 1.75mm 1kg Filament" -> "PLA"
  // e.g., "PETG Carbon Fiber (Black) 1.75mm 1kg Filament" -> "PETG Carbon Fiber"
  const paramountMatch = normalizedTitle.match(/^((?:PLA\+?|PETG|ABS|TPU|TPE|ASA|PA\d*|PC|HIPS|PVA|Nylon)(?:\s+Carbon\s+Fiber)?)\s*\(.+\)\s+[\d.]+mm\s+[\d.]+kg\s+Filament$/i);
  if (paramountMatch) {
    return paramountMatch[1].trim();
  }
  
  // Pattern 0.5: If we have a material field, use it for grouping when title follows "Material (Color) ..." pattern
  if (material && normalizedTitle.match(/^\w+\s*\(.+\)/)) {
    return material;
  }
  
  // Pattern 1: Handle "Brand Material Color Weight" pattern (Prusament style)
  // e.g., "Prusament ASA Jet Black 800g" -> "Prusament ASA 800g"
  // e.g., "Prusament PETG Prusa Orange 1kg" -> "Prusament PETG 1kg"
  const weightMatch = normalizedTitle.match(/^(.+?\s+(?:PLA\+?|PETG|ABS|TPU|TPE|ASA|PA\d*|PC(?:\s+Blend)?|HIPS|PVA|Nylon|PA11\s+Carbon\s+Fiber))\s+.+?\s+(\d+(?:\.\d+)?(?:kg|g))\s*$/i);
  if (weightMatch) {
    return `${weightMatch[1].trim()} ${weightMatch[2]}`;
  }
  
  // Pattern 2: "Brand Material - Color" (dash separator) - Fillamentum, ColorFabb style
  const dashMatch = normalizedTitle.match(/^(.+?)\s+-\s+.+$/);
  if (dashMatch) {
    return dashMatch[1].trim();
  }
  
  // Pattern 2.5: Handle compound material names like "Metallic PLA", "Silk PLA", "Matte PLA"
  // Match: "Brand CompoundMaterial Color" -> "Brand CompoundMaterial"
  const compoundMaterialMatch = normalizedTitle.match(/^(.+?\s+(?:Metallic|Silk|Matte|Marble|Galaxy|Sparkle|Glitter|Glow|Wood|Carbon|Glass|Rapid|Tough|Flex|Pro|Premium|Basic|Economy|Ultra)\s+(?:PLA|PETG|ABS|TPU|TPE|ASA|PA|PC|HIPS|PVA|Nylon))\s+.+$/i);
  if (compoundMaterialMatch) {
    return compoundMaterialMatch[1].trim();
  }
  
  // Pattern 2.6: Handle "Material Rapid/Pro/Reload/etc" pattern (e.g., "Hatchbox PETG Rapid Black", "Hatchbox PLA Reload Blue")
  const materialVariantMatch = normalizedTitle.match(/^(.+?\s+(?:PLA|PETG|ABS|TPU|TPE|ASA|PA|PC)\s+(?:Rapid|Pro|Plus|Max|Lite|Basic|Premium|HS|HT|CF|GF|Reload))\s+.+$/i);
  if (materialVariantMatch) {
    return materialVariantMatch[1].trim();
  }
  
  // Pattern 2.7: Handle "Brand Extrafill/PolyLite/etc Material" patterns (Fillamentum, Polymaker style)
  // e.g., "Fillamentum PLA Extrafill - Color" already handled by dash pattern
  // e.g., "Polymaker PolyLite PLA Color" -> "Polymaker PolyLite PLA"
  const brandLineMatch = normalizedTitle.match(/^(.+?\s+(?:PolyLite|PolyMax|PolyMide|PolyFlex|PolyWood|PolyDissolve|Extrafill|Flexfill|Timberfill|CPE HG100|ASA Extrafill|ABS Extrafill|PLA Extrafill))\s+.+$/i);
  if (brandLineMatch) {
    return brandLineMatch[1].trim();
  }
  
  // Pattern 2.8: Handle "Carbon Fiber Material" pattern (standalone product)
  const carbonFiberMatch = normalizedTitle.match(/^(.+?\s+Carbon\s+Fiber\s+(?:PLA|PETG|ABS|TPU|ASA|PA|Nylon))$/i);
  if (carbonFiberMatch) {
    return carbonFiberMatch[1].trim();
  }
  
  // Pattern 3: Check for color word at the end (case-insensitive)
  // Sort by length descending to match longer colors first ("Light Blue" before "Blue")
  const sortedColors = [...COLOR_WORDS].sort((a, b) => b.length - a.length);
  
  for (const color of sortedColors) {
    const regex = new RegExp(`^(.+?)\\s+${color}$`, 'i');
    const match = normalizedTitle.match(regex);
    if (match) {
      return match[1].trim();
    }
  }
  
  // No color found - return normalized title
  return normalizedTitle;
};

// Extract color from product title
const getColorFromTitle = (title: string, baseName: string): string | null => {
  if (title === baseName) return null;
  
  // Clean title of packaging suffixes before extracting color
  const cleanTitle = title
    .replace(/\s*\(NFC\)\s*/gi, '')
    .replace(/\s+Refill\s*$/gi, '')
    .trim();
  
  if (cleanTitle === baseName) return null;
  
  // Pattern 0: Paramount 3D style - extract color from parentheses
  // e.g., "ABS (Autobot Blue) 1.75mm 1kg Filament" -> "Autobot Blue"
  // Use cleanTitle (NFC already removed) to avoid matching "(NFC)" as a color
  const parenMatch = cleanTitle.match(/\(([^)]+)\)/);
  if (parenMatch) {
    return parenMatch[1].trim();
  }
  
  // Pattern 1: Dash separator
  const dashMatch = title.match(/^.+?\s+-\s+(.+)$/);
  if (dashMatch) {
    return dashMatch[1].trim();
  }
  
  // Pattern 2: Color at the end
  const sortedColors = [...COLOR_WORDS].sort((a, b) => b.length - a.length);
  
  for (const color of sortedColors) {
    const regex = new RegExp(`\\s+${color}$`, 'i');
    if (title.match(regex)) {
      // Return the actual color from the title (preserving case)
      const extractedColor = title.slice(baseName.length).trim();
      return extractedColor || color;
    }
  }
  
  return null;
};

const BrandDetail = () => {
  const { brand } = useParams<{ brand: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const decodedBrand = brand ? decodeURIComponent(brand) : "";
  const [selectedMaterial, setSelectedMaterial] = useState<string | null>(null);
  const [isScrapingColors, setIsScrapingColors] = useState(false);
  const { isAdmin } = useAuth();
  const { toast } = useToast();
  const { formatPrice } = useCurrency();
  const { getRegionalUrl } = useRegionalStore();

  const brandInfo = getBrandInfo(decodedBrand);
  const brandLogo = getBrandLogo(decodedBrand);

  // Check if this is a brand with color scraping support
  const hasColorScraper = decodedBrand.toLowerCase().includes("overture");

  const handleScrapeColors = async () => {
    setIsScrapingColors(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast({
          title: "Error",
          description: "You must be logged in to perform this action",
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "Scraping colors...",
        description: "Fetching color data from product pages. This may take a moment.",
      });

      const response = await supabase.functions.invoke("scrape-overture-colors", {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (response.error) {
        throw new Error(response.error.message);
      }

      const result = response.data;
      toast({
        title: "Colors Scraped Successfully",
        description: `Found ${result.totalColorsFound} colors. Created ${result.totalEntriesCreated} new entries, updated ${result.totalEntriesUpdated} existing.`,
        duration: 8000,
      });

      // Refresh filaments data
      queryClient.invalidateQueries({ queryKey: ["brand-filaments", decodedBrand] });
    } catch (error) {
      console.error("Error scraping colors:", error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to scrape colors",
        variant: "destructive",
      });
    } finally {
      setIsScrapingColors(false);
    }
  };

  // Fetch automated brand data (for sync status, platform info)
  const { data: automatedBrand } = useQuery({
    queryKey: ["automated-brand", decodedBrand],
    queryFn: async () => {
      // Try to find by brand_name or brand_slug
      const { data, error } = await supabase
        .from("automated_brands")
        .select("*")
        .or(`brand_name.ilike.${decodedBrand},brand_slug.eq.${decodedBrand.toLowerCase().replace(/\s+/g, '-')}`)
        .maybeSingle();

      if (error) throw error;
      return data;
    },
    enabled: !!decodedBrand,
  });

  const { data: filaments, isLoading } = useQuery({
    queryKey: ["brand-filaments", decodedBrand],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("filaments")
        .select("*")
        .ilike("vendor", decodedBrand.replace(/-/g, ' '))
        .or("net_weight_g.is.null,net_weight_g.gte.300") // Exclude small/sample spools
        .order("product_title");

      if (error) throw error;
      return data as Filament[];
    },
    enabled: !!decodedBrand,
  });

  // Extract unique materials for filter
  const availableMaterials = useMemo(() => {
    if (!filaments) return [];
    const materials = new Set<string>();
    filaments.forEach((f) => {
      if (f.material) materials.add(f.material);
    });
    return Array.from(materials).sort();
  }, [filaments]);

  // Deduplicate variants by color_hex within a group
  // Keeps first occurrence of each unique color_hex, and all variants without color_hex
  const deduplicateVariantsByColor = (variants: Filament[]): Filament[] => {
    const seenColorHexes = new Set<string>();
    const result: Filament[] = [];
    
    for (const variant of variants) {
      const normalizedHex = variant.color_hex 
        ? normalizeColorHex(variant.color_hex).toUpperCase() 
        : null;
      
      if (!normalizedHex) {
        // No color_hex - keep variant but check for duplicate titles
        const hasSimilarVariant = result.some(v => 
          !v.color_hex && v.product_title === variant.product_title
        );
        if (!hasSimilarVariant) {
          result.push(variant);
        }
      } else if (!seenColorHexes.has(normalizedHex)) {
        // New unique color - add it
        seenColorHexes.add(normalizedHex);
        result.push(variant);
      }
      // Skip duplicate color_hex values
    }
    
    return result;
  };

  // Group filaments by base product name (or product line for Prusament)
  const groupedProducts = useMemo(() => {
    if (!filaments) return [];

    // Filter by material if selected
    const filteredFilaments = selectedMaterial
      ? filaments.filter((f) => f.material === selectedMaterial)
      : filaments;

    const groups = new Map<string, GroupedProduct & { availableWeights: Set<number> }>();
    const isPrusament = decodedBrand.toLowerCase() === 'prusament';

    filteredFilaments.forEach((filament) => {
      // PRIORITY 1: Use product_line_id if available (authoritative from database)
      // This ensures consistent grouping with the Finder page for brands like Geeetech
      let groupKey: string;
      let displayName: string;
      
      if (filament.product_line_id) {
        // Use product_line_id for grouping - this is the authoritative source
        groupKey = filament.product_line_id;
        // Convert to display-friendly name using the utility function
        displayName = formatProductLineIdForDisplay(filament.product_line_id, filament.product_title);
      } else if (isPrusament) {
        // Prusament-specific logic (legacy)
        groupKey = getPrusamentProductLine(filament.material, filament.product_title);
        displayName = groupKey;
      } else {
        // Fallback: parse from title (for products without product_line_id)
        groupKey = getBaseProductName(filament.product_title, filament.material);
        displayName = groupKey;
      }
      
      if (!groups.has(groupKey)) {
        groups.set(groupKey, {
          baseName: displayName,
          material: filament.material,
          variants: [],
          representativeImage: null,
          priceRange: { min: null, max: null },
          productUrl: filament.product_url,
          categoryUrl: getCategoryUrl(decodedBrand, filament.material, displayName),
          availableWeights: new Set<number>(),
        });
      }

      const group = groups.get(groupKey)!;
      group.variants.push(filament);

      // Track available weights
      if (filament.net_weight_g) {
        group.availableWeights.add(filament.net_weight_g);
      }

      // Use first available image as representative (supports both http URLs and local paths)
      if (!group.representativeImage && filament.featured_image) {
        group.representativeImage = filament.featured_image;
      }

      // Track price range - calculate true per-kg price accounting for pack quantity
      if (filament.variant_price) {
        const packQty = (filament as any).pack_quantity || 1;
        const weightKg = filament.net_weight_g ? filament.net_weight_g / 1000 : 1;
        const totalWeightKg = weightKg * packQty;
        const pricePerKg = filament.variant_price / totalWeightKg;
        
        if (group.priceRange.min === null || pricePerKg < group.priceRange.min) {
          group.priceRange.min = pricePerKg;
        }
        if (group.priceRange.max === null || pricePerKg > group.priceRange.max) {
          group.priceRange.max = pricePerKg;
        }
      }
    });

    // Deduplicate variants by color within each group
    const result = Array.from(groups.values()).map(group => ({
      ...group,
      variants: deduplicateVariantsByColor(group.variants),
    }));

    // Sort: Prusament uses defined order, others alphabetical
    if (isPrusament) {
      const prusamentOrder = [
        'Prusament PLA',
        'Prusament PETG',
        'Prusament PC Blend',
        'Prusament PVB',
        'Prusament ASA',
        'Prusament ABS',
        'Prusament PA (Nylon)',
        'Prusament TPU',
        'Prusament Woodfill',
        'Prusament PLA Refill',
        'Prusament PETG Refill',
        'Prusament rPLA',
      ];
      return result.sort((a, b) => {
        const aIndex = prusamentOrder.indexOf(a.baseName);
        const bIndex = prusamentOrder.indexOf(b.baseName);
        if (aIndex === -1 && bIndex === -1) return a.baseName.localeCompare(b.baseName);
        if (aIndex === -1) return 1;
        if (bIndex === -1) return -1;
        return aIndex - bIndex;
      });
    }

    return result.sort((a, b) => a.baseName.localeCompare(b.baseName));
  }, [filaments, selectedMaterial, decodedBrand]);

  const getPricePerKg = (price: number | null) => {
    if (!price) return null;
    return price.toFixed(2);
  };

  const getCompanyTypeLabel = (type: string | undefined) => {
    switch (type) {
      case 'public': return 'Publicly Traded';
      case 'private': return 'Private Company';
      case 'subsidiary': return 'Subsidiary';
      case 'open-source': return 'Open Source Project';
      default: return null;
    }
  };

  const getCompanyTypeBadgeVariant = (type: string | undefined): "default" | "secondary" | "outline" | "destructive" => {
    switch (type) {
      case 'public': return 'default';
      case 'private': return 'secondary';
      case 'subsidiary': return 'outline';
      case 'open-source': return 'outline';
      default: return 'secondary';
    }
  };

  const totalVariants = filaments?.length || 0;

  return (
    <div className="min-h-screen p-8">
      <div className="max-w-7xl mx-auto">
        <Button variant="ghost" onClick={() => navigate("/brands")} className="mb-6">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Brands
        </Button>

        {/* Brand Header */}
        <Card className="mb-8">
          <CardContent className="p-8">
            <div className="flex flex-col md:flex-row gap-8 items-start">
              {brandLogo && (
                <div className="w-full md:w-48 h-32 flex items-center justify-center bg-background rounded-lg p-6 shrink-0">
                  <img
                    src={brandLogo}
                    alt={decodedBrand}
                    className="max-h-full max-w-full object-contain"
                  />
                </div>
              )}
              <div className="flex-1 space-y-4">
                <div>
                  <div className="flex flex-wrap items-center gap-3 mb-2">
                    <h1 className="text-4xl font-bold">{decodedBrand}</h1>
                    {brandInfo?.companyType && (
                      <Badge variant={getCompanyTypeBadgeVariant(brandInfo.companyType)}>
                        {getCompanyTypeLabel(brandInfo.companyType)}
                      </Badge>
                    )}
                    {automatedBrand?.platform_type && (
                      <Badge className={`${PLATFORM_COLORS[automatedBrand.platform_type] || 'bg-zinc-500'} text-white capitalize`}>
                        {automatedBrand.platform_type}
                      </Badge>
                    )}
                  </div>
                  
                  {/* Quick Info Row */}
                  {brandInfo && (
                    <div className="flex flex-wrap gap-4 text-sm text-muted-foreground mb-4">
                      {brandInfo.location && (
                        <span className="flex items-center gap-1">
                          <MapPin className="w-4 h-4" />
                          {brandInfo.location}
                        </span>
                      )}
                      {brandInfo.founded && (
                        <span className="flex items-center gap-1">
                          <Calendar className="w-4 h-4" />
                          Founded {brandInfo.founded}
                        </span>
                      )}
                      {brandInfo.employees && (
                        <span className="flex items-center gap-1">
                          <Users className="w-4 h-4" />
                          {brandInfo.employees} employees
                        </span>
                      )}
                      {brandInfo.website && (
                        <a 
                          href={brandInfo.website} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="flex items-center gap-1 text-primary hover:underline"
                        >
                          <Globe className="w-4 h-4" />
                          Website
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      )}
                    </div>
                  )}
                </div>

                {/* Company Details Grid */}
                {brandInfo && (brandInfo.headquarters || brandInfo.founder || brandInfo.ceo || brandInfo.president || brandInfo.parentCompany || brandInfo.subsidiaries || brandInfo.stockTicker) && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 p-4 bg-muted/30 rounded-lg border">
                    {brandInfo.headquarters && (
                      <div>
                        <div className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Headquarters</div>
                        <div className="text-sm font-medium">{brandInfo.headquarters}</div>
                      </div>
                    )}
                    
                    {(brandInfo.founder || brandInfo.ceo || brandInfo.president) && (
                      <div>
                        <div className="text-xs text-muted-foreground uppercase tracking-wide mb-1">
                          {brandInfo.ceo ? 'CEO' : brandInfo.president ? 'President' : 'Founder'}
                        </div>
                        <div className="text-sm font-medium">
                          {brandInfo.ceo || brandInfo.president || brandInfo.founder}
                        </div>
                      </div>
                    )}
                    
                    {brandInfo.parentCompany && (
                      <div>
                        <div className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Parent Company</div>
                        <div className="text-sm font-medium">{brandInfo.parentCompany}</div>
                      </div>
                    )}
                    
                    {brandInfo.subsidiaries && brandInfo.subsidiaries.length > 0 && (
                      <div>
                        <div className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Subsidiaries</div>
                        <div className="text-sm font-medium">{brandInfo.subsidiaries.join(', ')}</div>
                      </div>
                    )}
                    
                    {brandInfo.stockTicker && brandInfo.stockExchange && (
                      <div>
                        <div className="text-xs text-muted-foreground uppercase tracking-wide mb-1 flex items-center gap-1">
                          <TrendingUp className="w-3 h-3" />
                          Stock
                        </div>
                        <div className="text-sm font-medium">
                          {brandInfo.stockTicker} ({brandInfo.stockExchange})
                        </div>
                      </div>
                    )}
                    
                    {brandInfo.revenue && (
                      <div>
                        <div className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Revenue</div>
                        <div className="text-sm font-medium">{brandInfo.revenue}</div>
                      </div>
                    )}
                  </div>
                )}

                {/* Summary */}
                {brandInfo ? (
                  <p className="text-foreground leading-relaxed whitespace-pre-line">
                    {brandInfo.summary}
                  </p>
                ) : (
                  <p className="text-muted-foreground italic">
                    Information about {decodedBrand} coming soon.
                  </p>
                )}

                {/* Admin: Scraping Status Card */}
                {isAdmin && automatedBrand && (
                  <div className="mt-4 p-4 bg-muted/30 rounded-lg border">
                    <div className="flex items-center gap-2 mb-3">
                      <RefreshCw className="w-4 h-4 text-muted-foreground" />
                      <span className="text-sm font-medium">Scraping Status</span>
                      {automatedBrand.scraping_active && (
                        <Badge className="bg-primary/20 text-primary text-xs">
                          <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                          Running
                        </Badge>
                      )}
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
                      <div>
                        <div className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Status</div>
                        <div className="flex items-center gap-1.5">
                          {automatedBrand.scraping_enabled ? (
                            <>
                              <CheckCircle2 className="w-3.5 h-3.5 text-green-500" />
                              <span className="text-green-500 font-medium">Enabled</span>
                            </>
                          ) : (
                            <>
                              <AlertCircle className="w-3.5 h-3.5 text-amber-500" />
                              <span className="text-amber-500 font-medium">Disabled</span>
                            </>
                          )}
                        </div>
                      </div>
                      <div>
                        <div className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Last Sync</div>
                        <div className="flex items-center gap-1.5">
                          <Clock className="w-3.5 h-3.5 text-muted-foreground" />
                          <span>
                            {automatedBrand.last_scrape_at 
                              ? new Date(automatedBrand.last_scrape_at).toLocaleDateString()
                              : "Never"}
                          </span>
                        </div>
                      </div>
                      <div>
                        <div className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Success Rate</div>
                        <div className="font-medium">
                          {automatedBrand.total_scrapes && automatedBrand.total_scrapes > 0
                            ? `${Math.round((automatedBrand.successful_scrapes || 0) / automatedBrand.total_scrapes * 100)}%`
                            : "N/A"}
                        </div>
                      </div>
                      <div>
                        <div className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Products with URLs</div>
                        <div className="font-medium">
                          {automatedBrand.products_with_urls || 0} / {automatedBrand.product_count || 0}
                        </div>
                      </div>
                    </div>
                    {automatedBrand.last_error && (
                      <div className="mt-3 p-2 bg-destructive/10 rounded border border-destructive/20 text-xs text-destructive">
                        <span className="font-medium">Last Error:</span> {automatedBrand.last_error}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Filaments Section */}
        <div className="mb-6 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <h2 className="text-2xl font-bold">
              {decodedBrand} Products ({groupedProducts.length} products, {totalVariants} variants)
            </h2>
            
            <div className="flex flex-wrap items-center gap-2">
              {/* Admin: Scrape Colors Button */}
              {isAdmin && hasColorScraper && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleScrapeColors}
                  disabled={isScrapingColors}
                  className="h-7 text-xs"
                >
                  {isScrapingColors ? (
                    <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                  ) : (
                    <Palette className="w-3 h-3 mr-1" />
                  )}
                  Scrape Colors
                </Button>
              )}

              {/* Material Filter */}
              {availableMaterials.length > 1 && (
                <div className="flex items-center gap-2">
                  <Filter className="w-4 h-4 text-muted-foreground" />
                  <div className="flex flex-wrap gap-1.5">
                    <Button
                      variant={selectedMaterial === null ? "default" : "outline"}
                      size="sm"
                      onClick={() => setSelectedMaterial(null)}
                      className="h-7 text-xs"
                    >
                      All
                    </Button>
                    {availableMaterials.map((material) => (
                      <Button
                        key={material}
                        variant={selectedMaterial === material ? "default" : "outline"}
                        size="sm"
                        onClick={() => setSelectedMaterial(material)}
                        className="h-7 text-xs"
                      >
                        {material}
                      </Button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
          
          {selectedMaterial && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <span>Showing {selectedMaterial} products</span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSelectedMaterial(null)}
                className="h-6 px-2 text-xs"
              >
                Clear filter
              </Button>
            </div>
          )}
        </div>

        {isLoading ? (
          <div className="text-center py-12 text-muted-foreground">
            Loading filaments...
          </div>
        ) : groupedProducts.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {groupedProducts.map((product) => (
              <Card
                key={product.baseName}
                className="bg-card border-border hover:border-primary/50 transition-all cursor-pointer group"
                onClick={() => navigate(`/filament/${product.variants[0].id}`)}
              >
                <CardContent className="p-6">
                  <div className="space-y-4">
                    {/* Product Image */}
                    <div className="aspect-square rounded-lg overflow-hidden bg-muted flex items-center justify-center relative">
                      {product.representativeImage ? (
                        <img
                          src={product.representativeImage}
                          alt={product.baseName}
                          className="w-full h-full object-cover"
                          loading="lazy"
                        />
                      ) : (
                        <>
                          {brandLogo && (
                            <img
                              src={brandLogo}
                              alt={decodedBrand}
                              className="max-w-[60%] max-h-[60%] object-contain opacity-20"
                            />
                          )}
                          <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center">
                            <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center mb-2">
                              <span className="text-2xl font-bold text-primary">{product.material?.charAt(0) || '📦'}</span>
                            </div>
                            <div className="text-xs text-muted-foreground font-medium">{product.material || 'Filament'}</div>
                          </div>
                        </>
                      )}
                    </div>

                      {/* Product Info */}
                      <div className="space-y-3">
                        <h3 className="font-semibold text-lg">{product.baseName.replace(/\s+[\d.]+mm\s+[\d.]+kg\s+Filament$/i, '')}</h3>
                      
                      <div className="flex flex-wrap gap-2">
                        {product.material && (
                          <MaterialBadge material={product.material} variant="secondary" />
                        )}
                        <Badge variant="outline">{product.variants.length} color{product.variants.length !== 1 ? 's' : ''}</Badge>
                      </div>

                      {/* Available Weights */}
                      {(product as any).availableWeights && (product as any).availableWeights.size > 1 && (
                        <div className="flex flex-wrap gap-1.5">
                          <span className="text-xs text-muted-foreground">Sizes:</span>
                          {Array.from((product as any).availableWeights as Set<number>)
                            .sort((a, b) => a - b)
                            .map((weight: number) => (
                              <Badge key={weight} variant="secondary" className="text-xs px-1.5 py-0.5">
                                {weight >= 1000 ? `${weight / 1000}kg` : `${weight}g`}
                              </Badge>
                            ))
                          }
                        </div>
                      )}

                      {/* Price Range */}
                      {product.priceRange.min && (
                        <div className="text-lg font-bold text-primary">
                          {product.priceRange.min === product.priceRange.max 
                            ? `${formatPrice(product.priceRange.min)}/kg`
                            : `${formatPrice(product.priceRange.min)} - ${formatPrice(product.priceRange.max)}/kg`
                          }
                        </div>
                      )}

                      {/* Color Variants */}
                      {product.variants.length > 1 && (
                        <div className="pt-2 border-t">
                          <div className="text-xs text-muted-foreground mb-2">Available Colors:</div>
                          <div className="flex flex-wrap gap-1.5">
                            {product.variants.map((variant) => {
                              const colorName = getColorFromTitle(variant.product_title, product.baseName) || variant.color_family;
                              const hasColorHex = !!variant.color_hex;
                              
                              return (
                                <button
                                  key={variant.id}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    navigate(`/filament/${variant.id}`);
                                  }}
                                  className="group/swatch relative"
                                  title={colorName || variant.product_title}
                                >
                                  {hasColorHex ? (
                                    <div 
                                      className="w-7 h-7 rounded-full border-2 border-border hover:border-primary hover:scale-110 transition-all shadow-sm"
                                      style={{ 
                                        backgroundColor: normalizeColorHex(variant.color_hex),
                                        boxShadow: normalizeColorHex(variant.color_hex).toUpperCase() === '#FFFFFF' 
                                          ? 'inset 0 0 0 1px rgba(0,0,0,0.1)' 
                                          : undefined
                                      }}
                                    />
                                  ) : (
                                    <div className="px-2 py-1 text-xs rounded-md bg-muted hover:bg-primary/20 hover:text-primary transition-colors flex items-center gap-1">
                                      <span className="w-3 h-3 rounded-full bg-gradient-to-br from-muted-foreground/30 to-muted-foreground/10 border border-border" />
                                      {colorName || 'View'}
                                    </div>
                                  )}
                                  {/* Tooltip on hover */}
                                  <div className="absolute -top-8 left-1/2 -translate-x-1/2 px-2 py-1 bg-popover text-popover-foreground text-xs rounded shadow-lg opacity-0 group-hover/swatch:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-10 border border-border">
                                    {colorName || variant.product_title}
                                  </div>
                                </button>
                              );
                            })}
                          </div>
                          {/* View Collection button for grouped products with category URL */}
                          {product.categoryUrl && (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="w-full mt-2 text-xs"
                              onClick={(e) => {
                                e.stopPropagation();
                                window.open(getRegionalUrl(product.categoryUrl, decodedBrand), '_blank');
                              }}
                            >
                              <ExternalLink className="w-3 h-3 mr-1" />
                              View Collection
                            </Button>
                          )}
                        </div>
                      )}

                      {/* Single product - direct link */}
                      {product.variants.length === 1 && (
                        <Button 
                          variant="outline" 
                          className="w-full mt-2"
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/filament/${product.variants[0].id}`);
                          }}
                        >
                          View Details
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="p-12 text-center text-muted-foreground">
              No filaments found for {decodedBrand}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default BrandDetail;
