// CAD Quiz Data - Questions and Software Scoring Profiles

export interface CADQuizOption {
  id: string;
  label: string;
  description?: string;
  icon: string;
  scores: Record<string, number>;
}

export interface CADQuizQuestion {
  id: string;
  question: string;
  subtext?: string;
  type: 'single' | 'multi';
  maxSelections?: number;
  options: CADQuizOption[];
}

export interface CADSoftwareProfile {
  id: string;
  name: string;
  scores: {
    beginner: number;
    intermediate: number;
    advanced: number;
    parametric: number;
    sculpting: number;
    mesh: number;
    cad: number;
    arch: number;
    animation: number;
    surface: number;
    learning: number;
    free: number;
    freemium: number;
    paid: number;
    windows: number;
    mac: number;
    linux: number;
    mobile: number;
    browser: number;
    ease: number;
    features: number;
    precision: number;
    community: number;
    speed: number;
    printing: number;
    industry: number;
    quickStart: number;
    learningCurve: number;
  };
}

export type CADQuizAnswers = Record<string, string | string[]>;

// ============= Quiz Questions =============

export const cadQuizQuestions: CADQuizQuestion[] = [
  // Question 1: Experience Level
  {
    id: 'experience',
    question: "What's your 3D design experience level?",
    subtext: "Be honest - we'll find software that matches your skills",
    type: 'single',
    options: [
      {
        id: 'none',
        label: 'Complete Beginner',
        description: "Never used 3D software before",
        icon: '🌱',
        scores: { beginner: 10, intermediate: 2, advanced: 0 }
      },
      {
        id: 'some',
        label: 'Some Experience',
        description: "Tried a few tools, made simple projects",
        icon: '📚',
        scores: { beginner: 6, intermediate: 8, advanced: 2 }
      },
      {
        id: 'intermediate',
        label: 'Intermediate',
        description: "Comfortable with 3D concepts, made several projects",
        icon: '⚡',
        scores: { beginner: 2, intermediate: 10, advanced: 6 }
      },
      {
        id: 'professional',
        label: 'Professional/Advanced',
        description: "Use 3D software regularly for work or serious hobby",
        icon: '🏆',
        scores: { beginner: 0, intermediate: 4, advanced: 10 }
      }
    ]
  },
  
  // Question 2: Primary Use Case
  {
    id: 'useCase',
    question: "What will you primarily create?",
    subtext: "Select the closest match to your main goal",
    type: 'single',
    options: [
      {
        id: 'functional',
        label: 'Functional Parts',
        description: "Brackets, enclosures, mechanical components",
        icon: '🔧',
        scores: { parametric: 10, sculpting: 0, mesh: 4, cad: 10 }
      },
      {
        id: 'artistic',
        label: 'Artistic Sculptures',
        description: "Figurines, characters, organic shapes",
        icon: '🎨',
        scores: { parametric: 0, sculpting: 10, mesh: 8, cad: 2 }
      },
      {
        id: 'architectural',
        label: 'Architecture/Interiors',
        description: "Buildings, rooms, spatial designs",
        icon: '🏠',
        scores: { parametric: 6, sculpting: 2, mesh: 6, cad: 8, arch: 10 }
      },
      {
        id: 'characters',
        label: 'Characters/Game Assets',
        description: "Game models, animations, VFX",
        icon: '🎮',
        scores: { parametric: 0, sculpting: 8, mesh: 10, cad: 0, animation: 10 }
      },
      {
        id: 'products',
        label: 'Product Design',
        description: "Consumer products, industrial design",
        icon: '📱',
        scores: { parametric: 8, sculpting: 4, mesh: 4, cad: 8, surface: 10 }
      },
      {
        id: 'learning',
        label: 'Just Learning',
        description: "Exploring 3D design, no specific goal yet",
        icon: '🎓',
        scores: { parametric: 4, sculpting: 4, mesh: 6, cad: 4, learning: 10 }
      }
    ]
  },
  
  // Question 3: Budget
  {
    id: 'budget',
    question: "What's your budget for software?",
    subtext: "Many professional tools have free tiers for hobbyists",
    type: 'single',
    options: [
      {
        id: 'free',
        label: 'Free Only',
        description: "$0 - I need completely free software",
        icon: '🆓',
        scores: { free: 10, freemium: 4, paid: 0 }
      },
      {
        id: 'low',
        label: 'Low Budget',
        description: "Under $20/month or one-time under $200",
        icon: '💵',
        scores: { free: 8, freemium: 10, paid: 4 }
      },
      {
        id: 'flexible',
        label: 'Flexible',
        description: "Willing to pay for the right tool",
        icon: '💳',
        scores: { free: 6, freemium: 8, paid: 10 }
      },
      {
        id: 'professional',
        label: 'Professional Budget',
        description: "Business expense, no budget constraints",
        icon: '🏢',
        scores: { free: 4, freemium: 6, paid: 10 }
      }
    ]
  },
  
  // Question 4: Platform
  {
    id: 'platform',
    question: "What device will you use?",
    subtext: "Select all that apply",
    type: 'multi',
    options: [
      { id: 'windows', label: 'Windows PC', icon: '🪟', scores: { windows: 10 } },
      { id: 'mac', label: 'Mac', icon: '🍎', scores: { mac: 10 } },
      { id: 'linux', label: 'Linux', icon: '🐧', scores: { linux: 10 } },
      { id: 'ipad', label: 'iPad/Tablet', icon: '📱', scores: { mobile: 10, browser: 6 } },
      { id: 'browser', label: 'Browser/Chromebook', icon: '🌐', scores: { browser: 10 } }
    ]
  },
  
  // Question 5: Priorities
  {
    id: 'priorities',
    question: "What matters most to you?",
    subtext: "Select up to 2 priorities",
    type: 'multi',
    maxSelections: 2,
    options: [
      {
        id: 'easyLearn',
        label: 'Easy to Learn',
        description: "Intuitive interface, good tutorials",
        icon: '📖',
        scores: { ease: 10 }
      },
      {
        id: 'powerful',
        label: 'Powerful Features',
        description: "Professional capabilities, no limitations",
        icon: '💪',
        scores: { features: 10, precision: 8 }
      },
      {
        id: 'community',
        label: 'Strong Community',
        description: "Tutorials, forums, help available",
        icon: '👥',
        scores: { community: 10 }
      },
      {
        id: 'speed',
        label: 'Fast Workflow',
        description: "Quick results, efficient interface",
        icon: '⚡',
        scores: { speed: 10 }
      },
      {
        id: 'printReady',
        label: '3D Print Ready',
        description: "Easy export for 3D printing",
        icon: '🖨️',
        scores: { printing: 10 }
      },
      {
        id: 'industry',
        label: 'Industry Standard',
        description: "Used by professionals, good for career",
        icon: '🏭',
        scores: { industry: 10 }
      }
    ]
  },
  
  // Question 6: Timeline
  {
    id: 'timeline',
    question: "How quickly do you need results?",
    subtext: "This helps us balance power vs. learning curve",
    type: 'single',
    options: [
      {
        id: 'immediate',
        label: 'Right Away',
        description: "I need to create something this week",
        icon: '🚀',
        scores: { quickStart: 10, learningCurve: 0 }
      },
      {
        id: 'soon',
        label: 'Within a Month',
        description: "I have some time to learn",
        icon: '📅',
        scores: { quickStart: 6, learningCurve: 6 }
      },
      {
        id: 'flexible',
        label: 'No Rush',
        description: "Happy to invest time learning the best tool",
        icon: '🎯',
        scores: { quickStart: 2, learningCurve: 10 }
      }
    ]
  }
];

// ============= Software Scoring Profiles =============

export const cadSoftwareProfiles: CADSoftwareProfile[] = [
  {
    id: 'fusion360',
    name: 'Fusion 360',
    scores: {
      beginner: 7, intermediate: 10, advanced: 8,
      parametric: 10, sculpting: 4, mesh: 6, cad: 10, arch: 5, animation: 3, surface: 8, learning: 7,
      free: 8, freemium: 10, paid: 6,
      windows: 10, mac: 10, linux: 0, mobile: 0, browser: 6,
      ease: 8, features: 9, precision: 10, community: 9, speed: 7, printing: 10, industry: 9,
      quickStart: 6, learningCurve: 8
    }
  },
  {
    id: 'blender',
    name: 'Blender',
    scores: {
      beginner: 5, intermediate: 9, advanced: 10,
      parametric: 4, sculpting: 10, mesh: 10, cad: 4, arch: 7, animation: 10, surface: 6, learning: 6,
      free: 10, freemium: 10, paid: 10,
      windows: 10, mac: 10, linux: 10, mobile: 0, browser: 0,
      ease: 5, features: 10, precision: 7, community: 10, speed: 6, printing: 8, industry: 8,
      quickStart: 4, learningCurve: 10
    }
  },
  {
    id: 'tinkercad',
    name: 'Tinkercad',
    scores: {
      beginner: 10, intermediate: 4, advanced: 1,
      parametric: 3, sculpting: 2, mesh: 5, cad: 5, arch: 3, animation: 0, surface: 2, learning: 10,
      free: 10, freemium: 10, paid: 10,
      windows: 10, mac: 10, linux: 10, mobile: 8, browser: 10,
      ease: 10, features: 3, precision: 4, community: 7, speed: 10, printing: 9, industry: 2,
      quickStart: 10, learningCurve: 2
    }
  },
  {
    id: 'zbrush',
    name: 'ZBrush',
    scores: {
      beginner: 3, intermediate: 7, advanced: 10,
      parametric: 1, sculpting: 10, mesh: 8, cad: 0, arch: 2, animation: 6, surface: 4, learning: 3,
      free: 0, freemium: 4, paid: 10,
      windows: 10, mac: 10, linux: 0, mobile: 0, browser: 0,
      ease: 4, features: 10, precision: 8, community: 9, speed: 7, printing: 9, industry: 10,
      quickStart: 3, learningCurve: 10
    }
  },
  {
    id: 'freecad',
    name: 'FreeCAD',
    scores: {
      beginner: 5, intermediate: 8, advanced: 7,
      parametric: 10, sculpting: 1, mesh: 4, cad: 9, arch: 6, animation: 1, surface: 5, learning: 5,
      free: 10, freemium: 10, paid: 10,
      windows: 10, mac: 10, linux: 10, mobile: 0, browser: 0,
      ease: 5, features: 7, precision: 9, community: 7, speed: 5, printing: 9, industry: 5,
      quickStart: 4, learningCurve: 7
    }
  },
  {
    id: 'shapr3d',
    name: 'Shapr3D',
    scores: {
      beginner: 8, intermediate: 9, advanced: 6,
      parametric: 9, sculpting: 2, mesh: 4, cad: 9, arch: 6, animation: 0, surface: 7, learning: 7,
      free: 4, freemium: 8, paid: 8,
      windows: 8, mac: 10, linux: 0, mobile: 10, browser: 0,
      ease: 9, features: 7, precision: 9, community: 6, speed: 9, printing: 9, industry: 6,
      quickStart: 9, learningCurve: 6
    }
  },
  {
    id: 'onshape',
    name: 'Onshape',
    scores: {
      beginner: 7, intermediate: 9, advanced: 7,
      parametric: 10, sculpting: 1, mesh: 3, cad: 10, arch: 4, animation: 1, surface: 6, learning: 7,
      free: 8, freemium: 10, paid: 8,
      windows: 10, mac: 10, linux: 10, mobile: 8, browser: 10,
      ease: 7, features: 8, precision: 9, community: 7, speed: 8, printing: 9, industry: 7,
      quickStart: 7, learningCurve: 7
    }
  },
  {
    id: 'rhino3d',
    name: 'Rhino 3D',
    scores: {
      beginner: 4, intermediate: 8, advanced: 10,
      parametric: 6, sculpting: 3, mesh: 6, cad: 7, arch: 10, animation: 3, surface: 10, learning: 4,
      free: 0, freemium: 2, paid: 10,
      windows: 10, mac: 10, linux: 0, mobile: 0, browser: 0,
      ease: 5, features: 9, precision: 10, community: 8, speed: 7, printing: 8, industry: 9,
      quickStart: 3, learningCurve: 9
    }
  },
  {
    id: 'sketchup',
    name: 'SketchUp',
    scores: {
      beginner: 9, intermediate: 7, advanced: 4,
      parametric: 3, sculpting: 1, mesh: 5, cad: 5, arch: 10, animation: 2, surface: 3, learning: 8,
      free: 6, freemium: 8, paid: 8,
      windows: 10, mac: 10, linux: 0, mobile: 6, browser: 8,
      ease: 9, features: 6, precision: 5, community: 8, speed: 9, printing: 6, industry: 6,
      quickStart: 9, learningCurve: 4
    }
  },
  {
    id: 'nomadsculpt',
    name: 'Nomad Sculpt',
    scores: {
      beginner: 7, intermediate: 8, advanced: 6,
      parametric: 0, sculpting: 10, mesh: 8, cad: 0, arch: 1, animation: 2, surface: 3, learning: 6,
      free: 0, freemium: 4, paid: 6,
      windows: 0, mac: 0, linux: 0, mobile: 10, browser: 0,
      ease: 8, features: 7, precision: 6, community: 6, speed: 8, printing: 8, industry: 3,
      quickStart: 8, learningCurve: 5
    }
  },
  {
    id: 'solidworks',
    name: 'SolidWorks',
    scores: {
      beginner: 3, intermediate: 7, advanced: 10,
      parametric: 10, sculpting: 0, mesh: 3, cad: 10, arch: 3, animation: 2, surface: 8, learning: 3,
      free: 0, freemium: 2, paid: 10,
      windows: 10, mac: 0, linux: 0, mobile: 0, browser: 0,
      ease: 4, features: 10, precision: 10, community: 8, speed: 6, printing: 9, industry: 10,
      quickStart: 2, learningCurve: 10
    }
  },
  {
    id: 'openscad',
    name: 'OpenSCAD',
    scores: {
      beginner: 4, intermediate: 7, advanced: 8,
      parametric: 10, sculpting: 0, mesh: 2, cad: 8, arch: 2, animation: 0, surface: 2, learning: 4,
      free: 10, freemium: 10, paid: 10,
      windows: 10, mac: 10, linux: 10, mobile: 0, browser: 4,
      ease: 3, features: 6, precision: 9, community: 6, speed: 5, printing: 10, industry: 4,
      quickStart: 3, learningCurve: 8
    }
  },
  {
    id: 'plasticity',
    name: 'Plasticity',
    scores: {
      beginner: 6, intermediate: 9, advanced: 8,
      parametric: 5, sculpting: 3, mesh: 5, cad: 7, arch: 5, animation: 2, surface: 9, learning: 5,
      free: 0, freemium: 6, paid: 8,
      windows: 10, mac: 10, linux: 10, mobile: 0, browser: 0,
      ease: 7, features: 8, precision: 9, community: 5, speed: 9, printing: 7, industry: 5,
      quickStart: 7, learningCurve: 7
    }
  }
];

// ID mapping to match CAD comparison data IDs
export const cadSoftwareIdMap: Record<string, string> = {
  fusion360: 'fusion-360',
  blender: 'blender',
  tinkercad: 'tinkercad',
  zbrush: 'zbrush',
  freecad: 'freecad',
  shapr3d: 'shapr3d',
  onshape: 'onshape',
  rhino3d: 'rhino-3d',
  sketchup: 'sketchup',
  nomadsculpt: 'nomad-sculpt',
  solidworks: 'solidworks',
  openscad: 'openscad',
  plasticity: 'plasticity'
};
