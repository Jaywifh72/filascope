// Metric glossary for property inspector educational tooltips

export interface MetricDefinition {
  name: string;
  shortDescription: string;
  fullExplanation: string;
  whyMatters: string;
  scale?: string;
  tips?: string[];
}

export const METRIC_GLOSSARY: Record<string, MetricDefinition> = {
  printability: {
    name: "Printability",
    shortDescription: "How easy the material is to print with standard settings",
    fullExplanation: "Printability measures how forgiving a material is during printing. High printability means fewer failed prints, less tuning required, and more consistent results across different printers.",
    whyMatters: "Higher printability = fewer failed prints and less frustration. Great for beginners or production environments where reliability matters.",
    scale: "1-10 scale: 8+ is beginner-friendly, 5-7 needs some experience, <5 requires advanced skills",
    tips: [
      "PLA has the highest printability among common materials",
      "Enclosed printers improve printability for warping-prone materials",
      "Dried filament prints better than moisture-absorbed spools"
    ]
  },
  strength: {
    name: "Strength Index",
    shortDescription: "Overall mechanical strength combining tensile, impact, and layer adhesion",
    fullExplanation: "Strength index combines multiple mechanical properties: tensile strength (pull resistance), impact resistance (drop/shock survival), and layer adhesion (z-axis strength). Higher values indicate parts that can handle more stress.",
    whyMatters: "Critical for functional parts, tools, brackets, and anything that needs to bear load or resist impact. Decorative parts don't need high strength.",
    scale: "Relative scale where higher is stronger. Compare within material families for meaningful comparison.",
    tips: [
      "Print orientation affects strength - longest load path along layer lines",
      "Higher temps and slower speeds improve layer adhesion",
      "Carbon fiber additives increase stiffness but may reduce impact strength"
    ]
  },
  value: {
    name: "Value Score",
    shortDescription: "Quality-to-price ratio considering performance per dollar",
    fullExplanation: "Value score measures what you get for your money. It factors in price per kg, print success rate, mechanical properties, and consistency. A high value score doesn't mean cheap - it means good return on investment.",
    whyMatters: "Helps identify materials that punch above their price point. Premium materials can still have high value if they deliver proportional quality.",
    scale: "1-10 scale comparing against all materials in the database at similar price points",
    tips: [
      "Budget brands can offer excellent value for prototyping",
      "Premium brands often justify cost with consistency and support",
      "Consider total cost including failed prints, not just spool price"
    ]
  },
  heat_resistance: {
    name: "Heat Resistance (Tg)",
    shortDescription: "Glass transition temperature - when the material starts softening",
    fullExplanation: "Tg (glass transition temperature) is the point where a material transitions from rigid to rubbery. Above this temperature, parts will deform under their own weight or light loads.",
    whyMatters: "Essential for parts in hot environments: car interiors (can reach 60°C+), dishwashers, near heat sources. Standard PLA (Tg ~55°C) can warp on a hot car dashboard.",
    scale: "Measured in °C. PLA ~55°C, PETG ~80°C, ABS ~105°C, PC ~150°C",
    tips: [
      "Annealing can raise Tg for some materials (PLA by 10-20°C)",
      "Consider HDT (Heat Deflection Temp) for loaded parts",
      "High-temp materials often need enclosures to print properly"
    ]
  },
  ease_of_printing: {
    name: "Ease of Printing",
    shortDescription: "How beginner-friendly the material is",
    fullExplanation: "Ease of printing considers warping tendency, bed adhesion needs, temperature sensitivity, and special requirements (enclosure, drying, specific nozzles). Higher scores mean print-and-forget reliability.",
    whyMatters: "Beginners should start with easy materials (8+). Even experts prefer easy materials for non-critical prints to save time and filament.",
    scale: "1-10 scale: 9-10 very easy, 7-8 moderate, 5-6 challenging, <5 expert only",
    tips: [
      "PLA and PETG are the easiest mainstream materials",
      "TPU/flex materials need slower speeds but aren't technically difficult",
      "ASA/ABS/Nylon require enclosures for consistent results"
    ]
  },
  price_per_kg: {
    name: "Price per Kilogram",
    shortDescription: "True cost normalized to weight for fair comparison",
    fullExplanation: "Price per kg ($/kg) normalizes cost across different spool sizes. A $20 250g spool ($80/kg) is more expensive than a $25 1kg spool. This metric enables fair comparison across brands and sizes.",
    whyMatters: "Essential for budgeting and cost comparison. Don't be fooled by low sticker prices on small spools.",
    scale: "Budget: <$15/kg, Standard: $15-25/kg, Premium: $25-40/kg, Professional: $40+/kg",
    tips: [
      "Bulk buying often reduces per-kg cost by 10-30%",
      "Factor in shipping - heavy orders may qualify for free shipping",
      "Consider waste from failed prints when comparing total cost"
    ]
  },
  toughness: {
    name: "Toughness",
    shortDescription: "Resistance to impact and sudden forces",
    fullExplanation: "Toughness measures how well a material absorbs energy before breaking. Unlike strength (resistance to slow loads), toughness handles drops, impacts, and sudden forces. High toughness = parts that bend before breaking.",
    whyMatters: "Critical for parts that may be dropped, impacted, or experience sudden loads. Phone cases, tool handles, and protective enclosures need high toughness.",
    scale: "Measured in kJ/m² (impact strength). Higher is tougher. PETG and PC are among the toughest printable materials.",
    tips: [
      "PETG offers excellent toughness with easy printability",
      "Polycarbonate has the highest toughness but needs high temps",
      "Fiber-reinforced materials trade toughness for stiffness"
    ]
  },
  dimensional_accuracy: {
    name: "Dimensional Accuracy",
    shortDescription: "How precisely the material holds printed dimensions",
    fullExplanation: "Dimensional accuracy measures how close printed dimensions are to the CAD model. Factors include shrinkage, warping tendency, and material consistency. High accuracy is crucial for mechanical parts that need to fit together.",
    whyMatters: "Essential for precision parts, gears, enclosures, and anything that needs to mate with other components. Low accuracy requires compensation in design.",
    scale: "Measured as deviation percentage or mm. Good: <0.5%, Excellent: <0.2%",
    tips: [
      "PLA has excellent dimensional accuracy with minimal shrinkage",
      "ABS shrinks ~0.7% - design parts 0.7% larger to compensate",
      "Slow cooling improves accuracy for materials prone to warping"
    ]
  },
  high_speed: {
    name: "High-Speed Capable",
    shortDescription: "Material can print at accelerated speeds (200+ mm/s)",
    fullExplanation: "High-speed capable materials are formulated to handle rapid printing without quality loss. They have optimized flow properties and thermal characteristics for quick melting and cooling.",
    whyMatters: "Cuts print time by 50-70% on compatible printers. Essential for production environments or if you value time over material cost.",
    scale: "Boolean: Yes/No. High-speed typically means 200-500mm/s capability.",
    tips: [
      "Requires a high-flow hotend (typically 24mm³/s+)",
      "Bambu Lab and other modern printers optimize for high-speed",
      "Quality may slightly decrease at max speeds - find your balance"
    ]
  },
  abrasive: {
    name: "Abrasive Material",
    shortDescription: "Contains particles that wear down standard brass nozzles",
    fullExplanation: "Abrasive materials contain hard particles (carbon fiber, glass fiber, metal, glow pigments) that erode brass nozzles. Printing these with brass leads to nozzle degradation and under-extrusion over time.",
    whyMatters: "Using abrasive materials without a hardened nozzle will destroy your brass nozzle in hours. Always check before printing!",
    scale: "Boolean: Yes = requires hardened steel, ruby, or similar nozzle",
    tips: [
      "Carbon fiber and glass fiber are the most common abrasives",
      "Glow-in-the-dark pigments are also abrasive",
      "Steel nozzles print slightly cooler - increase temp by 5-10°C"
    ]
  }
};

export function getMetricDefinition(metricKey: string): MetricDefinition | null {
  // Normalize the key
  const normalizedKey = metricKey
    .toLowerCase()
    .replace(/[_\s-]+/g, '_')
    .replace(/score|index|_index|_score/g, '');
  
  // Map common variations
  const keyMappings: Record<string, string> = {
    printability: 'printability',
    print: 'printability',
    printing: 'printability',
    strength: 'strength',
    strong: 'strength',
    value: 'value',
    heat: 'heat_resistance',
    temperature: 'heat_resistance',
    tg: 'heat_resistance',
    heat_resistance: 'heat_resistance',
    ease: 'ease_of_printing',
    easy: 'ease_of_printing',
    ease_of_printing: 'ease_of_printing',
    price: 'price_per_kg',
    cost: 'price_per_kg',
    price_per_kg: 'price_per_kg',
    tough: 'toughness',
    toughness: 'toughness',
    impact: 'toughness',
    dimension: 'dimensional_accuracy',
    accuracy: 'dimensional_accuracy',
    dimensional_accuracy: 'dimensional_accuracy',
    speed: 'high_speed',
    high_speed: 'high_speed',
    fast: 'high_speed',
    abrasive: 'abrasive',
    nozzle: 'abrasive',
  };
  
  const mappedKey = keyMappings[normalizedKey];
  return mappedKey ? METRIC_GLOSSARY[mappedKey] || null : null;
}
