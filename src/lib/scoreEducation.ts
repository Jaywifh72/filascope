/**
 * Score Education Service
 * Provides tooltip definitions, recommendation logic, and educational content
 */

// Tooltip definitions for score-related terms
export const SCORE_TOOLTIPS: Record<string, { title: string; description: string }> = {
  // Score types
  ease_of_printing: {
    title: "Ease of Printing",
    description: "Measures how forgiving this filament is during printing. Factors include warping tendency, bed adhesion, temperature sensitivity, and print success rate."
  },
  strength_index: {
    title: "Strength Index",
    description: "Combines tensile strength, layer adhesion, impact resistance, and flexural strength into a single metric. Higher = stronger parts."
  },
  value_score: {
    title: "Value Score",
    description: "Price-to-performance ratio considering material quality, reliability, and cost per gram. Higher = better bang for your buck."
  },
  
  // Technical terms
  layer_adhesion: {
    title: "Layer Adhesion",
    description: "How well printed layers bond together during printing. Poor adhesion leads to weak, delaminating parts."
  },
  tensile_strength: {
    title: "Tensile Strength",
    description: "Maximum stress the material can withstand while being stretched before breaking. Measured in MPa."
  },
  warping: {
    title: "Warping Tendency",
    description: "How likely the material is to curl or warp during printing due to uneven cooling and internal stresses."
  },
  bed_adhesion: {
    title: "Bed Adhesion",
    description: "How well the first layer sticks to the print bed. Poor adhesion causes prints to detach mid-print."
  },
  temperature_sensitivity: {
    title: "Temperature Sensitivity",
    description: "How precisely you need to control temperatures. Sensitive materials need exact temps for good results."
  },
  percentile: {
    title: "Percentile Ranking",
    description: "Shows where this filament ranks compared to others in its category. Top 10% means it beats 90% of similar materials."
  },
  print_success_rate: {
    title: "Print Success Rate",
    description: "Percentage of prints that complete successfully without failures, based on community data and testing."
  },
  dimensional_accuracy: {
    title: "Dimensional Accuracy",
    description: "How closely printed parts match their designed dimensions. Important for functional/mechanical parts."
  },
  impact_resistance: {
    title: "Impact Resistance",
    description: "Ability to absorb energy from impacts without breaking. Critical for parts that may be dropped or stressed."
  },
};

// Score interpretation by use case
export const SCORE_INTERPRETATION_GUIDE = {
  decorative: {
    title: "Decorative Prints",
    description: "Figurines, art, display pieces",
    priorities: [
      { score: "ease_of_printing", importance: "high", reason: "Finish quality matters, frustration-free printing ideal" },
      { score: "value_score", importance: "medium", reason: "Often making multiple items, cost adds up" },
      { score: "strength_index", importance: "low", reason: "Parts aren't stressed, strength less critical" },
    ],
    tips: [
      "Look for Ease 8+ for smooth prints",
      "Specialty finishes (silk, matte) add visual appeal",
      "Consider color accuracy if matching a reference",
    ],
  },
  functional: {
    title: "Functional Parts",
    description: "Mechanical parts, tools, fixtures",
    priorities: [
      { score: "strength_index", importance: "high", reason: "Parts must withstand stress and loads" },
      { score: "ease_of_printing", importance: "medium", reason: "Dimensional accuracy needs good printability" },
      { score: "value_score", importance: "low", reason: "Reliability trumps cost for critical parts" },
    ],
    tips: [
      "Strength 7+ recommended for load-bearing parts",
      "Consider material-specific properties (heat resistance, flexibility)",
      "PETG/ABS/ASA for outdoor or high-temp applications",
    ],
  },
  prototyping: {
    title: "Rapid Prototyping",
    description: "Quick iterations, test prints, mockups",
    priorities: [
      { score: "value_score", importance: "high", reason: "Many iterations means material cost matters" },
      { score: "ease_of_printing", importance: "high", reason: "Fast, reliable prints for quick feedback" },
      { score: "strength_index", importance: "low", reason: "Prototypes rarely need final part strength" },
    ],
    tips: [
      "PLA is ideal for most prototyping",
      "Use lower infill to save material",
      "Prioritize speed over surface finish",
    ],
  },
  production: {
    title: "Production/Batch Printing",
    description: "Consistent parts for sale or assembly",
    priorities: [
      { score: "ease_of_printing", importance: "high", reason: "Consistency is critical for batches" },
      { score: "strength_index", importance: "high", reason: "Every part must meet quality standards" },
      { score: "value_score", importance: "medium", reason: "Cost matters at scale but quality first" },
    ],
    tips: [
      "All scores 7+ recommended for production",
      "Test batch before committing to full run",
      "Consider brand consistency across spools",
    ],
  },
};

// Contextual recommendations based on scores
export interface ScoreRecommendation {
  type: "success" | "warning" | "suggestion" | "info";
  icon: string;
  title: string;
  description: string;
  linkMaterial?: string;
  linkUrl?: string;
}

export function getScoreRecommendations(
  easeScore: number | null,
  strengthScore: number | null,
  valueScore: number | null,
  material: string | null
): ScoreRecommendation[] {
  const recommendations: ScoreRecommendation[] = [];
  
  // All scores excellent
  if (easeScore && strengthScore && valueScore &&
      easeScore >= 8 && strengthScore >= 7 && valueScore >= 7) {
    recommendations.push({
      type: "success",
      icon: "⭐",
      title: "Top Performer!",
      description: "This filament excels across all metrics. Great all-around choice for any project.",
    });
  }
  
  // Perfect for beginners
  if (easeScore && easeScore >= 9) {
    recommendations.push({
      type: "success",
      icon: "✓",
      title: "Perfect for Beginners",
      description: "Extremely forgiving and easy to print. Ideal for new users or hassle-free printing.",
    });
  }
  
  // Low strength warning
  if (strengthScore && strengthScore < 4.5 && material) {
    const baseMaterial = material.split('-')[0].split(' ')[0].toUpperCase();
    if (['PLA', 'PLA+'].includes(baseMaterial)) {
      recommendations.push({
        type: "info",
        icon: "💡",
        title: "Standard PLA Strength",
        description: "PLA is great for decorative prints. For functional parts, consider PETG or Nylon.",
        linkMaterial: "PETG",
        linkUrl: "/finder?material=PETG",
      });
    } else {
      recommendations.push({
        type: "suggestion",
        icon: "💪",
        title: "Need Stronger?",
        description: "For high-stress applications, consider reinforced materials like PA-CF or PC.",
        linkUrl: "/finder?material=PA-CF",
      });
    }
  }
  
  // Challenging material
  if (easeScore && easeScore < 5) {
    recommendations.push({
      type: "warning",
      icon: "⚠️",
      title: "Challenging Material",
      description: "Recommended for experienced users. May require enclosure, precise temps, or special setup.",
    });
  }
  
  // Premium price
  if (valueScore && valueScore < 4.5) {
    const useCases = material?.includes('CF') ? 'high-performance applications' :
                    material?.includes('PC') ? 'heat-resistant parts' :
                    material?.includes('TPU') ? 'flexible applications' :
                    'specialty applications';
    recommendations.push({
      type: "info",
      icon: "💎",
      title: "Premium Material",
      description: `Higher price point, but worth it for ${useCases} where quality matters.`,
    });
  }
  
  // Great value
  if (valueScore && valueScore >= 8.5) {
    recommendations.push({
      type: "success",
      icon: "💰",
      title: "Excellent Value",
      description: "Outstanding price-to-performance ratio. Great for budget-conscious printing.",
    });
  }
  
  return recommendations;
}

// Calculate print success probability
export interface SuccessPrediction {
  overall: number;
  withPrinter: number | null;
  factors: Array<{
    type: "positive" | "negative" | "warning";
    text: string;
  }>;
  printerBonus: string | null;
}

export function calculatePrintSuccess(
  easeScore: number | null,
  strengthScore: number | null,
  valueScore: number | null,
  printerCompatibility: {
    is_supported: boolean;
    ease_rating: string;
    warnings: string[];
  } | null
): SuccessPrediction {
  const factors: SuccessPrediction["factors"] = [];
  
  // Base probability from ease score (60% weight)
  let baseProbability = 70;
  if (easeScore) {
    baseProbability = Math.min(99, 50 + (easeScore * 5));
    
    if (easeScore >= 9) {
      factors.push({ type: "positive", text: `Excellent ease of printing (${easeScore.toFixed(1)}/10)` });
    } else if (easeScore >= 7) {
      factors.push({ type: "positive", text: `Good printability (${easeScore.toFixed(1)}/10)` });
    } else if (easeScore < 5) {
      factors.push({ type: "warning", text: `Challenging material may require tuning` });
      baseProbability -= 10;
    }
  }
  
  // Printer compatibility bonus
  let printerProbability: number | null = null;
  let printerBonus: string | null = null;
  
  if (printerCompatibility) {
    if (printerCompatibility.is_supported) {
      printerProbability = baseProbability;
      
      if (printerCompatibility.ease_rating === "Easy") {
        printerProbability = Math.min(99, printerProbability + 8);
        factors.push({ type: "positive", text: "Printer fully supports required temperatures" });
        printerBonus = "+8% from printer compatibility";
      } else if (printerCompatibility.ease_rating === "Medium") {
        printerProbability = Math.min(99, printerProbability + 3);
        factors.push({ type: "positive", text: "Printer compatible with some considerations" });
        printerBonus = "+3% from printer compatibility";
      } else {
        printerProbability = Math.max(40, printerProbability - 10);
        factors.push({ type: "warning", text: "Printing may be challenging on this printer" });
        printerBonus = "-10% due to printer limitations";
      }
      
      // Add relevant warnings
      if (printerCompatibility.warnings.length > 0) {
        const keyWarning = printerCompatibility.warnings[0];
        if (keyWarning.toLowerCase().includes('enclosure')) {
          factors.push({ type: "warning", text: "Consider adding enclosure for best results" });
        } else if (keyWarning.toLowerCase().includes('nozzle')) {
          factors.push({ type: "warning", text: "Consider hardened nozzle for extended use" });
        }
      }
    } else {
      printerProbability = 20;
      factors.push({ type: "negative", text: "Printer may not support this material" });
      printerBonus = "Limited compatibility";
    }
  }
  
  return {
    overall: Math.round(baseProbability),
    withPrinter: printerProbability ? Math.round(printerProbability) : null,
    factors,
    printerBonus,
  };
}

// Coach marks content
export type CoachMarkPosition = "top" | "bottom" | "left";

export const COACH_MARKS: Array<{
  id: string;
  target: string;
  title: string;
  description: string;
  position: CoachMarkPosition;
}> = [
  {
    id: "color-coding",
    target: "[data-coach='score-card']",
    title: "Color-Coded Scores",
    description: "🟢 Green = Excellent | 🔵 Cyan = Good | 🟡 Amber = Fair | 🔴 Red = Needs Context",
    position: "bottom",
  },
  {
    id: "methodology",
    target: "[data-coach='methodology-button']",
    title: "Score Details",
    description: "Click the ℹ️ icon to see exactly how each score is calculated with interactive breakdowns.",
    position: "left",
  },
  {
    id: "comparison",
    target: "[data-coach='comparison-section']",
    title: "Material Comparison",
    description: "See how this filament ranks against similar materials in its category.",
    position: "top",
  },
  {
    id: "recommendations",
    target: "[data-coach='recommendations']",
    title: "Smart Suggestions",
    description: "Get personalized tips based on your scores and use case.",
    position: "top",
  },
];
