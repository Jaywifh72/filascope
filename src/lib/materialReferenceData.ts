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

  'PETG-CF': {
    name: 'PETG-CF',
    fullName: 'Carbon Fiber Reinforced PETG',
    origin: {
      yearInvented: '2017-2018',
      originalCompany: 'Multiple manufacturers (3DXTech, Polymaker, Priline)',
      keyMilestones: [
        '2016: Carbon fiber filaments gain popularity',
        '2017: First PETG-CF formulations appear',
        '2018: Major brands launch PETG-CF product lines',
        '2020+: Refined formulations with better fiber distribution',
      ],
      majorManufacturers: ['3DXTech', 'Polymaker', 'Priline', 'Overture', 'MatterHackers', 'Fiberlogy'],
    },
    composition: {
      basePolymer: 'PETG (Polyethylene Terephthalate Glycol-modified)',
      chemicalFamily: 'Glycol-Modified Polyester with Carbon Fiber',
      keyAdditives: ['Chopped carbon fiber (10-20%)', 'Coupling agents', 'Flow modifiers'],
      coloringAgents: 'Typically black/dark gray from carbon fiber',
      specialFillers: ['Milled carbon fiber', 'Chopped carbon strands'],
    },
    familyContext: {
      parentPolymer: 'PETG reinforced with carbon fiber',
      variants: ['PETG-CF Standard', 'PETG-CF HT', 'PETG-CF Pro'],
      chemicalComparison: 'Combines PETG\'s chemical resistance and ease of printing with carbon fiber\'s stiffness and dimensional stability.',
      evolution: 'Natural extension of carbon fiber composites to the popular PETG base material.',
    },
    strengths: {
      uniqueProperties: ['Significantly increased stiffness', 'Excellent dimensional stability', 'Professional matte finish', 'Reduced warping vs plain PETG'],
      bestUseScenarios: ['Structural brackets', 'Drone frames', 'Jigs and fixtures', 'Stiff enclosures', 'Camera mounts'],
      advantagesOverCompetitors: ['Easier to print than Nylon-CF or PC-CF', 'No enclosure required', 'Good chemical resistance', 'Less warping than ABS-CF'],
      whyChooseThis: 'When you need increased stiffness and dimensional stability without the printing difficulty of Nylon-CF or PC-CF.',
    },
    weaknesses: {
      limitations: ['Abrasive - requires hardened nozzle', 'Brittle compared to plain PETG', 'Lower impact resistance', 'Limited color options'],
      commonProblems: ['Nozzle wear with brass nozzles', 'Layer adhesion slightly reduced', 'Fiber orientation affects strength', 'Stringing can be worse'],
      environmentalConcerns: ['Carbon fiber not recyclable', 'Composite disposal challenges'],
      whenNotToUse: ['Impact-critical parts', 'Parts requiring flexibility', 'Without hardened nozzle', 'When plain PETG stiffness is sufficient'],
    },
    practicalContext: {
      industryAdoption: ['Drone manufacturing', 'Industrial tooling', 'Robotics', 'Automotive prototyping'],
      commonApplications: ['Drone arms and frames', 'Camera gimbals', 'Tool holders', 'Structural brackets', 'End effectors'],
      safetyStandards: ['Industrial prototyping use', 'No special certifications common'],
      costPosition: 'Premium',
    },
    trivia: {
      funFacts: [
        'Carbon fiber increases tensile modulus by 2-3x while barely affecting print difficulty',
        'The matte finish comes from fiber ends at the surface',
        'PETG-CF is often the "gateway" carbon fiber material for new users',
        'Parts are stiffer in the print direction due to fiber alignment',
      ],
      whyInvented: 'To bring carbon fiber reinforcement to the beginner-friendly PETG material.',
      controversies: [
        'Some cheap PETG-CF has minimal actual carbon content',
        'Fiber length and quality varies significantly between brands',
        'Debate over whether it\'s worth the nozzle wear for hobbyist use',
      ],
      marketAdoption: 'Popular entry point for carbon fiber printing due to easier handling than Nylon-CF.',
    },
    tdsProfile: {
      properties: [
        { name: 'Tensile Strength', value: '55-70', unit: 'MPa', implications: 'Improved over plain PETG (50 MPa).' },
        { name: 'Tensile Modulus', value: '5000-7000', unit: 'MPa', implications: 'Significantly stiffer than plain PETG (2000 MPa).' },
        { name: 'Elongation at Break', value: '2-5', unit: '%', implications: 'More brittle than plain PETG.' },
        { name: 'Heat Deflection', value: '70-80', unit: '°C', implications: 'Similar to plain PETG.' },
        { name: 'Carbon Fiber Content', value: '10-20', unit: '%', implications: 'Higher content = stiffer but more brittle.' },
      ],
      notes: 'Properties depend heavily on fiber content and print orientation.',
    },
    printSettings: {
      nozzleTemp: { min: 240, max: 270, optimal: 255 },
      bedTemp: { min: 70, max: 90, optimal: 80 },
      coolingFan: { min: 20, max: 60, notes: 'Less cooling than plain PETG for better layer adhesion.' },
      enclosure: { required: false, notes: 'Not required but helps with large parts.' },
      drying: { temp: 65, duration: '4-6 hours', notes: 'Important - PETG absorbs moisture which affects CF composite.' },
      printSpeed: { recommended: '30-50 mm/s', notes: 'Slower than plain PETG for better fiber distribution.' },
      additionalNotes: [
        'HARDENED NOZZLE REQUIRED - brass will wear quickly',
        'Use 0.5mm or larger nozzle for best flow',
        'Slightly higher temps than plain PETG',
        'Reduce retraction to prevent clogging',
        'First layer slower for adhesion',
      ],
    },
    adhesion: {
      bedSurfaces: {
        excellent: ['PEI', 'Glass with glue stick', 'Garolite'],
        good: ['BuildTak', 'Textured PEI'],
        poor: ['Blue tape', 'Bare glass'],
      },
      releaseAgents: 'Glue stick helps with both adhesion and release.',
      multiMaterial: [
        { material: 'PETG', bondQuality: 'Strong Chemical Bond', notes: 'Excellent compatibility.' },
        { material: 'PVA', bondQuality: 'Weak Bond', notes: 'Not ideal - consider breakaway supports.' },
      ],
    },
    postProcessing: {
      chemicalSmoothing: [{ method: 'Not effective', effectiveness: 'Not Possible', notes: 'Carbon fiber prevents effective smoothing.' }],
      mechanical: ['Sanding possible but dusty', 'Filing works well', 'Wear mask - CF dust is harmful'],
      painting: 'Accepts paint after light sanding. Matte finish provides good adhesion.',
      glues: ['Epoxy (best)', 'CA glue', 'Structural adhesives'],
    },
    safety: {
      fumes: { level: 'Low', notes: 'Same as plain PETG.' },
      foodSafety: { rating: 'Not Safe', notes: 'Carbon fiber not food safe.' },
      biodegradability: { rating: 'Not Biodegradable', notes: 'Neither PETG nor carbon fiber is biodegradable.' },
      additionalNotes: [
        'Wear mask when sanding - CF particles are harmful to lungs',
        'Safe for normal printing with ventilation',
        'Wash hands after handling sanded parts',
      ],
    },
  },

  'PETG+': {
    name: 'PETG+',
    fullName: 'Enhanced Polyethylene Terephthalate Glycol',
    origin: {
      yearInvented: '2018-2019',
      originalCompany: 'Multiple manufacturers (eSUN, Overture, Sunlu)',
      keyMilestones: [
        '2016: PETG becomes popular 3D printing material',
        '2018: First "PETG+" enhanced formulations appear',
        '2019: Major brands launch PETG+ product lines',
        '2021+: Formulations refined for better layer adhesion and clarity',
      ],
      majorManufacturers: ['eSUN', 'Overture', 'Sunlu', 'Polymaker', 'Inland', 'Hatchbox'],
    },
    composition: {
      basePolymer: 'Modified PETG (Polyethylene Terephthalate Glycol)',
      chemicalFamily: 'Glycol-Modified Polyester (Enhanced)',
      keyAdditives: ['Impact modifiers', 'Flow enhancers', 'Clarity agents', 'Anti-stringing compounds'],
      coloringAgents: 'Full range including translucent and transparent options',
      specialFillers: ['Toughening agents', 'Nucleating agents'],
    },
    familyContext: {
      parentPolymer: 'Standard PETG with enhanced additives',
      variants: ['PETG+', 'PETG Pro', 'Premium PETG', 'PETG Enhanced'],
      chemicalComparison: 'PETG base with additives to improve flow, reduce stringing, and enhance layer adhesion.',
      evolution: 'Developed to address common PETG complaints while maintaining its excellent properties.',
    },
    strengths: {
      uniqueProperties: ['Reduced stringing vs standard PETG', 'Better layer adhesion', 'Improved clarity in transparent colors', 'Easier printing'],
      bestUseScenarios: ['Functional parts', 'Clear/translucent prints', 'Mechanical components', 'Water-resistant applications'],
      advantagesOverCompetitors: ['Easier than standard PETG', 'Better than PLA for durability', 'Good chemical resistance', 'Wide temperature tolerance'],
      whyChooseThis: 'When you want PETG properties with reduced hassle - less stringing and better layer bonding.',
    },
    weaknesses: {
      limitations: ['Still scratches easily', 'Can be stringy (though less than standard)', 'Similar heat resistance to standard PETG', 'Formulations vary by brand'],
      commonProblems: ['Quality inconsistent between manufacturers', 'Some "PETG+" is barely different', 'Still hygroscopic'],
      environmentalConcerns: ['Same as standard PETG - petroleum based, recyclable'],
      whenNotToUse: ['High-temperature applications', 'When maximum clarity needed (use specialty clear)', 'Cost-sensitive projects'],
    },
    practicalContext: {
      industryAdoption: ['Prototyping', 'Consumer products', 'Hobbyist printing', 'Functional parts'],
      commonApplications: ['Enclosures', 'Mechanical parts', 'Containers', 'Outdoor parts', 'Functional prototypes'],
      safetyStandards: ['Generally same as PETG', 'Check specific brand certifications'],
      costPosition: 'Standard',
    },
    trivia: {
      funFacts: [
        'Like PLA+, "PETG+" has no standardized definition',
        'The best PETG+ brands genuinely reduce the infamous PETG stringing',
        'Some PETG+ is just well-dried, high-quality standard PETG',
        'Clear PETG+ can approach injection-molded clarity',
      ],
      whyInvented: 'To address PETG\'s stringing and layer adhesion complaints while keeping its strengths.',
      controversies: [
        '"Plus" is marketing - no industry standard',
        'Some products show minimal improvement over standard PETG',
        'Price premium may not be justified',
      ],
      marketAdoption: 'Growing popularity as users seek easier PETG printing experience.',
    },
    tdsProfile: {
      properties: [
        { name: 'Tensile Strength', value: '50-55', unit: 'MPa', implications: 'Same as standard PETG.' },
        { name: 'Impact Strength', value: '7-10', unit: 'kJ/m²', implications: 'Similar or slightly better than standard PETG.' },
        { name: 'Elongation at Break', value: '120-150', unit: '%', implications: 'Excellent flexibility - same as standard PETG.' },
        { name: 'Heat Deflection', value: '70-80', unit: '°C', implications: 'Same heat resistance as standard PETG.' },
        { name: 'Density', value: '1.27', unit: 'g/cm³', implications: 'Same as standard PETG.' },
      ],
      notes: 'Mechanical properties similar to standard PETG - improvements are in printability.',
    },
    printSettings: {
      nozzleTemp: { min: 230, max: 260, optimal: 245 },
      bedTemp: { min: 70, max: 85, optimal: 80 },
      coolingFan: { min: 30, max: 70, notes: 'Moderate cooling - less than PLA, more than ABS.' },
      enclosure: { required: false, notes: 'Not required but helps with larger parts.' },
      drying: { temp: 65, duration: '4-6 hours', notes: 'Important - PETG is hygroscopic.' },
      printSpeed: { recommended: '40-60 mm/s', notes: 'Similar to standard PETG, some brands handle faster.' },
      additionalNotes: [
        'Settings similar to standard PETG',
        'May allow faster retraction without stringing',
        'Some brands print well at lower temps',
        'Test your specific brand for optimal settings',
      ],
    },
    adhesion: {
      bedSurfaces: {
        excellent: ['PEI', 'Glass with glue stick', 'BuildTak'],
        good: ['Textured PEI', 'Glass with hairspray'],
        poor: ['Blue tape', 'Bare glass'],
      },
      releaseAgents: 'Glue stick helps prevent PETG from bonding too strongly to PEI.',
      multiMaterial: [
        { material: 'PETG', bondQuality: 'Strong Chemical Bond', notes: 'Excellent compatibility.' },
        { material: 'PETG-CF', bondQuality: 'Strong Chemical Bond', notes: 'Works well together.' },
        { material: 'PVA', bondQuality: 'Weak Bond', notes: 'Not ideal for supports.' },
      ],
    },
    postProcessing: {
      chemicalSmoothing: [{ method: 'MEK vapor', effectiveness: 'Difficult', notes: 'Possible but difficult and hazardous.' }],
      mechanical: ['Sanding', 'Filing', 'Cutting', 'Polishing for clarity'],
      painting: 'Accepts paint well after light sanding. Clear coat for gloss finish.',
      glues: ['CA glue', 'Epoxy', 'Solvent welding with MEK'],
    },
    safety: {
      fumes: { level: 'Low', notes: 'Same as standard PETG.' },
      foodSafety: { rating: 'Possible with Certification', notes: 'Same as standard PETG - check specific certifications.' },
      biodegradability: { rating: 'Not Biodegradable', notes: 'Petroleum-based, recyclable.' },
      additionalNotes: [
        'Safe for normal printing',
        'Basic ventilation sufficient',
        'Check food safety certifications if needed',
      ],
    },
  },

  'PETG Iridescent': {
    name: 'PETG Iridescent',
    fullName: 'Iridescent/Multicolor Shifting PETG',
    origin: {
      yearInvented: '2019-2020',
      originalCompany: 'Multiple manufacturers - eSUN, Eryone, TTYT3D, Geeetech',
      keyMilestones: [
        '2017: Color-shifting "silk" PLA gains popularity',
        '2019: Manufacturers apply iridescent effects to PETG',
        '2020: "Galaxy", "Rainbow", and "Multicolor" PETG variants appear',
        '2022+: Advanced multicolor shifting formulations refined',
      ],
      majorManufacturers: ['eSUN', 'Eryone', 'TTYT3D', 'Geeetech', 'SUNLU', 'Overture'],
    },
    composition: {
      basePolymer: 'Standard PETG (Polyethylene Terephthalate Glycol)',
      chemicalFamily: 'Glycol-Modified Polyester',
      keyAdditives: ['Interference pigments', 'Mica flakes', 'Pearlescent particles', 'Color-shifting compounds'],
      coloringAgents: 'Multi-layer interference pigments that reflect different wavelengths based on viewing angle',
      specialFillers: ['Microscopic mica platelets', 'Metallic oxide coatings'],
    },
    familyContext: {
      parentPolymer: 'Standard PETG with specialty pigments',
      variants: ['PETG Iridescent', 'PETG Rainbow', 'PETG Galaxy', 'PETG Multicolor', 'PETG Chameleon'],
      chemicalComparison: 'Same PETG base polymer with specialty interference pigments instead of standard colorants.',
      evolution: 'Developed to bring popular silk/iridescent effects from PLA to more durable PETG.',
    },
    strengths: {
      uniqueProperties: ['Color shifts based on viewing angle', 'Eye-catching visual effects', 'Retains PETG durability', 'Unique aesthetic appeal'],
      bestUseScenarios: ['Display pieces', 'Decorative items', 'Jewelry', 'Art projects', 'Gift items'],
      advantagesOverCompetitors: ['More durable than iridescent PLA', 'Better heat resistance', 'Functional AND beautiful', 'Water resistant'],
      whyChooseThis: 'When you want stunning color-shifting effects but need more durability than PLA.',
    },
    weaknesses: {
      limitations: ['Effect intensity varies by brand', 'May obscure fine details', 'Limited color selection', 'Premium pricing'],
      commonProblems: ['Inconsistent color shift between batches', 'Pigments may affect layer adhesion slightly', 'Can be stringy'],
      environmentalConcerns: ['Pigments may complicate recycling', 'Petroleum-based'],
      whenNotToUse: ['Precision mechanical parts', 'When consistent color is critical', 'Budget-conscious projects'],
    },
    practicalContext: {
      industryAdoption: ['Decorative printing', 'Cosplay', 'Art and design', 'Consumer products'],
      commonApplications: ['Vases', 'Display models', 'Jewelry', 'Decorative boxes', 'Art pieces', 'Figurines'],
      safetyStandards: ['Same as standard PETG', 'Pigments may affect food safety'],
      costPosition: 'Premium',
    },
    trivia: {
      funFacts: [
        'The color-shifting effect is created by microscopic interference layers',
        'Same technology used in car paint and cosmetics',
        'Effect is strongest on curved surfaces where viewing angle changes',
        'Layer lines can actually enhance the color-shifting effect',
      ],
      whyInvented: 'To combine the popular silk/iridescent aesthetics with PETG\'s superior durability.',
      controversies: [
        'Effect intensity varies significantly between brands',
        '"Iridescent" vs "Rainbow" vs "Galaxy" names are marketing distinctions',
      ],
      marketAdoption: 'Growing niche for decorative and display printing.',
    },
    tdsProfile: {
      properties: [
        { name: 'Tensile Strength', value: '45-50', unit: 'MPa', implications: 'Slightly reduced vs standard due to pigments.' },
        { name: 'Impact Strength', value: '6-8', unit: 'kJ/m²', implications: 'Good impact resistance retained.' },
        { name: 'Elongation at Break', value: '100-130', unit: '%', implications: 'Good flexibility maintained.' },
        { name: 'Heat Deflection', value: '70-78', unit: '°C', implications: 'Same as standard PETG.' },
        { name: 'Density', value: '1.28-1.30', unit: 'g/cm³', implications: 'Slightly higher due to pigments.' },
      ],
      notes: 'Mechanical properties similar to standard PETG with minor variations from pigment loading.',
    },
    printSettings: {
      nozzleTemp: { min: 230, max: 260, optimal: 245 },
      bedTemp: { min: 70, max: 85, optimal: 80 },
      coolingFan: { min: 30, max: 60, notes: 'Moderate cooling - higher may reduce color effect intensity.' },
      enclosure: { required: false, notes: 'Not required.' },
      drying: { temp: 65, duration: '4-6 hours', notes: 'Same as standard PETG - still hygroscopic.' },
      printSpeed: { recommended: '40-60 mm/s', notes: 'Slower speeds may improve color effect visibility.' },
      additionalNotes: [
        'Settings similar to standard PETG',
        'Slower speeds showcase color effects better',
        'Use larger nozzles for better pigment flow',
        'Avoid excessive retraction to minimize stringing',
      ],
    },
    adhesion: {
      bedSurfaces: {
        excellent: ['PEI', 'Glass with glue stick'],
        good: ['Textured PEI', 'BuildTak'],
        poor: ['Blue tape', 'Bare glass'],
      },
      releaseAgents: 'Glue stick recommended for easy removal.',
      multiMaterial: [
        { material: 'PETG', bondQuality: 'Strong Chemical Bond', notes: 'Excellent compatibility.' },
        { material: 'PVA', bondQuality: 'Weak Bond', notes: 'Not ideal for supports.' },
      ],
    },
    postProcessing: {
      chemicalSmoothing: [{ method: 'Not recommended', effectiveness: 'Not Possible', notes: 'May damage pigment effect.' }],
      mechanical: ['Light sanding only', 'Polishing can enhance effect'],
      painting: 'Not recommended - would cover the color-shifting effect.',
      glues: ['CA glue', 'Epoxy'],
    },
    safety: {
      fumes: { level: 'Low', notes: 'Same as standard PETG.' },
      foodSafety: { rating: 'Not Recommended', notes: 'Specialty pigments may not be food-safe.' },
      biodegradability: { rating: 'Not Biodegradable', notes: 'Petroleum-based.' },
      additionalNotes: [
        'Safe for normal printing',
        'Basic ventilation sufficient',
        'Not recommended for food contact due to pigments',
      ],
    },
  },

  'Pro PETG': {
    name: 'Pro PETG',
    fullName: 'Professional Grade PETG',
    origin: {
      yearInvented: '2018-2019',
      originalCompany: 'NinjaTek (initial Pro PETG formulations), followed by MatterHackers, Polymaker',
      keyMilestones: [
        '2016: PETG becomes mainstream 3D printing material',
        '2018: Pro/Professional grade PETG variants introduced',
        '2019: Major manufacturers launch "Pro" PETG lines',
        '2021+: Formulations optimized for industrial and professional use',
      ],
      majorManufacturers: ['NinjaTek', 'MatterHackers', 'Polymaker', 'ColorFabb', 'Prusament', 'Atomic'],
    },
    composition: {
      basePolymer: 'High-purity PETG (Polyethylene Terephthalate Glycol)',
      chemicalFamily: 'Glycol-Modified Polyester',
      keyAdditives: ['Process stabilizers', 'Flow enhancers', 'Anti-degradation compounds', 'Clarity agents'],
      coloringAgents: 'Premium pigments with strict color consistency control',
      specialFillers: ['Impact modifiers', 'Nucleating agents for crystallinity control'],
    },
    familyContext: {
      parentPolymer: 'High-purity PETG with professional-grade processing',
      variants: ['Pro PETG', 'Premium PETG', 'Industrial PETG', 'Technical PETG'],
      chemicalComparison: 'Same base polymer as standard PETG but with tighter quality control and premium additives.',
      evolution: 'Developed for professional users demanding consistent, reliable results.',
    },
    strengths: {
      uniqueProperties: ['Exceptional batch consistency', 'Superior clarity', 'Reduced stringing', 'Better dimensional accuracy'],
      bestUseScenarios: ['Production parts', 'Professional prototypes', 'Clear containers', 'Critical applications'],
      advantagesOverCompetitors: ['More consistent than standard PETG', 'Better quality control', 'Superior optical clarity', 'Reliable results'],
      whyChooseThis: 'When consistency and reliability matter more than price - professional and production applications.',
    },
    weaknesses: {
      limitations: ['Higher cost than standard PETG', 'Same heat resistance limitations', 'Still scratches easily'],
      commonProblems: ['Premium price may not be justified for hobbyist use', 'Requires proper storage'],
      environmentalConcerns: ['Same as standard PETG - petroleum based'],
      whenNotToUse: ['Cost-sensitive projects', 'Non-critical applications', 'Learning/experimentation'],
    },
    practicalContext: {
      industryAdoption: ['Professional prototyping', 'Production runs', 'Industrial applications', 'Medical device prototypes'],
      commonApplications: ['Production parts', 'Clear enclosures', 'Functional prototypes', 'End-use parts', 'Medical containers'],
      safetyStandards: ['Often comes with certifications', 'Tighter quality documentation'],
      costPosition: 'Premium',
    },
    trivia: {
      funFacts: [
        '"Pro" grade typically means tighter diameter tolerance (±0.02mm vs ±0.05mm)',
        'Moisture content is often guaranteed below specific thresholds',
        'Some Pro PETG is certified for medical device prototyping',
        'Batch-to-batch color consistency is a major selling point',
      ],
      whyInvented: 'To serve professional users who need reliable, consistent results for production use.',
      controversies: [
        'Definition of "Pro" varies by manufacturer',
        'Price premium can be substantial (30-50% more)',
        'Quality difference may be subtle for hobbyist use',
      ],
      marketAdoption: 'Strong adoption in professional printing environments and print farms.',
    },
    tdsProfile: {
      properties: [
        { name: 'Tensile Strength', value: '50-55', unit: 'MPa', implications: 'Same or better than standard PETG.' },
        { name: 'Impact Strength', value: '8-10', unit: 'kJ/m²', implications: 'Excellent impact resistance.' },
        { name: 'Elongation at Break', value: '120-150', unit: '%', implications: 'Excellent flexibility.' },
        { name: 'Heat Deflection', value: '70-80', unit: '°C', implications: 'Standard PETG heat resistance.' },
        { name: 'Diameter Tolerance', value: '±0.02', unit: 'mm', implications: 'Tighter than standard ±0.05mm.' },
      ],
      notes: 'Mechanical properties similar to standard PETG - advantages are in consistency and quality control.',
    },
    printSettings: {
      nozzleTemp: { min: 230, max: 260, optimal: 245 },
      bedTemp: { min: 70, max: 85, optimal: 80 },
      coolingFan: { min: 30, max: 70, notes: 'Moderate cooling.' },
      enclosure: { required: false, notes: 'Not required but helps with large parts.' },
      drying: { temp: 65, duration: '4-6 hours', notes: 'Often ships dry - check packaging.' },
      printSpeed: { recommended: '40-70 mm/s', notes: 'Handles speeds well due to consistent diameter.' },
      additionalNotes: [
        'Settings similar to standard PETG',
        'Consistent diameter allows precise flow settings',
        'Often pre-dried - maintain storage to preserve',
        'Follow manufacturer recommendations',
      ],
    },
    adhesion: {
      bedSurfaces: {
        excellent: ['PEI', 'Glass with glue stick'],
        good: ['Textured PEI', 'BuildTak'],
        poor: ['Blue tape', 'Bare glass'],
      },
      releaseAgents: 'Glue stick for easy release.',
      multiMaterial: [
        { material: 'PETG', bondQuality: 'Strong Chemical Bond', notes: 'Excellent compatibility.' },
        { material: 'PETG-CF', bondQuality: 'Strong Chemical Bond', notes: 'Works well.' },
        { material: 'PVA', bondQuality: 'Weak Bond', notes: 'Not ideal.' },
      ],
    },
    postProcessing: {
      chemicalSmoothing: [{ method: 'MEK vapor', effectiveness: 'Difficult', notes: 'Same as standard PETG.' }],
      mechanical: ['Sanding', 'Polishing', 'Machining'],
      painting: 'Excellent paint adhesion after light sanding.',
      glues: ['CA glue', 'Epoxy', 'Solvent welding'],
    },
    safety: {
      fumes: { level: 'Low', notes: 'Same as standard PETG.' },
      foodSafety: { rating: 'Possible with Certification', notes: 'Often certified - check documentation.' },
      biodegradability: { rating: 'Not Biodegradable', notes: 'Recyclable.' },
      additionalNotes: [
        'Safe for normal printing',
        'Often comes with material certifications',
        'Check specific product documentation',
      ],
    },
  },

  'rPETG': {
    name: 'rPETG',
    fullName: 'Recycled PETG (Polyethylene Terephthalate Glycol)',
    origin: {
      yearInvented: '2019-2020',
      originalCompany: 'Multiple manufacturers responding to sustainability demands - Prusament, Greengate3D, FilaCycle',
      keyMilestones: [
        '2018: Sustainability focus grows in 3D printing community',
        '2019: First recycled PETG filaments appear',
        '2020: Major brands launch rPETG product lines',
        '2021+: Recycling processes improve, quality approaches virgin PETG',
      ],
      majorManufacturers: ['Prusament', 'Greengate3D', 'FilaCycle', 'Re-fresh3D', '3D Fuel'],
    },
    composition: {
      basePolymer: 'Recycled PETG from post-consumer and post-industrial waste',
      chemicalFamily: 'Glycol-Modified Polyester (Recycled)',
      keyAdditives: ['Stabilizers to compensate for recycling degradation', 'Chain extenders', 'Processing aids'],
      coloringAgents: 'Often limited to darker colors or natural/translucent to mask recycled content variation',
      specialFillers: ['Impact modifiers to restore properties'],
    },
    familyContext: {
      parentPolymer: 'Recycled PETG from PET bottles and industrial scrap',
      variants: ['rPETG', 'Recycled PETG', 'Eco PETG', 'Sustainable PETG'],
      chemicalComparison: 'Same base polymer as virgin PETG but sourced from recycled materials.',
      evolution: 'Developed to reduce plastic waste and offer environmentally conscious printing options.',
    },
    strengths: {
      uniqueProperties: ['Environmentally friendly', 'Diverts plastic from landfills', 'Comparable properties to virgin PETG', 'Reduced carbon footprint'],
      bestUseScenarios: ['Eco-conscious projects', 'Prototyping', 'Non-critical parts', 'Sustainable product development'],
      advantagesOverCompetitors: ['Lower environmental impact', 'Supports circular economy', 'Often cheaper than virgin', 'Good marketing angle'],
      whyChooseThis: 'When sustainability matters and you want to reduce your environmental impact without sacrificing too much performance.',
    },
    weaknesses: {
      limitations: ['May have slight property reduction vs virgin', 'Color options often limited', 'Batch variation possible', 'May contain contaminants'],
      commonProblems: ['Slightly inconsistent between batches', 'May be more brittle than virgin', 'Limited transparency options'],
      environmentalConcerns: ['Still plastic - just recycled', 'Recycling process uses energy'],
      whenNotToUse: ['Critical structural parts', 'When maximum clarity needed', 'Precision applications requiring consistency'],
    },
    practicalContext: {
      industryAdoption: ['Sustainable product development', 'Eco-conscious prototyping', 'Educational institutions', 'Green certifications'],
      commonApplications: ['Prototypes', 'Non-critical parts', 'Educational projects', 'Eco-friendly products', 'General printing'],
      safetyStandards: ['Varies by source material', 'Some certifications available'],
      costPosition: 'Standard',
    },
    trivia: {
      funFacts: [
        'One kg of rPETG typically saves 1.5-2 kg of CO2 emissions vs virgin',
        'Most rPETG comes from recycled PET bottles (same family)',
        'Quality has improved dramatically since 2019',
        'Some rPETG is 100% post-consumer waste',
      ],
      whyInvented: 'To address environmental concerns and create circular economy for 3D printing materials.',
      controversies: [
        'Quality vs virgin PETG debated',
        'Not all "recycled" PETG is equal',
        '"Recycled" claims sometimes hard to verify',
      ],
      marketAdoption: 'Growing rapidly as sustainability becomes priority for makers and businesses.',
    },
    tdsProfile: {
      properties: [
        { name: 'Tensile Strength', value: '45-50', unit: 'MPa', implications: 'Slightly lower than virgin PETG.' },
        { name: 'Impact Strength', value: '5-8', unit: 'kJ/m²', implications: 'May be slightly more brittle.' },
        { name: 'Elongation at Break', value: '80-120', unit: '%', implications: 'Reduced flexibility vs virgin.' },
        { name: 'Heat Deflection', value: '70-78', unit: '°C', implications: 'Same heat resistance.' },
        { name: 'Density', value: '1.27', unit: 'g/cm³', implications: 'Same as virgin PETG.' },
      ],
      notes: 'Properties typically 85-95% of virgin PETG - acceptable for most applications.',
    },
    printSettings: {
      nozzleTemp: { min: 235, max: 265, optimal: 250 },
      bedTemp: { min: 70, max: 85, optimal: 80 },
      coolingFan: { min: 30, max: 70, notes: 'Same as standard PETG.' },
      enclosure: { required: false, notes: 'Not required.' },
      drying: { temp: 65, duration: '6-8 hours', notes: 'May need longer drying due to processing history.' },
      printSpeed: { recommended: '40-55 mm/s', notes: 'Slightly slower than virgin recommended.' },
      additionalNotes: [
        'May need slightly higher temps than virgin',
        'Drying is important - recycled material can retain moisture',
        'Test small prints first to dial in settings',
        'Expect some batch variation',
      ],
    },
    adhesion: {
      bedSurfaces: {
        excellent: ['PEI', 'Glass with glue stick'],
        good: ['Textured PEI', 'BuildTak'],
        poor: ['Blue tape', 'Bare glass'],
      },
      releaseAgents: 'Glue stick recommended.',
      multiMaterial: [
        { material: 'PETG', bondQuality: 'Strong Chemical Bond', notes: 'Bonds well with virgin PETG.' },
        { material: 'PVA', bondQuality: 'Weak Bond', notes: 'Not ideal.' },
      ],
    },
    postProcessing: {
      chemicalSmoothing: [{ method: 'MEK vapor', effectiveness: 'Difficult', notes: 'Same as virgin PETG.' }],
      mechanical: ['Sanding', 'Filing', 'Polishing'],
      painting: 'Takes paint well after light sanding.',
      glues: ['CA glue', 'Epoxy'],
    },
    safety: {
      fumes: { level: 'Low', notes: 'Same as standard PETG.' },
      foodSafety: { rating: 'Not Recommended', notes: 'Recycled content makes food safety certification difficult.' },
      biodegradability: { rating: 'Not Biodegradable', notes: 'Still plastic, but recycled.' },
      additionalNotes: [
        'Safe for normal printing',
        'Environmental benefit is main advantage',
        'Not recommended for food contact',
      ],
    },
  },

  'ESD-PETG': {
    name: 'ESD-PETG',
    fullName: 'Electrostatic Discharge Safe PETG',
    origin: {
      yearInvented: '2018-2019',
      originalCompany: '3DXTech, LEHVOSS (Luvocom), Polymaker',
      keyMilestones: [
        '2015: ESD-safe 3D printing materials emerge for industry',
        '2018: ESD-PETG formulations developed',
        '2019: Commercial ESD-PETG products launched',
        '2021+: Growing adoption in electronics manufacturing and automotive',
      ],
      majorManufacturers: ['3DXTech', 'LEHVOSS', 'Polymaker', 'Kimya', 'Ultrafuse'],
    },
    composition: {
      basePolymer: 'PETG (Polyethylene Terephthalate Glycol)',
      chemicalFamily: 'Glycol-Modified Polyester',
      keyAdditives: ['Carbon black', 'Carbon nanotubes', 'Conductive carbon fibers', 'Antistatic agents'],
      coloringAgents: 'Typically black or dark gray due to carbon additives',
      specialFillers: ['Conductive carbon particles (10-25%)', 'Carbon nanotubes for consistent conductivity'],
    },
    familyContext: {
      parentPolymer: 'Standard PETG with conductive additives',
      variants: ['ESD-PETG', 'Conductive PETG', 'Antistatic PETG', 'Static Dissipative PETG'],
      chemicalComparison: 'PETG base with carbon additives that create conductive pathways throughout the material.',
      evolution: 'Developed to meet ESD requirements in electronics and semiconductor industries.',
    },
    strengths: {
      uniqueProperties: ['Static dissipation (10^6-10^9 Ω)', 'Protects sensitive electronics', 'Consistent surface resistivity', 'Good mechanical properties'],
      bestUseScenarios: ['Electronics handling', 'ESD-safe tooling', 'Semiconductor fixtures', 'Cleanroom equipment'],
      advantagesOverCompetitors: ['Easier to print than ESD-ABS', 'Better chemical resistance', 'Consistent ESD properties', 'Good layer adhesion'],
      whyChooseThis: 'When you need ESD protection for electronics handling but want easier printing than ESD-ABS or ESD-PC.',
    },
    weaknesses: {
      limitations: ['Only black/dark colors available', 'More expensive than standard PETG', 'Slightly reduced impact strength', 'Requires hardened nozzle'],
      commonProblems: ['Carbon can wear brass nozzles', 'Surface finish is matte/rough', 'May leave carbon residue'],
      environmentalConcerns: ['Carbon additives complicate recycling', 'Petroleum-based'],
      whenNotToUse: ['Decorative parts', 'When color variety needed', 'Non-ESD applications', 'Budget projects'],
    },
    practicalContext: {
      industryAdoption: ['Electronics manufacturing', 'Semiconductor industry', 'Automotive assembly', 'Aerospace production'],
      commonApplications: ['ESD-safe trays', 'Component holders', 'Test fixtures', 'Assembly jigs', 'Handling tools', 'Cleanroom equipment'],
      safetyStandards: ['ANSI/ESD S20.20', 'IEC 61340', 'ESD Association standards'],
      costPosition: 'Premium',
    },
    trivia: {
      funFacts: [
        'ESD damage costs electronics industry billions annually',
        'Surface resistivity must be 10^6-10^9 Ω to be "static dissipative"',
        'Carbon content is carefully calibrated - too much makes it conductive, too little ineffective',
        'ESD-safe parts can be tested with a simple surface resistance meter',
      ],
      whyInvented: 'To provide ESD protection for electronics handling with the ease of PETG printing.',
      controversies: [
        'ESD properties can vary across the part',
        'Not all ESD-PETG meets industry standards',
        'Testing and certification requirements vary',
      ],
      marketAdoption: 'Standard material in electronics manufacturing for printed fixtures and tooling.',
    },
    tdsProfile: {
      properties: [
        { name: 'Surface Resistivity', value: '10^6-10^9', unit: 'Ω', implications: 'Static dissipative range - safe for electronics.' },
        { name: 'Tensile Strength', value: '40-48', unit: 'MPa', implications: 'Reduced from standard PETG due to fillers.' },
        { name: 'Impact Strength', value: '4-6', unit: 'kJ/m²', implications: 'Reduced due to carbon content.' },
        { name: 'Heat Deflection', value: '70-75', unit: '°C', implications: 'Similar to standard PETG.' },
        { name: 'Carbon Content', value: '15-25', unit: '%', implications: 'Higher content = better ESD but more brittle.' },
      ],
      notes: 'ESD properties are the key spec - mechanical properties reduced from base PETG.',
    },
    printSettings: {
      nozzleTemp: { min: 240, max: 270, optimal: 255 },
      bedTemp: { min: 70, max: 90, optimal: 85 },
      coolingFan: { min: 20, max: 50, notes: 'Lower cooling than standard PETG for better adhesion.' },
      enclosure: { required: false, notes: 'Recommended for best results.' },
      drying: { temp: 65, duration: '6-8 hours', notes: 'Critical - moisture affects both printing and ESD properties.' },
      printSpeed: { recommended: '30-50 mm/s', notes: 'Slower than standard PETG due to carbon content.' },
      additionalNotes: [
        'Hardened nozzle required - carbon is abrasive',
        'Higher temps than standard PETG',
        'Drying is critical for ESD properties',
        'Test ESD properties after printing',
        'First layer adhesion can be challenging',
      ],
    },
    adhesion: {
      bedSurfaces: {
        excellent: ['PEI with glue stick', 'Garolite'],
        good: ['Textured PEI', 'Glass with glue stick'],
        poor: ['Bare glass', 'Blue tape'],
      },
      releaseAgents: 'Glue stick often needed for release.',
      multiMaterial: [
        { material: 'PETG', bondQuality: 'Weak Bond', notes: 'Carbon content may affect adhesion.' },
        { material: 'PVA', bondQuality: 'Weak Bond', notes: 'Not recommended.' },
      ],
    },
    postProcessing: {
      chemicalSmoothing: [{ method: 'Not recommended', effectiveness: 'Not Possible', notes: 'May affect ESD properties.' }],
      mechanical: ['Light sanding only', 'Avoid contamination of ESD surface'],
      painting: 'Not recommended - paint will insulate and negate ESD properties.',
      glues: ['Conductive adhesives preferred', 'Regular CA glue creates insulating bonds'],
    },
    safety: {
      fumes: { level: 'Moderate', notes: 'Carbon particles may be released - ventilation recommended.' },
      foodSafety: { rating: 'Not Safe', notes: 'Carbon additives make this unsuitable for food contact.' },
      biodegradability: { rating: 'Not Biodegradable', notes: 'Petroleum-based with carbon additives.' },
      additionalNotes: [
        'Good ventilation recommended',
        'Carbon dust may be released when sanding',
        'Wash hands after handling',
        'Not for food contact',
      ],
    },
  },

  'PET': {
    name: 'PET',
    fullName: 'Polyethylene Terephthalate',
    origin: {
      yearInvented: '1941',
      originalCompany: 'John Rex Whinfield and James Tennant Dickson (Calico Printers\' Association, UK)',
      keyMilestones: [
        '1941: PET first synthesized by Whinfield and Dickson',
        '1946: DuPont acquires rights and develops Dacron polyester fiber',
        '1973: First PET bottles patented by Nathaniel Wyeth (DuPont)',
        '1977: PET bottles commercialized for carbonated beverages',
        '2020+: Recycled PET (rPET) filaments enter 3D printing market',
      ],
      majorManufacturers: ['Indorama Ventures', 'Alpek', 'Far Eastern New Century', 'Toray', 'Polymaker', 'colorFabb'],
    },
    composition: {
      basePolymer: 'Polyethylene Terephthalate (PET)',
      chemicalFamily: 'Polyester (Aromatic)',
      keyAdditives: ['Crystallization inhibitors (for amorphous PET)', 'Nucleating agents (for semi-crystalline)', 'UV stabilizers'],
      coloringAgents: 'Water-clear when amorphous, milky when crystalline',
      specialFillers: ['Carbon fiber (PET-CF)', 'Glass fiber (PET-GF)', 'Recycled content (rPET)'],
    },
    familyContext: {
      parentPolymer: 'Base polyester from which PETG, PET-G, and other copolyesters derive',
      variants: ['Amorphous PET', 'Semi-crystalline PET', 'rPET (recycled)', 'PETG (glycol-modified)', 'PET-CF', 'PET-GF'],
      chemicalComparison: 'Parent polymer to PETG. Higher crystallinity potential gives better chemical and heat resistance than PETG but harder to print.',
      evolution: 'World\'s most recycled plastic. PETG was developed to make PET more printable by reducing crystallinity.',
    },
    strengths: {
      uniqueProperties: ['Excellent barrier properties', 'High crystallinity possible', 'Superior chemical resistance to PETG', 'FDA food-contact approved', 'Highly recyclable'],
      bestUseScenarios: ['Food containers', 'Recyclable prototypes', 'High-clarity parts', 'Chemical-resistant containers', 'Sustainable manufacturing'],
      advantagesOverCompetitors: ['Better chemical resistance than PETG when crystallized', 'Most recycled plastic worldwide', 'Excellent optical clarity', 'Food-safe and sustainable'],
      whyChooseThis: 'When you need recyclability, food safety, or want to work with recycled materials - PET is the sustainable choice.',
    },
    weaknesses: {
      limitations: ['Crystallization during printing causes warping/whitening', 'Narrower print window than PETG', 'Requires careful temperature control', 'Less impact resistant than PETG'],
      commonProblems: ['Crystallization shrinkage', 'Parts turning cloudy/white', 'Warping', 'Layer adhesion issues', 'Brittleness when crystallized'],
      environmentalConcerns: ['Petroleum-based (virgin)', 'Microplastic concerns', 'Recycling contamination issues'],
      whenNotToUse: ['When PETG works', 'Impact-critical parts', 'Beginners', 'Without temperature control'],
    },
    practicalContext: {
      industryAdoption: ['Beverage packaging', 'Food containers', 'Textile fibers (polyester)', 'Films and sheets', '3D printing (growing)'],
      commonApplications: ['Water bottles', 'Food containers', 'Polyester fabric', 'Thermoformed packaging', 'Sustainable prototypes'],
      safetyStandards: ['FDA food contact approved', 'EU 10/2011 compliant', 'Recycling code #1 - most recycled plastic'],
      costPosition: 'Standard',
    },
    trivia: {
      funFacts: [
        'PET is the world\'s most recycled plastic - recycling code #1',
        'About 70% of carbonated drink bottles are made from PET',
        'One recycled PET bottle can be made into 7 T-shirts worth of fiber',
        'Annual PET production exceeds 30 million tonnes globally',
        'The "polyester" in your clothes is typically PET fiber',
      ],
      whyInvented: 'Originally developed as synthetic fiber (Terylene/Dacron), later adapted for packaging due to excellent barrier properties.',
      controversies: [
        'rPET quality varies significantly - affects print quality',
        'Some "PET" filaments are actually PETG or blends',
        'Crystallization behavior makes true PET difficult to print',
        'Single-use plastic concerns despite recyclability',
      ],
      marketAdoption: 'Growing interest due to sustainability. rPET filaments increasingly popular for eco-conscious makers.',
    },
    tdsProfile: {
      properties: [
        { name: 'Tensile Strength', value: '55-80', unit: 'MPa', implications: 'Good to excellent. Higher when semi-crystalline.' },
        { name: 'Elongation at Break', value: '70-300', unit: '%', implications: 'High for amorphous, lower for crystalline. Material is ductile.' },
        { name: "Young's Modulus", value: '2800-3500', unit: 'MPa', implications: 'Good stiffness - stiffer than PETG when crystallized.' },
        { name: 'Impact Strength', value: '13-35', unit: 'kJ/m² (Notched)', implications: 'Moderate. Less impact resistant than PETG.' },
        { name: 'Glass Transition (Tg)', value: '67-81', unit: '°C', implications: 'Similar to PETG. Above this, crystallization can occur.' },
        { name: 'Melting Point (Tm)', value: '250-260', unit: '°C', implications: 'PET has a true melting point unlike amorphous PETG.' },
        { name: 'Heat Deflection (HDT)', value: '65-75', unit: '°C (amorphous) / 200+ °C (crystalline)', implications: 'Amorphous similar to PETG. Crystalline PET has excellent heat resistance.' },
      ],
      notes: 'Properties vary dramatically between amorphous and semi-crystalline states. Print settings critical for controlling crystallinity.',
    },
    printSettings: {
      nozzleTemp: { min: 250, max: 280, optimal: 265 },
      bedTemp: { min: 70, max: 90, optimal: 80 },
      coolingFan: { min: 30, max: 70, notes: 'Cooling helps prevent crystallization and keeps parts clear.' },
      enclosure: { required: false, notes: 'Not required but stable temperature helps prevent crystallization issues.' },
      drying: { temp: 65, duration: '4-6 hours', notes: 'Hygroscopic - must dry before printing.' },
      printSpeed: { recommended: '40-60 mm/s', notes: 'Moderate speeds. Slower cooling can cause crystallization.' },
      additionalNotes: [
        'Temperature control critical - too hot causes crystallization',
        'Rapid cooling helps maintain amorphous (clear) state',
        'May crystallize on heated bed - lower bed temp if cloudy',
        'Similar to PETG but less forgiving',
        'rPET may have inconsistent properties - adjust as needed',
      ],
    },
    adhesion: {
      bedSurfaces: {
        excellent: ['PEI (Textured)', 'Glass with adhesive'],
        good: ['BuildTak', 'Blue tape'],
        poor: ['Bare smooth PEI (may bond too well)'],
      },
      releaseAgents: 'Glue stick as release agent on smooth PEI.',
      multiMaterial: [
        { material: 'PETG', bondQuality: 'Strong Chemical Bond', notes: 'Same polymer family - excellent compatibility.' },
        { material: 'PLA', bondQuality: 'No Bond', notes: 'Different polymer families - not compatible.' },
        { material: 'PVA', bondQuality: 'Weak Bond', notes: 'Limited support material compatibility.' },
      ],
    },
    postProcessing: {
      chemicalSmoothing: [
        { method: 'Dichloromethane', effectiveness: 'Good', notes: 'Works but extremely toxic. Professional only.' },
        { method: 'Heat Treatment', effectiveness: 'Good', notes: 'Annealing can improve crystallinity and heat resistance.' },
      ],
      mechanical: ['Sands well', 'Polishes to high clarity', 'Can be machined', 'Heat bends easily'],
      glues: ['Cyanoacrylate', 'Epoxy', 'E6000'],
      painting: 'Accepts paint after light sanding. Clear parts can be polished to high gloss.',
    },
    safety: {
      fumes: { level: 'Low', notes: 'Low emissions similar to PETG. Generally safe with normal ventilation.' },
      foodSafety: { rating: 'FDA Approved', notes: 'PET is FDA food contact approved. Widely used in food packaging.' },
      biodegradability: { rating: 'Not Biodegradable', notes: 'Not biodegradable but highly recyclable (Type 1). Most recycled plastic worldwide.' },
      additionalNotes: [
        'Safe for food contact (virgin PET)',
        'Recycled PET (rPET) may have contaminants - check certification',
        'One of the safest plastics for printing',
        'Recyclable through municipal programs',
      ],
    },
  },

  'PET-CF': {
    name: 'PET-CF',
    fullName: 'Carbon Fiber Reinforced Polyethylene Terephthalate',
    origin: {
      yearInvented: '2019+',
      originalCompany: 'Various composite filament manufacturers',
      keyMilestones: [
        '2019: First PET-CF composites enter market',
        '2020: Adoption as PETG-CF alternative with higher crystallinity potential',
        '2021+: Growing interest for recyclable high-performance parts',
        '2023+: rPET-CF variants emerging for sustainability',
      ],
      majorManufacturers: ['3DXTech', 'Polymaker', 'colorFabb', 'BASF Forward AM'],
    },
    composition: {
      basePolymer: 'Polyethylene Terephthalate (PET)',
      chemicalFamily: 'Polyester + Carbon Fiber Composite',
      keyAdditives: ['Short carbon fibers (15-20%)', 'Crystallization modifiers', 'Coupling agents'],
      coloringAgents: 'Black from carbon fiber content',
      specialFillers: ['Chopped carbon fiber (typically 15-20% by weight)'],
    },
    familyContext: {
      parentPolymer: 'PET base enhanced with carbon fiber reinforcement',
      variants: ['PET-CF15', 'PET-CF20', 'rPET-CF (recycled base)'],
      chemicalComparison: 'Higher potential heat resistance than PETG-CF if crystallized. More sustainable base material.',
      evolution: 'Developed as higher-performance alternative to PETG-CF with better thermal properties.',
    },
    strengths: {
      uniqueProperties: ['High stiffness', 'Potential for high heat resistance', 'Recyclable base material', 'Good dimensional stability', 'Low warping'],
      bestUseScenarios: ['Structural prototypes', 'Stiff fixtures', 'Sustainable high-performance parts', 'Heat-resistant components', 'Recyclable tooling'],
      advantagesOverCompetitors: ['Better heat potential than PETG-CF', 'Recyclable base vs other CF composites', 'Good chemical resistance', 'Dimensional stability'],
      whyChooseThis: 'When you need PETG-CF performance with better heat resistance potential or sustainability focus.',
    },
    weaknesses: {
      limitations: ['Harder to print than PETG-CF', 'Crystallization issues possible', 'Abrasive to nozzles', 'Limited vendor options'],
      commonProblems: ['Crystallization if overheated', 'Parts turning cloudy', 'Nozzle wear', 'Less forgiving than PETG-CF'],
      environmentalConcerns: ['Carbon fiber not recyclable', 'Composite recycling challenges'],
      whenNotToUse: ['When PETG-CF works fine', 'Impact-critical parts', 'Beginners', 'Without hardened nozzle'],
    },
    practicalContext: {
      industryAdoption: ['Sustainable manufacturing', 'Prototyping', 'Industrial fixtures', 'Automotive'],
      commonApplications: ['Structural brackets', 'Fixtures and jigs', 'Eco-conscious prototypes', 'Stiff enclosures'],
      safetyStandards: ['Generally not food-safe due to CF content', 'Recyclability testing available'],
      costPosition: 'Premium',
    },
    trivia: {
      funFacts: [
        'rPET-CF combines recycled bottles with carbon fiber for sustainable performance',
        'Properly crystallized PET-CF can exceed PETG-CF heat resistance significantly',
        'Carbon fiber addition helps suppress warping issues inherent to PET',
        'One of the few high-performance composites with a recyclable base',
      ],
      whyInvented: 'To create a carbon fiber composite with better thermal properties and sustainability than PETG-CF.',
      controversies: [
        'Some "PET-CF" is actually PETG-CF - check specifications',
        'Crystallization behavior makes printing more challenging',
        'Sustainability claims complicated by non-recyclable CF',
      ],
      marketAdoption: 'Niche but growing, especially among sustainability-focused manufacturers.',
    },
    tdsProfile: {
      properties: [
        { name: 'Tensile Strength', value: '70-100', unit: 'MPa', implications: 'Good increase from carbon fiber reinforcement.' },
        { name: 'Elongation at Break', value: '2-5', unit: '%', implications: 'Low - carbon fiber creates stiff, less ductile material.' },
        { name: "Young's Modulus", value: '8000-12000', unit: 'MPa', implications: 'Significantly stiffer than neat PET or PETG-CF.' },
        { name: 'Impact Strength', value: '5-10', unit: 'kJ/m² (Notched)', implications: 'Reduced by carbon fiber. Not for impact applications.' },
        { name: 'Glass Transition (Tg)', value: '70-80', unit: '°C', implications: 'Similar to base PET. Crystallization can improve.' },
        { name: 'Heat Deflection (HDT)', value: '80-100', unit: '°C (amorphous) / 180+ °C (crystalline)', implications: 'Potential for very high HDT if properly crystallized.' },
        { name: 'Density', value: '1.30-1.40', unit: 'g/cm³', implications: 'Higher than neat PET due to carbon fiber content.' },
      ],
      notes: 'Thermal properties depend heavily on crystallinity state. Annealing can dramatically improve heat resistance.',
    },
    printSettings: {
      nozzleTemp: { min: 260, max: 290, optimal: 275 },
      bedTemp: { min: 70, max: 90, optimal: 80 },
      coolingFan: { min: 30, max: 60, notes: 'Cooling helps prevent unwanted crystallization during printing.' },
      enclosure: { required: false, notes: 'Not required but helps with temperature consistency.' },
      drying: { temp: 65, duration: '4-6 hours', notes: 'Hygroscopic - dry thoroughly before printing.' },
      printSpeed: { recommended: '35-55 mm/s', notes: 'Moderate speeds for consistent extrusion.' },
      additionalNotes: [
        'HARDENED NOZZLE REQUIRED - Carbon fiber is abrasive',
        'Control cooling to prevent crystallization during print',
        'Post-print annealing can improve heat resistance',
        'Slightly harder to print than PETG-CF',
        'Monitor for white/cloudy appearance indicating crystallization',
      ],
    },
    adhesion: {
      bedSurfaces: {
        excellent: ['PEI (Textured)', 'Glass with adhesive'],
        good: ['BuildTak', 'G10/FR4'],
        poor: ['Bare smooth surfaces'],
      },
      releaseAgents: 'Glue stick as release agent if adhesion too strong.',
      multiMaterial: [
        { material: 'PET/PETG', bondQuality: 'Strong Chemical Bond', notes: 'Same polymer family - good compatibility.' },
        { material: 'Other CF composites', bondQuality: 'Weak Bond', notes: 'Mechanical bond only.' },
      ],
    },
    postProcessing: {
      chemicalSmoothing: [
        { method: 'Chemical Smoothing', effectiveness: 'Difficult', notes: 'CF content limits chemical smoothing options.' },
        { method: 'Annealing', effectiveness: 'Good', notes: 'Heat treatment can improve crystallinity and heat resistance.' },
      ],
      mechanical: ['Sands carefully', 'Machines well', 'Can be drilled/tapped', 'Carbon dust requires PPE'],
      glues: ['Epoxy', 'Cyanoacrylate', 'Polyester-compatible adhesives'],
      painting: 'Carbon fiber surface provides mechanical adhesion. Light sanding recommended.',
    },
    safety: {
      fumes: { level: 'Low', notes: 'PET base has low emissions. Carbon fiber dust hazard during post-processing.' },
      foodSafety: { rating: 'Not Food Safe', notes: 'Carbon fiber content makes this unsuitable for food contact.' },
      biodegradability: { rating: 'Not Biodegradable', notes: 'Composite cannot be recycled through normal streams.' },
      additionalNotes: [
        'Carbon fiber dust is a respiratory hazard',
        'Wear PPE during sanding and machining',
        'Ventilation recommended during printing',
        'Base PET is recyclable but CF contaminates stream',
      ],
    },
  },

  'PET-GF': {
    name: 'PET-GF',
    fullName: 'Glass Fiber Reinforced Polyethylene Terephthalate',
    origin: {
      yearInvented: '2019+',
      originalCompany: 'Various composite manufacturers',
      keyMilestones: [
        '2019: Glass fiber PET composites introduced for 3D printing',
        '2020: Adoption as cost-effective PETG-GF alternative',
        '2021+: Growing use in sustainable high-performance applications',
        '2023+: rPET-GF variants for maximum sustainability',
      ],
      majorManufacturers: ['3DXTech', 'Polymaker', 'colorFabb', 'BASF'],
    },
    composition: {
      basePolymer: 'Polyethylene Terephthalate (PET)',
      chemicalFamily: 'Polyester + Glass Fiber Composite',
      keyAdditives: ['Short glass fibers (20-30%)', 'Coupling agents', 'Crystallization modifiers'],
      coloringAgents: 'Natural off-white to gray, can be colored',
      specialFillers: ['Chopped E-glass fibers (typically 25-30% by weight)'],
    },
    familyContext: {
      parentPolymer: 'PET base enhanced with glass fiber for stiffness and thermal performance',
      variants: ['PET-GF20', 'PET-GF30', 'rPET-GF (recycled base)'],
      chemicalComparison: 'Higher thermal performance than PETG-GF with potential for crystallization benefits. More sustainable base.',
      evolution: 'Developed as sustainable alternative to engineering composites with good thermal properties.',
    },
    strengths: {
      uniqueProperties: ['Excellent stiffness', 'High heat resistance potential', 'Recyclable base material', 'Good creep resistance', 'Isotropic properties'],
      bestUseScenarios: ['Structural applications', 'Heat-resistant parts', 'Sustainable manufacturing', 'Industrial fixtures', 'High-temp enclosures'],
      advantagesOverCompetitors: ['Higher HDT than PETG-GF when crystallized', 'Sustainable base material', 'Lower cost than CF', 'More isotropic than CF versions'],
      whyChooseThis: 'When you need stiff, potentially heat-resistant parts with a sustainable PET base material.',
    },
    weaknesses: {
      limitations: ['Crystallization challenges', 'Abrasive to nozzles', 'Heavier than CF versions', 'Limited color options'],
      commonProblems: ['Parts whitening during print', 'Nozzle wear', 'Surface finish rough', 'Less forgiving than PETG-GF'],
      environmentalConcerns: ['Glass fiber not recyclable', 'Composite recycling challenging'],
      whenNotToUse: ['Smooth surface finish required', 'Weight-critical applications', 'Beginners', 'Without hardened nozzle'],
    },
    practicalContext: {
      industryAdoption: ['Sustainable manufacturing', 'Industrial prototyping', 'Fixtures and tooling', 'Automotive'],
      commonApplications: ['Structural brackets', 'Industrial fixtures', 'Heat-resistant housings', 'Sustainable prototypes'],
      safetyStandards: ['Generally not food-safe due to fiber content', 'Recyclability testing available for base material'],
      costPosition: 'Standard',
    },
    trivia: {
      funFacts: [
        'Glass fiber addition helps combat the warping issues of neat PET',
        'rPET-GF represents one of the most sustainable reinforced filaments available',
        'Glass fibers provide more isotropic properties than carbon fiber',
        'Higher glass loading can push HDT above 200°C when properly crystallized',
      ],
      whyInvented: 'To provide a cost-effective, sustainable reinforced polyester with high-temperature potential.',
      controversies: [
        'Some products labeled PET-GF are actually PETG-GF',
        'Sustainability claims complicated by glass fiber non-recyclability',
        'Crystallization control remains challenging for many users',
      ],
      marketAdoption: 'Growing among eco-conscious manufacturers seeking sustainable high-performance materials.',
    },
    tdsProfile: {
      properties: [
        { name: 'Tensile Strength', value: '80-120', unit: 'MPa', implications: 'Excellent. Glass fiber provides significant strength improvement.' },
        { name: 'Elongation at Break', value: '2-4', unit: '%', implications: 'Low - material is stiff and somewhat brittle.' },
        { name: "Young's Modulus", value: '6000-9000', unit: 'MPa', implications: 'High stiffness - glass fiber very effective for rigidity.' },
        { name: 'Impact Strength', value: '8-15', unit: 'kJ/m² (Notched)', implications: 'Moderate - better than CF versions typically.' },
        { name: 'Glass Transition (Tg)', value: '70-80', unit: '°C', implications: 'Similar to base PET.' },
        { name: 'Heat Deflection (HDT)', value: '90-120', unit: '°C (amorphous) / 200+ °C (crystalline)', implications: 'Excellent when crystallized. Glass fiber dramatically improves thermal performance.' },
        { name: 'Density', value: '1.45-1.60', unit: 'g/cm³', implications: 'Higher than CF versions due to glass density.' },
      ],
      notes: 'Glass fiber provides exceptional HDT improvement. Proper annealing can unlock high-temp performance.',
    },
    printSettings: {
      nozzleTemp: { min: 260, max: 290, optimal: 275 },
      bedTemp: { min: 70, max: 90, optimal: 80 },
      coolingFan: { min: 30, max: 60, notes: 'Cooling helps maintain amorphous state during printing.' },
      enclosure: { required: false, notes: 'Not required but helps with large parts.' },
      drying: { temp: 65, duration: '4-6 hours', notes: 'Dry thoroughly - moisture affects extrusion.' },
      printSpeed: { recommended: '35-50 mm/s', notes: 'Moderate speeds for consistent glass fiber distribution.' },
      additionalNotes: [
        'HARDENED NOZZLE REQUIRED - Glass fiber is very abrasive',
        'Print settings similar to PETG-GF but less forgiving',
        'Monitor for crystallization (white appearance)',
        'Post-print annealing possible for improved HDT',
        'Higher fiber content increases abrasion and stiffness',
      ],
    },
    adhesion: {
      bedSurfaces: {
        excellent: ['PEI (Textured)', 'Glass with adhesive'],
        good: ['BuildTak', 'G10/FR4'],
        poor: ['Bare smooth surfaces'],
      },
      releaseAgents: 'Glue stick if adhesion too strong after cooling.',
      multiMaterial: [
        { material: 'PET/PETG', bondQuality: 'Strong Chemical Bond', notes: 'Same polymer family - compatible.' },
        { material: 'PET-CF', bondQuality: 'Strong Chemical Bond', notes: 'Both PET-based - good bonding.' },
      ],
    },
    postProcessing: {
      chemicalSmoothing: [
        { method: 'Chemical Methods', effectiveness: 'Difficult', notes: 'Glass fiber content limits chemical options.' },
        { method: 'Annealing', effectiveness: 'Good', notes: 'Heat treatment significantly improves thermal properties.' },
      ],
      mechanical: ['Sands with difficulty', 'Machines well', 'Can be drilled/tapped', 'Glass dust requires PPE'],
      glues: ['Epoxy', 'Cyanoacrylate', 'Polyester adhesives'],
      painting: 'Textured surface provides mechanical adhesion. Prime for best results.',
    },
    safety: {
      fumes: { level: 'Low', notes: 'PET base has low emissions. Glass fiber dust is irritating.' },
      foodSafety: { rating: 'Not Food Safe', notes: 'Glass fiber content makes this unsuitable for food contact.' },
      biodegradability: { rating: 'Not Biodegradable', notes: 'Composite material - cannot be recycled through normal streams.' },
      additionalNotes: [
        'Glass fiber dust irritates skin and respiratory system',
        'Wear gloves and mask during post-processing',
        'Less hazardous than carbon fiber but still requires care',
        'Base PET is recyclable but GF contaminates stream',
      ],
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

  'FR-ABS': {
    name: 'FR-ABS',
    fullName: 'Flame Retardant Acrylonitrile Butadiene Styrene',
    origin: {
      yearInvented: '1960s (industrial), 2018+ (3D printing)',
      originalCompany: 'Various industrial plastics manufacturers',
      keyMilestones: [
        '1948: ABS polymer developed',
        '1960s: Flame retardant grades developed for electronics and aviation',
        '2018-2020: FR-ABS filaments become commercially available',
        '2021+: Growing adoption for certified applications',
      ],
      majorManufacturers: ['SABIC', 'Covestro', '3DXTech', 'Polymaker', 'Ultimaker', 'Stratasys'],
    },
    composition: {
      basePolymer: 'ABS (Acrylonitrile Butadiene Styrene)',
      chemicalFamily: 'Flame Retardant Styrenic Polymer',
      keyAdditives: ['Brominated flame retardants', 'Phosphorus-based FR additives', 'Antimony trioxide (synergist)', 'Char-forming agents'],
      coloringAgents: 'Limited colors - typically white, black, or natural due to FR additive interference',
      specialFillers: ['Halogenated compounds', 'Metal hydroxides', 'Intumescent additives'],
    },
    familyContext: {
      parentPolymer: 'Standard ABS modified with flame retardant additives',
      variants: ['FR-ABS V0', 'FR-ABS V2', 'FR-ABS HB', 'FR-ABS 5VA'],
      chemicalComparison: 'Same mechanical properties as ABS but self-extinguishing when ignited.',
      evolution: 'Developed for electrical and electronic enclosures requiring UL certification.',
    },
    strengths: {
      uniqueProperties: ['Self-extinguishing (stops burning when flame removed)', 'UL94 certified grades', 'Meets regulatory requirements', 'Similar processing to ABS'],
      bestUseScenarios: ['Electronics enclosures', 'Electrical junction boxes', 'Appliance housings', 'Transportation interiors', 'Aerospace components'],
      advantagesOverCompetitors: ['Regulatory compliance for fire safety', 'Required for many commercial applications', 'Maintains ABS processing characteristics'],
      whyChooseThis: 'When fire safety certification is mandatory - electronics, transportation, or commercial building applications.',
    },
    weaknesses: {
      limitations: ['More expensive than standard ABS', 'Reduced impact strength', 'Limited color options', 'FR additives can affect layer adhesion'],
      commonProblems: ['Slight reduction in mechanical properties', 'May require higher print temperatures', 'Some formulations more brittle', 'Older halogenated FRs are environmental concern'],
      environmentalConcerns: ['Brominated FRs are persistent pollutants', 'Difficult to recycle', 'Halogen emissions if burned improperly', 'Newer phosphorus-based grades are greener'],
      whenNotToUse: ['When fire rating not required (use standard ABS)', 'Food contact applications', 'When maximum impact strength needed'],
    },
    practicalContext: {
      industryAdoption: ['Electronics', 'Aerospace', 'Automotive', 'Railway', 'Medical devices', 'Commercial appliances'],
      commonApplications: ['TV housings', 'Computer enclosures', 'Electrical panels', 'Aircraft interior parts', 'Train components', 'Server racks'],
      safetyStandards: ['UL94 V0/V1/V2/5VA ratings', 'FAR 25.853 (aviation)', 'EN 45545 (railway)', 'IEC 60695 (fire hazard testing)'],
      costPosition: 'Premium',
    },
    trivia: {
      funFacts: [
        'UL94 V0 rating means the material self-extinguishes in under 10 seconds',
        'The "5VA" rating is the most stringent - material cannot drip flaming particles',
        'FR-ABS is mandatory in most commercial electronics sold in the US and EU',
        'Modern phosphorus-based FR grades are replacing older brominated formulations',
      ],
      whyInvented: 'Created to meet fire safety regulations for consumer electronics and transportation.',
      controversies: [
        'Brominated flame retardants (BFRs) are being phased out due to environmental persistence',
        'Some cheap "FR-ABS" products lack proper certification',
        'Fire testing certification is expensive - not all claims are verified',
        'Recycling FR-ABS separately from regular ABS is critical but rarely done',
      ],
      marketAdoption: 'Essential material for any application requiring fire safety certification.',
    },
    tdsProfile: {
      properties: [
        { name: 'Tensile Strength', value: '35-45', unit: 'MPa', implications: 'Slightly reduced from standard ABS due to FR additives.' },
        { name: 'Elongation at Break', value: '8-20', unit: '%', implications: 'Reduced ductility compared to standard ABS.' },
        { name: "Young's Modulus", value: '2000-2500', unit: 'MPa', implications: 'Similar stiffness to standard ABS.' },
        { name: 'Impact Strength (Notched)', value: '100-180', unit: 'J/m', implications: 'Reduced from standard ABS - FR additives create stress concentrators.' },
        { name: 'UL94 Rating', value: 'V0/V1/V2', unit: '', implications: 'Self-extinguishing within specified time (V0 = <10 sec).' },
        { name: 'Glass Transition (Tg)', value: '100-105', unit: '°C', implications: 'Same heat resistance as standard ABS.' },
      ],
      notes: 'Properties vary based on FR additive type and loading. Always verify UL certification for actual applications.',
    },
    printSettings: {
      nozzleTemp: { min: 235, max: 265, optimal: 250 },
      bedTemp: { min: 95, max: 110, optimal: 100 },
      coolingFan: { min: 0, max: 25, notes: 'Minimal cooling like standard ABS. FR additives may affect layer adhesion.' },
      enclosure: { required: true, notes: 'Required - same warping concerns as ABS. HEPA+carbon filtration strongly recommended.' },
      drying: { temp: 80, duration: '4-6 hours', notes: 'Critical - moisture affects both printability and final properties.' },
      printSpeed: { recommended: '35-55 mm/s', notes: 'Slightly slower than standard ABS for better layer adhesion.' },
      additionalNotes: [
        'Print in well-ventilated area with filtration - FR additives may produce additional fumes',
        'Use brim for adhesion - warping behavior similar to ABS',
        'Let parts cool slowly to avoid stress cracking',
        'Verify print parameters with specific manufacturer datasheet',
      ],
    },
    adhesion: {
      bedSurfaces: {
        excellent: ['PEI (Textured)', 'Garolite (G10)', 'ABS slurry'],
        good: ['Glass with glue stick', 'Kapton tape'],
        poor: ['Bare glass', 'Blue tape'],
      },
      releaseAgents: 'ABS slurry or glue stick recommended. Same adhesion characteristics as standard ABS.',
      multiMaterial: [
        { material: 'ABS', bondQuality: 'Strong Chemical Bond', notes: 'Same polymer base - excellent compatibility.' },
        { material: 'ABS-CF', bondQuality: 'Strong Chemical Bond', notes: 'Both ABS-based materials bond well.' },
        { material: 'HIPS', bondQuality: 'Strong Chemical Bond', notes: 'Can use HIPS as dissolvable support.' },
      ],
    },
    postProcessing: {
      chemicalSmoothing: [
        { method: 'Acetone Vapor', effectiveness: 'Good', notes: 'Works like standard ABS but FR additives may affect surface finish.' },
        { method: 'Acetone Brush', effectiveness: 'Good', notes: 'Effective for local smoothing.' },
      ],
      mechanical: ['Sands like standard ABS', 'Can be machined', 'Drilling and tapping work well'],
      glues: ['Acetone welding effective', 'Cyanoacrylate works', 'ABS cement creates strong joints'],
      painting: 'Good paint adhesion. Prime first for best results.',
    },
    safety: {
      fumes: { level: 'High', notes: 'Standard ABS fumes PLUS potential FR additive emissions. HEPA+activated carbon filtration required.' },
      foodSafety: { rating: 'Not Safe', notes: 'Not suitable for food contact - FR additives and styrene concerns.' },
      biodegradability: { rating: 'Not Biodegradable', notes: 'Petroleum-based with persistent FR additives. Specialized disposal required.' },
      additionalNotes: [
        'Print with proper ventilation and filtration - FR additives may emit additional compounds',
        'Brominated FR grades should not be burned or incinerated without proper controls',
        'Dispose of waste properly - do not mix with regular ABS recycling',
        'Modern halogen-free grades (phosphorus-based) have better environmental profile',
      ],
    },
  },

  'ESD-ABS': {
    name: 'ESD-ABS',
    fullName: 'Electrostatic Dissipative Acrylonitrile Butadiene Styrene',
    origin: {
      yearInvented: '1980s (industrial), 2017+ (3D printing)',
      originalCompany: 'Various industrial plastics manufacturers',
      keyMilestones: [
        '1948: ABS polymer developed',
        '1980s: ESD grades developed for electronics manufacturing',
        '2017-2019: ESD-ABS filaments become commercially available',
        '2020+: Widely adopted for electronics handling and cleanroom applications',
      ],
      majorManufacturers: ['3DXTech', 'Polymaker', 'Stratasys', 'Ultimaker', 'Kimya', 'Filamentive'],
    },
    composition: {
      basePolymer: 'ABS (Acrylonitrile Butadiene Styrene)',
      chemicalFamily: 'Conductive Styrenic Polymer',
      keyAdditives: ['Carbon black', 'Carbon nanotubes', 'Conductive fibers', 'Graphene (some formulations)'],
      coloringAgents: 'Typically black only due to carbon additives',
      specialFillers: ['Carbon-based conductive additives (5-15%)', 'Sometimes stainless steel fibers'],
    },
    familyContext: {
      parentPolymer: 'Standard ABS with conductive additives',
      variants: ['ESD-ABS (10^6-10^9 Ω)', 'Conductive ABS (10^2-10^4 Ω)', 'Static Dissipative ABS'],
      chemicalComparison: 'Similar to ABS-CF but optimized for consistent electrical properties rather than mechanical reinforcement.',
      evolution: 'Developed for electronics industry to prevent electrostatic discharge damage to sensitive components.',
    },
    strengths: {
      uniqueProperties: ['Controlled surface resistivity (10^6-10^9 Ω)', 'Prevents ESD damage', 'Consistent conductivity', 'Cleanroom compatible'],
      bestUseScenarios: ['Electronics handling trays', 'Component carriers', 'Test fixtures', 'Cleanroom equipment', 'Antistatic enclosures'],
      advantagesOverCompetitors: ['Permanent ESD protection (not humidity dependent)', 'Consistent resistivity throughout part', 'Processable like standard ABS'],
      whyChooseThis: 'When protecting sensitive electronics from static discharge is critical - semiconductors, PCB handling, or cleanroom applications.',
    },
    weaknesses: {
      limitations: ['Black color only', 'Slightly reduced impact strength', 'More expensive than standard ABS', 'Requires hardened nozzle (some grades)'],
      commonProblems: ['Surface resistivity can vary with layer orientation', 'Carbon can cause slight nozzle wear', 'Limited color options'],
      environmentalConcerns: ['Not recyclable with standard ABS', 'Carbon additives complicate disposal', 'Petroleum-based'],
      whenNotToUse: ['When ESD protection not required', 'Aesthetic applications requiring color', 'Food contact'],
    },
    practicalContext: {
      industryAdoption: ['Semiconductor manufacturing', 'Electronics assembly', 'Aerospace', 'Medical device manufacturing', 'Automotive electronics'],
      commonApplications: ['IC chip trays', 'PCB handling fixtures', 'Electronic component bins', 'Test equipment housings', 'Cleanroom tools'],
      safetyStandards: ['ANSI/ESD S20.20', 'IEC 61340', 'MIL-PRF-81705 (military packaging)', 'JEDEC standards'],
      costPosition: 'Premium',
    },
    trivia: {
      funFacts: [
        'ESD damage costs the electronics industry billions of dollars annually',
        'Surface resistivity between 10^6 and 10^9 ohms is the "sweet spot" for ESD dissipation',
        'Unlike antistatic sprays, ESD-ABS provides permanent protection',
        'Some chips can be damaged by as little as 10 volts of static discharge',
      ],
      whyInvented: 'Created to prevent electrostatic discharge damage during electronics manufacturing and handling.',
      controversies: [
        'Some "ESD" filaments only provide surface treatment, not through-part conductivity',
        'Resistivity can vary between manufacturers - always verify specifications',
        'Carbon content affects both ESD properties and mechanical strength',
      ],
      marketAdoption: 'Essential in semiconductor and electronics manufacturing industries.',
    },
    tdsProfile: {
      properties: [
        { name: 'Surface Resistivity', value: '10^6 - 10^9', unit: 'Ω/sq', implications: 'Static dissipative range - safely drains static without sparking.' },
        { name: 'Volume Resistivity', value: '10^5 - 10^8', unit: 'Ω·cm', implications: 'Conductivity through the entire part, not just surface.' },
        { name: 'Tensile Strength', value: '35-45', unit: 'MPa', implications: 'Slightly reduced from standard ABS due to carbon loading.' },
        { name: 'Elongation at Break', value: '5-15', unit: '%', implications: 'Reduced ductility compared to standard ABS.' },
        { name: 'Impact Strength (Notched)', value: '100-180', unit: 'J/m', implications: 'Good but lower than standard ABS.' },
        { name: 'Glass Transition (Tg)', value: '100-105', unit: '°C', implications: 'Same heat resistance as standard ABS.' },
      ],
      notes: 'Resistivity values critical for ESD applications. Always verify with manufacturer specifications.',
    },
    printSettings: {
      nozzleTemp: { min: 240, max: 265, optimal: 250 },
      bedTemp: { min: 95, max: 110, optimal: 100 },
      coolingFan: { min: 0, max: 30, notes: 'Minimal cooling like standard ABS.' },
      enclosure: { required: true, notes: 'Required - same warping concerns as ABS.' },
      drying: { temp: 80, duration: '4-6 hours', notes: 'Critical - moisture affects both printability and electrical properties.' },
      printSpeed: { recommended: '40-60 mm/s', notes: 'Similar to standard ABS.' },
      additionalNotes: [
        'Hardened nozzle recommended for high-carbon grades',
        'Use brim for adhesion',
        'Ground your printer frame when printing ESD parts',
        'Test resistivity of printed parts before critical applications',
      ],
    },
    adhesion: {
      bedSurfaces: {
        excellent: ['PEI (Textured)', 'Garolite (G10)', 'ABS slurry'],
        good: ['Glass with glue stick', 'Kapton tape'],
        poor: ['Bare glass', 'Blue tape'],
      },
      releaseAgents: 'ABS slurry or glue stick. Same adhesion as standard ABS.',
      multiMaterial: [
        { material: 'ABS', bondQuality: 'Strong Chemical Bond', notes: 'Same polymer base - good compatibility.' },
        { material: 'ABS-CF', bondQuality: 'Strong Chemical Bond', notes: 'Both carbon-filled ABS variants.' },
        { material: 'HIPS', bondQuality: 'Strong Chemical Bond', notes: 'Can use HIPS as dissolvable support.' },
      ],
    },
    postProcessing: {
      chemicalSmoothing: [
        { method: 'Acetone Vapor', effectiveness: 'Good', notes: 'Works but may affect surface conductivity slightly.' },
      ],
      mechanical: ['Sanding possible but may affect ESD properties', 'Machine with care - avoid contaminating conductive pathways'],
      glues: ['Acetone welding works', 'Cyanoacrylate may affect local conductivity', 'Conductive epoxy for critical joints'],
      painting: 'Not recommended - paint will insulate the surface and defeat ESD properties.',
    },
    safety: {
      fumes: { level: 'Moderate', notes: 'Standard ABS fumes plus carbon particulates. Good ventilation required.' },
      foodSafety: { rating: 'Not Safe', notes: 'Not suitable for food contact - carbon additives and styrene.' },
      biodegradability: { rating: 'Not Biodegradable', notes: 'Petroleum-based with carbon additives.' },
      additionalNotes: [
        'Carbon black is generally considered safe but avoid inhaling dust',
        'Same ventilation requirements as standard ABS',
        'Dispose properly - do not mix with regular ABS recycling',
      ],
    },
  },

  'ABS HT': {
    name: 'ABS HT',
    fullName: 'High Temperature Acrylonitrile Butadiene Styrene',
    origin: {
      yearInvented: '2000s (industrial), 2018+ (3D printing)',
      originalCompany: 'Various advanced plastics manufacturers',
      keyMilestones: [
        '1948: Standard ABS developed',
        '2000s: High-heat ABS grades developed for automotive',
        '2018-2020: ABS HT filaments become commercially available',
        '2021+: Growing adoption for under-hood and industrial applications',
      ],
      majorManufacturers: ['Polymaker', '3DXTech', 'Ultimaker', 'BASF', 'FormFutura', 'Fillamentum'],
    },
    composition: {
      basePolymer: 'Modified ABS or ABS/PC blend',
      chemicalFamily: 'High-Performance Styrenic Polymer',
      keyAdditives: ['Heat stabilizers', 'Alpha-methylstyrene copolymers', 'Sometimes polycarbonate blend'],
      coloringAgents: 'Various colors available, though some may reduce heat performance',
      specialFillers: ['Heat-resistant additives', 'Some grades include glass or mineral fillers'],
    },
    familyContext: {
      parentPolymer: 'Enhanced ABS with improved thermal properties',
      variants: ['ABS HT', 'ABS HT+', 'High-Heat ABS', 'ABS/PC Blend'],
      chemicalComparison: 'Higher Tg than standard ABS (115-120°C vs 100-105°C), approaching polycarbonate territory.',
      evolution: 'Developed to bridge the gap between standard ABS and engineering polymers like PC.',
    },
    strengths: {
      uniqueProperties: ['Higher heat deflection temperature', 'Improved dimensional stability at temperature', 'Better creep resistance', 'Maintains ABS processability'],
      bestUseScenarios: ['Under-hood automotive parts', 'Industrial equipment', 'Appliance components near heat sources', 'Electronics in warm environments'],
      advantagesOverCompetitors: ['Higher heat resistance than standard ABS', 'Easier to print than PC', 'Acetone smoothable', 'Good balance of properties'],
      whyChooseThis: 'When standard ABS heat resistance is insufficient but full polycarbonate is overkill or too difficult to print.',
    },
    weaknesses: {
      limitations: ['More expensive than standard ABS', 'Still requires enclosure', 'Not as heat resistant as PC', 'Some grades have reduced impact'],
      commonProblems: ['Warping (similar to ABS)', 'May require higher bed temps', 'Some formulations more brittle'],
      environmentalConcerns: ['Petroleum-based', 'Not biodegradable', 'Styrene fumes during printing'],
      whenNotToUse: ['When standard ABS heat resistance is adequate', 'Applications above 120°C (use PC instead)', 'Budget-constrained projects'],
    },
    practicalContext: {
      industryAdoption: ['Automotive', 'Aerospace', 'Industrial equipment', 'Appliances', 'Electronics'],
      commonApplications: ['Under-hood automotive parts', 'Heat-resistant enclosures', 'Industrial tooling', 'Appliance components', 'LED housings'],
      safetyStandards: ['Various automotive heat aging standards', 'UL94 ratings available on some grades'],
      costPosition: 'Premium',
    },
    trivia: {
      funFacts: [
        'ABS HT can survive temperatures that would deform standard ABS in under an hour',
        'Many ABS HT grades are actually ABS/PC blends - combining best of both',
        'The alpha-methylstyrene modification raises Tg without major processing changes',
        'Used in automotive for parts that sit near the engine or in hot climates',
      ],
      whyInvented: 'Created to extend ABS into higher-temperature applications without moving to more difficult engineering polymers.',
      controversies: [
        'Definition of "HT" varies widely - always check actual HDT specifications',
        'Some "ABS HT" is just standard ABS with marketing claims',
        'ABS/PC blends may not acetone smooth as well as pure ABS',
      ],
      marketAdoption: 'Growing as automotive and industrial applications demand higher thermal performance.',
    },
    tdsProfile: {
      properties: [
        { name: 'Glass Transition (Tg)', value: '115-125', unit: '°C', implications: 'Significantly higher than standard ABS (100-105°C).' },
        { name: 'Heat Deflection (HDT)', value: '105-115', unit: '°C (0.45 MPa)', implications: 'Major improvement over standard ABS (~95°C).' },
        { name: 'Tensile Strength', value: '40-50', unit: 'MPa', implications: 'Similar to standard ABS.' },
        { name: 'Elongation at Break', value: '10-20', unit: '%', implications: 'Similar ductility to standard ABS.' },
        { name: 'Impact Strength (Notched)', value: '150-250', unit: 'J/m', implications: 'Good impact resistance, may be slightly reduced in some formulations.' },
        { name: 'Vicat Softening', value: '110-120', unit: '°C', implications: 'Temperature at which material begins to soften under load.' },
      ],
      notes: 'Properties vary by formulation. ABS/PC blends may have different characteristics than modified ABS.',
    },
    printSettings: {
      nozzleTemp: { min: 245, max: 275, optimal: 260 },
      bedTemp: { min: 100, max: 115, optimal: 110 },
      coolingFan: { min: 0, max: 25, notes: 'Minimal cooling. Higher temps mean more warping sensitivity.' },
      enclosure: { required: true, notes: 'Required. Higher bed temps and chamber temps (50-65°C) recommended.' },
      drying: { temp: 80, duration: '4-6 hours', notes: 'Hygroscopic - dry before printing.' },
      printSpeed: { recommended: '40-60 mm/s', notes: 'Similar to standard ABS but first layer should be slow.' },
      additionalNotes: [
        'Higher chamber temperature recommended (50-65°C) vs standard ABS (45-55°C)',
        'Use generous brim - warping more aggressive than standard ABS',
        'Cool down slowly after print completion',
        'Some ABS/PC blends may require even higher temps',
      ],
    },
    adhesion: {
      bedSurfaces: {
        excellent: ['PEI (Textured)', 'Garolite (G10)', 'ABS slurry'],
        good: ['Glass with glue stick (high temp)', 'Kapton tape'],
        poor: ['Bare glass', 'Blue tape (melts at high bed temps)'],
      },
      releaseAgents: 'ABS slurry or heavy glue application. May stick very aggressively - let cool completely before removal.',
      multiMaterial: [
        { material: 'ABS', bondQuality: 'Strong Chemical Bond', notes: 'Compatible polymer family.' },
        { material: 'PC', bondQuality: 'Strong Chemical Bond', notes: 'Especially for ABS/PC blend grades.' },
        { material: 'HIPS', bondQuality: 'Strong Chemical Bond', notes: 'Can use HIPS as dissolvable support.' },
      ],
    },
    postProcessing: {
      chemicalSmoothing: [
        { method: 'Acetone Vapor', effectiveness: 'Good', notes: 'Works well for pure ABS HT. ABS/PC blends may be more resistant.' },
        { method: 'Acetone Brush', effectiveness: 'Good', notes: 'Effective for local smoothing.' },
      ],
      mechanical: ['Sands well', 'Can be machined', 'Higher heat resistance means better stability during finishing'],
      glues: ['Acetone welding for pure ABS grades', 'Cyanoacrylate works well', 'Epoxy for structural joints'],
      painting: 'Good paint adhesion. Same finishing as standard ABS.',
    },
    safety: {
      fumes: { level: 'Moderate', notes: 'Similar to ABS. Higher print temps may increase emissions slightly. Ventilation required.' },
      foodSafety: { rating: 'Not Recommended', notes: 'Same concerns as standard ABS.' },
      biodegradability: { rating: 'Not Biodegradable', notes: 'Petroleum-based polymer.' },
      additionalNotes: [
        'Same safety precautions as standard ABS',
        'Higher print temperatures may increase VOC emissions',
        'Use with enclosed printer and filtration',
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

  'ASA+': {
    name: 'ASA+',
    fullName: 'Enhanced Acrylonitrile Styrene Acrylate',
    origin: {
      yearInvented: '2018+ (3D printing formulation)',
      originalCompany: 'Multiple filament manufacturers - not a standardized formula',
      keyMilestones: [
        '1970s: ASA polymer developed by BASF',
        '2016-2018: ASA gains popularity in 3D printing',
        '2019+: ASA+ variants emerge from various manufacturers',
        '2021+: Becomes popular "easy-print ASA" option',
      ],
      majorManufacturers: ['Polymaker', 'eSUN', 'Fillamentum', 'FormFutura', 'Prusament'],
    },
    composition: {
      basePolymer: 'ASA with proprietary additives',
      chemicalFamily: 'Modified Styrenic Polymer',
      keyAdditives: ['Anti-warping agents', 'Flow enhancers', 'Impact modifiers', 'Enhanced UV stabilizers'],
      coloringAgents: 'Full color range available, weather-stable pigments',
      specialFillers: ['Varies by manufacturer - some add rubber modifiers for impact'],
    },
    familyContext: {
      parentPolymer: 'Enhanced version of standard ASA',
      variants: ['ASA+ (generic)', 'ASA Pro', 'ASA Premium', 'Easy ASA'],
      chemicalComparison: 'Similar to ASA but with reduced warping tendency and improved layer adhesion.',
      evolution: 'Created to address the printability challenges of standard ASA for hobbyists.',
    },
    strengths: {
      uniqueProperties: ['Reduced warping vs standard ASA', 'Better layer adhesion', 'Easier to print', 'Maintains UV resistance'],
      bestUseScenarios: ['Outdoor functional parts', 'Automotive exterior', 'Garden fixtures', 'Weatherproof enclosures'],
      advantagesOverCompetitors: ['Easier than standard ASA', 'Better than ABS+ for outdoor use', 'Still UV resistant', 'Lower printing difficulty'],
      whyChooseThis: 'When you want ASA UV-resistance but find regular ASA too difficult to print reliably.',
    },
    weaknesses: {
      limitations: ['Still requires enclosure (usually)', 'Still emits styrene fumes', '"+" formulation not standardized', 'Properties vary by brand'],
      commonProblems: ['Still can warp (just less)', 'Inconsistent quality between manufacturers', 'Some ASA+ is barely different from ASA'],
      environmentalConcerns: ['Same environmental concerns as ASA', 'Petroleum-based', 'Fumes contain VOCs'],
      whenNotToUse: ['When ventilation unavailable', 'If pure ASA certification required', 'Indoor-only applications (use ABS+ instead)'],
    },
    practicalContext: {
      industryAdoption: ['Consumer outdoor products', 'Prototyping', 'DIY/Maker community', 'Small-batch manufacturing'],
      commonApplications: ['Outdoor enclosures', 'Garden tool parts', 'Automotive trim', 'Weatherproof housings', 'Solar accessories'],
      safetyStandards: ['Generally not certified - formulation varies', 'Some manufacturers provide UV aging data'],
      costPosition: 'Standard',
    },
    trivia: {
      funFacts: [
        'There is no industry standard for "ASA+" - each manufacturer has their own formula',
        'Some ASA+ is just well-made ASA with better quality control',
        'The "+" usually refers to reduced warping, not UV improvement (already excellent)',
        'Printing tests show 30-50% less warping compared to budget ASA brands',
      ],
      whyInvented: 'Created to make ASA accessible to hobbyists without industrial enclosures.',
      controversies: [
        '"ASA+" naming is marketing - no standard definition exists',
        'Quality varies dramatically between manufacturers',
        'Some charge premium prices for minimal improvements over standard ASA',
      ],
      marketAdoption: 'Popular with makers who want outdoor-capable parts without the ASA learning curve.',
    },
    tdsProfile: {
      properties: [
        { name: 'Tensile Strength', value: '40-48', unit: 'MPa', implications: 'Similar to ASA. Good general-purpose strength.' },
        { name: 'Elongation at Break', value: '20-40', unit: '%', implications: 'Good ductility before failure.' },
        { name: "Young's Modulus", value: '1900-2300', unit: 'MPa', implications: 'Similar stiffness to ASA.' },
        { name: 'Impact Strength (Notched)', value: '150-250', unit: 'J/m', implications: 'Good impact resistance - some formulas improve this.' },
        { name: 'Glass Transition (Tg)', value: '95-105', unit: '°C', implications: 'Same heat resistance as standard ASA.' },
        { name: 'UV Resistance', value: 'Excellent', unit: '', implications: 'Retains ASA UV stability.' },
      ],
      notes: 'Properties vary by manufacturer. "+" typically refers to printability, not mechanical improvement.',
    },
    printSettings: {
      nozzleTemp: { min: 235, max: 260, optimal: 250 },
      bedTemp: { min: 85, max: 105, optimal: 95 },
      coolingFan: { min: 0, max: 40, notes: 'Slightly more cooling tolerance than standard ASA.' },
      enclosure: { required: false, notes: 'Recommended but some brands work without. Large parts still need enclosure.' },
      drying: { temp: 75, duration: '4-6 hours', notes: 'Hygroscopic. Dry if stringing or bubbling occurs.' },
      printSpeed: { recommended: '40-70 mm/s', notes: 'Can print slightly faster than standard ASA.' },
      additionalNotes: [
        'Try without enclosure first - many ASA+ formulas work open-air for small parts',
        'Use brim for bed adhesion on larger parts',
        'First layer slow (20 mm/s) for best adhesion',
        'Still benefits from warm chamber for large prints',
      ],
    },
    adhesion: {
      bedSurfaces: {
        excellent: ['PEI (Textured)', 'Garolite (G10)', 'ASA slurry'],
        good: ['Glass with glue stick', 'PEI (Smooth)'],
        poor: ['Bare glass', 'Blue tape'],
      },
      releaseAgents: 'Glue stick recommended. Less aggressive adhesion than some standard ASA.',
      multiMaterial: [
        { material: 'ASA', bondQuality: 'Strong Chemical Bond', notes: 'Same polymer family - excellent compatibility.' },
        { material: 'ABS', bondQuality: 'Strong Chemical Bond', notes: 'Compatible styrenic polymers.' },
        { material: 'HIPS', bondQuality: 'Strong Chemical Bond', notes: 'HIPS works as dissolvable support.' },
      ],
    },
    postProcessing: {
      chemicalSmoothing: [
        { method: 'Acetone Vapor', effectiveness: 'Excellent', notes: 'Works identically to standard ASA.' },
        { method: 'Acetone Brush', effectiveness: 'Good', notes: 'Same smoothing characteristics as ASA.' },
      ],
      mechanical: ['Sands easily', 'Can be machined', 'Gap filling with ASA slurry works'],
      glues: ['Acetone welding works', 'Cyanoacrylate effective', 'ASA cement creates strong joints'],
      painting: 'Excellent paint adhesion. Use UV-stable paints for outdoor use.',
    },
    safety: {
      fumes: { level: 'Moderate', notes: 'Same styrene emissions as ASA. Ventilation required.' },
      foodSafety: { rating: 'Not Recommended', notes: 'Same concerns as ASA - styrene and layer lines.' },
      biodegradability: { rating: 'Not Biodegradable', notes: 'Petroleum-based like standard ASA.' },
      additionalNotes: [
        'Same safety precautions as standard ASA',
        'Ventilation or filtration recommended',
        'Styrene classified as "possibly carcinogenic"',
      ],
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

  'ASA-GF': {
    name: 'ASA-GF',
    fullName: 'Glass Fiber Reinforced Acrylonitrile Styrene Acrylate',
    origin: {
      yearInvented: '2018+ (3D printing formulation)',
      originalCompany: 'Multiple manufacturers developed for industrial outdoor applications',
      keyMilestones: [
        '1970s: ASA polymer developed for UV resistance',
        '1980s: Glass fiber reinforced plastics widespread in injection molding',
        '2018-2020: ASA-GF filaments become commercially available',
        '2021+: Adopted for cost-effective outdoor structural applications',
      ],
      majorManufacturers: ['3DXTech', 'Polymaker', 'Fiberlogy', 'FormFutura', 'BASF'],
    },
    composition: {
      basePolymer: 'ASA (Acrylonitrile Styrene Acrylate)',
      chemicalFamily: 'Styrenic Polymer Composite',
      keyAdditives: ['Chopped glass fiber (15-30%)', 'UV stabilizers (inherent in ASA)', 'Coupling agents'],
      coloringAgents: 'Limited colors - typically natural/beige, gray, white, or black',
      specialFillers: ['E-glass or S-glass fiber (typically 15-30% by weight)'],
    },
    familyContext: {
      parentPolymer: 'ASA reinforced with glass fiber for increased stiffness at lower cost than carbon fiber',
      variants: ['ASA-GF15 (15% glass)', 'ASA-GF20 (20% glass)', 'ASA-GF30 (30% glass)'],
      chemicalComparison: 'Same UV resistance as ASA with significant stiffness improvement. Heavier but cheaper than ASA-CF.',
      evolution: 'Created as cost-effective alternative to ASA-CF for outdoor structural applications.',
    },
    strengths: {
      uniqueProperties: ['UV resistant AND stiff', 'Lower cost than carbon fiber', 'Good dimensional stability', 'Excellent creep resistance'],
      bestUseScenarios: ['Outdoor structural housings', 'Agricultural equipment', 'Solar panel brackets', 'Marine fixtures', 'Automotive exterior parts'],
      advantagesOverCompetitors: ['Cheaper than ASA-CF', 'UV stable unlike ABS-GF', 'Stiff and weather-resistant', 'Good balance of properties'],
      whyChooseThis: 'When you need UV-resistant structural parts but carbon fiber cost is prohibitive.',
    },
    weaknesses: {
      limitations: ['Abrasive - requires hardened nozzle', 'Heavier than ASA-CF', 'Reduced impact resistance', 'Limited color options'],
      commonProblems: ['Nozzle wear', 'Rough surface finish', 'Glass fiber skin irritation', 'Brittle compared to unreinforced ASA'],
      environmentalConcerns: ['Not recyclable', 'Glass fiber dust hazard', 'Petroleum-based'],
      whenNotToUse: ['Weight-critical applications (use ASA-CF)', 'Impact-critical parts', 'Aesthetic applications', 'Without hardened nozzle'],
    },
    practicalContext: {
      industryAdoption: ['Agricultural equipment', 'Marine', 'Automotive exterior', 'Industrial outdoor', 'Solar industry'],
      commonApplications: ['Outdoor enclosures', 'Agricultural machinery parts', 'Marina fixtures', 'Solar mounting brackets', 'Weatherproof housings'],
      safetyStandards: ['Various automotive weathering standards', 'UV aging certifications'],
      costPosition: 'Standard',
    },
    trivia: {
      funFacts: [
        'Glass fiber reinforcement adds about 10x less cost than carbon fiber for similar stiffness gains',
        'The natural tan/beige color comes from the glass fiber itself',
        'ASA-GF can withstand decades of outdoor exposure without significant degradation',
        'Often used where parts must survive both UV exposure and mechanical loading',
      ],
      whyInvented: 'Created to provide cost-effective reinforced outdoor materials without carbon fiber pricing.',
      controversies: [
        'Some consider glass fiber "inferior" to carbon, but cost-benefit is often favorable',
        'Glass dust is irritating to skin - handle with care',
        'Properties heavily dependent on fiber quality and content percentage',
      ],
      marketAdoption: 'Growing in outdoor industrial and agricultural applications where cost matters.',
    },
    tdsProfile: {
      properties: [
        { name: 'Tensile Strength', value: '50-70', unit: 'MPa', implications: 'High. Significant improvement over unreinforced ASA.' },
        { name: 'Tensile Modulus', value: '4000-6000', unit: 'MPa', implications: 'High stiffness. Similar to ASA-CF but heavier.' },
        { name: 'Elongation at Break', value: '2-4', unit: '%', implications: 'Very Low. Brittle - glass fibers reduce ductility.' },
        { name: 'Impact Strength (Notched)', value: '50-90', unit: 'J/m', implications: 'Reduced from base ASA due to fiber stress concentrators.' },
        { name: 'UV Resistance', value: 'Excellent', unit: '', implications: 'Retains ASA\'s outstanding UV stability.' },
        { name: 'Density', value: '1.25-1.35', unit: 'g/cm³', implications: 'Higher than ASA-CF. Glass is heavier than carbon.' },
      ],
      notes: 'Properties depend on glass fiber content. Higher % = stiffer but more brittle.',
    },
    printSettings: {
      nozzleTemp: { min: 250, max: 280, optimal: 265 },
      bedTemp: { min: 95, max: 110, optimal: 105 },
      coolingFan: { min: 0, max: 30, notes: 'Minimal cooling. Similar to standard ASA.' },
      enclosure: { required: true, notes: 'Required - warping concerns similar to ASA.' },
      drying: { temp: 80, duration: '4-6 hours', notes: 'Hygroscopic - moisture causes weak layers.' },
      printSpeed: { recommended: '35-55 mm/s', notes: 'Slightly slower than unreinforced ASA for better layer adhesion.' },
      additionalNotes: [
        'HARDENED NOZZLE REQUIRED (steel, ruby, or tungsten carbide)',
        'Larger nozzle diameter (0.5-0.8mm) recommended',
        'Print hotter than plain ASA for fiber wetting',
        'Use generous brim for bed adhesion',
      ],
    },
    adhesion: {
      bedSurfaces: {
        excellent: ['PEI (Textured)', 'Garolite (G10)', 'ASA slurry'],
        good: ['Glass with glue stick', 'Kapton tape'],
        poor: ['Bare glass', 'Blue tape'],
      },
      releaseAgents: 'ASA slurry or heavy glue stick application. Let cool completely before removal.',
      multiMaterial: [
        { material: 'ASA', bondQuality: 'Strong Chemical Bond', notes: 'Same polymer base - excellent compatibility.' },
        { material: 'ASA-CF', bondQuality: 'Strong Chemical Bond', notes: 'Both ASA-based composites.' },
        { material: 'HIPS', bondQuality: 'Strong Chemical Bond', notes: 'Can use HIPS as dissolvable support.' },
      ],
    },
    postProcessing: {
      chemicalSmoothing: [
        { method: 'Acetone Vapor', effectiveness: 'Good', notes: 'ASA matrix dissolves but glass fibers remain - textured finish.' },
      ],
      mechanical: ['Sanding produces glass dust - wear mask and eye protection', 'Can be machined with carbide tools', 'Drilling works well'],
      glues: ['Acetone welding on ASA matrix', 'Epoxy for structural joints', 'Cyanoacrylate effective'],
      painting: 'Rough surface requires filler primer for smooth finish. Use UV-stable paints for outdoor.',
    },
    safety: {
      fumes: { level: 'High', notes: 'ASA styrene fumes plus glass fiber particulates. Enclosure with filtration required.' },
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

  'LW-ASA': {
    name: 'LW-ASA',
    fullName: 'Lightweight Acrylonitrile Styrene Acrylate',
    origin: {
      yearInvented: '2022+ (3D printing formulation)',
      originalCompany: 'ColorFabb pioneered LW-PLA; LW-ASA followed for outdoor applications',
      keyMilestones: [
        '1970s: ASA polymer developed',
        '2019: ColorFabb introduces LW-PLA concept',
        '2022+: LW-ASA developed for UV-resistant lightweight parts',
        '2023+: Growing adoption for outdoor RC and drone applications',
      ],
      majorManufacturers: ['ColorFabb', 'FormFutura', 'Polymaker', 'eSUN'],
    },
    composition: {
      basePolymer: 'ASA (Acrylonitrile Styrene Acrylate)',
      chemicalFamily: 'Foamed Styrenic Polymer',
      keyAdditives: ['Blowing/foaming agents', 'Cell nucleating agents', 'UV stabilizers (inherent in ASA)'],
      coloringAgents: 'Limited colors - foaming affects appearance',
      specialFillers: ['Microsphere or chemical blowing agents that activate at higher temperatures'],
    },
    familyContext: {
      parentPolymer: 'ASA with foaming agents that activate at elevated temperatures',
      variants: ['LW-ASA (standard)', 'Active foaming versions'],
      chemicalComparison: 'Same UV resistance as ASA but with 50-65% density reduction when foamed.',
      evolution: 'Developed to bring LW-PLA benefits to outdoor applications requiring UV resistance.',
    },
    strengths: {
      uniqueProperties: ['Up to 50-65% weight reduction', 'UV resistant (unlike LW-PLA)', 'Expanded foam texture', 'No layer lines when foamed'],
      bestUseScenarios: ['Outdoor RC aircraft', 'Drone bodies', 'Lightweight outdoor enclosures', 'Float components', 'Prop replicas for outdoor display'],
      advantagesOverCompetitors: ['Only lightweight AND UV-stable option', 'Massive weight savings', 'Unique matte foam finish', 'Weather-resistant'],
      whyChooseThis: 'When you need ultralight parts for outdoor use - the ONLY UV-stable lightweight foaming filament.',
    },
    weaknesses: {
      limitations: ['Requires precise temperature control for foaming', 'Reduced strength vs solid ASA', 'Limited color options', 'More expensive'],
      commonProblems: ['Inconsistent foaming if temps vary', 'Learning curve for optimal settings', 'Not suitable for structural loads', 'Over-expansion possible'],
      environmentalConcerns: ['Petroleum-based', 'Not recyclable (foamed structure)', 'Blowing agent considerations'],
      whenNotToUse: ['Structural/load-bearing parts', 'When consistent density needed', 'Precise dimensional tolerance required', 'Water submersion (absorbs through cells)'],
    },
    practicalContext: {
      industryAdoption: ['RC aircraft hobby', 'Drone racing', 'Props and cosplay', 'Lightweight prototyping', 'Marine floats'],
      commonApplications: ['RC airplane fuselages', 'Drone bodies', 'Outdoor display props', 'Float accessories', 'Lightweight covers'],
      safetyStandards: ['Not typically certified - hobby/prototyping use'],
      costPosition: 'Premium',
    },
    trivia: {
      funFacts: [
        'Weight reduction of 50-65% means parts feel like styrofoam but much stronger',
        'The foaming process eliminates visible layer lines - smooth matte finish',
        'You can control foam density by adjusting hotend temperature',
        'LW-ASA is the answer to "LW-PLA melts in my car" complaints',
      ],
      whyInvented: 'Created because LW-PLA parts would deform in sunlight and hot cars - LW-ASA survives.',
      controversies: [
        'Significantly more expensive per gram than standard ASA',
        'Foaming adds print complexity - not for beginners',
        'Strength trade-off may not be acceptable for all applications',
      ],
      marketAdoption: 'Niche but growing rapidly in outdoor RC and drone communities.',
    },
    tdsProfile: {
      properties: [
        { name: 'Density (Foamed)', value: '0.4-0.6', unit: 'g/cm³', implications: 'Massive weight reduction. Standard ASA is ~1.07 g/cm³.' },
        { name: 'Density Reduction', value: '45-65', unit: '%', implications: 'Primary benefit - ultralight parts.' },
        { name: 'Tensile Strength (Foamed)', value: '15-30', unit: 'MPa', implications: 'Reduced from solid ASA due to foam structure.' },
        { name: 'UV Resistance', value: 'Excellent', unit: '', implications: 'Retains ASA UV stability even when foamed.' },
        { name: 'Glass Transition (Tg)', value: '95-105', unit: '°C', implications: 'Same heat resistance as standard ASA.' },
        { name: 'Foam Cell Size', value: 'Varies', unit: '', implications: 'Smaller = denser/stronger. Larger = lighter/weaker.' },
      ],
      notes: 'Properties highly dependent on foaming level. Test settings for your specific application.',
    },
    printSettings: {
      nozzleTemp: { min: 230, max: 270, optimal: 250 },
      bedTemp: { min: 90, max: 105, optimal: 95 },
      coolingFan: { min: 0, max: 40, notes: 'More cooling than standard ASA to set foam quickly.' },
      enclosure: { required: false, notes: 'Foamed parts warp less. Enclosure optional but helps consistency.' },
      drying: { temp: 70, duration: '4-6 hours', notes: 'Critical - moisture affects foaming behavior.' },
      printSpeed: { recommended: '30-50 mm/s', notes: 'Slower speeds for better foam control.' },
      additionalNotes: [
        'Temperature controls foam level: lower = less foam/denser, higher = more foam/lighter',
        'Active foaming starts around 230°C, maximum foam around 260°C',
        'Use low flow rate (65-75%) to compensate for expansion',
        'Larger nozzle (0.6-0.8mm) works better for consistent foam',
        'Test print temperature towers to find ideal foam level for your needs',
      ],
    },
    adhesion: {
      bedSurfaces: {
        excellent: ['PEI (Textured)', 'Glass with glue stick'],
        good: ['PEI (Smooth)', 'Kapton tape'],
        poor: ['Bare glass', 'Blue tape'],
      },
      releaseAgents: 'Glue stick recommended. Foamed parts release easier than solid ASA.',
      multiMaterial: [
        { material: 'ASA', bondQuality: 'Strong Chemical Bond', notes: 'Same polymer base - excellent for reinforced sections.' },
        { material: 'ABS', bondQuality: 'Strong Chemical Bond', notes: 'Compatible styrenic polymers.' },
        { material: 'HIPS', bondQuality: 'Strong Chemical Bond', notes: 'Can use for dissolvable support in solid sections.' },
      ],
    },
    postProcessing: {
      chemicalSmoothing: [
        { method: 'Acetone Vapor', effectiveness: 'Difficult', notes: 'Foam cells may collapse. Test on scrap first.' },
      ],
      mechanical: ['Sanding not recommended - damages foam structure', 'Cut with sharp blades', 'Can be carved/shaped like foam'],
      glues: ['CA glue penetrates foam well', 'Acetone welding on solid sections', 'Foam-safe epoxies work'],
      painting: 'Foam texture accepts paint well. Primer helps. Use UV-stable paints for outdoor.',
    },
    safety: {
      fumes: { level: 'Moderate', notes: 'ASA styrene fumes plus minor blowing agent off-gassing. Good ventilation required.' },
      foodSafety: { rating: 'Not Safe', notes: 'Not suitable for food contact - foam structure and styrene.' },
      biodegradability: { rating: 'Not Biodegradable', notes: 'Petroleum-based polymer.' },
      additionalNotes: [
        'Same safety precautions as standard ASA',
        'Blowing agents are generally safe when activated in printer',
        'Well-ventilated printing area recommended',
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

  'TPU 95A': {
    name: 'TPU 95A',
    fullName: 'Thermoplastic Polyurethane 95A Shore Hardness',
    origin: {
      yearInvented: '1950s (TPU), 2014+ (3D printing filament)',
      originalCompany: 'Various manufacturers standardized on Shore hardness ratings',
      keyMilestones: [
        '1950s: TPU chemistry developed',
        '2014-2016: TPU filaments emerge for 3D printing',
        '2017+: Shore hardness ratings become standard classification',
        '2019+: 95A becomes the most common "standard" TPU',
      ],
      majorManufacturers: ['NinjaTek (Cheetah)', 'Polymaker (PolyFlex)', 'SainSmart', 'eSUN', 'Overture'],
    },
    composition: {
      basePolymer: 'TPU (Thermoplastic Polyurethane)',
      chemicalFamily: 'Polyurethane Elastomer',
      keyAdditives: ['Shore hardness modifiers', 'Processing aids', 'UV stabilizers'],
      coloringAgents: 'Wide color range available, some translucency possible',
      specialFillers: ['None typically - pure elastomer'],
    },
    familyContext: {
      parentPolymer: 'Standard TPU formulated to 95A Shore hardness',
      variants: ['TPU 95A standard', 'High-speed TPU 95A', 'TPU 95A Matte'],
      chemicalComparison: 'Hardest common TPU - feels like a car tire or shoe sole. Semi-flexible rather than soft.',
      evolution: 'The "default" TPU hardness that balances printability with flexibility.',
    },
    strengths: {
      uniqueProperties: ['Easiest TPU to print', 'Good abrasion resistance', 'Semi-flexible', 'Oil and chemical resistant'],
      bestUseScenarios: ['Phone cases', 'Protective bumpers', 'Tool grips', 'Vibration dampeners', 'Watch bands'],
      advantagesOverCompetitors: ['Most printable of all TPUs', 'Works with some Bowden setups', 'Best layer adhesion of TPUs'],
      whyChooseThis: 'The starting point for TPU printing - easiest to print while still being flexible.',
    },
    weaknesses: {
      limitations: ['Not as soft as 85A/75A', 'Still slower than rigid materials', 'Some stringing'],
      commonProblems: ['Stringing between parts', 'Requires slow retraction', 'Can buckle in long Bowden tubes'],
      environmentalConcerns: ['Petroleum-based', 'Not biodegradable', 'Difficult to recycle'],
      whenNotToUse: ['When very soft/rubber-like feel needed', 'High-speed printing', 'Thin walls requiring flexibility'],
    },
    practicalContext: {
      industryAdoption: ['Consumer electronics', 'Footwear prototyping', 'Automotive', 'Medical devices'],
      commonApplications: ['Phone cases', 'Bumpers', 'Seals', 'Grips', 'Gaskets', 'Cable management'],
      safetyStandards: ['FDA grades available', 'Skin-safe grades for wearables'],
      costPosition: 'Standard',
    },
    trivia: {
      funFacts: [
        '95A is about as hard as a car tire tread or rollerblade wheel',
        'The "A" in 95A refers to the Shore A durometer scale',
        'NinjaTek Cheetah 95A was one of the first "printable" TPUs',
        'Most beginners should start with 95A before trying softer variants',
      ],
      whyInvented: 'Created as the optimal balance between printability and flexibility for desktop 3D printers.',
      controversies: [
        'Some budget 95A TPUs are actually harder or softer than advertised',
        'Shore hardness can vary slightly between colors from same brand',
      ],
      marketAdoption: 'The most popular TPU variant - considered "standard" flexible filament.',
    },
    tdsProfile: {
      properties: [
        { name: 'Shore Hardness', value: '95', unit: 'A', implications: 'Semi-flexible. Feels like a car tire - bends but returns to shape.' },
        { name: 'Tensile Strength', value: '35-50', unit: 'MPa', implications: 'Strong. Similar to rigid materials but with flexibility.' },
        { name: 'Elongation at Break', value: '400-600', unit: '%', implications: 'Very High. Stretches significantly before breaking.' },
        { name: 'Tear Resistance', value: '80-120', unit: 'kN/m', implications: 'Good tear resistance for flexible applications.' },
        { name: 'Abrasion Resistance', value: 'Excellent', unit: '', implications: 'Outstanding wear resistance - key TPU advantage.' },
        { name: 'Density', value: '1.20-1.25', unit: 'g/cm³', implications: 'Slightly heavier than PLA.' },
      ],
      notes: '95A is the most printable TPU. Start here before trying softer grades.',
    },
    printSettings: {
      nozzleTemp: { min: 220, max: 250, optimal: 235 },
      bedTemp: { min: 40, max: 70, optimal: 50 },
      coolingFan: { min: 50, max: 100, notes: 'Moderate to high cooling helps solidify quickly.' },
      enclosure: { required: false, notes: 'Not required. TPU does not warp.' },
      drying: { temp: 50, duration: '4-8 hours', notes: 'Mildly hygroscopic. Dry if stringing increases.' },
      printSpeed: { recommended: '20-40 mm/s', notes: 'Slower than rigid materials. 95A can handle faster speeds than softer TPUs.' },
      additionalNotes: [
        'Direct drive strongly recommended (some Bowden possible with short tubes)',
        'Disable or minimize retraction (1-2mm max)',
        'Slow down travel moves to reduce stringing',
        'Z-hop can help with stringing',
      ],
    },
    adhesion: {
      bedSurfaces: {
        excellent: ['PEI (Smooth)', 'Glass with glue stick', 'Blue tape'],
        good: ['PEI (Textured)', 'BuildTak'],
        poor: ['Bare glass without adhesive'],
      },
      releaseAgents: 'Glue stick helps with release. TPU can stick too well to PEI.',
      multiMaterial: [
        { material: 'PLA', bondQuality: 'Mechanical Bond', notes: 'Reasonable adhesion for soft-touch grips on rigid parts.' },
        { material: 'PETG', bondQuality: 'Mechanical Bond', notes: 'Decent adhesion for protective bumpers.' },
        { material: 'ABS', bondQuality: 'Mechanical Bond', notes: 'Can create flexible hinges on rigid parts.' },
      ],
    },
    postProcessing: {
      chemicalSmoothing: [
        { method: 'Acetone', effectiveness: 'Not Possible', notes: 'TPU is chemically resistant to acetone.' },
      ],
      mechanical: ['Trimming with sharp blade', 'Heat gun for minor smoothing', 'Sanding difficult due to flexibility'],
      glues: ['Flexible CA glue', 'Polyurethane adhesive', 'Contact cement'],
      painting: 'Difficult - use flexible paints or dyes. Regular paint will crack.',
    },
    safety: {
      fumes: { level: 'Low', notes: 'Generally safe with basic ventilation.' },
      foodSafety: { rating: 'Possible (Specific Grades)', notes: 'FDA grades exist. Layer lines concern for bacteria.' },
      biodegradability: { rating: 'Not Biodegradable', notes: 'Petroleum-based polyurethane.' },
    },
  },

  'TPU 85A': {
    name: 'TPU 85A',
    fullName: 'Thermoplastic Polyurethane 85A Shore Hardness',
    origin: {
      yearInvented: '1950s (TPU), 2016+ (3D printing filament)',
      originalCompany: 'NinjaTek (NinjaFlex) popularized soft TPU for 3D printing',
      keyMilestones: [
        '1950s: TPU chemistry developed',
        '2014: NinjaTek introduces NinjaFlex (softer TPU)',
        '2017+: 85A becomes standard "soft" TPU option',
        '2020+: More manufacturers offer 85A grades',
      ],
      majorManufacturers: ['NinjaTek (NinjaFlex)', 'Polymaker', 'SainSmart', 'Recreus (FilaFlex)', 'eSUN'],
    },
    composition: {
      basePolymer: 'TPU (Thermoplastic Polyurethane)',
      chemicalFamily: 'Polyurethane Elastomer',
      keyAdditives: ['Softening agents', 'Processing aids', 'Flexibility enhancers'],
      coloringAgents: 'Wide color range, often more translucent than 95A',
      specialFillers: ['None - pure soft elastomer'],
    },
    familyContext: {
      parentPolymer: 'Softer TPU formulated to 85A Shore hardness',
      variants: ['TPU 85A standard', 'NinjaFlex', 'FilaFlex 82A'],
      chemicalComparison: 'Noticeably softer than 95A - feels like rubber bands or soft erasers.',
      evolution: 'Developed for applications requiring more flexibility than 95A can provide.',
    },
    strengths: {
      uniqueProperties: ['Very flexible', 'Excellent grip surface', 'High energy absorption', 'Soft touch feel'],
      bestUseScenarios: ['Soft grips', 'Wearables', 'Shoe insoles', 'Soft seals', 'Prosthetic interfaces'],
      advantagesOverCompetitors: ['Softer feel than 95A', 'Better energy absorption', 'More rubber-like behavior'],
      whyChooseThis: 'When 95A is too stiff and you need true rubber-like flexibility.',
    },
    weaknesses: {
      limitations: ['Harder to print than 95A', 'Requires direct drive', 'Significant stringing', 'Slower speeds required'],
      commonProblems: ['Buckling in extruder', 'Heavy stringing', 'Poor bridging', 'Slow print times'],
      environmentalConcerns: ['Petroleum-based', 'Not biodegradable'],
      whenNotToUse: ['Bowden extruders', 'High-speed printing needs', 'Structural applications', 'Beginners'],
    },
    practicalContext: {
      industryAdoption: ['Footwear', 'Medical prosthetics', 'Wearables', 'Sporting goods'],
      commonApplications: ['Shoe insoles', 'Wearable bands', 'Soft seals', 'Grip covers', 'Protective padding'],
      safetyStandards: ['Skin-safe grades available', 'FDA grades for medical use'],
      costPosition: 'Premium',
    },
    trivia: {
      funFacts: [
        '85A feels like a rubber band or soft eraser',
        'NinjaFlex was one of the first soft TPUs that was actually printable',
        'The softness comes from longer soft segment chains in the polymer',
        '85A requires about 50% slower print speeds than 95A',
      ],
      whyInvented: 'Created for wearables and applications where 95A was too rigid.',
      controversies: [
        'Significantly harder to print - many beginners give up',
        'Direct drive is essentially mandatory',
        'Print quality very dependent on specific printer setup',
      ],
      marketAdoption: 'Popular in wearables and footwear prototyping.',
    },
    tdsProfile: {
      properties: [
        { name: 'Shore Hardness', value: '85', unit: 'A', implications: 'Soft and flexible. Feels like a rubber band.' },
        { name: 'Tensile Strength', value: '25-40', unit: 'MPa', implications: 'Lower than 95A due to increased softness.' },
        { name: 'Elongation at Break', value: '500-700', unit: '%', implications: 'Very High. Extremely stretchy.' },
        { name: 'Tear Resistance', value: '50-80', unit: 'kN/m', implications: 'Good but lower than harder TPUs.' },
        { name: 'Rebound Resilience', value: 'High', unit: '', implications: 'Springs back quickly from compression.' },
        { name: 'Density', value: '1.15-1.20', unit: 'g/cm³', implications: 'Slightly lighter than 95A.' },
      ],
      notes: 'Softer than 95A but more challenging to print. Direct drive required.',
    },
    printSettings: {
      nozzleTemp: { min: 225, max: 250, optimal: 240 },
      bedTemp: { min: 40, max: 60, optimal: 50 },
      coolingFan: { min: 30, max: 80, notes: 'Moderate cooling. Too much can cause layer adhesion issues.' },
      enclosure: { required: false, notes: 'Not needed. TPU does not warp.' },
      drying: { temp: 50, duration: '4-8 hours', notes: 'Dry before printing for best results.' },
      printSpeed: { recommended: '15-30 mm/s', notes: 'Slower than 95A. Patience required.' },
      additionalNotes: [
        'DIRECT DRIVE REQUIRED - Bowden will not work',
        'Disable retraction completely or use 0.5-1mm max',
        'Use constrained filament path to prevent buckling',
        'Very slow travel speeds reduce stringing',
        'Consider using wipe/coast settings',
      ],
    },
    adhesion: {
      bedSurfaces: {
        excellent: ['PEI (Smooth)', 'Glass with glue stick', 'Blue tape'],
        good: ['BuildTak', 'Textured PEI (may stick too well)'],
        poor: ['Bare glass'],
      },
      releaseAgents: 'Glue stick for easier release. Can bond too well to PEI.',
      multiMaterial: [
        { material: 'TPU 95A', bondQuality: 'Strong Chemical Bond', notes: 'Different hardnesses bond well together.' },
        { material: 'PLA', bondQuality: 'Mechanical Bond', notes: 'For soft grip sections on rigid parts.' },
      ],
    },
    postProcessing: {
      chemicalSmoothing: [
        { method: 'Acetone', effectiveness: 'Not Possible', notes: 'TPU is chemically resistant.' },
      ],
      mechanical: ['Sharp blade trimming', 'Scissors work well', 'Heat gun for minor welding'],
      glues: ['Flexible CA glue', 'Polyurethane adhesive', 'Contact cement'],
      painting: 'Use flexible dyes or paints only. Regular paint cracks.',
    },
    safety: {
      fumes: { level: 'Low', notes: 'Safe with basic ventilation.' },
      foodSafety: { rating: 'Possible (Specific Grades)', notes: 'FDA grades exist for medical/food use.' },
      biodegradability: { rating: 'Not Biodegradable', notes: 'Petroleum-based.' },
    },
  },

  'TPU 75A': {
    name: 'TPU 75A',
    fullName: 'Thermoplastic Polyurethane 75A Shore Hardness',
    origin: {
      yearInvented: '1950s (TPU), 2018+ (3D printing filament)',
      originalCompany: 'Specialty manufacturers developed ultra-soft TPUs',
      keyMilestones: [
        '1950s: TPU chemistry developed',
        '2018+: Ultra-soft 75A TPUs become available',
        '2020+: Growing niche for very soft applications',
      ],
      majorManufacturers: ['Recreus (FilaFlex)', 'NinjaTek', 'Polymaker', 'FormFutura'],
    },
    composition: {
      basePolymer: 'TPU (Thermoplastic Polyurethane)',
      chemicalFamily: 'Polyurethane Elastomer',
      keyAdditives: ['High concentration of softening agents', 'Flow modifiers', 'Stability enhancers'],
      coloringAgents: 'Limited colors - very soft TPU harder to pigment consistently',
      specialFillers: ['None - maximum softness requires pure elastomer'],
    },
    familyContext: {
      parentPolymer: 'Ultra-soft TPU formulated to 75A Shore hardness',
      variants: ['TPU 75A', 'FilaFlex 70A', 'Ultra-soft TPE'],
      chemicalComparison: 'Very soft - feels like soft silicone or gummy candy. Maximum flexibility.',
      evolution: 'Created for applications requiring the softest possible printed elastomer.',
    },
    strengths: {
      uniqueProperties: ['Extremely soft and flexible', 'Maximum energy absorption', 'Silicone-like feel', 'Excellent sealing'],
      bestUseScenarios: ['Soft seals and gaskets', 'Medical cushioning', 'Ultra-soft grips', 'Vibration isolation', 'Prosthetic liners'],
      advantagesOverCompetitors: ['Softest printable TPU', 'Best for skin contact applications', 'Maximum shock absorption'],
      whyChooseThis: 'When you need the absolute softest printed material possible - approaching silicone softness.',
    },
    weaknesses: {
      limitations: ['Very difficult to print', 'Expert-level material', 'Extremely slow', 'Limited structural integrity'],
      commonProblems: ['Constant buckling in extruder', 'Massive stringing', 'Poor dimensional accuracy', 'Requires perfectly tuned printer'],
      environmentalConcerns: ['Petroleum-based', 'Not biodegradable', 'Specialized disposal'],
      whenNotToUse: ['Any structural application', 'Beginners', 'Standard printers without modifications', 'When 85A softness is adequate'],
    },
    practicalContext: {
      industryAdoption: ['Medical devices', 'Prosthetics', 'Specialized sealing', 'Comfort applications'],
      commonApplications: ['Prosthetic liners', 'Medical cushions', 'Ultra-soft seals', 'Comfort pads', 'Wearable interfaces'],
      safetyStandards: ['Medical-grade versions available', 'Biocompatibility certifications exist'],
      costPosition: 'Premium',
    },
    trivia: {
      funFacts: [
        '75A feels like soft gummy candy or medical-grade silicone',
        'Can be compressed flat and springs back completely',
        'Print speeds often under 15mm/s for success',
        'Some users modify extruders specifically for ultra-soft TPU',
      ],
      whyInvented: 'Created for medical and prosthetic applications requiring maximum softness.',
      controversies: [
        'Many users consider 75A "unprintable" without significant printer mods',
        'Quality varies dramatically between manufacturers',
        'Often recommended to skip 75A and use 85A unless absolutely necessary',
      ],
      marketAdoption: 'Niche market - medical and specialized applications only.',
    },
    tdsProfile: {
      properties: [
        { name: 'Shore Hardness', value: '75', unit: 'A', implications: 'Very Soft. Feels like soft silicone or gummy candy.' },
        { name: 'Tensile Strength', value: '15-25', unit: 'MPa', implications: 'Lower strength due to extreme softness.' },
        { name: 'Elongation at Break', value: '600-800', unit: '%', implications: 'Extremely High. Stretches to 6-8x original length.' },
        { name: 'Tear Resistance', value: '30-50', unit: 'kN/m', implications: 'Lower than harder TPUs - handle with care.' },
        { name: 'Compression Set', value: 'Low', unit: '', implications: 'Excellent recovery from compression.' },
        { name: 'Density', value: '1.10-1.15', unit: 'g/cm³', implications: 'Lightest of common TPUs.' },
      ],
      notes: 'Expert-level material. Only attempt after mastering 95A and 85A.',
    },
    printSettings: {
      nozzleTemp: { min: 230, max: 255, optimal: 245 },
      bedTemp: { min: 40, max: 60, optimal: 50 },
      coolingFan: { min: 20, max: 60, notes: 'Moderate cooling - too much causes adhesion issues.' },
      enclosure: { required: false, notes: 'Not needed for warping, but stable temps help consistency.' },
      drying: { temp: 50, duration: '6-12 hours', notes: 'Absolutely critical. Any moisture destroys printability.' },
      printSpeed: { recommended: '10-20 mm/s', notes: 'Extremely slow. Patience is essential.' },
      additionalNotes: [
        'DIRECT DRIVE MANDATORY with constrained filament path',
        'ZERO retraction recommended - use wiping/coasting instead',
        'Consider all-metal extruder with dual drive gears',
        'Print one object at a time to minimize travel',
        'Z-hop can reduce stringing but adds print time',
        'May require extruder modifications for reliable feeding',
      ],
    },
    adhesion: {
      bedSurfaces: {
        excellent: ['PEI (Smooth) with glue stick', 'Glass with heavy glue'],
        good: ['Blue tape', 'BuildTak'],
        poor: ['Any surface without adhesive'],
      },
      releaseAgents: 'Glue stick essential. Ultra-soft TPU can bond permanently to PEI.',
      multiMaterial: [
        { material: 'TPU 95A', bondQuality: 'Strong Chemical Bond', notes: 'Gradient hardness possible.' },
        { material: 'TPU 85A', bondQuality: 'Strong Chemical Bond', notes: 'Can create soft-to-softer transitions.' },
      ],
    },
    postProcessing: {
      chemicalSmoothing: [
        { method: 'None', effectiveness: 'Not Possible', notes: 'No chemical smoothing available for TPU.' },
      ],
      mechanical: ['Careful scissor trimming', 'Avoid sanding - tears easily', 'Heat gun for minor repairs'],
      glues: ['Flexible CA glue', 'Polyurethane adhesive - test first'],
      painting: 'Not recommended. Dyes only.',
    },
    safety: {
      fumes: { level: 'Low', notes: 'Safe with ventilation.' },
      foodSafety: { rating: 'Possible (Specific Grades)', notes: 'Medical grades exist for skin contact.' },
      biodegradability: { rating: 'Not Biodegradable', notes: 'Petroleum-based polyurethane.' },
    },
  },

  'TPU-CF': {
    name: 'TPU-CF',
    fullName: 'Carbon Fiber Reinforced Thermoplastic Polyurethane',
    origin: {
      yearInvented: '2019+ (3D printing formulation)',
      originalCompany: 'Multiple manufacturers developed simultaneously',
      keyMilestones: [
        '1950s: TPU chemistry developed',
        '2014+: TPU filaments become mainstream',
        '2019+: Carbon fiber reinforced TPU emerges',
        '2021+: Growing adoption for industrial flexible parts',
      ],
      majorManufacturers: ['3DXTech', 'Polymaker', 'Fiberlogy', 'ColorFabb'],
    },
    composition: {
      basePolymer: 'TPU (Thermoplastic Polyurethane) - typically 95A base',
      chemicalFamily: 'Reinforced Polyurethane Elastomer',
      keyAdditives: ['Chopped carbon fiber (10-15%)', 'Coupling agents', 'Flow modifiers'],
      coloringAgents: 'Black only due to carbon fiber content',
      specialFillers: ['Short chopped carbon fiber strands'],
    },
    familyContext: {
      parentPolymer: 'TPU 95A reinforced with carbon fiber for increased stiffness',
      variants: ['TPU-CF 10%', 'TPU-CF 15%'],
      chemicalComparison: 'Stiffer than plain TPU but retains some flexibility. Unique semi-flexible composite.',
      evolution: 'Created to bridge the gap between flexible TPU and rigid carbon fiber composites.',
    },
    strengths: {
      uniqueProperties: ['Unique stiff-but-flexible behavior', 'Excellent abrasion resistance', 'Fatigue resistant', 'Professional appearance'],
      bestUseScenarios: ['Industrial gaskets', 'Vibration-dampening mounts', 'Wear surfaces', 'Flexible hinges', 'Semi-rigid covers'],
      advantagesOverCompetitors: ['Only stiff flexible material', 'Better abrasion than any other material', 'Fatigue resistance of TPU with added stiffness'],
      whyChooseThis: 'When you need something that bends but also holds its shape - the middle ground between flexible and rigid.',
    },
    weaknesses: {
      limitations: ['Abrasive - requires hardened nozzle', 'Black color only', 'Expensive', 'Less flexible than unreinforced TPU'],
      commonProblems: ['Nozzle wear', 'Requires direct drive', 'Stringing still occurs', 'Print settings balance tricky'],
      environmentalConcerns: ['Carbon fiber dust hazard when machining', 'Not recyclable', 'Petroleum-based'],
      whenNotToUse: ['When maximum flexibility needed', 'Aesthetic parts requiring color', 'Without hardened nozzle', 'Budget projects'],
    },
    practicalContext: {
      industryAdoption: ['Industrial machinery', 'Automotive', 'Aerospace', 'Robotics'],
      commonApplications: ['Industrial seals', 'Vibration mounts', 'Wear pads', 'Conveyor parts', 'Semi-flexible brackets'],
      safetyStandards: ['Industrial use primarily - specific certifications vary'],
      costPosition: 'Premium',
    },
    trivia: {
      funFacts: [
        'TPU-CF is one of the only materials that is both flexible AND abrasion resistant',
        'Used in industrial applications where parts must flex AND resist wear',
        'The carbon fiber significantly reduces stretchiness compared to plain TPU',
        'Creates a unique "semi-flexible" category that didn\'t exist before',
      ],
      whyInvented: 'Created for industrial applications requiring flexibility, stiffness, AND abrasion resistance.',
      controversies: [
        'Some argue it defeats the purpose of TPU by making it stiffer',
        'Requires hardened nozzle which many TPU users don\'t have',
        'Finding optimal settings is challenging - behaves unlike any other material',
      ],
      marketAdoption: 'Niche industrial material with growing applications in robotics and automation.',
    },
    tdsProfile: {
      properties: [
        { name: 'Shore Hardness', value: '95-98', unit: 'A', implications: 'Stiffer than plain 95A TPU due to fiber reinforcement.' },
        { name: 'Tensile Strength', value: '40-55', unit: 'MPa', implications: 'Higher than plain TPU due to fiber reinforcement.' },
        { name: 'Tensile Modulus', value: '800-1500', unit: 'MPa', implications: 'Significantly stiffer than unreinforced TPU.' },
        { name: 'Elongation at Break', value: '200-350', unit: '%', implications: 'Lower than plain TPU - fibers limit stretch.' },
        { name: 'Abrasion Resistance', value: 'Excellent+', unit: '', implications: 'Best-in-class. Carbon fiber enhances already-excellent TPU wear resistance.' },
        { name: 'Density', value: '1.25-1.30', unit: 'g/cm³', implications: 'Slightly heavier than plain TPU.' },
      ],
      notes: 'Unique semi-flexible composite. Behaves unlike any other material.',
    },
    printSettings: {
      nozzleTemp: { min: 230, max: 255, optimal: 245 },
      bedTemp: { min: 50, max: 70, optimal: 60 },
      coolingFan: { min: 30, max: 70, notes: 'Moderate cooling for good layer adhesion.' },
      enclosure: { required: false, notes: 'Not required but helps with consistency.' },
      drying: { temp: 55, duration: '4-8 hours', notes: 'Hygroscopic. Dry before printing.' },
      printSpeed: { recommended: '20-35 mm/s', notes: 'Similar to standard TPU but may tolerate slightly faster.' },
      additionalNotes: [
        'HARDENED NOZZLE REQUIRED - carbon fiber is abrasive',
        'Direct drive strongly recommended',
        'Minimize retraction (1-2mm max)',
        'Larger nozzle (0.5mm+) reduces clogging risk',
        'Print settings are between TPU and rigid CF composites',
      ],
    },
    adhesion: {
      bedSurfaces: {
        excellent: ['PEI (Smooth)', 'Glass with glue stick'],
        good: ['PEI (Textured)', 'BuildTak'],
        poor: ['Bare glass'],
      },
      releaseAgents: 'Glue stick helps with release. Can stick firmly to PEI.',
      multiMaterial: [
        { material: 'TPU', bondQuality: 'Strong Chemical Bond', notes: 'Same polymer family - excellent compatibility.' },
        { material: 'ABS-CF', bondQuality: 'Mechanical Bond', notes: 'For flexible sections on rigid carbon fiber parts.' },
      ],
    },
    postProcessing: {
      chemicalSmoothing: [
        { method: 'None', effectiveness: 'Not Possible', notes: 'TPU is chemically resistant. Fibers would remain anyway.' },
      ],
      mechanical: ['Sanding with mask - carbon dust hazard', 'Trimming with sharp blade', 'Can be machined carefully'],
      glues: ['Flexible CA glue', 'Polyurethane adhesive', 'Epoxy for structural needs'],
      painting: 'Difficult. Matte black finish is usually acceptable as-is.',
    },
    safety: {
      fumes: { level: 'Moderate', notes: 'TPU fumes plus carbon particulates. Good ventilation recommended.' },
      foodSafety: { rating: 'Not Safe', notes: 'Carbon fiber shedding concern. Not for food contact.' },
      biodegradability: { rating: 'Not Biodegradable', notes: 'Petroleum-based with carbon fiber.' },
      additionalNotes: [
        'Wear mask when sanding - carbon fiber dust is respiratory hazard',
        'Wash hands after handling sanded parts',
        'Dispose of waste properly',
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

  'PA6': {
    name: 'PA6',
    fullName: 'Polyamide 6 (Nylon 6)',
    origin: {
      yearInvented: '1938',
      originalCompany: 'IG Farben / BASF (Germany)',
      keyMilestones: [
        '1938: Paul Schlack at IG Farben develops PA6 from caprolactam',
        '1939: Commercial production as Perlon (German competitor to DuPont Nylon)',
        '1940s: WWII drives mass production for military applications',
        '2016+: PA6 filaments become widely available for 3D printing',
      ],
      majorManufacturers: ['BASF', 'DSM', 'Lanxess', 'Taulman3D', 'Polymaker', 'eSUN'],
    },
    composition: {
      basePolymer: 'Polyamide 6 (polycaprolactam)',
      chemicalFamily: 'Polyamide',
      keyAdditives: ['Heat stabilizers', 'UV stabilizers', 'Lubricants', 'Impact modifiers'],
      coloringAgents: 'Natural is translucent/off-white, available in colors',
      specialFillers: ['Can be reinforced with glass or carbon fiber'],
    },
    familyContext: {
      parentPolymer: 'Polyamide family',
      variants: ['PA6-GF', 'PA6-CF', 'PA6 copolymers', 'Impact-modified PA6'],
      chemicalComparison: 'More impact resistant than PA66, absorbs more moisture. Lower melting point than PA66.',
      evolution: 'Developed as European alternative to DuPont\'s PA66, became widely used in its own right.',
    },
    strengths: {
      uniqueProperties: ['Excellent impact resistance', 'Good fatigue resistance', 'Self-lubricating', 'Excellent wear resistance', 'Good chemical resistance'],
      bestUseScenarios: ['Gears and bearings', 'Bushings', 'Impact-resistant parts', 'Wear surfaces', 'Snap fits'],
      advantagesOverCompetitors: ['Better impact resistance than PA66', 'Easier to process than PA66', 'Lower cost than specialty nylons'],
      whyChooseThis: 'When you need tough, impact-resistant parts with excellent wear properties and good processability.',
    },
    weaknesses: {
      limitations: ['Very hygroscopic (absorbs 9.5% water)', 'Significant warping', 'Requires enclosure', 'Lower strength than PA66'],
      commonProblems: ['Moisture absorption drastically affects properties', 'Warping during print', 'Stringy prints when wet', 'Dimensional changes with humidity'],
      environmentalConcerns: ['Petroleum-based', 'Not biodegradable', 'Energy-intensive production'],
      whenNotToUse: ['Humid environments without sealing', 'Tight tolerance parts without post-conditioning', 'Beginners', 'Open-frame printers'],
    },
    practicalContext: {
      industryAdoption: ['Automotive', 'Consumer goods', 'Industrial', 'Textiles', 'Packaging'],
      commonApplications: ['Gears', 'Bearings', 'Bushings', 'Cable ties', 'Food packaging', 'Textile fibers'],
      safetyStandards: ['FDA food contact grades available', 'Automotive certifications'],
      costPosition: 'Standard',
    },
    trivia: {
      funFacts: [
        'PA6 was Germany\'s answer to DuPont\'s Nylon 66 - called Perlon during WWII',
        'The "6" refers to the 6 carbon atoms in caprolactam monomer',
        'Most nylon stockings today are actually PA6, not PA66',
        'PA6 absorbs almost 10% of its weight in water - must be bone dry to print well',
      ],
      whyInvented: 'Developed by Germany to circumvent DuPont\'s nylon patents during wartime.',
      controversies: [
        'Often sold generically as "Nylon" without specifying PA6 vs PA66',
        'Many users fail with PA6 due to moisture absorption being underestimated',
      ],
      marketAdoption: 'Very common in injection molding. Growing in 3D printing as users learn moisture management.',
    },
    tdsProfile: {
      properties: [
        { name: 'Tensile Strength', value: '40-85', unit: 'MPa', implications: 'Good strength, varies with moisture content.' },
        { name: 'Elongation at Break', value: '30-300', unit: '%', implications: 'Highly ductile. Elongation increases dramatically with moisture.' },
        { name: "Young's Modulus", value: '1000-2800', unit: 'MPa', implications: 'Moderate stiffness. Decreases significantly when wet.' },
        { name: 'Impact Strength (Izod)', value: '50-160', unit: 'J/m', implications: 'Excellent impact resistance, especially notched.' },
        { name: 'Glass Transition (Tg)', value: '47-50', unit: '°C', implications: 'Relatively low Tg. Softens at moderate temperatures.' },
        { name: 'Melting Point', value: '220', unit: '°C', implications: 'Lower melting point than PA66. Easier to process.' },
        { name: 'Water Absorption', value: '9.5', unit: '%', implications: 'Very high. Must dry thoroughly before printing.' },
      ],
      notes: 'Properties heavily dependent on moisture content. Dry PA6 is stiff and strong; wet PA6 is flexible and weak.',
    },
    printSettings: {
      nozzleTemp: { min: 240, max: 270, optimal: 255 },
      bedTemp: { min: 70, max: 100, optimal: 85 },
      coolingFan: { min: 0, max: 30, notes: 'Minimal cooling. Excessive cooling causes warping and layer delamination.' },
      enclosure: { required: true, notes: 'Required for all but smallest parts. Chamber 40-60°C ideal.' },
      drying: { temp: 80, duration: '8-12 hours', notes: 'CRITICAL. PA6 absorbs moisture rapidly. Must be dried and kept dry. Use dry box or inline dryer.' },
      printSpeed: { recommended: '30-50 mm/s', notes: 'Moderate speeds. First layer very slow.' },
      additionalNotes: [
        'Print from dry box with active drying if possible',
        'Garolite (G10/FR4) provides best bed adhesion',
        'Use brim or raft for larger parts',
        'Allow slow cooling in enclosure',
        'Condition parts in target humidity for dimensional stability',
      ],
    },
    adhesion: {
      bedSurfaces: {
        excellent: ['Garolite (G10/FR4)', 'Nylon-specific build surfaces'],
        good: ['PEI (textured) with glue', 'Glass with glue stick'],
        poor: ['Bare PEI', 'Blue tape', 'Bare glass'],
      },
      releaseAgents: 'Parts stick extremely well to Garolite. Wait for full cooling before removal.',
      multiMaterial: [
        { material: 'PA66', bondQuality: 'Strong Chemical Bond', notes: 'Same polymer family, excellent adhesion.' },
        { material: 'PA-CF', bondQuality: 'Strong Chemical Bond', notes: 'Compatible with carbon-filled variants.' },
        { material: 'TPU', bondQuality: 'Mechanical Bond', notes: 'Some adhesion for flexible-rigid parts.' },
        { material: 'PLA', bondQuality: 'No Bond', notes: 'No adhesion between these materials.' },
      ],
    },
    postProcessing: {
      chemicalSmoothing: [
        { method: 'Formic Acid', effectiveness: 'Good', notes: 'Effective but dangerous. Professional use only.' },
        { method: 'Acetone', effectiveness: 'Not Possible', notes: 'No effect on polyamides.' },
      ],
      mechanical: ['Sands well', 'Machines well (drilling, tapping)', 'Can be polished'],
      glues: ['Cyanoacrylate with activator', 'Epoxy', 'Specialty nylon adhesives'],
      painting: 'Accepts fabric dyes for coloring. Priming required for paint.',
    },
    safety: {
      fumes: { level: 'Moderate', notes: 'Emits caprolactam. Good ventilation required.' },
      foodSafety: { rating: 'Some Grades', notes: 'FDA-approved grades available for food contact.' },
      biodegradability: { rating: 'Not Biodegradable', notes: 'Petroleum-based. Does not biodegrade.' },
      additionalNotes: [
        'Caprolactam emissions require ventilation',
        'Generally safe with proper ventilation',
        'Drying at high temps increases off-gassing temporarily',
      ],
    },
  },

  'PA12': {
    name: 'PA12',
    fullName: 'Polyamide 12 (Nylon 12)',
    origin: {
      yearInvented: '1960s',
      originalCompany: 'Various chemical companies developed PA12',
      keyMilestones: [
        '1960s: PA12 developed as specialty polyamide',
        '1990s: Becomes preferred material for fuel lines in automotive',
        '2010s: EOS popularizes PA12 for SLS 3D printing',
        '2018+: PA12 filaments become available for FDM',
      ],
      majorManufacturers: ['Evonik (Vestamid)', 'EMS-Grivory', 'Arkema (Rilsan)', 'Polymaker', 'Fiberlogy'],
    },
    composition: {
      basePolymer: 'Polyamide 12 (polylaurolactam)',
      chemicalFamily: 'Polyamide',
      keyAdditives: ['UV stabilizers', 'Heat stabilizers', 'Lubricants'],
      coloringAgents: 'Natural is translucent white, available in various colors',
      specialFillers: ['Glass fiber (PA12-GF)', 'Carbon fiber (PA12-CF)', 'Mineral fillers'],
    },
    familyContext: {
      parentPolymer: 'Polyamide family',
      variants: ['PA12-GF', 'PA12-CF', 'PA12-Flex', 'ESD PA12'],
      chemicalComparison: 'Lowest moisture absorption of common polyamides. Less strong than PA6/PA66 but more dimensionally stable.',
      evolution: 'Premium nylon for applications requiring low moisture sensitivity and dimensional stability.',
    },
    strengths: {
      uniqueProperties: ['Lowest moisture absorption (1.4%)', 'Excellent dimensional stability', 'Good chemical resistance', 'Flexible at low temperatures', 'Good fatigue resistance'],
      bestUseScenarios: ['Fuel lines and fluid handling', 'Parts requiring tight tolerances', 'Outdoor applications', 'Flexible hinges', 'Chemical-resistant components'],
      advantagesOverCompetitors: ['Far less moisture sensitive than PA6/PA66', 'More dimensionally stable', 'Better for precision parts', 'Maintains flexibility at -40°C'],
      whyChooseThis: 'When you need nylon properties without the moisture management headaches, or for precision parts requiring dimensional stability.',
    },
    weaknesses: {
      limitations: ['Lower strength than PA6/PA66', 'More expensive', 'Lower heat resistance', 'Still requires drying'],
      commonProblems: ['Higher cost than other nylons', 'Still warps (less than PA6)', 'Less stiff than PA6/PA66'],
      environmentalConcerns: ['Petroleum-based', 'Not biodegradable', 'Premium pricing'],
      whenNotToUse: ['Maximum strength requirements', 'High temperature applications', 'Budget-constrained projects'],
    },
    practicalContext: {
      industryAdoption: ['Automotive (fuel systems)', 'Medical devices', 'Consumer goods', 'Industrial', 'SLS 3D printing'],
      commonApplications: ['Fuel lines', 'Brake lines', 'Cable sheathing', 'Medical tubing', 'Precision mechanical parts'],
      safetyStandards: ['FDA food contact grades', 'Automotive fuel system certifications', 'Medical device grades'],
      costPosition: 'Premium',
    },
    trivia: {
      funFacts: [
        'PA12 absorbs only 1.4% water vs PA6\'s 9.5% - much easier to print successfully',
        'Most automotive fuel lines are PA12 due to chemical and dimensional stability',
        'PA12 is the most popular material for industrial SLS 3D printing',
        'The "12" refers to 12 carbon atoms in the laurolactam monomer',
      ],
      whyInvented: 'Developed to overcome moisture sensitivity limitations of PA6 and PA66 for demanding applications.',
      controversies: [
        'Premium pricing limits adoption despite excellent properties',
        '2020 PA12 shortage caused by Evonik factory explosion disrupted global supply chains',
      ],
      marketAdoption: 'Dominant in SLS 3D printing. Growing in FDM as users discover easier printing vs PA6.',
    },
    tdsProfile: {
      properties: [
        { name: 'Tensile Strength', value: '40-55', unit: 'MPa', implications: 'Moderate strength. Lower than PA6/PA66 but more consistent.' },
        { name: 'Elongation at Break', value: '100-300', unit: '%', implications: 'Excellent ductility. Very flexible material.' },
        { name: "Young's Modulus", value: '1100-1400', unit: 'MPa', implications: 'More flexible than PA6. Maintains stiffness better in humidity.' },
        { name: 'Impact Strength', value: 'No Break', unit: '', implications: 'Outstanding impact resistance. Typically does not break in Izod testing.' },
        { name: 'Glass Transition (Tg)', value: '37-40', unit: '°C', implications: 'Lower Tg than other nylons.' },
        { name: 'Melting Point', value: '178-180', unit: '°C', implications: 'Lower melting point. Easier processing but lower heat resistance.' },
        { name: 'Water Absorption', value: '1.4', unit: '%', implications: 'Excellent - dramatically lower than other polyamides.' },
      ],
      notes: 'Properties more consistent than PA6/PA66 due to low moisture absorption. The "stable nylon."',
    },
    printSettings: {
      nozzleTemp: { min: 235, max: 265, optimal: 250 },
      bedTemp: { min: 70, max: 90, optimal: 80 },
      coolingFan: { min: 0, max: 40, notes: 'Low cooling. Slightly more tolerant than PA6.' },
      enclosure: { required: false, notes: 'Recommended but not strictly required for smaller parts.' },
      drying: { temp: 70, duration: '6-8 hours', notes: 'Still needs drying, but less critical than PA6. Reabsorbs slowly.' },
      printSpeed: { recommended: '30-50 mm/s', notes: 'Moderate speeds. More forgiving than PA6.' },
      additionalNotes: [
        'Easier to print than PA6/PA66 due to lower moisture sensitivity',
        'Still benefits from dry box but more forgiving',
        'Garolite or glue stick on PEI works well',
        'Lower temps than PA6 - watch for over-extrusion',
        'Parts maintain dimensions better than PA6 in varying humidity',
      ],
    },
    adhesion: {
      bedSurfaces: {
        excellent: ['Garolite (G10)', 'PEI with glue stick'],
        good: ['Glass with glue', 'BuildTak'],
        poor: ['Bare smooth PEI', 'Blue tape'],
      },
      releaseAgents: 'Glue stick helps with both adhesion and release.',
      multiMaterial: [
        { material: 'PA6', bondQuality: 'Strong Chemical Bond', notes: 'Same polymer family.' },
        { material: 'PA-CF', bondQuality: 'Strong Chemical Bond', notes: 'Compatible variants.' },
        { material: 'TPU', bondQuality: 'Mechanical Bond', notes: 'Useful for flexible-rigid combinations.' },
      ],
    },
    postProcessing: {
      chemicalSmoothing: [
        { method: 'Formic Acid', effectiveness: 'Good', notes: 'Works but dangerous. Professional use only.' },
      ],
      mechanical: ['Sands well', 'Machines excellently', 'Can be polished smooth'],
      glues: ['Cyanoacrylate', 'Epoxy', 'Nylon-specific adhesives'],
      painting: 'Accepts dyes well. Priming recommended for paint.',
    },
    safety: {
      fumes: { level: 'Low', notes: 'Lower emissions than PA6. Still use ventilation.' },
      foodSafety: { rating: 'Some Grades', notes: 'FDA-approved grades available.' },
      biodegradability: { rating: 'Not Biodegradable', notes: 'Petroleum-based polymer.' },
      additionalNotes: [
        'Lower emissions than PA6 due to different monomer',
        'Safe with normal ventilation',
        'Medical grades available',
      ],
    },
  },

  'Nylon-GF': {
    name: 'Nylon-GF',
    fullName: 'Glass Fiber Reinforced Polyamide (PA-GF)',
    origin: {
      yearInvented: '1950s (glass-reinforced compounds), 2017+ (3D printing filaments)',
      originalCompany: 'Various compounders developed GF-reinforced nylons',
      keyMilestones: [
        '1950s: Glass fiber reinforced plastics emerge',
        '1970s: GF-nylon becomes standard engineering material',
        '2017: Nylon-GF filaments become available for 3D printing',
        '2020+: Growing adoption as alternative to CF when cost matters',
      ],
      majorManufacturers: ['3DXTech', 'Polymaker', 'Fiberlogy', 'Taulman3D', 'Matterhackers'],
    },
    composition: {
      basePolymer: 'Polyamide (typically PA6 or PA66)',
      chemicalFamily: 'Glass Fiber Reinforced Polyamide Composite',
      keyAdditives: ['Short glass fibers (15-40%)', 'Coupling agents', 'Lubricants'],
      coloringAgents: 'Usually natural/grey due to glass fibers, some colored options',
      specialFillers: ['E-glass fibers (most common)', 'Specialty glass types'],
    },
    familyContext: {
      parentPolymer: 'Nylon (Polyamide)',
      variants: ['PA6-GF15', 'PA6-GF30', 'PA66-GF30', 'PA12-GF'],
      chemicalComparison: 'Similar to Nylon-CF but with glass instead of carbon. Less stiff than CF but cheaper and electrically insulating.',
      evolution: 'Industrial workhorse material adapted for 3D printing to meet demand for strong, stiff, affordable composites.',
    },
    strengths: {
      uniqueProperties: ['High stiffness', 'Excellent dimensional stability', 'High strength', 'Good heat resistance', 'Electrically insulating', 'Lower cost than CF'],
      bestUseScenarios: ['Structural components', 'Housings and enclosures', 'High-temp applications', 'Parts requiring electrical insulation', 'Cost-effective stiffening'],
      advantagesOverCompetitors: ['Much cheaper than carbon fiber', 'Electrically insulating (CF is conductive)', 'Better availability', 'Good balance of properties'],
      whyChooseThis: 'When you need significantly stiffer and stronger nylon at lower cost than CF, especially for parts requiring electrical insulation.',
    },
    weaknesses: {
      limitations: ['Abrasive - requires hardened nozzle', 'Heavier than carbon fiber', 'Less stiff than CF', 'Surface finish can be rough'],
      commonProblems: ['Wears brass nozzles rapidly', 'Hygroscopic (must dry)', 'Warping', 'Layer adhesion weaker than solid nylon'],
      environmentalConcerns: ['Glass fibers are non-biodegradable', 'Dust hazard during post-processing', 'Difficult to recycle'],
      whenNotToUse: ['When surface finish is critical', 'Maximum stiffness (use CF instead)', 'Parts requiring drilling/machining', 'When weight is critical'],
    },
    practicalContext: {
      industryAdoption: ['Automotive', 'Industrial', 'Consumer goods', 'Electrical housings', 'HVAC'],
      commonApplications: ['Housings', 'Brackets', 'Covers', 'Structural parts', 'Electrical enclosures', 'Under-hood automotive'],
      safetyStandards: ['UL rated grades available', 'Automotive certifications', 'Various fire ratings'],
      costPosition: 'Standard',
    },
    trivia: {
      funFacts: [
        'Glass fiber is about 1/5 the cost of carbon fiber per kg',
        'GF-nylon was the standard engineering plastic before CF became affordable',
        'The short fibers (0.2-0.5mm) orient during printing, creating anisotropic properties',
        'E-glass used in filaments is the same glass used in fiberglass boats',
      ],
      whyInvented: 'Developed to dramatically improve stiffness and strength of nylon at reasonable cost.',
      controversies: [
        'Often overlooked in favor of "sexier" carbon fiber despite being perfectly adequate',
        'Surface finish is rougher than CF, leading to perception as inferior',
      ],
      marketAdoption: 'Very common in injection molding. Growing in 3D printing as cost-conscious alternative to CF.',
    },
    tdsProfile: {
      properties: [
        { name: 'Tensile Strength', value: '85-140', unit: 'MPa', implications: 'Excellent strength - significantly higher than unfilled nylon.' },
        { name: 'Tensile Modulus', value: '6000-11000', unit: 'MPa', implications: 'Very high stiffness. 3-5x stiffer than unfilled nylon.' },
        { name: 'Elongation at Break', value: '2-4', unit: '%', implications: 'Low elongation. Brittle compared to unfilled nylon.' },
        { name: 'Heat Deflection (HDT)', value: '200-260', unit: '°C (1.8 MPa)', implications: 'Excellent heat resistance. Maintains stiffness at high temps.' },
        { name: 'Impact Strength', value: '80-120', unit: 'J/m', implications: 'Good but lower than unfilled nylon due to fiber brittleness.' },
        { name: 'Fiber Content', value: '15-40', unit: '%', implications: 'Higher content = stiffer but more abrasive and brittle.' },
      ],
      notes: 'Properties depend on fiber content and base nylon type. PA66-GF30 is the most common industrial grade.',
    },
    printSettings: {
      nozzleTemp: { min: 250, max: 290, optimal: 270 },
      bedTemp: { min: 80, max: 110, optimal: 95 },
      coolingFan: { min: 0, max: 20, notes: 'Minimal cooling. Glass fibers act as nucleating agents.' },
      enclosure: { required: true, notes: 'Required. Chamber temp 50-70°C recommended.' },
      drying: { temp: 80, duration: '8-12 hours', notes: 'Critical - base nylon still hygroscopic. Use dry box during printing.' },
      printSpeed: { recommended: '30-50 mm/s', notes: 'Moderate speeds. Slower than unfilled nylon for better layer adhesion.' },
      additionalNotes: [
        'HARDENED NOZZLE REQUIRED - glass fibers destroy brass in hours',
        'Use at least 0.5mm nozzle to prevent clogging',
        'Larger layer heights (0.2mm+) improve layer adhesion',
        'Garolite provides best bed adhesion',
        'Print from dry box essential',
        'Wear mask when sanding - glass fiber dust is hazardous',
      ],
    },
    adhesion: {
      bedSurfaces: {
        excellent: ['Garolite (G10)', 'Nylon-specific sheets'],
        good: ['PEI with glue', 'Glass with specialty adhesive'],
        poor: ['Bare PEI', 'Blue tape'],
      },
      releaseAgents: 'Strong adhesion to Garolite. May need mechanical removal on large parts.',
      multiMaterial: [
        { material: 'Nylon', bondQuality: 'Strong Chemical Bond', notes: 'Same polymer family. Good for reinforced sections.' },
        { material: 'PA-CF', bondQuality: 'Strong Chemical Bond', notes: 'Compatible for hybrid structures.' },
        { material: 'TPU', bondQuality: 'Mechanical Bond', notes: 'Possible for flexible-rigid parts.' },
      ],
    },
    postProcessing: {
      chemicalSmoothing: [
        { method: 'Chemical', effectiveness: 'Difficult', notes: 'Not recommended - fibers remain exposed and rough.' },
      ],
      mechanical: ['Sanding possible but creates hazardous dust', 'Machining difficult - dulls tools', 'Tumbling for edge smoothing'],
      glues: ['Epoxy (best)', 'Cyanoacrylate with activator', 'Nylon adhesives'],
      painting: 'Surface is rough. Heavy priming/filling required for smooth finish.',
    },
    safety: {
      fumes: { level: 'Moderate', notes: 'Nylon fumes plus potential glass fiber particles. Use ventilation and filtration.' },
      foodSafety: { rating: 'Not Recommended', notes: 'Fiber exposure and surface porosity concerns.' },
      biodegradability: { rating: 'Not Biodegradable', notes: 'Petroleum plastic with glass fibers. Not recyclable in standard streams.' },
      additionalNotes: [
        'WEAR RESPIRATORY PROTECTION when sanding or machining',
        'Glass fiber dust is a respiratory hazard',
        'Use HEPA filtration if printing enclosed',
        'Wash hands after handling raw filament',
      ],
    },
  },

  'Nylon-CF': {
    name: 'Nylon-CF',
    fullName: 'Carbon Fiber Reinforced Polyamide (PA-CF)',
    origin: {
      yearInvented: '2014-2015 (3D printing filaments)',
      originalCompany: 'Multiple pioneers including Markforged, 3DXTech',
      keyMilestones: [
        '2014: Markforged introduces continuous carbon fiber nylon',
        '2015: Short carbon fiber PA filaments become available',
        '2017: PA-CF becomes mainstream engineering filament',
        '2020+: Wide adoption for functional prototypes and end-use parts',
      ],
      majorManufacturers: ['Markforged', '3DXTech', 'Polymaker', 'colorFabb', 'Matterhackers', 'Fiberlogy'],
    },
    composition: {
      basePolymer: 'Polyamide (typically PA6, PA66, or PA12)',
      chemicalFamily: 'Carbon Fiber Reinforced Polyamide Composite',
      keyAdditives: ['Chopped carbon fibers (10-20%)', 'Coupling agents', 'Lubricants'],
      coloringAgents: 'Black/dark grey due to carbon fibers',
      specialFillers: ['PAN-based carbon fibers', 'Pitch-based carbon fibers (rare)'],
    },
    familyContext: {
      parentPolymer: 'Nylon (Polyamide)',
      variants: ['PA6-CF', 'PA12-CF', 'PA66-CF', 'High-CF content variants'],
      chemicalComparison: 'Similar to Nylon-GF but lighter, stiffer, and stronger. Electrically conductive unlike GF.',
      evolution: 'Premium composite developed for maximum stiffness-to-weight ratio in 3D printing.',
    },
    strengths: {
      uniqueProperties: ['Exceptional stiffness', 'High strength-to-weight ratio', 'Excellent dimensional stability', 'Low thermal expansion', 'Professional appearance'],
      bestUseScenarios: ['Structural parts', 'Tooling and fixtures', 'Drone components', 'Automotive parts', 'Prosthetics'],
      advantagesOverCompetitors: ['Stiffest 3D printing material available', 'Lighter than GF equivalent', 'Better thermal stability', 'Professional matte finish'],
      whyChooseThis: 'When you need maximum stiffness and strength with minimum weight for demanding engineering applications.',
    },
    weaknesses: {
      limitations: ['Very abrasive - requires hardened nozzle', 'Expensive', 'Hygroscopic', 'Electrically conductive', 'Brittle in thin sections'],
      commonProblems: ['Destroys brass nozzles quickly', 'Moisture absorption', 'Warping', 'Poor layer adhesion if wet', 'Anisotropic properties'],
      environmentalConcerns: ['Carbon fibers non-biodegradable', 'Dust hazard', 'Difficult to recycle', 'High embodied energy'],
      whenNotToUse: ['Electrical insulation required', 'Impact-resistant parts', 'Flexible parts', 'Budget projects'],
    },
    practicalContext: {
      industryAdoption: ['Aerospace', 'Automotive', 'Robotics', 'Medical devices', 'Tooling', 'Drones'],
      commonApplications: ['Drone frames', 'End effectors', 'Jigs and fixtures', 'Brackets', 'Prosthetic components', 'Race car parts'],
      safetyStandards: ['Various aerospace and automotive certifications available'],
      costPosition: 'Premium',
    },
    trivia: {
      funFacts: [
        'CF-nylon can be as stiff as aluminum at 1/3 the weight',
        'Short fibers orient during printing, creating strongest parts in XY direction',
        'Markforged pioneered continuous carbon fiber which is even stronger',
        'The matte black finish is prized for aesthetic as well as functional parts',
      ],
      whyInvented: 'Developed to bring aerospace-grade composite performance to desktop 3D printing.',
      controversies: [
        'Often over-specified when simpler materials would suffice',
        'Marketing claims of "metal replacement" can be misleading',
        'Health concerns about carbon fiber dust during post-processing',
      ],
      marketAdoption: 'The go-to material for serious engineering applications in FDM 3D printing.',
    },
    tdsProfile: {
      properties: [
        { name: 'Tensile Strength', value: '90-150', unit: 'MPa', implications: 'Excellent strength - among the highest for FDM materials.' },
        { name: 'Tensile Modulus', value: '8000-14000', unit: 'MPa', implications: 'Extremely stiff. 5-7x stiffer than unfilled nylon.' },
        { name: 'Elongation at Break', value: '1.5-4', unit: '%', implications: 'Very low. Material is stiff but brittle.' },
        { name: 'Heat Deflection (HDT)', value: '180-250', unit: '°C (1.8 MPa)', implications: 'Excellent heat resistance. Maintains stiffness at high temps.' },
        { name: 'Density', value: '1.1-1.2', unit: 'g/cm³', implications: 'Light - carbon fiber is less dense than glass.' },
        { name: 'Fiber Content', value: '10-20', unit: '%', implications: 'Optimized for printability vs stiffness balance.' },
      ],
      notes: 'Properties highly anisotropic. XY direction (along fibers) much stronger than Z direction.',
    },
    printSettings: {
      nozzleTemp: { min: 255, max: 290, optimal: 275 },
      bedTemp: { min: 80, max: 110, optimal: 95 },
      coolingFan: { min: 0, max: 20, notes: 'Minimal cooling for best layer adhesion.' },
      enclosure: { required: true, notes: 'Required. Chamber temp 50-70°C recommended.' },
      drying: { temp: 80, duration: '8-12 hours', notes: 'Critical - moisture destroys print quality. Use dry box during printing.' },
      printSpeed: { recommended: '30-50 mm/s', notes: 'Moderate speeds. Slower for better fiber orientation.' },
      additionalNotes: [
        'HARDENED NOZZLE REQUIRED - CF destroys brass rapidly',
        'Use 0.5mm+ nozzle to prevent clogging',
        'Print from dry box essential',
        'Garolite provides best bed adhesion',
        'Larger layer heights improve Z-strength',
        'Wear mask when sanding - carbon dust hazardous',
      ],
    },
    adhesion: {
      bedSurfaces: {
        excellent: ['Garolite (G10)', 'Nylon-specific sheets'],
        good: ['PEI with glue', 'Glass with specialty adhesive'],
        poor: ['Bare PEI', 'Blue tape'],
      },
      releaseAgents: 'Strong adhesion to Garolite. Cool completely before removal.',
      multiMaterial: [
        { material: 'Nylon', bondQuality: 'Strong Chemical Bond', notes: 'Same polymer base. Excellent for reinforced sections.' },
        { material: 'Nylon-GF', bondQuality: 'Strong Chemical Bond', notes: 'Compatible - can mix for cost optimization.' },
        { material: 'TPU', bondQuality: 'Mechanical Bond', notes: 'Useful for rigid-flexible combinations.' },
      ],
    },
    postProcessing: {
      chemicalSmoothing: [
        { method: 'Chemical', effectiveness: 'Difficult', notes: 'Not recommended - fibers remain exposed.' },
      ],
      mechanical: ['Sanding possible with PPE', 'Machining possible but dulls tools', 'Tumbling for edge smoothing'],
      glues: ['Epoxy (best)', 'Cyanoacrylate with activator', 'Structural adhesives'],
      painting: 'Usually left natural (matte black). Prime heavily if painting needed.',
    },
    safety: {
      fumes: { level: 'Moderate', notes: 'Nylon fumes plus carbon particles. Use ventilation and filtration.' },
      foodSafety: { rating: 'Not Recommended', notes: 'Fiber exposure and porosity concerns.' },
      biodegradability: { rating: 'Not Biodegradable', notes: 'Carbon fibers persist indefinitely.' },
      additionalNotes: [
        'WEAR RESPIRATORY PROTECTION when sanding',
        'Carbon fiber dust is a respiratory hazard',
        'Use HEPA filtration during printing',
        'Carbon fibers can irritate skin',
      ],
    },
  },

  'Nylon-AF': {
    name: 'Nylon-AF',
    fullName: 'Aramid Fiber Reinforced Polyamide (Kevlar-Nylon)',
    origin: {
      yearInvented: '2016-2017 (3D printing filaments)',
      originalCompany: 'DuPont (Kevlar fiber), adapted for 3D printing by various manufacturers',
      keyMilestones: [
        '1965: DuPont invents Kevlar aramid fiber',
        '2016: Aramid-reinforced nylon filaments emerge',
        '2018: Matterhackers NylonK and others launch',
        '2020+: Niche adoption for impact-critical applications',
      ],
      majorManufacturers: ['Matterhackers (NylonK)', 'Fillamentum', 'Recreus', 'Spectrum'],
    },
    composition: {
      basePolymer: 'Polyamide (typically PA6 or PA12)',
      chemicalFamily: 'Aramid Fiber Reinforced Polyamide Composite',
      keyAdditives: ['Chopped aramid fibers (Kevlar/Twaron) 10-20%', 'Coupling agents'],
      coloringAgents: 'Yellow-tan due to aramid fiber color (Kevlar yellow)',
      specialFillers: ['Para-aramid fibers (Kevlar, Twaron)'],
    },
    familyContext: {
      parentPolymer: 'Nylon (Polyamide)',
      variants: ['NylonK (Matterhackers)', 'Various branded AF-nylons'],
      chemicalComparison: 'Less stiff than CF but much tougher. Excellent impact resistance unlike brittle CF.',
      evolution: 'Developed to combine nylon\'s toughness with aramid\'s energy absorption.',
    },
    strengths: {
      uniqueProperties: ['Exceptional impact resistance', 'Excellent abrasion resistance', 'High fatigue life', 'Good vibration damping', 'No electrical conductivity'],
      bestUseScenarios: ['Impact-resistant parts', 'Wear surfaces', 'Protective equipment', 'Vibration damping', 'Parts that must not shatter'],
      advantagesOverCompetitors: ['Much tougher than CF-nylon', 'Better impact resistance than GF', 'Electrically insulating', 'Excellent fatigue resistance'],
      whyChooseThis: 'When parts must withstand impacts, vibration, or repeated stress cycles without fracturing.',
    },
    weaknesses: {
      limitations: ['Less stiff than CF', 'Moisture sensitive', 'Limited color options (yellow-tan)', 'Difficult to sand smooth'],
      commonProblems: ['Fuzzy surface finish from protruding fibers', 'Hygroscopic', 'Warping', 'Fibers can clog nozzles'],
      environmentalConcerns: ['Aramid non-biodegradable', 'Difficult to recycle', 'Dust concerns'],
      whenNotToUse: ['Maximum stiffness required (use CF)', 'Aesthetic parts (fuzzy finish)', 'When appearance matters more than function'],
    },
    practicalContext: {
      industryAdoption: ['Protective equipment', 'Automotive', 'Aerospace', 'Industrial', 'Sports equipment'],
      commonApplications: ['Protective covers', 'Impact guards', 'Wear pads', 'Vibration dampers', 'Hinges', 'Repeated-stress components'],
      safetyStandards: ['Kevlar is used in bulletproof vests - aramid nylon inherits some protective properties'],
      costPosition: 'Premium',
    },
    trivia: {
      funFacts: [
        'Kevlar was invented by Stephanie Kwolek at DuPont in 1965',
        'Aramid fibers are 5x stronger than steel by weight',
        'The yellow color is characteristic of Kevlar - can\'t be hidden easily',
        'Unlike CF, aramid fibers don\'t splinter when broken - safer handling',
      ],
      whyInvented: 'Created to bring Kevlar\'s legendary toughness to 3D printed parts.',
      controversies: [
        'Often confused with CF-nylon despite very different properties',
        'The fuzzy surface finish is polarizing - some love it, some hate it',
      ],
      marketAdoption: 'Niche material for specific impact/wear applications. Less common than CF or GF.',
    },
    tdsProfile: {
      properties: [
        { name: 'Tensile Strength', value: '60-90', unit: 'MPa', implications: 'Good strength. Lower than CF but more ductile.' },
        { name: 'Tensile Modulus', value: '3000-5000', unit: 'MPa', implications: 'Moderate stiffness. Less stiff than CF or GF.' },
        { name: 'Elongation at Break', value: '6-12', unit: '%', implications: 'Higher than CF. More forgiving before failure.' },
        { name: 'Impact Strength', value: '150-250', unit: 'J/m', implications: 'Excellent - the key advantage of aramid reinforcement.' },
        { name: 'Abrasion Resistance', value: 'Excellent', unit: '', implications: 'Outstanding wear resistance for sliding applications.' },
        { name: 'Fiber Content', value: '10-20', unit: '%', implications: 'Balanced for printability and toughness.' },
      ],
      notes: 'Trades stiffness for toughness compared to CF. The go-to when impact resistance matters.',
    },
    printSettings: {
      nozzleTemp: { min: 250, max: 280, optimal: 265 },
      bedTemp: { min: 75, max: 100, optimal: 90 },
      coolingFan: { min: 0, max: 30, notes: 'Low cooling for layer adhesion.' },
      enclosure: { required: true, notes: 'Recommended for consistent results.' },
      drying: { temp: 75, duration: '8-12 hours', notes: 'Critical - hygroscopic like all nylons.' },
      printSpeed: { recommended: '30-50 mm/s', notes: 'Moderate speeds. Aramid fibers are less abrasive than CF.' },
      additionalNotes: [
        'Hardened nozzle recommended but less critical than CF',
        'Aramid is less abrasive than carbon or glass fiber',
        'Surface will have characteristic fuzzy texture',
        'Print from dry box for best results',
        'Garolite or glue on PEI for bed adhesion',
      ],
    },
    adhesion: {
      bedSurfaces: {
        excellent: ['Garolite (G10)', 'PEI with glue stick'],
        good: ['Glass with adhesive', 'BuildTak'],
        poor: ['Bare smooth PEI', 'Blue tape'],
      },
      releaseAgents: 'Glue stick helps with adhesion and release.',
      multiMaterial: [
        { material: 'Nylon', bondQuality: 'Strong Chemical Bond', notes: 'Same polymer base.' },
        { material: 'Nylon-CF', bondQuality: 'Strong Chemical Bond', notes: 'Can combine for stiffness+toughness.' },
        { material: 'TPU', bondQuality: 'Mechanical Bond', notes: 'Useful for flexible-tough combinations.' },
      ],
    },
    postProcessing: {
      chemicalSmoothing: [
        { method: 'Chemical', effectiveness: 'Difficult', notes: 'Not practical - fibers remain fuzzy.' },
      ],
      mechanical: ['Difficult to sand smooth', 'Can be tumbled', 'Trimming with scissors/knife works well'],
      glues: ['Epoxy', 'Cyanoacrylate with activator', 'Contact adhesive'],
      painting: 'Difficult due to texture. Accept natural finish or use thick primer.',
    },
    safety: {
      fumes: { level: 'Low', notes: 'Aramid produces fewer harmful particles than CF. Still use ventilation.' },
      foodSafety: { rating: 'Not Recommended', notes: 'Fiber exposure concerns.' },
      biodegradability: { rating: 'Not Biodegradable', notes: 'Aramid persists in environment.' },
      additionalNotes: [
        'Safer to handle than CF - fibers don\'t splinter',
        'Still use dust mask when sanding',
        'Less skin irritation than glass or carbon fiber',
      ],
    },
  },

  'NylonG': {
    name: 'NylonG',
    fullName: 'Glass Fiber Reinforced Nylon (Matterhackers)',
    origin: {
      yearInvented: '2017',
      originalCompany: 'Matterhackers',
      keyMilestones: [
        '2017: Matterhackers launches NylonG as part of PRO series',
        '2018+: Becomes popular entry point for reinforced nylon',
        '2020+: Widely recommended for functional parts',
      ],
      majorManufacturers: ['Matterhackers'],
    },
    composition: {
      basePolymer: 'Polyamide (proprietary blend)',
      chemicalFamily: 'Glass Fiber Reinforced Polyamide',
      keyAdditives: ['Short glass fibers (~20%)', 'Processing aids'],
      coloringAgents: 'Natural grey/off-white',
      specialFillers: ['E-glass fibers'],
    },
    familyContext: {
      parentPolymer: 'Nylon (Polyamide)',
      variants: ['NylonG is Matterhackers\' branded GF-nylon'],
      chemicalComparison: 'Similar to generic PA-GF30. Optimized for FDM printing.',
      evolution: 'Branded version of glass-filled nylon optimized for Matterhackers ecosystem.',
    },
    strengths: {
      uniqueProperties: ['High stiffness', 'Good strength', 'Dimensional stability', 'Electrical insulation', 'Cost-effective composite'],
      bestUseScenarios: ['Structural parts', 'Housings', 'Brackets', 'Jigs and fixtures', 'Electrical enclosures'],
      advantagesOverCompetitors: ['Well-characterized for FDM', 'Good documentation', 'Reliable performance', 'Cheaper than CF-nylon'],
      whyChooseThis: 'When you want reliable glass-filled nylon performance with good documentation and support.',
    },
    weaknesses: {
      limitations: ['Abrasive - requires hardened nozzle', 'Hygroscopic', 'Less stiff than NylonX (CF)'],
      commonProblems: ['Wears brass nozzles', 'Moisture absorption', 'Warping on large parts'],
      environmentalConcerns: ['Glass fibers non-biodegradable', 'Dust hazard during post-processing'],
      whenNotToUse: ['Maximum stiffness (use NylonX)', 'When surface finish is critical', 'Without hardened nozzle'],
    },
    practicalContext: {
      industryAdoption: ['Prototyping', 'Light industrial', 'DIY/Maker', 'Small batch production'],
      commonApplications: ['Brackets', 'Mounts', 'Housings', 'Functional prototypes', 'End-use parts'],
      safetyStandards: ['General engineering use'],
      costPosition: 'Standard',
    },
    trivia: {
      funFacts: [
        'NylonG is part of Matterhackers\' "Build" series alongside NylonX',
        'The "G" stands for Glass (fiber)',
        'Often recommended as more affordable alternative to NylonX for many applications',
      ],
      whyInvented: 'Created to offer accessible, well-documented glass-filled nylon for the maker community.',
      controversies: [
        'Some debate whether it\'s worth the premium over generic PA-GF filaments',
      ],
      marketAdoption: 'Popular in North American maker/prosumer market.',
    },
    tdsProfile: {
      properties: [
        { name: 'Tensile Strength', value: '85-95', unit: 'MPa', implications: 'Good strength for structural applications.' },
        { name: 'Tensile Modulus', value: '5500-6500', unit: 'MPa', implications: 'High stiffness. Significant improvement over unfilled.' },
        { name: 'Elongation at Break', value: '3-5', unit: '%', implications: 'Low elongation. Stiff but less ductile.' },
        { name: 'Heat Deflection', value: '180-200', unit: '°C', implications: 'Good heat resistance.' },
        { name: 'Glass Fiber Content', value: '~20', unit: '%', implications: 'Balanced for printability and performance.' },
      ],
      notes: 'Well-characterized for FDM printing. Consistent lot-to-lot properties.',
    },
    printSettings: {
      nozzleTemp: { min: 255, max: 275, optimal: 265 },
      bedTemp: { min: 80, max: 100, optimal: 90 },
      coolingFan: { min: 0, max: 20, notes: 'Minimal cooling.' },
      enclosure: { required: true, notes: 'Recommended for best results.' },
      drying: { temp: 75, duration: '8-12 hours', notes: 'Must dry thoroughly before printing.' },
      printSpeed: { recommended: '35-50 mm/s', notes: 'Moderate speeds work well.' },
      additionalNotes: [
        'HARDENED NOZZLE REQUIRED',
        'Print from dry box',
        'Garolite or glue stick on PEI for adhesion',
        '0.4mm+ nozzle recommended',
      ],
    },
    adhesion: {
      bedSurfaces: {
        excellent: ['Garolite (G10)'],
        good: ['PEI with glue', 'Glass with adhesive'],
        poor: ['Bare PEI', 'Blue tape'],
      },
      releaseAgents: 'Wait for cooling. Garolite may require scraper.',
      multiMaterial: [
        { material: 'Nylon', bondQuality: 'Strong Chemical Bond', notes: 'Same polymer family.' },
        { material: 'NylonX', bondQuality: 'Strong Chemical Bond', notes: 'Compatible for hybrid structures.' },
      ],
    },
    postProcessing: {
      chemicalSmoothing: [
        { method: 'Chemical', effectiveness: 'Difficult', notes: 'Fibers remain rough.' },
      ],
      mechanical: ['Sanding possible with PPE', 'Machining possible'],
      glues: ['Epoxy', 'Cyanoacrylate'],
      painting: 'Prime heavily for smooth finish.',
    },
    safety: {
      fumes: { level: 'Moderate', notes: 'Nylon fumes plus glass particles. Ventilation required.' },
      foodSafety: { rating: 'Not Recommended', notes: 'Fiber exposure concerns.' },
      biodegradability: { rating: 'Not Biodegradable', notes: 'Glass fibers persist.' },
      additionalNotes: [
        'Wear mask when sanding',
        'Glass dust is respiratory hazard',
      ],
    },
  },

  'NylonX': {
    name: 'NylonX',
    fullName: 'Carbon Fiber Reinforced Nylon (Matterhackers)',
    origin: {
      yearInvented: '2016',
      originalCompany: 'Matterhackers',
      keyMilestones: [
        '2016: Matterhackers launches NylonX as flagship engineering filament',
        '2017: Becomes one of the most popular CF-nylon filaments',
        '2020+: Industry standard for prosumer CF-nylon',
      ],
      majorManufacturers: ['Matterhackers'],
    },
    composition: {
      basePolymer: 'Polyamide (proprietary blend)',
      chemicalFamily: 'Carbon Fiber Reinforced Polyamide',
      keyAdditives: ['Chopped carbon fibers (~20%)', 'Processing aids'],
      coloringAgents: 'Black due to carbon fiber',
      specialFillers: ['PAN-based carbon fibers'],
    },
    familyContext: {
      parentPolymer: 'Nylon (Polyamide)',
      variants: ['NylonX is Matterhackers\' flagship CF-nylon'],
      chemicalComparison: 'Premium CF-nylon optimized for FDM. Comparable to 3DXTech CarbonX.',
      evolution: 'Developed to democratize carbon fiber nylon for desktop 3D printing.',
    },
    strengths: {
      uniqueProperties: ['Exceptional stiffness', 'High strength', 'Low weight', 'Professional matte finish', 'Dimensional stability'],
      bestUseScenarios: ['Structural parts', 'Drone components', 'Tooling', 'Automotive parts', 'Professional prototypes'],
      advantagesOverCompetitors: ['Well-documented', 'Consistent quality', 'Strong community support', 'Optimized for FDM'],
      whyChooseThis: 'The go-to CF-nylon for makers and prosumers wanting reliable, well-supported material.',
    },
    weaknesses: {
      limitations: ['Very abrasive - hardened nozzle required', 'Expensive', 'Hygroscopic', 'Electrically conductive'],
      commonProblems: ['Destroys brass nozzles', 'Must be dried', 'Warping', 'Brittle in Z-direction'],
      environmentalConcerns: ['Carbon fiber non-biodegradable', 'Dust hazard', 'Difficult to recycle'],
      whenNotToUse: ['Electrical insulation needed', 'Impact-critical parts', 'Without hardened nozzle'],
    },
    practicalContext: {
      industryAdoption: ['Prototyping', 'Drones/UAV', 'Automotive', 'Robotics', 'Tooling'],
      commonApplications: ['Drone frames', 'Brackets', 'Fixtures', 'Functional prototypes', 'End effectors'],
      safetyStandards: ['General engineering use'],
      costPosition: 'Premium',
    },
    trivia: {
      funFacts: [
        'NylonX was one of the first widely available CF-nylon filaments',
        'The "X" represents the extreme performance vs regular nylon',
        'Often the first CF material users try due to good documentation',
        'Matterhackers pairs it with NylonG for applications needing electrical insulation',
      ],
      whyInvented: 'Created to make carbon fiber nylon accessible to the maker and prosumer market.',
      controversies: [
        'Price premium debated vs generic CF-nylon options',
        'Some prefer industrial brands for production use',
      ],
      marketAdoption: 'One of the most popular CF-nylon filaments. Strong brand recognition.',
    },
    tdsProfile: {
      properties: [
        { name: 'Tensile Strength', value: '95-115', unit: 'MPa', implications: 'Excellent strength. Among highest for FDM materials.' },
        { name: 'Tensile Modulus', value: '8000-9500', unit: 'MPa', implications: 'Very high stiffness. Much stiffer than unfilled nylon.' },
        { name: 'Elongation at Break', value: '2-4', unit: '%', implications: 'Low. Stiff but brittle.' },
        { name: 'Heat Deflection', value: '180-200', unit: '°C', implications: 'Excellent heat resistance.' },
        { name: 'Carbon Fiber Content', value: '~20', unit: '%', implications: 'Optimized for printability and stiffness.' },
        { name: 'Density', value: '1.1', unit: 'g/cm³', implications: 'Lightweight composite.' },
      ],
      notes: 'Industry-standard CF-nylon. Well-characterized and reliable.',
    },
    printSettings: {
      nozzleTemp: { min: 255, max: 280, optimal: 270 },
      bedTemp: { min: 80, max: 100, optimal: 90 },
      coolingFan: { min: 0, max: 15, notes: 'Minimal to no cooling.' },
      enclosure: { required: true, notes: 'Highly recommended for all but smallest parts.' },
      drying: { temp: 75, duration: '8-12 hours', notes: 'Essential. Print from dry box.' },
      printSpeed: { recommended: '30-50 mm/s', notes: 'Moderate speeds for best fiber orientation.' },
      additionalNotes: [
        'HARDENED NOZZLE REQUIRED - carbon destroys brass rapidly',
        'Use 0.4mm+ nozzle size',
        'Garolite provides best bed adhesion',
        'Print from dry box essential',
        'Larger layer heights (0.2mm+) improve Z-strength',
        'Wear PPE when post-processing',
      ],
    },
    adhesion: {
      bedSurfaces: {
        excellent: ['Garolite (G10)', 'Matterhackers Build Surface'],
        good: ['PEI with glue', 'Glass with adhesive'],
        poor: ['Bare smooth PEI', 'Blue tape'],
      },
      releaseAgents: 'Strong adhesion. Cool completely and use scraper if needed.',
      multiMaterial: [
        { material: 'Nylon', bondQuality: 'Strong Chemical Bond', notes: 'Same polymer base.' },
        { material: 'NylonG', bondQuality: 'Strong Chemical Bond', notes: 'Compatible for cost-optimized hybrid parts.' },
        { material: 'TPU', bondQuality: 'Mechanical Bond', notes: 'Possible for flexible-rigid parts.' },
      ],
    },
    postProcessing: {
      chemicalSmoothing: [
        { method: 'Chemical', effectiveness: 'Difficult', notes: 'Not practical.' },
      ],
      mechanical: ['Sanding with PPE', 'Machining possible but dulls tools', 'Tumbling for edge work'],
      glues: ['Epoxy', 'Cyanoacrylate with activator', 'Structural adhesives'],
      painting: 'Usually left natural matte black. Prime heavily if painting.',
    },
    safety: {
      fumes: { level: 'Moderate', notes: 'Nylon emissions plus carbon particles. Good ventilation needed.' },
      foodSafety: { rating: 'Not Recommended', notes: 'Fiber exposure and porosity.' },
      biodegradability: { rating: 'Not Biodegradable', notes: 'Carbon fibers persist indefinitely.' },
      additionalNotes: [
        'WEAR RESPIRATORY PROTECTION when sanding',
        'Carbon dust is respiratory hazard',
        'Use HEPA filtration if possible',
        'Wash hands after handling',
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

  'PC-ABS': {
    name: 'PC-ABS',
    fullName: 'Polycarbonate-ABS Blend',
    origin: {
      yearInvented: '1980s',
      originalCompany: 'General Electric (developed Cycoloy brand)',
      keyMilestones: [
        '1980s: PC-ABS blends commercialized for automotive',
        '1990s: Becomes standard for automotive interiors',
        '2000s: Stratasys adopts PC-ABS for FDM industrial printers',
        '2015+: Desktop-accessible PC-ABS formulations emerge',
      ],
      majorManufacturers: ['Covestro', 'SABIC', 'Stratasys', 'Polymaker', 'eSUN', '3DXTech'],
    },
    composition: {
      basePolymer: 'Polycarbonate (50-70%) + ABS (30-50%) blend',
      chemicalFamily: 'Polymer blend (Polycarbonate + Acrylonitrile Butadiene Styrene)',
      keyAdditives: ['Compatibilizers', 'Impact modifiers', 'UV stabilizers'],
      coloringAgents: 'Naturally opaque, accepts various pigments, typically darker colors',
      specialFillers: ['Some formulations include fire retardants'],
    },
    familyContext: {
      parentPolymer: 'Polycarbonate and ABS combined',
      variants: ['PC-ABS', 'PC-ABS FR (flame retardant)', 'PC-ABS HI (high impact)'],
      chemicalComparison: 'Combines PC impact resistance with ABS ease of printing. Properties intermediate between parents.',
      evolution: 'Created to make PC more processable while retaining most of its superior properties.',
    },
    strengths: {
      uniqueProperties: ['Excellent impact resistance', 'Much easier to print than pure PC', 'Good heat resistance', 'Dimensional stability'],
      bestUseScenarios: ['Automotive interior parts', 'Electronic enclosures', 'Structural prototypes', 'Functional parts requiring toughness'],
      advantagesOverCompetitors: ['Easier than PC, tougher than ABS', 'Better dimensional stability than ABS', 'Lower warping than pure PC'],
      whyChooseThis: 'When you need PC-like toughness but cannot achieve the extreme conditions pure PC requires.',
    },
    weaknesses: {
      limitations: ['Still requires enclosure', 'Lower heat resistance than pure PC', 'Less impact resistant than pure PC', 'More expensive than ABS'],
      commonProblems: ['Warping in unenclosed printers', 'Moisture absorption affects quality', 'Layer adhesion requires proper temps'],
      environmentalConcerns: ['Contains BPA from PC component', 'Not biodegradable', 'Mixed polymer harder to recycle'],
      whenNotToUse: ['Maximum impact resistance needed (use pure PC)', 'No enclosure available', 'Budget constraints (use ABS)'],
    },
    practicalContext: {
      industryAdoption: ['Automotive', 'Consumer electronics', 'Appliances', 'Industrial prototyping'],
      commonApplications: ['Dashboard components', 'Laptop housings', 'Power tool casings', 'Phone cases', 'Appliance covers'],
      safetyStandards: ['UL94 ratings available', 'Automotive interior standards'],
      costPosition: 'Premium',
    },
    trivia: {
      funFacts: [
        'PC-ABS is the standard material in Stratasys industrial FDM printers',
        'Most automotive interior trim pieces are injection molded PC-ABS',
        'The blend was specifically engineered to keep PC tough while making it processable',
        'Cycoloy brand PC-ABS has been an automotive standard for decades',
      ],
      whyInvented: 'Pure PC was too difficult to process; ABS addition made it moldable and printable while keeping most benefits.',
      controversies: [
        'Some PC-ABS blends skimp on PC content for easier printing',
        'Properties vary significantly between manufacturers',
        'Marketing sometimes overstates heat resistance compared to pure PC',
      ],
      marketAdoption: 'Widely adopted in industrial 3D printing, growing in desktop market for users with enclosures.',
    },
    tdsProfile: {
      properties: [
        { name: 'Tensile Strength', value: '45-55', unit: 'MPa', implications: 'High. Between ABS and PC strength.' },
        { name: 'Elongation at Break', value: '80-130', unit: '%', implications: 'Good ductility. Better than ABS.' },
        { name: "Young's Modulus", value: '2000-2300', unit: 'MPa', implications: 'Good stiffness. Slightly less rigid than pure PC.' },
        { name: 'Impact Strength (Notched)', value: '400-600', unit: 'J/m', implications: 'Excellent. Much better than ABS, slightly less than PC.' },
        { name: 'Glass Transition (Tg)', value: '115-125', unit: '°C', implications: 'Good heat resistance. Better than ABS, less than PC.' },
        { name: 'Heat Deflection (HDT)', value: '100-115', unit: '°C (0.45 MPa)', implications: 'Good heat deflection. Suitable for warm environments.' },
      ],
      notes: 'Properties depend heavily on PC:ABS ratio. Higher PC content = better properties but harder to print.',
    },
    printSettings: {
      nozzleTemp: { min: 250, max: 280, optimal: 265 },
      bedTemp: { min: 90, max: 110, optimal: 100 },
      coolingFan: { min: 0, max: 30, notes: 'Minimal cooling. Some fan acceptable, unlike pure PC.' },
      enclosure: { required: true, notes: 'Strongly recommended. 50-60°C chamber temperature helps significantly.' },
      drying: { temp: 80, duration: '4-6 hours', notes: 'Hygroscopic. Moisture causes bubbling and poor layer adhesion.' },
      printSpeed: { recommended: '40-60 mm/s', notes: 'Moderate speeds. Slower first layer improves adhesion.' },
      additionalNotes: [
        'All-metal hotend required at higher temps',
        'Less demanding than pure PC but still needs proper setup',
        'Brim recommended for adhesion',
        'Cool slowly to prevent cracking',
      ],
    },
    adhesion: {
      bedSurfaces: {
        excellent: ['PEI (Textured)', 'Garolite', 'ABS slurry on glass'],
        good: ['Glass with glue stick', 'BuildTak'],
        poor: ['Bare glass', 'Blue tape'],
      },
      releaseAgents: 'ABS slurry (ABS dissolved in acetone) works excellently. Standard glue stick acceptable.',
      multiMaterial: [
        { material: 'ABS', bondQuality: 'Strong Chemical Bond', notes: 'Excellent compatibility due to ABS content.' },
        { material: 'PC', bondQuality: 'Strong Chemical Bond', notes: 'Good bonding with pure PC.' },
        { material: 'ASA', bondQuality: 'Strong Chemical Bond', notes: 'Similar chemistry enables good adhesion.' },
      ],
    },
    postProcessing: {
      chemicalSmoothing: [
        { method: 'Acetone vapor', effectiveness: 'Good', notes: 'ABS component allows acetone smoothing, though slower than pure ABS.' },
        { method: 'Dichloromethane', effectiveness: 'Excellent', notes: 'Very effective but highly toxic. Professional use only.' },
      ],
      mechanical: ['Sands well', 'Drills and taps cleanly', 'CNC machinable'],
      glues: ['Cyanoacrylate', 'Epoxy', 'ABS slurry for solvent welding'],
      painting: 'Accepts paints well. Light sanding improves adhesion.',
    },
    safety: {
      fumes: { level: 'High', notes: 'Releases styrene and BPA. Good ventilation required. Filtration recommended.' },
      foodSafety: { rating: 'Not Recommended', notes: 'BPA from PC component makes it unsuitable for food contact.' },
      biodegradability: { rating: 'Not Biodegradable', notes: 'Petroleum-based blend. Very stable in environment.' },
      additionalNotes: [
        'BPA is present from PC component',
        'Styrene fumes from ABS component',
        'HEPA + carbon filtration strongly recommended',
        'Better to print in enclosed, ventilated space',
      ],
    },
  },

  'PC-CF': {
    name: 'PC-CF',
    fullName: 'Carbon Fiber Reinforced Polycarbonate',
    origin: {
      yearInvented: '2010s (for 3D printing)',
      originalCompany: 'Multiple manufacturers developed similar products',
      keyMilestones: [
        '2010s: CF-reinforced filaments emerge for desktop printers',
        '2015: 3DXTech and others commercialize PC-CF',
        '2018+: High-flow nozzles make CF printing more accessible',
        '2020+: Growing adoption for functional prototypes',
      ],
      majorManufacturers: ['3DXTech', 'Polymaker', 'eSUN', 'Priline', 'Matterhackers'],
    },
    composition: {
      basePolymer: 'Polycarbonate (85-90%)',
      chemicalFamily: 'Polycarbonate with carbon fiber reinforcement',
      keyAdditives: ['Chopped carbon fiber (10-15%)', 'Coupling agents'],
      coloringAgents: 'Black/grey appearance from carbon fiber. No other colors possible.',
      specialFillers: ['Milled or chopped carbon fibers'],
    },
    familyContext: {
      parentPolymer: 'Polycarbonate base',
      variants: ['PC-CF', 'PC-CF15 (15% fiber)', 'PC-CF20 (20% fiber)'],
      chemicalComparison: 'Stiffer and stronger than pure PC, but less impact resistant due to fiber brittleness.',
      evolution: 'Carbon fiber addition maximizes stiffness while maintaining PC heat resistance.',
    },
    strengths: {
      uniqueProperties: ['Exceptional stiffness', 'High heat resistance', 'Low warping', 'Excellent dimensional stability'],
      bestUseScenarios: ['Structural jigs/fixtures', 'Aerospace prototypes', 'High-temp tooling', 'Stiffness-critical parts'],
      advantagesOverCompetitors: ['Stiffer than any unreinforced plastic', 'Less warping than pure PC', 'Better dimensional accuracy'],
      whyChooseThis: 'When maximum stiffness at high temperatures is required and impact resistance is secondary.',
    },
    weaknesses: {
      limitations: ['Extremely abrasive - destroys brass nozzles', 'Reduced impact vs pure PC', 'Anisotropic properties', 'Expensive'],
      commonProblems: ['Nozzle wear without hardened nozzle', 'Layer delamination under impact', 'Fiber orientation affects strength'],
      environmentalConcerns: ['Carbon fiber not recyclable', 'Energy intensive production', 'Potential for fiber inhalation'],
      whenNotToUse: ['Impact-critical parts (use pure PC)', 'Without hardened nozzle', 'Budget applications'],
    },
    practicalContext: {
      industryAdoption: ['Aerospace', 'Automotive tooling', 'Robotics', 'Industrial equipment'],
      commonApplications: ['UAV frames', 'End-of-arm tooling', 'CMM fixtures', 'High-temp brackets', 'Structural inserts'],
      safetyStandards: ['Varies by manufacturer - some UL rated'],
      costPosition: 'Industrial',
    },
    trivia: {
      funFacts: [
        'PC-CF can be stiffer than aluminum at a fraction of the weight',
        'A brass nozzle can wear out in hours printing CF materials',
        'The fibers align with print direction, making parts stronger in that axis',
        'Used in actual aerospace prototyping and low-volume production',
      ],
      whyInvented: 'To maximize PC stiffness for tooling and structural applications where rigidity matters most.',
      controversies: [
        'Many users destroy nozzles not knowing CF materials are abrasive',
        'Claimed "carbon fiber" content varies widely between brands',
        'Actual strength depends heavily on fiber length and distribution',
      ],
      marketAdoption: 'Growing industrial adoption. Desktop users with proper equipment increasingly using for functional parts.',
    },
    tdsProfile: {
      properties: [
        { name: 'Tensile Strength', value: '70-90', unit: 'MPa', implications: 'Very high. Fiber reinforcement adds significant strength.' },
        { name: 'Elongation at Break', value: '3-6', unit: '%', implications: 'Low. Stiff but will snap rather than deform.' },
        { name: "Young's Modulus", value: '6000-10000', unit: 'MPa', implications: 'Extremely high. One of the stiffest printable materials.' },
        { name: 'Impact Strength (Notched)', value: '100-200', unit: 'J/m', implications: 'Reduced vs PC. Fiber makes it stiffer but more brittle.' },
        { name: 'Glass Transition (Tg)', value: '145-150', unit: '°C', implications: 'Maintains PC heat resistance. Excellent high-temp capability.' },
        { name: 'Heat Deflection (HDT)', value: '140-150', unit: '°C (0.45 MPa)', implications: 'Outstanding. Maintains shape under heat load.' },
      ],
      notes: 'Properties are highly anisotropic - much stronger in print direction. Design accordingly.',
    },
    printSettings: {
      nozzleTemp: { min: 280, max: 320, optimal: 300 },
      bedTemp: { min: 100, max: 130, optimal: 115 },
      coolingFan: { min: 0, max: 20, notes: 'Minimal cooling. PC base still sensitive to rapid cooling.' },
      enclosure: { required: true, notes: 'REQUIRED. 60-80°C chamber temperature for reliable results.' },
      drying: { temp: 80, duration: '6-10 hours', notes: 'Very hygroscopic. Print from dry box if possible.' },
      printSpeed: { recommended: '30-50 mm/s', notes: 'Moderate speeds. Fiber can cause inconsistent flow at high speeds.' },
      additionalNotes: [
        'HARDENED NOZZLE REQUIRED - brass will wear in hours',
        'All-metal hotend mandatory',
        'Large nozzle (0.5mm+) recommended for fiber flow',
        'Slow perimeters for surface quality',
      ],
    },
    adhesion: {
      bedSurfaces: {
        excellent: ['Garolite (G10)', 'PC sheet', 'PEI with PC glue'],
        good: ['Textured PEI with adhesive'],
        poor: ['Smooth PEI', 'Glass', 'Most standard surfaces'],
      },
      releaseAgents: 'PC-specific adhesives like Vision Miner Nano Polymer. Standard glue often insufficient.',
      multiMaterial: [
        { material: 'PC', bondQuality: 'Strong Chemical Bond', notes: 'Same base polymer - excellent compatibility.' },
        { material: 'PC-ABS', bondQuality: 'Strong Chemical Bond', notes: 'Good bonding due to PC content.' },
        { material: 'ABS', bondQuality: 'Mechanical Bond', notes: 'Reasonable adhesion but different shrink rates.' },
      ],
    },
    postProcessing: {
      chemicalSmoothing: [
        { method: 'Dichloromethane', effectiveness: 'Difficult', notes: 'Works on PC matrix but fibers remain visible. Smooths less than pure PC.' },
      ],
      mechanical: ['Sands with care (fiber dust)', 'Machines well with carbide tools', 'Taps cleanly'],
      glues: ['Epoxy (best)', 'Cyanoacrylate', 'Methacrylate adhesives'],
      painting: 'Accepts paint after sanding. Fibers may show through thin paint.',
    },
    safety: {
      fumes: { level: 'High', notes: 'PC fumes plus carbon fiber particulates. Excellent ventilation and filtration mandatory.' },
      foodSafety: { rating: 'Not Safe', notes: 'BPA from PC, fiber particle concerns. Never use for food contact.' },
      biodegradability: { rating: 'Not Biodegradable', notes: 'Carbon fiber is essentially permanent. Cannot be recycled.' },
      additionalNotes: [
        'Carbon fiber dust is a respiratory hazard',
        'HEPA filtration required when sanding',
        'Wear N95 mask when post-processing',
        'BPA concerns from PC base',
        'Proper ventilation during printing is critical',
      ],
    },
  },

  'PC-FR': {
    name: 'PC-FR',
    fullName: 'Flame Retardant Polycarbonate',
    origin: {
      yearInvented: '1970s',
      originalCompany: 'GE Plastics (now SABIC) and Bayer',
      keyMilestones: [
        '1970s: Flame retardant PC formulations developed for electronics',
        '1990s: Halogen-free FR formulations developed',
        '2000s: Stricter fire safety regulations drive adoption',
        '2018+: FR-PC becomes available for 3D printing',
      ],
      majorManufacturers: ['SABIC', 'Covestro', 'Polymaker', '3DXTech', 'Stratasys'],
    },
    composition: {
      basePolymer: 'Polycarbonate with flame retardant additives',
      chemicalFamily: 'Polycarbonate (modified)',
      keyAdditives: ['Phosphorus-based flame retardants', 'Halogenated compounds (older)', 'Synergists'],
      coloringAgents: 'Limited colors - typically black, white, natural',
      specialFillers: ['Flame retardant compounds', 'Char-forming additives'],
    },
    familyContext: {
      parentPolymer: 'Polycarbonate base with FR additives',
      variants: ['PC-FR V0', 'PC-FR V2', 'Halogen-free PC-FR'],
      chemicalComparison: 'Standard PC with additives that inhibit combustion. Slightly reduced mechanical properties.',
      evolution: 'Developed to meet fire safety codes in electronics and transportation.',
    },
    strengths: {
      uniqueProperties: ['Self-extinguishing', 'UL94 V0 rating achievable', 'Maintains PC toughness', 'High heat resistance'],
      bestUseScenarios: ['Electrical enclosures', 'Transportation interiors', 'Appliance housings', 'Safety-critical parts'],
      advantagesOverCompetitors: ['Passes strict fire codes', 'Better impact than FR-ABS', 'Maintains optical clarity options'],
      whyChooseThis: 'When fire safety certification is required and standard PC cannot pass flammability tests.',
    },
    weaknesses: {
      limitations: ['Reduced impact vs standard PC', 'Higher cost', 'Limited colors', 'Some FR additives controversial'],
      commonProblems: ['FR additives can affect layer adhesion', 'May require higher temps', 'Slight brittleness increase'],
      environmentalConcerns: ['Some FR compounds are environmental concerns', 'Halogenated versions being phased out'],
      whenNotToUse: ['When fire rating not required', 'Maximum impact resistance needed', 'Outdoor UV exposure'],
    },
    practicalContext: {
      industryAdoption: ['Electronics', 'Automotive', 'Aerospace', 'Appliances', 'Rail transport'],
      commonApplications: ['Server housings', 'Electrical junction boxes', 'Aircraft interior parts', 'Train components'],
      safetyStandards: ['UL94 V0/V1/V2', 'FAR 25.853', 'EN 45545', 'FMVSS 302'],
      costPosition: 'Premium',
    },
    trivia: {
      funFacts: [
        'UL94 V0 means a flame self-extinguishes within 10 seconds',
        'Modern halogen-free FR-PC uses phosphorus chemistry instead of bromine',
        'Every commercial aircraft uses flame-retardant plastics in the cabin',
        'Some FR-PC can achieve V0 at just 0.8mm thickness',
      ],
      whyInvented: 'Fire safety regulations in electronics and transportation required plastics that would not sustain combustion.',
      controversies: [
        'Brominated flame retardants linked to health and environmental concerns',
        'Transition to halogen-free has been slow in some industries',
        'FR additives can outgas at high temperatures',
      ],
      marketAdoption: 'Essential material for certified applications, growing in 3D printing for functional prototypes.',
    },
    tdsProfile: {
      properties: [
        { name: 'Tensile Strength', value: '50-65', unit: 'MPa', implications: 'Slightly reduced from standard PC.' },
        { name: 'Elongation at Break', value: '80-120', unit: '%', implications: 'Good ductility maintained.' },
        { name: "Young's Modulus", value: '2200-2400', unit: 'MPa', implications: 'Similar stiffness to standard PC.' },
        { name: 'Impact Strength (Notched)', value: '400-600', unit: 'J/m', implications: 'Good impact, slightly less than pure PC.' },
        { name: 'UL94 Rating', value: 'V0-V2', unit: '', implications: 'Self-extinguishing. V0 is most stringent.' },
        { name: 'Heat Deflection (HDT)', value: '125-135', unit: '°C (0.45 MPa)', implications: 'Excellent heat resistance maintained.' },
      ],
      notes: 'FR rating depends on wall thickness - thicker walls achieve better ratings.',
    },
    printSettings: {
      nozzleTemp: { min: 280, max: 310, optimal: 295 },
      bedTemp: { min: 100, max: 130, optimal: 115 },
      coolingFan: { min: 0, max: 20, notes: 'Minimal cooling like standard PC.' },
      enclosure: { required: true, notes: 'Required. Same chamber requirements as standard PC.' },
      drying: { temp: 80, duration: '6-10 hours', notes: 'Hygroscopic. FR additives may increase sensitivity.' },
      printSpeed: { recommended: '30-50 mm/s', notes: 'Similar to standard PC.' },
      additionalNotes: [
        'All-metal hotend required',
        'FR additives may cause slight odor',
        'Ensure good ventilation',
        'Test fire rating on printed parts - layer lines affect performance',
      ],
    },
    adhesion: {
      bedSurfaces: {
        excellent: ['Garolite (G10)', 'PC sheet'],
        good: ['PEI with PC adhesive', 'Glass with specialized adhesive'],
        poor: ['Bare PEI', 'Blue tape'],
      },
      releaseAgents: 'Same as standard PC - specialized PC adhesives work best.',
      multiMaterial: [
        { material: 'PC', bondQuality: 'Strong Chemical Bond', notes: 'Excellent compatibility.' },
        { material: 'ABS', bondQuality: 'Strong Chemical Bond', notes: 'Good bonding.' },
      ],
    },
    postProcessing: {
      chemicalSmoothing: [
        { method: 'Dichloromethane', effectiveness: 'Good', notes: 'Works but toxic. FR additives may affect results.' },
      ],
      mechanical: ['Sands well', 'Machines cleanly', 'Polishable'],
      glues: ['Epoxy', 'Cyanoacrylate', 'Solvent welding with caution'],
      painting: 'Accepts paints after light sanding.',
    },
    safety: {
      fumes: { level: 'Moderate', notes: 'Standard PC fumes plus FR additive compounds. Good ventilation essential.' },
      foodSafety: { rating: 'Not Safe', notes: 'FR additives are not food safe. Never use for food contact.' },
      biodegradability: { rating: 'Not Biodegradable', notes: 'Petroleum-based with synthetic additives.' },
      additionalNotes: [
        'FR additives may produce additional fumes',
        'HEPA + carbon filtration recommended',
        'Some FR compounds are regulated substances',
      ],
    },
  },

  'PC-PBT': {
    name: 'PC-PBT',
    fullName: 'Polycarbonate-Polybutylene Terephthalate Blend',
    origin: {
      yearInvented: '1980s',
      originalCompany: 'GE Plastics (Xenoy brand)',
      keyMilestones: [
        '1980s: PC-PBT blends commercialized for automotive',
        '1990s: Becomes standard for automotive bumpers and body panels',
        '2000s: Expanded to industrial applications',
        '2020+: Emerging in 3D printing market',
      ],
      majorManufacturers: ['SABIC (Xenoy)', 'Covestro', 'DSM', 'BASF'],
    },
    composition: {
      basePolymer: 'Polycarbonate (40-60%) + PBT (40-60%) blend',
      chemicalFamily: 'Polymer blend (Polycarbonate + Polyester)',
      keyAdditives: ['Impact modifiers', 'Compatibilizers', 'UV stabilizers'],
      coloringAgents: 'Wide color range available, good pigment acceptance',
      specialFillers: ['Glass fiber versions available', 'Mineral fillers'],
    },
    familyContext: {
      parentPolymer: 'Polycarbonate and Polybutylene Terephthalate combined',
      variants: ['PC-PBT', 'PC-PBT GF (glass filled)', 'PC-PBT UV stabilized'],
      chemicalComparison: 'Combines PC impact resistance with PBT chemical resistance and processability.',
      evolution: 'Created for automotive exterior applications requiring both toughness and chemical resistance.',
    },
    strengths: {
      uniqueProperties: ['Excellent chemical resistance', 'Outstanding low-temp impact', 'UV resistant', 'Paintable'],
      bestUseScenarios: ['Automotive exterior parts', 'Chemical-exposed enclosures', 'Outdoor applications', 'Painted parts'],
      advantagesOverCompetitors: ['Better chemical resistance than PC-ABS', 'Superior low-temp toughness', 'Excellent paintability'],
      whyChooseThis: 'When parts need both impact resistance AND chemical/fuel resistance that PC-ABS cannot provide.',
    },
    weaknesses: {
      limitations: ['Less common in 3D printing', 'Requires drying', 'Higher processing temps than PBT alone'],
      commonProblems: ['Moisture sensitivity', 'Can be stringy', 'Requires proper temp balance'],
      environmentalConcerns: ['Petroleum-based blend', 'Mixed polymer recycling challenges'],
      whenNotToUse: ['Optical clarity needed', 'Maximum heat resistance (use pure PC)', 'Budget applications'],
    },
    practicalContext: {
      industryAdoption: ['Automotive', 'Industrial equipment', 'Outdoor electronics', 'Sporting goods'],
      commonApplications: ['Bumper fascias', 'Fuel filler doors', 'Snowmobile hoods', 'Power tool housings', 'Outdoor enclosures'],
      safetyStandards: ['Automotive OEM specifications', 'Various chemical resistance standards'],
      costPosition: 'Premium',
    },
    trivia: {
      funFacts: [
        'Xenoy PC-PBT has been used on car bumpers since the 1980s',
        'PC-PBT can withstand gasoline, oil, and brake fluid exposure',
        'The blend maintains impact strength down to -40°C',
        'Many car mirror housings are made from PC-PBT',
      ],
      whyInvented: 'Automotive industry needed a material tough enough for bumpers that could also resist fuel and chemicals.',
      controversies: [
        'Less well-known in 3D printing despite excellent properties',
        'Can be confused with PC-ABS which has different chemical resistance',
      ],
      marketAdoption: 'Dominant in automotive injection molding, emerging in industrial 3D printing.',
    },
    tdsProfile: {
      properties: [
        { name: 'Tensile Strength', value: '45-55', unit: 'MPa', implications: 'Good strength, similar to PC-ABS.' },
        { name: 'Elongation at Break', value: '100-150', unit: '%', implications: 'Excellent ductility.' },
        { name: "Young's Modulus", value: '2000-2300', unit: 'MPa', implications: 'Good stiffness.' },
        { name: 'Impact Strength (Notched, -30°C)', value: '400-600', unit: 'J/m', implications: 'Outstanding cold-temperature toughness.' },
        { name: 'Chemical Resistance', value: 'Excellent', unit: '', implications: 'Resists fuels, oils, many solvents.' },
        { name: 'Heat Deflection (HDT)', value: '100-115', unit: '°C (0.45 MPa)', implications: 'Good heat resistance.' },
      ],
      notes: 'Exceptional combination of toughness, chemical resistance, and processability.',
    },
    printSettings: {
      nozzleTemp: { min: 250, max: 280, optimal: 265 },
      bedTemp: { min: 80, max: 110, optimal: 95 },
      coolingFan: { min: 10, max: 40, notes: 'Moderate cooling acceptable.' },
      enclosure: { required: true, notes: 'Recommended for consistent results and reduced warping.' },
      drying: { temp: 80, duration: '4-6 hours', notes: 'PBT component is moisture sensitive.' },
      printSpeed: { recommended: '40-60 mm/s', notes: 'Similar to PC-ABS.' },
      additionalNotes: [
        'All-metal hotend recommended at higher temps',
        'Dry thoroughly - PBT is very moisture sensitive',
        'Slower first layer for adhesion',
        'Can be painted directly without primer in many cases',
      ],
    },
    adhesion: {
      bedSurfaces: {
        excellent: ['PEI (Textured)', 'Garolite'],
        good: ['Glass with glue stick', 'BuildTak'],
        poor: ['Bare glass', 'Blue tape'],
      },
      releaseAgents: 'Glue stick works well. Not as aggressive as pure PC.',
      multiMaterial: [
        { material: 'PC', bondQuality: 'Strong Chemical Bond', notes: 'Good compatibility due to PC content.' },
        { material: 'PBT', bondQuality: 'Strong Chemical Bond', notes: 'Excellent bonding.' },
        { material: 'PETG', bondQuality: 'Mechanical Bond', notes: 'Reasonable adhesion, both polyesters.' },
      ],
    },
    postProcessing: {
      chemicalSmoothing: [
        { method: 'Limited options', effectiveness: 'Difficult', notes: 'Chemical resistance makes smoothing challenging.' },
      ],
      mechanical: ['Sands well', 'Excellent machinability', 'Polishes to good finish'],
      glues: ['Epoxy (best)', 'Cyanoacrylate', 'Structural adhesives'],
      painting: 'Excellent paintability - a key feature of PC-PBT. Often painted in automotive applications.',
    },
    safety: {
      fumes: { level: 'Moderate', notes: 'Similar to PC-ABS. Good ventilation recommended.' },
      foodSafety: { rating: 'Not Recommended', notes: 'Not typically certified for food contact.' },
      biodegradability: { rating: 'Not Biodegradable', notes: 'Petroleum-based polymer blend.' },
      additionalNotes: [
        'BPA present from PC component',
        'Standard ventilation precautions',
      ],
    },
  },

  'ESD-PC': {
    name: 'ESD-PC',
    fullName: 'Electrostatic Dissipative Polycarbonate',
    origin: {
      yearInvented: '1990s',
      originalCompany: 'Multiple manufacturers for electronics industry',
      keyMilestones: [
        '1990s: ESD plastics developed for electronics manufacturing',
        '2000s: Miniaturization drives demand for ESD-safe materials',
        '2015+: ESD filaments become available for 3D printing',
        '2020+: Growing adoption for electronics prototyping',
      ],
      majorManufacturers: ['3DXTech', 'Polymaker', 'Stratasys', 'SABIC', 'Covestro'],
    },
    composition: {
      basePolymer: 'Polycarbonate with conductive additives',
      chemicalFamily: 'Polycarbonate (electrically modified)',
      keyAdditives: ['Carbon nanotubes', 'Carbon black', 'Conductive fibers', 'Inherently dissipative polymers'],
      coloringAgents: 'Typically black due to carbon additives',
      specialFillers: ['Carbon-based conductive fillers'],
    },
    familyContext: {
      parentPolymer: 'Polycarbonate base with ESD additives',
      variants: ['ESD-PC (surface resistive)', 'ESD-PC (volume conductive)'],
      chemicalComparison: 'Standard PC with additives that allow controlled static dissipation without sparking.',
      evolution: 'Developed to protect sensitive electronics from electrostatic discharge damage.',
    },
    strengths: {
      uniqueProperties: ['Static dissipative (10^6-10^9 ohms)', 'Maintains PC toughness', 'Consistent ESD properties', 'High heat resistance'],
      bestUseScenarios: ['Electronics manufacturing fixtures', 'ESD-safe enclosures', 'Semiconductor handling', 'Cleanroom tools'],
      advantagesOverCompetitors: ['Better impact than ESD-ABS', 'Higher heat resistance', 'More consistent ESD properties'],
      whyChooseThis: 'When static-sensitive electronics require handling fixtures with PC-level toughness and heat resistance.',
    },
    weaknesses: {
      limitations: ['Black color only', 'Higher cost', 'Slightly reduced mechanical properties', 'Requires proper grounding'],
      commonProblems: ['ESD properties can vary with humidity', 'Surface contamination affects performance', 'Requires verification testing'],
      environmentalConcerns: ['Carbon additives not recyclable', 'Specialized disposal may be required'],
      whenNotToUse: ['Color required', 'Maximum mechanical properties needed', 'ESD protection not necessary'],
    },
    practicalContext: {
      industryAdoption: ['Semiconductor', 'Electronics manufacturing', 'Aerospace', 'Medical devices', 'Automotive electronics'],
      commonApplications: ['Chip trays', 'PCB handling fixtures', 'Test equipment housings', 'Cleanroom tools', 'Electronics enclosures'],
      safetyStandards: ['ANSI/ESD S20.20', 'IEC 61340', 'MIL-STD-1686'],
      costPosition: 'Industrial',
    },
    trivia: {
      funFacts: [
        'A single static discharge can destroy a microchip worth thousands of dollars',
        'ESD damage causes billions in losses to the electronics industry annually',
        'The human body can generate 25,000 volts of static electricity',
        'ESD-PC dissipates charge slowly enough to prevent damaging sparks',
      ],
      whyInvented: 'Electronics miniaturization made components increasingly vulnerable to static damage, requiring protective handling materials.',
      controversies: [
        'ESD properties must be verified - printing can affect conductivity',
        'Humidity significantly affects surface resistivity',
        'Some "ESD" filaments do not meet industry standards',
      ],
      marketAdoption: 'Essential in electronics manufacturing, growing in 3D printing for functional prototypes and fixtures.',
    },
    tdsProfile: {
      properties: [
        { name: 'Surface Resistivity', value: '10^6 - 10^9', unit: 'ohms/sq', implications: 'Static dissipative range. Safe for electronics handling.' },
        { name: 'Tensile Strength', value: '50-60', unit: 'MPa', implications: 'Slightly reduced from standard PC.' },
        { name: 'Elongation at Break', value: '80-120', unit: '%', implications: 'Good ductility maintained.' },
        { name: 'Impact Strength (Notched)', value: '400-550', unit: 'J/m', implications: 'Good impact resistance.' },
        { name: 'Heat Deflection (HDT)', value: '130-140', unit: '°C (0.45 MPa)', implications: 'Excellent heat resistance maintained.' },
      ],
      notes: 'ESD properties should be verified after printing. Layer orientation can affect conductivity.',
    },
    printSettings: {
      nozzleTemp: { min: 280, max: 310, optimal: 295 },
      bedTemp: { min: 100, max: 130, optimal: 115 },
      coolingFan: { min: 0, max: 20, notes: 'Minimal cooling like standard PC.' },
      enclosure: { required: true, notes: 'Required. Same as standard PC.' },
      drying: { temp: 80, duration: '6-10 hours', notes: 'Very important - moisture affects both printing and ESD properties.' },
      printSpeed: { recommended: '30-50 mm/s', notes: 'Similar to standard PC.' },
      additionalNotes: [
        'All-metal hotend required',
        'Carbon additives may be slightly abrasive',
        'Verify ESD properties after printing',
        'Ground parts properly in use',
      ],
    },
    adhesion: {
      bedSurfaces: {
        excellent: ['Garolite (G10)', 'PC sheet'],
        good: ['PEI with adhesive'],
        poor: ['Bare PEI', 'Glass'],
      },
      releaseAgents: 'Standard PC adhesives work.',
      multiMaterial: [
        { material: 'PC', bondQuality: 'Strong Chemical Bond', notes: 'Same base polymer.' },
        { material: 'ESD-ABS', bondQuality: 'Mechanical Bond', notes: 'Possible for graded ESD assemblies.' },
      ],
    },
    postProcessing: {
      chemicalSmoothing: [
        { method: 'Not recommended', effectiveness: 'Difficult', notes: 'May affect ESD properties.' },
      ],
      mechanical: ['Sanding possible but may affect surface resistivity', 'Test ESD after any post-processing'],
      glues: ['Conductive epoxy for ESD continuity', 'Standard epoxy where grounding not needed'],
      painting: 'Not recommended - paint insulates and defeats ESD purpose.',
    },
    safety: {
      fumes: { level: 'Moderate', notes: 'Similar to standard PC. Carbon additives are relatively inert.' },
      foodSafety: { rating: 'Not Safe', notes: 'Not intended for food contact.' },
      biodegradability: { rating: 'Not Biodegradable', notes: 'Petroleum-based with carbon additives.' },
      additionalNotes: [
        'Carbon nanotubes in some formulations have safety considerations',
        'Standard ventilation for PC printing',
      ],
    },
  },

  'PC Pro': {
    name: 'PC Pro',
    fullName: 'Professional Grade Polycarbonate',
    origin: {
      yearInvented: '2018-2020',
      originalCompany: 'Multiple 3D printing filament manufacturers',
      keyMilestones: [
        '2015: PC filaments become available for desktop printers',
        '2018: Enhanced "Pro" formulations developed',
        '2020+: Improved formulations reduce printing difficulty',
      ],
      majorManufacturers: ['Polymaker', 'eSUN', 'Prusament', '3DXTech', 'Fiberlogy'],
    },
    composition: {
      basePolymer: 'Modified Polycarbonate',
      chemicalFamily: 'Polycarbonate (enhanced formulation)',
      keyAdditives: ['Flow enhancers', 'Warp reduction agents', 'Impact modifiers'],
      coloringAgents: 'Various colors available including transparent',
      specialFillers: ['Processing aids for easier printing'],
    },
    familyContext: {
      parentPolymer: 'Polycarbonate with enhanced printability',
      variants: ['PC Pro', 'PC Max', 'Easy PC', 'PC Plus'],
      chemicalComparison: 'Standard PC chemistry with additives to improve flow and reduce warping.',
      evolution: 'Developed to make PC accessible to desktop 3D printer users.',
    },
    strengths: {
      uniqueProperties: ['Easier to print than standard PC', 'Reduced warping', 'Maintains good impact resistance', 'Lower chamber temp requirements'],
      bestUseScenarios: ['Functional prototypes', 'Impact-resistant parts', 'Heat-resistant components', 'Engineering applications'],
      advantagesOverCompetitors: ['Easier than pure PC', 'Better properties than PC-ABS', 'Accessible to more printers'],
      whyChooseThis: 'When you want PC properties but your printer or experience level cannot handle pure PC.',
    },
    weaknesses: {
      limitations: ['Slightly reduced properties vs pure PC', 'Still requires enclosure', 'More expensive than standard filaments', 'Properties vary by brand'],
      commonProblems: ['Still can warp without proper setup', 'Moisture sensitive', 'Layer adhesion still challenging'],
      environmentalConcerns: ['Same as standard PC - BPA concerns, not biodegradable'],
      whenNotToUse: ['Maximum PC properties required', 'No enclosure available', 'Strict material certification needed'],
    },
    practicalContext: {
      industryAdoption: ['Prototyping', 'Small-batch production', 'Maker community', 'Engineering education'],
      commonApplications: ['Functional prototypes', 'Tool housings', 'Brackets and mounts', 'Enclosures', 'Drone components'],
      safetyStandards: ['Varies by manufacturer - check specific product certifications'],
      costPosition: 'Premium',
    },
    trivia: {
      funFacts: [
        'PC Pro formulations often include trade-secret additives for easier printing',
        'Some PC Pro filaments can print with chamber temps as low as 40°C',
        'The "Pro" designation has no industry standard definition',
        'Quality varies significantly between manufacturers',
      ],
      whyInvented: 'Pure PC was too difficult for most desktop printers, creating demand for easier formulations.',
      controversies: [
        '"Pro" and similar designations are marketing terms without standards',
        'Some PC Pro is barely different from standard PC',
        'Trade-offs between printability and properties not always disclosed',
      ],
      marketAdoption: 'Popular among users wanting PC properties without industrial equipment.',
    },
    tdsProfile: {
      properties: [
        { name: 'Tensile Strength', value: '55-65', unit: 'MPa', implications: 'Good strength, slightly less than pure PC.' },
        { name: 'Elongation at Break', value: '80-120', unit: '%', implications: 'Good ductility.' },
        { name: "Young's Modulus", value: '2100-2300', unit: 'MPa', implications: 'Good stiffness.' },
        { name: 'Impact Strength (Notched)', value: '500-700', unit: 'J/m', implications: 'Excellent impact resistance.' },
        { name: 'Heat Deflection (HDT)', value: '120-135', unit: '°C (0.45 MPa)', implications: 'Good heat resistance.' },
      ],
      notes: 'Properties vary by manufacturer. Check specific product datasheets.',
    },
    printSettings: {
      nozzleTemp: { min: 260, max: 290, optimal: 275 },
      bedTemp: { min: 90, max: 115, optimal: 105 },
      coolingFan: { min: 0, max: 30, notes: 'Minimal cooling. Some Pro formulations tolerate more fan than pure PC.' },
      enclosure: { required: true, notes: 'Still recommended, though requirements less strict than pure PC. 40-60°C chamber often sufficient.' },
      drying: { temp: 80, duration: '4-8 hours', notes: 'Hygroscopic like all PC. Dry before printing.' },
      printSpeed: { recommended: '40-60 mm/s', notes: 'Faster than pure PC possible with good formulations.' },
      additionalNotes: [
        'All-metal hotend required',
        'Lower temps than pure PC often work',
        'Brim recommended',
        'Cool slowly in enclosure',
      ],
    },
    adhesion: {
      bedSurfaces: {
        excellent: ['PEI (Textured)', 'Garolite', 'PC sheet'],
        good: ['Glass with glue stick', 'BuildTak'],
        poor: ['Bare glass', 'Blue tape'],
      },
      releaseAgents: 'Glue stick often sufficient. Less aggressive than pure PC.',
      multiMaterial: [
        { material: 'PC', bondQuality: 'Strong Chemical Bond', notes: 'Excellent compatibility.' },
        { material: 'PC-ABS', bondQuality: 'Strong Chemical Bond', notes: 'Good bonding.' },
        { material: 'ABS', bondQuality: 'Strong Chemical Bond', notes: 'Compatible.' },
      ],
    },
    postProcessing: {
      chemicalSmoothing: [
        { method: 'Dichloromethane', effectiveness: 'Good', notes: 'Works on PC base. Toxic - professional use.' },
      ],
      mechanical: ['Sands well', 'Polishes to clarity if transparent', 'Machines nicely'],
      glues: ['Cyanoacrylate', 'Epoxy', 'Solvent welding'],
      painting: 'Accepts paints well after light sanding.',
    },
    safety: {
      fumes: { level: 'Moderate', notes: 'Similar to standard PC. Good ventilation required.' },
      foodSafety: { rating: 'Not Recommended', notes: 'BPA concerns apply. Not food safe.' },
      biodegradability: { rating: 'Not Biodegradable', notes: 'Petroleum-based polycarbonate.' },
      additionalNotes: [
        'BPA is present',
        'HEPA + carbon filtration recommended',
        'Print in ventilated space',
      ],
    },
  },

  'ezPC': {
    name: 'ezPC',
    fullName: 'Easy-Print Polycarbonate',
    origin: {
      yearInvented: '2019-2020',
      originalCompany: 'Multiple filament manufacturers',
      keyMilestones: [
        '2019: First "easy PC" formulations appear',
        '2020: Growing demand for accessible PC alternatives',
        '2021+: Refined formulations further reduce difficulty',
      ],
      majorManufacturers: ['Polymaker (PolyLite PC)', 'eSUN', 'Overture', 'Sunlu'],
    },
    composition: {
      basePolymer: 'Modified Polycarbonate blend',
      chemicalFamily: 'Polycarbonate copolymer or blend',
      keyAdditives: ['Significant flow modifiers', 'Warp reduction compounds', 'Processing aids'],
      coloringAgents: 'Limited colors - typically natural, black, white',
      specialFillers: ['Proprietary additives for printability'],
    },
    familyContext: {
      parentPolymer: 'Heavily modified PC for maximum printability',
      variants: ['ezPC', 'PolyLite PC', 'Easy PC', 'PC Lite'],
      chemicalComparison: 'PC-based but with significant modifications prioritizing printability over pure properties.',
      evolution: 'Created to bring PC to printers without enclosures or high-temp capability.',
    },
    strengths: {
      uniqueProperties: ['Prints without enclosure', 'Minimal warping', 'Lower temperature requirements', 'Beginner accessible'],
      bestUseScenarios: ['PC introduction for beginners', 'Printers without enclosures', 'Quick prototypes needing some PC properties'],
      advantagesOverCompetitors: ['Can print on basic printers', 'No enclosure required', 'Significantly reduced warping'],
      whyChooseThis: 'When your printer cannot handle any other PC variant and you need some PC-like toughness.',
    },
    weaknesses: {
      limitations: ['Noticeably reduced properties vs true PC', 'Heat resistance compromised', 'Impact lower than pure PC', 'May not meet PC specifications'],
      commonProblems: ['Properties far from true PC', 'Heat deflection much lower', 'May not satisfy engineering requirements'],
      environmentalConcerns: ['Same as standard PC'],
      whenNotToUse: ['True PC properties required', 'High-temp applications', 'Impact-critical parts', 'Certification requirements'],
    },
    practicalContext: {
      industryAdoption: ['Hobbyist printing', 'Education', 'Basic prototyping'],
      commonApplications: ['Learning PC printing', 'Non-critical tough parts', 'Aesthetic prototypes', 'Hobby projects'],
      safetyStandards: ['Generally not certified to PC standards'],
      costPosition: 'Standard',
    },
    trivia: {
      funFacts: [
        'ezPC can often print at PETG-like temperatures',
        'Some ezPC formulations work completely open-air',
        'The trade-off is significant - heat resistance may be half of pure PC',
        'Popular as a "gateway" to PC printing',
      ],
      whyInvented: 'To allow users with basic printers to experience some PC benefits without expensive equipment upgrades.',
      controversies: [
        'Whether ezPC should be called "PC" at all given reduced properties',
        'Marketing can overstate similarity to true PC',
        'Heat deflection often closer to PETG than PC',
      ],
      marketAdoption: 'Popular among hobbyists, but serious users move to true PC formulations.',
    },
    tdsProfile: {
      properties: [
        { name: 'Tensile Strength', value: '45-55', unit: 'MPa', implications: 'Reduced from true PC. Similar to PETG.' },
        { name: 'Elongation at Break', value: '60-100', unit: '%', implications: 'Good ductility but less than pure PC.' },
        { name: "Young's Modulus", value: '1800-2100', unit: 'MPa', implications: 'Moderate stiffness.' },
        { name: 'Impact Strength (Notched)', value: '200-400', unit: 'J/m', implications: 'Reduced but still good. Between PETG and PC.' },
        { name: 'Heat Deflection (HDT)', value: '85-110', unit: '°C (0.45 MPa)', implications: 'Significantly reduced. This is the main compromise.' },
      ],
      notes: 'Properties between PETG and true PC. Suitable when full PC specs not required.',
    },
    printSettings: {
      nozzleTemp: { min: 240, max: 270, optimal: 255 },
      bedTemp: { min: 80, max: 100, optimal: 90 },
      coolingFan: { min: 20, max: 50, notes: 'More cooling possible than true PC.' },
      enclosure: { required: false, notes: 'Not required! This is the main benefit. Enclosure still helps with large parts.' },
      drying: { temp: 70, duration: '4-6 hours', notes: 'Still hygroscopic. Drying recommended.' },
      printSpeed: { recommended: '40-70 mm/s', notes: 'Faster than true PC. Similar to PETG.' },
      additionalNotes: [
        'All-metal hotend still recommended',
        'Can work with PTFE-lined at lower temps',
        'Prints much like enhanced PETG',
        'Brim helps but less critical than pure PC',
      ],
    },
    adhesion: {
      bedSurfaces: {
        excellent: ['PEI (Textured)', 'BuildTak'],
        good: ['Glass with glue stick', 'PEI (Smooth)'],
        poor: ['Blue tape'],
      },
      releaseAgents: 'Standard glue stick works. Much less aggressive than pure PC.',
      multiMaterial: [
        { material: 'PETG', bondQuality: 'Mechanical Bond', notes: 'Reasonable compatibility given similar print profiles.' },
        { material: 'PC Pro', bondQuality: 'Strong Chemical Bond', notes: 'Good bonding with other PC variants.' },
      ],
    },
    postProcessing: {
      chemicalSmoothing: [
        { method: 'Limited effectiveness', effectiveness: 'Difficult', notes: 'Modified chemistry may not respond like pure PC.' },
      ],
      mechanical: ['Sands well', 'Standard finishing techniques'],
      glues: ['Cyanoacrylate', 'Epoxy'],
      painting: 'Accepts paint after light sanding.',
    },
    safety: {
      fumes: { level: 'Low', notes: 'Lower temps mean less fumes than true PC. Still ventilate.' },
      foodSafety: { rating: 'Not Recommended', notes: 'BPA concerns still apply.' },
      biodegradability: { rating: 'Not Biodegradable', notes: 'Petroleum-based material.' },
      additionalNotes: [
        'Lower temp printing reduces fume concerns',
        'Still contains BPA',
        'Basic ventilation usually sufficient',
      ],
    },
  },

  'PC Blend': {
    name: 'PC Blend',
    fullName: 'Polycarbonate Blend',
    origin: {
      yearInvented: '2015-2018',
      originalCompany: 'Various filament manufacturers',
      keyMilestones: [
        '2015: PC enters desktop 3D printing',
        '2017: Various PC blend formulations appear',
        '2018+: Blends become popular alternative to pure PC',
      ],
      majorManufacturers: ['Various manufacturers', 'Polymaker', 'eSUN', 'Overture'],
    },
    composition: {
      basePolymer: 'Polycarbonate blended with other polymers',
      chemicalFamily: 'Polycarbonate alloy/blend',
      keyAdditives: ['Secondary polymers (varies)', 'Compatibilizers', 'Flow modifiers'],
      coloringAgents: 'Varies by blend composition',
      specialFillers: ['Depends on blend partner'],
    },
    familyContext: {
      parentPolymer: 'Polycarbonate combined with other engineering polymers',
      variants: ['PC-ABS', 'PC-PBT', 'PC-ASA', 'PC-PETG', 'Various proprietary blends'],
      chemicalComparison: 'Generic term for PC mixed with other polymers to modify properties or printability.',
      evolution: 'Umbrella term covering various PC alloys designed for different applications.',
    },
    strengths: {
      uniqueProperties: ['Balanced properties', 'Often easier than pure PC', 'Tailored performance', 'Various options available'],
      bestUseScenarios: ['When pure PC is overkill', 'Specific property requirements', 'Easier printing needs', 'Cost-sensitive applications'],
      advantagesOverCompetitors: ['Can be optimized for specific needs', 'Often easier to print', 'Lower cost than pure PC'],
      whyChooseThis: 'When you need some PC properties but want specific benefits from the blend partner.',
    },
    weaknesses: {
      limitations: ['Properties vary widely', 'May not match pure PC', 'Blend composition often proprietary', 'Harder to predict performance'],
      commonProblems: ['Inconsistent between manufacturers', 'Hard to know exact composition', 'May not meet PC specifications'],
      environmentalConcerns: ['Mixed polymers harder to recycle', 'Same concerns as component materials'],
      whenNotToUse: ['Specific PC certifications required', 'Predictable properties essential', 'Maximum PC performance needed'],
    },
    practicalContext: {
      industryAdoption: ['Prototyping', 'Consumer products', 'General engineering'],
      commonApplications: ['Functional parts', 'Enclosures', 'Housings', 'Structural components'],
      safetyStandards: ['Varies by specific blend - check manufacturer specifications'],
      costPosition: 'Standard',
    },
    trivia: {
      funFacts: [
        'PC Blend is a catch-all term for many different formulations',
        'The most common PC blend is PC-ABS, used in billions of products',
        'Blend ratio significantly affects final properties',
        'Some "PC Blend" products are mostly the other polymer with minor PC content',
      ],
      whyInvented: 'To combine PC strengths with other polymers for optimized, application-specific materials.',
      controversies: [
        'Vague labeling - "PC Blend" tells you little about actual properties',
        'PC content can range from 20% to 80%',
        'Marketing may emphasize PC while properties are dominated by blend partner',
      ],
      marketAdoption: 'Very common in injection molding, increasingly available in 3D printing filaments.',
    },
    tdsProfile: {
      properties: [
        { name: 'Tensile Strength', value: '40-60', unit: 'MPa', implications: 'Varies widely based on blend composition.' },
        { name: 'Elongation at Break', value: '50-150', unit: '%', implications: 'Depends on blend partner flexibility.' },
        { name: "Young's Modulus", value: '1800-2400', unit: 'MPa', implications: 'Range depends on blend.' },
        { name: 'Impact Strength', value: '200-600', unit: 'J/m', implications: 'Can vary significantly.' },
        { name: 'Heat Deflection', value: '90-130', unit: '°C', implications: 'Usually between component materials.' },
      ],
      notes: 'Properties highly dependent on specific blend. Always check manufacturer datasheet.',
    },
    printSettings: {
      nozzleTemp: { min: 250, max: 290, optimal: 270 },
      bedTemp: { min: 80, max: 115, optimal: 100 },
      coolingFan: { min: 0, max: 40, notes: 'Varies by blend. Check manufacturer recommendations.' },
      enclosure: { required: false, notes: 'Often recommended but not always required. Depends on blend.' },
      drying: { temp: 75, duration: '4-8 hours', notes: 'Most PC blends are hygroscopic.' },
      printSpeed: { recommended: '40-60 mm/s', notes: 'Generally easier than pure PC.' },
      additionalNotes: [
        'Settings vary significantly by blend',
        'Follow manufacturer recommendations',
        'All-metal hotend often recommended',
        'Drying usually important',
      ],
    },
    adhesion: {
      bedSurfaces: {
        excellent: ['PEI (Textured)', 'Garolite'],
        good: ['Glass with glue', 'BuildTak'],
        poor: ['Blue tape'],
      },
      releaseAgents: 'Glue stick usually works. Specific needs depend on blend.',
      multiMaterial: [
        { material: 'PC', bondQuality: 'Strong Chemical Bond', notes: 'PC content enables bonding.' },
        { material: 'Blend partner', bondQuality: 'Strong Chemical Bond', notes: 'Usually bonds well with its component materials.' },
      ],
    },
    postProcessing: {
      chemicalSmoothing: [
        { method: 'Varies', effectiveness: 'Difficult', notes: 'Depends on blend composition.' },
      ],
      mechanical: ['Generally sands well', 'Finishing similar to pure PC'],
      glues: ['Epoxy typically works', 'Cyanoacrylate', 'Solvent welding if blend partner allows'],
      painting: 'Usually accepts paint after preparation.',
    },
    safety: {
      fumes: { level: 'Moderate', notes: 'Fume profile depends on blend components. Ventilate.' },
      foodSafety: { rating: 'Not Recommended', notes: 'PC component means BPA concerns apply.' },
      biodegradability: { rating: 'Not Biodegradable', notes: 'Petroleum-based polymers.' },
      additionalNotes: [
        'BPA present from PC component',
        'Other concerns depend on blend partner',
        'Ventilation recommended',
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

  'PP-CF': {
    name: 'PP-CF',
    fullName: 'Carbon Fiber Reinforced Polypropylene',
    origin: {
      yearInvented: '2018+',
      originalCompany: 'Various composite filament manufacturers',
      keyMilestones: [
        '2017: PP filaments become commercially available',
        '2018: First PP-CF composites introduced for 3D printing',
        '2020: Industrial adoption for lightweight structural parts',
        '2022+: Growing use in automotive and drone applications',
      ],
      majorManufacturers: ['Fiberlogy', 'colorFabb', '3DXTech', 'Polymaker'],
    },
    composition: {
      basePolymer: 'Polypropylene (isotactic)',
      chemicalFamily: 'Polyolefin + Carbon Fiber Composite',
      keyAdditives: ['Short carbon fibers (10-20%)', 'Coupling agents', 'Antioxidants'],
      coloringAgents: 'Black/dark gray from carbon fiber content',
      specialFillers: ['Chopped carbon fiber (typically 15-20% by weight)'],
    },
    familyContext: {
      parentPolymer: 'PP base enhanced with carbon fiber reinforcement',
      variants: ['PP-CF15', 'PP-CF20', 'Various fiber loading percentages'],
      chemicalComparison: 'Combines PP chemical resistance with carbon fiber stiffness. Much stiffer than neat PP while retaining chemical resistance.',
      evolution: 'Developed for weight-sensitive applications requiring stiffness without sacrificing chemical resistance.',
    },
    strengths: {
      uniqueProperties: ['Excellent stiffness-to-weight ratio', 'Chemical resistance maintained', 'Low moisture absorption', 'Dimensional stability', 'Very light weight'],
      bestUseScenarios: ['Drone frames', 'Automotive components', 'Chemical equipment', 'Lightweight fixtures', 'High-performance prototypes'],
      advantagesOverCompetitors: ['Lighter than other CF composites', 'Best chemical resistance among CF materials', 'Lower moisture uptake than PA-CF', 'No drying required'],
      whyChooseThis: 'When you need lightweight, stiff parts with excellent chemical resistance - ideal for drones and automotive.',
    },
    weaknesses: {
      limitations: ['Still challenging bed adhesion (PP base)', 'Lower impact resistance than neat PP', 'Abrasive to nozzles', 'Limited color options'],
      commonProblems: ['Adhesion issues inherited from PP', 'Warping still possible', 'Nozzle wear', 'Layer adhesion can be weak'],
      environmentalConcerns: ['Not recyclable as composite', 'Carbon fiber contamination issues', 'Petroleum-based'],
      whenNotToUse: ['Living hinge applications', 'Impact-critical parts', 'Beginners', 'When flexibility is needed'],
    },
    practicalContext: {
      industryAdoption: ['Drone/UAV manufacturing', 'Automotive prototyping', 'Chemical industry', 'Racing components'],
      commonApplications: ['Drone frames', 'UAV components', 'Jigs and fixtures', 'Chemical tanks', 'Automotive trim'],
      safetyStandards: ['Generally not food-safe due to fiber content', 'Application-specific testing required'],
      costPosition: 'Premium',
    },
    trivia: {
      funFacts: [
        'PP-CF can be 2-3x stiffer than neat PP while being slightly lighter per unit volume',
        'The chemical resistance makes it unique among CF composites',
        'Popular in FPV drone racing for strength-to-weight ratio',
        'One of the lightest structural composites available in 3D printing',
      ],
      whyInvented: 'Created to add structural rigidity to PP while maintaining its unique chemical resistance and low density.',
      controversies: [
        'Still inherits PP adhesion challenges',
        'Some manufacturers use lower fiber content than advertised',
        'Carbon fiber quality varies significantly between brands',
      ],
      marketAdoption: 'Niche but growing, especially in drone and automotive communities seeking lightweight chemical-resistant parts.',
    },
    tdsProfile: {
      properties: [
        { name: 'Tensile Strength', value: '40-55', unit: 'MPa', implications: 'Improved over neat PP due to fiber reinforcement.' },
        { name: 'Elongation at Break', value: '3-8', unit: '%', implications: 'Much lower than neat PP - fiber limits flexibility.' },
        { name: "Young's Modulus", value: '4000-6000', unit: 'MPa', implications: 'Significantly stiffer than neat PP. Key benefit of CF reinforcement.' },
        { name: 'Impact Strength', value: '4-8', unit: 'kJ/m² (Notched)', implications: 'Lower than neat PP - carbon fiber reduces impact resistance.' },
        { name: 'Glass Transition (Tg)', value: '-10 to 0', unit: '°C', implications: 'Same as PP base - remains flexible at cold temperatures.' },
        { name: 'Heat Deflection (HDT)', value: '110-130', unit: '°C (0.45 MPa)', implications: 'Improved over neat PP. Carbon fiber adds thermal stability.' },
        { name: 'Density', value: '0.95-1.02', unit: 'g/cm³', implications: 'Still very light - slightly heavier than neat PP due to fiber.' },
      ],
      notes: 'Properties depend heavily on fiber content and fiber quality. Higher fiber loading increases stiffness but reduces elongation.',
    },
    printSettings: {
      nozzleTemp: { min: 230, max: 260, optimal: 245 },
      bedTemp: { min: 80, max: 100, optimal: 90 },
      coolingFan: { min: 0, max: 40, notes: 'Minimal cooling like neat PP to prevent warping.' },
      enclosure: { required: true, notes: 'Highly recommended - warping is a significant issue.' },
      drying: { temp: 60, duration: '4 hours', notes: 'Less hygroscopic than nylon composites. Brief drying beneficial.' },
      printSpeed: { recommended: '30-50 mm/s', notes: 'Moderate speeds. Fiber can affect flow consistency.' },
      additionalNotes: [
        'HARDENED NOZZLE REQUIRED - Carbon fiber is extremely abrasive',
        'PP-specific bed surface still mandatory',
        'Rafts or brims essential for adhesion',
        'Lower layer height (0.15-0.2mm) for better fiber orientation',
        'Wide extrusion widths help with layer bonding',
      ],
    },
    adhesion: {
      bedSurfaces: {
        excellent: ['PP sheet', 'PP tape', 'Packing tape'],
        good: ['Specialized PP build plates'],
        poor: ['PEI', 'Glass', 'BuildTak', 'All standard surfaces'],
      },
      releaseAgents: 'Not applicable - adhesion is the challenge with PP base.',
      multiMaterial: [
        { material: 'Neat PP', bondQuality: 'Strong Chemical Bond', notes: 'Same base polymer - bonds well.' },
        { material: 'Other materials', bondQuality: 'No Bond', notes: 'PP base prevents bonding to most materials.' },
      ],
    },
    postProcessing: {
      chemicalSmoothing: [
        { method: 'Most Solvents', effectiveness: 'Not Possible', notes: 'PP base is resistant to most solvents.' },
      ],
      mechanical: ['Sands carefully', 'Machines well', 'Can be drilled/tapped', 'Carbon dust requires PPE'],
      glues: ['PP-specific adhesives', 'Hot glue', 'Friction welding', 'Heat staking'],
      painting: 'Requires PP primer or flame treatment. Carbon fiber surface texture can help adhesion.',
    },
    safety: {
      fumes: { level: 'Moderate', notes: 'Low PP fumes but carbon fiber dust is a respiratory hazard. Enclosed printer and filtration recommended.' },
      foodSafety: { rating: 'Not Food Safe', notes: 'Carbon fiber content makes this unsuitable for food contact.' },
      biodegradability: { rating: 'Not Biodegradable', notes: 'Composite material - cannot be recycled with standard PP.' },
      additionalNotes: [
        'Carbon fiber dust is a respiratory hazard - avoid breathing',
        'Post-processing generates fine carbon particles',
        'Wear gloves and work in ventilated area',
        'Clean printer thoroughly after use',
      ],
    },
  },

  'PP-GF': {
    name: 'PP-GF',
    fullName: 'Glass Fiber Reinforced Polypropylene',
    origin: {
      yearInvented: '2017+',
      originalCompany: 'Various filament manufacturers',
      keyMilestones: [
        '2017: PP filaments enter 3D printing market',
        '2018: Glass fiber reinforced PP composites introduced',
        '2020: Industrial adoption for chemical-resistant structural parts',
        '2022+: Cost-effective alternative to PP-CF for non-weight-critical applications',
      ],
      majorManufacturers: ['Fiberlogy', 'colorFabb', 'Polymaker', 'BASF Forward AM'],
    },
    composition: {
      basePolymer: 'Polypropylene (isotactic)',
      chemicalFamily: 'Polyolefin + Glass Fiber Composite',
      keyAdditives: ['Short glass fibers (15-30%)', 'Coupling agents', 'Antioxidants', 'Nucleating agents'],
      coloringAgents: 'Natural off-white to gray, can be colored',
      specialFillers: ['Chopped E-glass fibers (typically 20-30% by weight)'],
    },
    familyContext: {
      parentPolymer: 'PP base enhanced with glass fiber reinforcement',
      variants: ['PP-GF20', 'PP-GF30', 'Various fiber loading percentages'],
      chemicalComparison: 'Similar chemical resistance to PP-CF but heavier. Cost-effective stiffness improvement over neat PP.',
      evolution: 'Developed as cost-effective alternative to PP-CF where weight is less critical.',
    },
    strengths: {
      uniqueProperties: ['Good stiffness improvement', 'Chemical resistance maintained', 'Lower cost than PP-CF', 'Better creep resistance', 'Isotropic properties'],
      bestUseScenarios: ['Chemical containers', 'Industrial fixtures', 'Automotive under-hood', 'Pump housings', 'Structural chemical equipment'],
      advantagesOverCompetitors: ['Cheaper than CF composites', 'Excellent chemical resistance', 'More isotropic than CF', 'Lower moisture absorption than glass-filled nylons'],
      whyChooseThis: 'When you need stiff, chemical-resistant parts without the premium price of carbon fiber.',
    },
    weaknesses: {
      limitations: ['Heavier than PP-CF', 'Still has PP adhesion issues', 'Abrasive to nozzles', 'Lower strength than CF version'],
      commonProblems: ['Bed adhesion inherited from PP', 'Warping possible', 'Nozzle wear', 'Surface finish rougher than neat PP'],
      environmentalConcerns: ['Not recyclable as composite', 'Glass fiber contamination', 'Petroleum-based'],
      whenNotToUse: ['Weight-sensitive applications', 'Living hinges', 'Flexible parts', 'Smooth surface finish required'],
    },
    practicalContext: {
      industryAdoption: ['Chemical processing', 'Automotive', 'Industrial equipment', 'Agricultural machinery'],
      commonApplications: ['Chemical tanks', 'Pump components', 'Under-hood automotive parts', 'Industrial brackets', 'Fluid handling'],
      safetyStandards: ['Generally not food-safe due to fiber content', 'Chemical resistance testing available'],
      costPosition: 'Standard',
    },
    trivia: {
      funFacts: [
        'Glass fiber PP was common in injection molding long before 3D printing',
        'PP-GF is widely used in automotive battery trays',
        'Glass fibers are more environmentally friendly than carbon in production',
        'The natural color can be easily colored unlike CF composites',
      ],
      whyInvented: 'To provide stiffness improvement at lower cost than carbon fiber while maintaining PP chemical resistance.',
      controversies: [
        'Some consider it obsolete compared to PP-CF',
        'Glass fiber content varies significantly between brands',
        'Surface finish often disappoints users expecting neat PP quality',
      ],
      marketAdoption: 'Industrial use cases where cost matters more than weight. Less popular than PP-CF in hobby applications.',
    },
    tdsProfile: {
      properties: [
        { name: 'Tensile Strength', value: '45-65', unit: 'MPa', implications: 'Good improvement over neat PP. Glass fiber effective for tensile applications.' },
        { name: 'Elongation at Break', value: '2-5', unit: '%', implications: 'Low - glass fiber makes material brittle compared to neat PP.' },
        { name: "Young's Modulus", value: '3500-5500', unit: 'MPa', implications: 'Significant stiffness increase. Slightly less than PP-CF.' },
        { name: 'Impact Strength', value: '6-12', unit: 'kJ/m² (Notched)', implications: 'Better than PP-CF but lower than neat PP.' },
        { name: 'Glass Transition (Tg)', value: '-10 to 0', unit: '°C', implications: 'Same as PP base - cold temperature flexibility maintained.' },
        { name: 'Heat Deflection (HDT)', value: '140-160', unit: '°C (0.45 MPa)', implications: 'Excellent heat resistance - glass fiber significantly improves thermal performance.' },
        { name: 'Density', value: '1.10-1.25', unit: 'g/cm³', implications: 'Heavier than PP-CF due to glass density. Still lighter than many engineering plastics.' },
      ],
      notes: 'Higher HDT than PP-CF due to glass fiber thermal properties. Trade-off is increased density.',
    },
    printSettings: {
      nozzleTemp: { min: 230, max: 265, optimal: 250 },
      bedTemp: { min: 80, max: 100, optimal: 95 },
      coolingFan: { min: 0, max: 40, notes: 'Minimal cooling - same as PP base.' },
      enclosure: { required: true, notes: 'Highly recommended for consistent results and reduced warping.' },
      drying: { temp: 60, duration: '4 hours', notes: 'Glass fiber less moisture sensitive. Brief drying still recommended.' },
      printSpeed: { recommended: '30-50 mm/s', notes: 'Moderate speeds for consistent extrusion.' },
      additionalNotes: [
        'HARDENED NOZZLE REQUIRED - Glass fiber is very abrasive',
        'PP-specific bed surface mandatory',
        'Rafts strongly recommended',
        'Glass fibers more opaque - no transparency possible',
        'Better layer adhesion than PP-CF in some cases',
      ],
    },
    adhesion: {
      bedSurfaces: {
        excellent: ['PP sheet', 'PP tape', 'Packing tape'],
        good: ['Specialized PP build plates'],
        poor: ['PEI', 'Glass', 'BuildTak', 'Standard surfaces'],
      },
      releaseAgents: 'Not needed - adhesion is the primary challenge.',
      multiMaterial: [
        { material: 'Neat PP', bondQuality: 'Strong Chemical Bond', notes: 'Same polymer family - good bonding.' },
        { material: 'PP-CF', bondQuality: 'Strong Chemical Bond', notes: 'Both PP-based - compatible.' },
        { material: 'Other materials', bondQuality: 'No Bond', notes: 'PP base prevents bonding.' },
      ],
    },
    postProcessing: {
      chemicalSmoothing: [
        { method: 'Solvents', effectiveness: 'Not Possible', notes: 'PP chemical resistance prevents smoothing.' },
      ],
      mechanical: ['Sands with difficulty', 'Machines well', 'Can be drilled/tapped', 'Glass dust requires PPE'],
      glues: ['PP-specific adhesives', 'Hot glue', 'Friction welding'],
      painting: 'Requires PP primer or surface treatment. Glass fiber texture may help paint adhesion.',
    },
    safety: {
      fumes: { level: 'Moderate', notes: 'PP fumes low but glass fiber dust is irritating. Use filtration.' },
      foodSafety: { rating: 'Not Food Safe', notes: 'Glass fiber content makes this unsuitable for food contact.' },
      biodegradability: { rating: 'Not Biodegradable', notes: 'Composite cannot be recycled in standard streams.' },
      additionalNotes: [
        'Glass fiber dust irritates skin and respiratory system',
        'Wear gloves and mask during post-processing',
        'Less hazardous than carbon fiber but still requires care',
        'Ventilation recommended',
      ],
    },
  },

  'PPA': {
    name: 'PPA',
    fullName: 'Polyphthalamide (High-Performance Polyamide)',
    origin: {
      yearInvented: '1990s',
      originalCompany: 'Various chemical companies (DuPont, Solvay, EMS-Grivory)',
      keyMilestones: [
        '1990s: PPA resins developed for injection molding',
        '2018: First PPA filaments introduced for 3D printing',
        '2020: Adoption in automotive and electronics applications',
        '2022+: Growing use as high-temp nylon alternative',
      ],
      majorManufacturers: ['DuPont (Zytel HTN)', 'Solvay (Amodel)', 'DSM', 'BASF', 'Polymaker'],
    },
    composition: {
      basePolymer: 'Polyphthalamide (semi-aromatic polyamide)',
      chemicalFamily: 'High-Performance Polyamide / Semi-Aromatic Nylon',
      keyAdditives: ['Stabilizers', 'Nucleating agents', 'Impact modifiers'],
      coloringAgents: 'Natural amber/yellow, can be colored',
      specialFillers: ['Glass fiber (PPA-GF)', 'Carbon fiber (PPA-CF)', 'Mineral fillers'],
    },
    familyContext: {
      parentPolymer: 'Nylon family - contains aromatic ring structures unlike standard nylons (PA6, PA66)',
      variants: ['Neat PPA', 'PPA-GF', 'PPA-CF', 'Various grades (A, AS, HT)'],
      chemicalComparison: 'Much higher heat resistance than PA6/PA66. Approaches PPS in thermal performance. Better chemical resistance than standard nylons.',
      evolution: 'Developed to fill the gap between standard nylons and ultra-high-performance polymers like PEEK.',
    },
    strengths: {
      uniqueProperties: ['Excellent heat resistance (Tg ~125°C)', 'Superior chemical resistance', 'Good dimensional stability', 'Low moisture absorption vs PA6/PA66', 'High stiffness'],
      bestUseScenarios: ['Under-hood automotive', 'Electronics housings', 'Hot-fluid handling', 'Metal replacement', 'High-temp structural parts'],
      advantagesOverCompetitors: ['Higher temp than PA6/PA66', 'Lower moisture absorption than standard nylons', 'Better chemical resistance', 'More affordable than PEEK'],
      whyChooseThis: 'When standard nylons aren\'t hot enough but PEEK is overkill - PPA fills the performance gap.',
    },
    weaknesses: {
      limitations: ['Requires high print temperatures', 'Moisture sensitive (though less than PA6)', 'More expensive than standard nylons', 'Limited vendor support'],
      commonProblems: ['Warping at high temps', 'Requires enclosure', 'Must dry thoroughly', 'Stringing possible'],
      environmentalConcerns: ['Petroleum-based', 'Not biodegradable', 'Difficult to recycle'],
      whenNotToUse: ['Low-temp applications', 'Budget projects', 'When standard nylons suffice', 'Without heated enclosure'],
    },
    practicalContext: {
      industryAdoption: ['Automotive', 'Electronics', 'Industrial equipment', 'Oil & gas', 'Aerospace'],
      commonApplications: ['Engine components', 'Electrical connectors', 'Pump housings', 'Under-hood brackets', 'Hot-fluid fittings'],
      safetyStandards: ['Various UL ratings available', 'Automotive OEM specifications', 'Electrical connector standards'],
      costPosition: 'Premium',
    },
    trivia: {
      funFacts: [
        'PPA was developed specifically for replacing metal in automotive under-hood applications',
        '"Polyphthalamide" refers to the phthalic acid component giving aromatic character',
        'DuPont\'s Zytel HTN was one of the first commercial PPA materials',
        'Often called "high-temperature nylon" though chemically distinct from standard nylons',
      ],
      whyInvented: 'Created to provide nylon-like properties at higher temperatures and with better chemical resistance.',
      controversies: [
        'Marketing often confuses PPA with other high-temp nylons',
        'Some "PPA" filaments are actually modified PA6T blends',
        'Significant property variation between PPA grades',
      ],
      marketAdoption: 'Growing in 3D printing as users seek higher-performance alternatives to standard nylons.',
    },
    tdsProfile: {
      properties: [
        { name: 'Tensile Strength', value: '80-100', unit: 'MPa', implications: 'Excellent. Higher than most standard nylons.' },
        { name: 'Elongation at Break', value: '10-25', unit: '%', implications: 'Moderate ductility. Less flexible than PA6/PA66.' },
        { name: "Young's Modulus", value: '3000-3500', unit: 'MPa', implications: 'High stiffness. Stiffer than standard nylons.' },
        { name: 'Impact Strength', value: '8-15', unit: 'kJ/m² (Notched)', implications: 'Good impact resistance. Can be improved with fiber reinforcement.' },
        { name: 'Glass Transition (Tg)', value: '110-130', unit: '°C', implications: 'Excellent - much higher than PA6 (47°C) or PA66 (50°C).' },
        { name: 'Heat Deflection (HDT)', value: '120-140', unit: '°C (1.8 MPa)', implications: 'Excellent high-temp performance. Key advantage over standard nylons.' },
        { name: 'Moisture Absorption', value: '2-4', unit: '%', implications: 'Lower than PA6 (9%) and PA66 (8%). Better dimensional stability.' },
      ],
      notes: 'Semi-aromatic structure provides thermal stability. Properties vary significantly between grades.',
    },
    printSettings: {
      nozzleTemp: { min: 280, max: 320, optimal: 300 },
      bedTemp: { min: 100, max: 130, optimal: 115 },
      coolingFan: { min: 0, max: 30, notes: 'Minimal cooling for maximum layer adhesion.' },
      enclosure: { required: true, notes: 'Heated enclosure required. Maintain 60-80°C chamber temperature.' },
      drying: { temp: 80, duration: '8-12 hours', notes: 'Critical - PPA absorbs moisture and will degrade if wet.' },
      printSpeed: { recommended: '30-60 mm/s', notes: 'Moderate speeds for consistent extrusion.' },
      additionalNotes: [
        'High-temp all-metal hotend required (300°C+)',
        'Heated chamber essential for larger parts',
        'Store in drybox between prints',
        'First layer adhesion critical - use adhesive if needed',
        'Similar printing profile to PC but higher temps',
      ],
    },
    adhesion: {
      bedSurfaces: {
        excellent: ['PEI (Textured)', 'Garolite'],
        good: ['Glass with adhesive', 'BuildTak'],
        poor: ['Bare glass', 'Blue tape (too low temp)'],
      },
      releaseAgents: 'Glue stick or hairspray can help with release after cooling.',
      multiMaterial: [
        { material: 'Other Nylons', bondQuality: 'Strong Chemical Bond', notes: 'Good compatibility with PA family materials.' },
        { material: 'TPU', bondQuality: 'Weak Bond', notes: 'Some adhesion but not structural.' },
        { material: 'PLA/PETG', bondQuality: 'No Bond', notes: 'Incompatible - too low temp for PPA processing.' },
      ],
    },
    postProcessing: {
      chemicalSmoothing: [
        { method: 'Formic Acid', effectiveness: 'Good', notes: 'Works like other nylons but requires safety precautions.' },
      ],
      mechanical: ['Sands well', 'Machines cleanly', 'Can be drilled/tapped', 'Heat-resistant allows aggressive machining'],
      glues: ['Cyanoacrylate', 'Epoxy', 'Nylon-specific adhesives'],
      painting: 'Accepts paint after light sanding. Surface may require primer for optimal adhesion.',
    },
    safety: {
      fumes: { level: 'Moderate', notes: 'High temperature printing generates fumes. Enclosure with filtration recommended.' },
      foodSafety: { rating: 'Generally Not Food Safe', notes: 'High-temp processing makes bacterial cleaning easier but not typically certified.' },
      biodegradability: { rating: 'Not Biodegradable', notes: 'Synthetic polymer - not biodegradable or easily recyclable.' },
      additionalNotes: [
        'Print in well-ventilated area or with filtration',
        'High temps require care around printer',
        'Similar safety profile to other high-temp polymers',
      ],
    },
  },

  'PPA-CF': {
    name: 'PPA-CF',
    fullName: 'Carbon Fiber Reinforced Polyphthalamide',
    origin: {
      yearInvented: '2019+',
      originalCompany: 'Various composite filament manufacturers',
      keyMilestones: [
        '2018: PPA filaments introduced',
        '2019: Carbon fiber reinforced PPA variants launched',
        '2020: Adoption in high-performance industrial applications',
        '2022+: Growing use as PEEK-CF alternative for cost-sensitive applications',
      ],
      majorManufacturers: ['Polymaker', 'BASF Forward AM', '3DXTech', 'colorFabb'],
    },
    composition: {
      basePolymer: 'Polyphthalamide (semi-aromatic polyamide)',
      chemicalFamily: 'High-Performance Polyamide + Carbon Fiber Composite',
      keyAdditives: ['Short carbon fibers (15-25%)', 'Stabilizers', 'Coupling agents'],
      coloringAgents: 'Black from carbon fiber content',
      specialFillers: ['Chopped carbon fiber (typically 20% by weight)'],
    },
    familyContext: {
      parentPolymer: 'PPA base enhanced with carbon fiber for maximum stiffness',
      variants: ['PPA-CF15', 'PPA-CF20', 'PPA-CF25'],
      chemicalComparison: 'Higher thermal and mechanical properties than PA-CF. Approaches PEEK-CF performance at lower cost.',
      evolution: 'Developed to create a cost-effective alternative to PEEK-CF for high-temp structural applications.',
    },
    strengths: {
      uniqueProperties: ['Exceptional stiffness', 'High heat resistance', 'Low thermal expansion', 'Excellent dimensional stability', 'Metal replacement capability'],
      bestUseScenarios: ['Automotive structural parts', 'Aerospace tooling', 'High-temp jigs', 'Metal replacement', 'Under-hood components'],
      advantagesOverCompetitors: ['Higher temp than PA-CF', 'Lower cost than PEEK-CF', 'Better moisture resistance than PA-CF', 'Excellent creep resistance'],
      whyChooseThis: 'When PA-CF isn\'t hot enough and PEEK-CF is too expensive - PPA-CF is the sweet spot.',
    },
    weaknesses: {
      limitations: ['Very high print temperatures required', 'Brittle compared to neat PPA', 'Extremely abrasive', 'Limited vendor options'],
      commonProblems: ['Requires industrial-grade printer', 'Warping on large parts', 'Layer adhesion challenges', 'Nozzle wear rapid'],
      environmentalConcerns: ['Not recyclable', 'Carbon fiber contamination', 'High energy printing'],
      whenNotToUse: ['Flexible parts', 'Impact-critical applications', 'Without proper equipment', 'Budget projects'],
    },
    practicalContext: {
      industryAdoption: ['Automotive', 'Aerospace', 'Industrial tooling', 'Oil & gas', 'Motorsport'],
      commonApplications: ['Engine brackets', 'Aerospace tooling', 'High-temp fixtures', 'Structural automotive', 'Motorsport components'],
      safetyStandards: ['Automotive OEM specifications', 'Aerospace MRB testing', 'Various industry certifications'],
      costPosition: 'Industrial',
    },
    trivia: {
      funFacts: [
        'PPA-CF can replace aluminum in many automotive applications',
        'Stiffness approaches that of aluminum at 1/3 the weight',
        'Often used in Formula 1 and motorsport prototyping',
        'Carbon fiber loading typically optimized at 20% for printability vs. properties',
      ],
      whyInvented: 'Created to provide PEEK-CF level performance at significantly lower cost and easier processing.',
      controversies: [
        'Some brands overstate PEEK-equivalent claims',
        'Fiber quality varies significantly between manufacturers',
        'Actual performance depends heavily on print parameters',
      ],
      marketAdoption: 'Industrial users seeking metal replacement without PEEK pricing. Growing in automotive and aerospace.',
    },
    tdsProfile: {
      properties: [
        { name: 'Tensile Strength', value: '140-180', unit: 'MPa', implications: 'Excellent. Carbon fiber significantly increases strength.' },
        { name: 'Elongation at Break', value: '2-4', unit: '%', implications: 'Very low - material is stiff and brittle.' },
        { name: "Young's Modulus", value: '12000-18000', unit: 'MPa', implications: 'Exceptional stiffness - comparable to aluminum in some orientations.' },
        { name: 'Impact Strength', value: '5-8', unit: 'kJ/m² (Notched)', implications: 'Low - CF reduces impact resistance. Not for dynamic loads.' },
        { name: 'Glass Transition (Tg)', value: '115-135', unit: '°C', implications: 'Excellent high-temp performance.' },
        { name: 'Heat Deflection (HDT)', value: '250-280', unit: '°C (1.8 MPa)', implications: 'Exceptional. CF dramatically improves thermal performance.' },
        { name: 'Density', value: '1.30-1.40', unit: 'g/cm³', implications: 'Light for such high performance - excellent strength-to-weight.' },
      ],
      notes: 'Anisotropic properties - significantly stronger in XY than Z direction. Design accordingly.',
    },
    printSettings: {
      nozzleTemp: { min: 290, max: 330, optimal: 310 },
      bedTemp: { min: 100, max: 130, optimal: 120 },
      coolingFan: { min: 0, max: 20, notes: 'Minimal to no cooling for best layer adhesion.' },
      enclosure: { required: true, notes: 'Heated enclosure mandatory. Maintain 70-90°C chamber.' },
      drying: { temp: 80, duration: '12+ hours', notes: 'Absolutely critical. Moisture causes severe degradation at these temps.' },
      printSpeed: { recommended: '25-45 mm/s', notes: 'Slower speeds for better fiber orientation and layer bonding.' },
      additionalNotes: [
        'HARDENED NOZZLE ABSOLUTELY REQUIRED - Use ruby, tungsten, or hardened steel',
        'All-metal high-temp hotend required (330°C+ capability)',
        'Heated chamber essential - cannot print without',
        'Dry continuously during long prints',
        'Slower first layers critical for adhesion',
      ],
    },
    adhesion: {
      bedSurfaces: {
        excellent: ['Garolite', 'PEI (High-temp)'],
        good: ['Glass with PVA glue', 'BuildTak High-Temp'],
        poor: ['Standard PEI', 'Blue tape'],
      },
      releaseAgents: 'May need PVA release or tape to prevent over-adhesion on Garolite.',
      multiMaterial: [
        { material: 'Neat PPA', bondQuality: 'Strong Chemical Bond', notes: 'Compatible - same base polymer.' },
        { material: 'Other High-Temp Nylons', bondQuality: 'Mechanical Bond', notes: 'Possible with matching temp processing.' },
        { material: 'Standard Materials', bondQuality: 'No Bond', notes: 'Processing temps incompatible.' },
      ],
    },
    postProcessing: {
      chemicalSmoothing: [
        { method: 'Chemical Methods', effectiveness: 'Difficult', notes: 'CF content and high-temp resistance limits chemical options.' },
      ],
      mechanical: ['Machines well', 'Can be drilled/tapped', 'Sands carefully', 'Carbon dust requires full PPE'],
      glues: ['Epoxy (structural grade)', 'Cyanoacrylate', 'High-temp adhesives'],
      painting: 'Textured CF surface provides good mechanical adhesion. Prime for best results.',
    },
    safety: {
      fumes: { level: 'High', notes: 'Very high temps generate significant fumes. Enclosed printer with HEPA+carbon filtration required.' },
      foodSafety: { rating: 'Not Food Safe', notes: 'Industrial material not intended for food contact.' },
      biodegradability: { rating: 'Not Biodegradable', notes: 'Composite cannot be recycled.' },
      additionalNotes: [
        'Carbon fiber dust is a serious respiratory hazard',
        'Full PPE required for post-processing',
        'High temps require printer safety monitoring',
        'Proper ventilation/filtration essential',
        'Store in sealed drybox',
      ],
    },
  },

  'PPA-GF': {
    name: 'PPA-GF',
    fullName: 'Glass Fiber Reinforced Polyphthalamide',
    origin: {
      yearInvented: '2018+',
      originalCompany: 'Various composite manufacturers',
      keyMilestones: [
        '2018: PPA filaments enter market',
        '2019: Glass fiber reinforced variants introduced',
        '2020: Industrial adoption for high-temp structural parts',
        '2022+: Cost-effective high-temp composite option',
      ],
      majorManufacturers: ['Polymaker', 'BASF', 'DSM', 'colorFabb'],
    },
    composition: {
      basePolymer: 'Polyphthalamide (semi-aromatic polyamide)',
      chemicalFamily: 'High-Performance Polyamide + Glass Fiber Composite',
      keyAdditives: ['Short glass fibers (25-40%)', 'Stabilizers', 'Coupling agents', 'Impact modifiers'],
      coloringAgents: 'Natural off-white to gray, can be colored',
      specialFillers: ['Chopped E-glass fibers (typically 30% by weight)'],
    },
    familyContext: {
      parentPolymer: 'PPA base reinforced with glass fiber for improved stiffness and thermal resistance',
      variants: ['PPA-GF25', 'PPA-GF30', 'PPA-GF40'],
      chemicalComparison: 'Higher HDT than PPA-CF in many cases due to glass fiber thermal properties. More isotropic than CF version.',
      evolution: 'Developed as cost-effective alternative to PPA-CF for applications where weight is less critical.',
    },
    strengths: {
      uniqueProperties: ['Exceptional heat resistance', 'Very high HDT', 'More isotropic than CF', 'Excellent creep resistance', 'Good chemical resistance'],
      bestUseScenarios: ['Under-hood automotive', 'High-temp electrical', 'Industrial pump components', 'Chemical processing', 'Continuous high-temp exposure'],
      advantagesOverCompetitors: ['Higher HDT than PPA-CF', 'Lower cost than CF version', 'More isotropic properties', 'Better for static thermal loads'],
      whyChooseThis: 'When continuous heat exposure is the primary challenge and weight is not critical.',
    },
    weaknesses: {
      limitations: ['Heavier than CF version', 'Lower strength than PPA-CF', 'Still requires high-temp printer', 'Abrasive'],
      commonProblems: ['Surface finish rougher', 'Warping possible', 'Requires enclosure', 'Nozzle wear'],
      environmentalConcerns: ['Not recyclable', 'Glass fiber contamination', 'Petroleum-based'],
      whenNotToUse: ['Weight-sensitive applications', 'Maximum strength required', 'Smooth surface finish needed', 'Without proper equipment'],
    },
    practicalContext: {
      industryAdoption: ['Automotive', 'Electrical/electronics', 'Industrial equipment', 'Chemical processing'],
      commonApplications: ['Engine brackets', 'Electrical housings', 'Pump impellers', 'High-temp connectors', 'Industrial fixtures'],
      safetyStandards: ['UL94 ratings available', 'Automotive specifications', 'Electrical safety standards'],
      costPosition: 'Premium',
    },
    trivia: {
      funFacts: [
        'Glass fiber reinforcement can push HDT above 300°C in some grades',
        'PPA-GF often outperforms PPA-CF for continuous thermal exposure',
        'Widely used in automotive LED headlight housings',
        'Glass fiber provides more consistent properties than carbon fiber',
      ],
      whyInvented: 'To maximize thermal performance of PPA at lower cost than carbon fiber reinforcement.',
      controversies: [
        'Sometimes overlooked in favor of "sexier" carbon fiber versions',
        'Actual HDT depends heavily on fiber loading and grade',
        'Marketing often conflates different PPA-GF grades',
      ],
      marketAdoption: 'Industrial applications where continuous heat resistance matters more than ultimate strength.',
    },
    tdsProfile: {
      properties: [
        { name: 'Tensile Strength', value: '120-160', unit: 'MPa', implications: 'Excellent. Good strength increase from glass fiber.' },
        { name: 'Elongation at Break', value: '2-4', unit: '%', implications: 'Low ductility - stiff and somewhat brittle.' },
        { name: "Young's Modulus", value: '8000-12000', unit: 'MPa', implications: 'Very high stiffness - less than CF but still excellent.' },
        { name: 'Impact Strength', value: '8-12', unit: 'kJ/m² (Notched)', implications: 'Moderate. Better than PPA-CF due to glass fiber properties.' },
        { name: 'Glass Transition (Tg)', value: '115-130', unit: '°C', implications: 'High - same as PPA base.' },
        { name: 'Heat Deflection (HDT)', value: '280-310', unit: '°C (1.8 MPa)', implications: 'Exceptional. Glass fiber provides superior thermal performance.' },
        { name: 'Density', value: '1.45-1.60', unit: 'g/cm³', implications: 'Higher than PPA-CF. Glass fiber is denser than carbon.' },
      ],
      notes: 'Higher HDT than PPA-CF makes this preferred for continuous heat applications despite lower strength.',
    },
    printSettings: {
      nozzleTemp: { min: 290, max: 330, optimal: 310 },
      bedTemp: { min: 100, max: 130, optimal: 120 },
      coolingFan: { min: 0, max: 20, notes: 'Minimal cooling for layer adhesion.' },
      enclosure: { required: true, notes: 'Heated enclosure mandatory. 70-90°C chamber recommended.' },
      drying: { temp: 80, duration: '10-12 hours', notes: 'Critical. Moisture severely impacts properties.' },
      printSpeed: { recommended: '25-50 mm/s', notes: 'Moderate speeds for consistent flow.' },
      additionalNotes: [
        'HARDENED NOZZLE REQUIRED - Glass fiber is extremely abrasive',
        'All-metal high-temp hotend necessary',
        'Heated chamber essential',
        'Higher fiber content = more abrasion',
        'Glass fiber produces more opaque appearance',
      ],
    },
    adhesion: {
      bedSurfaces: {
        excellent: ['Garolite', 'High-temp PEI'],
        good: ['Glass with high-temp adhesive'],
        poor: ['Standard surfaces', 'Blue tape'],
      },
      releaseAgents: 'May need release agent on Garolite for large parts.',
      multiMaterial: [
        { material: 'Neat PPA', bondQuality: 'Strong Chemical Bond', notes: 'Same base polymer - good compatibility.' },
        { material: 'PPA-CF', bondQuality: 'Strong Chemical Bond', notes: 'Both PPA-based - compatible.' },
        { material: 'Standard Materials', bondQuality: 'No Bond', notes: 'Processing temps incompatible.' },
      ],
    },
    postProcessing: {
      chemicalSmoothing: [
        { method: 'Chemical Methods', effectiveness: 'Difficult', notes: 'High chemical resistance limits options.' },
      ],
      mechanical: ['Machines well', 'Sands with effort', 'Can be drilled/tapped', 'Glass dust requires PPE'],
      glues: ['Epoxy', 'Cyanoacrylate', 'High-temp adhesives'],
      painting: 'Textured surface provides mechanical adhesion. Primer recommended.',
    },
    safety: {
      fumes: { level: 'High', notes: 'High-temp printing generates fumes. Enclosed printer with filtration required.' },
      foodSafety: { rating: 'Not Food Safe', notes: 'Industrial composite not for food contact.' },
      biodegradability: { rating: 'Not Biodegradable', notes: 'Composite material cannot be recycled.' },
      additionalNotes: [
        'Glass fiber dust irritates skin and lungs',
        'PPE required for post-processing',
        'Similar safety to other high-temp composites',
        'Proper ventilation essential',
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

  'CPE+': {
    name: 'CPE+',
    fullName: 'Copolyester Plus (High-Temperature Copolyester)',
    origin: {
      yearInvented: '2016',
      originalCompany: 'Ultimaker (co-developed with Eastman)',
      keyMilestones: [
        '2008: Eastman develops Tritan copolyester platform',
        '2016: Ultimaker launches CPE+ with higher heat resistance',
        '2018: Other manufacturers adopt high-temp copolyester formulations',
        '2020+: CPE+ becomes standard for demanding copolyester applications',
      ],
      majorManufacturers: ['Ultimaker', 'colorFabb', 'Fillamentum', '3DXTech'],
    },
    composition: {
      basePolymer: 'High-temperature copolyester (modified Tritan)',
      chemicalFamily: 'Copolyester / Modified Polyester',
      keyAdditives: ['Heat stabilizers', 'Impact modifiers', 'Clarifying agents'],
      coloringAgents: 'Excellent clarity maintained, can be transparent or colored',
      specialFillers: ['Rarely filled to maintain transparency and impact properties'],
    },
    familyContext: {
      parentPolymer: 'CPE base - upgraded with higher heat resistance formulation',
      variants: ['CPE+ standard', 'CPE HG100 (even higher heat)', 'CPE+ colored grades'],
      chemicalComparison: 'Bridge between CPE and polycarbonate - nearly PC heat resistance with CPE printability.',
      evolution: 'Direct evolution of CPE for applications requiring higher service temperatures.',
    },
    strengths: {
      uniqueProperties: ['100°C+ heat resistance', 'Maintains clarity at high temps', 'Excellent chemical resistance', 'High impact strength'],
      bestUseScenarios: ['Automotive parts', 'High-temp containers', 'Dishwasher-safe items', 'Under-hood applications'],
      advantagesOverCompetitors: ['Easier than PC at similar heat resistance', 'Clearer than standard CPE', 'BPA-free', 'Lower warping than ABS/PC'],
      whyChooseThis: 'When you need higher heat resistance than PETG/CPE but want to avoid polycarbonate difficulty.',
    },
    weaknesses: {
      limitations: ['Higher print temps than CPE', 'Premium pricing', 'Requires enclosed printer for best results', 'Limited availability'],
      commonProblems: ['Stringing at high temps', 'Moisture absorption', 'Layer adhesion at lower temps'],
      environmentalConcerns: ['Petroleum-based', 'Not biodegradable', 'Complex recycling'],
      whenNotToUse: ['When standard CPE/PETG heat resistance is sufficient', 'Open-frame printers', 'Budget projects'],
    },
    practicalContext: {
      industryAdoption: ['Automotive', 'Appliance manufacturing', 'Food service equipment', 'Industrial prototyping'],
      commonApplications: ['Coffee machine parts', 'Automotive interior trim', 'Dishwasher-safe containers', 'High-temp housings'],
      safetyStandards: ['FDA food contact grades available', 'BPA-free', 'Dishwasher safe certification'],
      costPosition: 'Premium',
    },
    trivia: {
      funFacts: [
        'CPE+ was developed specifically for parts that need to survive dishwashers',
        'The "+" designation indicates approximately 30°C higher Tg than standard CPE',
        'Ultimaker tested CPE+ with actual automotive under-hood conditions',
      ],
      whyInvented: 'Created to fill the gap between easy-printing CPE and difficult-printing polycarbonate.',
      controversies: [
        'Premium pricing sometimes questioned vs blended materials',
        'Brand-specific formulations vary significantly in actual heat resistance',
      ],
      marketAdoption: 'Growing adoption in automotive prototyping and consumer goods requiring dishwasher safety.',
    },
    tdsProfile: {
      properties: [
        { name: 'Tensile Strength', value: '55-65', unit: 'MPa', implications: 'Good. Slightly higher than standard CPE.' },
        { name: 'Elongation at Break', value: '80-120', unit: '%', implications: 'Excellent ductility. Will stretch significantly before failure.' },
        { name: "Young's Modulus", value: '2000-2400', unit: 'MPa', implications: 'Moderate stiffness. Stiffer than CPE.' },
        { name: 'Impact Strength', value: '90-110', unit: 'kJ/m² (Notched)', implications: 'Excellent impact resistance. Near-polycarbonate performance.' },
        { name: 'Glass Transition (Tg)', value: '100-115', unit: '°C', implications: 'Key advantage over CPE. Handles boiling water and dishwashers.' },
        { name: 'Heat Deflection (HDT)', value: '95-110', unit: '°C (0.45 MPa)', implications: 'Good for high-temp applications. Automotive interior approved.' },
      ],
      notes: 'Properties vary by manufacturer. Ultimaker CPE+ has published Tg of 108°C.',
    },
    printSettings: {
      nozzleTemp: { min: 260, max: 290, optimal: 275 },
      bedTemp: { min: 85, max: 110, optimal: 95 },
      coolingFan: { min: 25, max: 75, notes: 'Moderate cooling. Balance clarity and layer adhesion.' },
      enclosure: { required: false, notes: 'Recommended for best results. Reduces warping on larger parts.' },
      drying: { temp: 80, duration: '4-6 hours', notes: 'Hygroscopic. Dry thoroughly before printing.' },
      printSpeed: { recommended: '35-60 mm/s', notes: 'Slightly slower than CPE for high-temp grades.' },
      additionalNotes: [
        'Higher nozzle temps than standard CPE (260-290°C)',
        'Use release agent on smooth PEI',
        'Enclosure significantly improves large part success',
        'Keep filament dry during printing for best clarity',
      ],
    },
    adhesion: {
      bedSurfaces: {
        excellent: ['PEI (Textured) with release agent', 'Glass with adhesive'],
        good: ['BuildTak', 'Garolite'],
        poor: ['Bare smooth PEI (will damage surface)'],
      },
      releaseAgents: 'Essential on smooth PEI. Windex or glue stick required.',
      multiMaterial: [
        { material: 'PLA', bondQuality: 'No Bond', notes: 'Not compatible.' },
        { material: 'TPU', bondQuality: 'Weak Bond', notes: 'Some mechanical adhesion possible.' },
        { material: 'CPE', bondQuality: 'Strong Chemical Bond', notes: 'Bonds well to standard CPE.' },
      ],
    },
    postProcessing: {
      chemicalSmoothing: [
        { method: 'Acetone', effectiveness: 'Not Possible', notes: 'No effect on CPE+.' },
        { method: 'Dichloromethane', effectiveness: 'Good', notes: 'Works but extremely hazardous.' },
      ],
      mechanical: ['Excellent sanding and polishing', 'Can achieve high clarity finish', 'Machines well'],
      glues: ['Cyanoacrylate', 'Epoxy', 'Copolyester-specific adhesives'],
      painting: 'Accepts paint well with light sanding or adhesion promoter.',
    },
    safety: {
      fumes: { level: 'Low', notes: 'Low emissions similar to PETG. Standard ventilation sufficient.' },
      foodSafety: { rating: 'FDA Approved (specific grades)', notes: 'Many CPE+ grades are FDA food contact approved. Verify specific product.' },
      biodegradability: { rating: 'Not Biodegradable', notes: 'Petroleum-based copolyester.' },
      additionalNotes: [
        'BPA-free formulation',
        'Dishwasher safe after printing',
        'Low VOC emissions during printing',
      ],
    },
  },

  'CPE-CF': {
    name: 'CPE-CF',
    fullName: 'Carbon Fiber Reinforced Copolyester',
    origin: {
      yearInvented: '2018',
      originalCompany: 'Various (3DXTech, Polymaker early adopters)',
      keyMilestones: [
        '2015: Carbon fiber PETG established as material class',
        '2018: CPE-CF variants introduced for higher performance',
        '2020+: Growing adoption for stiff, chemically resistant parts',
      ],
      majorManufacturers: ['3DXTech', 'Polymaker', 'colorFabb', 'Fillamentum'],
    },
    composition: {
      basePolymer: 'Copolyester (CPE matrix)',
      chemicalFamily: 'Carbon Fiber Reinforced Copolyester',
      keyAdditives: ['Chopped carbon fiber (15-20%)', 'Coupling agents', 'Processing aids'],
      coloringAgents: 'Black/dark grey from carbon fiber',
      specialFillers: ['Carbon fiber (primary)', 'Occasionally glass fiber blends'],
    },
    familyContext: {
      parentPolymer: 'CPE base with carbon fiber reinforcement',
      variants: ['CPE-CF standard', 'CPE-CF high-flow', 'CPE-CF 20%'],
      chemicalComparison: 'Combines CPE chemical resistance with carbon fiber stiffness. Better chemical resistance than PETG-CF.',
      evolution: 'Developed as premium alternative to PETG-CF for demanding applications.',
    },
    strengths: {
      uniqueProperties: ['High stiffness', 'Excellent chemical resistance', 'Low thermal expansion', 'Dimensional stability'],
      bestUseScenarios: ['Chemical-resistant structural parts', 'Precision tooling', 'Jigs and fixtures', 'Scientific equipment'],
      advantagesOverCompetitors: ['Better chemical resistance than PETG-CF', 'Higher heat resistance than PETG-CF', 'Premium surface finish'],
      whyChooseThis: 'When you need carbon fiber stiffness with superior chemical resistance to PETG.',
    },
    weaknesses: {
      limitations: ['Abrasive to nozzles', 'Premium pricing', 'Reduced impact vs unfilled CPE', 'Anisotropic strength'],
      commonProblems: ['Nozzle wear requires hardened steel', 'Moisture sensitivity', 'Layer adhesion challenges'],
      environmentalConcerns: ['Not recyclable', 'Carbon fiber disposal issues', 'Petroleum-based'],
      whenNotToUse: ['When impact resistance is critical', 'Multi-direction loading', 'Budget projects'],
    },
    practicalContext: {
      industryAdoption: ['Aerospace prototyping', 'Scientific equipment', 'Precision manufacturing', 'Chemical processing'],
      commonApplications: ['Chemical-resistant enclosures', 'Lab equipment', 'Precision fixtures', 'Measurement tools'],
      safetyStandards: ['Industrial use primarily', 'Chemical resistance certifications vary'],
      costPosition: 'Premium',
    },
    trivia: {
      funFacts: [
        'CPE-CF can withstand many solvents that attack ABS-CF',
        'The combination of stiffness and chemical resistance is rare in FDM materials',
        'Often used in laboratory automation equipment',
      ],
      whyInvented: 'Created for applications requiring both mechanical stiffness and chemical resistance.',
      controversies: [
        'Price premium over PETG-CF not always justified for general applications',
        'Carbon fiber content and type varies significantly between brands',
      ],
      marketAdoption: 'Specialized niche - adopted where chemical resistance is critical and PETG-CF is insufficient.',
    },
    tdsProfile: {
      properties: [
        { name: 'Tensile Strength', value: '70-85', unit: 'MPa', implications: 'High. Carbon fiber significantly increases strength.' },
        { name: 'Elongation at Break', value: '3-6', unit: '%', implications: 'Low due to carbon fiber. Stiff but brittle.' },
        { name: "Young's Modulus", value: '6000-8000', unit: 'MPa', implications: 'Very stiff. 3-4x higher than unfilled CPE.' },
        { name: 'Impact Strength', value: '8-15', unit: 'kJ/m² (Notched)', implications: 'Reduced vs unfilled. Carbon fiber decreases toughness.' },
        { name: 'Glass Transition (Tg)', value: '85-100', unit: '°C', implications: 'Good heat resistance from CPE matrix.' },
        { name: 'Heat Deflection (HDT)', value: '90-105', unit: '°C (0.45 MPa)', implications: 'Improved with carbon fiber. Good structural stability at temp.' },
      ],
      notes: 'Properties highly dependent on carbon fiber content and print orientation.',
    },
    printSettings: {
      nozzleTemp: { min: 255, max: 280, optimal: 270 },
      bedTemp: { min: 80, max: 100, optimal: 90 },
      coolingFan: { min: 25, max: 75, notes: 'Moderate cooling for layer adhesion.' },
      enclosure: { required: false, notes: 'Recommended for larger parts to reduce warping.' },
      drying: { temp: 70, duration: '4-6 hours', notes: 'Hygroscopic. Dry thoroughly before printing.' },
      printSpeed: { recommended: '35-60 mm/s', notes: 'Moderate speeds for good layer adhesion.' },
      additionalNotes: [
        'HARDENED NOZZLE REQUIRED - carbon fiber is abrasive',
        'Minimum 0.4mm nozzle diameter recommended',
        'Slower speeds improve surface finish',
        'Keep filament dry throughout printing',
      ],
    },
    adhesion: {
      bedSurfaces: {
        excellent: ['Textured PEI', 'Garolite (G10)'],
        good: ['Glass with adhesive', 'BuildTak'],
        poor: ['Bare smooth PEI without release agent'],
      },
      releaseAgents: 'Recommended on smooth PEI to prevent surface damage.',
      multiMaterial: [
        { material: 'CPE', bondQuality: 'Strong Chemical Bond', notes: 'Excellent compatibility with unfilled CPE.' },
        { material: 'PETG', bondQuality: 'Weak Bond', notes: 'Some adhesion but not structural.' },
        { material: 'PLA', bondQuality: 'No Bond', notes: 'Not compatible.' },
      ],
    },
    postProcessing: {
      chemicalSmoothing: [
        { method: 'Acetone', effectiveness: 'Not Possible', notes: 'No effect on CPE matrix.' },
      ],
      mechanical: ['Sands well but carbon fiber dust is hazardous', 'Wear respiratory protection', 'Can be polished'],
      glues: ['Cyanoacrylate', 'Epoxy (best)', 'Structural adhesives'],
      painting: 'Accepts paint well. Prime first for best results.',
    },
    safety: {
      fumes: { level: 'Moderate', notes: 'Carbon fiber particles can be released. Use ventilation.' },
      foodSafety: { rating: 'Not Food Safe', notes: 'Carbon fiber makes this unsuitable for food contact.' },
      biodegradability: { rating: 'Not Biodegradable', notes: 'Carbon fiber composite - not recyclable.' },
      additionalNotes: [
        'Wear respiratory protection when sanding',
        'Carbon fiber particles are hazardous if inhaled',
        'Use dust collection or wet sanding',
      ],
    },
  },

  'Pro PCTG': {
    name: 'Pro PCTG',
    fullName: 'Professional Grade Polycyclohexylenedimethylene Terephthalate Glycol',
    origin: {
      yearInvented: '2010s (filament formulation)',
      originalCompany: 'Based on Eastman PCTG resins (Tritan family)',
      keyMilestones: [
        '2007: Eastman develops Tritan/PCTG platform',
        '2015: PCTG filaments introduced',
        '2018: "Pro" formulations with enhanced properties',
        '2020+: Pro PCTG establishes premium copolyester segment',
      ],
      majorManufacturers: ['Polymaker', 'colorFabb', 'Prusament', 'Fillamentum'],
    },
    composition: {
      basePolymer: 'PCTG (modified copolyester)',
      chemicalFamily: 'Copolyester / Glycol-modified Polyester',
      keyAdditives: ['Impact modifiers', 'Clarity enhancers', 'Stabilizers'],
      coloringAgents: 'Excellent optical clarity, transparent to colored options',
      specialFillers: ['Generally unfilled for clarity', 'Some grades with glass fiber'],
    },
    familyContext: {
      parentPolymer: 'PCTG - cyclohexane-modified PET copolyester (Tritan family)',
      variants: ['Pro PCTG Standard', 'Pro PCTG Clear', 'Pro PCTG High-Impact'],
      chemicalComparison: 'Between PETG and CPE - better clarity than PETG, easier than CPE+.',
      evolution: 'Refined formulation of PCTG for professional 3D printing applications.',
    },
    strengths: {
      uniqueProperties: ['Outstanding optical clarity', 'Excellent impact resistance', 'Good chemical resistance', 'BPA-free'],
      bestUseScenarios: ['Clear protective covers', 'Display cases', 'Medical models', 'Premium prototypes'],
      advantagesOverCompetitors: ['Clearer than standard PETG', 'Tougher than PLA', 'Easier than PC', 'Dishwasher safe'],
      whyChooseThis: 'When optical clarity and impact resistance matter more than maximum heat resistance.',
    },
    weaknesses: {
      limitations: ['Lower heat resistance than CPE+', 'Premium pricing', 'Stringing prone', 'Moisture sensitive'],
      commonProblems: ['Requires careful retraction tuning', 'Best results need dry filament', 'Can over-adhere to PEI'],
      environmentalConcerns: ['Petroleum-based', 'Not biodegradable'],
      whenNotToUse: ['High-temperature applications above 70°C', 'Budget projects', 'When PETG is sufficient'],
    },
    practicalContext: {
      industryAdoption: ['Consumer products', 'Medical', 'Retail displays', 'Packaging prototypes'],
      commonApplications: ['Clear enclosures', 'Light diffusers', 'Protective covers', 'Display stands'],
      safetyStandards: ['FDA food contact (Tritan grades)', 'BPA-free certified', 'Medical grades available'],
      costPosition: 'Premium',
    },
    trivia: {
      funFacts: [
        'PCTG can achieve near-acrylic clarity in thin sections',
        'Tritan-based PCTG replaced polycarbonate in most reusable water bottles',
        'Pro PCTG was formulated specifically for FDM printability',
      ],
      whyInvented: 'Created as a printable alternative to injection-molded Tritan for clear applications.',
      controversies: [
        'Marketing distinction between PETG and PCTG sometimes unclear',
        'Pro designation varies between manufacturers',
      ],
      marketAdoption: 'Growing in consumer and medical prototyping where clarity and safety matter.',
    },
    tdsProfile: {
      properties: [
        { name: 'Tensile Strength', value: '48-55', unit: 'MPa', implications: 'Good. Similar to PETG.' },
        { name: 'Elongation at Break', value: '150-200', unit: '%', implications: 'Excellent ductility. Very tough material.' },
        { name: "Young's Modulus", value: '1600-2000', unit: 'MPa', implications: 'Moderate stiffness. Slightly flexible.' },
        { name: 'Impact Strength', value: '100-130', unit: 'kJ/m² (Notched)', implications: 'Outstanding. One of the highest impact ratings in copolyesters.' },
        { name: 'Glass Transition (Tg)', value: '78-85', unit: '°C', implications: 'Moderate. Lower than CPE+ but sufficient for most applications.' },
        { name: 'Heat Deflection (HDT)', value: '70-78', unit: '°C (0.45 MPa)', implications: 'Lower than CPE+. Not for high-temp use.' },
        { name: 'Light Transmission', value: '88-91', unit: '%', implications: 'Excellent. Near-acrylic clarity possible.' },
      ],
      notes: 'Optimized for clarity and impact rather than heat resistance.',
    },
    printSettings: {
      nozzleTemp: { min: 240, max: 265, optimal: 255 },
      bedTemp: { min: 70, max: 85, optimal: 75 },
      coolingFan: { min: 30, max: 80, notes: 'Moderate to high cooling for clarity.' },
      enclosure: { required: false, notes: 'Not required. Open frame printers work well.' },
      drying: { temp: 65, duration: '4-6 hours', notes: 'Hygroscopic. Dry before printing for best clarity.' },
      printSpeed: { recommended: '40-70 mm/s', notes: 'Standard PETG-like speeds work well.' },
      additionalNotes: [
        'Similar print settings to quality PETG',
        'Tune retraction carefully to minimize stringing',
        'Use release agent on smooth PEI',
        'Slower speeds improve optical clarity',
      ],
    },
    adhesion: {
      bedSurfaces: {
        excellent: ['Textured PEI', 'Glass with adhesive'],
        good: ['BuildTak', 'Blue tape'],
        poor: ['Bare smooth PEI (sticks too well)'],
      },
      releaseAgents: 'Recommended on smooth PEI to prevent surface damage.',
      multiMaterial: [
        { material: 'PETG', bondQuality: 'Strong Chemical Bond', notes: 'Excellent compatibility with PETG family.' },
        { material: 'TPU', bondQuality: 'Weak Bond', notes: 'Some mechanical adhesion.' },
        { material: 'PLA', bondQuality: 'No Bond', notes: 'Not compatible.' },
      ],
    },
    postProcessing: {
      chemicalSmoothing: [
        { method: 'Acetone', effectiveness: 'Not Possible', notes: 'No effect on PCTG.' },
        { method: 'Ethyl Acetate', effectiveness: 'Difficult', notes: 'Limited effect. Test carefully.' },
      ],
      mechanical: ['Sands and polishes to high clarity', 'Can achieve mirror finish', 'Wet sanding recommended'],
      glues: ['Cyanoacrylate', 'Epoxy', 'E6000'],
      painting: 'Accepts paint with adhesion promoter or light sanding.',
    },
    safety: {
      fumes: { level: 'Low', notes: 'Low emissions. Standard ventilation sufficient.' },
      foodSafety: { rating: 'FDA Approved (Tritan grades)', notes: 'Tritan-based PCTG is FDA approved for food contact.' },
      biodegradability: { rating: 'Not Biodegradable', notes: 'Petroleum-based copolyester.' },
      additionalNotes: [
        'BPA-free - safe for food and beverage',
        'Can be sterilized with alcohol',
        'Dishwasher safe for most grades',
      ],
    },
  },

  'CoPoly-CF': {
    name: 'CoPoly-CF',
    fullName: 'Carbon Fiber Reinforced Copolyester (Generic)',
    origin: {
      yearInvented: '2017-2018',
      originalCompany: 'Multiple manufacturers simultaneously',
      keyMilestones: [
        '2015: Carbon fiber PETG becomes available',
        '2017: Premium copolyester carbon fiber variants introduced',
        '2019: CoPoly-CF category established in market',
      ],
      majorManufacturers: ['colorFabb', 'Polymaker', '3DXTech', 'Fiberlogy'],
    },
    composition: {
      basePolymer: 'Various copolyester blends',
      chemicalFamily: 'Carbon Fiber Reinforced Copolyester',
      keyAdditives: ['Chopped carbon fiber (10-20%)', 'Coupling agents', 'Processing aids'],
      coloringAgents: 'Black/dark grey from carbon fiber',
      specialFillers: ['Carbon fiber (primary)'],
    },
    familyContext: {
      parentPolymer: 'Copolyester matrix - varies by manufacturer',
      variants: ['CoPoly-CF 10%', 'CoPoly-CF 15%', 'CoPoly-CF 20%'],
      chemicalComparison: 'Generic category covering various CF-reinforced copolyesters between PETG-CF and specialty grades.',
      evolution: 'Generic classification for premium carbon fiber copolyester materials.',
    },
    strengths: {
      uniqueProperties: ['High stiffness', 'Good chemical resistance', 'Low warping', 'Dimensional stability'],
      bestUseScenarios: ['Structural parts', 'Fixtures and jigs', 'Enclosures', 'Tooling'],
      advantagesOverCompetitors: ['Stiffer than unfilled copolyester', 'Better chemical resistance than ABS-CF', 'Lower warping than ABS'],
      whyChooseThis: 'General-purpose carbon fiber copolyester when specific grade is not critical.',
    },
    weaknesses: {
      limitations: ['Abrasive to nozzles', 'Reduced impact strength', 'Anisotropic properties', 'Variable specs by brand'],
      commonProblems: ['Nozzle wear', 'Moisture absorption', 'Layer adhesion at low temps'],
      environmentalConcerns: ['Not recyclable', 'Carbon fiber disposal', 'Petroleum-based'],
      whenNotToUse: ['Impact-critical applications', 'When specific certification needed', 'Budget projects'],
    },
    practicalContext: {
      industryAdoption: ['Prototyping', 'Manufacturing aids', 'Hobbyist structural parts', 'Educational'],
      commonApplications: ['Camera mounts', 'Drone parts', 'Tool holders', 'Equipment housings'],
      safetyStandards: ['Varies by manufacturer', 'Generally industrial use'],
      costPosition: 'Premium',
    },
    trivia: {
      funFacts: [
        'CoPoly-CF is a catch-all term for various branded CF copolyester products',
        'Carbon fiber content and type varies significantly between manufacturers',
        'Often marketed under brand-specific names like HT-CF, XT-CF, etc.',
      ],
      whyInvented: 'Created as generic category for carbon fiber reinforced copolyesters beyond basic PETG-CF.',
      controversies: [
        'No standardization in composition or properties',
        'Brand marketing can be confusing',
      ],
      marketAdoption: 'Growing segment as users seek stiffer alternatives to standard copolyesters.',
    },
    tdsProfile: {
      properties: [
        { name: 'Tensile Strength', value: '65-80', unit: 'MPa', implications: 'Good to high depending on formulation.' },
        { name: 'Elongation at Break', value: '3-8', unit: '%', implications: 'Low due to carbon fiber. Brittle failure mode.' },
        { name: "Young's Modulus", value: '5500-8000', unit: 'MPa', implications: 'High stiffness. 3-4x base copolyester.' },
        { name: 'Impact Strength', value: '8-18', unit: 'kJ/m² (Notched)', implications: 'Reduced vs unfilled. Trade-off for stiffness.' },
        { name: 'Glass Transition (Tg)', value: '80-100', unit: '°C', implications: 'Depends on copolyester matrix.' },
        { name: 'Heat Deflection (HDT)', value: '85-100', unit: '°C (0.45 MPa)', implications: 'Good. Carbon fiber improves thermal stability.' },
      ],
      notes: 'Properties vary significantly between manufacturers. Check specific product datasheets.',
    },
    printSettings: {
      nozzleTemp: { min: 250, max: 280, optimal: 265 },
      bedTemp: { min: 75, max: 95, optimal: 85 },
      coolingFan: { min: 25, max: 75, notes: 'Moderate cooling for layer adhesion.' },
      enclosure: { required: false, notes: 'Recommended for large parts.' },
      drying: { temp: 70, duration: '4-6 hours', notes: 'Hygroscopic. Dry before printing.' },
      printSpeed: { recommended: '35-60 mm/s', notes: 'Moderate speeds for quality.' },
      additionalNotes: [
        'HARDENED NOZZLE REQUIRED',
        'Minimum 0.4mm nozzle diameter',
        'Settings vary by specific product',
        'Follow manufacturer recommendations',
      ],
    },
    adhesion: {
      bedSurfaces: {
        excellent: ['Textured PEI', 'Garolite'],
        good: ['Glass with adhesive', 'BuildTak'],
        poor: ['Bare smooth PEI'],
      },
      releaseAgents: 'Recommended on smooth surfaces.',
      multiMaterial: [
        { material: 'Copolyester (unfilled)', bondQuality: 'Strong Chemical Bond', notes: 'Good compatibility.' },
        { material: 'PETG', bondQuality: 'Mechanical Bond', notes: 'Some adhesion possible.' },
        { material: 'PLA', bondQuality: 'No Bond', notes: 'Not compatible.' },
      ],
    },
    postProcessing: {
      chemicalSmoothing: [
        { method: 'Acetone', effectiveness: 'Not Possible', notes: 'No effect on copolyester.' },
      ],
      mechanical: ['Sands well with respiratory protection', 'Can be polished', 'Use wet sanding'],
      glues: ['Epoxy (best)', 'Cyanoacrylate', 'Structural adhesives'],
      painting: 'Accepts paint with primer.',
    },
    safety: {
      fumes: { level: 'Moderate', notes: 'Carbon fiber particles possible. Use ventilation.' },
      foodSafety: { rating: 'Not Food Safe', notes: 'Carbon fiber makes this unsuitable for food contact.' },
      biodegradability: { rating: 'Not Biodegradable', notes: 'Composite material - not recyclable.' },
      additionalNotes: [
        'Wear respiratory protection when sanding',
        'Carbon fiber dust is hazardous',
        'Use dust collection',
      ],
    },
  },

  'CoPoly-HT': {
    name: 'CoPoly-HT',
    fullName: 'High-Temperature Copolyester',
    origin: {
      yearInvented: '2016-2017',
      originalCompany: 'colorFabb (nGen HT), Polymaker (PolyMax PC)',
      keyMilestones: [
        '2016: colorFabb launches nGen HT (115°C Tg)',
        '2017: Other manufacturers release high-temp copolyester variants',
        '2019: HT copolyester category matures',
      ],
      majorManufacturers: ['colorFabb (nGen HT)', 'Polymaker', 'Fiberlogy', 'Fillamentum'],
    },
    composition: {
      basePolymer: 'High-temperature modified copolyester',
      chemicalFamily: 'Copolyester / Modified Polyester',
      keyAdditives: ['Heat stabilizers', 'Crystallization modifiers', 'Impact modifiers'],
      coloringAgents: 'Good clarity available, colored options',
      specialFillers: ['Generally unfilled', 'Some glass-filled variants'],
    },
    familyContext: {
      parentPolymer: 'Copolyester base with heat-resistant modifications',
      variants: ['CoPoly-HT Standard', 'CoPoly-HT Clear', 'CoPoly-HT Glass-filled'],
      chemicalComparison: 'Bridges gap between CPE+ and polycarbonate in heat resistance.',
      evolution: 'Developed to push copolyester heat resistance toward polycarbonate territory.',
    },
    strengths: {
      uniqueProperties: ['115°C+ Tg possible', 'Good clarity', 'Low warping', 'Easier than PC'],
      bestUseScenarios: ['Automotive under-hood', 'High-temp enclosures', 'Industrial prototypes', 'Dishwasher-safe parts'],
      advantagesOverCompetitors: ['Higher heat than CPE+', 'Easier than polycarbonate', 'Low warping', 'Good surface finish'],
      whyChooseThis: 'When you need maximum heat resistance from copolyester without switching to polycarbonate.',
    },
    weaknesses: {
      limitations: ['Requires enclosure for best results', 'Higher print temps', 'Premium pricing', 'May require annealing'],
      commonProblems: ['Warping without enclosure', 'Moisture sensitivity', 'Layer adhesion at low chamber temps'],
      environmentalConcerns: ['Petroleum-based', 'Not biodegradable'],
      whenNotToUse: ['Open-frame printers', 'When standard PETG heat is sufficient', 'Budget projects'],
    },
    practicalContext: {
      industryAdoption: ['Automotive prototyping', 'Industrial equipment', 'Consumer appliances', 'Electrical housings'],
      commonApplications: ['Under-hood components', 'Coffee machine parts', 'Heat shields', 'LED housings'],
      safetyStandards: ['UL94 ratings available', 'Automotive interior grades', 'Some food-contact grades'],
      costPosition: 'Premium',
    },
    trivia: {
      funFacts: [
        'colorFabb nGen HT was one of the first 115°C+ Tg copolyesters for FDM',
        'Some HT copolyesters can be annealed to increase heat resistance further',
        'HT copolyesters often used as polycarbonate substitute in prototyping',
      ],
      whyInvented: 'Created to provide polycarbonate-like heat resistance without PC\'s printing difficulties.',
      controversies: [
        'Heat resistance claims sometimes require post-print annealing',
        'Performance gap between printed and injection molded parts',
      ],
      marketAdoption: 'Strong adoption in automotive and appliance prototyping sectors.',
    },
    tdsProfile: {
      properties: [
        { name: 'Tensile Strength', value: '55-65', unit: 'MPa', implications: 'Good. Similar to high-grade CPE.' },
        { name: 'Elongation at Break', value: '30-80', unit: '%', implications: 'Moderate to good ductility.' },
        { name: "Young's Modulus", value: '2100-2500', unit: 'MPa', implications: 'Good stiffness. Stiffer than standard copolyester.' },
        { name: 'Impact Strength', value: '60-90', unit: 'kJ/m² (Notched)', implications: 'Good. Maintains toughness at high temps.' },
        { name: 'Glass Transition (Tg)', value: '105-120', unit: '°C', implications: 'Excellent. Approaching polycarbonate territory.' },
        { name: 'Heat Deflection (HDT)', value: '100-115', unit: '°C (0.45 MPa)', implications: 'Very good. Suitable for high-temp applications.' },
      ],
      notes: 'Some grades can achieve higher heat resistance with post-print annealing.',
    },
    printSettings: {
      nozzleTemp: { min: 265, max: 295, optimal: 280 },
      bedTemp: { min: 90, max: 115, optimal: 100 },
      coolingFan: { min: 20, max: 60, notes: 'Lower cooling for layer adhesion at high temps.' },
      enclosure: { required: true, notes: 'Strongly recommended. Heated chamber improves results significantly.' },
      drying: { temp: 80, duration: '4-8 hours', notes: 'Hygroscopic. Dry thoroughly before printing.' },
      printSpeed: { recommended: '30-55 mm/s', notes: 'Slower speeds for best layer adhesion.' },
      additionalNotes: [
        'Higher temps than standard copolyester (265-295°C)',
        'Enclosure critical for large parts',
        'Consider annealing for maximum heat resistance',
        'Use release agent on smooth PEI',
      ],
    },
    adhesion: {
      bedSurfaces: {
        excellent: ['Textured PEI with release agent', 'Glass with strong adhesive'],
        good: ['Garolite', 'BuildTak'],
        poor: ['Bare smooth PEI'],
      },
      releaseAgents: 'Required on smooth PEI. Use Magigoo or similar.',
      multiMaterial: [
        { material: 'CPE/Copolyester', bondQuality: 'Strong Chemical Bond', notes: 'Good compatibility with copolyester family.' },
        { material: 'PETG', bondQuality: 'Mechanical Bond', notes: 'Some adhesion possible.' },
        { material: 'PLA', bondQuality: 'No Bond', notes: 'Not compatible.' },
      ],
    },
    postProcessing: {
      chemicalSmoothing: [
        { method: 'Acetone', effectiveness: 'Not Possible', notes: 'No effect.' },
      ],
      mechanical: ['Sands well', 'Can be polished', 'Annealing improves heat resistance'],
      glues: ['Epoxy', 'Cyanoacrylate', 'Copolyester adhesives'],
      painting: 'Accepts paint well with light sanding.',
    },
    safety: {
      fumes: { level: 'Moderate', notes: 'Higher print temps increase emissions. Use ventilation.' },
      foodSafety: { rating: 'Check Specific Grade', notes: 'Some grades FDA approved. Verify product specs.' },
      biodegradability: { rating: 'Not Biodegradable', notes: 'Petroleum-based copolyester.' },
      additionalNotes: [
        'Higher temp printing may increase VOC emissions',
        'Use enclosure with HEPA filtration ideally',
        'Safe for most industrial applications',
      ],
    },
  },

  'CoPoly-nGen': {
    name: 'CoPoly-nGen',
    fullName: 'Eastman Amphora nGen Copolyester',
    origin: {
      yearInvented: '2015',
      originalCompany: 'colorFabb (using Eastman Amphora AM3300)',
      keyMilestones: [
        '2014: Eastman develops Amphora AM3300 for 3D printing',
        '2015: colorFabb launches nGen filament line',
        '2016: nGen becomes premium copolyester standard',
        '2018+: Multiple nGen variants (HT, Flex, Lux)',
      ],
      majorManufacturers: ['colorFabb (exclusive nGen brand)', 'Eastman (raw material)'],
    },
    composition: {
      basePolymer: 'Eastman Amphora AM3300 copolyester',
      chemicalFamily: 'Copolyester / Amphora family',
      keyAdditives: ['Clarity enhancers', 'Processing aids', 'Impact modifiers'],
      coloringAgents: 'Excellent clarity, vibrant color options',
      specialFillers: ['Generally unfilled', 'Some specialty variants with additives'],
    },
    familyContext: {
      parentPolymer: 'Eastman Amphora AM3300 - purpose-built for 3D printing',
      variants: ['nGen Standard', 'nGen HT', 'nGen Flex', 'nGen Lux', 'nGen ColorMorph'],
      chemicalComparison: 'Amphora was specifically formulated for FDM, unlike repurposed industrial copolyesters.',
      evolution: 'First copolyester specifically engineered for consumer 3D printing.',
    },
    strengths: {
      uniqueProperties: ['Designed for FDM printing', 'Excellent clarity', 'Low odor', 'Very low warping'],
      bestUseScenarios: ['Display models', 'Functional prototypes', 'Consumer products', 'Educational'],
      advantagesOverCompetitors: ['Easier than generic copolyester', 'Lower warping than PETG', 'Better clarity', 'Low odor'],
      whyChooseThis: 'When you want the easiest-printing premium copolyester with excellent aesthetics.',
    },
    weaknesses: {
      limitations: ['colorFabb exclusive', 'Premium pricing', 'Lower heat resistance than HT variants', 'Stringing prone'],
      commonProblems: ['Stringing requires retraction tuning', 'Moisture sensitive', 'Can stick too well to PEI'],
      environmentalConcerns: ['Petroleum-based', 'Not biodegradable'],
      whenNotToUse: ['High-temperature applications', 'When generic PETG is sufficient', 'Extreme budget constraints'],
    },
    practicalContext: {
      industryAdoption: ['Consumer products', 'Educational', 'Prototyping', 'Art and design'],
      commonApplications: ['Display cases', 'Consumer housings', 'Light covers', 'Educational models'],
      safetyStandards: ['Low emissions', 'Styrene-free certification', 'Classroom-safe'],
      costPosition: 'Premium',
    },
    trivia: {
      funFacts: [
        'Amphora was the first copolyester specifically formulated for 3D printing',
        'nGen is named for "next generation" copolyester',
        'colorFabb worked directly with Eastman to develop the material',
        'nGen Lux adds a metallic sheen effect',
      ],
      whyInvented: 'Eastman created Amphora to provide a copolyester optimized for FDM rather than adapted from injection molding.',
      controversies: [
        'Single-source material raises supply concerns',
        'Premium pricing compared to generic PETG alternatives',
      ],
      marketAdoption: 'Popular in education and consumer products where low emissions and ease of printing matter.',
    },
    tdsProfile: {
      properties: [
        { name: 'Tensile Strength', value: '46-52', unit: 'MPa', implications: 'Good. Comparable to PETG.' },
        { name: 'Elongation at Break', value: '180-220', unit: '%', implications: 'Excellent ductility. Very tough material.' },
        { name: "Young's Modulus", value: '1700-1950', unit: 'MPa', implications: 'Moderate stiffness. Slightly flexible.' },
        { name: 'Impact Strength', value: '95-120', unit: 'kJ/m² (Notched)', implications: 'Excellent. One of the toughest copolyesters.' },
        { name: 'Glass Transition (Tg)', value: '78-85', unit: '°C', implications: 'Moderate. Standard copolyester range.' },
        { name: 'Heat Deflection (HDT)', value: '72-80', unit: '°C (0.45 MPa)', implications: 'Standard. Use nGen HT for higher temps.' },
      ],
      notes: 'Optimized for printability and impact resistance rather than heat resistance.',
    },
    printSettings: {
      nozzleTemp: { min: 220, max: 250, optimal: 240 },
      bedTemp: { min: 75, max: 85, optimal: 80 },
      coolingFan: { min: 40, max: 100, notes: 'Higher cooling than typical copolyester for clarity.' },
      enclosure: { required: false, notes: 'Not required. Open frame printers work well.' },
      drying: { temp: 65, duration: '4-6 hours', notes: 'Hygroscopic. Dry for best results.' },
      printSpeed: { recommended: '40-70 mm/s', notes: 'Prints faster than many copolyesters.' },
      additionalNotes: [
        'Lower print temps than typical copolyester (220-250°C)',
        'Excellent first layer adhesion',
        'Use release agent on smooth PEI',
        'Higher fan speeds improve clarity',
      ],
    },
    adhesion: {
      bedSurfaces: {
        excellent: ['Textured PEI', 'Glass with hairspray'],
        good: ['BuildTak', 'Blue tape'],
        poor: ['Bare smooth PEI (may damage surface)'],
      },
      releaseAgents: 'Recommended on smooth PEI. Hairspray or glue stick work well.',
      multiMaterial: [
        { material: 'PETG', bondQuality: 'Strong Chemical Bond', notes: 'Excellent compatibility.' },
        { material: 'nGen variants', bondQuality: 'Strong Chemical Bond', notes: 'All nGen variants bond well together.' },
        { material: 'PLA', bondQuality: 'No Bond', notes: 'Not compatible.' },
      ],
    },
    postProcessing: {
      chemicalSmoothing: [
        { method: 'Acetone', effectiveness: 'Not Possible', notes: 'No effect on Amphora.' },
      ],
      mechanical: ['Sands very well', 'Polishes to high clarity', 'Excellent surface finishing'],
      glues: ['Cyanoacrylate', 'Epoxy', 'E6000'],
      painting: 'Accepts paint well with light sanding or adhesion promoter.',
    },
    safety: {
      fumes: { level: 'Very Low', notes: 'Designed for low emissions. Styrene-free.' },
      foodSafety: { rating: 'Check Specific Color', notes: 'Base material is food-safe. Colorants may vary.' },
      biodegradability: { rating: 'Not Biodegradable', notes: 'Petroleum-based copolyester.' },
      additionalNotes: [
        'Styrene-free formulation',
        'Designed to be classroom-safe',
        'Lower emissions than many engineering plastics',
        'Good choice for educational environments',
      ],
    },
  },

  'CoPoly-XT': {
    name: 'CoPoly-XT',
    fullName: 'Cross-linked/Extended Temperature Copolyester',
    origin: {
      yearInvented: '2016-2017',
      originalCompany: 'colorFabb (XT series), others following',
      keyMilestones: [
        '2016: colorFabb XT series launched',
        '2017: XT-CF carbon fiber variant introduced',
        '2018: Other manufacturers adopt XT-style formulations',
      ],
      majorManufacturers: ['colorFabb (XT series)', 'Polymaker', 'Fiberlogy', 'add:north'],
    },
    composition: {
      basePolymer: 'Eastman Amphora-based copolyester (XT formulation)',
      chemicalFamily: 'Copolyester / Extended Performance',
      keyAdditives: ['Heat stabilizers', 'Clarity enhancers', 'Impact modifiers'],
      coloringAgents: 'Good clarity, color options available',
      specialFillers: ['Carbon fiber (XT-CF)', 'Generally unfilled (XT standard)'],
    },
    familyContext: {
      parentPolymer: 'Based on Eastman Amphora copolyester platform',
      variants: ['XT Standard', 'XT-CF (carbon fiber)', 'XT Clear'],
      chemicalComparison: 'Positioned between nGen and nGen HT - better heat resistance than nGen, easier than HT.',
      evolution: 'Developed as middle-ground option in copolyester performance spectrum.',
    },
    strengths: {
      uniqueProperties: ['Balanced properties', 'Good heat resistance', 'Excellent clarity', 'Low warping'],
      bestUseScenarios: ['Functional prototypes', 'Consumer products', 'Light-duty engineering', 'Display parts'],
      advantagesOverCompetitors: ['Easier than HT variants', 'Better heat than standard nGen', 'Good balance of properties'],
      whyChooseThis: 'When you need better heat resistance than standard copolyester without HT-level complexity.',
    },
    weaknesses: {
      limitations: ['Middle-ground positioning', 'Premium pricing', 'Limited brand availability', 'Stringing prone'],
      commonProblems: ['Stringing requires tuning', 'Moisture sensitive', 'Can over-adhere to some surfaces'],
      environmentalConcerns: ['Petroleum-based', 'Not biodegradable'],
      whenNotToUse: ['When standard PETG is sufficient', 'Maximum heat resistance needed', 'Budget constraints'],
    },
    practicalContext: {
      industryAdoption: ['Prototyping', 'Consumer products', 'Light engineering', 'Hobbyist'],
      commonApplications: ['Functional prototypes', 'Housings', 'Display cases', 'Tool handles'],
      safetyStandards: ['Low emissions', 'Generally industrial use'],
      costPosition: 'Premium',
    },
    trivia: {
      funFacts: [
        'XT designation stands for "extended temperature" or "cross-temperature" capability',
        'XT-CF was one of the first premium carbon fiber copolyester products',
        'The XT line bridges the gap between hobbyist and professional materials',
      ],
      whyInvented: 'Created to offer a step-up from standard copolyester without requiring enclosed printers.',
      controversies: [
        'Naming convention can be confusing vs other manufacturer designations',
        'Performance overlap with other copolyester grades',
      ],
      marketAdoption: 'Popular among users wanting better-than-PETG performance without professional equipment.',
    },
    tdsProfile: {
      properties: [
        { name: 'Tensile Strength', value: '50-58', unit: 'MPa', implications: 'Good. Between nGen and HT grades.' },
        { name: 'Elongation at Break', value: '100-180', unit: '%', implications: 'Good ductility. Tough material.' },
        { name: "Young's Modulus", value: '1900-2200', unit: 'MPa', implications: 'Moderate stiffness. Balanced rigidity.' },
        { name: 'Impact Strength', value: '80-100', unit: 'kJ/m² (Notched)', implications: 'Good impact resistance.' },
        { name: 'Glass Transition (Tg)', value: '88-98', unit: '°C', implications: 'Good. Better than standard nGen.' },
        { name: 'Heat Deflection (HDT)', value: '82-95', unit: '°C (0.45 MPa)', implications: 'Good. Improved heat resistance.' },
      ],
      notes: 'Middle-ground properties between standard and HT copolyesters.',
    },
    printSettings: {
      nozzleTemp: { min: 240, max: 270, optimal: 255 },
      bedTemp: { min: 75, max: 90, optimal: 85 },
      coolingFan: { min: 30, max: 80, notes: 'Moderate to high cooling for clarity.' },
      enclosure: { required: false, notes: 'Beneficial but not required for most parts.' },
      drying: { temp: 70, duration: '4-6 hours', notes: 'Hygroscopic. Dry before printing.' },
      printSpeed: { recommended: '40-65 mm/s', notes: 'Standard copolyester speeds work well.' },
      additionalNotes: [
        'Higher temps than nGen, lower than HT',
        'Enclosure helps for larger parts',
        'Use release agent on smooth PEI',
        'Tune retraction to minimize stringing',
      ],
    },
    adhesion: {
      bedSurfaces: {
        excellent: ['Textured PEI', 'Glass with adhesive'],
        good: ['BuildTak', 'Blue tape'],
        poor: ['Bare smooth PEI'],
      },
      releaseAgents: 'Recommended on smooth PEI.',
      multiMaterial: [
        { material: 'nGen/Copolyester', bondQuality: 'Strong Chemical Bond', notes: 'Excellent compatibility with copolyester family.' },
        { material: 'PETG', bondQuality: 'Strong Chemical Bond', notes: 'Good adhesion to PETG.' },
        { material: 'PLA', bondQuality: 'No Bond', notes: 'Not compatible.' },
      ],
    },
    postProcessing: {
      chemicalSmoothing: [
        { method: 'Acetone', effectiveness: 'Not Possible', notes: 'No effect on copolyester.' },
      ],
      mechanical: ['Sands well', 'Can be polished', 'Good surface finishing'],
      glues: ['Cyanoacrylate', 'Epoxy', 'E6000'],
      painting: 'Accepts paint with light sanding or adhesion promoter.',
    },
    safety: {
      fumes: { level: 'Low', notes: 'Low emissions. Standard ventilation sufficient.' },
      foodSafety: { rating: 'Check Specific Grade', notes: 'Base material may be food-safe. Verify specific product.' },
      biodegradability: { rating: 'Not Biodegradable', notes: 'Petroleum-based copolyester.' },
      additionalNotes: [
        'Based on Amphora platform - low emissions',
        'Safe for general use with normal ventilation',
        'Good choice for classroom or office printing',
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

  'PEEK-CF': {
    name: 'PEEK-CF',
    fullName: 'Carbon Fiber Reinforced Polyether Ether Ketone',
    origin: {
      yearInvented: '2010s (for 3D printing)',
      originalCompany: 'Various manufacturers for industrial applications',
      keyMilestones: [
        '2010s: CF-reinforced PEEK developed for machining',
        '2015+: PEEK-CF filaments emerge for high-temp printers',
        '2020+: Growing availability from specialized manufacturers',
      ],
      majorManufacturers: ['Victrex', '3DXTech', 'Apium', 'Evonik', 'Stratasys'],
    },
    composition: {
      basePolymer: 'PEEK (Polyether Ether Ketone)',
      chemicalFamily: 'Polyaryletherketone (PAEK) with carbon fiber',
      keyAdditives: ['Chopped carbon fiber (10-30%)', 'Coupling agents'],
      coloringAgents: 'Black/dark grey from carbon fiber content',
      specialFillers: ['Milled or chopped carbon fibers'],
    },
    familyContext: {
      parentPolymer: 'PEEK reinforced with carbon fiber',
      variants: ['PEEK-CF10', 'PEEK-CF20', 'PEEK-CF30'],
      chemicalComparison: 'Dramatically increased stiffness and dimensional stability over pure PEEK, with reduced ductility.',
      evolution: 'Carbon fiber addition maximizes stiffness for structural aerospace applications.',
    },
    strengths: {
      uniqueProperties: ['Extreme stiffness', 'Outstanding heat resistance', 'Excellent dimensional stability', 'Metal replacement capability'],
      bestUseScenarios: ['Aerospace structural parts', 'High-temp tooling', 'Metal replacement applications', 'Stiffness-critical components'],
      advantagesOverCompetitors: ['Stiffest high-temp material available', 'Maintains PEEK thermal properties', 'Superior creep resistance'],
      whyChooseThis: 'When maximum stiffness at extreme temperatures is required and nothing else will survive the environment.',
    },
    weaknesses: {
      limitations: ['Extremely expensive ($800+/kg)', 'Requires specialized high-temp equipment', 'Highly abrasive', 'Reduced ductility'],
      commonProblems: ['Rapid nozzle wear', 'Anisotropic properties', 'Difficult crystallization control', 'Very few printers capable'],
      environmentalConcerns: ['Carbon fiber not recyclable', 'Extremely energy-intensive production'],
      whenNotToUse: ['When pure PEEK properties suffice', 'Impact-critical applications', 'Without proper high-temp equipment'],
    },
    practicalContext: {
      industryAdoption: ['Aerospace', 'Semiconductor', 'Oil & gas', 'Racing/motorsport'],
      commonApplications: ['Aircraft brackets', 'Satellite components', 'Downhole tools', 'Wafer handling'],
      safetyStandards: ['Various aerospace certifications', 'FST compliance available'],
      costPosition: 'Industrial',
    },
    trivia: {
      funFacts: [
        'PEEK-CF can have higher stiffness-to-weight ratio than aluminum',
        'Used in actual spacecraft and satellite applications',
        'Requires hardened steel or ruby-tipped nozzles',
      ],
      whyInvented: 'To maximize structural performance of PEEK for weight-critical aerospace applications.',
      controversies: [
        'Cost puts it out of reach for most applications',
        'Fiber orientation dramatically affects properties',
      ],
      marketAdoption: 'Extremely specialized - only for applications where no other material works.',
    },
    tdsProfile: {
      properties: [
        { name: 'Tensile Strength', value: '120-170', unit: 'MPa', implications: 'Extremely high with fiber reinforcement.' },
        { name: 'Tensile Modulus', value: '12000-20000', unit: 'MPa', implications: 'Exceptional stiffness. Approaches aluminum.' },
        { name: 'Elongation at Break', value: '1-3', unit: '%', implications: 'Very low - stiff but brittle.' },
        { name: 'Continuous Use Temp', value: '250', unit: '°C', implications: 'Outstanding high-temperature capability.' },
        { name: 'Heat Deflection (HDT)', value: '260-300', unit: '°C', implications: 'Maintains shape at extreme temperatures.' },
      ],
      notes: 'Properties highly dependent on fiber content and orientation. Design for fiber alignment.',
    },
    printSettings: {
      nozzleTemp: { min: 380, max: 420, optimal: 400 },
      bedTemp: { min: 140, max: 180, optimal: 160 },
      coolingFan: { min: 0, max: 0, notes: 'NO cooling. Thermal management critical.' },
      enclosure: { required: true, notes: 'MANDATORY. 120-160°C chamber required.' },
      drying: { temp: 150, duration: '6-12 hours', notes: 'Must be bone dry. Consider printing from dry box.' },
      printSpeed: { recommended: '10-25 mm/s', notes: 'Very slow. CF content requires careful flow control.' },
      additionalNotes: [
        'Hardened nozzle MANDATORY - brass will destroy in minutes',
        '400°C+ capable hotend required',
        'Specialized PEEK-capable printer essential',
        'Consider 0.6mm+ nozzle for fiber flow',
      ],
    },
    adhesion: {
      bedSurfaces: {
        excellent: ['PEEK/PEI sheet', 'High-temp specialty surfaces'],
        good: ['Garolite at extreme temps'],
        poor: ['All standard surfaces'],
      },
      releaseAgents: 'Usually releases on cooling. High-temp bed surfaces only.',
      multiMaterial: [
        { material: 'PEEK', bondQuality: 'Strong Chemical Bond', notes: 'Same base polymer.' },
        { material: 'PEKK', bondQuality: 'Strong Chemical Bond', notes: 'PAEK family compatibility.' },
      ],
    },
    postProcessing: {
      chemicalSmoothing: [
        { method: 'Not applicable', effectiveness: 'Not Possible', notes: 'Chemically inert. No solvents work.' },
      ],
      mechanical: ['Machines with carbide tools', 'CF dust hazard when machining'],
      glues: ['Specialty high-temp adhesives', 'Mechanical fastening preferred'],
      painting: 'Rarely needed. Surface prep challenging due to chemical resistance.',
    },
    safety: {
      fumes: { level: 'Moderate', notes: 'PEEK fumes plus CF particulates. Excellent ventilation required.' },
      foodSafety: { rating: 'Not Safe', notes: 'Carbon fiber content precludes food contact.' },
      biodegradability: { rating: 'Not Biodegradable', notes: 'Extremely stable. Carbon fiber is permanent.' },
      additionalNotes: [
        'Carbon fiber dust is a respiratory hazard',
        'HEPA filtration mandatory when machining',
        'Wear appropriate PPE',
      ],
    },
  },

  'PEKK-CF': {
    name: 'PEKK-CF',
    fullName: 'Carbon Fiber Reinforced Polyetherketoneketone',
    origin: {
      yearInvented: '2016+',
      originalCompany: 'Arkema and compounding partners',
      keyMilestones: [
        '2016: Arkema launches Kepstan for 3D printing',
        '2018: PEKK-CF variants become available',
        '2020+: Growing adoption in aerospace 3D printing',
      ],
      majorManufacturers: ['Arkema', '3DXTech', 'Stratasys', 'CRP Technology'],
    },
    composition: {
      basePolymer: 'PEKK (Polyetherketoneketone)',
      chemicalFamily: 'Polyaryletherketone (PAEK) with carbon fiber',
      keyAdditives: ['Chopped carbon fiber (10-20%)', 'Coupling agents'],
      coloringAgents: 'Black/dark grey from carbon fiber',
      specialFillers: ['Carbon fiber reinforcement'],
    },
    familyContext: {
      parentPolymer: 'PEKK reinforced with carbon fiber',
      variants: ['PEKK-CF A (amorphous)', 'PEKK-CF C (crystalline)'],
      chemicalComparison: 'Easier to print than PEEK-CF while offering similar performance for many applications.',
      evolution: 'Combines PEKK processability with carbon fiber reinforcement.',
    },
    strengths: {
      uniqueProperties: ['High stiffness', 'Easier processing than PEEK-CF', 'Excellent thermal properties', 'Good layer adhesion'],
      bestUseScenarios: ['Aerospace prototypes', 'High-temp tooling', 'Structural components', 'Weight-critical parts'],
      advantagesOverCompetitors: ['Lower processing temp than PEEK-CF', 'Better layer adhesion', 'More forgiving to print'],
      whyChooseThis: 'When you need PEEK-CF-like performance but want easier processing and better print success rates.',
    },
    weaknesses: {
      limitations: ['Very expensive', 'Still requires high-temp equipment', 'Abrasive', 'Limited availability'],
      commonProblems: ['Crystallization management', 'Anisotropic strength', 'Nozzle wear'],
      environmentalConcerns: ['Not recyclable', 'Energy-intensive production'],
      whenNotToUse: ['When pure PEKK suffices', 'Budget applications', 'Without proper equipment'],
    },
    practicalContext: {
      industryAdoption: ['Aerospace', 'Defense', 'High-performance motorsport'],
      commonApplications: ['Aircraft interior brackets', 'UAV components', 'High-temp fixtures', 'Structural prototypes'],
      safetyStandards: ['FST compliant grades available', 'Aerospace certifications'],
      costPosition: 'Industrial',
    },
    trivia: {
      funFacts: [
        'PEKK-CF offers ~90% of PEEK-CF performance with better printability',
        'Stratasys Antero 840CF is a commercial PEKK-CF material',
        'Used in production aerospace parts',
      ],
      whyInvented: 'To make carbon fiber reinforced PAEK more accessible for additive manufacturing.',
      controversies: [
        'Debate over PEKK-CF vs PEEK-CF for specific applications continues',
      ],
      marketAdoption: 'Growing in aerospace AM as processability advantage is recognized.',
    },
    tdsProfile: {
      properties: [
        { name: 'Tensile Strength', value: '110-140', unit: 'MPa', implications: 'Very high with fiber reinforcement.' },
        { name: 'Tensile Modulus', value: '10000-15000', unit: 'MPa', implications: 'Excellent stiffness.' },
        { name: 'Elongation at Break', value: '2-4', unit: '%', implications: 'Low ductility due to fiber.' },
        { name: 'Glass Transition', value: '160', unit: '°C', implications: 'High Tg maintained.' },
        { name: 'Continuous Use Temp', value: '250', unit: '°C', implications: 'Outstanding thermal capability.' },
      ],
      notes: 'PEKK-CF A is easier to print, PEKK-CF C offers higher crystallinity and performance.',
    },
    printSettings: {
      nozzleTemp: { min: 350, max: 390, optimal: 370 },
      bedTemp: { min: 130, max: 160, optimal: 145 },
      coolingFan: { min: 0, max: 0, notes: 'NO cooling. Controlled thermal environment required.' },
      enclosure: { required: true, notes: 'MANDATORY. 90-120°C chamber needed.' },
      drying: { temp: 120, duration: '6-10 hours', notes: 'Must be thoroughly dried.' },
      printSpeed: { recommended: '15-30 mm/s', notes: 'Slow speeds for proper adhesion and fiber distribution.' },
      additionalNotes: [
        'Hardened nozzle REQUIRED',
        'High-temp capable system essential',
        'Easier than PEEK-CF but still challenging',
        '0.5mm+ nozzle recommended',
      ],
    },
    adhesion: {
      bedSurfaces: {
        excellent: ['PEI high-temp', 'PEKK/PEEK sheet'],
        good: ['High-temp Garolite'],
        poor: ['Standard surfaces'],
      },
      releaseAgents: 'Usually releases on cooling with proper surfaces.',
      multiMaterial: [
        { material: 'PEKK', bondQuality: 'Strong Chemical Bond', notes: 'Same base polymer.' },
        { material: 'PEEK', bondQuality: 'Strong Chemical Bond', notes: 'PAEK family compatibility.' },
      ],
    },
    postProcessing: {
      chemicalSmoothing: [
        { method: 'Not applicable', effectiveness: 'Not Possible', notes: 'Chemically resistant.' },
      ],
      mechanical: ['Machines with carbide tools', 'CF dust precautions required'],
      glues: ['High-temp epoxy', 'Mechanical fastening'],
      painting: 'Surface prep required. Rarely needed.',
    },
    safety: {
      fumes: { level: 'Low', notes: 'PEKK has low emissions. CF dust concern during machining.' },
      foodSafety: { rating: 'Not Safe', notes: 'Carbon fiber precludes food contact.' },
      biodegradability: { rating: 'Not Biodegradable', notes: 'Extremely stable materials.' },
      additionalNotes: [
        'CF dust hazard when post-processing',
        'HEPA filtration for machining',
      ],
    },
  },

  'PEKK-A': {
    name: 'PEKK-A',
    fullName: 'Amorphous Polyetherketoneketone',
    origin: {
      yearInvented: '2016',
      originalCompany: 'Arkema (Kepstan)',
      keyMilestones: [
        '2016: Arkema develops amorphous PEKK for 3D printing',
        '2018: Gains traction as easier-to-print PAEK alternative',
        '2020+: Widely adopted in industrial FFF',
      ],
      majorManufacturers: ['Arkema', '3DXTech', 'Polymaker', 'Stratasys'],
    },
    composition: {
      basePolymer: 'PEKK in amorphous form',
      chemicalFamily: 'Polyaryletherketone (PAEK)',
      keyAdditives: ['Modified for amorphous structure', 'Processing aids'],
      coloringAgents: 'Natural amber color, limited pigmentation',
      specialFillers: ['None in base grade'],
    },
    familyContext: {
      parentPolymer: 'PEKK formulated to remain amorphous',
      variants: ['PEKK-A unfilled', 'PEKK-A CF'],
      chemicalComparison: 'Lower crystallinity than PEKK-C gives better layer adhesion but lower mechanical properties.',
      evolution: 'Specifically developed for FFF 3D printing with better interlayer bonding.',
    },
    strengths: {
      uniqueProperties: ['Best layer adhesion of PAEK materials', 'No crystallization issues', 'Transparent/translucent possible', 'Forgiving to print'],
      bestUseScenarios: ['High-temp prototypes', 'Parts requiring good Z-strength', 'Learning high-temp printing', 'Transparent high-temp parts'],
      advantagesOverCompetitors: ['Easiest PAEK to print', 'Best interlayer strength', 'No warping from crystallization'],
      whyChooseThis: 'When you need PAEK-class performance with the best possible print success and layer bonding.',
    },
    weaknesses: {
      limitations: ['Lower mechanical properties than crystalline PEKK', 'Lower chemical resistance', 'Still expensive', 'Lower service temp than PEKK-C'],
      commonProblems: ['Can soften at lower temps than crystalline version', 'May not meet all PAEK specs'],
      environmentalConcerns: ['Same as other PAEK materials'],
      whenNotToUse: ['Maximum mechanical properties required', 'Highest chemical resistance needed', 'When PEKK-C properties are specified'],
    },
    practicalContext: {
      industryAdoption: ['R&D prototyping', 'Aerospace development', 'High-temp tooling'],
      commonApplications: ['Prototypes before PEKK-C production', 'High-temp fixtures', 'Transparent high-temp parts'],
      safetyStandards: ['Various certifications depending on grade'],
      costPosition: 'Industrial',
    },
    trivia: {
      funFacts: [
        'PEKK-A was specifically designed for FFF printing - not just adapted',
        'Can be nearly transparent in thin sections',
        'The amorphous structure eliminates crystallization warping',
      ],
      whyInvented: 'To solve the layer adhesion and warping problems that plagued early PAEK 3D printing.',
      controversies: [
        'Trade-off between printability and performance debated',
        'Some consider it "PEKK-lite" unfairly',
      ],
      marketAdoption: 'Popular entry point into PAEK printing due to forgiving nature.',
    },
    tdsProfile: {
      properties: [
        { name: 'Tensile Strength', value: '85-100', unit: 'MPa', implications: 'High, slightly lower than crystalline PEKK.' },
        { name: 'Tensile Modulus', value: '3200-3800', unit: 'MPa', implications: 'Good stiffness.' },
        { name: 'Elongation at Break', value: '20-40', unit: '%', implications: 'Better ductility than crystalline.' },
        { name: 'Glass Transition', value: '160', unit: '°C', implications: 'Service temp limited by Tg.' },
        { name: 'Continuous Use Temp', value: '160', unit: '°C', implications: 'Lower than crystalline due to no crystallinity.' },
      ],
      notes: 'Trade lower ultimate properties for better printability and isotropy.',
    },
    printSettings: {
      nozzleTemp: { min: 340, max: 380, optimal: 360 },
      bedTemp: { min: 120, max: 150, optimal: 135 },
      coolingFan: { min: 0, max: 10, notes: 'Minimal or no cooling.' },
      enclosure: { required: true, notes: 'Required but lower chamber temp acceptable - 70-100°C.' },
      drying: { temp: 120, duration: '4-8 hours', notes: 'Thorough drying required.' },
      printSpeed: { recommended: '20-40 mm/s', notes: 'Faster than crystalline PEKK possible.' },
      additionalNotes: [
        'Most forgiving of PAEK materials',
        'Good for learning high-temp printing',
        'No annealing required',
        'All-metal hotend still required',
      ],
    },
    adhesion: {
      bedSurfaces: {
        excellent: ['PEI high-temp', 'Garolite'],
        good: ['Glass with high-temp adhesive'],
        poor: ['Standard low-temp surfaces'],
      },
      releaseAgents: 'Usually releases on cooling.',
      multiMaterial: [
        { material: 'PEKK', bondQuality: 'Strong Chemical Bond', notes: 'Same polymer family.' },
        { material: 'PEI', bondQuality: 'Mechanical Bond', notes: 'Reasonable adhesion.' },
      ],
    },
    postProcessing: {
      chemicalSmoothing: [
        { method: 'Not effective', effectiveness: 'Difficult', notes: 'Chemically resistant like all PAEK.' },
      ],
      mechanical: ['Sands and machines well', 'Can be polished to clarity'],
      glues: ['Epoxy', 'Cyanoacrylate', 'Specialty PAEK adhesives'],
      painting: 'Surface prep required due to chemical resistance.',
    },
    safety: {
      fumes: { level: 'Low', notes: 'Low emissions. Good ventilation still recommended.' },
      foodSafety: { rating: 'Grades Available', notes: 'FDA compliant grades may be available.' },
      biodegradability: { rating: 'Not Biodegradable', notes: 'Stable polymer.' },
    },
  },

  'PEI-CF': {
    name: 'PEI-CF',
    fullName: 'Carbon Fiber Reinforced Polyetherimide',
    origin: {
      yearInvented: '2015+',
      originalCompany: 'Various manufacturers',
      keyMilestones: [
        '2015: PEI (Ultem) enters 3D printing',
        '2017: CF-reinforced PEI variants emerge',
        '2020+: Growing industrial adoption',
      ],
      majorManufacturers: ['3DXTech', 'Stratasys', 'Polymaker', 'Sabic'],
    },
    composition: {
      basePolymer: 'PEI (Polyetherimide)',
      chemicalFamily: 'Polyimide with carbon fiber',
      keyAdditives: ['Chopped carbon fiber (10-20%)'],
      coloringAgents: 'Black/dark from carbon fiber',
      specialFillers: ['Carbon fiber reinforcement'],
    },
    familyContext: {
      parentPolymer: 'PEI (Ultem) reinforced with carbon fiber',
      variants: ['PEI-CF10', 'PEI-CF20'],
      chemicalComparison: 'Increased stiffness and dimensional stability over pure PEI.',
      evolution: 'Carbon fiber addition for structural applications.',
    },
    strengths: {
      uniqueProperties: ['High stiffness', 'Excellent heat resistance', 'FST compliance', 'Dimensional stability'],
      bestUseScenarios: ['Aircraft interior parts', 'High-temp tooling', 'ESD applications', 'Structural aerospace'],
      advantagesOverCompetitors: ['FST compliant', 'Good high-temp performance', 'Better than PEI alone for stiffness'],
      whyChooseThis: 'When aerospace FST compliance is needed with maximum stiffness.',
    },
    weaknesses: {
      limitations: ['Expensive', 'Abrasive', 'Requires high-temp equipment', 'Reduced ductility'],
      commonProblems: ['Nozzle wear', 'Layer adhesion challenges', 'Moisture sensitive'],
      environmentalConcerns: ['CF not recyclable', 'Energy intensive'],
      whenNotToUse: ['When pure PEI suffices', 'Impact-critical parts', 'Budget applications'],
    },
    practicalContext: {
      industryAdoption: ['Aerospace', 'Defense', 'Industrial tooling'],
      commonApplications: ['Aircraft ducting', 'Interior brackets', 'High-temp jigs'],
      safetyStandards: ['FAR 25.853', 'FST compliance'],
      costPosition: 'Industrial',
    },
    trivia: {
      funFacts: [
        'PEI-CF meets stringent aircraft interior fire safety requirements',
        'Often used alongside Ultem 9085 in aerospace',
      ],
      whyInvented: 'To maximize PEI stiffness for structural aerospace applications.',
      controversies: [
        'Cost vs benefit debate for non-certified applications',
      ],
      marketAdoption: 'Growing in aerospace additive manufacturing.',
    },
    tdsProfile: {
      properties: [
        { name: 'Tensile Strength', value: '100-130', unit: 'MPa', implications: 'High with CF reinforcement.' },
        { name: 'Tensile Modulus', value: '8000-12000', unit: 'MPa', implications: 'Very stiff.' },
        { name: 'Elongation at Break', value: '2-4', unit: '%', implications: 'Low - stiff but brittle.' },
        { name: 'Heat Deflection', value: '200-210', unit: '°C', implications: 'Excellent heat resistance.' },
        { name: 'Glass Transition', value: '215', unit: '°C', implications: 'High Tg maintained.' },
      ],
      notes: 'FST compliant for aerospace interiors.',
    },
    printSettings: {
      nozzleTemp: { min: 360, max: 400, optimal: 380 },
      bedTemp: { min: 130, max: 160, optimal: 145 },
      coolingFan: { min: 0, max: 10, notes: 'Minimal cooling.' },
      enclosure: { required: true, notes: 'REQUIRED. 90-120°C chamber.' },
      drying: { temp: 150, duration: '8-12 hours', notes: 'Critical - very hygroscopic.' },
      printSpeed: { recommended: '20-35 mm/s', notes: 'Moderate speeds.' },
      additionalNotes: [
        'Hardened nozzle REQUIRED',
        'All-metal high-temp hotend required',
        '0.5mm+ nozzle recommended for CF',
      ],
    },
    adhesion: {
      bedSurfaces: {
        excellent: ['PEI sheet', 'High-temp surfaces'],
        good: ['Garolite'],
        poor: ['Standard surfaces'],
      },
      releaseAgents: 'Usually releases on cooling.',
      multiMaterial: [
        { material: 'PEI', bondQuality: 'Strong Chemical Bond', notes: 'Same base polymer.' },
      ],
    },
    postProcessing: {
      chemicalSmoothing: [
        { method: 'Not effective', effectiveness: 'Not Possible', notes: 'Chemically resistant.' },
      ],
      mechanical: ['Machines with carbide tools', 'CF dust precautions'],
      glues: ['High-temp epoxy', 'Specialty adhesives'],
      painting: 'Surface prep required.',
    },
    safety: {
      fumes: { level: 'Moderate', notes: 'Good ventilation required. CF dust when machining.' },
      foodSafety: { rating: 'Not Safe', notes: 'Carbon fiber precludes food contact.' },
      biodegradability: { rating: 'Not Biodegradable', notes: 'Stable materials.' },
    },
  },

  'PEI 1010': {
    name: 'PEI 1010',
    fullName: 'Polyetherimide 1010 (Ultem 1010)',
    origin: {
      yearInvented: '1980s (material), 2010s (filament)',
      originalCompany: 'SABIC (Ultem brand)',
      keyMilestones: [
        '1980s: Ultem 1010 developed by GE Plastics',
        '2010s: Stratasys adopts for Fortus systems',
        '2018+: Third-party filaments emerge',
      ],
      majorManufacturers: ['SABIC', 'Stratasys', '3DXTech'],
    },
    composition: {
      basePolymer: 'PEI (Polyetherimide) - Ultem 1010 grade',
      chemicalFamily: 'Polyimide',
      keyAdditives: ['Minimal - pure grade'],
      coloringAgents: 'Natural amber, limited colors',
      specialFillers: ['None - unfilled grade'],
    },
    familyContext: {
      parentPolymer: 'Ultem 1010 - the original unfilled PEI',
      variants: ['Ultem 1010 standard'],
      chemicalComparison: 'Higher heat resistance than 9085, better chemical resistance, but lower FST ratings.',
      evolution: 'Original high-performance PEI grade adapted for 3D printing.',
    },
    strengths: {
      uniqueProperties: ['Highest heat resistance of PEI grades', 'Excellent chemical resistance', 'Biocompatible', 'Autoclavable'],
      bestUseScenarios: ['Medical devices', 'Food processing', 'Sterilizable parts', 'Chemical exposure applications'],
      advantagesOverCompetitors: ['Biocompatible certified', 'Autoclave safe', 'FDA food contact grades'],
      whyChooseThis: 'When biocompatibility, sterilizability, or food contact compliance is required.',
    },
    weaknesses: {
      limitations: ['No FST certification (use 9085 for aerospace)', 'Very expensive', 'Difficult to print', 'Requires high-temp equipment'],
      commonProblems: ['Warping', 'Layer adhesion', 'Moisture absorption'],
      environmentalConcerns: ['Energy intensive production'],
      whenNotToUse: ['Aerospace FST applications (use 9085)', 'Budget projects', 'Without proper equipment'],
    },
    practicalContext: {
      industryAdoption: ['Medical devices', 'Food processing', 'Semiconductor'],
      commonApplications: ['Surgical instruments', 'Sterilization trays', 'Food handling parts', 'Autoclave components'],
      safetyStandards: ['FDA food contact', 'ISO 10993 biocompatibility', 'USP Class VI'],
      costPosition: 'Industrial',
    },
    trivia: {
      funFacts: [
        'Ultem 1010 can withstand steam autoclave sterilization',
        'Used in reusable surgical instruments',
        'Higher Tg than 9085 grade',
      ],
      whyInvented: 'For applications requiring both high heat and biocompatibility/chemical resistance.',
      controversies: [
        'Often confused with 9085 - they have different certifications',
      ],
      marketAdoption: 'Standard in medical device prototyping and production.',
    },
    tdsProfile: {
      properties: [
        { name: 'Tensile Strength', value: '81', unit: 'MPa', implications: 'High strength.' },
        { name: 'Tensile Modulus', value: '2800', unit: 'MPa', implications: 'Good stiffness.' },
        { name: 'Elongation at Break', value: '3-6', unit: '%', implications: 'Limited ductility.' },
        { name: 'Heat Deflection', value: '213', unit: '°C', implications: 'Highest of PEI grades.' },
        { name: 'Glass Transition', value: '217', unit: '°C', implications: 'Very high Tg.' },
      ],
      notes: 'The go-to grade for biocompatible and sterilizable applications.',
    },
    printSettings: {
      nozzleTemp: { min: 365, max: 400, optimal: 385 },
      bedTemp: { min: 140, max: 175, optimal: 160 },
      coolingFan: { min: 0, max: 0, notes: 'No cooling.' },
      enclosure: { required: true, notes: 'REQUIRED. 100-130°C chamber.' },
      drying: { temp: 150, duration: '8-12 hours', notes: 'CRITICAL - extremely hygroscopic.' },
      printSpeed: { recommended: '20-35 mm/s', notes: 'Moderate speeds.' },
      additionalNotes: [
        'All-metal 400°C hotend required',
        'More difficult than 9085 to print',
        'Aggressive bed adhesion needed',
      ],
    },
    adhesion: {
      bedSurfaces: {
        excellent: ['PEI sheet', 'High-temp specialty'],
        good: ['Garolite'],
        poor: ['Standard surfaces'],
      },
      releaseAgents: 'High-temp specialty adhesives may help.',
      multiMaterial: [
        { material: 'PEI', bondQuality: 'Strong Chemical Bond', notes: 'Same polymer.' },
      ],
    },
    postProcessing: {
      chemicalSmoothing: [
        { method: 'Not effective', effectiveness: 'Not Possible', notes: 'Chemically resistant.' },
      ],
      mechanical: ['Machines well', 'Can be polished'],
      glues: ['Epoxy', 'Specialty adhesives'],
      painting: 'Surface prep required.',
    },
    safety: {
      fumes: { level: 'Moderate', notes: 'Ventilation required at high printing temps.' },
      foodSafety: { rating: 'FDA Compliant', notes: 'FDA food contact approved.' },
      biodegradability: { rating: 'Not Biodegradable', notes: 'Stable polymer.' },
      additionalNotes: [
        'Biocompatible (ISO 10993)',
        'Autoclave sterilizable',
      ],
    },
  },

  'PEI 9085': {
    name: 'PEI 9085',
    fullName: 'Polyetherimide 9085 (Ultem 9085)',
    origin: {
      yearInvented: '2000s',
      originalCompany: 'SABIC/Stratasys',
      keyMilestones: [
        '2000s: Developed specifically for aerospace AM',
        '2012: Certified for aircraft interior use',
        '2015+: Becomes standard for aerospace 3D printing',
      ],
      majorManufacturers: ['SABIC', 'Stratasys', '3DXTech'],
    },
    composition: {
      basePolymer: 'PEI (Polyetherimide) - 9085 FST grade',
      chemicalFamily: 'Polyimide (FST formulated)',
      keyAdditives: ['Flame retardants', 'Smoke suppressants'],
      coloringAgents: 'Tan natural color, black available',
      specialFillers: ['FST additives'],
    },
    familyContext: {
      parentPolymer: 'PEI formulated for FST (Flame, Smoke, Toxicity) compliance',
      variants: ['Ultem 9085 standard', 'Ultem 9085 CG (certified)'],
      chemicalComparison: 'Lower heat resistance than 1010, but FST certified for aerospace.',
      evolution: 'Developed specifically for aircraft interior compliance.',
    },
    strengths: {
      uniqueProperties: ['FST certified', 'FAR 25.853 compliant', 'Good strength', 'Excellent layer adhesion'],
      bestUseScenarios: ['Aircraft interiors', 'Rail transport', 'Certified aerospace parts', 'High-temp enclosures'],
      advantagesOverCompetitors: ['The standard for aerospace AM', 'Certified supply chain', 'Proven track record'],
      whyChooseThis: 'When FAR 25.853 FST certification is required for aircraft or rail interiors.',
    },
    weaknesses: {
      limitations: ['Lower heat resistance than 1010', 'Expensive', 'Proprietary system advantage', 'Not biocompatible'],
      commonProblems: ['Still requires high-temp equipment', 'Moisture sensitive', 'Warping possible'],
      environmentalConcerns: ['FST additives', 'Energy intensive'],
      whenNotToUse: ['Biocompatible needs (use 1010)', 'Maximum heat resistance', 'Non-certified applications'],
    },
    practicalContext: {
      industryAdoption: ['Commercial aerospace', 'Defense', 'Rail transport'],
      commonApplications: ['Aircraft ducting', 'Interior brackets', 'Cable management', 'Overhead bin components'],
      safetyStandards: ['FAR 25.853', 'ABD0031', 'EN 45545'],
      costPosition: 'Industrial',
    },
    trivia: {
      funFacts: [
        'Ultem 9085 is on thousands of commercial aircraft',
        'First thermoplastic certified for aircraft interior production',
        'The "9085" refers to the FST formulation number',
      ],
      whyInvented: 'To enable additive manufacturing of certified aircraft interior parts.',
      controversies: [
        'High cost of certified material supply chains',
        'Stratasys vs third-party certification debates',
      ],
      marketAdoption: 'The dominant material for aerospace FDM production.',
    },
    tdsProfile: {
      properties: [
        { name: 'Tensile Strength', value: '72', unit: 'MPa', implications: 'Good strength.' },
        { name: 'Tensile Modulus', value: '2200', unit: 'MPa', implications: 'Moderate stiffness.' },
        { name: 'Elongation at Break', value: '6', unit: '%', implications: 'Limited ductility.' },
        { name: 'Heat Deflection', value: '153', unit: '°C', implications: 'Lower than 1010 due to FST additives.' },
        { name: 'FST Rating', value: 'FAR 25.853', unit: '', implications: 'Certified for aircraft interiors.' },
      ],
      notes: 'The benchmark for FST-compliant 3D printed parts.',
    },
    printSettings: {
      nozzleTemp: { min: 355, max: 390, optimal: 370 },
      bedTemp: { min: 130, max: 160, optimal: 145 },
      coolingFan: { min: 0, max: 10, notes: 'Minimal cooling.' },
      enclosure: { required: true, notes: 'REQUIRED. 90-110°C chamber.' },
      drying: { temp: 150, duration: '8-12 hours', notes: 'Very hygroscopic - thorough drying critical.' },
      printSpeed: { recommended: '25-40 mm/s', notes: 'Moderate speeds work well.' },
      additionalNotes: [
        'Easier than 1010 to print',
        'All-metal hotend required',
        'Good layer adhesion',
        'Use certified material for production parts',
      ],
    },
    adhesion: {
      bedSurfaces: {
        excellent: ['PEI sheet', 'Ultem sheet'],
        good: ['Garolite'],
        poor: ['Standard surfaces'],
      },
      releaseAgents: 'Usually releases on cooling.',
      multiMaterial: [
        { material: 'PEI 1010', bondQuality: 'Strong Chemical Bond', notes: 'Same polymer family.' },
      ],
    },
    postProcessing: {
      chemicalSmoothing: [
        { method: 'Not effective', effectiveness: 'Not Possible', notes: 'Chemically resistant.' },
      ],
      mechanical: ['Sands and machines well', 'Can be polished'],
      glues: ['Epoxy', 'Specialty PEI adhesives'],
      painting: 'Surface prep needed. FST paints required for certified parts.',
    },
    safety: {
      fumes: { level: 'Moderate', notes: 'Good ventilation required.' },
      foodSafety: { rating: 'Not Certified', notes: 'FST additives preclude food contact.' },
      biodegradability: { rating: 'Not Biodegradable', notes: 'Stable polymer.' },
      additionalNotes: [
        'FST compliant - low flame, smoke, toxicity',
        'Safe for aircraft cabin use',
      ],
    },
  },

  'ESD-PEI': {
    name: 'ESD-PEI',
    fullName: 'Electrostatic Dissipative Polyetherimide',
    origin: {
      yearInvented: '2015+',
      originalCompany: 'Various manufacturers',
      keyMilestones: [
        '2015+: ESD variants of high-performance materials emerge',
        '2018: ESD-PEI filaments become available',
      ],
      majorManufacturers: ['3DXTech', 'Stratasys', 'Polymaker'],
    },
    composition: {
      basePolymer: 'PEI (Polyetherimide)',
      chemicalFamily: 'Polyimide with ESD additives',
      keyAdditives: ['Carbon nanotubes or carbon black', 'ESD compounds'],
      coloringAgents: 'Black only due to carbon content',
      specialFillers: ['Conductive carbon additives'],
    },
    familyContext: {
      parentPolymer: 'PEI with ESD properties',
      variants: ['ESD-PEI standard'],
      chemicalComparison: 'Standard PEI properties with static dissipation capability.',
      evolution: 'Developed for semiconductor and electronics requiring both high-temp and ESD protection.',
    },
    strengths: {
      uniqueProperties: ['ESD safe', 'High heat resistance', 'Good mechanical properties', 'Consistent conductivity'],
      bestUseScenarios: ['Semiconductor tooling', 'Electronics manufacturing fixtures', 'High-temp ESD applications'],
      advantagesOverCompetitors: ['Higher temp than ESD-PC', 'Better chemical resistance', 'Aerospace-compatible'],
      whyChooseThis: 'When both high temperature capability and ESD protection are required.',
    },
    weaknesses: {
      limitations: ['Black only', 'Expensive', 'Requires high-temp equipment', 'Slightly reduced mechanical properties'],
      commonProblems: ['ESD properties must be verified after printing', 'Humidity affects conductivity'],
      environmentalConcerns: ['Carbon additives not recyclable'],
      whenNotToUse: ['When ESD not needed', 'Color required', 'Budget applications'],
    },
    practicalContext: {
      industryAdoption: ['Semiconductor', 'Electronics manufacturing', 'Aerospace'],
      commonApplications: ['Wafer handling', 'ESD-safe test fixtures', 'High-temp electronics jigs'],
      safetyStandards: ['ANSI/ESD standards', 'Various semiconductor specs'],
      costPosition: 'Industrial',
    },
    trivia: {
      funFacts: [
        'ESD-PEI combines two specialized requirements in one material',
        'Used in semiconductor fabs for wafer handling at elevated temps',
      ],
      whyInvented: 'Semiconductor industry needs both ESD protection and high-temp capability.',
      controversies: [
        'Printing process can affect ESD properties - must verify',
      ],
      marketAdoption: 'Specialized but essential in semiconductor manufacturing.',
    },
    tdsProfile: {
      properties: [
        { name: 'Surface Resistivity', value: '10^6-10^9', unit: 'ohms/sq', implications: 'ESD dissipative range.' },
        { name: 'Tensile Strength', value: '70-80', unit: 'MPa', implications: 'Slightly reduced from pure PEI.' },
        { name: 'Heat Deflection', value: '195-205', unit: '°C', implications: 'Excellent heat resistance.' },
        { name: 'Glass Transition', value: '210-215', unit: '°C', implications: 'High Tg.' },
      ],
      notes: 'Verify ESD properties after printing. Layer orientation affects conductivity.',
    },
    printSettings: {
      nozzleTemp: { min: 360, max: 395, optimal: 375 },
      bedTemp: { min: 130, max: 160, optimal: 145 },
      coolingFan: { min: 0, max: 10, notes: 'Minimal cooling.' },
      enclosure: { required: true, notes: 'REQUIRED. 90-110°C chamber.' },
      drying: { temp: 150, duration: '8-12 hours', notes: 'Critical - very hygroscopic.' },
      printSpeed: { recommended: '20-35 mm/s', notes: 'Moderate speeds.' },
      additionalNotes: [
        'All-metal high-temp hotend required',
        'Verify ESD after printing',
        'Ground parts properly in use',
      ],
    },
    adhesion: {
      bedSurfaces: {
        excellent: ['PEI sheet', 'High-temp specialty'],
        good: ['Garolite'],
        poor: ['Standard surfaces'],
      },
      releaseAgents: 'Standard PEI techniques.',
      multiMaterial: [
        { material: 'PEI', bondQuality: 'Strong Chemical Bond', notes: 'Same base polymer.' },
      ],
    },
    postProcessing: {
      chemicalSmoothing: [
        { method: 'Not recommended', effectiveness: 'Not Possible', notes: 'May affect ESD properties.' },
      ],
      mechanical: ['Minimal - may affect ESD', 'Test after any modification'],
      glues: ['Conductive adhesives for ESD continuity'],
      painting: 'Not recommended - defeats ESD purpose.',
    },
    safety: {
      fumes: { level: 'Moderate', notes: 'Good ventilation required.' },
      foodSafety: { rating: 'Not Safe', notes: 'Not intended for food contact.' },
      biodegradability: { rating: 'Not Biodegradable', notes: 'Stable polymer.' },
    },
  },

  'ESD-PEKK': {
    name: 'ESD-PEKK',
    fullName: 'Electrostatic Dissipative Polyetherketoneketone',
    origin: {
      yearInvented: '2018+',
      originalCompany: 'Various manufacturers',
      keyMilestones: [
        '2018+: ESD versions of PAEK materials developed',
      ],
      majorManufacturers: ['3DXTech', 'Arkema'],
    },
    composition: {
      basePolymer: 'PEKK (Polyetherketoneketone)',
      chemicalFamily: 'PAEK with ESD additives',
      keyAdditives: ['Carbon-based conductive compounds'],
      coloringAgents: 'Black only',
      specialFillers: ['ESD carbon additives'],
    },
    familyContext: {
      parentPolymer: 'PEKK with ESD properties',
      variants: ['ESD-PEKK standard'],
      chemicalComparison: 'PEKK properties with static dissipation added.',
      evolution: 'Top-tier ESD material for extreme environments.',
    },
    strengths: {
      uniqueProperties: ['ESD safe', 'Extreme heat resistance', 'Chemical resistance', 'PAEK-class performance'],
      bestUseScenarios: ['Extreme environment ESD tooling', 'High-temp semiconductor', 'Aerospace ESD applications'],
      advantagesOverCompetitors: ['Highest-temp ESD material', 'Chemical resistance', 'PAEK properties'],
      whyChooseThis: 'When both PAEK-level performance and ESD protection are essential.',
    },
    weaknesses: {
      limitations: ['Extremely expensive', 'Very limited availability', 'Requires specialized equipment'],
      commonProblems: ['Same as PEKK plus ESD verification needs'],
      environmentalConcerns: ['Not recyclable'],
      whenNotToUse: ['When lower-temp ESD materials suffice', 'Budget projects'],
    },
    practicalContext: {
      industryAdoption: ['Semiconductor', 'Aerospace'],
      commonApplications: ['Extreme environment ESD fixtures', 'Space applications'],
      safetyStandards: ['ESD standards', 'Various aerospace specs'],
      costPosition: 'Industrial',
    },
    trivia: {
      funFacts: [
        'One of the highest-performance ESD materials available',
        'Combines PAEK thermal performance with ESD capability',
      ],
      whyInvented: 'For applications requiring both extreme temp and ESD protection.',
      controversies: [
        'Limited practical applications justify the extreme cost',
      ],
      marketAdoption: 'Very niche - only where no other material works.',
    },
    tdsProfile: {
      properties: [
        { name: 'Surface Resistivity', value: '10^6-10^9', unit: 'ohms/sq', implications: 'ESD dissipative.' },
        { name: 'Tensile Strength', value: '85-95', unit: 'MPa', implications: 'Slightly reduced from pure PEKK.' },
        { name: 'Continuous Use Temp', value: '250', unit: '°C', implications: 'Outstanding thermal capability.' },
      ],
      notes: 'Premium ESD material for extreme requirements.',
    },
    printSettings: {
      nozzleTemp: { min: 340, max: 380, optimal: 360 },
      bedTemp: { min: 120, max: 155, optimal: 140 },
      coolingFan: { min: 0, max: 0, notes: 'No cooling.' },
      enclosure: { required: true, notes: 'MANDATORY. 90-120°C chamber.' },
      drying: { temp: 120, duration: '6-10 hours', notes: 'Thorough drying required.' },
      printSpeed: { recommended: '15-30 mm/s', notes: 'Slow speeds.' },
      additionalNotes: [
        'Same requirements as PEKK',
        'Verify ESD after printing',
        'All-metal high-temp system required',
      ],
    },
    adhesion: {
      bedSurfaces: {
        excellent: ['PEKK/PEI sheet', 'High-temp surfaces'],
        good: ['Garolite'],
        poor: ['Standard surfaces'],
      },
      releaseAgents: 'Standard PEKK techniques.',
      multiMaterial: [
        { material: 'PEKK', bondQuality: 'Strong Chemical Bond', notes: 'Same base polymer.' },
      ],
    },
    postProcessing: {
      chemicalSmoothing: [
        { method: 'Not effective', effectiveness: 'Not Possible', notes: 'Chemically resistant.' },
      ],
      mechanical: ['Test ESD after modifications'],
      glues: ['Conductive adhesives preferred'],
      painting: 'Not recommended.',
    },
    safety: {
      fumes: { level: 'Low', notes: 'PEKK has low emissions. Ventilation still required.' },
      foodSafety: { rating: 'Not Safe', notes: 'ESD additives preclude food contact.' },
      biodegradability: { rating: 'Not Biodegradable', notes: 'Extremely stable.' },
    },
  },

  'PPS': {
    name: 'PPS',
    fullName: 'Polyphenylene Sulfide',
    origin: {
      yearInvented: '1973',
      originalCompany: 'Phillips Petroleum (now Chevron Phillips)',
      keyMilestones: [
        '1973: PPS commercialized by Phillips Petroleum',
        '1980s: Widely adopted in automotive and electronics',
        '2018+: PPS filaments emerge for 3D printing',
      ],
      majorManufacturers: ['Solvay (Ryton)', 'Toray', 'DIC', '3DXTech'],
    },
    composition: {
      basePolymer: 'Polyphenylene Sulfide',
      chemicalFamily: 'Aromatic sulfide polymer',
      keyAdditives: ['Glass or carbon fiber common', 'Various fillers'],
      coloringAgents: 'Natural dark brown, black with additives',
      specialFillers: ['Often glass or carbon fiber reinforced'],
    },
    familyContext: {
      parentPolymer: 'PPS (polyphenylene sulfide)',
      variants: ['PPS unfilled', 'PPS-GF', 'PPS-CF'],
      chemicalComparison: 'Exceptional chemical resistance, better than most engineering plastics. High temperature capability.',
      evolution: 'Originally for injection molding, now adapted for 3D printing.',
    },
    strengths: {
      uniqueProperties: ['Outstanding chemical resistance', 'Inherently flame retardant', 'Excellent dimensional stability', 'High-temp capable'],
      bestUseScenarios: ['Chemical processing equipment', 'Automotive under-hood', 'Pump components', 'Aggressive chemical environments'],
      advantagesOverCompetitors: ['Better chemical resistance than PEEK', 'Inherently FR without additives', 'Lower cost than PAEK'],
      whyChooseThis: 'When chemical resistance is the primary requirement with good thermal properties.',
    },
    weaknesses: {
      limitations: ['Brittle unfilled', 'Usually needs fiber reinforcement', 'Limited impact resistance', 'Requires high-temp equipment'],
      commonProblems: ['Crystallization important', 'Annealing may be needed', 'Brittle failures possible'],
      environmentalConcerns: ['Sulfur content', 'Energy intensive production'],
      whenNotToUse: ['Impact-critical parts', 'Without reinforcement for structural use', 'Budget applications'],
    },
    practicalContext: {
      industryAdoption: ['Chemical processing', 'Automotive', 'Electronics', 'Aerospace'],
      commonApplications: ['Pump impellers', 'Valve seats', 'Chemical tanks', 'Fuel system components'],
      safetyStandards: ['Inherently UL94 V0', 'Various chemical certifications'],
      costPosition: 'Premium',
    },
    trivia: {
      funFacts: [
        'PPS is naturally flame retardant without any additives',
        'Resists nearly all organic solvents at room temperature',
        'Originally developed for oil field applications',
        'Often called "the poor man\'s PEEK" for chemical resistance',
      ],
      whyInvented: 'For applications requiring extreme chemical resistance that even metals cannot provide.',
      controversies: [
        'Brittleness limits unfilled use',
        'Often compared to PEEK but different property balance',
      ],
      marketAdoption: 'Growing in AM for chemical resistance applications.',
    },
    tdsProfile: {
      properties: [
        { name: 'Tensile Strength', value: '65-85', unit: 'MPa', implications: 'Good when reinforced.' },
        { name: 'Tensile Modulus', value: '3500-4000', unit: 'MPa', implications: 'Stiff.' },
        { name: 'Elongation at Break', value: '1-3', unit: '%', implications: 'Brittle - very low elongation.' },
        { name: 'Heat Deflection', value: '135', unit: '°C (unfilled)', implications: 'Good heat resistance.' },
        { name: 'Continuous Use Temp', value: '200-220', unit: '°C', implications: 'Excellent long-term thermal stability.' },
        { name: 'Chemical Resistance', value: 'Outstanding', unit: '', implications: 'Resists nearly all chemicals.' },
      ],
      notes: 'Usually fiber-reinforced for practical applications. Inherently UL94 V0.',
    },
    printSettings: {
      nozzleTemp: { min: 300, max: 340, optimal: 320 },
      bedTemp: { min: 120, max: 150, optimal: 135 },
      coolingFan: { min: 0, max: 10, notes: 'Minimal cooling for crystallization control.' },
      enclosure: { required: true, notes: 'REQUIRED. 80-100°C chamber.' },
      drying: { temp: 150, duration: '4-8 hours', notes: 'Must be thoroughly dried.' },
      printSpeed: { recommended: '20-40 mm/s', notes: 'Moderate speeds.' },
      additionalNotes: [
        'All-metal hotend required',
        'Crystallization control important',
        'Consider annealing for optimal properties',
        'Often used with GF or CF reinforcement',
      ],
    },
    adhesion: {
      bedSurfaces: {
        excellent: ['PEI', 'High-temp specialty surfaces'],
        good: ['Garolite'],
        poor: ['Standard surfaces'],
      },
      releaseAgents: 'Usually releases on cooling.',
      multiMaterial: [
        { material: 'PPS-GF', bondQuality: 'Strong Chemical Bond', notes: 'Same base polymer.' },
      ],
    },
    postProcessing: {
      chemicalSmoothing: [
        { method: 'Very limited', effectiveness: 'Not Possible', notes: 'Chemically inert - that\'s the point.' },
      ],
      mechanical: ['Machines well', 'Brittle - careful with sharp corners'],
      glues: ['Specialty adhesives', 'Mechanical fastening often preferred'],
      painting: 'Difficult due to chemical resistance. Surface activation required.',
    },
    safety: {
      fumes: { level: 'Moderate', notes: 'Sulfur compounds possible. Good ventilation required.' },
      foodSafety: { rating: 'Grades Available', notes: 'Some FDA compliant grades exist.' },
      biodegradability: { rating: 'Not Biodegradable', notes: 'Extremely stable.' },
    },
  },

  'PPS-CF': {
    name: 'PPS-CF',
    fullName: 'Carbon Fiber Reinforced Polyphenylene Sulfide',
    origin: {
      yearInvented: '2018+',
      originalCompany: 'Various manufacturers',
      keyMilestones: [
        '2018+: CF-reinforced PPS for 3D printing emerges',
      ],
      majorManufacturers: ['3DXTech', 'Solvay'],
    },
    composition: {
      basePolymer: 'PPS (Polyphenylene Sulfide)',
      chemicalFamily: 'Aromatic sulfide with carbon fiber',
      keyAdditives: ['Carbon fiber (10-20%)'],
      coloringAgents: 'Black from CF',
      specialFillers: ['Carbon fiber reinforcement'],
    },
    familyContext: {
      parentPolymer: 'PPS reinforced with carbon fiber',
      variants: ['PPS-CF10', 'PPS-CF20'],
      chemicalComparison: 'Dramatically improved stiffness while maintaining chemical resistance.',
      evolution: 'CF addition for structural chemical-resistant parts.',
    },
    strengths: {
      uniqueProperties: ['Outstanding chemical resistance', 'High stiffness', 'Flame retardant', 'Dimensional stability'],
      bestUseScenarios: ['Structural chemical equipment', 'High-temp chemical jigs', 'Pump components'],
      advantagesOverCompetitors: ['Chemical resistance + stiffness combination', 'Lower cost than PEEK-CF'],
      whyChooseThis: 'When structural stiffness AND chemical resistance are both required.',
    },
    weaknesses: {
      limitations: ['Abrasive', 'Brittle', 'Requires high-temp equipment', 'Limited impact resistance'],
      commonProblems: ['Nozzle wear', 'Brittleness', 'Layer adhesion'],
      environmentalConcerns: ['CF not recyclable', 'Sulfur content'],
      whenNotToUse: ['Impact applications', 'Without hardened nozzle', 'Budget projects'],
    },
    practicalContext: {
      industryAdoption: ['Chemical processing', 'Semiconductor', 'Oil & gas'],
      commonApplications: ['Chemical fixtures', 'Pump components', 'Valve bodies'],
      safetyStandards: ['Inherently UL94 V0'],
      costPosition: 'Industrial',
    },
    trivia: {
      funFacts: [
        'Combines PPS chemical inertness with CF stiffness',
        'Often used where PEEK-CF chemical resistance is insufficient',
      ],
      whyInvented: 'For structural parts in aggressive chemical environments.',
      controversies: [
        'Brittleness limits applications despite excellent properties',
      ],
      marketAdoption: 'Specialized but valuable for chemical processing.',
    },
    tdsProfile: {
      properties: [
        { name: 'Tensile Strength', value: '100-130', unit: 'MPa', implications: 'High with CF.' },
        { name: 'Tensile Modulus', value: '12000-16000', unit: 'MPa', implications: 'Very stiff.' },
        { name: 'Elongation at Break', value: '1-2', unit: '%', implications: 'Very brittle.' },
        { name: 'Chemical Resistance', value: 'Outstanding', unit: '', implications: 'Resists nearly all chemicals.' },
        { name: 'Heat Deflection', value: '260+', unit: '°C', implications: 'Excellent with CF reinforcement.' },
      ],
      notes: 'Very stiff but brittle. Design accordingly.',
    },
    printSettings: {
      nozzleTemp: { min: 310, max: 350, optimal: 330 },
      bedTemp: { min: 120, max: 150, optimal: 135 },
      coolingFan: { min: 0, max: 10, notes: 'Minimal cooling.' },
      enclosure: { required: true, notes: 'REQUIRED. 80-100°C chamber.' },
      drying: { temp: 150, duration: '6-10 hours', notes: 'Thorough drying critical.' },
      printSpeed: { recommended: '15-30 mm/s', notes: 'Slower for CF flow.' },
      additionalNotes: [
        'Hardened nozzle REQUIRED',
        'All-metal hotend required',
        '0.5mm+ nozzle recommended',
      ],
    },
    adhesion: {
      bedSurfaces: {
        excellent: ['PEI', 'High-temp surfaces'],
        good: ['Garolite'],
        poor: ['Standard surfaces'],
      },
      releaseAgents: 'Usually releases on cooling.',
      multiMaterial: [
        { material: 'PPS', bondQuality: 'Strong Chemical Bond', notes: 'Same base polymer.' },
      ],
    },
    postProcessing: {
      chemicalSmoothing: [
        { method: 'Not effective', effectiveness: 'Not Possible', notes: 'Chemically inert.' },
      ],
      mechanical: ['Machines with carbide tools', 'CF dust precautions'],
      glues: ['Specialty adhesives', 'Mechanical fastening'],
      painting: 'Surface activation required.',
    },
    safety: {
      fumes: { level: 'Moderate', notes: 'PPS fumes plus CF dust concerns.' },
      foodSafety: { rating: 'Not Safe', notes: 'CF content.' },
      biodegradability: { rating: 'Not Biodegradable', notes: 'Extremely stable.' },
    },
  },

  'PPSU': {
    name: 'PPSU',
    fullName: 'Polyphenylsulfone',
    origin: {
      yearInvented: '1990s',
      originalCompany: 'Solvay (Radel brand)',
      keyMilestones: [
        '1990s: PPSU developed by Amoco/Solvay',
        '2000s: Medical device adoption grows',
        '2018+: PPSU filaments emerge',
      ],
      majorManufacturers: ['Solvay (Radel)', '3DXTech', 'BASF'],
    },
    composition: {
      basePolymer: 'Polyphenylsulfone',
      chemicalFamily: 'Sulfone polymer',
      keyAdditives: ['Minimal additives in pure grade'],
      coloringAgents: 'Natural amber, transparent possible',
      specialFillers: ['None in standard grade'],
    },
    familyContext: {
      parentPolymer: 'PPSU - toughest sulfone polymer',
      variants: ['PPSU standard', 'PPSU medical grade'],
      chemicalComparison: 'Highest impact resistance of sulfone family. Better toughness than PSU or PEI.',
      evolution: 'Developed for applications needing both chemical resistance and toughness.',
    },
    strengths: {
      uniqueProperties: ['Outstanding toughness', 'Excellent chemical resistance', 'Autoclavable', 'Biocompatible grades'],
      bestUseScenarios: ['Medical instruments', 'Reusable sterilizable parts', 'Impact-resistant chemical equipment'],
      advantagesOverCompetitors: ['Tougher than PSU', 'Better impact than PEI', 'Excellent steam resistance'],
      whyChooseThis: 'When both toughness AND chemical/steam resistance are required, especially for medical.',
    },
    weaknesses: {
      limitations: ['Expensive', 'Requires high-temp equipment', 'UV sensitive', 'Notch sensitive'],
      commonProblems: ['Moisture absorption', 'UV degradation outdoors', 'Printing difficulty'],
      environmentalConcerns: ['Energy intensive production'],
      whenNotToUse: ['Outdoor UV exposure', 'Budget applications', 'When PSU suffices'],
    },
    practicalContext: {
      industryAdoption: ['Medical devices', 'Plumbing', 'Food service', 'Aerospace'],
      commonApplications: ['Surgical instrument trays', 'Reusable medical devices', 'Hot water fittings'],
      safetyStandards: ['FDA', 'ISO 10993', 'NSF/ANSI 61'],
      costPosition: 'Industrial',
    },
    trivia: {
      funFacts: [
        'PPSU is the toughest member of the sulfone polymer family',
        'Can withstand 1000+ autoclave cycles',
        'Used for drinking water fittings worldwide',
      ],
      whyInvented: 'To provide sulfone chemical resistance with practical toughness.',
      controversies: [
        'High cost limits adoption despite excellent properties',
      ],
      marketAdoption: 'Standard for reusable medical devices.',
    },
    tdsProfile: {
      properties: [
        { name: 'Tensile Strength', value: '70-75', unit: 'MPa', implications: 'Good strength.' },
        { name: 'Tensile Modulus', value: '2300-2500', unit: 'MPa', implications: 'Moderate stiffness.' },
        { name: 'Impact Strength (Notched)', value: '690', unit: 'J/m', implications: 'Outstanding - toughest sulfone.' },
        { name: 'Heat Deflection', value: '207', unit: '°C', implications: 'Excellent heat resistance.' },
        { name: 'Steam Resistance', value: '1000+ cycles', unit: '', implications: 'Excellent autoclave durability.' },
      ],
      notes: 'The go-to material for reusable, sterilizable medical devices.',
    },
    printSettings: {
      nozzleTemp: { min: 360, max: 400, optimal: 380 },
      bedTemp: { min: 140, max: 175, optimal: 160 },
      coolingFan: { min: 0, max: 20, notes: 'Minimal cooling.' },
      enclosure: { required: true, notes: 'REQUIRED. 90-120°C chamber recommended.' },
      drying: { temp: 150, duration: '6-10 hours', notes: 'Hygroscopic - thorough drying critical.' },
      printSpeed: { recommended: '25-40 mm/s', notes: 'Moderate speeds.' },
      additionalNotes: [
        'All-metal high-temp hotend required',
        'Excellent layer adhesion when properly printed',
        'Great for functional medical prototypes',
      ],
    },
    adhesion: {
      bedSurfaces: {
        excellent: ['PEI', 'High-temp specialty'],
        good: ['Garolite', 'Glass with adhesive'],
        poor: ['Standard surfaces'],
      },
      releaseAgents: 'Usually releases on cooling.',
      multiMaterial: [
        { material: 'PSU', bondQuality: 'Strong Chemical Bond', notes: 'Same sulfone family.' },
        { material: 'PEI', bondQuality: 'Mechanical Bond', notes: 'Reasonable compatibility.' },
      ],
    },
    postProcessing: {
      chemicalSmoothing: [
        { method: 'Limited options', effectiveness: 'Difficult', notes: 'Chemically resistant.' },
      ],
      mechanical: ['Machines well', 'Good surface finish achievable'],
      glues: ['Epoxy', 'Specialty adhesives', 'Solvent bonding with NMP'],
      painting: 'Accepts paint after prep.',
    },
    safety: {
      fumes: { level: 'Moderate', notes: 'Good ventilation required.' },
      foodSafety: { rating: 'FDA Compliant', notes: 'FDA and NSF certified grades available.' },
      biodegradability: { rating: 'Not Biodegradable', notes: 'Stable polymer.' },
      additionalNotes: [
        'Biocompatible (ISO 10993)',
        'Autoclave safe',
      ],
    },
  },

  'PSU': {
    name: 'PSU',
    fullName: 'Polysulfone',
    origin: {
      yearInvented: '1965',
      originalCompany: 'Union Carbide (now Solvay - Udel brand)',
      keyMilestones: [
        '1965: PSU developed by Union Carbide',
        '1970s: Medical and food industry adoption',
        '2018+: PSU filaments for 3D printing',
      ],
      majorManufacturers: ['Solvay (Udel)', 'BASF', '3DXTech'],
    },
    composition: {
      basePolymer: 'Polysulfone',
      chemicalFamily: 'Sulfone polymer',
      keyAdditives: ['Minimal in pure grade', 'GF versions available'],
      coloringAgents: 'Transparent amber natural color',
      specialFillers: ['Glass fiber in reinforced grades'],
    },
    familyContext: {
      parentPolymer: 'PSU - the original sulfone polymer',
      variants: ['PSU (Udel)', 'PSU-GF'],
      chemicalComparison: 'Good balance of properties. Less tough than PPSU, lower temp than PEI.',
      evolution: 'The first commercial sulfone polymer, still widely used.',
    },
    strengths: {
      uniqueProperties: ['Transparent', 'Excellent hydrolysis resistance', 'Good chemical resistance', 'Autoclavable'],
      bestUseScenarios: ['Medical equipment', 'Transparent high-temp parts', 'Water handling', 'Food processing'],
      advantagesOverCompetitors: ['Transparent option', 'Lower cost than PPSU', 'Good steam resistance'],
      whyChooseThis: 'When transparency, chemical resistance, and steam sterilization are needed.',
    },
    weaknesses: {
      limitations: ['Less tough than PPSU', 'UV sensitive', 'Notch sensitive', 'Stress cracking in some solvents'],
      commonProblems: ['UV degradation', 'Stress cracking with some chemicals', 'Moisture absorption'],
      environmentalConcerns: ['Energy intensive production'],
      whenNotToUse: ['Maximum toughness needed (use PPSU)', 'Outdoor UV exposure', 'Aromatic solvent exposure'],
    },
    practicalContext: {
      industryAdoption: ['Medical', 'Food service', 'Water treatment', 'Electronics'],
      commonApplications: ['Dialysis equipment', 'Food service items', 'Water filters', 'Electrical connectors'],
      safetyStandards: ['FDA', 'NSF/ANSI 61', 'Various medical standards'],
      costPosition: 'Premium',
    },
    trivia: {
      funFacts: [
        'PSU was the first commercial sulfone polymer',
        'Can be naturally transparent at reasonable thicknesses',
        'Widely used in hemodialysis equipment',
      ],
      whyInvented: 'To provide a transparent, steam-resistant engineering plastic.',
      controversies: [
        'Often compared unfavorably to PPSU despite different applications',
      ],
      marketAdoption: 'Established material in medical and food industries.',
    },
    tdsProfile: {
      properties: [
        { name: 'Tensile Strength', value: '70-75', unit: 'MPa', implications: 'Good strength.' },
        { name: 'Tensile Modulus', value: '2500-2700', unit: 'MPa', implications: 'Good stiffness.' },
        { name: 'Impact Strength (Notched)', value: '60-70', unit: 'J/m', implications: 'Moderate - less than PPSU.' },
        { name: 'Heat Deflection', value: '174', unit: '°C', implications: 'Good heat resistance.' },
        { name: 'Light Transmission', value: '80+', unit: '%', implications: 'Transparent (amber tinted).' },
      ],
      notes: 'Good balance of properties with transparency option.',
    },
    printSettings: {
      nozzleTemp: { min: 340, max: 380, optimal: 360 },
      bedTemp: { min: 130, max: 160, optimal: 145 },
      coolingFan: { min: 0, max: 20, notes: 'Minimal cooling.' },
      enclosure: { required: true, notes: 'REQUIRED. 80-100°C chamber.' },
      drying: { temp: 140, duration: '6-10 hours', notes: 'Very hygroscopic.' },
      printSpeed: { recommended: '25-45 mm/s', notes: 'Moderate speeds.' },
      additionalNotes: [
        'All-metal hotend required',
        'Can achieve transparency with proper settings',
        'Avoid stress concentrators in design',
      ],
    },
    adhesion: {
      bedSurfaces: {
        excellent: ['PEI', 'High-temp surfaces'],
        good: ['Garolite', 'Glass with adhesive'],
        poor: ['Standard surfaces'],
      },
      releaseAgents: 'Usually releases on cooling.',
      multiMaterial: [
        { material: 'PPSU', bondQuality: 'Strong Chemical Bond', notes: 'Same sulfone family.' },
      ],
    },
    postProcessing: {
      chemicalSmoothing: [
        { method: 'Dichloromethane', effectiveness: 'Good', notes: 'Works but toxic. Can affect transparency.' },
      ],
      mechanical: ['Polishes well for clarity', 'Machines cleanly'],
      glues: ['Epoxy', 'Solvent bonding possible', 'Cyanoacrylate'],
      painting: 'Accepts paint, but often used for transparency.',
    },
    safety: {
      fumes: { level: 'Moderate', notes: 'Good ventilation required.' },
      foodSafety: { rating: 'FDA Compliant', notes: 'FDA food contact approved.' },
      biodegradability: { rating: 'Not Biodegradable', notes: 'Stable polymer.' },
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

  'TPC': {
    name: 'TPC',
    fullName: 'Thermoplastic Copolyester Elastomer',
    origin: {
      yearInvented: '1970s',
      originalCompany: 'DuPont (Hytrel brand)',
      keyMilestones: [
        '1972: DuPont commercializes Hytrel TPC',
        '1980s: Automotive and industrial adoption grows',
        '2000s: Other manufacturers develop TPC variants',
        '2018+: TPC filaments emerge for 3D printing',
      ],
      majorManufacturers: ['DuPont (Hytrel)', 'DSM (Arnitel)', 'BASF (Elastollan TPC)', 'colorFabb', 'FormFutura'],
    },
    composition: {
      basePolymer: 'Copolyester block copolymer (polyester hard segments + polyether soft segments)',
      chemicalFamily: 'Thermoplastic Copolyester (TPC-ET)',
      keyAdditives: ['UV stabilizers', 'Heat stabilizers', 'Processing aids'],
      coloringAgents: 'Available in various colors, often natural/translucent',
      specialFillers: ['Generally unfilled', 'Some carbon fiber variants exist'],
    },
    familyContext: {
      parentPolymer: 'Copolyester elastomer family',
      variants: ['TPC-ET (ether soft segment)', 'TPC-ES (ester soft segment)', 'TPC-EE (ether-ester)'],
      chemicalComparison: 'Better chemical and heat resistance than TPU, comparable to softer polyesters.',
      evolution: 'From automotive bellows and hoses to 3D printing flexible engineering material.',
    },
    strengths: {
      uniqueProperties: ['Excellent heat resistance', 'Superior chemical resistance', 'Good fatigue resistance', 'Wide service temperature range', 'Hydrolysis resistant'],
      bestUseScenarios: ['Automotive under-hood parts', 'Chemical contact applications', 'High-temperature flexible parts', 'Outdoor/UV exposure'],
      advantagesOverCompetitors: ['Better heat resistance than TPU', 'Better chemical resistance', 'Excellent long-term flex fatigue'],
      whyChooseThis: 'When you need flexibility combined with heat resistance or chemical exposure that TPU cannot handle.',
    },
    weaknesses: {
      limitations: ['More expensive than TPU', 'Limited filament availability', 'Requires higher print temps', 'Less commonly stocked'],
      commonProblems: ['Temperature sensitivity during printing', 'Stringing at higher temps', 'Moisture absorption'],
      environmentalConcerns: ['Petroleum-based', 'Not biodegradable', 'Complex polymer difficult to recycle'],
      whenNotToUse: ['Budget-sensitive projects', 'When TPU suffices', 'Ultra-soft applications'],
    },
    practicalContext: {
      industryAdoption: ['Automotive', 'Industrial', 'Sports equipment', 'Medical devices'],
      commonApplications: ['Bellows', 'Seals', 'Flexible couplings', 'Wire/cable jackets', 'Ski boot components'],
      safetyStandards: ['FDA food contact grades available', 'Various automotive certifications'],
      costPosition: 'Premium',
    },
    trivia: {
      funFacts: [
        'DuPont\'s Hytrel is used in automotive CVJ boots - the accordion-like covers on drive shafts',
        'TPC was chosen for ski boot components due to its flexibility even in cold temperatures',
        'The material can flex millions of times without fatigue failure',
      ],
      whyInvented: 'Developed to replace rubber in applications requiring flexibility with heat and chemical resistance.',
      controversies: [
        'Often confused with generic TPE despite distinct chemistry',
        'Higher cost limits adoption despite technical advantages',
      ],
      marketAdoption: 'Growing slowly in 3D printing as high-performance flexible material alternative to TPU.',
    },
    tdsProfile: {
      properties: [
        { name: 'Shore Hardness', value: '35D-72D', unit: '', implications: 'Generally firmer than TPU. D-scale indicates medium flexibility.' },
        { name: 'Tensile Strength', value: '25-50', unit: 'MPa', implications: 'Good strength retention at elevated temperatures.' },
        { name: 'Elongation at Break', value: '300-600', unit: '%', implications: 'Excellent elasticity with good recovery.' },
        { name: 'Flexural Modulus', value: '50-600', unit: 'MPa', implications: 'Wide range depending on grade. Stiffer than soft TPU.' },
        { name: 'Heat Resistance', value: '100-150', unit: '°C (continuous)', implications: 'Significantly better than TPU. Excellent for under-hood automotive.' },
        { name: 'Chemical Resistance', value: 'Excellent', unit: '', implications: 'Resists oils, greases, fuels, and many solvents better than TPU.' },
      ],
      notes: 'Properties superior to TPU in heat and chemical resistance. Trade-off is generally firmer feel and higher cost.',
    },
    printSettings: {
      nozzleTemp: { min: 220, max: 260, optimal: 240 },
      bedTemp: { min: 60, max: 90, optimal: 75 },
      coolingFan: { min: 30, max: 70, notes: 'Moderate cooling. Too much causes poor layer adhesion, too little causes stringing.' },
      enclosure: { required: false, notes: 'Helpful for temperature stability and reducing warping on larger parts.' },
      drying: { temp: 60, duration: '4-6 hours', notes: 'TPC absorbs moisture. Dry before printing for best results.' },
      printSpeed: { recommended: '20-40 mm/s', notes: 'Slower than rigid materials. Direct drive extruder recommended.' },
      additionalNotes: [
        'Direct drive extruder strongly recommended',
        'Higher temps than TPU - watch for stringing',
        'Use retraction carefully - test settings on small parts first',
        'Good flow calibration important for consistent results',
      ],
    },
    adhesion: {
      bedSurfaces: {
        excellent: ['Glass with glue stick', 'PEI (textured)'],
        good: ['Blue tape', 'BuildTak'],
        poor: ['Smooth PEI (may stick too well)'],
      },
      releaseAgents: 'Glue stick helps with both adhesion and release.',
      multiMaterial: [
        { material: 'PETG', bondQuality: 'Mechanical Bond', notes: 'Polyester family compatibility provides some adhesion.' },
        { material: 'PLA', bondQuality: 'Weak Bond', notes: 'Limited adhesion between these materials.' },
        { material: 'Nylon', bondQuality: 'Mechanical Bond', notes: 'Can be used in combination for flexible/rigid parts.' },
      ],
    },
    postProcessing: {
      chemicalSmoothing: [
        { method: 'Chemical', effectiveness: 'Difficult', notes: 'Resistant to most solvents. Not practical for smoothing.' },
      ],
      mechanical: ['Difficult to sand (elastic)', 'Can trim with sharp blade', 'Heat welding possible'],
      glues: ['Cyanoacrylate with activator', 'Contact cement', 'Specialty flexible adhesives'],
      painting: 'Difficult due to flexibility. Use flexible paints or dyes designed for elastomers.',
    },
    safety: {
      fumes: { level: 'Low', notes: 'Generally low emissions. Good ventilation recommended at higher temps.' },
      foodSafety: { rating: 'Some Grades', notes: 'FDA compliant grades available. Verify specific formulation.' },
      biodegradability: { rating: 'Not Biodegradable', notes: 'Petroleum-based polymer. Not biodegradable.' },
      additionalNotes: [
        'Generally considered safe with good ventilation',
        'Less odor than many flexible materials',
        'Skin-safe for most formulations',
      ],
    },
  },

  'PEBA': {
    name: 'PEBA',
    fullName: 'Polyether Block Amide',
    origin: {
      yearInvented: '1981',
      originalCompany: 'Arkema (originally Elf Atochem)',
      keyMilestones: [
        '1981: Arkema commercializes Pebax brand PEBA',
        '1990s: Sports and medical industry adoption',
        '2000s: High-performance footwear applications',
        '2019: Nike Vaporfly controversy brings PEBA to public attention',
        '2020+: PEBA filaments available for 3D printing',
      ],
      majorManufacturers: ['Arkema (Pebax)', 'Evonik (Vestamid E)', 'BASF', 'Lubrizol'],
    },
    composition: {
      basePolymer: 'Polyamide-polyether block copolymer',
      chemicalFamily: 'Polyether Block Amide Elastomer',
      keyAdditives: ['Antioxidants', 'UV stabilizers', 'Processing aids'],
      coloringAgents: 'Available in natural (translucent) and various colors',
      specialFillers: ['Generally unfilled for maximum energy return'],
    },
    familyContext: {
      parentPolymer: 'Nylon (polyamide) backbone with polyether soft segments',
      variants: ['Pebax (Arkema brand)', 'Vestamid E (Evonik)', 'Different hardness grades'],
      chemicalComparison: 'Combines nylon toughness with elastomer flexibility. Superior energy return compared to TPU.',
      evolution: 'From specialty industrial applications to revolutionary athletic footwear component.',
    },
    strengths: {
      uniqueProperties: ['Exceptional energy return (>90%)', 'Very low density (lightest engineering elastomer)', 'Excellent low-temperature flexibility', 'Fatigue resistant', 'Good chemical resistance'],
      bestUseScenarios: ['Athletic footwear midsoles', 'Sports equipment', 'Energy-absorbing applications', 'Low-temperature flexible parts'],
      advantagesOverCompetitors: ['Best energy return of any TPE', 'Lightest flexible engineering polymer', 'Maintains properties at -40°C', 'Superior resilience'],
      whyChooseThis: 'When you need maximum energy return, lightweight flexibility, or low-temperature performance that no other material matches.',
    },
    weaknesses: {
      limitations: ['Very expensive', 'Limited filament availability', 'Requires dry storage', 'Difficult to print'],
      commonProblems: ['Moisture absorption affects print quality', 'Stringing common', 'Limited supplier options', 'High cost per kg'],
      environmentalConcerns: ['Petroleum-based', 'Not biodegradable', 'Complex polymer challenging to recycle'],
      whenNotToUse: ['Budget-constrained projects', 'Applications where TPU suffices', 'Printers without direct drive'],
    },
    practicalContext: {
      industryAdoption: ['Athletic footwear', 'Sports equipment', 'Medical devices', 'Aerospace', 'Automotive'],
      commonApplications: ['Running shoe midsoles', 'Ski boots', 'Prosthetics', 'Protective gear', 'Shock absorbers'],
      safetyStandards: ['Medical grades available', 'Skin contact certified grades'],
      costPosition: 'Industrial',
    },
    trivia: {
      funFacts: [
        'Nike Vaporfly and Alphafly shoes use Pebax foam (ZoomX) - sparked controversy about unfair advantage',
        'PEBA returns over 90% of energy while TPU typically returns 60-70%',
        'It\'s called a "super foam" in athletic footwear and can shave minutes off marathon times',
        'PEBA is also used in hockey puck-resistant glass panel gaskets due to low-temp flexibility',
        'Arkema\'s Pebax is the dominant brand, almost synonymous with the polymer itself',
      ],
      whyInvented: 'Created to combine nylon\'s strength with rubber\'s flexibility for demanding industrial and medical applications.',
      controversies: [
        'Nike Vaporfly shoes sparked debate about whether PEBA provides unfair racing advantage',
        'World Athletics considered banning certain stack heights and foam combinations',
        'Called "technological doping" by some running purists',
      ],
      marketAdoption: 'Extremely limited in 3D printing due to cost and difficulty. Dominated by athletic footwear industry.',
    },
    tdsProfile: {
      properties: [
        { name: 'Shore Hardness', value: '25D-72D', unit: '', implications: 'Wide range available. Footwear typically uses softer grades (25-40D).' },
        { name: 'Density', value: '1.00-1.02', unit: 'g/cm³', implications: 'Lightest engineering elastomer. Even lighter than water.' },
        { name: 'Tensile Strength', value: '30-60', unit: 'MPa', implications: 'Excellent strength for an elastomer.' },
        { name: 'Elongation at Break', value: '400-600', unit: '%', implications: 'High elasticity with excellent recovery.' },
        { name: 'Energy Return', value: '>90', unit: '%', implications: 'Exceptional - returns stored energy extremely efficiently. Key differentiator.' },
        { name: 'Low-Temp Flexibility', value: '-40', unit: '°C', implications: 'Remains flexible at extremely low temperatures. Better than TPU.' },
        { name: 'Compression Set', value: '<15', unit: '%', implications: 'Excellent - maintains shape after repeated compression.' },
      ],
      notes: 'Outstanding energy return and low density are the defining characteristics. Significantly outperforms TPU in these metrics.',
    },
    printSettings: {
      nozzleTemp: { min: 220, max: 260, optimal: 240 },
      bedTemp: { min: 60, max: 90, optimal: 75 },
      coolingFan: { min: 20, max: 60, notes: 'Moderate cooling. Balance between stringing control and layer adhesion.' },
      enclosure: { required: false, notes: 'Not required but helpful for temperature stability and reducing moisture pickup during long prints.' },
      drying: { temp: 70, duration: '6-8 hours', notes: 'PEBA absorbs moisture like nylon. Dry thoroughly and consider printing from a dry box.' },
      printSpeed: { recommended: '15-30 mm/s', notes: 'Slow printing required. Direct drive extruder essential.' },
      additionalNotes: [
        'DIRECT DRIVE EXTRUDER ESSENTIAL - cannot print with Bowden',
        'Constrained filament path critical to prevent buckling',
        'Minimal retraction (0.5-2mm) with slower retraction speed',
        'Print from dry box if possible - very moisture sensitive',
        'Expect extensive tuning required for good results',
      ],
    },
    adhesion: {
      bedSurfaces: {
        excellent: ['Glass with glue stick', 'PEI (textured) with light glue'],
        good: ['Blue tape', 'BuildTak'],
        poor: ['Smooth PEI (may adhere too strongly)'],
      },
      releaseAgents: 'Glue stick serves as both adhesion promoter and release aid.',
      multiMaterial: [
        { material: 'Nylon', bondQuality: 'Strong Chemical Bond', notes: 'Polyamide backbone provides excellent adhesion to nylon materials.' },
        { material: 'TPU', bondQuality: 'Mechanical Bond', notes: 'Some adhesion possible for flexible combinations.' },
        { material: 'PLA', bondQuality: 'Weak Bond', notes: 'Limited compatibility between these materials.' },
      ],
    },
    postProcessing: {
      chemicalSmoothing: [
        { method: 'Chemical', effectiveness: 'Difficult', notes: 'Resistant to common solvents. Chemical smoothing not practical.' },
      ],
      mechanical: ['Difficult to sand (elastic recovery)', 'Can trim with sharp tools', 'Heat welding possible'],
      glues: ['Cyanoacrylate with activator', 'Contact adhesive', 'Two-part epoxy for structural bonds'],
      painting: 'Challenging due to flexibility. Flexible paints or specialty elastomer coatings required.',
    },
    safety: {
      fumes: { level: 'Low', notes: 'Similar to nylon. Good ventilation recommended.' },
      foodSafety: { rating: 'Some Grades', notes: 'Medical-grade PEBA available. Specific certification required.' },
      biodegradability: { rating: 'Not Biodegradable', notes: 'Petroleum-based engineering polymer. Not biodegradable.' },
      additionalNotes: [
        'Generally safe with good ventilation',
        'Medical grades are biocompatible and used in implantable devices',
        'Skin-safe for most applications',
      ],
    },
  },

  'PEBA 85A': {
    name: 'PEBA 85A',
    fullName: 'Polyether Block Amide - Shore 85A',
    origin: {
      yearInvented: '1981 (PEBA), 2020s (3D printing grades)',
      originalCompany: 'Arkema (Pebax brand)',
      keyMilestones: [
        '1981: Arkema commercializes Pebax brand PEBA',
        '2019: Nike Vaporfly brings PEBA to mainstream awareness',
        '2021+: Softer PEBA grades become available for 3D printing',
      ],
      majorManufacturers: ['Arkema (Pebax)', 'Evonik', 'Lubrizol', 'Recreus'],
    },
    composition: {
      basePolymer: 'Polyamide-polyether block copolymer',
      chemicalFamily: 'Polyether Block Amide Elastomer',
      keyAdditives: ['Antioxidants', 'UV stabilizers', 'Softening modifiers'],
      coloringAgents: 'Available in natural (translucent) and various colors',
      specialFillers: ['Generally unfilled for maximum flexibility and energy return'],
    },
    familyContext: {
      parentPolymer: 'PEBA (Polyether Block Amide)',
      variants: ['PEBA 85A (soft)', 'PEBA 95A (medium)', 'PEBA Air (ultra-light foamed)'],
      chemicalComparison: 'Softer than standard PEBA grades (typically 25D-72D). 85A comparable to medium-soft TPU.',
      evolution: 'Developed for applications requiring softer feel while retaining PEBA energy return properties.',
    },
    strengths: {
      uniqueProperties: ['Exceptional energy return (>87%)', 'Soft rubber-like feel', 'Ultra-lightweight', 'Excellent low-temp flexibility', 'Superior fatigue resistance'],
      bestUseScenarios: ['Cushioning applications', 'Soft-touch grips', 'Athletic footwear components', 'Prosthetic liners'],
      advantagesOverCompetitors: ['Better energy return than TPU 85A', 'Lighter weight', 'Superior resilience', 'Better cold-weather performance'],
      whyChooseThis: 'When you need soft flexibility with maximum energy return and lightweight properties.',
    },
    weaknesses: {
      limitations: ['Extremely expensive', 'Very limited availability', 'Challenging to print', 'Requires dry storage'],
      commonProblems: ['Moisture sensitivity', 'Stringing issues', 'Limited supplier options', 'Direct drive required'],
      environmentalConcerns: ['Petroleum-based', 'Not biodegradable', 'Difficult to recycle'],
      whenNotToUse: ['Budget projects', 'When TPU 85A suffices', 'Bowden extruder printers'],
    },
    practicalContext: {
      industryAdoption: ['Athletic footwear', 'Medical devices', 'Sports equipment', 'Prosthetics'],
      commonApplications: ['Running shoe midsoles', 'Protective padding', 'Soft grips', 'Energy-absorbing insoles'],
      safetyStandards: ['Medical grades available', 'Skin-contact certified'],
      costPosition: 'Industrial',
    },
    trivia: {
      funFacts: [
        'PEBA 85A offers TPU-like softness with PEBA energy return - best of both worlds',
        'Used in premium running shoe midsoles where cushioning meets responsiveness',
        'Some prosthetic socket liners use soft PEBA grades for comfort',
      ],
      whyInvented: 'Created to extend PEBA benefits to applications requiring softer, more cushioning properties.',
      controversies: [
        'Premium pricing limits adoption despite excellent properties',
        'Often compared unfavorably to TPU on cost basis alone',
      ],
      marketAdoption: 'Extremely limited in 3D printing. Primarily used in injection-molded athletic products.',
    },
    tdsProfile: {
      properties: [
        { name: 'Shore Hardness', value: '85A', unit: '', implications: 'Soft flexible material. Similar feel to TPU 85A but with superior energy return.' },
        { name: 'Density', value: '1.00-1.02', unit: 'g/cm³', implications: 'Ultra-lightweight - among the lightest elastomers available.' },
        { name: 'Tensile Strength', value: '25-35', unit: 'MPa', implications: 'Good strength for soft elastomer.' },
        { name: 'Elongation at Break', value: '500-700', unit: '%', implications: 'Excellent elasticity with outstanding recovery.' },
        { name: 'Energy Return', value: '>87', unit: '%', implications: 'Exceptional - significantly better than TPU at same hardness.' },
        { name: 'Compression Set', value: '<20', unit: '%', implications: 'Excellent shape retention after compression.' },
      ],
      notes: 'Combines soft flexibility of 85A hardness with PEBA energy return advantages. Premium performance in lightweight package.',
    },
    printSettings: {
      nozzleTemp: { min: 215, max: 250, optimal: 235 },
      bedTemp: { min: 50, max: 80, optimal: 65 },
      coolingFan: { min: 20, max: 50, notes: 'Moderate cooling. Balance stringing control with layer adhesion.' },
      enclosure: { required: false, notes: 'Helpful for temperature stability.' },
      drying: { temp: 65, duration: '6-8 hours', notes: 'Very moisture sensitive. Dry thoroughly before printing.' },
      printSpeed: { recommended: '15-25 mm/s', notes: 'Very slow speeds required. Direct drive essential.' },
      additionalNotes: [
        'DIRECT DRIVE EXTRUDER ESSENTIAL',
        'Constrained filament path critical - soft material buckles easily',
        'Minimal retraction (0.5-1.5mm) with slow retraction speed',
        'Print from dry box recommended',
        'Expect extensive tuning for optimal results',
      ],
    },
    adhesion: {
      bedSurfaces: {
        excellent: ['Glass with glue stick', 'Blue tape'],
        good: ['PEI (textured) with glue', 'BuildTak'],
        poor: ['Smooth PEI (sticks too much)'],
      },
      releaseAgents: 'Glue stick essential for both adhesion and release.',
      multiMaterial: [
        { material: 'Nylon', bondQuality: 'Strong Chemical Bond', notes: 'Polyamide compatibility provides excellent adhesion.' },
        { material: 'TPU', bondQuality: 'Mechanical Bond', notes: 'Reasonable adhesion for flexible combinations.' },
        { material: 'PLA', bondQuality: 'Weak Bond', notes: 'Limited compatibility.' },
      ],
    },
    postProcessing: {
      chemicalSmoothing: [
        { method: 'Chemical', effectiveness: 'Difficult', notes: 'Solvent resistant. Not practical for smoothing.' },
      ],
      mechanical: ['Difficult to sand (elastic)', 'Trim with sharp blade', 'Heat welding possible'],
      glues: ['Cyanoacrylate with activator', 'Contact adhesive', 'Flexible adhesives'],
      painting: 'Challenging - use flexible paints designed for elastomers.',
    },
    safety: {
      fumes: { level: 'Low', notes: 'Generally low emissions with good ventilation.' },
      foodSafety: { rating: 'Some Grades', notes: 'Medical-grade options available. Verify certification.' },
      biodegradability: { rating: 'Not Biodegradable', notes: 'Petroleum-based polymer.' },
      additionalNotes: [
        'Generally safe with ventilation',
        'Skin-safe for most formulations',
        'Medical grades available for biocompatible applications',
      ],
    },
  },

  'PEBA 95A': {
    name: 'PEBA 95A',
    fullName: 'Polyether Block Amide - Shore 95A',
    origin: {
      yearInvented: '1981 (PEBA), 2020s (3D printing grades)',
      originalCompany: 'Arkema (Pebax brand)',
      keyMilestones: [
        '1981: Arkema commercializes Pebax brand PEBA',
        '2019: Nike Vaporfly controversy highlights PEBA technology',
        '2020+: PEBA 95A filaments emerge for 3D printing',
      ],
      majorManufacturers: ['Arkema (Pebax)', 'Evonik (Vestamid E)', 'Lubrizol', 'Recreus'],
    },
    composition: {
      basePolymer: 'Polyamide-polyether block copolymer',
      chemicalFamily: 'Polyether Block Amide Elastomer',
      keyAdditives: ['Antioxidants', 'UV stabilizers', 'Processing aids'],
      coloringAgents: 'Available in natural (translucent) and various colors',
      specialFillers: ['Generally unfilled for maximum energy return'],
    },
    familyContext: {
      parentPolymer: 'PEBA (Polyether Block Amide)',
      variants: ['PEBA 85A (soft)', 'PEBA 95A (medium)', 'PEBA Air (ultra-light foamed)'],
      chemicalComparison: 'Medium firmness PEBA. Comparable to standard TPU but with superior energy return.',
      evolution: 'Standard hardness grade bridging soft and firm PEBA offerings.',
    },
    strengths: {
      uniqueProperties: ['Exceptional energy return (>90%)', 'Balanced flexibility and support', 'Ultra-lightweight', 'Excellent durability', 'Wide temperature range'],
      bestUseScenarios: ['Athletic footwear', 'Mechanical springs', 'Energy-return applications', 'Responsive padding'],
      advantagesOverCompetitors: ['Superior energy return vs TPU 95A', 'Lighter weight', 'Better fatigue resistance', 'Maintains properties in cold'],
      whyChooseThis: 'When you need responsive, springy behavior with moderate firmness and maximum energy return.',
    },
    weaknesses: {
      limitations: ['Very expensive', 'Limited filament suppliers', 'Moisture sensitive', 'Difficult to print well'],
      commonProblems: ['Requires thorough drying', 'Stringing common', 'Direct drive required', 'High cost per kg'],
      environmentalConcerns: ['Petroleum-based', 'Not biodegradable', 'Complex recycling'],
      whenNotToUse: ['Budget-constrained projects', 'When standard TPU works', 'Bowden extruder setups'],
    },
    practicalContext: {
      industryAdoption: ['Athletic footwear', 'Sports equipment', 'Prosthetics', 'Automotive'],
      commonApplications: ['Running shoe plates/midsoles', 'Ski boot components', 'Shock absorbers', 'Responsive grips'],
      safetyStandards: ['Medical grades available', 'Skin-contact certified'],
      costPosition: 'Industrial',
    },
    trivia: {
      funFacts: [
        'PEBA 95A is the workhorse grade - firm enough for structure, soft enough for comfort',
        'Many marathon world records have been set on PEBA 95A-based shoe technology',
        'The "springy" feel of modern running shoes often comes from PEBA at this hardness',
      ],
      whyInvented: 'Created as optimal balance point between cushioning comfort and responsive energy return.',
      controversies: [
        'Performance advantage over traditional foams sparked athletic regulation debates',
        'High cost creates accessibility concerns in competitive sports',
      ],
      marketAdoption: 'Growing adoption in athletic footwear. Very limited in 3D printing due to cost and difficulty.',
    },
    tdsProfile: {
      properties: [
        { name: 'Shore Hardness', value: '95A', unit: '', implications: 'Medium firmness. More supportive than 85A while retaining good flexibility.' },
        { name: 'Density', value: '1.00-1.02', unit: 'g/cm³', implications: 'Ultra-lightweight engineering elastomer.' },
        { name: 'Tensile Strength', value: '35-50', unit: 'MPa', implications: 'Excellent strength for an elastomer.' },
        { name: 'Elongation at Break', value: '400-550', unit: '%', implications: 'High elasticity with excellent recovery.' },
        { name: 'Energy Return', value: '>90', unit: '%', implications: 'Exceptional - the defining characteristic of PEBA.' },
        { name: 'Compression Set', value: '<15', unit: '%', implications: 'Outstanding shape retention after repeated compression.' },
      ],
      notes: 'Optimal balance of firmness and energy return. Superior to TPU 95A in performance metrics.',
    },
    printSettings: {
      nozzleTemp: { min: 220, max: 255, optimal: 240 },
      bedTemp: { min: 55, max: 85, optimal: 70 },
      coolingFan: { min: 20, max: 50, notes: 'Moderate cooling for stringing control.' },
      enclosure: { required: false, notes: 'Helpful but not essential.' },
      drying: { temp: 70, duration: '6-8 hours', notes: 'Moisture sensitive - thorough drying required.' },
      printSpeed: { recommended: '15-30 mm/s', notes: 'Slow speeds. Direct drive extruder required.' },
      additionalNotes: [
        'DIRECT DRIVE EXTRUDER REQUIRED',
        'Minimal retraction (0.5-2mm)',
        'Constrained filament path essential',
        'Print from dry box for best results',
        'Expect tuning required - material behaves differently than TPU',
      ],
    },
    adhesion: {
      bedSurfaces: {
        excellent: ['Glass with glue stick', 'PEI (textured) with glue'],
        good: ['Blue tape', 'BuildTak'],
        poor: ['Smooth PEI (adhesion issues)'],
      },
      releaseAgents: 'Glue stick recommended for consistent adhesion and release.',
      multiMaterial: [
        { material: 'Nylon', bondQuality: 'Strong Chemical Bond', notes: 'Excellent adhesion due to polyamide backbone.' },
        { material: 'TPU', bondQuality: 'Mechanical Bond', notes: 'Good for flexible-flexible combinations.' },
        { material: 'PLA', bondQuality: 'Weak Bond', notes: 'Minimal adhesion.' },
      ],
    },
    postProcessing: {
      chemicalSmoothing: [
        { method: 'Chemical', effectiveness: 'Difficult', notes: 'Solvent resistant - not practical.' },
      ],
      mechanical: ['Difficult to sand', 'Trim with sharp tools', 'Heat welding possible'],
      glues: ['Cyanoacrylate with activator', 'Contact adhesive', 'Epoxy'],
      painting: 'Use flexible paints or elastomer-specific coatings.',
    },
    safety: {
      fumes: { level: 'Low', notes: 'Low emissions with adequate ventilation.' },
      foodSafety: { rating: 'Some Grades', notes: 'Medical-grade options available.' },
      biodegradability: { rating: 'Not Biodegradable', notes: 'Petroleum-based.' },
      additionalNotes: [
        'Safe with normal ventilation',
        'Skin-safe formulations available',
        'Medical grades for biocompatible applications',
      ],
    },
  },

  'PEBA Air': {
    name: 'PEBA Air',
    fullName: 'Foamed Polyether Block Amide',
    origin: {
      yearInvented: '2010s (foamed PEBA technology)',
      originalCompany: 'Arkema (Pebax Powered) and athletic footwear companies',
      keyMilestones: [
        '2017: Nike introduces ZoomX (foamed Pebax) in Vaporfly',
        '2019: Kipchoge breaks 2-hour marathon barrier in Pebax-based shoes',
        '2021+: Foamed PEBA concept extends to 3D printing experimentation',
      ],
      majorManufacturers: ['Arkema (Pebax Powered)', 'Athletic brand proprietary variants'],
    },
    composition: {
      basePolymer: 'Polyamide-polyether block copolymer (foamed)',
      chemicalFamily: 'Foamed Polyether Block Amide Elastomer',
      keyAdditives: ['Foaming agents', 'Cell structure stabilizers', 'UV stabilizers'],
      coloringAgents: 'Typically white or light colors (foam structure limits pigmentation)',
      specialFillers: ['None - foam structure provides properties'],
    },
    familyContext: {
      parentPolymer: 'PEBA (Polyether Block Amide)',
      variants: ['ZoomX (Nike)', 'Pebax Powered (Arkema)', 'Various brand-specific formulations'],
      chemicalComparison: 'Same chemistry as solid PEBA but foamed for extreme lightweight. Trades some durability for weight savings.',
      evolution: 'Revolutionary application of PEBA in supercritical foam form for maximum energy return at minimum weight.',
    },
    strengths: {
      uniqueProperties: ['Ultra-lightweight (30-50% lighter than solid)', 'Exceptional energy return', 'Superior cushioning', 'Responsive springy feel', 'Wide temp range'],
      bestUseScenarios: ['Ultra-lightweight cushioning', 'Racing footwear concepts', 'Weight-critical flexible parts', 'Energy-absorbing applications'],
      advantagesOverCompetitors: ['Lightest high-performance elastomer available', 'Best energy-to-weight ratio', 'Unmatched cushioning efficiency'],
      whyChooseThis: 'When absolute minimum weight with maximum energy return is critical and cost is secondary.',
    },
    weaknesses: {
      limitations: ['Extremely expensive', 'Very limited/experimental availability', 'Lower durability than solid PEBA', 'Complex to produce', 'Experimental in 3D printing'],
      commonProblems: ['Foam structure challenging to replicate in FDM', 'Wear faster than solid', 'Limited suppliers', 'Premium pricing'],
      environmentalConcerns: ['Petroleum-based', 'Not biodegradable', 'Complex manufacturing process'],
      whenNotToUse: ['Durability-critical applications', 'Abrasive wear conditions', 'Budget projects', 'Standard printing (requires specialized equipment)'],
    },
    practicalContext: {
      industryAdoption: ['Elite athletic footwear', 'Racing equipment', 'Experimental/R&D'],
      commonApplications: ['Marathon racing shoe midsoles', 'Elite athletic footwear', 'Ultra-light padding'],
      safetyStandards: ['Skin-contact safe', 'Athletic certification standards'],
      costPosition: 'Industrial',
    },
    trivia: {
      funFacts: [
        'Nike ZoomX (foamed Pebax) helped Kipchoge break the 2-hour marathon barrier',
        'Foamed PEBA can be up to 50% lighter than solid while maintaining energy return',
        'The material is called "super foam" and has revolutionized competitive running',
        'Creating consistent foam structure is extremely difficult - injection molded, not easily 3D printed',
        'World Athletics had to create new regulations specifically because of PEBA foam technology',
      ],
      whyInvented: 'Developed to push the boundaries of lightweight energy return for competitive athletics.',
      controversies: [
        'Accused of being "technological doping" in competitive running',
        'Sparked major debate about equipment vs athlete performance',
        'World Athletics imposed stack height limits partly due to PEBA foam advantages',
        'Accessibility concerns - elite shoes with PEBA foam cost $250+ per pair',
      ],
      marketAdoption: 'Dominant in elite running footwear. Essentially non-existent in 3D printing - foam structure requires specialized manufacturing.',
    },
    tdsProfile: {
      properties: [
        { name: 'Density', value: '0.15-0.25', unit: 'g/cm³', implications: 'Extremely lightweight - foam structure dramatically reduces density.' },
        { name: 'Energy Return', value: '>85', unit: '%', implications: 'Exceptional despite foam structure. Slightly lower than solid PEBA but at fraction of weight.' },
        { name: 'Compression Set', value: '<25', unit: '%', implications: 'Good shape retention but foam degrades faster than solid.' },
        { name: 'Cell Structure', value: 'Closed-cell', unit: '', implications: 'Consistent energy return, moisture resistant.' },
        { name: 'Temperature Range', value: '-30 to +50', unit: '°C', implications: 'Maintains properties across wide temp range.' },
        { name: 'Durability', value: '300-500', unit: 'km (running)', implications: 'Lower than solid PEBA. Racing shoes typically 300-500km lifespan.' },
      ],
      notes: 'Foam structure trades some durability for extreme weight reduction. Not truly available as 3D printing filament - included for reference.',
    },
    printSettings: {
      nozzleTemp: { min: 220, max: 250, optimal: 235 },
      bedTemp: { min: 50, max: 75, optimal: 60 },
      coolingFan: { min: 30, max: 60, notes: 'Moderate cooling if solid PEBA printed to simulate foam.' },
      enclosure: { required: false, notes: 'N/A for true foamed PEBA - requires specialized manufacturing.' },
      drying: { temp: 65, duration: '6 hours', notes: 'If printing solid PEBA with foam-inspired design.' },
      printSpeed: { recommended: '15-25 mm/s', notes: 'For solid PEBA. True foam not FDM printable.' },
      additionalNotes: [
        'TRUE FOAMED PEBA CANNOT BE 3D PRINTED via FDM',
        'Requires supercritical foam injection molding process',
        'Lattice structures in solid PEBA can approximate some foam benefits',
        'Included for reference - represents theoretical ideal for lightweight flex',
        'Research ongoing into direct foam 3D printing methods',
      ],
    },
    adhesion: {
      bedSurfaces: {
        excellent: ['N/A - specialized manufacturing'],
        good: ['See solid PEBA for reference'],
        poor: ['N/A'],
      },
      releaseAgents: 'N/A for foam production. See solid PEBA grades for printable alternatives.',
      multiMaterial: [
        { material: 'Solid PEBA', bondQuality: 'Strong Chemical Bond', notes: 'Same polymer family.' },
        { material: 'Nylon', bondQuality: 'Strong Chemical Bond', notes: 'Polyamide compatibility.' },
        { material: 'TPU', bondQuality: 'Mechanical Bond', notes: 'Can be used in combination.' },
      ],
    },
    postProcessing: {
      chemicalSmoothing: [
        { method: 'N/A', effectiveness: 'Not Possible', notes: 'Foam structure - not applicable.' },
      ],
      mechanical: ['Foam does not sand well', 'Can be trimmed', 'Limited post-processing options'],
      glues: ['Contact adhesive', 'Cyanoacrylate can damage foam structure'],
      painting: 'Not typically painted - foam structure and function are primary.',
    },
    safety: {
      fumes: { level: 'Low', notes: 'Standard PEBA emissions - foam production in industrial settings.' },
      foodSafety: { rating: 'Not Applicable', notes: 'Not used in food contact applications.' },
      biodegradability: { rating: 'Not Biodegradable', notes: 'Petroleum-based polymer foam.' },
      additionalNotes: [
        'Foam production requires industrial equipment',
        'Safe for skin contact in finished products',
        'Athletic footwear applications extensively tested',
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

  'PLA-Temp': {
    name: 'PLA-Temp',
    fullName: 'Temperature-Sensitive / Thermochromic Polylactic Acid',
    origin: {
      yearInvented: '2015-2016',
      originalCompany: 'Multiple manufacturers (Amolen, SUNLU, Eryone)',
      keyMilestones: [
        '2015: First thermochromic PLA filaments appear',
        '2016: Color-change temperature ranges expand',
        '2018: Multiple temperature thresholds available',
        '2020+: Improved color vibrancy and transition sharpness',
      ],
      majorManufacturers: ['Amolen', 'SUNLU', 'Eryone', 'TTYT3D', 'Gizmo Dorks', 'MIKA3D'],
    },
    composition: {
      basePolymer: 'Polylactic Acid',
      chemicalFamily: 'Polyester (Bio-based) with thermochromic additives',
      keyAdditives: ['Thermochromic pigments', 'Leuco dyes', 'Temperature-sensitive microcapsules'],
      coloringAgents: 'Leuco dye systems that change color with temperature',
      specialFillers: ['Microencapsulated thermochromic compounds'],
    },
    familyContext: {
      parentPolymer: 'PLA with temperature-responsive color-change additives',
      variants: ['Cold-activated', 'Warm-activated', 'Body-heat responsive', 'Multi-stage color change'],
      chemicalComparison: 'Standard PLA with leuco dye microcapsules that switch between colored and colorless states.',
      evolution: 'From novelty to practical applications in temperature indication.',
    },
    strengths: {
      uniqueProperties: ['Changes color with temperature', 'Reversible and repeatable', 'Touch-responsive', 'Temperature indicator', 'Interactive prints'],
      bestUseScenarios: ['Temperature indicators', 'Interactive toys', 'Hot/cold drink indicators', 'Mood rings/jewelry', 'Educational demonstrations'],
      advantagesOverCompetitors: ['No electronics needed', 'Instant visual feedback', 'Works indefinitely', 'Fun and functional'],
      whyChooseThis: 'When you want prints that visually respond to temperature changes.',
    },
    weaknesses: {
      limitations: ['Color options limited', 'Effect can fade over time', 'Not for high-temp applications', 'More expensive', 'Temperature range is fixed per filament'],
      commonProblems: ['Effect weakens with heavy use', 'Transition temperature varies by batch', 'Some colors less vibrant'],
      environmentalConcerns: ['Thermochromic additives not biodegradable', 'Difficult to recycle'],
      whenNotToUse: ['Permanent color needed', 'Temperatures above 60°C', 'Professional/precise applications'],
    },
    practicalContext: {
      industryAdoption: ['Novelty products', 'Educational tools', 'Consumer goods prototypes'],
      commonApplications: ['Baby bottle temperature indicators', 'Coffee cup sleeves', 'Interactive toys', 'Thermometer housings', 'Mood jewelry'],
      safetyStandards: ['Generally safe', 'Not food safe due to additives'],
      costPosition: 'Premium',
    },
    trivia: {
      funFacts: [
        'The same technology is used in mood rings since the 1970s',
        'Leuco dyes work by molecular structure changes at specific temperatures',
        'You can get filaments that change at body temperature (31°C) for touch effects',
        'Cold drinks make the color appear, warm drinks make it disappear (or vice versa)',
        'Some filaments have multiple color stages at different temperatures',
      ],
      whyInvented: 'Create interactive, temperature-responsive objects for novelty and functional indication.',
      controversies: ['Longevity claims vary widely', 'Some brands fade quickly'],
      marketAdoption: 'Popular niche for novelty and educational applications.',
    },
    tdsProfile: {
      properties: [
        { name: 'Tensile Strength', value: '38-48', unit: 'MPa', implications: 'Slightly lower than pure PLA.' },
        { name: 'Elongation at Break', value: '3-6', unit: '%', implications: 'Standard PLA brittleness.' },
        { name: 'Activation Temperature', value: '25-45', unit: '°C', implications: 'Varies by product - check specifications.' },
        { name: 'Color Transition Range', value: '3-8', unit: '°C', implications: 'Temperature span over which color changes.' },
        { name: 'Heat Deflection', value: '50-55', unit: '°C', implications: 'Standard PLA - avoid exceeding this.' },
      ],
      notes: 'Activation temperature varies by product. Common ranges: 22°C, 31°C (body temp), 33°C, 45°C.',
    },
    printSettings: {
      nozzleTemp: { min: 185, max: 215, optimal: 200 },
      bedTemp: { min: 45, max: 60, optimal: 50 },
      coolingFan: { min: 80, max: 100, notes: 'Good cooling helps preserve thermochromic properties.' },
      enclosure: { required: false, notes: 'Not needed - avoid excess heat.' },
      drying: { temp: 40, duration: '4-6 hours', notes: 'Lower temp to protect thermochromic compounds.' },
      printSpeed: { recommended: '40-55 mm/s', notes: 'Moderate speeds work well.' },
      additionalNotes: [
        'Print at LOWER temperatures than standard PLA to preserve effect',
        'Excessive heat during printing can damage thermochromic compounds',
        'Test color change immediately after printing',
        'Store away from heat sources',
        'Avoid post-processing with heat (heat guns, annealing)',
      ],
    },
    adhesion: {
      bedSurfaces: {
        excellent: ['PEI (lower temp)', 'Glass with glue stick'],
        good: ['Blue painters tape', 'BuildTak'],
        poor: ['Overheated beds'],
      },
      releaseAgents: 'Standard PLA release methods at lower temps.',
      multiMaterial: [
        { material: 'PLA', bondQuality: 'Strong Chemical Bond', notes: 'Good compatibility.' },
        { material: 'PLA+', bondQuality: 'Strong Chemical Bond', notes: 'Works well together.' },
      ],
    },
    postProcessing: {
      chemicalSmoothing: [{ method: 'Not recommended', effectiveness: 'Not Possible', notes: 'Chemicals may damage thermochromic compounds.' }],
      mechanical: ['Light sanding only', 'No heat treatment'],
      painting: 'Clear coat only - paint blocks temperature sensing.',
      glues: ['CA glue', 'Epoxy (room temp cure)', 'Avoid hot glue'],
    },
    safety: {
      fumes: { level: 'Very Low', notes: 'Standard PLA emissions.' },
      foodSafety: { rating: 'Not Safe', notes: 'Thermochromic additives not food safe.' },
      biodegradability: { rating: 'Partially Compostable', notes: 'PLA base compostable, additives may not be.' },
      additionalNotes: [
        'Safe for normal handling',
        'Not for food contact applications',
        'Keep away from sustained heat',
      ],
    },
  },

  'PLA-Meta': {
    name: 'PLA-Meta',
    fullName: 'Metallic Pearlescent Polylactic Acid',
    origin: {
      yearInvented: '2017-2018',
      originalCompany: 'Multiple manufacturers (Polymaker, 3D-Fuel, ERYONE)',
      keyMilestones: [
        '2017: First metallic PLA filaments with pearl/chrome effects',
        '2018: Multiple brands launch "Meta" and "Metallic Pearl" lines',
        '2020: Advanced multi-layer metallic effects developed',
        '2022+: Refined formulations with smoother finish and better printability',
      ],
      majorManufacturers: ['Polymaker', '3D-Fuel', 'ERYONE', 'Sunlu', 'eSUN', 'Overture'],
    },
    composition: {
      basePolymer: 'Polylactic Acid (PLA)',
      chemicalFamily: 'Aliphatic Polyester',
      keyAdditives: ['Metallic pearlescent pigments', 'Aluminum flakes', 'Mica particles', 'Pearl effect compounds'],
      coloringAgents: 'Metallic and interference pigments that create color-shifting effects',
      specialFillers: ['Micro-mica particles', 'Reflective platelets', 'Pearlescent powders'],
    },
    familyContext: {
      parentPolymer: 'Standard PLA with pearlescent/metallic additives',
      variants: ['Chrome PLA', 'Pearl PLA', 'Metallic Silk', 'Rainbow Meta'],
      chemicalComparison: 'Standard PLA matrix with embedded metallic/pearl particles that create light-reflecting surfaces.',
      evolution: 'Evolved from basic metallic PLA to sophisticated multi-effect formulations with improved flow.',
    },
    strengths: {
      uniqueProperties: ['Stunning metallic sheen', 'Color-shifting iridescent effects', 'Smooth surface finish', 'Light-catching visual appeal'],
      bestUseScenarios: ['Display models', 'Decorative items', 'Jewelry and accessories', 'Art sculptures', 'Show pieces'],
      advantagesOverCompetitors: ['More sophisticated than basic silk PLA', 'Deeper metallic effects', 'Professional appearance', 'Easier to print than true metal filaments'],
      whyChooseThis: 'For premium visual impact with metallic/pearl effects that catch light from multiple angles.',
    },
    weaknesses: {
      limitations: ['Purely decorative - no mechanical advantages', 'Metallic particles can cause minor nozzle wear', 'Surface scratches more visible', 'Higher cost than standard PLA'],
      commonProblems: ['Inconsistent metallic effect at varying layer heights', 'Flow issues with heavily loaded formulations', 'Visible layer lines can disrupt metallic look'],
      environmentalConcerns: ['Metallic additives may affect compostability', 'Mica mining environmental impact', 'Recycling complications'],
      whenNotToUse: ['Functional mechanical parts', 'Parts requiring post-processing', 'Food contact applications', 'Outdoor UV exposure'],
    },
    practicalContext: {
      industryAdoption: ['Consumer 3D printing', 'Art and design', 'Jewelry prototyping', 'Decorative manufacturing'],
      commonApplications: ['Display models', 'Vases and decor', 'Jewelry', 'Art pieces', 'Show models', 'Award trophies'],
      safetyStandards: ['Standard PLA safety', 'Not food safe due to metallic additives'],
      costPosition: 'Premium',
    },
    trivia: {
      funFacts: [
        'The metallic effect comes from flat mica or aluminum particles aligning during extrusion',
        'Different viewing angles produce different color intensities',
        'The "Meta" name refers to the metamorphic color-changing properties',
        'Originally inspired by automotive metallic paint finishes',
      ],
      whyInvented: 'To bring premium metallic finishes to 3D printing without using actual metal filaments.',
      controversies: [
        'Some "metallic" PLAs are just silk with marketing',
        'True metallic content vs. pearlescent-only debate',
        'Potential for minor nozzle wear with aluminum-containing versions',
      ],
      marketAdoption: 'Popular in the decorative and hobby printing segment for eye-catching display pieces.',
    },
    tdsProfile: {
      properties: [
        { name: 'Tensile Strength', value: '45-55', unit: 'MPa', implications: 'Slightly below standard PLA due to additives.' },
        { name: 'Elongation at Break', value: '3-6', unit: '%', implications: 'Brittle like standard PLA.' },
        { name: 'Glass Transition', value: '55-60', unit: '°C', implications: 'Standard PLA heat resistance.' },
        { name: 'Metallic Content', value: '1-5', unit: '%', implications: 'Enough for visual effect without printing issues.' },
        { name: 'Surface Gloss', value: 'High', unit: '', implications: 'Reflective metallic sheen.' },
      ],
      notes: 'Metallic effect best visible at 0.2mm layer height or below with moderate speeds.',
    },
    printSettings: {
      nozzleTemp: { min: 200, max: 220, optimal: 210 },
      bedTemp: { min: 50, max: 70, optimal: 60 },
      coolingFan: { min: 50, max: 100, notes: 'Standard cooling. Lower fan for better layer adhesion and metallic continuity.' },
      enclosure: { required: false, notes: 'Not required.' },
      drying: { temp: 50, duration: '4 hours', notes: 'Standard PLA drying if needed.' },
      printSpeed: { recommended: '40-60 mm/s', notes: 'Moderate speed for best surface finish and metallic effect.' },
      additionalNotes: [
        'Use 0.4mm or larger nozzle',
        'Lower layer heights (0.1-0.2mm) maximize metallic effect',
        'Avoid excessive retractions',
        'Print at moderate speeds for best finish',
      ],
    },
    adhesion: {
      bedSurfaces: {
        excellent: ['PEI', 'Glass with glue stick', 'BuildTak'],
        good: ['Blue tape', 'Textured PEI'],
        poor: ['Bare glass', 'Polypropylene'],
      },
      releaseAgents: 'Standard PLA release methods.',
      multiMaterial: [
        { material: 'PLA', bondQuality: 'Strong Chemical Bond', notes: 'Excellent compatibility.' },
        { material: 'PLA+', bondQuality: 'Strong Chemical Bond', notes: 'Works well together.' },
        { material: 'PVA', bondQuality: 'Mechanical Bond', notes: 'Good for supports.' },
      ],
    },
    postProcessing: {
      chemicalSmoothing: [{ method: 'Not recommended', effectiveness: 'Not Possible', notes: 'May damage metallic finish.' }],
      mechanical: ['Very light sanding only', 'Polishing can enhance shine', 'Avoid aggressive sanding'],
      painting: 'Generally not painted - defeats the purpose. Clear coat can enhance effect.',
      glues: ['CA glue', 'Epoxy', 'PLA-specific adhesives'],
    },
    safety: {
      fumes: { level: 'Very Low', notes: 'Standard PLA emissions.' },
      foodSafety: { rating: 'Not Safe', notes: 'Metallic additives not food safe.' },
      biodegradability: { rating: 'Partially Compostable', notes: 'PLA base compostable, metallic additives may not be.' },
      additionalNotes: [
        'Safe for normal handling',
        'Not for food contact',
        'Standard PLA safety profile',
      ],
    },
  },

  'PLA-Iridescent': {
    name: 'PLA-Iridescent',
    fullName: 'Iridescent Color-Shifting Polylactic Acid',
    origin: {
      yearInvented: '2018-2019',
      originalCompany: 'Multiple manufacturers (TTYT3D, Eryone, CC3D)',
      keyMilestones: [
        '2018: First rainbow/iridescent PLA filaments appear',
        '2019: "Unicorn" and "Rainbow" PLA lines become popular',
        '2020: Multi-color iridescent formulations refined',
        '2022+: Advanced holographic and prismatic variants developed',
      ],
      majorManufacturers: ['TTYT3D', 'Eryone', 'CC3D', 'Sunlu', 'Geeetech', 'MIKA3D'],
    },
    composition: {
      basePolymer: 'Polylactic Acid (PLA)',
      chemicalFamily: 'Aliphatic Polyester',
      keyAdditives: ['Iridescent pigments', 'Interference mica', 'Dichroic particles', 'Color-shifting compounds'],
      coloringAgents: 'Multi-layer interference pigments that reflect different wavelengths at different angles',
      specialFillers: ['Micro-layered mica', 'Thin-film interference particles', 'Prismatic additives'],
    },
    familyContext: {
      parentPolymer: 'Standard PLA with optical interference additives',
      variants: ['Rainbow PLA', 'Unicorn PLA', 'Holographic PLA', 'Prismatic PLA', 'Chameleon PLA'],
      chemicalComparison: 'PLA matrix with embedded particles that use thin-film interference to create color-shifting effects.',
      evolution: 'Developed from pearl/metallic filaments to create more dramatic color-shifting and rainbow effects.',
    },
    strengths: {
      uniqueProperties: ['Dramatic color-shifting effects', 'Rainbow/holographic appearance', 'Eye-catching visual appeal', 'Unique "unicorn" aesthetic'],
      bestUseScenarios: ['Fantasy models', 'Decorative items', 'Art projects', 'Children\'s toys (non-food)', 'Display pieces', 'Cosplay accessories'],
      advantagesOverCompetitors: ['More dramatic than metallic PLA', 'True color-shifting rather than single-color shine', 'Whimsical aesthetic appeal', 'Great for fantasy/magical themes'],
      whyChooseThis: 'For maximum visual impact with rainbow/holographic color-shifting effects that mesmerize viewers.',
    },
    weaknesses: {
      limitations: ['Purely decorative material', 'Inconsistent effect visibility', 'Can appear garish in professional settings', 'Higher cost'],
      commonProblems: ['Color effect varies with print orientation', 'Layer lines can disrupt iridescence', 'Effect less visible on small details'],
      environmentalConcerns: ['Specialty pigments may affect recyclability', 'Unknown compostability of iridescent additives'],
      whenNotToUse: ['Professional/corporate settings', 'Functional parts', 'Food contact', 'Subtle aesthetics needed'],
    },
    practicalContext: {
      industryAdoption: ['Hobby printing', 'Art and craft', 'Toy prototyping', 'Cosplay community'],
      commonApplications: ['Fantasy figurines', 'Unicorn/dragon models', 'Children\'s decor', 'Art sculptures', 'Cosplay props', 'Jewelry'],
      safetyStandards: ['Standard PLA safety', 'Not food safe'],
      costPosition: 'Premium',
    },
    trivia: {
      funFacts: [
        'The iridescent effect mimics how butterfly wings and soap bubbles create color',
        'Uses the same optical principle as oil slicks on water',
        'The "unicorn" name comes from the magical, fantasy-like appearance',
        'Color-shifting occurs because different wavelengths reflect at different angles',
      ],
      whyInvented: 'Created to bring magical, fantasy-like color effects to 3D printed objects.',
      controversies: [
        'Inconsistent quality between manufacturers',
        'Some products are just weak pearl effects marketed as iridescent',
        'Debate over "true" iridescence vs. multi-color shimmer',
      ],
      marketAdoption: 'Very popular in the hobby and craft community, especially for fantasy and children\'s themes.',
    },
    tdsProfile: {
      properties: [
        { name: 'Tensile Strength', value: '40-50', unit: 'MPa', implications: 'Below standard PLA due to heavy additives.' },
        { name: 'Elongation at Break', value: '3-5', unit: '%', implications: 'Brittle like standard PLA.' },
        { name: 'Glass Transition', value: '55-60', unit: '°C', implications: 'Standard PLA heat properties.' },
        { name: 'Iridescent Particle Load', value: '3-8', unit: '%', implications: 'Higher loading = more effect but harder to print.' },
        { name: 'Color Shift Angle', value: '15-45', unit: 'degrees', implications: 'Angle at which color change becomes visible.' },
      ],
      notes: 'Print at slight angles to flat surfaces to maximize iridescent visibility.',
    },
    printSettings: {
      nozzleTemp: { min: 200, max: 225, optimal: 210 },
      bedTemp: { min: 50, max: 70, optimal: 60 },
      coolingFan: { min: 50, max: 100, notes: 'Standard cooling works well.' },
      enclosure: { required: false, notes: 'Not required.' },
      drying: { temp: 50, duration: '4 hours', notes: 'Standard PLA drying if needed.' },
      printSpeed: { recommended: '40-60 mm/s', notes: 'Moderate speeds for best surface quality.' },
      additionalNotes: [
        'Use 0.4mm nozzle minimum',
        'Curved surfaces show effect better than flat',
        'Consider print orientation for maximum effect visibility',
        'Vase mode enhances iridescence on vessels',
      ],
    },
    adhesion: {
      bedSurfaces: {
        excellent: ['PEI', 'Glass with adhesive', 'BuildTak'],
        good: ['Blue tape', 'Textured PEI'],
        poor: ['Bare glass', 'PP tape'],
      },
      releaseAgents: 'Standard PLA release methods.',
      multiMaterial: [
        { material: 'PLA', bondQuality: 'Strong Chemical Bond', notes: 'Good compatibility with standard PLA.' },
        { material: 'PVA', bondQuality: 'Mechanical Bond', notes: 'Suitable for dissolvable supports.' },
      ],
    },
    postProcessing: {
      chemicalSmoothing: [{ method: 'Not recommended', effectiveness: 'Not Possible', notes: 'Destroys iridescent effect.' }],
      mechanical: ['Very light sanding', 'Buffing can help', 'Avoid heavy abrasion'],
      painting: 'Not recommended - defeats the purpose of iridescent material.',
      glues: ['CA glue', 'Epoxy', 'Hot glue at low temp'],
    },
    safety: {
      fumes: { level: 'Very Low', notes: 'Standard PLA emissions.' },
      foodSafety: { rating: 'Not Safe', notes: 'Iridescent additives not food safe.' },
      biodegradability: { rating: 'Partially Compostable', notes: 'PLA portion compostable, additives unknown.' },
      additionalNotes: [
        'Safe for normal handling',
        'Not suitable for food contact',
        'Keep away from young children who might mouth objects',
      ],
    },
  },

  'HTPLA-CF': {
    name: 'HTPLA-CF',
    fullName: 'High Temperature PLA - Carbon Fiber Reinforced',
    origin: {
      yearInvented: '2019-2020',
      originalCompany: 'Proto-pasta, Polymaker',
      keyMilestones: [
        '2017: HTPLA (heat treatable PLA) introduced',
        '2019: First HTPLA-CF combining heat treatment with carbon fiber',
        '2020: Multiple manufacturers adopt HTPLA-CF formulations',
        '2022+: Refined formulations with better annealing characteristics',
      ],
      majorManufacturers: ['Proto-pasta', 'Polymaker', '3DXTech', 'ColorFabb', 'Fiberlogy'],
    },
    composition: {
      basePolymer: 'Modified Polylactic Acid with crystallization enhancers',
      chemicalFamily: 'Aliphatic Polyester (Semi-crystalline after annealing)',
      keyAdditives: ['Chopped carbon fibers (10-20%)', 'Nucleating agents', 'Crystallization promoters', 'Heat stabilizers'],
      coloringAgents: 'Typically black/dark gray from carbon fiber',
      specialFillers: ['Milled carbon fiber', 'Chopped carbon strands', 'Carbon powder'],
    },
    familyContext: {
      parentPolymer: 'HTPLA (Heat Treatable PLA) + Carbon Fiber',
      variants: ['HTPLA-CF (standard)', 'HTPLA-CF HT (extra high temp)', 'CF-HTPLA Pro'],
      chemicalComparison: 'Combines HTPLA\'s crystallization capability with carbon fiber reinforcement for maximum rigidity and heat resistance.',
      evolution: 'Merger of two PLA enhancement technologies: heat treatment and fiber reinforcement.',
    },
    strengths: {
      uniqueProperties: ['Extreme stiffness after annealing', 'Heat resistance up to 140°C+', 'Dimensional stability', 'Professional matte finish'],
      bestUseScenarios: ['Functional parts requiring heat resistance', 'Structural components', 'Jigs and fixtures', 'Drone frames', 'RC components'],
      advantagesOverCompetitors: ['Easier to print than ABS-CF or Nylon-CF', 'Better heat resistance than standard PLA-CF', 'Bio-based polymer option', 'No warping during print'],
      whyChooseThis: 'For functional parts needing both carbon fiber stiffness AND heat resistance beyond standard PLA.',
    },
    weaknesses: {
      limitations: ['Requires post-print annealing', 'Parts shrink during annealing (design compensation needed)', 'Abrasive to brass nozzles', 'Brittle, low impact resistance'],
      commonProblems: ['Dimensional changes during annealing', 'Warping if annealed improperly', 'Nozzle wear without hardened nozzle', 'Surface defects from poor fiber distribution'],
      environmentalConcerns: ['Carbon fiber not recyclable', 'Composite material disposal challenges', 'Energy use for annealing'],
      whenNotToUse: ['Impact-critical parts', 'Parts requiring flexibility', 'Without hardened nozzle', 'Tight-tolerance parts without compensation'],
    },
    practicalContext: {
      industryAdoption: ['Aerospace prototyping', 'Automotive tooling', 'Industrial fixtures', 'Drone manufacturing'],
      commonApplications: ['Drone frames and arms', 'Camera mounts', 'Jigs and fixtures', 'Structural brackets', 'Heat-exposed components'],
      safetyStandards: ['Industrial use', 'Heat-resistant applications', 'Structural prototyping'],
      costPosition: 'Premium',
    },
    trivia: {
      funFacts: [
        'Annealing transforms the crystal structure from amorphous to semi-crystalline',
        'Properly annealed HTPLA-CF can outperform some engineering plastics',
        'The carbon fiber helps maintain dimensions during annealing',
        'Some users achieve 150°C+ heat resistance with optimized annealing',
      ],
      whyInvented: 'To create a PLA-based material that can compete with engineering plastics in heat and stiffness.',
      controversies: [
        'Debate over whether it truly matches engineering plastic performance',
        'Annealing process inconsistency between users',
        'Questions about long-term creep resistance',
      ],
      marketAdoption: 'Growing adoption in hobbyist drone and RC communities seeking easy-to-print high-performance material.',
    },
    tdsProfile: {
      properties: [
        { name: 'Tensile Strength (annealed)', value: '70-85', unit: 'MPa', implications: 'Excellent strength after heat treatment.' },
        { name: 'Tensile Modulus (annealed)', value: '8000-12000', unit: 'MPa', implications: 'Very high stiffness from CF + crystallization.' },
        { name: 'Heat Deflection (annealed)', value: '120-150', unit: '°C', implications: 'Dramatically improved vs standard PLA.' },
        { name: 'Carbon Fiber Content', value: '10-20', unit: '%', implications: 'Optimal balance of printability and reinforcement.' },
        { name: 'Shrinkage (annealing)', value: '2-5', unit: '%', implications: 'Design compensation required.' },
      ],
      notes: 'Properties vary significantly between as-printed and annealed states. Always anneal for maximum performance.',
    },
    printSettings: {
      nozzleTemp: { min: 210, max: 235, optimal: 220 },
      bedTemp: { min: 55, max: 75, optimal: 65 },
      coolingFan: { min: 30, max: 70, notes: 'Moderate cooling. Too much cooling weakens layer bonds before annealing.' },
      enclosure: { required: false, notes: 'Helpful but not required for printing.' },
      drying: { temp: 55, duration: '4-6 hours', notes: 'Important - moisture affects both printing and annealing.' },
      printSpeed: { recommended: '30-50 mm/s', notes: 'Slower speeds for better fiber distribution and layer adhesion.' },
      additionalNotes: [
        'HARDENED NOZZLE REQUIRED (steel, ruby, tungsten carbide)',
        '0.5mm+ nozzle recommended for fiber flow',
        'Anneal at 80-110°C for 30-60 minutes in oven',
        'Support parts during annealing to prevent warping',
        'Design 2-5% larger to compensate for annealing shrinkage',
      ],
    },
    adhesion: {
      bedSurfaces: {
        excellent: ['PEI', 'Glass with glue', 'Garolite'],
        good: ['Blue tape with glue', 'BuildTak'],
        poor: ['Bare glass', 'PP'],
      },
      releaseAgents: 'Glue stick recommended for easy release.',
      multiMaterial: [
        { material: 'HTPLA', bondQuality: 'Strong Chemical Bond', notes: 'Same base polymer - anneal together.' },
        { material: 'PVA', bondQuality: 'Mechanical Bond', notes: 'Dissolve before annealing.' },
      ],
    },
    postProcessing: {
      chemicalSmoothing: [{ method: 'Not recommended', effectiveness: 'Not Possible', notes: 'Carbon fiber prevents smoothing.' }],
      mechanical: ['Sanding with fine grit', 'Machining possible', 'Drilling and tapping'],
      painting: 'Prime first - carbon fiber surface is porous. Epoxy coating works well.',
      glues: ['Epoxy (strongest)', 'CA glue', 'Structural adhesives'],
    },
    safety: {
      fumes: { level: 'Low', notes: 'Standard PLA plus minor carbon particulates. Ventilation recommended.' },
      foodSafety: { rating: 'Not Safe', notes: 'Carbon fiber not food safe.' },
      biodegradability: { rating: 'Not Biodegradable', notes: 'Carbon fiber prevents composting.' },
      additionalNotes: [
        'Wear gloves when handling raw filament (fiber splinters)',
        'Use dust mask when sanding',
        'Hardened nozzle required to prevent brass contamination',
      ],
    },
  },

  'FlexPLA': {
    name: 'FlexPLA',
    fullName: 'Flexible Polylactic Acid',
    origin: {
      yearInvented: '2016-2017',
      originalCompany: 'Various manufacturers (MadeSolid, 3D-Fuel, ColorFabb)',
      keyMilestones: [
        '2016: First flexible PLA formulations developed',
        '2017: Multiple manufacturers launch FlexPLA lines',
        '2019: Improved formulations with better print characteristics',
        '2021+: Shore hardness range expanded from 85A to 95A',
      ],
      majorManufacturers: ['ColorFabb', '3D-Fuel', 'Polymaker', 'eSUN', 'SUNLU'],
    },
    composition: {
      basePolymer: 'Polylactic Acid copolymer blend',
      chemicalFamily: 'Aliphatic Polyester Copolymer',
      keyAdditives: ['Plasticizers', 'Flexibilizing copolymers', 'Impact modifiers', 'Softening agents'],
      coloringAgents: 'Standard PLA-compatible pigments',
      specialFillers: ['Rubber-like polymers', 'Elastomeric modifiers'],
    },
    familyContext: {
      parentPolymer: 'PLA modified with flexibility additives',
      variants: ['FlexPLA (standard ~95A)', 'FlexPLA Soft (~85A)', 'Semi-Flex PLA (~98A)'],
      chemicalComparison: 'Softer than standard PLA through plasticizers/copolymers, but stiffer than TPU/TPE.',
      evolution: 'Developed to bridge the gap between rigid PLA and flexible TPU for users wanting easier printing.',
    },
    strengths: {
      uniqueProperties: ['Easier to print than TPU', 'Partial flexibility with PLA simplicity', 'Good layer adhesion', 'Works on most printers'],
      bestUseScenarios: ['Phone cases', 'Protective covers', 'Gaskets (light duty)', 'Flexible hinges', 'Bumpers', 'Grips'],
      advantagesOverCompetitors: ['Much easier to print than TPU', 'Works with Bowden extruders', 'No special drying required', 'Lower cost than TPE'],
      whyChooseThis: 'When you need some flexibility but don\'t want to deal with TPU printing challenges.',
    },
    weaknesses: {
      limitations: ['Not as flexible as TPU/TPE', 'Limited elasticity and recovery', 'Lower heat resistance than rigid PLA', 'Less durable than true elastomers'],
      commonProblems: ['Stringing if too hot', 'Can be gummy with poor cooling', 'Not suitable for high-flex applications', 'Limited stretch before permanent deformation'],
      environmentalConcerns: ['Plasticizer additives may affect compostability', 'Modified polymer recyclability unclear'],
      whenNotToUse: ['High-flex applications (use TPU)', 'High-heat environments', 'Applications requiring elastic recovery', 'Repeated flexing cycles'],
    },
    practicalContext: {
      industryAdoption: ['Consumer products', 'Prototyping', 'Hobbyist printing', 'Light industrial'],
      commonApplications: ['Phone cases', 'Cable organizers', 'Bumpers', 'Soft-touch grips', 'Living hinges', 'Protective sleeves'],
      safetyStandards: ['Consumer product use', 'Standard PLA safety profile'],
      costPosition: 'Standard',
    },
    trivia: {
      funFacts: [
        'FlexPLA fills the hardness gap between rigid PLA (Shore 80D) and TPU (Shore 95A)',
        'The "flex" comes from copolymers that disrupt the rigid PLA crystal structure',
        'Some FlexPLA can be used in standard Bowden extruders where TPU fails',
        'Living hinges in FlexPLA can survive hundreds of cycles',
      ],
      whyInvented: 'Created for users who needed flexibility but found TPU too difficult to print.',
      controversies: [
        'Marketing confusion - some "flex" PLAs are barely flexible',
        'Shore hardness often not specified by manufacturers',
        'Durability vs. true elastomers questioned',
      ],
      marketAdoption: 'Popular entry point for flexible printing before graduating to TPU.',
    },
    tdsProfile: {
      properties: [
        { name: 'Shore Hardness', value: '85-98', unit: 'A', implications: 'Semi-flexible, between rigid PLA and soft TPU.' },
        { name: 'Tensile Strength', value: '20-35', unit: 'MPa', implications: 'Lower than rigid PLA due to flexibility.' },
        { name: 'Elongation at Break', value: '150-300', unit: '%', implications: 'Moderate stretch before failure.' },
        { name: 'Glass Transition', value: '45-55', unit: '°C', implications: 'Lower heat resistance than rigid PLA.' },
        { name: 'Elastic Recovery', value: '70-85', unit: '%', implications: 'Partial recovery - not a true elastomer.' },
      ],
      notes: 'Shore hardness varies significantly by manufacturer. Check specifications carefully.',
    },
    printSettings: {
      nozzleTemp: { min: 200, max: 230, optimal: 215 },
      bedTemp: { min: 45, max: 65, optimal: 55 },
      coolingFan: { min: 50, max: 100, notes: 'Good cooling prevents gummy/stringy prints.' },
      enclosure: { required: false, notes: 'Not required.' },
      drying: { temp: 45, duration: '4 hours', notes: 'Less moisture sensitive than TPU but drying helps.' },
      printSpeed: { recommended: '30-50 mm/s', notes: 'Slower than rigid PLA for better quality.' },
      additionalNotes: [
        'Works with most Bowden systems (unlike TPU)',
        'Reduce retraction distance (2-4mm)',
        'Slower retraction speed helps prevent jamming',
        'Direct drive recommended for softest versions',
        'Print cooler if stringing occurs',
      ],
    },
    adhesion: {
      bedSurfaces: {
        excellent: ['PEI', 'Glass with glue stick', 'BuildTak'],
        good: ['Blue tape', 'Textured PEI'],
        poor: ['Bare glass', 'PP tape'],
      },
      releaseAgents: 'Glue stick recommended - FlexPLA can stick too well.',
      multiMaterial: [
        { material: 'PLA', bondQuality: 'Strong Chemical Bond', notes: 'Good compatibility for rigid/flex combinations.' },
        { material: 'PLA+', bondQuality: 'Strong Chemical Bond', notes: 'Works well together.' },
        { material: 'PETG', bondQuality: 'Weak Bond', notes: 'Poor adhesion between materials.' },
      ],
    },
    postProcessing: {
      chemicalSmoothing: [{ method: 'Not recommended', effectiveness: 'Not Possible', notes: 'Flexible nature makes smoothing difficult.' }],
      mechanical: ['Light sanding possible', 'Trimming with sharp blade', 'Avoid aggressive methods'],
      painting: 'Flexible paints required - standard paint will crack when flexed.',
      glues: ['Flexible CA glue', 'Contact cement', 'Flexible epoxy'],
    },
    safety: {
      fumes: { level: 'Very Low', notes: 'Standard PLA emissions plus minor plasticizer off-gassing.' },
      foodSafety: { rating: 'Not Safe', notes: 'Plasticizers not food safe.' },
      biodegradability: { rating: 'Partially Compostable', notes: 'PLA portion compostable, additives may not be.' },
      additionalNotes: [
        'Safe for normal handling',
        'Not for food contact applications',
        'Check for skin sensitivity with prolonged contact',
      ],
    },
  },

  'LW-PLA-HT': {
    name: 'LW-PLA-HT',
    fullName: 'Lightweight High Temperature PLA',
    origin: {
      yearInvented: '2021-2022',
      originalCompany: 'ColorFabb, Polymaker',
      keyMilestones: [
        '2019: Original LW-PLA (foaming PLA) introduced by ColorFabb',
        '2021: Heat-treatable foaming PLA variants developed',
        '2022: LW-PLA-HT combines lightweight foaming with heat treatment',
        '2023+: Refined formulations with better annealing and foam stability',
      ],
      majorManufacturers: ['ColorFabb', 'Polymaker', 'Proto-pasta', 'Recreus'],
    },
    composition: {
      basePolymer: 'Modified Polylactic Acid with foaming agents and crystallization enhancers',
      chemicalFamily: 'Aliphatic Polyester (Foamable, Semi-crystalline after annealing)',
      keyAdditives: ['Chemical foaming agents (azodicarbonamide or similar)', 'Nucleating agents for crystallization', 'Heat stabilizers', 'Cell structure promoters'],
      coloringAgents: 'Limited color options due to foaming chemistry',
      specialFillers: ['Micro-foam nucleators', 'Crystallization promoters'],
    },
    familyContext: {
      parentPolymer: 'LW-PLA (Lightweight PLA) + HTPLA (Heat Treatable PLA)',
      variants: ['LW-PLA-HT Standard', 'LW-PLA-HT Pro', 'Active Foaming HT'],
      chemicalComparison: 'Combines two PLA enhancement technologies: foaming for weight reduction and heat treatment for increased temperature resistance.',
      evolution: 'Represents the merger of lightweight printing technology with heat-treatable crystallization.',
    },
    strengths: {
      uniqueProperties: ['Up to 65% weight reduction when foamed', 'Heat resistance up to 120°C+ after annealing', 'Excellent strength-to-weight ratio', 'Matte surface finish'],
      bestUseScenarios: ['RC aircraft', 'Drone components', 'Cosplay armor', 'Large decorative prints', 'Lightweight structural parts', 'Heat-exposed lightweight components'],
      advantagesOverCompetitors: ['Lighter than any other rigid filament', 'Better heat resistance than standard LW-PLA', 'Easier than separate foam + anneal workflow', 'Bio-based polymer'],
      whyChooseThis: 'For applications requiring both extreme lightness AND heat resistance - the best of both worlds.',
    },
    weaknesses: {
      limitations: ['Complex two-step process (foam + anneal)', 'Dimensional changes during both foaming and annealing', 'Limited color options', 'Higher cost', 'Requires careful temperature calibration'],
      commonProblems: ['Inconsistent foam density', 'Over-foaming at high temps', 'Shrinkage during annealing', 'Surface finish varies with foam level', 'Difficult to achieve consistent results'],
      environmentalConcerns: ['Foaming agents may have environmental impact', 'Energy use for annealing', 'Composite material disposal'],
      whenNotToUse: ['Tight tolerance parts', 'Parts requiring precise dimensions', 'Without temperature calibration', 'Fine detail prints', 'Clear/translucent requirements'],
    },
    practicalContext: {
      industryAdoption: ['RC/drone hobbyists', 'Cosplay community', 'Model aircraft builders', 'Lightweight prototyping'],
      commonApplications: ['RC airplane fuselages and wings', 'Drone frames', 'Cosplay armor and props', 'Large display models', 'Buoyant parts', 'Heat-shielding lightweight components'],
      safetyStandards: ['Standard PLA safety', 'Ensure good ventilation during foaming'],
      costPosition: 'Premium',
    },
    trivia: {
      funFacts: [
        'The foaming creates millions of tiny air bubbles that reduce density by up to 65%',
        'RC aircraft builders can print full-size planes that are light enough to fly',
        'The annealing process transforms the foam structure while adding heat resistance',
        'Developed specifically for the RC and drone communities who needed both light weight and heat tolerance',
      ],
      whyInvented: 'To address RC hobbyists\' need for lightweight parts that could also withstand heat from motors and sun exposure.',
      controversies: [
        'Debate over whether it truly matches dedicated engineering foams',
        'Inconsistency between batches and manufacturers',
        'Complex workflow deters many users',
        'Questions about long-term foam cell stability',
      ],
      marketAdoption: 'Niche following in RC aircraft and drone communities who value the unique lightweight + heat-resistant combination.',
    },
    tdsProfile: {
      properties: [
        { name: 'Density (foamed)', value: '0.4-0.7', unit: 'g/cm³', implications: '40-65% lighter than solid PLA (1.24 g/cm³).' },
        { name: 'Tensile Strength (annealed)', value: '35-50', unit: 'MPa', implications: 'Good strength considering foam structure.' },
        { name: 'Heat Deflection (annealed)', value: '100-120', unit: '°C', implications: 'Excellent heat resistance after annealing.' },
        { name: 'Foam Expansion', value: '2.5-3x', unit: 'volume', implications: 'Material expands during printing - adjust flow accordingly.' },
        { name: 'Glass Transition (annealed)', value: '80-100', unit: '°C', implications: 'Significantly improved over standard LW-PLA.' },
      ],
      notes: 'Properties vary significantly based on foaming level and annealing protocol. Test with your specific workflow.',
    },
    printSettings: {
      nozzleTemp: { min: 230, max: 270, optimal: 250 },
      bedTemp: { min: 50, max: 70, optimal: 60 },
      coolingFan: { min: 0, max: 50, notes: 'Lower cooling helps foam expansion. Too much cooling collapses foam cells.' },
      enclosure: { required: false, notes: 'Not required but helps consistency. Avoid drafts.' },
      drying: { temp: 50, duration: '4-6 hours', notes: 'Critical - moisture affects foaming behavior significantly.' },
      printSpeed: { recommended: '20-40 mm/s', notes: 'Slow speeds required for proper foam formation and flow compensation.' },
      additionalNotes: [
        'Use 0.6mm or larger nozzle for best foam flow',
        'Reduce flow rate to 40-60% to compensate for foam expansion',
        'Higher temps = more foaming, lower temps = less foaming',
        'Layer height affects foam cell size',
        'Annealing: 70-80°C for 30-60 minutes after printing',
        'Expect 2-5% shrinkage during annealing - design oversized',
      ],
    },
    adhesion: {
      bedSurfaces: {
        excellent: ['PEI', 'Glass with glue stick', 'BuildTak'],
        good: ['Blue tape', 'Textured PEI'],
        poor: ['Bare glass'],
      },
      releaseAgents: 'Glue stick recommended for easy release without damaging foam structure.',
      multiMaterial: [
        { material: 'PLA', bondQuality: 'Strong Chemical Bond', notes: 'Good compatibility for solid/foam combinations.' },
        { material: 'HTPLA', bondQuality: 'Strong Chemical Bond', notes: 'Excellent - same annealing process.' },
        { material: 'PVA', bondQuality: 'Mechanical Bond', notes: 'Possible but foam surface may be rough.' },
      ],
    },
    postProcessing: {
      chemicalSmoothing: [{ method: 'Not recommended', effectiveness: 'Not Possible', notes: 'Would destroy foam cell structure.' }],
      mechanical: ['Very light sanding', 'Careful trimming', 'Avoid heavy pressure that compresses foam'],
      painting: 'Use light coats - heavy paint adds weight. Primer may fill foam surface texture.',
      glues: ['CA glue (penetrates foam - use sparingly)', 'Foam-safe epoxy', 'Hot glue (low temp)'],
    },
    safety: {
      fumes: { level: 'Moderate', notes: 'Foaming agents release gases during printing. Ensure good ventilation.' },
      foodSafety: { rating: 'Not Safe', notes: 'Foam structure harbors bacteria; additives not food safe.' },
      biodegradability: { rating: 'Partially Compostable', notes: 'PLA base compostable, foaming additives unknown.' },
      additionalNotes: [
        'Print in well-ventilated area due to foaming agent off-gassing',
        'Not suitable for food contact',
        'Safe for normal handling after printing',
        'Some users report mild odor during printing',
      ],
    },
  },

  'rPLA': {
    name: 'rPLA',
    fullName: 'Recycled Polylactic Acid',
    origin: {
      yearInvented: '2018-2019',
      originalCompany: 'Multiple manufacturers (Closed Loop Plastics, Prusament, re-PET)',
      keyMilestones: [
        '2018: First commercial recycled PLA filaments appear',
        '2019: Major brands launch recycled filament lines',
        '2020: Prusament introduces Recycled PLA from production waste',
        '2022+: Improved recycling processes yield better quality rPLA',
      ],
      majorManufacturers: ['Prusament', 'Closed Loop Plastics', 're-PET', 'Fillamentum', 'ColorFabb', 'Polymaker'],
    },
    composition: {
      basePolymer: 'Recycled Polylactic Acid (from post-industrial or post-consumer sources)',
      chemicalFamily: 'Aliphatic Polyester (Recycled)',
      keyAdditives: ['Chain extenders (restore molecular weight)', 'Stabilizers', 'Compatibilizers for mixed sources'],
      coloringAgents: 'Often limited or natural color due to mixed feedstock',
      specialFillers: ['Sometimes mixed with virgin PLA for consistency'],
    },
    familyContext: {
      parentPolymer: 'Recycled from virgin PLA waste streams',
      variants: ['Post-Industrial rPLA', 'Post-Consumer rPLA', 'Hybrid rPLA (recycled + virgin blend)'],
      chemicalComparison: 'Chemically identical to virgin PLA but may have shorter polymer chains from recycling process.',
      evolution: 'Emerged from sustainability initiatives in the 3D printing community.',
    },
    strengths: {
      uniqueProperties: ['Reduced environmental footprint', 'Diverts plastic from waste', 'Similar properties to virgin PLA', 'Supports circular economy'],
      bestUseScenarios: ['Prototyping', 'Non-critical parts', 'Educational printing', 'Sustainability-focused projects', 'General purpose printing'],
      advantagesOverCompetitors: ['Lower carbon footprint than virgin PLA', 'Often lower cost', 'Supports recycling infrastructure', 'Feel-good factor'],
      whyChooseThis: 'For environmentally conscious printing where virgin material properties aren\'t critical.',
    },
    weaknesses: {
      limitations: ['Slightly reduced mechanical properties', 'Color options limited', 'Batch-to-batch variation possible', 'May contain minor impurities'],
      commonProblems: ['Occasional print quality variations', 'Slight brittleness compared to virgin', 'Color inconsistency between batches'],
      environmentalConcerns: ['Energy use in recycling process', 'Not infinitely recyclable (degrades each cycle)', 'Quality depends on source material purity'],
      whenNotToUse: ['Critical structural parts', 'Consistent color requirements', 'Maximum strength applications', 'Food contact (unless certified)'],
    },
    practicalContext: {
      industryAdoption: ['Educational institutions', 'Sustainability-focused makerspaces', 'Eco-conscious hobbyists', 'Prototyping shops'],
      commonApplications: ['Prototypes', 'Educational models', 'Non-critical parts', 'Decorative items', 'Concept models'],
      safetyStandards: ['Same as virgin PLA', 'Check certifications for specific applications'],
      costPosition: 'Budget',
    },
    trivia: {
      funFacts: [
        'Some rPLA comes from 3D printing production waste (failed prints, purge material)',
        'Prusament recycles their own production waste into rPLA filament',
        'PLA can typically be recycled 3-5 times before significant degradation',
        'The energy to recycle PLA is about 70% less than producing virgin PLA',
      ],
      whyInvented: 'To address environmental concerns about single-use plastics in 3D printing.',
      controversies: [
        'Debate over true environmental benefit vs. marketing',
        'Quality consistency concerns',
        'Greenwashing accusations for some products',
        'Questions about actual recycled content percentages',
      ],
      marketAdoption: 'Growing adoption driven by environmental awareness and cost savings.',
    },
    tdsProfile: {
      properties: [
        { name: 'Tensile Strength', value: '45-55', unit: 'MPa', implications: 'Slightly below virgin PLA (50-60 MPa).' },
        { name: 'Elongation at Break', value: '4-8', unit: '%', implications: 'Similar to virgin PLA, may be slightly more brittle.' },
        { name: 'Glass Transition', value: '55-60', unit: '°C', implications: 'Same heat limitations as virgin PLA.' },
        { name: 'Recycled Content', value: '80-100', unit: '%', implications: 'Varies by manufacturer and product.' },
        { name: 'Density', value: '1.24', unit: 'g/cm³', implications: 'Same as virgin PLA.' },
      ],
      notes: 'Properties vary based on recycling source and process quality.',
    },
    printSettings: {
      nozzleTemp: { min: 195, max: 220, optimal: 210 },
      bedTemp: { min: 50, max: 70, optimal: 60 },
      coolingFan: { min: 50, max: 100, notes: 'Standard PLA cooling works well.' },
      enclosure: { required: false, notes: 'Not required.' },
      drying: { temp: 50, duration: '4 hours', notes: 'Standard PLA drying if needed.' },
      printSpeed: { recommended: '40-60 mm/s', notes: 'Same as virgin PLA.' },
      additionalNotes: [
        'Print settings very similar to virgin PLA',
        'May need slight temperature adjustments per batch',
        'Start with standard PLA settings and adjust as needed',
      ],
    },
    adhesion: {
      bedSurfaces: {
        excellent: ['PEI', 'Glass with adhesive', 'BuildTak'],
        good: ['Blue tape', 'Textured PEI'],
        poor: ['Bare glass', 'Polypropylene'],
      },
      releaseAgents: 'Same as virgin PLA - glue stick or hairspray if needed.',
      multiMaterial: [
        { material: 'PLA', bondQuality: 'Strong Chemical Bond', notes: 'Excellent compatibility with virgin PLA.' },
        { material: 'PLA+', bondQuality: 'Strong Chemical Bond', notes: 'Good bonding.' },
        { material: 'PVA', bondQuality: 'Mechanical Bond', notes: 'Works for supports.' },
      ],
    },
    postProcessing: {
      chemicalSmoothing: [{ method: 'Ethyl Acetate vapor', effectiveness: 'Difficult', notes: 'Same as virgin PLA - limited effectiveness.' }],
      mechanical: ['Sanding', 'Filing', 'Cutting'],
      painting: 'Same as virgin PLA - primes and paints well.',
      glues: ['CA glue', 'Epoxy', 'Hot glue'],
    },
    safety: {
      fumes: { level: 'Very Low', notes: 'Same emissions profile as virgin PLA.' },
      foodSafety: { rating: 'Not Safe', notes: 'Recycling process and potential contaminants make food contact inadvisable unless specifically certified.' },
      biodegradability: { rating: 'Industrial Compostable', notes: 'Same as virgin PLA - requires industrial composting conditions.' },
      additionalNotes: [
        'Safe for normal printing and handling',
        'Check specific product certifications',
        'Environmental benefit comes from reduced virgin material use',
      ],
    },
  },

  'Standard PLA+': {
    name: 'Standard PLA+',
    fullName: 'Enhanced Polylactic Acid Plus',
    origin: {
      yearInvented: '2015-2016',
      originalCompany: 'Multiple manufacturers (eSUN, Overture, Sunlu)',
      keyMilestones: [
        '2015: First "PLA+" formulations marketed as improved PLA',
        '2016-2017: Major filament brands launch PLA+ product lines',
        '2018: PLA+ becomes standard offering from most manufacturers',
        '2020+: Formulations refined with better impact resistance and layer adhesion',
      ],
      majorManufacturers: ['eSUN', 'Overture', 'Sunlu', 'Hatchbox', 'Polymaker', 'Inland', 'Amazon Basics'],
    },
    composition: {
      basePolymer: 'Modified Polylactic Acid',
      chemicalFamily: 'Aliphatic Polyester (Enhanced)',
      keyAdditives: ['Impact modifiers', 'Plasticizers for flexibility', 'Nucleating agents', 'Chain extenders'],
      coloringAgents: 'Full range of pigments and masterbatch colorants',
      specialFillers: ['Toughening agents', 'Flow enhancers'],
    },
    familyContext: {
      parentPolymer: 'Standard PLA with toughening additives',
      variants: ['PLA+', 'PLA Pro', 'PLA Premium', 'Tough PLA', 'PLA Enhanced'],
      chemicalComparison: 'PLA base polymer modified with impact modifiers and plasticizers to reduce brittleness while maintaining easy printability.',
      evolution: 'Developed to address standard PLA\'s brittleness while keeping its easy printing characteristics.',
    },
    strengths: {
      uniqueProperties: ['Improved impact resistance over standard PLA', 'Better layer adhesion', 'Reduced brittleness', 'Maintains easy printability'],
      bestUseScenarios: ['Functional prototypes', 'Parts requiring some flexibility', 'General purpose printing', 'Parts that may experience drops or impacts'],
      advantagesOverCompetitors: ['Easier than PETG with better toughness than PLA', 'Wide color selection', 'Low cost improvement over PLA', 'No special equipment needed'],
      whyChooseThis: 'When you need better toughness than standard PLA but don\'t want the complexity of PETG or ABS.',
    },
    weaknesses: {
      limitations: ['Still not as strong as PETG or ABS', 'Same heat resistance as standard PLA', 'Formulations vary significantly between brands', 'Marketing term - no standard specification'],
      commonProblems: ['Quality varies by manufacturer', 'Some "PLA+" is barely different from PLA', 'Slightly higher stringing than PLA'],
      environmentalConcerns: ['Additives may affect compostability', 'Same disposal challenges as PLA'],
      whenNotToUse: ['High-temperature applications', 'Maximum strength requirements', 'When consistent specifications needed across brands'],
    },
    practicalContext: {
      industryAdoption: ['Hobbyist printing', 'Prototyping', 'Educational', 'Consumer products'],
      commonApplications: ['Functional prototypes', 'Phone cases', 'Tool handles', 'Enclosures', 'General purpose parts'],
      safetyStandards: ['Generally same as PLA', 'Check specific brand certifications'],
      costPosition: 'Budget',
    },
    trivia: {
      funFacts: [
        'There\'s no industry standard for what makes PLA "plus" - each brand has their own formula',
        'Some PLA+ is just standard PLA with better QC and marketing',
        'The best PLA+ brands can approach PETG toughness while printing like PLA',
        'Price difference between PLA and PLA+ is often minimal',
      ],
      whyInvented: 'To create an easy-to-print material that addresses standard PLA\'s brittleness complaints.',
      controversies: [
        '"PLA+" is a marketing term with no standardized meaning',
        'Quality and properties vary wildly between brands',
        'Some users report no difference from standard PLA',
        'Debate over whether it\'s worth the price premium',
      ],
      marketAdoption: 'Extremely popular as a "better PLA" option for beginners and general use.',
    },
    tdsProfile: {
      properties: [
        { name: 'Tensile Strength', value: '50-65', unit: 'MPa', implications: 'Similar or slightly better than standard PLA.' },
        { name: 'Impact Strength', value: '5-10', unit: 'kJ/m²', implications: 'Improved over standard PLA (2-4 kJ/m²).' },
        { name: 'Elongation at Break', value: '8-15', unit: '%', implications: 'Better than PLA (3-6%), less brittle.' },
        { name: 'Glass Transition', value: '55-60', unit: '°C', implications: 'Same heat limitations as standard PLA.' },
        { name: 'Density', value: '1.24', unit: 'g/cm³', implications: 'Same as standard PLA.' },
      ],
      notes: 'Properties vary significantly between manufacturers. Test your specific brand.',
    },
    printSettings: {
      nozzleTemp: { min: 200, max: 230, optimal: 215 },
      bedTemp: { min: 50, max: 70, optimal: 60 },
      coolingFan: { min: 50, max: 100, notes: 'Standard PLA cooling. Some brands print better with slightly less cooling.' },
      enclosure: { required: false, notes: 'Not required.' },
      drying: { temp: 50, duration: '4 hours', notes: 'Standard PLA drying if needed.' },
      printSpeed: { recommended: '40-70 mm/s', notes: 'Similar to standard PLA, some brands handle faster speeds.' },
      additionalNotes: [
        'Settings very similar to standard PLA',
        'May need 5-10°C higher nozzle temp than standard PLA',
        'Test with your specific brand',
        'Slightly slower retraction may help with stringing',
      ],
    },
    adhesion: {
      bedSurfaces: {
        excellent: ['PEI', 'Glass with adhesive', 'BuildTak'],
        good: ['Blue tape', 'Textured PEI'],
        poor: ['Bare glass', 'Polypropylene'],
      },
      releaseAgents: 'Same as standard PLA.',
      multiMaterial: [
        { material: 'PLA', bondQuality: 'Strong Chemical Bond', notes: 'Excellent compatibility.' },
        { material: 'PVA', bondQuality: 'Mechanical Bond', notes: 'Good for supports.' },
        { material: 'PETG', bondQuality: 'Weak Bond', notes: 'Poor adhesion.' },
      ],
    },
    postProcessing: {
      chemicalSmoothing: [{ method: 'Ethyl Acetate vapor', effectiveness: 'Difficult', notes: 'Same limited effectiveness as standard PLA.' }],
      mechanical: ['Sanding', 'Filing', 'Cutting', 'Drilling'],
      painting: 'Same as PLA - accepts primers and paints well.',
      glues: ['CA glue', 'Epoxy', 'Hot glue', 'PLA-specific adhesives'],
    },
    safety: {
      fumes: { level: 'Very Low', notes: 'Same as standard PLA.' },
      foodSafety: { rating: 'Not Safe', notes: 'Additives typically not food safe. Check specific certifications.' },
      biodegradability: { rating: 'Partially Compostable', notes: 'PLA base compostable, additives may affect this.' },
      additionalNotes: [
        'Safe for normal printing and handling',
        'Same safety profile as standard PLA',
      ],
    },
  },

  'EasyPrint PLA': {
    name: 'EasyPrint PLA',
    fullName: 'Easy Print Polylactic Acid',
    origin: {
      yearInvented: '2018-2019',
      originalCompany: 'Multiple manufacturers (3D-Fuel, Polymaker, FormFutura)',
      keyMilestones: [
        '2018: "Easy" or "beginner-friendly" PLA formulations emerge',
        '2019: Major brands market specifically to new users',
        '2020: Becomes popular entry-level filament category',
        '2022+: Refined for maximum forgiving print characteristics',
      ],
      majorManufacturers: ['3D-Fuel', 'Polymaker', 'FormFutura', 'MatterHackers', 'Prusa'],
    },
    composition: {
      basePolymer: 'Polylactic Acid (optimized formulation)',
      chemicalFamily: 'Aliphatic Polyester',
      keyAdditives: ['Flow enhancers', 'Adhesion promoters', 'Anti-stringing agents', 'Stabilizers for consistent extrusion'],
      coloringAgents: 'Standard pigments optimized for color consistency',
      specialFillers: ['None typically - focus on pure printability'],
    },
    familyContext: {
      parentPolymer: 'Standard PLA optimized for consistent, trouble-free printing',
      variants: ['EasyPrint PLA', 'Easy PLA', 'Beginner PLA', 'Standard PLA (high-QC)'],
      chemicalComparison: 'Same base chemistry as standard PLA but with tighter tolerances, better drying, and optimized additives for reliable extrusion.',
      evolution: 'Developed as entry-level products for new 3D printer users who need guaranteed success.',
    },
    strengths: {
      uniqueProperties: ['Maximum printability', 'Very forgiving temperature range', 'Minimal stringing', 'Consistent diameter tolerance'],
      bestUseScenarios: ['New printer users', 'Printer calibration', 'Educational settings', 'When reliability matters most', 'General purpose printing'],
      advantagesOverCompetitors: ['Prints successfully on first try', 'Wide temperature window', 'Excellent bed adhesion', 'Minimal troubleshooting needed'],
      whyChooseThis: 'When you want guaranteed successful prints without fussing with settings - perfect for beginners.',
    },
    weaknesses: {
      limitations: ['Same mechanical properties as standard PLA', 'Same heat limitations', 'Often limited color selection', 'Sometimes premium priced for "easy" label'],
      commonProblems: ['May be overpriced for what it is', '"Easy" is sometimes just marketing', 'Not better than good standard PLA'],
      environmentalConcerns: ['Same as standard PLA'],
      whenNotToUse: ['When you need enhanced properties', 'Cost-sensitive projects', 'When experienced with printing'],
    },
    practicalContext: {
      industryAdoption: ['Educational institutions', 'Makerspaces', 'Home hobbyists', 'Schools'],
      commonApplications: ['Learning to print', 'Test prints', 'Calibration', 'General decorative items', 'Classroom projects'],
      safetyStandards: ['Same as standard PLA'],
      costPosition: 'Standard',
    },
    trivia: {
      funFacts: [
        'Many "EasyPrint" PLAs are just well-made standard PLA with tighter QC',
        'The wide temperature tolerance comes from careful additive balancing',
        'Some brands\' standard PLA is already "easy" enough - the label is marketing',
        'Prusa\'s standard Prusament is often considered "easy" quality without the label',
      ],
      whyInvented: 'To reduce frustration for new 3D printer users and guarantee successful first prints.',
      controversies: [
        'Debate over whether it\'s meaningfully different from good standard PLA',
        'Price premium may not be justified',
        'Some view it as marketing to beginners',
      ],
      marketAdoption: 'Popular in educational and beginner markets; experienced users often stick with standard PLA.',
    },
    tdsProfile: {
      properties: [
        { name: 'Tensile Strength', value: '50-60', unit: 'MPa', implications: 'Same as standard PLA.' },
        { name: 'Elongation at Break', value: '4-6', unit: '%', implications: 'Standard PLA brittleness.' },
        { name: 'Glass Transition', value: '55-60', unit: '°C', implications: 'Same heat limitations.' },
        { name: 'Diameter Tolerance', value: '±0.02', unit: 'mm', implications: 'Tighter than budget PLA for consistent extrusion.' },
        { name: 'Density', value: '1.24', unit: 'g/cm³', implications: 'Standard PLA density.' },
      ],
      notes: 'Mechanical properties identical to standard PLA - the "easy" is in the printing, not the finished part.',
    },
    printSettings: {
      nozzleTemp: { min: 190, max: 230, optimal: 210 },
      bedTemp: { min: 45, max: 70, optimal: 60 },
      coolingFan: { min: 50, max: 100, notes: 'Standard cooling works well across wide range.' },
      enclosure: { required: false, notes: 'Not required.' },
      drying: { temp: 50, duration: '4 hours', notes: 'Usually ships well-dried. Dry if stored long.' },
      printSpeed: { recommended: '40-80 mm/s', notes: 'Forgiving across wide speed range.' },
      additionalNotes: [
        'Wide temperature window - hard to get wrong',
        'Start with manufacturer recommended settings',
        'Very forgiving of slight miscalibration',
        'Great for learning your printer',
      ],
    },
    adhesion: {
      bedSurfaces: {
        excellent: ['PEI', 'Glass with adhesive', 'BuildTak', 'Blue tape'],
        good: ['Textured PEI', 'Glass with hairspray'],
        poor: ['Bare untreated glass'],
      },
      releaseAgents: 'Usually not needed - good adhesion and release by design.',
      multiMaterial: [
        { material: 'PLA', bondQuality: 'Strong Chemical Bond', notes: 'Excellent compatibility with all PLA variants.' },
        { material: 'PVA', bondQuality: 'Mechanical Bond', notes: 'Good for supports.' },
      ],
    },
    postProcessing: {
      chemicalSmoothing: [{ method: 'Ethyl Acetate vapor', effectiveness: 'Difficult', notes: 'Same as standard PLA.' }],
      mechanical: ['Sanding', 'Filing', 'Cutting'],
      painting: 'Same as standard PLA - accepts paints well.',
      glues: ['CA glue', 'Epoxy', 'Hot glue'],
    },
    safety: {
      fumes: { level: 'Very Low', notes: 'Same as standard PLA.' },
      foodSafety: { rating: 'Not Safe', notes: 'Same considerations as standard PLA.' },
      biodegradability: { rating: 'Industrial Compostable', notes: 'Same as standard PLA.' },
      additionalNotes: [
        'Safe for normal printing and handling',
        'Good for educational environments',
      ],
    },
  },

  'Silk PLA+': {
    name: 'Silk PLA+',
    fullName: 'Silk Finish Enhanced Polylactic Acid',
    origin: {
      yearInvented: '2019-2020',
      originalCompany: 'Multiple manufacturers (TTYT3D, Eryone, Sunlu)',
      keyMilestones: [
        '2017-2018: Original Silk PLA introduced',
        '2019: Manufacturers combine silk finish with PLA+ toughening',
        '2020: Silk PLA+ becomes distinct product category',
        '2022+: Wide color ranges and dual-color silk variants',
      ],
      majorManufacturers: ['TTYT3D', 'Eryone', 'Sunlu', 'Overture', 'eSUN', 'Geeetech', 'MIKA3D'],
    },
    composition: {
      basePolymer: 'Modified Polylactic Acid',
      chemicalFamily: 'Aliphatic Polyester (Enhanced with Silk Additives)',
      keyAdditives: ['Silk-effect pearlescent pigments', 'Impact modifiers', 'Flow enhancers', 'Plasticizers'],
      coloringAgents: 'Pearlescent and interference pigments for silk sheen effect',
      specialFillers: ['Mica particles', 'Pearl effect compounds', 'Toughening agents'],
    },
    familyContext: {
      parentPolymer: 'PLA+ base with silk finish additives',
      variants: ['Silk PLA+', 'Silk PLA Pro', 'Dual-Color Silk', 'Rainbow Silk PLA+'],
      chemicalComparison: 'Combines PLA+ toughening technology with silk-finish pearlescent additives for both improved properties and aesthetics.',
      evolution: 'Natural combination of two popular PLA modifications - silk finish for looks and plus formulation for durability.',
    },
    strengths: {
      uniqueProperties: ['Beautiful silk/satin finish', 'Improved toughness over standard Silk PLA', 'Hides layer lines effectively', 'Vibrant, eye-catching colors'],
      bestUseScenarios: ['Decorative prints', 'Vases and containers', 'Display models', 'Gifts', 'Art pieces', 'Parts that need both looks and durability'],
      advantagesOverCompetitors: ['Better toughness than regular Silk PLA', 'More attractive than standard PLA+', 'Excellent layer line hiding', 'Premium appearance'],
      whyChooseThis: 'When you want the beautiful silk finish AND improved toughness - best of both worlds for decorative functional parts.',
    },
    weaknesses: {
      limitations: ['Same heat resistance as standard PLA', 'Silk effect can show scratches', 'Higher cost than plain PLA+', 'Surface finish affected by print settings'],
      commonProblems: ['Stringing more common than standard PLA', 'Optimal settings needed for best silk effect', 'Flow rate sensitive'],
      environmentalConcerns: ['Pearlescent additives may affect compostability', 'Same disposal considerations as PLA+'],
      whenNotToUse: ['High-temperature applications', 'Parts requiring painting', 'When matte finish needed', 'Maximum strength requirements'],
    },
    practicalContext: {
      industryAdoption: ['Hobbyist printing', 'Gift making', 'Art and design', 'Home decor'],
      commonApplications: ['Vases', 'Decorative items', 'Jewelry', 'Display models', 'Planters', 'Gift items', 'Art sculptures'],
      safetyStandards: ['Generally same as PLA', 'Not food safe due to additives'],
      costPosition: 'Premium',
    },
    trivia: {
      funFacts: [
        'The silk effect comes from flat particles that align during extrusion, reflecting light uniformly',
        'Silk PLA+ is one of the best materials for hiding layer lines',
        'The sheen is most visible on curved surfaces and gradual angles',
        'Dual-color silk variants create color-shifting effects as the print rotates',
      ],
      whyInvented: 'To combine the aesthetic appeal of silk PLA with the improved durability of PLA+ formulations.',
      controversies: [
        'Some "Silk PLA+" products are just regular Silk PLA with marketing',
        'Toughness improvements vary significantly between brands',
        'Debate over whether the "+" adds meaningful strength',
      ],
      marketAdoption: 'Very popular for decorative printing where both appearance and durability matter.',
    },
    tdsProfile: {
      properties: [
        { name: 'Tensile Strength', value: '48-58', unit: 'MPa', implications: 'Slightly below plain PLA+ due to silk additives.' },
        { name: 'Impact Strength', value: '4-8', unit: 'kJ/m²', implications: 'Better than standard Silk PLA, slightly less than plain PLA+.' },
        { name: 'Elongation at Break', value: '6-12', unit: '%', implications: 'Improved flexibility over standard PLA.' },
        { name: 'Glass Transition', value: '55-60', unit: '°C', implications: 'Same heat limitations as standard PLA.' },
        { name: 'Surface Gloss', value: 'High Satin', unit: '', implications: 'Characteristic silk sheen appearance.' },
      ],
      notes: 'Properties combine PLA+ toughness with silk aesthetics. Actual values depend on brand.',
    },
    printSettings: {
      nozzleTemp: { min: 205, max: 235, optimal: 220 },
      bedTemp: { min: 50, max: 70, optimal: 60 },
      coolingFan: { min: 30, max: 80, notes: 'Moderate cooling. Too much cooling can dull the silk effect.' },
      enclosure: { required: false, notes: 'Not required.' },
      drying: { temp: 50, duration: '4 hours', notes: 'Dry if stringing occurs.' },
      printSpeed: { recommended: '40-60 mm/s', notes: 'Moderate speeds for best silk finish. Slower = better sheen.' },
      additionalNotes: [
        'Slightly higher temps than standard PLA for best flow and silk effect',
        'Reduce retraction to minimize stringing',
        'Slower outer walls improve silk appearance',
        'Vase mode produces stunning results',
        'Layer height 0.2mm or less for best finish',
      ],
    },
    adhesion: {
      bedSurfaces: {
        excellent: ['PEI', 'Glass with adhesive', 'BuildTak'],
        good: ['Blue tape', 'Textured PEI'],
        poor: ['Bare glass', 'Polypropylene'],
      },
      releaseAgents: 'Standard PLA methods. Glue stick if needed.',
      multiMaterial: [
        { material: 'PLA', bondQuality: 'Strong Chemical Bond', notes: 'Good compatibility.' },
        { material: 'PLA+', bondQuality: 'Strong Chemical Bond', notes: 'Excellent compatibility.' },
        { material: 'PVA', bondQuality: 'Mechanical Bond', notes: 'Works for supports.' },
      ],
    },
    postProcessing: {
      chemicalSmoothing: [{ method: 'Not recommended', effectiveness: 'Not Possible', notes: 'Would damage silk finish.' }],
      mechanical: ['Very light sanding only', 'Polishing can enhance shine', 'Avoid heavy abrasion'],
      painting: 'Generally not painted - defeats purpose. Clear coat can protect and enhance.',
      glues: ['CA glue', 'Epoxy', 'Hot glue'],
    },
    safety: {
      fumes: { level: 'Very Low', notes: 'Same as standard PLA.' },
      foodSafety: { rating: 'Not Safe', notes: 'Silk additives not food safe.' },
      biodegradability: { rating: 'Partially Compostable', notes: 'PLA base compostable, additives may affect this.' },
      additionalNotes: [
        'Safe for normal printing and handling',
        'Not for food contact applications',
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

  'PAHT-CF': {
    name: 'PAHT-CF',
    fullName: 'High-Temperature Polyamide Carbon Fiber',
    origin: {
      yearInvented: '2020+ (Bambu Lab branded formulation)',
      originalCompany: 'Bambu Lab (popularized), based on PA6-CF technology',
      keyMilestones: [
        '2020+: High-temp PA-CF formulations enter consumer market',
        '2022: Bambu Lab brands their PA6-CF variant as PAHT-CF',
      ],
      majorManufacturers: ['Bambu Lab', 'Polymaker', '3DXTech'],
    },
    composition: {
      basePolymer: 'High-temperature polyamide (PA6-based) with 20-25% carbon fiber',
      chemicalFamily: 'Fiber-Reinforced Polyamide',
      keyAdditives: ['Chopped carbon fiber (20-25%)', 'Heat stabilizers', 'Flow enhancers'],
      coloringAgents: 'Black from carbon fiber',
    },
    familyContext: {
      parentPolymer: 'PA6 / High-temperature Polyamide',
      variants: ['PAHT-CF', 'PA6-CF', 'PA-CF'],
      chemicalComparison: 'Higher CF content than typical PA-CF products. Aims for maximum stiffness and heat resistance.',
    },
    strengths: {
      uniqueProperties: ['Very high stiffness', 'Good heat resistance (150°C+)', 'Strong and lightweight', 'Excellent dimensional stability'],
      bestUseScenarios: ['Metal replacement parts', 'Under-hood automotive', 'Industrial end-use parts', 'Structural components'],
      advantagesOverCompetitors: ['Stronger than PC-CF in some properties', 'Better wear resistance than PC-CF', 'Self-lubricating nylon base'],
      whyChooseThis: 'When you need the absolute highest performance from a nylon-based composite.',
    },
    weaknesses: {
      limitations: ['Requires enclosed high-temp printer', 'Very abrasive', 'Expensive', 'Moisture sensitive'],
      commonProblems: ['Warping', 'Moisture absorption', 'Layer delamination without proper chamber temp'],
      whenNotToUse: ['Without high-temp enclosed printer', 'Without hardened nozzle', 'Budget applications'],
    },
    practicalContext: {
      industryAdoption: ['Automotive', 'Industrial', 'Robotics'],
      commonApplications: ['End-use structural parts', 'Robot arm components', 'Automotive fixtures', 'CNC machine parts'],
      costPosition: 'Premium',
    },
    trivia: {
      funFacts: [
        'PAHT-CF approaches the performance of injection-molded glass-filled nylon',
        'Bambu Lab designed this for their AMS system and enclosed X1 printer',
      ],
      whyInvented: 'To bring industrial-grade nylon composite performance to advanced desktop printers.',
      marketAdoption: 'Growing rapidly with enclosed printer adoption.',
    },
    tdsProfile: {
      properties: [
        { name: 'Tensile Strength', value: '80-100', unit: 'MPa', implications: 'Excellent. Among the strongest FDM materials.' },
        { name: 'Tensile Modulus', value: '8000-12000', unit: 'MPa', implications: 'Extremely stiff.' },
        { name: 'Heat Deflection', value: '150-180', unit: '°C', implications: 'Very high — approaching PEEK territory.' },
        { name: 'Impact Strength', value: '20-35', unit: 'kJ/m²', implications: 'Moderate — CF reduces nylon toughness.' },
      ],
      notes: 'Top-tier desktop FDM material. Requires top-tier printer and technique.',
    },
    printSettings: {
      nozzleTemp: { min: 270, max: 300, optimal: 285 },
      bedTemp: { min: 90, max: 110, optimal: 100 },
      coolingFan: { min: 0, max: 20, notes: 'Minimal cooling.' },
      enclosure: { required: true, notes: 'REQUIRED. Chamber temp 60°C+ recommended for best results.' },
      drying: { temp: 80, duration: '8-12 hours', notes: 'CRITICAL. Must be bone dry. Print from dry box.' },
      printSpeed: { recommended: '30-60 mm/s', notes: 'Standard speeds with proper enclosure.' },
      additionalNotes: [
        'HARDENED NOZZLE REQUIRED',
        'All-metal hotend required',
        'Dry box printing strongly recommended',
        'Annealing can improve properties further',
      ],
    },
    adhesion: {
      bedSurfaces: {
        excellent: ['Garolite (G10)', 'PEI with strong adhesive'],
        good: ['Glass with nylon adhesive'],
        poor: ['Bare PEI', 'Standard surfaces'],
      },
      releaseAgents: 'PVA glue or specialty nylon bed adhesives.',
    },
    postProcessing: {
      chemicalSmoothing: [
        { method: 'Chemical', effectiveness: 'Difficult', notes: 'Nylon resists solvents.' },
      ],
      mechanical: ['Machines well with carbide tools (WEAR MASK)', 'Can be drilled and tapped'],
      glues: ['Epoxy', 'Specialty PA adhesives'],
      painting: 'Requires specialty primer for nylon.',
    },
    safety: {
      fumes: { level: 'Low', notes: 'Low emissions at print temperature.' },
      foodSafety: { rating: 'Not Recommended', notes: 'CF particles not food-safe.' },
      biodegradability: { rating: 'Not Biodegradable', notes: 'Neither nylon nor CF biodegrades.' },
      additionalNotes: ['WEAR MASK when sanding — CF dust hazard'],
    },
  },

  'PCTG': {
    name: 'PCTG',
    fullName: 'Polycyclohexylene Dimethylene Terephthalate Glycol',
    origin: {
      yearInvented: '1990s (developed), 2019+ (3D printing)',
      originalCompany: 'Eastman Chemical Company',
      keyMilestones: [
        '1990s: Eastman develops PCTG as premium copolyester',
        '2019: Prusament introduces PCTG filament',
        '2021+: Multiple brands offer PCTG',
      ],
      majorManufacturers: ['Prusament', 'Extrudr', 'Fillamentum', 'Polymaker'],
    },
    composition: {
      basePolymer: 'PCTG (Polycyclohexylene Dimethylene Terephthalate Glycol)',
      chemicalFamily: 'Copolyester',
      keyAdditives: ['Clarity enhancers', 'Impact modifiers'],
      coloringAgents: 'Excellent clarity — available in transparent and colored variants',
    },
    familyContext: {
      parentPolymer: 'Related to PETG but different monomer (CHDM)',
      variants: ['PCTG', 'PCTG Premium', 'PCTG CF10', 'PCTG GF10'],
      chemicalComparison: 'Higher impact resistance and better clarity than PETG. Often called "premium PETG."',
      evolution: 'Positioned as the premium alternative to PETG for users wanting better properties.',
    },
    strengths: {
      uniqueProperties: ['Superior clarity to PETG', 'Higher impact resistance', 'Better chemical resistance', 'Less stringing than PETG'],
      bestUseScenarios: ['Clear/transparent parts', 'Food containers', 'Medical prototypes', 'High-impact functional parts'],
      advantagesOverCompetitors: ['Clearer than PETG', 'Tougher than PETG', 'Easier to print than PETG (less stringing)'],
      whyChooseThis: 'When PETG is almost good enough but you need better clarity, impact resistance, or less stringing.',
    },
    weaknesses: {
      limitations: ['More expensive than PETG', 'Less widely available', 'Still not high-temperature'],
      commonProblems: ['Can over-adhere to PEI (like PETG)', 'Slightly more moisture-sensitive than PETG'],
      whenNotToUse: ['Budget projects (use PETG)', 'High-temperature applications'],
    },
    practicalContext: {
      industryAdoption: ['Medical', 'Food packaging', 'Consumer electronics'],
      commonApplications: ['Transparent enclosures', 'Food storage', 'Medical devices', 'Light covers'],
      costPosition: 'Premium',
    },
    trivia: {
      funFacts: [
        'Prusa chose PCTG as their premium copolyester offering',
        'PCTG has better optical clarity than most injection-molded PETG',
        'Eastman markets PCTG under the "Tritan" brand for consumer products',
      ],
      whyInvented: 'Developed by Eastman as a premium, BPA-free copolyester.',
      marketAdoption: 'Growing as a premium PETG alternative.',
    },
    tdsProfile: {
      properties: [
        { name: 'Tensile Strength', value: '50-60', unit: 'MPa', implications: 'Good. Slightly better than PETG.' },
        { name: 'Impact Strength (Notched)', value: '80-120', unit: 'kJ/m²', implications: 'Excellent. Significantly better than PETG.' },
        { name: 'Elongation at Break', value: '200-300', unit: '%', implications: 'Very High. Very ductile material.' },
        { name: 'Optical Clarity', value: 'Excellent', unit: '', implications: 'Superior to PETG. Near-glass clarity in some grades.' },
        { name: 'Heat Deflection', value: '70-75', unit: '°C', implications: 'Similar to PETG.' },
      ],
      notes: 'Superior to PETG in most properties at a higher price point.',
    },
    printSettings: {
      nozzleTemp: { min: 230, max: 260, optimal: 245 },
      bedTemp: { min: 70, max: 90, optimal: 80 },
      coolingFan: { min: 30, max: 70, notes: 'Similar to PETG — moderate cooling.' },
      enclosure: { required: false, notes: 'Not required.' },
      drying: { temp: 65, duration: '4-6 hours', notes: 'Similar hygroscopy to PETG.' },
      printSpeed: { recommended: '40-70 mm/s', notes: 'Can print faster than PETG with less stringing.' },
    },
    adhesion: {
      bedSurfaces: {
        excellent: ['PEI (Textured)'],
        good: ['Glass with glue', 'PEI (Smooth) with release agent'],
        poor: ['Bare smooth PEI — WILL bond permanently'],
      },
      releaseAgents: 'CRITICAL on smooth PEI. Use glue stick or Windex.',
      multiMaterial: [
        { material: 'PETG', bondQuality: 'Strong Chemical Bond', notes: 'Related polymer families.' },
      ],
    },
    postProcessing: {
      chemicalSmoothing: [
        { method: 'Dichloromethane', effectiveness: 'Good', notes: 'Works but toxic.' },
      ],
      mechanical: ['Sands well', 'Can be polished for clarity', 'Machines well'],
      glues: ['Cyanoacrylate', 'Epoxy'],
      painting: 'Accepts paint after surface prep.',
    },
    safety: {
      fumes: { level: 'Low', notes: 'Low emissions. BPA-free.' },
      foodSafety: { rating: 'FDA Approved Grades', notes: 'Eastman Tritan (PCTG) is FDA approved. Printing still introduces porosity.' },
      biodegradability: { rating: 'Not Biodegradable', notes: 'Petroleum-based copolyester.' },
    },
  },

  'POM': {
    name: 'POM',
    fullName: 'Polyoxymethylene (Acetal/Delrin)',
    origin: {
      yearInvented: '1956',
      originalCompany: 'DuPont (Delrin brand)',
      keyMilestones: [
        '1956: DuPont commercializes POM as "Delrin"',
        '1960s: POM becomes standard for precision engineering parts',
        '2019+: FDM POM filaments become available',
      ],
      majorManufacturers: ['DuPont (Delrin)', 'BASF (Ultrafuse)', 'Polymaker', 'igus'],
    },
    composition: {
      basePolymer: 'Polyoxymethylene (POM)',
      chemicalFamily: 'Polyacetal',
      keyAdditives: ['Thermal stabilizers (essential — POM can decompose to formaldehyde)', 'Nucleating agents'],
      coloringAgents: 'Natural is white/ivory. Limited color range.',
    },
    familyContext: {
      parentPolymer: 'Standalone engineering polymer',
      variants: ['POM-H (homopolymer/Delrin)', 'POM-C (copolymer/Celcon)'],
      chemicalComparison: 'Extremely low friction, high stiffness, excellent fatigue resistance. The go-to material for gears and bearings in industry.',
      evolution: 'Legendary engineering plastic, challenging to adapt to 3D printing.',
    },
    strengths: {
      uniqueProperties: ['Lowest friction of any thermoplastic', 'Excellent dimensional stability', 'Outstanding fatigue resistance', 'Self-lubricating'],
      bestUseScenarios: ['Gears', 'Bearings', 'Bushings', 'Precision mechanical parts', 'Snap-fits'],
      advantagesOverCompetitors: ['Lower friction than nylon', 'Better dimensional stability than nylon', 'Superior fatigue life'],
      whyChooseThis: 'The ultimate material for gears, bearings, and precision mechanical parts.',
    },
    weaknesses: {
      limitations: ['Extremely difficult to print (poor bed adhesion)', 'Releases formaldehyde if overheated', 'Limited color options', 'Very few successful 3D printer setups'],
      commonProblems: ['Near-zero bed adhesion', 'Warping', 'Formaldehyde release if temperature control fails'],
      environmentalConcerns: ['Formaldehyde decomposition product at high temps', 'Requires ventilation'],
      whenNotToUse: ['Beginners', 'Without POM-specific bed surface', 'In poorly ventilated spaces'],
    },
    practicalContext: {
      industryAdoption: ['Automotive', 'Consumer electronics', 'Medical devices', 'Industrial machinery'],
      commonApplications: ['Gears (the most common POM application)', 'Bearings', 'Conveyor parts', 'Zipper sliders'],
      safetyStandards: ['FDA approved grades exist', 'Widely used in food processing equipment'],
      costPosition: 'Standard',
    },
    trivia: {
      funFacts: [
        'Every zipper slider you\'ve ever used is likely POM',
        'DuPont\'s "Delrin" is the most famous POM brand — sometimes used as a generic term',
        'POM has lower friction than Teflon in some configurations',
        'One of the hardest materials to 3D print successfully',
      ],
      whyInvented: 'Created to replace metal in precision mechanical applications.',
      controversies: [
        'Formaldehyde release is a genuine safety concern at elevated temperatures',
        'Very few people achieve good POM prints — it\'s considered a "white whale" material',
      ],
      marketAdoption: 'Very niche in 3D printing due to extreme difficulty. Legendary in injection molding.',
    },
    tdsProfile: {
      properties: [
        { name: 'Tensile Strength', value: '60-70', unit: 'MPa', implications: 'Good. Strong engineering material.' },
        { name: 'Coefficient of Friction', value: '0.1-0.3', unit: '', implications: 'Extremely Low. Self-lubricating.' },
        { name: 'Fatigue Endurance', value: 'Excellent', unit: '', implications: 'Can withstand millions of cycles without failure.' },
        { name: 'Water Absorption', value: '0.2-0.4', unit: '%', implications: 'Very Low. Dimensionally stable in humid environments.' },
        { name: 'Melting Point', value: '175', unit: '°C', implications: 'Moderate melting point.' },
      ],
      notes: 'Mechanical properties are excellent but 3D printing POM is extremely challenging.',
    },
    printSettings: {
      nozzleTemp: { min: 200, max: 225, optimal: 210 },
      bedTemp: { min: 100, max: 140, optimal: 120 },
      coolingFan: { min: 0, max: 30, notes: 'Minimal cooling — POM shrinks and warps.' },
      enclosure: { required: true, notes: 'Strongly recommended. Also needed for fume management.' },
      drying: { temp: 80, duration: '4-6 hours', notes: 'Low moisture absorption but drying improves print quality.' },
      printSpeed: { recommended: '20-40 mm/s', notes: 'Very slow speeds required for any chance of success.' },
      additionalNotes: [
        'VENTILATION REQUIRED — formaldehyde risk at elevated temps',
        'Specialty bed surface needed (POM adhesion sheet, Magigoo POM, or roughened PP sheet)',
        'Brim highly recommended',
        'Consider whether POM is truly necessary vs nylon',
      ],
    },
    adhesion: {
      bedSurfaces: {
        excellent: ['POM-specific adhesion sheets'],
        good: ['Roughened PP sheet', 'Magigoo POM adhesive'],
        poor: ['PEI', 'Glass', 'Blue tape — NOTHING sticks to POM easily'],
      },
      releaseAgents: 'The problem is the opposite — getting POM to STICK at all.',
    },
    postProcessing: {
      chemicalSmoothing: [
        { method: 'Chemical', effectiveness: 'Difficult', notes: 'POM resists most solvents.' },
      ],
      mechanical: ['Machines beautifully', 'Can be turned, milled, drilled with excellent results', 'Takes threads perfectly'],
      glues: ['Specialty POM adhesives', 'Cyanoacrylate with POM primer', 'Mechanical fastening preferred'],
      painting: 'Very difficult — nothing sticks to POM. Flame treatment or plasma treatment required.',
    },
    safety: {
      fumes: { level: 'High', notes: 'FORMALDEHYDE risk if overheated. MUST use in ventilated area or with filtration. Do NOT exceed recommended temperatures.' },
      foodSafety: { rating: 'FDA Approved (Injection Molded)', notes: 'FDA approved in injection-molded form. Printed parts have porosity and fume exposure concerns.' },
      biodegradability: { rating: 'Not Biodegradable', notes: 'Stable engineering polymer.' },
      additionalNotes: [
        'CRITICAL: Adequate ventilation required',
        'Do not exceed 225°C nozzle temperature',
        'Monitor for sweet/chemical smell — indicates formaldehyde release',
      ],
    },
  },

  'PMMA': {
    name: 'PMMA',
    fullName: 'Polymethyl Methacrylate (Acrylic)',
    origin: {
      yearInvented: '1928',
      originalCompany: 'Röhm & Haas (now Evonik) — Plexiglas',
      keyMilestones: [
        '1928: First synthesized',
        '1933: Commercialized as Plexiglas',
        '2019+: FDM PMMA filaments appear',
      ],
      majorManufacturers: ['Evonik', 'BASF', 'Polymaker'],
    },
    composition: {
      basePolymer: 'Polymethyl Methacrylate (PMMA)',
      chemicalFamily: 'Acrylic Polymer',
      keyAdditives: ['UV stabilizers', 'Impact modifiers', 'Clarity enhancers'],
      coloringAgents: 'Excellent optical clarity. Available clear and colored.',
    },
    familyContext: {
      parentPolymer: 'Standalone acrylic polymer',
      variants: ['PMMA', 'Impact-modified PMMA'],
      chemicalComparison: 'Best optical clarity of any thermoplastic (92% light transmission). Glass-like but lighter.',
    },
    strengths: {
      uniqueProperties: ['Best optical clarity of any plastic (92%)', 'Weather resistant', 'Scratch-resistant surface', 'UV stable'],
      bestUseScenarios: ['Light guides', 'Lenses', 'Display cases', 'Transparent enclosures', 'Signage'],
      advantagesOverCompetitors: ['Clearer than PETG or PCTG', 'Better UV resistance than PC', 'Scratch resistant'],
      whyChooseThis: 'When optical clarity is paramount — the closest thing to printing glass.',
    },
    weaknesses: {
      limitations: ['Brittle (shatters like glass)', 'Difficult to print', 'Warps', 'Sensitive to stress cracking'],
      commonProblems: ['Cracking under stress', 'Warping', 'Poor layer adhesion without proper temps'],
      whenNotToUse: ['Impact-prone applications', 'Structural parts', 'Without enclosure'],
    },
    practicalContext: {
      industryAdoption: ['Signage', 'Automotive (tail lights)', 'Architecture', 'Medical'],
      commonApplications: ['Light pipes', 'Transparent covers', 'Aquarium windows', 'Signage', 'Display cases'],
      costPosition: 'Premium',
    },
    trivia: {
      funFacts: [
        'PMMA is what Plexiglas, Lucite, and Perspex are made from',
        '92% light transmission — almost as clear as glass (93%)',
        'Used in aircraft canopies since WWII',
      ],
      whyInvented: 'Created as a shatter-resistant alternative to glass.',
      marketAdoption: 'Very niche in 3D printing due to difficulty, but valued for optical applications.',
    },
    tdsProfile: {
      properties: [
        { name: 'Tensile Strength', value: '50-75', unit: 'MPa', implications: 'Good, but fails by shattering.' },
        { name: 'Light Transmission', value: '92', unit: '%', implications: 'Outstanding. Near-glass clarity.' },
        { name: 'Impact Strength', value: '10-15', unit: 'kJ/m²', implications: 'Very Low. Shatters on impact.' },
        { name: 'Glass Transition', value: '105', unit: '°C', implications: 'Good heat resistance.' },
      ],
    },
    printSettings: {
      nozzleTemp: { min: 230, max: 260, optimal: 245 },
      bedTemp: { min: 80, max: 110, optimal: 95 },
      coolingFan: { min: 0, max: 30, notes: 'Minimal cooling to prevent cracking.' },
      enclosure: { required: true, notes: 'Required to prevent cracking from thermal stress.' },
      drying: { temp: 70, duration: '4-6 hours', notes: 'Moderate moisture sensitivity.' },
      printSpeed: { recommended: '20-40 mm/s', notes: 'Slow speeds for clarity and adhesion.' },
    },
    adhesion: {
      bedSurfaces: {
        excellent: ['Glass with PMMA-specific adhesive'],
        good: ['PEI with glue stick'],
        poor: ['Most standard surfaces'],
      },
      releaseAgents: 'PMMA-specific adhesion solutions.',
    },
    postProcessing: {
      chemicalSmoothing: [
        { method: 'Acetone', effectiveness: 'Not Possible', notes: 'Causes stress cracking.' },
        { method: 'Chloroform/Dichloromethane vapor', effectiveness: 'Excellent', notes: 'Best smoothing result but EXTREMELY toxic.' },
      ],
      mechanical: ['Polishes to optical clarity', 'Can be flame polished', 'Sands with fine grit'],
      glues: ['Acrylic cement (Weld-On)', 'Cyanoacrylate'],
      painting: 'Usually kept transparent. Can be painted from the back for backlit signs.',
    },
    safety: {
      fumes: { level: 'Moderate', notes: 'Methacrylate fumes. Requires ventilation.' },
      foodSafety: { rating: 'FDA Grades Exist', notes: 'FDA approved in injection-molded form.' },
      biodegradability: { rating: 'Not Biodegradable', notes: 'Petroleum-based acrylic.' },
    },
  },

  'HDPE': {
    name: 'HDPE',
    fullName: 'High-Density Polyethylene',
    origin: {
      yearInvented: '1953',
      originalCompany: 'Karl Ziegler at Max Planck Institute',
      keyMilestones: [
        '1953: Ziegler discovers catalytic polymerization of ethylene',
        '1955: Commercial HDPE production begins',
        '2020+: HDPE filaments appear for 3D printing',
      ],
      majorManufacturers: ['LyondellBasell', 'SABIC', 'Limited filament availability'],
    },
    composition: {
      basePolymer: 'High-Density Polyethylene',
      chemicalFamily: 'Polyolefin',
      keyAdditives: ['UV stabilizers', 'Antioxidants'],
      coloringAgents: 'Natural is translucent white. Various colors available.',
    },
    familyContext: {
      parentPolymer: 'Part of the Polyethylene family (with LDPE, LLDPE)',
      variants: ['HDPE', 'UHMWPE (ultra-high molecular weight)'],
      chemicalComparison: 'Extremely chemical resistant. Nothing sticks to it — which is both its strength and its 3D printing challenge.',
    },
    strengths: {
      uniqueProperties: ['Outstanding chemical resistance', 'Food-safe', 'Very lightweight', 'Extremely low moisture absorption'],
      bestUseScenarios: ['Chemical containers', 'Food storage', 'Water-contact parts', 'Lightweight structural parts'],
      advantagesOverCompetitors: ['Most chemical resistant common plastic', 'Truly food-safe', 'Lightest engineering plastic'],
      whyChooseThis: 'When chemical resistance and food safety are the top priority.',
    },
    weaknesses: {
      limitations: ['Almost impossible to 3D print (nothing sticks)', 'Severe warping', 'Very poor bed adhesion', 'Low stiffness'],
      commonProblems: ['Zero bed adhesion on standard surfaces', 'Extreme warping', 'Poor layer adhesion'],
      whenNotToUse: ['Standard 3D printing setups', 'When other materials can work'],
    },
    practicalContext: {
      industryAdoption: ['Packaging', 'Piping', 'Chemical storage', 'Food industry'],
      commonApplications: ['Milk jugs', 'Chemical drums', 'Water pipes', 'Cutting boards'],
      costPosition: 'Budget',
    },
    trivia: {
      funFacts: [
        'HDPE is the most widely produced plastic in the world',
        'Your milk jug is HDPE',
        'HDPE is one of the hardest materials to 3D print — nothing sticks to it',
      ],
      whyInvented: 'Revolutionary discovery of catalytic polymerization — won Ziegler the Nobel Prize.',
      marketAdoption: 'Extremely niche in 3D printing due to near-impossible printability.',
    },
    tdsProfile: {
      properties: [
        { name: 'Tensile Strength', value: '25-40', unit: 'MPa', implications: 'Moderate.' },
        { name: 'Chemical Resistance', value: 'Outstanding', unit: '', implications: 'Resists nearly all chemicals.' },
        { name: 'Water Absorption', value: '<0.01', unit: '%', implications: 'Essentially zero moisture absorption.' },
        { name: 'Density', value: '0.94-0.97', unit: 'g/cm³', implications: 'Lighter than water.' },
      ],
    },
    printSettings: {
      nozzleTemp: { min: 220, max: 260, optimal: 240 },
      bedTemp: { min: 80, max: 120, optimal: 100 },
      coolingFan: { min: 0, max: 20, notes: 'Minimal cooling.' },
      enclosure: { required: true, notes: 'Required for warp prevention.' },
      drying: { temp: 60, duration: '4 hours', notes: 'Not hygroscopic, but drying removes surface moisture.' },
      printSpeed: { recommended: '20-30 mm/s', notes: 'Very slow speeds needed.' },
      additionalNotes: [
        'EXTREMELY DIFFICULT TO PRINT',
        'Must print on HDPE sheet or PP surface (like sticks to like)',
        'Wide brim essential',
        'Consider whether HDPE is truly necessary',
      ],
    },
    adhesion: {
      bedSurfaces: {
        excellent: ['HDPE sheet (like bonds to like)'],
        good: ['PP sheet'],
        poor: ['Everything else — PEI, glass, tape all fail'],
      },
      releaseAgents: 'The problem is getting it to stick, not release.',
    },
    postProcessing: {
      mechanical: ['Difficult to sand', 'Can be machined', 'Welded with hot air'],
      glues: ['Nothing glues well — flame/plasma treat first', 'Mechanical fastening preferred'],
      painting: 'Nothing adheres without flame or plasma treatment.',
    },
    safety: {
      fumes: { level: 'Low', notes: 'Low emissions. Polyethylene is among the safest plastics.' },
      foodSafety: { rating: 'FDA Approved', notes: 'One of the most common food-contact plastics.' },
      biodegradability: { rating: 'Not Biodegradable', notes: 'Persists indefinitely. Recyclable as #2 plastic.' },
    },
  },

  'PCL': {
    name: 'PCL',
    fullName: 'Polycaprolactone',
    origin: {
      yearInvented: '1930s',
      originalCompany: 'Various researchers',
      keyMilestones: [
        '1930s: First synthesized',
        '2000s: Used in medical/tissue engineering',
        '2016+: Appears in 3D printing as moldable/craftable material',
      ],
      majorManufacturers: ['Perstorp', 'Daicel', 'Various 3D printing brands'],
    },
    composition: {
      basePolymer: 'Polycaprolactone',
      chemicalFamily: 'Aliphatic Polyester',
      keyAdditives: ['Minimal — typically used neat'],
      coloringAgents: 'Natural is translucent white. Can be colored.',
    },
    familyContext: {
      parentPolymer: 'Standalone biodegradable polyester',
      variants: ['PCL (standard)', 'PCL blends'],
      chemicalComparison: 'Ultra-low melting point (60°C). Becomes moldable in hot water. Truly biodegradable.',
    },
    strengths: {
      uniqueProperties: ['Moldable by hand in hot water (60°C)', 'Truly biodegradable', 'Biocompatible (medical implants)', 'Non-toxic'],
      bestUseScenarios: ['Custom molds', 'Orthopedic splints', 'Art/craft projects', 'Educational tools', 'Temporary fixtures'],
      advantagesOverCompetitors: ['Can be reshaped after printing', 'FDA approved for medical implants', 'Truly biodegradable'],
      whyChooseThis: 'When you need moldable, reshapeable, biocompatible parts — or truly biodegradable printing.',
    },
    weaknesses: {
      limitations: ['Extremely low heat resistance (60°C melting!)', 'Soft and flexible', 'Not suitable for any structural use', 'Deforms on warm days'],
      commonProblems: ['Parts deform near body temperature', 'Very soft — dents easily'],
      whenNotToUse: ['Any structural application', 'Warm environments', 'Parts requiring rigidity'],
    },
    practicalContext: {
      industryAdoption: ['Medical devices', 'Tissue engineering', 'Drug delivery', 'Crafts'],
      commonApplications: ['Custom splints', 'Dental models', 'Crafting', 'Moldable prototypes'],
      costPosition: 'Standard',
    },
    trivia: {
      funFacts: [
        'PCL becomes as soft as modeling clay in hot water',
        'Used in medical implants that dissolve naturally in the body',
        'Can be "welded" by pressing warm pieces together',
      ],
      whyInvented: 'Developed for biodegradable medical applications.',
      marketAdoption: 'Niche — used for craft/medical/moldable applications.',
    },
    tdsProfile: {
      properties: [
        { name: 'Melting Point', value: '58-60', unit: '°C', implications: 'VERY Low. Hot water melts it. This is the key property.' },
        { name: 'Tensile Strength', value: '15-25', unit: 'MPa', implications: 'Low. Soft material.' },
        { name: 'Biodegradation', value: '2-4 years', unit: 'in soil', implications: 'Truly biodegradable — unlike PLA\'s false claims.' },
      ],
    },
    printSettings: {
      nozzleTemp: { min: 70, max: 120, optimal: 90 },
      bedTemp: { min: 0, max: 30, optimal: 25 },
      coolingFan: { min: 100, max: 100, notes: 'Maximum cooling — material is very slow to solidify.' },
      enclosure: { required: false, notes: 'Not needed.' },
      printSpeed: { recommended: '20-40 mm/s', notes: 'Slow speeds for best results.' },
      additionalNotes: [
        'Lowest print temperature of any filament',
        'Many printers can\'t go low enough — check your minimum temp',
        'Bed must be COLD — warm beds prevent adhesion',
      ],
    },
    adhesion: {
      bedSurfaces: {
        excellent: ['Blue tape at room temp', 'Glass at room temp'],
        good: ['Most surfaces at room temperature'],
        poor: ['Any heated surface — PCL melts before bed temp is reached'],
      },
      releaseAgents: 'Not usually needed at room temperature.',
    },
    postProcessing: {
      mechanical: ['Moldable in 60°C water', 'Can be hand-shaped when warm', 'Cuts easily'],
      glues: ['Self-bonding when heated', 'Cyanoacrylate'],
      painting: 'Accepts paint. Be aware of low heat tolerance.',
    },
    safety: {
      fumes: { level: 'Very Low', notes: 'Non-toxic. Safe for classroom use. FDA approved for implants.' },
      foodSafety: { rating: 'Biocompatible', notes: 'FDA approved for medical implants and drug delivery.' },
      biodegradability: { rating: 'Fully Biodegradable', notes: 'Degrades naturally in 2-4 years. One of few truly biodegradable printing materials.' },
    },
  },

  'PHA': {
    name: 'PHA',
    fullName: 'Polyhydroxyalkanoate',
    origin: {
      yearInvented: '1926 (discovered)',
      originalCompany: 'Maurice Lemoigne (Institut Pasteur)',
      keyMilestones: [
        '1926: Discovered by Maurice Lemoigne',
        '1990s: Commercial production begins',
        '2018+: PHA filaments and PLA/PHA blends appear for 3D printing',
      ],
      majorManufacturers: ['ColorFabb', 'Danimer Scientific', 'KANEKA'],
    },
    composition: {
      basePolymer: 'Polyhydroxyalkanoate — produced by bacteria',
      chemicalFamily: 'Polyester (bio-produced)',
      keyAdditives: ['Often blended with PLA for printability'],
      coloringAgents: 'Natural is off-white. Can be colored.',
    },
    familyContext: {
      parentPolymer: 'Standalone bio-polyester produced by microorganisms',
      variants: ['PHA', 'PHB', 'PHBV', 'PLA/PHA blends', 'allPHA'],
      chemicalComparison: 'Unlike PLA, PHA is truly biodegradable in ocean, soil, and home compost. Stronger environmental credentials.',
    },
    strengths: {
      uniqueProperties: ['Truly biodegradable (home compost, ocean, soil)', 'Bio-produced from waste streams', 'Marine biodegradable', 'Non-toxic'],
      bestUseScenarios: ['Environmentally conscious projects', 'Single-use items', 'Marine applications', 'Composting-friendly products'],
      advantagesOverCompetitors: ['Actually biodegrades (unlike PLA in practice)', 'Ocean-degradable', 'Produced from waste/renewable sources'],
      whyChooseThis: 'The only truly eco-friendly 3D printing material — biodegrades in home compost and ocean.',
    },
    weaknesses: {
      limitations: ['Expensive', 'Harder to print than PLA', 'Limited availability', 'Properties vary widely by type'],
      commonProblems: ['Narrower temperature window than PLA', 'Moisture sensitivity', 'Brittleness in some grades'],
      whenNotToUse: ['Budget projects', 'When PLA\'s properties are sufficient'],
    },
    practicalContext: {
      industryAdoption: ['Packaging', 'Single-use items', 'Medical (sutures, implants)', 'Agriculture'],
      commonApplications: ['Compostable containers', 'Single-use items', 'Environmental projects', 'Bio-degradable prototypes'],
      costPosition: 'Premium',
    },
    trivia: {
      funFacts: [
        'PHA is literally produced by bacteria eating waste materials',
        'It\'s the only common 3D printing material that biodegrades in the ocean',
        'ColorFabb\'s PLA/PHA blend was an early champion of this material in 3D printing',
      ],
      whyInvented: 'Nature invented it — bacteria produce PHA as an energy storage mechanism.',
      marketAdoption: 'Small but growing as environmental awareness increases.',
    },
    tdsProfile: {
      properties: [
        { name: 'Tensile Strength', value: '25-45', unit: 'MPa', implications: 'Variable. PLA/PHA blends approach PLA strength.' },
        { name: 'Biodegradation', value: '3-6 months', unit: 'in compost', implications: 'Truly biodegradable in home compost conditions.' },
        { name: 'Marine Biodegradation', value: '1-2 years', unit: '', implications: 'Unique: actually biodegrades in ocean.' },
        { name: 'Glass Transition', value: '40-55', unit: '°C', implications: 'Lower than PLA in some grades.' },
      ],
    },
    printSettings: {
      nozzleTemp: { min: 180, max: 220, optimal: 200 },
      bedTemp: { min: 35, max: 60, optimal: 50 },
      coolingFan: { min: 80, max: 100, notes: 'High cooling like PLA.' },
      enclosure: { required: false, notes: 'Not required.' },
      drying: { temp: 45, duration: '4-6 hours', notes: 'Moderately hygroscopic.' },
      printSpeed: { recommended: '30-50 mm/s', notes: 'Slightly slower than PLA for best results.' },
    },
    adhesion: {
      bedSurfaces: {
        excellent: ['PEI (Textured)', 'Glass with glue'],
        good: ['Blue Tape', 'PEI (Smooth)'],
        poor: ['Bare aluminum'],
      },
      releaseAgents: 'Similar to PLA.',
    },
    postProcessing: {
      mechanical: ['Sands like PLA', 'Can be painted'],
      glues: ['Cyanoacrylate', 'Epoxy'],
      painting: 'Accepts paint well.',
    },
    safety: {
      fumes: { level: 'Very Low', notes: 'Non-toxic bio-polymer.' },
      foodSafety: { rating: 'Generally Safe', notes: 'Non-toxic polymer. Some grades have food contact approval.' },
      biodegradability: { rating: 'Fully Biodegradable', notes: 'Home compost: 3-6 months. Ocean: 1-2 years. The gold standard for biodegradable plastics.' },
    },
  },

  'PES': {
    name: 'PES',
    fullName: 'Polyethersulfone',
    origin: {
      yearInvented: '1972',
      originalCompany: 'ICI (now Solvay — Radel/Veradel)',
      keyMilestones: [
        '1972: PES commercialized',
        '2010s: Used in industrial 3D printing',
        '2020+: Limited FDM filaments available',
      ],
      majorManufacturers: ['Solvay', 'BASF', '3DXTech'],
    },
    composition: {
      basePolymer: 'Polyethersulfone',
      chemicalFamily: 'Polysulfone family',
      keyAdditives: ['Heat stabilizers', 'Flow modifiers'],
      coloringAgents: 'Natural is amber/transparent. Limited colors.',
    },
    familyContext: {
      parentPolymer: 'Part of the sulfone family (PSU, PPSU, PES)',
      variants: ['PES', 'PES-GF'],
      chemicalComparison: 'Higher heat resistance than PSU (220°C vs 180°C). Transparent amber color. Between PSU and PEEK in performance.',
    },
    strengths: {
      uniqueProperties: ['Very high continuous use temp (200°C+)', 'Excellent dimensional stability', 'Good transparency', 'Autoclavable'],
      bestUseScenarios: ['Sterilizable medical devices', 'Aerospace components', 'Hot water/steam applications', 'Transparent high-temp parts'],
      advantagesOverCompetitors: ['Transparent at high temps (unlike PEEK)', 'Cheaper than PEEK', 'Autoclavable'],
      whyChooseThis: 'When you need high temperature resistance with transparency — sterilizable medical and lab equipment.',
    },
    weaknesses: {
      limitations: ['Requires 350°C+ hotend', 'Needs heated chamber', 'Expensive', 'Very limited filament availability'],
      commonProblems: ['Difficult to print', 'Requires specialized equipment', 'Moisture sensitive'],
      whenNotToUse: ['Standard printers', 'When PSU or PPSU would suffice'],
    },
    practicalContext: {
      industryAdoption: ['Aerospace', 'Medical', 'Food processing', 'Membranes'],
      commonApplications: ['Sterilizable trays', 'Hot water fittings', 'Aircraft cabin parts', 'Filtration membranes'],
      costPosition: 'Industrial',
    },
    trivia: {
      funFacts: [
        'PES is used in water filtration membranes worldwide',
        'One of the few transparent plastics that survive steam sterilization',
      ],
      whyInvented: 'Developed for applications requiring high heat, transparency, and chemical resistance.',
      marketAdoption: 'Very niche in 3D printing. Industrial applications only.',
    },
    tdsProfile: {
      properties: [
        { name: 'Tensile Strength', value: '80-90', unit: 'MPa', implications: 'Excellent.' },
        { name: 'Glass Transition', value: '220-230', unit: '°C', implications: 'Very High. Between PSU and PEEK.' },
        { name: 'Continuous Use Temp', value: '200', unit: '°C', implications: 'Exceptional for a transparent material.' },
      ],
    },
    printSettings: {
      nozzleTemp: { min: 340, max: 380, optimal: 360 },
      bedTemp: { min: 120, max: 160, optimal: 140 },
      coolingFan: { min: 0, max: 10, notes: 'Minimal cooling.' },
      enclosure: { required: true, notes: 'REQUIRED. High chamber temperature needed.' },
      drying: { temp: 120, duration: '6-8 hours', notes: 'Must be thoroughly dried.' },
      printSpeed: { recommended: '15-30 mm/s', notes: 'Very slow printing.' },
      additionalNotes: [
        'Requires high-temperature capable printer ($10,000+)',
        'All-metal hotend rated for 380°C+ needed',
        'Print in controlled high-temp chamber',
      ],
    },
    adhesion: {
      bedSurfaces: {
        excellent: ['PEI (high-temp)', 'Specialty high-temp surfaces'],
        good: ['Garolite at high temps'],
        poor: ['Standard surfaces'],
      },
      releaseAgents: 'Usually not needed at these temperatures.',
    },
    postProcessing: {
      mechanical: ['Machines well', 'Can be polished for clarity'],
      glues: ['Specialty adhesives', 'Mechanical fastening'],
      painting: 'Difficult — chemically resistant surface.',
    },
    safety: {
      fumes: { level: 'Low', notes: 'Low emissions despite high print temps.' },
      foodSafety: { rating: 'FDA Approved Grades', notes: 'Used in food processing equipment.' },
      biodegradability: { rating: 'Not Biodegradable', notes: 'Extremely stable polymer.' },
    },
  },

  'BIO': {
    name: 'BIO',
    fullName: 'Bio-Based Filament',
    origin: {
      yearInvented: '2019+',
      originalCompany: 'Multiple manufacturers developing bio-based alternatives',
      keyMilestones: [
        '2019+: Various "BIO" branded filaments appear',
        '2021+: Growing interest in sustainable 3D printing materials',
      ],
      majorManufacturers: ['Fillamentum', 'Extrudr', 'ColorFabb', 'FormFutura'],
    },
    composition: {
      basePolymer: 'Various bio-based polymers (PLA blends, PHA blends, or bio-PETG)',
      chemicalFamily: 'Bio-based Polymer (varies by manufacturer)',
      keyAdditives: ['Bio-based modifiers', 'Natural fillers'],
      coloringAgents: 'Natural and bio-derived pigments where possible',
    },
    familyContext: {
      parentPolymer: 'Umbrella category for bio-derived printing materials',
      variants: ['BIO', 'BIO-CF', 'Bio-PETG', 'Bio-PA'],
      chemicalComparison: 'Properties vary widely — "BIO" is a marketing category, not a specific polymer.',
    },
    strengths: {
      uniqueProperties: ['Derived from renewable resources', 'Reduced carbon footprint', 'Some variants biodegradable', 'Environmental messaging'],
      bestUseScenarios: ['Environmentally conscious projects', 'Green prototyping', 'Eco-branded products'],
      advantagesOverCompetitors: ['Renewable feedstock', 'Lower carbon footprint than petroleum plastics'],
      whyChooseThis: 'When sustainability is a priority and you want materials derived from renewable sources.',
    },
    weaknesses: {
      limitations: ['"BIO" label means different things from different brands', 'Properties vary widely', 'Often more expensive', 'Not always biodegradable'],
      commonProblems: ['Inconsistent definition of "bio"', 'May not actually be more eco-friendly in total lifecycle'],
      whenNotToUse: ['When specific mechanical properties are needed (use specific material)', 'When "bio" credentials are unimportant'],
    },
    practicalContext: {
      industryAdoption: ['Sustainable design', 'Green packaging prototypes', 'Education'],
      commonApplications: ['Eco-branded products', 'Sustainable packaging prototypes', 'Educational projects'],
      costPosition: 'Premium',
    },
    trivia: {
      funFacts: [
        '"Bio" can mean bio-derived, bio-degradable, or both — always check the specific material',
        'Some bio-based plastics perform identically to their petroleum counterparts',
      ],
      whyInvented: 'Market demand for more sustainable 3D printing materials.',
      marketAdoption: 'Growing with sustainability awareness but still niche.',
    },
    tdsProfile: {
      properties: [
        { name: 'Properties', value: 'Varies', unit: '', implications: 'Depends entirely on the specific base polymer and formulation.' },
        { name: 'Bio Content', value: '30-100', unit: '%', implications: 'Percentage of material derived from biological sources.' },
      ],
      notes: '"BIO" is a category, not a material. Check specific product datasheets.',
    },
    printSettings: {
      nozzleTemp: { min: 190, max: 240 },
      bedTemp: { min: 40, max: 80 },
      coolingFan: { min: 50, max: 100, notes: 'Depends on base polymer.' },
      enclosure: { required: false, notes: 'Usually not required.' },
      drying: { temp: 50, duration: '4-6 hours', notes: 'Check specific material.' },
      printSpeed: { recommended: '30-60 mm/s', notes: 'Follow base polymer guidelines.' },
      additionalNotes: ['Check specific product datasheet — "BIO" properties vary dramatically by brand and formulation'],
    },
    adhesion: {
      bedSurfaces: {
        excellent: ['PEI (Textured)', 'Glass with glue'],
        good: ['PEI (Smooth)', 'Blue Tape'],
        poor: ['Depends on formulation'],
      },
      releaseAgents: 'Follow base polymer guidelines.',
    },
    postProcessing: {
      mechanical: ['Depends on base polymer'],
      glues: ['Cyanoacrylate', 'Epoxy'],
      painting: 'Usually accepts paint well.',
    },
    safety: {
      fumes: { level: 'Low', notes: 'Generally low emissions.' },
      foodSafety: { rating: 'Check Specific Grade', notes: 'Varies by formulation.' },
      biodegradability: { rating: 'Varies', notes: 'Bio-derived ≠ biodegradable. Check specific product claims.' },
    },
  },
};

export function getMaterialReference(material: string): MaterialReferenceInfo | undefined {
  return MATERIAL_REFERENCE_DATA[material];
}

export function getAllMaterialsWithReference(): string[] {
  return Object.keys(MATERIAL_REFERENCE_DATA);
}
