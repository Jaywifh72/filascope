// Repository Quiz Questions and Options

export interface QuestionOption {
  id: string;
  label: string;
  description?: string;
  icon: string;
}

export interface Question {
  id: string;
  question: string;
  description?: string;
  type: 'single' | 'multi';
  maxSelections?: number;
  options: QuestionOption[];
}

export const repoQuizQuestions: Question[] = [
  {
    id: 'printer-brand',
    question: 'What 3D printer do you use?',
    description: 'This helps us recommend platforms optimized for your hardware.',
    type: 'single',
    options: [
      { id: 'bambu', label: 'Bambu Lab', description: 'X1C, P1S, A1, etc.', icon: '🖨️' },
      { id: 'creality', label: 'Creality', description: 'Ender, K1, etc.', icon: '📦' },
      { id: 'prusa', label: 'Prusa', description: 'MK4, Mini, XL', icon: '⚙️' },
      { id: 'other', label: 'Other Brand', description: 'Voron, Anker, etc.', icon: '🔧' },
      { id: 'multiple', label: 'Multiple / Not Sure', description: '', icon: '🤷' }
    ]
  },
  {
    id: 'primary-goal',
    question: "What's your main goal?",
    description: 'Different platforms excel at different things.',
    type: 'single',
    options: [
      { id: 'free-personal', label: 'Download free models', description: 'For personal use', icon: '🆓' },
      { id: 'quality-curated', label: 'Find high-quality models', description: 'Curated & tested', icon: '⭐' },
      { id: 'sell-models', label: 'Sell my designs', description: 'Monetize my work', icon: '💰' },
      { id: 'cad-engineering', label: 'Find CAD/engineering files', description: 'STEP, IGES, etc.', icon: '🔧' },
      { id: 'specific-search', label: 'Search for specific models', description: 'Hard to find items', icon: '🔍' },
      { id: 'one-click-print', label: 'Easy one-click printing', description: 'Minimal setup', icon: '👆' }
    ]
  },
  {
    id: 'budget',
    question: "What's your budget for 3D models?",
    type: 'single',
    options: [
      { id: 'free-only', label: 'Only free models', description: "Won't pay for files", icon: '🆓' },
      { id: 'mostly-free', label: 'Mostly free', description: 'Occasional paid OK', icon: '💵' },
      { id: 'pay-for-quality', label: 'Willing to pay', description: 'Quality is worth it', icon: '💳' },
      { id: 'subscription', label: 'Subscription is fine', description: 'Premium access', icon: '📅' }
    ]
  },
  {
    id: 'experience',
    question: 'How experienced are you with 3D printing?',
    type: 'single',
    options: [
      { id: 'beginner', label: 'Complete beginner', description: 'Just getting started', icon: '🌱' },
      { id: 'intermediate', label: 'Intermediate', description: 'Comfortable with basics', icon: '📈' },
      { id: 'advanced', label: 'Advanced', description: 'Modify files, custom settings', icon: '🎯' },
      { id: 'professional', label: 'Professional/Designer', description: 'Create my own models', icon: '💼' }
    ]
  },
  {
    id: 'features',
    question: 'Which features matter most?',
    description: 'Select up to 2 that are most important to you.',
    type: 'multi',
    maxSelections: 2,
    options: [
      { id: 'large-library', label: 'Large model library', description: 'Maximum selection', icon: '📚' },
      { id: 'quality-curation', label: 'Quality curation', description: 'Tested models', icon: '✅' },
      { id: 'mobile-app', label: 'Mobile app support', description: 'Print from phone', icon: '📱' },
      { id: 'community', label: 'Community & contests', description: 'Active engagement', icon: '👥' },
      { id: 'seller-rates', label: 'Best seller rates', description: 'High commissions', icon: '💰' },
      { id: 'ai-search', label: 'AI/Geometric search', description: 'Find by shape', icon: '🤖' },
      { id: 'cad-formats', label: 'CAD file formats', description: 'STEP, IGES, etc.', icon: '📐' },
      { id: 'print-profiles', label: 'Pre-sliced profiles', description: 'One-click print', icon: '⚡' }
    ]
  }
];

export type RepoQuizAnswers = Record<string, string[]>;
