import type { Database } from "@/integrations/supabase/types";

export type BadgeType = 
  | 'beginner' 
  | 'advanced' 
  | 'multiColor' 
  | 'largeFormat' 
  | 'resin' 
  | 'highSpeed' 
  | 'enclosed' 
  | 'corexy' 
  | 'discontinued'
  | 'staffPick'
  | 'bestSeller'
  | 'newRelease';

type Printer = Database["public"]["Tables"]["printers"]["Row"] & {
  brand: { brand: string } | null;
  series: { series_name: string } | null;
};

export type CardSize = 'large' | 'medium' | 'small';

export interface CardSizeResult {
  size: CardSize;
  badge?: { label: string; icon: string; colorClass: string };
  isFeatured?: boolean;
}

export interface PrinterBadgeInfo {
  type: BadgeType;
  priority: number;
}

// Get the price of a printer from available sources
export const getPrinterPrice = (printer: Printer): number => {
  return printer.current_price_usd_store || printer.current_price_usd_amazon || printer.msrp_usd || Infinity;
};

// Check if printer is resin-based
const isResinPrinter = (printer: Printer): boolean => {
  const tech = printer.printer_technology?.toLowerCase() || '';
  return tech.includes('resin') || tech.includes('sla') || tech.includes('msla') || tech.includes('dlp');
};

// Check if printer is CoreXY
const isCoreXYPrinter = (printer: Printer): boolean => {
  const motion = printer.motion_system_notes?.toLowerCase() || '';
  const style = printer.machine_style?.toLowerCase() || '';
  return motion.includes('corexy') || style.includes('corexy');
};

// Check if printer is large format (300mm+ in any dimension)
const isLargeFormat = (printer: Printer): boolean => {
  const x = printer.build_volume_x_mm || 0;
  const y = printer.build_volume_y_mm || 0;
  const z = printer.build_volume_z_mm || 0;
  return x >= 300 || y >= 300 || z >= 300;
};

// Check if printer is beginner-friendly
const isBeginnerFriendly = (printer: Printer): boolean => {
  const hasAutoLevel = printer.auto_bed_leveling;
  const hasEnclosure = printer.has_enclosure;
  const goodRating = (printer.rating_community_overall || 0) >= 4.0;
  // At least 2 of these 3 features = beginner friendly
  const score = (hasAutoLevel ? 1 : 0) + (hasEnclosure ? 1 : 0) + (goodRating ? 1 : 0);
  return score >= 2;
};

// Get PRIMARY category badge (only 1)
export const getPrimaryCategoryBadge = (printer: Printer): BadgeType | null => {
  // Priority order for category determination
  
  // 1. Discontinued (highest priority - always show this)
  if (printer.discontinued) {
    return 'discontinued';
  }
  
  // 2. Resin/SLA printers
  if (isResinPrinter(printer)) {
    return 'resin';
  }
  
  // 3. Multi-Color capable
  if (printer.multi_material_supported) {
    return 'multiColor';
  }
  
  // 4. Large Format (300mm+)
  if (isLargeFormat(printer)) {
    return 'largeFormat';
  }
  
  // 5. No primary badge for standard printers
  return null;
};

// Get SECONDARY feature badges (max 2)
export const getSecondaryBadges = (printer: Printer, primaryBadge: BadgeType | null): BadgeType[] => {
  const badges: BadgeType[] = [];
  
  // Skip if discontinued - no secondary badges needed
  if (printer.discontinued) {
    return badges;
  }
  
  // Enclosed
  if (printer.has_enclosure) {
    badges.push('enclosed');
  }
  
  // Multi-color as secondary if not primary
  if (printer.multi_material_supported && primaryBadge !== 'multiColor') {
    badges.push('multiColor');
  }
  
  // Large format as secondary if not primary
  if (isLargeFormat(printer) && primaryBadge !== 'largeFormat') {
    badges.push('largeFormat');
  }
  
  return badges.slice(0, 2); // Max 2 secondary badges
};

// Get ALL badges for a printer
export const getPrinterBadges = (printer: Printer, maxBadges: number = 3): PrinterBadgeInfo[] => {
  const badges: PrinterBadgeInfo[] = [];
  
  // 1. Primary category badge
  const primary = getPrimaryCategoryBadge(printer);
  if (primary) {
    badges.push({ type: primary, priority: 1 });
  }
  
  // 2. Secondary badges
  const secondary = getSecondaryBadges(printer, primary);
  secondary.forEach((type, idx) => {
    badges.push({ type, priority: 2 + idx });
  });
  
  return badges.slice(0, maxBadges);
};

// Determine what size card to use for a printer
export const getCardSize = (printer: Printer, index: number): CardSizeResult => {
  const price = getPrinterPrice(printer);
  const rating = printer.rating_community_overall || 0;
  const hasEnclosure = printer.has_enclosure;
  const hasAutoLevel = printer.auto_bed_leveling;
  const isMultiMaterial = printer.multi_material_supported;
  const maxSpeed = printer.max_print_speed_mms || 0;

  // SMALL: Discontinued printers
  if (printer.discontinued) {
    return {
      size: 'small',
      badge: { label: 'Discontinued', icon: '⊘', colorClass: 'bg-destructive/15 border-destructive/30 text-destructive' }
    };
  }

  // Featured determination logic (for LARGE cards)
  // Position 3, 11, 19, 27... (every 8 cards starting at position 3)
  const isFeaturedPosition = index === 2 || (index > 2 && (index - 2) % 10 === 0);
  
  // High-quality printers get featured at featured positions
  if (isFeaturedPosition) {
    // Best for beginners - enclosed, auto-leveling, good rating
    if (hasEnclosure && hasAutoLevel && rating >= 4.0) {
      return {
        size: 'large',
        badge: { label: 'Best for Beginners', icon: '🏠', colorClass: 'bg-emerald-500/15 border-emerald-500/30 text-emerald-400' },
        isFeatured: true
      };
    }
    
    // Best value - under $500, good rating, has good features
    if (price <= 500 && price > 0 && rating >= 3.5 && hasAutoLevel) {
      return {
        size: 'large',
        badge: { label: 'Best Value', icon: '💰', colorClass: 'bg-amber-500/15 border-amber-500/30 text-amber-400' },
        isFeatured: true
      };
    }
    
    // Speed champion - 400+ mm/s
    if (maxSpeed >= 400) {
      return {
        size: 'large',
        badge: { label: 'Speed Champion', icon: '⚡', colorClass: 'bg-cyan-500/15 border-cyan-500/30 text-cyan-400' },
        isFeatured: true
      };
    }
    
    // Multi-material ready
    if (isMultiMaterial && hasEnclosure) {
      return {
        size: 'large',
        badge: { label: 'Multi-Color Ready', icon: '🎨', colorClass: 'bg-purple-500/15 border-purple-500/30 text-purple-400' },
        isFeatured: true
      };
    }

    // High-rated printers
    if (rating >= 4.5) {
      return {
        size: 'large',
        badge: { label: 'Top Rated', icon: '⭐', colorClass: 'bg-gradient-to-r from-amber-500/20 to-orange-500/20 border-amber-500/40 text-amber-400' },
        isFeatured: true
      };
    }
  }

  // MEDIUM: Default for all other printers
  return { size: 'medium' };
};

// Extract product image from scraped data
export const getPrinterImage = (printer: Printer): string | null => {
  const scrapedData = printer.scraped_data as Record<string, unknown> | null;
  const images = scrapedData?.images as Record<string, unknown> | null;
  const productImages = images?.product_images as string[] | null;
  return productImages?.[0] || printer.image_url || null;
};

// Get key features for a printer
export const getPrinterFeatures = (printer: Printer): string[] => {
  const features: string[] = [];
  
  if (printer.auto_bed_leveling) features.push('Auto bed leveling');
  if (printer.has_enclosure) features.push('Enclosed design');
  if (printer.multi_material_supported) features.push('Multi-color ready');
  if (printer.ai_spaghetti_detection) features.push('AI monitoring');
  if (printer.remote_monitoring_supported) features.push('Remote monitoring');
  if (printer.has_wifi) features.push('Wi-Fi connectivity');
  if (printer.filament_runout_detection) features.push('Filament sensor');
  if ((printer.max_print_speed_mms || 0) >= 300) features.push('High-speed printing');
  if (printer.bed_heated) features.push('Heated bed');
  if (printer.input_shaping_supported) features.push('Input shaping');
  
  return features.slice(0, 8); // Max 8 features
};
