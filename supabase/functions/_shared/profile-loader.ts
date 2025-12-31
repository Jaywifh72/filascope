// Profile loader for brand scraper profiles
// Loads AI-generated profiles from brand_scraper_profiles table

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import type { BrandProfile } from './ai-extraction.ts';

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

interface RawBrandProfile {
  id: string;
  brand_slug: string;
  brand_id: string | null;
  product_structure: string | null;
  variant_schema: Record<string, string> | null;
  swatch_type: string | null;
  title_format_pattern: string | null;
  color_extraction_rules: Record<string, any> | null;
  product_line_extraction_rules: Record<string, any> | null;
  discovered_product_lines: Record<string, any> | null;
  discovered_colors: Record<string, any> | null;
  color_hex_mappings: Record<string, string> | null;
  material_patterns: Record<string, string[]> | null;
  special_cases: Record<string, any> | null;
  price_interpretation: string | null;
  analysis_confidence: number | null;
  analysis_notes: string | null;
  sample_products: Record<string, any> | null;
  last_analyzed_at: string | null;
  created_at: string | null;
  updated_at: string | null;
}

/**
 * Load a brand profile from the database
 * Returns null if profile doesn't exist or loading fails
 */
export async function loadBrandProfile(brandSlug: string): Promise<BrandProfile | null> {
  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    const { data, error } = await supabase
      .from('brand_scraper_profiles')
      .select('*')
      .eq('brand_slug', brandSlug)
      .maybeSingle();
    
    if (error) {
      console.error(`[ProfileLoader] Error loading profile for ${brandSlug}:`, error.message);
      return null;
    }
    
    if (!data) {
      console.log(`[ProfileLoader] No profile found for ${brandSlug}`);
      return null;
    }
    
    // Transform to BrandProfile interface
    const profile = transformRawProfile(data as RawBrandProfile);
    console.log(`[ProfileLoader] Loaded profile for ${brandSlug} (confidence: ${data.analysis_confidence ?? 'N/A'})`);
    
    return profile;
  } catch (err) {
    console.error(`[ProfileLoader] Unexpected error loading profile for ${brandSlug}:`, err);
    return null;
  }
}

/**
 * Transform raw database profile to BrandProfile interface
 */
function transformRawProfile(raw: RawBrandProfile): BrandProfile {
  return {
    brand_slug: raw.brand_slug,
    product_structure: raw.product_structure || 'one_product_per_color',
    variant_schema: raw.variant_schema || {},
    swatch_type: raw.swatch_type || 'unknown',
    title_format_pattern: raw.title_format_pattern,
    color_extraction_rules: parseJsonArray(raw.color_extraction_rules),
    product_line_extraction_rules: parseJsonArray(raw.product_line_extraction_rules),
    discovered_product_lines: parseJsonArray(raw.discovered_product_lines),
    discovered_colors: parseColorArray(raw.discovered_colors),
    color_hex_mappings: raw.color_hex_mappings || {},
    material_patterns: raw.material_patterns || {},
    special_cases: parseJsonArray(raw.special_cases),
  };
}

function parseJsonArray(data: any): string[] {
  if (!data) return [];
  if (Array.isArray(data)) return data.map(String);
  if (typeof data === 'object') return Object.values(data).map(String);
  return [];
}

function parseColorArray(data: any): Array<{ name: string; hex: string }> {
  if (!data) return [];
  if (Array.isArray(data)) {
    return data.filter(c => c && typeof c === 'object' && c.name);
  }
  return [];
}

/**
 * Update a brand profile with new discoveries
 */
export async function updateBrandProfile(
  brandSlug: string,
  updates: Partial<{
    discovered_colors: Array<{ name: string; hex: string }>;
    color_hex_mappings: Record<string, string>;
    discovered_product_lines: string[];
    special_cases: string[];
    analysis_notes: string;
  }>
): Promise<boolean> {
  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    const { error } = await supabase
      .from('brand_scraper_profiles')
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq('brand_slug', brandSlug);
    
    if (error) {
      console.error(`[ProfileLoader] Error updating profile for ${brandSlug}:`, error.message);
      return false;
    }
    
    console.log(`[ProfileLoader] Updated profile for ${brandSlug}`);
    return true;
  } catch (err) {
    console.error(`[ProfileLoader] Unexpected error updating profile for ${brandSlug}:`, err);
    return false;
  }
}

/**
 * Merge new color mappings with existing ones
 */
export async function mergeColorMappings(
  brandSlug: string,
  newMappings: Record<string, string>
): Promise<boolean> {
  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    // Load existing profile
    const { data: existing } = await supabase
      .from('brand_scraper_profiles')
      .select('color_hex_mappings')
      .eq('brand_slug', brandSlug)
      .maybeSingle();
    
    const mergedMappings = {
      ...(existing?.color_hex_mappings || {}),
      ...newMappings,
    };
    
    const { error } = await supabase
      .from('brand_scraper_profiles')
      .update({
        color_hex_mappings: mergedMappings,
        updated_at: new Date().toISOString(),
      })
      .eq('brand_slug', brandSlug);
    
    if (error) {
      console.error(`[ProfileLoader] Error merging color mappings for ${brandSlug}:`, error.message);
      return false;
    }
    
    console.log(`[ProfileLoader] Merged ${Object.keys(newMappings).length} color mappings for ${brandSlug}`);
    return true;
  } catch (err) {
    console.error(`[ProfileLoader] Unexpected error merging color mappings:`, err);
    return false;
  }
}

/**
 * Get the option field that contains color data based on variant schema
 */
export function getColorOptionField(profile: BrandProfile | null): 'option1' | 'option2' | 'option3' | null {
  if (!profile?.variant_schema) return null;
  
  for (const [key, value] of Object.entries(profile.variant_schema)) {
    if (value.toLowerCase().includes('color')) {
      if (key === 'option1' || key === 'option2' || key === 'option3') {
        return key;
      }
    }
  }
  
  return null;
}

/**
 * Check if extraction should use AI fallback based on profile confidence
 */
export function shouldUseAIFallback(profile: BrandProfile | null, extractionFailed: boolean): boolean {
  // Always use AI if extraction failed
  if (extractionFailed) return true;
  
  // No profile means no AI guidance available
  if (!profile) return false;
  
  // Profile exists but may not be reliable
  // Use AI fallback for low-confidence profiles
  return false; // For now, only use AI on explicit failures to save costs
}
