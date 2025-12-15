export interface Differentiator {
  icon: string;
  label: string;
}

export interface NotIdealForItem {
  issue: string;
  reason: string;
}

export interface FamilyInfo {
  familyId: string;
  familyName: string;
  variantPosition: string;
}

export interface MaterialValueProposition {
  icon: string;
  headline: string;
  description: string;
  perfectFor: string[];
  notIdealFor: NotIdealForItem[];
  differentiators: Differentiator[];
  familyInfo?: FamilyInfo;
  compareWith?: string;
}

const MATERIAL_PROPOSITIONS: Record<string, MaterialValueProposition> = {
  "PLA": {
    icon: "🎨",
    headline: "The Beginner-Friendly All-Purpose Material",
    description: "PLA is the most popular 3D printing material with a low glass transition of 55-60°C and minimal warping. Prints reliably at 190-220°C without a heated bed.",
    perfectFor: ["Decorative items", "Prototypes", "Miniatures", "Gifts", "Low-stress parts"],
    notIdealFor: [
      { issue: "Outdoor use", reason: "UV degrades material over 6-12 months" },
      { issue: "High-heat applications", reason: "Softens above 55°C" },
      { issue: "Mechanical stress", reason: "Brittle under impact loads" }
    ],
    differentiators: [
      { icon: "🌱", label: "Bio-Based Material" },
      { icon: "🎯", label: "Zero Warping" },
      { icon: "🌈", label: "Widest Color Range" }
    ],
    familyInfo: { familyId: "pla", familyName: "PLA Family", variantPosition: "The standard, easy-to-print base material" },
    compareWith: "PETG"
  },
  "PLA+": {
    icon: "💪",
    headline: "Enhanced Strength While Staying Easy to Print",
    description: "PLA+ offers 2-3x higher impact resistance than standard PLA (typically 1,800 J/m² vs 700 J/m²) while maintaining the same easy printability.",
    perfectFor: ["Functional prototypes", "Tool handles", "Brackets", "Hobby parts"],
    notIdealFor: [
      { issue: "Outdoor use", reason: "Still UV-sensitive like standard PLA" },
      { issue: "High-heat environments", reason: "Softens above 60°C" },
      { issue: "Heavy mechanical loads", reason: "Use PLA Tough+ for higher impact needs" }
    ],
    differentiators: [
      { icon: "💪", label: "2-3x Impact Resistance" },
      { icon: "🎨", label: "Easy as Standard PLA" },
      { icon: "💰", label: "Minimal Price Premium" }
    ],
    familyInfo: { familyId: "pla", familyName: "PLA Family", variantPosition: "Enhanced variant with improved toughness" },
    compareWith: "PLA"
  },
  "PLA TOUGH": {
    icon: "💪",
    headline: "Built for Functional Parts & Mechanical Loads",
    description: "PLA Tough+ achieves impact strength of 3,500 J/m² — 5x higher than standard PLA's 700 J/m². Bridges the gap between basic PLA and engineering materials.",
    perfectFor: ["Tool holders", "Brackets", "Gears", "Functional prototypes", "Snap-fit parts"],
    notIdealFor: [
      { issue: "Outdoor use", reason: "UV degrades material over 6-12 months" },
      { issue: "High-heat applications", reason: "Softens above 55°C like standard PLA" },
      { issue: "Chemical exposure", reason: "Not resistant to solvents or acids" }
    ],
    differentiators: [
      { icon: "💪", label: "5x Impact Resistance" },
      { icon: "🎨", label: "Easy to Print" },
      { icon: "💰", label: "PLA Price Point" }
    ],
    familyInfo: { familyId: "pla", familyName: "PLA Family", variantPosition: "Maximum toughness variant for functional parts" },
    compareWith: "PLA"
  },
  "PLA-SILK": {
    icon: "✨",
    headline: "Stunning Metallic Sheen Finish",
    description: "Silk PLA contains special additives that create a smooth, shimmering metallic finish. Slightly more flexible than standard PLA with reduced layer visibility.",
    perfectFor: ["Display pieces", "Gifts", "Decorative items", "Vases", "Figurines"],
    notIdealFor: [
      { issue: "Functional parts", reason: "Softer and more flexible than standard PLA" },
      { issue: "Fine details", reason: "Sheen effect can obscure small features" },
      { issue: "Strength-critical parts", reason: "Lower tensile strength than standard PLA" }
    ],
    differentiators: [
      { icon: "✨", label: "Metallic Sheen" },
      { icon: "🎭", label: "Hides Layer Lines" },
      { icon: "🎁", label: "Gift-Ready Finish" }
    ],
    familyInfo: { familyId: "pla", familyName: "PLA Family", variantPosition: "Aesthetic variant with metallic finish" },
    compareWith: "PLA"
  },
  "PLA-WOOD": {
    icon: "🌲",
    headline: "Natural Wood-Like Aesthetic",
    description: "Wood-filled PLA contains 10-40% real wood particles, creating authentic wood grain appearance. Can be sanded and stained like real wood.",
    perfectFor: ["Decorative items", "Furniture accents", "Picture frames", "Organic models"],
    notIdealFor: [
      { issue: "Small nozzles", reason: "Wood particles clog nozzles under 0.5mm" },
      { issue: "Structural parts", reason: "Wood particles reduce strength significantly" },
      { issue: "Moisture exposure", reason: "Wood absorbs water and swells" }
    ],
    differentiators: [
      { icon: "🌲", label: "Real Wood Particles" },
      { icon: "🎨", label: "Sandable & Stainable" },
      { icon: "👃", label: "Natural Wood Scent" }
    ],
    familyInfo: { familyId: "pla", familyName: "PLA Family", variantPosition: "Wood-composite for natural aesthetics" },
    compareWith: "PLA"
  },
  "PLA-CF": {
    icon: "🏎️",
    headline: "Lightweight Stiffness with Carbon Fiber",
    description: "Carbon fiber reinforced PLA offers 2-3x the stiffness of standard PLA with 15-20% weight reduction. Tensile modulus reaches 6,000+ MPa.",
    perfectFor: ["Drone frames", "RC parts", "Structural components", "Stiff brackets"],
    notIdealFor: [
      { issue: "Standard brass nozzles", reason: "Carbon fibers destroy brass in hours" },
      { issue: "Flexible parts", reason: "Very stiff and brittle" },
      { issue: "Layer adhesion needs", reason: "Weaker Z-axis strength than pure PLA" }
    ],
    differentiators: [
      { icon: "🏎️", label: "3x Stiffer" },
      { icon: "🪶", label: "15% Lighter" },
      { icon: "📐", label: "Minimal Warping" }
    ],
    familyInfo: { familyId: "pla", familyName: "PLA Family", variantPosition: "Carbon fiber reinforced for maximum stiffness" },
    compareWith: "PLA"
  },
  "PLA-GLOW": {
    icon: "🌟",
    headline: "Glow-in-the-Dark Effects",
    description: "Glow PLA contains phosphorescent particles that absorb light and emit it in darkness. Glows for 10-30 minutes after charging.",
    perfectFor: ["Night lights", "Decorations", "Kids' toys", "Safety markers"],
    notIdealFor: [
      { issue: "Fine details", reason: "Phosphorescent particles create rough surface" },
      { issue: "Brass nozzles", reason: "Particles cause accelerated wear" },
      { issue: "Strength-critical parts", reason: "Particles reduce structural integrity" }
    ],
    differentiators: [
      { icon: "🌟", label: "Glows 30+ Minutes" },
      { icon: "🔋", label: "Recharges with Any Light" },
      { icon: "🎉", label: "Unique Visual Effect" }
    ],
    familyInfo: { familyId: "pla", familyName: "PLA Family", variantPosition: "Phosphorescent variant for glow effects" },
    compareWith: "PLA"
  },
  "PETG": {
    icon: "🛡️",
    headline: "Balanced Strength & Ease of Use",
    description: "PETG maintains strength up to 70°C glass transition with 3x the impact resistance of PLA. Chemical resistant and food-safe options available.",
    perfectFor: ["Food-safe containers", "Mechanical parts", "Outdoor use", "Living hinges"],
    notIdealFor: [
      { issue: "Long-term UV exposure", reason: "Needs UV coating for multi-year outdoor use" },
      { issue: "High-detail models", reason: "Stringing can affect precision in small features" },
      { issue: "Acetone smoothing", reason: "PETG is acetone-resistant, can't be chemically smoothed" }
    ],
    differentiators: [
      { icon: "🛡️", label: "Chemical Resistant" },
      { icon: "☀️", label: "Outdoor Capable" },
      { icon: "🍽️", label: "Food-Safe Options" }
    ],
    familyInfo: { familyId: "petg", familyName: "PETG Family", variantPosition: "The balanced engineering material" },
    compareWith: "PLA"
  },
  "PETG-CF": {
    icon: "🏎️",
    headline: "Carbon-Reinforced PETG for Stiff Functional Parts",
    description: "Carbon fiber PETG combines PETG's chemical resistance with 50% increased stiffness. Tensile modulus of 4,500+ MPa. Maintains heat resistance up to 75°C.",
    perfectFor: ["Drone components", "Structural brackets", "Industrial tooling", "Load-bearing parts"],
    notIdealFor: [
      { issue: "Brass nozzles", reason: "Carbon fibers destroy brass rapidly" },
      { issue: "Impact absorption", reason: "More brittle than pure PETG" },
      { issue: "Cosmetic parts", reason: "Matte gray finish only, limited colors" }
    ],
    differentiators: [
      { icon: "🏎️", label: "50% Stiffer" },
      { icon: "🔥", label: "75°C Heat Resistance" },
      { icon: "⚗️", label: "Chemical Resistant" }
    ],
    familyInfo: { familyId: "petg", familyName: "PETG Family", variantPosition: "Carbon-reinforced for maximum stiffness" },
    compareWith: "PETG"
  },
  "ABS": {
    icon: "🏭",
    headline: "Industrial-Grade Strength & Heat Resistance",
    description: "ABS withstands temperatures up to 100°C and provides excellent impact resistance. Requires 80-100°C chamber temperature to prevent warping. Acetone-smoothable.",
    perfectFor: ["Automotive parts", "Electronic housings", "Tooling", "High-heat applications"],
    notIdealFor: [
      { issue: "Open-frame printers", reason: "Warps severely without 80-100°C enclosure" },
      { issue: "Unventilated spaces", reason: "Emits styrene fumes during printing" },
      { issue: "Beginners", reason: "Requires temperature control expertise" }
    ],
    differentiators: [
      { icon: "🔥", label: "100°C+ Heat Resistance" },
      { icon: "⚡", label: "Acetone Smoothable" },
      { icon: "🏭", label: "Industry Standard" }
    ],
    familyInfo: { familyId: "abs", familyName: "ABS Family", variantPosition: "The classic industrial thermoplastic" },
    compareWith: "ASA"
  },
  "ASA": {
    icon: "☀️",
    headline: "UV-Resistant for Outdoor Applications",
    description: "ASA is ABS's weather-resistant cousin, withstanding years of direct sunlight without yellowing. Heat resistance up to 100°C. Prints at 240-260°C with enclosed chamber.",
    perfectFor: ["Outdoor signage", "Garden fixtures", "Automotive trim", "Solar mounts"],
    notIdealFor: [
      { issue: "Open-frame printers", reason: "Requires 70-90°C enclosure to prevent warping" },
      { issue: "Beginners", reason: "Similar difficulty to ABS with fumes and warping" },
      { issue: "Food contact", reason: "Not food-safe rated" }
    ],
    differentiators: [
      { icon: "☀️", label: "UV Resistant 5+ Years" },
      { icon: "🔥", label: "100°C Heat Resistance" },
      { icon: "💧", label: "Weather-Proof" }
    ],
    familyInfo: { familyId: "asa", familyName: "ASA Family", variantPosition: "Weather-resistant engineering plastic" },
    compareWith: "ABS"
  },
  "TPU": {
    icon: "🔄",
    headline: "Rubber-Like Flexibility & Durability",
    description: "TPU offers Shore hardness from 85A to 95A, mimicking rubber properties. Excellent abrasion resistance and elasticity. Prints best with direct drive extruders at 220-250°C.",
    perfectFor: ["Phone cases", "Gaskets", "Seals", "Wearables", "Grips"],
    notIdealFor: [
      { issue: "Bowden extruders", reason: "Flexible material buckles in long tubes" },
      { issue: "High-speed printing", reason: "Requires 20-30mm/s for quality" },
      { issue: "Rigid structures", reason: "Flexibility is inherent, can't make stiff parts" }
    ],
    differentiators: [
      { icon: "🔄", label: "500%+ Elongation" },
      { icon: "💪", label: "Abrasion Resistant" },
      { icon: "🔇", label: "Vibration Dampening" }
    ],
    familyInfo: { familyId: "tpu", familyName: "TPU/Flexible Family", variantPosition: "Versatile flexible thermoplastic" },
    compareWith: "TPE"
  },
  "TPE": {
    icon: "🔄",
    headline: "Extra-Soft Flexible Material",
    description: "TPE is softer than TPU with Shore hardness from 70A to 85A. More rubber-like feel but less durable. Prints at 210-240°C with direct drive only.",
    perfectFor: ["Soft grips", "Toys", "Wearables", "Comfort parts"],
    notIdealFor: [
      { issue: "Bowden setups", reason: "Too soft for any tube feeding" },
      { issue: "Durability needs", reason: "Less wear-resistant than TPU" },
      { issue: "Speed printing", reason: "Maximum 15-25mm/s recommended" }
    ],
    differentiators: [
      { icon: "🔄", label: "Extra Soft Feel" },
      { icon: "🧸", label: "Kid-Safe Flexibility" },
      { icon: "👐", label: "Comfortable Touch" }
    ],
    familyInfo: { familyId: "tpu", familyName: "TPU/Flexible Family", variantPosition: "Softer variant for comfort applications" },
    compareWith: "TPU"
  },
  "NYLON": {
    icon: "⚙️",
    headline: "Engineering-Grade Wear Resistance",
    description: "Nylon (PA6/PA12) offers exceptional wear resistance and self-lubricating properties. Tensile strength of 70+ MPa. Requires dry storage and 60-80°C drying before printing.",
    perfectFor: ["Gears", "Bearings", "Bushings", "Hinges", "High-wear parts"],
    notIdealFor: [
      { issue: "Humid environments", reason: "Absorbs moisture and loses properties" },
      { issue: "Beginners", reason: "Requires enclosure and moisture management" },
      { issue: "Dimensional precision", reason: "Shrinks 1.5-2% during cooling" }
    ],
    differentiators: [
      { icon: "⚙️", label: "Self-Lubricating" },
      { icon: "🔧", label: "Extreme Wear Resistance" },
      { icon: "💪", label: "70+ MPa Tensile" }
    ],
    familyInfo: { familyId: "nylon", familyName: "Nylon/PA Family", variantPosition: "Classic engineering nylon" },
    compareWith: "PETG"
  },
  "PA": {
    icon: "⚙️",
    headline: "Engineering-Grade Wear Resistance",
    description: "PA (Polyamide/Nylon) provides exceptional wear resistance with self-lubricating properties. Tensile strength of 70+ MPa. Requires dry storage and drying before printing.",
    perfectFor: ["Gears", "Bearings", "Bushings", "Hinges", "High-wear parts"],
    notIdealFor: [
      { issue: "Humid storage", reason: "Absorbs 2-8% moisture from air" },
      { issue: "Open-frame printers", reason: "Requires enclosure to prevent warping" },
      { issue: "Dimensional precision", reason: "Shrinks 1.5-2% during cooling" }
    ],
    differentiators: [
      { icon: "⚙️", label: "Self-Lubricating" },
      { icon: "🔧", label: "Extreme Wear Resistance" },
      { icon: "💪", label: "70+ MPa Tensile" }
    ],
    familyInfo: { familyId: "nylon", familyName: "Nylon/PA Family", variantPosition: "Industrial-grade polyamide" },
    compareWith: "PETG"
  },
  "PA-CF": {
    icon: "🚀",
    headline: "Carbon-Reinforced Nylon for Maximum Performance",
    description: "Carbon fiber reinforced PA offers tensile modulus of 10,000+ MPa — matching aluminum stiffness at 1/3 the weight. Heat resistance up to 150°C.",
    perfectFor: ["End-use production parts", "Aerospace components", "Automotive parts", "Tooling"],
    notIdealFor: [
      { issue: "Brass/steel nozzles", reason: "Requires hardened steel or ruby nozzle" },
      { issue: "Basic printers", reason: "Needs 280°C+ hotend and enclosure" },
      { issue: "Budget projects", reason: "Premium pricing of $60-100/kg" }
    ],
    differentiators: [
      { icon: "🚀", label: "Aluminum-Like Stiffness" },
      { icon: "🔥", label: "150°C Heat Resistance" },
      { icon: "🪶", label: "3x Lighter Than Metal" }
    ],
    familyInfo: { familyId: "nylon", familyName: "Nylon/PA Family", variantPosition: "Carbon-reinforced for aerospace-grade performance" },
    compareWith: "NYLON"
  },
  "PA-GF": {
    icon: "🛡️",
    headline: "Glass-Reinforced Nylon for Durability",
    description: "Glass fiber reinforced PA offers 2x the stiffness of pure nylon with better impact resistance than CF variants. Heat resistance up to 140°C.",
    perfectFor: ["Industrial housings", "Structural components", "High-temp parts"],
    notIdealFor: [
      { issue: "Brass nozzles", reason: "Glass fibers are abrasive" },
      { issue: "Lightweight needs", reason: "Heavier than carbon variants" },
      { issue: "Surface finish", reason: "Glass creates rougher texture than CF" }
    ],
    differentiators: [
      { icon: "🛡️", label: "2x Stiffer Than Nylon" },
      { icon: "💰", label: "Cheaper Than CF" },
      { icon: "💪", label: "Better Impact Than CF" }
    ],
    familyInfo: { familyId: "nylon", familyName: "Nylon/PA Family", variantPosition: "Glass-reinforced for balanced performance" },
    compareWith: "PA-CF"
  },
  "PC": {
    icon: "🔥",
    headline: "Maximum Strength & Heat Resistance",
    description: "Polycarbonate offers the highest impact resistance of common filaments — virtually unbreakable. Heat resistance up to 130°C. Requires 110°C bed and 100°C chamber.",
    perfectFor: ["Safety equipment", "High-impact parts", "Electrical housings", "Heat shields"],
    notIdealFor: [
      { issue: "Basic printers", reason: "Requires all-metal hotend and enclosure" },
      { issue: "UV exposure", reason: "Yellows without UV stabilizers" },
      { issue: "Chemical contact", reason: "Attacked by some solvents and fuels" }
    ],
    differentiators: [
      { icon: "🔥", label: "130°C Heat Resistance" },
      { icon: "💪", label: "Highest Impact Strength" },
      { icon: "🔍", label: "Optically Clear Options" }
    ],
    familyInfo: { familyId: "pc", familyName: "Polycarbonate Family", variantPosition: "Ultimate impact-resistant engineering plastic" },
    compareWith: "ABS"
  },
  "PC-CF": {
    icon: "🚀",
    headline: "Carbon-Reinforced Polycarbonate for Aerospace",
    description: "Carbon fiber PC combines polycarbonate's heat resistance with extreme stiffness. Tensile modulus of 8,000+ MPa. Heat resistance up to 145°C.",
    perfectFor: ["Aerospace components", "Automotive parts", "High-temp structural parts"],
    notIdealFor: [
      { issue: "Standard nozzles", reason: "Requires hardened steel or ruby" },
      { issue: "Consumer printers", reason: "Needs 300°C+ all-metal hotend" },
      { issue: "Budget constraints", reason: "Premium material at $80-120/kg" }
    ],
    differentiators: [
      { icon: "🚀", label: "Aerospace-Grade" },
      { icon: "🔥", label: "145°C Stable" },
      { icon: "💎", label: "Premium Performance" }
    ],
    familyInfo: { familyId: "pc", familyName: "Polycarbonate Family", variantPosition: "Carbon-reinforced for extreme applications" },
    compareWith: "PC"
  },
  "PEEK": {
    icon: "🚀",
    headline: "Aerospace-Grade Performance",
    description: "PEEK is the gold standard for high-performance polymers with continuous use temperature of 250°C. Chemical resistant to almost everything. Requires 400°C+ hotend.",
    perfectFor: ["Aerospace components", "Medical implants", "Chemical processing"],
    notIdealFor: [
      { issue: "Consumer printers", reason: "Requires 400°C+ specialized equipment" },
      { issue: "Budget projects", reason: "Material costs $300-600/kg" },
      { issue: "Quick prototypes", reason: "Slow printing and complex setup" }
    ],
    differentiators: [
      { icon: "🚀", label: "250°C Continuous Use" },
      { icon: "⚗️", label: "Chemically Inert" },
      { icon: "🏥", label: "Medical-Grade" }
    ],
    familyInfo: { familyId: "high-performance", familyName: "High-Performance Family", variantPosition: "The ultimate engineering thermoplastic" },
    compareWith: "PC"
  },
  "PEI": {
    icon: "🔥",
    headline: "High-Temperature Chemical Resistance",
    description: "PEI (Ultem) offers continuous use temperature of 170°C with excellent chemical resistance. FST-rated for aerospace. More affordable than PEEK.",
    perfectFor: ["Aerospace interiors", "Chemical equipment", "High-temp housings"],
    notIdealFor: [
      { issue: "Standard printers", reason: "Requires 350°C+ hotend and enclosure" },
      { issue: "General use", reason: "Overkill for standard applications" },
      { issue: "Budget projects", reason: "Costs $150-300/kg" }
    ],
    differentiators: [
      { icon: "🔥", label: "170°C Continuous" },
      { icon: "✈️", label: "FST Aerospace Rated" },
      { icon: "⚗️", label: "Chemical Resistant" }
    ],
    familyInfo: { familyId: "high-performance", familyName: "High-Performance Family", variantPosition: "Aerospace-grade with FST rating" },
    compareWith: "PEEK"
  },
  "PVA": {
    icon: "💧",
    headline: "Water-Soluble Support Material",
    description: "PVA dissolves completely in water, leaving no marks on supported surfaces. Perfect for complex geometries with internal cavities. Requires dual-extrusion printer.",
    perfectFor: ["Complex overhangs", "Internal cavities", "Detailed models"],
    notIdealFor: [
      { issue: "Single-extruder printers", reason: "Requires dual extrusion setup" },
      { issue: "Humid environments", reason: "Absorbs moisture and clogs" },
      { issue: "Large supports", reason: "Expensive compared to breakaway materials" }
    ],
    differentiators: [
      { icon: "💧", label: "100% Water Soluble" },
      { icon: "✨", label: "No Surface Marks" },
      { icon: "🔄", label: "Pairs with PLA/PETG" }
    ],
    familyInfo: { familyId: "support", familyName: "Support Materials", variantPosition: "Water-soluble for clean removal" },
    compareWith: "HIPS"
  },
  "HIPS": {
    icon: "⚡",
    headline: "Limonene-Soluble ABS Support",
    description: "HIPS dissolves in limonene (citrus solvent), making it ideal for ABS support structures. Can also be used as a standalone material.",
    perfectFor: ["ABS support structures", "Complex ABS prints", "Budget standalone material"],
    notIdealFor: [
      { issue: "PLA/PETG prints", reason: "Designed specifically for ABS" },
      { issue: "Quick dissolution", reason: "Limonene works slower than water" },
      { issue: "Ventilation needed", reason: "Limonene has strong citrus odor" }
    ],
    differentiators: [
      { icon: "⚡", label: "Limonene Soluble" },
      { icon: "🍋", label: "Safe Citrus Solvent" },
      { icon: "💰", label: "Budget-Friendly" }
    ],
    familyInfo: { familyId: "support", familyName: "Support Materials", variantPosition: "Soluble support for ABS prints" },
    compareWith: "PVA"
  },
  "PP": {
    icon: "⚗️",
    headline: "Chemical-Resistant Living Hinges",
    description: "Polypropylene is nearly inert to chemicals and solvents. Excellent for living hinges that can flex thousands of times. Challenging to print — requires PP build surface.",
    perfectFor: ["Chemical containers", "Living hinges", "Food packaging"],
    notIdealFor: [
      { issue: "Standard build surfaces", reason: "Requires PP tape or sheet to adhere" },
      { issue: "Beginners", reason: "Severe warping requires expertise" },
      { issue: "Bonding/gluing", reason: "Nearly impossible to glue to other materials" }
    ],
    differentiators: [
      { icon: "⚗️", label: "Chemically Inert" },
      { icon: "🔄", label: "Fatigue Resistant" },
      { icon: "🍽️", label: "Food-Safe" }
    ],
    familyInfo: { familyId: "specialty", familyName: "Specialty Materials", variantPosition: "Chemical-resistant flexible plastic" },
    compareWith: "PETG"
  }
};

const VARIANT_PATTERNS: Array<{ pattern: RegExp; key: string }> = [
  { pattern: /tough\+?/i, key: "PLA TOUGH" },
  { pattern: /pla\s*\+/i, key: "PLA+" },
  { pattern: /silk/i, key: "PLA-SILK" },
  { pattern: /wood/i, key: "PLA-WOOD" },
  { pattern: /glow/i, key: "PLA-GLOW" },
  { pattern: /carbon|cf\b/i, key: "-CF" },
  { pattern: /glass|gf\b/i, key: "-GF" },
];

export function getMaterialValueProposition(
  material: string | null | undefined,
  productTitle?: string | null
): MaterialValueProposition {
  if (!material) return getGenericProposition();

  const materialUpper = material.toUpperCase().trim();
  const titleUpper = (productTitle || "").toUpperCase();

  for (const { pattern, key } of VARIANT_PATTERNS) {
    if (pattern.test(titleUpper) || pattern.test(materialUpper)) {
      if (key.startsWith("-")) {
        const baseMaterial = materialUpper.replace(/[-\s]*(CF|GF|CARBON|GLASS).*$/i, "").trim();
        const compositeKey = `${baseMaterial}${key}`;
        if (MATERIAL_PROPOSITIONS[compositeKey]) return MATERIAL_PROPOSITIONS[compositeKey];
      } else if (MATERIAL_PROPOSITIONS[key]) {
        return MATERIAL_PROPOSITIONS[key];
      }
    }
  }

  if (MATERIAL_PROPOSITIONS[materialUpper]) return MATERIAL_PROPOSITIONS[materialUpper];

  const baseMaterial = materialUpper.replace(/[-\s]*(PLUS|\+|PRO|BASIC|STANDARD|LITE|MAX)$/i, "").trim();
  if (baseMaterial !== materialUpper && MATERIAL_PROPOSITIONS[baseMaterial]) {
    return MATERIAL_PROPOSITIONS[baseMaterial];
  }

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
    notIdealFor: [{ issue: "Review requirements", reason: "Check temperature and strength specs for compatibility" }],
    differentiators: [
      { icon: "📋", label: "Check Specs Below" },
      { icon: "🔍", label: "Compare Materials" }
    ]
  };
}

export function getComparisonMaterial(material: string | null | undefined): string | null {
  const proposition = getMaterialValueProposition(material, null);
  return proposition.compareWith || null;
}
