import { useMemo } from 'react';
import { Check, AlertTriangle, DollarSign, Flame, X } from 'lucide-react';
import { generateDecisionFramework, type DecisionItem } from '@/lib/performanceProfileService';
import { cn } from '@/lib/utils';

interface DecisionFrameworkProps {
  ease_of_printing_score: number | null;
  printability_index: number | null;
  strength_index: number | null;
  value_score: number | null;
  material: string | null;
}

const iconMap = {
  check: Check,
  warning: AlertTriangle,
  dollar: DollarSign,
  fire: Flame,
  x: X
};

const fitColors = {
  excellent: 'text-green-400',
  good: 'text-cyan-400',
  consider: 'text-amber-400',
  poor: 'text-red-400'
};

const fitBg = {
  excellent: 'bg-green-500/10 border-green-500/20',
  good: 'bg-cyan-500/10 border-cyan-500/20',
  consider: 'bg-amber-500/10 border-amber-500/20',
  poor: 'bg-red-500/10 border-red-500/20'
};

export function DecisionFramework({
  ease_of_printing_score,
  printability_index,
  strength_index,
  value_score,
  material
}: DecisionFrameworkProps) {
  const items = useMemo(() => {
    const scores = {
      ease_of_printing_score,
      printability_index,
      strength_index,
      value_score,
      material
    };
    
    return generateDecisionFramework(scores);
  }, [ease_of_printing_score, printability_index, strength_index, value_score, material]);

  return (
    <div className="space-y-3">
      <h4 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
        Does this match your priorities?
      </h4>
      
      <div className="grid gap-2">
        {items.map((item, index) => {
          const Icon = iconMap[item.icon];
          
          return (
            <div 
              key={index}
              className={cn(
                "flex items-center gap-3 p-3 rounded-lg border transition-colors",
                fitBg[item.fit]
              )}
            >
              <Icon className={cn("w-5 h-5 flex-shrink-0", fitColors[item.fit])} />
              
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-sm text-foreground/80">
                    If you prioritize <span className="font-medium text-foreground">{item.priority}</span>
                  </span>
                  <span className="text-muted-foreground">→</span>
                  <span className={cn("text-sm font-medium", fitColors[item.fit])}>
                    {item.label}
                  </span>
                </div>
                
                {item.suggestion && (
                  <p className="text-xs text-muted-foreground mt-1">
                    Alternative: {item.suggestion}
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
