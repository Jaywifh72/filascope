export interface VideoTutorial {
  id: string;
  title: string;
  description: string;
  duration: string;
  thumbnail?: string;
  youtubeId?: string;
  externalUrl?: string;
  category: 'beginner' | 'troubleshooting' | 'advanced' | 'materials';
  tags: string[];
  skillLevel: 'beginner' | 'intermediate' | 'advanced';
}

export const VIDEO_CATEGORIES = {
  beginner: { label: 'Getting Started', icon: '🎓', color: 'text-green-500' },
  troubleshooting: { label: 'Troubleshooting', icon: '🔧', color: 'text-amber-500' },
  advanced: { label: 'Advanced Tuning', icon: '⚙️', color: 'text-purple-500' },
  materials: { label: 'Material Guides', icon: '🧵', color: 'text-cyan-500' },
};

export const VIDEO_TUTORIALS: Record<string, VideoTutorial> = {
  first_print_setup: {
    id: 'first_print_setup',
    title: 'Setting Up Your First Print',
    description: 'Learn the essential steps for preparing and starting your first 3D print successfully.',
    duration: '3:24',
    youtubeId: 'T-Z3GmM20JM',
    category: 'beginner',
    tags: ['setup', 'first print', 'beginner', 'basics'],
    skillLevel: 'beginner',
  },
  bed_leveling_basics: {
    id: 'bed_leveling_basics',
    title: 'Bed Leveling Made Simple',
    description: 'Master the fundamentals of bed leveling for perfect first layers every time.',
    duration: '4:15',
    youtubeId: '_EfWVUJjBdA',
    category: 'beginner',
    tags: ['bed leveling', 'first layer', 'calibration'],
    skillLevel: 'beginner',
  },
  temperature_troubleshooting: {
    id: 'temperature_troubleshooting',
    title: 'Troubleshooting Temperature Issues',
    description: 'Diagnose and fix common temperature-related problems like stringing, poor adhesion, and clogs.',
    duration: '5:42',
    youtubeId: 'GXSqZ68UdsE',
    category: 'troubleshooting',
    tags: ['temperature', 'stringing', 'adhesion', 'troubleshooting'],
    skillLevel: 'beginner',
  },
  retraction_tuning: {
    id: 'retraction_tuning',
    title: 'Retraction Tuning Guide',
    description: 'Eliminate stringing and oozing by dialing in perfect retraction settings for your printer.',
    duration: '6:18',
    youtubeId: '6LjbCIGCmd0',
    category: 'troubleshooting',
    tags: ['retraction', 'stringing', 'tuning'],
    skillLevel: 'intermediate',
  },
  pla_printing_guide: {
    id: 'pla_printing_guide',
    title: 'Complete PLA Printing Guide',
    description: 'Everything you need to know about printing with PLA - the most popular 3D printing material.',
    duration: '8:30',
    youtubeId: 'AqEWl51s9Rw',
    category: 'materials',
    tags: ['PLA', 'materials', 'settings', 'guide'],
    skillLevel: 'beginner',
  },
  petg_tips: {
    id: 'petg_tips',
    title: 'PETG Printing Tips & Tricks',
    description: 'Master PETG printing with these essential tips for temperature, speed, and bed adhesion.',
    duration: '7:15',
    youtubeId: '8_adY2K-YIc',
    category: 'materials',
    tags: ['PETG', 'materials', 'tips'],
    skillLevel: 'intermediate',
  },
  abs_enclosure: {
    id: 'abs_enclosure',
    title: 'Printing ABS Successfully',
    description: 'Learn why ABS needs an enclosure and how to set up your printer for warp-free ABS prints.',
    duration: '9:45',
    youtubeId: 'fKHyw-OlSqM',
    category: 'materials',
    tags: ['ABS', 'enclosure', 'warping', 'advanced'],
    skillLevel: 'intermediate',
  },
  tpu_flexible: {
    id: 'tpu_flexible',
    title: 'Printing Flexible TPU',
    description: 'Tips for successfully printing flexible materials - from extruder setup to speed settings.',
    duration: '6:55',
    youtubeId: '3fUe4hbSLNw',
    category: 'materials',
    tags: ['TPU', 'flexible', 'materials'],
    skillLevel: 'intermediate',
  },
  pressure_advance: {
    id: 'pressure_advance',
    title: 'Pressure Advance Calibration',
    description: 'Improve corner quality and eliminate bulging with proper pressure/linear advance tuning.',
    duration: '10:20',
    youtubeId: 'n3yK0lJ8TWM',
    category: 'advanced',
    tags: ['pressure advance', 'linear advance', 'calibration', 'advanced'],
    skillLevel: 'advanced',
  },
  input_shaping: {
    id: 'input_shaping',
    title: 'Input Shaping Explained',
    description: 'Eliminate ringing and ghosting while printing faster with input shaping calibration.',
    duration: '12:30',
    youtubeId: 'er7q-CJL1lc',
    category: 'advanced',
    tags: ['input shaping', 'ringing', 'speed', 'advanced'],
    skillLevel: 'advanced',
  },
  flow_calibration: {
    id: 'flow_calibration',
    title: 'Flow Rate Calibration',
    description: 'Calibrate your extrusion flow for perfect dimensional accuracy and layer adhesion.',
    duration: '5:30',
    youtubeId: 'lH-RrjtiC8M',
    category: 'advanced',
    tags: ['flow', 'calibration', 'extrusion'],
    skillLevel: 'intermediate',
  },
  layer_adhesion_fix: {
    id: 'layer_adhesion_fix',
    title: 'Fixing Layer Adhesion Problems',
    description: 'Diagnose and fix weak layer bonding that causes parts to split or break easily.',
    duration: '4:45',
    youtubeId: 'Hvw3DrVAeTA',
    category: 'troubleshooting',
    tags: ['layer adhesion', 'weak prints', 'troubleshooting'],
    skillLevel: 'beginner',
  },
  clog_prevention: {
    id: 'clog_prevention',
    title: 'Preventing & Fixing Clogs',
    description: 'Learn what causes nozzle clogs and how to prevent them - plus quick fixes when they happen.',
    duration: '7:20',
    youtubeId: 'hS1mwO5YCMA',
    category: 'troubleshooting',
    tags: ['clogs', 'maintenance', 'hotend'],
    skillLevel: 'beginner',
  },
};

export function getVideosByCategory(category: VideoTutorial['category']): VideoTutorial[] {
  return Object.values(VIDEO_TUTORIALS).filter(video => video.category === category);
}

export function getVideosByTag(tag: string): VideoTutorial[] {
  return Object.values(VIDEO_TUTORIALS).filter(video => 
    video.tags.some(t => t.toLowerCase().includes(tag.toLowerCase()))
  );
}

export function getVideosByMaterial(material: string): VideoTutorial[] {
  const materialLower = material.toLowerCase();
  return Object.values(VIDEO_TUTORIALS).filter(video =>
    video.tags.some(t => t.toLowerCase() === materialLower) ||
    video.title.toLowerCase().includes(materialLower)
  );
}

export function getVideosBySkillLevel(level: VideoTutorial['skillLevel']): VideoTutorial[] {
  const levels = ['beginner', 'intermediate', 'advanced'];
  const levelIndex = levels.indexOf(level);
  return Object.values(VIDEO_TUTORIALS).filter(
    video => levels.indexOf(video.skillLevel) <= levelIndex
  );
}
