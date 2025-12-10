// Comprehensive material reference data for the encyclopedia

export interface TDSProperty {
  name: string;
  value: string;
  unit?: string;
  implications?: string;
}

export interface MaterialReferenceInfo {
  name: string;
  fullName: string;
  
  // Origin & History
  origin: {
    yearInvented?: string;
    originalCompany?: string;
    keyMilestones?: string[];
    majorManufacturers?: string[];
  };
  
  // Chemical Composition
  composition: {
    basePolymer: string;
    chemicalFamily: string;
    keyAdditives?: string[];
    coloringAgents?: string;
    specialFillers?: string[];
  };
  
  // Material Family Context
  familyContext: {
    parentPolymer?: string;
    variants?: string[];
    chemicalComparison?: string;
    evolution?: string;
  };
  
  // Strengths
  strengths: {
    uniqueProperties?: string[];
    bestUseScenarios?: string[];
    advantagesOverCompetitors?: string[];
    whyChooseThis?: string;
  };
  
  // Weaknesses
  weaknesses: {
    limitations?: string[];
    commonProblems?: string[];
    environmentalConcerns?: string[];
    whenNotToUse?: string[];
  };
  
  // Practical Context
  practicalContext: {
    industryAdoption?: string[];
    commonApplications?: string[];
    safetyStandards?: string[];
    costPosition: 'Budget' | 'Standard' | 'Premium' | 'Industrial';
  };
  
  // Trivia & Background
  trivia: {
    funFacts?: string[];
    whyInvented?: string;
    controversies?: string[];
    marketAdoption?: string;
  };
  
  // Technical Data Sheet Profile
  tdsProfile?: {
    properties: TDSProperty[];
    notes?: string;
  };
  
  // Operational Rheology (Print Settings)
  printSettings?: {
    nozzleTemp?: { min: number; max: number; optimal?: number };
    bedTemp?: { min: number; max: number; optimal?: number };
    coolingFan?: { min: number; max: number; notes?: string };
    enclosure?: { required: boolean; notes?: string };
    drying?: { temp?: number; duration?: string; notes?: string };
    printSpeed?: { recommended?: string; notes?: string };
    additionalNotes?: string[];
  };
  
  // Adhesion & Multi-Material Compatibility
  adhesion?: {
    bedSurfaces?: {
      excellent?: string[];
      good?: string[];
      poor?: string[];
    };
    releaseAgents?: string;
    multiMaterial?: {
      material: string;
      bondQuality: 'Strong Chemical Bond' | 'Mechanical Bond' | 'Weak Bond' | 'No Bond';
      notes?: string;
    }[];
  };
  
  // Post-Processing
  postProcessing?: {
    chemicalSmoothing?: {
      method: string;
      effectiveness: 'Excellent' | 'Good' | 'Difficult' | 'Not Possible';
      notes?: string;
    }[];
    mechanical?: string[];
    glues?: string[];
    painting?: string;
  };
  
  // Safety & Sustainability
  safety?: {
    fumes?: { level: 'Very Low' | 'Low' | 'Moderate' | 'High'; notes?: string };
    foodSafety?: { rating: string; notes?: string };
    biodegradability?: { rating: string; notes?: string };
    additionalNotes?: string[];
  };
}

export const MATERIAL_REFERENCE_DATA: Record<string, MaterialReferenceInfo> = {
  'PLA': {
    name: 'PLA',
    fullName: 'Polylactic Acid',
    origin: {
      yearInvented: '1932 (first synthesized), 2000s (3D printing adoption)',
      originalCompany: 'Wallace Carothers at DuPont (original synthesis)',
      keyMilestones: [
        '1932: First synthesized by Wallace Carothers',
        '1989: Cargill begins developing PLA for commercial use',
        '2002: NatureWorks opens first large-scale PLA production facility',
        '2007-2010: Becomes the dominant 3D printing material',
        '2015+: PLA+ and enhanced variants emerge',
      ],
      majorManufacturers: ['NatureWorks (Ingeo)', 'Total Corbion', 'Hatchbox', 'Polymaker', 'Prusament', 'eSUN', 'Overture'],
    },
    composition: {
      basePolymer: 'Polylactic Acid (PLA)',
      chemicalFamily: 'Aliphatic Polyester',
      keyAdditives: ['Plasticizers for flexibility', 'Nucleating agents for crystallization', 'UV stabilizers (some grades)'],
      coloringAgents: 'Organic and inorganic pigments, masterbatch colorants',
      specialFillers: ['Wood particles (Wood PLA)', 'Carbon fiber (PLA-CF)', 'Metallic powders (PLA-Metal)', 'Glow-in-dark phosphors'],
    },
    familyContext: {
      parentPolymer: 'Derived from lactic acid (fermented corn starch, sugarcane)',
      variants: ['PLA+', 'HTPLA', 'PLA-CF', 'PLA-Silk', 'PLA-Wood', 'PLA-Matte', 'LW-PLA'],
      chemicalComparison: 'Similar to PET in some properties but biodegradable. Lower heat resistance than PETG or ABS.',
      evolution: 'Started as basic biodegradable plastic, evolved into dozens of specialty variants for specific applications.',
    },
    strengths: {
      uniqueProperties: ['Biodegradable under industrial conditions', 'Low warping', 'Pleasant smell when printing', 'Excellent detail reproduction'],
      bestUseScenarios: ['Prototyping', 'Decorative items', 'Low-stress parts', 'Educational projects', 'Cosplay props'],
      advantagesOverCompetitors: ['Easiest material to print', 'No heated bed required (though recommended)', 'No enclosure needed', 'Wide color selection'],
      whyChooseThis: 'Best starting material for beginners, excellent for visual models and prototypes where heat resistance is not critical.',
    },
    weaknesses: {
      limitations: ['Low heat resistance (~55°C)', 'Brittle compared to PETG/ABS', 'Degrades in UV light', 'Not suitable for outdoor use'],
      commonProblems: ['Stringing', 'Brittleness over time', 'Heat deformation in cars/sun'],
      environmentalConcerns: ['Only biodegrades in industrial composting facilities', 'Often marketed misleadingly as "eco-friendly"', 'Derived from food crops'],
      whenNotToUse: ['Functional outdoor parts', 'High-temperature applications', 'Parts requiring flexibility', 'Load-bearing mechanical components'],
    },
    practicalContext: {
      industryAdoption: ['Consumer products', 'Prototyping', 'Education', 'Medical (specific grades)', 'Packaging'],
      commonApplications: ['Phone cases', 'Figurines', 'Architectural models', 'Cosplay armor', 'Teaching aids'],
      safetyStandards: ['FDA approved for food contact (specific grades)', 'Generally considered safe for printing'],
      costPosition: 'Budget',
    },
    trivia: {
      funFacts: [
        'PLA accounts for over 60% of all FDM filament sold globally',
        'The "corn smell" when printing is actually lactic acid vapor',
        'Some PLA is made from sugarcane in Asia, corn in the US',
      ],
      whyInvented: 'Originally developed as a biodegradable alternative to petroleum-based plastics for packaging.',
      controversies: [
        'Biodegradability claims are misleading - requires industrial composting',
        'Competition with food crops for raw materials',
        'Some "PLA+" formulations contain undisclosed additives',
      ],
      marketAdoption: 'Instant success in 3D printing - became dominant within 2 years of widespread FDM printer availability.',
    },
    // Technical Data Sheet Profile
    tdsProfile: {
      properties: [
        { name: 'Tensile Strength', value: '50-65', unit: 'MPa', implications: 'High. Stronger than ABS in pure tension, but fails catastrophically (snaps) rather than stretching.' },
        { name: 'Elongation at Break', value: '4-6', unit: '%', implications: 'Very Low. Extremely brittle. Not suitable for snap-fits or parts undergoing repetitive bending.' },
        { name: "Young's Modulus", value: '2300-3500', unit: 'MPa', implications: 'High Stiffness. Very rigid; resists bending well until the breaking point.' },
        { name: 'Impact Strength (Notched)', value: '~26', unit: 'kJ/m²', implications: 'Low. Drops easily shatter it. "Tough PLA" or "PLA+" significantly improves this.' },
        { name: 'Glass Transition (Tg)', value: '55-60', unit: '°C', implications: 'Critical Weakness. Parts will soften and deform in a hot car or dishwasher.' },
        { name: 'Heat Deflection (HDT)', value: '~55', unit: '°C (0.45 MPa)', implications: 'Service temperature limit. Annealing can raise this to ~80°C but causes shrinkage.' },
      ],
      notes: 'Typical values for standard PLA printed flat (XY orientation).',
    },
    // Print Settings
    printSettings: {
      nozzleTemp: { min: 190, max: 220 },
      bedTemp: { min: 35, max: 60, optimal: 50 },
      coolingFan: { min: 100, max: 100, notes: 'PLA remains viscous for a long time; rapid cooling is required to lock in fine details and bridges.' },
      enclosure: { required: false, notes: 'Open Air. An enclosure is detrimental; trapped heat causes the filament to soften in the "cold end" of the extruder, leading to jams (Heat Creep).' },
      drying: { temp: 45, duration: '4-6 hours', notes: 'Hygroscopic. If stringing occurs, dry at 40°C – 50°C for 4–6 hours.' },
      printSpeed: { recommended: '40-100 mm/s', notes: 'Can print on a cold bed with proper adhesion aids (glue/tape).' },
    },
    // Adhesion & Multi-Material
    adhesion: {
      bedSurfaces: {
        excellent: ['PEI (Smooth)', 'PEI (Textured)', 'Glass', 'Blue Tape'],
        good: ['BuildTak', 'Garolite'],
        poor: ['Bare Aluminum'],
      },
      releaseAgents: 'Generally not needed for Textured PEI. Glue stick recommended for Smooth PEI or Glass to aid release.',
      multiMaterial: [
        { material: 'TPU', bondQuality: 'Strong Chemical Bond', notes: 'Ideal for rigid parts with soft-touch grips or tires.' },
        { material: 'PETG', bondQuality: 'No Bond', notes: 'They repel each other. Use PLA as a "0-distance" interface support for PETG prints to achieve perfect overhangs (and vice-versa).' },
        { material: 'PVA', bondQuality: 'Strong Chemical Bond', notes: 'PVA is the standard water-soluble support material for PLA.' },
        { material: 'HIPS', bondQuality: 'No Bond', notes: 'No adhesion between these materials.' },
      ],
    },
    // Post-Processing
    postProcessing: {
      chemicalSmoothing: [
        { method: 'Acetone', effectiveness: 'Not Possible', notes: 'No effect on PLA.' },
        { method: 'THF (Tetrahydrofuran)', effectiveness: 'Good', notes: 'Effective but highly toxic and difficult to handle. Not recommended for home users.' },
        { method: 'Ethyl Acetate', effectiveness: 'Good', notes: 'Works but requires careful handling and ventilation.' },
      ],
      mechanical: ['Sands easily with 200-400 grit', 'Can be primed and painted with acrylics', 'Heat gun can smooth surfaces (carefully)'],
      glues: ['Cyanoacrylate (Super Glue) works instantly', 'Epoxy is excellent for structural bonding', 'PLA-specific welding with friction or hot air'],
      painting: 'Accepts acrylic and enamel paints well. Priming recommended for best adhesion.',
    },
    // Safety & Sustainability
    safety: {
      fumes: { level: 'Low', notes: 'Emits lactides (sweet smell). Considered safe for home/classroom use, though good ventilation is always recommended to remove Ultrafine Particles (UFPs).' },
      foodSafety: { rating: 'Technical, but not Practical', notes: 'Pure PLA is FDA GRAS (Generally Recognized As Safe). However, FDM printed parts have layer lines that trap bacteria (Salmonella/E. coli) which cannot be cleaned. Brass nozzles also leach lead. Verdict: Use only for single-use items or seal with food-grade epoxy.' },
      biodegradability: { rating: 'Industrial Only', notes: 'PLA does not decompose in nature or home compost bins. It requires an industrial facility with sustained temperatures >60°C and specific microbial activity to break down. In a landfill, it persists for decades like regular plastic.' },
      additionalNotes: [
        'Considered one of the safest materials to print',
        'No styrene emissions (unlike ABS)',
        'Low ultrafine particle emission compared to ABS',
      ],
    },
  },

  'PETG': {
    name: 'PETG',
    fullName: 'Polyethylene Terephthalate Glycol-modified',
    origin: {
      yearInvented: '1970s (development), 2015+ (3D printing mainstream)',
      originalCompany: 'Eastman Chemical Company (Eastar copolyester line)',
      keyMilestones: [
        '1970s: PETG copolyester developed for thermoforming',
        '2014-2015: Introduced to FDM 3D printing market',
        '2017+: Becomes go-to "functional parts" material',
        '2020+: PETG-CF and specialty variants emerge',
      ],
      majorManufacturers: ['Eastman (raw material)', 'Prusament', 'Polymaker', 'eSUN', 'Hatchbox', 'Overture', 'Bambu Lab'],
    },
    composition: {
      basePolymer: 'PETG (Polyethylene Terephthalate Glycol-modified)',
      chemicalFamily: 'Polyester (Copolyester)',
      keyAdditives: ['Impact modifiers', 'Clarity enhancers', 'Processing aids'],
      coloringAgents: 'Transparent and opaque pigments, maintains clarity in translucent grades',
      specialFillers: ['Carbon fiber (PETG-CF)', 'Glass fiber (PETG-GF)'],
    },
    familyContext: {
      parentPolymer: 'Modified version of PET (the plastic in water bottles)',
      variants: ['PETG', 'PETG-CF', 'Pro PETG', 'rPETG (recycled)', 'ESD-PETG'],
      chemicalComparison: 'The glycol modification prevents crystallization, making it more flexible and less brittle than PET.',
      evolution: 'Evolved from industrial thermoforming plastic to become the second-most popular FDM material.',
    },
    strengths: {
      uniqueProperties: ['Excellent layer adhesion', 'Chemical resistance', 'Good clarity/transparency', 'Impact resistant'],
      bestUseScenarios: ['Functional parts', 'Food containers', 'Mechanical components', 'Outdoor parts (with UV coating)'],
      advantagesOverCompetitors: ['Easier than ABS, stronger than PLA', 'No enclosure required', 'Good chemical resistance', 'Food-safe potential'],
      whyChooseThis: 'The ideal middle-ground material when PLA is too weak but ABS is too difficult to print.',
    },
    weaknesses: {
      limitations: ['Scratches easily', 'Strings more than PLA', 'Sensitive to moisture', 'Poor UV resistance'],
      commonProblems: ['Stringing', 'Bed adhesion issues (sticks TOO well)', 'Moisture absorption', 'Hairy prints'],
      environmentalConcerns: ['Not biodegradable', 'Recycling infrastructure limited for this grade'],
      whenNotToUse: ['When scratch resistance is critical', 'Long-term outdoor exposure', 'High-temperature applications (>70°C)'],
    },
    practicalContext: {
      industryAdoption: ['Consumer products', 'Packaging', 'Food service', 'Medical devices', 'Signage'],
      commonApplications: ['Tool handles', 'Enclosures', 'Brackets', 'Food containers', 'Transparent parts'],
      safetyStandards: ['FDA food contact approved (specific grades)', 'Generally safe for printing'],
      costPosition: 'Standard',
    },
    trivia: {
      funFacts: [
        'PETG is essentially "water bottle plastic" modified to not crystallize',
        'The G stands for Glycol, which is added during polymerization',
        'Popular in the sign-making industry long before 3D printing',
      ],
      whyInvented: 'Created for thermoforming applications requiring impact resistance and clarity that regular PET couldn\'t provide.',
      controversies: [
        'Food-safe claims require specific certification, not all PETG is food-safe',
        'Often sticks to PEI beds so well it damages the surface',
      ],
      marketAdoption: 'Gradual adoption from 2015, became mainstream by 2018 as the "step up from PLA" material.',
    },
    tdsProfile: {
      properties: [
        { name: 'Tensile Strength', value: '45-55', unit: 'MPa', implications: 'Moderate. Good balance of strength and flexibility.' },
        { name: 'Elongation at Break', value: '100-200', unit: '%', implications: 'High. Much more ductile than PLA, will stretch before breaking.' },
        { name: "Young's Modulus", value: '1800-2100', unit: 'MPa', implications: 'Moderate stiffness. More flexible than PLA but still reasonably rigid.' },
        { name: 'Impact Strength (Notched)', value: '70-80', unit: 'kJ/m²', implications: 'High. Significantly better impact resistance than PLA.' },
        { name: 'Glass Transition (Tg)', value: '75-80', unit: '°C', implications: 'Better than PLA. Survives warmer environments but not extreme heat.' },
        { name: 'Heat Deflection (HDT)', value: '~70', unit: '°C (0.45 MPa)', implications: 'Moderate heat resistance. Safe for most indoor applications.' },
      ],
      notes: 'Typical values for standard PETG printed flat (XY orientation).',
    },
    printSettings: {
      nozzleTemp: { min: 220, max: 250, optimal: 235 },
      bedTemp: { min: 70, max: 85, optimal: 80 },
      coolingFan: { min: 30, max: 70, notes: 'Some cooling needed but less than PLA. Too much causes layer adhesion issues.' },
      enclosure: { required: false, notes: 'Not required but can help with large parts to reduce warping.' },
      drying: { temp: 65, duration: '4-6 hours', notes: 'More hygroscopic than PLA. Dry if stringing or bubbling occurs.' },
      printSpeed: { recommended: '40-80 mm/s', notes: 'Slower than PLA for best results. Prone to stringing at high speeds.' },
    },
    adhesion: {
      bedSurfaces: {
        excellent: ['PEI (Textured)', 'Glass with glue', 'BuildTak'],
        good: ['Blue Tape', 'PEI (Smooth) with release agent'],
        poor: ['Bare PEI (sticks TOO well, can damage surface)'],
      },
      releaseAgents: 'CRITICAL for smooth PEI. Use glue stick or Windex as release agent to prevent bed damage.',
      multiMaterial: [
        { material: 'PLA', bondQuality: 'No Bond', notes: 'They repel each other. Use as interface support material.' },
        { material: 'TPU', bondQuality: 'Weak Bond', notes: 'Possible but not recommended for structural use.' },
        { material: 'PVA', bondQuality: 'Weak Bond', notes: 'Better compatibility than with PLA but still not ideal.' },
      ],
    },
    postProcessing: {
      chemicalSmoothing: [
        { method: 'Acetone', effectiveness: 'Not Possible', notes: 'No effect on PETG.' },
        { method: 'Dichloromethane', effectiveness: 'Good', notes: 'Works but extremely toxic. Professional use only.' },
      ],
      mechanical: ['Sands well but softens with friction heat', 'Scratches easily - handle with care', 'Can be polished with fine grits'],
      glues: ['Cyanoacrylate (Super Glue) works well', 'Epoxy excellent for structural bonds', 'Solvent welding possible with MEK'],
      painting: 'Accepts paints well after light sanding. Primer recommended for best adhesion.',
    },
    safety: {
      fumes: { level: 'Low', notes: 'Lower emissions than ABS. Generally safe with basic ventilation.' },
      foodSafety: { rating: 'Possible with Certification', notes: 'FDA approved grades exist. Same bacteria concerns as PLA apply. Use food-safe grades and new stainless steel nozzles.' },
      biodegradability: { rating: 'Not Biodegradable', notes: 'Petroleum-based plastic. Should be recycled through proper channels if available.' },
    },
  },

  'ABS': {
    name: 'ABS',
    fullName: 'Acrylonitrile Butadiene Styrene',
    origin: {
      yearInvented: '1948',
      originalCompany: 'Multiple companies developed it simultaneously - BASF, Dow, Monsanto',
      keyMilestones: [
        '1948: First synthesized and patented',
        '1954: Commercial production begins',
        '1958: LEGO begins using ABS for bricks (still does today)',
        '2009: Early RepRap printers adopt ABS',
        '2015+: ASA emerges as outdoor-friendly alternative',
      ],
      majorManufacturers: ['BASF', 'LG Chem', 'SABIC', 'Chi Mei', 'Hatchbox', 'eSUN', 'Polymaker'],
    },
    composition: {
      basePolymer: 'ABS (Terpolymer of Acrylonitrile, Butadiene, Styrene)',
      chemicalFamily: 'Styrenic Polymer',
      keyAdditives: ['Flame retardants (FR-ABS)', 'UV stabilizers', 'Impact modifiers'],
      coloringAgents: 'Wide range of opaque pigments, excellent color consistency',
      specialFillers: ['Carbon fiber (ABS-CF)', 'Glass fiber (ABS-GF)'],
    },
    familyContext: {
      parentPolymer: 'Blend of three monomers: Acrylonitrile (rigidity), Butadiene (toughness), Styrene (processability)',
      variants: ['ABS', 'ABS+', 'ABS-CF', 'ABS-GF', 'FR-ABS', 'ESD-ABS', 'ABS HT'],
      chemicalComparison: 'More heat resistant than PLA/PETG, but less than PC or Nylon. More flexible than PLA.',
      evolution: 'Original workhorse industrial plastic, adapted for 3D printing but largely replaced by ASA for outdoor use.',
    },
    strengths: {
      uniqueProperties: ['Excellent impact resistance', 'Can be acetone smoothed', 'Good heat resistance', 'Machineable and paintable'],
      bestUseScenarios: ['Automotive parts', 'Electronics housings', 'Functional prototypes', 'LEGO-compatible parts'],
      advantagesOverCompetitors: ['Industry-proven material', 'Acetone vapor smoothing', 'Easy to post-process', 'Good dimensional stability'],
      whyChooseThis: 'When you need the same material properties used in commercial injection molding for functional parts.',
    },
    weaknesses: {
      limitations: ['Requires enclosure', 'Warps significantly', 'Emits styrene fumes', 'UV degradation'],
      commonProblems: ['Warping and layer splitting', 'Bed adhesion issues', 'Fumes require ventilation', 'Cracking in cold environments'],
      environmentalConcerns: ['Not biodegradable', 'Petroleum-based', 'Fumes contain volatile organics', 'Difficult to recycle mixed colors'],
      whenNotToUse: ['Outdoor/UV exposure', 'When proper ventilation unavailable', 'Printers without enclosures', 'Food contact'],
    },
    practicalContext: {
      industryAdoption: ['Automotive', 'Electronics', 'Consumer goods', 'Medical devices', 'Toys (LEGO)'],
      commonApplications: ['LEGO bricks', 'Car dashboards', 'Power tool housings', 'Keyboard keycaps', 'Appliance housings'],
      safetyStandards: ['UL94 flame ratings available', 'Various automotive standards', 'FDA compliant grades exist'],
      costPosition: 'Standard',
    },
    trivia: {
      funFacts: [
        'LEGO has used ABS since 1958 - over 400 billion bricks made',
        'ABS can be chemically welded with acetone',
        'The "new car smell" is partly from ABS off-gassing',
        'Most 3D printer frames and parts are made from ABS injection molding',
      ],
      whyInvented: 'Created to combine the rigidity of acrylonitrile, the toughness of butadiene, and the easy processing of styrene.',
      controversies: [
        'Styrene fumes are a health concern - IARC lists styrene as "possibly carcinogenic"',
        'Early RepRap printers had no enclosures, leading to poor prints and fume exposure',
        'Largely being replaced by ASA for outdoor applications',
      ],
      marketAdoption: 'Was THE 3D printing material in the early days (2009-2015), now declining in favor of easier alternatives.',
    },
    tdsProfile: {
      properties: [
        { name: 'Tensile Strength', value: '40-50', unit: 'MPa', implications: 'Good. Slightly lower than PLA but much more impact resistant.' },
        { name: 'Elongation at Break', value: '10-25', unit: '%', implications: 'Moderate. Will deform before breaking, unlike brittle PLA.' },
        { name: "Young's Modulus", value: '2000-2600', unit: 'MPa', implications: 'Good stiffness. Similar to PLA but with better toughness.' },
        { name: 'Impact Strength (Notched)', value: '200-300', unit: 'J/m', implications: 'Excellent. This is ABS\'s main advantage - very tough material.' },
        { name: 'Glass Transition (Tg)', value: '100-105', unit: '°C', implications: 'High. Can survive hot environments like car interiors.' },
        { name: 'Heat Deflection (HDT)', value: '~95', unit: '°C (0.45 MPa)', implications: 'Good heat resistance. Suitable for functional parts near heat sources.' },
      ],
      notes: 'Typical values for standard ABS printed in enclosed chamber.',
    },
    printSettings: {
      nozzleTemp: { min: 230, max: 260, optimal: 245 },
      bedTemp: { min: 90, max: 110, optimal: 100 },
      coolingFan: { min: 0, max: 30, notes: 'Minimal cooling. Too much fan causes warping and layer splitting.' },
      enclosure: { required: true, notes: 'REQUIRED. Without enclosure, warping and layer splitting are almost guaranteed. Chamber temp 45-60°C ideal.' },
      drying: { temp: 80, duration: '4-6 hours', notes: 'Hygroscopic. Moisture causes bubbling, poor surface finish, and weak layer adhesion.' },
      printSpeed: { recommended: '40-60 mm/s', notes: 'Moderate speeds. First layer should be very slow (20 mm/s).' },
      additionalNotes: ['Use brim for bed adhesion', 'Avoid drafts - even small air currents cause warping', 'Let parts cool slowly in enclosure'],
    },
    adhesion: {
      bedSurfaces: {
        excellent: ['ABS Slurry (ABS dissolved in acetone)', 'Garolite (G10/FR4)', 'PEI (Textured)'],
        good: ['Kapton Tape with glue', 'Glass with ABS juice'],
        poor: ['Bare glass', 'Blue tape (at high temps)'],
      },
      releaseAgents: 'ABS slurry or glue stick recommended. Parts may stick too well - let bed cool completely before removal.',
      multiMaterial: [
        { material: 'ASA', bondQuality: 'Strong Chemical Bond', notes: 'Similar chemistry, excellent adhesion between materials.' },
        { material: 'HIPS', bondQuality: 'Strong Chemical Bond', notes: 'HIPS is the standard dissolvable support for ABS (limonene soluble).' },
        { material: 'TPU', bondQuality: 'Mechanical Bond', notes: 'Reasonable adhesion for functional parts.' },
        { material: 'PLA', bondQuality: 'No Bond', notes: 'No adhesion between these materials.' },
      ],
    },
    postProcessing: {
      chemicalSmoothing: [
        { method: 'Acetone Vapor', effectiveness: 'Excellent', notes: 'The signature ABS post-processing method. Creates glass-like finish.' },
        { method: 'Acetone Brush/Dip', effectiveness: 'Good', notes: 'Faster than vapor but less uniform. Good for quick smoothing.' },
      ],
      mechanical: ['Sands easily', 'Can be machined (drilling, tapping)', 'Excellent for gap filling with ABS slurry'],
      glues: ['Acetone chemically welds ABS to itself', 'Cyanoacrylate works well', 'ABS cement (acetone + dissolved ABS) creates invisible joints'],
      painting: 'Excellent paint adhesion. The acetone smoothing process creates ideal surface for painting.',
    },
    safety: {
      fumes: { level: 'Moderate', notes: 'Emits styrene and other VOCs. REQUIRES good ventilation or enclosure with filtration. Not recommended for classrooms or bedrooms.' },
      foodSafety: { rating: 'Not Recommended', notes: 'Styrene is a concern. While FDA grades exist, not recommended for food contact in printed form.' },
      biodegradability: { rating: 'Not Biodegradable', notes: 'Petroleum-based. Theoretically recyclable but infrastructure is limited.' },
      additionalNotes: [
        'Styrene is classified as "possibly carcinogenic" by IARC',
        'Use activated carbon filtration if printing in enclosed spaces',
        'Consider ASA as safer alternative with similar properties',
      ],
    },
  },

  'ABS-CF': {
    name: 'ABS-CF',
    fullName: 'Carbon Fiber Reinforced Acrylonitrile Butadiene Styrene',
    origin: {
      yearInvented: '2010s (3D printing formulation)',
      originalCompany: 'Multiple manufacturers developed carbon fiber composites',
      keyMilestones: [
        '1948: ABS polymer first developed',
        '2010s: Carbon fiber reinforced variants emerge for industrial 3D printing',
        '2016+: Desktop 3D printing CF-ABS becomes available',
        '2020+: Widely adopted for high-strength functional parts',
      ],
      majorManufacturers: ['3DXTech', 'Polymaker', 'MatterHackers', 'Priline', 'eSUN', 'ColorFabb'],
    },
    composition: {
      basePolymer: 'ABS (Acrylonitrile Butadiene Styrene)',
      chemicalFamily: 'Styrenic Polymer Composite',
      keyAdditives: ['Chopped carbon fiber (10-20%)', 'Coupling agents', 'Impact modifiers'],
      coloringAgents: 'Typically black only due to carbon fiber content',
      specialFillers: ['Chopped carbon fiber strands (typically 100-200μm length)'],
    },
    familyContext: {
      parentPolymer: 'Standard ABS reinforced with carbon fiber',
      variants: ['ABS-CF 10%', 'ABS-CF 15%', 'ABS-CF 20%'],
      chemicalComparison: '40-60% stiffer than standard ABS with significantly improved dimensional stability.',
      evolution: 'Developed to bring aerospace-grade performance to desktop 3D printing.',
    },
    strengths: {
      uniqueProperties: ['Exceptional stiffness', 'Low warping compared to standard ABS', 'Excellent dimensional stability', 'Professional matte finish'],
      bestUseScenarios: ['Structural components', 'Jigs and fixtures', 'End-use parts', 'Drone frames', 'RC vehicle chassis'],
      advantagesOverCompetitors: ['Stiffer than any other ABS variant', 'Less warping than plain ABS', 'Acetone smoothable like ABS', 'High strength-to-weight ratio'],
      whyChooseThis: 'When you need maximum stiffness and dimensional accuracy for functional parts that ABS alone cannot provide.',
    },
    weaknesses: {
      limitations: ['Highly abrasive - requires hardened nozzle', 'Brittle in impact (fiber pullout)', 'Anisotropic strength', 'Expensive'],
      commonProblems: ['Rapid brass nozzle wear', 'Layer adhesion weaker than solid ABS', 'Stringing with protruding fibers', 'Clogging with worn nozzles'],
      environmentalConcerns: ['Carbon fiber dust is a respiratory hazard', 'Not recyclable', 'More energy-intensive production'],
      whenNotToUse: ['Impact-critical parts', 'When you lack a hardened nozzle', 'Parts requiring isotropic strength', 'Aesthetic parts (matte black only)'],
    },
    practicalContext: {
      industryAdoption: ['Aerospace prototyping', 'Automotive tooling', 'Industrial fixtures', 'Robotics', 'UAV/Drone industry'],
      commonApplications: ['Drone frames', 'Camera gimbals', 'Robotic end effectors', 'Manufacturing jigs', 'Precision brackets'],
      safetyStandards: ['Industrial certification varies', 'UL94 ratings available on some grades'],
      costPosition: 'Premium',
    },
    trivia: {
      funFacts: [
        'Carbon fiber in ABS-CF increases stiffness by 40-60% over plain ABS',
        'A hardened steel nozzle can last 50+ kg of CF filament; brass fails in under 500g',
        'The matte surface finish is actually fiber ends breaking through the surface',
        'CF-reinforced parts can replace aluminum in some applications',
      ],
      whyInvented: 'Created to provide stiffness approaching metals while maintaining easy processability of ABS.',
      controversies: [
        'Some manufacturers cut costs with low-quality short fibers that provide minimal benefit',
        '"Carbon fiber" marketing sometimes refers to minimal CF content (5% or less)',
        'Fiber length and quality vary dramatically between brands',
      ],
      marketAdoption: 'Growing rapidly as hardened nozzles become standard equipment on mid-range printers.',
    },
    tdsProfile: {
      properties: [
        { name: 'Tensile Strength', value: '55-75', unit: 'MPa', implications: 'High. Significantly stronger than base ABS in tension.' },
        { name: 'Tensile Modulus', value: '4000-7000', unit: 'MPa', implications: 'Very High. 2-3x stiffer than standard ABS - the main benefit.' },
        { name: 'Elongation at Break', value: '2-5', unit: '%', implications: 'Very Low. Brittle - snaps rather than bends.' },
        { name: 'Impact Strength (Notched)', value: '40-80', unit: 'J/m', implications: 'Reduced. Lower impact than plain ABS due to fiber stress concentrators.' },
        { name: 'Glass Transition (Tg)', value: '100-105', unit: '°C', implications: 'Same as ABS. Heat resistance unchanged.' },
        { name: 'Heat Deflection (HDT)', value: '~100', unit: '°C (0.45 MPa)', implications: 'Slightly improved due to fiber reinforcement.' },
      ],
      notes: 'Fiber orientation during printing affects properties - parts are strongest along print lines.',
    },
    printSettings: {
      nozzleTemp: { min: 240, max: 270, optimal: 255 },
      bedTemp: { min: 90, max: 110, optimal: 100 },
      coolingFan: { min: 0, max: 30, notes: 'Minimal cooling like ABS. Some cooling can improve bridges.' },
      enclosure: { required: true, notes: 'Required - same warping concerns as ABS, though reduced.' },
      drying: { temp: 80, duration: '4-6 hours', notes: 'Hygroscopic. Moisture causes bubbling and weak layers.' },
      printSpeed: { recommended: '40-60 mm/s', notes: 'Moderate speeds. Slower for fine details.' },
      additionalNotes: [
        'HARDENED NOZZLE REQUIRED (steel, ruby, or tungsten carbide)',
        'Larger nozzle diameter (0.5-0.8mm) reduces clogging',
        'Print hotter than plain ABS for better layer adhesion',
        'Z-offset may need adjustment due to fiber content',
      ],
    },
    adhesion: {
      bedSurfaces: {
        excellent: ['PEI (Textured)', 'Garolite (G10)', 'ABS slurry'],
        good: ['Glass with glue stick', 'Kapton tape'],
        poor: ['Bare glass', 'Blue tape'],
      },
      releaseAgents: 'Same as ABS. Glue stick or ABS slurry recommended.',
      multiMaterial: [
        { material: 'ABS', bondQuality: 'Strong Chemical Bond', notes: 'Excellent compatibility - same polymer base.' },
        { material: 'ASA', bondQuality: 'Strong Chemical Bond', notes: 'Compatible styrenic polymers.' },
        { material: 'HIPS', bondQuality: 'Strong Chemical Bond', notes: 'Can use HIPS as dissolvable support.' },
      ],
    },
    postProcessing: {
      chemicalSmoothing: [
        { method: 'Acetone Vapor', effectiveness: 'Good', notes: 'Works but fibers may protrude through smoothed surface.' },
        { method: 'Acetone Brush', effectiveness: 'Good', notes: 'Local smoothing possible but uneven due to fibers.' },
      ],
      mechanical: ['Sanding requires dust mask - CF dust is hazardous', 'Can be machined with carbide tools', 'Drilling and tapping work well'],
      glues: ['Acetone welding effective', 'Cyanoacrylate works well', 'Epoxy for structural joints'],
      painting: 'Matte finish accepts paint well. Prime first for best results.',
    },
    safety: {
      fumes: { level: 'High', notes: 'ABS styrene fumes PLUS carbon fiber particulates. Good ventilation AND filtration required.' },
      foodSafety: { rating: 'Not Safe', notes: 'Not suitable for food contact - fiber shedding and styrene concerns.' },
      biodegradability: { rating: 'Not Biodegradable', notes: 'Petroleum-based with non-degradable carbon fiber.' },
      additionalNotes: [
        'Carbon fiber dust is a respiratory irritant - use mask when sanding',
        'Enclosure with HEPA+activated carbon filtration strongly recommended',
        'Dispose of sanding dust and failed prints properly',
      ],
    },
  },

  'ABS+': {
    name: 'ABS+',
    fullName: 'Enhanced Acrylonitrile Butadiene Styrene',
    origin: {
      yearInvented: '2015+ (3D printing formulation)',
      originalCompany: 'Multiple filament manufacturers - not a standardized formula',
      keyMilestones: [
        '1948: ABS polymer invented',
        '2015-2017: ABS+ variants emerge from various manufacturers',
        '2018+: Becomes popular "easy-print ABS" option',
      ],
      majorManufacturers: ['eSUN', 'Hatchbox', 'Inland', 'Overture', 'SUNLU', 'Polymaker'],
    },
    composition: {
      basePolymer: 'ABS with proprietary additives',
      chemicalFamily: 'Modified Styrenic Polymer',
      keyAdditives: ['Impact modifiers', 'Anti-warping agents', 'Flow enhancers', 'Possibly styrene-acrylonitrile modifiers'],
      coloringAgents: 'Full color range available, similar to standard ABS',
      specialFillers: ['Varies by manufacturer - some add rubber modifiers'],
    },
    familyContext: {
      parentPolymer: 'Enhanced version of standard ABS',
      variants: ['ABS+ (generic)', 'ABS Pro', 'ABS Premium', 'Easy ABS'],
      chemicalComparison: 'Similar to ABS but with reduced warping tendency and improved layer adhesion.',
      evolution: 'Created to address the printability challenges of standard ABS for hobbyists.',
    },
    strengths: {
      uniqueProperties: ['Reduced warping vs standard ABS', 'Better layer adhesion', 'Easier to print', 'Maintains ABS heat resistance'],
      bestUseScenarios: ['Functional prototypes', 'Heat-resistant parts', 'Mechanical components', 'Automotive interior parts'],
      advantagesOverCompetitors: ['Easier than standard ABS', 'Better than PETG for heat resistance', 'Still acetone smoothable'],
      whyChooseThis: 'When you want ABS properties but find regular ABS too difficult to print reliably.',
    },
    weaknesses: {
      limitations: ['Still requires enclosure (usually)', 'Still emits styrene fumes', '"+" formulation not standardized', 'Properties vary by brand'],
      commonProblems: ['Still can warp (just less)', 'Inconsistent quality between manufacturers', 'Some ABS+ is barely different from ABS'],
      environmentalConcerns: ['Same environmental concerns as ABS', 'Petroleum-based', 'Fumes contain VOCs'],
      whenNotToUse: ['When ventilation is unavailable', 'If pure ABS certification is required', 'UV-exposed applications'],
    },
    practicalContext: {
      industryAdoption: ['Consumer products', 'Prototyping', 'DIY/Maker community', 'Small-batch manufacturing'],
      commonApplications: ['Enclosures', 'Brackets', 'Functional prototypes', 'Heat-resistant housings', 'Automotive parts'],
      safetyStandards: ['Generally not certified - formulation varies', 'Some manufacturers provide testing data'],
      costPosition: 'Standard',
    },
    trivia: {
      funFacts: [
        'There is no industry standard for "ABS+" - each manufacturer has their own formula',
        'Some ABS+ is just well-made ABS with better quality control',
        'The "+" usually refers to reduced warping, not mechanical improvement',
        'Printing tests show 30-50% less warping compared to budget ABS brands',
      ],
      whyInvented: 'Created to make ABS accessible to hobbyists without industrial enclosures.',
      controversies: [
        '"ABS+" naming is marketing - no standard definition exists',
        'Quality varies dramatically between manufacturers',
        'Some manufacturers charge premium prices for minimal improvements',
      ],
      marketAdoption: 'Popular with hobbyists who want ABS properties without the difficulty.',
    },
    tdsProfile: {
      properties: [
        { name: 'Tensile Strength', value: '38-48', unit: 'MPa', implications: 'Similar to ABS. Good general-purpose strength.' },
        { name: 'Elongation at Break', value: '15-30', unit: '%', implications: 'Moderate to good ductility before failure.' },
        { name: "Young's Modulus", value: '1800-2400', unit: 'MPa', implications: 'Similar stiffness to ABS.' },
        { name: 'Impact Strength (Notched)', value: '180-280', unit: 'J/m', implications: 'Good impact resistance - some formulas improve this.' },
        { name: 'Glass Transition (Tg)', value: '100-105', unit: '°C', implications: 'Same heat resistance as standard ABS.' },
        { name: 'Heat Deflection (HDT)', value: '~90-95', unit: '°C (0.45 MPa)', implications: 'Good heat resistance for functional parts.' },
      ],
      notes: 'Properties vary by manufacturer. "+" typically refers to printability, not mechanical improvement.',
    },
    printSettings: {
      nozzleTemp: { min: 230, max: 260, optimal: 245 },
      bedTemp: { min: 80, max: 100, optimal: 90 },
      coolingFan: { min: 0, max: 40, notes: 'Slightly more cooling tolerance than standard ABS.' },
      enclosure: { required: false, notes: 'Recommended but some brands work without. Large parts still need enclosure.' },
      drying: { temp: 75, duration: '4-6 hours', notes: 'Hygroscopic. Dry if stringing or bubbling occurs.' },
      printSpeed: { recommended: '40-70 mm/s', notes: 'Can print slightly faster than standard ABS.' },
      additionalNotes: [
        'Try without enclosure first - many ABS+ formulas work open-air for small parts',
        'Use brim for bed adhesion on larger parts',
        'First layer slow (20 mm/s) for best adhesion',
      ],
    },
    adhesion: {
      bedSurfaces: {
        excellent: ['PEI (Textured)', 'Garolite (G10)', 'ABS slurry'],
        good: ['Glass with glue stick', 'PEI (Smooth)'],
        poor: ['Bare glass', 'Blue tape'],
      },
      releaseAgents: 'Glue stick recommended. Less aggressive adhesion than some standard ABS.',
      multiMaterial: [
        { material: 'ABS', bondQuality: 'Strong Chemical Bond', notes: 'Same polymer family - excellent compatibility.' },
        { material: 'ASA', bondQuality: 'Strong Chemical Bond', notes: 'Compatible styrenic polymers.' },
        { material: 'HIPS', bondQuality: 'Strong Chemical Bond', notes: 'HIPS works as dissolvable support.' },
      ],
    },
    postProcessing: {
      chemicalSmoothing: [
        { method: 'Acetone Vapor', effectiveness: 'Excellent', notes: 'Works identically to standard ABS.' },
        { method: 'Acetone Brush', effectiveness: 'Good', notes: 'Same smoothing characteristics as ABS.' },
      ],
      mechanical: ['Sands easily', 'Can be machined', 'Gap filling with ABS slurry works'],
      glues: ['Acetone welding works', 'Cyanoacrylate effective', 'ABS cement creates strong joints'],
      painting: 'Excellent paint adhesion. Same finishing as standard ABS.',
    },
    safety: {
      fumes: { level: 'Moderate', notes: 'Same styrene emissions as ABS. Ventilation required.' },
      foodSafety: { rating: 'Not Recommended', notes: 'Same concerns as ABS - styrene and layer lines.' },
      biodegradability: { rating: 'Not Biodegradable', notes: 'Petroleum-based like standard ABS.' },
      additionalNotes: [
        'Same safety precautions as standard ABS',
        'Ventilation or filtration recommended',
        'Styrene classified as "possibly carcinogenic"',
      ],
    },
  },

  'ABS-GF': {
    name: 'ABS-GF',
    fullName: 'Glass Fiber Reinforced Acrylonitrile Butadiene Styrene',
    origin: {
      yearInvented: '1960s (injection molding), 2015+ (3D printing)',
      originalCompany: 'Various industrial plastics manufacturers',
      keyMilestones: [
        '1948: ABS polymer developed',
        '1960s: Glass fiber reinforced ABS for injection molding',
        '2015-2018: GF-reinforced filaments become available',
        '2020+: Growing adoption for industrial 3D printing',
      ],
      majorManufacturers: ['3DXTech', 'Polymaker', 'Fiberlogy', 'ColorFabb', 'BASF'],
    },
    composition: {
      basePolymer: 'ABS (Acrylonitrile Butadiene Styrene)',
      chemicalFamily: 'Styrenic Polymer Composite',
      keyAdditives: ['Chopped glass fiber (15-30%)', 'Coupling agents', 'Impact modifiers'],
      coloringAgents: 'Limited colors - typically natural/beige, gray, or black',
      specialFillers: ['E-glass or S-glass fiber (typically 10-30% by weight)'],
    },
    familyContext: {
      parentPolymer: 'Standard ABS reinforced with glass fiber',
      variants: ['ABS-GF15 (15% glass)', 'ABS-GF20 (20% glass)', 'ABS-GF30 (30% glass)'],
      chemicalComparison: 'Lower cost than CF reinforcement with similar stiffness improvements. Heavier than CF variants.',
      evolution: 'Industrial injection molding material adapted for 3D printing applications.',
    },
    strengths: {
      uniqueProperties: ['High stiffness', 'Excellent dimensional stability', 'Lower cost than carbon fiber', 'Good creep resistance'],
      bestUseScenarios: ['Structural housings', 'Industrial tooling', 'Jigs and fixtures', 'Automotive under-hood parts'],
      advantagesOverCompetitors: ['Cheaper than ABS-CF', 'Higher stiffness than plain ABS', 'Better heat resistance under load'],
      whyChooseThis: 'When you need reinforced ABS stiffness at lower cost than carbon fiber options.',
    },
    weaknesses: {
      limitations: ['Abrasive - requires hardened nozzle', 'Heavy (higher density than CF)', 'Reduced impact resistance', 'Limited color options'],
      commonProblems: ['Nozzle wear', 'Rough surface finish', 'Brittle compared to unreinforced ABS', 'Glass fibers can irritate skin'],
      environmentalConcerns: ['Not recyclable', 'Glass fiber dust hazard', 'Petroleum-based'],
      whenNotToUse: ['Weight-critical applications (use CF instead)', 'Aesthetic parts', 'Impact-critical components'],
    },
    practicalContext: {
      industryAdoption: ['Automotive', 'Industrial equipment', 'Appliances', 'Electronics enclosures'],
      commonApplications: ['Under-hood automotive parts', 'Industrial housings', 'Power tool components', 'Structural brackets'],
      safetyStandards: ['UL94 rated versions available', 'Various automotive standards'],
      costPosition: 'Standard',
    },
    trivia: {
      funFacts: [
        'Glass fiber is about 10x cheaper than carbon fiber as a reinforcement',
        'GF-ABS was used in injection molding for decades before 3D printing',
        'The beige/tan color of natural GF-ABS comes from the glass fiber itself',
        'Glass fiber is silica-based - same material as window glass',
      ],
      whyInvented: 'Created to provide cost-effective reinforcement for industrial plastic parts.',
      controversies: [
        'Sometimes marketed as "as good as carbon fiber" despite different properties',
        'Glass fiber dust more irritating to skin than carbon fiber',
        'Some cheap brands use low-quality short fibers with minimal benefit',
      ],
      marketAdoption: 'Popular in industrial settings where cost matters more than weight.',
    },
    tdsProfile: {
      properties: [
        { name: 'Tensile Strength', value: '50-70', unit: 'MPa', implications: 'High. Comparable to ABS-CF.' },
        { name: 'Tensile Modulus', value: '4000-6000', unit: 'MPa', implications: 'High. Significant stiffness improvement over base ABS.' },
        { name: 'Elongation at Break', value: '2-4', unit: '%', implications: 'Very Low. Brittle - fibers create stress concentrators.' },
        { name: 'Impact Strength (Notched)', value: '50-100', unit: 'J/m', implications: 'Reduced. Lower than plain ABS due to fiber addition.' },
        { name: 'Glass Transition (Tg)', value: '100-105', unit: '°C', implications: 'Same as ABS. Heat resistance unchanged.' },
        { name: 'Density', value: '1.25-1.35', unit: 'g/cm³', implications: 'Higher than ABS-CF. Glass is heavier than carbon.' },
      ],
      notes: 'Properties depend on glass fiber content. Higher % = stiffer but more brittle.',
    },
    printSettings: {
      nozzleTemp: { min: 245, max: 275, optimal: 260 },
      bedTemp: { min: 95, max: 110, optimal: 105 },
      coolingFan: { min: 0, max: 30, notes: 'Minimal cooling. Similar to standard ABS.' },
      enclosure: { required: true, notes: 'Required - same warping concerns as ABS.' },
      drying: { temp: 80, duration: '4-6 hours', notes: 'Hygroscopic. Moisture causes weak layers and bubbling.' },
      printSpeed: { recommended: '35-55 mm/s', notes: 'Slightly slower than ABS-CF for better layer adhesion.' },
      additionalNotes: [
        'HARDENED NOZZLE REQUIRED (steel, ruby, or tungsten carbide)',
        'Larger nozzle diameter (0.5-0.8mm) recommended',
        'Print hotter than plain ABS for fiber wetting',
        'Use brim - warping still occurs',
      ],
    },
    adhesion: {
      bedSurfaces: {
        excellent: ['PEI (Textured)', 'Garolite (G10)', 'ABS slurry'],
        good: ['Glass with glue stick', 'Kapton tape'],
        poor: ['Bare glass', 'Blue tape'],
      },
      releaseAgents: 'ABS slurry or heavy glue stick application recommended.',
      multiMaterial: [
        { material: 'ABS', bondQuality: 'Strong Chemical Bond', notes: 'Same polymer base - good compatibility.' },
        { material: 'ABS-CF', bondQuality: 'Strong Chemical Bond', notes: 'Both ABS-based composites bond well.' },
        { material: 'HIPS', bondQuality: 'Strong Chemical Bond', notes: 'Can use HIPS as dissolvable support.' },
      ],
    },
    postProcessing: {
      chemicalSmoothing: [
        { method: 'Acetone Vapor', effectiveness: 'Good', notes: 'ABS matrix dissolves but glass fibers remain - textured finish.' },
      ],
      mechanical: ['Sanding produces glass dust - wear mask and eye protection', 'Can be machined with carbide tools', 'Drilling works well'],
      glues: ['Acetone welding works on ABS matrix', 'Epoxy for structural joints', 'Cyanoacrylate effective'],
      painting: 'Surface is rough - requires filler primer for smooth finish.',
    },
    safety: {
      fumes: { level: 'High', notes: 'ABS styrene fumes plus glass fiber particulates. Enclosure with filtration required.' },
      foodSafety: { rating: 'Not Safe', notes: 'Not suitable for food contact - fiber shedding and styrene.' },
      biodegradability: { rating: 'Not Biodegradable', notes: 'Petroleum and silica-based - does not degrade.' },
      additionalNotes: [
        'Glass fiber dust irritates skin, eyes, and respiratory system',
        'Wear gloves when handling parts',
        'Use proper dust extraction when machining',
        'HEPA+activated carbon filtration recommended',
      ],
    },
  },

  'ASA': {
    name: 'ASA',
    fullName: 'Acrylonitrile Styrene Acrylate',
    origin: {
      yearInvented: '1970s',
      originalCompany: 'BASF (Luran S brand)',
      keyMilestones: [
        '1970s: Developed as UV-resistant ABS alternative',
        '2016-2018: Gains popularity in 3D printing',
        '2020+: Becomes standard for outdoor-use parts',
      ],
      majorManufacturers: ['BASF (Ultramid)', 'SABIC', 'Polymaker', 'Prusament', 'Fillamentum'],
    },
    composition: {
      basePolymer: 'ASA (Acrylonitrile Styrene Acrylate)',
      chemicalFamily: 'Styrenic Polymer',
      keyAdditives: ['Inherent UV stabilizers (acrylate component)', 'Impact modifiers'],
      coloringAgents: 'Weather-stable pigments, maintains color outdoors',
      specialFillers: ['Carbon fiber (ASA-CF)', 'Glass fiber (ASA-GF)'],
    },
    familyContext: {
      parentPolymer: 'Related to ABS - replaces butadiene with acrylate ester for UV stability',
      variants: ['ASA', 'ASA+', 'ASA-CF', 'ASA-GF', 'LW-ASA'],
      chemicalComparison: 'Very similar to ABS but with 10x better UV resistance due to the acrylate component.',
      evolution: 'Created specifically to solve ABS\'s UV degradation problem for automotive exterior parts.',
    },
    strengths: {
      uniqueProperties: ['Excellent UV resistance', 'Weather resistant', 'Maintains color outdoors', 'Chemical resistant'],
      bestUseScenarios: ['Outdoor parts', 'Automotive exterior', 'Garden fixtures', 'Signage', 'Solar panel mounts'],
      advantagesOverCompetitors: ['Best outdoor material available', 'Similar strength to ABS', 'Doesn\'t yellow or crack in sun'],
      whyChooseThis: 'The only choice for parts that will live outdoors - nothing else comes close for UV resistance.',
    },
    weaknesses: {
      limitations: ['Requires enclosure', 'More expensive than ABS', 'Still emits fumes', 'Limited color selection'],
      commonProblems: ['Warping (similar to ABS)', 'Requires enclosed printer', 'Layer adhesion can be tricky'],
      environmentalConcerns: ['Petroleum-based', 'Not biodegradable', 'VOC emissions during printing'],
      whenNotToUse: ['Indoor-only parts (use ABS instead)', 'Printers without enclosures', 'When budget is very tight'],
    },
    practicalContext: {
      industryAdoption: ['Automotive exterior', 'Outdoor furniture', 'Agricultural equipment', 'Marine', 'Solar industry'],
      commonApplications: ['Car mirror housings', 'Outdoor enclosures', 'Garden tool parts', 'Mailbox parts', 'Drone bodies'],
      safetyStandards: ['Various automotive weathering standards', 'UL ratings available'],
      costPosition: 'Premium',
    },
    trivia: {
      funFacts: [
        'ASA was specifically developed for car exterior trim that sits in sun all day',
        'The acrylate rubber is what provides UV stability - it absorbs UV without degrading',
        'Some ASA parts have survived 10+ years outdoors without yellowing',
      ],
      whyInvented: 'Created because ABS exterior car parts were yellowing and cracking in sunlight.',
      controversies: [
        'Some manufacturers sell "outdoor ABS" that isn\'t actually ASA',
        'Premium pricing sometimes isn\'t justified for indoor applications',
      ],
      marketAdoption: 'Slow adoption initially due to price, but now considered essential for any outdoor application.',
    },
    tdsProfile: {
      properties: [
        { name: 'Tensile Strength', value: '42-50', unit: 'MPa', implications: 'Similar to ABS. Good all-around strength.' },
        { name: 'Elongation at Break', value: '15-35', unit: '%', implications: 'Good ductility. Will deform before catastrophic failure.' },
        { name: "Young's Modulus", value: '2000-2400', unit: 'MPa', implications: 'Similar stiffness to ABS. Rigid but not brittle.' },
        { name: 'Impact Strength (Notched)', value: '150-250', unit: 'J/m', implications: 'Excellent impact resistance, comparable to ABS.' },
        { name: 'Glass Transition (Tg)', value: '95-105', unit: '°C', implications: 'High heat resistance. Similar to ABS.' },
        { name: 'UV Resistance', value: 'Excellent', unit: '', implications: 'The main advantage over ABS. 10x better UV stability.' },
      ],
      notes: 'Typical values for standard ASA. UV resistance is the key differentiator from ABS.',
    },
    printSettings: {
      nozzleTemp: { min: 235, max: 260, optimal: 250 },
      bedTemp: { min: 90, max: 110, optimal: 100 },
      coolingFan: { min: 0, max: 30, notes: 'Similar to ABS. Minimal cooling to prevent warping.' },
      enclosure: { required: true, notes: 'Required like ABS. Chamber temp 45-55°C recommended.' },
      drying: { temp: 80, duration: '4-6 hours', notes: 'Hygroscopic. Dry before printing for best results.' },
      printSpeed: { recommended: '40-60 mm/s', notes: 'Similar to ABS. Use slow first layer.' },
    },
    adhesion: {
      bedSurfaces: {
        excellent: ['PEI (Textured)', 'Garolite (G10)', 'Glass with ASA slurry'],
        good: ['Kapton with glue', 'PEI (Smooth)'],
        poor: ['Bare glass', 'Blue tape'],
      },
      releaseAgents: 'Glue stick or ASA slurry recommended for consistent adhesion.',
      multiMaterial: [
        { material: 'ABS', bondQuality: 'Strong Chemical Bond', notes: 'Similar chemistry, bonds well.' },
        { material: 'HIPS', bondQuality: 'Strong Chemical Bond', notes: 'Can use HIPS as dissolvable support.' },
        { material: 'TPU', bondQuality: 'Mechanical Bond', notes: 'Reasonable adhesion for grips.' },
      ],
    },
    postProcessing: {
      chemicalSmoothing: [
        { method: 'Acetone Vapor', effectiveness: 'Excellent', notes: 'Works just like ABS. Creates smooth, UV-resistant finish.' },
      ],
      mechanical: ['Sands easily', 'Can be machined', 'Excellent for gap filling'],
      glues: ['Acetone welding works', 'Cyanoacrylate effective', 'Epoxy for structural joints'],
      painting: 'Excellent paint adhesion. UV-stable paints recommended for outdoor use.',
    },
    safety: {
      fumes: { level: 'Moderate', notes: 'Similar to ABS. Produces styrene fumes. Good ventilation or filtration required.' },
      foodSafety: { rating: 'Not Recommended', notes: 'Not suitable for food contact applications.' },
      biodegradability: { rating: 'Not Biodegradable', notes: 'Petroleum-based polymer.' },
    },
  },

  'ASA-CF': {
    name: 'ASA-CF',
    fullName: 'Carbon Fiber Reinforced Acrylonitrile Styrene Acrylate',
    origin: {
      yearInvented: '2018+ (3D printing formulation)',
      originalCompany: 'Multiple manufacturers developed simultaneously',
      keyMilestones: [
        '1970s: ASA polymer developed for UV resistance',
        '2010s: Carbon fiber reinforced polymers become mainstream',
        '2018+: ASA-CF filaments emerge for outdoor structural applications',
        '2021+: Adopted for demanding outdoor and automotive applications',
      ],
      majorManufacturers: ['3DXTech', 'Polymaker', 'Fillamentum', 'Fiberlogy', 'ColorFabb'],
    },
    composition: {
      basePolymer: 'ASA (Acrylonitrile Styrene Acrylate)',
      chemicalFamily: 'Styrenic Polymer Composite',
      keyAdditives: ['Chopped carbon fiber (10-20%)', 'UV stabilizers (inherent in ASA)', 'Coupling agents'],
      coloringAgents: 'Typically black only due to carbon fiber content',
      specialFillers: ['Chopped carbon fiber strands (typically 100-200μm length)'],
    },
    familyContext: {
      parentPolymer: 'ASA reinforced with carbon fiber - combines UV stability with high stiffness',
      variants: ['ASA-CF 10%', 'ASA-CF 15%', 'ASA-CF 20%'],
      chemicalComparison: 'Combines the UV resistance of ASA with the stiffness of carbon fiber - the ultimate outdoor structural material.',
      evolution: 'Created to provide both UV stability AND high stiffness for demanding outdoor applications.',
    },
    strengths: {
      uniqueProperties: ['UV resistant AND stiff', 'Excellent dimensional stability', 'Weather-proof structural material', 'Professional matte finish'],
      bestUseScenarios: ['Outdoor structural parts', 'Drone frames for outdoor use', 'Automotive exterior brackets', 'Solar panel mounts', 'Marine equipment'],
      advantagesOverCompetitors: ['Only UV-stable carbon fiber composite', 'Stiffer than ASA alone', 'Better outdoor durability than ABS-CF', 'Low warping'],
      whyChooseThis: 'The ONLY choice when you need both UV resistance AND maximum stiffness for outdoor structural applications.',
    },
    weaknesses: {
      limitations: ['Highly abrasive - requires hardened nozzle', 'Expensive', 'Brittle (low impact)', 'Black color only'],
      commonProblems: ['Rapid brass nozzle wear', 'Layer adhesion challenges', 'Anisotropic strength', 'Higher cost than alternatives'],
      environmentalConcerns: ['Carbon fiber dust hazard', 'Not recyclable', 'Petroleum-based'],
      whenNotToUse: ['Impact-critical outdoor parts', 'When UV resistance isn\'t needed (use ABS-CF)', 'Without hardened nozzle', 'Budget projects'],
    },
    practicalContext: {
      industryAdoption: ['Automotive exterior', 'Aerospace', 'Marine', 'Solar industry', 'Professional UAV/Drone'],
      commonApplications: ['Outdoor drone frames', 'Solar panel brackets', 'Automotive exterior clips', 'Marine fittings', 'Weather station housings'],
      safetyStandards: ['Automotive weathering standards', 'UL ratings available on some grades'],
      costPosition: 'Premium',
    },
    trivia: {
      funFacts: [
        'ASA-CF is the only carbon fiber composite that survives years of UV exposure without degradation',
        'Parts printed in ASA-CF have been tested to 5+ years outdoor exposure with minimal property loss',
        'The combination of UV + CF makes this the most "professional-grade" desktop material available',
        'Popular in the FPV drone community for frames that fly outdoors',
      ],
      whyInvented: 'Created for applications that need both the mechanical performance of CF and the weatherability of ASA.',
      controversies: [
        'Premium pricing can be 3-4x standard ASA cost',
        'Some argue PETG-CF with UV coating is "good enough" for outdoor use',
        'Availability is more limited than ABS-CF due to niche market',
      ],
      marketAdoption: 'Niche but growing - essential material for professional outdoor 3D printing applications.',
    },
    tdsProfile: {
      properties: [
        { name: 'Tensile Strength', value: '55-70', unit: 'MPa', implications: 'High. Significantly stronger than base ASA.' },
        { name: 'Tensile Modulus', value: '4500-7000', unit: 'MPa', implications: 'Very High. 2-3x stiffer than standard ASA.' },
        { name: 'Elongation at Break', value: '2-4', unit: '%', implications: 'Very Low. Brittle - will snap rather than bend.' },
        { name: 'Impact Strength (Notched)', value: '40-70', unit: 'J/m', implications: 'Reduced. Lower than plain ASA due to fiber stress concentrators.' },
        { name: 'Glass Transition (Tg)', value: '95-105', unit: '°C', implications: 'Same as ASA. Good heat resistance maintained.' },
        { name: 'UV Resistance', value: 'Excellent', unit: '', implications: 'Inherits ASA\'s exceptional UV stability - the key differentiator from ABS-CF.' },
        { name: 'Heat Deflection (HDT)', value: '~105', unit: '°C (0.45 MPa)', implications: 'Improved due to fiber reinforcement.' },
      ],
      notes: 'Combines UV resistance of ASA with stiffness of carbon fiber. Fiber orientation affects properties.',
    },
    printSettings: {
      nozzleTemp: { min: 245, max: 275, optimal: 260 },
      bedTemp: { min: 95, max: 110, optimal: 105 },
      coolingFan: { min: 0, max: 30, notes: 'Minimal cooling like ASA. Some cooling helps with bridges.' },
      enclosure: { required: true, notes: 'Required - same warping concerns as ASA, though CF reduces warping somewhat.' },
      drying: { temp: 80, duration: '4-6 hours', notes: 'Hygroscopic. Moisture causes bubbling and weak layer adhesion.' },
      printSpeed: { recommended: '40-60 mm/s', notes: 'Moderate speeds. Slower for fine details and better layer adhesion.' },
      additionalNotes: [
        'HARDENED NOZZLE REQUIRED (steel, ruby, or tungsten carbide)',
        'Larger nozzle diameter (0.5-0.8mm) reduces clogging',
        'Print hotter than plain ASA for better fiber wetting',
        'Chamber temperature 50-60°C optimal',
        'Use brim for bed adhesion',
      ],
    },
    adhesion: {
      bedSurfaces: {
        excellent: ['PEI (Textured)', 'Garolite (G10)', 'ASA/ABS slurry'],
        good: ['Glass with glue stick', 'Kapton tape'],
        poor: ['Bare glass', 'Blue tape'],
      },
      releaseAgents: 'Same as ASA - glue stick or ASA slurry recommended.',
      multiMaterial: [
        { material: 'ASA', bondQuality: 'Strong Chemical Bond', notes: 'Excellent compatibility - same polymer base.' },
        { material: 'ABS', bondQuality: 'Strong Chemical Bond', notes: 'Compatible styrenic polymers.' },
        { material: 'HIPS', bondQuality: 'Strong Chemical Bond', notes: 'Can use HIPS as dissolvable support.' },
        { material: 'ABS-CF', bondQuality: 'Strong Chemical Bond', notes: 'Both styrenic CF composites bond well.' },
      ],
    },
    postProcessing: {
      chemicalSmoothing: [
        { method: 'Acetone Vapor', effectiveness: 'Good', notes: 'Works but carbon fibers protrude through smoothed surface.' },
        { method: 'Acetone Brush', effectiveness: 'Good', notes: 'Local smoothing possible. Uneven due to fibers.' },
      ],
      mechanical: ['Sanding requires dust mask - CF dust is hazardous', 'Can be machined with carbide tools', 'Drilling and tapping work well'],
      glues: ['Acetone welding effective on ASA matrix', 'Cyanoacrylate works well', 'Epoxy for structural joints - best option'],
      painting: 'Matte black finish. Can be painted with proper adhesion promoter. UV-stable paints recommended.',
    },
    safety: {
      fumes: { level: 'High', notes: 'ASA styrene fumes PLUS carbon fiber particulates. Enclosure with HEPA+carbon filtration required.' },
      foodSafety: { rating: 'Not Safe', notes: 'Not suitable for food contact - fiber shedding and styrene concerns.' },
      biodegradability: { rating: 'Not Biodegradable', notes: 'Petroleum-based with non-degradable carbon fiber.' },
      additionalNotes: [
        'Carbon fiber dust is a respiratory hazard - use mask when sanding/machining',
        'Enclosure with HEPA and activated carbon filtration strongly recommended',
        'Wear gloves when handling sanded parts',
        'Dispose of CF dust and failed prints properly',
      ],
    },
  },

  'TPU': {
    name: 'TPU',
    fullName: 'Thermoplastic Polyurethane',
    origin: {
      yearInvented: '1937 (polyurethane chemistry), 1950s (TPU specifically)',
      originalCompany: 'Otto Bayer at IG Farben developed polyurethane chemistry',
      keyMilestones: [
        '1937: Polyurethane chemistry discovered',
        '1950s: Thermoplastic versions developed',
        '2014-2016: TPU filaments become available',
        '2018+: NinjaTek, Polymaker drive 3D printing adoption',
      ],
      majorManufacturers: ['BASF (Elastollan)', 'Lubrizol (Estane)', 'NinjaTek', 'Polymaker', 'SainSmart'],
    },
    composition: {
      basePolymer: 'TPU (Thermoplastic Polyurethane)',
      chemicalFamily: 'Polyurethane Elastomer',
      keyAdditives: ['Plasticizers for flexibility', 'UV stabilizers', 'Colorants'],
      coloringAgents: 'Transparent and opaque pigments, some grades remain translucent',
      specialFillers: ['Carbon fiber (TPU-CF) - rare'],
    },
    familyContext: {
      parentPolymer: 'Part of the polyurethane family - reaction of diisocyanates with polyols',
      variants: ['TPU 95A', 'TPU 85A', 'TPU 75A (softer)', 'TPE (related)', 'PEBA (related)'],
      chemicalComparison: 'Shore hardness (A scale) determines flexibility - 95A is harder, 75A is softer.',
      evolution: 'Originally industrial rubber replacement, evolved into key 3D printing material for flexible parts.',
    },
    strengths: {
      uniqueProperties: ['Rubber-like flexibility', 'Excellent abrasion resistance', 'Oil and grease resistant', 'High elongation'],
      bestUseScenarios: ['Phone cases', 'Gaskets and seals', 'Flexible hinges', 'Vibration dampening', 'Wheel covers'],
      advantagesOverCompetitors: ['Only way to print truly flexible parts', 'Extremely durable', 'Chemical resistant'],
      whyChooseThis: 'When you need rubber-like properties that no rigid material can provide.',
    },
    weaknesses: {
      limitations: ['Difficult to print (requires slow speeds)', 'Strings heavily', 'Poor bridging', 'Needs direct drive'],
      commonProblems: ['Buckling in Bowden extruders', 'Massive stringing', 'Difficulty with overhangs', 'Slow print speeds'],
      environmentalConcerns: ['Not biodegradable', 'Polyurethane chemistry involves isocyanates'],
      whenNotToUse: ['When rigidity is needed', 'High-detail prints', 'Bowden extruder printers (usually)', 'Speed is priority'],
    },
    practicalContext: {
      industryAdoption: ['Footwear', 'Automotive', 'Consumer electronics', 'Medical devices', 'Sports equipment'],
      commonApplications: ['Phone cases', 'Watch bands', 'Shoe soles', 'Gaskets', 'Drone landing gear', 'RC car tires'],
      safetyStandards: ['Medical grades available', 'Skin-contact safe grades exist'],
      costPosition: 'Premium',
    },
    trivia: {
      funFacts: [
        'TPU is what Crocs shoes are made from (same material family)',
        'The Shore A hardness scale goes from 0 (gel-like) to 100 (hard rubber)',
        'NinjaTek\'s NinjaFlex was one of the first successful flexible filaments',
      ],
      whyInvented: 'Created to provide rubber-like properties in a thermoplastic that could be processed like regular plastic.',
      controversies: [
        'Many users buy TPU expecting easy printing - it requires significant patience',
        'Shore hardness marketing can be confusing - lower numbers are softer',
      ],
      marketAdoption: 'Steady growth as more printers get direct drive extruders and users learn proper settings.',
    },
    tdsProfile: {
      properties: [
        { name: 'Tensile Strength', value: '25-50', unit: 'MPa', implications: 'Varies by hardness. Excellent for flexible applications.' },
        { name: 'Elongation at Break', value: '400-700', unit: '%', implications: 'Extremely high. Can stretch 4-7x length before breaking.' },
        { name: 'Shore Hardness', value: '75A-95A', unit: '', implications: 'Lower = softer. 95A feels like hard rubber, 75A like soft rubber.' },
        { name: 'Abrasion Resistance', value: 'Excellent', unit: '', implications: 'One of the best abrasion-resistant printable materials.' },
        { name: 'Tear Strength', value: '50-100', unit: 'kN/m', implications: 'Excellent tear resistance for flexible material.' },
        { name: 'Service Temperature', value: '-40 to 80', unit: '°C', implications: 'Wide operating range. Maintains flexibility in cold.' },
      ],
      notes: 'Properties vary significantly based on Shore hardness grade.',
    },
    printSettings: {
      nozzleTemp: { min: 210, max: 240, optimal: 225 },
      bedTemp: { min: 30, max: 60, optimal: 50 },
      coolingFan: { min: 30, max: 80, notes: 'Some cooling helps with stringing. Not as critical as PLA.' },
      enclosure: { required: false, notes: 'Not required. Room temperature printing is fine.' },
      drying: { temp: 50, duration: '4-6 hours', notes: 'Moderately hygroscopic. Dry if bubbling or poor surface quality.' },
      printSpeed: { recommended: '15-30 mm/s', notes: 'SLOW! Fast speeds cause buckling. Direct drive extruder strongly recommended.' },
      additionalNotes: [
        'Retraction should be minimal (0.5-2mm) or disabled',
        'Direct drive extruder is almost mandatory for softer grades',
        'Bowden works only with 95A hardness and very short tubes',
        'Disable or reduce z-hop to prevent stringing',
      ],
    },
    adhesion: {
      bedSurfaces: {
        excellent: ['PEI (Smooth)', 'Glass with glue stick', 'Blue tape'],
        good: ['PEI (Textured)', 'BuildTak'],
        poor: ['Bare glass (sticks too well or not at all)'],
      },
      releaseAgents: 'Glue stick can help with release. TPU can bond too well to some surfaces.',
      multiMaterial: [
        { material: 'PLA', bondQuality: 'Strong Chemical Bond', notes: 'Excellent bond - great for rigid parts with flexible sections.' },
        { material: 'PETG', bondQuality: 'Weak Bond', notes: 'Limited adhesion - not recommended for structural multi-material.' },
        { material: 'ABS', bondQuality: 'Mechanical Bond', notes: 'Moderate adhesion through mechanical interlocking.' },
      ],
    },
    postProcessing: {
      chemicalSmoothing: [
        { method: 'Acetone', effectiveness: 'Not Possible', notes: 'No effect on TPU.' },
        { method: 'THF', effectiveness: 'Difficult', notes: 'Limited effect, not practical.' },
      ],
      mechanical: ['Sanding is difficult due to flexibility', 'Trimming with sharp blade works well', 'Heat gun can smooth slightly'],
      glues: ['Flexible cyanoacrylate works', 'Polyurethane adhesives work well', 'Contact cement effective'],
      painting: 'Difficult - paint tends to crack with flexing. Use flexible paints or dyes.',
    },
    safety: {
      fumes: { level: 'Low', notes: 'Generally safe with basic ventilation. Some off-gassing during printing.' },
      foodSafety: { rating: 'Possible (Specific Grades)', notes: 'FDA approved TPU grades exist. Layer lines remain a concern for bacteria.' },
      biodegradability: { rating: 'Not Biodegradable', notes: 'Petroleum-based polyurethane. Not biodegradable in any environment.' },
      additionalNotes: [
        'Isocyanate concerns during production, not during printing',
        'Generally considered safe for home use with ventilation',
      ],
    },
  },

  'Nylon': {
    name: 'Nylon',
    fullName: 'Polyamide (PA)',
    origin: {
      yearInvented: '1935',
      originalCompany: 'DuPont (Wallace Carothers)',
      keyMilestones: [
        '1935: Nylon 6,6 synthesized by Carothers at DuPont',
        '1938: Commercial nylon stockings launch',
        '1941: Nylon replaces silk in WWII parachutes',
        '2012+: Nylon filaments become available for 3D printing',
      ],
      majorManufacturers: ['BASF', 'DuPont', 'DSM', 'Polymaker', 'Taulman3D', 'MatterHackers'],
    },
    composition: {
      basePolymer: 'Polyamide (various types: PA6, PA66, PA12)',
      chemicalFamily: 'Polyamide',
      keyAdditives: ['Moisture stabilizers', 'Heat stabilizers', 'Lubricants'],
      coloringAgents: 'Natural is translucent white/cream, takes dye well',
      specialFillers: ['Carbon fiber (PA-CF)', 'Glass fiber (PA-GF)', 'Kevlar'],
    },
    familyContext: {
      parentPolymer: 'Polyamide family - PA6, PA66, PA12 are common',
      variants: ['PA6', 'PA66', 'PA12', 'PA-CF', 'PA-GF', 'Alloy 910', 'PCTPE'],
      chemicalComparison: 'PA6 is easier to print, PA66 has better heat resistance, PA12 is least hygroscopic.',
      evolution: 'From revolutionary synthetic fiber to high-performance 3D printing material.',
    },
    strengths: {
      uniqueProperties: ['Excellent wear resistance', 'Self-lubricating', 'High fatigue resistance', 'Dyeable', 'Chemical resistant'],
      bestUseScenarios: ['Gears and bearings', 'Living hinges', 'Snap fits', 'Mechanical components', 'Wear surfaces'],
      advantagesOverCompetitors: ['Best for gears and moving parts', 'Fatigue resistant', 'Self-lubricating properties'],
      whyChooseThis: 'When you need gears, bearings, or any parts that will see wear and mechanical stress.',
    },
    weaknesses: {
      limitations: ['Extremely hygroscopic', 'Warps significantly', 'Requires enclosure', 'Difficult bed adhesion'],
      commonProblems: ['Moisture absorption destroys print quality', 'Warping during print', 'Stringy prints', 'Requires dry storage'],
      environmentalConcerns: ['Petroleum-based', 'High energy production', 'Microfiber shedding concerns'],
      whenNotToUse: ['Humid environments without dry box', 'Parts requiring tight tolerances', 'Beginners', 'Printers without enclosures'],
    },
    practicalContext: {
      industryAdoption: ['Automotive', 'Aerospace', 'Consumer goods', 'Industrial', 'Textiles'],
      commonApplications: ['Gears', 'Bearings', 'Cable ties', 'Hinges', 'Machinery components', 'Bushings'],
      safetyStandards: ['FDA food contact grades available', 'Various automotive and industrial certifications'],
      costPosition: 'Standard',
    },
    trivia: {
      funFacts: [
        'Nylon was the first fully synthetic fiber - revolutionized textiles',
        'Named for New York (NY) and London (LON)',
        'WWII caused nylon shortages - women drew fake stocking seams on legs',
        'Taulman3D was the pioneer of nylon 3D printing filaments',
      ],
      whyInvented: 'Created as synthetic replacement for silk, especially for stockings and parachutes.',
      controversies: [
        'Moisture sensitivity is often severely underestimated',
        'Many users give up on nylon due to failed prints from wet filament',
        'Dry box or inline dryer is essentially mandatory for good results',
      ],
      marketAdoption: 'Growing adoption as more users understand moisture management requirements.',
    },
    tdsProfile: {
      properties: [
        { name: 'Tensile Strength', value: '40-85', unit: 'MPa', implications: 'High strength, varies by PA type. PA66 stronger than PA6.' },
        { name: 'Elongation at Break', value: '30-100', unit: '%', implications: 'Good ductility. Will deform before breaking.' },
        { name: "Young's Modulus", value: '1000-3000', unit: 'MPa', implications: 'Moderate stiffness. Flexible compared to PLA.' },
        { name: 'Impact Strength', value: '50-100', unit: 'kJ/m²', implications: 'Very good. Excellent for parts seeing impacts.' },
        { name: 'Glass Transition (Tg)', value: '47-80', unit: '°C', implications: 'Varies by type. PA12 lower, PA66 higher.' },
        { name: 'Heat Deflection (HDT)', value: '75-180', unit: '°C (0.45 MPa)', implications: 'Good heat resistance, especially PA66.' },
      ],
      notes: 'Properties depend heavily on moisture content. Dry material is stronger but more brittle.',
    },
    printSettings: {
      nozzleTemp: { min: 240, max: 280, optimal: 260 },
      bedTemp: { min: 70, max: 100, optimal: 85 },
      coolingFan: { min: 0, max: 30, notes: 'Minimal cooling. Too much causes warping and poor layer adhesion.' },
      enclosure: { required: true, notes: 'Required for all but the smallest parts. Chamber temp 40-60°C ideal.' },
      drying: { temp: 70, duration: '8-12 hours', notes: 'CRITICAL. Nylon absorbs moisture rapidly. Must be dried and kept dry during printing. Use dry box or inline dryer.' },
      printSpeed: { recommended: '30-60 mm/s', notes: 'Moderate speeds. First layer very slow (15-20 mm/s).' },
      additionalNotes: [
        'Print from dry box with active drying if possible',
        'Garolite (G10) is the gold standard for bed adhesion',
        'Use brim or raft for larger parts',
        'Allow slow cooling in enclosure to minimize warping',
      ],
    },
    adhesion: {
      bedSurfaces: {
        excellent: ['Garolite (G10/FR4)', 'Nylon-specific sheets'],
        good: ['PEI (Textured) with glue', 'Glass with glue stick'],
        poor: ['Bare PEI', 'Blue tape', 'Bare glass'],
      },
      releaseAgents: 'Nylon sticks extremely well to Garolite. May need to wait for full cooling or use release agent.',
      multiMaterial: [
        { material: 'TPU', bondQuality: 'Mechanical Bond', notes: 'Reasonable adhesion for flexible-rigid combinations.' },
        { material: 'PLA', bondQuality: 'No Bond', notes: 'No adhesion between these materials.' },
        { material: 'PA-CF', bondQuality: 'Strong Chemical Bond', notes: 'Same polymer family, excellent bonding.' },
      ],
    },
    postProcessing: {
      chemicalSmoothing: [
        { method: 'Formic Acid', effectiveness: 'Good', notes: 'Effective but dangerous acid. Professional use only.' },
        { method: 'Acetone', effectiveness: 'Not Possible', notes: 'No effect on nylon.' },
      ],
      mechanical: ['Sands well', 'Can be machined (drilling, tapping, milling)', 'Polishes to smooth finish'],
      glues: ['Cyanoacrylate with activator', 'Epoxy works well', 'Specialty nylon adhesives available'],
      painting: 'Accepts fabric dyes for coloring. Priming required for paint adhesion.',
    },
    safety: {
      fumes: { level: 'Moderate', notes: 'Emits caprolactam and other volatiles. Good ventilation required, especially for PA6.' },
      foodSafety: { rating: 'Possible (Specific Grades)', notes: 'FDA approved grades available. Same layer-line bacteria concerns apply.' },
      biodegradability: { rating: 'Not Biodegradable', notes: 'Petroleum-based polymer. Not biodegradable.' },
      additionalNotes: [
        'Caprolactam emissions require ventilation',
        'Drying at high temps can cause additional off-gassing',
        'Considered safe with proper ventilation',
      ],
    },
  },

  'PC': {
    name: 'PC',
    fullName: 'Polycarbonate',
    origin: {
      yearInvented: '1953',
      originalCompany: 'Bayer (Germany) and GE (USA) - developed simultaneously',
      keyMilestones: [
        '1953: Polycarbonate synthesized independently by Bayer and GE',
        '1958: Commercial production begins',
        '1982: Compact discs (CDs) launch - all made of PC',
        '2015+: PC becomes accessible for 3D printing',
      ],
      majorManufacturers: ['Covestro (formerly Bayer)', 'SABIC', 'Polymaker', 'eSUN', '3DXTech'],
    },
    composition: {
      basePolymer: 'Polycarbonate (bisphenol A based)',
      chemicalFamily: 'Polycarbonate',
      keyAdditives: ['UV stabilizers', 'Flame retardants', 'Impact modifiers'],
      coloringAgents: 'Naturally water-clear, excellent optical clarity, various pigments',
      specialFillers: ['Carbon fiber (PC-CF)', 'Glass fiber (PC-GF)'],
    },
    familyContext: {
      parentPolymer: 'Bisphenol A polycarbonate (most common)',
      variants: ['PC', 'PC-ABS (blend)', 'PC-CF', 'PC-GF', 'Flame-retardant PC'],
      chemicalComparison: 'Much stronger impact resistance than PETG, higher heat resistance, but harder to print.',
      evolution: 'From optical discs and bulletproof glass to high-performance 3D printing material.',
    },
    strengths: {
      uniqueProperties: ['Extreme impact resistance', 'Optical clarity', 'High heat resistance', 'Natural flame resistance'],
      bestUseScenarios: ['Safety equipment', 'Impact-resistant parts', 'High-temp applications', 'Transparent parts needing strength'],
      advantagesOverCompetitors: ['Toughest commonly available material', 'Survives drops that shatter others', 'High-temp capability'],
      whyChooseThis: 'When parts absolutely cannot break - PC is essentially shatterproof at normal thicknesses.',
    },
    weaknesses: {
      limitations: ['Requires high temps (300°C+)', 'Needs enclosure', 'Warps significantly', 'Hygroscopic', 'Scratches easily'],
      commonProblems: ['Layer adhesion issues without enclosure', 'Warping and cracking', 'Moisture causes bubbling', 'Poor layer adhesion if too cool'],
      environmentalConcerns: ['BPA concerns (Bisphenol A)', 'Energy intensive production', 'Recycling challenges'],
      whenNotToUse: ['Without proper high-temp setup', 'Scratch-resistant needs (use PMMA)', 'Budget builds', 'Food contact'],
    },
    practicalContext: {
      industryAdoption: ['Automotive', 'Electronics', 'Safety equipment', 'Optical media', 'Medical devices'],
      commonApplications: ['Safety glasses', 'CDs/DVDs/Blu-rays', 'Bullet-resistant glass', 'Phone cases', 'Motorcycle helmets'],
      safetyStandards: ['UL flame ratings', 'Various impact certifications', 'Optical certifications'],
      costPosition: 'Premium',
    },
    trivia: {
      funFacts: [
        'Every CD, DVD, and Blu-ray disc is made from polycarbonate',
        'Bulletproof glass is typically laminated polycarbonate',
        'PC was developed simultaneously on two continents - Bayer in Germany and GE in USA',
        'The original Nalgene bottles were PC before BPA concerns led to switch',
      ],
      whyInvented: 'Created to combine optical clarity with extreme impact resistance - solved problems no other plastic could.',
      controversies: [
        'BPA leaching concerns led many consumers to avoid PC bottles',
        'Many printers claiming "PC capable" cannot actually print it well',
        'Often blended with ABS to make it printable (PC-ABS) which dilutes properties',
      ],
      marketAdoption: 'Niche adoption - only users with proper equipment can successfully print pure PC.',
    },
    tdsProfile: {
      properties: [
        { name: 'Tensile Strength', value: '55-75', unit: 'MPa', implications: 'Very high. Excellent structural strength.' },
        { name: 'Elongation at Break', value: '100-150', unit: '%', implications: 'High ductility. Deforms significantly before failure.' },
        { name: "Young's Modulus", value: '2300-2400', unit: 'MPa', implications: 'Good stiffness. Similar rigidity to PLA with far better toughness.' },
        { name: 'Impact Strength (Notched)', value: '600-850', unit: 'J/m', implications: 'Exceptional. Best impact resistance of common plastics.' },
        { name: 'Glass Transition (Tg)', value: '145-150', unit: '°C', implications: 'Very high. Excellent for high-temperature applications.' },
        { name: 'Heat Deflection (HDT)', value: '130-140', unit: '°C (0.45 MPa)', implications: 'Excellent heat resistance. Survives engine bay temperatures.' },
      ],
      notes: 'Printed PC achieves 80-90% of injection molded properties with proper technique.',
    },
    printSettings: {
      nozzleTemp: { min: 280, max: 310, optimal: 295 },
      bedTemp: { min: 100, max: 130, optimal: 115 },
      coolingFan: { min: 0, max: 20, notes: 'Minimal to no cooling. Fan causes warping and layer separation.' },
      enclosure: { required: true, notes: 'REQUIRED. Chamber temperature 60-80°C needed for successful prints. Higher is better.' },
      drying: { temp: 80, duration: '6-10 hours', notes: 'Hygroscopic. Moisture causes severe bubbling and layer issues. Keep in dry box.' },
      printSpeed: { recommended: '30-50 mm/s', notes: 'Moderate speeds. Very slow first layer (15 mm/s).' },
      additionalNotes: [
        'All-metal hotend required - PTFE degrades at PC temperatures',
        'Hardened nozzle recommended for filled variants',
        'Use wide brim or raft',
        'Let prints cool slowly in enclosure - rapid cooling cracks parts',
      ],
    },
    adhesion: {
      bedSurfaces: {
        excellent: ['Garolite (G10)', 'PC sheet', 'PEI (Textured) with glue'],
        good: ['Glass with specialized PC adhesive'],
        poor: ['Bare PEI', 'Blue tape', 'Most standard surfaces'],
      },
      releaseAgents: 'PC-specific adhesives like Vision Miner Nano Polymer work best. Standard glue stick often insufficient.',
      multiMaterial: [
        { material: 'ABS', bondQuality: 'Strong Chemical Bond', notes: 'PC-ABS is a common commercial blend for good reason.' },
        { material: 'ASA', bondQuality: 'Strong Chemical Bond', notes: 'Good compatibility between these materials.' },
        { material: 'TPU', bondQuality: 'Mechanical Bond', notes: 'Reasonable adhesion for grips and bumpers.' },
      ],
    },
    postProcessing: {
      chemicalSmoothing: [
        { method: 'Dichloromethane', effectiveness: 'Excellent', notes: 'Very effective but extremely toxic. Professional use only with fume hood.' },
        { method: 'Acetone', effectiveness: 'Difficult', notes: 'Very slow effect. Not practical for smoothing.' },
      ],
      mechanical: ['Sands well', 'Polishes to optical clarity', 'Machines beautifully', 'Flame polishing possible'],
      glues: ['Dichloromethane solvent welding', 'Cyanoacrylate works', 'Epoxy for structural joints'],
      painting: 'Accepts paints well after light sanding. Priming improves adhesion.',
    },
    safety: {
      fumes: { level: 'Moderate', notes: 'Releases BPA and other compounds at print temps. Good ventilation and filtration required. Avoid printing in living spaces.' },
      foodSafety: { rating: 'Not Recommended', notes: 'BPA concerns make PC unsuitable for food contact despite some FDA grades existing historically.' },
      biodegradability: { rating: 'Not Biodegradable', notes: 'Petroleum-based. Very stable in environment - does not break down.' },
      additionalNotes: [
        'BPA is a known endocrine disruptor',
        'Require proper ventilation at high printing temperatures',
        'HEPA + carbon filtration recommended',
        'Consider PC-ABS blend for easier printing with fewer fumes',
      ],
    },
  },

  'PEEK': {
    name: 'PEEK',
    fullName: 'Polyether Ether Ketone',
    origin: {
      yearInvented: '1978',
      originalCompany: 'Victrex (ICI at the time)',
      keyMilestones: [
        '1978: Developed by ICI (now Victrex)',
        '1998: First medical implant approvals',
        '2010s: High-temperature 3D printers enable PEEK printing',
        '2020+: Becoming more accessible as printer technology advances',
      ],
      majorManufacturers: ['Victrex', 'Evonik', 'Solvay', 'Apium', '3DXTech'],
    },
    composition: {
      basePolymer: 'PEEK (Polyether Ether Ketone)',
      chemicalFamily: 'Polyaryletherketone (PAEK) family',
      keyAdditives: ['Carbon fiber (PEEK-CF)', 'Glass fiber (PEEK-GF)'],
      coloringAgents: 'Natural color is beige/tan, limited coloring options',
      specialFillers: ['Carbon fiber', 'Glass fiber'],
    },
    familyContext: {
      parentPolymer: 'Part of PAEK family - includes PEKK, PEK',
      variants: ['PEEK', 'PEEK-CF', 'PEEK-GF', 'Implant-grade PEEK'],
      chemicalComparison: 'The highest-performance thermoplastic commercially available. 250°C+ continuous use temperature.',
      evolution: 'From aerospace metal replacement to 3D printed medical implants.',
    },
    strengths: {
      uniqueProperties: ['250°C continuous use temp', 'Biocompatible (implant grade)', 'Chemical inert', 'Radiation resistant'],
      bestUseScenarios: ['Medical implants', 'Aerospace components', 'Oil & gas equipment', 'Semiconductor manufacturing'],
      advantagesOverCompetitors: ['Nothing else comes close to temperature performance', 'Can replace metal in many applications'],
      whyChooseThis: 'When no other plastic can survive the temperature, chemical, or radiation environment.',
    },
    weaknesses: {
      limitations: ['Requires 400°C+ hotend', 'Needs 160°C+ heated chamber', 'Extremely expensive ($500+/kg)', 'Specialized equipment required'],
      commonProblems: ['Crystallization control is critical', 'Requires annealing for optimal properties', 'Very few printers can handle it'],
      environmentalConcerns: ['Extremely energy-intensive to produce', 'Processing requires high temperatures'],
      whenNotToUse: ['Any application where a cheaper material works', 'Printers without high-temp capability (99% of them)'],
    },
    practicalContext: {
      industryAdoption: ['Aerospace', 'Medical implants', 'Oil & gas', 'Semiconductor', 'Nuclear'],
      commonApplications: ['Spinal implants', 'Jet engine components', 'Downhole tools', 'Wafer handling equipment'],
      safetyStandards: ['FDA cleared for permanent implants', 'Various aerospace certifications'],
      costPosition: 'Industrial',
    },
    trivia: {
      funFacts: [
        'PEEK is used as a bone replacement in spinal fusion surgeries',
        'Costs more per kilogram than silver',
        'Can withstand steam sterilization (autoclave)',
        'Used in racing car brakes and jet engine components',
      ],
      whyInvented: 'Created as a high-performance plastic that could survive extreme aerospace and industrial conditions.',
      controversies: [
        'Many "PEEK-capable" printers cannot actually print PEEK well',
        'Material cost makes it inaccessible to most makers',
        'Some manufacturers claim PEEK properties for PEKK or lower grades',
      ],
      marketAdoption: 'Very niche - only serious industrial users with specialized $50,000+ equipment.',
    },
    tdsProfile: {
      properties: [
        { name: 'Tensile Strength', value: '90-100', unit: 'MPa', implications: 'Exceptional. Rivals many metals for strength.' },
        { name: 'Elongation at Break', value: '30-50', unit: '%', implications: 'Good ductility. Does not shatter.' },
        { name: "Young's Modulus", value: '3500-4000', unit: 'MPa', implications: 'Very stiff. Similar to aluminum.' },
        { name: 'Impact Strength', value: '50-80', unit: 'kJ/m²', implications: 'Good toughness for such a strong material.' },
        { name: 'Glass Transition (Tg)', value: '143', unit: '°C', implications: 'Very high. Maintains properties at elevated temps.' },
        { name: 'Continuous Use Temp', value: '250', unit: '°C', implications: 'Exceptional. Can operate near metal temperatures.' },
      ],
      notes: 'Printed PEEK requires annealing to achieve full crystallinity and optimal properties.',
    },
    printSettings: {
      nozzleTemp: { min: 380, max: 420, optimal: 400 },
      bedTemp: { min: 120, max: 160, optimal: 140 },
      coolingFan: { min: 0, max: 0, notes: 'NO cooling. Cooling prevents proper crystallization.' },
      enclosure: { required: true, notes: 'MANDATORY. Chamber temperature 120-160°C required. Most consumer printers cannot achieve this.' },
      drying: { temp: 150, duration: '4-8 hours', notes: 'Must be dried at high temp. Moisture causes severe issues.' },
      printSpeed: { recommended: '10-30 mm/s', notes: 'Very slow printing required for proper layer adhesion.' },
      additionalNotes: [
        'All-metal hotend rated for 400°C+ required',
        'High-temp bed and chamber heaters mandatory',
        'Requires annealing for full properties',
        'Specialized PEEK printers cost $50,000+',
      ],
    },
    adhesion: {
      bedSurfaces: {
        excellent: ['PEI (high-temp grade)', 'PEEK sheet'],
        good: ['Garolite at high temps'],
        poor: ['Standard surfaces - temps too high'],
      },
      releaseAgents: 'Usually not needed - PEEK has good release. Avoid adhesives that degrade at high temps.',
      multiMaterial: [
        { material: 'PEKK', bondQuality: 'Strong Chemical Bond', notes: 'Same PAEK family, excellent compatibility.' },
        { material: 'Carbon Fiber', bondQuality: 'Strong Chemical Bond', notes: 'PEEK-CF is common composite.' },
      ],
    },
    postProcessing: {
      chemicalSmoothing: [
        { method: 'Chemical', effectiveness: 'Not Possible', notes: 'PEEK is chemically inert - resists all common solvents.' },
      ],
      mechanical: ['Machines beautifully', 'Can be polished', 'CNC machining common', 'Accepts threads well'],
      glues: ['Specialty PEEK adhesives', 'Mechanical fastening often preferred', 'Epoxy with surface prep'],
      painting: 'Primer required for paint adhesion due to chemical inertness.',
    },
    safety: {
      fumes: { level: 'Low', notes: 'Despite high temps, PEEK has low emissions. Still requires ventilation for any high-temp printing.' },
      foodSafety: { rating: 'FDA Approved', notes: 'FDA cleared for food contact. Medical/implant grades exist.' },
      biodegradability: { rating: 'Not Biodegradable', notes: 'Extremely stable polymer. Does not degrade in any environment.' },
      additionalNotes: [
        'Biocompatible - used for permanent medical implants',
        'Can be autoclaved for sterilization',
        'Chemically inert - resists nearly all chemicals',
      ],
    },
  },

  'PVA': {
    name: 'PVA',
    fullName: 'Polyvinyl Alcohol',
    origin: {
      yearInvented: '1924',
      originalCompany: 'First synthesized by Hermann and Haehnel in Germany',
      keyMilestones: [
        '1924: First synthesized',
        '1930s: Industrial production begins',
        '2012+: PVA support material enters 3D printing',
      ],
      majorManufacturers: ['Ultimaker', 'Polymaker', 'eSUN', 'MatterHackers'],
    },
    composition: {
      basePolymer: 'PVA (Polyvinyl Alcohol)',
      chemicalFamily: 'Vinyl Polymer (water-soluble)',
      keyAdditives: ['Plasticizers for flexibility', 'Stabilizers'],
      coloringAgents: 'Usually natural (off-white) as color isn\'t needed for supports',
    },
    familyContext: {
      parentPolymer: 'Made by hydrolysis of polyvinyl acetate (PVAc, white glue)',
      variants: ['PVA', 'Enhanced PVA (faster dissolving)', 'PVA+'],
      chemicalComparison: 'Unique among plastics for being truly water-soluble.',
      evolution: 'Adapted from industrial applications (paper coatings, packaging films) to 3D printing supports.',
    },
    strengths: {
      uniqueProperties: ['Completely water-soluble', 'Clean dissolution leaves no residue', 'Compatible with PLA'],
      bestUseScenarios: ['Complex support structures', 'Internal cavities', 'Multi-material printing', 'Clean finish required'],
      advantagesOverCompetitors: ['No support removal work', 'Access to impossible geometries', 'Perfect surface under supports'],
      whyChooseThis: 'When you need supports in places you can\'t reach to remove them mechanically.',
    },
    weaknesses: {
      limitations: ['Extremely moisture sensitive', 'Requires dual extrusion', 'Expensive for supports', 'Limited material compatibility'],
      commonProblems: ['Absorbs moisture in hours', 'Jams if wet', 'Requires very dry storage', 'Slow to dissolve (hours to days)'],
      environmentalConcerns: ['Dissolves into microplastics in water', 'Energy-intensive drying requirements'],
      whenNotToUse: ['Humid environments', 'When breakaway supports work', 'Single-extruder printers'],
    },
    practicalContext: {
      industryAdoption: ['Prototyping', 'Medical models', 'Education', 'High-end consumer products'],
      commonApplications: ['Internal channels', 'Delicate overhangs', 'Hollow geometries', 'Smooth undersides'],
      costPosition: 'Premium',
    },
    trivia: {
      funFacts: [
        'PVA is the same material in those dissolving laundry pods',
        'Elmer\'s glue becomes PVA when dry',
        'Takes 2-24 hours to fully dissolve depending on temperature and agitation',
      ],
      whyInvented: 'Originally for paper coatings and packaging - 3D printing is a secondary application.',
      controversies: [
        'Environmental impact of dissolving plastic into water systems',
        'Extremely demanding storage requirements often not communicated',
      ],
      marketAdoption: 'Niche adoption - only useful for dual extrusion printers with complex parts.',
    },
    tdsProfile: {
      properties: [
        { name: 'Tensile Strength', value: '20-30', unit: 'MPa', implications: 'Low - not a structural material. Designed for dissolution.' },
        { name: 'Elongation at Break', value: '100-200', unit: '%', implications: 'High flexibility to prevent crumbling.' },
        { name: 'Solubility', value: 'Complete', unit: '', implications: 'Dissolves fully in water, leaving no residue.' },
        { name: 'Dissolution Time', value: '2-24', unit: 'hours', implications: 'Varies with water temperature and agitation.' },
        { name: 'Water Temperature', value: '40-60', unit: '°C optimal', implications: 'Warm water dissolves faster than cold.' },
      ],
      notes: 'Mechanical properties irrelevant - PVA is used solely for dissolvable supports.',
    },
    printSettings: {
      nozzleTemp: { min: 185, max: 210, optimal: 195 },
      bedTemp: { min: 45, max: 60, optimal: 55 },
      coolingFan: { min: 50, max: 100, notes: 'Moderate cooling helps with print quality.' },
      enclosure: { required: false, notes: 'Not required, but keep humidity controlled.' },
      drying: { temp: 45, duration: '4-8 hours', notes: 'CRITICAL. PVA absorbs moisture extremely rapidly. Must print from dry box. Re-dry if exposed for more than 30 minutes.' },
      printSpeed: { recommended: '20-40 mm/s', notes: 'Slower speeds for interface layers with model material.' },
      additionalNotes: [
        'Print from dry box - this is NOT optional',
        'Store with maximum desiccant',
        'Set interface Z distance to 0 for best dissolution',
        'Purge tower needed between materials',
      ],
    },
    adhesion: {
      bedSurfaces: {
        excellent: ['PEI (Smooth)', 'Glass with glue'],
        good: ['PEI (Textured)', 'Blue tape'],
        poor: ['Bare surfaces without adhesion aid'],
      },
      releaseAgents: 'Light glue stick helps with adhesion and release balance.',
      multiMaterial: [
        { material: 'PLA', bondQuality: 'Strong Chemical Bond', notes: 'The primary pairing - PVA is designed for PLA support.' },
        { material: 'PETG', bondQuality: 'Weak Bond', notes: 'Works but not as clean as with PLA.' },
        { material: 'TPU', bondQuality: 'Mechanical Bond', notes: 'Possible but not common use case.' },
      ],
    },
    postProcessing: {
      chemicalSmoothing: [
        { method: 'Water Dissolution', effectiveness: 'Excellent', notes: 'The entire point - dissolves in water.' },
      ],
      mechanical: ['Not applicable - material is meant to be dissolved'],
      glues: ['Not applicable'],
      painting: 'Not applicable.',
    },
    safety: {
      fumes: { level: 'Very Low', notes: 'PVA has very low emissions. Safe for enclosed spaces.' },
      foodSafety: { rating: 'Safe (Raw Material)', notes: 'PVA itself is non-toxic - used in food packaging. Dissolves anyway.' },
      biodegradability: { rating: 'Dissolves in Water', notes: 'Not truly biodegradable but dissolves. Environmental impact of dissolved PVA is debated.' },
      additionalNotes: [
        'Non-toxic - safe for classroom use',
        'Same material as in glue sticks',
        'Dissolved PVA should not be poured into storm drains',
      ],
    },
  },

  'HIPS': {
    name: 'HIPS',
    fullName: 'High Impact Polystyrene',
    origin: {
      yearInvented: '1950s',
      originalCompany: 'Various - evolved from polystyrene development',
      keyMilestones: [
        '1930s: Polystyrene first commercialized',
        '1950s: Rubber-modified HIPS developed for improved impact resistance',
        '1960s: Becomes standard for appliance housings',
        '2012+: Adopted as ABS support material in 3D printing',
      ],
      majorManufacturers: ['INEOS Styrolution', 'SABIC', 'Total', 'eSUN', 'MatterHackers'],
    },
    composition: {
      basePolymer: 'Polystyrene modified with polybutadiene rubber',
      chemicalFamily: 'Styrenic Polymer',
      keyAdditives: ['Polybutadiene rubber (5-15%)', 'Antioxidants', 'UV stabilizers'],
      coloringAgents: 'Natural white color, easily pigmented',
      specialFillers: ['Rarely filled - used primarily as support material'],
    },
    familyContext: {
      parentPolymer: 'Polystyrene (PS) - the rubber adds impact resistance',
      variants: ['Standard HIPS', 'Flame-retardant HIPS', 'UV-stabilized HIPS'],
      chemicalComparison: 'Softer and more impact resistant than regular PS, dissolves in limonene unlike ABS.',
      evolution: 'From packaging/appliance material to specialized 3D printing support material.',
    },
    strengths: {
      uniqueProperties: ['Dissolves in limonene (d-limonene)', 'Compatible with ABS', 'Lightweight', 'Easy to print'],
      bestUseScenarios: ['Support material for ABS prints', 'Lightweight models', 'Packaging prototypes'],
      advantagesOverCompetitors: ['Cheaper than PVA', 'More humidity resistant than PVA', 'Good ABS compatibility'],
      whyChooseThis: 'The best support material for ABS - dissolves cleanly and prints at similar temperatures.',
    },
    weaknesses: {
      limitations: ['Only dissolves in limonene (expensive, strong smell)', 'Not compatible with PLA', 'Weak structural material'],
      commonProblems: ['Warping similar to ABS', 'Limonene disposal issues', 'Slow dissolution'],
      environmentalConcerns: ['Petroleum-based', 'Limonene is a VOC', 'Not recyclable in most areas'],
      whenNotToUse: ['As a structural material', 'With PLA prints', 'When PVA (water-soluble) is available'],
    },
    practicalContext: {
      industryAdoption: ['Packaging', 'Appliances', 'Toys', 'Disposable items'],
      commonApplications: ['ABS support structures', 'Refrigerator liners', 'CD cases', 'Disposable cutlery'],
      safetyStandards: ['FDA approved grades exist', 'UL94 rated versions available'],
      costPosition: 'Budget',
    },
    trivia: {
      funFacts: [
        'Limonene is extracted from orange peels - HIPS dissolution smells like oranges',
        'HIPS is what most disposable coffee cup lids are made from',
        'The rubber particles in HIPS are visible under microscope as tiny spheres',
      ],
      whyInvented: 'Created to make polystyrene less brittle for applications requiring impact resistance.',
      controversies: [
        'Limonene vapor is a respiratory irritant - requires ventilation',
        'Often confused with regular polystyrene which doesn\'t have the impact modifier',
      ],
      marketAdoption: 'Limited 3D printing adoption - mostly by ABS users needing soluble supports.',
    },
    tdsProfile: {
      properties: [
        { name: 'Tensile Strength', value: '20-30', unit: 'MPa', implications: 'Low. Not for structural use - it\'s a support material.' },
        { name: 'Elongation at Break', value: '20-60', unit: '%', implications: 'Moderate flexibility before breaking.' },
        { name: "Young's Modulus", value: '1800-2200', unit: 'MPa', implications: 'Moderate stiffness. Light and easy to work with.' },
        { name: 'Impact Strength', value: '80-120', unit: 'J/m', implications: 'Better than standard polystyrene due to rubber.' },
        { name: 'Glass Transition (Tg)', value: '95-100', unit: '°C', implications: 'Similar to ABS. Compatible print temperatures.' },
        { name: 'Dissolution Time', value: '12-48', unit: 'hours', implications: 'Slow dissolution in limonene. Requires patience.' },
      ],
      notes: 'Properties similar to standard polystyrene but with improved impact resistance.',
    },
    printSettings: {
      nozzleTemp: { min: 220, max: 250, optimal: 235 },
      bedTemp: { min: 90, max: 110, optimal: 100 },
      coolingFan: { min: 0, max: 30, notes: 'Minimal cooling like ABS to prevent warping.' },
      enclosure: { required: true, notes: 'Required for same reasons as ABS - prevents warping.' },
      drying: { temp: 60, duration: '4-6 hours', notes: 'Less hygroscopic than PVA but still benefits from drying.' },
      printSpeed: { recommended: '40-60 mm/s', notes: 'Similar speeds to ABS.' },
      additionalNotes: [
        'Print settings nearly identical to ABS',
        'Use with ABS for support material',
        'Same bed adhesion methods as ABS work well',
      ],
    },
    adhesion: {
      bedSurfaces: {
        excellent: ['ABS slurry', 'Garolite (G10)', 'PEI (Textured)'],
        good: ['Kapton tape with glue', 'Glass with adhesive'],
        poor: ['Bare glass', 'Blue tape at high temps'],
      },
      releaseAgents: 'Same as ABS - ABS slurry or glue stick.',
      multiMaterial: [
        { material: 'ABS', bondQuality: 'Strong Chemical Bond', notes: 'Primary use case - dissolves away to leave ABS part.' },
        { material: 'ASA', bondQuality: 'Strong Chemical Bond', notes: 'Also works as support for ASA.' },
        { material: 'PLA', bondQuality: 'No Bond', notes: 'Not compatible - use PVA for PLA.' },
      ],
    },
    postProcessing: {
      chemicalSmoothing: [
        { method: 'Limonene (d-Limonene)', effectiveness: 'Excellent', notes: 'Dissolves completely in 12-48 hours with agitation.' },
        { method: 'Acetone', effectiveness: 'Good', notes: 'Also dissolves HIPS, faster than limonene but harsher on ABS.' },
      ],
      mechanical: ['Easy to sand', 'Lightweight for carving', 'Can be painted'],
      glues: ['Styrene cement', 'Cyanoacrylate', 'Model glue'],
      painting: 'Accepts paint well. Prime first for best results.',
    },
    safety: {
      fumes: { level: 'Moderate', notes: 'Similar to ABS - styrene emissions. Requires good ventilation.' },
      foodSafety: { rating: 'FDA Grades Exist', notes: 'Used in food packaging (coffee cup lids) but not recommended for printed parts.' },
      biodegradability: { rating: 'Not Biodegradable', notes: 'Petroleum-based styrenic. Does not biodegrade.' },
      additionalNotes: [
        'Styrene emissions require ventilation',
        'Limonene dissolution requires ventilation - strong citrus smell',
        'Dispose of limonene solution properly',
      ],
    },
  },

  'PP': {
    name: 'PP',
    fullName: 'Polypropylene',
    origin: {
      yearInvented: '1954',
      originalCompany: 'Giulio Natta and Karl Ziegler (Nobel Prize 1963)',
      keyMilestones: [
        '1954: Isotactic polypropylene synthesized by Natta',
        '1957: Commercial production begins (Montecatini)',
        '1963: Natta and Ziegler win Nobel Prize for polymerization catalysts',
        '2017+: PP filaments become available for 3D printing',
      ],
      majorManufacturers: ['LyondellBasell', 'SABIC', 'ExxonMobil', 'Verbatim', 'Fiberlogy'],
    },
    composition: {
      basePolymer: 'Polypropylene (isotactic)',
      chemicalFamily: 'Polyolefin',
      keyAdditives: ['Nucleating agents', 'Clarifying agents (for transparency)', 'Antioxidants'],
      coloringAgents: 'Natural translucent white, easily colored',
      specialFillers: ['Glass fiber (PP-GF)', 'Carbon fiber (PP-CF)', 'Talc'],
    },
    familyContext: {
      parentPolymer: 'Propylene monomer - similar chemistry to polyethylene',
      variants: ['PP Homopolymer', 'PP Copolymer', 'PP-GF', 'PP-CF'],
      chemicalComparison: 'Higher heat resistance than PE, excellent chemical resistance, unique living hinge capability.',
      evolution: 'From industrial bulk plastic to specialized 3D printing material for chemical-resistant parts.',
    },
    strengths: {
      uniqueProperties: ['Living hinge capability (flex millions of times)', 'Excellent chemical resistance', 'Fatigue resistant', 'Food-safe', 'Floats on water'],
      bestUseScenarios: ['Living hinges', 'Chemical containers', 'Food packaging', 'Snap-fit closures', 'Medical containers'],
      advantagesOverCompetitors: ['Best living hinge material', 'Superior chemical resistance', 'Lower density than most plastics'],
      whyChooseThis: 'When you need living hinges or extreme chemical resistance - nothing else performs as well.',
    },
    weaknesses: {
      limitations: ['Extremely difficult bed adhesion', 'Significant warping', 'Poor interlayer adhesion', 'Limited bonding options'],
      commonProblems: ['Bed adhesion nightmares', 'Parts warping off bed', 'Layer delamination', 'Nothing sticks to PP'],
      environmentalConcerns: ['Petroleum-based', 'Recycling contamination issues', 'Microplastic concerns'],
      whenNotToUse: ['When other materials work', 'Beginners', 'Without specialized PP build surfaces', 'Structural parts'],
    },
    practicalContext: {
      industryAdoption: ['Packaging', 'Automotive', 'Medical', 'Consumer goods', 'Textiles (fibers)'],
      commonApplications: ['Bottle caps', 'Food containers', 'Living hinge boxes', 'Medical syringes', 'Car bumpers'],
      safetyStandards: ['FDA food contact approved', 'USP Class VI medical grades', 'Widely certified'],
      costPosition: 'Standard',
    },
    trivia: {
      funFacts: [
        'PP is the second most produced plastic in the world (after PE)',
        'A well-designed PP living hinge can flex over 1 million cycles',
        'PP has the lowest density of commodity plastics - it floats',
        'Tic Tac boxes use PP living hinges',
      ],
      whyInvented: 'Developed as a high-performance alternative to polyethylene with better heat and chemical resistance.',
      controversies: [
        'Recycling PP is difficult due to food contamination',
        '3D printing PP is so difficult many consider it not worth the effort',
        'Often mislabeled as "easy PP" when blended with other materials',
      ],
      marketAdoption: 'Very niche in 3D printing - only specialists who absolutely need PP properties use it.',
    },
    tdsProfile: {
      properties: [
        { name: 'Tensile Strength', value: '25-40', unit: 'MPa', implications: 'Moderate. Lower than PLA but with much better fatigue resistance.' },
        { name: 'Elongation at Break', value: '100-600', unit: '%', implications: 'Very High. Excellent for living hinges and flexible applications.' },
        { name: "Young's Modulus", value: '1100-1600', unit: 'MPa', implications: 'Low stiffness. Flexible and forgiving material.' },
        { name: 'Impact Strength', value: 'No Break', unit: '(Notched Izod)', implications: 'Exceptional. PP often doesn\'t break in impact tests.' },
        { name: 'Glass Transition (Tg)', value: '-10 to 0', unit: '°C', implications: 'Very Low Tg. Remains flexible at cold temperatures.' },
        { name: 'Heat Deflection (HDT)', value: '100-110', unit: '°C (0.45 MPa)', implications: 'Good heat resistance. Better than PLA and PETG.' },
        { name: 'Density', value: '0.90-0.91', unit: 'g/cm³', implications: 'Lowest density of commodity plastics - floats on water.' },
      ],
      notes: 'Properties vary between homopolymer and copolymer grades. Fatigue resistance is exceptional.',
    },
    printSettings: {
      nozzleTemp: { min: 220, max: 260, optimal: 240 },
      bedTemp: { min: 80, max: 100, optimal: 90 },
      coolingFan: { min: 0, max: 50, notes: 'Minimal cooling to prevent warping. Some cooling helps with bridges.' },
      enclosure: { required: true, notes: 'Highly recommended to prevent warping. Keep ambient temperature stable.' },
      drying: { temp: 60, duration: '4-6 hours', notes: 'Less hygroscopic than nylon but still benefits from drying.' },
      printSpeed: { recommended: '20-50 mm/s', notes: 'Slow speeds help with bed adhesion and layer bonding.' },
      additionalNotes: [
        'PP-specific build surfaces are MANDATORY',
        'Standard beds will not work - parts will detach mid-print',
        'Print on PP tape, PP sheet, or packing tape',
        'Raft strongly recommended for all prints',
        'First layer adhesion is the #1 challenge',
      ],
    },
    adhesion: {
      bedSurfaces: {
        excellent: ['PP sheet', 'PP tape', 'Packing tape (PP-based)'],
        good: ['Specialized PP build plates'],
        poor: ['PEI', 'Glass', 'Blue tape', 'BuildTak', 'Everything else'],
      },
      releaseAgents: 'Not applicable - the challenge is getting PP to STICK, not release.',
      multiMaterial: [
        { material: 'TPE/TPU', bondQuality: 'No Bond', notes: 'PP bonds to almost nothing. This is a feature and a bug.' },
        { material: 'PE', bondQuality: 'Weak Bond', notes: 'Same polyolefin family, slight compatibility.' },
        { material: 'EVOH', bondQuality: 'Mechanical Bond', notes: 'Used as tie layer in industrial applications.' },
      ],
    },
    postProcessing: {
      chemicalSmoothing: [
        { method: 'Xylene', effectiveness: 'Good', notes: 'Works but xylene is highly toxic. Not recommended.' },
        { method: 'Most Solvents', effectiveness: 'Not Possible', notes: 'PP is chemically resistant to most solvents.' },
      ],
      mechanical: ['Sands with difficulty', 'Can be machined', 'Welding/friction welding works well', 'Heat gun welding effective'],
      glues: ['Hot glue', 'PP-specific adhesives', 'Friction welding', 'Heat staking'],
      painting: 'Very difficult - requires PP primer or flame treatment. Paint doesn\'t adhere to untreated PP.',
    },
    safety: {
      fumes: { level: 'Low', notes: 'PP has low emissions when printing. Generally considered safe with normal ventilation.' },
      foodSafety: { rating: 'FDA Approved', notes: 'PP is widely used for food containers. One of the safest food-contact plastics. Microwave safe.' },
      biodegradability: { rating: 'Not Biodegradable', notes: 'Petroleum-based polyolefin. Does not biodegrade but is recyclable (Type 5).' },
      additionalNotes: [
        'One of the safest plastics for food contact',
        'Microwave safe - won\'t leach chemicals when heated',
        'Recycling code #5 - accepted in many programs',
        'No BPA or phthalates',
      ],
    },
  },

  'CPE': {
    name: 'CPE',
    fullName: 'Copolyester (co-polyethylene terephthalate)',
    origin: {
      yearInvented: '1970s-1980s (copolyester development)',
      originalCompany: 'Eastman Chemical Company (Eastar/Tritan lines)',
      keyMilestones: [
        '1970s: Copolyester chemistry developed',
        '2008: Eastman launches Tritan (BPA-free copolyester)',
        '2015: Ultimaker introduces CPE filament line',
        '2018+: CPE becomes premium PETG alternative',
      ],
      majorManufacturers: ['Eastman (raw material)', 'Ultimaker', 'colorFabb', 'Fillamentum'],
    },
    composition: {
      basePolymer: 'Copolyester (modified PET)',
      chemicalFamily: 'Copolyester / Modified Polyester',
      keyAdditives: ['Co-monomers for property modification', 'Clarifying agents', 'Impact modifiers'],
      coloringAgents: 'Excellent clarity, can be water-clear or colored',
      specialFillers: ['Carbon fiber (CPE-CF)', 'Rarely filled due to clarity focus'],
    },
    familyContext: {
      parentPolymer: 'Based on PET, modified with co-monomers for improved properties',
      variants: ['CPE', 'CPE+', 'CPE HG100', 'Tritan-based copolyesters'],
      chemicalComparison: 'Better chemical resistance than PETG, similar to PC in some properties but easier to print.',
      evolution: 'Developed as premium PETG alternative with better chemical and heat resistance.',
    },
    strengths: {
      uniqueProperties: ['Excellent clarity/transparency', 'Good chemical resistance', 'Higher heat resistance than PETG', 'Toughness'],
      bestUseScenarios: ['Clear containers', 'Chemical-resistant parts', 'Premium prototypes', 'Medical models'],
      advantagesOverCompetitors: ['Clearer than PETG', 'More chemical resistant', 'BPA-free (Tritan-based)', 'Easier than PC'],
      whyChooseThis: 'When you need PETG-like ease of printing with better optical clarity and chemical resistance.',
    },
    weaknesses: {
      limitations: ['More expensive than PETG', 'Limited color selection', 'Not as strong as PC', 'Less available'],
      commonProblems: ['Stringing similar to PETG', 'Moisture sensitivity', 'Premium pricing'],
      environmentalConcerns: ['Petroleum-based', 'Not biodegradable', 'Recycling challenges'],
      whenNotToUse: ['When standard PETG works', 'Budget-conscious projects', 'When maximum strength needed'],
    },
    practicalContext: {
      industryAdoption: ['Medical devices', 'Food service', 'Consumer goods', 'Signage'],
      commonApplications: ['Water bottles (Tritan)', 'Medical containers', 'Clear enclosures', 'Display cases'],
      safetyStandards: ['FDA food contact (Tritan grades)', 'BPA-free certification', 'Medical grades available'],
      costPosition: 'Premium',
    },
    trivia: {
      funFacts: [
        'Tritan was developed specifically as BPA-free alternative to polycarbonate',
        'Nalgene water bottles switched from PC to Tritan after BPA concerns',
        'CPE can achieve near-glass clarity in thin sections',
      ],
      whyInvented: 'Created to combine the best properties of PETG and PC while being easier to process and BPA-free.',
      controversies: [
        'Some CPE formulations contain proprietary additives with unknown compositions',
        'Premium pricing sometimes not justified vs standard PETG',
      ],
      marketAdoption: 'Niche premium market - users willing to pay extra for improved properties over PETG.',
    },
    tdsProfile: {
      properties: [
        { name: 'Tensile Strength', value: '50-60', unit: 'MPa', implications: 'Good. Similar to PETG but with better consistency.' },
        { name: 'Elongation at Break', value: '100-150', unit: '%', implications: 'High ductility. Will stretch before breaking.' },
        { name: "Young's Modulus", value: '1800-2200', unit: 'MPa', implications: 'Moderate stiffness. Slightly stiffer than PETG.' },
        { name: 'Impact Strength', value: '80-100', unit: 'kJ/m² (Notched)', implications: 'Excellent impact resistance, similar to PC.' },
        { name: 'Glass Transition (Tg)', value: '80-110', unit: '°C', implications: 'Better than PETG. Varies by grade - HG100 has higher Tg.' },
        { name: 'Heat Deflection (HDT)', value: '75-105', unit: '°C (0.45 MPa)', implications: 'Good heat resistance. Higher-grade CPE exceeds standard PETG significantly.' },
      ],
      notes: 'Properties vary between CPE grades. CPE+ and HG100 have significantly higher heat resistance.',
    },
    printSettings: {
      nozzleTemp: { min: 250, max: 280, optimal: 265 },
      bedTemp: { min: 75, max: 95, optimal: 85 },
      coolingFan: { min: 25, max: 75, notes: 'Moderate cooling. Less than PETG to maintain clarity and layer adhesion.' },
      enclosure: { required: false, notes: 'Not required but helps with larger parts and higher-temp grades.' },
      drying: { temp: 70, duration: '4-6 hours', notes: 'Hygroscopic like PETG. Dry before printing for best results.' },
      printSpeed: { recommended: '40-70 mm/s', notes: 'Slightly slower than PETG. Slower speeds improve clarity.' },
      additionalNotes: [
        'Higher temps than PETG - typically 250-280°C',
        'CPE+ and HG100 require even higher temperatures',
        'Use release agent on smooth PEI (Windex, glue stick)',
        'Stringing similar to PETG - tune retraction carefully',
      ],
    },
    adhesion: {
      bedSurfaces: {
        excellent: ['PEI (Textured) with release agent', 'Glass with adhesive'],
        good: ['BuildTak', 'Blue tape'],
        poor: ['Bare smooth PEI (will damage surface)'],
      },
      releaseAgents: 'Critical on smooth PEI. Use Windex or glue stick as release agent.',
      multiMaterial: [
        { material: 'PLA', bondQuality: 'No Bond', notes: 'Not compatible - similar to PETG behavior.' },
        { material: 'TPU', bondQuality: 'Weak Bond', notes: 'Some adhesion possible but not structural.' },
        { material: 'PVA', bondQuality: 'Weak Bond', notes: 'Limited compatibility for supports.' },
      ],
    },
    postProcessing: {
      chemicalSmoothing: [
        { method: 'Acetone', effectiveness: 'Not Possible', notes: 'No effect on CPE.' },
        { method: 'Dichloromethane', effectiveness: 'Good', notes: 'Works but extremely toxic. Professional only.' },
      ],
      mechanical: ['Sands well', 'Polishes to high clarity', 'Can achieve near-glass finish', 'Machines cleanly'],
      glues: ['Cyanoacrylate', 'Epoxy', 'Some plastic cements'],
      painting: 'Accepts paint after light sanding or primer. Good surface for finishing.',
    },
    safety: {
      fumes: { level: 'Low', notes: 'Low emissions similar to PETG. Normal ventilation sufficient.' },
      foodSafety: { rating: 'FDA Approved (Tritan grades)', notes: 'Tritan-based CPE is FDA food contact approved and BPA-free. Widely used for water bottles.' },
      biodegradability: { rating: 'Not Biodegradable', notes: 'Petroleum-based copolyester. Not biodegradable but recyclable with proper facilities.' },
      additionalNotes: [
        'BPA-free - major selling point over polycarbonate',
        'Tritan grades specifically formulated for food safety',
        'Safe for hot and cold food/beverage contact',
        'Does not leach harmful chemicals',
      ],
    },
  },

  'PEI': {
    name: 'PEI',
    fullName: 'Polyetherimide (Ultem)',
    origin: {
      yearInvented: '1982',
      originalCompany: 'General Electric (now SABIC)',
      keyMilestones: [
        '1982: PEI (Ultem) introduced by GE Plastics',
        '1990s: Becomes standard aerospace material',
        '2007: SABIC acquires GE Plastics',
        '2015+: High-temp 3D printers enable PEI printing',
      ],
      majorManufacturers: ['SABIC (Ultem)', '3DXTech', 'Stratasys (FDM systems)', 'Intamsys'],
    },
    composition: {
      basePolymer: 'Polyetherimide',
      chemicalFamily: 'Polyimide (amorphous)',
      keyAdditives: ['Glass fiber (PEI-GF)', 'Carbon fiber (PEI-CF)', 'ESD additives'],
      coloringAgents: 'Natural amber/yellow color, limited color options',
      specialFillers: ['Glass fiber (30%)', 'Carbon fiber'],
    },
    familyContext: {
      parentPolymer: 'Polyimide family - amorphous version of high-temp polyimides',
      variants: ['Ultem 1000 (unfilled)', 'Ultem 1010 (food-contact)', 'Ultem 9085 (aerospace)', 'ESD-PEI'],
      chemicalComparison: 'Lower performance than PEEK but much easier to process. Better than PC for high-temp.',
      evolution: 'Developed as processable alternative to thermoset polyimides for injection molding and now 3D printing.',
    },
    strengths: {
      uniqueProperties: ['217°C continuous use temp', 'Inherently flame retardant', 'Low smoke emission', 'Chemical resistant'],
      bestUseScenarios: ['Aerospace components', 'Automotive under-hood', 'Medical devices', 'Electrical insulators'],
      advantagesOverCompetitors: ['Easier than PEEK', 'FAR 25.853 compliant (aircraft interiors)', 'Inherent flame retardancy'],
      whyChooseThis: 'The go-to material for aerospace interior parts - certified for aircraft and high-performance but printable.',
    },
    weaknesses: {
      limitations: ['Requires 350°C+ hotend', 'Needs heated chamber', 'Expensive ($200+/kg)', 'Limited printer compatibility'],
      commonProblems: ['Requires specialized equipment', 'Moisture absorption', 'Layer adhesion challenges', 'High cost'],
      environmentalConcerns: ['Energy-intensive production', 'Not recyclable in most facilities', 'Specialty waste handling'],
      whenNotToUse: ['Consumer applications', 'Budget projects', 'Printers without high-temp capability'],
    },
    practicalContext: {
      industryAdoption: ['Aerospace', 'Automotive', 'Medical', 'Semiconductor', 'Food service equipment'],
      commonApplications: ['Aircraft interior parts', 'Jet engine components', 'Sterilizable medical trays', 'Electrical connectors'],
      safetyStandards: ['FAR 25.853 (aircraft interiors)', 'FDA food contact (1010)', 'UL94 V-0', 'USP Class VI'],
      costPosition: 'Industrial',
    },
    trivia: {
      funFacts: [
        'Ultem is used in commercial aircraft overhead bins and galley equipment',
        'The amber color comes from the polymer backbone - it\'s not a dye',
        'PEI can be steam sterilized repeatedly without degradation',
        'Some commercial coffee machines use Ultem for hot water components',
      ],
      whyInvented: 'Created as a melt-processable alternative to thermoset polyimides for aerospace injection molding.',
      controversies: [
        'SABIC tightly controls the Ultem trademark and supply chain',
        'Many "PEI" filaments don\'t meet Ultem specifications',
        'High barrier to entry due to equipment requirements',
      ],
      marketAdoption: 'Professional/industrial only - requires $10,000+ printers and aerospace certifications drive adoption.',
    },
    tdsProfile: {
      properties: [
        { name: 'Tensile Strength', value: '100-115', unit: 'MPa', implications: 'Very High. Stronger than most engineering plastics.' },
        { name: 'Elongation at Break', value: '50-80', unit: '%', implications: 'Good ductility for a high-performance polymer.' },
        { name: "Young's Modulus", value: '3000-3500', unit: 'MPa', implications: 'High stiffness. Rigid and dimensionally stable.' },
        { name: 'Impact Strength', value: '50-65', unit: 'kJ/m² (Notched)', implications: 'Good. Not brittle despite high strength.' },
        { name: 'Glass Transition (Tg)', value: '215-217', unit: '°C', implications: 'Excellent. One of the highest Tg values in printable plastics.' },
        { name: 'Heat Deflection (HDT)', value: '200-210', unit: '°C (1.8 MPa)', implications: 'Outstanding heat resistance. Rated for continuous 170°C+ service.' },
        { name: 'Flammability', value: 'V-0', unit: 'UL94', implications: 'Inherently flame retardant without additives.' },
      ],
      notes: 'Ultem 9085 is the aerospace grade with FST (flame, smoke, toxicity) certifications.',
    },
    printSettings: {
      nozzleTemp: { min: 350, max: 390, optimal: 370 },
      bedTemp: { min: 120, max: 160, optimal: 140 },
      coolingFan: { min: 0, max: 30, notes: 'Minimal or no cooling. Slow cooling improves layer adhesion.' },
      enclosure: { required: true, notes: 'MANDATORY. Heated chamber 90-130°C required for proper printing.' },
      drying: { temp: 150, duration: '4-8 hours', notes: 'Must be thoroughly dried. PEI is hygroscopic. Print from dry box.' },
      printSpeed: { recommended: '20-40 mm/s', notes: 'Slow speeds for best layer adhesion and part quality.' },
      additionalNotes: [
        'All-metal hotend rated for 400°C+ required',
        'Heated chamber is not optional - parts will warp without it',
        'Print on PEI sheet or high-temp materials',
        'Specialized printers (Stratasys Fortus, Intamsys) designed for this',
        'Consumer printers generally cannot print PEI',
      ],
    },
    adhesion: {
      bedSurfaces: {
        excellent: ['PEI sheet (high-temp grade)', 'Ultem sheet', 'Garolite at high temp'],
        good: ['Glass with high-temp adhesive'],
        poor: ['Standard surfaces - cannot withstand bed temps'],
      },
      releaseAgents: 'Usually not needed. Parts release when bed cools. High-temp Kapton tape can help.',
      multiMaterial: [
        { material: 'PEEK', bondQuality: 'Weak Bond', notes: 'Different polymer families, limited adhesion.' },
        { material: 'PC', bondQuality: 'Mechanical Bond', notes: 'Some compatibility at interface.' },
      ],
    },
    postProcessing: {
      chemicalSmoothing: [
        { method: 'Most Solvents', effectiveness: 'Not Possible', notes: 'PEI is chemically resistant. Dichloromethane has limited effect.' },
        { method: 'NMP', effectiveness: 'Difficult', notes: 'N-Methyl-2-pyrrolidone can attack PEI but is very hazardous.' },
      ],
      mechanical: ['Machines exceptionally well', 'Can be polished', 'Taps and threads easily', 'Sands with care'],
      glues: ['Epoxy with surface prep', 'Mechanical fasteners often preferred', 'Ultrasonic welding'],
      painting: 'Primer required. Surface prep (sanding/plasma) improves adhesion.',
    },
    safety: {
      fumes: { level: 'Low', notes: 'Despite high temps, PEI has low emissions. Still requires ventilation for any high-temp printing.' },
      foodSafety: { rating: 'FDA Approved (Ultem 1010)', notes: 'Ultem 1010 is FDA food contact approved. Can be repeatedly sterilized.' },
      biodegradability: { rating: 'Not Biodegradable', notes: 'Extremely stable polymer. Does not degrade.' },
      additionalNotes: [
        'Biocompatible grades exist for medical implants',
        'Can be autoclaved and gamma sterilized',
        'Low smoke and toxicity when burned (FST certified)',
        'Inherently flame retardant - no additives needed',
      ],
    },
  },

  'PA-CF': {
    name: 'PA-CF',
    fullName: 'Carbon Fiber Reinforced Polyamide (Nylon-CF)',
    origin: {
      yearInvented: '2010s (for 3D printing)',
      originalCompany: 'Multiple - Markforged popularized it in 3D printing',
      keyMilestones: [
        '1930s: Nylon invented by DuPont',
        '2014: Markforged launches carbon fiber reinforced nylon printers',
        '2017+: PA-CF becomes available for FDM printers',
        '2020+: Bambu Lab, Prusa make PA-CF more accessible',
      ],
      majorManufacturers: ['Markforged', 'Polymaker', '3DXTech', 'Bambu Lab', 'Prusament'],
    },
    composition: {
      basePolymer: 'Polyamide (PA6, PA12, or PA66)',
      chemicalFamily: 'Reinforced Polyamide Composite',
      keyAdditives: ['Chopped carbon fiber (10-20%)', 'Compatibilizers', 'Antioxidants'],
      coloringAgents: 'Black from carbon fiber - cannot be colored',
      specialFillers: ['Carbon fiber (chopped, typically 15-20%)'],
    },
    familyContext: {
      parentPolymer: 'Polyamide (Nylon) reinforced with carbon fiber',
      variants: ['PA6-CF', 'PA12-CF', 'PA66-CF'],
      chemicalComparison: 'Much stiffer than unreinforced nylon, approaching aluminum in stiffness-to-weight ratio.',
      evolution: 'Enabled by advancement in carbon fiber processing and hardened nozzle availability.',
    },
    strengths: {
      uniqueProperties: ['Very high stiffness', 'Excellent strength-to-weight', 'Dimensional stability', 'Wear resistant'],
      bestUseScenarios: ['Jigs and fixtures', 'End-use production parts', 'Drone frames', 'Tooling'],
      advantagesOverCompetitors: ['Metal replacement potential', 'Lighter than aluminum at similar stiffness', 'Easier than machining'],
      whyChooseThis: 'When you need metal-like stiffness in a 3D printed part - the closest to metal replacement.',
    },
    weaknesses: {
      limitations: ['Requires hardened nozzle', 'Extremely hygroscopic', 'Brittle in some orientations', 'Anisotropic'],
      commonProblems: ['Moisture ruins prints', 'Nozzle wear without hardened steel', 'Layer adhesion concerns', 'Dry storage essential'],
      environmentalConcerns: ['Carbon fiber not recyclable', 'Energy-intensive production', 'Microfiber concerns'],
      whenNotToUse: ['Flexible parts needed', 'Without hardened nozzle', 'Humid environments', 'When isotropic properties required'],
    },
    practicalContext: {
      industryAdoption: ['Aerospace', 'Automotive', 'Industrial tooling', 'Robotics', 'Drones'],
      commonApplications: ['End-effectors', 'Drone arms', 'Assembly fixtures', 'Brackets', 'Robot grippers'],
      safetyStandards: ['Various aerospace and automotive certifications available'],
      costPosition: 'Premium',
    },
    trivia: {
      funFacts: [
        'PA-CF parts can replace aluminum in many applications at 1/3 the weight',
        'Markforged built a $1B+ company largely on this material',
        'The carbon fibers align with print direction, creating anisotropic properties',
        'A dry spool of PA-CF can absorb enough moisture in 24 hours to become unprintable',
      ],
      whyInvented: 'Developed to create 3D printed parts that could compete with machined metal components.',
      controversies: [
        'Strength claims often don\'t account for anisotropic properties',
        'Moisture sensitivity is frequently underestimated by new users',
        'Environmental impact of carbon fiber production and disposal',
      ],
      marketAdoption: 'Growing rapidly as hardened nozzles become standard and more printers support it.',
    },
    tdsProfile: {
      properties: [
        { name: 'Tensile Strength', value: '80-140', unit: 'MPa', implications: 'Very High. Approaches aluminum in specific strength.' },
        { name: 'Elongation at Break', value: '2-5', unit: '%', implications: 'Low. Stiff and will snap rather than bend. Highly anisotropic.' },
        { name: "Young's Modulus", value: '6000-12000', unit: 'MPa', implications: 'Very High. Much stiffer than unreinforced nylon. Direction-dependent.' },
        { name: 'Flexural Strength', value: '130-200', unit: 'MPa', implications: 'Excellent. Resists bending loads very well along fiber direction.' },
        { name: 'Heat Deflection (HDT)', value: '150-180', unit: '°C (0.45 MPa)', implications: 'Excellent heat resistance from the PA matrix plus carbon reinforcement.' },
        { name: 'Density', value: '1.15-1.25', unit: 'g/cm³', implications: 'Lightweight. About 40% the density of aluminum.' },
      ],
      notes: 'Properties are highly anisotropic - XY direction much stronger than Z. Values shown are for XY orientation.',
    },
    printSettings: {
      nozzleTemp: { min: 260, max: 290, optimal: 275 },
      bedTemp: { min: 80, max: 110, optimal: 95 },
      coolingFan: { min: 0, max: 50, notes: 'Minimal cooling helps layer adhesion. Some cooling on overhangs.' },
      enclosure: { required: true, notes: 'Required to prevent warping and moisture absorption during print.' },
      drying: { temp: 80, duration: '8-12 hours', notes: 'CRITICAL. PA-CF is extremely hygroscopic. Must print from dry box. Re-dry if exposed for 30+ minutes.' },
      printSpeed: { recommended: '30-60 mm/s', notes: 'Moderate speeds. Too fast causes poor layer adhesion.' },
      additionalNotes: [
        'HARDENED NOZZLE MANDATORY - steel, ruby, or hardened alloy',
        'Brass nozzle will be destroyed in minutes',
        'Print from active dry box - not optional',
        'Enclosure helps maintain consistent conditions',
        'Consider part orientation carefully due to anisotropy',
        'Z-strength is a fraction of XY-strength',
      ],
    },
    adhesion: {
      bedSurfaces: {
        excellent: ['Garolite (G10/FR4)', 'PEI (Textured) with adhesive'],
        good: ['Glass with PA-specific glue', 'BuildTak'],
        poor: ['Bare glass', 'Smooth PEI without adhesive'],
      },
      releaseAgents: 'Usually need adhesive rather than release. PA-specific glues or Magigoo PA work well.',
      multiMaterial: [
        { material: 'TPU', bondQuality: 'Mechanical Bond', notes: 'Can print TPU on PA-CF for soft-touch areas.' },
        { material: 'PVA', bondQuality: 'No Bond', notes: 'PVA doesn\'t work well with high-temp PA-CF.' },
        { material: 'Standard PA', bondQuality: 'Strong Chemical Bond', notes: 'Unreinforced nylon bonds well for support.' },
      ],
    },
    postProcessing: {
      chemicalSmoothing: [
        { method: 'Chemical', effectiveness: 'Not Possible', notes: 'Carbon fiber prevents effective chemical smoothing.' },
      ],
      mechanical: ['Sands with difficulty (fiber exposure)', 'Machines well with carbide tools', 'Can be drilled and tapped', 'Avoid excessive heat during machining'],
      glues: ['Epoxy', 'Cyanoacrylate with primer', 'Mechanical fasteners', 'Thread inserts work well'],
      painting: 'Sanding exposes fibers. Prime before painting. Epoxy coatings work well.',
    },
    safety: {
      fumes: { level: 'Moderate', notes: 'Nylon fumes plus potential carbon fiber particulates. Good ventilation and filtration recommended.' },
      foodSafety: { rating: 'Not Recommended', notes: 'Carbon fibers could potentially shed. Not suitable for food contact.' },
      biodegradability: { rating: 'Not Biodegradable', notes: 'Carbon fiber composite. Cannot be recycled in standard facilities.' },
      additionalNotes: [
        'Wear gloves when handling - fibers can cause skin irritation',
        'Use filtration to capture carbon fiber particulates',
        'Sanding creates hazardous dust - use respiratory protection',
        'Dispose of as composite waste, not regular plastic recycling',
      ],
    },
  },

  'PLA+': {
    name: 'PLA+',
    fullName: 'Enhanced Polylactic Acid',
    origin: {
      yearInvented: '2015-2017 (3D printing specific)',
      originalCompany: 'Multiple manufacturers - eSUN popularized the naming',
      keyMilestones: [
        '2015: "PLA+" terminology emerges',
        '2017: Becomes standard offering from most filament brands',
        '2020+: PLA+ 2.0 and further enhanced versions appear',
      ],
      majorManufacturers: ['eSUN', 'Polymaker (PolyLite/PolyTerra)', 'Hatchbox', 'Overture', 'Prusament'],
    },
    composition: {
      basePolymer: 'Modified Polylactic Acid with impact modifiers',
      chemicalFamily: 'Modified Aliphatic Polyester',
      keyAdditives: ['Impact modifiers', 'Toughening agents', 'Chain extenders', 'Processing aids'],
      coloringAgents: 'Same as standard PLA - wide color range',
      specialFillers: ['Generally unfilled - focus is on toughening'],
    },
    familyContext: {
      parentPolymer: 'Standard PLA with proprietary modifications',
      variants: ['PLA+', 'PLA+ 2.0', 'Pro PLA', 'Tough PLA', 'Impact PLA'],
      chemicalComparison: 'Less brittle than standard PLA, slightly better heat resistance, similar printability.',
      evolution: 'Response to complaints about standard PLA brittleness while maintaining ease of printing.',
    },
    strengths: {
      uniqueProperties: ['Reduced brittleness vs PLA', 'Better layer adhesion', 'Improved toughness', 'Same ease of printing'],
      bestUseScenarios: ['Functional prototypes', 'Parts that may see some stress', 'When PLA brittleness is a concern'],
      advantagesOverCompetitors: ['Familiar PLA experience', 'More forgiving than standard PLA', 'Wide availability'],
      whyChooseThis: 'When you want PLA\'s ease of use but need slightly better mechanical properties.',
    },
    weaknesses: {
      limitations: ['Still low heat resistance (~60°C)', 'Not standardized - varies by brand', 'Not truly "engineering grade"'],
      commonProblems: ['Inconsistent between brands', 'Still not suitable for high-stress applications', 'Marketing sometimes oversells improvements'],
      environmentalConcerns: ['Additives may reduce biodegradability', 'Less "eco-friendly" than marketed'],
      whenNotToUse: ['High temperature applications', 'True engineering requirements', 'When PETG would be better'],
    },
    practicalContext: {
      industryAdoption: ['Hobbyist', 'Prototyping', 'Education', 'Consumer products'],
      commonApplications: ['Improved prototypes', 'Functional models', 'Parts seeing light mechanical stress'],
      safetyStandards: ['Varies by brand - some maintain food safety certifications'],
      costPosition: 'Budget',
    },
    trivia: {
      funFacts: [
        'There is no industry standard for what makes PLA "plus"',
        'Different brands use completely different modification approaches',
        'Some PLA+ is just better-quality PLA, not chemically modified',
      ],
      whyInvented: 'Created to address the most common complaint about PLA - its brittleness and tendency to snap.',
      controversies: [
        'No standardization means "PLA+" is essentially a marketing term',
        'Some brands sell standard PLA as PLA+ with minimal differences',
        'Claims often exaggerate improvements over standard PLA',
      ],
      marketAdoption: 'Extremely popular - has largely replaced standard PLA as the default beginner material.',
    },
    tdsProfile: {
      properties: [
        { name: 'Tensile Strength', value: '50-60', unit: 'MPa', implications: 'Similar to PLA. Main improvement is in toughness, not strength.' },
        { name: 'Elongation at Break', value: '8-15', unit: '%', implications: 'Improved vs PLA (4-6%). Less brittle but still not flexible.' },
        { name: "Young's Modulus", value: '2000-2800', unit: 'MPa', implications: 'Slightly lower stiffness than PLA for improved toughness.' },
        { name: 'Impact Strength', value: '40-80', unit: 'kJ/m² (Notched)', implications: 'Improved. The main benefit - less likely to shatter on impact.' },
        { name: 'Glass Transition (Tg)', value: '55-65', unit: '°C', implications: 'Similar to PLA. Some brands claim slight improvement.' },
        { name: 'Heat Deflection (HDT)', value: '55-65', unit: '°C (0.45 MPa)', implications: 'Marginal improvement over standard PLA at best.' },
      ],
      notes: 'Properties vary significantly between brands. Test your specific brand for critical applications.',
    },
    printSettings: {
      nozzleTemp: { min: 200, max: 230, optimal: 215 },
      bedTemp: { min: 45, max: 65, optimal: 55 },
      coolingFan: { min: 80, max: 100, notes: 'Similar to PLA - high cooling for best detail and bridging.' },
      enclosure: { required: false, notes: 'Not required. Open air is fine - same as PLA.' },
      drying: { temp: 45, duration: '4-6 hours', notes: 'Hygroscopic like PLA. Dry if stringing occurs.' },
      printSpeed: { recommended: '40-100 mm/s', notes: 'Prints as fast as regular PLA. Some high-speed variants available.' },
      additionalNotes: [
        'Print settings nearly identical to PLA',
        'Slightly higher temps may improve layer adhesion',
        'Same bed surfaces and techniques as PLA work fine',
        'More forgiving than standard PLA in many cases',
      ],
    },
    adhesion: {
      bedSurfaces: {
        excellent: ['PEI (Smooth)', 'PEI (Textured)', 'Glass', 'Blue Tape'],
        good: ['BuildTak', 'Garolite'],
        poor: ['Bare aluminum'],
      },
      releaseAgents: 'Same as PLA - generally not needed on textured PEI. Glue stick on smooth surfaces.',
      multiMaterial: [
        { material: 'TPU', bondQuality: 'Strong Chemical Bond', notes: 'Same as PLA - good for soft-touch areas.' },
        { material: 'PETG', bondQuality: 'No Bond', notes: 'Same incompatibility as standard PLA.' },
        { material: 'PVA', bondQuality: 'Strong Chemical Bond', notes: 'Works as water-soluble support.' },
      ],
    },
    postProcessing: {
      chemicalSmoothing: [
        { method: 'Acetone', effectiveness: 'Not Possible', notes: 'No effect, same as standard PLA.' },
        { method: 'THF', effectiveness: 'Good', notes: 'Works but toxic. Same as PLA.' },
      ],
      mechanical: ['Sands easily', 'Paints well', 'Can be primed and finished', 'Similar to PLA'],
      glues: ['Cyanoacrylate (Super Glue)', 'Epoxy', 'PLA welding'],
      painting: 'Same as PLA - accepts acrylic and enamel paints well. Prime for best results.',
    },
    safety: {
      fumes: { level: 'Low', notes: 'Same as PLA - low emissions, generally safe for home use.' },
      foodSafety: { rating: 'Varies by Brand', notes: 'Some maintain food safety certification, others don\'t disclose additives. Check with manufacturer.' },
      biodegradability: { rating: 'Reduced vs PLA', notes: 'Additives may reduce biodegradability. Not guaranteed to meet PLA\'s industrial composting standards.' },
      additionalNotes: [
        'Generally as safe as standard PLA to print',
        'Additive disclosure varies by brand',
        'When in doubt, assume not food-safe',
      ],
    },
  },

  'PEKK': {
    name: 'PEKK',
    fullName: 'Polyetherketoneketone',
    origin: {
      yearInvented: '1988',
      originalCompany: 'DuPont (originally), now Arkema (Kepstan)',
      keyMilestones: [
        '1988: PEKK synthesized',
        '2000s: Aerospace adoption begins',
        '2016: Arkema launches Kepstan PEKK for 3D printing',
        '2020+: Becomes alternative to PEEK in 3D printing',
      ],
      majorManufacturers: ['Arkema (Kepstan)', 'Solvay', '3DXTech', 'Stratasys'],
    },
    composition: {
      basePolymer: 'Polyetherketoneketone',
      chemicalFamily: 'Polyaryletherketone (PAEK)',
      keyAdditives: ['Carbon fiber (PEKK-CF)', 'Glass fiber', 'ESD additives'],
      coloringAgents: 'Natural amber/brown color, limited coloring options',
      specialFillers: ['Carbon fiber', 'Glass fiber'],
    },
    familyContext: {
      parentPolymer: 'Part of PAEK family alongside PEEK',
      variants: ['PEKK-A (amorphous)', 'PEKK-C (crystalline)', 'PEKK-CF'],
      chemicalComparison: 'Lower melting point than PEEK, easier to print, similar performance for most applications.',
      evolution: 'Developed as more processable alternative to PEEK with similar properties.',
    },
    strengths: {
      uniqueProperties: ['Easier to print than PEEK', 'Excellent mechanical properties', 'Good chemical resistance', '260°C+ service temp'],
      bestUseScenarios: ['Aerospace components', 'Medical devices', 'Oil & gas', 'High-temp industrial'],
      advantagesOverCompetitors: ['30°C lower processing temp than PEEK', 'Similar properties to PEEK', 'Better layer adhesion'],
      whyChooseThis: 'When you need PEEK-like properties but want easier processing and better 3D printing results.',
    },
    weaknesses: {
      limitations: ['Still requires high-temp equipment', 'Very expensive ($400+/kg)', 'Limited availability', 'Specialty equipment needed'],
      commonProblems: ['Crystallization control important', 'Requires heated chamber', 'Few printers capable'],
      environmentalConcerns: ['Energy-intensive production', 'Not recyclable in most facilities'],
      whenNotToUse: ['Consumer applications', 'Budget projects', 'When PC or PEI would suffice'],
    },
    practicalContext: {
      industryAdoption: ['Aerospace', 'Medical implants', 'Oil & gas', 'Semiconductor'],
      commonApplications: ['Aircraft brackets', 'Surgical instruments', 'Downhole tools', 'High-temp fixtures'],
      safetyStandards: ['Various aerospace certifications', 'Biocompatible grades available'],
      costPosition: 'Industrial',
    },
    trivia: {
      funFacts: [
        'PEKK-A (amorphous) and PEKK-C (crystalline) have very different properties',
        'Arkema specifically developed Kepstan for 3D printing applications',
        'The extra ketone group (vs PEEK) lowers the melting point significantly',
      ],
      whyInvented: 'Created as a more processable member of the PAEK family while maintaining high performance.',
      controversies: [
        'Sometimes oversold as "just as good as PEEK" when there are differences',
        'Material cost can exceed $500/kg for certified grades',
      ],
      marketAdoption: 'Growing in aerospace as an easier-to-print PEEK alternative, still very specialized.',
    },
    tdsProfile: {
      properties: [
        { name: 'Tensile Strength', value: '95-115', unit: 'MPa', implications: 'Very High. Comparable to PEEK in many applications.' },
        { name: 'Elongation at Break', value: '15-30', unit: '%', implications: 'Good ductility. Better than many high-performance polymers.' },
        { name: "Young's Modulus", value: '3500-4200', unit: 'MPa', implications: 'High stiffness. Rigid and dimensionally stable.' },
        { name: 'Impact Strength', value: '45-65', unit: 'kJ/m² (Notched)', implications: 'Good. Tough despite high stiffness.' },
        { name: 'Glass Transition (Tg)', value: '160-165', unit: '°C', implications: 'High. Excellent for high-temperature applications.' },
        { name: 'Continuous Use Temp', value: '260', unit: '°C', implications: 'Outstanding. Suitable for extreme environment applications.' },
        { name: 'Melting Point', value: '305-360', unit: '°C', implications: '~30°C lower than PEEK, making it easier to process.' },
      ],
      notes: 'PEKK-A (amorphous) has lower strength but better printability. PEKK-C (crystalline) has higher performance but requires annealing.',
    },
    printSettings: {
      nozzleTemp: { min: 340, max: 380, optimal: 360 },
      bedTemp: { min: 120, max: 160, optimal: 145 },
      coolingFan: { min: 0, max: 0, notes: 'NO cooling. Controlled cooling is critical for crystallization.' },
      enclosure: { required: true, notes: 'MANDATORY. Heated chamber 80-120°C required. Lower than PEEK.' },
      drying: { temp: 120, duration: '4-8 hours', notes: 'Must be thoroughly dried before printing.' },
      printSpeed: { recommended: '15-35 mm/s', notes: 'Slow speeds for proper layer adhesion and crystallization control.' },
      additionalNotes: [
        'All-metal hotend rated for 400°C required',
        'Easier than PEEK - lower chamber temps needed',
        'PEKK-A is easier to print, PEKK-C has better properties',
        'Annealing may be required for crystalline grades',
        'Still requires specialized high-temp printers',
      ],
    },
    adhesion: {
      bedSurfaces: {
        excellent: ['PEI (high-temp grade)', 'PEKK/PEEK sheet', 'Garolite at high temp'],
        good: ['Glass with high-temp adhesive'],
        poor: ['Standard surfaces - cannot withstand temps'],
      },
      releaseAgents: 'Usually not needed. Parts release on cooling. High-temp surfaces required.',
      multiMaterial: [
        { material: 'PEEK', bondQuality: 'Strong Chemical Bond', notes: 'Same PAEK family. Excellent compatibility.' },
        { material: 'Carbon Fiber', bondQuality: 'Strong Chemical Bond', notes: 'PEKK-CF is common high-performance composite.' },
      ],
    },
    postProcessing: {
      chemicalSmoothing: [
        { method: 'Chemical', effectiveness: 'Not Possible', notes: 'PEKK is chemically resistant like PEEK.' },
      ],
      mechanical: ['Machines well', 'Can be polished', 'CNC machining common', 'Accepts threads'],
      glues: ['Specialty PAEK adhesives', 'Mechanical fastening preferred', 'Epoxy with surface prep'],
      painting: 'Surface prep required due to chemical inertness. Primer needed.',
    },
    safety: {
      fumes: { level: 'Low', notes: 'Low emissions despite high temps. Ventilation still required for high-temp printing.' },
      foodSafety: { rating: 'Grades Available', notes: 'FDA compliant grades exist. Check specific grade certifications.' },
      biodegradability: { rating: 'Not Biodegradable', notes: 'Extremely stable polymer. Does not degrade.' },
      additionalNotes: [
        'Biocompatible grades available for medical use',
        'Can be sterilized by multiple methods',
        'Lower processing temps than PEEK improves safety margin',
      ],
    },
  },

  'PVB': {
    name: 'PVB',
    fullName: 'Polyvinyl Butyral',
    origin: {
      yearInvented: '1927',
      originalCompany: 'Developed for safety glass interlayers',
      keyMilestones: [
        '1927: PVB synthesized',
        '1938: First automotive safety glass with PVB interlayer',
        '2017+: PVB filaments introduced for 3D printing',
      ],
      majorManufacturers: ['Eastman (Saflex)', 'Kuraray (Trosifol)', 'Polymaker (PolySmooth)'],
    },
    composition: {
      basePolymer: 'Polyvinyl Butyral',
      chemicalFamily: 'Polyvinyl Acetal',
      keyAdditives: ['Plasticizers for flexibility', 'Adhesion promoters'],
      coloringAgents: 'Naturally transparent, can be tinted',
      specialFillers: ['Generally unfilled'],
    },
    familyContext: {
      parentPolymer: 'Derived from polyvinyl alcohol (PVA) - reacted with butyraldehyde',
      variants: ['Standard PVB', 'PolySmooth (Polymaker)'],
      chemicalComparison: 'Related to PVA but NOT water-soluble. Dissolves in isopropyl alcohol for smoothing.',
      evolution: 'From safety glass interlayers to 3D printing material with unique smoothing capability.',
    },
    strengths: {
      uniqueProperties: ['Smoothable with isopropyl alcohol', 'Good optical clarity', 'Excellent layer adhesion', 'Low odor when printing'],
      bestUseScenarios: ['Parts requiring smooth finish', 'Transparent items', 'Display models', 'Vapor smoothing applications'],
      advantagesOverCompetitors: ['IPA smoothing is safer than acetone (ABS)', 'Better clarity than PETG', 'Easy to print like PLA'],
      whyChooseThis: 'When you need a perfectly smooth surface finish without the hassle or danger of acetone vapor smoothing.',
    },
    weaknesses: {
      limitations: ['Lower strength than PLA', 'More expensive than PLA', 'Limited availability', 'IPA smoothing takes time'],
      commonProblems: ['Softer than expected', 'Smoothing requires practice', 'Limited mechanical applications'],
      environmentalConcerns: ['Petroleum-based', 'IPA smoothing creates solvent waste'],
      whenNotToUse: ['Structural applications', 'When raw print finish is acceptable', 'Budget projects'],
    },
    practicalContext: {
      industryAdoption: ['Safety glass (primary use)', 'Automotive', 'Architecture', 'Art/Display'],
      commonApplications: ['Windshield interlayers', 'Display models', 'Architectural models', 'Smooth prototypes'],
      safetyStandards: ['Safety glass certifications (traditional use)'],
      costPosition: 'Premium',
    },
    trivia: {
      funFacts: [
        'Every car windshield has a PVB interlayer holding the glass together',
        'Polymaker\'s PolySmooth + Polysher made PVB popular in 3D printing',
        'IPA smoothing is much safer than acetone smoothing for ABS',
        'PVB gives that crystal-clear look that\'s hard to achieve with other materials',
      ],
      whyInvented: 'Originally developed to create safety glass that doesn\'t shatter dangerously.',
      controversies: [
        'Sometimes confused with PVA (water-soluble) despite completely different properties',
        'Smoothing results require practice and proper equipment',
      ],
      marketAdoption: 'Niche market - primarily for users specifically wanting smoothable prints.',
    },
    tdsProfile: {
      properties: [
        { name: 'Tensile Strength', value: '35-45', unit: 'MPa', implications: 'Moderate. Lower than PLA. Not for structural use.' },
        { name: 'Elongation at Break', value: '20-50', unit: '%', implications: 'Moderate flexibility. More forgiving than PLA.' },
        { name: "Young's Modulus", value: '1800-2200', unit: 'MPa', implications: 'Moderate stiffness. Slightly softer than PLA.' },
        { name: 'Impact Strength', value: '40-60', unit: 'kJ/m²', implications: 'Decent. Better than PLA due to slight flexibility.' },
        { name: 'Glass Transition (Tg)', value: '60-70', unit: '°C', implications: 'Similar to PLA. Not heat resistant.' },
        { name: 'Optical Clarity', value: '>90', unit: '% transmission', implications: 'Excellent transparency. Main selling point.' },
      ],
      notes: 'Mechanical properties are secondary - PVB is chosen for its smoothing capability and optical clarity.',
    },
    printSettings: {
      nozzleTemp: { min: 190, max: 220, optimal: 205 },
      bedTemp: { min: 45, max: 65, optimal: 55 },
      coolingFan: { min: 50, max: 100, notes: 'Similar cooling to PLA. Moderate to high cooling.' },
      enclosure: { required: false, notes: 'Not required. Open air printing works fine.' },
      drying: { temp: 45, duration: '4-6 hours', notes: 'Hygroscopic. Dry if stringing or bubbles occur.' },
      printSpeed: { recommended: '30-60 mm/s', notes: 'Slightly slower than PLA for best clarity.' },
      additionalNotes: [
        'Prints like PLA - very easy',
        'Lower layer heights improve clarity',
        'Post-print IPA smoothing is where the magic happens',
        'Polysher or DIY vapor chamber for smoothing',
      ],
    },
    adhesion: {
      bedSurfaces: {
        excellent: ['PEI (Smooth)', 'PEI (Textured)', 'Glass with glue'],
        good: ['Blue tape', 'BuildTak'],
        poor: ['Bare glass without adhesive'],
      },
      releaseAgents: 'Similar to PLA - usually not needed. Glue stick if adhesion issues.',
      multiMaterial: [
        { material: 'PLA', bondQuality: 'Weak Bond', notes: 'Some adhesion but not strong.' },
        { material: 'PVA', bondQuality: 'Weak Bond', notes: 'Related chemistries but different properties.' },
      ],
    },
    postProcessing: {
      chemicalSmoothing: [
        { method: 'Isopropyl Alcohol (IPA)', effectiveness: 'Excellent', notes: 'The primary feature! IPA vapor smooths PVB to glass-like finish.' },
        { method: 'Ethanol', effectiveness: 'Good', notes: 'Also works for smoothing.' },
      ],
      mechanical: ['Sands easily', 'Polishes to high clarity', 'Can be buffed', 'Paints after smoothing'],
      glues: ['Cyanoacrylate', 'Epoxy', 'Plastic cement'],
      painting: 'Smooth before painting for best results. IPA-smoothed surfaces accept paint well.',
    },
    safety: {
      fumes: { level: 'Low', notes: 'Low emissions during printing. IPA smoothing requires ventilation.' },
      foodSafety: { rating: 'Not Recommended', notes: 'While PVB in windshields is inert, 3D printing PVB may have additives. Not food safe.' },
      biodegradability: { rating: 'Not Biodegradable', notes: 'Petroleum-based polymer. Does not biodegrade.' },
      additionalNotes: [
        'IPA is flammable - proper ventilation and no ignition sources during smoothing',
        'Polysher device contains IPA mist - keep away from flames',
        'Much safer than acetone smoothing for ABS',
      ],
    },
  },

  'TPE': {
    name: 'TPE',
    fullName: 'Thermoplastic Elastomer',
    origin: {
      yearInvented: '1950s-1960s (various types)',
      originalCompany: 'Multiple - Shell developed Kraton (SBS block copolymers)',
      keyMilestones: [
        '1950s: First TPEs developed',
        '1965: Shell commercializes Kraton SBS',
        '1970s-80s: TPE families expand',
        '2015+: TPE filaments become available (distinct from TPU)',
      ],
      majorManufacturers: ['Kraton', 'PolyOne', 'NinjaTek (NinjaFlex)', 'SainSmart'],
    },
    composition: {
      basePolymer: 'Various - SEBS, SBS, TPO, TPV, etc.',
      chemicalFamily: 'Elastomeric Block Copolymers',
      keyAdditives: ['Oil extenders', 'Fillers', 'Stabilizers'],
      coloringAgents: 'Easily colored, available in many colors',
      specialFillers: ['Generally unfilled for maximum flexibility'],
    },
    familyContext: {
      parentPolymer: 'Family term covering multiple chemistries (SEBS, SBS, TPO, etc.)',
      variants: ['SEBS (styrenic)', 'SBS', 'TPO (polyolefin)', 'TPV (vulcanized)'],
      chemicalComparison: 'Generally softer and more flexible than TPU, but lower abrasion resistance.',
      evolution: 'From industrial rubber replacement to 3D printing material for ultra-soft applications.',
    },
    strengths: {
      uniqueProperties: ['Very soft (can be Shore 20A or softer)', 'Rubber-like feel', 'Good resilience', 'Variety of hardnesses'],
      bestUseScenarios: ['Soft-touch grips', 'Gaskets', 'Ultra-flexible parts', 'Overmolding'],
      advantagesOverCompetitors: ['Softer than TPU options', 'Rubber-like tactile feel', 'Good elasticity'],
      whyChooseThis: 'When you need softer, more rubber-like properties than TPU provides.',
    },
    weaknesses: {
      limitations: ['Very difficult to print', 'Low tensile strength', 'Limited suppliers', 'Requires direct drive'],
      commonProblems: ['Extreme stringing', 'Buckling in extruder', 'Very slow print speeds', 'Difficult bed adhesion'],
      environmentalConcerns: ['Petroleum-based', 'Not biodegradable', 'Recycling challenges'],
      whenNotToUse: ['When TPU\'s properties suffice', 'Bowden extruder printers', 'High-strength requirements'],
    },
    practicalContext: {
      industryAdoption: ['Automotive', 'Consumer products', 'Medical', 'Industrial'],
      commonApplications: ['Tool grips', 'Seals', 'Soft-touch surfaces', 'Flexible connectors'],
      safetyStandards: ['Medical grades available (specific formulations)', 'Skin-contact grades exist'],
      costPosition: 'Premium',
    },
    trivia: {
      funFacts: [
        'TPE is the family - TPU is a specific type (urethane-based)',
        'The soft-touch coating on many products is TPE overmold',
        'Some TPEs can stretch 5-10x their length and fully recover',
      ],
      whyInvented: 'Created as processable rubber alternatives that could be injection molded like plastics.',
      controversies: [
        'Often confused with TPU - they\'re related but different materials',
        'Printing difficulty is severely underestimated by most users',
      ],
      marketAdoption: 'Very limited in 3D printing - TPU dominates the flexible material space.',
    },
    tdsProfile: {
      properties: [
        { name: 'Shore Hardness', value: '20A-90A', unit: '', implications: 'Wide range. Softest TPEs are like rubber bands; firmer ones like pencil erasers.' },
        { name: 'Tensile Strength', value: '5-25', unit: 'MPa', implications: 'Low-Moderate. Varies greatly with hardness. Softer = weaker.' },
        { name: 'Elongation at Break', value: '300-800', unit: '%', implications: 'Very High. Stretches significantly before breaking.' },
        { name: 'Compression Set', value: '20-40', unit: '%', implications: 'Moderate. Returns to shape but some permanent deformation possible.' },
        { name: 'Temperature Range', value: '-40 to +80', unit: '°C', implications: 'Remains flexible across wide temp range. Softer at high temps.' },
        { name: 'Abrasion Resistance', value: 'Low-Moderate', unit: '', implications: 'Generally lower than TPU. Wears faster in friction applications.' },
      ],
      notes: 'Properties vary enormously between TPE types (SEBS, SBS, TPO, TPV). Always check specific grade.',
    },
    printSettings: {
      nozzleTemp: { min: 200, max: 240, optimal: 220 },
      bedTemp: { min: 40, max: 70, optimal: 55 },
      coolingFan: { min: 50, max: 100, notes: 'Moderate cooling helps with stringing. Too much can cause adhesion issues.' },
      enclosure: { required: false, notes: 'Not required but can help with very soft grades.' },
      drying: { temp: 50, duration: '4-6 hours', notes: 'Some TPEs are hygroscopic. Dry if issues occur.' },
      printSpeed: { recommended: '10-25 mm/s', notes: 'VERY SLOW. Fastest way to fail is printing too fast. Direct drive strongly recommended.' },
      additionalNotes: [
        'DIRECT DRIVE EXTRUDER ESSENTIAL - Bowden tubes cannot handle soft TPE',
        'Disable retraction or use minimal retraction (0.5-1mm)',
        'Print even slower for very soft (<60A) grades',
        'Constrained filament path crucial - no gaps for filament to escape',
        'Test prints highly recommended before committing to projects',
      ],
    },
    adhesion: {
      bedSurfaces: {
        excellent: ['Glass with glue stick', 'Blue tape'],
        good: ['PEI (Textured)', 'BuildTak'],
        poor: ['Smooth PEI (too much adhesion, damages bed)'],
      },
      releaseAgents: 'Glue stick acts as both adhesion promoter and release agent. Makes removal easier.',
      multiMaterial: [
        { material: 'PLA', bondQuality: 'Mechanical Bond', notes: 'Can print TPE on PLA for soft-touch areas.' },
        { material: 'PETG', bondQuality: 'Weak Bond', notes: 'Some adhesion possible.' },
        { material: 'PP', bondQuality: 'No Bond', notes: 'Both are low-surface-energy materials.' },
      ],
    },
    postProcessing: {
      chemicalSmoothing: [
        { method: 'Chemical', effectiveness: 'Difficult', notes: 'TPE is generally resistant to common solvents. Not recommended.' },
      ],
      mechanical: ['Very difficult to sand', 'Can be trimmed with scissors/knife', 'Heat welding possible', 'Talc powder reduces stickiness'],
      glues: ['Contact adhesive', 'Specialty TPE adhesives', 'Some cyanoacrylate formulations', 'Hot glue'],
      painting: 'Difficult - flexible surfaces crack rigid paints. Use flexible paints or dyes.',
    },
    safety: {
      fumes: { level: 'Low', notes: 'Most TPEs have low emissions. Always verify with specific grade MSDS.' },
      foodSafety: { rating: 'Some Grades', notes: 'Medical and food-grade TPEs exist. Must verify specific formulation.' },
      biodegradability: { rating: 'Not Biodegradable', notes: 'Petroleum-based elastomers. Do not biodegrade.' },
      additionalNotes: [
        'Generally skin-safe - used in baby products and medical devices (specific grades)',
        'Latex-free alternative for sensitive users',
        'Some people have sensitivities to certain TPE formulations',
      ],
    },
  },

  'Breakaway': {
    name: 'Breakaway',
    fullName: 'Breakaway Support Material',
    origin: {
      yearInvented: '2016-2017 (3D printing specific)',
      originalCompany: 'Multiple - Ultimaker and others developed breakaway formulations',
      keyMilestones: [
        '2016: Ultimaker introduces Breakaway material',
        '2017+: Other manufacturers create similar products',
        '2020+: Becomes standard dual-extrusion support option',
      ],
      majorManufacturers: ['Ultimaker', 'Prusa', 'eSUN', 'colorFabb'],
    },
    composition: {
      basePolymer: 'Modified polyester/copolyester blends (proprietary)',
      chemicalFamily: 'Engineered Copolymer Blend',
      keyAdditives: ['Release agents', 'Adhesion modifiers'],
      coloringAgents: 'Usually white or off-white',
      specialFillers: ['Generally unfilled'],
    },
    familyContext: {
      parentPolymer: 'Proprietary formulations designed for weak interface adhesion',
      variants: ['PLA-compatible breakaway', 'PETG-compatible breakaway', 'Universal breakaway'],
      chemicalComparison: 'Engineered for controlled, weak adhesion - opposite goal of structural materials.',
      evolution: 'Developed as alternative to soluble supports when dissolution isn\'t practical.',
    },
    strengths: {
      uniqueProperties: ['Easily removable by hand', 'No solvents required', 'Faster than dissolution', 'Wide material compatibility'],
      bestUseScenarios: ['Quick support removal', 'Large support volumes', 'When dissolution takes too long'],
      advantagesOverCompetitors: ['No waiting for dissolution', 'No solvent handling', 'Works with many materials'],
      whyChooseThis: 'When you need supports that just peel off without chemicals or long dissolution times.',
    },
    weaknesses: {
      limitations: ['May leave surface marks', 'Not for internal supports', 'Requires access to support', 'Surface quality varies'],
      commonProblems: ['Sometimes adheres too strongly', 'Sometimes falls off during printing', 'Tuning required'],
      environmentalConcerns: ['Creates plastic waste', 'Not recyclable'],
      whenNotToUse: ['Internal cavities', 'When perfect surface finish required', 'Complex geometries with no access'],
    },
    practicalContext: {
      industryAdoption: ['Prototyping', 'Production parts', 'Education'],
      commonApplications: ['Support structures for dual-extrusion prints', 'Quick prototype supports'],
      safetyStandards: ['Generally safe to handle'],
      costPosition: 'Premium',
    },
    trivia: {
      funFacts: [
        'The weak interface is carefully engineered - too weak and it falls off, too strong and it won\'t break away',
        'Temperature differential between model and support affects breakaway behavior',
        'Some breakaway supports can be reused by re-extruding (though not recommended)',
      ],
      whyInvented: 'Created to provide fast support removal without the complications of soluble supports.',
      controversies: [
        'Results highly dependent on printer calibration',
        'Premium pricing for what is essentially "designed to fail" plastic',
      ],
      marketAdoption: 'Common in professional/prosumer dual-extrusion setups.',
    },
    tdsProfile: {
      properties: [
        { name: 'Tensile Strength', value: '30-45', unit: 'MPa', implications: 'Moderate. Strong enough to support, weak enough to break away.' },
        { name: 'Elongation at Break', value: '5-15', unit: '%', implications: 'Low-Moderate. Designed to snap rather than stretch.' },
        { name: 'Interface Adhesion', value: 'Controlled', unit: '', implications: 'Engineered for 50-80% of normal layer adhesion to enable clean separation.' },
        { name: 'Print Temp Compatibility', value: '190-250', unit: '°C', implications: 'Wide range to match common model materials.' },
      ],
      notes: 'Mechanical properties are intentionally engineered for removability, not strength. Specs vary by brand and target material.',
    },
    printSettings: {
      nozzleTemp: { min: 200, max: 250, optimal: 225 },
      bedTemp: { min: 50, max: 85, optimal: 65 },
      coolingFan: { min: 50, max: 100, notes: 'Moderate to high cooling. Similar to model material settings.' },
      enclosure: { required: false, notes: 'Depends on model material requirements, not breakaway itself.' },
      drying: { temp: 50, duration: '4 hours', notes: 'Moderate sensitivity. Dry if experiencing adhesion issues.' },
      printSpeed: { recommended: '40-60 mm/s', notes: 'Match or slightly slower than model material.' },
      additionalNotes: [
        'Interface distance (Z gap) is CRITICAL - typically 0.1-0.2mm',
        'Interface layer speed should be slower than infill',
        'Temperature difference from model material affects breakaway ease',
        'Test small parts first to calibrate interface settings',
        'Purge tower required between material switches',
      ],
    },
    adhesion: {
      bedSurfaces: {
        excellent: ['Same as model material'],
        good: ['PEI', 'Glass', 'Blue tape'],
        poor: ['N/A - breakaway rarely touches bed directly'],
      },
      releaseAgents: 'N/A - breakaway is the release mechanism itself.',
      multiMaterial: [
        { material: 'PLA', bondQuality: 'Mechanical Bond', notes: 'Most common pairing. Weak controlled bond for easy removal.' },
        { material: 'PETG', bondQuality: 'Mechanical Bond', notes: 'Works with PETG-compatible breakaway formulations.' },
        { material: 'ABS', bondQuality: 'Mechanical Bond', notes: 'ABS-specific breakaway available (or use HIPS).' },
        { material: 'Nylon', bondQuality: 'Mechanical Bond', notes: 'Specialty breakaway materials for high-temp materials.' },
      ],
    },
    postProcessing: {
      chemicalSmoothing: [
        { method: 'N/A', effectiveness: 'Not Possible', notes: 'Breakaway is removed, not smoothed. It\'s waste material.' },
      ],
      mechanical: ['Peel by hand', 'Needle-nose pliers for tight spots', 'X-acto knife for cleanup', 'Light sanding of interface marks'],
      glues: ['Not applicable - material is meant to be discarded'],
      painting: 'Not applicable.',
    },
    safety: {
      fumes: { level: 'Low', notes: 'Similar to model material. Low emissions with normal ventilation.' },
      foodSafety: { rating: 'N/A', notes: 'Removed before use. Not present in final part.' },
      biodegradability: { rating: 'Not Biodegradable', notes: 'Creates plastic waste. Not recyclable in standard facilities.' },
      additionalNotes: [
        'Safe to handle - no special precautions needed',
        'Dispose of removed supports as plastic waste',
        'Some brands exploring compostable breakaway options',
      ],
    },
  },

  // ========== SPECIALTY MATERIALS ==========

  'Wood PLA': {
    name: 'Wood PLA',
    fullName: 'Wood Fiber Filled Polylactic Acid',
    origin: {
      yearInvented: '2012-2013 (3D printing)',
      originalCompany: 'Multiple early pioneers including colorFabb and LAYWOO-D3',
      keyMilestones: [
        '2012: LAYWOO-D3 introduces first wood filament',
        '2013: colorFabb WoodFill launches',
        '2015+: Wood PLA becomes mainstream specialty material',
        '2020+: Multiple wood species variants available',
      ],
      majorManufacturers: ['colorFabb', 'Hatchbox', 'Polymaker', 'eSUN', '3D-Fuel', 'FormFutura'],
    },
    composition: {
      basePolymer: 'PLA (Polylactic Acid)',
      chemicalFamily: 'Filled Thermoplastic Composite',
      keyAdditives: ['Wood fibers/particles (typically 20-40%)', 'Binding agents', 'Colorants for wood species simulation'],
      coloringAgents: 'Natural wood tones, some brands use wood flour from specific species',
      specialFillers: ['Pine', 'Bamboo', 'Cork', 'Cherry', 'Olive', 'Coconut', 'Walnut'],
    },
    familyContext: {
      parentPolymer: 'PLA base with wood fiber reinforcement',
      variants: ['Pine', 'Bamboo', 'Cork-fill', 'Cherry', 'Olive Wood', 'Coconut', 'Walnut', 'Cedar', 'Ebony'],
      chemicalComparison: 'Weaker than pure PLA due to fiber discontinuity, but provides unique aesthetic and texture.',
      evolution: 'From novelty material to established artistic/decorative filament category.',
    },
    strengths: {
      uniqueProperties: ['Natural wood appearance', 'Wood-like smell when printing', 'Can be stained/sanded like real wood', 'Temperature-variable color'],
      bestUseScenarios: ['Decorative items', 'Artistic projects', 'Furniture accents', 'Wood-look prototypes', 'Film props'],
      advantagesOverCompetitors: ['Most realistic wood simulation', 'Smells pleasant when printing', 'Easy post-processing', 'Lower environmental impact perception'],
      whyChooseThis: 'When you want the appearance and feel of wood without actual woodworking, or for unique artistic pieces.',
    },
    weaknesses: {
      limitations: ['Weaker than pure PLA', 'Not for structural parts', 'Prone to clogging', 'Abrasive to nozzles'],
      commonProblems: ['Nozzle clogging from wood fibers', 'Inconsistent extrusion', 'Stringing', 'Moisture absorption'],
      environmentalConcerns: ['Wood sourcing varies by brand', 'PLA base still requires industrial composting'],
      whenNotToUse: ['Structural applications', 'High-stress parts', 'Fine detail prints', 'Outdoor use (degradation)'],
    },
    practicalContext: {
      industryAdoption: ['Art and design', 'Architecture models', 'Film/theater props', 'Custom furniture accents'],
      commonApplications: ['Decorative bowls', 'Figurines', 'Wall art', 'Furniture prototypes', 'Gift items'],
      safetyStandards: ['Generally safe but wood dust when sanding requires precaution'],
      costPosition: 'Premium',
    },
    trivia: {
      funFacts: [
        'You can change the color by varying print temperature - higher temps = darker brown',
        'Some brands use recycled sawmill waste, making it somewhat eco-friendly',
        'The wood smell comes from volatile compounds in the wood fibers',
        'Parts can be finished with wood stain, varnish, or oil just like real wood',
      ],
      whyInvented: 'Created to bring the aesthetic and tactile qualities of wood to 3D printed objects.',
      controversies: [
        'Some "wood" filaments use very little actual wood content',
        'Nozzle wear claims vary - some say minimal, others report significant wear',
        'Food safety is questionable due to porous structure and unknown additives',
      ],
      marketAdoption: 'Established specialty niche - consistently popular for decorative applications.',
    },
    tdsProfile: {
      properties: [
        { name: 'Tensile Strength', value: '25-40', unit: 'MPa', implications: 'Lower than pure PLA. Wood fibers create weak points.' },
        { name: 'Elongation at Break', value: '2-5', unit: '%', implications: 'Very brittle. Handle with care.' },
        { name: 'Wood Content', value: '20-40', unit: '%', implications: 'Higher content = more realistic but harder to print.' },
        { name: 'Density', value: '1.15-1.25', unit: 'g/cm³', implications: 'Slightly lighter than pure PLA due to wood fibers.' },
        { name: 'Glass Transition (Tg)', value: '50-55', unit: '°C', implications: 'Lower than pure PLA. Less heat resistant.' },
      ],
      notes: 'Properties vary significantly based on wood content and fiber size. Use larger nozzles (0.5mm+) for reliability.',
    },
    printSettings: {
      nozzleTemp: { min: 175, max: 220, optimal: 195 },
      bedTemp: { min: 45, max: 65, optimal: 55 },
      coolingFan: { min: 50, max: 100, notes: 'Moderate to high cooling. Similar to PLA.' },
      enclosure: { required: false, notes: 'Not required. Open air printing works fine.' },
      drying: { temp: 45, duration: '4-6 hours', notes: 'More hygroscopic than pure PLA due to wood content.' },
      printSpeed: { recommended: '30-50 mm/s', notes: 'Slower than pure PLA to prevent clogging and ensure consistent extrusion.' },
      additionalNotes: [
        'Use 0.5mm+ nozzle to prevent clogging - wood fibers block smaller nozzles',
        'Retraction settings may need tuning to prevent clogs',
        'Temperature affects color - experiment for desired shade',
        'Clean nozzle regularly during long prints',
        'Consider hardened nozzle for extended use',
      ],
    },
    adhesion: {
      bedSurfaces: {
        excellent: ['PEI (Smooth)', 'Glass with glue', 'Blue tape'],
        good: ['PEI (Textured)', 'BuildTak'],
        poor: ['Bare glass', 'Bare aluminum'],
      },
      releaseAgents: 'Glue stick recommended on smooth surfaces.',
      multiMaterial: [
        { material: 'PLA', bondQuality: 'Strong Chemical Bond', notes: 'Same base polymer. Good adhesion.' },
        { material: 'PETG', bondQuality: 'Weak Bond', notes: 'Some adhesion but not structural.' },
      ],
    },
    postProcessing: {
      chemicalSmoothing: [
        { method: 'Acetone', effectiveness: 'Not Possible', notes: 'No effect on PLA base.' },
        { method: 'Wood Stain', effectiveness: 'Excellent', notes: 'Absorbs stain like real wood. Amazing results.' },
      ],
      mechanical: ['Sands beautifully like real wood', 'Can be carved or whittled', 'Accepts wood finishes', 'Can be burned/woodgrained'],
      glues: ['Wood glue works!', 'Cyanoacrylate', 'Epoxy', 'PLA welding'],
      painting: 'Can be stained, varnished, oiled, or painted. Staining gives most natural results.',
    },
    safety: {
      fumes: { level: 'Low', notes: 'Pleasant wood smell. Standard ventilation recommended.' },
      foodSafety: { rating: 'Not Recommended', notes: 'Porous structure harbors bacteria. Unknown additives. Not food safe.' },
      biodegradability: { rating: 'Partially Enhanced', notes: 'Wood content may improve degradation, but PLA base still requires industrial composting.' },
      additionalNotes: [
        'Wear mask when sanding - wood dust is irritating',
        'Pleasant smell during printing',
        'Natural material feel makes it popular for gifts',
      ],
    },
  },

  'PLA-Silk': {
    name: 'PLA-Silk',
    fullName: 'Silk-Finish Polylactic Acid',
    origin: {
      yearInvented: '2017-2018 (3D printing)',
      originalCompany: 'Multiple - TTYT3D, CC3D, and Chinese manufacturers pioneered the finish',
      keyMilestones: [
        '2017: First silk PLA variants appear',
        '2018: Silk PLA goes viral in 3D printing community',
        '2019+: Every major brand offers silk variants',
        '2020+: Dual-color and rainbow silk variants emerge',
      ],
      majorManufacturers: ['Eryone', 'TTYT3D', 'Polymaker', 'eSUN', 'Hatchbox', 'Overture', 'Sunlu'],
    },
    composition: {
      basePolymer: 'PLA (Polylactic Acid)',
      chemicalFamily: 'Modified Thermoplastic with Metallic/Pearlescent Additives',
      keyAdditives: ['Metallic pigments', 'Pearlescent powders', 'Specialized colorants', 'Optical brighteners'],
      coloringAgents: 'Metallic flakes and pearlescent particles that create depth and shimmer',
      specialFillers: ['Generally unfilled - additives are for appearance only'],
    },
    familyContext: {
      parentPolymer: 'PLA base with cosmetic additives',
      variants: ['Single-color Silk', 'Dual-color Silk', 'Rainbow Silk', 'Silk Metallic', 'Silk Shiny', 'Magic Silk'],
      chemicalComparison: 'Slightly different properties than pure PLA due to additives, but prints similarly.',
      evolution: 'From novelty to one of the most popular specialty PLA variants for decorative printing.',
    },
    strengths: {
      uniqueProperties: ['Stunning metallic/shiny finish', 'No post-processing needed', 'Deep color depth', 'Eye-catching appearance'],
      bestUseScenarios: ['Display pieces', 'Vases', 'Decorative items', 'Gifts', 'Cosplay accessories', 'Art projects'],
      advantagesOverCompetitors: ['Instant beauty - no finishing needed', 'Wide color range', 'Easy to print', 'Affordable'],
      whyChooseThis: 'When you want the most visually impressive prints possible with zero post-processing.',
    },
    weaknesses: {
      limitations: ['Slightly weaker than standard PLA', 'Shiny finish shows layer lines', 'Limited to decorative use'],
      commonProblems: ['Can be stringy', 'Slightly higher temps needed', 'Detail can be lost in shimmer'],
      environmentalConcerns: ['Metallic additives may affect biodegradability', 'Not truly compostable'],
      whenNotToUse: ['Structural parts', 'Precise mechanical fits', 'When matte finish is desired'],
    },
    practicalContext: {
      industryAdoption: ['Consumer products', 'Art', 'Gifts', 'Decorative items'],
      commonApplications: ['Vases', 'Figurines', 'Jewelry', 'Display models', 'Home decor', 'Gift items'],
      safetyStandards: ['Generally safe to print'],
      costPosition: 'Standard',
    },
    trivia: {
      funFacts: [
        'The "silk" effect comes from metallic flakes aligning during extrusion',
        'Printing temperature affects the shininess - higher can mean shinier',
        'Silk PLA went viral on social media, driving massive demand',
        'Some brands achieve the effect with different additive formulations',
      ],
      whyInvented: 'Created to provide stunning visual results without any post-processing requirements.',
      controversies: [
        'Quality varies enormously between brands',
        'Some "silk" PLAs are just slightly shiny, not truly metallic',
        'Mechanical properties sometimes compromised for appearance',
      ],
      marketAdoption: 'Explosive growth - now one of the most popular specialty PLA types.',
    },
    tdsProfile: {
      properties: [
        { name: 'Tensile Strength', value: '40-55', unit: 'MPa', implications: 'Slightly lower than pure PLA due to additives.' },
        { name: 'Elongation at Break', value: '3-6', unit: '%', implications: 'Brittle like standard PLA.' },
        { name: 'Surface Finish', value: 'High Gloss', unit: '', implications: 'The defining characteristic. Metallic sheen built-in.' },
        { name: 'Glass Transition (Tg)', value: '55-60', unit: '°C', implications: 'Same as standard PLA.' },
      ],
      notes: 'Silk PLA is chosen for aesthetics, not mechanical properties. Properties secondary to appearance.',
    },
    printSettings: {
      nozzleTemp: { min: 200, max: 230, optimal: 215 },
      bedTemp: { min: 50, max: 65, optimal: 55 },
      coolingFan: { min: 80, max: 100, notes: 'High cooling maintains the silk finish quality.' },
      enclosure: { required: false, notes: 'Not required. Standard PLA printing.' },
      drying: { temp: 45, duration: '4-6 hours', notes: 'Similar to standard PLA.' },
      printSpeed: { recommended: '40-60 mm/s', notes: 'Moderate speeds for best finish. Slower on details.' },
      additionalNotes: [
        'Slightly higher temps than regular PLA improve flow and shine',
        'Print walls slightly slower for best surface finish',
        'Layer height affects shimmer appearance',
        'Ironing can enhance the silk effect on top surfaces',
      ],
    },
    adhesion: {
      bedSurfaces: {
        excellent: ['PEI (Smooth)', 'PEI (Textured)', 'Glass', 'Blue Tape'],
        good: ['BuildTak'],
        poor: ['Bare aluminum'],
      },
      releaseAgents: 'Same as standard PLA.',
      multiMaterial: [
        { material: 'PLA', bondQuality: 'Strong Chemical Bond', notes: 'Same base polymer.' },
        { material: 'Matte PLA', bondQuality: 'Strong Chemical Bond', notes: 'Great for contrast effects.' },
      ],
    },
    postProcessing: {
      chemicalSmoothing: [
        { method: 'Acetone', effectiveness: 'Not Possible', notes: 'No effect on PLA base.' },
      ],
      mechanical: ['Light sanding removes silk effect', 'Can be clear coated', 'Polishing enhances shine'],
      glues: ['Cyanoacrylate', 'Epoxy', 'PLA welding'],
      painting: 'Painting defeats the purpose - the silk finish IS the feature. Clear coat to protect if needed.',
    },
    safety: {
      fumes: { level: 'Low', notes: 'Same as standard PLA.' },
      foodSafety: { rating: 'Not Recommended', notes: 'Metallic additives not food-safe certified.' },
      biodegradability: { rating: 'Reduced', notes: 'Metallic additives may interfere with composting.' },
    },
  },

  'PLA-Glow': {
    name: 'PLA-Glow',
    fullName: 'Glow-in-the-Dark Polylactic Acid',
    origin: {
      yearInvented: '2013-2014 (3D printing)',
      originalCompany: 'Multiple manufacturers - phosphorescent pigments added to PLA',
      keyMilestones: [
        '2013: First glow PLA filaments appear',
        '2015+: Improved formulations with brighter, longer glow',
        '2018+: Multiple glow colors available (green, blue, purple)',
      ],
      majorManufacturers: ['Gizmo Dorks', 'CC3D', 'eSUN', 'Hatchbox', 'Polymaker', 'Amolen'],
    },
    composition: {
      basePolymer: 'PLA (Polylactic Acid)',
      chemicalFamily: 'Phosphorescent-Filled Thermoplastic',
      keyAdditives: ['Strontium aluminate phosphors (modern)', 'Zinc sulfide (older/cheaper)', 'Europium or dysprosium dopants'],
      coloringAgents: 'Phosphorescent pigments - yellow-green most common and brightest',
      specialFillers: ['Phosphorescent particles - typically 10-30% by weight'],
    },
    familyContext: {
      parentPolymer: 'PLA base with phosphorescent particles',
      variants: ['Green Glow', 'Blue Glow', 'Purple Glow', 'Aqua Glow', 'White/Green Glow'],
      chemicalComparison: 'Similar to other filled PLAs. Phosphor particles are abrasive like glass or carbon fiber.',
      evolution: 'From novelty to practical safety and decorative applications.',
    },
    strengths: {
      uniqueProperties: ['Glows in the dark', 'Charges in any light', 'Long afterglow (hours)', 'Attention-grabbing'],
      bestUseScenarios: ['Night visibility items', 'Toys', 'Safety markers', 'Halloween decorations', 'Astronomy accessories'],
      advantagesOverCompetitors: ['Fun and functional', 'No batteries needed', 'Rechargeable by light', 'Kid-safe'],
      whyChooseThis: 'When you need parts visible in the dark or want that magical glow effect.',
    },
    weaknesses: {
      limitations: ['Very abrasive - wears nozzles', 'Weaker than pure PLA', 'Limited color options', 'Glow fades over time'],
      commonProblems: ['Rapid nozzle wear', 'Inconsistent glow intensity', 'Clumpy extrusion', 'Brittle parts'],
      environmentalConcerns: ['Phosphor particles not biodegradable', 'May complicate recycling'],
      whenNotToUse: ['Structural parts', 'When using brass nozzle long-term', 'Precision mechanical parts'],
    },
    practicalContext: {
      industryAdoption: ['Consumer products', 'Safety equipment', 'Toys', 'Novelty items'],
      commonApplications: ['Light switch covers', 'Stair markers', 'Toy parts', 'Halloween props', 'Keychains', 'Exit signs'],
      safetyStandards: ['Strontium aluminate is non-toxic and non-radioactive'],
      costPosition: 'Premium',
    },
    trivia: {
      funFacts: [
        'Modern glow materials can glow for 8+ hours after brief light exposure',
        'Green-yellow glow is brightest because human eyes are most sensitive to it',
        'Strontium aluminate replaced zinc sulfide - 10x brighter, 10x longer glow',
        'Direct sunlight charges faster than indoor lighting',
      ],
      whyInvented: 'Created for safety applications and novelty items requiring visibility in darkness.',
      controversies: [
        'Older zinc sulfide versions contained trace radioactive materials',
        'Nozzle wear is often underestimated - can destroy a brass nozzle quickly',
        'Glow intensity claims are often exaggerated in marketing',
      ],
      marketAdoption: 'Steady niche - consistently popular for specific applications.',
    },
    tdsProfile: {
      properties: [
        { name: 'Tensile Strength', value: '30-45', unit: 'MPa', implications: 'Lower than pure PLA. Phosphor particles create weak points.' },
        { name: 'Elongation at Break', value: '2-4', unit: '%', implications: 'Very brittle. Phosphor loading reduces flexibility.' },
        { name: 'Phosphor Content', value: '10-30', unit: '%', implications: 'More phosphor = brighter glow but weaker material.' },
        { name: 'Glow Duration', value: '4-12', unit: 'hours', implications: 'Modern strontium aluminate provides long-lasting glow.' },
        { name: 'Abrasiveness', value: 'High', unit: '', implications: 'REQUIRES hardened nozzle for any significant use.' },
      ],
      notes: 'Glow properties vary by phosphor type, particle size, and loading percentage. Strontium aluminate is far superior to zinc sulfide.',
    },
    printSettings: {
      nozzleTemp: { min: 195, max: 225, optimal: 210 },
      bedTemp: { min: 50, max: 65, optimal: 55 },
      coolingFan: { min: 80, max: 100, notes: 'Same as regular PLA - high cooling.' },
      enclosure: { required: false, notes: 'Not required.' },
      drying: { temp: 45, duration: '4-6 hours', notes: 'Similar to standard PLA.' },
      printSpeed: { recommended: '30-50 mm/s', notes: 'Slower to ensure consistent extrusion with abrasive particles.' },
      additionalNotes: [
        'HARDENED NOZZLE REQUIRED - brass will wear quickly',
        'Use 0.5mm+ nozzle to prevent clogging',
        'Clean nozzle before switching to other materials',
        'Charge prints under bright light for best glow',
        'UV light charges faster than visible light',
      ],
    },
    adhesion: {
      bedSurfaces: {
        excellent: ['PEI (Smooth)', 'PEI (Textured)', 'Glass with glue'],
        good: ['Blue tape', 'BuildTak'],
        poor: ['Bare glass'],
      },
      releaseAgents: 'Same as standard PLA.',
      multiMaterial: [
        { material: 'PLA', bondQuality: 'Strong Chemical Bond', notes: 'Same base polymer.' },
        { material: 'Clear PLA', bondQuality: 'Strong Chemical Bond', notes: 'Can create interesting glow effects.' },
      ],
    },
    postProcessing: {
      chemicalSmoothing: [
        { method: 'Acetone', effectiveness: 'Not Possible', notes: 'No effect on PLA base.' },
      ],
      mechanical: ['Sanding possible but reduces glow', 'Can be clear-coated', 'Polish carefully'],
      glues: ['Cyanoacrylate', 'Epoxy', 'PLA welding'],
      painting: 'Painting covers the glow effect. Use clear coat if protection needed.',
    },
    safety: {
      fumes: { level: 'Low', notes: 'Same as standard PLA.' },
      foodSafety: { rating: 'Not Recommended', notes: 'Phosphor particles not certified food-safe.' },
      biodegradability: { rating: 'Reduced', notes: 'Inorganic phosphor particles do not biodegrade.' },
      additionalNotes: [
        'Modern strontium aluminate is non-toxic',
        'Avoid older zinc sulfide variants with radioactive additives',
        'Safe for children\'s toys (modern formulations)',
      ],
    },
  },

  'PLA-Metal': {
    name: 'PLA-Metal',
    fullName: 'Metal-Filled Polylactic Acid',
    origin: {
      yearInvented: '2014-2015 (3D printing)',
      originalCompany: 'colorFabb (BrassFill, CopperFill, SteelFill) pioneered commercial offerings',
      keyMilestones: [
        '2014: colorFabb launches MetalFill line',
        '2015: Proto-pasta introduces composite metal PLA',
        '2017+: Multiple manufacturers offer metal variants',
        '2020+: Improved formulations with higher metal content',
      ],
      majorManufacturers: ['colorFabb', 'Proto-pasta', 'The Virtual Foundry', 'FormFutura', 'eSUN'],
    },
    composition: {
      basePolymer: 'PLA (Polylactic Acid)',
      chemicalFamily: 'Metal Particle-Filled Thermoplastic Composite',
      keyAdditives: ['Metal powders (40-80% by weight)', 'Binding agents', 'Flow modifiers'],
      coloringAgents: 'The metal powder itself provides color',
      specialFillers: ['Bronze', 'Copper', 'Brass', 'Stainless Steel', 'Iron', 'Aluminum'],
    },
    familyContext: {
      parentPolymer: 'PLA binder with high metal particle loading',
      variants: ['Bronze PLA', 'Copper PLA', 'Brass PLA', 'Steel PLA', 'Iron PLA', 'Aluminum PLA'],
      chemicalComparison: 'Much heavier and denser than standard PLA. Metal content provides unique properties.',
      evolution: 'From novelty to legitimate metal-appearance solution without metal printing costs.',
    },
    strengths: {
      uniqueProperties: ['Real metal appearance and weight', 'Can develop patina', 'Conducts heat', 'Unique tactile feel'],
      bestUseScenarios: ['Sculptures', 'Props', 'Jewelry', 'Decorative hardware', 'Antique reproductions'],
      advantagesOverCompetitors: ['Fraction of metal printing cost', 'Standard printer compatible', 'Polishes to metal finish', 'Real weight and feel'],
      whyChooseThis: 'When you want the look, weight, and feel of metal without metal printing equipment.',
    },
    weaknesses: {
      limitations: ['Very abrasive', 'Heavy = slow printing', 'Expensive', 'Brittle', 'Not actually metal strength'],
      commonProblems: ['Rapid nozzle wear', 'Clogging', 'Stringing', 'Delamination with improper settings'],
      environmentalConcerns: ['Metal particles in waste', 'High embodied energy in metal production'],
      whenNotToUse: ['Structural applications', 'When actual metal is needed', 'Cost-sensitive projects'],
    },
    practicalContext: {
      industryAdoption: ['Art', 'Props/costumes', 'Jewelry prototyping', 'Decorative items'],
      commonApplications: ['Statues', 'Figurines', 'Hardware replicas', 'Costume jewelry', 'Film props', 'Awards/trophies'],
      safetyStandards: ['Generally safe - metal powders are inert in bound form'],
      costPosition: 'Premium',
    },
    trivia: {
      funFacts: [
        'Copper-fill can develop real verdigris patina over time',
        'Parts are significantly heavier than standard PLA - feels like real metal',
        'You can use liver of sulfur to antique bronze and copper fills',
        'Some brands achieve 80%+ metal content for truly metallic feel',
      ],
      whyInvented: 'Created to bring metal aesthetics to FDM printing without expensive metal printers.',
      controversies: [
        'Metal content varies wildly between brands',
        'Nozzle wear more severe than most users expect',
        'Polishing required for true metal appearance - raw prints look plastic',
      ],
      marketAdoption: 'Established niche for artists and prop makers.',
    },
    tdsProfile: {
      properties: [
        { name: 'Tensile Strength', value: '15-30', unit: 'MPa', implications: 'Much weaker than pure PLA. Metal particles don\'t bond like polymers.' },
        { name: 'Elongation at Break', value: '1-3', unit: '%', implications: 'Extremely brittle. Handle with care.' },
        { name: 'Density', value: '2.5-6.0', unit: 'g/cm³', implications: '2-5x heavier than standard PLA. Significant weight.' },
        { name: 'Metal Content', value: '40-80', unit: '%', implications: 'Higher content = more metallic but harder to print.' },
        { name: 'Abrasiveness', value: 'Very High', unit: '', implications: 'HARDENED NOZZLE MANDATORY.' },
      ],
      notes: 'Properties vary significantly with metal type and content. All metal PLA is brittle and abrasive.',
    },
    printSettings: {
      nozzleTemp: { min: 195, max: 230, optimal: 210 },
      bedTemp: { min: 50, max: 65, optimal: 55 },
      coolingFan: { min: 50, max: 100, notes: 'Moderate to high. High metal content may need reduced cooling.' },
      enclosure: { required: false, notes: 'Not required but can help with large parts.' },
      drying: { temp: 45, duration: '4-6 hours', notes: 'Standard PLA drying protocol.' },
      printSpeed: { recommended: '20-40 mm/s', notes: 'Slow for consistent extrusion. Heavy material = more inertia.' },
      additionalNotes: [
        'HARDENED NOZZLE ABSOLUTELY REQUIRED',
        'Use 0.5mm+ nozzle to prevent clogging',
        'Print slower than normal - heavy material has more momentum',
        'Increase flow rate slightly (105-110%) to compensate for density',
        'Supports are harder to remove than standard PLA',
      ],
    },
    adhesion: {
      bedSurfaces: {
        excellent: ['PEI (Textured)', 'Glass with glue', 'Blue tape'],
        good: ['PEI (Smooth)', 'BuildTak'],
        poor: ['Bare glass - weight can cause warping'],
      },
      releaseAgents: 'Glue stick helps. Parts are heavy - ensure good adhesion.',
      multiMaterial: [
        { material: 'PLA', bondQuality: 'Mechanical Bond', notes: 'Reasonable adhesion but different shrinkage.' },
        { material: 'Different metals', bondQuality: 'Weak Bond', notes: 'Can combine metals for multi-metal look.' },
      ],
    },
    postProcessing: {
      chemicalSmoothing: [
        { method: 'Acetone', effectiveness: 'Not Possible', notes: 'No effect on PLA base.' },
        { method: 'Patina solutions', effectiveness: 'Excellent', notes: 'Liver of sulfur, vinegar, etc. for aging effect.' },
      ],
      mechanical: ['Steel wool polishing essential', 'Brass brush creates metal shine', 'Burnishing works', 'Can use metal polish'],
      glues: ['Epoxy (metal-filled)', 'Cyanoacrylate', 'Mechanical fastening'],
      painting: 'Usually not painted - polishing is the finish. Clear coat protects polish.',
    },
    safety: {
      fumes: { level: 'Low', notes: 'Similar to PLA. Metal is bound in polymer.' },
      foodSafety: { rating: 'Not Recommended', notes: 'Metal particles may leach. Not food-safe.' },
      biodegradability: { rating: 'Not Biodegradable', notes: 'Metal particles prevent composting.' },
      additionalNotes: [
        'Wear gloves when polishing - metal dust is irritating',
        'Dust mask recommended for extended polishing',
        'Wash hands after handling raw/polished parts',
      ],
    },
  },

  'PLA-Marble': {
    name: 'PLA-Marble',
    fullName: 'Marble-Effect Polylactic Acid',
    origin: {
      yearInvented: '2017-2018 (3D printing)',
      originalCompany: 'Multiple manufacturers developed similar concepts',
      keyMilestones: [
        '2017: First marble-look filaments appear',
        '2018+: Stone/marble PLA becomes established category',
        '2020+: Multiple variants (granite, marble, stone) available',
      ],
      majorManufacturers: ['Sunlu', 'Eryone', 'eSUN', 'Polymaker', 'Hatchbox', 'Ziro'],
    },
    composition: {
      basePolymer: 'PLA (Polylactic Acid)',
      chemicalFamily: 'Multi-Pigment Filled Thermoplastic',
      keyAdditives: ['Contrasting color particles', 'Mineral-like pigments', 'Sometimes actual stone powder'],
      coloringAgents: 'Randomly dispersed pigment particles create veining effect',
      specialFillers: ['Some contain actual mineral powder', 'Most use only pigments'],
    },
    familyContext: {
      parentPolymer: 'PLA base with distributed pigment particles',
      variants: ['White Marble', 'Black Marble', 'Granite', 'Stone', 'Terrazzo'],
      chemicalComparison: 'Same as standard PLA with visual additives. Properties nearly identical.',
      evolution: 'From novelty to popular architectural and decorative material.',
    },
    strengths: {
      uniqueProperties: ['Realistic stone appearance', 'Unique random veining pattern', 'No two prints identical', 'Hides layer lines'],
      bestUseScenarios: ['Architectural models', 'Decorative items', 'Vases', 'Planters', 'Display pieces'],
      advantagesOverCompetitors: ['Beautiful finish with no post-processing', 'Prints like standard PLA', 'Affordable', 'Hides imperfections'],
      whyChooseThis: 'When you want the elegant look of stone without the weight or cost of actual stone.',
    },
    weaknesses: {
      limitations: ['Same strength as PLA', 'Low heat resistance', 'Can\'t match specific stone patterns'],
      commonProblems: ['Veining pattern is random', 'Color consistency varies between rolls', 'Some brands have weak veining'],
      environmentalConcerns: ['Standard PLA concerns apply'],
      whenNotToUse: ['Structural applications', 'When specific marble pattern needed', 'Outdoor use'],
    },
    practicalContext: {
      industryAdoption: ['Architecture models', 'Interior design', 'Home decor', 'Art'],
      commonApplications: ['Vases', 'Planters', 'Busts', 'Architectural models', 'Coasters', 'Decorative bowls'],
      safetyStandards: ['Same as standard PLA'],
      costPosition: 'Standard',
    },
    trivia: {
      funFacts: [
        'The veining effect is created by partially mixed pigments that separate during extrusion',
        'Print orientation affects veining direction and appearance',
        'Some brands achieve more realistic patterns than others',
        'Layer height affects how veining appears - experiment!',
      ],
      whyInvented: 'Created to provide stone aesthetics for decorative 3D printing without the weight of real stone.',
      controversies: [
        'Pattern consistency varies widely between brands',
        'Marketing photos often show best-case results',
        '"Stone-filled" claims are sometimes exaggerated',
      ],
      marketAdoption: 'Popular in the decorative printing segment.',
    },
    tdsProfile: {
      properties: [
        { name: 'Tensile Strength', value: '45-55', unit: 'MPa', implications: 'Similar to standard PLA.' },
        { name: 'Elongation at Break', value: '4-6', unit: '%', implications: 'Same brittleness as PLA.' },
        { name: 'Glass Transition (Tg)', value: '55-60', unit: '°C', implications: 'Standard PLA heat resistance.' },
        { name: 'Appearance', value: 'Veined Stone', unit: '', implications: 'Random pattern varies with each print.' },
      ],
      notes: 'Mechanical properties essentially identical to standard PLA. Chosen for aesthetics.',
    },
    printSettings: {
      nozzleTemp: { min: 195, max: 220, optimal: 205 },
      bedTemp: { min: 50, max: 65, optimal: 55 },
      coolingFan: { min: 80, max: 100, notes: 'Standard PLA cooling.' },
      enclosure: { required: false, notes: 'Not required.' },
      drying: { temp: 45, duration: '4-6 hours', notes: 'Standard PLA drying.' },
      printSpeed: { recommended: '40-60 mm/s', notes: 'Normal PLA speeds work fine.' },
      additionalNotes: [
        'Veining pattern affected by print orientation',
        'Wall line count affects visibility of pattern',
        'Random seam can enhance natural look',
        'Experiment with temps for best color separation',
      ],
    },
    adhesion: {
      bedSurfaces: {
        excellent: ['PEI (Smooth)', 'PEI (Textured)', 'Glass', 'Blue tape'],
        good: ['BuildTak'],
        poor: ['Bare aluminum'],
      },
      releaseAgents: 'Same as standard PLA.',
      multiMaterial: [
        { material: 'PLA', bondQuality: 'Strong Chemical Bond', notes: 'Same base polymer.' },
        { material: 'White/Black PLA', bondQuality: 'Strong Chemical Bond', notes: 'Can accent marble effect.' },
      ],
    },
    postProcessing: {
      chemicalSmoothing: [
        { method: 'Acetone', effectiveness: 'Not Possible', notes: 'No effect on PLA base.' },
      ],
      mechanical: ['Can be sanded carefully', 'Polish with fine grit', 'Clear coat enhances look'],
      glues: ['Cyanoacrylate', 'Epoxy', 'PLA welding'],
      painting: 'Painting defeats the purpose. Clear coat or matte sealer to protect.',
    },
    safety: {
      fumes: { level: 'Low', notes: 'Same as standard PLA.' },
      foodSafety: { rating: 'Depends on brand', notes: 'Some mineral additives may not be food-safe. Check with manufacturer.' },
      biodegradability: { rating: 'Same as PLA', notes: 'Industrial composting only.' },
    },
  },

  'PLA-CF': {
    name: 'PLA-CF',
    fullName: 'Carbon Fiber Reinforced Polylactic Acid',
    origin: {
      yearInvented: '2015+ (3D printing formulation)',
      originalCompany: 'Multiple manufacturers developed carbon fiber PLA',
      keyMilestones: [
        '2007-2010: PLA becomes dominant FDM material',
        '2015-2016: Carbon fiber PLA filaments emerge',
        '2018+: Becomes popular entry-level CF composite',
        '2020+: Widely available from most filament brands',
      ],
      majorManufacturers: ['Polymaker', 'Priline', 'Overture', '3DXTech', 'eSUN', 'Hatchbox', 'Protopasta'],
    },
    composition: {
      basePolymer: 'PLA (Polylactic Acid)',
      chemicalFamily: 'Aliphatic Polyester Composite',
      keyAdditives: ['Chopped carbon fiber (10-20%)', 'Coupling agents'],
      coloringAgents: 'Typically black only due to carbon fiber',
      specialFillers: ['Chopped carbon fiber strands (100-200μm length)'],
    },
    familyContext: {
      parentPolymer: 'Standard PLA reinforced with carbon fiber',
      variants: ['PLA-CF 10%', 'PLA-CF 15%', 'PLA-CF 20%'],
      chemicalComparison: 'Significantly stiffer than PLA with improved dimensional stability, but still has PLA heat limitations.',
      evolution: 'Created as an accessible entry point to carbon fiber composites for hobbyists.',
    },
    strengths: {
      uniqueProperties: ['High stiffness for PLA', 'Excellent dimensional stability', 'Professional matte finish', 'Reduced stringing'],
      bestUseScenarios: ['Stiff prototypes', 'Lightweight structural models', 'Precision parts', 'Camera mounts', 'Quadcopter frames (indoor)'],
      advantagesOverCompetitors: ['Easiest CF composite to print', 'No enclosure needed', 'Much stiffer than plain PLA', 'Low warping'],
      whyChooseThis: 'When you need carbon fiber stiffness but want the easy printability of PLA.',
    },
    weaknesses: {
      limitations: ['Requires hardened nozzle', 'Low heat resistance (still PLA)', 'Brittle - low impact resistance', 'Not for outdoor use'],
      commonProblems: ['Rapid brass nozzle wear', 'Layer adhesion weaker than solid PLA', 'Parts still soften at 50-60°C'],
      environmentalConcerns: ['Carbon fiber not biodegradable', 'PLA matrix may still compost industrially', 'CF dust hazard'],
      whenNotToUse: ['Heat-exposed applications', 'Impact-critical parts', 'Outdoor use', 'Without hardened nozzle'],
    },
    practicalContext: {
      industryAdoption: ['Hobbyist prototyping', 'Educational settings', 'RC/drone indoor frames', 'Precision tooling'],
      commonApplications: ['Camera gimbals', 'Laptop stands', 'Precision brackets', 'Stiff enclosures', 'RC plane components'],
      safetyStandards: ['Generally not certified for critical applications'],
      costPosition: 'Standard',
    },
    trivia: {
      funFacts: [
        'PLA-CF is often called "beginner carbon fiber" - easiest CF to print',
        'The matte black finish comes from fiber ends at the surface',
        'Parts are 30-40% stiffer than standard PLA',
        'A brass nozzle will be destroyed in under 500g of PLA-CF',
      ],
      whyInvented: 'Created to bring carbon fiber benefits to hobbyists without requiring enclosed printers.',
      controversies: [
        'Some brands use minimal CF content (5%) but market as "carbon fiber"',
        'Heat resistance is often overstated - it is still PLA underneath',
        'Quality varies dramatically between brands',
      ],
      marketAdoption: 'Very popular as an introduction to carbon fiber composites.',
    },
    tdsProfile: {
      properties: [
        { name: 'Tensile Strength', value: '50-65', unit: 'MPa', implications: 'Similar to plain PLA but with better stiffness.' },
        { name: 'Tensile Modulus', value: '4000-6000', unit: 'MPa', implications: 'High. 1.5-2x stiffer than standard PLA.' },
        { name: 'Elongation at Break', value: '2-4', unit: '%', implications: 'Very Low. Brittle like standard PLA but more so.' },
        { name: 'Impact Strength', value: '15-25', unit: 'kJ/m²', implications: 'Low. Reduced from plain PLA due to fiber stress points.' },
        { name: 'Glass Transition (Tg)', value: '55-60', unit: '°C', implications: 'STILL LOW - this is still PLA. Parts soften in heat.' },
        { name: 'Heat Deflection (HDT)', value: '~55-60', unit: '°C (0.45 MPa)', implications: 'Minimal improvement. CF does not fix PLA heat weakness.' },
      ],
      notes: 'Carbon fiber improves stiffness but NOT heat resistance. Still has PLA thermal limitations.',
    },
    printSettings: {
      nozzleTemp: { min: 200, max: 230, optimal: 215 },
      bedTemp: { min: 40, max: 60, optimal: 50 },
      coolingFan: { min: 50, max: 100, notes: 'Good cooling like standard PLA. Helps with detail.' },
      enclosure: { required: false, notes: 'Not required - prints like PLA in open air.' },
      drying: { temp: 45, duration: '4-6 hours', notes: 'Less critical than engineering CF materials but still helps.' },
      printSpeed: { recommended: '40-80 mm/s', notes: 'Similar to PLA. Can print reasonably fast.' },
      additionalNotes: [
        'HARDENED NOZZLE REQUIRED (steel or better)',
        'Larger nozzle (0.5mm+) recommended to prevent clogging',
        'Print slightly hotter than plain PLA for better fiber wetting',
        'Layer adhesion may be weaker - consider thicker layers',
      ],
    },
    adhesion: {
      bedSurfaces: {
        excellent: ['PEI (Textured)', 'PEI (Smooth)', 'Glass with glue'],
        good: ['Blue tape', 'BuildTak'],
        poor: ['Bare aluminum'],
      },
      releaseAgents: 'Same as PLA - usually not needed on textured PEI.',
      multiMaterial: [
        { material: 'PLA', bondQuality: 'Strong Chemical Bond', notes: 'Same polymer base - excellent compatibility.' },
        { material: 'TPU', bondQuality: 'Strong Chemical Bond', notes: 'Good for stiff parts with flexible sections.' },
        { material: 'PVA', bondQuality: 'Strong Chemical Bond', notes: 'PVA works as soluble support.' },
      ],
    },
    postProcessing: {
      chemicalSmoothing: [
        { method: 'THF/Ethyl Acetate', effectiveness: 'Difficult', notes: 'PLA smoothing chemicals work but fibers protrude.' },
      ],
      mechanical: ['Sanding requires dust mask - CF dust hazardous', 'Can be drilled and tapped', 'Machining possible with care'],
      glues: ['Cyanoacrylate works well', 'Epoxy for structural joints', 'Hot air welding possible'],
      painting: 'Matte surface accepts paint well. Prime for best results.',
    },
    safety: {
      fumes: { level: 'Low', notes: 'PLA base emits minimal fumes. Carbon fiber dust is the main concern when post-processing.' },
      foodSafety: { rating: 'Not Recommended', notes: 'Carbon fiber shedding makes food contact inadvisable.' },
      biodegradability: { rating: 'Partial', notes: 'PLA matrix may biodegrade industrially; carbon fiber will not.' },
      additionalNotes: [
        'Wear mask when sanding - CF dust is a respiratory irritant',
        'Much safer to print than ABS-CF or ASA-CF',
        'Good ventilation still recommended',
      ],
    },
  },

  'HTPLA': {
    name: 'HTPLA',
    fullName: 'High Temperature Polylactic Acid',
    origin: {
      yearInvented: '2015+ (3D printing formulation)',
      originalCompany: 'Protopasta (one of the first), then multiple manufacturers',
      keyMilestones: [
        '2007-2010: PLA becomes dominant but heat weakness is apparent',
        '2015: HTPLA formulations emerge to address heat resistance',
        '2017+: Annealing techniques become well-documented',
        '2020+: Multiple brands offer heat-treatable PLA',
      ],
      majorManufacturers: ['Protopasta', 'Polymaker (PolyMax)', '3D-Fuel', 'Fillamentum', 'ColorFabb (HT)'],
    },
    composition: {
      basePolymer: 'Modified PLA with crystallization enhancers',
      chemicalFamily: 'Aliphatic Polyester (Modified)',
      keyAdditives: ['Nucleating agents for crystallization', 'Impact modifiers', 'Heat stabilizers'],
      coloringAgents: 'Various colors available, though annealing may shift color slightly',
      specialFillers: ['Some formulas include mineral fillers for stability'],
    },
    familyContext: {
      parentPolymer: 'PLA modified to enable post-print heat treatment (annealing)',
      variants: ['HTPLA', 'PLA-HT', 'PolyMax PLA', 'Tough PLA HT'],
      chemicalComparison: 'Same base chemistry as PLA but formulated to crystallize during annealing, dramatically improving heat resistance.',
      evolution: 'Created to solve PLA\'s biggest weakness - low heat deflection temperature.',
    },
    strengths: {
      uniqueProperties: ['Heat resistance up to 120°C after annealing', 'Easy to print (like PLA)', 'Post-process to unlock heat resistance', 'Low warping during print'],
      bestUseScenarios: ['Heat-exposed parts', 'Automotive interior', 'Coffee cup holders', 'Electronics enclosures', 'Dishwasher-safe items'],
      advantagesOverCompetitors: ['Prints as easily as PLA', 'No enclosure needed', 'Heat resistance rivals ABS after treatment', 'Biodegradable base'],
      whyChooseThis: 'When you need heat resistance but want the easy printability of PLA and no enclosure.',
    },
    weaknesses: {
      limitations: ['Requires post-print annealing', 'Parts shrink during annealing (5-10%)', 'Annealing can cause warping', 'More expensive than standard PLA'],
      commonProblems: ['Dimensional changes during annealing', 'Uneven crystallization', 'Color shift with heat treatment', 'Requires oven or heat gun'],
      environmentalConcerns: ['Same as standard PLA - industrial composting only'],
      whenNotToUse: ['When precise dimensions required (shrinkage)', 'Without access to annealing equipment', 'Quick prototypes not needing heat resistance'],
    },
    practicalContext: {
      industryAdoption: ['Consumer products', 'Automotive accessories', 'Kitchen items', 'Electronics'],
      commonApplications: ['Cup holders', 'Phone mounts in cars', 'Kitchen utensil handles', 'Enclosures near heat sources', 'Sunlit window items'],
      safetyStandards: ['Some grades are food-safe certified after proper annealing'],
      costPosition: 'Standard',
    },
    trivia: {
      funFacts: [
        'Annealing causes PLA to crystallize from amorphous to semi-crystalline structure',
        'The white/opaque color shift during annealing is the crystallization happening',
        'Properly annealed HTPLA can survive boiling water (100°C)',
        'The shrinkage during annealing can be compensated by scaling prints 105-110%',
      ],
      whyInvented: 'Created because users loved PLA ease of printing but were frustrated by parts deforming in hot cars.',
      controversies: [
        'Annealing instructions vary between brands - inconsistent results',
        'Some "HTPLA" brands show minimal improvement even after treatment',
        'Shrinkage compensation is trial-and-error for complex geometries',
      ],
      marketAdoption: 'Growing steadily as users discover the annealing process.',
    },
    tdsProfile: {
      properties: [
        { name: 'Tensile Strength (As Printed)', value: '50-60', unit: 'MPa', implications: 'Similar to standard PLA before annealing.' },
        { name: 'Tensile Strength (Annealed)', value: '55-70', unit: 'MPa', implications: 'Slight improvement after crystallization.' },
        { name: 'Elongation at Break', value: '4-8', unit: '%', implications: 'Low. Similar brittleness to standard PLA.' },
        { name: 'Glass Transition (Tg) - As Printed', value: '55-60', unit: '°C', implications: 'Same as standard PLA initially.' },
        { name: 'Heat Deflection (Annealed)', value: '100-120', unit: '°C', implications: 'DRAMATICALLY IMPROVED - the whole point of HTPLA.' },
        { name: 'Shrinkage During Annealing', value: '5-10', unit: '%', implications: 'Significant. Design parts 5-10% larger to compensate.' },
      ],
      notes: 'Properties before and after annealing differ significantly. Heat resistance is only achieved after proper heat treatment.',
    },
    printSettings: {
      nozzleTemp: { min: 195, max: 225, optimal: 210 },
      bedTemp: { min: 45, max: 65, optimal: 55 },
      coolingFan: { min: 50, max: 100, notes: 'Good cooling like standard PLA.' },
      enclosure: { required: false, notes: 'Not required for printing. Oven needed for annealing.' },
      drying: { temp: 45, duration: '4-6 hours', notes: 'Same moisture sensitivity as standard PLA.' },
      printSpeed: { recommended: '40-80 mm/s', notes: 'Same as standard PLA.' },
      additionalNotes: [
        'Print like normal PLA - no special settings needed',
        'ANNEALING REQUIRED for heat resistance: 70-110°C for 30-60 minutes',
        'Support parts during annealing to prevent warping',
        'Scale parts 105-110% to compensate for shrinkage',
        'Use sand or salt as support medium in oven',
      ],
    },
    adhesion: {
      bedSurfaces: {
        excellent: ['PEI (Textured)', 'PEI (Smooth)', 'Glass'],
        good: ['Blue tape', 'BuildTak'],
        poor: ['Bare aluminum'],
      },
      releaseAgents: 'Same as standard PLA.',
      multiMaterial: [
        { material: 'PLA', bondQuality: 'Strong Chemical Bond', notes: 'Compatible but non-HTPLA sections will soften during annealing.' },
        { material: 'PVA', bondQuality: 'Strong Chemical Bond', notes: 'PVA works for supports but dissolve BEFORE annealing.' },
      ],
    },
    postProcessing: {
      chemicalSmoothing: [
        { method: 'THF/Ethyl Acetate', effectiveness: 'Good', notes: 'Same as PLA before annealing. After annealing, crystalline structure resists chemicals.' },
      ],
      mechanical: ['Sands easily', 'Machine before annealing for precise dimensions', 'Can be drilled and tapped'],
      glues: ['Cyanoacrylate works', 'Epoxy for heat-resistant joints', 'Acetone does NOT work'],
      painting: 'Paint after annealing - surface becomes slightly matte. Prime for best adhesion.',
    },
    safety: {
      fumes: { level: 'Low', notes: 'Same low emissions as standard PLA during printing.' },
      foodSafety: { rating: 'Some Grades Certified', notes: 'Check brand certifications. Must be properly annealed for heat applications.' },
      biodegradability: { rating: 'Industrial Only', notes: 'Same as standard PLA - requires industrial composting.' },
      additionalNotes: [
        'Annealing should be done in well-ventilated area',
        'Use dedicated oven or toaster oven - not food preparation oven',
        'Monitor temperature carefully during annealing',
      ],
    },
  },

  'LW-PLA': {
    name: 'LW-PLA',
    fullName: 'Lightweight Foaming Polylactic Acid',
    origin: {
      yearInvented: '2019 (3D printing formulation)',
      originalCompany: 'ColorFabb (developed LW-PLA)',
      keyMilestones: [
        '2019: ColorFabb introduces LW-PLA',
        '2020: RC plane community adopts rapidly',
        '2021+: Other manufacturers release competing foaming PLAs',
      ],
      majorManufacturers: ['ColorFabb (original)', 'Polymaker (PolyLite LW)', '3D-Fuel', 'eSUN (ePLA-LW)'],
    },
    composition: {
      basePolymer: 'PLA with foaming/blowing agents',
      chemicalFamily: 'Aliphatic Polyester with Gas-Generating Additives',
      keyAdditives: ['Chemical foaming agents (activated by heat)', 'Nucleating agents', 'Cell stabilizers'],
      coloringAgents: 'Limited colors - typically white, gray, black',
      specialFillers: ['Foaming agents that release gas when heated'],
    },
    familyContext: {
      parentPolymer: 'PLA modified with foaming agents that activate at high temperatures',
      variants: ['LW-PLA', 'ePLA-LW', 'PolyLite LW-PLA'],
      chemicalComparison: 'Expands up to 3x volume when printed hot, creating lightweight cellular structure.',
      evolution: 'Developed specifically for RC aircraft builders who needed light, printable foam alternatives.',
    },
    strengths: {
      uniqueProperties: ['Up to 65% weight reduction', 'Closed-cell foam structure', 'Excellent for large parts', 'Dramatically faster printing (more volume per gram)'],
      bestUseScenarios: ['RC aircraft', 'Large display models', 'Cosplay props', 'Floating objects', 'Sound absorption'],
      advantagesOverCompetitors: ['Lightest 3D printable material', 'Reduces material cost per volume', 'Faster large prints', 'Can be sanded smooth'],
      whyChooseThis: 'When weight is the primary concern - nothing else comes close for lightweight printing.',
    },
    weaknesses: {
      limitations: ['Lower strength than solid PLA', 'Requires careful temperature tuning', 'Surface finish is rough/matte', 'Limited color options'],
      commonProblems: ['Finding optimal expansion temperature', 'Inconsistent expansion', 'Clogging if temperature drops', 'Stringing'],
      environmentalConcerns: ['Same as PLA - industrial composting', 'Foaming agents may affect biodegradability'],
      whenNotToUse: ['Structural/load-bearing parts', 'When smooth surface needed', 'Small detailed parts', 'Mechanical components'],
    },
    practicalContext: {
      industryAdoption: ['RC/hobby aircraft', 'Display models', 'Props and cosplay', 'Prototyping large objects'],
      commonApplications: ['RC plane fuselages and wings', 'Drone frames', 'Display busts', 'Theatrical props', 'Architectural models'],
      safetyStandards: ['Not typically certified - hobbyist material'],
      costPosition: 'Premium',
    },
    trivia: {
      funFacts: [
        'A meter-wingspan RC plane fuselage can weigh under 100 grams with LW-PLA',
        'The foaming agent creates millions of tiny bubbles inside the plastic',
        'LW-PLA uses LESS filament by weight to fill the same volume',
        'Some users report up to 3x the print volume from the same spool weight',
      ],
      whyInvented: 'Created for RC aircraft builders who wanted printable alternatives to foam board construction.',
      controversies: [
        'Optimal settings vary significantly between printers and even spools',
        'Claims of "3x expansion" are marketing - 1.5-2x is more realistic in practice',
        'Some competing brands offer minimal foaming compared to ColorFabb original',
      ],
      marketAdoption: 'Rapidly adopted by RC community; niche but enthusiastic user base.',
    },
    tdsProfile: {
      properties: [
        { name: 'Density (Foamed)', value: '0.4-0.6', unit: 'g/cm³', implications: 'VERY LOW. Standard PLA is 1.24 g/cm³. Up to 65% weight reduction.' },
        { name: 'Tensile Strength', value: '20-35', unit: 'MPa', implications: 'Reduced. Cellular structure decreases strength significantly.' },
        { name: 'Elongation at Break', value: '3-5', unit: '%', implications: 'Brittle like PLA. Foam structure can make it more prone to crushing.' },
        { name: 'Expansion Ratio', value: '1.5-2.5x', unit: 'volume', implications: 'Prints larger than input material. Temperature controls expansion.' },
        { name: 'Glass Transition (Tg)', value: '55-60', unit: '°C', implications: 'Same as PLA. Heat weakness remains.' },
        { name: 'Cell Size', value: '50-200', unit: 'μm', implications: 'Closed-cell structure provides buoyancy and insulation.' },
      ],
      notes: 'Properties vary dramatically based on printing temperature. Higher temp = more expansion = lighter but weaker.',
    },
    printSettings: {
      nozzleTemp: { min: 230, max: 265, optimal: 250 },
      bedTemp: { min: 45, max: 60, optimal: 50 },
      coolingFan: { min: 0, max: 50, notes: 'Less cooling than normal PLA. Too much cooling stops foaming.' },
      enclosure: { required: false, notes: 'Not required but helps maintain consistent foaming.' },
      drying: { temp: 45, duration: '4-6 hours', notes: 'Moisture affects foaming consistency. Dry thoroughly.' },
      printSpeed: { recommended: '20-40 mm/s', notes: 'Slower speeds allow proper foaming. Fast printing underfoams.' },
      additionalNotes: [
        'Temperature controls expansion: 230°C = minimal foam, 250°C+ = maximum foam',
        'Use 0.6mm+ nozzle for best results',
        'Set flow rate to 50-65% to compensate for expansion',
        'Disable retraction or minimize to prevent clogging',
        'First layer at normal PLA temps (200-210°C) for adhesion',
        'Increase temp for foaming on subsequent layers',
      ],
    },
    adhesion: {
      bedSurfaces: {
        excellent: ['PEI (Textured)', 'Glass with glue'],
        good: ['PEI (Smooth)', 'Blue tape'],
        poor: ['Bare surfaces'],
      },
      releaseAgents: 'Glue stick helps since first layer is printed hot.',
      multiMaterial: [
        { material: 'PLA', bondQuality: 'Strong Chemical Bond', notes: 'Use solid PLA for structural sections, LW-PLA for bulk.' },
        { material: 'PVA', bondQuality: 'Weak Bond', notes: 'Supports may not work well - design for supportless printing.' },
      ],
    },
    postProcessing: {
      chemicalSmoothing: [
        { method: 'Not Recommended', effectiveness: 'Difficult', notes: 'Foam structure makes chemical smoothing impractical.' },
      ],
      mechanical: ['Sands very easily - foam structure is soft', 'Can fill with lightweight filler', 'Accepts CA glue well for reinforcement'],
      glues: ['Cyanoacrylate penetrates foam for strong bonds', 'Epoxy works but adds weight', 'Hot glue effective'],
      painting: 'Porous surface absorbs paint. Use filler primer for smooth finish.',
    },
    safety: {
      fumes: { level: 'Low', notes: 'Higher printing temps but still PLA-based. Better ventilation recommended at 250°C+.' },
      foodSafety: { rating: 'Not Recommended', notes: 'Porous foam structure traps bacteria. Not suitable for food contact.' },
      biodegradability: { rating: 'Unknown', notes: 'PLA base may biodegrade industrially; foaming agents effect unknown.' },
      additionalNotes: [
        'Higher printing temps require better ventilation',
        'Foam dust when sanding - use mask',
        'Material is generally safe to handle',
      ],
    },
  },

  'PLA-Matte': {
    name: 'PLA-Matte',
    fullName: 'Matte Finish Polylactic Acid',
    origin: {
      yearInvented: '2018+ (3D printing formulation)',
      originalCompany: 'Multiple manufacturers developed matte PLA formulations',
      keyMilestones: [
        '2007-2010: Standard PLA dominates with glossy finish',
        '2018-2019: Matte PLA variants emerge for aesthetic applications',
        '2020+: Becomes popular for display models and props',
      ],
      majorManufacturers: ['Polymaker (PolyTerra)', 'Bambu Lab', 'Elegoo', 'Eryone', 'Overture', 'eSUN'],
    },
    composition: {
      basePolymer: 'PLA with surface-modifying additives',
      chemicalFamily: 'Aliphatic Polyester (Modified)',
      keyAdditives: ['Matte agents (mineral fillers)', 'Surface texture modifiers', 'Light-diffusing particles'],
      coloringAgents: 'Wide color range - matte finish enhances earth tones especially',
      specialFillers: ['Micro-minerals for light diffusion', 'Sometimes recycled PLA content'],
    },
    familyContext: {
      parentPolymer: 'PLA modified with additives that create light-diffusing matte surface',
      variants: ['PLA-Matte', 'PolyTerra PLA', 'Matte Silk PLA', 'Eco PLA Matte'],
      chemicalComparison: 'Same base chemistry as PLA but with surface-modifying particles that eliminate glossy shine.',
      evolution: 'Developed for users who wanted professional-looking prints without post-processing.',
    },
    strengths: {
      uniqueProperties: ['No visible layer lines', 'Professional matte finish', 'Hides print imperfections', 'Earth tone colors look natural'],
      bestUseScenarios: ['Display models', 'Props and cosplay', 'Product prototypes', 'Figurines', 'Architectural models'],
      advantagesOverCompetitors: ['Eliminates sanding for appearance', 'Ready for photography', 'Consistent appearance', 'Easy to print'],
      whyChooseThis: 'When appearance matters and you want print-ready results without post-processing.',
    },
    weaknesses: {
      limitations: ['Slightly weaker than standard PLA', 'Shows fingerprints/oils easily', 'Limited to matte aesthetic', 'Can be slightly more brittle'],
      commonProblems: ['Dust and fingerprints visible on dark colors', 'Some brands string more', 'Moisture sensitivity'],
      environmentalConcerns: ['Some formulas use recycled content (positive)', 'Industrial composting only'],
      whenNotToUse: ['When glossy finish desired', 'Mechanical parts (use standard PLA)', 'When handling frequently'],
    },
    practicalContext: {
      industryAdoption: ['Product design', 'Architecture', 'Entertainment/props', 'Art and sculpture'],
      commonApplications: ['Display figurines', 'Architectural models', 'Film props', 'Product mockups', 'Art sculptures'],
      safetyStandards: ['Some brands are food-safe certified (PolyTerra)'],
      costPosition: 'Standard',
    },
    trivia: {
      funFacts: [
        'Matte PLA became famous for making layer lines nearly invisible',
        'PolyTerra PLA includes recycled cardboard spool and recycled PLA content',
        'The matte effect comes from micro-particles that scatter light',
        'Dark matte colors show dust and fingerprints more than light colors',
      ],
      whyInvented: 'Created for users who wanted professional-looking prints without sanding and painting.',
      controversies: [
        'Some "matte" PLAs are barely different from standard',
        'Matte finish can be achieved with spray finishes on regular PLA',
        'Quality and matteness vary significantly between brands',
      ],
      marketAdoption: 'Rapidly growing - becoming preferred choice for display and aesthetic prints.',
    },
    tdsProfile: {
      properties: [
        { name: 'Tensile Strength', value: '45-55', unit: 'MPa', implications: 'Slightly lower than standard PLA due to additives.' },
        { name: 'Elongation at Break', value: '3-5', unit: '%', implications: 'Similar brittleness to standard PLA.' },
        { name: "Young's Modulus", value: '2200-3000', unit: 'MPa', implications: 'Similar stiffness to standard PLA.' },
        { name: 'Impact Strength', value: '20-25', unit: 'kJ/m²', implications: 'Similar to standard PLA.' },
        { name: 'Glass Transition (Tg)', value: '55-60', unit: '°C', implications: 'Same heat limitations as standard PLA.' },
        { name: 'Surface Finish', value: 'Matte', unit: '', implications: 'Light-diffusing surface hides layer lines.' },
      ],
      notes: 'Mechanical properties similar to standard PLA. The difference is aesthetic, not structural.',
    },
    printSettings: {
      nozzleTemp: { min: 190, max: 220, optimal: 205 },
      bedTemp: { min: 40, max: 60, optimal: 50 },
      coolingFan: { min: 80, max: 100, notes: 'Good cooling like standard PLA for best matte finish.' },
      enclosure: { required: false, notes: 'Not required - prints like standard PLA.' },
      drying: { temp: 45, duration: '4-6 hours', notes: 'Same moisture sensitivity as standard PLA.' },
      printSpeed: { recommended: '40-80 mm/s', notes: 'Same speeds as standard PLA.' },
      additionalNotes: [
        'Print like standard PLA - no special settings needed',
        'Slightly lower temps may enhance matte effect',
        'Good cooling helps maintain matte finish',
        'Handle with gloves to avoid fingerprints on final parts',
      ],
    },
    adhesion: {
      bedSurfaces: {
        excellent: ['PEI (Textured)', 'PEI (Smooth)', 'Glass'],
        good: ['Blue tape', 'BuildTak'],
        poor: ['Bare aluminum'],
      },
      releaseAgents: 'Same as standard PLA - usually not needed.',
      multiMaterial: [
        { material: 'PLA', bondQuality: 'Strong Chemical Bond', notes: 'Fully compatible with standard PLA.' },
        { material: 'TPU', bondQuality: 'Strong Chemical Bond', notes: 'Good for soft-touch matte parts.' },
        { material: 'PVA', bondQuality: 'Strong Chemical Bond', notes: 'PVA works as soluble support.' },
      ],
    },
    postProcessing: {
      chemicalSmoothing: [
        { method: 'Not Recommended', effectiveness: 'Good', notes: 'Smoothing would remove the matte effect - defeats the purpose.' },
      ],
      mechanical: ['Light sanding maintains matte look', 'Can be primed and painted', 'Clear matte coat can protect finish'],
      glues: ['Cyanoacrylate works well', 'Epoxy for structural bonds', 'Hot glue effective'],
      painting: 'Already has ideal matte surface for paint adhesion. No primer needed for matte paints.',
    },
    safety: {
      fumes: { level: 'Low', notes: 'Same low emissions as standard PLA.' },
      foodSafety: { rating: 'Some Grades Certified', notes: 'PolyTerra and some others are food-safe. Check brand certifications.' },
      biodegradability: { rating: 'Industrial Only', notes: 'Same as standard PLA. Some brands include recycled content.' },
      additionalNotes: [
        'Generally very safe material',
        'Some brands (PolyTerra) emphasize eco-friendly production',
        'Same safety profile as standard PLA',
      ],
    },
  },

  'PLA+ 2.0': {
    name: 'PLA+ 2.0',
    fullName: 'Enhanced Polylactic Acid Second Generation',
    origin: {
      yearInvented: '2021-2022',
      originalCompany: 'Various manufacturers (eSUN, Polymaker, Sunlu)',
      keyMilestones: [
        '2015-2017: First generation PLA+ establishes the category',
        '2020: Competition drives innovation in PLA+ formulations',
        '2021-2022: Second generation PLA+ 2.0 variants introduced',
        '2023: Multiple brands offer "2.0" or "Pro" enhanced versions',
      ],
      majorManufacturers: ['eSUN', 'Polymaker', 'Sunlu', 'Overture', 'Creality Hyper PLA'],
    },
    composition: {
      basePolymer: 'Polylactic Acid with advanced impact modifiers',
      chemicalFamily: 'Polyester (Bio-based) with proprietary additives',
      keyAdditives: ['Advanced impact modifiers', 'Chain extenders', 'Nucleating agents', 'Flow enhancers'],
      coloringAgents: 'Standard pigments with enhanced dispersion',
      specialFillers: ['Nano-scale impact modifiers', 'Crystallization promoters'],
    },
    familyContext: {
      parentPolymer: 'Evolution of PLA+ with improved formulation technology',
      variants: ['PLA+ 2.0', 'Hyper PLA', 'PLA Pro', 'PLA Ultra', 'PLA Max'],
      chemicalComparison: 'Similar base to PLA+ but with more sophisticated additive packages for better toughness and heat resistance.',
      evolution: 'Natural progression from basic PLA+ as manufacturers refined their formulations through customer feedback.',
    },
    strengths: {
      uniqueProperties: ['Superior toughness over original PLA+', 'Better layer adhesion', 'Improved heat resistance', 'Enhanced surface finish'],
      bestUseScenarios: ['Functional prototypes requiring durability', 'Parts that need both looks and strength', 'High-speed printing applications', 'Load-bearing decorative items'],
      advantagesOverCompetitors: ['Better impact resistance than first-gen PLA+', 'Often faster print speeds supported', 'Improved dimensional accuracy', 'Better bridging performance'],
      whyChooseThis: 'When you need the best PLA-based material for functional parts without the complexity of engineering materials.',
    },
    weaknesses: {
      limitations: ['Still limited by PLA heat resistance (~55-65°C)', 'More expensive than basic PLA', 'Not all "2.0" claims are equal', 'May require tuned settings'],
      commonProblems: ['Stringing if temperature too high', 'Some brands inconsistent between batches', 'Marketing hype may exceed performance'],
      environmentalConcerns: ['Less biodegradable than pure PLA due to additives', 'Recycling more complex'],
      whenNotToUse: ['High-temperature applications', 'When pure biodegradability is required', 'Outdoor UV exposure without coating'],
    },
    practicalContext: {
      industryAdoption: ['Consumer 3D printing', 'Small business prototyping', 'Education and makerspaces'],
      commonApplications: ['Functional prototypes', 'Tool handles', 'Snap-fit assemblies', 'Durable display items', 'High-speed test prints'],
      safetyStandards: ['Generally food-safe base material', 'Low emissions during printing'],
      costPosition: 'Standard',
    },
    trivia: {
      funFacts: [
        'The "2.0" designation is marketing - there is no industry standard',
        'Some PLA+ 2.0 can be printed at 300+ mm/s on high-speed printers',
        'Manufacturers guard their additive formulations as trade secrets',
        'The best PLA+ 2.0 rivals PETG in toughness while remaining easier to print',
      ],
      whyInvented: 'Consumer demand for stronger PLA that maintains ease of printing drove continuous formulation improvements.',
      controversies: ['Marketing claims vary widely between brands', 'No standardized testing for "2.0" designation', 'Some "upgrades" are minimal'],
      marketAdoption: 'Growing rapidly as default choice for users who want better-than-basic PLA performance.',
    },
    tdsProfile: {
      properties: [
        { name: 'Tensile Strength', value: '50-65', unit: 'MPa', implications: '10-20% improvement over standard PLA+.' },
        { name: 'Impact Strength (Charpy)', value: '8-15', unit: 'kJ/m²', implications: 'Significantly better than basic PLA.' },
        { name: 'Elongation at Break', value: '8-20', unit: '%', implications: 'More ductile than standard PLA.' },
        { name: 'Heat Deflection', value: '55-65', unit: '°C', implications: 'Modest improvement over standard PLA.' },
        { name: 'Flexural Modulus', value: '2500-3500', unit: 'MPa', implications: 'Slightly more flexible than rigid PLA.' },
      ],
      notes: 'Properties vary significantly between manufacturers. Best brands achieve near-PETG toughness.',
    },
    printSettings: {
      nozzleTemp: { min: 200, max: 230, optimal: 215 },
      bedTemp: { min: 50, max: 70, optimal: 60 },
      coolingFan: { min: 50, max: 100, notes: 'Lower cooling for better layer adhesion in structural parts.' },
      enclosure: { required: false, notes: 'Not needed but can improve consistency.' },
      drying: { temp: 50, duration: '4-6 hours', notes: 'Less critical than PETG but helps for best results.' },
      printSpeed: { recommended: '60-150 mm/s', notes: 'Many formulations support high-speed printing up to 300 mm/s.' },
      additionalNotes: [
        'Temperature often needs to be 5-15°C higher than basic PLA',
        'Slower first layer and lower fan for structural parts',
        'Retraction settings similar to standard PLA',
        'Test bridging - many 2.0 formulations bridge exceptionally well',
      ],
    },
    adhesion: {
      bedSurfaces: {
        excellent: ['PEI (smooth and textured)', 'Glass with glue stick', 'BuildTak'],
        good: ['Blue painters tape', 'Garolite', 'PP sheet with adhesive'],
        poor: ['Bare glass (depends on brand)', 'Unheated surfaces'],
      },
      releaseAgents: 'Usually releases cleanly from PEI when cooled.',
      multiMaterial: [
        { material: 'PLA', bondQuality: 'Strong Chemical Bond', notes: 'Excellent compatibility.' },
        { material: 'PLA+', bondQuality: 'Strong Chemical Bond', notes: 'Perfect compatibility.' },
        { material: 'PETG', bondQuality: 'Weak Bond', notes: 'Poor adhesion, not recommended.' },
        { material: 'TPU', bondQuality: 'Mechanical Bond', notes: 'Moderate adhesion for flexible parts.' },
      ],
    },
    postProcessing: {
      chemicalSmoothing: [{ method: 'None effective', effectiveness: 'Not Possible', notes: 'No effective chemical smoothing like basic PLA.' }],
      mechanical: ['Sanding (220-2000 grit)', 'Filling and priming', 'Wet sanding for gloss'],
      painting: 'Takes paint well, primer helps. Works with acrylic, enamel, and spray paint.',
      glues: ['CA glue (super glue)', 'Epoxy', 'Hot glue'],
    },
    safety: {
      fumes: { level: 'Very Low', notes: 'Low UFP and VOC emissions, similar to standard PLA.' },
      foodSafety: { rating: 'Generally Safe', notes: 'Base material generally food-safe, but additives may vary - check brand certifications.' },
      biodegradability: { rating: 'Industrial Compostable', notes: 'Less biodegradable than pure PLA due to additives.' },
      additionalNotes: [
        'Among the safest 3D printing materials',
        'No special ventilation typically required',
        'Check individual brand safety data sheets for additive information',
      ],
    },
  },

  'PLA-Basic': {
    name: 'PLA-Basic',
    fullName: 'Standard Polylactic Acid (Economy Grade)',
    origin: {
      yearInvented: '2000s (3D printing formulation)',
      originalCompany: 'Multiple manufacturers entering the market',
      keyMilestones: [
        '2007-2010: RepRap movement drives demand for affordable PLA',
        '2012-2015: Chinese manufacturers scale production dramatically',
        '2015-2018: "Economy" PLA becomes distinct market segment',
        '2020+: Basic PLA remains popular for cost-conscious users',
      ],
      majorManufacturers: ['SUNLU', 'JAYO', 'GIANTARM', 'Overture (economy line)', 'Amazon Basics'],
    },
    composition: {
      basePolymer: 'Polylactic Acid (standard grade)',
      chemicalFamily: 'Polyester (Bio-based)',
      keyAdditives: ['Minimal additives', 'Basic plasticizers', 'Standard stabilizers'],
      coloringAgents: 'Standard pigments, may affect consistency',
      specialFillers: ['None - pure PLA formulation'],
    },
    familyContext: {
      parentPolymer: 'Standard polylactic acid from fermented plant starch',
      variants: ['Economy PLA', 'Value PLA', 'Basic PLA', 'Budget PLA'],
      chemicalComparison: 'Same base chemistry as premium PLA but with less refined production and quality control.',
      evolution: 'Emerged as the entry-level option when premium PLA and PLA+ created price tiers.',
    },
    strengths: {
      uniqueProperties: ['Lowest cost per kg', 'Widely available', 'Easy to print', 'Good enough for many applications'],
      bestUseScenarios: ['Learning to 3D print', 'Test prints and calibration', 'Non-critical prototypes', 'High-volume decorative prints'],
      advantagesOverCompetitors: ['50-70% cheaper than premium brands', 'Abundant supply', 'Forgiving print settings'],
      whyChooseThis: 'When cost is the primary concern and parts do not need to be structural or precise.',
    },
    weaknesses: {
      limitations: ['Inconsistent diameter tolerance', 'Variable color matching between batches', 'Lower strength than PLA+', 'More stringing and oozing'],
      commonProblems: ['Moisture absorption from poor packaging', 'Brittle compared to quality PLA', 'Clogs from impurities', 'Poor spool winding'],
      environmentalConcerns: ['Often shipped with excessive plastic packaging', 'Quality control waste'],
      whenNotToUse: ['Functional parts', 'Dimensional precision needed', 'Professional or customer-facing work', 'Multi-day prints where clog risk matters'],
    },
    practicalContext: {
      industryAdoption: ['Hobbyist and beginner market', 'Education with budget constraints', 'High-volume low-value printing'],
      commonApplications: ['Learning projects', 'Test cubes and calibration', 'Decorative items', 'Disposable prototypes'],
      safetyStandards: ['Generally meets basic food safety', 'May have inconsistent material sources'],
      costPosition: 'Budget',
    },
    trivia: {
      funFacts: [
        'Basic PLA often comes from the same factories as premium brands with less QC',
        'Some budget brands have cult followings for specific colors that print well',
        'The 3D printing community has extensive lists of "good" budget filaments',
        'Diameter inconsistency is the main quality difference, not base material',
      ],
      whyInvented: 'Market demand for affordable filament as 3D printing became more accessible.',
      controversies: ['Quality varies dramatically between batches', 'Some brands lie about specifications', 'Rebranded filament from single sources'],
      marketAdoption: 'Dominates by volume in hobbyist segment, especially for beginners.',
    },
    tdsProfile: {
      properties: [
        { name: 'Tensile Strength', value: '35-50', unit: 'MPa', implications: 'Adequate for non-structural applications.' },
        { name: 'Elongation at Break', value: '2-6', unit: '%', implications: 'Brittle - will snap rather than bend.' },
        { name: 'Impact Strength', value: '2-4', unit: 'kJ/m²', implications: 'Low impact resistance, breaks easily.' },
        { name: 'Heat Deflection', value: '50-55', unit: '°C', implications: 'Standard PLA heat resistance.' },
        { name: 'Diameter Tolerance', value: '±0.05-0.10', unit: 'mm', implications: 'Wider tolerance than premium brands (±0.02).' },
      ],
      notes: 'Specifications often not tested or verified by manufacturer. Buyer beware.',
    },
    printSettings: {
      nozzleTemp: { min: 190, max: 220, optimal: 205 },
      bedTemp: { min: 50, max: 65, optimal: 55 },
      coolingFan: { min: 80, max: 100, notes: 'High cooling helps with inconsistent formulations.' },
      enclosure: { required: false, notes: 'Not needed.' },
      drying: { temp: 45, duration: '4-6 hours', notes: 'Often arrives wet - drying highly recommended.' },
      printSpeed: { recommended: '40-60 mm/s', notes: 'Slower speeds compensate for quality issues.' },
      additionalNotes: [
        'Dry the filament before use - budget brands often have poor moisture barriers',
        'Print a temperature tower to find optimal settings for each roll',
        'Keep spare rolls sealed with desiccant',
        'Expect some failed prints and clogs',
        'Wider nozzles (0.5-0.6mm) more forgiving of inconsistencies',
      ],
    },
    adhesion: {
      bedSurfaces: {
        excellent: ['Glass with glue stick', 'Blue painters tape'],
        good: ['PEI (may need glue)', 'BuildTak'],
        poor: ['Bare glass', 'Cold beds'],
      },
      releaseAgents: 'Glue stick recommended for consistent adhesion.',
      multiMaterial: [
        { material: 'PLA', bondQuality: 'Strong Chemical Bond', notes: 'Compatible with all PLA variants.' },
        { material: 'PLA+', bondQuality: 'Strong Chemical Bond', notes: 'Works fine together.' },
        { material: 'PETG', bondQuality: 'Weak Bond', notes: 'Does not bond well.' },
      ],
    },
    postProcessing: {
      chemicalSmoothing: [{ method: 'None effective', effectiveness: 'Not Possible', notes: 'No effective chemical smoothing.' }],
      mechanical: ['Sanding', 'Filling', 'Priming'],
      painting: 'Primer recommended due to surface inconsistency. Works with acrylic and spray paint.',
      glues: ['CA glue', 'Hot glue', 'Epoxy'],
    },
    safety: {
      fumes: { level: 'Very Low', notes: 'Low emissions, similar to standard PLA.' },
      foodSafety: { rating: 'Variable', notes: 'Material sources may not be certified.' },
      biodegradability: { rating: 'Industrial Compostable', notes: 'Standard recycling where available.' },
      additionalNotes: [
        'Generally safe material',
        'Check for certifications if food contact planned',
        'Some budget brands may have unknown additives',
      ],
    },
  },

  'PLA-Wood': {
    name: 'PLA-Wood',
    fullName: 'Wood Fiber Filled Polylactic Acid',
    origin: {
      yearInvented: '2012-2013',
      originalCompany: 'ColorFabb (woodFill), FormFutura (EasyWood)',
      keyMilestones: [
        '2012: ColorFabb introduces woodFill - first popular wood PLA',
        '2013: Multiple brands develop competing wood filaments',
        '2015: Temperature-based color variation technique popularized',
        '2018+: Wide variety of wood types available (bamboo, cork, coconut)',
      ],
      majorManufacturers: ['ColorFabb', 'FormFutura', 'Polymaker', 'Hatchbox', 'SUNLU', '3D-Fuel (Buzzed/Wound Up)'],
    },
    composition: {
      basePolymer: 'Polylactic Acid',
      chemicalFamily: 'Polyester (Bio-based) with natural fiber filler',
      keyAdditives: ['Wood fiber/flour (15-40%)', 'Binding agents', 'Anti-clogging additives'],
      coloringAgents: 'Often uncolored to show natural wood tones, or tinted',
      specialFillers: ['Pine wood', 'Bamboo', 'Cork', 'Coconut', 'Cherry', 'Ebony', 'Olive wood'],
    },
    familyContext: {
      parentPolymer: 'PLA with wood fiber composite',
      variants: ['Pine wood', 'Bamboo', 'Cork fill', 'Coconut', 'Cherry wood', 'Ebony', 'Olive', 'Recycled wood'],
      chemicalComparison: 'PLA matrix with 15-40% wood particles by weight, creating wood-like aesthetic and texture.',
      evolution: 'From novelty material to established category with multiple wood species available.',
    },
    strengths: {
      uniqueProperties: ['Authentic wood appearance', 'Can be stained and finished like real wood', 'Temperature-based color variation', 'Pleasant wood smell when printing', 'Matte natural finish'],
      bestUseScenarios: ['Decorative items', 'Furniture models and accents', 'Picture frames', 'Artistic sculptures', 'Nature-themed projects'],
      advantagesOverCompetitors: ['Looks and feels like wood', 'Can sand and stain', 'Creates unique wood-grain patterns', 'More sustainable aesthetic'],
      whyChooseThis: 'When you want the appearance and feel of real wood with 3D printing design freedom.',
    },
    weaknesses: {
      limitations: ['Weaker than standard PLA', 'Abrasive to brass nozzles', 'Clogs easily', 'Moisture sensitive', 'Limited structural applications'],
      commonProblems: ['Nozzle clogging from wood particles', 'Inconsistent extrusion', 'Stringing', 'Layer adhesion issues at high wood content'],
      environmentalConcerns: ['Not easily recyclable due to composite nature', 'Wood fiber sourcing varies'],
      whenNotToUse: ['Structural parts', 'Mechanical applications', 'Fine detail prints', 'Small nozzles (<0.5mm)'],
    },
    practicalContext: {
      industryAdoption: ['Art and design', 'Architecture models', 'Craft and hobby', 'Home decor'],
      commonApplications: ['Decorative boxes', 'Planters', 'Picture frames', 'Furniture accents', 'Sculptures', 'Musical instrument parts'],
      safetyStandards: ['Generally safe', 'Natural fiber content'],
      costPosition: 'Premium',
    },
    trivia: {
      funFacts: [
        'Higher temperatures create darker "burnt wood" appearance',
        'Some users sand and stain prints to look like antique wood',
        'Cork-filled variants are naturally buoyant',
        '3D-Fuel\'s Buzzed is made from actual brewery waste (spent grain)',
        'You can create "wood grain" by varying temperature during print',
      ],
      whyInvented: 'Combine the organic aesthetics of wood with the design freedom of 3D printing.',
      controversies: ['High wood content = more clogs', 'Some brands use sawdust while others use quality wood flour'],
      marketAdoption: 'Popular niche material for decorative and artistic applications.',
    },
    tdsProfile: {
      properties: [
        { name: 'Tensile Strength', value: '25-40', unit: 'MPa', implications: 'Weaker than pure PLA due to fiber content.' },
        { name: 'Elongation at Break', value: '2-4', unit: '%', implications: 'Brittle - similar to actual wood.' },
        { name: 'Wood Content', value: '15-40', unit: '%', implications: 'Higher content = more wood-like but harder to print.' },
        { name: 'Impact Strength', value: '2-3', unit: 'kJ/m²', implications: 'Low - will crack like wood.' },
        { name: 'Heat Deflection', value: '50-55', unit: '°C', implications: 'Standard PLA heat resistance.' },
      ],
      notes: 'Properties vary based on wood content and fiber type. Higher wood content decreases strength.',
    },
    printSettings: {
      nozzleTemp: { min: 190, max: 230, optimal: 210 },
      bedTemp: { min: 50, max: 70, optimal: 60 },
      coolingFan: { min: 50, max: 100, notes: 'Moderate cooling prevents too much color variation.' },
      enclosure: { required: false, notes: 'Not needed.' },
      drying: { temp: 45, duration: '6-8 hours', notes: 'Wood fibers absorb moisture - drying important.' },
      printSpeed: { recommended: '30-50 mm/s', notes: 'Slower speeds reduce clogging risk.' },
      additionalNotes: [
        'USE 0.5mm OR LARGER NOZZLE - wood particles clog smaller nozzles',
        'Hardened steel nozzle recommended - wood is abrasive',
        'Vary temperature 5-10°C during print to create wood grain effect',
        'Retraction should be minimal to prevent clogs',
        'Clean nozzle frequently during long prints',
        'Post-print sanding reveals more wood texture',
      ],
    },
    adhesion: {
      bedSurfaces: {
        excellent: ['Glass with glue stick', 'Blue painters tape'],
        good: ['PEI with glue', 'BuildTak'],
        poor: ['Bare PEI - may bond too well'],
      },
      releaseAgents: 'Glue stick helps with release.',
      multiMaterial: [
        { material: 'PLA', bondQuality: 'Mechanical Bond', notes: 'Bonds adequately, not as strong as PLA-PLA.' },
        { material: 'PVA', bondQuality: 'Weak Bond', notes: 'Can work for supports but challenging.' },
      ],
    },
    postProcessing: {
      chemicalSmoothing: [{ method: 'None available', effectiveness: 'Not Possible', notes: 'No chemical smoothing available.' }],
      mechanical: ['Sanding (reveals wood texture)', 'Wire brushing for texture', 'Filling for smooth finish'],
      painting: 'Can be stained like real wood! Works with wood stain, wood finish, and acrylic.',
      glues: ['Wood glue', 'CA glue', 'Epoxy'],
    },
    safety: {
      fumes: { level: 'Low', notes: 'Low emissions plus wood particles - slight wood burning smell.' },
      foodSafety: { rating: 'Not Recommended', notes: 'Porous surface from wood fibers.' },
      biodegradability: { rating: 'Technically Compostable', notes: 'Difficult to recycle due to composite nature.' },
      additionalNotes: [
        'Pleasant wood smell during printing',
        'Ventilation recommended for prolonged printing',
        'Not food safe due to porous texture',
      ],
    },
  },

  'PLA-Stone': {
    name: 'PLA-Stone',
    fullName: 'Stone/Mineral Filled Polylactic Acid',
    origin: {
      yearInvented: '2014-2015',
      originalCompany: 'FormFutura (StoneFil), ColorFabb',
      keyMilestones: [
        '2014: First stone-filled PLA filaments introduced',
        '2015: Multiple stone variants emerge (granite, marble, sandstone)',
        '2017: Concrete and cement-look filaments added',
        '2020+: Established category with many manufacturers',
      ],
      majorManufacturers: ['FormFutura', 'ColorFabb', 'Polymaker', 'Eryone', 'SUNLU', 'Ziro'],
    },
    composition: {
      basePolymer: 'Polylactic Acid',
      chemicalFamily: 'Polyester (Bio-based) with mineral filler',
      keyAdditives: ['Stone powder/ite (20-50%)', 'Mineral particles', 'Binding agents'],
      coloringAgents: 'Often pigmented to match specific stone types',
      specialFillers: ['Calcium carbite (marble)', 'Granite particles', 'Sandstone', 'Chalk', 'Ceramic powder'],
    },
    familyContext: {
      parentPolymer: 'PLA with mineral composite filler',
      variants: ['Marble', 'Granite', 'Sandstone', 'Concrete', 'Terracotta', 'Chalk', 'Ceramic'],
      chemicalComparison: 'PLA matrix filled with 20-50% mineral particles by weight, creating stone-like appearance and weight.',
      evolution: 'From aesthetic novelty to practical use in architectural models and decorative applications.',
    },
    strengths: {
      uniqueProperties: ['Heavy - feels like real stone', 'Authentic stone appearance', 'Matte textured finish', 'Temperature stable appearance', 'Can be polished'],
      bestUseScenarios: ['Architectural models', 'Sculptures and statues', 'Decorative planters', 'Trophy bases', 'Bookends and desk accessories'],
      advantagesOverCompetitors: ['Weight gives premium feel', 'Looks like carved stone', 'More scratch resistant than plain PLA', 'Hides layer lines well'],
      whyChooseThis: 'When you want printed objects to look and feel like carved stone.',
    },
    weaknesses: {
      limitations: ['Very abrasive - destroys brass nozzles', 'Heavy weight increases printing challenges', 'Brittle and can chip', 'Clogs easily', 'Limited color options'],
      commonProblems: ['Rapid nozzle wear', 'Clogging from mineral particles', 'Bridging difficulties due to weight', 'Adhesion challenges'],
      environmentalConcerns: ['Not recyclable due to mineral content', 'Mineral extraction impact'],
      whenNotToUse: ['Structural parts', 'Moving components', 'Overhangs and bridges', 'Detailed fine prints'],
    },
    practicalContext: {
      industryAdoption: ['Architecture and design', 'Art and sculpture', 'Prop making', 'Interior design'],
      commonApplications: ['Architectural scale models', 'Decorative sculptures', 'Planters and vases', 'Bookends', 'Display bases', 'Memorial items'],
      safetyStandards: ['Non-toxic mineral fillers', 'Generally safe'],
      costPosition: 'Premium',
    },
    trivia: {
      funFacts: [
        'Stone PLA prints can be 2-3x heavier than regular PLA prints',
        'The weight makes objects feel "premium" and substantial',
        'Some users wet-sand stone PLA to a polished stone finish',
        'Marble variant with veining is created by dual-color extrusion',
        'The density can cause prints to sink in water unlike standard PLA',
      ],
      whyInvented: 'Enable 3D printed objects that have the visual and tactile qualities of carved stone.',
      controversies: ['Extreme nozzle wear if wrong nozzle used', 'Some "stone" filaments are just colored PLA'],
      marketAdoption: 'Popular niche for architectural visualization and artistic applications.',
    },
    tdsProfile: {
      properties: [
        { name: 'Tensile Strength', value: '20-35', unit: 'MPa', implications: 'Weaker than pure PLA due to high filler content.' },
        { name: 'Density', value: '1.5-2.0', unit: 'g/cm³', implications: 'Significantly heavier than standard PLA (1.24).' },
        { name: 'Mineral Content', value: '20-50', unit: '%', implications: 'Higher content = more stone-like but harder to print.' },
        { name: 'Impact Strength', value: '1-3', unit: 'kJ/m²', implications: 'Brittle - can chip like real stone.' },
        { name: 'Surface Hardness', value: 'Higher than PLA', unit: '', implications: 'More scratch resistant than standard PLA.' },
      ],
      notes: 'Very abrasive - hardened nozzle REQUIRED. Properties vary with mineral content and type.',
    },
    printSettings: {
      nozzleTemp: { min: 195, max: 230, optimal: 215 },
      bedTemp: { min: 50, max: 70, optimal: 60 },
      coolingFan: { min: 50, max: 100, notes: 'Standard PLA cooling works.' },
      enclosure: { required: false, notes: 'Not needed.' },
      drying: { temp: 45, duration: '4-6 hours', notes: 'Minerals less hygroscopic but PLA base absorbs moisture.' },
      printSpeed: { recommended: '25-45 mm/s', notes: 'Slow speeds essential to prevent clogging and improve layer adhesion.' },
      additionalNotes: [
        'HARDENED STEEL NOZZLE MANDATORY - will destroy brass in hours',
        'Use 0.5mm or larger nozzle to prevent clogging',
        'Reduce retraction to minimum to prevent clogs',
        'Print with extra perimeters for strength',
        'Support weight considerations - large prints may need internal structure',
        'First layer adhesion critical due to weight',
      ],
    },
    adhesion: {
      bedSurfaces: {
        excellent: ['Glass with glue stick', 'Blue painters tape'],
        good: ['PEI with adhesive', 'BuildTak'],
        poor: ['Bare PEI - adhesion issues', 'Cold beds'],
      },
      releaseAgents: 'Glue stick recommended for reliable adhesion.',
      multiMaterial: [
        { material: 'PLA', bondQuality: 'Mechanical Bond', notes: 'Bonds adequately for decorative purposes.' },
        { material: 'PVA', bondQuality: 'Weak Bond', notes: 'Challenging - weight makes supports difficult.' },
      ],
    },
    postProcessing: {
      chemicalSmoothing: [{ method: 'None available', effectiveness: 'Not Possible', notes: 'No chemical smoothing available.' }],
      mechanical: ['Sanding (wet sanding for polish)', 'Polishing compounds', 'Wax finish'],
      painting: 'Often left natural or sealed. Works with acrylic, stone sealers, and wax.',
      glues: ['Epoxy (best)', 'CA glue', 'Stone adhesive'],
    },
    safety: {
      fumes: { level: 'Low', notes: 'Low emissions - mineral particles are inert.' },
      foodSafety: { rating: 'Not Recommended', notes: 'Porous surface from mineral particles.' },
      biodegradability: { rating: 'Not Recyclable', notes: 'Landfill disposal required.' },
      additionalNotes: [
        'Wear dust mask when sanding',
        'Ventilation recommended during printing',
        'Inert minerals are generally non-toxic',
        'Not suitable for food contact',
      ],
    },
  },

  'PLA-Galaxy': {
    name: 'PLA-Galaxy',
    fullName: 'Glitter/Sparkle Effect Polylactic Acid',
    origin: {
      yearInvented: '2015-2016',
      originalCompany: 'Multiple manufacturers (Fillamentum, Proto-Pasta)',
      keyMilestones: [
        '2015: First glitter/sparkle PLA filaments introduced',
        '2016: "Galaxy" naming becomes popular for multi-color glitter variants',
        '2018: Wide variety of color combinations available',
        '2020+: Established category with premium and budget options',
      ],
      majorManufacturers: ['Fillamentum', 'Proto-Pasta', 'Eryone', 'SUNLU', 'Ziro', 'Polymaker'],
    },
    composition: {
      basePolymer: 'Polylactic Acid',
      chemicalFamily: 'Polyester (Bio-based) with metallic/glitter additives',
      keyAdditives: ['Metallic flakes', 'Glitter particles', 'Mica powder', 'Light-reflecting additives'],
      coloringAgents: 'Multiple pigments combined with reflective particles',
      specialFillers: ['Aluminum flakes', 'Mica', 'Holographic particles', 'Multi-colored glitter'],
    },
    familyContext: {
      parentPolymer: 'PLA with decorative metallic/glitter additives',
      variants: ['Galaxy', 'Stardust', 'Nebula', 'Cosmic', 'Glitter', 'Sparkle', 'Sequins'],
      chemicalComparison: 'Standard PLA matrix with suspended reflective particles that catch light.',
      evolution: 'From simple single-color glitter to complex multi-hue galaxy effects.',
    },
    strengths: {
      uniqueProperties: ['Stunning visual effects', 'Hides layer lines', 'Light-catching sparkle', 'Unique every print', 'Premium appearance'],
      bestUseScenarios: ['Decorative items', 'Jewelry and accessories', 'Display pieces', 'Gifts', 'Cosplay props'],
      advantagesOverCompetitors: ['Eye-catching finish impossible to replicate', 'No post-processing needed', 'Consistent sparkle throughout'],
      whyChooseThis: 'When you want prints that sparkle and catch light with a cosmic, magical appearance.',
    },
    weaknesses: {
      limitations: ['Slightly abrasive to brass nozzles over time', 'May clog fine nozzles', 'Not for precision parts', 'Higher cost'],
      commonProblems: ['Inconsistent glitter distribution in some brands', 'Can scratch softer surfaces', 'Stringing shows sparkle'],
      environmentalConcerns: ['Glitter particles may be microplastics', 'Not easily recyclable'],
      whenNotToUse: ['Functional parts', 'Parts requiring smooth surface', 'Food contact', 'Very fine details'],
    },
    practicalContext: {
      industryAdoption: ['Hobby and craft', 'Gift items', 'Cosplay', 'Art projects'],
      commonApplications: ['Decorative vases', 'Jewelry', 'Phone cases', 'Holiday decorations', 'D&D dice towers'],
      safetyStandards: ['Generally safe', 'Not food safe due to particles'],
      costPosition: 'Premium',
    },
    trivia: {
      funFacts: [
        'The "galaxy" effect comes from multiple glitter colors suspended at different depths',
        'Some brands use biodegradable glitter made from plant cellulose',
        'Photographing galaxy prints is challenging - they look better in person',
        'The sparkle effect is more visible in natural lighting',
      ],
      whyInvented: 'To create magical, eye-catching prints that stand out from solid colors.',
      controversies: ['Traditional glitter is plastic microparticles', 'Some eco-conscious brands switching to bio-glitter'],
      marketAdoption: 'Popular niche for decorative and gift applications.',
    },
    tdsProfile: {
      properties: [
        { name: 'Tensile Strength', value: '40-50', unit: 'MPa', implications: 'Slightly lower than pure PLA due to additives.' },
        { name: 'Elongation at Break', value: '3-6', unit: '%', implications: 'Standard PLA brittleness.' },
        { name: 'Particle Content', value: '2-8', unit: '%', implications: 'Enough for visual effect without major property changes.' },
        { name: 'Heat Deflection', value: '50-55', unit: '°C', implications: 'Standard PLA heat resistance.' },
        { name: 'Surface Finish', value: 'Sparkle/Matte', unit: '', implications: 'Unique light-catching surface.' },
      ],
      notes: 'Properties similar to standard PLA with added visual effects.',
    },
    printSettings: {
      nozzleTemp: { min: 195, max: 220, optimal: 210 },
      bedTemp: { min: 50, max: 65, optimal: 60 },
      coolingFan: { min: 80, max: 100, notes: 'Standard PLA cooling.' },
      enclosure: { required: false, notes: 'Not needed.' },
      drying: { temp: 45, duration: '4-6 hours', notes: 'Standard PLA drying.' },
      printSpeed: { recommended: '40-60 mm/s', notes: 'Standard speeds work well.' },
      additionalNotes: [
        'Use 0.4mm or larger nozzle to prevent clogging from particles',
        'Hardened steel nozzle recommended for heavy use',
        'Retraction settings similar to standard PLA',
        'Thicker layers (0.2-0.3mm) show sparkle better than fine layers',
      ],
    },
    adhesion: {
      bedSurfaces: {
        excellent: ['PEI', 'Glass with glue stick'],
        good: ['Blue painters tape', 'BuildTak'],
        poor: ['Bare glass'],
      },
      releaseAgents: 'Standard PLA release methods work.',
      multiMaterial: [
        { material: 'PLA', bondQuality: 'Strong Chemical Bond', notes: 'Good compatibility.' },
        { material: 'PLA+', bondQuality: 'Strong Chemical Bond', notes: 'Works well together.' },
      ],
    },
    postProcessing: {
      chemicalSmoothing: [{ method: 'None effective', effectiveness: 'Not Possible', notes: 'Would damage sparkle effect.' }],
      mechanical: ['Light sanding only', 'Avoid polishing - removes sparkle'],
      painting: 'Not recommended - covers the sparkle effect. Clear coat can enhance.',
      glues: ['CA glue', 'Epoxy', 'Hot glue'],
    },
    safety: {
      fumes: { level: 'Very Low', notes: 'Standard PLA emissions.' },
      foodSafety: { rating: 'Not Recommended', notes: 'Glitter particles not food safe.' },
      biodegradability: { rating: 'Partially Compostable', notes: 'PLA base compostable, glitter may not be.' },
      additionalNotes: [
        'Generally safe to print',
        'Avoid inhaling dust when sanding',
        'Not suitable for food contact',
      ],
    },
  },

  'PLA-Conductive': {
    name: 'PLA-Conductive',
    fullName: 'Electrically Conductive Polylactic Acid',
    origin: {
      yearInvented: '2012-2014',
      originalCompany: 'Proto-Pasta (Conductive PLA)',
      keyMilestones: [
        '2012: First conductive filaments experimented with',
        '2014: Proto-Pasta launches commercial Conductive PLA',
        '2016: Multiple manufacturers enter conductive filament market',
        '2020+: Improved formulations with better conductivity',
      ],
      majorManufacturers: ['Proto-Pasta', 'Black Magic 3D', 'Recreus', 'Multi3D', 'Amolen'],
    },
    composition: {
      basePolymer: 'Polylactic Acid',
      chemicalFamily: 'Polyester (Bio-based) with conductive carbon filler',
      keyAdditives: ['Carbon black', 'Graphite', 'Carbon nanotubes (premium)', 'Conductive carbon fiber'],
      coloringAgents: 'Naturally black/dark gray from carbon content',
      specialFillers: ['Carbon black (15-25%)', 'Graphite powder', 'Carbon fiber'],
    },
    familyContext: {
      parentPolymer: 'PLA loaded with conductive carbon particles',
      variants: ['Carbon Black Conductive', 'Graphite Conductive', 'Carbon Fiber Conductive'],
      chemicalComparison: 'Standard PLA with percolating network of conductive carbon particles.',
      evolution: 'From experimental to functional prototyping material for electronics.',
    },
    strengths: {
      uniqueProperties: ['Electrical conductivity', 'EMI shielding', 'Static dissipation', 'Easy to print electronics'],
      bestUseScenarios: ['Touch sensors', 'Low-voltage circuits', 'EMI shielding enclosures', 'Capacitive buttons', 'Educational electronics'],
      advantagesOverCompetitors: ['Print circuits directly', 'No post-processing for conductivity', 'Combine with regular PLA'],
      whyChooseThis: 'When you need to print functional electronic components or conductive traces.',
    },
    weaknesses: {
      limitations: ['High resistance (not a wire replacement)', 'Abrasive to nozzles', 'Brittle', 'Limited to low-power applications', 'Only black/dark colors'],
      commonProblems: ['Nozzle wear', 'Layer adhesion issues', 'Inconsistent conductivity between prints', 'Requires good contact points'],
      environmentalConcerns: ['Carbon particles not biodegradable', 'Difficult to recycle'],
      whenNotToUse: ['High-current applications', 'Replacement for actual wires', 'When low resistance needed', 'Precision circuitry'],
    },
    practicalContext: {
      industryAdoption: ['Education', 'Prototyping', 'Maker community', 'Research'],
      commonApplications: ['Touch sensors', 'Capacitive interfaces', 'EMI shields', 'Static dissipation', 'Educational circuits'],
      safetyStandards: ['Low voltage only', 'Not for mains power'],
      costPosition: 'Premium',
    },
    trivia: {
      funFacts: [
        'Resistance varies with layer orientation - perpendicular layers have higher resistance',
        'You can print working piano keyboards and touch interfaces',
        'The carbon creates a "percolation network" for electron flow',
        'Thicker traces = lower resistance (just like real wires)',
      ],
      whyInvented: 'Enable 3D printed electronics and interactive objects without assembly.',
      controversies: ['Conductivity varies greatly between brands', 'Marketing sometimes overstates capabilities'],
      marketAdoption: 'Niche but growing for education and prototyping applications.',
    },
    tdsProfile: {
      properties: [
        { name: 'Volume Resistivity', value: '15-100', unit: 'Ohm·cm', implications: 'Conductive but high resistance compared to metals.' },
        { name: 'Tensile Strength', value: '25-35', unit: 'MPa', implications: 'Reduced by carbon content.' },
        { name: 'Carbon Content', value: '15-25', unit: '%', implications: 'Higher = more conductive but harder to print.' },
        { name: 'Elongation at Break', value: '1-3', unit: '%', implications: 'Very brittle material.' },
        { name: 'Heat Deflection', value: '50-55', unit: '°C', implications: 'Standard PLA heat limits.' },
      ],
      notes: 'Conductivity depends on print orientation, layer height, and infill. Test resistance for your application.',
    },
    printSettings: {
      nozzleTemp: { min: 210, max: 240, optimal: 225 },
      bedTemp: { min: 50, max: 70, optimal: 60 },
      coolingFan: { min: 30, max: 80, notes: 'Lower cooling improves layer bonding and conductivity.' },
      enclosure: { required: false, notes: 'Not needed but can improve consistency.' },
      drying: { temp: 50, duration: '4-6 hours', notes: 'Moisture affects print quality.' },
      printSpeed: { recommended: '30-50 mm/s', notes: 'Slower speeds improve layer adhesion and conductivity.' },
      additionalNotes: [
        'HARDENED STEEL NOZZLE REQUIRED - carbon is very abrasive',
        'Use 0.5mm or larger nozzle',
        'Lower layer heights improve conductivity (more contact area)',
        '100% infill for conductive paths',
        'Print conductive traces along layer lines, not across them',
        'Test resistance with multimeter before use',
      ],
    },
    adhesion: {
      bedSurfaces: {
        excellent: ['Glass with glue stick', 'Blue painters tape'],
        good: ['PEI with glue', 'BuildTak'],
        poor: ['Bare PEI - adhesion issues'],
      },
      releaseAgents: 'Glue stick recommended.',
      multiMaterial: [
        { material: 'PLA', bondQuality: 'Mechanical Bond', notes: 'Good for insulator/conductor combinations.' },
        { material: 'PLA+', bondQuality: 'Mechanical Bond', notes: 'Works for dual-material prints.' },
      ],
    },
    postProcessing: {
      chemicalSmoothing: [{ method: 'None', effectiveness: 'Not Possible', notes: 'Would damage conductive properties.' }],
      mechanical: ['Light sanding only', 'Avoid contaminating conductive surfaces'],
      painting: 'Not recommended on conductive areas. Insulator areas can be painted.',
      glues: ['Conductive epoxy for joints', 'CA glue for structure', 'Silver paint for contact points'],
    },
    safety: {
      fumes: { level: 'Low', notes: 'Carbon particles may become airborne - ventilate.' },
      foodSafety: { rating: 'Not Safe', notes: 'Carbon particles not food safe.' },
      biodegradability: { rating: 'Not Compostable', notes: 'Carbon content prevents biodegradation.' },
      additionalNotes: [
        'Ventilation recommended during printing',
        'Wear dust mask when sanding',
        'Low voltage applications only',
        'Not a replacement for proper electrical wiring',
      ],
    },
  },

  'PLA-Blend': {
    name: 'PLA-Blend',
    fullName: 'Polylactic Acid Polymer Blend',
    origin: {
      yearInvented: '2015-2017',
      originalCompany: 'Various manufacturers developing proprietary blends',
      keyMilestones: [
        '2015: First PLA blends with other polymers commercialized',
        '2017: PLA/PETG and PLA/TPU blends emerge',
        '2019: Advanced multi-polymer PLA blends for specific properties',
        '2022+: Sophisticated blend formulations for industrial use',
      ],
      majorManufacturers: ['ColorFabb', 'Polymaker', '3DXTech', 'Fillamentum', 'AddNorth'],
    },
    composition: {
      basePolymer: 'Polylactic Acid blended with other polymers',
      chemicalFamily: 'Polyester blend (multi-polymer system)',
      keyAdditives: ['Compatibilizers', 'Impact modifiers', 'Processing aids'],
      coloringAgents: 'Standard pigments compatible with blend',
      specialFillers: ['Varies by specific blend formulation'],
    },
    familyContext: {
      parentPolymer: 'PLA combined with secondary polymers (PETG, TPU, PC, etc.)',
      variants: ['PLA/PETG', 'PLA/TPU', 'PLA/PC', 'PLA/PBS', 'PLA/PBAT'],
      chemicalComparison: 'Combines PLA ease of printing with properties of secondary polymer.',
      evolution: 'Engineered to overcome specific PLA limitations while maintaining printability.',
    },
    strengths: {
      uniqueProperties: ['Combines best of multiple materials', 'Improved toughness over pure PLA', 'Better flexibility options', 'Tailored properties'],
      bestUseScenarios: ['When pure PLA is too brittle', 'Need flexibility without full TPU', 'Want heat resistance with easy printing', 'Transitioning from PLA to engineering materials'],
      advantagesOverCompetitors: ['Easier than printing pure engineering materials', 'More forgiving than PETG/ABS', 'Targeted property improvements'],
      whyChooseThis: 'When you need specific properties beyond standard PLA but want similar ease of printing.',
    },
    weaknesses: {
      limitations: ['Jack of all trades, master of none', 'Properties vary by blend', 'May not match pure material performance', 'Higher cost'],
      commonProblems: ['Settings vary between blend types', 'Some blends separate over time', 'Inconsistent batch-to-batch'],
      environmentalConcerns: ['Difficult to recycle mixed polymers', 'May not be compostable'],
      whenNotToUse: ['When pure material properties are required', 'Recycling is important', 'Extreme environments'],
    },
    practicalContext: {
      industryAdoption: ['Prototyping', 'Consumer products', 'Transitional use for learning'],
      commonApplications: ['Flexible parts with structure', 'Impact-resistant prototypes', 'Functional models'],
      safetyStandards: ['Varies by blend composition'],
      costPosition: 'Standard',
    },
    trivia: {
      funFacts: [
        'Some blends are "self-compatibilized" and mix at molecular level',
        'PLA/PETG blends can be surprisingly easy to print',
        'The ratio of polymers determines final properties',
        'Some blends were discovered accidentally during recycling experiments',
      ],
      whyInvented: 'To bridge the gap between easy-to-print PLA and high-performance materials.',
      controversies: ['Marketing claims often exaggerate property improvements', 'Some "blends" are barely different from base PLA'],
      marketAdoption: 'Growing category as formulation technology improves.',
    },
    tdsProfile: {
      properties: [
        { name: 'Tensile Strength', value: '35-55', unit: 'MPa', implications: 'Varies widely by blend ratio.' },
        { name: 'Impact Strength', value: '4-15', unit: 'kJ/m²', implications: 'Can be significantly improved over pure PLA.' },
        { name: 'Elongation at Break', value: '5-50', unit: '%', implications: 'Depends on secondary polymer (high with TPU blend).' },
        { name: 'Heat Deflection', value: '50-70', unit: '°C', implications: 'Can be improved with PC or PETG blend.' },
        { name: 'Flexibility', value: 'Variable', unit: '', implications: 'From rigid to semi-flexible depending on blend.' },
      ],
      notes: 'Properties highly dependent on specific blend. Check manufacturer specifications.',
    },
    printSettings: {
      nozzleTemp: { min: 200, max: 250, optimal: 220 },
      bedTemp: { min: 50, max: 80, optimal: 65 },
      coolingFan: { min: 30, max: 100, notes: 'Varies by blend - check manufacturer recommendations.' },
      enclosure: { required: false, notes: 'May help with some blends.' },
      drying: { temp: 50, duration: '4-8 hours', notes: 'Most blends benefit from drying.' },
      printSpeed: { recommended: '40-70 mm/s', notes: 'Depends on specific blend.' },
      additionalNotes: [
        'Follow manufacturer guidelines - each blend is different',
        'Start with settings between the two base materials',
        'Test adhesion and layer bonding carefully',
        'Some blends require specific bed surfaces',
      ],
    },
    adhesion: {
      bedSurfaces: {
        excellent: ['Depends on blend'],
        good: ['PEI', 'Glass with adhesive'],
        poor: ['Varies'],
      },
      releaseAgents: 'Depends on dominant polymer in blend.',
      multiMaterial: [
        { material: 'PLA', bondQuality: 'Strong Chemical Bond', notes: 'Usually good due to PLA content.' },
        { material: 'Secondary polymer', bondQuality: 'Strong Chemical Bond', notes: 'Often bonds well to its secondary component.' },
      ],
    },
    postProcessing: {
      chemicalSmoothing: [{ method: 'Varies', effectiveness: 'Difficult', notes: 'Depends on blend composition.' }],
      mechanical: ['Sanding', 'Filling', 'Priming'],
      painting: 'Usually takes paint well like standard PLA.',
      glues: ['CA glue', 'Epoxy', 'Hot glue'],
    },
    safety: {
      fumes: { level: 'Low', notes: 'Generally similar to PLA, check specific blend.' },
      foodSafety: { rating: 'Not Certified', notes: 'Blends typically not food safe certified.' },
      biodegradability: { rating: 'Variable', notes: 'Depends on secondary polymer - often not compostable.' },
      additionalNotes: [
        'Check manufacturer safety data for specific blend',
        'Generally safe like PLA',
        'Some blends may have higher emissions',
      ],
    },
  },

  'PLA/PHA': {
    name: 'PLA/PHA',
    fullName: 'Polylactic Acid / Polyhydroxyalkanoate Blend',
    origin: {
      yearInvented: '2014-2015',
      originalCompany: 'ColorFabb (NGEN, PLA/PHA series)',
      keyMilestones: [
        '2014: ColorFabb introduces PLA/PHA blend',
        '2015: Multiple manufacturers adopt PHA blending',
        '2018: Improved formulations with better layer adhesion',
        '2020+: Growing interest due to full biodegradability',
      ],
      majorManufacturers: ['ColorFabb', 'FormFutura', 'Fillamentum', '3D-Fuel'],
    },
    composition: {
      basePolymer: 'Polylactic Acid blended with Polyhydroxyalkanoate',
      chemicalFamily: 'Bio-polyester blend (fully bio-based)',
      keyAdditives: ['Compatibilizers', 'Processing aids', 'Nucleating agents'],
      coloringAgents: 'Bio-compatible pigments',
      specialFillers: ['None typically - focuses on pure biopolymer blend'],
    },
    familyContext: {
      parentPolymer: 'PLA combined with PHA (both from bacterial fermentation)',
      variants: ['PLA/PHA', 'PLA/PHBV', 'PLA/PHB'],
      chemicalComparison: 'Both polymers are bio-based and biodegradable, creating a fully green material.',
      evolution: 'Developed to improve PLA toughness while maintaining 100% biodegradability.',
    },
    strengths: {
      uniqueProperties: ['100% bio-based', 'Fully biodegradable', 'Improved toughness over pure PLA', 'Better layer adhesion', 'Lower brittleness'],
      bestUseScenarios: ['Eco-conscious projects', 'Marine-degradable applications', 'Packaging prototypes', 'When biodegradability is critical'],
      advantagesOverCompetitors: ['More flexible than pure PLA', 'Biodegrades in more environments', 'Glossy finish', 'Excellent layer bonding'],
      whyChooseThis: 'When you want improved mechanical properties AND full biodegradability.',
    },
    weaknesses: {
      limitations: ['Lower heat resistance than PLA', 'More expensive', 'Limited color availability', 'Slightly different print settings'],
      commonProblems: ['More sensitive to moisture', 'Can be stringy', 'Slower crystallization'],
      environmentalConcerns: ['None - this is the eco-friendly option'],
      whenNotToUse: ['High-temperature applications', 'When cost is primary concern', 'Outdoor UV exposure'],
    },
    practicalContext: {
      industryAdoption: ['Sustainable packaging', 'Eco-conscious brands', 'Research institutions'],
      commonApplications: ['Prototypes for biodegradable products', 'Temporary items', 'Garden markers', 'Eco-packaging models'],
      safetyStandards: ['Often food contact safe', 'Compostable certifications available'],
      costPosition: 'Premium',
    },
    trivia: {
      funFacts: [
        'PHA is produced by bacteria fed with plant sugars',
        'The blend can biodegrade in marine environments (unlike pure PLA)',
        'Some PHA variants are produced from waste cooking oil',
        'ColorFabb was a pioneer in making PHA blends printable',
      ],
      whyInvented: 'Combine PLA printability with PHA flexibility and enhanced biodegradability.',
      controversies: ['PHA production is still expensive', 'Biodegradation rates vary by environment'],
      marketAdoption: 'Growing as sustainability becomes more important.',
    },
    tdsProfile: {
      properties: [
        { name: 'Tensile Strength', value: '40-50', unit: 'MPa', implications: 'Similar to standard PLA.' },
        { name: 'Elongation at Break', value: '6-15', unit: '%', implications: 'More ductile than pure PLA.' },
        { name: 'Impact Strength', value: '5-8', unit: 'kJ/m²', implications: 'Improved over brittle PLA.' },
        { name: 'Heat Deflection', value: '45-52', unit: '°C', implications: 'Slightly lower than pure PLA.' },
        { name: 'Biodegradability', value: '100%', unit: '', implications: 'Fully biodegradable in industrial composting.' },
      ],
      notes: 'Excellent balance of printability, toughness, and environmental credentials.',
    },
    printSettings: {
      nozzleTemp: { min: 195, max: 220, optimal: 210 },
      bedTemp: { min: 50, max: 65, optimal: 55 },
      coolingFan: { min: 50, max: 100, notes: 'Standard cooling works well.' },
      enclosure: { required: false, notes: 'Not needed.' },
      drying: { temp: 45, duration: '4-6 hours', notes: 'More hygroscopic than pure PLA - drying recommended.' },
      printSpeed: { recommended: '40-60 mm/s', notes: 'Similar to standard PLA speeds.' },
      additionalNotes: [
        'Prints very similarly to standard PLA',
        'Slightly lower temperatures often work better',
        'Excellent layer adhesion - great for functional parts',
        'Glossy finish naturally',
        'Store with desiccant - absorbs moisture',
      ],
    },
    adhesion: {
      bedSurfaces: {
        excellent: ['PEI', 'Glass with glue stick'],
        good: ['Blue painters tape', 'BuildTak'],
        poor: ['Cold surfaces'],
      },
      releaseAgents: 'Releases well from PEI when cooled.',
      multiMaterial: [
        { material: 'PLA', bondQuality: 'Strong Chemical Bond', notes: 'Excellent compatibility.' },
        { material: 'PVA', bondQuality: 'Mechanical Bond', notes: 'Works for dissolvable supports.' },
      ],
    },
    postProcessing: {
      chemicalSmoothing: [{ method: 'Limited options', effectiveness: 'Difficult', notes: 'No effective chemical smoothing.' }],
      mechanical: ['Sanding', 'Filling', 'Polishing'],
      painting: 'Takes paint well like standard PLA.',
      glues: ['CA glue', 'Epoxy', 'PLA welding'],
    },
    safety: {
      fumes: { level: 'Very Low', notes: 'Very low emissions - among the safest materials.' },
      foodSafety: { rating: 'Often Certified', notes: 'Many PLA/PHA blends are food contact safe.' },
      biodegradability: { rating: 'Fully Compostable', notes: 'Industrial and some home composting.' },
      additionalNotes: [
        'Among the most environmentally friendly filaments',
        'Safe for indoor printing',
        'Check specific brand for food safety certification',
      ],
    },
  },

  'PLA-UV': {
    name: 'PLA-UV',
    fullName: 'UV Reactive / Color-Changing Polylactic Acid',
    origin: {
      yearInvented: '2016-2017',
      originalCompany: 'Multiple manufacturers (Amolen, SUNLU, Eryone)',
      keyMilestones: [
        '2016: First UV-reactive PLA filaments introduced',
        '2017: Photochromic (sunlight color-change) variants emerge',
        '2018: Wide variety of color-change effects available',
        '2020+: Improved UV stability and color vibrancy',
      ],
      majorManufacturers: ['Amolen', 'SUNLU', 'Eryone', 'TTYT3D', 'Gizmo Dorks'],
    },
    composition: {
      basePolymer: 'Polylactic Acid',
      chemicalFamily: 'Polyester (Bio-based) with photochromic additives',
      keyAdditives: ['Photochromic pigments', 'UV stabilizers', 'Color-change compounds'],
      coloringAgents: 'Photochromic dyes that react to UV light',
      specialFillers: ['UV-responsive microencapsulated pigments'],
    },
    familyContext: {
      parentPolymer: 'PLA with UV-reactive photochromic additives',
      variants: ['UV Color-Change', 'Sunlight Reactive', 'Photochromic', 'Glow-in-Dark UV Charge'],
      chemicalComparison: 'Standard PLA with microencapsulated photochromic compounds.',
      evolution: 'From novelty to functional applications in UV detection and indicators.',
    },
    strengths: {
      uniqueProperties: ['Changes color in sunlight/UV', 'Reversible color change', 'Interactive prints', 'UV detection capability', 'Fun and educational'],
      bestUseScenarios: ['UV exposure indicators', 'Interactive toys', 'Educational projects', 'Novelty items', 'Sun safety products'],
      advantagesOverCompetitors: ['Dynamic visual effect', 'No batteries or electronics needed', 'Reusable/reversible'],
      whyChooseThis: 'When you want prints that respond to light for functional or fun applications.',
    },
    weaknesses: {
      limitations: ['Effect degrades over time with heavy UV exposure', 'Limited indoor color', 'More expensive', 'Color options limited'],
      commonProblems: ['Effect weakens after many cycles', 'Indoor color often pale/white', 'Temperature can affect color change'],
      environmentalConcerns: ['Photochromic additives not biodegradable', 'Difficult to recycle'],
      whenNotToUse: ['Permanent color needed', 'Heavy constant UV exposure', 'Professional appearance required'],
    },
    practicalContext: {
      industryAdoption: ['Novelty products', 'Educational tools', 'Marketing giveaways'],
      commonApplications: ['UV indicators', 'Sun safety reminders', 'Interactive toys', 'Phone cases', 'Keychains', 'Science experiments'],
      safetyStandards: ['Generally safe', 'Not food safe due to additives'],
      costPosition: 'Premium',
    },
    trivia: {
      funFacts: [
        'The color change happens in seconds when exposed to UV',
        'Photochromic compounds are also used in transition eyeglass lenses',
        'Cold temperatures make the color change more vibrant',
        'You can use a UV flashlight to "draw" on prints temporarily',
      ],
      whyInvented: 'Create interactive, light-responsive objects for novelty and functional UV detection.',
      controversies: ['Longevity varies greatly between brands', 'Some lose effect after a few months of sun exposure'],
      marketAdoption: 'Popular niche for novelty and educational applications.',
    },
    tdsProfile: {
      properties: [
        { name: 'Tensile Strength', value: '40-48', unit: 'MPa', implications: 'Slightly lower than pure PLA due to additives.' },
        { name: 'Elongation at Break', value: '3-6', unit: '%', implications: 'Standard PLA brittleness.' },
        { name: 'UV Response Time', value: '1-5', unit: 'seconds', implications: 'Quick color change outdoors.' },
        { name: 'Cycle Life', value: '100-1000+', unit: 'cycles', implications: 'Varies by brand and UV intensity.' },
        { name: 'Heat Deflection', value: '50-55', unit: '°C', implications: 'Standard PLA heat resistance.' },
      ],
      notes: 'Color-change effect durability varies significantly between manufacturers.',
    },
    printSettings: {
      nozzleTemp: { min: 190, max: 220, optimal: 205 },
      bedTemp: { min: 50, max: 65, optimal: 55 },
      coolingFan: { min: 80, max: 100, notes: 'Standard PLA cooling.' },
      enclosure: { required: false, notes: 'Not needed.' },
      drying: { temp: 45, duration: '4-6 hours', notes: 'Standard PLA drying.' },
      printSpeed: { recommended: '40-60 mm/s', notes: 'Standard PLA speeds work well.' },
      additionalNotes: [
        'Avoid excessive heat which can damage photochromic compounds',
        'Lower temperatures preserve color-change effect better',
        'Store away from UV light to preserve effect',
        'Print a test piece to verify color change works',
      ],
    },
    adhesion: {
      bedSurfaces: {
        excellent: ['PEI', 'Glass with glue stick'],
        good: ['Blue painters tape', 'BuildTak'],
        poor: ['Bare glass'],
      },
      releaseAgents: 'Standard PLA release methods.',
      multiMaterial: [
        { material: 'PLA', bondQuality: 'Strong Chemical Bond', notes: 'Good compatibility.' },
        { material: 'PLA+', bondQuality: 'Strong Chemical Bond', notes: 'Works well together.' },
      ],
    },
    postProcessing: {
      chemicalSmoothing: [{ method: 'Not recommended', effectiveness: 'Not Possible', notes: 'May damage UV-reactive compounds.' }],
      mechanical: ['Light sanding only', 'Avoid heat'],
      painting: 'Clear coat only - paint would block UV effect.',
      glues: ['CA glue', 'Epoxy', 'Hot glue (low temp)'],
    },
    safety: {
      fumes: { level: 'Very Low', notes: 'Standard PLA emissions.' },
      foodSafety: { rating: 'Not Safe', notes: 'Photochromic additives not food safe.' },
      biodegradability: { rating: 'Partially Compostable', notes: 'PLA base compostable, additives may not be.' },
      additionalNotes: [
        'Safe for normal handling and printing',
        'Not for food contact',
        'Wash hands after handling raw filament',
      ],
    },
  },

  'PVC': {
    name: 'PVC',
    fullName: 'Polyvinyl Chloride',
    origin: {
      yearInvented: '1872 (discovery), 1926 (commercialized)',
      originalCompany: 'Waldo Semon at B.F. Goodrich (plasticized PVC)',
      keyMilestones: [
        '1872: PVC first synthesized by Eugen Baumann',
        '1926: Waldo Semon patents plasticized PVC',
        '1930s: Commercial production begins',
        '2015+: Limited 3D printing filament attempts',
      ],
      majorManufacturers: ['Very few 3D printing manufacturers', 'Primarily industrial PVC suppliers'],
    },
    composition: {
      basePolymer: 'Polyvinyl Chloride',
      chemicalFamily: 'Vinyl Polymer (Halogenated)',
      keyAdditives: ['Plasticizers (phthalates in flexible PVC)', 'Heat stabilizers', 'UV stabilizers', 'Lubricants'],
      coloringAgents: 'Wide range of pigments available',
      specialFillers: ['Calcium carbonate', 'Clay', 'Glass fiber (rarely)'],
    },
    familyContext: {
      parentPolymer: 'Vinyl chloride monomer polymerization',
      variants: ['Rigid PVC (uPVC)', 'Flexible PVC (plasticized)', 'Chlorinated PVC (CPVC)'],
      chemicalComparison: 'Contains chlorine, which enables flame retardancy but also releases HCl when overheated.',
      evolution: 'From industrial pipes and construction to very limited 3D printing experiments.',
    },
    strengths: {
      uniqueProperties: ['Excellent chemical resistance', 'Self-extinguishing flame behavior', 'Low cost industrially', 'Water resistant'],
      bestUseScenarios: ['Pipe prototypes', 'Chemical-resistant parts', 'Wire insulation prototypes'],
      advantagesOverCompetitors: ['Flame retardant without additives', 'Very low moisture absorption', 'Good electrical insulation'],
      whyChooseThis: 'Very rarely used in 3D printing due to safety concerns. Only for specific chemical resistance needs.',
    },
    weaknesses: {
      limitations: ['RELEASES TOXIC HYDROGEN CHLORIDE (HCl) FUMES', 'Narrow processing window', 'Very few filament options', 'Degrades quickly when overheated'],
      commonProblems: ['Toxic fume generation', 'Thermal degradation', 'Difficult temperature control', 'Health hazards'],
      environmentalConcerns: ['HCl release during printing', 'Difficult to recycle', 'Dioxin concerns when incinerated', 'Microplastic issues'],
      whenNotToUse: ['Home/unventilated environments', 'Most applications - safer alternatives exist', 'Without industrial ventilation'],
    },
    practicalContext: {
      industryAdoption: ['Extremely limited in 3D printing', 'Industrial prototyping only'],
      commonApplications: ['Industrial pipe fittings (rare)', 'Chemical container prototypes'],
      safetyStandards: ['Industrial safety protocols required', 'Proper fume extraction mandatory'],
      costPosition: 'Budget',
    },
    trivia: {
      funFacts: [
        'PVC is the world\'s third-most widely produced plastic but rarely 3D printed',
        'The chlorine content makes it naturally fire-resistant',
        'PVC pipes have been in use for water systems since the 1930s',
        'The smell of new car interior is largely plasticizers from PVC',
      ],
      whyInvented: 'Originally developed for wire insulation and later expanded to pipes and construction.',
      controversies: [
        'HCl fumes are extremely corrosive and toxic',
        'Phthalate plasticizers linked to health concerns',
        'Environmental groups call PVC the "poison plastic"',
        'Banned from some recycling streams',
      ],
      marketAdoption: 'Almost non-existent in consumer 3D printing due to safety concerns.',
    },
    tdsProfile: {
      properties: [
        { name: 'Tensile Strength', value: '40-50 (rigid)', unit: 'MPa', implications: 'Good strength for rigid PVC.' },
        { name: 'Elongation at Break', value: '20-80', unit: '%', implications: 'Varies with plasticizer content.' },
        { name: 'Heat Deflection', value: '60-80', unit: '°C', implications: 'Moderate heat resistance.' },
        { name: 'Degradation Temp', value: '~200', unit: '°C', implications: 'CRITICAL - begins degrading and releasing HCl at printing temps!' },
        { name: 'Chemical Resistance', value: 'Excellent', unit: '', implications: 'Resists acids, bases, and many solvents.' },
      ],
      notes: 'PVC degrades and releases toxic HCl gas at temperatures used for 3D printing. EXTREME CAUTION REQUIRED.',
    },
    printSettings: {
      nozzleTemp: { min: 170, max: 200, optimal: 185 },
      bedTemp: { min: 60, max: 80, optimal: 70 },
      coolingFan: { min: 50, max: 100, notes: 'Standard cooling. Monitor for degradation.' },
      enclosure: { required: true, notes: 'SEALED with EXTERNAL EXHAUST to outdoors. HCl fumes are extremely dangerous.' },
      drying: { temp: 60, duration: '4 hours', notes: 'PVC is not very hygroscopic.' },
      printSpeed: { recommended: '20-40 mm/s', notes: 'Slow to prevent overheating and degradation.' },
      additionalNotes: [
        'INDUSTRIAL VENTILATION REQUIRED - HCl fumes are corrosive and toxic',
        'Temperature control is CRITICAL - overheating causes rapid degradation',
        'Fumes will corrode printer components over time',
        'Not recommended for home/hobby use under any circumstances',
        'Consider PETG or ASA as safer alternatives for most applications',
      ],
    },
    adhesion: {
      bedSurfaces: {
        excellent: ['Glass with PVC-specific adhesive'],
        good: ['Blue tape'],
        poor: ['PEI - fumes may damage surface'],
      },
      releaseAgents: 'Specialty adhesives required.',
      multiMaterial: [
        { material: 'Other materials', bondQuality: 'No Bond', notes: 'PVC is rarely compatible with other materials.' },
      ],
    },
    postProcessing: {
      chemicalSmoothing: [
        { method: 'THF', effectiveness: 'Good', notes: 'Works but adds to toxicity concerns.' },
        { method: 'Acetone', effectiveness: 'Not Possible', notes: 'Limited effect on PVC.' },
      ],
      mechanical: ['Sands easily', 'Can be machined', 'Takes adhesives well'],
      glues: ['PVC cement', 'Cyanoacrylate', 'Specialty PVC adhesives'],
      painting: 'Accepts paint after proper surface preparation.',
    },
    safety: {
      fumes: { level: 'High', notes: 'PRODUCES TOXIC HCl GAS when overheated. Industrial ventilation MANDATORY.' },
      foodSafety: { rating: 'Not Recommended', notes: 'Plasticizer concerns. Not suitable for food contact.' },
      biodegradability: { rating: 'Not Biodegradable', notes: 'Persistent in environment. Recycling is difficult.' },
      additionalNotes: [
        'DANGER: HCl fumes are corrosive and toxic',
        'Can damage printer components (corrosive fumes)',
        'Industrial safety protocols required',
        'Avoid in home/hobby environments',
        'Consider safer alternatives like PETG or ASA',
      ],
    },
  },

  'allPHA': {
    name: 'allPHA',
    fullName: 'Polyhydroxyalkanoates',
    origin: {
      yearInvented: '1926 (discovery), 2010s (3D printing)',
      originalCompany: 'Maurice Lemoigne at Institut Pasteur (discovery)',
      keyMilestones: [
        '1926: PHB discovered by Maurice Lemoigne',
        '1980s: ICI commercializes Biopol',
        '2010s: colorFabb develops PHA blends for 3D printing',
        '2020+: Multiple brands offer PHA and PHA-blend filaments',
      ],
      majorManufacturers: ['colorFabb (allPHA)', 'Fillamentum', 'Proto-pasta', 'MCPP (Danimer Scientific)'],
    },
    composition: {
      basePolymer: 'Polyhydroxyalkanoates (biopolyester family)',
      chemicalFamily: 'Biopolyester (Bacterially Produced)',
      keyAdditives: ['Plasticizers for flexibility', 'Processing aids', 'Nucleating agents'],
      coloringAgents: 'Natural color is off-white, can be pigmented',
      specialFillers: ['Generally unfilled to maintain biodegradability'],
    },
    familyContext: {
      parentPolymer: 'Produced by bacteria from organic substrates',
      variants: ['PHB', 'PHBV', 'P3HB4HB', 'PHBHHx', 'Various copolymers'],
      chemicalComparison: 'Truly biodegradable in natural environments unlike PLA. More flexible than PLA.',
      evolution: 'From laboratory curiosity to commercial biodegradable plastic and 3D printing material.',
    },
    strengths: {
      uniqueProperties: ['Marine biodegradable', 'Home compostable', 'UV resistant', 'Good barrier properties'],
      bestUseScenarios: ['Eco-friendly projects', 'Single-use items', 'Outdoor degradable parts', 'Marine applications'],
      advantagesOverCompetitors: ['Actually biodegrades in nature (unlike PLA)', 'Produced from renewable resources', 'Non-toxic degradation products'],
      whyChooseThis: 'When genuine environmental biodegradability is required - truly decomposes in natural environments.',
    },
    weaknesses: {
      limitations: ['More expensive than PLA', 'Narrower processing window', 'Lower strength than PETG', 'Limited availability'],
      commonProblems: ['Moisture sensitivity', 'Slow crystallization', 'Brittleness in some grades', 'Variable properties'],
      environmentalConcerns: ['Production uses significant resources', 'Bacterial fermentation energy costs'],
      whenNotToUse: ['Structural applications', 'When cost is primary factor', 'High-temperature applications'],
    },
    practicalContext: {
      industryAdoption: ['Packaging', 'Agriculture', 'Medical devices', 'Food service'],
      commonApplications: ['Biodegradable packaging', 'Agricultural films', 'Medical sutures (surgical grades)', 'Compostable items'],
      safetyStandards: ['FDA approved grades for food contact', 'Biocompatible for medical applications'],
      costPosition: 'Premium',
    },
    trivia: {
      funFacts: [
        'PHAs are produced by bacteria as energy storage - similar to animal fat',
        'Can biodegrade in soil, freshwater, and seawater',
        'Some medical implants use PHA because it\'s absorbed by the body',
        'Danimer Scientific produces PHA called Nodax used by major brands',
      ],
      whyInvented: 'Discovered as bacterial energy storage granules, developed as truly biodegradable plastic alternative.',
      controversies: [
        'Production costs remain higher than petroleum plastics',
        'Some "PHA" products contain minimal actual PHA content',
        'Biodegradation rates vary significantly with conditions',
      ],
      marketAdoption: 'Growing as sustainability concerns increase, but still niche compared to PLA.',
    },
    tdsProfile: {
      properties: [
        { name: 'Tensile Strength', value: '25-40', unit: 'MPa', implications: 'Lower than PLA. Sufficient for non-structural use.' },
        { name: 'Elongation at Break', value: '3-8', unit: '%', implications: 'Brittle like PLA. Some grades more flexible.' },
        { name: 'Biodegradation', value: 'Natural', unit: '', implications: 'Degrades in soil, water, marine environments.' },
        { name: 'Glass Transition (Tg)', value: '0-5', unit: '°C', implications: 'Very low Tg means softens at room temperature. Blends improve this.' },
        { name: 'Melting Point', value: '160-180', unit: '°C', implications: 'Lower than PLA, similar to some polyesters.' },
      ],
      notes: 'Properties vary significantly between PHA types. Most 3D printing PHA is blended for improved printability.',
    },
    printSettings: {
      nozzleTemp: { min: 180, max: 210, optimal: 195 },
      bedTemp: { min: 30, max: 60, optimal: 45 },
      coolingFan: { min: 50, max: 100, notes: 'Moderate to high cooling, similar to PLA.' },
      enclosure: { required: false, notes: 'Not required for most PHA blends.' },
      drying: { temp: 50, duration: '4-6 hours', notes: 'Hygroscopic - drying recommended before printing.' },
      printSpeed: { recommended: '30-50 mm/s', notes: 'Slightly slower than PLA for best results.' },
      additionalNotes: [
        'Print settings similar to PLA',
        'May require lower temps than PLA',
        'Good bed adhesion on most surfaces',
        'Drying important for consistent results',
        'Some grades have narrower temp window',
      ],
    },
    adhesion: {
      bedSurfaces: {
        excellent: ['PEI (Smooth)', 'Glass with glue', 'Blue tape'],
        good: ['PEI (Textured)', 'BuildTak'],
        poor: ['Bare glass at high temps'],
      },
      releaseAgents: 'Similar to PLA - glue stick if needed.',
      multiMaterial: [
        { material: 'PLA', bondQuality: 'Weak Bond', notes: 'Related biopolymers but different chemistry.' },
        { material: 'PLA/PHA blends', bondQuality: 'Strong Chemical Bond', notes: 'Common commercial blend.' },
      ],
    },
    postProcessing: {
      chemicalSmoothing: [
        { method: 'Acetone', effectiveness: 'Not Possible', notes: 'No effect on PHA.' },
      ],
      mechanical: ['Sands easily', 'Can be primed and painted', 'Standard finishing techniques'],
      glues: ['Cyanoacrylate', 'Epoxy', 'Biobased adhesives'],
      painting: 'Accepts standard paints and finishes.',
    },
    safety: {
      fumes: { level: 'Very Low', notes: 'Biobased material with minimal emissions. Very safe to print.' },
      foodSafety: { rating: 'FDA Approved Grades', notes: 'Some grades are FDA approved for food contact.' },
      biodegradability: { rating: 'Excellent - Natural Degradation', notes: 'Truly biodegrades in soil, freshwater, and marine environments.' },
      additionalNotes: [
        'One of the safest materials to print',
        'No toxic degradation products',
        'Truly environmentally friendly end-of-life',
        'Safe for children and educational use',
      ],
    },
  },

  'Cleaning': {
    name: 'Cleaning',
    fullName: 'Nozzle Cleaning Filament',
    origin: {
      yearInvented: '2010s (3D printing maintenance)',
      originalCompany: 'Multiple manufacturers developed cleaning filaments',
      keyMilestones: [
        '2012+: First cleaning filaments appear',
        '2015+: Becomes standard maintenance product',
        '2020+: Specialty formulations for different residues',
      ],
      majorManufacturers: ['eSUN', 'Polymaker', 'MatterHackers', 'Atomic Filament', 'E3D'],
    },
    composition: {
      basePolymer: 'Varies - often based on high-Tg polymers',
      chemicalFamily: 'Specialty Maintenance Compound',
      keyAdditives: ['Cleaning agents', 'Softeners for residue removal', 'High-temp stabilizers'],
      coloringAgents: 'Usually natural/white for visibility of removed residue',
      specialFillers: ['Some contain mild abrasives', 'Surfactant compounds'],
    },
    familyContext: {
      parentPolymer: 'Various - formulated for cleaning properties, not structural use',
      variants: ['Standard cleaning', 'High-temp cleaning', 'Cold pull cleaning', 'Purge filament'],
      chemicalComparison: 'Not designed for printing - designed to bind and remove residual material.',
      evolution: 'From DIY solutions (nylon) to purpose-made cleaning filaments.',
    },
    strengths: {
      uniqueProperties: ['Removes buildup and clogs', 'Binds to residual material', 'High-temp formulations available', 'Prevents cross-contamination'],
      bestUseScenarios: ['Nozzle maintenance', 'Material changes', 'Clearing partial clogs', 'After printing abrasive materials'],
      advantagesOverCompetitors: ['Purpose-designed for cleaning', 'More effective than random filament', 'Available for high-temp work'],
      whyChooseThis: 'Essential maintenance material for keeping your hotend clean and preventing clogs.',
    },
    weaknesses: {
      limitations: ['Not for actual printing', 'Consumable with no printed output', 'Adds cost to printing'],
      commonProblems: ['Still may not clear severe clogs', 'Some brands ineffective', 'Can be messy'],
      environmentalConcerns: ['Creates waste', 'Not recyclable'],
      whenNotToUse: ['As a printing material', 'For severe mechanical clogs (needs disassembly)'],
    },
    practicalContext: {
      industryAdoption: ['Universal in 3D printing', 'Professional and hobbyist'],
      commonApplications: ['Hotend cleaning', 'Material transitions', 'Maintenance routines', 'Post-abrasive printing'],
      safetyStandards: ['Generally safe to handle'],
      costPosition: 'Budget',
    },
    trivia: {
      funFacts: [
        'Before cleaning filament, people used nylon fishing line for cold pulls',
        'White/natural color makes it easy to see what you\'re removing',
        'Some printing professionals run cleaning filament daily',
        'High-temp cleaning filament can handle temps up to 280°C+',
      ],
      whyInvented: 'Created to provide an easy, purpose-built solution for hotend maintenance.',
      controversies: [
        'Some claim it\'s just overpriced nylon',
        'Effectiveness varies significantly between brands',
        'May not be necessary with regular maintenance',
      ],
      marketAdoption: 'Standard maintenance product - most serious printers keep it on hand.',
    },
    tdsProfile: {
      properties: [
        { name: 'Purpose', value: 'Cleaning', unit: '', implications: 'NOT for printed parts. Maintenance material only.' },
        { name: 'Temperature Range', value: '180-280+', unit: '°C', implications: 'Varies by formulation. High-temp versions for PEEK/PEI work.' },
        { name: 'Binding Properties', value: 'High', unit: '', implications: 'Designed to adhere to and remove residual material.' },
        { name: 'Cold Pull Capability', value: 'Excellent', unit: '', implications: 'Pulls cleanly from cooled hotend, bringing residue with it.' },
      ],
      notes: 'Properties are designed for cleaning effectiveness, not mechanical strength or printability.',
    },
    printSettings: {
      nozzleTemp: { min: 200, max: 280, optimal: 240 },
      bedTemp: { min: 0, max: 0, optimal: 0 },
      coolingFan: { min: 0, max: 0, notes: 'N/A - not for printing.' },
      enclosure: { required: false, notes: 'N/A' },
      drying: { temp: 60, duration: '2-4 hours', notes: 'Can be dried if stored improperly.' },
      printSpeed: { recommended: 'N/A', notes: 'Manually extrude or use cold pull technique.' },
      additionalNotes: [
        'Heat to printing temp of previous material',
        'Manually extrude until clean',
        'For cold pull: heat to 200°C, extrude, cool to 90°C, pull firmly',
        'Repeat until pulled material is clean',
        'Use after printing abrasive or high-temp materials',
      ],
    },
    adhesion: {
      bedSurfaces: {
        excellent: ['N/A - not for printing'],
        good: ['N/A'],
        poor: ['N/A'],
      },
      releaseAgents: 'N/A',
      multiMaterial: [],
    },
    postProcessing: {
      chemicalSmoothing: [
        { method: 'N/A', effectiveness: 'Not Possible', notes: 'Not a printing material.' },
      ],
      mechanical: ['N/A - discard after use'],
      glues: ['N/A'],
      painting: 'N/A',
    },
    safety: {
      fumes: { level: 'Low', notes: 'Similar to standard printing. Use normal ventilation.' },
      foodSafety: { rating: 'N/A', notes: 'Not a printing material.' },
      biodegradability: { rating: 'Not Biodegradable', notes: 'Dispose as plastic waste.' },
      additionalNotes: [
        'Safe to handle',
        'Dispose of used cleaning filament as plastic waste',
        'May release more fumes during cleaning due to burning residue',
      ],
    },
  },

  'SimuBone': {
    name: 'SimuBone',
    fullName: 'Bone-Simulating Filament',
    origin: {
      yearInvented: '2018+ (specialized medical/educational)',
      originalCompany: 'Various medical simulation companies',
      keyMilestones: [
        '2018+: Medical simulation 3D printing materials emerge',
        '2020+: Specialized bone-like filaments developed',
      ],
      majorManufacturers: ['Fillamentum (Timberfill)', 'colorFabb', 'Medical simulation companies'],
    },
    composition: {
      basePolymer: 'PLA or similar biopolymer base',
      chemicalFamily: 'Mineral-Filled Thermoplastic Composite',
      keyAdditives: ['Calcium-based fillers', 'Mineral powders', 'Whiteners'],
      coloringAgents: 'Natural bone-white color',
      specialFillers: ['Hydroxyapatite (HA) in some grades', 'Calcium carbite', 'Bone-mimicking minerals'],
    },
    familyContext: {
      parentPolymer: 'Usually PLA or medical-grade polymer base',
      variants: ['Cortical bone simulation', 'Cancellous/trabecular simulation', 'Dental model material'],
      chemicalComparison: 'Engineered to mimic mechanical and cutting properties of human bone.',
      evolution: 'From research/medical use to available specialty filament.',
    },
    strengths: {
      uniqueProperties: ['Mimics bone cutting feel', 'Bone-like appearance', 'Suitable for surgical training', 'Realistic tactile properties'],
      bestUseScenarios: ['Surgical simulation', 'Medical education', 'Dental models', 'Anatomical models'],
      advantagesOverCompetitors: ['More realistic than standard plastics', 'Purpose-designed for medical training', 'Consistent properties'],
      whyChooseThis: 'When you need models that simulate the feel and properties of real bone for training or education.',
    },
    weaknesses: {
      limitations: ['Very specialized use case', 'Higher cost', 'Limited color options', 'May require hardened nozzle'],
      commonProblems: ['Abrasive mineral content', 'Limited availability', 'Niche market means less support'],
      environmentalConcerns: ['Mineral fillers may complicate disposal', 'Specialty waste in medical settings'],
      whenNotToUse: ['General printing', 'When standard materials suffice', 'Cost-sensitive applications'],
    },
    practicalContext: {
      industryAdoption: ['Medical education', 'Surgical training', 'Dental schools', 'Research'],
      commonApplications: ['Surgical practice models', 'Anatomy teaching aids', 'Dental implant planning', 'Orthopedic training'],
      safetyStandards: ['Medical simulation standards', 'Educational use certified'],
      costPosition: 'Premium',
    },
    trivia: {
      funFacts: [
        'Surgeons use bone-simulation prints to practice before complex operations',
        'Some formulations use actual hydroxyapatite - the mineral in real bones',
        'Drilling and sawing feel similar to actual bone surgery',
        'Patient-specific bone models are printed from CT scans',
      ],
      whyInvented: 'Created to provide realistic surgical training without cadavers or live patients.',
      controversies: [
        'Claims of "bone-like" properties vary between brands',
        'Validation of training effectiveness ongoing',
        'Cost limits accessibility for some institutions',
      ],
      marketAdoption: 'Niche but important in medical education and surgical planning.',
    },
    tdsProfile: {
      properties: [
        { name: 'Tensile Strength', value: '30-50', unit: 'MPa', implications: 'Designed to mimic bone, not maximize strength.' },
        { name: 'Cutting Properties', value: 'Bone-Like', unit: '', implications: 'Key feature - feels like cutting real bone.' },
        { name: 'Appearance', value: 'Bone White', unit: '', implications: 'Visually realistic for training.' },
        { name: 'Mineral Content', value: '20-40', unit: '%', implications: 'Provides bone-like feel and properties.' },
      ],
      notes: 'Properties optimized for simulation realism, not mechanical performance.',
    },
    printSettings: {
      nozzleTemp: { min: 195, max: 220, optimal: 205 },
      bedTemp: { min: 50, max: 65, optimal: 55 },
      coolingFan: { min: 50, max: 100, notes: 'Standard PLA-like cooling.' },
      enclosure: { required: false, notes: 'Not required.' },
      drying: { temp: 45, duration: '4-6 hours', notes: 'Similar to PLA base material.' },
      printSpeed: { recommended: '30-50 mm/s', notes: 'Moderate speeds for consistent extrusion.' },
      additionalNotes: [
        'Hardened nozzle recommended due to mineral content',
        'Use 0.4mm+ nozzle for reliable extrusion',
        'Print settings similar to filled PLA',
        'May require flow adjustments',
      ],
    },
    adhesion: {
      bedSurfaces: {
        excellent: ['PEI (Smooth)', 'Glass with glue'],
        good: ['PEI (Textured)', 'Blue tape'],
        poor: ['Bare glass'],
      },
      releaseAgents: 'Similar to PLA - glue stick if needed.',
      multiMaterial: [
        { material: 'PLA', bondQuality: 'Strong Chemical Bond', notes: 'Same base polymer compatibility.' },
        { material: 'Soft tissue simulation', bondQuality: 'Mechanical Bond', notes: 'Can combine with flexible materials for anatomy.' },
      ],
    },
    postProcessing: {
      chemicalSmoothing: [
        { method: 'Acetone', effectiveness: 'Not Possible', notes: 'PLA base - no acetone effect.' },
      ],
      mechanical: ['Can be drilled and cut', 'Sands like bone', 'Accepts pins and screws'],
      glues: ['Cyanoacrylate', 'Epoxy', 'Medical-grade adhesives'],
      painting: 'Can be painted for anatomical coloring if needed.',
    },
    safety: {
      fumes: { level: 'Low', notes: 'Similar to filled PLA.' },
      foodSafety: { rating: 'Not Applicable', notes: 'Medical/educational use only.' },
      biodegradability: { rating: 'Limited', notes: 'Mineral content may slow degradation.' },
      additionalNotes: [
        'Handle finished models with appropriate care',
        'Dispose according to institutional policies',
        'Dust from cutting/drilling may be irritating',
      ],
    },
  },

  'Ryno': {
    name: 'Ryno',
    fullName: 'Ryno High-Performance Copolymer',
    origin: {
      yearInvented: '2019-2020',
      originalCompany: 'colorFabb',
      keyMilestones: [
        '2020: colorFabb introduces Ryno as tough engineering material',
        '2021+: Gains recognition for impact resistance',
      ],
      majorManufacturers: ['colorFabb (exclusive)'],
    },
    composition: {
      basePolymer: 'Proprietary copolyester/copolymer blend',
      chemicalFamily: 'Engineered Copolymer',
      keyAdditives: ['Impact modifiers', 'Toughening agents', 'Processing aids'],
      coloringAgents: 'Limited color options',
      specialFillers: ['Generally unfilled for maximum toughness'],
    },
    familyContext: {
      parentPolymer: 'Proprietary colorFabb formulation',
      variants: ['Standard Ryno'],
      chemicalComparison: 'Designed to bridge gap between easy-printing PETG and tough polycarbonate.',
      evolution: 'Purpose-developed by colorFabb for high-impact applications.',
    },
    strengths: {
      uniqueProperties: ['Exceptional impact resistance', 'Good layer adhesion', 'Chemical resistance', 'Easy to print for its performance'],
      bestUseScenarios: ['Functional parts', 'Impact-resistant applications', 'Tool handles', 'Protective equipment'],
      advantagesOverCompetitors: ['Easier than PC', 'Tougher than PETG', 'No enclosure required', 'Excellent layer bonding'],
      whyChooseThis: 'When you need polycarbonate-like toughness with PETG-like printability.',
    },
    weaknesses: {
      limitations: ['Single-source material', 'Limited colors', 'Higher cost than PETG', 'Less heat resistant than PC'],
      commonProblems: ['Can be stringy', 'Moisture sensitive', 'Bed adhesion can be tricky'],
      environmentalConcerns: ['Petroleum-based', 'Not biodegradable', 'Single-brand means supply constraints'],
      whenNotToUse: ['High-temperature applications', 'When PETG suffices', 'Budget-constrained projects'],
    },
    practicalContext: {
      industryAdoption: ['Prototyping', 'Functional parts', 'Tool making', 'Industrial applications'],
      commonApplications: ['Protective housings', 'Tool handles', 'Mechanical parts', 'Enclosures', 'Jigs'],
      safetyStandards: ['Industrial-grade material'],
      costPosition: 'Premium',
    },
    trivia: {
      funFacts: [
        'Named to evoke strength (like a rhino)',
        'Developed specifically to fill the PETG-to-PC gap',
        'colorFabb claims it\'s the toughest material that prints like PETG',
        'Designed for users who found PC too difficult',
      ],
      whyInvented: 'Created to provide polycarbonate-level toughness for users who can\'t print PC.',
      controversies: [
        'Single-source supply raises availability concerns',
        'Premium pricing compared to alternatives',
        'Some question if it truly rivals PC performance',
      ],
      marketAdoption: 'Niche but growing among users needing tough parts without PC complexity.',
    },
    tdsProfile: {
      properties: [
        { name: 'Tensile Strength', value: '50-60', unit: 'MPa', implications: 'High. Comparable to good PETG, approaching PC.' },
        { name: 'Impact Strength', value: '50-70', unit: 'kJ/m² (Notched)', implications: 'Very High. The main selling point - exceptional toughness.' },
        { name: 'Elongation at Break', value: '100-200', unit: '%', implications: 'Excellent ductility. Bends before breaking.' },
        { name: 'Heat Deflection', value: '70-80', unit: '°C', implications: 'Similar to PETG. Not as heat-resistant as PC.' },
        { name: 'Layer Adhesion', value: 'Excellent', unit: '', implications: 'Strong interlayer bonding for functional parts.' },
      ],
      notes: 'Designed to maximize toughness while maintaining printability. Trade-off is heat resistance vs PC.',
    },
    printSettings: {
      nozzleTemp: { min: 240, max: 265, optimal: 255 },
      bedTemp: { min: 70, max: 90, optimal: 80 },
      coolingFan: { min: 30, max: 70, notes: 'Moderate cooling for best layer adhesion.' },
      enclosure: { required: false, notes: 'Not required but can help with large parts.' },
      drying: { temp: 65, duration: '4-6 hours', notes: 'Hygroscopic - drying recommended.' },
      printSpeed: { recommended: '40-60 mm/s', notes: 'Moderate speeds similar to PETG.' },
      additionalNotes: [
        'Print settings similar to PETG but higher temps',
        'Good bed adhesion on textured PEI',
        'Use release agent on smooth PEI',
        'Drying is important for best results',
        'Higher temps improve layer adhesion',
      ],
    },
    adhesion: {
      bedSurfaces: {
        excellent: ['PEI (Textured)', 'Glass with glue'],
        good: ['PEI (Smooth) with release agent', 'BuildTak'],
        poor: ['Bare smooth PEI - sticks too well'],
      },
      releaseAgents: 'Glue stick on smooth surfaces recommended.',
      multiMaterial: [
        { material: 'PETG', bondQuality: 'Mechanical Bond', notes: 'Related polymer families.' },
        { material: 'TPU', bondQuality: 'Weak Bond', notes: 'Some adhesion possible.' },
      ],
    },
    postProcessing: {
      chemicalSmoothing: [
        { method: 'Acetone', effectiveness: 'Not Possible', notes: 'No effect.' },
        { method: 'Dichloromethane', effectiveness: 'Good', notes: 'Works but extremely toxic.' },
      ],
      mechanical: ['Sands well', 'Can be drilled', 'Taps threads well', 'Machines reasonably'],
      glues: ['Cyanoacrylate', 'Epoxy', 'Specialty copolyester adhesives'],
      painting: 'Accepts paint after proper surface preparation.',
    },
    safety: {
      fumes: { level: 'Low', notes: 'Similar to PETG. Standard ventilation recommended.' },
      foodSafety: { rating: 'Not Certified', notes: 'Check with colorFabb for food-safe certification status.' },
      biodegradability: { rating: 'Not Biodegradable', notes: 'Petroleum-based copolymer.' },
    },
  },

  'Carbon Fiber': {
    name: 'Carbon Fiber',
    fullName: 'Carbon Fiber Reinforced Composites',
    origin: {
      yearInvented: '1860 (carbon fiber), 2014+ (3D printing composites)',
      originalCompany: 'Joseph Swan (carbon fiber), Various (3D printing composites)',
      keyMilestones: [
        '1860: Joseph Swan produces carbon fiber for light bulbs',
        '1958: Roger Bacon creates high-strength carbon fiber',
        '2014+: Carbon fiber filaments become available for FDM',
        '2015+: Major brands offer CF-reinforced materials',
      ],
      majorManufacturers: ['3DXTech', 'Polymaker', 'colorFabb', 'Markforged', 'Proto-pasta', 'eSUN'],
    },
    composition: {
      basePolymer: 'Various - PLA, PETG, Nylon, PC, PEEK (host polymer for CF)',
      chemicalFamily: 'Fiber-Reinforced Thermoplastic Composite',
      keyAdditives: ['Chopped carbon fiber (typically 10-20%)', 'Coupling agents', 'Flow modifiers'],
      coloringAgents: 'Carbon fiber gives characteristic black/gray color',
      specialFillers: ['Chopped carbon fiber', 'Sometimes continuous carbon fiber (Markforged)'],
    },
    familyContext: {
      parentPolymer: 'Carbon fiber is added to various base polymers',
      variants: ['PLA-CF', 'PETG-CF', 'Nylon-CF', 'PC-CF', 'PEEK-CF', 'ABS-CF', 'ASA-CF'],
      chemicalComparison: 'CF dramatically increases stiffness and reduces weight. Properties depend on base polymer.',
      evolution: 'From aerospace material to accessible 3D printing reinforcement.',
    },
    strengths: {
      uniqueProperties: ['Very high stiffness', 'Excellent strength-to-weight', 'Dimensional stability', 'Professional appearance'],
      bestUseScenarios: ['Structural parts', 'Drone frames', 'Jigs and fixtures', 'Weight-critical applications'],
      advantagesOverCompetitors: ['Stiffest FDM material option', 'Lightest for given stiffness', 'Matte professional finish'],
      whyChooseThis: 'When you need maximum stiffness and minimum weight - metal replacement applications.',
    },
    weaknesses: {
      limitations: ['Very abrasive - requires hardened nozzle', 'Reduced impact resistance vs unfilled', 'Higher cost', 'Anisotropic properties'],
      commonProblems: ['Rapid nozzle wear', 'Layer adhesion varies', 'Can be stringy', 'Brittleness in Z-axis'],
      environmentalConcerns: ['Energy-intensive carbon fiber production', 'Difficult to recycle', 'Not biodegradable'],
      whenNotToUse: ['When impact resistance is critical', 'Budget projects', 'Without hardened nozzle'],
    },
    practicalContext: {
      industryAdoption: ['Aerospace', 'Automotive', 'Drones', 'Industrial tooling', 'Prosthetics'],
      commonApplications: ['Drone frames', 'Jigs and fixtures', 'End-effectors', 'Brackets', 'Replacement for aluminum'],
      safetyStandards: ['Aerospace-grade available', 'Industrial-grade common'],
      costPosition: 'Premium',
    },
    trivia: {
      funFacts: [
        'Carbon fiber is 5x stronger than steel at 1/5 the weight',
        'The first carbon fibers were made for Edison\'s light bulbs',
        'Most "carbon fiber" filaments use chopped fiber, not continuous',
        'Continuous fiber (Markforged) approaches injection-molded strength',
      ],
      whyInvented: 'Carbon fiber developed for aerospace, adapted to 3D printing for lightweight structural parts.',
      controversies: [
        'Many cheap CF filaments use minimal fiber content',
        'Nozzle wear often severely underestimated',
        'Z-axis strength much lower than XY - parts can delaminate',
      ],
      marketAdoption: 'Established professional material, growing hobby adoption.',
    },
    tdsProfile: {
      properties: [
        { name: 'Tensile Strength', value: '60-100+', unit: 'MPa', implications: 'High. Varies significantly with base polymer and CF content.' },
        { name: 'Tensile Modulus', value: '5000-15000', unit: 'MPa', implications: 'Very High Stiffness. The primary benefit of CF reinforcement.' },
        { name: 'Elongation at Break', value: '1-5', unit: '%', implications: 'Low - CF composites are stiff but brittle.' },
        { name: 'CF Content', value: '10-20', unit: '%', implications: 'More CF = stiffer but more abrasive and brittle.' },
        { name: 'Density', value: '1.1-1.3', unit: 'g/cm³', implications: 'Slightly higher than unfilled, but stiffness increase is dramatic.' },
        { name: 'Abrasiveness', value: 'Very High', unit: '', implications: 'HARDENED NOZZLE MANDATORY.' },
      ],
      notes: 'Properties heavily depend on base polymer. Nylon-CF is much stronger than PLA-CF.',
    },
    printSettings: {
      nozzleTemp: { min: 200, max: 300 },
      bedTemp: { min: 50, max: 110 },
      coolingFan: { min: 0, max: 100, notes: 'Depends on base polymer. Nylon-CF: minimal. PLA-CF: high.' },
      enclosure: { required: false, notes: 'Depends on base polymer. Required for Nylon-CF, PC-CF, PEEK-CF.' },
      drying: { temp: 60, duration: '4-8 hours', notes: 'Critical for Nylon-CF. Important for all CF materials.' },
      printSpeed: { recommended: '30-60 mm/s', notes: 'Moderate speeds. Higher CF content may need slower speeds.' },
      additionalNotes: [
        'HARDENED NOZZLE REQUIRED - steel, ruby, or tungsten carbide',
        'Print settings follow base polymer guidelines',
        'Slightly higher temps often improve layer adhesion',
        'Z-axis strength is lower - orient parts accordingly',
        'Drying is especially critical for Nylon-CF',
      ],
    },
    adhesion: {
      bedSurfaces: {
        excellent: ['Depends on base polymer'],
        good: ['PEI generally works well'],
        poor: ['Follow base polymer guidance'],
      },
      releaseAgents: 'Follow base polymer guidelines.',
      multiMaterial: [
        { material: 'Same base polymer (unfilled)', bondQuality: 'Strong Chemical Bond', notes: 'Best practice for multi-material.' },
        { material: 'Different base polymer', bondQuality: 'No Bond', notes: 'Generally incompatible.' },
      ],
    },
    postProcessing: {
      chemicalSmoothing: [
        { method: 'Varies', effectiveness: 'Difficult', notes: 'CF disrupts smoothing. Generally not recommended.' },
      ],
      mechanical: ['Sands with difficulty', 'Can be machined carefully', 'CF creates dust - wear mask', 'Can be tapped'],
      glues: ['Epoxy (best)', 'Cyanoacrylate', 'Specialty CF adhesives'],
      painting: 'Surface prep required. Often left unpainted for matte CF appearance.',
    },
    safety: {
      fumes: { level: 'Low', notes: 'CF itself doesn\'t add fumes. Follow base polymer guidance.' },
      foodSafety: { rating: 'Not Recommended', notes: 'CF particles not suitable for food contact.' },
      biodegradability: { rating: 'Not Biodegradable', notes: 'Carbon fiber persists indefinitely.' },
      additionalNotes: [
        'WEAR MASK when sanding - carbon fiber dust is a respiratory hazard',
        'CF dust can irritate skin and eyes',
        'Use wet sanding when possible to control dust',
        'Dispose of CF waste properly',
      ],
    },
  },
};

export function getMaterialReference(material: string): MaterialReferenceInfo | undefined {
  return MATERIAL_REFERENCE_DATA[material];
}

export function getAllMaterialsWithReference(): string[] {
  return Object.keys(MATERIAL_REFERENCE_DATA);
}
