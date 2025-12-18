export type QuestionId = 'goal' | 'skillLevel' | 'budget' | 'printerType';

export interface SpecialtyQuizOption {
  id: string;
  icon: string;
  title: string;
  description: string;
}

export interface SpecialtyQuizQuestion {
  id: QuestionId;
  question: string;
  subtitle?: string;
  options: SpecialtyQuizOption[];
}

export interface SpecialtyQuizAnswers {
  goal: string | null;
  skillLevel: string | null;
  budget: string | null;
  printerType: string | null;
}

export const specialtyQuizQuestions: SpecialtyQuizQuestion[] = [
  {
    id: 'goal',
    question: "What's your main goal right now?",
    subtitle: "Select the option that best describes what you want to accomplish",
    options: [
      {
        id: 'print-quality',
        icon: '✨',
        title: 'Improve Print Quality',
        description: 'Fix issues like stringing, corner bulging, poor surface finish, or dimensional accuracy'
      },
      {
        id: 'create-models',
        icon: '🎨',
        title: 'Create or Modify 3D Models',
        description: 'Design new models from scratch, edit existing files, or generate models with AI'
      },
      {
        id: 'monitor-remote',
        icon: '📡',
        title: 'Monitor Prints Remotely',
        description: 'Watch, control, and manage your printers from anywhere with peace of mind'
      },
      {
        id: 'find-models',
        icon: '📦',
        title: 'Find Ready-to-Print Models',
        description: 'Discover and download models that others have created and shared'
      }
    ]
  },
  {
    id: 'skillLevel',
    question: "What's your experience level with 3D printing?",
    subtitle: "Be honest—we'll match tools to your actual skill level",
    options: [
      {
        id: 'beginner',
        icon: '🌱',
        title: 'Beginner',
        description: "I'm new to 3D printing or still learning the basics"
      },
      {
        id: 'intermediate',
        icon: '📈',
        title: 'Intermediate',
        description: "I'm comfortable with my printer and want to optimize"
      },
      {
        id: 'advanced',
        icon: '🎯',
        title: 'Advanced',
        description: "I've modded my printer, use custom firmware, or run multiple machines"
      }
    ]
  },
  {
    id: 'budget',
    question: "What's your budget for tools?",
    subtitle: "We have great options at every price point",
    options: [
      {
        id: 'free-only',
        icon: '🆓',
        title: 'Free Only',
        description: "I'm only interested in tools that are completely free"
      },
      {
        id: 'one-time',
        icon: '💳',
        title: 'One-Time Payment OK',
        description: "I'll pay once for a great tool, but no subscriptions"
      },
      {
        id: 'any-budget',
        icon: '💎',
        title: 'Open to Any Pricing',
        description: "I'll pay for the best tool regardless of pricing model"
      }
    ]
  },
  {
    id: 'printerType',
    question: "What type of printer do you have?",
    subtitle: "Some tools work better with specific printer ecosystems",
    options: [
      {
        id: 'bambu',
        icon: '🎋',
        title: 'Bambu Lab',
        description: 'P1S, P1P, X1C, A1, or other Bambu printers'
      },
      {
        id: 'klipper',
        icon: '⚡',
        title: 'Klipper-Based',
        description: 'Voron, Ratrig, or any printer running Klipper firmware'
      },
      {
        id: 'marlin',
        icon: '🔧',
        title: 'Marlin/Stock Firmware',
        description: 'Creality, Prusa, Anycubic, or other stock firmware printers'
      },
      {
        id: 'multiple',
        icon: '🏭',
        title: 'Multiple Printers',
        description: 'I have several printers of different types'
      }
    ]
  }
];
