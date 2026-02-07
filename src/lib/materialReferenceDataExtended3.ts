// Extended material reference data - Part 3
// Covers remaining missing materials: specialty PLA, copolyesters, support materials,
// engineering polymers, and niche/specialty materials
import type { MaterialReferenceInfo } from './materialReferenceData';

export const EXTENDED_MATERIAL_REFERENCE_DATA_3: Record<string, MaterialReferenceInfo> = {

  'PLA-Matte': {
    name: 'PLA-Matte',
    fullName: 'Matte Finish Polylactic Acid',
    origin: {
      yearInvented: '2020+',
      originalCompany: 'Multiple manufacturers',
      majorManufacturers: ['Bambu Lab', 'Polymaker', 'eSUN', 'Sunlu', 'Eryone'],
    },
    composition: {
      basePolymer: 'PLA with matte surface modifiers',
      chemicalFamily: 'Aliphatic Polyester',
      keyAdditives: ['Matte/matting agents', 'Light-diffusing micro-particles', 'Mineral fillers'],
      coloringAgents: 'Wide palette of opaque, non-reflective pigments',
    },
    familyContext: {
      parentPolymer: 'PLA with surface-modifying additives for matte texture',
      variants: ['PLA Matte', 'PLA Matte Dual-Color', 'Pastello PLA'],
      chemicalComparison: 'Same PLA base as standard, but micro-particles scatter light to eliminate glossy sheen and hide layer lines.',
    },
    strengths: {
      uniqueProperties: ['Hides layer lines extremely well', 'Professional matte finish', 'No post-processing needed', 'Soft-touch feel'],
      bestUseScenarios: ['Display models', 'Home décor', 'Figurines', 'Professional prototypes', 'Client presentations'],
      advantagesOverCompetitors: ['Best layer-line concealment of any PLA', 'Premium tactile feel', 'Print-and-done finish'],
      whyChooseThis: 'When you want professional-looking prints with invisible layer lines and zero post-processing.',
    },
    weaknesses: {
      limitations: ['Standard PLA heat limits', 'Matte surface can show fingerprints/oils', 'Slightly more brittle than standard PLA'],
      commonProblems: ['Scratches more visible on matte surface', 'Some brands have quality variance', 'Slightly higher stringing'],
      whenNotToUse: ['Glossy finish desired', 'Functional/load-bearing parts', 'Outdoor use'],
    },
    practicalContext: {
      commonApplications: ['Vases', 'Figurines', 'Product prototypes', 'Home décor', 'Desk accessories'],
      costPosition: 'Standard',
    },
    trivia: {
      funFacts: ['Matte PLA became one of the fastest-growing filament categories in 2023-2024', 'The matte effect comes from micro-particles that scatter light in all directions, eliminating specular reflection'],
      whyInvented: 'To eliminate the "3D printed look" of visible layer lines without sanding or painting.',
      marketAdoption: 'Extremely popular — now a standard offering from most major brands.',
    },
    tdsProfile: {
      properties: [
        { name: 'Tensile Strength', value: '40-55', unit: 'MPa', implications: 'Slightly lower than standard PLA.' },
        { name: 'Glass Transition', value: '55-60', unit: '°C', implications: 'Standard PLA heat limits.' },
      ],
    },
    printSettings: {
      nozzleTemp: { min: 200, max: 230, optimal: 215 },
      bedTemp: { min: 50, max: 65, optimal: 55 },
      coolingFan: { min: 80, max: 100 },
      enclosure: { required: false },
      drying: { temp: 45, duration: '4-6 hours' },
      printSpeed: { recommended: '40-70 mm/s' },
    },
    safety: {
      fumes: { level: 'Very Low', notes: 'Standard PLA emissions.' },
      foodSafety: { rating: 'Not Recommended', notes: 'Matte additives may not be food safe.' },
      biodegradability: { rating: 'Industrial Composting', notes: 'Same as standard PLA.' },
    },
  },

  'PLA-Marble': {
    name: 'PLA-Marble',
    fullName: 'Marble Effect Polylactic Acid',
    origin: {
      yearInvented: '2018+',
      majorManufacturers: ['Sunlu', 'Eryone', 'Ziro', 'Amolen', 'Polymaker'],
    },
    composition: {
      basePolymer: 'PLA with randomly distributed color streaks',
      chemicalFamily: 'Aliphatic Polyester',
      keyAdditives: ['Secondary color pigment streaks', 'Random distribution agents'],
      coloringAgents: 'White base with dark veining pigments (black, grey, green)',
    },
    familyContext: {
      parentPolymer: 'PLA with dual-pigment marble veining effect',
      variants: ['White Marble', 'Black Marble', 'Green Marble'],
      chemicalComparison: 'Standard PLA mechanics with aesthetic veining. Random distribution makes every print unique.',
    },
    strengths: {
      uniqueProperties: ['Natural marble appearance', 'Every print is unique', 'No post-processing needed', 'Easy to print'],
      bestUseScenarios: ['Decorative vases', 'Sculptures', 'Bookends', 'Coasters', 'Home décor'],
      whyChooseThis: 'For stunning marble-look prints that rival real stone aesthetics.',
    },
    weaknesses: {
      limitations: ['Standard PLA properties', 'Veining pattern is random/uncontrollable', 'Limited color options'],
      commonProblems: ['Veining visibility varies with print orientation', 'Some batches have more/less veining'],
      whenNotToUse: ['Functional parts', 'Consistent appearance needed'],
    },
    practicalContext: {
      commonApplications: ['Vases', 'Planters', 'Desk accessories', 'Decorative tiles', 'Coasters'],
      costPosition: 'Standard',
    },
    trivia: {
      funFacts: ['The marble effect is created by incompletely mixing two color masterbatches during extrusion'],
    },
    printSettings: {
      nozzleTemp: { min: 200, max: 225, optimal: 210 },
      bedTemp: { min: 50, max: 65, optimal: 55 },
      coolingFan: { min: 80, max: 100 },
      enclosure: { required: false },
      printSpeed: { recommended: '40-60 mm/s' },
    },
    safety: {
      fumes: { level: 'Very Low' },
      foodSafety: { rating: 'Not Recommended' },
      biodegradability: { rating: 'Industrial Composting' },
    },
  },

  'PLA-Metal': {
    name: 'PLA-Metal',
    fullName: 'Metal-Filled Polylactic Acid',
    origin: {
      yearInvented: '2015+',
      majorManufacturers: ['Proto-pasta', 'colorFabb', 'The Virtual Foundry', 'Formfutura'],
    },
    composition: {
      basePolymer: 'PLA filled with fine metal powders',
      chemicalFamily: 'Metal-Filled Aliphatic Polyester',
      keyAdditives: ['Metal powders (bronze, copper, iron, stainless steel)', 'Coupling agents'],
      specialFillers: ['Bronze powder', 'Copper powder', 'Iron powder', 'Stainless steel powder'],
    },
    familyContext: {
      parentPolymer: 'PLA heavily loaded with metal particles (30-80% by weight)',
      variants: ['Bronze PLA', 'Copper PLA', 'Iron PLA', 'Stainless Steel PLA'],
      chemicalComparison: 'Much heavier than standard PLA. Can be polished to real metal finish. Iron variant can rust for aged look.',
    },
    strengths: {
      uniqueProperties: ['Real metal weight and feel', 'Can be polished to metallic finish', 'Iron variant develops natural patina/rust', 'Cold to the touch like real metal'],
      bestUseScenarios: ['Metal-look sculptures', 'Jewelry', 'Awards/trophies', 'Decorative hardware', 'Prop making'],
      advantagesOverCompetitors: ['Authentic metal appearance and weight', 'No metal casting required', 'Printable on standard printers'],
      whyChooseThis: 'When you want prints that look, feel, and weigh like real metal.',
    },
    weaknesses: {
      limitations: ['EXTREMELY abrasive — hardened nozzle mandatory', 'Very heavy', 'Brittle', 'Expensive', 'Clogs easily'],
      commonProblems: ['Rapid nozzle wear', 'Clogging in small nozzles', 'Brittle parts', 'Heavy spool weight'],
      whenNotToUse: ['Without hardened nozzle', 'Structural applications', 'Large prints (weight)'],
    },
    practicalContext: {
      commonApplications: ['Sculptures', 'Jewelry', 'Awards', 'Decorative hardware', 'Cosplay props'],
      costPosition: 'Premium',
    },
    trivia: {
      funFacts: ['Proto-pasta Iron PLA can be treated with vinegar and salt to develop real rust patina', 'Metal-filled PLA can be over 3x heavier than standard PLA', 'Polished copper PLA is nearly indistinguishable from cast copper'],
      whyInvented: 'To bring metalworking aesthetics to desktop 3D printing.',
    },
    tdsProfile: {
      properties: [
        { name: 'Density', value: '3.0-5.0', unit: 'g/cm³', implications: 'Much heavier than standard PLA (1.24 g/cm³).' },
        { name: 'Tensile Strength', value: '20-35', unit: 'MPa', implications: 'Significantly reduced by metal filler.' },
        { name: 'Abrasiveness', value: 'Very High', unit: '', implications: 'HARDENED NOZZLE MANDATORY.' },
      ],
    },
    printSettings: {
      nozzleTemp: { min: 195, max: 225, optimal: 210 },
      bedTemp: { min: 50, max: 65, optimal: 55 },
      coolingFan: { min: 60, max: 100 },
      enclosure: { required: false },
      printSpeed: { recommended: '20-40 mm/s', notes: 'Slow speeds prevent clogging.' },
      additionalNotes: ['HARDENED NOZZLE MANDATORY', 'Use 0.6mm+ nozzle', 'Very heavy — ensure bed can support weight', 'Post-process with steel wool or sandpaper for metallic finish'],
    },
    safety: {
      fumes: { level: 'Low', notes: 'PLA-level. Metal dust when sanding — wear mask.' },
      foodSafety: { rating: 'Not Safe', notes: 'Metal particles not food-safe.' },
      biodegradability: { rating: 'Not Compostable', notes: 'Metal content prevents composting.' },
    },
  },

  'PLA-Stone': {
    name: 'PLA-Stone',
    fullName: 'Stone/Rock Effect Polylactic Acid',
    origin: {
      majorManufacturers: ['Sunlu', 'Eryone', 'Polymaker', 'FormFutura'],
    },
    composition: {
      basePolymer: 'PLA with mineral/calcium carbonate fillers',
      chemicalFamily: 'Mineral-Filled Aliphatic Polyester',
      keyAdditives: ['Calcium carbonate', 'Mineral powders', 'Stone-texture agents'],
    },
    familyContext: {
      parentPolymer: 'PLA filled with mineral particles for stone-like appearance and texture',
      variants: ['Stone PLA', 'Granite PLA', 'Sandstone PLA'],
      chemicalComparison: 'Similar concept to Wood PLA but with mineral fillers instead of wood particles.',
    },
    strengths: {
      uniqueProperties: ['Natural stone-like texture', 'Matte, rough surface', 'Heavier than standard PLA', 'Unique aesthetic'],
      bestUseScenarios: ['Planters', 'Architectural models', 'Decorative items', 'Terrain for tabletop gaming'],
      whyChooseThis: 'For prints that look and feel like carved stone.',
    },
    weaknesses: {
      limitations: ['Abrasive — hardened nozzle recommended', 'Brittle', 'Limited color range', 'Standard PLA heat limits'],
      commonProblems: ['Nozzle wear', 'Clogging with fine nozzles', 'Brittle parts'],
      whenNotToUse: ['Without hardened nozzle', 'Structural parts', 'Fine detail work'],
    },
    practicalContext: {
      commonApplications: ['Planters', 'Figurines', 'Terrain pieces', 'Architectural models', 'Garden decorations'],
      costPosition: 'Standard',
    },
    trivia: {
      funFacts: ['Stone PLA is popular in the tabletop gaming community for terrain pieces'],
    },
    printSettings: {
      nozzleTemp: { min: 200, max: 230, optimal: 215 },
      bedTemp: { min: 50, max: 65, optimal: 55 },
      coolingFan: { min: 60, max: 100 },
      enclosure: { required: false },
      printSpeed: { recommended: '30-50 mm/s' },
      additionalNotes: ['Hardened nozzle recommended', 'Use 0.4mm+ nozzle'],
    },
    safety: {
      fumes: { level: 'Very Low' },
      foodSafety: { rating: 'Not Safe', notes: 'Mineral additives not food-safe.' },
      biodegradability: { rating: 'Not Compostable' },
    },
  },

  'LW-PLA': {
    name: 'LW-PLA',
    fullName: 'Lightweight/Foaming Polylactic Acid',
    origin: {
      yearInvented: '2019',
      originalCompany: 'colorFabb',
      majorManufacturers: ['colorFabb', 'Polymaker', 'eSUN'],
    },
    composition: {
      basePolymer: 'PLA with active foaming agent',
      chemicalFamily: 'Aliphatic Polyester with Chemical Foaming Agent',
      keyAdditives: ['Chemical foaming/blowing agent that activates at higher temperatures'],
    },
    familyContext: {
      parentPolymer: 'PLA that expands/foams when printed at higher temperatures',
      variants: ['LW-PLA', 'LW-PLA HT', 'Foaming PLA'],
      chemicalComparison: 'Unique in 3D printing — the material expands up to 2.8x volume, producing parts up to 65% lighter than standard PLA.',
    },
    strengths: {
      uniqueProperties: ['Parts can be up to 65% lighter than standard PLA', 'Foam-like internal structure', 'Excellent for RC aircraft', 'Adjustable density via temperature'],
      bestUseScenarios: ['RC aircraft', 'Drone components', 'Lightweight models', 'Buoyant objects', 'Large hollow prints'],
      advantagesOverCompetitors: ['Lightest printable material available', 'Density controlled by nozzle temperature', 'No other material offers this weight reduction'],
      whyChooseThis: 'When weight is the primary concern — nothing else comes close to LW-PLA\'s weight savings.',
    },
    weaknesses: {
      limitations: ['Reduced strength due to foaming', 'Requires careful temperature control', 'Surface quality affected by foaming', 'Premium pricing'],
      commonProblems: ['Over-foaming at too-high temps', 'Inconsistent expansion', 'Poor surface finish', 'Difficulty controlling dimensions'],
      whenNotToUse: ['Structural parts', 'Precision dimensions needed', 'Surface quality critical'],
    },
    practicalContext: {
      commonApplications: ['RC aircraft wings', 'Drone frames', 'Cosplay props (lightweight)', 'Large display items', 'Buoys'],
      costPosition: 'Premium',
    },
    trivia: {
      funFacts: ['colorFabb LW-PLA was the first foaming PLA filament', 'At 230°C+, LW-PLA expands to nearly 3x its normal volume', 'RC plane builders were the first adopters — a full-size wing can weigh under 50g'],
      whyInvented: 'RC aircraft community needed ultra-lightweight printable material.',
      marketAdoption: 'Niche but beloved by RC and drone communities.',
    },
    tdsProfile: {
      properties: [
        { name: 'Density (foamed)', value: '0.4-0.8', unit: 'g/cm³', implications: 'Up to 65% lighter than standard PLA (1.24 g/cm³).' },
        { name: 'Expansion Ratio', value: '1.5-2.8x', unit: '', implications: 'Controlled by nozzle temperature.' },
        { name: 'Tensile Strength', value: '15-30', unit: 'MPa', implications: 'Reduced due to foam structure.' },
      ],
    },
    printSettings: {
      nozzleTemp: { min: 195, max: 250, optimal: 230 },
      bedTemp: { min: 50, max: 65, optimal: 55 },
      coolingFan: { min: 0, max: 50, notes: 'Less cooling allows better foaming.' },
      enclosure: { required: false },
      printSpeed: { recommended: '20-40 mm/s' },
      additionalNotes: ['195°C = minimal foaming (dense)', '230°C+ = maximum foaming (lightest)', 'Reduce flow rate to 50-65% when foaming', 'Single wall/vase mode works great'],
    },
    safety: {
      fumes: { level: 'Low', notes: 'Foaming agent may produce slight odor at high temps.' },
      foodSafety: { rating: 'Not Safe', notes: 'Foaming agent not food-safe.' },
      biodegradability: { rating: 'Not Compostable', notes: 'Foaming agent affects compostability.' },
    },
  },

  'rPLA': {
    name: 'rPLA',
    fullName: 'Recycled Polylactic Acid',
    origin: {
      yearInvented: '2020+',
      majorManufacturers: ['Re-Filament', 'Prusament', 'Filamentive', 'colorFabb'],
    },
    composition: {
      basePolymer: 'Recycled PLA (post-industrial or post-consumer)',
      chemicalFamily: 'Recycled Aliphatic Polyester',
      keyAdditives: ['Stabilizers for recycled content', 'Color correctors'],
    },
    familyContext: {
      parentPolymer: 'PLA made from recycled PLA waste or failed prints',
      variants: ['rPLA', 'Recycled PLA', 'Re-PLA'],
      chemicalComparison: 'Same chemistry as virgin PLA but from recycled feedstock. May have slightly reduced properties.',
    },
    strengths: {
      uniqueProperties: ['Made from recycled material', 'Reduces plastic waste', 'Prints like standard PLA', 'Lower carbon footprint'],
      bestUseScenarios: ['Eco-conscious projects', 'Prototyping', 'General printing where sustainability matters'],
      whyChooseThis: 'When reducing environmental impact is important and you want to print sustainably.',
    },
    weaknesses: {
      limitations: ['Slightly wider diameter tolerance', 'Color options may be limited', 'Minor property reduction possible'],
      commonProblems: ['Batch-to-batch color variation', 'Slightly more stringing than virgin PLA'],
      whenNotToUse: ['Precision parts', 'When absolute consistency needed'],
    },
    practicalContext: {
      commonApplications: ['General prototyping', 'Education', 'Eco-conscious products', 'Draft prints'],
      costPosition: 'Budget',
    },
    trivia: {
      funFacts: ['Some recycled PLA comes from failed 3D prints — circular economy in action', 'Prusament rPLA uses post-industrial PLA waste from their own production'],
      whyInvented: 'To close the loop on PLA waste in 3D printing.',
    },
    printSettings: {
      nozzleTemp: { min: 195, max: 220, optimal: 210 },
      bedTemp: { min: 50, max: 65, optimal: 55 },
      coolingFan: { min: 80, max: 100 },
      enclosure: { required: false },
      printSpeed: { recommended: '40-60 mm/s' },
    },
    safety: {
      fumes: { level: 'Very Low', notes: 'Same as standard PLA.' },
      foodSafety: { rating: 'Not Certified', notes: 'Recycled content not food-contact certified.' },
      biodegradability: { rating: 'Industrial Composting', notes: 'Same as virgin PLA.' },
    },
  },

  'PETG-HS': {
    name: 'PETG-HS',
    fullName: 'High-Speed PETG',
    origin: {
      yearInvented: '2023+',
      majorManufacturers: ['Bambu Lab', 'Polymaker', 'eSUN', 'Sunlu'],
    },
    composition: {
      basePolymer: 'PETG with high melt-flow rate modifiers',
      chemicalFamily: 'Modified Copolyester',
      keyAdditives: ['Melt-flow enhancers', 'Rapid crystallization agents'],
    },
    familyContext: {
      parentPolymer: 'PETG optimized for high-speed printing (200-300+ mm/s)',
      chemicalComparison: 'Standard PETG properties with improved rheology for high flow rates.',
    },
    strengths: {
      uniqueProperties: ['Prints at 200-300+ mm/s', 'Maintains PETG strength', 'Good layer adhesion at speed', 'Chemical resistant'],
      bestUseScenarios: ['Rapid functional prototyping', 'Production runs', 'Time-critical PETG parts'],
      whyChooseThis: 'When you need PETG properties at high-speed PLA printing speeds.',
    },
    weaknesses: {
      limitations: ['Requires high-speed printer', 'May not print well at slow speeds', 'Premium pricing'],
      commonProblems: ['Needs high-flow hotend', 'Temperature tuning required'],
      whenNotToUse: ['Slow printers', 'When standard PETG speed is acceptable'],
    },
    practicalContext: {
      commonApplications: ['Rapid prototypes', 'Production PETG parts', 'Functional items at speed'],
      costPosition: 'Premium',
    },
    trivia: {
      funFacts: ['High-speed PETG emerged alongside the high-speed printer revolution of 2023'],
    },
    printSettings: {
      nozzleTemp: { min: 230, max: 260, optimal: 245 },
      bedTemp: { min: 70, max: 90, optimal: 80 },
      coolingFan: { min: 30, max: 70 },
      enclosure: { required: false },
      drying: { temp: 65, duration: '4-6 hours' },
      printSpeed: { recommended: '150-300 mm/s' },
    },
    safety: {
      fumes: { level: 'Low', notes: 'Standard PETG.' },
      foodSafety: { rating: 'Check Brand' },
      biodegradability: { rating: 'Not Biodegradable' },
    },
  },

  'ASA 275': {
    name: 'ASA 275',
    fullName: 'High-Temperature ASA (275°C Rated)',
    origin: {
      majorManufacturers: ['Polymaker'],
    },
    composition: {
      basePolymer: 'High-temperature ASA formulation',
      chemicalFamily: 'Acrylonitrile Styrene Acrylate (High-Temp Grade)',
    },
    familyContext: {
      parentPolymer: 'ASA engineered for higher heat resistance than standard ASA',
      chemicalComparison: 'HDT significantly higher than standard ASA (~100°C vs ~95°C). Enhanced UV resistance.',
    },
    strengths: {
      uniqueProperties: ['Higher heat resistance than standard ASA', 'Excellent UV resistance', 'Flame retardant grades available', 'Outdoor-grade'],
      bestUseScenarios: ['High-temp outdoor parts', 'Automotive exterior', 'Industrial outdoor fixtures'],
      whyChooseThis: 'When standard ASA heat resistance isn\'t enough for your outdoor application.',
    },
    weaknesses: {
      limitations: ['Requires enclosure', 'Higher print temps', 'More expensive than standard ASA'],
      commonProblems: ['Warping without enclosure', 'Fumes at higher temperatures'],
      whenNotToUse: ['When standard ASA suffices', 'Open-frame printers'],
    },
    practicalContext: {
      commonApplications: ['Automotive parts', 'Outdoor electrical enclosures', 'High-temp outdoor fixtures'],
      costPosition: 'Premium',
    },
    trivia: {},
    printSettings: {
      nozzleTemp: { min: 250, max: 275, optimal: 260 },
      bedTemp: { min: 90, max: 110, optimal: 100 },
      coolingFan: { min: 0, max: 30 },
      enclosure: { required: true },
      drying: { temp: 80, duration: '4-6 hours' },
      printSpeed: { recommended: '40-60 mm/s' },
    },
    safety: {
      fumes: { level: 'Moderate', notes: 'Higher temps than standard ASA — ventilate.' },
      foodSafety: { rating: 'Not Safe' },
      biodegradability: { rating: 'Not Biodegradable' },
    },
  },

  'ASA Kevlar': {
    name: 'ASA Kevlar',
    fullName: 'Aramid Fiber Reinforced ASA',
    origin: {
      majorManufacturers: ['Polymaker', 'Kimya'],
    },
    composition: {
      basePolymer: 'ASA reinforced with aramid (Kevlar) fibers',
      chemicalFamily: 'Aramid Fiber Reinforced Styrenic',
      keyAdditives: ['Chopped aramid/Kevlar fibers', 'Coupling agents'],
    },
    familyContext: {
      parentPolymer: 'ASA reinforced with aramid fiber for impact and abrasion resistance',
      chemicalComparison: 'Better impact resistance than ASA-CF. Less stiff but much tougher. UV resistant unlike Nylon-AF.',
    },
    strengths: {
      uniqueProperties: ['Outstanding impact resistance', 'UV resistant (ASA base)', 'Abrasion resistant', 'Lighter than CF variants'],
      bestUseScenarios: ['Impact-critical outdoor parts', 'Protective enclosures', 'Automotive bumper components'],
      whyChooseThis: 'When outdoor impact resistance is the top priority.',
    },
    weaknesses: {
      limitations: ['Expensive', 'Limited availability', 'Aramid fibers can cause nozzle wear', 'Fuzzy surface finish'],
      commonProblems: ['Surface can look "fuzzy" from exposed fibers', 'Hardened nozzle needed'],
      whenNotToUse: ['Smooth surface needed', 'Maximum stiffness (use CF)', 'Budget projects'],
    },
    practicalContext: {
      commonApplications: ['Outdoor impact parts', 'Protective cases', 'Automotive components', 'Industrial guards'],
      costPosition: 'Premium',
    },
    trivia: {
      funFacts: ['Kevlar is 5x stronger than steel by weight'],
    },
    printSettings: {
      nozzleTemp: { min: 240, max: 270, optimal: 255 },
      bedTemp: { min: 90, max: 110, optimal: 100 },
      coolingFan: { min: 0, max: 30 },
      enclosure: { required: true },
      printSpeed: { recommended: '30-50 mm/s' },
      additionalNotes: ['HARDENED NOZZLE REQUIRED', 'Enclosure required'],
    },
    safety: {
      fumes: { level: 'Moderate', notes: 'ASA-level fumes. Ventilate.' },
      foodSafety: { rating: 'Not Safe' },
      biodegradability: { rating: 'Not Biodegradable' },
    },
  },

  'PAHT-CF': {
    name: 'PAHT-CF',
    fullName: 'High-Temperature Polyamide Carbon Fiber',
    origin: {
      majorManufacturers: ['Bambu Lab', 'Polymaker', '3DXTech'],
    },
    composition: {
      basePolymer: 'High-temperature polyamide (PA6-MXD6 or similar) with carbon fiber',
      chemicalFamily: 'Semi-Aromatic Polyamide with Carbon Fiber',
      keyAdditives: ['Chopped carbon fiber (15-20%)', 'Heat stabilizers'],
    },
    familyContext: {
      parentPolymer: 'High-temp nylon variant reinforced with carbon fiber',
      chemicalComparison: 'Higher heat resistance than PA6-CF (~150°C+ HDT vs ~100°C). Bridging gap between standard nylon-CF and PEEK.',
    },
    strengths: {
      uniqueProperties: ['Very high heat resistance for a nylon', 'Excellent stiffness', 'Good chemical resistance', 'Prints easier than PEEK/PEI'],
      bestUseScenarios: ['Under-hood automotive parts', 'Industrial tooling', 'High-temp jigs', 'Aerospace prototypes'],
      advantagesOverCompetitors: ['Higher heat than standard PA-CF', 'Much easier to print than PEEK', 'Available for desktop printers'],
      whyChooseThis: 'When standard nylon-CF isn\'t heat-resistant enough but PEEK is overkill.',
    },
    weaknesses: {
      limitations: ['Very hygroscopic', 'Requires enclosure', 'Hardened nozzle mandatory', 'Expensive'],
      commonProblems: ['Moisture absorption is aggressive', 'Warping without chamber heat', 'Nozzle wear'],
      whenNotToUse: ['Without dry box/dryer', 'Open-frame printers', 'Budget applications'],
    },
    practicalContext: {
      commonApplications: ['Automotive under-hood', 'Industrial jigs', 'High-temp brackets', 'Aerospace prototypes'],
      costPosition: 'Premium',
    },
    trivia: {
      funFacts: ['PAHT-CF bridges the gap between desktop-printable nylon and industrial PEEK'],
    },
    tdsProfile: {
      properties: [
        { name: 'Tensile Strength', value: '80-120', unit: 'MPa', implications: 'Very high strength.' },
        { name: 'HDT', value: '150-180', unit: '°C', implications: 'Much higher than standard PA-CF.' },
      ],
    },
    printSettings: {
      nozzleTemp: { min: 280, max: 320, optimal: 300 },
      bedTemp: { min: 90, max: 120, optimal: 100 },
      coolingFan: { min: 0, max: 30 },
      enclosure: { required: true, notes: 'Heated chamber strongly recommended (60°C+).' },
      drying: { temp: 90, duration: '8-12 hours', notes: 'CRITICAL. Must be bone dry.' },
      printSpeed: { recommended: '30-60 mm/s' },
      additionalNotes: ['HARDENED NOZZLE MANDATORY', 'Print from dry box', 'All-metal hotend required'],
    },
    safety: {
      fumes: { level: 'Moderate', notes: 'Ventilation recommended at high temps.' },
      foodSafety: { rating: 'Not Safe' },
      biodegradability: { rating: 'Not Biodegradable' },
    },
  },

  'PPA': {
    name: 'PPA',
    fullName: 'Polyphthalamide (High-Performance Polyamide)',
    origin: {
      originalCompany: 'Solvay (Amodel), DuPont (Zytel HTN)',
      majorManufacturers: ['Solvay', 'DuPont', '3DXTech', 'Polymaker'],
    },
    composition: {
      basePolymer: 'Polyphthalamide (semi-aromatic polyamide)',
      chemicalFamily: 'Semi-Aromatic Polyamide',
      keyAdditives: ['Carbon fiber or glass fiber reinforcement common'],
    },
    familyContext: {
      parentPolymer: 'Semi-aromatic nylon — between standard nylon and PEEK',
      variants: ['PPA', 'PPA-CF', 'PPA-GF', 'Zytel HTN'],
      chemicalComparison: 'Much higher heat resistance than PA6/PA12 (~300°C HDT with GF). Lower moisture absorption than standard nylons.',
    },
    strengths: {
      uniqueProperties: ['Very high heat resistance', 'Lower moisture absorption than PA6', 'Excellent chemical resistance', 'High stiffness'],
      bestUseScenarios: ['Under-hood automotive', 'Electrical connectors', 'High-temp structural parts'],
      whyChooseThis: 'When standard nylon fails at temperature but PEEK is too expensive.',
    },
    weaknesses: {
      limitations: ['Requires 280-320°C nozzle', 'Expensive', 'Enclosure required', 'Limited availability'],
      commonProblems: ['High print temps', 'Moisture sensitivity', 'Warping'],
      whenNotToUse: ['Standard desktop printers', 'When PA6-CF suffices'],
    },
    practicalContext: {
      commonApplications: ['Automotive connectors', 'Under-hood components', 'Industrial parts', 'Electrical insulation'],
      costPosition: 'Industrial',
    },
    trivia: {
      funFacts: ['PPA is used in automotive engine compartments where temperatures exceed 150°C continuously'],
    },
    printSettings: {
      nozzleTemp: { min: 280, max: 320, optimal: 300 },
      bedTemp: { min: 100, max: 130, optimal: 110 },
      coolingFan: { min: 0, max: 20 },
      enclosure: { required: true },
      drying: { temp: 100, duration: '6-8 hours' },
      printSpeed: { recommended: '30-50 mm/s' },
      additionalNotes: ['All-metal hotend required', 'HARDENED NOZZLE for CF/GF variants', 'Print from dry box'],
    },
    safety: {
      fumes: { level: 'Moderate', notes: 'Ventilation required at high temps.' },
      foodSafety: { rating: 'Not Certified' },
      biodegradability: { rating: 'Not Biodegradable' },
    },
  },

  'PC-FR': {
    name: 'PC-FR',
    fullName: 'Flame Retardant Polycarbonate',
    origin: {
      majorManufacturers: ['Polymaker', 'Covestro', '3DXTech'],
    },
    composition: {
      basePolymer: 'Polycarbonate with flame retardant additives',
      chemicalFamily: 'Flame Retardant Polycarbonate',
    },
    familyContext: {
      parentPolymer: 'PC with UL94 V0 flame retardancy',
      chemicalComparison: 'Same high heat resistance as PC with added fire safety. Slight reduction in impact resistance.',
    },
    strengths: {
      uniqueProperties: ['UL94 V0 rated', 'High heat resistance', 'Self-extinguishing', 'PC-level strength'],
      bestUseScenarios: ['Electrical enclosures', 'Rail/transit interiors', 'Industrial safety housings'],
      whyChooseThis: 'When fire certification is required alongside PC performance.',
    },
    weaknesses: {
      limitations: ['Reduced impact vs standard PC', 'Expensive', 'Enclosure required', 'Limited color options'],
      commonProblems: ['Same printing challenges as PC', 'FR additives affect layer adhesion'],
      whenNotToUse: ['When fire rating not needed (use standard PC)', 'Open-frame printers'],
    },
    practicalContext: {
      commonApplications: ['Electrical panels', 'Transit interiors', 'Server racks', 'Industrial housings'],
      safetyStandards: ['UL94 V0', 'Various fire safety standards'],
      costPosition: 'Industrial',
    },
    trivia: {},
    printSettings: {
      nozzleTemp: { min: 270, max: 310, optimal: 290 },
      bedTemp: { min: 100, max: 120, optimal: 110 },
      coolingFan: { min: 0, max: 20 },
      enclosure: { required: true },
      drying: { temp: 80, duration: '6-8 hours' },
      printSpeed: { recommended: '30-50 mm/s' },
    },
    safety: {
      fumes: { level: 'Moderate', notes: 'FR additives may produce additional fumes. Ventilate.' },
      foodSafety: { rating: 'Not Safe' },
      biodegradability: { rating: 'Not Biodegradable' },
    },
  },

  'PC-PBT': {
    name: 'PC-PBT',
    fullName: 'Polycarbonate-Polybutylene Terephthalate Blend',
    origin: {
      originalCompany: 'SABIC (Xenoy brand)',
      majorManufacturers: ['SABIC', 'Covestro', 'Polymaker'],
    },
    composition: {
      basePolymer: 'Polycarbonate + PBT polyester blend',
      chemicalFamily: 'PC/Polyester Blend',
    },
    familyContext: {
      parentPolymer: 'Blend combining PC impact resistance with PBT chemical resistance',
      chemicalComparison: 'Better chemical resistance than PC-ABS. Excellent for automotive exterior where chemicals and impact matter.',
    },
    strengths: {
      uniqueProperties: ['Outstanding chemical resistance', 'Excellent impact resistance', 'Good UV resistance', 'Automotive-grade'],
      bestUseScenarios: ['Automotive bumpers', 'Chemical-exposed housings', 'Outdoor electrical enclosures'],
      whyChooseThis: 'When both chemical and impact resistance are needed — PC-PBT excels at both.',
    },
    weaknesses: {
      limitations: ['Requires enclosure', 'High print temps', 'Expensive', 'Limited filament availability'],
      commonProblems: ['Moisture sensitivity', 'Warping', 'Difficult to print'],
      whenNotToUse: ['When chemical resistance not needed (use PC-ABS)', 'Open-frame printers'],
    },
    practicalContext: {
      commonApplications: ['Automotive bumper components', 'Outdoor enclosures', 'Chemical-resistant housings'],
      costPosition: 'Industrial',
    },
    trivia: {
      funFacts: ['SABIC Xenoy PC-PBT is used in actual automotive bumpers by major car manufacturers'],
    },
    printSettings: {
      nozzleTemp: { min: 260, max: 290, optimal: 275 },
      bedTemp: { min: 90, max: 110, optimal: 100 },
      coolingFan: { min: 0, max: 20 },
      enclosure: { required: true },
      drying: { temp: 80, duration: '6-8 hours' },
      printSpeed: { recommended: '30-50 mm/s' },
    },
    safety: {
      fumes: { level: 'Moderate', notes: 'Ventilation required.' },
      foodSafety: { rating: 'Not Safe' },
      biodegradability: { rating: 'Not Biodegradable' },
    },
  },

  'ESD-PC': {
    name: 'ESD-PC',
    fullName: 'Electrostatic Dissipative Polycarbonate',
    origin: {
      majorManufacturers: ['3DXTech', 'Polymaker', 'Stratasys'],
    },
    composition: {
      basePolymer: 'Polycarbonate with conductive carbon additives',
      chemicalFamily: 'ESD-Modified Polycarbonate',
      keyAdditives: ['Carbon nanotubes', 'Carbon black', 'Conductive additives'],
    },
    familyContext: {
      parentPolymer: 'PC with ESD properties for electronics manufacturing',
      chemicalComparison: 'PC heat resistance + ESD protection. The gold standard for ESD tooling.',
    },
    strengths: {
      uniqueProperties: ['ESD safe (10⁶-10⁹ ohm/sq)', 'PC-level heat resistance', 'Consistent ESD across the part', 'High strength'],
      bestUseScenarios: ['Semiconductor tooling', 'Electronics manufacturing jigs', 'ESD-safe enclosures', 'Cleanroom fixtures'],
      whyChooseThis: 'The top-tier ESD material — PC strength and heat resistance with reliable static dissipation.',
    },
    weaknesses: {
      limitations: ['Very expensive', 'Black only', 'Requires enclosure', 'Expert-level printing'],
      commonProblems: ['All PC printing challenges apply', 'Abrasive to nozzles'],
      whenNotToUse: ['Basic ESD needs (use ESD-PLA)', 'Budget applications'],
    },
    practicalContext: {
      commonApplications: ['Chip trays', 'PCB fixtures', 'Cleanroom tools', 'ESD-safe enclosures'],
      safetyStandards: ['ANSI/ESD S20.20'],
      costPosition: 'Industrial',
    },
    trivia: {},
    printSettings: {
      nozzleTemp: { min: 270, max: 310, optimal: 290 },
      bedTemp: { min: 100, max: 120, optimal: 110 },
      coolingFan: { min: 0, max: 20 },
      enclosure: { required: true },
      drying: { temp: 80, duration: '6-8 hours' },
      printSpeed: { recommended: '30-50 mm/s' },
      additionalNotes: ['HARDENED NOZZLE REQUIRED', 'Verify ESD after printing'],
    },
    safety: {
      fumes: { level: 'Moderate', notes: 'PC-level emissions. Ventilate.' },
      foodSafety: { rating: 'Not Safe' },
      biodegradability: { rating: 'Not Biodegradable' },
    },
  },

  'PES': {
    name: 'PES',
    fullName: 'Polyethersulfone',
    origin: {
      yearInvented: '1972',
      originalCompany: 'ICI (now Solvay)',
      majorManufacturers: ['Solvay (Veradel)', 'BASF (Ultrason E)'],
    },
    composition: {
      basePolymer: 'Polyethersulfone',
      chemicalFamily: 'Sulfone Polymer',
    },
    familyContext: {
      parentPolymer: 'Base sulfone polymer — PES < PSU < PPSU in toughness',
      chemicalComparison: 'Highest heat resistance of the sulfone family (220°C Tg). Most rigid but least impact-resistant.',
    },
    strengths: {
      uniqueProperties: ['Very high heat resistance (220°C Tg)', 'Excellent dimensional stability', 'Inherently flame retardant', 'Transparent amber'],
      bestUseScenarios: ['High-temp filtration membranes', 'Medical sterilization trays', 'Aerospace brackets'],
      whyChooseThis: 'When maximum heat resistance in the sulfone family is needed.',
    },
    weaknesses: {
      limitations: ['Notch sensitive', 'Specialized printer required', 'Very expensive', 'UV sensitive'],
      commonProblems: ['Brittle under impact', 'Moisture absorption', 'Yellowing in UV'],
      whenNotToUse: ['Impact-critical parts (use PPSU)', 'Standard printers'],
    },
    practicalContext: {
      commonApplications: ['Filtration membranes', 'Medical trays', 'High-temp components', 'Aerospace'],
      costPosition: 'Industrial',
    },
    trivia: {},
    printSettings: {
      nozzleTemp: { min: 360, max: 400, optimal: 380 },
      bedTemp: { min: 140, max: 180, optimal: 160 },
      coolingFan: { min: 0, max: 0 },
      enclosure: { required: true, notes: 'MANDATORY. 160°C+ chamber.' },
      drying: { temp: 150, duration: '4-8 hours' },
      printSpeed: { recommended: '10-30 mm/s' },
    },
    safety: {
      fumes: { level: 'Low', notes: 'Low emissions despite high temps.' },
      foodSafety: { rating: 'FDA Grades Available' },
      biodegradability: { rating: 'Not Biodegradable' },
    },
  },

  'PCTG': {
    name: 'PCTG',
    fullName: 'Polycyclohexanedimethanol Terephthalate Glycol',
    origin: {
      originalCompany: 'Eastman Chemical (Tritan)',
      majorManufacturers: ['Eastman', 'Polymaker', 'Extrudr', 'Fiberlogy'],
    },
    composition: {
      basePolymer: 'PCTG (glycol-modified PCT)',
      chemicalFamily: 'Copolyester',
      keyAdditives: ['Clarity enhancers', 'Impact modifiers'],
    },
    familyContext: {
      parentPolymer: 'Premium copolyester — Eastman Tritan is the most famous PCTG',
      variants: ['PCTG', 'PCTG CF10', 'PCTG GF10', 'Pro PCTG', 'Tritan'],
      chemicalComparison: 'Better impact resistance than PETG. BPA-free. Higher clarity. Better chemical resistance.',
    },
    strengths: {
      uniqueProperties: ['BPA-free', 'Excellent clarity', 'Outstanding impact resistance', 'Chemical resistant', 'FDA food contact'],
      bestUseScenarios: ['Food-safe containers', 'Medical prototypes', 'Clear enclosures', 'Impact-resistant parts'],
      advantagesOverCompetitors: ['BPA-free (unlike PC)', 'Better impact than PETG', 'FDA food contact approved', 'Excellent clarity'],
      whyChooseThis: 'When you need a food-safe, BPA-free, impact-resistant clear material.',
    },
    weaknesses: {
      limitations: ['More expensive than PETG', 'Slightly harder to print than PETG', 'Less common'],
      commonProblems: ['Stringing', 'Bed adhesion can be aggressive', 'Moisture sensitivity'],
      whenNotToUse: ['When PETG suffices', 'Budget projects'],
    },
    practicalContext: {
      commonApplications: ['Water bottles', 'Food containers', 'Medical devices', 'Baby products', 'Clear housings'],
      safetyStandards: ['FDA food contact', 'BPA-free', 'Tritan certified'],
      costPosition: 'Premium',
    },
    trivia: {
      funFacts: ['Eastman Tritan (PCTG) replaced BPA-containing polycarbonate in water bottles', 'Your Nalgene bottle is probably made of Tritan PCTG'],
      whyInvented: 'BPA concerns in polycarbonate drove demand for a safer, equally tough clear plastic.',
    },
    printSettings: {
      nozzleTemp: { min: 230, max: 260, optimal: 245 },
      bedTemp: { min: 70, max: 90, optimal: 80 },
      coolingFan: { min: 30, max: 70 },
      enclosure: { required: false },
      drying: { temp: 65, duration: '4-6 hours' },
      printSpeed: { recommended: '40-60 mm/s' },
      additionalNotes: ['Use release agent on smooth PEI', 'Slightly higher temps than PETG'],
    },
    safety: {
      fumes: { level: 'Low', notes: 'Low emissions.' },
      foodSafety: { rating: 'FDA Approved', notes: 'Tritan PCTG is BPA-free and FDA food contact approved.' },
      biodegradability: { rating: 'Not Biodegradable' },
    },
  },

  'CoPoly-HT': {
    name: 'CoPoly-HT',
    fullName: 'High-Temperature Copolyester',
    origin: {
      originalCompany: 'colorFabb (using Eastman polymers)',
      majorManufacturers: ['colorFabb', 'Formfutura'],
    },
    composition: {
      basePolymer: 'High-temperature copolyester',
      chemicalFamily: 'Copolyester (High-Temperature Grade)',
    },
    familyContext: {
      parentPolymer: 'Premium copolyester with enhanced heat resistance',
      chemicalComparison: 'Higher Tg than standard PETG (~100°C vs ~75°C). Better chemical resistance.',
    },
    strengths: {
      uniqueProperties: ['~100°C heat resistance', 'Good chemical resistance', 'Transparent grades available', 'PETG-like printability'],
      bestUseScenarios: ['High-temp clear parts', 'Chemical containers', 'Heat-exposed housings'],
      whyChooseThis: 'When PETG\'s heat resistance isn\'t enough but you want copolyester printability.',
    },
    weaknesses: {
      limitations: ['colorFabb exclusive', 'Premium pricing', 'Aggressive bed adhesion'],
      commonProblems: ['Sticks aggressively to PEI', 'Moisture sensitivity'],
      whenNotToUse: ['When standard PETG suffices', 'Budget projects'],
    },
    practicalContext: {
      commonApplications: ['High-temp enclosures', 'Chemical-resistant parts', 'Transparent covers'],
      costPosition: 'Premium',
    },
    trivia: {
      funFacts: ['HT stands for "High Temperature" in the colorFabb product line'],
    },
    printSettings: {
      nozzleTemp: { min: 260, max: 280, optimal: 270 },
      bedTemp: { min: 80, max: 100, optimal: 90 },
      coolingFan: { min: 25, max: 75 },
      enclosure: { required: false },
      drying: { temp: 70, duration: '4-6 hours' },
      printSpeed: { recommended: '35-55 mm/s' },
      additionalNotes: ['Release agent on smooth PEI REQUIRED'],
    },
    safety: {
      fumes: { level: 'Low' },
      foodSafety: { rating: 'Check Specific Grade' },
      biodegradability: { rating: 'Not Biodegradable' },
    },
  },

  'CoPoly-nGen': {
    name: 'CoPoly-nGen',
    fullName: 'Amphora Copolyester (nGen)',
    origin: {
      originalCompany: 'colorFabb (using Eastman Amphora)',
      majorManufacturers: ['colorFabb'],
    },
    composition: {
      basePolymer: 'Eastman Amphora AM3300 copolyester',
      chemicalFamily: 'Copolyester',
    },
    familyContext: {
      parentPolymer: 'Amphora-based copolyester — PETG alternative with better properties',
      variants: ['nGen', 'nGen Flex', 'nGen CF'],
      chemicalComparison: 'Better odor, lower warping, and better clarity than standard PETG. Tg ~85°C.',
    },
    strengths: {
      uniqueProperties: ['Very low odor', 'Excellent clarity', 'Low warping', 'Styrene-free', 'Good chemical resistance'],
      bestUseScenarios: ['Clear functional parts', 'Low-odor printing environments', 'Chemical-resistant containers'],
      whyChooseThis: 'Premium PETG alternative with better clarity, lower odor, and improved properties.',
    },
    weaknesses: {
      limitations: ['colorFabb exclusive', 'Premium pricing', 'Can stick aggressively to PEI'],
      commonProblems: ['Aggressive bed adhesion on smooth PEI'],
      whenNotToUse: ['Budget projects', 'When standard PETG works'],
    },
    practicalContext: {
      commonApplications: ['Clear containers', 'Functional parts', 'Medical prototypes', 'Low-odor environments'],
      costPosition: 'Premium',
    },
    trivia: {
      funFacts: ['nGen uses Eastman Amphora, which was specifically developed for 3D printing'],
    },
    printSettings: {
      nozzleTemp: { min: 220, max: 245, optimal: 235 },
      bedTemp: { min: 75, max: 90, optimal: 85 },
      coolingFan: { min: 30, max: 70 },
      enclosure: { required: false },
      drying: { temp: 65, duration: '4-6 hours' },
      printSpeed: { recommended: '40-60 mm/s' },
    },
    safety: {
      fumes: { level: 'Very Low', notes: 'Styrene-free. Excellent for enclosed spaces.' },
      foodSafety: { rating: 'Check Specific Grade' },
      biodegradability: { rating: 'Not Biodegradable' },
    },
  },

  'PVA': {
    name: 'PVA',
    fullName: 'Polyvinyl Alcohol',
    origin: {
      yearInvented: '1924',
      originalCompany: 'Hermann and Haehnel (first synthesis)',
      majorManufacturers: ['Ultimaker', 'Polymaker (PolyDissolve)', 'eSUN', 'Verbatim'],
    },
    composition: {
      basePolymer: 'Polyvinyl Alcohol',
      chemicalFamily: 'Water-Soluble Synthetic Polymer',
    },
    familyContext: {
      parentPolymer: 'Water-soluble vinyl polymer used as support material',
      variants: ['PVA', 'PVA+', 'PolyDissolve S1'],
      chemicalComparison: 'The original water-soluble support. More universally compatible than BVOH but extremely moisture-sensitive.',
    },
    strengths: {
      uniqueProperties: ['Completely water-soluble', 'Works with PLA, PETG, Nylon', 'Complex supports possible', 'Clean dissolution'],
      bestUseScenarios: ['Complex internal geometries', 'Overhangs impossible with breakaway', 'Dual-extrusion support', 'Engineering prototypes'],
      whyChooseThis: 'When complex support structures need to dissolve cleanly in water.',
    },
    weaknesses: {
      limitations: ['EXTREMELY moisture sensitive', 'Must be stored dry', 'Expensive', 'Requires dual extrusion', 'Dissolving takes hours'],
      commonProblems: ['Absorbs moisture in minutes', 'Brittle when dry, gummy when wet', 'Clogging from moisture', 'Stringing'],
      whenNotToUse: ['Without dry storage', 'Single extruder printers', 'When breakaway supports work'],
    },
    practicalContext: {
      commonApplications: ['Dissolvable supports for complex parts', 'Internal channels', 'Overhangs', 'Engineering models'],
      costPosition: 'Premium',
    },
    trivia: {
      funFacts: ['PVA is also the key ingredient in white glue (Elmer\'s)', 'PVA must be stored in a sealed container with desiccant — it can absorb enough moisture to become unprintable in 24 hours of open air', 'Warm water dissolves PVA much faster than cold water'],
      whyInvented: 'Developed as a water-soluble polymer for various applications. Adopted for 3D printing support.',
    },
    printSettings: {
      nozzleTemp: { min: 185, max: 215, optimal: 200 },
      bedTemp: { min: 45, max: 60, optimal: 55 },
      coolingFan: { min: 50, max: 100 },
      enclosure: { required: false },
      drying: { temp: 45, duration: '4-6 hours', notes: 'CRITICAL. Print from dry box if possible.' },
      printSpeed: { recommended: '20-40 mm/s' },
      additionalNotes: ['Store sealed with desiccant AT ALL TIMES', 'Print from dry box ideally', 'Dissolve in warm water (40-50°C) for faster results'],
    },
    safety: {
      fumes: { level: 'Very Low', notes: 'Non-toxic.' },
      foodSafety: { rating: 'Not Applicable', notes: 'Support material — dissolves away.' },
      biodegradability: { rating: 'Water Soluble', notes: 'Dissolves in water. Biodegradable.' },
    },
  },

  'HIPS': {
    name: 'HIPS',
    fullName: 'High Impact Polystyrene',
    origin: {
      yearInvented: '1950s',
      originalCompany: 'Various chemical companies',
      majorManufacturers: ['eSUN', 'Ultimaker', 'Polymaker', 'Hatchbox'],
    },
    composition: {
      basePolymer: 'Polystyrene with polybutadiene rubber impact modifier',
      chemicalFamily: 'Rubber-Modified Polystyrene',
    },
    familyContext: {
      parentPolymer: 'Polystyrene toughened with rubber for impact resistance',
      chemicalComparison: 'Dissolves in d-limonene (citrus solvent). Used as support material for ABS. Similar printing to ABS.',
    },
    strengths: {
      uniqueProperties: ['Dissolves in d-limonene', 'Excellent ABS support material', 'Light weight', 'Easy to sand', 'Cheap'],
      bestUseScenarios: ['Dissolvable supports for ABS', 'Lightweight models', 'Packaging prototypes'],
      whyChooseThis: 'The go-to support material for ABS prints needing complex supports.',
    },
    weaknesses: {
      limitations: ['Only dissolves in d-limonene (not water)', 'Limonene is expensive and slow', 'Lower strength than ABS', 'Fumes when printing'],
      commonProblems: ['Dissolution takes 12-24+ hours', 'Limonene has strong citrus smell', 'Similar printing challenges to ABS'],
      whenNotToUse: ['Without limonene supply', 'When breakaway supports suffice', 'Non-ABS prints (use PVA instead)'],
    },
    practicalContext: {
      commonApplications: ['ABS dissolvable supports', 'Packaging prototypes', 'Lightweight display models'],
      costPosition: 'Budget',
    },
    trivia: {
      funFacts: ['HIPS is the material used in most disposable cups and food containers', 'D-limonene (the solvent) is extracted from orange peels', 'HIPS was one of the first materials used in hobby 3D printing'],
    },
    printSettings: {
      nozzleTemp: { min: 220, max: 250, optimal: 235 },
      bedTemp: { min: 90, max: 110, optimal: 100 },
      coolingFan: { min: 0, max: 30 },
      enclosure: { required: true, notes: 'Same as ABS — enclosure strongly recommended.' },
      printSpeed: { recommended: '40-60 mm/s' },
      additionalNotes: ['Dissolve supports in d-limonene (12-24 hours)', 'Same printing conditions as ABS'],
    },
    safety: {
      fumes: { level: 'Moderate', notes: 'Releases styrene. Ventilation required.' },
      foodSafety: { rating: 'Not Safe', notes: 'Styrene concerns.' },
      biodegradability: { rating: 'Not Biodegradable', notes: 'Recyclable (#6 PS) but not biodegradable.' },
    },
  },

  'Breakaway': {
    name: 'Breakaway',
    fullName: 'Breakaway Support Material',
    origin: {
      majorManufacturers: ['Ultimaker', 'Polymaker', 'eSUN'],
    },
    composition: {
      basePolymer: 'Modified PLA or proprietary polymer blend',
      chemicalFamily: 'Support-Optimized Thermoplastic',
    },
    familyContext: {
      parentPolymer: 'Engineered for weak adhesion to model material — snaps off cleanly',
      chemicalComparison: 'Unlike PVA/HIPS, no chemicals needed. Just peel/snap off. Less clean than dissolvable but much faster.',
    },
    strengths: {
      uniqueProperties: ['No chemicals needed — just peel off', 'Fast removal', 'Works with many materials', 'Low cost'],
      bestUseScenarios: ['Quick support removal', 'PLA/PETG/ABS supports', 'Simple overhangs'],
      whyChooseThis: 'When you need dual-extrusion support without the hassle of dissolving.',
    },
    weaknesses: {
      limitations: ['Leaves surface marks', 'Less clean than dissolvable', 'Can\'t do fully enclosed channels', 'Requires some force to remove'],
      commonProblems: ['Support witness marks', 'Adhesion too strong or too weak depending on settings', 'Difficult on tight internal features'],
      whenNotToUse: ['Complex internal channels', 'Perfect surface finish needed', 'When PVA dissolution is acceptable'],
    },
    practicalContext: {
      commonApplications: ['General dual-extrusion supports', 'Quick prototyping', 'Simple overhangs'],
      costPosition: 'Standard',
    },
    trivia: {
      funFacts: ['Ultimaker Breakaway was one of the first dedicated breakaway filaments on the market'],
    },
    printSettings: {
      nozzleTemp: { min: 195, max: 225, optimal: 210 },
      bedTemp: { min: 50, max: 65, optimal: 55 },
      coolingFan: { min: 50, max: 100 },
      enclosure: { required: false },
      printSpeed: { recommended: '30-50 mm/s' },
      additionalNotes: ['Tune interface Z-distance for clean removal', 'Too close = hard to remove, too far = poor support'],
    },
    safety: {
      fumes: { level: 'Very Low' },
      foodSafety: { rating: 'Not Applicable', notes: 'Support material only.' },
      biodegradability: { rating: 'Varies', notes: 'Depends on base polymer.' },
    },
  },

  'PHA': {
    name: 'PHA',
    fullName: 'Polyhydroxyalkanoate',
    origin: {
      yearInvented: '1926 (discovery), 2010s (3D printing)',
      originalCompany: 'Maurice Lemoigne (discovery)',
      majorManufacturers: ['colorFabb', 'Danimer Scientific', 'KANEKA'],
    },
    composition: {
      basePolymer: 'Polyhydroxyalkanoate (biopolyester)',
      chemicalFamily: 'Bio-Produced Polyester',
      keyAdditives: ['Processing aids', 'Nucleating agents'],
    },
    familyContext: {
      parentPolymer: 'Biopolyester produced by bacterial fermentation',
      variants: ['PHB', 'PHBV', 'PHA/PLA blends'],
      chemicalComparison: 'Only truly biodegradable 3D printing material — degrades in soil, compost, and marine environments.',
    },
    strengths: {
      uniqueProperties: ['Marine biodegradable', 'Soil biodegradable', 'Home compostable', 'Produced by bacteria from organic waste'],
      bestUseScenarios: ['Environmental applications', 'Packaging prototypes', 'Marine research equipment', 'Eco demonstrations'],
      whyChooseThis: 'The only printable material that truly biodegrades in natural environments.',
    },
    weaknesses: {
      limitations: ['Very expensive', 'Difficult to print', 'Lower mechanical properties', 'Extremely limited availability as filament'],
      commonProblems: ['Narrow processing window', 'Brittleness', 'Thermal degradation during printing'],
      whenNotToUse: ['Functional parts', 'Long-lasting products', 'Budget projects'],
    },
    practicalContext: {
      commonApplications: ['Biodegradable packaging prototypes', 'Environmental research', 'Educational materials'],
      costPosition: 'Industrial',
    },
    trivia: {
      funFacts: ['PHA is literally produced by bacteria as their energy storage — like how humans store fat', 'PHA biodegrades in the ocean — unlike PLA which requires industrial composting'],
    },
    printSettings: {
      nozzleTemp: { min: 175, max: 205, optimal: 190 },
      bedTemp: { min: 40, max: 60, optimal: 50 },
      coolingFan: { min: 50, max: 100 },
      enclosure: { required: false },
      printSpeed: { recommended: '25-45 mm/s' },
    },
    safety: {
      fumes: { level: 'Very Low' },
      foodSafety: { rating: 'Generally Safe', notes: 'Used in food packaging.' },
      biodegradability: { rating: 'Fully Biodegradable', notes: 'Home compostable. Marine and soil biodegradable.' },
    },
  },

  'PCL': {
    name: 'PCL',
    fullName: 'Polycaprolactone',
    origin: {
      yearInvented: '1930s',
      majorManufacturers: ['Polymorph', 'various specialty suppliers'],
    },
    composition: {
      basePolymer: 'Polycaprolactone',
      chemicalFamily: 'Aliphatic Polyester',
    },
    familyContext: {
      parentPolymer: 'Low-melting-point biodegradable polyester',
      chemicalComparison: 'Melts at only 60°C — can be shaped by hand in hot water. Biodegradable.',
    },
    strengths: {
      uniqueProperties: ['Ultra-low melting point (60°C)', 'Can be reshaped in hot water', 'Biodegradable', 'Biocompatible', 'Very flexible'],
      bestUseScenarios: ['Custom splints', 'Moldable prototypes', 'Education', 'Medical devices', 'Art'],
      whyChooseThis: 'When you need a material that can be re-shaped by hand in hot water.',
    },
    weaknesses: {
      limitations: ['Deforms at body temperature in some cases', 'Very low heat resistance', 'Low stiffness', 'Limited filament availability'],
      commonProblems: ['Parts can deform in warm environments', 'Slow to print', 'Niche market'],
      whenNotToUse: ['Any heat exposure', 'Structural parts', 'Outdoor use'],
    },
    practicalContext: {
      commonApplications: ['Custom splints/casts', 'Hand-moldable prototypes', 'Educational models', 'Art/craft'],
      costPosition: 'Premium',
    },
    trivia: {
      funFacts: ['PCL is used in medical sutures that dissolve inside the body', 'You can reshape a PCL print by dipping it in hot water and bending it by hand'],
    },
    printSettings: {
      nozzleTemp: { min: 100, max: 150, optimal: 120 },
      bedTemp: { min: 25, max: 40, optimal: 30 },
      coolingFan: { min: 50, max: 100 },
      enclosure: { required: false },
      printSpeed: { recommended: '20-40 mm/s' },
      additionalNotes: ['Ultra-low temps — standard PLA hotend works fine', 'Will deform in hot environments (car, sun)'],
    },
    safety: {
      fumes: { level: 'Very Low' },
      foodSafety: { rating: 'Biocompatible', notes: 'Used in medical implants.' },
      biodegradability: { rating: 'Biodegradable', notes: 'Biodegrades in soil. Used in medical dissolvable sutures.' },
    },
  },

  'POM': {
    name: 'POM',
    fullName: 'Polyoxymethylene (Acetal/Delrin)',
    origin: {
      yearInvented: '1920 (polymer), 1956 (commercial)',
      originalCompany: 'DuPont (Delrin brand)',
      majorManufacturers: ['DuPont (Delrin)', 'Polymaker (PolyOxymethylene)', 'igus', 'FormFutura'],
    },
    composition: {
      basePolymer: 'Polyoxymethylene (acetal)',
      chemicalFamily: 'Polyacetal',
      keyAdditives: ['Stabilizers', 'Processing aids'],
    },
    familyContext: {
      parentPolymer: 'Semi-crystalline acetal polymer',
      variants: ['POM-H (homopolymer/Delrin)', 'POM-C (copolymer/Celcon)'],
      chemicalComparison: 'The "gear material" — lowest friction coefficient of any thermoplastic. Self-lubricating.',
    },
    strengths: {
      uniqueProperties: ['Lowest friction of any printable plastic', 'Self-lubricating', 'Excellent wear resistance', 'High stiffness', 'Excellent fatigue life'],
      bestUseScenarios: ['Gears', 'Bearings', 'Bushings', 'Sliding mechanisms', 'Wear-critical parts'],
      advantagesOverCompetitors: ['Unmatched friction properties', 'Better wear than nylon', 'Self-lubricating — no grease needed'],
      whyChooseThis: 'When you need gears, bearings, or any part with low friction and high wear resistance.',
    },
    weaknesses: {
      limitations: ['TERRIBLE bed adhesion — worse than PP', 'Releases toxic formaldehyde if overheated', 'Requires POM-specific adhesion', 'Warps severely'],
      commonProblems: ['Parts detach during printing', 'CAUTION: formaldehyde release', 'Extreme warping', 'Very few succeed on first try'],
      whenNotToUse: ['WITHOUT proper ventilation', 'Without POM-specific bed adhesion', 'Beginners', 'Unventilated spaces'],
    },
    practicalContext: {
      commonApplications: ['Gears', 'Bearings', 'Bushings', 'Conveyor components', 'Zippers', 'Fuel system parts'],
      costPosition: 'Premium',
    },
    trivia: {
      funFacts: ['Delrin is used in every zipper, many gears, and most conveyor belt guides worldwide', 'POM has been called the "metal substitute" due to its mechanical properties', '⚠️ POM releases formaldehyde gas if overheated — NEVER exceed recommended temps'],
      whyInvented: 'Industry needed a self-lubricating, wear-resistant plastic to replace metal in gears and bearings.',
    },
    tdsProfile: {
      properties: [
        { name: 'Tensile Strength', value: '60-70', unit: 'MPa', implications: 'High strength — comparable to nylon.' },
        { name: 'Friction Coefficient', value: '0.15-0.35', unit: '', implications: 'Lowest of any plastic. Self-lubricating.' },
        { name: 'Wear Rate', value: 'Very Low', unit: '', implications: 'Outstanding wear resistance.' },
        { name: 'HDT', value: '95-115', unit: '°C', implications: 'Good heat resistance.' },
      ],
    },
    printSettings: {
      nozzleTemp: { min: 200, max: 225, optimal: 210 },
      bedTemp: { min: 90, max: 120, optimal: 110 },
      coolingFan: { min: 0, max: 30, notes: 'Minimal cooling.' },
      enclosure: { required: true, notes: 'CRITICAL for both warping prevention and fume containment.' },
      printSpeed: { recommended: '20-40 mm/s' },
      additionalNotes: ['⚠️ RELEASES FORMALDEHYDE IF OVERHEATED', 'POM-specific bed tape or Magigoo POM required', 'NEVER exceed 225°C nozzle temp', 'HEPA + carbon filtration MANDATORY'],
    },
    safety: {
      fumes: { level: 'High', notes: '⚠️ DANGER: Releases formaldehyde gas. HEPA + carbon filtration MANDATORY. Never print without proper ventilation and filtration.' },
      foodSafety: { rating: 'FDA Grades Available', notes: 'Some POM grades are FDA food-contact approved (injection molded). 3D printed parts not certified.' },
      biodegradability: { rating: 'Not Biodegradable' },
    },
  },

  'PMMA': {
    name: 'PMMA',
    fullName: 'Polymethyl Methacrylate (Acrylic)',
    origin: {
      yearInvented: '1928',
      originalCompany: 'Röhm (Plexiglas brand)',
      majorManufacturers: ['FormFutura', 'Herz', 'specialty suppliers'],
    },
    composition: {
      basePolymer: 'Polymethyl Methacrylate',
      chemicalFamily: 'Acrylic Polymer',
    },
    familyContext: {
      parentPolymer: 'Acrylic glass — transparent thermoplastic',
      variants: ['PMMA', 'Plexiglas', 'Acrylic'],
      chemicalComparison: 'Best optical clarity of any printable plastic. 92% light transmission vs glass at 90%.',
    },
    strengths: {
      uniqueProperties: ['Best optical clarity of any plastic', '92% light transmission', 'UV resistant', 'Scratch resistant', 'Weatherable'],
      bestUseScenarios: ['Optical prototypes', 'Lens covers', 'Display cases', 'Light guides', 'Signage'],
      whyChooseThis: 'When optical clarity is the number one priority.',
    },
    weaknesses: {
      limitations: ['Brittle', 'Requires high temps', 'Difficult to print', 'Limited filament availability', 'Prone to cracking'],
      commonProblems: ['Cracking from internal stress', 'Layer lines reduce clarity', 'Warping'],
      whenNotToUse: ['Impact-critical parts', 'Beginners', 'When PLA Crystal suffices for transparency'],
    },
    practicalContext: {
      commonApplications: ['Optical prototypes', 'Light guides', 'Display cases', 'Lens covers', 'Signage prototypes'],
      costPosition: 'Premium',
    },
    trivia: {
      funFacts: ['PMMA (Plexiglas) transmits more visible light than glass', 'Used in aircraft windows since WWII', 'Your car\'s tail light lenses are PMMA'],
    },
    printSettings: {
      nozzleTemp: { min: 230, max: 260, optimal: 245 },
      bedTemp: { min: 80, max: 110, optimal: 95 },
      coolingFan: { min: 0, max: 30 },
      enclosure: { required: true, notes: 'Strongly recommended to prevent cracking.' },
      drying: { temp: 80, duration: '4-6 hours' },
      printSpeed: { recommended: '20-40 mm/s' },
    },
    safety: {
      fumes: { level: 'Moderate', notes: 'MMA monomer vapors. Good ventilation required.' },
      foodSafety: { rating: 'FDA Grades Available', notes: 'Used in food displays and medical devices.' },
      biodegradability: { rating: 'Not Biodegradable' },
    },
  },

  'HDPE': {
    name: 'HDPE',
    fullName: 'High-Density Polyethylene',
    origin: {
      yearInvented: '1953',
      originalCompany: 'Karl Ziegler (Ziegler-Natta catalyst)',
      majorManufacturers: ['Felfil', 'specialty recycling filament makers'],
    },
    composition: {
      basePolymer: 'High-Density Polyethylene',
      chemicalFamily: 'Polyolefin',
    },
    familyContext: {
      parentPolymer: 'Polyolefin family — sister to PP and LDPE',
      chemicalComparison: 'Even worse bed adhesion than PP. Same chemical resistance family. Most produced plastic globally.',
    },
    strengths: {
      uniqueProperties: ['Excellent chemical resistance', 'Food safe', 'Extremely cheap', 'Lightweight', 'Impact resistant'],
      bestUseScenarios: ['Chemical containers', 'Food-safe prototypes', 'Recycled filament projects'],
      whyChooseThis: 'When you need the ultimate chemical resistance at minimal cost (usually from recycled sources).',
    },
    weaknesses: {
      limitations: ['Nearly impossible bed adhesion', 'Extreme warping', 'Very rare as filament', 'Terrible surface quality'],
      commonProblems: ['Parts will not stick to any standard bed surface', 'Massive warping', 'Poor layer adhesion'],
      whenNotToUse: ['Without specialized equipment', 'Anyone expecting good results on a desktop printer'],
    },
    practicalContext: {
      commonApplications: ['Mostly used in recycled filament experiments', 'Chemical resistance prototypes'],
      costPosition: 'Budget',
    },
    trivia: {
      funFacts: ['HDPE is the most recycled plastic in the world', 'Your milk jug, detergent bottle, and cutting board are all HDPE', 'Some makers recycle HDPE bottles into filament as a sustainability project'],
    },
    printSettings: {
      nozzleTemp: { min: 220, max: 260, optimal: 240 },
      bedTemp: { min: 90, max: 120, optimal: 105 },
      coolingFan: { min: 0, max: 20 },
      enclosure: { required: true },
      printSpeed: { recommended: '20-40 mm/s' },
      additionalNotes: ['HDPE bed tape (packing tape) required', 'Expect very poor results', 'Mostly a curiosity/recycling project'],
    },
    safety: {
      fumes: { level: 'Low', notes: 'Low emissions but ventilate.' },
      foodSafety: { rating: 'FDA Approved', notes: 'HDPE is one of the safest food-contact plastics.' },
      biodegradability: { rating: 'Not Biodegradable', notes: 'Recyclable (#2) but not biodegradable.' },
    },
  },

  'Cleaning': {
    name: 'Cleaning',
    fullName: 'Nozzle Cleaning Filament',
    origin: {
      majorManufacturers: ['eSUN', 'Polymaker', 'NovaMaker', 'various'],
    },
    composition: {
      basePolymer: 'Purging compound (typically modified polyolefin or proprietary)',
      chemicalFamily: 'Purging/Cleaning Compound',
    },
    familyContext: {
      parentPolymer: 'Not a printing material — designed to clean residue from nozzles/hotends',
      chemicalComparison: 'Soft, high-flow material that scrubs residual carbon and degraded polymer from the hotend bore.',
    },
    strengths: {
      uniqueProperties: ['Cleans carbonized residue from hotends', 'Removes color contamination between filament changes', 'Extends nozzle life'],
      bestUseScenarios: ['Between material changes', 'After printing abrasive materials', 'Clearing partial clogs', 'Routine maintenance'],
      whyChooseThis: 'Essential maintenance material — prevents clogs and removes color contamination.',
    },
    weaknesses: {
      limitations: ['Not a printing material', 'Cannot be used for parts', 'Expensive per gram for what it is'],
      commonProblems: ['Users sometimes expect it to fix severe clogs (it can\'t)'],
      whenNotToUse: ['For actual printing', 'Fully blocked nozzles (need cold pull or replacement)'],
    },
    practicalContext: {
      commonApplications: ['Nozzle cleaning', 'Color changes', 'Material changes', 'Preventive maintenance'],
      costPosition: 'Premium',
    },
    trivia: {
      funFacts: ['Running 10cm of cleaning filament between material changes can extend nozzle life significantly'],
    },
    printSettings: {
      nozzleTemp: { min: 190, max: 260, optimal: 230 },
      bedTemp: { min: 0, max: 0 },
      coolingFan: { min: 0, max: 0 },
      enclosure: { required: false },
      printSpeed: { recommended: 'Manual extrusion only' },
      additionalNotes: ['Heat to target material\'s temperature', 'Manually push through 10-20cm', 'Not for actual printing — maintenance only'],
    },
    safety: {
      fumes: { level: 'Low' },
      foodSafety: { rating: 'Not Applicable' },
      biodegradability: { rating: 'Not Applicable' },
    },
  },
};
