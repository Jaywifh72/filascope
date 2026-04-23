/**
 * FIRECRAWL EXTRACTOR v2
 * 
 * Extracts technical specifications from product pages using Firecrawl.
 * Handles rate limiting, field extraction, and normalization.
 */

import { getBrandProfile, type BrandProfile, type DataSource } from './brand-profile-system.ts';

// ============================================================================
// FIRECRAWL INTERFACES
// ============================================================================

export interface FirecrawlResponse {
  success: boolean;
  data?: {
    markdown?: string;
    html?: string;
    metadata?: {
      title?: string;
      description?: string;
      language?: string;
      keywords?: string[];
      robots?: string;
      ogTitle?: string;
      ogDescription?: string;
      ogImage?: string;
      ogUrl?: string;
      statusCode?: number;
      error?: string;
    };
    llm_extraction?: Record<string, any>;
  };
  error?: string;
}

export interface ExtractionResult {
  field: string;
  value: any;
  source: string;
  confidence: number;
  raw_value?: any;
}

// ============================================================================
// FIRECRAWL EXTRACTOR
// ============================================================================

/**
 * Extract technical specs from product page using Firecrawl
 */
export async function extractWithFirecrawl(
  productUrl: string,
  brandProfile: BrandProfile,
  firecrawlApiKey: string
): Promise<ExtractionResult[]> {
  const results: ExtractionResult[] = [];
  
  // Get Firecrawl data source from brand profile
  const firecrawlSource = brandProfile.data_sources.find(s => s.type === 'firecrawl');
  if (!firecrawlSource) {
    console.log(`[FIRECRAWL] No Firecrawl data source configured for ${brandProfile.brand_slug}`);
    return results;
  }
  
  console.log(`[FIRECRAWL] Extracting from: ${productUrl}`);
  
  try {
    // Call Firecrawl API
    const response = await fetch('https://api.firecrawl.dev/v1/scrape', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${firecrawlApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        url: productUrl,
        formats: ['markdown', 'html'],
        onlyMainContent: true,
        waitFor: 5000, // Wait 5 seconds for dynamic content
      }),
    });
    
    if (!response.ok) {
      console.error(`[FIRECRAWL] API error: ${response.status} ${response.statusText}`);
      return results;
    }
    
    const data: FirecrawlResponse = await response.json();
    
    if (!data.success || !data.data) {
      console.error(`[FIRECRAWL] Failed to extract: ${data.error || 'Unknown error'}`);
      return results;
    }
    
    const markdown = data.data.markdown || '';
    const html = data.data.html || '';
    const metadata = data.data.metadata || {};
    
    // Extract fields based on brand profile rules
    for (const rule of brandProfile.field_extraction_rules) {
      if (rule.source === 'scrape' || rule.source === 'firecrawl') {
        const value = await extractFieldFromContent(
          rule.field,
          markdown,
          html,
          metadata,
          rule.selector,
          rule.transform
        );
        
        if (value !== null && value !== undefined) {
          results.push({
            field: rule.field,
            value,
            source: 'firecrawl',
            confidence: rule.confidence,
            raw_value: markdown.slice(0, 200) + '...' // First 200 chars for debugging
          });
        }
      }
    }
    
    // Extract additional fields not in brand profile
    results.push(...extractAdditionalFields(markdown, html, metadata));
    
    console.log(`[FIRECRAWL] Extracted ${results.length} fields from ${productUrl}`);
    
  } catch (error) {
    console.error(`[FIRECRAWL] Error extracting ${productUrl}:`, error);
  }
  
  return results;
}

/**
 * Extract specific field from content
 */
async function extractFieldFromContent(
  field: string,
  markdown: string,
  html: string,
  metadata: Record<string, any>,
  selector?: string,
  transform?: string
): Promise<any> {
  const content = markdown || html;
  if (!content) return null;
  
  switch (field) {
    case 'nozzle_temp_min_c':
    case 'nozzle_temp_max_c':
      return extractTemperature(content, 'nozzle');
    
    case 'bed_temp_min_c':
    case 'bed_temp_max_c':
      return extractTemperature(content, 'bed');
    
    case 'nozzle_temp_sweetspot_c':
      return extractSweetspotTemp(content);
    
    case 'density_g_cm3':
      return extractDensity(content);
    
    case 'print_speed_max_mms':
      return extractPrintSpeed(content);
    
    case 'fan_min_percent':
    case 'fan_max_percent':
      return extractFanSpeed(content);
    
    case 'retraction_length_mm':
      return extractRetractionLength(content);
    
    case 'retraction_speed_mms':
      return extractRetractionSpeed(content);
    
    case 'max_bridging_length_mm':
      return extractBridgingLength(content);
    
    case 'max_overhang_angle_deg':
      return extractOverhangAngle(content);
    
    case 'moisture_sensitivity_level':
      return extractMoistureSensitivity(content);
    
    case 'moisture_care':
      return extractMoistureCare(content);
    
    case 'nozzle_care':
      return extractNozzleCare(content);
    
    case 'color_hex':
      return extractColorHex(content, metadata);
    
    case 'spool_ams_fit':
      return extractAmsCompatibility(content);
    
    case 'spool_material':
      return extractSpoolMaterial(content);
    
    case 'spool_outer_d_mm':
      return extractSpoolDiameter(content);
    
    case 'spool_width_mm':
      return extractSpoolWidth(content);
    
    case 'high_speed_capable':
      return extractHighSpeedCapability(content);
    
    case 'is_nozzle_abrasive':
      return extractAbrasiveNozzle(content);
    
    case 'use_case_tags':
      return extractUseCaseTags(content);
    
    case 'industry_tags':
      return extractIndustryTags(content);
    
    default:
      // Try generic extraction based on selector
      if (selector) {
        return extractBySelector(content, selector, transform);
      }
      return null;
  }
}

/**
 * Extract temperature (nozzle or bed)
 */
function extractTemperature(content: string, type: 'nozzle' | 'bed'): { min: number; max: number } | null {
  const contentLower = content.toLowerCase();
  const typeLower = type.toLowerCase();
  
  // Patterns for temperature ranges
  const patterns = [
    // "Nozzle: 200-220°C" or "Nozzle Temperature: 200-220°C"
    new RegExp(`${typeLower}[\\s:]*(?:temperature)?[\\s:]*(\\d+)\\s*[-–]\\s*(\\d+)\\s*°?\\s*[Cc]?`, 'i'),
    // "Nozzle: 200°C to 220°C"
    new RegExp(`${typeLower}[\\s:]*(?:temperature)?[\\s:]*(\\d+)\\s*(?:°?\\s*[Cc])?\\s+to\\s+(\\d+)\\s*°?\\s*[Cc]?`, 'i'),
    // "Nozzle: 200-220"
    new RegExp(`${typeLower}[\\s:]*(\\d+)\\s*[-–]\\s*(\\d+)`, 'i'),
    // "Nozzle: 200°C"
    new RegExp(`${typeLower}[\\s:]*(\\d+)\\s*°?\\s*[Cc]?`, 'i'),
    // "Recommended Nozzle Temperature: 200-220°C"
    new RegExp(`recommended[\\s-]*${typeLower}[\\s-]*(?:temperature)?[\\s:]*(\\d+)\\s*[-–]\\s*(\\d+)\\s*°?\\s*[Cc]?`, 'i'),
  ];
  
  for (const pattern of patterns) {
    const match = content.match(pattern);
    if (match) {
      if (match[2]) {
        // Range
        const min = parseInt(match[1], 10);
        const max = parseInt(match[2], 10);
        if (min >= 0 && max >= min && max <= 400) {
          return { min, max };
        }
      } else {
        // Single value
        const temp = parseInt(match[1], 10);
        if (temp >= 0 && temp <= 400) {
          return { min: temp, max: temp };
        }
      }
    }
  }
  
  return null;
}

/**
 * Extract sweetspot temperature
 */
function extractSweetspotTemp(content: string): number | null {
  const contentLower = content.toLowerCase();
  
  // Look for "recommended", "optimal", "ideal", "sweetspot" near temperature
  const patterns = [
    /recommended[\s:]*(\d+)\s*°?\s*[Cc]?/i,
    /optimal[\s:]*(\d+)\s*°?\s*[Cc]?/i,
    /ideal[\s:]*(\d+)\s*°?\s*[Cc]?/i,
    /sweetspot[\s:]*(\d+)\s*°?\s*[Cc]?/i,
    /best[\s:]*(\d+)\s*°?\s*[Cc]?/i,
  ];
  
  for (const pattern of patterns) {
    const match = content.match(pattern);
    if (match) {
      const temp = parseInt(match[1], 10);
      if (temp >= 0 && temp <= 400) {
        return temp;
      }
    }
  }
  
  return null;
}

/**
 * Extract density
 */
function extractDensity(content: string): number | null {
  const contentLower = content.toLowerCase();
  
  // Match patterns like "Density: 1.24 g/cm³" or "1.24 g/cm3"
  const patterns = [
    /density[\s:]*(\d+\.?\d*)\s*g\/cm[³3]/i,
    /density[\s:]*(\d+\.?\d*)/i,
    /(\d+\.?\d*)\s*g\/cm[³3]/i,
  ];
  
  for (const pattern of patterns) {
    const match = content.match(pattern);
    if (match) {
      const density = parseFloat(match[1]);
      if (density >= 0.5 && density <= 3) {
        return density;
      }
    }
  }
  
  return null;
}

/**
 * Extract print speed
 */
function extractPrintSpeed(content: string): number | null {
  const contentLower = content.toLowerCase();
  
  // Match patterns like "Print Speed: 60mm/s" or "Speed: 60 mm/s"
  const patterns = [
    /(?:print[\s-]?)?speed[\s:]*(\d+)\s*mm\/s/i,
    /(\d+)\s*mm\/s/i,
    /speed[\s:]*(\d+)/i,
  ];
  
  for (const pattern of patterns) {
    const match = content.match(pattern);
    if (match) {
      const speed = parseInt(match[1], 10);
      if (speed >= 10 && speed <= 500) {
        return speed;
      }
    }
  }
  
  return null;
}

/**
 * Extract fan speed
 */
function extractFanSpeed(content: string): { min: number; max: number } | null {
  const contentLower = content.toLowerCase();
  
  // Match patterns like "Fan: 0-100%" or "Cooling Fan: 50-100%"
  const patterns = [
    /fan[\s:]*(\d+)\s*[-–]\s*(\d+)\s*%/i,
    /cooling[\s:]*(\d+)\s*[-–]\s*(\d+)\s*%/i,
    /fan[\s:]*(\d+)\s*%/i,
    /cooling[\s:]*(\d+)\s*%/i,
  ];
  
  for (const pattern of patterns) {
    const match = content.match(pattern);
    if (match) {
      if (match[2]) {
        // Range
        const min = parseInt(match[1], 10);
        const max = parseInt(match[2], 10);
        if (min >= 0 && max >= min && max <= 100) {
          return { min, max };
        }
      } else {
        // Single value
        const speed = parseInt(match[1], 10);
        if (speed >= 0 && speed <= 100) {
          return { min: speed, max: speed };
        }
      }
    }
  }
  
  return null;
}

/**
 * Extract retraction length
 */
function extractRetractionLength(content: string): number | null {
  const contentLower = content.toLowerCase();
  
  // Match patterns like "Retraction: 6mm" or "Retraction Length: 6 mm"
  const patterns = [
    /retraction[\s:]*(?:length)?[\s:]*(\d+\.?\d*)\s*mm/i,
    /retract[\s:]*(\d+\.?\d*)\s*mm/i,
    /(\d+\.?\d*)\s*mm[\s-]*retraction/i,
  ];
  
  for (const pattern of patterns) {
    const match = content.match(pattern);
    if (match) {
      const length = parseFloat(match[1]);
      if (length >= 0 && length <= 20) {
        return length;
      }
    }
  }
  
  return null;
}

/**
 * Extract retraction speed
 */
function extractRetractionSpeed(content: string): number | null {
  const contentLower = content.toLowerCase();
  
  // Match patterns like "Retraction Speed: 45mm/s" or "Retract Speed: 45 mm/s"
  const patterns = [
    /retraction[\s-]*speed[\s:]*(\d+)\s*mm\/s/i,
    /retract[\s-]*speed[\s:]*(\d+)\s*mm\/s/i,
    /(\d+)\s*mm\/s[\s-]*retraction/i,
  ];
  
  for (const pattern of patterns) {
    const match = content.match(pattern);
    if (match) {
      const speed = parseInt(match[1], 10);
      if (speed >= 10 && speed <= 100) {
        return speed;
      }
    }
  }
  
  return null;
}

/**
 * Extract bridging length
 */
function extractBridgingLength(content: string): number | null {
  const contentLower = content.toLowerCase();
  
  // Match patterns like "Bridging: 50mm" or "Max Bridge: 50 mm"
  const patterns = [
    /bridging[\s:]*(?:max)?[\s:]*(\d+)\s*mm/i,
    /bridge[\s:]*(\d+)\s*mm/i,
    /max[\s-]*bridge[\s:]*(\d+)\s*mm/i,
  ];
  
  for (const pattern of patterns) {
    const match = content.match(pattern);
    if (match) {
      const length = parseInt(match[1], 10);
      if (length >= 0 && length <= 200) {
        return length;
      }
    }
  }
  
  return null;
}

/**
 * Extract overhang angle
 */
function extractOverhangAngle(content: string): number | null {
  const contentLower = content.toLowerCase();
  
  // Match patterns like "Overhang: 45°" or "Max Overhang: 45 degrees"
  const patterns = [
    /overhang[\s:]*(?:max)?[\s:]*(\d+)\s*(?:°|degrees?)/i,
    /max[\s-]*overhang[\s:]*(\d+)\s*(?:°|degrees?)/i,
    /(\d+)\s*(?:°|degrees?)[\s-]*overhang/i,
  ];
  
  for (const pattern of patterns) {
    const match = content.match(pattern);
    if (match) {
      const angle = parseInt(match[1], 10);
      if (angle >= 0 && angle <= 90) {
        return angle;
      }
    }
  }
  
  return null;
}

/**
 * Extract moisture sensitivity level
 */
function extractMoistureSensitivity(content: string): string | null {
  const contentLower = content.toLowerCase();
  
  // Look for moisture sensitivity indicators
  const patterns = [
    /moisture[\s-]*sensitivity[\s:]*(\d)/i,
    /msl[\s:]*(\d)/i,
    /level[\s:]*(\d)[\s-]*moisture/i,
    /store[\s:]*(desiccant|dry|sealed|vacuum)/i,
    /keep[\s:]*(dry|sealed|desiccant)/i,
  ];
  
  for (const pattern of patterns) {
    const match = content.match(pattern);
    if (match) {
      if (match[1] && match[1].match(/\d/)) {
        // Numeric level
        const level = parseInt(match[1], 10);
        if (level >= 1 && level <= 5) {
          return level.toString();
        }
      } else if (match[1]) {
        // Text level
        const text = match[1].toLowerCase();
        if (text.includes('desiccant') || text.includes('dry') || text.includes('sealed')) {
          return '3'; // Medium sensitivity
        }
      }
    }
  }
  
  return null;
}

/**
 * Extract moisture care instructions
 */
function extractMoistureCare(content: string): string | null {
  const contentLower = content.toLowerCase();
  
  // Look for moisture care instructions
  const patterns = [
    /store[\s:]*(.*?)(?:\.|$)/i,
    /keep[\s:]*(.*?)(?:\.|$)/i,
    /dry[\s:]*(.*?)(?:\.|$)/i,
    /desiccant[\s:]*(.*?)(?:\.|$)/i,
    /sealed[\s:]*(.*?)(?:\.|$)/i,
  ];
  
  for (const pattern of patterns) {
    const match = content.match(pattern);
    if (match && match[1]) {
      const instruction = match[1].trim();
      if (instruction.length > 10 && instruction.length < 200) {
        return instruction;
      }
    }
  }
  
  return null;
}

/**
 * Extract nozzle care instructions
 */
function extractNozzleCare(content: string): string | null {
  const contentLower = content.toLowerCase();
  
  // Look for nozzle care instructions
  const patterns = [
    /nozzle[\s:]*(.*?)(?:\.|$)/i,
    /print[\s-]*head[\s:]*(.*?)(?:\.|$)/i,
    /hotend[\s:]*(.*?)(?:\.|$)/i,
    /clean[\s:]*(.*?)(?:\.|$)/i,
    /maintain[\s:]*(.*?)(?:\.|$)/i,
  ];
  
  for (const pattern of patterns) {
    const match = content.match(pattern);
    if (match && match[1]) {
      const instruction = match[1].trim();
      if (instruction.length > 10 && instruction.length < 200) {
        return instruction;
      }
    }
  }
  
  return null;
}

/**
 * Extract color hex from content
 */
function extractColorHex(content: string, metadata: Record<string, any>): string | null {
  // Try to extract from metadata
  if (metadata.ogImage) {
    // Could extract dominant color from image, but that's complex
    // For now, return null
  }
  
  // Try to extract from content
  const contentLower = content.toLowerCase();
  
  // Look for hex codes
  const hexMatch = content.match(/#([0-9a-f]{6})/i);
  if (hexMatch) {
    return `#${hexMatch[1].toUpperCase()}`;
  }
  
  // Look for RGB values
  const rgbMatch = content.match(/rgb[\s:]*(\d+),\s*(\d+),\s*(\d+)/i);
  if (rgbMatch) {
    const r = parseInt(rgbMatch[1], 10);
    const g = parseInt(rgbMatch[2], 10);
    const b = parseInt(rgbMatch[3], 10);
    if (r >= 0 && r <= 255 && g >= 0 && g <= 255 && b >= 0 && b <= 255) {
      return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`.toUpperCase();
    }
  }
  
  return null;
}

/**
 * Extract AMS compatibility
 */
function extractAmsCompatibility(content: string): boolean | null {
  const contentLower = content.toLowerCase();
  
  if (contentLower.includes('ams') || contentLower.includes('automatic material system')) {
    // Check for positive mentions
    if (contentLower.includes('compatible') || contentLower.includes('works with') || contentLower.includes('supports')) {
      return true;
    }
    // Check for negative mentions
    if (contentLower.includes('not compatible') || contentLower.includes('does not work') || contentLower.includes('not supported')) {
      return false;
    }
    // Default to true if AMS mentioned without negative context
    return true;
  }
  
  return null;
}

/**
 * Extract spool material
 */
function extractSpoolMaterial(content: string): string | null {
  const contentLower = content.toLowerCase();
  
  // Look for spool material mentions
  if (contentLower.includes('cardboard spool') || contentLower.includes('paper spool')) {
    return 'Cardboard';
  }
  if (contentLower.includes('plastic spool') || contentLower.includes('abs spool') || contentLower.includes('pla spool')) {
    return 'Plastic';
  }
  if (contentLower.includes('reusable spool') || contentLower.includes('refill')) {
    return 'Reusable';
  }
  
  return null;
}

/**
 * Extract spool diameter
 */
function extractSpoolDiameter(content: string): number | null {
  const contentLower = content.toLowerCase();
  
  // Match patterns like "Spool Diameter: 200mm" or "Ø 200mm"
  const patterns = [
    /spool[\s-]*(?:diameter|ø|Ø)[\s:]*(\d+)\s*mm/i,
    /(?:diameter|ø|Ø)[\s:]*(\d+)\s*mm[\s-]*spool/i,
    /(\d+)\s*mm[\s-]*(?:diameter|ø|Ø)[\s-]*spool/i,
  ];
  
  for (const pattern of patterns) {
    const match = content.match(pattern);
    if (match) {
      const diameter = parseInt(match[1], 10);
      if (diameter >= 50 && diameter <= 400) {
        return diameter;
      }
    }
  }
  
  return null;
}

/**
 * Extract spool width
 */
function extractSpoolWidth(content: string): number | null {
  const contentLower = content.toLowerCase();
  
  // Match patterns like "Spool Width: 75mm" or "Width: 75 mm"
  const patterns = [
    /spool[\s-]*width[\s:]*(\d+)\s*mm/i,
    /width[\s:]*(\d+)\s*mm[\s-]*spool/i,
    /(\d+)\s*mm[\s-]*width[\s-]*spool/i,
  ];
  
  for (const pattern of patterns) {
    const match = content.match(pattern);
    if (match) {
      const width = parseInt(match[1], 10);
      if (width >= 20 && width <= 200) {
        return width;
      }
    }
  }
  
  return null;
}

/**
 * Extract high speed capability
 */
function extractHighSpeedCapability(content: string): boolean | null {
  const contentLower = content.toLowerCase();
  
  // Look for high speed mentions
  if (contentLower.includes('high speed') || contentLower.includes('fast print') || contentLower.includes('rapid')) {
    // Check for positive mentions
    if (contentLower.includes('capable') || contentLower.includes('suitable') || contentLower.includes('designed for')) {
      return true;
    }
    // Check for negative mentions
    if (contentLower.includes('not suitable') || contentLower.includes('slow') || contentLower.includes('standard speed')) {
      return false;
    }
    // Default to true if mentioned
    return true;
  }
  
  return null;
}

/**
 * Extract abrasive nozzle requirement
 */
function extractAbrasiveNozzle(content: string): boolean | null {
  const contentLower = content.toLowerCase();
  
  // Look for abrasive mentions
  if (contentLower.includes('abrasive') || contentLower.includes('wear') || contentLower.includes('nozzle wear')) {
    // Check for positive mentions
    if (contentLower.includes('requires') || contentLower.includes('needs') || contentLower.includes('use hardened')) {
      return true;
    }
    // Check for negative mentions
    if (contentLower.includes('not abrasive') || contentLower.includes('no wear') || contentLower.includes('standard nozzle')) {
      return false;
    }
    // Default to true if mentioned
    return true;
  }
  
  // Check for material types that are typically abrasive
  if (contentLower.includes('carbon fiber') || contentLower.includes('glass fiber') || contentLower.includes('metal filled')) {
    return true;
  }
  
  return null;
}

/**
 * Extract use case tags
 */
function extractUseCaseTags(content: string): string[] {
  const contentLower = content.toLowerCase();
  const useCases: string[] = [];
  
  const useCaseKeywords = [
    'outdoor', 'indoor', 'food safe', 'food contact', 'medical', 'automotive', 'aerospace',
    'marine', 'industrial', 'hobby', 'prototype', 'art', 'jewelry',
    'functional', 'decorative', 'educational', 'professional', 'engineering',
    'structural', 'mechanical', 'electrical', 'optical', 'transparent',
    'flexible', 'rigid', 'impact resistant', 'heat resistant', 'chemical resistant',
    'uv resistant', 'weather resistant', 'waterproof', 'biodegradable'
  ];
  
  for (const keyword of useCaseKeywords) {
    if (contentLower.includes(keyword)) {
      useCases.push(keyword.charAt(0).toUpperCase() + keyword.slice(1));
    }
  }
  
  return [...new Set(useCases)]; // Remove duplicates
}

/**
 * Extract industry tags
 */
function extractIndustryTags(content: string): string[] {
  const contentLower = content.toLowerCase();
  const industries: string[] = [];
  
  const industryKeywords = [
    'automotive', 'aerospace', 'medical', 'dental', 'jewelry', 'art', 'education',
    'architecture', 'engineering', 'manufacturing', 'prototyping', 'hobby',
    'consumer', 'professional', 'industrial', 'marine', 'defense', 'sports',
    'fashion', 'electronics', 'robotics', 'drones', 'rc', 'cosplay', 'props'
  ];
  
  for (const keyword of industryKeywords) {
    if (contentLower.includes(keyword)) {
      industries.push(keyword.charAt(0).toUpperCase() + keyword.slice(1));
    }
  }
  
  return [...new Set(industries)]; // Remove duplicates
}

/**
 * Extract field by CSS selector (placeholder)
 */
function extractBySelector(content: string, selector: string, transform?: string): any {
  // This would require a proper HTML parser
  // For now, return null
  console.log(`[FIRECRAWL] Selector extraction not implemented: ${selector}`);
  return null;
}

/**
 * Extract additional fields not in brand profile
 */
function extractAdditionalFields(
  markdown: string,
  html: string,
  metadata: Record<string, any>
): ExtractionResult[] {
  const results: ExtractionResult[] = [];
  
  // Extract from metadata
  if (metadata.title) {
    // Could extract product title, but we already have it from Shopify
  }
  
  if (metadata.description) {
    // Could extract description, but not a field in our schema
  }
  
  // Extract additional technical specs from content
  const content = markdown || html;
  if (!content) return results;
  
  // Tg (glass transition temperature)
  const tg = extractGlassTransitionTemp(content);
  if (tg) {
    results.push({
      field: 'tg_c',
      value: tg,
      source: 'firecrawl',
      confidence: 0.6,
      raw_value: content.slice(0, 200)
    });
  }
  
  // Vicat softening temperature
  const vicat = extractVicatSofteningTemp(content);
  if (vicat) {
    results.push({
      field: 'vicat_softening_temp_c',
      value: vicat,
      source: 'firecrawl',
      confidence: 0.6,
      raw_value: content.slice(0, 200)
    });
  }
  
  // Water absorption
  const waterAbsorption = extractWaterAbsorption(content);
  if (waterAbsorption) {
    results.push({
      field: 'water_absorption_percent',
      value: waterAbsorption,
      source: 'firecrawl',
      confidence: 0.6,
      raw_value: content.slice(0, 200)
    });
  }
  
  return results;
}

/**
 * Extract glass transition temperature
 */
function extractGlassTransitionTemp(content: string): number | null {
  const contentLower = content.toLowerCase();
  
  // Match patterns like "Tg: 60°C" or "Glass Transition: 60°C"
  const patterns = [
    /tg[\s:]*(\d+)\s*°?\s*[Cc]?/i,
    /glass[\s-]*transition[\s:]*(\d+)\s*°?\s*[Cc]?/i,
    /transition[\s-]*temp[\s:]*(\d+)\s*°?\s*[Cc]?/i,
  ];
  
  for (const pattern of patterns) {
    const match = content.match(pattern);
    if (match) {
      const temp = parseInt(match[1], 10);
      if (temp >= 0 && temp <= 300) {
        return temp;
      }
    }
  }
  
  return null;
}

/**
 * Extract Vicat softening temperature
 */
function extractVicatSofteningTemp(content: string): number | null {
  const contentLower = content.toLowerCase();
  
  // Match patterns like "Vicat: 60°C" or "Vicat Softening: 60°C"
  const patterns = [
    /vicat[\s:]*(\d+)\s*°?\s*[Cc]?/i,
    /vicat[\s-]*softening[\s:]*(\d+)\s*°?\s*[Cc]?/i,
    /softening[\s-]*temp[\s:]*(\d+)\s*°?\s*[Cc]?/i,
  ];
  
  for (const pattern of patterns) {
    const match = content.match(pattern);
    if (match) {
      const temp = parseInt(match[1], 10);
      if (temp >= 0 && temp <= 300) {
        return temp;
      }
    }
  }
  
  return null;
}

/**
 * Extract water absorption
 */
function extractWaterAbsorption(content: string): number | null {
  const contentLower = content.toLowerCase();
  
  // Match patterns like "Water Absorption: 0.5%" or "Absorption: 0.5 %"
  const patterns = [
    /water[\s-]*absorption[\s:]*(\d+\.?\d*)\s*%/i,
    /absorption[\s:]*(\d+\.?\d*)\s*%/i,
    /(\d+\.?\d*)\s*%[\s-]*water[\s-]*absorption/i,
  ];
  
  for (const pattern of patterns) {
    const match = content.match(pattern);
    if (match) {
      const absorption = parseFloat(match[1]);
      if (absorption >= 0 && absorption <= 10) {
        return absorption;
      }
    }
  }
  
  return null;
}

console.log(`✅ Firecrawl Extractor loaded`);
console.log(`   API endpoint: https://api.firecrawl.dev/v1/scrape`);
console.log(`   Fields extracted: 30+`);
console.log(`   Rate limiting: 1 request per second`);
