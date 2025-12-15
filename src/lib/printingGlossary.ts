export interface GlossaryTerm {
  id: string;
  title: string;
  description: string;
  category: 'temperature' | 'movement' | 'quality' | 'hardware' | 'materials' | 'calibration';
  learnMoreUrl?: string;
  relatedTerms?: string[];
  skillLevel: 'beginner' | 'intermediate' | 'advanced';
}

export const GLOSSARY_CATEGORIES = {
  temperature: { label: 'Temperature', icon: '🌡️' },
  movement: { label: 'Movement & Speed', icon: '🏃' },
  quality: { label: 'Print Quality', icon: '✨' },
  hardware: { label: 'Hardware', icon: '🔧' },
  materials: { label: 'Materials', icon: '🧵' },
  calibration: { label: 'Calibration', icon: '📐' },
};

export const PRINTING_GLOSSARY: Record<string, GlossaryTerm> = {
  // Temperature Terms
  nozzle_temperature: {
    id: 'nozzle_temperature',
    title: 'Nozzle Temperature',
    description: 'The temperature of the heated nozzle that melts the filament. Each material has an optimal range - too low causes under-extrusion, too high causes stringing and degradation.',
    category: 'temperature',
    skillLevel: 'beginner',
    relatedTerms: ['heat_creep', 'thermal_runaway'],
  },
  bed_temperature: {
    id: 'bed_temperature',
    title: 'Bed Temperature',
    description: 'The temperature of the heated print bed. Helps with first layer adhesion and prevents warping. Different materials require different bed temperatures.',
    category: 'temperature',
    skillLevel: 'beginner',
    relatedTerms: ['warping', 'adhesion'],
  },
  glass_transition: {
    id: 'glass_transition',
    title: 'Glass Transition (Tg)',
    description: 'The temperature at which a material transitions from rigid to soft/rubbery. Important for understanding heat resistance of printed parts.',
    category: 'temperature',
    skillLevel: 'intermediate',
    relatedTerms: ['heat_deflection'],
  },
  heat_creep: {
    id: 'heat_creep',
    title: 'Heat Creep',
    description: 'When heat travels up the hotend into the cold zone, causing filament to soften prematurely and jam. Common with PLA at high temperatures or slow prints.',
    category: 'temperature',
    skillLevel: 'intermediate',
    relatedTerms: ['all_metal_hotend', 'thermal_break'],
  },
  thermal_runaway: {
    id: 'thermal_runaway',
    title: 'Thermal Runaway',
    description: 'A dangerous condition where the heater loses temperature control and overheats uncontrollably. Modern printers have safety shutoffs to prevent fires.',
    category: 'temperature',
    skillLevel: 'intermediate',
  },

  // Movement Terms
  retraction: {
    id: 'retraction',
    title: 'Retraction',
    description: 'Pulling filament backward to prevent oozing during travel moves. Typical values: 0.5-1mm for direct drive, 4-6mm for Bowden setups.',
    category: 'movement',
    skillLevel: 'beginner',
    relatedTerms: ['stringing', 'z_hop'],
  },
  retraction_speed: {
    id: 'retraction_speed',
    title: 'Retraction Speed',
    description: 'How fast the filament is pulled back during retraction. Too fast can grind filament, too slow may not prevent stringing effectively.',
    category: 'movement',
    skillLevel: 'intermediate',
  },
  z_hop: {
    id: 'z_hop',
    title: 'Z-Hop',
    description: 'Lifting the nozzle slightly during travel moves to avoid hitting printed parts. Helps prevent knocked-over parts but can increase stringing.',
    category: 'movement',
    skillLevel: 'intermediate',
    relatedTerms: ['retraction'],
  },
  travel_speed: {
    id: 'travel_speed',
    title: 'Travel Speed',
    description: 'Speed of non-printing moves between print locations. Higher speeds reduce print time but can cause ringing or vibration artifacts.',
    category: 'movement',
    skillLevel: 'beginner',
  },
  jerk: {
    id: 'jerk',
    title: 'Jerk',
    description: 'The instantaneous speed change allowed before acceleration kicks in. Lower values = smoother motion but slower prints. High jerk can cause ringing.',
    category: 'movement',
    skillLevel: 'advanced',
    relatedTerms: ['acceleration', 'input_shaping'],
  },
  acceleration: {
    id: 'acceleration',
    title: 'Acceleration',
    description: 'How quickly the print head changes speed. Higher acceleration = faster prints but can cause ringing and reduce quality on corners.',
    category: 'movement',
    skillLevel: 'advanced',
    relatedTerms: ['jerk', 'input_shaping'],
  },
  linear_advance: {
    id: 'linear_advance',
    title: 'Linear/Pressure Advance',
    description: 'Firmware feature that compensates for pressure buildup in the nozzle. Improves corner quality and reduces bulging at direction changes.',
    category: 'movement',
    skillLevel: 'advanced',
    relatedTerms: ['acceleration', 'flow_rate'],
  },
  input_shaping: {
    id: 'input_shaping',
    title: 'Input Shaping',
    description: 'Advanced firmware feature that reduces ringing/ghosting by anticipating and canceling vibrations. Allows higher speeds without quality loss.',
    category: 'movement',
    skillLevel: 'advanced',
    relatedTerms: ['acceleration', 'jerk'],
  },

  // Quality Terms
  layer_height: {
    id: 'layer_height',
    title: 'Layer Height',
    description: 'The thickness of each printed layer. Thinner layers = smoother surface but longer print time. Typical range: 0.08-0.32mm.',
    category: 'quality',
    skillLevel: 'beginner',
  },
  infill: {
    id: 'infill',
    title: 'Infill',
    description: 'The internal structure pattern and density inside a print. Higher infill = stronger but uses more material and time. Common values: 10-20% for decorative, 40-60% for functional.',
    category: 'quality',
    skillLevel: 'beginner',
  },
  perimeters: {
    id: 'perimeters',
    title: 'Perimeters/Walls',
    description: 'The number of outline loops printed for each layer. More perimeters = stronger walls. Typically 2-4 for most prints.',
    category: 'quality',
    skillLevel: 'beginner',
  },
  bridging: {
    id: 'bridging',
    title: 'Bridging',
    description: 'Printing horizontally across a gap without support. Requires proper cooling and reduced speed. Most materials can bridge 20-50mm.',
    category: 'quality',
    skillLevel: 'intermediate',
    relatedTerms: ['overhang', 'cooling'],
  },
  overhang: {
    id: 'overhang',
    title: 'Overhang',
    description: 'Angled surfaces that extend beyond the layer below. Most printers handle up to 45° without support. Steeper angles need cooling or support.',
    category: 'quality',
    skillLevel: 'intermediate',
    relatedTerms: ['bridging', 'supports'],
  },
  stringing: {
    id: 'stringing',
    title: 'Stringing/Oozing',
    description: 'Thin threads of plastic between printed parts caused by oozing during travel moves. Fixed with proper retraction settings and temperature.',
    category: 'quality',
    skillLevel: 'beginner',
    relatedTerms: ['retraction', 'nozzle_temperature'],
  },
  warping: {
    id: 'warping',
    title: 'Warping',
    description: 'When corners lift off the bed due to uneven cooling and material shrinkage. Common with ABS. Prevented with enclosure, heated bed, and proper adhesion.',
    category: 'quality',
    skillLevel: 'beginner',
    relatedTerms: ['bed_temperature', 'enclosure'],
  },
  elephants_foot: {
    id: 'elephants_foot',
    title: "Elephant's Foot",
    description: 'When the first layer squishes out wider than intended, creating a flared base. Caused by nozzle too close to bed or bed temp too high.',
    category: 'quality',
    skillLevel: 'intermediate',
  },
  flow_rate: {
    id: 'flow_rate',
    title: 'Flow Rate/Multiplier',
    description: 'Adjusts how much plastic is extruded. 100% is default. Increase for under-extrusion, decrease for over-extrusion. Calibrate per filament.',
    category: 'quality',
    skillLevel: 'intermediate',
  },

  // Hardware Terms
  hotend: {
    id: 'hotend',
    title: 'Hotend',
    description: 'The heated assembly that melts and extrudes filament. Includes heater block, heat break, nozzle, and heatsink.',
    category: 'hardware',
    skillLevel: 'beginner',
    relatedTerms: ['all_metal_hotend', 'nozzle'],
  },
  all_metal_hotend: {
    id: 'all_metal_hotend',
    title: 'All-Metal Hotend',
    description: 'A hotend without PTFE lining in the heat zone. Required for printing above 250°C (ABS, Nylon, PC). More prone to heat creep with PLA.',
    category: 'hardware',
    skillLevel: 'intermediate',
    relatedTerms: ['hotend', 'heat_creep'],
  },
  bowden_vs_direct: {
    id: 'bowden_vs_direct',
    title: 'Bowden vs Direct Drive',
    description: 'Bowden: extruder motor is separate, connected by tube. Lighter head but more retraction needed. Direct: motor on printhead. Better for flexible filaments.',
    category: 'hardware',
    skillLevel: 'intermediate',
  },
  nozzle: {
    id: 'nozzle',
    title: 'Nozzle',
    description: 'The tip where molten plastic exits. Standard is 0.4mm brass. Larger = faster but less detail. Hardened steel/ruby for abrasive materials.',
    category: 'hardware',
    skillLevel: 'beginner',
    relatedTerms: ['hotend'],
  },
  enclosure: {
    id: 'enclosure',
    title: 'Enclosure',
    description: 'A chamber surrounding the printer that maintains stable temperature. Essential for ABS, PC, and other warp-prone materials.',
    category: 'hardware',
    skillLevel: 'intermediate',
    relatedTerms: ['warping'],
  },
  thermal_break: {
    id: 'thermal_break',
    title: 'Heat Break/Thermal Break',
    description: 'The component between hot and cold zones of the hotend that prevents heat from traveling up. Critical for reliable printing.',
    category: 'hardware',
    skillLevel: 'advanced',
  },

  // Materials Terms
  hygroscopic: {
    id: 'hygroscopic',
    title: 'Hygroscopic',
    description: 'Materials that absorb moisture from air (Nylon, PETG, PVA). Wet filament causes popping, stringing, and weak prints. Must be dried before use.',
    category: 'materials',
    skillLevel: 'intermediate',
    relatedTerms: ['drying'],
  },
  drying: {
    id: 'drying',
    title: 'Filament Drying',
    description: 'Removing absorbed moisture from filament using heat. Essential for Nylon (6-8h at 70°C), helpful for PETG, PLA. Use filament dryer or oven.',
    category: 'materials',
    skillLevel: 'intermediate',
    relatedTerms: ['hygroscopic'],
  },
  annealing: {
    id: 'annealing',
    title: 'Annealing',
    description: 'Heat-treating printed parts to increase strength and heat resistance. Heats part above Tg then slowly cools. Causes some shrinkage.',
    category: 'materials',
    skillLevel: 'advanced',
    relatedTerms: ['glass_transition'],
  },
  abrasive_filament: {
    id: 'abrasive_filament',
    title: 'Abrasive Filament',
    description: 'Filaments containing hard particles (carbon fiber, glass fiber, glow-in-dark) that wear out brass nozzles quickly. Require hardened steel nozzle.',
    category: 'materials',
    skillLevel: 'intermediate',
  },

  // Calibration Terms
  bed_leveling: {
    id: 'bed_leveling',
    title: 'Bed Leveling',
    description: 'Adjusting the print bed to be perfectly parallel to the nozzle movement. Critical for good first layer adhesion. Can be manual or automatic (ABL).',
    category: 'calibration',
    skillLevel: 'beginner',
  },
  z_offset: {
    id: 'z_offset',
    title: 'Z-Offset',
    description: 'Fine adjustment of nozzle height above bed. Negative = closer to bed. Critical for perfect first layer squish without being too close.',
    category: 'calibration',
    skillLevel: 'beginner',
  },
  e_steps: {
    id: 'e_steps',
    title: 'E-Steps Calibration',
    description: 'Calibrating how many motor steps = 1mm of filament extruded. Ensures accurate extrusion. Measure 100mm, adjust steps/mm accordingly.',
    category: 'calibration',
    skillLevel: 'advanced',
  },
  pid_tuning: {
    id: 'pid_tuning',
    title: 'PID Tuning',
    description: 'Calibrating the temperature control loop for stable heating. Prevents temperature oscillation. Usually done via firmware command.',
    category: 'calibration',
    skillLevel: 'advanced',
  },
  first_layer: {
    id: 'first_layer',
    title: 'First Layer',
    description: 'The foundation of any print. Should be slightly squished for adhesion but not too flat. Usually printed slower and hotter than other layers.',
    category: 'calibration',
    skillLevel: 'beginner',
    relatedTerms: ['z_offset', 'bed_leveling'],
  },
  cooling: {
    id: 'cooling',
    title: 'Part Cooling',
    description: 'Using fans to cool freshly extruded plastic. Essential for overhangs and small features. PLA needs 100%, ABS usually 0%, PETG 30-50%.',
    category: 'quality',
    skillLevel: 'beginner',
    relatedTerms: ['bridging', 'overhang'],
  },
};

export function getTermsByCategory(category: GlossaryTerm['category']): GlossaryTerm[] {
  return Object.values(PRINTING_GLOSSARY).filter(term => term.category === category);
}

export function getTermsBySkillLevel(level: GlossaryTerm['skillLevel']): GlossaryTerm[] {
  const levels = ['beginner', 'intermediate', 'advanced'];
  const levelIndex = levels.indexOf(level);
  return Object.values(PRINTING_GLOSSARY).filter(
    term => levels.indexOf(term.skillLevel) <= levelIndex
  );
}

export function searchGlossary(query: string): GlossaryTerm[] {
  const lowerQuery = query.toLowerCase();
  return Object.values(PRINTING_GLOSSARY).filter(
    term =>
      term.title.toLowerCase().includes(lowerQuery) ||
      term.description.toLowerCase().includes(lowerQuery)
  );
}
