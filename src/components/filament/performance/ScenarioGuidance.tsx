import { useMemo } from 'react';
import { Target, AlertTriangle } from 'lucide-react';
import { generateScenarioGuidance } from '@/lib/performanceProfileService';

interface ScenarioGuidanceProps {
  ease_of_printing_score: number | null;
  printability_index: number | null;
  strength_index: number | null;
  value_score: number | null;
  material: string | null;
}

export function ScenarioGuidance({
  ease_of_printing_score,
  printability_index,
  strength_index,
  value_score,
  material
}: ScenarioGuidanceProps) {
  const guidance = useMemo(() => {
    const scores = {
      ease_of_printing_score,
      printability_index,
      strength_index,
      value_score,
      material
    };
    
    return generateScenarioGuidance(scores);
  }, [ease_of_printing_score, printability_index, strength_index, value_score, material]);

  return (
    <div className="grid sm:grid-cols-2 gap-4">
      {/* Use This If */}
      <div className="bg-green-500/5 border border-green-500/20 rounded-xl p-4">
        <div className="flex items-center gap-2 mb-3">
          <Target className="w-5 h-5 text-green-400" />
          <h4 className="font-semibold text-green-400">Use This If:</h4>
        </div>
        
        <ul className="space-y-2">
          {guidance.useIf.map((item, index) => (
            <li 
              key={index}
              className="flex items-start gap-2 text-sm text-foreground/80"
            >
              <span className="text-green-400 mt-0.5">•</span>
              <span>{item}</span>
            </li>
          ))}
        </ul>
      </div>
      
      {/* Consider Alternatives If */}
      <div className="bg-amber-500/5 border border-amber-500/20 rounded-xl p-4">
        <div className="flex items-center gap-2 mb-3">
          <AlertTriangle className="w-5 h-5 text-amber-400" />
          <h4 className="font-semibold text-amber-400">Consider Alternatives If:</h4>
        </div>
        
        <ul className="space-y-2">
          {guidance.alternativeIf.map((item, index) => (
            <li 
              key={index}
              className="flex items-start gap-2 text-sm text-foreground/80"
            >
              <span className="text-amber-400 mt-0.5">•</span>
              <span>{item}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
