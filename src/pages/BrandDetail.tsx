import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toBrandSlug, isEncodedBrandName } from "@/utils/brandSlug";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Loader2, CheckCircle2, Clock, AlertCircle, RefreshCw } from "lucide-react";
import { getBrandLogo } from "@/lib/brandLogos";
import { getBrandInfo } from "@/lib/brandInfo";
import type { Tables } from "@/integrations/supabase/types";
import { useEffect, useMemo, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useRegion } from "@/contexts/RegionContext";
import { normalizeColorHex } from "@/lib/utils";
import { formatProductLineIdForDisplay } from "@/lib/productNameUtils";
import { BrandHeroSection } from "@/components/brands/BrandHeroSection";
import { BrandTabNav, BrandTabContent, type BrandTab } from "@/components/brands/tabs/BrandTabNav";
import { BrandOverviewTab } from "@/components/brands/tabs/BrandOverviewTab";
import { BrandAboutTab } from "@/components/brands/tabs/BrandAboutTab";
import { BrandProductsTab } from "@/components/brands/tabs/BrandProductsTab";
import { BrandSEO } from "@/components/seo/BrandSEO";
import { BreadcrumbSchema } from "@/components/seo";
import { BrandBadgesDisplay, getBrandBadges } from "@/components/brands/BrandBadges";
import { BrandFAQSection } from "@/components/brands/BrandFAQSection";

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
  const decodedBrand = brand ? decodeURIComponent(brand) : "";
  const brandSlug = toBrandSlug(decodedBrand);
  const [selectedMaterial, setSelectedMaterial] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<BrandTab>("overview");
  const { isAdmin } = useAuth();
  const { formatPrice } = useRegion();

  // Redirect old URL format (e.g., /brands/Spectrum%20Filaments) to slug format (/brands/spectrum-filaments)
  useEffect(() => {
    if (brand && isEncodedBrandName(brand)) {
      navigate(`/brands/${brandSlug}`, { replace: true });
    }
  }, [brand, brandSlug, navigate]);

  // Fetch public brand data (safe for all users)
  const { data: automatedBrand } = useQuery({
    queryKey: ["public-brand", brandSlug],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("v_public_brands")
        .select("*")
        .or(`brand_name.ilike.${decodedBrand},brand_slug.eq.${brandSlug}`)
        .maybeSingle();

      if (error) throw error;
      return data;
    },
    enabled: !!brandSlug,
  });

  // Derive proper display name and logo from DB data, falling back to slug/static map
  const displayName = automatedBrand?.display_name || automatedBrand?.brand_name || decodedBrand.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
  const brandInfo = getBrandInfo(displayName);
  const brandLogo = automatedBrand?.logo_url || getBrandLogo(displayName) || getBrandLogo(decodedBrand);

  // Admin-only query for scraping status and sensitive data
  const { data: adminBrandData } = useQuery({
    queryKey: ["admin-brand-data", brandSlug, isAdmin],
    queryFn: async () => {
      if (!isAdmin) return null;
      const { data, error } = await supabase
        .from("automated_brands")
        .select("*")
        .or(`brand_name.ilike.${decodedBrand},brand_slug.eq.${brandSlug}`)
        .maybeSingle();

      if (error) throw error;
      return data;
    },
    enabled: !!brandSlug && isAdmin,
  });

  const { data: filaments, isLoading } = useQuery({
    queryKey: ["brand-filaments", brandSlug],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("filaments")
        .select("*")
        .ilike("vendor", decodedBrand.replace(/-/g, ' '))
        .or("net_weight_g.is.null,net_weight_g.gte.300")
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

  const hasHighSpeedProducts = filaments?.some(f => f.high_speed_capable) ?? false;
  const brandBadges = getBrandBadges(displayName, hasHighSpeedProducts);
  const isPremium = brandBadges.includes('premium');
  const isBudgetFriendly = brandBadges.includes('budget-friendly');

  return (
    <div className="min-h-screen p-8">
      {/* Breadcrumb Schema */}
      <BreadcrumbSchema
        items={[
          { name: 'Home', url: 'https://filascope.com/' },
          { name: 'Brands', url: 'https://filascope.com/brands' },
          { name: displayName, url: `https://filascope.com/brands/${brandSlug}` },
        ]}
      />

      {/* Brand SEO */}
      <BrandSEO
        brandName={displayName}
        description={brandInfo?.summary?.slice(0, 160)}
        canonicalUrl={`/brands/${brandSlug}`}
        image={brandLogo}
        productCount={filaments?.length}
        materials={availableMaterials}
      />

      <div className="max-w-7xl mx-auto">
        <Button variant="ghost" onClick={() => navigate("/brands")} className="mb-6">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Brands
        </Button>

        {/* Brand Hero Section */}
        <BrandHeroSection
          brandName={displayName}
          brandLogo={brandLogo}
          isVerified={automatedBrand?.is_visible ?? false}
          location={brandInfo?.location}
          founded={brandInfo?.founded}
          website={brandInfo?.website}
          productLineCount={groupedProducts.length}
          variantCount={filaments?.length ?? 0}
          topMaterials={availableMaterials}
          avgPriceRange={(() => {
            if (!filaments || filaments.length === 0) return undefined;
            // Primary: use variant_price from filaments table
            const prices = filaments
              .map(f => f.variant_price)
              .filter((p): p is number => p !== null && p > 0);
            if (prices.length > 0) {
              const min = Math.min(...prices);
              const max = Math.max(...prices);
              return `${formatPrice(min).split('.')[0]}-${formatPrice(max).split('.')[0]}`;
            }
            // No variant_price data — return undefined (will show "—")
            return undefined;
          })()}
          rating={null}
        />

        {/* Brand Badges */}
        {brandBadges.length > 0 && (
          <div className="mb-6">
            <BrandBadgesDisplay 
              brandName={displayName} 
              hasHighSpeedProducts={hasHighSpeedProducts}
              size="md"
            />
          </div>
        )}

        {/* Admin Scraping Status - Removed from user-facing page */}

        {/* Tab Navigation */}
        <BrandTabNav 
          activeTab={activeTab} 
          onTabChange={setActiveTab}
          productCount={groupedProducts.length}
        />

        {/* Tab Content */}
        <BrandTabContent activeTab={activeTab}>
          {/* Overview Tab */}
          {activeTab === "overview" && (
            <BrandOverviewTab
              brandName={displayName}
              brandLogo={brandLogo}
              groupedProducts={groupedProducts}
              availableMaterials={availableMaterials}
              hasHighSpeedProducts={filaments?.some(f => f.high_speed_capable) ?? false}
              hasEcoSpools={filaments?.some(f => f.spool_material === 'cardboard' || f.spool_material === 'mixed') ?? false}
              hasRFID={filaments?.some(f => f.transmission_distance && f.transmission_distance > 0) ?? false}
              onViewAllProducts={() => setActiveTab("products")}
              onFilterByMaterial={(material) => {
                setSelectedMaterial(material);
                setActiveTab("products");
              }}
            />
          )}

          {/* Products Tab */}
          {activeTab === "products" && (
            <BrandProductsTab
              brandName={displayName}
              brandLogo={brandLogo}
              groupedProducts={groupedProducts}
              filaments={filaments || []}
              initialMaterialFilter={selectedMaterial}
              onMaterialFilterChange={setSelectedMaterial}
            />
          )}

          {/* About Tab */}
          {activeTab === "about" && (
            <>
            <BrandAboutTab
              brandName={displayName}
              brandInfo={brandInfo}
              productCount={groupedProducts.length}
              materialsCount={availableMaterials.length}
            />
            {/* FAQ Section for SEO */}
            <BrandFAQSection
              brandName={displayName}
              productCount={filaments?.length ?? 0}
              materials={availableMaterials}
              isVerified={automatedBrand?.is_visible ?? false}
              isPremium={isPremium}
              isBudgetFriendly={isBudgetFriendly}
            />
            </>
          )}
        </BrandTabContent>
      </div>
    </div>
  );
};

export default BrandDetail;
