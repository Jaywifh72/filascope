import { checkPrinterFilamentCompatibility } from './printerCompatibility';

export interface MatchScore {
  percent: number;
  label: string;
  isCompatible: boolean;
}

export function getMatchScore(printer: any, filament: any): MatchScore {
  const result = checkPrinterFilamentCompatibility(printer, filament);

  if (!result.is_supported) {
    return { percent: 0, label: 'Not compatible', isCompatible: false };
  }

  const easeMap: Record<string, number> = {
    'Easy': 95,
    'Medium': 80,
    'Hard': 60,
    'Not Possible': 0,
  };

  let score = easeMap[result.ease_rating] ?? 70;
  const deductPerLimitation = 5;
  score -= Math.min(result.limitations.length * deductPerLimitation, 30);
  score = Math.max(0, Math.min(100, score));

  return {
    percent: score,
    label: score >= 50 ? `${score}% match` : 'Not compatible',
    isCompatible: score >= 50,
  };
}
