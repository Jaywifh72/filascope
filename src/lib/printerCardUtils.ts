import type { Database } from "@/integrations/supabase/types";

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

// Get the price of a printer from available sources
export const getPrinterPrice = (printer: Printer): number => {
  return printer.current_price_usd_store || printer.current_price_usd_amazon || printer.msrp_usd || Infinity;
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
  return productImages?.[0] || null;
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
