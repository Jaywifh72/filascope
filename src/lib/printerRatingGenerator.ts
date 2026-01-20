// Rating calculation utilities for printer feature cards

export interface PrinterRatingData {
  maxSpeed?: number | null;
  buildVolume?: { x: number | null; y: number | null; z: number | null };
  multiMaterialSupported?: boolean | null;
  multiMaterialMaxSpools?: number | null;
  hasAMS?: boolean | null;
  maxNozzleTemp?: number | null;
  hasEnclosure?: boolean | null;
  enclosureHeated?: boolean | null;
}

export interface FeatureCardData {
  category: string;
  categoryKey: string; // For terminal-style formatting
  rating: number;
  primaryValue: string;
  contextText: string;
  badgeText: string;
  badgeVariant: 'green' | 'gold' | 'blue';
}

// Speed rating (1-5)
export function getSpeedRating(speed: number | null | undefined): number {
  if (!speed) return 1;
  if (speed >= 400) return 5;
  if (speed >= 250) return 4;
  if (speed >= 150) return 3;
  if (speed >= 80) return 2;
  return 1;
}

// Volume rating (1-5) based on max dimension
export function getVolumeRating(volume: { x: number | null; y: number | null; z: number | null }): number {
  const maxDim = Math.max(volume.x || 0, volume.y || 0, volume.z || 0);
  if (maxDim >= 300) return 5;
  if (maxDim >= 250) return 4;
  if (maxDim >= 220) return 3;
  if (maxDim >= 180) return 2;
  return 1;
}

// Multi-color rating (1-5)
export function getColorRating(colorCount: number | null | undefined, hasAMS?: boolean | null): number {
  if (!colorCount || colorCount <= 1) return 1;
  if (colorCount >= 5) return 5;
  if (colorCount === 4) return hasAMS ? 5 : 4;
  if (colorCount >= 2) return 3;
  return 1;
}

// Temperature rating (1-5)
export function getTempRating(maxTemp: number | null | undefined): number {
  if (!maxTemp) return 1;
  if (maxTemp >= 350) return 5;
  if (maxTemp >= 300) return 4;
  if (maxTemp >= 260) return 3;
  if (maxTemp >= 240) return 2;
  return 1;
}

// Context text generators - Technical style
export function getSpeedContext(speed: number | null | undefined, rating: number): string {
  if (rating === 5) return "VELOCITY: 2X_STANDARD // CLASS: HIGH_SPEED";
  if (rating === 4) return "VELOCITY: ABOVE_AVERAGE // THROUGHPUT: ENHANCED";
  if (rating === 3) return "MODE: BALANCED // SPEED_VS_QUALITY: OPTIMIZED";
  if (rating === 2) return "MODE: RELIABLE // PRINT_SPEED: MODERATE";
  return "PRIORITY: QUALITY // SPEED_MODE: CONSERVATIVE";
}

export function getVolumeContext(volume: { x: number | null; y: number | null; z: number | null }, rating: number): string {
  if (rating === 5) return "CAPACITY: COSPLAY_HELMETS // SCALE: FULL_SIZE";
  if (rating === 4) return "CAPACITY: LARGE // CLEARANCE: MOST_PROJECTS";
  if (rating === 3) return "CAPACITY: STANDARD // USE_CASE: EVERYDAY";
  if (rating === 2) return "FOOTPRINT: COMPACT // VOLUME: ADEQUATE";
  return "FOOTPRINT: MINIMAL // DETAIL: OPTIMIZED";
}

export function getMultiColorContext(colorCount: number | null | undefined, hasAMS?: boolean | null): string {
  if (hasAMS) return "AMS_INCLUDED: TRUE // SWAP_MODE: AUTOMATIC";
  if (colorCount && colorCount >= 4) return "MULTI_SPOOL: ACTIVE // SWAP_MODE: AUTO";
  if (colorCount && colorCount >= 2) return "DUAL_EXTRUSION: ENABLED";
  return "EXTRUDER_COUNT: 1 // MODE: SINGLE_MATERIAL";
}

export function getTempContext(maxTemp: number | null | undefined, rating: number): string {
  if (rating === 5) return "MATERIALS: ENGINEERING_GRADE // ACCESS: FULL";
  if (rating === 4) return "MATERIALS: HIGH_PERFORMANCE // ACCESS: EXTENDED";
  if (rating === 3) return "MATERIALS: STANDARD // COMPATIBILITY: BROAD";
  return "MATERIALS: PLA_PETG // COMPATIBILITY: BASIC";
}

export function getEnclosureContext(heated?: boolean | null): string {
  if (heated) return "THERMAL_CONTROL: ACTIVE // WARP_PREVENTION: ENABLED";
  return "FUME_CONTAINMENT: ACTIVE // SAFETY: ENHANCED";
}

// Badge text generators - Terminal status style
export function getSpeedBadge(rating: number): { badgeText: string; badgeVariant: 'green' | 'gold' | 'blue' } {
  if (rating === 5) return { badgeText: "STATUS: TOP_5_PERCENTILE", badgeVariant: 'green' };
  if (rating === 4) return { badgeText: "STATUS: EXCELLENT", badgeVariant: 'green' };
  if (rating === 3) return { badgeText: "STATUS: COMPETITIVE", badgeVariant: 'blue' };
  return { badgeText: "STATUS: QUALITY_FOCUS", badgeVariant: 'blue' };
}

export function getVolumeBadge(rating: number): { badgeText: string; badgeVariant: 'green' | 'gold' | 'blue' } {
  if (rating === 5) return { badgeText: "DESIGNATION: LARGE_FORMAT", badgeVariant: 'gold' };
  if (rating === 4) return { badgeText: "STATUS: ABOVE_AVERAGE", badgeVariant: 'green' };
  if (rating === 3) return { badgeText: "STATUS: STANDARD", badgeVariant: 'blue' };
  return { badgeText: "DESIGNATION: COMPACT", badgeVariant: 'blue' };
}

export function getMultiColorBadge(colorCount: number | null | undefined, hasAMS?: boolean | null): { badgeText: string; badgeVariant: 'green' | 'gold' | 'blue' } {
  if (hasAMS) return { badgeText: "STATUS: BEGINNER_READY", badgeVariant: 'blue' };
  if (colorCount && colorCount >= 4) return { badgeText: "STATUS: MULTI_COLOR", badgeVariant: 'green' };
  if (colorCount && colorCount >= 2) return { badgeText: "STATUS: DUAL_COLOR", badgeVariant: 'blue' };
  return { badgeText: "STATUS: SINGLE_MATERIAL", badgeVariant: 'blue' };
}

export function getTempBadge(rating: number): { badgeText: string; badgeVariant: 'green' | 'gold' | 'blue' } {
  if (rating === 5) return { badgeText: "STATUS: ADVANCED_MATERIALS", badgeVariant: 'green' };
  if (rating === 4) return { badgeText: "STATUS: HIGH_TEMP", badgeVariant: 'green' };
  return { badgeText: "STATUS: STANDARD_MATERIALS", badgeVariant: 'blue' };
}

export function getEnclosureBadge(heated?: boolean | null): { badgeText: string; badgeVariant: 'green' | 'gold' | 'blue' } {
  if (heated) return { badgeText: "GRADE: PROFESSIONAL", badgeVariant: 'gold' };
  return { badgeText: "STATUS: HOME_SAFE", badgeVariant: 'green' };
}

// Generate all three feature cards for a printer
export function generateFeatureCards(printer: PrinterRatingData): FeatureCardData[] {
  const cards: FeatureCardData[] = [];
  
  // Card 1: Print Speed
  const speedRating = getSpeedRating(printer.maxSpeed);
  cards.push({
    category: "PRINT SPEED",
    categoryKey: "PRINT_SPEED",
    rating: speedRating,
    primaryValue: printer.maxSpeed ? `${printer.maxSpeed} mm/s` : "N/A",
    contextText: getSpeedContext(printer.maxSpeed, speedRating),
    ...getSpeedBadge(speedRating)
  });
  
  // Card 2: Build Volume
  const volume = printer.buildVolume || { x: null, y: null, z: null };
  const volumeRating = getVolumeRating(volume);
  const hasValidVolume = volume.x && volume.y && volume.z;
  cards.push({
    category: "BUILD VOLUME",
    categoryKey: "BUILD_VOLUME",
    rating: volumeRating,
    primaryValue: hasValidVolume 
      ? `${volume.x}×${volume.y}×${volume.z}mm`
      : "N/A",
    contextText: getVolumeContext(volume, volumeRating),
    ...getVolumeBadge(volumeRating)
  });
  
  // Card 3: Multi-Color OR Temperature OR Enclosure (priority order)
  if (printer.multiMaterialSupported && printer.multiMaterialMaxSpools && printer.multiMaterialMaxSpools > 1) {
    const colorRating = getColorRating(printer.multiMaterialMaxSpools, printer.hasAMS);
    cards.push({
      category: "MULTI-COLOR",
      categoryKey: "MULTI_COLOR",
      rating: colorRating,
      primaryValue: `${printer.multiMaterialMaxSpools} Colors`,
      contextText: getMultiColorContext(printer.multiMaterialMaxSpools, printer.hasAMS),
      ...getMultiColorBadge(printer.multiMaterialMaxSpools, printer.hasAMS)
    });
  } else if (printer.maxNozzleTemp && printer.maxNozzleTemp >= 280) {
    const tempRating = getTempRating(printer.maxNozzleTemp);
    cards.push({
      category: "TEMPERATURE RANGE",
      categoryKey: "TEMP_RANGE",
      rating: tempRating,
      primaryValue: `${printer.maxNozzleTemp}°C`,
      contextText: getTempContext(printer.maxNozzleTemp, tempRating),
      ...getTempBadge(tempRating)
    });
  } else if (printer.hasEnclosure) {
    cards.push({
      category: "SAFETY & DESIGN",
      categoryKey: "SAFETY_DESIGN",
      rating: printer.enclosureHeated ? 5 : 4,
      primaryValue: printer.enclosureHeated ? "Heated Enclosure" : "Enclosed",
      contextText: getEnclosureContext(printer.enclosureHeated),
      ...getEnclosureBadge(printer.enclosureHeated)
    });
  } else {
    // Fallback to temperature if nothing else
    const tempRating = getTempRating(printer.maxNozzleTemp);
    cards.push({
      category: "TEMPERATURE RANGE",
      categoryKey: "TEMP_RANGE",
      rating: tempRating,
      primaryValue: printer.maxNozzleTemp ? `${printer.maxNozzleTemp}°C` : "Standard",
      contextText: getTempContext(printer.maxNozzleTemp, tempRating),
      ...getTempBadge(tempRating)
    });
  }
  
  return cards;
}
