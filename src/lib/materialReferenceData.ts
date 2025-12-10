// Comprehensive material reference data for the encyclopedia

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
        'Printing TPU at high speed is a benchmark test for printer capabilities',
      ],
      whyInvented: 'Created to combine rubber-like properties with the processability of thermoplastics.',
      controversies: [
        'Many printers cannot handle TPU without hardware modifications',
        '"Flexible filament" is often used to sell any TPU when hardness varies greatly',
      ],
      marketAdoption: 'Slow initial adoption due to printing difficulty, but now essential for flexible applications.',
    },
  },

  'Nylon': {
    name: 'Nylon',
    fullName: 'Polyamide (PA6, PA12, etc.)',
    origin: {
      yearInvented: '1935',
      originalCompany: 'Wallace Carothers at DuPont',
      keyMilestones: [
        '1935: Wallace Carothers invents nylon at DuPont',
        '1938: First commercial nylon product (toothbrush bristles)',
        '1939: Nylon stockings debut at World\'s Fair',
        '2012+: Nylon filaments enter 3D printing market',
        '2018+: Nylon-CF becomes popular for engineering',
      ],
      majorManufacturers: ['DuPont', 'BASF', 'DSM', 'Taulman3D', 'Polymaker', 'MatterHackers'],
    },
    composition: {
      basePolymer: 'Polyamide (PA6, PA66, PA12 are common types)',
      chemicalFamily: 'Polyamide',
      keyAdditives: ['Glass fibers (PA-GF)', 'Carbon fibers (PA-CF)', 'Aramid fibers (PA-AF)'],
      coloringAgents: 'Natural nylon is off-white, can be colored but absorbs dye post-print',
      specialFillers: ['Carbon fiber', 'Glass fiber', 'Aramid fiber', 'Kevlar'],
    },
    familyContext: {
      parentPolymer: 'Polyamide family - various types based on monomer chain length',
      variants: ['PA6', 'PA66', 'PA12', 'Nylon-CF', 'Nylon-GF', 'Nylon-AF'],
      chemicalComparison: 'PA12 is easier to print (less warping), PA6/66 are stronger but more hygroscopic.',
      evolution: 'From WWII parachutes to modern 3D printed end-use parts.',
    },
    strengths: {
      uniqueProperties: ['Exceptional wear resistance', 'Self-lubricating', 'Fatigue resistant', 'High strength'],
      bestUseScenarios: ['Gears and bearings', 'Living hinges', 'Snap-fits', 'Functional mechanical parts'],
      advantagesOverCompetitors: ['Best wear resistance available', 'Excellent for moving parts', 'High fatigue life'],
      whyChooseThis: 'For mechanical parts that will see repeated stress, wear, or need to slide against each other.',
    },
    weaknesses: {
      limitations: ['Extremely hygroscopic', 'Warps significantly', 'Requires dry storage', 'Needs enclosure'],
      commonProblems: ['Moisture absorption ruins prints', 'Warping and layer splitting', 'Requires very dry filament'],
      environmentalConcerns: ['Petroleum-based', 'Energy-intensive production', 'Not biodegradable'],
      whenNotToUse: ['Humid environments without sealing', 'Printers without enclosures', 'When dry box not available'],
    },
    practicalContext: {
      industryAdoption: ['Automotive', 'Aerospace', 'Industrial machinery', 'Consumer goods', 'Medical'],
      commonApplications: ['Gears', 'Bearings', 'Cable ties', 'Bushings', 'Tool handles', 'Jigs and fixtures'],
      safetyStandards: ['FDA grades available', 'Various aerospace certifications (Nylon-CF)'],
      costPosition: 'Premium',
    },
    trivia: {
      funFacts: [
        'Nylon was the first truly synthetic fiber',
        'Name allegedly comes from "New York" + "London"',
        'Nylon stockings caused "nylon riots" in 1945 due to demand',
        'Nylon can absorb 2-8% of its weight in water from humidity',
      ],
      whyInvented: 'DuPont wanted a synthetic replacement for silk, especially for parachutes and stockings.',
      controversies: [
        'Moisture sensitivity is often understated by manufacturers',
        'Many "nylon" filaments are blends that don\'t perform like true nylon',
        'Requires specialized drying equipment many users don\'t have',
      ],
      marketAdoption: 'Slow adoption due to difficulty - now recognized as essential for engineering but requires expertise.',
    },
  },

  'PC': {
    name: 'PC',
    fullName: 'Polycarbonate',
    origin: {
      yearInvented: '1953 (simultaneously by two companies)',
      originalCompany: 'Hermann Schnell at Bayer and Daniel Fox at GE (both 1953)',
      keyMilestones: [
        '1953: Independently invented at Bayer and GE',
        '1958: Commercial production begins',
        '1982: CDs made from polycarbonate revolutionize data storage',
        '2015+: PC filaments become available for 3D printing',
      ],
      majorManufacturers: ['Covestro (Makrolon, formerly Bayer)', 'SABIC (Lexan, formerly GE)', 'Polymaker', 'Prusament'],
    },
    composition: {
      basePolymer: 'Polycarbonate',
      chemicalFamily: 'Carbonate Polymer',
      keyAdditives: ['UV stabilizers', 'Flame retardants (PC-FR)', 'Impact modifiers'],
      coloringAgents: 'Can be perfectly clear or colored, maintains optical clarity',
      specialFillers: ['Carbon fiber (PC-CF)', 'Glass fiber (PC-GF)'],
    },
    familyContext: {
      parentPolymer: 'Polycarbonate of bisphenol A (BPA) - note: BPA controversy',
      variants: ['PC', 'PC-CF', 'PC-ABS', 'PC-FR', 'PC-PBT'],
      chemicalComparison: 'Much higher impact and heat resistance than ABS, but more difficult to process.',
      evolution: 'From bulletproof windows to 3D printed functional parts.',
    },
    strengths: {
      uniqueProperties: ['Near-unbreakable (bulletproof glass material)', 'Optical clarity', 'High heat resistance (140°C)', 'Self-extinguishing'],
      bestUseScenarios: ['Impact-resistant parts', 'High-temperature applications', 'Safety equipment', 'Clear structural parts'],
      advantagesOverCompetitors: ['Strongest common thermoplastic', 'Best impact resistance', 'High working temperature'],
      whyChooseThis: 'When parts absolutely cannot break, or when high temperature resistance is critical.',
    },
    weaknesses: {
      limitations: ['Requires 110°C+ bed and enclosure', 'Scratches easily', 'UV yellowing', 'Notch-sensitive (cracks from sharp corners)'],
      commonProblems: ['Extreme warping', 'Requires high-temp printer', 'Layer adhesion issues', 'Moisture sensitive'],
      environmentalConcerns: ['BPA content is controversial', 'Not biodegradable', 'Energy-intensive to produce'],
      whenNotToUse: ['Printers without enclosures/high-temp capability', 'When scratch resistance needed', 'Outdoor UV exposure'],
    },
    practicalContext: {
      industryAdoption: ['Automotive', 'Aerospace', 'Electronics', 'Safety equipment', 'Medical devices'],
      commonApplications: ['Safety glasses', 'Phone cases', 'Automotive headlight housings', 'Bullet-resistant panels', 'CDs/DVDs'],
      safetyStandards: ['UL94 V-0 rated grades', 'Various impact certifications', 'Medical grades available'],
      costPosition: 'Premium',
    },
    trivia: {
      funFacts: [
        'Lexan is so tough it\'s used for bulletproof windows',
        'Every CD and DVD is made from polycarbonate',
        'Baby bottles switched away from PC due to BPA concerns (2008-2012)',
        'The Space Station cupola windows are polycarbonate',
      ],
      whyInvented: 'Both Bayer and GE independently sought a clear, tough engineering plastic.',
      controversies: [
        'BPA (bisphenol A) is a component - health concerns led to "BPA-free" movement',
        'Requires specialized printing equipment many users don\'t have',
        'Often marketed as "easy PC" when blended with ABS',
      ],
      marketAdoption: 'Niche adoption - only users with proper equipment (high temp, enclosure) can successfully print it.',
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
  },
};

export function getMaterialReference(material: string): MaterialReferenceInfo | undefined {
  return MATERIAL_REFERENCE_DATA[material];
}

export function getAllMaterialsWithReference(): string[] {
  return Object.keys(MATERIAL_REFERENCE_DATA);
}
