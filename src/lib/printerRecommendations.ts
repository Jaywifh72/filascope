import type { Database } from "@/integrations/supabase/types";

type Printer = Database["public"]["Tables"]["printers"]["Row"] & {
  brand: { brand: string } | null;
  series: { series_name: string } | null;
};

export interface Recommendation {
  tagline: string;
  bestFor: string[];
}

// Generate dynamic recommendation based on printer characteristics
export const generateRecommendation = (printer: Printer): Recommendation => {
  const features: string[] = [];
  const bestFor: string[] = [];
  const price = printer.current_price_usd_store || printer.current_price_usd_amazon || printer.msrp_usd || Infinity;
  const maxSpeed = printer.max_print_speed_mms || 0;

  // Build feature list
  if (printer.auto_bed_leveling) features.push('auto bed leveling');
  if (printer.has_enclosure) features.push('enclosed design');
  if (printer.multi_material_supported) features.push('multi-color capability');
  if (maxSpeed >= 400) features.push('blazing fast speeds');
  else if (maxSpeed >= 300) features.push('high-speed printing');
  if (printer.ai_spaghetti_detection) features.push('AI failure detection');
  if (printer.remote_monitoring_supported) features.push('remote monitoring');
  if (printer.input_shaping_supported) features.push('input shaping');

  // Determine best for
  if (printer.has_enclosure && printer.auto_bed_leveling) {
    bestFor.push('Beginners');
  }
  if (price <= 500 && price > 0) {
    bestFor.push('Budget-conscious makers');
  }
  if (maxSpeed >= 300) {
    bestFor.push('Fast prototyping');
  }
  if (printer.multi_material_supported) {
    bestFor.push('Multi-color printing');
  }
  if (printer.has_enclosure) {
    bestFor.push('Engineering materials');
  }
  if (!printer.has_enclosure && !printer.assembly_required) {
    bestFor.push('PLA/PETG printing');
  }

  // Generate tagline
  let tagline = '';
  
  if (features.length >= 3) {
    tagline = `An excellent choice featuring ${features.slice(0, 3).join(', ')}.`;
  } else if (features.length > 0) {
    tagline = `Great printer with ${features.join(' and ')}.`;
  } else {
    tagline = 'A solid choice for 3D printing enthusiasts.';
  }

  // Add specific context
  if (printer.has_enclosure && printer.auto_bed_leveling) {
    tagline = `Perfect for beginners with reliable ${features.slice(0, 2).join(' and ')}. Setup is quick and prints are consistent from the first layer.`;
  } else if (maxSpeed >= 400) {
    tagline = `Speed demon delivering ${maxSpeed}mm/s print speeds without sacrificing quality. Perfect for rapid prototyping and production runs.`;
  } else if (printer.multi_material_supported && printer.has_enclosure) {
    tagline = `Multi-color powerhouse ready for stunning prints. The enclosed design ensures consistent results with any material.`;
  } else if (price <= 300 && printer.auto_bed_leveling) {
    tagline = `Exceptional value with auto bed leveling and solid print quality. A great entry point into 3D printing.`;
  }

  return {
    tagline,
    bestFor: bestFor.slice(0, 4)
  };
};
