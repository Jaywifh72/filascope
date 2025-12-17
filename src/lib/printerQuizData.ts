export interface QuizOption {
  id: string;
  emoji: string;
  label: string;
  description?: string;
}

export interface QuizQuestion {
  id: string;
  title: string;
  subtitle?: string;
  type: 'single' | 'multiple';
  maxSelections?: number;
  options: QuizOption[];
}

export const quizQuestions: QuizQuestion[] = [
  {
    id: 'experience',
    title: 'How would you describe your 3D printing experience?',
    subtitle: 'This helps us recommend the right complexity level',
    type: 'single',
    options: [
      {
        id: 'complete-beginner',
        emoji: '🌱',
        label: "I'm completely new to 3D printing",
        description: 'Never printed before'
      },
      {
        id: 'researched',
        emoji: '🎯',
        label: "I've done research but never owned a printer",
        description: 'Know the basics'
      },
      {
        id: 'experienced',
        emoji: '🔧',
        label: "I've used 3D printers before",
        description: 'Comfortable with printing'
      },
      {
        id: 'advanced',
        emoji: '⚙️',
        label: "I'm experienced with technical setups",
        description: 'Ready for advanced features'
      }
    ]
  },
  {
    id: 'useCase',
    title: 'What do you mainly want to print?',
    subtitle: 'Select the primary use case for your printer',
    type: 'single',
    options: [
      {
        id: 'decorations',
        emoji: '🎨',
        label: 'Decorations, gifts, and artistic projects',
        description: 'Home decor, figurines, art'
      },
      {
        id: 'miniatures',
        emoji: '🎮',
        label: 'Miniatures and detailed models',
        description: 'Gaming, dioramas, precision'
      },
      {
        id: 'functional',
        emoji: '🔩',
        label: 'Functional parts and prototypes',
        description: 'Engineering, repairs, tools'
      },
      {
        id: 'educational',
        emoji: '📚',
        label: 'Educational projects and learning',
        description: 'Teaching, STEM, experiments'
      },
      {
        id: 'versatile',
        emoji: '💡',
        label: 'Multiple uses - I want versatility',
        description: 'All-around capabilities'
      }
    ]
  },
  {
    id: 'budget',
    title: "What's your budget for the printer?",
    subtitle: 'We\'ll find the best options in your range',
    type: 'single',
    options: [
      {
        id: 'under-500',
        emoji: '💰',
        label: 'Under $500',
        description: 'Budget-friendly options'
      },
      {
        id: '500-1000',
        emoji: '💵',
        label: '$500 - $1,000',
        description: 'Mid-range sweet spot'
      },
      {
        id: '1000-2000',
        emoji: '💳',
        label: '$1,000 - $2,000',
        description: 'Premium features'
      },
      {
        id: 'over-2000',
        emoji: '💎',
        label: '$2,000+',
        description: 'Professional grade'
      },
      {
        id: 'flexible',
        emoji: '🤷',
        label: 'Not sure yet - show me options',
        description: 'Explore the range'
      }
    ]
  },
  {
    id: 'space',
    title: 'Where will your printer live?',
    subtitle: 'This affects size and noise recommendations',
    type: 'single',
    options: [
      {
        id: 'living-space',
        emoji: '🏠',
        label: 'In my living space',
        description: 'Needs to be compact and quiet'
      },
      {
        id: 'workshop',
        emoji: '🛠️',
        label: 'In a garage or workshop',
        description: 'Size and noise not a concern'
      },
      {
        id: 'desk',
        emoji: '📦',
        label: 'Small desk or shelf',
        description: 'Must be very compact'
      },
      {
        id: 'office',
        emoji: '🏢',
        label: 'In an office or classroom',
        description: 'Professional and safe'
      }
    ]
  },
  {
    id: 'features',
    title: 'Which features are most important to you?',
    subtitle: 'Select up to 3 features',
    type: 'multiple',
    maxSelections: 3,
    options: [
      {
        id: 'fast',
        emoji: '⚡',
        label: 'Fast printing speeds',
        description: '300mm/s or higher'
      },
      {
        id: 'multicolor',
        emoji: '🎨',
        label: 'Multi-color capabilities',
        description: 'AMS/MMU support'
      },
      {
        id: 'large-volume',
        emoji: '📏',
        label: 'Large build volume',
        description: '300mm+ in any axis'
      },
      {
        id: 'quiet',
        emoji: '🔇',
        label: 'Quiet operation',
        description: 'Under 50dB'
      },
      {
        id: 'wifi',
        emoji: '📱',
        label: 'Wi-Fi and remote monitoring',
        description: 'Print from anywhere'
      },
      {
        id: 'easy-setup',
        emoji: '🎯',
        label: 'Easy setup and use',
        description: 'Plug and play'
      },
      {
        id: 'enclosed',
        emoji: '🔒',
        label: 'Enclosed for safety',
        description: 'Better temp control'
      },
      {
        id: 'materials',
        emoji: '💪',
        label: 'Print tough materials',
        description: 'ABS, ASA, Nylon, etc.'
      }
    ]
  },
  {
    id: 'tinkering',
    title: 'How do you feel about setup and tinkering?',
    subtitle: 'Some printers need more attention than others',
    type: 'single',
    options: [
      {
        id: 'plug-and-play',
        emoji: '📦',
        label: 'Just want to unbox and print immediately',
        description: 'Zero tinkering'
      },
      {
        id: 'some-setup',
        emoji: '🔧',
        label: "Don't mind some initial setup",
        description: '1-2 hours setup'
      },
      {
        id: 'enjoy-customizing',
        emoji: '🛠️',
        label: 'Enjoy customizing and upgrading',
        description: 'Mods welcome'
      },
      {
        id: 'build-everything',
        emoji: '⚙️',
        label: 'Want to build/modify everything',
        description: 'Kit printers & DIY'
      }
    ]
  }
];

export type QuizAnswers = Record<string, string[]>;
