import { QuizAnswers } from './printerQuizData';
import { Database } from '@/integrations/supabase/types';

type Printer = Database['public']['Tables']['printers']['Row'] & {
  brand?: { brand: string } | null;
  series?: { series_name: string } | null;
};

export interface ScoredPrinter {
  printer: Printer;
  score: number;
  matchPercentage: number;
  matchReasons: string[];
  considerations: string[];
}

export interface QuizResults {
  topPrinters: ScoredPrinter[];
  totalMatches: number;
}

// Get the best available price for a printer
const getPrinterPrice = (printer: Printer): number | null => {
  return printer.current_price_usd_store ?? 
         printer.current_price_usd_amazon ?? 
         printer.msrp_usd ?? 
         null;
};

// Check if printer fits budget
const fitsBudget = (printer: Printer, budgetId: string): boolean => {
  const price = getPrinterPrice(printer);
  if (!price) return budgetId === 'flexible';
  
  switch (budgetId) {
    case 'under-500': return price < 500;
    case '500-1000': return price >= 500 && price < 1000;
    case '1000-2000': return price >= 1000 && price < 2000;
    case 'over-2000': return price >= 2000;
    case 'flexible': return true;
    default: return true;
  }
};

// Check if printer is resin type
const isResinPrinter = (printer: Printer): boolean => {
  const tech = (printer.printer_technology || '').toLowerCase();
  return tech.includes('resin') || tech.includes('sla') || tech.includes('msla') || tech.includes('dlp');
};

// Calculate score for a single printer based on answers
const scorePrinter = (printer: Printer, answers: QuizAnswers): number => {
  let score = 0;
  
  // Experience level scoring
  const experience = answers.experience?.[0];
  if (experience) {
    const hasAutoLevel = printer.auto_bed_leveling === true;
    const isEnclosed = printer.has_enclosure === true;
    const hasWifi = printer.has_wifi === true;
    const easeRating = printer.rating_ease_of_use ?? 0;
    
    if (experience === 'complete-beginner' || experience === 'researched') {
      if (hasAutoLevel) score += 25;
      if (isEnclosed) score += 15;
      if (hasWifi) score += 10;
      if (easeRating >= 4) score += 20;
      if (!printer.assembly_required) score += 15;
    } else if (experience === 'experienced') {
      if (hasAutoLevel) score += 10;
      score += 15; // More lenient
    } else if (experience === 'advanced') {
      // Advanced users value features more than ease
      if (printer.firmware_open_source) score += 15;
      if (printer.max_print_speed_mms && printer.max_print_speed_mms >= 300) score += 15;
    }
  }
  
  // Use case scoring
  const useCase = answers.useCase?.[0];
  if (useCase) {
    const buildVolumeX = printer.build_volume_x_mm ?? 0;
    const buildVolumeY = printer.build_volume_y_mm ?? 0;
    const maxNozzleTemp = printer.max_nozzle_temp_c ?? 0;
    const isEnclosed = printer.has_enclosure === true;
    
    switch (useCase) {
      case 'decorations':
        if (buildVolumeX >= 200 && buildVolumeY >= 200) score += 20;
        score += 15; // PLA is easy
        break;
      case 'miniatures':
        // Resin printers are great for miniatures
        if (isResinPrinter(printer)) score += 30;
        // High resolution FDM also good
        if (printer.stock_nozzle_diameter_mm && printer.stock_nozzle_diameter_mm <= 0.4) score += 15;
        break;
      case 'functional':
        if (isEnclosed) score += 25;
        if (maxNozzleTemp >= 280) score += 20;
        if (printer.bed_heated) score += 15;
        break;
      case 'educational':
        if (printer.rating_ease_of_use && printer.rating_ease_of_use >= 4) score += 25;
        if (isEnclosed) score += 20; // Safety
        break;
      case 'versatile':
        if (printer.multi_material_supported) score += 20;
        if (buildVolumeX >= 250) score += 15;
        if (maxNozzleTemp >= 260) score += 15;
        break;
    }
  }
  
  // Space scoring
  const space = answers.space?.[0];
  if (space) {
    const isEnclosed = printer.has_enclosure === true;
    const noiseLevel = printer.noise_level_printing_db ?? 60;
    const machineWidth = printer.machine_width_mm ?? 500;
    const machineDepth = printer.machine_depth_mm ?? 500;
    
    switch (space) {
      case 'living-space':
        if (isEnclosed) score += 20;
        if (noiseLevel < 50) score += 25;
        if (machineWidth < 450 && machineDepth < 450) score += 15;
        break;
      case 'workshop':
        // No restrictions - give baseline score
        score += 15;
        break;
      case 'desk':
        if (machineWidth < 400 && machineDepth < 400) score += 30;
        break;
      case 'office':
        if (isEnclosed) score += 25;
        if (noiseLevel < 55) score += 20;
        break;
    }
  }
  
  // Feature scoring (multiple selection)
  const features = answers.features ?? [];
  features.forEach(feature => {
    switch (feature) {
      case 'fast':
        if (printer.max_print_speed_mms && printer.max_print_speed_mms >= 300) score += 25;
        else if (printer.max_print_speed_mms && printer.max_print_speed_mms >= 200) score += 10;
        break;
      case 'multicolor':
        if (printer.multi_material_supported) score += 30;
        break;
      case 'large-volume':
        const buildX = printer.build_volume_x_mm ?? 0;
        const buildY = printer.build_volume_y_mm ?? 0;
        if (buildX >= 300 || buildY >= 300) score += 25;
        break;
      case 'quiet':
        if (printer.noise_level_printing_db && printer.noise_level_printing_db < 50) score += 25;
        break;
      case 'wifi':
        if (printer.has_wifi) score += 20;
        if (printer.remote_monitoring_supported) score += 10;
        break;
      case 'easy-setup':
        if (printer.auto_bed_leveling) score += 15;
        if (!printer.assembly_required) score += 15;
        break;
      case 'enclosed':
        if (printer.has_enclosure) score += 25;
        break;
      case 'materials':
        if (printer.max_nozzle_temp_c && printer.max_nozzle_temp_c >= 280) score += 20;
        if (printer.has_enclosure) score += 10;
        break;
    }
  });
  
  // Tinkering preference scoring
  const tinkering = answers.tinkering?.[0];
  if (tinkering) {
    switch (tinkering) {
      case 'plug-and-play':
        if (!printer.assembly_required) score += 25;
        if (printer.auto_bed_leveling) score += 20;
        if (printer.rating_ease_of_use && printer.rating_ease_of_use >= 4) score += 15;
        break;
      case 'some-setup':
        score += 15; // Flexible
        break;
      case 'enjoy-customizing':
        if (printer.firmware_open_source) score += 20;
        score += 10;
        break;
      case 'build-everything':
        if (printer.assembly_required) score += 15;
        if (printer.firmware_open_source) score += 25;
        break;
    }
  }
  
  // Bonus for high ratings
  if (printer.rating_community_overall && printer.rating_community_overall >= 4.5) score += 15;
  if (printer.rating_community_overall && printer.rating_community_overall >= 4) score += 10;
  
  return score;
};

// Generate match reasons based on printer attributes and user answers
const generateMatchReasons = (printer: Printer, answers: QuizAnswers): string[] => {
  const reasons: string[] = [];
  const experience = answers.experience?.[0];
  const useCase = answers.useCase?.[0];
  const features = answers.features ?? [];
  const tinkering = answers.tinkering?.[0];
  
  // Experience-based reasons
  if ((experience === 'complete-beginner' || experience === 'researched') && printer.auto_bed_leveling) {
    reasons.push('Automatic bed leveling makes setup easy');
  }
  if ((experience === 'complete-beginner' || experience === 'researched') && !printer.assembly_required) {
    reasons.push('Arrives pre-assembled - start printing right away');
  }
  
  // Use case reasons
  if (useCase === 'miniatures' && isResinPrinter(printer)) {
    reasons.push('Resin technology provides exceptional detail for miniatures');
  }
  if (useCase === 'functional' && printer.has_enclosure) {
    reasons.push('Enclosed chamber for printing engineering materials');
  }
  if (useCase === 'functional' && printer.max_nozzle_temp_c && printer.max_nozzle_temp_c >= 280) {
    reasons.push(`High temperature hotend (${printer.max_nozzle_temp_c}°C) for strong materials`);
  }
  
  // Feature reasons
  if (features.includes('fast') && printer.max_print_speed_mms && printer.max_print_speed_mms >= 300) {
    reasons.push(`High-speed printing up to ${printer.max_print_speed_mms}mm/s`);
  }
  if (features.includes('multicolor') && printer.multi_material_supported) {
    reasons.push('Multi-color printing capability included');
  }
  if (features.includes('quiet') && printer.noise_level_printing_db && printer.noise_level_printing_db < 50) {
    reasons.push(`Quiet operation at ${printer.noise_level_printing_db}dB`);
  }
  if (features.includes('wifi') && printer.has_wifi) {
    reasons.push('Wi-Fi connectivity for remote monitoring');
  }
  if (features.includes('enclosed') && printer.has_enclosure) {
    reasons.push('Enclosed design for safety and temperature control');
  }
  
  // Tinkering reasons
  if (tinkering === 'plug-and-play' && !printer.assembly_required && printer.auto_bed_leveling) {
    reasons.push('Zero tinkering required - true plug and play');
  }
  if ((tinkering === 'enjoy-customizing' || tinkering === 'build-everything') && printer.firmware_open_source) {
    reasons.push('Open-source firmware for customization');
  }
  
  // Rating reasons
  if (printer.rating_community_overall && printer.rating_community_overall >= 4.5) {
    reasons.push(`Highly rated by users (${printer.rating_community_overall.toFixed(1)}/5)`);
  }
  
  // Build volume
  if (printer.build_volume_x_mm && printer.build_volume_y_mm && printer.build_volume_z_mm) {
    const volume = printer.build_volume_x_mm * printer.build_volume_y_mm * printer.build_volume_z_mm / 1000000;
    if (volume > 15) {
      reasons.push(`Large build volume (${printer.build_volume_x_mm}×${printer.build_volume_y_mm}×${printer.build_volume_z_mm}mm)`);
    }
  }
  
  return reasons.slice(0, 5); // Max 5 reasons
};

// Generate considerations (trade-offs)
const generateConsiderations = (printer: Printer, answers: QuizAnswers): string[] => {
  const considerations: string[] = [];
  const experience = answers.experience?.[0];
  const features = answers.features ?? [];
  const space = answers.space?.[0];
  
  // Beginner considerations
  if ((experience === 'complete-beginner' || experience === 'researched')) {
    if (!printer.auto_bed_leveling) {
      considerations.push('Manual bed leveling required');
    }
    if (printer.assembly_required) {
      considerations.push('Some assembly required (1-2 hours)');
    }
  }
  
  // Feature gaps
  if (features.includes('multicolor') && !printer.multi_material_supported) {
    considerations.push('Multi-color system sold separately');
  }
  if (features.includes('wifi') && !printer.has_wifi) {
    considerations.push('No built-in Wi-Fi - manual file transfer');
  }
  if (features.includes('enclosed') && !printer.has_enclosure) {
    considerations.push('Open frame design - may need enclosure for some materials');
  }
  
  // Space considerations
  if (space === 'desk' || space === 'living-space') {
    if (printer.machine_width_mm && printer.machine_width_mm > 500) {
      considerations.push('Larger footprint - verify space available');
    }
    if (printer.noise_level_printing_db && printer.noise_level_printing_db > 55) {
      considerations.push(`Moderate noise level (${printer.noise_level_printing_db}dB)`);
    }
  }
  
  // Price considerations
  const price = getPrinterPrice(printer);
  const budget = answers.budget?.[0];
  if (price && budget === 'under-500' && price > 400) {
    considerations.push('Near top of budget range');
  }
  
  return considerations.slice(0, 3); // Max 3 considerations
};

// Main recommendation function
export const calculateRecommendations = (
  printers: Printer[],
  answers: QuizAnswers
): QuizResults => {
  const budgetAnswer = answers.budget?.[0] ?? 'flexible';
  
  // Filter by budget first
  const budgetFiltered = printers.filter(p => fitsBudget(p, budgetAnswer));
  
  // Score all printers
  const scored = budgetFiltered.map(printer => {
    const score = scorePrinter(printer, answers);
    return { printer, score };
  });
  
  // Sort by score descending
  scored.sort((a, b) => b.score - a.score);
  
  // Get max score for percentage calculation
  const maxScore = Math.max(...scored.map(s => s.score), 1);
  
  // Get top 3 with full details
  const topPrinters: ScoredPrinter[] = scored.slice(0, 3).map((s, index) => {
    // Calculate match percentage (top scorer gets ~95%, others scaled)
    const basePercentage = (s.score / maxScore) * 100;
    const matchPercentage = Math.min(98, Math.max(70, basePercentage - (index * 5)));
    
    return {
      printer: s.printer,
      score: s.score,
      matchPercentage: Math.round(matchPercentage),
      matchReasons: generateMatchReasons(s.printer, answers),
      considerations: generateConsiderations(s.printer, answers)
    };
  });
  
  return {
    topPrinters,
    totalMatches: budgetFiltered.length
  };
};
