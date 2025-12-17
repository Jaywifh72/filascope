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
  rating: number;
  emoji: string;
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

// Context text generators
export function getSpeedContext(speed: number | null | undefined, rating: number): string {
  if (rating === 5) return "2x faster than standard FDM printers";
  if (rating === 4) return "Significantly faster than most printers";
  if (rating === 3) return "Good balance of speed and quality";
  if (rating === 2) return "Reliable printing at moderate speeds";
  return "Focused on quality over speed";
}

export function getVolumeContext(volume: { x: number | null; y: number | null; z: number | null }, rating: number): string {
  if (rating === 5) return "Print full-size cosplay helmets";
  if (rating === 4) return "Large enough for most projects";
  if (rating === 3) return "Generous build space for everyday prints";
  if (rating === 2) return "Compact footprint, adequate volume";
  return "Perfect for small detailed prints";
}

export function getMultiColorContext(colorCount: number | null | undefined, hasAMS?: boolean | null): string {
  if (hasAMS) return "No manual swap • AMS included";
  if (colorCount && colorCount >= 4) return "Automatic material switching";
  if (colorCount && colorCount >= 2) return "Multi-color prints possible";
  return "Single extruder setup";
}

export function getTempContext(maxTemp: number | null | undefined, rating: number): string {
  if (rating === 5) return "Print engineering-grade materials";
  if (rating === 4) return "Handles high-performance filaments";
  if (rating === 3) return "Works with most standard materials";
  return "Optimized for PLA and PETG";
}

export function getEnclosureContext(heated?: boolean | null): string {
  if (heated) return "Heated enclosure for warping-free prints";
  return "Safer for home use & contains fumes";
}

// Badge text generators
export function getSpeedBadge(rating: number): { badgeText: string; badgeVariant: 'green' | 'gold' | 'blue' } {
  if (rating === 5) return { badgeText: "Top 5% of printers", badgeVariant: 'green' };
  if (rating === 4) return { badgeText: "Excellent Speed", badgeVariant: 'green' };
  if (rating === 3) return { badgeText: "Competitive Speed", badgeVariant: 'blue' };
  return { badgeText: "Quality-Focused", badgeVariant: 'blue' };
}

export function getVolumeBadge(rating: number): { badgeText: string; badgeVariant: 'green' | 'gold' | 'blue' } {
  if (rating === 5) return { badgeText: "Large Format Leader", badgeVariant: 'gold' };
  if (rating === 4) return { badgeText: "Above Average Size", badgeVariant: 'green' };
  if (rating === 3) return { badgeText: "Standard Build Volume", badgeVariant: 'blue' };
  return { badgeText: "Compact Design", badgeVariant: 'blue' };
}

export function getMultiColorBadge(colorCount: number | null | undefined, hasAMS?: boolean | null): { badgeText: string; badgeVariant: 'green' | 'gold' | 'blue' } {
  if (hasAMS) return { badgeText: "Beginner-Friendly", badgeVariant: 'blue' };
  if (colorCount && colorCount >= 4) return { badgeText: "Multi-Color Ready", badgeVariant: 'green' };
  if (colorCount && colorCount >= 2) return { badgeText: "Dual-Color Capable", badgeVariant: 'blue' };
  return { badgeText: "Single Material", badgeVariant: 'blue' };
}

export function getTempBadge(rating: number): { badgeText: string; badgeVariant: 'green' | 'gold' | 'blue' } {
  if (rating === 5) return { badgeText: "Advanced Materials Ready", badgeVariant: 'green' };
  if (rating === 4) return { badgeText: "High-Temp Capable", badgeVariant: 'green' };
  return { badgeText: "Standard Materials", badgeVariant: 'blue' };
}

export function getEnclosureBadge(heated?: boolean | null): { badgeText: string; badgeVariant: 'green' | 'gold' | 'blue' } {
  if (heated) return { badgeText: "Professional Grade", badgeVariant: 'gold' };
  return { badgeText: "Home-Friendly", badgeVariant: 'green' };
}

// Generate all three feature cards for a printer
export function generateFeatureCards(printer: PrinterRatingData): FeatureCardData[] {
  const cards: FeatureCardData[] = [];
  
  // Card 1: Print Speed
  const speedRating = getSpeedRating(printer.maxSpeed);
  cards.push({
    category: "PRINT SPEED",
    rating: speedRating,
    emoji: "⚡",
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
    rating: volumeRating,
    emoji: "📦",
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
      rating: colorRating,
      emoji: "🎨",
      primaryValue: `${printer.multiMaterialMaxSpools} Colors`,
      contextText: getMultiColorContext(printer.multiMaterialMaxSpools, printer.hasAMS),
      ...getMultiColorBadge(printer.multiMaterialMaxSpools, printer.hasAMS)
    });
  } else if (printer.maxNozzleTemp && printer.maxNozzleTemp >= 280) {
    const tempRating = getTempRating(printer.maxNozzleTemp);
    cards.push({
      category: "TEMPERATURE RANGE",
      rating: tempRating,
      emoji: "🔥",
      primaryValue: `${printer.maxNozzleTemp}°C`,
      contextText: getTempContext(printer.maxNozzleTemp, tempRating),
      ...getTempBadge(tempRating)
    });
  } else if (printer.hasEnclosure) {
    cards.push({
      category: "SAFETY & DESIGN",
      rating: printer.enclosureHeated ? 5 : 4,
      emoji: "🛡️",
      primaryValue: printer.enclosureHeated ? "Heated Enclosure" : "Enclosed",
      contextText: getEnclosureContext(printer.enclosureHeated),
      ...getEnclosureBadge(printer.enclosureHeated)
    });
  } else {
    // Fallback to temperature if nothing else
    const tempRating = getTempRating(printer.maxNozzleTemp);
    cards.push({
      category: "TEMPERATURE RANGE",
      rating: tempRating,
      emoji: "🔥",
      primaryValue: printer.maxNozzleTemp ? `${printer.maxNozzleTemp}°C` : "Standard",
      contextText: getTempContext(printer.maxNozzleTemp, tempRating),
      ...getTempBadge(tempRating)
    });
  }
  
  return cards;
}
