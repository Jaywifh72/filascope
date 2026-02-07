// Extended material reference data for specialty/brand-specific materials
import type { MaterialReferenceInfo } from './materialReferenceData';

export const EXTENDED_MATERIAL_REFERENCE_DATA: Record<string, MaterialReferenceInfo> = {

  'AquaPrint PLA': {
    name: 'AquaPrint PLA',
    fullName: 'Water-Washable Support PLA',
    origin: {
      yearInvented: '2022+',
      originalCompany: 'Polymaker and others',
      majorManufacturers: ['Polymaker', 'eSUN', 'Bambu Lab'],
    },
    composition: {
      basePolymer: 'Modified PLA with water-soluble additives',
      chemicalFamily: 'Aliphatic Polyester (Modified)',
      keyAdditives: ['Water-soluble binder', 'PVA-related compounds', 'Plasticizers'],
      coloringAgents: 'Usually natural/white for support visibility',
    },
    familyContext: {
      parentPolymer: 'PLA modified for water solubility',
      variants: ['AquaPrint PLA', 'Water-Washable Support PLA'],
      chemicalComparison: 'Bridges PLA printability with PVA water-solubility. Easier to store than PVA.',
      evolution: 'Created to solve PVA moisture sensitivity while retaining water-washable support benefits.',
    },
    strengths: {
      uniqueProperties: ['Water-soluble support material', 'Better moisture resistance than PVA', 'Prints at PLA temperatures', 'Compatible with PLA/PETG'],
      bestUseScenarios: ['Dissolvable supports for PLA prints', 'Complex internal geometries', 'Multi-material printing'],
      advantagesOverCompetitors: ['More humidity resistant than PVA', 'Easier to store', 'Prints like PLA'],
      whyChooseThis: 'When you need water-washable supports without PVA\'s extreme moisture sensitivity.',
    },
    weaknesses: {
      limitations: ['Still moisture sensitive (less than PVA)', 'Slower dissolution than PVA', 'Not as universally compatible as PVA'],
      commonProblems: ['Requires warm water and time to dissolve', 'Must be kept dry during storage'],
      whenNotToUse: ['When breakaway supports suffice', 'Single extruder printers'],
    },
    practicalContext: {
      commonApplications: ['Complex PLA supports', 'Internal channels', 'Clean support removal'],
      costPosition: 'Premium',
    },
    trivia: {
      funFacts: ['Designed to combine the best of PVA and PLA into one support material'],
      whyInvented: 'PVA was too moisture-sensitive for practical daily use.',
      marketAdoption: 'Growing as an alternative to PVA for support material.',
    },
    printSettings: {
      nozzleTemp: { min: 190, max: 220, optimal: 205 },
      bedTemp: { min: 45, max: 60, optimal: 55 },
      coolingFan: { min: 50, max: 100, notes: 'Standard PLA cooling.' },
      enclosure: { required: false },
      drying: { temp: 50, duration: '4-6 hours', notes: 'Less sensitive than PVA but still benefits from drying.' },
      printSpeed: { recommended: '30-50 mm/s' },
    },
    safety: {
      fumes: { level: 'Very Low', notes: 'Safe like PLA.' },
      foodSafety: { rating: 'Not Applicable', notes: 'Support material — dissolves away.' },
      biodegradability: { rating: 'Water Soluble', notes: 'Dissolves in water.' },
    },
  },

  'ESD-PLA': {
    name: 'ESD-PLA',
    fullName: 'Electrostatic Dissipative Polylactic Acid',
    origin: {
      yearInvented: '2018+',
      originalCompany: 'Multiple manufacturers',
      majorManufacturers: ['3DXTech', 'Polymaker', 'eSUN', 'Protopasta'],
    },
    composition: {
      basePolymer: 'PLA with conductive carbon additives',
      chemicalFamily: 'Aliphatic Polyester (ESD Modified)',
      keyAdditives: ['Carbon nanotubes', 'Carbon black', 'Conductive fibers'],
      coloringAgents: 'Black only due to carbon additives',
    },
    familyContext: {
      parentPolymer: 'PLA with ESD additives',
      variants: ['ESD-PLA'],
      chemicalComparison: 'Easiest-to-print ESD material. Lower performance than ESD-PETG or ESD-PC but far simpler to use.',
      evolution: 'Developed to make ESD protection accessible without engineering-grade printing requirements.',
    },
    strengths: {
      uniqueProperties: ['Static dissipative (10⁶–10⁹ ohms/sq)', 'Prints like PLA', 'No enclosure needed', 'Consistent ESD properties'],
      bestUseScenarios: ['Electronics handling trays', 'PCB fixtures', 'ESD-safe enclosures', 'Component storage'],
      advantagesOverCompetitors: ['Easiest ESD material to print', 'No heated chamber required', 'Low cost of entry'],
      whyChooseThis: 'When you need basic ESD protection with PLA-level printing ease.',
    },
    weaknesses: {
      limitations: ['Low heat resistance (PLA base)', 'Black only', 'Lower ESD consistency than engineering ESD materials', 'Abrasive to brass nozzles'],
      commonProblems: ['Nozzle wear', 'ESD properties vary with humidity', 'Brittle like filled PLA'],
      whenNotToUse: ['High-temp environments', 'Critical ESD applications (use ESD-PC)', 'When color options needed'],
    },
    practicalContext: {
      commonApplications: ['Component trays', 'Test fixtures', 'Electronics housings', 'Prototyping ESD-safe tools'],
      safetyStandards: ['ANSI/ESD S20.20 (verify per product)'],
      costPosition: 'Standard',
    },
    trivia: {
      funFacts: ['A single static spark can destroy a $500 microchip — ESD-PLA helps prevent that'],
      whyInvented: 'To bring ESD protection to makers and prototypers without industrial printers.',
      marketAdoption: 'Growing in electronics hobbyist and small-batch manufacturing communities.',
    },
    tdsProfile: {
      properties: [
        { name: 'Surface Resistivity', value: '10⁶–10⁹', unit: 'ohms/sq', implications: 'Static dissipative range — safe for electronics.' },
        { name: 'Tensile Strength', value: '35-45', unit: 'MPa', implications: 'Reduced from standard PLA.' },
        { name: 'Glass Transition', value: '55-60', unit: '°C', implications: 'Standard PLA heat limits apply.' },
      ],
    },
    printSettings: {
      nozzleTemp: { min: 210, max: 235, optimal: 220 },
      bedTemp: { min: 50, max: 65, optimal: 55 },
      coolingFan: { min: 40, max: 80, notes: 'Moderate cooling.' },
      enclosure: { required: false },
      drying: { temp: 50, duration: '4-6 hours' },
      printSpeed: { recommended: '30-50 mm/s' },
      additionalNotes: ['HARDENED NOZZLE RECOMMENDED', 'Verify ESD properties after printing'],
    },
    safety: {
      fumes: { level: 'Low', notes: 'PLA-level emissions.' },
      foodSafety: { rating: 'Not Safe', notes: 'Carbon additives preclude food contact.' },
      biodegradability: { rating: 'Not Biodegradable', notes: 'Carbon additives prevent composting.' },
    },
  },

  'FlameGuard PLA': {
    name: 'FlameGuard PLA',
    fullName: 'Flame Retardant Polylactic Acid',
    origin: {
      yearInvented: '2022+',
      originalCompany: 'Polymaker',
      majorManufacturers: ['Polymaker'],
    },
    composition: {
      basePolymer: 'PLA with flame retardant additives',
      chemicalFamily: 'Aliphatic Polyester (Flame Retardant)',
      keyAdditives: ['Phosphorus-based flame retardants', 'Char-forming agents', 'Synergists'],
      coloringAgents: 'Limited colors — typically white and black',
    },
    familyContext: {
      parentPolymer: 'PLA with FR additives',
      variants: ['FlameGuard PLA', 'FlameGuard ASA 275'],
      chemicalComparison: 'Brings UL94 V0/V2 fire safety to easy-to-print PLA. Trade-off is reduced mechanical properties.',
      evolution: 'Polymaker\'s FlameGuard line addresses fire safety without moving to engineering polymers.',
    },
    strengths: {
      uniqueProperties: ['UL94 V0/V2 rated', 'Self-extinguishing', 'Prints like PLA', 'No enclosure needed'],
      bestUseScenarios: ['Electrical enclosures', 'LED housings', 'Switch plates', 'Parts near heat sources'],
      advantagesOverCompetitors: ['Only FR material that prints like PLA', 'No heated chamber', 'Affordable fire safety'],
      whyChooseThis: 'When fire safety certification is needed but your printer can only handle PLA.',
    },
    weaknesses: {
      limitations: ['Reduced impact resistance', 'Limited colors', 'More brittle than standard PLA', 'FR additives affect layer adhesion'],
      commonProblems: ['Slightly more difficult than standard PLA', 'Surface quality may differ', 'Layer adhesion slightly weaker'],
      whenNotToUse: ['Structural parts', 'When fire rating is not needed', 'Impact-critical applications'],
    },
    practicalContext: {
      commonApplications: ['Electrical boxes', 'Light fixtures', 'Wall plates', 'Appliance housings'],
      safetyStandards: ['UL94 V0/V2'],
      costPosition: 'Premium',
    },
    trivia: {
      funFacts: ['One of the few PLA products with actual fire safety certification', 'UL94 V0 means flame self-extinguishes within 10 seconds'],
      whyInvented: 'To bring fire safety to the PLA printing world without complex printer requirements.',
      marketAdoption: 'Niche but important for makers building electrical enclosures.',
    },
    tdsProfile: {
      properties: [
        { name: 'UL94 Rating', value: 'V0/V2', unit: '', implications: 'Self-extinguishing — passes strict fire safety tests.' },
        { name: 'Tensile Strength', value: '40-50', unit: 'MPa', implications: 'Slightly reduced from standard PLA.' },
        { name: 'Glass Transition', value: '55-60', unit: '°C', implications: 'Standard PLA heat limits.' },
      ],
    },
    printSettings: {
      nozzleTemp: { min: 200, max: 230, optimal: 215 },
      bedTemp: { min: 50, max: 65, optimal: 55 },
      coolingFan: { min: 50, max: 100 },
      enclosure: { required: false },
      drying: { temp: 50, duration: '4-6 hours' },
      printSpeed: { recommended: '40-60 mm/s' },
      additionalNotes: ['FR additives may cause slight odor', 'Test UL94 rating on printed parts — wall thickness matters'],
    },
    safety: {
      fumes: { level: 'Low', notes: 'PLA-level with minor FR additive off-gassing. Ventilate.' },
      foodSafety: { rating: 'Not Safe', notes: 'FR additives are not food safe.' },
      biodegradability: { rating: 'Not Compostable', notes: 'FR additives prevent composting.' },
    },
  },

  'Pastello PLA': {
    name: 'Pastello PLA',
    fullName: 'Pastel-Colored Matte Polylactic Acid',
    origin: {
      yearInvented: '2021+',
      originalCompany: 'Rosa3D / Polymaker',
      majorManufacturers: ['Rosa3D', 'Polymaker', 'Bambu Lab'],
    },
    composition: {
      basePolymer: 'PLA with matte surface modifiers',
      chemicalFamily: 'Aliphatic Polyester',
      keyAdditives: ['Matte surface agents', 'Pastel pigments', 'Light diffusing particles'],
      coloringAgents: 'Soft pastel color palette with matte finish',
    },
    familyContext: {
      parentPolymer: 'PLA with aesthetic surface modifications',
      variants: ['Pastello PLA (various pastel colors)'],
      chemicalComparison: 'Standard PLA properties with enhanced surface aesthetics. Matte finish hides layer lines.',
      evolution: 'Part of the aesthetic PLA trend focusing on premium visual finishes.',
    },
    strengths: {
      uniqueProperties: ['Beautiful matte pastel finish', 'Hides layer lines effectively', 'Soft, premium appearance', 'Prints like standard PLA'],
      bestUseScenarios: ['Decorative items', 'Home décor', 'Art pieces', 'Gift items', 'Display models'],
      advantagesOverCompetitors: ['Unique pastel aesthetic', 'No post-processing needed for matte look', 'Layer lines nearly invisible'],
      whyChooseThis: 'When you want beautiful, soft-colored prints with a premium matte finish out of the box.',
    },
    weaknesses: {
      limitations: ['Same mechanical properties as PLA', 'Low heat resistance', 'Matte surface can show fingerprints'],
      commonProblems: ['Color consistency varies between batches', 'Surface scratches more visible on matte'],
      whenNotToUse: ['Functional/structural parts', 'Outdoor use', 'High-temp applications'],
    },
    practicalContext: {
      commonApplications: ['Vases', 'Planters', 'Figurines', 'Home décor', 'Desk accessories'],
      costPosition: 'Standard',
    },
    trivia: {
      funFacts: ['The matte finish is created by micro-particles that scatter light at the surface', 'Pastello filaments are particularly popular for lithophanes and lampshades'],
      whyInvented: 'To provide premium aesthetic options for decorative 3D printing.',
      marketAdoption: 'Popular in the decorative and gift printing market.',
    },
    printSettings: {
      nozzleTemp: { min: 195, max: 220, optimal: 210 },
      bedTemp: { min: 50, max: 65, optimal: 55 },
      coolingFan: { min: 80, max: 100 },
      enclosure: { required: false },
      drying: { temp: 45, duration: '4-6 hours' },
      printSpeed: { recommended: '40-60 mm/s' },
    },
    safety: {
      fumes: { level: 'Very Low', notes: 'Standard PLA emissions.' },
      foodSafety: { rating: 'Not Recommended', notes: 'Matte additives may not be food safe.' },
      biodegradability: { rating: 'Industrial Composting', notes: 'Same as PLA base.' },
    },
  },

  'PLA Crystal': {
    name: 'PLA Crystal',
    fullName: 'Translucent/Crystal-Clear Polylactic Acid',
    origin: {
      yearInvented: '2018+',
      originalCompany: 'Various manufacturers',
      majorManufacturers: ['Bambu Lab', 'Polymaker', 'eSUN', 'Sunlu'],
    },
    composition: {
      basePolymer: 'High-clarity PLA formulation',
      chemicalFamily: 'Aliphatic Polyester (Optical Grade)',
      keyAdditives: ['Clarity enhancers', 'Anti-haze agents', 'Minimal pigmentation'],
      coloringAgents: 'Transparent/translucent with optional tinting',
    },
    familyContext: {
      parentPolymer: 'PLA optimized for optical clarity',
      variants: ['PLA Crystal Clear', 'PLA Translucent', 'PLA Glass'],
      chemicalComparison: 'Same PLA chemistry but with additives to maximize light transmission.',
    },
    strengths: {
      uniqueProperties: ['High optical clarity for PLA', 'Light-transmitting', 'Prints like standard PLA', 'Available in tinted variants'],
      bestUseScenarios: ['Light covers', 'Lampshades', 'Decorative pieces', 'Lens prototypes', 'Display cases'],
      advantagesOverCompetitors: ['Easier to print than PMMA or PC', 'Good clarity at low cost', 'No enclosure needed'],
      whyChooseThis: 'When you need translucent or clear prints with PLA\'s ease of printing.',
    },
    weaknesses: {
      limitations: ['Not optically clear like PMMA', 'Layer lines reduce transparency', 'Standard PLA heat limits'],
      commonProblems: ['Layer lines visible in transparent prints', 'Requires high cooling for best clarity'],
      whenNotToUse: ['True optical clarity needed (use PMMA)', 'High heat applications'],
    },
    practicalContext: {
      commonApplications: ['Lampshades', 'Light diffusers', 'Decorative vases', 'Window mock-ups', 'Lens prototypes'],
      costPosition: 'Standard',
    },
    trivia: {
      funFacts: ['Thinner walls = more transparent. Single-wall vase mode gives best clarity.', 'Higher print temps and lower speeds improve transparency.'],
      whyInvented: 'To enable translucent/transparent printing without moving to difficult materials.',
      marketAdoption: 'Popular for decorative and lighting applications.',
    },
    printSettings: {
      nozzleTemp: { min: 200, max: 230, optimal: 215 },
      bedTemp: { min: 50, max: 65, optimal: 55 },
      coolingFan: { min: 80, max: 100, notes: 'High cooling improves clarity.' },
      enclosure: { required: false },
      printSpeed: { recommended: '30-50 mm/s', notes: 'Slower = clearer.' },
      additionalNotes: ['Vase mode gives best transparency', 'Minimize retractions to avoid bubbles'],
    },
    safety: {
      fumes: { level: 'Very Low', notes: 'Standard PLA.' },
      foodSafety: { rating: 'Check Brand', notes: 'Some clear PLA is food-safe.' },
      biodegradability: { rating: 'Industrial Composting', notes: 'Standard PLA.' },
    },
  },

  'PLA Economy': {
    name: 'PLA Economy',
    fullName: 'Budget/Economy Grade Polylactic Acid',
    origin: {
      yearInvented: '2020+',
      originalCompany: 'Various budget filament manufacturers',
      majorManufacturers: ['Bambu Lab', 'Sunlu', 'Jayo', 'Overture'],
    },
    composition: {
      basePolymer: 'Standard PLA (may use recycled or lower-grade resin)',
      chemicalFamily: 'Aliphatic Polyester',
      keyAdditives: ['Standard pigments', 'Minimal additives'],
      coloringAgents: 'Basic color range',
    },
    familyContext: {
      parentPolymer: 'Standard PLA at reduced cost',
      variants: ['PLA Economy', 'PLA Basic', 'PLA Lite'],
      chemicalComparison: 'Same chemistry as standard PLA but may have wider tolerances and simpler formulation.',
    },
    strengths: {
      uniqueProperties: ['Lowest cost PLA option', 'Adequate for most uses', 'Wide availability'],
      bestUseScenarios: ['Prototyping', 'Testing designs', 'High-volume non-critical parts', 'Learning to print'],
      advantagesOverCompetitors: ['Significantly cheaper', 'Good enough for most applications'],
      whyChooseThis: 'When cost is the primary concern and premium properties aren\'t needed.',
    },
    weaknesses: {
      limitations: ['May have wider diameter tolerance', 'Color consistency less reliable', 'Slightly lower quality surface finish'],
      commonProblems: ['Occasional diameter variations', 'Color may vary between spools', 'Slightly more stringing'],
      whenNotToUse: ['Precision parts', 'Final products', 'When consistency is critical'],
    },
    practicalContext: {
      commonApplications: ['Draft prototypes', 'Learning prints', 'Functional test parts', 'High-volume items'],
      costPosition: 'Budget',
    },
    trivia: {
      funFacts: ['Economy PLA is often the same chemistry as premium PLA with wider QC tolerances'],
      whyInvented: 'Market demand for affordable filament for hobbyists and education.',
      marketAdoption: 'Very popular — often the best-selling SKU from major brands.',
    },
    printSettings: {
      nozzleTemp: { min: 195, max: 220, optimal: 210 },
      bedTemp: { min: 50, max: 65, optimal: 55 },
      coolingFan: { min: 80, max: 100 },
      enclosure: { required: false },
      printSpeed: { recommended: '40-70 mm/s' },
    },
    safety: {
      fumes: { level: 'Very Low', notes: 'Standard PLA.' },
      foodSafety: { rating: 'Not Certified', notes: 'Budget materials unlikely to be food-contact certified.' },
      biodegradability: { rating: 'Industrial Composting', notes: 'Standard PLA.' },
    },
  },

  'PLA Glow in the Dark': {
    name: 'PLA Glow in the Dark',
    fullName: 'Phosphorescent (Glow-in-the-Dark) Polylactic Acid',
    origin: {
      yearInvented: '2014+',
      originalCompany: 'Multiple early filament brands',
      majorManufacturers: ['Hatchbox', 'eSUN', 'Sunlu', 'Polymaker', 'Bambu Lab'],
    },
    composition: {
      basePolymer: 'PLA with phosphorescent pigments',
      chemicalFamily: 'Aliphatic Polyester with Inorganic Phosphors',
      keyAdditives: ['Strontium aluminate phosphors', 'Coupling agents'],
      coloringAgents: 'Typically green or blue glow, base color is pale green/white',
      specialFillers: ['Strontium aluminate particles (glow pigment)'],
    },
    familyContext: {
      parentPolymer: 'PLA filled with phosphorescent particles',
      variants: ['Green glow', 'Blue glow', 'Orange glow', 'Multi-color glow'],
      chemicalComparison: 'Strontium aluminate is extremely abrasive — more so than carbon fiber.',
    },
    strengths: {
      uniqueProperties: ['Glows in the dark for hours', 'Unique visual effect', 'Charges from any light source', 'Fun for decoration'],
      bestUseScenarios: ['Night lights', 'Emergency markers', 'Novelty items', 'Children\'s toys', 'Halloween decorations'],
      advantagesOverCompetitors: ['Only printable glow material', 'Long glow duration with modern pigments', 'Bright initial glow'],
      whyChooseThis: 'For any print that needs to glow in darkness — novelty, safety markers, or decorative items.',
    },
    weaknesses: {
      limitations: ['EXTREMELY abrasive — worse than CF', 'Limited to pale green/blue base color', 'Weaker than standard PLA', 'Glow fades over hours'],
      commonProblems: ['Destroys brass nozzles FAST', 'Clogging with fine nozzles', 'Brittle parts', 'Inconsistent glow between brands'],
      whenNotToUse: ['Without hardened nozzle', 'Structural applications', 'When specific colors needed'],
    },
    practicalContext: {
      commonApplications: ['Night lights', 'Switch plates', 'Key fobs', 'Ornaments', 'Safety markers'],
      costPosition: 'Standard',
    },
    trivia: {
      funFacts: [
        'Strontium aluminate (the glow pigment) is harder than steel — hence the nozzle wear',
        'Modern glow pigments can emit light for 8+ hours after charging',
        'Thicker walls glow brighter and longer',
      ],
      whyInvented: 'To bring phosphorescent effects to 3D printed objects.',
      marketAdoption: 'One of the most popular novelty filaments.',
    },
    tdsProfile: {
      properties: [
        { name: 'Tensile Strength', value: '30-40', unit: 'MPa', implications: 'Reduced from standard PLA by filler content.' },
        { name: 'Glow Duration', value: '4-8', unit: 'hours', implications: 'Visible glow time after charging.' },
        { name: 'Abrasiveness', value: 'Very High', unit: '', implications: 'HARDENED NOZZLE MANDATORY.' },
      ],
    },
    printSettings: {
      nozzleTemp: { min: 200, max: 230, optimal: 215 },
      bedTemp: { min: 50, max: 65, optimal: 55 },
      coolingFan: { min: 60, max: 100 },
      enclosure: { required: false },
      printSpeed: { recommended: '30-50 mm/s', notes: 'Slower to avoid clogging.' },
      additionalNotes: [
        'HARDENED NOZZLE ABSOLUTELY REQUIRED — abrasion is extreme',
        'Use 0.5mm+ nozzle to prevent clogging',
        'Thicker walls = brighter glow',
      ],
    },
    safety: {
      fumes: { level: 'Low', notes: 'PLA-level. Strontium aluminate is non-toxic.' },
      foodSafety: { rating: 'Not Safe', notes: 'Phosphorescent particles not food-safe.' },
      biodegradability: { rating: 'Not Compostable', notes: 'Mineral particles prevent composting.' },
    },
  },

  'PLA Hi-Flow Pro': {
    name: 'PLA Hi-Flow Pro',
    fullName: 'High-Flow Professional Polylactic Acid',
    origin: {
      yearInvented: '2023+',
      originalCompany: 'Bambu Lab, Polymaker',
      majorManufacturers: ['Bambu Lab', 'Polymaker'],
    },
    composition: {
      basePolymer: 'PLA optimized for high flow rates',
      chemicalFamily: 'Aliphatic Polyester (High-Flow)',
      keyAdditives: ['Flow enhancers', 'Melt-flow modifiers', 'Crystallization control agents'],
    },
    familyContext: {
      parentPolymer: 'PLA engineered for maximum flow rate',
      variants: ['PLA Hi-Flow Pro', 'PLA-HP'],
      chemicalComparison: 'Modified PLA rheology for extreme flow rates in high-speed printers. Standard PLA would degrade or under-extrude at these speeds.',
    },
    strengths: {
      uniqueProperties: ['Designed for 300+ mm/s printing', 'Maintains quality at extreme speeds', 'Excellent layer adhesion at speed', 'Reduced pressure in hotend'],
      bestUseScenarios: ['High-speed printing (Bambu Lab, Creality K1)', 'Rapid prototyping', 'Production runs', 'Time-critical prints'],
      advantagesOverCompetitors: ['2-3x faster than standard PLA', 'Better quality at speed than generic PLA', 'Specifically tuned for modern high-speed printers'],
      whyChooseThis: 'When print speed is critical and you have a high-speed printer.',
    },
    weaknesses: {
      limitations: ['Optimized for specific printers', 'May not print well at slow speeds', 'Premium pricing', 'Limited color range initially'],
      commonProblems: ['May need calibration for slower printers', 'Some brands better than others'],
      whenNotToUse: ['Slow printers (under 100mm/s)', 'When standard PLA works fine'],
    },
    practicalContext: {
      commonApplications: ['Rapid prototypes', 'Production parts', 'High-volume printing', 'Time-critical projects'],
      costPosition: 'Premium',
    },
    trivia: {
      funFacts: ['High-flow PLA can complete prints in 1/3 the time of standard PLA', 'The melt flow index (MFI) is significantly higher than standard PLA'],
      whyInvented: 'Modern printers can move faster than standard PLA can melt — high-flow formulations solve this bottleneck.',
      marketAdoption: 'Rapidly growing with high-speed printer adoption.',
    },
    printSettings: {
      nozzleTemp: { min: 210, max: 240, optimal: 225 },
      bedTemp: { min: 50, max: 65, optimal: 55 },
      coolingFan: { min: 60, max: 100 },
      enclosure: { required: false },
      printSpeed: { recommended: '150-300 mm/s', notes: 'Designed for high-speed printers.' },
      additionalNotes: ['Optimized for high-speed printers (Bambu, Creality K1, etc.)', 'Higher nozzle temp than standard PLA helps flow'],
    },
    safety: {
      fumes: { level: 'Low', notes: 'Standard PLA emissions. Higher speeds = faster extrusion but same material.' },
      foodSafety: { rating: 'Check Brand', notes: 'Same as base PLA.' },
      biodegradability: { rating: 'Industrial Composting', notes: 'Standard PLA.' },
    },
  },

  'PLA High Speed Pro': {
    name: 'PLA High Speed Pro',
    fullName: 'High-Speed Professional Polylactic Acid',
    origin: {
      yearInvented: '2023+',
      originalCompany: 'Bambu Lab, Polymaker',
      majorManufacturers: ['Bambu Lab', 'Polymaker', 'eSUN', 'Sunlu'],
    },
    composition: {
      basePolymer: 'PLA with high melt-flow index',
      chemicalFamily: 'Aliphatic Polyester (High-Speed)',
      keyAdditives: ['Melt flow rate enhancers', 'Rapid crystallization agents'],
    },
    familyContext: {
      parentPolymer: 'PLA optimized for speed',
      variants: ['PLA HS', 'PLA High Speed', 'PLA-HS', 'Premium PLA High Speed'],
      chemicalComparison: 'Same as PLA Hi-Flow Pro — engineered for high volumetric flow.',
    },
    strengths: {
      uniqueProperties: ['Extreme print speeds (200-500 mm/s)', 'Good layer adhesion at speed', 'Consistent extrusion under pressure'],
      bestUseScenarios: ['Speed-critical prints', 'Batch production', 'Rapid prototyping'],
      whyChooseThis: 'The go-to PLA for anyone with a high-speed printer.',
    },
    weaknesses: {
      limitations: ['May underperform on slow printers', 'Slightly different properties than standard PLA'],
      commonProblems: ['Needs high-flow hotend for best results', 'Temperature tuning required'],
      whenNotToUse: ['Budget printers limited to 60 mm/s'],
    },
    practicalContext: {
      commonApplications: ['High-speed prototyping', 'Production runs', 'Competition printing'],
      costPosition: 'Standard',
    },
    trivia: {
      funFacts: ['Some high-speed PLA can print a Benchy in under 15 minutes'],
      whyInvented: 'Printer speeds outpaced filament capabilities — HS PLA closes the gap.',
      marketAdoption: 'One of the fastest-growing filament categories.',
    },
    printSettings: {
      nozzleTemp: { min: 210, max: 240, optimal: 225 },
      bedTemp: { min: 50, max: 65, optimal: 55 },
      coolingFan: { min: 80, max: 100, notes: 'Maximum cooling at high speeds.' },
      enclosure: { required: false },
      printSpeed: { recommended: '150-500 mm/s', notes: 'Designed for high-speed printers.' },
    },
    safety: {
      fumes: { level: 'Low', notes: 'Standard PLA.' },
      foodSafety: { rating: 'Check Brand' },
      biodegradability: { rating: 'Industrial Composting' },
    },
  },

  'PLA Magic SILK': {
    name: 'PLA Magic SILK',
    fullName: 'Dual/Multi-Color Shifting Silk PLA',
    origin: {
      yearInvented: '2020+',
      originalCompany: 'Various Chinese manufacturers (Eryone, Sunlu)',
      majorManufacturers: ['Eryone', 'Sunlu', 'Ziro', 'TTYT3D', 'Bambu Lab'],
    },
    composition: {
      basePolymer: 'PLA with multi-pigment silk additives',
      chemicalFamily: 'Aliphatic Polyester with Optical Effect Additives',
      keyAdditives: ['Dual/triple pigment system', 'Silk/pearl effect particles', 'Color-shifting compounds'],
      coloringAgents: 'Multiple metallic pigments that transition between colors based on viewing angle',
    },
    familyContext: {
      parentPolymer: 'Silk PLA with multi-color shifting effect',
      variants: ['Magic Silk (dual color)', 'Rainbow Silk', 'Tri-Color Silk'],
      chemicalComparison: 'Standard Silk PLA with added color-shifting pigments for "magic" effect.',
    },
    strengths: {
      uniqueProperties: ['Color shifts with viewing angle', 'Metallic silk finish', 'Eye-catching dual-color effect', 'No post-processing needed'],
      bestUseScenarios: ['Decorative prints', 'Gifts', 'Artistic pieces', 'Display items'],
      whyChooseThis: 'For stunning color-shifting prints that look different from every angle.',
    },
    weaknesses: {
      limitations: ['Same as Silk PLA — reduced strength', 'Color effect varies with print orientation', 'Can\'t control where colors appear'],
      commonProblems: ['Stringing more common than standard PLA', 'Color distribution unpredictable'],
      whenNotToUse: ['Functional parts', 'Consistent color needed'],
    },
    practicalContext: {
      commonApplications: ['Vases', 'Figurines', 'Jewelry', 'Decorative bowls', 'Gift items'],
      costPosition: 'Premium',
    },
    trivia: {
      funFacts: ['The "magic" effect comes from mica flakes coated with multiple metallic pigments'],
      whyInvented: 'To create even more eye-catching filaments beyond single-color silk.',
      marketAdoption: 'Very popular in the decorative printing segment.',
    },
    printSettings: {
      nozzleTemp: { min: 200, max: 230, optimal: 215 },
      bedTemp: { min: 55, max: 65, optimal: 60 },
      coolingFan: { min: 30, max: 70, notes: 'Lower cooling for better silk effect.' },
      enclosure: { required: false },
      printSpeed: { recommended: '30-60 mm/s', notes: 'Slower speeds show the effect better.' },
    },
    safety: {
      fumes: { level: 'Very Low', notes: 'Standard PLA.' },
      foodSafety: { rating: 'Not Safe', notes: 'Metallic pigments not food-safe.' },
      biodegradability: { rating: 'Not Compostable', notes: 'Metallic additives prevent composting.' },
    },
  },

  'PLA Matte Dual-Color': {
    name: 'PLA Matte Dual-Color',
    fullName: 'Dual-Color Matte Polylactic Acid',
    origin: {
      yearInvented: '2023+',
      originalCompany: 'Bambu Lab, Sunlu',
      majorManufacturers: ['Bambu Lab', 'Sunlu', 'Eryone'],
    },
    composition: {
      basePolymer: 'PLA with matte finish and dual-color pigments',
      chemicalFamily: 'Aliphatic Polyester',
      keyAdditives: ['Matte surface agents', 'Dual-color pigments'],
    },
    familyContext: {
      parentPolymer: 'PLA combining matte and dual-color effects',
      variants: ['Various color combinations'],
      chemicalComparison: 'Combines Pastello/Matte PLA finish with dual-color shifting.',
    },
    strengths: {
      uniqueProperties: ['Matte finish with color-shifting effect', 'Hides layer lines', 'Unique aesthetic', 'Prints like standard PLA'],
      bestUseScenarios: ['Decorative items', 'Art pieces', 'Home décor'],
      whyChooseThis: 'For a unique matte finish that shifts between two colors.',
    },
    weaknesses: {
      limitations: ['Standard PLA properties', 'Limited color combinations available'],
      commonProblems: ['Color shift visibility depends on print orientation'],
      whenNotToUse: ['Functional applications', 'Single-color needed'],
    },
    practicalContext: {
      commonApplications: ['Decorative prints', 'Artistic projects', 'Display pieces'],
      costPosition: 'Premium',
    },
    trivia: {
      funFacts: ['Combines two of the most popular PLA trends: matte finish and color-shifting'],
      whyInvented: 'To merge the best aesthetic effects into one filament.',
      marketAdoption: 'New but growing quickly.',
    },
    printSettings: {
      nozzleTemp: { min: 200, max: 225, optimal: 210 },
      bedTemp: { min: 50, max: 65, optimal: 55 },
      coolingFan: { min: 60, max: 100 },
      enclosure: { required: false },
      printSpeed: { recommended: '40-60 mm/s' },
    },
    safety: {
      fumes: { level: 'Very Low' },
      foodSafety: { rating: 'Not Recommended' },
      biodegradability: { rating: 'Industrial Composting' },
    },
  },

  'PLA Silk': {
    name: 'PLA Silk',
    fullName: 'Silk/Metallic Sheen Polylactic Acid',
    origin: {
      yearInvented: '2017+',
      originalCompany: 'Multiple manufacturers (CC3D, Eryone)',
      majorManufacturers: ['Eryone', 'Sunlu', 'Polymaker', 'eSUN', 'Bambu Lab', 'Hatchbox'],
    },
    composition: {
      basePolymer: 'PLA with metallic/pearl effect additives',
      chemicalFamily: 'Aliphatic Polyester with Metallic Effect Fillers',
      keyAdditives: ['Mica flakes', 'Pearl pigments', 'Metallic luster compounds'],
      coloringAgents: 'Metallic/pearlescent pigments create shimmering silk effect',
    },
    familyContext: {
      parentPolymer: 'PLA with metallic surface effect additives',
      variants: ['Silk Gold', 'Silk Silver', 'Silk Copper', 'Silk Rainbow', 'Magic Silk'],
      chemicalComparison: 'Standard PLA chemistry with mica-based pigments that create directional reflectance.',
    },
    strengths: {
      uniqueProperties: ['Stunning metallic/silk finish', 'Hides layer lines exceptionally well', 'No post-processing needed', 'Wide color range'],
      bestUseScenarios: ['Decorative items', 'Vases', 'Figurines', 'Trophy/award pieces', 'Artistic prints'],
      advantagesOverCompetitors: ['Most visually striking PLA variant', 'Layer lines nearly invisible', 'Affordable premium look'],
      whyChooseThis: 'When you want prints that look metallic and premium without any post-processing.',
    },
    weaknesses: {
      limitations: ['Reduced strength vs standard PLA', 'More stringing than standard PLA', 'Higher print temp needed', 'Surface shows scratches'],
      commonProblems: ['Stringing and oozing', 'Requires temperature tuning', 'Not as strong as standard PLA'],
      whenNotToUse: ['Functional parts', 'Parts needing maximum strength', 'Parts that will be sanded'],
    },
    practicalContext: {
      commonApplications: ['Vases', 'Sculptures', 'Desk accessories', 'Jewelry', 'Gift items', 'Award trophies'],
      costPosition: 'Standard',
    },
    trivia: {
      funFacts: [
        'The silk effect comes from aligned mica flakes that reflect light directionally',
        'Silk PLA was one of the first "aesthetic" filament categories to go mainstream',
        'Lower cooling gives a shinier, more pronounced silk effect',
      ],
      whyInvented: 'Created to produce metallic-looking prints without metal filament complications.',
      marketAdoption: 'One of the most popular specialty PLA categories globally.',
    },
    tdsProfile: {
      properties: [
        { name: 'Tensile Strength', value: '35-45', unit: 'MPa', implications: 'Lower than standard PLA due to additives.' },
        { name: 'Elongation at Break', value: '5-10', unit: '%', implications: 'Slightly more flexible than standard PLA.' },
        { name: 'Glass Transition', value: '55-60', unit: '°C', implications: 'Standard PLA heat limits.' },
      ],
    },
    printSettings: {
      nozzleTemp: { min: 205, max: 235, optimal: 220 },
      bedTemp: { min: 55, max: 65, optimal: 60 },
      coolingFan: { min: 30, max: 70, notes: 'Lower cooling = shinier finish.' },
      enclosure: { required: false },
      printSpeed: { recommended: '30-60 mm/s', notes: 'Slower speeds enhance the silk effect.' },
      additionalNotes: ['Print 5-10°C hotter than standard PLA', 'Reduce cooling for maximum shine', 'Slower speeds give better luster'],
    },
    safety: {
      fumes: { level: 'Very Low', notes: 'Standard PLA emissions.' },
      foodSafety: { rating: 'Not Safe', notes: 'Metallic pigments not food-safe.' },
      biodegradability: { rating: 'Not Compostable', notes: 'Metallic additives prevent composting.' },
    },
  },

  'PLA SILK Rainbow': {
    name: 'PLA SILK Rainbow',
    fullName: 'Rainbow/Gradient Silk Polylactic Acid',
    origin: {
      yearInvented: '2019+',
      originalCompany: 'Various (Eryone, Sunlu, TTYT3D)',
      majorManufacturers: ['Eryone', 'Sunlu', 'TTYT3D', 'Ziro'],
    },
    composition: {
      basePolymer: 'PLA with multi-color silk pigments in graduated sections',
      chemicalFamily: 'Aliphatic Polyester',
      keyAdditives: ['Silk/metallic pigments', 'Color-transitioning pigment zones'],
    },
    familyContext: {
      parentPolymer: 'Silk PLA with continuous color gradient',
      variants: ['Rainbow', 'Sunset', 'Galaxy Rainbow', 'Pastel Rainbow'],
      chemicalComparison: 'Same as Silk PLA but with pigment zones that transition through multiple colors along the spool.',
    },
    strengths: {
      uniqueProperties: ['Continuous rainbow color gradient', 'Silk metallic finish', 'Automatic color changes', 'No multi-material needed'],
      bestUseScenarios: ['Decorative vases', 'Large artistic prints', 'Rainbow-colored items'],
      whyChooseThis: 'For automatic rainbow color transitions with silk finish — no multi-spool setup needed.',
    },
    weaknesses: {
      limitations: ['Can\'t control where colors land on the print', 'Color cycle length varies by brand', 'Same reduced strength as silk PLA'],
      commonProblems: ['Color placement is random', 'Small prints may only show one or two colors'],
      whenNotToUse: ['When specific color placement needed', 'Functional parts'],
    },
    practicalContext: {
      commonApplications: ['Vases', 'Figurines', 'Large decorative items'],
      costPosition: 'Premium',
    },
    trivia: {
      funFacts: ['The color cycle length determines how much of the rainbow shows on each print'],
      whyInvented: 'To combine the appeal of silk finish with automatic rainbow color transitions.',
      marketAdoption: 'Very popular for decorative printing.',
    },
    printSettings: {
      nozzleTemp: { min: 205, max: 230, optimal: 215 },
      bedTemp: { min: 55, max: 65, optimal: 60 },
      coolingFan: { min: 30, max: 70, notes: 'Lower cooling for silk effect.' },
      enclosure: { required: false },
      printSpeed: { recommended: '30-60 mm/s' },
    },
    safety: {
      fumes: { level: 'Very Low' },
      foodSafety: { rating: 'Not Safe', notes: 'Metallic pigments.' },
      biodegradability: { rating: 'Not Compostable' },
    },
  },

  'PLA Thermoactive': {
    name: 'PLA Thermoactive',
    fullName: 'Thermochromic/Color-Changing Polylactic Acid',
    origin: {
      yearInvented: '2016+',
      originalCompany: 'Various (Amolen, eSUN)',
      majorManufacturers: ['Amolen', 'eSUN', 'Sunlu', 'Bambu Lab'],
    },
    composition: {
      basePolymer: 'PLA with thermochromic pigments',
      chemicalFamily: 'Aliphatic Polyester with Thermochromic Dyes',
      keyAdditives: ['Microencapsulated thermochromic dyes', 'Leuco dye compounds'],
      coloringAgents: 'Thermochromic pigments that change color at specific temperatures',
    },
    familyContext: {
      parentPolymer: 'PLA with temperature-responsive color-changing capability',
      variants: ['Cold-activated (changes below room temp)', 'Heat-activated (changes above room temp)'],
      chemicalComparison: 'Standard PLA with microencapsulated thermochromic dyes that react to temperature.',
    },
    strengths: {
      uniqueProperties: ['Changes color with temperature', 'Interactive and fun', 'Reversible color change', 'Multiple activation temperatures'],
      bestUseScenarios: ['Temperature indicators', 'Interactive toys', 'Novelty items', 'Educational tools', 'Mood rings/objects'],
      whyChooseThis: 'For prints that react visually to touch or environmental temperature.',
    },
    weaknesses: {
      limitations: ['Thermochromic dyes fade with UV exposure', 'Color change may weaken over time', 'Limited base colors', 'Not dishwasher safe'],
      commonProblems: ['UV exposure degrades the color-change effect', 'Effect weakens after many cycles'],
      whenNotToUse: ['Outdoor applications', 'Long-term products', 'Functional parts'],
    },
    practicalContext: {
      commonApplications: ['Temperature indicators', 'Interactive art', 'Children\'s toys', 'Cup holders', 'Novelty gifts'],
      costPosition: 'Premium',
    },
    trivia: {
      funFacts: ['The color change uses the same technology as mood rings', 'UV light permanently damages the thermochromic effect'],
      whyInvented: 'To create interactive, responsive 3D printed objects.',
      marketAdoption: 'Popular novelty item — especially in gifts and educational settings.',
    },
    printSettings: {
      nozzleTemp: { min: 190, max: 215, optimal: 200 },
      bedTemp: { min: 45, max: 60, optimal: 50 },
      coolingFan: { min: 80, max: 100, notes: 'High cooling preserves thermochromic properties.' },
      enclosure: { required: false },
      printSpeed: { recommended: '30-50 mm/s', notes: 'Lower temps and speeds preserve the color-change effect.' },
      additionalNotes: ['Print at LOWEST effective temperature — heat degrades thermochromic dyes', 'Store away from UV light'],
    },
    safety: {
      fumes: { level: 'Very Low', notes: 'Standard PLA.' },
      foodSafety: { rating: 'Not Safe', notes: 'Thermochromic dyes not food-safe.' },
      biodegradability: { rating: 'Not Compostable', notes: 'Specialty pigments prevent composting.' },
    },
  },

  'PLA-Tough': {
    name: 'PLA-Tough',
    fullName: 'Impact-Modified Tough Polylactic Acid',
    origin: {
      yearInvented: '2017+',
      originalCompany: 'Polymaker (PolyMax), multiple brands',
      majorManufacturers: ['Polymaker', 'eSUN', 'Overture', 'Bambu Lab'],
    },
    composition: {
      basePolymer: 'PLA with impact modifiers',
      chemicalFamily: 'Aliphatic Polyester (Toughened)',
      keyAdditives: ['Rubber-like impact modifiers', 'Elastomeric toughening agents'],
    },
    familyContext: {
      parentPolymer: 'PLA enhanced with impact resistance additives',
      variants: ['Tough PLA', 'PLA Pro', 'PolyMax PLA', 'PLA+'],
      chemicalComparison: 'Similar to PLA+ but with additional emphasis on impact resistance over pure strength.',
    },
    strengths: {
      uniqueProperties: ['Much higher impact resistance than PLA', 'Bends before breaking', 'Still prints like PLA', 'Good layer adhesion'],
      bestUseScenarios: ['Functional prototypes', 'Phone cases', 'Tool handles', 'Parts that may be dropped'],
      advantagesOverCompetitors: ['3-10x more impact resistant than standard PLA', 'Easier than PETG', 'No enclosure needed'],
      whyChooseThis: 'When PLA is too brittle but you don\'t want to switch to PETG or ABS.',
    },
    weaknesses: {
      limitations: ['Still PLA heat resistance (~55°C)', 'More expensive than standard PLA', 'Slightly different print settings'],
      commonProblems: ['May need slightly higher temps', 'Some brands are just repackaged PLA+'],
      whenNotToUse: ['High-temp applications', 'When standard PLA strength is sufficient'],
    },
    practicalContext: {
      commonApplications: ['Functional prototypes', 'Protective cases', 'Tool handles', 'Brackets', 'Living hinges'],
      costPosition: 'Standard',
    },
    trivia: {
      funFacts: ['Polymaker\'s PolyMax PLA was one of the first truly "tough" PLA products', 'Impact modifiers are often rubber-like particles dispersed in the PLA matrix'],
      whyInvented: 'To solve PLA\'s biggest weakness — brittleness — without changing printing difficulty.',
      marketAdoption: 'Very popular category bridging PLA ease with functional requirements.',
    },
    tdsProfile: {
      properties: [
        { name: 'Tensile Strength', value: '40-55', unit: 'MPa', implications: 'Similar to standard PLA.' },
        { name: 'Impact Strength', value: '15-30', unit: 'kJ/m²', implications: '3-10x better than standard PLA.' },
        { name: 'Elongation at Break', value: '10-30', unit: '%', implications: 'Much more flexible than standard PLA.' },
      ],
    },
    printSettings: {
      nozzleTemp: { min: 205, max: 230, optimal: 215 },
      bedTemp: { min: 50, max: 65, optimal: 55 },
      coolingFan: { min: 50, max: 100 },
      enclosure: { required: false },
      printSpeed: { recommended: '40-70 mm/s' },
    },
    safety: {
      fumes: { level: 'Very Low', notes: 'PLA-level.' },
      foodSafety: { rating: 'Not Certified', notes: 'Impact modifiers may not be food-safe.' },
      biodegradability: { rating: 'Partially Compostable', notes: 'Additives may reduce compostability.' },
    },
  },

  'PLA-Wood': {
    name: 'PLA-Wood',
    fullName: 'Wood Fiber Filled Polylactic Acid',
    origin: {
      yearInvented: '2013+',
      originalCompany: 'ColorFabb (WoodFill), Multiple brands',
      majorManufacturers: ['ColorFabb', 'Hatchbox', 'eSUN', 'Polymaker', 'Sunlu'],
    },
    composition: {
      basePolymer: 'PLA with wood fiber/powder',
      chemicalFamily: 'Natural Fiber Composite',
      keyAdditives: ['Wood fibers/sawdust (10-40%)', 'Binding agents'],
      coloringAgents: 'Natural wood color. Can vary appearance by changing print temperature.',
      specialFillers: ['Pine, bamboo, or recycled wood fibers'],
    },
    familyContext: {
      parentPolymer: 'PLA filled with natural wood particles',
      variants: ['Pine', 'Bamboo', 'Cork', 'Coconut', 'Cherry', 'Walnut'],
      chemicalComparison: 'PLA matrix with suspended wood particles that provide authentic wood look, feel, and smell.',
    },
    strengths: {
      uniqueProperties: ['Looks and feels like wood', 'Smells like wood when printing', 'Can vary "grain" by temperature', 'Sandable to smooth finish'],
      bestUseScenarios: ['Decorative wood-like items', 'Planters', 'Figurines', 'Architectural models', 'Wood-finish prototypes'],
      advantagesOverCompetitors: ['Authentic wood appearance without CNC', 'Printable on any FDM printer', 'Lower temp = lighter, higher temp = darker "stain"'],
      whyChooseThis: 'When you want printed objects that look and feel like carved wood.',
    },
    weaknesses: {
      limitations: ['Abrasive to brass nozzles', 'Can clog fine nozzles', 'Brittle', 'Weaker than standard PLA', 'Moisture sensitive'],
      commonProblems: ['Clogging with 0.4mm or smaller nozzles', 'Stringing', 'Parts are fragile', 'Inconsistent wood fiber distribution'],
      whenNotToUse: ['Structural parts', 'Without hardened or large nozzle', 'Fine-detail prints'],
    },
    practicalContext: {
      commonApplications: ['Planters', 'Figurines', 'Picture frames', 'Desk accessories', 'Architectural models'],
      costPosition: 'Standard',
    },
    trivia: {
      funFacts: [
        'ColorFabb WoodFill was one of the first wood filaments (2013)',
        'Changing temperature during printing creates realistic "wood grain" effect',
        'The wood particles actually smell like sawdust when printing',
        'Can be stained with actual wood stain after printing',
      ],
      whyInvented: 'Created to enable wood-like aesthetics from a 3D printer.',
      marketAdoption: 'One of the most popular specialty PLA filaments.',
    },
    tdsProfile: {
      properties: [
        { name: 'Tensile Strength', value: '25-40', unit: 'MPa', implications: 'Reduced by wood fiber content.' },
        { name: 'Wood Content', value: '10-40', unit: '%', implications: 'Higher = more wood-like but harder to print.' },
        { name: 'Abrasiveness', value: 'Moderate', unit: '', implications: 'Hardened nozzle recommended for frequent use.' },
      ],
    },
    printSettings: {
      nozzleTemp: { min: 195, max: 230, optimal: 210 },
      bedTemp: { min: 50, max: 65, optimal: 55 },
      coolingFan: { min: 50, max: 100 },
      enclosure: { required: false },
      printSpeed: { recommended: '30-50 mm/s', notes: 'Slower prevents clogging.' },
      additionalNotes: [
        'Use 0.5mm+ nozzle to prevent clogging',
        'Hardened nozzle recommended',
        'Vary temperature 195-230°C for lighter/darker wood effect',
        'Reduce retraction to prevent clogs',
      ],
    },
    safety: {
      fumes: { level: 'Low', notes: 'Slight wood smell — pleasant. Safe with ventilation.' },
      foodSafety: { rating: 'Not Safe', notes: 'Wood particles create porous surface for bacteria.' },
      biodegradability: { rating: 'Partially Compostable', notes: 'Wood fibers biodegrade, PLA requires industrial composting.' },
    },
  },

  'PLA-Matte': {
    name: 'PLA-Matte',
    fullName: 'Matte Finish Polylactic Acid',
    origin: {
      yearInvented: '2020+',
      originalCompany: 'Polymaker (PolyTerra), Bambu Lab',
      majorManufacturers: ['Polymaker', 'Bambu Lab', 'Sunlu', 'eSUN'],
    },
    composition: {
      basePolymer: 'PLA with matte surface modifiers',
      chemicalFamily: 'Aliphatic Polyester',
      keyAdditives: ['Matte surface agents', 'Light-scattering particles', 'Surface texture modifiers'],
    },
    familyContext: {
      parentPolymer: 'PLA optimized for matte surface finish',
      variants: ['Matte PLA', 'PolyTerra PLA', 'Pastello PLA'],
      chemicalComparison: 'Standard PLA with surface-modifying additives that scatter light for matte appearance.',
    },
    strengths: {
      uniqueProperties: ['Beautiful matte finish', 'Hides layer lines excellently', 'Premium aesthetic', 'No post-processing needed'],
      bestUseScenarios: ['Display models', 'Decorative items', 'Photography props', 'Artistic prints'],
      advantagesOverCompetitors: ['Layer lines nearly invisible', 'Professional finish out of the box', 'Prints like standard PLA'],
      whyChooseThis: 'When you want layer-line-free appearance with zero post-processing.',
    },
    weaknesses: {
      limitations: ['Matte surface shows fingerprints/oils', 'May have slightly reduced strength', 'Scratches more visible than glossy'],
      commonProblems: ['Fingerprint marks on light colors', 'Surface scratches show'],
      whenNotToUse: ['When glossy finish desired', 'High-friction applications'],
    },
    practicalContext: {
      commonApplications: ['Display models', 'Figurines', 'Vases', 'Photography props', 'Prototypes for presentation'],
      costPosition: 'Standard',
    },
    trivia: {
      funFacts: ['Polymaker PolyTerra popularized the matte PLA category', 'Matte finish is achieved by micro-particles that scatter light at the surface'],
      whyInvented: 'To eliminate the "3D printed look" from PLA parts.',
      marketAdoption: 'One of the fastest-growing PLA categories.',
    },
    printSettings: {
      nozzleTemp: { min: 195, max: 220, optimal: 210 },
      bedTemp: { min: 50, max: 65, optimal: 55 },
      coolingFan: { min: 80, max: 100 },
      enclosure: { required: false },
      printSpeed: { recommended: '40-70 mm/s' },
    },
    safety: {
      fumes: { level: 'Very Low', notes: 'Standard PLA.' },
      foodSafety: { rating: 'Not Certified', notes: 'Matte additives may not be food-safe.' },
      biodegradability: { rating: 'Industrial Composting', notes: 'Similar to standard PLA.' },
    },
  },

  'LW-PLA': {
    name: 'LW-PLA',
    fullName: 'Lightweight Foaming Polylactic Acid',
    origin: {
      yearInvented: '2019',
      originalCompany: 'ColorFabb',
      majorManufacturers: ['ColorFabb', 'Polymaker', 'Proto-Pasta'],
    },
    composition: {
      basePolymer: 'PLA with chemical foaming agents',
      chemicalFamily: 'Aliphatic Polyester (Foamable)',
      keyAdditives: ['Chemical blowing agents', 'Cell nucleating agents', 'Foam stabilizers'],
    },
    familyContext: {
      parentPolymer: 'PLA with active foaming capability',
      variants: ['LW-PLA', 'LW-PLA-HT (heat-treatable)', 'Active Foaming PLA'],
      chemicalComparison: 'At 230°C+ the foaming agent activates, expanding the material up to 2.7x in volume — reducing density by up to 65%.',
    },
    strengths: {
      uniqueProperties: ['Up to 65% weight reduction when foamed', 'Variable density via temperature control', 'Matte surface finish', 'Excellent for RC planes'],
      bestUseScenarios: ['RC aircraft', 'Drone components', 'Cosplay props', 'Large decorative items', 'Buoyant items'],
      advantagesOverCompetitors: ['Lightest FDM filament when foamed', 'No other material offers this weight reduction', 'Adjustable foam density'],
      whyChooseThis: 'For the lightest possible prints — especially RC aircraft and drones.',
    },
    weaknesses: {
      limitations: ['Dimensional accuracy reduced when foaming', 'Surface finish varies with foam level', 'Complex temperature calibration', 'Reduced strength'],
      commonProblems: ['Over-foaming at high temps', 'Inconsistent density', 'Difficult to predict final dimensions'],
      whenNotToUse: ['Precision parts', 'Structural applications', 'Consistent dimensions needed'],
    },
    practicalContext: {
      commonApplications: ['RC airplane fuselages', 'Cosplay armor', 'Large display models', 'Drone frames', 'Floating objects'],
      costPosition: 'Premium',
    },
    trivia: {
      funFacts: [
        'ColorFabb LW-PLA can expand up to 2.7x its normal volume',
        'RC enthusiasts can print full-size flyable airplanes',
        'The foaming is controlled by print temperature — higher temp = more expansion',
        'At 195°C it prints normally; at 250°C it foams maximally',
      ],
      whyInvented: 'Created specifically for the RC airplane community who needed lightweight printable structures.',
      marketAdoption: 'Beloved in the RC aircraft and cosplay communities.',
    },
    tdsProfile: {
      properties: [
        { name: 'Density (foamed)', value: '0.4-0.8', unit: 'g/cm³', implications: 'Dramatically lighter than standard PLA (1.24 g/cm³).' },
        { name: 'Foam Ratio', value: 'Up to 2.7x', unit: 'volume expansion', implications: 'Maximum expansion at ~250°C nozzle temp.' },
        { name: 'Tensile Strength (foamed)', value: '15-25', unit: 'MPa', implications: 'Reduced by foam structure.' },
      ],
    },
    printSettings: {
      nozzleTemp: { min: 195, max: 260, optimal: 230 },
      bedTemp: { min: 50, max: 65, optimal: 55 },
      coolingFan: { min: 30, max: 80, notes: 'Lower cooling gives better foam cell structure.' },
      enclosure: { required: false },
      printSpeed: { recommended: '20-40 mm/s', notes: 'Slow for consistent foaming.' },
      additionalNotes: [
        '195-210°C: minimal foaming (normal PLA)',
        '230-250°C: active foaming — reduce flow rate to compensate',
        'Reduce extrusion multiplier to 0.4-0.6 at foaming temps',
        'Experiment to find optimal temp/flow balance',
      ],
    },
    safety: {
      fumes: { level: 'Low', notes: 'Foaming agent may produce slight odor. Ventilate.' },
      foodSafety: { rating: 'Not Safe', notes: 'Foam structure creates porous surface.' },
      biodegradability: { rating: 'Partially Compostable', notes: 'PLA base compostable; foaming agents may not be.' },
    },
  },

  'rPLA': {
    name: 'rPLA',
    fullName: 'Recycled Polylactic Acid',
    origin: {
      yearInvented: '2019+',
      originalCompany: 'Various eco-focused brands',
      majorManufacturers: ['Polymaker', 'Prusament', 're:3D', 'Closed Loop Plastics'],
    },
    composition: {
      basePolymer: 'Recycled PLA (post-industrial or post-consumer)',
      chemicalFamily: 'Aliphatic Polyester (Recycled)',
      keyAdditives: ['Stabilizers', 'Chain extenders', 'Color normalization pigments'],
    },
    familyContext: {
      parentPolymer: 'PLA from recycled sources',
      variants: ['rPLA', 'r-PLA', 'Recycled PLA'],
      chemicalComparison: 'Same chemistry as virgin PLA but may have slightly reduced properties from reprocessing.',
    },
    strengths: {
      uniqueProperties: ['Made from recycled material', 'Reduced environmental impact', 'Similar properties to virgin PLA', 'Supports circular economy'],
      bestUseScenarios: ['Eco-conscious projects', 'Prototyping', 'General purpose printing'],
      whyChooseThis: 'When environmental sustainability is important and you want to reduce virgin plastic use.',
    },
    weaknesses: {
      limitations: ['Slightly variable properties', 'Limited color options', 'May have minor inclusions', 'Slightly higher stringing'],
      commonProblems: ['Occasional diameter inconsistencies', 'Color variations'],
      whenNotToUse: ['Critical precision parts', 'Food contact', 'When absolute consistency is needed'],
    },
    practicalContext: {
      commonApplications: ['General prototyping', 'Educational projects', 'Eco-branded products'],
      costPosition: 'Standard',
    },
    trivia: {
      funFacts: ['Prusament Galaxy colors use recycled PLA from their own production waste'],
      whyInvented: 'To close the loop on PLA waste from 3D printing.',
      marketAdoption: 'Growing with environmental awareness.',
    },
    printSettings: {
      nozzleTemp: { min: 195, max: 220, optimal: 210 },
      bedTemp: { min: 50, max: 65, optimal: 55 },
      coolingFan: { min: 80, max: 100 },
      enclosure: { required: false },
      printSpeed: { recommended: '40-60 mm/s' },
    },
    safety: {
      fumes: { level: 'Very Low', notes: 'Same as PLA.' },
      foodSafety: { rating: 'Not Certified', notes: 'Recycled source makes certification unlikely.' },
      biodegradability: { rating: 'Industrial Composting', notes: 'Same as virgin PLA.' },
    },
  },

  'SafeGuard PLA': {
    name: 'SafeGuard PLA',
    fullName: 'Antimicrobial/Safety Polylactic Acid',
    origin: {
      yearInvented: '2022+',
      originalCompany: 'Polymaker',
      majorManufacturers: ['Polymaker'],
    },
    composition: {
      basePolymer: 'PLA with antimicrobial additives',
      chemicalFamily: 'Aliphatic Polyester (Antimicrobial)',
      keyAdditives: ['Antimicrobial compounds', 'Bioactive agents'],
    },
    familyContext: {
      parentPolymer: 'PLA with built-in antimicrobial properties',
      variants: ['SafeGuard PLA'],
      chemicalComparison: 'Standard PLA with embedded antimicrobial agents that inhibit bacterial growth on the surface.',
    },
    strengths: {
      uniqueProperties: ['Antimicrobial surface', 'Inhibits bacterial growth', 'Prints like standard PLA', 'Continuous protection'],
      bestUseScenarios: ['Healthcare tools', 'Kitchen utensils', 'Public-touch items', 'Bathroom accessories'],
      whyChooseThis: 'When antimicrobial properties are needed — handles, tools, or surfaces touched by many people.',
    },
    weaknesses: {
      limitations: ['Standard PLA properties', 'Premium pricing', 'Limited color range', 'Antimicrobial ≠ food safe'],
      commonProblems: ['Same PLA heat limitations'],
      whenNotToUse: ['When antimicrobial isn\'t needed', 'Food contact (still porous)'],
    },
    practicalContext: {
      commonApplications: ['Door handles', 'Touch-free tools', 'Bathroom accessories', 'Public-use items'],
      costPosition: 'Premium',
    },
    trivia: {
      funFacts: ['Antimicrobial additives work continuously — they don\'t "wear off" like coatings'],
      whyInvented: 'Post-COVID demand for antimicrobial surfaces in everyday items.',
      marketAdoption: 'Niche but growing in healthcare-adjacent applications.',
    },
    printSettings: {
      nozzleTemp: { min: 200, max: 220, optimal: 210 },
      bedTemp: { min: 50, max: 65, optimal: 55 },
      coolingFan: { min: 80, max: 100 },
      enclosure: { required: false },
      printSpeed: { recommended: '40-60 mm/s' },
    },
    safety: {
      fumes: { level: 'Very Low', notes: 'Standard PLA.' },
      foodSafety: { rating: 'Not Certified', notes: 'Antimicrobial ≠ food safe. Surface is still porous.' },
      biodegradability: { rating: 'Check Specific', notes: 'Antimicrobial additives may affect compostability.' },
    },
  },

  'ASA 275': {
    name: 'ASA 275',
    fullName: 'High-Temperature ASA (275°C Rated)',
    origin: {
      yearInvented: '2022+',
      originalCompany: 'Polymaker',
      majorManufacturers: ['Polymaker'],
    },
    composition: {
      basePolymer: 'High-temperature modified ASA',
      chemicalFamily: 'Acrylonitrile Styrene Acrylate (High-Temp)',
      keyAdditives: ['Heat stabilizers', 'UV stabilizers', 'High-temp compatible flow agents'],
    },
    familyContext: {
      parentPolymer: 'ASA with enhanced temperature performance',
      variants: ['ASA 275', 'FlameGuard ASA 275'],
      chemicalComparison: 'Standard ASA has ~100°C HDT; ASA 275 is designed for significantly higher thermal loads.',
    },
    strengths: {
      uniqueProperties: ['Very high heat resistance for styrenic', 'UV resistant (like ASA)', 'Good mechanical properties'],
      bestUseScenarios: ['Automotive under-hood', 'High-temp outdoor parts', 'Industrial enclosures near heat sources'],
      whyChooseThis: 'When standard ASA heat resistance isn\'t enough and you need UV resistance.',
    },
    weaknesses: {
      limitations: ['Requires enclosure', 'Higher print temps', 'Styrene fumes', 'Limited availability'],
      commonProblems: ['Warping', 'Fume management'],
      whenNotToUse: ['Without enclosure', 'When standard ASA suffices'],
    },
    practicalContext: {
      commonApplications: ['Automotive', 'Industrial outdoor parts', 'High-temp enclosures'],
      costPosition: 'Premium',
    },
    trivia: {
      funFacts: ['The "275" refers to the nozzle printing temperature, not HDT'],
      whyInvented: 'To push ASA properties toward polycarbonate territory.',
      marketAdoption: 'Niche — for users needing ASA UV resistance at higher temps.',
    },
    printSettings: {
      nozzleTemp: { min: 260, max: 285, optimal: 275 },
      bedTemp: { min: 90, max: 110, optimal: 100 },
      coolingFan: { min: 0, max: 30 },
      enclosure: { required: true, notes: 'Required for warping control and fume management.' },
      drying: { temp: 80, duration: '4-6 hours' },
      printSpeed: { recommended: '40-60 mm/s' },
      additionalNotes: ['All-metal hotend required', 'Good ventilation essential — styrene fumes'],
    },
    safety: {
      fumes: { level: 'High', notes: 'Styrene emissions at elevated temps. HEPA+carbon filtration recommended.' },
      foodSafety: { rating: 'Not Safe', notes: 'Styrene concerns.' },
      biodegradability: { rating: 'Not Biodegradable' },
    },
  },

  'ESD-TPU': {
    name: 'ESD-TPU',
    fullName: 'Electrostatic Dissipative Thermoplastic Polyurethane',
    origin: {
      yearInvented: '2020+',
      originalCompany: 'Various composite filament manufacturers',
      majorManufacturers: ['3DXTech', 'Polymaker', 'Recreus'],
    },
    composition: {
      basePolymer: 'TPU with conductive carbon additives',
      chemicalFamily: 'Thermoplastic Polyurethane (ESD Modified)',
      keyAdditives: ['Carbon nanotubes', 'Carbon black', 'Conductive particles'],
    },
    familyContext: {
      parentPolymer: 'TPU with ESD-safe additives',
      variants: ['ESD-TPU 95A', 'ESD-TPU 85A'],
      chemicalComparison: 'Combines TPU flexibility with static dissipative properties. Unique among ESD materials for being flexible.',
    },
    strengths: {
      uniqueProperties: ['Flexible AND ESD-safe', 'Static dissipative', 'Abrasion resistant', 'Chemical resistant'],
      bestUseScenarios: ['ESD-safe gaskets', 'Flexible electronics enclosures', 'Conveyor belt covers', 'ESD-safe grips'],
      advantagesOverCompetitors: ['Only flexible ESD material', 'Combines flexibility with ESD protection'],
      whyChooseThis: 'When you need ESD protection in a flexible part — no other material can do this.',
    },
    weaknesses: {
      limitations: ['Black only', 'Very difficult to print', 'Expensive', 'Limited availability', 'Requires direct drive'],
      commonProblems: ['All TPU printing challenges plus carbon additives', 'ESD verification needed'],
      whenNotToUse: ['When rigid ESD material works', 'Bowden extruders'],
    },
    practicalContext: {
      commonApplications: ['ESD-safe gaskets', 'Flexible connector covers', 'Anti-static grips', 'Semiconductor handling tools'],
      costPosition: 'Industrial',
    },
    trivia: {
      funFacts: ['The only way to 3D print a flexible, ESD-safe part'],
      whyInvented: 'Electronics manufacturing needed flexible ESD parts that couldn\'t be made any other way.',
      marketAdoption: 'Very niche — industrial applications only.',
    },
    printSettings: {
      nozzleTemp: { min: 220, max: 250, optimal: 235 },
      bedTemp: { min: 50, max: 70, optimal: 60 },
      coolingFan: { min: 20, max: 60 },
      enclosure: { required: false },
      drying: { temp: 60, duration: '4-6 hours', notes: 'Critical — moisture affects both print quality and ESD properties.' },
      printSpeed: { recommended: '15-30 mm/s', notes: 'Very slow — flexible + filled material.' },
      additionalNotes: ['DIRECT DRIVE REQUIRED', 'Hardened nozzle recommended', 'Verify ESD after printing'],
    },
    safety: {
      fumes: { level: 'Low', notes: 'TPU-level emissions.' },
      foodSafety: { rating: 'Not Safe', notes: 'Carbon additives not food-safe.' },
      biodegradability: { rating: 'Not Biodegradable' },
    },
  },

  'TPU-Conductive': {
    name: 'TPU-Conductive',
    fullName: 'Electrically Conductive Thermoplastic Polyurethane',
    origin: {
      yearInvented: '2019+',
      originalCompany: 'Recreus, Multi3D',
      majorManufacturers: ['Recreus', 'Multi3D', 'NinjaTek'],
    },
    composition: {
      basePolymer: 'TPU with conductive carbon fillers',
      chemicalFamily: 'Thermoplastic Polyurethane (Conductive)',
      keyAdditives: ['Carbon black', 'Carbon nanotubes', 'Graphene'],
    },
    familyContext: {
      parentPolymer: 'TPU loaded with conductive carbon',
      variants: ['Conductive TPU', 'PI-TPU'],
      chemicalComparison: 'Like PLA-Conductive but flexible. Enables flexible circuits and sensors.',
    },
    strengths: {
      uniqueProperties: ['Flexible AND conductive', 'Stretchable circuits', 'Pressure-sensitive resistance', 'Wearable electronics'],
      bestUseScenarios: ['Flexible sensors', 'Wearable electronics', 'Pressure pads', 'Stretch sensors'],
      whyChooseThis: 'For flexible electronics — the only way to print stretchable conductive traces.',
    },
    weaknesses: {
      limitations: ['Very difficult to print', 'High resistance', 'Black only', 'Expensive'],
      commonProblems: ['Combining TPU difficulty with carbon filling', 'Inconsistent conductivity'],
      whenNotToUse: ['Rigid circuits (use PLA-Conductive)', 'Without direct drive'],
    },
    practicalContext: {
      commonApplications: ['Flex sensors', 'Wearable interfaces', 'Pressure-sensitive pads', 'E-textiles'],
      costPosition: 'Industrial',
    },
    trivia: {
      funFacts: ['Resistance changes when stretched — enabling simple strain sensors'],
      whyInvented: 'To enable 3D printed flexible/wearable electronics.',
      marketAdoption: 'Research and prototyping use primarily.',
    },
    printSettings: {
      nozzleTemp: { min: 220, max: 250, optimal: 235 },
      bedTemp: { min: 50, max: 70, optimal: 60 },
      coolingFan: { min: 20, max: 50 },
      enclosure: { required: false },
      printSpeed: { recommended: '15-25 mm/s' },
      additionalNotes: ['DIRECT DRIVE REQUIRED', 'Minimal retraction', 'Test resistance with multimeter'],
    },
    safety: {
      fumes: { level: 'Low' },
      foodSafety: { rating: 'Not Safe' },
      biodegradability: { rating: 'Not Biodegradable' },
    },
  },

  'PPS': {
    name: 'PPS',
    fullName: 'Polyphenylene Sulfide',
    origin: {
      yearInvented: '1973',
      originalCompany: 'Phillips Petroleum (Ryton brand)',
      majorManufacturers: ['Solvay (Ryton)', 'Toray', 'DIC', '3DXTech'],
    },
    composition: {
      basePolymer: 'Polyphenylene Sulfide',
      chemicalFamily: 'Semi-Crystalline Sulfur-Containing Polymer',
      keyAdditives: ['Glass fiber (PPS-GF)', 'Carbon fiber (PPS-CF)', 'Mineral fillers'],
    },
    familyContext: {
      parentPolymer: 'Standalone high-performance engineering polymer',
      variants: ['PPS', 'PPS-GF', 'PPS-CF', 'PPS AM230'],
      chemicalComparison: 'Exceptional chemical resistance (rivals PTFE). High continuous use temp (200°C+). Between PC and PEEK in performance.',
    },
    strengths: {
      uniqueProperties: ['Outstanding chemical resistance', 'Excellent heat resistance (200°C+)', 'Inherently flame retardant (V0)', 'Very low moisture absorption', 'Self-extinguishing'],
      bestUseScenarios: ['Chemical processing equipment', 'Automotive under-hood', 'Electrical components', 'Harsh environment parts'],
      advantagesOverCompetitors: ['Better chemical resistance than PEEK at lower cost', 'Inherently flame retardant without additives', 'Lower moisture uptake than nylon'],
      whyChooseThis: 'When extreme chemical resistance AND heat resistance are both required.',
    },
    weaknesses: {
      limitations: ['Requires 300°C+ hotend', 'Needs heated enclosure', 'Expensive', 'Brittle without reinforcement', 'Very limited filament availability'],
      commonProblems: ['Requires industrial-grade printer', 'Crystallization management critical', 'Few suppliers'],
      whenNotToUse: ['Desktop printers', 'Budget applications', 'When PC or PEEK suffice'],
    },
    practicalContext: {
      industryAdoption: ['Chemical processing', 'Automotive', 'Aerospace', 'Electronics', 'Oil & gas'],
      commonApplications: ['Chemical pump components', 'Under-hood automotive', 'Electrical connectors', 'Filter housings'],
      safetyStandards: ['UL94 V0 inherent', 'Various chemical resistance certifications'],
      costPosition: 'Industrial',
    },
    trivia: {
      funFacts: [
        'PPS resists nearly every chemical except strong oxidizing acids',
        'Inherently flame retardant — no additives needed for V0 rating',
        'Used in automotive fuel systems due to ethanol/gasoline resistance',
      ],
      whyInvented: 'Created for applications requiring simultaneous chemical and heat resistance.',
      marketAdoption: 'Very niche in 3D printing — industrial use only.',
    },
    tdsProfile: {
      properties: [
        { name: 'Tensile Strength', value: '65-85', unit: 'MPa', implications: 'Good. Excellent with glass fiber reinforcement.' },
        { name: 'Heat Deflection (HDT)', value: '135-260', unit: '°C', implications: 'Excellent. GF versions approach 260°C.' },
        { name: 'Chemical Resistance', value: 'Exceptional', unit: '', implications: 'Resists almost all chemicals.' },
        { name: 'UL94 Rating', value: 'V0', unit: '', implications: 'Inherently flame retardant.' },
        { name: 'Moisture Absorption', value: '0.02-0.05', unit: '%', implications: 'Virtually zero — best in class.' },
      ],
    },
    printSettings: {
      nozzleTemp: { min: 300, max: 340, optimal: 320 },
      bedTemp: { min: 120, max: 160, optimal: 140 },
      coolingFan: { min: 0, max: 10, notes: 'Minimal — crystallization critical.' },
      enclosure: { required: true, notes: 'REQUIRED. 90-130°C chamber for crystallization.' },
      drying: { temp: 120, duration: '4-6 hours', notes: 'Despite low absorption, drying still recommended.' },
      printSpeed: { recommended: '20-40 mm/s' },
      additionalNotes: [
        'Requires industrial high-temp printer',
        'Crystallization control is critical for properties',
        'Post-print annealing may be needed',
        'Very few printers can handle PPS',
      ],
    },
    safety: {
      fumes: { level: 'Low', notes: 'Despite high temps, PPS has low emissions.' },
      foodSafety: { rating: 'FDA Grades Exist', notes: 'Used in food processing equipment.' },
      biodegradability: { rating: 'Not Biodegradable', notes: 'Extremely stable polymer.' },
    },
  },

  'PPS-CF': {
    name: 'PPS-CF',
    fullName: 'Carbon Fiber Reinforced Polyphenylene Sulfide',
    origin: {
      yearInvented: '2020+',
      originalCompany: 'Various industrial filament manufacturers',
      majorManufacturers: ['3DXTech', 'Solvay', 'Toray'],
    },
    composition: {
      basePolymer: 'PPS with carbon fiber reinforcement',
      chemicalFamily: 'Semi-Crystalline Sulfur Polymer + CF Composite',
      keyAdditives: ['Chopped carbon fiber (15-30%)', 'Coupling agents'],
    },
    familyContext: {
      parentPolymer: 'PPS reinforced with carbon fiber',
      variants: ['PPS-CF15', 'PPS-CF30'],
      chemicalComparison: 'Adds stiffness to already excellent PPS chemical/thermal resistance. Among the highest-performance 3D printed materials.',
    },
    strengths: {
      uniqueProperties: ['Extreme chemical resistance + high stiffness', 'Inherently flame retardant', '260°C+ HDT with CF', 'Near-zero moisture absorption'],
      bestUseScenarios: ['Aerospace chemical equipment', 'Under-hood automotive structural', 'Semiconductor tooling', 'Chemical processing'],
      whyChooseThis: 'For the most chemically resistant structural parts achievable with 3D printing.',
    },
    weaknesses: {
      limitations: ['Requires top-tier industrial printer', 'Extremely expensive', 'Very abrasive', 'Brittle'],
      commonProblems: ['Equipment requirements eliminate most users', 'Cost prohibitive for most applications'],
      whenNotToUse: ['Any standard printer', 'When PPS or PEEK-CF would suffice'],
    },
    practicalContext: {
      commonApplications: ['Chemical pump impellers', 'Semiconductor fixtures', 'Aerospace ducting', 'Oil & gas tooling'],
      costPosition: 'Industrial',
    },
    trivia: {
      funFacts: ['PPS-CF is one of the most chemically resistant 3D printable materials in existence'],
      whyInvented: 'For applications where nothing else can survive the chemical + thermal environment.',
      marketAdoption: 'Ultra-niche — industrial AM only.',
    },
    printSettings: {
      nozzleTemp: { min: 310, max: 350, optimal: 330 },
      bedTemp: { min: 130, max: 160, optimal: 145 },
      coolingFan: { min: 0, max: 0, notes: 'NO cooling.' },
      enclosure: { required: true, notes: 'MANDATORY. 100-140°C chamber.' },
      drying: { temp: 120, duration: '4-6 hours' },
      printSpeed: { recommended: '15-30 mm/s' },
      additionalNotes: ['Hardened nozzle MANDATORY', 'Industrial printer required', 'Annealing recommended for max properties'],
    },
    safety: {
      fumes: { level: 'Low', notes: 'PPS has low emissions. CF dust hazard when machining.' },
      foodSafety: { rating: 'Not Safe', notes: 'CF precludes food contact.' },
      biodegradability: { rating: 'Not Biodegradable' },
    },
  },

  'Support': {
    name: 'Support',
    fullName: 'Breakaway/Dissolvable Support Material',
    origin: {
      yearInvented: '2010s',
      originalCompany: 'Various 3D printer manufacturers',
      majorManufacturers: ['Ultimaker', 'Stratasys', 'Bambu Lab', 'Polymaker'],
    },
    composition: {
      basePolymer: 'Various — often modified PLA or proprietary blends',
      chemicalFamily: 'Support Material (Various)',
      keyAdditives: ['Break-away agents', 'Adhesion modifiers'],
    },
    familyContext: {
      parentPolymer: 'Category term for support-specific materials',
      variants: ['Breakaway', 'SR-30', 'RapidRinse', 'USM', 'MTS', 'HTS'],
      chemicalComparison: 'Designed to be easily removed mechanically or chemically. Not a structural material.',
    },
    strengths: {
      uniqueProperties: ['Easy removal from model material', 'Purpose-built interface', 'Clean separation', 'Various removal methods'],
      bestUseScenarios: ['Complex overhangs', 'Internal cavities', 'Multi-material printing', 'Professional finish'],
      whyChooseThis: 'When you need supports that separate cleanly from the model with minimal post-processing.',
    },
    weaknesses: {
      limitations: ['Not a structural material', 'Requires dual extrusion', 'Material-specific compatibility', 'Additional cost'],
      commonProblems: ['Must match with compatible model material', 'Wasted material'],
      whenNotToUse: ['Single-material printers', 'When tree/line supports work'],
    },
    practicalContext: {
      commonApplications: ['Complex geometry support', 'Professional prototyping', 'Internal channel support'],
      costPosition: 'Standard',
    },
    trivia: {
      funFacts: ['Support material is one of the least glamorous but most important 3D printing innovations'],
      whyInvented: 'Complex geometries need sacrificial material to print overhangs.',
      marketAdoption: 'Essential for dual-extrusion printers.',
    },
    printSettings: {
      nozzleTemp: { min: 190, max: 240 },
      bedTemp: { min: 45, max: 70 },
      coolingFan: { min: 50, max: 100 },
      enclosure: { required: false },
      printSpeed: { recommended: '30-50 mm/s' },
      additionalNotes: ['Follow manufacturer recommendations for specific support material', 'Ensure compatibility with model material'],
    },
    safety: {
      fumes: { level: 'Low' },
      foodSafety: { rating: 'Not Applicable' },
      biodegradability: { rating: 'Varies' },
    },
  },

  'Breakaway': {
    name: 'Breakaway',
    fullName: 'Breakaway Support Material',
    origin: {
      yearInvented: '2017+',
      originalCompany: 'Ultimaker',
      majorManufacturers: ['Ultimaker', 'Polymaker', 'eSUN', 'Bambu Lab'],
    },
    composition: {
      basePolymer: 'Modified polymer designed for weak interface bonding',
      chemicalFamily: 'Specialty Support Polymer',
      keyAdditives: ['Release agents', 'Interface modifiers'],
    },
    familyContext: {
      parentPolymer: 'Purpose-designed support material',
      variants: ['Breakaway', 'Easy Break'],
      chemicalComparison: 'Unlike PVA (dissolves) or HIPS (dissolves in limonene), Breakaway simply snaps off mechanically.',
    },
    strengths: {
      uniqueProperties: ['Snaps off cleanly by hand', 'No chemicals needed', 'Fast removal', 'Compatible with many materials'],
      bestUseScenarios: ['General support removal', 'Quick prototyping', 'When chemical dissolution is impractical'],
      whyChooseThis: 'For fast, tool-free support removal without chemicals or soaking.',
    },
    weaknesses: {
      limitations: ['Leaves rougher surface than dissolved support', 'Can\'t reach deep internal cavities', 'Interface quality varies'],
      commonProblems: ['May damage model surface during removal', 'Hard to remove from tight spots'],
      whenNotToUse: ['Internal channels (use PVA)', 'When perfect surface finish needed under supports'],
    },
    practicalContext: {
      commonApplications: ['General support structures', 'External overhangs', 'Bridges'],
      costPosition: 'Standard',
    },
    trivia: {
      funFacts: ['Ultimaker popularized the breakaway support concept as an alternative to PVA'],
      whyInvented: 'PVA support is slow (hours to dissolve) — breakaway is instant.',
      marketAdoption: 'Very popular for dual-extrusion users who don\'t want to wait for dissolution.',
    },
    printSettings: {
      nozzleTemp: { min: 195, max: 240, optimal: 220 },
      bedTemp: { min: 50, max: 70, optimal: 60 },
      coolingFan: { min: 50, max: 100 },
      enclosure: { required: false },
      printSpeed: { recommended: '30-50 mm/s' },
    },
    safety: {
      fumes: { level: 'Low' },
      foodSafety: { rating: 'Not Applicable', notes: 'Support material — removed after printing.' },
      biodegradability: { rating: 'Varies by formulation' },
    },
  },

  'PETG-HS': {
    name: 'PETG-HS',
    fullName: 'High-Speed PETG',
    origin: {
      yearInvented: '2023+',
      originalCompany: 'Bambu Lab, Polymaker',
      majorManufacturers: ['Bambu Lab', 'Polymaker', 'eSUN'],
    },
    composition: {
      basePolymer: 'PETG with high melt-flow index',
      chemicalFamily: 'Polyethylene Terephthalate Glycol (High-Flow)',
      keyAdditives: ['Flow rate enhancers', 'Rapid solidification agents'],
    },
    familyContext: {
      parentPolymer: 'PETG optimized for high-speed printing',
      variants: ['PETG-HS', 'PET-G Premium High Speed'],
      chemicalComparison: 'Same PETG chemistry but with rheology optimized for 150-300 mm/s printing.',
    },
    strengths: {
      uniqueProperties: ['High-speed PETG printing', 'Maintains PETG toughness', 'Reduced stringing vs standard PETG at speed'],
      bestUseScenarios: ['Rapid prototyping with PETG properties', 'Production PETG parts', 'Speed-critical functional parts'],
      whyChooseThis: 'When you need PETG properties but standard PETG can\'t keep up with your high-speed printer.',
    },
    weaknesses: {
      limitations: ['May not print well on slow printers', 'Premium pricing', 'Newer — less community knowledge'],
      commonProblems: ['Needs high-flow hotend', 'Temperature calibration important'],
      whenNotToUse: ['Slow printers', 'When standard PETG speed is acceptable'],
    },
    practicalContext: {
      commonApplications: ['Fast functional prototypes', 'Production PETG parts', 'Speed-critical projects'],
      costPosition: 'Premium',
    },
    trivia: {
      funFacts: ['High-speed PETG can match PLA print times while offering PETG durability'],
      whyInvented: 'High-speed printers exposed PETG flow limitations.',
      marketAdoption: 'Growing with high-speed printer adoption.',
    },
    printSettings: {
      nozzleTemp: { min: 240, max: 270, optimal: 255 },
      bedTemp: { min: 70, max: 90, optimal: 80 },
      coolingFan: { min: 30, max: 70 },
      enclosure: { required: false },
      drying: { temp: 65, duration: '4-6 hours' },
      printSpeed: { recommended: '150-300 mm/s', notes: 'Designed for high-speed printers.' },
    },
    safety: {
      fumes: { level: 'Low', notes: 'Standard PETG emissions.' },
      foodSafety: { rating: 'Check Brand', notes: 'Same as base PETG.' },
      biodegradability: { rating: 'Not Biodegradable' },
    },
  },

  'ESD-PA12': {
    name: 'ESD-PA12',
    fullName: 'Electrostatic Dissipative Polyamide 12',
    origin: {
      yearInvented: '2020+',
      originalCompany: 'Various industrial filament manufacturers',
      majorManufacturers: ['3DXTech', 'BASF Forward AM', 'Polymaker'],
    },
    composition: {
      basePolymer: 'PA12 with conductive carbon additives',
      chemicalFamily: 'Polyamide 12 (ESD Modified)',
      keyAdditives: ['Carbon nanotubes', 'Carbon black', 'Conductive fillers'],
    },
    familyContext: {
      parentPolymer: 'PA12 base with ESD-safe additives',
      variants: ['ESD-PA12'],
      chemicalComparison: 'Combines PA12\'s low moisture absorption and toughness with static dissipative properties.',
    },
    strengths: {
      uniqueProperties: ['ESD-safe', 'Low moisture absorption for nylon', 'Good toughness', 'Chemical resistant'],
      bestUseScenarios: ['Electronics manufacturing fixtures', 'ESD-safe containers', 'Semiconductor tooling'],
      whyChooseThis: 'When you need ESD protection with nylon toughness and low moisture sensitivity.',
    },
    weaknesses: {
      limitations: ['Black only', 'Requires enclosure', 'Expensive', 'Moisture sensitive (less than PA6)'],
      commonProblems: ['Still needs drying', 'ESD verification needed after printing'],
      whenNotToUse: ['When ESD-PLA or ESD-PETG suffice', 'Without enclosed printer'],
    },
    practicalContext: {
      commonApplications: ['Chip trays', 'PCB fixtures', 'ESD-safe jigs', 'Electronics assembly tools'],
      costPosition: 'Industrial',
    },
    trivia: {
      funFacts: ['PA12 base absorbs less moisture than PA6, making ESD properties more stable'],
      whyInvented: 'For ESD applications needing nylon toughness with better humidity stability.',
      marketAdoption: 'Industrial use — electronics manufacturing.',
    },
    printSettings: {
      nozzleTemp: { min: 250, max: 280, optimal: 265 },
      bedTemp: { min: 80, max: 100, optimal: 90 },
      coolingFan: { min: 0, max: 30 },
      enclosure: { required: true },
      drying: { temp: 80, duration: '8-12 hours', notes: 'Critical for ESD consistency.' },
      printSpeed: { recommended: '30-50 mm/s' },
      additionalNotes: ['Hardened nozzle recommended', 'Verify ESD after printing'],
    },
    safety: {
      fumes: { level: 'Moderate', notes: 'Nylon-level emissions. Ventilate.' },
      foodSafety: { rating: 'Not Safe' },
      biodegradability: { rating: 'Not Biodegradable' },
    },
  },

  'ASA Kevlar': {
    name: 'ASA Kevlar',
    fullName: 'Kevlar (Aramid) Fiber Reinforced ASA',
    origin: {
      yearInvented: '2022+',
      originalCompany: 'Various composite manufacturers',
      majorManufacturers: ['3DXTech', 'Polymaker'],
    },
    composition: {
      basePolymer: 'ASA with aramid (Kevlar) fiber reinforcement',
      chemicalFamily: 'Styrenic + Aramid Fiber Composite',
      keyAdditives: ['Chopped aramid fibers', 'Coupling agents', 'UV stabilizers'],
    },
    familyContext: {
      parentPolymer: 'ASA reinforced with aramid fiber',
      variants: ['ASA Kevlar', 'ASA-AF'],
      chemicalComparison: 'Aramid fiber adds toughness (unlike CF which adds stiffness). UV-resistant base + impact-resistant fiber.',
    },
    strengths: {
      uniqueProperties: ['Impact resistant', 'UV resistant', 'Lightweight', 'Vibration damping', 'Less abrasive than CF'],
      bestUseScenarios: ['Outdoor structural parts', 'Vibration-prone equipment', 'Impact-resistant outdoor enclosures'],
      whyChooseThis: 'When you need outdoor UV resistance plus impact toughness that carbon fiber can\'t provide.',
    },
    weaknesses: {
      limitations: ['Requires enclosure', 'Fuzzy surface finish', 'Slightly abrasive', 'Limited availability'],
      commonProblems: ['Aramid fibers can create fuzzy surface', 'Warping like standard ASA'],
      whenNotToUse: ['Maximum stiffness needed (use CF)', 'Budget projects', 'Without enclosure'],
    },
    practicalContext: {
      commonApplications: ['Outdoor enclosures', 'Drone landing gear', 'Protective housings', 'Vibration mounts'],
      costPosition: 'Premium',
    },
    trivia: {
      funFacts: ['Kevlar is the same fiber used in bulletproof vests — adds impact resistance, not stiffness'],
      whyInvented: 'To combine ASA outdoor durability with aramid impact resistance.',
      marketAdoption: 'Niche — for specific outdoor impact-resistant applications.',
    },
    printSettings: {
      nozzleTemp: { min: 240, max: 270, optimal: 255 },
      bedTemp: { min: 90, max: 110, optimal: 100 },
      coolingFan: { min: 0, max: 30 },
      enclosure: { required: true },
      drying: { temp: 70, duration: '4-6 hours' },
      printSpeed: { recommended: '30-50 mm/s' },
      additionalNotes: ['Hardened nozzle recommended (less abrasive than CF but still wears brass)', 'Use 0.5mm+ nozzle'],
    },
    safety: {
      fumes: { level: 'Moderate', notes: 'ASA styrene emissions. Ventilate.' },
      foodSafety: { rating: 'Not Safe' },
      biodegradability: { rating: 'Not Biodegradable' },
    },
  },

  'PLA+': {
    name: 'PLA+',
    fullName: 'Enhanced/Professional Polylactic Acid',
    origin: {
      yearInvented: '2016+',
      originalCompany: 'eSUN (early popularizer)',
      majorManufacturers: ['eSUN', 'Sunlu', 'Overture', 'Polymaker', 'Bambu Lab'],
    },
    composition: {
      basePolymer: 'PLA with impact modifiers and stabilizers',
      chemicalFamily: 'Aliphatic Polyester (Enhanced)',
      keyAdditives: ['Impact modifiers', 'Toughening agents', 'Flow enhancers', 'Crystallization modifiers'],
    },
    familyContext: {
      parentPolymer: 'PLA improved with additives for better all-round performance',
      variants: ['PLA+', 'PLA Pro', 'PLA Premium', 'PolyMax PLA'],
      chemicalComparison: 'Standard PLA with additives that improve toughness and reduce brittleness without changing print behavior.',
    },
    strengths: {
      uniqueProperties: ['Tougher than standard PLA', 'Better layer adhesion', 'Wider temperature tolerance', 'Less brittle'],
      bestUseScenarios: ['Functional prototypes', 'General-purpose printing', 'Parts that may be stressed', 'Improved quality over basic PLA'],
      advantagesOverCompetitors: ['Tougher than PLA at minimal extra cost', 'Same ease of printing', 'Better reliability'],
      whyChooseThis: 'The default upgrade from standard PLA — better in every way for a small price increase.',
    },
    weaknesses: {
      limitations: ['Still has PLA heat limits (~55°C)', '"Plus" label is not standardized — varies by brand', 'Slightly more expensive'],
      commonProblems: ['Quality varies — some PLA+ is barely different from PLA', 'Marketing term without standards'],
      whenNotToUse: ['High-temp applications', 'When basic PLA is sufficient'],
    },
    practicalContext: {
      commonApplications: ['Upgraded general printing', 'Functional parts', 'Better-quality prototypes', 'Everyday printing'],
      costPosition: 'Standard',
    },
    trivia: {
      funFacts: [
        'eSUN PLA+ was one of the first widely available enhanced PLAs',
        'The "+" designation has no industry standard — quality varies dramatically',
        'Good PLA+ is genuinely tougher; bad PLA+ is just rebranded PLA',
      ],
      whyInvented: 'To address PLA\'s main weakness (brittleness) while keeping its printing ease.',
      marketAdoption: 'One of the most popular filament categories — often outsells standard PLA.',
    },
    tdsProfile: {
      properties: [
        { name: 'Tensile Strength', value: '50-60', unit: 'MPa', implications: 'Similar to or slightly better than standard PLA.' },
        { name: 'Impact Strength', value: '8-20', unit: 'kJ/m²', implications: '2-4x better than standard PLA.' },
        { name: 'Elongation at Break', value: '8-15', unit: '%', implications: 'More flexible than standard PLA (3-5%).' },
        { name: 'Glass Transition', value: '55-60', unit: '°C', implications: 'Same as standard PLA.' },
      ],
    },
    printSettings: {
      nozzleTemp: { min: 200, max: 230, optimal: 215 },
      bedTemp: { min: 50, max: 65, optimal: 60 },
      coolingFan: { min: 60, max: 100 },
      enclosure: { required: false },
      printSpeed: { recommended: '40-70 mm/s' },
      additionalNotes: ['Print 5-10°C hotter than equivalent PLA', 'Better layer adhesion at slightly higher temps'],
    },
    safety: {
      fumes: { level: 'Very Low', notes: 'Standard PLA emissions.' },
      foodSafety: { rating: 'Check Brand', notes: 'Some brands maintain food-safe certification.' },
      biodegradability: { rating: 'Partially Compostable', notes: 'Additives may reduce compostability vs pure PLA.' },
    },
  },
};
