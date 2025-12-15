export interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  points: number;
  category: 'exploration' | 'learning' | 'progression' | 'actions' | 'mastery';
  threshold?: number;
  secret?: boolean;
}

export const ACHIEVEMENT_CATEGORIES = {
  exploration: { label: 'Exploration', icon: '🔍', color: 'text-cyan-400' },
  learning: { label: 'Learning', icon: '📚', color: 'text-green-400' },
  progression: { label: 'Progression', icon: '📈', color: 'text-purple-400' },
  actions: { label: 'Actions', icon: '⚡', color: 'text-amber-400' },
  mastery: { label: 'Mastery', icon: '👑', color: 'text-yellow-400' },
};

export const ACHIEVEMENTS: Record<string, Achievement> = {
  // Exploration achievements
  first_material: {
    id: 'first_material',
    title: 'First Steps',
    description: 'View your first filament detail page',
    icon: '🌱',
    points: 10,
    category: 'exploration',
  },
  five_materials: {
    id: 'five_materials',
    title: 'Material Explorer',
    description: 'Explore 5 different filament materials',
    icon: '🔍',
    points: 25,
    category: 'exploration',
    threshold: 5,
  },
  ten_materials: {
    id: 'ten_materials',
    title: 'Filament Connoisseur',
    description: 'Explore 10 different filament materials',
    icon: '🎯',
    points: 50,
    category: 'exploration',
    threshold: 10,
  },
  twenty_materials: {
    id: 'twenty_materials',
    title: 'Material Master',
    description: 'Explore 20 different filament materials',
    icon: '🏆',
    points: 100,
    category: 'exploration',
    threshold: 20,
  },
  all_material_types: {
    id: 'all_material_types',
    title: 'Completionist',
    description: 'Explore at least one filament from each major material type',
    icon: '🌟',
    points: 150,
    category: 'exploration',
    secret: true,
  },

  // Learning achievements
  first_tutorial: {
    id: 'first_tutorial',
    title: 'Student',
    description: 'Watch your first tutorial video',
    icon: '📺',
    points: 15,
    category: 'learning',
  },
  five_tutorials: {
    id: 'five_tutorials',
    title: 'Eager Learner',
    description: 'Watch 5 tutorial videos',
    icon: '📚',
    points: 40,
    category: 'learning',
    threshold: 5,
  },
  glossary_explorer: {
    id: 'glossary_explorer',
    title: 'Word Wizard',
    description: 'Look up 10 glossary terms',
    icon: '📖',
    points: 20,
    category: 'learning',
    threshold: 10,
  },
  glossary_master: {
    id: 'glossary_master',
    title: 'Walking Encyclopedia',
    description: 'Look up 30 glossary terms',
    icon: '🧠',
    points: 50,
    category: 'learning',
    threshold: 30,
  },

  // Progression achievements
  intermediate_unlock: {
    id: 'intermediate_unlock',
    title: 'Level Up!',
    description: 'Reach intermediate skill level',
    icon: '⬆️',
    points: 100,
    category: 'progression',
  },
  advanced_unlock: {
    id: 'advanced_unlock',
    title: 'Expert Mode',
    description: 'Reach advanced skill level',
    icon: '🚀',
    points: 250,
    category: 'progression',
  },
  
  // Action achievements
  first_export: {
    id: 'first_export',
    title: 'Settings Saver',
    description: 'Export your first print settings',
    icon: '💾',
    points: 15,
    category: 'actions',
  },
  ten_exports: {
    id: 'ten_exports',
    title: 'Export Expert',
    description: 'Export settings 10 times',
    icon: '📤',
    points: 40,
    category: 'actions',
    threshold: 10,
  },
  first_comparison: {
    id: 'first_comparison',
    title: 'Compare & Contrast',
    description: 'Compare two or more filaments',
    icon: '⚖️',
    points: 15,
    category: 'actions',
  },
  comparison_pro: {
    id: 'comparison_pro',
    title: 'Comparison Pro',
    description: 'Make 10 filament comparisons',
    icon: '📊',
    points: 50,
    category: 'actions',
    threshold: 10,
  },
  printer_configured: {
    id: 'printer_configured',
    title: 'Ready to Print',
    description: 'Configure your first printer',
    icon: '🖨️',
    points: 20,
    category: 'actions',
  },
  multi_printer: {
    id: 'multi_printer',
    title: 'Print Farm',
    description: 'Configure 3 or more printers',
    icon: '🏭',
    points: 60,
    category: 'actions',
    threshold: 3,
  },

  // Mastery achievements
  hundred_points: {
    id: 'hundred_points',
    title: 'Century',
    description: 'Earn 100 total points',
    icon: '💯',
    points: 0,
    category: 'mastery',
    threshold: 100,
  },
  five_hundred_points: {
    id: 'five_hundred_points',
    title: 'High Achiever',
    description: 'Earn 500 total points',
    icon: '🎖️',
    points: 0,
    category: 'mastery',
    threshold: 500,
  },
  thousand_points: {
    id: 'thousand_points',
    title: 'FilaScope Master',
    description: 'Earn 1000 total points',
    icon: '👑',
    points: 0,
    category: 'mastery',
    threshold: 1000,
  },
};

export function getAchievementsByCategory(category: Achievement['category']): Achievement[] {
  return Object.values(ACHIEVEMENTS).filter(a => a.category === category);
}

export function getTotalPossiblePoints(): number {
  return Object.values(ACHIEVEMENTS).reduce((sum, a) => sum + a.points, 0);
}

export function getNextLevelThreshold(currentPoints: number): { level: string; threshold: number; progress: number } {
  const levels = [
    { level: 'Beginner', threshold: 0 },
    { level: 'Apprentice', threshold: 100 },
    { level: 'Intermediate', threshold: 300 },
    { level: 'Advanced', threshold: 600 },
    { level: 'Expert', threshold: 1000 },
    { level: 'Master', threshold: 1500 },
  ];
  
  for (let i = levels.length - 1; i >= 0; i--) {
    if (currentPoints >= levels[i].threshold) {
      const nextLevel = levels[i + 1];
      if (nextLevel) {
        const progress = ((currentPoints - levels[i].threshold) / (nextLevel.threshold - levels[i].threshold)) * 100;
        return { level: levels[i].level, threshold: nextLevel.threshold, progress };
      }
      return { level: levels[i].level, threshold: levels[i].threshold, progress: 100 };
    }
  }
  
  return { level: 'Beginner', threshold: 100, progress: (currentPoints / 100) * 100 };
}
