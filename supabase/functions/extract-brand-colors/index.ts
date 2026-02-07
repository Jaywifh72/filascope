/**
 * UNIFIED BRAND COLOR EXTRACTION FUNCTION
 * 
 * Extracts color information from product titles for multiple brands
 * Uses the shared color-mapping module for consistent hex values
 * 
 * Supports: Amolen, IIID Max, Creality, Numakers, Jayo, Kingroon, 
 *           Recycling Fabrik, SainSmart, TreeD, Flashforge, and more
 */
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { getColorHex, getColorFamily, extractColorFromTitle, COLOR_HEX_MAP } from "../_shared/color-mapping.ts";
import { sanitizeIlikeInput } from "../_shared/sanitize-input.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ExtractionResult {
  id: string;
  title: string;
  vendor: string;
  status: 'updated' | 'skipped' | 'no_color';
  colorName?: string | null;
  colorHex?: string | null;
  colorFamily?: string | null;
}

// Material-based color defaults (for products without explicit colors)
const MATERIAL_COLOR_DEFAULTS: Record<string, { colorName: string; colorHex: string }> = {
  'carbon fiber': { colorName: 'black', colorHex: '#1A1A1A' },
  'carbon': { colorName: 'black', colorHex: '#1A1A1A' },
  'cf': { colorName: 'black', colorHex: '#1A1A1A' },
  'conductive': { colorName: 'black', colorHex: '#1A1A1A' },
  'esd': { colorName: 'black', colorHex: '#1A1A1A' },
  'natural': { colorName: 'natural', colorHex: '#F5F5DC' },
  'nat': { colorName: 'natural', colorHex: '#F5F5DC' },
  'wood': { colorName: 'brown', colorHex: '#8B4513' },
  'wood fill': { colorName: 'brown', colorHex: '#8B4513' },
  'wood pla': { colorName: 'brown', colorHex: '#8B4513' },
  'glass fiber': { colorName: 'beige', colorHex: '#D4C4A8' },
  'gf': { colorName: 'beige', colorHex: '#D4C4A8' },
  'pp cf': { colorName: 'black', colorHex: '#1A1A1A' },
  'polypropylene carbon': { colorName: 'black', colorHex: '#1A1A1A' },
  'peek': { colorName: 'amber', colorHex: '#C19A6B' },
  'pei': { colorName: 'amber', colorHex: '#C19A6B' },
  'ultem': { colorName: 'amber', colorHex: '#C19A6B' },
  'asa cf': { colorName: 'black', colorHex: '#1A1A1A' },
  'petg cf': { colorName: 'black', colorHex: '#1A1A1A' },
  'pa cf': { colorName: 'black', colorHex: '#1A1A1A' },
  'nylon cf': { colorName: 'black', colorHex: '#1A1A1A' },
  'abs cf': { colorName: 'black', colorHex: '#1A1A1A' },
  'pla cf': { colorName: 'black', colorHex: '#1A1A1A' },
  'marble': { colorName: 'white', colorHex: '#E0E0E0' },
  'granite': { colorName: 'grey', colorHex: '#696969' },
  'stone': { colorName: 'grey', colorHex: '#808080' },
  'recycled': { colorName: 'grey', colorHex: '#808080' },
  'recycled pla': { colorName: 'grey', colorHex: '#808080' },
  'regrind': { colorName: 'grey', colorHex: '#808080' },
  'galaxy': { colorName: 'galaxy', colorHex: '#2F1B41' },
  'sparkly': { colorName: 'purple', colorHex: '#9370DB' },
  'glitter': { colorName: 'silver', colorHex: '#C0C0C0' },
  'metallic': { colorName: 'silver', colorHex: '#C0C0C0' },
  'burnt titanium': { colorName: 'bronze', colorHex: '#CD7F32' },
};

// Check if title contains material that implies a default color
function getMaterialDefaultColor(title: string): { colorName: string; colorHex: string } | null {
  const titleLower = title.toLowerCase();
  
  // Sort by length to match longer patterns first
  const sortedMaterials = Object.keys(MATERIAL_COLOR_DEFAULTS).sort((a, b) => b.length - a.length);
  
  for (const material of sortedMaterials) {
    // Match as whole word or with delimiters
    const regex = new RegExp(`\\b${material}\\b`, 'i');
    if (regex.test(titleLower)) {
      return MATERIAL_COLOR_DEFAULTS[material];
    }
  }
  return null;
}

// Brand-specific color extraction strategies
const BRAND_STRATEGIES: Record<string, (title: string, variantTitle?: string) => { colorName: string | null; colorHex: string | null }> = {
  
  // Push Plastic - Colors often in variant, not title
  'push plastic': (title: string, variantTitle?: string) => {
    // First try variant title (most reliable for Push Plastic)
    if (variantTitle) {
      const variantColor = variantTitle.toLowerCase().trim();
      const hex = getColorHex(variantColor);
      if (hex) return { colorName: variantColor, colorHex: `#${hex}` };
      
      // Try extracting color from variant
      const variantExtracted = extractColorFromTitle(variantTitle);
      if (variantExtracted.colorName && variantExtracted.colorHex) {
        return { colorName: variantExtracted.colorName, colorHex: `#${variantExtracted.colorHex}` };
      }
    }
    
    // Try material defaults
    const materialDefault = getMaterialDefaultColor(title);
    if (materialDefault) return materialDefault;
    
    return extractColorFromTitle(title);
  },
  
  // Anycubic - Generic titles, colors in variants
  'anycubic': (title: string, variantTitle?: string) => {
    // First try variant
    if (variantTitle) {
      const variantColor = variantTitle.toLowerCase().trim();
      const hex = getColorHex(variantColor);
      if (hex) return { colorName: variantColor, colorHex: `#${hex}` };
      
      const variantExtracted = extractColorFromTitle(variantTitle);
      if (variantExtracted.colorName && variantExtracted.colorHex) {
        return { colorName: variantExtracted.colorName, colorHex: `#${variantExtracted.colorHex}` };
      }
    }
    
    // Try Chinese colors in title
    const titleResult = extractColorFromTitle(title);
    if (titleResult.colorName && titleResult.colorHex) {
      return { colorName: titleResult.colorName, colorHex: `#${titleResult.colorHex}` };
    }
    
    // Material defaults
    const materialDefault = getMaterialDefaultColor(title);
    if (materialDefault) return materialDefault;
    
    return { colorName: null, colorHex: null };
  },
  
  // Recreus/Filaflex - Spanish brand with TPU materials
  'recreus': (title: string, variantTitle?: string) => {
    // Check variant first
    if (variantTitle) {
      const variantColor = variantTitle.toLowerCase().trim();
      const hex = getColorHex(variantColor);
      if (hex) return { colorName: variantColor, colorHex: `#${hex}` };
    }
    
    const titleLower = title.toLowerCase();
    
    // Check for Filaflex + color patterns
    const filaflex82aColors: Record<string, string> = {
      'black': '#1A1A1A', 'negro': '#1A1A1A',
      'white': '#FFFFFF', 'blanco': '#FFFFFF',
      'red': '#DC2626', 'rojo': '#DC2626',
      'blue': '#2563EB', 'azul': '#2563EB',
      'green': '#16A34A', 'verde': '#16A34A',
      'yellow': '#EAB308', 'amarillo': '#EAB308',
      'orange': '#EA580C', 'naranja': '#EA580C',
      'pink': '#EC4899', 'rosa': '#EC4899',
      'grey': '#808080', 'gris': '#808080', 'gray': '#808080',
      'skin': '#FFCBA4', 'piel': '#FFCBA4',
      'natural': '#F5F5DC',
      'transparent': '#FFFFFF', 'transparente': '#FFFFFF',
    };
    
    for (const [color, hex] of Object.entries(filaflex82aColors)) {
      if (titleLower.includes(color)) {
        return { colorName: color, colorHex: hex };
      }
    }
    
    // Spanish/Filaflex specific patterns
    const patterns = [
      /filaflex\s+[\d.]+[a-z]?\s+([a-z]+(?:\s+[a-z]+)?)/i,
      /([a-z]+(?:\s+[a-z]+)?)\s+filaflex/i,
      /recreus\s+([a-z]+)/i,
      /\s-\s([a-z]+(?:\s+[a-z]+)?)\s*$/i,  // "Product - Color" pattern
    ];
    
    for (const pattern of patterns) {
      const match = title.match(pattern);
      if (match?.[1]) {
        const colorName = match[1].toLowerCase().trim();
        // Skip material names
        if (!['82a', '60a', '70a', '95a', 'tpu', 'tpe', 'filament', 'kg', '1kg', '500g', '750g'].includes(colorName)) {
          const hex = getColorHex(colorName);
          if (hex) return { colorName, colorHex: `#${hex}` };
        }
      }
    }
    
    // Check specialty Filaflex colors
    const specialtyColors = ['purifier', 'foamy', 'balena', 'conductive', 'fluor', 'fluorescent'];
    for (const color of specialtyColors) {
      if (titleLower.includes(color)) {
        const hex = getColorHex(color);
        if (hex) return { colorName: color, colorHex: `#${hex}` };
      }
    }
    
    // Shore hardness defaults (82A, 60A are typically natural/white)
    if (/\b(82a|60a|70a|95a)\b/i.test(titleLower) && !Object.keys(filaflex82aColors).some(c => titleLower.includes(c))) {
      return { colorName: 'natural', colorHex: '#F5F5DC' };
    }
    
    // Material default for Filaflex
    const materialDefault = getMaterialDefaultColor(title);
    if (materialDefault) return materialDefault;
    
    return extractColorFromTitle(title);
  },
  
  // TreeD Filaments - Italian engineering materials
  'treed': (title: string, variantTitle?: string) => {
    // Check variant first
    if (variantTitle) {
      const variantColor = variantTitle.toLowerCase().trim();
      const hex = getColorHex(variantColor);
      if (hex) return { colorName: variantColor, colorHex: `#${hex}` };
    }
    
    // Try Italian colors in title
    const titleResult = extractColorFromTitle(title);
    if (titleResult.colorName && titleResult.colorHex) {
      return { colorName: titleResult.colorName, colorHex: `#${titleResult.colorHex}` };
    }
    
    // Engineering materials default
    const materialDefault = getMaterialDefaultColor(title);
    if (materialDefault) return materialDefault;
    
    // Default engineering colors for TreeD
    const titleLower = title.toLowerCase();
    if (titleLower.includes('tech') || titleLower.includes('engineering') || titleLower.includes('pro')) {
      return { colorName: 'natural', colorHex: '#F5F5DC' };
    }
    
    return { colorName: null, colorHex: null };
  },
  
  // Printed Solid - Jessie line and Prusament colors
  'printed solid': (title: string, variantTitle?: string) => {
    // Check variant first
    if (variantTitle) {
      const variantColor = variantTitle.toLowerCase().trim();
      const hex = getColorHex(variantColor);
      if (hex) return { colorName: variantColor, colorHex: `#${hex}` };
    }
    
    const titleLower = title.toLowerCase();
    
    // Prusament patterns: "Prusament [Material] [Color] [Size]"
    const prusamentPatterns = [
      /prusament\s+(?:pla|petg|asa|pc|abs)\s+([a-z]+(?:\s+[a-z]+)?(?:\s+[a-z]+)?)/i,
      /prusament\s+([a-z]+(?:\s+[a-z]+)?)\s+(?:\d+g|\d+kg)/i,
    ];
    
    for (const pattern of prusamentPatterns) {
      const match = title.match(pattern);
      if (match?.[1]) {
        const colorName = match[1].toLowerCase().trim();
        // Skip material/size words
        if (!['pla', 'petg', 'asa', 'pc', 'abs', 'blend', 'filament', 'refill', 'kg', 'g', 'mm', '1kg', '2kg'].includes(colorName)) {
          const hex = getColorHex(colorName);
          if (hex) return { colorName, colorHex: `#${hex}` };
        }
      }
    }
    
    // Try Prusament specialty colors (check in order of specificity)
    const prusamentColors = [
      'azure blue', 'pristine white', 'galaxy black', 'urban grey', 'jet black',
      'anthracite grey', 'vanilla white', 'army green', 'recycled black', 'recycled grey',
      'recycled orange', 'lipstick red', 'royal purple', 'gentleman grey', 'mystic green',
      'rusty orange', 'oh my gold', 'carmine red', 'signal white', 'prusa orange',
      'prusa galaxy silver', 'viva la bronze', 'bloody dragon red', 'aubergine purple',
      'mystic brown', 'royal blue', 'terracotta', 'pineapple yellow', 'lime green', 'opal green'
    ];
    
    for (const color of prusamentColors) {
      if (titleLower.includes(color)) {
        const hex = getColorHex(color);
        if (hex) return { colorName: color, colorHex: `#${hex}` };
      }
    }
    
    // Jessie pattern: "X [ColorName] 1kg" or "[ColorName] X 1kg"
    const jessiePatterns = [
      /\s+[xX]\s+([a-z]+(?:\s+[a-z]+)?)\s+\d+/i,
      /jessie[^a-z]*([a-z]+(?:\s+[a-z]+)?)/i,
      /([a-z]+(?:\s+[a-z]+)?)\s+[xX]\s+\d+/i,
    ];
    
    for (const pattern of jessiePatterns) {
      const match = title.match(pattern);
      if (match?.[1]) {
        const colorName = match[1].toLowerCase().trim();
        // Skip non-color words
        if (!['premium', 'elixir', 'filament', 'pla', 'petg', 'kg', 'mm'].includes(colorName)) {
          const hex = getColorHex(colorName);
          if (hex) return { colorName, colorHex: `#${hex}` };
        }
      }
    }
    
    // Try Jessie specialty colors
    const jessieColors = ['abyss', 'aquamarine', 'electric lemonade', 'gold rush', 'misty green', 
                          'nightshade', 'royal ruby', 'elixir', 'fire opal', 'obsidian', 'onyx',
                          'sapphire', 'amethyst', 'topaz', 'garnet', 'opal'];
    for (const color of jessieColors) {
      if (titleLower.includes(color)) {
        const hex = getColorHex(color);
        if (hex) return { colorName: color, colorHex: `#${hex}` };
      }
    }
    
    return extractColorFromTitle(title);
  },
  
  // GST3D - Spanish patterns
  'gst3d': (title: string, variantTitle?: string) => {
    if (variantTitle) {
      const variantColor = variantTitle.toLowerCase().trim();
      const hex = getColorHex(variantColor);
      if (hex) return { colorName: variantColor, colorHex: `#${hex}` };
    }
    
    // Spanish color patterns
    const spanishResult = extractColorFromTitle(title);
    if (spanishResult.colorName && spanishResult.colorHex) {
      return { colorName: spanishResult.colorName, colorHex: `#${spanishResult.colorHex}` };
    }
    
    const materialDefault = getMaterialDefaultColor(title);
    if (materialDefault) return materialDefault;
    
    return { colorName: null, colorHex: null };
  },
  
  // Amolen - Often has multicolor and specialty names
  'amolen': (title: string, variantTitle?: string) => {
    // Check variant first
    if (variantTitle) {
      const variantColor = variantTitle.toLowerCase().trim();
      const hex = getColorHex(variantColor);
      if (hex) return { colorName: variantColor, colorHex: `#${hex}` };
    }
    
    const titleLower = title.toLowerCase();
    
    // Check for color change / temperature change patterns
    if (titleLower.includes('color change') || titleLower.includes('temperature')) {
      // Try to extract the base color (usually the first color in description)
      const colorMatch = titleLower.match(/to\s+([a-z]+)/i);
      if (colorMatch?.[1]) {
        const hex = getColorHex(colorMatch[1]);
        if (hex) return { colorName: colorMatch[1], colorHex: `#${hex}` };
      }
    }
    
    const patterns = [
      /(?:pla|petg|tpu|silk|matte)\s+([a-z]+(?:\s+[a-z]+)?)/i,
      /([a-z]+(?:\s+[a-z]+)?)\s+(?:pla|petg|tpu)/i,
      /(?:filament|3d)\s*-?\s*([a-z]+(?:\s+[a-z]+)?)/i,
      /\s-\s([a-z]+(?:\s+[a-z]+)?)\s*$/i,
    ];
    
    for (const pattern of patterns) {
      const match = title.match(pattern);
      if (match?.[1]) {
        const colorName = match[1].toLowerCase().trim();
        if (!['filament', 'pla', 'petg', 'tpu', 'kg', '1kg'].includes(colorName)) {
          const hex = getColorHex(colorName);
          if (hex) return { colorName, colorHex: `#${hex}` };
        }
      }
    }
    return extractColorFromTitle(title);
  },
  
  // IIID Max - PLA/PETG with color at end
  'iiid max': (title: string) => {
    const match = title.match(/[-–]\s*([a-z]+(?:\s+[a-z]+)?)\s*$/i);
    if (match?.[1]) {
      const colorName = match[1].toLowerCase().trim();
      const hex = getColorHex(colorName);
      if (hex) return { colorName, colorHex: `#${hex}` };
    }
    return extractColorFromTitle(title);
  },
  
  // Creality - Often has color in product title
  'creality': (title: string) => {
    const patterns = [
      /(?:ender|cr-|hyper)\s+(?:pla|petg|tpu)\s+([a-z]+(?:\s+[a-z]+)?)/i,
      /([a-z]+(?:\s+[a-z]+)?)\s+(?:pla|petg|tpu|filament)/i,
    ];
    
    for (const pattern of patterns) {
      const match = title.match(pattern);
      if (match?.[1]) {
        const colorName = match[1].toLowerCase().trim();
        if (!['filament', 'spool', 'kg', '3d', 'printer'].includes(colorName)) {
          const hex = getColorHex(colorName);
          if (hex) return { colorName, colorHex: `#${hex}` };
        }
      }
    }
    return extractColorFromTitle(title);
  },
  
  // Numakers - Simple color names
  'numakers': (title: string) => {
    const match = title.match(/(?:pla|petg|abs)\s+([a-z]+)/i) ||
                  title.match(/([a-z]+)\s+(?:pla|petg|abs)/i);
    if (match?.[1]) {
      const colorName = match[1].toLowerCase().trim();
      const hex = getColorHex(colorName);
      if (hex) return { colorName, colorHex: `#${hex}` };
    }
    return extractColorFromTitle(title);
  },
  
  // Jayo - Often multicolor or gradient names
  'jayo': (title: string, variantTitle?: string) => {
    // Check variant first
    if (variantTitle) {
      const variantColor = variantTitle.toLowerCase().trim();
      const hex = getColorHex(variantColor);
      if (hex) return { colorName: variantColor, colorHex: `#${hex}` };
    }
    
    const titleLower = title.toLowerCase();
    
    // Check for multi-color/gradient patterns
    if (titleLower.includes('rainbow') || titleLower.includes('gradient') || titleLower.includes('multicolor')) {
      return { colorName: 'rainbow', colorHex: '#FF0000' };
    }
    
    // Check for dual/tri-color patterns
    if (/\b(dual|tri|triple|quad|double)\s*(color|colour)?\b/i.test(titleLower)) {
      // Try to get the first color mentioned
      const colorMatch = titleLower.match(/\b(dual|tri|triple|quad|double)\s*(?:color|colour)?\s*([a-z]+)/i);
      if (colorMatch?.[2]) {
        const hex = getColorHex(colorMatch[2]);
        if (hex) return { colorName: colorMatch[2], colorHex: `#${hex}` };
      }
      return { colorName: 'multicolor', colorHex: '#FF0000' };
    }
    
    const patterns = [
      /(?:silk|matte|metal|rainbow)\s+([a-z]+(?:\s+[a-z]+)?)/i,
      /([a-z]+(?:\s+[a-z]+)?)\s+(?:silk|matte)/i,
      /(?:pla|petg)\s+([a-z]+(?:\s+[a-z]+)?)/i,
      /\s-\s([a-z]+(?:\s+[a-z]+)?)\s*$/i,
    ];
    
    for (const pattern of patterns) {
      const match = title.match(pattern);
      if (match?.[1]) {
        const colorName = match[1].toLowerCase().trim();
        if (!['pla', 'petg', 'tpu', 'filament', 'kg', '1kg', '2kg', 'pack'].includes(colorName)) {
          const hex = getColorHex(colorName);
          if (hex) return { colorName, colorHex: `#${hex}` };
        }
      }
    }
    return extractColorFromTitle(title);
  },
  
  // Kingroon - Chinese brand with English colors
  'kingroon': (title: string) => {
    const patterns = [
      /(?:pla|petg|tpu|abs)\s+([a-z]+(?:\s+[a-z]+)?)/i,
      /([a-z]+(?:\s+[a-z]+)?)\s+(?:pla|petg|tpu|abs)/i,
    ];
    
    for (const pattern of patterns) {
      const match = title.match(pattern);
      if (match?.[1]) {
        const colorName = match[1].toLowerCase().trim();
        const hex = getColorHex(colorName);
        if (hex) return { colorName, colorHex: `#${hex}` };
      }
    }
    return extractColorFromTitle(title);
  },
  
  // Recycling Fabrik - Recycled materials with color names
  'recycling fabrik': (title: string) => {
    const germanColors: Record<string, string> = {
      'schwarz': 'black', 'weiss': 'white', 'weiß': 'white',
      'rot': 'red', 'blau': 'blue', 'grün': 'green', 'gelb': 'yellow',
      'grau': 'grey', 'braun': 'brown', 'orange': 'orange',
    };
    
    const titleLower = title.toLowerCase();
    for (const [german, english] of Object.entries(germanColors)) {
      if (titleLower.includes(german)) {
        const hex = getColorHex(english);
        return { colorName: english, colorHex: hex ? `#${hex}` : null };
      }
    }
    return extractColorFromTitle(title);
  },
  
  // SainSmart - TPU and specialty filaments
  'sainsmart': (title: string) => {
    const patterns = [
      /(?:tpu|flex|pla|petg)\s+([a-z]+(?:\s+[a-z]+)?)/i,
      /([a-z]+(?:\s+[a-z]+)?)\s+(?:tpu|flex|pla|petg)/i,
    ];
    
    for (const pattern of patterns) {
      const match = title.match(pattern);
      if (match?.[1]) {
        const colorName = match[1].toLowerCase().trim();
        if (!['filament', 'flexible', 'shore'].includes(colorName)) {
          const hex = getColorHex(colorName);
          if (hex) return { colorName, colorHex: `#${hex}` };
        }
      }
    }
    return extractColorFromTitle(title);
  },
  
  // Flashforge - Professional filaments
  'flashforge': (title: string) => {
    const match = title.match(/(?:dreamer|adventurer|creator)\s+(?:pla|petg|abs)\s+([a-z]+)/i) ||
                  title.match(/([a-z]+)\s+(?:pla|petg|abs)/i);
    if (match?.[1]) {
      const colorName = match[1].toLowerCase().trim();
      const hex = getColorHex(colorName);
      if (hex) return { colorName, colorHex: `#${hex}` };
    }
    return extractColorFromTitle(title);
  },
  
  // Duramic 3D
  'duramic 3d': (title: string) => {
    const patterns = [
      /duramic\s+(?:3d\s+)?(?:pla|petg|abs)\s+([a-z]+)/i,
      /([a-z]+)\s+(?:pla|petg|abs)/i,
    ];
    
    for (const pattern of patterns) {
      const match = title.match(pattern);
      if (match?.[1]) {
        const colorName = match[1].toLowerCase().trim();
        const hex = getColorHex(colorName);
        if (hex) return { colorName, colorHex: `#${hex}` };
      }
    }
    return extractColorFromTitle(title);
  },
  
  // Sovol
  'sovol': (title: string) => {
    const patterns = [
      /sovol\s+(?:pla|petg|abs)\s+([a-z]+)/i,
      /([a-z]+)\s+(?:pla|petg|abs)/i,
    ];
    
    for (const pattern of patterns) {
      const match = title.match(pattern);
      if (match?.[1]) {
        const colorName = match[1].toLowerCase().trim();
        const hex = getColorHex(colorName);
        if (hex) return { colorName, colorHex: `#${hex}` };
      }
    }
    return extractColorFromTitle(title);
  },
};

/**
 * Extract color using brand-specific strategy with fallback
 * Now supports variant title extraction for brands that store colors in variants
 */
function extractBrandColor(
  title: string, 
  vendor: string, 
  variantTitle?: string | null
): { colorName: string | null; colorHex: string | null; colorFamily: string | null } {
  const vendorLower = vendor.toLowerCase();
  
  // Try brand-specific strategy (with variant support)
  for (const [brandKey, strategy] of Object.entries(BRAND_STRATEGIES)) {
    if (vendorLower.includes(brandKey)) {
      const result = strategy(title, variantTitle || undefined);
      if (result.colorName && result.colorHex) {
        return {
          ...result,
          colorFamily: getColorFamily(result.colorName),
        };
      }
    }
  }
  
  // Try variant title extraction if available
  if (variantTitle) {
    const variantLower = variantTitle.toLowerCase().trim();
    const variantHex = getColorHex(variantLower);
    if (variantHex) {
      return {
        colorName: variantLower,
        colorHex: `#${variantHex}`,
        colorFamily: getColorFamily(variantLower),
      };
    }
    
    const variantExtracted = extractColorFromTitle(variantTitle);
    if (variantExtracted.colorName && variantExtracted.colorHex) {
      return {
        colorName: variantExtracted.colorName,
        colorHex: `#${variantExtracted.colorHex}`,
        colorFamily: variantExtracted.colorFamily,
      };
    }
  }
  
  // Check material defaults
  const materialDefault = getMaterialDefaultColor(title);
  if (materialDefault) {
    return {
      ...materialDefault,
      colorFamily: getColorFamily(materialDefault.colorName),
    };
  }
  
  // Fallback to generic extraction
  const generic = extractColorFromTitle(title);
  if (generic.colorName) {
    return {
      colorName: generic.colorName,
      colorHex: generic.colorHex ? `#${generic.colorHex}` : null,
      colorFamily: generic.colorFamily,
    };
  }
  
  // Last resort: search for any known color in title
  const titleLower = title.toLowerCase();
  const sortedColors = Object.keys(COLOR_HEX_MAP).sort((a, b) => b.length - a.length);
  for (const color of sortedColors) {
    if (titleLower.includes(color)) {
      return {
        colorName: color,
        colorHex: `#${COLOR_HEX_MAP[color]}`,
        colorFamily: getColorFamily(color),
      };
    }
  }
  
  return { colorName: null, colorHex: null, colorFamily: null };
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const startTime = Date.now();
  console.log('[BRAND-COLORS] ═══════════════════════════════════════════════════════');
  console.log('[BRAND-COLORS] 🎨 UNIFIED COLOR EXTRACTION STARTED');
  console.log(`[BRAND-COLORS] 📅 ${new Date().toISOString()}`);
  console.log('[BRAND-COLORS] ═══════════════════════════════════════════════════════');

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Verify admin
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Authorization required' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const authClient = createClient(supabaseUrl, Deno.env.get('SUPABASE_ANON_KEY')!, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: { user } } = await authClient.auth.getUser();
    if (!user) {
      return new Response(JSON.stringify({ error: 'Invalid auth' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { data: isAdmin } = await supabase.rpc('has_role', { _user_id: user.id, _role: 'admin' });
    if (!isAdmin) {
      return new Response(JSON.stringify({ error: 'Admin required' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Parse options
    let limit = 500;
    let forceUpdate = false;
    let targetVendor: string | null = null;
    try {
      const body = await req.json();
      limit = body.limit ?? 500;
      forceUpdate = body.forceUpdate ?? false;
      targetVendor = body.vendor ?? null;
    } catch { /* defaults */ }

    console.log(`[BRAND-COLORS] ⚙️ Options: limit=${limit}, forceUpdate=${forceUpdate}, vendor=${targetVendor || 'all low-coverage'}`);

    // Target vendors with low color coverage (< 50%) - now includes Phase 2 brands
    const lowCoverageBrands = [
      'Amolen', 'IIID Max', 'Creality', 'Numakers', 'Jayo', 
      'Kingroon', 'Recycling Fabrik', 'SainSmart', 'Flashforge',
      '3D-Fuel', 'Duramic 3D', 'Sovol', 'GEEETECH', 'Eryone',
      // Phase 2 additions - brands with 0% or low color coverage
      'Push Plastic', 'Anycubic', 'Recreus', 'GST3D', 'TreeD Filaments', 'Printed Solid',
    ];

    // Build query - now includes variant_sku to extract variant color info
    let query = supabase
      .from('filaments')
      .select('id, product_title, vendor, color_hex, color_family, variant_sku');
    
    if (targetVendor) {
      const safeVendor = sanitizeIlikeInput(targetVendor);
      query = query.ilike('vendor', `%${safeVendor}%`);
    } else {
      // Build OR condition for all low-coverage brands (hardcoded list, safe)
      const orConditions = lowCoverageBrands.map(b => `vendor.ilike.%${sanitizeIlikeInput(b)}%`).join(',');
      query = query.or(orConditions);
    }
    
    if (!forceUpdate) {
      query = query.is('color_hex', null);
    }

    const { data: filaments, error: fetchError } = await query.limit(limit);

    if (fetchError) throw new Error(`Fetch error: ${fetchError.message}`);

    console.log(`[BRAND-COLORS] 📊 Found ${filaments?.length || 0} filaments to process`);

    const results: ExtractionResult[] = [];
    let updated = 0, skipped = 0, noColor = 0;

    for (const filament of filaments || []) {
      // Extract variant title from variant_sku if available (some brands store color info there)
      const variantTitle = filament.variant_sku || null;
      const { colorName, colorHex, colorFamily } = extractBrandColor(filament.product_title, filament.vendor, variantTitle);
      
      if (!colorName && !colorHex) {
        results.push({
          id: filament.id,
          title: filament.product_title,
          vendor: filament.vendor,
          status: 'no_color',
        });
        noColor++;
        continue;
      }
      
      // Skip if already has color and not forcing update
      if (filament.color_hex && !forceUpdate) {
        results.push({
          id: filament.id,
          title: filament.product_title,
          vendor: filament.vendor,
          status: 'skipped',
          colorName,
          colorHex,
          colorFamily,
        });
        skipped++;
        continue;
      }
      
      // Update the filament
      const updateData: Record<string, unknown> = {};
      if (colorHex) updateData.color_hex = colorHex;
      if (colorFamily) updateData.color_family = colorFamily;
      
      if (Object.keys(updateData).length > 0) {
        const { error: updateError } = await supabase
          .from('filaments')
          .update(updateData)
          .eq('id', filament.id);

        if (updateError) {
          console.error(`[BRAND-COLORS] Update error for ${filament.id}:`, updateError);
          results.push({
            id: filament.id,
            title: filament.product_title,
            vendor: filament.vendor,
            status: 'skipped',
          });
          skipped++;
        } else {
          results.push({
            id: filament.id,
            title: filament.product_title,
            vendor: filament.vendor,
            status: 'updated',
            colorName,
            colorHex,
            colorFamily,
          });
          updated++;
          console.log(`[BRAND-COLORS] ✅ ${filament.vendor}: ${filament.product_title} → ${colorName} (${colorHex})`);
        }
      } else {
        results.push({
          id: filament.id,
          title: filament.product_title,
          vendor: filament.vendor,
          status: 'no_color',
        });
        noColor++;
      }
    }

    const duration = Math.round((Date.now() - startTime) / 1000);
    
    // Group by vendor for summary
    const vendorSummary = results.reduce((acc, r) => {
      if (!acc[r.vendor]) acc[r.vendor] = { updated: 0, skipped: 0, noColor: 0 };
      if (r.status === 'updated') acc[r.vendor].updated++;
      else if (r.status === 'skipped') acc[r.vendor].skipped++;
      else acc[r.vendor].noColor++;
      return acc;
    }, {} as Record<string, { updated: number; skipped: number; noColor: number }>);

    console.log('[BRAND-COLORS] ═══════════════════════════════════════════════════════');
    console.log(`[BRAND-COLORS] ✅ COMPLETE: ${updated} updated, ${skipped} skipped, ${noColor} no color in ${duration}s`);
    console.log('[BRAND-COLORS] 📊 By vendor:', JSON.stringify(vendorSummary, null, 2));

    return new Response(JSON.stringify({
      success: true,
      summary: { updated, skipped, noColor, total: filaments?.length || 0, duration },
      vendorSummary,
      results,
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('[BRAND-COLORS] Fatal error:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});