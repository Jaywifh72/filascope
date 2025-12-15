import { Database } from "@/integrations/supabase/types";
import { TrendingMaterial } from "@/hooks/useTrendingMaterials";

type Filament = Database["public"]["Tables"]["filaments"]["Row"];
type Printer = Database["public"]["Tables"]["printers"]["Row"];
type Accessory = Database["public"]["Tables"]["printer_accessories"]["Row"];

export interface DynamicRecommendation {
  type: "perfect_for" | "warning" | "badge" | "project_suggestion";
  icon: string;
  text: string;
  subtext?: string;
  severity?: "info" | "warning" | "error";
  link?: { url: string; label: string };
}

export interface IntelligentContent {
  dynamicPerfectFor: string[];
  printerWarnings: DynamicRecommendation[];
  projectSuggestions: DynamicRecommendation[];
  contextBadges: DynamicRecommendation[];
}

// Property-based recommendations from filament data
export function getPropertyBasedRecommendations(filament: Filament): string[] {
  const recommendations: string[] = [];

  // Food-safe check
  if (filament.food_contact_rating && filament.food_contact_rating !== "Not Rated" && filament.food_contact_rating !== "None") {
    recommendations.push("Food containers (with proper post-processing)");
  }

  // High-temperature applications (Tg > 80°C or nozzle max > 280°C indicates high-temp material)
  if ((filament.tg_c && filament.tg_c > 80) || (filament.nozzle_temp_max_c && filament.nozzle_temp_max_c > 280)) {
    recommendations.push("High-temperature applications (80°C+)");
  }

  // Flexible parts (Shore hardness < 95D or material is TPU/TPE)
  const material = filament.material?.toLowerCase() || "";
  if ((filament.shore_hardness_d && filament.shore_hardness_d < 95) || 
      material.includes("tpu") || material.includes("tpe")) {
    recommendations.push("Flexible parts and living hinges");
  }

  // High-speed printing capable
  if (filament.high_speed_capable || (filament.print_speed_max_mms && filament.print_speed_max_mms >= 300)) {
    recommendations.push("High-speed printing (300+ mm/s)");
  }

  // AMS compatible
  if (filament.spool_ams_fit) {
    recommendations.push("Bambu Lab AMS multi-color prints");
  }

  // High strength materials
  if (filament.tensile_strength_xy_mpa && filament.tensile_strength_xy_mpa > 50) {
    recommendations.push("Load-bearing structural parts");
  }

  return recommendations;
}

// Printer compatibility warnings
export function getPrinterWarnings(
  filament: Filament,
  printer: Printer | null,
  hotend: Accessory | null
): DynamicRecommendation[] {
  if (!printer) return [];

  const warnings: DynamicRecommendation[] = [];
  const material = filament.material?.toLowerCase() || "";

  // Enclosure warning for ABS/ASA/PC/Nylon
  const needsEnclosure = ["abs", "asa", "pc", "nylon", "pa"].some(m => material.includes(m));
  if (needsEnclosure && !printer.has_enclosure) {
    warnings.push({
      type: "warning",
      icon: "⚠️",
      text: "Your printer may need modifications for this material",
      subtext: `${filament.material} requires 80-100°C chamber temperature to prevent warping. Consider adding an enclosure.`,
      severity: "warning"
    });
  }

  // All-metal hotend warning for high-temp materials
  if (filament.nozzle_temp_min_c && filament.nozzle_temp_min_c > 240) {
    const hotendSpecs = hotend?.specs as Record<string, unknown> | null;
    const hotendMaterial = (hotendSpecs?.heatbreak_material as string)?.toLowerCase() || "";
    const hasPtfeHotend = hotendMaterial.includes("ptfe");
    const printerMaxTemp = printer.max_nozzle_temp_c || 260;

    if (hasPtfeHotend || (!hotend && printerMaxTemp < 260)) {
      warnings.push({
        type: "warning",
        icon: "⚠️",
        text: "Requires all-metal hotend upgrade",
        subtext: `Printing at ${filament.nozzle_temp_min_c}°C+ will damage PTFE-lined hotends. Upgrade recommended.`,
        severity: "error"
      });
    }
  }

  // Abrasive material + brass nozzle warning
  if (filament.is_nozzle_abrasive || material.includes("cf") || material.includes("gf")) {
    const hotendSpecs = hotend?.specs as Record<string, unknown> | null;
    const nozzleMaterial = (hotendSpecs?.nozzle_material as string)?.toLowerCase() || "";
    const hasBrassNozzle = nozzleMaterial.includes("brass") || !hotend;

    if (hasBrassNozzle) {
      warnings.push({
        type: "warning",
        icon: "⚠️",
        text: "Hardened nozzle recommended",
        subtext: "This abrasive material will wear out brass nozzles quickly. Consider hardened steel or ruby tip.",
        severity: "warning"
      });
    }
  }

  // Bed temperature warning
  if (filament.bed_temp_min_c && printer.bed_max_temp_c) {
    if (filament.bed_temp_min_c > printer.bed_max_temp_c) {
      warnings.push({
        type: "warning",
        icon: "⚠️",
        text: "Bed temperature may be insufficient",
        subtext: `This filament needs ${filament.bed_temp_min_c}°C bed, but your printer maxes at ${printer.bed_max_temp_c}°C.`,
        severity: "error"
      });
    }
  }

  return warnings;
}

// Project type suggestions based on material name and properties
export function getProjectSuggestions(filament: Filament): DynamicRecommendation[] {
  const suggestions: DynamicRecommendation[] = [];
  const title = filament.product_title?.toLowerCase() || "";
  const material = filament.material?.toLowerCase() || "";

  // Parse product name for hints
  if (title.includes("tough") || title.includes("pro") || title.includes("engineering")) {
    suggestions.push({
      type: "project_suggestion",
      icon: "🔧",
      text: "Functional parts & tool holders",
      link: { url: `/?material=${encodeURIComponent(filament.material || "")}&tag=functional`, label: "View projects" }
    });
  }

  if (title.includes("silk") || title.includes("glitter") || title.includes("galaxy")) {
    suggestions.push({
      type: "project_suggestion",
      icon: "🎨",
      text: "Decorative vases & display pieces",
      link: { url: `/?material=${encodeURIComponent(filament.material || "")}&tag=decorative`, label: "View projects" }
    });
  }

  if (title.includes("glow") || material.includes("glow")) {
    suggestions.push({
      type: "project_suggestion",
      icon: "✨",
      text: "Night lights & Halloween decorations",
      link: { url: `/?material=${encodeURIComponent(filament.material || "")}&tag=glow`, label: "View projects" }
    });
  }

  if (material.includes("wood") || filament.wood_powder_percentage) {
    suggestions.push({
      type: "project_suggestion",
      icon: "🪵",
      text: "Rustic decor & planters",
      link: { url: `/?material=Wood%20PLA`, label: "View projects" }
    });
  }

  if (material.includes("tpu") || material.includes("tpe")) {
    suggestions.push({
      type: "project_suggestion",
      icon: "📱",
      text: "Phone cases & protective gear",
      link: { url: `/?material=TPU`, label: "View projects" }
    });
  }

  if (material.includes("cf") || filament.carbon_fiber_percentage) {
    suggestions.push({
      type: "project_suggestion",
      icon: "🚁",
      text: "Drone frames & RC parts",
      link: { url: `/?composite=carbon_fiber`, label: "View projects" }
    });
  }

  // Use industry_tags if available
  if (filament.industry_tags?.includes("automotive")) {
    suggestions.push({
      type: "project_suggestion",
      icon: "🚗",
      text: "Automotive interior parts",
      link: { url: `/?tag=automotive`, label: "View projects" }
    });
  }

  return suggestions.slice(0, 3); // Max 3 suggestions
}

// Seasonal recommendations based on current month
export function getSeasonalRecommendations(): { materials: string[]; message: string; icon: string } {
  const month = new Date().getMonth();

  // October - Halloween
  if (month === 9) {
    return {
      materials: ["glow", "orange", "black", "purple"],
      message: "Popular for Halloween projects",
      icon: "🎃"
    };
  }

  // November/December - Holiday season
  if (month === 10 || month === 11) {
    return {
      materials: ["red", "green", "gold", "silver", "white", "silk"],
      message: "Popular for holiday gifts",
      icon: "🎄"
    };
  }

  // Summer months
  if (month >= 5 && month <= 7) {
    return {
      materials: ["asa", "petg", "uv"],
      message: "Great for summer outdoor prints",
      icon: "☀️"
    };
  }

  // Spring - garden season
  if (month >= 2 && month <= 4) {
    return {
      materials: ["petg", "abs", "wood"],
      message: "Perfect for garden projects",
      icon: "🌱"
    };
  }

  return { materials: [], message: "", icon: "" };
}

// Context badges (trending, new, seasonal)
export function getContextBadges(
  filament: Filament,
  trendingMaterials: TrendingMaterial[]
): DynamicRecommendation[] {
  const badges: DynamicRecommendation[] = [];
  const material = filament.material?.toLowerCase() || "";
  const title = filament.product_title?.toLowerCase() || "";

  // Check if trending
  const trendingMatch = trendingMaterials.find(t =>
    t.material_filter && (
      material.includes(t.material_filter.toLowerCase()) ||
      title.includes(t.material_filter.toLowerCase())
    )
  );

  if (trendingMatch && !trendingMatch.is_prediction) {
    badges.push({
      type: "badge",
      icon: "🔥",
      text: "Trending this month",
      subtext: trendingMatch.why_now || `+${trendingMatch.search_increase_percent}% searches`,
      severity: "info"
    });
  }

  // Check if new arrival (created within last 30 days)
  if (filament.created_at) {
    const createdDate = new Date(filament.created_at);
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    if (createdDate > thirtyDaysAgo) {
      badges.push({
        type: "badge",
        icon: "✨",
        text: "New to FilaScope",
        severity: "info"
      });
    }
  }

  // Seasonal match
  const seasonalRecs = getSeasonalRecommendations();
  if (seasonalRecs.materials.length > 0) {
    const isSeasonalMatch = seasonalRecs.materials.some(m =>
      material.includes(m) || title.includes(m)
    );

    if (isSeasonalMatch && seasonalRecs.message) {
      badges.push({
        type: "badge",
        icon: seasonalRecs.icon,
        text: seasonalRecs.message,
        severity: "info"
      });
    }
  }

  return badges;
}

// Main function to generate all intelligent content
export function generateIntelligentContent(
  filament: Filament,
  printer: Printer | null,
  hotend: Accessory | null,
  trendingMaterials: TrendingMaterial[]
): IntelligentContent {
  return {
    dynamicPerfectFor: getPropertyBasedRecommendations(filament),
    printerWarnings: getPrinterWarnings(filament, printer, hotend),
    projectSuggestions: getProjectSuggestions(filament),
    contextBadges: getContextBadges(filament, trendingMaterials)
  };
}
