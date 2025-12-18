import { SpecialtyQuizAnswers } from './specialtyQuizData';
import { specialtyTools } from './specialtyData';

interface ToolScoreWeights {
  goalWeights: Record<string, number>;
  skillWeights: Record<string, number>;
  budgetWeights: Record<string, number>;
  printerWeights: Record<string, number>;
}

export interface ToolMatch {
  toolId: string;
  score: number;
  matchPercentage: number;
  matchReasons: string[];
}

// Scoring weights for each tool based on quiz answers (0-100 scale)
const toolScoringMatrix: Record<string, ToolScoreWeights> = {
  'ellis-guide': {
    goalWeights: {
      'print-quality': 100,
      'create-models': 10,
      'monitor-remote': 5,
      'find-models': 5
    },
    skillWeights: {
      'beginner': 40,
      'intermediate': 90,
      'advanced': 100
    },
    budgetWeights: {
      'free-only': 100,
      'one-time': 100,
      'any-budget': 100
    },
    printerWeights: {
      'bambu': 60,
      'klipper': 100,
      'marlin': 50,
      'multiple': 80
    }
  },
  'hueforge': {
    goalWeights: {
      'print-quality': 20,
      'create-models': 100,
      'monitor-remote': 5,
      'find-models': 30
    },
    skillWeights: {
      'beginner': 80,
      'intermediate': 100,
      'advanced': 90
    },
    budgetWeights: {
      'free-only': 0,
      'one-time': 100,
      'any-budget': 100
    },
    printerWeights: {
      'bambu': 100,
      'klipper': 90,
      'marlin': 90,
      'multiple': 100
    }
  },
  'octoeverywhere': {
    goalWeights: {
      'print-quality': 30,
      'create-models': 5,
      'monitor-remote': 100,
      'find-models': 5
    },
    skillWeights: {
      'beginner': 80,
      'intermediate': 100,
      'advanced': 100
    },
    budgetWeights: {
      'free-only': 70,
      'one-time': 60,
      'any-budget': 100
    },
    printerWeights: {
      'bambu': 100,
      'klipper': 100,
      'marlin': 100,
      'multiple': 100
    }
  },
  'meshy': {
    goalWeights: {
      'print-quality': 10,
      'create-models': 100,
      'monitor-remote': 5,
      'find-models': 40
    },
    skillWeights: {
      'beginner': 100,
      'intermediate': 90,
      'advanced': 70
    },
    budgetWeights: {
      'free-only': 60,
      'one-time': 70,
      'any-budget': 100
    },
    printerWeights: {
      'bambu': 90,
      'klipper': 90,
      'marlin': 90,
      'multiple': 90
    }
  },
  'formware': {
    goalWeights: {
      'print-quality': 70,
      'create-models': 80,
      'monitor-remote': 5,
      'find-models': 20
    },
    skillWeights: {
      'beginner': 60,
      'intermediate': 100,
      'advanced': 90
    },
    budgetWeights: {
      'free-only': 100,
      'one-time': 100,
      'any-budget': 100
    },
    printerWeights: {
      'bambu': 90,
      'klipper': 90,
      'marlin': 90,
      'multiple': 90
    }
  },
  'lithophanemaker': {
    goalWeights: {
      'print-quality': 10,
      'create-models': 90,
      'monitor-remote': 5,
      'find-models': 20
    },
    skillWeights: {
      'beginner': 100,
      'intermediate': 80,
      'advanced': 60
    },
    budgetWeights: {
      'free-only': 100,
      'one-time': 100,
      'any-budget': 100
    },
    printerWeights: {
      'bambu': 90,
      'klipper': 90,
      'marlin': 90,
      'multiple': 90
    }
  },
  'makerworld': {
    goalWeights: {
      'print-quality': 20,
      'create-models': 30,
      'monitor-remote': 5,
      'find-models': 100
    },
    skillWeights: {
      'beginner': 100,
      'intermediate': 90,
      'advanced': 70
    },
    budgetWeights: {
      'free-only': 100,
      'one-time': 100,
      'any-budget': 100
    },
    printerWeights: {
      'bambu': 100,
      'klipper': 40,
      'marlin': 50,
      'multiple': 70
    }
  },
  'onshape': {
    goalWeights: {
      'print-quality': 10,
      'create-models': 100,
      'monitor-remote': 5,
      'find-models': 10
    },
    skillWeights: {
      'beginner': 40,
      'intermediate': 80,
      'advanced': 100
    },
    budgetWeights: {
      'free-only': 80,
      'one-time': 70,
      'any-budget': 100
    },
    printerWeights: {
      'bambu': 90,
      'klipper': 90,
      'marlin': 90,
      'multiple': 90
    }
  },
  'simplyprint': {
    goalWeights: {
      'print-quality': 30,
      'create-models': 10,
      'monitor-remote': 90,
      'find-models': 10
    },
    skillWeights: {
      'beginner': 60,
      'intermediate': 90,
      'advanced': 100
    },
    budgetWeights: {
      'free-only': 60,
      'one-time': 50,
      'any-budget': 100
    },
    printerWeights: {
      'bambu': 80,
      'klipper': 100,
      'marlin': 90,
      'multiple': 100
    }
  },
  'thangs': {
    goalWeights: {
      'print-quality': 10,
      'create-models': 20,
      'monitor-remote': 5,
      'find-models': 100
    },
    skillWeights: {
      'beginner': 100,
      'intermediate': 90,
      'advanced': 80
    },
    budgetWeights: {
      'free-only': 90,
      'one-time': 90,
      'any-budget': 100
    },
    printerWeights: {
      'bambu': 90,
      'klipper': 90,
      'marlin': 90,
      'multiple': 90
    }
  }
};

// Match reason generators
const getGoalMatchReason = (goal: string): string => {
  const reasons: Record<string, string> = {
    'print-quality': 'Perfect for improving print quality ✓',
    'create-models': 'Great for creating and modifying models ✓',
    'monitor-remote': 'Ideal for remote monitoring ✓',
    'find-models': 'Excellent for finding models ✓'
  };
  return reasons[goal] || '';
};

const getSkillMatchReason = (skill: string): string => {
  const reasons: Record<string, string> = {
    'beginner': 'Beginner-friendly with easy learning curve ✓',
    'intermediate': 'Matches your intermediate skill level ✓',
    'advanced': 'Powerful features for advanced users ✓'
  };
  return reasons[skill] || '';
};

const getBudgetMatchReason = (budget: string, toolId: string): string => {
  const toolData = specialtyTools.find(t => t.id === toolId);
  if (!toolData) return 'Fits your budget ✓';
  
  if (budget === 'free-only' && toolData.pricingModel === 'free') {
    return 'Completely free ✓';
  }
  if (budget === 'free-only' && toolData.pricingModel === 'freemium') {
    return 'Free tier available ✓';
  }
  if (budget === 'one-time' && toolData.pricingModel === 'one-time') {
    return 'One-time purchase, no subscription ✓';
  }
  return 'Fits your budget ✓';
};

const getPrinterMatchReason = (printer: string): string => {
  const reasons: Record<string, string> = {
    'bambu': 'Works great with Bambu printers ✓',
    'klipper': 'Optimized for Klipper firmware ✓',
    'marlin': 'Compatible with your printer ✓',
    'multiple': 'Works across all your printers ✓'
  };
  return reasons[printer] || '';
};

// Calculate match scores for all tools
export const calculateToolMatches = (answers: SpecialtyQuizAnswers): ToolMatch[] => {
  const toolIds = Object.keys(toolScoringMatrix);
  
  const matches: ToolMatch[] = toolIds.map(toolId => {
    const weights = toolScoringMatrix[toolId];
    let totalScore = 0;
    let maxPossibleScore = 0;
    const matchReasons: string[] = [];
    
    // Goal weight (40% of total)
    if (answers.goal) {
      const goalScore = weights.goalWeights[answers.goal] || 0;
      totalScore += goalScore * 0.4;
      maxPossibleScore += 100 * 0.4;
      
      if (goalScore >= 80) {
        matchReasons.push(getGoalMatchReason(answers.goal));
      }
    }
    
    // Skill level weight (25% of total)
    if (answers.skillLevel) {
      const skillScore = weights.skillWeights[answers.skillLevel] || 0;
      totalScore += skillScore * 0.25;
      maxPossibleScore += 100 * 0.25;
      
      if (skillScore >= 80) {
        matchReasons.push(getSkillMatchReason(answers.skillLevel));
      }
    }
    
    // Budget weight (20% of total)
    if (answers.budget) {
      const budgetScore = weights.budgetWeights[answers.budget] || 0;
      totalScore += budgetScore * 0.2;
      maxPossibleScore += 100 * 0.2;
      
      if (budgetScore >= 80) {
        matchReasons.push(getBudgetMatchReason(answers.budget, toolId));
      }
    }
    
    // Printer type weight (15% of total)
    if (answers.printerType) {
      const printerScore = weights.printerWeights[answers.printerType] || 0;
      totalScore += printerScore * 0.15;
      maxPossibleScore += 100 * 0.15;
      
      if (printerScore >= 80) {
        matchReasons.push(getPrinterMatchReason(answers.printerType));
      }
    }
    
    const matchPercentage = maxPossibleScore > 0 
      ? Math.round((totalScore / maxPossibleScore) * 100)
      : 0;
    
    return {
      toolId,
      score: totalScore,
      matchPercentage,
      matchReasons
    };
  });
  
  // Sort by score descending
  return matches.sort((a, b) => b.score - a.score);
};

// Get top 3 tool recommendations
export const getTopToolRecommendations = (answers: SpecialtyQuizAnswers): ToolMatch[] => {
  const matches = calculateToolMatches(answers);
  return matches.slice(0, 3);
};
