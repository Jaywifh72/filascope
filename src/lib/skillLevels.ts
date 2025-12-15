export type SkillLevel = 'beginner' | 'intermediate' | 'advanced';

export interface SkillLevelConfig {
  level: SkillLevel;
  label: string;
  icon: string;
  color: string;
  description: string;
  requiredPoints: number;
}

export const SKILL_LEVELS: Record<SkillLevel, SkillLevelConfig> = {
  beginner: {
    level: 'beginner',
    label: 'Beginner',
    icon: '🎓',
    color: 'text-green-400',
    description: 'Learning the basics of 3D printing',
    requiredPoints: 0,
  },
  intermediate: {
    level: 'intermediate',
    label: 'Intermediate',
    icon: '⚙️',
    color: 'text-blue-400',
    description: 'Comfortable with common materials and troubleshooting',
    requiredPoints: 200,
  },
  advanced: {
    level: 'advanced',
    label: 'Advanced',
    icon: '🔬',
    color: 'text-purple-400',
    description: 'Expert-level tuning and exotic materials',
    requiredPoints: 500,
  },
};

export const SETTING_SKILL_LEVELS: Record<string, SkillLevel> = {
  // Beginner settings
  nozzle_temp: 'beginner',
  bed_temp: 'beginner',
  print_speed: 'beginner',
  layer_height: 'beginner',
  infill: 'beginner',
  supports: 'beginner',
  cooling: 'beginner',
  
  // Intermediate settings
  retraction_distance: 'intermediate',
  retraction_speed: 'intermediate',
  z_hop: 'intermediate',
  flow_rate: 'intermediate',
  first_layer_settings: 'intermediate',
  cooling_curve: 'intermediate',
  travel_speed: 'intermediate',
  perimeters: 'intermediate',
  seam_position: 'intermediate',
  
  // Advanced settings
  pressure_advance: 'advanced',
  linear_advance: 'advanced',
  input_shaping: 'advanced',
  jerk: 'advanced',
  acceleration: 'advanced',
  volumetric_flow: 'advanced',
  e_steps: 'advanced',
  pid_tuning: 'advanced',
  resonance_compensation: 'advanced',
  extrusion_multiplier_per_layer: 'advanced',
};

export function getSkillLevelFromPoints(points: number): SkillLevel {
  if (points >= SKILL_LEVELS.advanced.requiredPoints) {
    return 'advanced';
  }
  if (points >= SKILL_LEVELS.intermediate.requiredPoints) {
    return 'intermediate';
  }
  return 'beginner';
}

export function canAccessSetting(settingKey: string, userLevel: SkillLevel): boolean {
  const settingLevel = SETTING_SKILL_LEVELS[settingKey] || 'beginner';
  const levels: SkillLevel[] = ['beginner', 'intermediate', 'advanced'];
  return levels.indexOf(userLevel) >= levels.indexOf(settingLevel);
}

export function getSettingsForLevel(userLevel: SkillLevel): string[] {
  const levels: SkillLevel[] = ['beginner', 'intermediate', 'advanced'];
  const userLevelIndex = levels.indexOf(userLevel);
  
  return Object.entries(SETTING_SKILL_LEVELS)
    .filter(([_, level]) => levels.indexOf(level) <= userLevelIndex)
    .map(([key]) => key);
}

export function getNextSkillLevel(currentLevel: SkillLevel): SkillLevelConfig | null {
  const levels: SkillLevel[] = ['beginner', 'intermediate', 'advanced'];
  const currentIndex = levels.indexOf(currentLevel);
  
  if (currentIndex < levels.length - 1) {
    return SKILL_LEVELS[levels[currentIndex + 1]];
  }
  
  return null;
}

export function getProgressToNextLevel(points: number, currentLevel: SkillLevel): number {
  const nextLevel = getNextSkillLevel(currentLevel);
  if (!nextLevel) return 100;
  
  const currentLevelConfig = SKILL_LEVELS[currentLevel];
  const pointsInLevel = points - currentLevelConfig.requiredPoints;
  const pointsNeeded = nextLevel.requiredPoints - currentLevelConfig.requiredPoints;
  
  return Math.min(100, (pointsInLevel / pointsNeeded) * 100);
}
