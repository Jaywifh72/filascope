// CAD Quiz Scoring Service

import { 
  CADQuizAnswers, 
  CADQuizQuestion, 
  CADSoftwareProfile,
  cadQuizQuestions,
  cadSoftwareProfiles 
} from './cadQuizData';

export interface CADMatchResult {
  softwareId: string;
  softwareName: string;
  matchScore: number;
  matchReasons: string[];
  considerations: string[];
}

// Factor weights for scoring
const factorWeights: Record<string, number> = {
  beginner: 1.5, intermediate: 1.5, advanced: 1.5,
  free: 1.3, freemium: 1.3, paid: 1.3,
  windows: 1.4, mac: 1.4, linux: 1.4, mobile: 1.4, browser: 1.4,
  parametric: 1.2, sculpting: 1.2, mesh: 1.2, cad: 1.2,
  ease: 1.1, quickStart: 1.1
};

// Match reasons for high scores
const matchReasons: Record<string, string> = {
  beginner: 'Perfect for beginners - intuitive learning curve',
  intermediate: 'Great balance of power and accessibility',
  advanced: 'Professional-grade capabilities',
  parametric: 'Excellent parametric/CAD modeling',
  sculpting: 'Powerful sculpting and organic modeling',
  mesh: 'Strong polygon/mesh editing tools',
  free: 'Completely free to use',
  freemium: 'Generous free tier available',
  ease: 'Known for user-friendly interface',
  community: 'Large, helpful community',
  printing: 'Optimized for 3D printing workflow',
  quickStart: 'Quick to learn and start creating',
  industry: 'Industry-standard tool',
  arch: 'Great for architectural work',
  animation: 'Excellent animation capabilities',
  surface: 'Superior surface modeling tools',
  features: 'Feature-rich professional toolset',
  precision: 'High precision for technical work',
  speed: 'Fast and efficient workflow',
  learning: 'Great for learning 3D fundamentals',
  cad: 'Strong CAD/engineering focus',
  windows: 'Excellent Windows support',
  mac: 'Excellent Mac support',
  linux: 'Runs on Linux',
  mobile: 'Available on mobile/tablet',
  browser: 'Runs in browser - no install needed'
};

// Consideration messages for low scores
const considerations: Record<string, string> = {
  beginner: 'May have a steeper learning curve',
  ease: 'Interface can be complex initially',
  free: 'Requires purchase or subscription',
  quickStart: 'Requires time investment to learn',
  community: 'Smaller community, fewer tutorials',
  windows: 'Not available on Windows',
  mac: 'Not available on Mac',
  linux: 'Not available on Linux',
  mobile: 'No mobile/tablet version',
  browser: 'Requires desktop installation'
};

function getFactorWeight(factor: string): number {
  return factorWeights[factor] || 1.0;
}

function getMatchReason(factor: string): string {
  return matchReasons[factor] || '';
}

function getConsideration(factor: string): string {
  return considerations[factor] || '';
}

export function calculateCADMatchScores(
  answers: CADQuizAnswers,
  questions: CADQuizQuestion[] = cadQuizQuestions,
  softwareProfiles: CADSoftwareProfile[] = cadSoftwareProfiles
): CADMatchResult[] {
  
  // Build user preference profile from answers
  const userProfile: Record<string, number> = {};
  
  questions.forEach(question => {
    const answer = answers[question.id];
    
    if (Array.isArray(answer)) {
      // Multi-select question
      answer.forEach(selectedId => {
        const option = question.options.find(o => o.id === selectedId);
        if (option?.scores) {
          Object.entries(option.scores).forEach(([key, value]) => {
            userProfile[key] = (userProfile[key] || 0) + value;
          });
        }
      });
    } else if (typeof answer === 'string') {
      // Single-select question
      const option = question.options.find(o => o.id === answer);
      if (option?.scores) {
        Object.entries(option.scores).forEach(([key, value]) => {
          userProfile[key] = (userProfile[key] || 0) + value;
        });
      }
    }
  });
  
  // Normalize user profile (0-10 scale)
  const maxUserScore = Math.max(...Object.values(userProfile), 1);
  Object.keys(userProfile).forEach(key => {
    userProfile[key] = (userProfile[key] / maxUserScore) * 10;
  });
  
  // Calculate match score for each software
  const results: CADMatchResult[] = softwareProfiles.map(software => {
    let totalScore = 0;
    let maxPossibleScore = 0;
    const reasons: string[] = [];
    const cons: string[] = [];
    
    Object.entries(userProfile).forEach(([key, userValue]) => {
      const softwareValue = software.scores[key as keyof typeof software.scores] || 0;
      const weight = getFactorWeight(key);
      
      totalScore += (userValue * softwareValue * weight) / 10;
      maxPossibleScore += userValue * 10 * weight / 10;
      
      // High match - add reason
      if (userValue >= 6 && softwareValue >= 8) {
        const reason = getMatchReason(key);
        if (reason && !reasons.includes(reason)) {
          reasons.push(reason);
        }
      }
      
      // Low match on important factor - add consideration
      if (userValue >= 6 && softwareValue <= 4) {
        const con = getConsideration(key);
        if (con && !cons.includes(con)) {
          cons.push(con);
        }
      }
    });
    
    // Platform compatibility check
    const platformKeys = ['windows', 'mac', 'linux', 'mobile', 'browser'];
    const userPlatforms = platformKeys.filter(p => userProfile[p] >= 5);
    const supportedPlatforms = platformKeys.filter(
      p => software.scores[p as keyof typeof software.scores] >= 8
    );
    
    const hasPlatformMatch = userPlatforms.length === 0 || 
      userPlatforms.some(p => supportedPlatforms.includes(p));
    
    if (!hasPlatformMatch) {
      totalScore *= 0.3; // Severe penalty for no platform match
      cons.push('May not support your preferred platform');
    }
    
    const matchScore = maxPossibleScore > 0 
      ? Math.round((totalScore / maxPossibleScore) * 100)
      : 50;
    
    return {
      softwareId: software.id,
      softwareName: software.name,
      matchScore: Math.min(99, Math.max(15, matchScore)),
      matchReasons: reasons.slice(0, 4),
      considerations: cons.filter(c => c).slice(0, 2)
    };
  });
  
  return results.sort((a, b) => b.matchScore - a.matchScore);
}

// Helper to get top 3 results
export function getTopCADRecommendations(answers: CADQuizAnswers): CADMatchResult[] {
  const allResults = calculateCADMatchScores(answers);
  return allResults.slice(0, 3);
}
