export interface MaterialValueProposition {
  icon: string;
  headline: string;
  description: string;
  perfectFor: string[];
  notIdealFor: string[];
  compareWith?: string;
}

// Material-specific value propositions
const MATERIAL_PROPOSITIONS: Record<string, MaterialValueProposition> = {
  // PLA Variants
  "PLA": {
    icon: "🎨",
    headline: "The Beginner-Friendly All-Purpose Material",
    description: "PLA is the most popular 3D printing material, known for easy printing, minimal warping, and vibrant colors. Made from renewable resources, it's perfect for learning and decorative prints.",
    perfectFor: ["Decorative items", "Prototypes", "Miniatures", "Gifts", "Beginner projects"],
    notIdealFor: ["Functional parts under stress", "Outdoor use", "Hot environments (>50°C)"],
    compareWith: "PETG"
  },
  "PLA+": {
    icon: "💪",
    headline: "Enhanced PLA for Functional Parts",
    description: "PLA+ offers improved impact resistance and layer adhesion compared to standard PLA while maintaining easy printability. A great middle-ground between ease and durability.",
    perfectFor: ["Tool holders", "Brackets", "Functional prototypes", "Mechanical parts"],
    notIdealFor: ["Outdoor use", "High-heat applications (>55°C)", "Maximum strength requirements"],
    compareWith: "PLA"
  },
  "PLA TOUGH": {
    icon: "💪",
    headline: "Built for Functional Parts & Mechanical Loads",
    description: "PLA Tough provides up to 5x higher impact resistance than standard PLA while maintaining easy printability. It bridges the gap between basic PLA and engineering materials.",
    perfectFor: ["Tool holders", "Brackets", "Gears", "Functional prototypes", "Snap-fit parts"],
    notIdealFor: ["Outdoor use", "High-heat applications (>50°C)", "Chemical exposure"],
    compareWith: "PLA"
  },
  "PLA-SILK": {
    icon: "✨",
    headline: "Stunning Metallic Sheen Finish",
    description: "PLA Silk features a distinctive glossy, metallic shimmer that catches the light beautifully. Perfect for display pieces and decorative prints that need to stand out.",
    perfectFor: ["Display pieces", "Gifts", "Vases", "Jewelry", "Decorative art"],
    notIdealFor: ["Functional parts", "Outdoor use", "High-detail models"],
    compareWith: "PLA"
  },
  "PLA-WOOD": {
    icon: "🌲",
    headline: "Natural Wood-Like Aesthetic",
    description: "Wood-filled PLA contains real wood fibers that create an authentic wooden appearance and texture. Can be sanded, stained, and finished like real wood.",
    perfectFor: ["Decorative items", "Cosplay props", "Art pieces", "Furniture accents", "Organic-looking prints"],
    notIdealFor: ["Mechanical parts", "Outdoor use", "High-strength applications"],
    compareWith: "PLA"
  },
  "PLA-CF": {
    icon: "🏎️",
    headline: "Lightweight Stiffness with Carbon Fiber",
    description: "Carbon fiber reinforced PLA offers significantly increased rigidity and reduced weight. Ideal for structural parts where stiffness matters more than flexibility.",
    perfectFor: ["Drone frames", "RC parts", "Structural brackets", "Stiff prototypes"],
    notIdealFor: ["Parts requiring flexibility", "Beginners", "Brass nozzles (abrasive)"],
    compareWith: "PETG-CF"
  },
  "PLA-GLOW": {
    icon: "🌟",
    headline: "Glow-in-the-Dark Effects",
    description: "Glow-in-the-dark PLA absorbs light and emits a lasting glow. Perfect for decorative items, signage, and novelty prints that need to be visible in low light.",
    perfectFor: ["Night lights", "Signage", "Decorations", "Kids' toys", "Safety markers"],
    notIdealFor: ["Functional parts", "Detailed prints", "Brass nozzles (abrasive)"],
    compareWith: "PLA"
  },

  // PETG Variants
  "PETG": {
    icon: "🛡️",
    headline: "Balanced Strength & Ease of Use",
    description: "PETG offers superior strength and heat resistance compared to PLA while remaining easy to print. The go-to choice for functional parts that need durability without the difficulty of engineering materials.",
    perfectFor: ["Mechanical parts", "Outdoor use", "Food-safe containers", "Living hinges"],
    notIdealFor: ["Extremely high-detail models", "Engineering-grade applications", "Very high temperatures"],
    compareWith: "PLA"
  },
  "PETG-CF": {
    icon: "⚡",
    headline: "Carbon-Reinforced Durability",
    description: "Carbon fiber reinforced PETG combines the ease of PETG printing with enhanced stiffness and dimensional stability. Excellent for functional parts requiring both strength and rigidity.",
    perfectFor: ["Structural parts", "Tooling", "Jigs and fixtures", "Drone components"],
    notIdealFor: ["Flexible parts", "Beginners", "Brass nozzles (abrasive)"],
    compareWith: "PETG"
  },

  // ABS Variants
  "ABS": {
    icon: "🏭",
    headline: "Industrial-Grade Strength & Heat Resistance",
    description: "ABS is a tough engineering thermoplastic that withstands high temperatures and impacts. The same material used in LEGO bricks. Requires enclosed printer and experience to manage warping.",
    perfectFor: ["Automotive parts", "Electronic housings", "Tooling", "High-heat applications"],
    notIdealFor: ["Beginners", "Open-frame printers", "Detailed miniatures", "Unventilated spaces"],
    compareWith: "ASA"
  },

  // ASA Variants
  "ASA": {
    icon: "☀️",
    headline: "UV-Resistant for Outdoor Applications",
    description: "ASA offers ABS-like properties with excellent UV and weather resistance. The ideal choice for parts that will be exposed to sunlight and outdoor conditions long-term.",
    perfectFor: ["Outdoor enclosures", "Garden fixtures", "Automotive parts", "Signage"],
    notIdealFor: ["Beginners", "Open-frame printers", "Unventilated spaces"],
    compareWith: "ABS"
  },
  "ASA-CF": {
    icon: "🌞",
    headline: "UV-Resistant Carbon Fiber Composite",
    description: "Carbon fiber reinforced ASA provides outstanding outdoor durability with enhanced stiffness. Perfect for demanding outdoor applications requiring structural rigidity.",
    perfectFor: ["Outdoor structural parts", "Automotive components", "Drone frames for outdoor use"],
    notIdealFor: ["Beginners", "Flexible parts", "Brass nozzles (abrasive)"],
    compareWith: "ASA"
  },

  // TPU/Flexible
  "TPU": {
    icon: "🔄",
    headline: "Rubber-Like Flexibility & Durability",
    description: "TPU is a flexible, elastic material that mimics rubber properties. Ideal for parts that need to bend, compress, or absorb impact without breaking.",
    perfectFor: ["Phone cases", "Gaskets", "Seals", "Wearables", "Grips", "Vibration dampeners"],
    notIdealFor: ["Rigid structural parts", "High-speed printing", "Bowden extruders"],
    compareWith: "TPE"
  },
  "TPE": {
    icon: "🔄",
    headline: "Soft & Flexible Thermoplastic",
    description: "TPE offers rubber-like flexibility with varying shore hardness options. Great for soft-touch applications and parts requiring elastic properties.",
    perfectFor: ["Soft grips", "Flexible hinges", "Cushioning", "Wearables"],
    notIdealFor: ["Structural parts", "High-speed printing", "Bowden setups"],
    compareWith: "TPU"
  },

  // Nylon/PA Variants
  "NYLON": {
    icon: "⚙️",
    headline: "Engineering-Grade Wear Resistance",
    description: "Nylon (PA) is an engineering thermoplastic known for exceptional wear resistance, low friction, and impact strength. The go-to material for gears, bearings, and mechanical parts.",
    perfectFor: ["Gears", "Bearings", "Hinges", "Mechanical parts", "Wear components"],
    notIdealFor: ["Beginners", "Humid environments without drying", "Open-frame printers"],
    compareWith: "PETG"
  },
  "PA": {
    icon: "⚙️",
    headline: "Engineering-Grade Wear Resistance",
    description: "Polyamide (PA/Nylon) offers exceptional mechanical properties including wear resistance, impact strength, and flexibility. Essential for demanding mechanical applications.",
    perfectFor: ["Gears", "Bearings", "Hinges", "Snap-fits", "Industrial parts"],
    notIdealFor: ["Beginners", "Humid storage", "Open printers without enclosure"],
    compareWith: "PETG"
  },
  "PA-CF": {
    icon: "🔧",
    headline: "Carbon-Reinforced Engineering Nylon",
    description: "Carbon fiber reinforced Nylon combines exceptional wear resistance with increased stiffness and dimensional stability. An industrial-grade material for demanding applications.",
    perfectFor: ["Tooling", "Jigs", "End-use parts", "High-performance gears", "Structural components"],
    notIdealFor: ["Beginners", "Brass nozzles", "Simple prototypes"],
    compareWith: "PA"
  },
  "PA-GF": {
    icon: "🔩",
    headline: "Glass-Reinforced Engineering Nylon",
    description: "Glass fiber reinforced Nylon offers excellent stiffness and heat resistance while being less abrasive than carbon fiber variants. Great balance of properties for industrial use.",
    perfectFor: ["Structural parts", "Heat-resistant components", "Industrial applications"],
    notIdealFor: ["Beginners", "Brass nozzles", "Flexible applications"],
    compareWith: "PA-CF"
  },

  // PC Variants
  "PC": {
    icon: "🔥",
    headline: "Maximum Strength & Heat Resistance",
    description: "Polycarbonate is one of the strongest printable thermoplastics, offering exceptional impact resistance and high heat deflection temperature. Used in demanding industrial applications.",
    perfectFor: ["High-impact parts", "Heat-resistant components", "Transparent parts", "Industrial tooling"],
    notIdealFor: ["Beginners", "Open-frame printers", "Low-cost applications"],
    compareWith: "ABS"
  },
  "PC-CF": {
    icon: "💎",
    headline: "Premium Carbon-Reinforced Polycarbonate",
    description: "Carbon fiber reinforced PC delivers exceptional strength, stiffness, and heat resistance. A premium engineering material for the most demanding applications.",
    perfectFor: ["High-performance parts", "Tooling", "Aerospace components", "Racing applications"],
    notIdealFor: ["Beginners", "Budget setups", "Brass nozzles"],
    compareWith: "PC"
  },

  // High-Performance Materials
  "PEEK": {
    icon: "🚀",
    headline: "Aerospace-Grade Performance",
    description: "PEEK is a high-performance thermoplastic used in aerospace and medical applications. Offers extreme heat resistance, chemical resistance, and mechanical properties.",
    perfectFor: ["Aerospace parts", "Medical devices", "Chemical equipment", "Extreme environments"],
    notIdealFor: ["Most users", "Standard printers", "Cost-sensitive projects"],
    compareWith: "PEI"
  },
  "PEI": {
    icon: "🚀",
    headline: "High-Performance Engineering Thermoplastic",
    description: "PEI (Ultem) offers excellent heat resistance, strength, and chemical resistance. A step below PEEK but more accessible for demanding engineering applications.",
    perfectFor: ["Aerospace components", "Medical devices", "High-temp applications", "Chemical resistance"],
    notIdealFor: ["Standard printers", "Beginners", "Budget projects"],
    compareWith: "PEEK"
  },
  "PEKK": {
    icon: "🛰️",
    headline: "Advanced Aerospace Thermoplastic",
    description: "PEKK offers properties similar to PEEK with easier processing. Used in aerospace and high-performance applications requiring extreme durability.",
    perfectFor: ["Aerospace parts", "High-temperature applications", "Chemical-resistant parts"],
    notIdealFor: ["Standard printers", "Beginners", "Cost-sensitive applications"],
    compareWith: "PEEK"
  },

  // Support Materials
  "PVA": {
    icon: "💧",
    headline: "Water-Soluble Support Material",
    description: "PVA dissolves in water, making it the perfect support material for complex prints with overhangs. Simply place your print in water and supports dissolve away.",
    perfectFor: ["Complex overhangs", "Internal cavities", "Multi-material prints", "Clean support removal"],
    notIdealFor: ["Structural parts", "Humid environments", "Single-material prints"],
    compareWith: "HIPS"
  },
  "HIPS": {
    icon: "🧩",
    headline: "Limonene-Soluble Support Material",
    description: "HIPS dissolves in limonene, making it an excellent support material for ABS prints. More stable than PVA in humid conditions.",
    perfectFor: ["ABS support structures", "Complex geometries", "Clean support removal"],
    notIdealFor: ["Primary print material", "PLA/PETG prints", "Water-based removal"],
    compareWith: "PVA"
  },

  // Specialty Materials
  "PP": {
    icon: "📦",
    headline: "Chemical-Resistant Living Hinges",
    description: "Polypropylene excels at living hinges and chemical resistance. The same material used in food containers and bottle caps.",
    perfectFor: ["Living hinges", "Chemical containers", "Food-safe applications", "Flexible snap-fits"],
    notIdealFor: ["Beginners", "Adhesion-critical prints", "Detailed models"],
    compareWith: "PETG"
  },
  "CPE": {
    icon: "🧪",
    headline: "Chemical-Resistant Engineering Plastic",
    description: "CPE offers excellent chemical resistance and mechanical properties. A more printable alternative to PP for chemical-resistant applications.",
    perfectFor: ["Chemical containers", "Laboratory equipment", "Industrial parts"],
    notIdealFor: ["Beginners", "Decorative prints", "High-heat applications"],
    compareWith: "PETG"
  },
};

// Variant detection patterns
const VARIANT_PATTERNS: Array<{ pattern: RegExp; key: string }> = [
  { pattern: /tough\+?/i, key: "PLA TOUGH" },
  { pattern: /pla\s*\+/i, key: "PLA+" },
  { pattern: /silk/i, key: "PLA-SILK" },
  { pattern: /wood/i, key: "PLA-WOOD" },
  { pattern: /glow/i, key: "PLA-GLOW" },
  { pattern: /carbon|cf\b/i, key: "-CF" },
  { pattern: /glass|gf\b/i, key: "-GF" },
];

/**
 * Get the value proposition for a given material type and product title
 */
export function getMaterialValueProposition(
  material: string | null | undefined,
  productTitle?: string | null
): MaterialValueProposition {
  if (!material) {
    return getGenericProposition();
  }

  const materialUpper = material.toUpperCase().trim();
  const titleUpper = (productTitle || "").toUpperCase();

  // Check for specific variants first using product title
  for (const { pattern, key } of VARIANT_PATTERNS) {
    if (pattern.test(titleUpper) || pattern.test(materialUpper)) {
      // For CF/GF suffixes, combine with base material
      if (key.startsWith("-")) {
        const baseMaterial = materialUpper.replace(/[-\s]*(CF|GF|CARBON|GLASS).*$/i, "").trim();
        const compositeKey = `${baseMaterial}${key}`;
        if (MATERIAL_PROPOSITIONS[compositeKey]) {
          return MATERIAL_PROPOSITIONS[compositeKey];
        }
      } else if (MATERIAL_PROPOSITIONS[key]) {
        return MATERIAL_PROPOSITIONS[key];
      }
    }
  }

  // Try exact material match
  if (MATERIAL_PROPOSITIONS[materialUpper]) {
    return MATERIAL_PROPOSITIONS[materialUpper];
  }

  // Try base material (without variant suffix)
  const baseMaterial = materialUpper.replace(/[-\s]*(PLUS|\+|PRO|BASIC|STANDARD|LITE|MAX)$/i, "").trim();
  if (baseMaterial !== materialUpper && MATERIAL_PROPOSITIONS[baseMaterial]) {
    return MATERIAL_PROPOSITIONS[baseMaterial];
  }

  // Handle Nylon/PA equivalence
  if (materialUpper.includes("NYLON") || materialUpper === "PA") {
    return MATERIAL_PROPOSITIONS["NYLON"] || MATERIAL_PROPOSITIONS["PA"];
  }

  return getGenericProposition();
}

function getGenericProposition(): MaterialValueProposition {
  return {
    icon: "🎯",
    headline: "Specialized 3D Printing Material",
    description: "This material has been formulated for specific printing applications. Review the specifications below to determine if it fits your project needs.",
    perfectFor: ["See technical specifications below"],
    notIdealFor: ["Review temperature and strength requirements"],
  };
}

/**
 * Get the comparison material key for navigation
 */
export function getComparisonMaterial(material: string | null | undefined): string | null {
  const proposition = getMaterialValueProposition(material, null);
  return proposition.compareWith || null;
}
