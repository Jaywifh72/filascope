// Repository Quiz Scoring Algorithm

export interface PlatformScore {
  platformId: string;
  baseScore: number;
  bonusPoints: number;
  totalScore: number;
  maxPossibleScore: number;
  matchPercentage: number;
  matchReasons: string[];
  tradeOffs: string[];
}

export interface QuizAnswer {
  questionId: string;
  selectedOptions: string[];
}

interface ScoringWeight {
  platformId: string;
  points: number;
  reason: string;
}

// Platform base scores (inherent quality)
const platformBaseScores: Record<string, number> = {
  'printables': 85,
  'makerworld': 82,
  'thingiverse': 70,
  'cults3d': 78,
  'myminifactory': 80,
  'thangs': 75,
  'creality-cloud': 68,
  'grabcad': 77
};

// Scoring weights for each answer
const scoringMatrix: Record<string, Record<string, ScoringWeight[]>> = {
  'printer-brand': {
    'bambu': [
      { platformId: 'makerworld', points: 40, reason: 'Perfect Bambu printer integration' },
      { platformId: 'printables', points: 10, reason: 'Good cross-platform support' }
    ],
    'creality': [
      { platformId: 'creality-cloud', points: 40, reason: 'Native Creality ecosystem' },
      { platformId: 'thingiverse', points: 15, reason: 'Large compatible model library' }
    ],
    'prusa': [
      { platformId: 'printables', points: 40, reason: 'Prusameters for your printer' },
      { platformId: 'thingiverse', points: 15, reason: 'Extensive Prusa-compatible models' }
    ],
    'other': [
      { platformId: 'printables', points: 20, reason: 'Universal compatibility' },
      { platformId: 'thingiverse', points: 20, reason: 'Works with any printer' },
      { platformId: 'thangs', points: 15, reason: 'Multi-format support' }
    ],
    'multiple': [
      { platformId: 'printables', points: 15, reason: 'Good for multiple printers' },
      { platformId: 'thingiverse', points: 15, reason: 'Universal STL format' },
      { platformId: 'thangs', points: 10, reason: 'Aggregates multiple sources' }
    ]
  },
  'primary-goal': {
    'free-personal': [
      { platformId: 'thingiverse', points: 30, reason: 'Largest free model archive' },
      { platformId: 'makerworld', points: 25, reason: 'All models are free' },
      { platformId: 'printables', points: 20, reason: 'Many free community models' }
    ],
    'quality-curated': [
      { platformId: 'printables', points: 35, reason: 'Strong quality curation' },
      { platformId: 'myminifactory', points: 30, reason: 'Guaranteed printable' },
      { platformId: 'makerworld', points: 15, reason: 'Verified print profiles' }
    ],
    'sell-models': [
      { platformId: 'cults3d', points: 40, reason: 'Best 80/20 commission split' },
      { platformId: 'myminifactory', points: 30, reason: 'Premium marketplace' },
      { platformId: 'printables', points: 20, reason: 'Growing seller program' }
    ],
    'cad-engineering': [
      { platformId: 'grabcad', points: 50, reason: 'Specialized in CAD formats' },
      { platformId: 'thangs', points: 25, reason: 'Supports 30+ file formats' }
    ],
    'specific-search': [
      { platformId: 'thangs', points: 40, reason: 'Geometric AI search technology' },
      { platformId: 'thingiverse', points: 20, reason: 'Largest searchable archive' }
    ],
    'one-click-print': [
      { platformId: 'makerworld', points: 45, reason: 'Pre-sliced print profiles' },
      { platformId: 'creality-cloud', points: 20, reason: 'Phone-to-print workflow' }
    ]
  },
  'budget': {
    'free-only': [
      { platformId: 'thingiverse', points: 35, reason: 'Completely free archive' },
      { platformId: 'makerworld', points: 30, reason: 'No paid models' },
      { platformId: 'grabcad', points: 25, reason: 'Free engineering files' },
      { platformId: 'printables', points: 20, reason: 'Mostly free content' }
    ],
    'mostly-free': [
      { platformId: 'printables', points: 30, reason: 'Great free selection with paid options' },
      { platformId: 'cults3d', points: 25, reason: 'Mix of free and paid' },
      { platformId: 'thingiverse', points: 20, reason: 'Extensive free library' }
    ],
    'pay-for-quality': [
      { platformId: 'myminifactory', points: 35, reason: 'Premium curated marketplace' },
      { platformId: 'cults3d', points: 30, reason: 'Quality paid models' },
      { platformId: 'printables', points: 20, reason: 'Growing premium section' }
    ],
    'subscription': [
      { platformId: 'myminifactory', points: 30, reason: 'Tribes subscription model' },
      { platformId: 'thangs', points: 25, reason: 'Premium search features' }
    ]
  },
  'experience': {
    'beginner': [
      { platformId: 'makerworld', points: 35, reason: 'Easiest workflow for beginners' },
      { platformId: 'thingiverse', points: 25, reason: 'Simple interface' },
      { platformId: 'creality-cloud', points: 20, reason: 'Guided mobile experience' }
    ],
    'intermediate': [
      { platformId: 'printables', points: 25, reason: 'Good balance of features' },
      { platformId: 'makerworld', points: 20, reason: 'Still user-friendly' },
      { platformId: 'cults3d', points: 15, reason: 'Straightforward marketplace' }
    ],
    'advanced': [
      { platformId: 'printables', points: 30, reason: 'Advanced features and community' },
      { platformId: 'thangs', points: 25, reason: 'Powerful search tools' },
      { platformId: 'grabcad', points: 20, reason: 'Professional-grade files' }
    ],
    'professional': [
      { platformId: 'grabcad', points: 35, reason: 'Engineering-focused platform' },
      { platformId: 'cults3d', points: 30, reason: 'Professional seller tools' },
      { platformId: 'myminifactory', points: 25, reason: 'Premium marketplace' }
    ]
  },
  'features': {
    'large-library': [
      { platformId: 'thingiverse', points: 25, reason: '6.7M+ models available' },
      { platformId: 'thangs', points: 20, reason: 'Aggregates 30+ sources' },
      { platformId: 'printables', points: 15, reason: 'Fast-growing library' }
    ],
    'quality-curation': [
      { platformId: 'myminifactory', points: 30, reason: 'Guaranteed printable verification' },
      { platformId: 'printables', points: 25, reason: 'Community curation' }
    ],
    'mobile-app': [
      { platformId: 'makerworld', points: 35, reason: 'Full Bambu Handy integration' },
      { platformId: 'creality-cloud', points: 30, reason: 'Mobile-first platform' }
    ],
    'community': [
      { platformId: 'printables', points: 30, reason: 'Clubs and contests' },
      { platformId: 'makerworld', points: 20, reason: 'Active creator community' }
    ],
    'seller-rates': [
      { platformId: 'cults3d', points: 40, reason: 'Best 80/20 commission split' },
      { platformId: 'myminifactory', points: 20, reason: 'Premium marketplace fees' }
    ],
    'ai-search': [
      { platformId: 'thangs', points: 45, reason: 'Geometric AI search engine' }
    ],
    'cad-formats': [
      { platformId: 'grabcad', points: 50, reason: 'STEP, IGES, SolidWorks, Fusion' },
      { platformId: 'thangs', points: 20, reason: 'Multi-format support' }
    ],
    'print-profiles': [
      { platformId: 'makerworld', points: 45, reason: 'One-click 3MF profiles' }
    ]
  }
};

// Get trade-offs for each platform
export const getTradeOffs = (platformId: string): string[] => {
  const tradeOffs: Record<string, string[]> = {
    'makerworld': [
      'Locked to Bambu ecosystem',
      'Limited to STL/3MF formats',
      'Newer platform, smaller library'
    ],
    'printables': [
      'No native Bambu integration',
      'Smaller than Thingiverse',
      'Limited mobile features'
    ],
    'thingiverse': [
      'Quality varies significantly',
      'Outdated interface',
      'No seller marketplace'
    ],
    'cults3d': [
      'Many paid models',
      'No printer integration',
      'Smaller community'
    ],
    'myminifactory': [
      'Mostly paid models',
      'Premium subscription required for best features',
      'Smaller selection'
    ],
    'thangs': [
      'Aggregator - links to other sites',
      'Requires subscriptions for some features',
      'Less direct community'
    ],
    'creality-cloud': [
      'Best only for Creality printers',
      'Smaller model library',
      'Mobile-focused interface'
    ],
    'grabcad': [
      'Not focused on 3D printing',
      'Engineering-oriented',
      'No print profiles'
    ]
  };

  return tradeOffs[platformId] || [];
};

// Calculate scores based on quiz answers
export const calculateRepoQuizScores = (answers: QuizAnswer[]): PlatformScore[] => {
  const scores: Record<string, PlatformScore> = {};

  // Initialize scores with base values
  Object.entries(platformBaseScores).forEach(([platformId, baseScore]) => {
    scores[platformId] = {
      platformId,
      baseScore,
      bonusPoints: 0,
      totalScore: baseScore,
      maxPossibleScore: 300,
      matchPercentage: 0,
      matchReasons: [],
      tradeOffs: getTradeOffs(platformId)
    };
  });

  // Apply scoring weights based on answers
  answers.forEach(answer => {
    const questionWeights = scoringMatrix[answer.questionId];
    if (!questionWeights) return;

    answer.selectedOptions.forEach(option => {
      const optionWeights = questionWeights[option];
      if (!optionWeights) return;

      optionWeights.forEach(weight => {
        if (scores[weight.platformId]) {
          scores[weight.platformId].bonusPoints += weight.points;
          scores[weight.platformId].matchReasons.push(weight.reason);
        }
      });
    });
  });

  // Calculate total scores and percentages
  Object.values(scores).forEach(score => {
    score.totalScore = score.baseScore + score.bonusPoints;
    // Scale to percentage (roughly 70-99% range for better UX)
    score.matchPercentage = Math.min(99, Math.max(50, Math.round(
      50 + (score.totalScore / score.maxPossibleScore) * 49
    )));
  });

  // Sort by total score descending
  return Object.values(scores).sort((a, b) => b.totalScore - a.totalScore);
};

// Get top N recommendations
export const getTopRepoRecommendations = (answers: QuizAnswer[], count: number = 3): PlatformScore[] => {
  return calculateRepoQuizScores(answers).slice(0, count);
};
