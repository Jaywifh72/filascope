// Score confidence calculation based on available data

export type ConfidenceLevel = 'high' | 'medium' | 'low' | 'preliminary';

export interface ConfidenceData {
  level: ConfidenceLevel;
  percentage: number;
  dataPoints: number;
  communityReviews: number;
  label: string;
  description: string;
  lastUpdated: Date | null;
  factors: ConfidenceFactor[];
}

export interface ConfidenceFactor {
  name: string;
  status: 'good' | 'warning' | 'missing';
  detail: string;
}

interface ConfidenceInput {
  // Score data availability
  hasEaseScore: boolean;
  hasStrengthScore: boolean;
  hasValueScore: boolean;
  
  // Technical data availability
  hasTensileStrength: boolean;
  hasFlexuralStrength: boolean;
  hasTDS: boolean;
  
  // Community data
  communityReviewCount: number;
  
  // Product age
  createdAt: Date | null;
  updatedAt: Date | null;
}

export function calculateConfidence(input: ConfidenceInput): ConfidenceData {
  const factors: ConfidenceFactor[] = [];
  let score = 0;
  let maxScore = 0;

  // Score availability (30 points max)
  maxScore += 30;
  let scorePoints = 0;
  if (input.hasEaseScore) scorePoints += 10;
  if (input.hasStrengthScore) scorePoints += 10;
  if (input.hasValueScore) scorePoints += 10;
  score += scorePoints;

  if (scorePoints === 30) {
    factors.push({ name: 'All scores available', status: 'good', detail: '3/3 score types' });
  } else if (scorePoints >= 20) {
    factors.push({ name: 'Most scores available', status: 'warning', detail: `${scorePoints / 10}/3 score types` });
  } else {
    factors.push({ name: 'Limited scores', status: 'missing', detail: `${scorePoints / 10}/3 score types` });
  }

  // Technical data (30 points max)
  maxScore += 30;
  let techPoints = 0;
  if (input.hasTensileStrength) techPoints += 10;
  if (input.hasFlexuralStrength) techPoints += 10;
  if (input.hasTDS) techPoints += 10;
  score += techPoints;

  if (techPoints >= 20) {
    factors.push({ name: 'Lab-tested data', status: 'good', detail: 'Technical specifications verified' });
  } else if (techPoints >= 10) {
    factors.push({ name: 'Partial lab data', status: 'warning', detail: 'Some specifications available' });
  } else {
    factors.push({ name: 'No lab data', status: 'missing', detail: 'Based on manufacturer claims' });
  }

  // Community reviews (25 points max)
  maxScore += 25;
  const reviewCount = input.communityReviewCount;
  let reviewPoints = 0;
  if (reviewCount >= 50) reviewPoints = 25;
  else if (reviewCount >= 20) reviewPoints = 20;
  else if (reviewCount >= 10) reviewPoints = 15;
  else if (reviewCount >= 5) reviewPoints = 10;
  else if (reviewCount > 0) reviewPoints = 5;
  score += reviewPoints;

  if (reviewCount >= 20) {
    factors.push({ name: 'Community validated', status: 'good', detail: `${reviewCount} reviews` });
  } else if (reviewCount >= 5) {
    factors.push({ name: 'Some community feedback', status: 'warning', detail: `${reviewCount} reviews` });
  } else {
    factors.push({ name: 'No community reviews', status: 'missing', detail: 'Be the first to review' });
  }

  // Data freshness (15 points max)
  maxScore += 15;
  const updatedAt = input.updatedAt || input.createdAt;
  const daysSinceUpdate = updatedAt 
    ? Math.floor((Date.now() - new Date(updatedAt).getTime()) / (1000 * 60 * 60 * 24))
    : 999;
  
  let freshnessPoints = 0;
  if (daysSinceUpdate <= 30) freshnessPoints = 15;
  else if (daysSinceUpdate <= 90) freshnessPoints = 12;
  else if (daysSinceUpdate <= 180) freshnessPoints = 8;
  else if (daysSinceUpdate <= 365) freshnessPoints = 4;
  score += freshnessPoints;

  if (daysSinceUpdate <= 30) {
    factors.push({ name: 'Recently updated', status: 'good', detail: 'Within last 30 days' });
  } else if (daysSinceUpdate <= 180) {
    factors.push({ name: 'Data aging', status: 'warning', detail: `Updated ${daysSinceUpdate} days ago` });
  } else {
    factors.push({ name: 'Stale data', status: 'missing', detail: 'May need refresh' });
  }

  // Calculate percentage and level
  const percentage = Math.round((score / maxScore) * 100);
  
  let level: ConfidenceLevel;
  let label: string;
  let description: string;

  if (percentage >= 85) {
    level = 'high';
    label = 'High Confidence';
    description = 'Comprehensive data from multiple sources';
  } else if (percentage >= 65) {
    level = 'medium';
    label = 'Good Confidence';
    description = 'Solid data with some gaps';
  } else if (percentage >= 40) {
    level = 'low';
    label = 'Limited Data';
    description = 'Scores based on available information';
  } else {
    level = 'preliminary';
    label = 'Preliminary Score';
    description = 'Early estimate, more data needed';
  }

  // Calculate data points (rough estimate)
  const dataPoints = 
    (input.hasEaseScore ? 1 : 0) +
    (input.hasStrengthScore ? 1 : 0) +
    (input.hasValueScore ? 1 : 0) +
    (input.hasTensileStrength ? 3 : 0) +
    (input.hasFlexuralStrength ? 3 : 0) +
    (input.hasTDS ? 5 : 0);

  return {
    level,
    percentage,
    dataPoints,
    communityReviews: reviewCount,
    label,
    description,
    lastUpdated: updatedAt,
    factors,
  };
}

export function getConfidenceColor(level: ConfidenceLevel): string {
  switch (level) {
    case 'high':
      return 'text-green-400';
    case 'medium':
      return 'text-cyan-400';
    case 'low':
      return 'text-amber-400';
    case 'preliminary':
      return 'text-orange-400';
  }
}

export function getConfidenceBgColor(level: ConfidenceLevel): string {
  switch (level) {
    case 'high':
      return 'bg-green-500/10';
    case 'medium':
      return 'bg-cyan-500/10';
    case 'low':
      return 'bg-amber-500/10';
    case 'preliminary':
      return 'bg-orange-500/10';
  }
}
