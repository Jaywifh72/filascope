import { useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Database } from '@/integrations/supabase/types';
import { isFilamentAvailableInRegion, type FilamentWithRegion } from '@/hooks/useRegionalFiltering';
import type { RegionCode } from '@/lib/brandRegionalStores';
import { cleanFilamentDisplayName } from '@/lib/productNameUtils';

type Filament = Database["public"]["Tables"]["filaments"]["Row"];

// Common color names to detect at the end of product titles
const COLOR_WORDS = [
  'Beige', 'Black', 'Blue', 'Brown', 'Burgundy', 'Charcoal', 'Copper', 'Cream', 'Cyan',
  'Gold', 'Gray', 'Grey', 'Green', 'Ivory', 'Lavender', 'Magenta', 'Maroon', 'Navy',
  'Olive', 'Orange', 'Peach', 'Pink', 'Purple', 'Red', 'Rose', 'Salmon', 'Silver',
  'Tan', 'Teal', 'Turquoise', 'Violet', 'White', 'Yellow', 'Natural', 'Clear', 'Transparent',
  'Jet Black', 'Lipstick Red', 'Prusa Pro Green', 'Prusa Galaxy Black', 'Prusa Orange',
  'Signal White', 'Olive Green', 'Sapphire Blue', 'Azure Blue', 'Opal Green', 'Mystic Green',
  'Mystic Brown', 'Galaxy Black', 'Galaxy Silver', 'Army Green',
  'Brick Red', 'Indigo Blue', 'Malachite Green', 'Titan Gray', 'Violet Purple',
  'Bambu Green', 'Navy Blue', 'Tangerine Yellow', 'Azure',
  'Anthracite Grey', 'Carmine Red', 'Chalky Blue', 'Jungle Green', 'Mango Yellow',
  'Neon Green', 'Shimmering Violet', 'Ultramarine Blue', 'Carbon Fiber Black',
  "Gentleman's Grey", 'Ms Pink', 'Mr Wintermint', 'Oh My Gold', 'Pineapple Yellow',
  'Lipstick Red', 'Urban Grey',
];

// Terms that are PRODUCT VARIANTS (not colors)
const PRODUCT_VARIANT_TERMS = [
  'Matte', 'Matt', 'Silk', 'Glitter', 'Silk Glitter', 'Carbon Fiber', 'CF',
  'Recycled', 'CMYK Bundle', 'CMYK', 'Bundle', 'Bulk Buy', 'Wood Fill', 'HF', 'High Flow',
  '10 rolls', '10 packs', 'Pack', 'Pellets', 'Large-Format',
  'Conductive', 'ESD', 'Performance', 'Essentials', 'Basics',
];

// Marketing/compatibility suffixes to strip from titles
const TITLE_CLEANUP_PATTERNS = [
  /\s*-?\s*Bambu\s+AMS\s+Compatible\s*$/i,
  /\s*-?\s*AMS\s+Compatible\s*$/i,
  /\s*-?\s*Bambu\s+Compatible\s*$/i,
  /\s*\|\s*Matter3D\s*$/i,
  /\s*\|\s*[\w\s]+$/i,
];

export function cleanProductTitle(title: string): string {
  let cleaned = title.trim();
  for (const pattern of TITLE_CLEANUP_PATTERNS) {
    cleaned = cleaned.replace(pattern, '').trim();
  }
  return cleaned.replace(/\s+/g, ' ').trim();
}

export function getBaseProductName(title: string): string {
  if (!title) return '';
  // First, clean the title by removing diameter/weight suffixes
  const cleanedForDisplay = cleanFilamentDisplayName(title);
  const cleanedTitle = cleanProductTitle(cleanedForDisplay);
  let normalizedTitle = cleanedTitle
    .replace(/\s*\(NFC\)\s*/gi, '')
    .replace(/\s+Refill\s*$/gi, '')
    .trim();
  
  // 3D-FUEL PATTERN: Handle comma-separated format "ProductLine Material, Color, Size"
  // Examples: "Standard PLA+, Desert Tan, 1.75mm" → "Standard PLA+"
  //           "Tough Pro PLA+, Almond, 1.75mm" → "Tough Pro PLA+"
  //           "Silk PLA+, Silky Black Hills Gold, 1.75mm" → "Silk PLA+"
  const threeDFuelProductLines = [
    'Dual-Color Silk', 'Dual Color Silk',
    'Tough Pro', 'Standard', 'Silk', 'Pro',
  ];
  
  for (const productLine of threeDFuelProductLines) {
    const regex = new RegExp(
      `^(${productLine.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\s+(?:PLA\\+?|PETG|PCTG|ABS|TPU|ASA|PC)),\\s*.+$`,
      'i'
    );
    const match = normalizedTitle.match(regex);
    if (match) {
      return match[1].trim();
    }
  }

  // EXTRUDR PATTERN: Handle "Extrudr [ProductLine] [Color] ral [code]" format
  const extrudrMatch = normalizedTitle.match(/^(Extrudr\s+(?:[\w-]+\s+)*(?:PLA|PETG|ABS|ASA|PA\d*|PC|TPU|FLEX|PCTG|GreenTEC|BioFusion|FLAX|PEARL)(?:\s+(?:CF|GF|Pro|Basic|NX2|MATT|Hard|Medium|Semisoft))*)\s+.+\s+ral\s+\d+$/i);
  if (extrudrMatch) {
    return extrudrMatch[1].trim();
  }

  // AZUREFILM PATTERN: Handle "[Material] [ProductLine] filament [Color]" format
  // NOTE: High Speed, High-Speed, Tough+, etc. are product lines, NOT colors
  const azurefilmFilamentMatch = normalizedTitle.match(/^((?:PLA|PETG|ABS|ASA|TPU|Flexible\s+\d+A)(?:\s+(?:Matte|Silk|Original|Hyper\s*Speed|High[- ]?Speed|HS|Lumos|CMYK|Basic|Plus|Pro|Tough\+?)(?:\s+(?:Dual\s+Color|Rainbow|Litho))?)?)\s+(?:filament\s+)?(.+)$/i);
  if (azurefilmFilamentMatch) {
    const basePart = azurefilmFilamentMatch[1].trim();
    const remainder = azurefilmFilamentMatch[2].trim();
    // Don't match if remainder is a product line suffix, not a color
    const productLineSuffixes = ['basic', 'high speed', 'high-speed', 'glow in the dark', 'galaxy', 'marble', 'tough', 'translucent', 'aero', 'hf', 'cf', 'gf', 'wood', 'metal', 'sparkle'];
    const isProductLine = productLineSuffixes.some(s => remainder.toLowerCase().startsWith(s));
    if (!isProductLine && !remainder.match(/\d+-pack|Sample|plate|Magnetic|drill/i)) {
      return basePart;
    }
  }

  // AMOLEN PATTERN - Handle "Material ProductLine [Filament] [Size] [Color]" format
  // Must come BEFORE other patterns to correctly extract product lines like "PLA Matte Triple"
  const amelonProductLines = [
    // Multi-packs must be matched before single-spool product lines
    'Crystal-Transparent Gradient Variety Pack', 'Gradient Variety Pack', 'Variety Pack',
    // Sub-lines with Rainbow/Dual/Triple BEFORE base patterns (longer patterns first)
    'Basic-High Speed', 'Basic High Speed', 'Basic Dual Color-High Speed', 'Basic Dual Color',
    'Matte Rainbow', 'Matte Triple', 'Matte Dual', 'Matte Basic', 'Matte Tri-Color',
    'Silk Rainbow', 'Silk Triple', 'Silk Dual', 'Silk Starry', 'Silk Tri-Color',
    'Transparent Rainbow', 'Crystal-Transparent',
    // Anycubic/general product lines
    'High Speed', 'High-Speed',
    // Base patterns last
    'Matte', 'Silk', 'Marble', 'Marble Texture', 'Sparkle', 'Galaxy', 'Glow in the Dark', 'Glow',
    'Wood', 'Carbon Fiber', 'Metal', 'Transparent', 'Clear',
    'Basic', '90A Flexible', '95A Flexible', '85A',
  ];
  const sortedProductLines = [...amelonProductLines].sort((a, b) => b.length - a.length);
  
  for (const productLine of sortedProductLines) {
    // Match: Material + ProductLine + optional "Filament" (with possible comma) + anything else
    // Also handles dash-separated colors like "PETG Transparent - Sky Blue"
    const regex = new RegExp(
      `^((?:PLA\\+?|PETG|ABS|TPU|TPE|ASA|PEBA|PA\\d*|PC|HIPS|PVA|Nylon)\\s+${productLine.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})(?:[,\\s]+Filament)?(?:\\s+-\\s+.+|[,\\s]+[\\d.]+\\s*mm.*|[,\\s]+.+)?$`,
      'i'
    );
    const match = normalizedTitle.match(regex);
    if (match) {
      return match[1].trim();
    }
  }
  
  // ANYCUBIC PATTERN: Handle promotional products and product lines
  // Examples: "PLA Silk Christmas Bulk Sale Copper" → "PLA Silk" (after cleaning promo)
  //           "PETG Filament Lake Blue" → "PETG"
  //           "High Speed PLA Black" → "High Speed PLA"
  //           "Matte PLA Grey" → "Matte PLA"
  const promotionalPatterns = [
    /Christmas\s*Bulk\s*Sale/gi,
    /Flash\s*Sale/gi,
    /Buy\s*\d+.*Get\s*\d+.*Free/gi,
    /\d+-\d+kg\s*Deals?/gi,
    /Bulk\s*Sale/gi,
    /Special\s*Offer/gi,
  ];
  
  let cleanedForParsing = normalizedTitle;
  for (const pattern of promotionalPatterns) {
    cleanedForParsing = cleanedForParsing.replace(pattern, '');
  }
  cleanedForParsing = cleanedForParsing.replace(/\s+/g, ' ').trim();
  
  // Anycubic product lines (ordered from most specific to least)
  const anycubicProductLines = [
    'High Speed', 'High-Speed', 'HS',
    'Silk', 'Matte', 'Marble', 'Sparkle', 'Glow in the Dark', 'Glow-in-the-Dark', 'Glow',
    'Carbon Fiber', 'CF',
    'Basic', 'Standard', 'Plus', 'Pro',
  ];
  
  for (const productLine of anycubicProductLines) {
    // Match: [optional Brand] [ProductLine] Material [Color]
    const regex = new RegExp(
      `^((?:Anycubic\\s+)?${productLine.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\s+(?:PLA\\+?|PETG\\+?|ABS|TPU|ASA|PC))(?:\\s+Filament)?(?:\\s+.+)?$`,
      'i'
    );
    const match = cleanedForParsing.match(regex);
    if (match) {
      return match[1].trim();
    }
    
    // Also try: Material [ProductLine] [Color] pattern
    const regex2 = new RegExp(
      `^((?:Anycubic\\s+)?(?:PLA\\+?|PETG\\+?|ABS|TPU|ASA|PC)\\s+${productLine.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})(?:\\s+Filament)?(?:\\s+.+)?$`,
      'i'
    );
    const match2 = cleanedForParsing.match(regex2);
    if (match2) {
      return match2[1].trim();
    }
  }
  
  // BAMBU LAB PATTERN: Handle product lines like "PLA Tough+", "PLA Basic", "PETG HF", "PLA Matte"
  // These MUST be matched before the simple material match to avoid "Tough+" being stripped as color
  const bambuProductLines = [
    'Tough\\+?', 'Basic', 'Matte', 'Silk', 'Silk\\+', 'Translucent', 'Wood', 'Metal', 
    'Galaxy', 'Glow', 'Sparkle', 'Aero', 'HF', 'HS', 'CF', 'GF',
  ];
  const bambuLinePattern = new RegExp(
    `^((?:PLA|PETG|ABS|ASA|TPU|PC|PA|PET|PPS)(?:-(?:CF|GF))?\\s+(?:${bambuProductLines.join('|')}))$`,
    'i'
  );
  const bambuLineMatch = cleanedForParsing.match(bambuLinePattern);
  if (bambuLineMatch) {
    return bambuLineMatch[1].trim();
  }
  
  // Simple material match for Anycubic: "[Anycubic] Material [Filament] Color"
  const simpleMatch = cleanedForParsing.match(
    /^((?:Anycubic\s+)?(?:PLA\+?|PETG\+?|ABS|TPU|TPU\s+95A|ASA|PC))(?:\s+Filament)?(?:\s+.+)?$/i
  );
  if (simpleMatch) {
    return simpleMatch[1].trim();
  }
  
  // Pattern 0: Paramount 3D style
  const paramountMatch = normalizedTitle.match(/^((?:PLA\+?|PETG|ABS|TPU|TPE|ASA|PA\d*|PC|HIPS|PVA|Nylon|Carbon\s+Fiber\s+\w+))\s*\(.+\)\s+[\d.]+mm\s+[\d.]+kg\s+Filament$/i);
  if (paramountMatch) return paramountMatch[1].trim();
  
  // Pattern 0.5: Bambu Lab Wood filaments
  const bambuWoodMatch = normalizedTitle.match(/^((?:Bambu\s*Lab|Bambu)\s+PLA\s+Wood)\s+(.+)$/i);
  if (bambuWoodMatch) {
    const basePart = bambuWoodMatch[1].trim();
    const colorPart = bambuWoodMatch[2].trim();
    const woodColors = ['Black Walnut', 'Classic Birch', 'Clay Brown', 'Ochre Yellow', 'Rosewood', 'White Oak'];
    if (woodColors.some(c => colorPart.toLowerCase() === c.toLowerCase())) {
      return basePart;
    }
  }
  
  // Pattern 1: Handle "Brand Material Color Weight" pattern
  const weightMatch = normalizedTitle.match(/^(.+?\s+(?:PLA\+?|PETG|ABS|TPU|TPE|ASA|PA\d*|PC(?:\s+Blend)?|HIPS|PVA|Nylon|PA11\s+Carbon\s+Fiber))\s+.+?\s+\d+(?:\.\d+)?(?:kg|g)\s*$/i);
  if (weightMatch) return weightMatch[1].trim();
  
  // Pattern 2: "Brand Material - Variant" (dash separator)
  const dashMatch = normalizedTitle.match(/^(.+?)\s+-\s+(.+)$/);
  if (dashMatch) {
    const beforeDash = dashMatch[1].trim();
    const afterDash = dashMatch[2].trim();
    const isExactVariant = PRODUCT_VARIANT_TERMS.some(term => 
      afterDash.toLowerCase().trim() === term.toLowerCase()
    );
    if (isExactVariant) {
      return normalizedTitle
        .replace(/\s+Bambu\s+AMS\s+Compatible\s*$/i, '')
        .replace(/\s+AMS\s+Compatible\s*$/i, '')
        .trim();
    }
    return beforeDash;
  }
  
  // Pattern 3: Check for color word at the end
  const sortedColors = [...COLOR_WORDS].sort((a, b) => b.length - a.length);
  for (const color of sortedColors) {
    const regex = new RegExp(`^(.+?)\\s+${color}$`, 'i');
    const match = normalizedTitle.match(regex);
    if (match) return match[1].trim();
  }
  
  return normalizedTitle;
}

function isProductVariant(term: string): boolean {
  const termLower = term.toLowerCase().trim();
  return PRODUCT_VARIANT_TERMS.some(v => termLower === v.toLowerCase());
}

export function getColorFromTitle(title: string, baseName: string): string | null {
  // First apply cleanFilamentDisplayName to remove weight/diameter for consistency
  const displayCleaned = cleanFilamentDisplayName(title);
  const cleanedTitle = cleanProductTitle(displayCleaned);
  
  let cleanTitle = cleanedTitle
    .replace(/\s*\(NFC\)\s*/gi, '')
    .replace(/\s+Refill\s*$/gi, '')
    .replace(/\s+\d+(?:\.\d+)?(?:kg|g)\s*$/gi, '')
    .trim();
  
  // Strip "Filament" for matching purposes (Amolen pattern)
  const cleanTitleNoFilament = cleanTitle.replace(/\s+Filament\b/gi, '').trim();
  
  if (cleanTitleNoFilament === baseName || cleanTitle === baseName) return null;
  
  // Prusament-specific handling
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
        colorPart = colorPart.replace(/^Prusa\s+/i, '').trim();
        if (line === 'Galaxy') colorPart = colorPart.replace(/^Galaxy\s+/i, '').trim();
        return colorPart || null;
      }
    }
  }
  
  // Pattern 0: Paramount 3D style - extract color from parentheses
  const parenMatch = cleanTitle.match(/\(([^)]+)\)/);
  if (parenMatch) {
    const extracted = parenMatch[1].trim();
    if (isProductVariant(extracted)) return null;
    return extracted;
  }
  
  // Pattern 1: Dash separator
  const dashMatch = cleanedTitle.match(/^.+?\s+-\s+(.+?)(?:\s+\d+(?:\.\d+)?(?:kg|g))?(?:\s*\(NFC\))?(?:\s+Refill)?$/i);
  if (dashMatch) {
    const extracted = dashMatch[1].trim();
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
  
  // Fallback: check with "Filament" stripped first (handles Amolen pattern)
  if (cleanTitleNoFilament.startsWith(baseName)) {
    const extracted = cleanTitleNoFilament.slice(baseName.length).replace(/^[\s-]+/, '').trim();
    if (!extracted || isProductVariant(extracted)) return null;
    return extracted;
  }
  
  // Original fallback: everything after base name
  if (cleanTitle.startsWith(baseName)) {
    const extracted = cleanTitle.slice(baseName.length).replace(/^[\s-]+/, '').trim();
    if (!extracted || isProductVariant(extracted)) return null;
    return extracted;
  }
  
  return null;
}

function normalizeColorName(colorName: string, vendor: string): string {
  let normalized = colorName.toLowerCase().trim();
  const brandPrefixes = [
    'prusa', 'prusament', 'bambu', 'bambulab', 'creality', 'anycubic',
    'polymaker', 'esun', 'hatchbox', 'overture', 'sunlu', 'elegoo'
  ];
  const vendorLower = vendor?.toLowerCase() || '';
  const allPrefixes = [...brandPrefixes, vendorLower].filter(Boolean);
  
  for (const prefix of allPrefixes) {
    if (normalized.startsWith(prefix + ' ')) {
      normalized = normalized.slice(prefix.length).trim();
      break;
    }
  }
  return normalized;
}

function extractPrusamentProductLine(title: string): { productLine: string; colorPart: string } | null {
  const cleanTitle = title
    .replace(/\s*\(NFC\)\s*/gi, '')
    .replace(/\s+Refill\s*$/gi, '')
    .replace(/\s+\d+(?:\.\d+)?(?:kg|g)\s*$/gi, '')
    .trim();
  
  const productLinePatterns = [
    { pattern: /^Prusament\s+Premium\s+PLA\s+Galaxy\s+(.+)$/i, line: 'Premium Galaxy' },
    { pattern: /^Prusament\s+Premium\s+PLA\s+Mystic\s+(.+)$/i, line: 'Premium Mystic' },
    { pattern: /^Prusament\s+Premium\s+PLA\s+Pearl\s+(.+)$/i, line: 'Premium Pearl' },
    { pattern: /^Prusament\s+PLA\s+Galaxy\s+(.+)$/i, line: 'Galaxy' },
    { pattern: /^Prusament\s+PLA\s+Blend\s+(.+)$/i, line: 'Blend' },
    { pattern: /^Prusament\s+PLA\s+Recycled\s*(.*)$/i, line: 'Recycled' },
    { pattern: /^Prusament\s+rPLA\s+(.+)$/i, line: 'rPLA' },
    { pattern: /^Prusament\s+PLA\s+(.+)$/i, line: 'Basic' },
  ];
  
  for (const { pattern, line } of productLinePatterns) {
    const match = cleanTitle.match(pattern);
    if (match) {
      let colorPart = match[1]?.trim() || '';
      colorPart = colorPart.replace(/^Prusa\s+/i, '').trim();
      if (line === 'Galaxy' || line === 'Premium Galaxy') {
        colorPart = colorPart.replace(/^Galaxy\s+/i, '').trim();
      }
      return { productLine: line, colorPart };
    }
  }
  return null;
}

// Extract color name from color_family field (strips material prefix)
// For rainbow/gradient products, return the full color_family as it IS the color identifier
function extractColorFromFamily(colorFamily: string | null): string | null {
  if (!colorFamily) return null;
  
  // For rainbow/gradient products, the color_family IS the distinguishing color
  // e.g., "Sunset Rainbow", "Candy Rainbow", "Galaxy Rainbow" - these are unique colors
  if (/rainbow|gradient|tri-?color|multicolor|dual.?color/i.test(colorFamily)) {
    return colorFamily.trim();
  }
  
  // Strip material prefixes like "PETG ", "PLA ", etc.
  return colorFamily.replace(/^(PLA|PETG|ABS|TPU|TPE|ASA|PA\d*|PC|HIPS|PVA|Nylon)\s+/i, '').trim() || null;
}

function deduplicateColorVariants(variants: Filament[], baseName: string): Filament[] {
  const seenColors = new Set<string>();
  const result: Filament[] = [];
  const vendor = variants[0]?.vendor || '';
  const isPrusament = vendor.toLowerCase().includes('prusa');
  
  const sorted = [...variants].sort((a, b) => {
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
    return aTitle.length - bTitle.length;
  });
  
  for (const variant of sorted) {
    // Try title extraction first, then fallback to color_family
    const colorName = getColorFromTitle(variant.product_title, baseName) 
      || extractColorFromFamily(variant.color_family);
    const hasColorHex = variant.color_hex && variant.color_hex.length > 0;
    
    // Skip variants with no color identifier - these are likely bulk packs
    if (!colorName && !hasColorHex) {
      continue;
    }
    
    let colorKey: string;
    
    if (isPrusament) {
      const lineInfo = extractPrusamentProductLine(variant.product_title);
      if (lineInfo) {
        colorKey = `${lineInfo.productLine.toLowerCase()}-${lineInfo.colorPart.toLowerCase()}`;
      } else {
        colorKey = variant.color_hex?.toLowerCase() || variant.id;
      }
    } else if (colorName) {
      // Use extracted color name (normalized for deduplication)
      colorKey = normalizeColorName(colorName, vendor);
    } else if (variant.color_family) {
      // Fallback to color_family directly for rainbow/specialty products
      // where color extraction from title may fail
      colorKey = variant.color_family.toLowerCase();
    } else {
      // Last resort: use hex or id
      colorKey = variant.color_hex?.toLowerCase() || variant.id;
    }
    
    if (!seenColors.has(colorKey)) {
      seenColors.add(colorKey);
      result.push(variant);
    }
  }
  
  return result;
}

export interface UseFilamentColorVariantsResult {
  colorVariants: Filament[];
  availableWeights: { weight: number; pricePerKg: number | null; count: number }[];
  selectedWeight: number | null;
  setSelectedWeight: (weight: number | null) => void;
  selectedVariant: Filament | null;
  handleColorVariantSelect: (variant: Filament) => void;
  productLineAvailableInRegion: boolean;
  getColorFromTitle: (title: string, baseName: string) => string | null;
  getBaseProductName: (title: string) => string;
}

export function useFilamentColorVariants(
  filament: Filament | null,
  currentRegion: RegionCode
): UseFilamentColorVariantsResult {
  const [colorVariants, setColorVariants] = useState<Filament[]>([]);
  const [availableWeights, setAvailableWeights] = useState<{ weight: number; pricePerKg: number | null; count: number }[]>([]);
  const [selectedWeight, setSelectedWeight] = useState<number | null>(null);
  const [selectedVariant, setSelectedVariant] = useState<Filament | null>(null);
  const [productLineAvailableInRegion, setProductLineAvailableInRegion] = useState<boolean>(false);

  // Reset selected variant when base filament changes
  useEffect(() => {
    setSelectedVariant(null);
  }, [filament?.id]);

  const handleColorVariantSelect = useCallback((variant: Filament) => {
    setSelectedVariant(variant);
    window.history.replaceState({}, '', `/filament/${variant.id}`);
  }, []);

  useEffect(() => {
    const fetchColorVariants = async () => {
      if (!filament || !filament.vendor) {
        setColorVariants([]);
        setAvailableWeights([]);
        return;
      }

      try {
        const baseName = getBaseProductName(filament.product_title || '');
        const isPrusament = (filament.vendor || '').toLowerCase().includes('prusa');
        const isElegoo = (filament.vendor || '').toLowerCase() === 'elegoo';
        
        let productLineKey: string | null = null;
        if (isPrusament) {
          const lineInfo = extractPrusamentProductLine(filament.product_title);
          productLineKey = lineInfo?.productLine || null;
        }
        
        const hasProductLineId = !!(filament as any).product_line_id;
        let variants: Filament[] = [];
        
        if (hasProductLineId) {
          const { data, error } = await supabase
            .from("filaments")
            .select("*")
            .eq("product_line_id", (filament as any).product_line_id)
            .order("product_title");
          
          if (error) throw error;
          variants = data || [];
        } else {
          const { data, error } = await supabase
            .from("filaments")
            .select("*")
            .eq("vendor", filament.vendor)
            .order("product_title");

          if (error) throw error;

          variants = (data || []).filter(f => {
            if (isPrusament && productLineKey) {
              const fLineInfo = extractPrusamentProductLine(f.product_title);
              return fLineInfo?.productLine === productLineKey;
            } else {
              const fBaseName = getBaseProductName(f.product_title || '');
              if (fBaseName.toLowerCase() !== baseName.toLowerCase()) return false;
              if (f.id === filament.id) return true;
              const color = getColorFromTitle(f.product_title, baseName);
              return color !== null || (f.color_hex && f.color_hex.length > 0);
            }
          });
        }

        // Calculate available weights
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

        const deduplicatedVariants = deduplicateColorVariants(variants, baseName);
        
        const anyVariantAvailableInRegion = hasProductLineId && deduplicatedVariants.some(v => 
          isFilamentAvailableInRegion(v as FilamentWithRegion, currentRegion)
        );
        
        const regionFilteredVariants = anyVariantAvailableInRegion 
          ? deduplicatedVariants 
          : deduplicatedVariants.filter(v => 
              isFilamentAvailableInRegion(v as FilamentWithRegion, currentRegion)
            );

        regionFilteredVariants.sort((a, b) => {
          if (a.id === filament.id) return -1;
          if (b.id === filament.id) return 1;
          const colorA = getColorFromTitle(a.product_title, baseName) || '';
          const colorB = getColorFromTitle(b.product_title, baseName) || '';
          return colorA.localeCompare(colorB);
        });

        setColorVariants(regionFilteredVariants);
        setProductLineAvailableInRegion(anyVariantAvailableInRegion);
        setSelectedWeight(null);
      } catch (error) {
        console.error("Error fetching color variants:", error);
        setColorVariants([]);
        setAvailableWeights([]);
      }
    };

    fetchColorVariants();
  }, [filament, currentRegion]);

  return {
    colorVariants,
    availableWeights,
    selectedWeight,
    setSelectedWeight,
    selectedVariant,
    handleColorVariantSelect,
    productLineAvailableInRegion,
    getColorFromTitle,
    getBaseProductName,
  };
}
