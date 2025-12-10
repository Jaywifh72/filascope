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
};

export function getMaterialReference(material: string): MaterialReferenceInfo | undefined {
  return MATERIAL_REFERENCE_DATA[material];
}

export function getAllMaterialsWithReference(): string[] {
  return Object.keys(MATERIAL_REFERENCE_DATA);
}
