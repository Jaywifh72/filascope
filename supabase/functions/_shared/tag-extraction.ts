/**
 * TAG EXTRACTION UTILITIES
 * 
 * Shared utilities for extracting finish types, high speed capability,
 * and abrasive properties from filament titles and materials.
 */

export type FinishType = 
  | 'Silk' 
  | 'Matte' 
  | 'Metallic' 
  | 'Sparkle' 
  | 'Translucent' 
  | 'Glow' 
  | 'Carbon' 
  | 'Glass Fiber' 
  | 'Wood' 
  | 'Marble' 
  | 'Multicolor'
  | 'Standard';

/**
 * Normalize existing finish_type values to standard values
 * Handles variations like "Carbon Fiber", "CF", "Composite-CF" -> "Carbon"
 */
export function normalizeFinishType(existingType: string | null): FinishType {
  if (!existingType) return 'Standard';
  const t = existingType.toLowerCase().trim();
  
  // Carbon Fiber variations → 'Carbon'
  if (t.includes('carbon') || t === 'cf' || t.includes('composite-cf')) return 'Carbon';
  
  // Glass Fiber variations → 'Glass Fiber'  
  if (t.includes('glass') || t === 'gf' || t.includes('composite-gf')) return 'Glass Fiber';
  
  // Silk variations → 'Silk'
  if (t === 'silk' || t === 'shimmer' || t.includes('silk')) return 'Silk';
  
  // Metallic variations → 'Metallic'
  if (t === 'metallic' || t === 'metal' || t.includes('metallic')) return 'Metallic';
  
  // Sparkle variations → 'Sparkle'
  if (t === 'sparkle' || t === 'glitter' || t === 'galaxy' || t === 'starlight' || t.includes('sparkle')) return 'Sparkle';
  
  // Translucent variations → 'Translucent'
  if (t === 'translucent' || t === 'transparent' || t === 'clear' || t.includes('translucent')) return 'Translucent';
  
  // Glow variations → 'Glow'
  if (t === 'glow' || t === 'luminous' || t === 'fluorescent' || t === 'uv reactive' || t === 'uv' || t.includes('glow')) return 'Glow';
  
  // Matte variations → 'Matte'
  if (t === 'matte' || t === 'semi-matte' || t.includes('matte')) return 'Matte';
  
  // Wood variations → 'Wood'
  if (t === 'wood' || t.includes('wood')) return 'Wood';
  
  // Marble variations → 'Marble'
  if (t === 'marble' || t === 'stone' || t.includes('marble')) return 'Marble';
  
  // Multicolor variations → 'Multicolor'
  if (t === 'multicolor' || t === 'gradient' || t === 'rainbow' || t === 'multi' || t.includes('multicolor')) return 'Multicolor';
  
  // Standard/Unknown → 'Standard'
  return 'Standard';
}

/**
 * Extract finish type from product title and material
 * Uses pattern matching to identify special finishes
 */
export function extractFinishType(title: string, material: string): FinishType {
  const t = ((title || '') + ' ' + (material || '')).toLowerCase();
  
  // Order matters - check more specific patterns first
  
  // Carbon fiber (check before other patterns) - include material suffixes like PLA-CF, PETG-CF
  // Also match standalone "CF" in material field and "Carbon" in titles
  const cfPattern = /carbon\s*fiber|carbon-fiber|carbon\s*fibre|-cf\b|\+cf\b|cf\s*\d|\bpla-cf\b|\bpetg-cf\b|\babs-cf\b|\bpa-cf\b|\bpc-cf\b|\bpet-cf\b|\bnylon.*cf\b|\bcf\b/i;
  // Avoid matching "Polycarbonate" without actual carbon fiber
  const hasPolycarbonate = /polycarbonate/i.test(t) && !/carbon\s*fiber|carbon\s*fibre/i.test(t);
  if (!hasPolycarbonate && cfPattern.test(t)) return 'Carbon';
  
  // Glass fiber - include material suffixes like PA-GF, PETG-GF
  if (/glass\s*fiber|glass-fiber|glass\s*fibre|-gf\b|\+gf\b|gf\s*\d|fiberglass|\bpa-gf\b|\bpetg-gf\b|\bpla-gf\b/i.test(t)) return 'Glass Fiber';
  
  // Wood filled
  if (/\bwood\b|timber|bamboo/i.test(t) && !/hollywood|rosewood|driftwood/i.test(t)) return 'Wood';
  
  // Silk/Shimmer (very common, high priority)
  if (/\bsilk\b|shimmer/i.test(t)) return 'Silk';
  
  // Matte finish (exclude "matter" and similar words)
  if (/\bmatte\b/i.test(t)) return 'Matte';
  
  // Metallic finish
  if (/\bmetallic\b|metal\s*finish/i.test(t)) return 'Metallic';
  
  // Sparkle/Glitter/Galaxy
  if (/sparkle|glitter|galaxy|starlight|starry|cosmic/i.test(t)) return 'Sparkle';
  
  // Translucent/Transparent
  if (/translucent|transparent|clear\b|crystal/i.test(t) && !/crystal\s*white/i.test(t)) return 'Translucent';
  
  // Glow in the dark
  if (/\bglow\b|luminous|phosphorescent|gid\b|gitd\b/i.test(t)) return 'Glow';
  
  // Marble effect
  if (/\bmarble\b/i.test(t)) return 'Marble';
  
  // Rainbow/Gradient/Multicolor
  if (/rainbow|gradient|multicolor|multi-color|tri-color|tricolor|dual[\s-]?color/i.test(t)) return 'Multicolor';
  
  return 'Standard';
}

/**
 * Check if filament is high-speed capable
 * Based on title/material patterns
 */
export function isHighSpeedCapable(title: string, material: string): boolean {
  const t = ((title || '') + ' ' + (material || '')).toLowerCase();
  
  // Check for high-speed indicators
  return /high[\s-]?speed|highspeed|-hs\b|hs-|\bhs\s+|\brapid\b|hyper[\s-]?speed|turbo/i.test(t);
}

/**
 * Check if filament is abrasive (requires hardened nozzle)
 * Carbon fiber, glass fiber, and some metal-filled filaments are abrasive
 */
export function isAbrasive(title: string, material: string): boolean {
  const t = ((title || '') + ' ' + (material || '')).toLowerCase();
  
  // Carbon fiber - include material suffixes
  const cfPattern = /carbon\s*fiber|carbon-fiber|carbon\s*fibre|-cf\b|\+cf\b|\bpla-cf\b|\bpetg-cf\b|\babs-cf\b|\bpa-cf\b|\bpc-cf\b|\bpet-cf\b|\bnylon.*cf\b/i;
  const hasPolycarbonate = /polycarbonate/i.test(t) && !/carbon\s*fiber|carbon\s*fibre/i.test(t);
  if (!hasPolycarbonate && cfPattern.test(t)) return true;
  
  // Glass fiber - include material suffixes
  if (/glass\s*fiber|glass-fiber|glass\s*fibre|-gf\b|\+gf\b|fiberglass|\bpa-gf\b|\bpetg-gf\b|\bpla-gf\b/i.test(t)) return true;
  
  // Metal filled (not metallic finish)
  if (/metal[\s-]?fill|copper[\s-]?fill|bronze[\s-]?fill|iron[\s-]?fill|steel[\s-]?fill/i.test(t)) return true;
  
  // Ceramic filled
  if (/ceramic/i.test(t)) return true;
  
  // Kevlar
  if (/kevlar/i.test(t)) return true;
  
  return false;
}

/**
 * Check if filament has carbon fiber
 */
export function hasCarbonFiber(title: string, material: string): boolean {
  const t = ((title || '') + ' ' + (material || '')).toLowerCase();
  const cfPattern = /carbon\s*fiber|carbon-fiber|carbon\s*fibre|-cf\b|\+cf\b|cf\s*\d|\bpla-cf\b|\bpetg-cf\b|\babs-cf\b|\bpa-cf\b|\bpc-cf\b|\bpet-cf\b|\bnylon.*cf\b|\bcf\b/i;
  const hasPolycarbonate = /polycarbonate/i.test(t) && !/carbon\s*fiber|carbon\s*fibre/i.test(t);
  return !hasPolycarbonate && cfPattern.test(t);
}

/**
 * Check if filament has glass fiber
 */
export function hasGlassFiber(title: string, material: string): boolean {
  const t = ((title || '') + ' ' + (material || '')).toLowerCase();
  return /glass\s*fiber|glass-fiber|-gf\b|\+gf\b|gf\s*\d|fiberglass/i.test(t);
}

/**
 * Check if filament is wood filled
 */
export function hasWoodFill(title: string, material: string): boolean {
  const t = ((title || '') + ' ' + (material || '')).toLowerCase();
  // Exclude color names that contain "wood" 
  if (/hollywood|rosewood|driftwood|deadwood|cherrywood/i.test(t)) return false;
  return /\bwood\b|timber|bamboo/i.test(t);
}

/**
 * Extract all relevant tags from a filament
 */
export interface ExtractedTags {
  finish_type: FinishType;
  high_speed_capable: boolean;
  is_nozzle_abrasive: boolean;
  carbon_fiber_percentage: number | null;
  glass_fiber_percentage: number | null;
  wood_powder_percentage: number | null;
}

export function extractAllTags(title: string, material: string): ExtractedTags {
  const hasCF = hasCarbonFiber(title, material);
  const hasGF = hasGlassFiber(title, material);
  const hasWood = hasWoodFill(title, material);
  
  return {
    finish_type: extractFinishType(title, material),
    high_speed_capable: isHighSpeedCapable(title, material),
    is_nozzle_abrasive: isAbrasive(title, material),
    // Set a default percentage if detected but unknown exact amount
    carbon_fiber_percentage: hasCF ? 15 : null,
    glass_fiber_percentage: hasGF ? 15 : null,
    wood_powder_percentage: hasWood ? 20 : null,
  };
}
