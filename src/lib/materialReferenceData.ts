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

  // Add more materials as needed - keeping this extensible
};

export function getMaterialReference(material: string): MaterialReferenceInfo | undefined {
  return MATERIAL_REFERENCE_DATA[material];
}

export function getAllMaterialsWithReference(): string[] {
  return Object.keys(MATERIAL_REFERENCE_DATA);
}
