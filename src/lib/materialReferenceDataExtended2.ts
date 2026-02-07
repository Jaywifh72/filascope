// Extended material reference data - Part 2
// Covers flexible, high-performance, engineering, bio, and specialty materials
import type { MaterialReferenceInfo } from './materialReferenceData';

export const EXTENDED_MATERIAL_REFERENCE_DATA_2: Record<string, MaterialReferenceInfo> = {

  'TPE': {
    name: 'TPE',
    fullName: 'Thermoplastic Elastomer',
    origin: {
      yearInvented: '1950s',
      originalCompany: 'Various chemical companies',
      majorManufacturers: ['NinjaTek', 'Fillamentum', 'Recreus', 'Fiberlogy'],
    },
    composition: {
      basePolymer: 'Thermoplastic Elastomer (block copolymer)',
      chemicalFamily: 'Styrene-Based Elastomer (SBS, SEBS)',
      keyAdditives: ['Processing aids', 'UV stabilizers', 'Slip agents'],
    },
    familyContext: {
      parentPolymer: 'Broad family including SBS, SEBS, and styrenic block copolymers',
      variants: ['TPE-S (styrenic)', 'TPE-O (olefinic)', 'TPE-E (ester)', 'SEBS'],
      chemicalComparison: 'Softer and more elastic than TPU. Less abrasion resistance but better compression set.',
    },
    strengths: {
      uniqueProperties: ['Very soft and flexible', 'Excellent elasticity', 'Good compression set recovery', 'Chemical resistant'],
      bestUseScenarios: ['Soft-touch grips', 'Gaskets', 'Seals', 'Vibration dampening', 'Shoe soles'],
      advantagesOverCompetitors: ['Softer than most TPU', 'Better elastic recovery', 'Can be very soft (Shore 30A+)'],
      whyChooseThis: 'When you need extremely soft, rubber-like parts with good elastic memory.',
    },
    weaknesses: {
      limitations: ['Very difficult to print', 'Requires direct drive', 'Extremely slow print speeds', 'Limited availability'],
      commonProblems: ['Buckling in Bowden systems', 'Stringing', 'Poor bridging', 'Difficult retraction'],
      whenNotToUse: ['Bowden extruders', 'Parts needing rigidity', 'High-temp environments'],
    },
    practicalContext: {
      commonApplications: ['Grips', 'Bumpers', 'Seals', 'Soft toys', 'Wearables'],
      costPosition: 'Premium',
    },
    trivia: {
      funFacts: ['TPE is the material used in most soft-touch toothbrush grips', 'Can be stretched to 300-500% before breaking'],
      whyInvented: 'To combine rubber-like properties with thermoplastic processability.',
      marketAdoption: 'Niche in 3D printing due to printing difficulty.',
    },
    tdsProfile: {
      properties: [
        { name: 'Shore Hardness', value: '30A-90A', unit: '', implications: 'Very soft to medium flexible.' },
        { name: 'Tensile Strength', value: '8-25', unit: 'MPa', implications: 'Lower than TPU but more elastic.' },
        { name: 'Elongation at Break', value: '300-600', unit: '%', implications: 'Excellent stretch.' },
      ],
    },
    printSettings: {
      nozzleTemp: { min: 210, max: 240, optimal: 225 },
      bedTemp: { min: 40, max: 60, optimal: 50 },
      coolingFan: { min: 20, max: 60 },
      enclosure: { required: false },
      drying: { temp: 50, duration: '4-6 hours' },
      printSpeed: { recommended: '10-25 mm/s', notes: 'Extremely slow. Direct drive only.' },
      additionalNotes: ['DIRECT DRIVE MANDATORY', 'Disable retraction or minimize to 0.5mm', 'Very slow speeds essential'],
    },
    safety: {
      fumes: { level: 'Low', notes: 'Low emissions at printing temperatures.' },
      foodSafety: { rating: 'Check Brand', notes: 'Some TPE grades are food safe.' },
      biodegradability: { rating: 'Not Biodegradable', notes: 'Petroleum-based elastomer.' },
    },
  },

  'TPC': {
    name: 'TPC',
    fullName: 'Thermoplastic Copolyester Elastomer',
    origin: {
      yearInvented: '1970s',
      originalCompany: 'DuPont (Hytrel brand)',
      majorManufacturers: ['DSM', 'DuPont', 'Polymaker', 'Fillamentum'],
    },
    composition: {
      basePolymer: 'Copolyester elastomer (hard and soft segments)',
      chemicalFamily: 'Polyester-Based Thermoplastic Elastomer (TPE-E)',
      keyAdditives: ['Heat stabilizers', 'UV stabilizers'],
    },
    familyContext: {
      parentPolymer: 'Ester-based TPE combining polyester hard segments with polyether soft segments',
      variants: ['TPC-ET', 'Hytrel', 'Arnitel'],
      chemicalComparison: 'Better heat and chemical resistance than TPU. More expensive but outperforms in demanding environments.',
    },
    strengths: {
      uniqueProperties: ['Excellent heat resistance for a flexible material', 'Chemical resistant', 'Good fatigue life', 'UV resistant'],
      bestUseScenarios: ['Automotive hoses', 'Industrial seals', 'High-temp flexible parts', 'Chemical-exposed gaskets'],
      advantagesOverCompetitors: ['Better heat resistance than TPU', 'Better chemical resistance than TPE', 'Excellent fatigue life'],
      whyChooseThis: 'When flexible parts need to survive heat, chemicals, or repeated flex cycles.',
    },
    weaknesses: {
      limitations: ['Expensive', 'Limited availability in filament form', 'Requires tuning', 'Less common knowledge base'],
      commonProblems: ['Moisture sensitivity', 'Requires drying', 'Limited color options'],
      whenNotToUse: ['When TPU works fine', 'Budget projects', 'Maximum softness needed'],
    },
    practicalContext: {
      commonApplications: ['Automotive connectors', 'Industrial seals', 'Cable jackets', 'Bellows', 'Living hinges'],
      costPosition: 'Industrial',
    },
    trivia: {
      funFacts: ['DuPont Hytrel has been used in automotive applications for decades', 'TPC can withstand 150°C+ continuous use'],
      whyInvented: 'Automotive industry needed a flexible material that could handle under-hood temperatures.',
      marketAdoption: 'Niche in 3D printing but well-established in injection molding.',
    },
    printSettings: {
      nozzleTemp: { min: 220, max: 260, optimal: 240 },
      bedTemp: { min: 60, max: 80, optimal: 70 },
      coolingFan: { min: 20, max: 60 },
      enclosure: { required: false },
      drying: { temp: 60, duration: '4-6 hours', notes: 'Moisture sensitive. Dry thoroughly.' },
      printSpeed: { recommended: '20-40 mm/s' },
      additionalNotes: ['Direct drive recommended', 'Higher temps than TPU'],
    },
    safety: {
      fumes: { level: 'Low', notes: 'Low emissions.' },
      foodSafety: { rating: 'Check Brand', notes: 'Some grades FDA approved.' },
      biodegradability: { rating: 'Not Biodegradable' },
    },
  },

  'PEBA': {
    name: 'PEBA',
    fullName: 'Polyether Block Amide',
    origin: {
      yearInvented: '1980s',
      originalCompany: 'Arkema (Pebax brand)',
      majorManufacturers: ['Arkema', 'Lehvoss', 'Polymaker', 'Fillamentum'],
    },
    composition: {
      basePolymer: 'Block copolymer of polyamide and polyether',
      chemicalFamily: 'Polyamide Elastomer',
      keyAdditives: ['Processing aids', 'Stabilizers'],
    },
    familyContext: {
      parentPolymer: 'Combines rigid polyamide blocks with flexible polyether blocks',
      variants: ['PEBA 85A', 'PEBA 95A', 'PEBA Air (foamed)', 'Pebax'],
      chemicalComparison: 'Lighter and more elastic than TPU at similar hardness. Better energy return.',
    },
    strengths: {
      uniqueProperties: ['Excellent energy return', 'Very lightweight', 'Low hysteresis', 'Wide temperature range'],
      bestUseScenarios: ['Athletic footwear midsoles', 'Sporting goods', 'Shock absorption', 'Lightweight flexible parts'],
      advantagesOverCompetitors: ['Better energy return than TPU', 'Lighter than TPU', 'Maintains flexibility at low temperatures'],
      whyChooseThis: 'When weight and energy return matter — like athletic shoe midsoles.',
    },
    weaknesses: {
      limitations: ['Very expensive', 'Limited availability', 'Difficult to print', 'Moisture sensitive (nylon component)'],
      commonProblems: ['Requires careful drying', 'Printing challenges similar to TPU', 'Limited manufacturer support'],
      whenNotToUse: ['Budget applications', 'When TPU suffices', 'Without direct drive extruder'],
    },
    practicalContext: {
      commonApplications: ['Shoe midsoles', 'Ski boots', 'Sports equipment', 'Medical devices', 'Vibration dampening'],
      costPosition: 'Industrial',
    },
    trivia: {
      funFacts: ['Pebax is the material in Nike Vaporfly running shoes', 'PEBA has the best energy return of any printable flexible material', 'Used in high-end ski boots since the 1990s'],
      whyInvented: 'Athletic footwear industry needed a lightweight, high-energy-return material.',
      marketAdoption: 'Growing in 3D printing, established in injection molding for sporting goods.',
    },
    printSettings: {
      nozzleTemp: { min: 220, max: 260, optimal: 240 },
      bedTemp: { min: 50, max: 70, optimal: 60 },
      coolingFan: { min: 20, max: 60 },
      enclosure: { required: false },
      drying: { temp: 70, duration: '6-8 hours', notes: 'Critical — polyamide component absorbs moisture aggressively.' },
      printSpeed: { recommended: '15-35 mm/s' },
      additionalNotes: ['DIRECT DRIVE REQUIRED', 'Must be dried — nylon component is hygroscopic', 'Print from dry box ideally'],
    },
    safety: {
      fumes: { level: 'Low', notes: 'Low emissions at normal temps.' },
      foodSafety: { rating: 'Check Brand', notes: 'Some grades are biocompatible.' },
      biodegradability: { rating: 'Not Biodegradable' },
    },
  },

  'PEBA 85A': {
    name: 'PEBA 85A',
    fullName: 'Polyether Block Amide 85A Shore Hardness',
    origin: {
      majorManufacturers: ['Arkema', 'Lehvoss', 'Recreus'],
    },
    composition: {
      basePolymer: 'Soft-grade PEBA',
      chemicalFamily: 'Polyamide Elastomer',
    },
    familyContext: {
      parentPolymer: 'PEBA at softer durometer',
      variants: ['PEBA 85A'],
      chemicalComparison: 'Softer than PEBA 95A. More flexible with higher energy return per flex.',
    },
    strengths: {
      uniqueProperties: ['Very soft and elastic', 'Excellent energy return', 'Lightweight', 'Low-temp flexibility'],
      bestUseScenarios: ['Soft shoe midsoles', 'Flexible sporting goods', 'Impact absorption'],
      whyChooseThis: 'For soft, lightweight, high-energy-return parts.',
    },
    weaknesses: {
      limitations: ['Very difficult to print', 'Expensive', 'Direct drive required'],
      commonProblems: ['Stringing', 'Moisture sensitivity', 'Slow print speeds'],
      whenNotToUse: ['Without direct drive', 'Budget applications'],
    },
    practicalContext: {
      commonApplications: ['Shoe midsoles', 'Soft grips', 'Protective padding'],
      costPosition: 'Industrial',
    },
    trivia: {
      funFacts: ['85A PEBA is comparable in softness to TPU 85A but much lighter'],
    },
    printSettings: {
      nozzleTemp: { min: 220, max: 250, optimal: 235 },
      bedTemp: { min: 50, max: 70, optimal: 60 },
      coolingFan: { min: 20, max: 50 },
      enclosure: { required: false },
      drying: { temp: 70, duration: '6-8 hours' },
      printSpeed: { recommended: '10-25 mm/s' },
      additionalNotes: ['DIRECT DRIVE REQUIRED'],
    },
    safety: {
      fumes: { level: 'Low' },
      foodSafety: { rating: 'Check Brand' },
      biodegradability: { rating: 'Not Biodegradable' },
    },
  },

  'PEBA 95A': {
    name: 'PEBA 95A',
    fullName: 'Polyether Block Amide 95A Shore Hardness',
    origin: {
      majorManufacturers: ['Arkema', 'Lehvoss', 'Polymaker'],
    },
    composition: {
      basePolymer: 'Medium-hard PEBA',
      chemicalFamily: 'Polyamide Elastomer',
    },
    familyContext: {
      parentPolymer: 'PEBA at firmer durometer',
      chemicalComparison: 'Firmer than 85A, still excellent energy return. Easier to print than softer grades.',
    },
    strengths: {
      uniqueProperties: ['Good balance of firmness and flexibility', 'Excellent energy return', 'Lightweight'],
      bestUseScenarios: ['Structural flexible parts', 'Medium-flex applications', 'Sporting goods'],
      whyChooseThis: 'When you need PEBA properties with more structural support.',
    },
    weaknesses: {
      limitations: ['Same as PEBA — expensive and challenging to print'],
      commonProblems: ['Moisture sensitivity', 'Direct drive required'],
      whenNotToUse: ['Budget projects', 'Bowden extruders'],
    },
    practicalContext: {
      commonApplications: ['Shoe components', 'Tool grips', 'Equipment housings'],
      costPosition: 'Industrial',
    },
    trivia: {},
    printSettings: {
      nozzleTemp: { min: 225, max: 255, optimal: 240 },
      bedTemp: { min: 50, max: 70, optimal: 60 },
      coolingFan: { min: 20, max: 60 },
      enclosure: { required: false },
      drying: { temp: 70, duration: '6-8 hours' },
      printSpeed: { recommended: '15-35 mm/s' },
      additionalNotes: ['DIRECT DRIVE REQUIRED'],
    },
    safety: {
      fumes: { level: 'Low' },
      foodSafety: { rating: 'Check Brand' },
      biodegradability: { rating: 'Not Biodegradable' },
    },
  },

  'PVB': {
    name: 'PVB',
    fullName: 'Polyvinyl Butyral',
    origin: {
      yearInvented: '1935',
      originalCompany: 'Various chemical companies',
      majorManufacturers: ['Polymaker (PolySmooth)', 'Prusament', 'eSUN'],
    },
    composition: {
      basePolymer: 'Polyvinyl Butyral',
      chemicalFamily: 'Vinyl Acetal Polymer',
      keyAdditives: ['Plasticizers', 'Flow modifiers'],
    },
    familyContext: {
      parentPolymer: 'Derived from PVA through reaction with butyraldehyde',
      variants: ['PVB', 'PolySmooth'],
      chemicalComparison: 'Similar printability to PLA but can be chemically smoothed with isopropyl alcohol.',
    },
    strengths: {
      uniqueProperties: ['Smoothable with IPA (isopropyl alcohol)', 'Good layer adhesion', 'Translucent', 'Easy to print'],
      bestUseScenarios: ['Smooth-finish display models', 'Artistic prints', 'Prototypes needing smooth surface', 'Cosmetic parts'],
      advantagesOverCompetitors: ['IPA smoothing is safe and accessible', 'Easier than ABS acetone smoothing', 'Prints like PLA'],
      whyChooseThis: 'When you want injection-molded-quality surface finish through safe chemical smoothing.',
    },
    weaknesses: {
      limitations: ['Lower strength than PLA', 'Limited color options', 'Premium pricing', 'Moisture sensitive'],
      commonProblems: ['Over-smoothing can lose detail', 'Moisture absorption affects printability', 'Slightly softer than PLA'],
      whenNotToUse: ['Structural parts', 'When smooth finish not needed', 'Outdoor use'],
    },
    practicalContext: {
      commonApplications: ['Display models', 'Figurines', 'Presentation prototypes', 'Artistic pieces'],
      costPosition: 'Premium',
    },
    trivia: {
      funFacts: ['PVB is the interlayer in laminated safety glass (car windshields)', 'Polymaker\'s Polysher uses PVB\'s smoothing ability with an IPA mist chamber', 'One of the safest chemical smoothing options — just rubbing alcohol'],
      whyInvented: 'Originally for safety glass. 3D printing leverages its IPA solubility for surface finishing.',
      marketAdoption: 'Niche but loved by creators who want perfect surface finishes.',
    },
    tdsProfile: {
      properties: [
        { name: 'Tensile Strength', value: '30-40', unit: 'MPa', implications: 'Slightly lower than PLA.' },
        { name: 'Elongation at Break', value: '5-15', unit: '%' },
        { name: 'Glass Transition', value: '55-65', unit: '°C', implications: 'Similar to PLA heat limits.' },
      ],
    },
    printSettings: {
      nozzleTemp: { min: 195, max: 220, optimal: 210 },
      bedTemp: { min: 50, max: 65, optimal: 55 },
      coolingFan: { min: 50, max: 100 },
      enclosure: { required: false },
      drying: { temp: 50, duration: '4-6 hours' },
      printSpeed: { recommended: '40-60 mm/s' },
      additionalNotes: ['Smooth with IPA spray/mist/dip after printing', 'Layer height affects smoothing quality — finer layers smooth better'],
    },
    safety: {
      fumes: { level: 'Very Low', notes: 'Similar to PLA.' },
      foodSafety: { rating: 'Not Certified', notes: 'Not tested for food contact.' },
      biodegradability: { rating: 'Not Biodegradable', notes: 'PVB does not biodegrade.' },
    },
  },

  'PP': {
    name: 'PP',
    fullName: 'Polypropylene',
    origin: {
      yearInvented: '1954',
      originalCompany: 'Giulio Natta and Karl Rehn (patent)',
      keyMilestones: ['1954: First synthesized', '1957: Commercial production begins', '2015+: PP filaments for 3D printing'],
      majorManufacturers: ['Braskem', 'Verbatim', 'Fiberlogy', 'Ultimaker', 'BASF'],
    },
    composition: {
      basePolymer: 'Polypropylene',
      chemicalFamily: 'Polyolefin',
      keyAdditives: ['Nucleating agents', 'UV stabilizers', 'Antioxidants'],
    },
    familyContext: {
      parentPolymer: 'Polyolefin family — sister to polyethylene',
      variants: ['PP', 'PP-CF', 'PP-GF', 'PP Copolymer'],
      chemicalComparison: 'Lightest common plastic (0.9 g/cm³). Outstanding chemical resistance but extremely difficult bed adhesion.',
    },
    strengths: {
      uniqueProperties: ['Lightest engineering plastic', 'Excellent chemical resistance', 'Fatigue-resistant (living hinges)', 'Food safe'],
      bestUseScenarios: ['Chemical containers', 'Living hinges', 'Lightweight parts', 'Food containers', 'Automotive trim'],
      advantagesOverCompetitors: ['Unmatched chemical resistance in commodity plastics', 'Living hinge capability', 'Floats in water'],
      whyChooseThis: 'When chemical resistance and living hinge capability are required.',
    },
    weaknesses: {
      limitations: ['TERRIBLE bed adhesion', 'Severe warping', 'Requires PP-specific bed tape', 'Low stiffness'],
      commonProblems: ['Parts detach during printing', 'Extreme warping', 'No standard bed surface works', 'Deformation under load'],
      whenNotToUse: ['Without PP-specific adhesion solution', 'Stiffness-critical parts', 'Beginners'],
    },
    practicalContext: {
      commonApplications: ['Containers', 'Snap-fit enclosures', 'Living hinges', 'Chemical storage', 'Automotive interior'],
      costPosition: 'Standard',
    },
    trivia: {
      funFacts: ['PP is the world\'s 2nd most produced plastic', 'Your yogurt container is PP', 'PP is the only common plastic that floats', 'Can flex millions of times without breaking (living hinges)'],
      whyInvented: 'Needed a lightweight, chemically resistant, fatigue-resistant plastic.',
      marketAdoption: 'Challenging in 3D printing due to adhesion. Used by experienced users for specific applications.',
    },
    tdsProfile: {
      properties: [
        { name: 'Tensile Strength', value: '25-40', unit: 'MPa' },
        { name: 'Elongation at Break', value: '100-600', unit: '%', implications: 'Excellent — enables living hinges.' },
        { name: 'Density', value: '0.90-0.91', unit: 'g/cm³', implications: 'Lightest common plastic.' },
        { name: 'Chemical Resistance', value: 'Excellent', unit: '', implications: 'Resists most acids, bases, and solvents.' },
        { name: 'Heat Deflection', value: '90-110', unit: '°C', implications: 'Good heat resistance.' },
      ],
    },
    printSettings: {
      nozzleTemp: { min: 220, max: 250, optimal: 235 },
      bedTemp: { min: 80, max: 100, optimal: 90 },
      coolingFan: { min: 0, max: 30, notes: 'Minimal cooling to prevent warping.' },
      enclosure: { required: true, notes: 'Strongly recommended — warping is extreme.' },
      printSpeed: { recommended: '30-50 mm/s' },
      additionalNotes: ['PP bed adhesion tape REQUIRED (PP packing tape or Magigoo PP)', 'Raft mandatory', 'Enclosure strongly recommended', 'Draft shield helps'],
    },
    safety: {
      fumes: { level: 'Low', notes: 'Low emissions.' },
      foodSafety: { rating: 'FDA Approved', notes: 'PP is one of the safest food-contact plastics.' },
      biodegradability: { rating: 'Not Biodegradable', notes: 'Recyclable (Type 5) but not biodegradable.' },
    },
  },

  'PP-GF': {
    name: 'PP-GF',
    fullName: 'Glass Fiber Reinforced Polypropylene',
    origin: {
      majorManufacturers: ['BASF', 'Braskem', 'Fiberlogy', 'Ultimaker'],
    },
    composition: {
      basePolymer: 'Polypropylene with glass fiber reinforcement',
      chemicalFamily: 'Glass Fiber Reinforced Polyolefin',
      keyAdditives: ['Short glass fibers (15-30%)', 'Coupling agents'],
    },
    familyContext: {
      parentPolymer: 'PP reinforced with glass fiber for stiffness',
      chemicalComparison: 'Much stiffer than neat PP while keeping chemical resistance. Less abrasive than PP-CF.',
    },
    strengths: {
      uniqueProperties: ['Significantly stiffer than neat PP', 'Chemical resistant', 'Lightweight', 'Good dimensional stability'],
      bestUseScenarios: ['Structural PP parts', 'Chemical-resistant housings', 'Automotive under-hood'],
      whyChooseThis: 'When PP chemical resistance is needed with added stiffness.',
    },
    weaknesses: {
      limitations: ['Same adhesion challenges as PP', 'Glass fiber abrasion', 'Reduced elongation'],
      commonProblems: ['All PP adhesion issues apply', 'Nozzle wear'],
      whenNotToUse: ['Without PP-specific adhesion solution', 'Living hinge applications'],
    },
    practicalContext: {
      commonApplications: ['Automotive components', 'Chemical containers', 'Industrial housings'],
      costPosition: 'Premium',
    },
    trivia: {
      funFacts: ['GF-PP is standard in automotive bumper supports'],
    },
    printSettings: {
      nozzleTemp: { min: 230, max: 260, optimal: 245 },
      bedTemp: { min: 80, max: 100, optimal: 90 },
      coolingFan: { min: 0, max: 30 },
      enclosure: { required: true },
      printSpeed: { recommended: '30-50 mm/s' },
      additionalNotes: ['HARDENED NOZZLE REQUIRED', 'PP bed adhesion solution mandatory', 'All PP printing challenges apply'],
    },
    safety: {
      fumes: { level: 'Low', notes: 'Similar to PP. Glass fiber dust when sanding.' },
      foodSafety: { rating: 'Not Recommended', notes: 'Glass fiber content.' },
      biodegradability: { rating: 'Not Biodegradable' },
    },
  },

  'PEKK': {
    name: 'PEKK',
    fullName: 'Polyether Ketone Ketone',
    origin: {
      yearInvented: '1988',
      originalCompany: 'Du Pont / Arkema (Kepstan)',
      majorManufacturers: ['Arkema (Kepstan)', 'Hexcel', '3DXTech', 'Kimya'],
    },
    composition: {
      basePolymer: 'PEKK',
      chemicalFamily: 'Polyaryletherketone (PAEK) family',
      keyAdditives: ['Carbon fiber variants available'],
    },
    familyContext: {
      parentPolymer: 'PAEK family — between PEK and PEEK',
      variants: ['PEKK-A (amorphous)', 'PEKK-C (crystalline)', 'PEKK-CF'],
      chemicalComparison: 'Similar performance to PEEK but prints at lower temps (340-360°C vs 400°C+). More accessible.',
    },
    strengths: {
      uniqueProperties: ['PEEK-class performance at lower processing temps', 'Excellent chemical resistance', 'High strength', 'Flame retardant'],
      bestUseScenarios: ['Aerospace prototyping', 'Oil & gas tooling', 'Medical instruments', 'High-temp jigs'],
      advantagesOverCompetitors: ['Lower printing temp than PEEK', 'PEKK-A doesn\'t require annealing', 'Amorphous grade is dimensionally stable'],
      whyChooseThis: 'When you need PEEK-like performance but can\'t reach 400°C+ nozzle temps.',
    },
    weaknesses: {
      limitations: ['Still requires specialized printer ($10,000+)', 'Very expensive ($300-500/kg)', 'Heated chamber required', 'Limited color options'],
      commonProblems: ['Still challenging to print', 'Crystallization control important', 'Moisture sensitivity'],
      whenNotToUse: ['Standard desktop printers', 'Budget applications', 'When PC or Nylon suffice'],
    },
    practicalContext: {
      commonApplications: ['Aerospace components', 'Oil & gas equipment', 'Medical devices', 'High-temp tooling'],
      safetyStandards: ['FAR 25.853 (aerospace fire)', 'Various aerospace certifications'],
      costPosition: 'Industrial',
    },
    trivia: {
      funFacts: ['PEKK-A (amorphous) is the most printable PAEK material — no annealing required', 'Used by Airbus for flight-qualified 3D printed parts', 'PEKK can withstand continuous temperatures of 220°C+'],
      whyInvented: 'To create a more processable alternative to PEEK for aerospace.',
      marketAdoption: 'Growing in aerospace and industrial 3D printing.',
    },
    tdsProfile: {
      properties: [
        { name: 'Tensile Strength', value: '80-110', unit: 'MPa', implications: 'Exceptional strength.' },
        { name: 'Glass Transition (Tg)', value: '160-165', unit: '°C', implications: 'Very high.' },
        { name: 'Continuous Use Temp', value: '220-260', unit: '°C', implications: 'Near-PEEK thermal performance.' },
      ],
    },
    printSettings: {
      nozzleTemp: { min: 340, max: 380, optimal: 360 },
      bedTemp: { min: 120, max: 160, optimal: 140 },
      coolingFan: { min: 0, max: 0, notes: 'No cooling.' },
      enclosure: { required: true, notes: 'MANDATORY. 100-160°C chamber required.' },
      drying: { temp: 120, duration: '4-8 hours' },
      printSpeed: { recommended: '15-40 mm/s' },
      additionalNotes: ['Specialized high-temp printer required', 'All-metal hotend rated 380°C+', 'Lower temp than PEEK is the key advantage'],
    },
    safety: {
      fumes: { level: 'Low', notes: 'Low emissions despite high temps. Still ventilate.' },
      foodSafety: { rating: 'Not Typically Certified', notes: 'Medical grades exist.' },
      biodegradability: { rating: 'Not Biodegradable' },
    },
  },

  'PEI 1010': {
    name: 'PEI 1010',
    fullName: 'Polyetherimide (ULTEM 1010)',
    origin: {
      yearInvented: '1982',
      originalCompany: 'General Electric (ULTEM brand)',
      majorManufacturers: ['SABIC (ULTEM)', 'Stratasys', '3DXTech'],
    },
    composition: {
      basePolymer: 'Polyetherimide',
      chemicalFamily: 'Amorphous Thermoplastic Polyimide',
      keyAdditives: ['Inherent flame retardancy — no FR additives needed'],
    },
    familyContext: {
      parentPolymer: 'PEI/ULTEM family',
      variants: ['PEI 1010 (natural)', 'PEI 9085 (impact modified)', 'PEI-CF'],
      chemicalComparison: 'Higher heat resistance and stiffness than PEI 9085. Suitable for food contact and autoclave.',
    },
    strengths: {
      uniqueProperties: ['217°C continuous use', 'Inherently flame retardant (UL94 V0)', 'FDA food contact', 'Autoclavable'],
      bestUseScenarios: ['Aerospace ducting', 'Food processing equipment', 'Autoclavable medical tools', 'Electrical insulation'],
      advantagesOverCompetitors: ['No FR additives needed — inherent V0', 'FDA food contact', 'Can be autoclaved'],
      whyChooseThis: 'For certified aerospace, medical, or food-contact parts needing high heat resistance.',
    },
    weaknesses: {
      limitations: ['Requires 350-390°C nozzle', 'Very expensive', 'Specialized printer needed', 'Brittle compared to 9085'],
      commonProblems: ['Delamination without proper chamber temp', 'Moisture absorption', 'Limited color (amber/natural)'],
      whenNotToUse: ['Standard printers', 'Impact-critical parts (use 9085)', 'Budget applications'],
    },
    practicalContext: {
      commonApplications: ['Aircraft ducting', 'Food processing jigs', 'Sterilizable tools', 'Electrical components'],
      safetyStandards: ['UL94 V0', 'FAR 25.853', 'FDA food contact', 'USP Class VI'],
      costPosition: 'Industrial',
    },
    trivia: {
      funFacts: ['ULTEM 1010 is used in actual aircraft cabin components', 'One of the few 3D printable plastics approved for permanent aircraft installation', 'The amber color is the natural appearance — not a dye'],
      whyInvented: 'Aerospace needed a lightweight, fire-safe plastic for cabin interiors.',
      marketAdoption: 'Standard in aerospace and medical 3D printing.',
    },
    tdsProfile: {
      properties: [
        { name: 'Tensile Strength', value: '85-95', unit: 'MPa' },
        { name: 'Glass Transition (Tg)', value: '217', unit: '°C', implications: 'Very high heat resistance.' },
        { name: 'UL94 Rating', value: 'V0', unit: '', implications: 'Inherent — no FR additives.' },
      ],
    },
    printSettings: {
      nozzleTemp: { min: 350, max: 390, optimal: 370 },
      bedTemp: { min: 120, max: 160, optimal: 140 },
      coolingFan: { min: 0, max: 0 },
      enclosure: { required: true, notes: 'MANDATORY. 130-170°C chamber temperature.' },
      drying: { temp: 150, duration: '4-8 hours' },
      printSpeed: { recommended: '15-30 mm/s' },
      additionalNotes: ['Industrial high-temp printer required (Stratasys Fortus, AON, etc.)', 'All-metal hotend rated 400°C+'],
    },
    safety: {
      fumes: { level: 'Low', notes: 'Very low emissions despite high temps.' },
      foodSafety: { rating: 'FDA Approved', notes: 'FDA food contact compliant.' },
      biodegradability: { rating: 'Not Biodegradable' },
    },
  },

  'PEI 9085': {
    name: 'PEI 9085',
    fullName: 'Polyetherimide Impact Modified (ULTEM 9085)',
    origin: {
      originalCompany: 'SABIC / Stratasys',
      majorManufacturers: ['SABIC', 'Stratasys', '3DXTech'],
    },
    composition: {
      basePolymer: 'Impact-modified polyetherimide',
      chemicalFamily: 'Amorphous Thermoplastic Polyimide (Modified)',
    },
    familyContext: {
      parentPolymer: 'PEI modified for improved impact and toughness',
      chemicalComparison: 'Less stiff and heat resistant than PEI 1010, but significantly tougher and less brittle.',
    },
    strengths: {
      uniqueProperties: ['Better impact resistance than 1010', 'FST compliant (flame, smoke, toxicity)', 'Aerospace certified', 'Good chemical resistance'],
      bestUseScenarios: ['Aircraft interior parts', 'Aerospace tooling', 'Impact-resistant high-temp parts'],
      whyChooseThis: 'When you need PEI performance with better impact resistance for aerospace/transit applications.',
    },
    weaknesses: {
      limitations: ['Lower heat resistance than 1010', 'Same printer requirements', 'Very expensive'],
      commonProblems: ['Same printing challenges as 1010'],
      whenNotToUse: ['Maximum heat resistance needed (use 1010)', 'Standard printers'],
    },
    practicalContext: {
      commonApplications: ['Aircraft interior brackets', 'Rail transit components', 'Aerospace prototypes'],
      safetyStandards: ['FAR 25.853 FST', 'UL94 V0', 'EN 45545 (rail)'],
      costPosition: 'Industrial',
    },
    trivia: {
      funFacts: ['The "9085" designation refers to SABIC\'s product code', 'Most-used PEI grade in aerospace 3D printing due to FST compliance'],
    },
    printSettings: {
      nozzleTemp: { min: 340, max: 380, optimal: 360 },
      bedTemp: { min: 120, max: 160, optimal: 140 },
      coolingFan: { min: 0, max: 0 },
      enclosure: { required: true, notes: 'MANDATORY. Industrial printer required.' },
      drying: { temp: 150, duration: '4-8 hours' },
      printSpeed: { recommended: '15-30 mm/s' },
    },
    safety: {
      fumes: { level: 'Low', notes: 'Low emissions. FST compliant.' },
      foodSafety: { rating: 'Not Typically Certified' },
      biodegradability: { rating: 'Not Biodegradable' },
    },
  },

  'PPSU': {
    name: 'PPSU',
    fullName: 'Polyphenylsulfone',
    origin: {
      yearInvented: '1990s',
      originalCompany: 'Solvay (Radel brand)',
      majorManufacturers: ['Solvay', 'BASF', 'Stratasys'],
    },
    composition: {
      basePolymer: 'Polyphenylsulfone',
      chemicalFamily: 'Sulfone Polymer',
    },
    familyContext: {
      parentPolymer: 'Sulfone family — toughest member (PPSU > PSU > PES)',
      variants: ['PPSU', 'Radel R'],
      chemicalComparison: 'Highest impact resistance of any sulfone. Better toughness than PEI with similar heat resistance.',
    },
    strengths: {
      uniqueProperties: ['Outstanding impact resistance', 'Autoclavable (1000+ cycles)', 'Inherent flame retardancy', 'Chemical resistant'],
      bestUseScenarios: ['Reusable medical instruments', 'Sterilizable tools', 'Aircraft interior parts', 'Plumbing fittings'],
      whyChooseThis: 'When repeated steam sterilization is required — unmatched autoclave durability.',
    },
    weaknesses: {
      limitations: ['Requires 370-400°C nozzle', 'Very expensive', 'Specialized printer', 'Limited availability'],
      commonProblems: ['Difficult to print', 'Moisture sensitive', 'Limited suppliers'],
      whenNotToUse: ['Standard printers', 'Budget applications', 'When PEI suffices'],
    },
    practicalContext: {
      commonApplications: ['Reusable surgical trays', 'Autoclavable tools', 'Hot water fittings', 'Aircraft components'],
      safetyStandards: ['FDA food contact', 'USP Class VI', 'NSF 61 (water)', 'UL94 V0'],
      costPosition: 'Industrial',
    },
    trivia: {
      funFacts: ['PPSU can survive 1000+ autoclave cycles — most plastics fail after a few', 'Used in hospital surgical instrument trays worldwide'],
    },
    printSettings: {
      nozzleTemp: { min: 370, max: 400, optimal: 385 },
      bedTemp: { min: 140, max: 180, optimal: 160 },
      coolingFan: { min: 0, max: 0 },
      enclosure: { required: true, notes: 'MANDATORY. 160°C+ chamber.' },
      drying: { temp: 150, duration: '4-8 hours' },
      printSpeed: { recommended: '10-30 mm/s' },
    },
    safety: {
      fumes: { level: 'Low', notes: 'Low emissions.' },
      foodSafety: { rating: 'FDA Approved' },
      biodegradability: { rating: 'Not Biodegradable' },
    },
  },

  'PSU': {
    name: 'PSU',
    fullName: 'Polysulfone',
    origin: {
      yearInvented: '1965',
      originalCompany: 'Union Carbide',
      majorManufacturers: ['Solvay (Udel)', 'BASF', '3DXTech'],
    },
    composition: {
      basePolymer: 'Polysulfone',
      chemicalFamily: 'Sulfone Polymer',
    },
    familyContext: {
      parentPolymer: 'Original sulfone polymer — between PES and PPSU in properties',
      chemicalComparison: 'Higher heat resistance than PES, less impact than PPSU. Good balance.',
    },
    strengths: {
      uniqueProperties: ['High heat resistance (175°C continuous)', 'Transparent/amber', 'Autoclavable', 'FDA food contact'],
      bestUseScenarios: ['Medical devices', 'Water filtration', 'Food processing', 'High-temp transparent parts'],
      whyChooseThis: 'When heat resistance, transparency, and sterilizability are all needed.',
    },
    weaknesses: {
      limitations: ['Requires specialized printer', 'Expensive', 'UV sensitive', 'Notch sensitive'],
      commonProblems: ['Yellows in UV', 'Moisture absorption'],
      whenNotToUse: ['Outdoor UV exposure', 'Standard printers', 'Impact-critical (use PPSU)'],
    },
    practicalContext: {
      commonApplications: ['Water filtration membranes', 'Medical instruments', 'Food service equipment', 'Baby bottles'],
      safetyStandards: ['FDA', 'NSF 61', 'USP Class VI'],
      costPosition: 'Industrial',
    },
    trivia: {
      funFacts: ['PSU is used in coffee maker boilers and water filtration worldwide'],
    },
    printSettings: {
      nozzleTemp: { min: 340, max: 380, optimal: 360 },
      bedTemp: { min: 120, max: 160, optimal: 140 },
      coolingFan: { min: 0, max: 0 },
      enclosure: { required: true, notes: 'MANDATORY.' },
      drying: { temp: 120, duration: '4-8 hours' },
      printSpeed: { recommended: '15-30 mm/s' },
    },
    safety: {
      fumes: { level: 'Low' },
      foodSafety: { rating: 'FDA Approved' },
      biodegradability: { rating: 'Not Biodegradable' },
    },
  },

  'PLA-Conductive': {
    name: 'PLA-Conductive',
    fullName: 'Electrically Conductive Polylactic Acid',
    origin: {
      majorManufacturers: ['Proto-pasta', 'Polymaker', 'eSUN'],
    },
    composition: {
      basePolymer: 'PLA with conductive carbon additives',
      chemicalFamily: 'Aliphatic Polyester (Conductive)',
      keyAdditives: ['Carbon black', 'Graphene', 'Conductive fillers'],
    },
    familyContext: {
      parentPolymer: 'PLA with conductive carbon particles',
      chemicalComparison: 'Lower resistivity than ESD-PLA. Designed for actual electrical conductivity, not just static dissipation.',
    },
    strengths: {
      uniqueProperties: ['Electrically conductive', 'Prints like PLA', 'Low resistance (100-1000 ohm/cm)', 'Can make circuits'],
      bestUseScenarios: ['Low-voltage circuits', 'Touch sensors', 'Capacitive buttons', 'Educational electronics'],
      whyChooseThis: 'For 3D printed electronics prototypes and conductive traces.',
    },
    weaknesses: {
      limitations: ['High resistance vs metal', 'Black only', 'Brittle', 'Abrasive'],
      commonProblems: ['Inconsistent conductivity', 'Nozzle wear', 'Not suitable for high-current'],
      whenNotToUse: ['Reliable circuits', 'High current', 'Without hardened nozzle'],
    },
    practicalContext: {
      commonApplications: ['Touch sensors', 'LED circuits', 'Educational projects', 'EMI shielding'],
      costPosition: 'Premium',
    },
    trivia: {
      funFacts: ['Proto-pasta Conductive PLA was one of the first conductive filaments on the market'],
    },
    printSettings: {
      nozzleTemp: { min: 210, max: 235, optimal: 220 },
      bedTemp: { min: 50, max: 65, optimal: 55 },
      coolingFan: { min: 40, max: 80 },
      enclosure: { required: false },
      printSpeed: { recommended: '30-50 mm/s' },
      additionalNotes: ['HARDENED NOZZLE RECOMMENDED', 'Conductivity varies with layer orientation'],
    },
    safety: {
      fumes: { level: 'Low', notes: 'PLA-level emissions.' },
      foodSafety: { rating: 'Not Safe', notes: 'Carbon additives.' },
      biodegradability: { rating: 'Not Compostable' },
    },
  },

  'PLA-Galaxy': {
    name: 'PLA-Galaxy',
    fullName: 'Glitter/Sparkle Effect Polylactic Acid',
    origin: {
      majorManufacturers: ['Prusament', 'Eryone', 'Sunlu', 'Hatchbox'],
    },
    composition: {
      basePolymer: 'PLA with glitter/metallic flake additives',
      chemicalFamily: 'Aliphatic Polyester with Decorative Fillers',
      keyAdditives: ['Metallic flakes', 'Glitter particles', 'Mica flakes'],
    },
    familyContext: {
      parentPolymer: 'PLA with sparkle/glitter effect particles',
      variants: ['Galaxy PLA', 'Glitter PLA', 'Starlight PLA', 'Nebula PLA'],
      chemicalComparison: 'Similar to Silk PLA but with more random sparkle vs directional sheen.',
    },
    strengths: {
      uniqueProperties: ['Glittering sparkle effect', 'Hides layer lines well', 'Eye-catching finish', 'Easy to print'],
      bestUseScenarios: ['Decorative items', 'Ornaments', 'Gift items', 'Display pieces'],
      whyChooseThis: 'When you want sparkly, eye-catching prints with no post-processing.',
    },
    weaknesses: {
      limitations: ['Same PLA mechanical properties', 'Slightly abrasive particles', 'Surface can feel rough'],
      commonProblems: ['Minor nozzle wear over time', 'Glitter distribution varies'],
      whenNotToUse: ['Functional parts', 'Smooth surface needed', 'Food contact'],
    },
    practicalContext: {
      commonApplications: ['Vases', 'Ornaments', 'Desk items', 'Holiday decorations'],
      costPosition: 'Standard',
    },
    trivia: {
      funFacts: ['Prusament Galaxy Black became one of their most popular colors ever', 'The glitter effect comes from tiny metallic or synthetic flakes suspended in the PLA'],
    },
    printSettings: {
      nozzleTemp: { min: 200, max: 225, optimal: 210 },
      bedTemp: { min: 50, max: 65, optimal: 55 },
      coolingFan: { min: 80, max: 100 },
      enclosure: { required: false },
      printSpeed: { recommended: '40-60 mm/s' },
      additionalNotes: ['Hardened nozzle recommended for heavy use', 'Use 0.4mm+ nozzle'],
    },
    safety: {
      fumes: { level: 'Very Low' },
      foodSafety: { rating: 'Not Safe', notes: 'Metallic particles not food-safe.' },
      biodegradability: { rating: 'Not Compostable' },
    },
  },

  'HTPLA': {
    name: 'HTPLA',
    fullName: 'Heat-Treatable Polylactic Acid',
    origin: {
      majorManufacturers: ['Proto-pasta', 'Polymaker (PolyMax)', 'Bambu Lab'],
    },
    composition: {
      basePolymer: 'PLA with crystallization-enhancing additives',
      chemicalFamily: 'Aliphatic Polyester (Annealable)',
      keyAdditives: ['Nucleating agents', 'Crystallization promoters'],
    },
    familyContext: {
      parentPolymer: 'PLA designed for post-print heat treatment (annealing)',
      variants: ['HTPLA', 'HT-PLA', 'PLA-HT', 'Annealable PLA'],
      chemicalComparison: 'Prints like PLA, but after oven annealing at 80-100°C gains heat resistance up to 120°C+.',
    },
    strengths: {
      uniqueProperties: ['PLA that can become heat-resistant after annealing', 'Prints easy, finishes tough', 'Up to 120°C+ HDT after annealing'],
      bestUseScenarios: ['Parts that need heat resistance with PLA printability', 'Car dashboard mounts', 'Kitchen accessories'],
      advantagesOverCompetitors: ['Easiest path to heat-resistant parts', 'No enclosure needed for printing', 'Anneal in household oven'],
      whyChooseThis: 'When you want PLA\'s ease of printing but need heat resistance approaching ABS.',
    },
    weaknesses: {
      limitations: ['Parts shrink/warp during annealing (5-10%)', 'Must design for annealing distortion', 'Dimensional accuracy reduced'],
      commonProblems: ['Unpredictable shrinkage', 'Parts can distort in oven', 'Color may change during annealing'],
      whenNotToUse: ['Tight tolerances', 'When annealing distortion is unacceptable'],
    },
    practicalContext: {
      commonApplications: ['Heat-resistant brackets', 'Car accessories', 'Kitchen tools', 'Under-hood mounts'],
      costPosition: 'Premium',
    },
    trivia: {
      funFacts: ['Annealing HTPLA in a household oven at 80°C for 1 hour can double its heat resistance', 'Proto-pasta HTPLA was one of the first annealable PLA filaments'],
    },
    tdsProfile: {
      properties: [
        { name: 'HDT (Pre-Anneal)', value: '55-60', unit: '°C', implications: 'Standard PLA heat limits.' },
        { name: 'HDT (Post-Anneal)', value: '110-140', unit: '°C', implications: 'Dramatically improved after annealing.' },
        { name: 'Tensile Strength', value: '50-60', unit: 'MPa', implications: 'Good — often stronger after annealing.' },
      ],
    },
    printSettings: {
      nozzleTemp: { min: 200, max: 230, optimal: 215 },
      bedTemp: { min: 50, max: 65, optimal: 55 },
      coolingFan: { min: 60, max: 100 },
      enclosure: { required: false },
      printSpeed: { recommended: '40-60 mm/s' },
      additionalNotes: ['Anneal after printing: 80-100°C for 1-2 hours', 'Support parts during annealing to prevent sagging', 'Expect 5-10% dimensional change'],
    },
    safety: {
      fumes: { level: 'Very Low', notes: 'Standard PLA.' },
      foodSafety: { rating: 'Check Brand' },
      biodegradability: { rating: 'Industrial Composting' },
    },
  },

  'FlexPLA': {
    name: 'FlexPLA',
    fullName: 'Flexible/Semi-Flexible Polylactic Acid',
    origin: {
      majorManufacturers: ['Fillamentum', 'colorFabb', 'Polymaker'],
    },
    composition: {
      basePolymer: 'PLA blended with flexible polymers',
      chemicalFamily: 'PLA-Based Flexible Blend',
      keyAdditives: ['Plasticizers', 'Flexible polymer blends', 'Impact modifiers'],
    },
    familyContext: {
      parentPolymer: 'PLA modified for flexibility',
      chemicalComparison: 'Much stiffer than TPU but more flexible than standard PLA. Prints on any printer.',
    },
    strengths: {
      uniqueProperties: ['Semi-flexible PLA', 'Prints on any printer (no direct drive needed)', 'Living hinge capable', 'Easy to print'],
      bestUseScenarios: ['Phone cases', 'Flexible prototypes', 'Living hinges', 'Bumpers and covers'],
      whyChooseThis: 'When you need some flexibility without the challenge of printing TPU.',
    },
    weaknesses: {
      limitations: ['Not truly flexible like TPU', 'Lower strength than rigid PLA', 'Limited stretch'],
      commonProblems: ['Can still break under sharp bending', 'Not suitable for extreme flexing'],
      whenNotToUse: ['True rubber-like flexibility needed', 'Repeated extreme flexing'],
    },
    practicalContext: {
      commonApplications: ['Phone cases', 'Snap-fit parts', 'Flexible covers', 'Protective bumpers'],
      costPosition: 'Standard',
    },
    trivia: {
      funFacts: ['Flex PLA bridges the gap between rigid PLA and difficult-to-print TPU'],
    },
    printSettings: {
      nozzleTemp: { min: 200, max: 230, optimal: 215 },
      bedTemp: { min: 50, max: 65, optimal: 55 },
      coolingFan: { min: 50, max: 100 },
      enclosure: { required: false },
      printSpeed: { recommended: '30-50 mm/s' },
    },
    safety: {
      fumes: { level: 'Very Low' },
      foodSafety: { rating: 'Not Certified' },
      biodegradability: { rating: 'Partially Compostable' },
    },
  },

  'PLA/PHA': {
    name: 'PLA/PHA',
    fullName: 'PLA-Polyhydroxyalkanoate Blend',
    origin: {
      originalCompany: 'colorFabb',
      majorManufacturers: ['colorFabb'],
    },
    composition: {
      basePolymer: 'PLA blended with PHA biopolymer',
      chemicalFamily: 'Biopolymer Blend',
      keyAdditives: ['PHA (adds toughness and biodegradability)'],
    },
    familyContext: {
      parentPolymer: 'PLA + PHA biopolymer blend',
      chemicalComparison: 'More impact resistant and slightly more flexible than pure PLA. Fully bio-based.',
    },
    strengths: {
      uniqueProperties: ['Improved toughness over PLA', 'Fully bio-based', 'Biodegradable', 'Vibrant colors'],
      bestUseScenarios: ['Eco-conscious printing', 'Parts needing more toughness than PLA', 'Decorative items'],
      whyChooseThis: 'When environmental sustainability matters and you need better toughness than standard PLA.',
    },
    weaknesses: {
      limitations: ['Slightly more expensive than PLA', 'Lower heat resistance', 'More stringing than PLA'],
      commonProblems: ['Stringing', 'Moisture sensitivity'],
      whenNotToUse: ['High-temp applications', 'When standard PLA suffices'],
    },
    practicalContext: {
      commonApplications: ['General printing', 'Decorative items', 'Eco-branded products'],
      costPosition: 'Premium',
    },
    trivia: {
      funFacts: ['colorFabb PLA/PHA was one of the first enhanced PLA blends on the market', 'PHA is produced by bacteria feeding on organic matter'],
    },
    printSettings: {
      nozzleTemp: { min: 195, max: 220, optimal: 210 },
      bedTemp: { min: 50, max: 65, optimal: 55 },
      coolingFan: { min: 60, max: 100 },
      enclosure: { required: false },
      printSpeed: { recommended: '40-60 mm/s' },
    },
    safety: {
      fumes: { level: 'Very Low' },
      foodSafety: { rating: 'Not Certified' },
      biodegradability: { rating: 'Biodegradable', notes: 'PHA component is biodegradable in soil and marine environments.' },
    },
  },

  'allPHA': {
    name: 'allPHA',
    fullName: 'Pure Polyhydroxyalkanoate',
    origin: {
      majorManufacturers: ['colorFabb', 'Danimer Scientific'],
    },
    composition: {
      basePolymer: 'PHA (Polyhydroxyalkanoate)',
      chemicalFamily: 'Biopolyester',
    },
    familyContext: {
      parentPolymer: 'Pure PHA without PLA blending',
      chemicalComparison: 'Truly biodegradable in natural environments — unlike PLA which needs industrial composting.',
    },
    strengths: {
      uniqueProperties: ['Marine biodegradable', 'Soil biodegradable', 'Bio-produced by bacteria', 'Compostable at home'],
      bestUseScenarios: ['Environmental applications', 'Marine environments', 'Packaging prototypes', 'Eco demonstrations'],
      whyChooseThis: 'When true environmental biodegradability is the primary requirement.',
    },
    weaknesses: {
      limitations: ['Very limited availability', 'Expensive', 'Lower mechanical properties', 'Difficult to print'],
      commonProblems: ['Narrow print window', 'Warping', 'Brittle'],
      whenNotToUse: ['Functional parts', 'When longevity needed', 'Budget projects'],
    },
    practicalContext: {
      commonApplications: ['Environmental prototypes', 'Biodegradable packaging', 'Educational demos'],
      costPosition: 'Premium',
    },
    trivia: {
      funFacts: ['PHA is produced by bacteria as energy storage — similar to how humans store fat', 'Truly biodegrades in the ocean unlike PLA'],
    },
    printSettings: {
      nozzleTemp: { min: 180, max: 210, optimal: 195 },
      bedTemp: { min: 40, max: 60, optimal: 50 },
      coolingFan: { min: 50, max: 100 },
      enclosure: { required: false },
      printSpeed: { recommended: '30-50 mm/s' },
    },
    safety: {
      fumes: { level: 'Very Low' },
      foodSafety: { rating: 'Generally Safe', notes: 'PHA is used in food packaging.' },
      biodegradability: { rating: 'Fully Biodegradable', notes: 'Home compostable. Marine and soil biodegradable.' },
    },
  },

  'CoPoly-XT': {
    name: 'CoPoly-XT',
    fullName: 'High-Temperature Amphora Copolyester',
    origin: {
      originalCompany: 'colorFabb (using Eastman Amphora)',
      majorManufacturers: ['colorFabb'],
    },
    composition: {
      basePolymer: 'Eastman Amphora copolyester (high-temp grade)',
      chemicalFamily: 'Copolyester',
    },
    familyContext: {
      parentPolymer: 'Premium copolyester — higher heat resistance than nGen',
      chemicalComparison: 'Higher glass transition than nGen (82°C vs 75°C). Better for functional parts.',
    },
    strengths: {
      uniqueProperties: ['Higher heat resistance than nGen', 'Excellent clarity', 'Low warping', 'Chemical resistant'],
      bestUseScenarios: ['Functional clear parts', 'High-temp copolyester applications', 'Premium prototypes'],
      whyChooseThis: 'When you need better heat resistance than nGen but want copolyester benefits.',
    },
    weaknesses: {
      limitations: ['colorFabb exclusive', 'Premium pricing', 'Requires higher temps than nGen'],
      commonProblems: ['Moisture sensitivity', 'Can stick aggressively to PEI'],
      whenNotToUse: ['When nGen suffices', 'Budget projects'],
    },
    practicalContext: {
      commonApplications: ['Functional enclosures', 'Clear covers', 'Medical prototypes', 'Chemical-resistant parts'],
      costPosition: 'Premium',
    },
    trivia: {
      funFacts: ['XT stands for "eXtra Tough" in the colorFabb product line'],
    },
    printSettings: {
      nozzleTemp: { min: 255, max: 280, optimal: 265 },
      bedTemp: { min: 75, max: 95, optimal: 85 },
      coolingFan: { min: 25, max: 75 },
      enclosure: { required: false },
      drying: { temp: 70, duration: '4-6 hours' },
      printSpeed: { recommended: '40-60 mm/s' },
      additionalNotes: ['Use release agent on smooth PEI', 'Higher temps than nGen'],
    },
    safety: {
      fumes: { level: 'Low' },
      foodSafety: { rating: 'Check Specific Grade' },
      biodegradability: { rating: 'Not Biodegradable' },
    },
  },

  'PVC': {
    name: 'PVC',
    fullName: 'Polyvinyl Chloride',
    origin: {
      yearInvented: '1872',
      originalCompany: 'Eugen Baumann (discovery), Waldo Semon (plasticized)',
      majorManufacturers: ['Formfutura', 'Essentium'],
    },
    composition: {
      basePolymer: 'Polyvinyl Chloride',
      chemicalFamily: 'Vinyl Polymer',
      keyAdditives: ['Plasticizers (for flexible)', 'Heat stabilizers', 'Flame retardants'],
    },
    familyContext: {
      parentPolymer: 'Vinyl family — one of the world\'s most produced plastics',
      chemicalComparison: 'Self-extinguishing, chemical resistant, but releases HCl gas when overheated. CAUTION required.',
    },
    strengths: {
      uniqueProperties: ['Self-extinguishing', 'Excellent chemical resistance', 'Low cost', 'Rigid or flexible variants'],
      bestUseScenarios: ['Chemical-resistant parts', 'Pipe fittings prototypes', 'Electrical insulation'],
      whyChooseThis: 'When chemical resistance and self-extinguishing properties are needed at low cost.',
    },
    weaknesses: {
      limitations: ['RELEASES TOXIC HCl GAS if overheated', 'Requires very careful temperature control', 'Limited availability in filament form', 'Environmental concerns'],
      commonProblems: ['Thermal degradation releases HCl', 'Narrow processing window', 'Corrosive to printer components'],
      whenNotToUse: ['WITHOUT excellent ventilation/filtration', 'Beginners', 'Unventilated spaces'],
    },
    practicalContext: {
      commonApplications: ['Pipe fitting prototypes', 'Chemical-resistant enclosures', 'Insulation'],
      costPosition: 'Standard',
    },
    trivia: {
      funFacts: ['PVC is the 3rd most produced plastic in the world', 'The "vinyl" in vinyl records is PVC', 'PVC piping carries most of the world\'s drinking water'],
      whyInvented: 'One of the earliest synthetic plastics.',
      marketAdoption: 'Extremely rare in 3D printing due to safety concerns.',
    },
    printSettings: {
      nozzleTemp: { min: 190, max: 220, optimal: 200 },
      bedTemp: { min: 60, max: 80, optimal: 70 },
      coolingFan: { min: 50, max: 100 },
      enclosure: { required: false, notes: 'EXCELLENT VENTILATION MANDATORY' },
      printSpeed: { recommended: '20-40 mm/s' },
      additionalNotes: ['⚠️ CAUTION: Releases toxic HCl gas if overheated', 'NEVER exceed recommended temperature', 'HEPA + carbon filtration essential', 'Monitor nozzle temp carefully'],
    },
    safety: {
      fumes: { level: 'High', notes: '⚠️ DANGER: Releases toxic hydrochloric acid gas if overheated. HEPA + carbon filtration MANDATORY. Never print without proper ventilation.' },
      foodSafety: { rating: 'Not Safe', notes: 'Plasticizers and stabilizers are not food-safe.' },
      biodegradability: { rating: 'Not Biodegradable', notes: 'Extremely persistent. Difficult to recycle. Incineration produces dioxins.' },
    },
  },
};
